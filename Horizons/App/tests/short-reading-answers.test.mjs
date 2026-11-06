import test from 'node:test';
import assert from 'node:assert/strict';
import {getActivityQuestions,checkAnswer} from '../content/engine.mjs';
import * as server from '../backend/src/content/engine.mjs';

for(const [name,engine] of [['app',{getActivityQuestions,checkAnswer}],['server',server]]){
 test(`${name}: class numbers accept meaningful short answers in reading rounds`,()=>{
  for(const mode of ['recall','quiz']){
   const question=engine.getActivityQuestions('read-1a',{mode,seed:'short-reading',count:100}).find(q=>q.id==='read-club-class');
   assert.ok(question);
   for(const answer of ['3','three','Class 3','class three'])assert.equal(engine.checkAnswer(question,answer).correct,true,`${mode}: ${answer}`);
   for(const answer of ['2','Class 2','13','3 or 4',''])assert.equal(engine.checkAnswer(question,answer).correct,false,`${mode}: ${answer}`);
  }
 });
 test(`${name}: room labels accept the letter without accepting the other room`,()=>{
  const questions=engine.getActivityQuestions('read-1c',{mode:'recall',seed:'short-reading',count:100});
  for(const [id,right,wrong] of [['read-room-small','B','A'],['read-room-cheap','A','B']]){
   const q=questions.find(q=>q.id===id);assert.ok(q);assert.equal(engine.checkAnswer(q,right).correct,true);assert.equal(engine.checkAnswer(q,wrong).correct,false);
  }
 });
}
