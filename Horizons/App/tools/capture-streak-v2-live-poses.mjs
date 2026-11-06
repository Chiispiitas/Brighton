// Actual browser screenshots on the white app UI. No SVG serialization/canvas.
import {createRequire} from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
const require=createRequire(import.meta.url),{chromium}=require('C:/Users/David/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=path.resolve(new URL('..',import.meta.url).pathname.replace(/^\/([A-Za-z]:)/,'$1'));
const base='http://127.0.0.1:8898/Horizons/App/',out='C:/Users/David/Documents/Codex/2026-11-06/streak-v2-review';
const manifest=JSON.parse(fs.readFileSync(path.join(root,'assets/art/streak-campfire-v2/rigs.json'),'utf8'));
const files=['src/streak-celebration.js','styles/streak-celebration.css','assets/art/streak-campfire-v2/rigs.json',...new Set(Object.values(manifest.parts).map(p=>p.file))];
const binding=()=>files.map(file=>({file,sha256:crypto.createHash('sha256').update(fs.readFileSync(path.join(root,file))).digest('hex')})),before=binding();
const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
try{
 const page=await browser.newPage({viewport:{width:1440,height:900},serviceWorkers:'block'});
 await page.goto(base);await page.locator('.welcome').waitFor();
 const frames=[];
 for(const [elapsed,label] of [[0,'rest'],[1650,'burst'],[1760,'recoil'],[1839,'punch-peak'],[2050,'folded-arms'],[2700,'rebound'],[3900,'return'],[7600,'complete']]){
  await page.evaluate(async elapsed=>{
   Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});
   window.livePoseController?.dispose();document.getElementById('live-streak-pose')?.remove();
   const module=await import('./src/streak-celebration.js?v=streak3');
   const host=document.createElement('div');host.id='live-streak-pose';host.style.cssText='position:fixed;inset:0;z-index:999999;background:#fffefa';document.body.append(host);
   host.innerHTML=module.streakCelebrationMarkup({dayKey:'2026-11-06',completedAt:'2026-11-06T14:18:00Z',timeZone:'America/Guayaquil',streak:3,activeDays:['2026-11-04','2026-11-05','2026-11-06'],localHour:9,minutesUntilMidnight:882});
   window.livePoseController=module.mountStreakCelebration(host.firstElementChild,{elapsed});await livePoseController.ready;
   if(host.firstElementChild.dataset.streakMotion!=='ready')throw Error('Rig did not mount');
  },elapsed);
  const file=path.join(out,`live-ui-${label}.png`),full=path.join(out,`live-ui-${label}-full.png`);
  await page.locator('#live-streak-pose .streak-rig-svg').screenshot({path:file});
  await page.screenshot({path:full});
  frames.push({elapsed,label,file,full,sha256:crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')});
 }
 if(JSON.stringify(before)!==JSON.stringify(binding()))throw Error('Source changed during live pose capture');
 fs.writeFileSync(path.join(root,'reports/streak-v2-live-poses.json'),JSON.stringify({pass:true,scope:'Actual white app renderer screenshots; separate from manual art acceptance.',viewport:{width:1440,height:900},sourceBinding:before,frames},null,2)+'\n');
 console.log('Captured 8 actual UI poses, with unchanged source bindings.');
}finally{await browser.close();}
