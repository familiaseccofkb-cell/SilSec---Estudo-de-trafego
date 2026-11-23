// V0024 · distribuição da população entre conjuntos de elevadores.
// Regras:
// 1. Cada composição vai para os conjuntos que atendem o seu andar. Com um só conjunto, ele recebe tudo;
//    com vários (andar de interligação), a população é dividida na proporção da capacidade de cada conjunto.
// 2. Se um conjunto ficar com falta, a sobra de outro conjunto que atende os mesmos andares cobre a falta.
// 3. Se ainda faltar, a população desse andar é reposicionada inteira para um conjunto que consiga atender,
//    quando existir; caso contrário a falta permanece e é informada.
// As funções são puras: não alteram o estudo.

const EPS = 1e-9;

// groups: [{key, label, capacity}] — capacidade em pessoas por 5 min (NBR) já somada por conjunto.
// lines:  [{id, label, mark, amount, serves: (key) => boolean}] — amount = população adotada da composição.
// rate:   fração da população no pico de 5 min (trafficRate do estudo).
export function allocatePopulation({groups = [], lines = [], rate = 1} = {}) {
  const state = new Map(groups.map(g => [g.key, {...g, assigned: 0}]));
  const parts = [];
  const unassigned = [];
  const moves = [];

  for (const line of lines) {
    const amount = Number(line.amount) || 0;
    if (amount <= EPS) continue;
    const serving = groups.filter(g => line.serves(g.key));
    const entry = {id: line.id, label: line.label, mark: line.mark, amount, parts: []};
    parts.push(entry);
    if (!serving.length) {
      unassigned.push({id: line.id, label: line.label, mark: line.mark, amount});
      entry.parts = [];
      continue;
    }
    const weight = serving.reduce((sum, g) => sum + Math.max(0, g.capacity || 0), 0);
    for (const g of serving) {
      const share = weight > 0 ? amount * Math.max(0, g.capacity || 0) / weight : amount / serving.length;
      entry.parts.push({key: g.key, amount: share});
      state.get(g.key).assigned += share;
    }
  }

  const balance = key => {
    const g = state.get(key);
    return g.capacity - g.assigned * rate;
  };
  const deficitGroups = () => groups.filter(g => balance(g.key) < -EPS).map(g => g.key);

  // 2. Sobra de quem atende o mesmo andar cobre a falta, pedaço a pedaço.
  for (const dKey of deficitGroups()) {
    for (const entry of parts) {
      const dp = entry.parts.find(p => p.key === dKey);
      while (dp && dp.amount > EPS && balance(dKey) < -EPS) {
        const donor = entry.parts
          .filter(p => p.key !== dKey && balance(p.key) > EPS)
          .sort((a, b) => balance(b.key) - balance(a.key))[0];
        if (!donor) break;
        const move = Math.min(dp.amount, balance(donor.key) / rate, -balance(dKey) / rate);
        if (move <= EPS) break;
        dp.amount -= move;
        donor.amount += move;
        state.get(dKey).assigned -= move;
        state.get(donor.key).assigned += move;
        moves.push({kind: 'parcial', mark: entry.mark, label: entry.label, from: dKey, to: donor.key, amount: move});
      }
    }
  }

  // 3. Se ainda faltar, reposiciona a população inteira do andar para um conjunto que consiga atender.
  for (const dKey of deficitGroups()) {
    for (const entry of parts) {
      const dp = entry.parts.find(p => p.key === dKey);
      if (!dp || dp.amount <= EPS || balance(dKey) >= -EPS) continue;
      const target = entry.parts
        .filter(p => p.key !== dKey && balance(p.key) - dp.amount * rate >= -EPS)
        .sort((a, b) => balance(b.key) - balance(a.key))[0];
      if (!target) continue;
      const amount = dp.amount;
      dp.amount = 0;
      target.amount += amount;
      state.get(dKey).assigned -= amount;
      state.get(target.key).assigned += amount;
      moves.push({kind: 'integral', mark: entry.mark, label: entry.label, from: dKey, to: target.key, amount});
    }
  }

  const result = groups.map(g => {
    const s = state.get(g.key);
    const required = s.assigned * rate;
    const difference = s.capacity - required;
    return {
      key: g.key,
      label: g.label,
      capacity: s.capacity,
      assigned: s.assigned,
      required,
      difference,
      status: difference < -EPS ? 'Falta' : difference > EPS ? 'Sobra' : 'Atende',
    };
  });

  return {
    groups: result,
    lines: parts.map(p => ({...p, parts: p.parts.filter(x => x.amount > EPS)})),
    moves,
    unassigned,
    unmet: result.filter(g => g.status === 'Falta').map(g => g.key),
  };
}
