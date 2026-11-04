import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
const require=createRequire(import.meta.url),{chromium}=require('C:/Users/David/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const app=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const base=new URL(process.env.HZ_APP_URL||'http://127.0.0.1:8896/Horizons/App/');
const reportPath=process.env.HZ_CACHE_REPORT||path.join(app,'reports/anatomy-cache-update.json');
const baseline='bf39988',oldCache='horizons-companion-v3';
const hash=buffer=>crypto.createHash('sha256').update(buffer).digest('hex');
const currentCache='horizons-companion-anatomy-v4';
const currentSourceHashes=Object.fromEntries(['src/app.js','src/art.js','src/avatar-rig.js','service-worker.js'].map(rel=>[rel,hash(fs.readFileSync(path.join(app,rel)))]));
const report={date:new Date().toISOString(),base:base.href,baselineCommit:baseline,scope:'Existing real browser service worker and Cache Storage upgraded from committed legacy runtime to current reviewed release; same isolated QA profile, no XP or profile changes.',status:'RUNNING',steps:[],runtimeErrors:[],limits:['Chromium/Edge only. This checks the actual service-worker lifecycle and Cache Storage, not CDN caches or every browser engine. No session values, raw codes or personal data are written to the report.'],pass:false};
report.currentSourceHashes=currentSourceHashes;
report.workerLifecycle=[];
const oldFiles=new Map();
function oldFile(rel){if(oldFiles.has(rel))return oldFiles.get(rel);let value;try{value=execFileSync('git',['show',`${baseline}:Horizons/App/${rel}`],{cwd:app,stdio:['ignore','pipe','ignore']});}catch{value=null;}oldFiles.set(rel,value);return value;}
const mime=rel=>rel.endsWith('.js')||rel.endsWith('.mjs')?'text/javascript':rel.endsWith('.json')?'application/json':rel.endsWith('.css')?'text/css':rel.endsWith('.html')||!path.extname(rel)?'text/html':'application/octet-stream';
const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
const context=await browser.newContext({viewport:{width:1280,height:950},serviceWorkers:'allow'}),page=await context.newPage();
await context.exposeBinding('__hzCacheLifecycle',(_source,event)=>report.workerLifecycle.push(event));
let legacy=true,oldWorkerIntercepts=0;
const localResources=new Map(),moduleResponses=new Map(),pendingResponseHashes=[];
page.on('pageerror',error=>report.runtimeErrors.push(error.message));
page.on('response',response=>{const u=new URL(response.url());if(!legacy&&u.origin===base.origin&&u.pathname.startsWith(base.pathname)){const rel=u.pathname.slice(base.pathname.length);localResources.set(rel+u.search,response.fromServiceWorker());if(Object.hasOwn(currentSourceHashes,rel))pendingResponseHashes.push(response.body().then(bytes=>moduleResponses.set(rel,{url:rel+u.search,sha256:hash(bytes),fromServiceWorker:response.fromServiceWorker()})));}});
await context.route('**/*',async route=>{
 const u=new URL(route.request().url());
 if(legacy&&u.origin===base.origin&&u.pathname.startsWith(base.pathname)){
  const rel=decodeURIComponent(u.pathname.slice(base.pathname.length))||'index.html';
  if(rel==='service-worker.js')oldWorkerIntercepts++;
  if(/\.(js|mjs|html|css|json)$/.test(rel)||rel==='index.html'){
   const body=oldFile(rel);if(body)return route.fulfill({status:200,contentType:mime(rel),headers:{'Cache-Control':'no-store'},body});
  }
 }
 return route.continue();
});
try{
 report.phase='install-committed-legacy-runtime';
 await page.goto(base.href,{waitUntil:'domcontentloaded'});
 await page.locator('#redeem-form').waitFor({timeout:45000});
 await page.waitForFunction(()=>document.querySelectorAll('[data-pico-rig],.p2-joint,[data-companion-rig],.human-joint').length>0,{timeout:20000});
 await page.evaluate(async()=>{const registration=await navigator.serviceWorker.ready;if(!navigator.serviceWorker.controller)await new Promise(resolve=>navigator.serviceWorker.addEventListener('controllerchange',resolve,{once:true}));return registration.scope;});
 const baselineState=await page.evaluate(async name=>{const keys=await caches.keys(),cache=await caches.open(name),response=await cache.match(new URL('./src/art.js',location.href).href);return{controller:!!navigator.serviceWorker.controller,cacheNames:keys,oldArt:response?await response.text():null,legacyMarkers:document.querySelectorAll('[data-pico-rig],.p2-joint,[data-companion-rig],.human-joint').length};},oldCache);
 const cachedOldArtHash=baselineState.oldArt?hash(Buffer.from(baselineState.oldArt)):null;
 delete baselineState.oldArt;
 assert.ok(oldWorkerIntercepts>0,'Playwright actually served the committed old service-worker script');
 assert.ok(baselineState.cacheNames.includes(oldCache),'Committed old service worker populated its real old Cache Storage');
 assert.equal(cachedOldArtHash,hash(oldFile('src/art.js')),'Old Cache Storage contains committed old art module bytes');
 assert.ok(baselineState.legacyMarkers>0,'Old runtime really renders loose legacy anatomy before upgrade');
 report.steps.push({name:'committed-legacy-worker-installed',...baselineState,oldWorkerIntercepts,cachedOldArtHash,pass:true});
 // Example profile is isolated and never modified or awarded XP by this test.
 await page.locator('#book-code').fill(process.env.HZ_CACHE_QA_CODE||['DEMO','HZ','A1','009'].join('-'));
 await page.locator('#redeem-form [type=submit]').click();
 await page.locator('.app-shell').waitFor({timeout:45000});
 report.steps.push({name:'isolated-profile-authenticated',pass:true});
 report.phase='update-existing-service-worker';
 legacy=false;
 await page.evaluate(async()=>{const registration=await navigator.serviceWorker.getRegistration();window.__cacheUpdateStates=[];registration.addEventListener('updatefound',()=>{const worker=registration.installing;window.__hzUpdateWorker=worker;const record=()=>{window.__cacheUpdateStates.push(worker?.state);void window.__hzCacheLifecycle({event:'new-worker-state',state:worker?.state});};record();worker?.addEventListener('statechange',record);});navigator.serviceWorker.addEventListener('controllerchange',()=>void window.__hzCacheLifecycle({event:'controllerchange'}));await registration.update();});
 await page.waitForFunction(()=>window.__hzUpdateWorker?.state==='activated',null,{timeout:45000});
 const activated=await page.evaluate(async()=>({cacheNames:await caches.keys(),newWorkerState:window.__hzUpdateWorker.state,updateStates:window.__cacheUpdateStates}));
 assert.ok(!activated.cacheNames.includes(oldCache),'Old cache removed when the replacement worker activates');
 assert.ok(activated.cacheNames.includes(currentCache),'Replacement worker populated its actual new cache');
 report.steps.push({name:'current-worker-activated',...activated,pass:true});
 report.phase='reload-current-release';
 await page.reload({waitUntil:'domcontentloaded'});
 await page.locator('.app-shell').waitFor({timeout:45000});
 // A new example profile opens You until its display name is changed. Choose
 // Learn without editing that profile before checking named character frames.
 await page.locator('[data-route=learn]:visible').first().click();
 report.phase='verify-current-character-renderer';
 await page.waitForFunction(()=>document.querySelectorAll('[data-anatomy-source="complete-native-frame"]').length>0);
 const upgraded=await page.evaluate(async()=>({cacheNames:await caches.keys(),controller:!!navigator.serviceWorker.controller,legacyMarkers:document.querySelectorAll('[data-pico-rig],.p2-joint,[data-companion-rig],.human-joint').length,nativeFrameMarkers:document.querySelectorAll('[data-anatomy-source="complete-native-frame"]').length,modules:performance.getEntriesByType('resource').filter(item=>/\/src\/(app|art|avatar-rig)\.js/.test(item.name)).map(item=>({path:new URL(item.name).pathname.split('/App/')[1],version:new URL(item.name).searchParams.get('v')})),authenticated:!!document.querySelector('.app-shell')}));
 assert.equal(upgraded.legacyMarkers,0,'No loose character anatomy remains after release update');
 assert.ok(upgraded.nativeFrameMarkers>0,'Current complete-frame renderer actually active');
 for(const rel of['src/app.js','src/art.js','src/avatar-rig.js'])assert.ok(upgraded.modules.some(module=>module.path===rel&&module.version==='anatomy1'),`${rel} loaded the current cache-busted entry`);
 assert.ok(!upgraded.cacheNames.includes(oldCache),'Old cache removed by activate lifecycle');
 await page.locator('[data-route=profile]:visible').first().click();
 await page.locator('#avatar-preview [data-anatomy="connected-shoulder-elbow-wrist-hand"]').waitFor({timeout:20000});
 const connected=await page.locator('#avatar-preview').evaluate(element=>({ready:!!element.querySelector('[data-ready=true]'),connectedArm:!!element.querySelector('[data-anatomy="connected-shoulder-elbow-wrist-hand"]'),detachedHandPieces:element.querySelectorAll('[data-rig-part=forearm],[data-rig-part=hand]').length,nativeConnectedAsset:[...element.querySelectorAll('img')].some(image=>image.src.includes('avatar-connected-arms-v2.png'))}));
 assert.ok(connected.ready&&connected.connectedArm&&connected.nativeConnectedAsset&&connected.detachedHandPieces===0,'Updated profile uses complete connected native arm rather than legacy forearm/wrist slices');
 await Promise.all(pendingResponseHashes);
 for(const rel of ['src/app.js','src/art.js','src/avatar-rig.js'])assert.equal(moduleResponses.get(rel)?.sha256,currentSourceHashes[rel],`${rel} response bytes match the reviewed current source`);
 const finalWorkerTags=await Promise.all(context.serviceWorkers().map(async worker=>({path:new URL(worker.url()).pathname,cache:await worker.evaluate(()=>typeof CACHE==='undefined'?'unknown':CACHE).catch(()=> 'unavailable')})));
 assert.ok(finalWorkerTags.some(worker=>worker.cache===currentCache),'Actual current worker uses the reviewed new cache tag');
 assert.ok(!finalWorkerTags.some(worker=>worker.cache===oldCache),'Legacy worker is redundant after the real replacement lifecycle');
 report.steps.push({name:'real-worker-release-update',...upgraded,avatar:connected,loadedModuleHashes:[...moduleResponses.values()],workers:finalWorkerTags,loadedLocalResources:[...localResources].map(([name,fromServiceWorker])=>({name,fromServiceWorker})),pass:true});
 report.phase='complete';
 report.pass=report.runtimeErrors.length===0;report.status=report.pass?'PASS':'FAIL';
}catch(error){report.status='FAIL';report.failure=error.message;report.debug=await page.evaluate(async()=>{const r=await navigator.serviceWorker.getRegistration();return{cacheNames:await caches.keys(),updateStates:window.__cacheUpdateStates||[],controller:!!navigator.serviceWorker.controller,active:r?.active?.state,waiting:r?.waiting?.state,installing:r?.installing?.state,legacyMarkers:document.querySelectorAll('[data-pico-rig],.p2-joint,[data-companion-rig],.human-joint').length,nativeMarkers:document.querySelectorAll('[data-anatomy-source="complete-native-frame"]').length,characterSources:[...document.querySelectorAll('[data-character]')].map(node=>({character:node.dataset.character,source:node.dataset.anatomySource||null})),modules:performance.getEntriesByType('resource').filter(item=>/\/src\/(app|art|avatar-rig)\.js/.test(item.name)).map(item=>({path:new URL(item.name).pathname.split('/App/')[1],version:new URL(item.name).searchParams.get('v')})),authenticated:!!document.querySelector('.app-shell')};}).catch(()=>null);report.workers=await Promise.all(context.serviceWorkers().map(async worker=>({path:new URL(worker.url()).pathname,cache:await worker.evaluate(()=>typeof CACHE==='undefined'?'unknown':CACHE).catch(()=> 'unavailable')})));report.limits.push('A failed simulation is not evidence that existing user caches update correctly.');}
finally{await context.close();await browser.close();fs.writeFileSync(reportPath,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({status:report.status,steps:report.steps.map(step=>step.name),failure:report.failure||null}));if(!report.pass)process.exitCode=1;}
