import test from 'node:test';
import assert from 'node:assert/strict';
import { vocabulary, lessons, activities, activityById, pathNodes, pathNodeById, grammarSets } from '../content/unit1.mjs';
import { makeVocabularyQuestions, buildQuiz, getActivityQuestions, getMatchingPairs, getAudioFallbackQuestion, checkAnswer, compileAnswerPattern, matchesAcceptedAnswer } from '../content/engine.mjs';

test('the main path has only book topics and two listening/reading games per lesson',()=>{
 assert.equal(pathNodes.length,21);
 assert.deepEqual(pathNodes.filter(n=>n.lessonId==='1A'&&n.kind==='topic').map(n=>n.title),['Greetings','Alphabet','Numbers','Verb to be']);
 for(const lesson of lessons){const nodes=lesson.pathNodeIds.map(id=>pathNodeById[id]);assert.ok(nodes.every(Boolean));assert.equal(nodes.filter(n=>n.kind==='game').length,2);assert.deepEqual(nodes.filter(n=>n.kind==='game').map(n=>n.type),['listening','reading']);assert.ok(nodes.filter(n=>n.kind==='topic').length<=4);for(const node of nodes)assert.equal(activityById[node.id].id,node.id);}
 assert.ok(activities.length>48,'Existing activity IDs remain in the compatible archive.');
 for(const id of ['quiz-1a-greetings','practice-1a-be','review-1d','1c-postcards'])assert.ok(activityById[id]);
});

test('every study-bank entry has a Spanish cue, including letters, numbers and source questions',()=>{
 assert.equal(vocabulary.length,142);assert.ok(vocabulary.every(w=>typeof w.spanish==='string'&&w.spanish.trim()));
 assert.equal(vocabulary.find(w=>w.term==='teacher').spanish,'profesor / profesora');
 assert.equal(vocabulary.find(w=>w.term==='forty').spanish,'cuarenta');
 assert.equal(vocabulary.find(w=>w.term==='Aa').spanish,'letra a');
 assert.equal(vocabulary.find(w=>w.term==='Where are you from?').spanish,'¿De dónde eres?');
});

test('lexical recall stays typed, sentence vocabulary uses choices, and grammar keeps its target',()=>{
 for(const q of buildQuiz({lessonIds:lessons.map(l=>l.id),mode:'mixed',count:'all',seed:'typed-default'})){assert.equal(q.type,q.kind==='vocabulary'&&(q.word.kind==='question'||q.word.answerMode==='choice')?'choice':'text');if(q.kind==='vocabulary'){assert.ok(q.prompt.includes(q.translation));assert.ok(!q.prompt.includes(q.word.meaning));}}
 for(const set of grammarSets){const questions=getActivityQuestions(`practice-${set.id}`,{count:'all',seed:'typed-grammar'});assert.ok(questions.length);assert.ok(questions.every(q=>q.type==='text'));for(const q of questions)assert.equal(checkAnswer(q,q.accepted[0]).correct,true,q.id);}
});

test('silent alphabet cues use Spanish letter names instead of copying the displayed letter',()=>{
 const alphabet=vocabulary.filter(w=>w.kind==='letter'),typed=makeVocabularyQuestions(alphabet),listening=makeVocabularyQuestions(alphabet,{mode:'listening',seed:'letter-cues'});
 for(const [letter,name] of [['H','hache'],['M','eme'],['J','jota']]){
  const word=alphabet.find(w=>w.letter===letter),q=typed.find(q=>q.word.id===word.id),fallback=getAudioFallbackQuestion(listening.find(q=>q.word.id===word.id));
  assert.equal(word.term,`${letter}${letter.toLowerCase()}`);assert.equal(word.spanish,`letra ${letter.toLowerCase()}`);
  assert.equal(q.prompt,`Write the capital letter.\n${name}`);assert.equal(q.translation,name);assert.equal(q.answer,letter);assert.ok(!q.prompt.includes(word.spanish));assert.ok(!q.prompt.includes(word.term));assert.equal(checkAnswer(q,letter).correct,true);
  assert.equal(fallback.id,q.id);assert.equal(fallback.prompt,q.prompt);assert.equal(fallback.answer,q.answer);assert.equal(fallback.listening,undefined);
 }
 const groups=getActivityQuestions('listen-1a',{count:'all',audioEnabled:false,seed:'letter-group-cues'});
 assert.equal(groups.find(q=>q.id==='listen-alphabet-start').prompt,'Write the capital letters.\na / be / ce');
 assert.equal(groups.find(q=>q.id==='listen-alphabet-end').prompt,'Write the capital letters.\nequis / ye / zeta');
});

