import {parametersOnly,operationallyEnabled} from './escalator-policy.js';
import {allocateEscalatorPopulation} from './escalator-allocation.js';
import {validateEscalatorNetwork,calculateEscalatorNetwork} from './escalator-network.js';
// Capacities from the table supplied by the owner, or documented manufacturer data.
export const ESCALATOR_EXCLUSION_HELP='A exclusão populacional segue o definido na NBR 5665, item 5.1.6: pode ser desconsiderada a população dos pavimentos servidos por escadas rolantes ligadas ao pavimento de acesso, desde que tenham capacidade para transportar essa população. Para verificar a ligação neste estudo, o atendimento deve ser contínuo desde o pavimento imediatamente acima ou abaixo do principal até o pavimento analisado. Uma interrupção mantém no estudo a população dos pavimentos dependentes. O atendimento parcial por capacidade insuficiente é tratado separadamente como premissa de projeto: somente a parcela atendida deixa de ser computada; a diferença permanece nos elevadores.';
export const ESCALATOR_TABLE=[[600,4500,5850,6750],[800,6750,8775,10125],[1000,9000,11700,13500]];
export const ESCALATOR_TABLE_SOURCE='Tabela 1 de capacidade teórica da imagem fornecida pelo proprietário em 13/10/2026; edição de origem não identificada na imagem. Premissa documental do estudo, sem atribuição à NBR 16734.';
export function tableEscalatorCapacity(width,speed){const row=ESCALATOR_TABLE.find(row=>row[0]===width),column=[.5,.65,.75].indexOf(speed);return row&&column>=0?row[column+1]:null;}
export const ESCALATOR_WIDTHS={600:true,800:true,1000:true};
export const ESCALATOR_STANDARDS=[
 {title:'ABNT NBR 16734-1:2022',scope:'Escadas rolantes e esteiras rolantes — Parte 1: Requisitos de segurança para construção e instalação',published:'2022-09-28',href:'https://www.dinmedia.de/en/standard/abnt-nbr-16734-1/360299035'},
 {title:'ABNT NBR 16734-2:2023',scope:'Escadas rolantes e esteiras rolantes — Parte 2: Requisitos para a melhoria da segurança de escadas rolantes e esteiras rolantes existentes',published:'2023-01-31',href:'https://www.dinmedia.de/en/standard/abnt-nbr-16734-2/365188961'}
];
export const ESCALATOR_REFERENCE_HELP='Referências de segurança: ABNT NBR 16734-1:2022 e, para equipamentos existentes, ABNT NBR 16734-2:2023. Situação corrente conferida em 13/10/2026 no catálogo DIN Media. Adquira a edição oficial pela ABNT. A capacidade pode usar a tabela enviada pelo proprietário ou dados documentados do fabricante; os itens numéricos da edição atual ainda precisam de validação no texto oficial.';
export const NORM_EXCERPTS=[
 ['ABNT NBR 5665:1983 · 5.1.1 f','restaurantes: 1 pessoa por 1,5 m² de salão de refeição;'],
 ['ABNT NBR 5665:1983 · 5.1.1 h','edifícios-garagem com rampas, sem manobrista: 1,4 pessoas por vaga;'],
 ['ABNT NBR 5665:1983 · 5.2.1 e','restaurantes: 6%;'],
 ['ABNT NBR 5665:1983 · 5.2.1 h','edifícios-garagem com rampa, sem manobrista: 10%;'],
 ['ABNT NBR 5665:1983 · 5.1.2','Em qualquer tipo de edifício podem ser descontados 50% da população do pavimento imediatamente acima e/ou do pavimento imediatamente abaixo do pavimento de acesso, desde que estes pavimentos estejam situados a uma distância máxima de 5 m em relação ao pavimento de acesso.'],
 ['ABNT NBR 5665:1983 · 5.1.3','Nos edifícios escolares podem ser descontados 30% da população dos pavimentos acima e/ou imediatamente abaixo do pavimento de acesso, contidos dentro de uma distância máxima de 12 m em relação ao pavimento de acesso.'],
 ['ABNT NBR 5665:1983 · 5.1.6','Em qualquer tipo de edifício pode deixar de ser computada a população dos pavimentos servidos por escadas rolantes, desde que estas tenham ligação ao pavimento de acesso e capacidade para transportar essa população.'],
 ['ABNT NBR 5665:1983 · 5.1.7','Em qualquer tipo de edifício, as áreas de pavimentos utilizadas como restaurantes de utilização exclusiva, depósitos, garagens, mesmo quando servidas por elevadores, não deverão ser computadas para o cálculo da população.'],
 ['ABNT NBR 5665:1983 · nota de 5.1.7','Neste caso tais pavimentos deverão ser considerados para efeito de cálculo das paradas prováveis e do percurso.'],

];
export function defaultEscalatorLink(floor){return {floor,served:false,upPresent:false,downPresent:false,widthUp:800,widthDown:800,speedUp:.5,speedDown:.5,incline:30,rise:3,pairConfirmed:false,capacityUpHourly:0,capacityDownHourly:0,capacitySource:'',geometryConfirmed:false};}
export function defaultEscalators(){return {enabled:false,capacityBasis:'provided-table',aboveCount:3,belowCount:0,periodMinutes:5,demandPercent:100,utilizationPercent:100,capacityConfirmed:false,links:[1,2,3].map(defaultEscalatorLink)};}
export function layoutEscalators(config,accessFloor){
 const old=new Map((config.links||[]).map(link=>[link.floor,link]));
 const floors=[...Array.from({length:config.aboveCount},(_,i)=>accessFloor+i+1),...Array.from({length:config.belowCount},(_,i)=>accessFloor-i-1)];
 config.links=floors.map(floor=>old.get(floor)||defaultEscalatorLink(floor));return config;
}
const number=(v,min,max)=>typeof v==='number'&&Number.isFinite(v)&&v>=min&&v<=max;
export function validateEscalators(config,accessFloor=0){
 if(!config||config.enabled===false)return [];
 if(config.graphVersion===2)return validateEscalatorNetwork(config,accessFloor);if(config.graphVersion===1)return validateEscalatorGraph(config,accessFloor);
 const errors=[];
 if(config.capacityBasis!==undefined&&!['provided-table','manufacturer'].includes(config.capacityBasis))errors.push('Base de capacidade das escadas inválida.');
 if(typeof config.enabled!=='boolean')errors.push('Ativação das escadas rolantes inválida.');
 if(!Number.isInteger(accessFloor)||!number(accessFloor,-200,200))errors.push('Pavimento de acesso deve ser inteiro entre -200 e 200.');
 for(const key of ['aboveCount','belowCount'])if(!Number.isInteger(config[key])||!number(config[key],0,40))errors.push('Informe de 0 a 40 pavimentos acima e abaixo do acesso.');
 if(!Array.isArray(config.links)||config.links.length>80)return [...errors,'Tabela de escadas rolantes inválida.'];
 if(!number(config.periodMinutes,.1,120)||!number(config.demandPercent,.01,100)||!number(config.utilizationPercent,.01,100)||(!parametersOnly(config)&&typeof config.capacityConfirmed!=='boolean'))errors.push('Informe janela de 0,1 a 120 min e percentuais positivos até 100% nas escadas rolantes.');
 if(Number.isInteger(accessFloor)&&((Number.isInteger(config.aboveCount)&&accessFloor+config.aboveCount>200)||(Number.isInteger(config.belowCount)&&accessFloor-config.belowCount<-200)))errors.push('A faixa de pavimentos da rede deve permanecer entre -200 e 200.');
 const expected=new Set([...Array.from({length:Number.isInteger(config.aboveCount)&&config.aboveCount<=40?config.aboveCount:0},(_,i)=>accessFloor+i+1),...Array.from({length:Number.isInteger(config.belowCount)&&config.belowCount<=40?config.belowCount:0},(_,i)=>accessFloor-i-1)]);
 const seen=new Set();
 for(const link of config.links){
  if(!link||!expected.has(link.floor)||seen.has(link.floor))errors.push('Tabela de escadas: pavimento repetido ou fora da faixa declarada.');
  if(link)seen.add(link.floor);
  if(!link||['served','upPresent','downPresent',...(parametersOnly(config)?[]:['pairConfirmed'])].some(k=>typeof link[k]!=='boolean')||!ESCALATOR_WIDTHS[link.widthUp]||!ESCALATOR_WIDTHS[link.widthDown]||!number(link.speedUp,.01,2)||!number(link.speedDown,.01,2)||!number(link.incline,1,60)||!number(link.rise,.1,100))errors.push('Parâmetros de um trecho de escadas rolantes inválidos.');
 }
 for(const link of config.links)if(link&&(!number(link.capacityUpHourly??0,0,100000)||!number(link.capacityDownHourly??0,0,100000)||typeof (link.geometryConfirmed??false)!=='boolean'||typeof (link.capacitySource??'')!=='string'||(link.capacitySource??'').length>2000))errors.push('Capacidade, documento de origem ou confirmação técnica da escada rolante inválidos.');
 if(seen.size!==expected.size)errors.push('Complete a tabela de todos os pavimentos declarados.');
 return [...new Set(errors)];
}
export function escalatorCapacity(value){if(!number(value,0,100000))throw new Error('Capacidade do fabricante inválida; informe de 0 a 100.000 pessoas/h.');return value;}
export function normalizeEscalators(config){if(!config||!Array.isArray(config.links))return config;return {...config,capacityBasis:config.capacityBasis??'manufacturer',links:config.links.map(link=>({...defaultEscalatorLink(link.floor),...link}))};}
export function calculateEscalators(config,accessFloor,lines){
 if(!config?.enabled)return {enabled:false,segments:[],floors:{},excludedPopulation:0};
 if(config.graphVersion===2)return calculateEscalatorNetwork(config,accessFloor,lines);if(config.graphVersion===1)return calculateEscalatorGraph(config,accessFloor,lines);
 const errors=validateEscalators(config,accessFloor);if(errors.length)throw new Error(errors.join('\n'));
 const basis=config.capacityBasis??'manufacturer';
 const segments=config.links.map(link=>{
  const issues=[];
  if(!link.served)issues.push('trecho sem atendimento por escadas rolantes');
  if(!link.upPresent||!link.downPresent)issues.push('falta confirmar uma escada para subir e uma para descer');
  if(link.widthUp!==link.widthDown)issues.push('larguras diferentes no par de subida e descida');
  if(!parametersOnly(config)&&!link.pairConfirmed)issues.push('par de escadas não confirmado');
  if(!parametersOnly(config)&&!link.geometryConfirmed)issues.push('configuração de velocidade, inclinação e desnível não conferida com o fabricante e a norma atual');
  let up,down,source;
  if(basis==='provided-table'){up=tableEscalatorCapacity(link.widthUp,link.speedUp);down=tableEscalatorCapacity(link.widthDown,link.speedDown);source=ESCALATOR_TABLE_SOURCE;if(up===null||down===null)issues.push('largura ou velocidade fora da tabela enviada; use 0,50, 0,65 ou 0,75 m/s, ou dados documentados do fabricante');up=up??0;down=down??0;}
  else{if(!(link.capacityUpHourly>0)||!(link.capacityDownHourly>0)||!parametersOnly(config)&&!link.capacitySource?.trim())issues.push('informe as capacidades de subida e descida e o documento do fabricante');up=escalatorCapacity(link.capacityUpHourly??0);down=escalatorCapacity(link.capacityDownHourly??0);source=link.capacitySource||(parametersOnly(config)?'Capacidade declarada no trecho, sem documento cadastrado':'');}
  return {...link,capacitySource:source,from:link.floor+(link.floor>accessFloor?-1:1),issues,physicalPass:issues.length===0,capacityBasis:basis,hourlyUp:up,hourlyDown:down,capacityUp:up*config.periodMinutes/60*config.utilizationPercent/100,capacityDown:down*config.periodMinutes/60*config.utilizationPercent/100};
 });
 const byFloor=new Map(segments.map(segment=>[segment.floor,segment]));
 for(const segment of segments){
  const direction=segment.floor>accessFloor?1:-1,dependentFloors=[segment.floor];
  for(let floor=segment.floor+direction,visited=0;visited<80;floor+=direction,visited++){
   if(!byFloor.get(floor)?.physicalPass)break;dependentFloors.push(floor);
  }
  segment.population=lines.filter(line=>dependentFloors.includes(line.floor)).reduce((sum,line)=>sum+line.beforeEscalator,0);
  segment.dependentFloors=dependentFloors;segment.demand=segment.population*config.demandPercent/100;
  segment.capacityPass=segment.demand<=Math.min(segment.capacityUp,segment.capacityDown)+1e-8;
  segment.pass=segment.physicalPass&&segment.capacityPass;
  if(!segment.capacityPass)segment.issues.push('capacidade insuficiente para a população acumulada');
 }
 const floors={};
 for(const floor of new Set([...segments.map(s=>s.floor),...lines.map(line=>line.floor)])){
  if(floor===accessFloor){floors[floor]={excluded:false,reason:'Pavimento de acesso: mantido no estudo de elevadores.'};continue;}
  const direction=floor>accessFloor?1:-1,path=[];
  for(let current=accessFloor+direction;direction>0?current<=floor:current>=floor;current+=direction){path.push(byFloor.get(current));if(path.length>400)throw new Error('Pavimento fora da faixa de análise.');}
  const missing=path.findIndex(segment=>!segment||!segment.pass);
  const excluded=missing<0&&operationallyEnabled(config);
  const reason=missing>=0?`População mantida: descontinuidade ou impedimento entre ${accessFloor+direction*(missing+1)-direction} e ${accessFloor+direction*(missing+1)} (${path[missing]?.issues.join('; ')||'trecho não cadastrado'}). Este pavimento e os dependentes além dele são considerados nos elevadores.`:!operationallyEnabled(config)?'População mantida: confirme a capacidade operacional e a ligação contínua ao acesso.':'População desconsiderada no estudo de elevadores: ligação contínua ao acesso, par de mesma largura confirmado e capacidade suficiente nas premissas informadas (NBR 5665, 5.1.6).';
  floors[floor]={excluded,reason,path:path.filter(Boolean).map(s=>s.floor)};
 }
 const excludedPopulation=lines.filter(line=>line.escalatorRequested&&floors[line.floor]?.excluded).reduce((sum,line)=>sum+line.beforeEscalator,0);
 return allocateEscalatorPopulation({enabled:true,accessSelected:config.accessSelected,capacityBasis:basis,referenceCheckedAt:'2026-10-13',accessFloor,periodMinutes:config.periodMinutes,demandPercent:config.demandPercent,utilizationPercent:config.utilizationPercent,confirmationPolicy:config.confirmationPolicy,capacityConfirmed:config.capacityConfirmed,segments,floors,excludedPopulation},lines);
}

