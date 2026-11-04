// Independent flat-art QA: three avatar base poses through real greeting/celebration callbacks.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';

const require=createRequire(import.meta.url);
const {chromium}=require('C:/Users/David/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const app=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const base=process.env.HZ_APP_URL||'http://127.0.0.1:8896/Horizons/App/';
const stage=process.env.HZ_ARTICULATION_STAGE||'candidate';
const out=process.env.HZ_ARTICULATION_PROOF||`C:/Users/David/Documents/Codex/2026-11-04/horizons-articulation-${stage}`;
const reportFile=process.env.HZ_ARTICULATION_REPORT||path.join(app,'reports/articulation-review.json');
const scope=process.env.HZ_ARTICULATION_SCOPE||'cast';
const sha=value=>crypto.createHash('sha256').update(value).digest('hex');
const safe=value=>value.replace(/[^A-Za-z0-9_.-]/g,'_');
const esc=value=>String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
fs.mkdirSync(out,{recursive:true});
const runtimeFiles=()=>['index.html','service-worker.js','styles/app.css',...fs.readdirSync(path.join(app,'src')).filter(name=>/\.(m?js)$/.test(name)).map(name=>'src/'+name),...fs.readdirSync(path.join(app,'assets/art')).filter(name=>/\.(json|png)$/.test(name)).map(name=>'assets/art/'+name)];
const sourceHashes=()=>Object.fromEntries([...new Set(runtimeFiles())].filter(file=>fs.existsSync(path.join(app,file))).map(file=>[file,sha(fs.readFileSync(path.join(app,file)))]));
function relevantSources(item,details={}){
 const prefixes=item.avatar?['avatar']:item.character==='pico'?['pico']:['cast',item.character+'-'];
 const files=new Set(['src/art.js','styles/app.css',item.avatar?'src/avatar-rig.js':item.character==='pico'?'src/pico-articulated.js':'src/cast-rig.js']);
 if(item.avatar)files.add('assets/art/manifest.json');
 for(const file of runtimeFiles())if(file.startsWith('assets/art/')&&!file.endsWith('.provenance.json')&&prefixes.some(prefix=>path.basename(file).startsWith(prefix)))files.add(file);
 for(const image of details.images||[]){try{const url=new URL(image.src),rel=decodeURIComponent(url.pathname.split('/Horizons/App/')[1]);if(rel)files.add(rel);}catch{}}
 return Object.fromEntries([...files].filter(file=>fs.existsSync(path.join(app,file))).map(file=>[file,sha(fs.readFileSync(path.join(app,file)))]));
}
const report={date:new Date().toISOString(),stage,base,scope,proofFolder:out,runtimeSources:sourceHashes(),screenCases:[],motionCases:[],contactSheets:[],structuralFailures:[],runtimeErrors:[],reviewedCases:[],status:'CAPTURE_RUNNING',pass:false,limits:['Painted frames are sampled at a fixed physical time shared by all animations; an independently normalized timeline would not represent a real joint configuration.','Automated relative-joint motion, alpha bounds and aspect ratios do not establish visual anatomy. Every final frame requires an explicit visual verdict.','Finite dense sampling cannot establish absolute perfection at every possible time or every customization combination. Chromium/Edge only.']};
let previous;
try{previous=JSON.parse(fs.readFileSync(reportFile,'utf8'));}catch{}
const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
const context=await browser.newContext({viewport:{width:1440,height:1000},deviceScaleFactor:1,timezoneId:'America/Bogota',serviceWorkers:'block'});
report.limits.push('The routed enlarged proof harness blocks service workers. Actual publication bytes and returning-visitor cache upgrades require a separate production check.');
const page=await context.newPage();
page.on('pageerror',error=>report.runtimeErrors.push(error.message));
const settle=async()=>page.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.images].map(image=>image.decode().catch(()=>{})));await new Promise(requestAnimationFrame);await new Promise(requestAnimationFrame);});

