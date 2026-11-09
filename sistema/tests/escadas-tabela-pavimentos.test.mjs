import test from 'node:test';
import assert from 'node:assert/strict';
import {defaultStudy,recalculatePopulationAndStudies} from '../public/engine.js';
import {normalizeStudy} from '../public/state.js';
import {selectEscalatorFloor,transportOptions} from '../public/transport-config.js';
import {remodelEscalators} from '../public/escalator-editor.js';

function withEscalators(){
  let s=normalizeStudy(defaultStudy());
  s.transportEquipment={...transportOptions(s),rolling:true,escalators:true,walkways:true};
  s.populationCalc.escalators.enabled=true;
  s=selectEscalatorFloor(s,s.floorTable.rows.length-1,true);
  s=remodelEscalators(s,{all:true});
  return s;
}

test('escadas (editor v2): trechos andar a andar pela tabela de pavimentos calculam mesmo sem composição em todo andar',()=>{
  const s=withEscalators();
  const floors=s.floorTable.rows.length,compositions=new Set(s.populationCalc.rows.map(r=>r.servedFloorMark)).size;
  assert.ok(compositions<floors,'o exemplo tem andares sem composição (cenário do defeito)');
  assert.equal(s.populationCalc.escalators.graphVersion,2);
  assert.ok(s.populationCalc.escalators.links.length>=floors-2);
  const r=recalculatePopulationAndStudies(s);
  assert.ok(r.results,'cálculo concluído com a rede de escadas');
});

test('escadas (editor v1) continuam restritas a andares com composição',async()=>{
  const {validateEscalators}=await import('../public/escalators.js');
  const errors=validateEscalators({enabled:true,graphVersion:1,periodMinutes:5,demandPercent:100,utilizationPercent:100,capacityBasis:'manufacturer',capacityConfirmed:true,allowedFloors:[1],links:[{from:0,floor:1,served:true,rise:4,banks:[{count:1,capacity:1000}]},{from:1,floor:2,served:true,rise:4,banks:[{count:1,capacity:1000}]}]},0);
  assert.ok(errors.some(e=>/composição cadastrada/.test(e)));
});
