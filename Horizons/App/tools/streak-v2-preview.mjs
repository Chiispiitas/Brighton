// Fresh-page, marker-aligned actual-renderer preview; no long-test video drift.
import {createRequire} from 'node:module';
import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url),{chromium}=require('C:/Users/David/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=path.resolve(new URL('..',import.meta.url).pathname.replace(/^\/([A-Za-z]:)/,'$1'));
const out='C:/Users/David/Documents/Codex/2026-11-06/streak-v2-review',base='http://127.0.0.1:8898/Horizons/App/';
const manifest=JSON.parse(fs.readFileSync(path.join(root,'assets/art/streak-campfire-v2/rigs.json'),'utf8'));
const files=['src/streak-celebration.js','styles/streak-celebration.css','assets/art/streak-campfire-v2/rigs.json',...new Set(Object.values(manifest.parts).map(p=>p.file))];
const binding=()=>files.map(file=>({file,sha256:crypto.createHash('sha256').update(fs.readFileSync(path.join(root,file))).digest('hex')})),before=binding();
const event={dayKey:'2026-11-06',completedAt:'2026-11-06T14:18:00Z',timeZone:'America/Guayaquil',streak:3,activeDays:['2026-11-04','2026-11-05','2026-11-06'],localHour:9,minutesUntilMidnight:882};
const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true}),context=await browser.newContext({viewport:{width:1440,height:900},serviceWorkers:'block',recordVideo:{dir:path.join(out,'preview-video'),size:{width:1440,height:900}}}),page=await context.newPage();
let playback;
try{
 await page.goto(base);await page.locator('.welcome').waitFor();
 await page.evaluate(async event=>{
  Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});
  const module=await import('./src/streak-celebration.js?v=streak3');
  const host=document.createElement('div');host.id='final-streak-preview';host.style.cssText='position:fixed;inset:0;z-index:99999;background:var(--paper)';host.innerHTML=module.streakCelebrationMarkup(event);document.body.append(host);
  window.previewController=module.mountStreakCelebration(host.firstElementChild);await previewController.ready;
  if(host.firstElementChild.dataset.streakMotion!=='ready')throw Error('Final native rig did not mount');
  const marker=document.createElement('div');marker.id='preview-marker';marker.style.cssText='position:fixed;inset:0;background:rgb(0,255,0);z-index:999999';document.body.append(marker);
 },event);
 await page.waitForTimeout(500);
 await page.evaluate(()=>{
  const main=document.querySelector('#final-streak-preview main');window.previewPhases=[{phase:main.dataset.streakPhase,time:0}];window.previewStart=performance.now();
  window.previewObserver=new MutationObserver(()=>{if(previewPhases.at(-1)?.phase!==main.dataset.streakPhase)previewPhases.push({phase:main.dataset.streakPhase,time:performance.now()-previewStart});});previewObserver.observe(main,{attributes:true,attributeFilter:['data-streak-phase']});
  document.getElementById('preview-marker').remove();delete document.hidden;document.dispatchEvent(new Event('visibilitychange'));
 });
 await page.waitForFunction(()=>document.querySelector('#final-streak-preview main')?.dataset.streakPhase==='complete',{},{timeout:12000});
 playback=await page.evaluate(()=>previewPhases);assert.ok(playback.at(-1).time>=7500);
 await page.waitForTimeout(800);
 assert.deepEqual(binding(),before,'Final preview source remained frozen');
}finally{await context.close();await browser.close();}
const input=await page.video().path(),ff='C:/Users/David/AppData/Roaming/Python/Python312/site-packages/imageio_ffmpeg/binaries/ffmpeg-win-x86_64-v7.1.exe';
// Locate the final full-green marker frame at exact 25fps, then remove all setup.
const pixels=execFileSync(ff,['-v','error','-i',input,'-vf','fps=25,scale=8:8','-f','rawvideo','-pix_fmt','rgb24','pipe:1'],{maxBuffer:32*1024*1024});
let lastGreen=-1;
for(let frame=0;frame<pixels.length/192;frame++){
 let green=0;for(let p=0;p<192;p+=3){const i=frame*192+p;if(pixels[i]<25&&pixels[i+1]>220&&pixels[i+2]<25)green++;}
 if(green===64)lastGreen=frame;
}
assert.ok(lastGreen>=0,'Video alignment marker was recorded');
const start=(lastGreen+1)/25,target=path.join(out,'pico-streak-reference-measured-final-20261106.webm');
execFileSync(ff,['-y','-ss',String(start),'-i',input,'-t','8.2','-c:v','libvpx-vp9','-b:v','0','-crf','30','-an',target],{stdio:'ignore'});
fs.writeFileSync(path.join(root,'reports/streak-v2-preview.json'),JSON.stringify({pass:true,scope:'Fresh actual-renderer normal-speed preview, setup removed using a recorded colour marker. Synthetic coherent three-day metadata; no learner data.',event,sourceBinding:before,sourceUnchangedDuringRun:true,playback,alignment:{lastGreenFrame:lastGreen,fps:25,start},duration:8.2,file:target,sha256:crypto.createHash('sha256').update(fs.readFileSync(target)).digest('hex')},null,2)+'\n');
console.log('Created marker-aligned 8.2s normal-speed final preview.');
