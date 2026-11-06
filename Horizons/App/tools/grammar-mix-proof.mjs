import {createRequire} from 'node:module';
import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
const require=createRequire(import.meta.url);
const {chromium}=require('C:/Users/David/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const base=process.env.HZ_APP_URL||'http://127.0.0.1:8898/Horizons/App/';
const out=process.env.HZ_MOTION_OUTPUT||'C:/Users/David/Documents/Codex/2026-11-06/grammar-mix';
const reportFile=process.env.HZ_MOTION_REPORT||new URL('../reports/grammar-mix.json',import.meta.url);
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
 await page.goto(base);await page.locator('.app-shell').waitFor();await page.locator('.desktop-nav [data-route=practice]').click();
 await page.locator('input[value=topic-1a-be]').check();assert.equal((await page.evaluate(()=>HorizonsApp.getState())).activity,null);assert.equal(await page.locator('[data-mix=recall]').isEnabled(),true);assert.equal(await page.locator('[data-mix=listening]').isDisabled(),true);assert.equal(await page.locator('[data-mix=memory]').isDisabled(),true);
 await page.locator('input[value=topic-1b-articles]').check();await page.locator('input[value=topic-1a-alphabet]').check();
 for(const width of [1440,390,320]){await page.setViewportSize({width,height:900});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));await page.screenshot({path:path.join(out,'selection-'+width+'.png'),fullPage:true});}
 await page.locator('[data-mix=recall]').click();const kinds=new Set();let answered=0;
 while(await page.locator('.activity-page:not(.result-page)').count()){
  const st=await page.evaluate(()=>HorizonsApp.getState());assert.equal(st.options.mode,'mixed');assert.deepEqual(st.options.grammarSetIds,['1a-be','1b-articles']);assert.deepEqual(st.options.chunkIds,['1a-alphabet-ag','1a-alphabet-hn','1a-alphabet-ot','1a-alphabet-uz']);const q=buildQuiz({...st.options,activityId:undefined}).find(q=>q.id===st.question.id);assert.ok(q);kinds.add(q.kind);
  if(st.question.type==='order'){for(const word of String(q.answer).split(/\s+/)){const buttons=page.locator('.sentence-tokens button:not(:disabled)');for(const b of await buttons.all())if(await b.textContent()===word){await b.click();break;}}}else if(q.type==='choice')await page.locator('[data-choice='+JSON.stringify(q.answer)+']').click();else await page.locator('#typed-answer').fill(String(q.correctText??q.answer));
  await page.locator('[data-action=check-answer]').click();assert.equal(await page.locator('.activity-page').getAttribute('data-answer-state'),'correct');await page.locator('[data-action=next-question]').click();answered++;
 }
 assert.deepEqual(kinds,new Set(['grammar','vocabulary']));await page.locator('.result-page[data-saved=true]').waitFor();await page.locator('[data-action=back-to-path]').click();await page.locator('.mobile-nav [data-route=practice]').click();assert.equal(await page.locator('input[value=topic-1a-be]').isChecked(),true);
 await page.locator('[data-action=select-all]').click();assert.equal(await page.locator('input[name=practice-topic]:checked').count(),13);await page.locator('[data-action=select-all]').click();assert.equal(await page.locator('input[name=practice-topic]:checked').count(),0);assert.equal(await page.locator('[data-mix=recall]').isDisabled(),true);
 await page.locator('input[value=topic-1b-articles]').check();await page.locator('#round-length').selectOption('all');await page.locator('[data-mix=recall]').click();const st=await page.evaluate(()=>HorizonsApp.getState());assert.equal(st.options.mode,'grammar');assert.equal(st.options.count,'all');assert.deepEqual(st.options.chunkIds,[]);assert.deepEqual(st.options.grammarSetIds,['1b-articles']);assert.deepEqual(errors,[]);
 fs.writeFileSync(reportFile,JSON.stringify({pass:true,grammarSelection:true,mixedRoundBothKinds:true,serverSaved:true,answered,allAndClear:true,grammarOnly:true,allItems:true,vocabularyModesGuarded:true,selectionRetained:true,widths:[1440,390,320],errors},null,2)+'\n');console.log('PASS selectable grammar, mixed round grading/save, grammar-only, select all/clear and layouts');
}finally{await browser.close();}
