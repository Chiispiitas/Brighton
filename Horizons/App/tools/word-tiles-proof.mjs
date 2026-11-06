import {createRequire} from 'node:module';
import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
const require=createRequire(import.meta.url);
const {chromium}=require('C:/Users/David/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const base=process.env.HZ_APP_URL||'http://127.0.0.1:8898/Horizons/App/';
const out=process.env.HZ_MOTION_OUTPUT||'C:/Users/David/Documents/Codex/2026-11-05/word-tiles';
const reportFile=process.env.HZ_MOTION_REPORT||new URL('../reports/word-tiles.json',import.meta.url);
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
await context.route('**/api/horizons',async route=>{const data=route.request().postDataJSON();apiActions.push(data.action);if(data.action==='saveAttempt')sent.push(data.attempt);const result=await call(data.action,data,session.token);await route.fulfill({status:result.status,contentType:'application/json',body:JSON.stringify(result)});});
await context.addCookies([{url:base,name:'hz_companion_session',value:session.token}]);


const page=await context.newPage();page.on('pageerror',error=>errors.push(error.message));await page.emulateMedia({reducedMotion:'reduce'});
const map=()=>page.locator('.overworld-map'),nodeButton=id=>page.locator('.learning-path [data-path-node="'+id+'"]');
try{
 let seed=1;while(buildQuiz({mode:'grammar',grammarSetIds:['1a-be'],count:8,seed}).filter(q=>q.tokens?.length).length<2)seed++;await page.addInitScript(seed=>{Date.now=()=>seed;},seed);
 await page.goto(base);await page.locator('.app-shell').waitFor();await page.locator('.desktop-nav [data-route=practice]').click();await page.locator('input[value=topic-1a-be]').check();await page.locator('[data-mix=recall]').click();
 let ordered=0,answered=0;
 async function drag(tile,target,touch=false){const a=await tile.boundingBox(),b=await target.boundingBox();const x=a.x+a.width/2,y=a.y+a.height/2,tx=b.x+b.width/2,ty=b.y+b.height/2;if(touch){const c=await context.newCDPSession(page);await c.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});for(let i=1;i<=8;i++)await c.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x+(tx-x)*i/8,y:y+(ty-y)*i/8}]});await c.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await c.detach();}else{await page.mouse.move(x,y);await page.mouse.down();await page.mouse.move(tx,ty,{steps:8});await page.mouse.up();}}
 while(await page.locator('.activity-page:not(.result-page)').count()){
  const st=await page.evaluate(()=>HorizonsApp.getState()),q=buildQuiz({...st.options,activityId:undefined}).find(q=>q.id===st.question.id);assert.ok(q);
  if(st.question.type==='order'){
   ordered++;assert.equal(q.type,'text');assert.equal(await page.locator('#typed-answer').count(),0);assert.ok(!(await page.locator('.question-body h1').textContent()).includes('Type'));
   for(const width of [320,390,430,1440]){await page.setViewportSize({width,height:width===1440?900:640});assert.ok(await page.locator('[data-action=check-answer]').evaluate(el=>el.getBoundingClientRect().bottom<=innerHeight),'Check visible');assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.screenshot({path:path.join(out,'tiles-'+ordered+'-'+width+'.png')});}
   await page.setViewportSize({width:390,height:640});const bank=page.locator('.sentence-tokens button');assert.equal(await bank.first().evaluate(el=>getComputedStyle(el).backgroundColor),'rgb(233, 230, 223)');
   await drag(bank.first(),page.locator('.sentence-answer'),true);assert.equal(await page.locator('[data-remove-token]').count(),1);
   await drag(page.locator('[data-remove-token]').first(),page.locator('.sentence-tokens'));assert.equal(await page.locator('[data-remove-token]').count(),0);
   await bank.first().focus();await page.keyboard.press('Enter');assert.equal(await page.locator('[data-remove-token]').count(),1);await page.locator('.sentence-tokens button:not(:disabled)').first().click();const before=await page.locator('[data-remove-token]').allTextContents();await drag(page.locator('[data-remove-token]').first(),page.locator('[data-remove-token]').nth(1));assert.deepEqual(await page.locator('[data-remove-token]').allTextContents(),before.reverse());await page.locator('[data-action=clear-sentence]').click();
   const words=String(q.answer).split(/\s+/);for(const word of words){const tile=bank.filter({hasText:new RegExp('^'+word.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'$')}).filter({visible:true});const exact=page.locator('.sentence-tokens button:not(:disabled)').filter({hasText:new RegExp('^'+word.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'$')}).first();await drag(exact,page.locator('.sentence-answer'));}
   assert.deepEqual(await page.locator('[data-remove-token]').allTextContents(),words);
  }else if(q.type==='choice')await page.locator('[data-choice='+JSON.stringify(q.answer)+']').click();else await page.locator('#typed-answer').fill(String(q.correctText??q.answer));
  await page.locator('[data-action=check-answer]').click();assert.equal(await page.locator('.activity-page').getAttribute('data-answer-state'),'correct');if(st.question.type==='order'){for(const width of [320,390]){await page.setViewportSize({width,height:640});assert.ok(await page.locator('[data-action=next-question]').evaluate(el=>el.getBoundingClientRect().bottom<=innerHeight),'Continue visible');await page.screenshot({path:path.join(out,'checked-'+ordered+'-'+width+'.png')});}}
  await page.locator('[data-action=next-question]').click();answered++;
 }
 await page.locator('.result-page[data-saved=true]').waitFor();assert.ok(ordered>=2);assert.deepEqual(errors,[]);const attempts=[...rows.values()].filter(x=>Array.isArray(x.answers));assert.ok(attempts.length);assert.ok(attempts.every(a=>a.answers.every(answer=>answer.correct)));assert.ok(sent.length);for(const a of sent)for(const answer of a.answers)assert.equal(typeof answer.submitted,'string');
 fs.writeFileSync(reportFile,JSON.stringify({pass:true,ordered,answered,mouseAndTouchDrag:true,returnToBank:true,keyboard:true,neutralTiles:true,mobileLayouts:[320,390,430],desktopLayout:1440,serverSave:true,stableIdsAndTextContract:true,errors},null,2)+'\n');console.log('PASS draggable neutral word tiles, mobile layout, keyboard, and server save');
}finally{await browser.close();}
