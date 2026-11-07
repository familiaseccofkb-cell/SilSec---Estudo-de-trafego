import test from 'node:test';
import assert from 'node:assert/strict';
import {calculatePopulation,defaultPopulationCalc,setRowSkipPopulation} from '../public/population.js';

test('pavimento marcado para não calcular população não soma nada e remove a coleta',()=>{
  const pc=defaultPopulationCalc('offices');
  pc.rows[0]={...pc.rows[0],amount:300,declaredPopulation:5,discount:'adjacent50',distance:3,conditionsConfirmed:true};
  const base=calculatePopulation('offices',pc.rows,{accessFloor:0});
  assert.ok(base.value>0);
  const skipped=setRowSkipPopulation(pc,0,true,'offices');
  const row=skipped.rows[0];
  assert.equal(row.amount,0);assert.equal(row.declaredPopulation,0);assert.equal(row.discount,'none');
  assert.equal(row.skipPopulation,true);
  assert.equal(row.label,pc.rows[0].label);assert.equal(row.servedFloorMark,pc.rows[0].servedFloorMark);
  const out=calculatePopulation('offices',skipped.rows,{accessFloor:0});
  assert.equal(out.value,0);assert.equal(out.lines[0].net,0);
  assert.match(out.lines[0].exclusionNotice,/sem cálculo de população/);
});

test('desmarcar restaura o pavimento como composição normal',()=>{
  const pc=setRowSkipPopulation(defaultPopulationCalc('offices'),0,true,'offices');
  const back=setRowSkipPopulation(pc,0,false,'offices');
  assert.equal(back.rows[0].skipPopulation,false);
  assert.equal(back.rows[0].kind,'office');
});

test('marcação não afeta os demais pavimentos',()=>{
  const pc=defaultPopulationCalc('offices');
  pc.rows.push({...pc.rows[0],label:'Composição 2',floor:2,floorMark:'2',servedFloorMark:'2',amount:200});
  const out=calculatePopulation('offices',setRowSkipPopulation(pc,0,true,'offices').rows,{accessFloor:0});
  assert.equal(out.lines[1].net>0,true);
});

import {discountAllowed} from '../public/population.js';

test('desconto de 50% só vale no pavimento imediatamente acima ou abaixo com até 5 m',()=>{
  assert.equal(discountAllowed({floor:1,distance:3},0),true);
  assert.equal(discountAllowed({floor:-1,distance:5},0),true);
  assert.equal(discountAllowed({floor:2,distance:3},0),false);
  assert.equal(discountAllowed({floor:1,distance:6},0),false);
});

test('desconto gravado fora da regra continua bloqueado no cálculo',()=>{
  const pc=defaultPopulationCalc('offices');
  pc.rows[0]={...pc.rows[0],floor:3,servedFloorMark:'3',amount:300,discount:'adjacent50',distance:3,conditionsConfirmed:true};
  assert.throws(()=>calculatePopulation('offices',pc.rows,{accessFloor:0}),/50%/);
});

test('correção 6: desmarcar "não calcular" restaura os valores anteriores do pavimento',()=>{
  const pc=defaultPopulationCalc('offices');
  pc.rows[0]={...pc.rows[0],amount:2779,declaredPopulation:12};
  const skipped=setRowSkipPopulation(pc,0,true,'offices');
  assert.equal(skipped.rows[0].amount,0);
  const back=setRowSkipPopulation(skipped,0,false,'offices');
  assert.equal(back.rows[0].amount,2779);
  assert.equal(back.rows[0].declaredPopulation,12);
  assert.equal(back.rows[0].skippedBackup,undefined);
});
