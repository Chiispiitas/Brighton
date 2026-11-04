import{createRequire}from'node:module';import fs from'node:fs';import path from'node:path';import{fileURLToPath}from'node:url';
const require=createRequire(import.meta.url),{chromium}=require('C:/Users/David/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const app=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),out=path.join(app,'reports/root-browser');fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
const context=await browser.newContext({viewport:{width:1440,height:1000}}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.goto(process.env.HZ_APP_URL||'http://127.0.0.1:8875/Horizons/App/',{waitUntil:'domcontentloaded'});await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(1200);await page.screenshot({path:path.join(out,'welcome-desktop.png'),fullPage:true});
console.log(JSON.stringify({errors,headings:await page.getByRole('heading').allTextContents(),inputs:await page.locator('input').evaluateAll(xs=>xs.map(x=>({name:x.name,id:x.id,type:x.type,placeholder:x.placeholder}))),buttons:await page.getByRole('button').allTextContents()}));
await page.setViewportSize({width:390,height:844});await page.waitForTimeout(250);await page.screenshot({path:path.join(out,'welcome-mobile.png'),fullPage:true});
if(process.argv.includes('--login')){
 await page.setViewportSize({width:1440,height:1000});await page.locator('#book-code').fill('DEMO-HZ-A1-005');await page.getByRole('button',{name:/Let’s go/}).click();
 await page.waitForFunction(()=>!document.querySelector('#book-code'),{timeout:45000});await page.waitForTimeout(1500);await page.screenshot({path:path.join(out,'after-login.png'),fullPage:true});
 console.log(JSON.stringify({afterLogin:{headings:await page.getByRole('heading').allTextContents(),buttons:await page.getByRole('button').allTextContents(),text:(await page.locator('body').innerText()).slice(0,4000)},errors}));
}
await browser.close();if(errors.length)process.exitCode=1;
