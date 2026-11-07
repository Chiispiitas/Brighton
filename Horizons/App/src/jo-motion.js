import {motionPreference} from './preferences.js';
// Jo-only native ImageGen part rigs. Original complete poses remain the fallback.
const controllers=new WeakMap(),elapsedByPose=new Map();
const reactedAnswers=new Set();
const DURATION=11000,IDLE=8000;
const asset=path=>new URL('../'+path,import.meta.url).href;
let manifestPromise;
const loadManifest=()=>manifestPromise??=fetch(new URL('../assets/art/jo-motion-v1/rigs.json?v=1',import.meta.url),{cache:'no-cache'})
 .then(response=>{if(!response.ok)throw Error('Missing Jo motion registrations');return response.json();})
 .catch(error=>{manifestPromise=null;throw error;});
const phaseOf=time=>((Number(time)||0)%DURATION+DURATION)%DURATION;

function tracks(pose){
 const rest='translate(0px,0px) rotate(0deg) scale(1,1)';
 const idle=(values,action)=>{
  const frames=[];
  for(let loop=0;loop<1;loop++)for(const [time,transform]of values){
   const offset=(loop*IDLE+time)/DURATION;
   // Avoid duplicate offsets at the idle-loop seam.
   if(frames.at(-1)?.offset===offset)continue;
   frames.push({offset,transform,easing:'ease-in-out'});
  }
  for(const [time,transform]of action)frames.push({offset:time/DURATION,transform,easing:'cubic-bezier(.34,1.3,.64,1)'});
  return frames;
 };
 // Sleeves remain in the body; the registered forearms/hands/props move together.
 const body=idle([[0,rest],[2000,'scale(1.001,1.003)'],[4000,rest],[6000,'scale(1.001,1.002)'],[8000,rest]],[[11000,rest]]);
 const inspecting=pose==='read'||pose==='pour';
 const headAction=inspecting
  ?[[8250,'translateY(-1px) rotate(-1deg)'],[8600,'translateY(2px) rotate(2.5deg)'],[9300,'translateY(2px) rotate(2deg)'],[10100,'translateY(1px) rotate(2deg)'],[10600,'translateY(-1px) rotate(-.5deg)'],[11000,rest]]
  :[[8250,'translateY(1px) rotate(-1deg)'],[8600,'translateY(-2px) rotate(2deg)'],[9200,'translateY(-1px) rotate(-1.5deg)'],[9800,'rotate(1deg)'],[10500,'rotate(-.3deg)'],[11000,rest]];
 const head=idle([[0,rest],[2000,'translateY(-1px) rotate(.8deg)'],[2600,'translateY(-1px) rotate(.8deg)'],[4000,rest],[6000,'translateY(-.6px) rotate(-.6deg)'],[6500,'translateY(-.6px) rotate(-.6deg)'],[8000,rest]],headAction);
 // Jo holds each prop with two hands. Bounded central movement keeps both wrist joins intact.
 const gestureAction=pose==='read'
  ?[[8250,'translateY(1px) rotate(.3deg)'],[8650,'translateY(-5px) rotate(-.7deg)'],[9250,'translateY(-4px) rotate(-.5deg)'],[10000,'translateY(-4px) rotate(-.5deg)'],[10500,'translateY(-1px) rotate(.2deg)'],[11000,rest]]
  :pose==='pour'
   ?[[8250,'rotate(.4deg)'],[8650,'translateY(-1px) rotate(-1.2deg)'],[9100,'translateY(1px) rotate(1deg)'],[9550,'translateY(-1px) rotate(-1deg)'],[10000,'translateY(1px) rotate(.8deg)'],[10500,'rotate(-.3deg)'],[11000,rest]]
   :pose==='offer'
    ?[[8250,'translateY(1px)'],[8700,'translateY(-4px) rotate(-.8deg)'],[9450,'translateY(-3px) rotate(.6deg)'],[10200,'translateY(-1px) rotate(-.3deg)'],[11000,rest]]
    :[[8250,'translateY(1px) rotate(.4deg)'],[8650,'translateY(-3px) rotate(-.8deg)'],[9100,'translateY(1px) rotate(.6deg)'],[9550,'translateY(-2px) rotate(-.6deg)'],[10000,'translateY(1px) rotate(.4deg)'],[10500,'translateY(-1px)'],[11000,rest]];
 const gesture=idle([[0,rest],[2000,'translateY(-.5px) rotate(-.2deg)'],[4000,rest],[6000,'translateY(-.3px) rotate(.2deg)'],[8000,rest]],gestureAction);
 const gaze=idle([[0,'translate(0px,0px)'],[1800,'translate(1.2px,.3px)'],[2700,'translate(1.2px,.3px)'],[4100,'translate(0px,0px)'],[5800,'translate(-.9px,.2px)'],[6500,'translate(-.9px,.2px)'],[8000,'translate(0px,0px)']],[[11000,'translate(0px,0px)']]);
 const face=gaze.map(frame=>({...frame,transform:frame.transform.replace(/(-?[\d.]+)px/g,(_,n)=>Number(n)*.25+'px')}));
 const root=pose==='clap'
  ?[[0,rest],[8000,rest],[8250,'translateY(2px) rotate(-.6deg)'],[8600,'translateY(-12px) rotate(1deg)'],[9000,'translateY(-8px) rotate(-1deg)'],[9400,'translateY(1px) rotate(.5deg)'],[9750,rest],[11000,rest]].map(([time,transform])=>({offset:time/DURATION,transform,easing:'cubic-bezier(.34,1.3,.64,1)'}))
  :[{offset:0,transform:rest},{offset:1,transform:rest}];
 return{body,head,gesture,gaze,face,root};
}

