// SilSec · servidor Node.js (arquivo de entrada para a Hostinger: server.mjs)
import {createServer} from 'node:http';
import {loadDotEnv, readConfig} from './server/platform/config.mjs';
import {createApp} from './server/platform/app.mjs';

loadDotEnv();
const config = readConfig();

if (config.db.driver === 'mysql' && (!config.db.user || !config.db.database)) {
  console.error('Configuração incompleta: defina DB_HOST, DB_NAME, DB_USER e DB_PASSWORD nas variáveis de ambiente.');
  process.exit(1);
}
if (config.production && !config.appUrl) {
  console.error('Configuração incompleta: defina APP_URL (ex.: https://seudominio.com.br). Ele é usado nos links enviados por e-mail.');
  process.exit(1);
}
if (!config.ownerEmail) console.warn('Aviso: SITE_OWNER_EMAIL não definido. Ninguém terá acesso de administrador.');
if (!config.smtp) console.warn('Aviso: SMTP não configurado. Links de confirmação e recuperação de senha aparecerão somente neste log.');

const app = await createApp(config);
// Express é usado só como "casca" (permite que a Hostinger reconheça o projeto como app Node.js/Express);
// se não estiver instalado, o servidor HTTP nativo do Node é usado com o mesmo comportamento.
let listener = (req, res) => { app.handler(req, res); };
try {
  const express = (await import('express')).default;
  const web = express();
  web.disable('x-powered-by');
  web.set('trust proxy', true);
  web.use((req, res) => { app.handler(req, res); });
  listener = web;
} catch { /* sem Express: segue com o servidor nativo */ }
const server = createServer(listener);
server.requestTimeout = 120000;
server.headersTimeout = 65000;
server.keepAliveTimeout = 61000;
server.listen(config.port, config.host, () => {
  console.log(`SilSec em execução na porta ${config.port} · banco ${config.db.driver} · arquivos em ${config.storage.driver}`);
});

const shutdown = () => { server.close(() => app.close().finally(() => process.exit(0))); setTimeout(() => process.exit(0), 8000).unref(); };
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
process.on('unhandledRejection', e => console.error('[promessa rejeitada]', e));
