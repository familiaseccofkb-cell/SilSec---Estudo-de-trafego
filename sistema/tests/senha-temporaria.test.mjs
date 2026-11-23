// Senha temporária com troca obrigatória (pedido do Fabio, 22/11/2026): a administração cadastra o usuário com uma
// senha temporária enviada por e-mail; no primeiro acesso a pessoa só usa o sistema depois de criar a própria senha.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readConfig} from '../server/platform/config.mjs';
import {createApp} from '../server/platform/app.mjs';
import {openSqlite, migrate} from '../server/platform/database.mjs';
import {generateTemporaryPassword, setTemporaryPassword, verifyPassword, TEMP_HOURS} from '../server/platform/auth.mjs';

const OWNER = 'dono@silsec.test';

async function boot({delivered = true} = {}) {
  const sent = [];
  const mailer = {configured: true, async send(m) { sent.push(m); return {delivered, configured: true}; }, recentFailure: () => false};
  const db = await openSqlite(':memory:');
  const app = await createApp(readConfig({SITE_OWNER_EMAIL: OWNER, SITE_OWNER_EMAILS: '', DB_DRIVER: 'sqlite', SQLITE_FILE: ':memory:'}), {db, mailer, log: {log() {}, warn() {}, error: (...a) => console.error(...a)}});
  const server = createServer(app.handler);
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const base = 'http://127.0.0.1:' + server.address().port, jar = {};
  async function req(path, {method = 'GET', form, user = 'a'} = {}) {
    const h = {}; if (jar[user]) h.cookie = jar[user];
    let body;
    if (form) { body = new URLSearchParams(form).toString(); h['content-type'] = 'application/x-www-form-urlencoded'; h.origin = base; }
    const r = await fetch(base + path, {method, headers: h, body, redirect: 'manual'});
    for (const c of r.headers.getSetCookie()) { const v = c.split(';')[0]; jar[user] = v.endsWith('=') ? '' : v; }
    return {status: r.status, location: r.headers.get('location'), text: await r.text()};
  }
  // o dono entra pelo caminho normal (link de confirmação)
  await req('/cadastrar', {user: 'owner', method: 'POST', form: {nome: 'Fabio', email: OWNER}});
  const link = new URL(sent.at(-1).text.match(/https?:\/\/\S+/)[0]);
  await req('/verificar', {user: 'owner', method: 'POST', form: {token: link.searchParams.get('token'), senha: 'senha-do-dono-123', volta: '/sistema'}});
  assert.equal((await req('/api/session', {user: 'owner'})).status, 200);
  return {req, sent, db, async close() { await new Promise(r => server.close(r)); await app.close(); }};
}
const senhaDoEmail = m => m.text.match(/Senha temporária: (\S+)/)[1];

test('senha gerada: 3 grupos de 4, sem caracteres ambíguos, diferente a cada vez', () => {
  const vistas = new Set();
  for (let i = 0; i < 200; i++) {
    const s = generateTemporaryPassword();
    assert.match(s, /^[a-km-zA-HJ-NP-Z2-9]{4}-[a-km-zA-HJ-NP-Z2-9]{4}-[a-km-zA-HJ-NP-Z2-9]{4}$/);
    assert.doesNotMatch(s, /[lIO01]/);
    vistas.add(s);
  }
  assert.equal(vistas.size, 200);
});

