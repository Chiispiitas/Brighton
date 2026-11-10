import test from 'node:test';
import assert from 'node:assert/strict';
import { createDispatcher } from '../src/runtime/dispatch.js';
import { ok, response } from '../src/runtime/http.js';

test('adapts GET query and returns noncached JSON', async () => {
  const dispatch = createDispatcher({ get_getResults: async req => ok({ body: JSON.stringify(req.query) }) });
  const result = await dispatch(new Request('https://example.test/api/assessment/getResults?classId=A%2B1'), 'getResults');
  assert.deepEqual(await result.json(), { classId: 'A+1' });
  assert.equal(result.headers.get('Cache-Control'), 'no-store');
});
test('body may be reread by canonical legacy handlers', async () => {
  const dispatch = createDispatcher({ post_submitExam: async req => {
    const parsed = await req.body.json();
    assert.equal(await req.body.text(), '{"answer":42}');
    return ok({ body: JSON.stringify(parsed) });
  } });
  const result = await dispatch(new Request('https://example.test/', { method: 'POST', body: '{"answer":42}' }), 'submitExam');
  assert.deepEqual(await result.json(), { answer: 42 });
});
test('preflight, wrong verbs and unknown routes never execute business logic', async () => {
  let calls = 0;
  const dispatch = createDispatcher({ post_saveWritingAssessment: () => { calls++; return ok({}); }, use_saveWritingAssessment: () => response({ status: 204 }) });
  const preflight = await dispatch(new Request('https://example.test/', { method: 'OPTIONS' }), 'saveWritingAssessment');
  assert.equal(preflight.status, 204);
  assert.match(preflight.headers.get('Access-Control-Allow-Methods'), /POST/);
  assert.equal((await dispatch(new Request('https://example.test/'), 'saveWritingAssessment')).status, 405);
  assert.equal((await dispatch(new Request('https://example.test/'), '__proto__')).status, 404);
  assert.equal((await dispatch(new Request('https://example.test/'), 'toString')).status, 404);
  assert.equal(calls, 0);
});
test('unknown exceptions do not disclose internal credentials', async () => {
  const dispatch = createDispatcher({ get_getResults: () => { throw new Error('private-token'); } });
  const result = await dispatch(new Request('https://example.test/'), 'getResults');
  assert.equal(result.status, 503);
  assert.doesNotMatch(await result.text(), /private-token/);
});
test('health exposes public provenance only', async () => {
  const dispatch = createDispatcher({ get_brightonBackendHealth: () => ok({ body: '{"success":true}' }) }, { runtime: 'wix-headless' });
  const result = await dispatch(new Request('https://example.test/'), 'brightonBackendHealth');
  assert.deepEqual(await result.json(), { success: true, deployment: { runtime: 'wix-headless' } });
});
test('oversized body rejected before any persistence', async () => {
  const dispatch = createDispatcher({ post_submitTest: () => { throw new Error('should not reach'); } });
  const result = await dispatch(new Request('https://example.test/', { method: 'POST', headers: { 'Content-Length': '14000001' }, body: '{}' }), 'submitTest');
  assert.equal(result.status, 413);
});
