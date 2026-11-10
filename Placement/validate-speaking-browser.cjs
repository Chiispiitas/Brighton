/* Real-browser Speaking regression. Microphone audio is a generated tone,
   all API requests are mocked, and no real candidate records are accessed. */
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const assert = require('node:assert/strict');
const playwright = require('playwright');
const root = path.resolve(__dirname, '..');
const output = process.env.SPEAKING_QA_OUTPUT;
const mime = {'.html':'text/html', '.css':'text/css', '.js':'application/javascript', '.png':'image/png', '.webp':'image/webp', '.jpg':'image/jpeg', '.woff2':'font/woff2', '.svg':'image/svg+xml'};
const server = http.createServer((req, res) => {
  let file = path.resolve(root, '.' + new URL(req.url, 'http://localhost').pathname);
  if (!file.startsWith(root + path.sep)) return res.writeHead(403).end();
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
  fs.readFile(file, (error, bytes) => {
    if (error) return res.writeHead(404).end();
    if (/Placement[\\/](?:YoungLearners[\\/])?main\.js$/.test(file)) {
      const source = bytes.toString('utf8');
      const end = source.lastIndexOf('})();');
      const expose = `window.speakingQA={
        setup(){session={sessionId:'browser-qa',clientSessionId:'browser-client',moduleId:'speaking-a2',phase:'speaking',provisionalLevel:'A2',studentName:'Speaking Browser QA',status:'active'};currentModuleId='speaking-a2';renderSpeakingHandoff();},
        age(){speakingStartedAt=performance.now()-30000;},
        mute(){speakingStream.getAudioTracks()[0].dispatchEvent(new Event('mute'));},
        hide(){window.dispatchEvent(new Event('pagehide'));},
        stop:stopSpeakingRecording,
        state(){return {status:session.status,phase:session.phase,recorderState:speakingRecorder?.state,chunkBytes:speakingChunks.reduce((sum,chunk)=>sum+chunk.size,0),metrics:lastSpeakingAttemptMetrics};},
        cleanup:cleanupSpeakingMedia
      };`;
      bytes = Buffer.from(source.slice(0, end) + expose + source.slice(end));
    }
    res.writeHead(200, {'Content-Type':mime[path.extname(file)] || 'application/octet-stream'}).end(bytes);
  });
});

async function reachable(page, selector, label) {
  const element = page.locator(selector);
  await element.scrollIntoViewIfNeeded();
  const result = await element.evaluate(element => {
    const rect = element.getBoundingClientRect();
    const hit = document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2);
    return {width:rect.width,height:rect.height,left:rect.left,right:rect.right,top:rect.top,bottom:rect.bottom,viewportWidth:innerWidth,viewportHeight:innerHeight,hit:hit === element || element.contains(hit)};
  });
  assert.ok(result.left >= -1 && result.right <= result.viewportWidth + 1 && result.top >= -1 && result.bottom <= result.viewportHeight + 1 && result.hit, label + ': inaccessible control ' + JSON.stringify(result));
  assert.ok(result.width >= 44 && result.height >= 40, label + ': small control ' + JSON.stringify(result));
}

async function failedPicture(page, label) {
  if (!output) return;
  fs.mkdirSync(output, {recursive:true});
  await page.screenshot({path:path.join(output, label + '-failed.png'),fullPage:true}).catch(() => {});
}

