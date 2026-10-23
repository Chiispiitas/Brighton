/* Real UI plus real Velo handlers in an isolated simulator; never writes live data. */
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const http = require('node:http'), fs = require('node:fs'), path = require('node:path');
const M = require('../js/screen-model.js');
const root = path.resolve(__dirname, '..');
const mime = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.png': 'image/png', '.svg': 'image/svg+xml', '.json': 'application/json', '.txt': 'text/plain' };
const server = http.createServer((req, res) => {
  const file = path.join(root, decodeURIComponent(new URL(req.url, 'http://localhost').pathname));
  if (!file.startsWith(root + path.sep)) return res.writeHead(403).end();
  fs.readFile(file, (error, data) => { res.writeHead(error ? 404 : 200, { 'Content-Type': mime[path.extname(file)] || 'application/octet-stream' }); res.end(error ? 'Not found' : data); });
});
(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = process.env.BEE_BASE_URL || `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const sim = require('./wix-simulator.cjs')(), errors = [], writes = [], reads = [];
  let failBroadcast = false, failHistory = false;
  const saved = code => { const row = [...(sim.collections.get('SpellingBeeSessions')?.values() || [])].find(row => row.sessionCode === code); return row ? JSON.parse(row.presenterStateJson) : null; };
  const until = async predicate => { const end = Date.now() + 20000; while (Date.now() < end) { if (await predicate()) return; await new Promise(resolve => setTimeout(resolve, 80)); } throw new Error('Condition did not become true'); };
  const create = async (name = 'view') => {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1100 } });
    await context.route('https://fonts.googleapis.com/**', route => route.abort());
    await context.route('**/cms-server/_functions/**', async route => {
      const request = route.request(), url = new URL(request.url()), body = request.method() === 'POST' ? request.postDataJSON() : null;
      const code = body?.sessionCode || url.searchParams.get('sessionCode'); if (body) writes.push(body);
      else reads.push({ name, code });
      if (failBroadcast && body?.state.screenBroadcast) return route.fulfill({ status: 500, json: { success: false, error: 'Simulated save failure' } });
      if (failHistory && body?.state.screenRosterHistory) return route.fulfill({ status: 500, json: { success: false, error: 'Simulated history backup failure' } });
      await route.fulfill(await sim.request(url.pathname.split('/').pop(), request.method(), code, body));
    });
    const page = await context.newPage(); page.on('pageerror', error => errors.push(error.message)); return page;
  };
  try {
    const admin = await create(); await admin.goto(base + '/admin.html?session=7319');
    await admin.locator('#start-admin-session').click(); await admin.locator('#director-status').filter({ hasText: 'Screen connected' }).waitFor();
    const broadcast = await M.broadcastCode('7319'), backup = await M.rosterHistoryCode('7319');
    const roster = () => saved(broadcast).broadcast.contestants;
    const editLife = async (index, value) => { const input = admin.locator('.roster-lives').nth(index); await input.fill(value); await input.dispatchEvent('change'); };
    const publishRoster = async () => { await admin.locator('#roster-save').click(); await admin.locator('#director-status').filter({ hasText: 'Contestant list published' }).waitFor(); };
    const take = async result => { await admin.locator(`[data-scene=result][data-result=${result}]`).click(); await admin.locator('#screen-take').click(); await admin.locator('#director-status').filter({ hasText: 'Scene is live' }).waitFor(); };
    assert.equal(await admin.locator('#lives-set-all,#lives-for-all').count(), 0);
    await admin.locator('#roster-paste').fill('Alice | Grade 5 | 1\nBob | Grade 6 | 2'); await admin.locator('#roster-add').click();
    await editLife(0, '2'); await editLife(1, '2');
    await admin.locator('#screen-show-lives').check(); await publishRoster();
    await admin.locator('#screen-current').selectOption(roster()[0].id); await admin.locator('[data-scene=spelling]').click(); await admin.locator('#screen-take').click();
    await admin.locator('#director-status').filter({ hasText: 'Scene is live' }).waitFor();
    const judge = await create('judge-lives'); await judge.goto(base + '/judge.html?session=7319'); await judge.locator('#judge-name').fill('Lives judge'); await judge.locator('#join-session-button').click();
    await judge.locator('#judge-contestant-name').filter({ hasText: 'Alice' }).waitFor();
    await judge.locator('#judge-contestant-lives').filter({ hasText: '2 lives remaining' }).waitFor();
    // Focused-field shortcut commits the edit and undoes the roster action.
    await admin.locator('.roster-lives').first().fill('1');
    await admin.keyboard.press('Control+z'); assert.equal(await admin.locator('.roster-lives').first().inputValue(), '2');
    assert.equal(roster()[0].lives, 2, 'draft undo does not change the on-air roster');
    await admin.keyboard.press('Control+y'); assert.equal(await admin.locator('.roster-lives').first().inputValue(), '1');
    await publishRoster(); assert.equal(roster()[0].lives, 1);
    await judge.locator('#judge-contestant-lives').filter({ hasText: '1 life remaining' }).waitFor();
    await admin.locator('#roster-undo').click(); await until(() => roster()[0].lives === 2);
    await judge.locator('#judge-contestant-lives').filter({ hasText: '2 lives remaining' }).waitFor();
    await admin.locator('#roster-redo').click(); await until(() => roster()[0].lives === 1);
    await editLife(0, '2'); await publishRoster();
    const alice = roster()[0].id; await admin.locator('#screen-current').selectOption(alice);
    await admin.locator('[data-scene=result][data-result=incorrect]').click(); assert.equal(roster()[0].lives, 2, 'preview never charges a life');
    failBroadcast = true; await admin.locator('#screen-take').click(); await admin.locator('#director-status').filter({ hasText: 'Not published' }).waitFor();
    assert.equal(roster()[0].lives, 2); assert.equal(await admin.locator('.roster-lives').first().inputValue(), '2'); failBroadcast = false;
    await take('incorrect'); assert.equal(roster()[0].lives, 1);
    await take('incorrect'); await take('pending'); assert.equal(roster()[0].lives, 1, 'repeated and recoloured results do not charge twice');
    await take('correct'); assert.equal(roster()[0].lives, 2, 'correcting a result refunds its life');
    await admin.locator('#new-word-button').click(); await admin.locator('#new-word-button[data-sync=saved]').waitFor();
    await take('pending'); assert.equal(roster()[0].lives, 1);
    await admin.locator('#new-word-button').click(); await admin.locator('#new-word-button[data-sync=saved]').waitFor();
    await take('incorrect'); assert.equal(roster()[0].lives, 0); assert.equal(roster()[0].status, 'eliminated');
    await judge.locator('#judge-contestant-lives').filter({ hasText: '0 lives remaining' }).waitFor();
    if (process.env.SCREENSHOT_DIR) {
      await judge.screenshot({ path: path.join(process.env.SCREENSHOT_DIR, 'judge-lives-desktop.png') });
      await judge.setViewportSize({ width: 390, height: 844 });
      await judge.screenshot({ path: path.join(process.env.SCREENSHOT_DIR, 'judge-lives-mobile.png') });
      await judge.setViewportSize({ width: 1440, height: 1100 });
    }
    await admin.locator('#roster-undo').click(); await until(() => roster()[0].lives === 1); assert.equal(roster()[0].status, 'active');
    await admin.locator('#roster-redo').click(); await until(() => roster()[0].lives === 0);
    await admin.locator('#next-speller').click(); assert.notEqual(await admin.locator('#screen-current').inputValue(), alice, 'Completed contestant is skipped');
    await admin.locator('#roster-undo').click(); // Undo the un-published next-contestant preparation.
    const beforeDelete = await admin.locator('#roster-rows tr').count();
    await admin.locator('#roster-rows tr').last().getByRole('button').click(); assert.equal(await admin.locator('#roster-rows tr').count(), beforeDelete - 1);
    await admin.locator('#roster-undo').click(); assert.equal(await admin.locator('#roster-rows tr').count(), beforeDelete);
    failHistory = true; await editLife(1, '1');
    await admin.locator('#roster-history-status').filter({ hasText: 'retry automatically' }).waitFor();
    await admin.reload(); await admin.locator('#join-session-button').click(); await admin.locator('#director-status').filter({ hasText: 'Screen connected' }).waitFor();
    assert.equal(await admin.locator('.roster-lives').nth(1).inputValue(), '1', 'local history survives reload even when the cloud backup failed');
    failHistory = false; await publishRoster();
    await until(() => saved(backup)?.history?.cursor > 0);
    await admin.locator('#roster-history-status').filter({ hasText: 'backed up to Wix' }).waitFor();
    // Another browser recovers the history and roster from the separate Wix backup.
    const recovered = await create(); await recovered.goto(base + '/admin.html?session=7319'); await recovered.locator('#join-session-button').click();
    await recovered.locator('#director-status').filter({ hasText: 'Screen connected' }).waitFor();
    assert.equal(await recovered.locator('.roster-lives').first().inputValue(), '0'); assert(await recovered.locator('#roster-undo').isEnabled());
    await recovered.close();
    await admin.reload(); await admin.locator('#join-session-button').click(); await admin.locator('#director-status').filter({ hasText: 'Screen connected' }).waitFor();
    assert.equal(await admin.locator('.roster-lives').first().inputValue(), '0'); assert(await admin.locator('#roster-undo').isEnabled());
    // Full saved-session round trip through the old three-difficulty backend.
    for (const level of ['SENIOR', 'JUNIOR']) {
      await admin.locator('#admin-category').selectOption(level); await until(() => saved('7319').level === level);
      await admin.locator('[data-difficulty=tiebreaker]').click(); await admin.locator('[data-difficulty=tiebreaker][data-sync=saved]').waitFor();
      assert.equal(saved('7319').poolDifficulty, 'tiebreaker');
      assert.equal(await admin.locator('#difficulty-pill').innerText(), 'TIEBREAKER');
      const study = await create(); await study.goto(base + '/index.html?session=7319');
      await study.locator('#session-status').filter({ hasText: 'Following Admin' }).waitFor();
      assert(await study.locator('#btn-tiebreaker').isVisible());
      assert((await study.locator('#btn-tiebreaker').getAttribute('class')).includes('primary'));
      assert(await study.locator('#next-word').isDisabled()); await study.close();
      const words = fs.readFileSync(path.join(root, 'wordlists', level, 'tiebreaker.txt'), 'utf8').trim().split(/\r?\n/);
      assert(words.includes(saved('7319').word));
      await admin.locator('#pool-launcher').click(); await admin.locator('#pool-columns [data-pool-difficulty=tiebreaker]').first().waitFor(); await admin.locator('#pool-close').click();
    }
    await admin.locator('#admin-category').selectOption('4TH-5TH'); await until(() => saved('7319').level === '4TH-5TH');
    assert.equal(saved('7319').difficulty, 'easy'); assert(await admin.locator('[data-difficulty=tiebreaker]').isHidden());
    await editLife(1, ''); await admin.locator('#screen-show-lives').uncheck(); await publishRoster();
    await admin.locator('#screen-current').selectOption(roster()[1].id); await admin.locator('[data-scene=spelling]').click(); await admin.locator('#screen-take').click();
    await admin.locator('#director-status').filter({ hasText: 'Scene is live' }).waitFor();
    await judge.locator('#judge-contestant-name').filter({ hasText: 'Bob' }).waitFor();
    await judge.locator('#judge-contestant-lives').filter({ hasText: 'Lives not set' }).waitFor();
    await editLife(1, '1'); await publishRoster();
    await judge.locator('#judge-contestant-lives').filter({ hasText: '1 life remaining' }).waitFor();
    await admin.locator('#screen-current').selectOption(''); await admin.locator('[data-scene=standby]').click(); await admin.locator('#screen-take').click();
    await admin.locator('#director-status').filter({ hasText: 'Scene is live' }).waitFor(); await judge.locator('#judge-contestant').waitFor({ state: 'hidden' });
    assert(reads.filter(read => read.name === 'judge-lives').every(read => read.code === '7319'), 'judges never add broadcast, history or camera polling');
    assert(writes.filter(body => body.state.screenRosterHistory).length < 15, 'backups are coalesced, never sent on every display poll');
    assert.deepEqual(errors, []);
    console.log('Passed: removed bulk lives control, draft/live undo and redo, failure safety, persistent local and Wix recovery, duplicate-safe automatic lives, Completed status, participant restoration and both Tiebreaker pools.');
  } finally { await browser.close(); server.close(); }
})().catch(error => { console.error(error); server.close(); process.exit(1); });
