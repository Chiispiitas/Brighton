import fs from 'node:fs';
import dns from 'node:dns';
dns.setDefaultResultOrder('ipv4first');
const endpoint='https://headless-hphybypweny-chiispiitas-140b.wix-site-host.com/api/horizons',checks=[];let token='';
async function call(action,data={}){const response=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json',Origin:'https://exams.bebrighton.net',...(token?{'X-Requested-With':token}:{})},body:JSON.stringify({action,...data}),signal:AbortSignal.timeout(45000)});return{status:response.status,...await response.json()};}
function check(name,condition,detail){checks.push({name,pass:!!condition,detail});if(!condition)throw Error(name);}
try{
 const session=await call('redeem',{code:'DEMO-HZ-A1-018'});check('Fresh isolated avatar QA profile opens',session.status===200,{status:session.status});token=session.token;
 const free=await call('updateProfile',{patch:{displayName:'Avatar QA',dateOfBirth:null,goal:5,avatar:{skin:'warm',hair:'short',outfit:'magenta',badge:'none'},timeZone:'America/Guayaquil'}});check('Ordinary full profile patch accepts badge none',free.status===200&&free.profile.avatar.badge==='none',{status:free.status});
 if(free.progress.xp<25){const locked=await call('updateProfile',{patch:{avatar:{...free.profile.avatar,badge:'star-pin'}}});check('Unearned badge is rejected using stored XP',locked.status===403&&locked.error==='BADGE_LOCKED',{status:locked.status,error:locked.error,xp:free.progress.xp});}
 const beforeComplete=free.progress.completedActivities.length;let saved;
 for(let i=0;i<2;i++)saved=await call('saveAttempt',{attempt:{id:crypto.randomUUID(),activityId:'mix-recall',quizOptions:{seed:'avatar-proof',mode:'recall',chunkIds:['1a-greetings']},answers:[{questionId:'recall-v-greetings-hello',submitted:'Hello'}],durationMs:5000}});
 check('Synthetic mix adds XP without phantom path completion',saved.status===200&&saved.progress.xp===free.progress.xp+30&&saved.progress.completedActivities.length===beforeComplete,{status:saved.status,xp:saved.progress.xp,completed:saved.progress.completedActivities.length});
 const earned=await call('updateProfile',{patch:{avatar:{...free.profile.avatar,badge:'star-pin'}}});check('Earned star badge saves successfully',earned.status===200&&earned.profile.avatar.badge==='star-pin',{status:earned.status,xp:earned.progress?.xp});
 const invalid=await call('saveAttempt',{attempt:{id:crypto.randomUUID(),activityId:'toString',answers:[{questionId:'recall-v-greetings-hello',submitted:'Hello'}]}});check('Inherited object keys do not count as valid activity IDs',invalid.status===400,{status:invalid.status});
 await call('signOut');token='';const restore=await call('redeem',{code:'DEMO-HZ-A1-018'});token=restore.token;check('A new device restores the earned avatar badge',restore.status===200&&restore.profile.avatar.badge==='star-pin',{status:restore.status});
}catch(error){checks.push({name:'Run completed',pass:false,message:error.message});}finally{if(token)await call('signOut');}
const report={endpoint,date:new Date().toISOString(),checks,passed:checks.every(x=>x.pass),public001CodesUntouched:true};fs.mkdirSync('reports',{recursive:true});fs.writeFileSync('reports/live-profile.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));if(!report.passed)process.exitCode=1;
