import {createRequire} from 'node:module';
import {execFileSync,spawnSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {pathNodes,lessons} from '../content/unit1.mjs';
import {masteryTargets} from '../content/island-mastery.mjs';

// All session data is fictional. No route can write to the real API.
const require=createRequire(import.meta.url);
const {chromium}=require('C:/Users/David/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const base=process.env.HZ_APP_URL||'http://127.0.0.1:8898/Horizons/App/';
const out=process.env.HZ_MINIMAL_OUTPUT||'C:/Users/David/Documents/Codex/2026-11-05/minimal-overworld-proof';
const reportFile=process.env.HZ_MINIMAL_REPORT||fileURLToPath(new URL('../reports/minimal-overworld-proof.json',import.meta.url));
const appDir=fileURLToPath(new URL('../',import.meta.url));
const repoDir=path.resolve(appDir,'../..');
const tileSelector=process.env.HZ_WORLD_TILE_SELECTOR||'.world-tile';
const raceOnly=process.env.HZ_MINIMAL_RACE_ONLY==='1';
const first=pathNodes[0],second=pathNodes[1];
const finals=lessons.map(lesson=>pathNodes.filter(node=>node.lessonId===lesson.id).at(-1));
const total=masteryTargets[first.id]?.length||1;
const fixture={profile:{id:'minimal-world-fictional',displayName:'Town Explorer',goal:10,avatar:{body:'female',skin:'skin-3',hair:'hair-9',outfit:'outfit-3',accessory:'none',badge:'star-pin',hairColor:'color-auburn',background:'bg-mint'}},books:[{id:'horizons-a1',level:'A1',status:'active',expiresAt:'2030-11-05T00:00:00Z'}],progress:{xp:1200,streak:4,completedActivityIds:[first.id,second.id],islands:{[first.id]:{mastered:true,masteredCount:total,total}}}};
const obsoleteScene=/\/assets\/art\/overworld-unit1-v1\/(?:welcome-park-native|jobs-market-native|town-hall-native|world-garden(?:-native(?:-v3)?|-rejected-v2))\.png(?:\?|$)/;
const apiActions=[],errors=[],imageRequests=[],imageResponses=[],requestFailures=[],brokenImagesSeen=[],checks=[],screens=[];
const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
const context=await browser.newContext({viewport:{width:1440,height:1000},serviceWorkers:'block'});
await context.addCookies([{url:base,name:'hz_companion_session',value:'fictional-minimal-world'}]);
await context.route(/\/api\/horizons(?:\?.*)?$/,route=>{
 let data;try{data=route.request().postDataJSON();}catch{data={};}
 const action=data?.action||'unknown';apiActions.push(action);
 if(action==='getSession')return route.fulfill({contentType:'application/json',body:JSON.stringify(fixture)});
 return route.fulfill({status:403,contentType:'application/json',body:JSON.stringify({error:'Read-only fictional QA fixture.'})});
});
const page=await context.newPage();
page.on('pageerror',error=>errors.push(error.message));
page.on('request',request=>{if(request.resourceType()==='image')imageRequests.push(request.url());});
page.on('response',response=>{if(response.request().resourceType()==='image')imageResponses.push({url:response.url(),status:response.status(),contentType:response.headers()['content-type'],contentLength:response.headers()['content-length']});});
page.on('requestfailed',request=>requestFailures.push({url:request.url(),type:request.resourceType(),error:request.failure()?.errorText}));
const map=()=>page.locator('.overworld-map.horizontal-path-scroll');
const node=id=>page.locator('.learning-path .path-stop[data-path-node="'+id+'"]');
const player=()=>page.locator('.path-player');
const bubble=()=>page.locator('#path-bubble:popover-open');
const fauna=()=>page.locator('.world-fauna > img');
const closeBubble=async()=>{if(await bubble().count())await page.keyboard.press('Escape');};
const settle=async(ms=550)=>{await page.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.images].map(img=>img.decode().catch(()=>{})));});await page.waitForTimeout(ms);brokenImagesSeen.push(...await page.locator('img').evaluateAll(imgs=>imgs.filter(img=>(img.currentSrc||img.getAttribute('src'))&&img.complete&&!img.naturalWidth).map(img=>({src:img.currentSrc||img.src,className:img.className}))));};
const navigate=async name=>{await closeBubble();await page.locator('[data-route="'+name+'"]:visible').first().click();await settle();};
const rect=box=>({x:box.x,y:box.y,width:box.width,height:box.height});
const overlaps=(a,b)=>Math.min(a.x+a.width,b.x+b.width)-Math.max(a.x,b.x)>1&&Math.min(a.y+a.height,b.y+b.height)-Math.max(a.y,b.y)>1;
async function screenshot(name){
 const file=path.join(out,name+'.png');await page.screenshot({path:file});
 screens.push({name,file,sha256:crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')});
}
async function reveal(id){
 await closeBubble();await page.mouse.move(1,1);
 await node(id).evaluate(el=>el.scrollIntoView({block:'center',inline:'center',behavior:'instant'}));
 await page.waitForTimeout(100);
}
async function openDetails(id,{keyboard=false}={}){
 await reveal(id);
 if(keyboard){await node(id).evaluate(el=>el.focus({preventScroll:true}));await page.keyboard.press('Enter');}
 else await node(id).click();
 await bubble().waitFor();await page.waitForTimeout(550);
 const b=await bubble().boundingBox(),a=await node(id).boundingBox(),p=await player().boundingBox(),m=await map().boundingBox(),o=await node(id).locator('.stop-orb').boundingBox();
 const viewport=page.viewportSize();
 assert.ok(b&&a&&p,'details, selected island and saved-avatar marker are visible');
 assert.ok(b.y>=a.y+a.height+1,'details must sit wholly below island '+id);
 assert.ok(p.y+p.height<=a.y-1,'saved-avatar marker must sit wholly above island '+id);
 assert.ok(p.y>=m.y-1&&p.y+p.height<=m.y+m.height+1,'saved-avatar marker stays inside visible map '+id);
 assert.ok(Math.abs(p.x+p.width/2-o.x-o.width/2)<3,'saved-avatar marker centered over island anchor '+id);
 assert.equal(overlaps(b,p),false,'details must not cover saved avatar '+id);
 assert.ok(b.x>=0&&b.x+b.width<=viewport.width+1&&b.y>=0&&b.y+b.height<=viewport.height+1,'details fit viewport '+id);
 assert.equal(await bubble().getAttribute('data-side'),'below');
 assert.equal(await bubble().locator('[data-start-path]').getAttribute('data-start-path'),id);
 assert.equal(await player().getAttribute('data-selected-node'),id);
 assert.equal(await player().getAttribute('data-current-node'),id);
 const controls=await bubble().locator('button').evaluateAll(els=>els.map(el=>{const r=el.getBoundingClientRect();return{width:r.width,height:r.height};}));
 assert.ok(controls.every(r=>r.width>=44&&r.height>=44),'popup buttons retain 44px touch targets');
 return {id,landmark:finals.some(n=>n.id===id),keyboard,anchor:rect(a),bubble:rect(b),avatar:rect(p)};
}
fs.mkdirSync(out,{recursive:true});
let passed=false,failure;
try{
 await page.goto(base);await map().waitFor();await settle();
 assert.equal(await page.title(),'Horizons');
 const screenshotIds=new Set([first.id,pathNodes[Math.floor(pathNodes.length/2)].id,pathNodes.filter(n=>!finals.some(f=>f.id===n.id)).at(-1).id,finals[0].id,finals[1].id,finals.at(-1).id]);
 for(const width of raceOnly?[]:[320,390,768,1440]){
  await page.setViewportSize({width,height:width<768?844:1000});await navigate('learn');
  await map().evaluate(el=>el.scrollIntoView({block:'center',behavior:'instant'}));await settle();
  assert.equal(await page.locator('.world-scenery').count(),0,'whole environment panels removed');
  assert.equal(await page.locator('.overworld-heading,#world-help,.world-map-note').count(),0);
  assert.deepEqual(await page.locator('.learning-path .path-stop[data-path-node]').evaluateAll(els=>els.map(el=>el.dataset.pathNode)),pathNodes.map(n=>n.id),'21 canonical island IDs and order preserved');
  assert.deepEqual(await page.locator('.path-stop.landmark-stop').evaluateAll(els=>els.map(el=>el.dataset.pathNode)),finals.map(n=>n.id),'same four final activity landmarks');
  assert.equal(await page.locator('.landmark-art').count(),4);
  assert.equal(await fauna().count(),8);
  const trails=await page.locator('.lesson-trail').evaluateAll(els=>els.map(el=>{const r=el.getBoundingClientRect();return{height:r.height,minHeight:getComputedStyle(el).minHeight};}));
  assert.equal(trails.length,4);assert.ok(trails.every(t=>Math.abs(t.height-308)<1),'440px trail reduced by 30% to 308px');
  const tiles=await page.locator(tileSelector).evaluateAll(els=>els.map(el=>{const img=el.matches('img')?el:el.querySelector('img'),r=el.getBoundingClientRect();let semantic=el;while(semantic&&!semantic.hasAttribute('aria-hidden'))semantic=semantic.parentElement;return{src:img?.currentSrc||img?.src||'',decoded:!!img?.complete&&img.naturalWidth>0,pointerEvents:getComputedStyle(el).pointerEvents,decorative:semantic?.getAttribute('aria-hidden')==='true'&&img?.getAttribute('alt')==='',width:r.width,height:r.height};}));
  assert.ok(tiles.length>=8,'reusable individual decoration tiles rendered');
  assert.ok(tiles.every(tile=>tile.decoded&&tile.decorative&&tile.pointerEvents==='none'),'tiles decoded and remain decorative');
  assert.ok(new Set(tiles.map(t=>t.src)).size<tiles.length,'small tile set is reused');
  assert.ok(tiles.every(t=>t.width<=180&&t.height<=180),'decorations remain small individual objects');
  assert.ok(await page.locator('.landmark-art,.world-fauna>img').evaluateAll(imgs=>imgs.every(img=>img.complete&&img.naturalWidth>0)));
  const targets=await page.locator('.learning-path button').evaluateAll(els=>els.map(el=>{const r=el.getBoundingClientRect();return{width:r.width,height:r.height};}));
  assert.ok(targets.every(r=>r.width>=44&&r.height>=44),'island and arrow touch targets >=44px');
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'no document horizontal overflow');
  const avatar=JSON.parse(await player().locator('.avatar').getAttribute('data-avatar'));
  assert.equal(avatar.hair,'hair-9');assert.equal(avatar.hairColor,'color-auburn');
  assert.equal(await node(first.id).evaluate(el=>el.classList.contains('mastered')),true);
  assert.equal(await node(second.id).evaluate(el=>el.classList.contains('completed')&&!el.classList.contains('mastered')),true);
  await map().evaluate(el=>el.scrollLeft=0);await settle();await screenshot('minimal-start-'+width);
  const beforeRequests=apiActions.length,classes=await page.locator('.path-stop').evaluateAll(els=>els.map(el=>el.className));
  const popups=[];
  for(const [index,n] of pathNodes.entries()){
   popups.push(await openDetails(n.id,{keyboard:index%2===1}));
   if(screenshotIds.has(n.id))await screenshot('minimal-details-'+width+'-'+n.id);
  }
  await closeBubble();
  assert.deepEqual(await page.locator('.path-stop').evaluateAll(els=>els.map(el=>el.className)),classes);
  assert.equal(apiActions.length,beforeRequests,'details never write progress or call API');
  await map().evaluate(el=>el.scrollLeft=el.scrollWidth);await settle();await screenshot('minimal-end-'+width);
  checks.push({width,trailHeight:308,islands:21,landmarks:4,tiles:tiles.length,uniqueTileAssets:new Set(tiles.map(t=>t.src)).size,touchTargets:true,noDocumentOverflow:true,popups});
 }
 assert.deepEqual(imageRequests.filter(url=>obsoleteScene.test(url)),[],'removed native scene panels are never requested');

 // Short landscape forces the below-island placement to make page space.
 await page.setViewportSize({width:844,height:390});await navigate('learn');
 const landscape=[];
 for(const id of [first.id,pathNodes[Math.floor(pathNodes.length/2)].id,finals.at(-1).id])landscape.push(await openDetails(id,{keyboard:true}));
 await screenshot('minimal-details-landscape-844x390');await closeBubble();
 const originalBodyChildren=await page.evaluate(()=>document.body.children.length);
 await reveal(first.id);
 await page.evaluate(ids=>{for(const id of ids)document.querySelector('.learning-path .path-stop[data-path-node="'+id+'"]').click();},[first.id,second.id]);
 await bubble().waitFor();await page.waitForTimeout(550);
 assert.equal(await bubble().locator('[data-start-path]').getAttribute('data-start-path'),second.id,'rapid reselection retains latest island');
 let rapidBubble=await bubble().boundingBox(),rapidAnchor=await node(second.id).boundingBox(),rapidPlayer=await player().boundingBox();
 assert.ok(rapidBubble.y>=rapidAnchor.y+rapidAnchor.height+1);assert.equal(overlaps(rapidBubble,rapidPlayer),false);
 await page.keyboard.press('Escape');await page.waitForTimeout(150);assert.equal(await bubble().count(),0);assert.equal(await page.evaluate(()=>document.body.children.length),originalBodyChildren,'Escape removes temporary page spacer');
 await reveal(first.id);
 await page.evaluate(id=>{document.querySelector('.learning-path .path-stop[data-path-node="'+id+'"]').click();window.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}));},first.id);
 await page.waitForTimeout(300);assert.equal(await bubble().count(),0,'Escape during asynchronous placement cannot reopen details');assert.equal(await page.evaluate(()=>document.body.children.length),originalBodyChildren,'early close removes temporary spacer');
 await openDetails(first.id,{keyboard:true});await closeBubble();
 checks.push({width:844,height:390,landscape,popoverBelow:true,rapidReselection:true,escapeDuringPlacement:true,temporarySpacerCleanup:true});

 // Native wheel, held arrows and mouse drag keep the latest navigation contract.
 await page.setViewportSize({width:1440,height:1000});await navigate('learn');
 await page.evaluate(()=>document.body.style.paddingBottom='1200px');
 await map().evaluate(el=>{el.scrollLeft=250;el.scrollIntoView({block:'center',behavior:'instant'});});await settle();
 let box=await map().boundingBox();await page.mouse.move(box.x+box.width/2,box.y+box.height/2);
 const beforeWheel=await map().evaluate(el=>el.scrollLeft),beforeY=await page.evaluate(()=>scrollY);
 await page.mouse.wheel(0,160);await page.waitForTimeout(250);
 assert.equal(await map().evaluate(el=>el.scrollLeft),beforeWheel);assert.ok(await page.evaluate(()=>scrollY)>beforeY,'vertical wheel scrolls page');
 const right=page.locator('[data-path-pan="1"]');await right.scrollIntoViewIfNeeded();box=await right.boundingBox();
 await page.mouse.move(box.x+22,box.y+22);await page.mouse.down();await page.waitForTimeout(350);const early=await map().evaluate(el=>el.scrollLeft);
 await page.waitForTimeout(650);const late=await map().evaluate(el=>el.scrollLeft);await page.mouse.up();
 assert.ok(late>early+100,'held arrow gradually pans');await page.waitForTimeout(80);const stopped=await map().evaluate(el=>el.scrollLeft);await page.waitForTimeout(170);assert.equal(await map().evaluate(el=>el.scrollLeft),stopped,'release stops hold');
 await map().scrollIntoViewIfNeeded();box=await map().boundingBox();await page.mouse.move(box.x+box.width/2,box.y+150);await page.mouse.down();await page.mouse.move(box.x+box.width/2-170,box.y+150,{steps:10});await page.mouse.up();
 assert.ok(await map().evaluate(el=>el.scrollLeft)>stopped+100,'mouse drag pans map');assert.equal(await bubble().count(),0,'drag never launches island details');
 assert.equal(await map().evaluate(el=>getComputedStyle(el).touchAction),'auto','native swipe and pinch zoom permitted');

 // Full-opacity wildlife pauses, respects reduced motion and is disposed on route exit.
 await settle();assert.ok(await fauna().evaluateAll(imgs=>imgs.every(img=>getComputedStyle(img).opacity==='1'&&img.getAnimations().length===1&&img.getAnimations().every(a=>a.effect.getKeyframes().every(f=>!('opacity'in f))))));
 await page.emulateMedia({reducedMotion:'reduce'});await page.waitForTimeout(150);assert.equal(await fauna().evaluateAll(imgs=>imgs.flatMap(img=>img.getAnimations()).length),0);assert.equal(await player().evaluate(el=>getComputedStyle(el).transitionDuration),'0s');
 await page.emulateMedia({reducedMotion:'no-preference'});await settle();
 for(let i=0;i<2;i++){
  await page.evaluate(()=>{window.__minimalOldWorld=document.querySelector('.overworld-map');window.__minimalOldAnimations=[...__minimalOldWorld.querySelectorAll('.world-fauna>img')].flatMap(img=>img.getAnimations());});
  await navigate('practice');assert.equal(await map().count(),0);assert.ok(await page.evaluate(()=>__minimalOldAnimations.every(a=>a.playState==='idle'&&a.currentTime===null)));assert.equal(await page.evaluate(()=>__minimalOldWorld.getAnimations({subtree:true}).length),0);
  await navigate('learn');await map().scrollIntoViewIfNeeded();await settle();assert.equal(await fauna().evaluateAll(imgs=>imgs.flatMap(img=>img.getAnimations()).length),8);
 }
 assert.deepEqual(errors,[]);assert.deepEqual(brokenImagesSeen,[],'no decoded-image failures');assert.deepEqual(imageResponses.filter(r=>r.status>=400),[],'no image HTTP errors');assert.deepEqual(requestFailures,[],'no failed resource requests');assert.ok(apiActions.every(a=>a==='getSession'));passed=true;
}catch(error){failure={message:error.message,stack:error.stack};console.error(error);await page.screenshot({path:path.join(out,'failure.png'),fullPage:true}).catch(()=>{});process.exitCode=1;}
finally{
 const files=['src/app.js','src/studio-ui.js','src/overworld-motion.js','styles/horizontal-path.css','styles/overworld.css','index.html','service-worker.js'];
 const runtimeSources=Object.fromEntries(files.map(file=>[file,crypto.createHash('sha256').update(fs.readFileSync(path.join(appDir,file))).digest('hex')]));
 const revision=process.env.HZ_SOURCE_REVISION||execFileSync('git',['rev-parse','HEAD'],{cwd:repoDir,encoding:'utf8'}).trim();
 const uncommittedRuntime=spawnSync('git',['diff','--quiet','HEAD','--',...files.map(f=>'Horizons/App/'+f)],{cwd:repoDir}).status!==0;
 fs.writeFileSync(reportFile,JSON.stringify({date:new Date().toISOString(),revision,uncommittedRuntime,scope:raceOnly?'popup-races-only':'complete',base,tileSelector,runtimeSources,checks,screens,obsoleteSceneRequests:imageRequests.filter(url=>obsoleteScene.test(url)),imageResponses,requestFailures,brokenImagesSeen,apiActions,realBackendRequests:false,realLearnerWrites:false,errors,pass:passed,...(failure?{failure}:{}),limits:['Edge/Chromium only; no physical-device claim','Fictional intercepted session; no real learner/API writes','Temporary page bottom padding permits real vertical wheel check','Navigation touch swipe is separately covered by overworld-navigation-proof.mjs']},null,2)+'\n');
 await browser.close();
}
if(passed)console.log(raceOnly?'PASS focused popup races and landscape (four-width matrix omitted)':'PASS minimal overworld: four widths, 308px trails, reusable native tiles, above-island player, 21 below-island popups and preserved navigation/lifecycle');
