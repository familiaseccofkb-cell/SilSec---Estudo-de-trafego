import {effectiveCapacity,nominalCapacity} from "./cabin-occupancy.js";
// V0031 · tabela de performance de tráfego (tempos de espera no pavimento principal e de chegada ao destino) com a porcentagem atendida em cada limite.
// tempo de espera no pavimento principal e tempo até o andar de destino, com a porcentagem atendida em cada limite.
import {simulateUpPeak,simulateTraffic} from './traffic-simulation.js';
import {DOORS,trafficRate,calculateGroup} from './engine.js';
import {floorGeometry} from './building-floors.js';
import {accessRowIndex} from './building-access.js';

const f=(v,d=1)=>Number.isFinite(v)?new Intl.NumberFormat('pt-BR',{minimumFractionDigits:0,maximumFractionDigits:Math.min(d,3)}).format(v):'—';
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

// Dados de entrada da simulação, montados a partir do estudo (grupos e pavimentos) e do resultado (população e taxa).
// Sem matriz de pavimentos: andares pelas paradas e pelo percurso; população distribuída uniformemente acima do acesso.
const nbrTiming=(result,g,study)=>{if(study?.trafficModel==='iso8100')return {};let c=(result?.groups||[]).find(x=>x.id===g.id)?.normative;if(!(c?.total>0)){try{c=calculateGroup(g,study?.method||'excel-v3').normative;}catch{c=null;}}return c&&c.total>0&&Number.isFinite(c.door)&&Number.isFinite(c.passenger)&&Number.isFinite(c.acceleration)?{cruise:true,stopTime:1.1*c.door+c.acceleration/2,passenger:1.1*c.passenger,hold:c.total/Math.max(1,Number(g.count)||1),groupKey:g.id,cycle:c,group:g}:{};};
function legacyInputs(study,result){
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

// Resultado da simulação de eventos com o resumo das duas tabelas da página 10.
export function performanceSummary(study,result){
 const inputs=performanceInputs(study,result);
 if(inputs.error)return {error:inputs.error};
 const sim=simulateUpPeak(inputs);
 return {sim,waiting:sim.waiting,travel:sim.travel,passengers:sim.passengers,rate:inputs.rate};
}

// Tabela no formato da página 10 (uma coluna por sistema).
export function performanceTableHtml(summary,{label='Convencional'}={}){
 if(summary.error)return `<p class="population-warning">${esc(summary.error)}</p>`;
 const w=summary.waiting,t=summary.travel;
 const left=[
  ['Tempo médio de espera no pavimento principal (s)',f(w.avg)],
  ['Tempo mínimo de espera (s)',f(w.min)],
  ['Tempo máximo de espera (s)',f(w.max)],
  ...w.below.map(b=>[`Atendidos em menos de ${b.limit} s (%)`,f(b.pct)]),
 ];
 const right=[
  ['Tempo médio até o andar de destino (s)',f(t.avg)],
  ['Tempo mínimo até o destino (s)',f(t.min)],
  ['Tempo máximo até o destino (s)',f(t.max)],
  ...t.below.map(b=>[`Chegada em menos de ${b.limit} s (%)`,f(b.pct)]),
 ];
 const body=left.map((r,i)=>`<tr><th scope="row">${esc(r[0])}</th><td>${esc(r[1])}</td><th scope="row">${esc(right[i][0])}</th><td>${esc(right[i][1])}</td></tr>`).join('');
 return `<div class="table-wrap performance-table"><table class="group-results"><caption>Desempenho de tráfego · ${esc(label)} · ${f(summary.passengers,0)} passageiros em 60 min</caption><thead><tr><th>Espera no pavimento principal</th><th>${esc(label)}</th><th>Chegada ao andar de destino</th><th>${esc(label)}</th></tr></thead><tbody>${body}</tbody></table></div><p class="small-copy">Simulação de eventos (pico de subida a partir do pavimento principal, 60 min). Passageiros ainda na fila ou a bordo no fim do período entram com o tempo decorrido até então. Pessoas sem embarque até o fim do período: ${esc(String(summary.sim?.unservedAtEnd?.total??'—'))} (subida ${esc(String(summary.sim?.unservedAtEnd?.up??'—'))}, descida ${esc(String(summary.sim?.unservedAtEnd?.down??'—'))}). O limite do fabricante, quando informado, restringe as partidas do acesso.</p>`;
}

// Valores de TME (espera média no pavimento principal) e TMD (tempo médio até o destino) para subida e subida e descida.
export function performanceMeasures(study,result){
 const inputs=performanceInputs(study,result);
 if(inputs.error)return {error:inputs.error};
 const up=simulateTraffic({...inputs,mode:'up'});
 const updown=simulateTraffic({...inputs,mode:'updown',downShare:.5});
 return {up:{tme:up.waiting.avg,tmd:up.travel.avg,passengers:up.passengers},updown:{tme:updown.waiting.avg,tmd:updown.travel.avg,passengers:updown.passengers}};
}
