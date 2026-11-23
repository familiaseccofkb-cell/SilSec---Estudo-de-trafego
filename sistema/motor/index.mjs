// Motor de cálculo de tráfego de elevadores, compartilhado pelas duas marcas.
// O site, o sistema e a versão offline chamam o cálculo por aqui.
// Os arquivos desta pasta não importam nada de tela (www/); www/<arquivo>.js só reexporta o cálculo daqui.
// Nenhuma fórmula foi alterada: tests/motor-compartilhado.test.mjs compara os números com os de antes da separação.
export {
  ENGINE_VERSION, USES, DOORS, MAX_GROUPS, SPEED_OPTIONS,
  defaultStudy, defaultGroup, validateStudy, calculateStudy, calculateGroup, recalculatePopulationAndStudies,
  minimumElevators, minimumMessage, simulate, motionCheck, trafficRate, studyInterval, maxInterval,
} from './engine.js';
export {normalizeStudy} from './state.js';
export {switchTrafficModel} from './models.js';
export {calculateBasic} from './basic.js';
export {validateIsoStudy, calculateIsoStudy} from './iso-engine.js';
export {destinationEstimate} from './destination-estimate.js';
export {destinationEstimateIsoForNbr} from './destination-iso.js';
export {adsComparison, adsComparisonValues} from './ads-comparison.js';
export {autoFillCar} from './car-controls.js';
export {simulateTraffic} from './traffic-simulation.js';

import {recalculatePopulationAndStudies} from './engine.js';
import {normalizeStudy} from './state.js';
import {adsComparison} from './ads-comparison.js';

export const MOTOR_NOME = 'Traffic Estimator System';
export const MOTOR_VERSAO = '1.0.0';

// Avaliação completa de um estudo (o que a SilSec chama ao avaliar um estudo de tráfego).
// Entrada: o estudo no formato do sistema. Saída: estudo normalizado, resultados e comparativo ADS (null se não se aplicar).
export function avaliarEstudo(estudo) {
  const r = recalculatePopulationAndStudies(normalizeStudy(estudo));
  let ads = null;
  try { ads = adsComparison(r.study, r.results); } catch { ads = null; }
  return {motor: {nome: MOTOR_NOME, versao: MOTOR_VERSAO}, study: r.study, results: r.results, ads};
}
