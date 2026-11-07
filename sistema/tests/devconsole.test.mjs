// Console do desenvolvedor (/admin), modo de manutenção, aviso geral e aplicativo instalável (PWA).
import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readConfig} from '../server/platform/config.mjs';
import {createApp} from '../server/platform/app.mjs';
import {openMysql, openSqlite} from '../server/platform/database.mjs';

const OWNER = 'dono@silsec.test';
const FP = Array.from({length: 32}, (_, i) => i.toString(16).padStart(2, '0').toUpperCase()).join(':');

async function boot(extraEnv = {}) {
  const sent = [];
  const mailer = {configured: true, async send(m) { sent.push(m); return {delivered: true}; }};
  const config = readConfig({SITE_OWNER_EMAIL: OWNER, DB_DRIVER: 'sqlite', SQLITE_FILE: ':memory:', ...extraEnv});
  let db;
  if (process.env.TEST_MYSQL_URL) {
    const u = new URL(process.env.TEST_MYSQL_URL), name = 'silsec_d' + process.pid + '_' + Math.random().toString(36).slice(2, 8);
    const cfg = {host: u.hostname, port: +u.port || 3306, user: decodeURIComponent(u.username), password: decodeURIComponent(u.password)};
    const admin = await openMysql(cfg); await admin.exec('CREATE DATABASE `' + name + '`'); await admin.close();
    db = await openMysql({...cfg, database: name});
  } else db = await openSqlite(':memory:');
  const app = await createApp(config, {db, mailer, log: {log() {}, warn() {}, error: (...a) => console.error(...a)}});
  const server = createServer(app.handler);
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const base = 'http://127.0.0.1:' + server.address().port, jar = {};
  async function req(path, {method = 'GET', form, user = 'a', headers = {}} = {}) {
    const h = {...headers}; if (jar[user]) h.cookie = jar[user];
    let body;
    if (form) { body = new URLSearchParams(form).toString(); h['content-type'] = 'application/x-www-form-urlencoded'; h.origin ??= base; }
    const r = await fetch(base + path, {method, headers: h, body, redirect: 'manual'});
    for (const c of r.headers.getSetCookie()) { const v = c.split(';')[0]; jar[user] = v.endsWith('=') ? '' : v; }
    return {status: r.status, location: r.headers.get('location'), text: await r.text(), headers: r.headers};
  }
  async function signup(email, name, user, password) {
    if (email === OWNER) await req('/cadastrar', {user, method: 'POST', form: {nome: name, email}});
    else await req('/admin/usuarios/novo', {user: 'owner', method: 'POST', form: {nome: name, email, papel: 'client_manager', modulo: '', dias: '0'}});
    assert.equal(sent.at(-1).to, email);
    const link = new URL(sent.at(-1).text.match(/https?:\/\/\S+/)[0]);
    await req(link.pathname + link.search, {user});
    await req('/verificar', {user, method: 'POST', form: {token: link.searchParams.get('token'), senha: password, volta: '/sistema'}});
    assert.equal((await req('/api/session', {user})).status, 200);
  }
  return {app, req, sent, signup, db, async close() { await new Promise(r => server.close(r)); await app.close(); }};
}

