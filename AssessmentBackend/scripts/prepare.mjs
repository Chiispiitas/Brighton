import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const output = resolve(root, 'src/generated');
mkdirSync(output, { recursive: true });
const files = new Map();
for (const folder of ['Placement/wix-backend', 'Placement/YoungLearners/wix-backend']) {
  let sourceFolder = resolve(root, '..', folder);
  try { readdirSync(sourceFolder); } catch { sourceFolder = resolve(root, 'canonical', folder); }
  for (const name of readdirSync(sourceFolder)) {
    if (!name.endsWith('.js') || name === 'http-routes.js') continue;
    if (files.has(name)) throw new Error(`Duplicate backend module: ${name}`);
    files.set(name, readFileSync(resolve(sourceFolder, name), 'utf8'));
  }
}
const adapters = {
  'wix-data': '../runtime/data.js',
  'wix-http-functions': '../runtime/http.js',
  'wix-secrets-backend': '../runtime/secrets.js',
  'wix-fetch': '../runtime/fetch.js'
};
const manifest = {};
let keyBase = resolve(root, '../Exams/answer-keys');
try { readdirSync(keyBase); } catch { keyBase = resolve(root, 'canonical/Exams/answer-keys'); }
const version = JSON.parse(readFileSync(resolve(keyBase, 'version.json'), 'utf8')).currentVersion;
const keyFolder = resolve(keyBase, 'versions', version);
const answerKeys = {};
for (const name of readdirSync(keyFolder).filter(name => name.endsWith('.json'))) {
  const key = JSON.parse(readFileSync(resolve(keyFolder, name), 'utf8'));
  if (key.examId) answerKeys[key.examId] = key;
}
writeFileSync(resolve(output, 'answer-keys.json'), JSON.stringify(answerKeys));
manifest.answerKeys = createHash('sha256').update(JSON.stringify(answerKeys)).digest('hex');
for (const [name, source] of files) {
  manifest[name] = createHash('sha256').update(source.replace(/\r\n/g, '\n')).digest('hex');
  let code = source.replace(/(from\s+)(["'])([^"']+)\2/g, (whole, prefix, quote, specifier) => {
    const target = adapters[specifier] || (specifier.startsWith('backend/') ? './' + specifier.slice(8) : specifier);
    return prefix + quote + target + quote;
  });
  if (name === 'exams.js') code = 'import bundledAnswerKeys from "./answer-keys.json";\n' + code + '\nObject.assign(FALLBACK_ANSWER_KEYS, bundledAnswerKeys);\n';
  writeFileSync(resolve(output, name), code);
}
writeFileSync(resolve(output, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
console.log(`Prepared ${files.size} canonical assessment modules; grading and persistence source preserved.`);

