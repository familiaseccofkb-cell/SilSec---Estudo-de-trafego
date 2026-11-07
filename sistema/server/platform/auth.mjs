// Login próprio do sistema: contas com e-mail e senha, confirmação por e-mail, sessões por cookie e recuperação de senha.
// A identidade autenticada é entregue à API pelos mesmos cabeçalhos internos usados na versão anterior,
// que são sempre removidos das requisições externas (ver server.mjs).
import {randomBytes, scrypt as scryptCb, timingSafeEqual, createHash, randomUUID} from 'node:crypto';
import {promisify} from 'node:util';
import {BRAND} from '../../public/brand.js';
import {loginPage, signupPage, forgotPage, resetPage, accountPage, infoPage, esc} from './auth-pages.mjs';

const scrypt = promisify(scryptCb);
export const SESSION_COOKIE = 'silsec_sessao';
const VERIFY_HOURS = 48, RESET_HOURS = 1, MAX_FAILS = 8, LOCK_MINUTES = 15, MIN_PASSWORD = 10;
const now = () => new Date().toISOString();
const later = ms => new Date(Date.now() + ms).toISOString();
const sha256 = v => createHash('sha256').update(v).digest('hex');
const newToken = () => randomBytes(32).toString('hex');
const validEmail = e => typeof e === 'string' && e.length <= 254 && /^[^\s@<>()",;:]+@[^\s@<>()",;:]+\.[^\s@<>()",;:]+$/.test(e);

export async function hashPassword(password) {
  const salt = randomBytes(16), N = 16384, r = 8, p = 1;
  const key = await scrypt(password.normalize('NFKC'), salt, 64, {N, r, p, maxmem: 64 * 1024 * 1024});
  return `scrypt$${N}$${r}$${p}$${salt.toString('base64')}$${key.toString('base64')}`;
}
export async function verifyPassword(password, stored) {
  const [alg, N, r, p, salt, hash] = String(stored || '').split('$');
  if (alg !== 'scrypt' || !hash) return false;
  const expected = Buffer.from(hash, 'base64');
  const key = await scrypt(String(password).normalize('NFKC'), Buffer.from(salt, 'base64'), expected.length, {N: +N, r: +r, p: +p, maxmem: 64 * 1024 * 1024});
  return key.length === expected.length && timingSafeEqual(key, expected);
}
const DUMMY_HASH = 'scrypt$16384$8$1$AAAAAAAAAAAAAAAAAAAAAA==$' + Buffer.alloc(64).toString('base64');

export const APP_HOME = '/sistema';
export function safeNext(value) {
  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//') || value.startsWith('/\\')) return APP_HOME;
  try {
    const u = new URL(value, 'https://app.local');
    if (u.origin !== 'https://app.local') return APP_HOME;
    if (['/entrar', '/sair', '/cadastrar', '/verificar', '/esqueci-senha', '/redefinir-senha'].includes(u.pathname)) return APP_HOME;
    return u.pathname + u.search + u.hash;
  } catch { return APP_HOME; }
}

function parseCookies(header) {
  const out = {};
  for (const part of String(header || '').split(';')) { const i = part.indexOf('='); if (i > 0) out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim()); }
  return out;
}

// Limite simples por IP em memória (o processo pode ser reiniciado pela hospedagem; serve como freio, não como cofre).
function rateLimiter(limit, windowMs) {
  const hits = new Map();
  return key => {
    const t = Date.now(), list = (hits.get(key) || []).filter(x => t - x < windowMs);
    list.push(t); hits.set(key, list);
    if (hits.size > 5000) for (const [k, v] of hits) if (!v.some(x => t - x < windowMs)) hits.delete(k);
    return list.length <= limit;
  };
}

