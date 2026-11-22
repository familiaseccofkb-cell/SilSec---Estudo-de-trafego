// Marca configurável (pedido de 21/11/2026): o mesmo código mostra SilSec Engenharia ou Traffic Estimator System (TES).
// A marca é lida de SILSEC_MARCA quando public/brand.js é carregado; por isso a TES é conferida num processo separado.
import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {BRAND, MARCAS} from '../public/brand.js';
import {ajustarArquivoMarca, arquivoDaMarca, arquivoFisicoDaMarca} from '../server/platform/marca.mjs';
import {readFileSync} from 'node:fs';
import {montarAmbiente} from '../rede-local.mjs';

const raiz = fileURLToPath(new URL('../', import.meta.url));
// Única menção à SilSec permitida na TES (aprovação do Fabio para publicação, 22/11/2026).
const PRODUTO = 'Produto da SilSec Engenharia', semProduto = s => s.split(PRODUTO).join('');
const emTes = codigo => execFileSync(process.execPath, ['--input-type=module', '-e', codigo], {cwd: raiz, env: {...process.env, SILSEC_MARCA: 'tes'}, encoding: 'utf8'});

test('marca padrão continua SilSec Engenharia, com o contato e o logo de sempre', () => {
  assert.equal(BRAND.id, 'silsec');
  assert.equal(BRAND.email, 'contato@silsec-engenharia.com.br');
  assert.match(BRAND.logo, /silsec-engenharia\.svg/);
  const idx = Buffer.from('<title>SilSec Engenharia | Estudos de tráfego</title>');
  assert.equal(ajustarArquivoMarca('index.html', idx), idx, 'na SilSec o arquivo sai igual');
});

test('perfil TES: contato, site e logo próprios; da SilSec só a menção de produto', () => {
  const t = MARCAS.tes;
  assert.equal(t.email, 'contato@trafficestimatorsystem.com');
  assert.equal(t.site, 'https://trafficestimatorsystem.com');
  assert.match(t.logo, /^\/marca\/tes\/logo-tes-512\.png/);
  assert.equal(t.credit, PRODUTO);
  assert.doesNotMatch(semProduto(JSON.stringify(t)), /silsec/i);
  assert.doesNotMatch(JSON.stringify(MARCAS.silsec), /traffic estimator|trafficestimator/i);
  assert.doesNotMatch(JSON.stringify(MARCAS.silsec), /\bTES\b/);
});

test('arquivos estáticos na marca TES: brand.js, título, manifesto, manuais e aviso offline sem SilSec', () => {
  const t = MARCAS.tes, aj = (rel, s) => ajustarArquivoMarca(rel, Buffer.from(s), t).toString();
  const bj = aj('brand.js', readFileSync(new URL('../public/brand.js', import.meta.url), 'utf8'));
  assert.match(bj, /"id":"tes"/);
  assert.doesNotMatch(semProduto(bj), /silsec/i, 'brand.js da TES não leva o perfil SilSec');
  assert.doesNotMatch(ajustarArquivoMarca('brand.js', Buffer.from(''), MARCAS.silsec).toString(), /trafficestimator|"TES"/i, 'brand.js da SilSec não leva o perfil TES');
  assert.doesNotMatch(aj('sw.js', readFileSync(new URL('../public/sw.js', import.meta.url), 'utf8')), /silsec/i);
  assert.doesNotMatch(aj('styles.css', readFileSync(new URL('../public/styles.css', import.meta.url), 'utf8')), /SilSec/);
  assert.equal(aj('index.html', '<title>SilSec Engenharia | Estudos de tráfego</title>'), '<title>Traffic Estimator System | Estudos de tráfego</title>');
  assert.match(aj('manifest.webmanifest', '"short_name": "SilSec"'), /"short_name": "TES"/);
  const manifesto = aj('manifest.webmanifest', readFileSync(new URL('../public/manifest.webmanifest', import.meta.url), 'utf8'));
  assert.doesNotMatch(manifesto, /vistoria|silsec/i, 'app instalado da TES sem atalho de vistorias');
  assert.doesNotThrow(() => JSON.parse(manifesto), 'manifesto continua JSON válido');
  assert.match(aj('sw.js', '<title>Sem conexão · SilSec</title>'), /Sem conexão · TES/);
  for (const m of ['manual-do-usuario.html', 'explicacao-dos-calculos.html']) {
    const out = aj(m, readFileSync(new URL('../public/' + m, import.meta.url), 'utf8'));
    assert.doesNotMatch(out.replace(/(id|href)="#?help-silsec\d+"/g, ''), /SilSec|silsec-engenharia/, m);
    assert.match(out, /contato@trafficestimatorsystem\.com/, m);
  }
});

