// Banco de teste com a interface D1 usada pela API.
// Padrão: SQLite em memória (node:sqlite) com as migrações de db/sqlite.
// Com TEST_MYSQL_URL=mysql://usuario:senha@host:porta definido, cada instância cria um banco novo no servidor MySQL/MariaDB
// e aplica as migrações de db/mysql pelo mesmo adaptador usado em produção (valida a tradução de SQL).
import {DatabaseSync} from 'node:sqlite';
import {readFileSync, readdirSync} from 'node:fs';
import {after} from 'node:test';
const opened = [];
if (process.env.TEST_MYSQL_URL) after(async () => { for (const p of opened) await (await p).close().catch(() => {}); });

let counter = 0;
class SqliteD1 {
 constructor(){this.db=new DatabaseSync(':memory:');for(const file of readdirSync(new URL('../../db/sqlite/',import.meta.url)).filter(x=>x.endsWith('.sql')).sort())this.db.exec(readFileSync(new URL('../../db/sqlite/'+file,import.meta.url),'utf8'));}
 prepare(sql){const db=this.db;return {bind(...args){return {
  async first(){return db.prepare(sql).get(...args)||null;},
  async all(){return {results:db.prepare(sql).all(...args)};},
  async run(){const r=db.prepare(sql).run(...args);return {meta:{changes:Number(r.changes),last_row_id:Number(r.lastInsertRowid)}};}
 };}};}
}

class MysqlTestD1 {
 constructor(){
  const u=new URL(process.env.TEST_MYSQL_URL),name='silsec_t'+process.pid+'_'+(++counter);
  this.dialect='mysql';
  this.ready=(async()=>{
   const {openMysql,migrate}=await import('../../server/platform/database.mjs');
   const cfg={host:u.hostname,port:+u.port||3306,user:decodeURIComponent(u.username),password:decodeURIComponent(u.password),connectionLimit:2};
   const admin=await openMysql({...cfg,database:undefined});await admin.exec('CREATE DATABASE IF NOT EXISTS `'+name+'`');await admin.close();
   const db=await openMysql({...cfg,database:name});await migrate(db);return db;
  })();
  opened.push(this.ready);
 }
 prepare(sql){const ready=this.ready;return {bind(...args){const st=ready.then(db=>db.prepare(sql).bind(...args));return {
  async first(c){return (await st).first(c);},async all(){return (await st).all();},async run(){return (await st).run();}
 };}};}
 async exec(sql){return (await this.ready).exec(sql);}
}

export const D1 = process.env.TEST_MYSQL_URL ? MysqlTestD1 : SqliteD1;

export class R2 {constructor(){this.objects=new Map();}async put(key,bytes){this.objects.set(key,new Uint8Array(bytes));}async get(key){const bytes=this.objects.get(key);return bytes?{arrayBuffer:async()=>bytes.slice().buffer}:null;}}
