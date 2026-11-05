import {createRequire} from 'node:module';
import fs from 'node:fs';import path from 'node:path';
const require=createRequire(import.meta.url),{chromium}=require('C:/Users/David/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const base=process.env.HZ_APP_URL||'http://127.0.0.1:8898/Horizons/App/',out=process.env.HZ_WORLD_OUTPUT||'C:/Users/David/Documents/Codex/2026-11-05/overworld-preview';fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
const context=await browser.newContext({viewport:{width:1440,height:1100},serviceWorkers:'block'});
await context.addCookies([{url:base,name:'hz_companion_session',value:'fictional-overworld-preview'}]);
await context.route('**/api/horizons',route=>route.fulfill({contentType:'application/json',body:JSON.stringify({profile:{displayName:'Town Explorer',avatar:{body:'female',skin:'skin-3',hair:'hair-9',outfit:'outfit-3',background:'bg-mint',hairColor:'color-auburn'}},books:[{id:'horizons-a1',level:'A1',status:'active',expiresAt:'2030-01-01T00:00:00Z'}],progress:{xp:120,streak:3}})}));
const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(base);await page.locator('.overworld-map').waitFor();
await page.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.images].map(img=>img.decode().catch(()=>{})));});await page.waitForTimeout(700);
await page.screenshot({path:path.join(out,'desktop.png'),fullPage:true});
for(let i=0;i<4;i++){
 await page.locator('.path-lesson').nth(i).evaluate(el=>el.scrollIntoView({inline:'start',block:'nearest',behavior:'instant'}));await page.waitForTimeout(600);
 await page.locator('.overworld-map').screenshot({path:path.join(out,'zone-'+i+'.png')});
}
await page.setViewportSize({width:390,height:844});await page.locator('.horizontal-path-scroll').evaluate(el=>el.scrollLeft=0);await page.evaluate(()=>scrollTo(0,0));await page.waitForTimeout(600);await page.screenshot({path:path.join(out,'mobile.png'),fullPage:true});
await browser.close();console.log(JSON.stringify({errors,out}));
