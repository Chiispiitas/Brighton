import test from 'node:test';
import assert from 'node:assert/strict';
import { LESSONS, fixture } from '../tutorial.mjs';
import { command, view, reachablePorts } from '../server/engine.mjs';
import { pathSvg, cardVisual } from '../board.mjs';

for(const [lesson,definition] of Object.entries(LESSONS)) for(const step of definition.steps){
  test(`tutorial ${lesson}: ${step.title} is an isolated valid engine example`,()=>{
    const raw=fixture(step),before=structuredClone(raw);
    const privateView=view(raw,'practice-alex'),publicView=view(raw,'practice-alex',true);
    assert.equal(privateView.me.name,undefined);
    assert.equal(publicView.me,null);
    assert.equal(publicView.host,false);
    assert.equal(raw.code,'123456');
    assert.equal(raw.players.filter(p=>p.role==='saboteur').length,1);
    if(step.action){
      const action={...step.action,cardId:step.action.cardId||raw.players[0].hand[0].id,expectedVersion:raw.version,requestId:`tutorial-check-${lesson}-${step.scene}`};
      const after=command(raw,'practice-alex',action,()=>.4);
      assert.equal(after.version,raw.version+1);
      assert.deepEqual(raw,before,'practice does not mutate a previous snapshot');
      if(step.scene==='dead')assert.equal(reachablePorts(after).has('1,0:e'),false);
      if(step.scene==='map'){
        assert.equal(view(after,'practice-alex').me.notes[0].gold,true);
        assert.equal(view(after,'practice-alex',true).board.find(g=>g.id==='goal-1').gold,undefined);
      }
      if(step.scene==='win')assert.equal(after.phase,'gold');
      if(step.scene==='double-repair')assert.deepEqual(after.players[1].broken,['cart']);
      if(step.scene==='gold')assert.equal(view(after,'practice-alex').me.goldTotal,3);
    }
  });
}
test('disconnected tunnel artwork has separated stems and preserves rectangular edge alignment',()=>{
  const image=pathSvg({groups:[['n'],['s'],['e'],['w']]});
  assert.match(image,/preserveAspectRatio="none"/);
  assert.match(image,/L50 28/);
  assert.match(image,/L50 72/);
  assert.match(image,/L28 50/);
  assert.doesNotMatch(image,/L50 50/);
});
test('revealed stone bitmaps match all four effective corner directions exactly once',()=>{
  for(const [ports,id,rotation] of [
    [['n','e'],'goal-stone-ne',0],
    [['s','w'],'goal-stone-ne',180],
    [['n','w'],'goal-stone-nw',0],
    [['s','e'],'goal-stone-nw',180]
  ])for(const sourceRotation of [0,180])assert.deepEqual(cardVisual({kind:'goal',gold:false,rotation:sourceRotation,groups:[ports]}),{id,rotation});
  assert.deepEqual(cardVisual({kind:'path',defId:'corner-ne',rotation:180,groups:[['s','w']]}),{id:'corner-ne',rotation:180});
});
