// Envio de e-mail com transporte de teste: sucesso, falha de autenticação (EAUTH 535) na tela e botão "Testar envio" do administrador.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readConfig} from '../server/platform/config.mjs';
import {createApp} from '../server/platform/app.mjs';
import {openSqlite} from '../server/platform/database.mjs';
import {createMailer, describeMailError} from '../server/platform/mailer.mjs';

const OWNER = 'dono@silsec.test';

// Transporte falso no lugar do SMTP: guarda as mensagens ou falha como o servidor da Hostinger com senha errada.
function fakeTransport(state) {
  return () => ({async sendMail(m) {
    if (state.delay) await new Promise(r => setTimeout(r, state.delay));
    if (state.fail) { const e = new Error('Invalid login: 535 5.7.8 Error: authentication failed'); e.code = 'EAUTH'; e.response = '535 5.7.8 Error: authentication failed'; e.responseCode = 535; throw e; }
    state.sent.push(m); return {messageId: '<teste@silsec>'};
  }});
}

async function boot() {
  const state = {fail: false, sent: []};
  const smtp = {host: 'smtp.hostinger.com', port: 465, secure: true, user: 'contato@silsec-engenharia.com.br', password: 'x', from: 'SilSec <contato@silsec-engenharia.com.br>'};
  const mailer = createMailer(smtp, {log() {}, warn() {}, error() {}}, {createTransport: fakeTransport(state)});
  const config = readConfig({SITE_OWNER_EMAIL: OWNER, DB_DRIVER: 'sqlite', SQLITE_FILE: ':memory:'});
  const app = await createApp(config, {db: await openSqlite(':memory:'), mailer, log: {log() {}, warn() {}, error() {}}});
  const server = createServer(app.handler);
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const base = 'http://127.0.0.1:' + server.address().port, jar = {};
  async function req(path, {method = 'GET', form, user = 'a', headers = {}} = {}) {
    const h = {...headers}; if (jar[user]) h.cookie = jar[user];
    let body; if (form) { body = new URLSearchParams(form).toString(); h['content-type'] = 'application/x-www-form-urlencoded'; h.origin = base; }
    const r = await fetch(base + path, {method, headers: h, body, redirect: 'manual'});
    for (const c of r.headers.getSetCookie()) { const v = c.split(';')[0]; jar[user] = v.endsWith('=') ? '' : v; }
    return {status: r.status, location: r.headers.get('location'), text: await r.text()};
  }
  const linkFrom = m => m.text.match(/https?:\/\/\S+/)[0];
  return {state, mailer, req, linkFrom, async close() { await new Promise(r => server.close(r)); await app.close(); }};
}

test('e-mail: motivos de falha em português', () => {
  assert.match(describeMailError({code: 'EAUTH', response: '535 5.7.8 authentication failed'}), /recusou o usuário ou a senha.*EAUTH 535.*SMTP_PASSWORD/);
  assert.match(describeMailError({code: 'ECONNECTION', address: 'smtp.x'}), /Não foi possível conectar.*SMTP_HOST/);
  assert.match(describeMailError({code: 'ETIMEDOUT'}), /não respondeu a tempo/);
  assert.match(describeMailError({code: 'EENVELOPE'}), /remetente ou o destinatário.*SMTP_FROM/);
  assert.match(describeMailError({code: 'ERR_MODULE_NOT_FOUND'}), /nodemailer.*npm install/);
  assert.match(describeMailError(new Error('x')), /Falha no envio: x/);
});

