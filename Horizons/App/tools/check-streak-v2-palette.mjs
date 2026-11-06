import {createRequire} from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
const require=createRequire(import.meta.url),{chromium}=require('C:/Users/David/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=path.resolve(new URL('..',import.meta.url).pathname.replace(/^\/([A-Za-z]:)/,'$1'));
const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
const page=await browser.newPage({viewport:{width:1200,height:900},serviceWorkers:'block'});
const manifest=JSON.parse(fs.readFileSync(path.join(root,'assets/art/streak-campfire-v2/rigs.json'),'utf8'));
const files=['src/streak-celebration.js','assets/art/streak-campfire-v2/rigs.json',...Object.values(manifest.parts).filter(p=>p.palette).map(p=>p.file)];
const binding=()=>files.map(file=>({file,sha256:crypto.createHash('sha256').update(fs.readFileSync(path.join(root,file))).digest('hex')}));
const bound=binding();
try{
 await page.goto('http://127.0.0.1:8898/Horizons/App/');await page.locator('.welcome').waitFor();
 const result=await page.evaluate(async manifest=>{
  Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});
  const m=await import('./src/streak-celebration.js?v=streak3'),host=document.createElement('div');host.style.cssText='position:fixed;inset:0;z-index:999999';document.body.append(host);
  host.innerHTML=m.streakCelebrationMarkup({dayKey:'2026-11-06',completedAt:'2026-11-06T14:18:00Z',timeZone:'America/Guayaquil',streak:3,activeDays:['2026-11-04','2026-11-05','2026-11-06'],localHour:9,minutesUntilMidnight:882});
  const control=m.mountStreakCelebration(host.firstElementChild,{elapsed:0});await control.ready;if(host.firstElementChild.dataset.streakMotion!=='ready')throw Error('Native palette rig not ready');
  const scene=host.querySelector('.streak-rig-svg'),SVG='http://www.w3.org/2000/svg';
  const encode=async url=>{const blob=await (await fetch(url)).blob(),reader=new FileReader();return new Promise((resolve,reject)=>{reader.onload=()=>resolve(reader.result);reader.onerror=reject;reader.readAsDataURL(blob);});};
  const raster=async (url,w,h)=>{const image=new Image();image.src=url;await image.decode();const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;canvas.getContext('2d').drawImage(image,0,0,w,h);return canvas.getContext('2d').getImageData(0,0,w,h).data;};
  const median=values=>{values.sort((a,b)=>a-b);const mid=Math.floor(values.length/2);return values.length%2?values[mid]:(values[mid-1]+values[mid])/2;};
  const checks=[];
  for(const [key,p] of Object.entries(manifest.parts).filter(([,p])=>p.palette)){
   const actual=scene.querySelector('[data-streak-part="'+key+'"]');if(!actual?.getAttribute('filter'))throw Error('Missing actual native SVG palette filter: '+key);
   const id=actual.getAttribute('filter').match(/#([^\)"']+)/)?.[1],filter=scene.querySelector('[id="'+id+'"]');if(!filter)throw Error('Missing captured filter definition '+key);
   const svg=document.createElementNS(SVG,'svg');svg.setAttribute('xmlns',SVG);svg.setAttribute('width',p.width);svg.setAttribute('height',p.height);svg.setAttribute('viewBox',`0 0 ${p.width} ${p.height}`);const defs=document.createElementNS(SVG,'defs');defs.append(filter.cloneNode(true));svg.append(defs);
   const image=actual.cloneNode(true);image.removeAttribute('transform');image.setAttribute('x','0');image.setAttribute('y','0');image.setAttribute('width',p.width);image.setAttribute('height',p.height);const nativeData=await encode(actual.getAttribute('href'));image.setAttribute('href',nativeData);svg.append(image);
   const blob=new Blob([new XMLSerializer().serializeToString(svg)],{type:'image/svg+xml'}),url=URL.createObjectURL(blob),original=await raster(nativeData,p.width,p.height),filtered=await raster(url,p.width,p.height);URL.revokeObjectURL(url);
   const before=[[],[],[]],after=[[],[],[]];let maxAlphaDifference=0,garmentPixels=0,maxGarmentDifference=0,skinPixels=0;
   for(let i=0;i<original.length;i+=4){maxAlphaDifference=Math.max(maxAlphaDifference,Math.abs(original[i+3]-filtered[i+3]));const [r,g,b,a]=original.slice(i,i+4);
    if(a>250&&r>180&&g>140&&b>100&&r>g+15&&g>b+12&&b<230){skinPixels++;for(let c=0;c<3;c++){before[c].push(original[i+c]);after[c].push(filtered[i+c]);}}
    if(key==='torso'&&a>250&&g<100){garmentPixels++;for(let c=0;c<3;c++)maxGarmentDifference=Math.max(maxGarmentDifference,Math.abs(original[i+c]-filtered[i+c]));}
   }
   const sourceMedian=before.map(median),actualMedian=after.map(median),target=p.palette.targetMedian,medianError=Math.max(...actualMedian.map((x,i)=>Math.abs(x-target[i])));
   checks.push({part:key,skinPixels,sourceMedian,actualFilteredMedian:actualMedian,targetMedian:target,maxMedianError:medianError,maxAlphaDifference,garmentPixels,maxGarmentRgbDifference:maxGarmentDifference,pass:medianError<=1&&maxAlphaDifference<=1&&maxGarmentDifference===0,actualFilterCaptured:true});
  }
  control.dispose();return{pass:checks.every(c=>c.pass),checks};
 },manifest);
 if(JSON.stringify(binding())!==JSON.stringify(bound))throw Error('Source changed during actual SVG palette verification');
 const report={...result,scope:'Actual runtime SVG filter definitions captured and rasterized at native intrinsic dimensions; native PNGs and alpha geometry are unchanged.',sourceBinding:bound};fs.writeFileSync(path.join(root,'reports/streak-v2-palette.json'),JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify(report));if(!report.pass)throw Error('Actual SVG skin palette / alpha / garment preservation failed');
}finally{await browser.close();}
