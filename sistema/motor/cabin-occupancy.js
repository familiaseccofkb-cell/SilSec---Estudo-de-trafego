// Fator de ocupação da cabina (ISO 8100-32), informado por elevador na tabela "Dados do fabricante".
// Capacidade adotada = lotação × fator, arredondada para cima (ex.: 13 × 80% = 10,4 → 11 pessoas).
// Campo vazio ou ausente = 80%. Estudos anteriores sem o campo passam a usar este padrão.
export const DEFAULT_CABIN_OCCUPANCY=80;
export const cabinOccupancy=g=>Number.isFinite(g?.cabinOccupancy)?g.cabinOccupancy:DEFAULT_CABIN_OCCUPANCY;
// Tolerância de 1e-6 evita que ruído de ponto flutuante (ex.: 6,4000000001) arredonde para cima indevidamente.
// Capacidade adotada no ADS (destino) e nos cálculos que usam o fator de ocupação.
export const effectiveCapacity=g=>Math.ceil(Math.round(g.capacity*cabinOccupancy(g)/100*1e6)/1e6);
// Lotação nominal (pessoas): NBR 5665 e FAB convencional. O fator de ocupação não se aplica a estes cálculos.
export const nominalCapacity=g=>g.capacity;
export const validCabinOccupancy=value=>value===undefined||value===null||(Number.isFinite(value)&&value>0&&value<=100);
