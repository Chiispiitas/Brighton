import {createRequire} from 'node:module';
import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
const require=createRequire(import.meta.url);
const {chromium}=require('C:/Users/David/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const base=process.env.HZ_APP_URL||'http://127.0.0.1:8898/Horizons/App/';
const out=process.env.HZ_MOTION_OUTPUT||'C:/Users/David/Documents/Codex/2026-11-06/result-accent';
const reportFile=process.env.HZ_MOTION_REPORT||new URL('../reports/result-accent.json',import.meta.url);
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


const page=await context.newPage();page.on('pageerror',error=>errors.push(error.message));await page.emulateMedia({reducedMotion:'no-preference'});
const map=()=>page.locator('.overworld-map'),nodeButton=id=>page.locator('.learning-path [data-path-node="'+id+'"]');
try{
 for(const [character,activity] of [['mina','read-1a'],['alex','topic-1a-alphabet']]){
  await page.goto(base+'?resultAccent='+character);await page.locator('.app-shell').waitFor();
  await page.evaluate(id=>{const b=document.createElement('button');b.dataset.startActivity=id;b.id='qa-start';document.getElementById('app').append(b)},activity);await page.locator('#qa-start').dispatchEvent('click');
  let answered=0;
  while(await page.locator('.activity-page').count()){
   const st=await page.evaluate(()=>HorizonsApp.getState());const q=getActivityQuestions(activity,{...st.options,count:512}).find(q=>q.id===st.question.id);assert.ok(q);
   if(st.question.type==='text')await page.locator('#typed-answer').fill(String(q.correctText??q.answer));
   else await page.locator('[data-choice='+JSON.stringify(q.answer)+']').click();
   await page.locator('[data-action=check-answer]').click();assert.equal(await page.locator('.activity-page').getAttribute('data-answer-state'),'correct');await page.locator('[data-action=next-question]').click();assert.ok(++answered<30);
  }
  await page.locator('.result-page[data-saved=true]').waitFor();const result=page.locator('.result-page [data-character='+character+']');
  await page.waitForFunction(name=>document.querySelector('.result-page [data-character='+name+']')?.dataset[name+'Motion']==='ready',character);
  const sample=await result.evaluate((el,name)=>({phase:el.dataset[name+'Phase'],time:el.querySelector('.'+name+'-motion-root').getAnimations()[0].currentTime}),character);
  assert.equal(sample.phase,'accent');assert.ok(sample.time>=8000&&sample.time<10000,JSON.stringify(sample));
  await page.waitForTimeout(800);await page.screenshot({path:path.join(out,character+'-entry.png')});
  await page.waitForTimeout(2400);assert.equal(await result.getAttribute('data-'+character+'-phase'),'idle');
  // A later results mount must restart the accent even after the pose was remembered.
  await result.evaluate(async(el,name)=>{const m=await import('./src/'+name+'-motion.js?v=resultaccent1');m[name==='mina'?'unmountMina':'unmountAlex'](el);await m[name==='mina'?'mountMina':'mountAlex'](el).ready;},character);
  assert.equal(await result.getAttribute('data-'+character+'-phase'),'accent');
  await page.emulateMedia({reducedMotion:'reduce'});await page.waitForTimeout(40);assert.equal(await result.getAttribute('data-'+character+'-motion'),'reduced');
  checks.push({character,answered,immediatePhase:sample.phase,entryTime:sample.time,returnsToIdle:true,repeatedResultsRestart:true,reducedMotionStatic:true});await page.emulateMedia({reducedMotion:'no-preference'});
 }
 assert.deepEqual(errors,[]);fs.writeFileSync(reportFile,JSON.stringify({pass:true,checks,syntheticUiFixture:true,realLearnerRecordsUsed:false,errors},null,2)+'\n');console.log('PASS saved Mina/Alex results enter accent immediately, then idle; repeat results restart; reduced motion stays static.');
}catch(error){await page.screenshot({path:path.join(out,'failure.png')});throw error;}finally{await browser.close();}
