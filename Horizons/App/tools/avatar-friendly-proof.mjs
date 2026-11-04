import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),{chromium}=require('C:/Users/David/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const app='C:/Users/David/Documents/Codex/2026-10-05/hav/work/Brighton/Horizons/App';
const out='C:/Users/David/Documents/Codex/2026-11-04/horizons-avatar-friendly';fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true}),p=await browser.newPage({viewport:{width:1740,height:1940}}),errors=[];
p.on('pageerror',e=>errors.push(e.message));
await p.route('**/avatar-friendly-proof',r=>r.fulfill({contentType:'text/html',body:`<meta charset="utf-8"><style>body{margin:0;padding:20px;background:#fffdf8;color:#173e5c;font:14px system-ui}#g{display:grid;grid-template-columns:repeat(6,266px);gap:16px}.slot{width:266px;height:266px;background:#fff1da;border-radius:18px}p{margin:6px 0;text-align:center}</style><div id="g"></div><script type="module">import{mountAvatar}from'./src/avatar-rig.js';const manifest=await fetch('./assets/art/manifest.json').then(r=>r.json());window.controllers=[];for(const body of ['male','female'])for(const posture of ['portrait','wave','think'])for(let n=1;n<=6;n++){const x=document.createElement('div');x.innerHTML='<div class="slot"></div><p>'+body+' · set '+n+' · '+posture+'</p>';g.append(x);controllers.push(mountAvatar(x.firstChild,{manifest,avatar:{body,skin:'skin-'+n,outfit:'outfit-'+n,hair:'hair-'+n,accessory:'accessory-'+n,badge:'none'},posture}));}</script>`}));
await p.goto('http://127.0.0.1:8896/Horizons/App/avatar-friendly-proof');await p.waitForFunction(()=>document.querySelectorAll('[data-ready=true]').length===36);
await p.evaluate(async()=>{await Promise.all([...document.images].map(im=>im.decode()));for(const a of document.getAnimations()){a.pause();a.currentTime=1000;}await new Promise(requestAnimationFrame);});
await p.screenshot({path:path.join(out,'friendly-all-poses.png'),fullPage:true});
await p.evaluate(async()=>{for(const el of document.querySelectorAll('.hzn-avatar-eyes')){el.style.animation='none';el.style.opacity='1';}await new Promise(requestAnimationFrame);});
await p.screenshot({path:path.join(out,'friendly-closed-eyes.png'),fullPage:true});
await p.evaluate(()=>{for(const el of document.querySelectorAll('.hzn-avatar-eyes')){el.style.opacity='';el.style.animation='';}});
const connections=await p.evaluate(async()=>{
 const canvas=document.createElement('canvas');canvas.width=512;canvas.height=512;const ctx=canvas.getContext('2d',{willReadFrequently:true}),failures=[],weakConnections=[],samples=[];
 const models=[...document.querySelectorAll('[data-avatar-bust]')].map((actor,index)=>({actor,index,nodes:new Map([...actor.querySelectorAll('[data-native-frame]')].map(n=>[n.dataset.rigPart,n]))}));
 const world=(node)=>{if(node.classList.contains('hzn-avatar-stage'))return new DOMMatrix();const s=getComputedStyle(node),o=s.transformOrigin.split(' ').map(parseFloat);return world(node.parentElement).translate(parseFloat(s.left)||0,parseFloat(s.top)||0).translate(o[0]||0,o[1]||0).multiply(new DOMMatrix(s.transform==='none'?undefined:s.transform)).translate(-(o[0]||0),-(o[1]||0));};
 const mask=node=>{const frame=JSON.parse(node.dataset.nativeFrame),s=getComputedStyle(node),w=parseFloat(s.width),h=parseFloat(s.height),m=world(node),corners=[m.transformPoint({x:0,y:0}),m.transformPoint({x:w,y:0}),m.transformPoint({x:0,y:h}),m.transformPoint({x:w,y:h})],x=Math.max(0,Math.floor(Math.min(...corners.map(p=>p.x))+64)-1),y=Math.max(0,Math.floor(Math.min(...corners.map(p=>p.y))+64)-1),right=Math.min(512,Math.ceil(Math.max(...corners.map(p=>p.x))+64)+1),bottom=Math.min(512,Math.ceil(Math.max(...corners.map(p=>p.y))+64)+1);ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,512,512);ctx.setTransform(m.a,m.b,m.c,m.d,m.e+64,m.f+64);ctx.drawImage(node.querySelector('img'),frame.x,frame.y,frame.w,frame.h,0,0,w,h);const data=ctx.getImageData(x,y,right-x,bottom-y).data;return{x,y,w:right-x,h:bottom-y,data};};
 const overlap=(a,b)=>{let count=0;for(let y=Math.max(a.y,b.y);y<Math.min(a.y+a.h,b.y+b.h);y++)for(let x=Math.max(a.x,b.x);x<Math.min(a.x+a.w,b.x+b.w);x++)if(a.data[((y-a.y)*a.w+x-a.x)*4+3]>170&&b.data[((y-b.y)*b.w+x-b.x)*4+3]>170)count++;return count;};
 for(const mood of ['wave','celebrate']){
  for(const c of controllers){for(const a of c.actions)a.finish();}await Promise.allSettled(controllers.flatMap(c=>c.actions.map(a=>a.finished)));for(const c of controllers){c.setMood(mood);for(const a of c.actions)a.pause();}
  for(const time of [0,80,160,320,480,720,1000,1248,1600,1920,2112,2280,2399]){
   for(const c of controllers)for(const a of c.actions)a.currentTime=time;await new Promise(requestAnimationFrame);
   let minOverlap=Infinity;
   for(const model of models){const masks=new Map(),get=name=>{if(!masks.has(name))masks.set(name,mask(model.nodes.get(name)));return masks.get(name);},pairs=[['face','skin'],['skin','outfit']];for(const side of ['left','right']){pairs.push(['outfit','upper-sleeve-'+side],['upper-skin-'+side,'fore-skin-'+side],['fore-skin-'+side,'hand-'+side]);if(model.nodes.has('fore-sleeve-'+side))pairs.push(['upper-sleeve-'+side,'fore-sleeve-'+side],['fore-sleeve-'+side,'hand-'+side]);}
    for(const [a,b]of pairs){const pixels=overlap(get(a),get(b));minOverlap=Math.min(minOverlap,pixels);const detail={index:model.index,base:model.actor.dataset.avatarBase,posture:model.actor.dataset.posture,mood,time,pair:[a,b],opaqueOverlapPixels:pixels};if(pixels===0)failures.push(detail);if(pixels<10)weakConnections.push(detail);}
   }
   samples.push({mood,time,minOpaqueOverlap:minOverlap});
  }
 }
 return{samples,failures,weakConnections,method:'Actual source PNG alpha >170 rasterized through each current painted DOM matrix at native stage resolution. Tests head/neck, neck/collar, clothing shoulder, skin elbow/wrist and long-sleeve elbow/cuff contact; pivot coincidence is not used as contact proof.'};
});
await p.evaluate(async()=>{for(const c of controllers){c.setMood('celebrate');for(const a of c.actions){a.pause();a.currentTime=1000;}}await new Promise(requestAnimationFrame);});
await p.screenshot({path:path.join(out,'friendly-celebrate.png'),fullPage:true});
await p.evaluate(async()=>{for(const c of controllers){c.setMood('idle');for(const a of c.actions){a.pause();a.currentTime=280;}}await new Promise(requestAnimationFrame);});
await p.screenshot({path:path.join(out,'friendly-interrupted-return.png'),fullPage:true});
await browser.close();
const sourceFiles=['src/avatar-rig.js','src/app.js','assets/art/avatar-friendly-v1.frames.json','assets/art/avatar-friendly-heads-v1.png','assets/art/avatar-friendly-clothing-v2.png','assets/art/avatar-friendly-limbs-v2.png'];
const report={date:new Date().toISOString(),errors,connections,sourceHashes:Object.fromEntries(sourceFiles.map(rel=>[rel,crypto.createHash('sha256').update(fs.readFileSync(path.join(app,rel))).digest('hex')])),proofFolder:out,status:errors.length||connections.failures.length?'FAIL':'AUTHOR_VISUAL_REVIEW_PENDING'};
fs.writeFileSync(path.join(app,'reports/avatar-friendly-structure.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({status:report.status,errors,connectionFailures:connections.failures.length,samples:connections.samples.length,out}));
