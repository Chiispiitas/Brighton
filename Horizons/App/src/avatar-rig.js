/* Native ImageGen bust layers. One body coordinate system keeps every joint registered. */
const mounts = new WeakMap();
const appURL = new URL('../', import.meta.url);
let manifestPromise;
let gesturesPromise;
const css = `
.hzn-avatar-bust{position:relative;display:block;width:100%;height:100%;overflow:hidden;isolation:isolate;pointer-events:none}
.hzn-avatar-stage{position:absolute;width:320px;height:320px;transform-origin:0 0}
.hzn-avatar-body{position:absolute;inset:0;transform-origin:160px 266px;animation:hz-avatar-listen var(--avatar-period,7s) ease-in-out infinite;animation-delay:var(--avatar-phase,0s)}
.hzn-avatar-torso,.hzn-avatar-head{position:absolute;inset:0;transform-origin:160px 254px}
.hzn-avatar-torso{z-index:1}
.hzn-avatar-head{z-index:3}
.hzn-avatar-bust[data-personality=curious] .hzn-avatar-body{animation-name:hz-avatar-curious}
.hzn-avatar-bust[data-personality=cheerful] .hzn-avatar-body{animation-name:hz-avatar-cheerful}
.hzn-avatar-pixels{position:absolute;overflow:hidden;display:block;transform-origin:50% 50%}
.hzn-avatar-pixels>img{position:absolute;max-width:none!important;max-height:none!important;display:block;pointer-events:none;user-select:none}
.hzn-avatar-eyes{opacity:0;z-index:4;animation:hz-avatar-blink var(--avatar-blink,5.6s) steps(1,end) infinite;animation-delay:var(--avatar-blink-phase,0s)}
.hzn-avatar-arm-root,.hzn-avatar-joint{position:absolute;width:0;height:0;transform-origin:0 0}
.hzn-avatar-arm-root{z-index:2}.hzn-avatar-arm-root[data-side=left]{z-index:0}
.hzn-avatar-upper-right{animation:hz-avatar-upper-rest 5.2s ease-in-out infinite}.hzn-avatar-elbow-right{animation:hz-avatar-elbow-rest 5.2s ease-in-out infinite}.hzn-avatar-wrist-right{animation:hz-avatar-wrist-rest 5.2s ease-in-out infinite}
.hzn-avatar-upper-left{animation:hz-avatar-left-rest 6.3s ease-in-out infinite}.hzn-avatar-elbow-left{animation:hz-avatar-elbow-rest 6.3s ease-in-out infinite}.hzn-avatar-wrist-left{animation:hz-avatar-wrist-rest 6.3s ease-in-out infinite}
.hzn-avatar-bust[data-posture=wave] .hzn-avatar-upper-right{animation-name:hz-avatar-upper-wave;animation-duration:8.4s}.hzn-avatar-bust[data-posture=wave] .hzn-avatar-elbow-right{animation-name:hz-avatar-elbow-wave;animation-duration:8.4s}.hzn-avatar-bust[data-posture=wave] .hzn-avatar-wrist-right{animation-name:hz-avatar-wrist-wave;animation-duration:8.4s}
.hzn-avatar-bust[data-posture=think] .hzn-avatar-upper-right{animation-name:hz-avatar-upper-think;animation-duration:6.4s}.hzn-avatar-bust[data-posture=think] .hzn-avatar-elbow-right{animation-name:hz-avatar-elbow-think;animation-duration:6.4s}.hzn-avatar-bust[data-posture=think] .hzn-avatar-wrist-right{animation-name:hz-avatar-wrist-think;animation-duration:6.4s}
.hzn-avatar-hair{z-index:5;transform-origin:50% 90%}
@keyframes hz-avatar-upper-rest{0%,100%{transform:rotate(-9deg)}45%{transform:rotate(-6deg)}75%{transform:rotate(-10deg)}}
@keyframes hz-avatar-left-rest{0%,100%{transform:rotate(10deg)}42%{transform:rotate(7deg)}73%{transform:rotate(11deg)}}
@keyframes hz-avatar-elbow-rest{0%,100%{transform:rotate(0)}47%{transform:rotate(3deg)}75%{transform:rotate(-1deg)}}
@keyframes hz-avatar-wrist-rest{0%,100%{transform:rotate(0)}40%{transform:rotate(-3deg)}72%{transform:rotate(2deg)}}
@keyframes hz-avatar-upper-wave{0%,12%,65%,100%{transform:rotate(-54deg)}20%,43%{transform:rotate(-56deg)}30%,53%{transform:rotate(-52deg)}}
@keyframes hz-avatar-elbow-wave{0%,13%,64%,100%{transform:rotate(-116deg)}23%,45%{transform:rotate(-113deg)}33%,55%{transform:rotate(-119deg)}}
@keyframes hz-avatar-wrist-wave{0%,15%,67%,100%{transform:rotate(2deg)}25%,47%{transform:rotate(-12deg)}35%,57%{transform:rotate(13deg)}}
@keyframes hz-avatar-upper-think{0%,100%{transform:rotate(20deg)}35%{transform:rotate(18deg)}70%{transform:rotate(21deg)}}
@keyframes hz-avatar-elbow-think{0%,100%{transform:rotate(130deg)}35%{transform:rotate(133deg)}70%{transform:rotate(129deg)}}
@keyframes hz-avatar-wrist-think{0%,100%{transform:rotate(30deg)}35%{transform:rotate(28deg)}70%{transform:rotate(31deg)}}
@keyframes hz-avatar-blink{0%,34%,37%,81%,84%,100%{opacity:0}35%,36%,82%,83%{opacity:1}}
@keyframes hz-avatar-listen{0%,18%,100%{transform:rotate(0)}35%,48%{transform:rotate(-2.3deg)}62%,73%{transform:rotate(1deg)}87%{transform:rotate(-.5deg)}}
@keyframes hz-avatar-curious{0%,16%,100%{transform:rotate(0)}30%,40%{transform:rotate(2.8deg)}47%{transform:rotate(1.8deg)}55%{transform:rotate(2.8deg)}74%,86%{transform:rotate(-1.2deg)}}
@keyframes hz-avatar-cheerful{0%,22%,100%{transform:rotate(0)}34%{transform:rotate(-1.9deg)}43%{transform:rotate(.8deg)}52%{transform:rotate(-1.2deg)}63%,77%{transform:rotate(1.4deg)}}
@keyframes hz-avatar-hello{0%,100%{transform:rotate(0)}18%{transform:rotate(-3.5deg)}36%{transform:rotate(1.7deg)}52%{transform:rotate(-2deg)}69%{transform:rotate(1deg)}85%{transform:rotate(-.5deg)}}
@keyframes hz-avatar-proud{0%,100%{transform:rotate(0)}20%{transform:rotate(-3deg)}38%{transform:rotate(2deg)}56%{transform:rotate(-2deg)}75%{transform:rotate(.8deg)}}
@keyframes hz-avatar-pin{0%,100%{transform:scale(1)}35%,58%{transform:scale(1.12)}80%{transform:scale(.98)}}
@media(prefers-reduced-motion:reduce){.hzn-avatar-bust *{animation:none!important}.hzn-avatar-bust .hzn-avatar-eyes{opacity:0!important}}
`;
function installStyle(){if(document.getElementById('hzn-avatar-bust-style'))return;const style=document.createElement('style');style.id='hzn-avatar-bust-style';style.textContent=css;document.head.append(style);}
function getManifest(){return manifestPromise??=fetch(new URL('assets/art/manifest.json',appURL)).then(response=>{if(!response.ok)throw Error('Avatar artwork could not be opened');return response.json();});}
function getGestures(){return gesturesPromise??=fetch(new URL('assets/art/avatar-graphic-flat-v1.frames.json',appURL)).then(response=>{if(!response.ok)throw Error('Avatar gesture artwork could not be opened');return response.json();});}
function groups(data){return data.avatar?.groups||data.avatar?.layers||data.avatar||{};}
function choice(data,group,id){const values=groups(data)[group];const options=Array.isArray(values)?values:values?.options||[];return options.find(option=>option.id===id)||options[0];}
function seedFor(avatar){return Object.values(avatar||{}).join(':').split('').reduce((value,char)=>(value*31+char.charCodeAt(0))>>>0,7);}
function rotationAngle(transform){const matrix=new DOMMatrixReadOnly(transform==='none'?undefined:transform);return Math.atan2(matrix.b,matrix.a)*180/Math.PI;}
function nearestAngle(angle,reference){return reference+((angle-reference+180)%360+360)%360-180;}
function armGestureTrack(geometry,start,original,target,duration,returning){
 const radians=Math.PI/180,side=geometry.side,branch=side==='left'?1:-1,mix=(a,b,t)=>a+(b-a)*t,ease=t=>t*t*(3-2*t);
 const wrist=angles=>({x:geometry.shoulder.x-geometry.upperLength*Math.sin(angles.upper*radians)-geometry.foreLength*Math.sin((angles.upper+angles.elbow)*radians),y:geometry.shoulder.y+geometry.upperLength*Math.cos(angles.upper*radians)+geometry.foreLength*Math.cos((angles.upper+angles.elbow)*radians),hand:angles.upper+angles.elbow+angles.wrist});
 const first=wrist(start),last=wrist(original),goal=wrist(target),nearGoal=Math.hypot(first.x-goal.x,first.y-goal.y)<25,prep={x:side==='left'?96:224,y:302,hand:90*branch};
 const points=returning?[{...first,offset:0},...(Math.hypot(first.x-last.x,first.y-last.y)>25?[{...prep,offset:.5}]:[]),{...last,offset:1}]:[{...first,offset:0},...(!nearGoal?[{...prep,offset:.14}]:[]),{...goal,offset:.3},{...wrist({upper:target.upper-3*branch,elbow:target.elbow-3*branch,wrist:target.wrist-12*branch}),offset:.4},{...wrist({upper:target.upper+3*branch,elbow:target.elbow+3*branch,wrist:target.wrist+12*branch}),offset:.52},{...goal,offset:.64},{...goal,offset:.7},...(!nearGoal?[{...prep,offset:.86}]:[]),{...last,offset:1}];
 for(let index=1;index<points.length;index++)points[index].hand=nearestAngle(points[index].hand,points[index-1].hand);
 const tracks={upper:[],elbow:[],wrist:[]},hand=geometry.hand;let prior={...start};
 for(let milliseconds=0;milliseconds<=duration;milliseconds+=20){
  const t=milliseconds/duration;let index=1;while(index<points.length-1&&t>points[index].offset)index++;
  const a=points[index-1],b=points[index],f=ease((t-a.offset)/(b.offset-a.offset)),angle=mix(a.hand,b.hand,f),cos=Math.cos(angle*radians),sin=Math.sin(angle*radians);
  let x=mix(a.x,b.x,f),y=mix(a.y,b.y,f),minX=Infinity,maxX=-Infinity;
  for(const localX of [hand.left,hand.left+hand.width])for(const localY of [hand.top,hand.top+hand.height]){const projected=localX*cos-localY*sin;minX=Math.min(minX,projected);maxX=Math.max(maxX,projected);}
  // Constrain the whole native hand rectangle, including fingers, before IK.
  // The margin also contains the small independent torso rotation.
  x=Math.max(16-minX,Math.min(304-maxX,x));
  let dx=x-geometry.shoulder.x,dy=y-geometry.shoulder.y,distance=Math.hypot(dx,dy),safeDistance=Math.max(6,Math.min(geometry.upperLength+geometry.foreLength-.001,distance));
  if(distance!==safeDistance){dx*=safeDistance/distance;dy*=safeDistance/distance;distance=safeDistance;}
  const elbow=branch*Math.acos(Math.max(-1,Math.min(1,(distance*distance-geometry.upperLength**2-geometry.foreLength**2)/(2*geometry.upperLength*geometry.foreLength))));
  const upper=nearestAngle((Math.atan2(dy,dx)-Math.atan2(geometry.foreLength*Math.sin(elbow),geometry.upperLength+geometry.foreLength*Math.cos(elbow)))/radians-90,prior.upper);
  const angles={upper,elbow:elbow/radians,wrist:nearestAngle(angle-upper-elbow/radians,prior.wrist)},enter=ease(Math.min(1,t/.12)),leave=ease(Math.max(0,(t-.88)/.12));
  // Blend the degree or two of rest-loop elbow variation at each end without
  // switching the IK branch halfway through a gesture.
  for(const part of ['upper','elbow','wrist']){angles[part]=mix(start[part],nearestAngle(angles[part],start[part]),enter);angles[part]=mix(angles[part],nearestAngle(original[part],angles[part]),leave);tracks[part].push({transform:`rotate(${angles[part]}deg)`,offset:t});}
  prior=angles;
 }
 return tracks;
}
export function unmountAvatar(element){mounts.get(element)?.dispose();mounts.delete(element);}
export function mountAvatar(element,{avatar={},manifest,mood='idle',posture='portrait'}={}){
 installStyle();unmountAvatar(element);let disposed=false,observer;const pose=['portrait','wave','think'].includes(posture)?posture:'portrait',motionPreference=matchMedia('(prefers-reduced-motion:reduce)');
 const state={actions:[],base:new Map(),actionGeneration:0,dispose(){disposed=true;state.actionGeneration++;state.actions.forEach(a=>a.cancel());observer?.disconnect();motionPreference.removeEventListener('change',motionChanged);element.removeEventListener('pointerenter',greet);element.removeEventListener('focusin',greet);element.replaceChildren();},setMood(next='idle'){
  if(!state.frame||!state.body)return;
  if(motionPreference.matches){state.frame.dataset.mood='idle';return;}
  if(next==='idle'&&!state.actions.length){state.frame.dataset.mood='idle';return;}
  const nodes=[state.body,...state.frame.querySelectorAll('[data-joint]')],current=new Map(nodes.map(node=>[node,getComputedStyle(node).transform]));
  // Pause each base loop at its real painted pose, rather than resetting a CSS
  // keyframe class. An interrupted greeting starts from the current joint pose.
  for(const node of nodes)if(!state.base.has(node)){const animations=node.getAnimations().filter(a=>a.effect?.target===node&&!state.actions.includes(a));state.base.set(node,{transform:current.get(node),animations});animations.forEach(a=>a.pause());}
  state.actionGeneration++;const generation=state.actionGeneration;state.actions.forEach(a=>a.cancel());state.actions=[];state.frame.dataset.mood=next;
  const duration=next==='idle'?600:2400,returningSides=state.gestureSides||[];
  // Keep the thinking hand at the chin: its other, open hand says hello.
  const greetingSide=pose==='think'?'left':'right',greetingSign=greetingSide==='left'?1:-1;
  const targets=next==='celebrate'?{'upper-right':-63,'elbow-right':-107,'wrist-right':-10,'upper-left':63,'elbow-left':110,'wrist-left':10}:{['upper-'+greetingSide]:54*greetingSign,['elbow-'+greetingSide]:116*greetingSign,['wrist-'+greetingSide]:-2*greetingSign};
  if(next!=='idle')state.gestureSides=next==='celebrate'&&pose!=='think'?['left','right']:[greetingSide];
  const activeSides=next==='idle'?returningSides:state.gestureSides,armTracks={};
  for(const side of activeSides){const first={},last={},target={};for(const part of ['upper','elbow','wrist']){const node=nodes.find(node=>node.dataset.joint===part+'-'+side);first[part]=rotationAngle(current.get(node));last[part]=rotationAngle(state.base.get(node).transform);target[part]=targets[part+'-'+side]??last[part];}armTracks[side]=armGestureTrack(state.motionArms[side],first,last,target,duration,next==='idle');}
  for(const node of nodes){const original=state.base.get(node).transform,start=current.get(node),name=node.dataset.joint;
   const [part,side]=(name||'').split('-');let keys;
   if(armTracks[side])keys=armTracks[side][part];
   else if(next==='idle')keys=[{transform:start,offset:0},{transform:original,offset:1}];
   else if(node===state.body){const matrix=new DOMMatrixReadOnly(start==='none'?undefined:start),angle=Math.atan2(matrix.b,matrix.a)*180/Math.PI;keys=[{transform:start,offset:0},{transform:`rotate(${angle-2}deg)`,offset:.2},{transform:`rotate(${angle+1}deg)`,offset:.5},{transform:original,offset:1}];}
   else keys=[{transform:start,offset:0},{transform:original,offset:1}];
   const action=node.animate(keys,{duration,easing:'linear',fill:'none'});action.id='avatar-action-'+(name||'body');state.actions.push(action);
  }
  Promise.allSettled(state.actions.map(a=>a.finished)).then(()=>{if(disposed||generation!==state.actionGeneration)return;state.actions=[];for(const {animations}of state.base.values())animations.forEach(a=>a.play());state.base.clear();state.frame.dataset.mood='idle';});
 }};
 const motionChanged=()=>{if(!motionPreference.matches)return;state.actionGeneration++;state.actions.forEach(a=>a.cancel());state.actions=[];state.base.clear();if(state.frame)state.frame.dataset.mood='idle';};motionPreference.addEventListener('change',motionChanged);
 const greet=()=>state.setMood('wave');mounts.set(element,state);
 Promise.all([Promise.resolve(manifest||getManifest()),getGestures()]).then(([data,gestureAtlas])=>{
  if(disposed)return;
  const flatData={avatar:{...groups(data),...gestureAtlas.avatar}},skin=choice(flatData,'skin',avatar.skin),outfit=choice(flatData,'outfit',avatar.outfit),hair=choice(flatData,'hair',avatar.hair),accessory=choice(flatData,'accessory',avatar.accessory),badge=choice(data,'badge',avatar.badge);
  if(!skin?.frame)return;
  const frame=document.createElement('span');frame.className='hzn-avatar-bust';frame.dataset.intentionalCrop='bust';frame.dataset.avatarBust='true';frame.dataset.posture=pose;frame.dataset.personality=['thoughtful','curious','cheerful'][seedFor(avatar)%3];frame.setAttribute('aria-hidden','true');
  const seed=seedFor(avatar);frame.style.setProperty('--avatar-period',`${6.8+(seed%27)/10}s`);frame.style.setProperty('--avatar-phase',`-${(seed%47)/10}s`);frame.style.setProperty('--avatar-blink',`${4.7+(seed%23)/10}s`);frame.style.setProperty('--avatar-blink-phase',`-${(seed%29)/10}s`);
  const stage=document.createElement('span');stage.className='hzn-avatar-stage';frame.append(stage);const body=document.createElement('span');body.className='hzn-avatar-body';body.dataset.rigPart='anatomical-body';stage.append(body);const torso=document.createElement('span');torso.className='hzn-avatar-torso';torso.dataset.rigPart='torso';torso.dataset.part='torso';const head=document.createElement('span');head.className='hzn-avatar-head';head.dataset.rigPart='head';head.dataset.part='head';body.append(torso,head);element.replaceChildren(frame);state.frame=frame;state.body=body;
  const registration=gestureAtlas.registration;
  function pixels(parent,asset,box,left,top,scale,part,z=1,extra=''){
   const view=document.createElement('span');view.className='hzn-avatar-pixels '+extra;view.dataset.rigPart=part;view.dataset.part=part;view.dataset.nativeFrame=JSON.stringify(box);view.dataset.nativeAtlas=JSON.stringify(asset.atlas);view.style.cssText=`left:${left}px;top:${top}px;width:${box.w*scale}px;height:${box.h*scale}px;z-index:${z}`;
   const img=document.createElement('img');img.src=new URL(asset.src,appURL).href;img.alt='';img.draggable=false;img.decoding='async';img.style.cssText=`width:${asset.atlas.width*scale}px;height:${asset.atlas.height*scale}px;left:${-box.x*scale}px;top:${-box.y*scale}px`;view.append(img);parent.append(view);return view;
  }
  function fullLayer(parent,asset,part,position=asset?.rigPosition,z=position?.z||2){
   if(!asset?.frame||!position)return;const box=asset.frame,p=position,s=p.w/box.w;
   return pixels(parent,asset,box,p.x,p.y,s,part,z);
  }
  // Head, neck and clothing share measured native-image registration. The
  // narrower head and broad shoulders are part of the new adult graphic design.
  const faceScale=registration.headWidth/skin.frame.w,skinLeft=(320-skin.frame.w*faceScale)/2,skinTop=registration.headTop;
  if(accessory?.id==='accessory-6')fullLayer(torso,accessory,'accessory',accessory.rigPosition,0);
  if(skin.neckFrame){const neck=skin.neckFrame;pixels(torso,skin,neck,skinLeft+(neck.x-skin.frame.x)*faceScale,skinTop+(neck.y-skin.frame.y)*faceScale+3,faceScale,'skin',1);}
  const clothing=gestureAtlas.clothing,skinKit=gestureAtlas.skin,garment=clothing.outfits[outfit.id],skinParts=skinKit.skins[skin.id];
  const torsoBox=garment.torso,torsoScale=registration.torsoWidth/torsoBox.w;
  pixels(torso,garment.torsoAsset||clothing,torsoBox,(320-torsoBox.w*torsoScale)/2,registration.collarY-(garment.collarBottom-torsoBox.y)*torsoScale,torsoScale,'outfit',2);
  const headBox=skin.headFrame||skin.frame;
  pixels(head,skin,headBox,skinLeft+(headBox.x-skin.frame.x)*faceScale,skinTop+(headBox.y-skin.frame.y)*faceScale,faceScale,'face',1);
  for(const blink of skin.blinks||[])fullLayer(head,blink,'eyes',blink.rigPosition,4)?.classList.add('hzn-avatar-eyes');
  if(hair?.id!=='none')fullLayer(head,hair,'hair',hair?.rigPosition,5)?.classList.add('hzn-avatar-hair');
  if(accessory?.id&&accessory.id!=='none'&&accessory.id!=='accessory-6'){
   const onHead=['accessory-1','accessory-2','accessory-3'].includes(accessory.id);
   fullLayer(onHead?head:torso,accessory,'accessory',accessory.rigPosition,onHead?6:4);
  }
  if(badge?.id&&badge.id!=='none'&&badge.frame){const s=26/badge.frame.w;pixels(torso,badge,badge.frame,198,253,s,'badge',8);}
  function joint(parent,name,x,y){const element=document.createElement('span');element.className='hzn-avatar-joint hzn-avatar-'+name;element.dataset.rigPart=name;element.dataset.joint=name;element.style.left=x+'px';element.style.top=y+'px';parent.append(element);return element;}
  function pinned(parent,source,spec,s,part,z){const view=pixels(parent,source,spec.frame,(spec.frame.x-spec.pin.x)*s,(spec.frame.y-spec.pin.y)*s,s,part,z);view.dataset.attachmentJoint=parent.dataset.joint;view.dataset.layerRole=part.includes('sleeve')?'sleeve':'skin';return view;}
  for(const side of ['left','right']){
   const shoulder=registration[side+'Shoulder'],arm=document.createElement('span');arm.className='hzn-avatar-arm-root';arm.dataset.side=side;arm.dataset.rigPart='clothed-arm-'+side;arm.dataset.anatomy='registered-shoulder-elbow-wrist-with-clothing';arm.style.left=shoulder.x+'px';arm.style.top=shoulder.y+'px';body.append(arm);
   const upper=joint(arm,'upper-'+side,0,0);upper.dataset.jointRole='shoulder';
   const upperScale=registration.upperLength/(skinParts.upper.elbowY-skinParts.upper.pin.y);
   pinned(upper,skinKit,skinParts.upper,upperScale,'upper-skin-'+side,1);pinned(upper,garment.sleeveAsset||clothing,garment.upperSleeve,garment.upperSleeve.scale,'upper-sleeve-'+side,2);
   const elbow=joint(upper,'elbow-'+side,0,registration.upperLength);elbow.dataset.jointRole='elbow';elbow.style.zIndex='3';
   const foreScale=registration.foreLength/(skinParts.fore.wristY-skinParts.fore.pin.y);
   pinned(elbow,skinKit,skinParts.fore,foreScale,'fore-skin-'+side,1);
   const wrist=joint(elbow,'wrist-'+side,0,registration.foreLength);wrist.dataset.jointRole='wrist';wrist.style.zIndex='1';
   const thinking=pose==='think'&&side==='right',hand=thinking?skinParts.thinkHand:skinParts.hand,handSource=thinking?gestureAtlas.think:skinKit;
   const handLeft=(hand.frame.x-hand.pin.x)*hand.scale,handTop=(hand.frame.y-hand.pin.y)*hand.scale,handWidth=hand.frame.w*hand.scale;
   state.motionArms??={};state.motionArms[side]={side,shoulder,upperLength:registration.upperLength,foreLength:registration.foreLength,hand:{left:side==='right'?-handLeft-handWidth:handLeft,top:handTop,width:handWidth,height:hand.frame.h*hand.scale}};
   const handView=pinned(wrist,handSource,hand,hand.scale,'hand-'+side,1);if(side==='right'){handView.style.transformOrigin=`${(hand.pin.x-hand.frame.x)*hand.scale}px ${(hand.pin.y-hand.frame.y)*hand.scale}px`;handView.style.transform='scaleX(-1)';}
   if(garment.foreSleeve){const s=registration.foreLength/(garment.foreSleeve.wristY-garment.foreSleeve.pin.y);pinned(elbow,garment.sleeveAsset||clothing,garment.foreSleeve,s,'fore-sleeve-'+side,2);}
  }
  const fit=()=>{const bounds=frame.getBoundingClientRect(),s=Math.min(bounds.width/320,bounds.height/320);stage.style.left=`${(bounds.width-320*s)/2}px`;stage.style.top=`${(bounds.height-320*s)/2}px`;stage.style.transform=`scale(${s})`;};observer=new ResizeObserver(fit);observer.observe(frame);fit();frame.dataset.ready='true';state.setMood(mood);element.addEventListener('pointerenter',greet);element.addEventListener('focusin',greet);
 }).catch(error=>{if(!disposed){element.dataset.avatarError='true';console.error(error);}});
 return state;
}
