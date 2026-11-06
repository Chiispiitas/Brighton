import assert from 'node:assert/strict';
import fs from 'node:fs';
const endpoint='https://headless-hphybypweny-chiispiitas-140b.wix-site-host.com/api/horizons';
async function call(action,data={},token=''){
 const response=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json',Origin:'https://exams.bebrighton.net',...(token?{'X-Requested-With':token}:{})},body:JSON.stringify({action,...data}),signal:AbortSignal.timeout(45000)});
 const body=await response.json();assert.equal(response.status,200,action+': '+(body.error||''));return body;
}
let token;
try{
 const session=await call('redeem',{code:['DEMO','HZ','A1','017'].join('-')});token=session.token;assert.equal(session.demo,true);
 const saved=await call('saveAttempt',{attempt:{id:crypto.randomUUID(),activityId:'read-1a',quizOptions:{seed:'short-reading-live',count:512},answers:[{questionId:'read-club-class',submitted:'3'}]}},token);
 assert.equal(saved.attempt.accepted,true);assert.equal(saved.attempt.awardedXp,15);
 fs.writeFileSync(new URL('../reports/live-short-reading.json',import.meta.url),JSON.stringify({date:new Date().toISOString(),pass:true,endpoint,questionId:'read-club-class',submitted:'3',awardedXp:saved.attempt.awardedXp,reservedSyntheticFixture:true,realLearnerRecordsUsed:false,profileWrites:false,deployment:'f1c7547c-2aaf-402a-9cbe-4333b014e2b9',sourceRevision:'b0057048276fc1255e722fce6690478742d90bc6'},null,2)+'\n');
 console.log('PASS live server accepts 3 for Class 3 and awards correct-answer credit.');
}finally{if(token)await call('signOut',{},token);}
