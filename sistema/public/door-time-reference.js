// Tempos de abertura e fechamento de porta informados pelo fabricante, por tipo de abertura e vão adotado (mm).
// Os valores são os da tabela do fabricante (abertura central e lateral). Em vão tabelado, o sistema pré-define os tempos
// do grupo; em vão fora da tabela, os tempos são informados manualmente.
export const DOOR_TIME_REFERENCE={
 central:{800:[1.7,2.3],900:[1.8,2.5],1000:[1.9,2.6],1100:[2.0,2.8],1200:[2.2,3.0]},
 lateral:{800:[2.9,3.5],900:[3.0,3.8],1000:[3.2,4.1],1100:[3.4,4.4],1200:[3.6,4.7],1300:[3.8,5.0]},
};
export const DOOR_TYPE_NAMES={central:'Central',lateral:'Lateral'};
export const doorWidthsFor=type=>Object.keys(DOOR_TIME_REFERENCE[type]||{}).map(Number);
export function doorTimesFor(type,width){const row=DOOR_TIME_REFERENCE[type]?.[Number(width)];return row?{open:row[0],close:row[1]}:null;}
// Grava no grupo da proposta os tempos do tipo e vão informados; devolve true quando a tabela cobre a combinação.
export function applyOfferDoor(group){const t=doorTimesFor(group?.door,group?.width);if(!t)return false;group.open=t.open;group.close=t.close;return true;}
export function applyDoorReference(group){const d=group?.product?.dimensions,t=d?doorTimesFor(d.doorType,d.doorWidth):null;if(!t)return false;group.open=t.open;group.close=t.close;return true;}
