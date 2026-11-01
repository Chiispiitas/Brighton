import test from 'node:test';
import assert from 'node:assert/strict';
import { TutorialGame, TUTORIAL_ROLES } from '../tutorial-model.mjs';

function scene(role,name){const game=new TutorialGame(role);game.load(game.steps.findIndex(s=>s.scene===name));return game;}
test('new lessons and replayed frames have distinct IDs so private-card visibility resets',()=>{
  const first=new TutorialGame('witch'),second=new TutorialGame('hunter'),restarted=new TutorialGame('witch');
  const ids=[first.snapshot().phaseId,second.snapshot().phaseId,restarted.snapshot().phaseId,first.load(0).phaseId];
  assert.equal(new Set(ids).size,ids.length);
});
test('each role has a playable secret-card opening and valid slide fixtures',()=>{
  assert.equal(TUTORIAL_ROLES.length,6);
  for(const role of TUTORIAL_ROLES){
    const game=new TutorialGame(role);
    assert.equal(game.snapshot().me.role,role);
    assert.equal(game.snapshot().phase,'reveal');
    assert.equal(game.snapshot().host,false);
    assert.equal(game.act({type:'ready'}).me.acted,true);
    for(let i=0;i<game.steps.length;i++){
      const state=game.load(i);
      assert.equal(state.players.length,8);
      assert.equal(state.me.role,role);
      assert.ok(game.step.text.length>20);
      assert.ok(!JSON.stringify(state).includes('demo-host'));
      assert.ok(state.players.filter(p=>p.alive&&!p.pack).every(p=>!p.role||state.phase==='finished'));
    }
  }
});
test('wolf tutorial uses real unanimity rules and refuses a split advance',()=>{
  const game=scene('werewolf','split');
  assert.equal(game.snapshot().packDecision.agreed,false);
  assert.throws(()=>game.act({type:'advance'}),/decision has not been made/);
  assert.equal(game.act({type:'action',target:'p3'}).packDecision.agreed,false);
  assert.equal(game.act({type:'action',target:'p2'}).packDecision.agreed,true);
  assert.equal(game.act({type:'advance'}).phase,'girl');
  assert.equal(game.raw.night.victim,'p2');
});
test('fortune demonstration reveals a role in private notes, never on a living house',()=>{
  const game=scene('fortune','fortune');
  const state=game.act({type:'action',target:'p1'});
  assert.match(state.me.notes[0].text,/Rowan is werewolf/);
  assert.equal(state.players.find(p=>p.id==='p1').role,undefined);
});
test('girl examples exercise both real coin outcomes and exactly one spotted wolf',()=>{
  for(const result of ['heads','tails']){
    const game=scene('girl',result);
    const state=game.act({type:'action',spy:true});
    assert.match(state.me.notes[0].text,result==='heads'?/^Heads/:/^Tails/);
    assert.equal(Object.keys(game.raw.notes).length,result==='heads'?1:2);
    assert.ok(state.players.every(p=>!p.role));
  }
});
test('witch practice spends a used potion, preserves an unused one, and cannot revive older dead players',()=>{
  const game=scene('witch','heal');
  assert.equal(game.snapshot().me.victim,'p2');
  assert.equal(game.snapshot().players.find(p=>p.id==='p7').alive,false);
  const state=game.act({type:'action',heal:true,poison:null});
  assert.deepEqual(state.me.potions,{heal:false,poison:true});
  assert.equal(game.raw.night.heal,true);
  assert.equal(game.raw.night.poison,null);
  assert.equal(game.raw.players[7].alive,false);
  const poison=scene('witch','poison');
  assert.throws(()=>poison.act({type:'action',poison:'p7'}),/living player/);
  assert.deepEqual(poison.act({type:'action',poison:'p1'}).me.potions,{heal:false,poison:false});
});
test('hunter practice allows a dead hunter to shoot or pass before resolving victory',()=>{
  const hunter=scene('hunter','hunter');
  assert.equal(hunter.snapshot().me.alive,false);
  assert.equal(hunter.snapshot().me.canAct,true);
  assert.equal(hunter.act({type:'action'}).players.filter(p=>!p.alive).length,1);
  const last=scene('hunter','last-wolf');
  const state=last.act({type:'action',target:'p1'});
  assert.equal(state.phase,'finished');assert.equal(state.winner,'village');
  assert.equal(state.players.find(p=>p.id==='p1').role,'werewolf');
});
test('practice games reject room management and reset without sharing mutations',()=>{
  const first=scene('witch','heal'),second=scene('witch','heal');
  assert.throws(()=>first.act({type:'create'}),/not part of the practice/);
  first.act({type:'action',heal:true});
  assert.equal(second.snapshot().me.potions.heal,true);
  assert.equal(first.load(first.index).me.potions.heal,true);
  assert.throws(()=>first.select('unknown'),/Choose a tutorial role/);
});
