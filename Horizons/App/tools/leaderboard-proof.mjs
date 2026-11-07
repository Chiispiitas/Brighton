import {createRequire} from 'node:module';
import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
const require=createRequire(import.meta.url);
const {chromium}=require('C:/Users/David/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const base=process.env.HZ_APP_URL||'http://127.0.0.1:8898/Horizons/App/';
const out=process.env.HZ_MOTION_OUTPUT||'C:/Users/David/Documents/Codex/2026-11-06/leaderboard';
const reportFile=process.env.HZ_MOTION_REPORT||new URL('../reports/leaderboard.json',import.meta.url);
fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
const context=await browser.newContext({viewport:{width:1440,height:1000},serviceWorkers:'block'});
// Entirely synthetic UI fixture: no learner redemption, saves or real API traffic.
const rows=new Map(),store={async get(c,id){return structuredClone(rows.get(c+':'+id)||null)},async create(c,id,v,scope){if(rows.has(c+':'+id))throw Error('exists');rows.set(c+':'+id,{...structuredClone(v),_scope:scope});return v},async put(c,id,v,scope){rows.set(c+':'+id,{...structuredClone(v),_scope:scope});return v},async list(c,scope){return [...rows.entries()].filter(([k,v])=>k.startsWith(c+':')&&v._scope===scope).map(([,v])=>{const x=structuredClone(v);delete x._scope;return x})}};
const {createApplication,COLLECTIONS,idFor}=await import('../backend/src/server/application.mjs');
const {pathNodes}=await import('../content/unit1.mjs');const {getActivityQuestions}=await import('../content/engine.mjs');
let clock='2026-11-06T18:00:00.000Z';const api=createApplication(store,{now:()=>clock}),code='QA-ISLAND-FICTIONAL-001';await store.create(COLLECTIONS.codes,await idFor('code:'+code),{bookId:'horizons-a1',kind:'example'},'issued');
async function call(action,data={},token=''){const response=await api.handle(new Request('https://test/api/horizons',{method:'POST',headers:{'Content-Type':'application/json',...token?{'X-Requested-With':token}:{}},body:JSON.stringify({action,...data})}));return {status:response.status,...await response.json()};}
const session=await call('redeem',{code}),apiActions=[],errors=[],checks=[];
await context.route('**/api/horizons',async route=>{const data=route.request().postDataJSON();apiActions.push(data.action);const result=await call(data.action,data,session.token);await route.fulfill({status:result.status,contentType:'application/json',body:JSON.stringify(result)});});
await context.addCookies([{url:base,name:'hz_companion_session',value:session.token}]);



const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));await page.emulateMedia({reducedMotion:'no-preference'});

await store.create(COLLECTIONS.profiles,'synthetic-rival',{id:'synthetic-rival',displayName:'Test Explorer',avatar:{skin:'skin-3',hair:'hair-7',outfit:'outfit-4'}},'synthetic-rival');
const {createLeaderboard}=await import('../backend/src/server/leaderboard.mjs');await createLeaderboard(store,{now:()=>clock,idFor,collections:COLLECTIONS}).get('synthetic-rival');
await store.create(COLLECTIONS.attempts,'synthetic-xp',{createdAt:clock,xp:5000,answers:[],bookId:'horizons-a1',lessonId:'1A',activityId:'topic-1a-greetings'},session.profile.id);
try{
 await page.goto(base+'#leaderboard');await page.locator('.board-row').first().waitFor();assert.equal(await page.locator('.board-row').count(),20);assert.equal(await page.locator('.board-self').count(),1);assert.equal(await page.locator('.board-name').filter({hasText:'Practice bot'}).count(),0);assert.equal(await page.locator('.board-name').filter({hasText:'Test Explorer'}).count(),1);
 for(const [width,height]of [[1440,900],[1024,600],[390,844],[320,640]]){await page.setViewportSize({width,height});await page.waitForTimeout(350);await page.waitForFunction(()=>[...document.querySelectorAll('.board-avatar img')].every(i=>i.complete&&i.naturalWidth>0));const geometry=await page.evaluate(()=>({page:document.documentElement.scrollHeight,viewport:innerHeight,list:document.querySelector('.board-list').getBoundingClientRect().toJSON(),overflow:document.documentElement.scrollWidth>innerWidth}));assert.equal(geometry.overflow,false);if(width>760)assert.ok(geometry.page<=height+1,JSON.stringify(geometry));assert.ok(geometry.list.height>=120);await page.locator('.rank-guide summary').click();if(width>760)assert.ok(await page.evaluate(()=>document.documentElement.scrollHeight<=innerHeight+1));await page.locator('.rank-guide summary').click();checks.push({width,height,...geometry});await page.screenshot({path:path.join(out,'board-'+width+'.png')});}
 const previous=await page.locator('.board-self .board-position').innerText();assert.equal(previous,'1');
 clock='2026-11-09T00:00:00.000Z';await page.locator('[data-action=refresh-board]').click();await page.locator('.rank-reveal').waitFor();assert.ok((await page.locator('.rank-reveal').innerText()).includes('Stone'));await page.screenshot({path:path.join(out,'promotion.png')});await page.locator('[data-action=dismiss-rank]').click();assert.equal(await page.locator('.rank-reveal').count(),0);await page.locator('[data-action=refresh-board]').click();await page.waitForTimeout(300);assert.equal(await page.locator('.rank-reveal').count(),0);assert.equal(await page.locator('.board-personal h2').innerText(),'Stone');
 await page.emulateMedia({reducedMotion:'reduce'});await page.reload();await page.locator('.board-row').first().waitFor();assert.equal(await page.locator('.rank-emblem').evaluate(el=>el.getAnimations().length),0);assert.deepEqual(errors,[]);
 fs.writeFileSync(reportFile,JSON.stringify({pass:true,checks,syntheticOnly:true,twentyPlaces:true,humanPriority:true,promotionOnce:true,reducedMotion:true,errors},null,2)+'\n');console.log('PASS actual leaderboard, generated art, avatars, four sizes, promotion-once and reduced motion');
}finally{await browser.close();}
