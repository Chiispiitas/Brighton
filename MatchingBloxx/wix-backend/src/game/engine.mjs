import rules from './rules.cjs';
import arcade from './arcade.cjs';

export const GameError = rules.GameError;
export const MAX_PLAYERS = 36;
const CITY_HISTORY = 6;
const CITY_REPLAY_MS = 24000;

function requireThat(condition, message, status) {
  if (!condition) throw new GameError(message, status);
}

export function createRoom(code, host, presenter, now = Date.now(), seed = Math.floor(Math.random() * 1e9), setup) {
  requireThat(host && presenter && host !== presenter, 'Create separate host and screen keys.');
  const room = {code, host, presenter, seed, phase: 'lobby', players: [], expiresAt: now + 86400000};
  if (setup) {
    room.arcade = arcade.config(setup.mode, setup.set);
    room.arcade.physics = ([2,3,4,5].includes(setup.physics) || (setup.physics === 6 && setup.mode === 'rightwrong')) ? setup.physics : 1;
  }
  return room;
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
    if (room.arcade && phase === 'playing') arcade.arm(joined, now, room.arcade.physics || 1);
    room.players.push(joined);
    return room;
  }
  if (action === 'start' || action === 'finish') {
    requireThat(token === room.host, 'Only the teacher can do that.', 403);
    if (action === 'start') {
      requireThat(room.players.length && phase === 'lobby', 'At least one student must join before starting.', 409);
      room.phase = 'playing';
      if (room.arcade) room.players.forEach(person => arcade.arm(person, now, room.arcade.physics || 1));
    } else {
      requireThat(phase !== 'lobby', 'Start the room first.', 409);
      room.phase = 'finished';
    }
    return room;
  }
  requireThat(player, 'Join as a player first.', 403);
  requireThat(phase === 'playing', 'The game is not in play.', 409);
  if (action === 'gust') {
    requireThat(data.round === player.round && player.stage === (room.arcade ? 'drop' : 'match') && player.steady && !player.steadyArmed,
      'You need an unused crane charge to send a gust.', 409);
    const target = room.players.find(p => p.id === data.targetId);
    requireThat(target && target !== player && rules.canReceiveGust(target),
      'Choose another builder who can receive a gust.', 409);
    player.steady = 0;
    target.gustPending = true;
  } else if (room.arcade) {
    const release = action === 'arcadeDrop' && {
      time: now, motion: player.motion, rock: player.rock || null, elapsed: data.elapsedMs,
      before: player.placements.slice(), color: room.arcade.mode === 'match' ? data.choice : player.round - 1
    };
    arcade.move(player, room.arcade, action, data, now, false);
    if (release) {
      const {kind, offset, fallen, direction, bump, parts} = player.last;
      const recent = (player.cityDrops || []).filter(drop => now - drop.time <= CITY_REPLAY_MS);
      recent.push({...release, turn: player.completed, after: player.placements,
        kind, offset, fallen, direction, bump: !!bump, ...(parts ? {parts} : {})});
      player.cityDrops = recent.slice(-CITY_HISTORY);
    }
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
  const me = player ? (room.arcade ? arcade.playerView(player, room.arcade, phase) : rules.playerView(player, phase)) : null;
  const result = {code: room.code, role, phase, total: rules.total, capacity: MAX_PLAYERS,
    players: rules.standings(room.players), me};
  if (room.arcade) result.arcade = arcade.snapshot(room.arcade);
  if (role === 'presenter') {
    result.city = {
      time: now,
      lots: room.players.map(player => ({
        id: player.id, floors: player.placements,
        motion: phase === 'playing' ? player.motion : null,
        rock: player.rock || null,
        drops: (player.cityDrops || []).filter(drop => now - drop.time <= CITY_REPLAY_MS)
      }))
    };
  }
  return result;
}
