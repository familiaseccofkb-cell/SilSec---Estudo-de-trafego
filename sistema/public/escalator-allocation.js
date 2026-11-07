import {parametersOnly,operationallyEnabled} from './escalator-policy.js';
// Project assumption for partial service. Full-floor exclusion remains conditional
// on continuous access and adequate capacity; this is not a new normative rule.
export const PARTIAL_ESCALATOR_PREMISE='Atendimento parcial: premissa de projeto solicitada pelo responsável, sem atribuição de regra proporcional à NBR 5665, 5.1.6, nem ao documento ISO. Capacidade equivalente de população = menor capacidade de subida/descida na janela ÷ (demanda percentual / 100). Distribuição proporcional entre os andares dependentes, respeitando cada trecho compartilhado. A população residual permanece nos elevadores, com arredondamento final para cima.';
const fmt=v=>new Intl.NumberFormat('pt-BR',{maximumFractionDigits:4}).format(v);
export function allocateEscalatorPopulation(network,lines){
 if(!network.enabled)return network;
 const {segments,accessFloor:access=0}=network,byFloor=new Map(segments.map(s=>[s.floor,s])),floors=network.floors||{},fraction=network.demandPercent/100;
 const paths=new Map(),populations=new Map();
 for(const line of lines)populations.set(line.floor,(populations.get(line.floor)||0)+line.beforeEscalator);
 for(const floor of new Set([...Object.keys(floors).map(Number),...populations.keys()])){
  let cursor=floor;const path=[],seen=new Set();let valid=floor!==access&&network.accessSelected!==false;
  while(cursor!==access){const edge=byFloor.get(cursor);if(!edge||seen.has(cursor)||!edge.served||!edge.physicalPass){valid=false;break;}seen.add(cursor);path.push(edge);cursor=edge.from;}
  const population=populations.get(floor)||0;
  floors[floor]={...floors[floor],...(network.accessSelected===false?{reason:'População mantida nos elevadores: descontinuidade no acesso principal, cujo flag de escadas está desmarcado.'}:{}),population,servedPopulation:0,remainingPopulation:population,serviceFraction:0,excluded:false,partial:false};
  if(valid&&operationallyEnabled(network)&&population>0)paths.set(floor,path);
 }
 const capacity=new Map(segments.map(s=>[s,Math.max(0,Math.min(s.capacityUp,s.capacityDown)/fraction)]));
 const served=new Map([...paths.keys()].map(f=>[f,0]));let active=new Set(paths.keys());
 // Progressive proportional filling releases unused capacity at local bottlenecks.
 // Each iteration either completes a floor or saturates at least one shared edge.
 for(let iteration=0;active.size&&iteration<=paths.size+segments.length;iteration++){
  let delta=Math.min(...[...active].map(f=>1-served.get(f)/populations.get(f)));
  const weights=new Map();for(const floor of active)for(const edge of paths.get(floor))weights.set(edge,(weights.get(edge)||0)+populations.get(floor));
  for(const [edge,weight] of weights)delta=Math.min(delta,capacity.get(edge)/weight);
  delta=Math.max(0,delta);
  for(const floor of active)served.set(floor,Math.min(populations.get(floor),served.get(floor)+delta*populations.get(floor)));
  for(const [edge,weight] of weights)capacity.set(edge,Math.max(0,capacity.get(edge)-delta*weight));
  const next=new Set([...active].filter(f=>populations.get(f)-served.get(f)>1e-8&&!paths.get(f).some(edge=>capacity.get(edge)<1e-8)));
  if(next.size===active.size&&delta<1e-12)break;active=next;
 }
 for(const [floor,rawAmount] of served){const amount=populations.get(floor)-rawAmount<1e-8?populations.get(floor):rawAmount;served.set(floor,amount);const condition=floors[floor],population=populations.get(floor),walkway=paths.get(floor).some(edge=>edge.banks?.some(b=>b.served&&b.kind==='walkway')),equipment=walkway?'escadas/esteiras rolantes':'escadas rolantes',basis=walkway?'Premissa de projeto: relação de tráfego comum aplicada às esteiras, sem atribuir essa extensão à NBR 5665, 5.1.6.':'Ligação contínua ao acesso principal e capacidade avaliada em todos os trechos (NBR 5665, 5.1.6).';condition.servedPopulation=amount;condition.remainingPopulation=Math.max(0,population-amount);condition.serviceFraction=Math.min(1,amount/population);condition.excluded=condition.remainingPopulation<1e-8;condition.partial=amount>1e-8&&!condition.excluded;condition.reason=condition.partial?`Atendimento parcial por ${equipment}: ${fmt(amount)} de ${fmt(population)} pessoas equivalentes atendidas; ${fmt(condition.remainingPopulation)} permanecem no estudo de elevadores. Premissa de projeto; capacidade compartilhada distribuída proporcionalmente.`:condition.excluded?`População integralmente atendida por ${equipment}: ${fmt(population)} pessoas. ${basis}`:'População mantida nos elevadores: sem capacidade disponível nas premissas informadas.';}
 for(const segment of segments){segment.equivalentPopulationCapacity=Math.min(segment.capacityUp,segment.capacityDown)/fraction;segment.allocatedPopulation=[...served].reduce((n,[floor,amount])=>n+(paths.get(floor).includes(segment)?amount:0),0);}
 network.floors=floors;network.partialAllocationPremise=PARTIAL_ESCALATOR_PREMISE;
 network.excludedPopulation=lines.reduce((n,line)=>n+(line.escalatorRequested?line.beforeEscalator*(floors[line.floor]?.serviceFraction||0):0),0);
 network.remainingPopulation=lines.reduce((n,line)=>n+line.beforeEscalator,0)-network.excludedPopulation;
 return network;
}
