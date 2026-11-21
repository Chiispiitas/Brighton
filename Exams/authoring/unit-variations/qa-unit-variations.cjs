const {chromium}=require('playwright'),fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert/strict');
const root=path.resolve(__dirname,'../../..');const c={window:{location:{pathname:'/Exams/tests.html'}}};vm.runInNewContext(fs.readFileSync(path.join(root,'Exams/config.js'),'utf8'),c);
const tests=c.window.BRIGHTON_SITE_CONFIG.FALLBACK_TESTS.filter(t=>/-variation-1$/.test(t.testId));
(async()=>{const b=await chromium.launch({channel:'msedge',headless:true});let requests=0;
for(const [index,t] of tests.entries()){
  const p=await b.newPage({viewport:{width:index%2?1280:375,height:850}});const errors=[];p.on('pageerror',e=>errors.push(e.message));p.on('dialog',d=>d.accept());let submitted;
  await p.route('**/*',async route=>{
    const u=new URL(route.request().url());
    if(u.hostname!=='local.test'){
      if(u.pathname.endsWith('/submitTest')) {submitted=JSON.parse(route.request().postData());requests++;return route.fulfill({json:{success:true,submissionId:'LOCAL-QA-ONLY'}});}
      return route.fulfill({json:{success:true}});
    }
    const name=decodeURIComponent(u.pathname).replace(/\/$/,'/index.html');const file=path.join(root,name);
    if(!fs.existsSync(file))return route.fulfill({status:404,body:'missing '+name});
    const ext=path.extname(file);return route.fulfill({body:fs.readFileSync(file),contentType:({'.html':'text/html','.js':'application/javascript','.css':'text/css','.json':'application/json','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml'})[ext]||'application/octet-stream'});
  });
  await p.goto('https://local.test/Exams/'+t.relativeUrl);
  await p.locator('#studentName').fill('Local QA');await p.locator('#classId').fill('QA-LOCAL');await p.locator('#studentForm button[type="submit"]').click();
  const key=JSON.parse(fs.readFileSync(path.join(root,'Exams/answer-keys',t.testId+'.json'),'utf8'));
  const count=await p.evaluate(()=>window.BRIGHTON_TEST_DATA.pages.length);
  for(let page=0;page<count;page++){
    await p.evaluate(answers=>{for(const button of document.querySelectorAll('[data-answer-question]')) if(answers[button.dataset.answerQuestion].answers[0]===button.dataset.answerValue)button.click()},key.answers);
    assert.equal(await p.locator(".question-card").count(),await p.evaluate(i=>window.BRIGHTON_TEST_DATA.pages[i].questions.length,page));
    assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'overflow '+t.testId);
    await p.locator('#nextPageBtn').click();
  }
  await p.locator('.student-results').waitFor();assert(submitted,'submit payload');assert(submitted.testId.startsWith(t.testId));assert.equal(submitted.answeredCount,t.totalQuestions);
  assert((await p.locator('.student-results').innerText()).includes('100%'),'full marks '+t.testId);
  assert.equal(errors.length,0,errors.join(';'));console.log('PASS player, pages, submit payload and 100% score',t.testId);await p.close();
}
await b.close();assert.equal(requests,tests.length);console.log('PASS '+tests.length+' variations; all save requests intercepted locally; no real student records created.');})().catch(e=>{console.error(e);process.exit(1)});
