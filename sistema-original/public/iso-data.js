// User-selected alternative: the supplied ABNT N69 working document, not a published ISO edition.
export const ISO_PROVENANCE='Opção ISO 8100 baseada no texto de trabalho ABNT/CB-002/CE 002 138 018 N69, reunião de 21/05/2025. Documento em elaboração; não equivale à edição publicada ISO 8100-32:2020 nem certifica sua conformidade.';
export const ISO_CLASSES={prestige:'Superior (Prestige)',standard:'Intermediário (Standard)',open:'Ambiente aberto (Open floor)',dense:'Alta densidade (Trade floor)'};
export const RES_CLASSES={prestige:'Superior',standard:'Intermediário',minimum:'Mínimo'};
export const ISO_OFFICE={prestige:{min:8,max:10,utilization:80},standard:{min:6,max:8,utilization:80},open:{min:5,max:7,utilization:85},dense:{min:4,max:6,utilization:90}};
export const ISO_RESIDENTIAL={studio:[1,1.5,2],apartment1:[1.5,1.8,2],apartment2:[2,3,4],apartment3:[3,4,6],apartment4:[4,5,7]};
export const ISO_MOTION=[[.75,.4,.8],[1,.4,.8],[1.5,.6,.9],[1.6,.6,.9],[1.75,.6,.9],[2,.6,.9],[2.5,.7,.9],[3,.9,1],[3.5,.9,1],[4,1,1],[5,1,1],[6,1,1],[7,1,1],[8,1,1],[9,1,1],[10,1,1]];
export const ISO_WIDTHS=[800,900,1000,1100,1200];
export const ISO_TRANSFER={800:1.2,900:1.1,1000:1,1100:1,1200:.9};
export const isIso=s=>s?.trafficModel==='iso8100';
export const defaultIsoConfig=()=>({officeClass:'standard',residentialClass:'standard',intervalChoice:'strict',customInterval:40,openDemandPercent:12,localMinimum:0,multipleEntrances:false,uniformModel:true,controlType:'conventional',projectCnpj:'',approvalDate:''});
export const defaultIsoRow=()=>({areaPerPerson:7,utilization:80,hotelPersons:2,stairsSameHall:false,stairsUnrestricted:false,customDiscount:false});
export const defaultIsoGroup=()=>({source:'table',occupancy:80,startDelay:.6,preOpening:0,closingDelay:2,capacityReduction:false,customOccupancy:false,ratedLoad:0,cabinArea:0});
export function isoDoor(width,door){if(!ISO_WIDTHS.includes(width)||!['central','lateral'].includes(door))throw Error('Modelo ISO: tabela de portas exige abertura central ou lateral e vão de 800, 900, 1.000, 1.100 ou 1.200 mm. Use premissas do fabricante para outros valores.');return door==='central'?{open:width<=1000?2.5:2.6,close:width<=1000?3.5:3.6}:{open:width<=1000?3.4:3.8,close:width<=1000?5.1:5.4};}
export function isoMotion(speed){const point=ISO_MOTION.find(row=>row[0]===speed);if(!point)throw Error('Modelo ISO: velocidade não consta da tabela 9 do documento. Selecione um valor tabelado ou a base Fabricante / premissas personalizadas.');return {acceleration:point[1],jerk:point[2]};}
export function isoOccupancyRange(study){if(study.use==='hotel')return [.5,.5];if(study.use==='residential')return [.5,study.isoConfig.residentialClass==='prestige'?.65:study.isoConfig.residentialClass==='minimum'?1:.8];if(['offices','single','hospitalSupport','school'].includes(study.use))return [.5,.8];return null;}
export function isoCriteria(study,count){const config={...defaultIsoConfig(),...study.isoConfig},index=count<=1?0:count===2?1:count===3?2:3,range=(one,two,three,four)=>[one,two,three,four][index];let rate=.12,limitRange,strict=false,notes=[];
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
 if(row.kind==='office'){const rule=ISO_OFFICE[config.officeClass];if(!rule||!positive(p.areaPerPerson)||p.areaPerPerson<rule.min||p.areaPerPerson>rule.max||p.utilization!==rule.utilization)throw Error('Modelo ISO: confira área por pessoa e fator de utilização da classe de escritório escolhida.');value=row.amount*p.utilization/100/p.areaPerPerson;formula=`${row.amount} m² úteis × ${p.utilization}% / ${p.areaPerPerson} m²/pessoa`;item='4.3.2.1, tabela 1, fórmula (1)';}
 else if(ISO_RESIDENTIAL[row.kind]){const factor=ISO_RESIDENTIAL[row.kind][['prestige','standard','minimum'].indexOf(config.residentialClass)];if(!positive(factor))throw Error('Classe residencial inválida.');value=row.amount*factor;formula=`${row.amount} unidades × ${factor} pessoa(s)`;item='4.3.2.2, tabela 2';}
 else if(row.kind==='serviceBedroom'){value=row.amount;formula=`${row.amount} dormitórios de serviço × 1`;item='4.3.2.2, nota';}
 else if(row.kind==='hotel'){if(!positive(p.hotelPersons)||p.hotelPersons<1||p.hotelPersons>2)throw Error('Modelo ISO: informe de 1 a 2 hóspedes por quarto.');value=row.amount*p.hotelPersons;formula=`${row.amount} quartos × ${p.hotelPersons}`;item='4.3.2.3';}
 else {const divisors={restaurant:1.5,classroom:2,administration:7,retail:4,healthArea:7},factors={hospital:2.5,healthRoom:2.5,garage:1.4,garageMoto:1,retailSeats:1,auditorium:1};if(divisors[row.kind]){value=row.amount/divisors[row.kind];formula=`${row.amount} m² / ${divisors[row.kind]}`;}else if(factors[row.kind]){value=row.amount*factors[row.kind];formula=`${row.amount} × ${factors[row.kind]}`;}else throw Error('Componente sem regra populacional neste modelo.');item=({restaurant:'4.3.2.4',classroom:'4.3.2.5',administration:'4.3.2.5',garage:'4.3.2.6',garageMoto:'4.3.2.6',hospital:'4.3.2.7',healthRoom:'4.3.2.7',healthArea:'4.3.2.7',retail:'4.3.2.8',retailSeats:'4.3.2.8',auditorium:'premissa de projeto; fora do escopo 1.3'})[row.kind];}
 return {value,formula,item};
}
