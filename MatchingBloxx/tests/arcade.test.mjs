import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import rules from '../wix-backend/src/game/rules.cjs';
import arcade from '../wix-backend/src/game/arcade.cjs';
import {createRoom, command, view} from '../wix-backend/src/game/engine.mjs';

function center(motion) {
  for (let elapsed=0; elapsed<motion.period; elapsed+=4) {
    if(Math.abs(arcade.flight(motion,elapsed).impact.x)<.07) return elapsed;
  }
  assert.fail('The crane never crosses a reachable landing window.');
}

test('the classroom and browser use identical arcade rules', () => {
  const read=path=>readFileSync(new URL(path,import.meta.url),'utf8').replace(/\r\n/g,'\n');
  assert.equal(read('../arcade.js'),read('../wix-backend/src/game/arcade.cjs'));
});

test('released blocks keep their angular and sideways velocity and accelerate down under gravity', () => {
  const motion={phase:.4,period:3150,amplitude:1.05};
  const start=arcade.pose(motion,0);
  const fall=arcade.flight(motion,0);
  const near=fall.at(fall.duration/2);
  const late=fall.impact;
  assert.equal(fall.at(0).angle,start.angle);
  assert.ok(late.x>near.x && near.x>start.x);
  assert.ok(late.angle>start.angle);
  assert.ok(start.height-near.height < near.height-late.height);
  assert.ok(Math.abs(late.height-.49*Math.abs(Math.sin(late.angle)))<.0001);
});

test('matching starts at a lecture, offers four blocks, and advances in a single release', () => {
  const room=createRoom('823500','host','screen',10,20,{mode:'match'});
  command(room,'player','join',{name:'Jo'},20);
  command(room,'host','start',{},30);
  let me=view(room,'player',30).me;
  assert.equal(me.stage,'drop');
  assert.equal(me.prompt,'a lecture');
  assert.equal(new Set(me.choices).size,4);
  const elapsedMs=center(me.motion);
  command(room,'player','arcadeDrop',{round:1,choice:me.choices.indexOf('attend'),elapsedMs},30+elapsedMs);
  me=view(room,'player',30+elapsedMs).me;
  assert.equal(me.round,2);
  assert.equal(me.last.kind,'perfect');
  assert.equal(me.floors,1);
  assert.equal(me.score,200);
  assert.equal(view(room,'screen',30+elapsedMs).me,null);
  assert.throws(()=>command(room,'player','arcadeDrop',{round:1,choice:0,elapsedMs:0},40+elapsedMs),{status:409});
});

test('matching custom pools serve explicit distractors, reject a wrong placement and repeat in endless runs',()=>{
  const game=arcade.config('match',{name:'Office',rows:[['a report','write','call','book','read']]});
  const player=rules.newPlayer('p1','Alex',100);
  arcade.arm(player,10);
  let card=arcade.card(game,1,player.seed);
  assert.deepEqual(card.choices.slice().sort(),['book','call','read','write']);
  arcade.move(player,game,'arcadeDrop',{round:1,choice:(card.correct+1)%4,elapsedMs:0},10,true);
  assert.equal(player.last.correction,'write a report');
  assert.deepEqual(player.placements,[]);
  for(let turn=2;turn<=16;turn++){
    card=arcade.card(game,turn,player.seed);
    arcade.move(player,game,'arcadeDrop',{round:turn,choice:card.correct,elapsedMs:0},10,true);
  }
  assert.equal(player.round,17);
  assert.equal(player.stage,'drop');
  assert.throws(()=>arcade.config('match',{name:'Incomplete',rows:[['a report','write']]}),/distractors/);
});

test('wrong blocks knock down two to five floors and can be skipped instead',()=>{
  const game=arcade.config('rightwrong',{name:'Custom',right:['went'],wrong:['go'],instruction:'Past tense'});
  const player=rules.newPlayer('p1','Alex',500);
  player.placements=[0,0,0,0,0,0];
  player.round=arcade.card(game,1,player.seed).correct<0?1:2;
  arcade.arm(player,20);
  const skip=structuredClone(player);
  arcade.move(skip,game,'arcadePass',{round:skip.round},20,true);
  assert.equal(skip.last.kind,'passed');
  assert.equal(skip.placements.length,6);
  arcade.move(player,game,'arcadeDrop',{round:player.round,choice:0,elapsedMs:0},20,true);
  assert.equal(player.last.kind,'wrong');
  assert.ok(player.last.lost>=2 && player.last.lost<=5);
  assert.equal(6-player.placements.length,player.last.lost);
  assert.throws(()=>arcade.config('rightwrong',{name:'Overlap',right:['went'],wrong:['Went']}),/only be in one list/);
});
