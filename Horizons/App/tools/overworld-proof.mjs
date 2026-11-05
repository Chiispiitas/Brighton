import {createRequire} from 'node:module';
import {execFileSync,spawnSync} from 'node:child_process';
import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import assert from 'node:assert/strict';
import {pathNodes,lessons} from '../content/unit1.mjs';
import {masteryTargets} from '../content/island-mastery.mjs';
const require=createRequire(import.meta.url),{chromium}=require('C:/Users/David/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const base=process.env.HZ_APP_URL||'http://127.0.0.1:8898/Horizons/App/';
const out=process.env.HZ_OVERWORLD_OUTPUT||'C:/Users/David/Documents/Codex/2026-11-05/horizons-overworld/proof';
const reportFile=process.env.HZ_OVERWORLD_REPORT||new URL('../reports/overworld-proof.json',import.meta.url);
fs.mkdirSync(out,{recursive:true});
const first=pathNodes[0],second=pathNodes[1],third=pathNodes[2];
const finalByLesson=lessons.map(lesson=>pathNodes.filter(n=>n.lessonId===lesson.id).at(-1));
const total=masteryTargets[first.id]?.length||1,finalTotal=masteryTargets[finalByLesson[0].id]?.length||1;
const fixture={profile:{id:'overworld-fictional-fixture',displayName:'Town Explorer',goal:10,avatar:{body:'female',skin:'skin-3',hair:'hair-9',outfit:'outfit-3',accessory:'none',badge:'star-pin',hairColor:'color-auburn',background:'bg-mint'}},books:[{id:'horizons-a1',level:'A1',title:'Horizons A1',status:'active',expiresAt:'2030-11-05T00:00:00Z'}],progress:{xp:1200,streak:4,completedActivityIds:[first.id,second.id,finalByLesson[0].id],islands:{[first.id]:{mastered:true,masteredCount:total,total},[finalByLesson[0].id]:{mastered:true,masteredCount:finalTotal,total:finalTotal}}}};
const apiActions=[],errors=[],checks=[],screens=[];
const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
const context=await browser.newContext({viewport:{width:1440,height:1000},serviceWorkers:'block'});
await context.addCookies([{url:base,name:'hz_companion_session',value:'fictional-overworld-session'}]);
await context.route(/\/api\/horizons(?:\?.*)?$/,async route=>{
 let data;try{data=route.request().postDataJSON();}catch{data={};}
 const action=data?.action||'unknown';apiActions.push(action);
 if(action==='getSession')return route.fulfill({contentType:'application/json',body:JSON.stringify(fixture)});
 if(action==='updateProfile'){fixture.profile={...fixture.profile,...structuredClone(data.patch||{})};return route.fulfill({contentType:'application/json',body:JSON.stringify({profile:fixture.profile})});}
 return route.fulfill({status:403,contentType:'application/json',body:JSON.stringify({error:'This synthetic proof never writes real learner records.'})});
});
const page=await context.newPage();page.on('pageerror',error=>errors.push(error.message));
const region=()=>page.locator('.overworld-map.horizontal-path-scroll');
const node=id=>page.locator('.learning-path .path-stop[data-path-node="'+id+'"]');
const player=()=>page.locator('.horizontal-path-track .path-player');
const fauna=()=>page.locator('.world-fauna > img');
const settle=async()=>{await page.waitForTimeout(650);await page.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.images].map(img=>img.decode().catch(()=>{})));});};
const nav=async route=>{await page.locator('[data-route="'+route+'"]:visible').first().click();await settle();};
async function reveal(id){await page.mouse.move(1,1);await node(id).evaluate(el=>el.scrollIntoView({block:'center',inline:'center',behavior:'instant'}));await page.waitForTimeout(220);}
async function markerAt(id){
 await page.waitForTimeout(550);assert.equal(await player().getAttribute('data-current-node'),id);
 const m=await player().boundingBox(),button=await node(id).boundingBox(),orb=await node(id).locator('.stop-orb').boundingBox();
 assert.ok(Math.abs(m.x+m.width/2-orb.x-orb.width/2)<3,'traveller centered on ground anchor');
 assert.ok(m.y>=button.y+button.height+1,'traveller remains below full activity/building touch target');
}
async function bounds(){
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'map must not widen the page');
 assert.equal(await page.evaluate(()=>[...document.querySelectorAll('.character:not(.hero-pico),.avatar:not(.path-player .avatar)')].some(el=>{for(let n=el;n;n=n.parentElement)if(n.getAnimations().some(a=>a.playState==='running'))return true;return false;})),false,'unrelated cast/avatars stay static');
}
async function shot(name){await settle();await bounds();const file=path.join(out,name+'.png');await page.screenshot({path:file});screens.push({name,file,sha256:crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')});}
async function wheel(deltaY,extra={}){
 return region().evaluate((el,{deltaY,extra})=>{const before=el.scrollLeft,event=new WheelEvent('wheel',{bubbles:true,cancelable:true,deltaY,...extra});const allowed=el.dispatchEvent(event);return{before,after:el.scrollLeft,defaultPrevented:event.defaultPrevented,allowed,client:el.clientWidth,max:el.scrollWidth-el.clientWidth};},{deltaY,extra});
}
async function open(id,keyboard=false){await reveal(id);if(keyboard){await node(id).evaluate(el=>el.focus({preventScroll:true}));await page.keyboard.press('Enter');}else await node(id).click();await page.locator('#path-bubble:popover-open').waitFor();await markerAt(id);}
async function leave(){await page.locator('[data-action=leave-activity]').click();await page.locator('[data-leave-confirm]').click();await page.locator('.app-shell').waitFor();await settle();}
try{
 await page.goto(base);await region().waitFor();await settle();assert.equal(await page.title(),'Horizons');
 assert.equal(await page.locator('.site-masthead,.fieldguide-shell,.lesson-chapter').count(),0);
 assert.equal(await page.locator('.sidebar').count(),1);assert.equal(await page.locator('.mobile-nav').count(),1);
 assert.equal(await page.locator('.desktop-nav [data-route=profile]').count(),0);assert.equal(await page.locator('.sidebar-person .avatar').count(),1);
 const picoBaseline=execFileSync('git',['show','0058c04:Horizons/App/src/pico-banner-motion.js']).toString().replace(/\r\n/g,'\n');
 assert.equal(fs.readFileSync(new URL('../src/pico-banner-motion.js',import.meta.url),'utf8').replace(/\r\n/g,'\n'),picoBaseline,'Pico source preserved');
 for(const width of [320,390,768,1440]){
  await page.setViewportSize({width,height:width<768?844:1000});await nav('learn');await region().evaluate(el=>el.scrollIntoView({block:'center',behavior:'instant'}));await settle();
  assert.equal(await page.locator('.path-stop[data-path-node]').count(),pathNodes.length);
  assert.equal(await page.locator('.path-lesson').count(),4);assert.equal(await page.locator('.world-scenery').count(),4);
  assert.equal(await page.locator('.path-stop.landmark-stop').count(),4);assert.equal(await page.locator('.landmark-art').count(),4);
  assert.equal(await fauna().count(),8);assert.equal(await page.locator('.world-fauna[data-fauna=bird]').count(),4);assert.equal(await page.locator('.world-fauna[data-fauna=butterfly]').count(),4);
  assert.ok(await page.locator('.world-scenery,.landmark-art,.world-fauna>img').evaluateAll(imgs=>imgs.every(img=>img.complete&&img.naturalWidth>0)),'native world art decoded');
  assert.ok(await page.locator('.world-scenery,.world-fauna').evaluateAll(els=>els.every(el=>getComputedStyle(el).pointerEvents==='none'&&el.getAttribute('aria-hidden')==='true')),'decorations never intercept input or enter accessibility tree');
  for(const n of pathNodes){assert.equal(await node(n.id).count(),1);assert.equal(await node(n.id).isEnabled(),true);}
  for(const n of finalByLesson){assert.equal(await node(n.id).evaluate(el=>el.classList.contains('landmark-stop')),true);assert.equal(await node(n.id).locator('.landmark-state').count(),1);}
  assert.equal(await node(first.id).evaluate(el=>el.classList.contains('mastered')),true);assert.equal(await node(second.id).evaluate(el=>el.classList.contains('completed')&&!el.classList.contains('mastered')),true);
  assert.equal(await node(finalByLesson[0].id).locator('.landmark-state').evaluate(el=>el.closest('button').classList.contains('mastered')),true);
  assert.equal(await player().locator('.avatar').count(),1);const avatar=JSON.parse(await player().locator('.avatar').getAttribute('data-avatar'));assert.equal(avatar.hair,'hair-9');assert.equal(avatar.hairColor,'color-auburn');
  const dimensions=await region().evaluate(el=>({scroll:el.scrollWidth,client:el.clientWidth,tab:el.tabIndex}));assert.ok(dimensions.scroll>dimensions.client+50);assert.equal(dimensions.tab,0);
  const geometry=await page.locator('.lesson-trail').evaluateAll(trails=>trails.map(trail=>{
   const buttons=[...trail.querySelectorAll('.path-stop')],points=buttons.map(el=>{const r=el.querySelector('.stop-orb').getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2};});
   const p=trail.querySelector('.trail-route'),m=p.getScreenCTM(),point=length=>{const q=p.getPointAtLength(length);return new DOMPoint(q.x,q.y).matrixTransform(m);},first=point(0),last=point(p.getTotalLength());
   return{leftToRight:points.every((p,i)=>!i||p.x>points[i-1].x+40),touch:buttons.every(b=>{const r=b.getBoundingClientRect();return r.width>=44&&r.height>=44;}),endpointError:Math.max(Math.hypot(first.x-points[0].x,first.y-points[0].y),Math.hypot(last.x-points.at(-1).x,last.y-points.at(-1).y))};
  }));for(const g of geometry){assert.equal(g.leftToRight,true);assert.equal(g.touch,true);assert.ok(g.endpointError<3);}
  await region().evaluate(el=>{el.scrollLeft=0;});await shot('world-start-'+width);
  for(const n of finalByLesson){await reveal(n.id);const b=await node(n.id).boundingBox(),r=await region().boundingBox();assert.ok(b.x>=r.x-1&&b.x+b.width<=r.x+r.width+1,'final building reachable '+n.lessonId);}
  await shot('world-end-'+width);

  // Hover/focus previews must not open activities, change the committed selection,
  // alter mastery classes or make an API request.
  await open(first.id);await page.keyboard.press('Escape');const selected=await player().getAttribute('data-selected-node'),requests=apiActions.length;
  const classes=await page.locator('.path-stop').evaluateAll(els=>els.map(el=>el.className));
  await reveal(third.id);await node(third.id).hover();await markerAt(third.id);assert.equal(await player().getAttribute('data-selected-node'),selected);assert.equal(await page.locator('#path-bubble:popover-open').count(),0);assert.equal(await page.evaluate(()=>HorizonsApp.getState().activity),null);
  await page.mouse.move(1,1);await markerAt(selected);
  await node(second.id).evaluate(el=>el.focus({preventScroll:true}));await markerAt(second.id);assert.equal(await player().getAttribute('data-selected-node'),selected);assert.equal(await page.locator('#path-bubble:popover-open').count(),0);
  assert.deepEqual(await page.locator('.path-stop').evaluateAll(els=>els.map(el=>el.className)),classes);assert.equal(apiActions.length,requests);
  await open(second.id,true);const box=await page.locator('#path-bubble:popover-open').boundingBox();assert.ok(box.x>=0&&box.x+box.width<=width+1&&box.y>=0&&box.y+box.height<= (width<768?844:1000)+1);await shot('world-details-'+width);await page.keyboard.press('Escape');
  checks.push({width,activities:21,landmarks:4,scenery:4,fauna:8,geometry,hoverAndFocusPreview:true,selectionAndProgressUnchanged:true,landmarksReachable:true,keyboardDetails:true,noPageOverflow:true});
 }

 // Real mouse-wheel directions and browser page-scroll release at map endpoints.
 await page.evaluate(()=>document.body.style.minHeight='3200px');await region().evaluate(el=>{el.scrollLeft=300;el.scrollIntoView({block:'center',behavior:'instant'});});await settle();
 let r=await region().boundingBox();await page.mouse.move(r.x+r.width*.4,r.y+r.height*.5);
 let before=await region().evaluate(el=>el.scrollLeft),pageY=await page.evaluate(()=>scrollY);await page.mouse.wheel(0,160);await page.waitForTimeout(200);assert.ok(await region().evaluate(el=>el.scrollLeft)>before+80,'mouse down travels right');assert.ok(Math.abs(await page.evaluate(()=>scrollY)-pageY)<2,'consumed map wheel leaves page position alone');
 before=await region().evaluate(el=>el.scrollLeft);await page.mouse.wheel(0,-120);await page.waitForTimeout(200);assert.ok(await region().evaluate(el=>el.scrollLeft)<before-60,'mouse up travels left');
 await region().evaluate(el=>el.scrollLeft=300);let w=await wheel(2,{deltaMode:1});assert.equal(w.defaultPrevented,true);assert.ok(Math.abs(w.after-w.before-64)<2,'line-mode wheel normalization');
 await region().evaluate(el=>el.scrollLeft=300);w=await wheel(1,{deltaMode:2});assert.equal(w.defaultPrevented,true);assert.ok(Math.abs(w.after-w.before-w.client)<2,'page-mode wheel normalization');
 for(const extra of [{ctrlKey:true},{metaKey:true},{shiftKey:true},{deltaX:50}]){await region().evaluate(el=>el.scrollLeft=300);w=await wheel(120,extra);assert.equal(w.defaultPrevented,false);assert.equal(w.after,w.before);}
 await region().evaluate(el=>el.scrollLeft=300);r=await region().boundingBox();await page.mouse.move(r.x+r.width*.4,r.y+r.height*.5);before=await region().evaluate(el=>el.scrollLeft);await page.mouse.wheel(160,0);await page.waitForTimeout(200);assert.ok(await region().evaluate(el=>el.scrollLeft)>before+80,'native horizontal wheel remains native');
 await region().evaluate(el=>el.scrollLeft=0);w=await wheel(-120);assert.equal(w.defaultPrevented,false);assert.equal(w.after,0);
 await region().evaluate(el=>el.scrollLeft=el.scrollWidth);w=await wheel(120);assert.equal(w.defaultPrevented,false);assert.equal(w.after,w.max);
 pageY=await page.evaluate(()=>scrollY);await page.mouse.wheel(0,120);await page.waitForTimeout(220);assert.ok(await page.evaluate(()=>scrollY)>pageY+20,'page receives downward wheel at map right edge');
 await region().evaluate(el=>{el.scrollLeft=0;el.scrollIntoView({block:'center',behavior:'instant'});});await settle();r=await region().boundingBox();await page.mouse.move(r.x+r.width*.4,r.y+r.height*.5);pageY=await page.evaluate(()=>scrollY);await page.mouse.wheel(0,-120);await page.waitForTimeout(220);assert.ok(await page.evaluate(()=>scrollY)<pageY-20,'page receives upward wheel at map left edge');

 // Decorative motion is transform-only, at full opacity, and pauses as a unit.
 await region().evaluate(el=>el.scrollIntoView({block:'center',behavior:'instant'}));await settle();
 const transforms=await fauna().evaluateAll(imgs=>imgs.map(img=>getComputedStyle(img).transform));await page.waitForTimeout(550);assert.ok(await fauna().evaluateAll((imgs,before)=>imgs.some((img,i)=>getComputedStyle(img).transform!==before[i]),transforms));
 assert.ok(await fauna().evaluateAll(imgs=>imgs.every(img=>getComputedStyle(img).opacity==='1'&&img.getAnimations().length===1&&img.getAnimations().every(a=>a.playState==='running'&&a.effect.getKeyframes().every(f=>!('opacity'in f))))));
 await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});document.dispatchEvent(new Event('visibilitychange'));});
 assert.ok(await fauna().evaluateAll(imgs=>imgs.every(img=>img.getAnimations().every(a=>a.playState==='paused'))));
 await page.waitForTimeout(60);let times=await fauna().evaluateAll(imgs=>imgs.map(img=>img.getAnimations()[0]?.currentTime));await page.waitForTimeout(200);assert.deepEqual(await fauna().evaluateAll(imgs=>imgs.map(img=>img.getAnimations()[0]?.currentTime)),times);
 await page.evaluate(()=>{delete document.hidden;document.dispatchEvent(new Event('visibilitychange'));});await page.waitForTimeout(100);assert.ok(await fauna().evaluateAll(imgs=>imgs.every(img=>img.getAnimations().every(a=>a.playState==='running'))));
 await page.evaluate(()=>scrollTo(0,2500));await page.waitForTimeout(250);assert.ok(await fauna().evaluateAll(imgs=>imgs.every(img=>img.getAnimations().every(a=>a.playState==='paused'))));
 await region().evaluate(el=>el.scrollIntoView({block:'center',behavior:'instant'}));await page.waitForTimeout(250);assert.ok(await fauna().evaluateAll(imgs=>imgs.every(img=>img.getAnimations().every(a=>a.playState==='running'))));
 await page.emulateMedia({reducedMotion:'reduce'});await page.waitForTimeout(200);assert.equal(await fauna().evaluateAll(imgs=>imgs.flatMap(img=>img.getAnimations()).length),0);assert.equal(await player().evaluate(el=>getComputedStyle(el).transitionDuration),'0s');
 await page.locator('.hero-pico[data-banner-motion=reduced]').waitFor();assert.equal(await page.locator('.hero-pico>.character-art').isVisible(),true);await shot('world-reduced-motion');
 await page.emulateMedia({reducedMotion:'no-preference'});await region().evaluate(el=>el.scrollIntoView({block:'center',behavior:'instant'}));await settle();assert.equal(await fauna().evaluateAll(imgs=>imgs.flatMap(img=>img.getAnimations()).length),8);
 await page.evaluate(()=>document.body.style.removeProperty('min-height'));

 for(let i=0;i<3;i++){
  await page.evaluate(()=>{window.__oldWorld=document.querySelector('.overworld-map');window.__oldFaunaAnimations=[...__oldWorld.querySelectorAll('.world-fauna>img')].flatMap(img=>img.getAnimations());});
  await nav('practice');assert.equal(await region().count(),0);assert.ok(await page.evaluate(()=>__oldFaunaAnimations.every(a=>a.playState==='idle'&&a.currentTime===null)));assert.equal(await page.evaluate(()=>__oldWorld.getAnimations({subtree:true}).length),0);
  await nav('learn');await region().evaluate(el=>el.scrollIntoView({block:'center',behavior:'instant'}));await settle();assert.equal(await fauna().evaluateAll(imgs=>imgs.flatMap(img=>img.getAnimations()).length),8);
 }
 await nav('profile');await page.locator('[data-avatar-tab=outfit]').click();await page.locator('[data-avatar-value=outfit-8]').click();await page.locator('[data-avatar-tab=background]').click();await page.locator('[data-avatar-value=bg-navy]').click();await page.locator('#display-name').fill('Saved Town Explorer');await page.locator('#profile-form button[type=submit]').click();await page.waitForTimeout(500);assert.ok(apiActions.includes('updateProfile'));
 await page.reload();await page.locator('.app-shell').waitFor();await nav('learn');const saved=JSON.parse(await player().locator('.avatar').getAttribute('data-avatar'));assert.equal(saved.outfit,'outfit-8');assert.equal(saved.background,'bg-navy');
 await open(first.id,true);await page.locator('#path-bubble [data-start-path]').click();await page.locator('#typed-answer').waitFor();assert.equal(await page.locator('.question-cue[lang=es]').count(),1);await page.locator('#typed-answer').fill('fictional answer');await page.locator('[data-action=check-answer]').click();await page.locator('.answer-feedback').waitFor();await leave();
 const listening=pathNodes.find(n=>n.type==='listening');await open(listening.id);await page.locator('#path-bubble [data-start-path]').click();await page.locator('.activity-page[data-listening=true]').waitFor();assert.equal(await page.locator('.question-cue,.word-pronunciation').count(),0);await page.locator('[data-action=skip-audio]').click();await page.locator('.activity-page[data-listening=false]').waitFor();await leave();
 assert.deepEqual(errors,[]);assert.ok(apiActions.every(action=>['getSession','updateProfile'].includes(action)));
 const files=['src/app.js','src/studio-ui.js','src/pico-banner-motion.js','src/overworld-motion.js','styles/app.css','styles/horizontal-path.css','styles/overworld.css','index.html','service-worker.js'];
 const runtimeSources=Object.fromEntries(files.map(file=>[file,crypto.createHash('sha256').update(fs.readFileSync(new URL('../'+file,import.meta.url))).digest('hex')]));
 const revision=process.env.HZ_SOURCE_REVISION||execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),uncommittedRuntime=spawnSync('git',['diff','--quiet','HEAD','--',...files.map(f=>'Horizons/App/'+f)]).status!==0;
 fs.writeFileSync(reportFile,JSON.stringify({date:new Date().toISOString(),revision,sourceRevision:revision,uncommittedRuntime,runtimeSources,base,checks,screens,wheelDownRightUpLeft:true,normalizedLineAndPageWheel:true,edgeReleaseToPage:true,nativeHorizontalAndZoomModifiers:true,hoverFocusNoActivityOrProgressMutation:true,selectedMarkerRestoredOnLeave:true,fullOpacityTransformFauna:true,faunaHiddenAndOffscreenPause:true,reducedMotionStatic:true,routeDisposal:true,savedAvatarFixtureReload:true,typedSpanish:true,listeningSkip:true,apiActions,realBackendRequests:false,realLearnerWrites:false,errors,pass:true,limits:['Edge/Chromium only','Synthetic API fixture; simulated profile writes in memory only','Hidden-document event is a controlled fixture','Offscreen test adds temporary document height, not production spacing']},null,2)+'\n');
 console.log('PASS overworld wheel travel, hover avatar, 4 landmark districts, fauna lifecycle, four widths and learning/profile regressions');
}catch(error){console.error(error);console.error(JSON.stringify({errors,checks,apiActions}));await page.screenshot({path:path.join(out,'failure.png'),fullPage:true});process.exitCode=1;}finally{await browser.close();}
