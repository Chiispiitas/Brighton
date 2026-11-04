import test,{after} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {course,vocabulary,wordById,chunks,chunkById,grammarSets,games,activities,activityById,lessons,sourceBanks,numberToWords} from '../content/unit1.mjs';
import {buildQuiz,getWordsForChunks,getWordsForLessons,getMatchingPairs,getActivityQuestions,createPracticeSession,makeVocabularyQuestions,makeLockerChallenge,normalizeAnswer,checkAnswer,isCorrect,validateContent} from '../content/engine.mjs';

const app=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const book=path.resolve(app,'../A1');
const original=JSON.parse(fs.readFileSync(path.join(book,'Practice/Vocabulary/study-vocabulary.json'),'utf8')).topics.filter(x=>x.unit===1);
const completed=[];let declared=0;
const verify=(name,fn)=>{declared++;test(name,()=>{fn();completed.push(name);});};
const getRight=q=>q.type==='choice'?q.answer:q.type==='order'?q.answer:q.accepted[0];

verify('all nine actual Unit 1 reference banks remain exactly covered by their lesson sets',()=>{
 assert.equal(sourceBanks.length,9);
 assert.deepEqual(sourceBanks.map(x=>[x.topic,x.lesson,x.required_items]),original.map(x=>[x.topic,x.lesson,x.required_items]));
 for(const bank of sourceBanks){
  const terms=new Set(getWordsForLessons([bank.lesson]).map(x=>x.term));
  for(const term of bank.required_items)assert.ok(terms.has(term),`${bank.lesson}/${bank.topic}: missing ${term}`);
 }
 const bankTerms=new Set(original.flatMap(x=>x.required_items));
 assert.equal(bankTerms.size,135);
 assert.equal(course.requiredBankEntries,135);
 assert.deepEqual(new Set(vocabulary.filter(x=>!x.supportOnly).map(x=>x.term)),bankTerms);
});

verify('all Unit 1 lesson, word-set and activity identifiers are valid and reachable',()=>{
 assert.deepEqual(validateContent(),[]);
 assert.deepEqual(lessons.map(x=>x.id),['1A','1B','1C','1D']);
 assert.equal(chunks.length,23);
 for(const chunk of chunks){
  assert.ok(chunk.wordIds.length>=3&&chunk.wordIds.length<=12,`${chunk.id} is not a useful small set`);
  assert.equal(activityById[`quiz-${chunk.id}`].chunkIds[0],chunk.id);
 }
 for(const lesson of lessons){
  assert.ok(lesson.chunkIds.length);
  assert.ok(lesson.activityIds.some(id=>activityById[id].type==='review'));
  assert.ok(lesson.activityIds.every(id=>activityById[id].lessonId===lesson.id));
 }
});

verify('combining repeated lesson references does not duplicate vocabulary learning identities',()=>{
 const all=getWordsForLessons(['1A','1B','1C','1D']);
 assert.equal(new Set(all.map(x=>x.id)).size,all.length);
 assert.equal(all.length,142);
 const personal=getWordsForChunks(['1a-your-details','1a-more-details','1d-names-contact','1d-full-card']);
 assert.equal(personal.length,13);
 const adj=getWordsForChunks(['1b-opposites','1b-people-words','1c-places-opposites','1c-place-personality']);
 assert.equal(adj.length,18);
});

verify('every selected word can appear once in an all-words round and is graded independently',()=>{
 for(const chunk of chunks){
  const questions=buildQuiz({chunkIds:[chunk.id],count:'all',seed:`all-${chunk.id}`});
  assert.equal(questions.length,chunk.wordIds.length);
  assert.deepEqual(new Set(questions.flatMap(q=>q.wordIds)),new Set(chunk.wordIds));
  for(const question of questions){
   assert.ok(question.prompt&&question.explanation);
   assert.ok(isCorrect(question,getRight(question)),question.id);
   assert.equal(isCorrect(question,'This is not an answer.'),false);
   assert.equal(checkAnswer(question,'This is not an answer.').masteryEligible,false);
  }
 }
});

