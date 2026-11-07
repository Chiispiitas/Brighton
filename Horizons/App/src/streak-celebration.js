import {motionPreference} from './preferences.js';
// Saved daily streak event only. Native art uses one finite shared clock and opaque swaps.
const ROOT=new URL('../assets/art/streak-campfire-v2/',import.meta.url);
export const STREAK_DURATION=7600;
const DURATION=STREAK_DURATION,IMPACT=1600,SVG='http://www.w3.org/2000/svg';
const seenInSession=new Set(),DAY=/^\d{4}-\d{2}-\d{2}$/;
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function eventKey(profileId,event){return profileId&&DAY.test(event?.dayKey||'')&&Number(event.streak)>0?String(profileId)+':'+event.dayKey:null;}
function safeStorage(){try{return globalThis.localStorage;}catch{return null;}}
function readDays(profileId,storage){try{const value=JSON.parse(storage.getItem('hz_daily_streak_seen_v1:'+profileId)||'[]');return Array.isArray(value)?value.filter(day=>DAY.test(day)):[];}catch{return[];}}
export function shouldShowStreakCelebration(profileId,event,storage=safeStorage()){const key=eventKey(profileId,event);return !!key&&!seenInSession.has(key)&&!readDays(profileId,storage).includes(event.dayKey);}
export function markStreakCelebrationSeen(profileId,event,storage=safeStorage()){const key=eventKey(profileId,event);if(!key)return;seenInSession.add(key);try{storage.setItem('hz_daily_streak_seen_v1:'+profileId,JSON.stringify([...new Set([...readDays(profileId,storage),event.dayKey])].sort().slice(-45)));}catch{/* In-session guard remains available when storage is blocked. */}}
function timeRemaining(minutes){const n=Math.max(0,Math.floor(Number(minutes)||0));if(n<1)return 'less than a minute';const hours=Math.floor(n/60),rest=n%60;return [hours?hours+'h':'',rest?rest+'m':''].filter(Boolean).join(' ');}
export function streakTimeNote(event){
 const hour=Number(event.localHour),minutes=timeRemaining(event.minutesUntilMidnight);
 if(hour>=20)return 'Finished with '+minutes+' left today.';
 let at='';try{at=new Intl.DateTimeFormat('en',{hour:'numeric',minute:'2-digit',timeZone:event.timeZone||'America/Guayaquil'}).format(new Date(event.completedAt));}catch{}
 return at?'Finished at '+at+' · '+minutes+' before midnight.':minutes+' before midnight.';
}
function weekFor(event){
 if(Array.isArray(event.weekDays)&&event.weekDays.length===7)return event.weekDays;
 const today=new Date(event.dayKey+'T12:00:00Z'),monday=new Date(today);monday.setUTCDate(today.getUTCDate()-(today.getUTCDay()+6)%7);
 return Array.from({length:7},(_,i)=>{const day=new Date(monday);day.setUTCDate(monday.getUTCDate()+i);const dayKey=day.toISOString().slice(0,10);return{dayKey,weekday:['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][i],active:event.activeDays?.includes(dayKey),today:dayKey===event.dayKey};});
}

export function streakCelebrationMarkup(event){
 const streak=Math.max(1,Math.floor(Number(event.streak)||1)),week=weekFor(event),earned=week.filter(day=>day.active).length;
 return `<main class="streak-celebration-page" tabindex="-1" data-streak-day="${esc(event.dayKey)}" data-streak-phase="preparing"><header><span class="wordmark">HORIZONS</span></header><div class="streak-celebration-layout"><div class="streak-campfire" role="img" aria-label="Pico roasting a marshmallow, then celebrating a burst of fire"><img class="streak-campfire-still" src="${ROOT.href}startup.png" alt="" draggable="false"><div class="streak-campfire-stage" hidden aria-hidden="true"></div></div><section class="streak-celebration-copy" aria-labelledby="streak-celebration-title"><div class="streak-reveal" data-streak-reveal hidden><div class="streak-impact-rays" aria-hidden="true">${Array.from({length:14},(_,i)=>`<i style="--ray:${i}"></i>`).join('')}</div><div class="streak-impact-confetti" aria-hidden="true">${Array.from({length:18},(_,i)=>`<i style="--piece:${i}"></i>`).join('')}</div><h1 id="streak-celebration-title"><span class="streak-celebration-number">${streak}</span><span>${streak===1?'day streak':'days in a row'}</span></h1><div class="streak-week" aria-label="This week’s practice">${week.map((day,index)=>`<div class="streak-week-day ${day.active?'is-active':''} ${day.today?'is-today':''}" data-week-index="${index}" aria-label="${esc(day.weekday||day.label||'')} ${day.dayKey}${day.active?', practiced':day.dayKey<=event.dayKey?', no practice saved':''}${day.today?', today':''}"><span>${esc(day.label||day.weekday||'')}</span><b><span class="streak-week-date">${new Date(day.dayKey+'T12:00:00Z').getUTCDate()}</span><span class="streak-week-check" hidden>✓</span></b></div>`).join('')}<div class="streak-week-rail" role="progressbar" aria-label="Days practiced this week" aria-valuemin="0" aria-valuemax="7" aria-valuenow="0" data-earned="${earned}">${week.map((day,index)=>`<i data-rail-index="${index}" data-active="${!!day.active}"><span></span></i>`).join('')}</div></div><p class="streak-time-note">${esc(streakTimeNote(event))}</p></div><div class="streak-continue-slot"><button class="primary-button streak-continue" data-action="streak-results" hidden disabled>Continue <span aria-hidden="true">→</span></button></div></section></div></main>`;
}

const src=value=>new URL(value,/^assets\//.test(value)?new URL('../',import.meta.url):ROOT).href;
const clamp=n=>Math.max(0,Math.min(1,n)),ease=n=>{n=clamp(n);return n*n*(3-2*n);};
const lerp=(a,b,t)=>a+(b-a)*t,rad=n=>n*Math.PI/180,deg=n=>n*180/Math.PI;
const rotate=(v,angle)=>[v[0]*Math.cos(angle)-v[1]*Math.sin(angle),v[0]*Math.sin(angle)+v[1]*Math.cos(angle)];
const add=(a,b)=>[a[0]+b[0],a[1]+b[1]],sub=(a,b)=>[a[0]-b[0],a[1]-b[1]];
const pulse=(t,start,peak,end)=>t<start||t>end?0:t<peak?ease((t-start)/(peak-start)):1-ease((t-peak)/(end-peak));
const setHidden=(node,hidden)=>{if(node&&node.hidden!==hidden)node.hidden=hidden;};
const svg=(name,attrs={})=>{const node=document.createElementNS(SVG,name);for(const[k,v]of Object.entries(attrs))node.setAttribute(k,String(v));return node;};
const svgHidden=(node,hidden)=>{if(node){node.setAttribute('visibility',hidden?'hidden':'visible');node.style.display=hidden?'none':'';}};
const setTransform=(node,transform)=>node?.setAttribute('transform',transform);
function boneGeometry(part){const vector=sub(part.end,part.pivot);return{length:Math.hypot(...vector),angle:Math.atan2(vector[1],vector[0])};}
function solveArm(shoulder,wrist,upper,fore,bend){
 const delta=sub(wrist,shoulder),raw=Math.hypot(...delta),distance=Math.max(Math.abs(upper-fore)+.01,Math.min(upper+fore-.01,raw));
 const direction=Math.atan2(delta[1],delta[0]),angle=direction+bend*Math.acos(Math.max(-1,Math.min(1,(upper*upper+distance*distance-fore*fore)/(2*upper*distance))));
 const elbow=add(shoulder,rotate([upper,0],angle)),foreAngle=Math.atan2(wrist[1]-elbow[1],wrist[0]-elbow[0]);
 return{upperAngle:angle,foreAngle,elbow};
}

export function mountStreakCelebration(root,{elapsed=0,onTime=()=>{},onPresented=()=>{},onImpact=()=>{}}={}){
 if(!root)return{dispose(){},ready:Promise.resolve()};
 const stage=root.querySelector('.streak-campfire-stage'),still=root.querySelector('.streak-campfire-still'),reveal=root.querySelector('[data-streak-reveal]'),button=root.querySelector('[data-action=streak-results]'),title=root.querySelector('h1'),rays=root.querySelector('.streak-impact-rays'),confetti=root.querySelector('.streak-impact-confetti'),rail=root.querySelector('.streak-week-rail'),reduced=motionPreference;
 let finalStill=src('reduced.png'),disposed=false,ready=false,failed=false,presented=false,impacted=false,frame=0,last=null,visible=true,clock=Math.max(0,Math.min(DURATION,Number(elapsed)||0)),spec,nodes={},loadTimer;
 const loadAbort=new AbortController();
 const isVisible=()=>{const rect=root.getBoundingClientRect();return root.isConnected&&!document.hidden&&visible&&rect.bottom>0&&rect.top<innerHeight;};
 const present=()=>{if(!disposed&&isVisible()){if(!presented){presented=true;onPresented();}if(clock>=IMPACT&&!impacted){impacted=true;onImpact();}}};
 const revealAt=t=>{
  const shown=t>=2400,complete=t>=DURATION;setHidden(reveal,!shown);setHidden(button,!complete);button.disabled=!complete;
  root.dataset.streakPhase=t<1400?'anticipation':t<2400?'burst':t<3800?'impact':t<6500?'week':t<DURATION?'settling':'complete';
  const big=Math.min(1.28,(reveal.clientWidth-16)/Math.max(1,title.offsetWidth));
  const pop=t<2400?0:t<2590?lerp(.04,big,ease((t-2400)/190)):t<2830?lerp(big,.91,ease((t-2590)/240)):t<3100?lerp(.91,1.06,ease((t-2830)/270)):lerp(1.06,1,ease((t-3100)/300));
  title.style.transform=`scale(${pop||1}) rotate(${t>=2400&&t<3140?Math.sin((t-2400)*.017)*3:0}deg)`;
  const numberBox=root.querySelector('.streak-celebration-number').getBoundingClientRect(),revealBox=reveal.getBoundingClientRect(),center=[numberBox.left+numberBox.width/2,numberBox.top+numberBox.height/2];
  for(const effect of[rays,confetti]){effect.style.left=(center[0]-revealBox.left)+'px';effect.style.top=(center[1]-revealBox.top)+'px';}
  setHidden(confetti,t<2450||t>=3900);const flight=clamp((t-2450)/1450);confetti.querySelectorAll('i').forEach((piece,i)=>{const angle=(i/18)*Math.PI*2,speed=65+(i%4)*18;piece.style.display=Math.sin(angle)>.65?'none':'block';piece.style.transform=`translate(${Math.cos(angle)*(numberBox.width/2+22+speed*flight)}px,${Math.sin(angle)*(numberBox.height/2+22+speed*.7*flight)+100*flight*flight}px) rotate(${i*37+flight*(i%2?300:-260)}deg)`;});
  setHidden(rays,t<2400||t>=3150);
  const rayProgress=ease((t-2400)/750),room=Math.min(center[0]-12,innerWidth-center[0]-12),innerX=numberBox.width/2+14,innerY=numberBox.height/2+14,rayLength=Math.max(16,Math.min(46,room-innerX-12)),travel=Math.max(0,Math.min(60,room-innerX-rayLength-2));
  rays.querySelectorAll('i').forEach((ray,index)=>{const angle=index/14*Math.PI*2;ray.style.display=Math.sin(angle)>.65?'none':'block';ray.style.height=rayLength+'px';ray.style.transform=`translate(${Math.cos(angle)*(innerX+travel*rayProgress)}px,${Math.sin(angle)*(innerY+55*rayProgress)}px) rotate(${deg(angle)-90}deg)`;});
  const progress=clamp((t-3800)/1900);let filled=0;
  root.querySelectorAll('[data-rail-index]').forEach((segment,index)=>{const amount=segment.dataset.active==='true'?clamp(progress*7-index):0;segment.firstElementChild.style.transform=`scaleX(${amount})`;const day=root.querySelector(`[data-week-index="${index}"]`),earned=amount>=.99;day.classList.toggle('is-earned',earned);setHidden(day.querySelector('.streak-week-check'),!earned);setHidden(day.querySelector('.streak-week-date'),earned);if(earned)filled++;});
  rail.setAttribute('aria-valuenow',String(filled));rail.style.setProperty('--rail-progress',String(progress));
  const today=root.querySelector('.streak-week-day.is-today b');if(today)today.style.transform=`scale(${1+pulse(t,5000,5250,5700)*.3})`;
  if(complete&&isVisible()&&document.activeElement===root)button.focus({preventScroll:true});
 };
 const draw=t=>{
  revealAt(t);if(!ready)return;
  const a=spec.anchors,r=a.root,restGrip=a.rightGrip||[290,372],restTip=a.skewerTip||[445,395],restAngle=Math.atan2(restTip[1]-restGrip[1],restTip[0]-restGrip[0]);
  const anticipation=pulse(t,250,1150,1550),blast=pulse(t,1370,1760,2640),rebound=pulse(t,2450,2860,3520),settle=pulse(t,3300,3720,4400);
  const idle=t>=DURATION?(1-Math.cos((t-DURATION)*Math.PI*2/4200)):0;
  const jump=blast*46+rebound*15+idle*1.5,lean=-blast*9+rebound*4-settle*1.4+idle*.6;
  setTransform(nodes.character,`translate(${r[0]-blast*10} ${r[1]+anticipation*8-jump}) rotate(${lean})`);
  const handLift=ease((t-1370)/650)*(1-ease((t-3750)/1450)),check=anticipation*4+idle*.8;
  const mainGrip=[restGrip[0]+handLift*24,restGrip[1]-handLift*67+check],stickAngle=restAngle-rad(handLift*37)+rad(Math.sin(t*.008)*anticipation*2);
  const gripDistance=spec.secondaryGripDistance||Math.hypot(...sub(a.leftGrip||[232,374],restGrip));
  const leftGrip=add(mainGrip,rotate([-gripDistance,0],stickAngle));
  for(const side of ['left','right']){
   const limb=nodes[side],grip=side==='left'?leftGrip:mainGrip,paw=spec.parts[side+'Paw'],pawVector=sub(paw.end,paw.pivot),pawLength=Math.hypot(...pawVector),pawNativeAngle=Math.atan2(pawVector[1],pawVector[0]),shoulder=a[side+'Shoulder'];
   // Elbow→wrist→grip is one continuous anatomical line. The paw follows the
   // forearm; the independently held skewer rotates at the palm grip instead.
   const solved=solveArm(shoulder,grip,limb.upperLength,limb.foreLength+pawLength,spec.elbowBend?.[side]??a[side+'Bend']??1),pawWorldAngle=solved.foreAngle-pawNativeAngle;
   const shoulderTransform=`translate(${shoulder[0]-r[0]} ${shoulder[1]-r[1]}) rotate(${deg(solved.upperAngle)})`;
   setTransform(limb.upper,shoulderTransform);setTransform(limb.upperBack,shoulderTransform);
   setTransform(limb.fore,`translate(${limb.upperLength} 0) rotate(${deg(solved.foreAngle-solved.upperAngle)})`);
   setTransform(limb.paw,`translate(${limb.foreLength} 0) rotate(${-deg(pawNativeAngle)})`);
   if(side==='right')setTransform(nodes.held,`translate(${pawVector[0]} ${pawVector[1]}) rotate(${deg(stickAngle-pawWorldAngle)})`);
  }
  setTransform(nodes.head,`translate(${a.neck[0]-r[0]} ${a.neck[1]-r[1]+anticipation*2}) rotate(${blast*16-rebound*7+Math.sin(t*.005)*anticipation*2+idle*.8})`);
  setTransform(nodes.leftLeg,`translate(${a.leftHip[0]-r[0]} ${a.leftHip[1]-r[1]}) rotate(${-blast*20+rebound*7})`);
  setTransform(nodes.rightLeg,`translate(${a.rightHip[0]-r[0]} ${a.rightHip[1]-r[1]}) rotate(${blast*24-rebound*10})`);
  if(nodes.satchel)setTransform(nodes.satchel,`translate(${(a.satchel||r)[0]-r[0]} ${(a.satchel||r)[1]-r[1]+blast*3}) rotate(${blast*8-rebound*5})`);
  const excited=t>=1680&&t<4350,blink=!excited&&((t>600&&t<750)||(t>6100&&t<6240)||(t>DURATION&&(t-DURATION)%4700>3100&&(t-DURATION)%4700<3240));svgHidden(nodes.neutral,excited);svgHidden(nodes.excited,!excited);svgHidden(nodes.eyes,excited||blink);svgHidden(nodes.pupils,excited||blink);svgHidden(nodes.blink,excited||!blink);setTransform(nodes.pupils,`translate(${t<1300?1.5:0} ${t<1300?1:0})`);
  const f=t<950?0:t<1450?1:2+(Math.floor(t/105)%2),base=spec.fireBase;
  nodes.fires.forEach((node,index)=>{svgHidden(node,index!==Math.min(f,nodes.fires.length-1));setTransform(node,`translate(${base[0]} ${base[1]}) rotate(${Math.sin(t*.017)*2.5}) scale(${.98+Math.sin(t*.019)*.045} ${t<1400?.3+ease(t/1400)*.5:1+Math.sin(t*.021)*.065})`);});
  const burstOn=t>=1370&&t<3450,burstAge=t-1370,burstFrame=burstAge<180?0:burstAge<470?1:burstAge<1000?2:3;
  nodes.bursts.forEach((node,index)=>{svgHidden(node,!burstOn||index!==Math.min(burstFrame,nodes.bursts.length-1));const growth=burstAge<180?lerp(.3,.7,ease(burstAge/180)):burstAge<470?lerp(.7,1.22,ease((burstAge-180)/290)):burstAge<1000?lerp(1.22,1,ease((burstAge-470)/530)):lerp(1,.42,ease((burstAge-1000)/1080));setTransform(node,`translate(${base[0]} ${base[1]}) rotate(${Math.sin(burstAge*.019)*4}) scale(${1+Math.sin(burstAge*.012)*.06} ${growth})`);});
  const jolt=blast*Math.sin(t*.065)*2.2;setTransform(nodes.world,`translate(${jolt} ${Math.abs(jolt)*.5})`);
 };
 const cancel=()=>{cancelAnimationFrame(frame);frame=0;last=null;};
 const canPlay=()=>ready&&!disposed&&visible&&!document.hidden&&!reduced.matches;
 const tick=now=>{if(!canPlay()){cancel();if(reduced.matches)sync();return;}if(last!==null)clock=clock+now-last;last=now;onTime(clock);draw(clock);present();frame=requestAnimationFrame(tick);};
 const sync=()=>{if(disposed)return;cancel();if(failed||reduced.matches){clock=DURATION;onTime(clock);revealAt(clock);stage.hidden=true;if(still.src!==finalStill)still.src=finalStill;still.hidden=false;root.dataset.streakMotion=failed?'fallback':'reduced';present();return;}if(ready){stage.hidden=false;still.hidden=true;root.dataset.streakMotion='ready';draw(clock);present();if(canPlay())frame=requestAnimationFrame(tick);}};
 const observer=new IntersectionObserver(entries=>{visible=entries[0]?.isIntersecting!==false;sync();},{threshold:.05});observer.observe(root);reduced.addEventListener('change',sync);document.addEventListener('visibilitychange',sync);
 const controller={get elapsed(){return clock;},dispose(){if(disposed)return;disposed=true;cancel();clearTimeout(loadTimer);loadAbort.abort();observer.disconnect();reduced.removeEventListener('change',sync);document.removeEventListener('visibilitychange',sync);stage.replaceChildren();}};
 // A stalled request must not leave the learner behind a permanently hidden CTA.
 loadTimer=setTimeout(()=>{if(!disposed&&!ready){failed=true;loadAbort.abort();sync();}},18000);
 controller.ready=fetch(new URL('rigs.json?v=1',ROOT),{cache:'no-cache',signal:loadAbort.signal}).then(response=>{if(!response.ok)throw Error('Missing articulated streak rig');return response.json();}).then(async manifest=>{
  if(disposed||!root.isConnected)return;spec=manifest;finalStill=src(spec.fallback||'reduced.png');const parts=spec.parts,images=[];
  const scene=svg('svg',{viewBox:`0 0 ${spec.width||760} ${spec.height||560}`,width:'100%',height:'100%',class:'streak-rig-svg','aria-hidden':'true'}),defs=svg('defs'),world=svg('g',{'data-streak-world':''});scene.append(defs,world);stage.append(scene);
  const paletteFilter=(part,key)=>{
   if(!part.palette?.offset)return null;
   const id='streak-palette-'+key+'-'+Math.random().toString(36).slice(2),filter=svg('filter',{id,'color-interpolation-filters':'sRGB',x:'-5%',y:'-5%',width:'110%',height:'110%','data-palette-part':key}),offset=part.palette.offset.map(value=>value/255);
   // Bias is proportional to native alpha: opaque skin gets the measured
   // correction, while zero-alpha texture borders cannot acquire coloured RGB.
   filter.append(svg('feColorMatrix',{in:'SourceGraphic',result:'tinted',type:'matrix',values:`1 0 0 ${offset[0]} 0  0 1 0 ${offset[1]} 0  0 0 1 ${offset[2]} 0  0 0 0 1 0`}));
   if(part.palette.skinOnly){const low=part.palette.mask?.greenLow??110,high=part.palette.mask?.greenHigh??170;
    filter.append(svg('feColorMatrix',{in:'SourceGraphic',type:'matrix',values:`0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 ${255/(high-low)} 0 0 ${-low/(high-low)}`,result:'skinMask'}));
    filter.append(svg('feComposite',{in:'tinted',in2:'skinMask',operator:'in',result:'skinTint'}),svg('feComposite',{in:'SourceGraphic',in2:'skinMask',operator:'out',result:'garment'}),svg('feComposite',{in:'skinTint',in2:'garment',operator:'arithmetic',k1:0,k2:1,k3:1,k4:0}));
   }
   // Constrain the result to the original native alpha without squaring edge
   // coverage. This also prevents Chromium's filtered-image frame artefacts.
   filter.lastElementChild.setAttribute('result','paletteAdjusted');
   filter.append(svg('feComposite',{in:'paletteAdjusted',in2:'SourceGraphic',operator:'atop'}));
   defs.append(filter);return`url(#${id})`;
  };
  const image=(key,parent,{absolute=false,axis=false}={})=>{const p=parts[key];if(!p?.file)throw Error('Missing complete streak part '+key);const node=svg('image',{href:src(p.file),x:absolute?p.x||0:-p.pivot[0],y:absolute?p.y||0:-p.pivot[1],width:p.width,height:p.height,'data-streak-part':key});if(axis)setTransform(node,`rotate(${-deg(boneGeometry(p).angle)})`);const palette=paletteFilter(p,key);if(palette)node.setAttribute('filter',palette);parent.append(node);const check=new Image();check.src=src(p.file);images.push(check);return node;};
  const group=(parent,attrs={})=>{const g=svg('g',attrs);parent.append(g);return g;};
  const mask=(key)=>{const id='streak-'+key+'-'+Math.random().toString(36).slice(2),m=svg('mask',{id,maskUnits:'userSpaceOnUse',x:-760,y:-560,width:1520,height:1120,style:'mask-type:alpha'});image(key,m,{absolute:key==='fireMask'});defs.append(m);return`url(#${id})`;};
  image('fireplace',world,{absolute:true});const fireInside=group(world,{mask:mask('fireMask')}),fires=(spec.fireFrames||['fireEmber','fireSmall','fireIgnite','fireFull']).map(key=>{const g=group(fireInside);image(key,g);return g;}),bursts=(spec.burstFrames||['burstCompress','burstPunch','burstSplit','burstSettle']).map(key=>{const g=group(world);image(key,g);return g;});
  image('seat',world,{absolute:true});const character=group(world,{'data-streak-character':''}),leftLeg=group(character,{'data-joint':'leftHip'}),rightLeg=group(character,{'data-joint':'rightHip'});image('leftLeg',leftLeg);image('rightLeg',rightLeg);const torso=image('torso',character);
  // The viewer-right arm is the far arm: its entire articulated chain passes
  // behind the jersey. The viewer-left arm keeps the foreground grip clear.
  const makeArm=side=>{const far=side==='right',upperBack=svg('g',{'data-bone-render':side+'UpperArm'});character.insertBefore(upperBack,far?torso:torso.nextSibling);image(side+'UpperArm',upperBack,{axis:true});const upper=group(character,{'data-joint':side+'Shoulder'});if(far)character.insertBefore(upper,torso);const fore=group(upper,{'data-joint':side+'Elbow'});image(side+'Forearm',fore,{axis:true});const paw=group(fore,{'data-joint':side+'Wrist'});return{upper,upperBack,fore,paw,upperLength:boneGeometry(parts[side+'UpperArm']).length,foreLength:boneGeometry(parts[side+'Forearm']).length};};
  const right=makeArm('right'),grip=sub(parts.rightPaw.end,parts.rightPaw.pivot),held=group(right.paw,{'data-joint':'mainGrip',transform:`translate(${grip[0]} ${grip[1]})`});image('skewer',held,{axis:true});const mallow=group(held,{'data-joint':'skewerTip',transform:`translate(${boneGeometry(parts.skewer).length} 0)`});image('marshmallow',mallow);image('rightPaw',right.paw);const left=makeArm('left');image('leftPaw',left.paw);
  let satchel;if(parts.satchel){satchel=group(character);image('satchel',satchel);}
  const head=group(character,{'data-joint':'neck'});image('head',head);const face=group(head,{mask:mask('faceMask')}),neutral=group(face),eyes=image('eyes',neutral),pupilGroup=group(neutral,{mask:mask('eyeMask')}),pupils=image('pupils',pupilGroup);image('browsMouth',neutral);const blink=image('blink',neutral);image('nose',face);const excited=image('excited',face);
  nodes={world,character,leftLeg,rightLeg,head,left,right,held,satchel,neutral,eyes,pupils,blink,excited,fires,bursts};
  await Promise.all(images.map(img=>img.decode()));clearTimeout(loadTimer);if(disposed||!root.isConnected)return;ready=true;sync();
 }).catch(error=>{clearTimeout(loadTimer);if(disposed)return;root.dataset.streakFailure=error.message;failed=true;sync();});
 sync();return controller;
}
