// Performance informada pelo fabricante (chamada convencional × ADS) e comparação com o cálculo do sistema SilSec.
// O fabricante preenche a tabela na própria proposta. A comparação com o cálculo aparece só para o responsável e o contratante.
import {BRAND} from './brand.js';
import {PERFORMANCE_ROWS,PERFORMANCE_SYSTEMS,ensurePerformance} from './procurement.js';
import {adsComparison,adsComparisonValues} from './ads-comparison.js';
import {contextHelpButton} from './context-help.js';
import {displayValue} from './display-number.js';
import {DOOR_TYPE_NAMES,doorWidthsFor,doorTimesFor} from './door-time-reference.js';

const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const f=(v,d=2)=>Number.isFinite(v)?new Intl.NumberFormat('pt-BR',{minimumFractionDigits:d,maximumFractionDigits:d}).format(v):'—';
const signed=(v,d=1)=>(v>0?'+':'')+f(v,d);
// Limites de divergência: até 5 = sem destaque; acima de 5 até 10 = atenção; acima de 10 = divergência.
export const DIVERGENCE_LIMITS={attention:5,divergent:10};

// Tabela de preenchimento do fabricante, dentro da proposta.
// Porta por grupo: tipo e vão adotados pelo fabricante e pelo sistema; abertura e fechamento vêm da tabela do fabricante.
export function doorReferenceHtml(offer,study,{locked=false}={}){
 const groups=Array.isArray(offer?.groups)?offer.groups:[];if(!groups.length)return '';
 const dis=locked?'disabled':'';
 const fmtTime=v=>Number.isFinite(v)?f(v,2)+' s':'—';
 const sysTimes=g=>{const t=doorTimesFor(g.door,g.width);return t?`${f(t.open,2)} / ${f(t.close,2)} s`:'vão fora da tabela';};
 const rows=groups.map((g,i)=>{
  const sys=study?.groups?.[i]||g,d=g.product?.dimensions||{},type=d.doorType||'',width=Number.isFinite(Number(d.doorWidth))&&d.doorWidth!==null&&d.doorWidth!==''?Number(d.doorWidth):null;
  const widths=type?doorWidthsFor(type):[...new Set([...doorWidthsFor('central'),...doorWidthsFor('lateral')])].sort((a,b)=>a-b);
  const typeOpts=[['','Selecionar'],['central','Central'],['lateral','Lateral']].map(([v,l])=>`<option value="${v}" ${type===v?'selected':''}>${l}</option>`).join('');
  const widthOpts=`<option value="">Selecionar</option>`+widths.map(w=>`<option value="${w}" ${width===w?'selected':''}>${w}</option>`).join('');
  return `<tr><th scope="row">${esc(sys.label||'Grupo '+(i+1))}</th><td>${esc(DOOR_TYPE_NAMES[sys.door]||sys.door||'—')} · ${Number.isFinite(sys.width)?esc(sys.width)+' mm':'—'}<small> · ${esc(sysTimes(sys))}</small></td>`+
   `<td><select aria-label="Tipo de porta do fabricante · ${esc(sys.label||'Grupo '+(i+1))}" data-offer-path="groups.${i}.product.dimensions.doorType" ${dis}>${typeOpts}</select></td>`+
   `<td><select aria-label="Vão adotado pelo fabricante (mm) · ${esc(sys.label||'Grupo '+(i+1))}" data-offer-path="groups.${i}.product.dimensions.doorWidth" ${dis}>${widthOpts}</select></td>`+
   `<td><output id="offer-door-times-${i}">${fmtTime(g.open)} / ${fmtTime(g.close)}</output></td></tr>`;
 }).join('');
 return `<div class="door-reference" id="offer-door-reference"><h3>Porta: tipo e vão adotados</h3><p class="small-copy">Informe o tipo de porta (central ou lateral) e o vão adotado. Em vão tabelado pelo fabricante, o sistema pré-define a abertura e o fechamento do grupo; altere-os na proposta se o fabricante informar outros valores. Coluna do sistema: valores do estudo.</p><div class="table-wrap"><table class="group-results manufacturer-door-table"><thead><tr><th scope="col">Grupo</th><th scope="col">Sistema (estudo): tipo · vão · abertura / fechamento</th><th scope="col">Fabricante · tipo</th><th scope="col">Fabricante · vão (mm)</th><th scope="col">Fabricante · abertura / fechamento</th></tr></thead><tbody>${rows}</tbody></table></div></div>`;
}

export function performanceForm(offer,{locked=false,study=null}={}){
 const p=ensurePerformance(offer);
 const input=(sys,r)=>`<td><input aria-label="${esc(PERFORMANCE_SYSTEMS[sys]+' · '+r.label)}" id="offer-performance-${sys}-${r.key}" data-offer-path="performance.${sys}.${r.key}" type="number" step="any" min="0" max="${r.max}" value="${esc(displayValue(p[sys][r.key])??'')}"></td>`;
 const rows=PERFORMANCE_ROWS.map(r=>r.band?`<tr class="ads-band"><th colspan="3" scope="colgroup">${esc(r.band)}</th></tr>`:`<tr><th scope="row">${esc(r.label)}</th>${input('conventional',r)}${input('ads',r)}</tr>`).join('');
 return `<details class="technical-details manufacturer-performance" open><summary>Comparativo · chamada convencional × ADS-Antecipador de Destino · performance calculada pelo fabricante</summary><fieldset class="manufacturer-block" ${locked?'disabled':''}><legend>Performance calculada pelo fabricante ${contextHelpButton('performanceFabricante')}</legend><p class="small-copy">Informe os valores calculados pela sua empresa para este projeto, nos dois modos de chamada. Deixe em branco o que não foi calculado. Esta tabela fica visível somente para a sua empresa e para o contratante.</p><div class="table-wrap"><table class="group-results ads-comparison-table manufacturer-performance-table"><thead><tr><th scope="col">Item</th><th scope="col">Convencional</th><th scope="col">ADS-Antecipador de Destino</th></tr></thead><tbody>${rows}</tbody></table></div></fieldset></details>`;
}

