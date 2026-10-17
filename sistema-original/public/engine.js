import {isBasic,validateBasic,calculateBasic} from './basic.js';
import {applyDimensionReference,referenceForCars} from './dimension-reference.js';
import {validateTransport,transportOptions,walkwayTraffic} from './transport-config.js';
import {hasFleet,projectFleet,fleetErrors} from './fleet.js';
import {accessRow,accessMarkNotice} from './building-access.js';
import {validateStudyDimensions} from './dimensions.js';
import {inputReadiness} from './study-inputs.js';
import {synchronizeFloorTable,validateBuildingFloors,floorZones,servedFloors} from './building-floors.js';
import {isIso,isoCriteria,defaultIsoConfig} from './iso-data.js';
import {validateIsoStudy,calculateIsoStudy,isoMinimumMessage} from './iso-engine.js';
import {calculateStarts} from './starts.js';
import {defaultPopulationMode,normalizePopulationRow,defaultPopulationRow,defaultPopulationCalc,calculatePopulation,populationOptions,populationSnapshot,populationTypes,populationStatus,populationWarnings} from './population.js';
import {validateEscalators} from './escalators.js';
import {validateFloorConfiguration} from './floors.js';
import {calculateGroupTravel} from './travel-curves.js';
import {defaultOperation,validateOperation,calculatePerformance} from './performance.js';
import {defaultEnergy,validateEnergy,calculateEnergy} from './energy.js';
import {normalizeTractionEquipment} from './traction-energy.js';
export const ENGINE_VERSION = '10.0.0';
export const MAX_GROUPS=20;
export function motionCheck(g){return {accelerationYellow:Number.isFinite(g.acceleration)&&g.acceleration>1&&g.acceleration<=1.6,accelerationRed:Number.isFinite(g.acceleration)&&g.acceleration>1.6,jerkLimit:g.speed>2.5?1.6:1.2,jerkYellow:Number.isFinite(g.jerk)&&g.jerk>(g.speed>2.5?1.6:1.2)};}
const decimal=(v,d=2)=>v.toFixed(d).replace('.',',');
export function accelerationMessage(g){
  const check=motionCheck(g);return check.accelerationRed?'Atenção aceleração acima de 1,60 m/s².':check.accelerationYellow?'Atenção, aceleração informada acima de 1,00 m/s²':'';
}
export function jerkMessage(g){const check=motionCheck(g);return check.jerkYellow?`Atenção Jerk acima de: ${decimal(check.jerkLimit)} m/s³ ${g.speed>2.5?'para velocidades acima de 2,50 m/s':'para velocidades até 2,50 m/s'}. Pode causar desconforto em viagem.`:'';}
export const SPEED_OPTIONS=[.15,.25,.30,.50,.75,1,1.25,1.33,1.50,1.60,1.75,2,2.50,3,3.50,4,5,6,7,8,9,10,11,12,13,14,15];
export function travelCheck(g){
  const valid=Number.isInteger(g.stops)&&g.stops>=2&&Number.isFinite(g.travel);
  const minimum=valid?round((g.stops-1)*2.80):NaN;
  return {minimum,below:valid&&g.travel<minimum};
}
export const USES = {
  auditorium: {label:'Auditório · critérios de projeto',rate:null},
  single: {label:'Escritório de uma única entidade',rate:.15},
  offices: {label:'Escritórios em geral e consultórios',rate:.12},
  residential: {label:'Apartamentos',rate:.10},
  hotel: {label:'Hotéis',rate:.10},
  restaurant: {label:'Restaurantes',rate:.06},
  hospitalSupport: {label:'Hospitais com serviços de apoio',rate:.08},
  hospital: {label:'Hospitais sem serviços de apoio',rate:.12},
  school: {label:'Escolas',rate:.20},
  garage: {label:'Garagens com rampas, sem manobrista',rate:.10},
  retail: {label:'Lojas e centros comerciais',rate:.10}
};
export const DOORS={central:{label:'Abertura central',time:3.9},lateral:{label:'Abertura lateral',time:5.5},vertical:{label:'Eixo vertical',time:6}};
export const ACCEL_TABLE=[[.63,2.5],[.75,2.5],[1,3],[1.25,3],[1.5,3.5],[1.75,4],[2,4.5],[2.5,5.5]];
export const SOURCES=[
  {title:'ABNT NBR 16734-1:2022',location:'Segurança na construção e instalação de escadas rolantes e esteiras rolantes',detail:'Referência atual identificada no catálogo DIN Media em 13/10/2026. Itens e limites numéricos pendentes de validação no texto oficial. Capacidade utilizada no estudo: tabela teórica enviada pelo proprietário ou dados documentados do fabricante, explicitamente selecionados.',href:'https://www.abntcatalogo.com.br/'},
  {title:'ABNT NBR 16734-2:2023',location:'Melhoria da segurança de equipamentos existentes',detail:'Aplicável à avaliação de segurança de escadas e esteiras rolantes existentes; não fornece neste protótipo um cálculo populacional automático.',href:'https://www.abntcatalogo.com.br/'},
  {title:'ABNT NBR 5665:1983 · versão corrigida 1987',location:'4.1.1; 5.1; 5.2; 6.1 a 6.6; tabelas 1 a 6; anexos A e B',detail:'Referência dos critérios de população, capacidade, ciclo e intervalo. Conteúdo reescrito na página Verificação de conteúdo. Adquira a norma oficial no Catálogo ABNT; a edição adotada deve ser confirmada para o projeto.',href:'https://www.abntcatalogo.com.br/'},
  {title:'ABNT NBR 16858-3:2022 · item 5.4.2.3.2 a)',location:'Identificação dos botões de seleção de pavimentos',detail:'Permite símbolos consistentes com a nomenclatura do edifício, inclusive caracteres, e prefere a sequência −2, −1, 0, 1, 2 etc. A sequência numérica e o limite de duas posições são critérios deste protótipo.'},
  {title:'ABNT NBR 16858-3:2022 · item 5.2.2',location:'Permanência de porta aberta',detail:'Item citado para os ajustes de permanência de porta aberta. A verificação completa de acessibilidade exige consulta à norma oficial.'}
];
export const clone=x=>JSON.parse(JSON.stringify(x));
export const round=(v,d=2)=>Math.round((v+Number.EPSILON)*10**d)/10**d;
export function defaultGroup(i=0){return {id:'g'+(i+1),label:'Grupo '+(i+1),count:i===1?2:1,capacity:i===0?6:8,stops:11,travel:30,speed:i===0?1:1.25,door:'lateral',width:800,acceleration:.8,jerk:1.2,open:1.75,close:2.15,passenger:2.4,start:0,preOpeningEnabled:false,preOpening:0,startsLimit:0,energyEquipment:normalizeTractionEquipment()};}
export function defaultStudy(){const pc=defaultPopulationCalc('offices');pc.rows[0].amount=2772;pc.rows[0].label='Escritórios do exemplo';return {schemaVersion:1,trafficModel:'nbr5665',name:'Exemplo de estudo',client:'',building:'Edifício de escritórios',address:'',date:new Date().toISOString().slice(0,10),use:'offices',population:396,populationDefinition:'',populationBasis:'Exemplo: 2.772 m² de escritórios / 7 = 396 pessoas. Ajuste a composição ao empreendimento.',populationCalc:pc,auxiliary:[],auditoriumDemandPercent:100,auditoriumInterval:60,method:'precision',commonService:true,groups:[defaultGroup(0),defaultGroup(1)],operation:defaultOperation(),energy:defaultEnergy()};}
export function populationComponent(use,kind,index=0){const base=defaultPopulationRow(use),complement=defaultAuxiliary(kind,index);return {...base,...complement,mode:defaultPopulationMode(use,kind),servedByEscalator:false};}
export function complementaryItems(study){return [...(study.auxiliary||[]),...(study.populationCalc?.rows||[]).flatMap((row,rowIndex)=>['external','exclusive'].includes(row.mode)?[{...row,rowIndex,sharedEscalators:row.servedByEscalator}]:[])];}
function finite(v,min,max){return typeof v==='number'&&Number.isFinite(v)&&v>=min&&v<=max;}
const manufacturerMissing=g=>['acceleration','jerk','open','close','start',g.transferMode==='per-stop'?'transferPerStop':'passenger'].some(k=>g[k]===null||g[k]===undefined||g[k]==='');
function normativePlaceholder(g){return {...g,acceleration:.8,jerk:1.2,open:2,close:2,passenger:2.4,start:0,transferPerStop:2.4,preOpeningEnabled:false,startsLimit:0};}
function normativeOnly(s){const work=clone(s);work.groups=work.groups.map(g=>manufacturerMissing(g)?normativePlaceholder(g):g);const r=calculateStudy(work,{populationApplied:true});const clear=o=>Array.isArray(o)?o.map(clear):o&&typeof o==='object'?Object.fromEntries(Object.entries(o).map(([k,v])=>[k,clear(v)])):typeof o==='number'||typeof o==='boolean'?null:o;r.groups.forEach(g=>{g.manufacturer=clear(g.manufacturer);delete g.travelCurves;});r.manufacturer=clear(r.manufacturer);r.manufacturer.available=false;r.minimum.manufacturer=null;r.starts.rows=r.starts.rows.map(clear);r.starts.totalRequired=null;r.starts.totalMaximum=null;r.starts.pass=null;r.starts.allLimitsProvided=false;r.deltaCapacity=null;r.deltaPercent=null;r.performance={available:false,message:'Dados do fabricante pendentes. O cálculo NBR permanece disponível.',rows:[],charts:[]};r.energy={enabled:true,available:false,message:'Consumo pendente: complete os dados do fabricante.'};r.warnings=r.warnings.filter(x=>!x.includes('mínim')&&!x.includes('FAB'));r.warnings.push('Dados do fabricante incompletos. Somente os resultados NBR foram calculados; FAB, PPH de movimento, curvas e consumo estão pendentes.');r.calculationStudy=clone(s);return r;}
export function validateStudy(s){
 if(isBasic(s))return validateBasic(s);
  const errors=[];
  if(!s||typeof s!=='object')return ['Arquivo não contém um estudo válido.'];
  if(hasFleet(s)){try{const errors=fleetErrors(s);return errors.length?errors:validateStudy(synchronizeFloorTable(projectFleet(s)));}catch(e){return [e.message];}}
  errors.push(...validateTransport(s));if(errors.length)return errors;
  if(s.trafficModel!==undefined&&!['nbr5665','iso8100'].includes(s.trafficModel))return ['Modelo de cálculo inválido.'];
  if(s.modelDrafts!==undefined){if(!s.modelDrafts||typeof s.modelDrafts!=='object'||Array.isArray(s.modelDrafts)||Object.entries(s.modelDrafts).some(([key,v])=>!['nbr5665','iso8100'].includes(key)||!v||typeof v!=='object'||!Array.isArray(v.groups)||v.groups.length<1||v.groups.length>20||!Array.isArray(v.populationCalc?.rows)||v.populationCalc.rows.length<1||v.populationCalc.rows.length>100||Object.hasOwn(v,'modelDrafts')))return ['Estrutura de parâmetros independentes dos modelos inválida.'];}
  if(s.entryVersion===8){errors.push(...inputReadiness(s).filter(x=>isIso(s)||/Paradas prováveis|Ciclo NBR/.test(x.title)).flatMap(x=>x.missing.map(m=>x.title+': '+m)));if(errors.length)return [...new Set(errors)];}if((s.groupCalculationVersion===1||s.groups.some(g=>g.use))&&!s.groupAnalysisChild&&new Set(s.groups.map(g=>g.logicalGroupId||g.id)).size>1){try{calculateIndependentGroups(s);return [];}catch(e){return [e.message];}}if(s.floorTable?.enabled&&floorZones(s).length>1){if(typeof s.name!=='string'||!s.name.trim()||s.name.length>120)return ['Informe um nome de estudo válido.'];try{calculateFloorZonedStudy(s);return [];}catch(e){return [e.message];}}
  errors.push(...validateBuildingFloors(s));
  if(isIso(s)){const errors=[...validateBuildingFloors(s),...validateIsoStudy(s)];for(const item of complementaryItems(s)){if(item.mode==='external'){try{errors.push(...validateStudy(auxiliaryStudy(s,item)).map(e=>item.label+': '+e));}catch(e){errors.push(item.label+': '+e.message);}}}return [...new Set(errors)];}
  if(typeof s.name!=='string'||!s.name.trim()||s.name.length>120)errors.push('Informe um nome de estudo com até 120 caracteres.');
  if(s.populationDefinition!==undefined&&(typeof s.populationDefinition!=='string'||s.populationDefinition.length>2000))errors.push('A justificativa da população deve ter até 2.000 caracteres.');
  for(const k of ['client','building','address','populationBasis'])if(typeof s[k]!=='string'||s[k].length>(k==='populationBasis'?50000:2000))errors.push('Texto de identificação ou premissa inválido.');
  if(s.populationCalc){
   errors.push(...validateFloorConfiguration(s.populationCalc));
   if(!Array.isArray(s.populationCalc.rows)||!s.populationCalc.rows.length||s.populationCalc.rows.length>100)errors.push('Composição populacional inválida.');
   else if(s.populationCalc.rows.some(row=>!row||!populationTypes(populationOptions(s).applications||s.use)[row.kind]||row.mode!==undefined&&!['main','external','exclusive'].includes(row.mode)||row.mode==='main'&&!(populationOptions(s).applications||[s.use]).some(u=>defaultPopulationMode(u,row.kind)==='main')&&!(row.participationVersion===1&&['include','exclude'].includes(row.participation))||typeof row.label!=='string'||row.label.length>120||typeof row.notes!=='string'||row.notes.length>2000))errors.push('Composição populacional incompatível ou inválida.');
   if(s.populationCalc.last){try{const status=populationStatus(s);if(status.pending&&status.lines.some(line=>line.escalatorExcluded||line.streetAccessExcluded))errors.push('Recalcule e aplique a população: o atendimento por escadas rolantes ou o pavimento de acesso foi alterado após uma exclusão aplicada.');}catch{errors.push('Memória populacional inválida.');}}
  }
  if(s.populationCalc?.escalators)errors.push(...validateEscalators(populationOptions(s).escalators,s.populationCalc.accessFloor));
  if(s.use==='auditorium'&&(!finite(s.auditoriumDemandPercent,.01,100)||!finite(s.auditoriumInterval,1,3600)))errors.push('Auditório: informe demanda entre 0,01% e 100% em 5 min e intervalo de projeto entre 1 e 3600 s.');
  if(s.auxiliary&&!Array.isArray(s.auxiliary))errors.push('Dados de uso complementar inválidos.');
  else for(const item of complementaryItems(s)){if(!item||!['garage','restaurant','auditorium'].includes(item.kind)||!['exclusive','external'].includes(item.mode)||typeof item.label!=='string'||item.label.length>120||typeof item.conditionsConfirmed!=='boolean'||typeof item.sharedEscalators!=='boolean'||!Number.isInteger(item.floor)||item.floor<-200||item.floor>200||!finite(item.amount,0,1000000)||item.kind!=='restaurant'&&!Number.isInteger(item.amount)||item.kind==='auditorium'&&item.mode!=='external'||!Array.isArray(item.groups)||item.groups.length<1||item.groups.length>20)errors.push('Dados de componente complementar inválidos.');if(item?.mode==='external'){try{const child=auxiliaryStudy(s,item);errors.push(...validateStudy(child).map(e=>`${item.label}: ${e}`));}catch(error){errors.push(`${item.label}: ${error.message}`);}}}
  if(!USES[s.use])errors.push('Escolha uma aplicação disponível. Uso misto deve ser analisado em estudos separados.');
  if(!finite(s.population,0,1000000))errors.push('A população deve estar entre zero e 1.000.000.');
  if(s.population===0){try{if(populationStatus(s).calculated!==0)errors.push('População zero só pode ser aplicada após um cálculo populacional com exclusões comprovadas.');}catch{errors.push('População zero requer memória populacional válida.');}}
  if(!['excel-v3','precision'].includes(s.method))errors.push('Selecione um método de cálculo disponível.');

  if(!Array.isArray(s.groups)||s.groups.length<1||s.groups.length>(s.fleetProjectionVersion===1?600:MAX_GROUPS))return [...errors,`Informe entre 1 e ${MAX_GROUPS} grupos de elevadores.`];
  s.groups.forEach((g,i)=>{
    if(manufacturerMissing(g))g=normativePlaceholder(g);const p=`Grupo ${i+1}: `;if(g.use!==undefined&&(!USES[g.use]||g.use==='auditorium'))errors.push(p+'aplicação do edifício inválida.');
    for(const [key,label,min,max,integer] of [['count','quantidade',1,30,true],['capacity','lotação',1,100,true],['stops','paradas incluindo acesso',2,200,true],['travel','percurso em metros',.1,1000,false],['width','abertura em mm',300,4000,true],['jerk','jerk',.01,20,false],['open','tempo de abertura',.01,60,false],['close','tempo de fechamento',.01,60,false],['passenger','tempo por passageiro',.01,60,false],['start','tempo adicional de partida',0,60,false]]){
      if(key==='passenger'&&g.transferMode==='per-stop')continue;if(!finite(g[key],min,max)||(integer&&!Number.isInteger(g[key])))errors.push(p+label+` deve estar entre ${min} e ${max}${integer?' e ser inteiro':''}.`);
    }
    if(g.transferMode!==undefined&&!['per-stop','per-person'].includes(g.transferMode))errors.push(p+'base de transferência inválida.');if(g.transferMode==='per-stop'&&!finite(g.transferPerStop,.01,3600))errors.push(p+'tempo de entrada e saída deve estar entre 0,01 e 3.600 s/parada.');
    if(g.startsLimit!==undefined&&g.startsLimit!==null&&(!finite(g.startsLimit,0,100000)||!Number.isInteger(g.startsLimit)))errors.push(p+'limite de partidas por hora deve ser um inteiro entre 0 e 100.000; 0 significa não informado.');
    if(typeof g.acceleration!=='number'||!Number.isFinite(g.acceleration)||g.acceleration<=0)errors.push(p+'aceleração deve ser um número maior que zero.');
    if(typeof g.speed!=='number'||!Number.isFinite(g.speed)||g.speed<=0)errors.push(p+'velocidade em m/s deve ser um número maior que zero.');
    if(!DOORS[g.door])errors.push(p+'tipo de porta inválido.');if(g.preOpeningEnabled&&(!finite(g.preOpening,0,60)||g.preOpening>g.open))errors.push(p+'abertura antecipada deve estar entre zero e o tempo de abertura da porta.');
  });

  // Operational validation is centralized in validateOperation; inactive profile inputs are preserved.
  return errors;
}
export function accelerationTime(speed,method='excel-v3'){
  if(!Number.isFinite(speed)||speed<=0)return NaN;
  // Below the first table point, retain the v3 workbook's <= 0.63 bucket.
  // This extension is explicitly identified as a project assumption in results and UI.
  if(speed<.63)return 2.5;
  if(speed>2.5)return 6;
  if(method==='excel-v3')return ACCEL_TABLE.find(([v])=>speed<=v)[1];
  if(speed<=.63)return 2.5;
  for(let i=1;i<ACCEL_TABLE.length;i++)if(speed<=ACCEL_TABLE[i][0]){const [lo,tlo]=ACCEL_TABLE[i-1],[hi,thi]=ACCEL_TABLE[i];return tlo+(speed-lo)/(hi-lo)*(thi-tlo);}
}
export function manufacturerAcceleration(g,method){
  if(method==='precision'&&g.speed<g.acceleration**2/g.jerk)return 4*Math.sqrt(g.speed/g.jerk);
  return 2*(g.speed/g.acceleration+g.acceleration/g.jerk);
}
export const trafficRate=s=>isIso(s)?isoCriteria(s,s.groups.reduce((sum,g)=>sum+g.count,0)).rate:s.use==='auditorium'?s.auditoriumDemandPercent/100:USES[s.use]?.rate;
export const studyInterval=(s,count)=>isIso(s)?isoCriteria(s,count).limit:s.use==='auditorium'?s.auditoriumInterval:maxInterval(s.use,count);
export function maxInterval(use,count){if(use==='residential')return null;return count===1?80:count===2?60:count===3?50:['offices','single'].includes(use)?40:45;}
export function calculateGroup(g,method='excel-v3'){
  let n=g.stops-(g.stops-1)*((g.stops-2)/(g.stops-1))**g.capacity;
  if(method==='excel-v3')n=round(n);
  function cycle(ta,door,passenger,start=0,manufacturer=false){const preOpening=manufacturer&&g.preOpeningEnabled?g.preOpening||0:0;const t1=2*g.travel/g.speed,t2=n/2*ta,t3=n*Math.max(0,door-preOpening),t4=manufacturer&&g.transferMode==='per-stop'?n*g.transferPerStop:g.capacity*passenger,additional=.1*(t3+t4),total=t1+t2+t3+t4+additional+start;return {transferMode:manufacturer&&g.transferMode==='per-stop'?'per-stop':'per-person',transferPerStop:manufacturer&&g.transferMode==='per-stop'?g.transferPerStop:null,acceleration:ta,door:door-preOpening,doorRaw:door,preOpening,passenger,start,t1,t2,t3,t4,additional,total,capacityPerCar:300*g.capacity/total,capacity:300*g.capacity*g.count/total,interval:total/g.count};}
  return {id:g.id,label:g.label,count:g.count,stops:n,normative:cycle(accelerationTime(g.speed,method),DOORS[g.door].time,g.width<1100?2.4:2),manufacturer:cycle(manufacturerAcceleration(g,method),g.open+g.close,g.transferMode==='per-stop'?g.transferPerStop:g.passenger,g.start,true)};
}
export function aggregate(groups,key){const count=groups.reduce((a,g)=>a+g.count,0),capacity=groups.reduce((a,g)=>a+g[key].capacity,0),interval=groups.reduce((a,g)=>a+g[key].total*g.count,0)/count**2;return {count,capacity,interval,homogeneous:groups.every(g=>Math.abs(g[key].total-groups[0][key].total)<1e-9)};}
const gcd=(a,b)=>b?gcd(b,a%b):a;
export function minimumElevators(s,key='normative',groups=s.groups.map(g=>calculateGroup(g,s.method))){
  if(!s.commonService)return null;
  if(s.population===0)return {count:0,counts:s.groups.map(()=>0),capacity:0,interval:null,limit:null,blocks:0,homogeneous:true};
  const divisor=s.groups.reduce((n,g)=>gcd(n,g.count),0),baseCounts=s.groups.map(g=>g.count/divisor),baseCount=baseCounts.reduce((a,b)=>a+b,0);
  const capacity=groups.reduce((sum,g,i)=>sum+g[key].capacityPerCar*baseCounts[i],0),interval=groups.reduce((sum,g,i)=>sum+g[key].total*baseCounts[i],0)/baseCount**2,required=s.population*trafficRate(s);
  let blocks=Math.max(1,Math.ceil(required/capacity));
  while(baseCount*blocks<4&&studyInterval(s,baseCount*blocks)!==null&&interval/blocks>studyInterval(s,baseCount*blocks))blocks++;
  const limit=studyInterval(s,baseCount*blocks);
  if(limit!==null&&interval/blocks>limit)blocks=Math.max(blocks,Math.ceil(interval/limit));
  if(capacity*blocks<required)blocks++;
  const count=baseCount*blocks;
  if(!Number.isSafeInteger(count))throw new Error('Parâmetros excedem a precisão numérica disponível para o dimensionamento. Revise velocidade e percurso.');
  return {count,counts:baseCounts.map(n=>n*blocks),capacity:capacity*blocks,interval:interval/blocks,limit:studyInterval(s,count),blocks,homogeneous:groups.every(g=>Math.abs(g[key].total-groups[0][key].total)<1e-9)};
}
export function minimumMessage(s,minimum){
  if((s.groupCalculationVersion===1||s.groups.some(g=>g.use))&&!s.groupAnalysisChild&&new Set(s.groups.map(g=>g.logicalGroupId||g.id)).size>1)return 'Consulte a quantidade mínima e a condição de atendimento de cada grupo no estudo separado. Grupos com pavimentos coincidentes avaliam a mesma demanda independentemente; seus resultados não devem ser somados como garantia de atendimento.';
  if(minimum.iso)return isoMinimumMessage(s,minimum.iso);
  if(s.population===0)return 'Demanda populacional de elevadores igual a zero nas exclusões confirmadas deste estudo. Mínimo pelo critério de tráfego: 0. Paradas e percurso são preservados; verificar as demais exigências do projeto e acessibilidade.';
  if(minimum.normative&&!minimum.manufacturer)return 'Mínimo NBR: '+minimum.normative.count+' elevador(es). Comparação do fabricante pendente.';if(!minimum.normative||!minimum.manufacturer)return 'Destinos diferentes dentro do grupo: consulte os resultados, a população e os mínimos de cada zona.';
  if(!s.commonService)return 'Zoneamento: calcule a quantidade mínima separadamente por zona e sua população.';
  const n=minimum.normative,m=minimum.manufacturer,composition=n.counts.map((count,i)=>`${s.groups[i]?.logicalGroupId?s.groups[i].label:'Grupo '+(i+1)}: ${count}`).join('; ');
  return `Quantidade informada: ${s.groups.reduce((sum,g)=>sum+g.count,0)} elevador(es). ${s.groups.reduce((sum,g)=>sum+g.count,0)<n.count?'Quantidade insuficiente para atender a população e o intervalo, mantendo esta composição. ':''}Quantidade mínima estimada para a população informada: ${n.count} elevador(es) ${s.use==='auditorium'?'pelo ciclo da NBR com demanda e intervalo de projeto':'pela referência normativa'} e ${m.count} pelos dados do fabricante. Composição normativa: ${composition}. Mantidas as características e a proporção entre os grupos informados, com atendimento simultâneo da capacidade em 5 minutos e do intervalo aplicável. ${n.homogeneous?'':'Para ciclos diferentes, o intervalo consolidado é uma aproximação por quantidade; confirme por análise de despacho. '}`;
}
export function calculateStudy(s,{populationApplied=false}={}){if(isBasic(s))return calculateBasic(s).results;if(s.populationCalc?.floorSequenceVersion===2&&!populationApplied)return recalculatePopulationAndStudies(s).results;if(hasFleet(s)){const projected=synchronizeFloorTable(projectFleet(s));projected.groups.forEach(g=>applyDimensionReference(g));const calculated=calculateStudy(projected,{populationApplied:true});calculated.calculationStudy=projected;calculated.fleetIndividualized=true;return calculated;}if((s.groupCalculationVersion===1||s.groups.some(g=>g.use))&&!s.groupAnalysisChild&&new Set(s.groups.map(g=>g.logicalGroupId||g.id)).size>1)return calculateIndependentGroups(s);if(s.floorTable?.enabled&&floorZones(s).length>1)return calculateFloorZonedStudy(s);const errors=validateStudy(s);if(errors.length)throw new Error(errors.join('\n'));if(!isIso(s)&&s.groups.some(manufacturerMissing))return normativeOnly(s);if(isIso(s))return finalizeAnalysis(s,calculateIsoStudy(s,{engineVersion:ENGINE_VERSION,auxiliary:calculateAuxiliary(s)}));const groups=s.groups.map(g=>{const r=calculateGroup(g,s.method);r.travelCurves=calculateGroupTravel(g,{probableStops:r.stops,dwell:s.operation.dwell});return r;}),normative=aggregate(groups,'normative'),manufacturer=aggregate(groups,'manufacturer'),required=s.population*trafficRate(s),limit=studyInterval(s,normative.count);
  if(groups.some(g=>['normative','manufacturer'].some(key=>Object.entries(g[key]).filter(([k])=>!['transferMode','transferPerStop'].includes(k)).some(([,v])=>!Number.isFinite(v)))))throw new Error('Velocidade fora da precisão numérica disponível. Informe um valor positivo que permita calcular os tempos de viagem.');
  for(const a of [normative,manufacturer]){a.populationShare=s.population>0?a.capacity/s.population*100:null;a.capacityPass=s.commonService?a.capacity>=required:null;a.intervalPass=!s.commonService||limit===null?null:a.interval<=limit;a.margin=a.capacity-required;}
  const warnings=populationWarnings(s),parameterWarnings=[],motionWarnings=[];if(new Set(s.groups.map(g=>g.stops)).size>1)warnings.push('Aviso: conjuntos com paradas diferentes. O cálculo não foi bloqueado; confira hall, acesso e uso e organize destinos por zona na matriz de pavimentos.');
  const minimum={normative:minimumElevators(s,'normative',groups),manufacturer:minimumElevators(s,'manufacturer',groups)};
  if(s.commonService)warnings.push(minimumMessage(s,minimum));
  s.groups.forEach((g,i)=>{
    const check=travelCheck(g);
    if(check.below)parameterWarnings.push(`Grupo ${i+1}: percurso ${g.travel.toFixed(2).replace('.',',')} m inferior a ${check.minimum.toFixed(2).replace('.',',')} m = (${g.stops} − 1) × 2,80 m. Verifique o percurso e o número de paradas. Critério de projeto informado pelo usuário.`);
    if(g.open+g.close>DOORS[g.door].time)parameterWarnings.push(`Grupo ${i+1}: abertura e fechamento informados somam ${decimal(g.open+g.close)} s, acima da referência de ${decimal(DOORS[g.door].time)} s da NBR 5665, tabela 3. Risco de redução de performance; a tabela é referência do cálculo e não um limite universal de segurança.`);if(g.preOpeningEnabled)parameterWarnings.push(`Grupo ${i+1}: pré-abertura FAB de ${decimal(g.preOpening)} s descontada das portas em cada parada provável. Premissa do fornecedor; não modifica o cálculo NBR.`);
    if(g.speed<.63)parameterWarnings.push(`Grupo ${i+1}: velocidade abaixo de 0,63 m/s. Adotados 2,50 s para aceleração/retardamento como premissa de projeto para velocidades abaixo da faixa da tabela; extensão, não valor tabelado na NBR 5665 fornecida. Confirmar com o fabricante.`);
  });
  s.groups.forEach((g,i)=>{const check=motionCheck(g),a=accelerationMessage(g),j=jerkMessage(g);if(a)motionWarnings.push({kind:'acceleration',severity:check.accelerationRed?'red':'yellow',group:i+1,message:`Grupo ${i+1}: ${a}`});if(j)motionWarnings.push({kind:'jerk',severity:'yellow',group:i+1,message:`Grupo ${i+1}: ${j}`});});
  warnings.push(...parameterWarnings,...motionWarnings.map(w=>w.message));
  if(!s.commonService)warnings.push('Conjuntos independentes: a soma é apenas informativa. Cada zona precisa de população e critérios próprios. Não há conclusão consolidada.');
  if(!normative.homogeneous)warnings.push('Tempos diferentes: o intervalo consolidado Σ(T × quantidade) / quantidade total² é uma estimativa de consolidação por quantidade. É uma aproximação, sem equivaler a uma simulação de despacho. I = T / ne é exibido por conjunto.');
  if(s.use==='auditorium')warnings.push(`Auditório: população por assentos; demanda de ${s.auditoriumDemandPercent}% em 5 min e intervalo máximo de ${s.auditoriumInterval} s são premissas informadas pelo usuário. As normas fornecidas não fixam relação ou percentual específico para auditórios. Ciclo da NBR 5665 utilizado como método de estudo. Não é conclusão normativa do uso auditório.`);
  warnings.push('Precisão integral de interpolação: paradas prováveis sem arredondamento intermediário e interpolação linear entre velocidades da tabela 2. Acima de 2,5 m/s, 6 s.');
  s.groups.forEach((g,i)=>{if(s.method==='excel-v3'&&g.speed<g.acceleration**2/g.jerk)warnings.push(`Grupo ${i+1}: a expressão de aceleração opera fora do regime trapezoidal.`);});
  if(s.operation.dwell>0&&s.operation.dwell<6)warnings.push('Permanência de porta aberta abaixo da referência de 6 s para mobilidade reduzida. Ajuste deve ser analisado pelo responsável técnico.');
  const starts=calculateStarts(s,groups,required);warnings.push(...starts.warnings);
  return finalizeAnalysis(s,{engineVersion:ENGINE_VERSION,model:'nbr5665',starts,groups,normative,manufacturer,required,rate:trafficRate(s),limit,warnings,parameterWarnings,motionWarnings,minimum,population:populationStatus(s),hasLowSpeed:s.groups.some(g=>g.speed<.63),auxiliary:calculateAuxiliary(s),deltaCapacity:manufacturer.capacity-normative.capacity,deltaPercent:(manufacturer.capacity/normative.capacity-1)*100});
}
function finalizeAnalysis(study,result){const transport=transportOptions(study);result.rollingTransport={enabled:transport.rolling===true,relation:'capacityHourly × count × periodMinutes/60 × utilizationPercent/100',localSegments:transport.rolling===true?(transport.walkwaysRows||[]).map(row=>({id:row.id,label:row.label,...walkwayTraffic(study,row)})):[]};result.dimensionReferences=study.groups.map(g=>({id:g.id,logicalGroupId:g.logicalGroupId||g.id,label:g.label,cars:referenceForCars(study,g)}));const principal=accessRow(study.floorTable),notice=accessMarkNotice(study.floorTable);if(study.floorTable?.enabled&&principal)result.buildingAccess={id:principal.id,mark:principal.mark};if(notice&&!result.warnings.includes(notice))result.warnings.push(notice);if(study.floorTable?.enabled)result.floorTable=clone(study.floorTable);try{const issues=validateOperation(study.operation);if(issues.length)throw Error(issues.join(' '));result.performance=calculatePerformance(study,result);}catch(error){result.performance={available:false,message:error.message,charts:[],rows:[]};result.warnings.push('Perfis de operação pendentes: '+error.message);}result.warnings.push(...validateStudyDimensions(study));try{const issues=validateEnergy(study.energy,study.groups);if(issues.length)throw Error(issues.join(' '));result.energy=calculateEnergy(study,result);}catch(error){result.energy={enabled:true,available:false,message:error.message};}return result;}
export function defaultAuxiliary(kind='garage',index=0){return {id:'aux'+Date.now().toString(36)+Math.random().toString(36).slice(2,6),kind,label:({garage:'Garagem',restaurant:'Restaurante',auditorium:'Auditório'}[kind])+' '+(index+1),mode:kind==='auditorium'?'external':'exclusive',floor:1,sharedEscalators:false,amount:kind==='auditorium'?100:0,conditionsConfirmed:false,groups:[defaultGroup()],auditoriumDemandPercent:100,auditoriumInterval:60};}
export function auxiliaryStudy(parent,item){
 if(item.mode!=='external')throw new Error('Uso exclusivo registrado como exclusão, sem demanda independente.');
 if(!['garage','restaurant','auditorium'].includes(item.kind))throw new Error('Uso complementar inválido.');
 if(item.kind==='garage'&&!item.conditionsConfirmed)throw new Error('Confirme garagem com rampas e sem manobrista para aplicar 1,4 pessoa por vaga.');
 const row=normalizePopulationRow({...defaultPopulationRow(item.kind),...item,mode:'main',servedByEscalator:!!item.sharedEscalators},item.kind);delete row.groups;
 const child={...clone(parent),name:item.label.slice(0,120),use:item.kind,auxiliary:[],groups:clone(item.groups),commonService:true,populationCalc:defaultPopulationCalc(item.kind),auditoriumDemandPercent:item.auditoriumDemandPercent,auditoriumInterval:item.auditoriumInterval};
  delete child.floorTable;child.operation=item.operation||((parent.operation?.profile==='measured')?defaultOperation():clone(parent.operation));
 row.streetAccessContext=parent.populationCalc.rows.some(item=>item.isStreetAccess)&&row.floor===parent.populationCalc.accessFloor;if(row.streetAccessContext)row.isStreetAccess=true;child.populationCalc.rows=[row];child.populationCalc.accessFloor=parent.populationCalc.accessFloor??0;
 if(item.sharedEscalators){
  const options=populationOptions(parent),main=calculatePopulation(parent.use,parent.populationCalc.rows,options);
  child.populationCalc.accessFloor=options.accessFloor;child.populationCalc.escalators=clone(options.escalators);
  child.populationCalc.additionalLines=[...main.lines.filter(line=>(line.mode==='main'||line.mode==='external'&&line.escalatorRequested)&&(item.rowIndex!==undefined?line.index!==item.rowIndex:item.id===undefined||line.id!==item.id)),...options.additionalLines.filter(line=>line.sourceId!==item.id)].map(line=>({...clone(line),escalatorRequested:!!line.escalatorRequested}));
 }
 if(isIso(child))child.isoConfig={...defaultIsoConfig(),...child.isoConfig};const population=calculatePopulation(item.kind,[row],populationOptions(child));
 child.population=population.value;child.populationBasis=population.basis+' Estudo separado para demanda externa; os elevadores e percursos deste uso são definidos separadamente.';
 child.populationCalc.last=populationSnapshot(child);return child;
}
export function calculateAuxiliary(parent){return complementaryItems(parent).map(item=>{
 if(item.mode==='exclusive'&&item.kind!=='auditorium')return {id:item.id,label:item.label,kind:item.kind,excluded:true,population:0,basis:'Uso exclusivo da edificação: população desconsiderada do cálculo, conforme '+(isIso(parent)?'documento ISO informado, 4.3.2.11 / 4.3.3.5':'NBR 5665, 5.1.7')+'. Preservar paradas e percurso. Não lançar a mesma área ou vagas nas composições principais.'};
 const study=auxiliaryStudy(parent,item);return {id:item.id,label:item.label,kind:item.kind,excluded:false,study,population:study.population,basis:study.populationBasis,results:calculateStudy(study)};
});}
export function recalculatePopulationAndStudies(study){
 if(isBasic(study))return calculateBasic(study);
 const next=study.floorTable?.enabled?synchronizeFloorTable(study):clone(study);if(next.groups[0]?.use)next.use=next.groups[0].use;const population=calculatePopulation(next.use,next.populationCalc.rows,populationOptions(next));
 if(next.floorTable?.enabled)for(const line of population.lines)if(line.mode==='main'&&line.net>0&&!next.groups.some(g=>servedFloors(next,g).some(f=>f.mark===line.servedFloorMark)))throw Error(`Andar ${line.servedFloorMark}: população sem grupo de elevadores que o atenda.`);next.population=population.value;next.populationBasis=population.basis+(next.populationDefinition?.trim()?'\nComo a população foi definida: '+next.populationDefinition.trim(): '');next.populationCalc.last=populationSnapshot(next);
 const results=calculateStudy(next,{populationApplied:true});
 return {study:next,results,population};
}
const PROFILE={moderate:{public:[.03,.04,.05,.07,.1,.14,.16,.14,.1,.07,.05,.05],charter:[0,0,0,.05,.1,.25,.35,.15,.05,.03,.02,0]},heavy:{public:[.01,.02,.03,.05,.08,.15,.25,.18,.1,.06,.04,.03],charter:[0,0,0,.02,.08,.2,.4,.2,.07,.03,0,0]}};
const LUNCH=[.02,.04,.07,.1,.15,.12,.12,.15,.1,.07,.04,.02];
const normalize=a=>{const sum=a.reduce((x,y)=>x+y,0);return a.map(v=>v/sum);};
export function simulate(s,r=calculateStudy(s)){
  if(isIso(s))return {supported:false,message:'Modelo ISO parametrizado: não foi executada a simulação de 2 horas da seção 8.'};
  const o=s.operation,p=o.profile==='light'?{public:Array(12).fill(1/12),charter:Array(12).fill(1/12)}:PROFILE[o.profile],pub=normalize(p.public),cha=normalize(p.charter),lunch=normalize(LUNCH),fraction=o.profile==='heavy'?.95:.8;
  const capacity=r.groups.reduce((sum,g,i)=>sum+300*s.groups[i].capacity*g.count/(g[o.basis].total+g.stops*o.dwell),0);
  const demand=pub.map((v,i)=>s.population*fraction*((1-o.charter/100)*v+o.charter/100*cha[i]));let qIn=0,qOut=0,qLunch=0;
  const rows=demand.map((arrival,i)=>{const departure=demand[11-i],midday=s.population*o.lunch/100*lunch[i];qIn=Math.max(0,qIn+arrival-capacity);qOut=Math.max(0,qOut+departure-capacity);qLunch=Math.max(0,qLunch+midday-capacity);return {minute:(i+1)*5,arrival,departure,lunch:midday,capacity,queueIn:qIn,queueOut:qOut,queueLunch:qLunch,waitProxy:qIn/capacity*5};});
  return {rows,capacity,fraction,peakArrival:Math.max(...demand),maxQueue:Math.max(...rows.map(r=>r.queueIn)),maxQueueLunch:Math.max(...rows.map(r=>r.queueLunch)),maxQueueOut:Math.max(...rows.map(r=>r.queueOut)),maxWaitProxy:Math.max(...rows.map(r=>r.waitProxy)),profileNormalized:o.profile==='heavy'};
}


