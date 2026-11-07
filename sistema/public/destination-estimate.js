// Antecipação de destino (controle de destino) · estimativa por setorização dos destinos.
// Premissas: no pico de subida, o sistema agrupa os passageiros por destino; cada viagem atende um setor contínuo de
// N/G andares (G setores), com a mesma lotação de cálculo. Reduzem-se as paradas prováveis e o andar de reversão.
// Não modela o tempo extra de espera no térreo nem a alocação real do fabricante: é um comparativo de projeto.
// A ISO 8100-32:2020 (5.3) exige simulação para sistemas com controle de destino.
const stopsIso=(n,p)=>n<=1?1:n*(1-Math.pow(1-1/n,p));
function highestIso(n,p){if(n<=1)return n;let h=n;const k=Math.ceil(n);for(let i=1;i<k;i++)h-=Math.pow(Math.min(i,n)/n,p);return Math.max(1,h);}
export const autoSectors=(floors,cars)=>Math.max(2,Math.min(cars,Math.floor(floors/2)));

// Método ISO (cláusula 7): RTT = 2·H·tv + (S+1)·ts + transferência.
export function destinationEstimate({floors,expressFloors=0,passengers,tv,ts,transferRound,cars,sectors=0}){
 if(!(floors>=2&&passengers>0&&tv>0&&ts>=0))throw Error('dados insuficientes para a estimativa.');
 const G=Math.min(floors,sectors>0?sectors:autoSectors(floors,cars)),Ns=floors/G;
 const S=stopsIso(floors,passengers),H=highestIso(floors,passengers)+expressFloors,conventional=2*H*tv+(S+1)*ts+transferRound;
 const Sd=stopsIso(Ns,passengers),Hd=expressFloors+(G-1)/2*Ns+highestIso(Ns,passengers),dd=2*Hd*tv+(Sd+1)*ts+transferRound;
 return {method:'iso',sectors:G,floorsPerSector:Ns,conventional:{S,H,rtt:conventional},destination:{S:Sd,H:Hd,rtt:dd},gain:conventional/dd};}

// Método NBR 5665 (ciclo T1+T2+T3+T4+10%), aplicado ao ciclo com dados do fabricante.
export function destinationEstimateNbr(group,cycle,sectors=0){const N=group.stops-1,P=group.capacity;if(!(N>=2&&P>0&&cycle&&cycle.total>0))throw Error('dados insuficientes para a estimativa.');
 const G=Math.min(N,sectors>0?sectors:autoSectors(N,group.count)),Ns=N/G,stopsTotal=Ns+1;
 const n=cycle.t2>0&&cycle.acceleration>0?cycle.t2*2/cycle.acceleration:(cycle.door>0?cycle.t3/cycle.door:null);
 const nd=stopsTotal<=2?stopsTotal:stopsTotal-(stopsTotal-1)*Math.pow((stopsTotal-2)/(stopsTotal-1),P),ratio=n>0?nd/n:1;
 const t1=cycle.t1*(G+1)/(2*G),t2=cycle.t2*ratio,t3=cycle.t3*ratio,t4=cycle.transferMode==='per-stop'?cycle.t4*ratio:cycle.t4,additional=.1*(t3+t4),total=t1+t2+t3+t4+additional+(cycle.start||0);
 return {method:'nbr',sectors:G,floorsPerSector:Ns,conventional:{stops:n,total:cycle.total,interval:cycle.interval,capacity:cycle.capacity},destination:{stops:nd,t1,t2,t3,t4,additional,total,interval:total/group.count,capacity:300*group.capacity*group.count/total},gain:cycle.total/total};}
