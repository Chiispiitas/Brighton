import {createRequire} from 'node:module';
import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
const require=createRequire(import.meta.url);
const {chromium}=require('C:/Users/David/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const base=process.env.HZ_APP_URL||'http://127.0.0.1:8898/Horizons/App/';
const out=process.env.HZ_MOTION_OUTPUT||'C:/Users/David/Documents/Codex/2026-11-05/path-progress';
const reportFile=process.env.HZ_MOTION_REPORT||new URL('../reports/path-progress.json',import.meta.url);
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


const page=await context.newPage();page.on('pageerror',error=>errors.push(error.message));await page.emulateMedia({reducedMotion:'reduce'});
const map=()=>page.locator('.overworld-map'),nodeButton=id=>page.locator('.learning-path [data-path-node="'+id+'"]');
try{
 await page.goto(base);await page.locator('.app-shell').waitFor();await page.evaluate(()=>document.fonts.ready);
 assert.equal(await page.locator('.path-stop').count(),21);assert.equal(await page.locator('.path-stop:disabled').count(),17);assert.equal(await page.locator('.current-path[aria-current=step]').count(),1);assert.equal(await page.locator('.path-player').count(),0);
 const first=pathNodes[0],locked=pathNodes.filter(n=>n.lessonId===first.lessonId)[1];
 assert.equal(await nodeButton(first.id).locator('.stop-orb').evaluate(el=>getComputedStyle(el).backgroundColor),'rgb(238, 235, 229)');assert.equal(await nodeButton(first.id).locator('.generated-icon').first().evaluate(el=>getComputedStyle(el).filter),'grayscale(1)');
 await nodeButton(locked.id).dispatchEvent('click');assert.equal(await page.locator('#path-bubble:popover-open').count(),0);
 await page.evaluate(id=>{const b=document.createElement('button');b.dataset.startActivity=id;document.getElementById('app').append(b);b.click();b.remove();},locked.id);assert.equal((await page.evaluate(()=>HorizonsApp.getState())).activity,null);
 const a=await page.locator('.lesson-1 .area-prop-0').boundingBox(),b=await page.locator('.lesson-1 .area-prop-1').boundingBox();assert.ok(Math.abs(a.x+a.width/2-b.x-b.width/2)>75,'props are horizontally asymmetric');
 const props=await page.locator('.lesson-1 .area-prop').evaluateAll(els=>els.map(el=>el.getBoundingClientRect().toJSON())),orbs=await page.locator('.lesson-1 .stop-orb').evaluateAll(els=>els.map(el=>el.getBoundingClientRect().toJSON()));for(const prop of props)for(const orb of orbs)assert.ok(!(prop.left<orb.right&&prop.right>orb.left&&prop.top<orb.bottom&&prop.bottom>orb.top),'props clear island orbs');
 assert.equal(await nodeButton(locked.id).locator('svg>path').count(),1);await page.locator('#toast').evaluate(el=>el.classList.remove('visible'));await page.screenshot({path:path.join(out,'neutral-locked-asymmetric.png')});await nodeButton(locked.id).locator('.stop-orb').screenshot({path:path.join(out,'lock-detail.png')});
 const selected=pathNodes.find(n=>n.lessonId==='1C'),siblings=pathNodes.filter(n=>n.lessonId==='1C');
 await nodeButton(selected.id).scrollIntoViewIfNeeded();await nodeButton(selected.id).hover();assert.equal(await page.locator('.current-path').getAttribute('data-path-node'),first.id);
 await nodeButton(selected.id).click();await page.locator('#path-bubble:popover-open [data-start-path]').waitFor();assert.equal(await page.locator('.current-path').getAttribute('data-path-node'),selected.id);await page.locator('#path-bubble [data-start-path]').click();
 let answered=0;while(await page.locator('.activity-page:not(.result-page)').count()){
  const current=await page.evaluate(()=>HorizonsApp.getState());if(current.activity!=='quiz')break;const q=getActivityQuestions(selected.id,{...current.options,count:512}).find(q=>q.id===current.question.id);assert.ok(q);
  if(q.type==='choice')await page.locator('[data-choice='+JSON.stringify(q.answer)+']').click();else await page.locator('#typed-answer').fill(String(q.correctText??q.answer));await page.locator('[data-action=check-answer]').click();await page.locator('[data-action=next-question]').click();answered++;
 }
 await page.locator('.result-page[data-saved=true]').waitFor();await page.locator('[data-action=back-to-path]').click();await nodeButton(selected.id).waitFor();assert.equal(await page.locator('.current-path').getAttribute('data-path-node'),selected.id);assert.equal(await nodeButton(siblings[1].id).isEnabled(),true);assert.equal(await nodeButton(siblings[2].id).isDisabled(),true);assert.equal(await page.locator('.hero-continue').getAttribute('data-path-node'),siblings[1].id);
 assert.equal(await nodeButton(first.id).isEnabled(),true);assert.equal(await nodeButton(locked.id).isDisabled(),true);
 await page.reload();await page.locator('.current-path').waitFor();assert.equal(await page.locator('.current-path').getAttribute('data-path-node'),selected.id);
 for(const width of [1440,390]){
  await page.setViewportSize({width,height:900});await page.waitForTimeout(100);const marker=await page.locator('.current-path .stop-orb').boundingBox(),view=await map().boundingBox();assert.ok(marker.x>=view.x&&marker.x+marker.width<=view.x+view.width+1,'current island revealed on return/resize');assert.equal(await page.locator('.current-path .stop-orb').evaluate(el=>getComputedStyle(el).outlineStyle),'solid');assert.equal(await page.locator('.current-path .stop-orb').evaluate(el=>getComputedStyle(el).outlineWidth),'3px');assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));await page.screenshot({path:path.join(out,'current-'+width+'.png')});
 }
 assert.deepEqual(errors,[]);fs.writeFileSync(reportFile,JSON.stringify({pass:true,base,initialUnlocked:4,initialLocked:17,neutralUnfinishedStars:true,asymmetricProps:true,propsClearIslands:true,lessonIndependent:true,completionUnlocksNext:true,lockedStartBlocked:true,cursorOnlyOnClick:true,cursorAfterSaveAndReload:true,cursorRevealedOnReturnAndResize:true,heroContinuesSelectedLesson:true,noPlayerAvatar:true,answered,fixture:'Actual renderer and server application with isolated synthetic in-memory store; no real CMS operations',errors},null,2)+'\n');console.log('PASS neutral stars, asymmetric props, independent lesson locks, guarded starts, persistent completed cursor, responsive reveal and Continue');
}finally{await browser.close();}
