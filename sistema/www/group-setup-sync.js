// Ponte entre a configuração inicial dos grupos (group-setup.js) e o estudo (floorTable, grupos e composições).
import {GROUP_SETUP_REVISION,defaultGroupSetup,reconcileGroups,assertUniqueMarks,setStopCount,stateAt,automaticMarks,validateGroupSetup,travelOf,totalPopulation,setPopulationTotal} from './group-setup.js';
import {normalizeFloorTable,resizeFloorTable,synchronizeFloorTable,numericMark} from './building-floors.js';
import {resizeStudyGroups} from './study-inputs.js';
import {accessRowIndex} from './building-access.js';
const copy = x => structuredClone(x);

// Configuração a partir do estudo já cadastrado (usada quando ainda não existe groupSetup).
export function groupSetupFromStudy(study) {
  const s = copy(study);
  normalizeFloorTable(s);
  const rows = s.floorTable.rows;
  const main = Math.max(1, accessRowIndex(s.floorTable) + 1);
  const stored = study.groupSetup?.version === 1 ? study.groupSetup : null;
  let setup = defaultGroupSetup({stops: Math.max(2, rows.length), mainStop: main, groups: s.groups.map(g => ({id: g.id, label: g.label}))});
  // Marcações gravadas antes podem estar repetidas: nesse caso volta a numeração automática.
  setup.marks = rows.map(r => r.mark);
  setup.marks[main - 1] = '0';
  try { assertUniqueMarks(setup); } catch { setup.marks = automaticMarks(setup.stops, main); }
  setup.up = rows.slice(1).map(r => (Number.isFinite(r.height) && r.height > 0 ? r.height : 3));
  setup.up = Array.from({length: rows.length - 1}, (_, i) => setup.up[i] ?? 3);
  for (const g of s.groups) setup.states[g.id] = rows.map(r => (r.served?.[g.id] ? 'active' : 'inactive'));
  if (stored) {
    setup.population = stored.population.length === setup.stops ? stored.population.slice() : setup.population;
    for (const id of Object.keys(stored.states)) if (setup.states[id] && stored.states[id].length === setup.stops) setup.states[id] = stored.states[id].slice();
  }
  return reconcileGroups(setup, s.groups);
}

// Grava a configuração no estudo: grupos, quantidade de pavimentos, marcações, distâncias e atendimento.
export function writeGroupSetup(study, setup) {
  const errors = [];
  assertUniqueMarks(setup); // nunca grava pavimentos repetidos
  let s = copy(study);
  normalizeFloorTable(s);
  if (s.groups.length !== setup.groups.length) s = resizeStudyGroups(s, setup.groups.length);
  setup = reconcileGroups(setup, s.groups);
  if (s.floorTable.rows.length !== setup.stops) s = resizeFloorTable(s, setup.stops);
  const rows = s.floorTable.rows;
  // Composições seguem a marcação nova do mesmo pavimento (por posição).
  const oldMarks = rows.map(r => r.mark), remap = new Map(oldMarks.map((m, i) => [m, setup.marks[i]]));
  for (const row of s.populationCalc.rows) if (remap.has(row.servedFloorMark)) row.servedFloorMark = remap.get(row.servedFloorMark);
  rows.forEach((r, i) => {
    r.mark = setup.marks[i];
    r.special = !numericMark(r.mark);
    r.height = i ? setup.up[i - 1] : 0;
    for (const g of s.groups) r.served[g.id] = ['active', 'main'].includes(stateAt(setup, g.id, i));
  });
  // Elevadores seguem o atendimento do grupo: parada ativa aparece como atendida. Remoção feita em um elevador vale até a próxima gravação da configuração (V0016).
  for (const g of s.groups) {
    if (!Array.isArray(g.cars)) continue;
    const served = rows.filter(r => r.served[g.id]).map(r => r.id);
    g.cars = g.cars.map(c => ({...c, servedFloorIds: served.slice()}));
  }
  s.floorTable.accessRowId = rows[setup.mainStop - 1].id;
  s.floorTable.enabled = true;
  s.groupSetup = setup;
  s.entryVersion = 8;
  s.groupSetupRevision = GROUP_SETUP_REVISION;
  s = synchronizeFloorTable(s);
  return {study: s, errors: validateGroupSetup(setup)};
}

export {setStopCount, travelOf, totalPopulation, setPopulationTotal, automaticMarks, accessRowIndex};
