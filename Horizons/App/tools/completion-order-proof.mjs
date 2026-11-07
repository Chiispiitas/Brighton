import {createRequire} from 'node:module';
import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
const require=createRequire(import.meta.url);
const {chromium}=require('C:/Users/David/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const base=process.env.HZ_APP_URL||'http://127.0.0.1:8898/Horizons/App/';
const out=process.env.HZ_MOTION_OUTPUT||'C:/Users/David/Documents/Codex/2026-11-06/completion-order';
const reportFile=process.env.HZ_MOTION_REPORT||new URL('../reports/completion-order.json',import.meta.url);
fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
const context=await browser.newContext({viewport:{width:1440,height:1000},serviceWorkers:'block'});
// Entirely synthetic UI fixture: no learner redemption, saves or real API traffic.
const rows=new Map(),store={async get(c,id){return structuredClone(rows.get(c+':'+id)||null)},async create(c,id,v,scope){if(rows.has(c+':'+id))throw Error('exists');rows.set(c+':'+id,{...structuredClone(v),_scope:scope});return v},async put(c,id,v,scope){rows.set(c+':'+id,{...structuredClone(v),_scope:scope});return v},async list(c,scope){return [...rows.entries()].filter(([k,v])=>k.startsWith(c+':')&&v._scope===scope).map(([,v])=>{const x=structuredClone(v);delete x._scope;return x})}};
const {createApplication,COLLECTIONS,idFor}=await import('../backend/src/server/application.mjs');
const {pathNodes}=await import('../content/unit1.mjs');const {getActivityQuestions,buildQuiz}=await import('../content/engine.mjs');
const api=createApplication(store,{now:()=> '2026-11-02T00:00:00.000Z'}),code='QA-ISLAND-FICTIONAL-001';await store.create(COLLECTIONS.codes,await idFor('code:'+code),{bookId:'horizons-a1',kind:'example'},'issued');
async function call(action,data={},token=''){const response=await api.handle(new Request('https://test/api/horizons',{method:'POST',headers:{'Content-Type':'application/json',...token?{'X-Requested-With':token}:{}},body:JSON.stringify({action,...data})}));return {status:response.status,...await response.json()};}
const session=await call('redeem',{code}),apiActions=[],errors=[],checks=[];
await context.route('**/api/horizons',async route=>{const data=route.request().postDataJSON();apiActions.push(data.action);const result=await call(data.action,data,session.token);await route.fulfill({status:result.status,contentType:'application/json',body:JSON.stringify(result)});});
await context.addCookies([{url:base,name:'hz_companion_session',value:session.token}]);



const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));await page.emulateMedia({reducedMotion:'no-preference'});

try{
 await page.emulateMedia({reducedMotion:'reduce'});await page.goto(base+'#practice');await page.locator('.practice-heading').waitFor();assert.equal(await page.locator('.desktop-nav [data-route=leaderboard]').innerText(),'Rank');await page.locator('input[value=topic-1a-greetings]').check();await page.locator('[data-mix=recall]').click();
 for(let i=0;i<8;i++){await page.locator('#typed-answer').waitFor();const st=await page.evaluate(()=>HorizonsApp.getState()),q=buildQuiz(st.options).find(q=>q.id===st.question.id);await page.locator('#typed-answer').fill(q.correctText||q.answer);await page.locator('[data-action=check-answer]').click();await page.locator('[data-action=next-question]').click();}
 await page.locator('.result-page').waitFor();assert.equal(await page.locator('.streak-celebration-page').count(),0);assert.equal(await page.locator('.overtake-page').count(),0);await page.screenshot({path:path.join(out,'1-results.png')});await page.locator('[data-action=completion-continue]').click();await page.locator('.streak-celebration-page').waitFor();await page.screenshot({path:path.join(out,'2-streak.png')});await page.locator('[data-action=streak-results]').click();await page.locator('.overtake-page').waitFor();await page.waitForFunction(()=>[...document.querySelectorAll('.overtake-page .board-avatar img')].every(i=>i.complete&&i.naturalWidth>0));await page.emulateMedia({reducedMotion:'no-preference'});await page.waitForTimeout(100);assert.ok(await page.locator('.overtake-self').evaluate(el=>el.getAnimations().length)>0);await page.waitForTimeout(1000);for(const [width,height]of [[1440,900],[390,844],[320,640]]){await page.setViewportSize({width,height});await page.screenshot({path:path.join(out,'3-overtake-'+width+'.png')});assert.ok(await page.locator('[data-action=completion-continue]').evaluate(el=>el.getBoundingClientRect().bottom<=innerHeight));}assert.ok((await page.locator('.overtake-positions').innerText()).includes('#1'));await page.locator('[data-action=completion-continue]').click();await page.locator('.learning-path').waitFor();assert.deepEqual(errors,[]);fs.writeFileSync(reportFile,JSON.stringify({pass:true,order:['saved results','streak','overtake','learn'],syntheticOnly:true,errors},null,2)+'\n');console.log('PASS actual saved lesson results, then streak, then overtake, then Learn; Rank sidebar');
}finally{await browser.close();}
