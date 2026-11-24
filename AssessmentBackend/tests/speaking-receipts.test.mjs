import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { webcrypto } from 'node:crypto';

const source = '../../Placement/wix-backend/speaking-receipts.js';
const sourceUrl = new URL(source, import.meta.url);
const packagedUrl = new URL('../canonical/Placement/wix-backend/speaking-receipts.js', import.meta.url);
const code = fs.readFileSync(fs.existsSync(sourceUrl) ? sourceUrl : packagedUrl, 'utf8');
const payload = {
  audioUploadId:'synthetic-upload', audioChunkCount:1, audioMimeType:'audio/wav',
  durationSeconds:30, maximumSeconds:45, promptId:'sp-a2-01'
};
const session = {
  _id:'synthetic-session', clientSessionId:'synthetic-owner', moduleId:'speaking-a2',
  provisionalLevel:'A2', status:'active', phase:'speaking', progressJson:'{}'
};
const progress = row => JSON.parse(row.progressJson);

async function setup() {
  const sessions = new Map([[session._id,structuredClone(session)]]);
  const chunks = new Map([['audio',{_id:'audio',sessionId:session._id,uploadId:payload.audioUploadId,_createdDate:new Date(Date.UTC(2026,10,24,12))}]]);
  const stores = {sessions,chunks};
  const writes = [];
  let time = Date.UTC(2026,10,24,12);
  class Clock extends Date {
    constructor(...args) { super(...(args.length ? args : [time])); }
    static now() { return time; }
  }
  const db = {
    async get(name,id) {return structuredClone(stores[name].get(id) ?? null);},
    async update(name,row) {
      assert(stores[name].has(row._id));
      stores[name].set(row._id,structuredClone({...row,_createdDate:stores[name].get(row._id)._createdDate}));
      writes.push({name,row:structuredClone(row)});
      return row;
    },
    async insert(name,row) {
      if (stores[name].has(row._id)) throw new Error('Duplicate key');
      stores[name].set(row._id,structuredClone({...row,_createdDate:new Clock()}));
      return row;
    },
    async remove(name,id) {stores[name].delete(id);},
    async bulkRemove(name,ids) {for (const id of ids) stores[name].delete(id);},
    query(name) {
      let rows = [...stores[name].values()], offset = 0, limit = 50;
      return {
        eq(key,value) {rows = rows.filter(row => row[key] === value);return this;},
        ge(key,value) {rows = rows.filter(row => row[key] >= value);return this;},
        lt(key,value) {rows = rows.filter(row => row[key] < value);return this;},
        fields(...keys) {rows = rows.map(row => Object.fromEntries(keys.map(key=>[key,row[key]])));return this;},
        ascending() {rows.sort((a,b)=>a.updatedAt - b.updatedAt);return this;},
        skip(value) {offset=value;return this;},
        limit(value) {limit=value;return this;},
        async find() {return {items:structuredClone(rows.slice(offset,offset+limit))};}
      };
    }
  };
  const context = vm.createContext({Date:Clock,crypto:webcrypto,TextEncoder,setTimeout,clearTimeout,console});
  const module = new vm.SourceTextModule(code,{context});
  await module.link(name => {
    assert.equal(name,'wix-data');
    return new vm.SyntheticModule(['default'],function() {this.setExport('default',db);},{context});
  });
  await module.evaluate();
  const { receiveSpeaking, assessReceivedSpeaking, runNextSpeakingAssessment } = module.namespace;
  const calls = {grade:0, save:0, remove:0};
  const services = {
    sessions:'sessions', chunks:'chunks',
    resolveAudio:async receipt => receipt.audioUploadId === payload.audioUploadId && chunks.has('audio') ? 'synthetic-audio' : '',
    gradeAudio:async input => {
      calls.grade++;
      assert.equal(input.audioBase64,'synthetic-audio');
      return {inputError:false,finalLevel:'B1'};
    },
    saveGrade:async (row,grade) => {
      calls.save++;
      const result = {...row,phase:'result',finalLevel:grade.finalLevel,progressJson:'{"completed":true}'};
      await db.update('sessions',result);
      await services.removeChunks(row._id);
      return result;
    },
    removeChunks:async id => {
      calls.remove++;
      for (const [key,row] of chunks) if (row.sessionId === id) chunks.delete(key);
    }
  };
  const current = () => sessions.get(session._id);
  const receive = () => receiveSpeaking(structuredClone(session),payload,'sessions','chunks');
  const assess = (row = current()) => assessReceivedSpeaking(row,progress(row).speakingReceipt,services);
  const work = () => runNextSpeakingAssessment('sessions','chunks',(row,receipt) => assessReceivedSpeaking(row,receipt,services));
  return {sessions,chunks,writes,calls,services,current,receive,assess,work,setTime:value => {time=value;}};
}

