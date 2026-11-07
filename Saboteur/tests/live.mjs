// Opt-in integration: creates new synthetic rooms only, never touches existing games.
// PowerShell: $env:SABOTEUR_LIVE='1'; node Saboteur/tests/live.mjs
import assert from 'node:assert/strict';
import { randomBytes, randomUUID } from 'node:crypto';
import { setTimeout as pause } from 'node:timers/promises';
import { API_URL } from '../config.js';
import { legalPlacements, reachablePorts, cardGroups } from '../server/engine.mjs';

if (process.env.SABOTEUR_LIVE !== '1') {
  console.log('Live checks are opt-in. Set SABOTEUR_LIVE=1 to create disposable synthetic rooms.');
  process.exit(0);
}
const url = process.env.SABOTEUR_API_URL || API_URL;
assert.ok(url && !url.includes('TBD'), 'Configure the released Saboteur service first.');
const host = randomBytes(32).toString('hex');
const people = Array.from({ length: 3 }, (_, i) => ({ token: randomBytes(32).toString('hex'), name: `QA Miner ${i + 1}` }));
const tokens = [host, ...people.map(p => p.token)];
const privateViews = new Map();
const stats = { turns: 0, minerRounds: 0, exhaustedRounds: 0, goldChoices: 0, actions: new Set(), privacyChecks: 0 };
let code;
let state;
let lastActorId;
class HTTPError extends Error {
  constructor(status, message) { super(`${status}: ${message}`); this.status = status; }
}
async function raw(token, body) {
  const payload = { code, token, requestId: randomUUID(), ...body };
  for (let attempt = 0; attempt < 4; attempt++) {
    let response;
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Origin: 'https://exams.bebrighton.net' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(30000)
      });
    } catch (error) {
      if (attempt === 3) throw error;
      await pause(300 * (attempt + 1));
      continue; // Same requestId makes uncertain network retries safe.
    }
    const data = await response.json();
    assert.ok(['*', 'https://exams.bebrighton.net'].includes(response.headers.get('access-control-allow-origin')));
    if (!response.ok) {
      if ([429, 503].includes(response.status) && attempt < 3) { await pause(400 * (attempt + 1)); continue; }
      throw new HTTPError(response.status, data.error || 'Unknown service error');
    }
    for (const secret of tokens) assert.ok(!JSON.stringify(data).includes(secret), 'A capability leaked in a response');
    return data;
  }
}
function inspectPublic(v, presenter = false) {
  for (const field of ['deck', 'bank', 'discard', 'unusedRole', 'receipts']) assert.equal(v[field], undefined, `Public ${field}`);
  for (const p of v.players) {
    for (const field of ['key', 'hand', 'notes', 'gold']) assert.equal(p[field], undefined, `Another player's ${field}`);
    if (v.phase === 'playing') assert.equal(p.role, undefined, 'A current role leaked');
    if (v.phase !== 'finished') {
      assert.equal(p.goldTotal, undefined, 'Private accumulated gold leaked');
      assert.equal(p.goldCards, undefined, 'Private accumulated gold cards leaked');
    }
  }
  for (const g of v.board.filter(c => c.kind === 'goal' && !c.revealed)) {
    for (const field of ['gold', 'groups', 'rotation']) assert.equal(g[field], undefined, `Hidden goal ${field}`);
  }
  if (presenter) {
    assert.equal(v.me, null);
    assert.equal(v.host, false);
    if (v.goldChoice) assert.equal(v.goldChoice.options, undefined);
  }
  stats.privacyChecks++;
}
function observe(v, token) {
  inspectPublic(v);
  if (v.me) {
    const known = people.find(p => p.token === token);
    assert.ok(known, 'Only a player capability should receive a private player view');
    if (known.id) assert.equal(known.id, v.me.id);
    known.id = v.me.id;
    privateViews.set(v.me.id, structuredClone(v.me));
  } else if (token === host) assert.equal(v.me, null, 'A managing host unexpectedly occupies a seat');
  if (!state || v.version >= state.version) state = v;
  return v;
}
async function read(token, minVersion = state?.version || 0, extra = {}) {
  for (let i = 0; i < 12; i++) {
    const v = await raw(token, { type: 'state', ...extra });
    if (v.version >= minVersion) return observe(v, token);
    await pause(250); // Other service instances may retain a 1.8-second read cache.
  }
  throw new Error('Room state did not catch up to a committed command.');
}
async function mutate(token, body) {
  const v = await raw(token, { expectedVersion: state.version, ...body });
  return observe(v, token);
}
async function presenterChecks() {
  const version = state.version;
  for (const token of [undefined, host, people[0].token]) {
    const v = await read(token, version, { screen: true });
    inspectPublic(v, true);
  }
}
function actor() {
  const p = people.find(p => p.id === state.turnId);
  assert.ok(p, 'The current turn belongs to a connected synthetic player');
  const me = privateViews.get(p.id);
  assert.ok(me && me.hand.length, 'The current player has a private hand');
  return { ...p, me, broken: state.players.find(q => q.id === p.id).broken };
}
function discardCard(me) {
  return [...me.hand].sort((a, b) => {
    const cost = c => c.defId.startsWith('dead-') ? 0 : c.kind === 'break' ? 1 : c.kind === 'rockfall' ? 2 : c.kind === 'repair' ? 3 : c.kind === 'map' ? 4 : 8 + c.groups.flat().length;
    return cost(a) - cost(b);
  })[0];
}
const vectors = { n: [0, -1], e: [1, 0], s: [0, 1], w: [-1, 0] };
function frontierDistance(board, goal) {
  const reached = reachablePorts({ board });
  const occupied = new Map(board.map(c => [`${c.x},${c.y}`, c]));
  let distance = 1000;
  for (const port of reached) {
    const match = /^(-?\d+),(-?\d+):([nesw])$/.exec(port);
    const [, x, y, edge] = match;
    const [dx, dy] = vectors[edge];
    const nx = Number(x) + dx, ny = Number(y) + dy;
    const neighbor = occupied.get(`${nx},${ny}`);
    if (neighbor && !(neighbor.kind === 'goal' && !neighbor.revealed)) continue;
    distance = Math.min(distance, Math.abs(nx - goal.x) + Math.abs(ny - goal.y));
  }
  return distance;
}
function tunnelMove(p) {
  if (p.broken.length) return null;
  const known = new Map();
  for (const own of privateViews.values()) for (const note of own.notes) known.set(note.goalId, note.gold);
  const goals = state.board.filter(c => c.kind === 'goal');
  const goal = goals.find(g => g.gold || known.get(g.id) === true) ||
    goals.filter(g => !g.revealed && known.get(g.id) !== false).sort((a, b) => Math.abs(a.y) - Math.abs(b.y))[0];
  if (!goal) return null;
  const before = frontierDistance(state.board, goal);
  let best = null;
  for (const card of p.me.hand.filter(c => c.kind === 'path' && !c.defId.startsWith('dead-'))) {
    for (const rotation of [0, 180]) for (const place of legalPlacements(state, card, rotation)) {
      const cell = { ...place, kind: 'path', groups: cardGroups(card, rotation) };
      const after = frontierDistance([...state.board, cell], goal);
      if (after >= before) continue;
      const score = (before - after) * 100 + card.groups.flat().length - Math.abs(place.y - goal.y) * .01;
      if (!best || score > best.score) best = { score, type: 'play', cardId: card.id, x: place.x, y: place.y, rotation };
    }
  }
  if (best) { delete best.score; return best; }
  return null;
}
function roundMove(p, cooperate) {
  const hidden = state.board.filter(c => c.kind === 'goal' && !c.revealed);
  const known = new Set([...privateViews.values()].flatMap(me => me.notes.map(n => n.goalId)));
  const map = p.me.hand.find(c => c.kind === 'map');
  if (map && hidden.some(g => !known.has(g.id))) return { type: 'play', cardId: map.id, target: hidden.find(g => !known.has(g.id)).id };
  if (cooperate) {
    const path = tunnelMove(p);
    if (path) return path;
  } else {
    const rock = p.me.hand.find(c => c.kind === 'rockfall');
    const placed = state.board.find(c => c.kind === 'path');
    if (rock && placed && !stats.actions.has('rockfall')) return { type: 'play', cardId: rock.id, x: placed.x, y: placed.y };
    if (!placed && !stats.actions.has('rockfall') && !p.broken.length) {
      for (const card of p.me.hand.filter(c => c.kind === 'path')) {
        const move = legalPlacements(state, card, 0)[0];
        if (move) return { type: 'play', cardId: card.id, ...move };
      }
    }
    for (const card of p.me.hand.filter(c => c.kind === 'repair')) {
      const target = state.players.find(q => q.broken.some(t => card.tools.includes(t)));
      if (target) return { type: 'play', cardId: card.id, target: target.id, tool: target.broken.find(t => card.tools.includes(t)) };
    }
    for (const card of p.me.hand.filter(c => c.kind === 'break')) {
      const target = state.players.find(q => q.id !== p.id && !q.broken.includes(card.tools[0]));
      if (target) return { type: 'play', cardId: card.id, target: target.id };
    }
  }
  return { type: 'discard', cardId: discardCard(p.me).id };
}