async function inspectScreen(name){
 await settle();
 await page.waitForTimeout(1200); // Let the one-off page entrance finish before judging painted anatomy.
 const details=await page.evaluate(()=>({width:innerWidth,scrollWidth:document.documentElement.scrollWidth,characters:[...document.querySelectorAll('.character')].map(slot=>({name:slot.dataset.character,pose:slot.dataset.posture||slot.dataset.pose,parts:slot.querySelectorAll('[data-joint],[data-rig-part],[data-articulated-part]').length,flipbooks:slot.querySelectorAll('[data-illustration-motion]').length,rect:(()=>{const r=slot.getBoundingClientRect();return{x:r.x,y:r.y,width:r.width,height:r.height};})()})),unloaded:[...document.images].filter(image=>image.getBoundingClientRect().width&&image.getBoundingClientRect().height&&!image.naturalWidth).map(image=>image.src)}));
 const proof=path.join(out,safe(name)+'.png');await page.screenshot({path:proof,fullPage:false});
 report.screenCases.push({id:name,...details,proof,proofSha256:sha(fs.readFileSync(proof))});
 if(details.scrollWidth>details.width+1)report.structuralFailures.push({id:name,problem:'Horizontal overflow'});
 if(details.unloaded.length)report.structuralFailures.push({id:name,problem:'Unloaded graphics',files:details.unloaded});
 for(const actor of details.characters){if(process.env.HZ_ARTICULATION_FILTER&&!process.env.HZ_ARTICULATION_FILTER.startsWith(actor.name))continue;if(actor.flipbooks||actor.parts<3)report.structuralFailures.push({id:name,character:actor.name,problem:'Named companion lacks independently articulated parts or still uses a whole-frame atlas sequence'});}
}

