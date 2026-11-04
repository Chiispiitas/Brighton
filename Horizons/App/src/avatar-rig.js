/* Native ImageGen avatar layers, articulated as an upper-chest portrait. */
const mounts = new WeakMap();
const appURL = new URL('../', import.meta.url);
let manifestPromise;
const css = `
.hzn-avatar-bust{position:relative;display:block;width:100%;height:100%;overflow:hidden;isolation:isolate;pointer-events:none}
.hzn-avatar-stage{position:absolute;width:320px;height:320px;transform-origin:0 0}
.hzn-avatar-torso,.hzn-avatar-head{position:absolute;inset:0;transform-origin:160px 254px}
.hzn-avatar-torso{z-index:1;animation:hz-avatar-shoulders var(--avatar-period,7s) ease-in-out infinite;animation-delay:var(--avatar-phase,0s)}
.hzn-avatar-head{z-index:3;animation:hz-avatar-listen var(--avatar-period,7s) ease-in-out infinite;animation-delay:var(--avatar-phase,0s)}
.hzn-avatar-bust[data-personality=curious] .hzn-avatar-head{animation-name:hz-avatar-curious}
.hzn-avatar-bust[data-personality=cheerful] .hzn-avatar-head{animation-name:hz-avatar-cheerful}
.hzn-avatar-pixels{position:absolute;overflow:hidden;display:block;transform-origin:50% 50%}
.hzn-avatar-pixels>img{position:absolute;max-width:none!important;max-height:none!important;display:block;pointer-events:none;user-select:none}
.hzn-avatar-eyes{opacity:0;z-index:4;animation:hz-avatar-blink var(--avatar-blink,5.6s) steps(1,end) infinite;animation-delay:var(--avatar-blink-phase,0s);mask-image:linear-gradient(90deg,transparent,#000 10%,#000 90%,transparent),linear-gradient(0deg,transparent,#000 15%,#000 85%,transparent);mask-composite:intersect}
.hzn-avatar-hair{z-index:5;transform-origin:50% 90%}
.hzn-avatar-bust[data-mood=wave] .hzn-avatar-head{animation:hz-avatar-hello 2.1s ease-in-out both}
.hzn-avatar-bust[data-mood=wave] .hzn-avatar-torso{animation:hz-avatar-welcome-shoulders 2.1s ease-in-out both}
.hzn-avatar-bust[data-mood=celebrate] .hzn-avatar-head{animation:hz-avatar-proud 2.1s ease-in-out both}
.hzn-avatar-bust[data-mood=celebrate] .hzn-avatar-torso{animation:hz-avatar-proud-shoulders 2.1s ease-in-out both}
.hzn-avatar-bust[data-mood=celebrate] [data-rig-part=badge]{animation:hz-avatar-pin 2.1s ease-in-out both}
@keyframes hz-avatar-blink{0%,34%,37%,81%,84%,100%{opacity:0}35%,36%,82%,83%{opacity:1}}
@keyframes hz-avatar-listen{0%,18%,100%{transform:rotate(0)}35%,48%{transform:rotate(-2.3deg)}62%,73%{transform:rotate(1deg)}87%{transform:rotate(-.5deg)}}
@keyframes hz-avatar-curious{0%,16%,100%{transform:rotate(0)}30%,40%{transform:rotate(2.8deg)}47%{transform:rotate(1.8deg)}55%{transform:rotate(2.8deg)}74%,86%{transform:rotate(-1.2deg)}}
@keyframes hz-avatar-cheerful{0%,22%,100%{transform:rotate(0)}34%{transform:rotate(-1.9deg)}43%{transform:rotate(.8deg)}52%{transform:rotate(-1.2deg)}63%,77%{transform:rotate(1.4deg)}}
@keyframes hz-avatar-shoulders{0%,20%,100%{transform:rotate(0)}44%,58%{transform:rotate(.45deg)}79%{transform:rotate(-.3deg)}}
@keyframes hz-avatar-hello{0%,100%{transform:rotate(0)}18%{transform:rotate(-3.5deg)}36%{transform:rotate(1.7deg)}52%{transform:rotate(-2deg)}69%{transform:rotate(1deg)}85%{transform:rotate(-.5deg)}}
@keyframes hz-avatar-welcome-shoulders{0%,100%{transform:rotate(0)}23%{transform:rotate(1.2deg)}54%{transform:rotate(-.7deg)}79%{transform:rotate(.4deg)}}
@keyframes hz-avatar-proud{0%,100%{transform:rotate(0)}20%{transform:rotate(-3deg)}38%{transform:rotate(2deg)}56%{transform:rotate(-2deg)}75%{transform:rotate(.8deg)}}
@keyframes hz-avatar-proud-shoulders{0%,100%{transform:rotate(0)}24%{transform:rotate(-1.3deg)}49%{transform:rotate(.9deg)}75%{transform:rotate(-.4deg)}}
@keyframes hz-avatar-pin{0%,100%{transform:scale(1)}35%,58%{transform:scale(1.12)}80%{transform:scale(.98)}}
@media(prefers-reduced-motion:reduce){.hzn-avatar-bust *{animation:none!important}.hzn-avatar-bust .hzn-avatar-eyes{opacity:0!important}}
`;
function installStyle(){if(document.getElementById('hzn-avatar-bust-style'))return;const style=document.createElement('style');style.id='hzn-avatar-bust-style';style.textContent=css;document.head.append(style);}
function getManifest(){return manifestPromise??=fetch(new URL('assets/art/manifest.json',appURL)).then(response=>{if(!response.ok)throw Error('Avatar artwork could not be opened');return response.json();});}
function groups(data){return data.avatar?.groups||data.avatar?.layers||data.avatar||{};}
function choice(data,group,id){const values=groups(data)[group];const options=Array.isArray(values)?values:values?.options||[];return options.find(option=>option.id===id)||options[0];}
function seedFor(avatar){return Object.values(avatar||{}).join(':').split('').reduce((value,char)=>(value*31+char.charCodeAt(0))>>>0,7);}
export function unmountAvatar(element){mounts.get(element)?.dispose();mounts.delete(element);}
export function mountAvatar(element,{avatar={},manifest,mood='idle'}={}){
 installStyle();unmountAvatar(element);let disposed=false,timer,observer;
 const state={dispose(){disposed=true;clearTimeout(timer);observer?.disconnect();element.removeEventListener('pointerenter',greet);element.removeEventListener('focusin',greet);element.replaceChildren();},setMood(next='idle'){if(!state.frame)return;clearTimeout(timer);state.frame.dataset.mood='idle';void state.frame.offsetWidth;state.frame.dataset.mood=next;if(next!=='idle')timer=setTimeout(()=>{if(!disposed)state.frame.dataset.mood='idle';},2150);}};
 const greet=()=>state.setMood('wave');mounts.set(element,state);
 Promise.resolve(manifest||getManifest()).then(data=>{
  if(disposed)return;
  const skin=choice(data,'skin',avatar.skin),outfit=choice(data,'outfit',avatar.outfit),hair=choice(data,'hair',avatar.hair),accessory=choice(data,'accessory',avatar.accessory),badge=choice(data,'badge',avatar.badge);
  if(!skin?.frame)return;
  const frame=document.createElement('span');frame.className='hzn-avatar-bust';frame.dataset.intentionalCrop='bust';frame.dataset.avatarBust='true';frame.dataset.personality=['thoughtful','curious','cheerful'][seedFor(avatar)%3];frame.setAttribute('aria-hidden','true');
  const seed=seedFor(avatar);frame.style.setProperty('--avatar-period',`${6.8+(seed%27)/10}s`);frame.style.setProperty('--avatar-phase',`-${(seed%47)/10}s`);frame.style.setProperty('--avatar-blink',`${4.7+(seed%23)/10}s`);frame.style.setProperty('--avatar-blink-phase',`-${(seed%29)/10}s`);
  const stage=document.createElement('span');stage.className='hzn-avatar-stage';frame.append(stage);const torso=document.createElement('span');torso.className='hzn-avatar-torso';torso.dataset.rigPart='torso';torso.dataset.part='torso';const head=document.createElement('span');head.className='hzn-avatar-head';head.dataset.rigPart='head';head.dataset.part='head';stage.append(torso,head);element.replaceChildren(frame);state.frame=frame;
  const virtualWidth=500,virtualHeight=525,offsetX=(320-virtualWidth)/2,offsetY=44;
  const scale=.94*virtualHeight/skin.frame.h,skinLeft=(320-skin.frame.w*scale)/2,skinTop=.04*virtualHeight+offsetY;
  const sourceCenter=skin.frame.x+skin.frame.w/2;
  function pixels(parent,asset,box,left,top,scale,part,z=1,extra=''){
   const view=document.createElement('span');view.className='hzn-avatar-pixels '+extra;view.dataset.rigPart=part;view.dataset.part=part;view.dataset.nativeFrame=JSON.stringify(box);view.dataset.nativeAtlas=JSON.stringify(asset.atlas);view.style.cssText=`left:${left}px;top:${top}px;width:${box.w*scale}px;height:${box.h*scale}px;z-index:${z}`;
   const img=document.createElement('img');img.src=new URL(asset.src,appURL).href;img.alt='';img.draggable=false;img.decoding='async';img.style.cssText=`width:${asset.atlas.width*scale}px;height:${asset.atlas.height*scale}px;left:${-box.x*scale}px;top:${-box.y*scale}px`;view.append(img);parent.append(view);return view;
  }
  function fullLayer(parent,asset,part,position=asset.position,z=position?.z||2){
   if(!asset?.frame)return;const box=asset.frame,p=position||{},height=p.h*virtualHeight,width=part==='skin'?height*box.w/box.h:p.w*virtualWidth;
   const s=['outfit','skin'].includes(part)?height/box.h:width/box.w;return pixels(parent,asset,box,['outfit','skin'].includes(part)?(320-box.w*s)/2:offsetX+p.x*virtualWidth,offsetY+p.y*virtualHeight,s,part,z);
  }
  // Only the naturally low body/bag is cropped at the requested upper-chest edge.
  if(accessory?.id==='accessory-6')fullLayer(torso,accessory,'accessory',accessory.position,0);
  // The original base wears an undershirt. Keep only generated neck/arm skin,
  // so that tank-top straps cannot protrude above a different outfit's collar.
  const neckBox={x:sourceCenter-11,y:118,w:22,h:18};
  pixels(torso,skin,neckBox,skinLeft+(neckBox.x-skin.frame.x)*scale,skinTop+(neckBox.y-skin.frame.y)*scale,scale,'skin',1);
  fullLayer(torso,outfit,'outfit',outfit?.position,2);
  const headBox={x:sourceCenter-60,y:18,w:120,h:118};
  const face=pixels(head,skin,headBox,skinLeft+(headBox.x-skin.frame.x)*scale,skinTop,scale,'face',1);
  face.style.clipPath='polygon(0 0,100% 0,100% 88%,59% 88%,59% 100%,41% 100%,41% 88%,0 88%)';
  const closed={...skin,src:'assets/art/avatar-blink-v1.png'},eyeBounds={1:[133,194],2:[376,437],3:[618,680],4:[859,921],5:[1101,1163],6:[1343,1405]}[Number(skin.id.split('-')[1])];
  const leftStart=eyeBounds?.[0]||sourceCenter-30,rightEnd=eyeBounds?.[1]||sourceCenter+30;
  for(const x of [leftStart-4,rightEnd-23]){const band={x,y:60,w:28,h:26};pixels(head,closed,band,skinLeft+(band.x-skin.frame.x)*scale,skinTop+(band.y-skin.frame.y)*scale,scale,'eyes',3,'hzn-avatar-eyes');}
  if(hair?.id!=='none')fullLayer(head,hair,'hair',hair?.position,5)?.classList.add('hzn-avatar-hair');
  if(accessory?.id&&accessory.id!=='none'&&accessory.id!=='accessory-6'){
   const p={...accessory.position};if(accessory.id==='accessory-2')p.y=-.06;if(accessory.id==='accessory-3')p.y=.015;if(accessory.id==='accessory-5')p.y=.32;
   const onHead=['accessory-1','accessory-2','accessory-3'].includes(accessory.id);
   const part=fullLayer(onHead?head:torso,accessory,'accessory',p,onHead?6:4);
   if(accessory.id==='accessory-1'&&part){const height=accessory.frame.h*(p.w*virtualWidth/accessory.frame.w);part.style.top=`${skinTop+(73-skin.frame.y)*scale-height/2}px`;}
  }
  if(badge?.id&&badge.id!=='none'&&badge.frame){const s=34/badge.frame.w;pixels(torso,badge,badge.frame,207,278,s,'badge',8);}
  const fit=()=>{const bounds=frame.getBoundingClientRect(),s=Math.min(bounds.width/320,bounds.height/320);stage.style.left=`${(bounds.width-320*s)/2}px`;stage.style.top=`${(bounds.height-320*s)/2}px`;stage.style.transform=`scale(${s})`;};observer=new ResizeObserver(fit);observer.observe(frame);fit();frame.dataset.ready='true';state.setMood(mood);element.addEventListener('pointerenter',greet);element.addEventListener('focusin',greet);
 }).catch(error=>{if(!disposed){element.dataset.avatarError='true';console.error(error);}});
 return state;
}
