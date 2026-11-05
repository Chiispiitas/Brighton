// Avatar-only motion: editor preview and selected path portrait. Native art stays intact.
const mounts=new WeakMap();
export function requestAvatarFeedback(element,kind='select'){
 if(!element)return;element.dataset.pendingAvatarFeedback=kind;
 element.dispatchEvent(new CustomEvent('hzn-avatar-feedback',{detail:kind}));
}
export function mountAvatarMotion(element,{frame,idle,feedback,open,closed}){
 mounts.get(element)?.dispose();
 const reduced=matchMedia('(prefers-reduced-motion: reduce)'),input=new AbortController();
 let disposed=false,visible=false,ready=false,raf=0,idleAnimation,effect;
 const reset=()=>{open.hidden=false;closed.hidden=true;frame.dataset.avatarBlink='open';};
 const draw=()=>{
  if(disposed)return;
  if(!visible||document.hidden||reduced.matches){sync();return;}
  const t=(idleAnimation?.currentTime||0)%5200,blink=t>=4200&&t<4340;
  open.hidden=blink;closed.hidden=!blink;frame.dataset.avatarBlink=blink?'closed':'open';
  raf=requestAnimationFrame(draw);
 };
 const sync=()=>{
  cancelAnimationFrame(raf);
  if(disposed)return;
  if(reduced.matches){idleAnimation?.cancel();idleAnimation=null;effect?.cancel();reset();frame.dataset.avatarMotion='reduced';return;}
  if(!ready||!visible||document.hidden){idleAnimation?.pause();effect?.cancel();reset();return;}
  idleAnimation??=idle.animate([{transform:'translateY(0)'},{transform:'translateY(-.35%)'},{transform:'translateY(0)'}],{duration:5200,iterations:Infinity,easing:'ease-in-out'});
  idleAnimation.play();frame.dataset.avatarMotion='minimal';draw();
 };
 const bounce=kind=>{
  if(!ready||!visible)return;
  delete element.dataset.pendingAvatarFeedback;
  if(disposed||reduced.matches||document.hidden)return;
  effect?.cancel();const height=kind==='customize'?'-2%':'-8%';
  effect=feedback.animate([{transform:'translateY(0) scale(1)'},{transform:`translateY(${height}) scale(.99,1.018)`,offset:.38},{transform:'translateY(0) scale(1.015,.99)',offset:.72},{transform:'translateY(0) scale(1)'}],{duration:kind==='customize'?420:460,easing:'cubic-bezier(.2,.7,.3,1)'});
 };
 const observer=new IntersectionObserver(entries=>{visible=entries[0]?.isIntersecting===true;sync();if(visible&&element.dataset.pendingAvatarFeedback)bounce(element.dataset.pendingAvatarFeedback);},{threshold:.01});observer.observe(element);
 element.addEventListener('hzn-avatar-feedback',event=>{if(ready)bounce(event.detail);},{signal:input.signal});
 reduced.addEventListener('change',sync);document.addEventListener('visibilitychange',sync,{signal:input.signal});
 const controller={ready:closed.querySelector('img').decode().then(()=>{ready=true;sync();if(element.dataset.pendingAvatarFeedback&&visible)bounce(element.dataset.pendingAvatarFeedback);}).catch(()=>{reset();frame.dataset.avatarMotion='fallback';}),dispose(){if(disposed)return;disposed=true;observer.disconnect();input.abort();reduced.removeEventListener('change',sync);cancelAnimationFrame(raf);idleAnimation?.cancel();effect?.cancel();reset();mounts.delete(element);}};
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
