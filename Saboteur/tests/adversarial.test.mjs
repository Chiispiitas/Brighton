import assert from 'node:assert/strict';
import test from 'node:test';
import { createRoom, command, view, CARD_DEFS, DECK, GOLD_VALUES, cardGroups, placementError } from '../server/engine.mjs';

let request = 0;
const random = () => .43127;
const send = (s, key, body) => command(s, key, { requestId: `audit-cmd-${++request}`, expectedVersion: s.version, ...body }, random);
function setup(count = 3) {
  let s = createRoom('812340', 'host-key', 'Audit host', Date.now(), 'classroom');
  for (let i = 0; i < count; i++) s = send(s, `seat-${i}`, { type: 'join', name: `Fictional ${i + 1}` });
  return send(s, 'host-key', { type: 'start' });
}
function give(s, who, defId) {
  const owner = s.players[who];
  const card = { ...CARD_DEFS[defId], id: `fixture-${++request}` };
  owner.hand = [card];
  return card;
}
function nearGoal(s, gold = true) {
  s.board = [
    { x: 0, y: 0, kind: 'start', groups: [['n', 'e', 's', 'w']] },
    ...Array.from({ length: 6 }, (_, i) => ({ x: i + 1, y: 0, kind: 'path', defId: 'straight-ew', cardId: `fixture-board-${i}`, groups: [['e', 'w']], rotation: 0 })),
    { x: 8, y: 0, kind: 'goal', id: 'goal-1', gold, groups: gold ? [['n', 'e', 's', 'w']] : [['n', 'e']], rotation: 0, revealed: false }
  ];
  s.turnId = s.players[0].id;
  return give(s, 0, 'straight-ew');
}
function publicPrivacy(v) {
  assert.equal(v.me, null);
  assert.equal(v.host, false);
  for (const p of v.players) {
    for (const field of ['hand', 'key', 'notes', 'gold', 'goldTotal', 'goldCards']) assert.equal(p[field], undefined, `${field} must be private`);
    if (v.phase === 'playing') assert.equal(p.role, undefined);
  }
  for (const field of ['deck', 'bank', 'discard', 'unusedRole', 'receipts']) assert.equal(v[field], undefined);
  for (const g of v.board.filter(c => c.kind === 'goal' && !c.revealed)) {
    assert.equal(g.groups, undefined);
    assert.equal(g.gold, undefined);
    assert.equal(g.rotation, undefined);
  }
  if (v.goldChoice) assert.equal(v.goldChoice.options, undefined);
}

test('printed-card geometry matches 31 connected paths and 9 disconnected dead ends', () => {
  const paths = Object.values(CARD_DEFS).filter(c => c.kind === 'path');
  assert.equal(paths.filter(c => !c.defId.startsWith('dead-')).reduce((n, c) => n + c.count, 0), 31);
  assert.equal(paths.filter(c => c.defId.startsWith('dead-')).reduce((n, c) => n + c.count, 0), 9);
  for (const c of paths.filter(c => c.defId.startsWith('dead-'))) assert.ok(c.groups.every(g => g.length === 1));
  assert.equal(DECK.length, 67);
  assert.deepEqual([1, 2, 3].map(value => GOLD_VALUES.filter(v => v === value).length), [16, 8, 4]);
  assert.equal(GOLD_VALUES.reduce((a, b) => a + b), 44);
});

test('a legal placement and later rockfall conserve every physical playing card exactly once', () => {
  let s = setup();
  const actor = s.players[0];
  const all = [...s.deck, ...s.players.flatMap(p => p.hand)];
  const path = all.find(c => c.defId === 'straight-ew');
  const currentOwner = s.players.find(p => p.hand.includes(path));
  if (currentOwner) currentOwner.hand = currentOwner.hand.filter(c => c !== path);
  else s.deck = s.deck.filter(c => c !== path);
  actor.hand.push(path);
  s = send(s, actor.key, { type: 'play', cardId: path.id, x: 1, y: 0, rotation: 0 });
  const inspect = state => {
    const ids = [...state.deck, ...state.discard, ...state.players.flatMap(p => p.hand)].map(c => c.id);
    ids.push(...state.board.filter(c => c.kind === 'path').map(c => c.cardId));
    assert.equal(ids.length, 67);
    assert.equal(new Set(ids).size, 67);
  };
  inspect(s);
  const next = s.players.find(p => p.id === s.turnId);
  const rock = [...s.deck, ...s.players.flatMap(p => p.hand)].find(c => c.kind === 'rockfall');
  for (const p of s.players) p.hand = p.hand.filter(c => c.id !== rock.id);
  s.deck = s.deck.filter(c => c.id !== rock.id);
  next.hand.push(rock);
  s = send(s, next.key, { type: 'play', cardId: rock.id, x: 1, y: 0 });
  inspect(s);
});

test('the current publisher edition rejects a player sabotaging their own tools', () => {
  const s = setup();
  const card = give(s, 0, 'break-pick');
  assert.throws(() => send(s, s.players[0].key, { type: 'play', cardId: card.id, target: s.players[0].id }), /another|other|yourself/i);
  assert.deepEqual(s.players[0].broken, []);
});

