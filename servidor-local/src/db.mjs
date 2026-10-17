import {DatabaseSync} from 'node:sqlite';
import {readFileSync,readdirSync,mkdirSync} from 'node:fs';
import {join} from 'node:path';

// Tabelas próprias do servidor local (contas e sessões). As tabelas do sistema
// vêm das migrações originais em sistema-original/drizzle.
const LOCAL_MIGRATIONS=[
 ['local_0001_contas',`
  CREATE TABLE local_accounts (
   id TEXT PRIMARY KEY,
   email TEXT NOT NULL UNIQUE,
   name TEXT NOT NULL,
   password_hash TEXT NOT NULL,
   totp_secret TEXT,
   totp_enabled INTEGER NOT NULL DEFAULT 0,
   failed_count INTEGER NOT NULL DEFAULT 0,
   locked_until TEXT,
   disabled INTEGER NOT NULL DEFAULT 0,
   created_at TEXT NOT NULL,
   updated_at TEXT NOT NULL
  );
  CREATE TABLE local_sessions (
   token_hash TEXT PRIMARY KEY,
   account_id TEXT NOT NULL REFERENCES local_accounts(id) ON DELETE CASCADE,
   created_at TEXT NOT NULL,
   expires_at TEXT NOT NULL,
   last_seen TEXT NOT NULL,
   user_agent TEXT,
   ip TEXT
  );
  CREATE INDEX local_sessions_account ON local_sessions(account_id);
  CREATE TABLE local_security_log (
   id INTEGER PRIMARY KEY AUTOINCREMENT,
   at TEXT NOT NULL,
   event TEXT NOT NULL,
   email TEXT,
   ip TEXT,
   detail TEXT
  );`]
];

export function openDatabase(file,migrationsDir){
 if(file!==':memory:')mkdirSync(join(file,'..'),{recursive:true});
 const db=new DatabaseSync(file);
 db.exec('PRAGMA journal_mode = WAL; PRAGMA synchronous = NORMAL; PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000;');
 db.exec('CREATE TABLE IF NOT EXISTS _silsec_migrations (name TEXT PRIMARY KEY, applied_at TEXT NOT NULL)');
 const applied=new Set(db.prepare('SELECT name FROM _silsec_migrations').all().map(r=>r.name));
 const pending=[
  ...readdirSync(migrationsDir).filter(x=>x.endsWith('.sql')).sort().map(name=>[name,readFileSync(join(migrationsDir,name),'utf8')]),
  ...LOCAL_MIGRATIONS
 ].filter(([name])=>!applied.has(name));
 for(const [name,sql] of pending){
  db.exec('BEGIN');
  try{db.exec(sql);db.prepare('INSERT INTO _silsec_migrations (name,applied_at) VALUES (?,?)').run(name,new Date().toISOString());db.exec('COMMIT');}
  catch(error){db.exec('ROLLBACK');throw new Error(`Falha na migração ${name}: ${error.message}`);}
 }
 return db;
}

// Adaptador com a mesma interface usada pela API original (Cloudflare D1):
// prepare(sql).bind(...args).first() / .all() / .run()
export class SqliteD1 {
 constructor(db){this.db=db;}
 prepare(sql){
  const db=this.db;
  const bound=args=>({
   async first(){return db.prepare(sql).get(...args)??null;},
   async all(){return {results:db.prepare(sql).all(...args)};},
   async run(){const r=db.prepare(sql).run(...args);return {meta:{changes:Number(r.changes),last_row_id:Number(r.lastInsertRowid)}};}
  });
  return {bind:(...args)=>bound(args),...bound([])};
 }
}
