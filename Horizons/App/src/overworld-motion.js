// Decorative world motion and map input only. No learner state or anatomy edits.
const mounts=new WeakMap();

export function mountOverworld(region,{onPreview=()=>{},onLeave=()=>{}}={}){
 if(!region)return()=>{};
 if(mounts.has(region))return mounts.get(region);
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const fauna=[...region.querySelectorAll('.world-fauna > img')].filter(img=>!img.closest('.avatar,.character'));
 let disposed=false,visible=false,animations=[];

 const wheel=event=>{
  // Preserve browser zoom, Shift+wheel and native horizontal/diagonal trackpads.
  if(event.defaultPrevented||event.ctrlKey||event.metaKey||event.shiftKey||event.deltaX!==0||!event.deltaY||!event.cancelable)return;
  const unit=event.deltaMode===1?32:event.deltaMode===2?region.clientWidth:1;
  const delta=event.deltaY*unit,max=Math.max(0,region.scrollWidth-region.clientWidth);
  const next=Math.max(0,Math.min(max,region.scrollLeft+delta));
  // At either edge, leave the event untouched so ordinary page scroll continues.
  if(Math.abs(next-region.scrollLeft)<.5)return;
  event.preventDefault();region.scrollLeft=next;
 };
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
 region.addEventListener('wheel',wheel,{passive:false});
 region.addEventListener('pointerover',preview);
 region.addEventListener('pointerleave',leave);
 region.addEventListener('focusin',preview);
 region.addEventListener('focusout',leave);
 reduced.addEventListener('change',sync);
 document.addEventListener('visibilitychange',sync);

 const dispose=()=>{
  if(disposed)return;disposed=true;
  observer.disconnect();animations.forEach(a=>a.cancel());animations=[];
  region.removeEventListener('wheel',wheel);
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
