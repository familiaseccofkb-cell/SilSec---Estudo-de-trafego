// Site, chaves de acesso, teste de 30 dias, assinatura via Mercado Pago (simulado), painel e contato.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {createHmac} from 'node:crypto';
import {readConfig} from '../server/platform/config.mjs';
import {createApp} from '../server/platform/app.mjs';
import {openMysql, openSqlite} from '../server/platform/database.mjs';
import {newAccessCode, normalizeCode, verifyMercadoPagoSignature, maskEmail} from '../server/platform/commerce.mjs';
import {BRAND} from '../public/brand.js';

const OWNER = 'dono@silsec.test';

async function boot(extraEnv = {}, mpState = {}) {
  const sent = [], calls = [];
  const mailer = {configured: true, async send(m) { sent.push(m); return {delivered: true}; }};
  const fetcher = async (url, opts = {}) => {
    calls.push({url, opts});
    if (url.endsWith('/checkout/preferences')) { mpState.preference = JSON.parse(opts.body); return new Response(JSON.stringify({id: 'pref-1', init_point: 'https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=pref-1'}), {status: 201}); }
    const m = url.match(/\/v1\/payments\/(\d+)$/);
    if (m) return new Response(JSON.stringify({id: Number(m[1]), status: mpState.status || 'approved', external_reference: mpState.preference?.external_reference, transaction_amount: mpState.amount ?? mpState.preference?.items[0].unit_price, currency_id: 'BRL'}));
    return new Response('not found', {status: 404});
  };
  const config = readConfig({SITE_OWNER_EMAIL: OWNER, DB_DRIVER: 'sqlite', SQLITE_FILE: ':memory:', ...extraEnv});
  let db;
  if (process.env.TEST_MYSQL_URL) {
    const u = new URL(process.env.TEST_MYSQL_URL), name = 'silsec_c' + process.pid + '_' + Math.random().toString(36).slice(2, 8);
    const cfg = {host: u.hostname, port: +u.port || 3306, user: decodeURIComponent(u.username), password: decodeURIComponent(u.password)};
    const admin = await openMysql(cfg); await admin.exec('CREATE DATABASE `' + name + '`'); await admin.close();
    db = await openMysql({...cfg, database: name});
  } else db = await openSqlite(':memory:');
  const app = await createApp(config, {db, mailer, fetcher, log: {log() {}, warn() {}, error: (...a) => console.error(...a)}});
  const server = createServer(app.handler);
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const base = 'http://127.0.0.1:' + server.address().port, jar = {};
  async function req(path, {method = 'GET', form, json, raw, user = 'a', headers = {}} = {}) {
    const h = {...headers}; if (jar[user]) h.cookie = jar[user];
    let body;
    if (form) { body = new URLSearchParams(form).toString(); h['content-type'] = 'application/x-www-form-urlencoded'; h.origin ??= base; }
    if (json !== undefined) { body = JSON.stringify(json); h['content-type'] = 'application/json'; }
    if (raw !== undefined) body = raw;
    const r = await fetch(base + path, {method, headers: h, body, redirect: 'manual'});
    for (const c of r.headers.getSetCookie()) { const v = c.split(';')[0]; jar[user] = v.endsWith('=') ? '' : v; }
    return {status: r.status, location: r.headers.get('location'), text: await r.text(), headers: r.headers};
  }
  const linkFrom = m => m.text.match(/https?:\/\/\S+/)[0];
  async function confirm(mail, password, user) {
    const link = new URL(linkFrom(mail));
    await req(link.pathname + link.search, {user});
    return req('/verificar', {user, method: 'POST', form: {token: link.searchParams.get('token'), senha: password, volta: link.searchParams.get('volta') || '/sistema'}});
  }
  async function owner() {
    await req('/cadastrar', {user: 'owner', method: 'POST', form: {nome: 'Fabio', email: OWNER}});
    await confirm(sent.at(-1), 'senha-do-dono-123', 'owner');
    assert.equal((await req('/api/session', {user: 'owner'})).status, 200);
  }
  return {app, base, req, sent, calls, jar, confirm, owner, db, async close() { await new Promise(r => server.close(r)); await app.close(); }};
}

