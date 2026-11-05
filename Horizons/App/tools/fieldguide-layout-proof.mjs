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
const out=process.env.HZ_FIELDGUIDE_OUTPUT||'C:/Users/David/Documents/Codex/2026-11-05/horizons-fieldguide';
const reportFile=process.env.HZ_FIELDGUIDE_REPORT||new URL('../reports/fieldguide-layout-proof.json',import.meta.url);
fs.mkdirSync(out,{recursive:true});
const first=pathNodes[0],second=pathNodes[1];
const firstTotal=masteryTargets[first.id]?.length||1;
// All API actions are intercepted. Even the profile save below only mutates this
// fictional in-memory object; no real learner session, CMS or backend is used.
const fixture={profile:{id:'fieldguide-fictional-fixture',displayName:'Field Guide Explorer',goal:10,avatar:{body:'female',skin:'skin-3',hair:'hair-9',outfit:'outfit-3',accessory:'none',badge:'star-pin',hairColor:'color-auburn',background:'bg-mint'}},books:[{id:'horizons-a1',level:'A1',title:'Horizons A1',status:'active',expiresAt:'2030-11-05T00:00:00Z'}],progress:{xp:1200,streak:4,completedActivityIds:[first.id,second.id],islands:{[first.id]:{mastered:true,masteredCount:firstTotal,total:firstTotal},[second.id]:{mastered:false,masteredCount:0,total:masteryTargets[second.id]?.length||1}}}};
const apiActions=[],errors=[],checks=[],screens=[];
const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
const context=await browser.newContext({viewport:{width:1440,height:1000},serviceWorkers:'block'});
await context.addCookies([{url:base,name:'hz_companion_session',value:'fictional-fieldguide-session'}]);
await context.route(/\/api\/horizons(?:\?.*)?$/,async route=>{
 let request;try{request=route.request().postDataJSON();}catch{request={};}
 const action=request?.action||'unknown';apiActions.push(action);
 if(action==='getSession')return route.fulfill({contentType:'application/json',body:JSON.stringify(fixture)});
 if(action==='updateProfile'){
  fixture.profile={...fixture.profile,...structuredClone(request.patch||{})};
  return route.fulfill({contentType:'application/json',body:JSON.stringify({profile:fixture.profile})});
 }
 return route.fulfill({status:403,contentType:'application/json',body:JSON.stringify({error:'Only intercepted fixture session/profile actions are allowed.'})});
});
const page=await context.newPage();page.on('pageerror',error=>errors.push(error.message));
const settle=async()=>{await page.waitForTimeout(650);await page.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.images].filter(img=>img.getBoundingClientRect().top<innerHeight).map(img=>img.decode().catch(()=>{})));});};
const nav=async route=>{await page.locator('[data-route="'+route+'"]:visible').first().click();await settle();};
const entry=id=>page.locator('.learning-path [data-path-node="'+id+'"]');
const leave=async()=>{await page.locator('[data-action=leave-activity]').click();await page.locator('[data-leave-confirm]').click();await page.locator('.site-masthead').waitFor();await settle();};
async function bounds(){
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'page must fit the viewport');
 assert.equal(await page.evaluate(()=>[...document.querySelectorAll('.character:not(.hero-pico),.avatar')].some(el=>{for(let node=el;node;node=node.parentElement)if(node.getAnimations().some(a=>a.playState==='running'))return true;return false;})),false,'other characters and avatars remain static');
}
async function touch(selector){
 const boxes=await page.locator(selector).evaluateAll(els=>els.filter(el=>el.getClientRects().length).map(el=>({label:el.getAttribute('aria-label')||el.textContent.trim(),width:el.getBoundingClientRect().width,height:el.getBoundingClientRect().height})));
 for(const box of boxes)assert.ok(box.width>=43.5&&box.height>=43.5,'touch target '+JSON.stringify(box));
}
async function shot(name,fullPage=false){await settle();await bounds();const file=path.join(out,name+'.png');await page.screenshot({path:file,fullPage});screens.push({name,file,sha256:crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')});}
async function openEntry(id,keyboard=false){
 const target=entry(id);await target.evaluate(el=>el.scrollIntoView({block:'center',behavior:'instant'}));await page.waitForTimeout(180);
 if(keyboard){await target.evaluate(el=>el.focus({preventScroll:true}));await page.keyboard.press('Enter');}else await target.click();
 await page.locator('#path-bubble:popover-open').waitFor();
}
try{
 await page.goto(base);await page.locator('.site-masthead').waitFor();await settle();
 assert.equal(await page.title(),'Horizons');
 for(const width of [320,390,768,1440]){
  await page.setViewportSize({width,height:width<768?844:1000});await nav('learn');
  assert.equal(await page.locator('.sidebar,.mobile-nav,.path-floating').count(),0,'old navigation/floating layout removed');
  assert.equal(await page.locator('.site-masthead .primary-nav [data-route=learn]').count(),1);
  assert.equal(await page.locator('.site-masthead .primary-nav [data-route=practice]').count(),1);
  assert.equal(await page.locator('.profile-link[data-route=profile]').count(),1);
  assert.equal(await page.locator('.primary-nav [aria-current=page]').getAttribute('data-route'),'learn');
  assert.equal(await page.locator('.journal-metrics').count(),1);
  assert.match(await page.locator('.journal-metrics').innerText(),/1[,.]?200/);
  assert.equal(await page.locator('.lesson-chapter').count(),lessons.length);
  assert.equal(await page.locator('.learning-path .activity-entry.path-stop[data-path-node]').count(),pathNodes.length);
  assert.equal(await page.locator('.learning-path .trail-line,.learning-path .stop-orb').count(),0);
  for(const node of pathNodes){
   const target=entry(node.id);assert.equal(await target.count(),1);assert.equal(await target.isEnabled(),true);
   assert.equal(await target.locator('.entry-title').innerText(),node.title);
   assert.ok(await target.locator('.entry-state').innerText());assert.ok(await target.locator('.entry-number').innerText());
   assert.ok(await target.getAttribute('aria-label'),'activity has accessible name');
  }
  assert.match(await entry(first.id).locator('.entry-state').innerText(),/mastered/i);
  assert.match(await entry(second.id).locator('.entry-state').innerText(),/completed/i);
  for(const lesson of lessons){
   const chapter=page.locator('.lesson-chapter').filter({has:page.locator('#lesson-'+lesson.id)});
   assert.equal(await chapter.count(),1);const pages=await chapter.locator('.chapter-pages').innerText();
   for(const number of lesson.bookPages)assert.ok(pages.includes(String(number)),'actual book page reference');
   assert.equal(await chapter.locator('.lesson-activities [data-path-node]').count(),pathNodes.filter(n=>n.lessonId===lesson.id).length);
  }
  await touch('.primary-nav button,.profile-link,.book-switch,.activity-entry');
  await page.locator('.hero-pico[data-banner-motion=ready]').waitFor();
  assert.equal(await page.locator('.learn-hero .hero-pico.unit1-banner-pico[data-character=pico][data-posture=explore]').count(),1);
  await shot('learn-'+width,width===390||width===1440);
  await openEntry(second.id,true);const bubble=page.locator('#path-bubble:popover-open'),r=await bubble.boundingBox();
  assert.ok(r.x>=0&&r.x+r.width<=width+1&&r.y>=0&&r.y+r.height<=(width<768?844:1000)+1,'keyboard details fit viewport');
  assert.equal(await page.locator('dialog[open]').count(),0,'details remain non-modal');
  await shot('details-'+width);await page.keyboard.press('Escape');assert.equal(await bubble.count(),0);
  await nav('practice');await page.locator('.chunk-option').first().click();
  assert.equal(await page.locator('.chunk-option').first().locator('input').isChecked(),true);
  assert.equal(await page.locator('[data-mix=recall]').isEnabled(),true);
  await shot('practice-'+width);
  await page.locator('[data-action=word-bank]').click();await page.locator('#word-search').fill('hello');await settle();
  assert.ok(await page.locator('.word-tile').count()>0);assert.match(await page.locator('.word-grid').innerText(),/hello/i);
  await page.locator('.word-tile').first().click();await page.locator('dialog.word-dialog[open]').waitFor();
  assert.ok(await page.locator('.word-meaning').innerText());await page.locator('dialog [data-dialog-close]').click();
  await shot('word-bank-'+width);
  await nav('profile');await page.locator('#display-name').fill('Unsaved Field Guide Explorer');
  await page.locator('[data-avatar-tab=outfit]').click();await page.locator('[data-avatar-value=outfit-8]').click();await settle();
  assert.equal(await page.locator('#display-name').inputValue(),'Unsaved Field Guide Explorer');
  assert.equal(await page.locator('[role=tabpanel]:visible').count(),1);
  await page.locator('[data-avatar-tab=hair]').focus();await page.keyboard.press('ArrowRight');
  assert.equal(await page.locator('[data-avatar-tab=accessory]').getAttribute('aria-selected'),'true');
  await page.locator('[data-avatar-tab=hairColor]').click();
  await page.locator('[data-avatar-value=color-auburn]').click();
  await page.locator('[data-avatar-tab=background]').click();await page.locator('[data-avatar-value=bg-navy]').click();
  await shot('profile-'+width);
  checks.push({width,bookLedLayout:true,namedActivities:pathNodes.length,masteryStates:true,bookPages:true,keyboardDetails:true,practiceSelection:true,wordBankSearch:true,profileTabs:true,draftPreserved:true,touchTargets:true,noOverflow:true,otherCharactersStatic:true});
  // Clear the cross-route selection for the next responsive iteration.
  await nav('practice');if(await page.locator('.chunk-option').first().locator('input').isChecked())await page.locator('.chunk-option').first().click();
 }
 // Simulated save + reload proves the new profile route still uses saved fields.
 await nav('profile');await page.locator('#display-name').fill('Saved Field Guide Explorer');
 await page.locator('#profile-form button[type=submit]').click();await page.waitForFunction(()=>document.querySelector('#display-name')?.value==='Saved Field Guide Explorer'&&!document.querySelector('#profile-form button[type=submit]')?.disabled);
 assert.ok(apiActions.includes('updateProfile'));assert.equal(fixture.profile.avatar.background,'bg-navy');
 await page.reload();await page.locator('.site-masthead').waitFor();await nav('profile');
 assert.equal(await page.locator('#display-name').inputValue(),'Saved Field Guide Explorer');
 await page.locator('[data-avatar-tab=background]').click();assert.equal(await page.locator('[data-avatar-value=bg-navy]').getAttribute('aria-pressed'),'true');
 await nav('learn');await page.locator('[data-action=books]').first().click();await page.locator('dialog.books-dialog[open]').waitFor();
 assert.equal(await page.locator('[data-select-book]').count(),1);await page.locator('[data-select-book]').click();await settle();
 // Check the first activity's default typed Spanish cue without finishing/saving it.
 await openEntry(first.id);await page.locator('#path-bubble [data-start-path]').click();await page.locator('.activity-page').waitFor();
 await page.locator('#typed-answer').waitFor();assert.equal(await page.locator('.question-cue[lang=es]').count(),1);
 await page.locator('#typed-answer').fill('fictional answer');await page.locator('[data-action=check-answer]').click();await page.locator('.answer-feedback').waitFor();
 await shot('typed-answer');await leave();
 const listening=pathNodes.find(n=>n.type==='listening');await openEntry(listening.id);await page.locator('#path-bubble [data-start-path]').click();
 await page.locator('.activity-page[data-listening=true]').waitFor();assert.equal(await page.locator('.question-cue,.word-pronunciation').count(),0,'listening does not expose its answer');
 await page.locator('[data-action=skip-audio]').click();await page.locator('.activity-page[data-listening=false]').waitFor();
 assert.equal(await page.locator('[data-action=skip-audio]').count(),0);await shot('listening-fallback');await leave();
 await page.emulateMedia({reducedMotion:'reduce'});await page.locator('.hero-pico[data-banner-motion=reduced]').waitFor();
 assert.equal(await page.locator('.hero-pico>.character-art').isVisible(),true);
 assert.equal(await page.locator('.hero-pico').evaluate(el=>el.getAnimations({subtree:true}).length),0);
 await shot('reduced-motion');
 assert.deepEqual(errors,[]);assert.ok(apiActions.every(action=>['getSession','updateProfile'].includes(action)));
 const files=['src/app.js','src/studio-ui.js','src/pico-banner-motion.js','styles/app.css','styles/fieldguide.css','index.html','service-worker.js'];
 const runtimeSources=Object.fromEntries(files.map(file=>[file,crypto.createHash('sha256').update(fs.readFileSync(new URL('../'+file,import.meta.url))).digest('hex')]));
 const sourceRevision=process.env.HZ_SOURCE_REVISION||execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
 const uncommittedRuntime=spawnSync('git',['diff','--quiet','HEAD','--',...files.map(file=>'Horizons/App/'+file)]).status!==0;
 fs.writeFileSync(reportFile,JSON.stringify({date:new Date().toISOString(),sourceRevision,revision:sourceRevision,uncommittedRuntime,runtimeSources,base,checks,profileSaveAndReload:'Simulated intercepted in-memory fixture only',typedSpanish:true,listeningSkip:true,bookSelector:true,reducedNativePico:true,apiActions,realLearnerWrites:false,realBackendRequests:false,errors,screens,pass:true,limits:['Edge/Chromium only','Synthetic session/profile responses; no claim of new live persistence grading validation','Visual verdict follows separate screenshot review']},null,2)+'\n');
 console.log('PASS field-guide layout at four widths, activity/mastery access, profile, practice, listening fallback and reduced motion');
}catch(error){console.error(error);console.error(JSON.stringify({errors,checks,apiActions}));await page.screenshot({path:path.join(out,'failure.png'),fullPage:true});process.exitCode=1;}finally{await browser.close();}
