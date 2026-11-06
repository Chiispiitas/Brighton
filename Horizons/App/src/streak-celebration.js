// Saved daily streak event only. Native art uses one finite shared clock and opaque swaps.
const ROOT=new URL('../assets/art/streak-campfire-v1/',import.meta.url),DURATION=5600;
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
 const streak=Math.max(1,Math.floor(Number(event.streak)||1));
 return `<main class="streak-celebration-page" data-streak-day="${esc(event.dayKey)}" data-streak-phase="preparing"><header><span class="wordmark">HORIZONS</span></header><div class="streak-celebration-layout"><div class="streak-campfire" role="img" aria-label="Pico roasting a marshmallow beside a fire"><img class="streak-campfire-still" src="${ROOT.href}roast-reconstruction.png" alt="" draggable="false"><div class="streak-campfire-stage" hidden aria-hidden="true"></div></div><section class="streak-celebration-copy" aria-labelledby="streak-celebration-title"><div class="streak-reveal" data-streak-reveal hidden><h1 id="streak-celebration-title"><span class="streak-celebration-number">${streak}</span><span>${streak===1?'day':'days'} in a row</span></h1><div class="streak-week" aria-label="This week’s practice">${weekFor(event).map(day=>`<div class="streak-week-day ${day.active?'is-active':''} ${day.today?'is-today':''}" aria-label="${esc(day.weekday||day.label||'')} ${day.dayKey}${day.active?', practiced':day.dayKey<=event.dayKey?', no practice saved':''}${day.today?', today':''}"><span>${esc(day.label||day.weekday||'')}</span><b>${day.active?'✓':new Date(day.dayKey+'T12:00:00Z').getUTCDate()}</b></div>`).join('')}</div><p class="streak-time-note">${esc(streakTimeNote(event))}</p></div><button class="primary-button streak-continue" data-action="streak-results">Continue <span aria-hidden="true">→</span></button></section></div></main>`;
}
const src=value=>new URL(value,/^assets\//.test(value)?new URL('../',import.meta.url):ROOT).href;
const ease=n=>{n=Math.max(0,Math.min(1,n));return n*n*(3-2*n);};
// Texture only the already-generated forelimbs. Shoulder pixels are pinned;
// hands and the held skewer follow the same continuously interpolated anchors.
function poseTexture(img){
 const fixed=document.createElement('canvas'),moving=document.createElement('canvas');fixed.width=moving.width=760;fixed.height=moving.height=500;
 const f=fixed.getContext('2d'),m=moving.getContext('2d');f.drawImage(img,0,0);const a=f.getImageData(0,0,760,500),b=m.createImageData(760,500);
 for(let i=0;i<a.data.length;i+=4){const [r,g,v]=a.data.slice(i,i+3);if((r>g*.95&&g>v*1.15)||(r>210&&g>210&&v>190)){b.data.set(a.data.slice(i,i+4),i);a.data[i+3]=0;}}
 f.putImageData(a,0,0);m.putImageData(b,0,0);return{fixed,moving};
}
function drawPose(ctx,texture,progress,lifted){
 ctx.clearRect(0,0,760,500);ctx.drawImage(texture.fixed,0,0);
 const grip=lifted?[258,326]:[258,354],tip=lifted?[390,289]:[410,374];
 const target=[258,354-28*progress],end=[410-20*progress,374-85*progress];
 const ax=tip[0]-grip[0],ay=tip[1]-grip[1],bx=end[0]-target[0],by=end[1]-target[1],den=ax*ax+ay*ay,c=(ax*bx+ay*by)/den,s=(ax*by-ay*bx)/den;
 const point=(x,y)=>{const w=Math.max(ease((y-270)/45),ease((x-310)/30));return[x+w*(target[0]+c*(x-grip[0])-s*(y-grip[1])-x),y+w*(target[1]+s*(x-grip[0])+c*(y-grip[1])-y)];};
 const tri=(a,b,d)=>{const p=point(...a),q=point(...b),r=point(...d),det=(b[0]-a[0])*(d[1]-a[1])-(d[0]-a[0])*(b[1]-a[1]);
  const A=((q[0]-p[0])*(d[1]-a[1])-(r[0]-p[0])*(b[1]-a[1]))/det,B=((q[1]-p[1])*(d[1]-a[1])-(r[1]-p[1])*(b[1]-a[1]))/det,C=((r[0]-p[0])*(b[0]-a[0])-(q[0]-p[0])*(d[0]-a[0]))/det,D=((r[1]-p[1])*(b[0]-a[0])-(q[1]-p[1])*(d[0]-a[0]))/det;
  ctx.save();ctx.beginPath();const mid=[(p[0]+q[0]+r[0])/3,(p[1]+q[1]+r[1])/3],expand=v=>{const dx=v[0]-mid[0],dy=v[1]-mid[1],n=Math.hypot(dx,dy);return[v[0]+dx/n*.7,v[1]+dy/n*.7];};ctx.moveTo(...expand(p));ctx.lineTo(...expand(q));ctx.lineTo(...expand(r));ctx.closePath();ctx.clip();ctx.transform(A,B,C,D,p[0]-A*a[0]-C*a[1],p[1]-B*a[0]-D*a[1]);ctx.drawImage(texture.moving,0,0);ctx.restore();};
 for(let y=232;y<400;y+=14)for(let x=162;x<442;x+=14){tri([x,y],[x+14,y],[x,y+14]);tri([x+14,y],[x+14,y+14],[x,y+14]);}
}
export function mountStreakCelebration(root,{elapsed=0,onTime=()=>{},onPresented=()=>{}}={}){
 if(!root)return{dispose(){},ready:Promise.resolve()};
 const stage=root.querySelector('.streak-campfire-stage'),still=root.querySelector('.streak-campfire-still'),reveal=root.querySelector('[data-streak-reveal]'),reduced=matchMedia('(prefers-reduced-motion:reduce)');
 let finalStill=new URL('reduced.png',ROOT).href;
 let disposed=false,ready=false,failed=false,presented=false,frame=0,visible=true,clock=Math.max(0,Math.min(DURATION,Number(elapsed)||0)),last=null,spec,nodes={};
 const present=()=>{const rect=root.getBoundingClientRect();if(!presented&&!disposed&&root.isConnected&&!document.hidden&&visible&&rect.bottom>0&&rect.top<innerHeight){presented=true;onPresented();}};
 const revealAt=t=>{const show=t>=2300;if(reveal.hidden===show)reveal.hidden=!show;root.dataset.streakPhase=t<800?'roasting':t<2300?'igniting':t<DURATION?'celebrating':'settled';};
 const hide=(node,value)=>{if(node&&node.hidden!==value)node.hidden=value;};
 const transform=(node,value)=>{if(node)node.style.transform=value;};
 const pulse=(t,start,peak,end,amount)=>t<start||t>end?0:amount*(t<peak?ease((t-start)/(peak-start)):1-ease((t-peak)/(end-peak)));
 const draw=t=>{
  revealAt(t);if(!ready)return;
  const progress=t<3200?ease((t-1250)/1450):1-ease((t-3550)/1550),lifted=progress>=.5;
  hide(nodes.armRoast,lifted);hide(nodes.armLift,!lifted);
  drawPose(nodes.poseContext,lifted?nodes.liftTexture:nodes.roastTexture,progress,lifted);
  const surprise=t>=1900&&t<4000,blink=!surprise&&((t>=650&&t<790)||(t>=4600&&t<4740));
  hide(nodes.excited,!surprise);hide(nodes.neutral,surprise);hide(nodes.eyes,blink);hide(nodes.pupilMask,blink);hide(nodes.blink,!blink);
  const lean=pulse(t,1300,2300,4600,3);transform(nodes.head,`translateY(${-lean*.7}px) rotate(${-lean}deg)`);
  const gestureAmount=spec.upperBodyKeyposes ? 0.25 : 1;
  transform(nodes.armRoast,`rotate(${pulse(t,700,1450,1800,1.5)*gestureAmount}deg)`);transform(nodes.armLift,`translateY(${-pulse(t,1800,2400,4400,3)*gestureAmount}px) rotate(${-pulse(t,1800,2400,4400,1)*gestureAmount}deg)`);
  transform(nodes.pupils,`translate(${t<1400?1:0}px,${t<1400?1:0}px)`);
  const growth=ease((t-250)/1750),height=10+growth*(105+12*Math.sin(t*.013)+6*Math.sin(t*.031));
  const fire=t<750?0:t<1200?1:[1,3,2,3,1,2,3][Math.floor(t/115)%7];
  nodes.fires.forEach((node,i)=>{hide(node,i!==fire);node.style.transformOrigin='60.7894737% 84%';transform(node,`translateX(${Math.sin(t*.009)*1.8}px) rotate(${Math.sin(t*.011)*2}deg) scale(${.98+Math.sin(t*.017)*.025},${height/[31,119,149,129][i]})`);});
  const count=root.querySelector('.streak-celebration-number'),week=root.querySelector('.streak-week-day.is-today b');
  transform(count,`scale(${1+pulse(t,2300,2500,2900,.13)})`);transform(week,`scale(${1+pulse(t,2850,3070,3430,.16)})`);
 };
 const cancel=()=>{cancelAnimationFrame(frame);frame=0;last=null;};
 const canPlay=()=>ready&&!disposed&&visible&&!document.hidden&&!reduced.matches&&clock<DURATION;
 const tick=now=>{if(!canPlay()){cancel();if(reduced.matches)sync();return;}if(last!==null)clock=Math.min(DURATION,clock+now-last);last=now;onTime(clock);draw(clock);if(clock<DURATION)frame=requestAnimationFrame(tick);else cancel();};
 const sync=()=>{if(disposed)return;cancel();if(failed||reduced.matches){clock=DURATION;onTime(clock);revealAt(clock);stage.hidden=true;if(still.src!==finalStill)still.src=finalStill;still.hidden=false;root.dataset.streakMotion=failed?'fallback':'reduced';present();return;}if(ready){stage.hidden=false;still.hidden=true;root.dataset.streakMotion='ready';draw(clock);present();if(canPlay())frame=requestAnimationFrame(tick);}};
 const observer=new IntersectionObserver(entries=>{visible=entries[0]?.isIntersecting!==false;sync();},{threshold:.05});observer.observe(root);
 reduced.addEventListener('change',sync);document.addEventListener('visibilitychange',sync);
 const controller={get elapsed(){return clock;},dispose(){if(disposed)return;disposed=true;cancel();observer.disconnect();reduced.removeEventListener('change',sync);document.removeEventListener('visibilitychange',sync);stage.replaceChildren();}};
 controller.ready=fetch(new URL('rigs.json?v=1',ROOT),{cache:'no-cache'}).then(r=>{if(!r.ok)throw Error('Missing streak rig');return r.json()}).then(async manifest=>{
  if(disposed||!root.isConnected)return;spec=manifest;if(spec.fallback)finalStill=src(spec.fallback);stage.style.aspectRatio=(spec.width||760)+' / '+(spec.height||500);const parts=spec.parts||{};const images=[];
  const group=cls=>{const n=document.createElement('span');n.className='streak-rig-group '+cls;return n;};
  const image=(key,parent=stage,optional=false)=>{const file=parts[key];if(!file){if(optional)return null;throw Error('Missing streak part '+key);}const img=new Image();img.src=src(file);img.alt='';img.draggable=false;img.className='streak-rig-image';img.dataset.streakPart=key;parent.append(img);images.push(img);return img;};
  image('fireplace');const fireMask=group('streak-rig-fire-mask');stage.append(fireMask);if(spec.fireMask){fireMask.style.maskImage=`url("${src(spec.fireMask)}")`;fireMask.style.webkitMaskImage=fireMask.style.maskImage;}const fires=['fireEmber','fireSmall','fireIgnite','fireFull'].map(k=>image(k,fireMask));image('body');
  const head=group('streak-rig-head'),face=group('streak-rig-face'),neutral=group('streak-rig-neutral'),pupilMask=group('streak-rig-pupil-mask');
  stage.append(head);image('head',head);head.append(face);face.append(neutral);const eyes=image('eyes',neutral),pupils=image('pupils',pupilMask);neutral.append(pupilMask);image('browsMouth',neutral);const blink=image('blink',neutral);image('nose',face);const excited=image('excited',face);face.style.maskImage=`url("${src(manifest.faceMask||parts.head)}")`;face.style.webkitMaskImage=face.style.maskImage;pupilMask.style.maskImage=`url("${src(manifest.eyeMask||parts.eyes)}")`;pupilMask.style.webkitMaskImage=pupilMask.style.maskImage;
  const armRoast=image('armRoast'),armLift=image('armLift');image('satchel',stage,true);
  for(const [name,node]of Object.entries({head,armRoast,armLift})){const pivot=spec.pivots?.[name];if(pivot)node.style.transformOrigin=(pivot[0]/(spec.width||760)*100)+'% '+(pivot[1]/(spec.height||500)*100)+'%';}
  // Decode masks too: a failed mask must keep the complete native still.
  for(const file of [spec.faceMask||parts.head,spec.eyeMask||parts.eyes,spec.fireMask].filter(Boolean)){const url=src(file);if(!images.some(img=>img.src===url)){const mask=new Image();mask.src=url;images.push(mask);}}
  nodes={head,neutral,eyes,pupils,pupilMask,blink,excited,armRoast,armLift,fires};
  await Promise.all(images.map(img=>img.decode()));if(disposed||!root.isConnected)return;
  const canvas=document.createElement('canvas');canvas.width=760;canvas.height=500;canvas.className='streak-rig-image';canvas.style.pointerEvents='none';stage.insertBefore(canvas,stage.querySelector('[data-streak-part=satchel]'));
  armRoast.style.display=armLift.style.display='none';nodes.poseContext=canvas.getContext('2d');nodes.roastTexture=poseTexture(armRoast);nodes.liftTexture=poseTexture(armLift);ready=true;sync();
 }).catch(()=>{if(disposed)return;failed=true;sync();});
 sync();return controller;
}
