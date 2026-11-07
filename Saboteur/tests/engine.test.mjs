import test from 'node:test';
import assert from 'node:assert/strict';
import { createRoom, command, view, rolePool, CARD_DEFS, DECK, GOLD_VALUES, cardGroups, placementError, legalPlacements, reachablePorts } from '../server/engine.mjs';
let sequence = 0;
const rng = () => .357;
const act = (s,key,data,random=rng) => command(s,key,{requestId:`request-${++sequence}`,expectedVersion:s.version,...data},random);
function lobby(n=5,mode='online') {
  let s=createRoom('123456','host-key','Teacher',1234,mode);
  for(let i=0;i<n;i++) s=act(s,`key-${i}`,{type:'join',name:`Player ${i}`});
  return s;
}
const started=(n=5,mode='online')=>act(lobby(n,mode),'host-key',{type:'start'});
const card=(defId,id='test-card')=>({...structuredClone(CARD_DEFS[defId]),id});
const cell=(defId,x,y,rotation=0)=>({kind:'path',defId,cardId:`board-${x}-${y}`,x,y,rotation,groups:cardGroups(CARD_DEFS[defId],rotation)});
function fixture(defId='cross') {
  const s=started();s.players[0].hand=[card(defId)];s.turnId=s.players[0].id;return s;
}
const goldSum=cards=>cards.reduce((sum,c)=>sum+c.value,0);
const allCards=s=>[...s.deck,...s.discard,...s.players.flatMap(p=>p.hand),...s.board.filter(c=>c.kind==='path').map(c=>({id:c.cardId}))];
function corridor(s,goalId='goal-1') {
  s.board=s.board.filter(c=>c.kind!=='path');
  for(let x=1;x<=6;x++) s.board.push(cell('straight-ew',x,0));
  s.board.find(c=>c.id===goalId).gold=true;
  return s;
}

