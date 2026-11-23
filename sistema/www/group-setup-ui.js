import {displayValue} from './display-number.js';
// Janela "Configuração inicial dos grupos" (V0002): tabela de paradas, pavimentos, desnível, população e grupos.
import {GROUP_SETUP_REVISION,GROUP_STATE_LABELS,stateAt,groupStops,groupTravel,zones,validateGroupSetup,elevations,
  setStopCount,setMainStop,setStopMark,setUp,setTravel,setPopulationTotal,setPopulationAt,setGroupCount,setStates,travelOf,totalPopulation} from './group-setup.js';
import {groupSetupFromStudy,writeGroupSetup} from './group-setup-sync.js';
import {changeCar} from './fleet.js';
import {contextHelpButton} from './context-help.js';

// Seleção de células: chaves "grupoId|parada". Fica fora do estudo (só existe na tela).
const selection = new Set();
let drag = null;
export const groupSelectionSize = () => selection.size;
export function clearGroupSelection() { selection.clear(); }
export const groupSelectionHas = k => selection.has(k);

const keyOf = (g, i) => g + '|' + i;
const CLASS = {active: 'gs-active', inactive: 'gs-inactive', express: 'gs-express', main: 'gs-main'};

export function currentGroupSetup(study) {
  return study.groupSetup?.version === 1 && study.groupSetup.stops === study.floorTable?.rows?.length
    ? study.groupSetup
    : groupSetupFromStudy(study);
}

