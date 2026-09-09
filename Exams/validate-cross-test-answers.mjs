import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const EXAMS_DIR = path.dirname(fileURLToPath(import.meta.url));
const TESTS_DIR = path.join(EXAMS_DIR, "tests");
const KEYS_DIR = path.join(EXAMS_DIR, "answer-keys");
const LETTERS = "ABC";
const groups = new Map();
const errors = [];
let loadedTests = 0;
let keyedItems = 0;

function text(value) {
  return String(value ?? "")
    .normalize("NFKC")
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function makeStorage() {
  const values = new Map();
  return {
    getItem(key) { return values.has(key) ? values.get(key) : null; },
    setItem(key, value) { values.set(key, String(value)); },
    removeItem(key) { values.delete(key); }
  };
}

function loadRenderedTest(testDir) {
  const dataPath = path.join(testDir, "test-data.js");
  const indexPath = path.join(testDir, "index.html");
  if (!fs.existsSync(dataPath)) return null;

  const sandbox = {
    window: {},
    localStorage: makeStorage(),
    console: { log() {}, info() {}, warn() {}, error() {} }
  };
  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(dataPath, "utf8"), sandbox, { filename: dataPath });

  const data = sandbox.window.BRIGHTON_TEST_DATA;
  if (!data?.testId) return null;

  const indexHtml = fs.existsSync(indexPath) ? fs.readFileSync(indexPath, "utf8") : "";
  for (const mixer of ["b1plus-cumulative-choice-order.js", "b2-cumulative-choice-order.js"]) {
    if (!indexHtml.includes(mixer)) continue;
    const mixerPath = path.join(TESTS_DIR, mixer);
    vm.runInContext(fs.readFileSync(mixerPath, "utf8"), sandbox, { filename: mixerPath });
  }

  return data;
}

function signature(question) {
  const prompt = text(question.text);
  const options = (question.options || []).map(text).sort().join(" || ");
  return `${prompt} ### ${options}`;
}

const directories = fs.readdirSync(TESTS_DIR, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();

for (const directory of directories) {
  const testDir = path.join(TESTS_DIR, directory);
  let data;
  try {
    data = loadRenderedTest(testDir);
  } catch (error) {
    errors.push(`${directory}: could not load rendered test (${error.message})`);
    continue;
  }
  if (!data) continue;

  const testId = data.testId;
  const keyPath = path.join(KEYS_DIR, `${testId}.json`);
  if (!fs.existsSync(keyPath)) continue;

  let key;
  try {
    key = JSON.parse(fs.readFileSync(keyPath, "utf8"));
  } catch (error) {
    errors.push(`${testId}: invalid JSON key (${error.message})`);
    continue;
  }

  for (const page of data.pages || []) {
    for (const question of page.questions || []) {
      const q = Number(question.q);
      const letter = String(key.answers?.[q]?.answers?.[0] ?? "").toUpperCase();
      const index = LETTERS.indexOf(letter);
      if (index < 0 || !Array.isArray(question.options) || !question.options[index]) continue;

      const correctText = question.options[index];
      const keySignature = signature(question);
      if (!groups.has(keySignature)) groups.set(keySignature, []);
      groups.get(keySignature).push({ testId, q, letter, correctText });
      keyedItems += 1;
    }
  }
  loadedTests += 1;
}

let repeatedGroups = 0;
for (const [keySignature, occurrences] of groups.entries()) {
  if (occurrences.length < 2) continue;
  repeatedGroups += 1;

  const answers = new Map();
  for (const occurrence of occurrences) {
    const normalized = text(occurrence.correctText);
    if (!answers.has(normalized)) answers.set(normalized, []);
    answers.get(normalized).push(occurrence);
  }

  if (answers.size <= 1) continue;

  const prompt = keySignature.split(" ### ")[0];
  const details = occurrences
    .map((item) => `${item.testId} Q${item.q}=${item.letter} (${JSON.stringify(item.correctText)})`)
    .join("; ");
  errors.push(`conflicting keyed answer text for ${JSON.stringify(prompt)}: ${details}`);
}

if (errors.length) {
  console.error(`Cross-test answer audit failed with ${errors.length} conflict(s):`);
  for (const error of errors) console.error(`  - ${error}`);
  process.exitCode = 1;
} else {
  console.log(`Cross-test answer audit passed: ${loadedTests} tests / ${keyedItems} keyed items; ${repeatedGroups} repeated question signatures agree on the same correct answer text.`);
}
