import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {chromium}=require('C:/Users/David/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const base=process.env.HZ_APP_URL||'http://127.0.0.1:8907/Horizons/App/';
const output='C:/Users/David/Documents/Codex/2026-11-04/horizons-jobs-graphic-v2/native-rows';
const metadata=JSON.parse(fs.readFileSync('assets/art/jobs-graphic-v2.frames.json','utf8'));
fs.mkdirSync(output,{recursive:true});
const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
const page=await browser.newPage({viewport:{width:1640,height:620},deviceScaleFactor:1});
for(const atlas of metadata.atlases)for(const row of atlas.rows){
 const assets=row.frames.map(frame=>({src:row.activeSource||atlas.src,atlas:row.activeAtlas||atlas.atlas,frame}));
 const script="import{loadArt,rasterMarkup}from'./src/art.js?native-job-preview=2';await loadArt();const assets="+JSON.stringify(assets)+";document.querySelector('#cells').innerHTML=assets.map((asset,index)=>'<div><div class=picture>'+rasterMarkup(asset,'native',String(index+1))+'</div><p>"+row.term+" · '+(index+1)+'</p></div>').join('');await Promise.all([...document.images].map(image=>image.decode()));await new Promise(requestAnimationFrame);await new Promise(requestAnimationFrame);window.__ready=true;";
 const html='<!doctype html><html><meta charset=utf-8><link rel=icon href=data:,><style>body{background:white;margin:0;font:18px sans-serif;color:#183e57}#cells{display:grid;grid-template-columns:repeat(4,400px);gap:10px;padding:10px}.picture{width:400px;height:540px;display:flex;align-items:center;justify-content:center}.native{position:relative;display:block;width:390px;height:520px;aspect-ratio:auto!important}p{text-align:center;margin:5px}</style><div id=cells></div><script type=module>'+script+'</script></html>';
 await page.route('**/job-native-preview',route=>route.fulfill({contentType:'text/html',body:html}),{times:1});
 await page.goto(new URL('job-native-preview',base).href,{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>window.__ready===true);
 await page.screenshot({path:path.join(output,row.animationId+'.png')});
}
await browser.close();console.log(output);
