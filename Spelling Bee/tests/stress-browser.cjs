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
  const createSimulator = require('./wix-simulator.cjs');
  const sim = createSimulator({ readLimit: 1000, writeLimit: 60 });
  const judgeCount = Number(process.env.BEE_STRESS_JUDGES || 12);
  const report = { baseline: baselineRef || null, judgeCount, audienceScreens: 3, scenarios: [] };
  const requests = [], errors = [], checks = [];
  let delayMs = Number(process.env.BEE_STRESS_LATENCY || 90), blockCommandsUntil = 0, offlineUntil = 0, loseNextJudgeReply = false, staleForAdmin = null, writeBlockedUntil = 0;
  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
  const until = async (predicate, timeout = 15000) => {
    const end = Date.now() + timeout;
    while (Date.now() < end) { if (await predicate()) return true; await sleep(100); }
    return false;
  };
  const state = () => {
    const row = [...(sim.collections.get('SpellingBeeSessions')?.values() || [])].find(row => row.sessionCode === '9753108642');
    return row ? { ...row, ...JSON.parse(row.presenterStateJson) } : null;
  };
  const votes = () => [...(sim.collections.get('SpellingBeeJudges')?.values() || [])].map(row => JSON.parse(row.judgeStateJson));
  function check(name, ok, details = {}) { checks.push({ name, ok, ...details }); console.log(JSON.stringify(checks.at(-1))); }
  async function page(name) {
    const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    await context.addInitScript(() => { window.BroadcastChannel = undefined; }); // Independent devices, including fallback browsers.
    await context.route('https://fonts.googleapis.com/**', route => route.abort());
    await context.route('**/cms-server/_functions/**', async route => {
      const req = route.request(), url = new URL(req.url()), endpoint = url.pathname.split('/').pop();
      const body = req.method() === 'POST' ? req.postDataJSON() : null;
      const code = body?.sessionCode || url.searchParams.get('sessionCode');
      const record = { name, endpoint, method: req.method(), at: Date.now(), body };
      requests.push(record);
      await sleep(delayMs);
      if (Date.now() < offlineUntil) { record.status = 'offline'; return route.abort(); }
      let result;
      if (req.method() === 'POST' && Date.now() < writeBlockedUntil) {
        record.quota = true;
        result = { status: 500, json: { success: false, error: 'WDE0014: Requests per minute quota exceeded.' } };
      } else if (endpoint === 'spellingBeeSession' && req.method() === 'GET' && name === 'admin' && staleForAdmin) {
        record.stale = true; result = { status: 200, json: { success: true, session: staleForAdmin } }; staleForAdmin = null;
      } else if (endpoint === 'spellingBeeCommand' && req.method() === 'GET' && Date.now() < blockCommandsUntil) result = { status: 200, json: { success: true, command: null } };
      else result = await sim.request(endpoint, req.method(), code, body);
      record.status = result.status;
      if (loseNextJudgeReply && req.method() === 'POST' && endpoint === 'spellingBeeJudge' && result.status === 200) {
        loseNextJudgeReply = false; record.status = 'reply-lost'; return route.abort();
      }
      await route.fulfill(result);
    });
    const page = await context.newPage();
    page.on('pageerror', error => errors.push(`${name}: ${error.message}`));
    return page;
  }
  async function word(presenter, text) {
    await presenter.evaluate(text => {
      current = text; marks = Array.from(current, () => 'pending'); ptr = 0;
      wordSequence += 1; hiddenMode = true; renderWord(); requestSpellingPresenterSync();
    }, text);
  }
  async function presenterBurst(presenter) {
    await word(presenter, 'abcdefghijklmnopqrstuvwx');
    await until(() => state()?.currentWord === 'abcdefghijklmnopqrstuvwx' && state()?.pointer === 0);
    await sleep(500);
    const from = requests.length, start = Date.now();
    await presenter.evaluate(async () => {
      for (let i = 0; i < 24; i++) { mark('ok'); await new Promise(resolve => setTimeout(resolve, 80)); }
    });
    const saved = await until(() => state()?.pointer === 24 && state()?.marks.every(value => value === 'ok'));
    const writes = requests.slice(from).filter(record => record.method === 'POST' && record.name === 'presenter').length;
    const result = { name: 'Presenter local rapid input', elapsedMs: Date.now() - start, actions: 24, writes };
    report.scenarios.push(result);
    check('Presenter local inputs are preserved with bounded saves', saved && writes <= 4, result);
  }
  try {
    const presenter = await page('presenter');
    await presenter.goto(base + '/index.html');
    await presenter.locator('#session-tray-toggle').click();
    await presenter.locator('#session-code-input').fill('9753108642');
    await presenter.locator('#session-connect').click();
    await presenter.locator('#session-status').filter({ hasText: 'synced' }).waitFor();
    await word(presenter, 'butterfly');
    const admin = await page('admin');
    await admin.goto(base + '/admin.html?session=9753108642');
    await admin.locator('#join-session-button').click();
    await admin.locator('#director-status').filter({ hasText: 'Screen connected' }).waitFor();
    const screenCode = await admin.locator('#broadcast-code').innerText();
    const audience = [];
    for (let i = 0; i < 3; i++) {
      const screen = await page('screen' + i); audience.push(screen);
      await screen.goto(base + '/screen.html?session=' + screenCode);
      await screen.locator('#broadcast[data-scene=standby]').waitFor();
    }
    const judges = [];
    for (let i = 0; i < judgeCount; i++) {
      const judge = await page('judge' + i); judges.push(judge);
      await judge.goto(base + '/judge.html?session=9753108642');
      await judge.locator('#judge-name').fill('Stress Judge ' + i);
      await judge.locator('#join-session-button').click();
      await judge.locator('#control-app:not(.hidden)').waitFor();
    }
    await sleep(2000);
    if (process.env.BEE_STRESS_PRESENTER_ONLY) {
      await presenterBurst(presenter); report.checks = checks;
      if (process.env.BEE_STRESS_REPORT) fs.writeFileSync(process.env.BEE_STRESS_REPORT, JSON.stringify(report, null, 2));
      if (!baselineRef && checks.some(result => !result.ok)) process.exitCode = 1;
      return;
    }
    const idleFrom = requests.length, idleStarted = Date.now();
    await sleep(15000);
    const idle = requests.slice(idleFrom);
    const idleStats = { name: `${judgeCount + 5}-view idle traffic`, elapsedMs: Date.now() - idleStarted, requests: idle.length,
      gets: idle.filter(r => r.method === "GET").length, posts: idle.filter(r => r.method === "POST").length };
    report.scenarios.push(idleStats); console.log(JSON.stringify(idleStats));
    // A saved letter snapshot must be applied before another command replaces it.
    sim.enableLimits(false);
    blockCommandsUntil = Date.now() + 1600;
    await admin.evaluate(() => {
      document.querySelector('[data-verdict=incorrect]').click();
      document.getElementById('word-visibility-button').click();
    });
    const applied = await until(() => state()?.lastCommandSeq >= 2 && state()?.currentWord === 'butterfly');
    check('letter followed immediately by visibility preserves judgement', applied && state().pointer === 1 && JSON.parse(state().presenterStateJson).marks[0] === 'err', { pointer: state()?.pointer });

    // True sliding one-minute CMS read/write quotas, using the actual Velo code.
    await word(presenter, 'abcdefghijklmnopqrstuvwx');
    await until(async () => (await Promise.all([admin, ...judges].map(async p => p === admin ? (await p.locator('#control-word').getAttribute('data-sequence') === String(state()?.wordSequence) ? state()?.currentWord : '') : p.locator('#control-word').textContent()))).every(text => text === 'abcdefghijklmnopqrstuvwx'));
    await sleep(1500);
    sim.operations.length = 0; sim.enableLimits(true);
    const before = { ...sim.stats }, from = requests.length, started = Date.now();
    const inputs = [admin, ...judges].map(p => p.evaluate(async () => {
      for (let i = 0; i < 24; i++) {
        document.querySelector('[data-verdict=correct]').click();
        await new Promise(resolve => setTimeout(resolve, 80));
      }
    }));
    await Promise.all(inputs);
    const complete = await until(() => votes().filter(vote => vote.judgeName.startsWith('Stress Judge ')).length === judgeCount &&
      votes().filter(vote => vote.judgeName.startsWith('Stress Judge ')).every(vote => vote.pointer === 24 && vote.letterMarks.every(mark => mark === 'correct')) && state()?.pointer === 24, 85000);
    const burst = { elapsedMs: Date.now() - started, inputActions: 24 * (judgeCount + 1),
      requests: requests.length - from,
      reads: sim.stats.reads - before.reads, writes: sim.stats.writes - before.writes,
      readLimits: sim.stats.readLimits - before.readLimits, writeLimits: sim.stats.writeLimits - before.writeLimits };
    report.scenarios.push({ name: 'simultaneous 24-letter burst with CMS quotas', ...burst });
    check('all simultaneous letter inputs eventually persist intact', complete, burst);
    check('burst avoids exhausting the write quota', burst.writeLimits === 0, { writeLimits: burst.writeLimits });
    if (process.env.BEE_STRESS_SUSTAINED) {
      for (let round = 0; round < 2; round++) {
        await sleep(16000);
        const next = round === 0 ? 'abcdefghijklmnopqrstuvwy' : 'abcdefghijklmnopqrstuvwz';
        await word(presenter, next);
        const ready = await until(async () => (await Promise.all([admin, ...judges].map(async p => p === admin ? (await p.locator('#control-word').getAttribute('data-sequence') === String(state()?.wordSequence) ? state()?.currentWord : '') : p.locator('#control-word').textContent()))).every(text => text === next));
        const pendingCards = await admin.locator('.admin-judge-card').filter({ hasText: /Stress Judge/ }).allTextContents();
        check('next round displays existing judges as pending, never old verdicts ' + round, ready && pendingCards.length === judgeCount && pendingCards.every(text => text.includes('0/24')));
        await Promise.all([admin, ...judges].map(p => p.evaluate(async () => {
          for (let i = 0; i < 24; i++) { document.querySelector('[data-verdict=correct]').click(); await new Promise(resolve => setTimeout(resolve, 160)); }
        })));
        const done = await until(() => votes().filter(vote => vote.judgeName.startsWith('Stress Judge ')).every(vote => vote.word === next && vote.pointer === 24) && state()?.pointer === 24, 15000);
        check('sustained round ' + (round + 2) + ' persists all inputs', done);
      }
      const sustained = { name: "sustained three-round contest", elapsedMs: Date.now() - started,
        reads: sim.stats.reads - before.reads, writes: sim.stats.writes - before.writes,
        readLimits: sim.stats.readLimits - before.readLimits, writeLimits: sim.stats.writeLimits - before.writeLimits };
      report.scenarios.push(sustained);
      check('sustained contest stays within CMS quotas', sustained.readLimits === 0 && sustained.writeLimits === 0, sustained);
    }
    sim.enableLimits(false);

    // Slow links, a reply lost after persistence, and a full outage must retain input.
    delayMs = 850;
    await word(presenter, 'butterfly');
    await until(async () => (await Promise.all([admin, ...judges].map(async p => p === admin ? (await p.locator('#control-word').getAttribute('data-sequence') === String(state()?.wordSequence) ? state()?.currentWord : '') : p.locator('#control-word').textContent()))).every(text => text === 'butterfly'));
    loseNextJudgeReply = true;
    await judges[0].locator('[data-verdict=incorrect]').click();
    await until(() => requests.some(r => r.status === 'reply-lost'));
    offlineUntil = Date.now() + 3000;
    await Promise.all(judges.map(p => p.evaluate(() => {
      document.querySelector('[data-verdict=correct]').click();
      document.getElementById('undo-letter-button').click();
      document.querySelector('[data-verdict=incorrect]').click();
    })));
    const recovered = await until(() => votes().filter(vote => vote.judgeName.startsWith('Stress Judge ')).every(vote => vote.word === 'butterfly' && vote.pointer === (vote.judgeName === 'Stress Judge 0' ? 2 : 1) && vote.verdict === 'incorrect'), 30000);
    check('slow network, lost reply and outage recover without losing undo/marks', recovered);
    // All devices hitting a write limit together must retain the newest input.
    // Successful reads during recovery must not reset write-error backoff.
    delayMs = 90;
    const quotaFrom = requests.length, quotaStarted = Date.now();
    writeBlockedUntil = Date.now() + 5500;
    await Promise.all([admin, ...judges].map(p => p.locator('[data-verdict=correct]').click()));
    const quotaRecovered = await until(() => votes().filter(vote => vote.judgeName.startsWith('Stress Judge ')).every(vote => vote.word === 'butterfly' && vote.pointer === (vote.judgeName === 'Stress Judge 0' ? 3 : 2)) && state()?.pointer === 1, 25000);
    const rejectedWrites = requests.slice(quotaFrom).filter(record => record.quota).length;
    check('simultaneous quota errors recover on every device without a retry storm', quotaRecovered && rejectedWrites <= (judgeCount + 2) * 3,
      { elapsedMs: Date.now() - quotaStarted, rejectedWrites });
    const staleSession = (await sim.request('spellingBeeSession', 'GET', '9753108642')).json.session;
    delayMs = 90;
    await word(presenter, 'dragon');
    const changed = await until(async () => (await Promise.all(judges.map(p => p.locator('#control-word').textContent()))).every(text => text === 'dragon'));
    check('new word clears old judgements on every judge', changed);
    await until(async () => await admin.locator('#control-word').getAttribute('data-sequence') === String(state()?.wordSequence));
    staleForAdmin = staleSession;
    const staleDelivered = await until(() => requests.some(record => record.stale), 10000);
    check('late previous-word response cannot rewind Admin', staleDelivered && await admin.locator('#control-word').getAttribute('data-sequence') === String(state()?.wordSequence));
    await presenterBurst(presenter);
    check('no browser errors', errors.length === 0, { errors });
    report.checks = checks; report.totalRequests = requests.length; report.cms = sim.stats;
    if (process.env.BEE_STRESS_REPORT) fs.writeFileSync(process.env.BEE_STRESS_REPORT, JSON.stringify(report, null, 2));
    console.log(JSON.stringify(report, null, 2));
    if (checks.some(result => !result.ok) && !baselineRef) process.exitCode = 1;
  } finally { await browser.close(); server.close(); }
})().catch(error => { console.error(error); server.close(); process.exit(1); });