test('console do desenvolvedor: só administradores, usuários, acessos, sessões e auditoria', async () => {
  const t = await boot();
  try {
    assert.equal((await t.req('/admin')).status, 303, 'sem login vai para /entrar');
    await t.signup(OWNER, 'Fabio', 'owner', 'senha-do-dono-123');
    await t.signup('cliente@empresa.test', 'Cliente', 'cli', 'senha-do-cliente-123');
    assert.equal((await t.req('/admin', {user: 'cli'})).status, 403, 'cliente não entra no console');
    const home = await t.req('/admin', {user: 'owner'});
    assert.equal(home.status, 200); assert.match(home.text, /Usuários com conta/);
    assert.match((await t.req('/admin/usuarios?q=cliente', {user: 'owner'})).text, /cliente@empresa\.test/);

    // origem estranha é recusada
    assert.equal((await t.req('/admin/usuarios/cliente%40empresa.test/conceder', {user: 'owner', method: 'POST', form: {modulo: 'advanced', dias: '30'}, headers: {origin: 'https://ataque.test'}})).status, 403);
    const granted = await t.req('/admin/usuarios/cliente%40empresa.test/conceder', {user: 'owner', method: 'POST', form: {modulo: 'advanced', dias: '30', motivo: 'Pix'}});
    assert.match(granted.text, /Acesso Completo concedido até/);
    const g = await t.db.prepare("SELECT * FROM module_grants WHERE source = 'concession'").bind().first();
    assert.equal(g.module, 'advanced');
    assert.match((await t.req('/admin/usuarios/cliente%40empresa.test/revogar', {user: 'owner', method: 'POST', form: {grant: g.id}})).text, /Acesso revogado/);

    // bloqueio, sessões e desativação
    await t.db.prepare("UPDATE auth_users SET failed_logins = 9, locked_until = '2999-01-01T00:00:00.000Z' WHERE email = ?").bind('cliente@empresa.test').run();
    await t.req('/admin/usuarios/cliente%40empresa.test/desbloquear', {user: 'owner', method: 'POST', form: {}});
    assert.equal((await t.db.prepare('SELECT failed_logins FROM auth_users WHERE email = ?').bind('cliente@empresa.test').first()).failed_logins, 0);
    await t.req('/admin/usuarios/cliente%40empresa.test/sessoes', {user: 'owner', method: 'POST', form: {}});
    assert.equal((await t.req('/api/session', {user: 'cli'})).status, 401, 'sessões do cliente encerradas');
    const before = t.sent.length;
    await t.req('/admin/usuarios/cliente%40empresa.test/senha', {user: 'owner', method: 'POST', form: {}});
    assert.equal(t.sent.length, before + 1); assert.match(t.sent.at(-1).text, /redefinir-senha\?token=/);
    await t.req('/admin/usuarios/cliente%40empresa.test/papel', {user: 'owner', method: 'POST', form: {papel: 'manager'}});
    assert.equal((await t.db.prepare('SELECT role FROM members WHERE email = ?').bind('cliente@empresa.test').first()).role, 'manager');
    assert.match((await t.req(`/admin/usuarios/${encodeURIComponent(OWNER)}/ativo`, {user: 'owner', method: 'POST', form: {ativo: '0'}})).text, /proprietário não pode/);

    // cadastro pelo console
    await t.req('/admin/usuarios/novo', {user: 'owner', method: 'POST', form: {nome: 'Novo', email: 'novo@obra.test', papel: 'client_manager', modulo: 'basic', dias: '0'}});
    assert.equal(t.sent.at(-1).to, 'novo@obra.test');
    const novo = await t.db.prepare("SELECT g.ends_at FROM module_grants g JOIN members m ON m.id = g.member_id WHERE m.email = 'novo@obra.test'").bind().first();
    assert.equal(novo.ends_at, null, 'acesso permanente');

    const csv = await t.req('/admin/usuarios.csv', {user: 'owner'});
    assert.match(csv.headers.get('content-type'), /text\/csv/); assert.match(csv.text, /"novo@obra\.test";"Cliente · gestor";"sim";"Básico";"permanente"/);
    assert.match((await t.req('/admin', {user: 'owner'})).text, /Renovações a tratar/);
    const audit = await t.req('/admin/auditoria', {user: 'owner'});
    for (const ev of ['admin.grant', 'admin.revoke', 'admin.unlock', 'admin.end-sessions', 'admin.role', 'admin.create-user']) assert.match(audit.text, new RegExp(ev.replace('.', '\\.')));
  } finally { await t.close(); }
});

