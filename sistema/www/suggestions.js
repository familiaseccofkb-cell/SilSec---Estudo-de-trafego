// V0095 · Alternativas para atender ao estudo.
// Quando o estudo NBR 5665 não atende à capacidade de transporte ou ao intervalo, este módulo testa mudanças
// reais no estudo (recalculando tudo a cada tentativa) e devolve as que passam nos critérios.
// Nada aqui é estimativa por proporção: cada alternativa mostrada foi calculada com o mesmo motor do estudo.
import {recalculatePopulationAndStudies,SPEED_OPTIONS} from './engine.js';
import {resizeFleet,CAR_FIELDS} from './fleet.js';

export const STANDARD_CAPACITIES=[4,5,6,8,9,10,12,13,15,16,17,20,21,24,26,30,33];
const MAX_EXTRA_CARS=12,MAX_STEPS=6;
const copy=x=>structuredClone(x);
const fmt=(v,d=2)=>new Intl.NumberFormat('pt-BR',{minimumFractionDigits:d,maximumFractionDigits:d}).format(v);

// Suportado: estudo NBR 5665 com serviço comum (um resultado consolidado). Zonas e grupos independentes ficam de fora.
export function studyFails(result){const n=result?.normative;return !!n&&!result.groupSeparated&&!result.zoneSeparated&&(n.capacityPass===false||n.intervalPass===false);}

function evaluate(study){try{const c=recalculatePopulationAndStudies(copy(study)),n=c.results.normative;if(c.results.groupSeparated||c.results.zoneSeparated)return null;return {study:c.study,capacity:n.capacity,interval:n.interval,required:c.results.required,limit:c.results.limit,pass:n.capacityPass!==false&&n.intervalPass!==false};}catch{return null;}}
const setCount=(study,i,count)=>resizeFleet(study,i,count);
// Aplica a mudança ao grupo e a cada unidade a partir do valor da própria unidade (unidades diferentes sobem cada uma do seu valor).
function setAll(study,key,next){const s=copy(study);s.groups.forEach((g,i)=>{const cars=Array.isArray(g.cars)?g.cars:[];for(const c of cars){const v=next(c,i);if(v!==null&&v!==undefined)c[key]=v;}const value=next(g,i);if(value!==null&&value!==undefined)g[key]=value;});return s;}
const nextOf=(list,value,steps)=>{const bigger=list.filter(x=>x>value+1e-9);return bigger.length>=steps?bigger[steps-1]:null;};

// Produto de cada unidade: capacidade, velocidade, porta, abertura, massa e tempos. Unidades com a mesma configuração são o mesmo produto.
const PRODUCT_KEYS=['capacity','speed','width','door','personMassKg','open','close','acceleration','jerk'];
const productKey=c=>JSON.stringify(PRODUCT_KEYS.map(k=>c[k]??null));
export function productText(c){return `${c.capacity} pessoas · ${fmt(c.speed)} m/s · porta ${c.door||'não informada'} · abertura ${Number.isFinite(c.width)?c.width:'?'} mm`;}
// Agrupa as unidades do grupo por produto (do mais presente para o menos) e escolhe a unidade representativa do produto mais presente.
export function productSimilarity(group){
 const cars=Array.isArray(group?.cars)?group.cars:[];
 if(!cars.length)return null;
 const map=new Map();cars.forEach((c,j)=>{const k=productKey(c);if(!map.has(k))map.set(k,[]);map.get(k).push(j);});
 const ranked=[...map.values()].map(units=>({units,car:cars[units[0]]})).sort((a,b)=>b.units.length-a.units.length||(b.car.capacity||0)-(a.car.capacity||0));
 return {representative:ranked[0].car,products:ranked.map(p=>({units:p.units.map(j=>j+1),description:productText(p.car)}))};
}
// Acrescenta uma unidade copiando o produto representativo (configuração, tempos e pavimentos atendidos).
function copyUnit(study,i,unit,count){
 const s=setCount(study,i,count),g=s.groups[i],j=count-1;
 const fields=Object.fromEntries(CAR_FIELDS.filter(k=>k!=='shaftRowId'&&unit[k]!==undefined).map(k=>[k,copy(unit[k])]));
 g.cars[j]={...g.cars[j],...fields,servedFloorIds:[...unit.servedFloorIds]};
 if(s.floorTable?.rows)for(const r of s.floorTable.rows)r.served[g.id]=g.cars.some(c=>c.servedFloorIds.includes(r.id));
 return s;
}
// Acrescenta elevadores um a um, sempre no conjunto em que o acréscimo mais aumenta a capacidade, até atender.
function addCarsUntilPass(start,reps=new Map()){let study=start,best=evaluate(study);if(!best)return null;let added=0;while(!best.pass&&added<MAX_EXTRA_CARS){let choice=null;for(let i=0;i<study.groups.length;i++){let trial;try{const unit=reps.get(i)&&productSimilarity(study.groups[i])?.representative;trial=unit?copyUnit(study,i,unit,study.groups[i].count+1):setCount(study,i,study.groups[i].count+1);}catch{continue;}const e=evaluate(trial);if(e&&(!choice||e.capacity>choice.e.capacity))choice={trial,e};}if(!choice)return null;study=choice.trial;best=choice.e;added++;}return best.pass?best:null;}
function stepUntilPass(start,change){for(let k=1;k<=MAX_STEPS;k++){const trial=change(start,k);if(!trial)return null;const e=evaluate(trial);if(e?.pass)return e;}return null;}
const raiseCapacity=(study,k)=>{let any=false;const s=setAll(study,'capacity',g=>{const v=nextOf(STANDARD_CAPACITIES,g.capacity,k);if(v!==null)any=true;return v;});return any?s:null;};
const raiseSpeed=(study,k)=>{let any=false;const s=setAll(study,'speed',g=>{const v=nextOf(SPEED_OPTIONS,g.speed,k);if(v!==null)any=true;return v;});return any?s:null;};

