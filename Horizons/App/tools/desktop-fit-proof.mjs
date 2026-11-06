import {createRequire} from 'node:module';
import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
const require=createRequire(import.meta.url);
const {chromium}=require('C:/Users/David/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const base=process.env.HZ_APP_URL||'http://127.0.0.1:8898/Horizons/App/';
const out=process.env.HZ_MOTION_OUTPUT||'C:/Users/David/Documents/Codex/2026-11-06/desktop-fit';
const reportFile=process.env.HZ_MOTION_REPORT||new URL('../reports/desktop-fit.json',import.meta.url);
fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
const context=await browser.newContext({viewport:{width:1440,height:1000},serviceWorkers:'block'});
// Entirely synthetic UI fixture: no learner redemption, saves or real API traffic.
const rows=new Map(),store={async get(c,id){return structuredClone(rows.get(c+':'+id)||null)},async create(c,id,v,scope){if(rows.has(c+':'+id))throw Error('exists');rows.set(c+':'+id,{...structuredClone(v),_scope:scope});return v},async put(c,id,v,scope){rows.set(c+':'+id,{...structuredClone(v),_scope:scope});return v},async list(c,scope){return [...rows.entries()].filter(([k,v])=>k.startsWith(c+':')&&v._scope===scope).map(([,v])=>{const x=structuredClone(v);delete x._scope;return x})}};
const {createApplication,COLLECTIONS,idFor}=await import('../backend/src/server/application.mjs');
const {pathNodes}=await import('../content/unit1.mjs');const {getActivityQuestions}=await import('../content/engine.mjs');
const api=createApplication(store),code='QA-ISLAND-FICTIONAL-001';await store.create(COLLECTIONS.codes,await idFor('code:'+code),{bookId:'horizons-a1',kind:'example'},'issued');
async function call(action,data={},token=''){const response=await api.handle(new Request('https://test/api/horizons',{method:'POST',headers:{'Content-Type':'application/json',...token?{'X-Requested-With':token}:{}},body:JSON.stringify({action,...data})}));return {status:response.status,...await response.json()};}
const session=await call('redeem',{code}),apiActions=[],errors=[],checks=[];
await context.route('**/api/horizons',async route=>{const data=route.request().postDataJSON();apiActions.push(data.action);const result=await call(data.action,data,session.token);await route.fulfill({status:result.status,contentType:'application/json',body:JSON.stringify(result)});});
await context.addCookies([{url:base,name:'hz_companion_session',value:session.token}]);



const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));await page.emulateMedia({reducedMotion:'reduce'});
try{
 await page.goto(base);await page.locator('.learning-path').waitFor();await page.evaluate(()=>document.fonts.ready);
 for(const [width,height] of [[1920,1080],[2048,1078],[1440,900],[1366,768],[1280,720],[1280,640],[1024,600],[1024,540],[800,540]]){
  await page.setViewportSize({width,height});await page.waitForTimeout(120);
  const fit=await page.evaluate(()=>{const rect=s=>{const r=document.querySelector(s).getBoundingClientRect();return {top:r.top,bottom:r.bottom,left:r.left,right:r.right,height:r.height}};return {width:innerWidth,height:innerHeight,pageHeight:document.documentElement.scrollHeight,pageWidth:document.documentElement.scrollWidth,hero:rect('.learn-hero'),map:rect('.overworld-map'),profile:rect('.sidebar-person')};});
  assert.ok(fit.pageHeight<=height+1,JSON.stringify(fit));assert.ok(fit.pageWidth<=width+1,JSON.stringify(fit));assert.equal(await page.locator('.hero-continue').count(),0);assert.ok(fit.map.bottom<=height,JSON.stringify(fit));assert.ok(fit.profile.bottom<=height,JSON.stringify(fit));
  for(const lesson of ['1','2','3','4']){
   await page.locator('.path-lesson.lesson-'+lesson).evaluate(el=>{const map=document.querySelector('.overworld-map'),r=el.getBoundingClientRect(),v=map.getBoundingClientRect();map.scrollLeft+=r.left-v.left;});await page.waitForTimeout(30);
   const bounds=await page.locator('.path-lesson.lesson-'+lesson+' .stop-orb,.path-lesson.lesson-'+lesson+' .landmark-art,.path-lesson.lesson-'+lesson+' .area-prop,.path-lesson.lesson-'+lesson+' .lesson-landmark').evaluateAll(els=>els.map(el=>{const r=el.getBoundingClientRect();return {part:el.className,top:r.top,bottom:r.bottom}}));
   for(const b of bounds)assert.ok(b.top>=fit.map.top-1&&b.bottom<=fit.map.bottom+1,JSON.stringify({width,height,lesson,...b,map:fit.map}));
  }
  await page.locator('.overworld-map').evaluate(el=>el.scrollLeft=0);await page.waitForTimeout(30);await page.screenshot({path:path.join(out,`desktop-${width}x${height}.png`)});checks.push(fit);
 }
 await page.setViewportSize({width:1024,height:540});await page.locator('.path-stop:not(:disabled)').first().click();await page.locator('#path-bubble:popover-open').waitFor();assert.ok(await page.locator('#path-bubble').evaluate(el=>{const r=el.getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight}));await page.screenshot({path:path.join(out,'desktop-details-1024x540.png')});await page.locator('#path-bubble [data-dialog-close]').click();
 for(const width of [320,390,760]){
  await page.setViewportSize({width,height:640});await page.waitForTimeout(100);assert.ok(await page.evaluate(()=>document.documentElement.scrollHeight<=innerHeight+1));const map=await page.locator('.overworld-map').boundingBox();assert.ok(Math.abs(map.x)<1&&Math.abs(map.width-width)<1);await page.screenshot({path:path.join(out,`mobile-${width}.png`)});
 }
 await page.setViewportSize({width:1280,height:640});await page.evaluate(()=>location.hash='practice');await page.locator('.practice-heading').waitFor();assert.equal(await page.locator('.main-content').evaluate(el=>getComputedStyle(el).display),'flex');
 assert.deepEqual(errors,[]);fs.writeFileSync(reportFile,JSON.stringify({pass:true,checks,allFourLessonAreasClearVerticalEdges:true,bannerContinueRemoved:true,profileFits:true,desktopDetailsFits:true,mobileUnchanged:true,practiceViewportHeight:true,scope:'Actual production renderer in Edge with isolated synthetic server store; no real learner records. Desktop viewport heights 540-1080, widths 800-2048. Mobile regression 320/390/760 at 640 height. Physical screens and browser UI zoom not directly tested.',errors},null,2)+'\n');console.log('PASS desktop Learn fits nine viewport sizes, all four lesson areas and details; mobile and Practice preserved');
}finally{await browser.close();}
