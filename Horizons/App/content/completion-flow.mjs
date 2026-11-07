export function overtakingEvent(before,after){
 if(!before||!after||before.week!==after.week)return null;
 const old=before.rows.find(r=>r.self),current=after.rows.find(r=>r.self);
 if(!old||!current||old.id!==current.id||current.position>=old.position||current.xp<=old.xp)return null;
 const passed=before.rows.filter(r=>!r.self&&r.position<old.position&&after.rows.some(n=>n.id===r.id&&n.position>current.position));
 if(!passed.length)return null;
 return {from:old.position,to:current.position,xp:current.xp,rank:after.rank,self:current,passed};
}
export function nextCompletionStage(result){
 if(result.completionStage==='streak')result.streakDone=true;
 if(result.completionStage==='overtake')result.overtakeDone=true;
 if(result.completionStage==='achievement')result.achievementDone=true;
 return result.pendingStreak&&!result.streakDone?'streak':result.overtake&&!result.overtakeDone?'overtake':result.achievements?.length&&!result.achievementDone?'achievement':'done';
}
