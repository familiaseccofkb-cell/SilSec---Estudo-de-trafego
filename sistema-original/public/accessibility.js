// ABNT NBR 16858-3:2022 · 5.2.1, 5.3.1 (Tabela 3) e 5.3.2.1.
// Conferência informativa: não substitui a verificação completa da norma oficial.
export const ACCESSIBILITY_REFERENCE='ABNT NBR 16858-3:2022 · 5.2.1, Tabela 3 e 5.3.2.1';
export const ACCESSIBLE_CABINS=[
 {type:1,sizes:[[900,1300]],door:800,existingOnly:true,label:'Cadeira de rodas sem acompanhante (somente edifícios existentes)'},
 {type:2,sizes:[[1100,1400]],door:900,doorExisting:800,doorShortPassage:800,label:'Cadeira de rodas e um acompanhante'},
 {type:3,sizes:[[1200,2200]],door:1100,label:'Cadeira de rodas classe C e maca'},
 {type:4,sizes:[[1600,1400],[1400,1600]],door:900,label:'Giro de cadeira de rodas e alguns passageiros'},
 {type:5,sizes:[[2000,1400],[1400,2000]],door:1100,label:'Giro de cadeira de rodas e vários passageiros'}
];
const mm=v=>typeof v==='number'&&Number.isFinite(v)&&v>0;
// building: 'new' | 'existing'; arrangement: 'same' | 'opposite' | 'adjacent'
export function accessibilityCheck({cabinWidth,cabinDepth,doorWidth,building='new',arrangement=''}={}){
 if(!mm(cabinWidth)||!mm(cabinDepth))return {status:'missing',types:[],notes:[],reference:ACCESSIBILITY_REFERENCE};
 const existing=building==='existing',notes=[],types=[];
 for(const c of ACCESSIBLE_CABINS){
  if(c.existingOnly&&!existing)continue;
  if(!c.sizes.some(([w,d])=>cabinWidth>=w&&cabinDepth>=d))continue;
  if(!mm(doorWidth)){types.push({type:c.type,door:'pending'});continue;}
  if(doorWidth>=c.door)types.push({type:c.type,door:'ok'});
  else if(c.type===2&&existing&&doorWidth>=c.doorExisting)types.push({type:2,door:'ok'});
  else if(c.type===2&&doorWidth>=c.doorShortPassage)types.push({type:2,door:'conditional'});
 }
 const best=types.length?Math.max(...types.map(t=>t.type)):null;
 const minimum=arrangement==='adjacent'?4:existing?1:2;
 const meets=types.some(t=>t.type>=minimum&&t.door!=='pending');
 if(types.some(t=>t.type===2&&t.door==='conditional'))notes.push('Abertura de 800 mm a 899 mm na cabina tipo 2 somente com passagem de até 400 mm de extensão (ABNT NBR 9050:2020, 4.3.2).');
 if(types.some(t=>t.door==='pending'))notes.push('Informe a abertura livre da porta para concluir a classificação.');
 if(cabinWidth>=1400&&cabinDepth>=1400)notes.push('Largura e profundidade a partir de 1 400 mm: segundo corrimão na parede oposta ou traseira (5.3.2.1).');
 if(arrangement==='adjacent')notes.push('Portas em paredes adjacentes exigem no mínimo a cabina tipo 4 (Tabela 3, nota a).');
 notes.push('Medir entre paredes estruturais a 1 m do piso; acabamentos decorativos não podem reduzir mais de 15 mm por parede (5.3.1).');
 const status=!types.length?'none':meets?'meets':'below';
 return {status,types,best,minimum,notes,reference:ACCESSIBILITY_REFERENCE};
}
export function accessibilityHtml(input,esc){
 const r=accessibilityCheck(input);
 const label={missing:'Dimensões pendentes',none:'Não atende a nenhum tipo da Tabela 3',below:`Abaixo do mínimo exigido (tipo ${r.minimum})`,meets:`Atende ao mínimo exigido (tipo ${r.minimum})`}[r.status];
 const types=r.types.map(t=>`tipo ${t.type}${t.door==='conditional'?' (condicionado)':t.door==='pending'?' (porta pendente)':''}`).join(', ');
 return `<section class="accessibility-section"><h4>Acessibilidade da cabina · ${esc(r.reference)}</h4><p class="${['none','below'].includes(r.status)?'score-red':''}">${esc(label)}${types?' · '+esc(types):''}</p>${r.notes.map(x=>`<p class="hint">${esc(x)}</p>`).join('')}</section>`;
}
