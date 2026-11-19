// V0038 · recomendações de performance: tabela de referência (TME e TMD, pico de subida e pico de subida e descida)
// e classificação do estudo. TME = tempo médio de espera; TMD = tempo médio até o destino.
// Limites em segundos: [recomendado até, neutro até]. Acima do segundo valor é "Não recomendado".
import {isIso} from './iso-data.js';
import {contextHelpButton} from './context-help.js';
import {performanceMeasures} from './traffic-performance.js';

export const ISO_PERFORMANCE_USES = {offices: 'Edifício de escritórios', residential: 'Residencial', hotel: 'Hotel', hospital: 'Hospital'};

export const ISO_PERFORMANCE_REFERENCE = {
  up: {
    label: 'Picos de subida',
    TME: {title: 'TME · Tempo médio de espera', limits: {offices: [20, 26], residential: null, hotel: [33, 40], hospital: [30, 40]}},
    TMD: {title: 'TMD · Tempo médio até o destino', limits: {offices: [90, 100], residential: null, hotel: [100, 105], hospital: [100, 110]}},
  },
  updown: {
    label: 'Picos de subida e descida',
    TME: {title: 'TME · Tempo médio de espera', limits: {offices: [26, 36], residential: null, hotel: [33, 40], hospital: [30, 40]}},
    TMD: {title: 'TMD · Tempo médio até o destino', limits: {offices: [105, 110], residential: null, hotel: [100, 110], hospital: [100, 110]}},
  },
};

const fmt = (v, d = 0) => Number.isFinite(v) ? new Intl.NumberFormat('pt-BR', {minimumFractionDigits: 0, maximumFractionDigits: Math.min(d,3)}).format(v) : '—';
const esc = x => String(x ?? '').replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));

// Classificação de um valor medido frente aos limites de um uso. Retorna null quando não se aplica.
export function classifyPerformance(value, limits) {
  if (!limits || !Number.isFinite(value)) return null;
  const [rec, neutral] = limits;
  if (value <= rec) return {label: 'Recomendado', cls: 'iso-rec'};
  if (value <= neutral) return {label: 'Neutro', cls: 'iso-neutral'};
  return {label: 'Não recomendado', cls: 'iso-not'};
}

const cellText = (lim, kind) => {
  if (!lim) return 'Não usado';
  const [rec, neutral] = lim;
  if (kind === 'rec') return `Menor igual a ${rec} s`;
  if (kind === 'neutral') return `Entre ${rec} e ${neutral} s`;
  return `Maior que ${neutral} s`;
};

// Tabela de referência reproduzida do documento de recomendações.
export function isoPerformanceReferenceHtml() {
  const body = [];
  for (const peak of Object.values(ISO_PERFORMANCE_REFERENCE)) {
    body.push(`<tr class="iso-peak"><th colspan="4">${esc(peak.label)}</th></tr>`);
    for (const metricKey of ['TME', 'TMD']) {
      const metric = peak[metricKey];
      body.push(`<tr class="iso-metric"><th colspan="4">${esc(metric.title)}</th></tr>`);
      for (const [use, label] of Object.entries(ISO_PERFORMANCE_USES)) {
        const lim = metric.limits[use];
        body.push(`<tr><th scope="row">${esc(label)}</th><td class="iso-rec">${cellText(lim, 'rec')}</td><td class="iso-neutral">${cellText(lim, 'neutral')}</td><td class="iso-not">${cellText(lim, 'not')}</td></tr>`);
      }
    }
  }
  return `<div class="table-wrap"><table class="iso-reference"><caption>Recomendações de performance</caption><thead><tr><th>Uso</th><th class="iso-rec">Recomendado</th><th class="iso-neutral">Neutro</th><th class="iso-not">Não recomendado</th></tr></thead><tbody>${body.join('')}</tbody></table></div>`;
}

