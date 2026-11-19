// Comparativo de funcionamento: chamada convencional × ADS-Antecipador de Destino.
// Mesma demanda nos dois sistemas (mesma semente de simulação, pico de subida a partir do pavimento principal, 60 min).
// Convencional: despacho coletivo; cada cabina embarca quem espera, até a lotação.
// ADS: os destinos de cada grupo são divididos em setores contínuos; cada viagem a partir do acesso embarca
// somente passageiros do mesmo setor (o do passageiro que espera há mais tempo). Não reproduz a alocação real do fabricante.
import {loadForDemand} from './destination-estimate.js';
import {simulateTraffic,WAIT_LIMITS,TRAVEL_LIMITS} from './traffic-simulation.js';
import {performanceInputs} from './traffic-performance.js';
import {autoSectors,destinationEstimateNbr} from './destination-estimate.js';
import {effectiveCapacity} from './cabin-occupancy.js';
import {contextHelpButton} from './context-help.js';

const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const f=(v,d=1)=>Number.isFinite(v)?new Intl.NumberFormat('pt-BR',{minimumFractionDigits:d,maximumFractionDigits:d}).format(v):'—';
const stopsIso=(n,p)=>n<=1?1:n*(1-Math.pow(1-1/n,p));
const stopsNbr=(total,p)=>total<=2?total:total-(total-1)*Math.pow((total-2)/(total-1),p);

// Setores de um grupo: valor informado em "Setores de destino" ou o automático do sistema.
export function groupSectors(study,g,destinations){const asked=Number(study.destination?.sectors)||0;return Math.max(1,Math.min(destinations,asked>0?asked:autoSectors(destinations,Math.max(1,Number(g.count)||1))));}

// Paradas prováveis por viagem, convencional e com ADS, para cada grupo (mesma fórmula do modelo do estudo).
export function probableStopsRange(study){
 const iso=study.trafficModel==='iso8100',rows=[];
 for(const g of study.groups||[]){const stops=Math.round(Number(g.stops))||0,p=effectiveCapacity(g);if(stops<2||!(p>0))continue;
  const n=stops-1,G=groupSectors(study,g,n),ns=n/G;
  rows.push({label:g.label,sectors:G,conventional:iso?stopsIso(n,p):stopsNbr(stops,p),ads:iso?stopsIso(ns,p):stopsNbr(ns+1,p)});}
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
  const map=byGroup.get(key),G=new Set(map.values()).size;let hold=c.hold;if(c.hold>0&&c.cycle&&c.group){try{hold=loadForDemand(c.group,c.cycle,demandOf(c),G).interval;}catch{hold=c.hold;}}
  return {...c,sectorOf:map,hold};});
 // População de um pico de 5 min; a simulação segue até todos chegarem ao destino (limite de 60 min).
 // Capacidade de transporte em 5 min, na mesma base normativa do cartão: convencional = ciclo NBR; ADS = ciclo estimado por setores.
 const seen=new Set();let capC=0,capA=0,capOk=true;
 for(const c of adsCars){if(seen.has(c.groupKey??c.id))continue;seen.add(c.groupKey??c.id);if(!c.cycle||!c.group){capOk=false;continue;}capC+=c.cycle.capacity;try{capA+=destinationEstimateNbr(c.group,c.cycle,new Set(c.sectorOf.values()).size).destination.capacity;}catch{capOk=false;}}
 const capacity=capOk&&capC>0&&capA>0?{conventional:capC,ads:capA}:null;
 const run=cars=>simulateTraffic({...inputs,cars,mode:'up',arrivalBins:1});
 const conventional=run(conventionalCars),ads=run(adsCars);
 return {conventional,ads,stops:probableStopsRange(study),rate:inputs.rate,capacity,base:inputs.cars.every(c=>c.cruise)?'ciclo normativo da NBR 5665':'tempos e perfil de movimento informados para os elevadores'};
}

