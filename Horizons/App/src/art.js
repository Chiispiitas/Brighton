let manifest = {characters: {}, avatar: {}};
let picoModule;
const avatarObservers=new Set();
const sourceBase = new URL('../assets/art/', import.meta.url);
export async function loadArt() {
  try { const response = await fetch(new URL('manifest.json', sourceBase)); if (response.ok) { manifest = await response.json(); manifest.characters = manifest.characters || manifest.companions || {}; } }
  catch { /* The app remains usable while artwork is loading or unavailable offline. */ }
  return manifest;
}
export function artManifest() { return manifest; }
export function sceneMarkup(name,cls=''){return rasterMarkup(manifest.scenes?.[name],cls,'');}
export function wordArt(word){return word?.image || manifest.vocabulary?.[word?.term] || manifest.vocabulary?.[word?.id];}
export function disposeCharacters(container=document){for(const slot of container.querySelectorAll('[data-pico-rig]'))picoModule?.unmountPico?.(slot);for(const observer of avatarObservers)observer.disconnect();avatarObservers.clear();}
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
  const source = asset.src || asset.file || asset.image;
  if (!source) return '';
  const frame = asset.frame || asset.bounds || asset.crop;
  const atlas = asset.atlas;
  if (frame && atlas?.width && atlas?.height) {
    const imageStyle = `width:${atlas.width/frame.w*100}%;height:${atlas.height/frame.h*100}%;left:${-frame.x/frame.w*100}%;top:${-frame.y/frame.h*100}%;`;
    return `<span class="raster-frame ${esc(cls)}" style="aspect-ratio:${frame.w}/${frame.h}" role="img" aria-label="${esc(alt)}"><img src="${esc(assetURL(source))}" alt="" draggable="false" style="${imageStyle}"></span>`;
  }
  return `<img class="${esc(cls)}" src="${esc(assetURL(source))}" alt="${esc(alt)}" draggable="false" ${asset.loading === 'eager' ? '' : 'loading="lazy"'}>`;
}
export function characterMarkup(name, cls = '', mood = 'idle') {
  if (name==='pico' && manifest.pico?.parts) return `<span class="character character-pico ${esc(cls)}" data-character="pico" data-pico-rig data-mood="${esc(mood)}" role="img" aria-label="Pico, your mountain-hare companion"></span>`;
  const character = manifest.characters?.[name] || manifest[name];
  if (!character) return '';
  const art = character[mood] || character.idle || character.base || character.asset || character;
  return `<span class="character character-${esc(name)} ${esc(cls)}" data-character="${esc(name)}" data-mood="${esc(mood)}">${rasterMarkup(art, 'character-art', name === 'pico' ? 'Pico, your mountain-hare companion' : name[0].toUpperCase()+name.slice(1))}${character.face ? rasterMarkup(character.face, 'character-face', '') : ''}</span>`;
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
  const groups = avatarOptions();
  let layers = [];
  for (const group of groups) {
    const options = group.options || [];
    const choice = options.find(option => option.id === avatar[group.id]) || options[0];
    if (!choice || choice.id === 'none') continue;
    const position = {...(choice.position || group.position || {})};
    if(choice.id==='accessory-2')position.y=-.06;
    if(choice.id==='accessory-3')position.y=.015;
    if(choice.id==='accessory-5')position.y=.32;
    const style = position ? `left:${position.x*100}%;top:${position.y*100}%;width:${position.w*100}%;height:${position.h*100}%;z-index:${position.z || 0}` : 'inset:0';
    const frame=choice.frame || choice.asset?.frame;
    layers.push(`<span class="avatar-layer" data-art-group="${esc(group.id)}" data-art-placement="${esc(JSON.stringify(position))}" data-art-ratio="${frame?frame.w/frame.h:1}" style="${style}">${rasterMarkup(choice.asset || choice,'','')}</span>`);
  }
  if (!layers.length) return `<span class="avatar avatar-initial ${esc(cls)}" aria-label="${esc(name)}">${esc(name.trim().slice(0,1).toUpperCase() || 'H')}</span>`;
  return `<span class="avatar ${esc(cls)}" role="img" aria-label="${esc(name)}">${layers.join('')}</span>`;
}
export function refreshCharacterMotion(container = document) {
  for(const avatar of container.querySelectorAll('.avatar:not(.avatar-initial)')){
    const fit=()=>{const rect=avatar.getBoundingClientRect();if(!rect.width||!rect.height)return;for(const layer of avatar.querySelectorAll('.avatar-layer')){const p=JSON.parse(layer.dataset.artPlacement),ratio=Number(layer.dataset.artRatio)||1,group=layer.dataset.artGroup;let width,height,left,top=p.y*rect.height;if(group==='skin'||group==='outfit'){height=p.h*rect.height;width=height*ratio;left=(rect.width-width)/2;}else{width=p.w*rect.width;height=width/ratio;left=p.x*rect.width;}Object.assign(layer.style,{left:left+'px',top:top+'px',width:width+'px',height:height+'px'});}};
    const observer=new ResizeObserver(fit);observer.observe(avatar);avatarObservers.add(observer);fit();
  }
  for (const slot of container.querySelectorAll('[data-pico-rig]')) {
    import('./pico-rig.js').then(module=>{picoModule=module;if(slot.isConnected)module.mountPico(slot,{mood:slot.dataset.mood || 'idle',manifest});}).catch(()=>{});
  }
  for (const character of container.querySelectorAll('.character')) {
    character.addEventListener('pointerenter', () => { character.classList.add('character-greet'); setTimeout(() => character.classList.remove('character-greet'), 1200); });
  }
}
