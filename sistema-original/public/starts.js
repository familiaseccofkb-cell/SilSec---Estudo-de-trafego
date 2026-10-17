// Supplemental operating estimate. Does not change the workbook/NBR cycles.
export const STARTS_METHOD_VERSION='1';
export const STARTS_SOURCES={kinematics:'https://joomla.peters-research.com/index.php/support/articles-and-papers/53-ideal-lift-kinematics',machine:'https://www.ziehl-abegg.com/fileadmin/Downloadcenter_NEW/00_englisch(EN)_MASTER/X04_Operating_instructions/A-TBA18-01-GB.pdf'};
export function meanFlight(distance,speed,acceleration,jerk){
 if([distance,speed,acceleration,jerk].some(v=>!Number.isFinite(v)||v<=0))throw Error('Distância, velocidade, aceleração e jerk devem ser positivos e finitos.');
 const transitionSpeed=acceleration*acceleration/jerk;
 const accelerationTime=v=>v<=transitionSpeed?2*Math.sqrt(v/jerk):v/acceleration+acceleration/jerk;
 const fullSpeedDistance=speed*accelerationTime(speed);
 let peakSpeed=speed,regime='full-speed';
 if(distance<fullSpeedDistance){
  const accelerationDistance=2*acceleration**3/jerk**2;
  if(distance<=accelerationDistance){peakSpeed=Math.pow(distance*Math.sqrt(jerk)/2,2/3);regime='jerk-limited';}
  else{const b=acceleration*acceleration/jerk;peakSpeed=2*acceleration*distance/(Math.sqrt(b*b+4*acceleration*distance)+b);regime='acceleration-limited';}
 }
 peakSpeed=Math.min(speed,peakSpeed);
 const ramp=accelerationTime(peakSpeed),time=distance/peakSpeed+ramp,cruiseDistance=Math.max(0,distance-peakSpeed*ramp);
 if(!Number.isFinite(time)||time<=0)throw Error('Os parâmetros excedem a precisão disponível para o deslocamento médio.');
 return {distance,time,peakSpeed,peakAcceleration:Math.min(acceleration,Math.sqrt(peakSpeed*jerk)),fullSpeedDistance,cruiseDistance,regime,reachesNominal:regime==='full-speed'};
}
export function calculateStarts(study,groups,required){
 const capacity=groups.reduce((sum,g)=>sum+g.manufacturer.capacity,0),hasDemandAllocation=study.commonService,peakPeoplePerHour=hasDemandAllocation?required*12:null;
 const rows=groups.map((calculated,i)=>{
  const g=study.groups[i],departuresPerCycle=calculated.stops,averageDistance=2*g.travel/departuresPerCycle,flight=meanFlight(averageDistance,g.speed,g.acceleration,g.jerk);
  const door=g.open+g.close-(g.preOpeningEnabled?g.preOpening||0:0),passenger=g.transferMode==='per-stop'?g.transferPerStop:g.capacity*g.passenger/departuresPerCycle,allowance=.1*(door+passenger),startDelay=g.start/departuresPerCycle,dwell=study.operation.dwell;
  const averageTime=flight.time+door+passenger+allowance+startDelay+dwell;
  const maximumByTime=3600/averageTime,manufacturerLimit=g.startsLimit||null,maximumAdopted=manufacturerLimit===null?maximumByTime:Math.min(maximumByTime,manufacturerLimit);
  const demandShare=hasDemandAllocation?calculated.manufacturer.capacity/capacity:null,demandPeoplePerHour=hasDemandAllocation?peakPeoplePerHour*demandShare:null;
  const requiredCyclesPerHour=hasDemandAllocation?demandPeoplePerHour/g.capacity:null,requiredGroup=hasDemandAllocation?requiredCyclesPerHour*departuresPerCycle:null,requiredPerCar=hasDemandAllocation?requiredGroup/g.count:null;
  const timePass=hasDemandAllocation?requiredPerCar<=maximumByTime+1e-9:null,manufacturerPass=hasDemandAllocation&&manufacturerLimit!==null?requiredPerCar<=manufacturerLimit+1e-9:null,pass=hasDemandAllocation?requiredPerCar<=maximumAdopted+1e-9:null;
  return {id:g.id,label:g.label,count:g.count,departuresPerCycle,averageFloorHeight:g.travel/(g.stops-1),averageDistance,flight,door,passenger,allowance,startDelay,dwell,averageTime,cycleTimeForStarts:averageTime*departuresPerCycle,cycleFab:calculated.manufacturer.total,startsByFabCycle:3600*departuresPerCycle/calculated.manufacturer.total,maximumByTime,manufacturerLimit,maximumAdopted,maximumGroup:maximumAdopted*g.count,demandShare,demandPeoplePerHour,requiredCyclesPerHour,requiredGroup,requiredPerCar,timePass,manufacturerPass,pass,utilization:hasDemandAllocation?100*requiredPerCar/maximumAdopted:null};
 });
 const totalRequired=hasDemandAllocation?rows.reduce((sum,g)=>sum+g.requiredGroup,0):null,totalMaximum=rows.reduce((sum,g)=>sum+g.maximumGroup,0),pass=hasDemandAllocation?rows.every(g=>g.pass):null;
 const warnings=[];
 for(const [i,g] of rows.entries()){
  if(g.pass===false)warnings.push(`Grupo ${i+1}: partidas necessárias estimadas superiores ao máximo adotado para cada elevador. Revise quantidade, tempos e limite do fabricante.`);
  if(!g.flight.reachesNominal)warnings.push(`Grupo ${i+1}: velocidade nominal não atingida no percurso médio; a estimativa de partidas usa perfil limitado pela distância, aceleração e jerk.`);
 }
 return {methodVersion:STARTS_METHOD_VERSION,hasDemandAllocation,peakPeoplePerHour,rows,totalRequired,totalMaximum,pass,allLimitsProvided:rows.every(g=>g.manufacturerLimit!==null),warnings};
}
