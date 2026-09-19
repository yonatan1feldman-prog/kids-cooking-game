// Pre-renders every SVG in public/assets/images to a WebP at its display size in the 1080-high world
// (its native size, times `raster` in assets.ts for art shown bigger), into public/assets/images/webp/.
// Why: the style-B art uses SVG filters (paper texture, torn edges) that cost ~2.6 s to rasterize at load.
//
// It runs INSIDE the game page on the dev server (the same Chrome rasterizer the game uses, no extra tool):
//   open http://localhost:5173/kids-cooking-game/ , then in the JS console / automation tool:
//   eval(await (await fetch('scripts/bake-webp.js')).text()); await __bakeWebp();   // writes the files
//   await __compareWebp();                                                            // SVG vs WebP pixel diff
// The dev server's /__bake endpoint (plugins/asset-manifest.ts) writes the files and webp/sources.json
// (the sha1 of each source SVG). The build only copies the committed WebP files: it never runs this.
(() => {
  // Small art is stored lossless (lossy errors show most on small, sharp items); art whose lossless file
  // would be over LOSSLESS_MAX (the background, boards, oven, characters' bodies) is lossy at QUALITY.
  const QUALITY = 0.92;
  const LOSSLESS_MAX = 64 * 1024;

  // Same steps as src/core/svgRaster.ts: native box, aspect kept, drawn once onto a canvas.
  const rasterize = async (key, w, h) => {
    const text = await (await fetch(`assets/images/${key}.svg`, { cache: 'no-store' })).text();
    const svg = new DOMParser().parseFromString(text, 'image/svg+xml').documentElement;
    const vb = (svg.getAttribute('viewBox') || '').trim().split(/[\s,]+/).map(Number);
    const aspect = vb.length === 4 && vb[2] > 0 ? vb[2] / vb[3] : w / h;
    let cw = w, ch = cw / aspect;
    if (ch > h) { ch = h; cw = ch * aspect; }
    cw = Math.max(1, Math.round(cw)); ch = Math.max(1, Math.round(ch));
    svg.setAttribute('width', String(cw));
    svg.setAttribute('height', String(ch));
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    const url = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(svg)], { type: 'image/svg+xml' }));
    try {
      const img = new Image();
      await new Promise((ok, bad) => { img.onload = ok; img.onerror = bad; img.src = url; });
      const c = document.createElement('canvas');
      c.width = cw; c.height = ch;
      c.getContext('2d').drawImage(img, 0, 0, cw, ch);
      return c;
    } finally {
      URL.revokeObjectURL(url);
    }
  };

  const list = async () => (await fetch('/__bake/list')).json();

  window.__bakeWebp = async (only) => {
    const out = [];
    for (const { key, sha1, w, h } of await list()) {
      if (only && !only.includes(key)) continue;
      const c = await rasterize(key, w, h);
      const encode = (q) => new Promise((r) => c.toBlob(r, 'image/webp', q));
      let blob = await encode(1); // quality 1 = lossless in Chrome
      if (blob.size > LOSSLESS_MAX) blob = await encode(QUALITY);
      const q = new URLSearchParams({ key, sha1, w: String(c.width), h: String(c.height) });
      const res = await fetch(`/__bake/put?${q}`, { method: 'POST', body: blob });
      out.push(`${key} ${c.width}x${c.height} ${Math.round(blob.size / 1024)}KB ${res.ok ? '' : 'FAILED'}`);
    }
    return out;
  };

  const pixels = (c) => c.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, c.width, c.height).data;

  /** Pixel difference between each SVG (rasterized now) and its committed WebP: mean and 99th percentile, 0-255. */
  window.__compareWebp = async () => {
    const out = {};
    for (const { key, w, h } of await list()) {
      const a = await rasterize(key, w, h);
      const img = new Image();
      await new Promise((ok, bad) => { img.onload = ok; img.onerror = bad; img.src = `assets/images/webp/${key}.webp?${Date.now()}`; });
      const b = document.createElement('canvas');
      b.width = a.width; b.height = a.height;
      b.getContext('2d').drawImage(img, 0, 0);
      if (img.naturalWidth !== a.width || img.naturalHeight !== a.height) { out[key] = 'SIZE MISMATCH'; continue; }
      const pa = pixels(a), pb = pixels(b);
      // Colour compared premultiplied by alpha (fully transparent pixels have no meaningful colour).
      const hist = new Uint32Array(256);
      let sum = 0, n = 0;
      for (let i = 0; i < pa.length; i += 4) {
        const aa = pa[i + 3] / 255, ab = pb[i + 3] / 255;
        let d = Math.abs(pa[i + 3] - pb[i + 3]);
        for (let j = 0; j < 3; j++) d = Math.max(d, Math.abs(pa[i + j] * aa - pb[i + j] * ab));
        const di = Math.min(255, Math.round(d));
        hist[di]++; sum += di; n++;
      }
      let acc = 0, p99 = 0;
      for (let v = 0; v < 256; v++) { acc += hist[v]; if (acc >= n * 0.99) { p99 = v; break; } }
      out[key] = { mean: +(sum / n).toFixed(2), p99 };
    }
    return out;
  };
})();
