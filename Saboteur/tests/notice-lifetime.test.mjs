import test from 'node:test';
import assert from 'node:assert/strict';
import {animatePublicAction,clearActionNotices} from '../action-cues.mjs';
import {notifyInspection,notifyPlacement} from '../inspection.mjs';
test('all public notices survive their effect timers and clear only at the next action',()=>{
 const saved={document:globalThis.document,setTimeout:globalThis.setTimeout};const nodes=[],timers=[];
 const node=()=>({className:'',style:{},classList:{add(){},remove(){}},setAttribute(){},append(){},remove(){nodes.splice(nodes.indexOf(this),1);}});
 globalThis.document={createElement:node,body:{append:n=>nodes.push(n)},querySelector:()=>null,querySelectorAll:selector=>selector.includes('public-action-cue')?nodes.slice():[]};
 globalThis.setTimeout=callback=>timers.push(callback);
 try{
  animatePublicAction({kind:'discard',text:'Alex discarded one card.'});notifyInspection({actorName:'Alex',goalId:'goal-1',goalNumber:2});notifyPlacement({actorName:'Alex',x:1,y:0});
  assert.equal(nodes.length,3);timers.forEach(callback=>callback());assert.equal(nodes.length,3,'effect timers must not dismiss notifications');
  clearActionNotices();assert.equal(nodes.length,0);
 }finally{globalThis.document=saved.document;globalThis.setTimeout=saved.setTimeout;}
});
