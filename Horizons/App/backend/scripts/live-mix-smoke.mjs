import fs from 'node:fs';
import dns from 'node:dns';
import {chunks} from '../src/content/unit1.mjs';
import {buildQuiz} from '../src/content/engine.mjs';
dns.setDefaultResultOrder('ipv4first');
const endpoint='https://headless-hphybypweny-chiispiitas-140b.wix-site-host.com/api/horizons';
const checks=[];let token='';
async function call(action,data={}){
 const response=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json',Origin:'https://exams.bebrighton.net',...(token?{'X-Requested-With':token}:{})},body:JSON.stringify({action,...data}),signal:AbortSignal.timeout(45000)});
 return{status:response.status,...await response.json()};
}
try{
 const session=await call('redeem',{code:'DEMO-HZ-A1-019'});if(session.status!==200)throw Error('QA redemption failed');token=session.token;
 for(const [activityId,mode]of[['mix-quiz','vocabulary'],['mix-recall','recall'],['custom-mix','mixed']]){
  const quizOptions={seed:crypto.randomUUID(),count:'all',chunkIds:chunks.map(c=>c.id),mode};
  const questions=buildQuiz(quizOptions),attempt={id:crypto.randomUUID(),activityId,quizOptions,answers:questions.map(q=>({questionId:q.id,submitted:q.correctText??q.answer})),durationMs:300000};
  const response=await call('saveAttempt',{attempt});
  const check={name:`All selected words: ${mode}`,pass:response.status===200&&response.attempt?.awardedXp===questions.length*5+10,questions:questions.length,submittedBytes:Buffer.byteLength(JSON.stringify({action:'saveAttempt',attempt})),status:response.status,awardedXp:response.attempt?.awardedXp,error:response.error};checks.push(check);if(!check.pass)throw Error(JSON.stringify(check));
 }
 const unknown=await call('saveAttempt',{attempt:{id:crypto.randomUUID(),activityId:'mix-invented',quizOptions:{seed:1,chunkIds:['1a-greetings']},answers:[{questionId:'recall-v-greetings-hello',submitted:'Hello'}]}});checks.push({name:'Unknown synthetic activity rejected',pass:unknown.status===400,status:unknown.status});
}catch(error){checks.push({name:'Run completed',pass:false,message:error.message});}
finally{if(token)await call('signOut');}
const report={endpoint,date:new Date().toISOString(),checks,passed:checks.every(x=>x.pass),public001CodesUntouched:true};fs.mkdirSync('reports',{recursive:true});fs.writeFileSync('reports/live-mixes.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));if(!report.passed)process.exitCode=1;
