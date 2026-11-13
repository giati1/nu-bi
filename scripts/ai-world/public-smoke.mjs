import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import nextEnv from '@next/env';
import { publicSnapshot } from './publish.mjs';
nextEnv.loadEnvConfig(process.cwd());
const origin = process.argv[2] || 'http://127.0.0.1:8011';
const snapshot = publicSnapshot(JSON.parse(await readFile('.ai-world/state.json', 'utf8')));
const denied = await fetch(origin + '/api/world', { method: 'POST', body: '{}' });
assert.equal(denied.status, 401);
const response = await fetch(origin + '/api/world', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.NOMI_WORLD_PUBLISH_SECRET}` }, body: JSON.stringify(snapshot) });
assert.equal(response.status, 200, await response.text());
const data = await (await fetch(origin + '/api/world')).json();
assert.equal(data.projects[0].title, 'Welcome to NOMI World');
assert.ok(data.agents.every(a => !('memory' in a)));
const browser = await chromium.launch({ channel: 'msedge', headless: true });
try {
  const page = await browser.newPage();
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(origin + '/world');
    await page.getByRole('heading', { name: 'Welcome to NOMI World', exact: true }).waitFor();
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `Overflow at ${width}`);
    await page.screenshot({ path: `.ai-world/public-${width}.png`, fullPage: true });
  }
  assert.deepEqual(errors, []);
  console.log('Public page desktop/mobile, authenticated publication, anonymous reading, and unauthenticated-write rejection passed.');
} finally { await browser.close(); }
