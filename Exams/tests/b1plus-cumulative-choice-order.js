"use strict";
/* ==============================================
   Brighton English School - B1+ cumulative choice order
   Keeps converted cumulative tests from exposing a predictable
   A/B/C answer pattern. Reading T/F/N questions are intentionally
   untouched so A=True, B=False, C=Not enough information remains fixed.
============================================== */

(() => {
  const data = window.BRIGHTON_TEST_DATA;
  if (!data || data.__b1plusChoiceOrderApplied) return;

  const TARGETS = {
    "brighton-b1plus-units-1-4": "CCABBAABBCCBCCABCAABCACAABABABCABBCBCBABACABBAABCAACCACACBBCACBACCABCB",
    "brighton-b1plus-units-5-8": "CBABCABCBBCABCBABAACCABABAABCAACAACBABAABACCBABACCBCCACBCCBBABCCAACBCB",
    "brighton-b1plus-units-9-12": "BCBACBCABABAABABACACABAABBACACCACBACABCBCCACBCCABCABCBABBABABCACBCCACB"
  };

  const target = TARGETS[data.testId];
  if (!target) return;

  const LETTERS = "ABC";

  function permutationFor(questionNumber) {
    const q = Number(questionNumber);
    if (!Number.isInteger(q) || q < 1 || q > target.length) return [0, 1, 2];

    // The source-converted items 1-70 were originally authored with
    // correct positions A/B/C repeating. Move the correct option to the
    // audited mixed target position, and alternate the two distractors.
    const originalCorrectIndex = (q - 1) % 3;
    const targetCorrectIndex = LETTERS.indexOf(target[q - 1]);
    const oldDistractors = [0, 1, 2].filter((index) => index !== originalCorrectIndex);
    const newDistractorSlots = [0, 1, 2].filter((index) => index !== targetCorrectIndex);

    if ((q + data.testId.length) % 2 === 0) oldDistractors.reverse();

    const permutation = [null, null, null];
    permutation[targetCorrectIndex] = originalCorrectIndex;
    newDistractorSlots.forEach((slot, index) => {
      permutation[slot] = oldDistractors[index];
    });
    return permutation;
  }

  data.pages.forEach((page) => {
    (page.questions || []).forEach((question) => {
      const q = Number(question.q);
      if (!Number.isInteger(q) || q < 1 || q > target.length) return;
      if (!Array.isArray(question.options) || question.options.length !== 3) return;
      const permutation = permutationFor(q);
      question.options = permutation.map((oldIndex) => question.options[oldIndex]);
    });
  });

  Object.defineProperty(data, "__b1plusChoiceOrderApplied", {
    value: true,
    enumerable: false,
    configurable: false
  });
})();
