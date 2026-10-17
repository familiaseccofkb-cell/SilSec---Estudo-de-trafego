import test from 'node:test';
import assert from 'node:assert/strict';
import {cabinAreaLimits,cabinAreaCheck,cabinAreaHtml,CABIN_AREA_ROWS} from '../public/cabin-area.js';
import {defaultStudy} from '../public/engine.js';
import {normalizeStudy} from '../public/state.js';
import {dimensionsReport} from '../public/dimensions.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-10,`${a} ≠ ${b}`);

test('área máxima: valores esperados de todas as expressões de 21 a 33',()=>{
 const expected=[3.52,3.64,3.76,3.88,4,4.12,4.24,4.36,4.48,4.60,4.72,4.84,4.96];
 expected.forEach((max,i)=>near(cabinAreaLimits(21+i).max,max));
 assert.deepEqual(cabinAreaLimits(20),{min:3.13,max:3.4});
 near(cabinAreaLimits(21).min,3.245);
 near(cabinAreaLimits(33).min,4.625);
});
test('área: capacidades acima da tabela usam fórmulas gerais, inclusive 44',()=>{
 for(const [capacity,min,max] of [[34,4.74,5.08],[44,5.89,6.28],[100,12.33,13]]){
  const limits=cabinAreaLimits(capacity);near(limits.min,min);near(limits.max,max);
  assert.equal(cabinAreaCheck(capacity,1000,min*1000).status,'within');
  assert.equal(cabinAreaCheck(capacity,1000,max*1000).status,'within');
  assert.equal(cabinAreaCheck(capacity,1000,(min-.001)*1000).status,'below');
  assert.equal(cabinAreaCheck(capacity,1000,(max+.001)*1000).status,'above');
 }
 assert.equal(CABIN_AREA_ROWS.some(row=>row[0]===44),false);
 assert.equal(cabinAreaCheck(44,2000,3000).ranges.length,1);
});
test('área: comprimentos em mm e capacidades inválidas não produzem faixa fictícia',()=>{
 near(cabinAreaCheck(44,2000,3000).area,6);
 for(const c of [null,undefined,NaN,Infinity,0,3,20.5,34.5,'44']){
  assert.equal(cabinAreaLimits(c),null);
  assert.equal(cabinAreaCheck(c,2000,3000).status,'unlisted');
 }
 for(const [w,d] of [[null,3000],[2000,0],[-1000,3000],[Infinity,3000]])assert.equal(cabinAreaCheck(44,w,d).status,'missing');
});
test('área: tela e relatório mostram limites separados sem o parágrafo removido',()=>{
 const study=normalizeStudy(defaultStudy()),g=study.groups[0];
 g.capacity=44;g.siteDimensions={cabinWidth:2000,cabinDepth:3000};
 const html=cabinAreaHtml(study,g,{esc:String,f:(x,d=2)=>Number.isFinite(x)?x.toFixed(d):'—'});
 assert.match(html,/<td>5\.8900<\/td><td>6\.2800<\/td>/);
 assert.match(html,/Dentro da faixa/);
 assert.match(html,/Área mínima \(m²\)/);assert.match(html,/Área máxima \(m²\)/);assert.doesNotMatch(html,/Área =|Referência:|C ≥ 21/);
 assert.doesNotMatch(html,/faixas conflitantes|Referência pendente|cabin-area-invalid/);
 study.supplyCondition={type:'retrofit'};
 const report=dimensionsReport(study,String,(x,d=2)=>Number.isFinite(x)?x.toFixed(d):'—');
 assert.match(report,/<td>5\.8900<\/td><td>6\.2800<\/td>/);
 assert.doesNotMatch(report,/C × 75 − 2.500/);
});
