import fs from 'node:fs';import vm from 'node:vm';import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const dir=root+'Placement/wix-backend/';
const modules=new Map();const store=new Map();let providerCalls=0;let failWrite=false;
const data={query:()=>{
 const filters=[];const q={eq:(k,v)=>{filters.push([k,v]);return q},limit:()=>q,find:async()=>({items:[...store.values()].filter(row=>filters.every(([k,v])=>row[k]===v)).map(row=>structuredClone(row))})};return q;
},get:async(_,id)=>structuredClone(store.get(id)),update:async(_,row)=>{if(failWrite)throw Error('Storage unavailable');store.set(row._id,structuredClone(row));return structuredClone(row)}};
function synthetic(name,exports){const m=new vm.SyntheticModule(Object.keys(exports),function(){for(const [k,v]of Object.entries(exports))this.setExport(k,v)});modules.set(name,m);return m}
synthetic('wix-data',{default:data});
synthetic('backend/core.js',{DATA_OPTIONS:{suppressAuth:true},readJsonBody:async r=>r.body.json(),normalizeClassCode:v=>String(v||'').toUpperCase(),getStoredAnswerKeyVersion:r=>r.answerKeyVersion||'',jsonOK:body=>({status:200,body}),jsonBadRequest:error=>({status:400,body:{success:false,error}}),jsonServerError:error=>({status:500,body:{success:false,error:String(error.message||error)}})});
synthetic('wix-fetch',{fetch:async url=>({ok:true,json:async()=>JSON.parse(fs.readFileSync(root+'Exams/answer-keys/'+url.split('/answer-keys/')[1]))})});
const exams=new vm.SourceTextModule(fs.readFileSync(dir+'exams.js','utf8').replace(/import wixData from "wix-data";/,'const wixData = {};').replace(/import \{[\s\S]*?\} from "backend\/core.js";/,'const normalizeAnswerKeyVersion=()=>"";'));
await exams.link(()=>{});await exams.evaluate();synthetic('backend/exams.js',{gradeSubmission:exams.namespace.gradeSubmission});
const rubric=new vm.SourceTextModule(fs.readFileSync(dir+'writing-rubric.js','utf8'));await rubric.link(()=>{});await rubric.evaluate();modules.set('backend/writing-rubric.js',rubric);const W=rubric.namespace;
synthetic('backend/writing-ai.js',{gradeWriting:async tasks=>{providerCalls++;await new Promise(r=>setTimeout(r,10));return {scores:tasks.map(t=>({question:t.question,bands:Object.fromEntries(t.subscales.map(s=>[s,t.answer.trim()?4:0]))})),model:'test-provider',rubricVersion:'test'}}});
const backend=new vm.SourceTextModule(fs.readFileSync(dir+'writing.js','utf8'));await backend.link(name=>modules.get(name));await backend.evaluate();
const request=payload=>({body:{json:async()=>payload}});
for(const profile of Object.values(W.PROFILES)){
 const answers={};profile.tasks.forEach(t=>(answers[t.partId]||={})[t.question]='This is a submitted sample.');
 const row={_id:profile.id,submissionId:profile.id,classId:'QA',examId:profile.examId,answersJson:JSON.stringify(answers),rawPayloadJson:JSON.stringify({answers,part2SelectedQuestion:3}),answerKeyVersion:'2026-09-18.1'};store.set(row._id,row);
 const payload={classId:'QA',submissionId:row.submissionId};
 const responses=await Promise.all([backend.namespace.getWritingAssessment(request(payload)),backend.namespace.getWritingAssessment(request(payload))]);
 assert.equal(responses[0].status,200);assert.equal(responses[1].status,200);const assessment=responses[0].body.assessment;
 assert.equal(assessment.writingRevision,1);const original=assessment.writingAiJson;
 const bands=W.tasksFor(row).map(t=>({question:t.question,bands:Object.fromEntries(t.subscales.map(s=>[s,2]))}));
 const saved=await backend.namespace.saveWritingAssessment(request({...payload,action:'save',scores:bands,expectedRevision:1}));assert.equal(saved.status,200);assert.equal(saved.body.assessment.writingRevision,2);assert.equal(saved.body.assessment.writingAiJson,original);assert.ok(saved.body.assessment.score<assessment.score);
 const stale=await backend.namespace.saveWritingAssessment(request({...payload,action:'save',scores:bands,expectedRevision:1}));assert.equal(stale.status,400);
 const wrongClass=await backend.namespace.saveWritingAssessment(request({...payload,classId:'OTHER',action:'revert',expectedRevision:2}));assert.equal(wrongClass.status,500);
 const invalid=await backend.namespace.saveWritingAssessment(request({...payload,action:'save',scores:[],expectedRevision:2}));assert.equal(invalid.status,400);
 failWrite=true;const fail=await backend.namespace.saveWritingAssessment(request({...payload,action:'revert',expectedRevision:2}));assert.equal(fail.status,400);failWrite=false;
 const reload=await backend.namespace.getWritingAssessment(request(payload));assert.equal(reload.body.assessment.writingRevision,2);assert.ok(reload.body.assessment.writingTeacherJson);
 const revert=await backend.namespace.saveWritingAssessment(request({...payload,action:'revert',expectedRevision:2}));assert.equal(revert.status,200);assert.equal(revert.body.assessment.score,assessment.score);assert.equal(revert.body.assessment.writingTeacherJson,'');assert.equal(revert.body.assessment.writingAiJson,original);
}
assert.equal(providerCalls,4,'Concurrent requests and reloads reuse the original assessment');console.log('Backend persistence: all four exams passed generation, duplicate requests, save, invalid input, stale review, wrong class, storage failure, reload and revert.');
