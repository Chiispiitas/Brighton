import {createRequire} from 'node:module';
import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
const require=createRequire(import.meta.url);
const {chromium}=require('C:/Users/David/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const base=process.env.HZ_APP_URL||'http://127.0.0.1:8898/Horizons/App/';
const out=process.env.HZ_MOTION_OUTPUT||'C:/Users/David/Documents/Codex/2026-11-06/practice-art';
const reportFile=process.env.HZ_MOTION_REPORT||new URL('../reports/practice-art.json',import.meta.url);
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



const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));await page.emulateMedia({reducedMotion:'no-preference'});
try{
 await page.goto(base+'#practice');await page.locator('.practice-heading').waitFor();await page.waitForFunction(()=>document.querySelector('.practice-heading [data-character=alex]')?.dataset.alexMotion==='ready');
 for(const [width,height] of [[1920,1080],[1440,900],[1366,768],[1280,640],[1024,540],[800,540],[390,740],[320,640]]){
  await page.setViewportSize({width,height});await page.waitForTimeout(100);
  const sizes=await page.evaluate(()=>{const rect=s=>{const r=document.querySelector(s).getBoundingClientRect();return{x:r.x,y:r.y,w:r.width,h:r.height,bottom:r.bottom,right:r.right}};return{heading:rect('.practice-heading'),title:rect('.practice-heading h1'),art:rect('.practice-heading .alex-motion-stage'),toolbar:rect('.practice-toolbar'),topics:rect('.practice-topics'),mix:rect('.mix-launch'),pageHeight:document.documentElement.scrollHeight}});
  assert.ok(sizes.art.h>=(width>760?(height>650?170:120):135),JSON.stringify({width,height,sizes}));assert.ok(sizes.art.x>=sizes.title.right,JSON.stringify({width,height,sizes}));assert.ok(sizes.art.bottom<=sizes.toolbar.y+1,JSON.stringify({width,height,sizes}));
  if(width>760){assert.ok(sizes.pageHeight<=height+1);assert.ok(sizes.mix.bottom<=height);assert.ok(sizes.topics.h>=48,JSON.stringify({width,height,sizes}));}
  checks.push({width,height,...sizes});await page.screenshot({path:path.join(out,`practice-${width}x${height}.png`)});
 }
 assert.deepEqual(errors,[]);fs.writeFileSync(reportFile,JSON.stringify({pass:true,checks,scope:'Actual animated Alex in Practice header, synthetic in-memory session; no learner records or backend writes.',errors},null,2)+'\n');console.log('PASS larger Practice art, clear title/toolbar and desktop screen fit at eight sizes');
}finally{await browser.close();}