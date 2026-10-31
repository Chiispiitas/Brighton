import test from 'node:test';
import assert from 'node:assert/strict';
import { createRoom, command, view, progress, packDecision, MIN_PLAYERS, MAX_PLAYERS } from '../server/engine.mjs';
let sequence = 0;
const doIt = (s, key, data, rng = () => .2) => command(s, key, { requestId: `request-${++sequence}`, phaseId: s.phaseId, ...data }, rng);
function lobby(n = 8) {
  let s = createRoom('123456', 'host-key', 'Teacher');
  for (let i = 0; i < n; i++) s = doIt(s, `key-${i}`, { type: 'join', name: `Player ${i}` });
  return s;
}
function started() { return doIt(lobby(), 'host-key', { type: 'start' }); }
function night() {
  let s = started();
  for (const p of s.players) s = doIt(s, p.key, { type: 'ready' });
  return doIt(s, 'host-key', { type: 'advance' });
}
function asPhase(phase, roles = ['werewolf','werewolf','fortune','girl','witch','hunter','villager','villager']) {
  const s = started(); s.phase = phase; s.day = 2; s.players.forEach((p,i)=>p.role=roles[i]);
  s.night = { victim:null, poison:null, heal:false }; return s;
}
test('room projection never leaks role maps, capability hashes, votes, or other players’ notes',()=>{
  const s=asPhase('fortune'); s.notes[s.players[2].id]=[{day:1,text:'Secret'}];
  for(const key of ['unknown',s.host,s.players[6].key]){
    const v=view(s,key),text=JSON.stringify(v);
    assert.ok(!text.includes('host-key')); assert.ok(!text.includes('key-'));
    assert.ok(!text.includes('Secret')); assert.ok(v.players.every(p=>!p.role));
    assert.equal(v.players.filter(p=>p.pack).length,0);
  }
});
test('only werewolves see their pack; finished game reveals all roles',()=>{
  const s=asPhase('day'); assert.equal(view(s,s.players[0].key).players.filter(p=>p.pack).length,2);
  s.phase='finished'; assert.equal(view(s,'unknown').players.filter(p=>p.role).length,8);
});
test('joining is capped, case-insensitive names are unique, unsafe names rejected',()=>{
  const s=lobby(); assert.throws(()=>doIt(s,'other',{type:'join',name:'PLAYER 0'}),/taken/);
  assert.throws(()=>doIt(s,'other',{type:'join',name:'<script>'}),/angle/);
  assert.throws(()=>doIt(lobby(12),'other',{type:'join',name:'Extra'}),/full \(12 players\)/);
});
test('only host starts or advances; a valid deck fills every player slot',()=>{
  assert.throws(()=>doIt(lobby(),'key-1',{type:'start'}),/host/);
  assert.throws(()=>doIt(lobby(3),'host-key',{type:'start'}),/4 players/);
  const s=started(); assert.equal(s.players.filter(p=>p.role==='werewolf').length,2);
  for(const role of ['fortune','girl','witch','hunter'])assert.equal(s.players.filter(p=>p.role===role).length,1);
});

test('four to twelve players start with a valid automatic deck and an ordinary villager',()=>{
  assert.equal(MIN_PLAYERS,4);assert.equal(MAX_PLAYERS,12);
  const expectedSpecials={4:['fortune','witch'],5:['fortune','witch','girl'],6:['fortune','witch','girl','hunter'],12:['fortune','witch','girl','hunter']};
  for(const n of [4,5,6,12]){
    const s=doIt(lobby(n),'host-key',{type:'start'}),wolves=s.players.filter(p=>p.role==='werewolf').length;
    assert.equal(s.phase,'reveal');assert.equal(s.players.length,n);
    assert.equal(wolves,Math.max(1,Math.floor(n/4)));
    assert.ok(s.players.some(p=>p.role==='villager'));
    assert.ok(wolves<n-wolves,'The pack must not begin at parity.');
    assert.deepEqual(s.players.map(p=>p.role).filter(r=>!['villager','werewolf'].includes(r)).sort(),expectedSpecials[n].slice().sort());
    assert.ok(s.players.every(p=>p.alive));assert.equal(s.winner,null);
  }
});

