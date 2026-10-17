// Service worker do SilSec.
// - Arquivos do aplicativo: rede primeiro, cópia local quando sem conexão (o cálculo funciona offline).
// - Leituras da API (sessão, projetos): rede primeiro, última resposta guardada quando sem conexão.
// - Gravações sem conexão: resposta 503 explicativa; o estudo continua salvo no aparelho
//   (armazenamento do navegador) e é enviado ao salvar novamente com a conexão de volta.
const VERSION='silsec-v1';
const APP_CACHE=VERSION+'-app',API_CACHE='silsec-api';
const SHELL=['/','/styles.css','/app.js','/favicon.svg','/manifest.webmanifest','/local.css','/pwa-register.js','/validation.json','/icons/icon-192.png'];

self.addEventListener('install',event=>{
 event.waitUntil(caches.open(APP_CACHE).then(cache=>cache.addAll(SHELL)).catch(()=>{}));
 self.skipWaiting();
});
self.addEventListener('activate',event=>{
 event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('silsec-v')&&k!==APP_CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('message',event=>{
 // Enviado ao sair da conta: remove dados pessoais guardados para uso offline.
 if(event.data==='limpar-dados')event.waitUntil(caches.delete(API_CACHE));
});

const offline=message=>new Response(JSON.stringify({error:message,offline:true}),{status:503,headers:{'Content-Type':'application/json; charset=utf-8'}});

self.addEventListener('fetch',event=>{
 const request=event.request,url=new URL(request.url);
 if(url.origin!==self.location.origin)return;
 if(url.pathname.startsWith('/conta')||url.pathname==='/entrar'||url.pathname.startsWith('/signin')||url.pathname.startsWith('/signout'))return;
 if(url.pathname.startsWith('/api/')){
  if(request.method!=='GET'){
   event.respondWith(fetch(request).catch(()=>offline('Sem conexão com o servidor. O estudo continua salvo neste aparelho; salve novamente quando a conexão voltar.')));
   return;
  }
  // Relatórios e links de consulta não são guardados.
  if(url.pathname.startsWith('/api/shared/')||url.pathname.includes('/report'))return;
  event.respondWith(fetch(request).then(response=>{
   if(response.ok){const copy=response.clone();caches.open(API_CACHE).then(c=>c.put(request,copy));}
   return response;
  }).catch(async()=>(await caches.match(request,{cacheName:API_CACHE}))||offline('Sem conexão com o servidor e sem cópia local destes dados.')));
  return;
 }
 if(request.method!=='GET')return;
 event.respondWith(fetch(request).then(response=>{
  if(response.ok&&response.type==='basic'&&!response.redirected){const copy=response.clone();caches.open(APP_CACHE).then(c=>c.put(request,copy));}
  return response;
 }).catch(async()=>(await caches.match(request,{cacheName:APP_CACHE}))||(request.mode==='navigate'?caches.match('/',{cacheName:APP_CACHE}):Response.error())));
});
