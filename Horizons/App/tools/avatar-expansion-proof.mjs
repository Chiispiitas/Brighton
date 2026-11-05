import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {execFileSync} from 'node:child_process';

const require=createRequire(import.meta.url);
const {chromium}=require('C:/Users/David/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const app=path.resolve(import.meta.dirname,'..');
const base=new URL(process.env.HZ_APP_URL||'http://127.0.0.1:8898/Horizons/App/');
const out=process.env.HZ_AVATAR_PROOF||'C:/Users/David/Documents/Codex/2026-11-04/horizons-avatar-expansion';
const reportFile=process.env.HZ_AVATAR_REPORT||path.join(app,'reports/avatar-expansion-proof.json');
const sourceRef=process.env.HZ_AVATAR_SOURCE_REF;
const hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const bytes=rel=>sourceRef?execFileSync('git',['show',sourceRef+':Horizons/App/'+rel],{cwd:app,maxBuffer:64*1024*1024}):fs.readFileSync(path.join(app,rel));
const metadata=JSON.parse(bytes('assets/art/avatar-static-v1.frames.json'));
const manifest=JSON.parse(bytes('assets/art/manifest.json'));
const nativePaths=new Set();
const collect=node=>{if(!node||typeof node!=='object')return;if(typeof node.src==='string'&&node.src.startsWith('assets/'))nativePaths.add(node.src);Object.values(node).forEach(collect);};
collect(metadata);collect(manifest.avatar);
const sources=['src/avatar-static.js','assets/art/avatar-static-v1.frames.json','assets/art/manifest.json',...nativePaths];
const sourceHashes=Object.fromEntries(sources.map(rel=>[rel,hash(bytes(rel))]));
for(let n=7;n<=12;n++){assert.ok(metadata.hair['hair-'+n],'Missing new hair '+n);assert.ok(manifest.avatar.hair.some(x=>x.id==='hair-'+n));}
for(let n=7;n<=10;n++){assert.ok(metadata.clothes['outfit-'+n],'Missing new outfit '+n);assert.ok(manifest.avatar.outfit.some(x=>x.id==='outfit-'+n));}
fs.mkdirSync(out,{recursive:true});
const report={date:new Date().toISOString(),base:base.href,sourceReference:sourceRef?{kind:'git-blob',commit:execFileSync('git',['rev-parse',sourceRef],{cwd:app,encoding:'utf8'}).trim()}:{kind:'working-tree'},sourceHashes,scope:'New hairstyles and clothes in the actual static portrait renderer. Both bases and every skin; every new hair with the three supported eyewear styles. No API or profile writes.',proofs:[],errors:[],checks:[],limits:['Chromium/Edge renderer only.','Structural painted clipping and uniform scaling do not establish style, natural attachment or visual fit; those require direct independent contact-sheet review.','The avatar is intentionally an upper-chest bust; lower clothing clipping is not treated as a defect.','Miniatures are 44 by 56 CSS pixels, alongside full 320px composed busts.'],structuralPass:false,pass:false,visualVerdict:'PENDING independent direct visual review'};

const hair=[];for(const body of ['male','female'])for(let skin=1;skin<=6;skin++)for(let n=7;n<=12;n++)hair.push({id:`${body}-s${skin}-hair${n}`,body,skin:'skin-'+skin,outfit:'outfit-1',hair:'hair-'+n,accessory:'none',badge:'none'});
const outfits=[];for(const body of ['male','female'])for(let skin=1;skin<=6;skin++)for(let n=7;n<=10;n++)outfits.push({id:`${body}-s${skin}-outfit${n}`,body,skin:'skin-'+skin,outfit:'outfit-'+n,hair:'hair-1',accessory:'none',badge:'none'});
const eyewear=[];for(const body of ['male','female'])for(let n=7;n<=12;n++)for(let a=1;a<=3;a++)eyewear.push({id:`${body}-hair${n}-glasses${a}`,body,skin:'skin-3',outfit:'outfit-7',hair:'hair-'+n,accessory:'accessory-'+a,badge:'none'});
const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
const context=await browser.newContext({viewport:{width:1352,height:1120},deviceScaleFactor:1,serviceWorkers:'block'});
const page=await context.newPage();
page.on('pageerror',e=>report.errors.push(e.message));
const loadedHashes={};const pending=[];
page.on('response',response=>{const u=new URL(response.url());if(!u.pathname.startsWith(base.pathname))return;const rel=u.pathname.slice(base.pathname.length);if(!sources.includes(rel))return;pending.push((async()=>{try{(loadedHashes[rel]??=[]).push({status:response.status(),sha256:hash(await response.body())});}catch(error){report.errors.push(rel+': '+error.message);}})());});
try{
 await page.route('**/avatar-expansion-proof',r=>r.fulfill({contentType:'text/html',body:`<!doctype html><meta charset=utf-8><style>body{margin:0;padding:12px;background:#fffdf8;color:#173e5c;font:12px system-ui}#t{display:flex;gap:14px;margin-bottom:10px;min-height:60px}.mini{width:44px;height:56px;background:#fff1dc}#g{display:grid;grid-template-columns:repeat(4,320px);gap:12px}.slot{width:320px;height:320px;background:#fff1dc}p{margin:3px 0;text-align:center}</style><div id=t></div><div id=g></div><script type=module>import{mountAvatar}from'./src/avatar-static.js?expansion-proof=1';window.mountAvatar=mountAvatar;window.controllers=[];window.manifest=await fetch('./assets/art/manifest.json?expansion-proof=1').then(r=>r.json());window.ready=true;</script>`}));
 await page.goto(new URL('avatar-expansion-proof',base).href);await page.waitForFunction(()=>window.ready);
 for(const [group,cases] of [['hair',hair],['outfits',outfits],['eyewear',eyewear]])for(let offset=0;offset<cases.length;offset+=12){
  const subset=cases.slice(offset,offset+12);
  await page.evaluate(async cases=>{
   controllers.forEach(c=>c.dispose());controllers=[];g.replaceChildren();t.replaceChildren();
   for(const avatar of cases){
    const card=document.createElement('div'),slot=document.createElement('div'),label=document.createElement('p');slot.className='slot';slot.tabIndex=0;slot.dataset.case=avatar.id;label.textContent=avatar.id;card.append(slot,label);g.append(card);controllers.push(mountAvatar(slot,{avatar,manifest}));
    const mini=document.createElement('div');mini.className='mini';mini.dataset.case=avatar.id;t.append(mini);controllers.push(mountAvatar(mini,{avatar,manifest}));
   }
   await Promise.all(controllers.map(c=>c.ready));await Promise.all([...document.images].map(im=>im.decode()));
  },subset);
  const result=await page.evaluate(()=>{
   window.alphaBounds??=new Map();const painted=[];
   for(const slot of document.querySelectorAll('.slot')){
    const stage=slot.querySelector('.hzn-avatar-static-stage').getBoundingClientRect();
    for(const node of slot.querySelectorAll('[data-static-part="hair"]')){
     const im=node.querySelector('img'),f=JSON.parse(node.dataset.nativeFrame),key=im.src+JSON.stringify(f);let b=alphaBounds.get(key);
     if(!b){const canvas=document.createElement('canvas');canvas.width=f.w;canvas.height=f.h;const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.drawImage(im,f.x,f.y,f.w,f.h,0,0,f.w,f.h);const data=ctx.getImageData(0,0,f.w,f.h).data;let minX=f.w,minY=f.h,maxX=-1,maxY=-1;for(let y=0;y<f.h;y++)for(let x=0;x<f.w;x++)if(data[(y*f.w+x)*4+3]>32){minX=Math.min(minX,x);minY=Math.min(minY,y);maxX=Math.max(maxX,x);maxY=Math.max(maxY,y);}b={minX,minY,maxX,maxY};alphaBounds.set(key,b);}
     const r=node.getBoundingClientRect(),scale=r.width/f.w,extent={left:(r.left-stage.left+b.minX*scale)/stage.width*320,right:(r.left-stage.left+(b.maxX+1)*scale)/stage.width*320,top:(r.top-stage.top+b.minY*scale)/stage.height*320};
     painted.push({case:slot.dataset.case,...extent,pass:extent.left>=-.5&&extent.right<=320.5&&extent.top>=-.5});
    }
   }
   const images=[...document.images].map(im=>{const r=im.getBoundingClientRect();return{loaded:im.complete&&im.naturalWidth>0,uniform:Math.abs(r.width/im.naturalWidth-r.height/im.naturalHeight)<.0001};});
   return{painted,images:images.length,loaded:images.every(x=>x.loaded),uniform:images.every(x=>x.uniform),animations:document.getAnimations().length,ready:[...document.querySelectorAll('[data-avatar-render=static]')].every(x=>x.dataset.ready==='true')};
  });
  const file=path.join(out,`${group}-sheet-${offset/12+1}.png`);await page.screenshot({path:file,fullPage:true});report.proofs.push({group,path:file,sha256:hash(fs.readFileSync(file)),cases:subset,structural:result});
  assert.equal(result.loaded,true);assert.equal(result.uniform,true);assert.equal(result.animations,0);assert.equal(result.ready,true);assert.ok(result.painted.every(x=>x.pass),'Painted hair clipping '+JSON.stringify(result.painted.filter(x=>!x.pass)));
 }
 const before=await page.screenshot();await page.locator('.slot').first().hover();await page.locator('.slot').first().focus();await page.evaluate(()=>controllers.forEach(c=>{c.setMood('celebrate');c.play();c.seek(1000);}));await page.waitForTimeout(1250);await page.mouse.move(1340,1110);await page.locator('.slot').first().blur();const after=await page.screenshot();
 report.checks.push({name:'All new sources loaded at a uniform scale and new hair painted extents fit the portrait canvas',cases:hair.length+outfits.length+eyewear.length,pass:true});
 report.checks.push({name:'Still images remain unchanged after waiting, hover, focus and inert legacy control methods',pass:hash(before)===hash(after)});
 assert.equal(hash(before),hash(after));
 await page.evaluate(async paths=>Promise.all(paths.map(async rel=>{const im=new Image();im.src=new URL(rel,document.baseURI).href;await im.decode();})),[...nativePaths]);
 report.sourceStable=sources.every(rel=>hash(bytes(rel))===sourceHashes[rel]);assert.ok(report.sourceStable);
 await Promise.all(pending);report.loadedByteBinding={files:sources.map(file=>({file,expected:sourceHashes[file],observations:loadedHashes[file]||[]})),pass:true};for(const f of report.loadedByteBinding.files){assert.ok(f.observations.length,f.file+' not loaded');for(const observation of f.observations){assert.equal(observation.status,200);assert.equal(observation.sha256,f.expected,f.file+' mismatch');}}
 report.structuralPass=!report.errors.length;report.status='STRUCTURAL_PASS_VISUAL_REVIEW_PENDING';
}catch(error){report.status='FAIL';report.failure=error.message;try{await page.screenshot({path:path.join(out,'failure.png'),fullPage:true});}catch{}}
finally{await browser.close();fs.mkdirSync(path.dirname(reportFile),{recursive:true});fs.writeFileSync(reportFile,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({status:report.status,structuralPass:report.structuralPass,visualVerdict:report.visualVerdict,sheets:report.proofs.length,cases:report.proofs.reduce((n,p)=>n+p.cases.length,0),errors:report.errors,failure:report.failure||null,out,reportFile}));if(!report.structuralPass)process.exitCode=1;}
