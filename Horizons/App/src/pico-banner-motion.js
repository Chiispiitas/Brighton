// New, isolated trial. All artwork comes from the documented ImageGen parts.
// Feet/body stay fixed. Head/neck and map+both grips share one 14-second clock.
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
 const image=(file,className='')=>{const img=document.createElement('img');img.src=new URL(file,source).href;img.className=className;img.alt='';img.draggable=false;return img;};
 const open=image('head-faceless-registered.png','pico-banner-faceless');
 const blink=image('face-blink-eyelids.png','pico-banner-blink');blink.style.transformOrigin='112px 172px';blink.style.transform='scale(1.5)';blink.hidden=true;
 const pupils=image('pupils-native.png','pico-banner-pupils');
 const expression=image('face-inspect-features.png','pico-banner-expression');expression.hidden=true;
 const eyeWhites=image('face-neutral-eyes.png');
 const neutralFeatures=image('face-neutral-brows-mouth.png');
 const nose=image('face-nose.png');
 const masks=['head-faceless-registered.png','eyes-mask.png'].map(file=>image(file));
 const group=className=>{const el=document.createElement('span');el.className=className;el.style.cssText='position:absolute;inset:0';return el;};
 const face=group('pico-banner-face-mask'),neutral=group('pico-banner-neutral'),eyes=group('pico-banner-open-eyes'),pupilMask=group('pico-banner-eye-mask');
 const mask=(el,file)=>{el.style.cssText+=';mask-image:url("'+new URL(file,source).href+'");mask-size:248px 582px;mask-repeat:no-repeat;';};
 mask(face,'head-faceless-registered.png');mask(pupilMask,'eyes-mask.png');pupilMask.append(pupils);eyes.append(eyeWhites,pupilMask);neutral.append(neutralFeatures,eyes,blink);face.append(nose,neutral,expression);
 const images=[body,map,open,blink,pupils,expression,eyeWhites,neutralFeatures,nose,...masks];
 for(const img of images){img.alt='';img.draggable=false;}
 head.append(open,face);stage.append(head,body,map);slot.append(stage);
 let disposed=false,ready=false,visible=false,animations=[],faceFrame=0;
 const renderFace=()=>{
  const time=((animations[0]?.currentTime||0)%14000+14000)%14000;
  const inspecting=time>=9100&&time<12500;
  const blinking=!inspecting&&((time>=2352&&time<2496)||(time>=6032&&time<6176));
  blink.hidden=!blinking;eyes.hidden=inspecting||blinking;neutral.hidden=inspecting;expression.hidden=!inspecting;
  if(!disposed&&ready&&!stage.hidden&&visible&&!document.hidden)faceFrame=requestAnimationFrame(renderFace);
 };
 const size=()=>{const r=slot.getBoundingClientRect();stage.style.setProperty('--pico-fit',Math.min(r.width/248,r.height/582));};
 const resize=new ResizeObserver(size);resize.observe(slot);size();
 const sync=()=>{
  if(disposed||!ready)return;
  cancelAnimationFrame(faceFrame);faceFrame=0;
  if(reduced.matches){animations.forEach(a=>a.cancel());animations=[];stage.hidden=true;if(fallback)fallback.hidden=false;slot.dataset.bannerMotion='reduced';slot.dataset.anatomySource=originalSource||'complete-static-render';return;}
  stage.hidden=false;if(fallback)fallback.hidden=true;slot.dataset.bannerMotion='ready';slot.dataset.anatomySource='generated-parts-pico-banner-v1';
  if(!animations.length){
   // One complete eight-second idle, then a six-second closer inspection.
   // One shared clock means pausing does not advance the idle counter.
   const duration=14000,timing={duration,iterations:Infinity,easing:'linear'};
   const track=(idle,action)=>{const frames=[];for(let loop=0;loop<1;loop++)for(const [t,value]of idle)frames.push({offset:(loop*8000+t)/duration,transform:value,easing:'ease-in-out'});for(const[t,value]of action)frames.push({offset:t/duration,transform:value,easing:'cubic-bezier(.34,1.3,.64,1)'});return frames;};
   const headRest='translateY(0px) rotate(0deg) scale(1,1)',mapRest='translateY(0px) rotate(0deg) scale(1)';
   const headIdle=[[0,headRest],[1920,'rotate(2.8deg)'],[2560,'rotate(2.8deg)'],[4000,headRest],[5920,'rotate(-1.2deg)'],[8000,headRest]];
   const mapIdle=[[0,mapRest],[1920,'translateY(1.6px) rotate(-.9deg)'],[4000,mapRest],[5920,'translateY(.8px) rotate(.6deg)'],[8000,mapRest]];
   animations=[
    head.animate(track(headIdle,[[8400,'translateY(-3px) rotate(-2deg) scale(.98,1.02)'],[9300,'translateY(9px) rotate(7deg) scale(1.025,.975)'],[9700,'translateY(7px) rotate(6deg) scale(1,1)'],[11700,'translateY(7px) rotate(6deg) scale(1,1)'],[12800,'translateY(-2px) rotate(-1deg) scale(.99,1.01)'],[14000,headRest]]),timing),
    map.animate(track(mapIdle,[[8400,'translateY(4px) rotate(1deg) scale(.98)'],[9300,'translateY(-49px) rotate(-3deg) scale(.96,1.03)'],[9700,'translateY(-45px) rotate(-2deg) scale(.96,1.02)'],[11700,'translateY(-45px) rotate(-2deg) scale(.96,1.02)'],[12800,'translateY(2px) rotate(.5deg) scale(.99)'],[14000,mapRest]]),timing),
    pupils.animate(track([[0,'translate(0,0)'],[1600,'translate(1px,1px)'],[3600,'translate(-2px,1px)'],[6200,'translate(1px,0)'],[8000,'translate(0,0)']],[[9000,'translate(0,2px)'],[13000,'translate(0,0)'],[14000,'translate(0,0)']]),timing)
   ];
   // Explicit common start time avoids independent limb/timeline drift.
   const start=document.timeline.currentTime;for(const animation of animations)animation.startTime=start;
  }
  for(const animation of animations)(visible&&!document.hidden)?animation.play():animation.pause();
  renderFace();
  slot.dataset.motionPaused=String(!visible||document.hidden);
 };
 const intersection=new IntersectionObserver(entries=>{visible=entries[0]?.isIntersecting===true;sync();},{threshold:.05});intersection.observe(slot);
 reduced.addEventListener('change',sync);document.addEventListener('visibilitychange',sync);
 const controller={get animations(){return animations;},dispose(){disposed=true;cancelAnimationFrame(faceFrame);animations.forEach(a=>a.cancel());animations=[];resize.disconnect();intersection.disconnect();reduced.removeEventListener('change',sync);document.removeEventListener('visibilitychange',sync);stage.remove();if(fallback)fallback.hidden=false;if(originalSource)slot.dataset.anatomySource=originalSource;else delete slot.dataset.anatomySource;delete slot.dataset.bannerMotion;delete slot.dataset.motionPaused;controllers.delete(slot);}};
 controllers.set(slot,controller);
 controller.ready=Promise.all(images.map(image=>image.decode())).then(()=>{if(disposed||!slot.isConnected)return;ready=true;sync();}).catch(()=>{if(!disposed){stage.hidden=true;if(fallback)fallback.hidden=false;slot.dataset.bannerMotion='fallback';}});
 return controller;
}
export function unmountBannerPico(slot){controllers.get(slot)?.dispose();}
