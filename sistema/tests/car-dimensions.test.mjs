import test from 'node:test';
import assert from 'node:assert/strict';
import {defaultStudy} from '../public/engine.js';
import {normalizeFloorTable} from '../public/building-floors.js';
import {fleetCars} from '../public/fleet.js';
import {setCarSiteDimension,copyCarSiteDimensions,carSiteDimensionValues,siteDimensionsForm} from '../public/dimensions.js';

function fleetStudy(){
  const s=defaultStudy();
  normalizeFloorTable(s);
  s.floorTable.enabled=true;
  s.supplyCondition={version:1,type:'retrofit'};
  s.groups[0].count=2;
  return s;
}

test('cada elevador guarda suas próprias medidas do levantamento',()=>{
  const s=fleetStudy();
  const out=setCarSiteDimension(s,0,1,'cabinHeight',2300);
  assert.equal(carSiteDimensionValues(out.groups[0],1).cabinHeight,2300);
  assert.equal(carSiteDimensionValues(out.groups[0],0).cabinHeight,null);
});

test('o elevador 1 espelha o grupo, que é a referência do cálculo',()=>{
  const s=fleetStudy();
  const out=setCarSiteDimension(s,0,0,'shaftWidth',2000);
  assert.equal(out.groups[0].siteDimensions.shaftWidth,2000);
});

test('copiar coluna do elevador N para os demais',()=>{
  let s=fleetStudy();
  s=setCarSiteDimension(s,0,1,'shaftWidth',2100);
  s=setCarSiteDimension(s,0,1,'doorType','lateral');
  const out=copyCarSiteDimensions(s,0,1);
  assert.equal(carSiteDimensionValues(out.groups[0],0).shaftWidth,2100);
  assert.equal(carSiteDimensionValues(out.groups[0],0).doorType,'lateral');
  assert.equal(carSiteDimensionValues(out.groups[0],1).shaftWidth,2100);
});

test('elevador inexistente gera erro claro',()=>{
  assert.throws(()=>copyCarSiteDimensions(fleetStudy(),0,9),/não encontrado/);
  assert.throws(()=>setCarSiteDimension(fleetStudy(),0,5,'shaftWidth',1),/não encontrado/);
});

test('o formulário mostra uma coluna por elevador e não mostra a unidade vinculada',()=>{
  const s=fleetStudy();
  assert.equal(fleetCars(s,s.groups[0]).length,2);
  const html=siteDimensionsForm(s,{field:()=>'',select:()=>'',check:()=>''});
  assert.match(html,/car-dimension-table/);
  assert.match(html,/dim-copy-car/);
  assert.doesNotMatch(html,/Unidade vinculada ao levantamento/);
});

import {resizeFleet,changeCar} from '../public/fleet.js';
import {validateCarSiteDimensions} from '../public/dimensions.js';
import {copySiteDimensions} from '../public/silsec-dimensions.js';

function fleet3(){
  let s=fleetStudy();
  s.groups[0].count=3;
  s.groups[0].width=800;
  s=resizeFleet(s,0,3);
  return s;
}

test('correção 1: abertura mostra a largura real do elevador quando o levantamento está vazio',()=>{
  const s=fleet3();
  const v=carSiteDimensionValues(s.groups[0],1,s);
  assert.equal(v.doorWidth,800);
});

test('correção 2: copiar coluna não apaga valores com campo vazio e preserva 800/800/800',()=>{
  let s=fleet3();
  s=setCarSiteDimension(s,0,0,'shaftWidth',2400);
  const out=copyCarSiteDimensions(s,0,0);
  const widths=[0,1,2].map(j=>carSiteDimensionValues(out.groups[0],j,out).doorWidth);
  assert.deepEqual(widths,[800,800,800]);
  assert.equal(carSiteDimensionValues(out.groups[0],2,out).shaftWidth,2400);
});

test('correção 4: medida fora da faixa nos elevadores 2+ é rejeitada na validação',()=>{
  let s=fleet3();
  s.groups[0].dimensionCars=[undefined,{siteDimensions:{shaftWidth:-50}}];
  const errors=validateCarSiteDimensions(s.groups[0],0);
  assert.equal(errors.length,1);
  assert.match(errors[0],/elevador 2/);
});

test('correção 7: copiar dimensões entre grupos leva as colunas de todos os elevadores',()=>{
  let s=fleet3();
  s.groups[1].count=3;
  s=setCarSiteDimension(s,0,1,'cabinHeight',2250);
  const out=copySiteDimensions(s,0,[1]);
  assert.equal(carSiteDimensionValues(out.groups[1],1,out).cabinHeight,2250);
});

test('correção 8: estudo legado vinculado ao elevador 2 não grava a porta do elevador 1 no grupo',()=>{
  let s=fleet3();
  const carId=s.groups[0].id+'-car-2';
  s.groups[0].siteDimensions={...s.groups[0].siteDimensions,carId,doorWidth:900};
  const out=setCarSiteDimension(s,0,0,'doorWidth',750);
  assert.equal(out.groups[0].siteDimensions.doorWidth,900);
  assert.equal(out.groups[0].cars[0].width,750);
});

test('melhoria: reduzir a quantidade de elevadores descarta as medidas das unidades removidas',()=>{
  let s=fleet3();
  s=setCarSiteDimension(s,0,2,'cabinHeight',2100);
  s=resizeFleet(s,0,2);
  s=resizeFleet(s,0,3);
  assert.equal(s.groups[0].dimensionCars?.[2]?.siteDimensions?.cabinHeight,undefined);
});

test('tela: medida fora da faixa é recusada na digitação',()=>{
  const s=fleet3();
  assert.throws(()=>setCarSiteDimension(s,0,1,'shaftWidth',-50),/entre 0 e 50000/);
  assert.throws(()=>setCarSiteDimension(s,0,1,'doorWidth',200),/entre 300 e 4000/);
  assert.throws(()=>setCarSiteDimension(s,0,1,'doorCount',9),/1 a 4/);
  const ok=setCarSiteDimension(s,0,1,'shaftWidth',2000);
  assert.equal(carSiteDimensionValues(ok.groups[0],1).shaftWidth,2000);
  const apagado=setCarSiteDimension(ok,0,1,'shaftWidth',null);
  assert.equal(apagado.groups[0].dimensionCars[1].siteDimensions.shaftWidth,null);
});