test('concurrent receipt requests and late stale requests preserve one graded result',async () => {
  const f = await setup();
  const receipts = await Promise.allSettled([f.receive(),f.receive()]);
  assert.ok(receipts.some(result => result.status === 'fulfilled'));
  assert.equal(f.writes.filter(write => write.row.phase === 'speaking-assessment').length,1);
  assert.equal(f.current().finalLevel,'A2');
  assert.equal(f.calls.grade,0);
  const received = f.current();
  await Promise.all([f.assess(received),f.assess(received)]);
  assert.equal(f.calls.grade,1);
  assert.equal(f.calls.save,1);
  assert.equal(f.current().finalLevel,'B1');
  assert.equal(f.chunks.has('audio'),false);
  // A request started while the candidate was active but arrived after grading.
  await Promise.allSettled([f.receive()]);
  assert.equal(f.current().phase,'result');
  assert.equal(f.current().finalLevel,'B1');
  assert.equal(progress(f.current()).speakingReceipt,undefined);
});

test('a provider outage preserves received audio and a due worker can finish without a browser',async () => {
  const f = await setup();
  await f.receive();
  const grade = f.services.gradeAudio;
  f.services.gradeAudio = async () => {f.calls.grade++;return {inputError:true,retryReason:'provider-unavailable'};};
  assert.equal(await f.work(),true);
  assert.equal(f.current().phase,'speaking-assessment');
  assert(f.chunks.has('audio'));
  const receipt = progress(f.current()).speakingReceipt;
  assert(receipt.nextAttempt > receipt.receivedAt);
  assert.equal(await f.work(),false);
  f.services.gradeAudio = grade;
  f.setTime(receipt.nextAttempt + 1);
  assert.equal(await f.work(),true);
  assert.equal(f.calls.grade,2);
  assert.equal(f.current().phase,'result');
  assert.equal(f.current().finalLevel,'B1');
  assert.equal(f.calls.remove,1);
  assert.equal(await f.work(),false);
});

test('insufficient speech and expired recordings request a retake and release the upload',async () => {
  for (const reason of ['insufficient-evidence','assessment-expired']) {
    const f = await setup();
    await f.receive();
    const receipt = progress(f.current()).speakingReceipt;
    f.services.gradeAudio = async () => {f.calls.grade++;return {inputError:true,retryReason:'insufficient-evidence'};};
    if (reason === 'assessment-expired') f.setTime(receipt.receivedAt + 8 * 24 * 3600000);
    await f.work();
    assert.equal(f.calls.grade,reason === 'assessment-expired' ? 0 : 1);
    assert.equal(f.calls.save,0);
    assert.equal(f.current().phase,'result');
    assert.equal(f.current().finalLevel,'A2');
    assert.equal(progress(f.current()).speakingRetakeReason,reason);
    assert.equal(f.chunks.has('audio'),false);
  }
});

test('orphan cleanup retains historical and still-current recordings',async () => {
  const f = await setup();
  const rollout = Date.UTC(2026,10,24,22);
  const week = 7 * 24 * 3600000;
  const timestamps = {historical:rollout-1,firstEligible:rollout,fresh:rollout+1};
  f.chunks.clear();
  for (const [id,time] of Object.entries(timestamps)) {
    f.chunks.set(id,{_id:id,_createdDate:new Date(time)});
  }
  f.setTime(rollout + week);
  await f.work();
  assert.equal(f.chunks.size,3);
  f.setTime(rollout + week + 1);
  await f.work();
  assert.equal(f.chunks.has('firstEligible'),false);
  assert.equal(f.chunks.has('historical'),true);
  assert.equal(f.chunks.has('fresh'),true);
});
