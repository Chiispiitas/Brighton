let manifest = {characters: {}, avatar: {}};
let avatarModule;
let picoArticulatedModule;
let castModule;
let rasterObserver;
let rasterMutationObserver;
const illustratedMotion=new Map();
const sourceBase = new URL('../assets/art/', import.meta.url);
export async function loadArt() {
  installRasterFit();
  try { const response = await fetch(new URL('manifest.json?graphic=1', sourceBase),{cache:'no-cache'}); if (response.ok) { manifest = await response.json(); manifest.characters = manifest.characters || manifest.companions || {}; } }
  catch { /* The app remains usable while artwork is loading or unavailable offline. */ }
  return manifest;
}
export function artManifest() { return manifest; }
export function sceneMarkup(name,cls=''){return rasterMarkup(manifest.scenes?.[name],cls,'');}
export function wordArt(word){return manifest.vocabulary?.[word?.term] || manifest.vocabulary?.[word?.id] || word?.image;}
export function disposeCharacters(container=document){for(const slot of container.querySelectorAll('[data-avatar-rig]'))avatarModule?.unmountAvatar?.(slot);for(const slot of container.querySelectorAll('[data-pico-articulated]'))picoArticulatedModule?.unmountPico?.(slot);for(const slot of container.querySelectorAll('[data-cast-articulated]'))castModule?.unmountCast?.(slot);}
function installRasterFit(){
  if(rasterObserver)return;
  const style=document.createElement('style');style.id='hzn-raster-fit';style.textContent='.raster-frame[data-raster-slot]{overflow:hidden;flex-shrink:0}.raster-frame>.raster-fit{position:absolute!important;display:block!important;left:50%!important;top:50%!important;transform:translate(-50%,-50%)!important;max-width:none!important;max-height:none!important;overflow:hidden}.raster-fit>img{position:absolute!important;display:block;max-width:none!important;max-height:none!important;object-fit:fill!important}.raster-frame[data-raster-slot]>img{display:none}';document.head.append(style);
  const fit=slot=>{const inner=slot.querySelector(':scope>.raster-fit');if(!inner)return;const w=Number(slot.dataset.nativeWidth),h=Number(slot.dataset.nativeHeight),rect=slot.getBoundingClientRect();if(!w||!h||!rect.width||!rect.height)return;const scale=Math.min(rect.width/w,rect.height/h);inner.style.width=w*scale+'px';inner.style.height=h*scale+'px';};
  rasterObserver=new ResizeObserver(entries=>entries.forEach(entry=>fit(entry.target)));
  const animate=slot=>{illustratedMotion.get(slot)?.cancel();illustratedMotion.delete(slot);if(!slot.dataset.illustrationMotion||matchMedia('(prefers-reduced-motion:reduce)').matches)return;const spec=JSON.parse(slot.dataset.illustrationMotion),image=slot.querySelector('.raster-fit>img');if(!image)return;const order=[0,1,2,3,2,1,0,0],times=[0,.14,.28,.44,.59,.73,.86,1],frames=order.map(index=>spec.frames[index]);const animation=image.animate(frames.map((b,i)=>({left:-b.x/b.w*100+'%',top:-b.y/b.h*100+'%',offset:times[i],easing:'steps(1,end)'})),{duration:spec.duration,iterations:Infinity,easing:'linear'});illustratedMotion.set(slot,animation);};
  const register=node=>{if(node.nodeType!==1)return;for(const slot of[node,...node.querySelectorAll('[data-raster-slot]')])if(slot.matches?.('[data-raster-slot]')){rasterObserver.observe(slot);fit(slot);if(slot.dataset.illustrationMotion&&!illustratedMotion.has(slot))animate(slot);}};
  const unregister=node=>{if(node.nodeType!==1)return;for(const slot of[node,...node.querySelectorAll('[data-raster-slot]')])if(slot.matches?.('[data-raster-slot]')){rasterObserver.unobserve(slot);illustratedMotion.get(slot)?.cancel();illustratedMotion.delete(slot);}};
  matchMedia('(prefers-reduced-motion:reduce)').addEventListener('change',()=>document.querySelectorAll('[data-illustration-motion]').forEach(animate));
  rasterMutationObserver=new MutationObserver(records=>{for(const record of records){record.removedNodes.forEach(unregister);record.addedNodes.forEach(register);}});rasterMutationObserver.observe(document.body,{childList:true,subtree:true});register(document.body);
}
const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
export function assetURL(source) {
  if (!source) return '';
  if (/^(https?:|data:|blob:)/.test(source)) return source;
  if (source.startsWith('assets/')) return new URL(source, new URL('../',import.meta.url)).href;
  if (source.startsWith('../') || source.startsWith('./') || source.startsWith('/')) return new URL(source, document.baseURI).href;
  return new URL(source, sourceBase).href;
}
export function rasterMarkup(asset, cls = '', alt = '') {
  if (!asset) return '';
  if (typeof asset === 'string') asset = {src: asset};
  if(/jobs-v1\.png$/.test(asset.src||'')){const replacement=Object.values(manifest.vocabulary||{}).find(item=>item.animation&&item.animation.id===String(alt).replace(' ','-'));if(replacement)asset=replacement;}
  if(['student','driver'].includes(asset.animation?.id)){const student=asset.animation.id==='student';return `<span class="raster-frame ${esc(cls)}" data-cast-articulated data-cast-character="${student?'mina':'alex'}" data-rig-posture="${student?'read':'drive'}" data-rig-mood="idle" data-articulated-vignette="${asset.animation.id}" style="aspect-ratio:1" role="img" aria-label="${esc(alt||asset.animation.id)}"></span>`;}
  const source = asset.src || asset.file || asset.image;
  if (!source) return '';
  const frame = asset.frame || asset.bounds || asset.crop;
  const atlas = asset.atlas;
  if (frame && atlas?.width && atlas?.height) {
    const imageStyle = `width:${atlas.width/frame.w*100}%;height:${atlas.height/frame.h*100}%;left:${-frame.x/frame.w*100}%;top:${-frame.y/frame.h*100}%;`;
    return `<span class="raster-frame ${esc(cls)}" data-raster-slot data-native-width="${frame.w}" data-native-height="${frame.h}" ${asset.animation?`data-illustration-motion="${esc(JSON.stringify(asset.animation))}"`:''} style="aspect-ratio:${frame.w}/${frame.h}" role="img" aria-label="${esc(alt)}"><span class="raster-fit" style="aspect-ratio:${frame.w}/${frame.h}"><img src="${esc(assetURL(source))}" alt="" draggable="false" style="${imageStyle}"></span></span>`;
  }
  return `<img class="${esc(cls)}" src="${esc(assetURL(source))}" alt="${esc(alt)}" draggable="false" ${asset.loading === 'eager' ? '' : 'loading="lazy"'}>`;
}
export function characterMarkup(name, cls = '', mood = 'idle') {
  const posture=choosePosture(name,cls,mood),pose=manifest.postures?.[name]?.[posture]||Object.values(manifest.postures?.[name]||{})[0];
  if(name==='pico')return `<span class="character character-pico ${esc(cls)}" data-character="pico" data-pico-articulated data-motion-system="articulated" data-rig-posture="${esc(posture||'greet')}" data-rig-mood="${esc(mood)}" role="img" aria-label="Pico, your mountain-hare companion"></span>`;
  if(['mina','alex','jo'].includes(name))return `<span class="character character-${esc(name)} ${esc(cls)}" data-character="${esc(name)}" data-cast-articulated data-cast-character="${esc(name)}" data-motion-system="articulated" data-posture="${esc(posture)}" data-rig-posture="${esc(posture)}" data-rig-mood="${esc(mood)}" role="img" aria-label="${esc(name[0].toUpperCase()+name.slice(1))}, your study companion"></span>`;
  if(pose)return `<span class="character character-${esc(name)} ${esc(cls)}" data-character="${esc(name)}" data-posture="${esc(pose.posture||posture)}" data-posture-sprite data-anatomy-source="complete-native-frame" role="img" aria-label="${esc(name[0].toUpperCase()+name.slice(1))}, ${esc(posture)}">${rasterMarkup(pose,'character-art posture-art','')}</span>`;
  const character=manifest.characters?.[name],whole=character?.idle||character?.wave;
  if(!whole)return '';
  return `<span class="character character-${esc(name)} ${esc(cls)}" data-character="${esc(name)}" data-anatomy-source="complete-native-fallback" role="img" aria-label="${esc(name)}">${rasterMarkup(whole,'character-art posture-art','')}</span>`;
}
function choosePosture(name,cls,mood){
  if(cls.includes('welcome-'))return({pico:'greet',mina:'step',alex:'listen',jo:'offer'})[name];
  if(name==='pico'){if(cls.includes('progress-'))return 'stride';if(mood==='celebrate'||cls.includes('result-'))return 'jump';if(cls.includes('hero-'))return 'explore';return 'read';}
  if(name==='mina'){if(cls.includes('lesson-guide-1c'))return 'read';if(cls.includes('lesson-guide'))return mood==='wave'?'read':'step';if(cls.includes('game-'))return 'skip';return 'map';}
  if(name==='alex'){if(cls.includes('lesson-guide'))return 'fix';if(cls.includes('game-'))return 'dance';return 'sit';}
  if(name==='jo'){if(cls.includes('aside-'))return 'read';if(cls.includes('goal-'))return 'clap';return 'pour';}
  return null;
}
function avatarGroups() { return manifest.avatar?.groups || manifest.avatar?.layers || manifest.avatar || {}; }
export function avatarOptions() {
  const groups = avatarGroups();
  if (Array.isArray(groups)) return groups;
  return Object.entries(groups).filter(([,values])=>Array.isArray(values)||values?.options).map(([id, values]) => ({id, label:({skin:'Skin tone',outfit:'Clothes',hair:'Hair',accessory:'A little extra'})[id] || id[0].toUpperCase()+id.slice(1), options:Array.isArray(values)?values:values.options || []}));
}
export function defaultAvatar() {
  return Object.fromEntries(avatarOptions().map(group => [group.id, group.options?.[0]?.id || 'none']));
}
export function avatarMarkup(avatar = {}, cls = '', name = 'Your avatar') {
  const posture=cls.includes('avatar-large')?'wave':cls.includes('avatar-small')?'think':'portrait';
  return `<span class="avatar avatar-bust ${esc(cls)}" data-avatar-rig data-avatar-posture="${posture}" data-avatar="${esc(JSON.stringify(avatar))}" role="img" aria-label="${esc(name)}, bust portrait"></span>`;
}
export function refreshCharacterMotion(container = document) {
  for(const slot of container.querySelectorAll('[data-cast-articulated]')){
    import('./cast-rig.js?v=graphic1').then(module=>{castModule=module;if(slot.isConnected)module.mountCast(slot,{character:slot.dataset.castCharacter,posture:slot.dataset.rigPosture,mood:slot.dataset.rigMood});});
  }
  for(const slot of container.querySelectorAll('[data-pico-articulated]')){
    import('./pico-articulated.js?v=graphic1').then(module=>{picoArticulatedModule=module;if(slot.isConnected)module.mountPico(slot,{posture:slot.dataset.rigPosture,mood:slot.dataset.rigMood});});
  }
  for(const slot of container.querySelectorAll('[data-avatar-rig]')){
    import('./avatar-rig.js?v=graphic1').then(module=>{avatarModule=module;if(slot.isConnected)module.mountAvatar(slot,{avatar:JSON.parse(slot.dataset.avatar||'{}'),manifest,mood:'idle',posture:slot.dataset.avatarPosture||'portrait'});});
  }
}
