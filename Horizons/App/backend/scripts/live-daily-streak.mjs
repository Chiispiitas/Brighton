import assert from 'node:assert/strict';
import fs from 'node:fs';
import {buildQuiz} from '../src/content/engine.mjs';
import {localDayKey} from '../src/server/daily-streak.mjs';
const endpoint='https://headless-hphybypweny-chiispiitas-140b.wix-site-host.com/api/horizons';
async function call(action,data={},token=''){
 const response=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json',Origin:'https://exams.bebrighton.net',...(token?{'X-Requested-With':token}:{})},body:JSON.stringify({action,...data}),signal:AbortSignal.timeout(45000)});
 const body=await response.json();assert.equal(response.status,200,action+': '+(body.error||''));return body;
}
let token;
try{
 const session=await call('redeem',{code:['DEMO','HZ','A1','017'].join('-')});token=session.token;assert.equal(session.demo,true);
 const today=localDayKey(new Date().toISOString(),session.profile.timeZone),alreadyActive=session.progress.activeDays.includes(today);
 const quizOptions={seed:'daily-streak-live-'+crypto.randomUUID(),mode:'recall',count:8,chunkIds:['1a-greetings']};
 const questions=buildQuiz(quizOptions);assert.ok(questions.length>0);
 const attempt={id:crypto.randomUUID(),activityId:'mix-recall',mode:'recall',quizOptions,answers:questions.map(q=>({questionId:q.id,submitted:q.correctText})),durationMs:8000};
 const saved=await call('saveAttempt',{attempt},token);assert.equal(saved.attempt.accepted,true);assert.ok(Object.hasOwn(saved.attempt,'dailyStreakCelebration'));
 if(alreadyActive)assert.equal(saved.attempt.dailyStreakCelebration,null);
 else{assert.equal(saved.attempt.dailyStreakCelebration.dayKey,today);assert.equal(saved.attempt.dailyStreakCelebration.weekDays.length,7);}
 const retry=await call('saveAttempt',{attempt},token);assert.equal(retry.attempt.duplicate,true);assert.equal(retry.attempt.awardedXp,0);assert.deepEqual(retry.attempt.dailyStreakCelebration,saved.attempt.dailyStreakCelebration);
 const report={date:new Date().toISOString(),pass:true,endpoint,reservedSyntheticFixture:true,realLearnerRecordsUsed:false,profileWrites:false,roundItems:questions.length,accepted:true,duplicateRetry:true,alreadyActiveToday:alreadyActive,liveFirstDayClaimExercised:!alreadyActive,liveFirstDayLimit:alreadyActive?'Reserved fixture had already practiced today; daily-winner creation is covered by isolated server and browser tests.':null,deployment:'ef6074d1-a54e-438b-9259-e42843fd3138',sourceRevision:'a68ccd0390a70b2ee28711d691be5800bdb7670e'};
 fs.writeFileSync(new URL('../reports/live-daily-streak.json',import.meta.url),JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify(report));
}finally{if(token)await call('signOut',{},token);}
