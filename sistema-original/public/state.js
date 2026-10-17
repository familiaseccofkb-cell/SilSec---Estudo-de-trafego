import {isBasic,normalizeBasic} from './basic.js';
import {normalizeStudyDimensions} from './dimensions.js';
import {normalizeFloorTable} from './building-floors.js';
import {normalizeOperation} from './performance.js';
import {normalizeEnergy} from './energy.js';
import {normalizeTractionEquipment} from './traction-energy.js';
import {isIso,defaultIsoConfig,defaultIsoGroup,defaultIsoRow} from './iso-data.js';
import {normalizeStudyRecords} from './records.js';
import {defaultPopulationCalc,normalizePopulationCalc,normalizePopulationRow,populationStatus,populationSnapshot,calculatePopulation,populationOptions} from './population.js';
import {clone,defaultStudy,defaultGroup,populationComponent,validateStudy} from './engine.js';
import {normalizeFloorConfiguration} from './floors.js';
export const STORAGE_KEY='silsec-traffic-v1';
export const ENTITLEMENTS={prototype:{label:'Protótipo privado',maxScenarios:5,compare:true,export:true},essential:{label:'Essencial • demonstração',maxScenarios:3,compare:true,export:true},professional:{label:'Profissional • demonstração',maxScenarios:5,compare:true,export:true}};
export function normalizeStudy(study){
 if(isBasic(study))return normalizeBasic(study);
 const s=normalizeStudyRecords(clone(study));s.operation=normalizeOperation(s.operation);s.energy=normalizeEnergy(s.energy);s.trafficModel=s.trafficModel??'nbr5665';if(isIso(s)){s.isoConfig={...defaultIsoConfig(),...s.isoConfig};s.groups=s.groups?.map(g=>({...g,iso:{...defaultIsoGroup(),...g.iso}}));}if(Array.isArray(s.groups))s.groups=s.groups.map(g=>({...g,startsLimit:g.inputVersion===1&&g.startsLimit===null?null:g.startsLimit??0,preOpeningEnabled:g.preOpeningEnabled??(isIso(s)&&g.iso?.preOpening>0),preOpening:g.preOpening??g.iso?.preOpening??0}));s.method='precision';if(s.populationDefinition===undefined)s.populationDefinition=typeof s.populationBasis==='string'&&!/População calculada:|Exemplo:/.test(s.populationBasis)?s.populationBasis.slice(0,2000):'';
 s.populationCalc=normalizePopulationCalc(s.populationCalc||defaultPopulationCalc(s.use),s.use);if(isIso(s)){s.populationCalc.rows=s.populationCalc.rows.map(row=>({...row,iso:{...defaultIsoRow(),...row.iso},groups:row.groups?.map(g=>({...g,iso:{...defaultIsoGroup(),...g.iso}}))}));}
 let previous;try{previous=populationStatus(s);}catch{}
 const oldItems=Array.isArray(s.auxiliary)?s.auxiliary:[];
 const moved=oldItems.filter(item=>item&&!s.populationCalc.rows?.some(row=>row.id&&row.id===item.id)).map(item=>normalizePopulationRow({...populationComponent(s.use,item.kind),...item,floor:item.floor??1,servedByEscalator:item.sharedEscalators??false},s.use));
 if(Array.isArray(s.populationCalc.rows))s.populationCalc.rows.push(...moved);
 if(Array.isArray(s.auxiliary)||s.auxiliary===undefined)s.auxiliary=[];
 if(s.populationCalc.last&&moved.length){
  s.populationCalc.last.rows.push(...clone(moved).map(({groups,auditoriumDemandPercent,auditoriumInterval,...row})=>row));
  const ids=new Set(moved.map(row=>row.id));
  s.populationCalc.last.additionalLines=(s.populationCalc.last.additionalLines||[]).filter(line=>!ids.has(line.sourceId));
  try{const updated=populationStatus(s);if(previous?.calculated===s.population){s.population=updated.calculated;s.populationBasis=calculatePopulation(s.populationCalc.last.use,s.populationCalc.last.rows,s.populationCalc.last).basis;}}catch{}
 }
 if(Array.isArray(s.populationCalc.rows))s.populationCalc.rows=s.populationCalc.rows.map(row=>['external','exclusive'].includes(row.mode)?{...row,groups:(row.groups||[defaultGroup()]).map(g=>({...g,startsLimit:g.inputVersion===1&&g.startsLimit===null?null:g.startsLimit??0,preOpeningEnabled:g.preOpeningEnabled??(isIso(s)&&g.iso?.preOpening>0),preOpening:g.preOpening??g.iso?.preOpening??0})),auditoriumDemandPercent:row.auditoriumDemandPercent??100,auditoriumInterval:row.auditoriumInterval??60}:row);
 if(s.auditoriumDemandPercent===undefined)s.auditoriumDemandPercent=100;
 if(s.auditoriumInterval===undefined)s.auditoriumInterval=60;
 if(s.use==='auditorium'){
  const auditorium={...populationComponent('offices','auditorium'),label:s.name,amount:Math.ceil(s.population),groups:clone(s.groups),auditoriumDemandPercent:s.auditoriumDemandPercent,auditoriumInterval:s.auditoriumInterval,notes:s.populationBasis.slice(0,2000)};
  s.use='offices';s.populationCalc.rows=[auditorium,...s.populationCalc.rows.filter(row=>row.kind!=='auditorium'||row.mode!=='main')];s.population=0;
  try{const calculation=calculatePopulation(s.use,s.populationCalc.rows,populationOptions(s));s.populationBasis=calculation.basis;s.populationCalc.last=populationSnapshot(s);}catch{}
 }
 if(Array.isArray(s.groups))s.groups=s.groups.map(g=>({...g,energyEquipment:normalizeTractionEquipment(g.energyEquipment)}));
 if(Array.isArray(s.populationCalc.rows))s.populationCalc.rows=s.populationCalc.rows.map(row=>Array.isArray(row.groups)?{...row,groups:row.groups.map(g=>({...g,energyEquipment:normalizeTractionEquipment(g.energyEquipment)}))}:row);
 if(s.name==='Referência da planilha v3')s.name='Exemplo de estudo';
 if(s.populationBasis==='População informada na planilha de referência. Substituir pela memória de população do empreendimento.')s.populationBasis='População informada no projeto. Use o cálculo populacional para registrar sua composição.';
 if(s.populationCalc.floorSequenceVersion!==2){
  let prior;try{prior=populationStatus(s);}catch{}
  s.populationCalc=normalizeFloorConfiguration(s.populationCalc);
  try{
   let calculated=calculatePopulation(s.use,s.populationCalc.rows,populationOptions(s));
   if(s.population>calculated.value){const candidate=s.populationCalc.rows.find((row,index)=>row.mode==='main'&&calculated.lines[index]?.declarationEligible&&!calculated.lines[index]?.escalatorExcluded);if(candidate){const otherRaw=calculated.raw-calculated.lines[s.populationCalc.rows.indexOf(candidate)].net;candidate.declaredPopulation=Math.max(candidate.declaredPopulation||0,Math.ceil(s.population)-Math.ceil(otherRaw-1e-10));candidate.notes=(candidate.notes+'\nDeclaração convertida do total manual do estudo anterior: '+s.population+' pessoas. '+s.populationBasis).slice(0,2000);calculated=calculatePopulation(s.use,s.populationCalc.rows,populationOptions(s));}}
   if(s.populationCalc.last||s.population>calculated.value||s.populationCalc.rows.some(row=>row.declaredPopulation>0)){s.populationCalc.last=populationSnapshot(s);s.population=calculated.value;s.populationBasis=calculated.basis;}
  }catch{
   const candidate=s.populationCalc.rows?.find(row=>row.mode==='main'&&!row.isStreetAccess&&row.exclusion==='none');
   if(candidate&&s.population>0&&candidate.amount===0){candidate.declaredPopulation=Math.ceil(s.population);candidate.notes=(candidate.notes+'\nPopulação declarada convertida do estudo anterior: '+s.population+' pessoas. '+s.populationBasis).slice(0,2000);try{const calculated=calculatePopulation(s.use,s.populationCalc.rows,populationOptions(s));s.population=calculated.value;s.populationBasis=calculated.basis;s.populationCalc.last=populationSnapshot(s);}catch{}}
  }
 }
 // A saved result may predate the per-environment adoption rule. Retain its
 // inputs and refresh the applied total without discarding valid saved studies.
 try{const status=populationStatus(s);if(!status.pending&&status.differs){s.population=status.value;s.populationBasis=calculatePopulation(s.use,s.populationCalc.last.rows,s.populationCalc.last).basis+(s.populationDefinition?.trim()?'\nComo a população foi definida: '+s.populationDefinition.trim():'');}}catch{}
 normalizeFloorTable(s);normalizeStudyDimensions(s);return s;
}
export function initialState(){return {version:1,plan:'prototype',draft:normalizeStudy(defaultStudy()),scenarios:[],view:'study',group:0,section:'elevators'};}
export function saveScenario(state,study,id){const e=validateStudy(study);if(e.length)throw new Error(e.join('\n'));const items=clone(state.scenarios),idx=items.findIndex(s=>s.id===id);if(idx<0&&items.length>=ENTITLEMENTS[state.plan].maxScenarios)throw new Error('Limite de cenários da demonstração atingido. Exclua um cenário ou selecione o plano Profissional de demonstração.');const scenario={id:id||'s'+Date.now().toString(36)+Math.random().toString(36).slice(2,6),savedAt:new Date().toISOString(),study:clone(study)};if(idx>=0)items[idx]=scenario;else items.push(scenario);return {...state,scenarios:items};}
export function deleteScenario(state,id){return {...state,scenarios:state.scenarios.filter(s=>s.id!==id)};}
export function decodeImport(text){if(text.length>2000000)throw new Error('O arquivo deve ter até 2 MB.');const data=JSON.parse(text);if(data.schemaVersion!==1||!data.study)throw new Error('Use um arquivo de estudo exportado por este protótipo.');const study=normalizeStudy(data.study),errors=validateStudy(study);if(errors.length)throw new Error(errors.join('\n'));return study;}
export function restoreState(text){try{const x=JSON.parse(text);x.draft=normalizeStudy(x.draft);if(Array.isArray(x.scenarios))x.scenarios=x.scenarios.map(s=>({...s,study:normalizeStudy(s.study)}));const partial=x.calculationComplete===false&&x.draft.schemaVersion===1&&Array.isArray(x.draft.groups)&&x.draft.groups.length>=1&&x.draft.groups.length<=20&&Array.isArray(x.draft.populationCalc.rows)&&x.draft.populationCalc.rows.length>=1&&x.draft.populationCalc.rows.length<=100;if(x.version!==1||!ENTITLEMENTS[x.plan]||!partial&&validateStudy(x.draft).filter(error=>!error.startsWith('Recalcule e aplique')).length||!Array.isArray(x.scenarios)||x.scenarios.length>5||x.scenarios.some(s=>!s.id||validateStudy(s.study).length))return initialState();return {...initialState(),...x,view:'study',group:0,section:'elevators'};}catch{return initialState();}}
