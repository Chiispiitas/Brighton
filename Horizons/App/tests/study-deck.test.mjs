import {test} from 'node:test';import assert from 'node:assert/strict';
import {studyDeck} from '../src/study-deck.js';import {vocabulary,grammarSets} from '../content/unit1.mjs';
test('study cards preserve vocabulary, hide letter answers behind listening cues, and deduplicate shared words',()=>{
 const words=vocabulary.slice(0,4),deck=studyDeck([...words,...words],[]);assert.equal(deck.length,4);assert.equal(deck[0].front,words[0].spanish);assert.equal(deck[0].back,words[0].term);
 const letter=vocabulary.find(w=>w.kind==='letter'),card=studyDeck([letter],[])[0];assert.equal(card.front,'Listen to the letter');assert.equal(card.listening,true);assert.equal(card.back,letter.term);
});
test('grammar study uses authored reference models rather than graded questions',()=>{
 const cards=studyDeck([],grammarSets);assert.equal(cards.length,grammarSets.reduce((n,g)=>n+g.models.rows.length,0));assert.equal(new Set(cards.map(c=>c.id)).size,cards.length);assert.ok(cards.some(c=>c.back.includes('I am a student.')));assert.ok(cards.every(c=>!('answer'in c)&&!('correct'in c)));assert.deepEqual(studyDeck([],[]),[]);
});
