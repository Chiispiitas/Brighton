import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),{chromium}=require('C:/Users/David/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const base='http://127.0.0.1:8898/Horizons/App/',out='C:/Users/David/Documents/Codex/2026-11-06/login-cast';fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true}),context=await browser.newContext({viewport:{width:1440,height:900},serviceWorkers:'block'}),page=await context.newPage(),errors=[],checks=[];
page.on('pageerror',e=>errors.push(e.message));let apiCalls=0;await context.route('**/api/horizons',route=>{apiCalls++;return route.abort()});
const ready=()=>page.waitForFunction(()=>['pico','mina','alex','jo'].every(n=>{const s=document.querySelector('.welcome-'+n);return s?.dataset[n==='pico'?'bannerMotion':n+'Motion']==='ready'}));
const setTime=time=>page.locator('.welcome-companions').evaluate((root,t)=>{for(const a of root.getAnimations({subtree:true})){a.pause();a.currentTime=t;}},time);
try{
 await page.goto(base);await ready();assert.equal(await page.locator('.welcome-pico').getAttribute('data-posture'),'explore');
 for(const [width,height]of [[1440,900],[1024,600],[390,740],[320,640]]){
 await page.setViewportSize({width,height});await page.waitForTimeout(60);await setTime(0);await page.waitForTimeout(40);
 for(const n of ['pico','mina','alex','jo']){
 const data=await page.locator('.welcome-'+n).evaluate(el=>{const r=el.getBoundingClientRect();return{width:r.width,height:r.height,left:r.left,right:r.right,animations:el.getAnimations({subtree:true}).length,opacities:[...el.querySelectorAll('img')].map(i=>getComputedStyle(i).opacity)}});
 assert.ok(data.animations>0,n);assert.ok(data.width>0&&data.height>0&&data.left>=0&&data.right<=width+1,JSON.stringify({n,...data}));assert.ok(data.opacities.every(o=>o==='1'));checks.push({width,height,character:n,...data});
 }
 await page.screenshot({path:path.join(out,'neutral-'+width+'.png')});await setTime(9500);await page.waitForTimeout(60);await page.screenshot({path:path.join(out,'accent-'+width+'.png')});
 assert.ok(await page.locator('#book-code').isEnabled());assert.ok(await page.locator('#redeem-form button').isEnabled());if(width>760)assert.ok(await page.locator('#redeem-form').evaluate(el=>el.getBoundingClientRect().bottom<=innerHeight));
 }
 await page.setViewportSize({width:1440,height:900});await page.emulateMedia({reducedMotion:'reduce'});await page.waitForTimeout(120);
 for(const n of ['pico','mina','alex','jo'])assert.ok(await page.locator('.welcome-'+n+'>.character-art').isVisible(),n+' reduced still');
 await page.screenshot({path:path.join(out,'reduced.png')});await page.emulateMedia({reducedMotion:'no-preference'});await ready();
 await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});document.dispatchEvent(new Event('visibilitychange'))});
 assert.ok(await page.locator('.welcome-companions').evaluate(root=>root.getAnimations({subtree:true}).every(a=>a.playState==='paused')));
 await page.evaluate(()=>{delete document.hidden;document.dispatchEvent(new Event('visibilitychange'))});
 await page.evaluate(async()=>{const m=await import('./src/art.js?v=login1');m.disposeArtwork(document.querySelector('.welcome-companions'))});assert.equal(await page.locator('.pico-banner-stage,.mina-motion-stage,.alex-motion-stage,.jo-motion-stage').count(),0);
 assert.deepEqual(errors,[]);assert.equal(apiCalls,0);
 const failed=await browser.newContext({serviceWorkers:'block'});await failed.route('**/pico-banner-motion-v1/body-registered.png',r=>r.abort());const broken=await failed.newPage();await broken.goto(base);await broken.waitForFunction(()=>document.querySelector('.welcome-pico')?.dataset.bannerMotion==='fallback');assert.ok(await broken.locator('.welcome-pico>.character-art').isVisible());await failed.close();
 fs.writeFileSync(new URL('../reports/login-cast.json',import.meta.url),JSON.stringify({pass:true,checks,allFourAnimated:true,loginControlsUsable:true,fullOpacity:true,reducedMotionOriginalStills:true,hiddenPause:true,dispose:true,missingPicoPartFallback:true,apiCalls,errors},null,2)+'\n');console.log('PASS login cast animation, responsive placement, original stills, pause/disposal and failure fallback; no learner/API access');
}finally{await browser.close();}
