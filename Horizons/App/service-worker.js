const CACHE='horizons-companion-pico-v24';
const BASE=new URL('./',self.location.href).pathname;
const CORE=['./src/pico-banner-motion.js?v=pico1','./assets/art/pico-banner-motion-v1/head-registered.png','./assets/art/pico-banner-motion-v1/body-registered.png','./assets/art/pico-banner-motion-v1/map-registered.png','./assets/art/pico-banner-motion-v1/blink-registered.png','./content/island-mastery.mjs','./src/studio-ui.js?v=pico1','./src/ui-motion.js?v=pico1','./assets/art/avatar-change-sparkles-v1.png','./','./index.html','./styles/app.css?v=pico1','./src/app.js?v=pico1','./src/api-client.js','./src/lesson-art.js?v=colors1','./src/art.js?v=pico1','./src/avatar-static.js?v=colors1','./assets/art/avatar-static-v1.frames.json?colors=1','./assets/art/manifest.json?colors=1','./content/translations.mjs','./content/answer-matching.mjs','./content/unit1.mjs','./content/engine.mjs','./content/source-banks.mjs','./assets/fonts/MPLUSRounded1c-Regular.woff2','./assets/fonts/MPLUSRounded1c-ExtraBold.woff2','./assets/fonts/BebasNeue-Regular.woff2'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(CORE)).catch(()=>{}));self.skipWaiting();});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('horizons-companion-')&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',event=>{
 const request=event.request,url=new URL(request.url);
 if(request.method!=='GET'||url.origin!==self.location.origin||!url.pathname.startsWith(BASE))return;
 if(/\.(png|jpe?g|webp|woff2|mp3)$/i.test(url.pathname)){
  event.respondWith(caches.open(CACHE).then(async cache=>{const saved=await cache.match(request);if(saved)return saved;const response=await fetch(request);if(response.ok)cache.put(request,response.clone());return response;}));return;
 }
 event.respondWith(fetch(request,{cache:'no-cache'}).then(async response=>{if(response.ok){const cache=await caches.open(CACHE);cache.put(request,response.clone());}return response;}).catch(()=>caches.match(request)));
});
