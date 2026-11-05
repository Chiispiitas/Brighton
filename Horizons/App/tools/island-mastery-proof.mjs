import {createRequire} from 'node:module';
import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
const require=createRequire(import.meta.url);
const {chromium}=require('C:/Users/David/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const base=process.env.HZ_APP_URL||'http://127.0.0.1:8898/Horizons/App/';
const out=process.env.HZ_MOTION_OUTPUT||'C:/Users/David/Documents/Codex/2026-11-04/horizons-island-mastery';
const reportFile=process.env.HZ_MOTION_REPORT||new URL('../reports/island-mastery-proof.json',import.meta.url);
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
await context.addInitScript(()=>{
  window.motionCalls=[];
  const animate=Element.prototype.animate;
  Element.prototype.animate=function(frames,options){
    const protectedArt='.character,.avatar,[data-avatar-static]';
    window.motionCalls.push({target:this.className?.baseVal??this.className,protected:!!this.closest(protectedArt)||!!this.querySelector(protectedArt),reduced:matchMedia('(prefers-reduced-motion: reduce)').matches,frames,duration:options?.duration});
    return animate.call(this,frames,options);
  };
});
const page=await context.newPage();page.on('pageerror',error=>errors.push(error.message));
const settle=async()=>{await page.waitForTimeout(700);await page.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.images].filter(i=>i.getBoundingClientRect().top<innerHeight).map(i=>i.decode().catch(()=>{})));});};
const resetCalls=()=>page.evaluate(()=>{window.motionCalls=[];});
async function calls(){return page.evaluate(()=>window.motionCalls);}
async function still(){
  await settle();
  assert.equal(await page.evaluate(()=>document.getAnimations().filter(a=>a.playState==='running').length),0,'motion must settle');
  assert.equal(await page.evaluate(()=>[...document.querySelectorAll('.character,.avatar')].some(el=>{for(let node=el;node;node=node.parentElement)if(node.getAnimations().some(a=>a.playState==='running'))return true;return false;})),false);
  assert.ok((await calls()).every(call=>!call.protected && !call.reduced && call.duration<=600));
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'horizontal overflow');
}
async function shot(name){await still();await page.screenshot({path:path.join(out,name+'.png')});}
async function nav(route){await page.locator('[data-route='+route+']:visible').first().click();await settle();}
async function leave(){await page.locator('[data-action=leave-activity]').click();await page.locator('[data-leave-confirm]').click();await settle();}
try{
 await page.goto(base);await page.locator('.app-shell').waitFor();await settle();
 const id='topic-1a-greetings',target=()=>page.locator('.learning-path [data-path-node="'+id+'"]');let firstWords=new Set(),round=0;
 while(!(await call('getSession',{},session.token)).progress.islands[id].mastered&&round<10){
  await target().click();await page.locator('#path-bubble [data-start-path]').click();let index=0;
  while(await page.locator('.activity-page:not(.result-page)').count()){
   const state=await page.evaluate(()=>HorizonsApp.getState());if(state.activity!=='quiz')break;
   const q=getActivityQuestions(id,{...state.options,count:512}).find(q=>q.id===state.question.id);assert.ok(q);
   if(round===0)firstWords.add(q.wordIds[0]);if(round===1&&index<2)assert.ok(!firstWords.has(q.wordIds[0]));
   await page.locator('#typed-answer').fill(round===0&&index===0?'fictional incorrect answer':String(q.correctText??q.answer));await page.locator('[data-action=check-answer]').click();await page.locator('[data-action=next-question]').click();index++;
  }
  await page.waitForFunction(()=>HorizonsApp.getState().saved);await page.locator('[data-action=back-to-path]').click();await settle();
  if(round===0){assert.equal(firstWords.size,8);assert.ok(await target().evaluate(el=>el.classList.contains('completed')&&!el.classList.contains('mastered')));}
  round++;
 }
 assert.ok(round<10);assert.ok(await target().evaluate(el=>el.classList.contains('mastered')));
 await page.reload();await page.locator('.path-stop.mastered').waitFor();
 const second=await call('redeem',{code});assert.equal(second.progress.islands[id].mastered,true);
 for(const node of pathNodes.filter(node=>node.lessonId==='1A'))for(let repeat=0;repeat<3;repeat++){
  const qs=getActivityQuestions(node.id,{seed:0,count:512});const result=await call('saveAttempt',{attempt:{id:'lesson-proof-'+node.id+'-'+repeat,activityId:node.id,quizOptions:{seed:0,count:512},answers:qs.map(q=>({questionId:q.id,submitted:q.correctText??q.answer}))}},session.token);assert.equal(result.status,200);
 }
 await page.reload();await page.locator('.lesson-crown').waitFor();
 for(const width of [320,390,768,1440]){
  await page.setViewportSize({width,height:width<768?844:1000});await page.evaluate(()=>scrollTo(0,0));await settle();assert.equal(await page.locator('.lesson-jumps').count(),0);assert.equal(await page.locator('.lesson-landmark .character').count(),0);
  await target().click();await page.waitForTimeout(350);const box=await page.locator('#path-bubble').boundingBox();assert.ok(box.width<=241&&box.height<205);await page.screenshot({path:path.join(out,'mastery-'+width+'.png')});await page.keyboard.press('Escape');checks.push({width,compactBubble:true,goldCrown:true,lessonCrown:true,noShortcuts:true});
 }
 assert.deepEqual(errors,[]);
 fs.writeFileSync(reportFile,JSON.stringify({date:new Date().toISOString(),base,pass:true,checks,roundsToMaster:round,unseenWordsPrioritized:true,wrongAndCorrectSaved:true,completionBeforeMastery:true,reload:true,secondDeviceSession:true,backend:'Actual application with isolated in-memory store, no real CMS writes',limits:['Edge/Chromium only']},null,2)+'\n');console.log('PASS actual server-graded browser coverage, completion, island and lesson crowns, restore and compact bubbles');
}catch(error){console.error(error);await page.screenshot({path:path.join(out,'mastery-failure.png')});process.exitCode=1;}finally{await browser.close();}
