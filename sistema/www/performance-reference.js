import {fleetCars,probableCarStops} from './fleet.js';
import {motionProfile} from './travel-curves.js';
import {carTiming} from './car-controls.js';

// Tabela de performance enviada pelo proprietário (14/10/2026 e imagem de 13/11/2026).
// Os valores da tabela são referência para comparação; não alteram os cálculos do estudo.
export const PERFORMANCE_REFERENCE_REVISION='V0020';

const e=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const num=(x,d=2)=>Number(x).toFixed(d).replace('.',',');
const range=(vals,d=2)=>{const v=vals.filter(Number.isFinite);if(!v.length)return null;const a=Math.min(...v),b=Math.max(...v);return a===b?num(a,d):`${num(a,d)} a ${num(b,d)}`;};
const NOT_IN_STUDY='Não informado no estudo';

// Distância de referência da tabela do fabricante para a viagem entre andares consecutivos.
export const FLOOR_TO_FLOOR_REFERENCE={distance:3,time:9.3};
// Tempo de um elevador sair de um pavimento e chegar ao seguinte, pronto com a porta aberta:
// fechamento + energização para a partida + deslocamento no percurso médio entre andares + abertura − pré-abertura.
// Percurso médio entre andares = percurso entre extremos ÷ (paradas − 1). Energização: no modelo NBR, o tempo de partida
// adicional é informado por ciclo e entra dividido pelas paradas prováveis; no modelo ISO, é o atraso de partida por parada.
export function floorToFloor(study,g,c){
 const ok=x=>typeof x==='number'&&Number.isFinite(x)&&x>0,stops=Math.round(Number(g.stops));
 if(!ok(g.travel)||!(stops>=2)||![c.speed,c.acceleration,c.jerk,c.open,c.close].every(ok))return null;
 const iso=study.trafficModel==='iso8100',distance=g.travel/(stops-1);
 let start=0;
 if(iso)start=Number(c.iso?.startDelay)||0;
 else if(ok(c.start)){let n=null;try{n=probableCarStops(study,g,c);}catch{}start=ok(n)?c.start/n:c.start;}
 const pre=c.preOpeningEnabled?Number(c.preOpening)||0:iso?Number(c.iso?.preOpening)||0:0;
 const at=d=>{const flight=motionProfile(d,c.speed,c.acceleration,c.jerk).time;return {distance:d,flight,total:c.close+start+flight+c.open-pre,valid:pre<=Math.min(flight,c.open)};};
 return {...at(distance),close:c.close,open:c.open,start,preOpening:pre,reference:at(FLOOR_TO_FLOOR_REFERENCE.distance)};
}

// Todas as unidades de todos os grupos, com os tempos e premissas efetivamente usados no cálculo.
export function performanceCars(study){
 const out=[];
 for(const g of study?.groups||[]){
  for(const c of fleetCars(study,g)){
   let t;try{t=carTiming(study,g,c);}catch{t=c;}
   out.push({...t,floorToFloor:floorToFloor(study,g,t)});
  }
 }
 return out;
}

// Compara valores adotados com a referência: "Conforme" quando todos estão dentro da tolerância.
function compare(vals,ref,tol){
 const v=vals.filter(Number.isFinite);
 if(!v.length)return 'Não informado';
 return v.every(x=>Math.abs(x-ref)<=tol)?'Conforme':'Diferente';
}

