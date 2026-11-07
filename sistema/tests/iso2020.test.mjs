import test from 'node:test';
import assert from 'node:assert/strict';
import {defaultStudy,defaultGroup,recalculatePopulationAndStudies} from '../public/engine.js';
import {normalizeStudy} from '../public/state.js';
import {switchTrafficModel} from '../public/models.js';
import {calculateIsoGroup} from '../public/iso-engine.js';
import {defaultIsoGroup,isoCriteria,applyIsoEdition} from '../public/iso-data.js';
import {iso2020CarSelection,iso2020Door,iso2020Motion,iso2020ComplexityTriggers,iso2020SpeedRange} from '../public/iso2020.js';
import {simulateUppeak,evaluateSimulation,runIsoSimulation} from '../public/iso-simulation.js';
import {destinationEstimate,destinationEstimateNbr} from '../public/destination-estimate.js';
const close=(x,y,rel=.005)=>assert.ok(Math.abs(x-y)<=Math.abs(y)*rel,`${x} != ${y}`);
const annexD={...defaultGroup(),count:6,capacity:21,stops:14,width:1100,door:'central',iso:{...defaultIsoGroup(),source:'table',edition:'iso2020'}};

test('ISO 2020: método de cálculo reproduz o exemplo do anexo D (zona baixa e zona alta)',()=>{
 const low=calculateIsoGroup({...annexD,travel:52,speed:2.5},{effectivePassengers:13.1,edition:'iso2020'}).iso;
 close(low.S,8.4,.01);close(low.H,12.5,.002);close(low.tv,1.6);close(low.ts,10.5,.005);close(low.total,164.9);close(low.interval,27.5);close(low.capacity,142.9);close(low.capacity/1092,.131,.01);
 const high=calculateIsoGroup({...annexD,travel:104,speed:5,iso:{...annexD.iso,expressFloors:13}},{effectivePassengers:13.1,edition:'iso2020'}).iso;
 close(high.H,25.5,.002);close(high.tv,.8);close(high.ts,11.3,.005);close(high.total,173.2);close(high.interval,28.9);close(high.capacity,136,.006);
 const declared=calculateIsoGroup({...annexD,travel:52,speed:2.5,iso:{...annexD.iso,flightTime:5.1}},{effectivePassengers:13.1,edition:'iso2020'}).iso;close(declared.ts,10.5,.0001);
});
test('ISO 2020: tabelas de porta, movimento, cabina (A.1) e velocidade',()=>{
 assert.deepEqual(iso2020Door(1100,'central'),{open:2,close:2.4,sum:4.4});assert.throws(()=>iso2020Door(800,'central'),/anexo C/);
 assert.deepEqual(iso2020Motion(2.5),{acceleration:1,jerk:1});assert.throws(()=>iso2020Motion(1.75),/fabricante/);
 const c=iso2020CarSelection(13.1);assert.equal(c.byMass,1275);assert.equal(c.byArea,1600);close(c.minArea,13.1*.21/.8);
 const ten=iso2020CarSelection(10);assert.equal(ten.byMass,1000);assert.equal(ten.byArea,1275);
 const v=iso2020SpeedRange('offices',52);close(v.min,52/30);close(v.max,52/20);
});
test('ISO 2020: critérios da tabela 2, população da tabela 4 e Pcalc pela demanda',()=>{
 let s=switchTrafficModel(normalizeStudy(defaultStudy()),'iso8100',{edition:'iso2020'});
 assert.equal(s.isoConfig.edition,'iso2020');assert.deepEqual([isoCriteria(s,4).rate,isoCriteria(s,4).limit],[.12,30]);
 assert.ok(s.populationCalc.rows[0].iso.areaPerPerson>=10&&s.populationCalc.rows[0].iso.areaPerPerson<=12);
 const c=recalculatePopulationAndStudies(s);assert.equal(c.results.edition,'iso2020');
 const U=c.study.population;close(c.results.groups[0].iso.PC,U*.12*30/300,1e-9);assert.ok(c.results.iso2020.car.length>0);
 s=applyIsoEdition(c.study,'n69');assert.equal(s.isoConfig.edition,'n69');
});
test('ISO 2020: gatilhos de complexidade da cláusula 5.3',()=>{
 const s={isoConfig:{controlType:'destination',multipleEntrances:true,uniformModel:true},groups:[{count:5,capacity:16,speed:2,stops:21},{count:5,capacity:16,speed:2,stops:21}],populationCalc:{rows:[]}};
 const t=iso2020ComplexityTriggers(s);assert.ok(t.some(x=>/destino/.test(x)));assert.ok(t.some(x=>/18 andares/.test(x)));assert.ok(t.some(x=>/8 elevadores/.test(x)));assert.ok(t.some(x=>/acesso principal/.test(x)));
});
test('Simulação 8.2–8.4: requisitos e avaliação dos quatro casos',()=>{
 const spec={floors:13,df:4,cars:6,psim:16,speed:2.5,acceleration:1,jerk:1,open:2,close:2.4,transfer:1,population:1092};
 const a=simulateUppeak({...spec,demandPercent:12,seed:7}),b=simulateUppeak({...spec,demandPercent:12,seed:7});assert.deepEqual(a,b);
 assert.ok(a.passengers>0&&a.passengers<a.generated);assert.ok(a.averageLoad<=16);
 const r=runIsoSimulation(spec,{rate:.12,requiredWait:30});assert.deepEqual(r.demands,[12,13,14]);assert.ok(r.results[0].averageWait<r.results[2].averageWait);
 const mk=w=>w.map(x=>({averageWait:x}));
 assert.equal(evaluateSimulation(mk([35,40,50]),30).code,'a');assert.equal(evaluateSimulation(mk([20,37,60]),30).code,'b');assert.equal(evaluateSimulation(mk([10,15,20]),30).code,'c');assert.equal(evaluateSimulation(mk([20,30,40]),30).code,'d');
});
test('Antecipação de destino: estimativa reduz paradas e ciclo nos dois métodos',()=>{
 const d=destinationEstimate({floors:13,passengers:13.1,tv:1.6,ts:10.5,transferRound:26.2,cars:6});close(d.conventional.rtt,2*12.5*1.6+(8.444+1)*10.5+26.2,.01);assert.ok(d.gain>1);assert.ok(d.destination.S<d.conventional.S);
 const g={...defaultGroup(),count:3,capacity:13,stops:12};const cyc={t1:40,t2:20,t3:40,t4:31,additional:7.1,total:138.1,acceleration:4,door:4.5,start:0,transferMode:'per-person',capacity:85,interval:46};
 const n=destinationEstimateNbr(g,cyc);assert.ok(n.gain>1);assert.ok(n.destination.stops<n.conventional.stops);
 let s=normalizeStudy(defaultStudy());s.destination={enabled:true,sectors:0};const c=recalculatePopulationAndStudies(s);assert.ok(c.results.destination?.rows?.length>0||c.results.groups);
});