// The proof mounts the same public art functions as the application. It changes
// only the allotted QA viewport, not the renderer, anatomy, pose or callbacks.
async function mountCase(item){
 const script=`import*as art from'./src/art.js?articulation-qa='+${JSON.stringify(stage)};await art.loadArt();window.__art=art;const slot=document.getElementById('slot');${item.avatar?`slot.innerHTML=art.avatarMarkup(${JSON.stringify(item.avatar)},'avatar-large','QA portrait');const actor=slot.firstElementChild;actor.dataset.avatarPosture=${JSON.stringify(item.posture||'wave')};`:`slot.innerHTML=art.characterMarkup(${JSON.stringify(item.character)},${JSON.stringify(item.cls)},${JSON.stringify(item.mood)});`}${item.avatar&&item.controller?`const avatarModule=await import(${JSON.stringify('./src/avatar-rig.js?articulation-qa='+stage)});actor.__articulatedRig=avatarModule.mountAvatar(actor,{avatar:${JSON.stringify(item.avatar)},manifest:art.artManifest(),posture:${JSON.stringify(item.posture||'portrait')},mood:'idle'});`:'art.refreshCharacterMotion(slot);'}window.__proofReady=true;`;
 // Import syntax must remain static: the stage query is interpolated outside
 // the browser module source rather than appended as a JavaScript expression.
 let executable=script.replace("import*as art from'./src/art.js?articulation-qa='+"+JSON.stringify(stage),"import*as art from"+JSON.stringify('./src/art.js?articulation-qa='+stage));
 if(item.vignette)executable=executable.replace(`slot.innerHTML=art.characterMarkup(${JSON.stringify(item.character)},${JSON.stringify(item.cls)},${JSON.stringify(item.mood)});`,`slot.innerHTML=art.rasterMarkup(Object.values(art.artManifest().vocabulary).find(asset=>asset.animation?.id===${JSON.stringify(item.vignette)}),'occupation-qa',${JSON.stringify(item.vignette)});`);
 const html=`<!doctype html><html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="./styles/app.css"><style>html,body{margin:0!important;padding:0!important;background:#fffdfa!important;overflow:hidden!important}#slot{position:fixed;left:120px;top:50px;width:400px;height:${item.avatar?400:600}px}#slot>.character,#slot>.avatar,#slot>[data-articulated-vignette]{position:relative!important;inset:auto!important;display:block!important;margin:0!important;width:100%!important;height:100%!important;transform:none!important;max-width:none!important;max-height:none!important}#slot .character-art{position:absolute;inset:0;width:100%;height:100%}</style><div id="slot"></div><script type="module">${executable}</script></html>`;
 await page.route('**/articulation-proof',route=>route.fulfill({contentType:'text/html',body:html}),{times:1});
 await page.setViewportSize({width:640,height:item.avatar?520:760});
 await page.goto(new URL('articulation-proof',base).href,{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>window.__proofReady===true);
 await page.waitForFunction(()=>document.querySelector('#slot [data-ready=true],#slot [data-rig-ready=true]')||document.querySelector('#slot [data-illustration-motion]'),{timeout:20000}).catch(()=>{});
 await settle();
 return page.locator('#slot');
}

async function freezeAt(time){
 await page.evaluate(async physicalTime=>{const animations=document.getAnimations();await Promise.all(animations.map(async animation=>{animation.pause();await animation.ready.catch(()=>{});if(animation.effect?.target?.isConnected)animation.currentTime=physicalTime;}));await new Promise(requestAnimationFrame);await new Promise(requestAnimationFrame);},time);
}

async function sampleState(){
 return page.evaluate(()=>{
  const slot=document.querySelector('#slot'),actor=slot.firstElementChild;
  const nodes=[...slot.querySelectorAll('[data-joint],[data-rig-part],[data-articulated-part]')];
  const parts=nodes.map((node,index)=>{const style=getComputedStyle(node),r=node.getBoundingClientRect();return{key:(node.dataset.joint||node.dataset.rigPart||node.dataset.articulatedPart)+':'+index,name:node.dataset.joint||node.dataset.rigPart||node.dataset.articulatedPart,transform:style.transform,rotate:style.rotate,translate:style.translate,animation:style.animationName,rect:{x:r.x,y:r.y,width:r.width,height:r.height},parent:node.parentElement?.dataset.joint||node.parentElement?.dataset.rigPart||node.parentElement?.dataset.articulatedPart||null,attachment:node.dataset.attachment||node.dataset.attachedTo||null};});
  const images=[...slot.querySelectorAll('img')].map(image=>{const s=getComputedStyle(image),width=parseFloat(s.width),height=parseFloat(s.height);return{src:image.src,loaded:image.naturalWidth>0,uniform:!image.naturalWidth||Math.abs(width/image.naturalWidth-height/image.naturalHeight)<.002};});
  return{character:actor.dataset.character,pose:slot.querySelector('[data-rig-pose]')?.dataset.rigPose||actor.dataset.rigPose||actor.dataset.posture||actor.dataset.pose,parts,images,flipbooks:slot.querySelectorAll('[data-illustration-motion]').length,animations:document.getAnimations().map(animation=>({name:animation.animationName||'',target:animation.effect?.target?.dataset.rigPart||animation.effect?.target?.dataset.joint||animation.effect?.target?.className,duration:animation.effect?.getTiming().duration,delay:animation.effect?.getTiming().delay,progress:animation.effect?.getComputedTiming().progress}))};
 });
}

async function captureMotion(item){
 const count=item.steps||36;
 const frames=[];
 for(let index=0;index<count;index++){
  await mountCase(item);
  const timing=await page.evaluate(()=>document.getAnimations().map(animation=>({duration:Number(animation.effect?.getTiming().duration)||0,iterations:animation.effect?.getTiming().iterations,name:animation.animationName||''})).filter(value=>value.duration>0));
  const period=item.duration||Math.max(1000,...timing.filter(value=>!/(blink|eyes|mouth)/i.test(value.name)).map(value=>value.duration));
  const physicalTime=period*index/(count-1);
  await freezeAt(physicalTime);
  const details=await sampleState(),id=`${item.id}:frame-${String(index).padStart(2,'0')}`,proof=path.join(out,safe(id)+'.png');
  await page.screenshot({path:proof,clip:{x:80,y:20,width:480,height:item.avatar?460:700}});
  const frame={id,index,physicalTimeMs:physicalTime,periodMs:period,...details,relevantSources:relevantSources(item,details),proof,proofSha256:sha(fs.readFileSync(proof)),visualVerdict:'pending'};
  report.motionCases.push(frame);frames.push(frame);
  if(details.flipbooks)report.structuralFailures.push({id,problem:'Whole-character frame playback remains active'});
  if(details.images.some(image=>!image.loaded||!image.uniform))report.structuralFailures.push({id,problem:'Missing or nonuniformly scaled native graphic'});
 }
 // A dense loop can still miss a brief blink. Derive a real painted closed-eye
 // time from that overlay's own native animation, then use that same physical
 // time for every other body part so the pose remains an actual frame.
 await mountCase(item);
 const blink=await page.evaluate(()=>{
  for(const animation of document.getAnimations()){
   const node=animation.effect?.target,label=[animation.animationName,node?.className,node?.dataset.rigPart,node?.dataset.joint].join(' ');
   if(!/(closed|blink|eyelid|avatar-eyes)/i.test(label))continue;
   const timing=animation.effect.getTiming(),duration=Number(timing.duration),keys=animation.effect.getKeyframes();
   if(!duration)continue;
   const closed=keys.filter(key=>Number(key.opacity)===1&&Number(key.computedOffset??key.offset)>0);
   if(!closed.length)continue;
   const first=Number(closed[0].computedOffset??closed[0].offset),second=Number(closed[1]?.computedOffset??closed[1]?.offset??first+.01);
   let time=Number(timing.delay||0)+duration*(first+Math.min(second-first,.02)/2);
   while(time<0)time+=duration;
   return{timeMs:time,overlay:label,expectedOpacity:1};
  }
  return null;
 });
 if(blink){
  await freezeAt(blink.timeMs);
  const details=await sampleState(),id=item.id+':closed-eye',proof=path.join(out,safe(id)+'.png');
  await page.screenshot({path:proof,clip:{x:80,y:20,width:480,height:item.avatar?460:700}});
  const frame={id,index:count,physicalTimeMs:blink.timeMs,periodMs:null,...details,relevantSources:relevantSources(item,details),blink,proof,proofSha256:sha(fs.readFileSync(proof)),visualVerdict:'pending'};
  report.motionCases.push(frame);frames.push(frame);
 }
 const byPart=new Map();for(const frame of frames)for(const part of frame.parts){let values=byPart.get(part.key);if(!values)byPart.set(part.key,values=new Set());values.add([part.transform,part.rotate,part.translate].join('|'));}
 const moving=[...byPart].filter(([,values])=>values.size>1).map(([key,values])=>({key,transforms:values.size}));
 const movingLimbs=moving.filter(value=>/arm|fore|hand|paw|leg|ear|foot|elbow|wrist/i.test(value.key));
 if(movingLimbs.length<2)report.structuralFailures.push({id:item.id,problem:'Fewer than two independently changing body-part transforms',moving});
 report.motionSummary??=[];report.motionSummary.push({id:item.id,frames:frames.length,moving,movingLimbChannels:movingLimbs.length});
 await contactSheets(item,frames);
 console.log(JSON.stringify({case:item.id,frames:frames.length,movingLimbChannels:movingLimbs.length}));
}

async function contactSheets(item,frames){
 const sheet=await context.newPage();
 for(let start=0;start<frames.length;start+=12){const members=frames.slice(start,start+12),file=path.join(out,safe(item.id)+`-sheet-${1+start/12}.png`);
  const cells=members.map(frame=>`<figure><img src="data:image/png;base64,${fs.readFileSync(frame.proof).toString('base64')}"><figcaption>${esc(frame.id)}<br>${frame.physicalTimeMs===null?'Live transition':Math.round(frame.physicalTimeMs)+'ms'}</figcaption></figure>`).join('');
  await sheet.setViewportSize({width:1400,height:1000});await sheet.setContent(`<!doctype html><style>body{margin:16px;font:15px/1.3 system-ui;color:#173e5c;background:#fff}h1{font-size:22px}.grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}figure{margin:0;background:#fff6e6}img{display:block;width:100%;height:${item.avatar?320:440}px;object-fit:contain}figcaption{padding:8px;background:white}</style><h1>Actual articulated render · ${esc(item.id)}</h1><div class="grid">${cells}</div>`);await sheet.evaluate(async()=>Promise.all([...document.images].map(image=>image.decode())));await sheet.screenshot({path:file,fullPage:true});
  report.contactSheets.push({id:item.id,startFrame:start,endFrame:start+members.length-1,file,sha256:sha(fs.readFileSync(file)),frameIds:members.map(frame=>frame.id)});
 }
 await sheet.close();
}

function discontinuities(before,after){
 const old=new Map(before.parts.map(part=>[part.key,part]));
 return after.parts.flatMap(part=>{const previous=old.get(part.key);if(!previous)return[];
  const matrix=value=>{const m=value.match(/^matrix\(([^)]+)\)$/);return m?m[1].split(',').map(Number):[1,0,0,1,0,0];};
  const a=matrix(previous.transform),b=matrix(part.transform);let angle=(Math.atan2(b[1],b[0])-Math.atan2(a[1],a[0]))*180/Math.PI;while(angle>180)angle-=360;while(angle< -180)angle+=360;
  const translation=Math.hypot(b[4]-a[4],b[5]-a[5]);return Math.abs(angle)>4||translation>4?[{part:part.key,angleDegrees:angle,translationPx:translation}]:[];
 });
}

