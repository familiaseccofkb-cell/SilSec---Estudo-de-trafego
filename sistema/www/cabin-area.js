
import {groupCabinChecks} from '../motor/cabin-area.js';
export * from '../motor/cabin-area.js';
export function cabinAreaHtml(study,g,{esc,f}){
 const labels={missing:'Dimensões pendentes',unlisted:'Capacidade inválida',below:'Abaixo do mínimo',above:'Acima do máximo',within:'Dentro da faixa'};
 return `<section class="cabin-area-section"><h4>Conferência da área interna da cabina existente</h4><div class="table-wrap"><table class="cabin-area-table"><thead><tr><th scope="col">Elevador</th><th scope="col">Capacidade (pessoas)</th><th scope="col">Área calculada (m²)</th><th scope="col">Área mínima (m²)</th><th scope="col">Área máxima (m²)</th><th scope="col">Condição</th></tr></thead><tbody>${groupCabinChecks(study,g).map(c=>`<tr class="${c.red?'cabin-area-invalid':['missing','unlisted'].includes(c.status)?'cabin-area-pending':''}"><th scope="row">${c.unit}</th><td>${f(c.capacity,0)}</td><td>${f(c.area,4)}</td><td>${f(c.ranges[0]?.min,4)}</td><td>${f(c.ranges[0]?.max,4)}</td><td><span class="cabin-area-status">${esc(labels[c.status])}</span></td></tr>`).join('')}</tbody></table></div></section>`;
}
