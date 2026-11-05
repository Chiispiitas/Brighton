import {createRequire} from 'node:module';
import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {execFileSync} from 'node:child_process';
const require=createRequire(import.meta.url),{chromium}=require('C:/Users/David/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const base=process.env.HZ_APP_URL||'http://127.0.0.1:8898/Horizons/App/',out=process.env.HZ_PICO_OUTPUT||'C:/Users/David/Documents/Codex/2026-11-05/pico-banner-animation';fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
const context=await browser.newContext({viewport:{width:1440,height:1000},serviceWorkers:'block',recordVideo:{dir:path.join(out,'video'),size:{width:1440,height:1000}}});
await context.addCookies([{url:base,name:'hz_companion_session',value:'fictional-banner-animation-fixture'}]);
const fixture={profile:{displayName:'Animation Explorer',avatar:{body:'female',skin:'skin-3',hair:'hair-9',outfit:'outfit-3'}},books:[{id:'horizons-a1',level:'A1',status:'active',expiresAt:'2030-01-01T00:00:00Z'}],progress:{xp:0,streak:0}};
await context.route('**/api/horizons',route=>route.fulfill({contentType:'application/json',body:JSON.stringify(fixture)}));
const page=await context.newPage(),errors=[],checks=[];page.on('pageerror',error=>errors.push(error.message));
const selector='.hero-pico[data-banner-motion=ready]';
const sample=async time=>page.evaluate(time=>{const slot=document.querySelector('.hero-pico');for(const a of slot.getAnimations({subtree:true})){a.pause();a.currentTime=time;}},time);
try{
 await page.goto(base);await page.locator(selector).waitFor();await page.waitForTimeout(700);
 assert.equal(await page.locator('.pico-banner-stage').count(),1);
 assert.equal(await page.locator('.hero-pico').evaluate(el=>el.getAnimations({subtree:true}).length),3);
 assert.equal(await page.evaluate(()=>[...document.querySelectorAll('.character:not(.hero-pico),.avatar')].flatMap(el=>el.getAnimations({subtree:true})).length),0);
 // Capture actual responsive banner, then the same renderer enlarged for seam review.
 for(const width of [320,390,768,1440]){
  await page.setViewportSize({width,height:width<768?844:1000});await page.waitForTimeout(120);await sample(0);
  const rect=await page.locator('.hero-pico').boundingBox(),hero=await page.locator('.learn-hero').boundingBox();
  assert.ok(rect.x>=hero.x&&rect.x+rect.width<=hero.x+hero.width+1);assert.ok(rect.y>=hero.y&&rect.y+rect.height<=hero.y+hero.height+1);
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  await page.locator('.learn-hero').screenshot({path:path.join(out,'banner-'+width+'.png')});checks.push({width,fit:true,staticOtherCharacters:true});
 }
 await page.evaluate(()=>{const slot=document.querySelector('.hero-pico');slot.style.width='248px';slot.style.height='582px';slot.style.right='80px';document.querySelector('.learn-hero').style.minHeight='650px';});await page.waitForTimeout(150);
 for(const time of [0,1200,1920,2350,2400,2480,4000,5920,6080,8000]){
  await sample(time);if(time===1920||time===5920){const angle=await page.locator('.pico-banner-head').evaluate(el=>{const m=new DOMMatrix(getComputedStyle(el).transform);return Math.atan2(m.b,m.a)*180/Math.PI;});assert.ok(Math.abs(angle-(time===1920?1.4:-.6))<.01,'actual head extremum');}assert.equal(await page.locator('.pico-banner-body').evaluate(el=>getComputedStyle(el).transform),'none');
  await page.locator('.hero-pico').screenshot({path:path.join(out,'frame-'+time+'.png')});
 }
 await sample(0);await page.locator('.hero-pico').evaluate(el=>el.getAnimations({subtree:true}).forEach(a=>a.play()));await page.waitForTimeout(8200);
 await page.evaluate(()=>scrollTo(0,1000));await page.waitForTimeout(200);assert.equal(await page.locator('.hero-pico').getAttribute('data-motion-paused'),'true');
 assert.ok(await page.locator('.hero-pico').evaluate(el=>el.getAnimations({subtree:true}).every(a=>a.playState==='paused')));
 await page.evaluate(()=>scrollTo(0,0));await page.waitForTimeout(250);assert.ok(await page.locator('.hero-pico').evaluate(el=>el.getAnimations({subtree:true}).every(a=>a.playState==='running')));
 await page.emulateMedia({reducedMotion:'reduce'});await page.waitForFunction(()=>document.querySelector('.hero-pico')?.dataset.bannerMotion==='reduced');
 assert.equal(await page.locator('.hero-pico').evaluate(el=>el.getAnimations({subtree:true}).length),0);assert.equal(await page.locator('.hero-pico>.character-art').isVisible(),true);
 await page.locator('.learn-hero').screenshot({path:path.join(out,'reduced-native-fallback.png')});
 await page.emulateMedia({reducedMotion:'no-preference'});await page.locator(selector).waitFor();
 // A controlled visibility-event fixture verifies the document-hidden handler;
 // real IntersectionObserver pause/resume above is tested without mocking.
 await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});document.dispatchEvent(new Event('visibilitychange'));});
 assert.ok(await page.locator('.hero-pico').evaluate(el=>el.getAnimations({subtree:true}).every(a=>a.playState==='paused')));
 await page.evaluate(()=>{delete document.hidden;document.dispatchEvent(new Event('visibilitychange'));});
 await page.locator('[data-route=practice]:visible').first().click();await page.waitForTimeout(700);assert.equal(await page.locator('.pico-banner-stage').count(),0);assert.equal(await page.evaluate(()=>document.getAnimations().filter(a=>a.playState==='running').length),0);
 for(let i=0;i<3;i++){await page.locator('[data-route=learn]:visible').first().click();await page.locator(selector).waitFor();assert.equal(await page.locator('.pico-banner-stage').count(),1);await page.locator('[data-route=practice]:visible').first().click();}
 // Use fresh browser contexts so previously decoded image/module caches cannot
 // turn a simulated load failure into an unintended cache-hit success.
 for(const pattern of ['**/head-registered.png','**/pico-banner-motion.js*']){
  const isolated=await browser.newContext({serviceWorkers:'block'});await isolated.addCookies([{url:base,name:'hz_companion_session',value:'fictional-banner-animation-fixture'}]);
  await isolated.route('**/api/horizons',r=>r.fulfill({contentType:'application/json',body:JSON.stringify(fixture)}));let aborted=false;
  await isolated.route(pattern,r=>{aborted=true;return r.abort();});const failedPage=await isolated.newPage();failedPage.on('pageerror',error=>errors.push(error.message));
  await failedPage.goto(base);await failedPage.locator('.hero-pico[data-banner-motion=fallback]').waitFor();assert.equal(aborted,true);
  assert.equal(await failedPage.locator('.hero-pico>.character-art').isVisible(),true);assert.equal(await failedPage.locator('.hero-pico').evaluate(el=>el.getAnimations({subtree:true}).length),0);await isolated.close();
 }
 assert.deepEqual(errors,[]);
 fs.writeFileSync(process.env.HZ_PICO_REPORT||new URL('../reports/pico-banner-motion-proof.json',import.meta.url),JSON.stringify({date:new Date().toISOString(),revision:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),base,checks,headMapAndBlink:true,fixedBody:true,extremaCaptured:true,reducedNativeFallback:true,loadFailureFallback:true,offscreenPauseResume:true,hiddenDocumentEventFixture:true,rerenderDisposal:true,errors,pass:true,learnerWrites:false,limits:['Edge/Chromium only; frame review is recorded separately. Hidden-document event uses a controlled visibility fixture.']},null,2)+'\n');
 console.log('PASS responsive banner rig, synchronized parts, offscreen/reduced motion and disposal');
}catch(error){console.error(error);await page.screenshot({path:path.join(out,'failure.png')});process.exitCode=1;}finally{await context.close();await browser.close();}
