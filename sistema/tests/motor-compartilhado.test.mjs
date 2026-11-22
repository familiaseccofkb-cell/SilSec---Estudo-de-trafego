// TES · motor compartilhado: os números calculados pelo pacote motor/ devem ser idênticos aos de antes da separação.
// Uma divergência aqui deve ser REPORTADA ao Fabio, não corrigida no teste.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import * as M from '../motor/index.mjs';

const ref = JSON.parse(readFileSync(new URL('./fixtures/motor-numeros.json', import.meta.url), 'utf8'));
const arred = (k, v) => typeof v === 'number' ? Number(v.toPrecision(12)) : (/(At|date|Date|time stamp|generated)$/.test(k) && typeof v === 'string' ? '<data>' : v);
const nbr = (oc, ads) => { const s = M.normalizeStudy(M.defaultStudy()); s.groups.forEach(g => { g.cabinOccupancy = oc; }); s.destination = {enabled: ads, sectors: 0}; return s; };
const caso = s => { const r = M.recalculatePopulationAndStudies(s); let ads = null; try { ads = M.adsComparison(r.study, r.results); } catch (e) { ads = 'erro: ' + e.message; } return {results: r.results, ads}; };
const casos = {
  'nbr-100': () => nbr(100, false), 'nbr-80-ads': () => nbr(80, true), 'nbr-50-ads': () => nbr(50, true),
  'iso-80': () => M.switchTrafficModel(nbr(80, false), 'iso8100'), 'iso-80-ads': () => M.switchTrafficModel(nbr(80, true), 'iso8100'),
};

for (const [nome, montar] of Object.entries(casos)) test(`motor compartilhado: ${nome} igual ao de antes da separação`, () => {
  const v = JSON.parse(JSON.stringify(caso(montar()), arred));
  const g = v.results.groups.map(g => ({ciclo: (g.normative || g.iso)?.total ?? null, capacidade: (g.normative || g.iso)?.capacity ?? null}));
  assert.deepEqual(g, ref.casos[nome].grupos, 'ciclo/capacidade mudaram');
  assert.equal(createHash('sha256').update(JSON.stringify(v)).digest('hex'), ref.casos[nome].sha256, 'algum resultado mudou');
});

test('motor compartilhado: avaliarEstudo devolve estudo, resultados e comparativo ADS com nome TES', () => {
  const a = M.avaliarEstudo(nbr(80, true));
  assert.equal(a.motor.nome, 'Traffic Estimator System');
  assert.ok(a.results.groups.length > 0);
  assert.ok(a.ads && a.ads.conventional);
});
