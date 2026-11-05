import fs from 'node:fs';import assert from 'node:assert/strict';import{createRequire}from'node:module';
const require=createRequire(import.meta.url),{chromium}=require('C:/Users/David/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const base=process.env.HZ_APP_URL||'http://127.0.0.1:8898/Horizons/App/';
const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
const context=await browser.newContext(),page=await context.newPage();
await page.route('**/cache-proof',r=>r.fulfill({contentType:'text/html',body:'<!doctype html><title>Cache fixture</title>'}));
await page.goto(new URL('cache-proof',base).href);
const result=await page.evaluate(async()=>{
 const old='horizons-companion-path-details-v47';
 await(await caches.open(old)).put('./old-fixture',new Response('synthetic previous cache'));
 await navigator.serviceWorker.register('./service-worker.js');await navigator.serviceWorker.ready;
 await new Promise(resolve=>{if(navigator.serviceWorker.controller)return resolve();navigator.serviceWorker.addEventListener('controllerchange',resolve,{once:true});});
 const keys=await caches.keys(),current='horizons-companion-avatar-editor-v49',cache=await caches.open(current),urls=(await cache.keys()).map(r=>r.url);
 return{keys,current,oldDeleted:!keys.includes(old),newAnchorsCached:urls.some(u=>u.endsWith('/avatar-face-v2/rest-anchors.frames.json')),newBlankCached:urls.some(u=>u.endsWith('/avatar-face-v2/blank-heads.png')),allEyesCached:['eye-left','eye-right','pupil','lid-left','lid-right'].every(n=>urls.some(u=>u.endsWith('/avatar-face-v2/'+n+'.png'))),retiredClosedHeadCached:urls.some(u=>u.includes('avatar-motion-v1/closed-heads.png'))};
});
await browser.close();assert.ok(result.oldDeleted&&result.newAnchorsCached&&result.newBlankCached&&result.allEyesCached&&!result.retiredClosedHeadCached);
fs.writeFileSync(process.env.HZ_AVATAR_CACHE_REPORT||new URL('../reports/avatar-cache-proof.json',import.meta.url),JSON.stringify({base,pass:true,method:'Expired cache seed followed by actual current worker installation; no previous-worker upgrade simulation claimed',...result},null,2)+'\n');
console.log('PASS current worker installation, new face assets cached and expired cache removed');
