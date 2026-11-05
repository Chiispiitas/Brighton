// Avatar-only motion: editor preview and selected path portrait. Native art stays intact.
const mounts=new WeakMap();
export function requestAvatarFeedback(element,kind='select'){
 if(!element)return;element.dataset.pendingAvatarFeedback=kind;
 element.dispatchEvent(new CustomEvent('hzn-avatar-feedback',{detail:kind}));
}
export function mountAvatarMotion(element,{frame,idle,feedback,face,eyes,closed,pupils}){
 mounts.get(element)?.dispose();
 const reduced=matchMedia('(prefers-reduced-motion: reduce)'),input=new AbortController();
 let disposed=false,visible=false,ready=false,raf=0,idleAnimation,effect;
 const gaze=(x=0,y=0)=>{face.style.transform=`translate(${x*.18/3.2}cqw,${y*.18/3.2}cqw)`;for(const pupil of pupils)pupil.style.transform=`translate(${x/3.2}cqw,${y/3.2}cqw)`;};
 const reset=()=>{eyes.hidden=false;closed.hidden=true;gaze();frame.dataset.avatarBlink='open';};
 const draw=()=>{
  if(disposed)return;
  if(!visible||document.hidden||reduced.matches){sync();return;}
  const t=(idleAnimation?.currentTime||0)%5200,blink=t>=4200&&t<4340;
  eyes.hidden=blink;closed.hidden=!blink;frame.dataset.avatarBlink=blink?'closed':'open';
  // Rest, glance right, settle, glance left, settle. A shared clock also drives blinking.
  const keys=[[0,0,0],[800,0,0],[1350,2.5,-.5],[2100,2.5,-.5],[2550,0,0],[3050,0,0],[3550,-2.5,.7],[4050,-2.5,.7],[4650,0,0],[5200,0,0]];
  const next=keys.findIndex(k=>k[0]>t),a=keys[Math.max(0,next-1)],b=keys[next]||keys.at(-1),u=(t-a[0])/(b[0]-a[0]||1),e=u*u*(3-2*u);
  gaze(a[1]+(b[1]-a[1])*e,a[2]+(b[2]-a[2])*e);
  raf=requestAnimationFrame(draw);
 };
 const sync=()=>{
  cancelAnimationFrame(raf);
  if(disposed)return;
  if(reduced.matches){idleAnimation?.cancel();idleAnimation=null;effect?.cancel();reset();frame.dataset.avatarMotion='reduced';return;}
  if(!ready||!visible||document.hidden){idleAnimation?.pause();effect?.cancel();reset();return;}
  idleAnimation??=idle.animate([{transform:'scale(.997,.995)'},{transform:'scale(1)'},{transform:'scale(.997,.995)'}],{duration:5200,iterations:Infinity,easing:'ease-in-out'});
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
export async function jumpAvatarIntoIsland(source,target){
 if(!source||!target||matchMedia('(prefers-reduced-motion: reduce)').matches)return true;
 const a=source.getBoundingClientRect(),b=target.getBoundingClientRect();if(!a.width||!a.height)return true;
 const ghost=source.cloneNode(true);ghost.removeAttribute('id');ghost.setAttribute('aria-hidden','true');ghost.style.cssText=`position:fixed;left:${a.left}px;top:${a.top}px;width:${a.width}px;height:${a.height}px;z-index:85;pointer-events:none;border-radius:50%;overflow:hidden;opacity:1;background:${getComputedStyle(source).backgroundColor}`;
 document.body.append(ghost);source.style.visibility='hidden';
 const dx=b.left+b.width/2-a.left-a.width/2,dy=b.top+b.height/2-a.top-a.height/2;
 const animation=ghost.animate([{transform:'translate(0,0) scale(1)'},{transform:'translate(0,-10px) scale(.98,1.02)',offset:.3},{transform:`translate(${dx}px,${dy}px) scale(.88)`,offset:.84},{transform:`translate(${dx}px,${dy}px) scale(.94,.88)`}],{duration:440,easing:'cubic-bezier(.3,.4,.5,1)',fill:'forwards'});
 const input=new AbortController(),cancel=()=>animation.cancel(),selection=source.closest('.path-player')?.dataset.selectedNode;let guardFrame;
 const guard=()=>{if(!source.isConnected||document.hidden||source.closest('.path-player')?.dataset.selectedNode!==selection){cancel();return;}if(matchMedia('(prefers-reduced-motion: reduce)').matches){animation.finish();return;}guardFrame=requestAnimationFrame(guard);};guardFrame=requestAnimationFrame(guard);
 const observer=new MutationObserver(()=>{if(!source.isConnected)cancel();});observer.observe(document.body,{subtree:true,childList:true});
 document.addEventListener('keydown',e=>{if(e.key==='Escape')cancel();},{signal:input.signal});document.addEventListener('visibilitychange',()=>{if(document.hidden)cancel();},{signal:input.signal});
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');reduced.addEventListener('change',()=>{if(reduced.matches)animation.finish();},{signal:input.signal});
 try{await animation.finished;return source.isConnected;}catch{return false;}finally{input.abort();observer.disconnect();cancelAnimationFrame(guardFrame);animation.cancel();ghost.remove();source.style.visibility='';}
}