test('pagamento manual (Pix) libera 12 meses e aprovação manual de pendente', async () => {
  const t = await boot();
  try {
    await t.signup(OWNER, 'Fabio', 'owner', 'senha-do-dono-123');
    await t.signup('pix@empresa.test', 'Pix', 'cli', 'senha-do-cliente-123');
    const r = await t.req('/admin/pagamentos/manual', {user: 'owner', method: 'POST', form: {email: 'pix@empresa.test', modulo: 'advanced', valor: '797,00', nota: 'comprovante 123'}});
    assert.match(r.text, /Pagamento registrado/);
    const p = await t.db.prepare("SELECT * FROM payments WHERE provider = 'manual'").bind().first();
    assert.equal(p.status, 'approved'); assert.equal(p.amount_cents, 79700);
    const months = (Date.parse(p.access_until) - Date.now()) / 864e5;
    assert.ok(months > 360 && months < 370);
    const m = await t.db.prepare("SELECT id FROM members WHERE email = 'pix@empresa.test'").bind().first();
    await t.db.prepare("INSERT INTO payments (id,member_id,module,amount_cents,status,provider,created_at,updated_at) VALUES ('pend-1',?,'basic',39700,'pending','mercadopago',?,?)").bind(m.id, new Date().toISOString(), new Date().toISOString()).run();
    assert.match((await t.req('/admin/pagamentos/pend-1/aprovar', {user: 'owner', method: 'POST', form: {}})).text, /Pagamento aprovado/);
    assert.equal((await t.db.prepare("SELECT status FROM payments WHERE id = 'pend-1'").bind().first()).status, 'approved');
    const backup = await t.req('/admin/sistema/backup.json', {user: 'owner'});
    const data = JSON.parse(backup.text);
    assert.equal(data.tables.payments.length, 2); assert.ok(data.tables.members.length >= 2);
  } finally { await t.close(); }
});

test('manutenção bloqueia clientes no site, na API e nos aplicativos; aviso aparece no programa', async () => {
  const t = await boot();
  try {
    await t.signup(OWNER, 'Fabio', 'owner', 'senha-do-dono-123');
    await t.signup('cli@empresa.test', 'Cli', 'cli', 'senha-do-cliente-123');
    await t.req('/admin/sistema/manutencao', {user: 'owner', method: 'POST', form: {ligar: '1', mensagem: 'Atualizando para a versão 9.3'}});
    await new Promise(r => setTimeout(r, 10));
    const api = await t.req('/api/session', {user: 'cli'});
    assert.equal(api.status, 503); assert.equal(JSON.parse(api.text).maintenance, true);
    assert.match((await t.req('/sistema', {user: 'cli'})).text, /Atualizando para a versão 9\.3/);
    assert.equal((await t.req('/api/session', {user: 'owner'})).status, 200, 'administrador continua usando');
    assert.equal((await t.req('/entrar')).status, 200, 'página de login continua aberta');
    await t.req('/admin/sistema/manutencao', {user: 'owner', method: 'POST', form: {ligar: '0', mensagem: 'x'}});
    await t.req('/admin/sistema/aviso', {user: 'owner', method: 'POST', form: {aviso: 'Nova versão disponível <hoje>'}});
    const shell = await t.req('/sistema', {user: 'cli'});
    assert.equal(shell.status, 200); assert.match(shell.text, /Nova versão disponível &#60;hoje&#62;/);
  } finally { await t.close(); }
});

test('aplicativo instalável: manifesto, service worker, ícones e vínculo Android', async () => {
  const t = await boot({ANDROID_PACKAGE_NAME: 'br.com.silsecengenharia.app', ANDROID_SHA256_FINGERPRINTS: FP + ',invalido'});
  try {
    const man = await t.req('/manifest.webmanifest');
    assert.equal(man.status, 200); assert.match(man.headers.get('content-type'), /manifest\+json/);
    const m = JSON.parse(man.text);
    assert.equal(m.display, 'standalone'); assert.ok(m.icons.some(i => i.purpose === 'maskable'));
    for (const i of m.icons) assert.equal((await t.req(i.src)).status, 200);
    assert.equal((await t.req('/apple-touch-icon.png')).status, 200);
    const sw = await t.req('/sw.js');
    assert.equal(sw.status, 200); assert.equal(sw.headers.get('service-worker-allowed'), '/');
    const links = JSON.parse((await t.req('/.well-known/assetlinks.json')).text);
    assert.equal(links[0].target.package_name, 'br.com.silsecengenharia.app');
    assert.deepEqual(links[0].target.sha256_cert_fingerprints, [FP]);
    assert.match((await t.req('/')).text, /rel="manifest"/);
  } finally { await t.close(); }
});