// Never accept an externally supplied room code: this test owns every mutated room.
for (let attempt = 0; attempt < 5; attempt++) {
  code = String(100000 + Math.floor(Math.random() * 900000));
  try { observe(await raw(host, { type: 'create', name: 'QA managing host', mode: 'classroom' }), host); break; }
  catch (error) { if (error.status !== 409 || attempt === 4) throw error; }
}
console.log('Created synthetic classroom room', code);
assert.equal(state.players.length, 0);
const created = await raw(host, { type: 'create', name: 'QA managing host', mode: 'classroom' });
assert.equal(created.version, 0, 'A create retry must not replace the room');
const joins = await Promise.allSettled(people.map(p => raw(p.token, { type: 'join', name: p.name })));
assert.ok(joins.every(r => r.status === 'fulfilled'), JSON.stringify(joins));
joins.forEach((result, i) => observe(result.value, people[i].token));
await read(host, 3);
assert.equal(state.players.length, people.length, 'Concurrent joins must preserve every player');
await presenterChecks();
await assert.rejects(() => raw(host, { type: 'start', expectedVersion: state.version, screen: true }), error => error.status === 403);
await mutate(host, { type: 'start', firstPlayerId: people[0].id });
await Promise.all(people.map(p => read(p.token, state.version)));
assert.equal(state.round, 1);
assert.equal(state.phase, 'playing');

