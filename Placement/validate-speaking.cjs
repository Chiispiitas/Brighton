const fs = require('fs');
const vm = require('vm');
const assert = require('assert/strict');
const { JSDOM } = require('jsdom');
const read = p => fs.readFileSync(require('path').join(__dirname, p), 'utf8');
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));

async function backend(file) {
  const source = read(file).replace(/^import .*;\s*$/gm, '').replace(/export /g, '');
  let calls = 0;
  const complete = {evidenceQuality:'sufficient', transcript:'I enjoy visiting the park with my friends because we can play together.', promptRepeat:false};
  for (const key of ['fluency','grammar','vocabulary','pronunciation','communication']) complete[key] = {band:'A2', position:'mid', evidence:['Audible independent response.']};
  Object.assign(complete.communication, {taskAchievement:5, coherence:5, development:5});
  const context = vm.createContext({console, Date, Buffer, setTimeout, clearTimeout,
    wixSecretsBackend:{getSecret:async()=> 'test-value'},
    fetch:async url => {
      calls++;
      const output = calls === 1 ? {evidenceQuality:'sufficient', transcript:complete.transcript, promptRepeat:false} : complete;
      return {ok:true, text:async()=>JSON.stringify(url.includes('interactions') ? {status:'completed',output_text:JSON.stringify(output)} : {candidates:[{content:{parts:[{text:JSON.stringify(output)}]}}]})};
    }
  });
  vm.runInContext(source, context);
  assert.equal(context.isCompleteSpeakingAssessment(complete), true);
  const bad = structuredClone(complete); delete bad.grammar.band;
  assert.equal(context.isCompleteSpeakingAssessment(bad), false);
  assert.throws(()=>context.sanitizeAssessment(bad), /Incomplete/);
  const corrupt = structuredClone(complete);
  for (const k of ['fluency','grammar','vocabulary','pronunciation','communication']) corrupt[k] = {band:'PRE-A1',position:'low',evidence:[]};
  assert.equal(context.isCompleteSpeakingAssessment(corrupt), false);
  assert.equal(context.isCompleteSpeakingAssessment({...complete,promptRepeat:'false'}), false);
  const grade = await context.gradeSpeakingWithGemini({audioBase64:'A'.repeat(2000),audioMimeType:'audio/webm',durationSeconds:45}, 'A2', file.includes('young-')?'yl-sp-a2-01':'sp-a2-01');
  assert.equal(calls, 2);
  assert.equal(grade.inputError, false);
  assert.equal(grade.composite, 4.3);
  console.log(file + ': incomplete rubric rejected and independent provider fallback passed.');
}

