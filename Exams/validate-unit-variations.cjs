const fs=require('node:fs'), path=require('node:path'), vm=require('node:vm'), assert=require('node:assert/strict');
const root=__dirname;
const ctx={window:{location:{pathname:'/Exams/tests.html'}},URL};
vm.runInNewContext(fs.readFileSync(path.join(root,'config.js'),'utf8'),ctx);
vm.runInNewContext(fs.readFileSync(path.join(root,'shared-grading.js'),'utf8'),ctx);
const tests=ctx.window.BRIGHTON_SITE_CONFIG.FALLBACK_TESTS;
function load(test){
  const dir=path.join(root,path.dirname(test.relativeUrl));
  const x={window:{},localStorage:{getItem(){return '1'},setItem(){},removeItem(){}},console};vm.createContext(x);
  vm.runInContext(fs.readFileSync(path.join(dir,'test-data.js'),'utf8'),x);
  const html=fs.readFileSync(path.join(dir,'index.html'),'utf8');
  for(const mixer of ['b1plus-cumulative-choice-order.js','b2-cumulative-choice-order.js']) if(html.includes(mixer)) vm.runInContext(fs.readFileSync(path.join(root,'tests',mixer),'utf8'),x);
  return {data:x.window.BRIGHTON_TEST_DATA,key:JSON.parse(fs.readFileSync(path.join(root,'answer-keys',test.testId+'.json'),'utf8'))};
}
let variants=0, traced=0;
for(const original of tests.filter(t=>!/-variation-\d+$/.test(t.testId))){
  const children=tests.filter(t=>t.testId===original.testId+'-variation-1');
  assert.equal(children.length,1,original.testId+' must have one Variation B');
  const variation=children[0], {data,key}=load(variation), source=load(original);
  assert.equal(data.level,source.data.level);assert.equal(data.unitRange,source.data.unitRange);
  assert.equal(data.totalQuestions,source.data.totalQuestions);assert.equal(key.maxScore,source.key.maxScore);
  const sourceQuestions=new Map(source.data.pages.flatMap(p=>p.questions.map(q=>[q.q,q])));
  data.pages.forEach((page,i)=>{
    assert.equal(page.questions.length,source.data.pages[i].questions.length);
    assert.equal(JSON.stringify(page.passage),JSON.stringify(source.data.pages[i].passage),'Keep the original reading');
    if(!data.parentTestId)return; // Earlier hand-authored B1 variation has new target vocabulary.
    const seen=new Set();
    page.questions.forEach(q=>{
      assert(!seen.has(q.sourceQuestion));seen.add(q.sourceQuestion);
      assert(source.data.pages[i].questions.some(s=>s.q===q.sourceQuestion),'Keep items in their unit/page');
      const sq=sourceQuestions.get(q.sourceQuestion);
      const correct=key.answers[q.q].answers.map(a=>q.options[a.charCodeAt(0)-65]);
      const expected=source.key.answers[sq.q].answers.map(a=>sq.options[a.charCodeAt(0)-65]);
      assert.equal(JSON.stringify(correct),JSON.stringify(expected),variation.testId+' Q'+q.q+' correct option text');
      assert.equal(q.visual,sq.visual);traced++;
    });
  });
  for(const mode of ['correct','wrong','blank']){
    const answerList=Object.entries(key.answers).map(([question,rule])=>({question:Number(question),answer:mode==='correct'?rule.answers[0]:mode==='blank'?'':['A','B','C'].find(a=>!rule.answers.includes(a))}));
    const grade=ctx.window.BrightonGrading.gradeSubmission({answerList},key);
    assert.equal(grade.score,mode==='correct'?key.maxScore:0,variation.testId+' '+mode);
  }
  variants++;
}
console.log(`Variation audit passed: ${variants} originals each have Variation B; ${traced} generated questions traced to rendered source keys; correct/wrong/blank scoring passed.`);