test('all matching games use Spanish translations with unique labels on each side',()=>{
 for(const id of ['1a-greeting-pairs','1b-duty-board','1b-opposite-pairs','1c-postcards']){const pairs=getMatchingPairs({activityId:id,count:'all',seed:id});assert.ok(pairs.length>=3);assert.equal(new Set(pairs.map(p=>p.left)).size,pairs.length);assert.equal(new Set(pairs.map(p=>p.right)).size,pairs.length);for(const p of pairs){assert.equal(p.kind,'translation');assert.equal(p.right,vocabulary.find(w=>w.id===p.wordId).spanish);}}
});

test('reusable anchored patterns allow reviewed variants without accepting extra words or regex injection',()=>{
 assert.ok(compileAnswerPattern(['teacher']).source.startsWith('^'));assert.ok(compileAnswerPattern(['teacher']).source.endsWith('$'));
 assert.equal(matchesAcceptedAnswer('  TEACHER!  ',['teacher']),true);
 assert.equal(matchesAcceptedAnswer('not a teacher',['teacher']),false);
 assert.equal(matchesAcceptedAnswer('I’m a student.',['I am a student.'],{allowContractions:true}),true);
 assert.equal(matchesAcceptedAnswer('She isn’t a doctor!',['She is not a doctor.'],{allowContractions:true}),true);
 assert.equal(matchesAcceptedAnswer('aXb',['a.b'],{mode:'capitalization'}),false);
 assert.equal(matchesAcceptedAnswer('a+b',['a+b']),true);assert.equal(matchesAcceptedAnswer('aaab',['a+b']),false);
 assert.equal(matchesAcceptedAnswer('21 0 6',['2 10 6'],{mode:'code'}),false);
 assert.equal(matchesAcceptedAnswer('07 abc 123',['07123'],{mode:'digits'}),false);
});

test('explicit short/full forms and capitalization retain their actual learning target',()=>{
 const questions=getActivityQuestions('practice-1b-contractions',{count:'all',seed:'forms'}),short=questions.find(q=>q.id==='contract-0'),full=questions.find(q=>q.id==='expand-0');
 assert.equal(checkAnswer(short,"I'm a student.").correct,true);assert.equal(checkAnswer(short,'I am a student.').correct,false);
 assert.equal(checkAnswer(full,'I am a student.').correct,true);assert.equal(checkAnswer(full,"I'm a student.").correct,false);
 const capitals=getActivityQuestions('practice-1d-capitals',{count:'all'}).find(q=>q.id==='caps-i');assert.equal(checkAnswer(capitals,'i am from canada.').correct,false);assert.equal(checkAnswer(capitals,'I am from Canada').correct,false);
 const shortAnswer=getActivityQuestions('practice-1a-be',{count:'all'}).find(q=>q.id==='be-short-positive');
 assert.equal(checkAnswer(shortAnswer,'Yes, she is.').correct,true);assert.equal(checkAnswer(shortAnswer,"Yes, she's.").correct,false,'Positive short answers cannot end in a contracted form of be.');
});

test('listening questions have generic instructions and never supply a text or picture answer cue',()=>{
 for(const q of makeVocabularyQuestions(vocabulary,{mode:'listening',seed:'audio'})){assert.equal(q.prompt,'Listen and choose.');assert.equal(q.listening,true);assert.ok(q.audioWordId);assert.equal(q.passage,undefined);assert.equal(q.image,undefined);assert.equal(q.hint,undefined);}
 for(const lesson of lessons)for(const q of getActivityQuestions(`listen-${lesson.id.toLowerCase()}`,{count:'all',seed:'source-listening'})){assert.ok(['Listen and choose.','Listen and type.'].includes(q.prompt));assert.equal(q.listening,true);assert.ok(q.audio&&q.listenFor);assert.equal(q.passage,undefined);}
 const group=getActivityQuestions('listen-1a',{count:'all',seed:'source-listening'});
 assert.ok(group.find(q=>q.id==='listen-short-0').listenFor.startsWith('Pair 1:'));
 assert.ok(group.find(q=>q.id==='listen-spell-2').listenFor.startsWith('Name 3:'));
});

