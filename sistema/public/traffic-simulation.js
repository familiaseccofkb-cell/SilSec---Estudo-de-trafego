// V0037 · simulação de eventos de tráfego (subida, descida e subida e descida).
// Premissas (documentadas no relatório):
// - Subida: chegadas no pavimento de acesso, destino nos andares servidos (população proporcional).
// - Descida: origem nos andares servidos (população proporcional), destino no acesso.
// - Subida e descida: as duas correntes juntas; a parte descendente da demanda é `downShare`.
// - Período simulado: `horizon` segundos em blocos de `bin`; em cada bloco chegam N = população servida × taxa (uniformes no bloco).
// - Despacho coletivo: cada cabina desembarca quem chegou ao destino, embarca quem espera no andar (até a lotação),
//   e segue ao próximo andar com destino ou chamada na direção atual; inverte quando não há mais parada nela.
// - Tempo de porta = abertura + fechamento + passageiros que entram e saem × tempo por passageiro.
// - Tempo de viagem entre andares = perfil de movimento (aceleração e jerk) do próprio elevador.
// - Passageiros não atendidos até o fim do período entram nas médias com o tempo decorrido e não contam nos limites.
import {motionProfile} from './travel-curves.js';

export const SIMULATION_VERSION='5';
export const WAIT_LIMITS=[30,60,90];
export const TRAVEL_LIMITS=[90,120,180];

function mulberry32(seed){let a=seed>>>0;return ()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}

export function summarize(values,limits,unfinished){
 const n=values.length;
 if(!n)return {min:null,avg:null,max:null,unfinished:0,below:limits.map(l=>({limit:l,pct:null}))};
 const sum=values.reduce((a,b)=>a+b,0);
 return {
  min:Math.min(...values),avg:sum/n,max:Math.max(...values),
  unfinished:unfinished.filter(Boolean).length,
  below:limits.map(l=>({limit:l,pct:100*values.filter((v,i)=>v<l&&!unfinished[i]).length/n})),
 };
}

