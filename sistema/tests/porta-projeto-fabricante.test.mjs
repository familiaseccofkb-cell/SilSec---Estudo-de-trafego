import test from 'node:test';
import assert from 'node:assert/strict';
import {annexPages} from '../public/report.js';
import {defaultStudy,recalculatePopulationAndStudies} from '../public/engine.js';
import {normalizeStudy} from '../public/state.js';
import {changeCar,fleetCars} from '../public/fleet.js';
import {carWarnings,autoFillCar} from '../public/car-controls.js';

// 9.5.7 (Fabio, 20/11/2026): a NBR usa a porta e o vão do projeto; o fabricante informa os dele em campos próprios.
// Divergências geram aviso e um resumo de cálculo logo abaixo do Anexo A · Fabricante.
const f=(x,d=2)=>Number.isFinite(x)?x.toFixed(d):'—';
function divergent(){let s=normalizeStudy(defaultStudy());
 for(const [k,v] of [['manufacturerDoor','central'],['manufacturerWidth',1100],['open',1.6],['close',2.3]])s=changeCar(s,0,0,k,v);
 return s;}

test('porta do fabricante não altera o cálculo NBR, só o do fabricante',()=>{
 const base=recalculatePopulationAndStudies(normalizeStudy(defaultStudy())).results,div=recalculatePopulationAndStudies(divergent()).results;
 assert.equal(div.normative.interval,base.normative.interval);
 assert.equal(div.normative.capacity,base.normative.capacity);
 assert.equal(div.groups[0].normative.passenger,2.4,'Tabela 4 pelo vão do projeto (800 mm)');
 assert.equal(div.groups[0].normative.door,5.5,'Tabela 3 pela porta do projeto (lateral)');
});

test('divergência: aviso na tela e resumo de cálculo abaixo do Anexo A · Fabricante',()=>{
 const s=divergent(),car=fleetCars(s,s.groups[0])[0];
 const aviso=carWarnings(s,s.groups[0],car,{f}).find(w=>/Divergência entre projeto e fabricante/.test(w));
 assert.match(aviso,/tipo de porta \(projeto: abertura lateral; fabricante: abertura central\)/);
 assert.match(aviso,/vão \(projeto: 800 mm; fabricante: 1100 mm\)/);
 assert.match(aviso,/o Anexo A da NBR muda/);
 const c=recalculatePopulationAndStudies(s),html=annexPages(c.study,c.results);
 const order=['NBR 5665 · Anexo A','Anexo A · Fabricante','Resumo de cálculo · divergências entre projeto e fabricante'].map(t=>html.indexOf(t));
 assert.ok(order.every((p,i)=>p>=0&&(i===0||p>order[i-1])),'resumo vem logo depois do anexo do fabricante');
 const nbr=html.split('<section class="annex-page">')[1];
 assert.match(nbr,/<tr><th>7 · Tipo de portas<\/th><td>Abertura lateral<\/td>/);
 assert.match(nbr,/<tr><th>8 · Abertura livre \(m\)<\/th><td>0,8<\/td>/);
 const fab=html.split('<section class="annex-page">').find(p=>p.includes('Anexo A · Fabricante'));
 assert.match(fab,/<td>Abertura central<\/td>/);
 assert.match(fab,/1,6 \+ 2,3 = 3,9/);
 const resumo=html.slice(order[2]);
 assert.match(resumo,/O que muda no Anexo A da NBR se as medidas do fabricante forem adotadas/);
 assert.match(resumo,/16 · T · Tempo total de viagem \(s\)<\/th><td>118,766<\/td><td>106,12<\/td>/);
});

test('sem divergência de medidas, o resumo diz que o Anexo A da NBR não muda',()=>{
 const c=recalculatePopulationAndStudies(normalizeStudy(defaultStudy())),html=annexPages(c.study,c.results);
 assert.match(html,/As diferenças não mudam o Anexo A da NBR/);
});

test('preenchimento automático usa porta e vão do fabricante e preserva os do projeto',()=>{
 let s=normalizeStudy(defaultStudy());s=changeCar(s,0,0,'manufacturerDoor','central');s=changeCar(s,0,0,'manufacturerWidth',1100);
 const filled=autoFillCar(s,0,0),car=fleetCars(filled,filled.groups[0])[0];
 assert.equal(car.door,'lateral');assert.equal(car.width,800);
 assert.equal(car.manufacturerDoor,'central');assert.equal(car.manufacturerWidth,1100);
 assert.equal(car.passenger,2,'Tabela 4 pelo vão do fabricante (1.100 mm)');
});
