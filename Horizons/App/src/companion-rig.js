// Articulated native ImageGen parts. No character geometry is drawn in code.
const mounts=new WeakMap();
const appURL=new URL('../',import.meta.url);
const css=`
.hzn-human{position:relative;width:100%;height:100%;overflow:visible;isolation:isolate;pointer-events:none}
.human-fit{position:absolute;width:360px;height:560px;transform-origin:0 0}
.human-actor,.human-body,.human-head{position:absolute;inset:0;transform-origin:180px 505px}
.human-body{transform-origin:180px 320px}.human-head{z-index:8;transform-origin:180px 175px}
.human-joint{position:absolute;width:0;height:0}.human-motion{position:absolute;width:0;height:0;transform-origin:0 0}
.human-pixels{position:absolute;display:block;overflow:hidden}.human-pixels>img{position:absolute;max-width:none!important;max-height:none!important;pointer-events:none;display:block}
.human-eyes-open{animation:human-open var(--blink,5.3s) steps(1,end) infinite}.human-eyes-closed{opacity:0;animation:human-closed var(--blink,5.3s) steps(1,end) infinite}
.human-mouth-talk{opacity:0}.human-mouth-smile{animation:human-smile 11s steps(1,end) infinite}.human-mouth-talk{animation:human-talk 11s steps(1,end) infinite}
.human-mina .human-head{animation:mina-look 9s ease-in-out infinite}.human-mina .human-upper-left>.human-motion{animation:mina-map-arm 9s ease-in-out infinite}.human-mina .human-fore-left>.human-motion{animation:mina-map-wrist 9s ease-in-out infinite}.human-mina .human-upper-right>.human-motion{animation:mina-point 9s ease-in-out infinite}.human-mina .human-fore-right>.human-motion{animation:mina-point-wrist 9s ease-in-out infinite}
.human-alex .human-head{animation:alex-rhythm 6.4s ease-in-out infinite}.human-alex .human-upper-left>.human-motion{animation:alex-ear 10s ease-in-out infinite}.human-alex .human-fore-left>.human-motion{animation:alex-listen 10s ease-in-out infinite}.human-alex .human-fore-right>.human-motion{animation:alex-tap 3.2s ease-in-out infinite}.human-alex .human-leg-left>.human-motion{animation:alex-foot 3.2s ease-in-out infinite}
.human-jo .human-head{animation:jo-nod 8.2s ease-in-out infinite}.human-jo .human-upper-right>.human-motion{animation:jo-offer 8.2s ease-in-out infinite}.human-jo .human-fore-right>.human-motion{animation:jo-cup 8.2s ease-in-out infinite}.human-jo .human-fore-left>.human-motion{animation:jo-polish 8.2s ease-in-out infinite}
.hzn-human[data-mood=wave] .human-upper-right>.human-motion{animation:human-wave-upper 3.3s ease-in-out both}.hzn-human[data-mood=wave] .human-fore-right>.human-motion{animation:human-wave-wrist 3.3s ease-in-out both}.hzn-human[data-mood=wave] .human-head{animation:human-wave-head 3.3s ease-in-out both}
.hzn-human[data-mood=celebrate] .human-upper-right>.human-motion{animation:human-cheer-right 2.7s ease-in-out both}.hzn-human[data-mood=celebrate] .human-upper-left>.human-motion{animation:human-cheer-left 2.7s ease-in-out both}.hzn-human[data-mood=celebrate] .human-fore-right>.human-motion{animation:human-cheer-paw 2.7s ease-in-out both}.hzn-human[data-mood=celebrate] .human-actor{animation:human-cheer-body 2.7s ease-in-out both}
.human-jo .human-prop>.human-motion{animation:jo-mug 8.2s ease-in-out infinite}.hzn-human[data-mood=celebrate] .human-fore-left>.human-motion{animation:human-cheer-elbow 2.7s ease-in-out both}.hzn-human[data-mood=celebrate] .human-prop>.human-motion{animation:none;transform:rotate(150deg)}
@keyframes jo-mug{0%,20%,82%,100%{transform:rotate(33deg)}32%,65%{transform:rotate(125deg)}}@keyframes human-cheer-elbow{0%,100%{transform:rotate(0)}20%,70%{transform:rotate(70deg)}}
@keyframes human-open{0%,40%,43%,91%,94%,100%{opacity:1}41%,42%,92%,93%{opacity:0}}@keyframes human-closed{0%,40%,43%,91%,94%,100%{opacity:0}41%,42%,92%,93%{opacity:1}}
@keyframes human-smile{0%,65%,75%,100%{opacity:1}66%,74%{opacity:0}}@keyframes human-talk{0%,65%,75%,100%{opacity:0}66%,68%,70%,72%,74%{opacity:1}67%,69%,71%,73%{opacity:0}}
@keyframes mina-look{0%,20%,64%,100%{transform:rotate(0)}30%,43%{transform:rotate(7deg)}50%,55%{transform:rotate(-5deg)}}
@keyframes mina-map-arm{0%,20%,65%,100%{transform:rotate(0)}30%,52%{transform:rotate(-6deg)}}@keyframes mina-map-wrist{0%,20%,65%,100%{transform:rotate(0)}30%,52%{transform:rotate(-82deg)}}
@keyframes mina-point{0%,45%,83%,100%{transform:rotate(0)}55%,70%{transform:rotate(-20deg)}}@keyframes mina-point-wrist{0%,45%,83%,100%{transform:rotate(-15deg)}55%,70%{transform:rotate(-110deg)}}
@keyframes alex-rhythm{0%,30%,70%,100%{transform:rotate(0)}10%,50%,90%{transform:rotate(-4deg)}20%,60%{transform:rotate(3deg)}}
@keyframes alex-ear{0%,44%,84%,100%{transform:rotate(0)}56%,72%{transform:rotate(80deg)}}@keyframes alex-listen{0%,44%,84%,100%{transform:rotate(15deg)}56%,72%{transform:rotate(-160deg)}}
@keyframes alex-tap{0%,40%,100%{transform:rotate(-25deg)}15%,60%{transform:rotate(-38deg)}28%,78%{transform:rotate(-19deg)}}@keyframes alex-foot{0%,70%,100%{transform:rotate(0)}20%,45%{transform:rotate(4deg)}}
@keyframes jo-nod{0%,20%,74%,100%{transform:rotate(0)}32%,58%{transform:rotate(-5deg)}44%,65%{transform:rotate(2deg)}}
@keyframes jo-offer{0%,20%,82%,100%{transform:rotate(-13deg)}32%,65%{transform:rotate(-10deg)}}@keyframes jo-cup{0%,20%,82%,100%{transform:rotate(-20deg)}32%,65%{transform:rotate(-115deg)}}@keyframes jo-polish{0%,20%,82%,100%{transform:rotate(10deg)}32%,48%,64%{transform:rotate(-55deg)}40%,56%,72%{transform:rotate(-75deg)}}
@keyframes human-wave-upper{0%,100%{transform:rotate(0)}15%,83%{transform:rotate(-150deg)}}@keyframes human-wave-wrist{0%,100%{transform:rotate(0)}20%,42%,64%{transform:rotate(12deg)}31%,53%,75%{transform:rotate(-18deg)}}@keyframes human-wave-head{0%,100%{transform:rotate(0)}20%,75%{transform:rotate(-4deg)}}
@keyframes human-cheer-right{0%,100%{transform:rotate(0)}20%,70%{transform:rotate(-135deg)}}@keyframes human-cheer-left{0%,100%{transform:rotate(0)}20%,70%{transform:rotate(135deg)}}@keyframes human-cheer-paw{0%,100%{transform:rotate(0)}25%,65%{transform:rotate(-15deg)}}@keyframes human-cheer-body{0%,100%{transform:scale(1)}14%{transform:scale(1.02,.98)}36%{transform:scale(.99,1.015)}60%{transform:scale(1.01,.99)}}
@media(prefers-reduced-motion:reduce){.hzn-human *{animation:none!important}.hzn-human .human-eyes-open{opacity:1!important}.hzn-human .human-eyes-closed,.hzn-human .human-mouth-talk{opacity:0!important}}
`;
function install(){if(document.getElementById('hzn-human-style'))return;const style=document.createElement('style');style.id='hzn-human-style';style.textContent=css;document.head.append(style);}
export function unmountCompanion(element){mounts.get(element)?.dispose();mounts.delete(element);}
export function mountCompanion(element,{character='mina',mood='idle',manifest}={}){
 install();unmountCompanion(element);const parts=manifest?.rigs?.[character]?.parts;if(!parts)return;
 const frame=document.createElement('div');frame.className='hzn-human human-'+character;frame.style.setProperty('--blink',({mina:'5.3s',alex:'4.7s',jo:'6.1s'})[character]);frame.dataset.character=character;frame.dataset.mood=mood;
 const fit=document.createElement('div');fit.className='human-fit';const actor=document.createElement('div');actor.className='human-actor';fit.append(actor);frame.append(fit);element.replaceChildren(frame);
 function part(parent,name,x,y,w,h,pinX=.5,pinY=.1,z=1,cls=''){
  const asset=parts[name];if(!asset)return;const b=asset.frame,s=Math.min(w/b.w,h/b.h),ww=b.w*s,hh=b.h*s;
  const anchor=document.createElement('div');anchor.className='human-joint human-'+(cls||name.replace(/[A-Z]/g,l=>'-'+l.toLowerCase()));anchor.dataset.rigPart=name;anchor.style.cssText=`left:${x}px;top:${y}px;z-index:${z}`;
  const motion=document.createElement('div');motion.className='human-motion';const pixels=document.createElement('span');pixels.className='human-pixels';pixels.style.cssText=`left:${-ww*pinX}px;top:${-hh*pinY}px;width:${ww}px;height:${hh}px`;
  const image=document.createElement('img');image.src=new URL(asset.src,appURL).href;image.alt='';image.draggable=false;image.style.cssText=`width:${asset.atlas.width*s}px;height:${asset.atlas.height*s}px;left:${-b.x*s}px;top:${-b.y*s}px`;pixels.append(image);motion.append(pixels);anchor.append(motion);parent.append(anchor);return motion;
 }
 part(actor,'legLeft',166,336,78,172,.65,.1,1,'leg-left');part(actor,'legRight',195,336,78,172,.35,.1,1,'leg-right');
 const body=document.createElement('div');body.className='human-body';body.style.zIndex='2';actor.append(body);
 if(character==='mina')part(body,'accessory',141,220,90,142,.6,.15,1);
 const armL=part(body,'upperArmLeft',132,191,51,88,.6,.11,4,'upper-left');const foreL=part(armL,'forearmLeft',-13,71,36,88,.5,.08,1,'fore-left');
 const armR=part(body,'upperArmRight',225,191,51,88,.4,.11,4,'upper-right');const foreR=part(armR,'forearmRight',13,71,36,88,.5,.08,1,'fore-right');
 part(body,'torso',180,177,154,183,.5,.08,2);
 if(character==='alex'){part(body,'accessory',181,198,64,62,.5,.5,6);part(foreR,'prop',8,61,43,61,.5,.5,2);}
 if(character==='mina')part(foreL,'prop',-5,59,65,46,.5,.4,2);
 if(character==='jo'){part(foreR,'prop',14,66,49,43,.5,.5,2);part(foreL,'accessory',0,65,31,42,.5,.5,2);}
 const head=document.createElement('div');head.className='human-head';body.append(head);
 part(head,'head',180,185,139,130,.5,.90,1,'head-base');
 const face=character==='mina'?{left:182,right:215,y:122,mouthX:205,mouthY:153,mouthW:22,mouthH:16}:character==='alex'?{left:180,right:212,y:122,mouthX:204,mouthY:153,mouthW:21,mouthH:14}:{left:179,right:213,y:128,mouthX:202,mouthY:155,mouthW:22,mouthH:14};
 if(parts.eyeOpenLeft){for(const side of ['Left','Right']){const x=side==='Left'?face.left:face.right;part(head,'eyeOpen'+side,x,face.y,9,13,.5,.5,3,'eyes-open');part(head,'eyeClosed'+side,x,face.y,13,5,.5,.5,3,'eyes-closed');}}
 else{part(head,'eyesOpen',(face.left+face.right)/2,face.y,47,22,.5,.5,3,'eyes-open');part(head,'eyesClosed',(face.left+face.right)/2,face.y,47,11,.5,.5,3,'eyes-closed');}
 part(head,'mouthSmile',face.mouthX,face.mouthY,face.mouthW,face.mouthH,.5,.5,3,'mouth-smile');part(head,'mouthTalk',face.mouthX,face.mouthY,12,14,.5,.5,3,'mouth-talk');
 let timer;const state={frame,setMood(next){clearTimeout(timer);frame.dataset.mood='idle';void frame.offsetWidth;frame.dataset.mood=next;timer=setTimeout(()=>frame.dataset.mood='idle',next==='celebrate'?2800:3400);},dispose(){clearTimeout(timer);observer.disconnect();element.removeEventListener('pointerenter',greet);element.removeEventListener('focus',greet);element.replaceChildren();}};
 const resize=()=>{const r=element.getBoundingClientRect(),s=Math.min(r.width/330,r.height/490);fit.style.transform=`translate(${(r.width-330*s)/2-20*s}px,${r.height-510*s}px)scale(${s})`;};const observer=new ResizeObserver(resize);observer.observe(element);resize();const greet=()=>state.setMood('wave');element.addEventListener('pointerenter',greet);element.addEventListener('focus',greet);
 if(mood!=='idle')state.setMood(mood);mounts.set(element,state);return state;
}
