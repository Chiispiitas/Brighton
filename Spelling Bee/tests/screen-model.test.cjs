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
test('remaining lives are optional and distinguish zero from missing values', () => {
  const old = M.normalize({ contestants: [{ name: 'Legacy contestant' }] });
  assert.equal(old.showLives, false); assert.equal(old.contestants[0].lives, null);
  const state = M.normalize({ showLives: true, contestants: [
    { name: 'Zero', lives: 0 }, { name: 'Blank', lives: '' },
    { name: 'One', lives: 1 }, { name: 'Too large', lives: 1000 },
    { name: 'Invalid', lives: 'unknown' }, { name: 'Fraction', lives: 2.8 }
  ] });
  assert.equal(state.showLives, true);
  assert.deepEqual(state.contestants.map(row => row.lives), [0, null, 1, 99, null, 2]);
});

test('contestant loops advance the round only when wrapping and skip completed rows', () => {
  const state = { ...M.initial(), contestants: [
    { id: 'a', name: 'A', status: 'active' }, { id: 'b', name: 'B', status: 'eliminated' },
    { id: 'c', name: 'C', status: 'finalist' }
  ] };
  assert.deepEqual(M.nextContestant(state), { currentId: 'a', round: 'Round 1', wrapped: false });
  state.currentId = 'a';
  assert.deepEqual(M.nextContestant(state), { currentId: 'c', round: 'Round 1', wrapped: false });
  state.currentId = 'c';
  assert.deepEqual(M.nextContestant(state), { currentId: 'a', round: 'Round 2', wrapped: true });
  state.currentId = 'b';
  assert.equal(M.nextContestant(state).currentId, 'c');
  state.currentId = 'c'; state.contestants[2].status = 'eliminated';
  assert.equal(M.nextContestant(state).round, 'Round 2');
  state.round = 'Ronda 9'; assert.equal(M.nextContestant(state).round, 'Ronda 10');
  state.round = 'Final'; assert.equal(M.nextContestant(state).round, 'Final 2');
  state.contestants = [state.contestants[0]]; state.currentId = 'a';
  assert.deepEqual(M.nextContestant(state), { currentId: 'a', round: 'Final 2', wrapped: true });
  state.contestants = []; assert.equal(M.nextContestant(state), null);
});
