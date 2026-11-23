import {hasFleet,projectFleet} from './fleet.js';
import {synchronizeFloorTable} from './building-floors.js';
import {calculateGroup} from './engine.js';
import {calculateIsoGroup} from './iso-engine.js';
import {isIso} from './iso-data.js';
import {calculateGroupTravel} from './travel-curves.js';

// Use the same equipment projection as the full calculation. The legacy group
// defaults must not replace values edited in individual elevator columns.
export function calculateTravelPreview(study,groupIndex=0){
 const selected=study.groups[groupIndex];
 if(!selected)throw Error('Selecione um grupo de elevadores para visualizar as curvas.');
 const source={...study,groups:[selected]};
 const projected=synchronizeFloorTable(hasFleet(source)?projectFleet(source):source);
 return projected.groups.map(group=>{
  try{
   let curves;
   if(isIso(projected)){
    const {iso}=calculateIsoGroup(group);
    curves=calculateGroupTravel(iso.used,{model:'iso8100',passengers:iso.PC,probableStops:iso.S+1,averageDistance:2*iso.H*iso.df/(iso.S+1)});
   }else{
    const result=calculateGroup(group,projected.method);
    curves=calculateGroupTravel(group,{probableStops:result.stops,dwell:projected.operation.dwell});
   }
   return {group,curves};
  }catch(error){return {group,error:error.message};}
 });
}
