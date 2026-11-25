import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import rules from '../wix-backend/src/game/rules.cjs';
import {createRoom, command, view} from '../wix-backend/src/game/engine.mjs';

const expected = {
  ATTEND: ['classes', 'a lecture', 'a seminar'],
  GET: ['a degree', 'practical experience', 'a qualification'],
  MAKE: ['progress', 'a decision', 'friends'],
  SUBMIT: ['an application', 'an assignment', 'a final project']
};
const browserRules = readFileSync(new URL('../rules.js', import.meta.url), 'utf8');
const serverRules = readFileSync(new URL('../wix-backend/src/game/rules.cjs', import.meta.url), 'utf8');
const answerFor = (prompt) => Object.keys(expected).find(verb => expected[verb].includes(prompt));
const host = 'teacher', screen = 'screen', key = 'student';

function setup() {
  const room = createRoom('123456', host, screen, 0, 42);
  command(room, key, 'join', {name: 'Jo'}, 0);
  command(room, host, 'start', {}, 0);
  return room;
}

function choose(room, correct, now = 0) {
  const me = view(room, key, now).me;
  const answer = answerFor(me.prompt);
  assert.ok(answer);
  const other = me.choices.find(verb => verb !== answer);
  command(room, key, 'answer', {round: me.round, verb: correct ? answer : other}, now);
  return view(room, key, now).me;
}

function dropAt(room, distance, now = 0) {
  const {round, motion} = view(room, key, now).me;
  const angle = Math.asin(distance / motion.amplitude);
  const travel = (2 * Math.PI + angle - motion.phase) % (2 * Math.PI);
  const elapsedMs = travel * motion.period / (2 * Math.PI);
  command(room, key, 'drop', {round, elapsedMs}, now + Math.ceil(elapsedMs));
  return view(room, key, now + Math.ceil(elapsedMs)).me;
}

test('the browser uses the same classic script as Wix and practice needs no network', () => {
  assert.equal(browserRules.replace(/\r\n/g, '\n'), serverRules.replace(/\r\n/g, '\n'));
  const self = {};
  vm.runInNewContext(browserRules, {self});
  const solo = self.MatchingBloxxRules.practice('Alex', 101);
  const start = solo.view();
  const {round, prompt} = start.me;
  assert.equal(start.phase, 'playing');
  assert.equal(solo.command('answer', {round, verb: answerFor(prompt)}).me.stage, 'drop');
  assert.equal(solo.command('drop', {round, elapsedMs: 0}).me.stage, 'result');
});

test('room seats, screen and teacher have distinct capabilities and private views', () => {
  const room = createRoom('123456', host, screen, 0, 42);
  assert.throws(() => view(room, '', 0), {status: 401});
  assert.throws(() => view(room, key, 0), {status: 403});
  assert.throws(() => command(room, screen, 'start', {}, 0), {status: 403});
  assert.throws(() => command(room, host, 'start', {}, 0), {status: 409});
  assert.throws(() => command(room, screen, 'join', {name: 'Board'}, 0), {status: 403});
  command(room, key, 'join', {name: ' \n Jo  Smith  '}, 0);
  assert.equal(view(room, key, 0).me.name, 'Jo Smith');
  assert.equal(view(room, key, 0).me.prompt, '');
  command(room, key, 'join', {name: 'Rename'}, 0);
  assert.equal(room.players.length, 1);
  command(room, host, 'start', {}, 0);
  command(room, 'late', 'join', {name: 'Late seat'}, 0);
  assert.equal(view(room, 'late', 0).me.round, 1);
  for (const token of [host, screen]) {
    const snapshot = view(room, token, 0);
    assert.equal(snapshot.me, null);
    assert.deepEqual(Object.keys(snapshot.players[0]).sort(),
      ['canReceiveGust','completed','floors','gustPending','id','name','rank','score']);
    assert.throws(() => command(room, token, 'answer', {round: 1, verb: 'GET'}, 0), {status: 403});
  }
  assert.throws(() => command(room, key, 'finish', {}, 0), {status: 403});
  command(room, host, 'finish', {}, 0);
  assert.equal(view(room, screen, 0).phase, 'finished');
  assert.throws(() => command(room, 'new', 'join', {name: 'Sam'}, 0), {status: 409});
  assert.throws(() => command(room, key, 'answer', {round: 1, verb: 'GET'}, 0), {status: 409});
  assert.throws(() => view(room, host, 86400000), {status: 410});
});

test('36 players fit, including reconnections to a full room', () => {
  const room = setup();
  for (let i = 2; i <= 36; i++) command(room, 'key' + i, 'join', {name: 'Student ' + i}, 0);
  command(room, 'key36', 'join', {name: 'New name'}, 0);
  assert.equal(view(room, screen, 0).players.length, 36);
  assert.throws(() => command(room, 'extra', 'join', {name: 'Extra'}, 0), {status: 409});
});

