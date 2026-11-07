import test from 'node:test';
import assert from 'node:assert/strict';
import {createRoom,command,view,CARD_DEFS} from '../server/engine.mjs';
import {newInspections} from '../inspection.mjs';
let serial=0;
const send=(s,key,body)=>command(s,key,{...body,requestId:`inspection-${++serial}`,expectedVersion:s.version},()=>.4);
function room(){let s=createRoom('654321','host','Teacher');for(let i=0;i<3;i++)s=send(s,`key${i}`,{type:'join',name:`Player ${i+1}`});return send(s,'host',{type:'start'});}
test('inspection identifies actor and goal on every remote while withholding contents; legacy rooms continue',()=>{
  let s=room(); delete s.lastPlacement;
  const actor=s.players.find(p=>p.id===s.turnId), key=actor.key, goal=s.board.find(c=>c.kind==='goal');
  actor.hand=[{...CARD_DEFS.map,id:'map-test'}];
  const before=view(s,'',true);
  const other=structuredClone(s);other.board.find(c=>c.id===goal.id).gold=!goal.gold;
  const action={type:'play',cardId:'map-test',target:goal.id};
  const after=send(s,key,action), alternative=send(other,key,action);
  assert.deepEqual(after.log,alternative.log);
  for(const remote of ['', 'host',s.players.find(p=>p.key!==key).key]){
    const publicView=view(after,remote,true), events=newInspections(before,publicView);
    assert.equal(events.length,1);assert.equal(events[0].actorName,actor.name);assert.equal(events[0].goalId,goal.id);
    assert.ok(!Object.hasOwn(events[0],'gold'));assert.ok(!Object.hasOwn(events[0],'groups'));assert.equal(publicView.me,null);
    assert.deepEqual(newInspections(publicView,publicView),[]);assert.deepEqual(newInspections(null,publicView),[]);
  }
  assert.equal(view(after,key).me.notes[0].gold,goal.gold);
});
test('placed cards stay publicly named through the next player turn and clear on their next action',()=>{
  let s=room(),actor=s.players.find(p=>p.id===s.turnId);actor.hand=[{...CARD_DEFS.cross,id:'path-test'}];
  s=send(s,actor.key,{type:'play',cardId:'path-test',x:1,y:0});
  assert.notEqual(s.turnId,actor.id);assert.equal(view(s,'',true).lastPlacement.actorName,actor.name);
  assert.equal(view(s,'host').lastPlacement.x,1);
  const next=s.players.find(p=>p.id===s.turnId);s=send(s,next.key,{type:'discard',cardId:next.hand[0].id});
  assert.equal(view(s,'',true).lastPlacement,null);
});
