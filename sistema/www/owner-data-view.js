// Simulador, etapa 1 (23/11/2026) · tela "Dados do proprietário" (aba de propostas).
// Cliente convidado: preenche e envia para revisão. Responsável pelo estudo: vê os envios, aplica ao estudo ou recusa.
import {escapeHtml as e} from './report.js';
import {OWNER_TEXTS, OWNER_FLOOR_COLUMNS, OWNER_COUNT_COLUMNS, OWNER_STATUS, validateOwnerData} from './owner-data.js';
import {FLOW_KEYS} from './performance.js';

const btn = (action, label, extra = '') => `<button class="btn" type="button" data-action="${action}" ${extra}>${label}</button>`;
const val = v => v === null || v === undefined ? '' : e(String(v));
const input = (path, v, type = 'text', attrs = '') => `<input data-owner-path="${path}" type="${type}" value="${val(v)}" ${type === 'number' ? 'min="0" step="any" inputmode="decimal"' : ''} ${attrs}>`;
const field = (label, path, v, type = 'text', attrs = '') => `<div class="field"><label>${e(label)}${input(path, v, type, attrs)}</label></div>`;

function summary(d) {
  const rows = (d.measurement?.rows || []).filter(r => FLOW_KEYS.some(k => Number.isInteger(r?.[k])));
  const floors = (d.floors || []).filter(r => r.people > 0 || r.area > 0);
  return `${rows.length} bloco(s) de 5 min contados · ${floors.length} andar(es) com ocupação${d.measurement?.date ? ' · contagem de ' + e(d.measurement.date) : ''}`;
}

function clientForm(d) {
  const m = d.measurement || {}, s = d.schedule || {};
  const floors = (d.floors || []).map((r, i) => `<tr><td>${i + 1}</td>${OWNER_FLOOR_COLUMNS.map(([k, , t]) => `<td>${input(`floors.${i}.${k}`, r[k], t)}</td>`).join('')}</tr>`).join('');
  const counts = (m.rows || []).map((r, i) => `<tr><td>${i + 1}</td>${OWNER_COUNT_COLUMNS.map(([k]) => `<td>${input(`measurement.rows.${i}.${k}`, r[k], 'number', 'step="1"')}</td>`).join('')}</tr>`).join('');
  const waits = (d.waits || []).map((w, i) => `<tr><td>${input(`waits.${i}.time`, w.time, 'text', 'placeholder="hh:mm"')}</td><td>${input(`waits.${i}.floor`, w.floor)}</td><td>${input(`waits.${i}.seconds`, w.seconds, 'number')}</td><td>${input(`waits.${i}.notes`, w.notes)}</td></tr>`).join('');
  const errors = validateOwnerData(d);
  return `<p class="small-copy">Preencha o que tiver. As contagens são feitas no hall dos elevadores do térreo, a cada 5 minutos, num dia típico. Ao enviar, os dados ficam aguardando a revisão do responsável pelo estudo.</p>
<div class="form-grid">${OWNER_TEXTS.map(([k, l]) => field(l, k, d[k])).join('')}</div>
<h4>Horários</h4><div class="form-grid">${field('Início do expediente (hh:mm)', 'schedule.start', s.start)}${field('Fim do expediente (hh:mm)', 'schedule.end', s.end)}${field('Início do almoço (hh:mm)', 'schedule.lunchStart', s.lunchStart)}${field('Fim do almoço (hh:mm)', 'schedule.lunchEnd', s.lunchEnd)}</div>
<h4>Ocupação por andar</h4><div class="table-wrap"><table class="mini"><thead><tr><th>Parada</th>${OWNER_FLOOR_COLUMNS.map(([, l]) => `<th>${e(l)}</th>`).join('')}</tr></thead><tbody>${floors}</tbody></table></div>${btn('owner-add-floors', 'Mais 10 andares')}
<h4>Contagem a cada 5 minutos (hall do térreo)</h4><div class="form-grid">${field('Data da contagem', 'measurement.date', m.date, 'date')}${field('Quem contou', 'measurement.observer', m.observer)}${field('Hall contado', 'measurement.hall', m.hall)}${field('Início da contagem da entrada (hh:mm)', 'measurement.entryStart', m.entryStart)}${field('Início da contagem do almoço (hh:mm)', 'measurement.lunchStart', m.lunchStart)}${field('Início da contagem da saída (hh:mm)', 'measurement.exitStart', m.exitStart)}</div>
<p class="small-copy">Cada linha é um bloco de 5 minutos a partir do início informado. Vazio = não contado (não é zero).</p>
<div class="table-wrap"><table class="mini"><thead><tr><th>Bloco</th>${OWNER_COUNT_COLUMNS.map(([, l]) => `<th>${e(l)}</th>`).join('')}</tr></thead><tbody>${counts}</tbody></table></div>${btn('owner-add-rows', 'Mais 12 blocos (1 hora)')}
<h4>Espera observada (opcional)</h4><div class="table-wrap"><table class="mini"><thead><tr><th>Horário</th><th>Andar</th><th>Espera (s)</th><th>Observação</th></tr></thead><tbody>${waits}</tbody></table></div>
${field('Observações', 'notes', d.notes)}
${errors.length ? `<p class="notice error">${e(errors.join(' '))}</p>` : ''}
<div class="row-actions">${btn('save-owner-data', 'Salvar e enviar para revisão', errors.length ? 'disabled' : '')}</div>`;
}

function reviewList(subs) {
  if (!subs.length) return '<p class="small-copy">Nenhum envio ainda. Convide o cliente (tipo "Cliente") para que ele preencha estes dados.</p>';
  return `<div class="table-wrap"><table class="mini"><thead><tr><th>Enviado por</th><th>Situação</th><th>Conteúdo</th><th></th></tr></thead><tbody>${subs.map(s => `<tr><td>${e(s.company || '')}<br><small>${e(s.email || '')} · ${e((s.updatedAt || '').slice(0, 16).replace('T', ' '))}</small></td><td>${e(OWNER_STATUS[s.status] || s.status)}</td><td>${summary(s.data)}</td><td>${s.status === 'pendente' ? btn('apply-owner-data', 'Aplicar ao estudo', `data-id="${e(s.id)}"`) + btn('reject-owner-data', 'Recusar', `data-id="${e(s.id)}"`) : ''}</td></tr>`).join('')}</tbody></table></div>
<p class="small-copy">Aplicar leva ao estudo os horários e as contagens a cada 5 minutos (perfil medido). A ocupação por andar fica como referência: confira e lance na população.</p>`;
}

export function ownerDataSection(p) {
  const o = p.ownerData;
  if (!o) return '';
  const body = o.canSubmit && p.ownerDraft ? clientForm(p.ownerDraft) : reviewList(o.submissions || []);
  const mine = o.canSubmit ? (o.submissions || [])[0] : null;
  return `<section class="panel" id="owner-data"><div class="section-heading"><h2>Dados do proprietário</h2>${mine ? `<span class="pill">${e(OWNER_STATUS[mine.status] || mine.status)}</span>` : ''}</div>${body}</section>`;
}
