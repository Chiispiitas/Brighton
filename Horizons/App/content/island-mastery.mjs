import {pathNodes,lessons} from './unit1.mjs';
import {getActivityQuestions,getWordsForChunks} from './engine.mjs';

// One unaided correct answer masters an item. Matching does not stand in for recall.
export const masteryTargets=Object.fromEntries(pathNodes.map(node=>[node.id,
 node.type==='quiz'?getWordsForChunks(node.chunkIds).map(word=>word.id):
 getActivityQuestions(node.id,{seed:0,count:512}).map(question=>question.id)
]));
const qualifies=item=>item.correct>=1;
export function summarizeIslands(events,wordStats){
 const islands=Object.fromEntries(pathNodes.map(node=>[node.id,{items:{}}]));
 for(const event of events){
  const island=islands[event.activityId];if(!island)continue;
  const node=pathNodes.find(node=>node.id===event.activityId);if(node.type==='quiz')continue;
  for(const answer of event.answers){
   if(!masteryTargets[node.id].includes(answer.questionId))continue;
   // A silent alternative is useful practice, but cannot master the audio task.
   if(node.type==='listening'&&(event.audioEnabled===false||event.audioFallbackQuestionIds?.includes(answer.questionId)))continue;
   const item=island.items[answer.questionId]||={seen:0,correct:0,attempts:0,mastered:false};
   item.seen++;if(answer.hintUsed)continue;item.attempts++;if(answer.correct)item.correct++;item.mastered=qualifies(item);
  }
 }
 for(const node of pathNodes){
  const island=islands[node.id],targets=masteryTargets[node.id];
  if(node.type==='quiz')for(const id of targets){const s=wordStats[id];island.items[id]={seen:s?.seen||0,correct:s?.retrievalCorrect||0,attempts:s?.recallAttempts||0,mastered:!!s?.mastered};}
  island.total=targets.length;island.seen=targets.filter(id=>island.items[id]?.seen>0).length;
  island.masteredCount=targets.filter(id=>island.items[id]?.mastered).length;
  island.mastered=targets.length>0&&island.masteredCount===targets.length;
 }
 return {islands,masteredLessons:lessons.filter(lesson=>lesson.pathNodeIds.every(id=>islands[id].mastered)).map(lesson=>lesson.id)};
}
export function selectIslandQuestions(node,progress,{seed,count=8,...options}={}){
 const pool=getActivityQuestions(node.id,{...options,seed,count:512});
 const items=progress?.islands?.[node.id]?.items||{};
 const key=q=>node.type==='quiz'?q.wordIds?.[0]:q.id;
 const stats=q=>items[key(q)]||(node.type==='quiz'?progress?.wordStats?.[key(q)]:null)||{};
 const remaining=pool.filter(q=>!stats(q).mastered);
 const ranked=(remaining.length?remaining:pool).map((q,index)=>({q,index,s:stats(q)}));
 ranked.sort((a,b)=>(Number(!!a.s.seen)-Number(!!b.s.seen))||((a.s.correct??a.s.retrievalCorrect??0)-(b.s.correct??b.s.retrievalCorrect??0))||((a.s.seen||0)-(b.s.seen||0))||a.index-b.index);
 return ranked.slice(0,count).map(item=>item.q);
}
