import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
const browser = await chromium.launch({ channel: 'msedge', headless: true });
try {
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('http://127.0.0.1:8010');
    await page.getByRole('heading', { name: 'Welcome to NOMI World', exact: true }).waitFor();
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `Overflow at ${width}`);
  }
  const blocked = await fetch('http://127.0.0.1:8010/api/stop', { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: 'https://untrusted.example' }, body: '{}' });
  assert.equal(blocked.status, 403);
  assert.deepEqual(errors, []);
  await page.screenshot({ path: '.ai-world/dashboard.png', fullPage: true });
  console.log('Desktop/mobile dashboard, script execution, and cross-origin write protection passed.');
} finally { await browser.close(); }
