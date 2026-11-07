// SilSec Engenharia · versão para computador.
// Inicia o servidor local (somente nesta máquina, porta livre a partir de 3737), guarda os dados na pasta do usuário
// e abre o programa numa janela do navegador. Para fechar o SilSec, feche a janela do console.
import {createServer} from 'node:net';
import {spawn} from 'node:child_process';
import {mkdirSync, writeFileSync, readFileSync, existsSync, unlinkSync} from 'node:fs';
import {homedir, platform} from 'node:os';
import {join} from 'node:path';

const [major, minor] = process.versions.node.split('.').map(Number);
if (major < 22 || (major === 22 && minor < 13)) {
  console.error(`O SilSec precisa do Node.js 22.13 ou mais novo (encontrado ${process.versions.node}). Rode o instalador de novo.`);
  process.exit(1);
}

const dataDir = process.env.SILSEC_DATA || join(process.env.APPDATA || join(homedir(), '.config'), 'SilSec');
mkdirSync(dataDir, {recursive: true});
const portFile = join(dataDir, 'porta.txt');

const isRunning = async port => { try { const r = await fetch(`http://127.0.0.1:${port}/saude`, {signal: AbortSignal.timeout(1500)}); return r.ok && (await r.json()).ok; } catch { return false; } };
const free = port => new Promise(ok => { const s = createServer().once('error', () => ok(false)).once('listening', () => s.close(() => ok(true))).listen(port, '127.0.0.1'); });

function openWindow(url) {
  if (process.env.SILSEC_NO_BROWSER === '1') return;
  if (platform() === 'win32') {
    // Janela de aplicativo do Edge (sem barra de endereços); se não houver Edge, abre o navegador padrão.
    const edge = spawn('cmd', ['/c', 'start', '', 'msedge', `--app=${url}`, '--window-size=1400,900'], {detached: true, stdio: 'ignore', windowsHide: true});
    edge.on('exit', code => { if (code) spawn('cmd', ['/c', 'start', '', url], {detached: true, stdio: 'ignore', windowsHide: true}).unref(); });
    edge.unref();
  } else spawn(platform() === 'darwin' ? 'open' : 'xdg-open', [url], {detached: true, stdio: 'ignore'}).unref();
}

// Já aberto? Só mostra a janela de novo.
if (existsSync(portFile)) {
  const old = Number(readFileSync(portFile, 'utf8'));
  if (old && await isRunning(old)) { openWindow(`http://127.0.0.1:${old}/sistema`); console.log('O SilSec já estava aberto.'); process.exit(0); }
}
let port = 3737;
while (!(await free(port)) && port < 3800) port++;

Object.assign(process.env, {
  SILSEC_DESKTOP: '1', NODE_ENV: 'development', HOST: '127.0.0.1', PORT: String(port),
  DB_DRIVER: 'sqlite', SQLITE_FILE: join(dataDir, 'silsec.sqlite'), DATA_DIR: dataDir,
  SITE_OWNER_EMAIL: process.env.SITE_OWNER_EMAIL || 'local@silsec.desktop', APP_URL: `http://127.0.0.1:${port}`,
});
process.removeAllListeners('warning');
process.on('warning', w => { if (w.name !== 'ExperimentalWarning') console.warn(w.message); });

console.log('SilSec Engenharia · versão para computador');
console.log(`Dados em: ${dataDir}`);
await import('./server.mjs');
writeFileSync(portFile, String(port));
const url = `http://127.0.0.1:${port}/sistema`;
for (let i = 0; i < 40 && !(await isRunning(port)); i++) await new Promise(r => setTimeout(r, 250));
console.log(`Programa aberto em ${url}`);
openWindow(url);

// Encerra sozinho quando a janela do programa é fechada (o programa avisa que está aberto a cada 30 s).
// SILSEC_IDLE_EXIT em segundos (0 desliga). Sem nenhum acesso, encerra em 10 minutos.
const idle = process.env.SILSEC_IDLE_EXIT === undefined ? 300 : Number(process.env.SILSEC_IDLE_EXIT);
if (idle > 0) {
  globalThis.silsecLastRequest = Date.now();
  const started = Date.now();
  setInterval(() => {
    const quiet = Date.now() - globalThis.silsecLastRequest;
    if (quiet > idle * 1000 || (Date.now() - started > 600e3 && quiet > 60e3)) { console.log('Janela fechada: encerrando o SilSec.'); try { unlinkSync(portFile); } catch {} process.exit(0); }
  }, 15e3).unref();
}
console.log('Para fechar o SilSec, feche a janela do programa.');