test('e-mail: cadastro, recuperação de senha e orçamento saem pelo transporte; com EAUTH a tela avisa em vez de dizer que enviou', async () => {
  const t = await boot();
  try {
    // 1) Cadastro → link de verificação enviado
    let r = await t.req('/cadastrar', {method: 'POST', form: {nome: 'Dono', email: OWNER, volta: '/'}});
    assert.equal(r.status, 200); assert.match(r.text, /Confirme seu e-mail/); assert.doesNotMatch(r.text, /Não conseguimos enviar/);
    assert.equal(t.state.sent.length, 1); assert.match(t.state.sent[0].subject, /Confirme seu e-mail/); assert.equal(t.state.sent[0].from, 'SilSec <contato@silsec-engenharia.com.br>');
    const link = new URL(t.linkFrom(t.state.sent[0]));
    r = await t.req('/verificar', {method: 'POST', form: {token: link.searchParams.get('token'), senha: 'senha-muito-boa-1', volta: '/'}});
    assert.ok([200, 303].includes(r.status), r.text);
    // 2) Recuperação de senha → link de redefinição enviado
    r = await t.req('/esqueci-senha', {method: 'POST', form: {email: OWNER}});
    assert.equal(r.status, 200); assert.match(r.text, /enviamos um link para criar uma nova senha/);
    assert.equal(t.state.sent.length, 2); assert.match(t.state.sent[1].subject, /Recuperação de senha/); assert.match(t.linkFrom(t.state.sent[1]), /\/redefinir-senha\?token=/);
    // 3) Formulário de orçamento → e-mail para a SilSec com resposta ao solicitante
    r = await t.req('/contato', {method: 'POST', form: {origem: 'orcamento', nome: 'Síndico', perfil: 'sindico', email: 'sindico@predio.test', telefone: '11999990000', cidade: 'Santo André', pavimentos: '12', elevadores: '2', mensagem: 'Preciso de um estudo para modernização.', lgpd: 'on', site: ''}});
    assert.equal(r.status, 303); assert.match(r.location, /orcamento\?contato=enviado/);
    assert.equal(t.state.sent.length, 3); assert.match(t.state.sent[2].subject, /Orçamento/); assert.equal(t.state.sent[2].replyTo, 'sindico@predio.test'); assert.match(t.state.sent[2].text, /Cidade do edifício: Santo André/);
    assert.equal(t.mailer.status().lastError, null); assert.ok(t.mailer.status().lastDeliveredAt);

    // 4) Senha da caixa errada (EAUTH 535): a tela não diz mais "enviamos um link", mas também não revela quem tem conta nem a configuração.
    // 9.5.7: o aviso usa o estado do servidor de e-mail antes do pedido; o primeiro envio que falha registra a falha e o aviso aparece a partir do pedido seguinte, igual para qualquer e-mail.
    t.state.fail = true;
    await t.req('/esqueci-senha', {method: 'POST', form: {email: OWNER}});
    r = await t.req('/esqueci-senha', {method: 'POST', form: {email: OWNER}});
    assert.equal(r.status, 200); assert.match(r.text, /Não foi possível enviar o e-mail agora\. Tente novamente mais tarde/); assert.doesNotMatch(r.text, /enviamos um link/); assert.doesNotMatch(r.text, /SMTP|EAUTH|hPanel|variáveis de ambiente/);
    const r2 = await t.req('/esqueci-senha', {method: 'POST', form: {email: 'ninguem@silsec.test'}});
    assert.equal(r2.status, r.status); assert.equal(r2.text.replace(/ninguem@silsec\.test|dono@silsec\.test/g, 'X'), r.text.replace(/ninguem@silsec\.test|dono@silsec\.test/g, 'X'), 'mesma resposta para e-mail cadastrado e não cadastrado');
    r = await t.req('/cadastrar', {method: 'POST', form: {nome: 'Outra', email: 'outra@silsec.test', volta: '/'}, user: 'b'});
    assert.equal(r.status, 200); assert.match(r.text, /Não conseguimos enviar o e-mail/); assert.doesNotMatch(r.text, /SMTP|EAUTH/);
    r = await t.req('/cadastrar', {method: 'POST', form: {nome: 'Dono', email: OWNER, volta: '/'}, user: 'c'});
    assert.equal(r.status, 200); assert.match(r.text, /Não conseguimos enviar o e-mail/, 'conta existente recebe a mesma tela');
    assert.match(t.mailer.status().lastError.reason, /recusou o usuário ou a senha/, 'o motivo técnico fica no painel/log');
    assert.equal(t.mailer.recentFailure(), true);
    assert.equal(t.state.sent.length, 3);
    // orçamento com e-mail falhando: fica registrado e a tela avisa
    r = await t.req('/contato', {method: 'POST', form: {origem: 'orcamento', nome: 'Síndico 2', perfil: 'sindico', email: 'outro@predio.test', mensagem: 'Estudo para prédio novo.', lgpd: 'on', site: ''}});
    assert.equal(r.status, 303); assert.match(r.location, /orcamento\?contato=registrado/);
    r = await t.req('/orcamento?contato=registrado');
    assert.match(r.text, /registrada, mas o aviso por e-mail não pôde ser enviado/);
  } finally { await t.close(); }
});

test('e-mail: botão "Testar envio de e-mail" no painel do administrador mostra sucesso e o erro do SMTP em português', async () => {
  const t = await boot();
  try {
    let r = await t.req('/cadastrar', {method: 'POST', form: {nome: 'Dono', email: OWNER, volta: '/'}});
    const link = new URL(t.linkFrom(t.state.sent[0]));
    await t.req('/verificar', {method: 'POST', form: {token: link.searchParams.get('token'), senha: 'senha-muito-boa-1', volta: '/'}});
    r = await t.req('/entrar', {method: 'POST', form: {email: OWNER, senha: 'senha-muito-boa-1', volta: '/admin/sistema'}});
    assert.ok([200, 303].includes(r.status), r.text);
    r = await t.req('/admin/sistema');
    assert.equal(r.status, 200, r.text);
    assert.match(r.text, /Envio de e-mail/); assert.match(r.text, /smtp\.hostinger\.com:465 · conexão segura/); assert.match(r.text, /Testar envio de e-mail/); assert.doesNotMatch(r.text, /"x"/, 'a senha não aparece');
    r = await t.req('/admin/sistema/email-teste', {method: 'POST', form: {para: OWNER}});
    assert.equal(r.status, 200); assert.match(r.text, /E-mail de teste enviado para dono@silsec\.test em \d+ ms/);
    assert.match(t.state.sent.at(-1).subject, /Teste de envio/);
    t.state.fail = true;
    r = await t.req('/admin/sistema/email-teste', {method: 'POST', form: {para: OWNER}});
    assert.equal(r.status, 200); assert.match(r.text, /O envio falhou: O servidor de e-mail recusou o usuário ou a senha da caixa \(EAUTH 535\)/);
    assert.match(r.text, /Última falha em/);
    r = await t.req('/admin/sistema/email-teste', {method: 'POST', form: {para: 'inválido'}});
    assert.match(r.text, /Informe um e-mail válido/);
  } finally { await t.close(); }
});

