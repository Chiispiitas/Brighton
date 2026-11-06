import {createRequire} from 'node:module';
import fs from 'node:fs';
import crypto from 'node:crypto';
import path from 'node:path';
const require=createRequire(import.meta.url),{chromium}=require('C:/Users/David/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=path.resolve(new URL('..',import.meta.url).pathname.replace(/^\/([A-Za-z]:)/,'$1'));
const base='http://127.0.0.1:8898/Horizons/App/',verifyOnly=process.argv.includes('--verify-only');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'assets/art/streak-campfire-v2/rigs.json'),'utf8'));
const boundFiles=['src/streak-celebration.js','assets/art/streak-campfire-v2/rigs.json',...new Set(Object.values(manifest.parts).map(p=>p.file))];
const binding=()=>boundFiles.map(file=>({file,sha256:crypto.createHash('sha256').update(fs.readFileSync(path.join(root,file))).digest('hex')}));const sourceAtStart=binding();
const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
const page=await browser.newPage({viewport:{width:1200,height:900},serviceWorkers:'block'});
try{
 await page.goto(base);await page.locator('.welcome').waitFor();
 const frames=[];
 for(const [elapsed,file] of [[0,'native-rest.png'],[1650,'native-burst.png'],[1760,'native-recoil.png'],[1839,'native-punch-peak.png'],[2050,'native-folded-arms.png'],[2700,'native-rebound.png'],[3900,'native-return.png'],[7600,'native-complete.png']]){
  const data=await page.evaluate(async elapsed=>{
   Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});
   const m=await import('./src/streak-celebration.js?v=streak3');
   document.getElementById('capture-streak')?.remove();const host=document.createElement('div');host.id='capture-streak';host.style.cssText='position:fixed;inset:0;z-index:999999';document.body.append(host);
   host.innerHTML=m.streakCelebrationMarkup({dayKey:'2026-11-06',completedAt:'2026-11-06T14:18:00Z',timeZone:'America/Guayaquil',streak:3,activeDays:['2026-11-04','2026-11-05','2026-11-06'],localHour:9,minutesUntilMidnight:882});
   const controller=m.mountStreakCelebration(host.firstElementChild,{elapsed});await controller.ready;
   if(host.firstElementChild.dataset.streakMotion!=='ready')throw Error('Native articulated rig did not mount');
   const scene=host.querySelector('.streak-rig-svg').cloneNode(true);scene.setAttribute('width','760');scene.setAttribute('height','560');scene.setAttribute('xmlns','http://www.w3.org/2000/svg');
   for(const image of scene.querySelectorAll('image')){
    const url=image.getAttribute('href');if(!url)throw Error('Missing native image href');
    const blob=await (await fetch(url)).blob();const reader=new FileReader();const encoded=await new Promise((resolve,reject)=>{reader.onload=()=>resolve(reader.result);reader.onerror=reject;reader.readAsDataURL(blob);});image.setAttribute('href',encoded);
   }
   const xml=new XMLSerializer().serializeToString(scene),blob=new Blob([xml],{type:'image/svg+xml'}),url=URL.createObjectURL(blob),image=new Image();image.src=url;await image.decode();
   const canvas=document.createElement('canvas');canvas.width=760;canvas.height=560;canvas.getContext('2d').drawImage(image,0,0,760,560);const data=canvas.toDataURL('image/png');URL.revokeObjectURL(url);controller.dispose();return data;
  },elapsed);
  const target=path.join('C:/Users/David/Documents/Codex/2026-11-06/streak-v2-review',file),bytes=Buffer.from(data.split(',')[1],'base64');if(verifyOnly){if(!fs.readFileSync(target).equals(bytes))throw Error('Frozen native still differs from final actual SVG: '+file);}else fs.writeFileSync(target,bytes);frames.push({elapsed,file:'C:/Users/David/Documents/Codex/2026-11-06/streak-v2-review/'+file,sha256:crypto.createHash('sha256').update(bytes).digest('hex')});
 }
 if(JSON.stringify(binding())!==JSON.stringify(sourceAtStart))throw Error('Source changed during exact SVG capture');
 fs.writeFileSync(path.join(root,'reports/streak-v2-extreme-stills.json'),JSON.stringify({pass:true,frozenPngsRevalidated:verifyOnly,sourceBinding:sourceAtStart,scope:'Exact native articulated SVG render only, synthetic metadata; no interface text or learner data.',width:760,height:560,frames},null,2)+'\n');
 console.log(verifyOnly?'Verified frozen startup/fallback bytes against final SVG without image writes.':'Captured current native articulated extremes outside the app.');
}finally{await browser.close();}