const codeFrom = mail => mail.text.match(/FSC-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}/)[0];

test('chaves: formato, normalização, máscara e assinatura do webhook', () => {
  const c = newAccessCode();
  assert.match(c, /^FSC-[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}$/);
  assert.equal(normalizeCode(c.toLowerCase().replace(/-/g, ' ')), c.replace(/^FSC-/, '').replace(/-/g, ''));
  assert.equal(normalizeCode('FSC-0000-0000-0000'), null);
  assert.equal(maskEmail('cliente@empresa.com.br'), 'cl***@empresa.com.br');
  const secret = 's3cr3t', ts = '1704908010', manifest = `id:123456;request-id:req-1;ts:${ts};`;
  const v1 = createHmac('sha256', secret).update(manifest).digest('hex');
  assert.equal(verifyMercadoPagoSignature({secret, signature: `ts=${ts},v1=${v1}`, requestId: 'req-1', dataId: '123456'}), true);
  assert.equal(verifyMercadoPagoSignature({secret, signature: `ts=${ts},v1=${v1}`, requestId: 'req-2', dataId: '123456'}), false);
  assert.equal(verifyMercadoPagoSignature({secret, signature: '', requestId: 'req-1', dataId: '123456'}), false);
});

test('site: página inicial pública, contato, robots e links antigos do programa', async () => {
  const t = await boot();
  try {
    let r = await t.req('/');
    assert.equal(r.status, 200);
    assert.match(r.text, /SilSec Engenharia/); assert.match(r.text, /\(11\) 98313-0055/); assert.doesNotMatch(r.text, /R\$\s?797,00/, 'preços ficam só na página dos módulos'); assert.match(r.text, /Sistema de estudo de tráfego Básico/); assert.match(r.text, /Solicite um orçamento/);
    assert.equal(r.headers.get('x-robots-tag'), 'index, follow');
    r = await t.req('/modulos'); assert.equal(r.status, 200); assert.match(r.text, /R\$\s?797,00/); assert.match(r.text, /R\$\s?397,00/);
    r = await t.req('/servicos'); assert.equal(r.status, 200); assert.match(r.text, /Vistorias técnicas e laudos/); assert.doesNotMatch(r.text, /Adequação de caixa e poço/);
    r = await t.req('/orcamento'); assert.equal(r.status, 200); assert.match(r.text, /name="servicos"/);
    r = await t.req('/contato', {method: 'POST', form: {origem: 'orcamento', nome: 'Gestora', email: 'gestora@adm.com', perfil: 'Administradora de condomínios', servicos: 'Vistoria técnica e laudo', pavimentos: '12', elevadores: '2', cidade: 'São Paulo', mensagem: 'Elevadores de 1998, muitas paradas.'}});
    assert.equal(r.status, 303); assert.equal(r.location, '/orcamento?contato=enviado');
    // contato: grava, envia ao e-mail da SilSec com resposta para o visitante
    r = await t.req('/contato', {method: 'POST', form: {nome: 'Síndico Silva', email: 'sindico@predio.com', telefone: '11 99999-0000', empresa: 'Edifício Aurora', assunto: 'Modernização', mensagem: 'Gostaria de um orçamento.'}});
    assert.equal(r.status, 303); assert.equal(r.location, '/?contato=enviado#contato');
    assert.equal(t.sent.at(-1).to, BRAND.email); assert.equal(t.sent.at(-1).replyTo, 'sindico@predio.com'); assert.match(t.sent.at(-1).text, /Edifício Aurora/);
    const before = t.sent.length;
    r = await t.req('/contato', {method: 'POST', form: {nome: 'Robô', email: 'x@y.com', mensagem: 'spam', site: 'http://spam'}});
    assert.equal(r.status, 303); assert.equal(t.sent.length, before);
    r = await t.req('/contato', {method: 'POST', form: {nome: '', email: 'x', mensagem: ''}}); assert.match(r.location, /invalido/);
    r = await t.req('/contato', {method: 'POST', form: {nome: 'A', email: 'a@b.com', mensagem: 'oi oi'}, headers: {origin: 'https://evil.example'}}); assert.match(r.location, /erro/);
    r = await t.req('/robots.txt'); assert.match(r.text, /Disallow: \/sistema/);
    r = await t.req('/sitemap.xml'); assert.match(r.text, /<urlset/);
    r = await t.req('/?supplierInvite=abc'); assert.equal(r.status, 302); assert.equal(r.location, '/sistema?supplierInvite=abc');
    r = await t.req('/painel'); assert.equal(r.status, 303); assert.match(r.location, /^\/entrar/);
    r = await t.req('/site.css'); assert.equal(r.status, 200);
    r = await t.req('/site/plataforma.png'); assert.equal(r.status, 200);
  } finally { await t.close(); }
});