verify('choice sets have one correct choice, no duplicate labels, and every wrong choice fails',()=>{
 const questions=buildQuiz({lessonIds:['1A','1B','1C','1D'],mode:'mixed',count:'all',seed:'all-choice-checks'});
 for(const q of questions.filter(q=>q.type==='choice')){
  assert.equal(q.choices.filter(x=>x.id===q.answer).length,1,q.id);
  assert.equal(new Set(q.choices.map(x=>normalizeAnswer(x.text,q.normalization))).size,q.choices.length,q.id);
  for(const wrong of q.choices.filter(x=>x.id!==q.answer))assert.equal(isCorrect(q,wrong.id),false,`${q.id}: ${wrong.text}`);
 }
 const positions=new Set();
 for(let seed=0;seed<80;seed++){
  const q=makeVocabularyQuestions([wordById['v-jobs-teacher']],{seed})[0];
  positions.add(q.choices.findIndex(x=>x.id===q.answer));
 }
 assert.equal(positions.size,4,'The correct answer should not stay in one slot.');
});

verify('synonyms do not appear as false distractors or falsely master an unseen bank spelling',()=>{
 for(const word of vocabulary){
  const q=makeVocabularyQuestions([word],{seed:word.id})[0];
  const equivalents=new Set([word.term,...word.aliases||[]].map(x=>normalizeAnswer(x)));
  for(const wrong of q.choices.filter(x=>x.id!==q.answer))assert.equal(equivalents.has(normalizeAnswer(wrong.text)),false,`${word.term}: false synonym ${wrong.text}`);
 }
 const hi=makeVocabularyQuestions([wordById['v-greetings-hi']],{mode:'recall'})[0];
 const result=checkAnswer(hi,'Hello');
 assert.equal(result.correct,true);
 assert.deepEqual(result.wordIds,['v-greetings-hello']);
 const calm=makeVocabularyQuestions([wordById['v-adjectives-calm']],{mode:'recall'})[0];
 assert.equal(checkAnswer(calm,'quiet').correct,true);
 assert.equal(checkAnswer(calm,'quiet').masteryEligible,false);
 assert.equal(checkAnswer(calm,'calm').masteryEligible,true);
});

verify('capital-letter practice really checks capitals and punctuation while ordinary recall is forgiving',()=>{
 const capital=getActivityQuestions('practice-1d-capitals',{count:'all',seed:'capital-check'}).find(q=>q.id==='caps-i');
 assert.equal(isCorrect(capital,'I am from Canada.'),true);
 assert.equal(isCorrect(capital,'i am from canada.'),false);
 assert.equal(isCorrect(capital,'I am from Canada'),false);
 const contraction=getActivityQuestions('practice-1b-contractions',{count:'all',seed:'apostrophe-check'}).find(q=>q.id==='contract-0');
 assert.equal(isCorrect(contraction,'I’m a student!'),true);
 assert.equal(isCorrect(contraction,'Im a student.'),false);
 assert.equal(isCorrect(contraction,'I am a student.'),false,'The task explicitly asks for a short form.');
 const country=makeVocabularyQuestions([wordById['v-countries-the-us']],{mode:'recall'})[0];
 assert.equal(isCorrect(country,'USA'),true);
 assert.equal(isCorrect(country,'Canada'),false);
});

verify('sentence builders accept the correct order and reject a bag of the same words in the wrong order',()=>{
 for(const set of grammarSets){
  const questions=getActivityQuestions(`practice-${set.id}`,{count:'all',seed:'builders'});
  for(const q of questions.filter(q=>q.type==='order')){
   assert.ok(q.sentenceTokens.every(x=>x.id&&x.text));
   assert.equal(new Set(q.sentenceTokens.map(x=>x.id)).size,q.sentenceTokens.length);
   const correct=String(q.answer).split(' ');
   assert.equal(isCorrect(q,correct),true,q.id);
   assert.equal(isCorrect(q,[...correct].reverse()),false,q.id);
  }
 }
 const spelling=getActivityQuestions('1a-name-password',{count:'all',seed:'letters'});
 const ariana=spelling.find(q=>q.answer==='ARIANA');
 assert.equal(isCorrect(ariana,['A','R','I','A','N','A']),true);
 assert.equal(isCorrect(ariana,['A','R','A','I','N','A']),false);
});

