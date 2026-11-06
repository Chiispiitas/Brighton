import { normalizeAnswer, matchesAcceptedAnswer, compileAnswerPattern } from './answer-matching.mjs';
import { spanishLetterName } from './translations.mjs';
export { normalizeAnswer, matchesAcceptedAnswer, compileAnswerPattern } from './answer-matching.mjs';
import { vocabulary, wordById, chunks, chunkById, lessons, lessonById, grammarSets, grammarSetById, activities, activityById, challengeQuestions, numberToWords } from './unit1.mjs';

export function seededRandom(seed = Date.now()) {
  let state=2166136261;
  for(const char of String(seed)){state^=char.charCodeAt(0);state=Math.imul(state,16777619);}
  return () => {state+=0x6D2B79F5;let t=state;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296;};
}
export function shuffle(values, random=seededRandom()) {
  const result=[...values];
  for(let i=result.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[result[i],result[j]]=[result[j],result[i]];}
  return result;
}
const unique = values => [...new Set(values)];
const asArray = value => value == null ? [] : Array.isArray(value) ? value : [value];
const assertIds = (ids,map,label) => ids.forEach(id=>{if(!map[id])throw new RangeError(`Unknown ${label}: ${id}`);});
export function getWordsForChunks(chunkIds=[]) {
  const selected=asArray(chunkIds);assertIds(selected,chunkById,'word set');
  return unique(selected.flatMap(id=>chunkById[id].wordIds)).map(id=>wordById[id]);
}
export function getWordsForLessons(lessonIds=[]) {
  const selected=asArray(lessonIds);assertIds(selected,lessonById,'lesson');
  return unique(selected.flatMap(id=>lessonById[id].chunkIds).flatMap(id=>chunkById[id].wordIds)).map(id=>wordById[id]);
}
function selection(options={}) {
  const activity=options.activityId ? activityById[options.activityId] : null;
  if(options.activityId&&!activity)throw new RangeError(`Unknown activity: ${options.activityId}`);
  const selectedChunks=asArray(options.chunkIds?.length?options.chunkIds:activity?.chunkIds);
  const selectedLessons=asArray(options.lessonIds?.length?options.lessonIds:activity?.lessonId);
  assertIds(selectedChunks,chunkById,'word set');assertIds(selectedLessons,lessonById,'lesson');
  const words=selectedChunks.length?getWordsForChunks(selectedChunks):selectedLessons.length?getWordsForLessons(selectedLessons):vocabulary.filter(x=>!x.supportOnly);
  const selectedGrammar=asArray(options.grammarSetIds?.length?options.grammarSetIds:activity?.grammarSetIds);
  assertIds(selectedGrammar,grammarSetById,'grammar practice');
  const sets=selectedGrammar.length?selectedGrammar.map(id=>grammarSetById[id]):selectedLessons.length?grammarSets.filter(x=>selectedLessons.includes(x.lessonId)):selectedChunks.length?grammarSets.filter(x=>unique(selectedChunks.map(id=>chunkById[id].lessonId)).includes(x.lessonId)):grammarSets;
  return {activity,selectedChunks,selectedLessons,words,sets};
}

