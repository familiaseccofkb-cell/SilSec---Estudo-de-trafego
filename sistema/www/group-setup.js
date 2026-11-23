// Configuração inicial dos grupos: pavimentos, desníveis, população e atendimento por grupo.
// Convenção: as paradas são numeradas de baixo para cima (1 = pavimento inferior).
// O campo "desnível" de cada pavimento é a distância até o pavimento imediatamente acima;
// o pavimento mais alto não tem desnível (campo travado). O percurso total é a soma dos desníveis.
// Estados de atendimento por célula: 'active' (ativo), 'inactive' (não ativo), 'express' (zona expressa).
// O pavimento principal tem estado editável como os demais, mas o grupo sempre o atende (é a saída à rua).

// Numeração das mudanças da reescrita (independente da versão do aplicativo, que só muda na publicação).
export const GROUP_SETUP_REVISION = 'V0096';

export const GROUP_STATES = ['active', 'inactive', 'express'];
export const GROUP_STATE_LABELS = {active: 'Ativo', inactive: 'Não ativo', express: 'Zona expressa', main: 'Pavimento principal'};
const MAX_STOPS = 200, MAX_GROUPS = 20, MAX_UP = 100;
const round2 = v => Math.round(v * 100) / 100;

const num = (v, min, max) => typeof v === 'number' && Number.isFinite(v) && v >= min && v <= max;

// Cria a configuração inicial. groups: [{id,label}] ou quantidade.
export function defaultGroupSetup({stops = 2, mainStop = 1, travel = null, population = 0, groups = 1} = {}) {
  let s = {version: 1, stops: 0, mainStop: 1, up: [], population: [], marks: [], groups: [], states: {}};
  s = setStopCount(s, stops);
  s = setMainStop(s, mainStop);
  s = setGroupCount(s, typeof groups === 'number' ? groups : groups.length, typeof groups === 'number' ? null : groups);
  if (travel !== null) s = setTravel(s, travel);
  s = setPopulationTotal(s, population);
  return s;
}

const clone = x => JSON.parse(JSON.stringify(x));

// Marcação: pavimento principal = 0, acima positivo, abaixo negativo.
export function automaticMarks(stops, mainStop) {
  return Array.from({length: stops}, (_, i) => String(i + 1 - mainStop));
}

export function setStopCount(setup, n) {
  const s = clone(setup);
  if (!Number.isInteger(n) || n < 2 || n > MAX_STOPS) throw Error(`Informe de 2 a ${MAX_STOPS} paradas totais.`);
  const old = s.stops;
  s.stops = n;
  if (old === 0) { s.mainStop = Math.min(s.mainStop || 1, n); }
  s.mainStop = Math.min(s.mainStop, n);
  s.up = Array.from({length: n - 1}, (_, i) => s.up[i] ?? 0);
  s.population = Array.from({length: n}, (_, i) => s.population[i] ?? 0);
  s.marks = automaticMarks(n, s.mainStop);
  for (const id of Object.keys(s.states)) s.states[id] = Array.from({length: n}, (_, i) => s.states[id][i] ?? 'active');
  return s;
}

export function setMainStop(setup, m) {
  const s = clone(setup);
  if (!Number.isInteger(m) || m < 1 || m > s.stops) throw Error('Escolha uma parada existente como pavimento principal.');
  s.mainStop = m;
  s.marks = automaticMarks(s.stops, m);
  // Abaixo do principal não há população; a população é redistribuída pelo total informado.
  return setPopulationTotal(s, totalPopulation(s));
}

// Marcações devem ser únicas, e só o pavimento principal usa 0.
export function assertUniqueMarks(setup) {
  const seen = new Set();
  setup.marks.forEach((m, i) => {
    const isMain = i === setup.mainStop - 1;
    if (isMain ? m !== '0' : m === '0') throw Error(isMain ? 'O pavimento principal deve ser 0.' : 'A marcação 0 é reservada ao pavimento principal.');
    if (seen.has(m)) throw Error(`Pavimentos repetidos: a marcação ${m} aparece mais de uma vez. Corrija antes de continuar.`);
    seen.add(m);
  });
  return setup;
}

