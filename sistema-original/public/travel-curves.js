import {meanFlight,STARTS_SOURCES} from './starts.js';

export const TRAVEL_CURVES_VERSION='1';
export const TRAVEL_CURVES_SOURCE=STARTS_SOURCES.kinematics;
const finitePositive=x=>typeof x==='number'&&Number.isFinite(x)&&x>0;
const advance=(p,dt,j)=>({time:p.time+dt,distance:p.distance+p.speed*dt+p.acceleration*dt*dt/2+j*dt**3/6,speed:p.speed+p.acceleration*dt+j*dt*dt/2,acceleration:p.acceleration+j*dt});

// Exact integration of the same ideal jerk-limited profile used by meanFlight.
// Sampling is solely for drawing; it never determines a travel time or capacity.
export function motionProfile(distance,speed,acceleration,jerk){
 const flight=meanFlight(distance,speed,acceleration,jerk),peak=flight.peakSpeed;
 const tj=Math.min(acceleration/jerk,Math.sqrt(peak/jerk)),ta=Math.max(0,peak/(jerk*tj)-tj),tc=flight.cruiseDistance/peak;
 const definitions=[[tj,jerk,'Aceleração'],[ta,0,'Aceleração'],[tj,-jerk,'Aceleração'],[tc,0,'Velocidade constante'],[tj,-jerk,'Retardamento'],[ta,0,'Retardamento'],[tj,jerk,'Retardamento']];
 let current={time:0,distance:0,speed:0,acceleration:0};const phases=[];
 for(const [duration,j,label] of definitions){if(duration<=0)continue;const start={...current};current=advance(start,duration,j);phases.push({start,end:{...current},duration,jerk:j,label});}
 const points=[{time:0,distance:0,speed:0,acceleration:0}];
 for(const phase of phases)for(let i=1;i<=16;i++){const point=advance(phase.start,phase.duration*i/16,phase.jerk);points.push({...point,speed:Math.max(0,point.speed),distance:Math.min(distance,Math.max(0,point.distance))});}
 points[points.length-1]={time:flight.time,distance,speed:0,acceleration:0};
 return {...flight,phases,points,accelerationDuration:2*tj+ta,cruiseDuration:tc,decelerationDuration:2*tj+ta};
}

export function motionAt(profile,time){
 if(time<=0)return {time:0,distance:0,speed:0,acceleration:0};
 if(time>=profile.time)return {time:profile.time,distance:profile.distance,speed:0,acceleration:0};
 const phase=profile.phases.find(p=>time<=p.end.time);
 return advance(phase.start,time-phase.start.time,phase.jerk);
}

function journey(g,distance,stops,settings){
 const motion=motionProfile(distance,g.speed,g.acceleration,g.jerk),doorTime=g.open+g.close-settings.preOpening;
 const transferTime=g.transferMode==='per-stop'?g.transferPerStop:settings.passengers*g.passenger*settings.transferDirections;
 const allowance=settings.allowanceRate*(doorTime+transferTime);
 const movementStart=g.close+settings.startDelay,movementEnd=movementStart+motion.time;
 // A pre-opening overlap is shown only if it fits inside the movement and opening.
 // Unsupported timing does not change the traffic model's previously valid RTT.
 if(settings.preOpening>Math.min(motion.time,g.open))return {available:false,kind:stops===2?'consecutive':'extremes',distance,stops,error:'A pré-abertura excede o movimento ou a abertura desta viagem. Revise os tempos para representar uma curva física.'};
 const openingStart=movementEnd-settings.preOpening,openingEnd=openingStart+g.open;
 const performance=openingEnd+settings.closingDelay,total=performance+transferTime+allowance+settings.dwell;
 if(!finitePositive(total))throw Error('O tempo total da viagem não pôde ser calculado.');
 const maximumByTime=3600/total,manufacturerLimit=g.startsLimit>0?g.startsLimit:null;
 const phases=[{label:'Fechamento',start:0,end:g.close,kind:'door'},
  {label:'Atraso inicial',start:g.close,end:movementStart,kind:'wait'},
  {label:'Aceleração',start:movementStart,end:movementStart+motion.accelerationDuration,kind:'move'},
  {label:'Velocidade constante',start:movementStart+motion.accelerationDuration,end:movementEnd-motion.decelerationDuration,kind:'move'},
  {label:'Retardamento',start:movementEnd-motion.decelerationDuration,end:movementEnd,kind:'move'},
  {label:'Abertura',start:openingStart,end:openingEnd,kind:'door'},
  {label:'Atraso de fechamento',start:openingEnd,end:performance,kind:'wait'},
  {label:'Passageiros, adicional e permanência',start:performance,end:total,kind:'wait'}].filter(p=>p.end>p.start+1e-10);
 return {available:true,stops,distance,motion,doorTime,transferTime,allowance,startDelay:settings.startDelay,closingDelay:settings.closingDelay,preOpening:settings.preOpening,dwell:settings.dwell,passengersUsed:settings.passengers,movementStart,movementEnd,openingStart,openingEnd,withDoors:motion.time+doorTime,performance,total,maximumByTime,manufacturerLimit,maximumAdopted:manufacturerLimit===null?maximumByTime:Math.min(maximumByTime,manufacturerLimit),phases};
}

export function calculateGroupTravel(g,{model='nbr5665',probableStops=1,dwell=0,passengers=g.capacity,averageDistance=2*g.travel/probableStops}={}){
 if(!Number.isInteger(g.stops)||g.stops<2||!finitePositive(g.travel)||['speed','acceleration','jerk','open','close',g.transferMode==='per-stop'?'transferPerStop':'passenger'].some(k=>!finitePositive(g[k])))throw Error('Informe paradas, percurso, velocidade, aceleração, jerk e tempos positivos para visualizar as curvas.');
 const iso=model==='iso8100',p=g.iso||{},settings={passengers,transferDirections:iso?2:1,allowanceRate:iso?0:.1,startDelay:iso?p.startDelay:(g.start||0)/probableStops,closingDelay:iso?p.closingDelay:0,preOpening:g.preOpeningEnabled?g.preOpening||0:iso?p.preOpening:0,dwell:iso?0:dwell};
 if(Object.values(settings).some(x=>!Number.isFinite(x)||x<0)||!finitePositive(probableStops))throw Error('Premissas de portas, passageiros ou permanência inválidas.');
 const inputs={transferMode:g.transferMode||'per-person',transferPerStop:g.transferMode==='per-stop'?g.transferPerStop:null,stops:g.stops,travel:g.travel,speed:g.speed,acceleration:g.acceleration,jerk:g.jerk,open:g.open,close:g.close,passenger:g.passenger,passengers,transferDirections:settings.transferDirections};
 return {version:TRAVEL_CURVES_VERSION,model,base:iso?(p.source==='table'?'Tabelas do documento ISO informado':'Fabricante / premissas ISO'):'Fabricante / premissas de movimento NBR',inputs,settings,extremes:journey(g,g.travel,g.stops,settings),consecutive:journey(g,g.travel/(g.stops-1),2,settings),average:{...journey(g,averageDistance,probableStops,{...settings,passengers:passengers/probableStops}),probableStops}};
}