async function captureTransition(item){
 const nextMood=item.targetMood||process.env.HZ_ARTICULATION_MOOD||'wave';
 item={...item,id:item.id.replace(/-to-wave$/,'-to-'+nextMood)};
 const supplementary=[];
 const proof=async label=>{const id=item.id+':'+label,file=path.join(out,safe(id)+'.png'),details=await sampleState();await page.screenshot({path:file,clip:{x:80,y:20,width:480,height:item.avatar?460:700}});const value={id,index:supplementary.length,physicalTimeMs:null,transition:label,...details,relevantSources:relevantSources(item,details),proof:file,proofSha256:sha(fs.readFileSync(file)),visualVerdict:'pending'};report.motionCases.push(value);supplementary.push(value);return value;};
 await mountCase(item);await freezeAt(1200);const before=await proof('before-greet');
 await page.evaluate(mood=>{const node=document.querySelector('#slot').firstElementChild,rig=node.__articulatedRig;if(!rig?.setMood)throw Error('Articulated controller missing for transition test');rig.setMood(mood);},nextMood);
 const entryMs=await page.evaluate(()=>Math.max(0,...document.getAnimations().map(animation=>animation.effect?.getTiming()).filter(timing=>timing?.iterations===1).map(timing=>Number(timing.duration)||0)));
 await freezeAt(0);const entered=await proof('greet-start');
 const entryJumps=discontinuities(before,entered);
 if(entryJumps.length)report.structuralFailures.push({id:item.id,problem:'Greeting entry jumps away from the current rendered joint configuration',joints:entryJumps});
 const beginFromBase=async()=>{await mountCase(item);await freezeAt(1200);await page.evaluate(mood=>document.querySelector('#slot').firstElementChild.__articulatedRig.setMood(mood),nextMood);};
 const paintedTimes=item.avatar?[80,160,288,480,640,672,960,1440,1728,1920,2112,2280,2400]:[80,160,240,320,400,420,640,1000,1800,3200,5200];
 for(const time of paintedTimes){
  // Remount each phase so that the real JavaScript timer from an earlier
  // screenshot cannot reset a later paused visual sample.
  await beginFromBase();
  if(entryMs&&time>entryMs&&!item.avatar){await page.evaluate(ms=>document.querySelector('#slot').firstElementChild.__articulatedRig.seek(ms),time-entryMs);await settle();}else await freezeAt(time);
  await proof('greet-'+time+'ms');
 }
 if(item.avatar){
  await beginFromBase();await freezeAt(960);const beforeIdle=await proof('before-idle-interruption');
  await page.evaluate(()=>document.querySelector('#slot').firstElementChild.__articulatedRig.setMood('idle'));await freezeAt(0);const idleEntered=await proof('idle-interruption-start');
  const idleJumps=discontinuities(beforeIdle,idleEntered);if(idleJumps.length)report.structuralFailures.push({id:item.id,problem:'Idle interruption jumps from current painted joints',joints:idleJumps});
  for(const time of[108,288,432,600]){await beginFromBase();await freezeAt(960);await page.evaluate(()=>document.querySelector('#slot').firstElementChild.__articulatedRig.setMood('idle'));await freezeAt(time);await proof('idle-interruption-'+time+'ms');}
 }
 // A live RAF trace observes the real JavaScript return callback. It does not
 // pretend that seeking a WAAPI animation also advances setTimeout handlers.
 await mountCase(item);
 const trace=await page.evaluate(async targetMood=>{
  const slot=document.querySelector('#slot'),rig=slot.firstElementChild.__articulatedRig;
  const identities=new WeakMap();let nextIdentity=1;
  const read=frameTime=>({at:frameTime,wallTime:performance.now(),mood:slot.querySelector('[data-mood]')?.dataset.mood||null,animationSignature:document.getAnimations().map(animation=>{if(!identities.has(animation))identities.set(animation,nextIdentity++);return identities.get(animation);}).join(','),joints:[...slot.querySelectorAll('[data-joint]')].map((node,index)=>{const m=new DOMMatrixReadOnly(getComputedStyle(node).transform);return{name:node.dataset.joint+':'+index,angle:Math.atan2(m.b,m.a)*180/Math.PI,x:m.e,y:m.f};})});
  const result={startedAt:performance.now(),clock:'requestAnimationFrame timestamp, matching the painted document timeline',samples:[],returned:false};rig.setMood(targetMood);
  await new Promise(resolve=>{let returnedAt;function tick(frameTime){const sample=read(frameTime);result.samples.push(sample);if(sample.mood==='idle'&&result.samples.length>1){returnedAt??=sample.at;result.returned=true;}if(returnedAt&&sample.at-returnedAt>=250||sample.at-result.startedAt>18000)return resolve();requestAnimationFrame(tick);}requestAnimationFrame(tick);});
  result.elapsedMs=performance.now()-result.startedAt;return result;
 },nextMood);
 const spikes=[];
 for(let index=1;index<trace.samples.length;index++){const a=trace.samples[index-1],b=trace.samples[index],dt=(b.at-a.at)/1000;if(dt<=0)continue;const boundary=a.mood!==b.mood||a.animationSignature!==b.animationSignature,old=new Map(a.joints.map(joint=>[joint.name,joint]));for(const joint of b.joints){const prior=old.get(joint.name);if(!prior)continue;let angle=joint.angle-prior.angle;while(angle>180)angle-=360;while(angle< -180)angle+=360;const jump=Math.hypot(joint.x-prior.x,joint.y-prior.y);if(Math.abs(angle)>(boundary?4:12)&&Math.abs(angle)/dt>(boundary?500:1500)||jump>(boundary?4:20)&&jump/dt>(boundary?1000:4000))spikes.push({boundary,fromMood:a.mood,toMood:b.mood,part:joint.name,dtMs:dt*1000,angleDegrees:angle,translationPx:jump});}}
 await proof('after-real-return');
 const traceFile=path.join(out,safe(item.id)+'-live-joint-trace.json');fs.writeFileSync(traceFile,JSON.stringify(trace,null,2));
 report.lifecycleCases??=[];report.lifecycleCases.push({id:item.id,entryJumps,realReturnObserved:trace.returned,elapsedMs:trace.elapsedMs,spikes,traceFile,traceSha256:sha(fs.readFileSync(traceFile))});
 if(!trace.returned||spikes.length)report.structuralFailures.push({id:item.id,problem:!trace.returned?'Greeting did not return through its actual callback':'Joint transform discontinuity in actual live callback cycle',spikes});
 await contactSheets(item,supplementary);
 console.log(JSON.stringify({case:item.id,entryJumps:entryJumps.length,callbackSpikes:spikes.length,actualReturn:trace.returned}));
}