// Valores medidos do estudo: ISO usa a simulação da edição 2020 (nível de demanda x1); NBR usa o simulador de eventos.
export function studyMeasures(s, r) {
  if (isIso(s)) {
    const x1 = r?.iso2020?.simulation?.results?.[0] ?? null;
    return {up: {tme: x1?.averageWait ?? null, tmd: x1?.averageTimeToDestination ?? null}, updown: null, note: x1 ? null : 'A espera e o tempo até o destino vêm da simulação da edição ISO 8100-32:2020. Calcule o estudo nessa edição para classificar.'};
  }
  const m = performanceMeasures(s, r);
  if (m.error) return {up: null, updown: null, note: m.error};
  return {up: {tme: m.up.tme, tmd: m.up.tmd}, updown: {tme: m.updown.tme, tmd: m.updown.tmd}, note: null};
}

// Resultado do estudo classificado por uso e pico.
export function studyPerformance(s, r) {
  const use = s?.use;
  const label = ISO_PERFORMANCE_USES[use];
  const measures = studyMeasures(s, r);
  const rows = [];
  if (!label) return {use: null, rows, note: 'O uso deste estudo não consta na tabela de recomendações.'};
  const up = ISO_PERFORMANCE_REFERENCE.up, ud = ISO_PERFORMANCE_REFERENCE.updown;
  const mu = measures.up, md = measures.updown;
  rows.push({peak: up.label, metric: 'TME', measured: mu?.tme ?? null, cls: classifyPerformance(mu?.tme, up.TME.limits[use]), limits: up.TME.limits[use]});
  rows.push({peak: up.label, metric: 'TMD', measured: mu?.tmd ?? null, cls: classifyPerformance(mu?.tmd, up.TMD.limits[use]), limits: up.TMD.limits[use]});
  rows.push({peak: ud.label, metric: 'TME', measured: md?.tme ?? null, cls: classifyPerformance(md?.tme, ud.TME.limits[use]), limits: ud.TME.limits[use], pending: !md});
  rows.push({peak: ud.label, metric: 'TMD', measured: md?.tmd ?? null, cls: classifyPerformance(md?.tmd, ud.TMD.limits[use]), limits: ud.TMD.limits[use], pending: !md});
  return {use: label, rows, note: measures.note};
}

// Seção de recomendações: tabela de referência e classificação do estudo (ISO e NBR).
export function recommendationsSection(s, r) {
  if (!r) return '';
  const p = studyPerformance(s, r);
  const fmtVal = v => Number.isFinite(v) ? fmt(v, 1) + ' s' : '—';
  const resultRows = p.rows.map(x => {
    const limitTxt = x.limits ? `≤ ${x.limits[0]} s / ≤ ${x.limits[1]} s` : 'Não usado';
    const status = x.pending
      ? '<span class="small-copy">Não calculado</span>'
      : x.cls ? `<span class="iso-tag ${x.cls.cls}">${esc(x.cls.label)}</span>` : '<span class="small-copy">—</span>';
    return `<tr><th scope="row">${esc(x.peak)}</th><td>${esc(x.metric)}</td><td>${x.pending ? '—' : fmtVal(x.measured)}</td><td>${esc(limitTxt)}</td><td>${status}</td></tr>`;
  }).join('');
  return `<section class="card card-body iso-recommendations" id="iso-recommendations"><div class="context-heading"><h2>Recomendações de performance</h2>${contextHelpButton('recomendacoesPerformance')}</div>
<p class="small-copy">Referência por tipo de edifício. Uso deste estudo: <strong>${esc(p.use || 'não previsto')}</strong>.</p>
${p.note ? `<p class="population-warning">${esc(p.note)}</p>` : ''}
<div class="table-wrap"><table class="iso-results"><thead><tr><th>Pico</th><th>Métrica</th><th>Resultado do estudo</th><th>Limites (recomendado / neutro)</th><th>Classificação</th></tr></thead><tbody>${resultRows}</tbody></table></div>
<details><summary>Tabela de referência completa</summary>${isoPerformanceReferenceHtml()}</details>
</section>`;
}
