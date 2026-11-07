export const defaultSchedule=()=>({enabled:true,start:'06:00',end:'22:00',lunchStart:'11:30',lunchEnd:'14:00',peakUtilizationPercent:20});
export const minuteOfDay=s=>/^\d{2}:\d{2}$/.test(s||'')?Number(s.slice(0,2))*60+Number(s.slice(3)):NaN;
export const clock=m=>`${String(Math.floor(m/60)).padStart(2,'0')}:${String(m%60).padStart(2,'0')}`;
export function validateSchedule(value){if(!value?.enabled)return [];const {start,end,lunchStart,lunchEnd,peakUtilizationPercent:p}=value,t=[start,end,lunchStart,lunchEnd].map(minuteOfDay);return t.some(x=>!Number.isFinite(x)||x<0||x>=1440)||t[1]<=t[0]||t[2]<t[0]||t[3]>t[1]||t[3]<=t[2]||t.some(x=>x%5)||!(p>0&&p<=100)?['Horários: use intervalos de 5 minutos no mesmo dia, almoço dentro do expediente e utilização do pico entre 0% e 100%.']:[];}
export function dailyPerformance(rows,schedule,capacity,{measured=false,starts}={}){
 const a=minuteOfDay(schedule.start),b=minuteOfDay(schedule.end),l1=minuteOfDay(schedule.lunchStart),l2=minuteOfDay(schedule.lunchEnd);
 const totals={arrival:rows.reduce((s,r)=>s+r.arrival,0),departure:rows.reduce((s,r)=>s+r.departure,0),lunchIn:rows.reduce((s,r)=>s+r.lunchIn,0),lunchOut:rows.reduce((s,r)=>s+r.lunchOut,0)};
 const output=Array.from({length:(b-a)/5},(_,i)=>({minute:(i+1)*5,clock:clock(a+i*5),arrival:0,departure:0,lunchIn:0,lunchOut:0,capacity}));
 if(measured){for(const [key,time] of [['arrival',starts.entry],['departure',starts.exit],['lunchIn',starts.lunch],['lunchOut',starts.lunch]]){const start=minuteOfDay(time);if(start<a||start+rows.length*5>b||['lunchIn','lunchOut'].includes(key)&&(start<l1||start+rows.length*5>l2))throw Error('A janela real da medição deve estar dentro do expediente e o almoço dentro do período informado. Ajuste os horários sem redistribuir as contagens medidas.');for(let i=0;i<rows.length;i++)output[(start-a)/5+i][key]=rows[i][key];}}else{
 for(const [key,start,end] of [['arrival',a,Math.min(a+60,l1)],['departure',Math.max(l2,b-60),b],['lunchIn',l1,l2],['lunchOut',l1,l2]]){
  const size=(end-start)/5,source=rows.map(r=>r[key]),sum=source.reduce((s,x)=>s+x,0);if(size<=0||!sum)continue;
  // Redistribute each original five-minute profile cell by overlap; conserve people.
  for(let j=0;j<size;j++){let weight=0;for(let k=0;k<source.length;k++){const lo=Math.max(j/size,k/source.length),hi=Math.min((j+1)/size,(k+1)/source.length);if(hi>lo)weight+=source[k]*(hi-lo)*source.length;}output[(start-a)/5+j][key]=weight;}
 }
 }
 let q=0,qi=0,qo=0,qe=0;
 for(const r of output){q=Math.max(0,q+r.arrival-r.capacity);qe=Math.max(0,qe+r.departure-r.capacity);const li=qi+r.lunchIn,lo=qo+r.lunchOut,total=li+lo,served=Math.min(capacity,total);qi=total?li*(1-served/total):0;qo=total?lo*(1-served/total):0;Object.assign(r,{lunch:r.lunchIn+r.lunchOut,queueIn:q,queueOut:qe,queueLunchIn:qi,queueLunchOut:qo,queueLunch:qi+qo});}
 return {rows:output,totals,hours:(b-a)/60,note:`Expediente ${schedule.start}–${schedule.end}; almoço ${schedule.lunchStart}–${schedule.lunchEnd}. ${measured?'Contagens medidas preservadas nos horários reais, em blocos de 5 minutos.':'Perfis redistribuídos em blocos de 5 minutos, conservando os totais.'} Demanda fora das janelas de pico não foi medida.`};
}
