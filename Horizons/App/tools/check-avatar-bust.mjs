import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
const require=createRequire(import.meta.url),{chromium}=require('C:/Users/David/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const app=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const out=process.env.HZ_AVATAR_PROOF||'C:/Users/David/Documents/Codex/2026-11-04/horizons-avatar-anatomy';
fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
const page=await browser.newPage({viewport:{width:1740,height:1500}}),errors=[];
page.on('pageerror',error=>errors.push(error.message));
await page.goto(new URL('reports/avatar-bust-proof.html',process.env.HZ_APP_URL||'http://127.0.0.1:8894/Horizons/App/').href);
await page.waitForFunction(()=>document.querySelectorAll('[data-avatar-bust][data-ready]').length===21);
await page.evaluate(async()=>{await Promise.all([...document.images].map(image=>image.decode()));for(const element of document.querySelectorAll('.hzn-avatar-body,.hzn-avatar-eyes'))element.style.animationDelay='0s';});
const phases=[0,800,2000,3400],screenshots=[];
for(const phase of phases){
 await page.evaluate(time=>{for(const animation of document.getAnimations()){animation.pause();animation.currentTime=time;}},phase);
 await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
 const file=`all-combinations-${phase}ms.png`;
 await page.screenshot({path:path.join(out,file),fullPage:true});screenshots.push(file);
}
await page.evaluate(()=>{for(const animation of document.getAnimations()){animation.pause();animation.currentTime=0;}for(const element of document.querySelectorAll('.hzn-avatar-eyes'))for(const animation of element.getAnimations())animation.currentTime=parseFloat(getComputedStyle(element).animationDuration)*1000*.355;});
await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
const closedEyes=await page.locator('.hzn-avatar-eyes').evaluateAll(items=>items.every(element=>Number(getComputedStyle(element).opacity)>.99));
await page.screenshot({path:path.join(out,'all-combinations-blink.png'),fullPage:true});screenshots.push('all-combinations-blink.png');
const geometry=await page.locator('.hzn-avatar-bust').evaluateAll(items=>items.map(element=>{
 const body=element.querySelector('.hzn-avatar-body'),head=element.querySelector('.hzn-avatar-head'),torso=element.querySelector('.hzn-avatar-torso'),gesture=element.querySelector('[data-rig-part="gesture-arm"]');
 return{posture:element.dataset.posture,personality:element.dataset.personality,bodyMotion:getComputedStyle(body).animationName,blink:getComputedStyle(element.querySelector('.hzn-avatar-eyes')).animationName,connectedGesture:gesture?.dataset.anatomy||null,commonBody:head.parentNode===body&&torso.parentNode===body&&(!gesture||gesture.parentNode===body),independentHeadMotion:getComputedStyle(head).animationName,independentTorsoMotion:getComputedStyle(torso).animationName,detachedParts:element.querySelectorAll('[data-rig-part="forearm"],[data-rig-part="hand"]').length};
}));
const nativeScale=await page.locator('.hzn-avatar-pixels').evaluateAll(items=>items.map(element=>{const image=element.querySelector('img'),atlas=JSON.parse(element.dataset.nativeAtlas),frame=JSON.parse(element.dataset.nativeFrame);return{part:element.dataset.rigPart,atlasError:Math.abs(parseFloat(image.style.width)/atlas.width-parseFloat(image.style.height)/atlas.height),frameError:Math.abs(parseFloat(element.style.width)/frame.w-parseFloat(element.style.height)/frame.h)};}));
await page.emulateMedia({reducedMotion:'reduce'});
const reducedMotion=await page.locator('.hzn-avatar-bust').evaluateAll(items=>items.every(element=>getComputedStyle(element.querySelector('.hzn-avatar-body')).animationName==='none'&&getComputedStyle(element.querySelector('.hzn-avatar-eyes')).opacity==='0'));
const structuralPass=errors.length===0&&reducedMotion&&closedEyes&&geometry.every(item=>item.commonBody&&item.independentHeadMotion==='none'&&item.independentTorsoMotion==='none'&&item.detachedParts===0&&item.bodyMotion!=='none'&&(item.posture==='portrait'||item.connectedGesture==='connected-shoulder-elbow-wrist-hand'))&&nativeScale.every(item=>item.atlasError<1e-4&&item.frameError<1e-4);
const report={date:new Date().toISOString(),scope:'21 rendered bust combinations at four phases plus closed eyes; six skin tones/outfits/hairs/accessories, three poses and bald control. Native artwork aspect ratios, common anatomy hierarchy and reduced motion verified.',structuralPass,visualReview:'Required separately: inspect screenshot evidence for face registration, neck/collar join and natural shoulder-to-elbow continuity. Numeric checks alone do not establish anatomy quality.',geometry,reducedMotion,closedEyes,errors,maxNativeScaleError:Math.max(...nativeScale.map(item=>item.atlasError)),maxFrameScaleError:Math.max(...nativeScale.map(item=>item.frameError)),screenshots:screenshots.map(file=>path.join(out,file))};
fs.writeFileSync(path.join(app,'reports/avatar-bust.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({structuralPass,reducedMotion,errors,screenshots:report.screenshots}));
await browser.close();if(!structuralPass)process.exitCode=1;