test('administração cadastra com senha temporária: e-mail com a senha; 1º acesso obriga a trocar; depois entra normal', async () => {
  const t = await boot();
  try {
    const r = await t.req('/admin/usuarios/novo', {user: 'owner', method: 'POST', form: {nome: 'Contato TES', email: 'contato@tes.test', papel: 'admin', modulo: '', dias: '0', acesso: 'temporaria', senha_temporaria: ''}});
    assert.equal(r.status, 200);
    const mail = t.sent.at(-1);
    assert.equal(mail.to, 'contato@tes.test');
    const temp = senhaDoEmail(mail);
    assert.match(mail.text, new RegExp(`vale por ${TEMP_HOURS} horas`));
    assert.match(mail.text, /primeiro acesso o sistema pede que você crie uma senha nova/);
    assert.ok(r.text.includes('Senha temporária: ' + temp), 'a tela do administrador mostra a senha uma vez');
    assert.match(r.text, /Enviada por e-mail/);
    // a senha não fica guardada em texto no banco
    const u = await t.db.prepare('SELECT * FROM auth_users WHERE email = ?').bind('contato@tes.test').first();
    assert.ok(!JSON.stringify(u).includes(temp)); assert.equal(Number(u.must_change_password), 1); assert.ok(u.email_verified_at);

    // senha errada continua errada
    assert.equal((await t.req('/entrar', {user: 'c', method: 'POST', form: {email: 'contato@tes.test', senha: 'outra-senha-123', volta: '/sistema'}})).status, 401);
    // com a temporária: entra, mas vai direto para /trocar-senha
    const login = await t.req('/entrar', {user: 'c', method: 'POST', form: {email: 'contato@tes.test', senha: temp, volta: '/sistema'}});
    assert.equal(login.status, 303); assert.equal(login.location, '/trocar-senha?volta=%2Fsistema');
    // enquanto não troca: sistema, API, documentos e console tratam como não logado; /entrar devolve para a troca
    assert.match((await t.req('/sistema', {user: 'c'})).location, /^\/entrar/);
    assert.equal((await t.req('/api/session', {user: 'c'})).status, 401);
    assert.match((await t.req('/manual-do-usuario.html', {user: 'c'})).location, /^\/entrar/);
    assert.equal((await t.req('/admin', {user: 'c'})).status, 303);
    assert.equal((await t.req('/entrar?volta=%2Fsistema', {user: 'c'})).location, '/trocar-senha?volta=%2Fsistema');
    const tela = await t.req('/trocar-senha?volta=%2Fsistema', {user: 'c'});
    assert.equal(tela.status, 200); assert.match(tela.text, /Crie sua senha/); assert.match(tela.text, /senha temporária/);
    // regras da senha nova
    assert.match((await t.req('/trocar-senha', {user: 'c', method: 'POST', form: {senha: 'curta', senha2: 'curta', volta: '/sistema'}})).text, /de 10 a 200 caracteres/);
    assert.match((await t.req('/trocar-senha', {user: 'c', method: 'POST', form: {senha: 'nova-senha-123', senha2: 'nova-senha-124', volta: '/sistema'}})).text, /confirmação não é igual/);
    assert.match((await t.req('/trocar-senha', {user: 'c', method: 'POST', form: {senha: temp, senha2: temp, volta: '/sistema'}})).text, /diferente da senha temporária/);
    const troca = await t.req('/trocar-senha', {user: 'c', method: 'POST', form: {senha: 'minha-senha-nova-123', senha2: 'minha-senha-nova-123', volta: '/sistema'}});
    assert.equal(troca.status, 303); assert.equal(troca.location, '/sistema');
    // agora usa o sistema normalmente (é administrador, então entra no console)
    assert.equal((await t.req('/api/session', {user: 'c'})).status, 200);
    assert.equal((await t.req('/admin', {user: 'c'})).status, 200);
    assert.equal((await t.req('/trocar-senha', {user: 'c'})).location, '/sistema', 'sem pendência, /trocar-senha não aparece');
    // a temporária deixou de valer; a nova vale
    assert.equal((await t.req('/entrar', {user: 'd', method: 'POST', form: {email: 'contato@tes.test', senha: temp, volta: '/sistema'}})).status, 401);
    assert.equal((await t.req('/entrar', {user: 'd', method: 'POST', form: {email: 'contato@tes.test', senha: 'minha-senha-nova-123', volta: '/sistema'}})).location, '/sistema');
    const depois = await t.db.prepare('SELECT must_change_password, temp_password_expires_at FROM auth_users WHERE email = ?').bind('contato@tes.test').first();
    assert.equal(Number(depois.must_change_password), 0); assert.equal(depois.temp_password_expires_at, null);
  } finally { await t.close(); }
});

test('senha temporária informada pelo administrador: mínimo de 10 caracteres', async () => {
  const t = await boot();
  try {
    const curta = await t.req('/admin/usuarios/novo', {user: 'owner', method: 'POST', form: {nome: 'X', email: 'x@tes.test', papel: 'client_manager', modulo: '', dias: '0', acesso: 'temporaria', senha_temporaria: 'TES2026'}});
    assert.match(curta.text, /pelo menos 10 caracteres/);
    const n = t.sent.length;
    const ok = await t.req('/admin/usuarios/novo', {user: 'owner', method: 'POST', form: {nome: 'X', email: 'x@tes.test', papel: 'client_manager', modulo: '', dias: '0', acesso: 'temporaria', senha_temporaria: 'Temporaria-2026'}});
    assert.equal(t.sent.length, n + 1); assert.equal(senhaDoEmail(t.sent.at(-1)), 'Temporaria-2026');
    assert.match(ok.text, /Senha temporária: Temporaria-2026/);
    assert.equal((await t.req('/entrar', {user: 'x', method: 'POST', form: {email: 'x@tes.test', senha: 'Temporaria-2026', volta: '/sistema'}})).location, '/trocar-senha?volta=%2Fsistema');
  } finally { await t.close(); }
});

