import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {activities,vocabulary} from '../content/unit1.mjs';
import {getActivityQuestions} from '../content/engine.mjs';
const require=createRequire(import.meta.url),{chromium}=require('C:/Users/David/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const app=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const phase=process.env.HZ_GRAPHICS_PHASE||'local';
const base=process.env.HZ_APP_URL||'https://exams.bebrighton.net/Horizons/App/';
const out=process.env.HZ_GRAPHICS_PROOF||`C:/Users/David/Documents/Codex/2026-11-04/horizons-app-graphics/${phase}`;
const questionPool=activities.flatMap(activity=>getActivityQuestions(activity.id,{count:'all',seed:'graphics-reference'}));
const artManifest=JSON.parse(fs.readFileSync(path.join(app,'assets/art/manifest.json'),'utf8'));
fs.mkdirSync(out,{recursive:true});
const report={date:new Date().toISOString(),phase,base,scope:'Independent graphics and motion audit; reserved QA006, actual deployed backend, no public001 use',widths:[320,390,768,1440],screens:[],runtimeErrors:[],failures:[],visualReview:[],limits:['Chromium/Edge automation; other browser engines are not claimed tested.','Measured DOM clipping uses generated part viewports, then representative screenshots receive a separate visual review.','The learner avatar intentionally ends at the chest; this requested bust boundary is not an accidental crop.']};
const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
const context=await browser.newContext({viewport:{width:1440,height:1000},timezoneId:'America/Bogota'}),p=await context.newPage();
p.on('pageerror',error=>report.runtimeErrors.push(error.message));
const settle=async()=>{await p.waitForTimeout(180);await p.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.images].map(im=>im.complete?null:new Promise(resolve=>{im.onload=im.onerror=resolve;})));});};
const nav=async route=>{await p.locator(`[data-route=${route}]:visible`).first().click();await settle();};
async function inspect(name,{screenshot=false}={}){
 await settle();
 if(screenshot)await p.waitForTimeout(750);
 const details=await p.evaluate(()=>{
  const rect=r=>({left:r.left,top:r.top,right:r.right,bottom:r.bottom,width:r.width,height:r.height});
  const visible=e=>{const r=e.getBoundingClientRect(),s=getComputedStyle(e);return r.width>0&&r.height>0&&s.display!=='none'&&s.visibility!=='hidden';};
  const graphics=[...document.images].filter(visible).map(im=>{const s=getComputedStyle(im),width=parseFloat(s.width),height=parseFloat(s.height),nativeRatio=im.naturalWidth/im.naturalHeight,ratio=width/height;return{source:im.getAttribute('src'),context:im.closest('[data-character]')?.dataset.character||im.closest('.avatar')?.className||im.closest('.raster-frame')?.className||im.parentElement?.className,width,height,nativeRatio,ratio,deformation:Math.abs(ratio/nativeRatio-1),loaded:im.naturalWidth>0};});
  const deformed=graphics.filter(g=>g.loaded&&g.deformation>.015);
  const characters=[...document.querySelectorAll('.character,.avatar:not(.avatar-initial),[data-occupation-character],[data-illustration-motion]')].filter(visible).map(el=>{const motion=el.getAnimations({subtree:true}).map(a=>({name:a.animationName||a.id||a.constructor.name,target:a.effect?.target?.className||'',part:a.effect?.target?.dataset?.rigPart||a.effect?.target?.closest?.('[data-rig-part]')?.dataset?.rigPart||null,properties:[...new Set(a.effect?.getKeyframes().flatMap(k=>Object.keys(k).filter(x=>!['offset','computedOffset','easing','composite'].includes(x)))||[])],playState:a.playState}));const b=el.getBoundingClientRect();return{name:el.dataset.character||el.dataset.occupationCharacter||(el.dataset.illustrationMotion?'occupation:'+JSON.parse(el.dataset.illustrationMotion).id:'avatar'),className:el.className,rect:rect(b),inViewport:b.bottom>0&&b.top<innerHeight&&b.right>0&&b.left<innerWidth,motion,rigParts:el.querySelectorAll('[data-rig-part],.p2-joint').length,poseFrames:el.dataset.illustrationMotion?JSON.parse(el.dataset.illustrationMotion).frames.length:el.querySelectorAll('[data-pose-frame],.occupation-pose').length,intentionalCrop:el.dataset.intentionalCrop||el.querySelector('[data-intentional-crop]')?.dataset.intentionalCrop||null,internalMotionTargets:[...new Set(motion.filter(a=>a.target!==el.className).map(a=>a.part||a.target))]};});
  const clipped=[];
  for(const ch of document.querySelectorAll('.character')){
   if(!visible(ch))continue;
   const parts=[...ch.querySelectorAll('.p2-pixels,.human-pixels,[data-rig-part],.raster-native,.raster-crop')].filter(visible);
   const boxes=parts.length?parts:[ch.querySelector('.character-art')||ch];
   for(const part of boxes){const r=part.getBoundingClientRect();let a=ch.parentElement;while(a&&a!==document.body&&a!==document.documentElement){const s=getComputedStyle(a),b=a.getBoundingClientRect();const x=['hidden','clip'].includes(s.overflowX),y=['hidden','clip'].includes(s.overflowY);if((x&&(r.left<b.left-2||r.right>b.right+2))||(y&&(r.top<b.top-2||r.bottom>b.bottom+2))){clipped.push({character:ch.dataset.character,part:part.className,ancestor:a.className,partRect:rect(r),clipRect:rect(b)});}a=a.parentElement;}}
  }
  const intersections=[];
  for(const ch of document.querySelectorAll('.character')){
   if(!visible(ch))continue;const parts=[...ch.querySelectorAll('.p2-pixels,.human-pixels,.raster-fit')].filter(visible);const boxes=(parts.length?parts:[ch]).map(part=>({part:part.className,box:part.getBoundingClientRect()}));
   for(const t of document.querySelectorAll('h1,h2,h3,p,.stop-label,.answer-feedback,.game-intro>p')){
    if(!visible(t)||ch.contains(t)||t.contains(ch))continue;const walker=document.createTreeWalker(t,NodeFilter.SHOW_TEXT),lines=[];let node;while(node=walker.nextNode()){if(!node.textContent.trim())continue;const range=document.createRange();range.selectNodeContents(node);lines.push(...range.getClientRects());}
    for(const {part,box:r} of boxes)for(const b of lines){const w=Math.min(r.right,b.right)-Math.max(r.left,b.left),h=Math.min(r.bottom,b.bottom)-Math.max(r.top,b.top);if(w>3&&h>3)intersections.push({character:ch.dataset.character,part,text:t.textContent.trim().slice(0,100),graphic:rect(r),textRect:rect(b),area:w*h});}
   }
  }
  const lessons=[...document.querySelectorAll('.path-lesson')].map(el=>{const orbs=[...el.querySelectorAll('.stop-orb')].map(e=>{const r=e.getBoundingClientRect();return{x:r.left+r.width/2,y:r.top+r.height/2};});const gaps=orbs.slice(1).map((r,i)=>r.y-orbs[i].y);return{id:el.querySelector('h2')?.id,height:el.getBoundingClientRect().height,stops:orbs.length,orbs,gapMin:Math.min(...gaps),gapMax:Math.max(...gaps)};});
  return{viewport:{width:innerWidth,height:innerHeight,scrollWidth:document.documentElement.scrollWidth,scrollHeight:document.documentElement.scrollHeight},graphicsCount:graphics.length,deformed,broken:graphics.filter(g=>!g.loaded),characters,clipped,intersections,lessons};
 });
 const entry={name,...details};
 if(screenshot){const file=path.join(out,`${name}.png`);await p.screenshot({path:file,fullPage:false});entry.screenshot=file;}
 report.screens.push(entry);
 console.log(JSON.stringify({screen:name,graphics:details.graphicsCount,deformed:details.deformed.length,clipCandidates:details.clipped.length,overlapCandidates:details.intersections.length}));
 return entry;
}
async function leave(){if(await p.locator('[data-action=leave-activity]').count()){await p.locator('[data-action=leave-activity]').click();await p.locator('[data-leave-confirm]').click();}else if(await p.locator('[data-action=back-to-path]').count())await p.locator('[data-action=back-to-path]').click();await settle();}
async function launch(activity){await nav('learn');const locator=activity.type==='quiz'?p.locator(`[data-start-chunk="${activity.chunkIds[0]}"]`):p.locator(`[data-start-activity="${activity.id}"]`).last();await locator.click();await settle();}
async function feedbackAndResult(){
 await launch(activities.find(activity=>activity.id==='quiz-1a-greetings'));
 for(let i=0;i<20&&!await p.locator('.result-page').count();i++){
  const options=await p.locator('[data-choice]').evaluateAll(nodes=>nodes.map(node=>({id:node.dataset.choice,text:node.querySelector(':scope>span:last-of-type')?.textContent.trim()})));
  if(!options.length)throw Error('The greeting round unexpectedly lost its choice controls');
  const id=options[0].id.replace(/-option-\d+$/,''),ref=questionPool.find(q=>q.id===id);
  if(!ref)throw Error('No reviewed reference for '+id);
  const choice=options.find(option=>i===0?option.text!==ref.correctText:option.text===ref.correctText);
  await p.locator(`[data-choice="${choice.id}"]`).click();await p.locator('[data-action=check-answer]').click();
  if(i<2)await inspect(i?'feedback-correct-390':'feedback-gentle-390',{screenshot:true});
  await p.locator('[data-action=next-question]').click();
 }
 await p.locator('.result-page').waitFor();await p.locator('.save-note').filter({hasText:/^Saved\./}).waitFor({timeout:45000});
 await inspect('result-390',{screenshot:true});await leave();
}
try{
 await p.goto(base,{waitUntil:'domcontentloaded'});
 for(const width of report.widths){await p.setViewportSize({width,height:width<768?844:1000});await inspect(`welcome-${width}`,{screenshot:true});}
 await p.locator('#book-code').fill('DEMO-HZ-A1-006');await p.locator('#redeem-form [type=submit]').click();await p.locator('.app-shell').waitFor({timeout:45000});
 for(const width of report.widths){await p.setViewportSize({width,height:width<768?844:1000});for(const route of ['learn','practice','bank','progress','profile']){if(route==='bank'){await nav('practice');await p.locator('[data-action=word-bank]').first().click();}else await nav(route);await inspect(`${route}-${width}`,{screenshot:true});}
  await p.locator('[data-action=books]').first().click();await inspect(`books-dialog-${width}`,{screenshot:true});await p.locator('[data-dialog-close]').first().click();
  await nav('practice');await p.locator('[data-action=word-bank]').first().click();await p.locator('[data-word="v-jobs-teacher"]').click();await inspect(`word-dialog-${width}`,{screenshot:true});await p.locator('[data-dialog-close]').first().click();
 }
 for(const width of report.widths){await p.setViewportSize({width,height:width<768?844:1000});for(const [i,activity]of activities.entries()){await launch(activity);await inspect(`activity-${activity.id}-${width}`,{screenshot:['quiz-1b-jobs-town','practice-1a-be','1a-greeting-pairs','1b-duty-board','listen-1d','read-1c'].includes(activity.id)});await leave();}}
 if(phase!=='baseline'){
  for(const width of [390,1440]){await p.setViewportSize({width,height:width<768?844:1000});await nav('practice');await p.locator('[data-action=word-bank]').first().click();
   for(const word of vocabulary.filter(word=>artManifest.vocabulary?.[word.term]||artManifest.vocabulary?.[word.id])){await p.locator(`[data-word="${word.id}"]`).click();await inspect(`illustration-${word.id}-${width}`,{screenshot:width===390&&['teacher','doctor','actor','salesclerk'].includes(word.term)});await p.locator('[data-dialog-close]').first().click();}
  }
  await p.setViewportSize({width:390,height:844});await nav('profile');const choices=await p.locator('[data-avatar-group]').evaluateAll(nodes=>Object.fromEntries(['skin','outfit','hair','accessory'].map(group=>[group,nodes.filter(node=>node.dataset.avatarGroup===group&&!node.disabled).map(node=>node.dataset.avatarValue)])));
  for(let i=0;i<7;i++){for(const[group,options]of Object.entries(choices)){if(options.length)await p.locator(`[data-avatar-group="${group}"][data-avatar-value="${options[i%options.length]}"]`).click();}await p.evaluate(()=>scrollTo(0,0));await inspect(`avatar-combination-${i+1}`,{screenshot:true});}
  await feedbackAndResult();
 }
 await p.setViewportSize({width:390,height:844});await nav('learn');for(const lesson of ['1A','1B','1C','1D']){await p.locator(`[data-jump="${lesson}"]`).click();await p.waitForTimeout(500);await inspect(`path-jump-${lesson}`,{screenshot:true});}
 await context.grantPermissions([]);
 await p.emulateMedia({reducedMotion:'reduce'});await nav('learn');await p.waitForTimeout(250);const reduced=await p.evaluate(()=>({matches:matchMedia('(prefers-reduced-motion:reduce)').matches,remaining:[...document.querySelectorAll('.character,.avatar')].flatMap(e=>e.getAnimations({subtree:true}).filter(a=>a.playState==='running').map(a=>({name:a.animationName,target:a.effect?.target?.className,duration:a.effect?.getTiming().duration})))}));report.reducedMotion=reduced;await p.emulateMedia({reducedMotion:'no-preference'});
 report.failures=report.screens.flatMap(s=>[...(s.deformed.length?[{screen:s.name,type:'native image deformation',count:s.deformed.length}]:[]),...(s.broken.length?[{screen:s.name,type:'unloaded image',count:s.broken.length}]:[]),...(s.viewport.scrollWidth>s.viewport.width+1?[{screen:s.name,type:'horizontal overflow',count:s.viewport.scrollWidth-s.viewport.width}]:[])]);
 report.motionAudit=report.screens.flatMap(s=>s.characters.filter(ch=>ch.inViewport).map(ch=>({screen:s.name,name:ch.name,parts:ch.rigParts,internalMotionTargets:ch.internalMotionTargets,poseFrames:ch.poseFrames,animated:ch.internalMotionTargets.length>=2||ch.poseFrames>=2&&ch.motion.length>0})));
 report.uniqueCompanionMotion=Object.fromEntries(['pico','mina','alex','jo'].map(name=>[name,[...new Set(report.screens.filter(s=>s.name.startsWith('welcome-')).flatMap(s=>s.characters.filter(ch=>ch.name===name).flatMap(ch=>ch.motion.map(m=>m.name))))]]));
 if(phase!=='baseline'&&report.motionAudit.some(ch=>!ch.animated))report.failures.push({type:'visible character lacks internal gesture/expression animation',instances:report.motionAudit.filter(ch=>!ch.animated)});
 if(report.runtimeErrors.length)report.failures.push({type:'runtime errors',count:report.runtimeErrors.length});
 report.pass=report.failures.length===0;
}catch(error){report.pass=false;report.error=error.stack;console.log(error.stack);}
finally{fs.writeFileSync(path.join(app,'reports/graphics-browser.json'),JSON.stringify(report,null,2));fs.writeFileSync(path.join(out,'graphics-browser.json'),JSON.stringify(report,null,2));await browser.close();console.log(JSON.stringify({pass:report.pass,screens:report.screens.length,failures:report.failures.length,proof:out}));if(!report.pass&&phase!=='baseline')process.exitCode=1;}
