import test from 'node:test';
import assert from 'node:assert/strict';
import {motionProfile,motionAt,calculateGroupTravel} from '../public/travel-curves.js';
import {travelGroupPanels,travelCurvesSection} from '../public/travel-curves-view.js';
import {defaultStudy,defaultGroup,calculateGroup,recalculatePopulationAndStudies,populationComponent} from '../public/engine.js';
import {appendFloorComposition} from '../public/floors.js';
import {normalizeStudy} from '../public/state.js';
import {switchTrafficModel} from '../public/models.js';
import {meanFlight} from '../public/starts.js';
const near=(actual,expected,tolerance=1e-8)=>assert.ok(Math.abs(actual-expected)<=tolerance*Math.max(1,Math.abs(expected)),`${actual} ≠ ${expected}`);

test('curvas: trajetória analítica conhecida conserva distância, velocidade e tempos',()=>{
 const p=motionProfile(10,1,1,1);near(p.time,12);near(p.peakSpeed,1);near(p.accelerationDuration,2);near(p.cruiseDuration,8);
 const one=motionAt(p,1);near(one.distance,1/6);near(one.speed,.5);near(one.acceleration,1);
 const two=motionAt(p,2);near(two.distance,1);near(two.speed,1);near(two.acceleration,0);
 near(motionAt(p,6).distance,5);near(motionAt(p,12).distance,10);near(motionAt(p,12).speed,0);
});
test('curvas: os três regimes e velocidade nominal baixa são contínuos e simétricos',()=>{
 for(const [d,v,a,j] of [[.25,4,1,1],[3,4,1,1],[50,4,1,1],[10,.15,1,1],[.1,15,.8,1.2],[30,1.25,.8,1.2]]){
  const p=motionProfile(d,v,a,j),f=meanFlight(d,v,a,j);near(p.time,f.time);near(p.phases.at(-1).end.distance,d);near(p.phases.at(-1).end.speed,0);near(p.phases.at(-1).end.acceleration,0);
  for(let i=0;i<=80;i++){const t=p.time*i/80,q=motionAt(p,t),reverse=motionAt(p,p.time-t);assert.ok(q.speed>=-1e-8&&q.speed<=v+1e-8);assert.ok(Math.abs(q.acceleration)<=a+1e-8);near(q.distance+reverse.distance,d);near(q.speed,reverse.speed);if(i>0)assert.ok(q.distance+1e-8>=motionAt(p,t-p.time/80).distance);}
  for(let i=1;i<p.phases.length;i++)assert.deepEqual(p.phases[i].start,p.phases[i-1].end);
 }
 const short=motionProfile(.25,4,1,1);near(short.time,2);near(short.peakSpeed,.25);assert.equal(short.reachesNominal,false);
});
test('curvas: integração numérica independente confere a área sob a velocidade',()=>{
 for(const d of [.1,2,4,30,200]){const p=motionProfile(d,3,.8,1),dt=p.time/20000;let integral=0;for(let i=1;i<=20000;i++)integral+=(motionAt(p,(i-1)*dt).speed+motionAt(p,i*dt).speed)*dt/2;near(integral,d,1e-7);}
});
test('curvas NBR: dois percursos, portas, transferência, adicional e PPH limitado',()=>{
 const g={...defaultGroup(),stops:2,travel:10,speed:1,acceleration:1,jerk:1,open:1,close:1,capacity:10,passenger:1,start:2,startsLimit:100},c=calculateGroupTravel(g,{probableStops:2});
 near(c.extremes.motion.time,12);near(c.extremes.withDoors,14);near(c.extremes.transferTime,10);near(c.extremes.allowance,1.2);near(c.extremes.startDelay,1);near(c.extremes.total,26.2);near(c.extremes.maximumByTime,3600/26.2);near(c.extremes.maximumAdopted,100);near(c.consecutive.total,c.extremes.total);
 const longer=calculateGroupTravel({...g,stops:11,travel:30},{probableStops:6,dwell:4});near(longer.consecutive.distance,3);near(longer.extremes.distance,30);assert.ok(longer.extremes.total>longer.consecutive.total);near(longer.consecutive.startDelay,1/3);near(longer.consecutive.dwell,4);
});
test('curvas ISO: FC e transferência por sentido sem adicional NBR, com pré-abertura sobreposta',()=>{
 const g={...defaultGroup(),stops:2,travel:10,speed:1,acceleration:1,jerk:1,open:1,close:1,passenger:1,iso:{source:'manufacturer',startDelay:.6,closingDelay:2,preOpening:.5}};
 const c=calculateGroupTravel(g,{model:'iso8100',passengers:8});near(c.consecutive.transferTime,16);near(c.consecutive.allowance,0);near(c.consecutive.performance,16.1);near(c.consecutive.total,32.1);near(c.consecutive.openingStart,c.consecutive.movementEnd-.5);assert.equal(c.inputs.transferDirections,2);
 const unavailable=calculateGroupTravel({...g,iso:{...g.iso,preOpening:2}},{model:'iso8100',passengers:8});assert.equal(unavailable.consecutive.available,false);assert.match(unavailable.consecutive.error,/pré-abertura/);
});
test('curvas: anexar painéis conserva os ciclos anteriores e mantém grupos isolados',()=>{
 const s=defaultStudy(),r=recalculatePopulationAndStudies(s).results;
 for(const [i,g] of s.groups.entries()){const original=calculateGroup(g,s.method);assert.deepEqual(r.groups[i].normative,original.normative);assert.deepEqual(r.groups[i].manufacturer,original.manufacturer);near(r.groups[i].travelCurves.extremes.distance,g.travel);}
 const time=r.groups[1].travelCurves.consecutive.total;s.groups[0].travel=60;const updated=recalculatePopulationAndStudies(s).results;near(updated.groups[1].travelCurves.consecutive.total,time);assert.ok(updated.groups[0].travelCurves.extremes.total>r.groups[0].travelCurves.extremes.total);
});
test('curvas ISO: origem efetiva da tabela ou fabricante acompanha o modelo e o JSON',()=>{
 const s=switchTrafficModel(defaultStudy(),'iso8100'),r=recalculatePopulationAndStudies(s).results;
 for(const g of r.groups){const c=g.travelCurves;assert.equal(c.model,'iso8100');near(c.inputs.acceleration,g.iso.used.acceleration);near(c.inputs.open,g.iso.used.open);near(c.inputs.passengers,g.iso.PC);near(c.consecutive.performance,g.iso.tperf);near(c.consecutive.motion.time,g.iso.flight.time);}
 const restored=JSON.parse(JSON.stringify(r));assert.deepEqual(restored.groups[0].travelCurves,r.groups[0].travelCurves);
 s.groups[0].iso.source='manufacturer';s.groups[0].open=2.2;const revised=recalculatePopulationAndStudies(s).results;near(revised.groups[0].travelCurves.inputs.open,2.2);assert.match(revised.groups[0].travelCurves.base,/Fabricante/);
});
test('curvas: até vinte grupos aparecem no relatório sem números inválidos',()=>{
 const s=defaultStudy();s.groups=Array.from({length:20},(_,i)=>({...defaultGroup(),id:'g'+i,label:'Grupo '+(i+1),speed:.15+i/10}));const r=recalculatePopulationAndStudies(s).results,html=travelCurvesSection(s,r,{print:true});assert.equal((html.match(/class="travel-line"/g)||[]).length,60);assert.match(html,/Grupo 20/);assert.doesNotMatch(html,/NaN|Infinity|#VALOR/);
 const escaped=travelGroupPanels(r.groups[0].travelCurves,'<script>');assert.doesNotMatch(escaped,/<script>/);assert.match(escaped,/&lt;script&gt;/);assert.equal(travelCurvesSection(s,{groups:[{}]}),'');assert.match(travelGroupPanels(null),/histórica/);
});
test('curvas: todos os grupos de estudos separados seguem o motor do respectivo estudo',()=>{
 for(const model of ['nbr5665','iso8100']){let s=normalizeStudy(defaultStudy());const component={...populationComponent(s.use,'restaurant'),mode:'external',amount:150,groups:[defaultGroup(),defaultGroup(1)]};s.populationCalc=appendFloorComposition(s.populationCalc,component);if(model==='iso8100')s=switchTrafficModel(s,model);const r=recalculatePopulationAndStudies(s).results,item=r.auxiliary[0];assert.equal(item.results.groups.length,2);for(const g of item.results.groups){assert.equal(g.travelCurves.model,model);assert.ok(g.travelCurves.extremes.available);assert.ok(g.travelCurves.consecutive.available);}const html=travelCurvesSection(item.study,item.results,{print:true});assert.equal((html.match(/class="travel-line"/g)||[]).length,6);}
});
test('curvas: entradas incompletas não produzem gráficos com dados fictícios',()=>{
 for(const [key,value] of [['speed',NaN],['acceleration',0],['jerk',-1],['stops',1],['travel',0],['open',NaN]])assert.throws(()=>calculateGroupTravel({...defaultGroup(),[key]:value}),/positivos/);
 assert.throws(()=>motionProfile(1,Infinity,1,1),/finitos/);
});
