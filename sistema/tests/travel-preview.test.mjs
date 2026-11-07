import test from 'node:test';
import assert from 'node:assert/strict';
import {defaultStudy,recalculatePopulationAndStudies} from '../public/engine.js';
import {normalizeStudy} from '../public/state.js';
import {changeCar} from '../public/fleet.js';
import {switchTrafficModel} from '../public/models.js';
import {calculateTravelPreview} from '../public/travel-preview.js';

for(const model of ['nbr5665','iso8100']){
 test(`prévia ${model}: velocidade por unidade, tempos e curvas coincidem com o cálculo completo`,()=>{
  let study=normalizeStudy(defaultStudy());
  if(model==='iso8100')study=switchTrafficModel(study,model);
  study=changeCar(study,1,0,'speed',.5);
  study=changeCar(study,1,1,'speed',2.5);
  const before=structuredClone(study),preview=calculateTravelPreview(study,1);
  assert.deepEqual(preview.map(p=>p.curves.inputs.speed),[.5,2.5]);
  assert.deepEqual(preview.map(p=>p.group.carNumbers),[[1],[2]]);
  assert.ok(preview[0].curves.extremes.motion.time>preview[1].curves.extremes.motion.time);
  assert.equal(preview[1].curves.consecutive.motion.reachesNominal,false);
  assert.ok(preview[1].curves.consecutive.motion.peakSpeed<2.5);
  const calculated=recalculatePopulationAndStudies(study).results.groups;
  for(const p of preview)assert.deepEqual(p.curves,calculated.find(g=>g.id===p.group.id).travelCurves);
  assert.deepEqual(study,before,'a prévia não modifica nem migra dados do estudo');
 });
 test(`prévia ${model}: valor apagado não reutiliza velocidade antiga nem apaga outra unidade válida`,()=>{
  let study=normalizeStudy(defaultStudy());
  if(model==='iso8100')study=switchTrafficModel(study,model);
  study=changeCar(study,1,0,'speed',null);
  study=changeCar(study,1,1,'speed',1.5);
  const preview=calculateTravelPreview(study,1);
  assert.ok(preview[0].error);
  assert.equal(preview[0].curves,undefined);
  assert.equal(preview[1].curves.inputs.speed,1.5);
 });
}

test('prévia: percurso e paradas acompanham os andares da unidade, sem usar o total do grupo',()=>{
 let study=normalizeStudy(defaultStudy());
 study=changeCar(study,1,0,'speed',1.33);
 const floor=study.floorTable.rows.at(-1);
 study=changeCar(study,1,0,'servedFloorId',{id:floor.id,checked:false});
 const preview=calculateTravelPreview(study,1);
 assert.equal(preview[0].curves.inputs.stops,10);
 assert.equal(preview[1].curves.inputs.stops,11);
 assert.equal(preview[0].curves.inputs.travel,preview[1].curves.inputs.travel-floor.height);
});

test('prévia: unidades idênticas compartilham curva identificada; outro grupo incompleto não bloqueia',()=>{
 let study=normalizeStudy(defaultStudy());
 study=changeCar(study,1,0,'speed',1.5);
 study=changeCar(study,1,1,'speed',1.5);
 study.groups[0].cars=[];
 const preview=calculateTravelPreview(study,1);
 assert.equal(preview.length,1);
 assert.deepEqual(preview[0].group.carNumbers,[1,2]);
 assert.equal(preview[0].curves.inputs.speed,1.5);
});