test('e-mail: sem SMTP configurado o envio não derruba a tela e informa o administrador', async () => {
  const m = createMailer(null, {log() {}, warn() {}, error() {}});
  const r = await m.send({to: 'a@b.c', subject: 's', text: 't'});
  assert.equal(r.delivered, false); assert.equal(r.configured, false); assert.match(r.reason, /não configurado/);
  assert.equal(m.status().configured, false);
});

test('esqueci-senha: resposta e tempo iguais com e sem cadastro, inclusive com e-mail lento (9.5.7)', async () => {
  const t = await boot();
  const {FORGOT_RESPONSE_MS} = await import('../server/platform/auth.mjs');
  const timed = async email => { const t0 = performance.now(); const r = await t.req('/esqueci-senha', {method: 'POST', form: {email}}); return {...r, ms: performance.now() - t0, text: r.text.replace(email, 'X')}; };
  try {
    let r = await t.req('/cadastrar', {method: 'POST', form: {nome: 'Dono', email: OWNER, volta: '/'}});
    r = await t.req('/verificar', {method: 'POST', form: {token: new URL(t.linkFrom(t.state.sent[0])).searchParams.get('token'), senha: 'senha-muito-boa-1', volta: '/'}});
    for (const delay of [0, 3000]) {
      t.state.delay = delay;
      const com = await timed(OWNER), sem = await timed('ninguem@silsec.test');
      assert.equal(com.status, 200); assert.equal(sem.status, com.status);
      assert.equal(sem.text, com.text, 'mesma página para e-mail cadastrado e não cadastrado');
      assert.match(com.text, /Se o e-mail estiver cadastrado, enviamos um link/);
      for (const x of [com, sem]) assert.ok(x.ms >= FORGOT_RESPONSE_MS - 20 && x.ms < FORGOT_RESPONSE_MS + 700, `tempo fora da faixa: ${Math.round(x.ms)} ms (e-mail com atraso de ${delay} ms)`);
      assert.ok(Math.abs(com.ms - sem.ms) < 500, `diferença de tempo: ${Math.round(Math.abs(com.ms - sem.ms))} ms`);
    }
    await new Promise(r => setTimeout(r, 3200));
    assert.equal(t.state.sent.filter(m => /Recuperação de senha/.test(m.subject)).length, 2, 'o link sai só para quem tem conta, também quando o e-mail demora');
  } finally { await t.close(); }
});

test('orçamento: assunto do e-mail com no máximo 80 caracteres, sem quebrar palavra e com "…" (9.5.7)', async () => {
  const {shortSubject} = await import('../server/platform/commerce.mjs');
  assert.equal(shortSubject('Orçamento · Estudo de tráfego'), 'Orçamento · Estudo de tráfego', 'assunto curto não muda');
  const longo = 'Contato pelo site · Orçamento · Estudo de tráfego de elevadores, Vistoria técnica, Modernização · Condomínio Edifício Residencial Jardim das Acácias';
  const s = shortSubject(longo);
  assert.ok(s.length <= 80, `${s.length} caracteres`); assert.ok(s.endsWith('…'));
  const base = s.slice(0, -1);
  assert.ok(longo.startsWith(base) && /[\s·,]/.test(longo[base.length]), 'corta no fim de uma palavra: ' + s);
  assert.equal(shortSubject('x'.repeat(120)).length, 80, 'palavra única maior que o limite é cortada no limite');
  const t = await boot();
  try {
    const r = await t.req('/contato', {method: 'POST', form: {origem: 'orcamento', nome: 'Administradora de Condomínios Jardim das Acácias e Associados Ltda', perfil: 'sindico', email: 'sindico@predio.test', servicos: 'Estudo de tráfego de elevadores pela NBR 5665 e ISO 8100-32', mensagem: 'Preciso de um estudo para modernização.', lgpd: 'on', site: ''}});
    assert.equal(r.status, 303);
    const m = t.state.sent.at(-1);
    assert.ok(m.subject.length <= 80, `${m.subject.length} caracteres: ${m.subject}`); assert.ok(m.subject.endsWith('…'));
    assert.match(m.subject, /^Contato pelo site · Orçamento · Estudo de tráfego/);
    assert.match(m.text, /Nome: Administradora de Condomínios Jardim das Acácias e Associados Ltda/, 'o corpo do e-mail mantém o nome completo');
  } finally { await t.close(); }
});
