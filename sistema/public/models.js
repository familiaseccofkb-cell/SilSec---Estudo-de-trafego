
import {NORM_PREFERENCE_LABELS,normPreferenceKey} from '../motor/models.js';
export * from '../motor/models.js';
export function readNormPreference(userId){try{return localStorage.getItem(normPreferenceKey(userId))==='iso8100'?'iso8100':'nbr5665';}catch{return 'nbr5665';}}
export function writeNormPreference(userId,model){if(!Object.hasOwn(NORM_PREFERENCE_LABELS,model))throw Error('Norma de cálculo inválida.');try{localStorage.setItem(normPreferenceKey(userId),model);}catch{throw Error('Não foi possível guardar a preferência neste navegador.');}}
