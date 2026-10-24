const fs=require('fs');
const assert=require('assert/strict');
const path=require('path');
const {JSDOM}=require('jsdom');
const read=p=>fs.readFileSync(path.join(__dirname,p),'utf8');
(async()=>{
const dom=new JSDOM(read('results.html'),{url:'https://example.test/Exams/results.html',runScripts:'outside-only'});
const w=dom.window;w.fetch=async()=>({ok:true,json:async()=>({success:true,exams:[],items:[]})});w.scrollTo=()=>{};
w.eval(read('config.js'));w.eval(read('app-core.js'));w.eval(read('shared-grading.js'));
let source=read('results.js');const end=source.lastIndexOf('})();');
source=source.slice(0,end)+'window.qa={normalizeSubmissionIdentity,buildAnswerReview,fillExamSelect};'+source.slice(end);w.eval(source);
await new Promise(r=>setTimeout(r,30));
const final=w.BRIGHTON_SITE_CONFIG.FALLBACK_EXAMS.find(x=>x.examId==='brighton-b2-listening-final');
// Reproduce an inactive practice omitted from the live catalog.
w.qa.fillExamSelect([final]);
const key=JSON.parse(read('answer-keys/brighton-b2-listening-practice-3.json'));
const original=JSON.parse(read('answer-keys/brighton-b2-listening-final.json'));
const answers={};for(const [q,rule]of Object.entries(key.answers))(answers['part'+rule.part]||={})[q]=rule.answers[0];
let row={examId:key.examId,examTitle:key.title,level:'B2',skill:'Listening',totalQuestions:30,maxScore:30,answerKeyVersion:'2026-10-24.1',answersJson:JSON.stringify(answers),answerListJson:JSON.stringify(Object.entries(key.answers).map(([q,r])=>({part:r.part,partId:'part'+r.part,question:Number(q),answer:r.answers[0]})))};
row=w.qa.normalizeSubmissionIdentity(row);
assert.equal(row._canonicalExamId,key.examId);
assert.ok(row.examId.startsWith(key.examId));
const requested=[];w.BrightonGrading.loadAnswerKey=async id=>{requested.push(id);return id.startsWith(key.examId)?key:original;};
const review=await w.qa.buildAnswerReview(row);
assert.equal(review.rows.length,30);assert.equal(review.score,30);assert.equal(review.rows.find(x=>x.question===9).expected,'culture');assert.ok(review.rows.every(x=>x.status.label==='Correct'));
// Original exam keeps its own key; unknown explicit exams are not guessed.
const old=w.qa.normalizeSubmissionIdentity({...row,examId:final.examId,examTitle:final.title,_canonicalExamId:undefined});assert.equal(old._canonicalExamId,final.examId);
const unknown=w.qa.normalizeSubmissionIdentity({examId:'brighton-b2-listening-future',examTitle:'Future practice',level:'B2',skill:'Listening'});assert.equal(unknown.examId,'brighton-b2-listening-future');assert.equal(unknown._canonicalExamId,undefined);
// Preserve supported legacy title recovery.
const legacy=w.qa.normalizeSubmissionIdentity({examId:'old-listening',examTitle:final.title});assert.equal(legacy._canonicalExamId,final.examId);
// The same identity logic applies to the live-progress modal.
const progress=w.qa.normalizeSubmissionIdentity({examId:key.examId,examTitle:key.title,level:'B2',skill:'Listening',totalQuestions:30,rawProgressJson:JSON.stringify({answers})});assert.equal(progress._canonicalExamId,key.examId);
dom.window.close();console.log('Results identity: inactive practice, all 30 expected answers/marks, live progress, original exam, unknown explicit IDs, and legacy recovery passed.');
})().catch(e=>{console.error(e);process.exitCode=1;});