test('chave de acesso: administrador cria, cliente ativa, cria senha e ganha 30 dias do Completo', async () => {
  const t = await boot();
  try {
    await t.owner();
    let r = await t.req('/painel', {user: 'owner'});
    assert.equal(r.status, 200); assert.match(r.text, /Nova chave de acesso/);
    r = await t.req('/painel/chaves', {user: 'owner', method: 'POST', form: {nome: 'Construtora Alfa', email: 'Compras@Alfa.com.br', empresa: 'Alfa', contrato: '2026-014', modulo: 'advanced', dias: '30', validade: '30', enviar: '1'}});
    assert.equal(r.status, 200); assert.match(r.text, /Chave criada/);
    const mail = t.sent.at(-1); assert.equal(mail.to, 'compras@alfa.com.br');
    const code = codeFrom(mail);
    assert.match(mail.text, /\/ativar\?chave=FSC-/); assert.ok(r.text.includes(code));
    // só o código aparece uma vez; o banco guarda apenas o resumo
    const stored = await t.db.prepare('SELECT * FROM access_keys').bind().first();
    assert.ok(!JSON.stringify(stored).includes(code.replace(/-/g, '').slice(3)));
    // chave inválida
    r = await t.req('/ativar', {user: 'cli', method: 'POST', form: {chave: 'FSC-AAAA-BBBB-CCCC'}}); assert.match(r.text, /não encontrada/);
    // ativação anônima: envia link para criar senha ao e-mail da chave
    r = await t.req('/ativar', {user: 'cli', method: 'POST', form: {chave: code.toLowerCase()}});
    assert.equal(r.status, 200); assert.match(r.text, /Chave ativada/); assert.match(r.text, /co\*\*\*@alfa\.com\.br/);
    const pw = t.sent.at(-1); assert.equal(pw.to, 'compras@alfa.com.br'); assert.match(pw.subject, /Confirme seu e-mail/);
    r = await t.confirm(pw, 'senha-da-alfa-123', 'cli'); assert.equal(r.status, 303); assert.equal(r.location, '/sistema');
    r = await t.req('/api/session', {user: 'cli'}); assert.equal(r.status, 200);
    const s = JSON.parse(r.text); assert.equal(s.user.email, 'compras@alfa.com.br'); assert.equal(s.user.role, 'client_manager');
    r = await t.req('/api/licenses', {user: 'cli'}); const ent = JSON.parse(r.text).entitlements;
    assert.equal(ent.advanced.active, true); assert.ok(ent.advanced.daysRemaining >= 29 && ent.advanced.daysRemaining <= 30);
    // reutilizar a chave não funciona
    r = await t.req('/ativar', {user: 'outro', method: 'POST', form: {chave: code}}); assert.match(r.text, /já foi ativada/);
    // cliente não acessa o painel
    r = await t.req('/painel', {user: 'cli'}); assert.equal(r.status, 403);
    // assinatura sem Mercado Pago configurado mostra contato com a SilSec
    r = await t.req('/assinatura', {user: 'cli'}); assert.equal(r.status, 200); assert.match(r.text, /período de teste/); assert.match(r.text, /Pagar pelo WhatsApp/);
    // aviso por e-mail 7 dias antes do fim do teste, sem repetir
    await t.db.prepare("UPDATE module_grants SET ends_at = ? WHERE source = 'trial'").bind(new Date(Date.now() + 3 * 864e5).toISOString()).run();
    const sentBefore = t.sent.length;
    assert.equal(await t.app.commerce.sendReminders('http://x'), 1);
    assert.equal(t.sent.at(-1).to, 'compras@alfa.com.br'); assert.match(t.sent.at(-1).subject, /vence em/); assert.match(t.sent.at(-1).text, /\/assinatura/);
    assert.equal(await t.app.commerce.sendReminders('http://x'), 0); assert.equal(t.sent.length, sentBefore + 1);
    // painel mostra a chave ativada e o cliente
    r = await t.req('/painel', {user: 'owner'}); assert.match(r.text, /ativada/); assert.match(r.text, /Construtora Alfa/);
  } finally { await t.close(); }
});

