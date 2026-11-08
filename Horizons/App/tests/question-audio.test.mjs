import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createQuestionAudio} from '../src/question-audio.js';

function fixture(){
 const players=[];let hidden=false,interruptions=0;
 const createAudio=src=>{const p={src,plays:0,pauses:0,currentTime:0,play(){this.plays++;return Promise.resolve();},pause(){this.pauses++;}};players.push(p);return p;};
 return {players,createAudio,setHidden:value=>hidden=value,controller:createQuestionAudio({createAudio,isHidden:()=>hidden,beforePlay:()=>interruptions++}),interruptions:()=>interruptions};
}
test('autoplay once per question occurrence, preserving playback through selection renders',()=>{
 const f=fixture(),round={};const input={round,questionIndex:0,src:'first.mp3'};
 f.controller.sync(input);assert.equal(f.players[0].plays,1);
 f.players[0].currentTime=2;
 const replacement={replaceWith(player){this.reused=player;}};
 f.controller.sync({...input,element:replacement});
 assert.equal(replacement.reused,f.players[0]);assert.equal(f.players[0].currentTime,2);assert.equal(f.players[0].plays,1);
 f.controller.sync({...input,checked:true});assert.ok(f.players[0].pauses>0);assert.equal(f.players[0].plays,1);
 f.controller.sync({...input,questionIndex:1});assert.equal(f.players[1].plays,1); // A retry of the same ID is a new occurrence.
 f.controller.sync({...input,round:{}});assert.equal(f.players[2].plays,1);
});
test('skip, checking and navigation stop audio; non-listening questions stay silent',()=>{
 const f=fixture(),round={};f.controller.sync({round,questionIndex:0,src:'question.mp3'});
 f.controller.stop();assert.equal(f.players[0].pauses,1);
 f.controller.sync({round,questionIndex:0,src:null});assert.equal(f.players.length,1);
 f.controller.replay();assert.equal(f.players[0].plays,1);
 f.controller.reset();
});
test('blocked autoplay is caught and replay remains usable; previews and hidden pages do not play',async()=>{
 const f=fixture(),round={},player=f.createAudio('question.mp3');
 player.play=function(){this.plays++;return Promise.reject(new Error('NotAllowedError'));};
 f.controller.sync({round,questionIndex:0,src:player.src,element:player,preview:true});assert.equal(player.plays,0);
 f.setHidden(true);f.controller.sync({round,questionIndex:0,src:player.src,element:player});assert.equal(player.plays,0);
 f.setHidden(false);f.controller.sync({round,questionIndex:0,src:player.src,element:player});
 await new Promise(resolve=>setTimeout(resolve,0));assert.equal(player.plays,1);
 await f.controller.replay();assert.equal(player.plays,2);assert.equal(player.currentTime,0);
});
