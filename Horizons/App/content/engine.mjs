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

const standard = value => String(value ?? '').normalize('NFKC').replace(/[‘’]/g,"'").trim();
export function normalizeAnswer(value,mode='normal') {
  if(Array.isArray(value))value=value.map(x=>typeof x==='object'&&x?x.text??x.value??x.id:x).join(' ');
  const text=standard(value);
  if(mode==='capitalization')return text.replace(/\s+/g,' ');
  if(mode==='digits')return text.replace(/\D/g,'');
  if(mode==='spelling')return text.replace(/[^a-z]/gi,'').toLowerCase();
  if(mode==='letter')return text.replace(/\s/g,'');
  if(mode==='code')return text.split(/[^0-9]+/).filter(Boolean).map(x=>String(Number(x))).join(' ');
  return text.toLowerCase().replace(/[.!?,;:]/g,'').replace(/[–—-]/g,' ').replace(/\s+/g,' ').trim();
}
function choiceQuestion(template,random) {
  const correctText=template.correctText ?? template.choices?.find(x=>x.id===template.answer)?.text;
  if(!correctText)throw new TypeError(`Question ${template.id} has no correct choice.`);
  const source=[correctText,...(template.distractors||template.choices?.filter(x=>x.text!==correctText).map(x=>x.text)||[])];
  const seen=new Set();const texts=source.filter(text=>{const key=normalizeAnswer(text,template.normalization);if(seen.has(key))return false;seen.add(key);return true;}).slice(0,4);
  if(texts.length<2)throw new TypeError(`Question ${template.id} needs distinct choices.`);
  const choices=shuffle(texts,random).map((text,i)=>({id:`${template.id}-option-${i}`,text}));
  return {...template,type:'choice',choices,answer:choices.find(x=>x.text===correctText).id,accepted:[correctText],correctText,wordIds:template.wordIds||[],retrieval:true};
}
function orderQuestion(template,random) {
  const source=template.tokens || template.sentenceTokens?.map(x=>typeof x==='string'?x:x.text) || String(template.answer).match(/\S+/g);
  let tokens=shuffle(source,random);
  if(tokens.length>1&&tokens.join(' ')===source.join(' ')){[tokens[0],tokens[tokens.length-1]]=[tokens[tokens.length-1],tokens[0]];}
  return {...template,type:'order',sentenceTokens:tokens.map((text,i)=>({id:`${template.id}-token-${i}`,text})),tokens,
    answer:Array.isArray(template.answer)?template.answer.join(' '):template.answer,accepted:template.accepted||[template.answer],wordIds:template.wordIds||[],retrieval:true};
}
function materialize(template,random) {
  if(template.type==='choice')return choiceQuestion(template,random);
  if(template.type==='order')return orderQuestion(template,random);
  return {...template,choices:template.choices||[],accepted:template.accepted||[template.answer],wordIds:template.wordIds||[],retrieval:template.retrieval!==false};
}
function vocabularyPrompt(word) {
  if(word.kind==='letter')return `Match the small letter “${word.letter.toLowerCase()}”.`;
  if(word.kind==='number')return `Which word matches ${word.numberValue}?`;
  if(word.kind==='country')return `Which country matches “${word.pair}”?`;
  if(word.kind==='nationality')return `Which nationality matches “${word.pair}”?`;
  if(word.topic==='personal'&&word.kind!=='question')return `Which form field matches this clue?\n${word.meaning}`;
  if(word.kind==='question')return `Choose the question.\n${word.meaning}`;
  if(word.term==='Hello')return 'Choose the general greeting with five letters. It begins with H.';
  if(word.term==='Hi')return 'Choose the short greeting with two letters.';
  if(word.term==='Goodbye')return 'Choose the one-word leaving phrase with seven letters.';
  if(word.term==='Bye')return 'Choose the short goodbye with three letters.';
  return `Which word or phrase matches this clue?\n${word.meaning}`;
}
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
export function makeVocabularyQuestions(words,{mode='vocabulary',seed=Date.now()}={}) {
  const random=seededRandom(seed);
  return words.map(word=>{
    const base={id:`recall-${word.id}`,wordIds:[word.id],word,explanation:word.example,expectedTerm:word.term,kind:'vocabulary',retrieval:true};
    if(mode==='recall'){
      const prompt=word.kind==='number'?`Write ${word.numberValue} in words.`:word.kind==='letter'?`Write the capital letter for “${word.letter.toLowerCase()}”.`:word.kind==='country'?`Write the country for “${word.pair}”.`:word.kind==='nationality'?`Write the nationality for “${word.pair}”.`:`Write the word or phrase.\n${word.meaning}`;
      const answer=word.kind==='letter'?word.letter:word.term;
      return {...base,type:'text',prompt,answer,accepted:[answer,...word.aliases||[]],normalization:word.kind==='letter'?'letter':'normal',choices:[],hint:word.kind==='letter'?'Use a capital letter.':`It begins with ${word.term[0].toUpperCase()}.`};
    }
    const pool=shuffle(distractorPool(word),random);
    return choiceQuestion({...base,type:'choice',prompt:vocabularyPrompt(word),correctText:word.term,distractors:pool.map(x=>x.term)},random);
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
  const mode=options.mode || (selected.activity?.type==='grammar'?'grammar':selected.activity?.type==='review'?'mixed':'vocabulary');
  let vocab=makeVocabularyQuestions(selected.words,{mode:mode==='recall'?'recall':'vocabulary',seed:options.seed});
  let grammar=['grammar','mixed'].includes(mode)?selected.sets.flatMap(set=>set.questions.map(question=>({...materialize(question,random),kind:'grammar',grammarSetId:set.id,lessonId:set.lessonId}))):[];
  let candidates=mode==='grammar'?grammar:mode==='mixed'?shuffle([...vocab,...grammar],random):vocab;
  candidates=prioritize(candidates,options,random);
  const count=wantedCount(options.count,candidates.length);
  // A mixed review must actually contain both retrieval and form practice when both exist.
  if(mode==='mixed'&&count>=2&&vocab.length&&grammar.length){
    const firstVocab=candidates.find(x=>x.kind==='vocabulary'),firstGrammar=candidates.find(x=>x.kind==='grammar');
    if(firstVocab&&firstGrammar)candidates=[firstVocab,firstGrammar,...candidates.filter(x=>x!==firstVocab&&x!==firstGrammar)];
  }
  return shuffle(candidates.slice(0,count),random);
}

export function getMatchingPairs(options={}) {
  const selected=selection(options),random=seededRandom(options.seed??Date.now());
  const words=selected.words.filter(x=>!x.supportOnly),wordIds=new Set(words.map(x=>x.id));
  let pairs=[];
  const type=options.type||options.mode||selected.activity?.type;
  if(type==='countries'||(words.length&&words.every(x=>['country','nationality'].includes(x.kind)))){
    pairs=words.filter(x=>x.kind==='country').map(country=>{
      const nationality=words.find(x=>x.kind==='nationality'&&x.term===country.pair);
      return nationality?{id:`pair-${country.id}`,left:country.term,right:nationality.term,wordId:country.id,wordIds:[country.id,nationality.id],kind:'countries'}:null;
    }).filter(Boolean);
  }else if(type==='opposites'||(words.length&&words.every(x=>x.topic==='adjectives'&&x.opposite))){
    const used=new Set();
    for(const word of words){const opposite=words.find(x=>x.term===word.opposite);if(!opposite||used.has(word.id)||used.has(opposite.id))continue;used.add(word.id);used.add(opposite.id);pairs.push({id:`pair-${word.id}`,left:word.term,right:opposite.term,wordId:word.id,wordIds:[word.id,opposite.id],kind:'opposites'});}
  }else{
    const groups=new Set(),rightTexts=new Set();
    for(const word of shuffle(words,random)){
      if(word.equivalentGroup&&groups.has(word.equivalentGroup))continue;
      const right=word.kind==='letter'?word.letter.toLowerCase():word.kind==='number'?word.term:word.meaning;
      const left=word.kind==='letter'?word.letter:word.kind==='number'?String(word.numberValue):word.term;
      if(rightTexts.has(normalizeAnswer(right)))continue;
      rightTexts.add(normalizeAnswer(right));if(word.equivalentGroup)groups.add(word.equivalentGroup);
      pairs.push({id:`pair-${word.id}`,left,right,wordId:word.id,wordIds:[word.id],image:word.image,kind:word.kind});
    }
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
  return ['Kim','Luz','Sam','Ida','Ariana','Allison','Bryan','Lindsay'].map((name,i)=>materialize({id:`spell-name-${i}`,type:'order',kind:'game',prompt:`Put the letters in order to spell ${name}.`,answer:name.toUpperCase(),accepted:[name],tokens:[...name.toUpperCase()],normalization:'spelling',explanation:[...name.toUpperCase()].join(' · '),wordIds:[]},random));
}
export function getActivityQuestions(activityId,options={}) {
  const activity=activityById[activityId];if(!activity)throw new RangeError(`Unknown activity: ${activityId}`);
  const merged={...options,activityId};const random=seededRandom(options.seed??Date.now());
  if(activity.type==='locker')return makeLockerChallenge({...options,rounds:options.count??4});
  if(activity.type==='spelling')return shuffle(spellingQuestions(options),random).slice(0,wantedCount(options.count??8,8));
  if(activity.type==='listening'||activity.type==='reading'||activity.type==='form'){
    const source=challengeQuestions.filter(q=>q.lessonId===activity.lessonId&&(activity.type==='listening'?q.audio:!q.audio));
    return shuffle(source.map(q=>materialize({...q,kind:activity.type},random)),random).slice(0,wantedCount(options.count??source.length,source.length));
  }
  return buildQuiz({...merged,mode:activity.type==='grammar'?'grammar':activity.type==='review'?'mixed':options.mode||'vocabulary'});
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
    correct=choice?choice.id===question.answer:normalizeAnswer(value,mode)===normalizeAnswer(question.correctText,mode);
  }else{
    let value=submitted;
    if(question.type==='order'&&Array.isArray(submitted))value=submitted.map(token=>typeof token==='object'?token.text:question.sentenceTokens?.find(x=>x.id===token)?.text??token).join(' ');
    const normalized=normalizeAnswer(value,mode);
    correct=(question.accepted||[question.answer]).some(answer=>normalizeAnswer(answer,mode)===normalized);
  }
  let wordIds=correct?unique(question.wordIds||[]):[];
  // A valid synonym earns a correct response, but does not pretend that the bank spelling was recalled.
  if(correct&&question.type==='text'&&question.word&&question.word.kind!=='letter'){
    const entered=normalizeAnswer(submitted),target=normalizeAnswer(question.word.term);
    if(entered!==target){
      const actual=vocabulary.find(word=>normalizeAnswer(word.term)===entered&&word.id!==question.word.id);
      wordIds=actual?[actual.id]:[];
    }
  }
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
