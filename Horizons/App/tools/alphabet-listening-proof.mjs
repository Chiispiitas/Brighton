import {createRequire} from 'node:module';
import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
const require=createRequire(import.meta.url);
const {chromium}=require('C:/Users/David/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const base=process.env.HZ_APP_URL||'http://127.0.0.1:8898/Horizons/App/';
const out=process.env.HZ_MOTION_OUTPUT||'C:/Users/David/Documents/Codex/2026-11-06/alphabet-listening';
const reportFile=process.env.HZ_MOTION_REPORT||new URL('../reports/alphabet-listening.json',import.meta.url);
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
await context.route('**/api/horizons',async route=>{const data=route.request().postDataJSON();apiActions.push(data.action);const result=await call(data.action,data,session.token);if(result.progress){result.progress.completedActivities=pathNodes.map(n=>n.id);for(const n of pathNodes){if(result.progress.islands?.[n.id])result.progress.islands[n.id].completed=true;}}await route.fulfill({status:result.status,contentType:'application/json',body:JSON.stringify(result)});});
await context.addCookies([{url:base,name:'hz_companion_session',value:session.token}]);


const page=await context.newPage();page.on('pageerror',error=>errors.push(error.message));await page.emulateMedia({reducedMotion:'reduce'});
const map=()=>page.locator('.overworld-map'),nodeButton=id=>page.locator('.learning-path [data-path-node="'+id+'"]');
try{
 for(const width of [1440,390]){
 await page.setViewportSize({width,height:900});await page.goto(base+'?alphabet='+width+'#practice');await page.locator('.practice-heading').waitFor();await page.locator('input[value=topic-1a-alphabet]').check();assert.equal(await page.locator('[data-mix=recall]').isVisible(),false);await page.locator('[data-mix=listening]').click();
 assert.equal(await page.locator('#typed-answer').count(),0);assert.equal(await page.locator('.activity-page').getAttribute('data-listening'),'true');assert.equal(await page.locator('.answer-option').count(),4);assert.equal(await page.locator('.question-cue').count(),0);
 await page.screenshot({path:path.join(out,'listening-'+width+'.png')});await page.locator('[data-action=skip-audio]').click();await page.locator('.practice-heading').waitFor();
 }
 assert.deepEqual(errors,[]);fs.writeFileSync(reportFile,JSON.stringify({pass:true,widths:[1440,390],typeAnswersSelectionStillListening:true,noTypedField:true,noAnswerCue:true,cannotListenReturnsToPractice:true,syntheticUiFixture:true,errors},null,2)+'\n');console.log('PASS alphabet listening UI and no typed fallback desktop/mobile');
}finally{await browser.close();}