function validateEscalatorGraph(config,accessFloor){
 const errors=[];if(typeof config.enabled!=='boolean'||!Number.isInteger(accessFloor))errors.push('Configuração do acesso das escadas inválida.');if(!Array.isArray(config.links)||config.links.length>80)return ['Cadastre até 80 trechos de escadas.'];if(!number(config.periodMinutes,.1,120)||!number(config.demandPercent,.01,100)||!number(config.utilizationPercent,.01,100)||(!parametersOnly(config)&&typeof config.capacityConfirmed!=='boolean')||!['provided-table','manufacturer'].includes(config.capacityBasis))errors.push('Janela, percentuais ou base das escadas inválidos.');
 const allowed=new Set([accessFloor,...(config.allowedFloors||[])]),seen=new Set();for(const l of config.links){if(!Number.isInteger(l.from)||!Number.isInteger(l.floor)||!allowed.has(l.from)||!allowed.has(l.floor))errors.push('Trecho de escadas: selecione somente andares com composição cadastrada, ou o acesso principal.');if(l.from===l.floor)errors.push('Origem e destino da escada devem ser diferentes.');if(Math.abs(l.from-accessFloor)>=Math.abs(l.floor-accessFloor)||l.from!==accessFloor&&Math.sign(l.from-accessFloor)!==Math.sign(l.floor-accessFloor))errors.push('O trecho deve partir de um andar mais próximo do acesso em direção ao pavimento atendido.');if(seen.has(l.floor))errors.push('Cada pavimento pode ter somente uma ligação em direção ao acesso nesta configuração.');seen.add(l.floor);const one={...config,graphVersion:undefined,aboveCount:1,belowCount:0,links:[{...l,floor:1}]};errors.push(...validateEscalators(one,0));}return [...new Set(errors)];
}
function calculateEscalatorGraph(config,accessFloor,lines){
 const errors=validateEscalatorGraph(config,accessFloor);if(errors.length)throw Error(errors.join('\n'));
 const segments=config.links.map(l=>{const legacy={...config,graphVersion:undefined,aboveCount:1,belowCount:0,links:[{...l,floor:1}]},network=calculateEscalators(legacy,0,[]),seg=network.segments[0];return {...seg,...l,issues:seg.issues,physicalPass:seg.physicalPass,capacityUp:seg.capacityUp,capacityDown:seg.capacityDown,hourlyUp:seg.hourlyUp,hourlyDown:seg.hourlyDown,capacitySource:seg.capacitySource};}),byFloor=new Map(segments.map(s=>[s.floor,s]));
 const pathFor=floor=>{const path=[],seen=new Set();let cursor=floor;while(cursor!==accessFloor){if(seen.has(cursor)||path.length>80)return {path,connected:false};seen.add(cursor);const segment=byFloor.get(cursor);if(!segment)return {path,connected:false};path.push(segment);cursor=segment.from;}return {path,connected:true};};
 for(const seg of segments){const dependents=[...new Set(lines.filter(l=>pathFor(l.floor).path.includes(seg)).map(l=>l.floor))];seg.dependentFloors=dependents;seg.population=lines.filter(l=>dependents.includes(l.floor)).reduce((n,l)=>n+l.beforeEscalator,0);seg.demand=seg.population*config.demandPercent/100;seg.capacityPass=seg.demand<=Math.min(seg.capacityUp,seg.capacityDown)+1e-8;seg.pass=seg.physicalPass&&seg.capacityPass;if(!seg.capacityPass)seg.issues.push('capacidade insuficiente para a população acumulada deste trecho e pavimentos dependentes');}
 const floors={};for(const floor of new Set([...segments.map(s=>s.floor),...lines.map(l=>l.floor)])){const {path,connected}=pathFor(floor),missing=path.find(s=>!s.pass),excluded=floor!==accessFloor&&connected&&!missing&&operationallyEnabled(config);const reason=excluded?'População desconsiderada nos elevadores: caminho contínuo até o acesso principal e capacidade suficiente em todos os trechos configurados (NBR 5665, 5.1.6).':floor===accessFloor?'Pavimento de acesso principal.':!connected?'População mantida: descontinuidade na ligação até o pavimento de acesso principal.':missing?'População mantida: '+(!missing.served?'descontinuidade no atendimento: ':'')+missing.issues.join('; '):'População mantida: confirme a ligação contínua e a capacidade operacional.';floors[floor]={excluded,reason,path:path.map(s=>s.floor)};}
 return allocateEscalatorPopulation({enabled:true,graphVersion:1,accessSelected:config.accessSelected,capacityBasis:config.capacityBasis,accessFloor,periodMinutes:config.periodMinutes,demandPercent:config.demandPercent,utilizationPercent:config.utilizationPercent,confirmationPolicy:config.confirmationPolicy,capacityConfirmed:config.capacityConfirmed,segments,floors,excludedPopulation:lines.filter(l=>l.escalatorRequested&&floors[l.floor]?.excluded).reduce((n,l)=>n+l.beforeEscalator,0)},lines);
}
