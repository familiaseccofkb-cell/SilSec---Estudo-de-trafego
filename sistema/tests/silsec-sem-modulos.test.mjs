// SilSec 19q (Fabio, 22/11/2026): o site da SilSec não vende mais o sistema de estudo de tráfego; ele está na TES
// (trafficestimatorsystem.com). Nenhuma página pública da SilSec oferece módulos, planos, preços ou teste grátis;
// /modulos e /experimentar vão (301) para a mesma página na TES; "Área do cliente" e a linha do TES ficam só no rodapé.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readConfig} from '../server/platform/config.mjs';
import {createApp} from '../server/platform/app.mjs';
import {openSqlite} from '../server/platform/database.mjs';
import {BRAND} from '../www/brand.js';

const TES = 'https://trafficestimatorsystem.com';
const VENDA = /m[óo]dulos? de software|Detalhes do m[óo]dulo|Sistema de estudo de tráfego (Básico|Completo)|R\$\s?\d|assinatura anual|30 dias|teste grátis|Testar 30|Acesso educacional|plataforma|href="\/modulos|href="\/experimentar/i;
// Páginas do site (menu completo): o botão "Acessar o sistema" saiu do topo e virou "Área do cliente" no rodapé.
// As páginas da área do cliente (ativar chave, entrar) mantêm o cabeçalho reduzido com o acesso ao sistema.
const SITE = ['/', '/servicos', '/orcamento'];

async function site(env = {}) {
  const app = await createApp(readConfig({SITE_OWNER_EMAIL: 'dono@silsec.test', DB_DRIVER: 'sqlite', SQLITE_FILE: ':memory:', ...env}), {db: await openSqlite(':memory:'), mailer: {configured: false, async send() { return {delivered: false}; }}, log: {log() {}, warn() {}, error() {}}});
  const srv = createServer(app.handler); await new Promise(r => srv.listen(0, '127.0.0.1', r));
  const base = 'http://127.0.0.1:' + srv.address().port;
  const get = async (p, opts = {}) => { const r = await fetch(base + p, {redirect: 'manual', ...opts}); return {status: r.status, location: r.headers.get('location'), text: await r.text()}; };
  return {get, async close() { srv.close(); await app.close(); }};
}

test('SilSec: nenhuma página pública oferece módulos, planos, preços ou teste grátis', async () => {
  assert.equal(BRAND.id, 'silsec');
  const s = await site();
  try {
    for (const p of ['/', '/servicos', '/orcamento', '/ativar', '/entrar', '/cadastrar', '/esqueci-senha']) {
      const r = await s.get(p);
      assert.equal(r.status, 200, p);
      // a única menção ao sistema é a linha do rodapé ("Conheça o TES…") e o link "Área do cliente"
      const pagina = r.text.replace(/<a href="https:\/\/trafficestimatorsystem\.com">Conheça o TES, produto da SilSec Engenharia<\/a>/, '');
      const achado = pagina.replace(/<[^>]+>/g, m => /href=/.test(m) ? m : ' ').match(new RegExp('.{0,40}(' + VENDA.source + ').{0,40}', 'i'));
      assert.equal(achado, null, `${p}: ${achado?.[0]}`);
      if (SITE.includes(p)) assert.doesNotMatch(r.text, /Acessar o sistema/, p);
    }
    const home = (await s.get('/')).text;
    // menu do topo: só serviços, sobre, contato e orçamento
    const menu = home.match(/<nav class="site-nav" id="menu"[\s\S]*?<\/nav>/)[0];
    assert.deepEqual([...menu.matchAll(/<a [^>]*>([^<]+)<\/a>/g)].map(m => m[1]), ['Serviços', 'Sobre', 'Contato', 'Solicite um orçamento']);
    // rodapé: sem a coluna de módulos; "Área do cliente" e a linha do TES
    const rodape = home.slice(home.indexOf('<footer'));
    assert.doesNotMatch(rodape, /<small>Módulos de software<\/small>/);
    assert.match(rodape, /<a href="\/entrar\?volta=%2Fsistema">Área do cliente<\/a>/);
    assert.match(rodape, /<a href="https:\/\/trafficestimatorsystem\.com">Conheça o TES, produto da SilSec Engenharia<\/a>/);
    assert.equal(home.split('trafficestimatorsystem.com').length, 2, 'o TES aparece só no rodapé');
    // vídeo de apresentação do sistema saiu
    assert.doesNotMatch(home, /2ndckRtA65k/);
    // orçamento sem a opção de módulos
    assert.doesNotMatch((await s.get('/orcamento')).text, /value="Módulos de software/);
    // robots e sitemap sem as páginas do sistema
    const robots = (await s.get('/robots.txt')).text, sitemap = (await s.get('/sitemap.xml')).text;
    assert.doesNotMatch(robots + sitemap, /modulos|experimentar/);
    assert.deepEqual([...sitemap.matchAll(/<loc>[^<]*?(\/[a-z]*)<\/loc>/g)].map(m => m[1]), ['/', '/servicos', '/orcamento']);
  } finally { await s.close(); }
});

test('SilSec: /modulos e /experimentar vão (301) para a mesma página na TES, com a consulta', async () => {
  const s = await site();
  try {
    for (const [p, destino] of [['/modulos', TES + '/modulos'], ['/modulos?origem=google', TES + '/modulos?origem=google'], ['/experimentar', TES + '/experimentar'], ['/experimentar?plano=basic', TES + '/experimentar?plano=basic']]) {
      const r = await s.get(p);
      assert.equal(r.status, 301, p);
      assert.equal(r.location, destino, p);
    }
  } finally { await s.close(); }
});

test('SilSec: quem já tem conta continua entrando, ativando chave e renovando na SilSec', async () => {
  const s = await site();
  try {
    assert.equal((await s.get('/entrar')).status, 200);
    const ativar = await s.get('/ativar');
    assert.equal(ativar.status, 200); assert.match(ativar.text, /Ativar chave de acesso/); assert.doesNotMatch(ativar.text, /experimentar|30 dias/);
    assert.match((await s.get('/assinatura')).location, /^\/entrar\?volta=%2Fassinatura/);
    assert.match((await s.get('/sistema')).location, /^\/entrar/);
  } finally { await s.close(); }
});

test('versão de computador e rede local da SilSec: páginas do sistema continuam locais (sem 301)', async () => {
  const s = await site({SILSEC_REDE: '1'});
  try {
    assert.equal((await s.get('/modulos')).status, 200);
    assert.equal((await s.get('/experimentar')).status, 200);
  } finally { await s.close(); }
});
