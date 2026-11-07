import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { stripTypeScriptTypes } from 'node:module';
import { compileFunction } from 'node:vm';
import { webcrypto } from 'node:crypto';
import { createRoom, command, view, GameError } from '../server/engine.mjs';

// Execute the actual endpoint with atomic in-memory CMS inserts, rather than a
// parallel reimplementation of its collision/retry loop. Node 24 supplies TS
// erasure, so CI needs no SDK/network/install to exercise this boundary.
const source=await readFile(new URL('../wix-backend/src/pages/api/game.ts',import.meta.url),'utf8');
const javascript=stripTypeScriptTypes(source).replace(/^import .*;\r?$/gm,'').replace(/export const /g,'const ');
const routeFactory=compileFunction(`${javascript}\nreturn { POST, OPTIONS, GET };`,['items','auth','createRoom','command','view','GameError','crypto']);
const token=n=>n.toString(16).padStart(64,'0');
const clone=value=>structuredClone(value);
function setup(){
  const records=new Map();let lostCommitVersion=null,readBarrier=null;const operations=[];
  const items={
    query(collection){
      assert.equal(collection,'SaboteurStates');const predicates=[];let limit=1000,descending=null;
      const builder={
        eq(field,value){predicates.push(row=>row[field]===value);return builder;},
        lt(field,value){predicates.push(row=>row[field]<value);return builder;},
        descending(field){descending=field;return builder;},limit(value){limit=value;return builder;},
        async find(options){
          assert.equal(options.consistentRead,true,'every storage read must use the primary');
          const rows=[...records.values()].filter(row=>predicates.every(predicate=>predicate(row)));
          if(descending)rows.sort((a,b)=>b[descending]-a[descending]);
          // Capture before yielding to force real stale-reader collisions between
          // concurrent route calls, just as separate service instances can race.
          const result={items:clone(rows.slice(0,limit))};
          if(readBarrier){const barrier=readBarrier;barrier.remaining--;if(!barrier.remaining){readBarrier=null;barrier.release();}await barrier.ready;}
          await Promise.resolve();return result;
        }
      };return builder;
    },
    async insert(collection,row){
      assert.equal(collection,'SaboteurStates');operations.push({type:'insert',id:row._id});
      if(records.has(row._id))throw Error('Duplicate unique CMS item ID');
      records.set(row._id,clone(row));await Promise.resolve();
      if(row.version===lostCommitVersion){lostCommitVersion=null;throw Error('Connection dropped after successful storage commit');}
      return clone(row);
    },
    async bulkRemove(collection,ids){assert.equal(collection,'SaboteurStates');for(const id of ids)records.delete(id);return {};}
  };
  const route=routeFactory(items,{elevate:method=>method},createRoom,command,view,GameError,webcrypto);
  async function send(body,origin='https://exams.bebrighton.net'){
    const request=new Request('https://independent-service.example/api/game',{method:'POST',headers:{'Content-Type':'application/json',...(origin?{Origin:origin}:{})},body:typeof body==='string'?body:JSON.stringify({code:'654321',...body})});
    const response=await route.POST({request});return {status:response.status,headers:response.headers,data:await response.json()};
  }
  const latest=()=>JSON.parse([...records.values()].sort((a,b)=>b.version-a.version)[0].state);
  return {records,operations,route,send,latest,dropAfterCommit(version){lostCommitVersion=version;},raceReads(count){let release;const ready=new Promise(resolve=>release=resolve);readBarrier={remaining:count,ready,release};}};
}
async function room(count=3){
  const service=setup();const created=await service.send({type:'create',token:token(1),name:'Transport host',mode:'classroom'});assert.equal(created.status,200);
  service.raceReads(count);
  const joins=await Promise.all(Array.from({length:count},(_,i)=>service.send({type:'join',token:token(i+2),name:`Transport ${i}`,requestId:`join-seat-${i}`})));
  assert.ok(joins.every(r=>r.status===200));
  return service;
}
async function game(count=3){const service=await room(count);const response=await service.send({type:'start',token:token(1),requestId:'start-game',firstPlayerId:service.latest().players.find(p=>p.name==='Transport 0').id,expectedVersion:count});assert.equal(response.status,200);return service;}

