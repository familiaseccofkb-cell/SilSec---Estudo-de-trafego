// Pendências do cálculo antes da separação TES/SilSec (pedido de 21/11/2026).
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, readdirSync} from 'node:fs';
import {defaultStudy, recalculatePopulationAndStudies} from '../www/engine.js';
import {normalizeStudy} from '../www/state.js';
import {autoFillCar, carWarnings, carTimingTable} from '../www/car-controls.js';
import {fleetCars} from '../www/fleet.js';
import {SIGLAS} from '../www/siglas.js';

test('autoFillCar (NBR): tempo adicional de partida fica vazio (não 0 s), sinalizado; o fabricante só é calculado depois de informado', () => {
  const s = autoFillCar(normalizeStudy(defaultStudy()), 0, 0), g = s.groups[0], car = fleetCars(s, g)[0];
  assert.equal(car.start, null);
  assert.equal(car.startToConfirm, true);
  const html = carTimingTable(s, 0, {esc: String, f: String});
  assert.match(html, /<input id="car-0-0-start"[^>]*value=""[^>]*class="motion-warning-yellow"/);
  assert.ok(carWarnings(s, g, car, {f: String}).some(w => /partida não preenchido/.test(w)));
  const r = recalculatePopulationAndStudies(s).results.groups[0];
  assert.ok(Number.isFinite(r.normative.total));
  assert.equal(r.manufacturer?.total ?? null, null);
});

test('RTT removido dos textos: só TIV (decisão D6)', () => {
  assert.ok(!SIGLAS.some(([s]) => s === 'RTT'));
  const dir = new URL('../www/', import.meta.url);
  for (const f of readdirSync(dir).filter(f => /\.(js|html|json|md)$/.test(f))) assert.doesNotMatch(readFileSync(new URL(f, dir), 'utf8'), /\bRTT\b/, f);
});
