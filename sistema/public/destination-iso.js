// ADS (antecipação de destino) em estudo NBR 5665, calculado pelo método ISO 8100-32 (decisão do responsável, 9.5.7).
// O cálculo convencional NBR (capacidade, intervalo, Anexo A) não muda: usa a lotação nominal.
// No ADS, os passageiros por viagem vêm do FC da ISO (lotação × FC, sem arredondar; decisão do responsável, 19/11):
// FC da aba ISO, se preenchida; senão, o fator de ocupação informado para o elevador (padrão 80%, o FC da ISO 8100-32:2020).
// Sem a aba ISO preenchida, usa os tempos do próprio equipamento e os padrões ISO do sistema (defaultIsoGroup).
import {cabinOccupancy} from './cabin-occupancy.js';
import {defaultIsoGroup} from './iso-data.js';
import {calculateIsoGroup} from './iso-engine.js';
import {destinationEstimate} from './destination-estimate.js';

export const ADS_ISO_EDITION='iso2020';
export const adsIsoFc=group=>Number.isFinite(group.iso?.occupancy)?group.iso.occupancy:cabinOccupancy(group);
export const isoAdsPassengers=group=>group.capacity*adsIsoFc(group)/100*(group.iso?.capacityReduction?.5:1);

function isoSource(group){
 const filled=!!group.iso,defaults=defaultIsoGroup();
 const iso={...defaults,source:'manufacturer',...(group.iso||{})};
 return {group:{...group,iso},filled,defaults};
}

function isoParts(group,passengers){
 const {group:src,filled,defaults}=isoSource(group);let a,source=src.iso.source,fallback=false;
 try{a=calculateIsoGroup(src,{effectivePassengers:passengers,edition:ADS_ISO_EDITION}).iso;}
 catch(e){if(source!=='table')throw e;fallback=true;source='manufacturer';a=calculateIsoGroup({...src,iso:{...src.iso,source}},{effectivePassengers:passengers,edition:ADS_ISO_EDITION}).iso;}
 const used=a.used.iso;
 return {a,basis:{edition:ADS_ISO_EDITION,filled,source,fallback,startDelay:used.startDelay,closingDelay:used.closingDelay,preOpening:used.preOpening,expressFloors:used.expressFloors||0,defaultsUsed:!filled,defaults:{startDelay:defaults.startDelay,closingDelay:defaults.closingDelay}}};
}

const withCapacity=(x,P,count)=>({...x,total:x.rtt,stops:x.S,capacity:300*P*count/x.rtt,interval:x.rtt/count});

// Estimativa ADS pela ISO para um grupo de estudo NBR. P padrão = lotação × FC da ISO, sem arredondar.
export function destinationEstimateIsoForNbr(group,sectors=0,passengers=isoAdsPassengers(group)){
 const P=passengers;if(!(P>0)||!(group.stops>=3))throw Error('dados insuficientes para a estimativa.');
 const {a,basis}=isoParts(group,P);
 const est=destinationEstimate({floors:a.N,expressFloors:a.E,passengers:P,tv:a.tv,ts:a.ts,transferRound:a.transferPart,cars:group.count,sectors});
 return {...est,passengers:P,occupancy:100*P/group.capacity,fc:adsIsoFc(group),basis,conventional:withCapacity(est.conventional,P,group.count),destination:withCapacity(est.destination,P,group.count)};
}

// Passageiros por viagem quando a demanda de 5 min é menor que a capacidade ADS: P tal que capacidade(P) = demanda (P ≤ lotação × FC).
export function isoLoadForDemand(group,demand,sectors=0){
 const full=isoAdsPassengers(group),at=P=>destinationEstimateIsoForNbr(group,sectors,P).destination,top=at(full);
 if(!(demand>0)||top.capacity<=demand)return {load:full,...top};
 let lo=Math.min(1,full),hi=full;if(at(lo).capacity>=demand)return {load:lo,...at(lo)};
 for(let i=0;i<50;i++){const mid=(lo+hi)/2;if(at(mid).capacity<demand)lo=mid;else hi=mid;}
 return {load:hi,...at(hi)};
}

// Texto das premissas (relatório e tela). Sem número de cláusula da ISO até a confirmação do responsável.
export function adsIsoBasisText(rows){
 const r=rows.find(x=>x.basis);if(!r)return '';const b=r.basis,fmt=v=>new Intl.NumberFormat('pt-BR',{maximumFractionDigits:2}).format(v);
 const P=rows.map(x=>`${x.label}: ${fmt(x.passengers)} passageiros por viagem (lotação × FC de ${fmt(x.fc)}%)`).join('; ');
 const src=b.source==='table'?'tempos das tabelas ISO':'tempos de porta, movimento e transferência informados para o equipamento';
 const defaults=rows.some(x=>x.basis?.defaultsUsed)?` Aba ISO não preenchida: adotados os padrões ISO do sistema (atraso de partida ${fmt(b.defaults.startDelay)} s, atraso de fechamento ${fmt(b.defaults.closingDelay)} s, sem andares expressos) e ${src}.`:` Parâmetros da aba ISO do estudo; ${src}.`;
 return `ADS calculado pelo método de cálculo da ISO 8100-32:2020, cláusula 7 (TIV = 2·H·tv + (S+1)·ts + transferência), com o FC da ISO: passageiros por viagem = lotação × FC, sem arredondar. ${P}.${defaults}${rows.some(x=>x.basis?.fallback)?' Tabela ISO indisponível para a porta ou a velocidade informada: usados os dados do equipamento.':''} O cálculo convencional, a capacidade, o intervalo e o Anexo A continuam pela NBR 5665, com a lotação nominal.`;
}
