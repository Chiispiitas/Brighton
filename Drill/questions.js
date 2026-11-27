(function (root) {
  'use strict';

  const operators = { add: '+', subtract: '−', multiply: '×' };

  function validate(settings) {
    const { from, to, operation, count } = settings;
    if (![from, to].every(number => Number.isInteger(number) && number >= 0 && number <= 999)) {
      return 'Enter whole numbers from 0 to 999.';
    }
    if (from > to) return 'The starting number must be smaller than or equal to the ending number.';
    if (!Object.prototype.hasOwnProperty.call(operators, operation) && operation !== 'all') return 'Choose an operation.';
    if (!['add', 'subtract'].includes(operation) && from > 9) {
      return 'Start at 9 or below to include multiplication.';
    }
    if (![10, 20, 30].includes(count)) return 'Choose 10, 20, or 30 questions.';
    return '';
  }

  function generate(settings, random = Math.random) {
    const error = validate(settings);
    if (error) throw new RangeError(error);
    const { from, to, operation, count } = settings;
    const choose = (low, high) => low + Math.floor(random() * (high - low + 1));

    function make(kind) {
      let left = choose(from, kind === 'multiply' ? Math.min(to, 9) : to);
      let right = choose(from, kind === 'multiply' ? Math.min(to, 99) : to);
      if (kind === 'subtract' ? left < right : kind === 'multiply' && random() < .5) {
        [left, right] = [right, left];
      }
      const answer = kind === 'add' ? left + right : kind === 'subtract' ? left - right : left * right;
      const key = kind === 'subtract' ? left + ':' + right : [Math.min(left, right), Math.max(left, right)].join(':');
      return { left, right, symbol: operators[kind], answer, key: kind + ':' + key };
    }

    const deck = [];
    let kinds = [];
    while (deck.length < count) {
      if (!kinds.length) {
        kinds = operation === 'all' ? Object.keys(operators) : [operation];
        for (let i = kinds.length - 1; i > 0; i--) {
          const j = choose(0, i);
          [kinds[i], kinds[j]] = [kinds[j], kinds[i]];
        }
      }
      const kind = kinds.pop();
      let question = make(kind);
      const previous = deck[deck.length - 1];
      for (let retry = 0; previous && question.key === previous.key && retry < 8; retry++) {
        question = make(kind);
      }
      deck.push(question);
    }
    return deck;
  }

  const api = { validate, generate };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.ArithmeticQuestions = api;
})(globalThis);