function calculateFloorZonedStudy(source){
 const s=synchronizeFloorTable(source),errors=validateBuildingFloors(s);if(errors.length)throw Error(errors.join('\n'));
 const p=calculatePopulation(s.use,s.populationCalc.rows,populationOptions(s)),zones=floorZones(s),owners=new Map();
 for(const z of zones)for(const f of z.floors.filter(f=>f.level!==0)){if(owners.has(f.mark)&&p.lines.some(l=>l.mode==='main'&&l.servedFloorMark===f.mark&&l.net>0))throw Error(`Andar ${f.mark}: grupos com destinos diferentes se sobrepõem. Defina a distribuição da demanda em estudos específicos ou use o mesmo conjunto de pavimentos; não duplicar a população entre zonas.`);owners.set(f.mark,z.key);}
 for(const line of p.lines)if(line.mode==='main'&&line.net>0&&!owners.has(line.servedFloorMark))throw Error(`Andar ${line.servedFloorMark}: população sem grupo de elevadores que o atenda.`);
 const calculated=zones.map((z,i)=>{const marks=new Set(z.floors.map(f=>f.mark)),child=clone(s);delete child.floorTable;delete child.modelDrafts;child.name=(s.name+' · zona '+(i+1)).slice(0,120);child.groups=clone(z.groups);child.commonService=true;child.auxiliary=[];if(s.operation.profile==='measured'){child.operation=defaultOperation();child.operation.schedule=clone(s.operation.schedule);}child.populationCalc.rows=child.populationCalc.rows.filter(r=>r.mode==='main'&&marks.has(r.servedFloorMark));if(!child.populationCalc.rows.length)child.populationCalc.rows=[{...defaultPopulationRow(s.use),label:'Acesso da zona',amount:0,floor:0,floorMark:'0',servedFloorMark:accessRow(s.floorTable)?.mark||'0',servedFloorLevel:0,isStreetAccess:true}];child.populationCalc.last=null;child.populationCalc.additionalLines=p.lines.filter(l=>!marks.has(l.servedFloorMark)).map(l=>({floor:l.floor,beforeEscalator:l.beforeEscalator,escalatorRequested:false}));const c=recalculatePopulationAndStudies(child);return {label:'Zona '+(i+1),floorMarks:[...marks],study:c.study,results:c.results,population:c.study.population};});
 const groups=s.groups.map(g=>calculated.flatMap(z=>z.results.groups).find(r=>r.id===g.id)),iso=isIso(s),aggregateKey=iso?'iso':'normative',base=clone(calculated[0].results),total=(key)=>({count:groups.reduce((n,g)=>n+g.count,0),capacity:groups.reduce((n,g)=>n+g[key].capacity,0),interval:null,capacityPass:null,intervalPass:null,homogeneous:false,margin:null,populationShare:null});
 base.groups=groups;base.population=populationStatus(s);base.required=s.population*trafficRate(s);base.rate=trafficRate(s);base.limit=null;base.zones=calculated;base.zoneSeparated=true;base.floorTable=clone(s.floorTable);base[aggregateKey]=total(aggregateKey);if(!iso){base.manufacturer=total('manufacturer');base.minimum={normative:null,manufacturer:null};base.deltaPercent=null;base.deltaCapacity=null;}else{base.minimum={iso:{...base.minimum.iso,count:calculated.reduce((n,z)=>n+z.results.minimum.iso.count,0),counts:s.groups.map(g=>{const z=calculated.find(z=>z.study.groups.some(x=>x.id===g.id));return z.results.minimum.iso.counts[z.study.groups.findIndex(x=>x.id===g.id)];})}};}
 const startRows=s.groups.map(g=>{const z=calculated.find(z=>z.study.groups.some(x=>x.id===g.id)),i=z.study.groups.findIndex(x=>x.id===g.id);return {...z.results.starts.rows[i],label:g.label,zone:z.label};});base.starts={...calculated[0].results.starts,peakPeoplePerHour:calculated.reduce((n,z)=>n+z.results.starts.peakPeoplePerHour,0),hasDemandAllocation:true,rows:startRows,totalRequired:startRows.reduce((n,r)=>n+r.requiredGroup,0),totalMaximum:startRows.reduce((n,r)=>n+r.maximumGroup,0),pass:startRows.every(r=>r.pass),allLimitsProvided:startRows.every(r=>r.manufacturerLimit!==null),warnings:calculated.flatMap(z=>z.results.starts.warnings)};base.warnings=['Destinos diferentes: resultados e mínimos avaliados por zona e população própria. Capacidade somada é informativa, sem conclusão global de intervalo.',...calculated.flatMap(z=>z.results.warnings.map(w=>z.label+': '+w))];if(s.operation.profile==='measured')base.warnings.push('Medições globais não foram distribuídas automaticamente entre zonas. Perfis por zona são hipóteses estimadas; cadastre medições segregadas em estudos próprios.');base.auxiliary=calculateAuxiliary(s);return finalizeAnalysis(s,base);
}

