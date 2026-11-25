export const MAX_PLAYERS = 36;
export const COLORS = ['#182630','#ffffff','#e95042','#f0942e','#f4cb4c','#3cac72','#21aebb','#5084ef','#7958ce','#ed75aa','#875538','#a9a7a0'];
const words = {
  en: 'apple|backpack|balloon|banana|basket|bicycle|blanket|book|bridge|bus|butterfly|cactus|camera|campfire|candle|carrot|castle|cat|chair|cherry|cloud|compass|cookie|crown|cupcake|dinosaur|doctor|dog|door|dragon|drum|duck|eagle|earth|elephant|fan|fire truck|fish|flag|flower|football|frog|garden|ghost|giraffe|glasses|guitar|hammer|hat|helicopter|horse|ice cream|island|jellyfish|keyboard|kite|ladder|lamp|laptop|leaf|lemon|lighthouse|lion|map|mermaid|microphone|monkey|moon|mountain|mushroom|octopus|orange|owl|paintbrush|panda|paper airplane|parrot|pear|pencil|penguin|piano|pizza|planet|rainbow|robot|rocket|roller skates|sailboat|sandcastle|scissors|shark|shoe|skateboard|snowman|spider|starfish|submarine|suitcase|sunflower|sunglasses|swing|telescope|thunderstorm|tiger|toothbrush|torch|tractor|train|tree|trophy|turtle|umbrella|volcano|waterfall|whale|windmill|zebra',
  es: 'abeja|aguacate|avioneta|ballena|barco|bicicleta|bosque|bruja|caballo|cactus|café|cámara|camión|campana|cangrejo|caracol|castillo|cebolla|cebra|cerdo|chocolate|cocodrilo|cohete|conejo|corazón|corona|delfín|dragón|elefante|escalera|escoba|espada|estrella|fantasma|faro|flor|fresa|gallina|gato|girasol|globo|gorra|guitarra|helado|hormiga|iglesia|jirafa|lámpara|lápiz|león|limón|llave|loro|luna|maleta|manzana|mariposa|martillo|medusa|micrófono|mono|montaña|moto|muñeco de nieve|nube|ojo|oso|palmera|pan|paraguas|pato|pelota|perro|pez|piano|pingüino|pirámide|pizza|plátano|pulpo|raqueta|regalo|reloj|rinoceronte|robot|sandía|semáforo|serpiente|silla|sombrero|submarino|tambor|teléfono|telescopio|tiburón|tigre|tijeras|tortuga|tren|trofeo|vela|ventana|volcán|zanahoria|zapato'
};
export class GameError extends Error {
  constructor(message, status = 400) { super(message); this.status = status; }
}
function requireThat(condition, message, status) {
  if (!condition) throw new GameError(message, status);
}
const plain = (value, max) => typeof value === 'string' ? value.trim().replace(/\s+/g, ' ').slice(0, max) : '';
const normalized = value => plain(value, 200).normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
const between = (value, fallback, min, max) => Number.isInteger(value) ? Math.max(min, Math.min(max, value)) : fallback;
// Custom portraits encode three choices of eight, starting at 1000. Keep legacy artwork IDs.
const avatarId = value => Number.isInteger(value) && value >= 1000 && value < 1512 ? value : between(value, 0, 0, 11);
const playerById = (state, id) => state.players.find(player => player.id === id);
const playing = state => state.players.filter(player => !player.removed);
const addMessage = (state, message) => {
  state.messages.push({ id: ++state.messageId, ...message });
  if (state.messages.length > 70) state.messages.shift();
};
export function createRoom(code, host, name, input = {}, now = Date.now()) {
  const nickname = plain(name, 24);
  requireThat(nickname, 'Enter a nickname.');
  return {
    code, host, name: nickname + '’s room', version:0, phase:'lobby', turnId:0, round:0, drawer:null,
    players:[{ id:'p1', key:host, name:nickname, avatar:avatarId(input.avatar), score:0 }],
    nextPlayer:2, messages:[], messageId:0, receipts:[], bans:[], reports:[], kickVotes:{},
    listed:input.listed === true, settings:settings(input), expiresAt:now+86400000,
    board:[], boardVersion:0, pointCount:0, used:[], options:[], answer:'', deadline:0
  };
}
function settings(input) {
  const custom = [...new Map(String(input.custom || '').slice(0, 4000).split(/[,\n]/)
    .map(entry => plain(entry, 40)).filter(word => /\p{L}/u.test(word))
    .map(word => [normalized(word),word])).values()].slice(0,120);
  const config = {
    capacity:between(input.capacity,36,2,36), rounds:between(input.rounds,3,1,10),
    seconds:between(input.seconds,70,20,150), choices:between(input.choices,3,1,5),
    hints:between(input.hints,2,0,5), language:input.language === 'es' ? 'es' : 'en',
    hintStyle:['letters','shape','mystery'].includes(input.hintStyle) ? input.hintStyle : 'letters',
    custom, customOnly:input.customOnly === true
  };
  requireThat(!config.customOnly || custom.length >= config.choices, 'Add at least as many custom words as choices.');
  return config;
}
function beginTurn(state, now, random) {
  state.drawer = state.queue.shift();
  state.turnId++;
  state.phase = 'choose';
  state.deadline = now + 15000;
  state.board = [];
  state.pointCount = 0;
  state.boardVersion++;
  state.guessed = [];
  state.answer = '';
  const {custom,customOnly,language,choices} = state.settings;
  const pool = [...new Map([...custom,...(customOnly?[]:words[language].split('|'))].map(word=>[normalized(word),word])).values()];
  const remaining = pool.filter(word=>!state.used.includes(word));
  const candidates = remaining.length >= choices ? remaining : pool;
  state.options = [];
  for (let i=0; i<choices && candidates.length; i++) state.options.push(candidates.splice(Math.floor(random()*candidates.length),1)[0]);
}
function startDrawing(state, index, now) {
  state.answer = state.options[index];
  state.used = [...state.used,state.answer].slice(-240);
  state.options = [];
  state.phase = 'draw';
  state.started = now;
  state.deadline = now + state.settings.seconds * 1000;
}
function endTurn(state, now) {
  state.phase = 'reveal';
  state.deadline = now+4500;
}
function afterReveal(state, now, random) {
  state.queue = state.queue.filter(id=>!playerById(state,id)?.removed);
  if (!state.queue.length) {
    if (state.round >= state.settings.rounds || playing(state).length < 2) {
      state.phase = 'finished'; state.deadline = 0; return;
    }
    state.round++;
    state.queue = playing(state).map(player=>player.id);
  }
  beginTurn(state,now,random);
}
function mask(state, now) {
  if (state.settings.hintStyle === 'mystery') return '';
  const letters = Array.from(state.answer);
  const count = state.settings.hintStyle === 'letters' ? Math.min(state.settings.hints,Math.floor(Math.max(0,now-state.started)* (state.settings.hints+1)/(state.settings.seconds*1000))) : 0;
  const positions = letters.flatMap((letter,i) => /[\p{L}\p{N}]/u.test(letter) ? [i] : []);
  const revealed = new Set(positions.filter((_,i)=>i<count && i<positions.length-1));
  return letters.map((letter,i)=>positions.includes(i)&&!revealed.has(i)?'_':letter).join(' ');
}
export function needsTick(state, now = Date.now()) {
  return state.deadline > 0 && now >= state.deadline;
}
function tick(state, now, random) {
  if (!needsTick(state,now)) return false;
  if (state.phase === 'choose') startDrawing(state,0,now);
  else if (state.phase === 'draw') endTurn(state,now);
  else if (state.phase === 'reveal') afterReveal(state,now,random);
  else return false;
  return true;
}
function finishIfEveryoneGuessed(state, now) {
  if (playing(state).filter(p=>p.id!==state.drawer).every(p=>state.guessed.includes(p.id))) endTurn(state,now);
}
function remove(state, player, ban, now, random) {
  player.removed = true;
  if (ban) state.bans.push(player.key);
  delete state.kickVotes[player.id];
  if (player.key === state.host) state.host = playing(state)[0]?.key || '';
  addMessage(state,{kind:'system',text:player.name+' left the room.'});
  if (playing(state).length < 2 && !['lobby','finished'].includes(state.phase)) {
    state.phase = 'finished'; state.deadline = 0;
  } else if (state.drawer === player.id && state.phase === 'choose') {
    afterReveal(state,now,random);
  } else if (state.drawer === player.id && state.phase === 'draw') {
    endTurn(state,now);
  } else if (state.phase === 'draw') finishIfEveryoneGuessed(state,now);
}
function draw(state, input) {
  requireThat(Array.isArray(input.ops) && input.ops.length > 0 && input.ops.length <= 24,'Invalid drawing update.');
  for (const op of input.ops) {
    requireThat(op && typeof op === 'object','Invalid drawing update.');
    if (op.kind === 'clear') {
      state.board = []; state.pointCount = 0; continue;
    }
    if (op.kind === 'undo') {
      const last = state.board.at(-1);
      if (last) {
        while (state.board.at(-1)?.id === last.id) state.pointCount -= state.board.pop().points.length/2;
      }
      continue;
    }
    requireThat(['stroke','fill'].includes(op.kind) && COLORS.includes(op.color) && typeof op.id === 'string' && /^[\w-]{1,32}$/.test(op.id),'Invalid drawing tool.');
    const points = op.points;
    requireThat(Array.isArray(points) && points.length >= 2 && points.length <= 240 && points.length%2 === 0 && points.every(n=>Number.isInteger(n)&&n>=0&&n<=1000),'Invalid drawing coordinates.');
    requireThat(op.kind !== 'fill' || points.length === 2,'Invalid fill point.');
    requireThat(state.board.length < 1600 && state.pointCount+points.length/2 <= 18000,'Canvas limit reached. Undo or clear to continue.');
    state.board.push({ id:op.id, kind:op.kind, color:op.color, width:between(op.width,6,2,42), points });
    state.pointCount+=points.length/2;
  }
  state.boardVersion++;
}
export function command(current, key, input, now=Date.now(), random=Math.random) {
  const state=structuredClone(current);
  const type=input.type;
  requireThat(typeof input.requestId === 'string' && /^[\w-]{8,80}$/.test(input.requestId),'Invalid request.');
  const receipt=key+':'+input.requestId;
  if(state.receipts.includes(receipt)) return current;
  const actor=state.players.find(player=>player.key===key&&!player.removed);
  const host=key===state.host;
  if(type==='tick') {
    if(!tick(state,now,random)) return current;
  } else if(type==='join') {
    if(actor) return current;
    requireThat(!state.bans.includes(key),'You were banned from this room.',403);
    requireThat(state.host && playing(state).length, 'This room is closed.', 410);
    requireThat(playing(state).length<state.settings.capacity,'This room is full.',409);
    requireThat(state.players.length<160,'This lobby has reached its join limit.',409);
    const name=plain(input.name,24);
    requireThat(name,'Enter a nickname.');
    requireThat(!playing(state).some(p=>normalized(p.name)===normalized(name)),'That nickname is already in use.');
    const player = { id:'p'+state.nextPlayer++, key, name, avatar:avatarId(input.avatar), score:0 };
    state.players.push(player);
    if (['choose','draw','reveal'].includes(state.phase)) state.queue.push(player.id);
    addMessage(state,{kind:'system',text:name+' joined.'});
  } else {
    requireThat(actor,'Join this room first.',403);
    if(type==='settings') {
      requireThat(host&&state.phase==='lobby','Only the host can change lobby settings.',403);
      const next=settings(input);
      requireThat(next.capacity>=playing(state).length,'Capacity cannot be below the current player count.');
      state.settings=next;
    } else if(type==='start') {
      requireThat(host && state.phase==='lobby','Only the host can start a game.',403);
      requireThat(playing(state).length>=2,'At least 2 players are needed.');
      state.round=1;
      state.queue=playing(state).map(p=>p.id);
      beginTurn(state,now,random);
    } else if(type==='reset') {
      requireThat(host&&state.phase==='finished','Only the host can open a rematch.',403);
      state.phase='lobby';state.round=0;state.board=[];state.boardVersion++;state.pointCount=0;
      state.used=[];state.answer='';state.drawer=null;state.guessed=[];state.deadline=0;
      for(const player of state.players) player.score=0;
    } else if(type==='leave') {
      remove(state,actor,false,now,random);
    } else if(['kick','ban','voteKick','report'].includes(type)) {
      const target=playerById(state,input.target);
      requireThat(target&&!target.removed&&target.id!==actor.id,'Choose another player.');
      if(type==='report') {
        requireThat(!state.reports.some(r=>r.by===actor.id&&r.target===target.id),'You already reported this player.');
        state.reports.push({by:actor.id,target:target.id,reason:plain(input.reason,100)||'Disruptive behavior'});
        state.reports=state.reports.slice(-60);
      } else if(type==='voteKick') {
        requireThat(target.key!==state.host,'The host cannot be removed by a vote.');
        const votes=state.kickVotes[target.id]||=[];
        requireThat(!votes.includes(actor.id),'Your vote is already recorded.');
        votes.push(actor.id);
        if(votes.filter(id=>!playerById(state,id)?.removed).length>=Math.max(2,Math.ceil((playing(state).length-1)/2))) remove(state,target,true,now,random);
      } else {
        requireThat(host,'Only the host can remove a player.',403);
        remove(state,target,type==='ban',now,random);
      }
    } else {
      const inDrawing = type==='choose'||type==='paint'||type==='guess'||(type==='chat'&&state.phase==='draw');
      if(inDrawing) requireThat(input.turnId===state.turnId && now<state.deadline,'That turn has ended.',409);
      if(type==='choose') {
        requireThat(state.phase==='choose'&&state.drawer===actor.id,'Only the artist can choose.',403);
        requireThat(Number.isInteger(input.index)&&!!state.options[input.index],'Choose a word.');
        startDrawing(state,input.index,now);
      } else if(type==='paint') {
        requireThat(state.phase==='draw'&&state.drawer===actor.id,'Only the current artist can draw.',403);
        draw(state,input);
      } else if(type==='guess'||type==='chat') {
        const message=plain(input.text,140);
        requireThat(message,'Enter a message.');
        requireThat(now-(actor.lastMessage||0)>=650,'Wait a moment before sending another message.',429);
        actor.lastMessage=now;
        if(state.phase==='draw') {
          const playable=actor.id!==state.drawer&&!state.guessed.includes(actor.id);
          if(type==='guess') requireThat(playable,'You have already guessed or are drawing.');
          const correct=normalized(message)===normalized(state.answer);
          if(correct&&playable) {
            const secondsLeft=Math.max(0,state.deadline-now)/1000;
            const points=100+Math.round(100*secondsLeft/state.settings.seconds);
            actor.score+=points;
            playerById(state,state.drawer).score+=50;
            state.guessed.push(actor.id);
            addMessage(state,{kind:'solved',player:actor.id,text:actor.name+' guessed it!'});
            finishIfEveryoneGuessed(state,now);
          } else if(correct || actor.id===state.drawer || state.guessed.includes(actor.id)) {
            throw new GameError('Chat is available again after this drawing.');
          } else addMessage(state,{kind:'guess',player:actor.id,name:actor.name,text:message});
        } else {
          requireThat(type==='chat','Guessing is closed.',409);
          addMessage(state,{kind:'chat',player:actor.id,name:actor.name,text:message});
        }
      } else throw new GameError('Unknown action.');
    }
  }
  state.receipts=[...state.receipts,receipt].slice(-160);
  state.version++;
  return state;
}
export function publicLobby(state) {
  if(!state.listed||!state.host||state.phase==='finished'||playing(state).length>=state.settings.capacity) return null;
  return {code:state.code,name:state.name,players:playing(state).length,capacity:state.settings.capacity,language:state.settings.language,inProgress:state.phase!=='lobby'};
}
export function view(state,key,{boardVersion=-1,now=Date.now()}={}) {
  const actor=playing(state).find(p=>p.key===key);
  const host=!!actor&&key===state.host;
  const artist=!!actor&&actor.id===state.drawer;
  const {custom,...publicSettings}=state.settings;
  return {
    code:state.code,name:state.name,version:state.version,boardVersion:state.boardVersion,
    ...(boardVersion===state.boardVersion?{}:{board:state.board}),
    phase:state.phase,turnId:state.turnId,round:state.round,deadline:state.deadline,serverTime:now,drawer:state.drawer,
    players:playing(state).map(({id,name,avatar,score})=>({id,name,avatar,score,solved:state.guessed?.includes(id)||false})),
    messages:state.messages,me:actor?.id||null,host,listed:state.listed,
    settings:host?state.settings:publicSettings,
    ...(host?{reports:state.reports}:{}),
    ...(artist&&state.phase==='choose'?{options:state.options}:{}),
    ...(state.phase==='reveal'||state.phase==='finished'||artist&&state.phase==='draw'?{answer:state.answer}:{}),
    ...(state.phase==='draw'?{mask:mask(state,now)}:{})
  };
}