// Two uncertain deliveries of the same action commit once.
let current = actor();
let body = { type: 'discard', cardId: discardCard(current.me).id, expectedVersion: state.version, requestId: randomUUID() };
const duplicate = await Promise.all([raw(current.token, body), raw(current.token, body)]);
assert.equal(duplicate[0].version, duplicate[1].version);
assert.equal(duplicate[0].version, body.expectedVersion + 1);
observe(duplicate[0], current.token);
await assert.rejects(() => raw(current.token, { ...body, requestId: randomUUID() }), error => error.status === 409);

// Different concurrent actions confirmed against one version cannot both commit.
current = actor();
body = { type: 'discard', cardId: discardCard(current.me).id, expectedVersion: state.version };
const raced = await Promise.allSettled([raw(current.token, body), raw(current.token, body)]);
assert.equal(raced.filter(r => r.status === 'fulfilled').length, 1);
assert.equal(raced.find(r => r.status === 'rejected').reason.status, 409);
observe(raced.find(r => r.status === 'fulfilled').value, current.token);
const savedHand = structuredClone(privateViews.get(people[0].id).hand);
const reconnect = await read(people[0].token, state.version);
assert.equal(reconnect.me.id, people[0].id);
assert.deepEqual(reconnect.me.hand, savedHand);
console.log('Concurrent joins, duplicate delivery, stale commands, presenter isolation and reconnect passed');

