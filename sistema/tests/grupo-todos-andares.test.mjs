import test from 'node:test';
import assert from 'node:assert/strict';
import {defaultStudy} from '../public/engine.js';
import {applyGroupToAllFloors,floorGeometry,normalizeFloorTable} from '../public/building-floors.js';

test('aplicar a todos: o grupo passa a atender todos os andares e os demais grupos não mudam',()=>{
  const s=defaultStudy();
  normalizeFloorTable(s);
  s.floorTable.enabled=true;
  const [g1,g2]=s.groups;
  assert.ok(g2,'estudo de exemplo precisa de dois grupos');
  const before=floorGeometry(s).map(r=>({...r.served}));
  const out=applyGroupToAllFloors(s,g1.id);
  const geo=floorGeometry(out);
  assert.ok(geo.length>=2);
  assert.ok(geo.every(r=>r.served[g1.id]===true),'todos os andares devem ser atendidos pelo grupo');
  geo.forEach((r,i)=>assert.equal(!!r.served[g2.id],!!before[i][g2.id],'outro grupo mudou'));
});

test('aplicar a todos: grupo inexistente gera erro claro',()=>{
  const s=defaultStudy();
  normalizeFloorTable(s);
  s.floorTable.enabled=true;
  assert.throws(()=>applyGroupToAllFloors(s,'nao-existe'),/Grupo não encontrado/);
});
