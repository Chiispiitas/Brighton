import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {challengeQuestions} from '../content/unit1.mjs';
import {getActivityQuestions} from '../content/engine.mjs';
test('all platform listening recordings are unique, intact, under 20 seconds, with answer-gated transcripts',()=>{
 const manifest=JSON.parse(fs.readFileSync(new URL('../assets/audio/platform-listening-v1/manifest.json',import.meta.url)));
 const qs=challengeQuestions.filter(q=>q.audio);assert.equal(qs.length,36);assert.equal(new Set(qs.map(q=>q.audio)).size,36);assert.equal(manifest.failures.length,0);
 for(const q of qs){const m=manifest.files[q.id];assert.ok(m);assert.ok(m.durationSeconds>0&&m.durationSeconds<=20);assert.ok(q.transcript);assert.ok(q.audio.includes('/platform-listening-v1/'));const bytes=fs.readFileSync(new URL('../'+q.audio.replace(/^\.\//,''),import.meta.url));assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),m.sha256);}
 for(const lesson of ['1a','1b','1c','1d'])for(const q of getActivityQuestions('listen-'+lesson,{count:'all',seed:1})){assert.ok(q.transcript);assert.ok(q.listening);}
});
