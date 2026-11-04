import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {activities,vocabulary} from '../content/unit1.mjs';
import {getActivityQuestions} from '../content/engine.mjs';

const app=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const reportPath=process.env.HZ_ANATOMY_REPORT||path.join(app,'reports/anatomy-integration.json');
const visualPath=process.env.HZ_ANATOMY_REVIEW||path.join(app,'reports/anatomy-review.json');
const base=process.env.HZ_APP_URL||'http://127.0.0.1:8896/Horizons/App/';
const out=process.env.HZ_ANATOMY_PROOF||'C:/Users/David/Documents/Codex/2026-11-04/horizons-anatomy-integration';
const code='DEMO-HZ-A1-010';
const focused=process.argv.includes('--focused');
const widths=[320,390,768,1440],phases=[.10,.355,.60,.825];
const manifest=JSON.parse(fs.readFileSync(path.join(app,'assets/art/manifest.json'),'utf8'));
const expectedNativeCases=[...Object.entries(manifest.postures||{}).flatMap(([name,poses])=>Object.keys(poses).flatMap(pose=>[0,1,2,3].map(frame=>`cast:${name}:${pose}:${frame}`))),...Object.entries(manifest.vocabulary||{}).filter(([,asset])=>asset.animation).flatMap(([name])=>[0,1,2,3].map(frame=>`job:${name}:${frame}`))];
const expectedAvatarCases=Array.from({length:7},(_,combo)=>['portrait','wave','think'].flatMap(posture=>phases.map((_,phase)=>`avatar:combo-${combo+1}:${posture}:phase-${phase}`))).flat();
const questionPool=activities.flatMap(activity=>getActivityQuestions(activity.id,{count:'all',seed:'anatomy-reference'}));
const safe=name=>name.replace(/[^a-zA-Z0-9_.-]/g,'_');
const sha=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const nativeCaseMeta=new Map([...Object.entries(manifest.postures||{}).flatMap(([name,poses])=>Object.entries(poses).flatMap(([pose,asset])=>(asset.animation?.frames||[asset.frame]).map((frame,i)=>[`cast:${name}:${pose}:${i}`,{sourceAsset:asset.src,sourceFrame:frame,sourceSha256:sha(path.join(app,asset.src))}]))),...Object.entries(manifest.vocabulary||{}).filter(([,asset])=>asset.animation).flatMap(([name,asset])=>asset.animation.frames.map((frame,i)=>[`job:${name}:${i}`,{sourceAsset:asset.src,sourceFrame:frame,sourceSha256:sha(path.join(app,asset.src))}]))]);
const runtimeFiles=['index.html','src/art.js','src/avatar-rig.js','src/app.js','styles/app.css','assets/art/manifest.json',...fs.readdirSync(path.join(app,'assets/art')).filter(file=>/^avatar.*\.(png|json)$/.test(file)).map(file=>'assets/art/'+file)].filter(file=>fs.existsSync(path.join(app,file)));
const runtimeHashes=()=>Object.fromEntries(runtimeFiles.map(file=>[file,sha(path.join(app,file))]));
const servedHash=(file,body)=>crypto.createHash('sha256').update(/\.(html|css|js|json|mjs)$/.test(file)?body.toString('utf8').replace(/\r\n/g,'\n'):body).digest('hex');

