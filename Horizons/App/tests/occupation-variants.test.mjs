import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {wordById} from '../content/unit1.mjs';import * as app from '../content/engine.mjs';import * as server from '../backend/src/content/engine.mjs';
for(const [label,e] of [['app',app],['server',server]])test(label+': gendered jobs have distinct cues, answers and pairs',()=>{
 const qs=e.getActivityQuestions('topic-1b-jobs',{count:512,seed:1});
 for(const [term,cue,form,other] of [['actor','actor','male','actress'],['actress','actriz','female','actor'],['waiter','mesero','male','waitress'],['waitress','mesera','female','waiter']]){
 const q=qs.find(q=>q.word?.term===term);assert.ok(q,term);assert.equal(q.word.spanish,cue);assert.match(q.prompt,new RegExp(form+' job title'));assert.equal(e.checkAnswer(q,term).correct,true);assert.equal(e.checkAnswer(q,other).correct,false);
 const listening=e.makeVocabularyQuestions([q.word],{mode:'listening'})[0];assert.equal(listening.audioWordId,q.word.id);assert.equal(listening.correctText,term);
 }
 const pairs=e.getMatchingPairs({chunkIds:['1b-jobs-places'],count:'all',seed:1});assert.equal(pairs.find(q=>q.left==='actor').right,'actor');assert.equal(pairs.find(q=>q.left==='actress').right,'actriz');
});
test('both job pairs have individual pictures and matching recorded pronunciation',()=>{
 const m=JSON.parse(fs.readFileSync(new URL('../assets/art/manifest.json',import.meta.url))),audio=JSON.parse(fs.readFileSync(new URL('../assets/audio/manifest.json',import.meta.url)));
 for(const term of ['actor','actress','waiter','waitress']){const word=wordById['v-jobs-'+term];assert.ok(m.vocabulary[term]);assert.ok(audio.files[word.id]);assert.ok(fs.existsSync(new URL('../'+m.vocabulary[term].src,import.meta.url)));assert.ok(fs.existsSync(new URL('../'+audio.files[word.id].src,import.meta.url)));}
 assert.notDeepEqual(m.vocabulary.actor,m.vocabulary.actress);assert.notDeepEqual(m.vocabulary.waiter,m.vocabulary.waitress);
});
