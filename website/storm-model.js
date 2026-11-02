/* Educational storage model: NOT an operational forecast or inundation model. */
(function(root){'use strict';
const A=150e6,B=12e6,C=200e6,limits=[2.8,2.2],durations={europoort:2,haring:.5,ijssel:1};
const clamp=(x,a,b)=>Math.min(b,Math.max(a,x));
function forcing(t,known=true){const extension=known?0.65*Math.exp(-Math.pow((t-28)/6,2)):0;const sea=.85*Math.cos(2*Math.PI*(t-5)/12.42)+3.0*Math.exp(-Math.pow((t-19)/8,2))+extension;const waal=3600+2200*Math.exp(-Math.pow((t-27)/9,2)),lek=500+300*Math.exp(-Math.pow((t-29)/9,2)),maas=900+1200*Math.exp(-Math.pow((t-25)/7,2));return {sea,waal,lek,maas,q:waal+lek+maas,local:75};}
function initial(){return {t:0,h:.8,j:.65,stored:0,ready:0,preparing:false,warning:false,evac:false,cost:0,gates:{europoort:1,haring:1,ijssel:1},target:{europoort:1,haring:1,ijssel:1},store:false,history:[],log:[],max:[.8,.65],exposure:[0,0],closedHours:0,seaIn:0,actions:0};}
function command(s,key,value){const n={...s,gates:{...s.gates},target:{...s.target},log:s.log.slice()};if(Object.hasOwn(durations,key)){if(n.target[key]===value)return s;n.target[key]=value;n.cost+=key==='europoort'?18000:5000;}else if(key==='prepare'){if(n.preparing)return s;n.preparing=true;n.cost+=25000;}else if(key==='store'){n.store=!!value;}else if(key==='warning'){if(n.warning)return s;n.warning=true;n.cost+=10000;}else if(key==='evac'){if(n.evac)return s;n.evac=true;n.cost+=100000;}else return s;n.actions++;n.log.push({t:s.t,key,value});return n;}
function step(s){if(s.t>=48)return s;let n={...s,gates:{...s.gates},target:{...s.target},history:s.history.slice(),max:s.max.slice(),exposure:s.exposure.slice()};let sums={q:0,sea:0,europoort:0,haring:0,ijssel:0,storage:0,local:0};
for(let k=0;k<12;k++){let dt=300,f=forcing(n.t+(k+.5)/12,true);for(let id in durations){const diff=n.target[id]-n.gates[id];n.gates[id]+=Math.sign(diff)*Math.min(Math.abs(diff),1/12/durations[id]);}
if(n.preparing)n.ready=Math.min(4,n.ready+1/12);
const e=clamp(6500*(n.h-f.sea),-22000,22000)*n.gates.europoort,h=clamp(8500*(n.h-f.sea),-22000,22000)*n.gates.haring,j=clamp(1500*(n.h-n.j),-1800,1800)*n.gates.ijssel;
const vHead=n.stored/87e6;const storage=n.store&&n.ready>=4-1e-8?Math.min(2800,Math.max(0,(n.h-vHead)*2000),(C-n.stored)/dt):0;
n.h+=(f.q-e-h-j-storage)*dt/A;n.j+=(f.local+j)*dt/B;n.stored+=storage*dt;
n.max[0]=Math.max(n.max[0],n.h);n.max[1]=Math.max(n.max[1],n.j);n.exposure[0]+=Math.max(0,n.h-limits[0])/12;n.exposure[1]+=Math.max(0,n.j-limits[1])/12;
n.closedHours+=(1-n.gates.europoort)/12;n.seaIn+=Math.max(0,-e-h)*dt;
const row={q:f.q,sea:f.sea,europoort:e,haring:h,ijssel:j,storage,local:f.local};for(let id in sums)sums[id]+=row[id]/12;
}n.t++;n.history.push({t:n.t,h:n.h,j:n.j,stored:n.stored,...sums});return n;}
function forecast(s){return Array.from({length:7},(_,i)=>({t:s.t+i,...forcing(s.t+i,s.t>=18)}));}
function result(s){const safe=s.exposure.every(x=>x<1e-8),recovered=s.h<1.6&&s.j<1.5;let score=Math.round((safe?700:Math.max(0,500-60*(s.exposure[0]+s.exposure[1])))+(recovered?100:0)+(s.warning?50:0)+Math.max(0,100-s.closedHours*2)+Math.max(0,50-s.cost/10000));return {safe,recovered,success:s.t===48&&safe&&recovered,score};}
root.StormModel={A,B,C,limits,durations,forcing,initial,command,step,forecast,result};
})(typeof window==='undefined'?globalThis:window);
