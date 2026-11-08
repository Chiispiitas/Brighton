import {createRequire} from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url);
const {chromium}=require('C:/Users/David/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const base=process.env.HZ_APP_URL||'http://127.0.0.1:8898/Horizons/App/';
const out=process.env.HZ_MOTION_OUTPUT||'C:/Users/David/Documents/Codex/2026-11-08/listening-voices';
const reportFile=process.env.HZ_MOTION_REPORT||new URL('../reports/listening-voices-autoplay.json',import.meta.url);
fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
const context=await browser.newContext({viewport:{width:1440,height:1000},serviceWorkers:'block'});
// Entirely synthetic UI fixture: no learner redemption, saves or real API traffic.
const rows=new Map(),store={async get(c,id){return structuredClone(rows.get(c+':'+id)||null)},async create(c,id,v,scope){if(rows.has(c+':'+id))throw Error('exists');rows.set(c+':'+id,{...structuredClone(v),_scope:scope});return v},async put(c,id,v,scope){rows.set(c+':'+id,{...structuredClone(v),_scope:scope});return v},async list(c,scope){return [...rows.entries()].filter(([k,v])=>k.startsWith(c+':')&&v._scope===scope).map(([,v])=>{const x=structuredClone(v);delete x._scope;return x})}};
const {createApplication,COLLECTIONS,idFor}=await import('../backend/src/server/application.mjs');
const {pathNodes}=await import('../content/unit1.mjs');
const api=createApplication(store),code='QA-ISLAND-FICTIONAL-001';await store.create(COLLECTIONS.codes,await idFor('code:'+code),{bookId:'horizons-a1',kind:'example'},'issued');
async function call(action,data={},token=''){const response=await api.handle(new Request('https://test/api/horizons',{method:'POST',headers:{'Content-Type':'application/json',...token?{'X-Requested-With':token}:{}},body:JSON.stringify({action,...data})}));return {status:response.status,...await response.json()};}
const sent=[],session=await call('redeem',{code}),apiActions=[],errors=[],checks=[];
await context.route('**/api/horizons',async route=>{const data=route.request().postDataJSON();apiActions.push(data.action);if(data.action==='saveAttempt')sent.push(data.attempt);const result=await call(data.action,data,session.token);if(result.progress)result.progress.completedActivities=pathNodes.map(n=>n.id);await route.fulfill({status:result.status,contentType:'application/json',body:JSON.stringify(result)});});
await context.addCookies([{url:base,name:'hz_companion_session',value:session.token}]);



await context.addInitScript(()=>{
 window.audioCalls=[];window.audioOutcomes=[];
 speechSynthesis.speak=()=>{throw Error('Device speech is forbidden');};
 const original=HTMLMediaElement.prototype.play;
 HTMLMediaElement.prototype.play=function(){
  audioCalls.push(this.src);const src=this.src;
  if(window.denyAudio)return Promise.reject(new DOMException('Autoplay denied','NotAllowedError'));
  return original.call(this).then(()=>audioOutcomes.push({src,played:true})).catch(error=>{audioOutcomes.push({src,error:error.name});throw error;});
 };
});
const page=await context.newPage();page.on('pageerror',error=>errors.push(error.message));
async function launch(id){
 await page.goto(base+'?listenproof='+Date.now()+'#practice');await page.locator('.practice-heading').waitFor();
 await page.evaluate(id=>{const b=document.createElement('button');b.dataset.startActivity=id;b.id='synthetic-listen-start';b.textContent='Start synthetic listening';b.style.cssText='position:fixed;left:45%;top:45%;z-index:99999;padding:20px';document.getElementById('app').append(b);},id);
 await page.locator('#synthetic-listen-start').click();await page.locator('.activity-page').waitFor();
}
async function total(){return page.evaluate(()=>audioCalls.length);}
try{
 // Real generated recordings: play() is observed, not mocked, after the start gesture.
 await launch('listen-1b');
 for(let i=0;i<8;i++){
  const st=await page.evaluate(()=>HorizonsApp.getState());
  const player=page.locator('.question-audio audio');await player.waitFor();
  await page.waitForFunction(()=>audioOutcomes.some(x=>x.src===document.querySelector('.question-audio audio')?.src&&x.played));
  assert.equal(await page.locator('.answer-transcript').count(),0);
  await player.evaluate(el=>window.qaQuestionPlayer=el);
  const calls=await total();await page.locator('[data-choice]').first().click();await page.keyboard.press('2');
  assert.equal(await total(),calls);assert.equal(await player.evaluate(el=>el===window.qaQuestionPlayer),true);
  if(st.question.id==='listen-two-jobs'){
   assert.ok((await player.getAttribute('src')).endsWith('listen-two-jobs-voices2.mp3'));
   const duration=await player.evaluate(el=>el.duration);assert.ok(duration>0&&duration<20);
   await page.screenshot({path:path.join(out,'three-voices-desktop.png')});
   await page.locator('[data-action=check-answer]').click();
   assert.ok((await page.locator('.answer-transcript').innerText()).includes("I'm Sarah. I'm a doctor."));
   assert.equal(await player.evaluate(el=>el.paused),true);
   checks.push({case:'three speakers',duration,autoplaySucceeded:true,selectionSilent:true,playerPreserved:true,transcriptAnswerGated:true});break;
  }
  await page.locator('[data-action=check-answer]').click();await page.locator('[data-action=next-question]').click();
  if(i===7)throw Error('Three-speaker question not encountered');
 }
 await launch('listen-1a');const beforeSkip=await total();await page.locator('[data-action=skip-audio]').click();assert.equal(await total(),beforeSkip);assert.equal(await page.locator('.activity-page').getAttribute('data-listening'),'false');checks.push({case:'cannot listen',stopsAndSilentFallback:true});
 // Word/alphabet listening uses the same autoplay lifecycle, including mobile.
 await page.setViewportSize({width:390,height:740});
 await page.goto(base+'?alphabetproof=1#practice');await page.locator('.practice-heading').waitFor();await page.locator('input[value=topic-1a-alphabet]').check();await page.locator('[data-mix=listening]').click();await page.locator('.question-listen').waitFor();
 await page.waitForFunction(()=>audioOutcomes.some(x=>x.played));const alphabet=await total();assert.equal(alphabet,1);
 await page.locator('[data-choice]').first().click();await page.keyboard.press('2');assert.equal(await total(),alphabet);
 await page.locator('.question-listen').click();assert.equal(await total(),alphabet+1);
 await page.screenshot({path:path.join(out,'alphabet-mobile.png')});
 await page.locator('[data-action=check-answer]').click();const beforeNext=await total();await page.locator('[data-action=next-question]').click();assert.equal(await total(),beforeNext+1);
 checks.push({case:'alphabet mobile',autoplay:true,silentChoices:true,replay:true,nextQuestionAutoplay:true});
 // Browser denial must not produce errors or repeated requests on every option render.
 await page.goto(base+'?deniedproof=1#practice');await page.locator('.practice-heading').waitFor();await page.evaluate(()=>window.denyAudio=true);
 await page.locator('input[value=topic-1a-alphabet]').check();await page.locator('[data-mix=listening]').click();await page.locator('.question-listen').waitFor();const denied=await total();assert.equal(denied,1);
 await page.locator('[data-choice]').first().click();assert.equal(await total(),denied);await page.evaluate(()=>window.denyAudio=false);await page.locator('.question-listen').click();await page.waitForFunction(()=>audioOutcomes.some(x=>x.played));assert.equal(await total(),denied+1);
 checks.push({case:'autoplay denied',noRestartLoop:true,manualReplayWorks:true});
 assert.deepEqual(errors,[]);
 fs.writeFileSync(reportFile,JSON.stringify({pass:true,checks,noRealLearnerRecords:true,realMediaPlayback:true,deviceSpeechForbidden:true,errors},null,2)+'\n');console.log(JSON.stringify({pass:true,checks},null,2));
}finally{await browser.close();}
