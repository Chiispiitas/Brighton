import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const require=createRequire(import.meta.url);
const {chromium}=require('C:/Users/David/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const base=process.env.HZ_APP_URL||'http://127.0.0.1:8898/Horizons/App/';
const out='C:/Users/David/Documents/Codex/2026-11-05/feedback-sounds';
fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
const context=await browser.newContext({viewport:{width:1440,height:900},serviceWorkers:'block'});
await context.addCookies([{url:base,name:'hz_companion_session',value:'fictional-sound-preview'}]);
await context.route('**/api/horizons',route=>route.fulfill({contentType:'application/json',body:JSON.stringify({profile:{displayName:'Sound Explorer',avatar:{}},books:[{id:'horizons-a1',level:'A1',status:'active',expiresAt:'2030-01-01T00:00:00Z'}],progress:{xp:120,streak:3}})}));
const fixture="window.soundFixture=(type='text',listening=false)=>{const q={id:'sound-fixture',type,prompt:'Put your answer below.',answer:type==='choice'?'hello':type==='order'?'I am here':'Hello',accepted:[type==='order'?'I am here':'Hello'],correctText:type==='order'?'I am here':'Hello',sentenceTokens:['I','am','here'],choices:[{id:'hello',text:'Hello'},{id:'bye',text:'Goodbye'}],listening};state.active={kind:'quiz',title:'Answer sounds preview',questions:[q,{...q,id:'next'}],options:{},index:0,selected:null,order:[],checked:false,feedback:null,answers:[],hintUsed:false,previewVisible:false,started:Date.now()};render();};window.rerenderSoundFixture=()=>render();";
await context.route('**/src/app.js?*',route=>route.fulfill({contentType:'text/javascript',body:fs.readFileSync(new URL('../src/app.js',import.meta.url),'utf8')+fixture}));
await context.addInitScript(()=>{
 window.soundCalls=[];window.soundPauses=[];window.soundEnded=[];window.blockSound=false;window.realSoundPlayback=false;
 const play=HTMLMediaElement.prototype.play,pause=HTMLMediaElement.prototype.pause;
 HTMLMediaElement.prototype.play=function(){if(this.src.includes('/feedback-v1/')){soundCalls.push(this.src);if(blockSound)return Promise.reject(new Error('Playback denied fixture'));if(!realSoundPlayback)return Promise.resolve();this.addEventListener('ended',()=>soundEnded.push(this.src),{once:true});}return play.call(this);};
 HTMLMediaElement.prototype.pause=function(){if(this.src.includes('/feedback-v1/'))soundPauses.push(this.src);return pause.call(this);};
});
const page=await context.newPage(),errors=[],failed=[];
page.on('pageerror',e=>errors.push(e.message));page.on('requestfailed',r=>failed.push(r.url()));
await page.goto(base);await page.locator('.overworld-map').waitFor();
const decoded=await page.evaluate(async()=>{
 const ctx=new AudioContext(),results=[];
 for(const name of['correct','wrong']){const response=await fetch(`./assets/audio/feedback-v1/${name}.mp3`);if(!response.ok)throw Error('Missing sound');const sound=await ctx.decodeAudioData(await response.arrayBuffer());const data=sound.getChannelData(0),peak=data.reduce((m,x)=>Math.max(m,Math.abs(x)),0);results.push({name,duration:sound.duration,sampleRate:sound.sampleRate,channels:sound.numberOfChannels,peak});}
 await ctx.close();return results;
});
for(const cue of decoded){assert.ok(cue.duration>.4&&cue.duration<1);assert.ok(cue.peak>0&&cue.peak<1);}
const count=()=>page.evaluate(()=>soundCalls.length);
const samples=[];
for(const type of['text','choice','order'])for(const correct of[true,false]){
 await page.evaluate(type=>soundFixture(type),type);const before=await count();
 if(type==='text'){await page.locator('#text-answer-form').dispatchEvent('submit');assert.equal(await count(),before);await page.locator('#typed-answer').fill(correct?'Hello':'Wrong');}
 else if(type==='choice')await page.locator(`[data-choice=${correct?'hello':'bye'}]`).click();
 else for(const index of(correct?[0,1,2]:[2,1,0]))await page.locator(`[data-token="${index}"]`).click();
 assert.equal(await count(),before,'selecting or typing is silent');
 await page.locator('[data-action=check-answer]').click();
 assert.equal(await count(),before+1);
 assert.ok((await page.evaluate(()=>soundCalls.at(-1))).endsWith(`/${correct?'correct':'wrong'}.mp3`));
 if(type==='text')await page.locator('#text-answer-form').dispatchEvent('submit');
 await page.evaluate(()=>rerenderSoundFixture());assert.equal(await count(),before+1,'duplicate submit and rerender are silent');
 const pauses=await page.evaluate(()=>soundPauses.length);await page.locator('[data-action=next-question]').click();assert.ok(await page.evaluate(()=>soundPauses.length)>pauses);
 samples.push({type,correct});
}
await page.evaluate(()=>soundFixture());await page.locator('#typed-answer').fill('Hello');
await page.getByRole('button',{name:'Mute answer sounds',exact:true}).click();
assert.equal(await page.locator('#typed-answer').inputValue(),'Hello','mute preserves draft');
let before=await count();await page.locator('[data-action=check-answer]').click();assert.equal(await count(),before);
await page.reload();await page.locator('.overworld-map').waitFor();await page.evaluate(()=>soundFixture());
assert.equal(await page.locator('.feedback-sound-toggle').getAttribute('aria-pressed'),'false','mute persists');
await page.getByRole('button',{name:'Enable answer sounds',exact:true}).click();
await page.emulateMedia({reducedMotion:'reduce'});await page.evaluate(()=>{soundFixture('text',true);blockSound=true;});
assert.equal(await page.locator('.question-body').textContent().then(s=>s.includes('Hello')),false);
await page.locator('#typed-answer').fill('Hello');await page.locator('[data-action=check-answer]').click();
assert.equal(await page.locator('.activity-page').getAttribute('data-answer-state'),'correct','denied audio never blocks grading');
assert.equal(await count(),1,'reduced motion does not mute sounds');
await page.evaluate(()=>{blockSound=false;Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});document.dispatchEvent(new Event('visibilitychange'));soundFixture();});
before=await count();await page.locator('#typed-answer').fill('Hello');await page.locator('[data-action=check-answer]').click();assert.equal(await count(),before,'hidden page stays silent');
await page.evaluate(()=>{delete document.hidden;});
for(const width of[320,390,768,1440]){await page.setViewportSize({width,height:900});await page.evaluate(()=>soundFixture());assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));assert.ok(await page.locator('.feedback-sound-toggle').evaluate(el=>{const r=el.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth;}));await page.screenshot({path:`${out}/${width}-sound-toggle.png`,fullPage:true});}
await page.evaluate(()=>{realSoundPlayback=true;});
for(const correct of[true,false]){await page.evaluate(()=>soundFixture());await page.locator('#typed-answer').fill(correct?'Hello':'Wrong');await page.locator('[data-action=check-answer]').click();await page.waitForFunction(n=>soundEnded.length===n,correct?1:2);}
let pauses=await page.evaluate(()=>soundPauses.length);await page.locator('[data-action=leave-activity]').click();await page.locator('[data-leave-confirm]').click();await page.locator('.overworld-map').waitFor();assert.ok(await page.evaluate(()=>soundPauses.length)>pauses,'leaving stops cue');
assert.deepEqual(errors,[]);assert.deepEqual(failed,[]);
await browser.close();
fs.writeFileSync(new URL('../reports/feedback-sounds.json',import.meta.url),JSON.stringify({base,pass:true,decoded,samples,blankAndSelectionSilent:true,oneCuePerGradedAnswer:true,rerenderSilent:true,nextStopsSound:true,leaveStopsSound:true,mutePersists:true,mutePreservesDraft:true,blockedPlaybackSafe:true,reducedMotionIndependent:true,listeningAnswerHidden:true,hiddenPageSilent:true,nativeGesturePlaybackCompleted:['correct','wrong'],headerWidths:[320,390,768,1440],fixture:'Synthetic session and questions; real renderer, answer matching, gradeCurrent and local sound controller. Media play is spied to count calls, then both real HTML audio cues play to completion from Check clicks; files separately decoded in real browser.',errors,failed},null,2)+'\n');
console.log('PASS ElevenLabs files decode; correct/wrong once, mute persistence, draft, stops, denied playback, listening privacy, reduced motion, four header widths');