function visualGate(report){
 let review;try{review=JSON.parse(fs.readFileSync(visualPath,'utf8'));}catch{review=null;}
 const cases=(review?.phase==='baseline'?[]:review?.reviewedCases||[]).filter(item=>item.stage!=='baseline'&&item.phase!=='baseline');
 const byId=new Map(cases.map(item=>[item.id,item]));
 const expected=[...expectedNativeCases,...expectedAvatarCases];
 const missing=expected.filter(id=>!byId.has(id));
 const rejected=expected.filter(id=>byId.has(id)&&byId.get(id).verdict!=='pass').map(id=>({id,verdict:byId.get(id).verdict,notes:byId.get(id).notes}));
 const unsubstantiated=expected.filter(id=>byId.get(id)?.verdict==='pass'&&(!byId.get(id).proof||!byId.get(id).notes||!fs.existsSync(byId.get(id).proof)));
 const stale=expected.filter(id=>{const item=byId.get(id);if(item?.verdict!=='pass')return false;const native=nativeCaseMeta.get(id);if(native)return item.sourceAsset!==native.sourceAsset||item.sourceSha256!==native.sourceSha256||JSON.stringify(item.sourceFrame)!==JSON.stringify(native.sourceFrame);const captured=report.avatarCases.find(item=>item.id===id);return !captured||item.proofSha256!==captured.proofSha256||!fs.existsSync(item.proof)||sha(item.proof)!==captured.proofSha256;});
 const changedRuntime=Object.entries(report.runtimeSources||{}).filter(([file,hash])=>!fs.existsSync(path.join(app,file))||sha(path.join(app,file))!==hash).map(([file])=>file);
 report.visualAnatomy={reviewFile:visualPath,expectedCases:expected.length,reviewedCases:expected.length-missing.length,missing,rejected,unsubstantiated,stale,changedRuntime,pass:expected.length>0&&missing.length===0&&rejected.length===0&&unsubstantiated.length===0&&stale.length===0&&changedRuntime.length===0};
 report.automatedPass=report.structuralFailures.length===0&&report.runtimeErrors.length===0;
 report.pass=report.automatedPass&&report.visualAnatomy.pass;
 report.status=report.pass?'PASS':report.automatedPass?'AUTOMATED_PASS_VISUAL_REVIEW_REQUIRED':'FAIL';
 report.limits=['Automated measurements cannot determine whether a drawing is anatomically sound. The separate per-frame visual verdict is a required gate.','The matrix covers all six skin tones and every free hair/outfit/accessory option through seven configurations; it does not claim visual review of every possible combined avatar.','Chromium/Edge at four viewport widths; other browser engines are not claimed tested.'];
 fs.writeFileSync(reportPath,JSON.stringify(report,null,2));
 return report;
}

