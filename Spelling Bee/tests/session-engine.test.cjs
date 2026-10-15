const { test } = require('node:test');
const assert = require('node:assert/strict');
const M = require('../js/session-engine.js');
test('new words, category changes and difficulty changes always reset to hidden', () => {
  let state = M.choose(M.seed(), ['bell', 'bike'], '4TH-5TH', 'easy', () => 0);
  for (const [level, difficulty] of [['4TH-5TH', 'easy'], ['SENIOR', 'easy'], ['SENIOR', 'hard']]) {
    const before = { ...state, hiddenMode: false, marks: state.marks.map(() => 'ok'), pointer: state.word.length };
    state = M.choose(before, ['apple', 'bridge', 'castle'], level, difficulty, () => 0);
    assert.equal(state.hiddenMode, true); assert.equal(state.pointer, 0);
    assert(state.marks.every(mark => mark === 'pending'));
    assert.notEqual(state.wordToken, before.wordToken);
    assert.equal(state.judgementRevision, 0);
  }
});
test('completed words are kept per category and difficulty across a resumed session', () => {
  let state = M.choose(M.seed(), ['bell', 'bike'], '4TH-5TH', 'easy', () => 0);
  state = M.feedback(state, 'correct');
  state = M.choose(state, ['bell', 'bike'], '4TH-5TH', 'easy', () => 0);
  assert.equal(state.word, 'bike');
  const restored = M.seed(state, 'same-device');
  assert.deepEqual(restored.usedWords['4TH-5TH|easy'], ['bell']);
  assert.equal(restored.wordToken, state.wordToken); assert.equal(restored.hiddenMode, true);
});
test('pool exhaustion and invalid settings cannot corrupt the current session', () => {
  const state = M.feedback(M.choose(M.seed(), ['bell']), 'correct');
  const before = JSON.stringify(state);
  assert.throws(() => M.choose(state, ['bell']), /No unused/);
  assert.throws(() => M.choose(state, ['bike'], 'UNKNOWN'), /valid category/);
  assert.equal(JSON.stringify(state), before);
});
test('judgement snapshots preserve undo and ignore older revisions', () => {
  const state = M.choose(M.seed(), ['bike']);
  const marked = M.judgement(state, { letterMarks: ['correct', 'incorrect', 'pending', 'pending'], pointer: 2, judgementRevision: 2 });
  const undone = M.judgement(marked, { letterMarks: ['correct', 'pending', 'pending', 'pending'], pointer: 1, judgementRevision: 3 });
  assert.deepEqual(undone.marks, ['ok', 'pending', 'pending', 'pending']);
  assert.equal(M.judgement(undone, { ...marked, letterMarks: ['correct', 'incorrect', 'pending', 'pending'] }), undone);
});
