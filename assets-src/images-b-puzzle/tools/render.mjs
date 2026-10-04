// Renders the puzzle pictures (images-b-puzzle/*.svg) in Chromium, as the game would show them, to
// public/assets/puzzle/<name>.webp (800 px, the board) and <name>-thumb.webp (the picker's tile), and a contact
// sheet (sheet.jpg, git-ignored) to look at. Run from the repo root:  node assets-src/images-b-puzzle/tools/render.mjs [names...]
// (Playwright from the global node modules; PLAYWRIGHT_BROWSERS_PATH points at the pre-installed Chromium.)
import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
const require = createRequire(import.meta.url);
const pw = require(require.resolve('playwright', { paths: [execSync('npm root -g').toString().trim(), '/opt/node-tools/node_modules'] }));

const SRC = path.resolve('assets-src/images-b-puzzle');
const OUT = path.resolve('public/assets/puzzle');
const FULL = 800, THUMB = 340, Q_FULL = 0.86, Q_THUMB = 0.84;
fs.mkdirSync(OUT, { recursive: true });
const only = process.argv.slice(2);
const names = fs.readdirSync(SRC).filter((f) => f.endsWith('.svg')).map((f) => f.slice(0, -4)).filter((n) => !only.length || only.includes(n)).sort();

const browser = await pw.chromium.launch();
const page = await browser.newPage();
await page.setContent('<html><body></body></html>');
const sheet = [];
for (const name of names) {
  const svg = fs.readFileSync(path.join(SRC, name + '.svg'), 'utf8');
  const out = await page.evaluate(async ({ svg, FULL, THUMB, Q_FULL, Q_THUMB }) => {
    const url = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg)));
    const img = new Image();
    img.src = url;
    await img.decode();
    const draw = (s, q) => {
      const c = document.createElement('canvas');
      c.width = c.height = s;
      const g = c.getContext('2d');
      g.imageSmoothingQuality = 'high';
      g.drawImage(img, 0, 0, s, s);
      return [c.toDataURL('image/webp', q), c.toDataURL('image/jpeg', 0.9)];
    };
    const [full, jpg] = draw(FULL, Q_FULL);
    const [thumb] = draw(THUMB, Q_THUMB);
    return { full, thumb, jpg };
  }, { svg, FULL, THUMB, Q_FULL, Q_THUMB });
  const save = (file, data) => fs.writeFileSync(file, Buffer.from(data.split(',')[1], 'base64'));
  save(path.join(OUT, name + '.webp'), out.full);
  save(path.join(OUT, name + '-thumb.webp'), out.thumb);
  sheet.push(out.jpg);
  const kb = (f) => (fs.statSync(path.join(OUT, f)).size / 1024).toFixed(0);
  console.log(name, kb(name + '.webp') + ' KB', kb(name + '-thumb.webp') + ' KB');
}
// A contact sheet to look at (4 across).
const jpg = await page.evaluate(async (list) => {
  const n = list.length, cols = Math.min(4, n), rows = Math.ceil(n / cols), s = 400;
  const c = document.createElement('canvas');
  c.width = cols * s; c.height = rows * s;
  const g = c.getContext('2d');
  for (let i = 0; i < n; i++) {
    const im = new Image(); im.src = list[i]; await im.decode();
    g.drawImage(im, (i % cols) * s, Math.floor(i / cols) * s, s, s);
  }
  return c.toDataURL('image/jpeg', 0.88);
}, sheet);
fs.writeFileSync(path.join(SRC, 'sheet.jpg'), Buffer.from(jpg.split(',')[1], 'base64'));
await browser.close();
