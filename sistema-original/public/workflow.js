export const STUDY_STEPS=[
 {view:'study',title:'Cadastro',description:'Cliente e identificação do projeto',icon:'users'},
 {view:'parameters',title:'Parâmetros de cálculo',description:'Modelo, edifício e elevadores',icon:'elevator'},
 {view:'population',title:'Cálculo populacional',description:'Pavimentos e ambientes',icon:'users'},
 {view:'performance',title:'Gráficos de performance e economias',description:'Atendimento, energia e viagens',icon:'compare'},
 {view:'traffic',title:'Cálculo de tráfego',description:'Resultados e relatório',icon:'study'}
];
export const isStudyStep=view=>STUDY_STEPS.some(s=>s.view===view);
export function fieldStep(path){if(/\.energyEquipment\./.test(path))return 'performance';if(/^isoConfig\.(projectCnpj|approvalDate)$/.test(path))return 'study';if(/^(client|customer\.|name$|date$|building$|address$|projectDetails\.|annex\.)/.test(path))return 'study';if(/^transportEquipment\.|^populationCalc\.escalators\./.test(path))return 'parameters';if(/^groups\.|^populationCalc\.rows\.\d+\.groups\.|^isoConfig\.|^(trafficModel|use|method|commonService)$/.test(path))return 'parameters';if(/^operation\.schedule\.|^energy\.(baseline|comparisonTechnology|startsSource)$/.test(path))return 'parameters';if(/^operation\.|^energy\./.test(path))return 'performance';if(/^population/.test(path))return 'population';return 'study';}
