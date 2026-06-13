import { ok, badRequest, serverError } from 'wix-http-functions';
import wixData from 'wix-data';

const CORS_HEADERS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type"
};

const FALLBACK_EXAMS = [{
  examId: "brighton-b2-rue-final",
  title: "B2 Reading and Use of English Final Exam",
  level: "B2",
  skill: "Reading and Use of English",
  description: "Seven-part B2 First-style Reading and Use of English final exam.",
  shareUrl: "https://YOUR_STATIC_HOST/exams/b2-rue/index.html",
  iframeUrl: "",
  isActive: true,
  totalQuestions: 52,
  maxScore: 70
}];

const FALLBACK_ANSWER_KEYS = {
  "brighton-b2-rue-final": {"examId":"brighton-b2-rue-final","examTitle":"Brighton B2 Reading and Use of English Final Exam","maxScore":70,"totalQuestions":52,"normalization":{"caseInsensitive":true,"trimWhitespace":true,"collapseInternalWhitespace":true,"expandCommonContractionsForPart4":true},"parts":{"1":{"label":"Part 1","questions":[1,2,3,4,5,6,7,8],"maxScore":8},"2":{"label":"Part 2","questions":[9,10,11,12,13,14,15,16],"maxScore":8},"3":{"label":"Part 3","questions":[17,18,19,20,21,22,23,24],"maxScore":8},"4":{"label":"Part 4","questions":[25,26,27,28,29,30],"maxScore":12},"5":{"label":"Part 5","questions":[31,32,33,34,35,36],"maxScore":12},"6":{"label":"Part 6","questions":[37,38,39,40,41,42],"maxScore":12},"7":{"label":"Part 7","questions":[43,44,45,46,47,48,49,50,51,52],"maxScore":10}},"answers":{"1":{"part":1,"points":1,"answers":["A"]},"2":{"part":1,"points":1,"answers":["A"]},"3":{"part":1,"points":1,"answers":["A"]},"4":{"part":1,"points":1,"answers":["A"]},"5":{"part":1,"points":1,"answers":["A"]},"6":{"part":1,"points":1,"answers":["A"]},"7":{"part":1,"points":1,"answers":["A"]},"8":{"part":1,"points":1,"answers":["A"]},"9":{"part":2,"points":1,"answers":["how"]},"10":{"part":2,"points":1,"answers":["where"]},"11":{"part":2,"points":1,"answers":["without"]},"12":{"part":2,"points":1,"answers":["but"]},"13":{"part":2,"points":1,"answers":["than"]},"14":{"part":2,"points":1,"answers":["which"]},"15":{"part":2,"points":1,"answers":["now","already"]},"16":{"part":2,"points":1,"answers":["with","by"]},"17":{"part":3,"points":1,"answers":["reliable"]},"18":{"part":3,"points":1,"answers":["exposure"]},"19":{"part":3,"points":1,"answers":["gradual"]},"20":{"part":3,"points":1,"answers":["curiosity"]},"21":{"part":3,"points":1,"answers":["memorising","memorizing"]},"22":{"part":3,"points":1,"answers":["harmless"]},"23":{"part":3,"points":1,"answers":["responsibility"]},"24":{"part":3,"points":1,"answers":["purposefully"]},"25":{"part":4,"points":2,"mode":"components","minWords":2,"maxWords":5,"answers":["nervous as"],"components":[{"points":1,"any":["nervous"]},{"points":1,"any":["as"]}]},"26":{"part":4,"points":2,"mode":"components","minWords":2,"maxWords":5,"answers":["had been reading"],"components":[{"points":1,"any":["had been"]},{"points":1,"any":["reading"]}]},"27":{"part":4,"points":2,"mode":"components","minWords":2,"maxWords":5,"answers":["are not supposed to enter","aren't supposed to enter","are not supposed to go into","aren't supposed to go into","are not supposed to be in","aren't supposed to be in"],"components":[{"points":1,"any":["are not supposed","aren't supposed"]},{"points":1,"any":["to enter","to go into","to be in"]}]},"28":{"part":4,"points":2,"mode":"components","minWords":2,"maxWords":5,"answers":["will have learned","will have learnt"],"components":[{"points":1,"any":["will have"]},{"points":1,"any":["learned","learnt"]}]},"29":{"part":4,"points":2,"mode":"components","minWords":2,"maxWords":5,"answers":["get used to getting","get used to receiving","get used to accepting","become used to getting","become used to receiving","become used to accepting"],"components":[{"points":1,"any":["get used to","become used to"]},{"points":1,"any":["getting","receiving","accepting"]}]},"30":{"part":4,"points":2,"mode":"components","minWords":2,"maxWords":5,"answers":["despite being","despite it being","despite its being","despite the fact it was","despite the fact that it was"],"components":[{"points":1,"any":["despite"]},{"points":1,"any":["being","it was"]}]},"31":{"part":5,"points":2,"answers":["B"]},"32":{"part":5,"points":2,"answers":["A"]},"33":{"part":5,"points":2,"answers":["C"]},"34":{"part":5,"points":2,"answers":["C"]},"35":{"part":5,"points":2,"answers":["B"]},"36":{"part":5,"points":2,"answers":["C"]},"37":{"part":6,"points":2,"answers":["G"]},"38":{"part":6,"points":2,"answers":["B"]},"39":{"part":6,"points":2,"answers":["A"]},"40":{"part":6,"points":2,"answers":["F"]},"41":{"part":6,"points":2,"answers":["E"]},"42":{"part":6,"points":2,"answers":["C"]},"43":{"part":7,"points":1,"answers":["A"]},"44":{"part":7,"points":1,"answers":["C"]},"45":{"part":7,"points":1,"answers":["B"]},"46":{"part":7,"points":1,"answers":["D"]},"47":{"part":7,"points":1,"answers":["A"]},"48":{"part":7,"points":1,"answers":["B"]},"49":{"part":7,"points":1,"answers":["C"]},"50":{"part":7,"points":1,"answers":["D"]},"51":{"part":7,"points":1,"answers":["C"]},"52":{"part":7,"points":1,"answers":["A"]}}}
};

