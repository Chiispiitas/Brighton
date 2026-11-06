import {createRequire} from 'node:module';
import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
const require=createRequire(import.meta.url);
const {chromium}=require('C:/Users/David/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const base=process.env.HZ_APP_URL||'http://127.0.0.1:8898/Horizons/App/';
const out=process.env.HZ_MOTION_OUTPUT||'C:/Users/David/Documents/Codex/2026-11-05/one-correct-mastery';
const reportFile=process.env.HZ_MOTION_REPORT||new URL('../reports/one-correct-mastery.json',import.meta.url);
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

await pageProof();
async function pageProof(){
 const page=await context.newPage();page.on('pageerror',error=>errors.push(error.message));await page.emulateMedia({reducedMotion:'reduce'});
 try{
  await page.goto(base);await page.locator('.app-shell').waitFor();const id='topic-1a-greetings',target=()=>page.locator('.learning-path [data-path-node="'+id+'"]');const firstIds=new Set();
  for(let round=0;round<2;round++){
   await target().click();await page.locator('#path-bubble [data-start-path]').click();let count=0;
   while(await page.locator('.activity-page:not(.result-page)').count()){
    const current=await page.evaluate(()=>HorizonsApp.getState());if(current.activity!=='quiz')break;
    const q=getActivityQuestions(id,{...current.options,count:512}).find(q=>q.id===current.question.id);assert.ok(q);
    if(round===0)firstIds.add(q.wordIds[0]);else assert.ok(!firstIds.has(q.wordIds[0]));
    if(q.type==='choice')await page.locator('[data-choice='+JSON.stringify(q.answer)+']').click();
    else await page.locator('#typed-answer').fill(String(q.word?.aliases?.[0]||q.correctText||q.answer));
    await page.locator('[data-action=check-answer]').click();assert.equal(await page.locator('.activity-page').getAttribute('data-answer-state'),'correct');await page.locator('[data-action=next-question]').click();count++;
   }
   await page.locator('.result-page[data-saved=true]').waitFor();assert.equal(count,round===0?8:2);
   const progress=(await call('getSession',{},session.token)).progress,expected=round===0?8:10;assert.equal(progress.islands[id].masteredCount,expected);assert.equal(progress.islands[id].mastered,round===1);checks.push({round:round+1,questions:count,mastered:expected,total:10});
   await page.locator('[data-action=back-to-path]').click();await target().waitFor();
   if(round===0){assert.equal(await target().evaluate(el=>el.classList.contains('mastered')),false);await target().click();await page.locator('#path-bubble:popover-open .island-bubble-progress').waitFor({state:'visible'});assert.match(await page.locator('#path-bubble').innerText(),/8\/10 mastered/);assert.match(await page.locator('.island-bubble-progress').getAttribute('title'),/correctly once/);await page.screenshot({path:path.join(out,'eight-of-ten.png')});await page.keyboard.press('Escape');}
  }
  assert.equal(await target().evaluate(el=>el.classList.contains('mastered')),true);assert.match(await target().getAttribute('aria-label'),/Mastered/);await target().click();await page.locator('#path-bubble:popover-open .island-bubble-progress').waitFor({state:'visible'});assert.match(await page.locator('#path-bubble').innerText(),/Mastered/);await page.screenshot({path:path.join(out,'crowned-island.png')});await page.keyboard.press('Escape');
  await page.reload();await page.locator('.path-stop.mastered').waitFor();const restored=await call('redeem',{code});assert.equal(restored.progress.islands[id].mastered,true);
  for(const node of pathNodes.filter(n=>n.lessonId==='1A')){
   const qs=getActivityQuestions(node.id,{seed:0,count:512});const saved=await call('saveAttempt',{attempt:{id:'one-pass-lesson-'+node.id,activityId:node.id,quizOptions:{seed:0,count:512},answers:qs.map(q=>({questionId:q.id,submitted:q.correctText??q.answer}))}},session.token);assert.equal(saved.status,200);
  }
  await page.reload();await page.locator('.lesson-crown').first().waitFor();assert.deepEqual(errors,[]);
  fs.writeFileSync(reportFile,JSON.stringify({pass:true,base,checks,firstRoundEightMastered:true,secondRoundOnlyTwoRemaining:true,acceptedAliasesCount:true,goldIslandAndCrown:true,lessonCrown:true,reloadAndOtherDevice:true,server:'Actual application with isolated in-memory synthetic store; no real CMS reads/writes',errors},null,2)+'\n');console.log('PASS 8/10 after first round, 2 remaining, 10/10 crown, accepted aliases and saved restore');
 }finally{await browser.close();}
}
