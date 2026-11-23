// Simulador, etapa 1 (23/11/2026) · "Dados do proprietário" enviados pelo cliente convidado (etapa 1 do simulador).
// O cliente preenche; o envio fica "pendente" até o responsável pelo estudo revisar. Só ao aplicar é que as contagens
// a cada 5 minutos e os horários entram no estudo (operation); a ocupação por andar fica como referência para a população.
import {FLOW_KEYS, normalizeOperation, validateOperation} from './performance.js';

export const OWNER_DATA_VERSION = 1;
export const OWNER_STATUS = {pendente: 'Aguardando revisão', aplicado: 'Aplicado ao estudo', recusado: 'Recusado'};
export const OWNER_TEXTS = [
  ['contact', 'Responsável (nome, cargo, telefone)'],
  ['use', 'Uso principal do prédio'],
  ['otherAccess', 'Outros acessos (garagem, outra rua) e % do movimento'],
  ['elevators', 'Elevadores existentes: quantidade, fabricante e ano'],
  ['maintenance', 'Empresa de manutenção'],
  ['complaints', 'Reclamações conhecidas (espera, lotação, horários)'],
  ['staggered', 'Horários escalonados por empresa ou andar'],
  ['concentrated', 'Chegada concentrada (fretado, ônibus, turno): horário e quantidade'],
  ['special', 'Situações especiais (elevador reservado, fora de serviço, eventos)'],
];
export const OWNER_FLOOR_COLUMNS = [['name', 'Andar (nome)', 'text'], ['use', 'Uso', 'text'], ['people', 'Pessoas', 'number'], ['area', 'Área (m²)', 'number'], ['height', 'Altura até a parada seguinte (m)', 'number'], ['notes', 'Observação', 'text']];
// Contagem no hall do térreo, a cada 5 minutos: as mesmas chaves das medições do estudo (FLOW_KEYS) + fila e entre andares.
export const OWNER_COUNT_COLUMNS = [['entry', 'Entrada: embarcam no térreo'], ['lunchOut', 'Almoço: desembarcam no térreo (saem)'], ['lunchIn', 'Almoço: embarcam no térreo (voltam)'], ['exit', 'Saída: desembarcam no térreo'], ['queue', 'Maior fila vista no hall (pessoas)'], ['interfloor', 'Almoço entre andares: embarques no andar do refeitório']];
export const OWNER_MIN_FLOORS = 40;
const MAX_ROWS = 288, MAX_FLOORS = 300, MAX_WAITS = 100;
const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;

const emptyFloor = i => ({stop: i + 1, name: '', use: '', people: null, area: null, height: null, notes: ''});
const emptyCount = () => ({entry: null, lunchOut: null, lunchIn: null, exit: null, queue: null, interfloor: null});
export function emptyOwnerData() {
  return {
    version: OWNER_DATA_VERSION,
    ...Object.fromEntries(OWNER_TEXTS.map(([k]) => [k, ''])),
    floors: Array.from({length: OWNER_MIN_FLOORS}, (_, i) => emptyFloor(i)),
    schedule: {start: '', end: '', lunchStart: '', lunchEnd: ''},
    measurement: {date: '', observer: '', hall: '', entryStart: '', lunchStart: '', exitStart: '', rows: Array.from({length: 18}, emptyCount)},
    waits: Array.from({length: 5}, () => ({time: '', floor: '', seconds: null, notes: ''})),
    notes: '',
  };
}