test('all-edge matching and stopped arms prevent bridges to disconnected islands', () => {
  const s = setup();
  s.board = [
    { x: 0, y: 0, kind: 'start', groups: [['n', 'e', 's', 'w']] },
    { x: 1, y: 0, kind: 'path', groups: [['e'], ['w']] },
    { x: 2, y: 1, kind: 'path', groups: [['n', 's']] }
  ];
  assert.match(placementError(s, CARD_DEFS.cross, 2, 0, 0), /unbroken|entrance|match/i);
  assert.equal(placementError(s, CARD_DEFS['dead-e'], -1, 0, 0), null);
  assert.match(placementError(s, CARD_DEFS.cross, 1, 1, 0), /match/i);
  assert.match(placementError(s, CARD_DEFS.cross, -1, 0, 90), /180/);
  assert.deepEqual(cardGroups(CARD_DEFS['corner-ne'], 180), [['s', 'w']]);
});

test('a newly revealed stone connects to the incoming passage despite an existing side mismatch', () => {
  let s = setup();
  const path = nearGoal(s, false);
  s.board.push({ x: 8, y: 1, kind: 'path', groups: [['e', 'w']] });
  s = send(s, s.players[0].key, { type: 'play', cardId: path.id, x: 7, y: 0, rotation: 0 });
  const goal = s.board.find(c => c.id === 'goal-1');
  assert.equal(goal.revealed, true);
  assert.equal(goal.rotation, 180);
  assert.ok(goal.groups.flat().includes('w'));
  assert.ok(goal.groups.flat().includes('s'));
  assert.equal(s.phase, 'playing');
});

test('a Saboteur finding gold gives miners one reward each in counterclockwise order', () => {
  let s = setup();
  const path = nearGoal(s);
  s.players[0].role = 'saboteur';
  s.players[1].role = s.players[2].role = 'miner';
  s.players[1].broken = ['cart'];
  s = send(s, s.players[0].key, { type: 'play', cardId: path.id, x: 7, y: 0, rotation: 0 });
  assert.equal(s.phase, 'gold');
  assert.equal(s.goldChoice.options.length, 2);
  assert.deepEqual(s.goldChoice.order, [s.players[2].id, s.players[1].id]);
  publicPrivacy(view(s, s.host, true));
  for (const index of [2, 1]) {
    const p = s.players[index];
    const own = view(s, p.key);
    const outsider = view(s, s.players[0].key);
    assert.equal(own.goldChoice.options.length, index === 2 ? 2 : 1);
    assert.equal(outsider.goldChoice.options, undefined);
    s = send(s, p.key, { type: 'chooseGold', cardId: own.goldChoice.options[0].id });
  }
  assert.equal(s.phase, 'roundEnd');
  assert.equal(s.players[0].gold.length, 0);
  assert.equal(s.players[1].gold.length, 1);
  assert.equal(s.players[2].gold.length, 1);
  publicPrivacy(view(s, s.players[1].key, true));
  const lastActor = s.players[0].id;
  s = send(s, s.host, { type: 'nextRound' });
  assert.equal(s.turnId, s.players[(s.players.findIndex(p => p.id === lastActor) + 1) % s.players.length].id);
  assert.equal(s.round, 2);
});

for (const saboteurs of [0, 1, 2, 3, 4]) test(`exhaustion pays exact rewards for ${saboteurs} actual Saboteurs`, () => {
  let s = setup(Math.max(3, saboteurs + 1));
  const card = give(s, 0, 'map');
  s.deck = [];
  s.players.forEach((p, i) => { p.role = i < saboteurs ? 'saboteur' : 'miner'; if (i) p.hand = []; });
  s = send(s, s.players[0].key, { type: 'discard', cardId: card.id });
  assert.equal(s.phase, 'roundEnd');
  const expected = saboteurs === 1 ? 4 : saboteurs < 4 ? 3 : 2;
  for (const [i, p] of s.players.entries()) assert.equal(p.gold.reduce((sum, c) => sum + c.value, 0), i < saboteurs ? expected : 0);
  const gold = [...s.bank, ...s.players.flatMap(p => p.gold)];
  assert.equal(gold.length, 28);
  assert.equal(new Set(gold.map(c => c.id)).size, 28);
  assert.equal(gold.reduce((sum, c) => sum + c.value, 0), 44);
});

test('maps, current roles and reward bank stay absent from every public and other-player view', () => {
  let s = setup();
  const map = give(s, 0, 'map');
  const goal = s.board.find(c => c.kind === 'goal' && c.gold);
  s = send(s, s.players[0].key, { type: 'play', cardId: map.id, target: goal.id });
  assert.equal(view(s, s.players[0].key).me.notes[0].gold, true);
  const stranger = view(s, 'unrelated-capability');
  publicPrivacy(stranger);
  publicPrivacy(view(s, s.host, true));
  publicPrivacy(view(s, s.players[0].key, true));
  const other = view(s, s.players[1].key);
  assert.deepEqual(other.me.notes, []);
  assert.equal(other.players[0].role, undefined);
  assert.equal(other.players[0].hand, undefined);
  assert.equal(other.players[0].goldTotal, undefined);
});

test('uncertain retries are idempotent, changed-snapshot attempts fail, and input snapshots stay immutable', () => {
  let s = setup();
  const actor = s.players.find(p => p.id === s.turnId);
  const original = structuredClone(s);
  const body = { type: 'discard', cardId: actor.hand[0].id, requestId: 'audit-replay-0001', expectedVersion: s.version };
  s = command(s, actor.key, body, random);
  assert.deepEqual(original.players[0].hand, actor.hand);
  assert.equal(command(s, actor.key, body, random).version, s.version);
  assert.throws(() => command(s, actor.key, { ...body, requestId: 'audit-stale-0001' }, random), error => error.status === 409);
  assert.equal(s.version, original.version + 1);
});