verify('matching games preserve one-to-one meaning, opposite and country relationships',()=>{
 for(const game of games.filter(x=>['memory','matching','countries','opposites'].includes(x.type))){
  const pairs=getMatchingPairs({activityId:game.id,count:6,seed:game.id});
  assert.ok(pairs.length>=3,game.id);
  assert.equal(new Set(pairs.map(x=>x.id)).size,pairs.length);
  assert.equal(new Set(pairs.map(x=>normalizeAnswer(x.left))).size,pairs.length);
  assert.equal(new Set(pairs.map(x=>normalizeAnswer(x.right))).size,pairs.length);
  for(const pair of pairs)assert.ok(wordById[pair.wordId]);
 }
 const postcards=getMatchingPairs({activityId:'1c-postcards',count:'all',seed:'postcards'});
 assert.equal(postcards.length,11);
 assert.ok(postcards.some(x=>x.left==='Ecuador'&&x.right==='Ecuadorian'));
 const opposites=getMatchingPairs({activityId:'1b-opposite-pairs',count:'all'});
 assert.equal(opposites.length,5);
 assert.ok(opposites.some(x=>x.left==='cheap'&&x.right==='expensive'));
});

verify('locker codes retain number boundaries and never turn the game into arithmetic',()=>{
 const qs=makeLockerChallenge({seed:'codes',rounds:4});
 assert.equal(qs.length,4);
 const ten=qs.find(q=>q.answer==='2 10 6');
 assert.ok(ten);
 assert.equal(isCorrect(ten,'2 10 6'),true);
 assert.equal(isCorrect(ten,[2,10,6]),true);
 assert.equal(isCorrect(ten,'2-10-6'),true);
 assert.equal(isCorrect(ten,'21 0 6'),false);
 assert.equal(isCorrect(ten,'2106'),false);
 for(const q of qs){assert.ok(q.previewMs>=3000);assert.ok(q.preview.includes(' · '));}
});

verify('number spellings cover zero to one hundred without accepting teen/tens confusions',()=>{
 const fixtures={0:'zero',11:'eleven',12:'twelve',13:'thirteen',14:'fourteen',15:'fifteen',18:'eighteen',20:'twenty',21:'twenty-one',30:'thirty',35:'thirty-five',40:'forty',48:'forty-eight',50:'fifty',80:'eighty',90:'ninety',99:'ninety-nine',100:'one hundred'};
 for(const[value,words]of Object.entries(fixtures))assert.equal(numberToWords(Number(value)),words);
 assert.throws(()=>numberToWords(-1),RangeError);assert.throws(()=>numberToWords(101),RangeError);
 const fourteen=makeVocabularyQuestions([wordById['v-numbers-fourteen']],{mode:'recall'})[0];
 assert.equal(isCorrect(fourteen,'fourteen'),true);assert.equal(isCorrect(fourteen,'forty'),false);
});

verify('all path activities produce real questions; mixed reviews contain vocabulary and grammar',()=>{
 for(const activity of activities){
  const questions=getActivityQuestions(activity.id,{count:'all',seed:activity.id});
  assert.ok(questions.length>=2,activity.id);
  for(const question of questions){assert.ok(question.prompt);assert.ok(isCorrect(question,getRight(question)),question.id);}
 }
 for(const lesson of lessons){
  const qs=getActivityQuestions(`review-${lesson.id.toLowerCase()}`,{count:8,seed:lesson.id});
  assert.ok(qs.some(q=>q.kind==='vocabulary'),lesson.id);
  assert.ok(qs.some(q=>q.kind==='grammar'),lesson.id);
 }
});

verify('real listening questions point only to existing book recordings with source-key answers',()=>{
 const checks={'listen-class':'Class 4','listen-teacher':'Mr. Wilson','listen-job-0':'doctor','listen-job-1':'farmer','listen-job-2':'office worker','listen-job-3':'waitress','listen-job-4':'salesclerk','listen-two-jobs':'Tom','listen-emma-country':'Canada','listen-emma-last':'Carter'};
 const all=['listen-1a','listen-1b','listen-1c','listen-1d'].flatMap(id=>getActivityQuestions(id,{count:'all',seed:id}));
 for(const q of all){assert.ok(fs.existsSync(path.resolve(app,q.audio)),q.audio);if(checks[q.id])assert.equal(q.correctText,checks[q.id]);}
 assert.equal(new Set(all.map(q=>q.audio)).size,12);
 assert.equal(all.some(q=>q.audio.includes('Track 1.11.mp3')),false,'The duplicate legacy1.11 is not an active source.');
});

