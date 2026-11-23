// Regressão: o gabarito da etapa "Cálculo populacional" precisa fechar todas as suas <div> e <section>.
// Um </div> sobrando fechava o .layout cedo e o resumo e a descrição passavam para a coluna da esquerda,
// sob a barra lateral fixa (o texto aparecia cortado).
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {dirname, join} from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const source = readFileSync(join(here, '..', 'www', 'app.js'), 'utf8');

function functionSource(name, next) {
  const start = source.indexOf(`function ${name}(`);
  const end = source.indexOf(`function ${next}(`, start);
  assert.ok(start >= 0 && end > start, `não encontrei ${name}`);
  return source.slice(start, end);
}

test('populationForm fecha todas as <div> e <section> do próprio gabarito', () => {
  const body = functionSource('populationForm', 'auditoriumFields');
  const opens = (body.match(/<div\b/g) || []).length;
  const closes = (body.match(/<\/div>/g) || []).length;
  assert.equal(opens, closes, `<div>: ${opens} abertas, ${closes} fechadas`);
  assert.equal((body.match(/<section\b/g) || []).length, (body.match(/<\/section>/g) || []).length);
});

test('o resumo por andar e o total ficam dentro de main, não irmãos de .layout', () => {
  const body = functionSource('populationForm', 'auditoriumFields');
  assert.match(body, /id="population-summary"/);
  assert.match(body, /class="fields population-total"/);
});
