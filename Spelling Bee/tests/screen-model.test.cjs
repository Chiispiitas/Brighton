const { test } = require('node:test');
const assert = require('node:assert/strict');
const M = require('../js/screen-model.js');

test('audience contract strips private presenter data and unrevealed spelling', () => {
  const raw = { ...M.initial(), word: 'secret', wordToken: '1:secret', hiddenMode: false,
    scene: 'spelling', revealWord: 'secret', judges: [{ name: 'private' }] };
  const state = M.normalize(raw);
  assert.equal(state.revealWord, '');
  assert.equal(JSON.stringify(state).includes('secret'), false);
  assert.equal('judges' in state, false);
  assert.equal(M.normalize({ ...raw, scene: 'result' }).revealWord, 'secret');
});
test('word masking handles capitalization and regular expression punctuation', () => {
  assert.equal(M.maskWord('Courage takes courage.', 'courage').includes('courage'), false);
  assert.equal(M.maskWord('a.b is an example of a.b', 'a.b').includes('a.b'), false);
  assert.equal(M.maskWord('Use [word] here', '[word]').includes('[word]'), false);
});
test('timer expires without declaring a result or changing scene', () => {
  const state = M.normalize({ ...M.initial(), scene: 'spelling', timer: { running: true, endsAt: 1000 } });
  assert.equal(M.remaining(state.timer, 2000), 0);
  assert.equal(state.scene, 'spelling'); assert.equal(state.result, 'pending');
  assert.equal(M.remaining({ running: false, remaining: 13 }, 99999), 13);
});
test('rosters accept spreadsheet tabs and pipe separated data with stable identity', () => {
  const rows = M.parseRoster('Ana | Grade 5 | 17\nJosé\tGrade 6\t18');
  assert.equal(rows.length, 2); assert.equal(rows[0].number, '17');
  assert.equal(rows[1].name, 'José'); assert.notEqual(rows[0].id, rows[1].id);
  assert.throws(() => M.parseRoster(' | Grade 5 | 1'));
  assert.throws(() => M.parseRoster('New', Array(200).fill({})));
});
test('broadcast session keys are deterministic numeric keys independent of presenter codes', async () => {
  const first = await M.broadcastCode('1234');
  assert.match(first, /^98\d{18}$/); assert.equal(first, await M.broadcastCode('1234'));
  assert.notEqual(first, await M.broadcastCode('1235'));
});
