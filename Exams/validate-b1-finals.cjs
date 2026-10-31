/* Independent reviewed expectations for the original B1 finals. */
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const root = __dirname;
function read(file) { return fs.readFileSync(path.join(root, file), 'utf8'); }
function data(file, name) {
  const context = { window: {} };
  vm.runInNewContext(read(file), context);
  return JSON.parse(JSON.stringify(context.window[name]));
}
const reading = data('exams/b1-reading/exam-data.js', 'examParts');
const listening = data('exams/b1-listening/listening-data.js', 'listeningExam');
const writing = data('exams/b1-writing/writing-data.js', 'writingExam');
assert.deepEqual(reading.map(p => p.items.length), [5, 5, 5, 5, 6, 6]);
assert.deepEqual(listening.parts.map(p => p.items.length), [7, 6, 6, 6]);
assert.deepEqual(writing.parts.map(p => p.items.length), [2, 1, 1]);
assert.equal(writing.level, 'B1');
assert.equal(writing.maxScore, 30);
assert.equal(writing.rubricProfile, 'b1-writing');
const expectations = {
  reading: [...'BACBCECBGHCABDBBEGADCADBCA', 'to', 'of', 'by', 'out', 'than', 'to'],
  listening: [...'BCACA BACBACBA'.replace(/ /g, ''), 'community centre', '12 May', '10:30', 'notebook', 'vegetable soup', '45', ...'ACBACB']
};
assert.equal(expectations.reading.length, 32);
assert.equal(expectations.listening.length, 25);
const context = { window: {} };
vm.runInNewContext(read('shared-grading.js'), context);
const grader = context.window.BrightonGrading;
for (const [skill, parts] of [['reading', reading], ['listening', listening.parts]]) {
  const id = `brighton-b1-${skill}-final`;
  const key = JSON.parse(read(`answer-keys/${id}.json`));
  const answers = {};
  for (const [index, part] of parts.entries()) {
    for (const item of part.items) {
      assert.equal(key.answers[item.q].part, index + 1);
      assert.ok(key.answers[item.q].answers.includes(expectations[skill][item.q - 1]), `${skill} Q${item.q}: reviewed answer differs`);
      answers[`part${index + 1}`] ||= {};
      answers[`part${index + 1}`][item.q] = expectations[skill][item.q - 1];
      if (item.options) assert.ok(item.options[expectations[skill][item.q - 1]], `${skill} Q${item.q}: option does not exist`);
    }
  }
  assert.equal(grader.gradeSubmission({ answers }, key).score, key.maxScore);
  assert.equal(grader.gradeSubmission({ answers: {} }, key).score, 0);
  answers.part1[1] = '';
  assert.equal(grader.gradeSubmission({ answers }, key).score, key.maxScore - 1);
  assert.equal(key.examId, id);
}
const readingKey = JSON.parse(read('answer-keys/brighton-b1-reading-final.json'));
assert.deepEqual(readingKey.answers[29].answers, ['by', 'with'], 'Accept both grammatical ways to help with washing.');
const listeningKey = JSON.parse(read('answer-keys/brighton-b1-listening-final.json'));
for (const [q, alternatives] of [[14, ['community centre', 'community center']], [16, ['10:30', '10.30', 'half past ten']], [19, ['45', 'forty-five']]]) {
  for (const answer of alternatives) assert.ok(listeningKey.answers[q].answers.includes(answer));
}
for (const item of listening.parts[0].items) {
  assert.deepEqual(Object.values(item.options).map(o => o.panel), [0, 1, 2]);
  assert.equal(new Set(Object.values(item.options).map(o => o.image)).size, 1);
}
// Review the same B1 weighting and exact prompts used by the live writing backend.
const wContext = { window: {} };
vm.runInNewContext(read('writing-scoring.js'), wContext);
const profile = JSON.parse(JSON.stringify(wContext.window.BrightonWriting.PROFILES.b1));
assert.deepEqual(profile.tasks.map(t => t.points), [5, 5, 10, 10]);
assert.equal(profile.tasks[2].title, writing.parts[1].items[0].title);
assert.ok(profile.tasks[2].prompt.includes(writing.parts[1].items[0].message));
assert.ok(profile.tasks[3].prompt.includes(writing.parts[2].items[0].storyStarter));
assert.ok(profile.tasks.every(t => !t.prompt.includes('Tania') && !t.prompt.includes('opened the door')));
for (let q = 0; q < 2; q++) assert.ok(profile.tasks[q].images[0].endsWith(writing.parts[0].items[q].imageSrc));
// New question texts and extended passages must not be copied from B1+.
for (const [skill, current, old] of [
  ['reading', reading, data('exams/b1plus-reading/exam-data.js', 'examParts')],
  ['listening', listening.parts, data('exams/b1plus-listening/listening-data.js', 'listeningExam').parts]
]) {
  const oldStems = new Set(old.flatMap(p => p.items).map(i => i.stem).filter(Boolean));
  assert.ok(current.flatMap(p => p.items).filter(i => i.stem).every(i => !oldStems.has(i.stem)), `${skill}: copied B1+ question`);
}
function imageRefs(value, list = []) {
  if (Array.isArray(value)) value.forEach(v => imageRefs(v, list));
  else if (value && typeof value === 'object') Object.entries(value).forEach(([k, v]) => {
    if (['image', 'imageSrc'].includes(k)) list.push(v);
    else imageRefs(v, list);
  });
  return list;
}
for (const [skill, exam] of [['reading', reading], ['listening', listening], ['writing', writing]]) {
  for (const image of imageRefs(exam)) {
    const file = path.join(root, 'exams', `b1-${skill}`, image);
    const bytes = fs.readFileSync(file);
    assert.equal(bytes.toString('ascii', 0, 4), 'RIFF');
    assert.equal(bytes.toString('ascii', 8, 12), 'WEBP');
  }
  const html = read(`exams/b1-${skill}/index.html`);
  assert.ok(html.includes('class="brighton-exam-player"'));
  assert.ok(html.includes('exam-player.css'));
  assert.ok(!/b1plus|B1\+/.test(html));
  assert.ok(!/b1plus|B1\+/.test(read(`exams/b1-${skill}/main.js`)));
}
assert.ok(fs.statSync(path.join(root, 'exams/b1-listening/audio.mp3')).size > 1000000);
const assets = JSON.parse(read('exams/b1-assets.json'));
assert.equal(assets.assets.length, 21);
assert.equal(assets.generator, 'Built-in ImageGen');
console.log('B1 finals: all 57 objective answers, full/empty/partial grading, alternatives, original content, 4 writing tasks, 21 ImageGen assets and shared-player wiring passed.');
