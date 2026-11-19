// Valor exibido em campos numéricos: até 3 casas decimais. Não altera o valor guardado nem os cálculos.
export const displayValue=v=>typeof v==='number'?(Number.isFinite(v)?String(Number(v.toFixed(3))):''):v;
