// Opt-in integration check against the deployed Wix service; creates a disposable room.
import assert from 'node:assert/strict';
import {randomBytes,randomUUID} from 'node:crypto';
import {API_URL} from '../config.js';
const code=String(100000+Math.floor(Math.random()*900000));
const host=randomBytes(32).toString('hex');
const players=Array.from({length:8},(_,i)=>({token:randomBytes(32).toString('hex'),name:`Class demo ${i+1}`}));
async function request(token,body){
  const r=await fetch(API_URL,{method:'POST',headers:{'Content-Type':'application/json',Origin:'https://exams.bebrighton.net'},body:JSON.stringify({code,token,requestId:randomUUID(),...body})});
  const v=await r.json();if(!r.ok)throw Error(`${r.status}: ${v.error}`);return v;
}
let s=await request(host,{type:'create',name:'Class demo moderator',mode:'classroom'});
assert.equal(s.mode,'classroom');
await assert.rejects(()=>request(host,{type:'join',name:'Moderator'}),/moderator/);
const joins=await Promise.allSettled(players.map(p=>request(p.token,{type:'join',name:p.name})));
assert.ok(joins.every(r=>r.status==='fulfilled'));
s=await request(host,{type:'start'});
for(const p of players){const v=await request(p.token,{type:'state'});p.id=v.me.id;p.role=v.me.role;await request(p.token,{type:'ready',phaseId:v.phaseId});}
const target=role=>players.find(p=>p.role===role);
async function advance(){s=await request(host,{type:'advance',phaseId:s.phaseId});}
async function night(heal){
  const order=[];
  while(['fortune','werewolf','girl','witch'].includes(s.phase)){
    const phase=s.phase;order.push(phase);assert.equal(s.awake,false);
    const actor=target(phase),sleep=await request(actor.token,{type:'state'});
    assert.equal(sleep.phase,'sleep');assert.equal(sleep.me.canAct,false);
    await assert.rejects(()=>request(actor.token,{type:'action',phaseId:s.phaseId}),/moderator wakes/);
    const screen=await request(host,{type:'state',screen:true});
    assert.equal(screen.host,false);assert.equal(screen.me,null);assert.equal(screen.moderatorPlayers,undefined);
    assert.equal(screen.phase,'sleep');assert.ok(screen.players.filter(p=>p.alive).every(p=>!p.role&&!p.pack));
    s=await request(host,{type:'wake',phaseId:s.phaseId});
    for(const p of players.filter(p=>p.role===phase)){
      let extra={};
      if(phase==='fortune')extra={target:target('werewolf').id};
      if(phase==='werewolf')extra={target:target('villager').id};
      if(phase==='girl')extra={spy:true};
      if(phase==='witch')extra={heal};
      await request(p.token,{type:'action',phaseId:s.phaseId,...extra});
    }
    if(phase==='werewolf')await assert.rejects(()=>request(actor.token,{type:'advance',phaseId:s.phaseId}),/Only the host/);
    await advance();
  }
  assert.deepEqual(order,['fortune','werewolf','girl','witch']);assert.equal(s.phase,'day');
}
await advance();await night(true);assert.ok(s.players.every(p=>p.alive));
await advance();assert.equal(s.day,2);await night(false);
const dead=s.players.find(p=>!p.alive);assert.equal(dead.id,target('villager').id);assert.equal(dead.role,'villager');
await advance();assert.equal(s.phase,'vote');
for(const p of players.filter(p=>p.id!==dead.id))await request(p.token,{type:'vote',phaseId:s.phaseId,target:p.role==='hunter'?target('werewolf').id:target('hunter').id});
await advance();assert.equal(s.phase,'hunter');assert.equal(s.awake,false);
const hunter=target('hunter');await assert.rejects(()=>request(hunter.token,{type:'action',phaseId:s.phaseId}),/moderator wakes/);
s=await request(host,{type:'wake',phaseId:s.phaseId});
await request(hunter.token,{type:'action',phaseId:s.phaseId,target:target('werewolf').id});
s=await request(host,{type:'state'});assert.equal(s.phase,'dusk');
const screen=await request(host,{type:'state',screen:true});
assert.equal(screen.players.find(p=>p.id===hunter.id).role,'hunter');
assert.equal(screen.players.find(p=>p.id===target('werewolf').id).role,'werewolf');
assert.ok(screen.players.filter(p=>p.alive).every(p=>!p.role));
console.log('LIVE_CLASSROOM_OK',JSON.stringify({code,phase:s.phase,version:s.version}));
