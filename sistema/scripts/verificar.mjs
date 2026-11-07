// Verificação rápida executada no "build" da Hostinger: confere arquivos essenciais e a sintaxe dos módulos do servidor.
import {existsSync} from 'node:fs';
const required = ['server.mjs', 'public/index.html', 'public/app.js', 'public/styles.css', 'db/mysql/0001_inicial.sql', 'db/sqlite/0000_small_red_wolf.sql'];
const missing = required.filter(f => !existsSync(new URL('../' + f, import.meta.url)));
if (missing.length) { console.error('Arquivos ausentes: ' + missing.join(', ')); process.exit(1); }
await import('../server/platform/app.mjs');
console.log('SilSec: arquivos e módulos verificados.');
