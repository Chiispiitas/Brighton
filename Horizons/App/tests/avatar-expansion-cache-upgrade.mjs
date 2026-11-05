import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
const require=createRequire(import.meta.url),{chromium}=require('C:/Users/David/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const app=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const base=new URL(process.env.HZ_APP_URL||'http://127.0.0.1:8898/Horizons/App/');
const reportPath=process.env.HZ_CACHE_REPORT||path.join(app,'reports/avatar-expansion-cache-upgrade.json');
const baseline='64ea45a',oldCache='horizons-companion-cast-v14',currentCache='horizons-companion-wardrobe-v15';
const hash=buffer=>crypto.createHash('sha256').update(buffer).digest('hex');
const sourceRef=process.env.HZ_CACHE_SOURCE_REF||null;
const resolvedRef=sourceRef?execFileSync('git',['rev-parse',sourceRef],{cwd:app,encoding:'utf8'}).trim():null;
const nativePaths=new Set();function collect(value){if(!value||typeof value!=='object')return;for(const[key,item]of Object.entries(value)){if(key==='src'&&typeof item==='string'&&item.startsWith('assets/'))nativePaths.add(item);else collect(item);}}
collect(JSON.parse(fs.readFileSync(path.join(app,'assets/art/manifest.json'),'utf8')));collect(JSON.parse(fs.readFileSync(path.join(app,'assets/art/avatar-static-v1.frames.json'),'utf8')));
const sourceFiles=[...new Set(['index.html','manifest.webmanifest','styles/app.css','src/app.js','src/art.js','src/avatar-static.js','service-worker.js','assets/art/manifest.json','assets/art/avatar-static-v1.frames.json',...nativePaths])];
const readCurrent=rel=>sourceRef?execFileSync('git',['show',`${resolvedRef}:Horizons/App/${rel}`],{cwd:app,maxBuffer:64*1024*1024}):fs.readFileSync(path.join(app,rel));
const currentHashes=()=>Object.fromEntries(sourceFiles.map(rel=>[rel,hash(readCurrent(rel))]));
const expectedHashes=currentHashes();
const report={date:new Date().toISOString(),base:base.href,baselineCommit:baseline,baselineCache:oldCache,currentCache,scope:'Actual committed previous static runtime and service-worker Cache Storage installed, then replaced through the real update/activate/controller lifecycle by the expanded static wardrobe release. Reserved isolated QA profile011; no activity awards or profile saves.',sourceReference:resolvedRef?{kind:'git-blob',commit:resolvedRef,comparison:'Exact committed LF source bytes and raw binary PNG bytes; working-tree CRLF text is not used for hosted comparison.'}:{kind:'working-tree',comparison:'Exact working-tree source and binary bytes.'},currentSourceHashes:expectedHashes,steps:[],runtimeErrors:[],workerLifecycle:[],limits:['Chromium/Edge only. This verifies a real returning-browser service worker and Cache Storage upgrade, not every browser engine or CDN.','Old runtime requests are served from committed repository blobs during the baseline phase; API requests continue to the actual backend.','No session values, raw codes or personal details are logged.','Static pixel, native-byte and uniform-scale checks establish cache and rendering behavior. They do not replace direct visual review of the final avatar composition.'],pass:false,status:'RUNNING'};
const oldFiles=new Map();function oldFile(rel){if(!oldFiles.has(rel)){let bytes;try{bytes=execFileSync('git',['show',`${baseline}:Horizons/App/${rel}`],{cwd:app,stdio:['ignore','pipe','ignore'],maxBuffer:64*1024*1024});}catch{bytes=null;}oldFiles.set(rel,bytes);}return oldFiles.get(rel);}
const mime=rel=>/\.m?js$/.test(rel)?'text/javascript':rel.endsWith('.json')?'application/json':rel.endsWith('.css')?'text/css':rel.endsWith('.png')?'image/png':rel.endsWith('.html')||!path.extname(rel)?'text/html':'application/octet-stream';
const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
const context=await browser.newContext({viewport:{width:1280,height:950},serviceWorkers:'allow'}),page=await context.newPage();
await context.exposeBinding('__hzCacheLifecycle',(_source,event)=>report.workerLifecycle.push(event));
let legacy=true,oldWorkerIntercepts=0;
const resources=new Map(),loadedHashes=new Map(),pending=[];
page.on('pageerror',error=>report.runtimeErrors.push(error.message));
page.on('response',response=>{const u=new URL(response.url());if(!legacy&&u.origin===base.origin&&u.pathname.startsWith(base.pathname)){const rel=u.pathname.slice(base.pathname.length);resources.set(rel+u.search,response.fromServiceWorker());if(Object.hasOwn(expectedHashes,rel))pending.push(response.body().then(bytes=>loadedHashes.set(rel,{path:rel,url:rel+u.search,sha256:hash(bytes),fromServiceWorker:response.fromServiceWorker()})));}});
await context.route('**/*',async route=>{const u=new URL(route.request().url());if(legacy&&u.origin===base.origin&&u.pathname.startsWith(base.pathname)){const rel=decodeURIComponent(u.pathname.slice(base.pathname.length))||'index.html';if(rel==='service-worker.js')oldWorkerIntercepts++;if(/\.(js|mjs|html|css|json|png)$/.test(rel)||rel==='index.html'){const body=oldFile(rel);if(body)return route.fulfill({status:200,contentType:mime(rel),headers:{'Cache-Control':'no-store'},body});}}return route.continue();});
async function still(selector){
 const actor=page.locator(selector).first(),dir=path.resolve('C:/Users/David/Documents/Codex/2026-11-04/horizons-wardrobe-cache-ready');fs.mkdirSync(dir,{recursive:true});
 await page.evaluate(()=>Promise.all([...document.images].map(im=>im.decode().catch(()=>{}))));await actor.scrollIntoViewIfNeeded();await page.mouse.move(0,0);
 const state=()=>actor.evaluate(el=>{const r=el.getBoundingClientRect();return{fonts:document.fonts.status,rect:{x:r.x,y:r.y,width:r.width,height:r.height},animations:el.getAnimations({subtree:true}).filter(a=>a.playState==='running').length,images:[...el.querySelectorAll('img')].map(im=>{const r=im.getBoundingClientRect();return{x:r.x,y:r.y,width:r.width,height:r.height,left:getComputedStyle(im).left,top:getComputedStyle(im).top};})};});
 const initialState=await state(),initial=await actor.screenshot();
 await page.evaluate(async()=>{await document.fonts.ready;await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));});
 const beforeState=await state(),before=await actor.screenshot();await actor.hover();await page.waitForTimeout(1100);const afterState=await state(),after=await actor.screenshot();
 const name=(selector.match(/character=([a-z]+)/)||[])[1]||'avatar';for(const[label,bytes]of[['initial',initial],['ready',before],['after-hover',after]])fs.writeFileSync(path.join(dir,name+'-'+label+'.png'),bytes);
 const proof={selector,initialState,beforeState,afterState,initialSha256:hash(initial),readySha256:hash(before),afterSha256:hash(after),initialChangedBeforeReadiness:hash(initial)!==hash(before),unchangedAfterReadyAnd1100ms:hash(before)===hash(after)};(report.readinessProofs??=[]).push(proof);
 assert.equal(beforeState.animations,0);assert.equal(afterState.animations,0);assert.equal(hash(before),hash(after),'Static pixels stay fixed after fonts/images/layout are ready, including hover and wait');return proof;
}

