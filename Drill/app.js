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

  let round = null, frame = 0, effect;

  function sound(name) {
    const cue = sounds[name];
    cue.currentTime = 0;
    cue.play().catch(() => {});
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
    const mode = settings.operations.length === 3 ? 'all' : settings.operations.join('+');
    const key = 'best.' + [mode, settings.from, settings.to, settings.count].join('.');
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
        paintQuestion(true);
        sound('correct');
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

  const operationInputs = [...setup.querySelectorAll('[name="operation"]')];
  const stored = read('settings.v2');
  const settings = read('settings.v3') || stored || read('settings');
  if (settings) {
    const operations = settings.operations || (settings.operation === 'all' ?
      operationInputs.map(input => input.value) : [settings.operation]);
    const restored = { ...settings, operations };
    if (!ArithmeticQuestions.validate(restored)) {
      if (settings.operations || stored) {
        $('from').value = settings.from;
        $('to').value = settings.to;
      }
      for (const input of operationInputs) input.checked = operations.includes(input.value);
      setup.elements.count.value = String(settings.count);
    }
  }
  setup.addEventListener('change', () => { $('setup-error').hidden = true; });
  setup.addEventListener('submit', event => {
    event.preventDefault();
    const settings = {
      from: $('from').valueAsNumber, to: $('to').valueAsNumber,
      operations: operationInputs.filter(input => input.checked).map(input => input.value),
      count: Number(setup.elements.count.value)
    };
    const error = ArithmeticQuestions.validate(settings);
    $('setup-error').textContent = error;
    $('setup-error').hidden = !error;
    if (error) return;
    save('settings.v3', settings);
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
  $('again').addEventListener('click', () => begin(round.settings));
  $('exit').addEventListener('click', () => {
    cancelAnimationFrame(frame);
    round = null;
    show(setup);
    setup.querySelector('input:checked').focus({ preventScroll: true });
  });
})();
