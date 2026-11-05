import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),{chromium}=require('C:/Users/David/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const base=process.env.HZ_APP_URL||'http://127.0.0.1:8898/Horizons/App/';
const out=new URL('../docs/avatar-face-v2/',import.meta.url);fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
async function context(options={}){
 const c=await browser.newContext({viewport:{width:1440,height:1000},serviceWorkers:'block',...options});
 await c.addCookies([{url:base,name:'hz_companion_session',value:'fictional-face-proof'}]);
 await c.route('**/api/horizons',r=>r.fulfill({contentType:'application/json',body:JSON.stringify({profile:{displayName:'Town Explorer',avatar:{body:'female',skin:'skin-3',hair:'hair-9',outfit:'outfit-3',background:'bg-mint',hairColor:'color-auburn'}},books:[{id:'horizons-a1',level:'A1',status:'active',expiresAt:'2030-01-01T00:00:00Z'}],progress:{xp:120,streak:3}})}));
 return c;
}
const c=await context(),page=await c.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.goto(base);await page.locator('.path-player [data-avatar-motion=minimal]').waitFor();await page.locator('.path-player [data-avatar-motion=minimal]').evaluate(el=>new Promise((resolve,reject)=>{let closed=false;const observer=new MutationObserver(()=>{if(el.dataset.avatarBlink==='closed')closed=true;if(closed&&el.dataset.avatarBlink==='open'){clearTimeout(timer);observer.disconnect();resolve(true);}});observer.observe(el,{attributes:true,attributeFilter:['data-avatar-blink']});const timer=setTimeout(()=>{observer.disconnect();reject(Error('Natural blink did not close and reopen within6500ms: '+JSON.stringify([...el.querySelectorAll('.hzn-avatar-idle')].flatMap(x=>x.getAnimations().map(a=>({time:a.currentTime,state:a.playState}))))));},6500);}));
async function sample(root,time){
 await root.locator('.hzn-avatar-idle').evaluate((el,t)=>{const a=el.getAnimations()[0];a.pause();a.currentTime=t},time);
 await page.waitForTimeout(35);
 return root.evaluate(el=>{
  const bg=el.closest('#avatar-preview')||el;
  const box=bg.getBoundingClientRect(),stage=el.querySelector('.hzn-avatar-idle').getBoundingClientRect();
  return {artHeight:stage.height,background:{x:box.x,y:box.y,w:box.width,h:box.height,transform:getComputedStyle(bg).transform,animations:bg.getAnimations().length},
   head:el.querySelector('[data-static-part=head] img').src,
   face:getComputedStyle(el.querySelector('.hzn-avatar-face')).transform,
   pupil:getComputedStyle(el.querySelector('[data-face-part=pupil]')).transform,
   blink:el.querySelector('[data-avatar-blink]').dataset.avatarBlink,
   eyesHidden:el.querySelector('[data-static-part=open-eyes]').hidden,
   lidsHidden:el.querySelector('[data-static-part=closed-eyes]').hidden,
   oldStillHidden:el.querySelector('[data-static-part=still-fallback]').hidden,
   mask:getComputedStyle(el.querySelector('[data-static-part=face-mask]')).maskImage,
   restingPupils:[...el.querySelectorAll('[data-eye-mask]')].map(eye=>{const r=eye.querySelector('[data-face-part=pupil] img').getBoundingClientRect();return{actual:[(r.x+r.width/2-stage.x)/stage.width*320,(r.y+r.height/2-stage.y)/stage.height*320],expected:JSON.parse(eye.dataset.restAnchor).pupil};}),eyeLogicalWidth:JSON.parse(el.querySelector('[data-eye-mask]').dataset.restAnchor).w,
   pupilWidth:el.querySelector('[data-face-part=pupil] img').getBoundingClientRect().width,eyeWidth:el.querySelector('[data-eye-mask]').getBoundingClientRect().width,
   pupilMask:[...el.querySelectorAll('[data-eye-mask]')].every(x=>getComputedStyle(x).maskImage!=='none'),
   opaque:[el,...el.querySelectorAll('*')].every(x=>getComputedStyle(x).opacity==='1'),
   opacityTracks:el.getAnimations({subtree:true}).some(a=>a.effect.getKeyframes().some(k=>'opacity'in k))};
 });
}
const widths=[320,390,768,1440],samples=[];
for(const width of widths){
 await page.setViewportSize({width,height:1000});
 const player=page.locator('.path-player [data-avatar-static]');
 const p0=await sample(player,0),p1=await sample(player,1600),p2=await sample(player,3700),pb=await sample(player,4210),p3=await sample(player,4500);
 assert.deepEqual(p0.background,p1.background);assert.deepEqual(p0.background,p2.background);assert.deepEqual(p0.background,pb.background);
 assert.ok(Math.abs(p1.pupilWidth/p1.eyeWidth-21/p1.eyeLogicalWidth)<.01);for(const p of p0.restingPupils)for(let i=0;i<2;i++)assert.ok(Math.abs(p.actual[i]-p.expected[i])<.5,'neutral pupil matches accepted still '+JSON.stringify(p));assert.ok(p1.artHeight/p0.artHeight>1.005,'breathing visibly changes avatar height');assert.notEqual(p1.pupil,p2.pupil);assert.notEqual(p1.face,p2.face);
 assert.equal(pb.blink,'closed');assert.equal(pb.eyesHidden,true);assert.equal(pb.lidsHidden,false);assert.equal(p3.blink,'open');
 for(const s of [p0,p1,p2,pb,p3]){assert.equal(s.head,p0.head);assert.ok(s.head.endsWith('/avatar-face-v2/blank-heads.png'));assert.ok(s.oldStillHidden&&s.pupilMask&&s.mask!=='none'&&s.opaque&&!s.opacityTracks);}
 await page.locator('[data-route=profile]:visible').first().click();await page.locator('#avatar-preview [data-avatar-motion=minimal]').waitFor();
 const editor=page.locator('#avatar-preview [data-avatar-static]'),a=await sample(editor,0),b=await sample(editor,1600),d=await sample(editor,4210);
 assert.deepEqual(a.background,b.background);assert.deepEqual(a.background,d.background);
 await editor.evaluate(el=>el.dispatchEvent(new CustomEvent('hzn-avatar-feedback',{detail:'customize'})));
 await editor.locator('.hzn-avatar-feedback').evaluate(el=>{const a=el.getAnimations()[0];a.pause();a.currentTime=160});
 const bounce=await sample(editor,1600);assert.deepEqual(a.background,bounce.background);
 if(width===1440){
  await editor.locator('.hzn-avatar-feedback').evaluate(el=>el.getAnimations().forEach(a=>a.cancel()));
  await sample(editor,0);await page.locator('#avatar-preview').screenshot({path:new URL('neutral.png',out).pathname.replace(/^\/([A-Za-z]:)/,'$1')});
  await sample(editor,4210);await page.locator('#avatar-preview').screenshot({path:new URL('blink.png',out).pathname.replace(/^\/([A-Za-z]:)/,'$1')});
 }
 samples.push({width,path:[p0,p1,p2,pb,p3],editor:[a,b,d],bounce});
 await page.locator('[data-route=learn]:visible').first().click();await page.locator('.path-player [data-avatar-motion=minimal]').waitFor();
}
await c.close();
const fallback=await context();await fallback.route('**/avatar-face-v2/eye-left.png',r=>r.fulfill({status:404,body:''}));
const f=await fallback.newPage();await f.goto(base);await f.locator('.path-player [data-avatar-motion=fallback]').waitFor();
assert.equal(await f.locator('.path-player [data-static-part=still-fallback]').evaluate(el=>el.hidden),false);
assert.equal(await f.locator('.path-player .hzn-avatar-idle').evaluate(el=>el.getAnimations().length),0);
await fallback.close();assert.deepEqual(errors,[]);
if(process.env.HZ_RECORD_AVATAR){
 const videoDir='C:/Users/David/Documents/Codex/2026-11-05/avatar-motion/face-v2-recordings';fs.mkdirSync(videoDir,{recursive:true});
 const v=await context({recordVideo:{dir:videoDir,size:{width:1440,height:1000}}}),p=await v.newPage();
 await p.goto(base);await p.locator('.path-player [data-avatar-motion=minimal]').waitFor();await p.locator('[data-route=profile]:visible').first().click();await p.locator('#avatar-preview [data-avatar-motion=minimal]').waitFor();
 await p.waitForTimeout(10600);await p.locator('[data-avatar-tab=outfit]').click();await p.locator('[data-avatar-value=outfit-8]').click();await p.waitForTimeout(800);
 await v.close();fs.writeFileSync(videoDir+'/latest-path.txt',await p.video().path());
}
await browser.close();
fs.writeFileSync(process.env.HZ_AVATAR_FACE_REPORT||new URL('../reports/avatar-face-proof.json',import.meta.url),JSON.stringify({base,pass:true,widths,samples,separateGeneratedBlankAndFeatures:true,naturalClockBlink:true,pupilLogicalWidth:21,neutralPupilsMatchAcceptedStill:true,fixedBackgroundThroughIdleAndBounce:true,containedPupils:true,opaque:true,missingSpriteFallback:true,errors},null,2)+'\n');
console.log('PASS separate blank/feature rig, gaze, masks, fixed backgrounds, opacity and fallback at four widths');
