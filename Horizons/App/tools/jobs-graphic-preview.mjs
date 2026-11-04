import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {chromium}=require('C:/Users/David/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const base=process.env.HZ_APP_URL||'http://127.0.0.1:8896/Horizons/App/';
const output=process.env.HZ_JOBS_PREVIEW||'C:/Users/David/Documents/Codex/2026-11-04/horizons-jobs-graphic-v2/native-rows';
const metadata=JSON.parse(fs.readFileSync(process.env.HZ_JOBS_METADATA||'assets/art/jobs-graphic-v2.frames.json','utf8'));
const selectedPhase=process.env.HZ_JOBS_PREVIEW_PHASE===undefined?null:Number(process.env.HZ_JOBS_PREVIEW_PHASE);
const selectedTerms=process.env.HZ_JOBS_PREVIEW_TERMS?.split(',');
const large=selectedPhase!==null;
fs.mkdirSync(output,{recursive:true});
const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
const page=await browser.newPage({viewport:{width:large?800:1640,height:large?1000:620},deviceScaleFactor:1});
for(const atlas of metadata.atlases)for(const row of atlas.rows){
 if(selectedTerms&&!selectedTerms.includes(row.term))continue;
 const assets=row.frames.map((frame,phase)=>({src:row.activeSource||atlas.src,atlas:row.activeAtlas||atlas.atlas,frame,phase})).filter(asset=>selectedPhase===null||asset.phase===selectedPhase);
 const script="import{loadArt,rasterMarkup}from'./src/art.js?native-job-preview=2';await loadArt();const assets="+JSON.stringify(assets)+";document.querySelector('#cells').innerHTML=assets.map(asset=>'<div><div class=picture>'+rasterMarkup(asset,'native',String(asset.phase+1))+'</div><p>"+row.term+" · '+(asset.phase+1)+'</p></div>').join('');await Promise.all([...document.images].map(image=>image.decode()));await new Promise(requestAnimationFrame);await new Promise(requestAnimationFrame);window.__ready=true;";
 const html='<!doctype html><html><meta charset=utf-8><link rel=icon href=data:,><style>body{background:white;margin:0;font:18px sans-serif;color:#183e57}#cells{display:grid;grid-template-columns:repeat('+(large?'1,780px':'4,400px')+');gap:10px;padding:10px}.picture{width:'+(large?780:400)+'px;height:'+(large?920:540)+'px;display:flex;align-items:center;justify-content:center}.native{position:relative;display:block;width:'+(large?760:390)+'px;height:'+(large?900:520)+'px;aspect-ratio:auto!important}p{text-align:center;margin:5px}</style><div id=cells></div><script type=module>'+script+'</script></html>';
 await page.route('**/job-native-preview',route=>route.fulfill({contentType:'text/html',body:html}),{times:1});
 await page.goto(new URL('job-native-preview',base).href,{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>window.__ready===true);
 await page.screenshot({path:path.join(output,row.animationId+(large?'-phase-'+(selectedPhase+1):'')+'.png')});
}
await browser.close();console.log(output);
