const fs=require('fs');const assert=require('assert/strict');const {JSDOM}=require('jsdom');
const root=require('path').resolve(__dirname,'..')+'/';
const pause=()=>new Promise(r=>setTimeout(r,30));
(async()=>{
for(const id of ['a1rw','a2rw','b1','b1plus','b2']){
 const dom=new JSDOM(fs.readFileSync(root+'Exams/results.html','utf8'),{url:'http://localhost/Exams/results.html?classId=QA&load=1',runScripts:'outside-only'});
 const w=dom.window;w.scrollTo=()=>{};w.HTMLElement.prototype.scrollIntoView=()=>{};w.eval(fs.readFileSync(root+'Exams/writing-scoring.js','utf8'));
 const W=w.BrightonWriting;const p=W.PROFILES[id];const answers={};p.tasks.forEach(t=>(answers[t.partId]||={})[t.question]='A clear writing response.');
 let row={submissionId:id,examId:p.examId,examTitle:p.examId,classId:'QA',studentName:'QA Sample',answersJson:JSON.stringify(answers),rawPayloadJson:JSON.stringify({answers,part2SelectedQuestion:4}),answerKeyVersion:'2026-09-18.1'};
 w.eval(fs.readFileSync(root+'Exams/shared-grading.js','utf8'));const key=['a1rw','a2rw'].includes(id)?JSON.parse(fs.readFileSync(root+`Exams/answer-keys/${p.examId}.json`)):null;
 const objective=key?w.BrightonGrading.gradeSubmission({answers},key):{maxScore:0,score:0,details:[],partScores:{}};
 const scores=W.tasksFor(row).map(t=>({question:t.question,bands:Object.fromEntries(t.subscales.map(n=>[n,4])),feedback:'QA AI evidence.'}));
 row={...row,writingAiJson:JSON.stringify({objective,scores}),writingRevision:1};row=W.apply(row);
 let fail=false;let calls=0;
 w.fetch=async(url,options={})=>{
  if(url.includes('/getExams'))return {ok:true,json:async()=>({success:true,exams:[]})};
  if(url.includes('/getProgress'))return {ok:true,json:async()=>({success:true,items:[]})};
  if(url.includes('/getResults'))return {ok:true,json:async()=>({success:true,items:[structuredClone(row)]})};
  if(url.includes('/saveWritingAssessment')){
   calls++;if(fail)return {ok:false,json:async()=>({success:false,error:'Storage unavailable'})};
   const body=JSON.parse(options.body);assert.equal(body.expectedRevision,row.writingRevision);
   row.writingTeacherJson=body.action==='save'?JSON.stringify({scores:body.scores}):'';row.writingRevision++;row=W.apply(row);
   return {ok:true,json:async()=>({success:true,assessment:structuredClone(row)})};
  }
  if(key)return {ok:true,json:async()=>key};throw Error('Unexpected URL '+url);
 };
 w.BRIGHTON_SITE_CONFIG={API_BASE_URL:'http://localhost/api'};
 let dashboard=fs.readFileSync(root+'Exams/results.js','utf8');
 const end=dashboard.lastIndexOf('})();');
 dashboard=dashboard.slice(0,end)+'window.qaWritingRequest=writingRequest;'+dashboard.slice(end);
 w.eval(dashboard);
 await pause();await pause();w.document.querySelector('[data-details]').click();await pause();await pause();
 const d=w.document;assert.ok(d.querySelector('[data-writing-status]').textContent.includes('Suggested'));
 assert.equal(d.querySelectorAll('[data-review-band]').length,W.tasksFor(row).reduce((s,t)=>s+t.subscales.length,0));
 assert.equal(d.querySelector('[data-exam-total]').textContent,`${row.score}/${row.maxScore}`);
 const original=row.writingAiJson;const originalScore=row.score;
 const input=d.querySelector('[data-review-band]');input.value='6';input.dispatchEvent(new w.Event('input'));assert.equal(d.querySelector('[data-save-writing]').disabled,true);
 input.value='0';input.dispatchEvent(new w.Event('input'));assert.equal(d.querySelector('[data-save-writing]').disabled,false);
 assert.ok(d.querySelector('[data-writing-status]').textContent.includes('Unsaved'));
 d.querySelector('[data-save-writing]').click();await pause();await pause();assert.equal(calls,1);assert.ok(row.score<originalScore);assert.equal(row.writingAiJson,original);
 assert.ok(d.querySelector('#resultsBody').textContent.includes(`${row.score}/${row.maxScore}`));assert.ok(d.querySelector('[data-writing-status]').textContent.includes('saved'));
 let csv='';w.Blob=class{constructor(parts){csv=parts.join('')}};w.URL.createObjectURL=()=> 'blob:qa';w.URL.revokeObjectURL=()=>{};w.HTMLAnchorElement.prototype.click=()=>{};
 d.querySelector('#exportBtn').click();assert.ok(csv.includes('Teacher saved'));assert.ok(csv.includes(String(row.score)));
 d.querySelector('#closeModalBtn').click();d.querySelector('#loadBtn').click();await pause();await pause();d.querySelector('[data-details]').click();await pause();await pause();assert.equal(d.querySelector('[data-review-band]').value,'0');
 fail=true;d.querySelector('[data-revert-writing]').click();await pause();await pause();assert.ok(d.querySelector('[data-writing-status]').textContent.includes('Could not revert'));assert.ok(row.score<originalScore);
 fail=false;d.querySelector('[data-revert-writing]').click();await pause();await pause();assert.equal(row.score,originalScore);assert.equal(row.writingAiJson,original);assert.equal(row.writingTeacherJson,'');assert.equal(d.querySelector('[data-review-band]').value,'4');
 if(id==='b2'){
  let retries=0;w.fetch=async()=>++retries<3?{ok:false,status:504,json:async()=>{throw Error('Non-JSON gateway timeout')}}:{ok:true,status:200,json:async()=>({success:true,assessment:row})};
  const recovered=await w.qaWritingRequest('getWritingAssessment',row);assert.equal(retries,3);assert.equal(recovered.writingAiJson,original);
 }
 dom.window.close();console.log(`${id}: UI suggested totals, valid/invalid editing, save, dashboard, reload, failed revert and AI reversion passed.`);
}
})().catch(e=>{console.error(e);process.exitCode=1});
