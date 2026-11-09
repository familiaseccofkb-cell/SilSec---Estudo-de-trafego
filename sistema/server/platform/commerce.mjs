// Site, chaves de acesso de clientes, assinatura anual (Mercado Pago), painel do administrador e contato.
import {randomBytes, createHash, createHmac, randomUUID, timingSafeEqual} from 'node:crypto';
import {BRAND} from '../../public/brand.js';
import {resolveLicenses, addCalendarMonths} from '../../public/licensing.js';
import {homePage, servicesPage, modulesPage, quotePage, consolePage, notice, esc, fmtDate, fmtDateTime, brl, perMonth} from '../site/pages.mjs';
import {APP_HOME} from './auth.mjs';

const now = () => new Date().toISOString();
const sha256 = v => createHash('sha256').update(v).digest('hex');
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // 32 símbolos, sem 0/O/1/I
const validEmail = e => typeof e === 'string' && e.length <= 254 && /^[^\s@<>()",;:]+@[^\s@<>()",;:]+\.[^\s@<>()",;:]+$/.test(e);
const MODULE_NAMES = {basic: 'Básico', advanced: 'Completo'};
const SOURCE_NAMES = {trial: 'teste de 30 dias', mercadopago: 'anuidade paga', concession: 'concessão', key: 'chave', education: 'educacional', 'demo-purchase': 'demonstração'};

export function newAccessCode() {
  const bytes = randomBytes(12);
  let s = '';
  for (const b of bytes) s += ALPHABET[b % 32];
  return `FSC-${s.slice(0, 4)}-${s.slice(4, 8)}-${s.slice(8, 12)}`;
}
export function normalizeCode(value) {
  let s = String(value || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (s.startsWith('FSC') && s.length === 15) s = s.slice(3);
  return /^[A-HJ-NP-Z2-9]{12}$/.test(s) ? s : null;
}
const codeHash = norm => sha256('fsc-access-key:v1:' + norm);
export const maskEmail = e => { const [u, d] = String(e).split('@'); return (u.length <= 2 ? u[0] + '*' : u.slice(0, 2) + '***') + '@' + d; };

function rateLimiter(limit, windowMs) {
  const hits = new Map();
  return key => {
    const t = Date.now(), list = (hits.get(key) || []).filter(x => t - x < windowMs);
    list.push(t); hits.set(key, list);
    if (hits.size > 5000) for (const [k, v] of hits) if (!v.some(x => t - x < windowMs)) hits.delete(k);
    return list.length <= limit;
  };
}

// Verificação da assinatura do webhook do Mercado Pago (cabeçalho x-signature: "ts=...,v1=...").
export function verifyMercadoPagoSignature({secret, signature, requestId, dataId}) {
  if (!secret) return true;
  if (!signature) return false;
  const parts = Object.fromEntries(String(signature).split(',').map(p => p.split('=').map(s => s.trim())).filter(p => p.length === 2));
  if (!parts.ts || !parts.v1) return false;
  let manifest = '';
  if (dataId) manifest += `id:${/^[a-z0-9]+$/i.test(dataId) ? String(dataId).toLowerCase() : dataId};`;
  if (requestId) manifest += `request-id:${requestId};`;
  manifest += `ts:${parts.ts};`;
  const expected = Buffer.from(createHmac('sha256', secret).update(manifest).digest('hex'));
  const got = Buffer.from(parts.v1);
  return expected.length === got.length && timingSafeEqual(expected, got);
}

export function createCommerce({db, config, mailer, auth, log = console, fetcher = fetch}) {
  const q = (sql, ...a) => db.prepare(sql).bind(...a);
  const plans = config.plans;
  const mp = config.mercadoPago || {};
  const contactLimiter = rateLimiter(5, 10 * 60e3), keyLimiter = rateLimiter(15, 10 * 60e3), payLimiter = rateLimiter(10, 10 * 60e3);
  const html = (body, status = 200, extra = {}) => new Response(body, {status, headers: {'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow', ...extra}});
  const redirect = (location, status = 303) => new Response(null, {status, headers: {Location: location, 'Cache-Control': 'no-store'}});
  const ipOf = request => request.headers.get('x-silsec-client-ip') || 'local';
  const form = async request => { const raw = await request.text(); return new URLSearchParams(raw.length > 50000 ? '' : raw); };
  const mpReady = () => !!mp.accessToken;

  async function memberFor(session) {
    if (!session) return null;
    return await q('SELECT * FROM members WHERE site_user_id = ?', session.id).first()
      || await q('SELECT * FROM members WHERE email = ?', session.email).first();
  }
  async function entitlements(member) {
    const grants = (await q('SELECT * FROM module_grants WHERE member_id = ?', member.id).all()).results;
    return {grants, ent: resolveLicenses(member, grants)};
  }

  // ---------- Contato ----------
  async function contact(request) {
    const f = await form(request);
    const back = f.get('origem') === 'orcamento' ? flag => '/orcamento?contato=' + flag : flag => '/?contato=' + flag + '#contato';
    if (!auth.sameOrigin(request)) return redirect(back('erro'));
    if (f.get('site')) return redirect(back('enviado')); // robô preencheu o campo oculto
    if (!contactLimiter(ipOf(request))) return redirect(back('limite'));
    const name = String(f.get('nome') || '').trim().slice(0, 200), email = String(f.get('email') || '').trim().toLowerCase();
    const phone = String(f.get('telefone') || '').trim().slice(0, 40), company = String(f.get('empresa') || '').trim().slice(0, 200);
    const services = f.getAll('servicos').map(v => String(v).trim().slice(0, 80)).filter(Boolean).slice(0, 8);
    const profile = String(f.get('perfil') || '').trim().slice(0, 80), floors = String(f.get('pavimentos') || '').trim().slice(0, 6), cars = String(f.get('elevadores') || '').trim().slice(0, 6);
    const subject = (services.length ? 'Orçamento · ' + services.join(', ') : String(f.get('assunto') || '').trim()).slice(0, 80);
    const context = [profile && 'Perfil: ' + profile, floors && 'Pavimentos: ' + floors, cars && 'Elevadores: ' + cars].filter(Boolean).join(' · ');
    const message = ((context ? context + '\n\n' : '') + String(f.get('mensagem') || '').trim()).slice(0, 5000);
    if (!name || !validEmail(email) || String(f.get('mensagem') || '').trim().length < 3) return redirect(back('invalido'));
    await q('INSERT INTO contact_messages (id,name,email,phone,company,subject,message,ip,created_at) VALUES (?,?,?,?,?,?,?,?,?)', randomUUID(), name, email, phone, company, subject, message, ipOf(request).slice(0, 64), now()).run();
    await mailer.send({to: BRAND.email, replyTo: email, subject: `Contato pelo site · ${subject || 'mensagem'} · ${name}`,
      text: `Nome: ${name}\nE-mail: ${email}\nTelefone: ${phone || '—'}\nEmpresa/edifício: ${company || '—'}\nAssunto: ${subject || '—'}\n\n${message}`});
    return redirect(back('enviado'));
  }

  // ---------- Ativação da chave ----------
  async function sendKeyEmail(request, key, code) {
    const base = auth.baseUrl(request), link = `${base}/ativar?chave=${encodeURIComponent(code)}`;
    const r = await mailer.send({to: key.email, subject: `Sua chave de acesso à plataforma de estudos de tráfego · ${BRAND.name}`,
      text: `Olá, ${key.client_name}.\n\nVocê recebeu uma chave de acesso à plataforma de estudos de tráfego da ${BRAND.name}.\n\nSua chave de acesso: ${code}\n\nPara ativar, abra ${link}\nVocê vai criar sua senha e terá ${key.trial_days} dias do plano ${MODULE_NAMES[key.module]} sem custo. Depois, a continuidade é pela anuidade, paga com Pix ou cartão.\n\nA chave vale até ${fmtDate(key.expires_at)} e é pessoal, vinculada a este e-mail.\n\n—\n${BRAND.name}\n${BRAND.phone} · ${BRAND.email}`,
      html: `<p>Olá, ${esc(key.client_name)}.</p><p>Você recebeu uma chave de acesso à plataforma de estudos de tráfego da ${esc(BRAND.name)}.</p><p>Sua chave de acesso:<br><strong style="font-size:20px;letter-spacing:2px">${esc(code)}</strong></p><p><a href="${esc(link)}">Ativar meu acesso</a></p><p>Você vai criar sua senha e terá ${key.trial_days} dias do plano ${MODULE_NAMES[key.module]} sem custo. Depois, a continuidade é pela anuidade, paga com Pix ou cartão.</p><p>A chave vale até ${fmtDate(key.expires_at)} e é pessoal, vinculada a este e-mail.</p><p style="color:#627780;font-size:13px">—<br>${esc(BRAND.name)}<br>${esc(BRAND.phone)} · ${esc(BRAND.email)}</p>`});
    if (r?.delivered) await q('UPDATE access_keys SET email_sent_at = ? WHERE id = ?', now(), key.id).run();
    return !!r?.delivered;
  }

  function activatePage({session, code = '', message, done}) {
    const body = done ? `<h1>Chave ativada</h1>${notice(message)}<p class="lead">${esc(done.text)}</p><div class="inline-actions">${done.actions}</div>` :
      `<h1>Ativar chave de acesso</h1><p class="lead">Digite a chave que você recebeu por e-mail (cortesia, parceria ou turma). A ativação libera o acesso indicado na chave sem custo. Não tem chave? <a href="/experimentar">Teste 30 dias grátis</a>.</p>${notice(message)}
<div class="panel"><form class="stack" method="post" action="/ativar">
<label class="field">Chave de acesso<input name="chave" required maxlength="24" autocomplete="off" spellcheck="false" placeholder="FSC-XXXX-XXXX-XXXX" value="${esc(code)}" style="font-size:1.2rem;letter-spacing:.06em;text-transform:uppercase"></label>
<div><button class="button teal" type="submit">Ativar</button></div></form></div>
<p class="muted">Não recebeu a chave? Verifique a caixa de spam ou fale com a gente: <a href="${BRAND.phoneHref}">${esc(BRAND.phone)}</a> · <a href="mailto:${esc(BRAND.email)}">${esc(BRAND.email)}</a>.</p>
${session ? `<p class="muted">Você está conectado como ${esc(session.email)}.</p>` : ''}`;
    return html(consolePage({title: 'Ativar chave de acesso', session, body}));
  }

  async function activate(request, session) {
    const url = new URL(request.url);
    if (request.method !== 'POST') return activatePage({session, code: url.searchParams.get('chave') || ''});
    if (!auth.sameOrigin(request)) return activatePage({session, message: {kind: 'error', text: 'Solicitação de origem não autorizada.'}});
    if (!keyLimiter(ipOf(request))) return activatePage({session, message: {kind: 'error', text: 'Muitas tentativas. Aguarde alguns minutos e tente novamente.'}});
    const f = await form(request), typed = String(f.get('chave') || ''), norm = normalizeCode(typed);
    const invalid = text => activatePage({session, code: typed, message: {kind: 'error', text}});
    if (!norm) return invalid('Chave inválida. Confira as letras e números enviados no e-mail (formato FSC-XXXX-XXXX-XXXX).');
    const key = await q('SELECT * FROM access_keys WHERE code_hash = ?', codeHash(norm)).first();
    if (!key || key.revoked) return invalid('Chave não encontrada ou cancelada. Fale com a gente para receber uma nova.');
    if (key.redeemed_at) return invalid('Esta chave já foi ativada. Entre com seu e-mail e senha em Área do cliente.');
    if (key.expires_at <= now()) return invalid('Esta chave venceu. Fale com a gente para receber uma nova.');
    // Membro da equipe vinculado ao e-mail da chave
    let member = await q('SELECT * FROM members WHERE email = ?', key.email).first();
    if (!member) {
      const id = randomUUID();
      await q("INSERT INTO members (id,email,name,role,active,is_owner,created_at) VALUES (?,?,?,'client_manager',1,0,?)", id, key.email, key.client_name, now()).run();
      member = await q('SELECT * FROM members WHERE id = ?', id).first();
    } else if (!member.active) await q('UPDATE members SET active = 1 WHERE id = ?', member.id).run();
    const stamp = now();
    const claimed = await q('UPDATE access_keys SET redeemed_at = ?, member_id = ? WHERE id = ? AND redeemed_at IS NULL AND revoked = 0', stamp, member.id, key.id).run();
    if (claimed.meta.changes !== 1) return invalid('Esta chave já foi ativada. Entre com seu e-mail e senha em Área do cliente.');
    const endsAt = new Date(Date.parse(stamp) + key.trial_days * 864e5).toISOString();
    await q("INSERT OR IGNORE INTO module_grants (id,member_id,module,source,starts_at,ends_at,created_by,created_at) VALUES (?,?,?,'trial',?,?,?,?)", 'key:' + key.id, member.id, key.module, stamp, endsAt, key.created_by, stamp).run();
    await q("INSERT INTO audit_log (project_id,actor_id,actor_email,event,data_json,created_at) VALUES (NULL,?,?,'access-key.redeem',?,?)", member.id, key.email, JSON.stringify({keyId: key.id, endsAt}), stamp).run();
    const until = `Seu acesso ao plano ${MODULE_NAMES[key.module]} vale até ${fmtDate(endsAt)}.`;
    if (session && session.email === key.email) return html(consolePage({title: 'Chave ativada', session, body: `<h1>Chave ativada</h1><p class="lead">${esc(until)}</p><div class="inline-actions"><a class="button teal" href="${APP_HOME}">Abrir o programa</a><a class="button ghost" href="/assinatura">Ver assinatura</a></div>`}));
    const r = await auth.sendPasswordLink(request, {email: key.email, name: key.client_name, next: APP_HOME});
    const text = r.existing
      ? `${until} Você já tem conta com ${maskEmail(key.email)}: entre com seu e-mail e senha.`
      : `${until} Enviamos para ${maskEmail(key.email)} um link para você criar sua senha. Abra o e-mail e siga o link (confira também o spam).`;
    return activatePage({session, done: {text, actions: r.existing ? `<a class="button teal" href="/entrar?volta=%2Fsistema">Entrar</a>` : `<a class="button ghost" href="/">Voltar ao site</a>`}});
  }

  // ---------- Teste grátis ----------
  const TRIAL_DAYS = 30;
  const PROFILES = {profissional: 'Engenheiro(a) ou arquiteto(a)', empresa: 'Escritório, construtora ou incorporadora', estudante: 'Estudante de engenharia ou arquitetura', condominio: 'Síndico ou administradora', outro: 'Outro'};
  function trialPage({session, values = {}, message, done}) {
    const body = done ? `<h1>Quase lá</h1>${notice(message)}<p class="lead">${esc(done.text)}</p><div class="inline-actions">${done.actions}</div>` :
      `<h1>Teste a plataforma por ${TRIAL_DAYS} dias</h1><p class="lead">Crie sua conta e use o plano Completo sem custo por ${TRIAL_DAYS} dias. Não pedimos cartão. Depois, se quiser continuar, a anuidade é paga com Pix ou cartão.</p>${notice(message)}
<div class="panel"><form class="stack" method="post" action="/experimentar">
<label class="field">Nome<input name="nome" required maxlength="200" autocomplete="name" value="${esc(values.nome || '')}"></label>
<label class="field">E-mail<input name="email" type="email" required maxlength="254" autocomplete="email" value="${esc(values.email || '')}"></label>
<label class="field">Você é<select name="perfil">${Object.entries(PROFILES).map(([k, l]) => `<option value="${k}"${values.perfil === k ? ' selected' : ''}>${esc(l)}</option>`).join('')}</select></label>
<div class="hp" aria-hidden="true"><label>Não preencha<input name="site" tabindex="-1" autocomplete="off"></label></div>
<div><button class="button teal" type="submit">Criar conta e começar o teste</button></div></form></div>
<p class="muted"><strong>Estudante?</strong> Depois de entrar, envie o comprovante de matrícula em Assinatura → Acesso educacional e ganhe 6 meses grátis.</p>
${session ? `<p class="muted">Você está conectado como ${esc(session.email)}.</p>` : ''}`;
    return html(consolePage({title: 'Teste grátis', session, body}));
  }

  async function startTrial(request, session) {
    if (request.method !== 'POST') return trialPage({session});
    if (!auth.sameOrigin(request)) return trialPage({session, message: {kind: 'error', text: 'Solicitação de origem não autorizada.'}});
    const f = await form(request);
    const values = {nome: String(f.get('nome') || '').trim().slice(0, 200), email: String(f.get('email') || '').trim().toLowerCase().slice(0, 254), perfil: PROFILES[f.get('perfil')] ? String(f.get('perfil')) : 'outro'};
    if (f.get('site')) return trialPage({session, done: {text: 'Recebemos seu cadastro.', actions: ''}});
    if (!keyLimiter(ipOf(request))) return trialPage({session, values, message: {kind: 'error', text: 'Muitas tentativas. Aguarde alguns minutos e tente novamente.'}});
    if (!values.nome || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) return trialPage({session, values, message: {kind: 'error', text: 'Informe seu nome e um e-mail válido.'}});
    const stamp = now();
    let member = await q('SELECT * FROM members WHERE email = ?', values.email).first();
    let started = false;
    if (!member) {
      const id = randomUUID();
      await q("INSERT INTO members (id,email,name,role,active,is_owner,created_at) VALUES (?,?,?,'client_manager',1,0,?)", id, values.email, values.nome, stamp).run();
      member = await q('SELECT * FROM members WHERE id = ?', id).first();
    }
    // Um teste por e-mail: a chave do registro é fixa por membro.
    const endsAt = new Date(Date.parse(stamp) + TRIAL_DAYS * 864e5).toISOString();
    const r = await q("INSERT OR IGNORE INTO module_grants (id,member_id,module,source,starts_at,ends_at,created_by,created_at) VALUES (?,?,'advanced','trial',?,?,?,?)", 'trial:' + member.id, member.id, stamp, endsAt, member.id, stamp).run();
    started = r.meta.changes === 1;
    if (started) await q("INSERT INTO audit_log (project_id,actor_id,actor_email,event,data_json,created_at) VALUES (NULL,?,?,'trial.start',?,?)", member.id, values.email, JSON.stringify({endsAt, perfil: values.perfil}), stamp).run();
    const until = started ? `Seu teste do plano Completo vale até ${fmtDate(endsAt)}.` : 'Este e-mail já usou o período de teste.';
    if (session && session.email === values.email) return trialPage({session, done: {text: until, actions: `<a class="button teal" href="${APP_HOME}">Abrir o programa</a><a class="button ghost" href="/assinatura">Ver assinatura</a>`}});
    const link = await auth.sendPasswordLink(request, {email: values.email, name: values.nome, next: APP_HOME});
    const text = link.existing
      ? `${until} Você já tem conta com ${maskEmail(values.email)}: entre com seu e-mail e senha.`
      : `${until} Enviamos para ${maskEmail(values.email)} um link para você criar sua senha. Abra o e-mail e siga o link (confira também o spam).`;
    return trialPage({session, done: {text, actions: link.existing ? `<a class="button teal" href="/entrar?volta=%2Fsistema">Entrar</a>` : `<a class="button ghost" href="/">Voltar ao site</a>`}});
  }

  // ---------- Mercado Pago ----------
  async function mpFetch(path, init = {}) {
    const response = await fetcher('https://api.mercadopago.com' + path, {...init, headers: {'Authorization': 'Bearer ' + mp.accessToken, 'Content-Type': 'application/json', ...(init.headers || {})}, signal: AbortSignal.timeout(20000)});
    const text = await response.text();
    let data = null; try { data = JSON.parse(text); } catch {}
    if (!response.ok) { const e = new Error('Mercado Pago ' + response.status + ': ' + text.slice(0, 300)); e.status = 502; throw e; }
    return data;
  }

  async function grantFromPayment(row, mpPayment) {
    const stamp = now();
    const upd = await q("UPDATE payments SET status = 'approved', provider_payment_id = ?, provider_status = ?, paid_at = ?, updated_at = ? WHERE id = ? AND status <> 'approved'", String(mpPayment.id), mpPayment.status, stamp, stamp, row.id).run();
    if (upd.meta.changes !== 1) return false;
    const member = await q('SELECT * FROM members WHERE id = ?', row.member_id).first();
    const {grants} = await entitlements(member);
    const covering = grants.filter(g => !g.revoked && g.ends_at && g.ends_at > stamp && (!g.token_hash || g.redeemed_at) && (g.module === row.module || g.module === 'advanced'));
    const start = covering.map(g => g.ends_at).concat(stamp).sort().at(-1);
    const endsAt = addCalendarMonths(start, 12), grantId = 'mp:' + row.id;
    await q("INSERT OR IGNORE INTO module_grants (id,member_id,module,source,starts_at,ends_at,created_by,created_at) VALUES (?,?,?,'mercadopago',?,?,?,?)", grantId, row.member_id, row.module, stamp, endsAt, row.member_id, stamp).run();
    await q('UPDATE payments SET grant_id = ?, access_until = ? WHERE id = ?', grantId, endsAt, row.id).run();
    await q("INSERT INTO audit_log (project_id,actor_id,actor_email,event,data_json,created_at) VALUES (NULL,?,?,'subscription.paid',?,?)", member.id, member.email, JSON.stringify({paymentId: row.id, plan: row.module, endsAt, mp: String(mpPayment.id)}), stamp).run();
    await mailer.send({to: member.email, subject: `Pagamento confirmado · ${BRAND.name}`,
      text: `Olá, ${member.name}.\n\nRecebemos o pagamento da anuidade do plano ${MODULE_NAMES[row.module]} (${brl(row.amount_cents)}). Seu acesso está liberado até ${fmtDate(endsAt)}.\n\nObrigado!\n\n—\n${BRAND.name}\n${BRAND.phone} · ${BRAND.email}`});
    if (BRAND.email !== member.email) await mailer.send({to: BRAND.email, subject: `Nova anuidade paga · ${member.name}`, text: `${member.name} (${member.email}) pagou ${brl(row.amount_cents)} · plano ${MODULE_NAMES[row.module]} · acesso até ${fmtDate(endsAt)}. Pagamento Mercado Pago ${mpPayment.id}.`});
    return true;
  }

  // Confere o pagamento direto na API do Mercado Pago (nunca confia só na notificação recebida).
  async function processPayment(paymentId) {
    if (!/^\d{1,20}$/.test(String(paymentId))) return {status: 'ignored'};
    const p = await mpFetch('/v1/payments/' + paymentId);
    const row = p?.external_reference ? await q('SELECT * FROM payments WHERE id = ?', String(p.external_reference)).first() : null;
    if (!row) { log.warn('[mercadopago] pagamento sem pedido correspondente: ' + paymentId); return {status: 'unknown'}; }
    const amountOk = Math.round(Number(p.transaction_amount) * 100) === row.amount_cents && (p.currency_id || 'BRL') === 'BRL';
    if (p.status === 'approved') {
      if (!amountOk) {
        await q("UPDATE payments SET status = 'divergent', provider_payment_id = ?, provider_status = ?, updated_at = ? WHERE id = ? AND status <> 'approved'", String(p.id), p.status, now(), row.id).run();
        log.error('[mercadopago] valor divergente no pagamento ' + p.id + ' do pedido ' + row.id);
        return {status: 'divergent', row};
      }
      await grantFromPayment(row, p);
      return {status: 'approved', row};
    }
    const mapped = ['rejected', 'cancelled', 'refunded', 'charged_back'].includes(p.status) ? 'failed' : 'pending';
    await q("UPDATE payments SET status = ?, provider_payment_id = COALESCE(provider_payment_id, ?), provider_status = ?, updated_at = ? WHERE id = ? AND status <> 'approved'", mapped, String(p.id), p.status, now(), row.id).run();
    return {status: mapped, row};
  }

  async function webhook(request) {
    const url = new URL(request.url);
    let body = {};
    try { body = JSON.parse(await request.text() || '{}'); } catch {}
    const type = body.type || body.topic || url.searchParams.get('type') || url.searchParams.get('topic');
    const dataId = url.searchParams.get('data.id') || body?.data?.id || url.searchParams.get('id');
    // A liberação sempre é conferida na API do Mercado Pago; a assinatura, quando presente, precisa ser válida.
    if (request.headers.get('x-signature') && !verifyMercadoPagoSignature({secret: mp.webhookSecret, signature: request.headers.get('x-signature'), requestId: request.headers.get('x-request-id'), dataId: url.searchParams.get('data.id') || (body?.data?.id != null ? String(body.data.id) : '')})) {
      log.warn('[mercadopago] assinatura de webhook inválida');
      return new Response('assinatura inválida', {status: 401});
    }
    if (type !== 'payment' || !dataId || !mpReady()) return new Response('ok');
    try { await processPayment(String(dataId)); }
    catch (e) { log.error('[mercadopago] falha ao processar notificação', e.message); return new Response('erro', {status: 500}); }
    return new Response('ok');
  }

  // ---------- Assinatura ----------
  async function subscriptionPage(request, session, message) {
    const member = await memberFor(session);
    if (!member) return html(consolePage({title: 'Assinatura', session, body: `<h1>Assinatura</h1><p class="lead">Sua conta ainda não tem um acesso. Comece o teste grátis de 30 dias ou ative uma chave recebida.</p><div class="inline-actions"><a class="button teal" href="/experimentar">Testar 30 dias grátis</a><a class="button ghost" href="/ativar">Ativar chave</a></div>`}));
    const {ent} = await entitlements(member);
    const payments = (await q('SELECT * FROM payments WHERE member_id = ? ORDER BY created_at DESC LIMIT 20', member.id).all()).results;
    const adv = ent.advanced, bas = ent.basic;
    const current = adv.active ? {name: 'Completo', e: adv} : bas.active ? {name: 'Básico', e: bas} : null;
    const statusHtml = current
      ? `<div class="status"><strong>${current.e.permanent ? 'Acesso permanente' : `${current.e.daysRemaining} dias`}</strong><span>Plano ${current.name}${current.e.permanent ? '' : ` · até ${fmtDate(current.e.endsAt)}`} · <span class="pill on">ativo</span></span></div>
         ${current.e.sources.includes('trial') && !current.e.sources.includes('mercadopago') ? '<p class="muted" style="margin-top:12px">Você está no período de teste. Pagando agora, os 12 meses começam a contar depois do fim do teste.</p>' : ''}`
      : `<div class="status"><strong>Vencido</strong><span><span class="pill off">sem acesso ativo</span></span></div><p class="muted" style="margin-top:12px">Seus estudos continuam guardados. Ao pagar a anuidade, tudo volta a ficar disponível.</p>`;
    const buy = p => `<article class="plan${p.id === 'advanced' ? ' featured' : ''}"><h3>${esc(p.name)}</h3><div class="price"><strong>${brl(p.annualCents)}</strong><span>por ano</span></div><div class="per">Equivale a ${perMonth(p.annualCents)} por mês</div><p>${esc(p.summary)}</p>
${mpReady() ? `<form method="post" action="/assinatura/pagar"><input type="hidden" name="plano" value="${p.id}"><button class="button${p.id === 'advanced' ? ' teal' : ''}" type="submit">Pagar ${brl(p.annualCents)} com Mercado Pago</button></form>` : `<a class="button ghost" href="${BRAND.whatsappHref}?text=${encodeURIComponent('Olá! Quero pagar a anuidade do plano ' + p.name + '.')}">Pagar pelo WhatsApp</a>`}</article>`;
    const statusLabel = {approved: ['pago', 'on'], pending: ['aguardando', 'wait'], failed: ['não concluído', 'off'], divergent: ['em análise', 'wait'], created: ['iniciado', 'wait']};
    const history = payments.length ? `<div class="panel"><h2>Pagamentos</h2><div class="table-wrap"><table class="data"><thead><tr><th>Data</th><th>Plano</th><th>Valor</th><th>Situação</th><th>Acesso até</th></tr></thead><tbody>${payments.map(p => { const [l, c] = statusLabel[p.status] || [p.status, 'wait']; return `<tr><td>${fmtDateTime(p.created_at)}</td><td>${MODULE_NAMES[p.module] || esc(p.module)}</td><td>${brl(p.amount_cents)}</td><td><span class="pill ${c}">${l}</span></td><td>${fmtDate(p.access_until)}</td></tr>`; }).join('')}</tbody></table></div></div>` : '';
    const body = `<h1>Assinatura</h1><p class="lead">${esc(member.name)} · ${esc(member.email)}</p>${notice(message)}
<div class="panel"><h2>Seu acesso</h2>${statusHtml}<div class="inline-actions" style="margin-top:18px"><a class="button ghost small" href="${APP_HOME}">Abrir o programa</a></div></div>
<h2 style="margin:36px 0 18px">Renovar ou contratar</h2><div class="plans">${buy(plans.basic)}${buy(plans.advanced)}</div>
<p class="plans-note">${mpReady() ? 'Você será levado ao Mercado Pago para pagar com Pix ou cartão. A liberação é automática quando o pagamento é aprovado.' : 'O pagamento on-line ainda não está ativo. Fale com a gente pelo WhatsApp para receber o link de pagamento.'}</p>
${history}`;
    return html(consolePage({title: 'Assinatura', session, body}));
  }

  async function startCheckout(request, session) {
    if (!auth.sameOrigin(request)) return redirect('/assinatura?pagamento=erro');
    if (!payLimiter(ipOf(request))) return subscriptionPage(request, session, {kind: 'error', text: 'Muitas tentativas seguidas. Aguarde alguns minutos.'});
    const member = await memberFor(session);
    if (!member) return redirect('/assinatura');
    if (!mpReady()) return subscriptionPage(request, session, {kind: 'error', text: 'Pagamento on-line ainda não configurado. Fale com a gente pelo WhatsApp.'});
    const f = await form(request), plan = plans[f.get('plano')];
    if (!plan) return subscriptionPage(request, session, {kind: 'error', text: 'Escolha um plano válido.'});
    const id = randomUUID(), stamp = now(), base = auth.baseUrl(request);
    await q("INSERT INTO payments (id,member_id,module,amount_cents,status,provider,created_at,updated_at) VALUES (?,?,?,?,'created','mercadopago',?,?)", id, member.id, plan.module, plan.annualCents, stamp, stamp).run();
    try {
      const pref = await mpFetch('/checkout/preferences', {method: 'POST', headers: {'X-Idempotency-Key': id}, body: JSON.stringify({
        items: [{id: 'anuidade-' + plan.id, title: `Plataforma de estudos de tráfego · plano ${plan.name} · 12 meses`, description: `${BRAND.name} · anuidade`, quantity: 1, unit_price: plan.annualCents / 100, currency_id: 'BRL', category_id: 'services'}],
        payer: {email: member.email, name: member.name},
        external_reference: id,
        notification_url: `${base}/webhooks/mercadopago?source_news=webhooks`,
        back_urls: {success: `${base}/assinatura/retorno`, pending: `${base}/assinatura/retorno`, failure: `${base}/assinatura/retorno`},
        auto_return: 'approved',
        statement_descriptor: (mp.statementDescriptor || 'SILSEC').slice(0, 22),
        payment_methods: {installments: mp.maxInstallments || 1},
        expires: false,
      })});
      await q("UPDATE payments SET status = 'pending', preference_id = ?, updated_at = ? WHERE id = ?", String(pref.id), now(), id).run();
      const target = (mp.sandbox ? pref.sandbox_init_point : pref.init_point) || pref.init_point;
      if (!/^https:\/\/([a-z0-9-]+\.)*mercadopago\.com(\.br)?\//i.test(target || '') && !/^https:\/\/([a-z0-9-]+\.)*mercadolibre\.com\//i.test(target || '')) throw new Error('Endereço de pagamento inesperado.');
      return redirect(target);
    } catch (e) {
      log.error('[mercadopago] falha ao criar pagamento', e.message);
      await q("UPDATE payments SET status = 'failed', provider_status = 'checkout-error', updated_at = ? WHERE id = ?", now(), id).run();
      return subscriptionPage(request, session, {kind: 'error', text: 'Não foi possível abrir o pagamento agora. Tente de novo em alguns minutos ou fale com a gente pelo WhatsApp.'});
    }
  }

  async function checkoutReturn(request) {
    const url = new URL(request.url), paymentId = url.searchParams.get('payment_id') || url.searchParams.get('collection_id');
    let result = url.searchParams.get('status') || url.searchParams.get('collection_status') || '';
    if (paymentId && mpReady()) { try { result = (await processPayment(paymentId)).status; } catch (e) { log.error('[mercadopago] retorno', e.message); } }
    const flag = result === 'approved' ? 'aprovado' : ['failed', 'rejected', 'null', 'cancelled'].includes(result) ? 'falhou' : 'pendente';
    return redirect('/assinatura?pagamento=' + flag);
  }

  // ---------- Painel do administrador ----------
  async function adminMember(session) {
    const m = await memberFor(session);
    return m && m.active && m.role === 'admin' ? m : null;
  }

  async function panelPage(request, session, admin, {message, created} = {}) {
    const keys = (await q('SELECT * FROM access_keys ORDER BY created_at DESC LIMIT 200').all()).results;
    const members = (await q("SELECT * FROM members WHERE role <> 'admin' ORDER BY created_at DESC LIMIT 300").all()).results;
    const grants = (await q('SELECT * FROM module_grants').all()).results;
    const payments = (await q('SELECT p.*, m.name AS member_name, m.email AS member_email FROM payments p LEFT JOIN members m ON m.id = p.member_id ORDER BY p.created_at DESC LIMIT 100').all()).results;
    const messages = (await q('SELECT * FROM contact_messages ORDER BY created_at DESC LIMIT 30').all()).results;
    const stamp = now();
    const keyStatus = k => k.revoked ? ['cancelada', 'off'] : k.redeemed_at ? ['ativada', 'on'] : k.expires_at <= stamp ? ['vencida', 'off'] : ['aguardando ativação', 'wait'];
    const keyRows = keys.map(k => { const [l, c] = keyStatus(k); const actionable = !k.revoked && !k.redeemed_at;
      return `<tr><td><strong>${esc(k.client_name)}</strong><br>${esc(k.email)}</td><td>${esc(k.company) || '—'}<br><span class="muted">${esc(k.contract_ref) || ''}</span></td><td>${MODULE_NAMES[k.module]} · ${k.trial_days} dias</td><td>…${esc(k.code_hint)}</td><td>${fmtDate(k.created_at)}<br><span class="muted">vale até ${fmtDate(k.expires_at)}</span></td><td><span class="pill ${c}">${l}</span>${k.redeemed_at ? `<br><span class="muted">${fmtDate(k.redeemed_at)}</span>` : ''}${!k.email_sent_at && actionable ? '<br><span class="muted">e-mail não enviado</span>' : ''}</td>
<td>${actionable ? `<form method="post" action="/painel/chaves/${esc(k.id)}/reenviar"><button class="button small ghost" type="submit">Gerar nova e reenviar</button></form> <form method="post" action="/painel/chaves/${esc(k.id)}/cancelar"><button class="button small ghost" type="submit">Cancelar</button></form>` : ''}</td></tr>`; }).join('');
    const memberRows = members.map(m => { const ent = resolveLicenses(m, grants.filter(g => g.member_id === m.id), stamp); const a = ent.advanced.active ? ['Completo', ent.advanced] : ent.basic.active ? ['Básico', ent.basic] : null;
      const paid = payments.filter(p => p.member_id === m.id && p.status === 'approved').reduce((s, p) => s + p.amount_cents, 0);
      return `<tr><td><strong>${esc(m.name)}</strong><br>${esc(m.email)}</td><td>${a ? `${a[0]}` : '—'}</td><td>${a ? `<span class="pill on">ativo</span><br><span class="muted">${a[1].permanent ? 'permanente' : 'até ' + fmtDate(a[1].endsAt)}</span>` : '<span class="pill off">sem acesso</span>'}</td><td>${a ? esc(a[1].sources.map(s => SOURCE_NAMES[s] || s).join(', ')) : '—'}</td><td>${paid ? brl(paid) : '—'}</td><td>${m.active ? '' : 'desativado'}</td></tr>`; }).join('');
    const statusLabel = {approved: ['pago', 'on'], pending: ['aguardando', 'wait'], failed: ['não concluído', 'off'], divergent: ['valor divergente', 'off'], created: ['iniciado', 'wait']};
    const payRows = payments.map(p => { const [l, c] = statusLabel[p.status] || [p.status, 'wait']; return `<tr><td>${fmtDateTime(p.created_at)}</td><td>${esc(p.member_name || '')}<br><span class="muted">${esc(p.member_email || '')}</span></td><td>${MODULE_NAMES[p.module] || esc(p.module)}</td><td>${brl(p.amount_cents)}</td><td><span class="pill ${c}">${l}</span>${p.provider_status ? `<br><span class="muted">${esc(p.provider_status)}</span>` : ''}</td><td>${esc(p.provider_payment_id || '—')}</td><td>${fmtDate(p.access_until)}</td></tr>`; }).join('');
    const revenue = payments.filter(p => p.status === 'approved' && p.paid_at && p.paid_at > new Date(Date.now() - 365 * 864e5).toISOString()).reduce((s, p) => s + p.amount_cents, 0);
    const activeCount = members.filter(m => { const e = resolveLicenses(m, grants.filter(g => g.member_id === m.id), stamp); return e.advanced.active || e.basic.active; }).length;
    const createdHtml = created ? `<div class="panel" style="border:2px solid var(--teal)"><h2>Chave criada</h2><p>Copie e guarde, se precisar. Ela só aparece agora.</p><p><span class="code">${esc(created.code)}</span></p><p>${created.sent ? `Enviada por e-mail para <strong>${esc(created.email)}</strong>.` : `<strong>O e-mail não foi enviado</strong> (confira a senha do e-mail em SMTP_PASSWORD). Envie a chave ao cliente por outro meio, com o link ${esc(auth.baseUrl(request))}/ativar.`}</p></div>` : '';
    const body = `<h1>Painel</h1><p class="lead">Chaves de acesso para clientes, assinaturas, pagamentos e mensagens do site.</p>${notice(message)}${createdHtml}
<div class="panel stats"><div><strong>${activeCount}</strong><span>clientes com acesso ativo</span></div><div><strong>${brl(revenue)}</strong><span>recebidos em anuidades nos últimos 12 meses</span></div><div><strong>${mpReady() ? 'Ligado' : 'Desligado'}</strong><span>pagamento on-line pelo Mercado Pago</span></div></div>
<div class="panel"><h2>Nova chave de acesso</h2><p class="muted">Use ao assinar um contrato. O cliente recebe a chave por e-mail, cria a senha e ganha os dias de teste a partir da ativação.</p>
<form method="post" action="/painel/chaves" class="form-grid">
<label class="field">Nome do cliente<input name="nome" required maxlength="200"></label>
<label class="field">E-mail do cliente<input name="email" type="email" required maxlength="254"></label>
<label class="field">Empresa ou edifício<input name="empresa" maxlength="200"></label>
<label class="field">Contrato (referência)<input name="contrato" maxlength="120" placeholder="ex.: 2026-014"></label>
<label class="field">Plano liberado no teste<select name="modulo"><option value="advanced">Completo</option><option value="basic">Básico</option></select></label>
<label class="field">Dias grátis<input name="dias" type="number" min="1" max="365" value="30" required></label>
<label class="field">Chave vale por (dias)<input name="validade" type="number" min="1" max="365" value="30" required></label>
<label class="field" style="grid-column:span 2;display:flex;flex-direction:row;align-items:center;gap:10px"><input type="checkbox" name="enviar" value="1" checked style="width:auto;min-height:0"> Enviar a chave por e-mail agora</label>
<div><button class="button teal" type="submit">Criar chave</button></div>
</form></div>
<div class="panel"><h2>Chaves</h2>${keys.length ? `<div class="table-wrap"><table class="data"><thead><tr><th>Cliente</th><th>Empresa / contrato</th><th>Teste</th><th>Final</th><th>Criada</th><th>Situação</th><th></th></tr></thead><tbody>${keyRows}</tbody></table></div>` : '<p class="muted">Nenhuma chave criada ainda.</p>'}</div>
<div class="panel"><h2>Clientes</h2>${members.length ? `<div class="table-wrap"><table class="data"><thead><tr><th>Cliente</th><th>Plano</th><th>Acesso</th><th>Origem</th><th>Pago</th><th></th></tr></thead><tbody>${memberRows}</tbody></table></div>` : '<p class="muted">Nenhum cliente ainda.</p>'}</div>
<div class="panel"><h2>Pagamentos</h2>${payments.length ? `<div class="table-wrap"><table class="data"><thead><tr><th>Data</th><th>Cliente</th><th>Plano</th><th>Valor</th><th>Situação</th><th>Mercado Pago</th><th>Acesso até</th></tr></thead><tbody>${payRows}</tbody></table></div>` : '<p class="muted">Nenhum pagamento ainda.</p>'}</div>
<div class="panel"><h2>Mensagens do site</h2>${messages.length ? `<div class="table-wrap"><table class="data"><thead><tr><th>Data</th><th>Contato</th><th>Assunto</th><th>Mensagem</th></tr></thead><tbody>${messages.map(m => `<tr><td>${fmtDateTime(m.created_at)}</td><td><strong>${esc(m.name)}</strong><br><a href="mailto:${esc(m.email)}">${esc(m.email)}</a>${m.phone ? '<br>' + esc(m.phone) : ''}${m.company ? '<br>' + esc(m.company) : ''}</td><td>${esc(m.subject)}</td><td style="white-space:pre-wrap;max-width:420px">${esc(m.message)}</td></tr>`).join('')}</tbody></table></div>` : '<p class="muted">Nenhuma mensagem ainda.</p>'}</div>
<p class="muted">Equipe interna, licenças avulsas e auditoria continuam em <a href="${APP_HOME}">Programa → Projetos e ferramentas</a>.</p>`;
    return html(consolePage({title: 'Painel', session, body, wide: true}));
  }

  async function createKey(request, session, admin) {
    const f = await form(request);
    const name = String(f.get('nome') || '').trim().slice(0, 200), email = String(f.get('email') || '').trim().toLowerCase();
    const company = String(f.get('empresa') || '').trim().slice(0, 200), contract = String(f.get('contrato') || '').trim().slice(0, 120);
    const module = f.get('modulo') === 'basic' ? 'basic' : 'advanced';
    const days = Math.min(365, Math.max(1, parseInt(f.get('dias'), 10) || 30)), validity = Math.min(365, Math.max(1, parseInt(f.get('validade'), 10) || 30));
    if (!name || !validEmail(email)) return panelPage(request, session, admin, {message: {kind: 'error', text: 'Informe o nome e um e-mail válido do cliente.'}});
    const code = newAccessCode(), norm = normalizeCode(code), stamp = now();
    const key = {id: randomUUID(), email, client_name: name, module, trial_days: days, expires_at: new Date(Date.now() + validity * 864e5).toISOString()};
    await q('INSERT INTO access_keys (id,code_hash,code_hint,email,client_name,company,contract_ref,module,trial_days,expires_at,created_by,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)',
      key.id, codeHash(norm), norm.slice(-4), email, name, company, contract, module, days, key.expires_at, admin.id, stamp).run();
    await q("INSERT INTO audit_log (project_id,actor_id,actor_email,event,data_json,created_at) VALUES (NULL,?,?,'access-key.create',?,?)", admin.id, admin.email, JSON.stringify({keyId: key.id, email, module, days}), stamp).run();
    const sent = f.get('enviar') ? await sendKeyEmail(request, key, code) : false;
    return panelPage(request, session, admin, {created: {code, email, sent}});
  }

  async function keyAction(request, session, admin, keyId, action) {
    const key = await q('SELECT * FROM access_keys WHERE id = ?', keyId).first();
    if (!key) return panelPage(request, session, admin, {message: {kind: 'error', text: 'Chave não encontrada.'}});
    if (key.redeemed_at || key.revoked) return panelPage(request, session, admin, {message: {kind: 'error', text: 'Esta chave já foi ativada ou cancelada.'}});
    if (action === 'cancelar') {
      await q('UPDATE access_keys SET revoked = 1 WHERE id = ? AND redeemed_at IS NULL', key.id).run();
      return panelPage(request, session, admin, {message: {kind: 'ok', text: `Chave de ${key.client_name} cancelada.`}});
    }
    // Reenviar: a chave antiga deixa de valer e uma nova é enviada (só guardamos o resumo criptográfico).
    const code = newAccessCode(), norm = normalizeCode(code), validity = Math.max(1, Math.round((Date.parse(key.expires_at) - Date.parse(key.created_at)) / 864e5));
    const expires = new Date(Date.now() + validity * 864e5).toISOString();
    await q('UPDATE access_keys SET code_hash = ?, code_hint = ?, expires_at = ?, email_sent_at = NULL WHERE id = ? AND redeemed_at IS NULL', codeHash(norm), norm.slice(-4), expires, key.id).run();
    const sent = await sendKeyEmail(request, {...key, expires_at: expires}, code);
    return panelPage(request, session, admin, {created: {code, email: key.email, sent}});
  }

  // ---------- Roteamento ----------
  async function handle(request) {
    const url = new URL(request.url), path = url.pathname, method = request.method;
    const site = ['/', '/servicos', '/modulos', '/orcamento', '/ativar', '/experimentar', '/contato', '/assinatura', '/assinatura/pagar', '/assinatura/retorno', '/webhooks/mercadopago', '/painel', '/robots.txt', '/sitemap.xml'];
    if (!site.includes(path) && !path.startsWith('/painel/')) return null;

    if (path === '/webhooks/mercadopago') return method === 'POST' ? webhook(request) : new Response('ok');
    if (path === '/robots.txt') return new Response(`User-agent: *\nAllow: /$\nAllow: /servicos\nAllow: /modulos\nAllow: /orcamento\nDisallow: /sistema\nDisallow: /api/\nDisallow: /painel\nDisallow: /assinatura\nSitemap: ${auth.baseUrl(request)}/sitemap.xml\n`, {headers: {'Content-Type': 'text/plain; charset=utf-8'}});
    if (path === '/sitemap.xml') return new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${esc(auth.baseUrl(request))}/</loc></url><url><loc>${esc(auth.baseUrl(request))}/servicos</loc></url><url><loc>${esc(auth.baseUrl(request))}/modulos</loc></url><url><loc>${esc(auth.baseUrl(request))}/orcamento</loc></url><url><loc>${esc(auth.baseUrl(request))}/experimentar</loc></url></urlset>`, {headers: {'Content-Type': 'application/xml; charset=utf-8'}});

    const session = await auth.sessionUser(request);
    if (path === '/' && config.desktop) return redirect(APP_HOME, 302);
    if (path === '/') {
      // Links antigos do programa (consulta compartilhada, convite, projeto) continuam funcionando.
      if (['share', 'supplierInvite', 'project'].some(k => url.searchParams.has(k))) return redirect(APP_HOME + url.search, 302);
      const flag = url.searchParams.get('contato');
      const message = {enviado: {kind: 'ok', text: 'Mensagem enviada. Obrigado pelo contato!'}, invalido: {kind: 'error', text: 'Preencha nome, e-mail e mensagem.'}, limite: {kind: 'error', text: 'Muitas mensagens seguidas. Tente novamente em alguns minutos ou chame no WhatsApp.'}, erro: {kind: 'error', text: 'Não foi possível enviar. Tente pelo WhatsApp ou e-mail.'}}[flag];
      return html(homePage({plans, session, message}), 200, {'X-Robots-Tag': 'index, follow', 'Cache-Control': session || message ? 'no-store' : 'public, max-age=300'});
    }
    if (path === '/servicos') return html(servicesPage({session}), 200, {'X-Robots-Tag': 'index, follow', 'Cache-Control': session ? 'no-store' : 'public, max-age=300'});
    if (path === '/modulos') return html(modulesPage({plans, session}), 200, {'X-Robots-Tag': 'index, follow', 'Cache-Control': session ? 'no-store' : 'public, max-age=300'});
    if (path === '/orcamento') {
      const flag = url.searchParams.get('contato');
      const message = {enviado: {kind: 'ok', text: 'Solicitação enviada. Retornamos em até dois dias úteis com escopo, prazo e valor.'}, invalido: {kind: 'error', text: 'Preencha nome, e-mail e a descrição do caso.'}, limite: {kind: 'error', text: 'Muitas mensagens seguidas. Tente novamente em alguns minutos.'}, erro: {kind: 'error', text: 'Não foi possível enviar. Tente novamente.'}}[flag] || null;
      return html(quotePage({session, message, preset: url.searchParams.get('assunto') || ''}), 200, {'X-Robots-Tag': 'index, follow', 'Cache-Control': 'no-store'});
    }
    if (path === '/contato') return method === 'POST' ? contact(request) : redirect('/orcamento');
    if (path === '/ativar') return activate(request, session);
    if (path === '/experimentar') return startTrial(request, session);

    if (!session) return redirect('/entrar?volta=' + encodeURIComponent(path + url.search));
    if (path === '/assinatura') {
      const flag = url.searchParams.get('pagamento');
      const message = {aprovado: {kind: 'ok', text: 'Pagamento aprovado. Seu acesso foi liberado por 12 meses.'}, pendente: {kind: 'ok', text: 'Pagamento em processamento. Quando o Mercado Pago aprovar, o acesso é liberado automaticamente e você recebe um e-mail.'}, falhou: {kind: 'error', text: 'O pagamento não foi concluído. Você pode tentar de novo.'}, erro: {kind: 'error', text: 'Solicitação recusada.'}}[flag];
      return subscriptionPage(request, session, message);
    }
    if (path === '/assinatura/pagar') return method === 'POST' ? startCheckout(request, session) : redirect('/assinatura');
    if (path === '/assinatura/retorno') return checkoutReturn(request);

    // Painel do administrador
    const admin = await adminMember(session);
    if (!admin) return html(consolePage({title: 'Painel', session, body: '<h1>Painel</h1><p class="lead">Área exclusiva da administração.</p>'}), 403);
    if (method === 'POST' && !auth.sameOrigin(request)) return panelPage(request, session, admin, {message: {kind: 'error', text: 'Solicitação de origem não autorizada.'}});
    if (path === '/painel') return panelPage(request, session, admin);
    if (path === '/painel/chaves' && method === 'POST') return createKey(request, session, admin);
    const m = path.match(/^\/painel\/chaves\/([A-Za-z0-9-]{1,64})\/(reenviar|cancelar)$/);
    if (m && method === 'POST') return keyAction(request, session, admin, m[1], m[2]);
    return redirect('/painel');
  }

  // Avisos por e-mail: 7 dias antes e no dia em que o acesso vence (teste ou anuidade).
  async function sendReminders(baseUrl) {
    const stamp = now(), in7 = new Date(Date.now() + 7 * 864e5).toISOString();
    const grants = (await q("SELECT * FROM module_grants WHERE revoked = 0 AND ends_at IS NOT NULL AND source IN ('trial','mercadopago') AND ends_at > ? AND ends_at <= ?", new Date(Date.now() - 864e5).toISOString(), in7).all()).results;
    let count = 0;
    for (const g of grants) {
      const later = await q('SELECT id FROM module_grants WHERE member_id = ? AND revoked = 0 AND (ends_at IS NULL OR ends_at > ?) AND id <> ? LIMIT 1', g.member_id, g.ends_at, g.id).first();
      if (later) continue;
      const kind = g.ends_at > stamp ? 'd7' : 'fim';
      const claimed = await q('INSERT OR IGNORE INTO access_reminders (grant_id,kind,sent_at) VALUES (?,?,?)', g.id, kind, stamp).run();
      if (claimed.meta.changes !== 1) continue;
      const member = await q('SELECT * FROM members WHERE id = ? AND active = 1', g.member_id).first();
      if (!member) continue;
      const link = (config.appUrl || baseUrl || '') + '/assinatura';
      const plan = plans[g.module] || plans.advanced;
      const what = g.source === 'trial' ? 'seu período de teste' : 'sua anuidade';
      await mailer.send({to: member.email, subject: kind === 'd7' ? `Seu acesso vence em ${fmtDate(g.ends_at)} · ${BRAND.name}` : `Seu acesso venceu · ${BRAND.name}`,
        text: `Olá, ${member.name}.\n\n${kind === 'd7' ? `${what[0].toUpperCase() + what.slice(1)} na plataforma de estudos de tráfego vence em ${fmtDate(g.ends_at)}.` : `${what[0].toUpperCase() + what.slice(1)} na plataforma de estudos de tráfego venceu. Seus estudos continuam guardados.`}\n\nPara continuar com o plano ${plan.name} por 12 meses (${brl(plan.annualCents)}, Pix ou cartão), acesse:\n${link}\n\n—\n${BRAND.name}\n${BRAND.phone} · ${BRAND.email}`});
      count++;
    }
    return count;
  }

  return {handle, processPayment, sendReminders};
}
