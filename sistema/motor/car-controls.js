// TES · motor de cálculo: parte de cálculo de car-controls.js (a parte de tela ficou em public/car-controls.js).
import {cabinOccupancy,nominalCapacity} from './cabin-occupancy.js';
import {fleetCars,resizeFleet,changeCar,TIMING_FIELDS,CAR_FIELDS,probableCarStops,manufacturerDoorData,doorDivergence} from './fleet.js';
import {DOORS,motionCheck,accelerationMessage,jerkMessage} from './engine.js';
import {isoDoor,isoMotion,ISO_TRANSFER} from './iso-data.js';
import {effectiveIsoGroup} from './iso-engine.js';
import {DOOR_TYPE_NAMES,doorTimesFor} from './door-time-reference.js';
export const clone=x=>structuredClone(x);
export const valid=v=>Number.isFinite(v)&&v>0;
export function carTiming(study,group,car){
 let c={...car,iso:{...group.iso,...car.iso}};if(study.trafficModel==='iso8100')try{c=effectiveIsoGroup(c);}catch{}
 const stops=probableCarStops(study,{...group,iso:c.iso},c),pc=study.trafficModel==='iso8100'?c.capacity*(c.iso.occupancy??80)/100*(c.iso.capacityReduction?.5:1):nominalCapacity(c); /* NBR e FAB: lotação nominal (decisão 9.5.7); a conversão por parada preserva o ciclo */
 return {...c,cabinOccupancy:cabinOccupancy(c),transferPerStop:c.transferMode==='per-stop'?c.transferPerStop:valid(stops)&&valid(c.passenger)?pc*c.passenger*(study.trafficModel==='iso8100'?2:1)/stops:null};
}
export function doorReference(study,car){if(study.trafficModel==='iso8100'){try{const d=isoDoor(car.width,car.door);return d.open+d.close;}catch{return null;}}return DOORS[car.door]?.time??null;}
export function doorTotal(car){return Number.isFinite(car.open)&&Number.isFinite(car.close)?car.open+car.close:null;}
export function doorExceeded(study,car){const ref=doorReference(study,car);return ref!==null&&Number.isFinite(car.open)&&Number.isFinite(car.close)&&car.open+car.close>ref+1e-9;}
export function copyCars(study,groupIndex,source,targets,scope='all'){
 let s=clone(study);const g0=s.groups[groupIndex];if(!g0||!Number.isInteger(source))throw Error('Selecione a unidade de origem.');const cars0=fleetCars(s,g0);if(!cars0[source])throw Error('Unidade de origem inválida.');const requested=[...new Set(targets)];if(!['all','timing'].includes(scope)||!requested.length||requested.some(i=>i!=='new'&&(!Number.isInteger(i)||i===source||!cars0[i])))throw Error('Selecione outras unidades do mesmo grupo ou a nova unidade como destino.');
 const createNew=requested.includes('new');if(createNew){if(cars0.length>=30)throw Error('O grupo já tem 30 elevadores, o limite do sistema.');s=resizeFleet(s,groupIndex,cars0.length+1);}
 const g=s.groups[groupIndex],cars=fleetCars(s,g),chosen=requested.map(i=>i==='new'?cars0.length:i);
 const fields=scope==='timing'?TIMING_FIELDS:[...CAR_FIELDS,'servedFloorIds'];for(const i of chosen)for(const key of fields){if(cars[source][key]===undefined)delete cars[i][key];else cars[i][key]=clone(cars[source][key]);}g.cars=cars;s.floorTable.enabled=true;for(const r of s.floorTable.rows)r.served[g.id]=cars.some(c=>c.servedFloorIds.includes(r.id));return s;
}
export function adoptDoorTable(study,index,unit){
 const s=clone(study),g=s.groups[index],cars=fleetCars(s,g),c=cars[unit];if(!c)throw Error('Unidade não encontrada.');
 const md=manufacturerDoorData(c),t=doorTimesFor(md.door,md.width);if(!t)throw Error('Este tipo de porta e vão não consta da tabela do fabricante. Informe os tempos manualmente.');
 Object.assign(c,{open:t.open,close:t.close});c.timingSource=`Abertura e fechamento pela tabela do fabricante: porta ${DOOR_TYPE_NAMES[md.door].toLowerCase()}, vão ${md.width} mm (adotados pelo fabricante).`;
 g.cars=cars;s.floorTable.enabled=true;return s;
}
export function autoFillCar(study,index,unit){
 const s=clone(study),g=s.groups[index],cars=fleetCars(s,g),c=cars[unit];if(!c||!valid(c.speed)||!valid(c.capacity)||!valid(c.width)||c.servedFloorIds.length<2)throw Error('Preencha capacidade, velocidade, abertura livre, tipo de porta e pelo menos duas paradas desta unidade.');
 if(study.trafficModel==='iso8100'){
  const doors=isoDoor(c.width,c.door),motion=isoMotion(c.speed);Object.assign(c,doors,motion,{passenger:ISO_TRANSFER[c.width],transferMode:'per-person',preOpeningEnabled:false,preOpening:0,startsLimit:c.startsLimit??0,start:0,iso:{...g.iso,...c.iso,source:'table',startDelay:.6,closingDelay:2}});
  c.timingSource='Preenchimento automático: tabelas 5, 8 e 9 do documento ISO de trabalho; atrasos de referência. Confirme com o fabricante.';
 }else{
  const md=manufacturerDoorData(c),door=DOORS[md.door]?.time;if(!door)throw Error('Selecione o tipo de porta desta unidade.');c.manufacturerDoor=md.door;c.manufacturerWidth=md.width;
  // Explicit engineering presets, not invented manufacturer or NBR motion limits.
  const table=doorTimesFor(md.door,md.width),split=door/2;
  Object.assign(c,{open:table?table.open:split,close:table?table.close:split,acceleration:Math.min(1,Math.max(.3,c.speed*.8)),jerk:c.speed>2.5?1.6:1.2,passenger:md.width<1100?2.4:2,start:null,startToConfirm:true,preOpeningEnabled:false,preOpening:0,startsLimit:c.startsLimit??0});
  c.timingSource=(table?`Abertura e fechamento pela tabela do fabricante: porta ${DOOR_TYPE_NAMES[md.door].toLowerCase()}, vão ${md.width} mm (adotados pelo fabricante). `:'Sugestão de projeto editável: abertura e fechamento dividem igualmente a referência NBR da porta; ')+'Transferência pelo tempo por pessoa da NBR 5665, Tabela 4 (2,4 s com vão abaixo de 1.100 mm; 2,0 s a partir de 1.100 mm). Aceleração = min(1, max(0,30, 0,80 × velocidade)) m/s²; jerk = 1,20 até 2,50 m/s ou 1,60 acima. Aceleração e jerk são premissas de projeto, não valores de fabricante nem prescrições NBR. Tempo adicional de partida preenchido com 0 s e sinalizado para alteração: é dado de cada produto e a NBR 5665 não o define; confirme com o fornecedor. Confirmar todos os valores com o fornecedor.';
 }
 g.cars=cars;s.floorTable.enabled=true;return s;
}
export function carWarnings(study,group,car,{f}){
 const c=carTiming(study,group,car),ref=doorReference(study,c),m=motionCheck(c),out=[];
 if(speedBelowAdopted(c))out.push(`Não atende à exigência mínima: velocidade de produto do fabricante (${f(c.productSpeed)} m/s) inferior à velocidade adotada no cálculo (${f(c.speed)} m/s).`);
 if(doorExceeded(study,c))out.push(`Abertura + fechamento: ${f(c.open+c.close)} s; referência ${f(ref)} s (${study.trafficModel==='iso8100'?'tabela 8 do documento ISO':'NBR 5665, tabela 3'}). Tempos superiores podem reduzir a performance.`);
 if(m.accelerationYellow||m.accelerationRed)out.push(accelerationMessage(c));if(m.jerkYellow)out.push(jerkMessage(c));if(c.startsLimit===0)out.push('PPH do fabricante não informado. Confirmar a capacidade de partidas.');if(study.trafficModel!=='iso8100'){const d=doorDivergence(car);if(d?.any){const nm=k=>DOORS[k]?.label?.toLowerCase()||'não informado',parts=[];if(d.doorType)parts.push(`tipo de porta (projeto: ${nm(d.projectDoor)}; fabricante: ${nm(d.manufacturerDoor)})`);if(d.width)parts.push(`vão (projeto: ${d.projectWidth} mm; fabricante: ${d.manufacturerWidth} mm)`);if(d.time)parts.push(`abertura + fechamento (NBR 5665, Tabela 3, porta do projeto: ${f(d.projectTime)} s; fabricante: ${f(d.manufacturerTime)} s)`);out.push(`Divergência entre projeto e fabricante: ${parts.join('; ')}. ${d.affectsNbr?'Se as medidas do fabricante forem adotadas, o Anexo A da NBR muda (Tabela 3 e/ou Tabela 4); veja o resumo abaixo do Anexo A · Fabricante.':'O Anexo A da NBR não muda: ele usa a porta e o vão do projeto com as Tabelas 3 e 4; a diferença afeta só o Anexo A · Fabricante.'}`);}}if(car?.startToConfirm===true)out.push('Tempo adicional de partida não preenchido: é dado de cada produto (a NBR 5665 não o define). Informe o valor do fornecedor; enquanto estiver vazio, o resultado pelos dados do fabricante não é calculado.');return out;
}
export function speedBelowAdopted(car){return Number.isFinite(car?.productSpeed)&&Number.isFinite(car?.speed)&&car.productSpeed<car.speed;}
export function speedAlertFor(study,groupIndex,carIndex){const g=study.groups[groupIndex];if(!g)return null;const c=fleetCars(study,g)[carIndex];if(!c||!speedBelowAdopted(c))return null;return {group:groupIndex,car:carIndex,label:g.label,product:c.productSpeed,adopted:c.speed};}
export const NEW_CAR_FIELDS=[
 {key:'capacity',label:'Capacidade (pessoas)',help:'car.capacity',attrs:'type="number" min="1" max="100" step="1"'},
 {key:'personMassKg',label:'Massa adotada por pessoa (kg/pessoa)',help:'car.personMassKg',attrs:'type="number" min="1" max="300" step="any"'},
 {key:'speed',label:'Velocidade (m/s)',help:'car.speed',attrs:'type="number" min="0.01" max="100" step="0.01"'},
 {key:'width',label:'Abertura livre da porta (mm)',help:'car.width',attrs:'type="number" min="300" max="4000" step="1"'},
];
export function fillNewCars(study,sel,values){
 let s=study;const num=(v,min,max,integer)=>{const n=Number(String(v??'').trim().replace(',','.'));if(!Number.isFinite(n)||n<min||n>max||integer&&!Number.isInteger(n))return null;return n;};
 const parsed={capacity:num(values.capacity,1,100,true),personMassKg:num(values.personMassKg,1,300),speed:num(values.speed,.01,100),width:num(values.width,300,4000,true),door:DOORS[values.door]?values.door:null};
 const labels={capacity:'Capacidade (1 a 100 pessoas, número inteiro)',personMassKg:'Massa por pessoa (1 a 300 kg)',speed:'Velocidade (0,01 a 100 m/s)',width:'Abertura livre da porta (300 a 4000 mm, número inteiro)',door:'Tipo de porta'};
 const bad=Object.keys(parsed).filter(k=>parsed[k]===null);if(bad.length)throw Error('Confira: '+bad.map(k=>labels[k]).join('; ')+'.');
 for(let j=sel.from;j<sel.to;j++)for(const [k,v] of Object.entries(parsed))s=changeCar(s,sel.group,j,k,v);
 return s;
}
