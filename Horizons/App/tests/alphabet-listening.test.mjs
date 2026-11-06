import test from 'node:test';import assert from 'node:assert/strict';
import * as app from '../content/engine.mjs';import * as server from '../backend/src/content/engine.mjs';
import {presentQuestion} from '../src/exercise-presentation.js';
for(const [name,e] of [['app',app],['server',server]])test(name+': alphabet is listening-only in Learn and every Practice mode',()=>{
 for(const mode of ['recall','choice','mixed','listening'])for(const audioEnabled of [true,false]){
 const qs=e.buildQuiz({chunkIds:['1a-alphabet-ag','1a-greetings'],mode,audioEnabled,count:'all',seed:'alphabet-only'}).filter(e.isAlphabetQuestion);assert.ok(qs.length);
 for(const q of qs){assert.equal(q.type,'choice');assert.equal(q.listening,true);assert.ok(q.audioWordId);assert.equal(presentQuestion(q,1,{typedVocabulary:true}).type,'choice');assert.equal(e.getAudioFallbackQuestion(q).listening,true);assert.equal(e.checkAnswer(q,q.correctText).correct,true);}
 }
 assert.ok(e.getActivityQuestions('topic-1a-alphabet',{count:512}).every(q=>q.listening&&q.type==='choice'));
 assert.ok(e.getActivityQuestions('1a-name-password',{count:512}).every(q=>q.listening&&q.type==='choice'&&q.audio));
 assert.equal(e.getMatchingPairs({chunkIds:['1a-alphabet-ag'],count:'all'}).length,0);
});
