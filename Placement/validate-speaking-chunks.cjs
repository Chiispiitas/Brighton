/* Speaking uploads must use a read-your-writes query after the last chunk.
   A replica that has not caught up is deliberately empty in this regression. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

async function verify(relative) {
  const source = fs.readFileSync(path.join(__dirname, relative), 'utf8')
    .replace(/^import[\s\S]*?;\s*$/gm, '').replace(/export /g, '');
  let reads = 0;
  let rows = [
    {chunkIndex:1, totalChunks:2, clientSessionId:'owner', chunkBase64:'BBBB'},
    {chunkIndex:0, totalChunks:2, clientSessionId:'owner', chunkBase64:'AAAA'}
  ];
  const context = vm.createContext({console, Date, Buffer, setTimeout, clearTimeout,
    wixData: {query: () => ({
      eq() { return this; }, limit() { return this; },
      async find(options) {
        reads++;
        return {items:options.consistentRead ? rows : []};
      }
    })}
  });
  vm.runInContext(source, context);
  const payload = {audioUploadId:'qa-upload-1234', audioChunkCount:2};
  const session = {_id:'qa-session', clientSessionId:'owner'};
  assert.equal(await context.resolveSpeakingAudioBase64(payload, session), 'AAAABBBB');
  assert.equal(reads, 1);
  rows = rows.slice(0, 1);
  await assert.rejects(context.resolveSpeakingAudioBase64(payload, session), /incomplete/);
  rows.push({...rows[0], chunkIndex:0, clientSessionId:'different-owner'});
  await assert.rejects(context.resolveSpeakingAudioBase64(payload, session), /invalid/);
  rows = rows.map(row => ({...row, chunkIndex:0, clientSessionId:'owner'}));
  await assert.rejects(context.resolveSpeakingAudioBase64(payload, session), /invalid/);
  assert.equal(await context.resolveSpeakingAudioBase64({audioBase64:'inline'}, session), 'inline');
  await assert.rejects(context.resolveSpeakingAudioBase64({audioBase64:'A'.repeat(12000001)}, session), /too large/);
  console.log(`${relative}: fresh chunk reads, ordering, ownership, missing/duplicate chunks and size limits passed.`);
}

async function verifyState(relative) {
  const source = fs.readFileSync(path.join(__dirname, relative), 'utf8')
    .replace(/^import[\s\S]*?;\s*$/gm, '').replace(/export /g, '');
  const version = relative.includes('YoungLearners') ? '2026-10-12.yle2' : '2026-09-20.1';
  const session = {_id:'qa-session', clientSessionId:'owner', status:'active', phase:'speaking',
    moduleId:'speaking-a2', provisionalLevel:'A2', placementVersion:version, updatedAt:new Date()};
  const speaking = {speakingLevel:'A2', metricsJson:JSON.stringify({composite:4.3})};
  const chunk = {_id:'chunk', chunkIndex:0, totalChunks:1, clientSessionId:'owner', chunkBase64:'AAAA'};
  let hasSpeaking = true, inserts = 0, updates = 0, writtenSession;
  const context = vm.createContext({console, Date, Buffer, setTimeout, clearTimeout,
    readJsonBody:async request => request.payload,
    jsonOK:value => value, jsonBadRequest:error => ({error}), jsonServerError:error => {throw error;},
    wixData: {
      get:async (collection, id, options) => options.consistentRead ? structuredClone(session) : null,
      insert:async () => { inserts++; },
      update:async (collection, row) => {
        updates++;
        if (collection.endsWith('Sessions')) writtenSession = row;
        return row;
      },
      query:collection => ({
        eq() { return this; }, limit() { return this; },
        async find(options) {
          if (collection.endsWith('SpeakingChunks')) return {items:options.consistentRead ? [chunk] : []};
          if (collection.endsWith('Speaking')) return {items:options.consistentRead && hasSpeaking ? [speaking] : []};
          return {items:[]};
        }
      })
    }
  });
  vm.runInContext(source, context);
  assert.equal((await context.getPlacementSession(session._id, 'owner'))._id, session._id);
  assert.equal((await context.buildResultSummary(session)).skills.speaking.displayScore, '4.3/10');
  await context.uploadSpeakingChunk({payload:{sessionId:session._id, clientSessionId:'owner',
    placementVersion:version, moduleId:'speaking-a2', uploadId:'qa-upload-1234',
    chunkIndex:0, totalChunks:1, audioMimeType:'audio/mp4', chunkBase64:'AAAA'}});
  assert.equal(inserts, 0, 'Retry updates the just-written chunk instead of inserting a duplicate');
  assert.equal(updates, 1);
  hasSpeaking = false;
  const diagnostics = {technicalCode:'MIC_PERMISSION_TIMEOUT', browserFamily:'Safari', platformFamily:'iOS',
    captureMode:'native-audio', durationSeconds:20, recordedBytes:2000, audioMimeType:'audio/mp4',
    audioActivityAvailable:false, audioBase64:'PRIVATE', transcript:'PRIVATE', sessionId:'PRIVATE'};
  const skipped = await context.skipSpeaking({payload:{sessionId:session._id, clientSessionId:'owner',
    placementVersion:version, moduleId:'speaking-a2', diagnostics}});
  const stored = JSON.parse(writtenSession.progressJson);
  assert.equal(stored.speakingSkipped, true);
  assert.equal(stored.speakingDiagnostics.technicalCode, 'MIC_PERMISSION_TIMEOUT');
  assert.equal(stored.speakingDiagnostics.audioActivityAvailable, false);
  assert.ok(!writtenSession.progressJson.includes('PRIVATE'));
  assert.equal(skipped.result.skills.speaking.skipped, true);
  assert.equal(skipped.result.skills.speaking.score, null);
  console.log(`${relative}: immediate result evidence, chunk retry and private-data-free skip diagnostics passed.`);
}

async function verifyProviderBudget(relative) {
  const source = fs.readFileSync(path.join(__dirname, relative), 'utf8')
    .replace(/^import[\s\S]*?;\s*$/gm, '').replace(/export /g, '');
  let now = 0, requests = 0;
  const waits = [];
  class ClockDate extends Date { static now() { return now; } }
  const context = vm.createContext({console:{...console,error(){}}, Date:ClockDate, Buffer,
    setTimeout(fn, ms) { waits.push(ms); return setTimeout(() => { now += ms; fn(); }, 0); },
    clearTimeout,
    fetch:() => { requests++; return new Promise(() => {}); }
  });
  vm.runInContext(source, context);
  const result = await context.requestSpeakingAssessment('test-key', 'test-context', 'AAAA', 'audio/mp4');
  assert.equal(result.ok, false);
  assert.equal(now, 55000);
  assert.deepEqual(waits, [25000, 25000, 5000]);
  assert.equal(requests, 3, 'No further provider call starts after the total deadline');
  assert.equal(context.normalizeAudioMime('audio/mp4;codecs=mp4a.40.2'), 'audio/m4a');
  console.log(`${relative}: complete provider ladder is bounded to 55 seconds; Safari MIME normalization passed.`);
}

async function verifySkippedRecovery(relative) {
  const source = fs.readFileSync(path.join(__dirname, relative), 'utf8')
    .replace(/^import[\s\S]*?;\s*$/gm, '').replace(/export /g, '');
  const version = relative.includes('YoungLearners') ? '2026-10-12.yle2' : '2026-09-20.1';
  const session = {_id:'qa', clientSessionId:'owner', status:'completed', phase:'result',
    provisionalLevel:'A2', finalLevel:'A2', placementVersion:version,
    progressJson:JSON.stringify({speakingSkipped:true})};
  let evidence = [], writes = [];
  const context = vm.createContext({console, Date, Buffer, setTimeout, clearTimeout,
    readJsonBody:async request => request.payload,
    jsonOK:value => value, jsonBadRequest:error => ({error}), jsonServerError:error => {throw error;},
    wixData: {
      get:async () => structuredClone(session),
      update:async (collection, row) => {writes.push({collection,row});return row;},
      query:() => ({eq(){return this;},limit(){return this;},find:async options => {
        assert.equal(options.consistentRead, true);
        return {items:evidence};
      }})
    }
  });
  vm.runInContext(source, context);
  context.buildResultSummary = async () => ({finalLevel:'A2'});
  const request = {payload:{sessionId:'qa', clientSessionId:'owner', retrySpeaking:true}};
  let result = await context.resumePlacement(request);
  assert.equal(result.status, 'active');
  assert.equal(result.phase, 'speaking');
  assert.equal(result.moduleId, 'speaking-a2');
  assert.equal(writes.length, 1);
  assert.ok(writes.every(write => write.collection.endsWith('Sessions')), 'Objective answers must not be written');
  assert.equal(session.status, 'completed', 'Fixture source remains completed for further cases');
  writes = [];
  evidence = [{metricsJson:JSON.stringify({composite:5.2,reviewRequired:false})}];
  result = await context.resumePlacement(request);
  assert.ok(result.error, 'A scored attempt cannot be reopened by an old skipped flag');
  assert.equal(writes.length, 0);
  evidence = [{metricsJson:JSON.stringify({reviewRequired:true})}];
  result = await context.resumePlacement(request);
  assert.equal(result.status, 'active', 'Existing technical-review recovery stays available');
  writes = [];
  evidence = [];
  result = await context.resumePlacement({payload:{...request.payload, clientSessionId:'different-owner'}});
  assert.ok(result.error);
  assert.equal(writes.length, 0);
  session.progressJson = '{}';
  result = await context.resumePlacement(request);
  assert.ok(result.error, 'Missing evidence without an explicit skip does not reopen arbitrarily');
  assert.equal(writes.length, 0);
  console.log(`${relative}: voluntary owned skipped-Speaking recovery, valid-score protection and unchanged objective answers passed.`);
}

(async () => {
  await verify('wix-backend/placement.js');
  await verify('YoungLearners/wix-backend/young-placement.js');
  await verifyState('wix-backend/placement.js');
  await verifyState('YoungLearners/wix-backend/young-placement.js');
  await verifyProviderBudget('wix-backend/gemini-speaking.js');
  await verifyProviderBudget('YoungLearners/wix-backend/young-gemini-speaking.js');
  await verifySkippedRecovery('wix-backend/placement.js');
  await verifySkippedRecovery('YoungLearners/wix-backend/young-placement.js');
})().catch(error => { console.error(error); process.exitCode = 1; });
