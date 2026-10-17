import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer,request as httpRequest} from 'node:http';
import {mkdtemp,rm,readdir} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {DatabaseSync} from 'node:sqlite';
import {loadConfig} from '../src/config.mjs';
import {createApp} from '../src/app.mjs';
import {FileBucket} from '../src/bucket.mjs';
import {runBackup} from '../src/backup.mjs';
import {totpCode} from '../src/totp.mjs';
import {defaultStudy} from '../../sistema-original/public/engine.js';
import {normalizeStudy} from '../../sistema-original/public/state.js';

const OWNER='dono@example.test',PASSWORD='senha forte de teste 2026';
async function start(){
 const dataDir=await mkdtemp(join(tmpdir(),'silsec-'));
 const config=loadConfig({SILSEC_DATA_DIR:dataDir,SILSEC_OWNER_EMAIL:OWNER});
 const app=await createApp(config);
 const server=createServer(app.listener);
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const base=`http://127.0.0.1:${server.address().port}`;
 config.publicOrigins=[base];
 let cookie='';
 async function call(path,{method='GET',data,headers={},jar=true}={}){
  const response=await fetch(base+path,{method,redirect:'manual',headers:{...(data!==undefined?{'content-type':'application/json'}:{}),...(jar&&cookie?{cookie}:{}),...headers},body:data===undefined?undefined:JSON.stringify(data)});
  const set=response.headers.get('set-cookie');if(jar&&set)cookie=set.split(';')[0];
  const text=await response.text();let json;try{json=JSON.parse(text);}catch{}
  return {status:response.status,headers:response.headers,text,data:json};
 }
 const login=(email=OWNER,password=PASSWORD,totp)=>call('/conta/entrar',{method:'POST',data:{email,password,totp}});
 return {config,app,base,call,login,setCookie:v=>{cookie=v;},getCookie:()=>cookie,async stop(){await new Promise(r=>server.close(r));app.close();await rm(dataDir,{recursive:true,force:true});}};
}

test('servidor local: saúde, cabeçalhos de segurança e página inicial exige entrar',async()=>{
 const s=await start();
 try{
  const health=await s.call('/saude');
  assert.equal(health.status,200);
  assert.match(health.headers.get('content-security-policy'),/default-src 'self'/);
  assert.equal(health.headers.get('x-frame-options'),'DENY');
  assert.equal(health.headers.get('x-content-type-options'),'nosniff');
  const home=await s.call('/');assert.equal(home.status,302);assert.equal(home.headers.get('location'),'/entrar');
  const login=await s.call('/entrar');assert.equal(login.status,200);assert.match(login.text,/<form id="login"/);assert.doesNotMatch(login.text,/<script>/);
  assert.equal((await s.call('/api/workspace')).status,401);
  // O app original envia para /signin-with-chatgpt; o servidor local redireciona para o próprio login.
  const signin=await s.call('/signin-with-chatgpt?return_to=%2F');assert.equal(signin.headers.get('location'),'/entrar?return_to=%2F');
 }finally{await s.stop();}
});

test('servidor local: cabeçalhos de identidade enviados pelo navegador são ignorados',async()=>{
 const s=await start();
 try{
  const spoof={'oai-authenticated-user-id':'qualquer','oai-authenticated-user-email':OWNER};
  assert.equal((await s.call('/api/session',{headers:spoof})).status,401);
  await s.app.accounts.create({email:'outra@example.test',name:'Outra pessoa',password:PASSWORD});
  assert.equal((await s.login('outra@example.test')).status,200);
  // Com sessão de outra conta, o cabeçalho falso de proprietário não troca a identidade.
  const r=await s.call('/api/session',{headers:spoof});
  assert.equal(r.status,403);assert.match(r.data.error,/ainda não tem acesso/);
 }finally{await s.stop();}
});

test('servidor local: proprietário entra, salva estudo calculado e dados persistem após reiniciar',async()=>{
 const s=await start();
 try{
  await s.app.accounts.create({email:OWNER,name:'Proprietário',password:PASSWORD});
  const logged=await s.login();assert.equal(logged.status,200);
  assert.match(logged.headers.get('set-cookie'),/HttpOnly/);assert.match(logged.headers.get('set-cookie'),/SameSite=Lax/);
  const session=await s.call('/api/session');assert.equal(session.status,200);assert.equal(session.data.user.isOwner,true);assert.equal(session.data.user.role,'admin');
  const saved=await s.call('/api/projects',{method:'PUT',data:{study:normalizeStudy(defaultStudy()),calculate:true},headers:{origin:s.base}});
  assert.equal(saved.status,200,saved.text);assert.equal(saved.data.status,'calculated');
  const home=await s.call('/');assert.equal(home.status,200);assert.match(home.text,/manifest\.webmanifest/);assert.match(home.text,/pwa-register\.js/);assert.match(home.text,/src="\/app\.js"/);
  const file=join(s.config.dataDir,'silsec.sqlite'),db=new DatabaseSync(file,{readOnly:true});
  assert.equal(db.prepare('SELECT count(*) AS n FROM projects').get().n,1);db.close();
  // Nova instância sobre o mesmo diretório: migrações não se repetem e o projeto continua lá.
  const again=await createApp(s.config);assert.equal(again.sqlite.prepare('SELECT count(*) AS n FROM projects').get().n,1);again.close();
 }finally{await s.stop();}
});

