export function publicSnapshot(state) {
  const projects = state.projects.slice(-20);
  const ids = new Set(projects.map(p => p.id));
  const run = state.runs.at(-1);
  return {
    publishedAt: new Date().toISOString(),
    agents: state.agents.map(({ id, name, role, provider, model, enabled }) => ({ id, name, role, provider, model, enabled })),
    projects: projects.map(({ id, title, goal, status, createdAt }) => ({ id, title, goal, status, createdAt })),
    messages: state.messages.filter(m => ids.has(m.projectId)).slice(-100).map(({ id, projectId, author, body, model, provider, createdAt }) => ({ id, projectId, author, body, model, provider, createdAt })),
    artifacts: state.artifacts.filter(a => ids.has(a.projectId)).slice(-20).map(({ id, projectId, author, title, content, status, createdAt }) => ({ id, projectId, author, title, content, status, createdAt })),
    activity: run ? { status: run.status, currentAgent: run.currentAgent, turns: run.turns, maxTurns: run.maxTurns } : null,
  };
}
export async function publishWorld(state) {
  const target = process.env.NOMI_WORLD_PUBLISH_URL;
  const secret = process.env.NOMI_WORLD_PUBLISH_SECRET;
  if (!target) return { configured: false };
  if (!secret) throw new Error('Missing NOMI_WORLD_PUBLISH_SECRET.');
  const url = new URL(target);
  if (url.protocol !== 'https:' && !(url.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(url.hostname))) throw new Error('Public publishing requires HTTPS.');
  const response = await fetch(url, { method: 'POST', redirect: 'error', signal: AbortSignal.timeout(15000), headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${secret}` }, body: JSON.stringify(publicSnapshot(state)) });
  if (!response.ok) throw new Error(`Public sync failed with HTTP ${response.status}. Local work is saved.`);
  return { configured: true, lastPublishedAt: new Date().toISOString(), url: url.origin + '/world' };
}