function choiceQuestion(template,random) {
  const correctText=template.correctText ?? template.choices?.find(x=>x.id===template.answer)?.text;
  if(!correctText)throw new TypeError(`Question ${template.id} has no correct choice.`);
  const source=[correctText,...(template.distractors||template.choices?.filter(x=>x.text!==correctText).map(x=>x.text)||[])];
  const seen=new Set();const texts=source.filter(text=>{const key=normalizeAnswer(text,template.normalization);if(seen.has(key))return false;seen.add(key);return true;}).slice(0,4);
  if(texts.length<2)throw new TypeError(`Question ${template.id} needs distinct choices.`);
  const choices=shuffle(texts,random).map((text,i)=>({id:`${template.id}-option-${i}`,text}));
  return {...template,type:'choice',choices,answer:choices.find(x=>x.text===correctText).id,accepted:unique([correctText,...template.accepted||[]]),correctText,wordIds:template.wordIds||[],retrieval:true};
}
function orderQuestion(template,random) {
  const source=template.tokens || template.sentenceTokens?.map(x=>typeof x==='string'?x:x.text) || String(template.answer).match(/\S+/g);
  let tokens=shuffle(source,random);
  if(tokens.length>1&&tokens.join(' ')===source.join(' ')){[tokens[0],tokens[tokens.length-1]]=[tokens[tokens.length-1],tokens[0]];}
  return {...template,type:'order',sentenceTokens:tokens.map((text,i)=>({id:`${template.id}-token-${i}`,text})),tokens,
    answer:Array.isArray(template.answer)?template.answer.join(' '):template.answer,accepted:template.accepted||[template.answer],wordIds:template.wordIds||[],retrieval:true};
}
function typedGrammar(template,random){
 const accepted=template.accepted||[template.correctText??template.answer];
 const answer=template.correctText??template.answer;
 const instructions={
  'be-not':'Make this negative: She is a teacher.',
  'be-question':'Make this a question: She is a teacher.',
  'be-short-positive':'Is she a teacher? Write a short answer with Yes.',
  'be-short-negative':'Are they in Class 2? Write a short answer with No.',
  'contract-youre':'Write the short form: You are a student.',
  'caps-country':'Write it with capital letters and a full stop: i am from ecuador.'
 };
 let prompt=instructions[template.id]||template.prompt;
 if(template.type==='order')prompt=`Put the words in order. Type the sentence.\n${shuffle(template.tokens,random).join(' / ')}`;
 const answerForm=/short form/i.test(prompt)?'short':/full form/i.test(prompt)?'full':null;
 return {...template,type:'text',prompt,answer,accepted,correctText:answer,choices:[],answerForm,allowContractions:!answerForm&&template.normalization!=='capitalization'&&template.id!=='be-short-positive',wordIds:template.wordIds||[],retrieval:true};
}
function materialize(template,random,{typed=false}={}) {
 if(typed)return typedGrammar(template,random);
 if(template.type==='choice')return choiceQuestion(template,random);
 if(template.type==='order')return orderQuestion(template,random);
 return {...template,choices:template.choices||[],accepted:template.accepted||[template.answer],wordIds:template.wordIds||[],retrieval:template.retrieval!==false};
}
function vocabularyCue(word){return word.kind==='letter'?spanishLetterName(word.letter):word.spanish;}
function vocabularyPrompt(word){return word.kind==='letter'?`Write the capital letter.\n${vocabularyCue(word)}`:`Write in English.\n${word.spanish}`;}
function distractorPool(word) {
  let pool=vocabulary.filter(other=>other.id!==word.id);
  if(word.kind==='country'||word.kind==='nationality'||word.kind==='letter'||word.kind==='number')pool=pool.filter(other=>other.kind===word.kind);
  else if(word.kind==='question')pool=pool.filter(other=>other.kind==='question');
  else pool=pool.filter(other=>other.topic===word.topic&&other.kind!=='question');
  if(word.group==='time-greeting'||word.term==='Good night')pool=pool.filter(other=>other.group==='time-greeting'||other.term==='Good night');
  if(word.equivalentGroup)pool=pool.filter(other=>other.equivalentGroup!==word.equivalentGroup);
  if(word.distractorGroup)pool=pool.filter(other=>other.distractorGroup!==word.distractorGroup);
  const equivalents=new Set([word.term,...word.aliases||[]].map(x=>normalizeAnswer(x)));
  return pool.filter(other=>!equivalents.has(normalizeAnswer(other.term)));
}
export function makeVocabularyQuestions(words,{mode='recall',seed=Date.now(),audioEnabled=true}={}) {
 const random=seededRandom(seed);
 return words.map(word=>{
  const answer=word.kind==='letter'?word.letter:word.term;
  const base={id:`recall-${word.id}`,wordIds:[word.id],word,translation:vocabularyCue(word),explanation:word.example,expectedTerm:answer,kind:'vocabulary',retrieval:true};
  // Sentence-level language is recognition practice here, not grammar composition.
  const listening=mode==='listening'||word.kind==='letter';
  if(mode==='choice'||listening||word.kind==='question'||word.answerMode==='choice'){
   const q=choiceQuestion({...base,prompt:listening?'Listen and choose.':`Choose the English translation.\n${word.spanish}`,correctText:answer,distractors:shuffle(distractorPool(word),random).map(x=>x.kind==='letter'?x.letter:x.term)},random);
   if(listening){Object.assign(q,{listening:true,audioWordId:word.id,listenFor:'',hint:undefined});return audioEnabled===false?getAudioFallbackQuestion(q):q;}
   return q;
  }
  return {...base,type:'text',prompt:vocabularyPrompt(word),answer,accepted:[answer,...word.aliases||[]],normalization:word.kind==='letter'?'letter':'normal',choices:[],allowContractions:word.kind==='question'};
 });
}