export function performanceReferenceRows(study,result){
 const cars=performanceCars(study);
 const col=k=>cars.map(c=>c[k]);
 const open=col('open'),close=col('close'),acc=col('acceleration'),jerk=col('jerk');
 const life=col('serviceLifeYears');
 const preOn=cars.map(c=>c.preOpeningEnabled?c.preOpening:null).filter(Number.isFinite);
 const defects=cars.map(c=>Number.isFinite(c.failuresPerYear)?c.failuresPerYear/2:null);
 const interval=Number.isFinite(result?.manufacturer?.interval)?result.manufacturer.interval:null;
 const row=(item,ref,adopted,status,note='')=>({item,ref,adopted,status,note});
 const reference=(item,ref)=>row(item,ref,NOT_IN_STUDY,'Só referência');
 const withUnit=(vals,d,unit)=>{const r=range(vals,d);return r===null?'Não informado':`${r} ${unit}`;};
 const f2f=cars.map(c=>c.floorToFloor).filter(Boolean),f2fValid=f2f.every(x=>x.valid&&x.reference.valid);
 const f2fText=!f2f.length?'Não informado':!f2fValid?'Revisar: a pré-abertura excede o deslocamento ou a abertura':`${withUnit(f2f.map(x=>x.total),2,'s')} no percurso médio de ${range(f2f.map(x=>x.distance),2)} m · ${withUnit(f2f.map(x=>x.reference.total),2,'s')} em 3 m`;
 const f2fStatus=!f2f.length?'Não informado':!f2fValid?'Diferente':f2f.every(x=>x.reference.total<=FLOOR_TO_FLOOR_REFERENCE.time+.005)?'Conforme':'Acima da referência';
 const f2fParts=f2f.length&&f2fValid?` Parcelas no percurso médio: fechamento ${range(f2f.map(x=>x.close),2)} s + energização ${range(f2f.map(x=>x.start),2)} s + deslocamento ${range(f2f.map(x=>x.flight),2)} s + abertura ${range(f2f.map(x=>x.open),2)} s − pré-abertura ${range(f2f.map(x=>x.preOpening),2)} s.`:'';

 return [
  row('Tempo de abertura de portas (s)','2,1',withUnit(open,2,'s'),compare(open,2.1,.005)),
  row('Tempo de fechamento de portas (s)','2,3',withUnit(close,2,'s'),compare(close,2.3,.005)),
  row('Tempo de viagem entre andares consecutivos (s)','9,3 (para 3 m entre paradas)',f2fText,f2fStatus,
   'Tempo de o elevador sair de um pavimento e chegar ao seguinte: fechamento da porta + energização para a partida + deslocamento no percurso médio entre andares + abertura da porta − pré-abertura. Percurso médio = percurso entre extremos ÷ (paradas − 1). A situação compara o tempo calculado em 3 m com a referência de 9,3 s.'+f2fParts),
  row('Intervalo de tráfego para cada grupo (s)','50 (limite)',interval===null?'Não calculado':`${num(interval,1)} s`,
   interval===null?'Não calculado':interval<=50?'Conforme':'Acima da referência','Critério: intervalo calculado igual ou menor que 50 s.'),
  reference('Regulagem de portas abertas · chamadas internas (s)','Programável de 0,1 a 25,5 s'),
  reference('Regulagem de portas abertas · chamadas externas (s)','Programável de 0,1 a 25,5 s'),
  reference('Regulagem de portas abertas · chamadas no andar principal (s)','Programável de 0,1 a 25,5 s'),
  reference('Tempo médio para atendimento às chamadas externas (s)','50'),
  row('Pré-abertura de porta no andar (s)','0,5',
   cars.length?(preOn.length?withUnit(preOn,2,'s'):'Desativada'):'Não informado',
   cars.length?(preOn.length?compare(preOn,.5,.005):'Diferente'):'Não informado'),
  reference('Regulagem do forçador (nudging) (s)','Programável de 0,1 a 25,5 s'),
  reference('Variação percentual da velocidade nominal (%)','0,05%'),
  row('Aceleração / desaceleração máxima (m/s²)','1',withUnit(acc,2,'m/s²'),compare(acc,1,.005)),
  row('Jerk máximo (m/s³)','1,3',withUnit(jerk,2,'m/s³'),compare(jerk,1.3,.005)),
  reference('Tolerância de nivelamento no andar (mm)','5'),
  reference('Nível máximo de ruído no interior da cabina (dB)','65'),
  reference('Vibração vertical (mg)','30'),
  reference('Vibração horizontal lateral (mg)','18'),
  reference('Vibração horizontal frente/fundo (mg)','18'),
  row('Número de defeitos por elevador em 6 meses','1',
   withUnit(defects,1,'em 6 meses'),
   defects.some(Number.isFinite)?(defects.filter(Number.isFinite).every(x=>x<=1)?'Conforme':'Diferente'):'Não informado',
   'Calculado pela falha por ano informada em cada elevador, dividida por 2.'),
  row('Vida útil (anos)','20 anos',withUnit(life,0,'anos'),life.some(Number.isFinite)?(life.filter(Number.isFinite).every(x=>Math.abs(x-20)<=.005)?'Conforme':'Diferente'):'Não informado'),
 ];
}

const statusClass={'Conforme':'pr-ok','Diferente':'pr-diff','Acima da referência':'pr-diff','Parcial':'pr-part'};

export function performanceReferenceSection(study,result){
 if(!study?.groups?.length)return '';
 const rows=performanceReferenceRows(study,result);
 return `<section class="card card-body below performance-reference" id="performance-reference"><h2>Tabela de performance · referência do fabricante</h2><p class="small-copy">Compara a tabela de performance enviada com os valores adotados neste estudo, em todos os grupos e elevadores. "Conforme" indica valor igual à referência; "Diferente", valor do estudo diferente. Itens sem correspondência no cálculo são apenas informativos.</p><div class="table-wrap"><table class="pr-table"><thead><tr><th>Item</th><th>Referência</th><th>Adotado no estudo</th><th>Situação</th></tr></thead><tbody>${rows.map(r=>`<tr><th scope="row">${e(r.item)}${r.note?`<span class="small-copy pr-note">${e(r.note)}</span>`:''}</th><td>${e(r.ref)}</td><td>${e(r.adopted)}</td><td><span class="pr-tag ${statusClass[r.status]||'pr-ref'}">${e(r.status)}</span></td></tr>`).join('')}</tbody></table></div></section>`;
}
