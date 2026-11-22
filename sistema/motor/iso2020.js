// ISO 8100-32:2020 (edição publicada) · somente valores numéricos e fórmulas, com a cláusula de origem.
// O texto da norma não é reproduzido; consulte a edição oficial (ISO ou ABNT) para o enunciado completo.
export const ISO2020_PROVENANCE='ISO 8100-32:2020 · método de cálculo (cláusula 7) e de simulação (cláusula 8), com os valores das tabelas 2 a 7 e dos anexos A a D. A conferência final do projeto é do responsável técnico, com a edição oficial da norma.';

// Tabela 2 · critérios do método de cálculo (pico de subida): %Ch mínimo e intervalo máximo.
export const ISO2020_CALC={offices:{rate:.12,limit:30},single:{rate:.12,limit:30},hotel:{rate:.12,limit:40},residential:{rate:.06,limit:60}};
// Tabela 3 · critérios do método de simulação: mistura de tráfego (entrada/saída/entre andares), %Ch e tempo médio de espera.
export const ISO2020_SIM={
 offices:[{mix:[100,0,0],label:'Pico de subida',rate:.12,wait:30},{mix:[85,10,5],label:'Manhã com saída e entre andares',rate:.12,wait:35},{mix:[40,40,20],label:'Almoço',rate:.11,wait:40},{mix:[45,45,10],label:'Almoço com pouco tráfego entre andares',rate:.11,wait:40}],
 hotel:[{mix:[50,50,0],label:'Entrada e saída',rate:.12,wait:40}],
 residential:[{mix:[50,50,0],label:'Entrada e saída',rate:.07,wait:60}]};
ISO2020_SIM.single=ISO2020_SIM.offices;
// Tabela 4 · população de escritórios: área por pessoa (m²) e fator de utilização (%). Fórmula (1): U = An × Fu / Awp.
export const ISO2020_OFFICE={prestige:{min:12,max:14,utilization:80},standard:{min:10,max:12,utilization:80},open:{min:8,max:10,utilization:85},dense:{min:6,max:8,utilization:90}};
// Tabela 5 · pessoas por apartamento, nas classes prestígio / padrão / básico.
export const ISO2020_RESIDENTIAL={studio:[1,1.5,2],apartment1:[1.5,1.8,2],apartment2:[2,3,4],apartment3:[3,4,6]};
// Tabela 6 · tempo de transferência por passageiro tp (s) pela largura da porta (mm).
export const ISO2020_TRANSFER={900:1.1,1000:1,1100:1,1200:.9};
// Tabela 7 · tempo nominal de viagem tnt (s) por uso; velocidade sugerida vn = D / tnt (anexo B).
export const ISO2020_TNT={offices:[20,30],single:[20,30],hotel:[25,35],residential:[25,45]};
// Anexo C (exemplos) · soma dos tempos de abertura e fechamento de porta (s), por tipo e largura.
// A divisão abertura/fechamento segue a proporção do exemplo do anexo D (2,0 s + 2,4 s); só a soma entra no cálculo.
export const ISO2020_DOOR_SUM={lateral:{900:5.6,1100:6.7},central:{1100:4.4,1200:4.8}};
// Anexos C e D (exemplos) · aceleração (m/s²) e jerk (m/s³) por velocidade (m/s).
export const ISO2020_MOTION=[[1,.6,.8],[1.6,.8,1],[2,.8,1],[2.5,1,1],[3,1,1],[3.5,1,1],[5,1,1]];
// Tabela A.1 · Pcalc (cálculo) e Psim (simulação) × carga nominal (kg) × área útil máxima (m²).
export const ISO2020_A1=[{pcalc:6.3,psim:6,load:630,area:1.66},{pcalc:7.6,psim:8,load:800,area:2},{pcalc:9.1,psim:10,load:1000,area:2.4},{pcalc:11.2,psim:13,load:1275,area:2.95},{pcalc:11.8,psim:14,load:1350,area:3.1},{pcalc:13.6,psim:16,load:1600,area:3.56},{pcalc:14.8,psim:18,load:1800,area:3.88},{pcalc:16,psim:20,load:2000,area:4.2},{pcalc:19,psim:23,load:2500,area:5}];
export const ISO2020_LOADS=ISO2020_A1.map(r=>r.load);
export const ISO2020_MASS=75, ISO2020_FILL=.8;
export const ISO2020_SUPPORTED_USES=['offices','single','hotel','residential'];

