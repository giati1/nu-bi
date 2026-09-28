import http from 'node:http';
import { randomUUID } from 'node:crypto';
import { mkdir, readFile, writeFile, rename, open, unlink } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import nextEnv from '@next/env';
import { initialWorld, providers, validateAgent, WorldEngine } from './engine.mjs';
import { publishWorld } from './publish.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
nextEnv.loadEnvConfig(root);
const port = Number(process.env.NOMI_WORLD_PORT || 8010);
if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new Error('Invalid NOMI_WORLD_PORT.');
const origin = `http://127.0.0.1:${port}`;
const directory = path.join(root, '.ai-world');
await mkdir(directory, { recursive: true });
const lockPath = path.join(directory, 'server.lock');
try {
  const lock = await open(lockPath, 'wx');
  await lock.writeFile(String(process.pid)); await lock.close();
} catch { throw new Error('World is already running, or .ai-world/server.lock remains after a crash. Confirm its PID is no longer running before removing the lock.'); }
const statePath = path.join(directory, 'state.json');
let state;
try { state = JSON.parse(await readFile(statePath, 'utf8')); }
catch (error) { if (error.code !== 'ENOENT') { await unlink(lockPath); throw error; } state = initialWorld(); }
if (state.version !== 1) { await unlink(lockPath); throw new Error('Unsupported world data version.'); }
for (const run of state.runs) if (run.status === 'running') { run.status = 'interrupted'; run.error = 'Server stopped before completion.'; }
let pendingSave = Promise.resolve();
function save() {
  const snapshot = JSON.stringify(state, null, 2);
  pendingSave = pendingSave.catch(() => {}).then(async () => {
    await writeFile(statePath + '.tmp', snapshot, { mode: 0o600 });
    await rename(statePath + '.tmp', statePath);
  });
  return pendingSave;
}
const engine = new WorldEngine(state, save);
let publishing = false;
let publication = { configured: Boolean(process.env.NOMI_WORLD_PUBLISH_URL) };
async function sync() {
  if (publishing || !process.env.NOMI_WORLD_PUBLISH_URL) return;
  publishing = true;
  try { publication = await publishWorld(state); }
  catch (error) { publication = { ...publication, error: error.message }; }
  finally { publishing = false; }
}
await save();
const syncTimer = setInterval(() => { void sync(); }, 30000);
void sync();
const staticFiles = { '/': ['index.html', 'text/html'], '/app.js': ['app.js', 'text/javascript'], '/style.css': ['style.css', 'text/css'] };
function send(res, status, value) { res.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }); res.end(JSON.stringify(value)); }
async function body(req) {
  let text = '';
  for await (const chunk of req) { text += chunk; if (Buffer.byteLength(text) > 20000) throw new Error('Request is too large.'); }
  return JSON.parse(text || '{}');
}
const server = http.createServer(async (req, res) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'");
  const hosts = [`127.0.0.1:${port}`, `localhost:${port}`];
  if (!hosts.includes(req.headers.host) || (req.headers.origin && ![origin, `http://localhost:${port}`].includes(req.headers.origin)) || req.headers['sec-fetch-site'] === 'cross-site') return send(res, 403, { error: 'Local access only.' });
  const url = new URL(req.url, origin);
  try {
    if (req.method === 'GET' && staticFiles[url.pathname]) {
      const [file, type] = staticFiles[url.pathname];
      res.writeHead(200, { 'Content-Type': `${type}; charset=utf-8`, 'Cache-Control': 'no-store' });
      res.end(await readFile(new URL(file, import.meta.url))); return;
    }
    if (req.method === 'GET' && url.pathname === '/api/state') return send(res, 200, { ...state, publication, active: engine.active?.run || null,
      providers: Object.entries(providers).map(([id, p]) => ({ id, configured: !p.key || Boolean(process.env[p.key]), keyName: p.key })) });
    if (req.method === 'GET' && url.pathname === '/api/models') {
      const provider = url.searchParams.get('provider') || 'ollama';
      if (!['ollama', 'openrouter', 'groq'].includes(provider)) throw new Error('Unknown provider.');
      const p = providers[provider];
      const response = await fetch(p.base + (provider === 'ollama' ? '/api/tags' : '/models'), {
        signal: AbortSignal.timeout(15000), headers: p.key && process.env[p.key] ? { Authorization: `Bearer ${process.env[p.key]}` } : {},
      });
      if (!response.ok) throw new Error(`Model catalog returned HTTP ${response.status}.`);
      const data = await response.json();
      const models = provider === 'ollama' ? data.models.map(m => ({ id: m.name, size: m.size })) : data.data.filter(m => !m.architecture || m.architecture.output_modalities?.includes('text')).map(m => ({ id: m.id, name: m.name, context: m.context_length, pricing: m.pricing }));
      return send(res, 200, { provider, models });
    }
    if (req.method !== 'POST' || req.headers['x-nomi-world'] !== '1' || !req.headers['content-type']?.startsWith('application/json')) return send(res, 403, { error: 'Invalid local request.' });
    const input = await body(req);
    if (url.pathname === '/api/publish') { await sync(); return send(res, publication.error ? 502 : 200, publication); }
    if (url.pathname === '/api/stop') { engine.stop(); return send(res, 200, { stopping: true }); }
    if (url.pathname === '/api/run') return send(res, 202, engine.start(input));
    if (engine.active) throw new Error('Stop the current discussion before editing the world.');
    if (url.pathname === '/api/projects') {
      if (typeof input.title !== 'string' || !input.title.trim() || input.title.length > 120 || typeof input.goal !== 'string' || !input.goal.trim() || input.goal.length > 4000) throw new Error('Enter a title and a goal (up to 4,000 characters).');
      const project = { id: randomUUID(), title: input.title.trim(), goal: input.goal.trim(), status: 'open', createdAt: new Date().toISOString() };
      state.projects.push(project); await save(); return send(res, 201, project);
    }
    if (url.pathname === '/api/agents') {
      const data = validateAgent(input);
      const agent = input.id ? state.agents.find(a => a.id === input.id) : null;
      if (input.id && !agent) throw new Error('Agent not found.');
      if (agent) Object.assign(agent, data);
      else { if (state.agents.length >= 20) throw new Error('Maximum 20 resident agents.'); state.agents.push({ ...data, id: randomUUID(), memory: '' }); }
      await save(); return send(res, 200, { ok: true });
    }
    if (url.pathname === '/api/message') {
      if (!state.projects.some(p => p.id === input.projectId) || typeof input.body !== 'string' || !input.body.trim() || input.body.length > 4000) throw new Error('Choose a project and enter a message up to 4,000 characters.');
      state.messages.push({ id: randomUUID(), projectId: input.projectId, author: 'You', body: input.body.trim(), createdAt: new Date().toISOString() });
      await save(); return send(res, 201, { ok: true });
    }
    if (url.pathname === '/api/project-status') {
      const project = state.projects.find(p => p.id === input.projectId);
      if (!project || !['open', 'completed'].includes(input.status)) throw new Error('Invalid project status.');
      project.status = input.status; await save(); return send(res, 200, { ok: true });
    }
    send(res, 404, { error: 'Not found.' });
  } catch (error) { send(res, 400, { error: error.message || 'Request failed.' }); }
});
server.on('error', async error => { clearInterval(syncTimer); console.error(error.message); await unlink(lockPath).catch(() => {}); process.exitCode = 1; });
server.listen(port, '127.0.0.1', () => console.log(`NOMI World is ready: ${origin}`));
async function shutdown() { clearInterval(syncTimer); engine.stop(); await engine.completion; await pendingSave.catch(() => {}); server.close(); await unlink(lockPath).catch(() => {}); process.exit(0); }
process.on('SIGINT', shutdown); process.on('SIGTERM', shutdown);
