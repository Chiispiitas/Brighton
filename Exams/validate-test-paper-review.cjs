const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');
const dom = new JSDOM('', {runScripts:'outside-only'});
dom.window.eval(fs.readFileSync(path.join(__dirname, 'test-paper-review.js'), 'utf8'));
let tests = 0, count = 0;
for (const folder of fs.readdirSync(path.join(__dirname,'tests'))) {
  const file = path.join(__dirname,'tests',folder,'test-data.js');
  if (!fs.existsSync(file)) continue;
  const context = {window:{}};
  vm.runInNewContext(fs.readFileSync(file,'utf8'),context);
  const data = context.window.BRIGHTON_TEST_DATA;
  const key = JSON.parse(fs.readFileSync(path.join(__dirname,'answer-keys',data.testId+'.json')));
  const questions = data.pages.flatMap(page => page.questions);
  const details = questions.map((question,index) => {
    const right = key.answers[question.q].answers[0];
    return {question:question.q,answer:index%3===2?'':index%3===0?right:['A','B','C'].find(x=>x!==right),correct:index%3===0};
  });
  dom.window.document.body.innerHTML = dom.window.BrightonTestPaperReview.render(data,details,key);
  const cards = dom.window.document.querySelectorAll('.paper-question');
  assert.equal(cards.length,questions.length);
  questions.forEach((question,index) => {
    const card = cards[index];
    assert.ok(card.textContent.includes(question.text));
    assert.equal(card.querySelectorAll('.paper-option').length,question.options.length);
    question.options.forEach(option => assert.ok(card.textContent.includes(option)));
    const correct = card.querySelector('.is-correct');
    assert.equal(correct.dataset.optionValue,key.answers[question.q].answers[0]);
    assert.equal(card.querySelectorAll('.is-selected').length,details[index].answer?1:0);
    if (details[index].answer) assert.equal(card.querySelector('.is-selected').dataset.optionValue,details[index].answer);
  });
  assert.equal(dom.window.document.querySelectorAll('.paper-passage').length,data.pages.filter(page=>page.passage).length);
  count+=questions.length; tests++;
}
console.log(`Paper review passed: ${tests} tests, ${count} questions, every option, correct/wrong/unanswered choices and reading passages.`);
