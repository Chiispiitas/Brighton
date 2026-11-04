import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
const require=createRequire(import.meta.url),{chromium}=require('C:/Users/David/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const app=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),base=process.env.HZ_APP_URL||'http://127.0.0.1:8914/Horizons/App/',out=process.env.HZ_AVATAR_FLAT_ACCESSORY_PROOF||'C:/Users/David/Documents/Codex/2026-11-04/flat-avatar-accessories';
fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true}),page=await browser.newPage({viewport:{width:1740,height:1500}}),errors=[];
page.on('pageerror',error=>errors.push(error.message));
await page.route('**/avatar-flat-accessory-proof',route=>route.fulfill({contentType:'text/html',body:`<!doctype html><meta charset="utf-8"><style>body{margin:0;padding:20px;font:14px system-ui;background:white;color:#173e5c}#grid{display:grid;grid-template-columns:repeat(6,260px);gap:18px}.slot{width:260px;height:260px;background:#fff1da;border-radius:18px}.label{text-align:center;margin:8px 0 0}</style><div id="grid"></div><script type="module">import{mountAvatar}from'./src/avatar-rig.js';const manifest=await fetch('./assets/art/manifest.json').then(r=>r.json());window.controllers=[];for(const posture of['portrait','wave','think'])for(let i=1;i<=6;i++){const item=document.createElement('div');item.innerHTML='<div class="slot"></div><p class="label">'+posture+' · skin/outfit/hair/accessory '+i+'</p>';document.getElementById('grid').append(item);window.controllers.push(mountAvatar(item.firstChild,{manifest,avatar:{skin:'skin-'+i,outfit:'outfit-'+i,hair:'hair-'+i,accessory:'accessory-'+i,badge:'none'},posture}));}for(const posture of['portrait','wave','think']){const item=document.createElement('div');item.innerHTML='<div class="slot"></div><p class="label">'+posture+' · bald control</p>';document.getElementById('grid').append(item);window.controllers.push(mountAvatar(item.firstChild,{manifest,avatar:{skin:'skin-6',outfit:'outfit-2',hair:'none',accessory:'none',badge:'none'},posture}));}</script>`}));
await page.goto(new URL('avatar-flat-accessory-proof',base).href);await page.waitForFunction(()=>document.querySelectorAll('[data-avatar-bust][data-ready]').length===21);await page.evaluate(async()=>{await Promise.all([...document.images].map(image=>image.decode()));for(const animation of document.getAnimations()){animation.pause();animation.currentTime=1000;}});
const frames=[];
for(const mood of ['wave','celebrate']){
 await page.evaluate(mood=>{for(const controller of window.controllers){controller.setMood(mood);controller.actions.forEach(action=>action.pause());}},mood);
 for(const milliseconds of [0,80,160,288,480,640,960,1248,1600,1920,2112,2280]){
  await page.evaluate(time=>{for(const controller of window.controllers)for(const action of controller.actions)action.currentTime=time;},milliseconds);await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
  const proof=path.join(out,`${mood}-${milliseconds}.png`);await page.screenshot({path:proof,fullPage:true});frames.push({mood,milliseconds,proof,sha256:createHash('sha256').update(fs.readFileSync(proof)).digest('hex')});
 }
 await page.evaluate(async()=>{const actions=window.controllers.flatMap(controller=>controller.actions);actions.forEach(action=>action.finish());await Promise.allSettled(actions.map(action=>action.finished));await new Promise(resolve=>requestAnimationFrame(resolve));for(const animation of document.getAnimations()){animation.pause();animation.currentTime=1000;}});
}
await browser.close();
const report={date:new Date().toISOString(),scope:'21 flat avatar accessory/bald configurations, 12 painted phases for each actual greeting/celebration track; visual verdicts must be explicit.',sourceSHA256:createHash('sha256').update(fs.readFileSync(path.join(app,'src/avatar-rig.js'))).digest('hex'),frames,paintedViews:frames.length*21,errors,automatedPass:errors.length===0,visualReview:'pending'};
fs.writeFileSync(process.env.HZ_AVATAR_ACCESSORY_REPORT||path.join(app,'reports/avatar-approved-flat-accessory-proof.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({frames:frames.length,paintedViews:report.paintedViews,errors,out}));