async function contextFor(browser, engine, size, missingCapture = false) {
  const phone = size.width < 600 || size.height < 450;
  const userAgent = !phone ? undefined : engine === 'webkit'
    ? 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1'
    : engine === 'firefox'
      ? 'Mozilla/5.0 (Android 14; Mobile; rv:134.0) Gecko/134.0 Firefox/134.0'
      : 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Mobile Safari/537.36';
  const context = await browser.newContext({viewport:size,hasTouch:phone,isMobile:engine !== 'firefox' && phone,userAgent,reducedMotion:'reduce'});
  const calls = [];
  let submitted = 0;
  await context.route('**/*', async route => {
    const request = route.request();
    if (!['GET','HEAD'].includes(request.method())) {
      const body = JSON.parse(request.postData() || '{}');
      calls.push({url:request.url(),body});
      let data = {success:true};
      if (request.url().endsWith('Resume')) data = {success:true,status:'active',phase:'speaking',moduleId:'speaking-a2'};
      if (request.url().endsWith('SubmitSpeaking')) {
        submitted++;
        data = submitted === 1
          ? {success:true,speakingError:true,speakingErrorCode:'provider-server',providerStatus:503}
          : {success:true,status:'completed',finalLevel:'A2',result:{finalLevel:'A2',studentName:'Speaking Browser QA',completedAt:new Date().toISOString(),skills:{speaking:{score:43,displayScore:'4.3/10',level:'A2'}}}};
      }
      return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(data),headers:{'access-control-allow-origin':'*'}});
    }
    if (!request.url().startsWith('http://127.0.0.1:')) return route.abort();
    return route.continue();
  });
  await context.addInitScript(({missingCapture, engine, stalledMeter}) => {
    // Optional browser speech recognition must not be a prerequisite.
    window.SpeechRecognition = undefined;
    window.webkitSpeechRecognition = undefined;
    const nativeTimeout = window.setTimeout.bind(window);
    window.setTimeout = (fn, ms, ...args) => nativeTimeout(fn, ms === 600 ? 5 : ms, ...args);
    // Optional reproduction of a runner/device whose audio output cannot start.
    if (stalledMeter) {
      const AudioClass = window.AudioContext || window.webkitAudioContext;
      if (AudioClass) {
        Object.defineProperty(AudioClass.prototype, 'state', {configurable:true,get:() => 'suspended'});
        AudioClass.prototype.resume = () => new Promise(() => {});
      }
    }
    if (missingCapture === 'denied') {
      Object.defineProperty(navigator, 'mediaDevices', {configurable:true,value:{getUserMedia:async () => {throw new DOMException('Microphone denied for QA', 'NotAllowedError');}}});
      return;
    }
    if (missingCapture) {
      Object.defineProperty(navigator, 'mediaDevices', {configurable:true,value:undefined});
      window.MediaRecorder = undefined;
      return;
    }
    // Firefox's native test microphone avoids making getUserMedia depend on a
    // Web Audio output device. AudioContext.resume() may remain pending on a
    // Linux CI runner without an audio sink; a real microphone has no such gate.
    if (engine === 'firefox') return;
    Object.defineProperty(navigator, 'mediaDevices', {configurable:true,value:{getUserMedia:async () => {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      const context = new AudioContextClass();
      const oscillator = context.createBufferSource();
      const buffer = context.createBuffer(1, context.sampleRate, context.sampleRate);
      const samples = buffer.getChannelData(0);
      for (let i=0; i<samples.length; i++) samples[i] = Math.sin(i * .05) * .2 + (Math.random() * 2 - 1) * .15;
      oscillator.buffer = buffer;
      oscillator.loop = true;
      const gain = context.createGain();
      const destination = context.createMediaStreamDestination();
      gain.gain.value = .2;
      oscillator.connect(gain).connect(destination);
      oscillator.start();
      await context.resume();
      // Retain the generator until this browser context closes.
      window.qaAudioGenerator = {context,oscillator};
      return destination.stream;
    }}});
  }, {missingCapture, engine, stalledMeter:process.env.SPEAKING_QA_STALLED_METER === '1'});
  return {context,calls};
}

