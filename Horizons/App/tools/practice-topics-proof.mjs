import {createRequire} from 'node:module';
import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
const require=createRequire(import.meta.url);
const {chromium}=require('C:/Users/David/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const base=process.env.HZ_APP_URL||'http://127.0.0.1:8898/Horizons/App/';
const out=process.env.HZ_MOTION_OUTPUT||'C:/Users/David/Documents/Codex/2026-11-05/practice-topics';
const reportFile=process.env.HZ_MOTION_REPORT||new URL('../reports/practice-topics.json',import.meta.url);
fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
const context=await browser.newContext({viewport:{width:1440,height:1000},serviceWorkers:'block'});
// Entirely synthetic UI fixture: no learner redemption, saves or real API traffic.
const rows=new Map(),store={async get(c,id){return structuredClone(rows.get(c+':'+id)||null)},async create(c,id,v,scope){if(rows.has(c+':'+id))throw Error('exists');rows.set(c+':'+id,{...structuredClone(v),_scope:scope});return v},async put(c,id,v,scope){rows.set(c+':'+id,{...structuredClone(v),_scope:scope});return v},async list(c,scope){return [...rows.entries()].filter(([k,v])=>k.startsWith(c+':')&&v._scope===scope).map(([,v])=>{const x=structuredClone(v);delete x._scope;return x})}};
const {createApplication,COLLECTIONS,idFor}=await import('../backend/src/server/application.mjs');
const {pathNodes,vocabulary,chunks}=await import('../content/unit1.mjs');const {getActivityQuestions}=await import('../content/engine.mjs');
const api=createApplication(store),code='QA-ISLAND-FICTIONAL-001';await store.create(COLLECTIONS.codes,await idFor('code:'+code),{bookId:'horizons-a1',kind:'example'},'issued');
async function call(action,data={},token=''){const response=await api.handle(new Request('https://test/api/horizons',{method:'POST',headers:{'Content-Type':'application/json',...token?{'X-Requested-With':token}:{}},body:JSON.stringify({action,...data})}));return {status:response.status,...await response.json()};}
const session=await call('redeem',{code}),apiActions=[],errors=[],checks=[];
await context.route('**/api/horizons',async route=>{const data=route.request().postDataJSON();apiActions.push(data.action);const result=await call(data.action,data,session.token);await route.fulfill({status:result.status,contentType:'application/json',body:JSON.stringify(result)});});
await context.addCookies([{url:base,name:'hz_companion_session',value:session.token}]);


const page=await context.newPage();page.on('pageerror',error=>errors.push(error.message));await page.emulateMedia({reducedMotion:'reduce'});
const map=()=>page.locator('.overworld-map'),nodeButton=id=>page.locator('.learning-path [data-path-node="'+id+'"]');
try{
 await page.goto(base);await page.locator('.app-shell').waitFor();await page.locator('.desktop-nav [data-route=practice]').click();
 const topics=pathNodes.filter(n=>n.kind==='topic'),vocabTopics=topics.filter(n=>n.chunkIds?.length);assert.equal(await page.locator('.practice-topic').count(),topics.length);assert.equal(await page.locator('.practice-lesson').count(),4);assert.equal(await page.locator('input[name=chunk]').count(),0);assert.equal(await page.locator('.grammar-shelf').count(),0);
 const alphabet=page.locator('input[value=topic-1a-alphabet]');await alphabet.check();assert.equal(await alphabet.isChecked(),true);assert.ok((await page.locator('.mix-launch h2').textContent()).includes('26'));await page.locator('input[value=topic-1a-numbers]').check();assert.ok((await page.locator('.mix-launch h2').textContent()).includes('55'));
 await page.locator('[data-action=select-all]').click();assert.equal(await page.locator('input[name=practice-topic]:checked').count(),vocabTopics.length);const expected=new Set(chunks.flatMap(c=>c.wordIds));assert.ok((await page.locator('.mix-launch h2').textContent()).includes(String(expected.size)),'all original word coverage retained');await page.locator('[data-action=select-all]').click();assert.equal(await page.locator('input[name=practice-topic]:checked').count(),0);
 for(const width of [1440,390,320]){await page.setViewportSize({width,height:900});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));await page.screenshot({path:path.join(out,'practice-'+width+'.png'),fullPage:true});}
 await page.locator('input[value=topic-1a-alphabet]').check();await page.locator('[data-mix=recall]').click();const st=await page.evaluate(()=>HorizonsApp.getState());assert.equal(st.activity,'quiz');assert.deepEqual(new Set(st.options.chunkIds),new Set(vocabTopics.find(n=>n.id==='topic-1a-alphabet').chunkIds));await page.goto(base+'?qa=practice#practice');await page.locator('.app-shell').waitFor();await page.locator('.mobile-nav [data-route=practice]').click();
 await page.locator('[data-grammar="1a-be"]').click();assert.equal((await page.evaluate(()=>HorizonsApp.getState())).activity,'quiz');await page.goto(base+'?qa=bank#practice');await page.locator('.app-shell').waitFor();await page.locator('.mobile-nav [data-route=practice]').click();await page.locator('[data-action=word-bank]').click();
 assert.equal(await page.locator('.word-bank-lesson').count(),4);assert.equal(await page.locator('.word-bank-lesson[open]').count(),0);const allIds=new Set(await page.locator('[data-word]').evaluateAll(els=>els.map(el=>el.dataset.word)));assert.deepEqual(allIds,new Set(vocabulary.map(w=>w.id)));
 for(const lesson of ['1A','1B','1C','1D']){const ids=await page.locator('[data-bank-lesson="'+lesson+'"] [data-word]').evaluateAll(els=>els.map(el=>el.dataset.word));assert.deepEqual(new Set(ids),new Set(vocabulary.filter(w=>w.lessonIds.includes(lesson)).map(w=>w.id)));}
 await page.locator('[data-bank-lesson="1A"]>summary').click();await page.waitForTimeout(50);await page.locator('[data-bank-lesson="1A"] [data-word]').first().click();await page.locator('#app-dialog[open]').waitFor();await page.locator('#app-dialog [data-dialog-close]').click();
 await page.locator('#word-search').fill('ecuador');await page.waitForTimeout(50);assert.ok(await page.locator('.word-bank-lesson[open]').count()>0);assert.ok((await page.locator('.word-tile:visible').allTextContents()).every(t=>/ecuador/i.test(t)));await page.locator('#word-search').fill('nothingmatches123');assert.equal(await page.locator('.empty-message').textContent(),'No words found.');await page.locator('#word-search').fill('');assert.equal(await page.locator('[data-bank-lesson="1A"]').getAttribute('open'),'');assert.equal(await page.locator('.word-bank-lesson[open]').count(),1);
 for(const width of [1440,390,320]){await page.setViewportSize({width,height:900});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));await page.screenshot({path:path.join(out,'bank-'+width+'.png'),fullPage:true});}
 assert.deepEqual(errors,[]);fs.writeFileSync(reportFile,JSON.stringify({pass:true,topicCount:topics.length,previousChunkCount:chunks.length,lessonGroups:4,selectAllCoverage:expected.size,wordBankPreserved:vocabulary.length,topicSelection:true,grammarLaunch:true,vocabularyLaunch:true,wordDialog:true,collapsible:true,searchExpandsMatches:true,openStateRestored:true,widths:[320,390,1440],fixture:'Actual renderer; isolated synthetic API store, no learner records',errors},null,2)+'\n');console.log('PASS compact Practice topics, full vocabulary coverage and collapsible lesson word bank');
}finally{await browser.close();}