test('arquivos de uma marca não são entregues na outra', () => {
  assert.equal(arquivoDaMarca('marca/silsec-engenharia.svg', MARCAS.tes), false);
  assert.equal(arquivoDaMarca('identidade-silsec.html', MARCAS.tes), false);
  assert.equal(arquivoDaMarca('marca/tes/logo-tes-512.png', MARCAS.silsec), false);
  assert.equal(arquivoDaMarca('engine.js', MARCAS.tes), true);
  assert.equal(arquivoDaMarca('marca/silsec-engenharia.svg', MARCAS.silsec), true);
  // ícones: a TES entrega os seus (símbolo do logo TES); a SilSec, os de sempre
  for (const [rel, tes] of [['favicon.svg', 'marca/tes/favicon.svg'], ['apple-touch-icon.png', 'marca/tes/apple-touch-icon.png'], ['icones/icone-192.png', 'marca/tes/icone-192.png'], ['icones/icone-512.png', 'marca/tes/icone-512.png'], ['icones/icone-maskable-512.png', 'marca/tes/icone-maskable-512.png']]) {
    assert.equal(arquivoFisicoDaMarca(rel, MARCAS.tes), tes);
    assert.equal(arquivoFisicoDaMarca(rel, MARCAS.silsec), rel);
    assert.ok(readFileSync(new URL('../public/' + tes, import.meta.url)).length > 1000, tes);
  }
});

test('site na marca TES: página do sistema com logo TES; da SilSec só "Produto da SilSec Engenharia" no rodapé', () => {
  const out = emTes(`import {modulesPage} from './server/site/pages.mjs';import {BRAND} from './public/brand.js';import {salePlans} from './server/platform/plans.mjs';
    const h = modulesPage({plans: salePlans({}), session: null}); console.log(JSON.stringify({id: BRAND.id, h}));`);
  const {id, h} = JSON.parse(out);
  assert.equal(id, 'tes');
  assert.match(h, /src="\/marca\/tes\/logo-tes-512\.png\?v=2" alt="Traffic Estimator System" width="512" height="512"/);
  assert.match(h, /mailto:contato@trafficestimatorsystem\.com/);
  assert.match(h, /<div class="foot-base">© \d{4} Traffic Estimator System · Produto da SilSec Engenharia<\/div>/);
  assert.equal(h.split(PRODUTO).length, 2, 'a menção aparece uma vez, no rodapé');
  assert.doesNotMatch(semProduto(h), /silsec/i);
  assert.doesNotMatch(h, /href="\/(orcamento|servicos)/);
});

test('site na marca SilSec não cita a TES', async () => {
  const {modulesPage, homePage, servicesPage} = await import('../server/site/pages.mjs');
  const {salePlans} = await import('../server/platform/plans.mjs');
  for (const h of [modulesPage({plans: salePlans({}), session: null}), homePage({plans: salePlans({}), session: null}), servicesPage({session: null})]) {
    assert.doesNotMatch(h, /traffic estimator|trafficestimator|logo-tes/i);
    assert.doesNotMatch(h, /\bTES\b/);
  }
});

test('versão de rede local (offline) sai com a marca TES; MARCA=silsec volta à SilSec', () => {
  const base = {DB_NAME: 'silsec', DB_USER: 'silsec', DB_PASSWORD: 'x'.repeat(24), ADMIN_EMAIL: 'adm@x.test'};
  assert.equal(montarAmbiente(base, {}).env.SILSEC_MARCA, 'tes');
  assert.equal(montarAmbiente({...base, MARCA: 'SilSec'}, {}).env.SILSEC_MARCA, 'silsec');
});
