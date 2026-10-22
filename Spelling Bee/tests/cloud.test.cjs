const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const source = fs.readFileSync(require('node:path').join(__dirname, '../js/cloud.js'), 'utf8');
function fixture(handler) {
  let now = Date.now();
  const sent = [], calls = [];
  class Clock extends Date { static now() { return now; } }
  class Channel { addEventListener() {} postMessage(value) { sent.push(value); } }
  const window = { setTimeout, clearTimeout };
  vm.runInNewContext(source, { window, Date: Clock, AbortController, BroadcastChannel: Channel,
    fetch: async (...args) => { calls.push(args); return handler(...args); } });
  return { cloud: window.SpellingCloud, calls, sent, advance: ms => { now += ms; } };
}
const response = (data, status = 200, retryAfter = null) => ({ ok: status < 400, status,
  headers: { get: () => retryAfter }, json: async () => data });
test('Tiebreaker survives a legacy CMS difficulty index on reads, writes and confirmed messages', async () => {
  const f = fixture((url, options) => response({ session: { role: 'presenter', sessionCode: '1234', difficulty: 'easy', poolDifficulty: 'tiebreaker', ...(options.method === 'POST' ? { word: JSON.parse(options.body).state.word } : {}) } }));
  assert.equal((await f.cloud.fetchPresenter('1234')).difficulty, 'tiebreaker');
  const saved = await f.cloud.writeState({ sessionCode: '1234', role: 'presenter', state: { difficulty: 'tiebreaker', word: 'absolute' } });
  assert.equal(JSON.parse(f.calls[1][1].body).state.poolDifficulty, 'tiebreaker');
  assert.equal(saved.session.difficulty, 'tiebreaker'); assert.equal(f.sent[0].state.difficulty, 'tiebreaker');
});
test('overlapping readers share a request; successful writes invalidate read cache', async () => {
  let finish;
  const f = fixture((url, options) => options.method === 'POST'
    ? response({ session: { role: 'presenter', sessionCode: '1234' } })
    : new Promise(resolve => { finish = () => resolve(response({ session: { role: 'presenter', sessionCode: '1234' } })); }));
  const first = f.cloud.fetchPresenter('1234'), second = f.cloud.fetchPresenter('1234');
  assert.equal(f.calls.length, 1);
  finish(); await Promise.all([first, second]);
  await f.cloud.fetchPresenter('1234'); assert.equal(f.calls.length, 1);
  await f.cloud.writeState({ sessionCode: '1234', role: 'presenter' });
  assert.equal(f.sent.length, 1);
  const read = f.cloud.fetchPresenter('1234'); assert.equal(f.calls.length, 3);
  finish(); await read;
});
test('429 pauses background traffic and honors Retry-After', async () => {
  let limited = true;
  const f = fixture(() => limited ? response({ error: 'Too many requests' }, 429, '5') : response({ session: null }));
  await assert.rejects(f.cloud.fetchPresenter('1234'), /Too many/);
  await assert.rejects(f.cloud.fetchCommand('1234'), /cooling down/);
  assert.equal(f.calls.length, 1); assert(f.cloud.pollDelay(450) >= 5000);
  f.advance(5001); limited = false;
  await f.cloud.fetchPresenter('1234'); assert.equal(f.calls.length, 2);
});
test('Wix quota errors wrapped in HTTP 500 also back off; failed writes never broadcast', async () => {
  const f = fixture(() => response({ success: false, error: 'WDE0014: Requests per minute quota exceeded.' }, 500));
  await assert.rejects(f.cloud.writeState({ sessionCode: '1234', role: 'judge' }), /WDE0014/);
  assert.equal(f.sent.length, 0);
  await assert.rejects(f.cloud.fetchPresenter('1234'), /cooling down/);
  assert.equal(f.calls.length, 1);
});
test('judges can join without fetching the command collection', async () => {
  const f = fixture(() => response({ session: null, items: [] }));
  await f.cloud.fetchRows('1234', { command: false });
  assert.equal(f.calls.length, 2);
  assert(f.calls.every(([url]) => !url.includes('spellingBeeCommand')));
});

test('a successful HTTP response without the saved state cannot report success', async () => {
  const f = fixture(() => response({ success: true }));
  await assert.rejects(f.cloud.writeState({ sessionCode: '1234', role: 'judge' }), /did not confirm/);
  assert.equal(f.sent.length, 0);
});

test('successful background reads cannot reset repeated write-quota backoff', async () => {
  const f = fixture((url, options) => options.method === 'POST'
    ? response({ success: false, error: 'WDE0014: Requests per minute quota exceeded.' }, 500)
    : response({ session: null }));
  await assert.rejects(f.cloud.writeState({ sessionCode: '1234', role: 'judge' }), /WDE0014/);
  f.advance(2001); await f.cloud.fetchPresenter('1234');
  await assert.rejects(f.cloud.writeState({ sessionCode: '1234', role: 'judge' }), /WDE0014/);
  assert(f.cloud.pollDelay(450) >= 4000, 'second quota failure must back off longer despite successful reads');
  f.advance(4001); await f.cloud.fetchPresenter('1234');
  await assert.rejects(f.cloud.writeState({ sessionCode: '1234', role: 'judge' }), /WDE0014/);
  assert(f.cloud.pollDelay(450) >= 8000);
});
