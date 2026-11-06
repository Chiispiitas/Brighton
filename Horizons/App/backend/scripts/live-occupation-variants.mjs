import assert from 'node:assert/strict';
import fs from 'node:fs';
import {getActivityQuestions} from '../src/content/engine.mjs';
const q=getActivityQuestions('topic-1b-jobs',{seed:'short-reading-live',count:512}).find(q=>q.word?.term==='actress');
const endpoint='https://headless-hphybypweny-chiispiitas-140b.wix-site-host.com/api/horizons';
async function call(action,data={},token=''){
 const response=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json',Origin:'https://exams.bebrighton.net',...(token?{'X-Requested-With':token}:{})},body:JSON.stringify({action,...data}),signal:AbortSignal.timeout(45000)});
 const body=await response.json();assert.equal(response.status,200,action+': '+(body.error||''));return body;
}
let token;
try{
 const session=await call('redeem',{code:['DEMO','HZ','A1','017'].join('-')});token=session.token;assert.equal(session.demo,true);
 const saved=await call('saveAttempt',{attempt:{id:crypto.randomUUID(),activityId:'topic-1b-jobs',quizOptions:{seed:'short-reading-live',count:512},answers:[{questionId:q.id,submitted:q.correctText??q.answer}]}},token);
 assert.equal(saved.attempt.accepted,true);assert.equal(saved.attempt.awardedXp,15);
 const wrong=await call('saveAttempt',{attempt:{id:crypto.randomUUID(),activityId:'topic-1b-jobs',quizOptions:{seed:'short-reading-live',count:512},answers:[{questionId:q.id,submitted:'actor'}]}},token);assert.equal(wrong.attempt.awardedXp,10);
 fs.writeFileSync(new URL('../reports/live-occupation-variants.json',import.meta.url),JSON.stringify({date:new Date().toISOString(),pass:true,endpoint,questionId:q.id,submitted:q.correctText??q.answer,awardedXp:saved.attempt.awardedXp,reservedSyntheticFixture:true,realLearnerRecordsUsed:false,profileWrites:false,deployment:'d96e60ee-9751-4bde-8282-3fd377c64a94',sourceRevision:'06527ddf44a9af0fca8d5a31082260144affaf11'},null,2)+'\n');
 console.log('PASS live server accepts actress for the female occupation item.');
}finally{if(token)await call('signOut',{},token);}