if(process.argv.includes('--evaluate-review')){
 const report=visualGate(JSON.parse(fs.readFileSync(reportPath,'utf8')));
 console.log(JSON.stringify({status:report.status,automatedPass:report.automatedPass,visualAnatomy:report.visualAnatomy}));
 process.exitCode=report.pass?0:2;
}else{
 const require=createRequire(import.meta.url),{chromium}=require('C:/Users/David/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
 fs.mkdirSync(out,{recursive:true});
 const report={date:new Date().toISOString(),base,scope:focused?'Focused final regression: every route at four widths, four lesson guides per width,84 avatar states, teacher/student action frames, feedback/result and source-byte verification. Full activity structural evidence is retained separately.':'Site-wide source registration and actual render captures, with a separate mandatory visual anatomy verdict',widths,screenCases:[],avatarCases:[],structuralFailures:[],runtimeErrors:[],sourceCases:expectedNativeCases,runtimeSources:runtimeHashes(),proofFolder:out,apiChecks:[]};
 if(process.env.HZ_PRIOR_ANATOMY_REPORT){const priorPath=process.env.HZ_PRIOR_ANATOMY_REPORT,prior=JSON.parse(fs.readFileSync(priorPath,'utf8')),activityScreens=prior.screenCases.filter(item=>item.name.startsWith('activity-')),changedFiles=Object.entries(prior.runtimeSources).filter(([file,hash])=>sha(path.join(app,file))!==hash).map(([file])=>file);report.priorFullActivitySweep={file:priorPath,date:prior.date,activityScreens:activityScreens.length,widths:prior.widths,runtimeSources:prior.runtimeSources,changedFiles,currentScope:'The192 activity structural checks are retained with their original hashes; final avatar layer order, hair6 crop and all routes are retested independently in this report.'};let isolatedManifest=true;if(changedFiles.includes('assets/art/manifest.json')){try{const snapshot=prior.manifestSnapshot?priorPath+'#manifestSnapshot':process.env.HZ_PRIOR_MANIFEST,old=prior.manifestSnapshot||JSON.parse(fs.readFileSync(snapshot,'utf8'));if(prior.manifestSnapshot){assert.equal(prior.manifestSnapshotProvenance.rawSha256,prior.runtimeSources['assets/art/manifest.json']);assert.equal(crypto.createHash('sha256').update(JSON.stringify(old)).digest('hex'),prior.manifestSnapshotProvenance.structuralSha256);}else assert.equal(sha(snapshot),prior.runtimeSources['assets/art/manifest.json']);const{avatar:oldAvatar,...oldOther}=old,{avatar:newAvatar,...newOther}=manifest;assert.deepEqual(oldOther,newOther);const previous=structuredClone(oldAvatar),current=structuredClone(newAvatar),oldHair=previous.hair.find(item=>item.id==='hair-6'),newHair=current.hair.find(item=>item.id==='hair-6');report.priorFullActivitySweep.hair6Retest={snapshot,previous:{frame:oldHair.frame,position:oldHair.position},current:{frame:newHair.frame,position:newHair.position}};delete oldHair.frame;delete oldHair.position;delete newHair.frame;delete newHair.position;assert.deepEqual(previous,current);}catch(error){isolatedManifest=false;report.priorFullActivitySweep.manifestError=error.message;}}if(activityScreens.length!==activities.length*widths.length||prior.runtimeErrors.length||prior.structuralFailures.some(item=>item.case.startsWith('activity-'))||changedFiles.some(file=>!['src/avatar-rig.js','assets/art/manifest.json'].includes(file))||!isolatedManifest)report.structuralFailures.push({case:'prior-full-activity-sweep',problem:'Prior activity evidence is incomplete or a runtime change extends beyond the targeted avatar retest'});}
 const expectedSourceHashes={...report.runtimeSources,...Object.fromEntries([...nativeCaseMeta.values()].map(item=>[item.sourceAsset,item.sourceSha256]))};
 const servedSourceHashes=Object.fromEntries(Object.keys(expectedSourceHashes).map(file=>[file,servedHash(file,fs.readFileSync(path.join(app,file)))]));
 const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
 const context=await browser.newContext({viewport:{width:1440,height:1000},deviceScaleFactor:2,timezoneId:'America/Bogota'}),p=await context.newPage();
 const sourceResponses=[],baseURL=new URL(base);report.loadedSourceResponses=[];
 function observePage(page){page.on('pageerror',error=>report.runtimeErrors.push(error.message));page.on('response',response=>{const url=new URL(response.url());let data;try{data=response.request().postDataJSON();}catch{}if(data?.action==='saveAttempt'){const a=data.attempt;report.lastAttempt={bookId:a.bookId,lessonId:a.lessonId,activityId:a.activityId,mode:a.mode,quizOptions:a.quizOptions,answers:a.answers,durationMs:a.durationMs,mistakes:a.mistakes};sourceResponses.push(response.json().then(body=>report.apiChecks.push({action:'saveAttempt',status:response.status(),errorCode:body?.error?.code||body?.code,errorMessage:body?.error?.message||body?.message})).catch(()=>report.apiChecks.push({action:'saveAttempt',status:response.status()})));}if(url.origin!==baseURL.origin||!url.pathname.startsWith(baseURL.pathname))return;const file=decodeURIComponent(url.pathname.slice(baseURL.pathname.length));if(!expectedSourceHashes[file])return;sourceResponses.push(response.body().then(body=>{const hash=servedHash(file,body),pass=hash===servedSourceHashes[file];report.loadedSourceResponses.push({file,url:response.url(),canonicalSha256:hash,pass});if(!pass)report.structuralFailures.push({case:'actual-loaded-source',problem:'Browser loaded stale or different reviewed artwork/runtime',file});}).catch(error=>report.loadedSourceResponses.push({file,url:response.url(),checked:false,reason:'Resource request was cancelled during a page change',message:error.message})));});}
 observePage(p);
 const settle=async(page=p)=>{await page.waitForTimeout(120);await page.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.images].map(im=>im.decode().catch(()=>{})));});};
 const nav=async(route,page=p)=>{await page.locator(`[data-route=${route}]:visible`).first().click();await settle(page);};
 async function freeze(phase){
  await p.evaluate(async fraction=>{const animations=[...new Set([...document.querySelectorAll('.character,[data-avatar-rig],[data-illustration-motion]')].flatMap(node=>node.getAnimations({subtree:true})))];await Promise.all(animations.map(async animation=>{const t=animation.effect?.getTiming(),duration=Number(t?.duration);if(duration>0){animation.pause();await animation.ready.catch(()=>{});let time=Number(t.delay||0)+duration*fraction;if(time<0&&t.iterations===Infinity)time+=duration*Math.ceil(-time/duration);if(animation.effect?.target?.isConnected)animation.currentTime=time;}}));await new Promise(requestAnimationFrame);await new Promise(requestAnimationFrame);},phase);
 }
 async function inspect(name,{capture=false,page=p}={}){
  const p=page;await settle(p);
  const entry=await p.evaluate(()=>{
   const visible=e=>{const r=e.getBoundingClientRect(),s=getComputedStyle(e);return r.width>0&&r.height>0&&s.display!=='none'&&s.visibility!=='hidden';};
   const rect=r=>({left:r.left,top:r.top,right:r.right,bottom:r.bottom,width:r.width,height:r.height});
   const chars=[...document.querySelectorAll('.character')].filter(visible).map(slot=>{
    const frame=slot.querySelector('[data-illustration-motion]'),im=frame?.querySelector('.raster-fit>img');
    const looseParts=slot.querySelectorAll('.p2-joint,.human-joint,[data-pico-rig],[data-companion-rig]').length+(slot.matches('[data-pico-rig],[data-companion-rig]')?1:0);
    let source=null,frameProgress=null,registration=null;
    if(frame&&im){const spec=JSON.parse(frame.dataset.illustrationMotion),animation=im.getAnimations()[0],inner=frame.querySelector('.raster-fit').getBoundingClientRect(),computed=getComputedStyle(im),w=Number(frame.dataset.nativeWidth),h=Number(frame.dataset.nativeHeight);
     source={src:im.src,firstFrame:spec.frames[0],frames:spec.frames.length,nativeWidth:w,nativeHeight:h,renderedWidth:inner.width,renderedHeight:inner.height,uniformScale:Math.abs(inner.width/w-inner.height/h)<.002};
     if(animation){const previous=animation.currentTime,values=[];animation.pause();for(const t of[.1,.4,.6,.8]){animation.currentTime=Number(animation.effect.getTiming().duration)*t;const style=getComputedStyle(im);values.push({x:parseFloat(style.left),y:parseFloat(style.top)});}animation.currentTime=previous;frameProgress=new Set(values.map(point=>point.x+','+point.y)).size;registration=values.map((actual,i)=>{const b=spec.frames[i],expected={x:-b.x/b.w*inner.width,y:-b.y/b.h*inner.height};return{playbackFrame:i,actual,expected,pass:Math.abs(actual.x-expected.x)<1&&Math.abs(actual.y-expected.y)<1};});}
    }
    return{name:slot.dataset.character,posture:slot.dataset.posture,rect:rect(slot.getBoundingClientRect()),atomicImages:slot.querySelectorAll('.raster-fit>img').length,looseParts,source,actualSourceFrames:frameProgress,registration};
   });
   const avatar=[...document.querySelectorAll('[data-avatar-rig]')].filter(visible).map(slot=>({posture:slot.dataset.avatarPosture||slot.querySelector('[data-posture]')?.dataset.posture,ready:slot.querySelector('[data-ready=true]')!==null,error:slot.dataset.avatarError==='true',rect:rect(slot.getBoundingClientRect()),nativeImages:[...slot.querySelectorAll('img')].map(im=>({src:im.src,loaded:im.naturalWidth>0,width:parseFloat(getComputedStyle(im).width),height:parseFloat(getComputedStyle(im).height),nativeWidth:im.naturalWidth,nativeHeight:im.naturalHeight}))}));
   const unloaded=[...document.images].filter(im=>visible(im)&&!im.naturalWidth).map(im=>im.src);
   return{viewport:{width:innerWidth,height:innerHeight,scrollWidth:document.documentElement.scrollWidth},legacyRigCount:document.querySelectorAll('[data-pico-rig],[data-companion-rig],.human-joint,.p2-joint').length,characters:chars,avatars:avatar,unloaded};
  });
  entry.name=name;
  if(entry.legacyRigCount)report.structuralFailures.push({case:name,problem:'Legacy separately positioned character anatomy remains in the actual page',count:entry.legacyRigCount});
  for(const ch of entry.characters){if(ch.looseParts||ch.atomicImages!==1||!ch.source)report.structuralFailures.push({case:name,character:ch.name,problem:'Named companion still uses separately positioned anatomy or lacks a complete native pose frame'});if(ch.source&&!ch.source.uniformScale)report.structuralFailures.push({case:name,character:ch.name,problem:'Nonuniform native frame scale'});if(!ch.registration||ch.registration.length!==4||ch.registration.some(frame=>!frame.pass))report.structuralFailures.push({case:name,character:ch.name,problem:'Rendered playback frame does not match its reviewed complete source frame',registration:ch.registration});}
  if(entry.unloaded.length)report.structuralFailures.push({case:name,problem:'Unloaded graphic',files:entry.unloaded});
  if(entry.viewport.scrollWidth>entry.viewport.width+1)report.structuralFailures.push({case:name,problem:'Horizontal overflow'});
  if(entry.avatars.some(a=>a.error||!a.ready))report.structuralFailures.push({case:name,problem:'Avatar failed to render'});
  if(capture){const file=path.join(out,safe(name)+'.png');await p.screenshot({path:file,fullPage:false});entry.proof=file;entry.proofSha256=sha(file);}
  report.screenCases.push(entry);console.log(JSON.stringify({case:name,characters:entry.characters.length,loose:entry.characters.filter(ch=>ch.looseParts).length,unloaded:entry.unloaded.length}));
 }
 async function leave(page=p){const p=page;if(await p.locator('[data-action=leave-activity]').count()){await p.locator('[data-action=leave-activity]').click();await p.locator('[data-leave-confirm]').click();}else if(await p.locator('[data-action=back-to-path]').count())await p.locator('[data-action=back-to-path]').click();await settle(p);}
 async function launch(activity,page=p){const p=page;await nav('learn',p);await(activity.type==='quiz'?p.locator(`[data-start-chunk="${activity.chunkIds[0]}"]`):p.locator(`[data-start-activity="${activity.id}"]`).last()).click();await settle(p);}
 try{
  const sourceEntries=Object.entries(servedSourceHashes);report.deployedSources=[];for(let offset=0;offset<sourceEntries.length;offset+=4)report.deployedSources.push(...await Promise.all(sourceEntries.slice(offset,offset+4).map(async([file,expected])=>{const url=new URL(file,base);url.searchParams.set('anatomy-qa',report.date);try{const response=await context.request.get(url.href,{headers:{'Cache-Control':'no-cache'}}),hash=servedHash(file,await response.body()),pass=response.ok()&&hash===expected;if(!pass)report.structuralFailures.push({case:'deployed-source',file,problem:'Served source bytes do not match the visually reviewed local release',status:response.status()});return{file,canonicalSha256:hash,pass,textNormalization:/\.(html|css|js|json|mjs)$/.test(file)?'CRLF to LF only':'none'};}catch(error){report.structuralFailures.push({case:'deployed-source',file,problem:error.message});return{file,pass:false};}})));
  await p.goto(base,{waitUntil:'domcontentloaded'});
  for(const width of widths){await p.setViewportSize({width,height:width<768?844:1000});await inspect(`welcome-${width}`,{capture:true});}
  await p.locator('#book-code').fill(code);await p.locator('#redeem-form [type=submit]').click();await p.locator('.app-shell').waitFor({timeout:45000});
  for(const width of widths){await p.setViewportSize({width,height:width<768?844:1000});for(const route of['learn','practice','bank','progress','profile']){if(route==='bank'){await nav('practice');await p.locator('[data-action=word-bank]').first().click();}else await nav(route);await inspect(`${route}-${width}`,{capture:true});}
   await p.locator('[data-action=books]').first().click();await inspect(`books-${width}`,{capture:true});await p.locator('[data-dialog-close]').first().click();
  }
  await p.setViewportSize({width:390,height:844});await nav('practice');await p.locator('[data-action=word-bank]').first().click();
  for(const word of vocabulary.filter(word=>manifest.vocabulary?.[word.term]?.animation&&(!focused||['teacher','student'].includes(word.term)))){await p.locator(`[data-word="${word.id}"]`).click();for(let phase=0;phase<4;phase++){await freeze([.1,.4,.6,.8][phase]);await inspect(`occupation-${word.term}-frame-${phase}`,{capture:true});}await p.locator('[data-dialog-close]').first().click();}
  await nav('profile');
  const choices=await p.locator('[data-avatar-group]').evaluateAll(nodes=>Object.fromEntries(['skin','outfit','hair','accessory'].map(group=>[group,nodes.filter(node=>node.dataset.avatarGroup===group&&!node.disabled).map(node=>node.dataset.avatarValue)])));
  for(let combo=0;combo<7;combo++){
   for(const[group,options]of Object.entries(choices)){const value=options[combo%options.length];await p.locator(`[data-avatar-group="${group}"][data-avatar-value="${value}"]`).click();}
   for(const posture of['portrait','wave','think']){
    await p.evaluate(async posture=>{const resources=performance.getEntriesByType('resource'),avatarURL=resources.find(item=>item.name.includes('/src/avatar-rig.js'))?.name,artURL=resources.find(item=>item.name.includes('/src/art.js'))?.name;if(!avatarURL||!artURL)throw Error('Actual application art modules were not loaded');const module=await import(avatarURL),art=await import(artURL),slot=document.querySelector('#avatar-preview [data-avatar-rig]');module.mountAvatar(slot,{avatar:JSON.parse(slot.dataset.avatar||'{}'),manifest:art.artManifest(),posture});},posture);
    await p.locator(`#avatar-preview [data-posture="${posture}"][data-ready=true]`).waitFor({timeout:15000});await p.evaluate(()=>scrollTo({top:0,behavior:'instant'}));await settle();
    for(let phase=0;phase<phases.length;phase++){
     await freeze(phases[phase]);const id=`avatar:combo-${combo+1}:${posture}:phase-${phase}`,file=path.join(out,safe(id)+'.png');await p.locator('#avatar-preview').screenshot({path:file});
     const details=await p.locator('#avatar-preview [data-avatar-rig]').evaluate(slot=>({avatar:JSON.parse(slot.dataset.avatar||'{}'),posture:slot.querySelector('[data-posture]')?.dataset.posture,eyes:[...slot.querySelectorAll('.hzn-avatar-eyes')].map(part=>({opacity:Number(getComputedStyle(part).opacity),progress:part.getAnimations()[0]?.effect?.getComputedTiming().progress,rect:{x:part.getBoundingClientRect().x,y:part.getBoundingClientRect().y,width:part.getBoundingClientRect().width,height:part.getBoundingClientRect().height}})),parts:[...slot.querySelectorAll('[data-rig-part]')].map(part=>({name:part.dataset.rigPart,frame:part.dataset.nativeFrame,opacity:getComputedStyle(part).opacity}))}));
     const expectedClosed=phase===1||phase===3;if(!details.eyes.length||details.eyes.some(eye=>expectedClosed?eye.opacity<.99:eye.opacity>.01))report.structuralFailures.push({case:id,problem:'Requested actual eye-open/eye-closed state was not captured',expectedClosed,eyes:details.eyes});
     report.avatarCases.push({id,combo:combo+1,phase:phases[phase],...details,proof:file,proofSha256:sha(file)});
    }
   }
  }
  fs.writeFileSync(path.join(out,'avatar-cases.json'),JSON.stringify({date:report.date,base,runtimeSources:report.runtimeSources,avatarCases:report.avatarCases},null,2));
  console.log(JSON.stringify({avatarCaptureReady:true,manifest:path.join(out,'avatar-cases.json'),cases:report.avatarCases.length}));
  const activityScope=focused?activities.filter(activity=>['quiz-1a-greetings','quiz-1b-jobs-town','quiz-1c-world-start','quiz-1d-names-contact'].includes(activity.id)):activities;report.activityScope=activityScope.map(item=>item.id);
  await Promise.all(widths.map(async width=>{const worker=await context.newPage();observePage(worker);try{await worker.setViewportSize({width,height:width<768?844:1000});await worker.goto(base,{waitUntil:'domcontentloaded'});await worker.locator('.app-shell').waitFor({timeout:45000});for(const activity of activityScope){await launch(activity,worker);await inspect(`activity-${activity.id}-${width}`,{page:worker,capture:focused||['quiz-1b-jobs-town','1a-greeting-pairs','1b-duty-board','listen-1d'].includes(activity.id)});await leave(worker);}}finally{await worker.close();}}));
  await launch(activities.find(activity=>activity.id==='quiz-1a-greetings'));
  for(let i=0;i<20&&!await p.locator('.result-page').count();i++){
   const options=await p.locator('[data-choice]').evaluateAll(nodes=>nodes.map(node=>({id:node.dataset.choice,text:node.querySelector(':scope>span:last-of-type')?.textContent.trim()})));
   const id=options[0].id.replace(/-option-\d+$/,''),ref=questionPool.find(q=>q.id===id);assert.ok(ref,'Reviewed answer source exists');const choice=options.find(option=>i===0?option.text!==ref.correctText:option.text===ref.correctText);
   await p.locator(`[data-choice="${choice.id}"]`).click();await p.locator('[data-action=check-answer]').click();if(i<2)await inspect(i?'correct-feedback':'gentle-feedback',{capture:true});await p.locator('[data-action=next-question]').click();
  }
  await p.locator('.result-page').waitFor();try{await p.locator('.save-note').filter({hasText:/^Saved\./}).waitFor({timeout:45000});}catch(error){report.saveStatus=await p.locator('.save-note,.save-error').allTextContents();await inspect('result-save-failure',{capture:true});throw error;}await inspect('result',{capture:true});await leave();
  await p.emulateMedia({reducedMotion:'reduce'});await nav('learn');await settle();report.reducedMotion=await p.evaluate(()=>({requested:matchMedia('(prefers-reduced-motion:reduce)').matches,running:[...document.querySelectorAll('.character,.avatar')].flatMap(node=>node.getAnimations({subtree:true}).filter(a=>a.playState==='running').map(a=>a.animationName||'source-frame'))}));if(report.reducedMotion.running.length)report.structuralFailures.push({case:'reduced-motion',problem:'Character motion still running'});
 }catch(error){report.structuralFailures.push({case:'harness',problem:error.stack});console.error(error.stack);}
 finally{
  await Promise.all(sourceResponses);await browser.close();visualGate(report);fs.writeFileSync(path.join(out,'anatomy-integration.json'),JSON.stringify(report,null,2));
  console.log(JSON.stringify({status:report.status,screens:report.screenCases.length,avatarCases:report.avatarCases.length,structuralFailures:report.structuralFailures.length,visualAnatomyPass:report.visualAnatomy.pass,proof:out}));
  process.exitCode=report.automatedPass?0:1;
 }
}


