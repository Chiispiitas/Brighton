#!/usr/bin/env node
/* Create a structured lesson skeleton directly from the locked syllabus.
   Usage from Horizons/: node tools/new-lesson.mjs 2 B */

import fs from 'node:fs';
import path from 'node:path';

const [unitArg, lessonArg] = process.argv.slice(2);
const unitNumber = Number(unitArg);
const lesson = String(lessonArg || '').toUpperCase();

if (!Number.isInteger(unitNumber) || unitNumber < 1 || unitNumber > 8 || !/^[ABCD]$/.test(lesson)) {
  console.error('Usage: node tools/new-lesson.mjs <unit 1-8> <lesson A-D>');
  process.exit(2);
}

const lockPath = path.resolve(process.cwd(), 'content/syllabus-lock.json');
const lock = JSON.parse(fs.readFileSync(lockPath, 'utf8'));
const unit = lock.units.find((item) => item.unit === unitNumber);
const source = unit?.lessons?.[lesson];

if (!unit || !source) {
  console.error(`No locked syllabus entry for Unit ${unitNumber} Lesson ${lesson}`);
  process.exit(1);
}

const unitCode = String(unitNumber).padStart(2, '0');
const output = path.resolve(process.cwd(), `content/u${unitCode}-${lesson.toLowerCase()}.json`);

if (fs.existsSync(output)) {
  console.error(`Refusing to overwrite existing file: ${output}`);
  process.exit(1);
}

const lessonData = {
  course: 'Horizons',
  level: 'A1',
  unit: unitNumber,
  lesson,
  title: source.title,
  objectives: source.focus,
  real_world_context: source.real_world_context,
  archetype: 'standard',
  spread_density: ['medium', 'medium'],
  pages: [
    { role: 'opener', exercises: [] },
    { role: 'continuation', exercises: [] }
  ],
  assets: [],
  audio: []
};

fs.writeFileSync(output, `${JSON.stringify(lessonData, null, 2)}\n`, 'utf8');
console.log(`Created ${path.relative(process.cwd(), output)}`);
console.log(`Unit ${unitNumber}: ${unit.title}`);
console.log(`${lesson}: ${source.title}`);
