/* Paired process diagrams: illustrative, never a second hydraulic simulation. */
(function(root){
'use strict';
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clamp=n=>Math.max(0,Math.min(1,n)), lerp=(a,b,t)=>a+(b-a)*t;
const rect=(x,y,w,h,fill,extra='')=>`<rect x="${x}" y="${y}" width="${w}" height="${Math.max(0,h)}" fill="${fill}" ${extra}/>`;
const path=(d,color,width=3,extra='')=>`<path d="${d}" fill="none" stroke="${color}" stroke-width="${width}" ${extra}/>`;
const label=(x,y,s,extra='')=>`<text x="${x}" y="${y}" font-size="14" fill="#24443f" ${extra}>${esc(s)}</text>`;
const dots=(x1,y1,x2,y2,p,count=5)=>Array.from({length:count},(_,i)=>{const t=(p*1.6+i/count)%1;return `<circle cx="${lerp(x1,x2,t)}" cy="${lerp(y1,y2,t)}" r="3" fill="#087db2"/>`;}).join('');
const desc={
 soil:['Bodemherstel','Regen kan beter infiltreren. Een deel blijft tijdelijk in de bodem en stroomt later af.'],
 forest:['Bosherstel','Bodembedekking en een betere bodemstructuur remmen snelle afstroming. Verzadiging beperkt het effect.'],
 depave:['Ontstenen','Verharding maakt plaats voor doorlatende bodem en lokale opvang. Regen bereikt de rivier minder snel.'],
 brook:['Beekherstel','Meer ruimte en kleine stuwen vertragen water in het beekdal. Dit is geen afsluiting van de Maas.'],
 beeks:['Beekberging','Bij hoge beekafvoer vult de laagte automatisch. Later keert het opgeslagen water geleidelijk terug.'],
 retention:['Regelbare berging','De inlaat stuurt water naar het bekken. Het bekken kan vol raken; later wordt het water teruggegeven.'],
 channel:['Nevengeul','De aanvoer verdeelt zich over twee stroomroutes. Meer doorstroomruimte kan de waterstand verlagen.'],
 highchannel:['Hoogwatergeul','Bij lage afvoer blijft de extra route droog. Pas bij hoogwater gaat de geul meestromen.'],
 lower:['Uiterwaardverlaging','De lagere uiterwaard loopt eerder onder en stroomt mee. Het rivierprofiel biedt meer ruimte.'],
 relocate:['Dijkverlegging','De dijk schuift landinwaarts. Het winterbed wordt breder en bestaand landgebruik moet ruimte maken.'],
 krib:['Kribverlaging','Lagere kribben geven bij hoogwater minder weerstand. De rivier krijgt meer doorstroomruimte.'],
 obstacle:['Doorstroomknelpunt','Een smaller obstakel laat meer ruimte over. De opstuwing kan daardoor afnemen.'],
 bed:['Zomerbedverdieping','Een dieper zomerbed vergroot het doorstroomprofiel. Dit kan ook grondwater en ecologie beïnvloeden.'],
 dike:['Dijkversterking','De hogere en bredere dijk biedt meer bescherming. De rivierwaterstand en het debiet dalen hierdoor niet.']
};
function scene(op,p,withMeasure,scenario){
 const id=op.measure.id, active=withMeasure&&op.suitable, build=clamp(p/.22), strength=active?clamp(op.scale):0, pulse=Math.sin(Math.PI*clamp((p-.2)/.8)), wet=scenario==='wet';
 let s=rect(0,0,420,280,'#f3f8f6');
 if(['soil','forest','depave'].includes(id)){
  const ground=142, absorb=active?.12+strength*.65:.08;
  s+=rect(0,ground,420,138,'#c7b296')+rect(0,ground,420,10,'#7fa77c');
  if(id==='depave')s+=rect(20,ground-4,active?230*(1-build):280,10,'#697c84');
  if(id==='forest')s+=rect(25,ground,260,active?8*build:0,'#496c41')+label(25,205,active?'Bodembedekking en wortelzone':'Weinig bodembedekking');
  if(id==='soil')s+=label(25,205,active?'Doorlatender bodem':'Bodem met beperkte infiltratie');
  if(id==='depave')s+=label(25,205,active?'Minder verhard oppervlak':'Verhard oppervlak');
  for(let i=0;i<12;i++){let x=28+i*25,y=30+((p*500+i*23)%108);if(p<.66)s+=path(`M${x} ${y}l-3 10`,'#439bc2',2);}
  s+=rect(26,156,270,70*absorb*(p<.65?clamp(p/.65):1-(p-.65)*.8),'#4eacc4','opacity=".4"');
  if(p>.18&&p<.72)for(let i=0;i<Math.round(absorb*12);i++)s+=dots(42+i*36,149,42+i*36,198,p,2);
  s+=path('M20 136H315L365 170','#318aaf',active?3+5*(1-absorb):9)+dots(40,135,310,135,p*(active?.6:1),active?3:6);
  s+=rect(325,170,95,80,'#79bfd1')+label(340,263,'Beek');
  if(p>.68&&active)s+=path('M230 227H355V212','#147b9e',3)+dots(230,226,350,226,p,3);
  s+=label(22,25,p<.66?'Dezelfde regenbui':'Na de bui: vertraagde afgifte');
  if(withMeasure&&wet)s+=label(22,239,'Natte bodem: weinig extra opslag');
 }else if(id==='brook'){
  s+=rect(0,35,420,205,'#e0ead4');
  const d=active?'M15 95C90 20 85 190 170 120S255 50 290 140S365 180 410 130':'M15 95L410 130';
  s+=path(d,'#72b8d1',22)+path(d,'#fff',2,'stroke-dasharray="5 18" stroke-dashoffset="'+(-p*(active?90:240))+'"');
  if(active)s+=path('M172 106l8 30','#8b7959',5)+path('M285 125l-8 22','#8b7959',5);
  s+=label(20,25,'Bovenaanzicht · water naar de Maas');
  s+=label(20,233,active?'Langere verblijftijd in het beekdal':'Snellere afstroming');
  s+=label(20,263,active?'Kleine stuwen; water blijft doorstromen':'Zelfde toevoer van bovenstrooms');
 }else if(id==='retention'||id==='beeks'){
  const fill=p<.25?0:p<.65?(p-.25)/.4:1-(p-.65)/.35, cap=active?1:0, top=208-fill*75*cap;
  s+=rect(0,45,420,50,'#6cb6d0')+path('M0 70H420','#fff',2,'stroke-dasharray="6 22" stroke-dashoffset="'+(-p*220)+'"');
  s+=active?rect(170,126,210,82,'#d7d0ad')+path('M170 126V208H380V126','#7e8267',4):rect(170,126,210,82,'#dce7cd');
  if(active){s+=rect(175,top,200,208-top,'#5ca9c9','opacity=".85"');s+=path('M202 95V145','#74b6c7',14);if(id==='retention')s+=path(p<.25||p>.65?'M192 109H212':'M192 109V93','#9b6936',5);
  if(p>.25&&p<.65)s+=dots(202,98,202,150,p,4);if(p>.65)s+=dots(240,145,240,93,p*.6,3);
  if(op.pps)s+=rect(345,128,30,77,'#d5a25f')+label(333,225,'PPS');}
  s+=label(16,30,id==='beeks'?'Beek · automatische overloop':'Maas · regelbare inlaat');
  s+=label(175,249,active?'Tijdelijke wateropslag':'Geen extra opvangbekken');
  s+=label(16,275,p<.25?'1 · Aanvoer stijgt':p<.65?'2 · Opvangen en vullen':'3 · Geleidelijk teruggeven');
 }else if(id==='channel'||id==='highchannel'||id==='obstacle'){
  const side=active&&(id==='channel'||id==='highchannel'&&pulse>.5);
  s+=rect(0,30,420,210,'#e1ead4');
  s+=path('M10 150H410','#69b6cc',42)+path('M10 150H410','#fff',2,'stroke-dasharray="8 22" stroke-dashoffset="'+(-p*220)+'"');
  if(id==='obstacle'){
   const w=active?lerp(42,14,build):42;s+=rect(185,110,w,62,'#927d65');s+=path(`M30 125H175`,'#267b9c',active?3:7);s+=label(20,218,active?'Vernauwing verruimd':'Knelpunt veroorzaakt opstuwing');
  }else{
   const d='M45 150C115 20 305 20 375 150';
   if(active){s+=path(d,side?'#62adcb':'#b8b9a0',18);if(side)s+=path(d,'#fff',2,'stroke-dasharray="6 17" stroke-dashoffset="'+(-p*220)+'"');}
   s+=label(100,30,active?(id==='highchannel'&&!side?'Extra route nog droog':'Extra stroomroute'):'Eén stroomroute');
   s+=label(22,220,id==='highchannel'?(pulse>.5?(side?'Hoogwater: extra route stroomt mee':'Hoogwater: alleen de hoofdgeul'):'Lage afvoer: hoofdgeul voert af'):'Dezelfde totale rivieraanvoer');
  }
  s+=label(20,265,'Bovenaanzicht · pijlen/streepjes: stroming');
 }else{
  // Cross sections use exactly equal inflow; water-level differences are explanatory, not metres.
  let left=75,right=345,bed=220,flood=160,crest=108;
  if(active&&id==='relocate')left=lerp(75,30,build);
  if(active&&id==='lower')flood=lerp(160,184,build);
  if(active&&id==='bed')bed=lerp(220,250,build);
  if(active&&id==='dike')crest=lerp(108,77,build);
  const terrain=`M0 175L${left-20} 175L${left} ${crest}L${left+20} ${flood}L160 ${flood}L180 ${bed}L260 ${bed}L280 ${flood}L${right-20} ${flood}L${right} ${crest}L${right+20} 175H420V280H0Z`;
  const y=190-65*pulse+(active&&id!=='dike'?20*strength*build:0);
  // Draw water first, then the ground masks its lower edge into the actual cross section.
  s+=rect(left+10,y,right-left-20,270-y,'#70b9d2','opacity=".8"')+`<path d="${terrain}" fill="#b6c49c" stroke="#7e8d6b" stroke-width="2"/>`;
  const wx=y>=flood?160+20*(y-flood)/(bed-flood):left+20;const wr=y>=flood?280-20*(y-flood)/(bed-flood):right-20;s+=path(`M${wx} ${y}H${wr}`,'#157da3',3);
  if(id==='krib'){const h=active?12:34;s+=rect(155,190-h,14,h,'#857b68');s+=label(18,39,active?'Lagere krib: minder weerstand':'Krib steekt hoger uit');}
  else if(id==='relocate'){s+=rect(25,182,50,17,'#d2ad62','opacity="'+(active?1-build:1)+'"');s+=label(15,35,active?'Dijk landinwaarts; breder winterbed':'Bestaande dijk en landgebruik');}
  else if(id==='lower')s+=label(18,35,active?'Uiterwaard lager; eerder meestromend':'Hogere uiterwaard');
  else if(id==='bed')s+=label(18,35,active?'Dieper zomerbed':'Bestaand zomerbed');
  else if(id==='dike')s+=label(18,35,active?'Hogere dijk; dezelfde waterstand':'Bestaande beschermingshoogte');
  s+=path(`M10 ${crest}H410`,'#ae703e',1.5,'stroke-dasharray="5 5"')+label(18,67,'Bruine stippellijn: dijkhoogte');
  s+=label(155,272,'Dwarsdoorsnede');
 }
 if(withMeasure&&!op.suitable)s+=rect(10,92,400,48,'#fff3d9','rx="8"')+label(22,112,'Fysieke voorwaarden ontbreken')+label(22,131,'Geen extra waterkundig effect');
 return `<svg font-family="Arial, sans-serif" viewBox="0 0 420 280" role="img" aria-label="${esc((withMeasure?'Met jouw maatregel: ':'Zonder maatregel: ')+desc[id][0])}">${s}</svg>`;
}
let session=null;
function stop(){if(session){cancelAnimationFrame(session.frame);session=null;}}
function open(options){
 stop();let index=0,p=0,playing=false,last=0,frame=0;
 const reduced=!!root.matchMedia?.('(prefers-reduced-motion: reduce)').matches,ops=options.ops;
 if(!ops.length){options.done();return;}
 const finish=()=>{stop();options.close();options.done();};
 function screen(){
  stop();
  const op=ops[index],id=op.measure.id;
  options.modal('ZO WERKT JOUW PLAN · '+(index+1)+' / '+ops.length,
   '<div class="process-tour"><span class="eyebrow">'+esc(op.area.name)+'</span><h2>'+esc(op.measure.name)+'</h2><p>'+esc(desc[id][1])+'</p><div class="process-pair"><section><h3>Zonder maatregel</h3><div id="processBefore"></div></section><section><h3>Met jouw maatregel</h3><div id="processAfter"></div></section></div><p class="process-caption" id="processCaption" aria-live="polite"></p>'+(!op.suitable?'<p class="notice">Deze keuze past niet bij het oefenprofiel. Je maakt wel kosten, maar krijgt hier geen waterkundig effect.</p>':options.scenario==='wet'&&op.measure.type==='hold'?'<p class="notice">De bodem is al nat. Er is minder ruimte voor extra infiltratie en opslag.</p>':'')+(op.pps?'<p class="notice">PPS: het oranje deel is voor recreatie. Daardoor is 15% minder bergingscapaciteit beschikbaar.</p>':'')+(id==='relocate'?'<p class="notice">Ruimte maken raakt hier: '+esc(op.area.land)+'. Grond en compensatie: '+esc(options.money(op.acquisition))+'.</p>':'')+'<label for="processTime">Bekijk een moment <span id="processSeconds"></span></label><input id="processTime" type="range" min="0" max="100" step="1" value="0"><div class="process-controls"><button id="processPlay">Pauzeren</button><button id="processReplay">Herhalen</button><button id="processPrev" '+(index===0?'disabled':'')+'>Vorige</button><button id="processNext" class="primary">'+(index===ops.length-1?'Naar de hoogwatergolf':'Volgende maatregel')+'</button><button id="processSkip">Uitleg overslaan</button></div><p class="process-note">Schematische procesuitleg, geen berekende waterstanden of werkelijke tijdschaal. Beide beelden krijgen dezelfde regen of rivieraanvoer. De kaart en grafiek hierna tonen het spelmodel.</p></div>');
  p=reduced?.5:0;playing=!reduced;last=0;session={frame:0};draw();
  document.getElementById('processPlay').onclick=()=>{if(p>=1)p=0;playing=!playing;last=0;draw();};
  document.getElementById('processReplay').onclick=()=>{p=0;playing=!reduced;last=0;draw();};
  document.getElementById('processTime').oninput=e=>{p=+e.target.value/100;playing=false;last=0;draw();};
  document.getElementById('processPrev').onclick=()=>{index--;screen();};
  document.getElementById('processNext').onclick=()=>{if(index<ops.length-1){index++;screen();}else finish();};
  document.getElementById('processSkip').onclick=finish;
  session.frame=requestAnimationFrame(tick);
 }
 function draw(){if(!session)return;const op=ops[index];document.getElementById('processBefore').innerHTML=scene(op,p,false,options.scenario);document.getElementById('processAfter').innerHTML=scene(op,p,true,options.scenario);document.getElementById('processTime').value=Math.round(p*100);document.getElementById('processSeconds').textContent='· '+(p*10).toFixed(1).replace('.',',')+' / 10 s';document.getElementById('processPlay').textContent=p>=1?'Opnieuw afspelen':playing?'Pauzeren':'Afspelen';const caption=p<.22?'1 · Bekijk de inrichting':p<.66?'2 · Regen of rivieraanvoer neemt toe':'3 · Bekijk wat het water daarna doet';const el=document.getElementById('processCaption');if(el.textContent!==caption)el.textContent=caption;}
 function tick(now){if(!session)return;if(playing){if(last)p=clamp(p+(now-last)/10000);if(p>=1)playing=false;draw();}last=now;session.frame=requestAnimationFrame(tick);}
 screen();
}
root.MaasAnimations={open,stop,scene,descriptions:desc};
})(typeof window!=='undefined'?window:globalThis);
