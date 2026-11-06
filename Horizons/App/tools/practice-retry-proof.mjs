import {createRequire} from 'node:module';
import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
const require=createRequire(import.meta.url);
const {chromium}=require('C:/Users/David/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const base=process.env.HZ_APP_URL||'http://127.0.0.1:8898/Horizons/App/';
const out=process.env.HZ_MOTION_OUTPUT||'C:/Users/David/Documents/Codex/2026-11-06/practice-retry';
const reportFile=process.env.HZ_MOTION_REPORT||new URL('../reports/practice-retry.json',import.meta.url);
fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
const context=await browser.newContext({viewport:{width:1440,height:1000},serviceWorkers:'block'});
// Entirely synthetic UI fixture: no learner redemption, saves or real API traffic.
const rows=new Map(),store={async get(c,id){return structuredClone(rows.get(c+':'+id)||null)},async create(c,id,v,scope){if(rows.has(c+':'+id))throw Error('exists');rows.set(c+':'+id,{...structuredClone(v),_scope:scope});return v},async put(c,id,v,scope){rows.set(c+':'+id,{...structuredClone(v),_scope:scope});return v},async list(c,scope){return [...rows.entries()].filter(([k,v])=>k.startsWith(c+':')&&v._scope===scope).map(([,v])=>{const x=structuredClone(v);delete x._scope;return x})}};
const {createApplication,COLLECTIONS,idFor}=await import('../backend/src/server/application.mjs');
const {pathNodes}=await import('../content/unit1.mjs');const {getActivityQuestions,buildQuiz}=await import('../content/engine.mjs');
const api=createApplication(store),code='QA-ISLAND-FICTIONAL-001';await store.create(COLLECTIONS.codes,await idFor('code:'+code),{bookId:'horizons-a1',kind:'example'},'issued');
async function call(action,data={},token=''){const response=await api.handle(new Request('https://test/api/horizons',{method:'POST',headers:{'Content-Type':'application/json',...token?{'X-Requested-With':token}:{}},body:JSON.stringify({action,...data})}));return {status:response.status,...await response.json()};}
const session=await call('redeem',{code}),apiActions=[],errors=[],checks=[];
await context.route('**/api/horizons',async route=>{const data=route.request().postDataJSON();apiActions.push(data.action);const result=await call(data.action,data,session.token);await route.fulfill({status:result.status,contentType:'application/json',body:JSON.stringify(result)});});
await context.addCookies([{url:base,name:'hz_companion_session',value:session.token}]);


const page=await context.newPage();page.on('pageerror',error=>errors.push(error.message));await page.emulateMedia({reducedMotion:'reduce'});
const map=()=>page.locator('.overworld-map'),nodeButton=id=>page.locator('.learning-path [data-path-node="'+id+'"]');
try{
 await page.setViewportSize({width:390,height:740});await page.goto(base);await page.locator('.app-shell').waitFor();await page.locator('.mobile-nav [data-route=practice]').click();await page.locator('input[value=topic-1a-greetings]').check();await page.locator('#round-length').selectOption('all');await page.locator('[data-mix=recall]').click();
 let count=0,niceSeen=0,misses=0,lastId;const initial=[],retrySeen=[];
 while(await page.locator('.activity-page:not(.result-page)').count()){
  const st=await page.evaluate(()=>HorizonsApp.getState()),q=buildQuiz({...st.options,activityId:undefined}).find(q=>q.id===st.question.id);assert.ok(q);assert.equal(st.question.type,'text');assert.equal(await page.locator('.answer-options').count(),0);assert.equal(await page.evaluate(()=>document.activeElement?.id),'typed-answer');
  const nice=q.word.term==='Nice to meet you';if(nice)niceSeen++;if(count<10)initial.push(q.id);else retrySeen.push(q.id);
  const wrong=(nice&&niceSeen<=2)||count===9;
  if(count===9)lastId=q.id;
  await page.keyboard.type(wrong?'zzz incorrect':String(q.correctText??q.answer));await page.locator('[data-action=check-answer]').click();
  if(wrong){misses++;assert.equal(await page.locator('.activity-page').getAttribute('data-answer-state'),'incorrect');assert.ok((await page.locator('[data-action=next-question]').textContent()).includes('Continue'));assert.equal(apiActions.filter(a=>a==='saveAttempt').length,0);}
  else assert.equal(await page.locator('.activity-page').getAttribute('data-answer-state'),'correct');
  if(nice)await page.screenshot({path:path.join(out,'nice-'+niceSeen+'.png')});await page.locator('[data-action=next-question]').click();count++;assert.ok(count<20);
 }
 await page.locator('.result-page[data-saved=true]').waitFor();assert.equal(count,10+misses);assert.equal(niceSeen,3);assert.equal(new Set(initial).size,10);assert.ok(retrySeen.includes(lastId));assert.equal(retrySeen.length,misses);assert.equal(apiActions.filter(a=>a==='saveAttempt').length,1);assert.ok((await page.locator('.result-page>p').textContent()).includes('10 of '+count));const saved=[...rows.values()].filter(x=>x.activityId==='mix-recall');assert.equal(saved.length,1);assert.equal(saved[0].answers.length,10);assert.equal(new Set(saved[0].answers.map(a=>a.questionId)).size,10);assert.ok(saved[0].answers.every(a=>a.correct));assert.equal(saved[0].xp,60);
 await page.locator('[data-action=back-to-path]').click();const first=pathNodes[0];await nodeButton(first.id).scrollIntoViewIfNeeded();await nodeButton(first.id).click();await page.locator('#path-bubble [data-start-path]').click();
 // Learn keeps its existing assessment flow rather than requiring endless retries.
 const st=await page.evaluate(()=>HorizonsApp.getState());if(st.question.type==='choice')await page.locator('[data-choice]').first().click();else await page.locator('#typed-answer').fill('zzz incorrect');await page.locator('[data-action=check-answer]').click();await page.locator('[data-action=next-question]').click();assert.ok((await page.locator('.activity-count').textContent()).endsWith('/8'));await page.goto(base+'?listen=1#practice');await page.locator('.app-shell').waitFor();await page.locator('.mobile-nav [data-route=practice]').click();await page.locator('input[value=topic-1a-alphabet]').check();await page.locator('[data-mix=listening]').click();const listening=await page.evaluate(()=>HorizonsApp.getState());assert.equal(listening.question.type,'choice');assert.equal(listening.question.listening,true);const lq=buildQuiz({...listening.options,activityId:undefined}).find(q=>q.id===listening.question.id);const wrongChoice=lq.choices.find(c=>c.id!==lq.answer);await page.locator('[data-choice='+JSON.stringify(wrongChoice.id)+']').click();await page.locator('[data-action=check-answer]').click();assert.equal(await page.locator('.activity-page').getAttribute('data-answer-state'),'incorrect');assert.ok((await page.locator('[data-action=next-question]').textContent()).includes('Continue'));await page.locator('[data-action=next-question]').click();assert.ok((await page.locator('.activity-count').textContent()).endsWith('/9'));assert.equal(await page.locator('[data-action=skip-audio]').count(),1);assert.deepEqual(errors,[]);
 fs.writeFileSync(reportFile,JSON.stringify({pass:true,typedVocabularyExpressions:true,niceSeen,wrongAnswers:misses,queueAtEnd:true,repeatsUntilCorrect:true,lastWrongCannotFinish:true,localAccuracyIncludesMistakes:true,singleSaveUniqueQuestions:true,noExtraXpForRetries:true,learnFlowUnchanged:true,listeningKeepsAudioAndChoice:true,listeningRetries:true,count,errors},null,2)+'\n');console.log('PASS typed vocabulary expressions, repeat-until-correct queue, last-item/repeated errors, single server save and XP');
}finally{await browser.close();}
