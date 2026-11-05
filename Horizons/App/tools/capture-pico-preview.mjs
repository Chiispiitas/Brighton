import {createRequire} from 'node:module';import fs from 'node:fs';import path from 'node:path';
const require=createRequire(import.meta.url),{chromium}=require('C:/Users/David/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const out=process.env.HZ_PREVIEW_OUTPUT||'C:/Users/David/Documents/Codex/2026-11-05/pico-banner-animation/preview';fs.mkdirSync(out,{recursive:true});
const base=process.env.HZ_PREVIEW_BASE||'http://127.0.0.1:8898/Horizons/App/';
const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
const context=await browser.newContext({viewport:{width:400,height:650},recordVideo:{dir:out,size:{width:400,height:650}},serviceWorkers:'block'});
const page=await context.newPage();await page.route('**/pico-preview',r=>r.fulfill({contentType:'text/html',body:`<!doctype html><link rel="stylesheet" href="./styles/app.css"><style>body{background:#ad195a;width:400px;height:650px;overflow:hidden}.hero-pico{position:absolute!important;left:76px!important;right:auto!important;bottom:34px!important;width:248px!important;height:582px!important}</style><section class="learn-hero" style="width:400px;height:650px;border-radius:0;padding:0"><span class="character hero-pico" data-character="pico"><img class="character-art" src="./assets/art/pico-banner-motion-v1/baseline-native.png"></span></section><script type="module">import{mountBannerPico}from'./src/pico-banner-motion.js?v=pico6';window.rig=mountBannerPico(document.querySelector('.hero-pico'));await rig.ready;window.ready=true;</script>`}));
await page.goto(base+'pico-preview');await page.waitForFunction(()=>window.ready);
for(const time of [0,2351,2352,2400,2496,9300,11000,12500,14000]){
 await page.evaluate(time=>{for(const a of rig.animations){a.pause();a.currentTime=time;}},time);
 await page.evaluate(()=>new Promise(requestAnimationFrame));
 await page.locator('.hero-pico').screenshot({path:path.join(out,'state-'+time+'.png')});
}
await page.evaluate(()=>{for(const a of rig.animations){a.currentTime=0;a.play();}});await page.waitForTimeout(14500);
const video=page.video();await context.close();const file=await video.path();fs.copyFileSync(file,path.join(out,'pico-reading.webm'));await browser.close();console.log(path.join(out,'pico-reading.webm'));