// HTML da janela. esc e f vêm do app.
export function groupSetupHtml(study, esc, f) {
  const setup = currentGroupSetup(study);
  const errors = validateGroupSetup(setup);
  const e = elevations(setup);
  const travel = travelOf(setup);
  const topIndex = setup.stops - 1;
  const rowsHtml = [];
  for (let i = topIndex; i >= 0; i--) {
    const main = i === setup.mainStop - 1;
    const upCell = i === topIndex
      ? '<td class="gs-locked" aria-label="Pavimento mais alto: última altura">Última Altura</td>'
      : `<td><input class="gs-num" type="number" min="0.01" max="100" step="0.01" value="${displayValue(setup.up[i])}" data-gs-up="${i}" aria-label="Desnível do pavimento ${esc(setup.marks[i])} até o próximo"></td>`;
    const markCell = main
      ? `<td class="gs-main-mark">0</td>`
      : `<td><input class="gs-mark" value="${esc(setup.marks[i])}" maxlength="2" data-gs-mark="${i}" aria-label="Marcação do pavimento na parada ${i + 1}"></td>`;
    const groupCells = setup.groups.map(g => {
      const st = setup.states[g.id]?.[i] ?? 'active', sel = selection.has(keyOf(g.id, i));
      const cls = [CLASS[st], sel ? 'gs-selected' : ''].filter(Boolean).join(' ');
      const label = GROUP_STATE_LABELS[st];
      return `<td class="${cls}" data-gs-cell="1" data-g="${esc(g.id)}" data-i="${i}" role="gridcell" aria-selected="${sel}" title="${esc(g.label)} · parada ${i + 1}: ${label}">${label}</td>`;
    }).join('');
    rowsHtml.push(`<tr class="${main ? 'gs-main-row' : ''}"><td class="gs-stop">${i + 1}</td>${markCell}${upCell}${groupCells}</tr>`);
  }
  const groupHead = setup.groups.map(g => `<th>${esc(g.label)}</th>`).join('');
  const items = [
    ['groups', 'Qtde de Grupos', setup.groups.length, 'number', 'min="1" max="20" step="1"'],
    ['stops', 'Numero de paradas totais', setup.stops, 'number', 'min="2" max="200" step="1"'],
    ['main', 'Pavimento Principal (parada)', setup.mainStop, 'number', `min="1" max="${setup.stops}" step="1"`],
    ['travel', 'Percurso total (m)', travel, 'number', 'min="0.01" step="0.01"'],
  ];
  const legend = ['active', 'inactive', 'express'].map(st => `<button type="button" class="btn small gs-legend ${CLASS[st]}" data-gs-apply="${st}" aria-label="Aplicar ${GROUP_STATE_LABELS[st]} às células selecionadas">${GROUP_STATE_LABELS[st]}</button>`).join('');
  const zoneRows = zones(setup).map((z, k) => `<tr><td>Zona ${k + 1}</td><td>${z.groups.map(id => esc(setup.groups.find(g => g.id === id)?.label || id)).join(', ')}</td><td>${z.stops.length}</td><td>${f(groupTravel(setup, z.groups[0]))} m</td></tr>`).join('');
  return `<section class="card card-body group-setup" id="group-setup" aria-labelledby="group-setup-title" data-gs-revision="${GROUP_SETUP_REVISION}">
<h2 id="group-setup-title">Configuração inicial dos grupos${contextHelpButton('configuracaoGrupos')} <small class="small-copy">· revisão ${GROUP_SETUP_REVISION}</small></h2>
<p class="small-copy">Edite os valores da coluna Valor. Os pavimentos são numerados de baixo para cima; o principal é 0 e fica travado. Selecione células (clique, Shift+clique ou arraste com o botão direito) e aplique um estado pela legenda.${contextHelpButton('gs.selecao')}</p>
<div class="gs-layout">
<div class="gs-items"><table><thead><tr><th>Item</th><th>Valor</th></tr></thead><tbody>${items.map(([k, label, v, type, attrs]) => `<tr><td>${label}${contextHelpButton('gs.' + k.replace('groups','groups'))}</td><td><input class="gs-num" type="${type}" ${attrs} value="${v}" data-gs-item="${k}" aria-label="${label}"></td></tr>`).join('')}</tbody></table>
<p class="small-copy">Percurso total = soma dos desníveis. Ao informar o percurso, os desníveis são iguais.</p></div>
<div class="gs-legend-row" role="group" aria-label="Estados de atendimento">${contextHelpButton('gs.estados')}${legend}<span class="small-copy">Seleção atual: ${selection.size} célula(s)</span><button type="button" class="btn small" data-gs-clear="1">Limpar seleção</button></div>
<div class="table-wrap"><table class="gs-table"><thead><tr><th>Paradas</th><th>Pavimentos</th><th>Desnível (m)</th>${groupHead}</tr></thead><tbody>${rowsHtml.join('')}</tbody></table></div>

</div>

${errors.length ? `<div class="population-warning" role="status"><strong>Pendências:</strong>${contextHelpButton('gs.pendencias')}<ul>${errors.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>` : '<p class="small-copy">Configuração consistente.</p>'}
<div class="table-wrap"><table><thead><tr><th>Zona${contextHelpButton('gs.zonas')}</th><th>Grupos</th><th>Paradas atendidas</th><th>Percurso do grupo</th></tr></thead><tbody>${zoneRows || '<tr><td colspan="4">Nenhuma zona.</td></tr>'}</tbody></table></div>
</section>`;
}

// Aplica uma alteração e grava no estudo. api: {commit(fn), toast(msg)}.
function apply(api, fn) {
  try {
    api.commit(study => {
      const setup = fn(currentGroupSetup(study));
      return writeGroupSetup(study, setup).study;
    });
  } catch (err) {
    api.toast(err.message);
  }
}

// Procura o ancestral (ou o próprio alvo) com o atributo data-gs-* indicado. Não depende de closest().
function gsAncestor(t, key) {
  for (let n = t; n; n = n.parentNode) if (n.dataset && n.dataset[key] !== undefined) return n;
  return null;
}

// Eventos de alteração (change) da janela. Retorna true quando tratou o evento.
export function groupSetupChange(el, api) {
  if (!el?.dataset) return false;
  if (el.dataset.gsItem !== undefined) {
    const k = el.dataset.gsItem, raw = String(el.value).replace(',', '.'), v = Number(raw);
    apply(api, setup => {
      if (k === 'groups') return setGroupCount(setup, Math.trunc(v));
      if (k === 'stops') return setStopCount(setup, Math.trunc(v));
      if (k === 'main') return setMainStop(setup, Math.trunc(v));
      if (k === 'travel') return setTravel(setup, v);
      if (k === 'population') return setPopulationTotal(setup, Math.trunc(v));
      throw Error('Item desconhecido.');
    });
    return true;
  }
  if (el.dataset.gsMark !== undefined) {
    const i = Number(el.dataset.gsMark);
    apply(api, setup => setStopMark(setup, i, el.value));
    return true;
  }
  if (el.dataset.gsPop !== undefined) {
    const i = Number(el.dataset.gsPop), v = Math.trunc(Number(String(el.value).replace(',', '.')));
    apply(api, setup => setPopulationAt(setup, i, v));
    return true;
  }
  if (el.dataset.gsUp !== undefined) {
    const i = Number(el.dataset.gsUp), v = Number(String(el.value).replace(',', '.'));
    apply(api, setup => setUp(setup, i, v));
    return true;
  }
  return false;
}

function cellsFrom(a, b) {
  const [g1, i1] = a, [g2, i2] = b;
  return {g1, g2, i1, i2};
}

// Células de elevador: chave "carGRUPO_ELEVADOR" (ex.: car0_1). Atende/Não ativo grava por elevador, como o checkbox.
const CAR_CELL = /^car(\d+)_(\d+)$/;
function applyCarCells(api, cells, st) {
  if (st === 'express') { api.toast('Zona expressa é definida na configuração inicial dos grupos.'); return; }
  try {
    api.commit(study => {
      let s = study;
      const rows = s.floorTable?.rows || [];
      const mainIndex = currentGroupSetup(s).mainStop - 1;
      for (const {g, i} of cells) {
        const [, index, j] = g.match(CAR_CELL);
        if (i === mainIndex) continue; // o principal é travado
        const row = rows[i];
        if (!row) continue;
        s = changeCar(s, Number(index), Number(j), 'servedFloorId', {id: row.id, checked: st === 'active'});
      }
      return s;
    });
  } catch (err) {
    api.toast(err.message);
  }
}

// Clique (seleção) e aplicação de estado pela legenda. Retorna true quando tratou.
export function groupSetupClick(e, api) {
  const t = e?.target;
  if (!t) return false;
  const cell = gsAncestor(t, 'gsCell');
  if (cell && e.button === 0) {
    const g = cell.dataset.g, i = Number(cell.dataset.i), k = keyOf(g, i);
    if (e.shiftKey && drag?.anchor) {
      selectRange(drag.anchor, {g, i});
    } else if (e.ctrlKey || e.metaKey) {
      selection.has(k) ? selection.delete(k) : selection.add(k);
      drag = {anchor: {g, i}};
    } else {
      selection.clear();
      selection.add(k);
      drag = {anchor: {g, i}};
    }
    api.render();
    return true;
  }
  const apply_ = gsAncestor(t, 'gsApply');
  if (apply_) {
    const st = apply_.dataset.gsApply;
    const sel = [...selection].map(k => { const [g, i] = k.split('|'); return {g, i: Number(i)}; });
    if (!sel.length) { api.toast('Selecione uma ou mais células antes de aplicar o estado.'); return true; }
    const carSel = sel.filter(x => CAR_CELL.test(x.g));
    const groupSel = sel.filter(x => !CAR_CELL.test(x.g));
    if (carSel.length) applyCarCells(api, carSel, st);
    const byGroup = new Map();
    for (const {g, i} of groupSel) byGroup.set(g, [...(byGroup.get(g) || []), i]);
    if (byGroup.size) apply(api, setup => {
      let s = setup;
      for (const [g, idx] of byGroup) s = setStates(s, g, idx, st);
      return s;
    });
    return true;
  }
  if (gsAncestor(t, 'gsClear')) { selection.clear(); api.render(); return true; }
  return false;
}

// Seleção retangular: botão direito, arrastar até outra célula e soltar.
function selectRange(a, b) {
  selection.clear();
  const r = cellsFrom([a.g, a.i], [b.g, b.i]);
  const ids = []; // grupos na ordem da tela (já está no DOM)
  document.querySelectorAll('[data-gs-cell]').forEach(td => ids.push(td.dataset.g));
  const groups = [...new Set(ids)];
  const gi = groups.indexOf(r.g1), gj = groups.indexOf(r.g2);
  const lo = Math.min(gi, gj), hi = Math.max(gi, gj), ilo = Math.min(r.i1, r.i2), ihi = Math.max(r.i1, r.i2);
  for (let x = lo; x <= hi; x++) for (let i = ilo; i <= ihi; i++) selection.add(keyOf(groups[x], i));
}

// Pressionar o botão direito inicia a seleção; arrastar amplia; soltar encerra.
export function groupSetupPointer(type, e, api) {
  const t = e?.target;
  if (!t) return false;
  const cell = gsAncestor(t, 'gsCell');
  if (type === 'contextmenu') return !!gsAncestor(t, 'gsRevision');
  if (type === 'mousedown' && e.button === 2 && cell) {
    drag = {anchor: {g: cell.dataset.g, i: Number(cell.dataset.i)}, right: true};
    selectRange(drag.anchor, drag.anchor);
    api.render();
    return true;
  }
  if (type === 'mouseover' && drag?.right && cell) {
    selectRange(drag.anchor, {g: cell.dataset.g, i: Number(cell.dataset.i)});
    api.render();
    return true;
  }
  if (type === 'mouseup' && drag?.right) {
    drag = null;
    return true;
  }
  return false;
}