export function createAuth({db, config, mailer, log = console}) {
  const q = (sql, ...a) => db.prepare(sql).bind(...a);
  const limiter = rateLimiter(20, 10 * 60 * 1000);
  const html = (body, status = 200, extra = {}) => new Response(body, {status, headers: {'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow', ...extra}});
  const redirect = (location, extra = {}) => new Response(null, {status: 303, headers: {Location: location, 'Cache-Control': 'no-store', ...extra}});
  const baseUrl = request => config.appUrl || new URL(request.url).origin;
  const signupAllowedMode = config.auth.signup;

  function cookie(request, value, maxAgeSeconds) {
    const secure = new URL(request.url).protocol === 'https:' ? '; Secure' : '';
    return `${SESSION_COOKIE}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAgeSeconds}${secure}`;
  }

  async function createSession(request, userId) {
    const token = newToken(), ip = request.headers.get('x-silsec-client-ip') || '';
    await q('INSERT INTO auth_sessions (token_hash,user_id,created_at,expires_at,last_seen_at,ip,user_agent) VALUES (?,?,?,?,?,?,?)',
      sha256(token), userId, now(), later(config.auth.sessionDays * 864e5), now(), ip.slice(0, 64), (request.headers.get('user-agent') || '').slice(0, 255)).run();
    return cookie(request, token, config.auth.sessionDays * 86400);
  }

  // Modo computador: o usuário local entra direto, somente em conexões da própria máquina.
  let localUser = null;
  async function desktopUser(request) {
    const ip = request.headers.get('x-silsec-client-ip') || '';
    if (ip && !/^(127\.|::1$|::ffff:127\.)/.test(ip)) return null;
    if (!localUser) {
      const email = config.ownerEmail || 'local@silsec.desktop';
      let row = await q('SELECT id,email,name FROM auth_users WHERE email = ?', email).first();
      if (!row) { await upsertVerifiedUser(db, {email, name: 'Usuário local', password: randomBytes(24).toString('hex')}); row = await q('SELECT id,email,name FROM auth_users WHERE email = ?', email).first(); }
      localUser = {id: row.id, email: row.email, name: row.name, sessionHash: 'desktop'};
    }
    return localUser;
  }
  async function sessionUser(request) {
    if (config.desktop) return desktopUser(request);
    const token = parseCookies(request.headers.get('cookie'))[SESSION_COOKIE];
    if (!token || !/^[a-f0-9]{64}$/.test(token)) return null;
    const hash = sha256(token);
    const row = await q('SELECT s.token_hash,s.expires_at,s.last_seen_at,u.id,u.email,u.name,u.email_verified_at FROM auth_sessions s JOIN auth_users u ON u.id = s.user_id WHERE s.token_hash = ?', hash).first();
    if (!row || row.expires_at <= now() || !row.email_verified_at) return null;
    if (Date.now() - Date.parse(row.last_seen_at) > 3600e3) await q('UPDATE auth_sessions SET last_seen_at = ? WHERE token_hash = ?', now(), hash).run();
    return {id: row.id, email: row.email, name: row.name, sessionHash: hash};
  }

  async function signupAllowed(email) {
    if (signupAllowedMode === 'aberto') return true;
    if (signupAllowedMode === 'fechado') return email === config.ownerEmail;
    if (email === config.ownerEmail) return true;
    if (await q('SELECT id FROM members WHERE email = ? AND active = 1', email).first()) return true;
    return !!await q('SELECT id FROM silsec_invitations WHERE email = ? AND revoked = 0 AND expires_at > ?', email, now()).first();
  }

  async function issueToken(userId, kind, hours) {
    const token = newToken();
    await q('INSERT INTO auth_tokens (token_hash,user_id,kind,expires_at,created_at) VALUES (?,?,?,?,?)', sha256(token), userId, kind, later(hours * 3600e3), now()).run();
    return token;
  }
  async function consumeToken(token, kind) {
    if (!/^[a-f0-9]{64}$/.test(token || '')) return null;
    const hash = sha256(token), row = await q('SELECT * FROM auth_tokens WHERE token_hash = ? AND kind = ?', hash, kind).first();
    if (!row || row.used_at || row.expires_at <= now()) return null;
    const r = await q('UPDATE auth_tokens SET used_at = ? WHERE token_hash = ? AND used_at IS NULL', now(), hash).run();
    return r.meta.changes === 1 ? row.user_id : null;
  }
  async function peekToken(token, kind) {
    if (!/^[a-f0-9]{64}$/.test(token || '')) return null;
    const row = await q('SELECT * FROM auth_tokens WHERE token_hash = ? AND kind = ?', sha256(token), kind).first();
    return row && !row.used_at && row.expires_at > now() ? row : null;
  }

  async function sendVerification(request, user, next) {
    const token = await issueToken(user.id, 'verify', VERIFY_HOURS);
    const link = `${baseUrl(request)}/verificar?token=${token}&volta=${encodeURIComponent(next || APP_HOME)}`;
    await mailer.send({to: user.email, subject: `Confirme seu e-mail · ${BRAND.name}`,
      text: `Olá, ${user.name}.\n\nPara confirmar seu e-mail e criar sua senha no sistema de estudos de tráfego da ${BRAND.name}, abra o link abaixo (válido por ${VERIFY_HOURS} horas):\n${link}\n\nSe você não pediu esta conta, ignore esta mensagem.\n\n—\n${BRAND.name}\n${BRAND.phone} · ${BRAND.email}`,
      html: `<p>Olá, ${esc(user.name)}.</p><p>Para confirmar seu e-mail e criar sua senha no sistema de estudos de tráfego da ${esc(BRAND.name)}, clique no link abaixo (válido por ${VERIFY_HOURS} horas):</p><p><a href="${esc(link)}">Confirmar e criar senha</a></p><p>Se você não pediu esta conta, ignore esta mensagem.</p><p style="color:#627780;font-size:13px">—<br>${esc(BRAND.name)}<br>${esc(BRAND.phone)} · ${esc(BRAND.email)}</p>`});
  }
  async function sendReset(request, user) {
    const token = await issueToken(user.id, 'reset', RESET_HOURS);
    const link = `${baseUrl(request)}/redefinir-senha?token=${token}`;
    await mailer.send({to: user.email, subject: `Recuperação de senha · ${BRAND.name}`,
      text: `Olá, ${user.name}.\n\nPara criar uma nova senha, abra o link abaixo (válido por ${RESET_HOURS} hora):\n${link}\n\nSe você não pediu a recuperação, ignore esta mensagem; sua senha atual continua valendo.\n\n—\n${BRAND.name}\n${BRAND.phone} · ${BRAND.email}`,
      html: `<p>Olá, ${esc(user.name)}.</p><p>Para criar uma nova senha, clique no link abaixo (válido por ${RESET_HOURS} hora):</p><p><a href="${esc(link)}">Criar nova senha</a></p><p>Se você não pediu a recuperação, ignore esta mensagem.</p><p style="color:#627780;font-size:13px">—<br>${esc(BRAND.name)}<br>${esc(BRAND.phone)} · ${esc(BRAND.email)}</p>`});
  }

  async function form(request) {
    const raw = await request.text();
    if (raw.length > 20000) return new URLSearchParams();
    return new URLSearchParams(raw);
  }
  function sameOrigin(request) {
    const origin = request.headers.get('origin'), expected = new URL(request.url).origin;
    if (origin && origin !== 'null' && origin !== expected) return false;
    if (request.headers.get('sec-fetch-site') === 'cross-site') return false;
    return true;
  }
  const mailNote = () => mailer.configured ? '' : ' (Envio de e-mail não configurado: o administrador encontra o link no log do servidor.)';

  async function handle(request) {
    const url = new URL(request.url), path = url.pathname, method = request.method;
    const routes = ['/entrar', '/cadastrar', '/verificar', '/esqueci-senha', '/redefinir-senha', '/sair', '/conta', '/signin-with-chatgpt', '/signout-with-chatgpt'];
    if (config.desktop && routes.includes(new URL(request.url).pathname)) return new Response(null, {status: 303, headers: {Location: APP_HOME, 'Cache-Control': 'no-store'}});
    if (!routes.includes(path)) return null;
    if (path === '/signin-with-chatgpt') return redirect('/entrar?volta=' + encodeURIComponent(safeNext(url.searchParams.get('return_to') || APP_HOME)));
    if (path === '/signout-with-chatgpt') return redirect('/sair');
    if (!['GET', 'HEAD', 'POST'].includes(method)) return new Response('Método não permitido', {status: 405});
    if (method === 'POST') {
      if (!sameOrigin(request)) return html(infoPage({title: 'Erro', heading: 'Solicitação recusada', text: 'Origem da solicitação não autorizada.', kind: 'erro'}), 403);
      const ip = request.headers.get('x-silsec-client-ip') || 'local';
      if (!limiter(ip + ':' + path)) return html(infoPage({title: 'Aguarde', heading: 'Muitas tentativas', text: 'Aguarde alguns minutos antes de tentar novamente.', kind: 'erro', link: path, linkText: 'Voltar'}), 429);
    }
    const next = safeNext(url.searchParams.get('volta') || APP_HOME);

    if (path === '/sair') {
      const current = await sessionUser(request);
      if (current) await q('DELETE FROM auth_sessions WHERE token_hash = ?', current.sessionHash).run();
      return redirect('/entrar', {'Set-Cookie': cookie(request, '', 0)});
    }

    if (path === '/entrar') {
      if (method !== 'POST') {
        if (await sessionUser(request)) return redirect(next);
        return html(loginPage({next, signup: signupAllowedMode !== 'fechado'}));
      }
      const f = await form(request), email = String(f.get('email') || '').trim().toLowerCase(), password = String(f.get('senha') || ''), back = safeNext(f.get('volta') || APP_HOME);
      const invalid = () => html(loginPage({email, next: back, signup: signupAllowedMode !== 'fechado', message: {kind: 'erro', text: 'E-mail ou senha incorretos.'}}), 401);
      const user = validEmail(email) ? await q('SELECT * FROM auth_users WHERE email = ?', email).first() : null;
      if (!user || !user.password_hash) { await verifyPassword(password, DUMMY_HASH); return invalid(); }
      if (user.locked_until && user.locked_until > now()) return html(loginPage({email, next: back, message: {kind: 'erro', text: `Conta bloqueada temporariamente após várias tentativas. Tente novamente em até ${LOCK_MINUTES} minutos ou recupere a senha.`}}), 429);
      if (!await verifyPassword(password, user.password_hash)) {
        const fails = (user.failed_logins || 0) + 1;
        await q('UPDATE auth_users SET failed_logins = ?, locked_until = ?, updated_at = ? WHERE id = ?', fails >= MAX_FAILS ? 0 : fails, fails >= MAX_FAILS ? later(LOCK_MINUTES * 60e3) : null, now(), user.id).run();
        return invalid();
      }
      if (!user.email_verified_at) return invalid();
      await q('UPDATE auth_users SET failed_logins = 0, locked_until = NULL, updated_at = ? WHERE id = ?', now(), user.id).run();
      return redirect(back, {'Set-Cookie': await createSession(request, user.id)});
    }

    if (path === '/cadastrar') {
      if (method !== 'POST') return html(signupPage({next}));
      const f = await form(request), email = String(f.get('email') || '').trim().toLowerCase(), name = String(f.get('nome') || '').trim().slice(0, 200), back = safeNext(f.get('volta') || APP_HOME);
      const again = text => html(signupPage({email, name, next: back, message: {kind: 'erro', text}}), 400);
      if (!validEmail(email)) return again('Informe um e-mail válido.');
      if (!name) return again('Informe seu nome.');
      const done = html(infoPage({title: 'Confirme seu e-mail', heading: 'Confirme seu e-mail', text: 'Se este e-mail estiver autorizado a usar o sistema, você receberá em instantes um link para confirmar o e-mail e criar sua senha. Verifique também a caixa de spam.' + mailNote()}));
      if (!await signupAllowed(email)) { log.warn('[cadastro] e-mail não autorizado: ' + email); return done; }
      const existing = await q('SELECT * FROM auth_users WHERE email = ?', email).first();
      if (existing?.email_verified_at) {
        await mailer.send({to: email, subject: `Você já tem conta · ${BRAND.name}`, text: `Recebemos um pedido de cadastro com este e-mail, mas você já tem conta. Para entrar, use ${baseUrl(request)}/entrar ou crie uma nova senha em ${baseUrl(request)}/esqueci-senha.`});
        return done;
      }
      let user = existing;
      if (!user) {
        // A senha só é definida por quem abrir o link enviado ao e-mail; antes disso a conta não tem senha.
        user = {id: randomUUID(), email, name};
        await q('INSERT INTO auth_users (id,email,name,password_hash,created_at,updated_at) VALUES (?,?,?,?,?,?)', user.id, email, name, '', now(), now()).run();
      }
      await sendVerification(request, user, back);
      return done;
    }

    if (path === '/verificar') {
      const token = method === 'POST' ? null : url.searchParams.get('token') || '';
      if (method !== 'POST') {
        const row = await peekToken(token, 'verify');
        if (!row) return html(infoPage({title: 'Link inválido', heading: 'Link inválido ou expirado', text: 'Peça um novo link em Criar conta.', kind: 'erro', link: '/cadastrar', linkText: 'Criar conta'}), 400);
        const u = await q('SELECT email FROM auth_users WHERE id = ?', row.user_id).first();
        return html(resetPage({token, action: '/verificar', next, heading: 'Crie sua senha', email: u?.email}));
      }
      const f = await form(request), posted = String(f.get('token') || ''), password = String(f.get('senha') || ''), back = safeNext(f.get('volta') || APP_HOME);
      if (password.length < MIN_PASSWORD || password.length > 200) return html(resetPage({token: posted, action: '/verificar', next: back, heading: 'Crie sua senha', message: {kind: 'erro', text: `A senha precisa ter de ${MIN_PASSWORD} a 200 caracteres.`}}), 400);
      const userId = await consumeToken(posted, 'verify');
      if (!userId) return html(infoPage({title: 'Link inválido', heading: 'Link inválido ou expirado', text: 'Peça um novo link em Criar conta.', kind: 'erro', link: '/cadastrar', linkText: 'Criar conta'}), 400);
      await q('UPDATE auth_users SET password_hash = ?, email_verified_at = COALESCE(email_verified_at, ?), failed_logins = 0, locked_until = NULL, updated_at = ? WHERE id = ?', await hashPassword(password), now(), now(), userId).run();
      await q('DELETE FROM auth_sessions WHERE user_id = ?', userId).run();
      await q("UPDATE auth_tokens SET used_at = ? WHERE user_id = ? AND used_at IS NULL", now(), userId).run();
      return redirect(back, {'Set-Cookie': await createSession(request, userId)});
    }

    if (path === '/esqueci-senha') {
      if (method !== 'POST') return html(forgotPage({}));
      const f = await form(request), email = String(f.get('email') || '').trim().toLowerCase();
      if (validEmail(email)) {
        const user = await q('SELECT * FROM auth_users WHERE email = ?', email).first();
        if (user) await sendReset(request, user);
      }
      return html(forgotPage({email, message: {kind: 'ok', text: 'Se o e-mail estiver cadastrado, enviamos um link para criar uma nova senha. O link vale por 1 hora.' + mailNote()}}));
    }

    if (path === '/redefinir-senha') {
      if (method !== 'POST') {
        const token = url.searchParams.get('token') || '';
        if (!await peekToken(token, 'reset')) return html(infoPage({title: 'Link inválido', heading: 'Link inválido ou expirado', text: 'Peça um novo link de recuperação.', kind: 'erro', link: '/esqueci-senha', linkText: 'Recuperar senha'}), 400);
        return html(resetPage({token}));
      }
      const f = await form(request), token = String(f.get('token') || ''), password = String(f.get('senha') || '');
      if (password.length < MIN_PASSWORD || password.length > 200) return html(resetPage({token, message: {kind: 'erro', text: `A senha precisa ter de ${MIN_PASSWORD} a 200 caracteres.`}}), 400);
      const userId = await consumeToken(token, 'reset');
      if (!userId) return html(infoPage({title: 'Link inválido', heading: 'Link inválido ou expirado', text: 'Peça um novo link de recuperação.', kind: 'erro', link: '/esqueci-senha', linkText: 'Recuperar senha'}), 400);
      await q('UPDATE auth_users SET password_hash = ?, email_verified_at = COALESCE(email_verified_at, ?), failed_logins = 0, locked_until = NULL, updated_at = ? WHERE id = ?', await hashPassword(password), now(), now(), userId).run();
      await q('DELETE FROM auth_sessions WHERE user_id = ?', userId).run();
      await q("UPDATE auth_tokens SET used_at = ? WHERE user_id = ? AND used_at IS NULL", now(), userId).run();
      return redirect(APP_HOME, {'Set-Cookie': await createSession(request, userId)});
    }

    if (path === '/conta') {
      const current = await sessionUser(request);
      if (!current) return redirect('/entrar?volta=%2Fconta');
      if (method !== 'POST') return html(accountPage({user: current}));
      const f = await form(request), old = String(f.get('senha_atual') || ''), password = String(f.get('senha') || '');
      const row = await q('SELECT password_hash FROM auth_users WHERE id = ?', current.id).first();
      if (!await verifyPassword(old, row.password_hash)) return html(accountPage({user: current, message: {kind: 'erro', text: 'Senha atual incorreta.'}}), 400);
      if (password.length < MIN_PASSWORD || password.length > 200) return html(accountPage({user: current, message: {kind: 'erro', text: `A nova senha precisa ter de ${MIN_PASSWORD} a 200 caracteres.`}}), 400);
      await q('UPDATE auth_users SET password_hash = ?, updated_at = ? WHERE id = ?', await hashPassword(password), now(), current.id).run();
      await q('DELETE FROM auth_sessions WHERE user_id = ? AND token_hash <> ?', current.id, current.sessionHash).run();
      return html(accountPage({user: current, message: {kind: 'ok', text: 'Senha alterada. As sessões em outros aparelhos foram encerradas.'}}));
    }
    return null;
  }

  async function cleanup() {
    await q('DELETE FROM auth_sessions WHERE expires_at <= ?', now()).run();
    await q('DELETE FROM auth_tokens WHERE expires_at <= ?', later(-7 * 864e5)).run();
  }

  // Envia o link para a pessoa criar a senha (conta nova) ou avisa que já existe conta.
  // Com reset: true (console do desenvolvedor), conta já confirmada recebe o link de nova senha.
  async function sendPasswordLink(request, {email, name, next = APP_HOME, reset = false}) {
    email = String(email).trim().toLowerCase();
    const existing = await q('SELECT * FROM auth_users WHERE email = ?', email).first();
    if (existing?.email_verified_at) { if (reset) await sendReset(request, existing); return {existing: true}; }
    let user = existing;
    if (!user) {
      user = {id: randomUUID(), email, name: name || email};
      await q('INSERT INTO auth_users (id,email,name,password_hash,created_at,updated_at) VALUES (?,?,?,?,?,?)', user.id, email, user.name, '', now(), now()).run();
    }
    await sendVerification(request, user, next);
    return {existing: false};
  }

  return {handle, sessionUser, cleanup, sendPasswordLink, sameOrigin, baseUrl, mailConfigured: () => mailer.configured};
}

// Cria ou redefine uma conta já confirmada (uso administrativo pelo terminal).
export async function upsertVerifiedUser(db, {email, name, password}) {
  email = String(email).trim().toLowerCase();
  if (!validEmail(email)) throw new Error('E-mail inválido.');
  if (String(password).length < MIN_PASSWORD) throw new Error(`A senha precisa ter pelo menos ${MIN_PASSWORD} caracteres.`);
  const hash = await hashPassword(password), t = now();
  const existing = await db.prepare('SELECT id FROM auth_users WHERE email = ?').bind(email).first();
  if (existing) {
    await db.prepare('UPDATE auth_users SET password_hash = ?, name = ?, email_verified_at = COALESCE(email_verified_at, ?), failed_logins = 0, locked_until = NULL, updated_at = ? WHERE id = ?').bind(hash, name || email, t, t, existing.id).run();
    return {id: existing.id, created: false};
  }
  const id = randomUUID();
  await db.prepare('INSERT INTO auth_users (id,email,name,password_hash,email_verified_at,created_at,updated_at) VALUES (?,?,?,?,?,?,?)').bind(id, email, name || email, hash, t, t, t).run();
  return {id, created: true};
}
