import {defaultSchedule,validateSchedule,dailyPerformance} from './schedule.js';
export const PERFORMANCE_VERSION='2';
export const FLOW_KEYS=['entry','lunchIn','lunchOut','exit'];
export const FLOW_LABELS={entry:'Entrada',lunchIn:'Almoço · entrada',lunchOut:'Almoço · saída',exit:'Saída'};
export const PROFILE_IMAGE={
 light:{entry:[3.5,4,4.5,5,5.3,5.5,6.5,10,9.5,6,3,2.5],lunchIn:[1.2,1.2,1.2,1.2,1.2,1.2,1.2,1.2,1.2,2,2.5,4],lunchOut:[3,5,6,7.5,3.2,3,2.5,2,2,2,1.7,1.7],exit:[2.8,3.2,3.8,4.5,6,6.5,9.5,7.5,7,6.5,3,2]},
 moderate:{entry:[3.5,4,4.5,5,5.3,5.5,6.5,10,11,9.5,6,3],lunchIn:[1.2,1.3,1.4,1.6,1.8,2,3,4.5,6,4.8,4.5,3],lunchOut:[3,5,6,7.5,3.2,3,2.5,2,2,2,1.7,1.7],exit:[2.8,3.2,3.8,4.5,6,6.5,9.5,7.5,7,6.5,3,2]}
};
export const emptyMeasurement=()=>Object.fromEntries(FLOW_KEYS.map(k=>[k,null]));
export function defaultOperation(){return {schedule:defaultSchedule(),profileVersion:2,profile:'moderate',basis:'manufacturer',charter:30,lunch:60,dwell:0,profileUnit:'percent',measurementBlocks:12,measurements:Array.from({length:12},emptyMeasurement),measurementDate:'',observer:'',measurementNotes:'',entryStart:'08:00',lunchStart:'12:00',exitStart:'18:00'};}
export function normalizeOperation(value){const defaults=defaultOperation(),o={...defaults,...value};o.profileVersion=value?.profileVersion??1;o.schedule={...defaultSchedule(),enabled:false,...value?.schedule};o.measurements=Array.isArray(value?.measurements)?value.measurements.map(row=>({...emptyMeasurement(),...row})):defaults.measurements;return o;}
const finite=(x,min,max)=>typeof x==='number'&&Number.isFinite(x)&&x>=min&&x<=max;
export function validateOperation(value){
 if(value!==undefined&&(!value||typeof value!=='object'||Array.isArray(value)))return ['Configuração operacional inválida.'];const o=normalizeOperation(value),errors=[];
 if(![1,2].includes(o.profileVersion)||!['light','moderate','heavy','measured'].includes(o.profile)||!['manufacturer','normative'].includes(o.basis)||!['percent','people'].includes(o.profileUnit))errors.push('Perfil operacional inválido.');
 if(o.profile!=='measured'&&(o.profileVersion===1||o.profile==='heavy')&&(!finite(o.charter,0,100)||!finite(o.lunch,0,100)))errors.push('Os percentuais de fretado e almoço devem estar entre 0% e 100%.');
 if(!finite(o.dwell,0,20)||(o.dwell>0&&o.dwell<2))errors.push('Permanência adicional: use 0 (não modelada) ou um tempo entre 2 e 20 segundos.');
 if(o.profile==='measured'){
 if(!Number.isInteger(o.measurementBlocks)||!finite(o.measurementBlocks,1,288)||!Array.isArray(o.measurements)||o.measurements.length<o.measurementBlocks||o.measurements.length>288)errors.push('Medição: informe de 1 a 288 blocos de cinco minutos e atualize a tabela.');
 else if(o.measurements.slice(0,o.measurementBlocks).some(row=>FLOW_KEYS.some(k=>row[k]!==null&&(!finite(row[k],0,1000000)||!Number.isInteger(row[k])))))errors.push('Medição: pessoas por bloco devem ser inteiros de 0 a 1.000.000; campo vazio não significa zero.');
 for(const key of ['entryStart','lunchStart','exitStart'])if(typeof o[key]!=='string'||!/^\d{2}:\d{2}$/.test(o[key])||Number(o[key].slice(0,2))>23||Number(o[key].slice(3))>59)errors.push('Informe horários válidos para os períodos da medição.');
 for(const key of ['measurementDate','observer','measurementNotes'])if(typeof o[key]!=='string'||o[key].length>2000)errors.push('Identificação da medição inválida.');
 }
 return [...new Set([...errors,...validateSchedule(o.schedule)])];
}
export function resizeMeasurements(operation,count){if(!Number.isInteger(count)||count<1||count>288)throw Error('Use de 1 a 288 blocos.');const o=normalizeOperation(operation);return {...o,measurementBlocks:count,measurements:Array.from({length:Math.max(count,o.measurements.length)},(_,i)=>o.measurements[i]||emptyMeasurement())};}
export function parseMeasurementCsv(text){
 const lines=text.trim().split(/\r?\n/).filter(l=>l.trim());if(lines.length<2)throw Error('Cole cabeçalho e linhas: entrada;almoco_entrada;almoco_saida;saida.');
 const delimiter=lines[0].includes(';')?';':',';const headers=lines.shift().split(delimiter).map(v=>v.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replaceAll(' ','_'));
 const names=['entrada','almoco_entrada','almoco_saida','saida'],indexes=names.map(k=>headers.indexOf(k));if(indexes.some(i=>i<0)||lines.length>288)throw Error('Use as quatro colunas esperadas e até 288 linhas.');
 return lines.map((line,i)=>{const values=line.split(delimiter);return Object.fromEntries(FLOW_KEYS.map((k,j)=>{const token=values[indexes[j]]?.trim();if(!token||!/^\d+$/.test(token)||Number(token)>1000000)throw Error(`Linha ${i+2}: preencha todas as contagens, inclusive zero.`);return [k,Number(token)];}));});
}
const norm=a=>{const total=a.reduce((s,x)=>s+x,0);return a.map(x=>x/total);};
function legacyFlows(study,o){const heavy=o.profile==='heavy',pub=norm(heavy?[.01,.02,.03,.05,.08,.15,.25,.18,.1,.06,.04,.03]:o.profile==='light'?Array(12).fill(1):[.03,.04,.05,.07,.1,.14,.16,.14,.1,.07,.05,.05]),cha=norm(heavy?[0,0,0,.02,.08,.2,.4,.2,.07,.03,0,0]:o.profile==='light'?Array(12).fill(1):[0,0,0,.05,.1,.25,.35,.15,.05,.03,.02,0]),lunch=norm([.02,.04,.07,.1,.15,.12,.12,.15,.1,.07,.04,.02]);const entry=pub.map((v,i)=>study.population*(heavy?.95:.8)*((1-o.charter/100)*v+o.charter/100*cha[i]));return {entry,exit:[...entry].reverse(),lunchIn:lunch.map(x=>study.population*o.lunch/100*x/2),lunchOut:lunch.map(x=>study.population*o.lunch/100*x/2)};}
export function calculatePerformance(study,result){
 const o=normalizeOperation(study.operation),errors=validateOperation(o);if(errors.length)throw Error(errors.join('\n'));
 if(!study.commonService)return {version:PERFORMANCE_VERSION,available:false,message:'Para zonas independentes, avalie atendimento e medições em cada estudo separado.',normativeSimulation:false};
 let flows,basis;
 if(o.profile==='measured'){
  if(!/^\d{4}-\d{2}-\d{2}$/.test(o.measurementDate)||!Number.isFinite(Date.parse(o.measurementDate))||new Date(o.measurementDate).toISOString().slice(0,10)!==o.measurementDate||o.measurements.slice(0,o.measurementBlocks).some(row=>FLOW_KEYS.some(k=>row[k]===null)))throw Error('Preencha data e todas as contagens da medição. Informe 0 quando não houver pessoas.');
  flows=Object.fromEntries(FLOW_KEYS.map(k=>[k,o.measurements.slice(0,o.measurementBlocks).map(row=>row[k])]));basis='Contagens informadas no pavimento principal; valores absolutos em pessoas.';
 }else if(o.profileVersion===1||o.profile==='heavy'){flows=legacyFlows(study,o);basis='Perfil anterior preservado; pesos normalizados e percentuais operacionais informados.';}
 else{const factor=o.profileUnit==='percent'?study.population/100:1;flows=Object.fromEntries(FLOW_KEYS.map(k=>[k,PROFILE_IMAGE[o.profile][k].map(x=>x*factor)]));basis=`Tabela enviada pelo proprietário em 14/10/2026. Valores tratados como ${o.profileUnit==='percent'?'percentuais da população por bloco, sem normalização':'pessoas por bloco, conforme escolha do usuário'}. A imagem não declara a unidade; a interpretação é premissa explícita.`;}
 const iso=result.model==='iso8100';const capacity=result.groups.reduce((sum,g,i)=>{const c=iso?g.iso:g[o.basis],n=iso?g.iso.S+1:g.stops,passengers=iso?g.iso.PC:study.groups[i].capacity;return sum+300*passengers*g.count/(c.total+n*o.dwell);},0);
 let queueIn=0,queueOut=0,queueLunchIn=0,queueLunchOut=0;
 const rows=flows.entry.map((arrival,i)=>{const departure=flows.exit[i],li=flows.lunchIn[i],lo=flows.lunchOut[i],inAvailable=queueIn+arrival,outAvailable=queueOut+departure,midIn=queueLunchIn+li,midOut=queueLunchOut+lo,totalMid=midIn+midOut,servedEntry=Math.min(capacity,inAvailable),servedExit=Math.min(capacity,outAvailable),servedMid=Math.min(capacity,totalMid),servedLunchIn=totalMid?servedMid*midIn/totalMid:0,servedLunchOut=totalMid?servedMid*midOut/totalMid:0;queueIn=inAvailable-servedEntry;queueOut=outAvailable-servedExit;queueLunchIn=midIn-servedLunchIn;queueLunchOut=midOut-servedLunchOut;return {minute:(i+1)*5,arrival,departure,lunchIn:li,lunchOut:lo,lunch:li+lo,capacity,queueIn,queueOut,queueLunchIn,queueLunchOut,queueLunch:queueLunchIn+queueLunchOut,servedEntry,servedExit,servedLunchIn,servedLunchOut,waitProxy:capacity?queueIn/capacity*5:null};});
 const warnings=['Estimativa operacional por blocos; não é simulação de despacho, de duas horas normativa nem cálculo de tempo médio de espera.','A capacidade de pico do modelo escolhido é aplicada aos períodos como aproximação; tráfego misto e despacho real exigem avaliação específica.','Entrada, almoço e saída são períodos distintos. No almoço, entrada e saída compartilham a mesma capacidade; não há duplicação da oferta.'];
 if(Math.max(...rows.map(r=>Math.max(r.arrival,r.lunch,r.departure)))>capacity)warnings.push('O pico de demanda em pelo menos um bloco supera a capacidade operacional estimada. Compare quantidades de elevadores e tempos em novos cenários, mesmo quando o critério normativo de população atende.');
 if(o.profile==='measured'&&flows.entry.reduce((s,x)=>s+x,0)>study.population)warnings.push('Entrada medida supera a população adotada na janela. Pode haver visitantes ou repetição de viagens; a medição não substitui a composição populacional.');
 const daily=o.schedule.enabled?dailyPerformance(rows,o.schedule,capacity,{measured:o.profile==='measured',starts:{entry:o.entryStart,lunch:o.lunchStart,exit:o.exitStart}}):null;if(daily)warnings.push(daily.note);return {daily,schedule:o.schedule,version:PERFORMANCE_VERSION,available:true,normativeSimulation:false,profile:o.profile,profileVersion:o.profileVersion,unit:'pessoas / 5 min',capacity,basis,measurementDate:o.measurementDate,observer:o.observer,notes:o.measurementNotes,starts:{entry:o.entryStart,lunch:o.lunchStart,exit:o.exitStart},rows,peakArrival:Math.max(...flows.entry),maxQueue:Math.max(...rows.map(r=>r.queueIn)),maxQueueLunch:Math.max(...rows.map(r=>r.queueLunch)),maxQueueOut:Math.max(...rows.map(r=>r.queueOut)),maxWaitProxy:Math.max(...rows.map(r=>r.waitProxy||0)),totals:Object.fromEntries(FLOW_KEYS.map(k=>[k,flows[k].reduce((s,x)=>s+x,0)])),warnings};
}
