// TES 1.0.4 / SilSec 19r · etapa 1 do simulador (Fabio, 23/11/2026: "Aproveitar o convite"):
// - o convite leva, só no e-mail do convidado, um link pessoal de acesso direto (criar a senha e abrir o projeto), válido por 30 dias;
// - a proposta do fornecedor guarda os dados do fabricante para a simulação de operação real, sem mudar o cálculo;
// - abertura antecipada: limite provisório de 0,8 m/s (EN 81-20, a confirmar na NBR 16858).
import test from 'node:test';
import assert from 'node:assert/strict';
import {D1, R2} from './helpers/sqlite-d1.mjs';
import {handleApi} from '../server/api.mjs';
import {createAuth, INVITE_DAYS} from '../server/platform/auth.mjs';
import {readConfig} from '../server/platform/config.mjs';
import {defaultStudy} from '../www/engine.js';
import {newOffer, SIMULATION_FIELDS, MANUFACTURER_FIELDS, simulationDataErrors} from '../www/procurement.js';

async function fixture({mailer} = {}) {
  const sent = [];
  const env = {DB: new D1(), BUCKET: new R2(), SITE_OWNER_EMAIL: 'owner@test.dev',
    MAILER: mailer ?? {configured: true, async send(m) { sent.push(m); return {delivered: true}; }}};
  const owner = {id: 'o', email: 'owner@test.dev'};
  async function call(path, method = 'GET', data, user = owner) {
    const h = {'content-type': 'application/json'};
    if (user) { h['oai-authenticated-user-id'] = user.id; h['oai-authenticated-user-email'] = user.email; }
    const r = await handleApi(new Request('https://traffic.test/api/' + path, {method, headers: h, body: data === undefined ? undefined : JSON.stringify(data)}), env);
    return {status: r.status, data: await r.json()};
  }
  await call('session');
  const project = (await call('projects', 'PUT', {study: defaultStudy(), calculate: true})).data;
  return {env, call, project, sent};
}

test('convite: o e-mail leva link pessoal de 30 dias; quem convida não vê o link', async () => {
  const f = await fixture();
  const r = await f.call('projects/' + f.project.id + '/access', 'POST', {email: 'Forn@Empresa.test', company: 'Fornecedor', name: 'Ana', kind: 'supplier'});
  assert.equal(r.status, 201, JSON.stringify(r.data));
  assert.equal(r.data.email.sent, true);
  const mail = f.sent.at(-1);
  assert.equal(mail.to, 'forn@empresa.test');
  const link = new URL(mail.text.match(/https:\/\/traffic\.test\/verificar\?\S+/)[0]);
  assert.match(link.searchParams.get('token'), /^[a-f0-9]{64}$/);
  assert.equal(link.searchParams.get('volta'), '/?project=' + f.project.id);
  assert.match(mail.text, new RegExp(`pessoal e vale por ${INVITE_DAYS} dias`));
  // o link não volta para quem convida, nem na prévia, nem no log de e-mail não enviado
  assert.doesNotMatch(JSON.stringify(r.data), /verificar\?token/);
  assert.doesNotMatch(mail.logText, /verificar\?token/);
  // validade de 30 dias
  const tok = await f.env.DB.prepare("SELECT expires_at FROM auth_tokens WHERE kind = 'verify'").bind().first();
  const dias = (Date.parse(tok.expires_at) - Date.now()) / 864e5;
  assert.ok(dias > INVITE_DAYS - 0.01 && dias <= INVITE_DAYS, String(dias));

  // o convidado abre o link, cria a senha e cai direto no projeto
  const config = readConfig({SITE_OWNER_EMAIL: 'owner@test.dev', DB_DRIVER: 'sqlite', SQLITE_FILE: ':memory:'});
  const auth = createAuth({db: f.env.DB, config, mailer: f.env.MAILER, log: {log() {}, warn() {}, error() {}}});
  const tela = await auth.handle(new Request(link.href));
  assert.equal(tela.status, 200);
  assert.match(await tela.text(), /Crie sua senha/);
  const form = new URLSearchParams({token: link.searchParams.get('token'), senha: 'senha-do-fornecedor-1', volta: link.searchParams.get('volta')});
  const fim = await auth.handle(new Request('https://traffic.test/verificar', {method: 'POST', headers: {'content-type': 'application/x-www-form-urlencoded', origin: 'https://traffic.test'}, body: form.toString()}));
  assert.equal(fim.status, 303);
  assert.equal(fim.headers.get('location'), '/?project=' + f.project.id);
  assert.match(fim.headers.get('set-cookie'), /silsec_sessao=[a-f0-9]{64}/);

  // novo envio do convite: a pessoa já tem senha, o link é o de entrar
  const lista = await f.call('projects/' + f.project.id + '/access');
  const acesso = lista.data.access.find(a => a.email === 'forn@empresa.test');
  const reenvio = await f.call('projects/' + f.project.id + '/access/' + acesso.id + '/email', 'POST', {});
  assert.equal(reenvio.status, 200, JSON.stringify(reenvio.data));
  assert.match(f.sent.at(-1).text, /https:\/\/traffic\.test\/entrar\?volta=%2F%3Fproject%3D/);
});

