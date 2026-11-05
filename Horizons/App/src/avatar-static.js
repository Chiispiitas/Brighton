import {mountAvatarMotion} from './avatar-motion.js?v=face2';
/* Native bitmap portraits; only the editor and selected path portrait opt into motion. */
const mounts=new WeakMap();
const appURL=new URL('../',import.meta.url);
let atlasPromise;
const style=`.hzn-avatar-static{position:relative;display:block;width:100%;height:100%;overflow:hidden;isolation:isolate;pointer-events:none;container-type:size}.hzn-avatar-static-stage{position:absolute;left:50%;top:50%;width:min(100cqw,100cqh);height:min(100cqw,100cqh);transform:translate(-50%,-50%)}.hzn-avatar-static-pixels{position:absolute;display:block;overflow:hidden}.hzn-avatar-static-pixels>img{position:absolute;display:block;max-width:none!important;max-height:none!important;pointer-events:none;user-select:none}.hzn-avatar-static [hidden]{display:none!important}.hzn-avatar-static,.hzn-avatar-static *{animation:none!important;transition:none!important}`;
function installStyle(){if(document.getElementById('hzn-avatar-static-style'))return;const node=document.createElement('style');node.id='hzn-avatar-static-style';node.textContent=style;document.head.append(node);}
function hairFilter(color){const id='hzn-hair-'+color.slice(1);if(document.getElementById(id))return id;const ns='http://www.w3.org/2000/svg',svg=document.createElementNS(ns,'svg'),filter=document.createElementNS(ns,'filter'),paint=document.createElementNS(ns,'feFlood'),cut=document.createElementNS(ns,'feComposite');svg.setAttribute('width','0');svg.setAttribute('height','0');svg.setAttribute('aria-hidden','true');svg.style.position='absolute';filter.id=id;paint.setAttribute('flood-color',color);paint.setAttribute('result','paint');cut.setAttribute('in','paint');cut.setAttribute('in2','SourceAlpha');cut.setAttribute('operator','in');filter.append(paint,cut);svg.append(filter);document.body.append(svg);return id;}
function atlas(){return atlasPromise??=fetch(new URL('assets/art/avatar-static-v1.frames.json?round=1',appURL)).then(r=>{if(!r.ok)throw Error('Static avatar artwork could not be opened');return r.json();});}
export function unmountAvatar(element){mounts.get(element)?.dispose();mounts.delete(element);}
export function mountAvatar(element,{avatar={},manifest}={}){
 installStyle();unmountAvatar(element);let disposed=false;
 const frame=document.createElement('span');frame.className='hzn-avatar-static';frame.dataset.avatarRender='static';frame.dataset.avatarMotion='static';frame.dataset.intentionalCrop='bust';frame.setAttribute('aria-hidden','true');
 const stage=document.createElement('span');stage.className='hzn-avatar-static-stage';frame.append(stage);const feedback=document.createElement('span');feedback.className='hzn-avatar-feedback';feedback.style.cssText='position:absolute;inset:0;transform-origin:50% 50%';stage.append(feedback);const idle=document.createElement('span');idle.className='hzn-avatar-idle';idle.style.cssText='position:absolute;inset:0;transform-origin:50% 80%';feedback.append(idle);element.replaceChildren(frame);
 const controller={frame,motion:'static',duration:0,setMood(){},seek(){},pause(){},play(){},dispose(){disposed=true;controller.motionController?.dispose();if(mounts.get(element)===controller){element.replaceChildren();mounts.delete(element);}}};
 mounts.set(element,controller);
 controller.ready=atlas().then(async data=>{
  if(disposed)return controller;
  const base=avatar.body==='female'?'female':'male',skin=data.bases[base].skins[avatar.skin]||data.bases[base].skins['skin-1'];frame.dataset.avatarBase=base;
  function layer(asset,part){if(!asset)return;const f=asset.frame,original=asset.position,isClothes=part==='clothes'||part==='clothes-overlay',p=isClothes?{...original,x:160+(original.x-160)*1.06,w:original.w*1.06}:original,node=document.createElement('span');node.className='hzn-avatar-static-pixels';node.dataset.staticPart=part;node.dataset.nativeFrame=JSON.stringify(f);node.dataset.nativeAtlas=JSON.stringify(asset.atlas);node.style.cssText=`left:${p.x/3.2}%;top:${p.y/3.2}%;width:${p.w/3.2}%;height:${p.w*f.h/f.w/3.2}%;z-index:${p.z}`;const img=document.createElement('img');img.alt='';img.draggable=false;img.decoding='async';img.src=new URL(asset.src,appURL).href;img.style.cssText=`width:${asset.atlas.width/f.w*100}%;height:${asset.atlas.height/f.h*100}%;left:${-f.x/f.w*100}%;top:${-f.y/f.h*100}%`;if(isClothes)node.style.clipPath=`circle(50cqw at ${(160-p.x)/3.2}cqw ${(160-p.y)/3.2}cqw)`;if(part==='hair'){const color=manifest?.avatar?.hairColor?.find(c=>c.id===avatar.hairColor)?.swatch;if(color&&avatar.hairColor!=='color-original'){img.style.setProperty('filter','url(#'+hairFilter(color)+')','important');node.dataset.hairColor=avatar.hairColor;}}node.append(img);idle.append(node);return node;}
  const clothes=data.clothes[avatar.outfit]||data.clothes['outfit-1'];
  const active=!!element.closest('#avatar-preview,.path-player');
  const fallback=layer(skin,active?'still-fallback':'head');let blank,face,eyes,closed,pupils=[];
  if(active){
   blank=layer({...skin,src:'assets/art/avatar-face-v2/blank-heads.png'},'head');blank.hidden=true;
   const clip=document.createElement('span'),f=skin.frame,p=skin.position;
   clip.dataset.staticPart='face-mask';clip.hidden=true;
   const mask=new URL('assets/art/avatar-face-v2/blank-heads.png',appURL).href;
   clip.style.cssText=`position:absolute;left:${p.x/3.2}%;top:${p.y/3.2}%;width:${p.w/3.2}%;height:${p.w*f.h/f.w/3.2}%;z-index:2;mask-image:url("${mask}");mask-size:${skin.atlas.width/f.w*100}% ${skin.atlas.height/f.h*100}%;mask-position:${f.x/(skin.atlas.width-f.w)*100}% ${f.y/(skin.atlas.height-f.h)*100}%;mask-repeat:no-repeat`;
   const canvas=document.createElement('span');canvas.style.cssText=`position:absolute;left:${-p.x/p.w*100}%;top:${-p.y/(p.w*f.h/f.w)*100}%;width:${320/p.w*100}%;height:${320/(p.w*f.h/f.w)*100}%`;
   face=document.createElement('span');face.className='hzn-avatar-face';face.style.cssText='position:absolute;inset:0';canvas.append(face);clip.append(canvas);idle.append(clip);
   const group=part=>{const node=document.createElement('span');node.dataset.staticPart=part;node.style.cssText='position:absolute;inset:0';face.append(node);return node;};
   const sprite=(name,parent,x,y,w,h)=>{const img=document.createElement('img');img.src=new URL(`assets/art/avatar-face-v2/${name}.png`,appURL).href;img.alt='';img.draggable=false;img.dataset.facePart=name;img.style.cssText=`position:absolute;left:${x/3.2}%;top:${y/3.2}%;width:${w/3.2}%;height:${h/3.2}%;max-width:none`;parent.append(img);return img;};
   eyes=group('open-eyes');closed=group('closed-eyes');closed.hidden=true;
   for(const [i,[x,y]]of skin.eyeCenters.entries()){
    const side=i?'right':'left',eye=document.createElement('span');
    const eyeURL=new URL(`assets/art/avatar-face-v2/eye-${side}.png`,appURL).href;
    eye.dataset.eyeMask=side;eye.style.cssText=`position:absolute;left:${(x-17.5)/3.2}%;top:${(y-21.5)/3.2}%;width:${35/3.2}%;height:${43/3.2}%;mask:url("${eyeURL}") center / 100% 100% no-repeat`;
    const white=document.createElement('img');white.src=eyeURL;white.alt='';white.style.cssText='position:absolute;inset:0;width:100%;height:100%';eye.append(white);
    const pupil=document.createElement('span');pupil.dataset.facePart='pupil';pupil.style.cssText='position:absolute;inset:0';
    const dot=document.createElement('img');dot.src=new URL('assets/art/avatar-face-v2/pupil.png',appURL).href;dot.alt='';dot.style.cssText='position:absolute;left:50%;top:50%;width:51.43%;height:41.86%;transform:translate(-50%,-50%)';pupil.append(dot);eye.append(pupil);pupils.push(pupil);eyes.append(eye);
    sprite('lid-'+side,closed,x-17.5,y-5.5,35,11);
    sprite('brow-'+side,face,x-17.5,y-37,35,11);
   }
   sprite('nose',face,153.5,147,13,22);sprite('mouth',face,143,179,34,11);
   controller.faceReady=Promise.all([blank.querySelector('img'),...clip.querySelectorAll('img')].map(img=>img.decode())).then(()=>{if(disposed)return false;fallback.hidden=true;blank.hidden=false;clip.hidden=false;frame.dataset.faceRig='faceless-v2';return true;}).catch(()=>{frame.dataset.avatarMotion='fallback';return false;});
  }
  layer(clothes,'clothes');
  for(const overlay of clothes.overlays||[])layer(overlay,'clothes-overlay');
  layer(data.hair[avatar.hair],'hair');
  const extra=data.accessories[avatar.accessory];
  if(extra){
   const [left,right]=skin.eyeCenters,[lensLeft,lensRight]=extra.lensCenters;
   const scale=(right[0]-left[0])/(lensRight[0]-lensLeft[0]);
   const position={x:left[0]-lensLeft[0]*scale,y:(left[1]+right[1])/2-(lensLeft[1]+lensRight[1])/2*scale,w:extra.frame.w*scale,z:6};
   layer({...extra,position},'eyewear');
  }
  const groups=manifest?.avatar?.groups||manifest?.avatar?.layers||manifest?.avatar;
  const pins=groups?.badge,options=Array.isArray(pins)?pins:pins?.options;
  const pin=options?.find(option=>option.id===avatar.badge),pinPosition=data.badges[avatar.badge]?.position;
  layer(pin?.src&&pin.frame&&pin.atlas&&pinPosition?{...pin,position:pinPosition}:data.badges[avatar.badge],'badge');frame.dataset.ready='true';frame.dataset.rigReady='true';if(active&&await controller.faceReady&&!disposed){controller.motion='minimal';controller.motionController=mountAvatarMotion(element,{frame,idle,feedback,face,eyes,closed,pupils});await controller.motionController.ready;}return controller;
 }).catch(error=>{if(!disposed){element.dataset.avatarError='true';console.error(error);}throw error;});
 return controller;
}
