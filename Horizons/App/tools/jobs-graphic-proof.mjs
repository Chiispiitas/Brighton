import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';

const require=createRequire(import.meta.url);
const {chromium}=require('C:/Users/David/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const app=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const base=process.env.HZ_APP_URL||'http://127.0.0.1:8899/Horizons/App/';
const output=process.env.HZ_JOBS_GRAPHIC_PROOF||'C:/Users/David/Documents/Codex/2026-11-04/horizons-jobs-graphic-v2';
const reportFile=path.resolve(app,process.env.HZ_JOBS_REPORT||'reports/jobs-graphic-review.json');
let previous;
try{previous=JSON.parse(fs.readFileSync(reportFile,'utf8'));}catch{}
const sha=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const groups=[
 {id:'jobs-graphic-1-v2',terms:['teacher','chef','doctor','office worker','receptionist','salesclerk','taxi driver']},
 {id:'jobs-graphic-2-v2',terms:['waiter','waitress','farmer','nurse','dentist','police officer','actor']}
];
const manifest=JSON.parse(fs.readFileSync(path.join(app,'assets/art/manifest.json'),'utf8'));
const fragmentFile=process.env.HZ_JOBS_VOCAB_FRAGMENT;
const fragment=fragmentFile?JSON.parse(fs.readFileSync(path.resolve(app,fragmentFile),'utf8')):null;
if(fragment)Object.assign(manifest.vocabulary,fragment.vocabulary||fragment);
const terms=groups.flatMap(group=>group.terms);
const sources=[...new Set(['assets/art/manifest.json','src/art.js','styles/app.css',process.env.HZ_JOBS_FRAMES||'assets/art/jobs-graphic-v2.frames.json',...(fragmentFile?[fragmentFile]:[]),...terms.map(term=>manifest.vocabulary[term].src)])];
const report={date:new Date().toISOString(),base,status:'PENDING_VISUAL_REVIEW',pass:false,
 scope:'All 56 native phases across 14 remade jobs, including all patient and older-adult supporting characters. Actual rasterMarkup animation positions, scaling, containment and reduced-motion behavior.',
 sources:Object.fromEntries(sources.filter(file=>fs.existsSync(path.join(app,file))).map(file=>[file,sha(fs.readFileSync(path.join(app,file)))])),
 screens:[],animationCases:[],reducedMotionCases:[],failures:[],runtimeErrors:[],consoleErrors:[],requests:[],
 limits:['A rendered browser proof establishes finite native phase playback and painted containment. Each image still requires visual anatomy and flat-style review.','Source ImageGen alpha and color bytes are unchanged. Screenshots show those native images on a white browser canvas.','This job-specific check does not establish every companion, avatar or application route.']};
fs.mkdirSync(output,{recursive:true});
const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
const context=await browser.newContext({viewport:{width:1060,height:2000},deviceScaleFactor:1,serviceWorkers:'block'});
const page=await context.newPage();
page.on('pageerror',error=>report.runtimeErrors.push(error.message));
page.on('console',message=>{if(message.type()==='error')report.consoleErrors.push(message.text());});
page.on('requestfailed',request=>report.requests.push({url:request.url(),error:request.failure()?.errorText}));

for(const group of groups){
 const code=`import{loadArt,artManifest,rasterMarkup}from'./src/art.js?jobs-graphic-proof=2';
 await loadArt();const m=artManifest(),terms=${JSON.stringify(group.terms)};Object.assign(m.vocabulary,${JSON.stringify(fragment?(fragment.vocabulary||fragment):{})});
 document.getElementById('grid').innerHTML=terms.flatMap(term=>Array.from({length:4},(_,phase)=>'<section class="cell" data-term="'+term+'" data-phase="'+phase+'"><div class="picture">'+rasterMarkup(m.vocabulary[term],'qa-native',term)+'</div><p>'+term+' · '+(phase+1)+'</p></section>')).join('');
 await Promise.all([...document.images].map(image=>image.decode().catch(()=>{})));
 await new Promise(requestAnimationFrame);await new Promise(requestAnimationFrame);
 const times=[0,.15,.30,.45];
 for(const cell of document.querySelectorAll('.cell')){const image=cell.querySelector('img'),phase=Number(cell.dataset.phase),asset=m.vocabulary[cell.dataset.term],animation=image.getAnimations()[0];if(animation){animation.pause();await animation.ready;animation.currentTime=asset.animation.duration*times[phase];}}
 await new Promise(requestAnimationFrame);window.__ready=true;`;
 const html='<!doctype html><html><meta charset="utf-8"><link rel="icon" href="data:,"><title>Job native action proof</title><style>*{box-sizing:border-box}body{margin:0;padding:28px;background:white;color:#183e57;font:14px sans-serif}#grid{display:grid;grid-template-columns:repeat(4,240px);gap:12px}.cell{margin:0}.picture{width:240px;height:230px;display:flex;align-items:center;justify-content:center;background:white}.picture>.qa-native{position:relative;display:block;width:224px;height:224px;aspect-ratio:auto!important}.picture>.qa-native>img{max-width:none!important}p{margin:2px 0 12px;text-align:center}</style><div id="grid"></div><script type="module">'+code+'</script></html>';
 await page.route('**/jobs-graphic-proof',route=>route.fulfill({contentType:'text/html',body:html}),{times:1});
 await page.goto(new URL('jobs-graphic-proof',base).href,{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>window.__ready===true);
 const details=await page.evaluate(()=>({cells:[...document.querySelectorAll('.cell')].map(cell=>{
  const slot=cell.querySelector('[data-raster-slot]'),image=cell.querySelector('img'),style=getComputedStyle(image),spec=JSON.parse(slot.dataset.illustrationMotion),phase=Number(cell.dataset.phase),frame=spec.frames[phase],inner=slot.querySelector('.raster-fit'),nativeWidth=Number(slot.dataset.nativeWidth),nativeHeight=Number(slot.dataset.nativeHeight),rect=inner.getBoundingClientRect();
  const actual={left:parseFloat(style.left)/rect.width*100,top:parseFloat(style.top)/rect.height*100};
  return{term:cell.dataset.term,phase,src:image.src,loaded:image.naturalWidth>0,uniform:Math.abs(parseFloat(style.width)/image.naturalWidth-parseFloat(style.height)/image.naturalHeight)<.002,hasAnimation:image.getAnimations().length>0,expected:{left:-frame.x/nativeWidth*100,top:-frame.y/nativeHeight*100},actual,frame,atlas:{width:image.naturalWidth,height:image.naturalHeight}};
 }),forbiddenStyles:[...document.querySelectorAll('.picture,.qa-native,.raster-fit,img')].map(element=>{const style=getComputedStyle(element);return{filter:style.filter,boxShadow:style.boxShadow,textShadow:style.textShadow};}).filter(style=>style.filter!=='none'||style.boxShadow!=='none'||style.textShadow!=='none'),width:innerWidth,scrollWidth:document.documentElement.scrollWidth,height:document.documentElement.scrollHeight}));
 const proof=path.join(output,group.id+'.png');await page.screenshot({path:proof,fullPage:true});
 report.screens.push({id:group.id,...details,proof,sha256:sha(fs.readFileSync(proof)),visualVerdict:'pending'});
 for(const cell of details.cells){
  const positionMatches=Math.abs(cell.actual.left-cell.expected.left)<.02&&Math.abs(cell.actual.top-cell.expected.top)<.02;
  const contained=cell.frame.x>=0&&cell.frame.y>=0&&cell.frame.x+cell.frame.w<=cell.atlas.width&&cell.frame.y+cell.frame.h<=cell.atlas.height;
  report.animationCases.push({term:cell.term,phase:cell.phase,positionMatches,contained,hasAnimation:cell.hasAnimation});
  if(!cell.loaded||!cell.uniform||!cell.hasAnimation||!positionMatches||!contained)report.failures.push({term:cell.term,phase:cell.phase,problem:'Missing, distorted, out-of-bounds or incorrect native animation phase'});
 }
 if(details.forbiddenStyles.length||details.scrollWidth>details.width)report.failures.push({group:group.id,problem:'CSS effects or horizontal gallery overflow'});
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.waitForTimeout(50);
 const remainingNativeAnimations=await page.evaluate(()=>[...document.querySelectorAll('[data-illustration-motion] img')].reduce((total,image)=>total+image.getAnimations().length,0));
 report.reducedMotionCases.push({group:group.id,jobCount:group.terms.length,remainingNativeAnimations});
 if(remainingNativeAnimations)report.failures.push({group:group.id,problem:'Native job playback remains active when reduced motion is requested'});
 await page.emulateMedia({reducedMotion:'no-preference'});
}
await browser.close();
report.structuralPass=!report.failures.length&&!report.runtimeErrors.length&&!report.consoleErrors.length&&!report.requests.length;
report.nativeJobSlots=report.animationCases.length;
report.distinctNativeCells=new Set(report.screens.flatMap(screen=>screen.cells.map(cell=>cell.src+':'+JSON.stringify(cell.frame)))).size;
for(const screen of report.screens){
 const approved=previous?.screens?.find(old=>old.id===screen.id&&old.sha256===screen.sha256&&old.visualVerdict==='pass');
 if(approved){screen.visualVerdict='pass';screen.observations=approved.observations;screen.inheritedPaintedApproval={fromReportDate:previous.date,exactProofSha256:screen.sha256};}
}
report.visualReview={status:report.screens.every(screen=>screen.visualVerdict==='pass')?'PASS':'PENDING',nativePhases:56,approvedScreens:report.screens.filter(screen=>screen.visualVerdict==='pass').length};
report.pass=report.structuralPass&&report.visualReview.status==='PASS';
report.status=report.pass?'PASS':report.structuralPass?'STRUCTURAL_PASS_VISUAL_REVIEW_REQUIRED':'FAIL';
fs.writeFileSync(reportFile,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({structuralPass:report.structuralPass,slots:report.nativeJobSlots,distinct:report.distinctNativeCells,screens:report.screens.map(screen=>({id:screen.id,proof:screen.proof})),failures:report.failures,errors:report.runtimeErrors}));