test('convite sem e-mail configurado: nenhum link pessoal é criado', async () => {
  const f = await fixture({mailer: {configured: false, async send() { throw new Error('não deveria enviar'); }}});
  const r = await f.call('projects/' + f.project.id + '/access', 'POST', {email: 'cli@empresa.test', company: 'Cliente', name: 'Bia', kind: 'client'});
  assert.equal(r.status, 201);
  assert.equal(r.data.email.sent, false);
  assert.equal(await f.env.DB.prepare('SELECT COUNT(*) AS n FROM auth_tokens').bind().first().then(x => x.n), 0);
});

test('proposta: guarda os dados do fabricante para a simulação; abertura antecipada acima de 0,8 m/s é recusada', async () => {
  const f = await fixture();
  const path = 'projects/' + f.project.id;
  await f.call(path + '/access', 'POST', {email: 'forn@empresa.test', company: 'Fornecedor', name: 'Ana', kind: 'supplier'});
  const forn = {id: 'forn@empresa.test', email: 'forn@empresa.test'};
  await f.call('session', 'GET', undefined, forn);
  const offer = newOffer(f.project.study, {blank: true});
  for (const g of offer.groups) assert.ok(SIMULATION_FIELDS.every(([k]) => k in g) && g.dispatch && 'passengerBasis' in g);
  Object.assign(offer.groups[0], {levelingTime: 0.6, doorReleaseTime: 0.3, preOpeningSpeed: 0.3, dwellCar: 1, dwellLanding: 2, closingDelay: 0.5,
    reopenTime: 2.5, nudgingAfter: 20, flightTimeMeasured: 4.8, flightDistance: 3, performanceTimeMeasured: 9.6, performanceDistance: 3,
    responseTime: 0.4, transfer800: 1.2, transfer900: 1.0, transfer1000: 0.9, cabinAreaM2: 1.66, ratedLoadKg: 600, occupancyRecommended: 80,
    standbyLightOnW: 120, standbyLightOffW: 60, passengerBasis: 'movimento', dispatch: {type: 'grupo', returnToLobby: 'sim', parking: 'térreo', zoning: '', peakMode: 'pico de entrada'}});
  const ok = await f.call(path + '/offers', 'PUT', {data: offer, revision: 0, baseRevision: 1}, forn);
  assert.equal(ok.status, 200, JSON.stringify(ok.data));
  const salvo = ok.data.offers[0].data.groups[0];
  assert.equal(salvo.performanceTimeMeasured, 9.6);
  assert.equal(salvo.dispatch.type, 'grupo');
  assert.equal(salvo.passengerBasis, 'movimento');
  // o estudo-base não muda com a proposta
  assert.equal((await f.call(path)).data.revision, 1);

  const ruim = structuredClone(ok.data.offers[0].data);
  ruim.groups[0].preOpeningSpeed = 1.0;
  const r = await f.call(path + '/offers', 'PUT', {data: ruim, revision: ok.data.offers[0].revision, baseRevision: 1}, forn);
  assert.equal(r.status, 400);
  assert.match(JSON.stringify(r.data), /0,8 m\/s/);
});

test('campos de simulação: limites, opções e bloqueio dos dados do fabricante', () => {
  assert.deepEqual(simulationDataErrors({}), []);
  assert.match(simulationDataErrors({preOpeningSpeed: 0.81})[0], /NBR 16858/);
  assert.equal(simulationDataErrors({preOpeningSpeed: 0.8}).length, 0);
  assert.match(simulationDataErrors({levelingTime: -1})[0], /nivelamento/);
  assert.equal(simulationDataErrors({passengerBasis: 'outro'}).length, 1);
  assert.equal(simulationDataErrors({dispatch: {type: 'xyz'}}).length, 1);
  assert.equal(simulationDataErrors({dispatch: {parking: 'x'.repeat(501)}}).length, 1);
  for (const k of ['performanceTimeMeasured', 'dwellCar', 'passengerBasis', 'dispatch']) assert.ok(MANUFACTURER_FIELDS.includes(k), k);
});