// Diferença entre o valor do fabricante e o calculado. Linhas em % comparam em pontos percentuais; as demais, em % do valor calculado.
export function divergence(row,maker,calc){
 if(!Number.isFinite(maker))return {state:'missing'};
 if(!Number.isFinite(calc))return {state:'nocalc'};
 const diff=maker-calc,measure=row.kind==='pct'?diff:calc!==0?100*diff/calc:(diff===0?0:Infinity),size=Math.abs(measure);
 return {state:size>DIVERGENCE_LIMITS.divergent?'divergent':size>DIVERGENCE_LIMITS.attention?'attention':'ok',diff,measure,unit:row.kind==='pct'?'p.p.':'%'};
}

const calcCache=new WeakMap();
function calculated(o,base,baseResult){
 const key=o.results||baseResult;if(!key)return null;
 if(!calcCache.has(key)){let v=null;try{v=adsComparisonValues(o.results?adsComparison(o.study,o.results):adsComparison(base,baseResult));}catch{v=null;}calcCache.set(key,v);}
 return calcCache.get(key);
}

// Tabela do contratante: fabricante × cálculo do sistema, uma por fornecedor.
export function performanceComparison(o,base,baseResult){
 const maker=o.data?.performance,calc=calculated(o,base,baseResult);
 const title=`Fabricante × cálculo do sistema ${BRAND.short} · chamada convencional × ADS-Antecipador de Destino · ${esc(o.company)}`;
 const filled=maker&&Object.keys(PERFORMANCE_SYSTEMS).some(s=>PERFORMANCE_ROWS.some(r=>r.key&&Number.isFinite(maker[s]?.[r.key])));
 if(!filled)return `<section class="card card-body below manufacturer-comparison"><h3>${title}${contextHelpButton('comparativoFabricante')}</h3><p class="population-warning">O fabricante ainda não informou a performance calculada por ele.</p></section>`;
 if(!calc)return `<section class="card card-body below manufacturer-comparison"><h3>${title}${contextHelpButton('comparativoFabricante')}</h3><p class="population-warning">Não foi possível calcular a performance do sistema para esta proposta. Confira as pendências da proposta e do estudo-base.</p></section>`;
 let attention=0,divergent=0,missing=0;
 const cells=(sys,r)=>{const m=maker[sys]?.[r.key],c=calc[sys]?.[r.key],d=divergence(r,m,c);
  if(d.state==='attention')attention++;if(d.state==='divergent')divergent++;if(d.state==='missing')missing++;
  const cls=d.state==='divergent'?'perf-divergent':d.state==='attention'?'perf-attention':d.state==='missing'?'perf-missing':'';
  const note=d.state==='divergent'?'<small> · divergência</small>':d.state==='attention'?'<small> · atenção</small>':'';
  const diff=d.state==='missing'||d.state==='nocalc'?'—':`${signed(d.measure)} ${d.unit}`;
  return `<td class="${cls}">${d.state==='missing'?'Não informado':f(m)}</td><td>${f(c)}</td><td class="${cls}">${diff}${note}</td>`;};
 const rows=PERFORMANCE_ROWS.map(r=>r.band?`<tr class="ads-band"><th colspan="7" scope="colgroup">${esc(r.band)}</th></tr>`:`<tr><th scope="row">${esc(r.label)}</th>${cells('conventional',r)}${cells('ads',r)}</tr>`).join('');
 const summary=divergent||attention||missing?`${divergent} divergência(s), ${attention} ponto(s) de atenção e ${missing} valor(es) não informado(s).`:'Sem divergência acima dos limites.';
 return `<section class="card card-body below manufacturer-comparison"><h3>${title}${contextHelpButton('comparativoFabricante')}</h3><p class="${divergent?'population-warning':'small-copy'}" role="status">${summary}</p><div class="table-wrap"><table class="group-results ads-comparison-table manufacturer-comparison-table"><thead><tr><th scope="col" rowspan="2">Item</th><th scope="colgroup" colspan="3">Convencional</th><th scope="colgroup" colspan="3">ADS-Antecipador de Destino</th></tr><tr><th scope="col">Fabricante</th><th scope="col">Sistema ${BRAND.short}</th><th scope="col">Diferença</th><th scope="col">Fabricante</th><th scope="col">Sistema ${BRAND.short}</th><th scope="col">Diferença</th></tr></thead><tbody>${rows}</tbody></table></div><p class="small-copy"><span class="perf-legend perf-attention">Atenção</span> diferença acima de ${DIVERGENCE_LIMITS.attention} até ${DIVERGENCE_LIMITS.divergent}. <span class="perf-legend perf-divergent">Divergência</span> diferença acima de ${DIVERGENCE_LIMITS.divergent}. <span class="perf-legend perf-missing">Não informado</span> valor não preenchido pelo fabricante. Nas linhas em %, a diferença é em pontos percentuais (p.p.); nas demais, em % sobre o valor do sistema. Sistema ${BRAND.short} = ${o.results?'cálculo com os dados de equipamento desta proposta':'cálculo do estudo-base, porque a proposta ainda não tem dados suficientes para um cálculo próprio'}, na mesma base da tabela "Comparativo de cálculo do sistema ${BRAND.short}". Apoio à análise: não substitui a simulação do fabricante nem aprova a contratação.</p></section>`;
}

export function performanceComparisons(procurement,base,baseResult){return (procurement?.offers||[]).map(o=>performanceComparison(o,base,baseResult)).join('');}
