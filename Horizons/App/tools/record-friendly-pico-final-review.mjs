import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

// Records the completed two-eyebrow visual review without replacing earlier evidence.
const app = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const hash = p => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const reportPath = path.join(app, 'reports/friendly-avatar-pico-independent.json');
const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
const capture = JSON.parse(fs.readFileSync(path.join(app, 'reports/friendly-pico-final-capture.json'), 'utf8'));
const sourcePaths = [
  'src/pico-articulated.js',
  'assets/art/pico-friendly-v1.frames.json',
  'assets/art/pico-graphic-v1.png',
  'assets/art/pico-friendly-head-v2.png',
  'assets/art/profile-friendly-v2.png',
  'assets/art/app-icon-friendly-v2.png'
];
const sources = Object.fromEntries(sourcePaths.map(p => [p, hash(path.join(app, p))]));
const sourceHashesMatch = sourcePaths.every(p => sources[p] === capture.runtimeSources[p]);
const sheets = capture.contactSheets.filter(s => s.id.startsWith('pico:'));
const frames = capture.motionCases.filter(s => s.id.startsWith('pico:'));
const sheetHashesMatch = sheets.every(s => hash(s.file) === s.sha256);
const avatarSourcesUnchanged = Object.entries(report.avatarIndependent.sources).every(([p, h]) => hash(path.join(app, p)) === h);
const runtimeUnchangedSinceActualCallbackTrace = ['src/pico-articulated.js', 'assets/art/pico-graphic-v1.png'].every(p => sources[p] === report.sources[p]);
const meta = JSON.parse(fs.readFileSync(path.join(app, 'assets/art/pico-friendly-v1.frames.json'), 'utf8'));
const nativeFrameUnchanged = meta.parts.head.atlas.width === 1312 && meta.parts.head.atlas.height === 1199
  && JSON.stringify(meta.parts.head.frame) === JSON.stringify({ x: 190, y: 163, w: 922, h: 861 })
  && JSON.stringify(meta.parts.head.pivot) === JSON.stringify([620, 982]) && meta.parts.head.scale === 0.165;
const pass = sourceHashesMatch && sheetHashesMatch && avatarSourcesUnchanged && runtimeUnchangedSinceActualCallbackTrace
  && nativeFrameUnchanged && frames.length === 180 && sheets.length === 15;
report.historicalEvidenceNotice = 'The original sources, captureReviewed, trace and freshNamedPicoIndependent sections preserve the pre-correction one-eyebrow evidence. Final-current Pico and icon approval is bound exclusively by finalCurrentPicoIndependent. Avatar evidence remains current because every avatar source hash is unchanged.';
report.finalCurrentPicoIndependent = {
  date: new Date().toISOString(),
  reviewer: 'graphic_cast agent, independent of root Pico/profile/icon authorship',
  correction: 'Native second matching gentle eyebrow added to Pico head and app icon.',
  sources,
  sourceHashesMatch,
  captureReport: 'reports/friendly-pico-final-capture.json',
  sheets: sheets.map(s => ({ path: s.file, sha256: hash(s.file), frames: s.frameIds.length })),
  sheetHashesMatch,
  frames: frames.length,
  contexts: [...new Set(frames.map(f => f.id.replace(/:frame-\d+$/, '')))],
  nativeFrameUnchanged,
  runtimeUnchangedSinceActualCallbackTrace,
  avatarSourcesUnchanged,
  visualVerdict: 'PASS: Independently inspected the native v2 head and v2 icon and every frame in all 15 fresh affected Pico sheets. Both assets have TWO clearly separate gentle eyebrows, open approachable eyes and a warm smile. The unchanged head registration retains connected ears, neck and vest in standing, wave, celebration, reading, exploring and jumping phases. Hands, knees, ankles and satchel remain attached; book and map remain hand-supported. No visible stray cell fragments, cast shadows or directional lighting bands were seen in the composed character frames.',
  defects: [],
  limits: 'This final review covers all 180 saved affected Pico phases plus direct native head/icon inspection. Runtime, native frame geometry and non-head parts are unchanged from the previously inspected actual entry/interruption/timed-return trace; that trace was not repeated. Avatar and human source checks were not repeated beyond checking existing avatar source hashes.',
  pass
};
report.updated = new Date().toISOString();
report.status = pass ? 'FINAL_CURRENT_TWO_BROW_PICO_AVATAR_PROFILE_ICON_PASS' : 'FINAL_CURRENT_REVIEW_FAILED';
report.pass = report.avatarIndependent.pass && pass;
fs.writeFileSync(reportPath, JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ pass, sourceHashesMatch, sheetHashesMatch, frames: frames.length, sheets: sheets.length, avatarSourcesUnchanged, nativeFrameUnchanged, runtimeUnchangedSinceActualCallbackTrace, sources }));
if (!pass) process.exitCode = 1;
