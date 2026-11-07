/* Entry-screen regression: browser automation must not scroll clipped form
   controls into view on the candidate's behalf. No submissions are sent. */
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const assert = require('node:assert/strict');
const playwright = require('playwright');
const root = path.resolve(__dirname, '..');
const exams = fs.readdirSync(path.join(__dirname, 'exams')).filter(name =>
  fs.existsSync(path.join(__dirname, 'exams', name, 'index.html')) &&
  (!process.env.EXAM_QA_EXAMS || process.env.EXAM_QA_EXAMS.split(',').includes(name)));
const server = http.createServer((req, res) => {
  const file = path.resolve(root, '.' + new URL(req.url, 'http://localhost').pathname);
  if (!file.startsWith(root + path.sep)) return res.writeHead(403).end();
  fs.readFile(file, (error, data) => {
    if (error) return res.writeHead(404).end();
    const type = {'.css':'text/css', '.js':'text/javascript', '.html':'text/html'}[path.extname(file)];
    res.writeHead(200, {'Content-Type':type || 'application/octet-stream'}).end(data);
  });
});
(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = process.env.EXAM_BASE || `http://127.0.0.1:${server.address().port}/Exams/exams/`;
  for (const engine of (process.env.EXAM_BROWSERS || 'webkit').split(',')) {
    const browser = await playwright[engine].launch(engine === 'chromium' ? {channel:'msedge'} : {});
    try {
      const context = await browser.newContext({hasTouch:true, isMobile:true});
      await context.route('**/*', route => ['GET','HEAD'].includes(route.request().method()) ? route.continue() : route.abort());
      const page = await context.newPage();
      for (const exam of exams) {
        for (const viewport of [{width:390,height:664}, {width:375,height:340}, {width:320,height:480}, {width:844,height:280}]) {
          await page.setViewportSize(viewport);
          await page.goto(base + exam + '/index.html');
          await page.evaluate(() => document.fonts.ready);
          const result = await page.evaluate(() => {
            const screen = document.querySelector('#startScreen');
            const card = screen.querySelector('.start-card');
            screen.scrollTop = screen.scrollHeight;
            const button = document.querySelector('#studentForm button[type="submit"]');
            const rect = button.getBoundingClientRect();
            const cardRect = card.getBoundingClientRect();
            const hit = document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2);
            return {reachable:rect.top >= 0 && rect.bottom <= innerHeight && cardRect.bottom >= rect.bottom && (hit === button || button.contains(hit)), cardHeight:card.clientHeight, contentHeight:card.scrollHeight};
          });
          assert.ok(result.reachable, `${engine} ${exam} ${viewport.width}x${viewport.height}: Start exam is clipped: ${JSON.stringify(result)}`);
          await page.locator('#studentName').fill('QA Scroll');
          await page.locator('#classId').fill('QA-SCROLL');
          await page.locator('#studentForm button[type="submit"]').click({trial:true});
          if (process.env.EXAM_QA_OUTPUT && exam === 'b2-writing-variation-1' && viewport.width === 390) {
            fs.mkdirSync(process.env.EXAM_QA_OUTPUT, {recursive:true});
            await page.screenshot({path:path.join(process.env.EXAM_QA_OUTPUT, engine + '-iphone-entry.png')});
          }
        }
      }
      console.log(`PASS ${engine}: ${exams.length} entry screens, four phone/keyboard/landscape sizes each`);
    } finally { await browser.close(); }
  }
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => server.close());
