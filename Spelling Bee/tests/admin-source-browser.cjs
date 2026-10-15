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
  const sim = require('./wix-simulator.cjs')();
  const writes = [], errors = [];
  let failAdmin = false;
  const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
  const saved = code => {
    const row = [...(sim.collections.get('SpellingBeeSessions')?.values() || [])].find(row => row.sessionCode === code);
    return row ? JSON.parse(row.presenterStateJson) : null;
  };
  const until = async predicate => { const end = Date.now() + 20000; while (Date.now() < end) { if (await predicate()) return; await pause(80); } throw new Error('Condition did not become true'); };
  async function page(name) {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
    await context.route('https://fonts.googleapis.com/**', route => route.abort());
    await context.route('**/cms-server/_functions/**', async route => {
      const req = route.request(), url = new URL(req.url()), endpoint = url.pathname.split('/').pop();
      const body = req.method() === 'POST' ? req.postDataJSON() : null;
      const code = body?.sessionCode || url.searchParams.get('sessionCode');
      if (body) writes.push({ name, endpoint, body });
      await pause(40);
      if (failAdmin && body?.state.sourceRole === 'admin') return route.fulfill({ status: 500, headers: { 'Retry-After': '2' }, json: { success: false, error: 'WDE0014: Requests per minute quota exceeded.' } });
      await route.fulfill(await sim.request(endpoint, req.method(), code, body));
    });
    const page = await context.newPage(); page.on('pageerror', error => errors.push(name + ': ' + error.message));
    return page;
  }
  async function hidden(admin, code) {
    await until(async () => saved(code)?.hiddenMode === true && await admin.locator('#control-word').getAttribute('data-mode') === 'hidden');
    assert(!/[A-Za-z]/.test(await admin.locator('#control-word').textContent()), 'new words must be masked in Admin');
  }
  try {
    const admin = await page('admin');
    await admin.goto(base + '/admin.html?session=8642');
    await admin.locator('#start-admin-session').click();
    await admin.locator('#source-status').filter({ hasText: 'Admin is running' }).waitFor();
    await admin.locator('#director-status').filter({ hasText: 'Screen connected' }).waitFor();
    assert.equal(saved('8642').sourceRole, 'admin'); await hidden(admin, '8642');
    const judges = [];
    for (let i = 0; i < 3; i++) {
      const judge = await page('judge' + i); judges.push(judge);
      await judge.goto(base + '/judge.html?session=8642'); await judge.locator('#judge-name').fill('Independent judge ' + i);
      await judge.locator('#join-session-button').click(); await judge.locator('#control-app:not(.hidden)').waitFor();
      assert.equal(await judge.locator('#control-word').textContent(), saved('8642').word);
    }
    const firstToken = saved('8642').wordToken;
    await admin.locator('#word-visibility-button').click(); await admin.locator('#word-visibility-button[data-sync=saved]').waitFor();
    assert.equal(await admin.locator('#control-word').textContent(), saved('8642').word);
    await admin.locator('#new-word-button').click(); await admin.locator('#new-word-button[data-sync=saved]').waitFor();
    assert.notEqual(saved('8642').wordToken, firstToken); await hidden(admin, '8642');
    await admin.locator('#word-visibility-button').click(); await admin.locator('#word-visibility-button[data-sync=saved]').waitFor();
    await admin.locator('#admin-category').selectOption('SENIOR');
    await until(() => saved('8642').level === 'SENIOR'); await hidden(admin, '8642');
    for (const difficulty of ['medium', 'hard', 'easy', 'hard']) {
      await admin.locator('#word-visibility-button').click(); await admin.locator('#word-visibility-button[data-sync=saved]').waitFor();
      await admin.locator(`[data-difficulty=${difficulty}]`).click(); await admin.locator(`[data-difficulty=${difficulty}][data-sync=saved]`).waitFor();
      assert.equal(saved('8642').difficulty, difficulty); await hidden(admin, '8642');
      const words = fs.readFileSync(path.join(root, 'wordlists/SENIOR/' + difficulty + '.txt'), 'utf8').split(/\r?\n/).map(word => word.trim());
      assert(words.includes(saved('8642').word));
    }
    assert.equal(writes.filter(write => write.endpoint === 'spellingBeeCommand').length, 0, 'standalone Admin needs no remote-command writes');
    const study = await page('study');
    await study.goto(base + '/index.html?session=8642'); await study.locator('#session-status').filter({ hasText: 'Following Admin' }).waitFor();
    const beforeStudy = saved('8642').wordToken;
    assert.equal(writes.filter(write => write.name === 'study').length, 0);
    assert.equal(await study.locator('#next-word').isDisabled(), true);
    await admin.locator('#word-visibility-button').click(); await admin.locator('#word-visibility-button[data-sync=saved]').waitFor();
    await until(async () => await study.locator('#word').getAttribute('data-mode') === 'normal');
    assert.equal(await study.locator('#word').textContent(), saved('8642').word);
    await admin.locator('#new-word-button').click(); await admin.locator('#new-word-button[data-sync=saved]').waitFor(); await hidden(admin, '8642');
    await until(async () => await study.locator('#word').getAttribute('data-mode') === 'hidden');
    assert(!/[A-Za-z]/.test(await study.locator('#word').textContent()));
    assert.notEqual(saved('8642').wordToken, beforeStudy);
    await admin.evaluate(() => {
      for (let i = 0; i < 3; i++) document.querySelector('[data-verdict=correct]').click();
      document.getElementById('undo-letter-button').click(); document.querySelector('[data-verdict=incorrect]').click();
    });
    await until(() => saved('8642').pointer === 3 && saved('8642').marks[2] === 'err');
    assert.deepEqual(saved('8642').marks.slice(0, 3), ['ok', 'ok', 'err']);
    failAdmin = true; await admin.locator('[data-verdict=correct]').click();
    await admin.locator('[data-verdict=correct][data-sync=error]').waitFor();
    await admin.locator('[data-verdict=correct]').click(); failAdmin = false;
    await until(() => saved('8642').pointer === 5);
    await admin.locator('[data-verdict=correct][data-sync=saved]').waitFor();
    const audience = await page('audience');
    const screenCode = await admin.locator('#broadcast-code').innerText();
    await audience.goto(base + '/screen.html?session=' + screenCode);
    await admin.locator('[data-scene=result]').click(); await admin.locator('#screen-take').click();
    await admin.locator('#director-status').filter({ hasText: 'Scene is live' }).waitFor();
    await audience.locator('#broadcast[data-scene=result]').waitFor();
    await admin.locator('#presenter-correct').click(); await admin.locator('#presenter-correct[data-sync=saved]').waitFor();
    await audience.locator('.scene-fit:not(.scene-outgoing) .result-label').filter({ hasText: /^Correct$/ }).waitFor();
    const completedWord = saved('8642').word;
    await admin.locator('#new-word-button').click(); await admin.locator('#new-word-button[data-sync=saved]').waitFor(); await hidden(admin, '8642');
    assert(saved('8642').usedWords['SENIOR|hard'].includes(completedWord));
    const resumedToken = saved('8642').wordToken;
    await admin.reload(); await admin.locator('#join-session-button').click();
    await admin.locator('#source-status').filter({ hasText: 'Admin is running' }).waitFor();
    assert.equal(saved('8642').wordToken, resumedToken); assert(saved('8642').usedWords['SENIOR|hard'].includes(completedWord));
    await hidden(admin, '8642');
    assert.equal(writes.filter(write => write.name === 'study').length, 0, 'Study never publishes over an Admin-owned session');
    if (screenshots) await admin.screenshot({ path: path.join(screenshots, 'independent-admin.png'), fullPage: false });
    // Older Study-created sessions remain connected; category changes hide too.
    const legacyStudy = await page('legacyStudy'); await legacyStudy.goto(base + '/index.html');
    await legacyStudy.locator('#session-tray-toggle').click(); await legacyStudy.locator('#session-code-input').fill('4680');
    await legacyStudy.locator('#session-connect').click(); await legacyStudy.locator('#session-status').filter({ hasText: 'synced' }).waitFor();
    await legacyStudy.locator('#next-word').click(); await until(() => Boolean(saved('4680')?.word));
    const legacyAdmin = await page('legacyAdmin'); await legacyAdmin.goto(base + '/admin.html?session=4680');
    await legacyAdmin.locator('#join-session-button').click(); await legacyAdmin.locator('#source-status').filter({ hasText: 'Connected to Study' }).waitFor();
    await legacyAdmin.locator('#word-visibility-button').click(); await until(() => saved('4680').hiddenMode === false);
    await legacyAdmin.locator('#admin-category').selectOption('6TH-7TH');
    await until(() => saved('4680').level === '6TH-7TH' && saved('4680').hiddenMode === true); await hidden(legacyAdmin, '4680');
    await legacyAdmin.locator('#admin-take-source').click();
    await legacyAdmin.locator('#source-status').filter({ hasText: 'Admin is running' }).waitFor();
    await legacyStudy.locator('#session-status').filter({ hasText: 'Following Admin' }).waitFor();
    const studyWrites = writes.filter(write => write.name === 'legacyStudy').length;
    await legacyAdmin.locator('#new-word-button').click(); await legacyAdmin.locator('#new-word-button[data-sync=saved]').waitFor();
    await hidden(legacyAdmin, '4680'); await pause(2000);
    assert.equal(writes.filter(write => write.name === 'legacyStudy').length, studyWrites);
    assert.equal(saved('4680').sourceRole, 'admin');
    assert.deepEqual(errors, []);
    console.log('Passed: independent Admin without Study; categories/difficulties always hidden; three judges; Study follows without writes; marks/undo; retry; result broadcast; reload/used pools; existing Study connection and takeover.');
  } finally { await browser.close(); server.close(); }
})().catch(error => { console.error(error); server.close(); process.exit(1); });
