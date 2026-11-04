import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),{chromium}=require('C:/Users/David/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const out='C:/Users/David/Documents/Codex/2026-11-04/horizons-friendly-pico';fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
const page=await browser.newPage({viewport:{width:420,height:610},deviceScaleFactor:1});const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.route('**/friendly-pico-proof',r=>r.fulfill({contentType:'text/html',body:`<!doctype html><style>html,body{margin:0;background:transparent}#slot{position:absolute;left:20px;top:20px;width:360px;height:520px}</style><div id=slot></div><script type=module>import{mountPico}from'./src/pico-articulated.js';window.mountPico=mountPico;window.ready=true;</script>`}));
await page.goto('http://127.0.0.1:8896/Horizons/App/friendly-pico-proof');await page.waitForFunction(()=>window.ready);
const cases=[],poses=['greet','read','explore','stride','idle'];
for(const posture of poses)for(const mood of ['idle','wave','celebrate']){
 await page.evaluate(({posture,mood})=>{window.c?.dispose();window.c=mountPico(slot,{posture,mood});},{posture,mood});
 await page.waitForFunction(()=>document.querySelector('[data-rig-ready=true]'));await page.evaluate(()=>Promise.all([...document.images].map(i=>i.decode())));
 const duration=await page.evaluate(()=>Math.max(...document.getAnimations().map(a=>Number(a.effect.getTiming().duration))));
 for(let i=0;i<12;i++){
  const ms=duration*i/11;await page.evaluate(async ms=>{c.seek(ms);await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));},ms);
  const file=path.join(out,posture+'-'+mood+'-'+i+'.png');await page.screenshot({path:file,omitBackground:true});cases.push({posture,mood,ms,file});
 }
}
await page.route('**/friendly-pico-contact',r=>r.fulfill({contentType:'text/html',body:'<!doctype html><style>body{margin:0;background:#fffdfa;font:14px sans-serif;color:#123c52}.grid{display:grid;grid-template-columns:repeat(4,300px)}.cell img{display:block;width:300px;height:auto}.cell p{margin:0;text-align:center}</style><div class=grid id=grid></div>'}));
await page.goto('http://127.0.0.1:8896/Horizons/App/friendly-pico-contact');await page.setViewportSize({width:1200,height:1800});
const sheets=[];for(const posture of poses)for(const mood of ['idle','wave','celebrate']){
 const group=cases.filter(c=>c.posture===posture&&c.mood===mood).map(c=>({...c,url:'data:image/png;base64,'+fs.readFileSync(c.file).toString('base64')}));
 await page.evaluate(async group=>{grid.replaceChildren();for(const c of group){const d=document.createElement('div');d.className='cell';d.innerHTML='<img><p>'+c.posture+' '+c.mood+' '+Math.round(c.ms)+'ms</p>';d.querySelector('img').src=c.url;grid.append(d);}await Promise.all([...document.images].map(i=>i.decode()));},group);
 const file=path.join(out,'sheet-'+posture+'-'+mood+'.png');await page.screenshot({path:file,fullPage:true});sheets.push(file);
}
await browser.close();fs.writeFileSync(path.join(out,'capture.json'),JSON.stringify({cases,sheets,errors},null,2));console.log(JSON.stringify({frames:cases.length,sheets:sheets.length,errors,out}));
