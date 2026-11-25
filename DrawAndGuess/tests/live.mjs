import assert from 'node:assert/strict';
import {randomBytes,randomInt,randomUUID} from 'node:crypto';
import {API_URL} from '../config.js';
const players=Array.from({length:36},(_,i)=>({name:'Draw QA '+(i+1),token:randomBytes(32).toString('hex')}));
const code=String(randomInt(100000,1000000));
const host=players[0];
async function post(player,type,fields={},status=200){
  const response=await fetch(API_URL,{method:'POST',headers:{'Content-Type':'application/json',Origin:'https://exams.bebrighton.net'},
    body:JSON.stringify({code,type,token:player?.token,requestId:randomUUID(),...fields}),signal:AbortSignal.timeout(22000)});
  const data=await response.json();
  assert.equal(response.status,status,data.error);
  return data;
}
async function until(read,check){
  const deadline=Date.now()+7000;
  while(true){
    const data=await read();
    if(check(data))return data;
    assert.ok(Date.now()<deadline,'Room state did not catch up.');
    await new Promise(resolve=>setTimeout(resolve,250));
  }
}
await post(host,'create',{name:host.name,listed:true,custom:'Sun,Moon',choices:2,customOnly:true,rounds:1});
await until(()=>post(null,'list'),data=>data.rooms.some(r=>r.code===code));
console.log('Public matchmaking found the new room.');
for(let i=1;i<36;i+=5){
  await Promise.all(players.slice(i,i+5).map(p=>post(p,'join',{name:p.name})));
}
const outsider={name:'Extra',token:randomBytes(32).toString('hex')};
assert.match((await post(outsider,'join',{name:outsider.name},409)).error,/full/);
let state=await post(host,'start');
assert.equal(state.players.length,36);
assert.equal(state.phase,'choose');
const choice=state.options[0];
await post(null,'state',{screen:true},401);
let guest=await until(()=>post(players[1],'state'),s=>s.phase==='choose');
assert.equal(guest.options,undefined);
assert.equal(guest.settings.custom,undefined);
assert.ok(guest.me);
state=await post(host,'choose',{turnId:state.turnId,index:0});
assert.equal(state.answer,choice);
state=await post(host,'paint',{turnId:state.turnId,ops:[{kind:'stroke',color:'#e95042',id:'line1',width:9,points:[120,160,340,560,750,200]}]});
const guesser=await until(()=>post(players[1],'state'),s=>s.boardVersion===state.boardVersion);
assert.equal(guesser.board.length,1);
assert.equal(guesser.answer,undefined);
assert.equal((await post(players[1],'state',{boardVersion:guesser.boardVersion})).board,undefined);
state=await post(players[1],'guess',{turnId:state.turnId,text:choice});
assert.ok(state.players.find(p=>p.id===state.me).score>0);
guest=await until(()=>post(players[1],'state'),s=>s.version>=state.version);
assert.ok(guest.messages.some(m=>m.kind==='solved'));
assert.ok(guest.messages.every(m=>m.text!==choice));
assert.equal(guest.answer,undefined);
console.log('LIVE_DRAW_OK',JSON.stringify({code,players:state.players.length,version:state.version}));
