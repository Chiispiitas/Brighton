import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import rules from '../wix-backend/src/game/rules.cjs';
import arcade from '../wix-backend/src/game/arcade.cjs';
import physics from '../physics.js';
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
  assert.equal(read('../physics.js'),read('../wix-backend/src/game/physics.cjs'));
});

test('classroom drops use the same moving roofline as the client and rehang the rope', () => {
  const setup={mode:'match',physics:2};
  const room=createRoom('451122','host','screen',10,20,setup);
  command(room,'player','join',{name:'Jo'},20);
  command(room,'host','start',{},30);
  const player=room.players[0];
  player.placements=[.12,.22,.42];
  player.rock=physics.kick(null,.32,0,3);
  const me=view(room,'player',30).me;
  let elapsedMs=450, contact;
  for(;elapsedMs<450+me.motion.period;elapsedMs+=5) {
    contact=arcade.trajectory(me.motion,elapsedMs,me.placements,t=>physics.rockAt(me.rock,elapsedMs+t).angle,false);
    if(contact.hit && !contact.tipped && Math.abs(contact.offset)>.14 && Math.abs(contact.offset)<.20) break;
  }
  assert.ok(elapsedMs<450+me.motion.period);
  const placed=arcade.land(me.placements,contact);
  assert.equal(placed.kind,'landed');
  const card=arcade.card(room.arcade,1,player.seed);
  command(room,'player','arcadeDrop',{round:1,choice:card.correct,elapsedMs},30+elapsedMs);
  const next=view(room,'player',30+elapsedMs).me;
  assert.deepEqual(next.placements,placed.floors);
  assert.equal(next.last.kind,'landed');
  assert.equal(next.motion.physics,2);
  assert.equal(next.motion.lowering,true);
  assert.deepEqual(next.rock,physics.rockAt(next.last.rock,220));
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

test('matching offers four blocks and advances in a single release', () => {
  const room=createRoom('823500','host','screen',10,20,{mode:'match'});
  command(room,'player','join',{name:'Jo'},20);
  command(room,'host','start',{},30);
  let me=view(room,'player',30).me;
  assert.equal(me.stage,'drop');
  const first = arcade.card(room.arcade,1,room.players[0].seed);
  assert.equal(me.prompt,first.label);
  assert.equal(new Set(me.choices).size,4);
  const elapsedMs=center(me.motion);
  command(room,'player','arcadeDrop',{round:1,choice:first.correct,elapsedMs},30+elapsedMs);
  me=view(room,'player',30+elapsedMs).me;
  assert.equal(me.round,2);
  assert.equal(me.last.kind,'perfect');
  assert.equal(me.floors,1);
  assert.equal(me.score,200);
  assert.equal(view(room,'screen',30+elapsedMs).me,null);
  assert.throws(()=>command(room,'player','arcadeDrop',{round:1,choice:0,elapsedMs:0},40+elapsedMs),{status:409});
});

test('presenters receive bounded replays without exposing player prompts or credentials', () => {
  const room=createRoom('823501','host','screen',10,20,{mode:'match',physics:2});
  command(room,'player','join',{name:'Jo'},20);
  command(room,'host','start',{},30);
  const player=room.players[0];
  for(let turn=1;turn<=9;turn++){
    const at=turn*1500, choice=arcade.card(room.arcade,turn,player.seed).correct;
    command(room,'player','arcadeDrop',{round:turn,choice,elapsedMs:500},at);
  }
  const {time,lots}=view(room,'screen',13500).city;
  assert.equal(time,13500);
  assert.equal(lots.length,1);
  assert.deepEqual(lots[0].floors,player.placements);
  assert.deepEqual(lots[0].drops.map(drop=>drop.turn),[4,5,6,7,8,9]);
  for(const event of lots[0].drops){
    assert.ok(arcade.flight(event.motion,event.elapsed,event.before,event.rock).duration>0);
    for(const name of ['phrase','prompt','choices','correction','key'])assert.equal(event[name],undefined);
  }
  assert.equal(view(room,'player',13500).city,undefined);
  assert.equal(view(room,'host',13500).city,undefined);
  assert.deepEqual(view(room,'screen',13500+24001).city.lots[0].drops,[]);
});

test('new online rooms apply the Java swing on the server, player and presenter', () => {
  const room=createRoom('823502','host','screen',10,20,arcade.config('match'));
  command(room,'player','join',{name:'Jo'},20);
  command(room,'host','start',{},30);
  const player=room.players[0], start=view(room,'player',30).me.motion;
  assert.equal(start.physics,5);
  assert.equal(start.classicLanding,true);
  assert.equal(start.verticalAmplitude,physics.quickSwing(0).verticalAmplitude);
  const choice=arcade.card(room.arcade,1,player.seed).correct;
  command(room,'player','arcadeDrop',{round:1,choice,elapsedMs:650},680);
  const replay=view(room,'screen',680).city.lots[0].drops[0];
  assert.deepEqual(arcade.pose(start,650),arcade.pose(replay.motion,650));
  assert.equal(view(room,'player',680).me.motion.physics,5);
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

test('Screen sorting skips only when a dropped block clears the tower',()=>{
  const player=rules.newPlayer('p1','Jo',500);
  player.placements=[0,0,0,0,0,0];
  const track=x=>physics.track(physics.drop({centerX:x,centerY:1.2,angle:0,vx:0,vy:0,spin:0}),
    player.placements,()=>0,true);
  const wide=track(1.2), graze=track(.94), center=track(0);
  const skip=arcade.screenDrop(player,false,false,wide);
  assert.equal(skip.kind,'passed');
  assert.equal(skip.points,0);
  assert.equal(skip.bump,false);
  assert.deepEqual(skip.floors,player.placements);
  const missedRight=arcade.screenDrop(player,false,true,wide);
  assert.equal(missedRight.kind,'passed-right');
  assert.equal(missedRight.points,0);
  for(const impact of [center,graze]){
    const wrong=arcade.screenDrop(player,false,false,impact);
    assert.equal(wrong.kind,'wrong');
    assert.equal(wrong.bump,true);
    assert.ok(wrong.fallen-1>=2 && wrong.fallen-1<=5);
    assert.equal(wrong.floors.length+wrong.fallen-1,player.placements.length);
  }
  const right=arcade.screenDrop(player,false,true,center);
  assert.equal(right.kind,'perfect');
  assert.equal(right.points,200);
  assert.equal(right.floors.length,7);
  assert.equal(arcade.screenDrop(player,true,false,wide).kind,'passed');
});

test('shared options are constant across prompts and may include unused distractors',()=>{
  const game=arcade.config('match',{name:'Grammar', sameOptions:true,
    rows:[['I enjoy ___.','reading'],['I want ___.','to read']], options:['to read','reading','read']});
  for(let round=1;round<=2;round++)assert.deepEqual(arcade.card(game,round,20).choices,game.set.options);
  assert.throws(()=>arcade.config('match',{...game.set,options:['read','reading']}),/must appear/);
});

test('imports accept two forms per sentence, retain commas in CSV, and read Right / Wrong TSV',()=>{
  const match=arcade.importPool('match','prompt,answer,other\n"I enjoy ___, especially at night.",reading,to read','Grammar.csv');
  assert.equal(match.sameOptions,false);
  assert.equal(match.rows[0][0],'I enjoy ___, especially at night.');
  const game=arcade.config('match',match);
  const player=rules.newPlayer('p1','Jo',10);
  arcade.arm(player,20);
  const choice=arcade.card(game,1,10).correct;
  assert.throws(()=>arcade.move(player,game,'arcadeDrop',{round:1,choice:2,elapsedMs:0},20,true),/Choose a block/);
  arcade.move(player,game,'arcadeDrop',{round:1,choice:1-choice,elapsedMs:0},20,true);
  assert.equal(player.last.correction,'I enjoy reading, especially at night.');
  const sorting=arcade.importPool('rightwrong','word\tstatus\r\npear\tright\r\ncarrot\twrong','Fruit.tsv');
  assert.deepEqual(sorting.right,['pear']);
  assert.deepEqual(sorting.wrong,['carrot']);
  const json=arcade.importPool('rightwrong',JSON.stringify({mode:'rightwrong',set:sorting}));
  assert.deepEqual(json,sorting);
});

test('legacy and Java landing thresholds differ', () => {
  const track = (x, classicLanding) => physics.track(
    physics.drop({centerX:x,centerY:1.2,angle:0,vx:0,vy:0,spin:0}), [], () => 0, false, classicLanding);
  assert.equal(track(127 / 256, true).tipped, false);
  assert.equal(track(128 / 256, true).tipped, true);
  assert.equal(track(128 / 256, false).tipped, false);
  assert.equal(arcade.land([], track(24 / 256, true), true).kind, 'perfect');
  assert.equal(arcade.land([], track(25 / 256, true), true).kind, 'landed');
});

test('solo ends on the chosen turn and a clean wrong drop earns no penalty', () => {
  const config = {...arcade.config('match'),physics:4};
  const solo = arcade.practice(config, 'Jo', 1);
  const {me,total} = solo.view();
  assert.equal(total, 1);
  const result = solo.command('arcadeDrop', {round:me.round,choice:0,elapsedMs:0});
  assert.equal(result.phase, 'finished');
  assert.equal(result.me.motion, null);

  const player = rules.newPlayer('p1', 'Jo', 41);
  arcade.arm(player, 10, config.physics);
  const wrong = (arcade.card(config,player.round,player.seed).correct + 1) % 4;
  const release = Array.from({length:player.motion.period}, (_, ms) => ms).find(ms =>
    !arcade.trajectory(player.motion,ms,[],() => 0,false).hit);
  assert.ok(Number.isFinite(release));
  assert.throws(() => arcade.move(player,config,'arcadePass',{round:1},10,true), /beside the tower/);
  arcade.move(player,config,'arcadeDrop',{round:1,choice:wrong,elapsedMs:release},10+release,true);
  assert.equal(player.last.kind, 'passed');
  assert.equal(player.last.points, 0);
  assert.equal(player.last.fallen, 0);
});

test('Java sway reacts to floor offsets on a 3.6-second cycle',()=>{
  const motion={physics:5};
  const floors=[0,.21,.41,.64,.84,1.07,1.3];
  const at=age=>arcade.towerPose(motion,floors,{java:true,phase:0,landAge:800},age);
  assert.deepEqual(at(0),at(3600));
  assert.deepEqual(at(0).slice(0,2),[{x:0,angle:0,lift:0},{x:.21,angle:0,lift:0}]);
  assert.notEqual(at(0)[6].x,at(1800)[6].x);
});

test('Java edge impacts peel loose floors from the top and leave a centered joint intact',()=>{
  const floors=[0,0,.11,.24,.4];
  const drop=physics.drop({centerX:.7,centerY:1.2,angle:0,vx:0,vy:0,spin:0});
  const track=floors=>physics.track(drop,floors,()=>floors.map(x=>({x,angle:0})),false,true,true);
  const impact=track(floors);
  const land=arcade.land(floors,impact,true);
  assert.deepEqual(land.floors,[0,0,.11,.24]);
  assert.equal(land.fallen,2);
  assert.equal(land.parts[0].delay,150);
  assert.deepEqual(physics.javaFall(.14,land.parts[0]),{x:0,y:0,angle:-0});
  assert.ok(physics.javaFall(.3,land.parts[0]).y<0);
  assert.equal(arcade.land([0,0],track([0,0]),true).fallen,1);
  assert.equal(arcade.land([],track([]),true).kind,'landed');
});
