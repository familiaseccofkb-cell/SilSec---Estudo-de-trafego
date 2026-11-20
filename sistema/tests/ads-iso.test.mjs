// 9.5.7 · decisão do responsável: a NBR 5665 não usa taxa de ocupação (lotação nominal); o ADS é calculado pela ISO 8100-32
// com o FC da ISO: passageiros por viagem = lotação × FC, sem arredondar (decisão de 19/11).
import test from 'node:test';
import assert from 'node:assert/strict';
import {defaultStudy,defaultGroup,recalculatePopulationAndStudies,calculateStudy} from '../public/engine.js';
import {normalizeStudy} from '../public/state.js';
import {annexPages} from '../public/report.js';
import {destinationEstimateIsoForNbr} from '../public/destination-iso.js';
import {probableStopsRange} from '../public/ads-comparison.js';

const run=(oc,ads)=>{const s=normalizeStudy(defaultStudy());s.groups.forEach(g=>{g.cabinOccupancy=oc;});s.destination={enabled:ads,sectors:0};return recalculatePopulationAndStudies(s);};
const nbrNumbers=r=>JSON.stringify({groups:r.groups.map(g=>({total:g.normative.total,capacity:g.normative.capacity,interval:g.normative.interval,stops:g.stops})),required:r.required,starts:r.starts});

test('NBR sem ADS: fator de ocupação 100%, 80% e 50% não muda ciclo, capacidade, intervalo, partidas, avisos nem relatório',()=>{
 const base=run(100,false),baseHtml=annexPages(base.study,base.results);
 assert.ok(!base.results.warnings.some(w=>/ocupação/i.test(w)),'aviso cita ocupação: '+base.results.warnings.filter(w=>/ocupação/i.test(w)).join(' | '));
 assert.doesNotMatch(baseHtml,/fator de ocupação|taxa de ocupação/i);
 for(const oc of [80,50]){const c=run(oc,false);
  assert.equal(nbrNumbers(c.results),nbrNumbers(base.results),`ocupação ${oc}%: números NBR mudaram`);
  assert.deepEqual(c.results.warnings,base.results.warnings,`ocupação ${oc}%: avisos mudaram`);
  assert.equal(annexPages(c.study,c.results),baseHtml,`ocupação ${oc}%: relatório mudou`);}
});

test('NBR sem ADS: fator de ocupação inválido não bloqueia o cálculo NBR; com ADS ligado, bloqueia',()=>{
 const s=normalizeStudy(defaultStudy());s.groups[0].cabinOccupancy=0;s.destination={enabled:false,sectors:0};
 assert.doesNotThrow(()=>calculateStudy(s));
 s.destination.enabled=true;assert.throws(()=>calculateStudy(s),/fator de ocupação/);
});

test('NBR com ADS: só os números do ADS mudam com a ocupação; ADS pelo método ISO, identificado',()=>{
 const base=run(100,true);
 for(const oc of [80,50]){const c=run(oc,true);assert.equal(nbrNumbers(c.results),nbrNumbers(base.results),`ocupação ${oc}%: números NBR mudaram`);
  const d=c.results.destination;assert.equal(d.method,'iso');assert.ok(d.rows.every(x=>x.method==='iso'&&x.nbr&&x.basis));
  assert.ok(d.rows.some((x,i)=>x.destination.capacity!==base.results.destination.rows[i].destination.capacity),'ADS não mudou com a ocupação');
  assert.match(d.basisText,/método de cálculo da ISO 8100-32:2020, cláusula 7/);assert.match(d.basisText,/FC da ISO/);assert.match(d.basisText,/sem arredondar/);assert.match(d.basisText,/lotação nominal/);
  assert.ok(c.results.warnings.some(w=>/ADS.*ISO 8100-32/.test(w)));
  assert.ok(!c.results.warnings.some(w=>/\(5\.3\)|8100-32:2020 \(/.test(w)),'cláusula da ISO em texto ao cliente');}
});

test('ADS ISO no estudo de referência (4 × 8 pessoas, 22 paradas, 63 m, 1,75 m/s): valores conferidos à mão',()=>{
 // Conferência manual (100%): P = 8 × 100% = 8 (80%: P = 6,4, sem arredondar); N = 21; S = 21·[1 − (20/21)^8] = 6,7864; tv = 3/1,75 = 1,7143 s;
 // tperf = 2,15 + 0,6 + 4,5966 (voo entre pavimentos) + 1,75 + 2,0 = 11,0966 s; ts = tperf − tv = 9,3823 s;
 // transferência = 2·P·2,4 = 38,4 s; TIV = 2·19,1350·1,7143 + 7,7864·9,3823 + 38,4 = 177,06 s.
 const expected={100:{P:8,S:6.7864,rtt:177.060},80:{P:6.4,S:5.6323,rtt:156.844},50:{P:4,S:3.7232,rtt:122.775}};
 for(const [oc,e] of Object.entries(expected)){const g={...defaultGroup(),count:4,capacity:8,stops:22,travel:63,speed:1.75,cabinOccupancy:Number(oc)};
  const r=destinationEstimateIsoForNbr(g,0);
  assert.ok(Math.abs(r.passengers-e.P)<1e-9,`P em ${oc}%`);
  assert.ok(Math.abs(r.conventional.S-21*(1-Math.pow(20/21,e.P)))<1e-9);
  assert.ok(Math.abs(r.conventional.S-e.S)<5e-5,`S em ${oc}%: ${r.conventional.S}`);
  assert.ok(Math.abs(r.conventional.rtt-e.rtt)<5e-4,`TIV em ${oc}%: ${r.conventional.rtt}`);
  assert.ok(Math.abs(r.destination.capacity-300*e.P*4/r.destination.rtt)<1e-9);
  assert.ok(Math.abs(r.destination.interval-r.destination.rtt/4)<1e-9);
  assert.ok(r.destination.rtt<r.conventional.rtt&&r.destination.S<r.conventional.S);
  assert.equal(r.basis.defaultsUsed,true);assert.equal(r.basis.startDelay,.6);assert.equal(r.basis.closingDelay,2);}
});

test('Comparativo ADS: paradas convencionais NBR com a lotação nominal; ADS pela ISO com o FC da ISO (contando o acesso)',()=>{
 const s=normalizeStudy(defaultStudy());s.groups=[{...defaultGroup(),count:4,capacity:8,stops:22,travel:63,speed:1.75,cabinOccupancy:50}];s.destination={enabled:true,sectors:0};
 const p=probableStopsRange(s).rows[0],full=probableStopsRange({...s,groups:[{...s.groups[0],cabinOccupancy:100}]}).rows[0];
 assert.equal(p.conventional,full.conventional,'paradas convencionais mudaram com a ocupação');
 assert.ok(p.ads<full.ads,'paradas do ADS não reagiram à ocupação');
 const ns=21/p.sectors;assert.ok(Math.abs(p.ads-(ns*(1-Math.pow(1-1/ns,4))+1))<1e-9);
});
