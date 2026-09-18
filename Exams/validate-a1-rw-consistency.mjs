import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const EXAMS_DIR = path.dirname(fileURLToPath(import.meta.url));
const EXAM_DIR = path.join(EXAMS_DIR, "exams", "a1-rw");
const DATA_PATH = path.join(EXAM_DIR, "exam-data.js");
const MAIN_PATH = path.join(EXAM_DIR, "main.js");
const INDEX_PATH = path.join(EXAM_DIR, "index.html");
const KEY_PATH = path.join(EXAMS_DIR, "answer-keys", "brighton-a1-rw-final.json");
const CONFIG_PATH = path.join(EXAMS_DIR, "config.js");
const RESULTS_PATH = path.join(EXAMS_DIR, "results.js");

const EXPECTED_EXAM_ID = "brighton-a1-rw-final";
const EXPECTED_TITLE = "Brighton A1 Reading and Writing Final Exam";
const EXPECTED_PARTS = 6;
const EXPECTED_QUESTIONS = 35;
const EXPECTED_MAX_SCORE = 39;

const errors = [];

function fail(message) {
  errors.push(message);
}

function read(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

function loadExamParts() {
  const sandbox = { window: {}, console };
  vm.createContext(sandbox);
  vm.runInContext(read(DATA_PATH), sandbox, { filename: DATA_PATH });
  return sandbox.window.examParts;
}

function loadFallbackExam() {
  const source = read(CONFIG_PATH);
  const marker = "/* ----------------------------------------------\n   Student test safety";
  const prefix = source.includes(marker) ? source.slice(0, source.indexOf(marker)) : source;
  const sandbox = { window: {}, console };
  vm.createContext(sandbox);
  vm.runInContext(prefix, sandbox, { filename: CONFIG_PATH });
  return (sandbox.window.BRIGHTON_SITE_CONFIG?.FALLBACK_EXAMS || []).find(
    (exam) => exam?.examId === EXPECTED_EXAM_ID
  );
}

function extractConst(source, name) {
  const match = source.match(new RegExp(`const\\s+${name}\\s*=\\s*["']([^"']+)["']`));
  return match?.[1] || "";
}

function sorted(values) {
  return [...values].map(Number).sort((a, b) => a - b);
}

function sameNumbers(a, b) {
  const left = sorted(a);
  const right = sorted(b);
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

function normalize(value) {
  return String(value ?? "").trim().toLowerCase().replace(/\s+/g, " ");
}

const parts = loadExamParts();
const key = JSON.parse(read(KEY_PATH));
const fallback = loadFallbackExam();
const mainSource = read(MAIN_PATH);
const indexSource = read(INDEX_PATH);
const resultsSource = read(RESULTS_PATH);

if (!Array.isArray(parts)) fail("exam-data.js did not define window.examParts.");
else {
  if (parts.length !== EXPECTED_PARTS) fail(`Expected ${EXPECTED_PARTS} parts, found ${parts.length}.`);

  const expectedPartIds = Array.from({ length: EXPECTED_PARTS }, (_, i) => `part${i + 1}`);
  const actualPartIds = parts.map((part) => part.id);
  if (actualPartIds.join("|") !== expectedPartIds.join("|")) {
    fail(`Part IDs/order are ${actualPartIds.join(", ")}, expected ${expectedPartIds.join(", ")}.`);
  }

  const questions = parts.flatMap((part) => (part.items || []).map((item) => ({
    ...item,
    partId: part.id,
    partNumber: Number(String(part.id).replace(/\D+/g, ""))
  })));

  const questionNumbers = questions.map((item) => Number(item.q));
  const expectedNumbers = Array.from({ length: EXPECTED_QUESTIONS }, (_, i) => i + 1);

  if (new Set(questionNumbers).size !== questionNumbers.length) fail("Duplicate question numbers found in exam-data.js.");
  if (!sameNumbers(questionNumbers, expectedNumbers)) fail("Question numbers must be a complete 1–35 sequence.");

  for (const part of parts) {
    const numbers = (part.items || []).map((item) => Number(item.q));
    const rangeMatch = String(part.range || "").match(/Questions\s+(\d+)\s*[–-]\s*(\d+)/i);
    if (!rangeMatch) {
      fail(`${part.id} has an invalid range label: ${JSON.stringify(part.range)}.`);
      continue;
    }
    const [, startRaw, endRaw] = rangeMatch;
    const expectedRange = Array.from(
      { length: Number(endRaw) - Number(startRaw) + 1 },
      (_, i) => Number(startRaw) + i
    );
    if (!sameNumbers(numbers, expectedRange)) {
      fail(`${part.id} range label ${part.range} does not match its question numbers.`);
    }
  }

  const keyNumbers = Object.keys(key.answers || {}).map(Number);
  if (!sameNumbers(keyNumbers, questionNumbers)) fail("Answer-key question numbers do not exactly match exam-data.js.");

  let keyedPoints = 0;
  for (const question of questions) {
    const rule = key.answers?.[String(question.q)];
    if (!rule) {
      fail(`Question ${question.q} is missing from the answer key.`);
      continue;
    }
    if (Number(rule.part) !== question.partNumber) {
      fail(`Question ${question.q} is in ${question.partId}, but answer key says Part ${rule.part}.`);
    }
    keyedPoints += Number(rule.points || 0);

    const optionEntries = Object.entries(question.options || {});
    if (optionEntries.length) {
      const accepted = new Set((rule.answers || []).map(normalize));
      const correctCurrentOptions = optionEntries.filter(([storedValue]) => accepted.has(normalize(storedValue)));
      if (correctCurrentOptions.length !== 1) {
        fail(
          `Question ${question.q} must have exactly one currently selectable option accepted by the answer key; found ${correctCurrentOptions.length}.`
        );
      }
    } else if (question.type === "sentence") {
      if (rule.mode !== "components" || !Array.isArray(rule.components) || !rule.components.length) {
        fail(`Writing Question ${question.q} must use a components grading rule.`);
      }
    } else if (!Array.isArray(rule.answers) || !rule.answers.length) {
      fail(`Question ${question.q} has no accepted answer in the key.`);
    }
  }

  if (keyedPoints !== EXPECTED_MAX_SCORE) {
    fail(`Answer-rule points total ${keyedPoints}; expected ${EXPECTED_MAX_SCORE}.`);
  }

  const imageRefs = [];
  for (const part of parts) {
    if (part.image) imageRefs.push({ label: part.id, image: part.image, description: part.imageDescription });
    for (const option of part.visualOptions || []) {
      if (option.image) imageRefs.push({ label: `${part.id} visual option ${option.label}`, image: option.image, description: option.imageDescription });
    }
    for (const panel of part.picturePanels || []) {
      if (panel.image) imageRefs.push({ label: `${part.id} ${panel.title}`, image: panel.image, description: panel.text });
    }
  }

  for (const ref of imageRefs) {
    const filePath = path.join(EXAM_DIR, ref.image);
    if (!fs.existsSync(filePath)) fail(`${ref.label} references missing image ${ref.image}.`);
    if (/placeholder/i.test(String(ref.description || ""))) {
      fail(`${ref.label} still calls a live image a placeholder.`);
    }
  }

  const q33 = questions.find((item) => item.q === 33);
  if (q33?.type !== "preposition-choice") fail("Question 33 must remain a preposition-choice item.");
  if (q33?.suffix !== "the tree.") fail('Question 33 must keep "the tree." as fixed text.');
  if (q33?.options?.["next to the tree"] !== "next to") {
    fail('Question 33 must store "next to the tree" while displaying only "next to".');
  }
}

if (String(key.examId || "") !== EXPECTED_EXAM_ID) fail(`Answer-key examId is ${JSON.stringify(key.examId)}.`);
if (String(key.examTitle || "") !== EXPECTED_TITLE) fail(`Answer-key title is ${JSON.stringify(key.examTitle)}.`);
if (Number(key.totalQuestions) !== EXPECTED_QUESTIONS) fail(`Answer-key totalQuestions is ${key.totalQuestions}.`);
if (Number(key.maxScore) !== EXPECTED_MAX_SCORE) fail(`Answer-key maxScore is ${key.maxScore}.`);

let partScoreTotal = 0;
let partQuestions = [];
for (const [partNo, part] of Object.entries(key.parts || {})) {
  partScoreTotal += Number(part.maxScore || 0);
  partQuestions.push(...(part.questions || []).map(Number));
  for (const q of part.questions || []) {
    if (Number(key.answers?.[String(q)]?.part) !== Number(partNo)) {
      fail(`Answer-key Part ${partNo} contains Question ${q}, but its rule points to another part.`);
    }
  }
}
if (partScoreTotal !== EXPECTED_MAX_SCORE) fail(`Part maxScore values total ${partScoreTotal}; expected ${EXPECTED_MAX_SCORE}.`);
if (!sameNumbers(partQuestions, Array.from({ length: EXPECTED_QUESTIONS }, (_, i) => i + 1))) {
  fail("Answer-key parts do not cover Questions 1–35 exactly once.");
}
if (new Set(partQuestions).size !== partQuestions.length) fail("Answer-key parts contain duplicate questions.");

if (!fallback) fail("A1 exam is missing from config.js FALLBACK_EXAMS.");
else {
  if (fallback.title !== EXPECTED_TITLE) fail(`Fallback title is ${JSON.stringify(fallback.title)}.`);
  if (fallback.level !== "A1") fail(`Fallback level is ${JSON.stringify(fallback.level)}.`);
  if (fallback.skill !== "Reading and Writing") fail(`Fallback skill is ${JSON.stringify(fallback.skill)}.`);
  if (Number(fallback.totalQuestions) !== EXPECTED_QUESTIONS) fail(`Fallback totalQuestions is ${fallback.totalQuestions}.`);
  if (Number(fallback.maxScore) !== EXPECTED_MAX_SCORE) fail(`Fallback maxScore is ${fallback.maxScore}.`);
  if (fallback.relativeUrl !== "exams/a1-rw/index.html") fail(`Fallback relativeUrl is ${JSON.stringify(fallback.relativeUrl)}.`);
}

const constants = {
  EXAM_ID: EXPECTED_EXAM_ID,
  EXAM_TITLE: EXPECTED_TITLE,
  SKILL: "Reading and Writing",
  LEVEL: "A1",
  EXAM_TYPE: "reading-writing",
  RUBRIC_PROFILE: "a1rw"
};
for (const [name, expected] of Object.entries(constants)) {
  const actual = extractConst(mainSource, name);
  if (actual !== expected) fail(`main.js ${name} is ${JSON.stringify(actual)}, expected ${JSON.stringify(expected)}.`);
}

for (const token of [
  "<h1>A1 Final Exam</h1>",
  "<h2>Reading and Writing</h2>",
  "<span>6 parts</span>",
  "<span>35 questions</span>",
  "<span>A1 Movers-style platform</span>"
]) {
  if (!indexSource.includes(token)) fail(`index.html is missing expected metadata: ${token}`);
}

for (const token of [
  'id: "a1rw"',
  "Objective answers · Questions 1–33",
  "Picture writing · Questions 34–35",
  "if (rubricProfile?.id === \"a1rw\") return question >= 34;"
]) {
  if (!resultsSource.includes(token)) fail(`results.js is missing A1 mixed-exam contract: ${token}`);
}

if (errors.length) {
  console.error(`A1 Reading & Writing consistency audit failed with ${errors.length} error(s):\n`);
  errors.forEach((message) => console.error(`- ${message}`));
  process.exit(1);
}

console.log("A1 Reading & Writing consistency audit passed.");
console.log("Checked 6 parts, 35 questions, 39 marks, all image assets, selectable answer mappings, fallback metadata, player constants, and results-dashboard boundaries.");
