// 9.5.7: tabela de 6 colunas de "Consumo elétrico e melhorias estimadas" rola para o lado em largura de celular, na tela e na versão do relatório.
// Na impressão, a tabela continua sem barra de rolagem (overflow visível, colunas ajustadas à página).
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {defaultStudy, recalculatePopulationAndStudies} from '../public/engine.js';
import {energySection} from '../public/analysis-view.js';

const css = readFileSync(new URL('../public/styles.css', import.meta.url), 'utf8');
// Separa as regras de tela das regras dentro de @media print.
function split(text) {
  const screen = [], print = [];
  let i = 0;
  while (i < text.length) {
    const at = text.indexOf('@media print{', i);
    if (at < 0) { screen.push(text.slice(i)); break; }
    screen.push(text.slice(i, at));
    let depth = 1, j = at + '@media print{'.length;
    while (depth && j < text.length) { if (text[j] === '{') depth++; else if (text[j] === '}') depth--; j++; }
    print.push(text.slice(at, j)); i = j;
  }
  return {screen: screen.join(''), print: print.join('')};
}
const lastRule = (text, selector) => { const re = new RegExp('(?:^|[{},])' + selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\{([^}]*)\\}', 'g'); let m, last = null; while ((m = re.exec(text))) last = m[1]; return last; };

test('tabela de 6 colunas do consumo elétrico: rolagem lateral em largura de celular (9.5.7)', () => {
  const c = recalculatePopulationAndStudies(defaultStudy());
  for (const print of [false, true]) {
    const html = energySection(c.study, c.results, {print});
    assert.match(html, /Consumo elétrico e melhorias estimadas/);
    const wrap = html.match(/<div class="table-wrap">\s*<table[^>]*>\s*<thead>\s*<tr>((?:\s*<th[^>]*>.*?<\/th>)+)\s*<\/tr>/s);
    assert.ok(wrap, 'a primeira tabela fica dentro de .table-wrap' + (print ? ' (relatório)' : ''));
    assert.equal((wrap[1].match(/<th/g) || []).length, 6, 'a tabela tem 6 colunas');
  }
  const {screen, print} = split(css);
  const rules = []; screen.replace(/(?:^|[},])\.table-wrap\{([^}]*)\}/g, (_, body) => rules.push(body));
  assert.ok(rules.some(r => /overflow(-x)?:auto/.test(r)) && !rules.some(r => /overflow(-x)?:(visible|hidden)/.test(r)), 'na tela, .table-wrap rola');
  const report = lastRule(screen, '.analysis-print .table-wrap') || '';
  assert.match(report, /overflow-x:auto/, 'na tela, a versão do relatório também rola (antes ficava visível e cortava em 375 px)');
  assert.doesNotMatch(report, /overflow:visible/);
  assert.match(lastRule(print, '.analysis-print .table-wrap') || '', /overflow:visible/, 'na impressão, sem barra de rolagem');
});
