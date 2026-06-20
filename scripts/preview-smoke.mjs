#!/usr/bin/env node
// preview-smoke.mjs — load the *built, minified* app in a real browser and fail
// on console errors or a blank root. Catches production-bundle-only crashes that
// `npm run build` (compile-only) and Vitest (unminified source) miss — e.g. the
// uiStore `create is not a function` crash that black-screened 1.9.0-beta.1.
//
// Usage: npm run build && node scripts/preview-smoke.mjs
// Exit 0 = app mounted, no console errors. Exit 1 = blank root or console error.

import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { setTimeout as sleep } from 'node:timers/promises';

const PORT = 4317;
const URL = `http://localhost:${PORT}/`;

const preview = spawn('npx', ['vite', 'preview', '--port', String(PORT), '--strictPort'], {
  cwd: process.cwd(),
  stdio: 'ignore',
});

let exitCode = 1;
try {
  // Wait for the preview server to accept connections.
  let up = false;
  for (let i = 0; i < 30; i++) {
    try { const r = await fetch(URL); if (r.ok) { up = true; break; } } catch { /* retry */ }
    await sleep(500);
  }
  if (!up) throw new Error(`preview server never came up at ${URL}`);

  const browser = await chromium.launch();
  const page = await browser.newPage();
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));

  await page.goto(URL, { waitUntil: 'load' });
  await sleep(2500); // let the app mount

  const rootHtml = await page.$eval('#root', (el) => el.innerHTML).catch(() => '');
  const blank = rootHtml.trim().length === 0;

  console.log(`root mounted: ${!blank}`);
  console.log(`console errors: ${errors.length}`);
  for (const e of errors) console.log(`  ✗ ${e}`);

  await browser.close();

  if (blank) console.error('FAIL: #root is empty — the app did not render.');
  else if (errors.length) console.error('FAIL: console errors during load.');
  else console.log('PASS: app mounted with no console errors.');

  exitCode = !blank && errors.length === 0 ? 0 : 1;
} catch (err) {
  console.error('smoke error:', err.message);
} finally {
  preview.kill('SIGTERM');
}
process.exit(exitCode);
