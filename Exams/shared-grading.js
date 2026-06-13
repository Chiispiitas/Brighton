(function () {
  const COMMON_CONTRACTIONS = [
    [/\baren't\b/gi, "are not"], [/\bisn't\b/gi, "is not"], [/\bwasn't\b/gi, "was not"], [/\bweren't\b/gi, "were not"],
    [/\bdon't\b/gi, "do not"], [/\bdoesn't\b/gi, "does not"], [/\bdidn't\b/gi, "did not"],
    [/\bcan't\b/gi, "cannot"], [/\bcouldn't\b/gi, "could not"], [/\bwon't\b/gi, "will not"], [/\bwouldn't\b/gi, "would not"],
    [/\bshouldn't\b/gi, "should not"], [/\bmustn't\b/gi, "must not"], [/\bhasn't\b/gi, "has not"], [/\bhaven't\b/gi, "have not"], [/\bhadn't\b/gi, "had not"],
    [/\bit's\b/gi, "it is"], [/\bi'm\b/gi, "i am"], [/\bthey're\b/gi, "they are"], [/\bwe're\b/gi, "we are"], [/\byou're\b/gi, "you are"]
  ];

  function normalizeAnswer(value, options = {}) {
    let text = String(value ?? "")
      .normalize("NFKC")
      .replace(/[‘’]/g, "'")
      .replace(/[“”]/g, '"')
      .trim();
    if (options.expandContractions) {
      for (const [pattern, replacement] of COMMON_CONTRACTIONS) text = text.replace(pattern, replacement);
    }
    text = text.replace(/[.!?;,:[\]{}()]/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .toUpperCase();
    return text;
  }

  function countAnswerWords(value) {
    const normalized = normalizeAnswer(value, { expandContractions: true });
    if (!normalized) return 0;
    return normalized.split(/\s+/).filter(Boolean).length;
  }

  function flattenAnswers(payload) {
    if (Array.isArray(payload?.answerList)) return payload.answerList;
    const answers = payload?.answers || {};
    const flat = [];
    Object.entries(answers).forEach(([partId, partAnswers]) => {
      const part = Number(String(partId).replace(/\D+/g, "")) || null;
      Object.entries(partAnswers || {}).forEach(([q, answer]) => {
        flat.push({ part, partId, question: Number(q), answer });
      });
    });
    return flat.sort((a, b) => Number(a.question) - Number(b.question));
  }

  function gradeSubmission(payload, answerKey) {
    const answerList = flattenAnswers(payload);
    const byQuestion = new Map(answerList.map(item => [String(item.question), item.answer]));
    const details = [];
    const partScores = {};
    Object.entries(answerKey.parts || {}).forEach(([partNo, part]) => {
      partScores[`part${partNo}`] = { label: part.label || `Part ${partNo}`, score: 0, maxScore: Number(part.maxScore || 0), correct: 0, total: (part.questions || []).length };
    });

    let score = 0;
    const maxScore = Number(answerKey.maxScore || 0);
    Object.entries(answerKey.answers || {}).forEach(([q, rule]) => {
      const raw = byQuestion.get(String(q)) ?? "";
      const earned = gradeOne(raw, rule);
      const partNo = String(rule.part || "");
      const partKey = `part${partNo}`;
      score += earned;
      if (!partScores[partKey]) partScores[partKey] = { label: `Part ${partNo}`, score: 0, maxScore: 0, correct: 0, total: 0 };
      partScores[partKey].score += earned;
      if (earned >= Number(rule.points || 1)) partScores[partKey].correct += 1;
      details.push({
        question: Number(q),
        part: Number(rule.part || 0),
        answer: raw,
        normalizedAnswer: normalizeAnswer(raw, { expandContractions: rule.mode === "components" }),
        earned,
        max: Number(rule.points || 1),
        correct: earned >= Number(rule.points || 1)
      });
    });

    return {
      score,
      maxScore,
      percentage: maxScore ? Math.round((score / maxScore) * 100) : 0,
      partScores,
      details
    };
  }

  function gradeOne(raw, rule) {
    const max = Number(rule.points || 1);
    const normalized = normalizeAnswer(raw, { expandContractions: rule.mode === "components" });
    if (!normalized) return 0;

    if (rule.mode === "components") {
      const words = countAnswerWords(raw);
      if ((rule.minWords && words < rule.minWords) || (rule.maxWords && words > rule.maxWords)) return 0;
      const accepted = (rule.answers || []).map(a => normalizeAnswer(a, { expandContractions: true }));
      if (accepted.includes(normalized)) return max;
      let earned = 0;
      for (const component of (rule.components || [])) {
        const hit = (component.any || []).some(variant => containsPhrase(normalized, normalizeAnswer(variant, { expandContractions: true })));
        if (hit) earned += Number(component.points || 1);
      }
      return Math.max(0, Math.min(max, earned));
    }

    const accepted = (rule.answers || []).map(a => normalizeAnswer(a));
    return accepted.includes(normalized) ? max : 0;
  }

  function containsPhrase(normalizedText, normalizedPhrase) {
    if (!normalizedText || !normalizedPhrase) return false;
    return (` ${normalizedText} `).includes(` ${normalizedPhrase} `);
  }

  async function loadAnswerKey(examId) {
    const response = await fetch(`answer-keys/${encodeURIComponent(examId)}.json`, { headers: { Accept: "application/json" } });
    if (!response.ok) throw new Error(`Could not load answer key for ${examId}`);
    return response.json();
  }

  window.BrightonGrading = { normalizeAnswer, countAnswerWords, flattenAnswers, gradeSubmission, gradeOne, loadAnswerKey };
})();