async function run(browser, engine, size, prefix, base) {
  const label = `${engine}-${prefix ? 'young' : 'adult'}-${size.width}x${size.height}`;
  const {context,calls} = await contextFor(browser, engine, size);
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(String(error)));
  page.on('console', message => {if (message.type() === 'error') errors.push(message.text());});
  page.setDefaultTimeout(12000);
  try {
    await page.goto(base + prefix + 'index.html');
    await page.evaluate(() => window.speakingQA.setup());
    await reachable(page, '#micCheckBtn', label + ' mic check');
    await page.locator('#micCheckBtn').click();
    try {await page.locator('#startSpeakingBtn').waitFor();}
    catch (error) {throw new Error(label + ': ' + error.message + '\nUI: ' + await page.locator('#placementStageRoot').innerText() + '\nErrors: ' + errors.join('\n'));}
    await reachable(page, '#startSpeakingBtn', label + ' record');
    await page.locator('#startSpeakingBtn').click();
    await page.waitForFunction(() => window.speakingQA.state().recorderState === 'recording');
    await page.waitForTimeout(2400);
    await page.evaluate(() => window.speakingQA.age());
    await page.waitForFunction(() => !document.querySelector('#stopSpeakingBtn')?.disabled);
    await reachable(page, '#stopSpeakingBtn', label + ' finish');
    await page.locator('#stopSpeakingBtn').click();
    try {await page.locator('#retrySpeakingSubmitBtn').waitFor();}
    catch (error) {throw new Error(label + ': ' + error.message + '\nState: ' + JSON.stringify(await page.evaluate(() => window.speakingQA.state())) + '\nUI: ' + await page.locator('#placementStageRoot').innerText() + '\nCalls: ' + JSON.stringify(calls.map(call => ({url:call.url,keys:Object.keys(call.body)}))));}
    const first = calls.find(call => call.url.endsWith('SubmitSpeaking'));
    assert.ok(first, label + ': recording was not submitted');
    assert.ok(first.body.recordedBytes >= 1200, label + ': real recorder produced no usable bytes');
    assert.ok(/^audio\//.test(first.body.audioMimeType), label + ': missing recording format');
    assert.equal(first.body.transcriptAvailable, false, label + ': recognizer unexpectedly required');
    await reachable(page, '#retrySpeakingSubmitBtn', label + ' retained retry');
    if (output && size.width === 390) {
      fs.mkdirSync(output, {recursive:true});
      await page.screenshot({path:path.join(output, label + '-retry.png')});
    }
    await page.locator('#retrySpeakingSubmitBtn').click();
    await page.waitForFunction(() => window.speakingQA.state().status === 'completed');
    const submits = calls.filter(call => call.url.endsWith('SubmitSpeaking'));
    assert.equal(submits.length, 2, label + ': duplicated submission');
    assert.equal(submits[1].body.audioBase64, first.body.audioBase64, label + ': retry lost or changed recorded audio');
    assert.equal(submits[1].body.audioMimeType, first.body.audioMimeType, label + ': retry changed audio format');
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false, label + ': page overflows horizontally');
    console.log('PASS ' + label + ': real recording, provider retry, identical audio, completed result');
  } catch (error) {await failedPicture(page, label); throw error;}
  finally {await context.close();}
}

