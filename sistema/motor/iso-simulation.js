// Simulação de tráfego de pico de subida (100% de entrada), conforme os requisitos da ISO 8100-32:2020, 8.2 a 8.4:
// - pelo menos três demandas x1 (= %Ch exigido), x2 e x3 (acima de x1);
// - chegadas independentes (processo de Poisson), destinos pela população de cada andar;
// - cabina limitada a Psim passageiros; geração de 120 min; descartados os primeiros 15 min e os últimos 5 min;
// - avaliação pelos quatro casos de 8.4 (inclui a regra dos 20% acima do tempo de espera exigido em x2).
// Modelo próprio de despacho convencional no térreo (uma cabina carrega por vez, viagem com paradas em ordem e
// retorno expresso). Não substitui um simulador comercial para controle de destino ou almoço com tráfego entre andares.
import {meanFlight} from './starts.js';

function rng(seed){let a=seed>>>0;return()=>{a=a+0x6D2B79F5>>>0;let t=a;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};}

export function simulateUppeak({floors,weights,expressFloors=0,df,cars,psim,speed,acceleration,jerk,open,close,transfer,startDelay=.6,closingDelay=2,preOpening=0,population,demandPercent,minutes=120,warmup=15,cooldown=5,seed=1}){
 if(!(floors>=1&&cars>=1&&psim>=1&&df>0&&population>0&&demandPercent>0))throw Error('Simulação: dados insuficientes.');
 const random=rng(seed),T=minutes*60,lambda=population*demandPercent/100/300;
 const w=weights&&weights.length===floors&&weights.some(x=>x>0)?weights.map(x=>Math.max(0,x)):Array(floors).fill(1),total=w.reduce((a,b)=>a+b,0),cum=[];let acc=0;for(const x of w){acc+=x/total;cum.push(acc);}
 const pickFloor=()=>{const r=random();const i=cum.findIndex(c=>r<=c);return (i<0?floors-1:i)+1;};
 const pax=[];for(let t=-Math.log(1-random())/lambda;t<T;t+=-Math.log(1-random())/lambda)pax.push({arrival:t,dest:pickFloor(),wait:null,ttd:null});
 const flightCache=new Map(),fly=d=>{if(d<=0)return 0;const k=Math.round(d*1000);if(!flightCache.has(k))flightCache.set(k,meanFlight(d,speed,acceleration,jerk).time);return flightCache.get(k);};
 const height=f=>f===0?0:(expressFloors+f)*df;
 const ready=Array.from({length:cars},()=>0);let next=0,prevClose=0,trips=0,loadSum=0;
 const doorOpen=Math.max(0,open-preOpening);
 while(next<pax.length){
  let c=0;for(let i=1;i<cars;i++)if(ready[i]<ready[c])c=i;
  // a cabina abre no térreo quando chega e quando a anterior começa a fechar; se não há ninguém esperando, aguarda aberta
  const openAt=Math.max(ready[c],prevClose);
  let t=openAt+doorOpen;const load=[];
  // embarque: quem já espera entra em sequência; depois de cada embarque a porta espera tcd por novos passageiros
  while(next<pax.length&&load.length<psim){const p=pax[next];if(p.arrival<=t){p.wait=Math.max(0,openAt-p.arrival);t+=transfer;load.push(p);next++;continue;}
   if(load.length===0){t=p.arrival;continue;}
   if(p.arrival<=t+closingDelay){t=p.arrival;continue;}break;}
  prevClose=t+closingDelay;t=prevClose+close+startDelay;
  const stops=[...new Set(load.map(p=>p.dest))].sort((a,b)=>a-b);let pos=0;
  for(const f of stops){t+=fly(height(f)-height(pos));const arrive=t-preOpening;const off=load.filter(p=>p.dest===f);for(const p of off)p.ttd=arrive-p.arrival;t+=doorOpen+off.length*transfer+closingDelay+close+startDelay;pos=f;}
  t+=fly(height(pos));ready[c]=t;trips++;loadSum+=load.length;
 }
 const kept=pax.filter(p=>p.arrival>=warmup*60&&p.arrival<=T-cooldown*60),mean=k=>kept.length?kept.reduce((s,p)=>s+p[k],0)/kept.length:null;
 const sorted=kept.map(p=>p.wait).sort((a,b)=>a-b),pct=q=>sorted.length?sorted[Math.min(sorted.length-1,Math.floor(q*sorted.length))]:null;
 return {demandPercent,passengers:kept.length,generated:pax.length,averageWait:mean('wait'),waitP90:pct(.9),longWaitShare:sorted.length?sorted.filter(x=>x>60).length/sorted.length:null,averageTimeToDestination:mean('ttd'),trips,averageLoad:trips?loadSum/trips:0};}

// 8.4: classificação do conjunto de resultados (x1, x2, x3) frente ao tempo médio de espera exigido.
export function evaluateSimulation(results,requiredWait){const [r1,r2,r3]=results,excess=r=>r.averageWait===null||r.averageWait>requiredWait*10;
 if(!r1||excess(r1)||r1.averageWait>requiredWait)return {code:'a',label:'Não atende na demanda exigida (x1): altere a configuração',pass:false};
 if(r2&&(excess(r2)||r2.averageWait>requiredWait*1.2))return {code:'b',label:'Atende em x1, mas em x2 a espera passa 20% do exigido: próximo do limite de desempenho',pass:true};
 if(r3&&!excess(r3)&&r3.averageWait<=requiredWait)return {code:'c',label:'Atende com folga até x3: avaliar se a configuração está superdimensionada',pass:true};
 return {code:'d',label:'Configuração adequadamente dimensionada',pass:true};}

export function runIsoSimulation(spec,{rate,requiredWait,step=1,seed=20201}){const xs=[rate*100,rate*100+step,rate*100+2*step];
 const results=xs.map((x,i)=>simulateUppeak({...spec,demandPercent:x,seed:seed+i}));
 return {demands:xs,results,requiredWait,evaluation:evaluateSimulation(results,requiredWait)};}
