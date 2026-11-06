// Pedagogical navigation within each lesson; book access remains server-authoritative.
export function pathNodeComplete(node,progress={}){
 const done=new Set(progress.completedActivityIds||progress.completedActivities||[]);
 if(done.has(node.id)||progress.islands?.[node.id]?.mastered)return true;
 if(node.kind==='game')return false;
 const legacy=[...(node.chunkIds||[]).map(id=>'quiz-'+id),...(node.grammarSetIds||[]).map(id=>'practice-'+id)];
 return legacy.length>0&&legacy.every(id=>done.has(id));
}
export function pathNodeUnlocked(node,nodes,progress={}){
 if(pathNodeComplete(node,progress))return true;
 const lesson=nodes.filter(n=>n.lessonId===node.lessonId),index=lesson.findIndex(n=>n.id===node.id);
 return index>=0&&lesson.slice(0,index).every(n=>pathNodeComplete(n,progress));
}
export function resolvePathCursor(nodes,progress={},selectedId=null){
 const accessible=node=>node&&pathNodeUnlocked(node,nodes,progress);
 const selected=nodes.find(n=>n.id===selectedId);if(accessible(selected))return selected;
 const lastId=progress.lastActivityId,last=nodes.find(n=>n.id===lastId)||nodes.find(n=>(!progress.lastLessonId||n.lessonId===progress.lastLessonId)&&[...(n.chunkIds||[]).map(id=>'quiz-'+id),...(n.grammarSetIds||[]).map(id=>'practice-'+id)].includes(lastId));
 if(accessible(last))return last;
 return nodes.find(n=>accessible(n)&&!pathNodeComplete(n,progress))||nodes[0]||null;
}
export function nextPathActivity(nodes,progress={},selectedId=null){
 const cursor=resolvePathCursor(nodes,progress,selectedId),pending=node=>!pathNodeComplete(node,progress)&&pathNodeUnlocked(node,nodes,progress);
 if(cursor&&pending(cursor))return cursor;
 return nodes.find(n=>n.lessonId===cursor?.lessonId&&pending(n))||nodes.find(pending)||cursor;
}