test('chave: cancelar, reenviar com nova chave e vencimento', async () => {
  const t = await boot();
  try {
    await t.owner();
    await t.req('/painel/chaves', {user: 'owner', method: 'POST', form: {nome: 'Cliente B', email: 'b@cliente.com', modulo: 'basic', dias: '30', validade: '10', enviar: '1'}});
    const first = codeFrom(t.sent.at(-1));
    const key = await t.db.prepare('SELECT * FROM access_keys').bind().first();
    await t.req(`/painel/chaves/${key.id}/reenviar`, {user: 'owner', method: 'POST', form: {}});
    const second = codeFrom(t.sent.at(-1)); assert.notEqual(first, second);
    let r = await t.req('/ativar', {user: 'x', method: 'POST', form: {chave: first}}); assert.match(r.text, /não encontrada/);
    await t.db.prepare('UPDATE access_keys SET expires_at = ? WHERE id = ?').bind('2000-01-01T00:00:00.000Z', key.id).run();
    r = await t.req('/ativar', {user: 'x', method: 'POST', form: {chave: second}}); assert.match(r.text, /venceu/);
    await t.req(`/painel/chaves/${key.id}/cancelar`, {user: 'owner', method: 'POST', form: {}});
    r = await t.req('/ativar', {user: 'x', method: 'POST', form: {chave: second}}); assert.match(r.text, /cancelada/);
    // formulário do painel vindo de outro site é recusado
    r = await t.req('/painel/chaves', {user: 'owner', method: 'POST', form: {nome: 'X', email: 'x@x.com'}, headers: {origin: 'https://evil.example'}});
    assert.match(r.text, /origem não autorizada/);
  } finally { await t.close(); }
});