// Dados do proprietário: o cliente convidado envia; fica pendente; só o responsável pelo estudo aplica ou recusa.
import {emptyOwnerData, applyOwnerData, validateOwnerData, OWNER_MIN_FLOORS} from '../www/owner-data.js';
import {validateOperation} from '../www/performance.js';

function contagem() {
  const d = emptyOwnerData();
  d.schedule = {start: '07:00', end: '19:00', lunchStart: '11:30', lunchEnd: '14:00'};
  Object.assign(d.measurement, {date: '2026-11-24', observer: 'Portaria', hall: 'Torre A', entryStart: '07:45', lunchStart: '11:45', exitStart: '17:30'});
  d.measurement.rows = Array.from({length: 12}, (_, i) => ({entry: 10 + i, lunchOut: 5, lunchIn: 4, exit: 8, queue: i % 3, interfloor: 1}));
  d.floors[1] = {...d.floors[1], name: '1º', use: 'escritório', people: 60, area: 420, height: 3.2};
  return d;
}

test('formulário do proprietário: 40 andares no mínimo e validação', () => {
  const d = emptyOwnerData();
  assert.equal(d.floors.length, OWNER_MIN_FLOORS);
  assert.deepEqual(validateOwnerData(d), []);
  assert.equal(validateOwnerData({...d, schedule: {start: '25:00'}}).length, 1);
  const r = structuredClone(d); r.measurement.rows[0].entry = 2.5;
  assert.match(validateOwnerData(r)[0], /inteiros/);
});

test('aplicar dados do proprietário: horários e contagens de 5 min entram no estudo como perfil medido', () => {
  const study = defaultStudy(), r = applyOwnerData(study, contagem());
  const op = r.study.operation;
  assert.equal(op.profile, 'measured');
  assert.equal(op.measurementBlocks, 12);
  assert.deepEqual(op.measurements[0], {entry: 10, lunchIn: 4, lunchOut: 5, exit: 8});
  assert.equal(op.entryStart, '07:45');
  assert.equal(op.schedule.start, '07:00');
  assert.deepEqual(validateOperation(op), []);
  assert.match(r.warnings.join(' '), /população/);
  assert.notEqual(study.operation.profile, 'measured', 'o estudo original não é alterado');
  assert.throws(() => applyOwnerData(study, emptyOwnerData()), /Nada a aplicar/);
});

test('dados do proprietário pela API: cliente envia, outros não veem, só o responsável revisa', async () => {
  const f = await fixture();
  const path = 'projects/' + f.project.id;
  await f.call(path + '/access', 'POST', {email: 'cli@empresa.test', company: 'Condomínio', name: 'Bia', kind: 'client'});
  await f.call(path + '/access', 'POST', {email: 'forn@empresa.test', company: 'Fornecedor', name: 'Ana', kind: 'supplier'});
  const cli = {id: 'cli@empresa.test', email: 'cli@empresa.test'}, forn = {id: 'forn@empresa.test', email: 'forn@empresa.test'};
  await f.call('session', 'GET', undefined, cli);
  await f.call('session', 'GET', undefined, forn);
  // fornecedor não envia nem vê
  assert.equal((await f.call(path + '/owner-data', 'GET', undefined, forn)).status, 403);
  assert.equal((await f.call(path + '/owner-data', 'PUT', {data: contagem()}, forn)).status, 403);
  // cliente envia: fica pendente
  const env = await f.call(path + '/owner-data', 'PUT', {data: contagem()}, cli);
  assert.equal(env.status, 200, JSON.stringify(env.data));
  assert.equal(env.data.submissions[0].status, 'pendente');
  assert.equal((await f.call(path + '/owner-data', 'PUT', {data: {...contagem(), version: 9}}, cli)).status, 400);
  // o cliente não aprova o próprio envio
  const id = env.data.submissions[0].id;
  assert.equal((await f.call(path + '/owner-data/' + id + '/review', 'POST', {decision: 'aplicado'}, cli)).status, 403);
  // o responsável vê e aplica
  const lista = await f.call(path + '/owner-data');
  assert.equal(lista.data.submissions.length, 1);
  assert.equal(lista.data.submissions[0].data.measurement.rows.length, 12);
  const rev = await f.call(path + '/owner-data/' + id + '/review', 'POST', {decision: 'aplicado'});
  assert.equal(rev.status, 200);
  assert.equal(rev.data.submission.status, 'aplicado');
  // novo envio do cliente volta para pendente
  assert.equal((await f.call(path + '/owner-data', 'PUT', {data: contagem()}, cli)).data.submissions[0].status, 'pendente');
});
