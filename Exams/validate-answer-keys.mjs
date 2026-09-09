import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const EXAMS_DIR = path.dirname(fileURLToPath(import.meta.url));
const TESTS_DIR = path.join(EXAMS_DIR, "tests");
const KEYS_DIR = path.join(EXAMS_DIR, "answer-keys");
const LETTERS = "ABC";

const errors = [];
const warnings = [];
let validatedTests = 0;
let validatedQuestions = 0;

function fail(testId, message) {
  errors.push(`${testId}: ${message}`);
}

function warn(testId, message) {
  warnings.push(`${testId}: ${message}`);
}

function readText(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

function loadTestData(dataPath) {
  const sandbox = {
    window: {},
    console: {
      log() {},
      info() {},
      warn() {},
      error() {}
    }
  };
  vm.createContext(sandbox);
  vm.runInContext(readText(dataPath), sandbox, { filename: dataPath });
  return { sandbox, data: sandbox.window.BRIGHTON_TEST_DATA };
}

function sortedNumbers(values) {
  return [...values].map(Number).sort((a, b) => a - b);
}

function sameNumbers(a, b) {
  const left = sortedNumbers(a);
  const right = sortedNumbers(b);
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

function collectQuestions(data, testId) {
  const questions = [];
  for (const page of data.pages || []) {
    for (const question of page.questions || []) {
      const number = Number(question.q);
      if (!Number.isInteger(number) || number < 1) {
        fail(testId, `invalid question number ${JSON.stringify(question.q)}`);
        continue;
      }
      questions.push(question);
    }
  }
  return questions;
}

function validateRuntimeChoiceOrder({ testId, indexHtml, sandbox, data, sourceOptions, key }) {
  let mixerName = null;
  let sourceCorrectIndex = null;
  let limit = 0;

  if (testId.startsWith("brighton-b1plus-units-") && indexHtml.includes("b1plus-cumulative-choice-order.js")) {
    mixerName = "b1plus-cumulative-choice-order.js";
    sourceCorrectIndex = (questionNumber) => (questionNumber - 1) % 3;
    limit = 70;
  } else if (testId.startsWith("brighton-b2-units-") && indexHtml.includes("b2-cumulative-choice-order.js")) {
    mixerName = "b2-cumulative-choice-order.js";
    sourceCorrectIndex = () => 0;
    limit = 60;
  }

  const isCumulativeB1Plus = testId.startsWith("brighton-b1plus-units-") && Number(data.totalQuestions) > 40;
  const isCumulativeB2 = testId.startsWith("brighton-b2-units-") && Number(data.totalQuestions) > 40;
  if ((isCumulativeB1Plus || isCumulativeB2) && !mixerName) {
    fail(testId, "cumulative test is missing its audited runtime choice-order mixer");
    return;
  }

  if (!mixerName) return;

  const mixerPath = path.join(TESTS_DIR, mixerName);
  if (!fs.existsSync(mixerPath)) {
    fail(testId, `missing runtime mixer ${mixerName}`);
    return;
  }

  vm.runInContext(readText(mixerPath), sandbox, { filename: mixerPath });

  const renderedByQuestion = new Map();
  for (const page of data.pages || []) {
    for (const question of page.questions || []) {
      renderedByQuestion.set(Number(question.q), question.options || []);
    }
  }

  for (let q = 1; q <= limit; q += 1) {
    const before = sourceOptions.get(q);
    const after = renderedByQuestion.get(q);
    if (!before || !after) {
      fail(testId, `runtime-order audit cannot find question ${q}`);
      continue;
    }

    const correctText = before[sourceCorrectIndex(q)];
    const renderedIndex = after.indexOf(correctText);
    if (renderedIndex < 0) {
      fail(testId, `runtime mixer lost the source-correct option for question ${q}`);
      continue;
    }

    const expected = LETTERS[renderedIndex];
    const actual = String(key.answers?.[q]?.answers?.[0] ?? "").toUpperCase();
    if (actual !== expected) {
      fail(testId, `question ${q} renders correct answer as ${expected}, but JSON key says ${actual || "(blank)"}`);
    }
  }
}

const testDirectories = fs.readdirSync(TESTS_DIR, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();

for (const directory of testDirectories) {
  const testDir = path.join(TESTS_DIR, directory);
  const dataPath = path.join(testDir, "test-data.js");
  if (!fs.existsSync(dataPath)) continue;

  let sandbox;
  let data;
  try {
    ({ sandbox, data } = loadTestData(dataPath));
  } catch (error) {
    fail(directory, `could not execute test-data.js: ${error.message}`);
    continue;
  }

  const testId = String(data?.testId || directory).trim();
  if (!data || !testId) {
    fail(directory, "test-data.js did not define window.BRIGHTON_TEST_DATA with a testId");
    continue;
  }

  const keyPath = path.join(KEYS_DIR, `${testId}.json`);
  if (!fs.existsSync(keyPath)) {
    fail(testId, `missing answer key answer-keys/${testId}.json`);
    continue;
  }

  let key;
  try {
    key = JSON.parse(readText(keyPath));
  } catch (error) {
    fail(testId, `invalid answer-key JSON: ${error.message}`);
    continue;
  }

  const questions = collectQuestions(data, testId);
  const questionNumbers = questions.map((question) => Number(question.q));
  const uniqueQuestionNumbers = new Set(questionNumbers);
  const expectedNumbers = Array.from({ length: Number(data.totalQuestions || questions.length) }, (_, index) => index + 1);
  const keyNumbers = Object.keys(key.answers || {}).map(Number);

  if (uniqueQuestionNumbers.size !== questionNumbers.length) fail(testId, "test-data.js contains duplicate question numbers");
  if (!sameNumbers(questionNumbers, expectedNumbers)) fail(testId, "test-data.js question numbers are not a complete 1..totalQuestions sequence");
  if (!sameNumbers(keyNumbers, questionNumbers)) fail(testId, "answer key question numbers do not exactly match test-data.js");

  if (String(key.examId || "") !== testId) fail(testId, `answer-key examId is ${JSON.stringify(key.examId)}, expected ${JSON.stringify(testId)}`);
  if (Number(key.totalQuestions) !== Number(data.totalQuestions)) fail(testId, `answer-key totalQuestions ${key.totalQuestions} != test-data ${data.totalQuestions}`);
  if (Number(key.maxScore) !== Number(data.maxScore)) fail(testId, `answer-key maxScore ${key.maxScore} != test-data ${data.maxScore}`);

  for (const question of questions) {
    if (!Array.isArray(question.options) || question.options.length !== 3) {
      fail(testId, `question ${question.q} must expose exactly three A/B/C options`);
    }
  }

  let keyedPoints = 0;
  for (const q of keyNumbers) {
    const rule = key.answers[String(q)] ?? key.answers[q];
    if (!rule || !Array.isArray(rule.answers) || rule.answers.length === 0) {
      fail(testId, `question ${q} has no accepted answer`);
      continue;
    }
    for (const answer of rule.answers) {
      if (!LETTERS.includes(String(answer).toUpperCase())) {
        fail(testId, `question ${q} has non-A/B/C key value ${JSON.stringify(answer)}`);
      }
    }
    keyedPoints += Number(rule.points || 1);
  }
  if (keyedPoints !== Number(key.maxScore)) fail(testId, `answer-rule points sum to ${keyedPoints}, expected maxScore ${key.maxScore}`);

  const partQuestionNumbers = [];
  let partMaxScore = 0;
  for (const [partNo, part] of Object.entries(key.parts || {})) {
    const numbers = (part.questions || []).map(Number);
    partQuestionNumbers.push(...numbers);
    partMaxScore += Number(part.maxScore || 0);
    for (const q of numbers) {
      const rule = key.answers?.[q];
      if (!rule) fail(testId, `part ${partNo} contains question ${q}, but the answer rule is missing`);
      else if (String(rule.part) !== String(partNo)) fail(testId, `question ${q} says part ${rule.part}, but is listed under part ${partNo}`);
    }
  }
  if (!sameNumbers(partQuestionNumbers, questionNumbers)) fail(testId, "parts do not cover each test question exactly once");
  if (new Set(partQuestionNumbers).size !== partQuestionNumbers.length) fail(testId, "parts contain duplicate question numbers");
  if (partMaxScore !== Number(key.maxScore)) fail(testId, `part maxScore values sum to ${partMaxScore}, expected ${key.maxScore}`);

  const sourceOptions = new Map(questions.map((question) => [Number(question.q), [...(question.options || [])]]));
  const indexPath = path.join(testDir, "index.html");
  const indexHtml = fs.existsSync(indexPath) ? readText(indexPath) : "";
  validateRuntimeChoiceOrder({ testId, indexHtml, sandbox, data, sourceOptions, key });

  validatedTests += 1;
  validatedQuestions += questionNumbers.length;
}

const keyFiles = fs.readdirSync(KEYS_DIR).filter((name) => name.endsWith(".json"));
const testIds = new Set(testDirectories.map((directory) => {
  const dataPath = path.join(TESTS_DIR, directory, "test-data.js");
  if (!fs.existsSync(dataPath)) return null;
  try {
    return loadTestData(dataPath).data?.testId || null;
  } catch {
    return null;
  }
}).filter(Boolean));

for (const keyFile of keyFiles) {
  const id = keyFile.replace(/\.json$/, "");
  if (id.includes("-units-") && !testIds.has(id)) warn(id, "unit-test answer key has no matching tests/*/test-data.js directory");
}

if (warnings.length) {
  console.warn("\nWarnings:");
  for (const message of warnings) console.warn(`  - ${message}`);
}

if (errors.length) {
  console.error(`\nAnswer-key validation failed with ${errors.length} error(s):`);
  for (const message of errors) console.error(`  - ${message}`);
  process.exitCode = 1;
} else {
  console.log(`Brighton answer-key audit passed: ${validatedTests} tests / ${validatedQuestions} keyed questions validated.`);
  console.log("Structural coverage, score totals, IDs, A/B/C rules and cumulative runtime option-order mappings are consistent.");
}