test('botão "Gerar senha temporária" em quem já tem conta: encerra sessões e obriga a trocar', async () => {
  const t = await boot();
  try {
    await t.req('/admin/usuarios/novo', {user: 'owner', method: 'POST', form: {nome: 'Cli', email: 'cli@tes.test', papel: 'client_manager', modulo: '', dias: '0', acesso: 'temporaria'}});
    const temp1 = senhaDoEmail(t.sent.at(-1));
    await t.req('/entrar', {user: 'cli', method: 'POST', form: {email: 'cli@tes.test', senha: temp1, volta: '/sistema'}});
    await t.req('/trocar-senha', {user: 'cli', method: 'POST', form: {senha: 'senha-do-cliente-1', senha2: 'senha-do-cliente-1', volta: '/sistema'}});
    assert.equal((await t.req('/api/session', {user: 'cli'})).status, 200);
    const pagina = await t.req('/admin/usuarios/cli%40tes.test', {user: 'owner'});
    assert.match(pagina.text, /Gerar senha temporária e enviar/);
    const r = await t.req('/admin/usuarios/cli%40tes.test/temporaria', {user: 'owner', method: 'POST', form: {}});
    const temp2 = senhaDoEmail(t.sent.at(-1));
    assert.notEqual(temp2, temp1); assert.ok(r.text.includes('Senha temporária: ' + temp2));
    assert.match(r.text, /troca obrigatória no próximo acesso/);
    assert.equal((await t.req('/api/session', {user: 'cli'})).status, 401, 'sessões antigas encerradas');
    assert.equal((await t.req('/entrar', {user: 'cli', method: 'POST', form: {email: 'cli@tes.test', senha: 'senha-do-cliente-1', volta: '/sistema'}})).status, 401, 'a senha antiga deixou de valer');
    assert.equal((await t.req('/entrar', {user: 'cli', method: 'POST', form: {email: 'cli@tes.test', senha: temp2, volta: '/sistema'}})).location, '/trocar-senha?volta=%2Fsistema');
    // "Esqueci minha senha" também resolve a pendência
    await t.req('/esqueci-senha', {user: 'z', method: 'POST', form: {email: 'cli@tes.test'}});
    const link = new URL(t.sent.at(-1).text.match(/https?:\/\/\S+redefinir-senha\S+/)[0]);
    await t.req('/redefinir-senha', {user: 'z', method: 'POST', form: {token: link.searchParams.get('token'), senha: 'senha-recuperada-1'}});
    assert.equal((await t.req('/api/session', {user: 'z'})).status, 200);
  } finally { await t.close(); }
});

test('senha temporária vencida não abre sessão', async () => {
  const t = await boot();
  try {
    await t.req('/admin/usuarios/novo', {user: 'owner', method: 'POST', form: {nome: 'V', email: 'v@tes.test', papel: 'client_manager', modulo: '', dias: '0', acesso: 'temporaria'}});
    const temp = senhaDoEmail(t.sent.at(-1));
    await t.db.prepare('UPDATE auth_users SET temp_password_expires_at = ? WHERE email = ?').bind(new Date(Date.now() - 1000).toISOString(), 'v@tes.test').run();
    const r = await t.req('/entrar', {user: 'v', method: 'POST', form: {email: 'v@tes.test', senha: temp, volta: '/sistema'}});
    assert.equal(r.status, 401); assert.match(r.text, /senha temporária venceu/);
    assert.equal((await t.req('/trocar-senha', {user: 'v'})).location, '/entrar?volta=%2Fsistema');
  } finally { await t.close(); }
});

test('e-mail que não sai: o administrador vê a senha e o aviso para entregar por outro meio', async () => {
  const t = await boot({delivered: false});
  try {
    const r = await t.req('/admin/usuarios/novo', {user: 'owner', method: 'POST', form: {nome: 'M', email: 'm@tes.test', papel: 'client_manager', modulo: '', dias: '0', acesso: 'temporaria'}});
    assert.match(r.text, /Senha temporária: \S{14}/); assert.match(r.text, /NÃO saiu/);
  } finally { await t.close(); }
});

test('e-mail sem SMTP ou com falha: a senha temporária não vai para o log do servidor', async () => {
  const {createMailer} = await import('../server/platform/mailer.mjs');
  const linhas = [], log = {log() {}, warn: m => linhas.push(String(m)), error: m => linhas.push(String(m))};
  const semSmtp = createMailer(null, log);
  await semSmtp.send({to: 'a@b.test', subject: 's', text: 'Senha temporária: Abcd-Efgh-Jkmn', logText: 'sem senha'});
  const falha = createMailer({host: 'x', port: 1, from: 'a@b.test'}, log, {createTransport: () => ({async sendMail() { throw Object.assign(new Error('fora'), {code: 'ECONNREFUSED'}); }})});
  await falha.send({to: 'a@b.test', subject: 's', text: 'Senha temporária: Abcd-Efgh-Jkmn', logText: 'sem senha'});
  assert.equal(linhas.length, 2);
  assert.ok(linhas.every(l => !l.includes('Abcd-Efgh-Jkmn') && l.includes('sem senha')), linhas.join('\n'));
});

test('terminal: setTemporaryPassword grava hash, prazo e troca obrigatória; migração no banco novo', async () => {
  const db = await openSqlite(':memory:');
  await migrate(db);
  const r = await setTemporaryPassword(db, {email: 'Novo@Tes.test', name: 'Novo', password: 'Temporaria-2026'});
  assert.equal(r.created, true);
  const u = await db.prepare('SELECT * FROM auth_users WHERE email = ?').bind('novo@tes.test').first();
  assert.equal(Number(u.must_change_password), 1); assert.ok(u.temp_password_expires_at > new Date().toISOString());
  assert.ok(await verifyPassword('Temporaria-2026', u.password_hash));
  await assert.rejects(setTemporaryPassword(db, {email: 'a@b.test', password: 'TES2026'}), /pelo menos 10/);
  await db.close();
});
