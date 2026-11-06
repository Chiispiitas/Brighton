import test from 'node:test';
import assert from 'node:assert/strict';
import {pathNodes,lessons} from '../content/unit1.mjs';
import {pathNodeComplete,pathNodeUnlocked,resolvePathCursor,nextPathActivity} from '../src/path-progress.js';
const lesson=id=>pathNodes.filter(n=>n.lessonId===id);
test('every lesson starts independently with only its first unfinished island open',()=>{
 for(const l of lessons){const nodes=lesson(l.id);assert.equal(pathNodeUnlocked(nodes[0],pathNodes,{}),true);for(const n of nodes.slice(1))assert.equal(pathNodeUnlocked(n,pathNodes,{}),false);}
});
test('completion unlocks just the next island without requiring mastery',()=>{
 const nodes=lesson('1A'),p={completedActivities:[nodes[0].id],islands:{[nodes[0].id]:{mastered:false}}};assert.equal(pathNodeUnlocked(nodes[1],pathNodes,p),true);assert.equal(pathNodeUnlocked(nodes[2],pathNodes,p),false);assert.equal(pathNodeComplete(nodes[0],p),true);
});
test('completing one lesson does not lock or advance another lesson',()=>{
 const p={completedActivities:lesson('1A').map(n=>n.id)};for(const id of ['1B','1C','1D']){assert.equal(pathNodeUnlocked(lesson(id)[0],pathNodes,p),true);assert.equal(pathNodeUnlocked(lesson(id)[1],pathNodes,p),false);}
});
test('old completed islands stay accessible while unfinished gaps still gate later items',()=>{
 const nodes=lesson('1A'),p={completedActivities:[nodes[0].id,nodes[2].id]};assert.equal(pathNodeUnlocked(nodes[2],pathNodes,p),true);assert.equal(pathNodeUnlocked(nodes[3],pathNodes,p),false);p.completedActivities.push(nodes[1].id);assert.equal(pathNodeUnlocked(nodes[3],pathNodes,p),true);
});
test('legacy completion and existing crowns retain compatibility',()=>{
 const first=lesson('1A')[0],p={completedActivities:first.chunkIds.map(id=>'quiz-'+id)};assert.equal(pathNodeComplete(first,p),true);assert.equal(pathNodeUnlocked(lesson('1A')[1],pathNodes,p),true);assert.equal(pathNodeComplete(first,{islands:{[first.id]:{mastered:true}}}),true);
});
test('cursor stays on the selected or last completed island, while Continue advances within that lesson',()=>{
 const nodes=lesson('1C'),p={completedActivities:[nodes[0].id],lastActivityId:nodes[0].id,lastLessonId:'1C'};assert.equal(resolvePathCursor(pathNodes,p).id,nodes[0].id);assert.equal(nextPathActivity(pathNodes,p).id,nodes[1].id);assert.equal(resolvePathCursor(pathNodes,p,nodes[1].id).id,nodes[1].id);assert.equal(resolvePathCursor(pathNodes,p,nodes[2].id).id,nodes[0].id);
});
test('legacy last activities map to the right lesson and full completion retains a cursor',()=>{
 const node=lesson('1D')[0],p={completedActivities:node.chunkIds.map(id=>'quiz-'+id),lastActivityId:'quiz-'+node.chunkIds[0],lastLessonId:'1D'};assert.equal(resolvePathCursor(pathNodes,p).id,node.id);const all={completedActivities:pathNodes.map(n=>n.id),lastActivityId:pathNodes.at(-1).id};assert.equal(resolvePathCursor(pathNodes,all).id,pathNodes.at(-1).id);assert.equal(nextPathActivity(pathNodes,all).id,pathNodes.at(-1).id);
});