test('three same-side landings can destabilize an entire tower, while a counterweight keeps it up', () => {
  const room = setup();
  const first = dropAtAfterMatch(room, 0);
  assert.deepEqual(first.placements, [0]);
  dropAtAfterMatch(room, .3);
  const leaning = dropAtAfterMatch(room, .3);
  assert.deepEqual(leaning.placements, [0, .3, .6]);
  assert.ok(leaning.balance > .8);
  const counterweight = dropAtAfterMatch(structuredClone(room), -.3);
  assert.deepEqual(counterweight.placements, [0, .3, .6, .3]);
  assert.ok(counterweight.balance < leaning.balance);
  const collapse = dropAtAfterMatch(room, .3);
  assert.equal(collapse.last.fallen, 3);
  assert.deepEqual(collapse.placements, [0]);
  assert.equal(collapse.last.points, 100);
  assert.equal(view(room, screen, 7000).players[0].floors, 1);
  const miss = rules.placeFloor([0,.3], .9);
  assert.equal(miss.fallen, 0);
  assert.deepEqual(miss.floors, [0,.3]);

  function dropAtAfterMatch(game, offset) {
    const player = view(game, key, 6000).me;
    if (player.stage === 'result') command(game, key, 'next', {round: player.round}, 6000);
    choose(game, true, 6000);
    return dropAt(game, offset, 6000);
  }
});

test('each of the 12 supplied matches appears exactly once before the results close', () => {
  const room = setup();
  const prompts = new Set();
  for (let round = 1; round <= 12; round++) {
    const me = view(room, key, 0).me;
    assert.equal(me.round, round);
    assert.deepEqual(me.choices, Object.keys(expected));
    prompts.add(me.prompt);
    const result = choose(room, false);
    assert.equal(result.last.kind, 'wrong');
    assert.equal(result.last.phrase, answerFor(me.prompt).toLowerCase() + ' ' + me.prompt);
    assert.equal(result.completed, round);
    if (round < 12) command(room, key, 'next', {round}, 0);
  }
  assert.deepEqual([...prompts].sort(), Object.values(expected).flat().sort());
  assert.equal(view(room, screen, 0).phase, 'finished');
  assert.throws(() => command(room, 'late', 'join', {name: 'Late'}, 0), {status: 409});
  const recovered = JSON.parse(JSON.stringify(room));
  assert.deepEqual(view(room, key, 0), view(recovered, key, 0));
});

test('retries and stale rounds cannot score twice, and placement is server-evaluated', () => {
  const room = setup();
  const first = choose(room, true);
  assert.equal(first.score, 100);
  assert.throws(() => command(room, key, 'answer', {round: 1, verb: 'ATTEND'}, 0), {status: 409});
  assert.throws(() => command(room, key, 'drop', {round: 1, elapsedMs: 1e8}, 0), {status: 409});
  assert.throws(() => command(room, key, 'drop', {round: 1, elapsedMs: NaN}, 0), {status: 409});
  const missed = dropAt(room, 1.05);
  assert.equal(missed.last.kind, 'miss');
  assert.equal(missed.score, 100);
  assert.equal(missed.floors, 0);
  assert.throws(() => command(room, key, 'drop', {round: 1, elapsedMs: 0}, 0), {status: 409});
  command(room, key, 'next', {round: 1}, 0);
  assert.throws(() => command(room, key, 'answer', {round: 1, verb: 'ATTEND'}, 0), {status: 409});
  choose(room, true);
  const landed = dropAt(room, 0.48);
  assert.equal(landed.last.kind, 'landed');
  assert.equal(landed.last.points, 151);
  assert.equal(landed.score, 251);
  assert.deepEqual(landed.placements, [0.48]);
  command(room, key, 'next', {round: 2}, 0);
  choose(room, true);
  const perfect = dropAt(room, 0.01);
  assert.deepEqual(perfect.placements, [0.48, 0.48]);
  assert.equal(perfect.last.points, 200);
});

test('earned steady crane survives a wrong answer and is spent on exactly one correct drop', () => {
  const room = setup();
  for (let round = 1; round <= 2; round++) {
    choose(room, true);
    dropAt(room, 0);
    command(room, key, 'next', {round}, 0);
  }
  assert.equal(view(room, key, 0).me.steady, 1);
  command(room, key, 'steady', {round: 3}, 0);
  assert.throws(() => command(room, key, 'steady', {round: 3}, 0), {status: 409});
  choose(room, false);
  command(room, key, 'next', {round: 3}, 0);
  assert.equal(view(room, key, 0).me.steadyArmed, true);
  const crane = choose(room, true);
  assert.equal(crane.motion.period, Math.round((3000 - 270) * 1.7));
  assert.equal(crane.steady, 0);
  assert.equal(crane.steadyArmed, false);
});

