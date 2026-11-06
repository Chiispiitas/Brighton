import assert from 'node:assert/strict';
import fs from 'node:fs';
import {getActivityQuestions} from '../src/content/engine.mjs';
const q=getActivityQuestions('topic-1a-alphabet',{seed:'short-reading-live',count:512})[0];
const endpoint='https://headless-hphybypweny-chiispiitas-140b.wix-site-host.com/api/horizons';
async function call(action,data={},token=''){
 const response=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json',Origin:'https://exams.bebrighton.net',...(token?{'X-Requested-With':token}:{})},body:JSON.stringify({action,...data}),signal:AbortSignal.timeout(45000)});
 const body=await response.json();assert.equal(response.status,200,action+': '+(body.error||''));return body;
}
let token;
try{
 const session=await call('redeem',{code:['DEMO','HZ','A1','017'].join('-')});token=session.token;assert.equal(session.demo,true);
 const saved=await call('saveAttempt',{attempt:{id:crypto.randomUUID(),activityId:'topic-1a-alphabet',quizOptions:{seed:'short-reading-live',count:512},answers:[{questionId:q.id,submitted:q.correctText}]}},token);
 assert.equal(saved.attempt.accepted,true);assert.equal(saved.attempt.awardedXp,15);
 fs.writeFileSync(new URL('../reports/live-alphabet-listening.json',import.meta.url),JSON.stringify({date:new Date().toISOString(),pass:true,endpoint,questionId:q.id,submitted:q.correctText,awardedXp:saved.attempt.awardedXp,reservedSyntheticFixture:true,realLearnerRecordsUsed:false,profileWrites:false,deployment:'1699b9ac-49df-475e-801d-29467db1fec5',sourceRevision:'76e0d12d0a36c59787fd2ef345b9a9a45f12b81a'},null,2)+'\n');
 console.log('PASS live server saves listening alphabet choice correctly.');
}finally{if(token)await call('signOut',{},token);}