function wantedCount(value,available) {
  if(value==='all'||value===Infinity)return available;
  const count=value==null?Math.min(10,available):Number(value);
  if(!Number.isFinite(count)||count<0)throw new RangeError('Question count must be zero or a positive number.');
  return Math.min(Math.floor(count),available);
}
function prioritize(questions,options,random) {
  const exclude=new Set(asArray(options.excludeWordIds)),priority=new Set(asArray(options.priorityWordIds));
  const remaining=questions.filter(q=>!q.wordIds?.some(id=>exclude.has(id)));
  const important=remaining.filter(q=>q.wordIds?.some(id=>priority.has(id)));
  return [...shuffle(important,random),...shuffle(remaining.filter(q=>!important.includes(q)),random)];
}
export function buildQuiz(options={}) {
  const selected=selection(options),random=seededRandom(options.seed??Date.now());
  const mode=options.mode || (selected.activity?.type==='grammar'?'grammar':selected.activity?.type==='review'?'mixed':'recall');
  let vocab=makeVocabularyQuestions(selected.words,{mode:['choice','listening'].includes(mode)?mode:'recall',seed:options.seed,audioEnabled:options.audioEnabled});
  let grammar=['grammar','mixed'].includes(mode)?selected.sets.flatMap(set=>set.questions.map(question=>({...materialize(question,random,{typed:options.answerMode!=='choice'}),kind:'grammar',grammarSetId:set.id,lessonId:set.lessonId}))):[];
  let candidates=mode==='grammar'?grammar:mode==='mixed'?shuffle([...vocab,...grammar],random):vocab;
  candidates=prioritize(candidates,options,random);
  const count=wantedCount(options.count,candidates.length);
  // A mixed review must actually contain both retrieval and form practice when both exist.
  if(mode==='mixed'&&count>=2&&vocab.length&&grammar.length){
    const firstVocab=candidates.find(x=>x.kind==='vocabulary'),firstGrammar=candidates.find(x=>x.kind==='grammar');
    if(firstVocab&&firstGrammar)candidates=[firstVocab,firstGrammar,...candidates.filter(x=>x!==firstVocab&&x!==firstGrammar)];
  }
  return applyAudioFallbacks(shuffle(candidates.slice(0,count),random),options);
}

export function getMatchingPairs(options={}) {
 const selected=selection(options),random=seededRandom(options.seed??Date.now());
 const usedLeft=new Set(),usedRight=new Set(),pairs=[];
 for(const word of shuffle(selected.words.filter(word=>word.kind!=='letter'),random)){
  const left=word.kind==='letter'?word.letter:word.term,right=word.spanish;
  const l=normalizeAnswer(left),r=normalizeAnswer(right);
  if(usedLeft.has(l)||usedRight.has(r))continue;
  usedLeft.add(l);usedRight.add(r);
  pairs.push({id:`pair-${word.id}`,left,right,wordId:word.id,wordIds:[word.id],kind:'translation',image:word.image});
 }
 return shuffle(pairs,random).slice(0,wantedCount(options.count??6,pairs.length));
}

