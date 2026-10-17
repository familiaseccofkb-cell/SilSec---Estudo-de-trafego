import test from 'node:test';
import assert from 'node:assert/strict';
import {accessibilityCheck,accessibilityHtml} from '../public/accessibility.js';
import {cabinAreaHtml} from '../public/cabin-area.js';

test('NBR 16858-3: cabina 1100 x 1400 com porta 900 é tipo 2 e atende obra nova',()=>{
 const r=accessibilityCheck({cabinWidth:1100,cabinDepth:1400,doorWidth:900,building:'new'});
 assert.equal(r.status,'meets');assert.equal(r.best,2);assert.equal(r.minimum,2);
});
test('NBR 16858-3: porta de 800 mm no tipo 2 é condicionada em obra nova e aceita em edifício existente',()=>{
 const novo=accessibilityCheck({cabinWidth:1100,cabinDepth:1400,doorWidth:800,building:'new'});
 assert.deepEqual(novo.types,[{type:2,door:'conditional'}]);assert.match(novo.notes.join(' '),/NBR 9050/);
 const existente=accessibilityCheck({cabinWidth:1100,cabinDepth:1400,doorWidth:800,building:'existing'});
 assert.ok(existente.types.some(t=>t.type===2&&t.door==='ok'));
});
test('NBR 16858-3: tipo 1 somente em edifício existente',()=>{
 assert.equal(accessibilityCheck({cabinWidth:950,cabinDepth:1300,doorWidth:800,building:'new'}).status,'none');
 const r=accessibilityCheck({cabinWidth:950,cabinDepth:1300,doorWidth:800,building:'existing'});
 assert.equal(r.status,'meets');assert.equal(r.best,1);
});
test('NBR 16858-3: portas adjacentes exigem tipo 4; cabina tipo 3 não basta',()=>{
 const tipo3=accessibilityCheck({cabinWidth:1200,cabinDepth:2200,doorWidth:1100,arrangement:'adjacent'});
 assert.equal(tipo3.best,3);assert.equal(tipo3.status,'below');
 const tipo4=accessibilityCheck({cabinWidth:1400,cabinDepth:1600,doorWidth:900,arrangement:'adjacent'});
 assert.equal(tipo4.status,'meets');assert.match(tipo4.notes.join(' '),/segundo corrimão/);
});
test('NBR 16858-3: tipo 5 nas duas orientações exige porta de 1100 mm',()=>{
 assert.equal(accessibilityCheck({cabinWidth:2000,cabinDepth:1400,doorWidth:1100}).best,5);
 assert.equal(accessibilityCheck({cabinWidth:1400,cabinDepth:2000,doorWidth:1000}).best,4);
});
test('NBR 16858-3: dimensões ausentes ficam pendentes e porta ausente não declara conformidade',()=>{
 assert.equal(accessibilityCheck({}).status,'missing');
 const r=accessibilityCheck({cabinWidth:1100,cabinDepth:1400});
 assert.equal(r.status,'below');assert.match(r.notes.join(' '),/abertura livre/);
});
test('NBR 16858-3: seção é exibida junto à conferência de área e escapa texto',()=>{
 const html=cabinAreaHtml({supplyCondition:{type:'retrofit'},groups:[]},{count:1,capacity:8,siteDimensions:{cabinWidth:1100,cabinDepth:1400,doorWidth:800}},{esc:x=>String(x),f:v=>String(v)});
 assert.match(html,/Acessibilidade da cabina/);assert.match(html,/Atende ao mínimo exigido \(tipo 1\)/);
 assert.doesNotMatch(accessibilityHtml({cabinWidth:1,cabinDepth:1},x=>String(x).replace(/</g,'&lt;')),/<script/);
});
