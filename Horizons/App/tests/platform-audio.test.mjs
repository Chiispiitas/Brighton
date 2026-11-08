import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {challengeQuestions} from '../content/unit1.mjs';
import {getActivityQuestions} from '../content/engine.mjs';
import {platformListening,listeningVoices} from '../content/listening-scripts.mjs';
test('all platform listening recordings are unique, intact, under 20 seconds, with answer-gated transcripts',()=>{
 const manifest=JSON.parse(fs.readFileSync(new URL('../assets/audio/platform-listening-v1/manifest.json',import.meta.url)));
 const qs=challengeQuestions.filter(q=>q.audio);assert.equal(qs.length,36);assert.equal(new Set(qs.map(q=>q.audio)).size,36);assert.equal(manifest.failures.length,0);
 for(const q of qs){const m=manifest.files[q.id];assert.ok(m);assert.ok(m.durationSeconds>0&&m.durationSeconds<=20);assert.ok(q.transcript);assert.ok(q.audio.includes('/platform-listening-v1/'));const bytes=fs.readFileSync(new URL('../'+q.audio.replace(/^\.\//,''),import.meta.url));assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),m.sha256);}
 for(const lesson of ['1a','1b','1c','1d'])for(const q of getActivityQuestions('listen-'+lesson,{count:'all',seed:1})){assert.ok(q.transcript);assert.ok(q.listening);}
});

test('listening scripts require explicit casting and preserve character identities',()=>{
 const plan=JSON.parse(fs.readFileSync(new URL('../assets/audio/platform-listening-v1/plan.json',import.meta.url)));
 assert.deepEqual(plan,Object.values(platformListening));
 const records=JSON.parse(fs.readFileSync(new URL('../assets/audio/platform-listening-v1/generation-records.json',import.meta.url)));
 for(const row of plan){
  assert.equal(row.script,row.speakers.map(t=>t.text).join(' '));
  const q=challengeQuestions.find(q=>q.id===row.id);assert.equal(q.transcript,row.script);assert.ok(q.audio.endsWith('/'+row.file));
  for(const turn of row.speakers)assert.ok(listeningVoices[turn.voice]);
  if(row.file.endsWith('-voices2.mp3')){
   const record=records[row.id];assert.equal(record.file,row.file);assert.deepEqual(record.speakers,row.speakers);
   assert.deepEqual(record.inputs,row.speakers.map(t=>({text:t.text,voice_id:listeningVoices[t.voice]})));
   assert.ok(record.transcriptExactNormalizedMatch||record.transcriptReview?.accepted);assert.deepEqual(record.audioEvents,[]);
  }
 }
 const speakerAudit=JSON.parse(fs.readFileSync(new URL('../reports/listening-speakers-asr.json',import.meta.url)));
 assert.equal(speakerAudit.speakerCount,3);assert.equal(speakerAudit.sha256,records['listen-two-jobs'].sha256);
 const cast=platformListening['listen-two-jobs'].speakers;
 assert.deepEqual(cast.map(t=>t.speaker),['Sarah','Tom','Marco']);assert.equal(new Set(cast.map(t=>t.voice)).size,3);
 assert.equal(platformListening['listen-spell-0'].speakers[0].voice,'Mark Casual');
 assert.equal(platformListening['listen-spell-2'].speakers[0].voice,'Jarnathan');
});