const sourceCodes=[[4,0,8],[2,10,6],[9,1,5],[7,3,4]];
export function makeLockerChallenge({seed=Date.now(),rounds=4}={}) {
  const random=seededRandom(seed);
  return shuffle(sourceCodes,random).slice(0,wantedCount(rounds,sourceCodes.length)).map((values,i)=>({
    id:`locker-code-${i}-${values.join('-')}`,type:'text',kind:'game',prompt:'Remember the three-number locker code. Then type the numbers with spaces.',
    preview:values.map(numberToWords).join(' · '),previewMs:4500,answer:values.join(' '),accepted:[values.join(' ')],normalization:'code',
    explanation:values.map(numberToWords).join(' · '),hint:'Use one space between each number. Ten is one number.',wordIds:values.map(value=>vocabulary.find(x=>x.kind==='number'&&x.numberValue===value).id),retrieval:true
  }));
}
function spellingQuestions(options={}) {
 const random=seededRandom(options.seed??Date.now());
 return challengeQuestions.filter(q=>q.id.startsWith('listen-spell-')).map(q=>listeningQuestion(q,random));
}
function listeningQuestion(template,random){
 const q=materialize(template,random);
 const indexed=template.prompt.replace(/^Listen to pair (\d+)\.\s*/,'Pair $1: ').replace(/^Listen to name (\d+)\.\s*/,'Name $1: ');
 const listenFor=indexed.replace(/^Listen(?: to [^.]+| at [^.]+)?\.\s*/,'').replace(/^Listen\.\s*/,'');
 return {...q,prompt:q.type==='choice'?'Listen and choose.':'Listen and type.',listenFor,listening:true};
}
export function isAlphabetQuestion(question){return question.word?.kind==='letter'||question.wordIds?.some(id=>wordById[id]?.kind==='letter')||question.id?.includes('alphabet');}
export function getAudioFallbackQuestion(question){
 if(isAlphabetQuestion(question))return question;
 if(!question.listening&&!question.audio&&!question.audioWordId)return question;
 const word=question.word||wordById[question.audioWordId]||vocabulary.find(w=>normalizeAnswer(w.term)===normalizeAnswer(question.correctText??question.answer));
 let q;
 if(word)q=makeVocabularyQuestions([word],{mode:'recall',seed:question.id})[0];
 else if(question.id.startsWith('listen-short-')){
  const index=Number(question.id.split('-').at(-1)),subject=['I','You','He','She'][index],verb=index===0?'am':index===1?'are':'is',short=["I'm","You're","He's","She's"][index];
  q={type:'text',kind:'grammar',prompt:`Write the short form: ${subject} ${verb} a student.`,answer:`${short} a student.`,accepted:[`${short} a student.`],wordIds:[],explanation:`${short} a student.`,allowContractions:false};
 }else if(question.id.includes('alphabet')){
  const letters=question.id.includes('end')?'x y z':'a b c',names=letters.split(' ').map(spanishLetterName).join(' / ');q={type:'text',kind:'vocabulary',prompt:`Write the capital letters.\n${names}`,answer:letters.toUpperCase(),accepted:[letters.toUpperCase()],normalization:'letter',wordIds:[],explanation:letters.toUpperCase(),retrieval:true};
 }else{
  const cards=[['Nina','Cruz','6','Alex','07 314 826'],['Omar','Vega','2','Jo','07 582 139'],['Sara','Lopez','5','Mina','07 946 352'],['Leo','Evans','8','Sam','07 265 784'],['Ana','Ruiz','3','Jo','07 831 640'],['Ben','Park','7','Alex','07 493 215']];
  const index=[...question.id].reduce((sum,c)=>sum+c.charCodeAt(0),0)%cards.length,[first,last,classNumber,teacher,phone]=cards[index];
  const field=question.id.includes('phone')?'phone number':question.id.includes('teacher')?'teacher’s name':question.id.includes('last')?'last name':question.id.includes('class')?'class number':'first name';
  const answer=field==='phone number'?phone:field==='teacher’s name'?teacher:field==='last name'?last:field==='class number'?classNumber:first;
  q={type:'text',kind:'reading',prompt:`Read the card. Type the ${field}.`,passage:`Town Club\nFirst name: ${first}\nLast name: ${last}\nClass: ${classNumber}\nTeacher: ${teacher}\nPhone: ${phone}`,answer,accepted:field==='class number'?[answer,`Class ${answer}`]:[answer],normalization:field==='phone number'?'digits':'normal',wordIds:[],explanation:`${field[0].toUpperCase()+field.slice(1)}: ${answer}`,retrieval:false};
 }
 return {...q,id:question.id,audioFallback:true,originListening:true};
}