test('assinatura: Mercado Pago cria pagamento, webhook confirma e libera 12 meses após o teste', async () => {
  const mpState = {};
  const t = await boot({MP_ACCESS_TOKEN: 'APP_USR-test', MP_WEBHOOK_SECRET: 'segredo-webhook'}, mpState);
  try {
    await t.owner();
    await t.req('/painel/chaves', {user: 'owner', method: 'POST', form: {nome: 'Cliente C', email: 'c@cliente.com', modulo: 'advanced', dias: '30', validade: '30', enviar: '1'}});
    await t.req('/ativar', {user: 'cli', method: 'POST', form: {chave: codeFrom(t.sent.at(-1))}});
    await t.confirm(t.sent.at(-1), 'senha-do-cliente-c', 'cli');
    let r = await t.req('/assinatura', {user: 'cli'}); assert.match(r.text, /Pagar R\$\s?797,00 com Mercado Pago/);
    // preço manipulado no formulário não muda o valor cobrado
    r = await t.req('/assinatura/pagar', {user: 'cli', method: 'POST', form: {plano: 'advanced', valor: '1'}});
    assert.equal(r.status, 303); assert.match(r.location, /^https:\/\/www\.mercadopago\.com\.br\//);
    assert.equal(mpState.preference.items[0].unit_price, 797); assert.equal(mpState.preference.payer.email, 'c@cliente.com');
    assert.match(mpState.preference.notification_url, /\/webhooks\/mercadopago/);
    const pay = await t.db.prepare('SELECT * FROM payments').bind().first(); assert.equal(pay.status, 'pending'); assert.equal(pay.amount_cents, 79700);
    // webhook com assinatura inválida é recusado
    r = await t.req('/webhooks/mercadopago?data.id=555&type=payment', {method: 'POST', json: {type: 'payment', data: {id: '555'}}, headers: {'x-signature': 'ts=1,v1=abc', 'x-request-id': 'r1'}});
    assert.equal(r.status, 401);
    // webhook válido: confere na API e libera acesso
    const ts = String(Math.floor(Date.now() / 1000)), sig = createHmac('sha256', 'segredo-webhook').update(`id:555;request-id:r2;ts:${ts};`).digest('hex');
    r = await t.req('/webhooks/mercadopago?data.id=555&type=payment', {method: 'POST', json: {type: 'payment', data: {id: '555'}}, headers: {'x-signature': `ts=${ts},v1=${sig}`, 'x-request-id': 'r2'}});
    assert.equal(r.status, 200);
    const paid = await t.db.prepare('SELECT * FROM payments').bind().first(); assert.equal(paid.status, 'approved'); assert.equal(paid.provider_payment_id, '555');
    // 12 meses contados depois do fim do teste de 30 dias (≈ 395 dias)
    const days = (Date.parse(paid.access_until) - Date.now()) / 864e5; assert.ok(days > 390 && days < 398, String(days));
    r = await t.req('/api/licenses', {user: 'cli'}); assert.ok(JSON.parse(r.text).entitlements.advanced.daysRemaining > 390);
    assert.ok(t.sent.some(m => m.to === 'c@cliente.com' && /Pagamento confirmado/.test(m.subject)));
    // notificação repetida não concede de novo
    const grantsBefore = (await t.db.prepare('SELECT COUNT(*) AS n FROM module_grants').bind().first()).n;
    r = await t.req('/webhooks/mercadopago?data.id=555&type=payment', {method: 'POST', json: {type: 'payment', data: {id: '555'}}, headers: {'x-signature': `ts=${ts},v1=${sig}`, 'x-request-id': 'r2'}});
    assert.equal((await t.db.prepare('SELECT COUNT(*) AS n FROM module_grants').bind().first()).n, grantsBefore);
    // retorno do checkout leva à página de assinatura com aviso
    r = await t.req('/assinatura/retorno?payment_id=555&status=approved', {user: 'cli'}); assert.equal(r.location, '/assinatura?pagamento=aprovado');
    r = await t.req('/assinatura?pagamento=aprovado', {user: 'cli'}); assert.match(r.text, /Pagamento aprovado/); assert.match(r.text, /pago/);
    r = await t.req('/painel', {user: 'owner'}); assert.match(r.text, /R\$\s?797,00/);
  } finally { await t.close(); }
});

test('assinatura: valor divergente não libera acesso', async () => {
  const mpState = {amount: 1};
  const t = await boot({MP_ACCESS_TOKEN: 'APP_USR-test'}, mpState);
  try {
    await t.owner();
    await t.req('/assinatura/pagar', {user: 'owner', method: 'POST', form: {plano: 'basic'}});
    const r = await t.req('/webhooks/mercadopago?data.id=777&type=payment', {method: 'POST', json: {type: 'payment', data: {id: '777'}}});
    assert.equal(r.status, 200);
    const p = await t.db.prepare('SELECT * FROM payments').bind().first(); assert.equal(p.status, 'divergent');
    assert.equal((await t.db.prepare("SELECT COUNT(*) AS n FROM module_grants WHERE source = 'mercadopago'").bind().first()).n, 0);
  } finally { await t.close(); }
});

test('teste grátis independente: cadastro sem chave libera 30 dias do Completo uma única vez por e-mail', async () => {
  const t = await boot();
  try {
    const page = await t.req('/experimentar');
    assert.equal(page.status, 200); assert.match(page.text, /30 dias/); assert.match(page.text, /Acesso educacional/);
    const home = await t.req('/');
    assert.match(home.text, /Acesso educacional/); assert.doesNotMatch(home.text, /fabiosecco/i); const modulos = await t.req('/modulos'); assert.match(modulos.text, /href="\/experimentar"/); assert.match(modulos.text, /Acesso educacional/);
    const r = await t.req('/experimentar', {method: 'POST', user: 'novo', form: {nome: 'Ana Engenheira', email: 'Ana@Exemplo.com', perfil: 'estudante'}});
    assert.equal(r.status, 200); assert.match(r.text, /teste do plano Completo vale até/);
    const mail = t.sent.at(-1); assert.equal(mail.to, 'ana@exemplo.com');
    await t.confirm(mail, 'senha-da-ana-123', 'novo');
    const sub = await t.req('/assinatura', {user: 'novo'});
    assert.match(sub.text, /Plano Completo/); assert.match(sub.text, /período de teste/);
    const again = await t.req('/experimentar', {method: 'POST', user: 'outro', form: {nome: 'Ana', email: 'ana@exemplo.com'}});
    assert.match(again.text, /já usou o período de teste/);
    const grants = await t.db.prepare("SELECT COUNT(*) AS n FROM module_grants WHERE source = 'trial'").bind().first();
    assert.equal(Number(grants.n), 1);
    const foreign = await t.req('/experimentar', {method: 'POST', user: 'x', form: {nome: 'X', email: 'x@exemplo.com'}, headers: {origin: 'https://malicioso.example'}});
    assert.match(foreign.text, /origem não autorizada/);
  } finally { await t.close(); }
});

test('vistorias: modelo padrão, preenchimento por seção com foto, não conformidade no relatório e isolamento entre usuários', async () => {
  const {parseTemplate, DEFAULT_TEMPLATE} = await import('../server/platform/inspections.mjs');
  const parsed = parseTemplate(DEFAULT_TEMPLATE.source);
  assert.equal(parsed.errors.length, 0); assert.ok(parsed.sections.length >= 7);
  assert.ok(parseTemplate('## A\n- errado pergunta').errors.length > 0);
  assert.equal(parseTemplate('## A\n- opcoes(Sim|Não): Teste').sections[0].items[0].options.length, 2);
  const t = await boot();
  try {
    await t.owner();
    let r = await t.req('/vistorias', {user: 'owner'});
    assert.equal(r.status, 200); assert.match(r.text, /Nova vistoria/); assert.match(r.text, /Modelos de vistoria/);
    const modelo = r.text.match(/<option value="([0-9a-f-]{36})">/)[1];
    r = await t.req('/vistorias/nova', {user: 'owner', method: 'POST', form: {modelo, titulo: 'Elevador social', edificio: 'Ed. Teste'}});
    assert.equal(r.status, 303); const id = r.location.match(/vistorias\/([0-9a-f-]{36})/)[1];
    r = await t.req(`/vistorias/${id}?secao=1`, {user: 'owner'});
    assert.match(r.text, /Casa de máquinas/);
    const fd = new FormData();
    fd.set('a_s2i1', 'nao'); fd.set('a_s2i1_obs', 'Porta sem tranca'); fd.set('a_s2i5', 'Regular'); fd.set('ir', '2');
    fd.append('a_s2i7_foto', new Blob([new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3])], {type: 'image/jpeg'}), 'foto.jpg');
    const res = await fetch(t.base + `/vistorias/${id}?secao=1`, {method: 'POST', body: fd, headers: {cookie: t.jar.owner, origin: t.base}, redirect: 'manual'});
    assert.equal(res.status, 303); assert.match(res.headers.get('location'), /secao=2/);
    r = await t.req(`/vistorias/${id}/relatorio`, {user: 'owner'});
    assert.match(r.text, /1 não conformidade/); assert.match(r.text, /Porta sem tranca/); assert.match(r.text, /Regular/);
    const foto = r.text.match(/\/vistorias\/foto\?k=([^"]+)/)[1];
    const img = await t.req('/vistorias/foto?k=' + foto, {user: 'owner'}); assert.equal(img.status, 200);
    const other = await t.req(`/vistorias/${id}/relatorio`, {user: 'anon'}); assert.equal(other.status, 303);
    const forged = await t.req('/vistorias/nova', {user: 'owner', method: 'POST', form: {modelo, titulo: 'x'}, headers: {origin: 'https://malicioso.example'}});
    assert.equal(forged.status, 403);
  } finally { await t.close(); }
});