export function mountJo(slot){
 if(!slot||slot.dataset.character!=='jo')return null;
 if(controllers.has(slot))return controllers.get(slot);
 const requestedPose=slot.dataset.posture,pose=requestedPose,reduced=motionPreference;
 const fallback=slot.querySelector(':scope>.character-art'),originalSource=slot.dataset.anatomySource;
 const stage=document.createElement('span');stage.className='jo-motion-stage';stage.hidden=true;stage.setAttribute('aria-hidden','true');slot.append(stage);
 let disposed=false,ready=false,visible=false,animations=[],faceFrame=0,spec,nodes,reaction=null;
 slot.dataset.joMotion='loading';
 const remember=()=>{if(animations.length)elapsedByPose.set(pose,reaction?.idlePhase??phaseOf(animations[0].currentTime));};
 const endReaction=()=>{
  if(!reaction)return;
  const phase=reaction.idlePhase;reaction.effects.forEach(a=>a.cancel());reaction=null;
  for(const a of animations){a.pause();a.currentTime=phase;}
  delete slot.dataset.joReaction;
 };
 const startReaction=()=>{
  const activity=slot.closest('.activity-page'),result=activity?.dataset.answerState,key=activity?.dataset.castAnswer||activity?.dataset.minaAnswer;
  if(!key||!['correct','incorrect'].includes(result)||reactedAnswers.has(key)||reduced.matches)return;
  reactedAnswers.add(key);
  // Bound the in-session replay guard without retaining learner answer content.
  if(reactedAnswers.size>500)reactedAnswers.delete(reactedAnswers.values().next().value);
  const idlePhase=phaseOf(animations[0].currentTime);
  for(const a of animations){a.pause();a.currentTime=0;}
  const happy=result==='correct',duration=happy?1100:1300;
  const rootFrames=happy?[{transform:'translateY(0)'},{transform:'translateY(3px)',offset:.16},{transform:'translateY(-48px)',offset:.43},{transform:'translateY(-40px)',offset:.58},{transform:'translateY(2px)',offset:.82},{transform:'translateY(0)'}]:[{transform:'translateY(0)'},{transform:'translateY(0)'}];
  const headFrames=happy?[{transform:'rotate(0deg)'},{transform:'rotate(-3deg)',offset:.43},{transform:'rotate(1.5deg)',offset:.8},{transform:'rotate(0deg)'}]:[{transform:'translateY(0) rotate(0deg)'},{transform:'translateY(4px) rotate(-4deg)',offset:.22},{transform:'translateY(-2px) rotate(3deg)',offset:.46},{transform:'translateY(2px) rotate(-2deg)',offset:.7},{transform:'translateY(0) rotate(0deg)'}];
  const effects=[nodes.reactionRoot.animate(rootFrames,{duration,fill:'both',easing:'ease-in-out'}),nodes.reactionHead.animate(headFrames,{duration,fill:'both',easing:'ease-in-out'})];
  for(const a of effects){a.pause();a.currentTime=0;}
  reaction={effects,duration,idlePhase,happy};slot.dataset.joReaction=result;
 };
 const setHidden=(node,hidden)=>{if(node.hidden!==hidden)node.hidden=hidden;};
 const renderFace=()=>{
  if(!ready||disposed)return;
  // Some engines update matches before delivering its change event; never freeze a live rig mid-reaction.
  if(reduced.matches){sync();return;}
  if(reaction&&Number(reaction.effects[0].currentTime)>=reaction.duration){endReaction();sync();return;}
  const time=phaseOf(animations[0]?.currentTime??elapsedByPose.get(pose));
  const local=time%IDLE,accent=time>=8000;
  const blink=!reaction&&!accent&&((local>=2350&&local<2490)||(local>=6100&&local<6240));
  const focus=reaction?!reaction.happy:(pose==='read'||pose==='pour')&&time>=8600&&time<10300;
  const joy=reaction?reaction.happy:(pose==='offer'||pose==='clap')&&time>=8500&&time<9900;
  setHidden(nodes.focus,!focus);setHidden(nodes.joy,!joy);setHidden(nodes.neutral,focus||joy);
  setHidden(nodes.openEyes,blink);setHidden(nodes.blink,!blink);
  const expression=focus?'focus':joy?'joy':blink?'blink':'neutral';
  if(slot.dataset.joExpression!==expression)slot.dataset.joExpression=expression;
  const phase=accent?'accent':'idle';if(slot.dataset.joPhase!==phase)slot.dataset.joPhase=phase;
  if(visible&&!document.hidden&&!reduced.matches&&!stage.hidden)faceFrame=requestAnimationFrame(renderFace);
 };
 const size=()=>{
  if(!spec)return;const rect=slot.getBoundingClientRect();
  stage.style.setProperty('--jo-fit',Math.min(rect.width/spec.width,rect.height/spec.height)*.98);
 };
 const resize=new ResizeObserver(size);resize.observe(slot);
 const sync=()=>{
  if(disposed||!ready)return;
  cancelAnimationFrame(faceFrame);faceFrame=0;
  if(reduced.matches){
   const activity=slot.closest('.activity-page'),answerKey=activity?.dataset.castAnswer||activity?.dataset.minaAnswer;
   if(answerKey)reactedAnswers.add(answerKey);
   endReaction();
   remember();animations.forEach(animation=>animation.cancel());animations=[];
   stage.hidden=true;if(fallback)fallback.hidden=false;
   slot.dataset.joMotion='reduced';slot.dataset.motionPaused='true';slot.dataset.joPhase='idle';slot.dataset.joExpression='neutral';slot.dataset.anatomySource=originalSource||'complete-static-render';return;
  }
  stage.hidden=false;if(fallback)fallback.hidden=true;
  slot.dataset.joMotion='ready';slot.dataset.anatomySource='generated-parts-jo-v1';
  if(!animations.length){
   const motion=tracks(pose),timing={duration:DURATION,iterations:Infinity,easing:'linear',fill:'both'};
   const add=(node,frames)=>{const animation=node.animate(frames,timing);animation.pause();animation.currentTime=slot.closest('.result-page')?IDLE:(elapsedByPose.get(pose)||0);animations.push(animation);};
   add(nodes.body,motion.body);add(nodes.head,motion.head);if(nodes.gesture)add(nodes.gesture,motion.gesture);
   add(nodes.root,motion.root);add(nodes.pupils,motion.gaze);add(nodes.face,motion.face);
  }
  startReaction();
  const play=visible&&!document.hidden;
  if(reaction){
   const phase=Number(reaction.effects[0].currentTime)||0;
   for(const a of reaction.effects){a.pause();a.currentTime=phase;if(play){a.play();a.startTime=document.timeline.currentTime-phase;}}
   slot.dataset.motionPaused=String(!play);renderFace();return;
  }
  const phase=Number(animations[0].currentTime)||0;
  for(const animation of animations){animation.pause();animation.currentTime=phase;}
  if(play){const start=document.timeline.currentTime-phase;for(const animation of animations){animation.play();animation.startTime=start;}}
  else remember();
  slot.dataset.motionPaused=String(!play);renderFace();
 };
 const intersection=new IntersectionObserver(entries=>{visible=entries[0]?.isIntersecting===true;sync();},{threshold:.05});intersection.observe(slot);
 reduced.addEventListener('change',sync);document.addEventListener('visibilitychange',sync);
 const controller={
  get animations(){return animations;},duration:DURATION,
  dispose(){
   if(disposed)return;remember();endReaction();disposed=true;cancelAnimationFrame(faceFrame);animations.forEach(animation=>animation.cancel());animations=[];
   resize.disconnect();intersection.disconnect();reduced.removeEventListener('change',sync);document.removeEventListener('visibilitychange',sync);
   stage.remove();if(fallback)fallback.hidden=false;
   if(originalSource)slot.dataset.anatomySource=originalSource;else delete slot.dataset.anatomySource;
   for(const key of['joMotion','joPhase','joExpression','motionPaused'])delete slot.dataset[key];controllers.delete(slot);
  }
 };
 controllers.set(slot,controller);
 controller.ready=loadManifest().then(async manifest=>{
  if(disposed||!slot.isConnected)return controller;
  spec=manifest.poses?.[requestedPose]||manifest.poses?.[pose]||manifest[pose];if(!spec)throw Error('Missing Jo pose '+pose);
  if(!spec.width||!spec.height)throw Error('Missing Jo pose canvas');
  stage.style.width=spec.width+'px';stage.style.height=spec.height+'px';size();
  const group=name=>{const node=document.createElement('span');node.className=name+' jo-motion-group';return node;};
  const image=(part,optional=false)=>{
   const path=spec.parts?.[part];if(!path){if(optional)return null;throw Error('Missing Jo '+pose+' '+part);}
   const img=new Image();img.alt='';img.draggable=false;img.src=asset(path);img.dataset.joPart=part;img.className='jo-motion-layer';return img;
  };
  const mask=(node,path)=>{const value='url("'+asset(path)+'")';node.style.maskImage=value;node.style.webkitMaskImage=value;};
  const pivot=(node,value,fallback)=>node.style.transformOrigin=(value||fallback).map(n=>n+'px').join(' ');
  const reactionRoot=group('jo-motion-reaction-root'),reactionHead=group('jo-motion-reaction-head');
  const root=group('jo-motion-root'),head=group('jo-motion-head'),faceMask=group('jo-motion-face-mask'),face=group('jo-motion-face');
  const neutral=group('jo-motion-neutral'),openEyes=group('jo-motion-open-eyes'),pupilMask=group('jo-motion-pupil-mask');
  const headArt=image('head'),body=image('body'),gesture=image('gesture',true),nose=image('nose',true),neutralArt=image('neutral'),eyes=image('eyes'),pupils=image('pupils'),blink=image('blink'),focus=image('focus'),joy=image('joy');
  const images=[headArt,body,gesture,nose,neutralArt,eyes,pupils,blink,focus,joy].filter(Boolean);
  mask(faceMask,spec.parts.head);mask(pupilMask,spec.parts.eyes);pupilMask.append(pupils);openEyes.append(eyes,pupilMask);neutral.append(neutralArt,openEyes,blink);face.append(neutral,focus,joy);if(nose)face.append(nose);faceMask.append(face);head.append(headArt,faceMask);reactionHead.append(head);root.append(reactionHead,body);if(gesture)root.append(gesture);reactionRoot.append(root);stage.append(reactionRoot);
  body.classList.add('jo-motion-body');if(gesture)gesture.classList.add('jo-motion-gesture');
  pivot(body,spec.pivots?.body,[spec.width/2,spec.height]);pivot(head,spec.pivots?.head,[spec.width/2,spec.height*.3]);
  if(gesture)pivot(gesture,spec.pivots?.gesture,[spec.width/2,spec.height*.5]);pivot(root,null,[spec.width/2,spec.height]);
  pivot(reactionHead,spec.pivots?.head,[spec.width/2,spec.height*.3]);
  nodes={root,head,body,gesture,face,neutral,openEyes,pupils,blink,focus,joy,reactionRoot,reactionHead};
  setHidden(blink,true);setHidden(focus,true);setHidden(joy,true);
  await Promise.all(images.map(img=>img.decode()));
  if(disposed||!slot.isConnected)return controller;ready=true;size();sync();return controller;
 }).catch(()=>{
  if(!disposed){stage.hidden=true;if(fallback)fallback.hidden=false;slot.dataset.joMotion='fallback';slot.dataset.motionPaused='true';}
  return controller;
 });
 return controller;
}

export function unmountJo(slot){controllers.get(slot)?.dispose();}
