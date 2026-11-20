import {effectiveCapacity,nominalCapacity} from './cabin-occupancy.js';
// Antecipação de destino (controle de destino) · estimativa por setorização dos destinos.
// Premissas: no pico de subida, o sistema agrupa os passageiros por destino; cada viagem atende um setor contínuo de
// N/G andares (G setores), com a mesma lotação de cálculo. Reduzem-se as paradas prováveis e o andar de reversão.
// Não modela o tempo extra de espera no térreo nem a alocação real do fabricante: é um comparativo de projeto.
// A ISO 8100-32:2020 (5.3) exige simulação para sistemas com controle de destino.
const stopsIso=(n,p)=>n<=1?1:n*(1-Math.pow(1-1/n,p));
function highestIso(n,p){if(n<=1)return n;let h=n;const k=Math.ceil(n);for(let i=1;i<k;i++)h-=Math.pow(Math.min(i,n)/n,p);return Math.max(1,h);}
export const autoSectors=(floors,cars)=>Math.max(2,Math.min(cars,Math.floor(floors/2)));

// Método ISO (cláusula 7): TIV = 2·H·tv + (S+1)·ts + transferência.
export function destinationEstimate({floors,expressFloors=0,passengers,tv,ts,transferRound,cars,sectors=0}){
 if(!(floors>=2&&passengers>0&&tv>0&&ts>=0))throw Error('dados insuficientes para a estimativa.');
 const G=Math.min(floors,sectors>0?sectors:autoSectors(floors,cars)),Ns=floors/G;
 const S=stopsIso(floors,passengers),H=highestIso(floors,passengers)+expressFloors,conventional=2*H*tv+(S+1)*ts+transferRound;
 const Sd=stopsIso(Ns,passengers),Hd=expressFloors+(G-1)/2*Ns+highestIso(Ns,passengers),dd=2*Hd*tv+(Sd+1)*ts+transferRound;
 return {method:'iso',sectors:G,floorsPerSector:Ns,conventional:{S,H,rtt:conventional},destination:{S:Sd,H:Hd,rtt:dd},gain:conventional/dd};}

// Método NBR 5665 (ciclo T1+T2+T3+T4+10%), aplicado ao ciclo com dados do fabricante.
export function destinationEstimateNbr(group,cycle,sectors=0){const N=group.stops-1,P=effectiveCapacity(group);if(!(N>=2&&P>0&&cycle&&cycle.total>0))throw Error('dados insuficientes para a estimativa.');
 const G=Math.min(N,sectors>0?sectors:autoSectors(N,group.count)),Ns=N/G,stopsTotal=Ns+1;
 const n=cycle.t2>0&&cycle.acceleration>0?cycle.t2*2/cycle.acceleration:(cycle.door>0?cycle.t3/cycle.door:null);
 const nd=stopsTotal<=2?stopsTotal:stopsTotal-(stopsTotal-1)*Math.pow((stopsTotal-2)/(stopsTotal-1),P),ratio=n>0?nd/n:1;
 const t1=cycle.t1*(G+1)/(2*G),t2=cycle.t2*ratio,t3=cycle.t3*ratio,t4=cycle.transferMode==='per-stop'?cycle.t4*ratio:cycle.t4*P/group.capacity,additional=.1*(t3+t4),total=t1+t2+t3+t4+additional+(cycle.start||0);
 return {method:'nbr',sectors:G,floorsPerSector:Ns,conventional:{stops:n,total:cycle.total,interval:cycle.interval,capacity:cycle.capacity},destination:{stops:nd,t1,t2,t3,t4,additional,total,interval:total/group.count,capacity:300*P*group.count/total},gain:cycle.total/total};}

// Ciclo NBR com P passageiros por viagem (P ≤ lotação de cálculo): menos passageiros geram menos paradas prováveis e menos
// tempo de entrada e saída. Em P = lotação de cálculo devolve o mesmo ciclo do estudo (ou da estimativa por setores, se sectors > 0).
const stopsNbr=(S,p)=>S<=2?S:S-(S-1)*Math.pow((S-2)/(S-1),p);
export function loadCycleNbr(group,cycle,P,sectors=0){const N=group.stops-1,full=sectors>0?effectiveCapacity(group):nominalCapacity(group);if(!(N>=2&&full>0&&P>0&&cycle&&cycle.total>0))throw Error('dados insuficientes para a estimativa.');
 const G=sectors>0?Math.min(N,sectors):1,Ss=N/G+1,base=G>1?destinationEstimateNbr(group,cycle,G).destination:cycle;
 const ratio=stopsNbr(Ss,P)/stopsNbr(Ss,full),k=P/full;
 const t1=base.t1,t2=base.t2*ratio,t3=base.t3*ratio,t4=cycle.transferMode==='per-stop'?base.t4*ratio:base.t4*k,total=t1+t2+t3+t4+.1*(t3+t4)+(cycle.start||0);
 return {load:P,total,interval:total/group.count,capacity:300*P*group.count/total};}
// Passageiros por viagem quando a demanda de 5 min é menor que a capacidade: P tal que 300·P·n/T(P) = demanda.
export function loadForDemand(group,cycle,demand,sectors=0){const full=sectors>0?effectiveCapacity(group):nominalCapacity(group),top=loadCycleNbr(group,cycle,full,sectors);if(!(demand>0)||top.capacity<=demand)return top;
 let lo=Math.min(1,full),hi=full;if(loadCycleNbr(group,cycle,lo,sectors).capacity>=demand)return loadCycleNbr(group,cycle,lo,sectors);
 for(let i=0;i<50;i++){const mid=(lo+hi)/2;if(loadCycleNbr(group,cycle,mid,sectors).capacity<demand)lo=mid;else hi=mid;}
 return loadCycleNbr(group,cycle,hi,sectors);}