verify('fresh club-card practice uses fictional details and checks fields rather than stereotypes',()=>{
 const qs=getActivityQuestions('1d-club-card',{count:'all',seed:'forms'});
 const first=qs.find(q=>q.id==='form-first-name'),last=qs.find(q=>q.id==='form-last-name');
 assert.equal(isCorrect(first,'Camila'),true);assert.equal(isCorrect(first,'Rios'),false);
 assert.equal(isCorrect(last,'Rios'),true);assert.equal(isCorrect(last,'Camila'),false);
 const telephone=qs.find(q=>q.id==='form-copy-phone');
 assert.equal(isCorrect(telephone,'07 410 632'),true);
 assert.equal(isCorrect(telephone,'07 410 623'),false);
 assert.ok(qs.some(q=>q.passage?.includes('@club.example')));
});

verify('sessions, selection validation and priority review preserve meaningful learning boundaries',()=>{
 assert.throws(()=>getWordsForChunks(['missing']),RangeError);
 assert.throws(()=>getActivityQuestions('missing'),RangeError);
 assert.throws(()=>buildQuiz({count:-1}),RangeError);
 assert.equal(buildQuiz({count:0}).length,0);
 const target='v-jobs-nurse';
 const qs=buildQuiz({chunkIds:['1b-more-jobs'],priorityWordIds:[target],count:1,seed:'priority'});
 assert.equal(qs[0].wordIds[0],target);
 assert.equal(buildQuiz({chunkIds:['1b-more-jobs'],excludeWordIds:[target],count:'all'}).some(q=>q.wordIds.includes(target)),false);
 const session=createPracticeSession({activityId:'quiz-1b-more-jobs',count:'all',seed:'session'});
 assert.equal(session.activityId,'quiz-1b-more-jobs');assert.deepEqual(session.lessonIds,['1B']);assert.equal(session.total,4);
 const q={id:'study-only',type:'text',answer:'teacher',accepted:['teacher'],wordIds:['v-jobs-teacher'],retrieval:false};
 assert.equal(checkAnswer(q,'teacher').masteryEligible,false,'Viewing or copying a study item is not a successful retrieval.');
});

after(()=>{
 const files=['Practice/Vocabulary/study-vocabulary.json','Practice/Vocabulary/V1.html','Practice/Grammar/G1.html','Lessons/1A.html','Lessons/1B.html','Lessons/1C.html','Lessons/1D.html','Answer keys/Grammar practice 1-4.md','Answer keys/Vocabulary practice.md'];
 const report={date:'2026-11-04',scope:'A1 Unit 1 companion content and grading; source books are read-only',status:completed.length===declared?'PASS':'FAIL',
  sourceBankReferences:sourceBanks.length,canonicalRequiredEntries:135,lessonSpecificRequiredOccurrences:sourceBanks.reduce((sum,x)=>sum+x.required_items.length,0),
  extraSourceQuestionModels:7,availableVocabularyEntries:vocabulary.length,lessonCodes:lessons.map(x=>x.id),chunks:chunks.length,activities:activities.length,
  grammarSets:grammarSets.map(x=>({id:x.id,title:x.title,questions:x.questions.length})),games:games.map(x=>({id:x.id,type:x.type})),
  sourceAudioFilesUsed:12,testsDeclared:declared,testsPassed:completed.length,completedChecks:completed,
  missingReferenceEntries:[],masteryPolicy:'Only successful retrieval awards word IDs. Accepted synonyms can be correct without claiming that an unentered bank spelling was recalled; mere viewing never masters an item.',
  sourceFiles:files.map(file=>({file:`Horizons/A1/${file}`,sha256:crypto.createHash('sha256').update(fs.readFileSync(path.join(book,file))).digest('hex')})),
  limitations:'This verifies the curriculum/content layer and grading. Final artwork, integrated UI, backend persistence and published browser checks belong to the app release review.'};
 fs.mkdirSync(path.join(app,'reports'),{recursive:true});fs.writeFileSync(path.join(app,'reports/content-coverage.json'),JSON.stringify(report,null,2)+'\n');
});