test('a selected no-audio alternative has a deterministic different task and is replayed by question ID',()=>{
 const options={count:'all',seed:'fallback-replay'},source=getActivityQuestions('listen-1d',options),original=source.find(q=>q.id==='listen-emma-last'),fallback=getAudioFallbackQuestion(original);
 assert.equal(fallback.id,original.id);assert.equal(fallback.audioFallback,true);assert.equal(fallback.listening,undefined);assert.equal(fallback.audio,undefined);assert.notEqual(fallback.answer,original.correctText);assert.equal(checkAnswer(fallback,fallback.answer).correct,true);assert.equal(checkAnswer(fallback,fallback.answer).masteryEligible,false);
 const replay=getActivityQuestions('listen-1d',{...options,audioFallbackQuestionIds:[original.id]});assert.deepEqual(replay.find(q=>q.id===original.id),fallback);assert.deepEqual(replay.find(q=>q.id!==original.id),source.find(q=>q.id!==original.id));
 assert.throws(()=>getActivityQuestions('listen-1d',{...options,audioFallbackQuestionIds:['invented']}),RangeError);
 assert.throws(()=>getActivityQuestions('topic-1a-greetings',{...options,audioFallbackQuestionIds:['recall-v-greetings-hello']}),RangeError);
});

test('audio-free rounds cover every original question without audio or repeated one-answer substitutes',()=>{
 for(const lesson of lessons){const id=`listen-${lesson.id.toLowerCase()}`,options={count:'all',seed:id},original=getActivityQuestions(id,options),silent=getActivityQuestions(id,{...options,audioEnabled:false});assert.deepEqual(silent.map(q=>q.id),original.map(q=>q.id));for(const q of silent){assert.equal(q.audio,undefined);assert.equal(q.audioWordId,undefined);assert.equal(q.listening,undefined);assert.equal(q.audioFallback,true);assert.equal(checkAnswer(q,q.accepted[0]).correct,true);}}
 const alternatives=getActivityQuestions('listen-1a',{count:'all',audioEnabled:false,seed:'variety'});assert.ok(new Set(alternatives.map(q=>q.prompt)).size>=4);assert.ok(new Set(alternatives.map(q=>q.answer)).size>=6);
});

test('full-sentence vocabulary is recognition, while apellido and other lexical chunks stay typed',()=>{
 const generated=makeVocabularyQuestions(vocabulary,{seed:'sentence-policy'});
 for(const term of ['What is your last name?','What is your phone number?','Where are you from?','Nice to meet you','See you later']){
  const q=generated.find(q=>q.word.term===term);assert.equal(q.type,'choice',term);assert.ok(q.prompt.startsWith('Choose the English translation.'));assert.ok(q.choices.length>=2);assert.equal(checkAnswer(q,q.answer).correct,true);assert.equal(checkAnswer(q,q.choices.find(c=>c.id!==q.answer).id).correct,false);
 }
 for(const term of ['last name','first name','phone number','Good morning','Good night'])assert.equal(generated.find(q=>q.word.term===term).type,'text',term);
 assert.equal(generated.find(q=>q.word.term==='last name').translation,'apellido');
 const listening=makeVocabularyQuestions(vocabulary.filter(w=>w.kind==='question'),{mode:'listening',seed:'sentence-audio'});
 for(const q of listening){assert.equal(q.prompt,'Listen and choose.');assert.ok(!q.prompt.includes(q.word.spanish));const a=getAudioFallbackQuestion(q),b=getAudioFallbackQuestion(q);assert.equal(a.type,'choice');assert.deepEqual(a.choices,b.choices);}
});

test('new sentence choices retain question IDs and grade correctly on the unchanged server engine',async()=>{
 const legacy=await import('../backend/src/content/engine.mjs');
 for(const activity of activities.filter(a=>['quiz','review'].includes(a.type))){
  const options={count:'all',seed:'sentence-server-parity'},current=getActivityQuestions(activity.id,options),previous=legacy.getActivityQuestions(activity.id,options);
  assert.deepEqual(current.map(q=>q.id),previous.map(q=>q.id),activity.id);
  for(const q of current.filter(q=>q.kind==='vocabulary'&&q.type==='choice')){
   const old=previous.find(p=>p.id===q.id);for(const c of q.choices)assert.equal(legacy.checkAnswer(old,c.text).correct,checkAnswer(q,c.id).correct,q.id+': '+c.text);
  }
 }
});
