// Renders the PWA icons (the kitchen card's pot on its paper disc) to PNG:
//   public/icons/icon-192.png, icon-512.png (purpose "any") and icon-maskable-512.png (the disc inside the safe circle).
// The sources are SVGs drawn by assets-src/images-b-clinic/tools/gen_title_worlds.py --icons (into its icons/ folder).
// They use SVG filters (the paper grain), so a real browser renders them: Playwright's Chromium (not a project
// dependency; in the cloud it is at /opt/node-tools, else set PLAYWRIGHT to a playwright/index.mjs).
// Usage: python assets-src/images-b-clinic/tools/gen_title_worlds.py --icons && node scripts/make-icons.mjs
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const pw = process.env.PLAYWRIGHT ?? '/opt/node-tools/node_modules/playwright/index.mjs';
const { chromium } = await import(pathToFileURL(pw).href);
const src = path.resolve('assets-src/images-b-clinic/icons');
const out = path.resolve('public/icons');
const ICONS = [
  ['icon-any.svg', 192, 'icon-192.png'],
  ['icon-any.svg', 512, 'icon-512.png'],
  ['icon-maskable.svg', 512, 'icon-maskable-512.png'],
];

fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 512, height: 512 } });
for (const [file, size, name] of ICONS) {
  const svg = fs.readFileSync(path.join(src, file), 'utf8');
  const url = 'data:image/svg+xml;base64,' + Buffer.from(svg).toString('base64');
  await page.setContent(`<html><body style="margin:0"><img src="${url}" width="${size}" height="${size}"></body></html>`);
  await page.waitForFunction(() => document.images[0].complete);
  await page.screenshot({ path: path.join(out, name), clip: { x: 0, y: 0, width: size, height: size } });
  console.log(name, size);
}
await browser.close();
