/* Native flat bitmap portraits. Intentionally static in every context. */
const mounts=new WeakMap();
const appURL=new URL('../',import.meta.url);
let atlasPromise;
const style=`.hzn-avatar-static{position:relative;display:block;width:100%;height:100%;overflow:hidden;isolation:isolate;pointer-events:none;container-type:size}.hzn-avatar-static-stage{position:absolute;left:50%;top:50%;width:min(100cqw,100cqh);height:min(100cqw,100cqh);transform:translate(-50%,-50%)}.hzn-avatar-static-pixels{position:absolute;display:block;overflow:hidden}.hzn-avatar-static-pixels>img{position:absolute;display:block;max-width:none!important;max-height:none!important;pointer-events:none;user-select:none}.hzn-avatar-static,.hzn-avatar-static *{animation:none!important;transition:none!important}`;
function installStyle(){if(document.getElementById('hzn-avatar-static-style'))return;const node=document.createElement('style');node.id='hzn-avatar-static-style';node.textContent=style;document.head.append(node);}
function atlas(){return atlasPromise??=fetch(new URL('assets/art/avatar-static-v1.frames.json?wardrobe=1',appURL)).then(r=>{if(!r.ok)throw Error('Static avatar artwork could not be opened');return r.json();});}
export function unmountAvatar(element){mounts.get(element)?.dispose();mounts.delete(element);}
export function mountAvatar(element,{avatar={},manifest}={}){
 installStyle();unmountAvatar(element);let disposed=false;
 const frame=document.createElement('span');frame.className='hzn-avatar-static';frame.dataset.avatarRender='static';frame.dataset.avatarMotion='static';frame.dataset.intentionalCrop='bust';frame.setAttribute('aria-hidden','true');
 const stage=document.createElement('span');stage.className='hzn-avatar-static-stage';frame.append(stage);element.replaceChildren(frame);
 const controller={frame,motion:'static',duration:0,setMood(){},seek(){},pause(){},play(){},dispose(){disposed=true;if(mounts.get(element)===controller){element.replaceChildren();mounts.delete(element);}}};
 mounts.set(element,controller);
 controller.ready=atlas().then(data=>{
  if(disposed)return controller;
  const base=avatar.body==='female'?'female':'male',skin=data.bases[base].skins[avatar.skin]||data.bases[base].skins['skin-1'];frame.dataset.avatarBase=base;
  function layer(asset,part){if(!asset)return;const f=asset.frame,p=asset.position,node=document.createElement('span');node.className='hzn-avatar-static-pixels';node.dataset.staticPart=part;node.dataset.nativeFrame=JSON.stringify(f);node.dataset.nativeAtlas=JSON.stringify(asset.atlas);node.style.cssText=`left:${p.x/3.2}%;top:${p.y/3.2}%;width:${p.w/3.2}%;height:${p.w*f.h/f.w/3.2}%;z-index:${p.z}`;const img=document.createElement('img');img.alt='';img.draggable=false;img.decoding='async';img.src=new URL(asset.src,appURL).href;img.style.cssText=`width:${asset.atlas.width/f.w*100}%;height:${asset.atlas.height/f.h*100}%;left:${-f.x/f.w*100}%;top:${-f.y/f.h*100}%`;node.append(img);stage.append(node);}
  layer(skin,'head');layer(data.clothes[avatar.outfit]||data.clothes['outfit-1'],'clothes');
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
  layer(pin?.src&&pin.frame&&pin.atlas&&pinPosition?{...pin,position:pinPosition}:data.badges[avatar.badge],'badge');frame.dataset.ready='true';frame.dataset.rigReady='true';return controller;
 }).catch(error=>{if(!disposed){element.dataset.avatarError='true';console.error(error);}throw error;});
 return controller;
}
