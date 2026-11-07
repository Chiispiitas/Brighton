import test from 'node:test';
import assert from 'node:assert/strict';
import {createRoom, command, view} from '../server/engine.mjs';
import {classroomHtml} from '../classroom.mjs';
let sequence=0;
const act=(s,key,cmd)=>command(s,key,{requestId:`classroom-${++sequence}`,phaseId:s.phaseId,...cmd},()=>.2);
function room(n=8){
  let s=createRoom('123456','host','Teacher',Date.now(),'classroom');
  for(let i=0;i<n;i++)s=act(s,`key-${i}`,{type:'join',name:`Player ${i}`});
  s=act(s,'host',{type:'start'});
  for(const p of s.players)s=act(s,p.key,{type:'ready'});
  return s;
}
const rolePlayer=(s,role)=>s.players.find(p=>p.role===role);
test('mode defaults to online for new and legacy rooms; invalid modes are rejected',()=>{
  assert.equal(createRoom('123456','h','Host').mode,'online');
  const s=createRoom('123456','h','Host');delete s.mode;
  assert.equal(view(s,'h').mode,'online');
  assert.throws(()=>createRoom('123456','h','Host',Date.now(),'other'),/Online or Classroom/);
});
test('classroom host cannot join the roster or use a forged join request',()=>{
  const s=createRoom('123456','host','Teacher',Date.now(),'classroom');
  assert.throws(()=>act(s,'host',{type:'join',name:'Teacher'}),/moderator/);
});
test('night starts asleep; only the moderator wakes it and early or stale actions are rejected',()=>{
  const s=act(room(),'host',{type:'advance'}),fortune=rolePlayer(s,'fortune');
  assert.equal(s.phase,'fortune');assert.equal(s.awake,false);
  assert.equal(view(s,fortune.key).phase,'sleep');assert.equal(view(s,fortune.key).me.canAct,false);
  assert.throws(()=>act(s,fortune.key,{type:'action',target:s.players[0].id}),/moderator wakes/);
  assert.throws(()=>act(s,fortune.key,{type:'wake'}),/Only the moderator/);
  assert.throws(()=>act(s,'host',{type:'advance',force:true}),/Wake the role/);
  assert.throws(()=>act(s,'host',{type:'wake',phaseId:s.phaseId-1}),/already ended/);
  const awake=act(s,'host',{type:'wake'});
  assert.equal(view(awake,fortune.key).me.canAct,true);
  assert.throws(()=>act(awake,'host',{type:'wake'}),/already awake/);
});
test('screen projection strips host capability even when supplied a host or player key',()=>{
  let s=act(room(),'host',{type:'advance'});s=act(s,'host',{type:'wake'});
  s.notes[s.players[0].id]=[{day:1,text:'PRIVATE NOTE'}];
  for(const key of ['host',...s.players.map(p=>p.key)]){
    const v=view(s,key,true),text=JSON.stringify(v);
    assert.equal(v.host,false);assert.equal(v.me,null);assert.equal(v.moderatorPlayers,undefined);
    assert.equal(v.packChoices,undefined);assert.equal(v.packDecision,undefined);
    assert.ok(v.players.every(p=>!p.role&&!p.pack));assert.ok(!text.includes('PRIVATE NOTE'));
  }
  assert.equal(view(s,'host').moderatorPlayers.length,8);
  assert.equal(view(s,s.players[0].key).moderatorPlayers,undefined);
});
test('classroom pack needs unanimity; players cannot advance an agreed choice',()=>{
  let s=act(room(),'host',{type:'advance'});s=act(s,'host',{type:'wake'});
  s=act(s,rolePlayer(s,'fortune').key,{type:'action'});s=act(s,'host',{type:'advance'});
  assert.equal(s.phase,'werewolf');assert.equal(s.awake,false);
  s=act(s,'host',{type:'wake'});
  const wolves=s.players.filter(p=>p.role==='werewolf'),targets=s.players.filter(p=>p.role!=='werewolf');
  s=act(s,wolves[0].key,{type:'action',target:targets[0].id});
  s=act(s,wolves[1].key,{type:'action',target:targets[1].id});
  assert.throws(()=>act(s,'host',{type:'advance',force:true}),/Impossible to continue/);
  assert.equal(view(s,wolves[0].key).packChoices[1].target,targets[1].id);
  s=act(s,wolves[1].key,{type:'action',target:targets[0].id});
  assert.throws(()=>act(s,wolves[0].key,{type:'advance'}),/Only the host/);
  s=act(s,'host',{type:'advance'});assert.equal(s.phase,'girl');assert.equal(s.awake,false);
});
test('full classroom cycle preserves wake order, private results, potions, day-one discussion and public deaths',()=>{
  let s=act(room(),'host',{type:'advance'}),order=[],victim;
  while(['fortune','werewolf','girl','witch'].includes(s.phase)){
    order.push(s.phase);assert.equal(s.awake,false);
    if(s.phase==='witch')assert.equal(view(s,rolePlayer(s,'witch').key).me.victim,null);
    s=act(s,'host',{type:'wake'});
    for(const p of s.players.filter(p=>p.role===s.phase)){
      let extra={};
      if(s.phase==='fortune')extra={target:rolePlayer(s,'werewolf').id};
      if(s.phase==='werewolf'){victim=rolePlayer(s,'villager').id;extra={target:victim};}
      if(s.phase==='girl')extra={spy:true};
      if(s.phase==='witch')assert.equal(view(s,p.key).me.victim,victim);
      s=act(s,p.key,{type:'action',...extra});
    }
    s=act(s,'host',{type:'advance'});
  }
  assert.deepEqual(order,['fortune','werewolf','girl','witch']);assert.equal(s.phase,'day');
  assert.ok(view(s,'screen',true).players.find(p=>p.id===victim).role);
  assert.ok(view(s,'screen',true).players.filter(p=>p.alive).every(p=>!p.role));
  s=act(s,'host',{type:'advance'});assert.equal(s.day,2);assert.equal(s.phase,'fortune');
});
test('hunter must be called before the final shot; rematch preserves classroom mode and moderator',()=>{
  let s=room();const hunter=rolePlayer(s,'hunter');
  s.phase='hunter';s.actions={};s.pendingHunter=hunter.id;hunter.alive=false;s.resumePhase='dusk';
  assert.equal(view(s,hunter.key).me.canAct,false);
  assert.throws(()=>act(s,hunter.key,{type:'action'}),/moderator wakes/);
  s=act(s,'host',{type:'wake'});s=act(s,hunter.key,{type:'action'});assert.equal(s.phase,'dusk');
  s.phase='finished';s.winner='village';s=act(s,'host',{type:'reset'});
  assert.equal(s.mode,'classroom');assert.equal(s.awake,false);assert.equal(s.players.length,8);
  assert.throws(()=>act(s,'host',{type:'join',name:'Teacher'}),/moderator/);
});
test('waiting for a daytime Hunter gives the presenter and Hunter the moderator cue',()=>{
  const s=room(),hunter=rolePlayer(s,'hunter');
  s.phase='hunter';s.actions={};s.pendingHunter=hunter.id;hunter.alive=false;s.resumePhase='dusk';
  const ui={escape:String,roleNames:{hunter:'Hunter'},houseArt:()=>''};
  const screen=classroomHtml(view(s,'screen',true),{...ui,projector:true});
  assert.match(screen,/Wait for the Hunter/);assert.match(screen,/moderator will call/);
  assert.ok(!screen.includes('The village sleeps'));assert.ok(!screen.includes('opens their eyes'));
  const phone=classroomHtml(view(s,hunter.key),{...ui,projector:false});
  assert.match(phone,/Wait for the moderator to call you/);
});
