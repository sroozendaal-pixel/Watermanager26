(function(root){
const D=typeof require==='function'?require('./data.js'):root.MaasData,dt=3600,base=[450,530,610,650],k=[4,4,5,6];
const gauges=[{name:'Zuidelijke Maas',stage:1,width:880,limit:6.8},{name:'Noord-Limburg',stage:2,width:900,limit:6.8},{name:'Ravenstein–Lith',stage:3,width:930,limit:6.8}];
function initial(){return {t:0,s:k.map((v,i)=>base[i]*(v-1)*dt),stores:{},history:[],input:0,output:0,maxError:0,events:[]};}
const pulse=(t,c,w,p)=>Math.max(0,1-Math.abs(t-c)/w)*p;
function rain(t,scenario){let sc=D.scenarios[scenario];return [pulse(t,16,11,3400)*sc.intensity,pulse(t,27,9,1050)*sc.second*sc.intensity,pulse(t,23,10,180)*sc.intensity,pulse(t,21,11,80)*sc.intensity];}
function total(s){return s.s.reduce((a,b)=>a+b,0)+Object.values(s.stores).reduce((a,b)=>a+b,0);}
function evaluate(plan,scenario){return plan.map(x=>{const q=D.quote(x.areaId,x.measureId,x.packageId,scenario);if(x.pps&&x.areaId==='plassen'&&x.measureId==='retention'){q.scale*=.85;q.eco-=1;q.support=Math.max(0,q.support-8);}return {...x,...q,key:x.areaId};});}
function step(s,plan=[],controls={},scenario='rain'){
let ops=evaluate(plan,scenario),t=s.t,before=total(s),r=rain(t,scenario),inputs=r.map((v,i)=>v+(i===0?450:i===1?80:i===2?80:40));
const inputTotal=inputs.reduce((a,b)=>a+b,0),flow=[],levels=[],limits=[];let q=0;
for(let i=0;i<4;i++){
 let local=inputs[i];for(const op of ops.filter(o=>o.area.stage===i&&o.measure.type==='hold')){let key=op.key,stored=s.stores[key]||0,cap=(op.measure.volume||14e6)*op.scale;let add=Math.min(Math.max(0,local-(i===0?450:40))*.42*dt,Math.max(0,cap-stored));stored+=add;local-=add/dt;let rel=Math.min(stored,stored/(op.measure.delay?op.measure.delay+8:70));stored-=rel;local+=rel/dt;s.stores[key]=stored;}
 for(const op of ops.filter(o=>o.area.stage===i&&o.measure.id==='beeks')){let stored=s.stores[op.key]||0,cap=op.measure.volume*op.scale;let add=Math.min(Math.max(0,local-300)*.65*dt,Math.max(0,cap-stored));stored+=add;local-=add/dt;if(t>=56||local<200){let rel=Math.min(stored,60*dt);stored-=rel;local+=rel/dt;}s.stores[op.key]=stored;}
 q+=local;s.s[i]+=q*dt;q=s.s[i]/k[i]/dt;s.s[i]-=q*dt;
 for(const op of ops.filter(o=>o.area.stage===i&&o.measure.id==='retention')){let key=op.key,stored=s.stores[key]||0,cap=op.measure.volume*op.scale;let gate=op.measure.id==='beeks'?q>1250:!!controls[key];if(gate){let add=Math.min(Math.max(0,q-650)*.5*dt,420*op.scale*dt,Math.max(0,cap-stored));stored+=add;q-=add/dt;}else if(t>=56||op.measure.id==='beeks'&&q<1000){let rel=Math.min(stored,85*dt);stored-=rel;q+=rel/dt;}s.stores[key]=stored;}
 flow.push(q);
}
for(const g of gauges){let width=g.width,defense=0;for(const op of ops.filter(o=>o.area.stage===g.stage)){if(op.measure.width)width+=op.measure.width*op.scale*(op.measure.id==='highchannel'?Math.max(0,Math.min(1,(flow[g.stage]-900)/600)):1);if(op.measure.defense)defense+=op.measure.defense*op.scale;}
 levels.push(4+flow[g.stage]/width);limits.push(g.limit+defense);}
s.input+=inputTotal*dt;s.output+=q*dt;const error=Math.abs(total(s)-before-(inputTotal-q)*dt);s.maxError=Math.max(s.maxError,error);
s.history.push({t,rain:r.reduce((a,b)=>a+b,0),flow,levels,limits,stores:{...s.stores},controls:{...controls}});s.t++;return s;
}
function run(plan=[],scenario='rain',controlFn=()=>({})){let s=initial();for(let i=0;i<120;i++)step(s,plan,controlFn(i),scenario);return s;}
function result(s,plan,scenario,finance=null){let ops=evaluate(plan,scenario);const peaks=gauges.map((g,i)=>{let peak=s.history.reduce((a,b)=>a.flow[g.stage]>b.flow[g.stage]?a:b);return {name:g.name,maxQ:peak.flow[g.stage],peakTime:peak.t,maxH:Math.max(...s.history.map(h=>h.levels[i])),limit:s.history[0]?.limits[i]||g.limit,unsafe:s.history.filter(h=>h.levels[i]>h.limits[i]).length};});
let maxExceed=Math.max(0,...peaks.map(p=>p.maxH-p.limit)),unsafe=peaks.reduce((a,p)=>a+p.unsafe,0),safe=unsafe===0,band=safe?2:maxExceed<=.5?1:0,cost=ops.reduce((a,o)=>a+o.cost,0),support=ops.length?ops.reduce((a,o)=>a+o.support,0)/ops.length:100,eco=ops.reduce((a,o)=>a+o.eco,0);let within=Math.round(Math.max(0,130-unsafe*3)+support*.55+Math.max(0,D.scenarios[scenario].budget-(finance?finance.netPublicCost:cost))/D.scenarios[scenario].budget*70+Math.max(0,Math.min(40,eco*5+20)));let score=band*350+Math.min(300,within);return {peaks,maxH:Math.max(...peaks.map(p=>p.maxH)),maxQ:Math.max(...peaks.map(p=>p.maxQ)),unsafe,safe,score,cost,support,eco,band,remaining:total(s)};}
const api={initial,step,run,result,rain,evaluate,gauges,total};root.WaterModel=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
