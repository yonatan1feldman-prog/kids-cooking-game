// Screenshots of salon-sheet.html (the mermaid salon's drawing check, PR V). Serve the repo root first, e.g.
//   python3 -m http.server 8765   then   node assets-src/images-b-sea/tools/shot_salon.cjs <outdir> [sheet ...]
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const out = process.argv[2] || '.tmp/salon';
  const sheets = process.argv.slice(3).length ? process.argv.slice(3) : ['customers', 'hair', 'tint', 'tails', 'outfit', 'jewels', 'tools', 'room'];
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1600, height: 1000 }, deviceScaleFactor: 1 });
  page.on('console', (m) => { if (m.type() === 'warning' || m.type() === 'error') console.log('[page]', m.text()); });
  for (const s of sheets) {
    await page.goto(`http://localhost:8765/assets-src/images-b-sea/tools/salon-sheet.html?sheet=${s}`);
    await page.waitForFunction(() => window.__done, null, { timeout: 600000 });
    await page.screenshot({ path: path.join(out, `sheet-${s}.png`), fullPage: true });
    console.log('shot', s);
  }
  await browser.close();
})();
