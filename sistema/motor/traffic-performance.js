// TES · motor de cálculo: parte de cálculo de traffic-performance.js (a parte de tela ficou em public/traffic-performance.js).
import {nominalCapacity} from './cabin-occupancy.js';
import {simulateUpPeak,simulateTraffic} from './traffic-simulation.js';
import {DOORS,trafficRate,calculateGroup} from './engine.js';
import {floorGeometry} from './building-floors.js';
import {accessRowIndex} from './building-access.js';
export const f=(v,d=1)=>Number.isFinite(v)?new Intl.NumberFormat('pt-BR',{minimumFractionDigits:0,maximumFractionDigits:Math.min(d,3)}).format(v):'—';
export const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const nbrTiming=(result,g,study)=>{if(study?.trafficModel==='iso8100')return {};let c=(result?.groups||[]).find(x=>x.id===g.id)?.normative;if(!(c?.total>0)){try{c=calculateGroup(g,study?.method||'excel-v3').normative;}catch{c=null;}}return c&&c.total>0&&Number.isFinite(c.door)&&Number.isFinite(c.passenger)&&Number.isFinite(c.acceleration)?{cruise:true,stopTime:1.1*c.door+c.acceleration/2,passenger:1.1*c.passenger,hold:c.total/Math.max(1,Number(g.count)||1),groupKey:g.id,cycle:c,group:g}:{};};
export function legacyInputs(study,result){
 const groups=study.groups||[];
 const n=Math.max(2,...groups.map(g=>Math.round(Number(g.stops))||2));
 const travel=Math.max(0,...groups.map(g=>Number(g.travel)||0));
 const step=n>1?travel/(n-1):0;
 const floors=Array.from({length:n},(_,i)=>({height:i*step,mark:String(i)}));
 const total=Number(result?.population?.calculated??study.population)||0;
 const populations=floors.map((_,i)=>i===0?0:total/(n-1));
 const cars=[];
 groups.forEach((g,gi)=>{
  const count=Math.max(1,Number(g.count)||1);
  const stops=Math.min(n,Math.round(Number(g.stops))||n);
  const served=new Set(Array.from({length:stops},(_,i)=>i));
  const doorTime=DOORS[g.door]?.time??3.9;
  for(let k=0;k<count;k++)cars.push({id:`${gi}-${k}`,capacity:nominalCapacity(g),speed:g.speed,acceleration:g.acceleration,jerk:g.jerk,open:g.open??doorTime/2,close:g.close??doorTime/2,passenger:g.passenger??2.4,served,maxPph:g.startsLimit>0?g.startsLimit:null,...nbrTiming(result,g,study)});
 });
 if(!cars.length)return {error:'Não há elevadores para simular.'};
 return {floors,cars,accessIndex:0,populations,rate:result?.rate??trafficRate(study)};
}
export function performanceInputs(study,result){
 study=result?.calculationStudy||study;
 if(!study.floorTable?.enabled)return legacyInputs(study,result);
 const rows=floorGeometry(study);
 const accessIndex=accessRowIndex(study.floorTable);
 if(accessIndex<0)return {error:'Marque o pavimento de acesso principal.'};
 const floors=rows.map(r=>({height:r.elevation,mark:r.mark}));
 const indexByMark=new Map(rows.map((r,i)=>[String(r.mark),i]));
 const populations=rows.map(()=>0);
 for(const line of result.population?.lines||[]){const i=indexByMark.get(String(line.servedFloorMark??line.floorMark));if(i!==undefined)populations[i]+=Number(line.net)||0;}
 const cars=[];
 (study.groups||[]).forEach((g,gi)=>{
  const served=new Set(rows.map((r,i)=>r.served?.[g.id]?i:-1).filter(i=>i>=0));
  const n=Math.max(1,Number(g.count)||1);
  for(let k=0;k<n;k++)cars.push({id:`${g.id}-${k}`,label:`${g.label||'Grupo '+(gi+1)} · elevador ${k+1}`,capacity:nominalCapacity(g),speed:g.speed,acceleration:g.acceleration,jerk:g.jerk,open:g.open,close:g.close,passenger:g.passenger,served,maxPph:g.startsLimit>0?g.startsLimit:null,...nbrTiming(result,g,study)});
 });
 if(!cars.length)return {error:'Não há elevadores para simular.'};
 return {floors,cars,accessIndex,populations,rate:result.rate??0};
}
export function performanceSummary(study,result){
 const inputs=performanceInputs(study,result);
 if(inputs.error)return {error:inputs.error};
 const sim=simulateUpPeak(inputs);
 return {sim,waiting:sim.waiting,travel:sim.travel,passengers:sim.passengers,rate:inputs.rate};
}
export function performanceMeasures(study,result){
 const inputs=performanceInputs(study,result);
 if(inputs.error)return {error:inputs.error};
 const up=simulateTraffic({...inputs,mode:'up'});
 const updown=simulateTraffic({...inputs,mode:'updown',downShare:.5});
 return {up:{tme:up.waiting.avg,tmd:up.travel.avg,passengers:up.passengers},updown:{tme:updown.waiting.avg,tmd:updown.travel.avg,passengers:updown.passengers}};
}
