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
  const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream'] });
  const sim = require('./wix-simulator.cjs')(); const writes = [], errors = []; let failCamera = false;
  const source = { sourceRole: 'study', word: 'bell', level: '4TH-5TH', difficulty: 'easy', wordToken: 'test:1:bell', wordSequence: 1, hiddenMode: true };
  await sim.request('spellingBeeSession', 'POST', '5678', {sessionCode:'5678', state:source});
  const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
  const until = async predicate => { const end=Date.now()+20000; while(Date.now()<end){if(await predicate())return;await pause(80);}throw Error('Condition did not become true'); };
  async function page(name) {
    const context = await browser.newContext({viewport:{width:1920,height:1080},permissions:['camera']});
    await context.addInitScript(() => {
      window.cameraCalls=[];const original=navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
      navigator.mediaDevices.getUserMedia=async constraints=>{window.cameraCalls.push(constraints);const stream=await original(constraints);window.testCameraStream=stream;return stream;};
    });
    await context.route('https://fonts.googleapis.com/**',route=>route.abort());
    await context.route('**/cms-server/_functions/**',async route=>{const req=route.request(),url=new URL(req.url()),endpoint=url.pathname.split('/').pop();const body=req.method()==='POST'?req.postDataJSON():null;
      if(body)writes.push({name,body,endpoint});if(failCamera && body?.state?.screenCameraPreview && body.state.active)return route.fulfill({status:500,json:{success:false,error:'WDE0014: Requests per minute quota exceeded.'}});await route.fulfill(await sim.request(endpoint,req.method(),body?.sessionCode||url.searchParams.get('sessionCode'),body));});
    const p=await context.newPage();p.on('pageerror',e=>errors.push(name+': '+e.message));return p;
  }
  const photos = () => writes.filter(w=>w.body.state.screenCameraPreview && w.body.state.active);
  try {
    const admin=await page('admin');await admin.clock.install();await admin.goto(base+'/admin.html?session=5678');await admin.locator('#join-session-button').click();await admin.locator('#director-status').filter({hasText:'Screen connected'}).waitFor();
    await admin.locator('#roster-paste').fill(Array.from({length:10},(_,i)=>(i?'Alexandra María de los Ángeles Fernández Rodríguez Mendoza '+i:'Isabella Martinez')+' | Grade 6, English class | '+(i+1)).join('\n'));await admin.locator('#roster-add').click();await admin.locator('#screen-current').selectOption({index:1});
    for(let i=0;i<6;i++)await admin.locator('#roster-rows .roster-status').nth(i).selectOption('finalist');
    for(let i=0;i<3;i++)await admin.locator('#roster-rows .roster-place').nth(i).selectOption(String(i+1));
    await admin.locator('#lives-set-all').click();await admin.locator('#screen-show-lives').check();
    await admin.locator('#screen-layout').selectOption('stream');await admin.locator('[data-scene=spelling]').click();await admin.locator('#screen-take').click();await admin.locator('#director-status').filter({hasText:'Scene is live'}).waitFor();
    assert.equal(await admin.locator('#open-screen').getAttribute('href'),'screen.html?session=5678&view=stage');
    assert.equal(await admin.locator('#open-camera-screen').getAttribute('href'),'screen.html?session=5678&view=camera');
    const screen=await page('screen');await screen.clock.install();await screen.goto(base+'/'+await admin.locator('#open-camera-screen').getAttribute('href'));await screen.locator('#broadcast[data-layout=stream]').waitFor();await screen.locator('#camera-start').click();
    await screen.locator('#broadcast.camera-active').waitFor();await until(()=>photos().length===1);
    assert.equal(await screen.evaluate(()=>window.cameraCalls[0].audio),false);
    assert.equal(await admin.evaluate(()=>window.cameraCalls.length),0);
    assert.equal(await admin.frameLocator('#screen-preview').locator('video').count(),0,'Admin preview never has live video');
    const cameraCode=photos()[0].body.sessionCode, broadcastCode=await M.broadcastCode('5678');
    assert.notEqual(cameraCode,broadcastCode);assert.notEqual(cameraCode,'5678');
    assert.match(cameraCode,/^97\d{18}$/);assert(photos()[0].body.state.image.length<60000);
    await admin.clock.fastForward(18000);await admin.frameLocator('#screen-preview').locator('#camera-still:not(.hidden)').waitFor();
    const firstImage=await admin.frameLocator('#screen-preview').locator('#camera-still').getAttribute('src');
    await screen.clock.fastForward(10000);await pause(200);assert.equal(photos().length,1,'no frequent screenshots');
    await screen.clock.fastForward(6000);await until(()=>photos().length===2);
    assert.equal(await admin.frameLocator('#screen-preview').locator('#camera-still').getAttribute('src'),firstImage,'no live feed in Admin');
    await admin.clock.fastForward(18000);await until(async()=>await admin.frameLocator('#screen-preview').locator('#camera-still').getAttribute('src')===photos()[1].body.state.image);
    const stageScreen=await page('stageScreen');await stageScreen.goto(base+'/'+await admin.locator('#open-screen').getAttribute('href'));
    await stageScreen.locator('#broadcast[data-layout=stage][data-scene=spelling]').waitFor();
    assert.equal(await stageScreen.locator('video,#camera-still,#camera-toggle,#camera-setup').count(),0,'stage output has no camera elements or controls');
    assert.equal(await stageScreen.evaluate(()=>window.cameraCalls.length),0);
    await admin.locator('#screen-definition').fill('A very long clue that explains a meaning in simple words for people who are learning English. '.repeat(6).slice(0,500));
    await admin.locator('#screen-definition').dispatchEvent('input');
    await admin.locator('#screen-example').fill('The person will use _____ in a simple sentence about school and everyday life. '.repeat(7).slice(0,500));
    await admin.locator('#screen-example').dispatchEvent('input');
    // Both modes use the same public scene contract. Camera imagery stays outside it.
    for(const [scene]of M.scenes){
      await admin.locator(scene==='result'?'[data-scene=result][data-result=pending]':`[data-scene=${scene}]`).click();await admin.locator('#screen-take').click();await admin.locator('#director-status').filter({hasText:'Scene is live'}).waitFor();
      await screen.locator(`#broadcast[data-scene=${scene}]`).waitFor();await screen.locator('#logo-sweep').waitFor({state:'hidden'});
      await stageScreen.locator(`#broadcast[data-layout=stage][data-scene=${scene}]`).waitFor();
      assert.equal(await stageScreen.locator('#broadcast').getAttribute('data-revision'),await screen.locator('#broadcast').getAttribute('data-revision'),'both outputs follow the same revision');
      assert.equal(await stageScreen.evaluate(()=>window.cameraCalls.length),0,'stage output never requests the webcam');
      const reveal=await screen.locator('#scene').innerText();if(scene!=='result')assert(!/\bbell\b/i.test(reveal));
      assert.equal(await screen.evaluate(()=>window.cameraCalls.length),1,'scene transitions do not restart the webcam');
      const outside=await screen.locator('#scene .headline,#scene .quote,#scene .contestant-card,#scene .podium-card').evaluateAll(els=>{const stage=document.getElementById('broadcast').getBoundingClientRect();return els.some(el=>{const b=el.getBoundingClientRect();return b.bottom>stage.bottom+1||b.right>stage.right+1||b.left<stage.left-1||b.top<stage.top-1;});});assert.equal(outside,false,'overlay content fits the broadcast frame: '+scene);
      if(scene==='board')assert.equal(await screen.locator('.contestant-card').count(),8);
      if(scene==='finalists')assert.equal(await screen.locator('.finalist-card').count(),6);
      const stage=await screen.locator('#broadcast').boundingBox();const overlays=await screen.locator('#scene').boundingBox();
      assert(overlays.x>=stage.x && overlays.x+overlays.width<=stage.x+stage.width+1);
      if(['spelling','definition','result','board'].includes(scene)&&screenshots){await screen.screenshot({path:path.join(screenshots,'stream-'+scene+'.png')});await admin.locator('#screen-director').screenshot({path:path.join(screenshots,'admin-stream-'+scene+'.png')});}
    }
    const broadcast=[...sim.collections.get('SpellingBeeSessions').values()].find(row=>row.sessionCode===broadcastCode);assert(!broadcast.presenterStateJson.includes('data:image'));
    const privateSource=[...sim.collections.get('SpellingBeeSessions').values()].find(row=>row.sessionCode==='5678');assert.equal(JSON.parse(privateSource.presenterStateJson).word,'bell');
    await admin.locator('#screen-layout').selectOption('stage');await admin.locator('#screen-take').click();await admin.locator('#director-status').filter({hasText:'Scene is live'}).waitFor();
    await stageScreen.locator('#broadcast[data-layout=stage]').waitFor();assert.equal(await screen.locator('#broadcast[data-layout=stream].camera-active').count(),1,'camera output keeps its feed when preview layout changes');
    await stageScreen.reload();await stageScreen.locator('#broadcast[data-layout=stage]').waitFor();await stageScreen.close();
    const cameraRow=[...sim.collections.get('SpellingBeeSessions').values()].find(row=>row.sessionCode===cameraCode);assert.equal(JSON.parse(cameraRow.presenterStateJson).active,true,'closing the camera-free output cannot clear camera preview stills');
    const defaultScreen=await page('defaultScreen');await defaultScreen.goto(base+'/screen.html?session=5678');await defaultScreen.locator('#broadcast[data-layout=stage]').waitFor();await defaultScreen.close();
    await admin.locator('#screen-layout').selectOption('stream');await admin.locator('#screen-take').click();await admin.locator('#director-status').filter({hasText:'Scene is live'}).waitFor();
    failCamera=true;const beforeFailure=photos().length;await screen.clock.fastForward(20000);await until(()=>photos().length>beforeFailure);
    assert.equal(await screen.locator('#broadcast.camera-active').count(),1,'preview upload failure does not interrupt live camera');
    const failedCount=photos().length;await screen.clock.fastForward(20000);await pause(100);assert.equal(photos().length,failedCount,'new captures respect upload-failure backoff');
    failCamera=false;await screen.clock.fastForward(125000);await until(()=>{const row=[...sim.collections.get('SpellingBeeSessions').values()].find(row=>row.sessionCode===cameraCode);return JSON.parse(row.presenterStateJson).capturedAt===photos().at(-1).body.state.capturedAt;});
    await screen.locator('#camera-stop').evaluate(el=>el.click());await screen.locator('#camera-feed.hidden').waitFor({state:'attached'});assert.equal(await screen.evaluate(()=>window.testCameraStream.getTracks().every(track=>track.readyState==='ended')),true);
    await admin.clock.fastForward(18000);await admin.frameLocator('#screen-preview').locator('#camera-still.hidden').waitFor({state:'attached'});
    await screen.evaluate(()=>{navigator.mediaDevices.getUserMedia=async()=>{const error=new Error('denied');error.name='NotAllowedError';throw error;};});await screen.locator('#camera-start').evaluate(el=>el.click());await screen.locator('#camera-status').filter({hasText:'permission was not granted'}).waitFor();
    await admin.locator('#screen-layout').selectOption('stage');await admin.locator('#screen-take').click();await admin.locator('#director-status').filter({hasText:'Scene is live'}).waitFor();await screen.locator('#broadcast[data-layout=stream]').waitFor();
    assert.deepEqual(errors,[]);console.log('Passed: live fake webcam, all 12 overlay scenes, Admin still-only preview, 15-second snapshot pacing, cross-device Wix delivery, separate camera storage, no audio, camera stop/permission denial, synchronized camera and camera-free outputs, independent layouts and legacy links.');
  } finally {await browser.close();server.close();}
})().catch(error=>{console.error(error);server.close();process.exit(1);});
