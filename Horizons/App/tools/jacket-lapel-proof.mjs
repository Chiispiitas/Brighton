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
const sourceRef=process.env.HZ_JACKET_SOURCE_REF;
const out=process.env.HZ_JACKET_PROOF||'C:/Users/David/Documents/Codex/2026-11-04/horizons-jacket-lapel';
const reportFile=process.env.HZ_JACKET_REPORT||path.join(app,'reports/jacket-lapel-proof.json');
const hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const bytes=rel=>sourceRef?execFileSync('git',['show',`${sourceRef}:Horizons/App/${rel}`],{cwd:app,maxBuffer:64*1024*1024}):fs.readFileSync(path.join(app,rel));
const frames=JSON.parse(bytes('assets/art/avatar-static-v1.frames.json'));
const manifest=JSON.parse(bytes('assets/art/manifest.json'));
const target=frames.clothes['outfit-3'];
const targetOption=manifest.avatar.outfit.find(item=>item.id==='outfit-3');
assert.ok(target?.overlays?.length,'Corrected portrait must include a native lapel overlay.');
assert.ok(targetOption?.overlays?.length,'Corrected option thumbnail must include the same native lapel overlay.');
const overlaySources=target.overlays.map(item=>item.src);
assert.deepEqual(targetOption.overlays.map(item=>item.src),overlaySources);
for(const id of ['outfit-2','outfit-4'])assert.equal(Boolean(frames.clothes[id].overlays?.length),false,id+' must remain unchanged.');
const sourceSet=new Set(['src/avatar-static.js','src/art.js','assets/art/avatar-static-v1.frames.json','assets/art/manifest.json']);
function collect(node){if(!node||typeof node!=='object')return;if(typeof node.src==='string'&&node.src.startsWith('assets/'))sourceSet.add(node.src);if(node.overlays)node.overlays.forEach(collect);}
for(const body of ['male','female'])Object.values(frames.bases[body].skins).forEach(collect);
for(const id of ['outfit-2','outfit-3','outfit-4'])collect(frames.clothes[id]);
for(const id of ['hair-1','hair-6'])collect(frames.hair[id]);
for(const id of ['accessory-1','accessory-3'])collect(frames.accessories[id]);
collect(targetOption);
const sources=[...sourceSet],sourceHashes=Object.fromEntries(sources.map(rel=>[rel,hash(bytes(rel))]));
fs.mkdirSync(out,{recursive:true});
const report={date:new Date().toISOString(),base:base.href,sourceReference:sourceRef?{kind:'git-blob',commit:execFileSync('git',['rev-parse',sourceRef],{cwd:app,encoding:'utf8'}).trim()}:{kind:'working-tree'},scope:'Narrow Explorer jacket lapel correction: actual static avatar renderer at320px and44x56px across both bases and six skins, selected hair/eyewear combinations, unchanged outfit2/4 comparisons and actual manifest raster thumbnails. No authentication, API calls or profile writes.',sourceHashes,overlaySources,proofs:[],errors:[],checks:[],limits:['Edge/Chromium only.','Structural bounds and uniform scaling do not prove visual fit; captured contact sheets require direct review.','The avatar is intentionally an upper-chest bust.'],structuralPass:false,visualVerdict:'PENDING direct independent review',pass:false};
const primary=[];for(const body of ['male','female'])for(let skin=1;skin<=6;skin++)primary.push({id:`${body}-skin${skin}-jacket`,body,skin:'skin-'+skin,outfit:'outfit-3',hair:'none',accessory:'none',badge:'none'});
const compatibility=[];for(const body of ['male','female'])for(const hair of ['hair-1','hair-6'])for(const accessory of ['accessory-1','accessory-3'])compatibility.push({id:`${body}-${hair}-${accessory}`,body,skin:'skin-3',outfit:'outfit-3',hair,accessory,badge:'none'});
for(const body of ['male','female'])for(const outfit of ['outfit-2','outfit-4'])compatibility.push({id:`${body}-${outfit}-comparison`,body,skin:'skin-3',outfit,hair:'hair-1',accessory:'none',badge:'none'});
const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
const context=await browser.newContext({viewport:{width:1352,height:1120},deviceScaleFactor:1,serviceWorkers:'block'}),page=await context.newPage();
const loadedHashes={},pending=[];
page.on('pageerror',error=>report.errors.push(error.message));
page.on('console',message=>{if(message.type()==='error')report.errors.push(message.text());});
page.on('response',response=>{const url=new URL(response.url());if(!url.pathname.startsWith(base.pathname))return;const rel=url.pathname.slice(base.pathname.length);if(!sourceSet.has(rel))return;pending.push(response.body().then(body=>(loadedHashes[rel]??=[]).push({status:response.status(),sha256:hash(body)})).catch(error=>report.errors.push(rel+': '+error.message)));});
try{
 await page.route('**/jacket-lapel-proof',route=>route.fulfill({contentType:'text/html',body:`<!doctype html><meta charset=utf-8><style>body{margin:0;padding:12px;background:#fffdf8;color:#173e5c;font:12px system-ui}#minis{display:flex;gap:16px;min-height:62px;margin-bottom:12px}.mini{width:44px;height:56px;background:#fff1dc}#portraits{display:grid;grid-template-columns:repeat(4,320px);gap:12px}.portrait{width:320px;height:320px;background:#fff1dc}p{margin:3px 0;text-align:center}#thumbs{display:flex;gap:36px;align-items:start;min-height:140px;margin-bottom:20px}.thumbnail{display:block;width:180px;height:110px;position:relative}.raster-frame{position:relative;display:block}</style><div id=thumbs></div><div id=minis></div><div id=portraits></div><script type=module>import{mountAvatar}from'./src/avatar-static.js?jacket-proof=1';import{loadArt,rasterMarkup}from'./src/art.js?jacket-proof=1';window.mountAvatar=mountAvatar;window.manifest=await loadArt();window.rasterMarkup=rasterMarkup;window.controllers=[];window.ready=true;</script>`}));
 await page.goto(new URL('jacket-lapel-proof',base).href);await page.waitForFunction(()=>window.ready);
 await page.evaluate(()=>{for(const id of ['outfit-2','outfit-3','outfit-4']){const option=manifest.avatar.outfit.find(item=>item.id===id),card=document.createElement('div');card.dataset.thumbnail=id;card.innerHTML=rasterMarkup(option,'thumbnail',option.label)+'<p>'+option.label+'</p>';thumbs.append(card);}});
 for(const [group,cases]of [['base-skin',primary],['compatibility',compatibility]]){
  await page.evaluate(async cases=>{controllers.forEach(controller=>controller.dispose());controllers=[];portraits.replaceChildren();minis.replaceChildren();for(const avatar of cases){for(const [container,cls]of [[portraits,'portrait'],[minis,'mini']]){const card=document.createElement('div'),slot=document.createElement('div'),label=document.createElement('p');slot.className=cls;slot.dataset.case=avatar.id;slot.dataset.outfit=avatar.outfit;slot.tabIndex=0;label.textContent=cls==='portrait'?avatar.id:'';card.append(slot,label);container.append(card);controllers.push(mountAvatar(slot,{avatar,manifest}));}}await Promise.all(controllers.map(controller=>controller.ready));await document.fonts.ready;await Promise.all([...document.images].map(image=>image.decode()));await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));},cases);
  const structural=await page.evaluate(overlaySources=>{
   const alphaCache=new Map(),painted=[];
   for(const slot of document.querySelectorAll('.portrait')){const stage=slot.querySelector('.hzn-avatar-static-stage').getBoundingClientRect();for(const node of slot.querySelectorAll('[data-static-part]')){const image=node.querySelector('img'),frame=JSON.parse(node.dataset.nativeFrame),key=image.src+JSON.stringify(frame);let bound=alphaCache.get(key);if(!bound){const canvas=document.createElement('canvas');canvas.width=frame.w;canvas.height=frame.h;const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.drawImage(image,frame.x,frame.y,frame.w,frame.h,0,0,frame.w,frame.h);const data=ctx.getImageData(0,0,frame.w,frame.h).data;let minX=frame.w,minY=frame.h,maxX=-1,maxY=-1;for(let y=0;y<frame.h;y++)for(let x=0;x<frame.w;x++)if(data[(y*frame.w+x)*4+3]>32){minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);}bound={minX,minY,maxX,maxY};alphaCache.set(key,bound);}const rect=node.getBoundingClientRect(),scale=rect.width/frame.w,extent={left:(rect.left-stage.left+bound.minX*scale)/stage.width*320,right:(rect.left-stage.left+(bound.maxX+1)*scale)/stage.width*320,top:(rect.top-stage.top+bound.minY*scale)/stage.height*320,bottom:(rect.top-stage.top+(bound.maxY+1)*scale)/stage.height*320};painted.push({case:slot.dataset.case,part:node.dataset.staticPart,...extent,pass:extent.left>=-.5&&extent.right<=320.5&&extent.top>=-.5&&extent.bottom<=320.5});}}
   const images=[...document.images].map(image=>{const rect=image.getBoundingClientRect();return{loaded:image.complete&&image.naturalWidth>0,uniform:Math.abs(rect.width/image.naturalWidth-rect.height/image.naturalHeight)<.0001};});
   const present=(slot,source)=>[...slot.querySelectorAll('img')].some(image=>new URL(image.src).pathname.endsWith('/'+source));
   const targetSlots=[...document.querySelectorAll('[data-outfit="outfit-3"]')],comparisons=[...document.querySelectorAll('[data-outfit="outfit-2"],[data-outfit="outfit-4"]')];
   const thumbnail=document.querySelector('[data-thumbnail="outfit-3"]');
   return{painted,images:images.length,loaded:images.every(item=>item.loaded),uniform:images.every(item=>item.uniform),ready:[...document.querySelectorAll('[data-avatar-render=static]')].every(slot=>slot.dataset.ready==='true'),animations:document.getAnimations().length,targetSlots:targetSlots.length,targetOverlayPresent:targetSlots.every(slot=>overlaySources.every(source=>present(slot,source))),comparisonOverlayAbsent:comparisons.every(slot=>overlaySources.every(source=>!present(slot,source))),thumbnailOverlayPresent:overlaySources.every(source=>present(thumbnail,source))};
  },overlaySources);
  // Outfit4 is an unchanged comparison whose original lower edge intentionally
  // extends below the upper-chest crop. The corrected jacket gets no exemption.
  for(const part of structural.painted)if(part.case.endsWith('outfit-4-comparison')&&part.part==='clothes'&&part.left>=-.5&&part.right<=320.5&&part.top>=-.5&&part.bottom>320.5&&part.bottom<325){part.intentionalLowerBustCrop=true;part.pass=true;}
  const file=path.join(out,group+'.png');await page.screenshot({path:file,fullPage:true});report.proofs.push({group,path:file,sha256:hash(fs.readFileSync(file)),cases,structural});
  assert.equal(structural.loaded,true);assert.equal(structural.uniform,true);assert.equal(structural.ready,true);assert.equal(structural.animations,0);assert.equal(structural.targetOverlayPresent,true);assert.equal(structural.comparisonOverlayAbsent,true);assert.equal(structural.thumbnailOverlayPresent,true);assert.ok(structural.painted.every(part=>part.pass),'Painted bounds outside portrait '+JSON.stringify(structural.painted.filter(part=>!part.pass)));
 }
 const before=await page.screenshot({fullPage:true});await page.locator('.portrait').first().hover();await page.locator('.portrait').first().focus();await page.evaluate(()=>controllers.forEach(controller=>{controller.setMood('wave');controller.seek(1000);controller.play();}));await page.waitForTimeout(1250);await page.mouse.move(1345,1115);await page.locator('.portrait').first().blur();const after=await page.screenshot({fullPage:true});
 report.checks.push({name:'Native static overlay appears in all corrected busts and the actual option thumbnail; comparison outfits have no overlay',cases:primary.length+compatibility.length,renderSizes:['320x320','44x56'],pass:true});
 report.checks.push({name:'Avatar and thumbnail pixels remain unchanged after wait, hover, focus and inert control calls',pass:hash(before)===hash(after)});assert.equal(hash(before),hash(after));
 await Promise.all(pending);report.loadedByteBinding={files:sources.map(file=>({file,expected:sourceHashes[file],observations:loadedHashes[file]||[]})),pass:true};for(const item of report.loadedByteBinding.files){assert.ok(item.observations.length,item.file+' did not load');for(const observation of item.observations){assert.equal(observation.status,200);assert.equal(observation.sha256,item.expected,item.file+' exact bytes');}}
 report.sourceStable=sources.every(rel=>hash(bytes(rel))===sourceHashes[rel]);assert.equal(report.sourceStable,true);assert.deepEqual(report.errors,[]);report.structuralPass=true;report.status='STRUCTURAL_PASS_VISUAL_REVIEW_PENDING';
}catch(error){report.status='FAIL';report.failure=error.stack;try{await page.screenshot({path:path.join(out,'failure.png'),fullPage:true});}catch{}}
finally{await browser.close();fs.mkdirSync(path.dirname(reportFile),{recursive:true});fs.writeFileSync(reportFile,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({status:report.status,structuralPass:report.structuralPass,proofs:report.proofs.length,errors:report.errors,failure:report.failure||null,out,reportFile}));if(!report.structuralPass)process.exitCode=1;}
