import {createRequire} from 'node:module';
import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
const require=createRequire(import.meta.url);
const {chromium}=require('C:/Users/David/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const base=process.env.HZ_APP_URL||'http://127.0.0.1:8898/Horizons/App/';
const out=process.env.HZ_MOTION_OUTPUT||'C:/Users/David/Documents/Codex/2026-11-06/coffee-splash';
const reportFile=process.env.HZ_MOTION_REPORT||new URL('../reports/coffee-frames.json',import.meta.url);
fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
const context=await browser.newContext({viewport:{width:1440,height:1000},serviceWorkers:'block',recordVideo:{dir:'C:/Users/David/Documents/Codex/2026-11-06/coffee-splash/videos'}});
// Entirely synthetic UI fixture: no learner redemption, saves or real API traffic.
const rows=new Map(),store={async get(c,id){return structuredClone(rows.get(c+':'+id)||null)},async create(c,id,v,scope){if(rows.has(c+':'+id))throw Error('exists');rows.set(c+':'+id,{...structuredClone(v),_scope:scope});return v},async put(c,id,v,scope){rows.set(c+':'+id,{...structuredClone(v),_scope:scope});return v},async list(c,scope){return [...rows.entries()].filter(([k,v])=>k.startsWith(c+':')&&v._scope===scope).map(([,v])=>{const x=structuredClone(v);delete x._scope;return x})}};
const {createApplication,COLLECTIONS,idFor}=await import('../backend/src/server/application.mjs');
const {pathNodes}=await import('../content/unit1.mjs');const {getActivityQuestions}=await import('../content/engine.mjs');
const api=createApplication(store),code='QA-ISLAND-FICTIONAL-001';await store.create(COLLECTIONS.codes,await idFor('code:'+code),{bookId:'horizons-a1',kind:'example'},'issued');
async function call(action,data={},token=''){const response=await api.handle(new Request('https://test/api/horizons',{method:'POST',headers:{'Content-Type':'application/json',...token?{'X-Requested-With':token}:{}},body:JSON.stringify({action,...data})}));return {status:response.status,...await response.json()};}
const session=await call('redeem',{code}),apiActions=[],errors=[],checks=[];
await context.route('**/api/horizons',async route=>{const data=route.request().postDataJSON();apiActions.push(data.action);const result=await call(data.action,data,session.token);await route.fulfill({status:result.status,contentType:'application/json',body:JSON.stringify(result)});});
await context.addCookies([{url:base,name:'hz_companion_session',value:session.token}]);



const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));await page.emulateMedia({reducedMotion:'no-preference'});
try{
 await page.goto(base);await page.waitForFunction(()=>document.querySelectorAll('[data-prop-status=ready]').length===8);assert.equal(await page.locator('.world-fauna,.bird-rig,.world-butterfly').count(),0);
  assert.ok(await page.locator('.prop-stage img').evaluateAll(els=>els.flatMap(el=>el.getAnimations()).every(a=>a.effect.getKeyframes().every(f=>!('opacity'in f)))));
 await page.locator('.overworld-map').evaluate(el=>el.scrollLeft=el.scrollWidth);await page.waitForTimeout(150);assert.ok(await page.locator('[data-prop-rig=notebook] .prop-stage img').evaluateAll(els=>els.flatMap(el=>el.getAnimations()).every(a=>a.playState==='paused')));
 await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});document.dispatchEvent(new Event('visibilitychange'));});assert.ok(await page.locator('.prop-stage img').evaluateAll(els=>els.flatMap(el=>el.getAnimations()).every(a=>a.playState==='paused')));await page.evaluate(()=>{delete document.hidden;document.dispatchEvent(new Event('visibilitychange'));});
 await page.emulateMedia({reducedMotion:'reduce'});await page.waitForFunction(()=>document.querySelectorAll('[data-prop-status=ready]>.prop-still:not([hidden])').length===8);assert.equal(await page.locator('[data-prop-status=ready]>.prop-still:not([hidden])').count(),8);assert.equal(await page.locator('.prop-stage:not([hidden])').count(),0);
 await page.evaluate(()=>window.oldPropAnimations=[...document.querySelectorAll('.prop-stage img')].flatMap(el=>el.getAnimations()));await page.evaluate(()=>location.hash='practice');await page.locator('.practice-heading').waitFor();assert.equal(await page.locator('#app .prop-stage').count(),0);assert.ok(await page.evaluate(()=>oldPropAnimations.every(a=>a.playState==='idle')));
 await context.route('**/prop-motion-v1/cups-cup-red.png',r=>r.abort());const fallback=await context.newPage();await fallback.goto(base);await fallback.waitForFunction(()=>document.querySelector('[data-prop-rig=cups]')?.dataset.propStatus==='fallback');assert.equal(await fallback.locator('[data-prop-rig=cups]>.prop-still').isVisible(),true);await fallback.close();await context.unroute('**/prop-motion-v1/cups-cup-red.png');
 await page.emulateMedia({reducedMotion:'no-preference'});
 await page.evaluate(async()=>{const manifest=await(await fetch('./assets/art/prop-motion-v1/rigs.json')).json();const grid=document.createElement('div');grid.id='prop-review';grid.style.cssText='position:fixed;inset:0;z-index:9999;background:#fffefa;display:grid;grid-template-columns:repeat(4,1fr);gap:12px;padding:24px;overflow:auto';for(const[name,spec]of Object.entries(manifest)){const card=document.createElement('div');card.innerHTML='<b>'+name+'</b><span data-prop-rig="'+name+'" style="position:relative;display:block;width:250px;height:250px"><img class="prop-still" src="./'+spec.baseline+'" alt=""></span>';grid.append(card);}document.body.append(grid);const{mountPropMotion}=await import('./src/prop-motion.js?v=coffee2');window.reviewDispose=mountPropMotion(grid);});await page.waitForFunction(()=>document.querySelectorAll('#prop-review [data-prop-status=ready]').length===8);
 assert.equal(await page.locator('#prop-review [data-prop-part=writing],#prop-review [data-prop-part=smear]').count(),0);
 assert.equal(await page.locator('#prop-review [data-prop-part=cover]').evaluate(el=>getComputedStyle(el).backfaceVisibility),'hidden');
 assert.equal(await page.locator('#prop-review [data-prop-part=letter]').evaluate(el=>el.parentElement.className),'prop-slot-mask');
 const poses={};
 for(const [label,offset]of [['rest',null],['emerge',.10],['peak',.112],['extreme',.127],['fall',.143],['inserted',.20]]){
  await page.locator('#prop-review [data-prop-rig]').evaluateAll((slots,offset)=>{for(const slot of slots){const t=offset===null?0:(Number(slot.dataset.propStart)+offset)*Number(slot.dataset.propDuration);for(const a of slot.getAnimations({subtree:true})){a.pause();a.currentTime=t;}}},offset);await page.waitForTimeout(60);assert.ok(await page.locator('#prop-review .prop-stage img').evaluateAll(els=>els.every(el=>getComputedStyle(el).opacity==='1')));await page.screenshot({path:path.join(out,label+'.png')});
  poses[label]={};
  for(const name of ['postbox','notebook','cups']){poses[label][name]=await page.locator('#prop-review [data-prop-rig='+name+']').screenshot({animations:'allow'});if(name==='cups')fs.writeFileSync(path.join(out,'cups-'+label+'.png'),poses[label][name]);}
  if(label==='peak'){
   const cover=page.locator('#prop-review [data-prop-part=cover]');assert.ok(await cover.evaluate(el=>new DOMMatrix(getComputedStyle(el).transform).m33<0),'cover must be turned away while open');await cover.evaluate(el=>el.style.visibility='hidden');
   fs.writeFileSync(path.join(out,'cover-open.png'),poses[label].notebook);fs.writeFileSync(path.join(out,'cover-hidden.png'),await page.locator('#prop-review [data-prop-rig=notebook]').screenshot({animations:'allow'}));await cover.evaluate(el=>el.style.visibility='');
   assert.equal(await page.locator('#prop-review [data-prop-part=coffee-splash]').count(),4);
   assert.equal(await page.locator('#prop-review [data-prop-rig=cups]').getAttribute('data-coffee-frame'),'1');
  }

 }
 assert.ok(!poses.rest.postbox.equals(poses.peak.postbox),'letter must emerge visibly');
 assert.ok(poses.rest.postbox.equals(poses.inserted.postbox),'letter must be fully occluded inside the fixed slot, even before hidden toggles');
 assert.ok(!poses.extreme.cups.equals(poses.fall.cups),'coffee burst must move through distinct visible poses');
 const frameStates=[];
 for(const [expected,offset] of [[0,.10],[1,.112],[2,.127],[3,.143],['none',.16]]){
  const slot=page.locator('#prop-review [data-prop-rig=cups]');await slot.evaluate((slot,offset)=>{for(const a of slot.getAnimations({subtree:true})){a.pause();a.currentTime=(Number(slot.dataset.propStart)+offset)*Number(slot.dataset.propDuration);}},offset);await page.waitForTimeout(50);
  const state=await slot.evaluate(slot=>({current:slot.dataset.coffeeFrame,visible:[...slot.querySelectorAll('[data-prop-frame]')].filter(e=>!e.hidden).map(e=>({frame:e.dataset.propFrame,src:e.currentSrc,opacity:getComputedStyle(e).opacity,animations:e.getAnimations().length}))}));assert.equal(state.current,String(expected));assert.equal(state.visible.length,expected==='none'?0:1);if(expected!=='none'){assert.equal(state.visible[0].opacity,'1');assert.equal(state.visible[0].animations,0);}frameStates.push(state);
 }
 assert.equal(new Set(frameStates.flatMap(s=>s.visible.map(f=>f.src))).size,4);
 // Remove any one sequence frame: the whole cups rig must retain its accepted still.
 await context.route('**/coffee-splash-v2/frame-03-breakup.png',r=>r.abort());const broken=await context.newPage();await broken.goto(base);await broken.waitForFunction(()=>document.querySelector('[data-prop-rig=cups]')?.dataset.propStatus==='fallback');assert.equal(await broken.locator('[data-prop-rig=cups]>.prop-still').isVisible(),true);await broken.close();await context.unroute('**/coffee-splash-v2/frame-03-breakup.png');
 await page.evaluate(()=>{const slot=document.querySelector('#prop-review [data-prop-rig=cups]');window.coffeePlayback=[];window.coffeeWatch=new MutationObserver(()=>{const current=slot.dataset.coffeeFrame;if(coffeePlayback.at(-1)?.frame!==current)coffeePlayback.push({frame:current,time:performance.now()});});coffeeWatch.observe(slot,{attributes:true,attributeFilter:['data-coffee-frame']});});
 await page.bringToFront();
 await page.locator('#prop-review [data-prop-rig]').evaluateAll(slots=>{for(const slot of slots)for(const a of slot.getAnimations({subtree:true})){a.currentTime=0;a.play();}});await page.waitForTimeout(12000);const playback=await page.evaluate(()=>{coffeeWatch.disconnect();return coffeePlayback;});const played=playback.filter(s=>s.frame!=='none').map(s=>s.frame);assert.deepEqual(played.slice(0,4),['0','1','2','3']);
 await page.evaluate(()=>{reviewDispose();document.getElementById('prop-review').remove();location.hash='learn';});
 await page.setViewportSize({width:390,height:844});await page.waitForFunction(()=>document.querySelectorAll('[data-prop-status=ready]').length===8);
 for(const name of ['cups','bag','globe','postbox']){
  await page.locator('[data-prop-rig='+name+']').evaluate(slot=>{const map=document.querySelector('.overworld-map'),s=slot.getBoundingClientRect(),m=map.getBoundingClientRect();map.scrollLeft+=s.left+s.width/2-m.left-m.width/2;});await page.waitForTimeout(150);
  await page.locator('[data-prop-rig='+name+']').evaluate(slot=>{for(const a of slot.getAnimations({subtree:true})){a.pause();a.currentTime=(Number(slot.dataset.propStart)+.12)*Number(slot.dataset.propDuration);}});await page.waitForTimeout(50);
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.screenshot({path:path.join(out,'mobile-'+name+'.png')});
 }
 assert.deepEqual(errors,[]);fs.writeFileSync(reportFile,JSON.stringify({pass:true,eightSeparateRigs:true,wildlifeRemoved:true,opacityAlwaysOne:true,noOpacityKeyframes:true,coverReverseHidden:true,writingRemoved:true,globeSmearRemoved:true,splashFrames:4,frameStates,playback,normalSpeedAllFourFrames:true,oneFrameAtATime:true,noSplashTransformAnimation:true,missingSequenceFrameFallback:true,splashDistinctPoses:true,mobileWidth390:true,fixedMailboxSlot:true,letterEntersAndFullyOccludes:true,reducedMotionOriginalStills:true,offscreenPause:true,hiddenPauseFixture:true,disposalCancels:true,missingPartFallback:true,reconstructionAndExtremeScreenshots:['rest.png','emerge.png','peak.png','extreme.png','fall.png','inserted.png'],scope:'Actual production renderer in Edge with synthetic session; review grid enlarges the same renderer for visual checks. No real learner records.',errors},null,2)+'\n');console.log('PASS four separately generated splash frames, discrete opaque sequence, synchronized poses, all eight rig lifecycles, mobile and missing-frame fallback');
}finally{await browser.close();}
