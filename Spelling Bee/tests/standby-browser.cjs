/* Timed standby rotation, using isolated previews and no real Wix sessions. */
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const M = require('../js/screen-model.js');
const root = path.resolve(__dirname, '..');
const mime = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.png': 'image/png', '.svg': 'image/svg+xml' };
const server = http.createServer((req, res) => {
  const file = path.join(root, decodeURIComponent(new URL(req.url, 'http://localhost').pathname));
  if (!file.startsWith(root + path.sep)) return res.writeHead(403).end();
  fs.readFile(file, (error, data) => { res.writeHead(error ? 404 : 200, { 'Content-Type': mime[path.extname(file)] || 'application/octet-stream' }); res.end(error ? 'Not found' : data); });
});
(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = process.env.BEE_BASE_URL || `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  try {
    const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
    const errors = [], wix = [];
    await context.route('**/cms-server/_functions/**', route => { wix.push(route.request().url()); return route.abort(); });
    const page = await context.newPage();
    page.on('pageerror', error => errors.push(error.message));
    await page.clock.install();
    await page.goto(base + '/screen.html?preview=1');
    await page.clock.pauseAt(await page.evaluate(() => Date.now() + 100));
    const apply = async state => {
      await page.evaluate(state => window.postMessage({ type: 'bee-screen-preview', state }, location.origin), state);
      await page.locator(`#broadcast[data-scene="${state.scene}"][data-layout="${state.layout}"]`).waitFor();
    };
    const phase = () => page.locator('.scene-fit:not(.scene-outgoing) .standby-set.is-current').getAttribute('data-standby');
    const capture = async name => {
      if (!process.env.SCREENSHOT_DIR) return;
      await page.screenshot({ path: path.join(process.env.SCREENSHOT_DIR, name + '.png') });
    };
    for (const layout of ['stage', 'stream']) {
      // Re-enter standby to start a fresh 40 / 20 / 20 cycle.
      const state = { ...M.initial(), layout, motion: 'quiet', scene: 'break', cueId: layout + '-break' };
      await apply(state);
      state.scene = 'standby'; state.cueId = layout + '-standby'; await apply(state);
      await page.locator('.standby-set img').evaluateAll(images => Promise.all(images.map(image => image.decode())));
      assert.equal(await phase(), 'school');
      await capture('standby-' + layout + '-school');
      await page.clock.runFor(20000);
      await apply({ ...state, revision: 2, round: 'Round 2' });
      await page.clock.runFor(19800);
      assert.equal(await phase(), 'school', 'unchanged standby cue must not restart on ordinary updates');
      await page.clock.runFor(400); // Allow the existing 200 ms display tick to observe the boundary.
      assert.equal(await phase(), 'partners', 'Brighton and Duché begin at 40 seconds');
      const boxes = await page.locator('.is-current .standby-partner-logo').evaluateAll(images => images.map(image => { const b = image.getBoundingClientRect(); return { left: b.left, right: b.right, top: b.top, bottom: b.bottom }; }));
      assert(boxes[0].right < boxes[1].left && boxes[0].top === boxes[1].top, 'partners appear side by side');
      await capture('standby-' + layout + '-partners');
      await page.clock.runFor(19600); assert.equal(await phase(), 'partners');
      await page.clock.runFor(400); assert.equal(await phase(), 'santillana', 'Santillana begins at 60 seconds');
      await capture('standby-' + layout + '-santillana');
      await page.clock.runFor(19600); assert.equal(await phase(), 'santillana');
      await page.clock.runFor(400); assert.equal(await phase(), 'school', 'cycle repeats at 80 seconds');
      // Partner and publisher groups fit in smaller 16:9 and 4:3 browser windows.
      for (const size of [{ width: 1280, height: 720 }, { width: 800, height: 600 }]) {
        await page.setViewportSize(size);
        const fits = await page.locator('.standby-set img').evaluateAll(images => {
          const stage = document.getElementById('broadcast').getBoundingClientRect();
          return images.every(image => { const b = image.getBoundingClientRect(); return b.left >= stage.left && b.right <= stage.right && b.top >= stage.top && b.bottom <= stage.bottom; });
        });
        assert(fits, 'all standby assets stay inside the display');
      }
      await page.setViewportSize({ width: 1920, height: 1080 });
    }
    // Rotation remains active with reduced motion; only the crossfade is disabled.
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await apply({ ...M.initial(), motion: 'full', scene: 'break', cueId: 'reduced-break' });
    await apply({ ...M.initial(), motion: 'full', cueId: 'reduced-standby' });
    await page.clock.runFor(40200); assert.equal(await phase(), 'partners');
    await apply({ ...M.initial(), motion: 'quiet', scene: 'break', cueId: 'exit' });
    await page.clock.runFor(80000);
    assert.equal(await page.locator('[data-standby]').count(), 0, 'rotation leaves no content in later scenes');
    // Full-motion partners crossfade gently without invoking the big logo sweep.
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await apply({ ...M.initial(), layout: 'stream', cueId: 'soft', motion: 'full' });
    await page.clock.runFor(40500);
    // CSS animations use the document timeline, separately from mocked JS timers.
    await page.locator('.standby-set').evaluateAll(groups => groups.forEach(group => {
      getComputedStyle(group).opacity;
      group.getAnimations().filter(animation => animation.transitionProperty === 'opacity').forEach(animation => { animation.pause(); animation.currentTime = 450; });
    }));
    const fade = await page.locator('.standby-set').evaluateAll(groups => groups.slice(0, 2).map(group => Number(getComputedStyle(group).opacity)));
    assert(fade.every(opacity => opacity > 0 && opacity < 1), 'both logos softly crossfade');
    assert.equal(await page.locator('#logo-sweep').isVisible(), false);
    await page.locator('.standby-set').evaluateAll(groups => groups.forEach(group => group.getAnimations().forEach(animation => animation.finish())));
    assert.equal(await page.locator('.standby-partners').evaluate(group => getComputedStyle(group).opacity), '1');
    assert.deepEqual(errors, []); assert.deepEqual(wix, [], 'logo rotation never contacts Wix');
    console.log('Passed: 40/20/20 standby timing, repeat, redraw continuity, both layouts, side-by-side logos, responsive fitting, soft crossfades, reduced motion, scene exit and zero Wix requests.');
  } finally { await browser.close(); server.close(); }
})().catch(error => { console.error(error); server.close(); process.exit(1); });
