import {readFile,stat} from 'node:fs/promises';
import {resolve,extname,sep,join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {openDatabase,SqliteD1} from './db.mjs';
import {FileBucket} from './bucket.mjs';
import {Accounts} from './auth.mjs';
import {loginPage,accountPage,injectPwa} from './pages.mjs';

const MIME={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.webmanifest':'application/manifest+json; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.ico':'image/x-icon','.md':'text/markdown; charset=utf-8','.txt':'text/plain; charset=utf-8','.woff2':'font/woff2'};
const API_BODY_LIMIT=3.5*1024*1024,FORM_BODY_LIMIT=16*1024;
// Cabeçalhos que a API original aceita como identidade. Nunca podem vir do navegador.
const IDENTITY_HEADERS=['oai-authenticated-user-id','oai-authenticated-user-email','oai-authenticated-user-full-name','oai-authenticated-user-full-name-encoding'];
const CSP="default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self'; frame-src 'self' blob: data:; worker-src 'self'; manifest-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'";

class HttpError extends Error{constructor(status,message){super(message);this.status=status;}}

export async function createApp(config){
 const sqlite=openDatabase(join(config.dataDir,'silsec.sqlite'),config.migrationsDir);
 const accounts=new Accounts(sqlite,config);
 const env={DB:new SqliteD1(sqlite),BUCKET:new FileBucket(join(config.dataDir,'arquivos')),SITE_OWNER_EMAIL:config.ownerEmail,...(config.openaiApiKey?{OPENAI_API_KEY:config.openaiApiKey}:{})};
 // A API original é importada do código do sistema, sem cópia, para manter um único motor.
 const {handleApi}=await import(pathToFileURL(resolve(config.appRoot,'server/api.mjs')).href);
 const purgeTimer=setInterval(()=>accounts.purge(),3600000);purgeTimer.unref();

 function originOf(req){
  const forwardedProto=config.trustProxy?String(req.headers['x-forwarded-proto']||'').split(',')[0].trim():'';
  const forwardedHost=config.trustProxy?String(req.headers['x-forwarded-host']||'').split(',')[0].trim():'';
  const proto=forwardedProto==='https'?'https':forwardedProto==='http'?'http':req.socket.encrypted?'https':'http';
  const host=forwardedHost||req.headers.host||'';
  if(!/^[a-z0-9.\-[\]:]+$/i.test(host))throw new HttpError(400,'Endereço inválido.');
  const origin=`${proto}://${host.toLowerCase()}`;
  if(config.publicOrigins.length&&!config.publicOrigins.includes(origin))throw new HttpError(421,'Endereço não autorizado para este servidor.');
  return origin;
 }
 const clientIp=req=>config.trustProxy?String(req.headers['x-forwarded-for']||'').split(',')[0].trim()||req.socket.remoteAddress:req.socket.remoteAddress;
 const cookieName=origin=>origin.startsWith('https:')?'__Host-silsec':'silsec_sessao';
 function readCookie(req,name){for(const part of String(req.headers.cookie||'').split(';')){const i=part.indexOf('=');if(i>0&&part.slice(0,i).trim()===name)return decodeURIComponent(part.slice(i+1).trim());}return null;}
 function sessionCookie(origin,token,maxAge){return `${cookieName(origin)}=${token?encodeURIComponent(token):''}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${origin.startsWith('https:')?'; Secure':''}`;}
 async function readBody(req,limit){
  const chunks=[];let size=0;
  for await(const chunk of req){size+=chunk.length;if(size>limit)throw new HttpError(413,'Os dados excedem o limite permitido.');chunks.push(chunk);}
  return Buffer.concat(chunks);
 }
 function sameOrigin(req,origin){const o=req.headers.origin;if(o&&o!==origin)return false;return req.headers['sec-fetch-site']!=='cross-site';}
 function send(res,status,body,headers={}){
  const data=typeof body==='string'||Buffer.isBuffer(body)?body:JSON.stringify(body);
  res.writeHead(status,{'Content-Type':typeof body==='string'||Buffer.isBuffer(body)?'text/plain; charset=utf-8':'application/json; charset=utf-8','Cache-Control':'no-store',...headers});
  res.end(data);
 }
 async function serveFile(req,res,root,pathname,{transform}={}){
  let rel;try{rel=decodeURIComponent(pathname);}catch{return false;}
  if(rel.includes('\0')||rel.split('/').some(seg=>seg.startsWith('.')))return false;
  const file=resolve(root,'.'+rel);
  if(file!==root&&!file.startsWith(root+sep))return false;
  let info;try{info=await stat(file);}catch{return false;}
  if(!info.isFile())return false;
  const type=MIME[extname(file).toLowerCase()];if(!type)return false;
  const etag=`W/"${info.size.toString(16)}-${Math.floor(info.mtimeMs).toString(16)}"`;
  const headers={'Content-Type':type,'Cache-Control':'no-cache','ETag':etag};
  if(!transform&&req.headers['if-none-match']===etag){res.writeHead(304,headers);res.end();return true;}
  let data=await readFile(file);
  if(transform){data=Buffer.from(transform(data.toString('utf8')));delete headers.ETag;headers['Cache-Control']='no-store';}
  res.writeHead(200,headers);res.end(req.method==='HEAD'?undefined:data);return true;
 }
 async function proxyApi(req,res,origin,session){
  const headers=new Headers();
  for(const [k,v] of Object.entries(req.headers)){if(IDENTITY_HEADERS.includes(k)||k.startsWith(':')||['host','connection','content-length','transfer-encoding','cookie'].includes(k))continue;headers.set(k,Array.isArray(v)?v.join(', '):v);}
  if(session){headers.set('oai-authenticated-user-id','local:'+session.accountId);headers.set('oai-authenticated-user-email',session.email);headers.set('oai-authenticated-user-full-name',encodeURIComponent(session.name));headers.set('oai-authenticated-user-full-name-encoding','percent-encoded-utf-8');}
  const body=['GET','HEAD'].includes(req.method)?undefined:await readBody(req,API_BODY_LIMIT);
  const response=await handleApi(new Request(origin+req.url,{method:req.method,headers,body}),env);
  const out={};response.headers.forEach((v,k)=>{out[k]=v;});
  res.writeHead(response.status,out);
  res.end(Buffer.from(await response.arrayBuffer()));
 }

 async function handle(req,res){
  res.setHeader('Content-Security-Policy',CSP);
  res.setHeader('X-Content-Type-Options','nosniff');
  res.setHeader('X-Frame-Options','DENY');
  res.setHeader('Referrer-Policy','same-origin');
  res.setHeader('Permissions-Policy','camera=(), microphone=(), geolocation=(), payment=()');
  res.setHeader('Cross-Origin-Opener-Policy','same-origin');
  const origin=originOf(req);
  if(origin.startsWith('https:'))res.setHeader('Strict-Transport-Security','max-age=31536000');
  const url=new URL(req.url,origin),path=url.pathname,method=req.method;
  const token=readCookie(req,cookieName(origin)),session=accounts.session(token);

  if(path==='/saude')return send(res,200,{ok:true});
  if(path.startsWith('/api/')){
   if(path.startsWith('/api/shared/')||session)return proxyApi(req,res,origin,session);
   // Sem sessão a API responderia 401 de qualquer forma; responde aqui sem tocar no banco.
   return send(res,401,{error:'Entre com sua conta para acessar seus estudos.'});
  }
  if(path.startsWith('/conta/')&&method==='POST'){
   if(!sameOrigin(req,origin))throw new HttpError(403,'Origem da solicitação não autorizada.');
   let input;try{input=JSON.parse((await readBody(req,FORM_BODY_LIMIT)).toString('utf8')||'{}');}catch{throw new HttpError(400,'Dados inválidos.');}
   if(path==='/conta/entrar'){
    const result=await accounts.login(input,{ip:clientIp(req),userAgent:req.headers['user-agent']});
    if(!result.token)return send(res,result.status,{error:result.error,needTotp:!!result.needTotp});
    return send(res,200,{ok:true,name:result.account.name},{'Set-Cookie':sessionCookie(origin,result.token,config.sessionMaxDays*86400)});
   }
   if(path==='/conta/sair'){accounts.logout(token);return send(res,200,{ok:true},{'Set-Cookie':sessionCookie(origin,'',0)});}
   if(!session)throw new HttpError(401,'Entre novamente.');
   const account=accounts.byEmail(session.email),owner=!!config.ownerEmail&&session.email===config.ownerEmail;
   try{
    if(path==='/conta/senha'){
     const check=await accounts.login({email:session.email,password:input.current,totp:input.totp},{ip:clientIp(req),userAgent:'troca-de-senha'});
     if(!check.token)return send(res,check.status,{error:check.error,needTotp:!!check.needTotp});
     accounts.logout(check.token);await accounts.setPassword(session.email,input.password);
     return send(res,200,{ok:true},{'Set-Cookie':sessionCookie(origin,'',0)});
    }
    if(path==='/conta/2fa/iniciar'){if(account.totp_enabled)throw new HttpError(409,'A verificação em duas etapas já está ativa.');return send(res,200,accounts.startTotp(session.email));}
    if(path==='/conta/2fa/confirmar'){accounts.confirmTotp(session.email,input.code);return send(res,200,{ok:true});}
    if(path==='/conta/2fa/desativar'){accounts.disableTotp(session.email,input.code);return send(res,200,{ok:true});}
    if(path.startsWith('/conta/admin/')){
     if(!owner)throw new HttpError(403,'Somente o administrador do servidor gerencia contas.');
     if(path==='/conta/admin/criar')return send(res,200,{password:await accounts.createWithTemporaryPassword(input)});
     if(path==='/conta/admin/redefinir')return send(res,200,{password:await accounts.resetTemporaryPassword(input.email)});
     if(path==='/conta/admin/bloquear'){if(String(input.email).toLowerCase()===session.email)throw new HttpError(400,'O administrador não pode bloquear a própria conta.');accounts.setDisabled(input.email,!!input.disabled);return send(res,200,{ok:true});}
    }
   }catch(error){if(error instanceof HttpError)throw error;throw new HttpError(400,error.message);}
   throw new HttpError(404,'Operação não encontrada.');
  }
  if(path==='/conta/eu'&&method==='GET'){
   if(!session)return send(res,401,{error:'Sem sessão.'});
   const account=accounts.byEmail(session.email),owner=!!config.ownerEmail&&session.email===config.ownerEmail;
   return send(res,200,{email:session.email,name:session.name,totpEnabled:!!account.totp_enabled,owner,accounts:owner?accounts.list():undefined});
  }
  if(path==='/conta'&&method==='GET'){
   if(!session){res.writeHead(302,{Location:'/entrar?return_to=%2Fconta'});return res.end();}
   res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'});return res.end(accountPage());
  }
  if(!['GET','HEAD'].includes(method))throw new HttpError(405,'Método não permitido.');
  // Rotas que o aplicativo original usa para entrar e sair.
  if(path==='/signin-with-chatgpt'||path==='/entrar'&&session&&url.searchParams.has('return_to')){
   const back=url.searchParams.get('return_to')||'/';
   const safe=back.startsWith('/')&&!back.startsWith('//')?back:'/';
   if(session){res.writeHead(302,{Location:safe});return res.end();}
   res.writeHead(302,{Location:'/entrar?return_to='+encodeURIComponent(safe)});return res.end();
  }
  if(path==='/signout-with-chatgpt'){accounts.logout(token);res.writeHead(302,{Location:'/entrar?saiu=1','Set-Cookie':sessionCookie(origin,'',0)});return res.end();}
  if(path==='/entrar'){res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'});return res.end(loginPage());}
  if(path==='/'||path==='/index.html'){
   // Links de consulta (?share=) e convites funcionam sem conta; o restante exige entrar.
   if(!session&&!url.searchParams.has('share')){res.writeHead(302,{Location:'/entrar'+(url.search?'?return_to='+encodeURIComponent(url.pathname+url.search):'')});return res.end();}
   if(await serveFile(req,res,config.publicDir,'/index.html',{transform:injectPwa}))return;
  }
  if(await serveFile(req,res,config.pwaDir,path))return;
  if(await serveFile(req,res,config.publicDir,path))return;
  return send(res,404,'Não encontrado.');
 }

 async function listener(req,res){
  try{await handle(req,res);}
  catch(error){
   const status=error.status||500;
   if(status>=500)console.error(new Date().toISOString(),req.method,req.url,error);
   if(!res.headersSent)send(res,status,{error:status>=500?'Erro interno do servidor.':error.message});else res.end();
  }
 }
 return {listener,accounts,sqlite,env,close(){clearInterval(purgeTimer);sqlite.close();}};
}
