import test from 'node:test';
import assert from 'node:assert/strict';
import {publicActionCues} from '../action-cues.mjs';
const before={code:'123456',version:4,log:[{text:'Round 1. Alex starts.'}],board:[{kind:'path',x:2,y:0}]};
test('all remaining public actions have secret-safe cues, including remote target and rockfall position',()=>{
 const texts=['Alex broke Ivy’s pick.','Alex repaired Ivy’s pick.','Alex removed a tunnel.','Alex discarded one card.','Alex chose a gold card.','The gold miners win this round.','Round 2. Ivy starts.','The gold has been found.'];
 const next={...before,version:5,log:[...before.log,...texts.map(text=>({text}))],board:[],players:[{id:'p2',name:'Ivy',hand:[{id:'SECRET'}],goldCards:[3]}],me:{notes:['SECRET']}};
 const cues=publicActionCues(before,next);assert.deepEqual(cues.map(c=>c.kind),['break','repair','rockfall','discard','reward','result','deal','reveal']);assert.equal(cues[0].targetId,'p2');assert.equal(cues[2].x,2);assert.ok(!JSON.stringify(cues).includes('SECRET'));assert.ok(!JSON.stringify(cues).includes('goldCards'));
 assert.deepEqual(publicActionCues(next,next),[]);assert.deepEqual(publicActionCues(null,next),[]);
});
test('trimmed logs and legacy snapshots animate new entries once without replaying old actions',()=>{
 const old={...before,log:Array.from({length:50},(_,i)=>({text:`old ${i}`}))};const next={...old,version:5,log:[...old.log.slice(1),{text:'Alex discarded one card.'}]};assert.equal(publicActionCues(old,next).length,1);assert.deepEqual(publicActionCues(old,{...next,code:'654321'}),[]);assert.deepEqual(publicActionCues(before,{...before,version:5,log:[...before.log,{text:'Edwin joined.'}]}),[]);
});
