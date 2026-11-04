import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

// Records a completed visual review; it does not create or approve new frames.
const app = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const hash = p => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const reportPath = path.join(app, 'reports/friendly-avatar-pico-independent.json');
const capturePath = path.join(app, 'reports/friendly-named-capture.json');
const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
const capture = JSON.parse(fs.readFileSync(capturePath, 'utf8'));
const sheets = capture.contactSheets.filter(s => s.id.startsWith('pico:'));
const frames = capture.motionCases.filter(s => s.id.startsWith('pico:'));
const sources = Object.fromEntries(Object.keys(report.sources).map(p => [p, hash(path.join(app, p))]));
const sourceHashesMatch = Object.keys(sources).every(p => sources[p] === report.sources[p] && sources[p] === capture.runtimeSources[p]);
const sheetHashesMatch = sheets.every(s => hash(s.file) === s.sha256);
const pass = sourceHashesMatch && sheetHashesMatch && frames.length === 180 && sheets.length === 15;
report.freshNamedPicoIndependent = {
  date: new Date().toISOString(),
  reviewer: 'graphic_cast agent, independent of root Pico authorship',
  captureReport: path.relative(app, capturePath).replaceAll('\\', '/'),
  captureSources: sources,
  sourceHashesMatch,
  sheets: sheets.map(s => ({ path: s.file, sha256: hash(s.file), frames: s.frameIds.length })),
  sheetHashesMatch,
  frames: frames.length,
  contexts: [...new Set(frames.map(f => f.id.replace(/:frame-\d+$/, '')))],
  visualVerdict: 'PASS: Directly inspected all 180 fresh friendly named Pico frames in all 15 sheets. The relaxed brow, open eyes and smile remain approachable. Ears meet the head, the neck meets the vest, and hips, knees and ankles remain connected. Reading and exploring retain visible hand support for the book and map. Celebration and jump extrema retain attached hands, feet and satchel; no detached source-cell fragments, cast shadows or directional highlight bands were seen.',
  defects: [],
  limits: 'Finite saved phases, supplemented by the independent actual gesture-entry, interruption and timed-return trace already in this report. This is independent Pico approval only; human cast approval belongs to the avatar reviewer.',
  pass
};
report.reviewer = 'graphic_cast agent, independent of root Pico/profile/icon and graphic_avatar avatar authorship';
report.updated = new Date().toISOString();
report.pass = report.pass && pass;
fs.writeFileSync(reportPath, JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ pass, sourceHashesMatch, sheetHashesMatch, frames: frames.length, sheets: sheets.length, report: reportPath }));
if (!pass) process.exitCode = 1;
