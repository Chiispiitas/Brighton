import test from 'node:test';
import assert from 'node:assert/strict';
import { createRoom, command, view, cardGroups, legalPlacements } from '../server/engine.mjs';

function seeded(seed) {
  let value = seed >>> 0;
  return () => { value += 0x6d2b79f5; let n=value; n=Math.imul(n^n>>>15,n|1); n^=n+Math.imul(n^n>>>7,n|61); return ((n^n>>>14)>>>0)/4294967296; };
}
function sum(cards) { return cards.reduce((total,card)=>total+card.value,0); }
function invariant(s) {
  const cards=[...s.deck,...s.discard,...s.players.flatMap(p=>p.hand),...s.board.filter(c=>c.kind==='path').map(c=>({id:c.cardId}))];
  assert.equal(cards.length,67,'physical card count');assert.equal(new Set(cards.map(c=>c.id)).size,67,'physical card identity');
  const gold=[...s.bank,...s.players.flatMap(p=>p.gold),...(s.goldChoice?.options||[])];
  assert.equal(gold.length,28,'gold-card count');assert.equal(new Set(gold.map(c=>c.id)).size,28,'gold-card identity');assert.equal(sum(gold),44,'gold conservation');
  assert.ok(s.players.every(p=>new Set(p.broken).size===p.broken.length));
  assert.ok(['playing','gold','roundEnd','finished'].includes(s.phase));
}
function chooseMove(s,p,random,seekGold) {
  const publicView=view(s,p.key),goals=publicView.board.filter(c=>c.kind==='goal'&&!c.revealed);
  if(seekGold&&!p.broken.length){
    const choices=[];
    for(const c of p.hand.filter(c=>c.kind==='path'&&c.groups.some(g=>g.length>1)))for(const rotation of [0,180]) {
      const ports=cardGroups(c,rotation).flat();
      for(const place of legalPlacements(publicView,c,rotation)){
        const distance=Math.min(...goals.map(g=>Math.abs(g.x-place.x)+Math.abs(g.y-place.y)),20);
        // The bot sees the same concealed board as a human. It builds toward any
        // still-hidden goal and favours an opening that can continue east.
        const score=100-distance*6+Math.min(place.x,8)+(ports.includes('e')?4:0)-Math.abs(place.y)*.1+random();
        choices.push({score,type:'play',cardId:c.id,...place});
      }
    }
    choices.sort((a,b)=>b.score-a.score);
    if(choices.length){const {score,...move}=choices[0];return move;}
  }
  for(const c of p.hand.filter(c=>c.kind==='repair'))for(const target of s.players){
    const tool=c.tools.find(t=>target.broken.includes(t));if(tool)return {type:'play',cardId:c.id,target:target.id,tool};
  }
  const map=p.hand.find(c=>c.kind==='map');
  if(map&&goals.length)return {type:'play',cardId:map.id,target:goals[Math.floor(random()*goals.length)].id};
  if(!seekGold){
    const sabotage=p.hand.find(c=>c.kind==='break');
    if(sabotage){const targets=s.players.filter(target=>target.id!==p.id&&!target.broken.includes(sabotage.tools[0]));if(targets.length)return {type:'play',cardId:sabotage.id,target:targets[Math.floor(random()*targets.length)].id};}
    const rock=p.hand.find(c=>c.kind==='rockfall'),paths=publicView.board.filter(c=>c.kind==='path');
    if(rock&&paths.length){const path=paths[Math.floor(random()*paths.length)];return {type:'play',cardId:rock.id,x:path.x,y:path.y};}
  }
  // In a failed mine there must still be a deterministic way to finish every hand.
  const discarded=p.hand[Math.floor(random()*p.hand.length)];return {type:'discard',cardId:discarded.id};
}

test('48 seeded full matches at every supported player count conserve cards, rewards and valid turns',()=>{
  const results={miners:0,saboteurs:0,zeroSab:0,goldChoices:0,moves:0};
  for(let n=3;n<=10;n++)for(let seed=1;seed<=6;seed++){
    const random=seeded(seed*1009+n*37);let serial=0;
    const act=(s,key,data)=>command(s,key,{...data,expectedVersion:s.version,requestId:`stress-${n}-${seed}-${++serial}`},random);
    let s=createRoom('123456','teacher','Teacher');
    for(let i=0;i<n;i++)s=act(s,`key-${i}`,{type:'join',name:`Player ${i}`});
    s=act(s,'teacher',{type:'start',firstPlayerId:s.players[seed%n].id});
    let steps=0;
    while(s.phase!=='finished'){
      invariant(s);assert.ok(++steps<260,'a match has a finite number of turns and reward choices');
      if(s.phase==='playing'){
        const p=s.players.find(p=>p.id===s.turnId);assert.ok(p?.hand.length,'the turn belongs to an occupied nonempty hand');
        const before=s,move=chooseMove(s,p,random,seed%3!==0);s=act(s,p.key,move);results.moves++;
        assert.equal(s.version,before.version+1);
        if(s.phase!=='playing'){results[s.result.winner]++;if(!s.players.some(p=>p.role==='saboteur'))results.zeroSab++;}
      }else if(s.phase==='gold'){
        const p=s.players.find(p=>p.id===s.goldChoice.playerId);assert.equal(p.role,'miner');
        const owner=view(s,p.key),presenter=view(s,p.key,true);
        assert.ok(owner.goldChoice.options.length);assert.equal(presenter.goldChoice.options,undefined);assert.equal(presenter.me,null);
        // Exercise greedy and random reward choices against every remaining bank.
        const choices=[...owner.goldChoice.options].sort((a,b)=>b.value-a.value),chosen=seed%2?choices[0]:choices[Math.floor(random()*choices.length)];
        s=act(s,p.key,{type:'chooseGold',cardId:chosen.id});results.goldChoices++;
      }else if(s.phase==='roundEnd'){
        const last=s.players.findIndex(p=>p.id===s.lastActorId),next=s.players[(last+1)%n].id,owned=s.players.map(p=>sum(p.gold));
        s=act(s,'teacher',{type:'nextRound'});assert.equal(s.turnId,next);assert.deepEqual(s.players.map(p=>sum(p.gold)),owned);
      }
    }
    invariant(s);assert.equal(s.round,3);assert.equal(s.history.length,3);
    const publicView=view(s,'unknown'),highest=Math.max(...s.players.map(p=>sum(p.gold)));
    assert.deepEqual(publicView.winners,s.players.filter(p=>sum(p.gold)===highest).map(p=>p.id));
    for(const p of s.players)assert.equal(publicView.players.find(item=>item.id===p.id).goldTotal,sum(p.gold));
  }
  assert.ok(results.miners>20,'real legal routes reach gold across many seeded deals');assert.ok(results.saboteurs>20,'failed mines exercise sabotage rewards');assert.ok(results.goldChoices>40);
  assert.equal(results.miners+results.saboteurs,144);
});