export function setStopMark(setup, index, value) {
  const s = clone(setup);
  if (!Number.isInteger(index) || index < 0 || index >= s.stops) throw Error('Pavimento não encontrado.');
  if (index === s.mainStop - 1) throw Error('O pavimento principal é zero e não pode ser renomeado.');
  const mark = String(value ?? '').trim().toUpperCase().replaceAll('−', '-');
  if (!mark || mark.length > 2 || !/^(?:-?\d{1,2}|[A-Z][A-Z0-9]?)$/.test(mark)) throw Error('Use no máximo dois caracteres na marcação: 1, -1, S ou S1.');
  if (mark === '0') throw Error('A marcação 0 é reservada ao pavimento principal.');
  const numeric = m => /^-?\d+$/.test(m);
  // Linhas abaixo e marcações especiais acima não podem repetir a marcação; números acima são renumerados em sequência.
  if (s.marks.some((m, i) => i !== index && (i < index || !numeric(m)) && m === mark)) throw Error(`A marcação ${mark} já existe.`);
  s.marks[index] = mark;
  if (numeric(mark) && index < s.mainStop - 1 && Number(mark) >= 0) throw Error('Pavimentos abaixo do principal têm marcação negativa.');
  if (numeric(mark)) {
    let next = Number(mark) + 1;
    for (let i = index + 1; i < s.stops; i++) {
      if (i === s.mainStop - 1) {
        if (index < i) break; // a sequência abaixo do principal termina nele
        next = 1; // acima do principal, a sequência recomeça em 1
        continue;
      }
      if (!numeric(s.marks[i])) continue; // marcações especiais (L, S...) não consomem número
      if (next === 0) throw Error('A sequência repetiria a marcação 0. Revise a marcação inicial.');
      s.marks[i] = String(next++);
    }
  }
  return s;
}

// Desnível do pavimento até o imediatamente acima. O mais alto não tem desnível.
export function setUp(setup, index, value) {
  const s = clone(setup);
  if (!Number.isInteger(index) || index < 0 || index >= s.stops - 1) throw Error('O pavimento mais alto não tem desnível editável.');
  if (!num(value, 0.01, MAX_UP)) throw Error('Informe um desnível positivo, de até 100 m.');
  s.up[index] = round2(value);
  return s;
}

export function travelOf(setup) {
  return round2(setup.up.reduce((a, b) => a + b, 0));
}

// Divide o percurso total igualmente entre os desníveis; a diferença de arredondamento vai para o último.
export function setTravel(setup, total) {
  const s = clone(setup), n = s.stops - 1;
  if (!num(total, 0.01, MAX_UP * n)) throw Error('Informe um percurso positivo compatível com os desníveis.');
  const each = Math.floor(total / n * 100) / 100;
  s.up = Array.from({length: n}, () => each);
  s.up[n - 1] = round2(total - each * (n - 1));
  return s;
}

// Elevação de cada parada, a partir da base (parada 1 = 0 m).
export function elevations(setup) {
  const e = [0];
  for (let i = 0; i < setup.stops - 1; i++) e.push(round2(e[i] + setup.up[i]));
  return e;
}

export function totalPopulation(setup) {
  return setup.population.reduce((a, b) => a + b, 0);
}

// População igual entre os pavimentos acima do principal, em números inteiros; resto no último.
export function setPopulationTotal(setup, total) {
  const s = clone(setup);
  if (!Number.isInteger(total) || total < 0 || total > 10000000) throw Error('Informe a população total como número inteiro.');
  const above = s.stops - s.mainStop;
  s.population = Array.from({length: s.stops}, () => 0);
  if (above > 0) {
    const each = Math.floor(total / above);
    for (let i = s.mainStop; i < s.stops; i++) s.population[i] = each;
    s.population[s.stops - 1] += total - each * above;
  }
  return s;
}

// População de um pavimento. O total do edifício é a soma dos pavimentos.
// O pavimento principal não tem população própria (travado em zero).
export function setPopulationAt(setup, index, value) {
  const s = clone(setup);
  if (!Number.isInteger(index) || index < 0 || index >= s.stops) throw Error('Pavimento não encontrado.');
  if (index === s.mainStop - 1) throw Error('O pavimento principal não recebe população.');
  if (!Number.isInteger(value) || value < 0 || value > 10000000) throw Error('Informe a população do pavimento como número inteiro, zero ou maior.');
  s.population[index] = value;
  return s;
}

export function setGroupCount(setup, n, labels = null) {
  const s = clone(setup);
  if (!Number.isInteger(n) || n < 1 || n > MAX_GROUPS) throw Error(`Informe de 1 a ${MAX_GROUPS} grupos.`);
  const keep = s.groups;
  s.groups = Array.from({length: n}, (_, i) => {
    const old = keep[i];
    const id = old?.id ?? 'g' + (i + 1);
    const label = labels?.[i]?.label ?? old?.label ?? `Grupo ${i + 1}`;
    if (!s.states[id]) s.states[id] = Array.from({length: s.stops}, () => 'active');
    return {id, label};
  });
  const ids = new Set(s.groups.map(g => g.id));
  for (const id of Object.keys(s.states)) if (!ids.has(id)) delete s.states[id];
  return s;
}

