import {mkdir,readFile,writeFile,rename,rm} from 'node:fs/promises';
import {createHash,randomUUID} from 'node:crypto';
import {join} from 'node:path';

// Armazenamento de arquivos (logomarcas, relatórios, documentos) no disco local,
// com a mesma interface usada pela API original (Cloudflare R2): put/get/delete.
// A chave nunca vira caminho diretamente: o nome do arquivo é o SHA-256 da chave,
// o que impede travessia de diretório (../) e nomes inválidos.
export class FileBucket {
 constructor(root){this.root=root;}
 path(key){
  if(typeof key!=='string'||!key||key.length>1024)throw new Error('Chave de arquivo inválida.');
  const digest=createHash('sha256').update(key).digest('hex');
  return join(this.root,digest.slice(0,2),digest);
 }
 async put(key,bytes,options={}){
  const file=this.path(key),tmp=file+'.'+randomUUID()+'.tmp';
  await mkdir(join(file,'..'),{recursive:true});
  const data=bytes instanceof Uint8Array?bytes:new Uint8Array(bytes instanceof ArrayBuffer?bytes:await new Response(bytes).arrayBuffer());
  await writeFile(tmp,data,{mode:0o600});
  await writeFile(tmp+'.meta',JSON.stringify({key,httpMetadata:options.httpMetadata||{},customMetadata:options.customMetadata||{},size:data.byteLength,uploaded:new Date().toISOString()}),{mode:0o600});
  await rename(tmp+'.meta',file+'.meta');
  await rename(tmp,file);
 }
 async get(key){
  const file=this.path(key);
  let bytes,meta={};
  try{bytes=await readFile(file);}catch(error){if(error.code==='ENOENT')return null;throw error;}
  try{meta=JSON.parse(await readFile(file+'.meta','utf8'));}catch{}
  const copy=()=>bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength);
  return {key,size:bytes.byteLength,httpMetadata:meta.httpMetadata||{},customMetadata:meta.customMetadata||{},arrayBuffer:async()=>copy(),text:async()=>bytes.toString('utf8')};
 }
 async delete(key){const file=this.path(key);await rm(file,{force:true});await rm(file+'.meta',{force:true});}
}
