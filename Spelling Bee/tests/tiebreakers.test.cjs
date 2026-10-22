const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path');
const M = require('../js/session-engine.js');
const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8').replace(/\r\n/g, '\n').trim();
test('Junior Tiebreaker exactly reuses Senior easy 2026; Senior uses the 69-word 2025 pool', () => {
  assert.equal(read('wordlists/JUNIOR/tiebreaker.txt'), read('wordlists/SENIOR/easy.txt'));
  assert.equal(read('word-data/JUNIOR/tiebreaker.json'), read('word-data/SENIOR/easy.json'));
  const words = read('wordlists/SENIOR/tiebreaker.txt').split('\n');
  assert.equal(words.length, 69); assert.equal(new Set(words).size, words.length);
  assert.equal(words[0], 'absolute'); assert.equal(words.at(-1), 'zealous');
  for (const level of ['JUNIOR', 'SENIOR']) {
    const words = read(`wordlists/${level}/tiebreaker.txt`).split('\n'), data = JSON.parse(read(`word-data/${level}/tiebreaker.json`));
    assert(words.every(word => data[word]?.definition && data[word]?.example));
    const state = M.choose(M.seed(), words, level, 'tiebreaker'); assert.equal(state.difficulty, 'tiebreaker'); assert(words.includes(state.word));
    assert.throws(() => M.choose(M.seed(), words, '4TH-5TH', 'tiebreaker'), /Junior and Senior/);
  }
});
