// Console do desenvolvedor (/admin): gestão central de usuários, acessos, pagamentos, projetos, manutenção e cópias de
// segurança. Todos os aplicativos (site, computador, Android e iOS) usam este mesmo banco, então tudo é controlado daqui.
// Só administradores ativos entram; toda ação fica registrada na auditoria.
import {randomUUID} from 'node:crypto';
import {resolveLicenses, addCalendarMonths} from '../../public/licensing.js';
import {ROLES} from '../../public/procurement.js';
import {consolePage, esc, notice, fmtDate, fmtDateTime, brl} from '../site/pages.mjs';
// Contas da administração com acesso permanente (lista em config.ownerEmails).
const isOwnerEmail = (config, email) => { const e = String(email || '').trim().toLowerCase(); return !!e && (config.ownerEmails ? config.ownerEmails.has(e) : e === config.ownerEmail); };

export const ADMIN_BASE = '/admin';
const MODULES = {basic: 'Básico', advanced: 'Completo'};
const now = () => new Date().toISOString();
const SETTINGS_SQL = {
  get: 'SELECT value FROM system_settings WHERE name = ?',
  sqlite: 'INSERT INTO system_settings (name,value,updated_at) VALUES (?,?,?) ON CONFLICT(name) DO UPDATE SET value=excluded.value,updated_at=excluded.updated_at',
  mysql: 'INSERT INTO system_settings (name,value,updated_at) VALUES (?,?,?) ON DUPLICATE KEY UPDATE value=VALUES(value),updated_at=VALUES(updated_at)',
};
const BACKUP_TABLES = ['auth_users', 'members', 'module_grants', 'access_keys', 'payments', 'projects', 'clients', 'profiles', 'shares', 'project_access', 'delegations', 'offers', 'invoices', 'supplier_catalog', 'acquisition_requests', 'education_requests', 'billing_identities', 'silsec_organizations', 'silsec_memberships', 'silsec_registrations', 'silsec_invitations', 'silsec_commercial', 'silsec_documents', 'contact_messages', 'inspection_templates', 'inspections', 'system_settings', 'audit_log'];

