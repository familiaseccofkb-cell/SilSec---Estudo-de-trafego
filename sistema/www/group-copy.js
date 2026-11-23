// Copy only within the active study; destination identities remain stable.
export function copyStudyGroups(study,sourceIndex,targets){
 if(!Number.isInteger(sourceIndex)||!study.groups[sourceIndex])throw Error('Selecione um grupo de origem válido.');
 const selected=[...new Set(targets)];
 if(!selected.length)throw Error('Selecione pelo menos um grupo de destino.');
 for(const target of selected){
  if(target==='new'){if(study.groups.length>=20)throw Error('Limite de 20 grupos.');continue;}
  if(!Number.isInteger(target)||!study.groups[target])throw Error('Selecione grupos de destino válidos.');
  if(target===sourceIndex)throw Error('O grupo de origem não pode ser um destino.');
 }
 const next=structuredClone(study),source=next.groups[sourceIndex],destinations=[];
 for(const target of selected){
  let index=target,id,label;
  if(target==='new'){
   index=next.groups.length;let number=1;
   while(next.groups.some(g=>g.id==='g'+number))number++;
   id='g'+number;label='Grupo '+(index+1);
  }else({id,label}=next.groups[index]);
  next.groups[index]={...structuredClone(source),id,label};
  for(const row of next.floorTable?.rows||[])row.served[id]=!!row.served[source.id];
  destinations.push(index);
 }
 return {study:next,destinations,activeIndex:destinations.at(-1)};
}

export function groupCopyDialog(study,sourceIndex,targets,{esc,button}){
 const selected=new Set(targets);
 return `<section class="card card-body copy-group-panel" role="dialog" aria-modal="true" aria-labelledby="group-copy-title"><h2 id="group-copy-title">Copiar dados do grupo</h2><label for="group-copy-source">Grupo de origem</label><select id="group-copy-source" data-group-copy-source>${study.groups.map((g,i)=>`<option value="${i}" ${i===sourceIndex?'selected':''}>${esc(g.label||'Grupo '+(i+1))}</option>`).join('')}</select><p>Selecione um ou mais destinos. Os dados dos equipamentos, tempos, dimensões e atendimento por pavimento serão substituídos. O nome e a identificação de cada grupo de destino serão mantidos.</p><fieldset><legend>Grupos de destino</legend><div class="group-copy-destinations">${study.groups.map((g,i)=>`<label class="group-copy-choice ${i===sourceIndex?'is-source':''}"><input type="checkbox" id="group-copy-target-${i}" data-group-copy-destination="${i}" ${i===sourceIndex?'disabled':selected.has(i)?'checked':''}><span>${esc(g.label||'Grupo '+(i+1))}${i===sourceIndex?' · origem (indisponível como destino)':''}</span></label>`).join('')}<label class="group-copy-choice"><input type="checkbox" id="group-copy-new" data-group-copy-destination="new" ${study.groups.length>=20?'disabled':selected.has('new')?'checked':''}><span>Criar novo grupo${study.groups.length>=20?' · limite de 20 atingido':''}</span></label></div></fieldset><p>A cópia invalida os resultados anteriores. Recalcule o estudo completo antes de gerar o relatório.</p><div class="buttons">${button('confirm-copy-group','Confirmar cópia','','',targets.length?'':'disabled')}${button('cancel-copy-group','Cancelar')}</div></section>`;
}
