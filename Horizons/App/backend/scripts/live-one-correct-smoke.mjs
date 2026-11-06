import fs from 'node:fs';
import assert from 'node:assert/strict';
import {pathNodes} from '../src/content/unit1.mjs';
import {selectIslandQuestions,masteryTargets} from '../src/content/island-mastery.mjs';
const endpoint='https://headless-hphybypweny-chiispiitas-140b.wix-site-host.com/api/horizons',tokens=[],checks=[];
const call=async(action,data={},token='')=>{const response=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json',Origin:'https://exams.bebrighton.net',...(token?{'X-Requested-With':token}:{})},body:JSON.stringify({action,...data}),signal:AbortSignal.timeout(45000)});const body=await response.json();assert.equal(response.status,200,action+': '+(body.error||''));return body;};
try{
 const health=await(await fetch(endpoint+'?mastery='+Date.now(),{cache:'no-store'})).json();assert.equal(health.masteryPolicy,'one-correct-answer');
 // This code is explicitly reserved for fictional backend QA; never use learner codes.
 const code=['DEMO','HZ','A1','017'].join('-'),session=await call('redeem',{code});tokens.push(session.token);assert.equal(session.demo,true);
 let progress=session.progress;
 const node=pathNodes.filter(n=>n.type==='quiz'&&masteryTargets[n.id].length>=10&&masteryTargets[n.id].filter(id=>!progress.islands[n.id].items[id]?.mastered).length>=8).sort((a,b)=>masteryTargets[a.id].length-masteryTargets[b.id].length)[0];assert.ok(node,'Reserved QA profile must have at least eight unmastered targets; do not reset any saved profile.');
 const seen=new Set(),initial=progress.islands[node.id].masteredCount;
 for(let round=0;!progress.islands[node.id].mastered&&round<12;round++){
  const seed='one-correct-live-'+crypto.randomUUID(),qs=selectIslandQuestions(node,progress,{seed});if(round===0)assert.equal(qs.length,8);
  for(const q of qs){assert.ok(!seen.has(q.wordIds[0]));seen.add(q.wordIds[0]);}
  const before=progress.islands[node.id].masteredCount,attempt={id:crypto.randomUUID(),activityId:node.id,quizOptions:{seed,count:512},answers:qs.map(q=>({questionId:q.id,submitted:q.correctText??q.answer}))};
  const result=await call('saveAttempt',{attempt},session.token);progress=result.progress;assert.equal(progress.islands[node.id].masteredCount,before+qs.length);
  const duplicate=await call('saveAttempt',{attempt},session.token);assert.equal(duplicate.attempt.awardedXp,0);assert.deepEqual(duplicate.progress.islands,progress.islands);
  checks.push({round:round+1,questions:qs.length,before,mastered:progress.islands[node.id].masteredCount,total:progress.islands[node.id].total,duplicateSafe:true});
 }
 assert.equal(checks[0].mastered,initial+8);assert.equal(progress.islands[node.id].mastered,true);
 const restored=await call('redeem',{code});tokens.push(restored.token);assert.deepEqual(restored.progress.islands,progress.islands);
 fs.writeFileSync(new URL('../reports/live-one-correct.json',import.meta.url),JSON.stringify({pass:true,endpoint,masteryPolicy:health.masteryPolicy,island:node.id,initialMastered:initial,checks,crown:true,restore:true,profileWrites:false,fixture:'Reserved synthetic QA example only; no real learner records or original public example 001 used.'},null,2)+'\n');
 console.log('PASS live one-answer mastery, eight immediate items, remaining-only rounds, crown, duplicate saves and device restore');
}finally{for(const token of tokens)await call('signOut',{},token);}
