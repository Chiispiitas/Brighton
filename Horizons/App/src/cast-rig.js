/* Native ImageGen cutouts with measured, connected shoulder/elbow/hip/knee pivots. */
const appURL=new URL('../',import.meta.url),mounts=new WeakMap();
let artwork;
const periods={mina:7600,alex:6400,jo:9400};
const degrees=r=>r*180/Math.PI,radians=d=>d*Math.PI/180;
const rotate=(v,a)=>({x:v.x*Math.cos(radians(a))-v.y*Math.sin(radians(a)),y:v.x*Math.sin(radians(a))+v.y*Math.cos(radians(a))});
const plus=(a,b)=>({x:a.x+b.x,y:a.y+b.y});
const transform=(p,a=0)=>`translate(${p.x.toFixed(5)}px,${p.y.toFixed(5)}px) rotate(${a.toFixed(5)}deg)`;
const mix=(a,b,t)=>a+(b-a)*t;
function mixAngle(a,b,t){let delta=b-a;while(delta>180)delta-=360;while(delta< -180)delta+=360;return a+delta*t;}
const CSS=`
.hzn-cast{position:relative;display:block;width:100%;height:100%;overflow:visible;isolation:isolate;pointer-events:none}
.hzn-cast-stage{position:absolute;width:360px;height:560px;transform-origin:0 0;overflow:visible}
.hzn-cast-body{position:absolute;inset:0;transform-origin:180px 316px}
.hzn-cast-bone{position:absolute;left:0;top:0;width:0;height:0;transform-origin:0 0}
.hzn-cast-native{position:absolute;display:block;overflow:hidden;pointer-events:none}
.hzn-cast-native>img{position:absolute;display:block;max-width:none!important;max-height:none!important;pointer-events:none;user-select:none}
`;
function styles(){if(document.getElementById('hzn-cast-style'))return;const s=document.createElement('style');s.id='hzn-cast-style';s.textContent=CSS;document.head.append(s);}
function load(){return artwork??=fetch(new URL('assets/art/cast-articulated-v4.frames.json?articulation=4',appURL),{cache:'no-cache'}).then(r=>{if(!r.ok)throw Error('Character artwork could not be loaded');return r.json();});}
function scaleFor(name,part){
 const heights={head:name==='jo'?148:142,torso:name==='jo'?200:name==='alex'?195:185,upperLeft:105,upperRight:105,lowerLeft:108,lowerRight:108,thighLeft:135,thighRight:135,shinLeft:145,shinRight:145,footLeft:145,footRight:145};
 return heights[part];
}
function makeGeometry(name,asset){
 const geometry={};
 for(const [part,d]of Object.entries(asset.parts)){
  const h=scaleFor(name,part),s=h?h/(d.nativeFullHeight||d.frame.h):1;
  geometry[part]={...d,scale:s,vector:d.end?{x:(d.end.x-d.pin.x)*s,y:(d.end.y-d.pin.y)*s}:null};
 }
 return geometry;
}
function chain(g,start,upper,lower,a,b){const elbow=plus(start,rotate(g[upper].vector,a));return{upper:{p:start,a},lower:{p:elbow,a:a+b},end:plus(elbow,rotate(g[lower].vector,a+b))};}
function solveArm(g,start,target,upper,lower,outward){
 const v=g[upper].vector,w=g[lower].vector,L1=Math.hypot(v.x,v.y),L2=Math.hypot(w.x,w.y),dx=target.x-start.x,dy=target.y-start.y;
 const d=Math.max(Math.abs(L1-L2)+1,Math.min(L1+L2-1,Math.hypot(dx,dy))),direction=Math.atan2(dy,dx),offset=Math.acos(Math.max(-1,Math.min(1,(L1*L1+d*d-L2*L2)/(2*L1*d))));
 const upperDirection=direction+outward*offset,a=degrees(upperDirection-Math.atan2(v.y,v.x)),elbow=plus(start,rotate(v,a));
 let lowerRotation=degrees(Math.atan2(target.y-elbow.y,target.x-elbow.x)-Math.atan2(w.y,w.x));
 while(lowerRotation-a>180)lowerRotation-=360;while(lowerRotation-a< -180)lowerRotation+=360;
 return chain(g,start,upper,lower,a,lowerRotation-a);
}
function family(posture){if(posture==='drive')return'drive';if(['read','sit'].includes(posture))return'seated';if(['map','fix'].includes(posture))return'study';if(['skip','dance'].includes(posture))return'dance';return'standing';}
function drivePose(pose,g){
 const center=pose.wheel.p,a=pose.wheel.a;
 const left=solveArm(g,{x:124,y:177},plus(center,rotate({x:-64,y:-9},a)),'upperLeft','lowerLeft',1),right=solveArm(g,{x:236,y:177},plus(center,rotate({x:64,y:-9},a)),'upperRight','lowerRight',-1);
 pose.upperLeft=left.upper;pose.lowerLeft=left.lower;pose.upperRight=right.upper;pose.lowerRight=right.lower;
}
function bookPose(pose,g){
 const reference=solveArm(g,{x:124,y:177},{x:155,y:255},'upperLeft','lowerLeft',1).lower.a,a=pose.lowerLeft.a-reference;
 const wrist=plus(pose.lowerLeft.p,rotate(g.lowerLeft.vector,pose.lowerLeft.a));
 return{p:plus(wrist,rotate({x:25,y:-5},a)),a};
}
function polishProps(pose,g){
 const rightWrist=plus(pose.lowerRight.p,rotate(g.lowerRight.vector,pose.lowerRight.a)),leftWrist=plus(pose.lowerLeft.p,rotate(g.lowerLeft.vector,pose.lowerLeft.a));
 // The mug handle stays in the supporting hand; the cloth stays under the wiping palm.
 pose.accessory={p:plus(rightWrist,rotate({x:-31,y:5},-pose.body.lean)),a:-pose.body.lean};
 pose.prop={p:plus(leftWrist,rotate({x:0,y:15},pose.lowerLeft.a)),a:pose.lowerLeft.a+90};
}
function sample(name,posture,g,t,mood='idle'){
 const wave=Math.sin(2*Math.PI*t),beat=Math.sin(4*Math.PI*t),fine=Math.sin(6*Math.PI*t),kind=family(posture);
 let leftA=7+3*wave,leftB=-9+7*beat,rightA=-118+4*wave,rightB=-55+12*fine,head=-2+3*Math.sin(2*Math.PI*(t-.18));
 if(name==='alex'){leftA=24+3*wave;leftB=-115+9*beat;rightA=-20+9*wave;rightB=-75+20*fine;head=4*Math.sin(4*Math.PI*t);}
 if(name==='jo'){leftA=10+4*wave;leftB=-40+8*beat;rightA=-80+5*wave;rightB=-100+8*beat;head=2.8*Math.sin(2*Math.PI*t);}
 let thighL=2.2*wave,thighR=-2.2*wave,shinL=-thighL*.65,shinR=-thighR*.65;
 if(kind==='seated'){thighL=65+wave;thighR=-65-wave;shinL=-150+1.6*beat;shinR=150-1.6*beat;}
 if(kind==='crouch'){thighL=60+wave;thighR=-60-wave;shinL=-60+.8*beat;shinR=60-.8*beat;}
 if(kind==='drive'){thighL=35+.8*wave;thighR=-35-.8*wave;shinL=-35+2.5*beat;shinR=35-2.5*beat;}
 if(kind==='dance'){thighL=7*wave;thighR=-7*wave;shinL=4*beat;shinR=-4*beat;head=4*wave;}
 const shoulders={left:{x:124,y:177},right:{x:236,y:177}},hips={left:{x:154,y:316},right:{x:206,y:316}};
 let armL,armR;
 if(posture==='clap'||mood==='celebrate'){
  const gap=posture==='clap'?12+10*(1-Math.cos(6*Math.PI*t)):85+5*wave,y=posture==='clap'?230:95+3*beat;
  armL=solveArm(g,shoulders.left,{x:180-gap,y},'upperLeft','lowerLeft',y<177?-1:1);
  armR=solveArm(g,shoulders.right,{x:180+gap,y},'upperRight','lowerRight',y<177?1:-1);
  if(mood==='celebrate'){thighL+=3*wave;thighR-=3*wave;}
 }else if(kind==='seated'||kind==='study'){
  armL=solveArm(g,shoulders.left,{x:155+3*wave,y:255+2*beat},'upperLeft','lowerLeft',1);
  armR=mood==='wave'?chain(g,shoulders.right,'upperRight','lowerRight',-115+4*wave,-55+13*fine):solveArm(g,shoulders.right,{x:212+2*wave,y:253-2*beat},'upperRight','lowerRight',-1);
 }else{
  if(mood==='wave'&&name!=='mina'){rightA=-115+4*wave;rightB=-55+13*fine;}
  armL=chain(g,shoulders.left,'upperLeft','lowerLeft',leftA,leftB);
  armR=chain(g,shoulders.right,'upperRight','lowerRight',rightA,rightB);
 }
 const legL=chain(g,hips.left,'thighLeft','shinLeft',thighL,shinL),legR=chain(g,hips.right,'thighRight','shinRight',thighR,shinR);
 const lean=posture==='pour'?-5:kind==='study'?2:kind==='seated'?2:0;
 const result={
  head:{p:{x:180,y:169},a:head},torso:{p:{x:180,y:173},a:0},
  upperLeft:armL.upper,lowerLeft:armL.lower,upperRight:armR.upper,lowerRight:armR.lower,
  thighLeft:legL.upper,shinLeft:legL.lower,footLeft:{p:legL.end,a:kind==='seated'?8:kind==='drive'?-3-4*beat:1.5*beat,mirror:kind==='seated'},thighRight:legR.upper,shinRight:legR.lower,footRight:{p:legR.end,a:kind==='seated'?-8:kind==='drive'?3+4*beat:-1.5*beat,mirror:kind==='seated'},
  body:{lean:kind==='drive'?0:lean+.7*wave,hop:mood==='celebrate'&&kind!=='drive'?-Math.max(0,beat)*6:0},
  accessory:{p:name==='mina'?{x:122,y:244}:name==='alex'?{x:180,y:195}:{x:0,y:0},a:name==='mina'?1.2*wave:0},
  wheel:{p:{x:180,y:260},a:5*wave},dashboard:{p:{x:180,y:368},a:0}
 };
 if(kind==='drive')drivePose(result,g);
 result.book=bookPose(result,g);result.studyProp=result.book;result.prop=result.book;
 if(name==='jo'&&posture==='pour'){
  // A real café task rather than a generic wave: hold the cup upright and polish its rim.
  const right=solveArm(g,shoulders.right,{x:222+1.5*wave,y:263+beat},'upperRight','lowerRight',-1);
  const wiping=mood==='wave'?{x:84+4*wave,y:174+7*fine}:mood==='celebrate'?{x:78+4*wave,y:108+5*beat}:{x:177+10*beat,y:240+3*fine};
  const left=solveArm(g,shoulders.left,wiping,'upperLeft','lowerLeft',mood==='wave'||mood==='celebrate'?-1:1);
  result.upperRight=right.upper;result.lowerRight=right.lower;result.upperLeft=left.upper;result.lowerLeft=left.lower;
  polishProps(result,g);
 }
 return result;
}
function blendedPose(from,to,g,t){
 const out={};
 for(const [upper,lower]of[['upperLeft','lowerLeft'],['upperRight','lowerRight'],['thighLeft','shinLeft'],['thighRight','shinRight']]){
  const start={x:mix(from[upper].p.x,to[upper].p.x,t),y:mix(from[upper].p.y,to[upper].p.y,t)},a=mixAngle(from[upper].a,to[upper].a,t),b=mixAngle(from[lower].a,to[lower].a,t);
  out[upper]={p:start,a};out[lower]={p:plus(start,rotate(g[upper].vector,a)),a:b};
 }
 for(const side of['Left','Right']){const lower=out['shin'+side];out['foot'+side]={p:plus(lower.p,rotate(g['shin'+side].vector,lower.a)),a:mixAngle(from['foot'+side].a,to['foot'+side].a,t),mirror:to['foot'+side].mirror};}
 for(const key of['head','torso','accessory','wheel','dashboard'])out[key]={p:{x:mix(from[key].p.x,to[key].p.x,t),y:mix(from[key].p.y,to[key].p.y,t)},a:mixAngle(from[key].a,to[key].a,t)};
 if(g.isDriving)drivePose(out,g);
 out.body={lean:mixAngle(from.body.lean,to.body.lean,t),hop:mix(from.body.hop,to.body.hop,t)};out.book=bookPose(out,g);out.studyProp=out.book;out.prop=out.book;if(g.isPolishing)polishProps(out,g);return out;
}
function groundOffset(name,posture,g){
 const pose=sample(name,posture,g,0),bottom=[];
 for(const key of['footLeft','footRight']){const b=g[key],s=pose[key];for(const x of[0,b.frame.w])bottom.push(plus(s.p,rotate({x:(x-b.pin.x)*b.scale*(s.mirror?-1:1),y:(b.frame.h-b.pin.y)*b.scale},s.a)).y);}
 return 548-Math.max(...bottom);
}
export function unmountCast(element){mounts.get(element)?.dispose();mounts.delete(element);}
export function mountCast(element,{character='mina',mood='idle',posture='step'}={}){
 styles();unmountCast(element);delete element.dataset.rigReady;delete element.dataset.rigError;let disposed=false,observer,timer,animationList=[],generation=0;
 const media=matchMedia('(prefers-reduced-motion:reduce)');
 const state={
  dispose(){disposed=true;clearTimeout(timer);observer?.disconnect();for(const a of animationList)a.cancel();animationList=[];media.removeEventListener('change',motionPreference);element.removeEventListener('pointerenter',greet);element.removeEventListener('focusin',greet);if(state.frame)delete state.frame.__articulatedRig;element.replaceChildren();delete element.dataset.rigReady;delete element.__articulatedRig;},
  setMood(next='idle'){clearTimeout(timer);if(state.play)state.play(next);if(next!=='idle')timer=setTimeout(()=>{if(!disposed)state.play('idle');},state.getDuration()+440);},
  seek(ms){clearTimeout(timer);if(state.transitioning)state.play(state.nextMood,false);for(const a of animationList){a.pause();a.currentTime=ms;}},
  getDuration(){return periods[character]||8000;}
 };
 const greet=()=>state.setMood('wave'),motionPreference=()=>state.play?.(state.mood||'idle',false);mounts.set(element,state);element.__articulatedRig=state;
 load().then(async data=>{
  if(disposed)return;const asset=data.characters[character];if(!asset)throw Error('Unknown companion');const g=makeGeometry(character,asset),duration=periods[character],y=groundOffset(character,posture,g);g.isDriving=posture==='drive';g.isPolishing=character==='jo'&&posture==='pour';
  const frame=document.createElement('span');frame.className='hzn-cast';frame.dataset.articulatedCharacter=character;frame.dataset.posture=posture;frame.dataset.motionDuration=duration;frame.dataset.nativeHead='complete-face';
  frame.__articulatedRig=state;state.frame=frame;
  const stage=document.createElement('span');stage.className='hzn-cast-stage';const body=document.createElement('span');body.className='hzn-cast-body';body.dataset.rigPart='body';stage.append(body);frame.append(stage);element.replaceChildren(frame);
  const nodes={};
  function part(name,z,customWidth){
   const d=g[name],s=customWidth?customWidth/d.frame.w:d.scale,box=d.frame;
   const n=document.createElement('span');n.className='hzn-cast-bone';n.dataset.rigPart=name;n.dataset.joint=({upperLeft:'shoulderLeft',lowerLeft:'elbowLeft',upperRight:'shoulderRight',lowerRight:'elbowRight',thighLeft:'hipLeft',shinLeft:'kneeLeft',footLeft:'ankleLeft',thighRight:'hipRight',shinRight:'kneeRight',footRight:'ankleRight',head:'neck'})[name]||name;n.style.zIndex=z;
   n.dataset.nativeFrame=JSON.stringify(box);n.dataset.nativePin=JSON.stringify(d.pin);n.dataset.nativeScale=s;
   if(d.end)n.dataset.nativeEnd=JSON.stringify(d.end);
   const view=document.createElement('span');view.className='hzn-cast-native';view.style.cssText=`left:${-d.pin.x*s}px;top:${-d.pin.y*s}px;width:${box.w*s}px;height:${box.h*s}px`;
   const atlas=d.atlas||asset.atlas,im=document.createElement('img');im.src=new URL(d.src||asset.src,appURL).href;im.alt='';im.draggable=false;im.decoding='async';im.style.cssText=`left:${-box.x*s}px;top:${-box.y*s}px;width:${atlas.width*s}px;height:${atlas.height*s}px`;view.append(im);n.append(view);body.append(n);nodes[name]=n;
  }
  if(character==='mina')part('accessory',0,90);
  part('thighLeft',1);part('thighRight',1);part('shinLeft',2);part('shinRight',2);part('footLeft',2);part('footRight',2);
  part('upperLeft',3);part('upperRight',3);part('head',3);part('torso',4);part('lowerLeft',posture==='drive'?8:6);part('lowerRight',posture==='drive'?8:6);
  if(character==='alex'&&posture!=='drive')part('accessory',5,78);
  if(g.isPolishing){part('accessory',5,92);part('prop',5,47);frame.dataset.task='polish-mug';}
  function foreignPart(name,z,src,atlas,frameBox,pin,width){
   const s=width/frameBox.w,n=document.createElement('span');n.className='hzn-cast-bone';n.dataset.rigPart=name;n.dataset.joint=name;n.style.zIndex=z;
   n.dataset.nativeFrame=JSON.stringify(frameBox);n.dataset.nativePin=JSON.stringify(pin);n.dataset.nativeScale=s;
   const view=document.createElement('span');view.className='hzn-cast-native';view.style.cssText=`left:${-pin.x*s}px;top:${-pin.y*s}px;width:${frameBox.w*s}px;height:${frameBox.h*s}px`;
   const im=document.createElement('img');im.src=new URL(src,appURL).href;im.alt='';im.style.cssText=`left:${-frameBox.x*s}px;top:${-frameBox.y*s}px;width:${atlas.width*s}px;height:${atlas.height*s}px`;view.append(im);n.append(view);body.append(n);nodes[name]=n;
  }
  if(posture==='drive'){
   foreignPart('dashboard',5,'assets/art/driver-props-v1.png',{width:1024,height:1536},{x:14,y:1014,w:996,h:436},{x:498,y:218},292);
   foreignPart('wheel',7,'assets/art/driver-props-v1.png',{width:1024,height:1536},{x:155,y:26,w:707,h:718},{x:353.5,y:359},110);
  }
  if(posture==='map')foreignPart('studyProp',5,'assets/art/mina-rig-v1.png',{width:1246,height:1263},{x:339,y:1003,w:254,h:216},{x:127,y:108},102);
  if(posture==='fix')part('prop',5,50);
  if(family(posture)==='seated'){
   const frameBox={x:640,y:1010,w:280,h:195},pin={x:139,y:101},s=86/frameBox.w;
   const n=document.createElement('span');n.className='hzn-cast-bone';n.dataset.rigPart='book';n.dataset.joint='leftWristGrip';n.style.zIndex=5;
   const view=document.createElement('span');view.className='hzn-cast-native';view.style.cssText=`left:${-pin.x*s}px;top:${-pin.y*s}px;width:${frameBox.w*s}px;height:${frameBox.h*s}px`;
   const im=document.createElement('img');im.src=new URL('assets/art/pico-articulated-v3.png',appURL).href;im.alt='';im.style.cssText=`left:${-frameBox.x*s}px;top:${-frameBox.y*s}px;width:${1254*s}px;height:${1254*s}px`;view.append(im);n.append(view);body.append(n);nodes.book=n;
  }
  function currentPose(){
   const result=sample(character,posture,g,0,state.mood||'idle');
   for(const [name,node]of Object.entries(nodes)){const m=new DOMMatrix(getComputedStyle(node).transform),mirror=m.a*m.d-m.b*m.c<0;let a=degrees(Math.atan2(m.b,m.a));if(mirror)a-=180;result[name]={p:{x:m.e,y:m.f},a,mirror};}
   const m=new DOMMatrix(getComputedStyle(body).transform);result.body={lean:degrees(Math.atan2(m.b,m.a)),hop:m.f-y};return result;
  }
  function startFrames(poses,options){
   const frames=Object.fromEntries(Object.keys(nodes).map(name=>[name,[]])),bodyFrames=[],previousAngles={};
   for(let i=0;i<poses.length;i++){
    const pose=poses[i],offset=i/(poses.length-1);
    for(const[name]of Object.entries(nodes)){
     const part=pose[name],a=previousAngles[name]===undefined?part.a:mixAngle(previousAngles[name],part.a,1);previousAngles[name]=a;
     frames[name].push({offset,transform:transform(part.p,a)+(part.mirror?' scaleX(-1)':'')});
    }
    bodyFrames.push({offset,transform:`translateY(${(y+pose.body.hop).toFixed(5)}px) rotate(${pose.body.lean.toFixed(5)}deg)`});
   }
   for(const[name,node]of Object.entries(nodes))animationList.push(node.animate(frames[name],options));
   animationList.push(body.animate(bodyFrames,options));
   const now=document.timeline.currentTime;for(const a of animationList)a.startTime=now;
  }
  function loop(next,token){
   if(disposed||token!==generation)return;for(const a of animationList)a.cancel();animationList=[];state.transitioning=false;state.mood=next;frame.dataset.mood=next;
   startFrames(Array.from({length:361},(_,i)=>sample(character,posture,g,i/360,next)),{duration,iterations:Infinity,easing:'linear'});
   if(media.matches)state.seek(0);
  }
  function play(next='idle',transition=true){
   const from=animationList.length?currentPose():null,token=++generation;state.nextMood=next;
   for(const a of animationList)a.cancel();animationList=[];
   if(!from||!transition||media.matches){loop(next,token);return;}
   state.transitioning=true;frame.dataset.mood=next;
   const target=sample(character,posture,g,0,next),poses=Array.from({length:61},(_,i)=>blendedPose(from,target,g,i/60));
   startFrames(poses,{duration:420,iterations:1,easing:'cubic-bezier(.4,0,.2,1)',fill:'forwards'});
   Promise.all(animationList.map(a=>a.finished)).then(()=>loop(next,token)).catch(()=>{});
  }
  state.play=play;
  const fit=()=>{const r=frame.getBoundingClientRect(),s=Math.min(r.width/360,r.height/560);stage.style.left=`${(r.width-360*s)/2}px`;stage.style.top=`${r.height-560*s}px`;stage.style.transform=`scale(${s})`;};observer=new ResizeObserver(fit);observer.observe(frame);fit();
  await Promise.all([...frame.querySelectorAll('img')].map(im=>im.decode()));if(disposed)return;
  state.play(mood,false);frame.dataset.rigReady='true';element.dataset.rigReady='true';element.addEventListener('pointerenter',greet);element.addEventListener('focusin',greet);media.addEventListener('change',motionPreference);
 }).catch(error=>{if(!disposed){element.dataset.rigError='true';console.error(error);}});
 return state;
}
