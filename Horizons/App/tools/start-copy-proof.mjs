import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url);
const {chromium}=require('C:/Users/David/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
const page=await browser.newPage();
try{
 await page.goto(process.env.HZ_APP_URL||'http://127.0.0.1:8898/Horizons/App/');await page.locator('#redeem-form').waitFor();
 for(const width of [320,390,768,1440]){
  await page.setViewportSize({width,height:900});await page.waitForTimeout(400);
  assert.equal(await page.locator('.welcome-story h1,.welcome-story>p,.welcome-footnote').count(),0);
  assert.equal(await page.locator('.welcome-brand .wordmark').count(),1);
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await page.screenshot({path:'C:/Users/David/Documents/Codex/2026-11-04/start-screen-'+width+'.png'});
 }
 console.log('PASS start screen at four widths; wordmark and form preserved');
}finally{await browser.close();}
