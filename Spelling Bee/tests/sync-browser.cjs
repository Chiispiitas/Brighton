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
const baselineRef = process.env.BEE_BASELINE_REF;
const baselineFiles = new Map();
const mime = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.png': 'image/png', '.json': 'application/json', '.txt': 'text/plain' };
const server = http.createServer((req, res) => {
  const file = path.join(root, decodeURIComponent(new URL(req.url, 'http://localhost').pathname));
  if (!file.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
  if (baselineRef) {
    const relative = 'Spelling Bee/' + path.relative(root, file).replaceAll('\\', '/');
    if (!baselineFiles.has(file)) {
      try { baselineFiles.set(file, require('node:child_process').execFileSync('git', ['show', baselineRef + ':' + relative], { maxBuffer: 10000000 })); }
      catch { baselineFiles.set(file, null); }
    }
    const data = baselineFiles.get(file);
    res.writeHead(data ? 200 : 404, { 'Content-Type': mime[path.extname(file)] || 'application/octet-stream' });
    res.end(data || 'Not found'); return;
  }
  fs.readFile(file, (error, data) => { res.writeHead(error ? 404 : 200, { 'Content-Type': mime[path.extname(file)] || 'application/octet-stream' }); res.end(error ? 'Not found' : data); });
});
(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = process.env.BEE_BASE_URL || `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const sessions = new Map(), judges = new Map(), commands = new Map();
  const requests = [], errors = [];
  let failJudges = false, failCommands = false, holdAck = false, savedCommand = null;
  async function setup(context) {
    await context.route('https://fonts.googleapis.com/**', route => route.abort());
    await context.route('**/cms-server/_functions/**', async route => {
      const request = route.request(), url = new URL(request.url()), method = request.method();
      const endpoint = url.pathname.split('/').pop();
      const body = method === 'POST' ? request.postDataJSON() : null;
      const code = body?.sessionCode || url.searchParams.get('sessionCode');
      requests.push({ method, endpoint, code, body, at: Date.now() });
      await new Promise(resolve => setTimeout(resolve, 70)); // Model network time.
      if (method === 'POST' && ((failJudges && endpoint === 'spellingBeeJudge') || (failCommands && endpoint === 'spellingBeeCommand'))) {
        return route.fulfill({ status: 429, headers: { 'Retry-After': '2' }, json: { success: false, error: 'WDE0014: Requests per minute quota exceeded.' } });
      }
      let data;
      if (body) {
        const state = { ...body.state, updatedAt: new Date().toISOString() };
        if (endpoint === 'spellingBeeSession') { sessions.set(code, state); data = { session: state }; }
        else if (endpoint === 'spellingBeeJudge') { judges.set(code + '|' + state.actorId, state); data = { judge: state }; }
        else { commands.set(code, state); savedCommand = state; data = { command: state }; }
      } else if (endpoint === 'spellingBeeSession') data = { session: sessions.get(code) || null };
      else if (endpoint === 'spellingBeeJudge') data = { items: [...judges.values()].filter(row => row.sessionCode === code) };
      else data = { command: holdAck ? null : commands.get(code) || null };
      await route.fulfill({ json: { success: true, ...data } });
    });
    context.on('page', page => page.on('pageerror', error => errors.push(error.message)));
  }
  try {
    const host = await browser.newContext(); await setup(host);
    const presenterHost = process.env.BEE_ISOLATE_HOST ? await browser.newContext() : host;
    if (presenterHost !== host) await setup(presenterHost);
    const presenter = await presenterHost.newPage();
    await presenter.goto(base + '/index.html');
    await presenter.locator('#session-tray-toggle').click();
    await presenter.locator('#session-code-input').fill('2468');
    await presenter.locator('#session-connect').click();
    await presenter.locator('#session-status').filter({ hasText: 'synced' }).waitFor();
    await presenter.evaluate(() => {
      current = 'butterfly'; marks = Array.from(current, () => 'pending'); ptr = 0;
      wordSequence += 1; hiddenMode = true; renderWord(); requestSpellingPresenterSync();
    });
    const admin = await host.newPage();
    await admin.goto(base + '/admin.html?session=2468');
    await admin.locator('#join-session-button').click();
    await admin.locator('#director-status').filter({ hasText: 'Screen connected' }).waitFor();
    const screenCode = await admin.locator('#broadcast-code').innerText();
    const audience = await host.newPage();
    await audience.goto(base + '/screen.html?session=' + screenCode);
    await audience.locator('#broadcast[data-scene=standby]').waitFor();
    const judgePages = [];
    for (let i = 0; i < 3; i++) {
      const context = await browser.newContext(); await setup(context);
      const judge = await context.newPage(); judgePages.push(judge);
      await judge.goto(base + '/judge.html?session=2468');
      await judge.locator('#judge-name').fill('Judge ' + (i + 1));
      await judge.locator('#join-session-button').click();
      await judge.locator('#control-app:not(.hidden)').waitFor();
    }
    await admin.waitForTimeout(500);
    const from = requests.length;
    await admin.waitForTimeout(10000);
    const idle = requests.slice(from);
    if (!baselineRef) assert(idle.filter(r => r.method === 'GET').length < 100, 'Six idle views must stay under 10 reads/sec');
    if (!baselineRef) assert(idle.filter(r => r.method === 'POST').length <= 5, 'No frequent idle heartbeat writes');
    console.log('Six-view idle requests / 10 seconds:', idle.length, 'writes:', idle.filter(r => r.method === 'POST').length);

    if (baselineRef) return;
    const judge = judgePages[0], correct = judge.locator('[data-verdict=correct]');
    const bounds = await correct.boundingBox();
    await judge.mouse.move(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
    await judge.mouse.down();
    assert((await correct.getAttribute('class')).includes('button-held'));
    const pointerBeforeRelease = await judge.locator('#control-word .correct').count();
    assert.equal(pointerBeforeRelease, 0, 'Holding a button must not mark a letter');
    await judge.mouse.up();
    assert(!(await correct.getAttribute('class')).includes('button-held'));
    await judge.locator('[data-verdict=correct][data-sync=saved]').waitFor();
    assert.equal(await judge.locator('#action-status').innerText(), 'Saved');
    const burstFrom = requests.length;
    await judge.evaluate(() => { for (let i = 0; i < 5; i++) document.querySelector('[data-verdict=correct]').click(); });
    await judge.locator('[data-verdict=correct][data-sync=saved]').waitFor();
    const judgeState = [...judges.values()].find(row => row.judgeName === 'Judge 1');
    assert.equal(judgeState.pointer, 6, 'All rapid taps survive coalescing');
    await admin.locator('.admin-judge-card').filter({ hasText: 'Judge 1' }).filter({ hasText: '6/9' }).waitFor();
    assert(requests.slice(burstFrom).filter(r => r.method === 'POST' && r.endpoint === 'spellingBeeJudge').length <= 2);

    // Failure is visible, rapid further input survives, and there is no retry storm.
    failJudges = true;
    await judgePages[1].locator('[data-verdict=incorrect]').click();
    await judgePages[1].locator('[data-sync=error]').waitFor();
    assert.match(await judgePages[1].locator('#action-status').innerText(), /Not saved/);
    const failFrom = requests.length;
    await judgePages[1].locator('[data-verdict=correct]').click();
    await judgePages[1].waitForTimeout(1000);
    assert(requests.slice(failFrom).filter(r => r.method === 'POST' && r.endpoint === 'spellingBeeJudge').length <= 1);
    failJudges = false;
    await judgePages[1].locator('[data-verdict=correct][data-sync=saved]').waitFor();
    assert.equal([...judges.values()].find(row => row.judgeName === 'Judge 2').pointer, 2);

    const adminCorrect = admin.locator('[data-verdict=correct]');
    const inputAt = Date.now();
    await admin.evaluate(() => { for (let i = 0; i < 3; i++) document.querySelector('[data-verdict=correct]').click(); });
    await admin.locator('[data-verdict=correct][data-sync=saved]').waitFor();
    assert.equal(sessions.get('2468').pointer, 3);
    console.log('Admin three-letter burst confirmed by Presenter in', Date.now() - inputAt, 'ms (70 ms simulated network time per request)');
    await admin.locator('#word-visibility-button').click();
    await admin.locator('#word-visibility-button[data-sync=saved]').waitFor();
    assert.equal(sessions.get('2468').hiddenMode, false);
    failCommands = true;
    await adminCorrect.click();
    await admin.locator('[data-verdict=correct][data-sync=error]').waitFor();
    const retryFrom = requests.length;
    await admin.waitForTimeout(1000);
    assert.equal(requests.slice(retryFrom).filter(r => r.method === 'POST' && r.endpoint === 'spellingBeeCommand').length, 0, 'Admin must not retry in a hot loop');
    failCommands = false;
    await admin.locator('[data-verdict=correct][data-sync=saved]').waitFor();
    assert.equal(sessions.get('2468').pointer, 4);
    const previousToken = sessions.get('2468').wordToken;
    await admin.locator('#new-word-button').click();
    await admin.locator('#new-word-button[data-sync=saved]').waitFor();
    assert.notEqual(sessions.get('2468').wordToken, previousToken);
    await judgePages[0].waitForFunction(() => document.querySelector('#word-meta').textContent.includes('WORD COMPLETE') === false && document.querySelector('#control-word').textContent !== 'butterfly');

    // Admin confirmation requires the Presenter, not just a successful CMS write.
    await presenter.locator('#session-disconnect').click();
    const visibility = admin.locator('#word-visibility-button');
    await visibility.click();
    await admin.waitForTimeout(500);
    assert.equal(await visibility.getAttribute('data-sync'), 'saving');
    assert.match(await admin.locator('#action-status').innerText(), /Sending/);
    assert(savedCommand);
    await admin.evaluate(command => {
      const change = { sessionCode: command.sessionCode, role: 'presenter', state: { ...command, role: 'presenter', lastCommandSeq: command.commandSeq, updatedAt: new Date().toISOString() } };
      const channel = new BroadcastChannel('bee-confirmed-v1:2468'); channel.postMessage(change); channel.close();
    }, savedCommand);
    await visibility.locator('xpath=self::*[@data-sync="saved"]').waitFor();
    assert.equal(await admin.locator('#action-status').innerText(), 'Applied on presenter');
    if (screenshots) {
      await admin.screenshot({ path: path.join(screenshots, 'admin-sync-feedback.png'), fullPage: false });
      await judge.screenshot({ path: path.join(screenshots, 'judge-sync-feedback.png'), fullPage: false });
    }
    assert.deepEqual(errors, []);
    console.log('Passed: three judges, Admin, Presenter and Screen; pressed/released states, rapid taps, saved feedback, quota backoff, retry recovery and presenter acknowledgement.');
  } finally { await browser.close(); server.close(); }
})().catch(error => { console.error(error); server.close(); process.exit(1); });