export function options_getExams(request) { return ok({ headers: CORS_HEADERS, body: { success: true } }); }
export function options_submitExam(request) { return ok({ headers: CORS_HEADERS, body: { success: true } }); }
export function options_getResults(request) { return ok({ headers: CORS_HEADERS, body: { success: true } }); }

export async function get_getExams(request) {
  try {
    const result = await wixData.query("Exams").eq("isActive", true).limit(100).find();
    const exams = result.items.map(publicExamFields);
    return ok({ headers: CORS_HEADERS, body: { success: true, exams } });
  } catch (error) {
    // Let the static teacher page fall back to its local exam list while CMS is being configured.
    return serverError({ headers: CORS_HEADERS, body: { success: false, error: String(error.message || error) } });
  }
}

export async function post_submitExam(request) {
  let payload;
  try {
    payload = await request.body.json();
  } catch (error) {
    return badRequest({ headers: CORS_HEADERS, body: { success: false, error: "Invalid JSON body." } });
  }

  const validationError = validatePayload(payload);
  if (validationError) {
    return badRequest({ headers: CORS_HEADERS, body: { success: false, error: validationError } });
  }

  let grading;
  let status = "submitted";
  let gradingError = "";

  try {
    const answerKey = await loadAnswerKey(payload.examId);
    grading = gradeSubmission(payload, answerKey);
  } catch (error) {
    status = "submitted_ungraded";
    gradingError = String(error.message || error);
    grading = { score: null, maxScore: null, percentage: null, partScores: {}, details: [] };
  }

  const submittedAt = validDate(payload.submittedAt) || new Date();
  const item = {
    submissionId: makeSubmissionId(payload),
    examId: payload.examId,
    examTitle: payload.examTitle || payload.examId,
    studentName: String(payload.studentName || "").trim(),
    classId: String(payload.classId || "").trim(),
    answersJson: safeStringify(payload.answers || {}),
    answerListJson: safeStringify(payload.answerList || flattenAnswers(payload)),
    flaggedJson: safeStringify(payload.flagged || []),
    notes: String(payload.notes || ""),
    score: grading.score,
    maxScore: grading.maxScore,
    percentage: grading.percentage,
    partScoresJson: safeStringify(grading.partScores || {}),
    gradingDetailsJson: safeStringify(grading.details || []),
    startedAt: validDate(payload.startedAt),
    submittedAt,
    submittedAtLocal: formatLocal(submittedAt),
    timeSpentSeconds: Number.isFinite(Number(payload.timeSpentSeconds)) ? Number(payload.timeSpentSeconds) : null,
    rawPayloadJson: safeStringify(payload),
    status,
    gradingError
  };

  try {
    const saved = await wixData.insert("ExamSubmissions", item);
    return ok({
      headers: CORS_HEADERS,
      body: {
        success: true,
        submissionId: saved.submissionId,
        score: item.score,
        maxScore: item.maxScore,
        percentage: item.percentage,
        partScores: grading.partScores,
        status
      }
    });
  } catch (error) {
    return serverError({ headers: CORS_HEADERS, body: { success: false, error: `Could not save submission: ${error.message || error}` } });
  }
}

