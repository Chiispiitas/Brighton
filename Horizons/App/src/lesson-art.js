// Choose the visual from the activity's teaching context, never its answer status.
export function lessonArt(question={},activity={},pictured=null){
 if(pictured)return{kind:'topic',asset:pictured};
 if(activity.id==='listen-1d'||activity.activityId==='listen-1d')return{kind:'situation',term:'receptionist'};
 const character=activity.character||({greetings:'mina',alphabet:'alex',numbers:'alex',personal:'jo',countries:'mina',adjectives:'jo',phrases:'jo'}[question.word?.topic])||({ '1A':'mina','1B':'jo','1C':'mina','1D':'jo' }[activity.lessonId])||'alex';
 const reading=activity.type==='reading'||Boolean(question.passage);
 const travel=question.word?.topic==='countries';
 const posture=reading?(character==='alex'?'listen':'read'):travel?(character==='pico'?'explore':character==='mina'?'map':'read'):({pico:'greet',mina:'step',alex:'listen',jo:'offer'}[character]);
 return{kind:'cast',character,posture};
}