test('servidor local: outra origem, Host não autorizado e arquivos fora da pasta pública são recusados',async()=>{
 const s=await start();
 try{
  await s.app.accounts.create({email:OWNER,name:'Proprietário',password:PASSWORD});await s.login();
  const cross=await s.call('/api/projects',{method:'PUT',data:{study:normalizeStudy(defaultStudy()),calculate:true},headers:{origin:'https://atacante.example'}});
  assert.equal(cross.status,403);
  assert.equal((await s.call('/conta/entrar',{method:'POST',data:{email:OWNER,password:PASSWORD},headers:{origin:'https://atacante.example'}})).status,403);
  // fetch não permite trocar o Host; usa http.request para simular DNS rebinding.
  const rebinding=await new Promise((resolve,reject)=>{const u=new URL(s.base);httpRequest({host:u.hostname,port:u.port,path:'/saude',headers:{host:'rebinding.example'}},r=>{r.resume();resolve(r.statusCode);}).on('error',reject).end();});
  assert.equal(rebinding,421);
  for(const path of ['/../package.json','/%2e%2e/%2e%2e/servidor-local/package.json','/..%2f..%2fREADME.md','/.gitignore','/vendor/../../package.json'])assert.equal((await s.call(path)).status,404,path);
  assert.equal((await s.call('/styles.css')).status,200);
  assert.equal((await s.call('/manifest.webmanifest')).headers.get('content-type'),'application/manifest+json; charset=utf-8');
 }finally{await s.stop();}
});

test('servidor local: tentativas erradas bloqueiam a conta temporariamente sem revelar se o e-mail existe',async()=>{
 const s=await start();
 try{
  await s.app.accounts.create({email:OWNER,name:'Proprietário',password:PASSWORD});
  const unknown=await s.login('ninguem@example.test','senha errada qualquer');
  const wrong=await s.login(OWNER,'senha errada qualquer');
  assert.equal(unknown.status,401);assert.equal(wrong.status,401);assert.equal(unknown.data.error,wrong.data.error);
  for(let i=0;i<4;i++)await s.login(OWNER,'senha errada qualquer');
  const locked=await s.login();assert.equal(locked.status,429);
  assert.ok(s.app.sqlite.prepare("SELECT count(*) AS n FROM local_security_log WHERE event='login.falha'").get().n>=6);
 }finally{await s.stop();}
});

test('servidor local: verificação em duas etapas, troca de senha e saída encerram sessões',async()=>{
 const s=await start();
 try{
  await s.app.accounts.create({email:OWNER,name:'Proprietário',password:PASSWORD});await s.login();
  const started=await s.call('/conta/2fa/iniciar',{method:'POST',data:{}});assert.equal(started.status,200);assert.match(started.data.url,/^otpauth:\/\/totp\//);
  assert.equal((await s.call('/conta/2fa/confirmar',{method:'POST',data:{code:'000000'}})).status,400);
  assert.equal((await s.call('/conta/2fa/confirmar',{method:'POST',data:{code:totpCode(started.data.secret)}})).status,200);
  assert.equal((await s.call('/conta/2fa/iniciar',{method:'POST',data:{}})).status,409);
  const old=s.getCookie();s.setCookie('');
  const need=await s.login();assert.equal(need.status,401);assert.equal(need.data.needTotp,true);
  assert.equal((await s.login(OWNER,PASSWORD,totpCode(started.data.secret))).status,200);
  const changed=await s.call('/conta/senha',{method:'POST',data:{current:PASSWORD,password:'outra senha ainda mais forte',totp:totpCode(started.data.secret)}});
  assert.equal(changed.status,200,changed.text);
  s.setCookie(old);assert.equal((await s.call('/conta/eu')).status,401);
  assert.equal((await s.login(OWNER,'outra senha ainda mais forte',totpCode(started.data.secret))).status,200);
  assert.equal((await s.call('/conta/sair',{method:'POST',data:{}})).status,200);
  assert.equal((await s.call('/api/session')).status,401);
 }finally{await s.stop();}
});

test('servidor local: somente o proprietário cria contas pela página de administração',async()=>{
 const s=await start();
 try{
  await s.app.accounts.create({email:OWNER,name:'Proprietário',password:PASSWORD});await s.login();
  const created=await s.call('/conta/admin/criar',{method:'POST',data:{name:'Fornecedor',email:'fornecedor@example.test'}});
  assert.equal(created.status,200);assert.equal(created.data.password.length,16);
  const me=await s.call('/conta/eu');assert.equal(me.data.owner,true);assert.equal(me.data.accounts.length,2);
  assert.equal((await s.call('/conta/admin/bloquear',{method:'POST',data:{email:OWNER,disabled:true}})).status,400);
  s.setCookie('');assert.equal((await s.login('fornecedor@example.test',created.data.password)).status,200);
  assert.equal((await s.call('/conta/admin/criar',{method:'POST',data:{name:'X',email:'x@example.test'}})).status,403);
 }finally{await s.stop();}
});

test('armazenamento de arquivos: chave com ../ não sai da pasta e backup gera banco íntegro',async()=>{
 const s=await start();
 try{
  const bucket=new FileBucket(join(s.config.dataDir,'arquivos'));
  await bucket.put('../../fora.txt',new TextEncoder().encode('conteúdo'),{httpMetadata:{contentType:'text/plain'}});
  assert.equal(existsSync(join(s.config.dataDir,'..','fora.txt')),false);
  assert.equal(await (await bucket.get('../../fora.txt')).text(),'conteúdo');
  assert.equal(await bucket.get('inexistente'),null);
  await s.app.accounts.create({email:OWNER,name:'Proprietário',password:PASSWORD});
  const dir=await runBackup(s.app.sqlite,s.config);
  const copy=new DatabaseSync(join(dir,'silsec.sqlite'),{readOnly:true});
  assert.equal(copy.prepare('PRAGMA integrity_check').get().integrity_check,'ok');
  assert.equal(copy.prepare('SELECT count(*) AS n FROM local_accounts').get().n,1);copy.close();
  assert.ok((await readdir(join(dir,'arquivos'))).length>0);
 }finally{await s.stop();}
});
