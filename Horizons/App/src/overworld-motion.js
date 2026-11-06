// Decorative world motion and map input only. No learner state or anatomy edits.
const mounts=new WeakMap();

export function mountOverworld(region){
 if(!region)return()=>{};
 if(mounts.has(region))return mounts.get(region);
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 let disposed=false;

 // Wheel input stays entirely native: vertical wheel scrolls the page.
 const input=new AbortController(),listen=(el,type,fn,options={})=>el.addEventListener(type,fn,{...options,signal:input.signal});
 let frame=0,held=null,started=0,last=0,drag=null,suppressClick=false;
 const stopPan=()=>{cancelAnimationFrame(frame);frame=0;held=null;};
 const tick=time=>{
  if(!held||disposed||held.hidden||held.dataset.unitHref){stopPan();return;}
  const dt=Math.min(32,time-last);last=time;
  const speed=200+440*Math.min(1,(time-started)/600);
  region.scrollLeft+=Number(held.dataset.pathPan)*speed*dt/1000;
  frame=requestAnimationFrame(tick);
 };
 for(const button of region.closest('.learning-path').querySelectorAll('[data-path-pan]')){
  let pointerUsed=false;
  listen(button,'pointerenter',event=>{if(event.pointerType==='mouse'&&!button.disabled&&!button.dataset.unitHref){stopPan();held=button;started=last=performance.now();frame=requestAnimationFrame(tick);}});
  listen(button,'pointerleave',()=>{if(held===button)stopPan();});
  listen(button,'pointerdown',event=>{
   if(event.button!==0||button.disabled)return;
   pointerUsed=true;stopPan();held=button;started=last=performance.now();
   button.setPointerCapture(event.pointerId);frame=requestAnimationFrame(tick);
  });
  listen(button,'pointerup',event=>{if(event.pointerType==='mouse'&&button.matches(':hover'))return;if(held&&performance.now()-started<150)region.scrollBy({left:Number(button.dataset.pathPan)*180,behavior:reduced.matches?'instant':'smooth'});stopPan();});
  for(const type of ['pointercancel','lostpointercapture'])listen(button,type,stopPan);
  listen(button,'click',event=>{
   event.preventDefault();
   if(button.dataset.unitHref){stopPan();location.assign(button.dataset.unitHref);return;}
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
 const dispose=()=>{disposed=true;stopPan();endDrag();input.abort();mounts.delete(region);};mounts.set(region,dispose);return dispose;
}
