import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import path from 'node:path';
const require = createRequire(import.meta.url);
const cli = path.join(path.dirname(require.resolve('wrangler/package.json')), 'bin/wrangler.js');
async function wrangler(args) {
  const child = spawn(process.execPath, [cli, ...args], { stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env, CI: 'true' } });
  let output = '';
  child.stdout.on('data', chunk => { output += chunk; process.stdout.write(chunk); });
  child.stderr.on('data', chunk => process.stderr.write(chunk));
  const code = await new Promise((resolve, reject) => { child.on('error', reject); child.on('close', resolve); });
  if (code !== 0) throw new Error(`Wrangler ${args[0]} ${args[1]} failed (${code}).`);
  return output;
}
// Routes are managed separately. The CI token can publish versions, but cannot edit zone routes.
const output = await wrangler(['versions', 'upload', '--message', 'NOMI World verified Linux build']);
const version = output.match(/Worker Version ID:\s*([a-f0-9-]{36})/i)?.[1];
if (!version) throw new Error('No uploaded version ID found; refusing to deploy an unspecified version.');
await wrangler(['versions', 'deploy', `${version}@100`, '--yes', '--message', 'Deploy NOMI World without modifying domain routes']);
