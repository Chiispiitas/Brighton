const CACHE='horizons-companion-v3';
const BASE=new URL('./',self.location.href).pathname;
const CORE=['./','./index.html','./styles/app.css','./src/app.js','./src/api-client.js','./src/art.js','./src/pico-rig.js','./src/companion-rig.js','./src/avatar-rig.js','./assets/art/avatar-gestures-v1.frames.json','./content/unit1.mjs','./content/engine.mjs','./content/source-banks.mjs','./assets/fonts/MPLUSRounded1c-Regular.woff2','./assets/fonts/MPLUSRounded1c-ExtraBold.woff2','./assets/fonts/BebasNeue-Regular.woff2'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(CORE)).catch(()=>{}));self.skipWaiting();});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('horizons-companion-')&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',event=>{
 const request=event.request,url=new URL(request.url);
 if(request.method!=='GET'||url.origin!==self.location.origin||!url.pathname.startsWith(BASE))return;
 if(/\.(png|jpe?g|webp|woff2|mp3)$/i.test(url.pathname)){
  event.respondWith(caches.open(CACHE).then(async cache=>{const saved=await cache.match(request);if(saved)return saved;const response=await fetch(request);if(response.ok)cache.put(request,response.clone());return response;}));return;
 }
 event.respondWith(fetch(request).then(async response=>{if(response.ok){const cache=await caches.open(CACHE);cache.put(request,response.clone());}return response;}).catch(()=>caches.match(request)));
});