// Valores calculados pelo sistema, nas mesmas linhas que o fabricante informa na proposta.
export function adsComparisonValues(c){
 if(!c||c.error)return null;
 const D=Number.isFinite(c.conventional.demandPerBin)&&c.conventional.demandPerBin>0?c.conventional.demandPerBin:c.conventional.passengers;
 const pick=(s,cap,stops)=>({served:Number.isFinite(cap)?cap:null,stopsMin:stops.min,stopsMax:stops.max,
  waitAvg:s.waiting.avg,...Object.fromEntries(WAIT_LIMITS.map(l=>['wait'+l,s.waiting.below.find(x=>x.limit===l)?.pct??null])),
  travelAvg:s.travel.avg,...Object.fromEntries(TRAVEL_LIMITS.map(l=>['travel'+l,s.travel.below.find(x=>x.limit===l)?.pct??null]))});
 return {conventional:pick(c.conventional,c.capacity?.conventional,c.stops.conventional),ads:pick(c.ads,c.capacity?.ads,c.stops.ads)};
}

const cache=new WeakMap();
export function adsComparisonHtml(study,result){
 if(!result)return `<div class="card card-body below"><h3>Comparativo de cálculo do sistema SilSec · chamada convencional × ADS-Antecipador de Destino${contextHelpButton('comparativoAds')}</h3><p class="small-copy">Calcule o estudo para ver o comparativo.</p></div>`;
 let c=cache.get(result);if(!c){try{c=adsComparison(study,result);}catch(e){c={error:String(e?.message||'erro na simulação')};}cache.set(result,c);}
 const head=`<h3>Comparativo de cálculo do sistema SilSec · chamada convencional × ADS-Antecipador de Destino${contextHelpButton('comparativoAds')}</h3>`;
 if(c.error)return `<div class="card card-body below">${head}<p class="population-warning">${esc(c.error)}</p></div>`;
 const a=c.conventional,b=c.ads,moved=s=>s.boardedInWindow,tripsIn=s=>(s.trips||[]).filter(x=>x.t<=s.arrivalWindow),load=s=>{const x=tripsIn(s);return x.length?x.reduce((n,v)=>n+v.load,0)/x.length:null;},gap=s=>s.passengers?s.arrivalWindow/s.passengers:null;
 const cell=(v,fail)=>fail?`<td class="ads-fail">${v}<small> · não atende</small></td>`:`<td>${v}</td>`;
 const row=(label,x,y,fx=false,fy=false)=>`<tr><th scope="row">${esc(label)}</th>${cell(x,fx)}${cell(y,fy)}</tr>`;
 const band=t=>`<tr class="ads-band"><th colspan="3" scope="colgroup">${esc(t)}</th></tr>`;
 const pctRaw=(s,k,l)=>s[k].below.find(x=>x.limit===l)?.pct;
 const pct=(s,k,l)=>f(pctRaw(s,k,l));
 const under100=v=>Number.isFinite(v)&&v<100;
 const D=Number.isFinite(a.demandPerBin)&&a.demandPerBin>0?a.demandPerBin:a.passengers; // demanda exata de 5 min (população × % de tráfego); a simulação usa pessoas inteiras
 return `<div class="card card-body below ads-comparison">${head}<div class="table-wrap"><table class="group-results ads-comparison-table"><thead><tr><th scope="col">Item</th><th scope="col">Convencional</th><th scope="col">ADS-Antecipador de Destino</th></tr></thead><tbody>${
  row('População a transportar em 5 min',f(D,2),f(D,2))}${
  c.capacity?(()=>{const fa=c.capacity.conventional<D-1e-9,fb=c.capacity.ads<D-1e-9;return row('População atendida em 5 min · capacidade dos elevadores (pessoas)',f(c.capacity.conventional,2),f(c.capacity.ads,2),fa,fb)+row('População atendida por hora · capacidade dos elevadores (pessoas)',f(c.capacity.conventional*12,0),f(c.capacity.ads*12,0),fa,fb)+row('Folga da capacidade sobre a população de 5 min (%)',f(D?100*(c.capacity.conventional/D-1):null,2),f(D?100*(c.capacity.ads/D-1):null,2),fa,fb);})():''}${
  row('Chegada de passageiros · um a cada (s)',f(gap(a)),f(gap(b)))}${
  row('Viagens a partir do pavimento principal em 5 min',f(tripsIn(a).length,0),f(tripsIn(b).length,0))}${
  row('Passageiros por viagem · média',f(load(a)),f(load(b)))}${
  row('Passageiros transportados em 5 min',f(moved(a),2),f(moved(b),2))}${
  row('Transportados em 5 min (%)',f(a.passengers?100*moved(a)/a.passengers:null,2),f(b.passengers?100*moved(b)/b.passengers:null,2))}${
  row('Paradas prováveis · mínima',f(c.stops.conventional.min),f(c.stops.ads.min))}${
  row('Paradas prováveis · máxima',f(c.stops.conventional.max),f(c.stops.ads.max))}${
  band('Tempo de espera no pavimento principal e % da população transportada')}${
  row('Tempo estimado (s)',f(a.waiting.avg),f(b.waiting.avg))}${
  WAIT_LIMITS.map(l=>row(`Em até ${l} s (%)`,pct(a,'waiting',l),pct(b,'waiting',l),l===90&&under100(pctRaw(a,'waiting',l)),l===90&&under100(pctRaw(b,'waiting',l)))).join('')}${
  band('Tempo de chegada ao destino e % da população transportada')}${
  row('Tempo estimado (s)',f(a.travel.avg),f(b.travel.avg))}${
  TRAVEL_LIMITS.map(l=>row(`Em até ${l} s (%)`,pct(a,'travel',l),pct(b,'travel',l),l===180&&under100(pctRaw(a,'travel',l)),l===180&&under100(pctRaw(b,'travel',l)))).join('')}</tbody></table></div><p class="small-copy">Simulação de eventos de um pico de subida de 5 min a partir do pavimento principal: a população a transportar em 5 min (demanda da norma), igual nos dois sistemas, chega diluída, um passageiro por vez em intervalos iguais ao longo dos 5 min, e cada viagem leva a parte que já chegou. A simulação segue até todos chegarem ao destino. Os percentuais são sobre essa população de 5 min; por isso, na simulação, nenhum sistema transporta mais gente que a população a transportar. A linha "População atendida · capacidade dos elevadores" mostra a capacidade de transporte sem limitar à população do prédio. Capacidade = ciclo normativo da NBR 5665 (convencional) e ciclo estimado por setores (ADS). Passageiros transportados em 5 min = embarcados dentro dos 5 min. Tempo estimado = média por passageiro; não é o intervalo entre partidas. No modelo NBR 5665, a simulação usa os tempos do ciclo normativo do estudo (percurso, aceleração e retardamento, portas, passageiros e adicional de 10%), a mesma base do cartão Capacidade · NBR 5665. Nos dois sistemas, a cabina parte do pavimento principal quando lota ou quando o primeiro passageiro embarcado completa um intervalo de espera, contado desde a chegada dele. Quando a população a transportar em 5 min é menor que a capacidade dos elevadores, os tempos e o intervalo de partida usam essa população (cada viagem leva só os passageiros que a demanda entrega), e a linha de capacidade continua mostrando o que o sistema permite atender. No ADS, cada viagem atende um setor contínuo de andares e várias cabinas carregam ao mesmo tempo, uma por setor (${c.stops.rows.map(r=>`${esc(r.label)}: ${r.sectors} setor${r.sectors>1?'es':''}`).join('; ')||'setores automáticos'}). Base de tempos aplicada neste cálculo: ${esc(c.base)}. Comparativo de projeto: não substitui a simulação do fabricante, exigida pela ISO 8100-32:2020 (5.3) para controle de destino.</p></div>`;
}
