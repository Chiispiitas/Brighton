import assert from 'node:assert/strict';
import test from 'node:test';
import {createRoom,command,view,publicLobby,needsTick,COLORS,MAX_PLAYERS} from '../server/engine.mjs';
import {avatarLabels,customAvatar,cycleAvatar,defaultAvatar,randomAvatar} from '../avatars.mjs';

const startAt=1_000_000;
let counter=0;
const step=(state,key,type,fields={},now=startAt)=>command(state,key,{
  type,requestId:'request-'+ ++counter,turnId:state.turnId,...fields
},now,()=>0);
function lobby(count=2,settings={}){
  let state=createRoom('123456','host','Artist',settings,startAt);
  for(let i=2;i<=count;i++)state=step(state,'k'+i,'join',{name:'Player '+i});
  return state;
}
function choosing(count=2,options={}){
  return step(lobby(count,{rounds:1,customOnly:true,choices:2,custom:'Sun, Moon',...options}),'host','start');
}
function drawing(count=2){
  return step(choosing(count),'host','choose',{index:0});
}
const stroke={kind:'stroke',color:COLORS[0],id:'stroke-one',width:7,points:[10,20,30,40]};

test('the host occupies one seat and the 37th player is rejected',()=>{
  const state=lobby(MAX_PLAYERS);
  assert.equal(state.players.length,36);
  assert.throws(()=>step(state,'extra','join',{name:'Extra'}),/full/);
  assert.equal(step(state,'host','start').queue.length,35);
  assert.throws(()=>step(state,'host','settings',{capacity:35}),/below/);
});

test('only the drawer receives choices or the answer and public projections omit secrets',()=>{
  const initial=choosing();
  assert.deepEqual(view(initial,'host').options,['Sun','Moon']);
  for(const key of ['k2','unknown'])assert.equal(view(initial,key).options,undefined);
  assert.equal(view(initial,'host',{screen:true}).options,undefined);
  assert.throws(()=>step(initial,'k2','choose',{index:0}),/artist/);
  const active=step(initial,'host','choose',{index:0});
  assert.equal(view(active,'host').answer,'Sun');
  const snapshot=view(active,'host',{screen:true,now:startAt});
  assert.equal(snapshot.answer,undefined);
  assert.equal(snapshot.settings.custom,undefined);
  assert.equal(snapshot.mask,'_ _ _');
  assert.equal(snapshot.host,false);
  assert.equal(snapshot.me,null);
  assert.equal(snapshot.reports,undefined);
});

test('drawing sync supports batched tools, idempotency, undo and delta reads',()=>{
  let state=drawing();
  assert.throws(()=>step(state,'k2','paint',{ops:[stroke]}),/artist/);
  assert.throws(()=>step(state,'host','paint',{ops:[{...stroke,points:[1001,20]}]}),/coordinates/);
  const request={type:'paint',requestId:'retry-draw',turnId:state.turnId,ops:[stroke,{...stroke,points:[30,40,50,60]}]};
  state=command(state,'host',request,startAt);
  assert.equal(command(state,'host',request,startAt),state);
  assert.equal(view(state,'k2').board.length,2);
  assert.equal(view(state,'k2',{boardVersion:state.boardVersion}).board,undefined);
  state=step(state,'host','paint',{ops:[{kind:'undo'}]});
  assert.equal(state.board.length,0);
  state=step(state,'host','paint',{ops:[{...stroke,kind:'fill',points:[50,60]}]});
  state=step(state,'host','paint',{ops:[{kind:'clear'}]});
  assert.equal(state.pointCount,0);
});

test('correct guesses are scored once and never printed as chat',()=>{
  let state=drawing(3);
  assert.throws(()=>step(state,'host','chat',{text:'Sun'}),/Chat/);
  state=step(state,'k2','guess',{text:' sún '},startAt+1000);
  const guessed=view(state,'k3');
  assert.equal(guessed.players[1].solved,true);
  assert.equal(guessed.players[0].score,50);
  assert.ok(guessed.players[1].score>100);
  assert.ok(guessed.messages.every(m=>m.text!=='Sun'));
  assert.throws(()=>step(state,'k2','guess',{text:'Sun'},startAt+2000),/already guessed/);
  state=step(state,'k3','guess',{text:'sun'},startAt+4000);
  assert.equal(state.phase,'reveal');
  assert.equal(view(state,'k3').answer,'Sun');
});

