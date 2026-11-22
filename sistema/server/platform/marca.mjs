// Marca do servidor (SILSEC_MARCA = silsec | tes): ajusta, ao entregar, os arquivos estáticos que não leem public/brand.js.
// Na marca SilSec só brand.js muda (sai apenas com o perfil SilSec); os demais saem iguais ao disco.
import {BRAND, MARCAS} from '../../public/brand.js';

const SILSEC = MARCAS.silsec;
// Manuais gerados de help.js (scripts/generate-help.mjs) com a marca SilSec: na TES saem sem nenhuma referência à SilSec.
const MANUAL = [
  [SILSEC.email, m => m.email],
  [SILSEC.phone, m => m.phone],
  ['/marca/silsec-engenharia.svg', m => m.logo.split('?')[0]],
  ['alt="SilSec Engenharia" width="480" height="200"', m => `alt="${m.name}" width="${m.logoWidth}" height="${m.logoHeight}"`],
  ['SilSec Engenharia', m => m.name],
  ['SilSec', m => m.short],
];
// Arquivos que só existem para uma das marcas (pedido do Fabio, 22/11/2026: nenhuma referência cruzada).
const SO_SILSEC = /^(marca\/silsec[^/]*|silsec-brand\/.*|identidade-silsec\.html|silsec-comercializacao\.html|silsec-especificacao\.html)$/;
const SO_TES = /^marca\/tes\//;
export function arquivoDaMarca(rel, marca = BRAND) {
  return marca.id === 'tes' ? !SO_SILSEC.test(rel) : !SO_TES.test(rel);
}
const TROCAS = {
  'index.html': [
    ['<title>SilSec Engenharia | Estudos de tráfego</title>', m => `<title>${m.name} | Estudos de tráfego</title>`],
    ['<meta name="apple-mobile-web-app-title" content="SilSec">', m => `<meta name="apple-mobile-web-app-title" content="${m.short}">`],
  ],
  'manifest.webmanifest': [
    ['"name": "SilSec Engenharia · Estudo de tráfego de elevadores"', m => `"name": "${m.name} · Estudo de tráfego de elevadores"`],
    ['"short_name": "SilSec"', m => `"short_name": "${m.short}"`],
    // Vistorias são da SilSec Engenharia, não da TES.
    ['NBR 5665 e ISO 8100-32, vistorias e relatórios.', () => 'NBR 5665 e ISO 8100-32, com memória de cálculo e relatórios.'],
  ],
  'sw.js': [['// SilSec · service worker', m => `// ${m.short} · service worker`], ["const VERSAO = 'silsec-v", m => `const VERSAO = '${m.id}-v`], ['<title>Sem conexão · SilSec</title>', m => `<title>Sem conexão · ${m.short}</title>`], ['<p>O SilSec guarda', m => `<p>O ${m.short} guarda`]],
  'explicacao-dos-calculos.html': MANUAL,
  'manual-do-usuario.html': MANUAL,
};

export const marcaAtiva = () => BRAND.id;

// rel = caminho relativo dentro de public/ (ex.: 'brand.js'); body = Buffer do disco.
// O navegador recebe brand.js só com o perfil da marca ativa: a TES não carrega dados da SilSec, nem a SilSec os da TES.
export function brandJsDaMarca(marca = BRAND) {
  return [
    `// ${marca.name} · identidade (gerado pelo servidor a partir de public/brand.js).`,
    `export const BRAND = Object.freeze(${JSON.stringify(marca)});`,
    `export const MARCAS = Object.freeze({${marca.id}: BRAND});`,
    'export const contactLine = () => BRAND.phone + " · " + BRAND.email;',
    "export const creditLine = () => '';",
    '',
  ].join('\n');
}

export function ajustarArquivoMarca(rel, body, marca = BRAND) {
  if (rel === 'brand.js') return Buffer.from(brandJsDaMarca(marca), 'utf8');
  // CSS: na TES saem os comentários que citam a SilSec (só comentários; as regras não mudam).
  if (marca.id === 'tes' && /\.css$/.test(rel)) return Buffer.from(body.toString('utf8').replace(/\/\*(?:(?!\*\/)[\s\S])*?SilSec[\s\S]*?\*\//g, '/* */'), 'utf8');
  const trocas = TROCAS[rel];
  if (!trocas || marca.id === 'silsec') return body;
  let text = body.toString('utf8');
  for (const [de, para] of trocas) text = text.split(de).join(para(marca));
  return Buffer.from(text, 'utf8');
}
