// Opt-in only: creates synthetic rooms against the configured live service.
// Run manually after the 4–12 player backend has been released. Not part of CI.
import assert from 'node:assert/strict';
import { randomBytes, randomInt, randomUUID } from 'node:crypto';
import { API_URL } from '../config.js';

const makePlayer = name => ({ name, token: randomBytes(32).toString('hex') });

async function request(room, player, data, expectedStatus = 200) {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: 'https://exams.bebrighton.net' },
    body: JSON.stringify({ code: room.code, token: player.token, requestId: randomUUID(), ...data }),
    signal: AbortSignal.timeout(30000)
  });
  const body = await response.json();
  assert.equal(response.status, expectedStatus, body.error || `Expected HTTP ${expectedStatus}.`);
  assert.ok(['*', 'https://exams.bebrighton.net'].includes(response.headers.get('access-control-allow-origin')));
  return body;
}

async function readCommittedState(room, player, minimumVersion, matches = () => true) {
  // Reads on another server instance can briefly return a cached earlier snapshot.
  const deadline = Date.now() + 5000;
  while (true) {
    const state = await request(room, player, { type: 'state' });
    if (state.version >= minimumVersion && matches(state)) return state;
    assert.ok(Date.now() < deadline, 'The committed state was not visible within the server cache window.');
    await new Promise(resolve => setTimeout(resolve, 200));
  }
}

async function createRoom(size) {
  const room = {
    code: String(randomInt(100000, 1000000)),
    host: makePlayer('Limits QA host'),
    players: Array.from({ length: size }, (_, index) => makePlayer(`Limits QA ${index + 1}`))
  };
  let joined = await request(room, room.host, { type: 'create', name: room.host.name });
  for (const player of room.players) joined = await request(room, player, { type: 'join', name: player.name });
  const state = await readCommittedState(room, room.host, joined.version, state => state.players.length === size);
  assert.equal(state.players.length, size);
  return room;
}

async function deal(room) {
  let state = await request(room, room.host, { type: 'start' });
  assert.equal(state.phase, 'reveal');
  const startVersion = state.version;
  for (const player of room.players) {
    const personal = await readCommittedState(room, player, startVersion, state => state.phase === 'reveal' && !!state.me?.role);
    player.id = personal.me.id;
    player.role = personal.me.role;
    assert.ok(personal.players.every(p => !p.role), 'Living players’ roles must remain private.');
    state = await request(room, player, { type: 'ready', phaseId: state.phaseId });
  }
  return state;
}

const small = await createRoom(4);
let state = await deal(small);
assert.deepEqual(small.players.map(p => p.role).sort(), ['fortune', 'villager', 'werewolf', 'witch']);
assert.equal(state.winner, null);

const fortune = small.players.find(p => p.role === 'fortune');
const wolf = small.players.find(p => p.role === 'werewolf');
const witch = small.players.find(p => p.role === 'witch');
const villager = small.players.find(p => p.role === 'villager');
const order = [];

state = await request(small, small.host, { type: 'advance', phaseId: state.phaseId });
order.push(state.phase);
assert.equal(state.phase, 'fortune');
await request(small, fortune, { type: 'action', phaseId: state.phaseId, target: villager.id });
state = await request(small, small.host, { type: 'advance', phaseId: state.phaseId });
order.push(state.phase);
assert.equal(state.phase, 'werewolf');
const wolfView = await request(small, wolf, { type: 'action', phaseId: state.phaseId, target: villager.id });
assert.equal(wolfView.packDecision.agreed, true);
state = await request(small, wolf, { type: 'advance', phaseId: state.phaseId });
order.push(state.phase);
assert.equal(state.phase, 'witch', 'The absent Little Girl must be skipped.');
const witchView = await readCommittedState(small, witch, state.version, state => state.phase === 'witch');
assert.equal(witchView.me.victim, villager.id);
assert.equal(witchView.me.potions.heal, true);
const healed = await request(small, witch, { type: 'action', phaseId: state.phaseId, heal: true });
assert.equal(healed.me.potions.heal, false);
state = await request(small, small.host, { type: 'advance', phaseId: state.phaseId });
order.push(state.phase);
assert.deepEqual(order, ['fortune', 'werewolf', 'witch', 'day']);
assert.equal(state.day, 1);
assert.ok(state.players.every(p => p.alive), 'The healing potion must preserve tonight’s victim.');
assert.equal(state.winner, null, 'Four players must not start or end a healed first night at parity.');
console.log('Four-player default deck and healed first night passed.', { code: small.code, phases: order });

const full = await createRoom(12);
const extra = makePlayer('Limits QA 13');
const rejected = await request(full, extra, { type: 'join', name: extra.name }, 400);
assert.match(rejected.error, /full \(12 players\)/);
state = await deal(full);
assert.equal(state.players.length, 12);
assert.equal(state.phase, 'reveal');
assert.equal(full.players.filter(p => p.role === 'werewolf').length, 3);
assert.equal(full.players.filter(p => p.role === 'villager').length, 5);
for (const role of ['fortune', 'witch', 'girl', 'hunter']) {
  assert.equal(full.players.filter(p => p.role === role).length, 1);
}
assert.equal(state.winner, null);
console.log('Twelve-player join/start and thirteenth-player rejection passed.', { code: full.code });
console.log('LIMITS_LIVE_OK');
