// 9.5.7 · padrão visual dos gráficos (vídeo "Guia SilSec de Tráfego"). Só visual: dados, posições e valores desenhados não mudam.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {defaultStudy, recalculatePopulationAndStudies} from '../www/engine.js';
import {allStudyCharts, chartHtml, energyCharts} from '../www/analysis-charts.js';

const css = readFileSync(new URL('../www/styles.css', import.meta.url), 'utf8');

test('gráficos: barras, pico em destaque, linha principal e referência tracejada por papel (9.5.7)', () => {
  const bar = chartHtml({id: 'b', title: 'Teste', type: 'bar', labels: ['A', 'B', 'C'], yLabel: 'kWh / ano', series: [{name: 'Consumo', values: [5, 9, 2], color: '087E79'}]});
  assert.equal((bar.match(/class="chart-bar chart-peak"/g) || []).length, 1, 'só a maior barra é o pico');
  assert.match(bar, /<rect x="[^"]+" y="[^"]+" width="[^"]+" height="[^"]+" fill="#087E79" class="chart-bar chart-peak"><title>B: 9<\/title>/);
  const line = chartHtml({id: 'l', title: 'Atendimento', type: 'line', x: [0, 5, 10], xLabel: 'min', yLabel: 'Pessoas / 5 min', series: [{name: 'Entrada', values: [1, 7, 3], color: '087E79'}, {name: 'Capacidade', values: [4, 4, 4], color: 'B37423'}]});
  assert.match(line, /class="chart-line role-primary"/);
  assert.match(line, /class="chart-line role-reference"/, 'capacidade é a linha de referência');
  assert.match(line, /class="chart-peak-dot"/);
  // unidade presente em todos os gráficos do estudo
  const c = recalculatePopulationAndStudies(defaultStudy());
  for (const ch of allStudyCharts(c.study, c.results)) assert.match(ch.yLabel, /pessoas|kWh|kW|m\/s|PSH|Pessoas/i, ch.id + ' sem unidade');
});

const realStudy = () => { const s = defaultStudy(); for (const k of Object.keys(s.energy.technologies)) Object.assign(s.energy.technologies[k], {source: 'manufacturer', reference: 'Catálogo do fabricante (teste)'}); return s; };
test('gráficos: destaque da economia usa os valores já calculados (9.5.7)', () => {
  const c = recalculatePopulationAndStudies(realStudy());
  const e = c.results.energy, ch = energyCharts(c.results)[0];
  const best = e.technologies.filter(t => t.savingKwh > 0).sort((a, b) => b.savingKwh - a.savingKwh)[0];
  assert.equal(ch.highlight.value, best.savingPercent);
  assert.match(ch.highlight.detail, new RegExp(new Intl.NumberFormat('pt-BR', {maximumFractionDigits: 2}).format(best.savingKwh).replace('.', '\\.')));
  const html = chartHtml(ch);
  assert.match(html, /class="chart-highlight"/);
  assert.match(html, new RegExp(new Intl.NumberFormat('pt-BR', {maximumFractionDigits: 2}).format(best.savingPercent) + '%'));
});

test('gráficos: tela com fundo #1F2A22 e cores do vídeo; relatório e impressão com fundo claro e âmbar do tema (9.5.7)', () => {
  const tela = css.match(/\.analysis-chart\{--ch-title[^}]*\}/)?.[0] || '';
  for (const cor of ['#1F2A22', '#5DA246', '#EDA10B', '#8A978C']) assert.ok(tela.includes(cor), cor);
  assert.match(css, /\.analysis-chart h3\{[^}]*text-transform:uppercase[^}]*letter-spacing/);
  assert.match(css, /\.analysis-chart \.chart-line\.role-reference\{[^}]*stroke-dasharray/);
  const rel = css.match(/\.analysis-print \.analysis-chart\{--ch-title[^}]*\}/)?.[0] || '';
  assert.match(rel, /--ch-bg:#fff/); assert.match(rel, /--ch-peak:var\(--amber/);
  assert.match(css, /@media print\{\.analysis-chart\{[^}]*--ch-bg:#fff/);
});

test('gráficos: nada ilustrativo · sem destaque quando a economia vem de valores ilustrativos (9.5.7)', () => {
  const ilustr = recalculatePopulationAndStudies(defaultStudy());
  assert.ok(ilustr.results.energy.technologies.every(t => t.source === 'illustrative'));
  const ch = energyCharts(ilustr.results)[0];
  assert.equal(ch.highlight, null, 'sem destaque');
  const html = chartHtml(ch);
  assert.doesNotMatch(html, /chart-highlight|Exemplo|Economia estimada/, 'sem destaque, sem rótulo e sem marcador');
  // referência ilustrativa e tecnologia real: também sem destaque (a economia depende da referência)
  const s = defaultStudy(); s.energy.technologies.regenerative = {...s.energy.technologies.regenerative, source: 'manufacturer', reference: 'Catálogo (teste)'};
  assert.equal(energyCharts(recalculatePopulationAndStudies(s).results)[0].highlight, null);
  // dados reais: destaque com os valores da tabela
  const real = recalculatePopulationAndStudies(realStudy());
  const best = real.results.energy.technologies.filter(t => t.savingKwh > 0).sort((a, b) => b.savingKwh - a.savingKwh)[0];
  const h = energyCharts(real.results)[0].highlight;
  assert.match(h.label, /^Economia estimada · /);
  assert.equal(h.value, best.savingPercent);
});
