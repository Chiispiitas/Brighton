(() => {
  'use strict';

  const $ = id => document.getElementById(id);
  const setup = $('setup'), game = $('game'), results = $('results'), answer = $('answer');
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const sounds = Object.fromEntries(['start', 'correct', 'wrong', 'finish'].map(name => {
    const cue = new Audio('assets/' + name + '.mp3');
    cue.preload = 'auto';
    cue.volume = name === 'correct' ? .38 : .52;
    return [name, cue];
  }));

  function read(key) {
    try { return JSON.parse(localStorage.getItem('arithmetic.' + key)); }
    catch { return null; }
  }

  function save(key, value) {
    try { localStorage.setItem('arithmetic.' + key, JSON.stringify(value)); }
    catch { /* Practice remains available in private or restricted browsers. */ }
  }

  let muted = read('muted') === true, round = null, frame = 0, effect;

  function sound(name) {
    if (muted) return;
    const cue = sounds[name];
    cue.currentTime = 0;
    cue.play().catch(() => {});
  }

  function paintSound() {
    $('sound').textContent = muted ? 'Sound off' : 'Sound on';
    $('sound').setAttribute('aria-pressed', String(!muted));
  }

  function formatTime(ms) {
    const tenths = Math.floor(ms / 100);
    return Math.floor(tenths / 600) + ':' + String(Math.floor(tenths / 10) % 60).padStart(2, '0') + '.' + tenths % 10;
  }

  function show(screen) {
    for (const section of [setup, game, results]) section.hidden = section !== screen;
    $('exit').hidden = screen === setup;
  }

  function paintTimer() {
    const time = formatTime(performance.now() - round.started);
    if ($('timer').textContent !== time) $('timer').textContent = time;
    frame = requestAnimationFrame(paintTimer);
  }

  function paintQuestion(animate) {
    const question = round.questions[round.index];
    $('expression').textContent = question.left + ' ' + question.symbol + ' ' + question.right;
    $('progress').textContent = (round.index + 1) + ' / ' + round.questions.length;
    $('track').style.setProperty('--progress', round.index / round.questions.length);
    $('feedback').textContent = '';
    answer.value = '';
    answer.removeAttribute('aria-invalid');
    if (effect) effect.cancel();
    if (animate && !motion.matches && $('expression').animate) {
      effect = $('expression').animate([
        { opacity: .55, transform: 'translateY(5px)' },
        { opacity: 1, transform: 'none' }
      ], { duration: 105, easing: 'ease-out' });
    }
  }

  function begin(settings) {
    const questions = ArithmeticQuestions.generate(settings);
    cancelAnimationFrame(frame);
    round = { questions, settings, index: 0, misses: 0, started: performance.now() };
    show(game);
    paintQuestion(false);
    paintTimer();
    answer.focus({ preventScroll: true });
    sound('start');
  }

  function finish() {
    const { started, settings, index, misses } = round;
    const duration = performance.now() - started;
    cancelAnimationFrame(frame);
    $('result-time').textContent = formatTime(duration);
    $('solved').textContent = index + '/' + settings.count;
    $('misses').textContent = misses;
    $('pace').textContent = (duration / index / 1000).toFixed(1) + ' s';
    const key = 'best.' + [settings.operation, settings.from, settings.to, settings.count].join('.');
    let best = read(key);
    if (!misses && (!best || duration < best)) {
      best = duration;
      save(key, best);
    }
    $('best').hidden = !best;
    if (best) $('best').textContent = 'Best clean time · ' + formatTime(best);
    show(results);
    $('result-heading').focus({ preventScroll: true });
    sound('finish');
  }

  function attempt(committed) {
    if (!round || game.hidden) return;
    if (answer.value && Number(answer.value) === round.questions[round.index].answer) {
      round.index++;
      if (round.index === round.questions.length) {
        finish();
      } else {
        sound('correct');
        paintQuestion(true);
      }
    } else if (committed && answer.value) {
      round.misses++;
      answer.value = '';
      answer.setAttribute('aria-invalid', 'true');
      $('feedback').textContent = 'Try again';
      sound('wrong');
      if (!motion.matches && answer.animate) {
        answer.animate([{ transform: 'translateX(-5px)' }, { transform: 'translateX(4px)' }, { transform: 'none' }], 125);
      }
    }
  }

  function operationChanged() {
    const operation = setup.elements.operation.value;
    $('range-note').hidden = operation === 'add' || operation === 'subtract';
    $('setup-error').hidden = true;
  }

  const settings = read('settings');
  if (settings && !ArithmeticQuestions.validate(settings)) {
    $('from').value = settings.from;
    $('to').value = settings.to;
    setup.elements.operation.value = settings.operation;
    setup.elements.count.value = String(settings.count);
  }
  operationChanged();
  paintSound();

  setup.addEventListener('change', operationChanged);
  setup.addEventListener('submit', event => {
    event.preventDefault();
    const settings = {
      from: $('from').valueAsNumber, to: $('to').valueAsNumber,
      operation: setup.elements.operation.value, count: Number(setup.elements.count.value)
    };
    const error = ArithmeticQuestions.validate(settings);
    $('setup-error').textContent = error;
    $('setup-error').hidden = !error;
    if (error) return;
    save('settings', settings);
    begin(settings);
  });
  answer.addEventListener('input', () => {
    answer.value = answer.value.replace(/[^0-9]/g, '').slice(0, 4);
    if (answer.value) {
      $('feedback').textContent = '';
      answer.removeAttribute('aria-invalid');
      attempt(false);
    }
  });
  $('entry').addEventListener('submit', event => {
    event.preventDefault();
    attempt(true);
  });
  $('pad').addEventListener('click', event => {
    const button = event.target.closest('button[data-key]');
    if (!button || game.hidden) return;
    const key = button.dataset.key;
    answer.focus({ preventScroll: true });
    if (key === 'enter') {
      attempt(true);
      return;
    }
    answer.value = key === 'erase' ? answer.value.slice(0, -1) : (answer.value + key).slice(0, 4);
    if (answer.value) {
      $('feedback').textContent = '';
      answer.removeAttribute('aria-invalid');
      attempt(false);
    }
  });
  $('sound').addEventListener('click', () => {
    muted = !muted;
    save('muted', muted);
    paintSound();
    if (muted) Object.values(sounds).forEach(cue => cue.pause());
    else sound('correct');
    if (!game.hidden) answer.focus({ preventScroll: true });
  });
  $('again').addEventListener('click', () => begin(round.settings));
  $('exit').addEventListener('click', () => {
    cancelAnimationFrame(frame);
    round = null;
    show(setup);
    setup.querySelector('input:checked').focus({ preventScroll: true });
  });
})();
