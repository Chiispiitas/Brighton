// ImageGen-separated decoration rigs. Character/avatar animation is untouched.
let manifestPromise;
const asset=p=>new URL('../'+p,import.meta.url).href;
const recipes={
 cups:{'cup-red':['28% 90%','rotate(-4deg)','translate(5%,-3%) rotate(12deg)','rotate(-3deg)'],'cup-yellow':['74% 90%','rotate(4deg)','translate(-5%,-3%) rotate(-10deg)','rotate(3deg)']},
 notebook:{cover:['7% 50%','rotateY(8deg)','rotateY(-112deg)','rotateY(-112deg)'],pencil:['74% 90%','translate(-10%,-5%) rotate(-8deg)','translate(-32%,-28%) rotate(-18deg)','translate(-28%,-24%) rotate(-14deg)']},
 bag:{body:['50% 90%','rotate(2deg)','rotate(-3deg) scale(1.02,.98)','rotate(1deg)'],'handle-clasp':['50% 26%','rotate(4deg)','translateY(-7%) rotate(-8deg)','translateY(-3%) rotate(4deg)']},
 chef:{hat:['34% 75%','rotate(-4deg)','translateY(-4%) rotate(11deg)','rotate(-7deg)'],spoon:['75% 75%','rotate(5deg)','rotate(-14deg)','rotate(8deg)']},
 map:{'panel-left':['33% 40%','rotateY(8deg)','rotateY(-62deg)','rotateY(-50deg)'],'panel-right':['67% 40%','rotateY(-8deg)','rotateY(62deg)','rotateY(50deg)'],compass:['77% 78%','rotate(-5deg)','rotate(20deg)','rotate(-12deg)']},
 globe:{earth:['45% 44%','rotate(-15deg)','rotate(160deg)','rotate(335deg)']},
 keys:{ring:['27% 27%','rotate(3deg)','rotate(-5deg)','rotate(3deg)'],key:['43% 43%','rotate(-7deg)','rotate(22deg)','rotate(-16deg)']},
 postbox:{letter:['50% 16%','none','none','none']}
};
export function mountPropMotion(region){
 if(!region)return()=>{};let disposed=false;const records=[],reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const restore=r=>{r.stage.hidden=true;r.still.hidden=false;for(const a of r.animations){a.pause();a.currentTime=0;}for(const p of r.specials)p.hidden=true;};
 const update=r=>{
  if(disposed)return;
  const play=!disposed&&!reduced.matches&&!document.hidden&&r.visible;
  if(reduced.matches){restore(r);r.running=false;cancelAnimationFrame(r.frame);return;}
  r.stage.hidden=false;r.still.hidden=true;
  if(play&&!r.running){r.running=true;r.animations.forEach(a=>a.play());r.frame=requestAnimationFrame(()=>tick(r));}
  else if(!play){r.running=false;r.animations.forEach(a=>a.pause());cancelAnimationFrame(r.frame);}
 };
 const tick=r=>{if(!r.running||disposed)return;const phase=((Number(r.animations[0]?.currentTime)||0)%r.duration)/r.duration,local=phase-r.start;for(const p of r.specials){const [from,to]=p.dataset.propPart==='coffee-splash'?[.075,.22]:[.035,.22];p.hidden=!(local>from&&local<to);}r.frame=requestAnimationFrame(()=>tick(r));};
 const observer=new IntersectionObserver(entries=>{for(const e of entries){const r=records.find(r=>r.slot===e.target);if(r){r.visible=e.isIntersecting;update(r);}}},{threshold:.05});
 const resize=new ResizeObserver(entries=>{for(const e of entries){const r=records.find(r=>r.slot===e.target);if(r){const k=Math.min(r.slot.clientWidth/r.w,r.slot.clientHeight/r.h);r.stage.style.width=r.w*k+'px';r.stage.style.height=r.h*k+'px';r.stage.style.perspective=r.w*k*6+'px';}}});
 const all=()=>records.forEach(update);document.addEventListener('visibilitychange',all);reduced.addEventListener('change',all);
 manifestPromise??=fetch(new URL('../assets/art/prop-motion-v1/rigs.json?v=2',import.meta.url),{cache:'no-cache'}).then(r=>{if(!r.ok)throw Error('Missing prop rigs');return r.json();}).catch(error=>{manifestPromise=null;throw error;});
 manifestPromise.then(async manifest=>{
  await Promise.all([...region.querySelectorAll('[data-prop-rig]')].map(async(slot,index)=>{
   const spec=manifest[slot.dataset.propRig],still=slot.querySelector('.prop-still');if(!spec||!still)return;
   const stage=document.createElement('span');stage.className='prop-stage';stage.hidden=true;stage.setAttribute('aria-hidden','true');
   const imgs=spec.parts.map(p=>{const img=new Image();img.src=asset(p.src);img.alt='';img.draggable=false;img.dataset.propPart=p.id;img.hidden=!!p.special;
    // Keep the slot mask fixed while the letter moves inside it.
    if(slot.dataset.propRig==='postbox'&&p.id==='letter'){const mask=document.createElement('span');mask.className='prop-slot-mask';mask.append(img);stage.append(mask);}else stage.append(img);return img;});
   try{await Promise.all(imgs.map(i=>i.decode()));}catch{slot.dataset.propStatus='fallback';return;}if(disposed)return;
   slot.append(stage);const k=Math.min(slot.clientWidth/spec.width,slot.clientHeight/spec.height);stage.style.width=spec.width*k+'px';stage.style.height=spec.height*k+'px';stage.style.perspective=spec.width*k*6+'px';
   const duration=10500+index*650,start=.10+(index%3)*.11,animations=[],specials=imgs.filter(i=>i.hidden);
   for(const img of imgs){const recipe=img.dataset.propPart==='coffee-splash'?['51% 22%','none','none','none']:recipes[slot.dataset.propRig]?.[img.dataset.propPart];if(!recipe)continue;const[origin,anticipation,peak,settle]=recipe;img.style.transformOrigin=origin;
    const end=slot.dataset.propRig==='globe'&&img.dataset.propPart==='earth'?'rotate(360deg)':'none';
    let frames=[{offset:0,transform:'none'},{offset:start,transform:'none'},{offset:start+.05,transform:anticipation},{offset:start+.11,transform:peak},{offset:start+.17,transform:settle},{offset:start+.24,transform:end},{offset:1,transform:end}];
    if(img.dataset.propPart==='coffee-splash'){
     // A large upward burst, outward arc and fall; no opacity interpolation.
     frames=[[0,'scale(0)'],[start+.075,'scale(.2)'],[start+.12,'translate(-2%,-18%) rotate(-12deg) scale(2.25)'],[start+.16,'translate(4%,-5%) rotate(18deg) scale(1.65)'],[start+.22,'translate(8%,28%) rotate(40deg) scale(.2)'],[1,'scale(0)']].map(([offset,transform])=>({offset,transform}));
    }else if(slot.dataset.propRig==='postbox'&&img.dataset.propPart==='letter'){
     // Spout out through the dark slot, then slide fully back below its fixed lip.
     const inside='translate(-7.5%,29%) scale(.78)',outside='translate(-7.5%,-3%) scale(.78)';
     frames=[[0,inside],[start+.035,inside],[start+.09,outside],[start+.12,outside],[start+.20,inside],[1,inside]].map(([offset,transform])=>({offset,transform}));
    }
    const animation=img.animate(frames.map(frame=>({...frame,easing:'cubic-bezier(.45,0,.25,1)'})),{duration,iterations:Infinity,easing:'linear',fill:'both'});animation.pause();animation.currentTime=0;animations.push(animation);
   }
   const r={slot,still,stage,w:spec.width,h:spec.height,duration,start,animations,specials,visible:false,running:false,frame:0};records.push(r);slot.dataset.propStatus='ready';slot.dataset.propStart=start;slot.dataset.propDuration=duration;observer.observe(slot);resize.observe(slot);update(r);
  }));
 }).catch(()=>{if(!disposed)for(const slot of region.querySelectorAll('[data-prop-rig]'))slot.dataset.propStatus='fallback';});
 return()=>{disposed=true;observer.disconnect();resize.disconnect();document.removeEventListener('visibilitychange',all);reduced.removeEventListener('change',all);for(const r of records){r.running=false;cancelAnimationFrame(r.frame);r.animations.forEach(a=>a.cancel());r.stage.remove();r.still.hidden=false;}};
}
