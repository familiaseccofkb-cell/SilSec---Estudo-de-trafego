// Duas bases para o modelo ISO: a edição publicada ISO 8100-32:2020 (padrão dos estudos novos) e o texto de trabalho
// ABNT N69, mantido para que estudos antigos continuem com os mesmos resultados.
import {ISO2020_PROVENANCE,ISO2020_CALC,ISO2020_OFFICE,ISO2020_RESIDENTIAL,iso2020Door,iso2020Motion,iso2020Transfer} from './iso2020.js';
export const ISO_EDITIONS={iso2020:'ISO 8100-32:2020 · edição publicada',n69:'Texto de trabalho ABNT N69 (2025) · estudos anteriores'};
export const ISO_PROVENANCE_N69='Opção ISO 8100 baseada no texto de trabalho ABNT/CB-002/CE 002 138 018 N69, reunião de 21/05/2025. Documento em elaboração; não equivale à edição publicada ISO 8100-32:2020 nem certifica sua conformidade.';
export const ISO_CLASSES={prestige:'Superior (Prestige)',standard:'Intermediário (Standard)',open:'Ambiente aberto (Open floor)',dense:'Alta densidade (Trade floor)'};
export const RES_CLASSES={prestige:'Superior',standard:'Intermediário',minimum:'Mínimo'};
export const ISO_OFFICE={prestige:{min:8,max:10,utilization:80},standard:{min:6,max:8,utilization:80},open:{min:5,max:7,utilization:85},dense:{min:4,max:6,utilization:90}};
export const ISO_RESIDENTIAL={studio:[1,1.5,2],apartment1:[1.5,1.8,2],apartment2:[2,3,4],apartment3:[3,4,6],apartment4:[4,5,7]};
export const ISO_MOTION=[[.75,.4,.8],[1,.4,.8],[1.5,.6,.9],[1.6,.6,.9],[1.75,.6,.9],[2,.6,.9],[2.5,.7,.9],[3,.9,1],[3.5,.9,1],[4,1,1],[5,1,1],[6,1,1],[7,1,1],[8,1,1],[9,1,1],[10,1,1]];
export const ISO_WIDTHS=[800,900,1000,1100,1200];
export const ISO_TRANSFER={800:1.2,900:1.1,1000:1,1100:1,1200:.9};
export const ISO_PROVENANCE=ISO_PROVENANCE_N69;
export const isIso=s=>s?.trafficModel==='iso8100';
export const isoEdition=s=>(s?.isoConfig?.edition==='iso2020'?'iso2020':'n69');
export const isIso2020=s=>isoEdition(s)==='iso2020';
export const isoProvenance=s=>isIso2020(s)?ISO2020_PROVENANCE:ISO_PROVENANCE_N69;
export const isoOfficeTable=s=>isIso2020(s)?ISO2020_OFFICE:ISO_OFFICE;
export const defaultIsoConfig=()=>({officeClass:'standard',residentialClass:'standard',intervalChoice:'strict',customInterval:40,openDemandPercent:12,localMinimum:0,multipleEntrances:false,uniformModel:true,controlType:'conventional',projectCnpj:'',approvalDate:'',edition:'n69',pcalcSource:'demand',areaPerPerson:.21,simulationEnabled:true,simulationStep:1});
export const defaultIsoRow=()=>({areaPerPerson:7,utilization:80,hotelPersons:2,stairsSameHall:false,stairsUnrestricted:false,customDiscount:false});
export const defaultIsoGroup=()=>({source:'table',occupancy:80,startDelay:.6,preOpening:0,closingDelay:2,capacityReduction:false,customOccupancy:false,ratedLoad:0,cabinArea:0,flightTime:0,expressFloors:0,psim:0});
export function isoDoor(width,door){if(!ISO_WIDTHS.includes(width)||!['central','lateral'].includes(door))throw Error('Modelo ISO: tabela de portas exige abertura central ou lateral e vão de 800, 900, 1.000, 1.100 ou 1.200 mm. Use premissas do fabricante para outros valores.');return door==='central'?{open:width<=1000?2.5:2.6,close:width<=1000?3.5:3.6}:{open:width<=1000?3.4:3.8,close:width<=1000?5.1:5.4};}
export function isoMotion(speed){const point=ISO_MOTION.find(row=>row[0]===speed);if(!point)throw Error('Modelo ISO: velocidade não consta da tabela 9 do documento. Selecione um valor tabelado ou a base Fabricante / premissas personalizadas.');return {acceleration:point[1],jerk:point[2]};}
export function isoOccupancyRange(study){if(isIso2020(study))return null;if(study.use==='hotel')return [.5,.5];if(study.use==='residential')return [.5,study.isoConfig.residentialClass==='prestige'?.65:study.isoConfig.residentialClass==='minimum'?1:.8];if(['offices','single','hospitalSupport','school'].includes(study.use))return [.5,.8];return null;}
export function isoCriteria(study,count){if(isIso2020(study)){const config={...defaultIsoConfig(),...study.isoConfig},t=ISO2020_CALC[study.use];if(t){const notes=['ISO 8100-32:2020, tabela 2: %Ch ≥ '+t.rate*100+'% em 5 min e intervalo ≤ '+t.limit+' s (método de cálculo, pico de subida).'];let limit=t.limit;if(config.intervalChoice==='custom'){limit=config.customInterval;notes.push('Intervalo personalizado: premissa de projeto diferente da tabela 2.');}return {rate:t.rate,limit,limitRange:[t.limit,t.limit],strict:false,notes};}
  const legacy=isoCriteriaN69(study,count);return {...legacy,notes:[...legacy.notes,'A tabela 2 da ISO 8100-32:2020 cobre escritórios, hotéis e residenciais. Para este uso foi adotado o critério do texto ABNT N69, como premissa de projeto.']};}
 return isoCriteriaN69(study,count);}
