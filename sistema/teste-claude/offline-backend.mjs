// Servidor SilSec rodando dentro do navegador, para a janela de teste no Claude.
// Usa o mesmo código da API (server/api.mjs), as mesmas migrações (db/sqlite) e o mesmo módulo de vistorias
// (server/platform/inspections.mjs), sobre um SQLite em JavaScript (sql.js). Nada sai deste navegador.
import {handleApi} from './server/api.mjs';
import {createInspections} from './server/platform/inspections.mjs';

const MIGRATIONS = ['0000_small_red_wolf.sql', '0001_goofy_rawhide_kid.sql', '0002_gigantic_miss_america.sql', '0003_cuddly_lady_mastermind.sql', '0004_plataforma.sql', '0005_acesso_clientes.sql', '0006_vistorias.sql', '0007_sistema.sql', '0008_controle_acessos.sql', '0009_indices_acessos.sql', '0010_alteracoes_nome_cliente.sql'];
const STORE_KEY = 'silsec-teste-banco-v1';
const USER_KEY = 'silsec-teste-usuario-v1';
const BASE = new URL('.', document.baseURI);

export const USERS = [
  {key: 'dono', id: 'fabio-secco-admin', email: 'fabiosecco@hotmail.com', name: 'Fabio Secco', label: 'Administrador · Fabio Secco (dono do site)'},
  {key: 'gestorA', id: 'gestor@empresa-a.teste', email: 'gestor@empresa-a.teste', name: 'Gestor da Empresa A', label: 'Gestor · Empresa A (contratante)'},
  {key: 'funcA', id: 'funcionario@empresa-a.teste', email: 'funcionario@empresa-a.teste', name: 'Funcionário da Empresa A', label: 'Funcionário · Empresa A'},
  {key: 'gestorB', id: 'gestor@empresa-b.teste', email: 'gestor@empresa-b.teste', name: 'Gestor da Empresa B', label: 'Gestor · Empresa B (outra empresa)'},
  {key: 'analista', id: 'analista@silsec.teste', email: 'analista@silsec.teste', name: 'Analista SilSec', label: 'Analista interno · equipe Norte'},
];
const OWNER = USERS[0];

export function currentUser() {
  let key = null;
  try { key = localStorage.getItem(USER_KEY); } catch {}
  return USERS.find(u => u.key === key) || OWNER;
}
export function setUser(key) {
  try { localStorage.setItem(USER_KEY, key); } catch {}
}

// ---------- SQLite (sql.js) com a interface D1 usada pela API ----------
function splitStatements(text) {
  return text.split(/-->\s*statement-breakpoint|;\s*(?:\r?\n|$)/).map(s => s.replace(/^\s*--.*$/gm, '').trim()).filter(Boolean);
}
const bindable = v => v === undefined ? null : typeof v === 'boolean' ? (v ? 1 : 0) : v;

class SqlJsD1 {
  constructor(db) { this.db = db; this.dirty = false; }
  prepare(sql) {
    const db = this.db, self = this;
    return {bind(...args) {
      const params = args.map(bindable);
      const rows = () => { const st = db.prepare(sql); try { st.bind(params); const out = []; while (st.step()) out.push(st.getAsObject()); return out; } finally { st.free(); } };
      return {
        async first(column) { const r = rows()[0] || null; return column && r ? r[column] : r; },
        async all() { return {results: rows()}; },
        async run() { db.run(sql, params); self.dirty = true; const last = db.exec('SELECT last_insert_rowid() AS id'); return {meta: {changes: db.getRowsModified(), last_row_id: Number(last[0]?.values?.[0]?.[0] || 0)}}; },
      };
    }};
  }
  async exec(sql) { for (const st of splitStatements(sql)) this.db.exec(st); this.dirty = true; }
}

// ---------- Armazenamento de arquivos (fotos de vistoria) no IndexedDB, para sobreviver ao recarregamento ----------
const FOTOS_DB = 'silsec-teste-fotos-v1';
class IdbBucket {
  constructor() { this.ready = new Promise((ok, fail) => { const r = indexedDB.open(FOTOS_DB, 1); r.onupgradeneeded = () => r.result.createObjectStore('f'); r.onsuccess = () => ok(r.result); r.onerror = () => fail(r.error); }); }
  async store(mode) { const db = await this.ready; return db.transaction('f', mode).objectStore('f'); }
  req(r) { return new Promise((ok, fail) => { r.onsuccess = () => ok(r.result); r.onerror = () => fail(r.error); }); }
  async put(key, data, options = {}) { const u8 = data instanceof Uint8Array ? data : new Uint8Array(await new Response(data).arrayBuffer()); await this.req((await this.store('readwrite')).put({data: u8, httpMetadata: options.httpMetadata || {}}, key)); }
  async get(key) { const it = await this.req((await this.store('readonly')).get(key)); if (!it) return null; const u8 = it.data; return {httpMetadata: it.httpMetadata, async arrayBuffer() { return u8.buffer.slice(u8.byteOffset, u8.byteOffset + u8.byteLength); }, body: new Blob([u8])}; }
  async delete(key) { await this.req((await this.store('readwrite')).delete(key)); }
  async list() { const keys = await this.req((await this.store('readonly')).getAllKeys()); return {objects: keys.map(key => ({key}))}; }
  static wipe() { return new Promise(ok => { const r = indexedDB.deleteDatabase(FOTOS_DB); r.onsuccess = r.onerror = r.onblocked = () => ok(); }); }
}

function toBase64(u8) { let s = ''; for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000)); return btoa(s); }
function fromBase64(b64) { const bin = atob(b64); const u8 = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i); return u8; }

let ready = null;
export function backend() { return ready || (ready = start()); }

