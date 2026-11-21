const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert/strict');
const root = path.resolve(__dirname, '../../..');
const exams = path.join(root, 'Exams');
const configPath = path.join(exams, 'config.js');
const configSource = fs.readFileSync(configPath, 'utf8');
const ctx = {window: {location: {pathname: '/Exams/tests.html'}}};
vm.runInNewContext(configSource, ctx);
const originals = ctx.window.BRIGHTON_SITE_CONFIG.FALLBACK_TESTS.filter(t => !/-variation-\d+$/.test(t.testId));
const prompts = require('./variation-prompts.json');
const version = JSON.parse(fs.readFileSync(path.join(exams, 'answer-keys/version.json'), 'utf8')).currentVersion;
const entries = [], report = [];
const mixers = ['b1plus-cumulative-choice-order.js', 'b2-cumulative-choice-order.js'];
function loadRendered(dir) {
  const sandbox = {window:{}, localStorage:{getItem(){return '1'},setItem(){},removeItem(){}}, console};
  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(path.join(dir,'test-data.js'),'utf8'),sandbox);
  const html = fs.readFileSync(path.join(dir,'index.html'),'utf8');
  for(const mixer of mixers) if(html.includes(mixer)) vm.runInContext(fs.readFileSync(path.join(exams,'tests',mixer),'utf8'),sandbox);
  return {data:JSON.parse(JSON.stringify(sandbox.window.BRIGHTON_TEST_DATA)),html};
}
for(const original of originals) {
  const slug = original.testId.replace(/^brighton-/, '');
  const id = original.testId + '-variation-1';
  const registered = ctx.window.BRIGHTON_SITE_CONFIG.FALLBACK_TESTS.some(t=>t.testId===id);
  if(registered && !prompts[slug]) continue;
  assert(prompts[slug], `Missing edited prompts: ${slug}`);
  const sourceDir = path.join(exams, path.dirname(original.relativeUrl));
  const {data,html} = loadRendered(sourceDir);
  const key = JSON.parse(fs.readFileSync(path.join(exams,'answer-keys',original.testId+'.json'),'utf8'));
  const newAnswers = {};
  let edited = 0;
  data.pages.forEach((page) => {
    const start = Number(page.questions[0].q);
    const questions = page.questions.map(q => {
      const sourceQ = Number(q.q);
      const oldAnswer = key.answers[sourceQ];
      const sourceCorrect = oldAnswer.answers.map(letter=>q.options[letter.charCodeAt(0)-65]);
      assert(sourceCorrect.every(s=>s!==undefined));
      const replacement = prompts[slug][sourceQ];
      if(replacement) {q.text = replacement;edited++;}
      q.text=q.text.replace(/^\d+\.\d+\s+/, '');
      // Remove equivalent distractors inherited from the source worksheets.
      if(slug==='a1-units-1-2' && sourceQ===2) q.options=q.options.map(s=>s==="what's"?'What are':s);
      if(slug==='a2-units-5-6' && sourceQ===1) q.options=q.options.map(s=>s==='does watch'?'watch':s);
      // Swap adjacent items within each page; keep readings and visual objects attached.
      q.sourceQuestion = sourceQ;
      const canonicalReading = q.options.join('|') === 'True|False|Not enough information';
      if(!canonicalReading) {
        const shift = sourceQ % 2 + 1;
        q.options = q.options.map((_,i,options)=>options[(i+shift)%options.length]);
      }
      return {q,answer:{...oldAnswer,answers:sourceCorrect.map(s=>String.fromCharCode(65+q.options.indexOf(s)))}};
    });
    for(let i=0;i+1<questions.length;i+=2) [questions[i],questions[i+1]]=[questions[i+1],questions[i]];
    page.questions=questions.map(({q,answer},i)=>{q.q=start+i;newAnswers[q.q]=answer;return q});
  });
  data.testId=id;
  data.title=original.title+' · Variation B';
  data.parentTestId=original.testId;
  data.choiceOrder='authored';
  key.examId=id;key.examTitle=data.title;key.answers=newAnswers;
  const dir=path.join(exams,'tests',slug+'-variation-1');fs.mkdirSync(dir,{recursive:true});
  fs.writeFileSync(path.join(dir,'test-data.js'),'"use strict";\nwindow.BRIGHTON_TEST_DATA = '+JSON.stringify(data,null,2)+';\n');
  let nextHtml=html.replaceAll('/'+slug+'/', '/'+slug+'-variation-1/').replaceAll(original.title,data.title);
  for(const mixer of mixers) nextHtml=nextHtml.replace(new RegExp('<script\\s+src="\\.\\./'+mixer.replaceAll('.','\\.')+'[^" ]*"\\s*>\\s*</script>','g'),'');
  fs.writeFileSync(path.join(dir,'index.html'),nextHtml);
  const keyText=JSON.stringify(key,null,2)+'\n';
  for(const dest of ['answer-keys', 'answer-keys/versions/'+version]) fs.writeFileSync(path.join(exams,dest,id+'.json'),keyText);
  if(!registered) entries.push({...original,testId:id,parentTestId:original.testId,variationLabel:'Variation B',title:data.title,relativeUrl:'tests/'+slug+'-variation-1/index.html'});
  report.push({id,questions:data.totalQuestions,editedPrompts:edited});
}
if(entries.length) fs.writeFileSync(configPath,configSource.replace('  FALLBACK_TESTS: [','  FALLBACK_TESTS: [\n'+entries.map(t=>'    '+JSON.stringify(t)+',').join('\n')));
console.log(JSON.stringify(report,null,2));
