import {createSocial} from './social.mjs';
import {createLeaderboard} from './leaderboard.mjs';
import {createContentRepository} from './admin-content-repository.mjs';
import {activityById,wordById,chunkById,lessonById,lessons as lessonDefinitions} from '../content/unit1.mjs';
import {getActivityQuestions,buildQuiz,getMatchingPairs,checkAnswer,normalizeAnswer} from '../content/engine.mjs';
import {summarizeIslands} from '../content/island-mastery.mjs';
import {localDayKey,dailyStreakDetails} from './daily-streak.mjs';
const enc=new TextEncoder();
export const COLLECTIONS={codes:'HzIssuedCodes',claims:'HzClaims',profiles:'HzProfiles',sessions:'HzSessions',attempts:'HzAttempts',throttle:'HzThrottle'};
export const BOOKS={
 'horizons-a1':{id:'horizons-a1',title:'Horizons A1',level:'A1',contentStatus:'unit-1',units:[1]},
 'horizons-a2-preview':{id:'horizons-a2-preview',title:'Horizons A2',level:'A2',contentStatus:'preview',units:[]}
};
export const DEMO_CODES=Array.from({length:20},(_,i)=>({code:`DEMO-HZ-A1-${String(i+1).padStart(3,'0')}`,bookId:'horizons-a1'})).concat(Array.from({length:10},(_,i)=>({code:`DEMO-HZ-A2-${String(i+1).padStart(3,'0')}`,bookId:'horizons-a2-preview'})));
class AppError extends Error{constructor(status,code,message){super(message);this.status=status;this.code=code;}}
/** @returns {never} */
const fail=(status,code,message)=>{throw new AppError(status,code,message);};
export async function idFor(value){const h=[...new Uint8Array(await crypto.subtle.digest('SHA-256',enc.encode(value)))].map(x=>x.toString(16).padStart(2,'0')).join('');return`${h.slice(0,8)}-${h.slice(8,12)}-${h.slice(12,16)}-${h.slice(16,20)}-${h.slice(20,32)}`;}
export const normalizeCode=value=>String(value||'').normalize('NFKC').trim().toUpperCase().replace(/\s+/g,'');
export function addCalendarMonths(iso,months){const d=new Date(iso),day=d.getUTCDate();d.setUTCDate(1);d.setUTCMonth(d.getUTCMonth()+months);const last=new Date(Date.UTC(d.getUTCFullYear(),d.getUTCMonth()+1,0)).getUTCDate();d.setUTCDate(Math.min(day,last));return d.toISOString();}
const tokenString=()=>{const bytes=crypto.getRandomValues(new Uint8Array(32));return btoa(String.fromCharCode(...bytes)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');};
function object(value){return value&&typeof value==='object'&&!Array.isArray(value);}
function safeText(value,max=80){return String(value??'').normalize('NFKC').replace(/[\u0000-\u001f\u007f]/g,'').trim().slice(0,max);}
const dayKey=localDayKey;
function previousDay(day){const d=new Date(day+'T12:00:00Z');d.setUTCDate(d.getUTCDate()-1);return d.toISOString().slice(0,10);}
function initialProfile(id,bookId,now){return{id,displayName:'Brighton learner',dateOfBirth:'',goal:5,timeZone:'America/Guayaquil',avatar:{skin:'warm',hair:'short',hairColor:'brown',outfit:'magenta',accessory:'none'},defaultBookId:bookId,createdAt:now,updatedAt:now};}
const bookId=value=>value==='a1'?'horizons-a1':value==='a2'?'horizons-a2-preview':value;
export function cleanProfile(patch,current,now){
 if(!object(patch))fail(400,'INVALID_PROFILE','Please check your profile details.');
 const allowed=new Set(['displayName','dateOfBirth','goal','avatar','defaultBookId','timeZone']);
 if(Object.keys(patch).some(k=>!allowed.has(k)))fail(400,'INVALID_PROFILE','This profile field cannot be changed.');
 const out={...current,updatedAt:now};
 if('displayName'in patch){const s=safeText(patch.displayName,45);if(!s)fail(400,'INVALID_NAME','Please enter a name.');out.displayName=s;}
 if('dateOfBirth'in patch){const s=String(patch.dateOfBirth||'');if(s){const d=new Date(s+'T12:00:00Z');if(!/^\d{4}-\d{2}-\d{2}$/.test(s)||!Number.isFinite(d.getTime())||d.toISOString().slice(0,10)!==s||s<'1900-01-01'||s>now.slice(0,10))fail(400,'INVALID_BIRTH_DATE','Please enter a valid date of birth.');}out.dateOfBirth=s;}
 if('goal'in patch){const n=Number(patch.goal);if(!Number.isInteger(n)||n<3||n>30)fail(400,'INVALID_GOAL','Choose a daily goal between 3 and 30 minutes.');out.goal=n;}
 if('timeZone'in patch){try{new Intl.DateTimeFormat('en',{timeZone:patch.timeZone}).format();}catch{fail(400,'INVALID_TIME_ZONE','Please choose a valid time zone.');}out.timeZone=String(patch.timeZone);}
 if('defaultBookId'in patch){if(!BOOKS[bookId(patch.defaultBookId)])fail(400,'INVALID_BOOK','Please choose one of your books.');out.defaultBookId=bookId(patch.defaultBookId);}
 if('avatar'in patch){
  if(!object(patch.avatar)||Object.keys(patch.avatar).length>20)fail(400,'INVALID_AVATAR','Please choose an avatar style.');
  const keys=new Set(['body','skin','skinTone','hair','hairColor','face','eyes','eye','top','outfit','bottom','accessory','background','variant','head','pose','expression','shirt','badge']);
  const a={};for(const[k,v]of Object.entries(patch.avatar)){if(!keys.has(k)||!['string','number'].includes(typeof v)||!/^[-a-zA-Z0-9_#]{1,48}$/.test(String(v)))fail(400,'INVALID_AVATAR','Please choose an available avatar item.');a[k]=v;}if(a.badge&&!['none','star-pin','trophy-pin','compass-pin'].includes(a.badge))fail(400,'INVALID_AVATAR','Please choose an available avatar badge.');out.avatar=a;
 }
 return out;
}
export function aggregateProgress(events,now,timeZone){
 const today=dayKey(now,timeZone),words=Object.create(null),lessons=Object.create(null),complete=new Set(),active=new Set(),daily=Object.create(null);let xp=0,last=null;
 for(const event of [...events].sort((a,b)=>a.createdAt.localeCompare(b.createdAt))){
  xp+=event.xp;const day=dayKey(event.createdAt,timeZone);active.add(day);daily[day]=(daily[day]||0)+event.xp;if(Object.hasOwn(activityById,event.activityId))complete.add(event.activityId);last=event;
  const lesson=lessons[event.lessonId]||={attempts:0,correct:0,total:0,xp:0,completedActivities:[]};lesson.attempts++;lesson.xp+=event.xp;lesson.correct+=event.answers.filter(x=>x.correct).length;lesson.total+=event.answers.length;if(!lesson.completedActivities.includes(event.activityId))lesson.completedActivities.push(event.activityId);
  for(const answer of event.answers){
   // Old accepted synonyms sometimes stored a different/empty word ID. Recover the
   // prompted vocabulary identity from its stable question ID without rewriting events.
   const recalledId=answer.questionId?.startsWith('recall-')?answer.questionId.slice(7):null;
   const targetId=wordById[recalledId]?recalledId:null;
   for(const itemId of targetId?[targetId]:answer.wordIds||[answer.itemId]){
    if(!itemId||answer.kind==='grammar')continue;
    const s=words[itemId]||={itemId,term:wordById[itemId]?.term||answer.term||itemId,kind:answer.kind||'vocabulary',bookId:event.bookId,lessonId:event.lessonId,correct:0,incorrect:0,seen:0,recallAttempts:0,retrievalCorrect:0,mastered:false,lastSeen:event.createdAt};
    s.seen++;s[answer.correct?'correct':'incorrect']++;
    if(answer.retrieval!==false)s.recallAttempts++;
    if(answer.correct&&answer.retrieval!==false&&!answer.hintUsed&&(targetId||answer.masteryEligible!==false))s.retrievalCorrect++;
    s.lastSeen=event.createdAt;s.lastCorrect=answer.correct;s.mastered=s.retrievalCorrect>=1;
   }
  }
 }
 const days=[...active].sort(),daySet=new Set(days);let streak=0,walk=daySet.has(today)?today:previousDay(today);while(daySet.has(walk)){streak++;walk=previousDay(walk);}let bestStreak=0,run=0,prev=null;for(const d of days){run=prev&&previousDay(d)===prev?run+1:1;bestStreak=Math.max(bestStreak,run);prev=d;}
 const nodeDone=id=>{if(complete.has(id))return true;const node=activityById[id];if(node?.kind!=='topic')return false;const oldIds=[...(node.chunkIds||[]).map(id=>'quiz-'+id),...(node.grammarSetIds||[]).map(id=>'practice-'+id)];return oldIds.length>0&&oldIds.every(id=>complete.has(id));};
 return{...summarizeIslands(events,words),xp,streak,bestStreak,todayXp:daily[today]||0,completedActivities:[...complete],completedLessons:lessonDefinitions.filter(lesson=>(lesson.pathNodeIds||lesson.activityIds).every(nodeDone)).map(lesson=>lesson.id),wordStats:words,lessons,attempts:events.length,activeDays:days,dailyXp:daily,reviewItems:Object.values(words).filter(x=>!x.mastered&&(!x.lastCorrect||x.incorrect>0)).map(x=>x.itemId),lastActivityId:last?.activityId||null,lastLessonId:last?.lessonId||null,lastBookId:last?.bookId||null};
}
function cleanAttempt(raw,now,engine=null){
 const {getActivityQuestions:activityQuestions=getActivityQuestions,buildQuiz:quiz=buildQuiz,getMatchingPairs:pairs=getMatchingPairs}=engine||{};
 if(!object(raw))fail(400,'INVALID_ATTEMPT','Please try that practice round again.');
 const id=String(raw.attemptId||raw.id||'');if(!/^[a-zA-Z0-9_-]{8,90}$/.test(id))fail(400,'INVALID_ATTEMPT_ID','This practice round needs a valid identifier.');
 const options=object(raw.quizOptions)?raw.quizOptions:{};
 const b=bookId(raw.bookId||'horizons-a1'),activity=safeText(raw.activityId,140),definition=Object.hasOwn(activityById,activity)?activityById[activity]:null,custom=['mixed-practice','custom-mix','mix-quiz','mix-recall','mix-memory','mix-matching','mix-listening'].includes(activity);
 const chunks=Array.isArray(options.chunkIds||raw.chunkIds)?(options.chunkIds||raw.chunkIds).slice(0,40).map(x=>String(x)):[];
 const lessonIds=Array.isArray(options.lessonIds||raw.lessonIds)?(options.lessonIds||raw.lessonIds).map(x=>String(x).toUpperCase()):[];
 const grammarSetIds=Array.isArray(options.grammarSetIds||raw.grammarSetIds)?(options.grammarSetIds||raw.grammarSetIds).map(String):[];
 const lesson=String(raw.lessonId||definition?.lessonId||lessonIds[0]||chunkById[chunks[0]]?.lessonId||'1A').toUpperCase();
 if(b!=='horizons-a1'||!/^1[ABCD]$/.test(lesson)||(!definition&&!custom)||chunks.some(x=>!Object.hasOwn(chunkById,x))||lessonIds.some(x=>!Object.hasOwn(lessonById,x)))fail(400,'INVALID_ACTIVITY','This practice activity is not available in this book.');
 if(!Array.isArray(raw.answers)||!raw.answers.length||raw.answers.length>512)fail(400,'INVALID_ANSWERS','Please finish a practice round with 1 to 512 answers.');
 const seed=safeText(options.seed??raw.seed??id,100),mode=safeText(options.mode||raw.mode||'',20),matching=['memory','matching'].includes(mode)||['mix-memory','mix-matching'].includes(activity);
 if('audioEnabled'in options&&typeof options.audioEnabled!=='boolean')fail(400,'INVALID_ACTIVITY_OPTIONS','Please choose an available audio setting.');
 const audioEnabled=options.audioEnabled!==false;
 const fallbackIds=options.audioFallbackQuestionIds??[];
 if(!Array.isArray(fallbackIds)||fallbackIds.length>512||fallbackIds.some(id=>typeof id!=='string'||!id.length||id.length>150)||new Set(fallbackIds).size!==fallbackIds.length)fail(400,'INVALID_ACTIVITY_OPTIONS','Please choose an available listening question.');
 const audioFallbackQuestionIds=[...fallbackIds].sort();
 const generation={seed,chunkIds:chunks.length?chunks:definition?.chunkIds,lessonIds:lessonIds.length?lessonIds:definition?.lessonId?[definition.lessonId]:undefined,grammarSetIds:grammarSetIds.length?grammarSetIds:definition?.grammarSetIds,count:512,...(mode&&!matching?{mode}:{})};
 let expected;
 try{
  const reconstruct=settings=>matching?pairs(settings):definition?activityQuestions(activity,settings):quiz(settings);
  if(audioFallbackQuestionIds.length){const original=reconstruct({...generation,audioEnabled:true,audioFallbackQuestionIds:[]}),listeningIds=new Set(original.filter(q=>q.listening||q.audio||q.audioWordId).map(q=>q.id));if(audioFallbackQuestionIds.some(id=>!listeningIds.has(id)))fail(400,'INVALID_ACTIVITY_OPTIONS','Please choose an available listening question.');}
  expected=reconstruct({...generation,audioEnabled,audioFallbackQuestionIds});
 }catch{fail(400,'INVALID_ACTIVITY_OPTIONS','Please choose an available practice activity and word set.');}
 const expectedById=new Map(expected.map(x=>[x.id,x])),seen=new Set();
 const answers=raw.answers.map(a=>{
  if(!object(a))fail(400,'INVALID_ANSWER','An answer could not be saved.');const qid=safeText(a.questionId||a.itemId||a.id,150),q=expectedById.get(qid);
  if(!q||seen.has(qid))fail(400,'INVALID_QUESTION','An unknown or repeated question cannot be saved.');seen.add(qid);
  const submitted=a.submitted??a.answer??'';if(JSON.stringify(submitted).length>1200)fail(400,'INVALID_ANSWER','This answer is too long.');
  const grade=matching?{correct:normalizeAnswer(submitted)===normalizeAnswer(q.right),wordIds:q.wordIds||[q.wordId],masteryEligible:false}:checkAnswer(q,submitted);
  const ids=(grade.correct?grade.wordIds:q.wordIds||[]).filter(x=>!!wordById[x]);const hintUsed=!!a.hintUsed;
  return{questionId:qid,itemId:ids[0]||qid,wordIds:ids,correct:grade.correct,term:wordById[ids[0]]?.term||q.expectedTerm||qid,kind:q.kind==='grammar'?'grammar':'vocabulary',answer:safeText(Array.isArray(submitted)?submitted.join(' '):object(submitted)?submitted.text||submitted.id:submitted,180),retrieval:!matching&&q.retrieval!==false&&!hintUsed,masteryEligible:!matching&&!!grade.masteryEligible&&!hintUsed,hintUsed};
 });
 const seconds=Math.max(0,Math.min(3600,Number(raw.durationSeconds??(Number(raw.durationMs)||0)/1000)||0));
 return{id,bookId:b,lessonId:lesson,activityId:activity,chunkIds:chunks,mode,seed,...(options.contentRevision&&options.contentRevision!=='base'?{contentRevision:options.contentRevision}:{}),...(!audioEnabled?{audioEnabled:false}:{}),...(audioFallbackQuestionIds.length?{audioFallbackQuestionIds}:{}),answers,durationSeconds:seconds,createdAt:now,xp:answers.filter(x=>x.correct).length*5+10};
}
// Retry identity is the submitted work, not derived grading fields that can change
// when a mastery policy improves. Stored events remain immutable.
function sameAttempt(a,b){
 const identity=({dailyStreakCandidate,...attempt})=>({...attempt,createdAt:'',xp:0,answers:attempt.answers.map(answer=>({questionId:answer.questionId,answer:answer.answer,hintUsed:!!answer.hintUsed}))});
 return JSON.stringify(identity(a))===JSON.stringify(identity(b));
}
export function createApplication(store,{now=()=>new Date().toISOString(),trustedOrigins=['https://exams.bebrighton.net','https://chiispiitas.github.io'],allowLocal=true}={}){
 const localRate=new Map();
 const isAllowed=origin=>!origin||trustedOrigins.includes(origin)||(allowLocal&&/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin));
 const contentRepository=createContentRepository(store);
 const json=(data,status=200,origin='')=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff',...(origin&&isAllowed(origin)?{'Access-Control-Allow-Origin':origin,'Vary':'Origin','Access-Control-Allow-Methods':'GET, POST, OPTIONS','Access-Control-Allow-Headers':'Content-Type, X-Requested-With','Access-Control-Max-Age':'600'}:{})}});
 async function createOnce(collection,id,value,scope){try{return await store.create(collection,id,value,scope);}catch(error){const existing=await store.get(collection,id);if(existing)return existing;throw error;}}
 async function profileFor(id,book,at){return await store.get(COLLECTIONS.profiles,id)||createOnce(COLLECTIONS.profiles,id,initialProfile(id,book,at),id);}
 async function issued(code){const clean=normalizeCode(code);if(!/^[-A-Z0-9]{10,80}$/.test(clean))fail(400,'INVALID_CODE','Please check the book code and try again.');const id=await idFor('code:'+clean);const row=await store.get(COLLECTIONS.codes,id);if(!row||row.disabled)fail(400,'INVALID_CODE','That code is not available. Check the code printed with your book.');return{id,...row};}
 async function claimCode(code,profileId){const item=await issued(code),at=now();let claim=await store.get(COLLECTIONS.claims,item.id);if(!claim){const owner=profileId||crypto.randomUUID();claim=await createOnce(COLLECTIONS.claims,item.id,{codeId:item.id,profileId:owner,bookId:item.bookId,activatedAt:at,expiresAt:addCalendarMonths(at,12)},owner);}
  if(profileId&&claim.profileId!==profileId)fail(409,'CODE_ALREADY_LINKED','That code belongs to another learner profile. Use that code to open its existing profile.');
  if(new Date(claim.expiresAt)<=new Date(at))fail(403,'BOOK_EXPIRED','This book’s twelve months have ended. Add a new book code to continue.');
  await profileFor(claim.profileId,claim.bookId,at);return claim;
 }
 async function claimsFor(id){const rows=await store.list(COLLECTIONS.claims,id);return rows;}
 async function booksFor(id){const claims=await claimsFor(id),group=new Map(),at=now();for(const c of claims){const issue=await store.get(COLLECTIONS.codes,c.codeId);const expired=new Date(c.expiresAt)<=new Date(at),status=!issue||issue.disabled?'revoked':expired?'expired':'active';const row={...BOOKS[c.bookId],activatedAt:c.activatedAt,expiresAt:c.expiresAt,status};const previous=group.get(c.bookId);if(!previous||row.status==='active'&&previous.status!=='active'||row.status===previous.status&&row.expiresAt>previous.expiresAt)group.set(c.bookId,row);}return[...group.values()];}
 async function sessionFrom(request){const token=request.headers.get('X-Requested-With')||request.headers.get('Authorization')?.replace(/^Bearer\s+/i,'')||'';if(!/^[A-Za-z0-9_-]{40,100}$/.test(token))fail(401,'SESSION_REQUIRED','Enter your book code to continue.');const id=await idFor('session:'+token),s=await store.get(COLLECTIONS.sessions,id);if(!s||s.revoked||new Date(s.expiresAt)<=new Date(now()))fail(401,'SESSION_EXPIRED','Enter your book code to reopen your profile.');return{id,...s};}
 async function bootstrap(profileId){const[profile,books,events,claims]=await Promise.all([store.get(COLLECTIONS.profiles,profileId),booksFor(profileId),store.list(COLLECTIONS.attempts,profileId),claimsFor(profileId)]);if(!profile)fail(401,'PROFILE_MISSING','Enter your book code to reopen your profile.');const issues=await Promise.all(claims.map(c=>store.get(COLLECTIONS.codes,c.codeId)));const demo=issues.some(issue=>issue?.kind==='example');return{ok:true,demo,profile,books,contentSnapshot:await contentRepository.current().then(({revision,patches})=>({revision,patches})),progress:aggregateProgress(events,now(),profile.timeZone)};}
 async function dailyCelebration(profileId,attempt,result){
  const candidate=attempt.dailyStreakCandidate;
  // Only a server-marked, newly completed day can win. Historical attempts and
  // a retry from a previous local day must never create a new celebration.
  if(!candidate||dayKey(now(),candidate.timeZone)!==candidate.dayKey)return null;
  const id=await idFor('daily-streak:'+profileId+':'+candidate.dayKey);
  let claim=await store.get(COLLECTIONS.throttle,id);
  if(!claim){
   const activeDays=result.profile.timeZone===candidate.timeZone?result.progress.activeDays:(await store.list(COLLECTIONS.attempts,profileId)).map(event=>dayKey(event.createdAt,candidate.timeZone));
   const celebration=dailyStreakDetails({attemptId:attempt.id,completedAt:attempt.createdAt,timeZone:candidate.timeZone,activeDays});
   claim=await createOnce(COLLECTIONS.throttle,id,{kind:'daily-streak',profileId,attemptId:attempt.id,dayKey:candidate.dayKey,celebration},profileId);
  }
  // Identical retries receive the same event, allowing a lost response to be
  // recovered. The frontend marks its profile/day seen only when it plays.
  return claim.kind==='daily-streak'&&claim.attemptId===attempt.id?claim.celebration:null;
 }
 async function rateLimit(request){const at=new Date(now()).getTime(),source=request.headers.get('cf-connecting-ip')||request.headers.get('x-forwarded-for')?.split(',')[0]||request.headers.get('user-agent')||'anonymous',key=await idFor('rate:'+source+':'+Math.floor(at/60000));const n=(localRate.get(key)||0)+1;localRate.set(key,n);if(localRate.size>1000)localRate.clear();if(n>80)fail(429,'TRY_LATER','Please wait a minute before trying another code.');}
 async function handle(request){const origin=request.headers.get('Origin')||'';
  try{
   if(!isAllowed(origin))return json({ok:false,error:'ORIGIN_REJECTED',message:'This request is not allowed.'},403);
   if(request.method==='OPTIONS')return new Response(null,{status:204,headers:json({},200,origin).headers});
   if(request.method==='GET')return json({ok:true,name:'Horizons Companion API',version:1,masteryPolicy:'one-correct-answer',competitionPolicy:'weekly-xp-v1',socialPolicy:'mutual-follow-v1'},200,origin);
   if(request.method!=='POST')return json({ok:false,error:'METHOD_NOT_ALLOWED',message:'Please use the app to continue.'},405,origin);
   const text=await request.text();if(text.length>100000)fail(413,'REQUEST_TOO_LARGE','That practice round is too large.');let body;try{body=JSON.parse(text);}catch{fail(400,'INVALID_JSON','The app could not read that request.');}if(!object(body))fail(400,'INVALID_REQUEST','Please try again.');
   const action=body.action;
   if(action==='redeem'){
    await rateLimit(request);const c=await claimCode(body.code);const raw=tokenString(),id=await idFor('session:'+raw),at=now(),expiresAt=new Date(new Date(at).getTime()+90*86400000).toISOString();await store.create(COLLECTIONS.sessions,id,{profileId:c.profileId,createdAt:at,expiresAt,revoked:false},c.profileId);return json({...await bootstrap(c.profileId),token:raw,sessionExpiresAt:expiresAt},200,origin);
   }
   const session=await sessionFrom(request);
   if(['getSocialHome','getPublicProfile','setFollow','searchPeople'].includes(action)){
    const social=createSocial(store,{now,idFor,collections:COLLECTIONS,aggregateProgress});
    try{const result=action==='getSocialHome'?await social.home(session.profileId):action==='getPublicProfile'?await social.get(session.profileId,body.targetId):action==='setFollow'?await social.follow(session.profileId,body.targetId,body.following):await social.search(session.profileId,body.query);return json(result,200,origin);}catch(error){if(error.status)fail(error.status,'SOCIAL_REQUEST',error.message);throw error;}
   }
   if(action==='getLeaderboard')return json(await createLeaderboard(store,{now,idFor,collections:COLLECTIONS}).get(session.profileId),200,origin);
   if(action==='signOut'){await store.put(COLLECTIONS.sessions,session.id,{...session,revoked:true,revokedAt:now()},session.profileId);return json({ok:true},200,origin);}
   if(action==='getSession'||action==='getProgress')return json(await bootstrap(session.profileId),200,origin);
   if(action==='linkBook'){await rateLimit(request);await claimCode(body.code,session.profileId);return json(await bootstrap(session.profileId),200,origin);}
   if(action==='updateProfile'){
    const current=await store.get(COLLECTIONS.profiles,session.profileId);if(!current)fail(401,'PROFILE_MISSING','Please enter your book code again.');const updated=cleanProfile(body.patch||body.profile,current,now());if(updated.defaultBookId!==current.defaultBookId){const books=await booksFor(session.profileId);if(!books.some(x=>x.id===updated.defaultBookId))fail(400,'BOOK_NOT_LINKED','Add this book to your profile first.');}const badgeXp={'star-pin':25,'trophy-pin':100,'compass-pin':250}[updated.avatar?.badge];if(badgeXp){const events=await store.list(COLLECTIONS.attempts,session.profileId);if(aggregateProgress(events,now(),updated.timeZone).xp<badgeXp)fail(403,'BADGE_LOCKED',`Keep practising to unlock this badge at ${badgeXp} XP.`);}await store.put(COLLECTIONS.profiles,session.profileId,updated,session.profileId);return json(await bootstrap(session.profileId),200,origin);
   }
   if(action==='saveAttempt'){
    const engine=await contentRepository.engine(body.attempt?.quizOptions?.contentRevision||'base');
    const attempt=cleanAttempt(body.attempt,now(),engine),books=await booksFor(session.profileId);if(!books.some(x=>x.id===attempt.bookId&&x.status==='active'))fail(403,'BOOK_EXPIRED','Add an active book code before starting this practice.');const id=await idFor('attempt:'+session.profileId+':'+attempt.id),existing=await store.get(COLLECTIONS.attempts,id);let duplicate=!!existing,savedAttempt=existing;
    if(existing&&!sameAttempt(existing,{...attempt,profileId:session.profileId}))fail(409,'ATTEMPT_CONFLICT','That practice round was already saved with different answers.');
    if(!existing){
     const[profile,events]=await Promise.all([store.get(COLLECTIONS.profiles,session.profileId),store.list(COLLECTIONS.attempts,session.profileId)]);if(!profile)fail(401,'PROFILE_MISSING','Enter your book code to reopen your profile.');
     const timeZone=profile.timeZone||'America/Guayaquil',today=dayKey(attempt.createdAt,timeZone),activeDays=events.map(event=>dayKey(event.createdAt,timeZone));
     // Keep this proof on the immutable event so a failed claim write can be
     // retried, while pre-feature history and later rounds remain ineligible.
     const candidate=activeDays.includes(today)?null:{dayKey:today,timeZone};
     const value={...attempt,profileId:session.profileId,...candidate?{dailyStreakCandidate:candidate}:{}};
     try{savedAttempt=await store.create(COLLECTIONS.attempts,id,value,session.profileId);}catch(error){const saved=await store.get(COLLECTIONS.attempts,id);if(!saved)throw error;if(!sameAttempt(saved,{...attempt,profileId:session.profileId}))fail(409,'ATTEMPT_CONFLICT','That practice round was already saved with different answers.');duplicate=true;savedAttempt=saved;}
    }
    const result=await bootstrap(session.profileId),dailyStreakCelebration=await dailyCelebration(session.profileId,savedAttempt,result);
    return json({...result,attempt:{accepted:true,duplicate,id:attempt.id,awardedXp:duplicate?0:attempt.xp,dailyStreakCelebration}},200,origin);
   }
   fail(400,'UNKNOWN_ACTION','This app action is not available.');
  }catch(error){if(error instanceof AppError)return json({ok:false,error:error.code,message:error.message},error.status,origin);console.error('Horizons private CMS operation failed:',safeText(error?.message,180));return json({ok:false,error:'SERVICE_UNAVAILABLE',message:'Your progress is safe. Please try again in a moment.'},503,origin);}
 }
 return{handle};
}
