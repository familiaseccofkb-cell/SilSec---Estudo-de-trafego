import {fleetCars,changeCar} from './fleet.js';
export function linkedCarIndex(study,g){const cars=fleetCars(study,g);const i=cars.findIndex(c=>c.id===g.siteDimensions?.carId);return i<0?0:i;}
export function syncDimensionalDoor(study,index,fromDimensions=false){
 const g=study.groups[index];if(!g)return;g.siteDimensions||={};
 const cars=fleetCars(study,g),i=linkedCarIndex(study,g);
 if(!cars.length){if(fromDimensions)g.width=g.siteDimensions.doorWidth;else g.siteDimensions.doorWidth=g.width;return;}
 g.siteDimensions.carId=cars[i].id;
 if(fromDimensions){
  // Reuse the individual-elevator edit path so floors and equipment stay valid.
  const updated=changeCar(study,index,i,'width',g.siteDimensions.doorWidth);
  Object.assign(g,updated.groups[index]);study.floorTable=updated.floorTable;
  if(i===0)g.width=g.cars[i].width;
 }else g.siteDimensions.doorWidth=cars[i].width;
}
export function copySiteDimensions(study,source,targets){const s=structuredClone(study);if(!s.groups[source]||!Array.isArray(targets)||!targets.length)throw Error('Selecione a origem e ao menos um grupo de destino.');for(const target of new Set(targets)){if(!Number.isInteger(target)||target===source||!s.groups[target])throw Error('Grupo de destino inválido.');const g=s.groups[target];g.siteDimensions=structuredClone(s.groups[source].siteDimensions||{});delete g.siteDimensions.carId;g.dimensionReference=structuredClone(s.groups[source].dimensionReference||{});syncDimensionalDoor(s,target,true);}return s;}
export function heightWarnings(d){return [['cabinHeight',2200,'Altura interna da cabina'],['doorHeight',2000,'Altura livre da porta']].flatMap(([key,min,label])=>Number.isFinite(d?.[key])&&d[key]<min?[{key,min,message:label+': '+d[key]+' mm, inferior à referência mínima de '+min+' mm definida para este estudo.'}]:[]);}
export function dimensionalCopyDialog(study,index,esc){return `<dialog open class="silsec-dialog" id="dim-copy-dialog"><h2>Copiar parâmetros dimensionais</h2><p>Origem: ${esc(study.groups[index].label)}. Copia o levantamento e sua referência; confira as dimensões reais do destino.</p>${study.groups.map((g,i)=>`<label class="group-copy-choice"><input type="checkbox" data-dimension-target="${i}" ${i===index?'disabled':''}>${esc(g.label)}${i===index?' · origem':''}</label>`).join('')}<div class="buttons"><button class="btn" data-action="silsec-confirm-dim-copy" data-source="${index}">Copiar para selecionados</button><button class="btn" data-action="silsec-close-dialog">Cancelar</button></div></dialog>`;}