try{
 report.phase='install-committed-previous-static-runtime';
 await page.goto(base.href,{waitUntil:'domcontentloaded'});await page.locator('#redeem-form').waitFor({timeout:45000});await page.waitForFunction(()=>document.querySelectorAll('.character').length===4&&[...document.querySelectorAll('.character')].every(el=>el.dataset.anatomySource==='complete-static-render'),null,{timeout:30000});
 await page.evaluate(async()=>{await navigator.serviceWorker.ready;if(!navigator.serviceWorker.controller)await new Promise(resolve=>navigator.serviceWorker.addEventListener('controllerchange',resolve,{once:true}));});
 const oldState=await page.evaluate(async name=>{const cache=await caches.open(name),requests=await cache.keys(),request=requests.find(r=>new URL(r.url).pathname.endsWith('/src/art.js')),response=request?await cache.match(request):null;return{cacheNames:await caches.keys(),controller:!!navigator.serviceWorker.controller,cachedOldArt:response?await response.text():null};},oldCache);
 const oldArtHash=oldState.cachedOldArt?hash(Buffer.from(oldState.cachedOldArt)):null;delete oldState.cachedOldArt;assert.ok(oldWorkerIntercepts>0);assert.ok(oldState.cacheNames.includes(oldCache));assert.equal(oldArtHash,hash(oldFile('src/art.js')));report.steps.push({name:'old-worker-and-exact-old-art-really-installed',...oldState,oldArtHash,pass:true});
 await page.locator('#book-code').fill(['DEMO','HZ','A1','011'].join('-'));await page.locator('#redeem-form [type=submit]').click();await page.locator('.app-shell').waitFor({timeout:45000});
 legacy=false;report.phase='update-existing-worker';
 await page.evaluate(async()=>{const registration=await navigator.serviceWorker.getRegistration();window.__cacheUpdateStates=[];registration.addEventListener('updatefound',()=>{const worker=registration.installing;window.__hzUpdateWorker=worker;const record=()=>{window.__cacheUpdateStates.push(worker?.state);void window.__hzCacheLifecycle({event:'new-worker-state',state:worker?.state});};record();worker?.addEventListener('statechange',record);});navigator.serviceWorker.addEventListener('controllerchange',()=>void window.__hzCacheLifecycle({event:'controllerchange'}));await registration.update();});
 await page.waitForFunction(()=>window.__hzUpdateWorker?.state==='activated',null,{timeout:45000});const cachesAfter=await page.evaluate(()=>caches.keys());assert.ok(!cachesAfter.includes(oldCache)&&cachesAfter.includes(currentCache));report.steps.push({name:'new-static-worker-activated-and-old-cache-removed',cacheNames:cachesAfter,pass:true});
 await page.reload({waitUntil:'domcontentloaded'});await page.locator('.app-shell').waitFor({timeout:45000});await page.locator('[data-route=learn]:visible').first().click();await page.waitForFunction(()=>document.querySelectorAll('.character').length>3&&[...document.querySelectorAll('.character')].every(ch=>ch.dataset.anatomySource==='complete-static-render'));
 const stills=[];for(const name of['pico','mina','alex','jo'])stills.push(await still(`.character[data-character=${name}]`));
 await page.locator('[data-route=profile]:visible').first().click();await page.locator('#avatar-preview [data-ready=true]').waitFor({timeout:20000});
 const choices=await page.evaluate(()=>({hair:document.querySelectorAll('[data-avatar-group=hair]').length,outfit:document.querySelectorAll('[data-avatar-group=outfit]').length,body:document.querySelectorAll('[data-avatar-group=body]').length}));
 assert.deepEqual(choices,{hair:13,outfit:10,body:0});
 for(const[group,value]of[['hair','hair-12'],['outfit','outfit-10']]){await page.locator(`[data-avatar-group=${group}][data-avatar-value=${value}]`).click();await page.locator('#avatar-preview [data-ready=true]').waitFor({timeout:20000});}
 await page.evaluate(()=>Promise.all([...document.querySelectorAll('#avatar-preview img')].map(im=>im.decode())));
 const wardrobe=await page.locator('#avatar-preview [data-avatar-static]').evaluate(el=>({draft:JSON.parse(el.dataset.avatar),parts:[...el.querySelectorAll('[data-static-part]')].map(part=>({part:part.dataset.staticPart,source:new URL(part.querySelector('img').src).pathname.split('/App/')[1]})),uniformRasterScale:[...el.querySelectorAll('img')].every(im=>{const r=im.getBoundingClientRect();return Math.abs(r.width/im.naturalWidth-r.height/im.naturalHeight)<.0001;}),animations:el.getAnimations({subtree:true}).length}));
 assert.equal(wardrobe.draft.hair,'hair-12');assert.equal(wardrobe.draft.outfit,'outfit-10');assert.equal(wardrobe.uniformRasterScale,true);assert.equal(wardrobe.animations,0);
 assert.ok(wardrobe.parts.some(p=>p.part==='hair'&&p.source==='assets/art/avatar-expansion-hair-12.png'));
 assert.ok(wardrobe.parts.some(p=>p.part==='clothes'&&p.source==='assets/art/avatar-expansion-outfit-10.png'));
 report.steps.push({name:'all-expanded-choices-present-and-new-hair-outfit-selected-without-saving',choices,wardrobe,pass:true});
 stills.push(await still('#avatar-preview [data-avatar-static]'));
 const state=await page.evaluate(()=>({runningAnimations:document.getAnimations().filter(a=>a.playState==='running').length,legacySystems:document.querySelectorAll('[data-avatar-rig],[data-pico-articulated],[data-cast-articulated],[data-illustration-motion]').length,modules:performance.getEntriesByType('resource').filter(e=>/\/src\/.*\.js/.test(e.name)).map(e=>({path:new URL(e.name).pathname.split('/App/')[1],version:new URL(e.name).searchParams.get('v')}))}));assert.equal(state.runningAnimations,0);assert.equal(state.legacySystems,0);
 await Promise.all(pending);for(const rel of['src/app.js','src/art.js','src/avatar-static.js','styles/app.css']){assert.equal(loadedHashes.get(rel)?.sha256,expectedHashes[rel],rel+' exact committed source');assert.ok(rel.endsWith('.css')||state.modules.some(m=>m.path===rel&&m.version==='wardrobe1'));}
 const native=[...loadedHashes.values()].filter(v=>v.path.startsWith('assets/art/')&&v.path.endsWith('.png'));assert.ok(native.length>=5);for(const asset of native)assert.equal(asset.sha256,expectedHashes[asset.path],asset.path+' exact native bitmap');
 for(const rel of['assets/art/avatar-expansion-hair-12.png','assets/art/avatar-expansion-outfit-10.png']){assert.equal(loadedHashes.get(rel)?.sha256,expectedHashes[rel],rel+' exact new native bitmap after upgrade');}
 report.steps.push({name:'current-static-source-and-art-loaded-after-real-update',...state,stills,loadedNativePNGs:native,pass:true});
 const after=currentHashes();report.changedSources=Object.keys(after).filter(file=>after[file]!==expectedHashes[file]);assert.deepEqual(report.changedSources,[]);assert.deepEqual(report.runtimeErrors,[]);report.pass=true;report.status='PASS';report.phase='complete';
}catch(error){report.status='FAIL';report.failure=error.stack;}
finally{await Promise.allSettled(pending);await context.close();await browser.close();fs.mkdirSync(path.dirname(reportPath),{recursive:true});fs.writeFileSync(reportPath,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({status:report.status,steps:report.steps.map(s=>s.name),failure:report.failure||null}));if(!report.pass)process.exitCode=1;}