function applyAudioFallbacks(questions,options){
 const requested=options.audioFallbackQuestionIds||[];
 if(!Array.isArray(requested)||requested.some(id=>typeof id!=='string'))throw new TypeError('Audio alternatives must name question IDs.');
 for(const id of requested)if(!questions.some(q=>q.id===id&&(q.listening||q.audio||q.audioWordId||q.originListening)))throw new RangeError(`Unknown listening alternative: ${id}`);
 return questions.map(q=>(options.audioEnabled===false||requested.includes(q.id))&&(q.listening||q.audio||q.audioWordId)?getAudioFallbackQuestion(q):q);
}
export function getActivityQuestions(activityId,options={}) {
 const activity=activityById[activityId];if(!activity)throw new RangeError(`Unknown activity: ${activityId}`);
 const merged={...options,activityId};const random=seededRandom(options.seed??Date.now());
 let questions;
 if(activity.type==='locker')questions=makeLockerChallenge({...options,rounds:options.count??4});
 else if(activity.type==='spelling')questions=shuffle(spellingQuestions(options),random).slice(0,wantedCount(options.count??8,8));
 else if(['listening','reading','form'].includes(activity.type)){
  const source=challengeQuestions.filter(q=>q.lessonId===activity.lessonId&&(activity.type==='listening'?q.audio:!q.audio));
  questions=shuffle(source.map(q=>activity.type==='listening'?listeningQuestion({...q,kind:'listening'},random):materialize({...q,kind:activity.type},random,{typed:true})),random).slice(0,wantedCount(options.count??source.length,source.length));
 }else questions=buildQuiz({...merged,mode:activity.type==='grammar'?'grammar':activity.type==='review'?'mixed':options.mode||'recall'});
 return applyAudioFallbacks(questions,options);
}

export function createPracticeSession(options={}) {
  const selected=selection(options),activity=selected.activity;
  const questions=activity?getActivityQuestions(activity.id,options):buildQuiz(options);
  return {id:options.sessionId||`practice-${Date.now()}-${Math.floor(Math.random()*1e7)}`,activityId:activity?.id||'custom-mix',
    title:activity?.title||'Your mixed practice',type:activity?.type||options.mode||'vocabulary',questions,
    lessonIds:unique([...(selected.selectedLessons||[]),...selected.selectedChunks.map(id=>chunkById[id].lessonId)]),
    chunkIds:selected.selectedChunks,wordIds:unique(questions.flatMap(q=>q.wordIds||[])),
    total:questions.length,createdAt:new Date().toISOString(),bookId:'a1',unit:1};
}

export function checkAnswer(question,submitted) {
  const mode=question.normalization||'normal';
  let correct=false,expected=question.correctText??question.answer;
  if(question.type==='choice'){
    const value=submitted&&typeof submitted==='object'?submitted.id??submitted.text:submitted;
    const choice=question.choices.find(x=>x.id===value);
    correct=choice?choice.id===question.answer:matchesAcceptedAnswer(value,[...question.accepted||[question.correctText],...question.word?.aliases||[]],{mode,allowContractions:question.word?.kind==='question'||question.allowContractions===true});
  }else{
    let value=submitted;
    if(question.type==='order'&&Array.isArray(submitted))value=submitted.map(token=>typeof token==='object'?token.text:question.sentenceTokens?.find(x=>x.id===token)?.text??token).join(' ');
    const normalized=normalizeAnswer(value,mode);
    correct=matchesAcceptedAnswer(value,question.accepted||[question.answer],{mode,allowContractions:question.allowContractions===true});
  }
  // Credit the prompted item for every accepted correct answer, including synonyms.
  const wordIds=correct?unique(question.wordIds||[]):[];
  return {correct,expected,feedback:question.explanation||String(expected),wordIds,
    masteryEligible:correct&&wordIds.length>0&&question.retrieval!==false,requiresRetry:!correct};
}
export function isCorrect(question,submitted){return checkAnswer(question,submitted).correct;}

export function validateContent() {
  const errors=[];const allIds=[...vocabulary,...chunks,...activities].map(x=>x.id);
  for(const id of allIds)if(allIds.indexOf(id)!==allIds.lastIndexOf(id))errors.push(`Duplicate id: ${id}`);
  for(const set of chunks)for(const id of set.wordIds)if(!wordById[id])errors.push(`Missing word ${id} in ${set.id}`);
  for(const lesson of lessons)for(const id of lesson.activityIds)if(!activityById[id])errors.push(`Missing activity ${id}`);
  for(const set of grammarSets)for(const q of set.questions){if(!q.prompt||!q.explanation)errors.push(`Incomplete question ${q.id}`);}
  return errors;
}
