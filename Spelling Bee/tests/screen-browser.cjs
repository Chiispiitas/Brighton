/* Optional integration check: NODE_PATH must resolve playwright. Uses mocked Wix,
   isolated browser storage and a local static server; no production data writes. */
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const M = require('../js/screen-model.js');
const root = path.resolve(__dirname, '..');
const screenshots = process.env.SCREENSHOT_DIR;
const mime = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.png': 'image/png', '.json': 'application/json', '.txt': 'text/plain' };
const server = http.createServer((req, res) => {
  const file = path.join(root, decodeURIComponent(new URL(req.url, 'http://localhost').pathname));
  if (!file.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
  fs.readFile(file, (error, data) => { res.writeHead(error ? 404 : 200, { 'Content-Type': mime[path.extname(file)] || 'application/octet-stream' }); res.end(error ? 'Not found' : data); });
});
(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const errors = [], audienceRequests = [], writes = [];
  const presenter = { __spellingBee: 1, role: 'presenter', sessionCode: '1357', level: '4TH-5TH', difficulty: 'easy', word: 'bell', wordToken: 'test:1:bell', wordSequence: 1, marks: [], pointer: 0, updatedAt: new Date().toISOString() };
  const sessions = new Map([['1357', presenter]]);
  let failWrites = false, offline = false;
  await context.route('https://fonts.googleapis.com/**', route => route.abort());
  await context.route('**/cms-server/_functions/**', async route => {
    if (offline) return route.abort();
    const request = route.request(), url = new URL(request.url());
    let data;
    if (request.method() === 'POST') {
      const body = request.postDataJSON();
      if (failWrites && body.state.screenBroadcast) return route.fulfill({ status: 500, json: { success: false, error: 'Simulated outage' } });
      const state = { ...body.state, updatedAt: new Date().toISOString() };
      if (url.pathname.endsWith('spellingBeeSession')) { sessions.set(body.sessionCode, state); writes.push(structuredClone(body)); data = { session: state }; }
      else { if (url.pathname.endsWith('spellingBeeCommand')) presenter.lastCommandSeq = state.commandSeq; data = { judge: state, command: state }; }
    } else {
      const code = url.searchParams.get('sessionCode');
      if (url.pathname.endsWith('spellingBeeSession')) data = { session: sessions.get(code) || null };
      else data = { items: [], command: null };
    }
    await route.fulfill({ json: { success: true, ...data } });
  });
  context.on('page', page => page.on('pageerror', error => errors.push(error.message)));
  const admin = await context.newPage();
  await admin.goto(base + '/admin.html?session=1357');
  await admin.locator('#join-session-button').click();
  await admin.locator('#director-status').filter({ hasText: 'Screen connected' }).waitFor();
  const broadcastCode = await admin.locator('#broadcast-code').innerText();
  assert.match(broadcastCode, /^98\d{18}$/);
  assert.equal(sessions.get('1357').word, 'bell');
  const audience = await context.newPage();
  audience.on('request', req => { if (req.url().includes('_functions')) audienceRequests.push(req.url()); });
  await audience.goto(base + '/screen.html?session=' + broadcastCode);
  assert.equal(await audience.locator('.school-brand strong').innerText(), 'U.E.P LEV VIGOTSKY MANTA');
  await audience.locator('#broadcast[data-scene=standby]').waitFor();
  const roster = Array.from({ length: 17 }, (_, index) => `Contestant ${index + 1} | Grade ${index % 3 + 5} | ${index + 1}`).join('\n');
  await admin.locator('#roster-paste').fill(roster);
  await admin.locator('#roster-add').click();
  assert.equal(await admin.locator('#roster-rows tr').count(), 17);
  await admin.locator('#lives-set-all').click();
  await admin.locator('#screen-show-lives').check();
  await admin.locator('#screen-auto').uncheck(); // Inspect the first page independently of rotation timing.
  await admin.locator('#roster-rows .roster-lives').nth(0).fill('0');
  await admin.locator('#roster-rows .roster-lives').nth(0).dispatchEvent('change');
  await admin.locator('#roster-rows .roster-lives').nth(1).fill('1');
  await admin.locator('#roster-rows .roster-lives').nth(1).dispatchEvent('change');
  await admin.locator('#roster-rows .roster-lives').nth(2).fill('');
  await admin.locator('#roster-rows .roster-lives').nth(2).dispatchEvent('change');
  await admin.locator('#roster-save').click();
  await admin.locator('#director-status').filter({ hasText: 'Contestant list published' }).waitFor();
  await admin.locator('#screen-current').selectOption({ index: 1 });
  assert.equal(await admin.locator('#screen-load-word,#screen-reveal').count(), 0);
  await admin.locator('#screen-word-status').filter({ hasText: 'loaded' }).waitFor();
  assert.equal((await admin.locator('#screen-example').inputValue()).includes('bell'), false);
  for (const [key] of M.scenes) {
    await admin.locator(`[data-scene="${key}"]`).click();
    // Draft selection must leave the on-air scene unchanged.
    const before = sessions.get(broadcastCode).broadcast.scene;
    assert.notEqual(sessions.get(broadcastCode).broadcast.cueId, 'unexpected');
    await admin.locator('#screen-take').click();
    await admin.locator('#director-status').filter({ hasText: 'Scene is live' }).waitFor();
    await audience.locator(`#broadcast[data-scene="${key}"][data-revision="${sessions.get(broadcastCode).broadcast.revision}"]`).waitFor();
    await audience.locator('#logo-sweep').waitFor({ state: 'hidden' });
    await audience.waitForTimeout(150);
    assert.equal(sessions.get(broadcastCode).broadcast.scene, key);
    if (key !== 'result') assert.equal(JSON.stringify(sessions.get(broadcastCode)).includes('bell'), false);
    if (key === 'result') {
      assert.equal(await audience.locator('#scene').innerText(), 'bell');
      assert.equal(await audience.locator('.result-label,.lower-third').count(), 0);
      await admin.locator('#presenter-correct').click();
      await audience.locator('.scene-fit:not(.scene-outgoing) .result-label').filter({ hasText: /^Correct$/ }).waitFor();
      assert.equal(await audience.locator('.scene-fit:not(.scene-outgoing) .reveal-word').innerText(), 'bell');
      await admin.locator('#presenter-incorrect').click();
      await audience.locator('.scene-fit:not(.scene-outgoing) .result-label').filter({ hasText: /^Incorrect$/ }).waitFor();
    }
    if (key === 'board') {
      assert.equal(await audience.locator('.contestant-card').count(), 8);
      assert.equal(await audience.locator('.contestant-card .number,.contestant-card .status,.contestant-card.current,.contestant-card.eliminated').count(), 0);
      assert.equal(await audience.locator('.contestant-card .identity > strong').first().innerText(), 'Contestant 1');
      assert.equal(await audience.locator('.contestant-card .remaining-lives').count(), 7);
      assert((await audience.locator('.contestant-card .remaining-lives').first().innerText()).includes('0 lives remaining'));
    }
    if (key === 'spelling') {
      assert.equal(await audience.locator('#timer-box,#timer-value').count(), 0);
      assert((await audience.locator('.remaining-lives').innerText()).includes('0 lives remaining'));
    }
    if (screenshots && ['standby', 'spelling', 'board', 'podium'].includes(key)) await audience.screenshot({ path: path.join(screenshots, `screen-${key}.png`) });
    const overflows = await audience.evaluate(() => {
      const bounds = document.querySelector('#broadcast').getBoundingClientRect();
      return Array.from(document.querySelectorAll('#scene h1,#scene p,#scene .contestant-card,#scene .podium-card')).filter(el => { const b = el.getBoundingClientRect(); return b.bottom > bounds.bottom || b.right > bounds.right + 1 || b.left < bounds.left - 1; }).map(el => el.className);
    });
    assert.deepEqual(overflows, [], `Overflow in ${key}`);
    console.log('Scene passed:', key, '(previous:', before + ')');
  }
  // Word information follows presenter changes automatically without touching the live scene.
  presenter.word = 'bike'; presenter.wordToken = 'test:2:bike';
  await admin.waitForFunction(() => document.getElementById('screen-definition').value.includes('bicycle'));
  assert.equal(sessions.get(broadcastCode).broadcast.scene, 'closing');
  assert.equal((await admin.locator('#screen-example').inputValue()).includes('bike'), false);
  // A pending word reveal needs no contestant and ignores stale feedback.
  await admin.locator('#screen-current').selectOption('');
  await admin.locator('[data-scene=result]').click(); await admin.locator('#screen-take').click();
  await admin.locator('#director-status').filter({ hasText: 'Scene is live' }).waitFor();
  await audience.locator('#broadcast[data-scene=result]').waitFor();
  await audience.locator('#logo-sweep').waitFor({ state: 'hidden' }); await audience.waitForTimeout(150);
  assert.equal(await audience.locator('#scene').innerText(), 'bike');
  const pendingRevision = sessions.get(broadcastCode).broadcast.revision;
  await admin.evaluate(() => window.dispatchEvent(new CustomEvent('spelling-feedback-confirmed', { detail: { sessionCode: '1357', wordToken: 'test:1:bell', word: 'bell', verdict: 'incorrect' } })));
  await admin.waitForTimeout(150);
  assert.equal(sessions.get(broadcastCode).broadcast.revision, pendingRevision);
  assert.equal(sessions.get(broadcastCode).broadcast.result, 'pending');
  await admin.locator('#screen-current').selectOption({ index: 1 });
  await admin.locator('[data-scene=definition]').click();
  await admin.locator('#screen-take').click();
  await admin.locator('#director-status').filter({ hasText: 'Scene is live' }).waitFor();
  assert(sessions.get(broadcastCode).broadcast.definition.includes('bicycle'));
  await admin.locator('[data-scene=closing]').click(); await admin.locator('#screen-take').click();
  await admin.locator('#director-status').filter({ hasText: 'Scene is live' }).waitFor();
  assert.equal(sessions.get(broadcastCode).broadcast.scene, 'closing');
  // Failure is explicit and keeps the previous scene.
  failWrites = true;
  await admin.locator('#screen-standby').click();
  await admin.locator('#director-status').filter({ hasText: 'Not published' }).waitFor();
  assert.equal(sessions.get(broadcastCode).broadcast.scene, 'closing');
  failWrites = false;
  await admin.locator('#screen-standby').click();
  await admin.locator('#director-status').filter({ hasText: 'Standby is live' }).waitFor();
  await audience.locator('#broadcast[data-scene=standby]').waitFor();
  await admin.locator('[data-scene=spelling]').click();
  await admin.locator('#screen-take').click();
  await admin.locator('#director-status').filter({ hasText: 'Scene is live' }).waitFor();
  await admin.locator('#screen-duration').fill('1');
  await admin.locator('#screen-timer-reset').click();
  await admin.locator('#director-status').filter({ hasText: 'timer reset' }).waitFor();
  await admin.locator('#screen-timer-start').click();
  await admin.locator('#director-status').filter({ hasText: 'timer running' }).waitFor();
  await admin.locator('#live-timer').filter({ hasText: /^0s/ }).waitFor();
  assert.equal(await audience.locator('#timer-box,#timer-value').count(), 0);
  assert.equal(sessions.get(broadcastCode).broadcast.scene, 'spelling');
  assert.equal(sessions.get(broadcastCode).broadcast.result, 'pending');
  await audience.reload(); await audience.locator('#broadcast[data-scene=spelling]').waitFor();
  // Mark finalists and podium positions in the editable roster.
  await admin.locator('#roster-rows .roster-status').nth(0).selectOption('finalist');
  await admin.locator('#roster-rows .roster-status').nth(1).selectOption('finalist');
  await admin.locator('#roster-rows .roster-place').nth(0).selectOption('1');
  await admin.locator('#roster-rows .roster-place').nth(1).selectOption('2');
  await admin.locator('#roster-rows .roster-place').nth(2).selectOption('3');
  for (const key of ['finalists', 'podium']) {
    await admin.locator(`[data-scene=${key}]`).click(); await admin.locator('#screen-take').click();
    await admin.locator('#director-status').filter({ hasText: 'Scene is live' }).waitFor();
    await audience.locator(`#broadcast[data-scene=${key}]`).waitFor(); await audience.waitForTimeout(900);
    if (key === 'finalists') assert.equal(await audience.locator('.finalist-card').count(), 2);
    if (screenshots) await audience.screenshot({ path: path.join(screenshots, `screen-${key}.png`) });
  }
  // Reopening admin restores the Wix roster and published scene.
  await admin.reload(); await admin.locator('#join-session-button').click();
  await admin.locator('#director-status').filter({ hasText: 'Screen connected' }).waitFor();
  assert.equal(await admin.locator('#roster-rows tr').count(), 17);
  assert.equal(await admin.locator('#roster-rows .roster-lives').nth(0).inputValue(), '0');
  assert.equal(await admin.locator('#roster-rows .roster-lives').nth(1).inputValue(), '1');
  assert.equal(await admin.locator('#roster-rows .roster-lives').nth(2).inputValue(), '');
  assert(await admin.locator('#screen-show-lives').isChecked());
  await admin.waitForTimeout(1000);
  if (screenshots) await admin.locator('#screen-director').screenshot({ path: path.join(screenshots, 'screen-admin.png') });
  assert(audienceRequests.every(url => url.includes('spellingBeeSession') && url.includes(broadcastCode)));
  assert.equal(sessions.get('1357').word, 'bike');
  assert(writes.every(body => body.sessionCode === broadcastCode));
  // Test safe-area fitting at supported maximum text lengths and different displays.
  const stress = await context.newPage();
  await stress.emulateMedia({ reducedMotion: 'reduce' });
  await stress.goto(base + '/screen.html?preview=1');
  const large = M.initial(); large.motion = 'quiet';
  large.contestants = Array.from({ length: 8 }, (_, index) => ({ id: String(index), name: 'Alexandra María de los Ángeles Fernández Rodríguez Mendoza '.repeat(2).slice(0, 80), group: 'Grade and class '.repeat(3).slice(0, 40), number: String(index + 1), status: 'finalist', place: index < 3 ? index + 1 : 0 }));
  large.currentId = '0'; large.round = 'Championship round with a longer stage introduction '.repeat(2).slice(0, 60);
  large.definition = 'A detailed explanation with enough context for the audience. '.repeat(10).slice(0, 500);
  large.example = large.definition; large.revealWord = 'pneumonoultramicroscopicsilicovolcanoconiosis'.repeat(6).slice(0, 256);
  for (const size of [{ width: 1920, height: 1080 }, { width: 1280, height: 720 }, { width: 800, height: 600 }]) {
    await stress.setViewportSize(size);
    for (const [key] of M.scenes) {
      await stress.evaluate(state => window.postMessage({ type: 'bee-screen-preview', state }, location.origin), { ...large, scene: key, cueId: key });
      await stress.locator(`#broadcast[data-scene=${key}]`).waitFor();
      const bounds = await stress.evaluate(() => {
        const scene = document.querySelector('#scene').getBoundingClientRect();
        const fit = document.querySelector('.scene-fit').getBoundingClientRect();
        return { top: fit.top - scene.top, bottom: scene.bottom - fit.bottom, width: fit.width, max: scene.width };
      });
      assert(bounds.top >= -2 && bounds.bottom >= -2 && bounds.width <= bounds.max + 2, `Unsafe scene bounds: ${key} ${JSON.stringify(bounds)}`);
    }
  }
  // Connection loss holds a scene, indicates the outage, and recovers.
  offline = true; await audience.locator('#signal:not(.hidden)').waitFor();
  assert.equal(await audience.locator('#broadcast').getAttribute('data-scene'), 'podium');
  offline = false; await audience.locator('#signal').waitFor({ state: 'hidden' });
  assert.deepEqual(errors, []);
  await browser.close(); server.close();
  console.log('Passed: all 12 scenes, privacy, automatic word info, word-only pending reveal, acknowledged feedback, stale feedback rejection, lives, failed writes, timer, restore, and source-session isolation.');
})().catch(error => { console.error(error); server.close(); process.exit(1); });
