import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const rubricSource=fs.readFileSync(root+'Placement/wix-backend/writing-rubric.js','utf8');
const scope={window:{}};
vm.runInNewContext(fs.readFileSync(root+'Exams/writing-scoring.js','utf8'),scope);
const W=scope.window.BrightonWriting;
assert.equal(fs.readFileSync(root+'Exams/writing-scoring.js','utf8').includes(rubricSource.slice(0,rubricSource.indexOf('\nexport {'))),true,'Browser and backend scoring must be identical');
let checks=0;
function fixture(profile,selected=2) {
 const answers={};for(const t of profile.tasks) (answers[t.partId] ||= {})[t.question]='A meaningful answer about this task.';
 return {submissionId:profile.id,classId:'QA-WRITING',examId:profile.examId,rawPayloadJson:JSON.stringify({answers,part2SelectedQuestion:selected}),answersJson:JSON.stringify(answers)};
}
function scores(row,band=5) {return W.tasksFor(row).map(t=>({question:t.question,bands:Object.fromEntries(t.subscales.map(s=>[s,t.answer.trim()?band:0]))}));}
function objective(row) {
 const p=W.profileFor(row);if(!['a1rw','a2rw'].includes(p.id))return {score:0,maxScore:0,details:[],partScores:{}};
 const key=JSON.parse(fs.readFileSync(root+`Exams/answer-keys/${p.examId}.json`));
 return {maxScore:key.maxScore,details:Object.entries(key.answers).map(([q,r])=>({question:Number(q),part:r.part,earned:r.points,max:r.points,correct:true})),partScores:{}};
}
for(const p of Object.values(W.PROFILES)) {
 const selections=p.choice?[2,3,4]:[2];
 for(const selection of selections) {
  const row=fixture(p,selection);const tasks=W.tasksFor(row);
  const expected={a1rw:39,a2rw:60,b1plus:30,b2:40}[p.id];
  const ai={scores:scores(row),objective:objective(row)};row.writingAiJson=JSON.stringify(ai);
  assert.equal(W.apply(row).score,expected);assert.equal(W.apply(row).maxScore,expected);assert.equal(W.apply(row).percentage,100);
  row.writingTeacherJson=JSON.stringify({scores:scores(row,0)});
  const manual=W.apply(row);assert.equal(manual.score,expected-tasks.reduce((s,t)=>s+t.points,0));
  row.writingTeacherJson='';assert.equal(W.apply(row).score,expected);
  assert.equal(JSON.stringify(W.parse(row.writingAiJson)),JSON.stringify(ai),'Reversion never changes original AI');
  for(const invalid of [-1,6,2.5,null,'3',NaN]) {
   const s=scores(row);s[0].bands[tasks[0].subscales[0]]=invalid;assert.throws(()=>W.validateScores(tasks,s));
  }
  assert.throws(()=>W.validateScores(tasks,scores(row).slice(1)));
  const duplicate=scores(row);duplicate[1].question=duplicate[0].question;assert.throws(()=>W.validateScores(tasks,duplicate));
  if(p.choice) assert.deepEqual(Array.from(tasks,t=>t.question),[1,selection],'Unselected drafts must never count');
  const blank=fixture(p,selection);blank.answersJson='{}';blank.rawPayloadJson=JSON.stringify({part2SelectedQuestion:selection});
  assert.equal(W.tasksFor(blank).length,tasks.length,'Blank tasks retain their denominators');
  assert.throws(()=>W.validateScores(W.tasksFor(blank),scores(row)));
  assert.equal(W.combine(blank,objective(blank),scores(blank)).score,expected-tasks.reduce((s,t)=>s+t.points,0));
  checks+=17;
 }
}
assert.equal(W.profileFor({examId:'brighton-b2-listening-final'}),null);
assert.equal(W.profileFor({examId:'brighton-a2-reading-and-writing-final'}).id,'a2rw');
assert.equal(W.profileFor({examId:'brighton-a1-rw-final@@2026-09-18.1'}).id,'a1rw');
console.log(`Writing scoring: ${checks+3} assertions passed across A1, A2, B1+ and all B2 task choices.`);