function isoCriteriaN69(study,count){const config={...defaultIsoConfig(),...study.isoConfig},index=count<=1?0:count===2?1:count===3?2:3,range=(one,two,three,four)=>[one,two,three,four][index];let rate=.12,limitRange,strict=false,notes=[];
 const general=range([80,80],[50,60],[40,50],[30,40]);
 if(['offices','single'].includes(study.use)){limitRange=config.officeClass==='prestige'?range([70,70],[50,50],[40,40],[30,30]):general;if(config.officeClass==='open'){rate=config.openDemandPercent/100;notes.push('Tabela 3: célula de capacidade do ambiente aberto não preenchida no documento; percentual explícito de projeto.');}}
 else if(study.use==='residential'){rate=config.residentialClass==='prestige'?.12:config.residentialClass==='minimum'?.08:.1;limitRange=config.residentialClass==='minimum'?null:config.residentialClass==='prestige'?[60,60]:[80,80];}
 else if(study.use==='hotel'||study.use==='hospitalSupport'){rate=study.use==='hotel'?.12:.08;limitRange=range([80,80],[50,60],[40,50],[30,45]);}
 else if(study.use==='hospital'||study.use==='school'){rate=study.use==='hospital'?.12:.2;limitRange=range([80,80],[50,60],[40,50],[30,45]);strict=index!==2;}
 else if(study.use==='garage'){rate=.1;limitRange=general;strict=index!==2;}
 else if(study.use==='retail'){rate=.1;limitRange=null;}
 else if(study.use==='restaurant'){rate=.06;limitRange=range([80,80],[50,60],[40,50],[30,45]);strict=true;}
 else if(study.use==='auditorium'){rate=study.auditoriumDemandPercent/100;limitRange=[study.auditoriumInterval,study.auditoriumInterval];notes.push('Auditório: componente de projeto fora do escopo 1.3 do documento; sem conclusão normativa.');}
 else throw Error('Aplicação incompatível com o modelo ISO do documento.');
 let limit=config.intervalChoice==='custom'?config.customInterval:limitRange===null?null:config.intervalChoice==='strict'?limitRange[0]:limitRange[1];
 if(limitRange&&limitRange[0]!==limitRange[1])notes.push('Faixa da tabela 3: escolha '+(config.intervalChoice==='strict'?'do menor limite (mais exigente)':config.intervalChoice==='relaxed'?'do maior limite':'personalizada')+' explicitada como critério do estudo.');
 if(config.intervalChoice==='custom'){strict=false;notes.push('Intervalo personalizado: premissa de projeto, sem atribuir este valor à tabela 3.');}
 return {rate,limit,limitRange,strict,notes};
}
export function isoPopulationUnit(row,use,options){const config={...defaultIsoConfig(),...options.isoConfig},p={...defaultIsoRow(),...row.iso};let value,formula,item;
 const positive=x=>Number.isFinite(x)&&x>0;
 if(config.edition==='iso2020'){
  if(row.kind==='office'){const rule=ISO2020_OFFICE[config.officeClass];if(!rule||!positive(p.areaPerPerson)||p.areaPerPerson<rule.min||p.areaPerPerson>rule.max||p.utilization!==rule.utilization)throw Error(`ISO 8100-32:2020, tabela 4: para a classe escolhida use ${rule?.min} a ${rule?.max} m²/pessoa e utilização de ${rule?.utilization}%.`);return {value:row.amount*p.utilization/100/p.areaPerPerson,formula:`${row.amount} m² úteis × ${p.utilization}% / ${p.areaPerPerson} m²/pessoa`,item:'ISO 8100-32:2020, 6.3.2, tabela 4, fórmula (1)'};}
  if(ISO2020_RESIDENTIAL[row.kind]){const factor=ISO2020_RESIDENTIAL[row.kind][['prestige','standard','minimum'].indexOf(config.residentialClass)];if(!positive(factor))throw Error('Classe residencial inválida.');return {value:row.amount*factor,formula:`${row.amount} unidades × ${factor} pessoa(s)`,item:'ISO 8100-32:2020, tabela 5'};}
  if(row.kind==='apartment4')throw Error('ISO 8100-32:2020, tabela 5: apartamentos de até 3 dormitórios. Para 4 dormitórios, declare a população do ambiente (campo população declarada) ou use 3 dormitórios.');
  if(row.kind==='hotel'){if(!positive(p.hotelPersons)||p.hotelPersons<1||p.hotelPersons>2)throw Error('ISO 8100-32:2020: informe de 1 a 2 pessoas por quarto de hotel.');return {value:row.amount*p.hotelPersons,formula:`${row.amount} quartos × ${p.hotelPersons}`,item:'ISO 8100-32:2020, 6.3.2 (hotéis)'};}
 }
 if(row.kind==='office'){const rule=ISO_OFFICE[config.officeClass];if(!rule||!positive(p.areaPerPerson)||p.areaPerPerson<rule.min||p.areaPerPerson>rule.max||p.utilization!==rule.utilization)throw Error('Modelo ISO: confira área por pessoa e fator de utilização da classe de escritório escolhida.');value=row.amount*p.utilization/100/p.areaPerPerson;formula=`${row.amount} m² úteis × ${p.utilization}% / ${p.areaPerPerson} m²/pessoa`;item='4.3.2.1, tabela 1, fórmula (1)';}
 else if(ISO_RESIDENTIAL[row.kind]){const factor=ISO_RESIDENTIAL[row.kind][['prestige','standard','minimum'].indexOf(config.residentialClass)];if(!positive(factor))throw Error('Classe residencial inválida.');value=row.amount*factor;formula=`${row.amount} unidades × ${factor} pessoa(s)`;item='4.3.2.2, tabela 2';}
 else if(row.kind==='serviceBedroom'){value=row.amount;formula=`${row.amount} dormitórios de serviço × 1`;item='4.3.2.2, nota';}
 else if(row.kind==='hotel'){if(!positive(p.hotelPersons)||p.hotelPersons<1||p.hotelPersons>2)throw Error('Modelo ISO: informe de 1 a 2 hóspedes por quarto.');value=row.amount*p.hotelPersons;formula=`${row.amount} quartos × ${p.hotelPersons}`;item='4.3.2.3';}
 else {const divisors={restaurant:1.5,classroom:2,administration:7,retail:4,healthArea:7},factors={hospital:2.5,healthRoom:2.5,garage:1.4,garageMoto:1,retailSeats:1,auditorium:1};if(divisors[row.kind]){value=row.amount/divisors[row.kind];formula=`${row.amount} m² / ${divisors[row.kind]}`;}else if(factors[row.kind]){value=row.amount*factors[row.kind];formula=`${row.amount} × ${factors[row.kind]}`;}else throw Error('Componente sem regra populacional neste modelo.');item=(config.edition==='iso2020'?'texto ABNT N69 (uso fora da ISO 8100-32:2020), ':'')+({restaurant:'4.3.2.4',classroom:'4.3.2.5',administration:'4.3.2.5',garage:'4.3.2.6',garageMoto:'4.3.2.6',hospital:'4.3.2.7',healthRoom:'4.3.2.7',healthArea:'4.3.2.7',retail:'4.3.2.8',retailSeats:'4.3.2.8',auditorium:'premissa de projeto; fora do escopo 1.3'})[row.kind];}
 return {value,formula,item};
}

