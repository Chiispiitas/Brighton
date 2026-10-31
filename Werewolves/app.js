import { API_URL } from './config.js';
const $ = s => document.querySelector(s);
const root = $('#app'), modal = $('#modal');
const escape = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const roleNames = { villager:'Villager', werewolf:'Werewolf', fortune:'Fortune Teller', girl:'Little Girl', witch:'Witch', hunter:'Hunter' };
const roleCopy = {
  villager:'You have no night power. Listen carefully, question the others, and help the village find the werewolves.',
  werewolf:'Each night, choose one living villager with your pack. The most selected target is attacked; a tie means no attack. Hide your identity during the day.',
  fortune:'Each night, privately discover the exact role of one living player. Use what you learn without making yourself a target.',
  girl:'Choose whether to spy each night. You discover one living werewolf. Heads: you stay hidden. Tails: that werewolf also discovers who you are.',
  witch:'Two potions for the whole game: save tonight’s werewolf victim once, and poison a living player once. You may use both in the same night, including on yourself.',
  hunter:'If you die for any reason, you may take one living player with you. Your final shot resolves before the winner is decided.'
};
const phases = {
  lobby:['The village is gathering','Share the code. Every player joins on their own device.','✦'],
  reveal:['A secret at every doorstep','Everyone: privately look at your card, then mark yourself ready.','◇'],
  fortune:['The fortune teller awakens','The village sleeps. The fortune teller may discover one role.','✧'],
  werewolf:['The werewolves awaken','The village sleeps. The pack chooses its victim.','☾'],
  girl:['A little girl opens her eyes','The village sleeps. Will she risk being seen?','◈'],
  witch:['The witch lights a candle','The village sleeps. Two potions may change its fate.','♧'],
  hunter:['The hunter’s last breath','A final shot must be resolved before the story continues.','➶'],
  day:['The village awakens','Talk together. Listen, accuse, defend, and trust your instincts.','☀'],
  vote:['The village must decide','Living players: choose someone to vote out, or abstain.','⚖'],
  dusk:['The sun is setting','The vote is over. Another night is approaching.','◒'],
  finished:['The truth comes to light','Every secret is revealed. See who was hiding in your village.','✦']
};
let mode='join', state=null, selected=null, reveal=false, busy=false, timer=null, errors=0, lastPhase=null;
let session=null, pendingRequest=null;
const params = new URLSearchParams(location.search), projector=params.has('screen');
const saved = () => { try { return JSON.parse(localStorage.getItem('brighton-werewolves-session')); } catch { return null; } };
function saveSession() { try { localStorage.setItem('brighton-werewolves-session',JSON.stringify(session)); } catch { toast('Keep this tab open: your browser cannot save the room key.'); } }
const token = () => [...crypto.getRandomValues(new Uint8Array(32))].map(n=>n.toString(16).padStart(2,'0')).join('');
function toast(message) { $('#notice').textContent=message; $('#notice').classList.add('show'); clearTimeout(toast.id); toast.id=setTimeout(()=>$('#notice').classList.remove('show'),5500); }
function showModal(html) { $('#modal-content').innerHTML=html; if(!modal.open)modal.showModal(); }
$('.close').onclick=()=>modal.close(); modal.addEventListener('click', e=>{if(e.target===modal)modal.close();});
function rules() {
  showModal(`<div class="eyebrow">The village handbook</div><h2 style="margin-top:16px">Six roles. One village.<br>Many secrets.</h2><p class="guide-intro">Play together in the classroom. Each player needs a device. The host narrates and controls when each part of the story begins.</p><div class="rule-grid">${Object.keys(roleNames).map(r=>`<div class="rule"><img src="assets/${r}-icon.webp" alt=""><h3>${roleNames[r]}</h3><p>${roleCopy[r]}</p></div>`).join('')}</div><div class="rule-order"><b>THE NIGHT ORDER</b><br>Fortune teller → Werewolves → Little girl → Witch → Dawn.<br><br><b>FIRST DAY</b><br>Discuss what happened. Nobody is voted out on day one. Voting starts on day two.<br><br><b>THE VOTE</b><br>One secret vote per living player. The unique highest vote eliminates that player. Ties and an all-abstain vote eliminate nobody. Eliminated players watch quietly and cannot act or vote.<br><br><b>WINNING</b><br>The village wins when no werewolves remain. Werewolves win when they equal or outnumber the other living players. The hunter’s final shot always happens first.<br><br><b>THE HOST</b><br>Host as narrator, or join the roster to play too. Read each phase aloud, wait for the players’ actions, then continue. Missing roles are skipped. Rooms last 24 hours; keep the same browser to reconnect.</div><p class="guide-intro">The witch’s healing potion saves that night’s werewolf victim; it does not bring back someone eliminated on an earlier day. If the same player is also poisoned, they still die.</p>`);
}
$('#guide').onclick=rules;
function landing() {
  root.className='';
  root.innerHTML=`<div class="landing"><section class="hero"><div class="eyebrow">A village full of secrets</div><h1>When night falls,<br><em>who will you<br>trust?</em></h1><p class="intro">A peaceful village. An ancient prophecy.<br>And werewolves hiding among you.<br>Gather your class. Let the story begin.</p><div class="hero-meta"><span><b>♙</b> 6–40 players</span><span><b>◷</b> Play together</span><span><b>◇</b> No accounts</span></div></section><section class="entry"><div class="tabset"><button class="tab ${mode==='join'?'active':''}" data-mode="join">Join a village</button><button class="tab ${mode==='host'?'active':''}" data-mode="host">Host a game</button></div><h2>${mode==='join'?'Your village awaits.':'Tell a new story.'}</h2><p>${mode==='join'?'Enter the code your host shared. Your secret role will be waiting when the game begins.':'Create a room, invite your players, and lead your village through the night.'}</p><form id="entry-form"><div class="field"><label for="name">${mode==='join'?'Your name':'Host name'}</label><input id="name" name="name" placeholder="What should we call you?" maxlength="24" autocomplete="nickname" required></div>${mode==='join'?`<div class="field"><label for="code">Village code</label><input id="code" class="code" name="code" placeholder="000000" inputmode="numeric" pattern="[0-9]{6}" maxlength="6" value="${escape(params.get('room')?.replace(/\D/g,'').slice(0,6)||'')}" required autocomplete="off"></div>`:''}<div id="entry-error" class="hidden error-box" role="alert"></div><button class="primary wide" type="submit">${mode==='join'?'Enter the village':'Create a village'} <span>→</span></button></form><div class="smallprint">${mode==='join'?'One code. One secret. A whole lot of suspicion.':'You control the pace. The village makes the choices.'}</div>${saved()?'<button id="restore" class="quiet restore">Return to your previous village →</button>':''}</section></div><section class="roles-preview"><p>Everyone has<br>a part to play.</p><div class="mini-roles">${Object.keys(roleNames).map(r=>`<a href="#handbook" class="mini-role" data-rules><img src="assets/${r}-icon.webp" alt="">${roleNames[r]}</a>`).join('')}</div></section>`;
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
  if(!API_URL)throw new Error('The village service is being prepared. Please return shortly.');
  const controller=new AbortController(), timeout=setTimeout(()=>controller.abort(),20000);
  try {
    const res=await fetch(API_URL,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...body,code:session.code,token:session.token}),signal:controller.signal,cache:'no-store'});
    const data=await res.json(); if(!res.ok){const e=new Error(data.error||'The village could not respond.');e.status=res.status;throw e;} return data;
  } catch(e) { if(e.name==='AbortError')throw new Error('The village is taking a little longer to respond. Your key is safe; please retry.'); throw e; }
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
  timer=setTimeout(async()=>{if(!document.hidden)await refresh();startPolling();},errors?Math.min(25000,6000*errors):(state?.host?3500:6000));
}
document.addEventListener('visibilitychange',()=>{
  reveal=false;
  if(modal.open)modal.close();
  if(state){if(document.hidden)renderRoom();else refresh(true);}
});
const playerName=id=>state.players.find(p=>p.id===id)?.name||'Nobody';
const link=screen=>`${location.origin}${location.pathname}?room=${state.code}${screen?'&screen=1':''}`;
function actionAvailable() { return !projector&&state.me?.canAct&&!state.me.acted&&state.phase!=='reveal'; }
function targetable(p) {
  if(!actionAvailable()||!p.alive||p.id===state.me.id)return false;
  if(state.phase==='werewolf'&&p.pack)return false;
  return ['fortune','werewolf','hunter','vote'].includes(state.phase);
}
function mapHtml() {
  const [title,copy,icon]=phases[state.phase]||phases.lobby;
  return `<section class="map-panel"><div class="phase-banner"><div><h2>${title}</h2><p>${copy}</p></div><span class="phase-icon" aria-hidden="true">${icon}</span></div><div class="village-map ${['day','vote','dusk','finished'].includes(state.phase)?'is-day':''}"><div class="houses">${state.players.map((p,i)=>`<button class="house ${p.alive?'':'dead'} ${p.id===state.me?.id&&!projector?'self':''} ${targetable(p)?'selectable':''} ${p.id===selected?'selected':''}" data-player="${p.id}" ${targetable(p)?'':'aria-disabled="true"'} aria-pressed="${p.id===selected}" aria-label="${escape(p.name)}, ${p.alive?'alive':'eliminated'}${targetable(p)?', choose player':''}"><img src="assets/house-${i%2}-${p.alive?'alive':'dead'}.webp" alt="" draggable="false"><span>${escape(p.name)}${p.id===state.me?.id&&!projector?' · you':''}<small>${state.phase==='finished'?roleNames[p.role]:!p.alive?'Eliminated':p.pack&&!projector?'<b class="packbadge">Your pack</b>':'Alive'}</small>${state.voteCounts?.[p.id]?`<small>${state.voteCounts[p.id]} vote${state.voteCounts[p.id]===1?'':'s'}</small>`:''}</span></button>`).join('')}</div>${!state.players.length?`<div class="map-empty"><h3>A quiet village.<br>For now.</h3><p>Share the village code. A new house will appear for every player who joins.</p></div>`:''}</div><div class="map-legend"><span>♙ ${state.players.filter(p=>p.alive).length} / ${state.players.length} villagers alive</span><span>${state.phase==='lobby'?'Waiting for the story to begin':state.day?`Day ${state.day} · ${NIGHT_PHASES.includes(state.phase)?'Nightfall':'The village'}`:'Keep your role secret'}</span></div></section>`;
}
const NIGHT_PHASES=['fortune','werewolf','girl','witch'];
function hostPanel() {
  if(!state.host||projector)return '';
  const p=state.progress, completed=p?.done===p?.total;
  const advanceLabel=state.phase==='reveal'?'Put the village to sleep':state.phase==='day'?(state.day===1?'Begin night two':'Open the vote'):state.phase==='dusk'?'Begin the next night':state.phase==='vote'?'Count the votes':'Continue the night';
  return `<section class="panel"><div class="eyebrow">The storyteller</div><h3>${state.phase==='lobby'?'Your village code':'Guide the village'}</h3>${state.phase==='lobby'?`<div class="code-large">${state.code}</div><span class="join-link">${escape(location.host+location.pathname)}</span><p>Students open this page and enter the code. You can narrate, or join the roster yourself.</p><button class="secondary wide" data-copy>Copy invitation link ↗</button><div class="toolbar-links"><a href="${link(true)}" target="_blank" rel="noopener">Open village screen ↗</a></div><div class="settings"><label>Werewolves <select id="wolves">${Array.from({length:13},(_,i)=>`<option value="${i}" ${state.settings.wolves===i?'selected':''}>${i||'Auto'}</option>`).join('')}</select></label>${['fortune','girl','witch','hunter'].map(r=>`<label>${roleNames[r]}<input type="checkbox" data-setting="${r}" ${state.settings[r]?'checked':''}></label>`).join('')}</div><p class="status-line">Auto: about one werewolf per four players. Minimum 6 players.</p><button class="primary wide" id="start">Deal the cards <span>→</span></button>${!state.me?'<button class="quiet" id="host-join">I’m playing too +</button>':''}`:state.phase==='finished'?`<p>${state.winner==='village'?'The villagers have uncovered the pack.':'The pack has taken control of the village.'}</p><button class="primary wide" id="reset">Play again with this village →</button>`:state.phase==='hunter'?`<p>Wait for ${escape(playerName(state.pendingHunter))} to choose a final target, or pass. The result will resolve automatically.</p>`:`<p>${state.phase==='day'&&state.day===1?'The first day is for discussion only. Voting will begin on day two.':state.phase==='day'?'Let the village talk. When everyone is ready, open the vote.':state.phase==='dusk'?'The vote has been counted. Read the village news before beginning the next night.':'Read the phase aloud. Only the active role should open their eyes. Wait for their actions, then continue.'}</p>${p&&p.total?`<div class="progress"><i style="width:${p.done/p.total*100}%"></i></div><p class="status-line">${p.done} / ${p.total} ${state.phase==='reveal'?'cards acknowledged':state.phase==='vote'?'votes received':'actions received'}</p>`:''}<button class="primary wide" id="advance" ${p&&p.total&&!completed?'disabled':''}>${advanceLabel} →</button>${p&&p.total&&!completed?'<div class="host-tools"><button class="quiet" id="force">Continue with missing actions…</button></div>':''}`}</section>`;
}
function mePanel() {
  if(projector)return '';
  const me=state.me;
  if(!me)return state.host?'':`<section class="panel"><h3>Watching the village</h3><p>${state.phase==='lobby'?'Join the roster to receive a card.':'This game has already started. You can watch this village.'}</p>${state.phase==='lobby'?'<button class="primary wide" id="join-roster">Join the players</button>':''}</section>`;
  if(state.phase==='lobby')return `<section class="panel"><div class="private-tag">Your place in the story</div><h3>Welcome, ${escape(playerName(me.id))}.</h3><p>Your house is ready. Wait for the host to deal your secret card.</p><button class="quiet" id="leave-roster">Leave the player roster</button></section>`;
  if(state.phase==='reveal')return `<section class="panel private-card"><div class="private-tag">✧ For your eyes only</div><h3>Your secret identity</h3>${reveal?`<img class="role-card" src="assets/${me.role}-card.webp" alt="Your ${roleNames[me.role]} card"><div class="role-title">${roleNames[me.role]}</div><p>${roleCopy[me.role]}</p>`:'<button class="card-back" id="reveal" aria-label="Reveal your secret card"></button><p>Make sure nobody is looking<br>over your shoulder.</p>'}<div class="reveal-tools">${reveal?'<button class="quiet" id="hide">Hide card</button>':''}${me.acted?'<p class="status-line">✓ Ready for nightfall</p>':reveal?'<button class="primary" id="ready">I know my role ✓</button>':''}</div></section>`;
  if(state.phase==='finished')return `<section class="panel private-card"><div class="private-tag">Your part in the story</div><img class="role-card" src="assets/${me.role}-card.webp" alt="${roleNames[me.role]}"><h3>${roleNames[me.role]}</h3><p>${me.alive?'You survived to see the truth.':'Your village will remember you.'}</p></section>`;
  const yourTurn=me.canAct&&!me.acted;
  let body='';
  if(!me.alive&&state.phase!=='hunter')body='<div class="sleep"><span class="moon">◇</span><h3>Your story lives on.</h3><p>You have been eliminated. Watch quietly and keep the village’s secrets.</p></div>';
  else if(!yourTurn)body=`<div class="sleep"><span class="moon">${NIGHT_PHASES.includes(state.phase)?'☾':'☀'}</span><h3>${me.acted?'Your choice is sealed.':NIGHT_PHASES.includes(state.phase)?'Close your eyes.':state.phase==='hunter'?'A final farewell.':'Time to talk.'}</h3><p>${me.acted?'Wait for the host to continue the story.':NIGHT_PHASES.includes(state.phase)?'The village is sleeping. Stay quiet until the host calls your role.':state.phase==='hunter'?'The hunter is choosing a final target.':'Who seems suspicious? Share your ideas with the village.'}</p></div>`;
  else if(state.phase==='girl')body='<h3>A glimpse in the dark?</h3><p class="action-prompt">Spying always reveals one werewolf to you. Flip heads to stay hidden; tails means that werewolf sees you too.</p><div class="action-buttons"><button class="primary" id="spy">Flip the coin ◈</button><button class="secondary" id="pass">Stay asleep</button></div>';
  else if(state.phase==='witch')body=`<h3>A choice of potions.</h3><p class="action-prompt">${me.victim?`The werewolves chose <b>${escape(playerName(me.victim))}</b> tonight.`:'The werewolves did not choose a victim tonight.'}</p><div class="witch-choice"><label><input type="checkbox" id="heal" ${!me.potions.heal||!me.victim?'disabled':''}>${me.potions.heal?'Use healing potion':'Healing potion used'}${me.victim?' · save the victim':''}</label><label for="poison">${me.potions.poison?'Poison a player (optional)':'Poison potion used'}</label><select id="poison" ${!me.potions.poison?'disabled':''}><option value="">Keep the potion</option>${state.players.filter(p=>p.alive).map(p=>`<option value="${p.id}">${escape(p.name)}</option>`).join('')}</select></div><button class="primary wide" id="cast">Seal my choice →</button>`;
  else body=`<h3>${state.phase==='fortune'?'Look beyond appearances.':state.phase==='werewolf'?'Choose the pack’s prey.':state.phase==='hunter'?'One final shot.':'Who do you suspect?'}</h3><p class="action-prompt">${state.phase==='fortune'?'Choose another living player’s house to learn their role privately.':state.phase==='werewolf'?'Choose a living player’s house. Your pack is marked. Only one victim can be attacked tonight.':state.phase==='hunter'?'Choose a living player’s house to take them with you, or pass.':'Choose a living player’s house to vote for them. You may also abstain.'}</p><p class="target-label" id="target-name">${selected?escape(playerName(selected)):'Choose a house in the village'}</p><div class="action-buttons"><button class="primary" id="confirm-target" ${selected?'':'disabled'}>${state.phase==='vote'?'Cast my vote':'Confirm choice'}</button>${state.phase!=='werewolf'?`<button class="secondary" id="pass">${state.phase==='vote'?'Abstain':'Pass'}</button>`:''}</div>`;
  return `<section class="panel"><div class="private-tag">✧ Your private view</div>${body}<div class="host-tools"><button class="quiet" id="peek-role">View my role</button></div>${me.notes?.length?`<details class="notes"><summary class="quiet">Your secret discoveries (${me.notes.length})</summary>${me.notes.slice().reverse().map(n=>`<div class="note"><small>NIGHT ${n.day}</small>${escape(n.text.replace(/\b(fortune|girl|witch|hunter|werewolf|villager)\b/g,m=>roleNames[m]))}</div>`).join('')}</details>`:''}</section>`;
}
function rosterPanel() {
  return `<section class="panel ${state.phase==='lobby'?'':'history'}"><h3>${state.phase==='lobby'?`The villagers · ${state.players.length}`:'Village chronicle'}</h3>${state.phase==='lobby'?`<p>${state.players.length<6?`${6-state.players.length} more player${6-state.players.length===1?'':'s'} needed to begin.`:'The village is ready for the cards.'}</p><div class="roster">${state.players.map(p=>`<span>${escape(p.name)}${state.host&&!projector?`<button data-kick="${p.id}" aria-label="Remove ${escape(p.name)}">×</button>`:''}</span>`).join('')}</div>`:`<ul class="log">${state.log.slice(-8).reverse().map(l=>`<li><small>${l.day?'DAY '+l.day:'THE PROPHECY'}</small>${escape(l.text)}</li>`).join('')}</ul>`}</section>`;
}
function renderRoom() {
  if(!state)return;
  const phaseChanged=lastPhase!==state.phaseId;
  if(phaseChanged){selected=null;reveal=false;lastPhase=state.phaseId;if(modal.open)modal.close();}
  root.className=projector?'projector':'';
  root.innerHTML=`<div class="room-head"><div><div class="eyebrow">${state.phase==='lobby'?'Gather your village':state.phase==='finished'?'The end of this tale':`Chapter ${state.day||'one'} · ${NIGHT_PHASES.includes(state.phase)?'Night':'Village'}`}</div><h1>${state.phase==='lobby'?'Every house holds a story.':state.phase==='finished'?(state.winner==='village'?'The village is safe.':'The pack has prevailed.'):'A village full of secrets.'}</h1></div><div class="room-tools"><button class="room-code" data-copy title="Copy invitation link">${state.code}</button><span class="live-dot">${projector?'Village screen':state.host?'Host connected':'Village connected'}</span><button class="quiet" id="home">Leave this view</button></div></div>${state.phase==='finished'?`<div class="success-banner"><h2>${state.winner==='village'?'The prophecy is broken.':'The night belongs to the wolves.'}</h2><p>All roles are revealed below. ${state.host&&!projector?'Start another game when your village is ready.':'Thanks for playing, villagers.'}</p></div>`:''}<div class="room-layout">${mapHtml()}<aside class="sidebar">${mePanel()}${hostPanel()}${rosterPanel()}</aside></div>`;
  wireRoom();
  if(phaseChanged)window.scrollTo({top:0,behavior:'smooth'});
}
const act = extra => send({type:'action',phaseId:state.phaseId,...extra});
function wireRoom() {
  root.querySelectorAll('[data-copy]').forEach(b=>b.onclick=async()=>{try{await navigator.clipboard.writeText(link(false));toast('Invitation link copied. Share it with your village.');}catch{showModal(`<h3>Invite your village</h3><p class="guide-intro">Village code: <b>${state.code}</b></p><input readonly value="${escape(link(false))}" onfocus="this.select()">`);}});
  $('#home').onclick=()=>{clearTimeout(timer);state=null;reveal=false;lastPhase=null;landing();history.replaceState(null,'',location.pathname);};
  root.querySelectorAll('[data-player]').forEach(b=>b.onclick=()=>{const p=state.players.find(p=>p.id===b.dataset.player);if(!targetable(p))return;selected=p.id;root.querySelectorAll('[data-player]').forEach(x=>{x.classList.toggle('selected',x.dataset.player===selected);x.setAttribute('aria-pressed',String(x.dataset.player===selected));});$('#target-name').textContent=p.name;$('#confirm-target').textContent=state.phase==='vote'?`Vote for ${p.name}`:`Choose ${p.name}`;$('#confirm-target').disabled=false;});
  $('#reveal')?.addEventListener('click',()=>{reveal=true;renderRoom();});
  $('#hide')?.addEventListener('click',()=>{reveal=false;renderRoom();});
  $('#ready')?.addEventListener('click',()=>{reveal=false;send({type:'ready',phaseId:state.phaseId});});
  $('#peek-role')?.addEventListener('click',()=>showModal(`<div class="private-tag">For your eyes only</div><h2>${roleNames[state.me.role]}</h2><img class="role-card" src="assets/${state.me.role}-card.webp" alt="Your role card"><p class="guide-intro">${roleCopy[state.me.role]}</p>`));
  $('#spy')?.addEventListener('click',async()=>{if(await act({spy:true})){const n=state.me.notes.at(-1);if(n)showModal(`<div class="eyebrow">A secret in the moonlight</div><h2 style="margin-top:18px">${n.text.startsWith('Heads')?'Heads. Hidden.':'Tails. Discovered.'}</h2><p class="guide-intro">${escape(n.text)}</p><p>Keep this discovery to yourself until daylight.</p>`);}});
  $('#pass')?.addEventListener('click',()=>state.phase==='vote'?send({type:'vote',phaseId:state.phaseId,target:null}):act({}));
  $('#confirm-target')?.addEventListener('click',async()=>{if(!selected)return;const phase=state.phase;if(await send({type:phase==='vote'?'vote':'action',phaseId:state.phaseId,target:selected})){if(phase==='fortune'){const n=state.me.notes.at(-1);if(n)showModal(`<div class="eyebrow">Only you know</div><h2 style="margin-top:18px">A truth is revealed.</h2><p class="guide-intro">${escape(n.text.replace(/\b(fortune|girl|witch|hunter|werewolf|villager)\b/g,m=>roleNames[m]))}</p>`);}else toast('Your choice is sealed.');}});
  $('#cast')?.addEventListener('click',()=>act({heal:$('#heal').checked,poison:$('#poison').value||null}));
  $('#start')?.addEventListener('click',()=>send({type:'start'}));
  $('#advance')?.addEventListener('click',()=>send({type:'advance',phaseId:state.phaseId}));
  $('#force')?.addEventListener('click',()=>{showModal('<h2>Continue without everyone?</h2><p class="guide-intro">Missing actions will be treated as passes. Missing votes will be left uncounted. This cannot be undone.</p><button class="primary" id="force-confirm">Continue the story</button>');$('#force-confirm').onclick=()=>{modal.close();send({type:'advance',phaseId:state.phaseId,force:true});};});
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
