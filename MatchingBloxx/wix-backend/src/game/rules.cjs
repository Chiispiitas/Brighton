/* Shared classroom and practice rules. This file can run as a classic script. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.MatchingBloxxRules = factory();
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  var verbs = ['ATTEND', 'GET', 'MAKE', 'SUBMIT'];
  var phrases = [
    'classes', 'a lecture', 'a seminar',
    'a degree', 'practical experience', 'a qualification',
    'progress', 'a decision', 'friends',
    'an application', 'an assignment', 'a final project'
  ];
  var total = phrases.length;

  function GameError(message, status) {
    this.name = 'GameError';
    this.message = message;
    this.status = status || 400;
    if (Error.captureStackTrace) Error.captureStackTrace(this, GameError);
  }
  GameError.prototype = Object.create(Error.prototype);
  GameError.prototype.constructor = GameError;

  function check(test, message, status) {
    if (!test) throw new GameError(message, status);
  }

  function randomizer(seed) {
    var value = Math.floor(Math.abs(seed)) % 2147483646 + 1;
    return function () {
      value = (value * 48271) % 2147483647;
      return value / 2147483647;
    };
  }

  function deckFor(seed) {
    var random = randomizer(seed);
    var deck = phrases.map(function (_, i) { return i; });
    for (var i = deck.length - 1; i > 0; i--) {
      var j = Math.floor(random() * (i + 1));
      var previous = deck[i];
      deck[i] = deck[j];
      deck[j] = previous;
    }
    return deck;
  }

  function newPlayer(id, name, seed) {
    return {
      id: id, name: name, deck: deckFor(seed), seed: seed,
      round: 1, completed: 0, stage: 'match', score: 0, placements: [],
      perfectStreak: 0, steady: 0, steadyArmed: false, gustPending: false,
      motion: null, last: null
    };
  }

  function position(motion, elapsedMs) {
    return motion.amplitude * Math.sin(motion.phase + elapsedMs * 2 * Math.PI / motion.period);
  }

  function finishAttempt(player, kind, phrase, points, offset) {
    player.completed++;
    player.stage = 'result';
    player.motion = null;
    player.last = {kind: kind, phrase: phrase, points: points, offset: offset};
    if (kind !== 'perfect') player.perfectStreak = 0;
  }

  function play(player, action, data, now) {
    data = data || {};
    check(data.round === player.round, 'This floor has already changed.', 409);
    var index = player.deck[player.round - 1];
    var answer = verbs[Math.floor(index / 3)];
    var phrase = answer.toLowerCase() + ' ' + phrases[index];
    if (action === 'next') {
      check(player.stage === 'result', 'Finish this floor first.', 409);
      if (player.completed === total) player.stage = 'done';
      else {
        player.round++;
        player.stage = 'match';
        player.last = null;
      }
      return;
    }
    if (action === 'steady') {
      check(player.stage === 'match' && player.steady && !player.steadyArmed, 'Steady Crane is unavailable.', 409);
      player.steadyArmed = true;
      return;
    }
    if (action === 'answer') {
      check(player.stage === 'match', 'You already chose a verb for this floor.', 409);
      var verb = typeof data.verb === 'string' ? data.verb.toUpperCase() : '';
      check(verbs.indexOf(verb) >= 0, 'Choose one of the four verbs.');
      if (verb !== answer) {
        finishAttempt(player, 'wrong', phrase, 0, 0);
        return;
      }
      player.score += 100;
      player.stage = 'drop';
      var random = randomizer(player.seed + player.round * 13499);
      var period = Math.max(1850, 3000 - 90 * (player.round - 1));
      player.motion = {
        period: Math.round(period * (player.steadyArmed ? 1.7 : 1) / (player.gustPending ? 1.18 : 1)),
        amplitude: 1.20,
        phase: (random() < 0.5 ? -1 : 1) * (1.00 + 0.57 * random()),
        gust: !!player.gustPending,
        startedAt: now
      };
      player.gustPending = false;
      if (player.steadyArmed) {
        player.steady = 0;
        player.steadyArmed = false;
      }
      return;
    }
    check(action === 'drop', 'Unknown game action.');
    check(player.stage === 'drop', 'Match the floor before dropping it.', 409);
    var elapsed = data.elapsedMs;
    check(typeof elapsed === 'number' && isFinite(elapsed) && elapsed >= 0 &&
      elapsed <= Math.max(0, now - player.motion.startedAt) + 500,
      'The crane timing has changed. Try the drop again.', 409);
    var offset = position(player.motion, elapsed);
    var distance = Math.abs(offset);
    if (distance >= 0.85) {
      finishAttempt(player, 'miss', phrase, 100, offset);
      return;
    }
    var perfect = distance <= 0.12;
    var bonus = perfect ? 100 : Math.max(1, Math.round(100 * (0.85 - distance) / 0.73));
    var top = player.placements[player.placements.length - 1] || 0;
    player.placements.push(Math.round((top + (perfect ? 0 : offset)) * 1000) / 1000);
    player.score += bonus;
    if (perfect && ++player.perfectStreak === 2) {
      player.steady = 1;
      player.perfectStreak = 0;
    }
    finishAttempt(player, perfect ? 'perfect' : 'landed', phrase, 100 + bonus, offset);
  }

  function canReceiveGust(player) {
    return player.completed < total && !player.gustPending && !(player.motion && player.motion.gust) &&
      !(player.round === total && player.stage === 'drop');
  }

  function standing(player) {
    return {id: player.id, name: player.name, score: player.score,
      floors: player.placements.length, completed: player.completed,
      gustPending: !!player.gustPending, canReceiveGust: canReceiveGust(player)};
  }

  function standings(players) {
    var rows = players.map(standing);
    rows.sort(function (a, b) {
      return b.score - a.score || b.floors - a.floors ||
        Number(a.id.slice(1)) - Number(b.id.slice(1));
    });
    rows.forEach(function (row, i) {
      var previous = rows[i - 1];
      row.rank = previous && previous.score === row.score && previous.floors === row.floors ?
        previous.rank : i + 1;
    });
    return rows;
  }

  function playerView(player, phase) {
    var row = standing(player);
    row.stage = player.stage;
    row.round = player.round;
    row.prompt = phase === 'playing' ? phrases[player.deck[player.round - 1]] : '';
    row.choices = verbs.slice();
    row.placements = player.placements.slice();
    row.steady = player.steady;
    row.steadyArmed = player.steadyArmed;
    row.motion = player.motion && {
      phase: player.motion.phase, period: player.motion.period, amplitude: player.motion.amplitude,
      gust: !!player.motion.gust
    };
    var last = player.last;
    row.last = last && {kind: last.kind, phrase: last.phrase, points: last.points, offset: last.offset};
    return row;
  }

  function practice(name, seed) {
    var player = newPlayer('p1', name || 'You', typeof seed === 'number' ? seed : Math.floor(Math.random() * 1e9));
    function view() {
      var phase = player.completed === total ? 'finished' : 'playing';
      return {code: '', role: 'player', phase: phase, total: total, capacity: 1,
        players: standings([player]), me: playerView(player, phase)};
    }
    return {
      view: view,
      command: function (action, data) {
        play(player, action, data, Date.now());
        return view();
      }
    };
  }

  return {total: total, GameError: GameError, newPlayer: newPlayer, play: play,
    position: position, standings: standings, playerView: playerView,
    canReceiveGust: canReceiveGust, practice: practice};
}));
