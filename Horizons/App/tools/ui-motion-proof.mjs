import {createRequire} from 'node:module';
import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
const require=createRequire(import.meta.url);
const {chromium}=require('C:/Users/David/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const base=process.env.HZ_APP_URL||'http://127.0.0.1:8898/Horizons/App/';
const out=process.env.HZ_MOTION_OUTPUT||'C:/Users/David/Documents/Codex/2026-11-04/horizons-ui-motion';
const reportFile=process.env.HZ_MOTION_REPORT||new URL('../reports/ui-motion-proof.json',import.meta.url);
fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
const context=await browser.newContext({viewport:{width:1440,height:1000},serviceWorkers:'block'});
// Entirely synthetic UI fixture: no learner redemption, saves or real API traffic.
const fixture={profile:{id:'ui-motion-fixture',displayName:'Motion Explorer',goal:10,avatar:{body:'female',skin:'skin-3',hair:'hair-9',outfit:'outfit-3',accessory:'none',badge:'star-pin',hairColor:'color-auburn',background:'bg-mint'}},books:[{id:'horizons-a1',level:'A1',title:'Horizons A1',status:'active',expiresAt:'2030-11-04T00:00:00Z'}],progress:{xp:1200,streak:4,completedActivityIds:[]}};
const apiActions=[],errors=[],checks=[];
await context.route('**/api/horizons',route=>{
  const action=route.request().postDataJSON()?.action;apiActions.push(action);
  if(action!=='getSession')return route.fulfill({status:403,contentType:'application/json',body:JSON.stringify({error:'UI proof permits session reads only.'})});
  return route.fulfill({contentType:'application/json',body:JSON.stringify(fixture)});
});
await context.addCookies([{url:base,name:'hz_companion_session',value:'fictional-ui-motion-fixture'}]);
await context.addInitScript(()=>{
  window.motionCalls=[];
  const animate=Element.prototype.animate;
  Element.prototype.animate=function(frames,options){
    const protectedArt='.character,.avatar,[data-avatar-static]';
    window.motionCalls.push({target:this.className?.baseVal??this.className,protected:!!this.closest(protectedArt)||!!this.querySelector(protectedArt),reduced:matchMedia('(prefers-reduced-motion: reduce)').matches,frames,duration:options?.duration});
    return animate.call(this,frames,options);
  };
});
const page=await context.newPage();page.on('pageerror',error=>errors.push(error.message));
const settle=async()=>{await page.waitForTimeout(700);await page.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.images].filter(i=>i.getBoundingClientRect().top<innerHeight).map(i=>i.decode().catch(()=>{})));});};
const resetCalls=()=>page.evaluate(()=>{window.motionCalls=[];});
async function calls(){return page.evaluate(()=>window.motionCalls);}
async function still(){
  await settle();
  assert.equal(await page.evaluate(()=>document.getAnimations().filter(a=>a.playState==='running').length),0,'motion must settle');
  assert.equal(await page.evaluate(()=>[...document.querySelectorAll('.character,.avatar')].some(el=>{for(let node=el;node;node=node.parentElement)if(node.getAnimations().some(a=>a.playState==='running'))return true;return false;})),false);
  assert.ok((await calls()).every(call=>!call.protected && !call.reduced && call.duration<=600));
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'horizontal overflow');
}
async function shot(name){await still();await page.screenshot({path:path.join(out,name+'.png')});}
async function nav(route){await page.locator('[data-route='+route+']:visible').first().click();await settle();}
async function leave(){await page.locator('[data-action=leave-activity]').click();await page.locator('[data-leave-confirm]').click();await settle();}
try{
  await page.goto(base);await page.locator('.app-shell').waitFor();await settle();
  for(const width of [320,390,768,1440]){
    await page.setViewportSize({width,height:width<768?844:1000});await nav('learn');await resetCalls();
    assert.equal(await page.locator('.learning-path [data-path-node]').count(),21);
    assert.equal(await page.locator('.desktop-nav [data-route=profile]').count(),0);
    assert.equal(await page.locator('.sidebar-person .avatar').count(),1);
    const node=page.locator('.learning-path [data-path-node]').nth(4);await node.evaluate(el=>el.scrollIntoView({block:"center",behavior:"instant"}));await page.waitForTimeout(300);await node.click();
    const bubble=page.locator('#path-bubble:popover-open');await bubble.waitFor();
    assert.ok((await calls()).some(call=>String(call.target).includes('path-bubble')),'popover pop-in');
    assert.equal(await page.locator('dialog[open]').count(),0);
    const rect=await bubble.boundingBox();assert.ok(rect.x>=0&&rect.x+rect.width<=width+1&&rect.y>=0);
    await shot('bubble-'+width);await page.keyboard.press('Escape');assert.equal(await bubble.count(),0);
    await node.focus();await page.keyboard.press('Enter');assert.equal(await bubble.count(),1);await page.keyboard.press('Escape');
    await node.click();await page.mouse.click(width-3,400);assert.equal(await bubble.count(),0);
    await node.click();await page.evaluate(()=>window.scrollBy(0,24));await page.waitForTimeout(100);assert.equal(await bubble.count(),0);
    await node.click();const start=page.locator('#path-bubble [data-start-path]');await start.hover();await page.waitForTimeout(250);
    await page.mouse.down();await page.waitForTimeout(100);
    assert.notEqual(await start.evaluate(el=>getComputedStyle(el).transform),'none','pressed button response');await page.screenshot({path:path.join(out,'press-'+width+'.png')});
    await page.mouse.up();await page.locator('.activity-page').waitFor();await still();await leave();
    await resetCalls();await nav('practice');assert.ok((await calls()).some(call=>String(call.target).includes('practice-toolbar')),'section entry');
    const chunk=page.locator('.chunk-option').first();await chunk.click();await still();
    assert.ok((await calls()).some(call=>String(call.target).includes('chunk-check')),'set selection feedback');
    await shot('practice-'+width);
    await nav('profile');await page.locator('#display-name').fill('Unsaved Motion Explorer');
    await resetCalls();await page.locator('[data-avatar-tab=outfit]').click();
    assert.ok((await calls()).some(call=>String(call.target).includes('ui-tab-indicator')),'sliding tab highlight');
    await page.locator('[data-avatar-value=outfit-8]').click();await still();
    assert.equal(await page.locator('#display-name').inputValue(),'Unsaved Motion Explorer');
    assert.equal(await page.locator('[role=tabpanel]:visible').count(),1);
    assert.ok(!(await calls()).some(call=>call.protected),'avatar remains still');
    await shot('profile-'+width);
    await page.locator('[data-avatar-tab=hair]').focus();await page.keyboard.press('ArrowRight');assert.equal(await page.locator('[data-avatar-tab=accessory]').getAttribute('aria-selected'),'true');
    checks.push({width,press:true,bubble:true,dismissal:true,keyboard:true,sectionEntry:true,selection:true,slidingTabs:true,draftPreserved:true,staticCharacters:true,settles:true});
  }
  // Exercise real generated quiz/grammar behavior without saving an attempt.
  await nav('learn');await page.locator('.learning-path [data-path-node]').first().click();await page.locator('#path-bubble [data-start-path]').click();
  await page.locator('#typed-answer').fill('A fictional answer');await resetCalls();await page.locator('[data-action=check-answer]').click();
  assert.ok((await calls()).some(call=>String(call.target).includes('answer-feedback')));await still();
  await resetCalls();await page.locator('[data-action=next-question]').click();await still();
  assert.ok((await calls()).some(call=>call.frames.some(frame=>'width'in frame)),'progress fill');await shot('question');await leave();
  await nav('practice');await page.locator('.chunk-option').first().click();
  if(await page.locator('[data-mix=memory]').isDisabled())await page.locator('.chunk-option').first().click();
  await page.locator('[data-mix=memory]').click();await page.locator('.memory-card').first().click();await still();await shot('memory');await leave();
  // A small isolated fixture tests token movement through the same render hooks.
  const token=await page.evaluate(async()=>{
    const {captureUI,enhanceMotion}=await import('./src/ui-motion.js?v=motion1');
    const host=document.createElement('div');host.style.cssText='position:fixed;inset:100px 30px auto;z-index:100;background:white';document.body.append(host);
    host.innerHTML='<div class="sentence-answer"><span>Select words.</span></div><div class="sentence-tokens"><button data-token="0">Hello</button></div>';
    const before=captureUI(host);host.innerHTML='<div class="sentence-answer"><button data-remove-token="0">Hello</button></div><div class="sentence-tokens"><button data-token="0" disabled>Hello</button></div>';
    enhanceMotion(host,before);const moved=host.querySelector('[data-remove-token]').getAnimations().some(a=>a.playState==='running');host.remove();return moved;
  });assert.ok(token,'answer tile travels from source');
  await nav('profile');await page.locator('[data-avatar-tab=hair]').click();await resetCalls();await page.locator('[data-avatar-tab=background]').click();
  await page.emulateMedia({reducedMotion:'reduce'});await page.waitForFunction(()=>document.getAnimations().filter(a=>a.playState==='running').length===0,null,{timeout:500});
  await resetCalls();await page.locator('[data-avatar-value=bg-navy]').click();await page.locator('[data-avatar-tab=outfit]').click();await nav('learn');
  await page.locator('.learning-path [data-path-node]').first().click();await page.locator('#path-bubble [data-start-path]').hover();await settle();
  assert.deepEqual(await calls(),[]);assert.equal(await page.evaluate(()=>document.getAnimations().filter(a=>a.playState==='running').length),0);
  assert.equal(await page.locator('#path-bubble [data-start-path]').evaluate(el=>getComputedStyle(el).transform),'none');
  assert.deepEqual(errors,[]);assert.ok(apiActions.every(action=>action==='getSession'));
  const runtimeSources=Object.fromEntries(['src/ui-motion.js','src/studio-ui.js','src/app.js','styles/app.css','index.html','service-worker.js'].map(file=>[file,crypto.createHash('sha256').update(fs.readFileSync(new URL('../'+file,import.meta.url))).digest('hex')]));
  fs.writeFileSync(reportFile,JSON.stringify({date:new Date().toISOString(),revision:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),runtimeSources,base,checks,progressFill:true,answerFeedback:true,tokenMovement:token,memory:true,reducedMotion:true,midFlightReducedMotion:true,api:'Synthetic session only; real API requests intercepted; no profile/attempt writes',errors,pass:true,limits:['Edge/Chromium only. Token movement uses a small DOM fixture with the production motion hooks. Visual verdict recorded after screenshot review.']},null,2)+'\n');
  console.log('PASS interface motion at four widths; static characters; reduced motion; no backend writes');
}catch(error){console.error(error);console.error(JSON.stringify({errors,calls:await calls(),checks}));await page.screenshot({path:path.join(out,'failure.png')});process.exitCode=1;}finally{await browser.close();}
