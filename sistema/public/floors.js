// Composition positions are separate from served-floor names and physical levels.
export const MAX_COMPOSITIONS=100;
const copy=value=>JSON.parse(JSON.stringify(value));
const alphabetic=mark=>/^[A-Z]{1,2}$/.test(mark);
export function parseFloorMark(value){
 const mark=String(value??'').trim().toUpperCase().replaceAll('−','-');
 if(mark.length<1||mark.length>2||!(/^-?\d+$/.test(mark)||alphabetic(mark)))throw new Error('Use números ou letras, com no máximo 2 caracteres (por exemplo −1, 0, 1, A ou AA).');
 return /^-?\d+$/.test(mark)?String(Number(mark)):mark;
}
export function nextFloorMark(value){
 const mark=parseFloorMark(value);
 if(!alphabetic(mark))return parseFloorMark(Number(mark)+1);
 let number=0;for(const letter of mark)number=number*26+letter.charCodeAt(0)-64;
 number++;let next='';while(number){number--;next=String.fromCharCode(65+number%26)+next;number=Math.floor(number/26);}
 return parseFloorMark(next);
}
function renumberAfter(rows,index){
 const used=new Set(rows.slice(0,index+1).map(row=>parseFloorMark(row.floorMark)));
 if(used.size!==index+1)throw new Error('A posição já pertence a uma composição anterior. As anteriores são preservadas; escolha uma marcação diferente.');
 let mark=rows[index].floorMark;
 for(let i=index+1;i<rows.length;i++){
  mark=nextFloorMark(mark);
  if(used.has(mark))throw new Error('A sequência gerada repetiria um pavimento anterior. Escolha outra marcação; as composições anteriores permanecem preservadas.');
  rows[i].floorMark=mark;used.add(mark);
 }
}
function positions(pc,reviewNetwork=false){
 const levels=new Map();
 for(const row of pc.rows){row.servedFloorMark=parseServedFloorMark(row.servedFloorMark??row.floorMark);if(!levels.has(row.servedFloorMark))levels.set(row.servedFloorMark,row.servedFloorLevel??row.floor);row.servedFloorLevel=levels.get(row.servedFloorMark);}
 const access=pc.rows.find(row=>row.isStreetAccess),base=access?.servedFloorLevel??0;
 pc.rows.forEach(row=>{row.floor=row.servedFloorLevel-base;if(!Number.isInteger(row.floor)||row.floor<-200||row.floor>200)throw new Error('O nível do andar deve ser inteiro entre −200 e 200.');});
 if(access)pc.accessFloor=0;
 if(reviewNetwork&&pc.escalators?.enabled)pc.escalators.capacityConfirmed=false;
 pc.floorSequenceVersion=2;return pc;
}
export function validateFloorConfiguration(pc){
 const rows=pc?.rows;if(!Array.isArray(rows))return ['Composições de pavimento inválidas.'];
 const errors=[];
 if(rows.filter(row=>row?.isStreetAccess===true).length>1)errors.push('Somente uma composição pode confirmar o andar de acesso à rua.');
 if(rows.some(row=>row?.isStreetAccess!==undefined&&typeof row.isStreetAccess!=='boolean'))errors.push('Confirmação do acesso à rua inválida.');
 if(pc.floorSequenceVersion>=1){
  const used=new Set(),served=new Map();for(const [i,row] of rows.entries()){
   try{const mark=parseFloorMark(row.floorMark);if(mark!==row.floorMark)errors.push(`Composição ${i+1}: posição deve ser normalizada.`);if(used.has(mark))errors.push('As posições das composições não podem se repetir.');used.add(mark);
    if(pc.floorSequenceVersion>=2){const floor=parseServedFloorMark(row.servedFloorMark);if(floor!==row.servedFloorMark)errors.push('Normalize a marcação do andar servido.');if(served.has(floor)&&served.get(floor)!==row.floor)errors.push('Ambientes do mesmo andar devem usar o mesmo nível físico.');served.set(floor,row.floor);}
   }catch(error){errors.push(`Composição ${i+1}: ${error.message}`);}
   if(pc.floorSequenceVersion===1&&i&&row.floor<=rows[i-1].floor)errors.push('A sequência de composições deve subir do pavimento inferior para o superior.');
   if(row.isStreetAccess&&row.floor!==pc.accessFloor)errors.push('O andar confirmado como acesso deve coincidir com o nível de acesso do cálculo.');
  }
 }
 return [...new Set(errors)];
}
export function normalizeFloorConfiguration(pc){
 const next=copy(pc);if(next.floorSequenceVersion===2)return next;
 if(!Array.isArray(next.rows))return next;
 if(!next.floorSequenceVersion)next.rows.sort((a,b)=>a.floor-b.floor);
 const used=new Set();let previous;
 for(const row of next.rows){
  row.isStreetAccess=row.isStreetAccess??false;
  let mark;try{mark=parseFloorMark(row.floorMark??row.floor);}catch{mark='A';}
  row.servedFloorMark=row.servedFloorMark??mark;row.servedFloorLevel=row.servedFloorLevel??row.floor;
  if(used.has(mark)){mark=previous;do{try{mark=nextFloorMark(mark);}catch{mark='A';}}while(used.has(mark));}
  row.floorMark=mark;used.add(mark);previous=mark;
 }
 return positions(next);
}
export function parseServedFloorMark(value){const s=String(value??'').trim().toUpperCase().replaceAll('−','-');if(s.length>2||!/^(?:-?\d{1,2}|[A-Z][A-Z0-9]?)$/.test(s))throw Error('Use uma marcação numérica, letras, S1 ou S2.');return /^-?\d+$/.test(s)?String(Number(s)):s;}
export function setServedFloor(pc,index,value,level){
 const next=copy(pc),row=next.rows[index];if(!row)throw new Error('Composição não encontrada.');
 const mark=parseServedFloorMark(value),known=next.rows.find((item,i)=>i!==index&&item.servedFloorMark===mark);
 const access=next.rows.find(item=>item.isStreetAccess),offset=access&&/^-?\d+$/.test(access.servedFloorMark)?Number(access.servedFloorMark):0;
 const target=level??known?.servedFloorLevel??(/^-?\d+$/.test(mark)?Number(mark)-offset:row.servedFloorLevel??row.floor);
 if(!Number.isInteger(target)||target<-200||target>200)throw new Error('Informe o nível físico do andar entre −200 e 200.');
 row.servedFloorMark=mark;row.servedFloorLevel=target;
 if(level!==undefined)next.rows.forEach(item=>{if(item.servedFloorMark===mark)item.servedFloorLevel=target;});
 return positions(next,true);
}
export function setFloorMark(pc,index,value){
 const next=copy(pc);if(!next.rows[index])throw new Error('Composição não encontrada.');
 const mark=parseFloorMark(value);
 if(next.rows.slice(0,index).some(row=>row.floorMark===mark))throw new Error('A posição já pertence a uma composição anterior. As anteriores são preservadas; escolha uma marcação diferente.');
 next.rows[index].floorMark=mark;renumberAfter(next.rows,index);return positions(next);
}
export function copyFloorComposition(pc,index,count,destination='next',floorRows=[]){
 if(!Number.isInteger(count)||count<1||count>MAX_COMPOSITIONS-pc.rows.length)throw new Error(`Informe de 1 a ${Math.max(0,MAX_COMPOSITIONS-pc.rows.length)} cópias, respeitando o limite de ${MAX_COMPOSITIONS} composições.`);
 if(!['next','same'].includes(destination))throw new Error('Escolha o destino das cópias.');
 const next=copy(pc),source=next.rows[index];if(!source)throw new Error('Composição não encontrada.');
 let served=source.servedFloorMark;const floorIndex=floorRows.findIndex(r=>r.mark===served);if(floorRows.length&&destination==='next'&&(floorIndex<0||floorIndex+count>=floorRows.length))throw Error('Não há pavimentos seguintes suficientes na tabela. Amplie a tabela ou copie para o mesmo andar.');
 const copies=Array.from({length:count},(_,i)=>{if(destination==='next')served=floorRows.length?floorRows[floorIndex+i+1].mark:nextFloorMark(served);const known=floorRows.find(r=>r.mark===served)||next.rows.find(row=>row.servedFloorMark===served);return {...copy(source),servedFloorMark:served,servedFloorLevel:known?.level??known?.servedFloorLevel??(source.servedFloorLevel+(destination==='next'?i+1:0)),id:'floor'+Date.now().toString(36)+Math.random().toString(36).slice(2,8)+i,label:(source.label+' · cópia '+(i+1)).slice(0,120),isStreetAccess:false};});
 next.rows.splice(index+1,0,...copies);renumberAfter(next.rows,index);return positions(next,true);
}
export function moveFloorComposition(pc,index,direction){
 if(![-1,1].includes(direction)||!pc.rows[index]||!pc.rows[index+direction])throw new Error('A composição já está no extremo desta sequência.');
 const next=copy(pc),start=Math.min(index,index+direction),firstMark=next.rows[0].floorMark,firstLevel=next.rows[0].floor;
 [next.rows[index],next.rows[index+direction]]=[next.rows[index+direction],next.rows[index]];
 if(start===0){next.rows[0].floorMark=firstMark;next.rows[0].floor=firstLevel;renumberAfter(next.rows,0);}else renumberAfter(next.rows,start-1);
 return positions(next);
}
export function appendFloorComposition(pc,row,floorRows=[]){
 if(pc.rows.length>=MAX_COMPOSITIONS)throw new Error('Limite de 100 composições atingido.');
 const next=copy(pc),last=next.rows.at(-1),at=floorRows.findIndex(r=>r.mark===last?.servedFloorMark),following=floorRows.length?floorRows[Math.min(at+1,floorRows.length-1)]:null;next.rows.push({...copy(row),floorMark:last?nextFloorMark(last.floorMark):'1',servedFloorMark:following?.mark??(last?nextFloorMark(last.servedFloorMark):'1'),servedFloorLevel:following?.level??(last?last.servedFloorLevel+1:1),isStreetAccess:false});return positions(next,true);
}
export function removeFloorComposition(pc,index){
 if(pc.rows.length<=1)throw new Error('Mantenha pelo menos uma composição.');
 const next=copy(pc),firstMark=next.rows[0].floorMark,firstLevel=next.rows[0].floor;next.rows.splice(index,1);
 if(index===0){next.rows[0].floorMark=firstMark;next.rows[0].floor=firstLevel;renumberAfter(next.rows,0);}else renumberAfter(next.rows,index-1);
 return positions(next,true);
}
export function setStreetAccess(pc,index,checked){
 const next=copy(pc);if(!next.rows[index])throw new Error('Composição não encontrada.');
 if(checked&&next.rows.some((row,i)=>i!==index&&row.isStreetAccess))throw new Error('Já existe um pavimento de acesso à rua. Desmarque o atual antes de confirmar outro.');
 const changed=next.rows[index].isStreetAccess!==checked;if(checked&&changed){const base=next.rows[index].servedFloorLevel;next.rows.forEach(row=>row.servedFloorLevel-=base);}next.rows[index].isStreetAccess=checked;return positions(next,changed);
}
export function floorMarkWarning(row,accessFloor=0,accessMark='0'){
 const mark=row.servedFloorMark??row.floorMark??String(row.floor),preferred=String(row.floor-accessFloor+(/^-?\d+$/.test(accessMark)?Number(accessMark):0));
 if(/[A-Z]/i.test(mark))return `Marcação “${mark}” por letras, fora da sequência numérica preferencial de acessibilidade. A NBR 16858-3:2022, 5.4.2.3.2 a), permite caracteres consistentes com a nomenclatura do edifício e prefere −2, −1, 0, 1, 2 etc. Essa preferência não torna o uso de letras automaticamente irregular. Confira a correspondência com a identificação dos pavimentos do edifício.`;
 if(mark!==preferred)return `Marcação “${mark}” diferente da sequência numérica preferencial. Confira a correspondência entre botões e nomenclatura do edifício. A seleção do acesso principal não deve renumerar os andares. A diferença, por si só, não comprova descumprimento. Referência: NBR 16858-3:2022, 5.4.2.3.2 a).`;
 return '';
}
