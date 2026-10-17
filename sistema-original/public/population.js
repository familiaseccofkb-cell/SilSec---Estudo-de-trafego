import {hasSelectedEscalatorFloor} from './transport-config.js';
import {accessRow} from './building-access.js';
import {isoPopulationUnit,defaultIsoConfig} from './iso-data.js';
import {defaultEscalators,calculateEscalators,normalizeEscalators} from './escalators.js';
import {validateFloorConfiguration,floorMarkWarning} from './floors.js';
import {compositionName} from './population-names.js';
export const POP_TYPES={
  studio:{label:'Estúdio residencial',unit:'Quantidade de estúdios',factor:1.5,item:'4.3.2.2'},
  garageMoto:{label:'Vagas de motocicletas / bicicletas',unit:'Quantidade de vagas',factor:1,item:'4.3.2.6'},
  healthRoom:{label:'Consultórios / postos de exame',unit:'Quantidade de unidades',factor:2.5,item:'4.3.2.7'},
  healthArea:{label:'Área de saúde sem leitos / salas definidos',unit:'Área útil (m²)',area:true,divisor:7,item:'4.3.2.7'},
  retailSeats:{label:'Área específica por assentos / pontos de utilização',unit:'Quantidade de assentos / pontos',factor:1,item:'4.3.2.8'},
  auditorium:{label:'Auditório',unit:'Número de assentos',factor:1,item:'população por assentos declarados · premissa de projeto, sem relação específica nas normas fornecidas'},
  office:{label:'Salas ou pavimento de escritórios ou consultórios',unit:'Área por sala ou pavimento (m²)',area:true,rule:'1 pessoa / 7 m²; salas até 7 m²: 1 pessoa; acima de 7 e abaixo de 14 m²: 2 pessoas',item:'5.1.1 a/b e 5.1.4.1'},
  apartment1:{label:'Apartamento com 1 dormitório',unit:'Quantidade de apartamentos',factor:2,item:'5.1.1 c'},
  apartment2:{label:'Apartamento com 2 dormitórios',unit:'Quantidade de apartamentos',factor:4,item:'5.1.1 c'},
  apartment3:{label:'Apartamento com 3 dormitórios',unit:'Quantidade de apartamentos',factor:5,item:'5.1.1 c'},
  apartment4:{label:'Apartamento com 4 ou mais dormitórios',unit:'Quantidade de apartamentos',factor:6,item:'5.1.1 c'},
  serviceBedroom:{label:'Dormitório de serviço',unit:'Quantidade de dormitórios de serviço',factor:1,item:'5.1.1 c'},
  hotel:{label:'Dormitórios de hotel',unit:'Quantidade de dormitórios',factor:2,item:'5.1.1 d'},
  hospital:{label:'Leitos de hospital',unit:'Quantidade de leitos',factor:2.5,item:'5.1.1 e'},
  restaurant:{label:'Restaurante · salão de refeições',unit:'Área por salão (m²)',area:true,divisor:1.5,item:'5.1.1 f'},
  classroom:{label:'Salas de aula',unit:'Área por sala de aula (m²)',area:true,divisor:2,item:'5.1.1 g'},
  administration:{label:'Administração escolar',unit:'Área por setor (m²)',area:true,divisor:7,item:'5.1.1 g'},
  garage:{label:'Garagem · vagas com rampas, sem manobrista',unit:'Quantidade de vagas',factor:1.4,item:'5.1.1 h'},
  retail:{label:'Lojas e centros comerciais',unit:'Área por loja (m²)',area:true,divisor:4,item:'5.1.1 i'}
};
const types={auditorium:['auditorium'],single:['office'],offices:['office'],residential:['apartment1','apartment2','apartment3','apartment4','serviceBedroom'],hotel:['hotel'],hospital:['hospital'],hospitalSupport:['hospital'],restaurant:['restaurant'],school:['classroom','administration'],garage:['garage'],retail:['retail']};
export const COMPLEMENTARY_TYPES=['garage','restaurant','auditorium'];
const isoTypes={...types,residential:['studio',...types.residential],garage:['garage','garageMoto'],hospital:['hospital','healthRoom','healthArea'],hospitalSupport:['hospital','healthRoom','healthArea'],retail:['retail','retailSeats']};
const typeList=(use,model)=>((model==='iso8100'?isoTypes:types)[use]||[]);
export const populationTypes=(use,model='nbr5665')=>Object.fromEntries([...new Set([...(Array.isArray(use)?use:[use]).flatMap(u=>typeList(u,model)),...COMPLEMENTARY_TYPES])].map(k=>[k,POP_TYPES[k].label]));
export function applicationForRow(study,row){return (study.populationApplications||study.groups.map(g=>g.use||study.use)).find(u=>typeList(u,study.trafficModel).includes(row.kind))||study.use;}
export const defaultPopulationMode=(use,kind,model='nbr5665')=>typeList(use,model).includes(kind)?'main':kind==='auditorium'?'external':'exclusive';
export function defaultPopulationRow(use='offices'){return {label:'Composição 1',kind:types[use]?.[0]||'office',mode:'main',amount:0,repeat:1,reduction15:false,discount:'none',distance:0,exclusion:'none',conditionsConfirmed:false,notes:'',floor:1,isStreetAccess:false,declaredPopulation:0,schoolDiscountPercent:0,schoolDistance:0,escalatorDiscount:false,servedByEscalator:false};}
export function defaultPopulationCalc(use='offices'){return {accessFloor:0,rows:[defaultPopulationRow(use)],escalators:defaultEscalators(),last:null};}
export function normalizePopulationRow(row,use){
 const next={...defaultPopulationRow(use),...row,mode:row.mode??defaultPopulationMode(use,row.kind),floorMark:row.floorMark??String(row.floor??1)};
 if(next.discount==='school30'){next.discount='none';next.schoolDiscountPercent=30;next.schoolDistance=next.distance;}
 if(next.exclusion==='escalator'){next.exclusion='none';next.servedByEscalator=true;}
 return next;
}
export function normalizePopulationCalc(pc,use){
 const next={...defaultPopulationCalc(use),...pc};
 next.rows=Array.isArray(next.rows)?next.rows.map(row=>normalizePopulationRow(row,use)):next.rows;
 next.escalators=normalizeEscalators({...defaultEscalators(),...next.escalators,capacityBasis:next.escalators?.capacityBasis??'manufacturer'});
 if(next.last){next.last={...next.last,accessFloor:next.last.accessFloor??0,escalators:normalizeEscalators(next.last.escalators||defaultEscalators()),rows:next.last.rows?.map(row=>snapshotRow(normalizePopulationRow(row,next.last.use)))};}
 return next;
}
const fmt=v=>new Intl.NumberFormat('pt-BR',{maximumFractionDigits:4}).format(v);
export function calculatePopulation(use,rows,options={}){
 if(!Array.isArray(rows)||!rows.length||rows.length>100)throw new Error('Informe de 1 a 100 composições de população.');
 const applications=options.applications?.length?options.applications:[use];const rowUse=r=>applications.find(u=>typeList(u,options.trafficModel).includes(r.kind))||use;
 const floorErrors=validateFloorConfiguration({...options,rows});if(floorErrors.length)throw new Error(floorErrors.join('\n'));
 if(applications.some(u=>new Set(rows.filter(r=>r.discount==='adjacent50'&&rowUse(r)===u).map(r=>r.floor)).size>(u==='offices'?2:1)))throw Error(use==='offices'?'O desconto de 50% nos escritórios é limitado a dois pavimentos: imediatamente acima e imediatamente abaixo do acesso.':'O desconto de 50% pode ser aplicado em somente um andar neste estudo. Vários ambientes do mesmo andar podem compartilhá-lo. Critério do projeto.');
 if([1,2].includes(options.escalators?.graphVersion))options={...options,escalators:{...options.escalators,allowedFloors:[...new Set([0,...rows.map(r=>r.floor),...(options.additionalLines||[]).map(r=>r.floor)])]}};const accessFloor=options.accessFloor??0,iso=options.trafficModel==='iso8100';
 if(!Number.isInteger(accessFloor)||accessFloor<-200||accessFloor>200)throw new Error('Pavimento de acesso inválido.');
 const lines=rows.map((source,i)=>{
  const use=rowUse(source),row=normalizePopulationRow(source,use),streetAccess=rows.some(item=>item.isStreetAccess)&&row.floor===accessFloor,declaredOnly=row.declaredPopulation>0,prefix=`Composição ${i+1}: `,type=POP_TYPES[row.kind];
  if(!type||!populationTypes(use,options.trafficModel)[row.kind])throw new Error(prefix+'tipo incompatível com o uso do edifício.');
  if(row.participationVersion===1&&!['include','separate','exclude'].includes(row.participation))throw Error(prefix+'escolha se esta população participa do estudo principal, de estudo separado ou será somente registrada.');if(!['main','external','exclusive'].includes(row.mode)||row.mode==='main'&&!typeList(use,options.trafficModel).includes(row.kind)&&!(row.participationVersion===1&&['include','exclude'].includes(row.participation))||row.mode==='external'&&!COMPLEMENTARY_TYPES.includes(row.kind)||row.mode==='exclusive'&&!['garage','restaurant'].includes(row.kind))throw new Error(prefix+'destinação incompatível: use estudo separado ou uso exclusivo para este componente.');
  if(typeof row.label!=='string'||row.label.length>120||typeof row.notes!=='string'||row.notes.length>2000)throw new Error(prefix+'identificação inválida.');
  if(!Number.isFinite(row.amount)||row.amount<0||row.amount===0&&row.mode!=='exclusive'&&!streetAccess&&!declaredOnly||row.amount>1000000||(!type.area&&!Number.isInteger(row.amount)))throw new Error(prefix+'informe uma área positiva ou uma quantidade inteira positiva.');
  if((row.mode==='external'||row.participation==='include')&&row.kind==='garage'&&row.conditionsConfirmed!==true)throw new Error(prefix+'confirme a garagem com rampas e sem manobrista.');
  if(!Number.isInteger(row.repeat)||row.repeat<1||row.repeat>100000)throw new Error(prefix+'repetições devem ser um inteiro positivo.');
  if(!Number.isInteger(row.floor)||row.floor<-200||row.floor>200)throw new Error(prefix+'pavimento deve ser inteiro entre -200 e 200.');
  if(row.isStreetAccess&&row.floor!==accessFloor)throw new Error(prefix+'confirme o nível do pavimento de acesso antes de excluir sua população.');
  if(!Number.isInteger(row.declaredPopulation)||row.declaredPopulation<0||row.declaredPopulation>1000000)throw new Error(prefix+'população declarada deve ser um inteiro entre 0 e 1.000.000.');
  if(typeof row.servedByEscalator!=='boolean'||typeof row.reduction15!=='boolean')throw new Error(prefix+'flags de população inválidos.');
  if(!['none','adjacent50'].includes(row.discount)||!['none','exclusive','unusable'].includes(row.exclusion))throw new Error(prefix+'desconto ou exclusão inválido.');
  if(!Number.isFinite(row.schoolDiscountPercent)||row.schoolDiscountPercent<0||row.schoolDiscountPercent>100)throw new Error(prefix+'desconto escolar deve estar entre 0% e 100%.');
  if(row.schoolDiscountPercent>0&&(use!=='school'||row.mode!=='main'))throw new Error(prefix+'desconto escolar é exclusivo da população principal de edifícios escolares.');
  if(row.schoolDiscountPercent>0&&row.discount!=='none')throw new Error(prefix+'não acumule o desconto escolar com o desconto de 50% na mesma população.');
  if((row.discount!=='none'||row.exclusion!=='none'||row.reduction15||row.schoolDiscountPercent>0)&&row.conditionsConfirmed!==true)throw new Error(prefix+'confirme as condições para aplicar desconto, redução ou exclusão.');
  if(row.discount==='adjacent50'&&(!Number.isFinite(row.distance)||row.distance<=0||row.distance>5||Math.abs(row.floor-accessFloor)!==1))throw new Error(prefix+'desconto de 50% exige pavimento imediatamente acima ou abaixo, com distância positiva até 5 m.');
  if(row.schoolDiscountPercent>0&&(!Number.isFinite(row.schoolDistance)||row.schoolDistance<=0||row.schoolDistance>12||!(row.floor>accessFloor||row.floor===accessFloor-1)))throw new Error(prefix+'desconto escolar exige distância positiva até 12 m, acima ou imediatamente abaixo do acesso.');
  if(row.reduction15&&row.kind!=='office')throw new Error(prefix+'redução de 15% é exclusiva de salas de escritório elegíveis.');
  if(row.exclusion==='unusable'&&row.kind!=='office')throw new Error(prefix+'exclusão de espaços sem uso para trabalho é específica de escritórios.');
  if(row.exclusion!=='none'&&!row.notes.trim())throw new Error(prefix+'descreva o motivo e as condições da exclusão.');
  if(iso){
   if(row.reduction15)throw Error(prefix+'no modelo ISO informe a área interna útil; a redução NBR de 15% não se aplica.');
   if((row.discount==='adjacent50'||row.schoolDiscountPercent>0)&&(!row.iso?.stairsSameHall||!row.iso?.stairsUnrestricted||options.isoConfig?.multipleEntrances))throw Error(prefix+'desconto ISO exige escadas no mesmo hall, uso livre em ambos os sentidos e um acesso principal.');
   if(row.schoolDiscountPercent>0&&Math.abs(row.floor-accessFloor)!==1)throw Error(prefix+'desconto escolar ISO: somente pavimento imediatamente acima ou abaixo do acesso.');
   if(row.schoolDiscountPercent>0&&row.schoolDiscountPercent!==30&&!row.iso?.customDiscount)throw Error(prefix+'desconto escolar do documento é 30%; confirme a premissa personalizada para outro valor.');
   if((row.mode==='exclusive'&&row.kind==='restaurant'||row.exclusion==='exclusive')&&row.floor<=accessFloor&&!streetAccess)throw Error(prefix+'exclusão de apoio do documento: pavimentos acima do acesso.');
  }
  let perUnit,formula,isoItem;
  if(row.amount===0){perUnit=0;formula='0 unidades ou m² registrados → 0 pessoas calculadas';}
  else if(iso){const calculated=isoPopulationUnit(row,use,options);perUnit=calculated.value;formula=calculated.formula;isoItem=calculated.item;}
  else if(row.kind==='office'){
   const area=row.amount*(row.reduction15?.85:1);
   perUnit=row.reduction15?area/7:row.amount<=7?1:row.amount<14?2:area/7;
   formula=row.reduction15?`${fmt(row.amount)} m² × 85% / 7`:`${fmt(row.amount)} m² → ${fmt(perUnit)} pessoas`;
  }else if(type.area){perUnit=row.amount/type.divisor;formula=`${fmt(row.amount)} m² / ${fmt(type.divisor)}`;}
  else {perUnit=row.amount*type.factor;formula=`${fmt(row.amount)} × ${fmt(type.factor)}`;}
  const gross=perUnit*row.repeat,discount=row.discount==='adjacent50'?.5:row.schoolDiscountPercent/100;
  const calculatedPopulation=gross*(1-discount);
  const beforeEscalator=row.participationVersion===1&&row.participation==='exclude'||streetAccess||row.mode==='exclusive'||row.exclusion!=='none'?0:gross*(1-discount);
  const customSchool=row.schoolDiscountPercent>0&&row.schoolDiscountPercent!==30;
  const details=iso?`Documento ISO informado, ${isoItem||'critério de acesso / declaração'}; pavimento ${row.floor}; acesso ${accessFloor}; ${row.discount==='adjacent50'?'desconto de 50% (§4.3.3.1); ':''}${row.schoolDiscountPercent>0?'desconto escolar '+fmt(row.schoolDiscountPercent)+'% (§4.3.3.2 ou premissa personalizada); ':''}${row.notes}`:[row.kind==='auditorium'?type.item:`NBR 5665, ${type.item}`,`pavimento ${row.floor}; acesso ${accessFloor}`,row.reduction15?'redução de área de 15% (5.1.5): sala ≥ 200 m² ou sala corrida de pavimento inteiro':'',row.discount==='adjacent50'?`desconto de 50% a ${fmt(row.distance)} m (5.1.2)`:'',row.schoolDiscountPercent>0?`desconto escolar ${fmt(row.schoolDiscountPercent)}% a ${fmt(row.schoolDistance)} m; ${customSchool?'percentual personalizado: premissa do usuário diferente dos 30% de 5.1.3':'NBR 5665, 5.1.3'}`:'',row.exclusion!=='none'?`exclusão ${row.exclusion} (${row.exclusion==='unusable'?'5.1.4':'5.1.7'}): ${row.notes}`:'',row.exclusion==='none'?row.notes:''].filter(Boolean).join('; ');
  return {id:row.id,index:i,mode:row.mode,label:row.label||`Composição ${i+1}`,kind:row.kind,floor:row.floor,floorMark:row.floorMark,servedFloorMark:row.servedFloorMark??String(row.floor),declaredPopulation:row.declaredPopulation,compositionName:compositionName(row),calculatedNet:calculatedPopulation,declarationEligible:!(row.participationVersion===1&&row.participation==='exclude')&&!streetAccess&&row.mode!=='exclusive'&&row.exclusion==='none',isStreetAccess:row.isStreetAccess,streetAccessExcluded:streetAccess,formula:`(${formula}) × ${row.repeat}`,gross,discount,beforeEscalator,net:beforeEscalator,escalatorRequested:!streetAccess&&row.mode!=='exclusive'&&row.servedByEscalator,customSchool,details:details+(row.participationVersion===1?'; participação escolhida pelo gestor: '+({include:'incluir no estudo principal como premissa de uso composto',exclude:'registrar sem somar à população',separate:'estudo separado para esta demanda'}[row.participation]||'pendente'):'')+(row.discount==='adjacent50'?(use==='offices'?'; desconto de 50% limitado aos dois pavimentos adjacentes ao acesso, um acima e um abaixo, até 5 m':'; critério adicional deste projeto: desconto de 50% limitado a um único andar'):'')+(streetAccess?'; acesso à rua confirmado: população desconsiderada por critério deste estudo; preservar paradas e percurso':'')+(row.mode==='exclusive'?'; uso exclusivo da edificação: população desconsiderada ('+(iso?'documento §4.3.2.11 / 4.3.3.5':'NBR 5665, 5.1.7')+'); preservar paradas e percurso':row.mode==='external'?'; população destinada a estudo separado, com critérios e elevadores próprios':'')};
 });
 const declarationSummary=[];
 for(const line of lines){
  const calculated=line.calculatedNet,declared=line.declaredPopulation,recorded=Math.max(calculated,declared),adopted=line.declarationEligible?recorded:0;
  line.recordedPopulation=recorded;
  line.beforeEscalator=adopted;line.net=adopted;
  line.details+=`; ambiente ${line.label}, andar ${line.servedFloorMark}: população calculada líquida ${fmt(calculated)}; declarada ${declared}; adotada antes das escadas ${fmt(adopted)}. ${line.declarationEligible?'Adotado o maior valor deste ambiente, contado uma única vez na soma do andar e do respectivo estudo; calculada e declarada não são somadas entre si':'A declaração registrada não altera a exclusão deste ambiente'}`;
  declarationSummary.push({index:line.index,label:line.label,servedFloorMark:line.servedFloorMark,floor:line.floor,mode:line.mode,calculated,declared,adopted,recorded,overridden:line.declarationEligible&&adopted>calculated});
 }
 if(iso){const floorGroups=new Map();for(const line of lines){const key=line.mode==='main'?'main:'+line.floor:'separate:'+line.index;if(!floorGroups.has(key))floorGroups.set(key,[]);floorGroups.get(key).push(line);}for(const members of floorGroups.values()){const raw=members.reduce((sum,line)=>sum+line.beforeEscalator,0),extra=Math.ceil(raw-1e-10)-raw;if(extra>1e-10){const line=members.findLast(l=>l.beforeEscalator>0);line.floorRounding=extra;line.beforeEscalator+=extra;line.net+=extra;line.recordedPopulation+=extra;line.details+='; arredondamento para cima da soma do pavimento/estudo (§4.3.3.3): +'+fmt(extra);}}}
 const additionalLines=options.additionalLines||[];
 if(!Array.isArray(additionalLines)||additionalLines.length>120||additionalLines.some(line=>!line||!Number.isInteger(line.floor)||line.floor<-200||line.floor>200||!Number.isFinite(line.beforeEscalator)||line.beforeEscalator<0||line.beforeEscalator>1000000||typeof line.escalatorRequested!=='boolean'))throw new Error('População adicional da rede de escadas inválida.');
 const escalators=calculateEscalators(options.escalators,accessFloor,[...lines.filter(line=>line.mode==='main'||line.mode==='external'&&line.escalatorRequested),...additionalLines]);
 if(iso)for(const condition of Object.values(escalators.floors||{}))condition.reason=condition.reason.replace('NBR 5665, 5.1.6','documento ISO informado, 4.3.3.4');
 for(const line of lines){
  if(!line.escalatorRequested)continue;
  const floor=escalators.floors[line.floor];line.escalatorExcluded=!!floor?.excluded;
  line.escalatorServedPopulation=line.escalatorExcluded?line.beforeEscalator:line.beforeEscalator*(floor?.serviceFraction||0);
  line.net=Math.max(0,line.beforeEscalator-line.escalatorServedPopulation);
  line.escalatorReason=(iso?floor?.reason?.replace('NBR 5665, 5.1.6','documento ISO informado, 4.3.3.4'):floor?.reason)||'População mantida: configure e confirme o estudo de escadas rolantes antes de aplicar a exclusão.';line.details+='; '+line.escalatorReason;
 }
 for(const line of lines){line.notComputedPopulation=Math.max(0,line.recordedPopulation-line.net);line.exclusionNotice=!line.declarationEligible?`Esta população não irá fazer parte do estudo de tráfego: ${line.streetAccessExcluded?'pavimento de acesso':line.mode==='exclusive'?'uso exclusivo da edificação':line.exclusion!=='none'?'exclusão justificada':'participação desativada'}. Calculada: ${fmt(line.calculatedNet)}; registrada após declaração: ${fmt(line.recordedPopulation)} pessoas.`:line.escalatorServedPopulation>0?`${fmt(line.escalatorServedPopulation)} pessoas não serão computadas por atendimento de escadas rolantes; ${fmt(line.net)} pessoas permanecem nos elevadores. ${line.escalatorReason}`:line.mode==='external'?'Esta população não entra no estudo principal; participa do estudo separado.':'';if(line.exclusionNotice)line.details+='; '+line.exclusionNotice;}
 const ceil=value=>value===0?0:Math.max(1,Math.ceil(value-1e-10));
 const raw=lines.filter(line=>line.mode==='main').reduce((sum,line)=>sum+line.net,0),value=ceil(raw);
 const separate=lines.filter(line=>line.mode==='external').map(line=>({...line,value:ceil(line.net)}));
 const separateValue=separate.reduce((sum,line)=>sum+line.value,0),totalValue=value+separateValue;
 if(totalValue<0||totalValue>1000000)throw new Error('A população calculada deve estar entre 0 e 1.000.000 pessoas.');
 const floorMap=new Map();
 for(const line of lines){if(!floorMap.has(line.floor))floorMap.set(line.floor,{floor:line.floor,marks:[],environments:[],gross:0,calculated:0,declared:0,recorded:0,notComputed:0,escalatorServed:0,notices:[],adopted:0,main:0,separate:0,streetAccess:false});const floor=floorMap.get(line.floor);if(!floor.marks.includes(line.servedFloorMark))floor.marks.push(line.servedFloorMark);floor.environments.push(line.label);floor.gross+=line.gross;floor.calculated+=line.calculatedNet;floor.recorded+=line.recordedPopulation;floor.notComputed+=line.notComputedPopulation;floor.escalatorServed+=line.escalatorServedPopulation||0;if(line.exclusionNotice)floor.notices.push(line.exclusionNotice);floor.adopted+=line.net;floor.main+=line.mode==='main'?line.net:0;floor.separate+=line.mode==='external'?line.net:0;floor.streetAccess ||= line.streetAccessExcluded;}
 for(const group of declarationSummary)floorMap.get(group.floor).declared+=group.declared;
 const floors=[...floorMap.values()].sort((a,b)=>a.floor-b.floor);
 const basis=lines.map(line=>`${line.compositionName}, composição ${line.floorMark}, ambiente ${line.label}, andar ${line.servedFloorMark}: ${line.formula}; população líquida ${fmt(line.net)}. ${line.details}.`).join('\n')+`\nEstudo principal antes do arredondamento: ${fmt(raw)}. População calculada: ${value} pessoas. Estudos separados: ${separateValue} pessoas. Total dos estudos: ${totalValue} pessoas. ${iso?'Arredondamento para cima por pavimento e estudo, após somar seus ambientes; documento §4.3.3.3.':'Arredondamento final para cima em cada estudo, sem arredondar componentes.'} As populações dos estudos separados não são somadas à demanda principal.`;
 return {value,raw,separate,separateValue,totalValue,lines,floors,declarationSummary,basis:basis+(escalators.partialAllocationPremise?'\n'+escalators.partialAllocationPremise:''),escalators};
}
export function additionalEscalatorLines(study){
 return (study.auxiliary||[]).filter(item=>item.mode==='external'&&item.sharedEscalators).flatMap(item=>{
  const row={...defaultPopulationRow(item.kind),label:item.label,amount:item.amount,floor:item.floor,servedByEscalator:true};
  return calculatePopulation(item.kind,[row]).lines.map(line=>({...line,sourceId:item.id}));
 });
}
export function populationOptions(study){return {...(study.populationApplications?.length||study.groups?.some(g=>g.use)?{applications:[...new Set(study.populationApplications||study.groups.map(g=>g.use||study.use))]}:{}),trafficModel:study.trafficModel||'nbr5665',...(study.trafficModel==='iso8100'?{isoConfig:study.isoConfig}:{}),floorSequenceVersion:study.populationCalc.floorSequenceVersion,accessFloor:study.populationCalc.accessFloor??0,escalators:((study.transportEquipment?.rolling??study.transportEquipment?.escalators)===false||study.populationCalc.escalators?.floorSelectionRequired&&(study.floorTable?!hasSelectedEscalatorFloor(study):study.populationCalc.escalators.selectionAvailable!==true))?{...study.populationCalc.escalators,enabled:false}:[1,2].includes(study.populationCalc.escalators?.graphVersion)?{...study.populationCalc.escalators,...(study.floorTable?.escalatorSelectionVersion===2?{accessSelected:!!accessRow(study.floorTable)?.escalatorServed}:{}),allowedFloors:[...new Set([0,...study.populationCalc.rows.map(r=>r.floor),...(study.populationCalc.additionalLines||[]).map(r=>r.floor)])]}:study.populationCalc.escalators||defaultEscalators(),additionalLines:[...(study.populationCalc.additionalLines||[]),...additionalEscalatorLines(study)]};}
function snapshotRow(row){const {groups,auditoriumDemandPercent,auditoriumInterval,...population}=row;return population;}
export function populationSnapshot(study){const options=populationOptions(study);return {...(options.applications?{applications:options.applications}:{}),use:study.use,trafficModel:options.trafficModel,...(options.trafficModel==='iso8100'?{isoConfig:JSON.parse(JSON.stringify(options.isoConfig))}:{}),floorSequenceVersion:options.floorSequenceVersion,accessFloor:options.accessFloor,rows:JSON.parse(JSON.stringify(study.populationCalc.rows.map(row=>snapshotRow(normalizePopulationRow(row,study.use))))),escalators:JSON.parse(JSON.stringify(options.escalators)),additionalLines:JSON.parse(JSON.stringify(options.additionalLines))};}
export function populationStatus(study){
 const last=study.populationCalc?.last;
 if(!last)return {calculated:null,differs:false,pending:false,lines:[],basis:'',escalators:{enabled:false,segments:[]}};
 const calculation=calculatePopulation(last.use,last.rows,{applications:last.applications,trafficModel:last.trafficModel||'nbr5665',isoConfig:last.isoConfig,floorSequenceVersion:last.floorSequenceVersion,accessFloor:last.accessFloor??0,escalators:last.escalators,additionalLines:last.additionalLines}),snapshot=populationSnapshot(study);
 const normalizedLast={...last,trafficModel:last.trafficModel||'nbr5665',rows:last.rows.map(row=>snapshotRow(normalizePopulationRow(row,last.use)))};
 const pending=JSON.stringify(snapshot)!==JSON.stringify({...snapshot,...normalizedLast});
 const differs=Math.abs(study.population-calculation.value)>1e-8;
 return {...calculation,calculated:calculation.value,differs,pending,basis:study.populationBasis};
}
export function populationWarnings(study){
 const status=populationStatus(study),warnings=[];
 if(status.differs)warnings.push(`População informada (${fmt(study.population)} pessoas) diferente da população calculada (${fmt(status.calculated)} pessoas). O estudo usa a população informada manualmente. Como a população foi definida: ${study.populationBasis||'justificativa não informada'}.`);
 if(status.pending)warnings.push('Os dados da composição populacional ou das escadas rolantes foram alterados após o último cálculo. Recalcule a população; a memória exibida corresponde ao último cálculo aplicado.');
 for(const line of status.lines){if(line.customSchool)warnings.push(`${line.label}: desconto escolar de ${fmt(line.discount*100)}% é premissa personalizada; ${study.trafficModel==='iso8100'?'o documento informado, 4.3.3.2':'a NBR 5665, 5.1.3'}, indica 30%.`);if(line.escalatorRequested&&!line.escalatorExcluded)warnings.push(`${line.label}: ${line.escalatorReason}`);}
 for(const line of status.lines){const warning=floorMarkWarning(line,study.populationCalc?.last?.accessFloor??0,study.floorTable?.enabled?accessRow(study.floorTable)?.mark:'0');if(warning)warnings.push(`${line.label}: ${warning}`);if(line.streetAccessExcluded)warnings.push(`${line.label}: andar ${line.servedFloorMark}, acesso à rua confirmado. População bruta de ${fmt(line.gross)} pessoas desconsiderada por critério deste estudo. Paradas e percurso permanecem considerados.`);}
 for(const declaration of status.declarationSummary||[])if(declaration.overridden)warnings.push(`${declaration.label}, andar ${declaration.servedFloorMark}: população declarada de ${declaration.declared} pessoas superior à calculada (${fmt(declaration.calculated)}). Foi adotada a declaração deste ambiente antes da verificação das escadas. O ambiente contribui uma única vez para a soma do andar e do respectivo estudo.`);
 if(status.value===0)warnings.push('População líquida calculada igual a zero: não há demanda populacional de elevadores neste cálculo. Paradas e percurso permanecem informados; isso não dispensa elevadores ou rotas acessíveis exigidos para o projeto.');
 return warnings;
}
