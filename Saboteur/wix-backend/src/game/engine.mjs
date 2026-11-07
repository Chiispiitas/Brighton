import { CARD_DEFS, DECK, GOLD_VALUES, TOOLS, cardGroups, makeCard } from './cards.mjs';
export { CARD_DEFS, DECK, GOLD_VALUES, TOOLS, cardGroups } from './cards.mjs';
export const MIN_PLAYERS = 3;
export const MAX_PLAYERS = 10;
export const RULES_EDITION = 'AMIGO original base game, English v4.0 (2025)';
export class GameError extends Error {
  constructor(message, status = 400) { super(message); this.name = 'GameError'; this.status = status; }
}
const need = (condition, message, status) => { if (!condition) throw new GameError(message, status); };
const edges = ['n','e','s','w'];
const vectors = { n: [0,-1], e: [1,0], s: [0,1], w: [-1,0] };
const opposite = { n: 's', e: 'w', s: 'n', w: 'e' };
const atKey = (x,y) => `${x},${y}`;
const player = (s,id) => s.players.find(p => p.id === id);
const event = (s,text) => { s.log.push({ round: s.round, text }); s.log = s.log.slice(-50); };
const open = cell => (cell.groups || []).flat();
const shuffle = (cards,random) => {
  const copy = [...cards];
  for (let i = copy.length - 1; i > 0; i--) {
    const r = random(); need(Number.isFinite(r) && r >= 0 && r < 1, 'Invalid random source.');
    const j = Math.floor(r * (i+1)); [copy[i],copy[j]] = [copy[j],copy[i]];
  }
  return copy;
};
export function cleanName(value) {
  need(typeof value === 'string', 'Enter your name.');
  const name = value.trim().replace(/\s+/g,' ');
  need(name.length >= 1 && name.length <= 24 && !/[\x00-\x1f<>]/.test(name), 'Use 1–24 characters without angle brackets.');
  return name;
}
export function rolePool(count) {
  need(Number.isInteger(count) && count >= 3 && count <= 10, 'Use 3–10 players.');
  const saboteurs = count <= 4 ? 1 : count <= 6 ? 2 : count <= 9 ? 3 : 4;
  return [...Array(saboteurs).fill('saboteur'), ...Array(count + 1 - saboteurs).fill('miner')];
}
export function createRoom(code, hash, name, now = Date.now(), mode = 'online') {
  need(/^\d{6}$/.test(code), 'Enter a six-digit room code.');
  need(typeof hash === 'string' && hash.length > 0, 'Your room key is missing.', 401);
  need(['online','classroom'].includes(mode), 'Choose Online or Classroom.');
  return { code, host: hash, hostName: cleanName(name), mode, version: 0, phase: 'lobby', round: 0,
    players: [], board: [], deck: [], discard: [], bank: [], unusedRole: null, turnId: null,
    result: null, history: [], goldChoice: null, log: [], receipts: [], expiresAt: now + 86400000 };
}
// Reachable ports, rather than cells: disconnected dead-end arms never bridge a tunnel.
export function reachablePorts(state) {
  const board = state.board || [], cells = new Map(board.map(c => [atKey(c.x,c.y),c]));
  const reached = new Set(), queue = [];
  const visit = (cell,edge) => {
    for (const group of cell.groups || []) if (group.includes(edge)) for (const port of group) {
      const key = `${cell.x},${cell.y}:${port}`;
      if (!reached.has(key)) { reached.add(key); queue.push([cell,port]); }
    }
  };
  const start = cells.get('0,0');
  if (start) for (const edge of open(start)) visit(start,edge);
  for (let i = 0; i < queue.length; i++) {
    const [cell,edge] = queue[i], [dx,dy] = vectors[edge];
    const neighbor = cells.get(atKey(cell.x+dx,cell.y+dy));
    if (neighbor && !(neighbor.kind === 'goal' && !neighbor.revealed) && open(neighbor).includes(opposite[edge])) visit(neighbor,opposite[edge]);
  }
  return reached;
}
export function placementError(state, card, x, y, rotation = 0) {
  if (!Number.isInteger(x) || !Number.isInteger(y) || Math.abs(x) > 75 || Math.abs(y) > 75) return 'Choose a space on the board.';
  if (![0,180].includes(rotation)) return 'Rotate a card by 180° only.';
  const def = typeof card === 'string' ? CARD_DEFS[card] : card;
  if (def?.kind !== 'path') return 'Choose a tunnel card.';
  const board = state.board || [], cells = new Map(board.map(c => [atKey(c.x,c.y),c]));
  if (cells.has(atKey(x,y))) return 'That space is occupied.';
  const ports = cardGroups(def,rotation).flat(), reachable = reachablePorts(state);
  let connected = false;
  for (const edge of edges) {
    const [dx,dy] = vectors[edge], neighbor = cells.get(atKey(x+dx,y+dy));
    if (!neighbor || neighbor.kind === 'goal' && !neighbor.revealed) continue;
    const ours = ports.includes(edge), theirs = open(neighbor).includes(opposite[edge]);
    if (ours !== theirs) return 'All touching tunnel edges must match.';
    if (ours && reachable.has(`${neighbor.x},${neighbor.y}:${opposite[edge]}`)) connected = true;
  }
  return connected ? null : 'Connect this tunnel to the entrance by an unbroken path.';
}
export function legalPlacements(state, card, rotation = 0) {
  const candidates = new Map();
  for (const cell of state.board || []) for (const edge of edges) {
    const [dx,dy] = vectors[edge], x = cell.x+dx, y = cell.y+dy;
    candidates.set(atKey(x,y),{x,y,rotation});
  }
  return [...candidates.values()].filter(({x,y}) => !placementError(state,card,x,y,rotation));
}
function startRound(s,random,firstId) {
  s.round++; s.lastPlacement = null;
  if (s.round > 1) s.bank = shuffle(s.bank,random);
  const roles = shuffle(rolePool(s.players.length),random); s.unusedRole = roles.pop();
  s.deck = shuffle(DECK.map((defId,i) => makeCard(defId,`r${s.round}-c${i}`)),random);
  s.discard = []; s.result = null; s.goldChoice = null; s.turnId = firstId; s.phase = 'playing';
  const count = s.players.length <= 5 ? 6 : s.players.length <= 7 ? 5 : 4;
  for (const [i,p] of s.players.entries()) {
    p.role = roles[i]; p.broken = []; p.notes = []; p.hand = s.deck.splice(-count);
  }
  const goals = shuffle([
    { gold: true, groups: [['n','e','s','w']] },
    { gold: false, groups: [['n','w']] },
    { gold: false, groups: [['n','e']] }
  ],random);
  s.board = [{ x: 0, y: 0, kind: 'start', defId: 'cross', rotation: 0, groups: [['n','e','s','w']] },
    ...goals.map((goal,i) => ({ ...goal, id: `goal-${i}`, kind: 'goal', x: 8, y: (i-1)*2, rotation: 0, revealed: false }))];
  event(s,`Round ${s.round}. ${player(s,firstId).name} starts.`);
}
function revealReachedGoals(s) {
  let revealed = true;
  while (revealed) {
    revealed = false;
    const reached = reachablePorts(s);
    for (const goal of s.board.filter(c => c.kind === 'goal' && !c.revealed)) {
      const entries = edges.filter(edge => {
        const [dx,dy] = vectors[edge];
        return reached.has(`${goal.x+dx},${goal.y+dy}:${opposite[edge]}`);
      });
      if (!entries.length) continue;
      const original = goal.groups;
      const rotations = [0,180].map(rotation => {
        const groups = cardGroups({groups:original},rotation), ports = groups.flat();
        const incoming = entries.filter(edge => ports.includes(edge)).length;
        let matches = 0;
        for (const edge of edges) {
          const [dx,dy] = vectors[edge], neighbor = s.board.find(c => c.x === goal.x+dx && c.y === goal.y+dy);
          if (neighbor && !(neighbor.kind === 'goal' && !neighbor.revealed) && ports.includes(edge) === open(neighbor).includes(opposite[edge])) matches++;
        }
        return {rotation,groups,incoming,matches};
      }).filter(r => r.incoming > 0).sort((a,b) => b.incoming-a.incoming || b.matches-a.matches);
      const chosen = rotations[0]; goal.rotation = chosen.rotation; goal.groups = chosen.groups; goal.revealed = true;
      event(s,goal.gold ? 'The gold has been found.' : 'A goal contains stone.'); revealed = true;
      if (goal.gold) return true;
    }
  }
  return false;
}
function goldCombination(bank,value) {
  // Prefer the fewest cards; preserve small denominations for later exact payouts.
  for (let size = 1; size <= value; size++) {
    const search = (start,left,chosen,total) => {
      if (left === 0) return total === value ? chosen : null;
      if (total >= value) return null;
      for (let i = start; i < bank.length; i++) {
        const result = search(i+1,left-1,[...chosen,bank[i]],total+bank[i].value);
        if (result) return result;
      }
      return null;
    };
    const result = search(0,size,[],0); if (result) return result;
  }
  throw new GameError('The gold bank cannot make this reward. Contact the host.', 500);
}
function closeRound(s) {
  s.goldChoice = null; s.turnId = null; s.phase = s.round === 3 ? 'finished' : 'roundEnd';
  s.history.push({ ...s.result, roles: s.players.map(p => ({id:p.id,role:p.role})) });
  if (s.phase === 'finished') event(s,'Three rounds complete. Reveal the gold.');
}
function endRound(s,winner,lastActorId) {
  s.lastActorId = lastActorId; s.turnId = null;
  s.result = { winner, finderId: winner === 'miners' ? lastActorId : null, reason: winner === 'miners' ? 'gold' : 'exhausted', round: s.round };
  event(s,winner === 'miners' ? 'The gold miners win this round.' : 'The saboteurs win this round.');
  if (winner === 'saboteurs') {
    const saboteurs = s.players.filter(p => p.role === 'saboteur');
    const amount = saboteurs.length === 1 ? 4 : saboteurs.length < 4 ? 3 : 2;
    for (const p of saboteurs) {
      const reward = goldCombination(s.bank,amount); p.gold.push(...reward);
      const ids = new Set(reward.map(c => c.id)); s.bank = s.bank.filter(c => !ids.has(c.id));
    }
    closeRound(s); return;
  }
  const miners = s.players.filter(p => p.role === 'miner'), finderIndex = s.players.findIndex(p => p.id === lastActorId);
  const order = [];
  for (let i = 0; i < s.players.length; i++) {
    const p = s.players[(finderIndex-i+s.players.length)%s.players.length];
    if (p.role === 'miner') order.push(p.id);
  }
  need(s.bank.length >= miners.length, 'The gold bank is exhausted.', 500);
  const options = s.bank.splice(-miners.length);
  s.goldChoice = { playerId: order[0], order, options }; s.phase = 'gold';
}
function finishTurn(s,actor,won) {
  if (won) { endRound(s,'miners',actor.id); return; }
  if (s.deck.length) actor.hand.push(s.deck.pop());
  s.lastActorId = actor.id;
  if (!s.players.some(p => p.hand.length)) { endRound(s,'saboteurs',actor.id); return; }
  const current = s.players.findIndex(p => p.id === actor.id);
  for (let offset = 1; offset <= s.players.length; offset++) {
    const p = s.players[(current+offset)%s.players.length];
    if (p.hand.length) { s.turnId = p.id; break; }
  }
}
export function command(inputState, hash, cmd, random = Math.random) {
  const s = structuredClone(inputState);
  need(cmd && typeof cmd.type === 'string', 'Choose an action.');
  need(typeof hash === 'string' && hash.length > 0, 'Your room key is missing.', 401);
  need(typeof cmd.requestId === 'string' && /^[a-zA-Z0-9-]{8,80}$/.test(cmd.requestId), 'Invalid action identifier.');
  if (s.receipts.includes(`${hash}:${cmd.requestId}`)) return s;
  const host = hash === s.host, actor = s.players.find(p => p.key === hash);
  // Joining is commutative and can be retried after another player joins. Every other
  // command is bound to the exact snapshot the caller confirmed.
  if (cmd.type !== 'join') need(Number.isInteger(cmd.expectedVersion) && cmd.expectedVersion === s.version, 'The room changed. Review the current turn and try again.', 409);
  if (cmd.type === 'join') {
    need(s.phase === 'lobby', 'This game has started. Return using your saved room key.');
    if (!actor) {
      need(s.players.length < MAX_PLAYERS, 'This room is full (10 players).');
      const name = cleanName(cmd.name);
      need(!s.players.some(p => p.name.toLocaleLowerCase() === name.toLocaleLowerCase()), 'That name is taken. Add an initial.');
      s.players.push({ id: `p${s.version+1}`, key: hash, name, role: null, hand: [], broken: [], notes: [], gold: [] });
      event(s,`${name} joined.`);
    }
  } else if (cmd.type === 'leave') {
    need(s.phase === 'lobby' && actor, 'Leave your seat before the game starts.');
    s.players = s.players.filter(p => p.id !== actor.id);
  } else if (cmd.type === 'kick') {
    need(host && s.phase === 'lobby', 'Only the host can remove a player in the lobby.', 403);
    need(player(s,cmd.target), 'Choose a player.'); s.players = s.players.filter(p => p.id !== cmd.target);
  } else if (cmd.type === 'start') {
    need(host && s.phase === 'lobby', 'Only the host can start the game.', 403);
    need(s.players.length >= MIN_PLAYERS && s.players.length <= MAX_PLAYERS, 'Use 3–10 players.');
    const first = cmd.firstPlayerId || s.players[0].id; need(player(s,first), 'Choose the first player.');
    s.bank = shuffle(GOLD_VALUES.map((value,i) => ({ id:`gold-${i}`, value })),random);
    startRound(s,random,first);
  } else if (cmd.type === 'nextRound') {
    need(host && s.phase === 'roundEnd' && s.round < 3, 'Only the host can start the next round.', 403);
    const last = s.players.findIndex(p => p.id === s.lastActorId);
    startRound(s,random,s.players[(last+1)%s.players.length].id);
  } else if (cmd.type === 'rematch') {
    need(host && s.phase === 'finished', 'A rematch is available after three rounds.', 403);
    s.lastPlacement = null; s.phase = 'lobby'; s.round = 0; s.board = []; s.deck = []; s.discard = []; s.bank = []; s.result = null; s.history = []; s.goldChoice = null; s.turnId = null; s.log = [];
    for (const p of s.players) { p.role = null; p.hand = []; p.broken = []; p.notes = []; p.gold = []; }
  } else if (cmd.type === 'chooseGold') {
    need(actor && s.phase === 'gold' && s.goldChoice.playerId === actor.id, 'Wait for your turn to choose gold.', 403);
    const card = s.goldChoice.options.find(c => c.id === cmd.cardId); need(card, 'Choose one of your gold cards.');
    actor.gold.push(card); s.goldChoice.options = s.goldChoice.options.filter(c => c.id !== card.id);
    s.goldChoice.order.shift(); s.goldChoice.playerId = s.goldChoice.order[0] || null;
    event(s,`${actor.name} chose a gold card.`);
    if (!s.goldChoice.order.length) closeRound(s);
  } else if (cmd.type === 'play' || cmd.type === 'discard') {
    need(actor && s.phase === 'playing' && s.turnId === actor.id, 'It is not your turn.', 403);
    const index = actor.hand.findIndex(c => c.id === cmd.cardId), card = actor.hand[index]; need(card, 'Choose a card from your hand.');
    s.lastPlacement = null;
    let won = false;
    if (cmd.type === 'discard') event(s,`${actor.name} discarded one card.`);
    else if (card.kind === 'path') {
      need(!actor.broken.length, 'Repair all your broken tools before placing a tunnel.');
      const rotation = cmd.rotation ?? 0, error = placementError(s,card,cmd.x,cmd.y,rotation); need(!error,error);
      s.board.push({ x:cmd.x, y:cmd.y, kind:'path', defId:card.defId, cardId:card.id, rotation, groups:cardGroups(card,rotation) });
      s.lastPlacement = { actorId:actor.id, actorName:actor.name, x:cmd.x, y:cmd.y, version:s.version+1 };
      event(s,`${actor.name} placed a tunnel.`); won = revealReachedGoals(s);
    } else if (card.kind === 'break') {
      const target = player(s,cmd.target), tool = card.tools[0]; need(target && target.id !== actor.id, 'Choose another player.');
      need(!target.broken.includes(tool), `That ${tool} is already broken.`); target.broken.push(tool);
      event(s,`${actor.name} broke ${target.name}’s ${tool}.`);
    } else if (card.kind === 'repair') {
      const target = player(s,cmd.target), tool = cmd.tool || (card.tools.length === 1 ? card.tools[0] : null);
      need(target && card.tools.includes(tool) && target.broken.includes(tool), 'Choose one matching broken tool to repair.');
      target.broken = target.broken.filter(t => t !== tool); event(s,`${actor.name} repaired ${target.name}’s ${tool}.`);
    } else if (card.kind === 'map') {
      const goal = s.board.find(c => c.kind === 'goal' && c.id === cmd.target); need(goal && !goal.revealed, 'Choose a face-down goal.');
      actor.notes = actor.notes.filter(n => n.goalId !== goal.id);
      actor.notes.push({ goalId:goal.id, gold:goal.gold, groups:goal.groups.map(g => [...g]) });
      const goalNumber = s.board.filter(c => c.kind === 'goal').findIndex(c => c.id === goal.id) + 1;
      event(s,`${actor.name} inspected goal ${goalNumber}.`);
      Object.assign(s.log[s.log.length-1], { kind:'inspection', version:s.version+1, actorId:actor.id, actorName:actor.name, goalId:goal.id, goalNumber, x:goal.x, y:goal.y });
    } else if (card.kind === 'rockfall') {
      const cell = s.board.find(c => c.kind === 'path' && (c.x === cmd.x && c.y === cmd.y || c.cardId === cmd.target));
      need(cell, 'Choose a tunnel card. The entrance and goals cannot be removed.');
      s.board = s.board.filter(c => c !== cell); s.discard.push(makeCard(cell.defId,cell.cardId));
      event(s,`${actor.name} removed a tunnel.`);
    } else throw new GameError('Unknown card.');
    actor.hand.splice(index,1);
    if (cmd.type === 'discard' || card.kind !== 'path') s.discard.push(card);
    finishTurn(s,actor,won);
  } else throw new GameError('Unknown action.');
  s.receipts.push(`${hash}:${cmd.requestId}`); s.receipts = s.receipts.slice(-256); s.version++; return s;
}
export function view(s, hash, screen = false) {
  if (screen) hash = null;
  const me = s.players.find(p => p.key === hash), host = s.host === hash;
  const revealRoles = ['gold','roundEnd','finished'].includes(s.phase), total = p => p.gold.reduce((sum,c) => sum+c.value,0);
  const publicPlayers = s.players.map(p => ({ id:p.id, name:p.name, broken:[...p.broken], handCount:p.hand.length,
    ...(revealRoles ? {role:p.role} : {}), ...(s.phase === 'finished' ? {goldTotal:total(p),goldCards:structuredClone(p.gold)} : {}) }));
  const board = s.board.map(c => c.kind === 'goal' && !c.revealed
    ? {id:c.id,kind:'goal',x:c.x,y:c.y,revealed:false}
    : structuredClone(c));
  const maxGold = Math.max(0,...s.players.map(total));
  return { code:s.code, mode:s.mode, host, hostName:s.hostName, version:s.version, phase:s.phase, round:s.round, turnId:s.turnId,
    lastPlacement:s.lastPlacement ? structuredClone(s.lastPlacement) : null, deckCount:s.deck.length, players:publicPlayers, board, result:s.result && structuredClone(s.result),
    history:structuredClone(s.history), log:structuredClone(s.log), expiresAt:s.expiresAt, rulesEdition:RULES_EDITION,
    winners:s.phase === 'finished' ? s.players.filter(p => total(p) === maxGold).map(p => p.id) : [],
    goldChoice:s.goldChoice ? { playerId:s.goldChoice.playerId, ...(me?.id === s.goldChoice.playerId ? {options:structuredClone(s.goldChoice.options)} : {}) } : null,
    me:me ? { id:me.id, role:me.role, hand:structuredClone(me.hand), broken:[...me.broken], notes:structuredClone(me.notes),
      goldTotal:total(me), goldCards:structuredClone(me.gold), canAct:s.phase === 'playing' && s.turnId === me.id || s.phase === 'gold' && s.goldChoice?.playerId === me.id } : null };
}
