// Armazenamento de arquivos com a interface usada pela API original (estilo R2):
//   put(key, bytes, {httpMetadata:{contentType}}), get(key) -> {arrayBuffer(), text(), size, httpMetadata} | null, delete(key), head(key)
// "db": arquivos dentro do próprio banco (recomendado na Hostinger: entra no backup do banco e sobrevive a novos deploys).
// "fs": arquivos numa pasta do servidor (STORAGE_DIR), fora da pasta do deploy.
import {mkdir, readFile, writeFile, rm, stat} from 'node:fs/promises';
import {join, resolve, sep} from 'node:path';

const toBuffer = async value => {
  if (value == null) return Buffer.alloc(0);
  if (typeof value === 'string') return Buffer.from(value, 'utf8');
  if (Buffer.isBuffer(value)) return value;
  if (value instanceof ArrayBuffer) return Buffer.from(value);
  if (ArrayBuffer.isView(value)) return Buffer.from(value.buffer, value.byteOffset, value.byteLength);
  if (typeof value.arrayBuffer === 'function') return Buffer.from(await value.arrayBuffer());
  throw new TypeError('Formato de arquivo não suportado.');
};
const validKey = key => { if (typeof key !== 'string' || !key || key.length > 255 || key.includes('..') || key.startsWith('/')) throw new Error('Chave de arquivo inválida.'); return key; };
const object = (key, buf, contentType) => ({
  key, size: buf.length, httpMetadata: {contentType},
  async arrayBuffer() { return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength); },
  async text() { return buf.toString('utf8'); },
  async bytes() { return new Uint8Array(buf); },
});

export class DatabaseStorage {
  constructor(db) { this.db = db; }
  async put(key, value, options = {}) {
    validKey(key);
    const buf = await toBuffer(value), type = options.httpMetadata?.contentType || 'application/octet-stream', now = new Date().toISOString();
    const sql = this.db.dialect === 'mysql'
      ? 'INSERT INTO stored_files (file_key,content_type,size,data,created_at) VALUES (?,?,?,?,?) ON DUPLICATE KEY UPDATE content_type=VALUES(content_type),size=VALUES(size),data=VALUES(data),created_at=VALUES(created_at)'
      : 'INSERT INTO stored_files (file_key,content_type,size,data,created_at) VALUES (?,?,?,?,?) ON CONFLICT(file_key) DO UPDATE SET content_type=excluded.content_type,size=excluded.size,data=excluded.data,created_at=excluded.created_at';
    await this.db.prepare(sql).bind(key, type, buf.length, this.db.dialect === 'mysql' ? buf : new Uint8Array(buf), now).run();
    return {key, size: buf.length};
  }
  async get(key) {
    validKey(key);
    const row = await this.db.prepare('SELECT content_type,data FROM stored_files WHERE file_key = ?').bind(key).first();
    return row ? object(key, await toBuffer(row.data), row.content_type) : null;
  }
  async head(key) {
    const row = await this.db.prepare('SELECT content_type,size FROM stored_files WHERE file_key = ?').bind(validKey(key)).first();
    return row ? {key, size: row.size, httpMetadata: {contentType: row.content_type}} : null;
  }
  async delete(key) { await this.db.prepare('DELETE FROM stored_files WHERE file_key = ?').bind(validKey(key)).run(); }
}

export class FileStorage {
  constructor(dir) { this.dir = resolve(dir); }
  path(key) { const p = resolve(join(this.dir, validKey(key))); if (!p.startsWith(this.dir + sep)) throw new Error('Chave de arquivo inválida.'); return p; }
  async put(key, value, options = {}) {
    const p = this.path(key), buf = await toBuffer(value);
    await mkdir(resolve(p, '..'), {recursive: true});
    await writeFile(p, buf);
    await writeFile(p + '.type', options.httpMetadata?.contentType || 'application/octet-stream');
    return {key, size: buf.length};
  }
  async get(key) {
    const p = this.path(key);
    try { const buf = await readFile(p); let type = 'application/octet-stream'; try { type = await readFile(p + '.type', 'utf8'); } catch {} return object(key, buf, type); }
    catch (e) { if (e.code === 'ENOENT') return null; throw e; }
  }
  async head(key) { try { const s = await stat(this.path(key)); return {key, size: s.size}; } catch { return null; } }
  async delete(key) { const p = this.path(key); await rm(p, {force: true}); await rm(p + '.type', {force: true}); }
}

export function createStorage(config, db) {
  return config.storage.driver === 'fs' ? new FileStorage(config.storage.dir) : new DatabaseStorage(db);
}
