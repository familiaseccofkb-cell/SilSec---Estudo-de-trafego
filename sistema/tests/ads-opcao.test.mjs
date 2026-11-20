// 9.5.7 (pedido do Fabio): o comparativo do ADS só aparece com "Estimar sistema com antecipação de destino" marcada.
// Sem a opção: só a chamada convencional, sem coluna ADS, sem comparação e sem o texto do método. A caixa continua visível. O cálculo não muda.
import test from 'node:test';
import assert from 'node:assert/strict';
import {defaultStudy, recalculatePopulationAndStudies} from '../public/engine.js';
import {adsComparisonHtml, adsComparison, adsComparisonValues} from '../public/ads-comparison.js';
import {destinationPanel} from '../public/destination-view.js';

const h = {checkField: (label, path) => `<input type="checkbox" data-path="${path}"><span>${label}</span>`, field: (label, path) => `<input data-path="${path}">`};
const run = on => { const s = defaultStudy(); s.destination = {...(s.destination || {}), enabled: on, sectors: 0}; return recalculatePopulationAndStudies(s); };

test('comparativo ADS: desmarcada mostra só o convencional; marcada mostra o comparativo; cálculo igual (9.5.7)', () => {
  const off = run(false), on = run(true);
  const htmlOff = adsComparisonHtml(off.study, off.results), htmlOn = adsComparisonHtml(on.study, on.results);
  assert.match(htmlOff, /Cálculo do sistema SilSec · chamada convencional/);
  assert.doesNotMatch(htmlOff, /ADS-Antecipador de Destino<\/th>/, 'sem coluna ADS');
  assert.doesNotMatch(htmlOff, /× ADS|igual nos dois sistemas|setor contínuo/, 'sem comparação nem texto do ADS');
  assert.ok(!/<tr><th scope="row">[^<]*<\/th><td[^>]*>[^<]*(<small>[^<]*<\/small>)?<\/td><td/.test(htmlOff), 'cada linha tem só a coluna Convencional');
  assert.match(htmlOn, /chamada convencional × ADS-Antecipador de Destino/);
  assert.match(htmlOn, /<th scope="col">ADS-Antecipador de Destino<\/th>/);
  // O cálculo do comparativo é o mesmo com a opção marcada ou não (só a exibição muda).
  assert.deepEqual(adsComparisonValues(adsComparison(off.study, off.results)), adsComparisonValues(adsComparison(on.study, on.results)));
  // Linha da capacidade convencional igual nas duas exibições.
  const cap = html => html.match(/População atendida em 5 min · capacidade dos elevadores \(pessoas\)<\/th><td[^>]*>([^<]+)/)?.[1];
  assert.equal(cap(htmlOff), cap(htmlOn));
});

test('painel do ADS: caixa sempre visível; texto do método (ISO 8100-32, cláusulas autorizadas) só com a opção marcada (9.5.7)', () => {
  const off = run(false), on = run(true);
  const pOff = destinationPanel(off.study, off.results, h), pOn = destinationPanel(on.study, on.results, h);
  for (const p of [pOff, pOn]) assert.match(p, /data-path="destination.enabled"/);
  assert.doesNotMatch(pOff, /ISO 8100-32|Al-Sharif/);
  assert.match(pOn, /calculado pelo método de cálculo da ISO 8100-32:2020/);
  assert.doesNotMatch(pOn, /Al-Sharif/);
  // Cláusulas autorizadas pelo Fabio em 19/11: 7 (método de cálculo); 5.3 e seção 8 (simulação). Nenhuma outra.
  assert.match(pOn, /ISO 8100-32:2020 \(cláusula 7\)/);
  assert.match(pOn, /\(5\.3 e seção 8\)/);
  const citadas = [...pOn.matchAll(/(cláusula \d+|\d+\.\d+ e seção \d+)/g)].map(m => m[1]);
  assert.ok(citadas.every(c => ['cláusula 7', '5.3 e seção 8'].includes(c)), citadas.join(', '));
});