while (state.phase !== 'finished') {
  if (state.phase === 'roundEnd') {
    const oldRound = state.round;
    const nextId = state.players[(state.players.findIndex(p => p.id === lastActorId) + 1) % state.players.length].id;
    await mutate(host, { type: 'nextRound' });
    assert.equal(state.round, oldRound + 1);
    assert.equal(state.turnId, nextId, 'The next round starts clockwise after the previous last actor');
    await Promise.all(people.map(p => read(p.token, state.version)));
    await presenterChecks();
    continue;
  }
  if (state.phase === 'gold') {
    const picker = people.find(p => p.id === state.goldChoice.playerId);
    const own = await read(picker.token, state.version);
    assert.ok(own.goldChoice.options.length);
    const outsider = await read(host, state.version);
    assert.equal(outsider.goldChoice.options, undefined);
    await presenterChecks();
    const pick = [...own.goldChoice.options].sort((a, b) => b.value - a.value)[0];
    await mutate(picker.token, { type: 'chooseGold', cardId: pick.id });
    stats.goldChoices++;
    if (['roundEnd', 'finished'].includes(state.phase)) {
      stats.minerRounds++;
      console.log(`Round ${state.round}: miners reached gold; rewards chosen privately`);
    }
    continue;
  }
  assert.equal(state.phase, 'playing');
  current = actor();
  const move = roundMove(current, state.round !== 2);
  const played = current.me.hand.find(c => c.id === move.cardId);
  await mutate(current.token, move);
  lastActorId = current.id;
  if (move.type === 'play') stats.actions.add(played.kind);
  stats.turns++;
  if (state.result?.winner === 'saboteurs' && ['roundEnd', 'finished'].includes(state.phase)) {
    stats.exhaustedRounds++;
    assert.equal(state.deckCount, 0);
    assert.ok(state.players.every(p => p.handCount === 0));
    console.log(`Round ${state.round}: draw pile and every hand exhausted; Saboteur rewards resolved`);
  }
  if (stats.turns % 15 === 0) {
    await presenterChecks();
    console.log(`Live progress: round ${state.round}, ${stats.turns} turns, version ${state.version}`);
  }
  assert.ok(stats.turns <= 201, 'A three-round base game cannot consume more than 201 playing cards');
}
assert.equal(state.round, 3);
assert.equal(state.history.length, 3);
assert.ok(stats.minerRounds > 0, 'The live exercise must include a path reaching gold and private miner choices');
assert.ok(stats.exhaustedRounds > 0, 'The live exercise must include full exhaustion and Saboteur scoring');
for (const kind of ['path', 'map', 'break', 'repair', 'rockfall']) assert.ok(stats.actions.has(kind), `Exercise ${kind} action`);
const totals = state.players.map(p => p.goldTotal);
const max = Math.max(...totals);
assert.deepEqual(state.winners.sort(), state.players.filter(p => p.goldTotal === max).map(p => p.id).sort());
assert.ok(totals.reduce((a, b) => a + b) <= 44);
await presenterChecks();
await mutate(host, { type: 'rematch' });
assert.equal(state.phase, 'lobby');
assert.equal(state.round, 0);
assert.equal(state.players.length, people.length);
assert.deepEqual(state.history, []);
for (const p of people) {
  const v = await read(p.token, state.version);
  assert.equal(v.me.goldTotal, 0);
  assert.equal(v.me.role, null);
  assert.deepEqual(v.me.hand, []);
}
await mutate(host, { type: 'start', firstPlayerId: people[1].id });
assert.equal(state.phase, 'playing');
assert.equal(state.round, 1);
assert.equal(state.turnId, people[1].id);
console.log('LIVE_QA_OK', JSON.stringify({ code, version: state.version, ...stats, actions: [...stats.actions] }));
