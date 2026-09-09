import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const answerKeyDir = path.join(here, "answer-keys");
const manifestPath = path.join(answerKeyDir, "version.json");
const appCorePath = path.join(here, "app-core.js");
const errors = [];

function fail(message) {
  errors.push(message);
}

function readJson(filePath, label) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (error) {
    fail(`${label}: ${error.message}`);
    return null;
  }
}

const manifest = readJson(manifestPath, "Could not read answer-key release manifest");
const versionPattern = /^[A-Za-z0-9._-]{1,80}$/;
const currentVersion = String(manifest?.currentVersion || "").trim();
const availableVersions = Array.isArray(manifest?.availableVersions)
  ? manifest.availableVersions.map((value) => String(value || "").trim())
  : [];

if (!versionPattern.test(currentVersion)) fail(`Invalid currentVersion: ${currentVersion || "<empty>"}`);
if (!availableVersions.length) fail("availableVersions must contain at least one release.");
if (!availableVersions.includes(currentVersion)) fail(`availableVersions does not contain currentVersion ${currentVersion}.`);
if (new Set(availableVersions).size !== availableVersions.length) fail("availableVersions contains duplicates.");
for (const version of availableVersions) {
  if (!versionPattern.test(version)) fail(`Invalid available version: ${version || "<empty>"}`);
  const releaseDir = path.join(answerKeyDir, "versions", version);
  if (!fs.existsSync(releaseDir) || !fs.statSync(releaseDir).isDirectory()) fail(`Missing release directory: versions/${version}`);
}

const currentKeyFiles = fs.readdirSync(answerKeyDir, { withFileTypes: true })
  .filter((entry) => entry.isFile() && entry.name.endsWith(".json") && entry.name !== "version.json")
  .map((entry) => entry.name)
  .sort();

if (!currentKeyFiles.length) fail("No current answer-key JSON files were found.");

if (currentVersion && versionPattern.test(currentVersion)) {
  const currentReleaseDir = path.join(answerKeyDir, "versions", currentVersion);
  if (fs.existsSync(currentReleaseDir)) {
    const snapshotFiles = fs.readdirSync(currentReleaseDir, { withFileTypes: true })
      .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
      .map((entry) => entry.name)
      .sort();

    const currentSet = new Set(currentKeyFiles);
    const snapshotSet = new Set(snapshotFiles);

    for (const file of currentKeyFiles) {
      if (!snapshotSet.has(file)) {
        fail(`Current release ${currentVersion} is missing ${file}.`);
        continue;
      }
      const current = fs.readFileSync(path.join(answerKeyDir, file), "utf8");
      const snapshot = fs.readFileSync(path.join(currentReleaseDir, file), "utf8");
      if (current !== snapshot) fail(`Current key ${file} does not match immutable release ${currentVersion}.`);
    }

    for (const file of snapshotFiles) {
      if (!currentSet.has(file)) fail(`Release ${currentVersion} contains extra key ${file} that is not present in the current key set.`);
    }
  }
}

try {
  const appCore = fs.readFileSync(appCorePath, "utf8");
  const match = appCore.match(/const\s+ANSWER_KEY_VERSION\s*=\s*["']([^"']+)["']/);
  const clientVersion = String(match?.[1] || "").trim();
  if (!clientVersion) fail("Could not find ANSWER_KEY_VERSION in Exams/app-core.js.");
  else if (clientVersion !== currentVersion) fail(`Client release ${clientVersion} does not match manifest currentVersion ${currentVersion}.`);
} catch (error) {
  fail(`Could not validate Exams/app-core.js release constant: ${error.message}`);
}

if (errors.length) {
  console.error("Brighton answer-key release audit failed:\n");
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log(`Answer-key release audit passed: ${currentKeyFiles.length} current keys pinned to immutable release ${currentVersion}.`);
console.log(`Known releases: ${availableVersions.join(", ")}`);
