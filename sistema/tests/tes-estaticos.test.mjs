// Pacote TES com os arquivos estáticos já na marca TES (22/11/2026): na Hostinger, www/ é entregue direto pela CDN,
// sem passar pelo Node. O teste grava a marca numa cópia (scripts/materializar-marca.mjs) e confere os arquivos com o
// servidor DESLIGADO: nenhum "SilSec" visível fora da menção "Produto da SilSec Engenharia".
import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {cpSync, mkdtempSync, readFileSync, readdirSync, existsSync, rmSync, statSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {fileURLToPath} from 'node:url';

const raiz = fileURLToPath(new URL('../', import.meta.url));
const PRODUTO = 'Produto da SilSec Engenharia';
const TEXTO = /\.(js|mjs|css|html|json|webmanifest|svg|md|txt|xml)$/;

function copia() {
  const dir = mkdtempSync(join(tmpdir(), 'tes-estaticos-'));
  for (const p of ['www', 'server', 'scripts', 'package.json']) cpSync(join(raiz, p), join(dir, p), {recursive: true});
  return dir;
}
const roda = (dir, env) => execFileSync(process.execPath, ['scripts/materializar-marca.mjs', '--gravar'], {cwd: dir, env: {...process.env, SILSEC_MARCA: '', ...env}, encoding: 'utf8'});
const listar = (dir, base = '') => readdirSync(join(dir, base)).flatMap(n => {
  const rel = base ? base + '/' + n : n;
  return statSync(join(dir, rel)).isDirectory() ? listar(dir, rel) : [rel];
});

test('pacote TES: arquivos estáticos já na marca TES, sem SilSec visível (servidor desligado)', () => {
  const dir = copia();
  try {
    const rel = JSON.parse(roda(dir, {SILSEC_MARCA: 'tes'}));
    const pub = join(dir, 'www'), ler = f => readFileSync(join(pub, f));
    // ícones nos caminhos padrão = os da TES
    for (const [padrao, tes] of [['favicon.svg', 'marca/tes/favicon.svg'], ['apple-touch-icon.png', 'marca/tes/apple-touch-icon.png'], ['icones/apple-touch-icon.png', 'marca/tes/apple-touch-icon.png'], ['icones/icone-192.png', 'marca/tes/icone-192.png'], ['icones/icone-512.png', 'marca/tes/icone-512.png'], ['icones/icone-maskable-512.png', 'marca/tes/icone-maskable-512.png']]) {
      assert.ok(ler(padrao).equals(ler(tes)), padrao);
      assert.ok(rel.trocados.includes(padrao), padrao);
    }
    // manifesto do app instalado
    const man = JSON.parse(ler('manifest.webmanifest').toString());
    assert.match(man.name, /^Traffic Estimator System/);
    assert.equal(man.short_name, 'TES');
    assert.doesNotMatch(JSON.stringify(man), /vistoria|silsec/i);
    // brand.js só com o perfil TES
    const bj = ler('brand.js').toString();
    assert.match(bj, /"id":"tes"/);
    assert.match(bj, /"phone":"\+55 \(11\) 98313-0055"/);
    assert.doesNotMatch(bj.split(PRODUTO).join(''), /silsec/i);
    // tela do sistema (index.html) e manuais
    assert.match(ler('index.html').toString(), /<title>Traffic Estimator System \| Estudos de tráfego<\/title>/);
    for (const m of ['manual-do-usuario.html', 'explicacao-dos-calculos.html']) assert.match(ler(m).toString(), /contato@trafficestimatorsystem\.com/, m);
    // páginas e logos só da SilSec não vão
    for (const f of ['marca/silsec-engenharia.svg', 'identidade-silsec.html', 'silsec-especificacao.html', 'silsec-comercializacao.html']) assert.equal(existsSync(join(pub, f)), false, f);
    // nenhum "SilSec" (nem o domínio/e-mail da SilSec) em arquivo de texto, exceto a menção de produto;
    // nomes internos em minúsculas (classes CSS, ids) não aparecem para quem usa e ficam.
    const achados = [];
    for (const f of listar(pub).filter(f => TEXTO.test(f))) {
      const t = readFileSync(join(pub, f), 'utf8').split(PRODUTO).join('');
      for (const m of t.matchAll(/.{0,30}(SilSec|silsec-engenharia|silsec\.com|-silsec\.html|\/silsec-[a-z]+\.html).{0,30}/g)) achados.push(f + ': ' + m[0]);
    }
    assert.deepEqual(achados, []);
    // rodar de novo não muda nada
    assert.deepEqual(JSON.parse(roda(dir, {SILSEC_MARCA: 'tes'})), {trocados: [], ajustados: [], removidos: []});
    // o servidor continua carregando com o brand.js só da TES
    const cfg = execFileSync(process.execPath, ['--input-type=module', '-e', "import {readConfig} from './server/platform/config.mjs'; import {ajustarArquivoMarca} from './server/platform/marca.mjs'; console.log(readConfig({DB_DRIVER: 'sqlite', SQLITE_FILE: ':memory:'}).marca)"], {cwd: dir, env: {...process.env, SILSEC_MARCA: ''}, encoding: 'utf8'}).trim();
    assert.equal(cfg, 'tes');
  } finally { rmSync(dir, {recursive: true, force: true}); }
});

// SilSec 19r: o pacote da SilSec leva brand.js só com o perfil SilSec; os demais arquivos ficam iguais ao disco.
test('pacote SilSec: só brand.js é gravado, sem o perfil TES', () => {
  const dir = copia();
  try {
    assert.deepEqual(JSON.parse(roda(dir, {})), {trocados: [], ajustados: ['brand.js'], removidos: []});
    const bj = readFileSync(join(dir, 'www/brand.js'), 'utf8');
    assert.match(bj, /"id":"silsec"/);
    assert.doesNotMatch(bj, /trafficestimator|Traffic Estimator|"tes"/i);
    for (const f of ['app.js', 'index.html', 'manifest.webmanifest', 'styles.css', 'favicon.svg'])
      assert.ok(readFileSync(join(dir, 'www', f)).equals(readFileSync(join(raiz, 'www', f))), f);
    // o servidor continua carregando na marca SilSec, mesmo com SILSEC_MARCA=tes no ambiente
    const cfg = execFileSync(process.execPath, ['--input-type=module', '-e', "import {readConfig} from './server/platform/config.mjs'; import './server/platform/marca.mjs'; console.log(readConfig({DB_DRIVER: 'sqlite', SQLITE_FILE: ':memory:'}).marca)"], {cwd: dir, env: {...process.env, SILSEC_MARCA: 'tes'}, encoding: 'utf8'}).trim();
    assert.equal(cfg, 'silsec');
  } finally { rmSync(dir, {recursive: true, force: true}); }
});

test('materializar-marca exige --gravar (não altera www/ por engano)', () => {
  assert.throws(() => execFileSync(process.execPath, ['scripts/materializar-marca.mjs'], {cwd: raiz, env: {...process.env, SILSEC_MARCA: 'tes'}, stdio: 'pipe'}));
});

// TES 1.0.4 / SilSec 19r: na Hostinger, o servidor web entregava direto a pasta public/ do pacote (sem passar pelo Node:
// sem login nos manuais, sem os ajustes de marca). Os arquivos do navegador ficam em www/, que só o Node entrega.
test('não existe pasta public/: tudo do navegador está em www/ e passa pelo Node', () => {
  assert.equal(existsSync(join(raiz, 'public')), false, 'a pasta public/ voltaria a ser entregue direto pela hospedagem');
  for (const f of ['index.html', 'app.js', 'brand.js', 'manual-do-usuario.html', 'manifest.webmanifest']) assert.ok(existsSync(join(raiz, 'www', f)), f);
});
