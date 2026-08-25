#!/usr/bin/env node
/* Horizons A1 — dependency-free content validator.
   Usage: node qa/validate-content.mjs content/example-lesson.json */

import fs from 'node:fs';
import path from 'node:path';

const files = process.argv.slice(2);
if (!files.length) {
  console.error('Usage: node qa/validate-content.mjs <lesson.json> [more files...]');
  process.exit(2);
}

let failed = false;

for (const file of files) {
  const absolute = path.resolve(process.cwd(), file);
  const errors = [];
  const warnings = [];
  let data;

  try {
    data = JSON.parse(fs.readFileSync(absolute, 'utf8'));
  } catch (err) {
    console.error(`✗ ${file}: cannot parse JSON — ${err.message}`);
    failed = true;
    continue;
  }

  if (data.course !== 'Horizons') errors.push('course must be "Horizons"');
  if (data.level !== 'A1') errors.push('level must be "A1"');
  if (!Number.isInteger(data.unit) || data.unit < 1 || data.unit > 8) errors.push('unit must be an integer from 1 to 8');
  if (!/^[ABCD]$/.test(data.lesson || '')) errors.push('lesson must be A, B, C or D');
  if (!data.title) errors.push('title is required');
  if (!Array.isArray(data.objectives) || !data.objectives.length) errors.push('at least one objective is required');
  if (!Array.isArray(data.pages) || data.pages.length !== 2) errors.push('a normal lesson must contain exactly two pages');

  const exerciseIds = new Set();
  const audioIds = new Set((data.audio || []).map((a) => a.id));
  const assetIds = new Set((data.assets || []).map((a) => a.id));
  let previousNumber = 0;

  for (const [pageIndex, page] of (data.pages || []).entries()) {
    if (!Array.isArray(page.exercises)) {
      errors.push(`page ${pageIndex + 1}: exercises must be an array`);
      continue;
    }

    for (const exercise of page.exercises) {
      if (!/^HZN-A1-U\d{2}-L[A-D]-E\d{2}$/.test(exercise.id || '')) {
        errors.push(`invalid exercise id: ${exercise.id || '(missing)'}`);
      }
      if (exerciseIds.has(exercise.id)) errors.push(`duplicate exercise id: ${exercise.id}`);
      exerciseIds.add(exercise.id);

      if (!Number.isInteger(exercise.number)) errors.push(`${exercise.id}: number must be an integer`);
      if (Number.isInteger(exercise.number) && exercise.number <= previousNumber) {
        errors.push(`${exercise.id}: exercise number ${exercise.number} does not continue the increasing lesson sequence`);
      }
      if (Number.isInteger(exercise.number)) previousNumber = exercise.number;

      if (!exercise.instruction) errors.push(`${exercise.id}: instruction is required`);

      if (exercise.audio_id && !audioIds.has(exercise.audio_id)) {
        errors.push(`${exercise.id}: audio_id ${exercise.audio_id} is not declared in lesson audio[]`);
      }

      for (const assetId of exercise.asset_ids || []) {
        if (!assetIds.has(assetId)) errors.push(`${exercise.id}: asset ${assetId} is not declared in lesson assets[]`);
      }
    }
  }

  for (const asset of data.assets || []) {
    if (!asset.crop_intent) warnings.push(`${asset.id}: crop_intent is empty`);
    if (asset.status !== 'placeholder' && !asset.alt) warnings.push(`${asset.id}: final/sourced asset should have alt text`);
  }

  for (const audio of data.audio || []) {
    if (!audio.printed_track) errors.push(`${audio.id}: printed_track is required`);
    if (!audio.script) errors.push(`${audio.id}: script is required`);
  }

  if (errors.length) {
    failed = true;
    console.error(`✗ ${file}`);
    errors.forEach((msg) => console.error(`  ERROR: ${msg}`));
  } else {
    console.log(`✓ ${file}`);
  }
  warnings.forEach((msg) => console.warn(`  WARN: ${msg}`));
}

process.exit(failed ? 1 : 0);
