import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
const source = fs.readFileSync(new URL('../Placement/wix-backend/writing-ai.js', import.meta.url), 'utf8');
const samples = new Map([
  ['png', Buffer.from([137, 80, 78, 71, 13, 10, 26, 10, 0])],
  ['jpeg', Buffer.from([255, 216, 255, 224, 0])],
  ['webp', fs.readFileSync(new URL('exams/b1-writing/assets/picture-1.webp', import.meta.url))],
  ['invalid', Buffer.from('<html>Not an image</html>')]
]);
let gets = 0;
const https = { get(url, callback) {
  gets++;
  const response = new EventEmitter();
  response.statusCode = 200;
  const request = new EventEmitter();
  request.setTimeout = () => request;
  request.destroy = error => request.emit('error', error);
  queueMicrotask(() => {
    callback(response);
    response.emit('data', samples.get(url));
    response.emit('end');
  });
  return request;
} };
const context = vm.createContext({ Buffer, Map, Promise, setTimeout, clearTimeout, console });
const imageModule = new vm.SourceTextModule(source + '\nexport { imageData };', { context });
const imports = {
  'wix-secrets-backend': { default: {} },
  'wix-fetch': { fetch() { throw new Error('No provider requests in image-format checks.'); } },
  https: { default: https },
  'backend/writing-rubric.js': { validateScores() {}, RUBRIC_VERSION: 'test' }
};
await imageModule.link(name => new vm.SyntheticModule(Object.keys(imports[name]), function() {
  for (const [key, value] of Object.entries(imports[name])) this.setExport(key, value);
}, { context }));
await imageModule.evaluate();
for (const extension of ['png', 'jpeg', 'webp']) {
  const result = await imageModule.namespace.imageData(extension);
  assert.equal(result.inlineData.mimeType, 'image/' + extension);
  assert.deepEqual(Buffer.from(result.inlineData.data, 'base64'), samples.get(extension));
}
assert.equal((await imageModule.namespace.imageData('webp')).inlineData.mimeType, 'image/webp');
assert.equal(gets, 3, 'A loaded picture is reused.');
await assert.rejects(imageModule.namespace.imageData('invalid'), /not supported/);
await assert.rejects(imageModule.namespace.imageData('invalid'), /not supported/);
assert.equal(gets, 5, 'Invalid pictures do not remain cached.');
assert.ok(source.includes('B1 and B1+ email/story about 100 words'));
console.log('Writing images: PNG, JPEG and real B1 WebP bytes retain their correct MIME types; caching, invalid-body rejection and retry passed.');
