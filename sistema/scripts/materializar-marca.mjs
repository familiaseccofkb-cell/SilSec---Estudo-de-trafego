// Grava em www/ os arquivos estáticos já com a marca ativa (SILSEC_MARCA).
// Motivo (22/11/2026): na Hostinger, a pasta public/ do pacote era entregue direto pelo servidor web, sem passar pelo
// Node. Desde a TES 1.0.4 / SilSec 19r os arquivos do navegador ficam em www/ e tudo passa pelo Node; o script continua
// gravando a marca no pacote, para o disco já sair igual ao que o Node entrega.
// Uso, só numa cópia do pacote (altera www/ no lugar): SILSEC_MARCA=tes node scripts/materializar-marca.mjs --gravar
import {readdir, readFile, writeFile, rm} from 'node:fs/promises';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {BRAND} from '../www/brand.js';
import {ajustarArquivoMarca, arquivoDaMarca, arquivoFisicoDaMarca} from '../server/platform/marca.mjs';

if (!process.argv.includes('--gravar')) {
  console.error('Altera www/ no lugar. Use só na cópia do pacote: SILSEC_MARCA=tes node scripts/materializar-marca.mjs --gravar');
  process.exit(2);
}
const PUBLIC = fileURLToPath(new URL('../www/', import.meta.url));
// SilSec (19r): os demais arquivos do disco já são os da SilSec; só brand.js é gravado, com o perfil SilSec apenas
// (o pacote da SilSec não leva os dados da TES).
if (BRAND.id === 'silsec') {
  await writeFile(join(PUBLIC, 'brand.js'), ajustarArquivoMarca('brand.js', await readFile(join(PUBLIC, 'brand.js'))));
  console.log(JSON.stringify({trocados: [], ajustados: ['brand.js'], removidos: []}, null, 1));
  process.exit(0);
}
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
