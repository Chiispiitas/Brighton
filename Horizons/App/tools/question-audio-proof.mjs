import {createRequire} from 'node:module';
import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
const require=createRequire(import.meta.url);
const {chromium}=require('C:/Users/David/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const base=process.env.HZ_APP_URL||'http://127.0.0.1:8898/Horizons/App/';
const out=process.env.HZ_MOTION_OUTPUT||'C:/Users/David/Documents/Codex/2026-11-06/tile-scroll';
const reportFile=process.env.HZ_MOTION_REPORT||new URL('../reports/question-audio-tiles.json',import.meta.url);
fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
const context=await browser.newContext({viewport:{width:1440,height:1000},serviceWorkers:'block'});
// Entirely synthetic UI fixture: no learner redemption, saves or real API traffic.
const rows=new Map(),store={async get(c,id){return structuredClone(rows.get(c+':'+id)||null)},async create(c,id,v,scope){if(rows.has(c+':'+id))throw Error('exists');rows.set(c+':'+id,{...structuredClone(v),_scope:scope});return v},async put(c,id,v,scope){rows.set(c+':'+id,{...structuredClone(v),_scope:scope});return v},async list(c,scope){return [...rows.entries()].filter(([k,v])=>k.startsWith(c+':')&&v._scope===scope).map(([,v])=>{const x=structuredClone(v);delete x._scope;return x})}};
const {createApplication,COLLECTIONS,idFor}=await import('../backend/src/server/application.mjs');
const {pathNodes}=await import('../content/unit1.mjs');const {getActivityQuestions,buildQuiz}=await import('../content/engine.mjs');
const api=createApplication(store),code='QA-ISLAND-FICTIONAL-001';await store.create(COLLECTIONS.codes,await idFor('code:'+code),{bookId:'horizons-a1',kind:'example'},'issued');
async function call(action,data={},token=''){const response=await api.handle(new Request('https://test/api/horizons',{method:'POST',headers:{'Content-Type':'application/json',...token?{'X-Requested-With':token}:{}},body:JSON.stringify({action,...data})}));return {status:response.status,...await response.json()};}
const sent=[],session=await call('redeem',{code}),apiActions=[],errors=[],checks=[];
await context.route('**/api/horizons',async route=>{const data=route.request().postDataJSON();apiActions.push(data.action);if(data.action==='saveAttempt')sent.push(data.attempt);const result=await call(data.action,data,session.token);if(result.progress)result.progress.completedActivities=pathNodes.map(n=>n.id);await route.fulfill({status:result.status,contentType:'application/json',body:JSON.stringify(result)});});
await context.addCookies([{url:base,name:'hz_companion_session',value:session.token}]);


await context.addInitScript(()=>{window.spokenSelections=[];speechSynthesis.speak=u=>window.spokenSelections.push(u.text);});const page=await context.newPage();page.on('pageerror',error=>errors.push(error.message));await page.emulateMedia({reducedMotion:'no-preference'});
const map=()=>page.locator('.overworld-map'),nodeButton=id=>page.locator('.learning-path [data-path-node="'+id+'"]');
async function assertUncroppedTiles(){const bounds=await page.locator('.sentence-builder button:visible').evaluateAll(els=>els.map(el=>{const r=el.getBoundingClientRect(),b=el.closest('.question-body').getBoundingClientRect(),dock=document.querySelector('.answer-dock').getBoundingClientRect();return {text:el.textContent,top:r.top,bottom:r.bottom,left:r.left,right:r.right,bodyTop:b.top,bodyBottom:b.bottom,bodyLeft:b.left,bodyRight:b.right,dockTop:dock.top};}));for(const b of bounds)assert.ok(b.top>=b.bodyTop-1&&b.bottom<=b.bodyBottom+1&&b.bottom<=b.dockTop&&b.left>=b.bodyLeft-1&&b.right<=b.bodyRight+1,JSON.stringify(b));}

let round=0;
async function launchOrder(width,height){
 await page.setViewportSize({width,height});let seed=1;
 while(!buildQuiz({mode:'grammar',grammarSetIds:['1a-be'],count:8,seed}).some(q=>q.tokens?.length))seed++;
 await page.addInitScript(seed=>{Date.now=()=>seed;},seed);
 await page.goto(base+'?tileproof='+ ++round+'#practice');await page.locator('.practice-heading').waitFor();await page.locator('input[value=topic-1a-be]').check();await page.locator('[data-mix=recall]').click();
 for(let i=0;i<12;i++){
  const st=await page.evaluate(()=>HorizonsApp.getState());if(st.question.type==='order')return;
  const q=buildQuiz({...st.options,activityId:undefined}).find(q=>q.id===st.question.id);
  if(q.type==='choice')await page.locator('[data-choice='+JSON.stringify(q.answer)+']').click();else await page.locator('#typed-answer').fill(q.correctText??q.answer);
  await page.locator('[data-action=check-answer]').click();await page.locator('[data-action=next-question]').click();
 }throw Error('No order question');
}
async function snapshot(){return page.evaluate(()=>{const content=document.querySelector('.question-content'),box=document.querySelector('.sentence-builder').getBoundingClientRect(),answer=document.querySelector('.sentence-answer').getBoundingClientRect();window.qaTileContent??=content;window.qaTileCharacter??=document.querySelector('.question-character');return{scroll:content.scrollTop,sameContent:window.qaTileContent===content,sameCharacter:window.qaTileCharacter===document.querySelector('.question-character'),builderTop:box.top,builderHeight:box.height,answerHeight:answer.height,pageHeight:document.documentElement.scrollHeight,height:innerHeight};});}
async function drag(tile,target,touch){
 const a=await tile.boundingBox(),b=await target.boundingBox();const x=a.x+a.width/2,y=a.y+a.height/2,tx=b.x+b.width/2,ty=b.y+b.height/2;
 if(touch){const c=await context.newCDPSession(page);await c.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});for(let i=1;i<=8;i++)await c.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x+(tx-x)*i/8,y:y+(ty-y)*i/8}]});await c.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await c.detach();}
 else{await page.mouse.move(x,y);await page.mouse.down();await page.mouse.move(tx,ty,{steps:8});await page.mouse.up();}
 await page.waitForTimeout(270);
}
try{
 for(const [width,height] of [[1440,900],[1024,600],[390,740],[320,640]]){
  await launchOrder(width,height);await page.waitForTimeout(400);
  // Give the real scroll panel a nonzero position; tile edits must preserve this exact node and offset.
  await page.locator('.question-content').evaluate(el=>{const p=document.createElement('p');p.textContent='Synthetic long prompt. '.repeat(40);el.prepend(p);el.scrollTop=50;});
  const before=await snapshot();assert.ok(before.scroll>0);
  const bank=page.locator('.sentence-tokens button');
  await drag(bank.first(),page.locator('.sentence-answer'),width<760);assert.equal(await page.locator('[data-remove-token]').count(),1);
  const after=await snapshot();assert.equal(after.sameContent,true);assert.equal(after.sameCharacter,true);assert.equal(after.scroll,before.scroll);assert.equal(after.builderTop,before.builderTop);assert.equal(after.builderHeight,before.builderHeight);assert.equal(after.answerHeight,before.answerHeight);
  await drag(page.locator('[data-remove-token]').first(),page.locator('.sentence-tokens'),false);assert.equal(await page.locator('[data-remove-token]').count(),0);assert.equal((await snapshot()).scroll,before.scroll);
  await bank.first().click();assert.equal((await snapshot()).scroll,before.scroll);await page.locator('[data-action=clear-sentence]').click();assert.equal((await snapshot()).scroll,before.scroll);
  // Check both outcomes using the same production question and real tiles.
  await bank.first().click();await page.locator('[data-action=check-answer]').click();assert.equal(await page.locator('.activity-page').getAttribute('data-answer-state'),'incorrect');
  const animationCount=await page.locator('.sentence-builder button[data-token]:visible,.sentence-builder button[data-remove-token]:visible').evaluateAll(els=>els.filter(el=>el.getAnimations().some(a=>a.effect.getKeyframes().some(f=>String(f.transform).includes('rotateX')))).length);
  assert.equal(animationCount,await page.locator('.sentence-builder [data-token]:visible,.sentence-builder [data-remove-token]:visible').count());await page.waitForTimeout(650);assert.equal(await page.locator('.sentence-tokens').isVisible(),false);
  for(const color of await page.locator('.sentence-builder [data-token]:visible,.sentence-builder [data-remove-token]:visible').evaluateAll(els=>els.map(el=>getComputedStyle(el).backgroundColor)))assert.equal(color,'rgb(249, 229, 223)');
  await assertUncroppedTiles();await page.screenshot({path:path.join(out,'wrong-'+width+'.png')});
  checks.push({width,height,scrollPreserved:after.scroll,stableBuilder:true,characterNodePreserved:true,flipCount:animationCount,softRed:true});
  await launchOrder(width,height);const st=await page.evaluate(()=>HorizonsApp.getState()),q=buildQuiz({...st.options,activityId:undefined}).find(q=>q.id===st.question.id);
  for(const word of String(q.answer).split(/\s+/)){
   const tile=page.locator('.sentence-tokens button:not(:disabled)').filter({hasText:new RegExp('^'+word.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'$')}).first();await tile.click();
  }
  await page.locator('[data-action=check-answer]').click();assert.equal(await page.locator('.activity-page').getAttribute('data-answer-state'),'correct');await page.waitForTimeout(650);assert.equal(await page.locator('.sentence-tokens').isVisible(),false);
  for(const color of await page.locator('.sentence-builder [data-token]:visible,.sentence-builder [data-remove-token]:visible').evaluateAll(els=>els.map(el=>getComputedStyle(el).backgroundColor)))assert.equal(color,'rgb(228, 242, 232)');
  await assertUncroppedTiles();await page.screenshot({path:path.join(out,'correct-'+width+'.png')});checks.at(-1).softGreen=true;
 }
 // A listening option must speak on every click, while the transcript stays hidden until grading.
 await page.goto(base+'?audioproof=1#practice');await page.locator('.practice-heading').waitFor();
 await page.evaluate(()=>{const b=document.createElement('button');b.dataset.startActivity='listen-1a';b.id='synthetic-listen-start';document.getElementById('app').append(b);});
 await page.locator('#synthetic-listen-start').click();await page.locator('.question-audio audio').waitFor();
 while(!(await page.locator('[data-choice]').count())){await page.locator('#typed-answer').fill('000');await page.locator('[data-action=check-answer]').click();await page.locator('[data-action=next-question]').click();}
 assert.equal(await page.locator('.answer-transcript').count(),0);
 const n=await page.evaluate(()=>spokenSelections.length);await page.locator('[data-choice]').first().click();await page.locator('[data-choice]').first().click();assert.equal(await page.evaluate(()=>spokenSelections.length),n+2);
 await page.locator('[data-action=check-answer]').click();assert.ok((await page.locator('.answer-transcript').innerText()).length>15);
 assert.ok((await page.locator('.question-audio audio').getAttribute('src')).includes('platform-listening-v1'));
 await page.emulateMedia({reducedMotion:'reduce'});await launchOrder(390,740);await page.locator('.sentence-tokens button').first().click();await page.locator('[data-action=check-answer]').click();
 assert.equal(await page.locator('.sentence-builder').evaluate(el=>el.getAnimations({subtree:true}).some(a=>a.effect.getKeyframes().some(f=>String(f.transform).includes('rotateX')))),false);
 assert.ok(await page.evaluate(()=>spokenSelections.length)>0);assert.deepEqual(errors,[]);fs.writeFileSync(reportFile,JSON.stringify({pass:true,checks,reducedMotionNoFlip:true,noRealLearnerRecords:true,errors},null,2)+'\n');console.log('PASS tile drag/tap/return/reset preserve scroll and artwork; all tiles flip red/green; reduced motion respected.');
}catch(error){await page.screenshot({path:path.join(out,'failure.png')});throw error;}finally{await browser.close();}