test('disabled special roles free room for the next enabled role in a small game',()=>{
  let s=lobby(4);s=doIt(s,'host-key',{type:'settings',settings:{wolves:0,fortune:false}});
  s=doIt(s,'host-key',{type:'start'});
  assert.deepEqual(s.players.map(p=>p.role).sort(),['werewolf','witch','girl','villager'].sort());
});

test('the thirteenth player is rejected and an oversized legacy lobby cannot start',()=>{
  const full=lobby(12);
  assert.throws(()=>doIt(full,'extra-key',{type:'join',name:'Thirteenth'}),/full \(12 players\)/);
  const legacy=structuredClone(full);legacy.players.push({id:'legacy-extra',key:'extra-key',name:'Thirteenth',alive:true,role:null});
  assert.throws(()=>doIt(legacy,'host-key',{type:'start'}),/no more than 12 players/);
});

test('custom wolf counts that would begin at parity are rejected',()=>{
  for(const [n,wolves] of [[4,2],[5,3],[6,3],[12,6]]){
    let s=lobby(n);s=doIt(s,'host-key',{type:'settings',settings:{wolves}});
    assert.throws(()=>doIt(s,'host-key',{type:'start'}),/Reduce the werewolves/);
  }
});
test('ready acknowledgements required unless host explicitly passes missing actions',()=>{
  const s=started(); assert.throws(()=>doIt(s,'host-key',{type:'advance'}),/not acted/);
  assert.equal(doIt(s,'host-key',{type:'advance',force:true}).phase,'fortune');
  assert.equal(progress(s).done,0);
});
test('night order and first-day no-vote rule',()=>{
  let s=night(); const order=[];
  while(s.phase!=='day') {
    order.push(s.phase);
    if(s.phase==='werewolf')for(const p of s.players.filter(p=>p.role==='werewolf'))s=doIt(s,p.key,{type:'action',target:s.players.find(p=>p.role==='villager').id});
    s=doIt(s,'host-key',{type:'advance',force:true});
  }
  assert.deepEqual(order,['fortune','werewolf','girl','witch']);assert.equal(s.day,1);
  s=doIt(s,'host-key',{type:'advance'});assert.equal(s.phase,'fortune');assert.equal(s.day,2);
});
test('missing roles are skipped without blocking the host',()=>{
  let s=lobby();s=doIt(s,'host-key',{type:'settings',settings:{wolves:1,fortune:false,girl:false,witch:false,hunter:false}});
  s=doIt(s,'host-key',{type:'start'});s=doIt(s,'host-key',{type:'advance',force:true});assert.equal(s.phase,'werewolf');
  s=doIt(s,s.players.find(p=>p.role==='werewolf').key,{type:'action',target:s.players.find(p=>p.role==='villager').id});
  s=doIt(s,'host-key',{type:'advance',force:true});assert.equal(s.phase,'day');
});
test('fortune teller learns exact role privately; replay is idempotent',()=>{
  let s=asPhase('fortune'),p=s.players[2];const c={type:'action',target:s.players[0].id,phaseId:s.phaseId,requestId:'same-request'};
  s=command(s,p.key,c); const again=command(s,p.key,c);
  assert.equal(again.version,s.version);assert.equal(again.notes[p.id].length,1);
  assert.match(view(s,p.key).me.notes[0].text,/werewolf/);
  assert.equal(view(s,s.players[0].key).me.notes.length,0);
});
test('wrong-role actions and stale phase actions are rejected',()=>{
  const s=asPhase('fortune');assert.throws(()=>doIt(s,s.players[0].key,{type:'action',target:s.players[1].id}),/not your turn/);
  assert.throws(()=>doIt(s,s.players[2].key,{type:'action',phaseId:-1}),/phase has ended/);
  assert.throws(()=>doIt(s,'intruder',{type:'advance'}),/host/);
});
test('wolves cannot kill packmates and one victim is selected across a pack',()=>{
  let s=asPhase('werewolf');assert.throws(()=>doIt(s,s.players[0].key,{type:'action',target:s.players[1].id}),/another living/);
  const target=s.players[7].id;
  for(const p of s.players.filter(p=>p.role==='werewolf'))s=doIt(s,p.key,{type:'action',target});
  s=doIt(s,'host-key',{type:'advance'});assert.equal(s.night.victim,target);assert.equal(s.phase,'girl');
});
test('disagreement blocks the host and both wolves, even with a force override',()=>{
  let s=asPhase('werewolf');s=doIt(s,s.players[0].key,{type:'action',target:s.players[6].id});s=doIt(s,s.players[1].key,{type:'action',target:s.players[7].id});
  assert.equal(progress(s).done,2);assert.equal(packDecision(s).agreed,false);
  for(const key of ['host-key',s.players[0].key,s.players[1].key])for(const force of [false,true])assert.throws(()=>doIt(s,key,{type:'advance',force}),/Impossible to continue because the decision has not been made/);
  assert.equal(s.phase,'werewolf');assert.equal(s.night.victim,null);
});
test('every living wolf must choose: a missing choice and a two-to-one majority are insufficient',()=>{
  let s=asPhase('werewolf',['werewolf','werewolf','werewolf','girl','witch','hunter','villager','villager']);
  for(const p of s.players.slice(0,2))s=doIt(s,p.key,{type:'action',target:s.players[6].id});
  assert.throws(()=>doIt(s,'host-key',{type:'advance',force:true}),/Impossible/);
  s=doIt(s,s.players[2].key,{type:'action',target:s.players[7].id});
  assert.throws(()=>doIt(s,s.players[0].key,{type:'advance'}),/Impossible/);
  s=doIt(s,s.players[2].key,{type:'action',target:s.players[6].id});
  assert.equal(packDecision(s).agreed,true);
  s=doIt(s,s.players[0].key,{type:'advance'});assert.equal(s.phase,'girl');assert.equal(s.night.victim,s.players[6].id);
});
test('shared highlights are visible only to living wolves, and can be revised before advancing',()=>{
  let s=asPhase('werewolf');s=doIt(s,s.players[0].key,{type:'action',target:s.players[6].id});
  const other=view(s,s.players[1].key);
  assert.equal(other.packChoices.find(c=>c.wolfId===s.players[0].id).target,s.players[6].id);
  for(const key of ['unknown',s.host,s.players[6].key])assert.equal(view(s,key).packChoices,undefined);
  assert.equal(view(s,s.host).packDecision.agreed,false);
  s=doIt(s,s.players[0].key,{type:'action',target:s.players[7].id});
  assert.equal(view(s,s.players[0].key).me.target,s.players[7].id);
  assert.equal(view(s,s.players[1].key).packChoices[0].target,s.players[7].id);
  s.players[1].alive=false;assert.equal(view(s,s.players[1].key).packChoices,undefined);
  assert.equal(packDecision(s).agreed,true);
  assert.throws(()=>doIt(s,s.players[1].key,{type:'advance'}),/host/);
});
test('agreement is checked again when continuing, so a changed highlight revokes it',()=>{
  let s=asPhase('werewolf');for(const p of s.players.slice(0,2))s=doIt(s,p.key,{type:'action',target:s.players[6].id});
  assert.equal(packDecision(s).agreed,true);
  s=doIt(s,s.players[0].key,{type:'action',target:s.players[7].id});
  assert.throws(()=>doIt(s,'host-key',{type:'advance'}),/Impossible/);
  assert.throws(()=>doIt(s,s.players[6].key,{type:'advance'}),/host/);
});
test('all viewers see killed and voted-out roles immediately, while living roles remain private',()=>{
  let s=asPhase('witch');s.night.victim=s.players[6].id;
  s=doIt(s,s.players[4].key,{type:'action',poison:s.players[0].id});
  s=doIt(s,'host-key',{type:'advance'});
  for(const key of ['unknown',s.host,s.players[7].key]){
    const v=view(s,key);assert.equal(v.players[6].role,'villager');assert.equal(v.players[0].role,'werewolf');
    assert.ok(v.players.filter(p=>p.alive).every(p=>!p.role));
  }
  s=asPhase('vote');s=doIt(s,s.players[6].key,{type:'vote',target:s.players[0].id});
  s=doIt(s,'host-key',{type:'advance',force:true});assert.equal(view(s,'unknown').players[0].role,'werewolf');
});
test('hunter role is public before the final shot, and the final-shot victim is also revealed',()=>{
  let s=asPhase('witch');s.night.victim=s.players[5].id;
  s=doIt(s,'host-key',{type:'advance',force:true});assert.equal(s.phase,'hunter');
  assert.equal(view(s,'unknown').players[5].role,'hunter');
  s=doIt(s,s.players[5].key,{type:'action',target:s.players[0].id});
  assert.equal(view(s,'unknown').players[0].role,'werewolf');
});
test('coin heads reveals one wolf to girl only; tails notifies exactly that wolf',()=>{
  for(const tails of [false,true]){
    let s=asPhase('girl');const girl=s.players[3];let calls=0;
    s=doIt(s,girl.key,{type:'action',spy:true},()=>++calls===1?.1:tails?.8:.1);
    assert.match(s.notes[girl.id][0].text,/werewolf/);
    assert.equal(s.players.filter(p=>p.role==='werewolf'&&s.notes[p.id]?.length).length,tails?1:0);
    assert.equal(s.notes[s.players[1].id],undefined);
  }
});
test('witch has one heal and one poison, can self-save and use both',()=>{
  let s=asPhase('witch'),witch=s.players[4];s.night.victim=witch.id;
  const wolf=s.players[0];s=doIt(s,witch.key,{type:'action',heal:true,poison:wolf.id});
  assert.deepEqual(s.potions,{heal:false,poison:false});s=doIt(s,'host-key',{type:'advance'});
  assert.ok(s.players.find(p=>p.id===witch.id).alive);assert.ok(!s.players.find(p=>p.id===wolf.id).alive);
  s.phase='witch';s.actions={};s.phaseId++;s.night={victim:s.players[6].id,poison:null,heal:false};
  assert.throws(()=>doIt(s,witch.key,{type:'action',heal:true}),/unavailable/);
  assert.throws(()=>doIt(s,witch.key,{type:'action',poison:s.players[6].id}),/already been used/);
});
test('a healed victim still dies if also poisoned',()=>{
  let s=asPhase('witch');const id=s.players[6].id;s.night.victim=id;
  s=doIt(s,s.players[4].key,{type:'action',heal:true,poison:id});s=doIt(s,'host-key',{type:'advance'});
  assert.equal(s.players.find(p=>p.id===id).alive,false);
});
test('votes start on day two; ties eliminate nobody; eliminated voters rejected',()=>{
  let s=asPhase('day');s=doIt(s,'host-key',{type:'advance'});assert.equal(s.phase,'vote');
  s=doIt(s,s.players[0].key,{type:'vote',target:s.players[6].id});s=doIt(s,s.players[1].key,{type:'vote',target:s.players[7].id});
  s=doIt(s,'host-key',{type:'advance',force:true});assert.equal(s.phase,'dusk');assert.equal(s.players.filter(p=>p.alive).length,8);
  s.phase='vote';s.players[6].alive=false;assert.throws(()=>doIt(s,s.players[6].key,{type:'vote'}),/not available/);
});
test('hunter’s final shot can reverse wolf parity before a winner is declared',()=>{
  let s=asPhase('witch',['werewolf','villager','fortune','girl','witch','hunter','villager','villager']);
  s.players.forEach((p,i)=>p.alive=[0,5,6].includes(i));s.night.victim=s.players[5].id;
  s=doIt(s,'host-key',{type:'advance',force:true});assert.equal(s.phase,'hunter');assert.equal(s.winner,null);
  s=doIt(s,s.players[5].key,{type:'action',target:s.players[0].id});assert.equal(s.phase,'finished');assert.equal(s.winner,'village');
});
test('hunter may pass; wolves win at parity; no-wolf village wins after voting',()=>{
  let s=asPhase('witch',['werewolf','villager','fortune','girl','witch','hunter','villager','villager']);
  s.players.forEach((p,i)=>p.alive=[0,5,6].includes(i));s.night.victim=s.players[5].id;
  s=doIt(s,'host-key',{type:'advance',force:true});s=doIt(s,s.players[5].key,{type:'action'});assert.equal(s.winner,'werewolves');
  s=asPhase('vote',['werewolf','villager','fortune','girl','witch','hunter','villager','villager']);
  s=doIt(s,s.players[6].key,{type:'vote',target:s.players[0].id});s=doIt(s,'host-key',{type:'advance',force:true});assert.equal(s.winner,'village');
});
test('rematch wipes secrets and resets potions; host identity persists',()=>{
  let s=asPhase('finished');s.notes={x:[{text:'Secret'}]};s.potions.heal=false;
  s=doIt(s,'host-key',{type:'reset'});assert.equal(s.phase,'lobby');assert.ok(s.players.every(p=>p.alive&&p.role===null));assert.deepEqual(s.notes,{});assert.equal(s.potions.heal,true);assert.equal(view(s,'host-key').host,true);
});
