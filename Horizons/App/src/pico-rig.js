const mounts = new WeakMap();
let atlasPromise;
const manifestURL = new URL('../assets/art/manifest.json', import.meta.url);
const appURL = new URL('../', import.meta.url);
const css = `
.hzn-pico{position:relative;width:100%;height:100%;aspect-ratio:auto;pointer-events:none;isolation:isolate;overflow:visible}
.hzn-pico-fit{position:absolute;left:0;top:0;width:360px;height:480px;transform-origin:0 0}
.p2-actor,.p2-mass,.p2-head{position:absolute;inset:0;transform-origin:180px 445px}
.p2-mass{transform-origin:180px 375px;animation:p2-breathe 3.7s ease-in-out infinite}
.p2-head{transform-origin:180px 266px;animation:p2-look 6.1s ease-in-out infinite}
.p2-joint{position:absolute;width:0;height:0}.p2-motion{position:absolute;width:0;height:0;transform-origin:0 0}
.p2-pixels{position:absolute;overflow:hidden;display:block}.p2-pixels img{position:absolute;max-width:none!important;display:block;user-select:none}
.p2-ear-left>.p2-motion{animation:p2-ear-left 5.3s ease-in-out infinite}.p2-ear-right>.p2-motion{animation:p2-ear-right 4.7s ease-in-out infinite}
.p2-bag>.p2-motion{animation:p2-bag 3.7s ease-in-out infinite}.p2-eyes-open{animation:p2-eyes-open 5.2s steps(1,end) infinite}.p2-eyes-closed{opacity:0;animation:p2-eyes-closed 5.2s steps(1,end) infinite}
.p2-mouth-o{opacity:0}.hzn-pico[data-mood=think] .p2-mouth-smile{opacity:0}.hzn-pico[data-mood=think] .p2-mouth-o{opacity:1}
.hzn-pico[data-mood=wave] .p2-upper-right>.p2-motion{animation:p2-greet-upper 3.5s cubic-bezier(.2,.8,.2,1) both}
.hzn-pico[data-mood=wave] .p2-fore-right>.p2-motion{animation:p2-greet-paw 3.5s ease-in-out both}
.hzn-pico[data-mood=wave] .p2-actor{animation:p2-greet-body 3.5s ease-in-out both}
.hzn-pico[data-mood=think] .p2-head{animation:p2-think-head 3.6s ease-in-out both}
.hzn-pico[data-mood=think] .p2-upper-left>.p2-motion{animation:p2-think-upper 3.6s ease-in-out both}
.hzn-pico[data-mood=think] .p2-fore-left>.p2-motion{animation:p2-think-paw 3.6s ease-in-out both}
.hzn-pico[data-mood=think] .p2-ear-right>.p2-motion{animation:p2-think-ear 3.6s ease-in-out both}
.hzn-pico[data-mood=celebrate] .p2-actor{animation:p2-hop 2.8s cubic-bezier(.25,.55,.3,1) both}
.hzn-pico[data-mood=celebrate] .p2-upper-right>.p2-motion{animation:p2-success-right 2.8s ease-in-out both}
.hzn-pico[data-mood=celebrate] .p2-upper-left>.p2-motion{animation:p2-success-left 2.8s ease-in-out both}
.hzn-pico[data-mood=celebrate] .p2-fore-right>.p2-motion{animation:p2-success-paw 2.8s ease-in-out both}
.hzn-pico[data-mood=celebrate] .p2-fore-left>.p2-motion{animation:p2-success-left-paw 2.8s ease-in-out both}
.hzn-pico[data-mood=celebrate] .p2-bag>.p2-motion{animation:p2-success-bag 2.8s ease-in-out both}
.hzn-pico[data-mood=celebrate] .p2-ear-left>.p2-motion{animation:p2-success-ear 2.8s ease-in-out both}
.hzn-pico[data-mood=celebrate] .p2-ear-right>.p2-motion{animation:p2-success-ear2 2.8s ease-in-out both}
@keyframes p2-breathe{0%,100%{transform:translateY(0)scale(1)}50%{transform:translateY(-2px)scale(1.012,1.008)}}
@keyframes p2-look{0%,100%{transform:rotate(0)}28%{transform:rotate(-2deg)}62%{transform:rotate(1.2deg)}}
@keyframes p2-ear-left{0%,65%,100%{transform:rotate(0)}73%{transform:rotate(-7deg)}80%{transform:rotate(4deg)}88%{transform:rotate(-2deg)}}
@keyframes p2-ear-right{0%,55%,100%{transform:rotate(0)}66%{transform:rotate(8deg)}76%{transform:rotate(-5deg)}86%{transform:rotate(2deg)}}
@keyframes p2-bag{0%,100%{transform:rotate(0)}50%{transform:rotate(-2deg)}}
@keyframes p2-eyes-open{0%,38%,41%,85%,88%,100%{opacity:1}39%,40%,86%,87%{opacity:0}}
@keyframes p2-eyes-closed{0%,38%,41%,85%,88%,100%{opacity:0}39%,40%,86%,87%{opacity:1}}
@keyframes p2-greet-upper{0%,100%{transform:rotate(0)}9%{transform:rotate(7deg)}23%,78%{transform:rotate(-58deg)}90%{transform:rotate(6deg)}}
@keyframes p2-greet-paw{0%,100%{transform:rotate(0)}9%{transform:rotate(6deg)}25%{transform:rotate(-24deg)}36%{transform:rotate(-43deg)}47%{transform:rotate(-17deg)}58%{transform:rotate(-40deg)}69%{transform:rotate(-18deg)}80%{transform:rotate(-28deg)}91%{transform:rotate(4deg)}}
@keyframes p2-greet-body{0%,100%{transform:rotate(0)translateY(0)}10%{transform:rotate(-1deg)translateY(3px)}25%,75%{transform:rotate(1.5deg)translateY(-3px)}90%{transform:rotate(-.5deg)translateY(1px)}}
@keyframes p2-think-head{0%,100%{transform:rotate(0)}20%,75%{transform:rotate(8deg)translateY(2px)}88%{transform:rotate(-2deg)}}
@keyframes p2-think-upper{0%,100%{transform:rotate(0)}20%,75%{transform:rotate(-90deg)}87%{transform:rotate(4deg)}}
@keyframes p2-think-paw{0%,100%{transform:rotate(0)}20%,75%{transform:rotate(30deg)}87%{transform:rotate(-3deg)}}
@keyframes p2-think-ear{0%,100%{transform:rotate(0)}25%,70%{transform:rotate(13deg)}85%{transform:rotate(-5deg)}}
@keyframes p2-hop{0%,100%{transform:translate(0,0)scale(1)rotate(0)}12%{transform:translate(-2px,6px)scale(1.04,.94)rotate(-2deg)}30%{transform:translate(7px,-27px)scale(.98,1.03)rotate(2deg)}45%{transform:translate(3px,2px)scale(1.04,.96)rotate(-1deg)}62%{transform:translate(-4px,-13px)scale(.99,1.02)rotate(-2deg)}78%{transform:translate(0,2px)scale(1.02,.98)rotate(.5deg)}91%{transform:translate(0,-2px)scale(1)}}
@keyframes p2-success-right{0%,100%{transform:rotate(0)}15%,65%{transform:rotate(-75deg)}80%{transform:rotate(7deg)}}
@keyframes p2-success-left{0%,100%{transform:rotate(0)}18%,65%{transform:rotate(42deg)}82%{transform:rotate(-5deg)}}
@keyframes p2-success-paw{0%,100%{transform:rotate(0)}20%,65%{transform:rotate(-25deg)}83%{transform:rotate(5deg)}}
@keyframes p2-success-left-paw{0%,100%{transform:rotate(0)}20%,65%{transform:rotate(-80deg)}83%{transform:rotate(5deg)}}
@keyframes p2-success-bag{0%,100%{transform:rotate(0)}17%{transform:rotate(8deg)}34%{transform:rotate(-11deg)}49%{transform:rotate(10deg)}65%{transform:rotate(-7deg)}80%{transform:rotate(4deg)}}
@keyframes p2-success-ear{0%,100%{transform:rotate(0)}17%{transform:rotate(-9deg)}32%{transform:rotate(8deg)}47%{transform:rotate(-12deg)}65%{transform:rotate(6deg)}82%{transform:rotate(-3deg)}}
@keyframes p2-success-ear2{0%,100%{transform:rotate(0)}20%{transform:rotate(12deg)}35%{transform:rotate(-8deg)}50%{transform:rotate(15deg)}68%{transform:rotate(-7deg)}84%{transform:rotate(3deg)}}
@media(prefers-reduced-motion:reduce){.hzn-pico *{animation:none!important}.hzn-pico .p2-eyes-closed{opacity:0!important}.hzn-pico .p2-eyes-open{opacity:1!important}}
`;
function installStyle(){if(document.getElementById('hzn-pico-style'))return;const s=document.createElement('style');s.id='hzn-pico-style';s.textContent=css;document.head.append(s);}
function artManifest(){return atlasPromise??=(fetch(manifestURL).then(r=>{if(!r.ok)throw Error('Pico art failed to load');return r.json();}));}
export function unmountPico(element){mounts.get(element)?.dispose();mounts.delete(element);}
export function mountPico(element,{mood='idle',manifest}={}){
 installStyle();unmountPico(element);let disposed=false,timer;const observers=[];
 const state={dispose(){disposed=true;clearTimeout(timer);for(const o of observers)o.disconnect();element.removeEventListener('pointerenter',greet);element.removeEventListener('focusin',greet);element.replaceChildren();},setMood(next){if(!state.frame)return;clearTimeout(timer);state.frame.dataset.mood='idle';void state.frame.offsetWidth;state.frame.dataset.mood=next==='hello'?'wave':next;const ms=next==='celebrate'?2850:3700;if(next!=='idle')timer=setTimeout(()=>{if(!disposed&&state.frame)state.frame.dataset.mood='idle';},ms);}};
 const greet=()=>state.setMood('wave');element.addEventListener('pointerenter',greet);element.addEventListener('focusin',greet);mounts.set(element,state);
 Promise.resolve(manifest||artManifest()).then(data=>{
  if(disposed)return;const parts=data.pico.parts;
  const frame=document.createElement('div');frame.className='hzn-pico';frame.setAttribute('aria-hidden','true');const fit=document.createElement('div');fit.className='hzn-pico-fit';const actor=document.createElement('div');actor.className='p2-actor';fit.append(actor);frame.append(fit);element.replaceChildren(frame);state.frame=frame;
  function joint(parent,cls,name,x,y,w,h,pinX=.5,pinY=.1,z=1){
   const a=parts[name];if(!a)throw Error('Missing Pico part '+name);const box=a.frame,scale=Math.min(w/box.w,h/box.h),ww=box.w*scale,hh=box.h*scale;
   const anchor=document.createElement('div');anchor.className='p2-joint '+cls;anchor.style.cssText=`left:${x}px;top:${y}px;z-index:${z}`;
   const movement=document.createElement('div');movement.className='p2-motion';const crop=document.createElement('span');crop.className='p2-pixels';crop.style.cssText=`left:${-ww*pinX}px;top:${-hh*pinY}px;width:${ww}px;height:${hh}px`;
   const img=document.createElement('img');img.src=new URL(a.src,appURL).href;img.alt='';img.draggable=false;img.decoding='async';img.style.cssText=`width:${a.atlas.width*scale}px;height:${a.atlas.height*scale}px;left:${-box.x*scale}px;top:${-box.y*scale}px`;
   crop.append(img);movement.append(crop);anchor.append(movement);parent.append(anchor);return movement;
  }
  joint(actor,'p2-leg-left','legLeft',165,367,83,99,.7,.1,1);
  joint(actor,'p2-leg-right','legRight',197,367,83,99,.3,.1,1);
  const mass=document.createElement('div');mass.className='p2-mass';mass.style.zIndex='2';actor.append(mass);
  const left=joint(mass,'p2-upper-left','upperArmLeft',140,285,70,82,.78,.12,6);
  joint(left,'p2-fore-left','forearmLeft',-49,62,64,44,.14,.8,1);
  const right=joint(mass,'p2-upper-right','upperArmRight',220,284,62,82,.24,.12,3);
  joint(right,'p2-fore-right','forearmRight',34,63,67,53,.12,.87,1);
  joint(mass,'p2-torso','torso',180,276,146,171,.5,.17,2);
  joint(mass,'p2-strap','strap',179,319,99,116,.5,.5,4);
  joint(mass,'p2-bag','satchel',141,357,88,79,.55,.1,7);
  const head=document.createElement('div');head.className='p2-head';head.style.zIndex='8';mass.append(head);
  joint(head,'p2-ear-left','earLeft',145,162,58,146,.52,.95,1);
  joint(head,'p2-ear-right','earRight',202,162,91,102,.25,.94,1);
  joint(head,'p2-head-base','head',180,268,180,149,.5,.88,2);
  joint(head,'p2-eyes-open','eyesOpen',177,194,111,63,.5,.5,3);
  joint(head,'p2-eyes-closed','eyesClosed',177,194,111,63,.5,.5,3);
  joint(head,'p2-mouth-smile','mouthSmile',205,244,34,29,.5,.5,3);
  joint(head,'p2-mouth-o','mouthO',205,244,15,22,.5,.5,3);
  const resize=()=>{const r=frame.getBoundingClientRect(),scale=Math.min(r.width/360,r.height/480);fit.style.transform=`translate(${(r.width-360*scale)/2}px,${r.height-460*scale}px)scale(${scale})`;};const ro=new ResizeObserver(resize);ro.observe(frame);observers.push(ro);
  resize();frame.dataset.ready='true';state.setMood(mood);
 }).catch(error=>{if(!disposed){element.dataset.picoError='true';console.error(error);}});
 return()=>unmountPico(element);
}
