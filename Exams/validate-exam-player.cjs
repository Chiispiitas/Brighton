/* Real browser regression suite. All Wix traffic is intercepted; no student
   records, marks or live progress can be written by this test. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const playwright = require('playwright');
const root = path.resolve(__dirname, '..');
const exams = fs.readdirSync(path.join(__dirname, 'exams')).filter(name => fs.existsSync(path.join(__dirname, 'exams', name, 'index.html')) && (!process.env.EXAM_QA_EXAMS || process.env.EXAM_QA_EXAMS.split(',').includes(name)));
const output = process.env.EXAM_QA_OUTPUT;
if (output) fs.mkdirSync(output, {recursive:true});
const types = {'.html':'text/html', '.css':'text/css', '.js':'text/javascript', '.webp':'image/webp', '.png':'image/png', '.jpg':'image/jpeg', '.jpeg':'image/jpeg', '.svg':'image/svg+xml', '.mp3':'audio/mpeg', '.woff2':'font/woff2'};
const server = http.createServer((req, res) => {
  const file = path.resolve(root, '.' + decodeURIComponent(new URL(req.url, 'http://localhost').pathname));
  if (!file.startsWith(root + path.sep)) return res.writeHead(403).end();
  fs.readFile(file, (error, bytes) => {
    if(error)return res.writeHead(404).end('Not found');
    const headers={'Content-Type':types[path.extname(file)] || 'application/octet-stream','Accept-Ranges':'bytes'};
    const range=/^bytes=(\d+)-(\d*)$/.exec(req.headers.range || '');
    if(range){const start=Number(range[1]),end=Math.min(bytes.length-1,range[2]?Number(range[2]):bytes.length-1);res.writeHead(206,{...headers,'Content-Range':`bytes ${start}-${end}/${bytes.length}`,'Content-Length':end-start+1});return res.end(bytes.subarray(start,end+1));}
    res.writeHead(200,headers);res.end(bytes);
  });
});
const sizes = [{width:1440,height:900}, {width:768,height:1024}, {width:390,height:844}, {width:320,height:568}, {width:844,height:390}].filter(size=>!process.env.EXAM_QA_WIDTHS || process.env.EXAM_QA_WIDTHS.split(',').includes(String(size.width)));
const reports = [];
async function enterAudio(page) {
  if(!await page.locator('#playAudioBtn').isVisible()) return;
  try {await page.locator('#playAudioBtn').click();}
  catch(error) {if(await page.locator('#audioGate').isVisible()) throw error;}
}
async function picture(page, label) {if (output) await page.screenshot({path:path.join(output, label + '.png')});}
async function geometry(page, label) {
  await page.locator('#mainContent img').evaluateAll(async images => {
    await Promise.all(images.map(async image => {
      if (image.complete && image.naturalWidth) return;
      let timer;
      try {
        await Promise.race([
          image.decode(),
          new Promise((resolve, reject) => {timer=setTimeout(()=>reject(new Error('Image failed to load: '+image.src)),30000);})
        ]);
      } finally {clearTimeout(timer);}
    }));
  });
  const result = await page.evaluate(() => {
    const rect = selector => {const r = document.querySelector(selector).getBoundingClientRect(); return {x:r.x,y:r.y,w:r.width,h:r.height,right:r.right,bottom:r.bottom};};
    const shown = element => element.getClientRects().length && getComputedStyle(element).visibility !== 'hidden';
    return {
      width:innerWidth, height:innerHeight, pageWidth:document.documentElement.scrollWidth,
      header:rect('.top-header'), content:rect('.main-content'), footer:rect('.bottom-nav'), controls:rect('.step-controls'),
      brand:rect('.exam-header-brand'), menu:rect('#menuBtn'), notes:rect('#notesBtn'), flag:rect('#flagBtn'), student:rect('.student-chip'),
      overflow:[...document.querySelectorAll('#mainContent *')].filter(el=>shown(el) && el.getBoundingClientRect().right>innerWidth+2).map(el=>el.className).slice(0,8),
      broken:[...document.images].filter(el=>shown(el) && el.complete && !el.naturalWidth).map(el=>el.getAttribute('src')),
      titleY:document.querySelector('.part-title-row')?.getBoundingClientRect().top,
      scrollTop:document.querySelector('#mainContent').scrollTop,
      headingFont:getComputedStyle(document.querySelector('.part-title-row h2')).fontSize
    };
  });
  assert.ok(result.pageWidth <= result.width, label + ': page spills horizontally');
  assert.deepEqual(result.overflow, [], label + ': clipped question content');
  assert.deepEqual(result.broken, [], label + ': broken visible images');
  assert.ok(Math.abs(result.content.y-result.header.bottom)<2, label + ': header covers content');
  assert.ok(Math.abs(result.content.bottom-result.footer.y)<2, label + ': footer covers content');
  assert.ok(Math.abs(result.controls.y-result.footer.y)<2, label + ': arrows cover answers');
  assert.ok(result.footer.right<=result.controls.x+1, label + ': arrows cover question navigation');
  assert.equal(result.header.h, result.width<=600?96:64, label + ': inconsistent header height');
  assert.equal(result.footer.h, 100, label + ': inconsistent footer height');
  for (const key of ['menu','notes','flag']) assert.ok(result[key].w>=44 && result[key].h>=44, label + ': small touch target '+key);
  assert.equal(result.brand.w, result.width<=600?108:140, label + ': inconsistent logo');
  assert.ok(result.student.w>0 && result.student.h>0, label + ': student identity hidden');
  return result;
}
async function run(browser, engine, size, exam, base) {
  const context = await browser.newContext({viewport:size,hasTouch:size.width<600,reducedMotion:'reduce'});
  let submitted = 0;
  await context.route('**/*', async route => {
    if(['GET','HEAD'].includes(route.request().method())) return route.continue();
    const isSubmit=route.request().url().endsWith('/submitExam');
    if(isSubmit) submitted++;
    await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({success:!isSubmit || submitted>1,submissionId:'UI-QA',error:'UI QA: production writes disabled'})});
  });
  await context.addInitScript(() => {HTMLMediaElement.prototype.play=function(){this.dispatchEvent(new Event('playing')); return Promise.resolve();};});
  const page=await context.newPage(); page.setDefaultTimeout(6000); page.setDefaultNavigationTimeout(30000);
  const label=engine+'-'+exam+'-'+size.width;
  const errors=[]; page.on('pageerror',error=>errors.push(error.message));
  page.on('dialog',dialog=>dialog.accept());
  try {
    await page.goto(base+exam+'/index.html');
    await page.evaluate(()=>document.fonts.ready);
    assert.ok(await page.locator('#startScreen').isVisible(),label+': missing start screen');
    assert.equal(await page.locator('#examShell').isVisible(),false,label+': hidden shell intercepts start');
    if(size.width===390 || size.width===1440)await picture(page,label+'-start');
    await page.locator('#studentName').fill('Alexandra Brighton Compatibility');
    await page.locator('#classId').fill('QA-UI-LONG-CLASS');
    await page.locator('#studentForm button[type=submit]').click();
    await enterAudio(page);
    await page.locator('#examShell').waitFor({state:'visible'});
    const parts=await page.locator('.part-nav-title').evaluateAll(els=>els.map(el=>el.dataset.partId));
    const metrics=[];
    for(let i=0;i<parts.length;i++) {
      await page.locator('.part-nav-title').nth(i).click();
      await page.waitForTimeout(60);
      const measured=await geometry(page,label+' part '+(i+1)); metrics.push(measured);
      assert.ok(measured.scrollTop<2,label+': part instructions not visible');
      assert.ok(measured.titleY>=measured.header.bottom,label+': heading behind header');
      if(size.width===390 || size.width===1440) await picture(page,label+'-part'+(i+1));
      const editor=page.locator('#mainContent textarea.writing-textarea, #mainContent input.inline-input:not([readonly])').first();
      if(await editor.isVisible()) {
        const initial=await editor.inputValue();
        await editor.focus();
        await editor.press('ControlOrMeta+End');
        await editor.pressSequentially('QA');
        assert.equal(await editor.inputValue(),initial+'QA',label+': answer editor cannot accept typing');
      }
      const gaps=page.locator('#mainContent button[data-choice-gap], #mainContent button.cloze-gap[data-gap]');
      if(await gaps.count()) {
        await gaps.first().click();
        const popup=page.locator('.choice-popover');
        if(await popup.isVisible()) {
          const bounds=await popup.boundingBox();
          assert.ok(bounds.x>=0 && bounds.x+bounds.width<=size.width+1,label+': popup outside screen');
          assert.ok(bounds.y>=measured.header.bottom && bounds.y+bounds.height<=measured.footer.y+1,label+': popup covers navigation');
          await popup.locator('[data-popover-choice], [data-choice]').first().click();
          await popup.waitFor({state:'hidden'});
        }
      }
      // Render every numbered question, not only the first screen of each part.
      const count=await page.locator('.part-nav-card.active .q-pill').count();
      for(let q=0;q<count;q++) {
        await page.locator('.part-nav-card.active .q-pill').nth(q).click();
        await geometry(page,label+' part '+(i+1)+' question '+(q+1));
      }
    }
    await page.locator('#flagBtn').click();
    assert.ok((await page.locator('#flagBtn').getAttribute('class')).includes('flagged'),label+': flag failed');
    await page.locator('#notesBtn').click();
    await page.locator('#modalRoot .notes-area').fill('UI regression: private note');
    await page.waitForTimeout(70);
    const selectedQuestion = await page.locator('.q-pill.active').textContent();
    await page.keyboard.press('Tab');
    assert.ok(await page.locator('#modalRoot').evaluate(el=>el.contains(document.activeElement)),label+': focus escaped notes');
    await page.keyboard.press('ArrowLeft');
    assert.equal(await page.locator('.q-pill.active').textContent(),selectedQuestion,label+': dialog key changed question');
    await page.keyboard.press('Escape');
    await page.locator('#modalRoot').waitFor({state:'hidden'});
    assert.equal(await page.evaluate(()=>document.activeElement.id),'notesBtn',label+': focus not returned');
    await page.locator('#menuBtn').click(); await page.locator('#overviewBtn').click();
    await page.locator('#modalRoot').waitFor({state:'visible'});
    if(size.width===390) await picture(page,label+'-overview');
    await page.keyboard.press('Escape');
    await page.locator('#modalRoot').waitFor({state:'hidden'});
    await page.reload();
    if(await page.locator('#startScreen').isVisible()) await page.locator('#continueSavedBtn').click();
    await enterAudio(page);
    await page.locator('#notesBtn').click();
    assert.equal(await page.locator('#modalRoot .notes-area').inputValue(),'UI regression: private note',label+': local save lost');
    await page.keyboard.press('Escape');
    // Verify end-of-exam UI and network failure recovery without saving live marks.
    await page.locator('#menuBtn').click(); await page.locator('#submitMenuBtn').click();
    await page.locator('.finish-card').waitFor({state:'visible'});
    await page.waitForTimeout(100);
    if(size.width===390 || size.width===1440) await picture(page,label+'-finish');
    assert.ok(submitted>0,label+': submit not exercised');
    await page.locator('[data-retry-submission]').click();
    await page.waitForFunction(()=>document.getElementById('submitStatusBadge').textContent==='Saved');
    if(size.width===390 || size.width===1440)await picture(page,label+'-saved');
    await page.locator('#menuBtn').click(); await page.locator('#resetBtn').click();
    await page.locator('#startScreen').waitFor({state:'visible'});
    assert.equal(await page.locator('#studentName').inputValue(),'',label+': reset resurrected saved state');
    assert.deepEqual(errors,[],label+': runtime errors');
    reports.push({engine,exam,size,parts:parts.length,metrics});
    if(output)fs.writeFileSync(path.join(output,'browser-report.json'),JSON.stringify(reports,null,2));
    console.log('PASS',label,parts.length+' parts; every question, flag, notes, keyboard, resume, overview and submit recovery');
  } catch(error) {await picture(page,label+'-FAIL'); throw error;}
  finally {await context.close();}
}
async function storageCompatibility(browser, engine, exam, base) {
 const context=await browser.newContext({viewport:{width:390,height:844}});
 await context.route('**/brightonexams/_functions/**',r=>r.fulfill({status:200,contentType:'application/json',body:'{"success":false}'}));
 await context.addInitScript(()=>{
  Storage.prototype.setItem=function(){throw new DOMException('Storage unavailable','QuotaExceededError')};
  HTMLMediaElement.prototype.play=function(){return Promise.resolve()};
 });
 const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 try {
  await page.goto(base+exam+'/index.html');
  await page.locator('#studentName').fill('Storage Compatibility');await page.locator('#classId').fill('QA');
  await page.locator('#studentForm button[type=submit]').click();
  await enterAudio(page);
  await page.locator('#localSaveWarning').waitFor({state:'visible'});
  await page.locator('#nextBtn').click();
  await page.locator('#notesBtn').click();await page.locator('#modalRoot .notes-area').fill('Still usable without device storage');
  await page.keyboard.press('Escape');
  await context.setOffline(true);
  await page.locator('#notesBtn').click();
  assert.equal(await page.locator('#modalRoot .notes-area').inputValue(),'Still usable without device storage');
  assert.deepEqual(errors,[],engine+' '+exam+': blocked storage crashed player');
  console.log('PASS',engine,exam,'blocked storage + offline editing');
 }finally {await context.close();}
}
async function audioCompatibility(browser, engine, exam, base) {
 const context=await browser.newContext({viewport:{width:390,height:844}});
 await context.route('**/*',route=>['GET','HEAD'].includes(route.request().method())?route.continue():route.fulfill({status:200,contentType:'application/json',body:'{"success":true}'}));
 const page=await context.newPage();page.setDefaultTimeout(10000);page.setDefaultNavigationTimeout(30000);
 try {
  await page.goto(base+exam+'/index.html');
  await page.locator('#studentName').fill('Audio Compatibility');await page.locator('#classId').fill('QA');
  await page.locator('#studentForm button[type=submit]').click();
  assert.equal(await page.locator('#examAudio').evaluate(el=>el.paused),true);
  await page.locator('#examAudio').evaluate(el=>{el.muted=true;});
  await enterAudio(page);
  await page.waitForFunction(()=>document.getElementById('examAudio').currentTime>0.1);
  assert.equal(await page.locator('#audioGate').isVisible(),false);
  await page.locator('.part-nav-title').last().click();
  assert.equal(await page.locator('#examAudio').evaluate(el=>el.paused),false);
  const deadline=await page.evaluate(async()=>{
    const audio={play:()=>new Promise(()=>{}),pause(){this.paused=true;}};
    try{await window.BrightonApp.playExamAudio(audio,10);return false;}catch{return audio.paused===true;}
  });
  assert.equal(deadline,true);
  console.log('PASS',engine,exam,'real audio decoding/playback, gesture gate, part navigation and startup deadline');
 }finally{await context.close();}
}
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const base=process.env.EXAM_BASE || `http://127.0.0.1:${server.address().port}/Exams/exams/`;
 try {
  for(const engine of (process.env.EXAM_BROWSERS || 'chromium').split(',')) {
   const browser=await playwright[engine].launch({headless:true,...(engine==='chromium'&&process.platform==='win32'?{channel:'msedge'}:{})});
   try {
    for(const size of sizes) for(const exam of exams) await run(browser,engine,size,exam,base);
    for(const exam of exams)await storageCompatibility(browser,engine,exam,base);
    for(const exam of exams.filter(name=>name.includes('listening')))await audioCompatibility(browser,engine,exam,base);
   }
   finally {await browser.close();}
  }
  if(output)fs.writeFileSync(path.join(output,'browser-report.json'),JSON.stringify(reports,null,2));
  console.log(`PASS: ${reports.length} complete exam/browser/viewport scenarios.`);
 }finally {server.close();}
})().catch(error=>{console.error(error);process.exitCode=1;server.close();});