test('creation carries Blitz rules to storage and reconnection without changing standard defaults',async()=>{
  const service=setup();
  const created=await service.send({type:'create',token:token(1),name:'Blitz host',mode:'classroom',variant:'blitz'});
  assert.equal(created.status,200);assert.equal(created.data.variant,'blitz');assert.equal(service.latest().variant,'blitz');
  const reconnected=await service.send({type:'state',token:token(1)});
  assert.equal(reconnected.data.totalRounds,1);assert.equal(reconnected.data.host,true);
  const publicView=await service.send({type:'state',screen:true});assert.equal(publicView.data.variant,'blitz');assert.equal(publicView.data.me,null);
  const standard=await setup().send({type:'create',token:token(1),name:'Standard host'});
  assert.equal(standard.data.variant,'standard');assert.equal(standard.data.totalRounds,3);
  assert.equal((await setup().send({type:'create',token:token(1),name:'Invalid',variant:'other'})).status,400);
});
test('eight simultaneous joins survive atomic snapshot collisions without lost seats or private-key leaks',async()=>{
  const service=await room(8),state=service.latest();assert.equal(state.players.length,8);assert.equal(state.version,8);
  assert.equal(new Set(state.players.map(p=>p.key)).size,8);assert.equal(new Set(state.players.map(p=>p.id)).size,8);
  assert.ok(service.operations.length>9,'the test forced competing inserts, not serial joins');
  const publicResponse=await service.send({type:'state',screen:true});assert.equal(publicResponse.status,200);assert.equal(publicResponse.data.players.length,8);
  assert.equal(publicResponse.data.host,false);assert.equal(publicResponse.data.me,null);assert.ok(!JSON.stringify(publicResponse.data).includes(token(1)));
});
test('two conflicting confirmed turn commands commit exactly one action and reject the stale one',async()=>{
  const service=await game(),before=service.latest(),actor=before.players.find(p=>p.id===before.turnId);
  const actorToken=token(Number(actor.name.split(' ')[1])+2);
  const results=await Promise.all(actor.hand.slice(0,2).map((card,i)=>service.send({type:'discard',token:actorToken,cardId:card.id,requestId:`competing-discard-${i}`,expectedVersion:before.version})));
  assert.deepEqual(results.map(r=>r.status).sort(),[200,409]);const after=service.latest();
  assert.equal(after.version,before.version+1);assert.equal(after.deck.length,before.deck.length-1);assert.equal(after.discard.length,1);assert.notEqual(after.turnId,before.turnId);
});
test('simultaneous retries with the same command ID return one committed outcome',async()=>{
  const service=await game(),before=service.latest(),actor=before.players.find(p=>p.id===before.turnId);
  const body={type:'discard',token:token(2),cardId:actor.hand[0].id,requestId:'same-network-command',expectedVersion:before.version};
  const results=await Promise.all([service.send(body),service.send(body)]);assert.ok(results.every(r=>r.status===200));
  assert.ok(results.every(r=>r.data.version===before.version+1));assert.equal(service.latest().discard.length,1);
  const late=await service.send(body);assert.equal(late.status,200);assert.equal(late.data.version,before.version+1);
});
test('a storage timeout after commit is recovered through the actor-bound receipt without double draw',async()=>{
  const service=await game(),before=service.latest(),actor=before.players.find(p=>p.id===before.turnId);
  service.dropAfterCommit(before.version+1);
  const response=await service.send({type:'discard',token:token(2),cardId:actor.hand[0].id,requestId:'uncertain-storage-commit',expectedVersion:before.version});
  assert.equal(response.status,200);const after=service.latest();assert.equal(after.version,before.version+1);assert.equal(after.discard.length,1);assert.equal(after.deck.length,before.deck.length-1);
});
test('presenter requests discard every supplied capability and mutations through the presenter are refused',async()=>{
  const service=await game();
  const presenter=await service.send({type:'state',screen:true,token:token(2)});assert.equal(presenter.status,200);assert.equal(presenter.data.me,null);assert.equal(presenter.data.host,false);
  assert.ok(presenter.data.players.every(p=>!('role'in p)&&!('goldTotal'in p)));
  assert.ok(presenter.data.board.filter(c=>c.kind==='goal').every(c=>!('gold'in c)&&!('groups'in c)));
  const denied=await service.send({type:'discard',screen:true,token:token(2),requestId:'screen-action',expectedVersion:service.latest().version});assert.equal(denied.status,403);
  const normal=await service.send({type:'state',token:token(2)});assert.ok(normal.data.me.hand.length);assert.ok(normal.data.me.role);
});
test('creation retries preserve the host room while a different capability cannot overwrite it',async()=>{
  const service=await room(),before=service.latest();
  const retry=await service.send({type:'create',token:token(1),name:'Changed retry name',mode:'online'});assert.equal(retry.status,200);assert.equal(retry.data.version,before.version);assert.equal(retry.data.hostName,'Transport host');assert.equal(retry.data.mode,'classroom');
  const attacker=await service.send({type:'create',token:token(99),name:'Other host'});assert.equal(attacker.status,409);assert.deepEqual(service.latest(),before);
});
test('transport rejects malformed/oversized requests, unknown origins and missing player capabilities',async()=>{
  const service=setup();
  assert.equal((await service.send('not JSON')).status,400);
  assert.equal((await service.send({type:'create',name:'Host',token:token(1),extra:'x'.repeat(8300)})).status,413);
  assert.equal((await service.send({type:'create',name:'Host',token:token(1)},'https://unrelated.example')).status,403);
  assert.equal((await service.send({type:'create',name:'Host'})).status,401);
  assert.equal((await service.send({type:'create',name:'Host',token:token(1),code:'12345x'})).status,400);
  const successful=await service.send({type:'create',name:'Host',token:token(1)});assert.equal(successful.status,200);
  assert.equal(successful.headers.get('Cache-Control'),'no-store');assert.equal(successful.headers.get('Access-Control-Allow-Origin'),'https://exams.bebrighton.net');assert.equal(successful.headers.get('X-Content-Type-Options'),'nosniff');
  const missing=await service.send({type:'state',screen:true,code:'000000'});assert.equal(missing.status,404);
});
