import {fleetCars} from './fleet.js';
import {accessibilityHtml} from './accessibility.js';
export const CABIN_AREA_REFERENCE='Tabela e fórmulas de área interna fornecidas pelo usuário · revisão 17/10/2026';
const BASE_ROWS=[[4,.79,.9],[5,.98,1.1],[6,1.17,1.3],[7,1.31,1.45],[8,1.45,1.6],[9,1.59,1.75],[10,1.73,1.9],[11,1.87,2.05],[12,2.01,2.2],[13,2.15,2.4],[14,2.29,2.5],[15,2.43,2.65],[16,2.57,2.8],[17,2.71,2.95],[18,2.85,3.1],[19,2.99,3.25],[20,3.13,3.4]];
// Keep the supplied arithmetic at full precision; round only for display.
const MAX_21_TO_33=[(3.56-3.4)/100*75+3.4,...[50,125,200,275,350].map(load=>(4.2-3.56)/400*load+3.56),...[25,100,175,250,325,400,475].map(load=>(5-4.2)/500*load+4.2)];
export const CABIN_AREA_ROWS=[...BASE_ROWS,...MAX_21_TO_33.map((max,i)=>[21+i,(21+i-20)*.115+3.13,max])];
export function cabinAreaLimits(capacity){
 if(!Number.isInteger(capacity)||capacity<4)return null;
 if(capacity>=21)return {min:(capacity-20)*.115+3.13,max:capacity>33?(capacity*75-2500)/100*.16+5:MAX_21_TO_33[capacity-21]};
 const row=BASE_ROWS.find(r=>r[0]===capacity);
 return row?{min:row[1],max:row[2]}:null;
}
export function cabinAreaCheck(capacity,widthMm,depthMm){
 const limits=cabinAreaLimits(capacity),ranges=limits?[limits]:[];
 const area=Number.isFinite(widthMm)&&widthMm>0&&Number.isFinite(depthMm)&&depthMm>0?widthMm/1000*(depthMm/1000):null;
 const status=area===null?'missing':!limits?'unlisted':area<limits.min-1e-10?'below':area>limits.max+1e-10?'above':'within';
 return {capacity,widthMm,depthMm,area,ranges,status,red:status==='below'||status==='above',reference:CABIN_AREA_REFERENCE};
}
export function groupCabinChecks(study,g){return fleetCars(study,g).map((c,i)=>({...cabinAreaCheck(c.capacity,g.siteDimensions?.cabinWidth,g.siteDimensions?.cabinDepth),unit:g.carNumbers?.[i]||i+1}));}
export function cabinAreaHtml(study,g,{esc,f}){
 const labels={missing:'Dimensões pendentes',unlisted:'Capacidade inválida',below:'Abaixo do mínimo',above:'Acima do máximo',within:'Dentro da faixa'};
 return `<section class="cabin-area-section"><h4>Conferência da área interna da cabina existente</h4><div class="table-wrap"><table class="cabin-area-table"><thead><tr><th scope="col">Elevador</th><th scope="col">Capacidade (pessoas)</th><th scope="col">Área calculada (m²)</th><th scope="col">Área mínima (m²)</th><th scope="col">Área máxima (m²)</th><th scope="col">Condição</th></tr></thead><tbody>${groupCabinChecks(study,g).map(c=>`<tr class="${c.red?'cabin-area-invalid':['missing','unlisted'].includes(c.status)?'cabin-area-pending':''}"><th scope="row">${c.unit}</th><td>${f(c.capacity,0)}</td><td>${f(c.area,4)}</td><td>${f(c.ranges[0]?.min,4)}</td><td>${f(c.ranges[0]?.max,4)}</td><td><span class="cabin-area-status">${esc(labels[c.status])}</span></td></tr>`).join('')}</tbody></table></div>${accessibilityHtml({cabinWidth:g.siteDimensions?.cabinWidth,cabinDepth:g.siteDimensions?.cabinDepth,doorWidth:g.siteDimensions?.doorWidth,building:['retrofit','existing'].includes(study.supplyCondition?.type)?'existing':'new',arrangement:g.product?.dimensions?.doorArrangement||''},esc)}</section>`;
}
