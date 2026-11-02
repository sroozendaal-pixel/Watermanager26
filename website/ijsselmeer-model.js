/* Transparent two-basin teaching model. Scenario series are NOT observations. */
(function(root){
const areas=[1.1e9,7e8], names=['Landbouw','Veen en natuur','Verzilting','Drinkwater'];
function weather(day){return {q:day<5?420-day*30:day<10?260-(day-5)*30:Math.max(55,110-(day-10)*3),rain:day<5?8:day<10?2:0,evap:day<5?1.5:day<10?2.5:4.5,surge:day<2?1.1:day<5?.35:0};}
function demands(day){let k=day<5?.3:day<10?.65:1;return [90*k,35*k,25*k,5];}
function initial(){return {day:0,h:[-.22,-.22],cost:0,history:[],short:[0,0,0,0],asked:[0,0,0,0],outOfBand:0};}
function step(s,c){if(s.day>=30)return s;let w=weather(s.day),d=demands(s.day),h=s.h.slice(),sum={pump:0,spui:0,transfer:0,delivered:[0,0,0,0],rain:0,evap:0,inflow:0},budget=0;
for(let t=0;t<24;t++) {const sea=w.surge+.85*Math.sin(2*Math.PI*(s.day*24+t)/12.42)-.25;
const spui=c.spui&&h[0]>sea?Math.min(500,500*Math.sqrt((h[0]-sea)/1.2)):0;
const pump=Math.min(275,Math.max(0,c.pump));
// Gravity transfer, bidirectional if enabled; educational conductance and cap.
const transfer=c.link?Math.sign(h[0]-h[1])*Math.min(80,800*Math.abs(h[0]-h[1])):0;
const delivered=d.map((v,i)=>v*Math.max(0,Math.min(100,c.alloc[i]))/100);
const take=[delivered[0]*.6+delivered[1]*.6+delivered[3],delivered[0]*.4+delivered[1]*.4+delivered[2]];
// Stop withdrawals from a basin below the illustrative intake threshold.
for(let b=0;b<2;b++) if(h[b]<-.5){for(let i=0;i<4;i++){const share=i===2?(b===1?1:0):i===3?(b===0?1:0):(b===0?.6:.4);delivered[i]-=d[i]*c.alloc[i]/100*share;}take[b]=0;}
h[0]+=(w.q-pump-spui-transfer-take[0])*3600/areas[0]+(w.rain-w.evap)/24000;
h[1]+=(transfer-take[1])*3600/areas[1]+(w.rain-w.evap)/24000;
const head=Math.max(.3,sea-h[0]);budget+=1000*9.81*pump*head/.8/1000*.25; // kW x 1h x EUR/kWh
sum.pump+=pump/24;sum.spui+=spui/24;sum.transfer+=transfer/24;delivered.forEach((v,i)=>sum.delivered[i]+=v/24);
}
sum.inflow=w.q;sum.rain=w.rain/1000*(areas[0]+areas[1])/86400;sum.evap=w.evap/1000*(areas[0]+areas[1])/86400;
let row={day:s.day+1,h:h.slice(),...sum,weather:w,demand:d,c:{...c,alloc:c.alloc.slice()}};
return {day:s.day+1,h,cost:s.cost+budget,history:[...s.history,row],short:s.short.map((v,i)=>v+d[i]-sum.delivered[i]),asked:s.asked.map((v,i)=>v+d[i]),outOfBand:s.outOfBand+(h.some(v=>v>-.1||v<-.3)?1:0)};
}
root.IJModel={areas,names,weather,demands,initial,step};
})(typeof window==='undefined'?globalThis:window);
