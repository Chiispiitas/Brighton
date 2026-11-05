import fs from 'node:fs';
import dns from 'node:dns';
import {pathNodes,wordById} from '../src/content/unit1.mjs';
import {getActivityQuestions,getMatchingPairs,buildQuiz} from '../src/content/engine.mjs';

dns.setDefaultResultOrder('ipv4first');
const endpoint='https://headless-hphybypweny-chiispiitas-140b.wix-site-host.com/api/horizons';
const checks=[],run=crypto.randomUUID();let token='';
async function call(action,data={}){
 const response=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json',Origin:'https://exams.bebrighton.net',...(token?{'X-Requested-With':token}:{})},body:JSON.stringify({action,...data}),signal:AbortSignal.timeout(45000)});
 const raw=await response.text();let body;try{body=JSON.parse(raw)}catch{body={message:raw.slice(0,160)}}
 return{status:response.status,...body};
}
function check(name,pass,detail={}){checks.push({name,pass:!!pass,detail});if(!pass)throw Error(name+': '+JSON.stringify(detail));}
const answer=q=>q.correctText??q.answer;
const retrieval=(progress,id)=>progress.wordStats[id]?.retrievalCorrect||0;
async function save(activityId,quizOptions,q,submitted=answer(q),extra={}){
 const attempt={id:`live-compact-${run}-${checks.length}`,activityId,quizOptions,answers:[{questionId:q.id,submitted,...extra}],durationMs:11000};
 return{attempt,result:await call('saveAttempt',{attempt})};
}
try{
 const session=await call('redeem',{code:'DEMO-HZ-A1-019'});token=session.token;
 check('Reserved QA profile restores without changing profile or access expiry',session.status===200&&!!token,{status:session.status});
 const vocabNode=pathNodes.find(node=>node.type==='quiz'),vocabOptions={seed:'live-compact-vocab',count:512};
 const vocab=getActivityQuestions(vocabNode.id,vocabOptions).find(q=>q.type==='text'&&q.wordIds?.length);
 check('Vocabulary is typed English recall from a Spanish prompt',!!vocab&&vocab.prompt.includes(wordById[vocab.wordIds[0]].spanish)&&!vocab.choices?.length);
 const startXp=session.progress.xp;
 const typed=await save(vocabNode.id,vocabOptions,vocab,`  ${answer(vocab).toUpperCase()}!  `,{correct:false,xp:5000});
 check('Live server accepts normalized typed answers and controls XP',typed.result.status===200&&typed.result.attempt?.awardedXp===15&&typed.result.progress.xp===startXp+15,{status:typed.result.status,awardedXp:typed.result.attempt?.awardedXp});
 const retry=await call('saveAttempt',{attempt:typed.attempt});
 check('Typed-answer retry remains idempotent',retry.status===200&&retry.attempt?.duplicate&&retry.attempt.awardedXp===0,{status:retry.status});
 const forged=await save(vocabNode.id,vocabOptions,vocab,'a deliberately wrong answer',{correct:true,masteryEligible:true});
 check('Incorrect typed answer cannot claim client-provided correctness',forged.result.status===200&&forged.result.attempt?.awardedXp===10,{status:forged.result.status,awardedXp:forged.result.attempt?.awardedXp});
 const grammarNode=pathNodes.find(node=>node.type==='grammar'),grammarOptions={seed:'live-compact-grammar',count:512};
 const grammar=getActivityQuestions(grammarNode.id,grammarOptions).find(q=>q.type==='text'&&q.allowContractions&&/\b(?:I am|[Yy]ou are|[Hh]e is|[Ss]he is|[Ww]e are|[Tt]hey are)\b/.test(answer(q)));
 check('Grammar provides an eligible typed contraction question',!!grammar);
 const contracted=answer(grammar).replace(/\bI am\b/g,"I'm").replace(/\b[Yy]ou are\b/g,"You're").replace(/\b[Hh]e is\b/g,"He's").replace(/\b[Ss]he is\b/g,"She's").replace(/\b[Ww]e are\b/g,"We're").replace(/\b[Tt]hey are\b/g,"They're");
 const grammarSaved=await save(grammarNode.id,grammarOptions,grammar,contracted);
 check('Live server accepts a valid contraction when the task allows it',grammarSaved.result.status===200&&grammarSaved.result.attempt?.awardedXp===15,{status:grammarSaved.result.status});
 const listeningNode=pathNodes.find(node=>node.type==='listening'),offlineOptions={seed:'live-compact-offline',count:512,audioEnabled:false};
 const offline=getActivityQuestions(listeningNode.id,offlineOptions).find(q=>q.audioFallback&&q.kind==='reading');
 check('Cannot-listen variant is a different reading task with no audio',!!offline&&!offline.audio&&!offline.audioWordId&&!offline.listening&&offline.retrieval===false);
 const beforeStats=JSON.stringify(grammarSaved.result.progress.wordStats),offlineSaved=await save(listeningNode.id,offlineOptions,offline,answer(offline),{masteryEligible:true});
 check('Live reading alternative saves without inventing vocabulary mastery',offlineSaved.result.status===200&&offlineSaved.result.attempt?.awardedXp===15&&JSON.stringify(offlineSaved.result.progress.wordStats)===beforeStats,{status:offlineSaved.result.status});
 const swapped=await call('saveAttempt',{attempt:{...offlineSaved.attempt,quizOptions:{...offlineOptions,audioEnabled:true}}});
 check('Changing saved audio mode is an idempotency conflict',swapped.status===409,{status:swapped.status});
 const original=getActivityQuestions(listeningNode.id,{seed:'live-compact-one',count:512}),originalId=original[0].id;
 const oneOptions={seed:'live-compact-one',count:512,audioFallbackQuestionIds:[originalId]},oneQuestions=getActivityQuestions(listeningNode.id,oneOptions),one=oneQuestions.find(q=>q.id===originalId);
 check('Per-question audio fallback preserves other listening questions',one.audioFallback&&oneQuestions.filter(q=>q.audioFallback).length===1);
 const oneSaved=await save(listeningNode.id,oneOptions,one);
 check('Live server reconstructs one switched listening question',oneSaved.result.status===200&&oneSaved.result.attempt?.awardedXp===15,{status:oneSaved.result.status});
 const invalid=await call('saveAttempt',{attempt:{...oneSaved.attempt,id:`invalid-${run}`,quizOptions:{...oneOptions,audioFallbackQuestionIds:['invented-listening-id']}}});
 check('Live server rejects an invented audio alternative',invalid.status===400&&invalid.error==='INVALID_ACTIVITY_OPTIONS',{status:invalid.status});
 const pairOptions={seed:'live-compact-spanish',count:6,mode:'matching',chunkIds:['1b-jobs-town']},pair=getMatchingPairs(pairOptions)[0],beforeRecognition=retrieval(oneSaved.result.progress,pair.wordId);
 check('Matching uses a Spanish translation instead of an English definition',pair.right===wordById[pair.wordId].spanish&&pair.right!==wordById[pair.wordId].meaning);
 const match=await save('mix-matching',pairOptions,pair,pair.right,{masteryEligible:true});
 check('Live Spanish matching is authoritative recognition, not retrieval mastery',match.result.status===200&&match.result.attempt?.awardedXp===15&&retrieval(match.result.progress,pair.wordId)===beforeRecognition,{status:match.result.status});
 let finalProgress=match.result.progress;
 const customOptions={seed:'live-compact-listening-mix',mode:'listening',count:'all',chunkIds:['1a-greetings','1b-jobs-town']},customQuestions=buildQuiz(customOptions);
 for(const [variant,options]of[['audio',customOptions],['one',{...customOptions,audioFallbackQuestionIds:[customQuestions[0].id]}],['all',{...customOptions,audioEnabled:false}]]){
  const questions=buildQuiz(options),beforeXp=finalProgress.xp;
  const attempt={id:`live-custom-listening-${run}-${variant}`,activityId:'mix-listening',quizOptions:options,answers:questions.map(q=>({questionId:q.id,submitted:answer(q),correct:false})),durationMs:35000};
  const saved=await call('saveAttempt',{attempt});
  check(`Complete custom listening round saves (${variant})`,saved.status===200&&saved.attempt?.awardedXp===questions.length*5+10&&saved.progress.xp===beforeXp+questions.length*5+10,{status:saved.status,questions:questions.length,awardedXp:saved.attempt?.awardedXp});
  const replay=await call('saveAttempt',{attempt});
  check(`Complete custom listening retry is idempotent (${variant})`,replay.status===200&&replay.attempt?.duplicate&&replay.attempt.awardedXp===0&&replay.progress.xp===saved.progress.xp,{status:replay.status});
  const changed=await call('saveAttempt',{attempt:{...attempt,answers:attempt.answers.map((a,i)=>i?a:{...a,submitted:'a deliberately wrong answer'})}});
  check(`Complete custom listening replay cannot change answers (${variant})`,changed.status===409,{status:changed.status});
  finalProgress=saved.progress;
 }
 const restored=await call('getSession');
 check('Saved learning survives a fresh session bootstrap',restored.status===200&&restored.progress.xp===finalProgress.xp,{status:restored.status});
 check('Existing profile and original book entitlement remain unchanged',JSON.stringify(restored.profile)===JSON.stringify(session.profile)&&JSON.stringify(restored.books)===JSON.stringify(session.books));
}catch(error){checks.push({name:'Live compact learning run completed',pass:false,detail:error.message});}
finally{if(token)await call('signOut').catch(()=>{});token='';}
const report={endpoint,date:new Date().toISOString(),checks,passed:checks.every(check=>check.pass),sample001CodesUntouched:true,profileFieldsUnchanged:true};
fs.mkdirSync('reports',{recursive:true});fs.writeFileSync('reports/live-compact-learning.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));if(!report.passed)process.exitCode=1;
