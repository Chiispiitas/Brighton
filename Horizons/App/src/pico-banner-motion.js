// New, isolated trial. All artwork comes from the documented ImageGen parts.
// Feet/body stay fixed. Head/neck and map+both grips share one 8-second clock.
const controllers=new WeakMap();
const source=new URL('../assets/art/pico-banner-motion-v1/',import.meta.url);
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
export function mountBannerPico(slot){
 if(controllers.has(slot))return controllers.get(slot);
 const fallback=slot.querySelector(':scope > .character-art');
 const originalSource=slot.dataset.anatomySource;
 const stage=document.createElement('span');stage.className='pico-banner-stage';stage.setAttribute('aria-hidden','true');stage.hidden=true;
 const head=document.createElement('span');head.className='pico-banner-head pico-banner-layer';
 const body=document.createElement('img');body.className='pico-banner-body pico-banner-layer';body.src=new URL('body-registered.png',source).href;
 const map=document.createElement('img');map.className='pico-banner-map pico-banner-layer';map.src=new URL('map-registered.png',source).href;
 const open=document.createElement('img');open.src=new URL('head-registered.png',source).href;
 const blink=document.createElement('img');blink.src=new URL('blink-registered.png',source).href;blink.className='pico-banner-blink';blink.style.transformOrigin='112px 172px';blink.style.transform='scale(1.5)';blink.style.clipPath='inset(164px 0 0 0)';
 for(const image of[body,map,open,blink]){image.alt='';image.draggable=false;}
 head.append(open,blink);stage.append(head,body,map);slot.append(stage);
 let disposed=false,ready=false,visible=false,animations=[];
 const size=()=>{const r=slot.getBoundingClientRect();stage.style.setProperty('--pico-fit',Math.min(r.width/248,r.height/582));};
 const resize=new ResizeObserver(size);resize.observe(slot);size();
 const sync=()=>{
  if(disposed||!ready)return;
  if(reduced.matches){animations.forEach(a=>a.cancel());animations=[];stage.hidden=true;if(fallback)fallback.hidden=false;slot.dataset.bannerMotion='reduced';slot.dataset.anatomySource=originalSource||'complete-static-render';return;}
  stage.hidden=false;if(fallback)fallback.hidden=true;slot.dataset.bannerMotion='ready';slot.dataset.anatomySource='generated-parts-pico-banner-v1';
  if(!animations.length){
   const timing={duration:8000,iterations:Infinity,easing:'linear'};
   animations=[
    head.animate([{transform:'rotate(0deg)',offset:0},{transform:'rotate(2.8deg)',offset:.24},{transform:'rotate(2.8deg)',offset:.32},{transform:'rotate(0deg)',offset:.5},{transform:'rotate(-1.2deg)',offset:.74},{transform:'rotate(0deg)',offset:1}].map(frame=>({...frame,easing:'ease-in-out'})),timing),
    map.animate([{transform:'translateY(0px) rotate(0deg)',offset:0},{transform:'translateY(1.6px) rotate(-.9deg)',offset:.24},{transform:'translateY(0px) rotate(0deg)',offset:.5},{transform:'translateY(.8px) rotate(.6deg)',offset:.74},{transform:'translateY(0px) rotate(0deg)',offset:1}].map(frame=>({...frame,easing:'ease-in-out'})),timing),
    blink.animate([{opacity:0,offset:0},{opacity:0,offset:.285},{opacity:1,offset:.294},{opacity:1,offset:.302},{opacity:0,offset:.312},{opacity:0,offset:.745},{opacity:1,offset:.754},{opacity:1,offset:.762},{opacity:0,offset:.772},{opacity:0,offset:1}],{...timing,easing:'linear'})
   ];
   // Explicit common start time avoids independent limb/timeline drift.
   const start=document.timeline.currentTime;for(const animation of animations)animation.startTime=start;
  }
  for(const animation of animations)(visible&&!document.hidden)?animation.play():animation.pause();
  slot.dataset.motionPaused=String(!visible||document.hidden);
 };
 const intersection=new IntersectionObserver(entries=>{visible=entries[0]?.isIntersecting===true;sync();},{threshold:.05});intersection.observe(slot);
 reduced.addEventListener('change',sync);document.addEventListener('visibilitychange',sync);
 const controller={get animations(){return animations;},dispose(){disposed=true;animations.forEach(a=>a.cancel());animations=[];resize.disconnect();intersection.disconnect();reduced.removeEventListener('change',sync);document.removeEventListener('visibilitychange',sync);stage.remove();if(fallback)fallback.hidden=false;if(originalSource)slot.dataset.anatomySource=originalSource;else delete slot.dataset.anatomySource;delete slot.dataset.bannerMotion;delete slot.dataset.motionPaused;controllers.delete(slot);}};
 controllers.set(slot,controller);
 controller.ready=Promise.all([body,map,open,blink].map(image=>image.decode())).then(()=>{if(disposed||!slot.isConnected)return;ready=true;sync();}).catch(()=>{if(!disposed){stage.hidden=true;if(fallback)fallback.hidden=false;slot.dataset.bannerMotion='fallback';}});
 return controller;
}
export function unmountBannerPico(slot){controllers.get(slot)?.dispose();}
