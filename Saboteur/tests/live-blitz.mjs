// Opt-in release check: only creates a synthetic room, never alters student games.
import assert from 'node:assert/strict';
import {randomBytes,randomUUID} from 'node:crypto';
import {API_URL} from '../config.js';
if(process.env.SABOTEUR_LIVE!=='1'){console.log('Set SABOTEUR_LIVE=1 to test a new synthetic Blitz room.');process.exit(0);}
const code=String(100000+Math.floor(Math.random()*900000));
const host=randomBytes(32).toString('hex');
const people=Array.from({length:3},(_,i)=>({name:`Blitz QA ${i+1}`,token:randomBytes(32).toString('hex')}));
let state;
async function send(token,body){
  const payload={code,token,expectedVersion:state?.version,requestId:randomUUID(),...body};
  const r=await fetch(API_URL,{method:'POST',headers:{'Content-Type':'application/json',Origin:'https://exams.bebrighton.net'},body:JSON.stringify(payload)});
  const v=await r.json();assert.equal(r.status,200,JSON.stringify(v));
  if(v.version>=(state?.version??-1))state=v;
  return v;
}
await send(host,{type:'create',name:'Blitz release check',mode:'classroom',variant:'blitz'});
assert.equal(state.variant,'blitz');assert.equal(state.totalRounds,1);
for(const p of people){const v=await send(p.token,{type:'join',name:p.name});p.id=v.me.id;}
await send(host,{type:'start'});
assert.deepEqual(state.board.filter(c=>c.kind==='goal').map(c=>c.x),[4,4,4]);
for(let turn=0;turn<30;turn++){
  const p=people.find(p=>p.id===state.turnId);
  let v;
  // Reads on another instance may lag briefly behind the last atomic write.
  for(let attempt=0;attempt<15;attempt++){
    v=await send(p.token,{type:'state'});if(v.version===state.version)break;
    await new Promise(resolve=>setTimeout(resolve,200));
  }
  assert.equal(v.version,state.version);assert.equal(v.me.id,p.id);
  const count=v.me.hand.length,deck=v.deckCount;
  v=await send(p.token,{type:'discard',cardId:v.me.hand[0].id});
  assert.equal(v.me.hand.length,count);assert.equal(v.deckCount,deck-1);
  assert.equal(v.turnsRemaining,29-turn);assert.equal(v.phase,turn===29?'finished':'playing');
  if(turn===0){
    const screen=await send(p.token,{type:'state',screen:true});
    assert.equal(screen.me,null);assert.equal(screen.host,false);
    assert.ok(screen.players.every(p=>!('role'in p)&&!('hand'in p)));
    assert.ok(screen.board.filter(c=>c.kind==='goal').every(c=>!('gold'in c)&&!('groups'in c)));
  }
}
assert.equal(state.result.reason,'turnLimit');assert.equal(state.history.length,1);
assert.ok(state.players.every(p=>'goldTotal'in p));
const saboteurs=state.players.filter(p=>p.role==='saboteur');
for(const p of saboteurs)assert.equal(p.goldTotal,4);
await send(host,{type:'rematch'});assert.equal(state.variant,'blitz');assert.equal(state.phase,'lobby');
await send(host,{type:'start'});assert.equal(state.turnsRemaining,30);assert.equal(state.round,1);
console.log(JSON.stringify({code,turnsTested:30,scoring:true,reconnection:true,presenterPrivacy:true,rematch:true,presenter:`https://exams.bebrighton.net/Saboteur/?room=${code}&screen=1`}));
