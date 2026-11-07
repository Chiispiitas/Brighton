import test from 'node:test';
import assert from 'node:assert/strict';
import {createRoom,command,view,placementError,legalPlacements,CARD_DEFS,cardGroups,DECK} from '../server/engine.mjs';
let seq=0;
const act=(s,key,data)=>command(s,key,{...data,expectedVersion:s.version,requestId:`blitz-request-${++seq}`},()=>.357);
function game(n=3,mode='online',variant='blitz') {
  let s=createRoom('123456','host','Host',Date.now(),mode,variant);
  for(let i=0;i<n;i++)s=act(s,`key-${i}`,{type:'join',name:`Player ${i}`});
  return act(s,'host',{type:'start'});
}
const tunnel=(x,y)=>({kind:'path',defId:'straight-ew',cardId:`path-${x}-${y}`,x,y,groups:cardGroups(CARD_DEFS['straight-ew'])});
test('Blitz supports all player counts and both screens with the original deck and private deal',()=>{
  for(const mode of ['online','classroom'])for(let n=3;n<=10;n++){
    const s=game(n,mode),v=view(s,'key-0'),screen=view(s,'key-0',true);
    assert.equal(v.variant,'blitz');assert.equal(v.totalRounds,1);assert.equal(v.turnsRemaining,30);
    assert.deepEqual(v.boardBounds,{minX:0,maxX:4,minY:-2,maxY:2});
    assert.deepEqual(v.board.filter(c=>c.kind==='goal').map(c=>[c.x,c.y]),[[4,-2],[4,0],[4,2]]);
    assert.equal(s.deck.length+s.players.reduce((n,p)=>n+p.hand.length,0),DECK.length);
    assert.equal(screen.me,null);assert.equal(screen.host,false);
    assert.ok(screen.players.every(p=>!('role'in p)&&!('hand'in p)));
    assert.ok(screen.board.filter(c=>c.kind==='goal').every(c=>!('gold'in c)&&!('groups'in c)));
  }
  assert.throws(()=>createRoom('123456','host','Host',Date.now(),'online','invalid'),/Standard or Blitz/);
});
test('Blitz bounds are enforced by the engine and previews, without mutating a rejected turn',()=>{
  const s=game();
  assert.equal(placementError(s,'straight-ew',-1,0), 'Keep tunnels inside the 5 × 5 Blitz board.');
  const standard=structuredClone(s);delete standard.variant;
  assert.equal(placementError(standard,'straight-ew',-1,0),null);
  s.board.push(tunnel(1,0),tunnel(2,0),tunnel(3,0));
  for(const def of Object.values(CARD_DEFS).filter(d=>d.kind==='path'))for(const rotation of [0,180])
    assert.ok(legalPlacements(s,def,rotation).every(p=>p.x>=0&&p.x<=4&&p.y>=-2&&p.y<=2));
  for(const [x,y] of [[5,0],[0,-3],[0,3]])assert.match(placementError(s,'cross',x,y),/5 × 5/);
  const actor=s.players[0];actor.hand=[{...CARD_DEFS['straight-ew'],id:'outside'}];
  const before=structuredClone(s);
  assert.throws(()=>act(s,actor.key,{type:'play',cardId:'outside',x:-1,y:0}),/5 × 5/);
  assert.deepEqual(s,before);
});
test('30 ordinary turns draw normally, finish once, score saboteurs and rematch as Blitz',()=>{
  let s=game();
  for(let i=0;i<30;i++){
    const p=s.players.find(p=>p.id===s.turnId),count=p.hand.length,deck=s.deck.length;
    const cmd={type:'discard',cardId:p.hand[0].id,expectedVersion:s.version,requestId:`cap-turn-${i}`};
    const next=command(s,p.key,cmd,()=>.357);
    assert.equal(next.players.find(x=>x.id===p.id).hand.length,count);
    assert.equal(next.deck.length,deck-1);assert.deepEqual(command(next,p.key,cmd),next);
    s=next;assert.equal(view(s,'',true).turnsRemaining,29-i);
    assert.equal(s.phase,i===29?'finished':'playing');
  }
  assert.equal(s.history.length,1);assert.equal(s.result.reason,'turnLimit');assert.equal(s.result.winner,'saboteurs');
  for(const p of s.players)assert.equal(p.gold.reduce((n,c)=>n+c.value,0),p.role==='saboteur'?4:0);
  assert.throws(()=>act(s,'host',{type:'nextRound'}),/next round/);
  s=act(s,'host',{type:'rematch'});assert.equal(s.variant,'blitz');assert.equal(s.phase,'lobby');assert.equal(s.turnsPlayed,0);
  assert.ok(s.players.every(p=>p.gold.length===0));s=act(s,'host',{type:'start'});
  assert.equal(view(s,'').turnsRemaining,30);assert.equal(s.board[1].x,4);
});
test('gold reached on the final Blitz turn beats the turn cap and completes private rewards',()=>{
  let s=game();s.turnsPlayed=29;s.board.push(tunnel(1,0),tunnel(2,0));
  s.board.find(c=>c.id==='goal-1').gold=true;
  const p=s.players[0];p.hand=[{...CARD_DEFS['straight-ew'],id:'winning-card'}];
  s=act(s,p.key,{type:'play',cardId:'winning-card',x:3,y:0});
  assert.equal(s.phase,'gold');assert.equal(s.result.reason,'gold');assert.equal(s.result.winner,'miners');
  while(s.phase==='gold'){
    const picker=s.players.find(p=>p.id===s.goldChoice.playerId);
    assert.ok(!view(s,'',true).goldChoice.options);
    s=act(s,picker.key,{type:'chooseGold',cardId:s.goldChoice.options[0].id});
  }
  assert.equal(s.phase,'finished');assert.equal(s.round,1);assert.ok(view(s,'',true).players.every(p=>'goldTotal'in p));
});
test('legacy active rooms keep the full board, uncapped turns and three rounds',()=>{
  let s=game(3,'classroom','standard');delete s.variant;delete s.turnsPlayed;
  const board=structuredClone(s.board);
  for(let i=0;i<31;i++){const p=s.players.find(p=>p.id===s.turnId);s=act(s,p.key,{type:'discard',cardId:p.hand[0].id});}
  assert.equal(s.phase,'playing');assert.deepEqual(s.board,board);assert.equal(s.board[1].x,8);
  const v=view(s,'');assert.equal(v.variant,'standard');assert.equal(v.totalRounds,3);assert.equal(v.boardBounds,null);assert.equal(v.turnsRemaining,null);
});
