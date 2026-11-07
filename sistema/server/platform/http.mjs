// Ponte entre o servidor HTTP do Node e a API baseada em Request/Response (padrão Web).
import {Readable} from 'node:stream';

const INTERNAL_HEADERS = /^(oai-|x-silsec-)/i;

export function clientIp(req, trustProxy) {
  const fwd = trustProxy ? String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() : '';
  return fwd || req.socket?.remoteAddress || '';
}

export function requestOrigin(req, config) {
  if (config.appUrl) {
    // Quando APP_URL é definido, ele vale para o domínio principal; outros domínios (www, temporário) usam o Host recebido.
    const app = new URL(config.appUrl);
    const host = String(req.headers['x-forwarded-host'] || req.headers.host || '').split(',')[0].trim();
    if (!host || host === app.host) return app.origin;
  }
  const host = String(req.headers['x-forwarded-host'] || req.headers.host || 'localhost').split(',')[0].trim();
  const fproto = String(req.headers['x-forwarded-proto'] || '').split(',')[0].trim().toLowerCase();
  const local = /^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/.test(host);
  const proto = fproto === 'http' || fproto === 'https' ? fproto : req.socket?.encrypted ? 'https' : local ? 'http' : 'https';
  return proto + '://' + host;
}

export async function readBody(req, limit) {
  const chunks = []; let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > limit) { const e = new Error('Os dados excedem o limite permitido.'); e.status = 413; throw e; }
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

// Converte a requisição do Node em Request, removendo cabeçalhos internos que um visitante poderia forjar.
export async function toWebRequest(req, origin, {bodyLimit, ip}) {
  const headers = new Headers();
  for (const [k, v] of Object.entries(req.headers)) {
    if (INTERNAL_HEADERS.test(k) || k.startsWith(':')) continue;
    if (Array.isArray(v)) v.forEach(x => headers.append(k, x)); else if (v !== undefined) headers.set(k, v);
  }
  headers.set('x-silsec-client-ip', ip || '');
  const method = req.method || 'GET';
  const init = {method, headers};
  if (!['GET', 'HEAD'].includes(method)) init.body = await readBody(req, bodyLimit);
  return new Request(new URL(req.url || '/', origin), init);
}

export async function sendWebResponse(res, response, extraHeaders = {}, head = false) {
  const headers = {};
  response.headers.forEach((v, k) => { if (k !== 'set-cookie') headers[k] = v; });
  const cookies = typeof response.headers.getSetCookie === 'function' ? response.headers.getSetCookie() : [];
  for (const [k, v] of Object.entries(extraHeaders)) if (!(k.toLowerCase() in headers)) headers[k.toLowerCase()] = v;
  if (cookies.length) headers['set-cookie'] = cookies;
  res.writeHead(response.status, headers);
  if (head || !response.body) return res.end();
  Readable.fromWeb(response.body).pipe(res);
}
