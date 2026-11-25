import { API_URL } from './config.js';
import { createBoard } from './board.mjs?v=4';
import { avatarImage, avatarLabels, customAvatar, cycleAvatar, defaultAvatar, randomAvatar, sampleAvatars } from './avatars.mjs?v=5';
import { drawGameArt } from './ink-art.mjs?v=4';
import { createInkView } from './pixel-ink.mjs?v=2';
const $=selector=>document.querySelector(selector);
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const colors=['#182630','#ffffff','#e95042','#f0942e','#f4cb4c','#3cac72','#21aebb','#5084ef','#7958ce','#ed75aa','#875538','#a9a7a0'];
const colorNames=['Ink','White','Coral','Orange','Gold','Green','Teal','Blue','Purple','Pink','Brown','Gray'];
const query=new URLSearchParams(location.search);
let screen=query.get('screen')==='1';
const initialCode=query.get('room')||'';
let room=null,state=null,avatar=defaultAvatar,clockOffset=0,pollTimer,toastTimer,pollGeneration=0;
let ink=[],sendingInk=false,inkTurn=0,ready=false,settingsKey='',lastMessageId=0,playersKey='';
const muted=new Set(), key='brighton-draw-guess';
const avatarKey=key+'-avatar';
const tokens=new Map();
const canvas=$('#canvas'), dialog=$('#dialog');
const canDraw=()=>!screen&&state?.phase==='draw'&&state.me===state.drawer&&!!state.me;
const board=createBoard(canvas,queueInk,canDraw,createInkView(canvas,$('#canvas-ink'),colors));
const roomLink=present=>new URL('?room='+room.code+(present?'&screen=1':''),location.href).href;
function stored(){try{return JSON.parse(localStorage.getItem(key));}catch{return null;}}
function notice(message){$('#toast').textContent=message;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').textContent='',3600);}
function newToken(){return [...crypto.getRandomValues(new Uint8Array(32))].map(n=>n.toString(16).padStart(2,'0')).join('');}
function showDialog(html){
  dialog.innerHTML=html+'<form method="dialog" class="entry-actions"><button>Close</button></form>';
  if(!dialog.open)dialog.showModal();
}
const soundButton=$('#sound');
let audioContext=null;
let soundOn=true;
let soundLoading=null;
const cueNames=['turn','correct','reveal'];
const soundBuffers=new Map();
function unlockSound(event){
  if(soundButton.contains(event.target))return;
  enableSound();
}
async function enableSound(){
  if(!soundOn||soundLoading)return;
  try{
    audioContext ||= new AudioContext();
    soundLoading=(async()=>{
      await audioContext.resume();
      await Promise.all(cueNames.filter(name=>!soundBuffers.has(name)).map(async name=>{
        const response=await fetch('assets/audio/'+name+'.mp3');
        if(!response.ok)throw new Error('Audio unavailable');
        soundBuffers.set(name,await audioContext.decodeAudioData(await response.arrayBuffer()));
      }));
    })();
    await soundLoading;
    playSound('turn');
    document.removeEventListener('click',unlockSound);
    document.removeEventListener('keydown',unlockSound);
  }catch{
    notice('Game sound could not load.');
  }finally{
    soundLoading=null;
  }
}
function switchSound(){
  soundOn=!soundOn;
  soundButton.setAttribute('aria-pressed',String(soundOn));
  soundButton.textContent=soundOn?'Sound on':'Sound off';
  if(soundOn)enableSound();
}
document.addEventListener('click',unlockSound);
document.addEventListener('keydown',unlockSound);
function playSound(name){
  const buffer=soundBuffers.get(name);
  if(!soundOn||!buffer||audioContext?.state!=='running')return;
  const source=audioContext.createBufferSource();
  const volume=audioContext.createGain();
  source.buffer=buffer;
  volume.gain.value=.38;
  source.connect(volume).connect(audioContext.destination);
  source.start();
}
soundButton.onclick=switchSound;
$('#help').onclick=()=>{
  showDialog('<h2>How to play</h2><ol><li>Join a room or invite your group. You can join a game in progress.</li><li>When it’s your turn, choose a word and draw it.</li><li>Everyone else types guesses. Faster correct guesses earn more points. Artists gain 50 points per correct guess.</li><li>After everyone has drawn in each round, the highest score wins.</li></ol><p>While drawing, press B for brush, E for eraser, F for fill, or Ctrl+Z to undo.</p><label><input id="pressure-toggle" type="checkbox"> Use pen pressure for brush size</label>');
  $('#pressure-toggle').checked=board.settings.pressure;
};
dialog.addEventListener('change',event=>{
  if(event.target.id==='pressure-toggle')board.settings.pressure=event.target.checked;
});
const avatarPreview=$('#avatar-preview');
const avatarValues=[...document.querySelectorAll('.avatar-value')];
function renderAvatar(){
  const labels=avatarLabels(avatar);
  avatarPreview.innerHTML=avatarImage(avatar);
  avatarValues.forEach((value,index)=>value.textContent=labels[index]);
  $('#avatar-status').textContent=labels.join(', ');
}
try{
  const saved=Number(localStorage.getItem(avatarKey));
  if(customAvatar(saved))avatar=saved;
}catch{}
$('#avatar-editor').onclick=event=>{
  const button=event.target.closest('button');
  if(!button)return;
  avatar=button.id==='avatar-random'
    ?randomAvatar(avatar)
    :cycleAvatar(avatar,Number(button.closest('[data-feature]').dataset.feature),Number(button.dataset.direction));
  try{localStorage.setItem(avatarKey,String(avatar));}catch{}
  renderAvatar();
};
$('.welcome-avatars').innerHTML=sampleAvatars.map(avatarImage).join('');
drawGameArt();
renderAvatar();
$('#code').value=/^\d{6}$/.test(initialCode)?initialCode:'';
$('#resume').hidden=!stored()?.token;
async function api(type,fields={},target=room,id=crypto.randomUUID()){
  const response=await fetch(API_URL,{method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({type,code:target?.code,token:target?.token,screen:target?.screen===true,requestId:id,...fields}),
    signal:AbortSignal.timeout(18000),cache:'no-store'});
  const data=await response.json();
  if(!response.ok){const error=new Error(data.error||'Room connection failed.');error.status=response.status;throw error;}
  return data;
}
function configure(next,data){
  room=next;state=null;ink=[];ready=false;settingsKey='';lastMessageId=0;inkTurn=0;playersKey='';
  muted.clear();board.clearPreview();
  document.body.classList.toggle('presenter',next.screen===true);
  history.replaceState(null,'',roomLink(next.screen===true));
  if(!next.screen)try{localStorage.setItem(key,JSON.stringify(next));}catch{}
  $('#entry').hidden=true;$('#game').hidden=false;
  $('#invite').hidden=next.screen===true;
  $('#present').href=roomLink(true);
  pollGeneration++;
  adopt(data);
  ready=true;
  schedulePoll(pollGeneration);
}
async function connect(type,next,fields={}){
  if(ready||$('#entry').inert)return;
  $('#entry-status').textContent='Connecting…';
  $('#entry').inert=true;
  try{
    const data=await api(type,fields,next);
    if(!next.screen&&!data.me)throw new Error('This device is no longer in the room.');
    $('#entry-status').textContent='';
    configure(next,data);
  }catch(error){$('#entry-status').textContent=error.message;}
  finally{$('#entry').inert=false;}
}
function nickname(){const input=$('#nickname');if(!input.reportValidity())return '';return input.value.trim();}
function join(code){
  const name=nickname();if(!name)return;
  if(!/^\d{6}$/.test(code)){$('#entry-status').textContent='Enter a six-digit room code.';return;}
  const previous=stored();
  const token=previous?.code===code?previous.token:(tokens.get(code)||newToken());
  tokens.set(code,token);
  const next={code,token,screen:false};
  connect(previous?.code===code?'state':'join',next,{name,avatar});
}
function create(){
  const name=nickname();if(!name)return;
  const code=String(100000+crypto.getRandomValues(new Uint32Array(1))[0]%900000);
  const token=newToken();
  connect('create',{code,token,screen:false},{name,avatar});
}
$('#entry-form').onsubmit=event=>{event.preventDefault();join($('#code').value.trim());};
$('#private').onclick=create;
$('#resume').onclick=()=>{const previous=stored();if(previous)connect('state',previous);};
$('#invite').onclick=async()=>{
  try{await navigator.clipboard.writeText(roomLink(false));notice('Invite link copied.');}
  catch{showDialog(`<h2>Invite link</h2><input aria-label="Invite link" readonly value="${esc(roomLink(false))}">`);}
};
function exitRoom(){
  clearTimeout(pollTimer);pollGeneration++;room=null;state=null;ready=false;screen=false;
  board.clearPreview();
  document.body.classList.remove('presenter');
  $('#game').hidden=true;$('#entry').hidden=false;$('#resume').hidden=!stored()?.token;
  history.replaceState(null,'',location.pathname);
}
$('#leave').onclick=async()=>{
  if(screen){exitRoom();return;}
  showDialog('<h2>Leave this room?</h2><p>Your seat will be released.</p><button id="confirm-leave">Leave room</button>');
  $('#confirm-leave').onclick=async()=>{
    if(await send('leave')){try{localStorage.removeItem(key);}catch{}dialog.close();exitRoom();}
  };
};
function adopt(data){
  if(!data||state&&data.version<state.version)return;
  const prior=state;
  if(data.boardVersion===state?.boardVersion && !data.board)data.board=state.board;
  data.board ||= [];
  if(state?.turnId!==data.turnId){
    ink=[];inkTurn=data.turnId;board.clearPreview();
    if(prior)playSound('turn');
  }
  if(data.phase!=='draw'){ink=[];board.finishPlayback();}
  if(data.phase==='reveal'&&prior?.phase==='draw')playSound('reveal');
  state=data;clockOffset=data.serverTime-Date.now();
  if(!screen&&!data.me&&ready){exitRoom();notice('Your seat in this room has ended.');return;}
  if(!prior||prior.version!==data.version||prior.phase!==data.phase)render();
  else renderClock();
  if(!prior||prior.boardVersion!==data.boardVersion||prior.turnId!==data.turnId){
    const watchStroke=data.phase==='draw'&&prior?.turnId===data.turnId&&!canDraw();
    board.show(data.board,ink,watchStroke);
  }
}
async function schedulePoll(generation){
  if(generation!==pollGeneration||!room)return;
  try{
    const data=await api('state',{boardVersion:state?.boardVersion??-1});
    if(generation===pollGeneration)adopt(data);
  }catch(error){
    if(generation===pollGeneration){
      if(error.status===404||error.status===410){exitRoom();$('#entry-status').textContent=error.message;return;}
      notice('Reconnecting to room…');
    }
  }
  if(generation===pollGeneration)pollTimer=setTimeout(()=>schedulePoll(generation),state?.phase==='lobby'?1700:850);
}
async function send(type,fields={}){
  if(!room)return false;
  const current=room,generation=pollGeneration,id=crypto.randomUUID();
  for(let i=0;i<3;i++){
    try{
      const data=await api(type,{turnId:state.turnId,boardVersion:state.boardVersion,...fields},current,id);
      if(generation===pollGeneration)adopt(data);
      return true;
    }catch(error){
      if(i<2&&(!error.status||error.status===503)){
        await new Promise(resolve=>setTimeout(resolve,320*(i+1)));
        if(generation!==pollGeneration)return false;
        continue;
      }
      if(generation===pollGeneration)notice(error.message);
      return false;
    }
  }
}
function queueInk(op){
  const last=ink.at(-1);
  if(op.kind==='stroke'&&last?.id===op.id&&last.points.length<224){
    last.points.push(...op.points.slice(-2));
  }else ink.push(op);
}
async function flushInk(){
  if(!canDraw()||!ink.length||sendingInk)return;
  const turn=inkTurn,activeRoom=room,batch=ink.splice(0,10);
  sendingInk=true;
  try{
    await send('paint',{ops:batch,turnId:turn});
    if(room===activeRoom&&turn===inkTurn&&state) {
      board.clearPreview();board.show(state.board,ink);
    }
  }finally{sendingInk=false;}
}
function tools(){
  $('#palette').innerHTML=colors.map((color,index)=>`<button type="button" data-color="${color}" aria-label="${colorNames[index]}" aria-pressed="${color===board.settings.color}" style="--swatch:${color}"></button>`).join('');
}
tools();
$('#palette').onclick=event=>{
  const button=event.target.closest('[data-color]');if(!button)return;
  board.settings.color=button.dataset.color;
  if(board.settings.tool==='eraser')selectTool('brush');
  tools();$('#palette').querySelector('[data-color="'+board.settings.color+'"]').focus();
};
function selectTool(name){
  board.settings.tool=name;
  for(const button of document.querySelectorAll('[data-tool]'))button.setAttribute('aria-pressed',button.dataset.tool===name);
}
$('#actions').onclick=event=>{const name=event.target.closest('[data-tool]')?.dataset.tool;if(name)selectTool(name);};
$('#size').oninput=event=>{board.settings.size=Number(event.target.value);};
function editInk(kind){if(canDraw()){ink.push({kind});flushInk();}}
$('#undo').onclick=()=>editInk('undo');
$('#clear').onclick=()=>editInk('clear');
document.addEventListener('keydown',event=>{
  if(!canDraw()||event.target.matches('input,textarea,select')||dialog.open)return;
  const key=event.key.toLowerCase();
  if((event.ctrlKey||event.metaKey)&&key==='z'){event.preventDefault();editInk('undo');}
  else if(!event.ctrlKey&&!event.metaKey&&['b','e','f'].includes(key))selectTool({b:'brush',e:'eraser',f:'fill'}[key]);
});
function renderClock(){
  if(!state)return;
  const timer=$('#timer');
  timer.hidden=!state.deadline;
  if(state.deadline)timer.textContent=Math.max(0,Math.ceil((state.deadline-Date.now()-clockOffset)/1000))+'s';
  if(state.phase==='draw')$('#clue').textContent=canDraw()?state.answer||'':state.mask||'Mystery word';
}
function renderPlayers(){
  const sorted=[...state.players].sort((a,b)=>b.score-a.score);
  const nextKey=JSON.stringify([state.drawer,state.me,state.settings.capacity,sorted]);
  if(playersKey===nextKey)return;
  playersKey=nextKey;
  $('#players').innerHTML=`<h2>Players · ${sorted.length}/${state.settings.capacity}</h2>`+sorted.map((p,i)=>{
    const caption=p.id===state.drawer?'Drawing':p.solved?'Guessed':p.id===state.me?'You':'';
    return `<button class="player ${p.solved?'solved':''} ${p.id===state.drawer?'artist':''}" ${screen||p.id===state.me?'disabled':''} data-player="${esc(p.id)}">${avatarImage(p.avatar)}<span><b>${i+1}. ${esc(p.name)}</b>${caption?`<small>${caption}</small>`:''}</span><span class="points">${p.score}</span></button>`;
  }).join('');
}
$('#players').onclick=event=>{
  const p=state?.players.find(x=>x.id===event.target.closest('[data-player]')?.dataset.player);
  if(!p||screen||p.id===state.me)return;
  showDialog(`<h2>${esc(p.name)}</h2><div class="entry-actions"><button data-moderation="mute">${muted.has(p.id)?'Unmute':'Mute'}</button><button data-moderation="voteKick">Vote to remove</button><button data-moderation="report">Report to host</button>${state.host?'<button data-moderation="kick">Remove</button><button data-moderation="ban">Ban from room</button>':''}</div>`);
  for(const button of dialog.querySelectorAll('[data-moderation]'))button.onclick=async()=>{
    const action=button.dataset.moderation;
    if(action==='mute'){
      if(muted.has(p.id))muted.delete(p.id);else muted.add(p.id);
      renderMessages();dialog.close();return;
    }
    if(action==='report'){
      showDialog(`<h2>Report ${esc(p.name)}</h2><label>Reason <select id="report-reason"><option>Inappropriate drawing or message</option><option>Spam</option><option>Cheating</option></select></label><p><button id="send-report">Send to host</button></p>`);
      $('#send-report').onclick=async()=>{if(await send('report',{target:p.id,reason:$('#report-reason').value})){dialog.close();notice('Report sent to the host.');}};
    }else if(await send(action,{target:p.id})){dialog.close();notice(action==='voteKick'?'Vote recorded.':'Player removed.');}
  };
};
function renderMessages(){
  if(screen)return;
  const area=$('#messages');
  const nearEnd=area.scrollHeight-area.scrollTop-area.clientHeight<40;
  const messages=state.messages.filter(m=>!muted.has(m.player));
  area.innerHTML=messages.map(m=>`<div class="message ${esc(m.kind)}">${m.name?`<b>${esc(m.name)}:</b> `:''}${esc(m.text)}</div>`).join('');
  if(nearEnd||!lastMessageId)area.scrollTop=area.scrollHeight;
  const last=state.messages.at(-1);
  if(last?.id>lastMessageId&&last.kind==='solved'&&last.player===state.me)playSound('correct');
  lastMessageId=last?.id||0;
}
$('#message-form').onsubmit=async event=>{
  event.preventDefault();
  const input=$('#message'),text=input.value.trim();
  if(!text||input.readOnly)return;
  input.readOnly=true;
  try{if(await send(state.phase==='draw'?'guess':'chat',{text})&&input.value.trim()===text)input.value='';}
  finally{input.readOnly=false;}
};
function settingsHtml(){
  const config=state.settings;
  const number=(label,name,min,max)=>`<label>${label}<input type="number" name="${name}" min="${min}" max="${max}" required value="${config[name]}"></label>`;
  const select=(label,name,options)=>`<label>${label}<select name="${name}">${options.map(([v,l])=>`<option value="${v}" ${config[name]===v?'selected':''}>${l}</option>`).join('')}</select></label>`;
  return `<form id="room-settings"><div class="settings-grid">
  ${number('Player limit','capacity',2,36)}${number('Rounds','rounds',1,10)}
  ${number('Draw time (sec)','seconds',20,150)}${number('Word choices','choices',1,5)}
  ${number('Hints','hints',0,5)}${select('Word language','language',[['en','English'],['es','Spanish']])}
  ${select('Clue style','hintStyle',[['letters','Reveal letters'],['shape','Word length only'],['mystery','Mystery word']])}
  </div><label for="custom">Custom words</label><textarea id="custom" name="custom" rows="2" maxlength="4000" placeholder="Separate words with commas or new lines">${esc(config.custom.join(', '))}</textarea>
  <label><input type="checkbox" name="customOnly" ${config.customOnly?'checked':''}> Use custom words only</label>
  <div class="entry-actions"><button type="submit">Save settings</button><button type="submit" data-start class="primary">Start game</button></div></form>`;
}
function renderOverlay(){
  const artist=state.players.find(p=>p.id===state.drawer);
  const text={
    lobby:'Waiting for players',choose:artist?.name+' is choosing a word',draw:artist?.name+' is drawing',
    reveal:'The word was '+(state.answer||'skipped'),finished:'Game over'
  };
  const phase=state.phase;
  const overlay=$('#overlay');
  $('#phase').textContent=text[phase];
  overlay.hidden=phase==='draw';
  overlay.classList.toggle('turn-reveal',phase==='reveal');
  if(phase==='lobby')overlay.innerHTML=`<h2>Room ${esc(state.code)}</h2><p>${state.players.length} of ${state.settings.capacity} seats filled</p>`;
  else if(phase==='choose')overlay.innerHTML=state.options?
    '<h2>Choose a word</h2><div class="choices">'+state.options.map((word,i)=>`<button data-word="${i}">${esc(word)}</button>`).join('')+'</div>'
    :`<h2>${esc(text.choose)}</h2>`;
  else if(phase==='reveal')overlay.innerHTML=`<h2>${esc(text.reveal)}</h2>`;
  else if(phase==='finished'){
    const top=Math.max(0,...state.players.map(p=>p.score));
    const winners=state.players.filter(p=>p.score===top).map(p=>p.name).join(', ');
    overlay.innerHTML=`<h2>${winners?esc(winners)+' wins':'Game over'}</h2><p>${top} points</p>${state.host?'<button id="rematch" class="primary">Open rematch</button>':''}`;
  }
}
$('#overlay').onclick=event=>{
  const button=event.target.closest('button');if(!button)return;
  if(button.dataset.word!==undefined)send('choose',{index:Number(button.dataset.word)});
  if(button.id==='rematch')send('reset');
};
function render(){
  $('#room-label').textContent=(screen?'Presenter · ':state.listed?'Public room · ':'Private room · ')+state.code;
  $('#round').textContent=state.round?'Round '+state.round+' / '+state.settings.rounds:'Lobby';
  if(state.phase!=='draw')$('#clue').textContent='';
  $('#tools').hidden=!canDraw();
  canvas.classList.toggle('drawing',canDraw());
  const input=$('#message');
  const own=state.players.find(p=>p.id===state.me);
  input.disabled=screen||state.phase==='draw'&&(canDraw()||own?.solved);
  input.placeholder=input.disabled?'Chat paused':state.phase==='draw'?'Type a guess':'Type a message';
  $('#message-form button').disabled=input.disabled;
  $('#message-form button').textContent=state.phase==='draw'?'Guess':'Send';
  const showSettings=state.host&&state.phase==='lobby'&&!screen;
  $('#settings').hidden=!showSettings;
  if(showSettings&&settingsKey!==state.code){
    settingsKey=state.code;
    $('#settings').innerHTML=settingsHtml();
    $('#room-settings').onsubmit=async event=>{
      event.preventDefault();
      const form=event.currentTarget,data=Object.fromEntries(new FormData(form));
      for(const field of ['capacity','rounds','seconds','choices','hints'])data[field]=Number(data[field]);
      data.customOnly=!!data.customOnly;
      if(await send('settings',data)){
        if(event.submitter?.hasAttribute('data-start'))await send('start');
        else notice('Room settings saved.');
      }
    };
  }else if(!showSettings)settingsKey='';
  renderOverlay();renderClock();renderPlayers();renderMessages();
  const reports=state.reports?.length||0;
  let reportButton=$('#reports');
  if(reports&&!reportButton){
    reportButton=document.createElement('button');reportButton.id='reports';reportButton.className='quiet';
    $('#invite').before(reportButton);
    reportButton.onclick=()=>showDialog('<h2>Room reports</h2>'+state.reports.map(r=>`<p><b>${esc(state.players.find(p=>p.id===r.target)?.name||'Former player')}</b> · ${esc(r.reason)} <small>(${esc(state.players.find(p=>p.id===r.by)?.name||'Former player')})</small></p>`).join(''));
  }
  if(reportButton){reportButton.textContent='Reports ('+reports+')';reportButton.hidden=!reports;}
}
setInterval(flushInk,600);
setInterval(renderClock,220);
if(screen&&/^\d{6}$/.test(initialCode))connect('state',{code:initialCode,screen:true});
else if(stored()?.code===initialCode&&stored()?.token)connect('state',stored());
else screen=false;
