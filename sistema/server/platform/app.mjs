// Aplicação HTTP completa: arquivos estáticos, páginas de acesso e API do SilSec.
import {readFile, stat} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {extname, join, normalize, resolve, sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {handleApi} from '../api.mjs';
import {openDatabase, migrate} from './database.mjs';
import {createStorage} from './storage.mjs';
import {createMailer} from './mailer.mjs';
import {createAuth, APP_HOME} from './auth.mjs';
import {createCommerce} from './commerce.mjs';
import {createInspections} from './inspections.mjs';
import {createDevConsole} from './devconsole.mjs';
import {apiEnv} from './config.mjs';
import {clientIp, requestOrigin, toWebRequest, sendWebResponse} from './http.mjs';
import {infoPage} from './auth-pages.mjs';

const PUBLIC_DIR = resolve(fileURLToPath(new URL('../../public/', import.meta.url)));
const VERSION = JSON.parse(await readFile(new URL('../../package.json', import.meta.url), 'utf8')).version;
const TYPES = {'.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.ico': 'image/x-icon', '.md': 'text/markdown; charset=utf-8', '.txt': 'text/plain; charset=utf-8', '.woff2': 'font/woff2', '.pdf': 'application/pdf', '.webmanifest': 'application/manifest+json; charset=utf-8'};
const SECURITY = {
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'same-origin',
  'X-Frame-Options': 'SAMEORIGIN',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'X-Robots-Tag': 'noindex, nofollow',
};
const HIDDEN = new Set(['revisao-v9.md']); // notas internas que não devem ser publicadas

export async function createApp(config, {log = console, db: givenDb, mailer: givenMailer, fetcher} = {}) {
  const db = givenDb || await openDatabase(config);
  const applied = await migrate(db, m => log.log(m));
  const bucket = createStorage(config, db);
  const mailer = givenMailer || createMailer(config.smtp, log);
  const auth = createAuth({db, config, mailer, log});
  const commerce = createCommerce({db, config, mailer, auth, log, ...(fetcher ? {fetcher} : {})});
  const inspections = createInspections({db, bucket, auth, config, log});
  const devconsole = createDevConsole({db, auth, config, commerce, log});
  const env = apiEnv(config, db, bucket);
  const staticCache = new Map();
  const hsts = config.production ? {'Strict-Transport-Security': 'max-age=15552000'} : {};

  async function serveStatic(pathname, req, res) {
    let rel;
    try { rel = decodeURIComponent(pathname).replace(/^\/+/, ''); } catch { return false; }
    if (!rel || rel.endsWith('/')) return false;
    const file = normalize(join(PUBLIC_DIR, rel));
    if (!file.startsWith(PUBLIC_DIR + sep) || rel.split('/').some(p => p.startsWith('.')) || HIDDEN.has(rel)) return false;
    let info;
    try { info = await stat(file); } catch { return false; }
    if (!info.isFile()) return false;
    let entry = staticCache.get(file);
    if (!entry || entry.mtime !== info.mtimeMs) {
      const body = await readFile(file);
      entry = {body, mtime: info.mtimeMs, etag: '"' + createHash('sha1').update(body).digest('base64url').slice(0, 20) + '"'};
      staticCache.set(file, entry);
    }
    const type = TYPES[extname(file).toLowerCase()] || 'application/octet-stream';
    const longCache = /\.(png|jpe?g|webp|svg|ico|woff2)$/i.test(file) || rel.startsWith('vendor/');
    const headers = {...SECURITY, ...hsts, 'Content-Type': type, ETag: entry.etag, 'Cache-Control': longCache ? 'public, max-age=86400' : 'no-cache'};
    if (req.headers['if-none-match'] === entry.etag) { res.writeHead(304, headers); res.end(); return true; }
    headers['Content-Length'] = entry.body.length;
    res.writeHead(200, headers);
    res.end(req.method === 'HEAD' ? undefined : entry.body);
    return true;
  }

  async function serveShell(res, head) {
    let body = await readFile(join(PUBLIC_DIR, 'index.html'));
    const notice = (await devconsole.settings()).announcement;
    if (notice) body = Buffer.from(body.toString('utf8').replace('<div id="app"></div>', `<div class="system-announcement" role="status" style="background:#fff4d6;color:#4a3800;padding:10px 16px;text-align:center;font:14px system-ui,sans-serif;border-bottom:1px solid #e8d49a">${String(notice).replace(/[&<>"']/g, c => '&#' + c.charCodeAt(0) + ';')}</div><div id="app"></div>`));
    res.writeHead(200, {...SECURITY, ...hsts, 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'private, no-store'});
    res.end(head ? undefined : body);
  }

  async function handler(req, res) {
    const origin = requestOrigin(req, config);
    let url;
    try { url = new URL(req.url || '/', origin); } catch { res.writeHead(400); return res.end(); }
    const path = url.pathname, method = req.method || 'GET', head = method === 'HEAD';
    if (config.desktop) globalThis.silsecLastRequest = Date.now();
    try {
      if (path === '/saude') {
        let ok = true;
        try { await db.prepare('SELECT 1 AS ok').bind().first(); } catch { ok = false; }
        res.writeHead(ok ? 200 : 503, {'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store'});
        return res.end(JSON.stringify({ok, versao: VERSION, banco: db.dialect, email: mailer.configured, ia: !!(config.ai.apiKey && (config.ai.invoiceModel || config.ai.contractModel))}));
      }

      // Vínculo do aplicativo Android publicado na Play Store (Trusted Web Activity) com este domínio.
      if (path === '/.well-known/assetlinks.json') {
        const statements = config.android?.packageName && config.android.fingerprints.length ? [{relation: ['delegate_permission/common.handle_all_urls'], target: {namespace: 'android_app', package_name: config.android.packageName, sha256_cert_fingerprints: config.android.fingerprints}}] : [];
        res.writeHead(200, {'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'public, max-age=3600'});
        return res.end(head ? undefined : JSON.stringify(statements));
      }
      if (path === '/sw.js') res.setHeader('Service-Worker-Allowed', '/');

      // Modo de manutenção (ligado no console do desenvolvedor): vale para site, API e aplicativos.
      const probeHeaders = new Headers();
      for (const [k, v] of Object.entries(req.headers)) if (typeof v === 'string') probeHeaders.set(k, v);
      const blocked = await devconsole.maintenance(new Request(url, {headers: probeHeaders}));
      if (blocked) return sendWebResponse(res, blocked, {...SECURITY, ...hsts}, head);

      const ip = clientIp(req, true);
      if (path.startsWith('/api/') || path === '/api') {
        const request = await toWebRequest(req, origin, {bodyLimit: 8 * 1024 * 1024, ip});
        const user = await auth.sessionUser(request);
        const headers = new Headers(request.headers);
        if (user) {
          headers.set('oai-authenticated-user-id', user.id);
          headers.set('oai-authenticated-user-email', user.email);
          headers.set('oai-authenticated-user-full-name', encodeURIComponent(user.name));
          headers.set('oai-authenticated-user-full-name-encoding', 'percent-encoded-utf-8');
        }
        const hasBody = !['GET', 'HEAD'].includes(method);
        const apiRequest = new Request(request.url, {method, headers, body: hasBody ? await request.arrayBuffer() : undefined});
        let response = await handleApi(apiRequest, env);
        if (config.desktop && url.pathname === '/api/session' && response.ok) { const data = await response.json(); response = Response.json({...data, desktop: true}, {status: response.status, headers: {'Cache-Control': 'no-store'}}); }
        return sendWebResponse(res, response, {...SECURITY, ...hsts}, head);
      }

      const request = await toWebRequest(req, origin, {bodyLimit: path.startsWith('/vistorias/') ? 40 * 1024 * 1024 : 256 * 1024, ip});
      const authResponse = await auth.handle(request);
      if (authResponse) return sendWebResponse(res, authResponse, {...SECURITY, ...hsts}, head);
      const inspectionResponse = await inspections.handle(request);
      if (inspectionResponse) return sendWebResponse(res, inspectionResponse, {...SECURITY, ...hsts}, head);
      const consoleResponse = await devconsole.handle(request);
      if (consoleResponse) return sendWebResponse(res, consoleResponse, {...SECURITY, ...hsts}, head);
      const siteResponse = await commerce.handle(request);
      if (siteResponse) return sendWebResponse(res, siteResponse, {...SECURITY, ...hsts}, head);

      if (!['GET', 'HEAD'].includes(method)) { res.writeHead(405, SECURITY); return res.end(); }

      if (path === '/index.html' || path === APP_HOME + '/') { res.writeHead(301, {...SECURITY, Location: APP_HOME + url.search}); return res.end(); }
      if (path === APP_HOME) {
        if (!url.searchParams.has('share') && !await auth.sessionUser(request)) {
          res.writeHead(303, {...SECURITY, Location: '/entrar?volta=' + encodeURIComponent(APP_HOME + url.search), 'Cache-Control': 'no-store'});
          return res.end();
        }
        return serveShell(res, head);
      }
      // Documentos (manual, especificação, notas comerciais) só para quem entrou; scripts, estilos e imagens
      // permanecem abertos porque a consulta por link compartilhado funciona sem login.
      if (/\.(html?|md)$/i.test(path) && !await auth.sessionUser(request)) {
        res.writeHead(303, {...SECURITY, Location: '/entrar?volta=' + encodeURIComponent(path), 'Cache-Control': 'no-store'});
        return res.end();
      }
      if (await serveStatic(path, req, res)) return;
      const body = infoPage({title: 'Não encontrado', heading: 'Página não encontrada', text: 'O endereço acessado não existe.', link: '/', linkText: 'Abrir o programa', kind: 'erro'});
      res.writeHead(404, {...SECURITY, 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store'});
      res.end(head ? undefined : body);
    } catch (error) {
      const status = error.status && error.status >= 400 && error.status < 600 ? error.status : 500;
      if (status >= 500) log.error('[erro]', method, path, error);
      if (!res.headersSent) {
        res.writeHead(status, {'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store'});
        res.end(JSON.stringify({error: status >= 500 ? 'Erro interno. Tente novamente.' : error.message}));
      } else res.destroy();
    }
  }

  const housekeeping = () => {
    auth.cleanup().catch(e => log.error('[limpeza]', e));
    commerce.sendReminders(config.appUrl).catch(e => log.error('[avisos]', e));
  };
  const cleanupTimer = setInterval(housekeeping, 6 * 3600e3);
  const firstRun = setTimeout(housekeeping, 60e3); firstRun.unref();
  cleanupTimer.unref();
  return {handler, db, auth, commerce, inspections, devconsole, env, migrationsApplied: applied, async close() { clearInterval(cleanupTimer); clearTimeout(firstRun); await db.close(); }};
}
