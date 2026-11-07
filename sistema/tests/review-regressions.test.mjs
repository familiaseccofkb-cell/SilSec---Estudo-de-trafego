import test from 'node:test';
import assert from 'node:assert/strict';
import {defaultStudy,recalculatePopulationAndStudies,validateStudy} from '../public/engine.js';
import {normalizeStudy} from '../public/state.js';
import {syncDimensionalDoor,copySiteDimensions} from '../public/silsec-dimensions.js';
import {fleetCars} from '../public/fleet.js';
import {doorTotal,carTimingTable} from '../public/car-controls.js';

test('revisão: editar largura dimensional em estudo legado mantém cálculo e população disponíveis',()=>{
 const s=normalizeStudy(defaultStudy()),before=recalculatePopulationAndStudies(s);
 assert.equal(s.floorTable.enabled,false);
 s.groups[0].siteDimensions={doorWidth:900};
 syncDimensionalDoor(s,0,true);
 assert.equal(s.floorTable.enabled,true);
 assert.equal(s.groups[0].cars[0].width,900);
 assert.deepEqual(validateStudy(s),[]);
 const after=recalculatePopulationAndStudies(s);
 assert.equal(after.study.population,before.study.population);
 assert.equal(after.results.required,before.results.required);
});

test('revisão: cópia dimensional ativa atendimento consistente e preserva a origem',()=>{
 const s=normalizeStudy(defaultStudy());s.groups[0].siteDimensions={doorWidth:900};
 const before=structuredClone(s),copied=copySiteDimensions(s,0,[1]);
 assert.deepEqual(s,before);
 assert.equal(copied.groups[1].cars[0].width,900);
 assert.deepEqual(validateStudy(copied),[]);
 assert.doesNotThrow(()=>recalculatePopulationAndStudies(copied));
});

test('revisão: vínculo dimensional altera somente a unidade escolhida',()=>{
 const s=normalizeStudy(defaultStudy()),g=s.groups[1],cars=fleetCars(s,g);
 g.siteDimensions={carId:cars[1].id,doorWidth:1100};
 syncDimensionalDoor(s,1,true);
 assert.equal(g.cars[0].width,cars[0].width);
 assert.equal(g.cars[1].width,1100);
 assert.equal(g.siteDimensions.carId,cars[1].id);
 assert.deepEqual(validateStudy(s),[]);
});

test('revisão: soma visual de portas fica pendente quando um tempo não foi informado',()=>{
 for(const [open,close] of [[null,2.5],[2.5,null],[null,null],[undefined,2.5]])assert.equal(doorTotal({open,close}),null);
 assert.equal(doorTotal({open:2.4,close:2.1}),4.5);
 const s=normalizeStudy(defaultStudy());s.groups[0].open=null;
 const html=carTimingTable(s,0,{esc:String,f:x=>Number.isFinite(x)?String(x):'—'});
 assert.match(html,/id="car-0-0-door-total">— \/ 5.5 s/);
});