// Altera o estado de células (ignora o pavimento principal, que é travado).
export function setStates(setup, groupId, stopIndexes, state) {
  const s = clone(setup);
  if (!s.states[groupId]) throw Error('Grupo não encontrado.');
  if (!GROUP_STATES.includes(state)) throw Error('Estado de atendimento inválido.');
  for (const i of stopIndexes) {
    if (!Number.isInteger(i) || i < 0 || i >= s.stops) throw Error('Pavimento inválido na seleção.');
    s.states[groupId][i] = state;
  }
  return s;
}

export function stateAt(setup, groupId, index) {
  if (index === setup.mainStop - 1) return 'main';
  return setup.states[groupId]?.[index] ?? 'active';
}

// Paradas do grupo: ativas mais o principal (que é sempre considerado).
// Zona expressa e não ativo não param. Não ativo também não entra no tráfego do grupo.
export function groupStops(setup, groupId) {
  const served = [];
  for (let i = 0; i < setup.stops; i++) {
    const st = stateAt(setup, groupId, i);
    if (st === 'main' || st === 'active') served.push(i);
  }
  return served;
}

export function groupTravel(setup, groupId) {
  const served = groupStops(setup, groupId);
  if (served.length < 2) return 0;
  const e = elevations(setup);
  return round2(e[served.at(-1)] - e[served[0]]);
}

// População distribuída por andar: cada pavimento com população é dividido igualmente entre os
// grupos que o têm como ativo. O principal não tem população própria.
export function floorShares(setup) {
  return setup.population.map((pop, i) => {
    const groups = setup.groups.filter(g => stateAt(setup, g.id, i) === 'active').map(g => g.id);
    return {index: i, population: pop, groups, share: groups.length ? pop / groups.length : 0};
  });
}

// Uma zona de atendimento = conjunto de grupos com a mesma lista de paradas ativas.
export function zones(setup) {
  const map = new Map();
  for (const g of setup.groups) {
    const key = groupStops(setup, g.id).join(',');
    if (!map.has(key)) map.set(key, {key, stops: groupStops(setup, g.id), groups: [], population: 0});
    map.get(key).groups.push(g.id);
  }
  const shares = floorShares(setup);
  for (const z of map.values()) {
    // Cada andar divide sua população igualmente entre os grupos que o atendem; a zona soma a parte dos seus grupos.
    z.population = round2(shares.reduce((a, f) => a + f.groups.filter(id => z.groups.includes(id)).length * f.share, 0));
  }
  return [...map.values()];
}

export function validateGroupSetup(setup) {
  const errors = [];
  if (!setup || setup.version !== 1) return ['Configuração de grupos inválida.'];
  if (setup.stops < 2) errors.push('Cadastre pelo menos duas paradas.');
  try { assertUniqueMarks(setup); } catch (e) { errors.push(e.message); }
  if (setup.marks[setup.mainStop - 1] !== '0') errors.push('O pavimento principal deve ser marcado como 0.');
  setup.up.forEach((v, i) => { if (!num(v, 0.01, MAX_UP)) errors.push(`Pavimento ${setup.marks[i]}: desnível positivo, de até 100 m.`); });
  for (const g of setup.groups) {
    const served = groupStops(setup, g.id);
    if (served.length < 2) errors.push(`${g.label}: selecione pelo menos um pavimento ativo além do principal.`);
  }
  const unserved = floorShares(setup).filter(f => f.population > 0 && f.groups.length === 0).map(f => setup.marks[f.index]);
  if (unserved.length) errors.push(`Pavimentos com população sem grupo ativo: ${unserved.join(', ')}.`);
  return errors;
}

// Mantém a configuração alinhada aos grupos do estudo (ids e rótulos vêm do estudo).
export function reconcileGroups(setup, groups) {
  const s = clone(setup);
  s.groups = groups.map(g => ({id: g.id, label: g.label}));
  const next = {};
  for (const g of groups) next[g.id] = s.states[g.id] ? s.states[g.id].slice(0, s.stops) : Array.from({length: s.stops}, () => 'active');
  s.states = next;
  return s;
}