// Independent logical groups retain all their equipment batches in the same context.
function calculateIndependentGroups(source){
 const s=clone(source),population=calculatePopulation(s.use,s.populationCalc.rows,populationOptions(s));
 const ids=[...new Set(s.groups.map(g=>g.logicalGroupId||g.id))];
 const contexts=ids.map(id=>{
  const child=clone(s),groups=s.groups.filter(g=>(g.logicalGroupId||g.id)===id);
  const rows=s.floorTable?.enabled?s.floorTable.rows.filter(r=>groups.some(g=>r.served[g.id])):null,marks=rows?new Set(rows.map(r=>r.mark)):null;
  child.groupAnalysisChild=true;child.use=groups[0].use||s.use;child.populationApplications=populationOptions(s).applications;child.groups=clone(groups);delete child.modelDrafts;child.auxiliary=[];child.commonService=true;
  child.populationCalc.rows=child.populationCalc.rows.filter(r=>r.mode!=='main'||!marks||marks.has(r.servedFloorMark));
  if(!child.populationCalc.rows.length)child.populationCalc.rows=[{...defaultPopulationRow(s.use),label:'Acesso do grupo',amount:0,floor:0,floorMark:'0',servedFloorMark:accessRow(s.floorTable)?.mark||'0',servedFloorLevel:0,isStreetAccess:true}];
  child.populationCalc.last=null;
  child.populationCalc.additionalLines=population.lines.filter(l=>marks&&!marks.has(l.servedFloorMark)).map(l=>({floor:l.floor,beforeEscalator:l.beforeEscalator,escalatorRequested:false}));
  child.populationCalc.escalators=populationOptions(child).escalators;
  // Global counts cannot be silently attributed to each group.
  if(s.operation.profile==='measured'){child.operation=defaultOperation();child.operation.schedule=clone(s.operation.schedule);}
  const label=groups[0].logicalGroupLabel||groups[0].label,c=recalculatePopulationAndStudies(child);
  return {id,label,study:c.study,results:c.results,population:c.study.population,floorMarks:marks?[...marks]:[],basis:'População dos pavimentos servidos por este grupo. Sobreposições entre grupos são estudos independentes, sem divisão automática da demanda.'};
 });
 let result;
 try{if(new Set(s.groups.map(g=>g.use||s.use)).size>1)throw Error('Aplicações distintas por grupo');result=calculateStudy({...s,groupAnalysisChild:true},{populationApplied:true});}
 catch(error){
  if(!/grupos com destinos diferentes se sobrepõem|Aplicações distintas por grupo/.test(error.message))throw error;
  result=clone(contexts[0].results);const rows=contexts.flatMap(c=>c.results.groups);result.groups=rows;result.zoneSeparated=false;delete result.zones;
  for(const key of isIso(s)?['iso']:['normative','manufacturer'])result[key]={...result[key],count:rows.reduce((n,g)=>n+g.count,0),capacity:rows.reduce((n,g)=>n+g[key].capacity,0)};
  result.required=contexts.reduce((n,c)=>n+c.results.required,0);result.rate=null;result.population=populationStatus(s);result.auxiliary=calculateAuxiliary(s);
  const starts=contexts.flatMap(c=>c.results.starts.rows);result.starts={...result.starts,rows:starts,peakPeoplePerHour:contexts.reduce((n,c)=>n+c.results.starts.peakPeoplePerHour,0),pass:starts.every(x=>x.pass),allLimitsProvided:starts.every(x=>x.manufacturerLimit!==null),totalRequired:starts.reduce((n,x)=>n+x.requiredGroup,0),totalMaximum:starts.reduce((n,x)=>n+x.maximumGroup,0)};result=finalizeAnalysis(s,result);
 }
 result.zoneSeparated=false;delete result.zones;result.groupSeparated=true;result.groupStudies=contexts;result.calculationStudy=s;
 for(const key of isIso(s)?['iso']:['normative','manufacturer'])Object.assign(result[key],{capacityPass:null,intervalPass:null,interval:null,margin:null});
 result.limit=null;result.warnings=[...new Set([...result.warnings,'Grupos avaliados separadamente. Somas de capacidade e partidas são informativas; não representam uma conclusão comum.'])];
 if(s.operation.profile==='measured')result.warnings.push('Medições globais não foram distribuídas entre grupos. Os gráficos por grupo usam perfis estimados; cadastre medições segregadas em estudos próprios para analisar o modelo real.');
 return result;
}