async function missing(browser, engine, prefix, base, mode = true, playbackAvailable = true) {
  const {context,calls} = await contextFor(browser, engine, {width:390,height:664}, mode);
  const page = await context.newPage();
  try {
    await page.goto(base + prefix + 'index.html');
    await page.evaluate(() => window.speakingQA.setup());
    if (mode === 'denied') {
      await page.locator('#micCheckBtn').click();
      await page.locator('#retrySpeakingBtn').waitFor();
    }
    await reachable(page, '#nativeSpeakingBtn', engine + ' native fallback');
    await page.locator('#nativeSpeakingBtn').click();
    await page.locator('input[type=file]').waitFor({state:'attached'});
    assert.ok((await page.locator('input[type=file]').getAttribute('accept')).includes('audio/*'));
    assert.ok(await page.locator('#placementStageRoot').innerText(), 'Native fallback has no prompt');
    if (mode !== 'denied' && playbackAvailable) {
      // A long uncompressed device recording forces the chunk transport.
      const wav = wave(35);
      await page.locator('#nativeSpeakingFile').setInputFiles({name:'speaking-qa.wav',mimeType:'audio/wav',buffer:wav});
      await page.locator('#nativeSpeakingPreview').waitFor({state:'visible'});
      await reachable(page, '#submitNativeSpeakingBtn', engine + ' native send');
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false, engine + ': native form overflows horizontally');
      if (output) {
        fs.mkdirSync(output, {recursive:true});
        await page.screenshot({path:path.join(output, `${engine}-${prefix ? 'young' : 'adult'}-native.png`),fullPage:true});
      }
      await page.locator('#submitNativeSpeakingBtn').click();
      await page.locator('#retrySpeakingSubmitBtn').waitFor();
      const first = calls.find(call => call.url.endsWith('SubmitSpeaking'));
      assert.equal(first.body.audioTransport, 'chunked', 'Native recording did not exercise chunking');
      assert.equal(first.body.captureMode, 'device-recorder');
      assert.ok(Math.abs(first.body.durationSeconds - 35) < .1, 'Native duration was not measured');
      await page.locator('#retrySpeakingSubmitBtn').click();
      await page.waitForFunction(() => window.speakingQA.state().status === 'completed');
      const submits = calls.filter(call => call.url.endsWith('SubmitSpeaking'));
      assert.equal(submits.length, 2);
      assert.notEqual(submits[0].body.audioUploadId, submits[1].body.audioUploadId, 'Retry reused expired chunk reference');
      const uploaded = id => calls.filter(call => call.url.endsWith('SpeakingChunk') && call.body.uploadId === id).sort((a,b) => a.body.chunkIndex-b.body.chunkIndex).map(call=>call.body.chunkBase64).join('');
      assert.equal(uploaded(submits[0].body.audioUploadId), wav.toString('base64'), 'Original file upload changed audio');
      assert.equal(uploaded(submits[1].body.audioUploadId), wav.toString('base64'), 'Chunked retry lost original audio');
    }
    console.log(`PASS ${engine}-${prefix ? 'young' : 'adult'}: native fallback available ${mode === 'denied' ? 'after microphone denial' : 'without browser capture APIs'}`);
  } catch (error) {await failedPicture(page, `${engine}-${prefix ? 'young' : 'adult'}-native-${mode === 'denied' ? 'denied' : 'missing'}`); throw error;}
  finally {await context.close();}
}

function wave(seconds) {
  const sampleRate = 8000;
  const samples = Math.round(seconds * sampleRate);
  const data = Buffer.alloc(44 + samples * 2);
  data.write('RIFF', 0); data.writeUInt32LE(data.length - 8, 4); data.write('WAVEfmt ', 8);
  data.writeUInt32LE(16, 16); data.writeUInt16LE(1, 20); data.writeUInt16LE(1, 22);
  data.writeUInt32LE(sampleRate, 24); data.writeUInt32LE(sampleRate * 2, 28); data.writeUInt16LE(2, 32); data.writeUInt16LE(16, 34);
  data.write('data', 36); data.writeUInt32LE(samples * 2, 40);
  for (let i=0; i<samples; i++) data.writeInt16LE(Math.round(Math.sin(i * 2 * Math.PI * 320 / sampleRate) * 6000), 44 + i * 2);
  return data;
}

async function interrupted(browser, engine, prefix, base, short) {
  const {context,calls} = await contextFor(browser, engine, {width:390,height:664});
  const page = await context.newPage();
  try {
    await page.goto(base + prefix + 'index.html');
    await page.evaluate(() => window.speakingQA.setup());
    await page.locator('#micCheckBtn').click();
    await page.locator('#startSpeakingBtn').waitFor();
    await page.locator('#startSpeakingBtn').click();
    await page.waitForFunction(() => window.speakingQA.state().recorderState === 'recording');
    await page.waitForTimeout(2400);
    if (!short) await page.evaluate(() => window.speakingQA.age());
    // Firefox ignores untrusted synthetic MediaStreamTrack mute events. Use the
    // registered page-background interruption path there; Chromium covers mute.
    await page.evaluate(engine => engine === 'firefox' ? window.speakingQA.hide() : window.speakingQA.mute(), engine);
    const send = page.locator('#sendInterruptedSpeakingBtn');
    try {await send.waitFor();}
    catch (error) {throw new Error(`${engine}-${prefix ? 'young' : 'adult'}-interrupted-${short}: ${error.message}\nUI: ${await page.locator('#placementStageRoot').innerText()}\nState: ${JSON.stringify(await page.evaluate(() => window.speakingQA.state()))}`);}
    await page.waitForTimeout(150);
    assert.equal(calls.filter(call => call.url.endsWith('SubmitSpeaking')).length, 0, 'Interrupted answer was submitted without confirmation');
    assert.equal(await send.isDisabled(), short, 'Interrupted short answer validation failed');
    if (!short) {
      await reachable(page, '#sendInterruptedSpeakingBtn', engine + ' interrupted send');
      await send.click();
      await page.locator('#retrySpeakingSubmitBtn').waitFor();
      assert.equal(calls.find(call => call.url.endsWith('SubmitSpeaking')).body.captureMode, 'interrupted-recorder');
    }
    console.log(`PASS ${engine}-${prefix ? 'young' : 'adult'}: ${short ? 'short interrupted answer cannot submit' : 'interrupted answer requires explicit confirmation'}`);
  } catch (error) {await failedPicture(page, `${engine}-${prefix ? 'young' : 'adult'}-interrupted-${short ? 'short' : 'long'}`); throw error;}
  finally {await context.close();}
}

