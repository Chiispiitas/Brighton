import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),{chromium}=require('C:/Users/David/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const out='C:/Users/David/Documents/Codex/2026-11-04/horizons-avatar-friendly';
const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
const p=await browser.newPage({viewport:{width:1740,height:1940}});
await p.route('**/avatar-compatible-proof',r=>r.fulfill({contentType:'text/html',body:`<style>body{margin:0;padding:20px;background:#fffdf8;color:#173e5c;font:14px system-ui}#g{display:grid;grid-template-columns:repeat(6,266px);gap:16px}.slot{width:266px;height:266px;background:#fff1da;border-radius:18px}p{margin:6px 0;text-align:center}</style><div id="g"></div><script type="module">import{mountAvatar}from'./src/avatar-rig.js';window.manifest=await fetch('./assets/art/manifest.json').then(r=>r.json());window.mountAvatar=mountAvatar;window.ready=true;</script>`}));
await p.goto('http://127.0.0.1:8896/Horizons/App/avatar-compatible-proof');await p.waitForFunction(()=>window.ready);
async function render(cases,name,cols=6,size=266){
 await p.evaluate(({cases,cols,size})=>{for(const c of window.controllers||[])c.dispose();window.controllers=[];g.replaceChildren();g.style.gridTemplateColumns=`repeat(${cols},${size}px)`;for(const item of cases){const x=document.createElement('div');x.innerHTML='<div class="slot"></div><p>'+item.label+'</p>';x.firstChild.style.width=x.firstChild.style.height=size+'px';g.append(x);controllers.push(mountAvatar(x.firstChild,{manifest,avatar:item.avatar,posture:item.posture||'wave'}));}},{cases,cols,size});
 await p.waitForFunction(n=>document.querySelectorAll('[data-ready=true]').length===n,cases.length);
 await p.evaluate(async()=>{await Promise.all([...document.images].map(im=>im.decode()));for(const a of document.getAnimations()){a.pause();a.currentTime=1000;}await new Promise(requestAnimationFrame);});
 await p.setViewportSize({width:cols*(size+16)+24,height:Math.min(2000,Math.ceil(cases.length/cols)*(size+42)+24)});
 await p.screenshot({path:path.join(out,name),fullPage:true});
}
for(const body of ['male','female']){
 const cases=[];for(let hair=1;hair<=6;hair++)for(let accessory=1;accessory<=6;accessory++)cases.push({label:body+' · hair '+hair+' · accessory '+accessory,avatar:{body,skin:'skin-'+accessory,outfit:'outfit-'+((hair+accessory-2)%6+1),hair:'hair-'+hair,accessory:'accessory-'+accessory,badge:'none'}});
 await render(cases,'friendly-'+body+'-all-hair-accessories.png');
}
await render(['male','female'].flatMap(body=>Array.from({length:6},(_,i)=>({label:body+' · bald · skin '+(i+1),posture:'portrait',avatar:{body,skin:'skin-'+(i+1),outfit:'outfit-2',hair:'none',accessory:'none',badge:'none'}}))),'friendly-bald-bases.png');
await render(['male','female'].flatMap(body=>[2,6].map(n=>({label:body+' · skin '+n+' · enlarged wave',avatar:{body,skin:'skin-'+n,outfit:'outfit-'+(n===2?2:6),hair:'none',accessory:'none',badge:'none'}}))),'friendly-enlarged-joints.png',4,480);
await browser.close();console.log(JSON.stringify({pass:true,combinations:72,baldBases:12,enlarged:4,out}));
