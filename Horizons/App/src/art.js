// Still native artwork. This module never starts a timeline or pointer gesture.
let manifest={postures:{},avatar:{}};
let avatarModule,bannerModule,rasterObserver,rasterMutationObserver;
const sourceBase=new URL('../assets/art/',import.meta.url);
const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
export async function loadArt(){
 installRasterFit();
 try{const response=await fetch(new URL('manifest.json?round=1',sourceBase),{cache:'no-cache'});if(response.ok)manifest=await response.json();}catch{/* Keep the learning interface available if artwork cannot load. */}
 return manifest;
}
export function artManifest(){return manifest;}
export function sceneMarkup(name,cls=''){return rasterMarkup(manifest.scenes?.[name],cls,'');}
export function wordArt(word){return manifest.vocabulary?.[word?.term]||manifest.vocabulary?.[word?.id]||word?.image;}
export function assetURL(source){
 if(!source)return '';
 if(/^(https?:|data:|blob:)/.test(source))return source;
 if(source.startsWith('assets/'))return new URL(source,new URL('../',import.meta.url)).href;
 if(source.startsWith('../')||source.startsWith('./')||source.startsWith('/'))return new URL(source,document.baseURI).href;
 return new URL(source,sourceBase).href;
}
function installRasterFit(){
 if(rasterObserver)return;
 const style=document.createElement('style');style.id='hzn-raster-fit';style.textContent='.raster-frame[data-raster-slot]{overflow:hidden;flex-shrink:0}.raster-frame>.raster-fit{position:absolute!important;display:block!important;left:50%!important;top:50%!important;transform:translate(-50%,-50%)!important;max-width:none!important;max-height:none!important;overflow:hidden}.raster-fit>img{position:absolute!important;display:block;max-width:none!important;max-height:none!important;object-fit:fill!important}.raster-frame[data-raster-slot]>img{display:none}';document.head.append(style);
 const fit=slot=>{const inner=slot.querySelector(':scope>.raster-fit');if(!inner)return;const w=Number(slot.dataset.nativeWidth),h=Number(slot.dataset.nativeHeight),rect=slot.getBoundingClientRect();if(!w||!h||!rect.width||!rect.height)return;const scale=Math.min(rect.width/w,rect.height/h);inner.style.width=w*scale+'px';inner.style.height=h*scale+'px';};
 rasterObserver=new ResizeObserver(entries=>entries.forEach(entry=>fit(entry.target)));
 const visit=(node,add)=>{if(node.nodeType!==1)return;for(const slot of[node,...node.querySelectorAll('[data-raster-slot]')])if(slot.matches?.('[data-raster-slot]')){if(add){rasterObserver.observe(slot);fit(slot);}else rasterObserver.unobserve(slot);}};
 rasterMutationObserver=new MutationObserver(records=>{for(const record of records){record.removedNodes.forEach(node=>visit(node,false));record.addedNodes.forEach(node=>visit(node,true));}});rasterMutationObserver.observe(document.body,{childList:true,subtree:true});visit(document.body,true);
}
export function rasterMarkup(asset,cls='',alt=''){
 if(!asset)return '';if(typeof asset==='string')asset={src:asset};
 if(/jobs-v1\.png$/.test(asset.src||'')&&manifest.vocabulary?.[String(alt).trim()])asset=manifest.vocabulary[String(alt).trim()];
 const source=asset.src||asset.file||asset.image;if(!source)return '';
 const frame=asset.frame||asset.bounds||asset.crop,atlas=asset.atlas;
 if(frame&&atlas?.width&&atlas?.height){
  const imageStyle=`width:${atlas.width/frame.w*100}%;height:${atlas.height/frame.h*100}%;left:${-frame.x/frame.w*100}%;top:${-frame.y/frame.h*100}%;`;
  const overlays=(asset.overlays||[]).map(overlay=>{const f=overlay.frame,a=overlay.atlas,p=overlay.placement||{x:0,y:0,w:frame.w};if(!f||!a)return '';const scale=p.w/f.w;return `<img src="${esc(assetURL(overlay.src))}" alt="" draggable="false" style="width:${a.width*scale/frame.w*100}%;height:${a.height*scale/frame.h*100}%;left:${(p.x-f.x*scale)/frame.w*100}%;top:${(p.y-f.y*scale)/frame.h*100}%;">`;}).join('');
  return `<span class="raster-frame ${esc(cls)}" data-raster-slot data-static-art data-native-width="${frame.w}" data-native-height="${frame.h}" style="aspect-ratio:${frame.w}/${frame.h}" role="img" aria-label="${esc(alt)}"><span class="raster-fit"><img src="${esc(assetURL(source))}" alt="" draggable="false" style="${imageStyle}">${overlays}</span></span>`;
 }
 return `<img class="${esc(cls)}" data-static-art src="${esc(assetURL(source))}" alt="${esc(alt)}" draggable="false" ${asset.loading==='eager'?'':'loading="lazy"'}>`;
}
export function characterMarkup(name,cls='',mood='idle',postureOverride){
 const posture=postureOverride||choosePosture(name,cls,mood),pose=manifest.postures?.[name]?.[posture]||Object.values(manifest.postures?.[name]||{})[0];if(!pose)return '';
 return `<span class="character character-${esc(name)} ${esc(cls)}" data-character="${esc(name)}" data-posture="${esc(posture)}" data-anatomy-source="complete-static-render" role="img" aria-label="${esc(name[0].toUpperCase()+name.slice(1))}, your study companion">${rasterMarkup(pose,'character-art posture-art','')}</span>`;
}
function choosePosture(name,cls,mood){
 if(cls.includes('welcome-'))return({pico:'greet',mina:'step',alex:'listen',jo:'offer'})[name];
 if(name==='pico'){if(cls.includes('progress-'))return 'stride';if(mood==='celebrate'||cls.includes('result-'))return 'jump';if(cls.includes('hero-'))return 'explore';return 'read';}
 if(name==='mina'){if(cls.includes('lesson-guide-1c'))return 'read';if(cls.includes('lesson-guide'))return mood==='wave'?'read':'step';if(cls.includes('game-'))return 'skip';return 'map';}
 if(name==='alex'){if(cls.includes('lesson-guide'))return 'fix';if(cls.includes('game-'))return 'dance';return 'sit';}
 if(name==='jo'){if(cls.includes('aside-'))return 'read';if(cls.includes('goal-'))return 'clap';return 'pour';}
 return null;
}
function avatarGroups(){return manifest.avatar?.groups||manifest.avatar?.layers||manifest.avatar||{};}
export function avatarOptions(){const groups=avatarGroups();if(Array.isArray(groups))return groups;return Object.entries(groups).filter(([,values])=>Array.isArray(values)||values?.options).map(([id,values])=>({id,label:({body:'Avatar base',skin:'Skin tone',outfit:'Clothes',hair:'Hair',hairColor:'Hair color',background:'Background',accessory:'Eyewear'})[id]||id[0].toUpperCase()+id.slice(1),options:Array.isArray(values)?values:values.options||[]}));}
export function defaultAvatar(){return Object.fromEntries(avatarOptions().map(group=>[group.id,group.options?.[0]?.id||'none']));}
export function normalizeAvatar(avatar={}){return{...avatar,hairColor:manifest.avatar?.hairColor?.some(c=>c.id===avatar.hairColor)?avatar.hairColor:'color-original',background:manifest.avatar?.background?.some(c=>c.id===avatar.background)?avatar.background:'bg-cream',accessory:['none','accessory-1','accessory-2','accessory-3'].includes(avatar.accessory)?avatar.accessory:'none'};}
export function avatarMarkup(avatar={},cls='',name='Your avatar'){return `<span class="avatar avatar-bust ${esc(cls)}" data-avatar-static data-avatar="${esc(JSON.stringify(normalizeAvatar(avatar)))}" role="img" aria-label="${esc(name)}, bust portrait"></span>`;}
export function refreshArtwork(container=document){
 for(const slot of container.querySelectorAll('.learn-hero .hero-pico.unit1-banner-pico[data-character=pico][data-posture=explore]'))import('./pico-banner-motion.js?v=face3').then(module=>{bannerModule=module;if(slot.isConnected)module.mountBannerPico(slot);}).catch(()=>{if(slot.isConnected)slot.dataset.bannerMotion='fallback';});
 for(const slot of container.querySelectorAll('[data-avatar-static]'))import('./avatar-static.js?v=face3').then(module=>{avatarModule=module;if(slot.isConnected&&!slot.closest('dialog:not([open])'))module.mountAvatar(slot,{avatar:JSON.parse(slot.dataset.avatar||'{}'),manifest});});
}
export function disposeArtwork(container=document){for(const slot of container.querySelectorAll('[data-avatar-static]'))avatarModule?.unmountAvatar?.(slot);for(const slot of container.querySelectorAll('.hero-pico'))bannerModule?.unmountBannerPico(slot);}