async function loadSqlJs() {
  if (globalThis.initSqlJs) return globalThis.initSqlJs();
  await new Promise((ok, fail) => { const s = document.createElement('script'); s.src = new URL('vendor/sql-asm.js', BASE).href; s.onload = ok; s.onerror = () => fail(new Error('Não foi possível carregar o motor SQLite de teste (sql.js).')); document.head.appendChild(s); });
  return globalThis.initSqlJs();
}

async function start() {
  const SQL = await loadSqlJs();
  let saved = null;
  try { saved = localStorage.getItem(STORE_KEY); } catch {}
  const db = saved ? new SQL.Database(fromBase64(saved)) : new SQL.Database();
  const D1 = new SqlJsD1(db);
  const BUCKET = new IdbBucket();
  const OWNER_EMAILS = ['contato@silsec-engenharia.com.br', 'fabio.secco@silsec-engenharia.com.br', 'fabiosecco@hotmail.com', 'fabiossecco@gmail.com'];
  const env = {DB: D1, BUCKET, SITE_OWNER_EMAIL: OWNER.email, SITE_OWNER_EMAILS: OWNER_EMAILS.join(','), APP_URL: BASE.href.replace(/\/$/, '')};
  // Migrações: aplica as que faltam (também em bancos já guardados de versões anteriores); o que já existe é ignorado.
  db.exec('CREATE TABLE IF NOT EXISTS schema_migrations (name TEXT PRIMARY KEY, applied_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP))');
  const applied = new Set(db.exec('SELECT name FROM schema_migrations')[0]?.values.map(v => v[0]) || []);
  if (saved && applied.size === 0) for (const file of MIGRATIONS.slice(0, 10)) { applied.add(file); db.run('INSERT OR IGNORE INTO schema_migrations (name) VALUES (?)', [file]); } // bancos de teste anteriores à 9.5.1 já tinham 0000–0009
  for (const file of MIGRATIONS) {
    if (applied.has(file)) continue;
    const r = await fetch(new URL('db/sqlite/' + file, BASE)); if (!r.ok) throw new Error('Migração não encontrada: ' + file);
    for (const st of splitStatements(await r.text())) {
      try { db.exec(st); } catch (e) { if (!/already exists|duplicate column name/i.test(e.message)) throw e; }
    }
    db.run('INSERT OR IGNORE INTO schema_migrations (name) VALUES (?)', [file]);
    D1.dirty = true;
  }
  const inspections = createInspections({db: D1, bucket: BUCKET, config: {ownerEmail: OWNER.email, ownerEmails: new Set(OWNER_EMAILS)}, log: console,
    auth: {async sessionUser() { const u = currentUser(); return {id: u.id, email: u.email, name: u.name}; }, sameOrigin() { return true; }, baseUrl() { return BASE.href.replace(/\/$/, ''); }}});

  let timer = null;
  const persist = () => { if (!D1.dirty) return; clearTimeout(timer); timer = setTimeout(() => { try { localStorage.setItem(STORE_KEY, toBase64(db.export())); D1.dirty = false; } catch (e) { console.warn('Banco de teste não coube no armazenamento local:', e.message); } }, 400); };

  async function api(pathAndQuery, init = {}, user = currentUser()) {
    const headers = new Headers(init.headers || {});
    if (user) { headers.set('oai-authenticated-user-id', user.id); headers.set('oai-authenticated-user-email', user.email); }
    const url = new URL(pathAndQuery, 'https://teste.silsec.local');
    const request = new Request(url, {method: init.method || 'GET', headers, body: init.body});
    const response = await handleApi(request, env);
    persist();
    return response;
  }

  if (!saved) await seed(api);

  async function vistorias(path, init = {}) {
    const url = new URL(path, 'https://teste.silsec.local');
    const request = new Request(url, {method: init.method || 'GET', headers: init.headers, body: init.body});
    const response = await inspections.handle(request);
    persist();
    return response;
  }

  async function reset() { try { localStorage.removeItem(STORE_KEY); } catch {} await IdbBucket.wipe(); location.reload(); }

  return {api, vistorias, reset, env, users: USERS, base: BASE};
}

// Cenário inicial: administrador, duas empresas contratantes, um funcionário e um analista interno, todos com o módulo Avançado.
async function seed(api) {
  const json = async (path, method, body, user) => { const r = await api(path, {method, headers: {'content-type': 'application/json'}, body: body === undefined ? undefined : JSON.stringify(body)}, user); try { return await r.json(); } catch { return null; } };
  for (const u of USERS) await json('/api/session', 'GET', undefined, u);
  const org = (email, name, cnpj) => ({kind: 'client', name, tradeName: name, address: 'Rua das Flores, 100', city: 'São Paulo', state: 'SP', postalCode: '01000-000', phone: '11999990000', email, taxRegistration: '', contact: 'Contato', cnpj});
  await json('/api/organization', 'POST', org(USERS[1].email, 'Empresa A Construtora', '11.222.333/0001-81'), OWNER);
  await json('/api/organization', 'POST', org(USERS[3].email, 'Empresa B Incorporadora', '45.723.174/0001-10'), OWNER);
  await json('/api/organization/member', 'PUT', {email: USERS[2].email, name: USERS[2].name, permissions: {studies: true, proposals: true, catalog: false, invite: false}}, USERS[1]);
  await json('/api/team', 'POST', {email: USERS[4].email, name: USERS[4].name, role: 'analyst', team: 'Norte', exportApproved: true}, OWNER);
  const team = (await json('/api/team', 'GET', undefined, OWNER))?.members || [];
  for (const u of USERS.slice(1)) {
    const m = team.find(x => x.email === u.email);
    if (m) await json('/api/licenses/grant', 'POST', {memberId: m.id, module: 'advanced', permanent: true}, OWNER);
  }
}
