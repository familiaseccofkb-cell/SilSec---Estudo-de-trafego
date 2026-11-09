// Camada de banco com a mesma interface usada pela API original (estilo Cloudflare D1):
//   db.prepare(sql).bind(...args).first() | .all() -> {results} | .run() -> {meta:{changes,last_row_id}}
// Implementações: MySQL/MariaDB (produção na Hostinger) e SQLite embutido do Node (desenvolvimento/local).
import {readFileSync, readdirSync, mkdirSync} from 'node:fs';
import {dirname} from 'node:path';
import {toMysql} from './sql-mysql.mjs';

const MIGRATIONS = new URL('../../db/', import.meta.url);
const normalizeArg = v => typeof v === 'boolean' ? (v ? 1 : 0) : v;
const checkArgs = (sql, args) => {
  for (const v of args) if (v === undefined) throw new TypeError('Valor indefinido enviado ao SQL: ' + sql.slice(0, 80));
  return args.map(normalizeArg);
};

// ---------- MySQL / MariaDB ----------
class MysqlD1 {
  constructor(pool) { this.pool = pool; this.dialect = 'mysql'; }
  prepare(sql) {
    const pool = this.pool, translated = toMysql(sql);
    return {bind: (...raw) => {
      const args = checkArgs(sql, raw);
      return {
        async first(column) { const [rows] = await pool.query(translated, args); const row = rows[0] ? {...rows[0]} : null; return column && row ? row[column] : row; },
        async all() { const [rows] = await pool.query(translated, args); return {results: rows.map(r => ({...r})), success: true}; },
        async run() { const [r] = await pool.query(translated, args); return {success: true, meta: {changes: r.affectedRows ?? 0, last_row_id: r.insertId ?? null}}; },
      };
    }};
  }
  async exec(sql) { await this.pool.query(sql); }
  async close() { await this.pool.end(); }
}

export async function openMysql(cfg) {
  let mysql;
  try { mysql = (await import('mysql2/promise')).default; }
  catch { throw new Error('Pacote mysql2 não instalado. Execute npm install.'); }
  const pool = mysql.createPool({
    host: cfg.host, port: cfg.port, user: cfg.user, password: cfg.password, database: cfg.database,
    socketPath: cfg.socketPath || undefined,
    charset: 'utf8mb4', flags: ['FOUND_ROWS'], timezone: 'Z', dateStrings: true,
    supportBigNumbers: true, bigNumberStrings: false, decimalNumbers: true,
    waitForConnections: true, connectionLimit: cfg.connectionLimit || 5, maxIdle: 2, idleTimeout: 60000,
    enableKeepAlive: true, multipleStatements: false,
  });
  return new MysqlD1(pool);
}

// ---------- SQLite (node:sqlite) ----------
class SqliteD1 {
  constructor(db) { this.db = db; this.dialect = 'sqlite'; this.statements = new Map(); }
  stmt(sql) { let s = this.statements.get(sql); if (!s) { s = this.db.prepare(sql); this.statements.set(sql, s); } return s; }
  prepare(sql) {
    const self = this;
    return {bind: (...raw) => {
      const args = checkArgs(sql, raw);
      return {
        async first(column) { const r = self.stmt(sql).get(...args); const row = r ? {...r} : null; return column && row ? row[column] : row; },
        async all() { return {results: self.stmt(sql).all(...args).map(r => ({...r})), success: true}; },
        async run() { const r = self.stmt(sql).run(...args); return {success: true, meta: {changes: Number(r.changes), last_row_id: Number(r.lastInsertRowid)}}; },
      };
    }};
  }
  async exec(sql) { this.db.exec(sql); }
  async close() { this.db.close(); }
}

export async function openSqlite(file) {
  const {DatabaseSync} = await import('node:sqlite');
  if (file !== ':memory:') mkdirSync(dirname(file), {recursive: true});
  const db = new DatabaseSync(file);
  db.exec('PRAGMA journal_mode = WAL; PRAGMA busy_timeout = 5000; PRAGMA foreign_keys = OFF;');
  return new SqliteD1(db);
}

// ---------- Migrações ----------
export function alreadyApplied(error) {
  const code = error?.code || '', msg = String(error?.message || error || '');
  return ['ER_DUP_KEYNAME', 'ER_DUP_FIELDNAME', 'ER_TABLE_EXISTS_ERROR'].includes(code) || [1061, 1060, 1050].includes(error?.errno)
    || /already exists|duplicate column name|Duplicate key name|Duplicate column name/i.test(msg);
}
function splitStatements(text) {
  return text.split(/-->\s*statement-breakpoint|;\s*(?:\r?\n|$)/).map(s => s.replace(/^\s*--.*$/gm, '').trim()).filter(Boolean);
}

export async function migrate(db, log = () => {}) {
  const dir = new URL(db.dialect + '/', MIGRATIONS);
  await db.exec(db.dialect === 'mysql'
    ? 'CREATE TABLE IF NOT EXISTS `schema_migrations` (`name` VARCHAR(191) NOT NULL PRIMARY KEY, `applied_at` VARCHAR(40) NOT NULL) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin'
    : 'CREATE TABLE IF NOT EXISTS `schema_migrations` (`name` text PRIMARY KEY NOT NULL, `applied_at` text NOT NULL)');
  const done = new Set((await db.prepare('SELECT name FROM schema_migrations').bind().all()).results.map(r => r.name));
  const applied = [];
  for (const file of readdirSync(dir).filter(f => f.endsWith('.sql')).sort()) {
    if (done.has(file)) continue;
    for (const statement of splitStatements(readFileSync(new URL(file, dir), 'utf8'))) {
      try { await db.exec(statement); }
      catch (error) {
        // Migração repetível: índice, coluna ou tabela que já existe (por exemplo, aplicada à mão antes) não derruba a partida.
        if (alreadyApplied(error)) { console.warn(`[migração] ${file}: já aplicado, ignorando — ${String(error.message || error).split('\n')[0]}`); continue; }
        throw error;
      }
    }
    await db.prepare('INSERT INTO schema_migrations (name, applied_at) VALUES (?, ?)').bind(file, new Date().toISOString()).run();
    applied.push(file); log('Migração aplicada: ' + file);
  }
  return applied;
}

export async function openDatabase(config) {
  const db = config.db.driver === 'mysql' ? await openMysql(config.db) : await openSqlite(config.db.file);
  return db;
}
