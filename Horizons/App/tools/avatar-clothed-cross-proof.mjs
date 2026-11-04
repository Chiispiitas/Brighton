import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
const require=createRequire(import.meta.url);
const {chromium}=require('C:/Users/David/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const app=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const base=process.env.HZ_APP_URL||'http://127.0.0.1:8896/Horizons/App/';
const out=process.env.HZ_AVATAR_CLOTHED_CROSS_PROOF||'C:/Users/David/Documents/Codex/2026-11-04/horizons-avatar-clothed-cross';
fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
const phaseMilliseconds=[288,640,960,1248,1728,2112],runs=[],errors=[];
for(const posture of ['portrait','wave','think'])for(const mood of ['wave','celebrate']){
 const page=await browser.newPage({viewport:{width:1740,height:1100}});
 page.on('pageerror',error=>errors.push(error.message));
 await page.route('**/avatar-clothed-cross-proof',route=>route.fulfill({contentType:'text/html',body:`<!doctype html><meta charset="utf-8"><style>body{margin:0;padding:20px;font:14px system-ui;background:#fffdf8;color:#173e5c}#grid{display:grid;grid-template-columns:repeat(6,260px);gap:18px}.slot{width:260px;height:260px;background:#fff1da;border-radius:18px}.label{text-align:center;margin:8px 0 0}</style><div id="grid"></div><script type="module">import{mountAvatar}from'./src/avatar-rig.js';const manifest=await fetch('./assets/art/manifest.json').then(r=>r.json());window.controllers=[];for(let skin=1;skin<=6;skin++)for(let outfit=1;outfit<=6;outfit++){const item=document.createElement('div');item.innerHTML='<div class="slot"></div><p class="label">skin '+skin+' · outfit '+outfit+' · ${posture}→${mood}</p>';document.getElementById('grid').append(item);window.controllers.push(mountAvatar(item.firstChild,{manifest,avatar:{skin:'skin-'+skin,outfit:'outfit-'+outfit,hair:'hair-'+skin,accessory:'none',badge:'none'},posture:${JSON.stringify(posture)}}));}</script>`}));
 await page.goto(new URL('avatar-clothed-cross-proof',base).href);
 await page.waitForFunction(()=>document.querySelectorAll('[data-avatar-bust][data-ready]').length===36);
 await page.evaluate(async()=>{await Promise.all([...document.images].map(image=>image.decode()));for(const animation of document.getAnimations()){animation.pause();animation.currentTime=1000;}});
 await page.evaluate(mood=>{for(const controller of window.controllers)controller.setMood(mood);for(const controller of window.controllers)for(const action of controller.actions)action.pause();},mood);
 const samples=[];
 for(const milliseconds of phaseMilliseconds){
  await page.evaluate(time=>{for(const controller of window.controllers)for(const action of controller.actions)action.currentTime=time;},milliseconds);
  await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
  const screenshot=path.join(out,`cross-${posture}-${mood}-${milliseconds}.png`);
  await page.screenshot({path:screenshot,fullPage:true});
  const hands=await page.locator('[data-avatar-bust]').evaluateAll(elements=>elements.map((element,index)=>{
   const bounds=element.getBoundingClientRect(),scale=bounds.width/320;
   window.nativeHandPoints??=new Map();
   const paintedBounds=hand=>{
    const image=hand.querySelector('img'),frame=JSON.parse(hand.dataset.nativeFrame),cacheKey=image.src+hand.dataset.nativeFrame;
    if(!window.nativeHandPoints.has(cacheKey)){
     const canvas=document.createElement('canvas');canvas.width=frame.w;canvas.height=frame.h;const context=canvas.getContext('2d',{willReadFrequently:true});context.drawImage(image,frame.x,frame.y,frame.w,frame.h,0,0,frame.w,frame.h);const pixels=context.getImageData(0,0,frame.w,frame.h).data,points=[];
     for(let y=0;y<frame.h;y++)for(let x=0;x<frame.w;x++)if(pixels[(y*frame.w+x)*4+3]>170)points.push([x,y]);
     window.nativeHandPoints.set(cacheKey,points);
    }
    let matrix=new DOMMatrix();
    for(let node=hand;node&&!node.classList.contains('hzn-avatar-stage');node=node.parentElement){const style=getComputedStyle(node),origin=style.transformOrigin.split(' ').map(parseFloat),local=new DOMMatrix().translate(parseFloat(style.left)||0,parseFloat(style.top)||0).translate(origin[0]||0,origin[1]||0).multiply(new DOMMatrix(style.transform==='none'?undefined:style.transform)).translate(-(origin[0]||0),-(origin[1]||0));matrix=local.multiply(matrix);}
    const style=getComputedStyle(hand),sx=parseFloat(style.width)/frame.w,sy=parseFloat(style.height)/frame.h;let left=Infinity,right=-Infinity,top=Infinity;
    for(const [x,y]of window.nativeHandPoints.get(cacheKey)){const point=matrix.transformPoint({x:(x+.5)*sx,y:(y+.5)*sy});left=Math.min(left,point.x);right=Math.max(right,point.x);top=Math.min(top,point.y);}
    return {left,right,top};
   };
   return {skin:'skin-'+(Math.floor(index/6)+1),outfit:'outfit-'+(index%6+1),hands:[...element.querySelectorAll('[data-rig-part^="hand-"]')].map(hand=>{const box=hand.getBoundingClientRect();return {side:hand.dataset.rigPart.slice(5),domBounds:{left:(box.left-bounds.left)/scale,right:(box.right-bounds.left)/scale,top:(box.top-bounds.top)/scale},paintedBounds:paintedBounds(hand)};})};
  }));
  samples.push({milliseconds,screenshot,hands});
 }
 runs.push({posture,mood,combinations:36,samples});
 await page.close();
}
await browser.close();
const horizontalBoundsPass=errors.length===0&&runs.every(run=>run.samples.every(sample=>sample.hands.every(avatar=>avatar.hands.every(hand=>hand.paintedBounds.left>=0&&hand.paintedBounds.right<=320))));
const reportPath=path.join(app,'reports/avatar-clothed-structure.json');
const report=JSON.parse(fs.readFileSync(reportPath,'utf8'));
report.crossCombinations={date:new Date().toISOString(),horizontalBoundsPass,boundsMethod:'Native PNG alpha >170 projected through actual rendered joint transforms; DOM rectangles are retained separately because their empty corners can exceed the painted silhouette.',phaseMilliseconds,combinationCount:36,runs,errors,visualReview:'Painted sheets require independent review; horizontal bounds do not approve anatomy or occlusion.'};
fs.writeFileSync(reportPath,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({horizontalBoundsPass,runs:runs.length,sheets:runs.length*phaseMilliseconds.length,combinations:36,errors,out}));
if(!horizontalBoundsPass)process.exitCode=1;
