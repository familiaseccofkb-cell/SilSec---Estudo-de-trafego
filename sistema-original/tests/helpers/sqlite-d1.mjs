import {DatabaseSync} from 'node:sqlite';
import {readFileSync,readdirSync} from 'node:fs';
export class D1 {
 constructor(){this.db=new DatabaseSync(':memory:');for(const file of readdirSync(new URL('../../drizzle/',import.meta.url)).filter(x=>x.endsWith('.sql')).sort())this.db.exec(readFileSync(new URL('../../drizzle/'+file,import.meta.url),'utf8'));}
 prepare(sql){const db=this.db;return {bind(...args){return {
  async first(){return db.prepare(sql).get(...args)||null;},
  async all(){return {results:db.prepare(sql).all(...args)};},
  async run(){const r=db.prepare(sql).run(...args);return {meta:{changes:Number(r.changes),last_row_id:Number(r.lastInsertRowid)}};}
 };}};}
}

export class R2 {constructor(){this.objects=new Map();}async put(key,bytes){this.objects.set(key,new Uint8Array(bytes));}async get(key){const bytes=this.objects.get(key);return bytes?{arrayBuffer:async()=>bytes.slice().buffer}:null;}}
