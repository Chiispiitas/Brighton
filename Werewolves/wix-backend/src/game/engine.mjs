export const ROLES = ['villager', 'werewolf', 'fortune', 'girl', 'witch', 'hunter'];
export const NIGHT = ['fortune', 'werewolf', 'girl', 'witch'];
export class GameError extends Error { constructor(message, status = 400) { super(message); this.status = status; } }
const need = (ok, message, status) => { if (!ok) throw new GameError(message, status); };
const alive = s => s.players.filter(p => p.alive);
const byId = (s, id) => s.players.find(p => p.id === id);
const event = (s, text) => { s.log.push({ day: s.day, text }); s.log = s.log.slice(-60); };
export function cleanName(value) {
  need(typeof value === 'string', 'Enter your name.');
  const name = value.trim().replace(/\s+/g, ' ');
  need(name.length >= 1 && name.length <= 24 && !/[\x00-\x1f<>]/.test(name), 'Use a name between 1 and 24 characters, without angle brackets.');
  return name;
}
export function createRoom(code, hash, name, now = Date.now()) {
  return { code, host: hash, hostName: cleanName(name), version: 0, phase: 'lobby', day: 0, phaseId: 0,
    players: [], settings: { wolves: 0, fortune: true, girl: true, witch: true, hunter: true },
    actions: {}, votes: {}, notes: {}, potions: { heal: true, poison: true }, hunterUsed: false,
    pendingHunter: null, resumePhase: null, winner: null, log: [], receipts: [], expiresAt: now + 86400000 };
}
function setPhase(s, phase) { s.phase = phase; s.phaseId++; s.actions = {}; }
function checkWin(s) {
  if (s.pendingHunter) return false;
  const living = alive(s), wolves = living.filter(p => p.role === 'werewolf').length;
  if (!wolves || wolves >= living.length - wolves) {
    s.winner = !wolves ? 'village' : 'werewolves'; setPhase(s, 'finished');
    event(s, !wolves ? 'The village is safe. Every werewolf has been found.' : 'The werewolves have taken the village.'); return true;
  }
  return false;
}
function eliminate(s, ids, cause, resume) {
  for (const id of [...new Set(ids.filter(Boolean))]) {
    const p = byId(s, id); if (!p?.alive) continue;
    p.alive = false; p.cause = cause;
    event(s, `${p.name} ${cause === 'night' ? 'did not survive the night' : cause === 'vote' ? 'was voted out' : 'was taken by the hunter'}.`);
    if (p.role === 'hunter' && !s.hunterUsed) s.pendingHunter = p.id;
  }
  if (s.pendingHunter) { s.resumePhase = resume; setPhase(s, 'hunter'); }
  else if (!checkWin(s)) setPhase(s, resume);
}
function startNight(s) {
  s.day++; s.night = { victim: null, poison: null, heal: false }; s.votes = {};
  nextNight(s, -1);
}
function nextNight(s, after) {
  for (let i = after + 1; i < NIGHT.length; i++) {
    if (alive(s).some(p => p.role === NIGHT[i])) { setPhase(s, NIGHT[i]); return; }
  }
  const deaths = [s.night.heal ? null : s.night.victim, s.night.poison].filter(Boolean);
  event(s, `Dawn breaks on day ${s.day}.`);
  if (!deaths.length) event(s, 'Everyone survived the night.');
  eliminate(s, deaths, 'night', 'day');
}
function eligible(s) {
  if (s.phase === 'reveal') return s.players;
  if (NIGHT.includes(s.phase)) return alive(s).filter(p => p.role === s.phase);
  if (s.phase === 'vote') return alive(s);
  if (s.phase === 'hunter') return s.players.filter(p => p.id === s.pendingHunter);
  return [];
}
export function progress(s) {
  const required = eligible(s); return { done: required.filter(p => s.phase === 'vote' ? Object.hasOwn(s.votes, p.id) : !!s.actions[p.id]).length, total: required.length };
}
export function packDecision(s) {
  const wolves = alive(s).filter(p => p.role === 'werewolf');
  const targets = wolves.map(p => s.actions[p.id]?.target || null);
  const target = targets[0], victim = byId(s, target);
  const agreed = wolves.length > 0 && !!victim?.alive && victim.role !== 'werewolf' && targets.every(id => id === target);
  return { agreed, target: agreed ? target : null };
}
function choose(s, id, actor, excludeWolf = false) {
  const p = byId(s, id);
  need(p?.alive && p.id !== actor.id && (!excludeWolf || p.role !== 'werewolf'), 'Choose another living player.'); return p;
}
function note(s, id, text) { (s.notes[id] ||= []).push({ day: s.day, text }); s.notes[id] = s.notes[id].slice(-16); }
function finishStep(s, random) {
  const phase = s.phase;
  if (phase === 'werewolf') {
    const decision = packDecision(s);
    need(decision.agreed, 'Impossible to continue because the decision has not been made.');
    s.night.victim = decision.target;
  }
  if (phase === 'reveal') { startNight(s); return; }
  if (NIGHT.includes(phase)) { nextNight(s, NIGHT.indexOf(phase)); return; }
  if (phase === 'vote') {
    const counts = {};
    for (const id of Object.values(s.votes)) if (id) counts[id] = (counts[id] || 0) + 1;
    const max = Math.max(0, ...Object.values(counts)), targets = Object.keys(counts).filter(id => counts[id] === max);
    if (targets.length !== 1) { event(s, 'The vote was tied or everyone abstained. Nobody was eliminated.'); setPhase(s, 'dusk'); }
    else eliminate(s, targets, 'vote', 'dusk');
  }
}
export function command(inputState, hash, cmd, random = Math.random) {
  const s = structuredClone(inputState);
  need(cmd && typeof cmd.type === 'string', 'Missing action.');
  need(typeof cmd.requestId === 'string' && /^[a-zA-Z0-9-]{8,80}$/.test(cmd.requestId), 'Invalid action identifier.');
  if (s.receipts.includes(`${hash}:${cmd.requestId}`)) return s;
  const host = hash === s.host, actor = s.players.find(p => p.key === hash);
  if (cmd.type === 'join') {
    need(s.phase === 'lobby', 'This game has already started.');
    if (!actor) {
      need(s.players.length < 40, 'This village is full (40 players).');
      const name = cleanName(cmd.name);
      need(!s.players.some(p => p.name.toLowerCase() === name.toLowerCase()), 'That name is taken. Add an initial or a nickname.');
      s.players.push({ id: `p${s.version + 1}`, key: hash, name, alive: true, role: null });
    }
  } else if (cmd.type === 'leave') {
    need(s.phase === 'lobby' && actor, 'You can leave the roster before the game starts.');
    s.players = s.players.filter(p => p.id !== actor.id);
  } else if (cmd.type === 'settings') {
    need(host && s.phase === 'lobby', 'Only the host can change the role mix in the lobby.', 403);
    for (const role of ['fortune', 'girl', 'witch', 'hunter']) if (typeof cmd.settings?.[role] === 'boolean') s.settings[role] = cmd.settings[role];
    const n = Number(cmd.settings?.wolves);
    need(Number.isInteger(n) && n >= 0 && n <= 12, 'Choose Auto or 1–12 werewolves.'); s.settings.wolves = n;
  } else if (cmd.type === 'kick') {
    need(host && s.phase === 'lobby', 'Players can only be removed by the host in the lobby.', 403);
    s.players = s.players.filter(p => p.id !== cmd.target);
  } else if (cmd.type === 'start') {
    need(host && s.phase === 'lobby', 'Only the host can start a waiting room.', 403);
    need(s.players.length >= 6, 'At least 6 players must join.');
    const wolves = s.settings.wolves || Math.max(1, Math.floor(s.players.length / 4));
    const deck = Array(wolves).fill('werewolf');
    for (const role of ['fortune', 'girl', 'witch', 'hunter']) if (s.settings[role]) deck.push(role);
    need(wolves < s.players.length / 2 && deck.length <= s.players.length, 'Reduce the werewolves or special roles for this group.');
    while (deck.length < s.players.length) deck.push('villager');
    for (let i = deck.length - 1; i > 0; i--) { const j = Math.floor(random() * (i + 1)); [deck[i], deck[j]] = [deck[j], deck[i]]; }
    s.players.forEach((p, i) => { p.role = deck[i]; });
    setPhase(s, 'reveal'); event(s, 'The prophecy has come true. Werewolves walk among us.');
  } else if (cmd.type === 'advance') {
    const activeWolf = s.phase === 'werewolf' && actor?.alive && actor.role === 'werewolf';
    need(host || activeWolf, 'Only the host or an active werewolf can move this phase forward.', 403);
    need(cmd.phaseId === s.phaseId, 'The story has already moved on.');
    if (s.phase === 'day') { if (s.day === 1) startNight(s); else { s.votes = {}; setPhase(s, 'vote'); } }
    else if (s.phase === 'dusk') startNight(s);
    else {
      need(['reveal', ...NIGHT, 'vote'].includes(s.phase), 'Finish the current action first.');
      if (s.phase === 'werewolf') need(packDecision(s).agreed, 'Impossible to continue because the decision has not been made.');
      const p = progress(s); need(p.done === p.total || cmd.force === true, 'Some players have not acted yet.');
      finishStep(s, random);
    }
  } else if (cmd.type === 'reset') {
    need(host && s.phase === 'finished', 'A new game is available after this game finishes.', 403);
    for (const p of s.players) { p.alive = true; p.role = null; delete p.cause; }
    s.day = 0; s.winner = null; s.notes = {}; s.log = []; s.potions = { heal: true, poison: true }; s.hunterUsed = false; s.pendingHunter = null;
    setPhase(s, 'lobby');
  } else {
    need(actor, 'Join this room before taking an action.', 403);
    need(cmd.phaseId === s.phaseId, 'The story has moved on. Your action was not used.');
    if (cmd.type === 'ready') {
      need(s.phase === 'reveal', 'Cards have already been dealt.'); s.actions[actor.id] = { ready: true };
    } else if (cmd.type === 'vote') {
      need(s.phase === 'vote' && actor.alive, 'Voting is not available.');
      if (cmd.target) choose(s, cmd.target, actor);
      s.votes[actor.id] = cmd.target || null;
    } else if (cmd.type === 'action') {
      need(eligible(s).some(p => p.id === actor.id), 'It is not your turn.', 403);
      need(s.phase === 'werewolf' || !s.actions[actor.id], 'Your action is already locked in.');
      if (s.phase === 'fortune') {
        if (cmd.target) { const target = choose(s, cmd.target, actor); note(s, actor.id, `${target.name} is ${target.role}.`); }
      } else if (s.phase === 'werewolf') {
        need(cmd.target, 'Choose the pack’s target.'); choose(s, cmd.target, actor, true);
      } else if (s.phase === 'girl' && cmd.spy === true) {
        const wolves = alive(s).filter(p => p.role === 'werewolf');
        const wolf = wolves[Math.floor(random() * wolves.length)];
        if (wolf) {
          const heads = random() < 0.5;
          note(s, actor.id, `${heads ? 'Heads — you stayed hidden.' : 'Tails — you were spotted.'} ${wolf.name} is a werewolf.`);
          if (!heads) note(s, wolf.id, `You spotted ${actor.name}, the little girl, spying on you.`);
        }
      } else if (s.phase === 'witch') {
        if (cmd.heal === true) { need(s.potions.heal && s.night.victim, 'The healing potion is unavailable.'); s.night.heal = true; s.potions.heal = false; }
        if (cmd.poison) { need(s.potions.poison, 'Your poison has already been used.'); const target = byId(s, cmd.poison); need(target?.alive, 'Choose a living player to poison.'); s.night.poison = target.id; s.potions.poison = false; }
      } else if (s.phase === 'hunter') {
        if (cmd.target) choose(s, cmd.target, actor);
        s.hunterUsed = true; s.pendingHunter = null;
        eliminate(s, cmd.target ? [cmd.target] : [], 'hunter', s.resumePhase || 'day');
      }
      if (s.phase !== 'hunter' && actor.role === 'hunter') { /* final shot changed phase */ }
      else s.actions[actor.id] = { target: cmd.target || null };
    } else throw new GameError('Unknown action.');
  }
  s.receipts.push(`${hash}:${cmd.requestId}`); s.receipts = s.receipts.slice(-120);
  s.version++; return s;
}
export function view(s, hash) {
  const me = s.players.find(p => p.key === hash), host = s.host === hash;
  const pack = me?.role === 'werewolf' ? s.players.filter(p => p.role === 'werewolf').map(p => p.id) : [];
  return { code: s.code, version: s.version, phase: s.phase, phaseId: s.phaseId, day: s.day,
    host, hostName: s.hostName, settings: s.settings, winner: s.winner, expiresAt: s.expiresAt,
    players: s.players.map(p => ({ id: p.id, name: p.name, alive: p.alive, ...(s.phase === 'finished' || !p.alive ? { role: p.role } : {}), ...(pack.includes(p.id) ? { pack: true } : {}) })),
    me: me ? { id: me.id, role: me.role, alive: me.alive, acted: s.phase === 'vote' ? Object.hasOwn(s.votes, me.id) : !!s.actions[me.id], target: s.phase === 'werewolf' && me.role === 'werewolf' ? s.actions[me.id]?.target || null : null, vote: s.votes[me.id] || null, notes: s.notes[me.id] || [], canAct: eligible(s).some(p => p.id === me.id), ...(me.role === 'witch' ? { potions: s.potions, victim: s.phase === 'witch' ? s.night?.victim : null } : {}) } : null,
    ...(s.phase === 'werewolf' && (host || me?.alive && me.role === 'werewolf') ? { packDecision: { agreed: packDecision(s).agreed } } : {}),
    ...(s.phase === 'werewolf' && me?.alive && me.role === 'werewolf' ? { packChoices: alive(s).filter(p => p.role === 'werewolf').map(p => ({ wolfId: p.id, target: s.actions[p.id]?.target || null })) } : {}),
    progress: host || s.phase === 'vote' || s.phase === 'reveal' ? progress(s) : null,
    voteCounts: ['dusk', 'finished'].includes(s.phase) ? Object.values(s.votes).reduce((out, id) => { if (id) out[id] = (out[id] || 0) + 1; return out; }, {}) : null,
    log: s.log, pendingHunter: s.phase === 'hunter' ? s.pendingHunter : null };
}
