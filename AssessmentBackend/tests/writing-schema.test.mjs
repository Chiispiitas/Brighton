import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const location = name => {
  const repo = new URL('../../Placement/wix-backend/' + name, import.meta.url);
  return fs.existsSync(repo) ? repo : new URL('../canonical/Placement/wix-backend/' + name, import.meta.url);
};
test('all writing profiles constrain exact questions, scale names and integer bands', async () => {
  const rubric = new vm.SourceTextModule(fs.readFileSync(location('writing-rubric.js'), 'utf8'));
  await rubric.link(() => {}); await rubric.evaluate();
  let currentTasks;
  let captured;
  const imports = {
    'wix-secrets-backend': { default: { getSecret: async () => 'synthetic-key' } },
    'wix-fetch': { fetch: async (_, options) => {
      captured = JSON.parse(options.body);
      return { ok: true, json: async () => ({ candidates: [{ content: { parts: [{ text: JSON.stringify({ scores: currentTasks.map(task => ({ question: task.question, bands: Object.fromEntries(task.subscales.map(name => [name, 3])), feedback: 'Synthetic provider fixture.' })) }) }] } }] }) };
    } },
    https: { default: {} },
    'backend/writing-rubric.js': { validateScores: rubric.namespace.validateScores, RUBRIC_VERSION: 'test' }
  };
  const module = new vm.SourceTextModule(fs.readFileSync(location('writing-ai.js'), 'utf8'));
  await module.link(name => new vm.SyntheticModule(Object.keys(imports[name]), function() { for (const [key, value] of Object.entries(imports[name])) this.setExport(key, value); }));
  await module.evaluate();
  for (const profile of Object.values(rubric.namespace.PROFILES)) {
    currentTasks = profile.tasks.map(task => ({ ...task, answer: 'A synthetic nonblank answer.', images: [] }));
    const result = await module.namespace.gradeWriting(currentTasks);
    assert.equal(result.scores.length, currentTasks.length);
    const schema = captured.generationConfig.responseJsonSchema.properties.scores;
    assert.equal(schema.minItems, currentTasks.length);
    assert.equal(schema.maxItems, currentTasks.length);
    currentTasks.forEach((task, index) => {
      const item = schema.prefixItems[index];
      assert.equal(item.properties.question.minimum, task.question);
      assert.equal(item.properties.question.maximum, task.question);
      assert.deepEqual(item.properties.bands.required, Array.from(task.subscales));
      for (const value of Object.values(item.properties.bands.properties)) assert.deepEqual(value, { type: 'integer', minimum: 0, maximum: 5 });
    });
  }
});
