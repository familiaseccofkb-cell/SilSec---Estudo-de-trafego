// Grava em public/ os arquivos estáticos já com a marca ativa (SILSEC_MARCA).
// Motivo (22/11/2026): na Hostinger, os arquivos de public/ são entregues direto pela CDN, sem passar pelo Node; então os
// ajustes de marca feitos ao entregar (server/platform/marca.mjs) não acontecem. Este script aplica as MESMAS regras no
// pacote, antes do envio: CDN e Node passam a entregar o mesmo conteúdo.
// Uso, só numa cópia do pacote (altera public/ no lugar): SILSEC_MARCA=tes node scripts/materializar-marca.mjs --gravar
import {readdir, readFile, writeFile, rm} from 'node:fs/promises';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {BRAND} from '../public/brand.js';
import {ajustarArquivoMarca, arquivoDaMarca, arquivoFisicoDaMarca} from '../server/platform/marca.mjs';

if (!process.argv.includes('--gravar')) {
  console.error('Altera public/ no lugar. Use só na cópia do pacote: SILSEC_MARCA=tes node scripts/materializar-marca.mjs --gravar');
  process.exit(2);
}
if (BRAND.id === 'silsec') { console.log('Marca SilSec: nada a gravar (os arquivos do disco já são os da SilSec).'); process.exit(0); }

const PUBLIC = fileURLToPath(new URL('../public/', import.meta.url));
async function listar(dir, base = '') {
  const out = [];
  for (const e of await readdir(join(dir, base), {withFileTypes: true})) {
    const rel = base ? base + '/' + e.name : e.name;
    if (e.isDirectory()) out.push(...await listar(dir, rel)); else out.push(rel);
  }
  return out;
}

const relatorio = {trocados: [], ajustados: [], removidos: []};
for (const rel of await listar(PUBLIC)) {
  if (!arquivoDaMarca(rel)) { await rm(join(PUBLIC, rel)); relatorio.removidos.push(rel); continue; }
  const fisico = arquivoFisicoDaMarca(rel);
  const original = await readFile(join(PUBLIC, rel));
  const origem = fisico === rel ? original : await readFile(join(PUBLIC, fisico));
  const final = ajustarArquivoMarca(rel, origem);
  if (!final.equals(original)) { await writeFile(join(PUBLIC, rel), final); (fisico === rel ? relatorio.ajustados : relatorio.trocados).push(rel); }
}
console.log(JSON.stringify(relatorio, null, 1));