export async function get_getResults(request) {
  const classId = String(request.query?.classId || "").trim();
  const examId = String(request.query?.examId || "").trim();
  if (!classId) return badRequest({ headers: CORS_HEADERS, body: { success: false, error: "classId is required." } });

  try {
    let query = wixData.query("ExamSubmissions").eq("classId", classId);
    if (examId) query = query.eq("examId", examId);
    const result = await query.descending("submittedAt").limit(1000).find();
    const items = [];

    for (const original of result.items) {
      let item = { ...original };
      if ((item.score === null || item.score === undefined || item.status === "submitted_ungraded") && item.rawPayloadJson) {
        try {
          const payload = JSON.parse(item.rawPayloadJson);
          const answerKey = await loadAnswerKey(item.examId || payload.examId);
          const grading = gradeSubmission(payload, answerKey);
          item = {
            ...item,
            score: grading.score,
            maxScore: grading.maxScore,
            percentage: grading.percentage,
            partScoresJson: safeStringify(grading.partScores),
            gradingDetailsJson: safeStringify(grading.details),
            status: "graded_on_read",
            gradingError: ""
          };
          await wixData.update("ExamSubmissions", item);
        } catch (error) {
          item.gradingError = String(error.message || error);
        }
      }
      items.push(publicSubmissionFields(item));
    }

    const percentages = items.map(item => Number(item.percentage)).filter(Number.isFinite);
    const summary = {
      total: items.length,
      average: percentages.length ? Math.round(percentages.reduce((sum, n) => sum + n, 0) / percentages.length) : null,
      highest: percentages.length ? Math.max(...percentages) : null,
      lowest: percentages.length ? Math.min(...percentages) : null
    };

    return ok({ headers: CORS_HEADERS, body: { success: true, items, summary } });
  } catch (error) {
    return serverError({ headers: CORS_HEADERS, body: { success: false, error: String(error.message || error) } });
  }
}

function publicExamFields(exam) {
  return {
    examId: exam.examId,
    title: exam.title,
    level: exam.level,
    skill: exam.skill,
    description: exam.description,
    shareUrl: exam.shareUrl,
    iframeUrl: exam.iframeUrl,
    isActive: exam.isActive,
    totalQuestions: exam.totalQuestions,
    maxScore: exam.maxScore
  };
}

function publicSubmissionFields(item) {
  return {
    submissionId: item.submissionId,
    examId: item.examId,
    examTitle: item.examTitle,
    studentName: item.studentName,
    classId: item.classId,
    answersJson: item.answersJson,
    answerListJson: item.answerListJson,
    flaggedJson: item.flaggedJson,
    notes: item.notes,
    score: item.score,
    maxScore: item.maxScore,
    percentage: item.percentage,
    partScoresJson: item.partScoresJson,
    gradingDetailsJson: item.gradingDetailsJson,
    startedAt: item.startedAt,
    submittedAt: item.submittedAt,
    submittedAtLocal: item.submittedAtLocal,
    timeSpentSeconds: item.timeSpentSeconds,
    rawPayloadJson: item.rawPayloadJson,
    status: item.status,
    gradingError: item.gradingError
  };
}

async function loadAnswerKey(examId) {
  try {
    const result = await wixData.query("Exams").eq("examId", examId).limit(1).find();
    const exam = result.items[0];
    if (exam?.answerKeyJson) return JSON.parse(exam.answerKeyJson);
  } catch (error) {
    // Fall through to embedded fallback.
  }
  if (FALLBACK_ANSWER_KEYS[examId]) return FALLBACK_ANSWER_KEYS[examId];
  throw new Error(`No answer key found for examId: ${examId}`);
}

