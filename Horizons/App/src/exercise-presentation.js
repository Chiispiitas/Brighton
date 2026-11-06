import {shuffle,seededRandom} from '../content/engine.mjs';

// Preserve the server question ID and its text-answer contract while restoring tiles.
export function presentQuestion(question,seed,{typedVocabulary=false}={}){
 if(typedVocabulary&&question.type==='choice'&&question.kind==='vocabulary'&&question.word&&!question.listening){
  const answer=question.correctText??question.word.term;
  return {...question,type:'text',prompt:`Write in English.\n${question.translation||question.word.spanish}`,answer,correctText:answer,accepted:[answer,...question.word.aliases||[]],choices:[],allowContractions:question.word.kind==='question'};
 }
 if(question.type!=='text'||!Array.isArray(question.tokens)||!question.tokens.length)return question;
 let tokens=shuffle(question.tokens,seededRandom(`${seed}:${question.id}:tiles`));
 if(tokens.length>1&&tokens.join(' ')===question.tokens.join(' '))tokens=[...tokens.slice(1),tokens[0]];
 return {...question,type:'order',serverAnswerType:'text',prompt:'Put the words in order.',tokens,sentenceTokens:tokens.map((text,i)=>({id:`${question.id}-token-${i}`,text}))};
}