async function frontend(prefix) {
  const dom = new JSDOM(read(prefix+'index.html'), {url:'https://example.test/Placement/',runScripts:'outside-only',pretendToBeVisual:true});
  const w = dom.window;
  w.console = {...console,error(){},warn(){}};
  const originalTimeout = w.setTimeout.bind(w);
  w.setTimeout = (fn,ms,...args)=>originalTimeout(fn,ms>1000000?ms:ms>=2000?20:Math.min(ms,5),...args);
  w.scrollTo = ()=>{}; w.HTMLElement.prototype.scrollIntoView = ()=>{};
  w.BRIGHTON_SITE_CONFIG = {API_BASE_URL:'https://example.test/api'};
  let mode = 'success'; let heldResume; const calls = [];
  const response = body=>({ok:true,status:200,text:async()=>JSON.stringify(body)});
  w.fetch = async(url,options)=> {
    calls.push({url,body:JSON.parse(options.body)});
    if (mode==='hang') return new Promise(()=>{});
    if (mode==='body-hang') return {ok:true,text:()=>new Promise(()=>{})};
    if (mode==='retry-race' && url.endsWith('Resume')) {mode='success';return new Promise(resolve=>{heldResume=resolve;});}
    if (url.endsWith('Resume')) return response({success:true,status:'active',phase:'speaking',moduleId:'speaking-a2'});
    if (mode==='incomplete') return response({success:true});
    return response({success:true,finalLevel:'A2',result:{finalLevel:'A2',skills:{speaking:{score:43,displayScore:'4.3/10',level:'A2'}}}});
  };
  w.eval(read(prefix+'item-bank.js'));
  let source = read(prefix+'main.js'); const end = source.lastIndexOf('})();');
  source = source.slice(0,end) + `window.qa={runMicCheck,renderSpeakingHandoff,startSpeakingRecording,stopSpeakingRecording,renderPlacementResult,cleanupSpeakingMedia,apiPost,renderSpeakingSubmitRetry,skipSpeakingAfterError,setup(){session={sessionId:'qa',clientSessionId:'qa-client',moduleId:'speaking-a2',phase:'speaking',studentName:'QA',status:'active'};currentModuleId='speaking-a2';},getState(){return {session,recorder:speakingRecorder};}};` + source.slice(end);
  w.eval(source); w.qa.setup();
  let released = 0; const track = new w.EventTarget(); track.readyState = 'live'; track.stop = ()=>{released++};
  const stream = {getAudioTracks:()=>[track],getTracks:()=>[track]};
  let resolveMic;
  Object.defineProperty(w.navigator,'mediaDevices',{configurable:true,value:{getUserMedia:()=>new Promise(resolve=>{resolveMic=resolve;})}});
  w.qa.renderSpeakingHandoff(); await w.qa.runMicCheck();
  assert.ok(w.document.querySelector('#retrySpeakingBtn'));
  assert.match(w.document.querySelector('#placementStageRoot').textContent,/permission/);
  resolveMic(stream); await pause(5); assert.ok(released>0);
  w.navigator.mediaDevices.getUserMedia = async()=>{throw Object.assign(new Error('denied'),{name:'NotAllowedError'})};
  w.qa.renderSpeakingHandoff(); await w.qa.runMicCheck();
  assert.match(w.document.querySelector('#placementStageRoot').textContent,/blocked/);
  w.navigator.mediaDevices.getUserMedia = async()=>stream;
  w.AudioContext = class {constructor(){this.state='suspended'} createMediaStreamSource(){return{connect(){}}} createAnalyser(){return{fftSize:1024,getByteTimeDomainData(){}}} resume(){return new Promise(()=>{})} close(){return Promise.resolve()}};
  w.qa.renderSpeakingHandoff(); await w.qa.runMicCheck(); await pause(15);
  assert.ok(w.document.querySelector('#startSpeakingBtn'));
  let recorders = 0;
  w.MediaRecorder = class extends w.EventTarget {
    static isTypeSupported(){return true}
    constructor(){super();recorders++;this.state='inactive';this.mimeType='audio/webm'}
    start(){this.state='recording'}
    stop(){this.state='inactive';this.dispatchEvent(new w.MessageEvent('dataavailable',{data:new w.Blob(['a'.repeat(2000)],{type:'audio/webm'})}));this.dispatchEvent(new w.Event('stop'));}
  };
  await Promise.all([w.qa.startSpeakingRecording(),w.qa.startSpeakingRecording()]);
  assert.equal(recorders,1); assert.equal(w.qa.getState().recorder.state,'recording');
  track.dispatchEvent(new w.Event('ended'));
  assert.ok(w.document.querySelector('#retrySpeakingBtn')); assert.equal(w.qa.getState().recorder,null);
  mode='hang'; await assert.rejects(w.qa.apiPost('brightonPlacementActivity',{}), error=>error.code==='REQUEST_TIMEOUT');
  mode='body-hang'; await assert.rejects(w.qa.apiPost('brightonPlacementActivity',{}), error=>error.code==='REQUEST_TIMEOUT');
  mode='success'; w.qa.renderSpeakingSubmitRetry({audioBase64:'A'.repeat(2000),audioMimeType:'audio/webm',durationSeconds:40});
  assert.ok(w.document.querySelector('#skipSpeakingBtn'));
  w.document.querySelector('#retrySpeakingSubmitBtn').click(); await pause(100);
  assert.equal(w.qa.getState().session.status,'completed'); assert.equal(recorders,1);
  assert.ok(calls.some(call=>call.url.endsWith('SubmitSpeaking') && call.body.audioBase64==='A'.repeat(2000)));
  // Exercise a complete fresh recording through FileReader, upload and result rendering.
  w.qa.setup(); w.qa.renderSpeakingHandoff(); await w.qa.runMicCheck(); await pause(15);
  let clock = 1000; Object.defineProperty(w.performance,'now',{value:()=>clock,configurable:true});
  await w.qa.startSpeakingRecording(); clock = 45000;
  // Mobile browsers may deliver final audio and stop several seconds late.
  // Only the interval before the candidate presses Finish is speaking time.
  const immediateStop = w.MediaRecorder.prototype.stop;
  w.MediaRecorder.prototype.stop = function(){clock += 7000;return immediateStop.call(this);};
  await w.qa.stopSpeakingRecording(); await pause(100);
  w.MediaRecorder.prototype.stop = immediateStop;
  assert.equal(w.qa.getState().session.status,'completed');
  const captured = calls.filter(call=>call.url.endsWith('SubmitSpeaking')).at(-1).body;
  assert.equal(captured.durationSeconds,44,'delayed recorder stop must not inflate speaking duration');
  assert.equal(captured.recordedBytes,2000);
  // An OS/browser stop must ask whether the partial answer was complete.
  w.qa.setup(); w.qa.renderSpeakingHandoff(); await w.qa.runMicCheck(); await pause(15);
  clock=1000; await w.qa.startSpeakingRecording(); clock=45000;
  const beforeSpontaneous=calls.filter(call=>call.url.endsWith('SubmitSpeaking')).length;
  w.qa.getState().recorder.stop(); await pause(50);
  assert.ok(w.document.querySelector('#sendInterruptedSpeakingBtn'),'spontaneous recorder stop requires candidate confirmation');
  assert.equal(w.qa.getState().session.status,'active');
  assert.equal(calls.filter(call=>call.url.endsWith('SubmitSpeaking')).length,beforeSpontaneous,'partial audio must not be automatically assessed');
  clock=120000; await pause(250);
  assert.ok(w.document.querySelector('#sendInterruptedSpeakingBtn'),'old recording timer must not replace interruption controls');
  // A cancelled retry must not later replace the completed skipped result.
  w.qa.setup(); mode='retry-race';
  w.qa.renderSpeakingSubmitRetry({audioBase64:'A'.repeat(2000),audioMimeType:'audio/webm',durationSeconds:40});
  const beforeRace=calls.filter(call=>call.url.endsWith('SubmitSpeaking')).length;
  w.document.querySelector('#retrySpeakingSubmitBtn').click();
  assert.equal(w.document.querySelector('#skipSpeakingBtn').disabled,true,'prevent simultaneous retry and skip clicks');
  assert.equal(typeof heldResume,'function');
  await w.qa.skipSpeakingAfterError();
  heldResume(response({success:true,status:'active',phase:'speaking',moduleId:'speaking-a2'}));
  await pause(100);
  assert.equal(w.qa.getState().session.phase,'result');
  assert.equal(calls.filter(call=>call.url.endsWith('SubmitSpeaking')).length,beforeRace,'stale retry must stop before sending audio');
  assert.equal(w.document.querySelector('#retrySpeakingSubmitBtn'),null,'stale retry must not replace completed result');
  // An HTTP success without an assessment must not produce a certificate.
  w.qa.setup(); mode='incomplete';
  w.qa.renderSpeakingSubmitRetry({audioBase64:'A'.repeat(2000),audioMimeType:'audio/webm',durationSeconds:40});
  w.document.querySelector('#retrySpeakingSubmitBtn').click(); await pause(600);
  assert.equal(w.qa.getState().session.status,'active');
  assert.equal(w.document.querySelector('#retrySpeakingSubmitBtn').disabled,false);
  mode='success';
  // Some mobile recorders never emit stop: the watchdog must restore controls.
  w.qa.renderSpeakingHandoff(); await w.qa.runMicCheck(); await pause(15);
  const normalStop = w.MediaRecorder.prototype.stop;
  w.MediaRecorder.prototype.stop = function(){this.state='inactive'};
  await w.qa.startSpeakingRecording(); await w.qa.stopSpeakingRecording(); await pause(40);
  assert.ok(w.document.querySelector('#retrySpeakingBtn'));
  assert.equal(w.qa.getState().recorder,null);
  w.MediaRecorder.prototype.stop = normalStop;
  w.qa.renderPlacementResult({finalLevel:'A2',skills:{speaking:{level:'Pending review',displayScore:'—',score:null}}});
  assert.ok(w.document.querySelector('#retryOnlySpeakingBtn'));
  w.document.querySelector('#retryOnlySpeakingBtn').click(); await pause(10);
  assert.equal(w.qa.getState().session.phase,'speaking');
  assert.ok(w.document.querySelector('#micCheckBtn'));
  assert.ok(calls.some(call=>call.body.retrySpeaking===true));
  dom.window.close();
  console.log(prefix+': permission timeout/denial, late cleanup, suspended meter, double tap, mic disconnection, request/body timeout, missing stop event, incomplete completion and retained recording retry passed.');
}
async function reopen(file) {
  const source=read(file).replace(/^import[\s\S]*?;\s*$/gm,'').replace(/export /g,'');
  let required=true, writes=0;
  const session={_id:'qa',clientSessionId:'owner',status:'completed',phase:'result',provisionalLevel:'A2',finalLevel:'A1',placementVersion:file.includes('YoungLearners')?'2026-10-12.yle2':'2026-09-20.1'};
  const context=vm.createContext({console,Date,Buffer,setTimeout,clearTimeout,readJsonBody:async r=>r.payload,jsonOK:x=>x,jsonBadRequest:error=>({error}),jsonServerError:error=>{throw error},wixData:{get:async()=>structuredClone(session),update:async(c,row)=>{writes++;return row},query:()=>({eq(){return this},limit(){return this},find:async()=>({items:[{metricsJson:JSON.stringify({reviewRequired:required})}]})})}});
  vm.runInContext(source,context);
  context.buildResultSummary=async()=>({finalLevel:'A2'});
  let result=await context.resumePlacement({payload:{sessionId:'qa',clientSessionId:'owner',retrySpeaking:true}});
  assert.equal(result.status,'active');assert.equal(result.phase,'speaking');assert.equal(result.moduleId,'speaking-a2');assert.equal(writes,1);
  required=false;writes=0;result=await context.resumePlacement({payload:{sessionId:'qa',clientSessionId:'owner',retrySpeaking:true}});assert.ok(result.error);assert.equal(writes,0);
  required=true;result=await context.resumePlacement({payload:{sessionId:'qa',clientSessionId:'wrong',retrySpeaking:true}});assert.ok(result.error);assert.equal(writes,0);
  console.log(file+': only invalid owned attempts reopen Speaking; objective responses remain unchanged.');
}
function recorderNegotiation(prefix) {
  const main = read(prefix+'main.js');
  const helpers = main.slice(main.indexOf('  function createSpeakingMediaRecorder('), main.indexOf('  async function startSpeakingRecording('));
  let behavior = 'mime', configured = 0, detached = 0, received = 0;
  const instances = [];
  class Recorder extends EventTarget {
    static isTypeSupported(type) { return ['audio/webm','audio/mp4'].includes(type); }
    constructor(stream, options = {}) { super(); this.options=options; this.state='inactive'; this.mimeType=options.mimeType || 'audio/mp4'; instances.push(this); }
    start(timeslice) {
      if (behavior==='all' || behavior==='mime' && this.mimeType==='audio/webm' || behavior==='bitrate' && this.options.audioBitsPerSecond || behavior==='timeslice' && timeslice !== undefined) throw new Error('Encoder cannot start');
      this.state='recording';
    }
    stop() { this.state='inactive'; }
  }
  const context = vm.createContext({console:{warn(){}}, MediaRecorder:Recorder, window:{MediaRecorder:Recorder}, SPEAKING_AUDIO_BITS_PER_SECOND:24000});
  vm.runInContext(helpers, context);
  const configure = recorder => {
    configured++;
    const handler = () => received++;
    recorder.addEventListener('dataavailable',handler);
    return () => {detached++;recorder.removeEventListener('dataavailable',handler);};
  };
  let recorder = context.createSpeakingMediaRecorder({},configure);
  assert.equal(recorder.mimeType,'audio/mp4');
  assert.equal(recorder.state,'recording');
  assert.equal(configured,2); assert.equal(detached,1);
  instances[0].dispatchEvent(new Event('dataavailable'));
  recorder.dispatchEvent(new Event('dataavailable'));
  assert.equal(received,1,'failed encoder events must not contaminate successful audio');
  behavior='bitrate'; recorder=context.createSpeakingMediaRecorder({},configure);
  assert.equal(recorder.options.audioBitsPerSecond,undefined);
  assert.equal(recorder.state,'recording');
  behavior='timeslice'; const before=instances.length;
  recorder=context.createSpeakingMediaRecorder({},configure);
  assert.equal(instances.length,before+1,'untimed start should reuse a compatible encoder');
  assert.equal(recorder.state,'recording');
  behavior='all'; assert.throws(()=>context.createSpeakingMediaRecorder({},configure),/Encoder cannot start/);
  console.log(prefix+': MIME start rejection, bitrate fallback, untimed start and failed-encoder listener cleanup passed.');
}
(async()=>{recorderNegotiation('');recorderNegotiation('YoungLearners/');await backend('wix-backend/gemini-speaking.js');await backend('YoungLearners/wix-backend/young-gemini-speaking.js');await frontend('');await frontend('YoungLearners/');await reopen('wix-backend/placement.js');await reopen('YoungLearners/wix-backend/young-placement.js');})().catch(error=>{console.error(error);process.exitCode=1;});
