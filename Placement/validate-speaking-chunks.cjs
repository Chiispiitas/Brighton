/* Speaking uploads must use a read-your-writes query after the last chunk.
   A replica that has not caught up is deliberately empty in this regression. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

async function verify(relative) {
  const source = fs.readFileSync(path.join(__dirname, relative), 'utf8')
    .replace(/^import[\s\S]*?;\s*$/gm, '').replace(/export /g, '');
  const reads = [];
  let rows = [
    {chunkIndex:1, totalChunks:2, clientSessionId:'owner', chunkBase64:'BBBB'},
    {chunkIndex:0, totalChunks:2, clientSessionId:'owner', chunkBase64:'AAAA'}
  ];
  const context = vm.createContext({console, Date, Buffer, setTimeout, clearTimeout,
    wixData: {query: () => ({
      offset:0,
      eq() { return this; }, ascending() { return this; },
      skip(offset) { this.offset = offset; return this; },
      limit(size) { this.size = size; return this; },
      async find(options) {
        reads.push(this.size);
        return {items:options.consistentRead ? rows.slice(this.offset, this.offset + this.size) : []};
      }
    })}
  });
  vm.runInContext(source, context);
  const payload = {audioUploadId:'qa-upload-1234', audioChunkCount:2};
  const session = {_id:'qa-session', clientSessionId:'owner'};
  assert.equal(await context.resolveSpeakingAudioBase64(payload, session), 'AAAABBBB');
  assert.deepEqual(reads, [4]);
  rows = rows.slice(0, 1);
  await assert.rejects(context.resolveSpeakingAudioBase64(payload, session), /incomplete/);
  rows.push({...rows[0], chunkIndex:0, clientSessionId:'different-owner'});
  await assert.rejects(context.resolveSpeakingAudioBase64(payload, session), /invalid/);
  rows = [0, 0, 1].map(index => ({chunkIndex:index, totalChunks:2, clientSessionId:'owner',
    chunkBase64:index === 0 ? 'AAAA' : 'BBBB'}));
  assert.equal(await context.resolveSpeakingAudioBase64(payload, session), 'AAAABBBB');
  rows[1].chunkBase64 = 'CCCC';
  await assert.rejects(context.resolveSpeakingAudioBase64(payload, session), /conflicting/);
  rows = Array.from({length:60}, (_, index) => ({chunkIndex:index, totalChunks:60,
    clientSessionId:'owner', chunkBase64:'A'.repeat(200000)}));
  assert.equal((await context.resolveSpeakingAudioBase64({...payload,audioChunkCount:60}, session)).length, 12000000);
  assert.equal(Math.max(...reads), 4, 'Never return a multi-megabyte recording in a single CMS read');
  rows.forEach(row => { row.totalChunks = 61; });
  rows.push({...rows[0], chunkIndex:60});
  await assert.rejects(context.resolveSpeakingAudioBase64({...payload,audioChunkCount:61}, session), /too large/);
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
  const chunks = new Map(), idOnlyReads = [];
  let hasSpeaking = true, inserts = 0, writtenSession, removalFailure = true;
  const activityPatches = [];
  const context = vm.createContext({console, Date, Buffer, TextEncoder,
    crypto:require('node:crypto').webcrypto, setTimeout, clearTimeout,
    readJsonBody:async request => request.payload,
    jsonOK:value => value, jsonBadRequest:error => ({error}), jsonServerError:error => {throw error;},
    wixData: {
      get:async (collection, id, options) => !options.consistentRead ? null :
        collection.endsWith('Sessions') ? structuredClone(session) : chunks.get(id),
      insert:async (collection, row) => {
        assert.ok(collection.endsWith('SpeakingChunks'));
        if (chunks.has(row._id)) throw new Error('Duplicate');
        chunks.set(row._id, structuredClone(row));
        inserts++;
        if (inserts === 1) throw new Error('Acknowledgement lost after commit');
      },
      update:async (collection, row) => {
        if (collection.endsWith('Sessions')) writtenSession = row;
        return row;
      },
      patch:async (collection,id,fields) => {activityPatches.push({collection,id,fields});},
      bulkRemove:async (collection, ids) => {
        assert.ok(collection.endsWith('SpeakingChunks'));
        const errors = [];
        for (const [index,id] of ids.entries()) {
          if (removalFailure) { errors.push({originalIndex:index,item:id}); removalFailure=false; }
          else chunks.delete(id);
        }
        return {removed:ids.length-errors.length,errors};
      },
      query:collection => ({
        filters:[],
        eq(key,value) { this.filters.push(row => row[key] === value); return this; },
        gt(key,value) { this.filters.push(row => row[key] > value); return this; },
        fields(key) { assert.equal(key,'_id'); this.idOnly=true; return this; },
        ascending(){return this;}, skip(){return this;}, limit(size) { this.size=size; return this; },
        async find(options) {
          if (collection.endsWith('SpeakingChunks')) {
            assert.equal(options.consistentRead,true);
            const rows = [...chunks.values()].filter(row => this.filters.every(check => check(row)))
              .sort((a,b) => a._id < b._id ? -1 : 1).slice(0,this.size);
            if (this.idOnly) {
              idOnlyReads.push(rows.length);
              return {items:rows.map(({_id}) => ({_id}))};
            }
            return {items:rows};
          }
          if (collection.endsWith('Speaking')) return {items:options.consistentRead && hasSpeaking ? [speaking] : []};
          return {items:[]};
        }
      })
    }
  });
  vm.runInContext(source, context);
  assert.equal((await context.getPlacementSession(session._id, 'owner'))._id, session._id);
  assert.equal((await context.buildResultSummary(session)).skills.speaking.displayScore, '4.3/10');
  const activity = await context.touchPlacementActivity({payload:{sessionId:session._id, clientSessionId:'owner', placementVersion:version}});
  assert.ok(activity.success);
  assert.equal(activityPatches.length,1);
  assert.equal(activityPatches[0].fields.length,1);
  assert.equal(activityPatches[0].fields[0].fieldPath,'updatedAt', 'A late heartbeat never restores old speaking state');
  assert.equal(activityPatches[0].fields[0].action,'SET_FIELD');
  const upload = {sessionId:session._id, clientSessionId:'owner', placementVersion:version,
    moduleId:'speaking-a2', uploadId:'qa-upload-1234', chunkIndex:0, totalChunks:24,
    audioMimeType:'audio/mp4', chunkBase64:'AAAA'};
  const repeated = await Promise.all(Array.from({length:5}, () => context.uploadSpeakingChunk({payload:upload})));
  assert.ok(repeated.every(result => result.success), 'Concurrent transmissions and lost write acknowledgements are idempotent');
  assert.equal(inserts, 1);
  assert.match((await context.uploadSpeakingChunk({payload:{...upload, chunkBase64:'BBBB'}})).error, /conflicting/);
  assert.equal(chunks.values().next().value.chunkBase64,'AAAA');
  await Promise.all(Array.from({length:23}, (_,index) =>
    context.uploadSpeakingChunk({payload:{...upload,chunkIndex:index+1}})));
  const other = await context.uploadSpeakingChunk({payload:{...upload,uploadId:'qa-other-upload'}});
  assert.ok(other.success);
  assert.equal(await context.removeSpeakingUpload(session._id,upload.uploadId),24);
  assert.deepEqual(idOnlyReads,[20,4]);
  assert.equal(chunks.size,1, 'Cleanup leaves other uploads intact');
  hasSpeaking = false;
  const diagnostics = {technicalCode:'MIC_PERMISSION_TIMEOUT', browserFamily:'Safari', platformFamily:'iOS',
    captureMode:'native-audio', durationSeconds:20, recordedBytes:2000, audioMimeType:'audio/mp4',
    audioActivityAvailable:false, audioBase64:'PRIVATE', transcript:'PRIVATE', sessionId:'PRIVATE'};
  const skipped = await context.skipSpeaking({payload:{sessionId:session._id, clientSessionId:'owner',
    placementVersion:version, moduleId:'speaking-a2', diagnostics}});
  assert.equal(chunks.size,0, 'Skipping cleans up all remaining transport data');
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
  const waits = [], bodies = [], signals = [];
  class ClockDate extends Date { static now() { return now; } }
  const context = vm.createContext({console:{...console,error(){}}, Date:ClockDate, Buffer, AbortController,
    setTimeout(fn, ms) { waits.push(ms); return setTimeout(() => { now += ms; fn(); }, 0); },
    clearTimeout,
    fetch:(url, options) => { requests++; bodies.push(JSON.parse(options.body)); signals.push(options.signal); return new Promise(() => {}); }
  });
  vm.runInContext(source, context);
  const result = await context.requestSpeakingAssessment('test-key', 'test-context', 'AAAA', 'audio/mp4');
  assert.equal(result.ok, false);
  assert.equal(now, 45000);
  assert.deepEqual(waits, [25000,20000]);
  assert.equal(requests, 2, 'A stalled primary examiner leaves time for an independent transport');
  assert.ok(signals.every(signal => signal.aborted), 'Timed-out HTTP requests are cancelled');
  assert.deepEqual(bodies.map(body => body.model || 'generateContent'), ['gemini-3.5-flash-lite','generateContent']);
  assert.equal(bodies[0].generation_config, undefined, 'Lite keeps its proven default thinking configuration');
  assert.equal(context.makeGenerateContentBody('context', 'AAAA', 'audio/mp4', true, 'gemini-3.5-flash-lite').generationConfig.thinkingConfig, undefined);
  assert.equal(context.normalizeAudioMime('audio/mp4;codecs=mp4a.40.2'), 'audio/m4a');
  console.log(`${relative}: both independently bounded provider transports were attempted within 45 seconds; Safari MIME normalization passed.`);
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