try{
 if(scope==='screens'||scope==='humans'||scope==='cast'||scope==='all'){
  await page.goto(base,{waitUntil:'domcontentloaded'});
  for(const width of[320,390,768,1440]){await page.setViewportSize({width,height:width<768?844:1000});await inspectScreen('welcome-'+width);}
  const contexts=scope==='screens'?[]:[
   ...['pico','mina','alex','jo'].flatMap(character=>['idle','wave','celebrate'].map(mood=>({id:`${character}:welcome:${mood}`,character,cls:'welcome-'+character,mood,steps:36}))),
   {id:'pico:explore',character:'pico',cls:'hero-pico',mood:'idle',steps:24},
   {id:'pico:read',character:'pico',cls:'question-pico',mood:'idle',steps:24},
   {id:'pico:jump',character:'pico',cls:'result-pico',mood:'celebrate',steps:24},
   {id:'mina:map',character:'mina',cls:'question-mina',mood:'idle',steps:24},
   {id:'mina:read',character:'mina',cls:'lesson-guide lesson-guide-1c',mood:'idle',steps:24},
   {id:'mina:skip',character:'mina',cls:'game-mina',mood:'idle',steps:24},
   {id:'mina:student',character:'mina',cls:'occupation-student',mood:'idle',vignette:'student',steps:36},
   {id:'alex:sit',character:'alex',cls:'practice-alex',mood:'idle',steps:24},
   {id:'alex:fix',character:'alex',cls:'lesson-guide lesson-guide-1d',mood:'idle',steps:24},
   {id:'alex:dance',character:'alex',cls:'game-alex',mood:'idle',steps:24},
   {id:'alex:driver',character:'alex',cls:'occupation-driver',mood:'idle',vignette:'driver',steps:36},
   {id:'jo:pour',character:'jo',cls:'question-jo',mood:'idle',steps:24},
   {id:'jo:read',character:'jo',cls:'aside-jo',mood:'idle',steps:24},
   {id:'jo:clap',character:'jo',cls:'goal-jo',mood:'idle',steps:24}
  ];
  const filter=process.env.HZ_ARTICULATION_FILTER;
  for(const item of contexts.filter(item=>(scope!=='humans'||item.character!=='pico')&&(!filter||item.id.includes(filter))))await captureMotion(item);
 }
 if(scope==='avatar'||scope==='all'){
  for(let outfit=1;outfit<=6;outfit++)for(const posture of['wave','think']){
   const item={id:`avatar:outfit-${outfit}:${posture}`,avatar:{skin:'skin-'+outfit,outfit:'outfit-'+outfit,hair:'hair-'+outfit,accessory:'none',badge:'none'},posture,steps:36};
   const filter=process.env.HZ_ARTICULATION_FILTER;if(!filter||item.id.includes(filter))await captureMotion(item);
  }
 }
 if(scope==='transitions'||scope==='all'){
  for(const item of[{id:'pico:read-to-wave',character:'pico',cls:'question-pico',mood:'idle'},{id:'mina:read-to-wave',character:'mina',cls:'lesson-guide lesson-guide-1c',mood:'idle'},{id:'mina:map-to-wave',character:'mina',cls:'question-mina',mood:'idle'},{id:'alex:sit-to-wave',character:'alex',cls:'practice-alex',mood:'idle'},{id:'alex:fix-to-wave',character:'alex',cls:'lesson-guide lesson-guide-1d',mood:'idle'},{id:'jo:read-to-wave',character:'jo',cls:'aside-jo',mood:'idle'},{id:'jo:pour-to-wave',character:'jo',cls:'question-jo',mood:'idle'}]){
   const filter=process.env.HZ_ARTICULATION_FILTER;if(!filter||item.id.includes(filter))await captureTransition(item);
  }
 }
 if(scope==='avatar-transitions'||scope==='all'){
  for(let outfit=1;outfit<=1;outfit++)for(const posture of['portrait','wave','think']){
   const item={id:`avatar:outfit-${outfit}:${posture}-to-wave`,avatar:{skin:'skin-'+outfit,outfit:'outfit-'+outfit,hair:'hair-'+outfit,accessory:'none',badge:'none'},posture,controller:true};
   const filter=process.env.HZ_ARTICULATION_FILTER;if(!filter||item.id.includes(filter))await captureTransition(item);
  }
 }
}catch(error){report.structuralFailures.push({id:'harness',problem:error.stack});console.error(error.stack);}
finally{
 await browser.close();
 const current=sourceHashes();report.globalSourceChanges=Object.keys({...report.runtimeSources,...current}).filter(file=>report.runtimeSources[file]!==current[file]);
 const relevant=new Map();for(const frame of report.motionCases)for(const[file,hash]of Object.entries(frame.relevantSources||report.runtimeSources)){let hashes=relevant.get(file);if(!hashes)relevant.set(file,hashes=new Set());hashes.add(hash);}
 report.changedSources=[...relevant].filter(([file,hashes])=>hashes.size!==1||!hashes.has(current[file])).map(([file])=>file);
 const oldById=new Map((previous?.reviewedCases||[]).map(item=>[item.id,item]));
 report.reviewedCases=report.motionCases.flatMap(frame=>{const old=oldById.get(frame.id);return old&&old.proofSha256===frame.proofSha256?[old]:[];});
 const reviewed=new Map(report.reviewedCases.map(item=>[item.id,item]));
 report.visualReview={expected:report.motionCases.length,approved:report.motionCases.filter(frame=>reviewed.get(frame.id)?.verdict==='pass').length,pending:report.motionCases.filter(frame=>!reviewed.has(frame.id)).map(frame=>frame.id),rejected:report.motionCases.filter(frame=>reviewed.has(frame.id)&&reviewed.get(frame.id).verdict!=='pass').map(frame=>frame.id)};
 report.automatedPass=report.structuralFailures.length===0&&report.runtimeErrors.length===0&&report.changedSources.length===0;
 report.pass=report.automatedPass&&report.visualReview.pending.length===0&&report.visualReview.rejected.length===0&&report.motionCases.length>0;
 report.status=report.pass?'PASS':report.automatedPass?'AUTOMATED_PASS_VISUAL_REVIEW_REQUIRED':'FAIL';
 fs.mkdirSync(path.dirname(reportFile),{recursive:true});fs.writeFileSync(reportFile,JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify({status:report.status,screenCases:report.screenCases.length,motionFrames:report.motionCases.length,structuralFailures:report.structuralFailures.length,runtimeErrors:report.runtimeErrors.length,changedSources:report.changedSources,proof:out}));
 process.exitCode=report.automatedPass?0:1;
}
