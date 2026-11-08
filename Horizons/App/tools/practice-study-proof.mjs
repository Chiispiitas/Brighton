import {createRequire} from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url);
const {chromium}=require('C:/Users/David/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const base=process.env.HZ_APP_URL||'http://127.0.0.1:8898/Horizons/App/';
const out=process.env.HZ_MOTION_OUTPUT||'C:/Users/David/Documents/Codex/2026-11-08/practice-study';
const reportFile=process.env.HZ_MOTION_REPORT||new URL('../reports/practice-study.json',import.meta.url);
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




await context.addInitScript(()=>{HTMLMediaElement.prototype.play=function(){return Promise.resolve()};});
const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
try{
 for(const [width,height,theme]of [[1440,900,'light'],[1024,600,'dark'],[390,740,'dark'],[320,640,'light']]){
 await page.setViewportSize({width,height});await page.goto(base+'#practice');await page.locator('[role=tablist]').waitFor();
 await page.evaluate(theme=>{document.documentElement.dataset.theme=theme;},theme);
 assert.equal(await page.locator('[role=tab][aria-selected=true]').innerText(),'Topics');
 await page.locator('input[value=topic-1a-greetings]').check();
 const unit=page.locator('.practice-unit');await unit.locator('summary').click();assert.equal(await unit.getAttribute('open'),null);await unit.locator('summary').click();
 await page.getByRole('tab',{name:'Word bank',exact:true}).click();assert.equal(await page.locator('[role=tabpanel]').getAttribute('aria-labelledby'),'tab-words');assert.equal(await page.locator('.practice-unit').count(),1);
 await page.locator('#word-search').fill('morning');assert.ok(await page.locator('.word-tile').count()>0);await page.getByRole('tab',{name:'Topics',exact:true}).click();assert.equal(await page.locator('input[value=topic-1a-greetings]').isChecked(),true);
 await page.locator('[data-mix=flashcards]').click();await page.locator('.study-card').waitFor();assert.equal(await page.locator('.answer-options,#typed-answer').count(),0);
 const cue=await page.locator('.study-card strong').innerText();await page.locator('.study-card').click();assert.notEqual(await page.locator('.study-card strong').innerText(),cue);
 await page.locator('[data-study=next]').click();assert.ok((await page.locator('.study-page header').innerText()).includes('2 /'));
 await page.screenshot({path:path.join(out,'study-'+width+'.png')});
 const bounds=await page.locator('.study-page').evaluate(el=>({scroll:document.documentElement.scrollWidth,width:innerWidth,bottom:el.getBoundingClientRect().bottom,height:innerHeight}));assert.ok(bounds.scroll<=bounds.width);assert.ok(bounds.bottom<=bounds.height+1);
 await page.locator('[data-study=close]').click();await page.locator('[role=tablist]').waitFor();assert.equal(await page.locator('input[value=topic-1a-greetings]').isChecked(),true);
 await page.waitForTimeout(700);await page.screenshot({path:path.join(out,'topics-'+width+'.png')});const visibleTopics=await page.locator('.practice-unit-content').first().boundingBox();assert.ok(visibleTopics.height>50);assert.ok(await page.locator('[data-mix=flashcards]').isVisible());
 checks.push({width,height,theme,tabs:true,unitCollapse:true,selectionPreserved:true,flashcardFlip:true,studyFits:true});
 }
 assert.equal(apiActions.includes('saveAttempt'),false);assert.deepEqual(errors,[]);fs.writeFileSync(reportFile,JSON.stringify({pass:true,checks,noProgressWrites:true,noRealLearnerRecords:true,errors},null,2)+'\n');console.log(JSON.stringify({pass:true,checks},null,2));
}catch(e){await page.screenshot({path:path.join(out,'failure.png')});throw e;}finally{await browser.close();}