// floors: [{height}] do mais baixo ao mais alto. cars: [{id,capacity,speed,acceleration,jerk,open,close,passenger,served:Set<number>}].
// populations: população por índice de andar. mode: 'up' | 'down' | 'updown'.
export function simulateTraffic({floors,cars,accessIndex,populations,rate,mode='up',downShare=.5,horizon=3600,bin=300,seed=810032,arrivalBins=null}){
 const random=mulberry32(seed);
 const stops=floors.map((_,i)=>i).filter(i=>i!==accessIndex&&(populations[i]||0)>0&&cars.some(c=>c.served.has(i)));
 const accessServed=cars.some(c=>c.served.has(accessIndex));
 const popTotal=stops.reduce((n,i)=>n+populations[i],0);
 const upShare=mode==='up'?1:mode==='down'?0:1-downShare;
 const downPart=1-upShare;
 const pickStop=()=>{let r=random()*popTotal;for(const i of stops){r-=populations[i];if(r<=0)return i;}return stops.at(-1);};
 const bins=Math.round(horizon/bin),pax=[];
 const perBin=Math.round(popTotal*rate);
 for(let k=0;k<Math.min(bins,arrivalBins??bins);k++){
  const nUp=Math.round(perBin*upShare),nDown=Math.round(perBin*downPart);
  if(accessServed)for(let j=0;j<nUp;j++)pax.push({arr:k*bin+(j+.5)*bin/nUp,origin:accessIndex,dest:pickStop(),dir:'up',bin:k});
  if(accessServed)for(let j=0;j<nDown;j++)pax.push({arr:k*bin+(j+.5)*bin/nDown,origin:pickStop(),dest:accessIndex,dir:'down',bin:k});
 }
 const eligible=pax.filter(p=>cars.some(c=>c.served.has(p.origin)&&c.served.has(p.dest)));
 eligible.sort((a,b)=>a.arr-b.arr);

 const flightCache=new Map();
 const flight=(c,a,b)=>{const d=Math.abs(floors[b].height-floors[a].height);if(!(d>0))return 0;if(c.cruise)return d/c.speed;const key=c.id+'|'+d.toFixed(4);if(!flightCache.has(key))flightCache.set(key,motionProfile(d,c.speed,c.acceleration,c.jerk).time);return flightCache.get(key);};
 const dwell=(c,n)=>(c.stopTime??c.open+c.close)+n*c.passenger/2;

 const carState=cars.map(c=>({c,pos:accessIndex,busyUntil:0,onboard:[],dir:1,target:null,lastStart:null}));
 const waiting=new Map(); // origem -> fila FIFO
 const hallByBin=new Array(bins).fill(0),servedByBin=new Array(bins).fill(0);
 const waitingCount=()=>{let n=0;for(const q of waiting.values())n+=q.length;return n;};
 let next=0;const trips=[]; // partidas do pavimento principal com passageiros: {t, load}

 for(let t=0;t<horizon;t++){
  while(next<eligible.length&&eligible[next].arr<=t){const p=eligible[next++];if(!waiting.has(p.origin))waiting.set(p.origin,[]);waiting.get(p.origin).push(p);}
  for(const s of carState){
   if(s.busyUntil>t)continue;
   const c=s.c;
   // 1) desembarque e embarque no andar atual
   const off=s.onboard.filter(p=>p.dest===s.pos);
   if(off.length){s.onboard=s.onboard.filter(p=>p.dest!==s.pos);for(const p of off)p.done=t;}
   let on=0;
   const q=waiting.get(s.pos)||[];
   // Despacho no pavimento principal (pico de subida): a cabina fica carregando e parte quando lota ou quando
   // o passageiro embarcado que chegou primeiro completa o tempo de espera de carga (c.hold = intervalo do ciclo),
   // contado desde a chegada dele ao pavimento: a espera no hall conta para a partida. Uma cabina por grupo carrega por vez;
   // no ADS, uma cabina por setor de destino.
   const lobby=c.hold>0&&upShare>0&&s.pos===accessIndex&&c.served.has(accessIndex);
   if(lobby&&!s.departing){
    const others=carState.filter(o=>o!==s&&o.loading&&o.c.groupKey===c.groupKey);
    let can=()=>!others.length;
    if(c.sectorOf){const busy=new Set(others.map(o=>o.sector));
     if(s.sector==null){const first=q.find(p=>c.served.has(p.dest)&&!busy.has(c.sectorOf.get(p.dest)));if(first)s.sector=c.sectorOf.get(first.dest);}
     can=p=>s.sector!=null&&c.sectorOf.get(p.dest)===s.sector;}
    let n=0;
    for(let i=0;i<q.length&&s.onboard.length<c.capacity;i++){const p=q[i];if(!c.served.has(p.dest)||!can(p))continue;p.board=t;servedByBin[p.bin]++;s.onboard.push(p);q.splice(i,1);i--;n++;}
    if(n){s.loaded=(s.loaded||0)+n;if(!s.loading){s.loading=true;s.loadStart=Math.min(t,...s.onboard.map(p=>p.arr));}}
    if(s.loading&&(s.onboard.length>=c.capacity||t-s.loadStart>=c.hold)){s.loading=false;s.sector=null;s.departing=true;s.busyUntil=t+dwell(c,s.loaded+off.length);s.loaded=0;continue;}
    if(s.loading)continue;
    s.sector=null;
    if(off.length){s.busyUntil=t+dwell(c,off.length);continue;}
   }
   else if(q.length&&c.served.has(s.pos)&&!lobby){
    const room=c.capacity-s.onboard.length;
    const taking=[];
    // ADS: a partir do acesso, a viagem embarca somente o setor de destino de quem espera há mais tempo.
    let sector=null;const bySector=c.sectorOf&&s.pos===accessIndex;
    for(let i=0;i<q.length&&taking.length<room;i++){if(!c.served.has(q[i].dest))continue;if(bySector){const sec=c.sectorOf.get(q[i].dest);if(sector===null)sector=sec;else if(sec!==sector)continue;}taking.push(q[i]);q.splice(i,1);i--;}
    for(const p of taking){p.board=t;servedByBin[p.bin]++;s.onboard.push(p);}
    on=taking.length;
   }
   if(off.length||on){s.busyUntil=t+dwell(c,off.length+on);continue;}
   // 2) escolha do próximo andar: destinos a bordo e chamadas do hall na direção atual (inverte se não houver)
   const boardTargets=new Set(s.onboard.map(p=>p.dest));
   const hallTargets=[];
   if(s.onboard.length<c.capacity)for(const [f,list] of waiting){
    if(f===s.pos||!list.length||!c.served.has(f))continue;
    const claimed=carState.filter(o=>o!==s&&o.target===f&&o.busyUntil>t).reduce((n,o)=>n+Math.max(0,o.c.capacity-o.onboard.length),0)>=list.length;
    if(!claimed)hallTargets.push(f);
   }
   const all=[...boardTargets,...hallTargets].filter(f=>f!==s.pos);
   if(!all.length){if(upShare>0&&s.pos!==accessIndex&&c.served.has(accessIndex)&&!s.onboard.length){s.dir=accessIndex>s.pos?1:-1;s.target=accessIndex;s.busyUntil=t+flight(c,s.pos,accessIndex);s.pos=accessIndex;}else s.target=null;continue;}
   const pick=dir=>{const ups=all.filter(f=>f>s.pos),downs=all.filter(f=>f<s.pos);return dir>0?(ups.length?Math.min(...ups):null):(downs.length?Math.max(...downs):null);};
   let to=pick(s.dir);
   if(to===null){s.dir=-s.dir;to=pick(s.dir);}
   if(to===null)continue;
   // Limite do fabricante: partidas do acesso não podem ocorrer com intervalo menor que 3600/PPH por elevador.
   if(c.maxPph&&s.pos===accessIndex){if(s.lastStart!==null&&t-s.lastStart<3600/c.maxPph)continue;s.lastStart=t;}
   s.dir=to>s.pos?1:-1;
   s.target=to;s.departing=false;if(s.pos===accessIndex&&s.onboard.length)trips.push({t,load:s.onboard.length});
   s.busyUntil=t+flight(c,s.pos,to);
   s.pos=to;
  }
  if(t%bin===bin-1)hallByBin[Math.floor(t/bin)]=waitingCount();
 }
 // Fim do período: quem não embarcou ou não chegou entra com o tempo decorrido.
 const all=eligible;
 const summaryFor=list=>{
  const awt=list.map(p=>p.board!=null?p.board-p.arr:horizon-p.arr);
  const ttd=list.map(p=>p.done!=null?p.done-p.arr:horizon-p.arr);
  return {waiting:summarize(awt,WAIT_LIMITS,list.map(p=>p.board==null)),travel:summarize(ttd,TRAVEL_LIMITS,list.map(p=>p.done==null))};
 };
 const up=summaryFor(all.filter(p=>p.dir==='up')),down=summaryFor(all.filter(p=>p.dir==='down')),both=summaryFor(all);
 return {
  mode,horizon,bin,bins,seed,downShare:mode==='updown'?downShare:mode==='down'?1:0,
  passengers:all.length,demandPerBin:popTotal*rate,arrivalWindow:Math.min(bins,arrivalBins??bins)*bin,
  trips,
  boardedInWindow:all.filter(p=>p.board!=null&&p.board<=Math.min(bins,arrivalBins??bins)*bin).length,
  unservedAtEnd:{total:all.filter(p=>p.board==null).length,up:all.filter(p=>p.dir==='up'&&p.board==null).length,down:all.filter(p=>p.dir==='down'&&p.board==null).length},
  waiting:both.waiting,travel:both.travel,
  up:{passengers:all.filter(p=>p.dir==='up').length,...up},
  down:{passengers:all.filter(p=>p.dir==='down').length,...down},
  hallByBin,servedByBin,
  arrivalsByBin:Array.from({length:bins},(_,k)=>all.filter(p=>p.bin===k).length),
 };
}

// Compatibilidade: subida a partir do acesso (mesmo resultado da V0031 no que a janela usa).
export function simulateUpPeak(args){return simulateTraffic({...args,mode:'up'});}
