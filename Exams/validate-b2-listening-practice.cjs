const fs = require('fs');
const assert = require('assert/strict');
const { JSDOM } = require('jsdom');
const path = require('path');
const read = p => fs.readFileSync(path.join(__dirname, p), 'utf8');
const key = JSON.parse(read('answer-keys/brighton-b2-listening-practice-3.json'));
const pause = () => new Promise(r => setTimeout(r, 80));
function boot(saved) {
  const dom = new JSDOM(read('exams/b2-listening-practice-3/index.html'), {url:'https://example.test/Exams/exams/b2-listening-practice-3/', runScripts:'outside-only', pretendToBeVisual:true});
  const w = dom.window;
  w.scrollTo = () => {};
  w.HTMLElement.prototype.scrollIntoView = () => {};
  w.HTMLMediaElement.prototype.play = async function() { this.dispatchEvent(new w.Event('play')); };
  if (saved) for (const [k,v] of Object.entries(saved)) w.localStorage.setItem(k,v);
  w.eval(read('exams/b2-listening-practice-3/listening-data.js'));
  w.eval(read('shared-grading.js'));
  w.fetch = async () => ({ok:true,json:async()=>({})});
  w.eval(read('app-core.js'));
  w.BRIGHTON_SITE_CONFIG = {API_BASE_URL:'https://example.test/api'};
  let live;
  w.BrightonLiveProgress = {create(options) {live=options; return {start(){}, stop(){}, touch(){}, async markSubmitted(){}};}};
  let source = read('exams/b2-listening/main.js');
  const end = source.lastIndexOf('})();');
  source = source.slice(0,end) + 'window.qa={setCurrentQuestion,buildExportPayload,buildLiveProgressSnapshot,showFinishScreen,saveStateNow};' + source.slice(end);
  w.eval(source);
  return {dom,w,d:w.document,live:()=>live};
}
(async () => {
  let t = boot({'brighton-b2-listening-exam-state-v1':'{"original":"untouched"}'});
  const {w,d}=t;
  assert.equal(d.querySelectorAll('[data-jump-q]').length,0);
  d.querySelector('#studentName').value='QA Listening';
  d.querySelector('#classId').value='qa-listen';
  d.querySelector('#studentForm').dispatchEvent(new w.Event('submit',{cancelable:true}));
  assert.equal(d.querySelectorAll('[data-jump-q]').length,8);
  assert.equal(t.live().examId,key.examId);
  assert.equal(d.querySelector('#audioGate').getAttribute('aria-hidden'),'false');
  d.querySelector('#playAudioBtn').click(); await pause();
  assert.equal(d.querySelector('#audioGate').getAttribute('aria-hidden'),'true');
  for (const part of w.listeningExam.parts) {
    w.qa.setCurrentQuestion(part.items[0].q);
    for (const item of part.items) {
      const answer=key.answers[item.q].answers[0];
      if(part.type==='multiple') {
        const input=d.querySelector(`.radio-group[data-q="${item.q}"] input[value="${answer}"]`);
        assert.ok(input,`radio ${item.q}`); input.checked=true; input.dispatchEvent(new w.Event('change',{bubbles:true}));
      } else if(part.type==='gap') {
        const input=d.querySelector(`input[data-q="${item.q}"]`); input.value=answer; input.dispatchEvent(new w.Event('input',{bubbles:true}));
      } else {
        d.querySelector(`[data-option-id="${answer}"]`).click(); d.querySelector(`[data-gap-q="${item.q}"]`).click();
        assert.ok(d.querySelector(`[data-option-id="${answer}"]`).classList.contains('used'));
      }
    }
  }
  const payload=w.qa.buildExportPayload();
  assert.equal(payload.answerList.length,30);
  assert.equal(payload.examId,key.examId);
  assert.equal(w.qa.buildLiveProgressSnapshot().answeredCount,30);
  assert.equal(w.BrightonGrading.gradeSubmission(payload,key).score,30);
  assert.equal(w.BrightonGrading.gradeSubmission({answers:{}},key).score,0);
  payload.answers.part2[14]=' ORGANIZATION ';
  payload.answerList.find(a=>a.question===14).answer=' ORGANIZATION ';
  assert.equal(w.BrightonGrading.gradeSubmission(payload,key).score,30);
  payload.answers.part1[1]='wrong';
  payload.answerList.find(a=>a.question===1).answer='wrong';
  assert.equal(w.BrightonGrading.gradeSubmission(payload,key).score,29);
  w.qa.saveStateNow();
  const saved=Object.fromEntries(Array.from({length:w.localStorage.length},(_,i)=>{const k=w.localStorage.key(i);return[k,w.localStorage.getItem(k)];}));
  assert.equal(saved['brighton-b2-listening-exam-state-v1'],'{"original":"untouched"}');
  t.dom.window.close(); t=boot(saved);
  assert.equal(t.w.qa.buildLiveProgressSnapshot().answeredCount,30);
  assert.equal(t.d.querySelector('#audioGate').getAttribute('aria-hidden'),'false');
  let calls=0;
  t.w.fetch=async(url,opts)=>{calls++; const body=JSON.parse(opts.body);assert.equal(body.examId,key.examId); assert.equal(body.answerList.length,30);return {ok:calls>1,status:503,json:async()=>calls>1?{success:true,submissionId:'qa'}:{success:false,error:'Temporary test failure'}};};
  t.w.console.error=()=>{};
  t.w.qa.showFinishScreen(); await pause();
  assert.equal(t.d.querySelector('#submitStatusBadge').textContent,'Not saved');
  assert.ok(t.w.localStorage.getItem(t.w.listeningExam.storageKey));
  t.d.querySelector('[data-retry-submission]').click(); await pause();
  assert.equal(calls,2);
  assert.equal(t.d.querySelector('#submitStatusBadge').textContent,'Saved');
  assert.equal(t.w.localStorage.getItem(t.w.listeningExam.storageKey),null);
  assert.equal(t.w.localStorage.getItem('brighton-b2-listening-exam-state-v1'),'{"original":"untouched"}');
  t.dom.window.close();
  console.log('B2 Practice 3: 30 rendered questions, audio gate, all answer controls, matching reuse, full/empty/partial grading, spelling normalization, separate storage, reload, progress identity and submission retry passed.');
})().catch(e=>{console.error(e);process.exitCode=1;});




