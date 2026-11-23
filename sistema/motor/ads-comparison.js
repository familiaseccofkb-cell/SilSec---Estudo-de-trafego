// Motor de cálculo: parte de cálculo de ads-comparison.js (a parte de tela ficou em www/ads-comparison.js).
import {loadForDemand} from './destination-estimate.js';
import {simulateTraffic,WAIT_LIMITS,TRAVEL_LIMITS} from './traffic-simulation.js';
import {performanceInputs} from './traffic-performance.js';
import {autoSectors} from './destination-estimate.js';
import {destinationEstimateIsoForNbr,isoLoadForDemand,isoAdsPassengers} from './destination-iso.js';
import {effectiveCapacity,nominalCapacity} from './cabin-occupancy.js';
export const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const f=(v,d=1)=>Number.isFinite(v)?new Intl.NumberFormat('pt-BR',{minimumFractionDigits:d,maximumFractionDigits:d}).format(v):'—';
export const stopsIso=(n,p)=>n<=1?1:n*(1-Math.pow(1-1/n,p));
export const stopsNbr=(total,p)=>total<=2?total:total-(total-1)*Math.pow((total-2)/(total-1),p);
export function groupSectors(study,g,destinations){const asked=Number(study.destination?.sectors)||0;return Math.max(1,Math.min(destinations,asked>0?asked:autoSectors(destinations,Math.max(1,Number(g.count)||1))));}
export function probableStopsRange(study){
 const iso=study.trafficModel==='iso8100',rows=[];
 for(const g of study.groups||[]){const stops=Math.round(Number(g.stops))||0,p=effectiveCapacity(g),pn=iso?p:nominalCapacity(g);if(stops<2||!(p>0))continue;
  const n=stops-1,G=groupSectors(study,g,n),ns=n/G;
  rows.push({label:g.label,sectors:G,conventional:iso?stopsIso(n,p):stopsNbr(stops,pn),ads:iso?stopsIso(ns,p):stopsIso(ns,isoAdsPassengers(g))+1 /* NBR: ADS pela ISO com o FC da ISO; +1 inclui o acesso, como as paradas NBR */});}
 const range=k=>rows.length?{min:Math.min(...rows.map(r=>r[k])),max:Math.max(...rows.map(r=>r[k]))}:{min:null,max:null};
 return {rows,conventional:range('conventional'),ads:range('ads')};
}
export function adsComparison(study,result){
 study=result?.calculationStudy||study;
 const inputs=performanceInputs(study,result);if(inputs.error)return {error:inputs.error};
 const byGroup=new Map();
 // Base dos tempos: a população a transportar em 5 min. Se ela é menor que a capacidade dos elevadores, cada viagem leva só
 // os passageiros que a demanda entrega (menos paradas e menos embarque), e o intervalo de partida é o desse ciclo, não o da cabina cheia.
 const groupKeys=i=>new Set(inputs.cars.filter(c=>c.served.has(i)).map(c=>c.groupKey??c.id)).size||1;
 const demandOf=c=>inputs.rate*[...c.served].filter(i=>i!==inputs.accessIndex).reduce((n,i)=>n+(inputs.populations[i]||0)/groupKeys(i),0);
 const conventionalCars=inputs.cars.map(c=>{if(!(c.hold>0&&c.cycle&&c.group))return c;try{return {...c,hold:loadForDemand(c.group,c.cycle,demandOf(c),0).interval};}catch{return c;}});
 // Elevadores do mesmo grupo têm o mesmo conjunto de andares; os setores são blocos contínuos acima (ou abaixo) do acesso.
 const keyOf=c=>c.groupKey??[...c.served].sort((a,b)=>a-b).join(',');
 const adsCars=inputs.cars.map(c=>{const key=keyOf(c);
  if(!byGroup.has(key)){const dests=[...c.served].filter(i=>i!==inputs.accessIndex).sort((a,b)=>a-b),count=inputs.cars.filter(o=>keyOf(o)===key).length;
   const asked=Number(study.destination?.sectors)||0,G=Math.max(1,Math.min(dests.length,asked>0?asked:autoSectors(dests.length,count))),size=dests.length/G;
   byGroup.set(key,new Map(dests.map((d,i)=>[d,Math.min(G-1,Math.floor(i/size))])));}
  const map=byGroup.get(key),G=new Set(map.values()).size;let hold=c.hold;if(c.hold>0&&c.cycle&&c.group){try{hold=isoLoadForDemand(c.group,demandOf(c),G).interval;}catch{hold=c.hold;}}
  return {...c,sectorOf:map,hold};});
 // População de um pico de 5 min; a simulação segue até todos chegarem ao destino (limite de 60 min).
 // Capacidade de transporte em 5 min, na mesma base normativa do cartão: convencional = ciclo NBR; ADS = ciclo estimado por setores.
 const seen=new Set();let capC=0,capA=0,capOk=true;
 for(const c of adsCars){if(seen.has(c.groupKey??c.id))continue;seen.add(c.groupKey??c.id);if(!c.cycle||!c.group){capOk=false;continue;}capC+=c.cycle.capacity;try{capA+=destinationEstimateIsoForNbr(c.group,new Set(c.sectorOf.values()).size).destination.capacity;}catch{capOk=false;}}
 const capacity=capOk&&capC>0&&capA>0?{conventional:capC,ads:capA}:null;
 const run=cars=>simulateTraffic({...inputs,cars,mode:'up',arrivalBins:1});
 const conventional=run(conventionalCars),ads=run(adsCars);
 return {conventional,ads,stops:probableStopsRange(study),rate:inputs.rate,capacity,base:(inputs.cars.every(c=>c.cruise)?'convencional pelo ciclo da NBR 5665 com a lotação nominal':'convencional pelos tempos e perfil de movimento informados para os elevadores')+'; ADS pelo método ISO 8100-32 com o FC da ISO (lotação × FC, sem arredondar)'};
}
export function adsComparisonValues(c){
 if(!c||c.error)return null;
 const D=Number.isFinite(c.conventional.demandPerBin)&&c.conventional.demandPerBin>0?c.conventional.demandPerBin:c.conventional.passengers;
 const pick=(s,cap,stops)=>({served:Number.isFinite(cap)?cap:null,stopsMin:stops.min,stopsMax:stops.max,
  waitAvg:s.waiting.avg,...Object.fromEntries(WAIT_LIMITS.map(l=>['wait'+l,s.waiting.below.find(x=>x.limit===l)?.pct??null])),
  travelAvg:s.travel.avg,...Object.fromEntries(TRAVEL_LIMITS.map(l=>['travel'+l,s.travel.below.find(x=>x.limit===l)?.pct??null]))});
 return {conventional:pick(c.conventional,c.capacity?.conventional,c.stops.conventional),ads:pick(c.ads,c.capacity?.ads,c.stops.ads)};
}
export const cache=new WeakMap();
