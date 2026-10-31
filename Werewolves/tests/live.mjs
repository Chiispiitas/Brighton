import assert from 'node:assert/strict';
import { randomBytes, randomUUID } from 'node:crypto';
import { API_URL } from '../config.js';
const code=String(100000+Math.floor(Math.random()*900000));
const host=randomBytes(32).toString('hex');
const players=Array.from({length:8},(_,i)=>({token:randomBytes(32).toString('hex'),name:`QA ${i+1}`}));
async function request(token,data){
  const r=await fetch(API_URL,{method:'POST',headers:{'Content-Type':'application/json','Origin':'https://exams.bebrighton.net'},body:JSON.stringify({code,token,requestId:randomUUID(),...data})});
  const body=await r.json();if(!r.ok)throw new Error(`${r.status}: ${body.error}`);assert.ok(['*','https://exams.bebrighton.net'].includes(r.headers.get('access-control-allow-origin')));return body;
}
let s=await request(host,{type:'create',name:'QA narrator'});console.log('Created separate Wix room',code);
const joins=await Promise.allSettled(players.map(p=>request(p.token,{type:'join',name:p.name})));
assert.ok(joins.every(x=>x.status==='fulfilled'),JSON.stringify(joins));
s=await request(host,{type:'state'});assert.equal(s.players.length,8);console.log('Eight simultaneous joins preserved');
s=await request(host,{type:'start'});assert.equal(s.phase,'reveal');
for(const p of players){const v=await request(p.token,{type:'state'});p.id=v.me.id;p.role=v.me.role;assert.ok(v.players.every(x=>!x.role));await request(p.token,{type:'ready',phaseId:v.phaseId});}
s=await request(host,{type:'state'});assert.equal(s.progress.done,8);assert.equal(s.me,null);
s=await request(host,{type:'advance',phaseId:s.phaseId});const order=[];
let originalVictim=null;
while(['fortune','werewolf','girl','witch'].includes(s.phase)){
  order.push(s.phase);
  if(s.phase==='werewolf'){
    const wolves=players.filter(p=>p.role==='werewolf'),villagers=players.filter(p=>p.role!=='werewolf');
    await request(wolves[0].token,{type:'action',phaseId:s.phaseId,target:villagers[0].id});
    await request(wolves[1].token,{type:'action',phaseId:s.phaseId,target:villagers[1].id});
    const packView=await request(wolves[0].token,{type:'state'});
    assert.equal(packView.packDecision.agreed,false);assert.equal(packView.packChoices.find(c=>c.wolfId===wolves[1].id).target,villagers[1].id);
    const privateView=await request(villagers[0].token,{type:'state'});assert.equal(privateView.packChoices,undefined);
    for(const key of [host,wolves[0].token]){
      await assert.rejects(()=>request(key,{type:'advance',phaseId:s.phaseId,force:true}),/Impossible to continue because the decision has not been made/);
    }
  }
  for(const p of players.filter(x=>x.role===s.phase)){
    const me=await request(p.token,{type:'state'});
    let args={};
    if(s.phase==='fortune')args={target:players.find(x=>x.id!==p.id).id};
    if(s.phase==='werewolf')args={target:players.find(x=>x.role==='villager').id};
    if(s.phase==='girl')args={spy:true};
    if(s.phase==='witch') { originalVictim=me.me.victim;assert.ok(originalVictim);args={heal:true}; }
    const id=randomUUID();const acted=await request(p.token,{type:'action',phaseId:s.phaseId,requestId:id,...args});
    const replay=await request(p.token,{type:'action',phaseId:s.phaseId,requestId:id,...args});assert.equal(acted.version,replay.version);
  }
  const key=s.phase==='werewolf'?players.find(p=>p.role==='werewolf').token:host;
  s=await request(key,{type:'advance',phaseId:s.phaseId});
}
assert.deepEqual(order,['fortune','werewolf','girl','witch']);assert.equal(s.phase,'day');assert.ok(s.players.every(p=>p.alive));
s=await request(host,{type:'advance',phaseId:s.phaseId});assert.equal(s.day,2);assert.equal(s.phase,'fortune');
let killed=null;
while(['fortune','werewolf','girl','witch'].includes(s.phase)){
  if(s.phase==='werewolf'){
    killed=players.find(p=>p.role==='villager');
    for(const p of players.filter(p=>p.role==='werewolf'))await request(p.token,{type:'action',phaseId:s.phaseId,target:killed.id});
  }
  s=await request(host,{type:'advance',phaseId:s.phaseId,force:true});
}
assert.equal(s.players.find(p=>p.id===killed.id).role,'villager');
assert.equal(s.phase,'day');s=await request(host,{type:'advance',phaseId:s.phaseId});assert.equal(s.phase,'vote');
const wolf=players.find(p=>p.role==='werewolf');
for(const p of players.filter(p=>p.id!==killed.id))await request(p.token,{type:'vote',phaseId:s.phaseId,target:p.id===wolf.id?null:wolf.id});
s=await request(host,{type:'advance',phaseId:s.phaseId});assert.equal(s.phase,'dusk');assert.equal(s.players.find(p=>p.id===wolf.id).alive,false);
const spectator=await request(randomBytes(32).toString('hex'),{type:'state'});assert.equal(spectator.me,null);assert.equal(spectator.host,false);assert.ok(spectator.players.filter(p=>p.alive).every(p=>!p.role&&!p.pack));
assert.equal(spectator.players.find(p=>p.id===wolf.id).role,'werewolf');assert.equal(spectator.players.find(p=>p.id===killed.id).role,'villager');assert.equal(spectator.packChoices,undefined);
assert.ok(!JSON.stringify(spectator).includes('notes'));console.log('Live pack highlights, mandatory consensus, revised choices, wolf continuation, killed/voted-out role reveals, replay safety and privacy passed');
console.log('LIVE_QA_OK',JSON.stringify({code,version:s.version,phase:s.phase}));
