// SilSec · service worker dos aplicativos (computador, Android e iOS).
// Os dados ficam sempre no banco do site: páginas e API vão primeiro à rede; só estilos, scripts e ícones ficam em cache
// para o aplicativo abrir rápido. Sem conexão, mostra um aviso em vez de uma tela de erro.
const VERSAO = 'silsec-v9.5.2';
const OFFLINE = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Sem conexão · SilSec</title><style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#142c38;color:#fff;font:16px system-ui,sans-serif;text-align:center;padding:24px}button{margin-top:16px;padding:12px 22px;border:0;border-radius:8px;background:#2bb3a3;color:#fff;font:inherit;cursor:pointer}</style></head><body><main><h1>Sem conexão com a internet</h1><p>O SilSec guarda seus estudos no servidor para que computador e celular vejam os mesmos dados.<br>Verifique a conexão e tente de novo.</p><button onclick="location.reload()">Tentar de novo</button></main></body></html>`;

self.addEventListener('install', event => { self.skipWaiting(); event.waitUntil(caches.open(VERSAO).then(c => c.addAll(['/styles.css', '/site.css', '/favicon.svg', '/icones/icone-192.png']).catch(() => {}))); });
self.addEventListener('activate', event => { event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSAO).map(k => caches.delete(k)))).then(() => self.clients.claim())); });

self.addEventListener('fetch', event => {
  const req = event.request, url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin) return;
  if (req.mode === 'navigate') {
    event.respondWith(fetch(req).catch(() => new Response(OFFLINE, {status: 503, headers: {'Content-Type': 'text/html; charset=utf-8'}})));
    return;
  }
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/admin') || url.pathname.startsWith('/vistorias') || /\.(html?|md|json)$/.test(url.pathname)) return;
  if (/\.(css|js|svg|png|ico|woff2)$/.test(url.pathname)) {
    event.respondWith(caches.open(VERSAO).then(async cache => {
      const cached = await cache.match(req);
      const network = fetch(req).then(res => { if (res.ok) cache.put(req, res.clone()); return res; }).catch(() => cached);
      return cached || network;
    }));
  }
});