test('the verified base deck has 40 paths, 27 actions and 28 reward cards worth 44 nuggets',()=>{
  assert.equal(DECK.length,67);
  assert.equal(Object.values(CARD_DEFS).filter(d=>d.kind==='path').reduce((n,d)=>n+d.count,0),40);
  const count=kind=>DECK.filter(id=>CARD_DEFS[id].kind===kind).length;
  assert.equal(count('break'),9);assert.equal(count('repair'),9);assert.equal(count('map'),6);assert.equal(count('rockfall'),3);
  assert.equal(GOLD_VALUES.length,28);assert.equal(GOLD_VALUES.reduce((a,b)=>a+b,0),44);
  assert.equal(CARD_DEFS['corner-ne'].count,5);
  assert.equal(Object.values(CARD_DEFS).filter(d=>d.kind==='path'&&d.groups.length>1).length,7);
});
test('3–10 role pools include exactly one unused role and correct initial hand sizes',()=>{
  for(let n=3;n<=10;n++){
    const s=started(n),pool=rolePool(n),sab=n<=4?1:n<=6?2:n<=9?3:4;
    assert.equal(pool.length,n+1);assert.equal(pool.filter(r=>r==='saboteur').length,sab);
    assert.deepEqual([...s.players.map(p=>p.role),s.unusedRole].sort(),pool.sort());
    const hand=n<=5?6:n<=7?5:4;
    assert.ok(s.players.every(p=>p.hand.length===hand));assert.equal(s.deck.length,67-n*hand);
    assert.equal(s.bank.length,28);assert.equal(s.board.length,4);assert.equal(s.round,1);
  }
  assert.throws(()=>act(lobby(2),'host-key',{type:'start'}),/3–10/);
  assert.throws(()=>act(lobby(10),'extra-key',{type:'join',name:'Extra'}),/full/);
});
test('a three-player deal can legally contain no saboteur and never reveals the unused role',()=>{
  const s=act(lobby(3),'host-key',{type:'start'},()=>0);
  // The one unused card belongs to the role pool, not an implicit fourth player.
  assert.equal(s.players.length,3);assert.equal(s.unusedRole,'saboteur');assert.ok(s.players.every(p=>p.role==='miner'));
  for(const hash of ['host-key','key-0','unknown'])assert.equal(Object.hasOwn(view(s,hash),'unusedRole'),false);
});
test('hosts manage without seats and may join their own game in both modes',()=>{
  for(const mode of ['online','classroom']){
    let s=lobby(3,mode);assert.equal(view(s,'host-key').me,null);assert.equal(s.players.length,3);
    s=act(s,'host-key',{type:'join',name:'Teacher'});assert.equal(view(s,'host-key').me.id,s.players[3].id);
    s=act(s,'host-key',{type:'start',firstPlayerId:s.players[2].id});assert.equal(s.turnId,s.players[2].id);
    assert.equal(view(s,'host-key').host,true);
  }
});
test('names are unique, bounded and inert; seats only change before start',()=>{
  assert.throws(()=>act(lobby(),'extra',{type:'join',name:'PLAYER 0'}),/taken/);
  for(const name of ['', '<script>', 'A'.repeat(25),'bad\u0000name'])assert.throws(()=>act(lobby(),'extra',{type:'join',name}),/characters/);
  assert.throws(()=>act(started(),'extra',{type:'join',name:'Extra'}),/started/);
  assert.throws(()=>act(started(),'host-key',{type:'kick',target:'p1'}),/lobby/);
  const s=lobby();assert.throws(()=>act(s,'key-0',{type:'kick',target:s.players[1].id}),/host/);
  assert.equal(act(s,'host-key',{type:'kick',target:s.players[1].id}).players.length,4);
  assert.equal(act(s,'key-0',{type:'leave'}).players.length,4);
});
test('private hands, goals, notes, gold, capabilities and role distribution never enter other projections',()=>{
  const s=started();s.players[0].notes=[{goalId:'goal-0',gold:true,groups:[['n','e']]}];
  s.players[0].gold=[{id:'private-reward',value:3}];
  for(const hash of ['unknown','host-key','key-1']){
    const v=view(s,hash),text=JSON.stringify(v);
    assert.ok(!text.includes('host-key'));assert.ok(!text.includes('key-'));assert.ok(!text.includes('private-reward'));
    assert.ok(!v.players.some(p=>Object.hasOwn(p,'role')||Object.hasOwn(p,'goldTotal')||Object.hasOwn(p,'hand')));
    assert.ok(v.board.filter(c=>c.kind==='goal').every(c=>!('gold'in c)&&!('groups'in c)&&!('rotation'in c)));
    assert.equal(Object.hasOwn(v,'bank'),false);assert.equal(Object.hasOwn(v,'deck'),false);assert.equal(Object.hasOwn(v,'receipts'),false);
    assert.equal(v.me?.notes.length||0,0);
  }
  assert.equal(view(s,'key-0').me.goldTotal,3);assert.equal(view(s,'key-0').me.notes.length,1);
});
test('presenter projection is public even when supplied a player or host key',()=>{
  const s=started(5,'classroom');
  for(const hash of ['host-key','key-0','unknown']){
    const v=view(s,hash,true);assert.equal(v.host,false);assert.equal(v.me,null);assert.deepEqual(v,view(s,'unknown',true));
    assert.ok(v.players.every(p=>!('role'in p)));assert.ok(v.board.filter(c=>c.kind==='goal').every(c=>!('gold'in c)));
  }
});
test('retries apply once, are actor bound, and stale turns fail without mutating input',()=>{
  const s=fixture(),snapshot=structuredClone(s),p=s.players[0];
  const c={type:'discard',cardId:'test-card',requestId:'uncertain-action',expectedVersion:s.version};
  const next=command(s,p.key,c,rng);assert.deepEqual(s,snapshot);assert.equal(next.version,s.version+1);
  assert.deepEqual(command(next,p.key,c,rng),next);
  assert.throws(()=>command(next,'key-1',c,rng),e=>e.status===409);
  assert.throws(()=>act(next,p.key,{type:'discard',cardId:'test-card',expectedVersion:s.version}),e=>e.status===409);
  assert.throws(()=>command(s,p.key,{...c,expectedVersion:undefined}),e=>e.status===409);
});
test('concurrent joining may use the same observed version without losing either player',()=>{
  let s=createRoom('123456','host','Teacher');
  s=act(s,'first',{type:'join',name:'First',expectedVersion:0});
  s=act(s,'second',{type:'join',name:'Second',expectedVersion:0});
  assert.deepEqual(s.players.map(p=>p.name),['First','Second']);assert.equal(s.version,2);
});
test('all actions require the correct player, version and current turn',()=>{
  const s=fixture();assert.throws(()=>act(s,'intruder',{type:'play',cardId:'test-card',x:1,y:0}),/not your turn/);
  assert.throws(()=>act(s,'key-1',{type:'discard',cardId:s.players[1].hand[0].id}),/not your turn/);
  assert.throws(()=>act(s,'host-key',{type:'play',cardId:'test-card',x:1,y:0}),/not your turn/);
  assert.throws(()=>act(lobby(),'key-0',{type:'start'}),/host/);
});
test('tunnels rotate 180 degrees only, stay portrait and match every touching edge',()=>{
  const s=fixture('corner-nw');
  assert.equal(placementError(s,CARD_DEFS['corner-nw'],1,0,0),null);
  assert.match(placementError(s,CARD_DEFS['corner-nw'],1,0,180),/match/);
  for(const rotation of [90,270,-180,'180'])assert.match(placementError(s,CARD_DEFS.cross,1,0,rotation),/180/);
  assert.match(placementError(s,CARD_DEFS.cross,0,0),/occupied/);
  assert.match(placementError(s,CARD_DEFS.cross,.5,1),/space/);
  assert.match(placementError(s,CARD_DEFS.cross,20,20),/unbroken/);
  s.board.push(cell('corner-ne',1,1));
  assert.match(placementError(s,CARD_DEFS['straight-ew'],1,0),/match/);
});
test('dead-end arms are individually reachable and never form a through route',()=>{
  const s=fixture();s.board.push(cell('dead-cross',1,0));
  const ports=reachablePorts(s);assert.ok(ports.has('1,0:w'));assert.ok(!ports.has('1,0:e'));assert.ok(!ports.has('1,0:n'));
  assert.match(placementError(s,CARD_DEFS.cross,2,0),/unbroken/);
  assert.equal(placementError(s,CARD_DEFS['dead-e'],-1,0),null);
});
test('hidden goal geometry cannot influence previews or serve as a hidden through route',()=>{
  const s=fixture();for(let x=1;x<=7;x++)s.board.push(cell('straight-ew',x,0));
  const privateState=legalPlacements(s,CARD_DEFS.cross),publicState=legalPlacements(view(s,'key-0'),CARD_DEFS.cross);
  assert.deepEqual(privateState,publicState);assert.ok(!reachablePorts(s).has('8,0:e'));
  assert.match(placementError(s,CARD_DEFS['straight-ew'],9,0),/unbroken/);
});
test('broken tools block paths but allow discards and action cards',()=>{
  let s=fixture('cross');s.players[0].broken=['pick'];
  assert.throws(()=>act(s,'key-0',{type:'play',cardId:'test-card',x:1,y:0}),/Repair all/);
  assert.equal(act(s,'key-0',{type:'discard',cardId:'test-card'}).turnId,s.players[1].id);
  s=fixture('map');s.players[0].broken=['pick','cart'];
  assert.equal(act(s,'key-0',{type:'play',cardId:'test-card',target:'goal-0'}).players[0].notes.length,1);
});
test('break cards target another player, with at most one broken copy of each tool',()=>{
  let s=fixture('break-pick');const target=s.players[1].id;
  assert.throws(()=>act(s,'key-0',{type:'play',cardId:'test-card',target:s.players[0].id}),/another/);
  const next=act(s,'key-0',{type:'play',cardId:'test-card',target});assert.deepEqual(next.players[1].broken,['pick']);
  s.players[1].broken=['pick'];assert.throws(()=>act(s,'key-0',{type:'play',cardId:'test-card',target}),/already broken/);
});
test('single and dual repairs repair only one matching tool on self or another player',()=>{
  let s=fixture('repair-pick-cart');s.players[0].broken=['pick','cart','lantern'];
  const c={type:'play',cardId:'test-card',target:s.players[0].id};
  assert.throws(()=>act(s,'key-0',c),/one matching/);assert.throws(()=>act(s,'key-0',{...c,tool:'lantern'}),/one matching/);
  const next=act(s,'key-0',{...c,tool:'cart'});assert.deepEqual(next.players[0].broken,['pick','lantern']);
  s=fixture('repair-pick');s.players[1].broken=['pick'];
  assert.deepEqual(act(s,'key-0',{type:'play',cardId:'test-card',target:s.players[1].id}).players[1].broken,[]);
});
test('maps reveal exactly one goal privately and never change its public state',()=>{
  const s=fixture('map'),goal=s.board.find(c=>c.id==='goal-1');
  const next=act(s,'key-0',{type:'play',cardId:'test-card',target:goal.id});
  assert.equal(next.players[0].notes[0].gold,goal.gold);assert.equal(view(next,'key-0').me.notes.length,1);
  assert.equal(view(next,'key-1').me.notes.length,0);assert.equal(view(next,'host-key').me,null);
  assert.deepEqual(view(next,'unknown').board,view(s,'unknown').board);
  goal.revealed=true;assert.throws(()=>act(s,'key-0',{type:'play',cardId:'test-card',target:goal.id}),/face-down/);
});
test('rockfalls remove any path, preserve protected cards and disconnect downstream paths',()=>{
  const s=fixture('rockfall');s.board.push(cell('straight-ew',1,0),cell('straight-ew',2,0));
  const next=act(s,'key-0',{type:'play',cardId:'test-card',x:1,y:0});
  assert.ok(next.board.some(c=>c.x===2&&c.y===0));assert.ok(!reachablePorts(next).has('2,0:e'));
  assert.equal(next.discard.filter(c=>c.id==='board-1-0').length,1);
  assert.match(placementError(next,CARD_DEFS['straight-ew'],3,0),/unbroken/);
  for(const [x,y] of [[0,0],[8,0]])assert.throws(()=>act(s,'key-0',{type:'play',cardId:'test-card',x,y}),/entrance and goals/);
});
test('placing, discarding, drawing and rockfall conserve all 67 physical cards',()=>{
  let s=started();const initial=allCards(s);assert.equal(initial.length,67);assert.equal(new Set(initial.map(c=>c.id)).size,67);
  // Choose a real path from the deck to make a deterministic valid hand without duplication.
  const actor=s.players[0],index=s.deck.findIndex(c=>c.defId==='cross');
  [actor.hand[0],s.deck[index]]=[s.deck[index],actor.hand[0]];
  s=act(s,actor.key,{type:'play',cardId:actor.hand[0].id,x:1,y:0});
  const after=allCards(s);assert.equal(after.length,67);assert.equal(new Set(after.map(c=>c.id)).size,67);
  for(let i=0;i<20;i++){
    const p=playerByTurn(s);s=act(s,p.key,{type:'discard',cardId:p.hand[0].id});
    assert.equal(allCards(s).length,67);assert.equal(new Set(allCards(s).map(c=>c.id)).size,67);
  }
});
function playerByTurn(s){return s.players.find(p=>p.id===s.turnId);}
test('drawing uses one card per turn; empty hands skip only after the draw pile is exhausted',()=>{
  let s=fixture();const before=s.deck.length;
  s=act(s,'key-0',{type:'discard',cardId:'test-card'});assert.equal(s.deck.length,before-1);assert.equal(s.players[0].hand.length,1);
  s=fixture();s.deck=[];s.players[1].hand=[];
  s=act(s,'key-0',{type:'discard',cardId:'test-card'});assert.equal(s.turnId,s.players[2].id);
});
test('stone goals reveal on a reachable entry, rotate to accept it and do not end the round',()=>{
  const s=corridor(fixture('straight-ew')),goal=s.board.find(c=>c.id==='goal-1');
  goal.gold=false;goal.groups=[['n','e']];
  const next=act(s,'key-0',{type:'play',cardId:'test-card',x:7,y:0});
  const revealed=next.board.find(c=>c.id==='goal-1');assert.equal(revealed.revealed,true);assert.equal(revealed.rotation,180);assert.ok(revealed.groups[0].includes('w'));
  assert.equal(next.phase,'playing');assert.equal(view(next,'unknown').board.find(c=>c.id===goal.id).gold,false);
});
test('a blocked path touching a goal cannot reveal it through an unreachable arm',()=>{
  const s=corridor(fixture('dead-cross')),goal=s.board.find(c=>c.id==='goal-1');
  const next=act(s,'key-0',{type:'play',cardId:'test-card',x:7,y:0});
  assert.equal(next.board.find(c=>c.id===goal.id).revealed,false);assert.equal(next.phase,'playing');
});
test('finding gold ends turns immediately and offers a private choice to each miner counterclockwise',()=>{
  let s=corridor(fixture('straight-ew'));s.players.forEach((p,i)=>p.role=i===1?'saboteur':'miner');
  const before=s.bank.length;s=act(s,'key-0',{type:'play',cardId:'test-card',x:7,y:0});
  assert.equal(s.phase,'gold');assert.equal(s.turnId,null);assert.equal(s.goldChoice.options.length,4);assert.equal(s.bank.length,before-4);
  const order=[s.players[0].id,s.players[4].id,s.players[3].id,s.players[2].id];assert.deepEqual(s.goldChoice.order,order);
  for(const [i,id] of order.entries()){
    const chooser=s.players.find(p=>p.id===id),v=view(s,chooser.key);assert.ok(v.goldChoice.options.length===4-i);
    assert.equal(view(s,'host-key').goldChoice.options,undefined);assert.equal(view(s,chooser.key,true).goldChoice.options,undefined);
    for(const other of s.players.filter(p=>p.id!==id))assert.equal(view(s,other.key).goldChoice.options,undefined);
    assert.throws(()=>act(s,'key-1',{type:'chooseGold',cardId:s.goldChoice.options[0].id}),/Wait for your turn/);
    s=act(s,chooser.key,{type:'chooseGold',cardId:s.goldChoice.options[0].id});
  }
  assert.equal(s.phase,'roundEnd');assert.ok(view(s,'unknown').players.every(p=>p.role));
  assert.ok(view(s,'unknown').players.every(p=>!('goldTotal'in p)));assert.equal(goldSum(s.bank)+s.players.reduce((sum,p)=>sum+goldSum(p.gold),0),44);
});
test('a saboteur finding gold awards the first choice to the miner on their right',()=>{
  let s=corridor(fixture('straight-ew'));s.players.forEach((p,i)=>p.role=i===0||i===4?'saboteur':'miner');
  s=act(s,'key-0',{type:'play',cardId:'test-card',x:7,y:0});
  assert.equal(s.result.winner,'miners');assert.equal(s.goldChoice.playerId,s.players[3].id);
});
test('sabotage payouts total 4/3/3/2 nuggets per saboteur and conserve the bank',()=>{
  for(const count of [1,2,3,4]){
    const s=fixture();s.deck=[];s.players.forEach((p,i)=>{p.hand=i===0?[card('map')]:[];p.role=i<count?'saboteur':'miner';});
    const next=act(s,'key-0',{type:'discard',cardId:'test-card'}),expected=count===1?4:count===4?2:3;
    assert.equal(next.phase,'roundEnd');assert.equal(next.result.winner,'saboteurs');
    assert.ok(next.players.slice(0,count).every(p=>goldSum(p.gold)===expected));
    assert.equal(goldSum(next.bank)+next.players.reduce((sum,p)=>sum+goldSum(p.gold),0),44);
  }
});
test('a round with no dealt saboteur awards nobody when the gold is not found',()=>{
  const s=fixture();s.deck=[];s.players.forEach((p,i)=>{p.hand=i===0?[card('map')]:[];p.role='miner';});
  const next=act(s,'key-0',{type:'discard',cardId:'test-card'});assert.equal(next.phase,'roundEnd');assert.ok(next.players.every(p=>p.gold.length===0));assert.equal(next.bank.length,28);
});
test('three complete exhausted rounds reshuffle roles, preserve earned gold and finish with exact scores',()=>{
  let s=started(10);const roleHistory=[];
  while(s.phase!=='finished'){
    roleHistory.push(s.players.map(p=>p.role));let turns=0;
    while(s.phase==='playing'){
      const p=playerByTurn(s);assert.ok(p.hand.length);s=act(s,p.key,{type:'discard',cardId:p.hand[0].id});turns++;
    }
    assert.equal(turns,67);assert.equal(s.deck.length,0);assert.ok(s.players.every(p=>p.hand.length===0));
    assert.equal(allCards(s).length,67);assert.equal(new Set(allCards(s).map(c=>c.id)).size,67);
    assert.equal(goldSum(s.bank)+s.players.reduce((sum,p)=>sum+goldSum(p.gold),0),44);
    if(s.phase==='finished')break;
    const last=s.players.findIndex(p=>p.id===s.lastActorId),expected=s.players[(last+1)%s.players.length].id;
    const owned=s.players.map(p=>goldSum(p.gold));s=act(s,'host-key',{type:'nextRound'});
    assert.equal(s.turnId,expected);assert.deepEqual(s.players.map(p=>goldSum(p.gold)),owned);assert.ok(s.players.every(p=>!p.broken.length&&!p.notes.length));
  }
  assert.equal(s.round,3);assert.equal(s.history.length,3);assert.equal(roleHistory.length,3);
  const publicView=view(s,'unknown');assert.ok(publicView.players.every(p=>Number.isInteger(p.goldTotal)));
  const highest=Math.max(...publicView.players.map(p=>p.goldTotal));assert.deepEqual(publicView.winners,publicView.players.filter(p=>p.goldTotal===highest).map(p=>p.id));
  assert.throws(()=>act(s,'host-key',{type:'nextRound'}),/next round/);
  const rematch=act(s,'host-key',{type:'rematch'});assert.equal(rematch.phase,'lobby');assert.equal(rematch.players.length,10);assert.ok(rematch.players.every(p=>p.gold.length===0&&p.role===null));
});
