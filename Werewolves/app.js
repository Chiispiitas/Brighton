import { API_URL } from './config.js';
const $ = s => document.querySelector(s);
const root = $('#app'), modal = $('#modal');
const escape = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const roleNames = { villager:'Villager', werewolf:'Werewolf', fortune:'Fortune Teller', girl:'Little Girl', witch:'Witch', hunter:'Hunter' };
const roleCopy = {
  villager:'No night action. Discuss with the other players and vote during the day.',
  werewolf:'Each night, choose one living villager with your pack. Every living werewolf must highlight the same victim before the night can continue. You can see your pack’s choices and change your own. Hide your identity during the day.',
  fortune:'Check one living player’s role each night. Only you see the result.',
  girl:'Choose whether to spy each night. You discover one living werewolf. Heads: you stay hidden. Tails: that werewolf also discovers who you are.',
  witch:'Two potions for the whole game: save tonight’s werewolf victim once, and poison a living player once. You may use both in the same night, including on yourself.',
  hunter:'When eliminated, choose one living player to eliminate with you, or pass. This happens before victory is decided.'
};
const phases = {
  lobby:['Lobby','Share the room code. Each player joins on their own device.','✦'],
  reveal:['Role cards','Check your card privately, then select Ready.','◇'],
  fortune:['Fortune Teller','Choose a living player to check their role.','✧'],
  werewolf:['Werewolves','All living werewolves must choose the same player.','☾'],
  girl:['Little Girl','Spy to identify a werewolf, or pass.','◈'],
  witch:['Witch','Choose whether to use your remaining potions.','♧'],
  hunter:['Hunter','Choose one living player to eliminate, or pass.','➶'],
  day:['Day','Discuss with the other players.','☀'],
  vote:['Voting','Choose a living player, or abstain.','⚖'],
  dusk:['Vote result','Read the result before starting the next night.','◒'],
  finished:['Game over','All roles are visible.','✦']
};
let mode='join', state=null, selected=null, reveal=false, busy=false, timer=null, errors=0, lastPhase=null;
let session=null, pendingRequest=null;
let revealedRoom=null, revealedDeaths=new Set();
const PACK_WAIT='Impossible to continue because the decision has not been made.';
const params = new URLSearchParams(location.search), projector=params.has('screen');
const saved = () => { try { return JSON.parse(localStorage.getItem('brighton-werewolves-session')); } catch { return null; } };
function saveSession() { try { localStorage.setItem('brighton-werewolves-session',JSON.stringify(session)); } catch { toast('Keep this tab open. This browser cannot save your game session.'); } }
const token = () => [...crypto.getRandomValues(new Uint8Array(32))].map(n=>n.toString(16).padStart(2,'0')).join('');
function toast(message) { $('#notice').textContent=message; $('#notice').classList.add('show'); clearTimeout(toast.id); toast.id=setTimeout(()=>$('#notice').classList.remove('show'),5500); }
function showModal(html) { $('#modal-content').innerHTML=html; if(!modal.open)modal.showModal(); }
$('.close').onclick=()=>modal.close(); modal.addEventListener('click', e=>{if(e.target===modal)modal.close();});
function rules() {
  showModal(`<div class="eyebrow">Rules</div><h2 style="margin-top:16px">Roles</h2><p class="guide-intro">Each player uses a device. The host starts the game and controls the night and day phases.</p><div class="rule-grid">${Object.keys(roleNames).map(r=>`<div class="rule"><img src="assets/${r}-icon.webp" alt=""><h3>${roleNames[r]}</h3><p>${roleCopy[r]}</p></div>`).join('')}</div><div class="rule-order"><b>THE NIGHT ORDER</b><br>Fortune teller → Werewolves → Little girl → Witch → Dawn.<br><br><b>FIRST DAY</b><br>Discuss what happened. Nobody is voted out on day one. Voting starts on day two.<br><br><b>THE VOTE</b><br>One secret vote per living player. The unique highest vote eliminates that player. Ties and an all-abstain vote eliminate nobody. Eliminated players reveal their cards to the village, then watch quietly and cannot act or vote.<br><br><b>WINNING</b><br>The village wins when no werewolves remain. Werewolves win when they equal or outnumber the other living players. The hunter’s final shot always happens first.<br><br><b>THE HOST</b><br>Host as narrator, or join the roster to play too. Read the current phase aloud. Continue after the players have acted. Missing roles are skipped. Rooms last 24 hours; keep the same browser to reconnect.</div><p class="guide-intro">The witch’s healing potion saves that night’s werewolf victim; it does not bring back someone eliminated on an earlier day. If the same player is also poisoned, they still die.</p>`);
}
$('#guide').onclick=rules;
function landing() {
  root.className='entry-page';
  root.innerHTML=`<div class="landing"><section class="entry"><h1>Werewolves</h1><div class="tabset"><button class="tab ${mode==='join'?'active':''}" data-mode="join">Join game</button><button class="tab ${mode==='host'?'active':''}" data-mode="host">Host game</button></div><p class="entry-instructions">${mode==='join'?'Enter your name and the room code.':'Create a room and share its code with the players.'}</p><form id="entry-form"><div class="field"><label for="name">${mode==='join'?'Your name':'Host name'}</label><input id="name" name="name" placeholder="Name" maxlength="24" autocomplete="nickname" required></div>${mode==='join'?`<div class="field"><label for="code">Room code</label><input id="code" class="code" name="code" placeholder="000000" inputmode="numeric" pattern="[0-9]{6}" maxlength="6" value="${escape(params.get('room')?.replace(/\D/g,'').slice(0,6)||'')}" required autocomplete="off"></div>`:''}<div id="entry-error" class="hidden error-box" role="alert"></div><button class="primary wide" type="submit">${mode==='join'?'Join':'Create room'}</button></form>${saved()?'<button id="restore" class="secondary wide restore">Return to your previous village</button>':''}<p class="player-range">4–12 players · one device per player</p></section><section class="board-preview" aria-label="Village board"><div class="preview-title">The village</div>${previewHouses()}<span class="square-marker">4–12<br><small>players</small></span></section></div><section class="roles-preview"><h2>Roles</h2><div class="mini-roles">${Object.keys(roleNames).map(r=>`<a href="#rules" class="mini-role" data-rules><img src="assets/${r}-icon.webp" alt="">${roleNames[r]}</a>`).join('')}</div></section>`;
  root.querySelectorAll('[data-mode]').forEach(b=>b.onclick=()=>{mode=b.dataset.mode;landing();});
  root.querySelectorAll('[data-rules]').forEach(b=>b.onclick=e=>{e.preventDefault();rules();});
  $('#restore')?.addEventListener('click',()=>{session=saved();reveal=false;refresh(true);});
  $('#entry-form').onsubmit=async e=>{
    e.preventDefault(); if(busy)return;
    const name=$('#name').value.trim();
    const code=mode==='join'?$('#code').value: String(100000 + Math.floor(crypto.getRandomValues(new Uint32Array(1))[0]/4294967296*900000));
    // Retain the same player capability when reopening a join link on the same browser.
    const prior=saved();
    session={ code, token:prior?.code===code?prior.token:token() };
    const result=await send({type:mode==='host'?'create':'join', name},false);
    if(result) { saveSession(); history.replaceState(null,'',`?room=${code}`); startPolling(); }
  };
}
async function api(body) {
  if(!API_URL)throw new Error('The game service is unavailable. Please retry later.');
  const controller=new AbortController(), timeout=setTimeout(()=>controller.abort(),20000);
  try {
    const res=await fetch(API_URL,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...body,code:session.code,token:session.token}),signal:controller.signal,cache:'no-store'});
    const data=await res.json(); if(!res.ok){const e=new Error(data.error||'Could not connect. Please retry.');e.status=res.status;throw e;} return data;
  } catch(e) { if(e.name==='AbortError')throw new Error('Connection timed out. Please retry.'); throw e; }
  finally { clearTimeout(timeout); }
}
async function send(body, inRoom=true) {
  if(busy)return false;busy=true;
  const locked=[...root.querySelectorAll('button,input,select')].filter(b=>!b.disabled);
  locked.forEach(b=>b.disabled=true);
  // Keep an identical identifier if a network failure leaves the outcome unknown.
  const signature=JSON.stringify(body);
  if(pendingRequest?.signature!==signature)pendingRequest={signature,id:crypto.randomUUID()};
  try {
    const data=await api({...body,requestId:pendingRequest.id});pendingRequest=null;
    state=data;errors=0;renderRoom();return true;
  } catch(e) {
    if(e.status && e.status<500)pendingRequest=null;
    if(!inRoom){$('#entry-error').textContent=e.message;$('#entry-error').classList.remove('hidden');}
    else toast(e.message);
    return false;
  } finally {busy=false;locked.forEach(b=>{if(b.isConnected)b.disabled=false;});}
}
async function refresh(initial=false) {
  if(busy)return;
  try {
    const data=await api({type:'state'});errors=0;
    if(!state||data.version>state.version||initial&&data.version>=state.version){state=data;renderRoom();}
    $('.connection')?.remove();
    if(initial)startPolling();
  } catch(e) {
    errors++;
    if(initial){toast(e.message);state=null;landing();return;}
    if(!$('.connection'))root.insertAdjacentHTML('afterbegin',`<p class="connection" role="status">Connection interrupted. Reconnecting automatically…</p>`);
  }
}
function startPolling() {
  clearTimeout(timer);
  timer=setTimeout(async()=>{if(!document.hidden)await refresh();startPolling();},errors?Math.min(25000,6000*errors):(state?.phase==='werewolf'&&state.me?.alive&&state.me?.role==='werewolf'?1800:state?.host?3500:6000));
}
document.addEventListener('visibilitychange',()=>{
  reveal=false;
  if(modal.open)modal.close();
  if(state){if(document.hidden)renderRoom();else refresh(true);}
});
const playerName=id=>state.players.find(p=>p.id===id)?.name||'Nobody';
const link=screen=>`${location.origin}${location.pathname}?room=${state.code}${screen?'&screen=1':''}`;
function actionAvailable() { return !projector&&state.me?.canAct&&(!state.me.acted||state.phase==='werewolf')&&state.phase!=='reveal'; }
function targetable(p) {
  if(!actionAvailable()||!p.alive||p.id===state.me.id)return false;
  if(state.phase==='werewolf'&&p.pack)return false;
  return ['fortune','werewolf','hunter','vote'].includes(state.phase);
}
function witchVictim() {
  return !projector&&state.phase==='witch'&&state.me?.role==='witch'&&state.me.alive?state.me.victim:null;
}
const HOUSE_SPOTS=[[28,19],[50,17],[70,19],[86,31],[90,49],[86,67],[70,83],[50,85],[28,82],[13,68],[8,49],[13,31]];
function houseArt(index, dead=false) {
  const i=index%12;
  return `<i class="house-art ${dead?'closed':''}" style="--sx:${i%4*100/3}%;--sy:${Math.floor(i/4)*50}%" aria-hidden="true"></i>`;
}
function previewHouses() {
  return HOUSE_SPOTS.map(([x,y],i)=>`<div class="preview-house" style="--x:${x};--y:${y}">${houseArt(i)}</div>`).join('');
}
function mapHtml() {
  const [title,copy]=phases[state.phase]||phases.lobby;
  const day=['lobby','reveal','hunter','day','vote','dusk','finished'].includes(state.phase);
  // Older rooms may finish without hiding players; new joins and starts are limited to twelve.
  const legacy=state.players.length>12, rows=Math.ceil(state.players.length/4);
  const spots=legacy?state.players.map((p,i)=>[15+23*(i%4),10+80*Math.floor(i/4)/(rows-1)]):HOUSE_SPOTS;
  const slots=new Map(state.players.map((p,i)=>[legacy?i:Math.floor(i*12/Math.max(1,state.players.length)),p]));
  const houses=spots.map(([x,y],i)=>{
    const p=slots.get(i);
    if(!p)return `<div class="house vacant" style="--x:${x};--y:${y}">${houseArt(i)}<span>Empty</span></div>`;
    const attacked=p.id===witchVictim(), mine=p.id===state.me?.id&&!projector;
    const choices=!projector?(state.packChoices||[]).filter(c=>c.target===p.id):[];
    const status=attacked?'Attacked tonight':!p.alive?'Eliminated':state.phase==='lobby'?'Joined':'Alive';
    const role=state.phase==='finished'||!p.alive?roleNames[p.role]||'':p.pack&&!projector?'Werewolf':'';
    return `<button class="house ${p.alive?'':'dead'} ${attacked?'witch-victim':''} ${mine?'self':''} ${targetable(p)?'selectable':''} ${p.id===selected?'selected':''} ${choices.length?'pack-target':''}" style="--x:${x};--y:${y}" data-player="${p.id}" ${targetable(p)||!p.alive&&p.role?'':'aria-disabled="true"'} aria-pressed="${p.id===selected}" aria-label="${escape(p.name)}, ${status}${attacked?', revival target':''}${!p.alive&&p.role?', reveal card':targetable(p)?', choose player':''}">${houseArt(i,!p.alive||attacked)}<span class="nameplate"><b>${escape(p.name)}${mine?' · you':''}</b><small>${status}${role?' · '+role:''}</small>${attacked?'<small class="victim-badge">Revival target</small>':''}${choices.length?`<small class="pack-marker">${choices.map(c=>escape(playerName(c.wolfId))).join(', ')}</small>`:''}${state.voteCounts?.[p.id]?`<small>${state.voteCounts[p.id]} votes</small>`:''}</span></button>`;
  }).join('');
  return `<section class="map-panel"><div class="phase-banner"><div><h2>${title}</h2><p>${copy}</p></div><span class="phase-token">${state.phase==='lobby'?'Lobby':`${day?'Day':'Night'} ${state.day||1}`}</span></div><div class="village-map ${day?'is-day':'is-night'}" ${legacy?`style="min-height:${rows*155}px"`:""}><div class="houses">${houses}</div><span class="square-marker">${state.phase==='lobby'?`${state.players.length}/12`:`${state.players.filter(p=>p.alive).length-(witchVictim()?1:0)}`}<small>${state.phase==='lobby'?'joined':witchVictim()?'unharmed':'alive'}</small></span></div><div class="map-legend"><span>${witchVictim()?`${state.players.filter(p=>p.alive).length-1} unharmed · 1 attacked tonight · ${state.players.filter(p=>!p.alive).length} eliminated`:`${state.players.filter(p=>p.alive).length} alive · ${state.players.filter(p=>!p.alive).length} eliminated`}</span><span>${day?'Day':'Night'} ${state.day||1}</span></div></section>`;
}
const NIGHT_PHASES=['fortune','werewolf','girl','witch'];
function hostPanel() {
  if(!state.host||projector)return '';
  const p=state.progress, packBlocked=state.phase==='werewolf'&&!state.packDecision?.agreed, completed=p?.done===p?.total&&!packBlocked;
  const advanceLabel=state.phase==='reveal'?'Put the village to sleep':state.phase==='day'?(state.day===1?'Begin night two':'Open the vote'):state.phase==='dusk'?'Begin the next night':state.phase==='vote'?'Count the votes':'Continue the night';
  return `<section class="panel"><div class="eyebrow">Host</div><h3>${state.phase==='lobby'?'Room code':'Host controls'}</h3>${state.phase==='lobby'?`<div class="code-large">${state.code}</div><span class="join-link">${escape(location.host+location.pathname)}</span><p>Players enter the room code on this page. You can host or join as a player.</p><button class="secondary wide" data-copy>Copy invitation link ↗</button><div class="toolbar-links"><a href="${link(true)}" target="_blank" rel="noopener">Open shared screen ↗</a></div><div class="settings"><label>Werewolves <select id="wolves">${Array.from({length:6},(_,i)=>`<option value="${i}" ${state.settings.wolves===i?'selected':''}>${i||'Auto'}</option>`).join('')}</select></label>${['fortune','girl','witch','hunter'].map(r=>`<label>${roleNames[r]}<input type="checkbox" data-setting="${r}" ${state.settings[r]?'checked':''}></label>`).join('')}</div><p class="status-line">Auto: one werewolf per four players. Small games use fewer special roles.</p><button class="primary wide" id="start">Deal the cards <span>→</span></button>${!state.me?'<button class="quiet" id="host-join">I’m playing too +</button>':''}`:state.phase==='finished'?`<p>${state.winner==='village'?'Villagers win.':'Werewolves win.'}</p><button class="primary wide" id="reset">New game →</button>`:state.phase==='hunter'?`<p>Wait for ${escape(playerName(state.pendingHunter))} to choose a final target, or pass. The game will continue after this choice.</p>`:`<p>${state.phase==='day'&&state.day===1?'The first day is for discussion only. Voting will begin on day two.':state.phase==='day'?'Open voting after the discussion.':state.phase==='dusk'?'Read the voting result, then start the next night.':'Call the current role. Wait for their action, then continue.'}</p>${p&&p.total?`<div class="progress"><i style="width:${p.done/p.total*100}%"></i></div><p class="status-line">${p.done} / ${p.total} ${state.phase==='reveal'?'cards acknowledged':state.phase==='vote'?'votes received':'actions received'}</p>`:''}<button class="primary wide" id="advance" ${p&&p.total&&!completed?'disabled':''}>${packBlocked?PACK_WAIT:advanceLabel+' →'}</button>${state.phase!=='werewolf'&&p&&p.total&&!completed?'<div class="host-tools"><button class="quiet" id="force">Continue with missing actions…</button></div>':''}`}</section>`;
}
function mePanel() {
  if(projector)return '';
  const me=state.me;
  if(!me)return state.host?'':`<section class="panel"><h3>Watching the village</h3><p>${state.phase==='lobby'?'Join the roster to receive a card.':'This game has already started. You can watch this village.'}</p>${state.phase==='lobby'?'<button class="primary wide" id="join-roster">Join the players</button>':''}</section>`;
  if(state.phase==='lobby')return `<section class="panel"><div class="private-tag">Player</div><h3>Welcome, ${escape(playerName(me.id))}.</h3><p>Wait for the host to deal the cards.</p><button class="quiet" id="leave-roster">Leave the player roster</button></section>`;
  if(state.phase==='reveal')return `<section class="panel private-card"><div class="private-tag">Private</div><h3>Your role</h3>${reveal?`<img class="role-card" src="assets/${me.role}-card.webp" alt="Your ${roleNames[me.role]} card"><div class="role-title">${roleNames[me.role]}</div><p>${roleCopy[me.role]}</p>`:'<button class="card-back" id="reveal" aria-label="Reveal your secret card"></button><p>Keep your card hidden from other players.</p>'}<div class="reveal-tools">${reveal?'<button class="quiet" id="hide">Hide card</button>':''}${me.acted?'<p class="status-line">✓ Ready</p>':reveal?'<button class="primary" id="ready">Ready</button>':''}</div></section>`;
  if(state.phase==='finished')return `<section class="panel private-card"><div class="private-tag">Your role</div><img class="role-card" src="assets/${me.role}-card.webp" alt="${roleNames[me.role]}"><h3>${roleNames[me.role]}</h3><p>${me.alive?'You finished alive.':'Eliminated.'}</p></section>`;
  const yourTurn=me.canAct&&(!me.acted||state.phase==='werewolf');
  let body='';
  if(!me.alive&&state.phase!=='hunter')body='<div class="sleep"><span class="moon">◇</span><h3>Eliminated</h3><p>You can watch, but cannot act or vote.</p></div>';
  else if(!yourTurn)body=`<div class="sleep"><span class="moon">${NIGHT_PHASES.includes(state.phase)?'☾':'☀'}</span><h3>${me.acted?'Choice recorded.':NIGHT_PHASES.includes(state.phase)?'Close your eyes.':state.phase==='hunter'?'Hunter’s turn':'Discussion'}</h3><p>${me.acted?'Wait for the next phase.':NIGHT_PHASES.includes(state.phase)?'Wait until the host calls your role.':state.phase==='hunter'?'The hunter is choosing a final target.':'Discuss with the other players.'}</p></div>`;
  else if(state.phase==='werewolf')body=packPanel();
  else if(state.phase==='girl')body='<h3>Spy or pass</h3><p class="action-prompt">Spying always reveals one werewolf to you. Flip heads to stay hidden; tails means that werewolf sees you too.</p><div class="action-buttons"><button class="primary" id="spy">Flip the coin ◈</button><button class="secondary" id="pass">Stay asleep</button></div>';
  else if(state.phase==='witch')body=witchPanel();
  else body=`<h3>${state.phase==='fortune'?'Check a role':state.phase==='werewolf'?'Choose a player':state.phase==='hunter'?'Hunter’s choice':'Cast your vote'}</h3><p class="action-prompt">${state.phase==='fortune'?'Choose another living player’s house to learn their role privately.':state.phase==='werewolf'?'Choose a living player’s house. Your pack is marked. Only one victim can be attacked tonight.':state.phase==='hunter'?'Choose a living player’s house to take them with you, or pass.':'Choose a living player’s house to vote for them. You may also abstain.'}</p><p class="target-label" id="target-name">${selected?escape(playerName(selected)):'Choose a house in the village'}</p><div class="action-buttons"><button class="primary" id="confirm-target" ${selected?'':'disabled'}>${state.phase==='vote'?'Cast my vote':'Confirm choice'}</button>${state.phase!=='werewolf'?`<button class="secondary" id="pass">${state.phase==='vote'?'Abstain':'Pass'}</button>`:''}</div>`;
  return `<section class="panel"><div class="private-tag">Private</div>${body}<div class="host-tools"><button class="quiet" id="peek-role">View my role</button></div>${me.notes?.length?`<details class="notes"><summary class="quiet">Your notes (${me.notes.length})</summary>${me.notes.slice().reverse().map(n=>`<div class="note"><small>NIGHT ${n.day}</small>${escape(n.text.replace(/\b(fortune|girl|witch|hunter|werewolf|villager)\b/g,m=>roleNames[m]))}</div>`).join('')}</details>`:''}</section>`;
}
function logText(text) {
  return text.replace('The prophecy has come true. Werewolves walk among us.','Game started.')
    .replace('The village is safe. Every werewolf has been found.','Villagers win.')
    .replace('The werewolves have taken the village.','Werewolves win.')
    .replace(/Dawn breaks on day (\d+)\./g,'Day $1.');
}
function rosterPanel() {
  return `<section class="panel ${state.phase==='lobby'?'':'history'}"><h3>${state.phase==='lobby'?`The villagers · ${state.players.length}`:'Game log'}</h3>${state.phase==='lobby'?`<p>${state.players.length<4?`${4-state.players.length} more player${4-state.players.length===1?'':'s'} needed to start.`:'Ready to start.'}</p><div class="roster">${state.players.map(p=>`<span>${escape(p.name)}${state.host&&!projector?`<button data-kick="${p.id}" aria-label="Remove ${escape(p.name)}">×</button>`:''}</span>`).join('')}</div>`:`<ul class="log">${state.log.slice(-8).reverse().map(l=>`<li><small>${l.day?'DAY '+l.day:'START'}</small>${escape(logText(l.text))}</li>`).join('')}</ul>`}</section>`;
}
function witchPanel() {
  const me=state.me, name=me.victim?playerName(me.victim):null;
  const canHeal=!!me.potions.heal&&!!me.victim;
  return `<h3>Potions</h3>${name?`<section class="witch-victim-card" aria-label="Tonight’s revival target"><span class="victim-label">Attacked by the werewolves tonight</span>${houseArt(Math.max(0,Math.floor(state.players.findIndex(p=>p.id===me.victim)*12/Math.max(1,state.players.length))),true)}<h3>${escape(name)}</h3><p>This villager is dying. ${canHeal?'Your healing potion can revive them before dawn.':'Your healing potion has already been used; you cannot revive them.'}</p></section>`:'<div class="witch-safe"><b>No victim tonight</b><p>Nobody was attacked by the werewolves. There is nobody to revive.</p></div>'}<div class="witch-choice"><label class="heal-choice"><input type="checkbox" id="heal" ${canHeal?'':'disabled'}><span>${canHeal?`Revive <strong>${escape(name)}</strong> with my healing potion`:!me.potions.heal?'Healing potion already used':'Healing potion kept — no victim'}</span></label><p class="witch-help">Only tonight’s werewolf victim can be revived. Players eliminated on earlier days remain dead.</p><label for="poison">${me.potions.poison?'Poison a player (optional)':'Poison potion used'}</label><select id="poison" ${!me.potions.poison?'disabled':''}><option value="">Keep the poison potion</option>${state.players.filter(p=>p.alive).map(p=>`<option value="${p.id}">${escape(p.name)} · ${p.id===me.victim?'attacked tonight':'alive'}</option>`).join('')}</select></div><p id="witch-outcome" class="witch-outcome" aria-live="polite">${canHeal?`Healing potion kept. ${escape(name)} will not be revived.`:'Choose whether to use your poison potion, or keep it.'}</p><button class="primary wide" id="cast">Confirm potion choice →</button>`;
}
function packPanel() {
  return `<h3>Pack selection</h3><p class="action-prompt">Tap a living villager’s house to share your highlight with the pack. You can change your choice until the night continues.</p><ul class="pack-choices">${(state.packChoices||[]).map(c=>`<li><b>${escape(playerName(c.wolfId))}${c.wolfId===state.me.id?' · you':''}</b><span>${c.target?escape(playerName(c.target)):'Choosing…'}</span></li>`).join('')}</ul><p class="status-line">${state.packDecision?.agreed?'All living wolves selected the same player. You or the host can continue.':'Every living werewolf must highlight the same person.'}</p><button class="primary wide" id="pack-continue" ${state.packDecision?.agreed?'':'disabled'}>${state.packDecision?.agreed?'Continue the night →':PACK_WAIT}</button>`;
}
function revealedCards() {
  const dead=state.players.filter(p=>!p.alive&&p.role);
  if(!dead.length)return '';
  return `<section class="revealed-roles"><h3>Eliminated players</h3><p>Select a card or house to view the revealed role.</p><div class="revealed-card-grid">${dead.map(p=>`<button class="revealed-card" data-revealed="${p.id}"><img src="assets/${p.role}-card.webp" alt="${escape(p.name)}: ${roleNames[p.role]}"><b>${escape(p.name)}</b><span>${roleNames[p.role]}</span></button>`).join('')}</div></section>`;
}
function showEliminatedCards(players) {
  showModal(`<div class="eyebrow">Eliminated player</div><h2 style="margin-top:16px">${players.length===1?escape(players[0].name)+' · '+roleNames[players[0].role]:'Eliminated players'}</h2><div class="public-card-grid">${players.map(p=>`<div><img class="role-card" src="assets/${p.role}-card.webp" alt="${escape(p.name)}: ${roleNames[p.role]}"><h3>${escape(p.name)}</h3><p class="role-title">${roleNames[p.role]}</p></div>`).join('')}</div>`);
}
function renderRoom() {
  if(!state)return;
  const phaseChanged=lastPhase!==state.phaseId;
  if(revealedRoom!==state.code||state.phase==='lobby'){revealedRoom=state.code;revealedDeaths=new Set();}
  const newlyRevealed=state.players.filter(p=>!p.alive&&p.role&&!revealedDeaths.has(p.id));
  newlyRevealed.forEach(p=>revealedDeaths.add(p.id));
  if(phaseChanged){selected=null;reveal=false;lastPhase=state.phaseId;if(modal.open)modal.close();}
  if(state.phase==='werewolf'&&state.me?.role==='werewolf')selected=state.me.target||null;
  root.className=projector?'projector':state.phase==='witch'&&state.me?.role==='witch'?'witch-turn':'';
  root.innerHTML=`<div class="room-head"><div><div class="eyebrow">${state.phase==='lobby'?'Lobby':state.phase==='finished'?'Game over':`${NIGHT_PHASES.includes(state.phase)?'Night':'Day'} ${state.day||1}`}</div><h1>${state.phase==='lobby'?'Lobby':state.phase==='finished'?(state.winner==='village'?'Villagers win.':'Werewolves win.'):'Werewolves'}</h1></div><div class="room-tools"><button class="room-code" data-copy title="Copy invitation link">${state.code}</button><span class="live-dot">${projector?'Shared screen':state.host?'Host connected':'Connected'}</span><button class="quiet" id="home">Leave this view</button></div></div>${state.phase==='finished'?`<div class="success-banner"><h2>${state.winner==='village'?'Villagers win.':'Werewolves win.'}</h2><p>All roles are revealed below. ${state.host&&!projector?'You can start another game.':''}</p></div>`:''}<div class="room-layout">${mapHtml()}<aside class="sidebar">${mePanel()}${hostPanel()}${rosterPanel()}</aside></div>${revealedCards()}`;
  wireRoom();
  if(phaseChanged)window.scrollTo({top:0,behavior:'smooth'});
  if(newlyRevealed.length)showEliminatedCards(newlyRevealed);
}
const act = extra => send({type:'action',phaseId:state.phaseId,...extra});
function wireRoom() {
  root.querySelectorAll('[data-copy]').forEach(b=>b.onclick=async()=>{try{await navigator.clipboard.writeText(link(false));toast('Room link copied.');}catch{showModal(`<h3>Invite players</h3><p class="guide-intro">Room code: <b>${state.code}</b></p><input readonly value="${escape(link(false))}" onfocus="this.select()">`);}});
  $('#home').onclick=()=>{clearTimeout(timer);state=null;reveal=false;lastPhase=null;landing();history.replaceState(null,'',location.pathname);};
  root.querySelectorAll('[data-player]').forEach(b=>b.onclick=async()=>{const p=state.players.find(p=>p.id===b.dataset.player);if(!p.alive&&p.role){showEliminatedCards([p]);return;}if(!targetable(p))return;if(state.phase==='werewolf'){selected=p.id;await act({target:p.id});return;}selected=p.id;root.querySelectorAll('[data-player]').forEach(x=>{x.classList.toggle('selected',x.dataset.player===selected);x.setAttribute('aria-pressed',String(x.dataset.player===selected));});$('#target-name').textContent=p.name;$('#confirm-target').textContent=state.phase==='vote'?`Vote for ${p.name}`:`Choose ${p.name}`;$('#confirm-target').disabled=false;});
  $('#reveal')?.addEventListener('click',()=>{reveal=true;renderRoom();});
  $('#hide')?.addEventListener('click',()=>{reveal=false;renderRoom();});
  $('#ready')?.addEventListener('click',()=>{reveal=false;send({type:'ready',phaseId:state.phaseId});});
  $('#peek-role')?.addEventListener('click',()=>showModal(`<div class="private-tag">Private</div><h2>${roleNames[state.me.role]}</h2><img class="role-card" src="assets/${state.me.role}-card.webp" alt="Your role card"><p class="guide-intro">${roleCopy[state.me.role]}</p>`));
  $('#spy')?.addEventListener('click',async()=>{if(await act({spy:true})){const n=state.me.notes.at(-1);if(n)showModal(`<div class="eyebrow">Spy result</div><h2 style="margin-top:18px">${n.text.startsWith('Heads')?'Heads. Hidden.':'Tails. Discovered.'}</h2><p class="guide-intro">${escape(n.text)}</p><p>Only you can see this result.</p>`);}});
  $('#pass')?.addEventListener('click',()=>state.phase==='vote'?send({type:'vote',phaseId:state.phaseId,target:null}):act({}));
  $('#confirm-target')?.addEventListener('click',async()=>{if(!selected)return;const phase=state.phase;if(await send({type:phase==='vote'?'vote':'action',phaseId:state.phaseId,target:selected})){if(phase==='fortune'){const n=state.me.notes.at(-1);if(n)showModal(`<div class="eyebrow">Role result</div><h2 style="margin-top:18px">Role result</h2><p class="guide-intro">${escape(n.text.replace(/\b(fortune|girl|witch|hunter|werewolf|villager)\b/g,m=>roleNames[m]))}</p>`);}else toast('Choice recorded.');}});
  $('#heal')?.addEventListener('change',()=>{
    const healing=$('#heal').checked, name=playerName(state.me.victim);
    $('#witch-outcome').textContent=healing?`You will revive ${name} when you confirm. If they are also poisoned, they will still die.`:`Healing potion kept. ${name} will not be revived.`;
    $('#cast').textContent=healing?`Revive ${name} · confirm →`:'Confirm potion choice →';
  });
  $('#cast')?.addEventListener('click',()=>act({heal:$('#heal').checked,poison:$('#poison').value||null}));
  $('#start')?.addEventListener('click',()=>send({type:'start'}));
  $('#pack-continue')?.addEventListener('click',()=>send({type:'advance',phaseId:state.phaseId}));
  root.querySelectorAll('[data-revealed]').forEach(b=>b.onclick=()=>showEliminatedCards([state.players.find(p=>p.id===b.dataset.revealed)]));
  $('#advance')?.addEventListener('click',()=>send({type:'advance',phaseId:state.phaseId}));
  $('#force')?.addEventListener('click',()=>{showModal('<h2>Continue without everyone?</h2><p class="guide-intro">Missing actions will be treated as passes. Missing votes will be left uncounted. This cannot be undone.</p><button class="primary" id="force-confirm">Continue</button>');$('#force-confirm').onclick=()=>{modal.close();send({type:'advance',phaseId:state.phaseId,force:true});};});
  $('#reset')?.addEventListener('click',()=>send({type:'reset'}));
  const settings=()=>{const value={wolves:Number($('#wolves').value)};root.querySelectorAll('[data-setting]').forEach(i=>value[i.dataset.setting]=i.checked);send({type:'settings',settings:value});};
  $('#wolves')?.addEventListener('change',settings);root.querySelectorAll('[data-setting]').forEach(i=>i.onchange=settings);
  root.querySelectorAll('[data-kick]').forEach(b=>b.onclick=()=>send({type:'kick',target:b.dataset.kick}));
  $('#host-join')?.addEventListener('click',()=>send({type:'join',name:state.hostName}));
  $('#join-roster')?.addEventListener('click',()=>{showModal('<h2>Join the villagers</h2><form id="join-again"><div class="field" style="margin-top:20px"><label for="again-name">Your name</label><input id="again-name" maxlength="24" required></div><button class="primary" type="submit">Join the roster</button></form>');$('#join-again').onsubmit=e=>{e.preventDefault();const name=$('#again-name').value;modal.close();send({type:'join',name});};});
  $('#leave-roster')?.addEventListener('click',()=>send({type:'leave'}));
}
let audio=null;
$('#sound').onclick=async()=>{
  if(audio){await audio.close();audio=null;$('#sound').textContent='Sound off';$('#sound').setAttribute('aria-pressed','false');return;}
  try{
    const C=window.AudioContext||window.webkitAudioContext;audio=new C();
    const master=audio.createGain();master.gain.value=.035;master.connect(audio.destination);
    [110,164.81,220,261.63].forEach((frequency,i)=>{const o=audio.createOscillator(),g=audio.createGain();o.type='sine';o.frequency.value=frequency;g.gain.value=i===0?.5:.1;o.connect(g);g.connect(master);o.start();});
    $('#sound').textContent='Sound on';$('#sound').setAttribute('aria-pressed','true');
  }catch{toast('Sound is unavailable in this browser.');}
};
if(projector&&/^\d{6}$/.test(params.get('room')||'')){
  session={code:params.get('room'),token:token()};refresh(true);
}else landing();
