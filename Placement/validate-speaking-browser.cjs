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
        setup(){session={sessionId:'browser-qa',clientSessionId:'browser-client',placementVersion:PLACEMENT_VERSION,moduleId:'speaking-a2',phase:'speaking',provisionalLevel:'A2',studentName:'Speaking Browser QA',status:'active'};currentModuleId='speaking-a2';saveLocalSession();renderSpeakingHandoff();},
        age(){speakingStartedAt=performance.now()-30000;},
        mute(){speakingStream.getAudioTracks()[0].dispatchEvent(new Event('mute'));},
        hide(){window.dispatchEvent(new Event('pagehide'));},
        sendDecodedFile(base64){const bytes=Uint8Array.from(atob(base64), c=>c.charCodeAt(0));return processSpeakingAudio(new Blob([bytes],{type:'audio/wav'}),35,{captureMode:'device-recorder'});},
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

async function contextFor(browser, engine, size, missingCapture = false, handleRequest) {
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
      if (handleRequest && await handleRequest({route, request, body})) return;
      let data = {success:true};
      if (request.url().endsWith('Resume')) data = {success:true,status:'active',phase:'speaking',moduleId:'speaking-a2'};
      if (request.url().endsWith('SubmitSpeaking') && body.gradeReceipt) {
        data = {success:true,status:'completed',finalLevel:'A2',result:gradedResult()};
      } else if (request.url().endsWith('SubmitSpeaking')) {
        submitted++;
        data = submitted === 1
          ? {success:true,speakingError:true,speakingErrorCode:'provider-server',providerStatus:503}
          : pendingReceipt();
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
    await page.waitForFunction(() => window.speakingQA.state().status === 'completed' && document.body.textContent.includes('4.3/10'));
    const submits = calls.filter(call => call.url.endsWith('SubmitSpeaking') && call.body.receiveOnly);
    assert.equal(submits.length, 2, label + ': expected two receipt submissions');
    assert.equal(submits[1].body.audioUploadId, first.body.audioUploadId, label + ': retry lost recorded upload');
    assert.equal(submits[1].body.audioMimeType, first.body.audioMimeType, label + ': retry changed audio format');
    assert.equal(calls.filter(call => call.body.gradeReceipt).length, 1, label + ': expected one grading request');
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false, label + ': page overflows horizontally');
    console.log('PASS ' + label + ': real recording, retried receipt, same upload and graded result');
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
      await page.waitForFunction(() => window.speakingQA.state().status === 'completed' && document.body.textContent.includes('4.3/10'));
      const submits = calls.filter(call => call.url.endsWith('SubmitSpeaking') && call.body.receiveOnly);
      assert.equal(submits.length, 2);
      const uploaded = submit => {
        const chunks = new Map();
        for (const call of calls.slice(0, calls.indexOf(submit))) {
          if (call.url.endsWith('SpeakingChunk') && call.body.uploadId === submit.body.audioUploadId) chunks.set(call.body.chunkIndex,call.body.chunkBase64);
        }
        return Array.from({length:submit.body.audioChunkCount}, (_, index) => chunks.get(index)).join('');
      };
      assert.equal(uploaded(submits[0]), wav.toString('base64'), 'Original file upload changed audio');
      assert.equal(uploaded(submits[1]), wav.toString('base64'), 'Chunked retry lost original audio');
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

function gradedResult() {
  return {
    finalLevel:'A2', studentName:'Speaking Browser QA', completedAt:new Date().toISOString(),
    skills:{speaking:{level:'A2',score:43,displayScore:'4.3/10',skipped:false}}
  };
}

function pendingReceipt() {
  const result = gradedResult();
  result.skills.speaking = {level:null,score:null,displayScore:'—',pending:true,skipped:false};
  return {success:true,speakingReceived:true,status:'completed',phase:'result',finalLevel:'A2',result};
}

// Close a real page during a multipart upload, reopen the saved session, then
// lose the final acknowledgement. The server mock retains only accepted bytes
// and the completed result. VM state from the closed page cannot help the retry.
async function interruptedUpload(browser, engine, prefix, base, playbackAvailable) {
  const label = `${engine}-${prefix ? 'young' : 'adult'}-upload-resume`;
  const wav = wave(35);
  const uploaded = new Map();
  const result = gradedResult();
  let interrupt = true, completed = false, receivedSubmissions = 0;
  let markInterruption;
  const interrupted = new Promise(resolve => { markInterruption = resolve; });
  async function handleRequest({route, request, body}) {
    if (request.method() !== 'POST') return false;
    const reply = data => route.fulfill({json:data,headers:{'access-control-allow-origin':'*'}});
    if (request.url().endsWith('SpeakingChunk')) {
      if (!uploaded.has(body.uploadId)) uploaded.set(body.uploadId, new Map());
      const chunks = uploaded.get(body.uploadId);
      if (chunks.has(body.chunkIndex)) {
        assert.equal(chunks.get(body.chunkIndex), body.chunkBase64, `${label}: duplicate chunk changed the audio`);
      } else {
        chunks.set(body.chunkIndex,body.chunkBase64);
      }
      if (body.chunkIndex === 1 && interrupt) {
        // The server accepted this chunk but the page never saw its acknowledgement.
        await route.abort('connectionreset');
        markInterruption();
        return true;
      }
      await reply({ success:true });
      return true;
    }
    if (request.url().endsWith('SubmitSpeaking')) {
      assert.equal(body.receiveOnly,true,`${label}: expected upload confirmation request`);
      receivedSubmissions++;
      const chunks = uploaded.get(body.audioUploadId);
      assert.ok(chunks, `${label}: final request referenced missing upload`);
      assert.equal(chunks.size,body.audioChunkCount,`${label}: incomplete upload finalized`);
      assert.equal(Array.from({length:body.audioChunkCount}, (_, i) => chunks.get(i)).join(''),wav.toString('base64'),`${label}: recovery changed recorded bytes`);
      assert.equal(body.captureMode,'device-recorder',`${label}: recovery lost capture metadata`);
      completed = true;
      await route.abort('connectionreset');
      return true;
    }
    if (completed && (request.url().endsWith('Resume') || request.url().endsWith('Result'))) {
      await reply({success:true,status:'completed',phase:'result',finalLevel:'A2',result});
      return true;
    }
    return false;
  }
  const {context,calls} = await contextFor(browser,engine,{width:390,height:664},true,handleRequest);
  let page = await context.newPage();
  const url = base + prefix + 'index.html';
  try {
    await page.goto(url);
    await page.evaluate(() => window.speakingQA.setup());
    if (playbackAvailable) {
      await page.locator('#nativeSpeakingBtn').click();
      await page.locator('#nativeSpeakingFile').setInputFiles({name:'upload-resume.wav', mimeType:'audio/wav', buffer:wav});
      await page.locator('#submitNativeSpeakingBtn').click();
    } else {
      // A WebKit build without local codecs can still exercise IndexedDB,
      // FileReader and browser fetch once a recording and duration exist.
      await page.evaluate(base64 => {void window.speakingQA.sendDecodedFile(base64);},wav.toString('base64'));
    }
    let timeout;
    try { await Promise.race([interrupted, new Promise((_,reject) => { timeout = setTimeout(() => reject(new Error(`${label}: second chunk never reached the service`)),12000); })]); }
    finally { clearTimeout(timeout); }
    await page.close();
    interrupt = false;
    page = await context.newPage();
    await page.goto(url);
    await page.locator('#retrySpeakingSubmitBtn').click({timeout:10000});
    await page.waitForFunction(() => window.speakingQA.state().status === 'completed',undefined,{timeout:20000});
    assert.equal(uploaded.size,1,`${label}: resuming created a second upload`);
    assert.equal(calls.filter(call => call.url.endsWith('SpeakingChunk') && call.body.chunkIndex === 0).length,1,`${label}: resuming resent an acknowledged chunk`);
    assert.ok(calls.filter(call => call.url.endsWith('SpeakingChunk') && call.body.chunkIndex === 1).length >= 2,`${label}: lost chunk acknowledgement was never retried`);
    assert.equal(receivedSubmissions,1,`${label}: sent audio again after server confirmed completion`);
    assert(!calls.some(call => call.url.endsWith('SkipSpeaking')), `${label}: network failure skipped Speaking`);
    await page.waitForFunction(() => new Promise((resolve,reject) => {
      const open = indexedDB.open('brighton-placement-recordings');
      open.onerror = () => reject(open.error);
      open.onsuccess = () => {
        const db = open.result;
        const count = db.transaction('pending').objectStore('pending').count();
        count.onerror = () => {db.close();reject(count.error);};
        count.onsuccess = () => {db.close();resolve(count.result === 0);};
      };
    }));
    console.log(`PASS ${label}: recovered exact audio after interrupted chunk and page close, recovered lost final acknowledgement without duplicate submission`);
  } catch(error) {await failedPicture(page,label);throw error;}
  finally {await context.close();}
}

async function unavailableStorage(browser, engine, prefix, base) {
  const label = `${engine}-${prefix ? 'young' : 'adult'}-unavailable-storage`;
  const {context,calls} = await contextFor(browser,engine,{width:390,height:664},true);
  await context.addInitScript(() => {
    Object.defineProperty(window,'indexedDB',{configurable:true,get() {throw new DOMException('Local storage unavailable','SecurityError');}});
  });
  const page = await context.newPage();
  try {
    await page.goto(base + prefix + 'index.html');
    await page.evaluate(() => window.speakingQA.setup());
    await page.evaluate(base64 => {void window.speakingQA.sendDecodedFile(base64);},wave(12).toString('base64'));
    await page.locator('#retrySpeakingSubmitBtn').waitFor();
    assert.match(await page.locator('#placementStageRoot').innerText(),/keep this page open/i, label);
    await page.locator('#retrySpeakingSubmitBtn').click();
    await page.waitForFunction(() => document.body.innerText.includes('4.3/10'));
    assert.equal(new Set(calls.filter(call => call.body.receiveOnly).map(call => call.body.audioUploadId)).size,1,label);
    console.log('PASS ' + label + ': storage unavailable, candidate sees in-tab retry guidance and can send the same recording');
  } catch (error) {await failedPicture(page,label);throw error;}
  finally {await context.close();}
}

// The server has received the recording, then the grading connection drops.
// A returning candidate must see their pending receipt and get their score
// when it becomes available, without accessing the microphone or uploading again.
async function pendingGrade(browser, engine, prefix, base) {
  const label = `${engine}-${prefix ? 'young' : 'adult'}-pending-grade`;
  let received = false, graded = false, gradingCalls = 0, markGradeDrop;
  const droppedGrade = new Promise(resolve => {markGradeDrop = resolve;});
  async function handleRequest({route,request,body}) {
    const reply = data => route.fulfill({json:data,headers:{'access-control-allow-origin':'*'}});
    if (request.url().endsWith('SubmitSpeaking')) {
      if (body.gradeReceipt) {
        assert(received,`${label}: grading started before the server received audio`);
        assert(!body.audioBase64,`${label}: grading sent audio again`);
        gradingCalls++;
        if (graded) await reply({success:true,finalLevel:'A2',result:gradedResult()});
        else {
          await route.abort('connectionreset');
          markGradeDrop();
        }
      } else {
        assert.equal(body.receiveOnly,true,`${label}: expected explicit receipt request`);
        received = true;
        await reply(pendingReceipt());
      }
      return true;
    }
    if (received && (request.url().endsWith('Result') || request.url().endsWith('Resume'))) {
      await reply(graded ? {success:true,status:'completed',phase:'result',finalLevel:'A2',result:gradedResult()} : pendingReceipt());
      return true;
    }
    return false;
  }
  const {context,calls} = await contextFor(browser,engine,{width:390,height:664},true,handleRequest);
  let page = await context.newPage();
  page.setDefaultTimeout(15000);
  try {
    const url = base + prefix + 'index.html';
    await page.goto(url);
    await page.evaluate(() => window.speakingQA.setup());
    await page.evaluate(base64 => { void window.speakingQA.sendDecodedFile(base64); },wave(15).toString('base64'));
    await page.locator('#refreshSpeakingResultBtn').waitFor();
    await page.waitForFunction(() => /pending/i.test(document.body.innerText));
    let timer;
    try {await Promise.race([droppedGrade,new Promise((_,reject) => {timer=setTimeout(()=>reject(new Error(label + ': grading request never reached the server')),10000);})]);}
    finally {clearTimeout(timer);}
    await page.close();
    page = await context.newPage();
    await page.goto(url);
    await page.locator('#refreshSpeakingResultBtn').waitFor();
    const body = await page.locator('body').innerText();
    assert.match(body,/pending/i,`${label}: saved result omitted pending status`);
    assert.doesNotMatch(body,/Speaking skipped/i,`${label}: received audio displayed as skipped`);
    graded = true;
    await page.locator('#refreshSpeakingResultBtn').click();
    await page.waitForFunction(() => document.body.textContent.includes('4.3/10'));
    assert.ok(gradingCalls > 0,`${label}: never attempted grading`);
    assert.equal(calls.filter(call => call.body.receiveOnly).length,1,`${label}: resubmitted received audio`);
    assert(!calls.some(call => call.url.endsWith('SkipSpeaking')),`${label}: discarded received audio`);
    console.log(`PASS ${label}: reload kept a confirmed receipt through a lost grading connection, refresh showed the saved mark`);
  } catch(error) {await failedPicture(page,label);throw error;}
  finally {await context.close();}
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
        if (wants('upload-resume')) await interruptedUpload(browser,engine,prefix,base,playbackAvailable);
        if (wants('pending-grade')) await pendingGrade(browser,engine,prefix,base);
        if (wants('unavailable-storage')) await unavailableStorage(browser,engine,prefix,base);
        if (wants('denied')) await missing(browser, engine, prefix, base, 'denied');
        if (captureAvailable && wants('short-interruption')) await interrupted(browser, engine, prefix, base, true);
        if (captureAvailable && wants('interruption')) await interrupted(browser, engine, prefix, base, false);
      }
    } finally {await browser.close();}
  }
})().catch(error => {console.error(error);process.exitCode = 1;}).finally(() => server.close());
