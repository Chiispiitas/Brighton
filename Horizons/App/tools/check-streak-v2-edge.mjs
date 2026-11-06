// Diagnose the rotated leg edge in the real DOM compositor versus nested SVG export.
import {createRequire} from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
const require=createRequire(import.meta.url),{chromium}=require('C:/Users/David/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=path.resolve(new URL('..',import.meta.url).pathname.replace(/^\/([A-Za-z]:)/,'$1')),out='C:/Users/David/Documents/Codex/2026-11-06/streak-v2-review',base='http://127.0.0.1:8898/Horizons/App/',mode=process.env.HZ_EDGE_MODE||'baseline',elapsed=Number(process.env.HZ_EDGE_TIME||3900);
const manifest=JSON.parse(fs.readFileSync(path.join(root,'assets/art/streak-campfire-v2/rigs.json'))),files=['src/streak-celebration.js',manifest.parts.leftLeg.file,manifest.parts.rightLeg.file],binding=()=>files.map(file=>({file,sha256:crypto.createHash('sha256').update(fs.readFileSync(path.join(root,file))).digest('hex')})),bound=binding();
const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true}),captures=[];
try{
 for(const dpr of [1,2]){
  const context=await browser.newContext({viewport:{width:1440,height:900},deviceScaleFactor:dpr,serviceWorkers:'block'}),page=await context.newPage();
  await context.route('**/api/horizons',route=>route.fulfill({status:401,contentType:'application/json',body:'{"ok":false,"error":"SESSION_REQUIRED"}'}));
  await page.goto(base);await page.locator('.welcome').waitFor();
  await page.evaluate(async elapsed=>{
   Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});
   const module=await import('./src/streak-celebration.js?v=streak3'),host=document.createElement('div');host.style.cssText='position:fixed;inset:0;z-index:99999';document.body.append(host);
   host.innerHTML=module.streakCelebrationMarkup({dayKey:'2026-11-06',completedAt:'2026-11-06T14:18:00Z',timeZone:'America/Guayaquil',streak:3,activeDays:['2026-11-04','2026-11-05','2026-11-06'],localHour:9,minutesUntilMidnight:882});window.edgeController=module.mountStreakCelebration(host.firstElementChild,{elapsed});await edgeController.ready;
   if(host.firstElementChild.dataset.streakMotion!=='ready')throw Error('Real native rig failed to load');
  },elapsed);
  await page.evaluate(mode=>{const scene=document.querySelector('.streak-rig-svg');if(mode==='all-off')scene.querySelectorAll('image[filter]').forEach(n=>n.removeAttribute('filter'));if(mode==='torso-off')scene.querySelector('[data-streak-part=torso]').removeAttribute('filter');if(mode==='limbs-off')scene.querySelectorAll('image[filter]').forEach(n=>{if(n.dataset.streakPart!=='torso')n.removeAttribute('filter');});if(mode==='atop')scene.querySelectorAll('filter[data-palette-part]').forEach(f=>{f.lastElementChild.setAttribute('result','beforeAlphaGuard');const c=document.createElementNS('http://www.w3.org/2000/svg','feComposite');c.setAttribute('in','beforeAlphaGuard');c.setAttribute('in2','SourceGraphic');c.setAttribute('operator','atop');f.append(c);});},mode);
  const live=path.join(out,`edge-${mode}-live-dpr${dpr}.png`);await page.locator('.streak-rig-svg').screenshot({path:live});
  await page.evaluate(async()=>{
   const scene=document.querySelector('.streak-rig-svg'),box=scene.getBoundingClientRect(),copy=scene.cloneNode(true);copy.setAttribute('width','760');copy.setAttribute('height','560');copy.setAttribute('xmlns','http://www.w3.org/2000/svg');
   for(const image of copy.querySelectorAll('image')){const blob=await(await fetch(image.getAttribute('href'))).blob(),reader=new FileReader(),data=await new Promise((resolve,reject)=>{reader.onload=()=>resolve(reader.result);reader.onerror=reject;reader.readAsDataURL(blob);});image.setAttribute('href',data);}
   const url=URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(copy)],{type:'image/svg+xml'})),render=new Image();render.src=url;await render.decode();
   const canvas=document.createElement('canvas');canvas.width=760;canvas.height=560;canvas.getContext('2d').drawImage(render,0,0,760,560);URL.revokeObjectURL(url);
   const image=new Image();image.id='serialized-edge';image.src=canvas.toDataURL('image/png');image.style.cssText=`position:fixed;left:${box.left}px;top:${box.top}px;width:${box.width}px;height:${box.height}px;max-width:none;z-index:999999;background:var(--paper)`;document.body.append(image);await image.decode();
  });
  const exported=path.join(out,`edge-${mode}-exported-dpr${dpr}.png`);await page.locator('#serialized-edge').screenshot({path:exported});captures.push({dpr,live,exported});await context.close();
 }
 if(JSON.stringify(binding())!==JSON.stringify(bound))throw Error('Leg filter source changed during diagnosis');
 fs.writeFileSync(path.join(root,`reports/streak-v2-edge-${mode}-captures.json`),JSON.stringify({mode,elapsed,sourceBinding:bound,legPalette:{left:manifest.parts.leftLeg.palette,right:manifest.parts.rightLeg.palette},captures,scope:'Actual native DOM SVG and serialized SVG-to-PNG at identical CSS bounds; synthetic metadata, no learner records.'},null,2)+'\n');console.log(JSON.stringify(captures));
}finally{await browser.close();}