test('server clock rotates through rounds, rejects late submissions, and ends the match',()=>{
  let state=choosing(2,{rounds:2});
  for(let i=0;i<4;i++){
    assert.equal(state.round,i<2?1:2);
    assert.equal(state.drawer,i%2===0?'p1':'p2');
    assert.ok(needsTick(state,state.deadline));
    state=step(state,'clock','tick',{},state.deadline);
    assert.equal(state.phase,'draw');
    assert.throws(()=>step(state,'k2','chat',{text:state.answer},state.deadline),/ended/);
    state=step(state,'clock','tick',{},state.deadline);
    assert.equal(state.phase,'reveal');
    state=step(state,'clock','tick',{},state.deadline);
  }
  assert.equal(state.phase,'finished');
  state=step(state,'host','reset');
  assert.equal(state.phase,'lobby');
  assert.equal(state.deadline,0);
});

test('listing, moderation and reconnection use the intended visibility',()=>{
  let state=lobby(3,{listed:true});
  assert.equal(publicLobby(state).players,3);
  assert.equal(publicLobby(lobby()),null);
  assert.equal(step(state,'k2','join',{name:'Reconnect'}),state);
  state=step(state,'k2','report',{target:'p3',reason:'Spam'});
  assert.equal(view(state,'host').reports.length,1);
  assert.equal(view(state,'k3').reports,undefined);
  assert.throws(()=>step(state,'k3','ban',{target:'p2'}),/host/);
  state=step(state,'host','ban',{target:'p3'});
  assert.throws(()=>step(state,'k3','join',{name:'Return'}),/banned/);
  assert.equal(publicLobby(step(state,'host','start')).inProgress,true);
});


test('players join during a drawing, guess immediately, and draw later in the same round',()=>{
  let state=drawing();
  state=step(state,'late','join',{name:'Late player'},startAt+1000);
  assert.equal(state.queue.at(-1),view(state,'late').me);
  assert.equal(view(state,'late').answer,undefined);
  state=step(state,'late','guess',{text:'Sun'},startAt+2000);
  assert.ok(view(state,'late').players.at(-1).score>0);
  assert.equal(step(state,'late','join',{name:'Late player'}),state);
});

test('a room emptied by its host cannot be reopened by a join link',()=>{
  const state=step(lobby(1,{listed:true}),'host','leave');
  assert.equal(publicLobby(state),null);
  assert.throws(()=>step(state,'late','join',{name:'Late player'}),/closed/);
});

test('avatar options cycle independently, and custom and legacy portraits reach every player',()=>{
  const hostAvatar=cycleAvatar(defaultAvatar,0,-1);
  const guestAvatar=cycleAvatar(defaultAvatar,2,1);
  assert.deepEqual(avatarLabels(hostAvatar),['Fern','Dots','Smile']);
  assert.deepEqual(avatarLabels(guestAvatar),['Lilac','Dots','Grin']);
  assert.equal(cycleAvatar(hostAvatar,0,1),defaultAvatar);
  const random=randomAvatar(hostAvatar);
  assert.ok(customAvatar(random));
  assert.notEqual(random,hostAvatar);
  let state=createRoom('123456','host','Artist',{avatar:hostAvatar},startAt);
  state=step(state,'custom','join',{name:'Custom',avatar:guestAvatar});
  state=step(state,'legacy','join',{name:'Legacy',avatar:3});
  state=step(state,'invalid','join',{name:'Invalid',avatar:'1000'});
  const expected=[hostAvatar,guestAvatar,3,0];
  assert.deepEqual(view(state,'legacy').players.map(player=>player.avatar),expected);
  assert.deepEqual(view(state,'presenter',{screen:true}).players.map(player=>player.avatar),expected);
});
