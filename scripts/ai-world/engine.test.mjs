import test from 'node:test';
import assert from 'node:assert/strict';
import { initialWorld, WorldEngine, parseReply, validateAgent } from './engine.mjs';
import { publicSnapshot } from './publish.mjs';
test('empty structured output is an error, not an agent contribution', () => { assert.throws(() => parseReply('{}'), /without a contribution/); });
test('public snapshot excludes private memory and internal run errors', () => { const state = initialWorld(); state.agents[0].memory = 'private note'; state.runs.push({ status: 'failed', error: 'private diagnostic', currentAgent: null, turns: 0, maxTurns: 3 }); const snapshot = JSON.stringify(publicSnapshot(state)); assert.ok(!snapshot.includes('private note')); assert.ok(!snapshot.includes('private diagnostic')); });
function setup(generate) { const state = initialWorld(); state.projects.push({ id: 'p', title: 'Demo', goal: 'Build a checklist.' }); return new WorldEngine(state, async () => {}, generate); }
test('agents see prior contributions and persist drafts and notes', async () => {
  let count = 0;
  const engine = setup(async (a, messages) => { if (count++) assert.match(messages[1].content, /contribution/); return { message: 'contribution', memory: 'check assumptions', artifact: { title: 'Checklist', content: '- Check the result' } }; });
  engine.start({ projectId: 'p', rounds: 2 }); await engine.completion;
  assert.equal(count, 6); assert.equal(engine.state.messages.length, 6); assert.equal(engine.state.artifacts.length, 6); assert.equal(engine.state.runs[0].status, 'completed'); assert.equal(engine.state.agents[0].memory, 'check assumptions'); assert.equal(engine.active, null);
});
test('overlapping runs are rejected and stop aborts in-flight work', async () => {
  let entered; const ready = new Promise(resolve => { entered = resolve; });
  const engine = setup((a, m, signal) => new Promise((resolve, reject) => { entered(); signal.addEventListener('abort', () => reject(new Error('aborted')), { once: true }); }));
  engine.start({ projectId: 'p' }); await ready;
  assert.throws(() => engine.start({ projectId: 'p' }), /already running/); engine.stop(); await engine.completion;
  assert.equal(engine.state.runs[0].status, 'stopped'); assert.equal(engine.state.messages.length, 0); assert.equal(engine.active, null);
});
test('cloud agents require explicit consent before sending context', () => { const engine = setup(); engine.state.agents[0].provider = 'openrouter'; assert.throws(() => engine.start({ projectId: 'p' }), /Confirm sharing/); assert.equal(engine.state.runs.length, 0); });
test('provider failures are visible and terminate the run', async () => { const engine = setup(async () => { throw new Error('provider unavailable'); }); engine.start({ projectId: 'p' }); await engine.completion; assert.equal(engine.state.runs[0].status, 'failed'); assert.match(engine.state.runs[0].error, /unavailable/); assert.equal(engine.active, null); });
test('validate limits and preserve plain-text responses', () => { assert.deepEqual(parseReply('hello'), { message: 'hello' }); assert.throws(() => parseReply(''), /empty/); assert.throws(() => validateAgent({ provider: 'http://attacker' }), /Choose/); assert.throws(() => setup().start({ projectId: 'p', rounds: 100 }), /1 to 3/); });