const str = (v, max) => typeof v === 'string' && v.length <= max;
const num = v => v === null || v === undefined || (Number.isFinite(v) && v >= 0 && v <= 1e6);
export function validateOwnerData(d) {
  const errors = [];
  if (!d || typeof d !== 'object' || Array.isArray(d)) return ['Dados do proprietário inválidos.'];
  if (d.version !== OWNER_DATA_VERSION) errors.push('Versão do formulário inválida.');
  for (const [k] of OWNER_TEXTS) if (!str(d[k] ?? '', 500)) errors.push('Texto longo demais: ' + k + '.');
  if (!str(d.notes ?? '', 2000)) errors.push('Observações longas demais.');
  if (!Array.isArray(d.floors) || d.floors.length > MAX_FLOORS) errors.push('Ocupação por andar: no máximo ' + MAX_FLOORS + ' linhas.');
  else for (const r of d.floors) if (!r || typeof r !== 'object' || !str(r.name ?? '', 80) || !str(r.use ?? '', 120) || !str(r.notes ?? '', 300) || !num(r.people) || !num(r.area) || !num(r.height) || (r.height !== null && r.height !== undefined && r.height > 50)) { errors.push('Ocupação por andar: valores inválidos.'); break; }
  const s = d.schedule || {};
  for (const k of ['start', 'end', 'lunchStart', 'lunchEnd']) if (s[k] && !HHMM.test(s[k])) errors.push('Horário inválido (use hh:mm).');
  const m = d.measurement || {};
  for (const k of ['entryStart', 'lunchStart', 'exitStart']) if (m[k] && !HHMM.test(m[k])) errors.push('Início da contagem inválido (use hh:mm).');
  if (m.date && !/^\d{4}-\d{2}-\d{2}$/.test(m.date)) errors.push('Data da contagem inválida.');
  for (const k of ['observer', 'hall']) if (!str(m[k] ?? '', 200)) errors.push('Identificação da contagem longa demais.');
  if (!Array.isArray(m.rows) || m.rows.length > MAX_ROWS) errors.push('Contagem: no máximo ' + MAX_ROWS + ' blocos de 5 minutos.');
  else for (const r of m.rows) if (!r || typeof r !== 'object' || OWNER_COUNT_COLUMNS.some(([k]) => !num(r[k]) || (r[k] !== null && r[k] !== undefined && !Number.isInteger(r[k])))) { errors.push('Contagem: use números inteiros de pessoas (vazio = não contado).'); break; }
  if (!Array.isArray(d.waits) || d.waits.length > MAX_WAITS) errors.push('Esperas observadas: no máximo ' + MAX_WAITS + ' linhas.');
  else for (const w of d.waits) if (!w || !str(w.time ?? '', 10) || !str(w.floor ?? '', 40) || !str(w.notes ?? '', 300) || !num(w.seconds)) { errors.push('Esperas observadas: valores inválidos.'); break; }
  return [...new Set(errors)];
}

// Blocos com pelo menos uma contagem preenchida, do primeiro ao último.
function countedRows(rows) {
  const filled = rows.map(r => FLOW_KEYS.some(k => Number.isInteger(r?.[k])));
  const first = filled.indexOf(true), last = filled.lastIndexOf(true);
  return first < 0 ? [] : rows.slice(first, last + 1);
}

// Aplica ao estudo (cópia) as contagens e os horários. Não mexe na população: a ocupação por andar é só referência.
export function applyOwnerData(study, d) {
  const errors = validateOwnerData(d);
  if (errors.length) throw new Error(errors.join(' '));
  const out = structuredClone(study), applied = [], warnings = [];
  const op = normalizeOperation(out.operation);
  const s = d.schedule || {};
  if (['start', 'end', 'lunchStart', 'lunchEnd'].every(k => HHMM.test(s[k] || ''))) {
    op.schedule = {...op.schedule, enabled: true, start: s.start, end: s.end, lunchStart: s.lunchStart, lunchEnd: s.lunchEnd};
    applied.push('Horários do expediente e do almoço');
  } else if (['start', 'end', 'lunchStart', 'lunchEnd'].some(k => s[k])) warnings.push('Horários incompletos: expediente e almoço não foram aplicados.');
  const m = d.measurement || {}, rows = countedRows(m.rows || []);
  if (rows.length) {
    const missing = rows.some(r => FLOW_KEYS.some(k => !Number.isInteger(r[k])));
    Object.assign(op, {
      profile: 'measured', profileVersion: 2, measurementBlocks: rows.length,
      measurements: rows.map(r => Object.fromEntries(FLOW_KEYS.map(k => [k, Number.isInteger(r[k]) ? r[k] : null]))),
      measurementDate: m.date || op.measurementDate || '', observer: m.observer || op.observer || '',
      measurementNotes: ['Dados do proprietário', m.hall ? 'hall: ' + m.hall : '', d.notes || ''].filter(Boolean).join(' · ').slice(0, 2000),
      ...(HHMM.test(m.entryStart || '') ? {entryStart: m.entryStart} : {}),
      ...(HHMM.test(m.lunchStart || '') ? {lunchStart: m.lunchStart} : {}),
      ...(HHMM.test(m.exitStart || '') ? {exitStart: m.exitStart} : {}),
    });
    applied.push(`Contagens a cada 5 minutos (${rows.length} bloco${rows.length > 1 ? "s" : ""})`);
    if (missing) warnings.push('Há blocos sem contagem em alguma coluna: complete na tela de medições antes de calcular (vazio não significa zero).');
  }
  if ((d.floors || []).some(r => r.people > 0 || r.area > 0)) warnings.push('Ocupação por andar recebida: confira e lance na população do estudo (não é aplicada automaticamente).');
  if (!applied.length) throw new Error('Nada a aplicar: o envio não tem horários completos nem contagens.');
  out.operation = op;
  const issues = validateOperation(op).filter(x => !/campo vazio|Preencha/.test(x));
  if (issues.length && !warnings.length) warnings.push(...issues);
  return {study: out, applied, warnings};
}
