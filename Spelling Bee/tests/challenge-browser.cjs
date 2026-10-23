const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), http = require('node:http');
const root = path.resolve(__dirname, '..');
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.png': 'image/png', '.mp3': 'audio/mpeg' };
const server = http.createServer((request, response) => {
  const file = path.join(root, decodeURIComponent(new URL(request.url, 'http://localhost').pathname));
  if (!file.startsWith(root + path.sep)) return response.writeHead(403).end();
  fs.readFile(file, (error, data) => { response.writeHead(error ? 404 : 200, { 'Content-Type': mime[path.extname(file)] || 'application/octet-stream' }); response.end(error ? 'Not found' : data); });
});
const expected = new Set(`indictment penchant paradigm epitome puerile synonymous jeopardy nonchalant vehemence ascetic archetypal myriad ameliorate panacea malleable debacle succinct boisterous convivial zealotry bureaucracy sacrilege pseudonym obsolescence hierarchy hypocrisy asymmetrical annihilate innocuous iridescent irreconcilable embezzlement homogeneous colloquial penitentiary presumptuous mausoleum supercilious intermittent harangue connoisseurship bourgeois denouement acquiescence surreptitious pusillanimous idiosyncrasy ecclesiastical insouciant legerdemain desiccate unconscionable verisimilitude vicissitude raconteur phlegmatic paraphernalia prescience`.split(' '));
(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = process.env.BEE_BASE_URL || `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
    await context.addInitScript(() => {
      const original = HTMLMediaElement.prototype.play;
      HTMLMediaElement.prototype.play = function() { this.muted = true; return original.call(this); };
    });
    const page = await context.newPage(), errors = [], wix = [];
    page.on('pageerror', error => errors.push(error.message));
    await context.route('**/cms-server/**', route => { wix.push(route.request().url()); return route.abort(); });
    await page.goto(base + '/challenge.html');
    assert.equal(await page.locator('#progress').innerText(), 'Word 1 of 58');
    assert(await page.locator('#pronunciation').evaluate(audio => audio.paused), 'initial playback needs the listener’s gesture');
    assert(await page.locator('#reveal').isDisabled());
    await page.locator('#listen').click();
    await page.waitForFunction(() => !document.getElementById('pronunciation').paused);
    const seen = [];
    for (let index = 0; index < expected.size; index++) {
      assert.equal(await page.locator('#progress').innerText(), `Word ${index + 1} of 58`);
      await page.waitForFunction(() => document.getElementById('pronunciation').readyState >= 2);
      const word = await page.locator('#pronunciation').evaluate(audio => decodeURIComponent(new URL(audio.src).pathname.split('/').pop()).replace(/\.mp3$/, ''));
      seen.push(word); assert(expected.has(word));
      const text = (await page.locator('body').innerText()).toLowerCase();
      assert([...expected].every(word => !text.includes(word)), 'target spellings remain hidden');
      assert(!/\b(easy|medium|hard)\b/i.test(text), 'no difficulty classification');
      if (index === 0) {
        await page.locator('#reveal').waitFor({ state: 'visible' });
        await page.waitForFunction(() => !document.getElementById('reveal').disabled);
        await page.locator('#reveal').click(); assert.equal(await page.locator('#revealed-word').innerText(), word);
        await page.locator('#reveal').click(); assert.equal(await page.locator('#revealed-word').textContent(), '');
        await page.locator('#reveal').click(); // Next must clear a visible answer too.
      }
      if (index === 1) assert.equal(await page.locator('#revealed-word').textContent(), '', 'Next clears the previous spelling');
      if (index === 1) {
        await page.reload();
        assert.equal(await page.locator('#progress').innerText(), 'Word 2 of 58');
        assert((await page.locator('#pronunciation').getAttribute('src')).includes(word));
      }
      if (index < expected.size - 1) await page.locator('#next').click();
    }
    assert.equal(new Set(seen).size, expected.size, 'every supplied word appears exactly once');
    assert(seen.some((word, index) => [...expected][index] !== word), 'the order is shuffled');
    await page.locator('#next').click();
    assert.equal(await page.locator('#heading').innerText(), 'Challenge complete');
    assert(await page.locator('#listen').isHidden());
    assert(await page.locator('#reveal').isHidden()); assert.equal(await page.locator('#revealed-word').textContent(), '');
    await page.reload(); assert.equal(await page.locator('#next').innerText(), 'Start again');
    await page.locator('#next').click(); assert.equal(await page.locator('#progress').innerText(), 'Word 1 of 58');
    for (let i = 0; i < 3; i++) await page.locator('#next').click();
    assert.equal(await page.locator('#progress').innerText(), 'Word 4 of 58');
    await page.waitForFunction(() => document.getElementById('pronunciation').readyState >= 2);
    // A failed audio request shows useful feedback and never blocks Next.
    await page.route('**/audio/*.mp3', route => route.abort());
    await page.locator('#next').click(); await page.locator('#status').filter({ hasText: /could not/ }).waitFor();
    await page.unroute('**/audio/*.mp3'); await page.locator('#next').click();
    await page.waitForFunction(() => document.getElementById('pronunciation').readyState >= 2);
    assert.equal(await page.locator('#progress').innerText(), 'Word 6 of 58');
    if (process.env.SCREENSHOT_DIR) await page.screenshot({ path: path.join(process.env.SCREENSHOT_DIR, 'challenge-desktop.png') });
    await page.setViewportSize({ width: 375, height: 812 });
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    if (process.env.SCREENSHOT_DIR) await page.screenshot({ path: path.join(process.env.SCREENSHOT_DIR, 'challenge-mobile.png') });
    assert.deepEqual(errors, []); assert.deepEqual(wix, []);
    console.log('Passed: all 58 supplied words, real audio loading, randomized unique order, hidden spellings/difficulties, replay/next, reload progress, completion/restart, fast skips, failed audio recovery, mobile fit and no Wix traffic.');
  } finally { await browser.close(); server.close(); }
})().catch(error => { console.error(error); server.close(); process.exit(1); });
