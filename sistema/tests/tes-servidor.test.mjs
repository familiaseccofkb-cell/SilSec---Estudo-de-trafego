// Servidor com o motor em motor/ e com a marca TES: o navegador carrega o cálculo de /motor/, a tela do sistema sai com
// a marca ativa e, na TES, não existe a rota de vistorias (serviço da SilSec Engenharia).
import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const raiz = fileURLToPath(new URL('../', import.meta.url));
const roda = marca => JSON.parse(execFileSync(process.execPath, ['--input-type=module', '-e', `
  import {createServer} from 'node:http';
  import {readConfig} from './server/platform/config.mjs';
  import {createApp} from './server/platform/app.mjs';
  import {openSqlite} from './server/platform/database.mjs';
  const config = readConfig({SITE_OWNER_EMAIL: 'dono@x.test', DB_DRIVER: 'sqlite', SQLITE_FILE: ':memory:'});
  const app = await createApp(config, {db: await openSqlite(':memory:'), mailer: {configured: false, async send() { return {delivered: false}; }}, log: {log() {}, warn() {}, error() {}}});
  const srv = createServer(app.handler); await new Promise(r => srv.listen(0, '127.0.0.1', r));
  const base = 'http://127.0.0.1:' + srv.address().port, out = {};
  for (const p of ['/motor/engine.js', '/motor/fleet.js', '/motor/index.mjs', '/motor/package.json', '/motor/..%2Fserver.mjs', '/engine.js', '/vistorias']) {
    const r = await fetch(base + p, {redirect: 'manual'}); out[p] = {status: r.status, body: r.status === 200 ? (await r.text()).slice(0, 400) : ''};
  }
  const shell = await fetch(base + '/sistema?share=teste'); out.shell = (await shell.text()).match(/<title>[^<]*<\\/title>/)?.[0] || '';
  console.log(JSON.stringify(out)); srv.close(); await app.close(); process.exit(0);
`], {cwd: raiz, env: {...process.env, SILSEC_MARCA: marca}, encoding: 'utf8'}));

test('motor/: o navegador carrega os arquivos .js do cálculo; nada além disso sai da pasta', () => {
  const r = roda('silsec');
  assert.equal(r['/motor/engine.js'].status, 200);
  assert.match(r['/motor/engine.js'].body, /from '\.\/basic\.js'/);
  assert.equal(r['/motor/fleet.js'].status, 200);
  for (const p of ['/motor/index.mjs', '/motor/package.json', '/motor/..%2Fserver.mjs']) assert.notEqual(r[p].status, 200, p);
  assert.match(r['/engine.js'].body, /export \* from '\.\.\/motor\/engine\.js'/);
  assert.equal(r.shell, '<title>SilSec Engenharia | Estudos de tráfego</title>');
  assert.notEqual(r['/vistorias'].status, 404, 'na SilSec as vistorias continuam');
});

test('marca TES: tela do sistema com título TES e sem a rota de vistorias', () => {
  const r = roda('tes');
  assert.equal(r.shell, '<title>Traffic Estimator System | Estudos de tráfego</title>');
  assert.equal(r['/vistorias'].status, 404);
  assert.equal(r['/motor/engine.js'].status, 200);
});