export function createDevConsole({db, auth, config, commerce, log = console}) {
  const q = (sql, ...a) => db.prepare(sql).bind(...a);
  const html = (body, status = 200) => new Response(body, {status, headers: {'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow'}});
  const redirect = (location) => new Response(null, {status: 303, headers: {Location: location, 'Cache-Control': 'no-store'}});
  let settingsCache = {at: 0, value: {}};

  async function settings() {
    if (Date.now() - settingsCache.at < 5000) return settingsCache.value;
    const rows = (await q('SELECT name,value FROM system_settings').all()).results;
    settingsCache = {at: Date.now(), value: Object.fromEntries(rows.map(r => [r.name, r.value]))};
    return settingsCache.value;
  }
  async function setSetting(name, value) { await q(db.dialect === 'mysql' ? SETTINGS_SQL.mysql : SETTINGS_SQL.sqlite, name, String(value), now()).run(); settingsCache.at = 0; }

  async function adminFor(session) {
    if (!session) return null;
    const m = await q('SELECT * FROM members WHERE site_user_id = ? OR email = ? ORDER BY is_owner DESC LIMIT 1', session.id, session.email).first();
    if (m && m.active && m.role === 'admin') return m;
    if (isOwnerEmail(config, session.email)) return {id: session.id, email: session.email, name: session.name, role: 'admin', active: 1, is_owner: 1};
    return null;
  }
  async function audit(admin, event, data) {
    await q("INSERT INTO audit_log (project_id,actor_id,actor_email,event,data_json,created_at) VALUES (NULL,?,?,?,?,?)", admin.id, admin.email, 'admin.' + event, JSON.stringify(data || {}), now()).run();
  }

  // Manutenção: bloqueia o uso (site, API e aplicativos) para quem não é administrador, com uma mensagem.
  async function maintenance(request) {
    const s = await settings();
    if (s.maintenance !== '1') return null;
    const path = new URL(request.url).pathname;
    if (path === '/saude' || path.startsWith(ADMIN_BASE) || ['/entrar', '/sair', '/esqueci-senha', '/redefinir-senha', '/verificar', '/manifest.webmanifest', '/sw.js'].includes(path) || /\.(css|js|svg|png|ico|woff2)$/.test(path)) return null;
    if (await adminFor(await auth.sessionUser(request))) return null;
    const text = s.maintenance_message || 'O SilSec está em manutenção. Voltamos em instantes.';
    if (path.startsWith('/api/')) return Response.json({error: text, maintenance: true}, {status: 503, headers: {'Retry-After': '600'}});
    return html(consolePage({title: 'Manutenção', session: null, body: `<h1>Em manutenção</h1><p class="lead">${esc(text)}</p>`}), 503);
  }

  // ---------- telas ----------
  const nav = active => `<nav class="admin-nav">${[['', 'Visão geral'], ['/usuarios', 'Usuários e acessos'], ['/pagamentos', 'Pagamentos'], ['/projetos', 'Projetos'], ['/sistema', 'Sistema e manutenção'], ['/auditoria', 'Auditoria']].map(([p, l]) => `<a href="${ADMIN_BASE}${p}"${active === p ? ' aria-current="page"' : ''}>${l}</a>`).join('')}</nav>
<style>.admin-nav{display:flex;flex-wrap:wrap;gap:6px;margin:0 0 24px}.admin-nav a{padding:8px 14px;border:1px solid var(--line);border-radius:999px;text-decoration:none;color:var(--ink);background:var(--white)}.admin-nav a[aria-current]{background:var(--ink);color:var(--white)}.kpis{display:grid;grid-template-columns:repeat(auto-fill,minmax(170px,1fr));gap:12px;margin-bottom:24px}.kpi{background:var(--white);border:1px solid var(--line);border-radius:10px;padding:16px}.kpi strong{display:block;font-size:1.8rem}.kpi span{color:var(--muted);font-size:.9rem}.inline-form{display:inline}.mini{font-size:.85rem}table.data td,table.data th{vertical-align:top}.row-actions{display:flex;flex-wrap:wrap;gap:6px}</style>`;
  const page = (session, title, active, body, message) => html(consolePage({title: `${title} · Console`, session, wide: true, body: `<h1>Console do desenvolvedor</h1>${nav(active)}${notice(message)}${body}`}));
  const btn = (action, label, fields = {}, cls = 'ghost small', confirm = '') => `<form class="inline-form" method="post" action="${action}"${confirm ? ` onsubmit="return confirm('${esc(confirm)}')"` : ''}>${Object.entries(fields).map(([k, v]) => `<input type="hidden" name="${esc(k)}" value="${esc(v)}">`).join('')}<button class="button ${cls}" type="submit">${esc(label)}</button></form>`;
  const count = async (sql, ...a) => Number((await q(sql, ...a).first())?.n || 0);

  async function overview(session, message) {
    const stamp = now(), month = new Date(Date.now() - 30 * 864e5).toISOString();
    const members = (await q('SELECT * FROM members').all()).results, grants = (await q('SELECT * FROM module_grants').all()).results;
    const active = members.filter(m => { const e = resolveLicenses(m, grants.filter(g => g.member_id === m.id), stamp); return m.active && (e.advanced.active || e.basic.active); });
    const trials = grants.filter(g => g.source === 'trial' && !g.revoked && g.ends_at > stamp).length;
    const paid = (await q("SELECT COALESCE(SUM(amount_cents),0) AS n FROM payments WHERE status = 'approved' AND created_at >= ?", month).first())?.n || 0;
    const s = await settings();
    const k = [['Usuários com conta', await count('SELECT COUNT(*) AS n FROM auth_users')], ['Com acesso ativo', active.length], ['Em teste grátis', trials], ['Recebido em 30 dias', brl(Number(paid))], ['Projetos', await count('SELECT COUNT(*) AS n FROM projects')], ['Vistorias', await count('SELECT COUNT(*) AS n FROM inspections')], ['Pagamentos pendentes', await count("SELECT COUNT(*) AS n FROM payments WHERE status IN ('pending','divergent')")], ['Mensagens do site', await count('SELECT COUNT(*) AS n FROM contact_messages')]];
    // Acessos pagos ou concedidos que vencem nos próximos 30 dias (oportunidade de renovação) e testes que terminam em 7 dias
    const soon = new Date(Date.now() + 30 * 864e5).toISOString(), week = new Date(Date.now() + 7 * 864e5).toISOString();
    const expiring = members.filter(m => m.active && m.role !== 'admin').map(m => ({m, e: resolveLicenses(m, grants.filter(g => g.member_id === m.id), stamp)}))
      .map(({m, e}) => ({m, module: e.advanced.active ? 'Completo' : e.basic.active ? 'Básico' : null, endsAt: e.advanced.active ? e.advanced.endsAt : e.basic.endsAt, trial: e.advanced.active && e.advanced.sources.every(x => x === 'trial')}))
      .filter(x => x.module && x.endsAt && x.endsAt <= (x.trial ? week : soon)).sort((a, b) => a.endsAt.localeCompare(b.endsAt));
    const body = `${s.maintenance === '1' ? `<p class="notice error">Manutenção ligada: só administradores usam o sistema. <a href="${ADMIN_BASE}/sistema">Desligar</a></p>` : ''}
<div class="kpis">${k.map(([l, v]) => `<div class="kpi"><span>${esc(l)}</span><strong>${esc(v)}</strong></div>`).join('')}</div>
<div class="panel"><h2>Renovações a tratar (${expiring.length})</h2><p class="muted">Acessos pagos ou concedidos que vencem em 30 dias e testes grátis que terminam em 7 dias. Vale uma mensagem antes do vencimento.</p>${expiring.length ? `<div class="table-wrap"><table class="data mini"><thead><tr><th>Usuário</th><th>Acesso</th><th>Vence em</th></tr></thead><tbody>${expiring.map(x => `<tr><td>${esc(x.m.name)}<br><a href="${ADMIN_BASE}/usuarios/${encodeURIComponent(x.m.email)}">${esc(x.m.email)}</a></td><td>${x.module}${x.trial ? ' (teste grátis)' : ''}</td><td>${fmtDate(x.endsAt)}</td></tr>`).join('')}</tbody></table></div>` : '<p class="muted">Nada vencendo.</p>'}</div>
<div class="panel"><h2>Funcionamento</h2><table class="data"><tbody>
<tr><th>Banco de dados</th><td>${esc(db.dialect)} · conectado</td></tr>
<tr><th>E-mail de envio</th><td>${config.smtp ? 'configurado' : '<strong>não configurado</strong> (links aparecem nos logs)'}</td></tr>
<tr><th>Pagamento (Mercado Pago)</th><td>${config.mercadoPago?.accessToken ? 'ligado' : '<strong>desligado</strong>: registre pagamentos manualmente'}</td></tr>
<tr><th>IA</th><td>${config.ai?.apiKey ? 'configurada' : 'desligada'}</td></tr>
<tr><th>Aplicativos</th><td>Site, computador (Windows), Android e iOS usam este mesmo banco. Aplicativo Android: ${config.android?.packageName ? esc(config.android.packageName) : 'vínculo com a loja ainda não configurado (ANDROID_PACKAGE_NAME)'}.</td></tr>
</tbody></table></div>`;
    return page(session, 'Visão geral', '', body, message);
  }

  async function usersPage(session, url, message) {
    const term = String(url.searchParams.get('q') || '').trim().toLowerCase().slice(0, 100), stamp = now();
    const users = (await q('SELECT id,email,name,email_verified_at,failed_logins,locked_until,created_at FROM auth_users ORDER BY created_at DESC LIMIT 2000').all()).results;
    const members = (await q('SELECT * FROM members').all()).results, grants = (await q('SELECT * FROM module_grants').all()).results;
    const last = Object.fromEntries((await q('SELECT user_id, MAX(last_seen_at) AS seen FROM auth_sessions GROUP BY user_id').all()).results.map(r => [r.user_id, r.seen]));
    const byEmail = new Map(members.map(m => [m.email, m]));
    const emails = [...new Set([...users.map(u => u.email), ...members.map(m => m.email)])].filter(e => !term || e.includes(term) || (users.find(u => u.email === e)?.name || byEmail.get(e)?.name || '').toLowerCase().includes(term));
    const rows = emails.slice(0, 500).map(email => {
      const u = users.find(x => x.email === email), m = byEmail.get(email);
      const e = m ? resolveLicenses(m, grants.filter(g => g.member_id === m.id), stamp) : null;
      const access = !m ? '<span class="pill off">sem cadastro de membro</span>' : e.advanced.active ? `Completo ${e.advanced.permanent ? 'permanente' : 'até ' + fmtDate(e.advanced.endsAt)}` : e.basic.active ? `Básico ${e.basic.permanent ? 'permanente' : 'até ' + fmtDate(e.basic.endsAt)}` : '<span class="pill off">sem acesso</span>';
      const locked = u?.locked_until && u.locked_until > stamp;
      return `<tr><td><strong>${esc(u?.name || m?.name || '')}</strong><br><a href="${ADMIN_BASE}/usuarios/${encodeURIComponent(email)}">${esc(email)}</a></td><td>${m ? esc(ROLES[m.role] || m.role) + (m.active ? '' : ' · <strong>inativo</strong>') : '—'}</td><td>${access}</td><td>${u ? (u.email_verified_at ? 'confirmado' : '<strong>e-mail não confirmado</strong>') : 'sem conta de acesso'}${locked ? '<br><strong>bloqueado</strong>' : ''}</td><td>${u && last[u.id] ? fmtDateTime(last[u.id]) : '—'}</td></tr>`;
    });
    const body = `<div class="panel"><form method="get" action="${ADMIN_BASE}/usuarios" class="row2"><label class="field">Buscar por nome ou e-mail<input name="q" value="${esc(term)}"></label><div style="align-self:end"><button class="button small" type="submit">Buscar</button></div></form></div>
<div class="panel"><h2>Usuários (${emails.length}) <a class="button ghost small" href="${ADMIN_BASE}/usuarios.csv" style="float:right">Baixar CSV (Excel)</a></h2><div class="table-wrap"><table class="data"><thead><tr><th>Usuário</th><th>Papel</th><th>Acesso</th><th>Conta</th><th>Último uso</th></tr></thead><tbody>${rows.join('') || '<tr><td colspan="5">Nenhum usuário.</td></tr>'}</tbody></table></div></div>
<div class="panel"><h2>Cadastrar usuário</h2><p class="muted">Cria o cadastro, define o papel e envia o link para a pessoa criar a senha.</p><form class="stack" method="post" action="${ADMIN_BASE}/usuarios/novo"><div class="row2"><label class="field">Nome<input name="nome" required maxlength="200"></label><label class="field">E-mail<input name="email" type="email" required maxlength="254"></label></div><div class="row2"><label class="field">Papel<select name="papel">${Object.entries(ROLES).filter(([k]) => k !== 'member').map(([k, l]) => `<option value="${k}"${k === 'client_manager' ? ' selected' : ''}>${esc(l)}</option>`).join('')}</select></label><label class="field">Acesso inicial<select name="modulo"><option value="">Nenhum</option><option value="advanced">Completo</option><option value="basic">Básico</option></select></label></div><label class="field">Dias de acesso (0 = permanente)<input name="dias" type="number" min="0" max="3650" value="30"></label><div><button class="button teal" type="submit">Cadastrar e enviar link</button></div></form></div>`;
    return page(session, 'Usuários', '/usuarios', body, message);
  }

  // Lista de usuários em CSV (abre no Excel) para mala direta e acompanhamento comercial.
  async function usersCsv(admin) {
    const stamp = now(), members = (await q('SELECT * FROM members ORDER BY created_at').all()).results, grants = (await q('SELECT * FROM module_grants').all()).results;
    const users = Object.fromEntries((await q('SELECT email, email_verified_at, created_at FROM auth_users').all()).results.map(u => [u.email, u]));
    const cell = v => '"' + String(v ?? '').replace(/"/g, '""') + '"';
    const lines = [['Nome', 'E-mail', 'Papel', 'Ativo', 'Acesso', 'Vence em', 'Origem', 'Conta criada', 'E-mail confirmado'].join(';')];
    for (const m of members) {
      const e = resolveLicenses(m, grants.filter(g => g.member_id === m.id), stamp), st = e.advanced.active ? e.advanced : e.basic.active ? e.basic : null;
      lines.push([m.name, m.email, ROLES[m.role] || m.role, m.active ? 'sim' : 'não', e.advanced.active ? 'Completo' : e.basic.active ? 'Básico' : 'nenhum', st ? (st.permanent ? 'permanente' : fmtDate(st.endsAt)) : '', st ? st.sources.join(',') : '', fmtDate(users[m.email]?.created_at), users[m.email]?.email_verified_at ? 'sim' : 'não'].map(cell).join(';'));
    }
    await audit(admin, 'users-export', {count: members.length});
    return new Response('\ufeff' + lines.join('\r\n'), {headers: {'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="silsec-usuarios-${stamp.slice(0, 10)}.csv"`, 'Cache-Control': 'no-store'}});
  }

  async function userPage(session, email, message) {
    const u = await q('SELECT * FROM auth_users WHERE email = ?', email).first(), m = await q('SELECT * FROM members WHERE email = ?', email).first();
    if (!u && !m) return page(session, 'Usuário', '/usuarios', '<p>Usuário não encontrado.</p>');
    const grants = m ? (await q('SELECT * FROM module_grants WHERE member_id = ? ORDER BY created_at DESC', m.id).all()).results : [];
    const sessions = u ? (await q('SELECT created_at,last_seen_at,expires_at,ip,user_agent FROM auth_sessions WHERE user_id = ? ORDER BY last_seen_at DESC LIMIT 20', u.id).all()).results : [];
    const projects = m ? (await q('SELECT id,name,status,updated_at FROM projects WHERE owner_id = ? ORDER BY updated_at DESC LIMIT 100', m.id).all()).results : [];
    const payments = m ? (await q('SELECT * FROM payments WHERE member_id = ? ORDER BY created_at DESC LIMIT 50', m.id).all()).results : [];
    const e = m ? resolveLicenses(m, grants, now()) : null, base = `${ADMIN_BASE}/usuarios/${encodeURIComponent(email)}`;
    const sourceName = {trial: 'teste', mercadopago: 'anuidade paga', concession: 'concessão', key: 'chave', education: 'educacional', manual: 'pagamento manual'};
    const body = `<p><a href="${ADMIN_BASE}/usuarios">← Usuários</a></p><h2>${esc(u?.name || m?.name || '')} · ${esc(email)}</h2>
<div class="panel"><h3>Situação</h3><table class="data"><tbody>
<tr><th>Conta de acesso</th><td>${u ? `criada em ${fmtDate(u.created_at)} · ${u.email_verified_at ? 'e-mail confirmado' : '<strong>e-mail não confirmado</strong>'} · ${u.failed_logins} tentativa(s) errada(s)${u.locked_until && u.locked_until > now() ? ' · <strong>bloqueada até ' + fmtDateTime(u.locked_until) + '</strong>' : ''}` : 'não criou senha ainda'}</td></tr>
<tr><th>Cadastro de membro</th><td>${m ? `${esc(ROLES[m.role] || m.role)} · ${m.active ? 'ativo' : '<strong>inativo</strong>'}${m.is_owner ? ' · proprietário' : ''}` : 'não existe'}</td></tr>
<tr><th>Acesso aos módulos</th><td>${e ? `Completo: ${e.advanced.active ? (e.advanced.permanent ? 'permanente' : 'até ' + fmtDate(e.advanced.endsAt)) : 'não'} · Básico: ${e.basic.active ? (e.basic.permanent ? 'permanente' : 'até ' + fmtDate(e.basic.endsAt)) : 'não'}` : '—'}</td></tr>
</tbody></table>
<div class="row-actions" style="margin-top:14px">${u ? btn(base + '/senha', 'Enviar link de nova senha') + btn(base + '/desbloquear', 'Desbloquear conta') + (u.email_verified_at ? '' : btn(base + '/confirmar', 'Confirmar e-mail manualmente')) + btn(base + '/sessoes', 'Encerrar sessões em todos os aparelhos', {}, 'ghost small', 'Encerrar todas as sessões deste usuário?') : ''}${m ? btn(base + '/ativo', m.active ? 'Desativar membro' : 'Reativar membro', {ativo: m.active ? '0' : '1'}, 'ghost small', m.active ? 'Desativar este usuário? Ele perde o acesso em todos os aparelhos.' : '') : ''}</div></div>
${m ? `<div class="panel"><h3>Papel</h3><form method="post" action="${base}/papel" class="row2"><label class="field">Papel<select name="papel">${Object.entries(ROLES).filter(([k]) => k !== 'member').map(([k, l]) => `<option value="${k}"${m.role === k ? ' selected' : ''}>${esc(l)}</option>`).join('')}</select></label><div style="align-self:end"><button class="button small" type="submit">Salvar papel</button></div></form></div>` : ''}
<div class="panel"><h3>Conceder acesso</h3><form method="post" action="${base}/conceder" class="row2"><label class="field">Módulo<select name="modulo"><option value="advanced">Completo</option><option value="basic">Básico</option></select></label><label class="field">Dias (0 = permanente)<input name="dias" type="number" min="0" max="3650" value="365"></label><label class="field">Motivo<input name="motivo" maxlength="200" placeholder="Ex.: Pix recebido, cortesia, turma"></label><div style="align-self:end"><button class="button teal small" type="submit">Conceder</button></div></form>
${grants.length ? `<div class="table-wrap"><table class="data mini"><thead><tr><th>Módulo</th><th>Origem</th><th>Início</th><th>Fim</th><th>Situação</th><th></th></tr></thead><tbody>${grants.map(g => `<tr><td>${MODULES[g.module] || esc(g.module)}</td><td>${esc(sourceName[g.source] || g.source)}</td><td>${fmtDate(g.starts_at)}</td><td>${g.ends_at ? fmtDate(g.ends_at) : 'permanente'}</td><td>${g.revoked ? 'revogada' : g.ends_at && g.ends_at <= now() ? 'vencida' : 'ativa'}</td><td>${g.revoked ? '' : btn(base + '/revogar', 'Revogar', {grant: g.id}, 'ghost small', 'Revogar este acesso?')}</td></tr>`).join('')}</tbody></table></div>` : ''}</div>
<div class="panel"><h3>Projetos (${projects.length})</h3>${projects.length ? `<ul>${projects.map(p => `<li>${esc(p.name)} · ${esc(p.status)} · ${fmtDateTime(p.updated_at)} · <a href="${ADMIN_BASE}/projetos/${esc(p.id)}.json">baixar JSON</a></li>`).join('')}</ul>` : '<p class="muted">Nenhum projeto.</p>'}</div>
<div class="panel"><h3>Pagamentos</h3>${payments.length ? `<ul>${payments.map(p => `<li>${fmtDateTime(p.created_at)} · ${MODULES[p.module] || esc(p.module)} · ${brl(p.amount_cents)} · ${esc(p.status)}</li>`).join('')}</ul>` : '<p class="muted">Nenhum pagamento.</p>'}</div>
<div class="panel"><h3>Sessões recentes</h3>${sessions.length ? `<ul class="mini">${sessions.map(x => `<li>${fmtDateTime(x.last_seen_at)} · ${esc(x.ip)} · ${esc((x.user_agent || '').slice(0, 90))}</li>`).join('')}</ul>` : '<p class="muted">Nenhuma sessão.</p>'}</div>`;
    return page(session, email, '/usuarios', body, message);
  }

  async function grantAccess(admin, member, module, days, reason, source = 'concession') {
    const stamp = now(), grants = (await q('SELECT * FROM module_grants WHERE member_id = ?', member.id).all()).results;
    const covering = grants.filter(g => !g.revoked && g.ends_at && g.ends_at > stamp && (!g.token_hash || g.redeemed_at) && (g.module === module || g.module === 'advanced')).map(g => g.ends_at).sort().pop();
    const start = covering || stamp, endsAt = days > 0 ? new Date(Date.parse(start) + days * 864e5).toISOString() : null, id = 'adm:' + randomUUID();
    await q('INSERT INTO module_grants (id,member_id,module,source,starts_at,ends_at,created_by,created_at) VALUES (?,?,?,?,?,?,?,?)', id, member.id, module, source, stamp, endsAt, admin.id, stamp).run();
    await audit(admin, 'grant', {member: member.email, module, days, endsAt, reason});
    return endsAt;
  }

  async function userAction(request, session, admin, email, action) {
    const f = new URLSearchParams(await request.text()), back = `${ADMIN_BASE}/usuarios/${encodeURIComponent(email)}`;
    const u = await q('SELECT * FROM auth_users WHERE email = ?', email).first(), m = await q('SELECT * FROM members WHERE email = ?', email).first();
    const done = text => userPage(session, email, {kind: 'ok', text}), fail = text => userPage(session, email, {kind: 'error', text});
    if (action === 'senha' && u) { await auth.sendPasswordLink(request, {email, name: u.name, next: '/sistema', reset: true}); await audit(admin, 'password-link', {email}); return done('Link de nova senha enviado.'); }
    if (action === 'desbloquear' && u) { await q('UPDATE auth_users SET failed_logins = 0, locked_until = NULL, updated_at = ? WHERE id = ?', now(), u.id).run(); await audit(admin, 'unlock', {email}); return done('Conta desbloqueada.'); }
    if (action === 'confirmar' && u) { await q('UPDATE auth_users SET email_verified_at = ?, updated_at = ? WHERE id = ? AND email_verified_at IS NULL', now(), now(), u.id).run(); await audit(admin, 'verify-email', {email}); return done('E-mail confirmado manualmente. A pessoa ainda precisa de uma senha: envie o link de nova senha.'); }
    if (action === 'sessoes' && u) { await q('DELETE FROM auth_sessions WHERE user_id = ?', u.id).run(); await audit(admin, 'end-sessions', {email}); return done('Sessões encerradas em todos os aparelhos.'); }
    if (action === 'ativo' && m) {
      if (m.is_owner && f.get('ativo') === '0') return fail('O proprietário não pode ser desativado.');
      await q('UPDATE members SET active = ? WHERE id = ?', f.get('ativo') === '1' ? 1 : 0, m.id).run();
      if (f.get('ativo') !== '1' && u) await q('DELETE FROM auth_sessions WHERE user_id = ?', u.id).run();
      await audit(admin, 'member-active', {email, active: f.get('ativo') === '1'}); return done(f.get('ativo') === '1' ? 'Membro reativado.' : 'Membro desativado e desconectado.');
    }
    if (action === 'papel' && m) {
      const role = String(f.get('papel') || ''); if (!ROLES[role]) return fail('Papel inválido.');
      if (m.is_owner && role !== 'admin') return fail('O proprietário continua administrador.');
      await q('UPDATE members SET role = ? WHERE id = ?', role, m.id).run(); await audit(admin, 'role', {email, role}); return done('Papel atualizado.');
    }
    if (action === 'conceder') {
      const module = MODULES[f.get('modulo')] ? String(f.get('modulo')) : null, days = Math.max(0, Math.min(3650, Number(f.get('dias')) || 0));
      if (!module) return fail('Escolha o módulo.');
      let member = m;
      if (!member) { const id = randomUUID(); await q("INSERT INTO members (id,email,name,role,active,is_owner,created_at) VALUES (?,?,?,'client_manager',1,0,?)", id, email, u?.name || email, now()).run(); member = await q('SELECT * FROM members WHERE id = ?', id).first(); }
      const endsAt = await grantAccess(admin, member, module, days, String(f.get('motivo') || '').slice(0, 200));
      return done(`Acesso ${MODULES[module]} concedido ${endsAt ? 'até ' + fmtDate(endsAt) : 'sem prazo'}.`);
    }
    if (action === 'revogar' && m) { const r = await q('UPDATE module_grants SET revoked = 1 WHERE id = ? AND member_id = ?', String(f.get('grant') || ''), m.id).run(); await audit(admin, 'revoke', {email, grant: f.get('grant')}); return r.meta.changes ? done('Acesso revogado.') : fail('Acesso não encontrado.'); }
    return redirect(back);
  }

  async function createUser(request, session, admin) {
    const f = new URLSearchParams(await request.text()), email = String(f.get('email') || '').trim().toLowerCase(), name = String(f.get('nome') || '').trim().slice(0, 200), role = String(f.get('papel') || 'client_manager');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !name || !ROLES[role]) return usersPage(session, new URL(request.url), {kind: 'error', text: 'Informe nome, e-mail válido e papel.'});
    let m = await q('SELECT * FROM members WHERE email = ?', email).first();
    if (!m) { const id = randomUUID(); await q('INSERT INTO members (id,email,name,role,active,is_owner,created_at) VALUES (?,?,?,?,1,0,?)', id, email, name, role, now()).run(); m = await q('SELECT * FROM members WHERE id = ?', id).first(); }
    const module = MODULES[f.get('modulo')] ? String(f.get('modulo')) : null, days = Math.max(0, Math.min(3650, Number(f.get('dias')) || 0));
    if (module) await grantAccess(admin, m, module, days, 'cadastro pelo console');
    const r = await auth.sendPasswordLink(request, {email, name, next: '/sistema'});
    await audit(admin, 'create-user', {email, role, module, days});
    return redirect(`${ADMIN_BASE}/usuarios/${encodeURIComponent(email)}?ok=${r.existing ? 'existente' : r.failure ? 'falha' : 'criado'}`);
  }

  async function paymentsPage(session, message) {
    const rows = (await q('SELECT p.*, m.email, m.name FROM payments p LEFT JOIN members m ON m.id = p.member_id ORDER BY p.created_at DESC LIMIT 300').all()).results;
    const body = `<div class="panel"><h2>Registrar pagamento recebido fora do Mercado Pago</h2><p class="muted">Use quando o cliente pagou por Pix direto, transferência ou boleto. Libera 12 meses a partir do fim do acesso atual.</p>
<form class="stack" method="post" action="${ADMIN_BASE}/pagamentos/manual"><div class="row2"><label class="field">E-mail do cliente<input name="email" type="email" required></label><label class="field">Plano<select name="modulo"><option value="advanced">Completo</option><option value="basic">Básico</option></select></label></div><div class="row2"><label class="field">Valor recebido (R$)<input name="valor" inputmode="decimal" required placeholder="797,00"></label><label class="field">Comprovante ou observação<input name="nota" maxlength="200"></label></div><div><button class="button teal" type="submit">Registrar e liberar 12 meses</button></div></form></div>
<div class="panel"><h2>Pagamentos</h2><div class="table-wrap"><table class="data"><thead><tr><th>Data</th><th>Cliente</th><th>Plano</th><th>Valor</th><th>Situação</th><th>Acesso até</th><th></th></tr></thead><tbody>${rows.map(p => `<tr><td>${fmtDateTime(p.created_at)}</td><td>${esc(p.name || '')}<br><a href="${ADMIN_BASE}/usuarios/${encodeURIComponent(p.email || '')}">${esc(p.email || '')}</a></td><td>${MODULES[p.module] || esc(p.module)}</td><td>${brl(p.amount_cents)}</td><td>${esc(p.status)}${p.provider === 'manual' ? ' · manual' : ''}</td><td>${fmtDate(p.access_until)}</td><td>${['pending', 'divergent', 'failed', 'created'].includes(p.status) ? btn(`${ADMIN_BASE}/pagamentos/${esc(p.id)}/aprovar`, 'Aprovar manualmente', {}, 'ghost small', 'Confirmar que este pagamento foi recebido e liberar 12 meses?') : ''}</td></tr>`).join('') || '<tr><td colspan="7">Nenhum pagamento.</td></tr>'}</tbody></table></div></div>`;
    return page(session, 'Pagamentos', '/pagamentos', body, message);
  }

  async function approvePayment(admin, payment, note) {
    const stamp = now(), grants = (await q('SELECT * FROM module_grants WHERE member_id = ?', payment.member_id).all()).results;
    const covering = grants.filter(g => !g.revoked && g.ends_at && g.ends_at > stamp && (!g.token_hash || g.redeemed_at) && (g.module === payment.module || g.module === 'advanced')).map(g => g.ends_at).sort().pop();
    const endsAt = addCalendarMonths(covering || stamp, 12), grantId = 'manual:' + payment.id;
    await q("INSERT INTO module_grants (id,member_id,module,source,starts_at,ends_at,created_by,created_at) VALUES (?,?,?,'manual',?,?,?,?)", grantId, payment.member_id, payment.module, stamp, endsAt, admin.id, stamp).run();
    await q("UPDATE payments SET status = 'approved', grant_id = ?, access_until = ?, paid_at = COALESCE(paid_at, ?), updated_at = ? WHERE id = ?", grantId, endsAt, stamp, stamp, payment.id).run();
    await audit(admin, 'payment-approve', {payment: payment.id, endsAt, note});
    return endsAt;
  }

  async function paymentAction(request, session, admin, id) {
    const p = await q('SELECT * FROM payments WHERE id = ?', id).first();
    if (!p || p.status === 'approved') return paymentsPage(session, {kind: 'error', text: 'Pagamento não encontrado ou já aprovado.'});
    const endsAt = await approvePayment(admin, p, 'aprovação manual');
    return paymentsPage(session, {kind: 'ok', text: `Pagamento aprovado. Acesso liberado até ${fmtDate(endsAt)}.`});
  }

  async function manualPayment(request, session, admin) {
    const f = new URLSearchParams(await request.text()), email = String(f.get('email') || '').trim().toLowerCase(), module = MODULES[f.get('modulo')] ? String(f.get('modulo')) : null;
    const cents = Math.round(Number(String(f.get('valor') || '').replace(/\./g, '').replace(',', '.')) * 100);
    if (!module || !(cents > 0)) return paymentsPage(session, {kind: 'error', text: 'Informe plano e valor.'});
    let m = await q('SELECT * FROM members WHERE email = ?', email).first();
    if (!m) { const u = await q('SELECT name FROM auth_users WHERE email = ?', email).first(); if (!u) return paymentsPage(session, {kind: 'error', text: 'Cliente não encontrado. Cadastre o usuário antes.'}); const mid = randomUUID(); await q("INSERT INTO members (id,email,name,role,active,is_owner,created_at) VALUES (?,?,?,'client_manager',1,0,?)", mid, email, u.name, now()).run(); m = await q('SELECT * FROM members WHERE id = ?', mid).first(); }
    const id = randomUUID();
    await q("INSERT INTO payments (id,member_id,module,amount_cents,status,provider,provider_status,created_at,updated_at) VALUES (?,?,?,?,'created','manual',?,?,?)", id, m.id, module, cents, String(f.get('nota') || '').slice(0, 64), now(), now()).run();
    const endsAt = await approvePayment(admin, {id, member_id: m.id, module}, String(f.get('nota') || '').slice(0, 200));
    return paymentsPage(session, {kind: 'ok', text: `Pagamento registrado. ${email} com acesso ${MODULES[module]} até ${fmtDate(endsAt)}.`});
  }

  async function projectsPage(session, url) {
    const term = String(url.searchParams.get('q') || '').trim().toLowerCase().slice(0, 100);
    const rows = (await q('SELECT p.id,p.name,p.status,p.updated_at,m.email FROM projects p LEFT JOIN members m ON m.id = p.owner_id ORDER BY p.updated_at DESC LIMIT 500').all()).results.filter(r => !term || (r.name || '').toLowerCase().includes(term) || (r.email || '').includes(term));
    const body = `<div class="panel"><form method="get" class="row2"><label class="field">Buscar projeto ou e-mail<input name="q" value="${esc(term)}"></label><div style="align-self:end"><button class="button small">Buscar</button></div></form></div>
<div class="panel"><div class="table-wrap"><table class="data"><thead><tr><th>Projeto</th><th>Responsável</th><th>Situação</th><th>Atualizado</th><th></th></tr></thead><tbody>${rows.map(r => `<tr><td>${esc(r.name)}</td><td><a href="${ADMIN_BASE}/usuarios/${encodeURIComponent(r.email || '')}">${esc(r.email || '')}</a></td><td>${esc(r.status)}</td><td>${fmtDateTime(r.updated_at)}</td><td><a href="${ADMIN_BASE}/projetos/${esc(r.id)}.json">baixar JSON</a></td></tr>`).join('') || '<tr><td colspan="5">Nenhum projeto.</td></tr>'}</tbody></table></div></div>`;
    return page(session, 'Projetos', '/projetos', body);
  }

  async function systemPage(session, message) {
    const s = await settings(), migrations = (await q('SELECT name, applied_at FROM schema_migrations ORDER BY name').all().catch(() => ({results: []}))).results;
    const body = `<div class="panel"><h2>Modo de manutenção</h2><p>Quando ligado, o site, os aplicativos de computador e de celular mostram a mensagem abaixo e só administradores conseguem usar o sistema. Use durante atualizações ou em caso de problema.</p>
<form class="stack" method="post" action="${ADMIN_BASE}/sistema/manutencao"><label class="field">Mensagem para os usuários<input name="mensagem" maxlength="300" value="${esc(s.maintenance_message || 'O SilSec está em manutenção. Voltamos em instantes.')}"></label><div>${s.maintenance === '1' ? '<button class="button teal" name="ligar" value="0">Desligar manutenção</button>' : '<button class="button" name="ligar" value="1">Ligar manutenção</button>'}</div></form></div>
<div class="panel"><h2>Aviso para todos os usuários</h2><p class="muted">Mostrado no topo do programa em todos os aparelhos (deixe vazio para retirar).</p><form class="stack" method="post" action="${ADMIN_BASE}/sistema/aviso"><label class="field">Aviso<input name="aviso" maxlength="300" value="${esc(s.announcement || '')}"></label><div><button class="button small">Salvar aviso</button></div></form></div>
<div class="panel"><h2>Cópia de segurança</h2><p>Baixa todos os dados do sistema (usuários, acessos, pagamentos, projetos, clientes, vistorias e auditoria) em um arquivo JSON. Senhas saem só como hash. Os anexos ficam fora desta cópia; a Hostinger mantém cópias completas do banco em Backups.</p><a class="button small" href="${ADMIN_BASE}/sistema/backup.json">Baixar cópia de segurança</a></div>
<div class="panel"><h2>Banco de dados</h2><p>${esc(db.dialect)} · ${migrations.length} migração(ões) aplicada(s): ${migrations.map(x => esc(x.name)).join(', ')}</p></div>
${mailPanel(session)}`;
    return page(session, 'Sistema', '/sistema', body, message);
  }

  // Envio de e-mail: situação da configuração, último erro em português e botão de teste.
  function mailPanel(session) {
    const m = auth.mailer, st = m?.status ? m.status() : {configured: !!auth.mailConfigured()};
    const cfg = st.configured ? `Servidor ${esc(st.host)}:${esc(st.port)} · ${st.secure ? 'conexão segura (SSL/TLS)' : 'STARTTLS'} · usuário ${esc(st.user || '(sem autenticação)')} · remetente ${esc(st.from)}` : 'Envio de e-mail não configurado: defina SMTP_PASSWORD (e, se preciso, SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_FROM) nas variáveis de ambiente do site.';
    const last = st.lastError ? `<p class="notice error">Última falha em ${esc(fmtDateTime(st.lastError.at))}: ${esc(st.lastError.reason)}</p>` : st.lastDeliveredAt ? `<p class="notice ok">Último envio com sucesso em ${esc(fmtDateTime(st.lastDeliveredAt))}.</p>` : '';
    return `<div class="panel" id="email"><h2>Envio de e-mail</h2><p class="muted">${cfg}</p>${last}<form class="stack" method="post" action="${ADMIN_BASE}/sistema/email-teste"><label class="field">Enviar e-mail de teste para<input name="para" type="email" required value="${esc(session.email)}"></label><div><button class="button small" ${st.configured ? '' : 'disabled'}>Testar envio de e-mail</button></div></form></div>`;
  }
  async function mailTest(request, session, admin) {
    const f = new URLSearchParams(await request.text()), to = String(f.get('para') || session.email).trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) return systemPage(session, {kind: 'erro', text: 'Informe um e-mail válido para o teste.'});
    const r = await auth.mailer.test(to);
    await audit(admin, 'mail-test', {to, delivered: r.delivered, code: r.code || null});
    return systemPage(session, r.delivered ? {kind: 'ok', text: `E-mail de teste enviado para ${to} em ${r.ms} ms. Confira a caixa de entrada (e o spam).`} : {kind: 'erro', text: `O envio falhou: ${r.reason}`});
  }

  async function backup(admin) {
    const out = {app: 'SilSec', generatedAt: now(), generatedBy: admin.email, tables: {}};
    for (const t of BACKUP_TABLES) { try { out.tables[t] = (await q(`SELECT * FROM ${t}`).all()).results; } catch { out.tables[t] = null; } }
    await audit(admin, 'backup', {tables: Object.keys(out.tables).length});
    return new Response(JSON.stringify(out), {headers: {'Content-Type': 'application/json; charset=utf-8', 'Content-Disposition': `attachment; filename="silsec-backup-${now().slice(0, 10)}.json"`, 'Cache-Control': 'no-store'}});
  }

  async function auditPage(session) {
    const rows = (await q('SELECT * FROM audit_log ORDER BY created_at DESC LIMIT 300').all()).results;
    const body = `<div class="panel"><div class="table-wrap"><table class="data mini"><thead><tr><th>Quando</th><th>Quem</th><th>Evento</th><th>Detalhes</th></tr></thead><tbody>${rows.map(r => `<tr><td>${fmtDateTime(r.created_at)}</td><td>${esc(r.actor_email)}</td><td>${esc(r.event)}</td><td>${esc(String(r.data_json || '').slice(0, 200))}</td></tr>`).join('')}</tbody></table></div></div>`;
    return page(session, 'Auditoria', '/auditoria', body);
  }

  async function handle(request) {
    const url = new URL(request.url), path = url.pathname, method = request.method;
    if (path !== ADMIN_BASE && !path.startsWith(ADMIN_BASE + '/')) return null;
    const session = await auth.sessionUser(request);
    if (!session) return redirect('/entrar?volta=' + encodeURIComponent(path));
    const admin = await adminFor(session);
    if (!admin) return html(consolePage({title: 'Console', session, body: '<h1>Console do desenvolvedor</h1><p class="lead">Área exclusiva da administração.</p>'}), 403);
    if (method === 'POST' && !auth.sameOrigin(request)) return html('Origem não autorizada.', 403);
    const rest = path.slice(ADMIN_BASE.length) || '/';
    try {
      if (rest === '/') return overview(session);
      if (rest === '/usuarios' && method === 'GET') return usersPage(session, url);
      if (rest === '/usuarios.csv') return usersCsv(admin);
      if (rest === '/usuarios/novo' && method === 'POST') return createUser(request, session, admin);
      const um = rest.match(/^\/usuarios\/([^/]+)(?:\/([a-z]+))?$/);
      if (um) {
        const email = decodeURIComponent(um[1]).toLowerCase();
        if (um[2] && method === 'POST') return userAction(request, session, admin, email, um[2]);
        const ok = url.searchParams.get('ok');
        return userPage(session, email, ok ? (ok === 'falha' ? {kind: 'erro', text: `Usuário cadastrado, mas o e-mail com o link não saiu: ${auth.mailer?.status().lastError?.reason || 'falha no envio'} O link está no registro do servidor (Logs); teste o envio em Sistema.`} : {kind: 'ok', text: ok === 'existente' ? 'Usuário já tinha conta: cadastro atualizado.' : 'Usuário cadastrado. Enviamos o link para criar a senha.'}) : null);
      }
      if (rest === '/pagamentos') return paymentsPage(session);
      if (rest === '/pagamentos/manual' && method === 'POST') return manualPayment(request, session, admin);
      const pm = rest.match(/^\/pagamentos\/([A-Za-z0-9-]{1,64})\/aprovar$/);
      if (pm && method === 'POST') return paymentAction(request, session, admin, pm[1]);
      if (rest === '/projetos') return projectsPage(session, url);
      const pj = rest.match(/^\/projetos\/([A-Za-z0-9-]{1,64})\.json$/);
      if (pj) {
        const p = await q('SELECT * FROM projects WHERE id = ?', pj[1]).first();
        if (!p) return new Response('Não encontrado', {status: 404});
        await audit(admin, 'project-export', {project: p.id});
        return new Response(JSON.stringify({id: p.id, name: p.name, study: JSON.parse(p.study_json), updatedAt: p.updated_at}, null, 2), {headers: {'Content-Type': 'application/json; charset=utf-8', 'Content-Disposition': `attachment; filename="projeto-${p.id}.json"`}});
      }
      if (rest === '/sistema') return systemPage(session);
      if (rest === '/sistema/email-teste' && method === 'POST') return mailTest(request, session, admin);
      if (rest === '/sistema/backup.json') return backup(admin);
      if (rest === '/sistema/manutencao' && method === 'POST') {
        const f = new URLSearchParams(await request.text()), on = f.get('ligar') === '1';
        await setSetting('maintenance', on ? '1' : '0'); await setSetting('maintenance_message', String(f.get('mensagem') || '').slice(0, 300));
        await audit(admin, 'maintenance', {on}); return systemPage(session, {kind: 'ok', text: on ? 'Manutenção ligada.' : 'Manutenção desligada.'});
      }
      if (rest === '/sistema/aviso' && method === 'POST') {
        const f = new URLSearchParams(await request.text()); await setSetting('announcement', String(f.get('aviso') || '').slice(0, 300));
        await audit(admin, 'announcement', {}); return systemPage(session, {kind: 'ok', text: 'Aviso salvo.'});
      }
      if (rest === '/auditoria') return auditPage(session);
      return redirect(ADMIN_BASE);
    } catch (error) {
      log.error('[console]', error);
      return page(session, 'Erro', '', '', {kind: 'error', text: 'Não foi possível concluir a ação. Veja os logs do servidor.'});
    }
  }
  return {handle, maintenance, settings};
}
