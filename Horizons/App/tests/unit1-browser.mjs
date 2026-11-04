import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import {course,lessons,vocabulary,chunks,activities} from '../content/unit1.mjs';
import {getActivityQuestions,makeVocabularyQuestions,getWordsForChunks} from '../content/engine.mjs';

const require=createRequire(import.meta.url),{chromium}=require('C:/Users/David/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const app=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const base=process.argv[2]||'http://127.0.0.1:8875/Horizons/App/';
const code=process.env.HZ_LEARNING_QA_CODE||'DEMO-HZ-A1-004';
if(!/^DEMO-HZ-A1-004$/.test(code))throw new Error('This learning-flow test is isolated to the reserved004 profile.');
const proof=process.env.HZ_LEARNING_PROOF||'C:/Users/David/Documents/Codex/2026-10-05/hav/work/horizons-learning-proof-20261104';
fs.mkdirSync(proof,{recursive:true});
const report={date:new Date().toISOString(),base,scope:'Independent Unit1 learning-flow QA against the actual deployed backend; no mocked authentication',testCode:code,
 checks:[],failures:[],screenshots:[],apiCalls:[],runtimeErrors:[],coverage:{lessonPaths:[],completedActivities:[],bookAudioLessons:[],mixedWordIds:[]},
 limits:['This run uses Chromium/Edge, not every browser engine.','Runtime audio checks are muted playback/decode checks, not a subjective voice-quality review.','Code issuance, expiry, linking and adversarial backend cases are reviewed separately by the backend owner.']};
const questionPool=[...activities.flatMap(activity=>getActivityQuestions(activity.id,{count:'all',seed:'browser-answer-reference'})),...makeVocabularyQuestions(vocabulary,{mode:'recall',seed:'browser-recall-reference'})];
let lastBootstrap=null,lastAttempt=null,firstProfileId=null;
const observing=new Set();
const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
const context=await browser.newContext({viewport:{width:1360,height:950}});
await context.addInitScript(()=>{
 const original=HTMLMediaElement.prototype.play;
 window.__learningPlayedMedia=[];
 HTMLMediaElement.prototype.play=function(...args){this.muted=true;window.__learningPlayedMedia.push(this);return original.apply(this,args);};
});
let page=await context.newPage();
function attach(p){
 p.on('pageerror',error=>report.runtimeErrors.push(String(error)));
 p.on('response',response=>{
  if(!response.url().includes('/api/horizons')||response.request().method()!=='POST')return;
  const work=(async()=>{
  let request,data;try{request=response.request().postDataJSON();data=await response.json();}catch{return;}
  const body=data?.data&&typeof data.data==='object'?data.data:data;
  if(body.profile||body.progress||body.books)lastBootstrap=body;
  const record={action:request.action,status:response.status(),ok:response.ok()&&data.ok!==false,error:data.ok===false?data.error:null,
   profileId:body.profile?.id,xp:body.progress?.xp,completedCount:(body.progress?.completedActivities||body.progress?.completedActivityIds||[]).length};
  if(request.action==='saveAttempt'){
   lastAttempt={request:request.attempt,response:body,status:response.status()};
   record.activityId=request.attempt?.activityId;record.answers=request.attempt?.answers?.length;record.awardedXp=body.awardedXp;
  }
  report.apiCalls.push(record);
  })();
  observing.add(work);work.finally(()=>observing.delete(work));
 });
}
attach(page);
const observeResponses=async()=>{while(observing.size)await Promise.all([...observing]);};
const screenshot=async(name,scope,p=page)=>{await p.waitForTimeout(900);const file=path.join(proof,`${name}.png`);await p.screenshot({path:file,fullPage:false});report.screenshots.push({file,scope});};
const waitSaved=async(p=page)=>{
 await p.locator('.result-page').waitFor({timeout:40000});
 await p.waitForFunction(()=>Boolean(document.querySelector('.save-error'))||[...document.querySelectorAll('.save-note')].some(x=>x.textContent.startsWith('Saved.')),undefined,{timeout:45000});
 const error=await p.locator('.save-error').count()?await p.locator('.save-error').textContent():null;assert.equal(error,null,error||'');
 await observeResponses();
};
const nav=async(route,p=page)=>{await p.locator(`[data-route="${route}"]:visible`).first().click();await p.waitForTimeout(90);};
async function leaveActivity(p=page){
 if(await p.locator('dialog[open] [data-dialog-close]').count())await p.locator('dialog[open] [data-dialog-close]').first().click();
 if(await p.locator('[data-action="leave-activity"]').count()){
  await p.locator('[data-action="leave-activity"]').click();await p.locator('[data-leave-confirm]').click();
 }else if(await p.locator('[data-action="back-to-path"]').count())await p.locator('[data-action="back-to-path"]').click();
 else if(await p.locator('[data-route="learn"]:visible').count())await nav('learn',p);
}
async function step(name,fn){
 try{const detail=await fn();report.checks.push({name,pass:true,detail:detail??null});console.log(`PASS ${name}`);}
 catch(error){const detail=String(error.message||error).slice(0,1600);report.checks.push({name,pass:false,detail});report.failures.push({name,detail});console.log(`FAIL ${name}: ${detail}`);try{await screenshot(`failure-${report.failures.length}`,name);}catch{}try{await leaveActivity();}catch{}}
}
async function resolveQuestion(p=page){
 const prompt=(await p.locator('.question-body h1').textContent()).trim();
 const buttons=await p.locator('[data-choice]').evaluateAll(nodes=>nodes.map(node=>({id:node.dataset.choice,text:node.querySelector(':scope > span:last-of-type')?.textContent.trim()||node.textContent.trim()})));
 if(buttons.length){const id=buttons[0].id.replace(/-option-\d+$/,'');const q=questionPool.find(x=>x.id===id&&x.type==='choice');assert.ok(q,`No reviewed reference for choice ${id}`);return {q,buttons,prompt};}
 const tokenValues=await p.locator('[data-token]').evaluateAll(nodes=>nodes.map(x=>x.textContent.trim()));
 if(tokenValues.length){
  const bag=values=>[...values].sort().join('|');
  const q=questionPool.find(x=>x.type==='order'&&x.prompt===prompt&&bag(x.tokens||x.sentenceTokens.map(t=>typeof t==='string'?t:t.text))===bag(tokenValues));
  assert.ok(q,`No reviewed order reference for ${prompt}`);return {q,tokenValues,prompt};
 }
 const preview=await p.locator('.question-preview b').count()?await p.locator('.question-preview b').textContent():null;
 const q=questionPool.find(x=>x.type==='text'&&x.prompt===prompt&&(!preview||x.preview===preview));
 assert.ok(q,`No reviewed text reference for ${prompt}`);return {q,prompt};
}
async function submitQuestion(reference,{wrong=false,p=page}={}){
 const{q,buttons}=reference;
 if(buttons?.length){const choice=wrong?buttons.find(x=>x.text!==q.correctText):buttons.find(x=>x.text===q.correctText);assert.ok(choice,`Expected choice missing for ${q.id}`);await p.locator(`[data-choice="${choice.id}"]`).click();}
 else if(q.type==='order'){
  const target=q.normalization==='spelling'?[...q.answer]:String(q.answer).split(/\s+/);
  const used=new Set();
  for(const token of wrong?[...target].reverse():target){
   const choices=await p.locator('[data-token]').evaluateAll(nodes=>nodes.map(x=>({index:x.dataset.token,text:x.textContent.trim(),disabled:x.disabled})));
   const next=choices.find(x=>x.text===token&&!x.disabled&&!used.has(x.index));assert.ok(next,`Token ${token} missing in ${q.id}`);used.add(next.index);await p.locator(`[data-token="${next.index}"]`).click();
  }
 }else{
  if(await p.locator('.question-preview').count())await p.locator('.question-preview').waitFor({state:'hidden',timeout:10000});
  await p.locator('#typed-answer').fill(wrong?'not the right answer':String(q.accepted?.[0]??q.answer));
 }
 await p.locator('[data-action="check-answer"]').click();
 await p.locator('.answer-feedback').waitFor();
 const positive=await p.locator('.answer-feedback b').textContent();
 assert.equal(positive,wrong?'A little reminder':'You’ve got it!',`${q.id} feedback`);
 return {id:q.id,type:q.type,wordIds:q.wordIds||[],correct:!wrong};
}
async function completeRound({wrongFirst=false,captureName,p=page}={}){
 const answers=[];
 for(let i=0;i<200;i++){
  if(await p.locator('.result-page').count())break;
  await p.locator('.question-body').waitFor();const ref=await resolveQuestion(p);answers.push(await submitQuestion(ref,{wrong:wrongFirst&&answers.length===0,p}));
  if(captureName&&answers.length===1)await screenshot(captureName,`${ref.q.type} feedback`,p);
  await p.locator('[data-action="next-question"]').click();
 }
 await waitSaved(p);assert.ok(answers.length);return answers;
}
try{
 await step('code-only entry opens a real saved profile',async()=>{
  await page.goto(`${base}?learning-qa=${Date.now()}`,{waitUntil:'domcontentloaded'});await page.locator('#book-code').waitFor({timeout:40000});
  assert.equal(await page.locator('input[type="password"],input[type="email"]').count(),0);
  await page.locator('#book-code').fill(code);await page.locator('#redeem-form [type="submit"]').click();
  await page.waitForFunction(()=>window.HorizonsApp?.getState().signedIn,undefined,{timeout:45000});
  await observeResponses();
  assert.ok(lastBootstrap?.profile?.id);firstProfileId=lastBootstrap.profile.id;
  await nav('profile');const syntheticName=`Flow four ${Date.now().toString().slice(-6)}`;
  await page.locator('#display-name').fill(syntheticName);await page.locator('#profile-form [type="submit"]').click();
  await page.waitForFunction(name=>Boolean(document.getElementById('profile-error')?.textContent.trim())||(document.getElementById('toast')?.textContent.includes('profile is saved')&&document.getElementById('display-name')?.value===name),syntheticName,{timeout:40000});
  assert.equal((await page.locator('#profile-error').textContent()).trim(),'');
  report.profileName=syntheticName;await nav('learn');return {profileId:firstProfileId,name:syntheticName};
 });
 if(!firstProfileId)throw new Error('Cannot exercise learning flows without a genuine authenticated test profile.');

 await step('all four lesson paths and every word set are available',async()=>{
  for(const lesson of lessons){assert.equal(await page.locator(`#lesson-${lesson.id}`).count(),1);report.coverage.lessonPaths.push(lesson.id);}
  assert.equal(await page.locator('[data-start-chunk]').count(),chunks.length);
  const advertised=await page.locator('[data-start-activity]').evaluateAll(nodes=>[...new Set(nodes.map(n=>n.dataset.startActivity))]);
  for(const activity of activities.filter(x=>x.type!=='quiz'))assert.ok(advertised.includes(activity.id),activity.id);
  await screenshot('learning-path-desktop','Actual home path with all four lessons available');
  return {lessons:lessons.length,wordSets:chunks.length,registeredActivities:activities.length};
 });

 await step('a full vocabulary round handles a wrong answer, correction and real progress save',async()=>{
  const oldXp=lastBootstrap.progress?.xp||0;
  await page.locator('[data-start-chunk="1a-greetings"]').click();
  const answers=await completeRound({wrongFirst:true,captureName:'wrong-answer-correction'});
  assert.equal(answers.length,6);assert.equal(answers.filter(x=>x.correct).length,5);
  assert.equal(lastAttempt?.status,200);assert.equal(lastAttempt?.request.activityId,'quiz-1a-greetings');
  assert.ok(lastBootstrap.progress.xp>oldXp);assert.ok((lastBootstrap.progress.completedActivities||lastBootstrap.progress.completedActivityIds).includes('quiz-1a-greetings'));
  await screenshot('saved-vocabulary-result','Completed source-aligned quiz saved by the deployed backend');report.coverage.completedActivities.push('quiz-1a-greetings');
  await leaveActivity();return {questions:6,correct:5,xpBefore:oldXp,xpAfter:lastBootstrap.progress.xp};
 });

 for(const id of ['practice-1b-contractions','practice-1c-be-descriptions','practice-1d-capitals'])await step(`real grammar interaction and grading: ${id}`,async()=>{
  await page.locator(`[data-start-activity="${id}"]`).click();
  const answers=await completeRound({captureName:`grammar-${id}`});
  assert.equal(answers.length,8);assert.equal(lastAttempt?.status,200);report.coverage.completedActivities.push(id);
  await leaveActivity();return {questionTypes:[...new Set(answers.map(x=>x.type))],questions:answers.length};
 });

 await step('a mixed round combines selected sets from two lessons and covers all selected words',async()=>{
  await nav('practice');const chosen=['1a-greetings','1c-world-start'];
  for(const id of chosen)await page.locator(`input[name="chunk"][value="${id}"]`).check();
  const roundSelect=page.locator('#round-length,#round-size,select[name="round-size"],select[data-round-size]');
  if(await roundSelect.count())await roundSelect.first().selectOption('all');
  else throw new Error('The mixed-round length selector is missing.');
  await screenshot('mixed-set-chooser','A1 greetings plus1C country/nationality sets, all selected words');
  await page.locator('[data-mix="quiz"]').click();const answers=await completeRound();
  const expected=new Set(getWordsForChunks(chosen).map(x=>x.id)),actual=new Set(answers.flatMap(x=>x.wordIds));
  assert.equal(answers.length,expected.size);assert.deepEqual(actual,expected);report.coverage.mixedWordIds=[...actual];
  assert.equal(lastAttempt?.status,200);await leaveActivity();return {sets:chosen,questions:answers.length,allSelectedWordsCovered:true};
 });

 await step('a short mixed recall round uses typed retrieval from two lessons and saves',async()=>{
  await nav('practice');
  const selectedIds=await page.locator('input[name="chunk"]:checked').evaluateAll(nodes=>nodes.map(node=>node.value));
  for(const id of selectedIds)await page.locator(`input[name="chunk"][value="${id}"]`).uncheck();
  const chosen=['1b-jobs-town','1d-names-contact'];
  for(const id of chosen)await page.locator(`input[name="chunk"][value="${id}"]`).check();
  await page.locator('#round-length').selectOption('8');
  await page.locator('[data-mix="recall"]').click();const answers=await completeRound({captureName:'mixed-recall'});
  assert.equal(answers.length,8);assert.deepEqual([...new Set(answers.map(x=>x.type))],['text']);
  const allowed=new Set(getWordsForChunks(chosen).map(x=>x.id));assert.ok(answers.flatMap(x=>x.wordIds).every(id=>allowed.has(id)));
  assert.equal(lastAttempt?.status,200);assert.equal(lastAttempt?.request.activityId,'mix-recall');
  await leaveActivity();return {sets:chosen,questions:answers.length,typedRetrieval:true};
 });

 await step('the actual memory game reveals, rejects a mismatch, completes and saves',async()=>{
  await page.locator('[data-start-activity="1a-greeting-pairs"]').click();
  const cards=await page.locator('[data-memory]').evaluateAll(nodes=>nodes.map(x=>x.dataset.memory));
  assert.ok(cards.length>=6);const first=cards[0],firstPair=first.replace(/-(left|right)$/,'');const wrong=cards.find(id=>!id.startsWith(`${firstPair}-`));
  await page.locator(`[data-memory="${first}"]`).click();await page.locator(`[data-memory="${wrong}"]`).click();
  await page.waitForTimeout(1150);assert.equal(await page.locator('.memory-card.flipped:not(.matched)').count(),0);
  const pairs=[...new Set(cards.map(id=>id.replace(/-(left|right)$/,'')))];
  for(const pair of pairs){await page.locator(`[data-memory="${pair}-left"]`).click();await page.locator(`[data-memory="${pair}-right"]`).click();}
  assert.equal(await page.locator('.memory-card.matched').count(),cards.length);await screenshot('completed-memory-game','All genuine greeting/meaning pairs matched after an initial mistake');
  await page.locator('[data-action="finish-game"]').click();await waitSaved();assert.equal(lastAttempt?.status,200);report.coverage.completedActivities.push('1a-greeting-pairs');await leaveActivity();return {pairs:pairs.length,wrongPairRecovered:true};
 });

 await step('postcard delivery is a real country–nationality matching game',async()=>{
  await page.locator('[data-start-activity="1c-postcards"]').click();await page.locator('[data-match-left]').first().waitFor();
  const ids=await page.locator('[data-match-left]').evaluateAll(nodes=>nodes.map(x=>x.dataset.matchLeft));assert.ok(ids.length>=3);
  await page.locator(`[data-match-left="${ids[0]}"]`).click();await page.locator(`[data-match-right="${ids[1]}"]`).click();assert.equal(await page.locator('.matching-word.matched').count(),0);
  for(const id of ids){await page.locator(`[data-match-left="${id}"]`).click();await page.locator(`[data-match-right="${id}"]`).click();}
  await screenshot('completed-postcards','Country and nationality pairs remain distinct and readable');await page.locator('[data-action="finish-game"]').click();await waitSaved();assert.equal(lastAttempt?.status,200);report.coverage.completedActivities.push('1c-postcards');await leaveActivity();return {pairs:ids.length};
 });

 await step('earned image pins can be worn and saved on the learner avatar',async()=>{
  assert.ok(lastBootstrap.progress.xp>=250,'This learning sequence earns every shipped pin threshold.');
  await nav('profile');const pins=page.locator('[data-avatar-group="badge"]');
  assert.equal(await pins.count(),4);
  for(const id of ['star-pin','trophy-pin','compass-pin'])assert.equal(await page.locator(`[data-avatar-group="badge"][data-avatar-value="${id}"]`).isEnabled(),true);
  await page.locator('[data-avatar-group="badge"][data-avatar-value="compass-pin"]').click();
  await page.locator('#profile-form [type="submit"]').click();
  await page.waitForFunction(()=>Boolean(document.getElementById('profile-error')?.textContent.trim())||document.getElementById('toast')?.textContent.includes('profile is saved'),undefined,{timeout:40000});
  assert.equal((await page.locator('#profile-error').textContent()).trim(),'');await observeResponses();
  assert.equal(lastBootstrap.profile.avatar.badge,'compass-pin');report.savedBadge='compass-pin';
  await page.locator('[data-avatar-group="badge"][data-avatar-value="compass-pin"]').scrollIntoViewIfNeeded();await screenshot('earned-avatar-pins','Real XP unlocks ImageGen-created avatar pins and the selected pin is saved');
  await nav('progress');assert.equal(await page.locator('.reward-milestone.earned').count(),3);await nav('learn');
  return {earned:['star-pin','trophy-pin','compass-pin'],worn:'compass-pin',saved:true};
 });

 await step('source reading questions show their evidence and grade correctly',async()=>{
  await page.locator('[data-start-activity="read-1c"]').click();assert.ok((await page.locator('.question-passage').textContent()).length>30);
  const reference=await resolveQuestion();await submitQuestion(reference);await screenshot('source-reading','A source-aligned class post or room card supports the answer');await leaveActivity();return {questionId:reference.q.id};
 });

 await step('the word bank plays a real generated Jessica pronunciation clip',async()=>{
  await nav('practice');await page.locator('[data-action="word-bank"]:visible').first().click();
  const wordId='v-personal-what-is-your-phone-number';await page.locator(`[data-word="${wordId}"]`).click();
  await page.locator(`[data-speak="${wordId}"]`).click();
  await page.waitForFunction(()=>{const audio=window.__learningPlayedMedia.at(-1);return audio&&(audio.currentTime>.1||audio.error);},undefined,{timeout:10000});
  const playback=await page.evaluate(()=>{const audio=window.__learningPlayedMedia.at(-1);return audio?{src:audio.currentSrc,time:audio.currentTime,duration:audio.duration,paused:audio.paused,error:audio.error?.code||null}:null;});
  assert.ok(playback&&playback.src.includes('/assets/audio/')&&playback.time>.1&&Number.isFinite(playback.duration)&&!playback.error,`The word must use the produced pronunciation asset, not a simulated player: ${JSON.stringify(playback)}`);
  await screenshot('word-pronunciation','A real Jessica word-bank pronunciation clip opened from the learner word collection');
  await page.locator('[data-dialog-close]:visible').first().click();await nav('learn');return playback;
 });

 for(const lessonId of ['1A','1B','1C','1D'])await step(`actual book audio plays from lesson ${lessonId}`,async()=>{
  await page.locator(`[data-start-activity="listen-${lessonId.toLowerCase()}"]`).click();const audio=page.locator('.question-audio audio');await audio.waitFor();
  const before=await audio.evaluate(async element=>{element.muted=true;window.__learningTestAudio=element;await element.play();return {src:element.currentSrc,duration:element.duration};});
  await page.waitForTimeout(400);const playing=await audio.evaluate(element=>({time:element.currentTime,paused:element.paused,readyState:element.readyState,duration:element.duration,error:element.error?.code||null}));
  assert.ok(playing.time>.15&&!playing.paused&&playing.readyState>=2&&!playing.error);assert.ok(Number.isFinite(playing.duration)&&playing.duration>1);
  if(lessonId==='1C')await screenshot('book-audio-playing','The real Unit1C recording is decoded and playing');
  const reference=await resolveQuestion();await submitQuestion(reference);
  await leaveActivity();await page.waitForTimeout(70);const stopped=await page.evaluate(()=>window.__learningTestAudio.paused||window.__learningTestAudio.ended);await page.evaluate(()=>window.__learningTestAudio.pause());
  assert.ok(stopped,'Leaving a listening activity must stop its old audio.');report.coverage.bookAudioLessons.push(lessonId);return {src:before.src,...playing,stopsOnExit:stopped};
 });

 await step('cookie restoration survives reload without entering the code again',async()=>{
  const cookies=await context.cookies(base);const session=cookies.find(x=>x.name==='hz_companion_session');assert.ok(session);
  await page.reload({waitUntil:'domcontentloaded'});await page.waitForFunction(()=>window.HorizonsApp?.getState().signedIn,undefined,{timeout:45000});
  await observeResponses();
  assert.equal(await page.locator('#book-code').count(),0);assert.equal(lastBootstrap.profile.id,firstProfileId);
  return {cookiePresent:true,cookiePath:session.path,sameSite:session.sameSite,secure:session.secure};
 });

 await step('the same code restores the saved profile and learning progress in a fresh browser context',async()=>{
  const savedXp=lastBootstrap.progress.xp,savedName=lastBootstrap.profile.displayName;
  const second=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});const other=await second.newPage();attach(other);
  await other.goto(base,{waitUntil:'domcontentloaded'});await other.locator('#book-code').waitFor();await other.locator('#book-code').fill(code);await other.locator('#redeem-form [type="submit"]').click();
  await other.waitForFunction(()=>window.HorizonsApp?.getState().signedIn,undefined,{timeout:45000});
  await observeResponses();
  assert.equal(lastBootstrap.profile.id,firstProfileId);assert.equal(lastBootstrap.profile.displayName,savedName);assert.equal(lastBootstrap.progress.xp,savedXp);assert.equal(lastBootstrap.profile.avatar.badge,report.savedBadge);
  const width=await other.evaluate(()=>({scroll:document.documentElement.scrollWidth,width:innerWidth}));assert.ok(width.scroll<=width.width+1);
  await other.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));
  await screenshot('restored-mobile-profile','The same saved learner returns on a fresh phone-sized browser',other);await nav('progress',other);await screenshot('learning-progress-mobile','Actual saved learning progress at phone width',other);
  await second.close();return {sameProfile:true,sameName:true,sameXp:true,xp:savedXp,mobileWidth:width};
 });
}catch(error){report.failures.push({name:'fatal learning-flow setup',detail:String(error.message||error)});}
finally{
 report.status=report.failures.length||report.runtimeErrors.length?'FAIL':'PASS';
 report.checksPassed=report.checks.filter(x=>x.pass).length;report.checksTotal=report.checks.length;
 fs.mkdirSync(path.join(app,'reports'),{recursive:true});fs.writeFileSync(path.join(app,'reports/learning-browser.json'),JSON.stringify(report,null,2)+'\n');
 await browser.close();console.log(JSON.stringify({status:report.status,passed:report.checksPassed,checks:report.checksTotal,failures:report.failures,runtimeErrors:report.runtimeErrors}));
}
process.exitCode=report.status==='PASS'?0:1;
