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
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const sim = require('./wix-simulator.cjs')();
  await sim.request('spellingBeeSession', 'POST', '2468', { sessionCode: '2468', state: { sourceRole: 'study', word: 'bell', wordToken: 'multi:1:bell', level: '4TH-5TH', difficulty: 'easy' } });
  const errors = [], writes = [];
  await context.route('https://fonts.googleapis.com/**', route => route.abort());
  await context.route('**/cms-server/_functions/**', async route => {
    const req = route.request(), url = new URL(req.url()), body = req.method() === 'POST' ? req.postDataJSON() : null;
    if (body) writes.push(body);
    await route.fulfill(await sim.request(url.pathname.split('/').pop(), req.method(), body?.sessionCode || url.searchParams.get('sessionCode'), body));
  });
  await context.addInitScript(() => {
    window.logoSweeps = 0; const animate = Element.prototype.animate; Element.prototype.animate = function (...args) { if (this.parentElement?.id === 'logo-sweep') window.logoSweeps++; return animate.apply(this, args); };
    window.cameraCalls = []; window.cameraStreams = []; window.blockedCamera = ''; window.cameraDelay = 60;
    const play = HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play = function () { if (window.stallCamera && this.srcObject?.getVideoTracks()[0]?.getSettings().deviceId === window.stallCamera) return new Promise(() => {}); return play.call(this); };
    navigator.mediaDevices.enumerateDevices = async () => ['a', 'b', 'c', 'd'].map((id, i) => ({ kind: 'videoinput', deviceId: 'cam-' + id, label: 'Test camera ' + (i + 1) }));
    navigator.mediaDevices.getUserMedia = async constraints => {
      const id = constraints.video.deviceId?.exact || 'cam-a'; window.cameraCalls.push({ id, audio: constraints.audio });
      if (window.blockedCamera === id) { const error = new Error('hardware busy'); error.name = 'NotReadableError'; throw error; }
      await new Promise(resolve => setTimeout(resolve, window.cameraDelay));
      const canvas = document.createElement('canvas'); canvas.width = 1280; canvas.height = 720;
      const ctx = canvas.getContext('2d');
      const draw = () => { ctx.fillStyle = { 'cam-a': '#8a2332', 'cam-b': '#254d98', 'cam-c': '#23826a', 'cam-d': '#88558a' }[id]; ctx.fillRect(0, 0, 1280, 720); ctx.fillStyle = 'white'; ctx.font = '70px sans-serif'; ctx.fillText(id + ' ' + Date.now(), 50, 120); };
      draw(); const stream = canvas.captureStream(20), track = stream.getVideoTracks()[0];
      const timer = setInterval(draw, 50), stop = track.stop.bind(track), settings = track.getSettings.bind(track);
      track.stop = () => { clearInterval(timer); stop(); }; track.getSettings = () => ({ ...settings(), deviceId: id });
      window.cameraStreams.push(stream); return stream;
    };
  });
  const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
  const until = async test => { const end = Date.now() + 15000; while (Date.now() < end) { if (await test()) return; await pause(60); } throw Error('Condition did not become true'); };
  const create = async () => { const page = await context.newPage(); page.on('pageerror', error => errors.push(error.message)); return page; };
  try {
    const admin = await create(); await admin.goto(base + '/admin.html?session=2468'); await admin.locator('#join-session-button').click(); await admin.locator('#director-status').filter({ hasText: 'Screen connected' }).waitFor();
    await admin.locator('#screen-layout').selectOption('stream'); await admin.locator('#screen-take').click(); await admin.locator('#director-status').filter({ hasText: 'Scene is live' }).waitFor();
    const screen = await create(); await screen.clock.install(); await screen.goto(base + '/screen.html?session=2468&view=camera');
    await screen.locator('#camera-device-2 option[value=cam-b]').waitFor({ state: 'attached' });
    await screen.locator('#camera-device').selectOption('cam-a'); await screen.locator('#camera-device-2').selectOption('cam-b'); await screen.locator('#camera-start').click();
    await until(() => screen.evaluate(() => document.querySelectorAll('.camera-feed').length === 2 && document.querySelectorAll('.camera-take:not(:disabled)').length === 2));
    assert.equal(await screen.locator('#broadcast').getAttribute('data-camera'), '1');
    const warmBefore = await screen.locator('#camera-feed-2').evaluate(video => video.currentTime); await pause(200);
    assert(await screen.locator('#camera-feed-2').evaluate(video => video.currentTime) > warmBefore, 'off-air camera continues producing frames');
    const coveredEdges = async () => {
      const png = await screen.locator('#broadcast').screenshot();
      return screen.evaluate(async base64 => {
        const image = new Image(); image.src = 'data:image/png;base64,' + base64; await image.decode();
        const canvas = document.createElement('canvas'); canvas.width = image.width; canvas.height = image.height;
        const ctx = canvas.getContext('2d'); ctx.drawImage(image, 0, 0);
        const w = canvas.width, h = canvas.height;
        return [[1,1],[w-2,1],[1,h-2],[w-2,h-2],[1,h/2],[w-2,h/2],[w/2,1],[w/2,h-2]].map(([x,y]) => Array.from(ctx.getImageData(x,y,1,1).data));
      }, png.toString('base64'));
    };
    assert.equal(await screen.evaluate(() => window.logoSweeps), 0, 'camera startup and scene loading do not sweep');
    await screen.clock.pauseAt(await screen.evaluate(() => Date.now() + 100));
    await screen.evaluate(() => { for (let i = 0; i < 40; i++) document.dispatchEvent(new KeyboardEvent('keydown', {key:i % 2 ? '1' : '2',bubbles:true})); });
    await screen.locator('#logo-sweep > div').evaluate(el => el.getAnimations()[0].pause());
    assert.equal(await screen.evaluate(() => window.logoSweeps), 1, 'rapid requests coalesce into one sweep');
    await screen.clock.fastForward(600); assert.equal(await screen.locator('#broadcast').getAttribute('data-camera'), '1', 'latest requested camera wins at cover');
    await screen.clock.fastForward(900); await screen.locator('#logo-sweep > div').evaluate(el => el.getAnimations()[0].finish()); await screen.locator('#logo-sweep').waitFor({state:'hidden'});
    await screen.keyboard.press('2'); await screen.locator('#logo-sweep.active').waitFor();
    await screen.locator('#logo-sweep > div').evaluate(el => { const animation = el.getAnimations()[0]; animation.pause(); animation.currentTime = 600; });
    const edgesBeforeCut = await coveredEdges();
    await screen.clock.fastForward(500); assert.equal(await screen.locator('#broadcast').getAttribute('data-camera'), '1', 'previous feed remains visible until logo covers the frame');
    await admin.locator('[data-scene=round]').click(); await admin.locator('#screen-take').click(); await admin.locator('#director-status').filter({hasText:'Scene is live'}).waitFor();
    await screen.locator('#broadcast[data-scene=round]').waitFor(); assert.equal(await screen.evaluate(() => window.logoSweeps), 2, 'scene update during a camera cut does not start another sweep');
    await screen.clock.fastForward(80); assert.equal(await screen.locator('#broadcast').getAttribute('data-camera'), '2', 'camera changes under the logo');
    assert.deepEqual(await coveredEdges(), edgesBeforeCut, 'every edge and corner stays opaque while the background camera changes');
    if (screenshots) await screen.locator('#broadcast').screenshot({path:path.join(screenshots,'camera-sweep-cover.png')});
    await screen.clock.fastForward(850); await screen.locator('#logo-sweep > div').evaluate(el => el.getAnimations()[0].finish()); await screen.locator('#logo-sweep').waitFor({state:'hidden'});
    await screen.keyboard.press('1'); await screen.locator('#logo-sweep > div').evaluate(el => el.getAnimations()[0].pause()); await screen.clock.fastForward(600); await screen.clock.fastForward(900); await screen.locator('#logo-sweep > div').evaluate(el => el.getAnimations()[0].finish()); await screen.locator('#logo-sweep').waitFor({state:'hidden'});
    await screen.clock.resume();
    assert.equal(await screen.evaluate(() => window.cameraCalls.length), 2, 'hotkey cuts never reopen either camera');
    assert.equal(await screen.evaluate(() => window.cameraStreams.every(stream => stream.getTracks().every(track => track.readyState === 'live'))), true);
    await screen.locator('#camera-toggle').evaluate(el => el.click());
    await screen.locator('.camera-hotkey').nth(0).fill('4'); await screen.locator('.camera-hotkey').nth(0).dispatchEvent('change');
    await screen.locator('.camera-hotkey').nth(1).fill('5'); await screen.locator('.camera-hotkey').nth(1).dispatchEvent('change');
    await screen.locator('.camera-hotkey').nth(1).fill('4'); await screen.locator('.camera-hotkey').nth(1).dispatchEvent('change'); assert.equal(await screen.locator('.camera-hotkey').nth(1).inputValue(), '5', 'duplicate hotkey is rejected');
    await screen.locator('.camera-hotkey').nth(1).press('5'); assert.equal(await screen.locator('#broadcast').getAttribute('data-camera'), '1', 'typing in a setting never cuts cameras');
    await screen.locator('.camera-hotkey').nth(1).fill('5'); await screen.locator('.camera-hotkey').nth(1).dispatchEvent('change');
    await screen.locator('#camera-close').click(); await screen.locator('body').click({ position: { x: 700, y: 200 } }); await screen.keyboard.press('5');
    await until(async () => await screen.locator('#broadcast').getAttribute('data-camera') === '2');
    await admin.keyboard.press('4'); await until(async () => await screen.locator('#broadcast').getAttribute('data-camera') === '1');
    await admin.keyboard.press('5'); await until(async () => await screen.locator('#broadcast').getAttribute('data-camera') === '2');
    assert.equal(await admin.evaluate(() => window.cameraCalls.length), 0, 'Admin sends only camera-cut controls and never opens media');
    await screen.locator('#logo-sweep').waitFor({state:'hidden'});
    const beforeTick = writes.filter(body => body.state.screenCameraPreview && body.state.active).length;
    await screen.clock.fastForward(15000); await until(() => writes.filter(body => body.state.screenCameraPreview && body.state.active).length > beforeTick);
    const beforePhotos = writes.filter(body => body.state.screenCameraPreview && body.state.active).length;
    await screen.keyboard.press('4'); await screen.keyboard.press('5'); assert.equal(writes.filter(body => body.state.screenCameraPreview && body.state.active).length, beforePhotos, 'cuts do not burst-upload preview stills');
    await screen.locator('#camera-toggle').evaluate(el => el.click()); await screen.locator('#camera-mirror-2').check(); assert(await screen.locator('#camera-feed-2').evaluate(video => video.classList.contains('mirrored')));
    await screen.locator('#camera-add').click(); await screen.locator('#camera-device-3').selectOption('cam-c'); await screen.locator('#camera-start').click();
    await until(() => screen.evaluate(() => window.cameraStreams.length === 3 && document.querySelectorAll('.camera-take:not(:disabled)').length === 3));
    assert.equal(await screen.locator('#broadcast').getAttribute('data-camera'), '2', 'starting an extra camera does not change the on-air feed');
    assert.equal(await screen.evaluate(() => window.cameraCalls.length), 3); assert.equal(await screen.evaluate(() => window.cameraStreams.slice(0, 2).every(stream => stream.getTracks()[0].readyState === 'live')), true);
    await screen.keyboard.press('3'); await until(async () => await screen.locator('#broadcast').getAttribute('data-camera') === '3'); await screen.locator('#logo-sweep').waitFor({state:'hidden'});
    await screen.keyboard.press('5'); await until(async () => await screen.locator('#broadcast').getAttribute('data-camera') === '2'); await screen.locator('#logo-sweep').waitFor({state:'hidden'});
    assert.deepEqual(await screen.locator('.camera-feed').evaluateAll(videos => videos.filter(video => getComputedStyle(video).opacity === '1').map(video => video.id)), ['camera-feed-2'], 'selected camera alone fills the background');
    await screen.clock.fastForward(16000); await until(() => { const state = writes.filter(body => body.state.screenCameraPreview && body.state.active).at(-1)?.state; return state?.cameraName === 'Secondary camera' && state.mirrored === true; });
    assert.equal(writes.filter(body => body.state.screenCameraPreview && body.state.active).at(-1).state.mirrored, true, 'Admin still comes from the selected camera with its own mirror setting');
    await admin.locator('[data-scene=result][data-result=pending]').click(); await admin.locator('#screen-take').click(); await admin.locator('#director-status').filter({hasText:'Scene is live'}).waitFor(); await screen.locator('#broadcast[data-scene=result]').waitFor();
    await screen.evaluate(() => {
      window.firstBreakText = null;
      const observer = new MutationObserver(() => { if (document.getElementById('broadcast').dataset.scene === 'break') { window.firstBreakText = document.getElementById('scene').innerText; observer.disconnect(); } });
      observer.observe(document.getElementById('scene'), {childList:true,subtree:true});
    });
    await admin.locator('[data-scene=break]').click(); await admin.locator('#screen-take').click(); await admin.locator('#director-status').filter({hasText:'Scene is live'}).waitFor(); await screen.locator('#broadcast[data-scene=break]').waitFor();
    assert(!/\bbell\b/i.test(await screen.evaluate(() => window.firstBreakText)), 'revealed spelling clears at the first frame of the next scene');
    await admin.locator('#screen-motion').selectOption('quiet'); await admin.locator('#screen-take').click(); await admin.locator('#director-status').filter({hasText:'Scene is live'}).waitFor(); await screen.locator('#broadcast.quiet').waitFor();
    const quietSweeps = await screen.evaluate(() => window.logoSweeps);
    await screen.keyboard.press('4'); assert.equal(await screen.locator('#broadcast').getAttribute('data-camera'), '1');
    await screen.keyboard.press('5'); assert.equal(await screen.locator('#broadcast').getAttribute('data-camera'), '2');
    assert.equal(await screen.evaluate(() => window.logoSweeps), quietSweeps, 'quiet mode switches immediately without a sweep');
    await admin.locator('#screen-motion').selectOption('full'); await admin.locator('#screen-take').click(); await admin.locator('#director-status').filter({hasText:'Scene is live'}).waitFor(); await screen.locator('#broadcast:not(.quiet)').waitFor();
    await screen.emulateMedia({reducedMotion:'reduce'}); await screen.keyboard.press('4'); assert.equal(await screen.locator('#broadcast').getAttribute('data-camera'), '1'); await screen.keyboard.press('5');
    assert.equal(await screen.evaluate(() => window.logoSweeps), quietSweeps, 'system reduced motion also skips the sweep'); await screen.emulateMedia({reducedMotion:'no-preference'});
    await screen.locator('#camera-toggle').evaluate(el => el.click()); await screen.locator('#camera-device-2').selectOption('cam-a'); await screen.locator('#camera-start').click(); await screen.locator('#camera-status').filter({ hasText: 'already assigned' }).waitFor();
    assert.equal(await screen.evaluate(() => window.cameraCalls.length), 3, 'duplicate device does not create another capture');
    await screen.locator('#camera-device-2').selectOption('cam-b');
    await screen.evaluate(() => window.blockedCamera = 'cam-d'); await screen.locator('#camera-device-3').selectOption('cam-d'); await screen.locator('#camera-start').click();
    await screen.locator('#camera-status').filter({ hasText: 'alongside' }).waitFor(); assert.equal(await screen.locator('#broadcast').getAttribute('data-camera'), '2');
    assert.equal(await screen.evaluate(() => window.cameraStreams.every(stream => stream.getVideoTracks()[0].readyState === 'live')), true, 'failed extra camera keeps all existing feeds');
    if (screenshots) await screen.screenshot({ path: path.join(screenshots, 'multi-camera-setup.png') });
    await screen.evaluate(() => { window.blockedCamera = ''; window.stallCamera = 'cam-d'; }); await screen.locator('#camera-start').click();
    await until(() => screen.evaluate(() => window.cameraStreams.length === 4)); await screen.clock.fastForward(8100);
    await screen.locator('#camera-status').filter({hasText:'No video frames'}).waitFor();
    assert.equal(await screen.evaluate(() => window.cameraStreams[3].getVideoTracks()[0].readyState), 'ended', 'camera with no playable frames is cleaned up');
    assert.equal(await screen.locator('#broadcast').getAttribute('data-camera'), '2', 'frame timeout preserves the on-air feed');
    await screen.evaluate(() => { const track = window.cameraStreams[1].getVideoTracks()[0]; track.stop(); track.dispatchEvent(new Event('ended')); });
    assert.equal(await screen.locator('#broadcast').getAttribute('data-camera'), '1', 'disconnect immediately cuts to another warm camera');
    await screen.evaluate(() => { window.blockedCamera = ''; window.stallCamera = ''; window.cameraDelay = 300; });
    await screen.evaluate(() => document.dispatchEvent(new KeyboardEvent('keydown',{key:'3',bubbles:true}))); await screen.locator('#logo-sweep.active').waitFor();
    await screen.locator('#camera-start').click(); await pause(100); await screen.locator('#camera-stop').click(); await pause(700);
    assert.equal(await screen.locator('#logo-sweep.active').count(),0,'Stop cancels the pending camera sweep');
    assert.equal(await screen.locator('.camera-feed').count(), 0); assert.equal(await screen.evaluate(() => window.cameraStreams.every(stream => stream.getTracks().every(track => track.readyState === 'ended'))), true, 'Stop cancels in-flight starts and releases active and warm streams');
    assert.equal(await screen.evaluate(() => window.cameraCalls.every(call => call.audio === false)), true);
    await screen.reload(); await screen.locator('#camera-device').waitFor(); assert.equal(await screen.locator('.camera-hotkey').nth(0).inputValue(), '4'); assert.equal(await screen.locator('.camera-hotkey').nth(1).inputValue(), '5');
    assert.equal(await screen.evaluate(() => window.cameraCalls.length), 0, 'reload restores settings without opening cameras');
    assert.deepEqual(errors, []);
    console.log('Passed: simultaneous warm cameras, logo-covered cuts without new capture, no camera-view scene sweeps, configurable saved hotkeys, Admin hotkeys, mirrors, third camera, duplicate guards, failure/disconnect fallback, no still-upload bursts, pending-start cancellation and full cleanup.');
  } finally { await browser.close(); server.close(); }
})().catch(error => { console.error(error); server.close(); process.exit(1); });
