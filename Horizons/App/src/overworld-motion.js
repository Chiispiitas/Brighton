// Decorative world motion and map input only. No learner state or anatomy edits.
const mounts=new WeakMap();

export function mountOverworld(region,{onPreview=()=>{},onLeave=()=>{}}={}){
 if(!region)return()=>{};
 if(mounts.has(region))return mounts.get(region);
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const fauna=[...region.querySelectorAll('.world-fauna > img')].filter(img=>!img.closest('.avatar,.character'));
 let disposed=false,visible=false,animations=[];

 // Wheel input stays entirely native: vertical wheel scrolls the page.
 const input=new AbortController(),listen=(el,type,fn,options={})=>el.addEventListener(type,fn,{...options,signal:input.signal});
 let frame=0,held=null,started=0,last=0,drag=null,suppressClick=false;
 const stopPan=()=>{cancelAnimationFrame(frame);frame=0;held=null;};
 const tick=time=>{
  if(!held||disposed)return;
  const dt=Math.min(32,time-last);last=time;
  const speed=200+440*Math.min(1,(time-started)/600);
  region.scrollLeft+=Number(held.dataset.pathPan)*speed*dt/1000;
  frame=requestAnimationFrame(tick);
 };
 for(const button of region.closest('.learning-path').querySelectorAll('[data-path-pan]')){
  let pointerUsed=false;
  listen(button,'pointerdown',event=>{
   if(event.button!==0||button.disabled)return;
   pointerUsed=true;stopPan();held=button;started=last=performance.now();
   button.setPointerCapture(event.pointerId);frame=requestAnimationFrame(tick);
  });
  listen(button,'pointerup',()=>{if(held&&performance.now()-started<150)region.scrollBy({left:Number(button.dataset.pathPan)*180,behavior:reduced.matches?'instant':'smooth'});stopPan();});
  for(const type of ['pointercancel','lostpointercapture'])listen(button,type,stopPan);
  listen(button,'click',event=>{
   event.preventDefault();
   if(pointerUsed&&event.detail!==0){pointerUsed=false;return;}
   region.scrollBy({left:Number(button.dataset.pathPan)*360,behavior:reduced.matches?'instant':'smooth'});
  });
 }
 listen(window,'blur',()=>{stopPan();endDrag();});
 listen(document,'visibilitychange',()=>{if(document.hidden){stopPan();endDrag();}});
 // Touch uses native momentum scrolling; mouse users can also grab and drag.
 listen(region,'pointerdown',event=>{
  if(event.pointerType!=='mouse'||event.button!==0)return;
  drag={id:event.pointerId,x:event.clientX,left:region.scrollLeft,moved:false};
 });
 listen(window,'pointermove',event=>{
  if(!drag||event.pointerId!==drag.id)return;
  if(!(event.buttons&1)){endDrag();return;}
  const distance=event.clientX-drag.x;
  if(Math.abs(distance)>8)drag.moved=true;
  if(drag.moved){event.preventDefault();region.scrollLeft=drag.left-distance;region.classList.add('is-dragging');}
 });
 const endDrag=()=>{if(drag?.moved){suppressClick=true;setTimeout(()=>{suppressClick=false;},0);}drag=null;region.classList.remove('is-dragging');};
 listen(window,'pointerup',endDrag);listen(window,'pointercancel',endDrag);
 listen(region,'click',event=>{if(suppressClick){suppressClick=false;event.preventDefault();event.stopImmediatePropagation();}},{capture:true});
 listen(region,'dragstart',event=>event.preventDefault());
 const preview=event=>{
  if(event.type==='pointerover'&&event.pointerType==='touch')return;
  const stop=event.target.closest?.('.path-stop[data-path-node]');
  if(!stop||!region.contains(stop)||stop.contains(event.relatedTarget))return;
  onPreview(stop.dataset.pathNode);
 };
 const leave=event=>{
  if(event.type==='pointerleave'&&event.pointerType==='touch')return;
  if(event.type==='focusout'&&region.contains(event.relatedTarget))return;
  onLeave();
 };

 function flightFrames(kind,index){
  const frames=[],steps=48,amplitude=kind==='butterfly'?38:65;
  for(let i=0;i<=steps;i++){
   const t=i/steps,angle=t*Math.PI*2,wing=i%2?.76:1;
   // Closed local flight loop; full-opacity PNGs provide all anatomy.
   const x=amplitude*Math.sin(angle),y=8*(Math.cos(angle)-1)+3*Math.sin(angle*2);
   const rotate=(kind==='butterfly'?7:3)*Math.sin(angle)+(index%2?1:-1);
   const scale=kind==='butterfly'?`scaleX(${wing})`:`scaleY(${i%2?.94:1})`;
   frames.push({offset:t,transform:`translate(${x}px,${y}px) rotate(${rotate}deg) ${scale}`});
  }
  return frames;
 }
 const sync=()=>{
  if(disposed)return;
  if(reduced.matches){animations.forEach(a=>a.cancel());animations=[];return;}
  if(!visible||document.hidden){animations.forEach(a=>a.pause());return;}
  if(!animations.length){
   const clock=document.timeline.currentTime;
   animations=fauna.map((img,index)=>{
    const kind=img.parentElement.dataset.fauna==='butterfly'?'butterfly':'bird';
    const duration=(kind==='butterfly'?16000:20000)+(index%4)*1000;
    const animation=img.animate(flightFrames(kind,index),{duration,iterations:Infinity,easing:'linear'});
    // Explicit shared document clock plus a deterministic phase offset.
    animation.startTime=clock-(index*1379)%duration;
    return animation;
   });
  }
  animations.forEach(a=>a.play());
 };
 const observer=new IntersectionObserver(entries=>{visible=entries[0]?.isIntersecting===true;sync();},{threshold:.01});
 observer.observe(region);
 region.addEventListener('pointerover',preview);
 region.addEventListener('pointerleave',leave);
 region.addEventListener('focusin',preview);
 region.addEventListener('focusout',leave);
 reduced.addEventListener('change',sync);
 document.addEventListener('visibilitychange',sync);

 const dispose=()=>{
  if(disposed)return;disposed=true;
  observer.disconnect();animations.forEach(a=>a.cancel());animations=[];
  stopPan();input.abort();drag=null;
  region.removeEventListener('pointerover',preview);
  region.removeEventListener('pointerleave',leave);
  region.removeEventListener('focusin',preview);
  region.removeEventListener('focusout',leave);
  reduced.removeEventListener('change',sync);
  document.removeEventListener('visibilitychange',sync);
  mounts.delete(region);
 };
 mounts.set(region,dispose);
 return dispose;
}