test('students play independently and equal standings share rank', () => {
  const room = setup();
  command(room, 'b', 'join', {name: 'Pat'}, 0);
  command(room, 'c', 'join', {name: 'Elle'}, 0);
  choose(room, true);
  dropAt(room, 0);
  assert.deepEqual(view(room, screen, 0).players.map(p => [p.id, p.rank]), [['p1',1],['p2',2],['p3',2]]);
  assert.equal(view(room, 'b', 0).me.stage, 'match');
  assert.equal(view(room, 'c', 0).me.completed, 0);
  assert.equal(rules.position({amplitude: 1, phase: 0, period: 2000}, 500), 1);
});

test('a classroom gust spends an earned charge, preserves a moving crane, then speeds one release', () => {
  const room = setup();
  const rival = 'rival';
  command(room, rival, 'join', {name:'Rival'}, 0);
  for (let round = 1; round <= 2; round++) {
    choose(room, true);
    dropAt(room, 0);
    command(room, key, 'next', {round}, 0);
  }
  let me = view(room, rival, 0).me;
  command(room, rival, 'answer', {round:1, verb:answerFor(me.prompt)}, 0);
  const original = view(room, rival, 0).me;
  command(room, key, 'gust', {round:3, targetId:me.id}, 1);
  assert.equal(view(room, key, 1).me.steady, 0);
  me = view(room, rival, 1).me;
  assert.equal(me.gustPending, true);
  assert.deepEqual(me.motion, original.motion);
  assert.equal(me.score, original.score);
  assert.equal(view(room, screen, 1).players.find(p => p.id === me.id).canReceiveGust, false);
  assert.throws(() => command(room, key, 'gust', {round:3, targetId:me.id}, 1), {status:409});
  command(room, rival, 'drop', {round:1, elapsedMs:0}, 1);
  command(room, rival, 'next', {round:1}, 2);
  me = view(room, rival, 2).me;
  command(room, rival, 'answer', {round:2, verb:me.choices.find(v => v !== answerFor(me.prompt))}, 2);
  assert.equal(view(room, rival, 2).me.gustPending, true);
  command(room, rival, 'next', {round:2}, 3);
  me = view(room, rival, 3).me;
  command(room, rival, 'answer', {round:3, verb:answerFor(me.prompt)}, 3);
  me = view(room, rival, 3).me;
  assert.equal(me.gustPending, false);
  assert.equal(me.motion.gust, true);
  assert.equal(me.canReceiveGust, false);
  assert.equal(me.motion.period, Math.round((3000 - 180)/1.18));
  command(room, rival, 'drop', {round:3, elapsedMs:0}, 4);
  assert.equal(view(room, rival, 4).me.canReceiveGust, true);
  command(room, rival, 'next', {round:3}, 4);
  me = view(room, rival, 4).me;
  command(room, rival, 'answer', {round:4, verb:answerFor(me.prompt)}, 4);
  assert.equal(view(room, rival, 4).me.motion.gust, false);
  assert.equal(view(room, rival, 4).me.motion.period, 3000 - 270);
});

test('invalid or competing gusts preserve the sender charge and cannot affect a finished builder', () => {
  const room = setup();
  command(room, 'b', 'join', {name:'B'}, 0);
  command(room, 'c', 'join', {name:'C'}, 0);
  const [sender, rival, another] = room.players;
  sender.steady = another.steady = 1;
  const send = (who, targetId, round=1) => command(room, who, 'gust', {round, targetId}, 0);
  for (const id of [sender.id, room.host, room.presenter, 'absent']) {
    assert.throws(() => send(key, id), {status:409});
  }
  assert.throws(() => send(host, rival.id), {status:403});
  assert.throws(() => send(screen, rival.id), {status:403});
  assert.throws(() => send(key, rival.id, 2), {status:409});
  sender.steadyArmed = true;
  assert.throws(() => send(key, rival.id), {status:409});
  sender.steadyArmed = false;
  rival.round = 12;
  rival.completed = 11;
  rival.stage = 'drop';
  assert.throws(() => send(key, rival.id), {status:409});
  rival.completed = 12;
  rival.stage = 'result';
  assert.throws(() => send(key, rival.id), {status:409});
  rival.completed = 11;
  rival.stage = 'match';
  assert.equal(view(room, key, 0).me.steady, 1);
  send(key, rival.id);
  assert.throws(() => send('c', rival.id), {status:409});
  assert.equal(view(room, 'c', 0).me.steady, 1);
  const solo = rules.practice('Solo', 42);
  assert.throws(() => solo.command('gust', {round:1, targetId:'p1'}), {status:400});
});