// Ajusta um estudo ISO à base escolhida: classes, áreas por pessoa, ocupação e a base gravada em cada grupo.
export function applyIsoEdition(study,edition){const s=structuredClone(study);s.isoConfig={...defaultIsoConfig(),...s.isoConfig,edition};const office=(edition==='iso2020'?ISO2020_OFFICE:ISO_OFFICE)[s.isoConfig.officeClass];
 const previous=study.isoConfig?.edition==='iso2020'?'iso2020':'n69';
 const fixRow=row=>{row.iso={...defaultIsoRow(),...row.iso};if(row.kind==='office'&&office){const saved={...(row.iso.areaByEdition||{}),[previous]:row.iso.areaPerPerson},back=saved[edition];row.iso.areaByEdition=saved;row.iso.areaPerPerson=Math.min(office.max,Math.max(office.min,back??row.iso.areaPerPerson));row.iso.utilization=office.utilization;}return row;};
 if(s.populationCalc?.rows)s.populationCalc.rows=s.populationCalc.rows.map(fixRow);s.populationCalc&&(s.populationCalc.last=null);
 const tabulated=g=>{try{if(edition==='iso2020'){iso2020Door(g.width,g.door);iso2020Motion(g.speed);iso2020Transfer(g.width);}else{isoDoor(g.width,g.door);isoMotion(g.speed);}return true;}catch{return false;}};
 const fixGroup=g=>{const saved={...(g.iso?.sourceByEdition||{}),[previous]:g.iso?.source||'table'};return {...g,iso:{...defaultIsoGroup(),...g.iso,edition,sourceByEdition:saved,source:tabulated(g)?(saved[edition]&&saved[edition]!=='auto'?saved[edition]:'table'):'manufacturer',...(edition==='iso2020'&&!g.iso?.customOccupancy?{occupancy:80}:{})}};};
 s.groups=(s.groups||[]).map(fixGroup);s.auxiliary=(s.auxiliary||[]).map(a=>({...a,groups:(a.groups||[]).map(fixGroup)}));
 if(s.populationCalc?.rows)s.populationCalc.rows=s.populationCalc.rows.map(r=>r.groups?{...r,groups:r.groups.map(fixGroup)}:r);
 return s;}