export function iso2020Door(width,door){const sum=ISO2020_DOOR_SUM[door]?.[width];if(!sum)throw Error('ISO 8100-32:2020: o anexo C traz tempos de porta para abertura lateral de 900 e 1.100 mm e central de 1.100 e 1.200 mm. Para outra porta, use os dados do fabricante.');const open=Math.round(sum*2/4.4*100)/100;return {open,close:Math.round((sum-open)*100)/100,sum};}
export function iso2020Motion(speed){const p=ISO2020_MOTION.find(r=>Math.abs(r[0]-speed)<1e-9);if(!p)throw Error('ISO 8100-32:2020: aceleração e jerk de exemplo existem para 1,0; 1,6; 2,0; 2,5; 3,0; 3,5 e 5,0 m/s (anexos C e D). Para outra velocidade, use os dados do fabricante.');return {acceleration:p[1],jerk:p[2]};}
export function iso2020Transfer(width){const tp=ISO2020_TRANSFER[width];if(!tp)throw Error('ISO 8100-32:2020: a tabela 6 traz tp para portas de 900 a 1.200 mm. Para outra largura, use os dados do fabricante.');return tp;}

// Fórmulas (3) a (6) e tabela A.1: carga e área mínimas para Pcalc.
export function iso2020CarSelection(pcalc,{areaPerPerson=.21}={}){const massLoad=pcalc*ISO2020_MASS/ISO2020_FILL,minArea=pcalc*areaPerPerson/ISO2020_FILL;
 const byMass=ISO2020_LOADS.find(l=>l>=massLoad-1e-9)??null,row=ISO2020_A1.find(r=>pcalc<=r.pcalc+1e-9)??null;
 return {pcalc,massLoad,minArea,byMass,byArea:row?row.load:null,areaOfSelected:row?row.area:null,outOfTable:!row};}
export function iso2020PsimFromCar({ratedLoad=0,cabinArea=0,capacity=0},areaPerPerson=.21){if(cabinArea>0)return Math.max(1,Math.floor(cabinArea/areaPerPerson+1e-9));const row=ratedLoad>0?ISO2020_A1.find(r=>r.load===ratedLoad):null;if(row)return row.psim;return Math.max(1,Math.floor(capacity*ISO2020_FILL+1e-9));}

// Gatilhos da cláusula 5.3: situações em que o método de cálculo não basta e a simulação é exigida.
export function iso2020ComplexityTriggers(study){const c=study.isoConfig||{},out=[],groups=study.groups||[],N=groups[0]?groups[0].stops-1:0,count=groups.reduce((s,g)=>s+g.count,0);
 if(c.controlType==='destination')out.push('Controle de destino');
 if(N>18)out.push(`Mais de 18 andares atendidos acima do acesso (${N})`);
 if(c.multipleEntrances)out.push('Mais de um andar de acesso principal');
 if(count>8)out.push(`Mais de 8 elevadores no grupo (${count})`);
 if(groups.some(g=>g.capacity!==groups[0].capacity||g.speed!==groups[0].speed||g.stops!==groups[0].stops))out.push('Elevadores do grupo com características diferentes');
 if((study.populationCalc?.rows||[]).some(r=>Number(r.servedFloor??r.floor)<Number(study.populationCalc?.accessFloor??0)))out.push('Andares atendidos abaixo do acesso principal');
 if(!c.uniformModel)out.push('Distribuição de população ou alturas não uniforme');
 return out;}

// Anexo B / tabela 7: faixa de velocidade sugerida pelo tempo nominal de viagem.
export function iso2020SpeedRange(use,travel){const t=ISO2020_TNT[use];if(!t||!(travel>0))return null;return {tnt:t,min:travel/t[1],max:travel/t[0]};}
