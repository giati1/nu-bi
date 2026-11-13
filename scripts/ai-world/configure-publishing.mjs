import { randomBytes } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import path from 'node:path';

// Operator-only setup. Never prints or commits the publisher credential.
const require = createRequire(import.meta.url);
const file = path.resolve('.env.local');
let content = await readFile(file, 'utf8').catch(error => { if (error.code !== 'ENOENT') throw error; return ''; });
let secret = content.match(/^NOMI_WORLD_PUBLISH_SECRET=([a-f0-9]{64})\s*$/m)?.[1];
if (!secret) secret = randomBytes(32).toString('hex');
const target = process.argv[2] || 'https://nu-bi.com/api/world';
if (new URL(target).protocol !== 'https:') throw new Error('Use an HTTPS publication endpoint.');
for (const [name, value] of [['NOMI_WORLD_PUBLISH_SECRET', secret], ['NOMI_WORLD_PUBLISH_URL', target]]) {
  const pattern = new RegExp('^' + name + '=.*$', 'm');
  content = pattern.test(content) ? content.replace(pattern, `${name}=${value}`) : content.trimEnd() + `\n${name}=${value}\n`;
}
await writeFile(file, content, { mode: 0o600 });
const cli = path.join(path.dirname(require.resolve('wrangler/package.json')), 'bin/wrangler.js');
const child = spawn(process.execPath, [cli, 'secret', 'put', 'NOMI_WORLD_PUBLISH_SECRET'], { stdio: ['pipe', 'pipe', 'pipe'], env: { ...process.env, CI: 'true' } });
let output = '';
child.stdout.on('data', data => { output += data; }); child.stderr.on('data', data => { output += data; });
child.stdin.end(secret + '\n');
const code = await new Promise((resolve, reject) => { child.on('error', reject); child.on('close', resolve); });
if (code !== 0) throw new Error('Cloudflare secret setup failed. ' + output.replaceAll(secret, '[redacted]').slice(-1500));
console.log('Publisher credential saved locally and configured on the production Worker. Restart the world console to connect.');
