// Plataforma própria: servidor HTTP, login, sessões, arquivos estáticos, armazenamento e tradução SQL.
// Executa com SQLite em memória; com TEST_MYSQL_URL definido, executa também contra MySQL/MariaDB.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readConfig} from '../server/platform/config.mjs';
import {createApp} from '../server/platform/app.mjs';
import {openMysql, openSqlite} from '../server/platform/database.mjs';
import {DatabaseStorage, FileStorage} from '../server/platform/storage.mjs';
import {toMysql} from '../server/platform/sql-mysql.mjs';
import {hashPassword, verifyPassword, safeNext} from '../server/platform/auth.mjs';
import {analyzeContract} from '../server/contract-ai.mjs';
import {analyzeInvoice} from '../server/invoice-ai.mjs';
import {mkdtemp, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';

const OWNER = 'dono@silsec.test';

async function boot(extraEnv = {}) {
  const sent = [];
  const mailer = {configured: true, async send(m) { sent.push(m); return {delivered: true}; }};
  const config = readConfig({SITE_OWNER_EMAIL: OWNER, DB_DRIVER: 'sqlite', SQLITE_FILE: ':memory:', ...extraEnv});
  let db;
  if (process.env.TEST_MYSQL_URL) {
    const u = new URL(process.env.TEST_MYSQL_URL), name = 'silsec_p' + process.pid + '_' + Math.random().toString(36).slice(2, 8);
    const cfg = {host: u.hostname, port: +u.port || 3306, user: decodeURIComponent(u.username), password: decodeURIComponent(u.password)};
    const admin = await openMysql(cfg); await admin.exec('CREATE DATABASE `' + name + '`'); await admin.close();
    db = await openMysql({...cfg, database: name});
  } else db = await openSqlite(':memory:');
  const quiet = {log() {}, warn() {}, error: console.error};
  const app = await createApp(config, {db, mailer, log: quiet});
  const server = createServer(app.handler);
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const base = 'http://127.0.0.1:' + server.address().port;
  const jar = {};
  async function req(path, {method = 'GET', form, json, user = 'a', headers = {}, cookie = true} = {}) {
    const h = {...headers};
    if (cookie && jar[user]) h.cookie = jar[user];
    let body;
    if (form) { body = new URLSearchParams(form).toString(); h['content-type'] = 'application/x-www-form-urlencoded'; h.origin ??= base; }
    if (json !== undefined) { body = JSON.stringify(json); h['content-type'] = 'application/json'; }
    const r = await fetch(base + path, {method, headers: h, body, redirect: 'manual'});
    const set = r.headers.getSetCookie();
    for (const c of set) { const v = c.split(';')[0]; jar[user] = v.endsWith('=') ? '' : v; }
    return {status: r.status, location: r.headers.get('location'), text: await r.text(), headers: r.headers};
  }
  const linkFrom = m => m.text.match(/https?:\/\/\S+/)[0];
  return {app, server, base, req, sent, jar, linkFrom, async close() { await new Promise(r => server.close(r)); await app.close(); }};
}

test('plataforma: tradução de SQL do SQLite para MySQL/MariaDB', () => {
  assert.equal(toMysql('INSERT OR IGNORE INTO t (a) VALUES (?)'), 'INSERT IGNORE INTO t (a) VALUES (?)');
  assert.equal(toMysql('INSERT INTO t (a,b) VALUES (?,?) ON CONFLICT(a,b) DO NOTHING'), 'INSERT IGNORE INTO t (a,b) VALUES (?,?)');
  assert.equal(toMysql('INSERT INTO p (id,x) VALUES (?,?) ON CONFLICT(id) DO UPDATE SET x = excluded.x, n=1'), 'INSERT INTO p (id,x) VALUES (?,?) ON DUPLICATE KEY UPDATE x = VALUES(x), n=1');
  assert.equal(toMysql("SELECT * FROM c WHERE CAST(json_extract(data_json,'$.a.b') AS REAL)=?"), "SELECT * FROM c WHERE ((JSON_UNQUOTE(JSON_EXTRACT(data_json,'$.a.b')))+0)=?");
  assert.equal(toMysql("lower(json_extract(d,'$.m'))=lower(?) AND name LIKE ?"), "lower(JSON_UNQUOTE(JSON_EXTRACT(d,'$.m')))=lower(?) AND name LIKE ? COLLATE utf8mb4_general_ci");
});

test('plataforma: senhas com scrypt e retorno seguro após login', async () => {
  const h = await hashPassword('senha-muito-boa');
  assert.match(h, /^scrypt\$/);
  assert.equal(await verifyPassword('senha-muito-boa', h), true);
  assert.equal(await verifyPassword('outra-senha-qualquer', h), false);
  assert.equal(safeNext('//evil.com'), '/sistema');
  assert.equal(safeNext('https://evil.com'), '/sistema');
  assert.equal(safeNext('/\\evil.com'), '/sistema');
  assert.equal(safeNext('/?supplierInvite=abc'), '/?supplierInvite=abc');
});

// Abre o link do e-mail e cria a senha (como faria a pessoa dona do e-mail).
async function confirm(t, mail, password, user = 'a') {
  const link = new URL(t.linkFrom(mail));
  let r = await t.req(link.pathname + link.search, {user});
  assert.equal(r.status, 200, r.text); assert.match(r.text, /Crie sua senha/);
  r = await t.req('/verificar', {user, method: 'POST', form: {token: link.searchParams.get('token'), senha: password, volta: link.searchParams.get('volta') || '/'}});
  return {r, link};
}

test('plataforma: cadastro, criação de senha pelo link, sessão e API autenticada', async () => {
  const t = await boot();
  try {
    let r = await t.req('/');
    assert.equal(r.status, 200); assert.match(r.text, /Estudo de tráfego de elevadores em minutos/);
    r = await t.req('/sistema');
    assert.equal(r.status, 303); assert.equal(r.location, '/entrar?volta=%2Fsistema');
    r = await t.req('/entrar'); assert.equal(r.status, 200); assert.match(r.text, /<h1>Entrar<\/h1>/); assert.match(r.text, /\(11\) 98313-0055/); assert.match(r.text, /contato@silsec-engenharia\.com\.br/);
    // cabeçalhos internos forjados por um visitante são descartados
    r = await t.req('/api/session', {headers: {'oai-authenticated-user-id': 'x', 'oai-authenticated-user-email': OWNER}});
    assert.equal(r.status, 401);
    // cadastro do proprietário: só nome e e-mail; a senha é criada pelo link
    r = await t.req('/cadastrar', {method: 'POST', form: {nome: 'Dono', email: OWNER, volta: '/'}});
    assert.equal(r.status, 200); assert.match(r.text, /Confirme seu e-mail/);
    assert.equal(t.sent.length, 1);
    // conta sem senha não entra com nada
    r = await t.req('/entrar', {method: 'POST', form: {email: OWNER, senha: '', volta: '/'}});
    assert.equal(r.status, 401);
    // senha curta é recusada; depois a senha válida confirma e abre a sessão
    const link = new URL(t.linkFrom(t.sent[0]));
    r = await t.req('/verificar', {method: 'POST', form: {token: link.searchParams.get('token'), senha: 'curta'}});
    assert.equal(r.status, 400);
    const ok = await confirm(t, t.sent[0], 'senha-segura-123');
    assert.equal(ok.r.status, 303); assert.ok(t.jar.a);
    r = await t.req('/api/session');
    assert.equal(r.status, 200);
    const session = JSON.parse(r.text);
    assert.equal(session.user.email, OWNER); assert.equal(session.user.role, 'admin');
    // link não pode ser reutilizado
    r = await t.req(link.pathname + link.search, {user: 'b'}); assert.equal(r.status, 400);
    // o shell só é servido com sessão
    r = await t.req('/sistema'); assert.equal(r.status, 200); assert.match(r.text, /app\.js/);
    assert.equal(r.headers.get('cache-control'), 'private, no-store');
    // gravar projeto pela API com origem correta e recusar origem externa
    const {defaultStudy} = await import('../public/engine.js'); const {normalizeStudy} = await import('../public/state.js');
    r = await t.req('/api/projects', {method: 'PUT', json: {study: normalizeStudy(defaultStudy()), calculate: true}, headers: {origin: t.base}});
    assert.equal(r.status, 200, r.text);
    r = await t.req('/api/projects', {method: 'PUT', json: {study: normalizeStudy(defaultStudy())}, headers: {origin: 'https://evil.example'}});
    assert.equal(r.status, 403);
    // sair encerra a sessão; entrar de novo com a senha criada
    r = await t.req('/sair'); assert.equal(r.status, 303);
    r = await t.req('/api/session'); assert.equal(r.status, 401);
    r = await t.req('/entrar', {method: 'POST', form: {email: OWNER, senha: 'senha-segura-123', volta: '/?project=1'}});
    assert.equal(r.status, 303); assert.equal(r.location, '/?project=1');
    r = await t.req('/api/session'); assert.equal(r.status, 200);
  } finally { await t.close(); }
});

test('plataforma: ninguém reserva o e-mail de outra pessoa com senha própria', async () => {
  const t = await boot();
  try {
    // atacante pede cadastro com o e-mail do proprietário: o link vai para a caixa do proprietário
    await t.req('/cadastrar', {user: 'mal', method: 'POST', form: {nome: 'Atacante', email: OWNER, senha: 'senha-do-atacante'}});
    await t.req('/cadastrar', {user: 'mal', method: 'POST', form: {nome: 'Atacante', email: OWNER, senha: 'senha-do-atacante'}});
    assert.equal(t.sent.length, 2);
    // a senha enviada no formulário é ignorada
    let r = await t.req('/entrar', {user: 'mal', method: 'POST', form: {email: OWNER, senha: 'senha-do-atacante'}});
    assert.equal(r.status, 401);
    // o dono do e-mail cria a própria senha por um dos links; os outros links deixam de valer
    await confirm(t, t.sent[0], 'senha-do-dono-123', 'dono');
    const other = new URL(t.linkFrom(t.sent[1]));
    r = await t.req(other.pathname + other.search, {user: 'mal'}); assert.equal(r.status, 400);
    r = await t.req('/entrar', {user: 'mal', method: 'POST', form: {email: OWNER, senha: 'senha-do-atacante'}});
    assert.equal(r.status, 401);
    // depois de confirmado, novo cadastro só avisa o dono por e-mail
    r = await t.req('/cadastrar', {user: 'mal', method: 'POST', form: {nome: 'Atacante', email: OWNER}});
    assert.match(t.sent.at(-1).subject, /já tem conta/);
  } finally { await t.close(); }
});

test('plataforma: cadastro restrito a membros, senha errada, bloqueio e recuperação', async () => {
  const t = await boot();
  try {
    // e-mail sem autorização: resposta neutra e nenhum e-mail enviado
    let r = await t.req('/cadastrar', {method: 'POST', form: {nome: 'X', email: 'estranho@x.test'}});
    assert.equal(r.status, 200); assert.equal(t.sent.length, 0);
    // cadastro do proprietário e confirmação
    await t.req('/cadastrar', {method: 'POST', form: {nome: 'Dono', email: OWNER}});
    await confirm(t, t.sent.at(-1), 'senha-segura-123');
    // proprietário cadastra integrante; integrante passa a poder criar conta
    r = await t.req('/api/team', {method: 'POST', json: {email: 'ana@silsec.test', name: 'Ana', role: 'member'}, headers: {origin: t.base}});
    assert.equal(r.status, 200, r.text);
    r = await t.req('/cadastrar', {user: 'ana', method: 'POST', form: {nome: 'Ana', email: 'ana@silsec.test'}});
    r = (await confirm(t, t.sent.at(-1), 'senha-da-ana-123', 'ana')).r; assert.equal(r.status, 303);
    r = await t.req('/api/session', {user: 'ana'}); assert.equal(JSON.parse(r.text).user.email, 'ana@silsec.test');
    // senha errada e e-mail inexistente têm a mesma resposta
    r = await t.req('/entrar', {user: 'x', method: 'POST', form: {email: 'ana@silsec.test', senha: 'errada-errada-1'}});
    assert.equal(r.status, 401); assert.match(r.text, /incorretos/);
    r = await t.req('/entrar', {user: 'x', method: 'POST', form: {email: 'ninguem@x.test', senha: 'errada-errada-1'}});
    assert.equal(r.status, 401); assert.match(r.text, /incorretos/);
    // recuperação de senha encerra sessões antigas
    const before = t.sent.length;
    r = await t.req('/esqueci-senha', {user: 'x', method: 'POST', form: {email: 'ana@silsec.test'}});
    assert.equal(r.status, 200); assert.equal(t.sent.length, before + 1);
    r = await t.req('/esqueci-senha', {user: 'x', method: 'POST', form: {email: 'ninguem@x.test'}});
    assert.equal(t.sent.length, before + 1);
    const link = new URL(t.linkFrom(t.sent.at(-1)));
    const token = link.searchParams.get('token');
    r = await t.req(link.pathname + link.search, {user: 'x'}); assert.equal(r.status, 200); assert.match(r.text, /Criar nova senha/);
    r = await t.req('/redefinir-senha', {user: 'x', method: 'POST', form: {token, senha: 'nova-senha-da-ana'}});
    assert.equal(r.status, 303);
    r = await t.req('/api/session', {user: 'ana'}); assert.equal(r.status, 401);
    r = await t.req('/api/session', {user: 'x'}); assert.equal(JSON.parse(r.text).user.email, 'ana@silsec.test');
    r = await t.req('/redefinir-senha', {user: 'y', method: 'POST', form: {token, senha: 'mais-uma-senha-1'}}); assert.equal(r.status, 400);
    // troca de senha em Minha conta
    r = await t.req('/conta', {user: 'x', method: 'POST', form: {senha_atual: 'nova-senha-da-ana', senha: 'terceira-senha-ana'}});
    assert.equal(r.status, 200); assert.match(r.text, /Senha alterada/);
    // bloqueio após 8 tentativas erradas
    for (let i = 0; i < 8; i++) await t.req('/entrar', {user: 'z', method: 'POST', form: {email: OWNER, senha: 'tentativa-' + i}, headers: {'x-forwarded-for': '10.0.0.' + i}});
    r = await t.req('/entrar', {user: 'z', method: 'POST', form: {email: OWNER, senha: 'senha-segura-123'}, headers: {'x-forwarded-for': '10.0.1.1'}});
    assert.equal(r.status, 429); assert.match(r.text, /bloqueada/);
    // formulário vindo de outro site é recusado
    r = await t.req('/entrar', {user: 'z', method: 'POST', form: {email: OWNER, senha: 'x'}, headers: {origin: 'https://evil.example'}});
    assert.equal(r.status, 403);
  } finally { await t.close(); }
});

test('plataforma: arquivos estáticos, documentos privados e caminhos inválidos', async () => {
  const t = await boot();
  try {
    let r = await t.req('/styles.css'); assert.equal(r.status, 200); assert.match(r.headers.get('content-type'), /text\/css/);
    r = await t.req('/app.js'); assert.equal(r.status, 200);
    r = await t.req('/silsec-brand/opcao-1.png'); assert.equal(r.status, 200);
    r = await t.req('/manual-do-usuario.html'); assert.equal(r.status, 303); assert.match(r.location, /^\/entrar/);
    r = await t.req('/silsec-comercializacao.html'); assert.equal(r.status, 303);
    r = await t.req('/revisao-v9.md'); assert.equal(r.status, 303);
    r = await t.req('/%2e%2e/package.json'); assert.equal(r.status, 404);
    r = await t.req('/../server.mjs'); assert.equal(r.status, 404);
    r = await t.req('/?share=' + 'a'.repeat(64)); assert.equal(r.status, 302); assert.equal(r.location, '/sistema?share=' + 'a'.repeat(64));
    r = await t.req('/sistema?share=' + 'a'.repeat(64)); assert.equal(r.status, 200);
    r = await t.req('/api/shared/' + 'a'.repeat(64)); assert.equal(r.status, 410);
    r = await t.req('/saude'); assert.equal(r.status, 200); assert.equal(JSON.parse(r.text).ok, true);
    r = await t.req('/signin-with-chatgpt?return_to=%2Fsistema%3Fproject%3D1'); assert.equal(r.location, '/entrar?volta=%2Fsistema%3Fproject%3D1');
  } finally { await t.close(); }
});

test('plataforma: armazenamento de arquivos no banco e em pasta', async () => {
  const db = await openSqlite(':memory:');
  await db.exec("CREATE TABLE stored_files (file_key text PRIMARY KEY, content_type text NOT NULL, size integer NOT NULL, data blob NOT NULL, created_at text NOT NULL)");
  const dir = await mkdtemp(join(tmpdir(), 'silsec-'));
  try {
    for (const store of [new DatabaseStorage(db), new FileStorage(dir)]) {
      const bytes = Uint8Array.from([0, 1, 2, 250, 255]);
      await store.put('education/u1/r1', bytes, {httpMetadata: {contentType: 'application/pdf'}});
      const got = await store.get('education/u1/r1');
      assert.deepEqual([...new Uint8Array(await got.arrayBuffer())], [...bytes]);
      assert.equal(got.httpMetadata.contentType, 'application/pdf');
      await store.put('education/u1/r1', new TextEncoder().encode('<p>ok</p>'));
      assert.equal(await (await store.get('education/u1/r1')).text(), '<p>ok</p>');
      assert.equal(await store.get('nao/existe'), null);
      await assert.rejects(() => store.put('../fora', bytes));
      await store.delete('education/u1/r1');
      assert.equal(await store.get('education/u1/r1'), null);
    }
  } finally { await rm(dir, {recursive: true, force: true}); await db.close(); }
});

test('IA: formato Anthropic (Hostinger AI Router ou Claude) com ferramenta estruturada', async () => {
  const env = {AI_API_KEY: 'k', AI_BASE_URL: 'https://router.example/v1', AI_MODEL: 'modelo-claude'};
  const calls = [];
  const parsed = {totalPrice: 100, currency: 'BRL', paymentTerms: '2x', delivery: '30 dias', warranty: '12 meses', exclusions: '', uncertainties: [], attention: []};
  const fetcher = async (url, opts) => {
    calls.push({url, headers: opts.headers, body: JSON.parse(opts.body)});
    if (calls.length === 1) return new Response('{"error":"unauthorized"}', {status: 401});
    return new Response(JSON.stringify({content: [{type: 'tool_use', name: 'silsec_contract', input: parsed}]}));
  };
  const r = await analyzeContract({file: btoa('Contrato'), mime: 'text/plain', name: 'c.txt'}, env, fetcher);
  assert.equal(r.totalPrice, 100); assert.equal(r.reviewed, false); assert.equal(r.model, 'modelo-claude');
  assert.equal(calls[0].url, 'https://router.example/v1/messages');
  assert.equal(calls[0].headers['x-api-key'], 'k');
  assert.equal(calls[1].headers.Authorization, 'Bearer k');
  assert.equal(calls[0].body.tool_choice.name, 'silsec_contract');
  // PDF vai como documento; formato OpenAI (chat completions) também é aceito
  let sent;
  const inv = await analyzeInvoice({file: 'JVBERi0=', mime: 'application/pdf', text: ''}, {AI_API_KEY: 'k', AI_FORMAT: 'openai', AI_BASE_URL: 'https://router.example/v1', AI_MODEL: 'gpt'}, async (url, o) => {
    sent = {url, body: JSON.parse(o.body)};
    return new Response(JSON.stringify({choices: [{message: {content: JSON.stringify({consumptionKwh: 10, energyCost: 5, totalCost: 9, notes: ''})}}]}));
  });
  assert.equal(sent.url, 'https://router.example/v1/chat/completions');
  assert.equal(sent.body.response_format.type, 'json_schema');
  assert.equal(inv.consumptionKwh, 10); assert.equal(inv.requiresConfirmation, true);
  await assert.rejects(() => analyzeInvoice({file: 'JVBERi0=', mime: 'application/pdf', text: ''}, {AI_API_KEY: 'k'}), /não configurada/);
});
