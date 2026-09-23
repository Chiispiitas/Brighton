import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const EXAMS_DIR = path.dirname(fileURLToPath(import.meta.url));
const EXAM_DIR = path.join(EXAMS_DIR, "exams", "a1-listening");
const DATA_PATH = path.join(EXAM_DIR, "listening-data.js");
const MAIN_PATH = path.join(EXAM_DIR, "main.js");
const LAYOUT_PATH = path.join(EXAM_DIR, "visual-layouts.js");
const KEY_PATH = path.join(EXAMS_DIR, "answer-keys", "brighton-a1-listening-final.json");
const CONFIG_PATH = path.join(EXAMS_DIR, "config.js");
const errors = [];

function fail(message) { errors.push(message); }
function read(filePath) { return fs.readFileSync(filePath, "utf8"); }
function sameNumbers(a, b) {
  const left = [...a].map(Number).sort((x, y) => x - y);
  const right = [...b].map(Number).sort((x, y) => x - y);
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

const sandbox = { window: {}, console };
vm.createContext(sandbox);
vm.runInContext(read(DATA_PATH), sandbox, { filename: DATA_PATH });
vm.runInContext(read(LAYOUT_PATH), sandbox, { filename: LAYOUT_PATH });
const exam = sandbox.window.listeningExam;
const layouts = sandbox.window.A1ListeningVisualLayouts;
const key = JSON.parse(read(KEY_PATH));

if (!exam) fail("listening-data.js did not define window.listeningExam.");
if (exam?.examId !== "brighton-a1-listening-final") fail("Unexpected examId.");
if (exam?.title !== "Brighton A1 Listening Final Exam") fail("Unexpected title.");
if (exam?.level !== "A1" || exam?.skill !== "Listening") fail("Unexpected level or skill.");
if (Number(exam?.maxScore) !== 25) fail("Exam maxScore must be 25.");

const parts = exam?.parts || [];
if (parts.length !== 5) fail(`Expected 5 parts, found ${parts.length}.`);

const requiredTypes = ["matching", "gap", "matching", "visualMultiple", "pictureAction"];
parts.forEach((part, index) => {
  if (part.type !== requiredTypes[index]) fail(`Part ${index + 1} type is ${part.type}; expected ${requiredTypes[index]}.`);
  if ((part.items || []).length !== 5) fail(`Part ${index + 1} must contain exactly 5 scored questions.`);
});

const questions = parts.flatMap((part, index) => (part.items || []).map(item => ({ ...item, part: index + 1 })));
const numbers = questions.map(item => Number(item.q));
const expected = Array.from({ length: 25 }, (_, index) => index + 1);
if (!sameNumbers(numbers, expected)) fail("Questions must be a complete 1-25 sequence.");
if (new Set(numbers).size !== numbers.length) fail("Duplicate question numbers found.");

const keyNumbers = Object.keys(key.answers || {}).map(Number);
if (!sameNumbers(keyNumbers, expected)) fail("Answer key must cover Questions 1-25 exactly.");
if (Number(key.totalQuestions) !== 25 || Number(key.maxScore) !== 25) fail("Answer-key totals must both be 25.");

let points = 0;
for (const question of questions) {
  const rule = key.answers?.[String(question.q)];
  if (!rule) {
    fail(`Missing answer rule for Question ${question.q}.`);
    continue;
  }
  if (Number(rule.part) !== question.part) fail(`Question ${question.q} has inconsistent part mapping.`);
  if (!Array.isArray(rule.answers) || !rule.answers.length) fail(`Question ${question.q} has no accepted answer.`);
  points += Number(rule.points || 0);
}
if (points !== 25) fail(`Answer-key points total ${points}; expected 25.`);

const part1 = parts[0];
const part3 = parts[2];
const part4 = parts[3];
const part5 = parts[4];

function assertImage(relativePath, label) {
  if (!relativePath) {
    fail(`${label} is missing an image path.`);
    return;
  }
  const fullPath = path.join(EXAM_DIR, relativePath);
  if (!fs.existsSync(fullPath)) fail(`${label} references missing image: ${relativePath}`);
}

assertImage(part1?.image, "Part 1 scene");
assertImage(part5?.image, "Part 5 worksheet");

for (const [letter, text] of Object.entries(part3?.options || {})) {
  assertImage(part3?.optionImages?.[letter], `Part 3 option ${letter} (${text})`);
}

for (const item of part4?.items || []) {
  for (const [letter, option] of Object.entries(item.options || {})) {
    assertImage(option?.image, `Question ${item.q} option ${letter}`);
    if (option?.placeholder) fail(`Question ${item.q} option ${letter} still uses placeholder artwork.`);
  }
}

if (part4?.items?.find(item => item.q === 16)?.options?.B?.label !== "Green sweater and jeans") {
  fail("Question 16 option B label must match the final artwork.");
}
if (part4?.items?.find(item => item.q === 18)?.options?.A?.label !== "Rainy" ||
    part4?.items?.find(item => item.q === 18)?.options?.C?.label !== "Sunny") {
  fail("Question 18 weather labels must match the final A/B/C artwork.");
}
if (part4?.items?.find(item => item.q === 20)?.options?.C?.label !== "Go to a concert") {
  fail("Question 20 option C label must match the final concert artwork.");
}

if (!layouts) {
  fail("visual-layouts.js did not define window.A1ListeningVisualLayouts.");
} else {
  if (layouts.part1?.mode !== "part1-cutouts") fail("Part 1 visual layout must use part1-cutouts mode.");
  const part1Cutouts = (layouts.part1?.elements || []).filter(item => item.kind === "person-cutout");
  if (part1Cutouts.length !== 5) fail(`Part 1 visual layout must contain exactly 5 person cutouts; found ${part1Cutouts.length}.`);

  const expectedPart1Answers = ["C", "D", "E", "F", "G"];
  const actualPart1Answers = part1Cutouts.map(item => String(item.answer || "")).sort();
  if (JSON.stringify(actualPart1Answers) !== JSON.stringify(expectedPart1Answers)) {
    fail(`Part 1 cutout answers must be C,D,E,F,G; found ${actualPart1Answers.join(",")}.`);
  }
  for (const item of part1Cutouts) {
    assertImage(`assets/${item.asset}`, `Part 1 cutout ${item.label || item.answer}`);
  }

  if (layouts.part5?.mode !== "part5-color") fail("Part 5 visual layout must use part5-color mode.");
  const part5Elements = layouts.part5?.elements || [];
  const colorNames = ["red", "blue", "green", "brown", "purple", "yellow", "orange", "pink"];
  for (const q of [21, 22, 23, 25]) {
    const item = part5Elements.find(entry => entry.kind === "cutout" && Number(entry.q) === q);
    if (!item) {
      fail(`Part 5 visual layout is missing cutout Q${q}.`);
      continue;
    }
    for (const color of colorNames) {
      const asset = item.variants?.[color];
      if (!asset) fail(`Part 5 Q${q} is missing ${color} variant.`);
      else assertImage(`assets/${asset}`, `Part 5 Q${q} ${color} variant`);
    }
    const correctColor = String(key.answers?.[String(q)]?.answers?.[0] || "").toLowerCase();
    if (correctColor && !item.variants?.[correctColor]) {
      fail(`Part 5 Q${q} has no image variant for keyed answer ${correctColor}.`);
    }
  }

  const q24 = part5Elements.find(entry => entry.kind === "text" && Number(entry.q) === 24);
  if (!q24) fail("Part 5 visual layout is missing the Q24 text field.");

  const part1Background = layouts.part1?.canvas?.background;
  const part5Background = layouts.part5?.canvas?.background;
  if (part1Background) assertImage(part1Background, "Part 1 layout background");
  if (part5Background) assertImage(part5Background, "Part 5 layout background");
}

for (const fileName of [
  "README_A1_Listening_Scripts.txt",
  "A1_Listening_Part_1_Scene_Matching.txt",
  "A1_Listening_Part_2_Note_Completion.txt",
  "A1_Listening_Part_3_Activity_Matching.txt",
  "A1_Listening_Part_4_Picture_Multiple_Choice.txt",
  "A1_Listening_Part_5_Colour_and_Write.txt",
  "A1_Listening_FINAL_Master_ElevenLabs_V3.txt"
]) {
  if (!fs.existsSync(path.join(EXAM_DIR, "audio-scripts", fileName))) fail(`Missing audio script: ${fileName}`);
}

const main = read(MAIN_PATH);
for (const token of [
  "brighton-a1-listening-exam-state-v1",
  "BRIGHTON_A1_LISTENING_SUBMIT",
  "pictureAction",
  "renderPictureActionPart"
]) {
  if (!main.includes(token)) fail(`main.js is missing ${token}`);
}

const config = read(CONFIG_PATH);
if (!config.includes('examId: "brighton-a1-listening-final"')) fail("A1 Listening is missing from FALLBACK_EXAMS.");

if (errors.length) {
  console.error(`A1 Listening consistency audit failed with ${errors.length} error(s):\n`);
  errors.forEach(error => console.error(`- ${error}`));
  process.exit(1);
}
console.log("A1 Listening consistency audit passed: 5 parts / 25 questions / 25 marks.");