(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}/Placement/`;
  const sizes = [{width:1440,height:900},{width:390,height:664},{width:844,height:390}].filter(size => !process.env.SPEAKING_QA_WIDTHS || process.env.SPEAKING_QA_WIDTHS.split(',').includes(String(size.width)));
  const wants = name => !process.env.SPEAKING_QA_CASES || process.env.SPEAKING_QA_CASES.split(',').includes(name);
  for (const engine of (process.env.SPEAKING_BROWSERS || 'chromium,firefox,webkit').split(',')) {
    const launchOptions = engine === 'chromium' && process.platform === 'win32'
      ? {channel:'msedge'}
      : engine === 'firefox'
        ? {firefoxUserPrefs:{'media.navigator.streams.fake':true,'media.navigator.permission.disabled':true}}
        : {};
    const browser = await playwright[engine].launch(launchOptions);
    try {
      const probe = await browser.newContext();
      await probe.route('**/*', route => route.request().url().startsWith('http://127.0.0.1:') ? route.continue() : route.abort());
      const probePage = await probe.newPage();
      await probePage.goto(base + 'index.html');
      const captureAvailable = await probePage.evaluate(() => typeof (window.AudioContext || window.webkitAudioContext) === 'function' && typeof MediaRecorder === 'function' && typeof MediaStream === 'function');
      const playbackAvailable = await probePage.evaluate(base64 => new Promise(resolve => {
        const audio = document.createElement('audio');
        const timer = setTimeout(() => resolve(false), 2000);
        audio.onloadedmetadata = () => {clearTimeout(timer);resolve(Number.isFinite(audio.duration) && audio.duration > 0);};
        audio.onerror = () => {clearTimeout(timer);resolve(false);};
        audio.src = 'data:audio/wav;base64,' + base64;
      }), wave(1).toString('base64'));
      await probe.close();
      if (!captureAvailable) console.log(`SKIP ${engine}: this installed browser build lacks Web Audio/MediaRecorder/MediaStream; fallback controls and permission recovery are still tested. Real capture requires another build or physical device.`);
      if (!playbackAvailable) console.log(`SKIP ${engine}: this installed browser build cannot decode WAV metadata; native file controls and permission recovery are tested, audio upload needs a media-enabled build.`);
      for (const prefix of ['', 'YoungLearners/']) {
        if (captureAvailable && wants('record')) for (const size of sizes) await run(browser, engine, size, prefix, base);
        if (wants('native')) await missing(browser, engine, prefix, base, true, playbackAvailable);
        if (wants('denied')) await missing(browser, engine, prefix, base, 'denied');
        if (captureAvailable && wants('short-interruption')) await interrupted(browser, engine, prefix, base, true);
        if (captureAvailable && wants('interruption')) await interrupted(browser, engine, prefix, base, false);
      }
    } finally {await browser.close();}
  }
})().catch(error => {console.error(error);process.exitCode = 1;}).finally(() => server.close());
