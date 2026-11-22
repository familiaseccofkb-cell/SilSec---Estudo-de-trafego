// Traffic Estimator System (TES) · motor de cálculo compartilhado (etapa A: ponto de entrada único).
// A TES (site, sistema e versão offline) e a SilSec Engenharia (avaliação do estudo de tráfego) chamam o cálculo SOMENTE por aqui.
// Nesta etapa os arquivos do cálculo continuam em public/ (o navegador os carrega de lá); a mudança física para esta pasta
// depende de separar engine.js dos módulos de tela que ele ainda importa (report, basic, dimensions, building-floors, study-inputs).
// Nenhuma fórmula foi alterada: tests/motor-compartilhado.test.mjs compara os números com os de antes da separação.
export {
  ENGINE_VERSION, USES, DOORS, MAX_GROUPS, SPEED_OPTIONS,
  defaultStudy, defaultGroup, validateStudy, calculateStudy, calculateGroup, recalculatePopulationAndStudies,
  minimumElevators, minimumMessage, simulate, motionCheck, trafficRate, studyInterval, maxInterval,
} from '../public/engine.js';
export {normalizeStudy} from '../public/state.js';
export {switchTrafficModel} from '../public/models.js';
export {calculateBasic} from '../public/basic.js';
export {validateIsoStudy, calculateIsoStudy} from '../public/iso-engine.js';
export {destinationEstimate} from '../public/destination-estimate.js';
export {destinationEstimateIsoForNbr} from '../public/destination-iso.js';
export {adsComparison, adsComparisonValues} from '../public/ads-comparison.js';
export {autoFillCar} from '../public/car-controls.js';
export {simulateTraffic} from '../public/traffic-simulation.js';

import {recalculatePopulationAndStudies} from '../public/engine.js';
import {normalizeStudy} from '../public/state.js';
import {adsComparison} from '../public/ads-comparison.js';

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