const MANUAL={
 count:['Posicionar os novos elevadores nas fileiras e conferir as dimensões da caixa, do poço e da casa de máquinas.','Conferir os pavimentos atendidos e os Dados do fabricante dos novos elevadores (com cadastro por unidade, o sistema copia o produto mais presente no grupo; sem ele, copia os dados do conjunto).'],
 capacity:['Conferir as dimensões da cabina e da caixa para a nova lotação.','Conferir a largura livre da porta e a massa por pessoa adotada.'],
 speed:['Conferir aceleração, jerk e tempos de porta informados pelo fabricante para a nova velocidade.','Conferir última altura, profundidade do poço e percurso para a nova velocidade.','Conferir o PPH limite do fabricante.'],
 cabinOccupancy:['Confirmar com o cliente o critério de ocupação de 100% da lotação (a ISO 8100-32 recomenda 80%).'],
 always:['Conferir o cálculo populacional, os gráficos de performance e o relatório depois da mudança.']
};
const LABEL={count:'elevadores',capacity:'lotação (pessoas)',speed:'velocidade (m/s)',cabinOccupancy:'fator de ocupação (%)'};
// Com cadastro por unidade, mostra os valores das unidades (ex.: 13 / 8), não o valor genérico do grupo.
function shown(g,key){if(key==='count'||!Array.isArray(g.cars)||!g.cars.length)return g[key];const values=[...new Set(g.cars.map(c=>c[key]))];return values.length===1?values[0]:values;}
function changesBetween(before,after){const out=[];after.groups.forEach((g,i)=>{const b=before.groups[i];for(const key of ['count','capacity','speed']){const from=shown(b,key),to=shown(g,key);if(String(from)!==String(to))out.push({group:i,label:g.label||b.label||`Grupo ${i+1}`,key,from,to});}const bf=Number.isFinite(b.cabinOccupancy)?b.cabinOccupancy:80,af=Number.isFinite(g.cabinOccupancy)?g.cabinOccupancy:80;if(bf!==af)out.push({group:i,label:g.label||`Grupo ${i+1}`,key:'cabinOccupancy',from:bf,to:af});});return out;}
const showValue=(v,key)=>(Array.isArray(v)?v:[v]).map(x=>key==='speed'?fmt(x):fmt(x,0)).join(' / ');
export const changeText=c=>`${c.label}: ${LABEL[c.key]} ${showValue(c.from,c.key)} → ${showValue(c.to,c.key)}`;

export function studySuggestions(study,result){
 if(!studyFails(result))return [];
 const base=copy(study),out=[],seen=new Set();
 const add=(id,title,e,note=null)=>{if(!e?.pass)return;const changes=changesBetween(base,e.study);if(!changes.length)return;const signature=JSON.stringify(changes.map(c=>[c.group,c.key,c.to]));if(seen.has(signature))return;seen.add(signature);const keys=[...new Set(changes.map(c=>c.key))];out.push({id,title,note,changes,capacity:e.capacity,interval:e.interval,required:e.required,limit:e.limit,manual:[...keys.flatMap(k=>MANUAL[k]),...MANUAL.always],study:e.study});};
 const reps=new Map(),notes=[];base.groups.forEach((g,i)=>{const p=productSimilarity(g);if(!p)return;reps.set(i,true);const others=p.products.slice(1).map(x=>`elevador${x.units.length>1?'es':''} ${x.units.join(', ')}: ${x.description}`);notes.push(`${g.label||'Grupo '+(i+1)}: novas unidades iguais ao produto mais presente no grupo — elevador${p.products[0].units.length>1?'es':''} ${p.products[0].units.join(', ')} (${p.products[0].description})`+(others.length?`. Outros produtos no grupo: ${others.join('; ')}`:''));});
 const note=notes.length?notes.join('. ')+'. A cópia repete lotação, velocidade, porta, tempos e pavimentos atendidos da unidade.':null;
 const note2=notes.length?'Com cadastro por unidade, as novas unidades copiam o produto mais presente no grupo, já com a mudança desta alternativa.':null;
 add('elevadores',reps.size?'Aumentar a quantidade de elevadores · produto semelhante aos existentes':'Aumentar a quantidade de elevadores',addCarsUntilPass(base,reps),note);
 add('lotacao','Aumentar a lotação das cabinas',stepUntilPass(base,raiseCapacity));
 add('velocidade','Aumentar a velocidade nominal',stepUntilPass(base,raiseSpeed));
 const biggerCabin=raiseCapacity(base,1);if(biggerCabin)add('lotacao-elevadores','Lotação maior e mais elevadores',addCarsUntilPass(biggerCabin,reps),note2);
 const faster=raiseSpeed(base,1);if(faster)add('velocidade-elevadores','Velocidade maior e mais elevadores',addCarsUntilPass(faster,reps),note2);
 if(base.trafficModel==='iso8100'&&base.groups.some(g=>(Number.isFinite(g.cabinOccupancy)?g.cabinOccupancy:80)<100||g.cars?.some(c=>(Number.isFinite(c.cabinOccupancy)?c.cabinOccupancy:80)<100)))add('ocupacao','Adotar fator de ocupação de 100%',evaluate(setAll(base,'cabinOccupancy',()=>100)));
 return out;
}