function validatePayload(payload) {
  if (!payload || typeof payload !== "object") return "Missing payload.";
  if (!String(payload.examId || "").trim()) return "Missing examId.";
  if (!String(payload.studentName || "").trim()) return "Missing studentName.";
  if (!String(payload.classId || "").trim()) return "Missing classId.";
  if (!payload.answers && !Array.isArray(payload.answerList)) return "Missing answers.";
  return "";
}

const COMMON_CONTRACTIONS = [
  [/\baren't\b/gi, "are not"], [/\bisn't\b/gi, "is not"], [/\bwasn't\b/gi, "was not"], [/\bweren't\b/gi, "were not"],
  [/\bdon't\b/gi, "do not"], [/\bdoesn't\b/gi, "does not"], [/\bdidn't\b/gi, "did not"],
  [/\bcan't\b/gi, "cannot"], [/\bcouldn't\b/gi, "could not"], [/\bwon't\b/gi, "will not"], [/\bwouldn't\b/gi, "would not"],
  [/\bshouldn't\b/gi, "should not"], [/\bmustn't\b/gi, "must not"], [/\bhasn't\b/gi, "has not"], [/\bhaven't\b/gi, "have not"], [/\bhadn't\b/gi, "had not"],
  [/\bit's\b/gi, "it is"], [/\bi'm\b/gi, "i am"], [/\bthey're\b/gi, "they are"], [/\bwe're\b/gi, "we are"], [/\byou're\b/gi, "you are"]
];

function normalizeAnswer(value, options = {}) {
  let text = String(value ?? "").normalize("NFKC").replace(/[‘’]/g, "'").replace(/[“”]/g, '"').trim();
  if (options.expandContractions) {
    for (const [pattern, replacement] of COMMON_CONTRACTIONS) text = text.replace(pattern, replacement);
  }
  return text.replace(/[.!?;,:[\]{}()]/g, " ").replace(/\s+/g, " ").trim().toUpperCase();
}

function countAnswerWords(value) {
  const normalized = normalizeAnswer(value, { expandContractions: true });
  return normalized ? normalized.split(/\s+/).filter(Boolean).length : 0;
}

function flattenAnswers(payload) {
  if (Array.isArray(payload?.answerList)) return payload.answerList;
  const answers = payload?.answers || {};
  const flat = [];
  Object.entries(answers).forEach(([partId, partAnswers]) => {
    const part = Number(String(partId).replace(/\D+/g, "")) || null;
    Object.entries(partAnswers || {}).forEach(([q, answer]) => flat.push({ part, partId, question: Number(q), answer }));
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
    const partKey = `part${rule.part || ""}`;
    score += earned;
    if (!partScores[partKey]) partScores[partKey] = { label: `Part ${rule.part}`, score: 0, maxScore: 0, correct: 0, total: 0 };
    partScores[partKey].score += earned;
    if (earned >= Number(rule.points || 1)) partScores[partKey].correct += 1;
    details.push({ question: Number(q), part: Number(rule.part || 0), answer: raw, normalizedAnswer: normalizeAnswer(raw, { expandContractions: rule.mode === "components" }), earned, max: Number(rule.points || 1), correct: earned >= Number(rule.points || 1) });
  });
  return { score, maxScore, percentage: maxScore ? Math.round((score / maxScore) * 100) : 0, partScores, details };
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

function makeSubmissionId(payload) {
  const stamp = Date.now();
  const random = Math.random().toString(36).slice(2, 8);
  const classId = String(payload.classId || "class").replace(/[^a-z0-9_-]+/gi, "-");
  return `${payload.examId}_${classId}_${stamp}_${random}`;
}

function validDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date : null;
}

function safeStringify(value) {
  try { return JSON.stringify(value ?? null); } catch (error) { return JSON.stringify({ error: "Could not stringify value" }); }
}

function formatLocal(date) {
  try { return date.toLocaleString("en-GB", { timeZone: "America/Guayaquil" }); } catch (error) { return date.toISOString(); }
}
