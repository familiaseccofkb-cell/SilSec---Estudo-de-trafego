
import {f,esc} from '../motor/traffic-performance.js';
export * from '../motor/traffic-performance.js';
export function performanceTableHtml(summary,{label='Convencional'}={}){
 if(summary.error)return `<p class="population-warning">${esc(summary.error)}</p>`;
 const w=summary.waiting,t=summary.travel;
 const left=[
  ['Tempo médio de espera no pavimento principal (s)',f(w.avg)],
  ['Tempo mínimo de espera (s)',f(w.min)],
  ['Tempo máximo de espera (s)',f(w.max)],
  ...w.below.map(b=>[`Atendidos em menos de ${b.limit} s (%)`,f(b.pct)]),
 ];
 const right=[
  ['Tempo médio até o andar de destino (s)',f(t.avg)],
  ['Tempo mínimo até o destino (s)',f(t.min)],
  ['Tempo máximo até o destino (s)',f(t.max)],
  ...t.below.map(b=>[`Chegada em menos de ${b.limit} s (%)`,f(b.pct)]),
 ];
 const body=left.map((r,i)=>`<tr><th scope="row">${esc(r[0])}</th><td>${esc(r[1])}</td><th scope="row">${esc(right[i][0])}</th><td>${esc(right[i][1])}</td></tr>`).join('');
 return `<div class="table-wrap performance-table"><table class="group-results"><caption>Desempenho de tráfego · ${esc(label)} · ${f(summary.passengers,0)} passageiros em 60 min</caption><thead><tr><th>Espera no pavimento principal</th><th>${esc(label)}</th><th>Chegada ao andar de destino</th><th>${esc(label)}</th></tr></thead><tbody>${body}</tbody></table></div><p class="small-copy">Simulação de eventos (pico de subida a partir do pavimento principal, 60 min). Passageiros ainda na fila ou a bordo no fim do período entram com o tempo decorrido até então. Pessoas sem embarque até o fim do período: ${esc(String(summary.sim?.unservedAtEnd?.total??'—'))} (subida ${esc(String(summary.sim?.unservedAtEnd?.up??'—'))}, descida ${esc(String(summary.sim?.unservedAtEnd?.down??'—'))}). O limite do fabricante, quando informado, restringe as partidas do acesso.</p>`;
}
