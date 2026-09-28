const $ = id => document.getElementById(id);
let state, selected, catalog = [], catalogProvider = 'ollama', refreshing = false;
function node(tag, text, className) { const el = document.createElement(tag); if (text !== undefined) el.textContent = text; if (className) el.className = className; return el; }
function notice(text) { $('notice').textContent = text; }
async function api(path, data) {
  const response = await fetch('/api/' + path, data === undefined ? {} : { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Nomi-World': '1' }, body: JSON.stringify(data) });
  const result = await response.json(); if (!response.ok) throw new Error(result.error || 'Request failed.'); return result;
}
async function action(fn) { try { await fn(); await refresh(); } catch (error) { notice(error.message); } }
async function refresh() {
  if (refreshing) return; refreshing = true;
  try { state = await api('state'); selected ||= state.projects[0]?.id; render(); } catch (error) { notice('Connection lost: ' + error.message); } finally { refreshing = false; }
}
function render() {
  const project = state.projects.find(p => p.id === selected), running = Boolean(state.active);
  $('coding-controls').hidden = !project?.coding;
  $('code-run').disabled = running || !project?.coding;
  $('code-public').disabled = running;
  $('code-public').textContent = project?.public ? 'Make discussion private' : 'Publish discussion';
  $('code-expert').disabled = !state.expertConfigured || running;
  $('code-status').textContent = project?.coding ? `${project.runtime} · revision ${project.revision || 0} · ${project.testsPassed ? 'tests passed' : 'tests not passing yet'} · ${project.readyForReview ? 'ready for your review' : 'work in progress'}${!state.expertConfigured ? ' · OpenAI key missing' : ''}` : '';
  $('code-events').replaceChildren(...(state.codeEvents || []).filter(e=>e.projectId===selected).slice(-15).reverse().map(e=>{const details=node('details');details.append(node('summary',`${e.author} · ${e.action} · ${new Date(e.createdAt).toLocaleTimeString()}`),node('pre',JSON.stringify(e.result,null,2)));return details;}));
  $('status').textContent = running ? `${state.active.currentAgent || 'Residents'} working` : 'Local world · ready';
  $('publication').textContent = state.publication?.error || (state.publication?.lastPublishedAt ? `Public world synced ${new Date(state.publication.lastPublishedAt).toLocaleTimeString()} · ${state.publication.url}` : 'Public sync is not connected yet. Configure the publisher URL and secret.');
  $('project-title').textContent = project?.title || 'Start with a shared goal'; $('project-goal').textContent = project?.goal || 'Create a project to bring the residents together.';
  $('projects').replaceChildren(...state.projects.map(p => { const el = node('button', `${p.title}${p.status === 'completed' ? ' · completed' : ''}`, 'project' + (p.id === selected ? ' selected' : '')); el.onclick = () => { selected = p.id; render(); }; return el; }));
  $('agent-count').textContent = `${state.agents.filter(a => a.enabled).length} active`;
  $('agents').replaceChildren(...state.agents.map(a => { const card = node('div', undefined, 'resident'); card.append(node('strong', a.name), node('small', `${a.provider} / ${a.model}`), node('p', a.role));
    if (a.memory) { const details = node('details'); details.append(node('summary', 'Remembered note · unverified'), node('p', a.memory)); card.append(details); }
    const toggle = node('button', a.enabled ? 'Pause resident' : 'Enable resident', 'secondary'); toggle.disabled = running; toggle.onclick = () => action(() => api('agents', { ...a, enabled: !a.enabled }));
    const edit = node('button', 'Edit', 'secondary'); edit.disabled = running; edit.onclick = () => { const f = $('agent-form'); for (const key of ['id','name','role','provider','model']) f.elements[key].value = a[key]; f.elements.enabled.checked = a.enabled; f.closest('details').open = true; f.scrollIntoView({ behavior: 'smooth', block: 'center' }); }; card.append(toggle, edit); return card;
  }));
  $('run').disabled = running || !project; $('stop').disabled = !running; $('complete').disabled = running || !project;
  $('complete').textContent = project?.status === 'completed' ? 'Reopen project' : 'Mark completed';
  for (const id of ['project-form','agent-form','message-form','import-form']) for (const el of $(id).elements) el.disabled = running || (id === 'message-form' && !project);
  const run = [...state.runs].reverse().find(r => r.projectId === selected);
  $('run-status').textContent = run ? `${run.status} · ${run.turns}/${run.maxTurns} contributions${run.currentAgent ? ' · ' + run.currentAgent + ' is thinking' : ''}${run.error ? ' · ' + run.error : ''}` : 'Local agents take turns. Each turn can take several minutes on this PC.';
  const messages = state.messages.filter(m => m.projectId === selected), list = $('messages'), atBottom = list.scrollHeight - list.scrollTop - list.clientHeight < 60;
  list.replaceChildren(...messages.map(m => { const card = node('div', undefined, 'message'); card.append(node('strong', m.author), node('div', `${m.model ? 'AI · ' + m.provider + ' / ' + m.model + ' · ' : ''}${new Date(m.createdAt).toLocaleString()}`, 'meta'), node('p', m.body)); return card; }));
  if (!messages.length) list.append(node('p', 'No contributions yet. Start a discussion or add your direction.', 'empty'));
  if (atBottom) list.scrollTop = list.scrollHeight;
  $('artifacts').replaceChildren(...state.artifacts.filter(a => a.projectId === selected).map(a => { const card = node('div', undefined, 'draft'); card.append(node('h3', a.title), node('small', `Draft by ${a.author} · ${new Date(a.createdAt).toLocaleString()}`), node('pre', a.content)); const download = node('button', 'Download draft', 'secondary'); download.onclick = () => { const url = URL.createObjectURL(new Blob([a.content], { type: 'text/plain' })); const link = node('a'); link.href = url; link.download = 'nomi-draft-' + a.id + '.txt'; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); }; card.append(download); return card; }));
  $('provider-status').textContent = state.providers.filter(p => p.keyName).map(p => `${p.id}: ${p.configured ? 'key configured' : 'set ' + p.keyName + ' in .env.local and restart'}`).join(' · ');
}
$('project-form').onsubmit = e => { e.preventDefault(); const f = e.currentTarget; action(async () => { const data=Object.fromEntries(new FormData(f));const p = await api('projects', {...data,coding:data.mode!=='discussion',runtime:data.mode}); selected = p.id; f.reset(); notice('Project created. Choose discussion or coding controls to begin.'); }); };
$('invent').onclick=()=>action(async()=>{const p=await api('projects',{title:'Agent-designed software project',goal:'Propose one small useful JavaScript utility that uses only the standard library. Then implement it, add meaningful tests and review the result. Keep the first version small enough to complete in one session.',coding:true,runtime:'node',agentDesigned:true});selected=p.id;notice('Private project created. Start coding to let the planner choose the idea and the team build it.');});
$('code-run').onclick=()=>action(async()=>{await api('code/run',{projectId:selected,maxSteps:Number($('code-steps').value),allowWeb:$('code-web').checked,allowExpert:$('code-expert').checked});notice('Coding started. Files and real tool results appear below.');});
$('code-public').onclick=()=>action(()=>api('code/visibility',{projectId:selected,public:!state.projects.find(p=>p.id===selected).public}));
$('import-form').onsubmit=e=>{e.preventDefault();action(async()=>{const r=await api('code/import',{projectId:selected,source:e.target.elements.source.value});notice(`Imported ${r.imported} source files. ${r.skipped}`);});};
$('code-files').onclick=()=>action(async()=>{const projectId=selected;const r=await api('code/files?projectId='+encodeURIComponent(projectId));$('workspace-path').textContent=r.workspace;$('file-preview').textContent='';$('file-list').replaceChildren(...r.files.map(path=>{const b=node('button',path,'secondary');b.onclick=()=>action(async()=>{const file=await api('code/files?projectId='+encodeURIComponent(projectId)+'&path='+encodeURIComponent(path));$('file-preview').textContent=file.content;});return b;}));});
$('agent-form').onsubmit = e => { e.preventDefault(); const f = e.currentTarget; action(async () => { await api('agents', { ...Object.fromEntries(new FormData(f)), enabled: f.elements.enabled.checked }); f.reset(); f.elements.id.value = ''; notice('Resident saved.'); }); };
$('reset-agent').onclick = () => { $('agent-form').reset(); $('agent-form').elements.id.value = ''; };
$('message-form').onsubmit = e => { e.preventDefault(); const f = e.currentTarget; action(async () => { await api('message', { projectId: selected, body: f.elements.body.value }); f.reset(); notice('Direction added. Start another discussion round to get responses.'); }); };
$('run').onclick = () => action(async () => { await api('run', { projectId: selected, rounds: Number($('rounds').value), allowCloud: $('allow-cloud').checked }); $('allow-cloud').checked = false; notice('Discussion started. Contributions appear as each resident finishes.'); });
$('stop').onclick = () => action(async () => { await api('stop', {}); notice('Stopping the current turn. Earlier contributions are saved.'); });
$('complete').onclick = () => action(() => api('project-status', { projectId: selected, status: state.projects.find(p => p.id === selected).status === 'completed' ? 'open' : 'completed' }));
function renderModels() { const filter = $('model-filter').value.toLowerCase(); $('models').replaceChildren(...catalog.filter(m => m.id.toLowerCase().includes(filter)).slice(0, 100).map(m => { const b = node('button', m.id + (m.size ? ` · ${(m.size / 1e9).toFixed(1)} GB` : ''), 'secondary'); b.onclick = () => { const f = $('agent-form'); f.elements.model.value = m.id; f.elements.provider.value = catalogProvider; f.closest('details').open = true; f.scrollIntoView({ behavior: 'smooth', block: 'center' }); }; return b; })); $('model-options').replaceChildren(...catalog.map(m => { const option = node('option'); option.value = m.id; return option; })); }
$('discover').onclick = () => action(async () => { const provider = $('catalog-provider').value; notice('Reading model catalog…'); const result = await api('models?provider=' + provider); catalog = result.models; catalogProvider = provider; renderModels(); notice(`Found ${catalog.length} models. Select one to configure a resident. Nothing has been installed or enabled.`); });
$('model-filter').oninput = renderModels;
refresh(); setInterval(refresh, 2500);
