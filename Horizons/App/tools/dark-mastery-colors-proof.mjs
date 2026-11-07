import {createRequire} from 'node:module';
import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
const require=createRequire(import.meta.url);
const {chromium}=require('C:/Users/David/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const base=process.env.HZ_APP_URL||'http://127.0.0.1:8898/Horizons/App/';
const out=process.env.HZ_MOTION_OUTPUT||'C:/Users/David/Documents/Codex/2026-11-07/social-profile';
const reportFile=process.env.HZ_MOTION_REPORT||new URL('../reports/dark-mastery-colors.json',import.meta.url);
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

store.scan=async(c,offset,limit)=>[...rows].filter(([key])=>key.startsWith(c+':')).map(([key,v])=>({id:key.slice(c.length+1),...structuredClone(v)})).slice(offset,offset+limit);
await store.create(COLLECTIONS.codes,'synthetic-rival-code',{kind:'individual',bookId:'horizons-a1'},'issued');await store.create(COLLECTIONS.claims,'synthetic-rival-code',{codeId:'synthetic-rival-code',profileId:'synthetic-rival',bookId:'horizons-a1',expiresAt:'2027-11-01T00:00:00.000Z'},'synthetic-rival');
await context.addInitScript(()=>{window.inviteCopies=[];Object.defineProperty(navigator,'share',{configurable:true,value:undefined});Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async text=>{inviteCopies.push(text);}}});});
const {createSocial}=await import('../backend/src/server/social.mjs'),{aggregateProgress}=await import('../backend/src/server/application.mjs');const social=createSocial(store,{now:()=>clock,idFor,collections:COLLECTIONS,aggregateProgress});const peerId=await idFor('league-public:synthetic-rival'),ownId=await idFor('league-public:'+session.profile.id);
try{
 await context.addInitScript(()=>localStorage.setItem('hz-theme','dark'));await page.goto(base+'#learn');const island=page.locator('.path-stop:not(.locked)').first();await island.waitFor();await island.evaluate(el=>el.classList.add('mastered'));await island.hover();await page.waitForTimeout(350);assert.equal(await island.locator('.stop-orb').evaluate(el=>getComputedStyle(el).backgroundColor),'rgb(255, 217, 108)');await page.mouse.move(1,1);await page.waitForTimeout(350);assert.equal(await island.locator('.stop-orb').evaluate(el=>getComputedStyle(el).backgroundColor),'rgb(255, 210, 74)');await island.click();await page.locator('.path-bubble').waitFor();const colors=await page.locator('.path-bubble').evaluate(el=>({body:getComputedStyle(el).backgroundColor,tip:getComputedStyle(el,'::before').backgroundColor}));assert.equal(colors.body,colors.tip);await page.screenshot({path:path.join(out,'dark-mastery-colors.png')});fs.writeFileSync(reportFile,JSON.stringify({pass:true,syntheticOnly:true,masteredGold:true,hoverGold:true,bubblePointerMatches:true,colors},null,2));console.log('PASS dark mastery gold and matching bubble pointer');
}finally{await browser.close()}
