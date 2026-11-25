import rules from './rules.cjs';

export const GameError = rules.GameError;
export const MAX_PLAYERS = 36;

function requireThat(condition, message, status) {
  if (!condition) throw new GameError(message, status);
}

export function createRoom(code, host, presenter, now = Date.now(), seed = Math.floor(Math.random() * 1e9)) {
  requireThat(host && presenter && host !== presenter, 'Create separate host and screen keys.');
  return {code, host, presenter, seed, phase: 'lobby', players: [], expiresAt: now + 86400000};
}

function phaseOf(room) {
  return room.phase === 'playing' && room.players.length &&
    room.players.every(player => player.completed === rules.total) ? 'finished' : room.phase;
}

function member(room, token) {
  return room.players.find(player => player.key === token);
}

function checkRoom(room, token, now) {
  requireThat(room.expiresAt > now, 'This room has expired.', 410);
  requireThat(typeof token === 'string' && token.length, 'Your room key is missing.', 401);
}

export function command(room, token, action, data = {}, now = Date.now()) {
  checkRoom(room, token, now);
  const player = member(room, token);
  const phase = phaseOf(room);
  if (action === 'join') {
    if (player) return room;
    requireThat(token !== room.host && token !== room.presenter, 'Use a separate device to play.', 403);
    requireThat(phase !== 'finished', 'This game has finished.', 409);
    requireThat(room.players.length < MAX_PLAYERS, 'All 36 places are taken.', 409);
    const name = typeof data.name === 'string' ? data.name.replace(/[\u0000-\u0020]+/g, ' ').trim().slice(0, 24) : '';
    requireThat(name, 'Enter your name.');
    const number = room.players.length + 1;
    const joined = rules.newPlayer('p' + number, name, room.seed + number * 32749);
    joined.key = token;
    room.players.push(joined);
    return room;
  }
  if (action === 'start' || action === 'finish') {
    requireThat(token === room.host, 'Only the teacher can do that.', 403);
    if (action === 'start') {
      requireThat(room.players.length && phase === 'lobby', 'At least one student must join before starting.', 409);
      room.phase = 'playing';
    } else {
      requireThat(phase !== 'lobby', 'Start the room first.', 409);
      room.phase = 'finished';
    }
    return room;
  }
  requireThat(player, 'Join as a player first.', 403);
  requireThat(phase === 'playing', 'The game is not in play.', 409);
  if (action === 'gust') {
    requireThat(data.round === player.round && player.stage === 'match' && player.steady && !player.steadyArmed,
      'You need an unused crane charge to send a gust.', 409);
    const target = room.players.find(p => p.id === data.targetId);
    requireThat(target && target !== player && rules.canReceiveGust(target),
      'Choose another builder who can receive a gust.', 409);
    player.steady = 0;
    target.gustPending = true;
  } else {
    rules.play(player, action, data, now);
  }
  return room;
}

export function view(room, token, now = Date.now()) {
  checkRoom(room, token, now);
  const player = member(room, token);
  const role = token === room.host ? 'host' : token === room.presenter ? 'presenter' : 'player';
  requireThat(role !== 'player' || player, 'Join this room first.', 403);
  const phase = phaseOf(room);
  return {code: room.code, role, phase, total: rules.total, capacity: MAX_PLAYERS,
    players: rules.standings(room.players), me: player ? rules.playerView(player, phase) : null};
}
