import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readConfig} from '../server/platform/config.mjs';
import {createApp} from '../server/platform/app.mjs';
import {openSqlite} from '../server/platform/database.mjs';

test('versão para computador: usuário local entra sem login, só pela própria máquina, e as telas de acesso voltam ao programa', async () => {
  const config = readConfig({SILSEC_DESKTOP: '1', DB_DRIVER: 'sqlite', SQLITE_FILE: ':memory:', SITE_OWNER_EMAIL: 'local@silsec.desktop'});
  const app = await createApp(config, {db: await openSqlite(':memory:'), log: {log() {}, warn() {}, error() {}}});
  const server = createServer(app.handler); await new Promise(r => server.listen(0, '127.0.0.1', r));
  const base = 'http://127.0.0.1:' + server.address().port;
  try {
    const s = await (await fetch(base + '/api/session')).json();
    assert.equal(s.user.email, 'local@silsec.desktop'); assert.equal(s.user.role, 'admin'); assert.equal(s.desktop, true);
    assert.equal((await fetch(base + '/sistema')).status, 200);
    const r = await fetch(base + '/entrar', {redirect: 'manual'}); assert.equal(r.status, 303); assert.equal(r.headers.get('location'), '/sistema');
    const home = await fetch(base + '/', {redirect: 'manual'}); assert.equal(home.headers.get('location'), '/sistema');
  } finally { await new Promise(r => server.close(r)); await app.close(); }
});
