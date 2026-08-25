"use strict";
/* Brighton B2 cumulative option-order mixer. Questions 1–60 are authored
   with the correct option first, then moved to a balanced audited A/B/C
   position. Reading questions 61–70 stay canonical:
   A=True, B=False, C=Not enough information. */
(() => {
  const data = window.BRIGHTON_TEST_DATA;
  if (!data || data.__b2ChoiceOrderApplied) return;
  const TARGETS = {"brighton-b2-units-1-4":"CBBABCCAABACCBBAABBCABCABACBCBBCABCCACAABBCACAABBCAABCACCBCA","brighton-b2-units-5-8":"BAACBABACBACACBACACABBCCBACBBACABBCCBBABCBCCABBCCAACBACABACA","brighton-b2-units-9-12":"CACABBCCBAACABBCBCABCBBABCCACBBACAACCABCAABABBCAABCACACBABBC"};
  const target = TARGETS[data.testId];
  if (!target) return;
  const LETTERS = "ABC";
  data.pages.forEach((page) => (page.questions || []).forEach((question) => {
    const n = Number(question.q);
    if (!Number.isInteger(n) || n < 1 || n > 60 || !Array.isArray(question.options) || question.options.length !== 3) return;
    const correctSlot = LETTERS.indexOf(target[n - 1]);
    const distractors = [1, 2];
    if ((n + data.testId.length) % 2 === 0) distractors.reverse();
    const next = [null, null, null];
    next[correctSlot] = question.options[0];
    const free = [0, 1, 2].filter((i) => i !== correctSlot);
    free.forEach((slot, i) => { next[slot] = question.options[distractors[i]]; });
    question.options = next;
  }));
  Object.defineProperty(data, "__b2ChoiceOrderApplied", { value: true, enumerable: false });
})();