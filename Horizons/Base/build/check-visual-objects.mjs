/* Configurable guard for protected expressive learning objects.
   Register checks per level; this verifies affordances, not artistic quality. */
import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {createRequire} from 'node:module';import {pathToFileURL} from 'node:url';
const require=createRequire(import.meta.url),book=path.resolve(process.argv[2]||'Horizons/A1');
const register=JSON.parse(fs.readFileSync(path.join(book,'Sources/Visual-personality.json'),'utf8'));
const candidates=[process.env.HORIZONS_BROWSER_PATH,'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe','C:/Program Files/Microsoft/Edge/Application/msedge.exe','C:/Program Files/Google/Chrome/Application/chrome.exe'].filter(Boolean);
const executablePath=candidates.find(p=>fs.existsSync(p));assert(executablePath,'Set HORIZONS_BROWSER_PATH to the installed browser.');
let browser,page,puppeteer;
try{puppeteer=require('puppeteer-core');}catch(error){if(error.code!=='MODULE_NOT_FOUND')throw error;}
if(puppeteer){browser=await puppeteer.launch({executablePath,headless:true,args:['--allow-file-access-from-files']});page=await browser.newPage();await page.emulateMediaType('print');}
else{const {chromium}=require('C:/Users/David/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');browser=await chromium.launch({executablePath,headless:true,args:['--allow-file-access-from-files']});page=await browser.newPage();await page.emulateMedia({media:'print'});}
const results=[];
try{for(const check of register.display_checks||[]){for(const view of ['standalone','assembled']){
const target=view==='standalone'?path.join(book,'Lessons',check.lesson+'.html'):path.join(book,"Student's Book.html");
const selector=view==='standalone'?check.selector:register.spreads.find(x=>x.lesson===check.lesson).printed_pages.map(n=>`.hz-page[data-page="${n}"] ${check.selector}`).join(',');
await page.goto(pathToFileURL(target).href);await page.evaluate(()=>document.fonts.ready);
const rows=await page.evaluate(selector=>{const parse=s=>s.match(/[\d.]+/g)?.map(Number)||[];return [...document.querySelectorAll(selector)].map(n=>{const c=getComputedStyle(n),b=n.getBoundingClientRect();return {text:n.textContent.trim(),font_pt:parseFloat(c.fontSize)*.75,width_mm:b.width/3.779527559,height_mm:b.height/3.779527559,color:c.color,background:c.backgroundColor,radius:parseFloat(c.borderTopLeftRadius),fill:parse(c.backgroundColor),ink:parse(c.color)};});},selector);
assert.equal(rows.length,check.count,check.lesson+': protected object count');assert(rows.every(x=>x.font_pt>=check.min_font_pt),check.lesson+': expressive display type was flattened');
if(check.filled_round){assert(rows.every(x=>x.fill.length>=3&&(x.fill.length<4||x.fill[3]>.9)&&x.radius>0&&x.width_mm>=9&&x.height_mm>=9&&Math.abs(x.width_mm-x.height_mm)<.5),check.lesson+': filled round number objects were flattened');assert(new Set(rows.map(x=>x.background)).size>=check.min_fill_colors,check.lesson+': colour rhythm lost');}
if(check.text_sequence)assert.deepEqual(rows.map(x=>x.text.replace(/\s+/g,'')),check.text_sequence,check.lesson+': letter/number sequence changed');
if(check.contrast){const linear=x=>(x/=255)<=.04045?x/12.92:((x+.055)/1.055)**2.4;const lum=c=>.2126*linear(c[0])+.7152*linear(c[1])+.0722*linear(c[2]);for(const x of rows){const bg=x.fill.length>=3&&(x.fill.length<4||x.fill[3]>.9)?x.fill:[255,254,250],a=lum(x.ink),z=lum(bg),ratio=(Math.max(a,z)+.05)/(Math.min(a,z)+.05);assert(ratio>=check.contrast,check.lesson+': display contrast '+ratio);}}
results.push({lesson:check.lesson,view,selector:check.selector,count:rows.length,min_font_pt:Math.min(...rows.map(x=>x.font_pt)),fill_colours:new Set(rows.map(x=>x.background)).size,passed:true});}}
}finally{await browser.close();}
console.log(JSON.stringify({protected_object_checks:results,editorial_review:'Saved-PDF warmth, variety and suitability still require personal inspection.'},null,2));
