// Avatar-only motion: editor preview and selected path portrait. Native art stays intact.
const mounts=new WeakMap();
export function requestAvatarFeedback(element,kind='select'){
 if(!element)return;element.dataset.pendingAvatarFeedback=kind;
 element.dispatchEvent(new CustomEvent('hzn-avatar-feedback',{detail:kind}));
}
export function mountAvatarMotion(element,{frame,idle,feedback,face,eyes,closed,pupils,eyewear}){
 mounts.get(element)?.dispose();
 const reduced=matchMedia('(prefers-reduced-motion: reduce)'),input=new AbortController();
 let disposed=false,visible=false,ready=false,raf=0,idleAnimation,effect;
 const gaze=(x=0,y=0)=>{face.style.transform=`translate(${x*.4/3.2}cqw,${y*.4/3.2}cqw)`;if(eyewear)eyewear.style.transform=face.style.transform;for(const pupil of pupils)pupil.style.transform=`translate(${x/3.2}cqw,${y/3.2}cqw)`;};
 const reset=()=>{eyes.hidden=false;closed.hidden=true;gaze();frame.dataset.avatarBlink='open';};
 const draw=()=>{
  if(disposed)return;
  if(!visible||document.hidden||reduced.matches){sync();return;}
  const t=(idleAnimation?.currentTime||0)%5200,blink=t>=4200&&t<4340;
  eyes.hidden=blink;closed.hidden=!blink;frame.dataset.avatarBlink=blink?'closed':'open';
  // Longer rests and slower, unequal glances; breathing/blinking retain their own period.
  const lookTime=(idleAnimation?.currentTime||0)%30000;
  const keys=[[0,0,0],[4000,0,0],[5400,2.5,-.4],[6500,2.5,-.4],[8200,0,0],[12400,0,0],[14200,-1.9,-.8],[15300,-1.9,-.8],[16900,0,0],[23200,0,0],[24800,1.1,1.2],[25700,1.1,1.2],[27600,0,0],[30000,0,0]];
  const next=keys.findIndex(k=>k[0]>lookTime),a=keys[Math.max(0,next-1)],b=keys[next]||keys.at(-1),u=(lookTime-a[0])/(b[0]-a[0]||1),e=u*u*(3-2*u);
  gaze(a[1]+(b[1]-a[1])*e,a[2]+(b[2]-a[2])*e);
  raf=requestAnimationFrame(draw);
 };
 const sync=()=>{
  cancelAnimationFrame(raf);
  if(disposed)return;
  if(reduced.matches){idleAnimation?.cancel();idleAnimation=null;effect?.cancel();reset();frame.dataset.avatarMotion='reduced';return;}
  if(!ready||!visible||document.hidden){idleAnimation?.pause();effect?.cancel();reset();return;}
  idleAnimation??=idle.animate([{transform:'scale(.994,.98)'},{transform:'scale(1)'},{transform:'scale(.994,.98)'}],{duration:5200,iterations:Infinity,easing:'ease-in-out'});
  idleAnimation.play();frame.dataset.avatarMotion='minimal';draw();
 };
 const bounce=kind=>{
  if(!ready||!visible)return;
  delete element.dataset.pendingAvatarFeedback;
  if(disposed||reduced.matches||document.hidden)return;
  effect?.cancel();const custom=kind==='customize';
  effect=feedback.animate([{transform:'translateY(0) scale(1)'},{transform:`translateY(${custom?'-1%':'-2%'}) scale(${custom?'.98':'.96'})`,offset:.38},{transform:'translateY(.3%) scale(.994,.99)',offset:.72},{transform:'translateY(0) scale(1)'}],{duration:custom?420:460,easing:'cubic-bezier(.2,.7,.3,1)'});
 };
 const observer=new IntersectionObserver(entries=>{visible=entries[0]?.isIntersecting===true;sync();if(visible&&element.dataset.pendingAvatarFeedback)bounce(element.dataset.pendingAvatarFeedback);},{threshold:.01});observer.observe(element);
 element.addEventListener('hzn-avatar-feedback',event=>{if(ready)bounce(event.detail);},{signal:input.signal});
 reduced.addEventListener('change',sync);document.addEventListener('visibilitychange',sync,{signal:input.signal});
 const controller={ready:Promise.resolve().then(()=>{if(disposed)return;ready=true;sync();if(element.dataset.pendingAvatarFeedback&&visible)bounce(element.dataset.pendingAvatarFeedback);}),dispose(){if(disposed)return;disposed=true;observer.disconnect();input.abort();reduced.removeEventListener('change',sync);cancelAnimationFrame(raf);idleAnimation?.cancel();effect?.cancel();reset();mounts.delete(element);}};
 mounts.set(element,controller);return controller;
}
