// Capture enlarged source pixels for manual anatomy review. Never infer a visual
// pass from successful screenshots, frame counts or element bounds.
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
const require=createRequire(import.meta.url),{chromium}=require('C:/Users/David/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const app=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const phase=process.argv[2]||'final';
const proof=process.env.HZ_ANATOMY_PROOF||`C:/Users/David/Documents/Codex/2026-11-04/horizons-anatomy-${phase}`;
const base=process.env.HZ_APP_URL||'http://127.0.0.1:8896/Horizons/App/';
fs.mkdirSync(proof,{recursive:true});
const reuse=process.env.HZ_ANATOMY_REUSE==='1';
const snapshots={};for(const rel of['src/art.js','src/avatar-rig.js','src/companion-rig.js','src/pico-rig.js','assets/art/manifest.json']){const saved=path.join(proof,path.basename(rel));const value=fs.readFileSync(reuse&&fs.existsSync(saved)?saved:path.join(app,rel),'utf8');snapshots[rel]=value;if(!reuse)fs.writeFileSync(saved,value);}
const manifest=JSON.parse(snapshots['assets/art/manifest.json']);
const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
const context=await browser.newContext({viewport:{width:1440,height:1100}}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.route('**/Horizons/App/src/*.js',async route=>{const rel=new URL(route.request().url()).pathname.split('/Horizons/App/')[1];if(snapshots[rel])return route.fulfill({contentType:'text/javascript',body:snapshots[rel]});return route.continue();});
await page.route('**/Horizons/App/assets/art/manifest.json',route=>route.fulfill({contentType:'application/json',body:snapshots['assets/art/manifest.json']}));
const css=`body{margin:0;padding:20px;font:16px system-ui;background:#fffdf8;color:#173f56}h1{font-size:24px}.grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:20px}.cell{background:#fff1db;border-radius:16px;overflow:hidden}.slot{height:380px;position:relative;width:100%}.cell p{padding:10px;margin:0;background:#fff;font-size:15px;line-height:1.4}.raster-frame{position:relative;display:block;overflow:hidden;width:100%;height:100%}.raster-fit{position:absolute!important;display:block;overflow:hidden;left:50%;top:50%;transform:translate(-50%,-50%)}.raster-fit img{position:absolute;max-width:none!important;max-height:none!important}`;
const report={date:new Date().toISOString(),phase,base,proof,scope:'Enlarged native character and rendered rig anatomy capture. Visual verdicts are manual; counts do not imply anatomical correctness. Legacy part-rig captures run only in baseline mode, never as evidence for the current complete-frame renderer.',captures:[],runtimeErrors:errors,reviewedCases:[]};
async function render(html,script){await page.route('**/anatomy-harness',route=>route.fulfill({contentType:'text/html',body:`<!doctype html><meta charset="utf-8"><style>${css}</style>${html}<script type="module">${script}</script>`}),{times:1});await page.goto(new URL('anatomy-harness',base).href);await page.waitForFunction(()=>window.__anatomyReady===true);await page.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.images].map(im=>im.decode().catch(()=>{})));});}
async function capture(name,meta={}){const file=path.join(proof,name+'.png');await page.screenshot({path:file,fullPage:true});report.captures.push({file,...meta});console.log(name);}
for(const mood of phase==='baseline'?['idle','wave','celebrate','think']:[]){
 await render(`<h1>Rendered part rigs · ${mood}</h1><div class="grid">${['pico','mina','alex','jo'].map(n=>`<div class="cell"><div class="slot" id="${n}"></div><p>${n} · ${mood}</p></div>`).join('')}</div>`,
 `import{mountPico}from'./src/pico-rig.js';import{mountCompanion}from'./src/companion-rig.js';const m=await fetch('./assets/art/manifest.json').then(r=>r.json());mountPico(document.getElementById('pico'),{mood:'idle',manifest:m});for(const n of['mina','alex','jo'])mountCompanion(document.getElementById(n),{character:n,mood:'idle',manifest:m});await new Promise(r=>setTimeout(r,100));for(const el of document.querySelectorAll('.hzn-pico,.hzn-human'))el.dataset.mood='${mood}';window.__anatomyReady=true;`);
 for(const time of[0.3,1.3,2.2]){await page.evaluate(t=>{for(const a of document.getAnimations()){a.pause();a.currentTime=t*1000;}},time);await capture(`rig-${mood}-${time}`,{group:'manual-rigs',mood,time});}
}
for(const character of['pico','mina','alex','jo']){
 await render(`<h1>Native whole-body frames · ${character}</h1><div id="grid" class="grid"></div>`,
 `import{loadArt,artManifest,rasterMarkup}from'./src/art.js';await loadArt();const m=artManifest();for(const[pose,asset]of Object.entries(m.postures.${character})){for(let f=0;f<4;f++){const cell=document.createElement('div');cell.className='cell';cell.innerHTML='<div class="slot">'+rasterMarkup({...asset,frame:asset.animation.frames[f],animation:null},'','')+'</div><p>${character} · '+pose+' · frame '+f+'</p>';document.getElementById('grid').append(cell);}}window.__anatomyReady=true;`);
 await capture(`native-postures-${character}`,{group:'native-postures',character,frames:16});
}
for(let sheet=0;sheet<2;sheet++){
 const words=Object.entries(manifest.vocabulary).filter(([,v])=>v.animation).slice(sheet*8,sheet*8+8).map(([n])=>n);
 await render(`<h1>Native occupation frames · sheet ${sheet+1}</h1><div id="grid" class="grid"></div>`,
 `import{loadArt,artManifest,rasterMarkup}from'./src/art.js';await loadArt();const m=artManifest();for(const n of ${JSON.stringify(words)}){const asset=m.vocabulary[n];for(let f=0;f<4;f++){const cell=document.createElement('div');cell.className='cell';cell.innerHTML='<div class="slot" style="height:300px">'+rasterMarkup({...asset,frame:asset.animation.frames[f],animation:null},'','')+'</div><p>'+n+' · frame '+f+'</p>';document.getElementById('grid').append(cell);}}window.__anatomyReady=true;`);
 await capture(`native-jobs-${sheet+1}`,{group:'native-jobs',jobs:words,frames:32});
 for(let row=0;row<words.length;row++){
  const cells=page.locator('.cell');const first=await cells.nth(row*4).boundingBox();const last=await cells.nth(row*4+3).boundingBox();
  const file=path.join(proof,`native-job-${words[row].replaceAll(' ','-')}.png`);
  await page.screenshot({path:file,fullPage:true,clip:{x:first.x,y:first.y,width:last.x+last.width-first.x,height:first.height}});
  report.captures.push({file,group:'native-job-row',job:words[row],frames:4});
 }
}
for(const posture of phase==='baseline'?['portrait','wave','think']:[]){
 await render(`<h1>Rendered avatar anatomy · ${posture}</h1><div class="grid" id="grid"></div>`,
 `import{mountAvatar}from'./src/avatar-rig.js';const m=await fetch('./assets/art/manifest.json').then(r=>r.json());for(let n=1;n<=6;n++){const cell=document.createElement('div');cell.className='cell';const p={skin:'skin-'+n,outfit:'outfit-'+n,hair:'hair-'+n,accessory:n<=3?'accessory-'+n:'none',badge:'none'};cell.innerHTML='<div class="slot"></div><p>skin/outfit/hair '+n+' · ${posture}</p>';document.getElementById('grid').append(cell);mountAvatar(cell.firstChild,{avatar:p,manifest:m,posture:'${posture}',mood:'idle'});}await new Promise(r=>setTimeout(r,250));window.__anatomyReady=true;`);
 for(const time of[0,2,3.4]){await page.evaluate(t=>{for(const a of document.getAnimations()){a.pause();a.currentTime=t*1000;}},time);await capture(`avatars-${posture}-${time}`,{group:'avatars',posture,time,variants:6});}
}
fs.writeFileSync(path.join(app,'reports/anatomy-review.json'),JSON.stringify(report,null,2));await browser.close();console.log(JSON.stringify({captures:report.captures.length,runtimeErrors:errors}));
