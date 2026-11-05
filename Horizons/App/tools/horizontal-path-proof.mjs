import {createRequire} from 'node:module';
import {execFileSync,spawnSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {pathNodes,lessons} from '../content/unit1.mjs';
import {masteryTargets} from '../content/island-mastery.mjs';

const require=createRequire(import.meta.url);
const {chromium}=require('C:/Users/David/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const base=process.env.HZ_APP_URL||'http://127.0.0.1:8898/Horizons/App/';
const out=process.env.HZ_HORIZONTAL_OUTPUT||'C:/Users/David/Documents/Codex/2026-11-05/horizons-horizontal';
const reportFile=process.env.HZ_HORIZONTAL_REPORT||new URL('../reports/horizontal-path-proof.json',import.meta.url);
fs.mkdirSync(out,{recursive:true});
const first=pathNodes[0],second=pathNodes[1],total=masteryTargets[first.id]?.length||1;
// Synthetic fixture only. All API traffic, including the simulated profile
// save, is intercepted; no real learner data, attempt or backend writes.
const fixture={profile:{id:'horizontal-path-fictional',displayName:'Map Explorer',goal:10,avatar:{body:'female',skin:'skin-3',hair:'hair-9',outfit:'outfit-3',accessory:'none',badge:'star-pin',hairColor:'color-auburn',background:'bg-mint'}},books:[{id:'horizons-a1',level:'A1',title:'Horizons A1',status:'active',expiresAt:'2030-11-05T00:00:00Z'}],progress:{xp:1200,streak:4,completedActivityIds:[first.id,second.id],islands:{[first.id]:{mastered:true,masteredCount:total,total},[second.id]:{mastered:false,masteredCount:0,total:masteryTargets[second.id]?.length||1}}}};
const errors=[],apiActions=[],checks=[],screens=[];
const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
const context=await browser.newContext({viewport:{width:1440,height:1000},serviceWorkers:'block'});
await context.addCookies([{url:base,name:'hz_companion_session',value:'fictional-horizontal-path-session'}]);
await context.route(/\/api\/horizons(?:\?.*)?$/,async route=>{
 let data;try{data=route.request().postDataJSON();}catch{data={};}
 const action=data?.action||'unknown';apiActions.push(action);
 if(action==='getSession')return route.fulfill({contentType:'application/json',body:JSON.stringify(fixture)});
 if(action==='updateProfile'){fixture.profile={...fixture.profile,...structuredClone(data.patch||{})};return route.fulfill({contentType:'application/json',body:JSON.stringify({profile:fixture.profile})});}
 return route.fulfill({status:403,contentType:'application/json',body:JSON.stringify({error:'This proof allows only intercepted fixture reads/profile updates.'})});
});
const page=await context.newPage();page.on('pageerror',error=>errors.push(error.message));
const settle=async()=>{await page.waitForTimeout(650);await page.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.images].filter(i=>i.getBoundingClientRect().top<innerHeight).map(i=>i.decode().catch(()=>{})));});};
const nav=async route=>{await page.locator('[data-route="'+route+'"]:visible').first().click();await settle();};
const target=id=>page.locator('.learning-path .path-stop[data-path-node="'+id+'"]');
const region=()=>page.locator('.horizontal-path-scroll');
async function noOverflow(){assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'horizontal scrolling must stay inside the map region');}
async function staticOthers(){assert.equal(await page.evaluate(()=>[...document.querySelectorAll('.character:not(.hero-pico),.avatar')].some(el=>{for(let n=el;n;n=n.parentElement)if(n.getAnimations().some(a=>a.playState==='running'))return true;return false;})),false,'only banner Pico may animate');}
async function shot(name){await settle();await noOverflow();await staticOthers();const file=path.join(out,name+'.png');await page.screenshot({path:file});screens.push({name,file,sha256:crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')});}
async function reveal(id){await target(id).evaluate(el=>el.scrollIntoView({block:'center',inline:'center',behavior:'instant'}));await page.waitForTimeout(180);}
async function open(id,keyboard=false){await reveal(id);if(keyboard){await target(id).evaluate(el=>el.focus({preventScroll:true}));await page.keyboard.press('Enter');}else await target(id).click();await page.locator('#path-bubble:popover-open').waitFor();await playerAt(id);}
async function playerAt(id){
 const marker=page.locator('.horizontal-path-track .path-player');assert.equal(await marker.count(),1);assert.equal(await marker.locator('.avatar').count(),1);
 assert.equal(await marker.getAttribute('data-current-node'),id);
 const m=await marker.boundingBox(),button=await target(id).boundingBox(),orb=await target(id).locator('.stop-orb').boundingBox();
 assert.ok(Math.abs(m.x+m.width/2-orb.x-orb.width/2)<3,'traveller centers above selected island');
 assert.ok(m.y+m.height<=button.y+1,'traveller stays outside island touch target');
}
async function leave(){await page.locator('[data-action=leave-activity]').click();await page.locator('[data-leave-confirm]').click();await page.locator('.app-shell').waitFor();await settle();}
try{
 await page.goto(base);await page.locator('.app-shell').waitFor();await settle();assert.equal(await page.title(),'Horizons');
 assert.equal(await page.locator('link[href*="fieldguide.css"]').count(),0,'field-guide stylesheet must not be loaded');
 const picoBaseline=execFileSync('git',['show','0058c04:Horizons/App/src/pico-banner-motion.js']);
 assert.equal(fs.readFileSync(new URL('../src/pico-banner-motion.js',import.meta.url),'utf8').replace(/\r\n/g,'\n'),picoBaseline.toString('utf8').replace(/\r\n/g,'\n'),'Pico rig source remains unchanged apart from checkout line endings');
 for(const width of [320,390,768,1440]){
  await page.setViewportSize({width,height:width<768?844:1000});await nav('learn');
  assert.equal(await page.locator('.site-masthead,.lesson-chapter,.activity-entry,.fieldguide-shell').count(),0,'field-guide trial is not current acceptance');
  assert.equal(await page.locator('.sidebar').count(),1);assert.equal(await page.locator('.mobile-nav').count(),1);
  assert.equal(await page.locator('.desktop-nav [data-route=learn]').count(),1);assert.equal(await page.locator('.desktop-nav [data-route=practice]').count(),1);assert.equal(await page.locator('.desktop-nav [data-route=profile]').count(),0);
  assert.equal(await page.locator('.sidebar-person .avatar').count(),1);assert.equal(await page.locator('.mobile-nav [data-route=profile]').count(),1);
  assert.equal(await page.locator('.path-floating').count(),1);assert.equal(await page.locator('.topbar-metrics').count(),1);
  assert.match(await page.locator('.learn-hero h1').innerText(),/Unit 1\s+New friends/);
  assert.equal(await page.locator('.learn-hero.compact-hero .hero-pico.unit1-banner-pico[data-character=pico][data-posture=explore]').count(),1);
  await page.locator('.hero-pico[data-banner-motion=ready]').waitFor();
  assert.equal(await page.locator('.learning-path .path-stop[data-path-node]').count(),pathNodes.length);
  assert.equal(await page.locator('.path-lesson').count(),lessons.length);
  assert.equal(await page.locator('.stop-label,.entry-title,.lesson-jumps').count(),0,'no persistent labels or lesson-jump shortcuts');
  for(const node of pathNodes){assert.equal(await target(node.id).count(),1);assert.equal(await target(node.id).isEnabled(),true);assert.match(await target(node.id).getAttribute('aria-label'),new RegExp(node.lessonId));}
  assert.equal(await target(first.id).evaluate(el=>el.classList.contains('mastered')),true);assert.equal(await target(second.id).evaluate(el=>el.classList.contains('completed')&&!el.classList.contains('mastered')),true);
  const scroll=await region().evaluate(el=>({client:el.clientWidth,scroll:el.scrollWidth,tabindex:el.tabIndex,role:el.getAttribute('role'),label:el.getAttribute('aria-label')}));
  assert.ok(scroll.scroll>scroll.client+50,'single map region must actually scroll horizontally');assert.equal(scroll.tabindex,0);assert.equal(scroll.role,'region');assert.ok(scroll.label);
  assert.equal(await page.locator('.horizontal-path-track .path-lesson').count(),lessons.length);
  assert.equal(await page.locator('.path-player .avatar').count(),1);
  assert.ok(pathNodes.map(node=>node.id).includes(await page.locator('.path-player').getAttribute('data-current-node')),'traveller identifies an existing current/selected activity');
  assert.equal(await page.locator('.horizontal-path-track').evaluate(el=>getComputedStyle(el).display),'flex');
  const geometry=await page.locator('.lesson-trail').evaluateAll(trails=>trails.map(trail=>{
   const nodes=[...trail.querySelectorAll('.path-stop')],orbs=nodes.map(el=>{const r=el.querySelector('.stop-orb').getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2};});
   const line=trail.querySelector('.trail-line path'),matrix=line.getScreenCTM(),point=distance=>{const p=line.getPointAtLength(distance);const q=new DOMPoint(p.x,p.y).matrixTransform(matrix);return{x:q.x,y:q.y};};
   const length=line.getTotalLength(),start=point(0),end=point(length),distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
   return{count:nodes.length,leftToRight:orbs.every((p,i)=>!i||p.x>orbs[i-1].x+40),touch:nodes.every(el=>{const r=el.getBoundingClientRect();return r.width>=44&&r.height>=44}),startDistance:distance(start,orbs[0]),endDistance:distance(end,orbs.at(-1)),length,orbs};
  }));
  for(const trail of geometry){assert.equal(trail.leftToRight,true,'islands advance left to right within each lesson');assert.equal(trail.touch,true,'island touch targets');assert.ok(trail.length>0);assert.ok(trail.startDistance<3&&trail.endDistance<3,'connector endpoints follow island centers '+JSON.stringify(trail));}
  await region().evaluate(el=>{el.scrollLeft=0;});await region().evaluate(el=>el.scrollIntoView({block:'center',behavior:'instant'}));await page.waitForTimeout(180);await shot('map-start-'+width);
  const reached=[];
  for(const lesson of lessons){const node=pathNodes.find(n=>n.lessonId===lesson.id);await reveal(node.id);const box=await target(node.id).boundingBox(),container=await region().boundingBox();assert.ok(box.x>=container.x-1&&box.x+box.width<=container.x+container.width+1,'lesson '+lesson.id+' reachable in scrolling map');reached.push(lesson.id);}
  await shot('map-end-'+width);
  await region().evaluate(el=>{el.scrollLeft=0;el.focus({preventScroll:true});});await page.keyboard.press('ArrowRight');await page.waitForTimeout(250);assert.ok(await region().evaluate(el=>el.scrollLeft>0),'map supports native keyboard horizontal scrolling');
  await open(second.id,true);const bubble=page.locator('#path-bubble:popover-open'),box=await bubble.boundingBox();assert.ok(box.x>=0&&box.x+box.width<=width+1&&box.y>=0&&box.y+box.height<=(width<768?844:1000)+1,'keyboard popover fits');assert.equal(await page.locator('dialog[open]').count(),0);await shot('details-'+width);await page.keyboard.press('Escape');assert.equal(await bubble.count(),0);
  await open(first.id);assert.match(await page.locator('#path-bubble').innerText(),/Mastered/);await page.keyboard.press('Escape');
  await nav('practice');await page.locator('.chunk-option').first().click();assert.equal(await page.locator('.chunk-option').first().locator('input').isChecked(),true);assert.equal(await page.locator('[data-mix=recall]').isEnabled(),true);await shot('practice-'+width);
  await nav('profile');await page.locator('#display-name').fill('Unsaved Map Explorer');await page.locator('[data-avatar-tab=outfit]').click();await page.locator('[data-avatar-value=outfit-8]').click();await settle();assert.equal(await page.locator('#display-name').inputValue(),'Unsaved Map Explorer');assert.equal(await page.locator('[role=tabpanel]:visible').count(),1);await shot('profile-'+width);
  await nav('practice');if(await page.locator('.chunk-option').first().locator('input').isChecked())await page.locator('.chunk-option').first().click();
  checks.push({width,islands:pathNodes.length,baselineNavigation:true,singleHorizontalMap:true,lessonsReachable:reached,keyboardScroll:true,keyboardPopover:true,noLabels:true,masteryAndCompletion:true,avatarTraveller:true,connectorGeometry:geometry,practice:true,profileDraft:true,noPageOverflow:true,otherCharactersStatic:true});
 }
 await nav('profile');await page.locator('#display-name').fill('Saved Map Explorer');await page.locator('[data-avatar-tab=background]').click();await page.locator('[data-avatar-value=bg-navy]').click();await page.locator('#profile-form button[type=submit]').click();await page.waitForFunction(()=>document.querySelector('#display-name')?.value==='Saved Map Explorer'&&!document.querySelector('#profile-form button[type=submit]')?.disabled);assert.ok(apiActions.includes('updateProfile'));
 await page.reload();await page.locator('.app-shell').waitFor();await nav('profile');assert.equal(await page.locator('#display-name').inputValue(),'Saved Map Explorer');await page.locator('[data-avatar-tab=background]').click();assert.equal(await page.locator('[data-avatar-value=bg-navy]').getAttribute('aria-pressed'),'true');
 await nav('learn');const savedTraveller=JSON.parse(await page.locator('.path-player .avatar').getAttribute('data-avatar'));assert.equal(savedTraveller.background,'bg-navy');assert.equal(savedTraveller.outfit,'outfit-8');await open(first.id);await page.locator('#path-bubble [data-start-path]').click();await page.locator('#typed-answer').waitFor();assert.equal(await page.locator('.question-cue[lang=es]').count(),1);await page.locator('#typed-answer').fill('fictional answer');await page.locator('[data-action=check-answer]').click();await page.locator('.answer-feedback').waitFor();await shot('typed-practice');await leave();
 const listening=pathNodes.find(n=>n.type==='listening');await open(listening.id);await page.locator('#path-bubble [data-start-path]').click();await page.locator('.activity-page[data-listening=true]').waitFor();assert.equal(await page.locator('.question-cue,.word-pronunciation').count(),0);await page.locator('[data-action=skip-audio]').click();await page.locator('.activity-page[data-listening=false]').waitFor();await leave();
 await page.emulateMedia({reducedMotion:'reduce'});await page.locator('.hero-pico[data-banner-motion=reduced]').waitFor();assert.equal(await page.locator('.hero-pico>.character-art').isVisible(),true);assert.equal(await page.locator('.hero-pico').evaluate(el=>el.getAnimations({subtree:true}).length),0);await shot('reduced-motion');
 assert.deepEqual(errors,[]);assert.ok(apiActions.every(action=>['getSession','updateProfile'].includes(action)));
 const files=['src/app.js','src/studio-ui.js','src/pico-banner-motion.js','styles/app.css','styles/horizontal-path.css','index.html','service-worker.js'];
 const runtimeSources=Object.fromEntries(files.map(file=>[file,crypto.createHash('sha256').update(fs.readFileSync(new URL('../'+file,import.meta.url))).digest('hex')]));
 const sourceRevision=process.env.HZ_SOURCE_REVISION||execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),uncommittedRuntime=spawnSync('git',['diff','--quiet','HEAD','--',...files.map(f=>'Horizons/App/'+f)]).status!==0;
 fs.writeFileSync(reportFile,JSON.stringify({date:new Date().toISOString(),sourceRevision,revision:sourceRevision,uncommittedRuntime,runtimeSources,baselineDesignRevision:'0058c04fd7209a3a959427aecf56cf038c1b71c1',base,checks,screens,picoMarkerPreserved:true,staticProfileAvatarTraveller:true,typedSpanish:true,listeningSkip:true,profileSaveReload:'Intercepted in-memory fixture only',reducedNativePico:true,apiActions,realLearnerWrites:false,realBackendRequests:false,errors,pass:true,limits:['Edge/Chromium only','Synthetic API fixture; no claim of new backend persistence/grading validation','Geometry compares SVG screen endpoints to actual orb centers','Field-guide reports are archived trial evidence, not acceptance criteria']},null,2)+'\n');
 console.log('PASS restored design with horizontal 21-island route, four widths, connector geometry, keyboard access, practice/profile and reduced Pico');
}catch(error){console.error(error);console.error(JSON.stringify({errors,checks,apiActions}));await page.screenshot({path:path.join(out,'failure.png'),fullPage:true});process.exitCode=1;}finally{await browser.close();}
