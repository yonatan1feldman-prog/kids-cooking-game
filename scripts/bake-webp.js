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
  // Only tiny art is stored lossless (LOSSLESS_MAX: lossy errors show most on small, sharp items, and there lossless is
  // already small). Everything else is lossy (the colour in 4:2:0, the alpha kept lossless by Chrome's encoder), at
  // QUALITY_MID while its lossless file would be under BIG, else at QUALITY (the background, boards, oven, characters'
  // bodies). If a lossy file comes out bigger than the lossless one, the lossless one is kept.
  // (Round 11: 64 KB lossless / 0.92 before; checked with __compareWebp, mean at most 3.5/255.)
  const LOSSLESS_MAX = 8 * 1024;
  const BIG = 64 * 1024;
  const QUALITY_MID = 0.95;
  const QUALITY = 0.85;
  // A lossy file whose mean pixel difference is over MAX_MEAN (0-255, see __compareWebp) is encoded again one step up
  // (QUALITY -> QUALITY_MID -> lossless). The paper grain alone gives 2-5, invisible on the phone; this only catches
  // outliers (the thin cut-face strips lose their edges' colour in 4:2:0).
  const MAX_MEAN = 4;
  // Premium round PR 1: the transparent margin is cut off (most layers are big frames with a small drawing in them: Mom's
  // 800x800 layers fill 1-26% of theirs). The file keeps only the opaque box plus TRIM_PAD px; sources.json records it as
  // `trim: {x, y, w, h}` inside the full frame `w` x `h`, and the loader (svgRaster.ts) puts the frame back with
  // Phaser's `Frame.setTrim`, so sizes, origins, pivots and hit areas stay those of the full frame. A file is cut only
  // when that saves at least TRIM_MIN of its pixels (the rest stay as they were).
  const TRIM_PAD = 2;
  const TRIM_MIN = 0.1;
  /** The opaque box of a canvas (alpha > 0) with TRIM_PAD around it, or null when cutting saves too little. */
  const trimBox = (c) => {
    const { width: w, height: h } = c;
    const d = c.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, w, h).data;
    let x0 = w, y0 = h, x1 = -1, y1 = -1;
    for (let y = 0; y < h; y++) {
      const row = y * w * 4;
      for (let x = 0; x < w; x++) {
        if (!d[row + x * 4 + 3]) continue;
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
    }
    if (x1 < 0) return null; // nothing drawn: keep it as it is
    x0 = Math.max(0, x0 - TRIM_PAD); y0 = Math.max(0, y0 - TRIM_PAD);
    x1 = Math.min(w - 1, x1 + TRIM_PAD); y1 = Math.min(h - 1, y1 + TRIM_PAD);
    const t = { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 };
    return t.w * t.h <= (1 - TRIM_MIN) * w * h ? t : null;
  };
  const crop = (c, t) => {
    const o = document.createElement('canvas');
    o.width = t.w; o.height = t.h;
    o.getContext('2d').drawImage(c, -t.x, -t.y);
    return o;
  };

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

  window.__rasterize = rasterize;

  const list = async () => (await fetch('/__bake/list')).json();

  /**
   * Bakes every SVG (or the keys in `only`). `opts.trimOnly`: bake only the ones whose transparent margin is worth
   * cutting and that are not cut yet (the premium round's one-off pass; every other file stays byte for byte).
   */
  window.__bakeWebp = async (only, opts = {}) => {
    const out = [];
    for (const { key, sha1, w, h, trim: had } of await list()) {
      if (only && !only.includes(key)) continue;
      if (opts.trimOnly && had) continue;
      const full = await rasterize(key, w, h);
      const t = trimBox(full);
      if (opts.trimOnly && !t) continue;
      const c = t ? crop(full, t) : full;
      const encode = (q) => new Promise((r) => c.toBlob(r, 'image/webp', q));
      let blob = await encode(1); // quality 1 = lossless in Chrome
      // A cut file is judged as the whole frame would be (the same choices as before cutting): its tier by the full
      // frame's lossless size, its pixel difference spread over the full frame (the cut-off margin differs by 0).
      const tier = t ? (await new Promise((r) => full.toBlob(r, 'image/webp', 1))).size : blob.size;
      const share = t ? (t.w * t.h) / (full.width * full.height) : 1;
      const meanOf = async (b) => (await __diffBlob(c, b)).mean * share;
      if (tier > LOSSLESS_MAX) {
        let lossy = await encode(tier > BIG ? QUALITY : QUALITY_MID);
        if (tier > BIG && (await meanOf(lossy)) > MAX_MEAN) lossy = await encode(QUALITY_MID);
        if (lossy.size < blob.size && (await meanOf(lossy)) <= MAX_MEAN) blob = lossy;
      }
      const q = new URLSearchParams({ key, sha1, w: String(full.width), h: String(full.height) });
      if (t) for (const k of ['x', 'y', 'w', 'h']) q.set('t' + k, String(t[k]));
      const res = await fetch(`/__bake/put?${q}`, { method: 'POST', body: blob });
      out.push(`${key} ${full.width}x${full.height}${t ? ` cut ${t.w}x${t.h}@${t.x},${t.y}` : ''} ${Math.round(blob.size / 1024)}KB ${res.ok ? '' : 'FAILED'}`);
    }
    return out;
  };

  const pixels = (c) => c.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, c.width, c.height).data;

  /** Mean and 99th percentile of the pixel difference (0-255) between a canvas and an image of the same size: colour
   * compared premultiplied by alpha (fully transparent pixels have no meaningful colour). */
  const diff = (a, img) => {
    const b = document.createElement('canvas');
    b.width = a.width; b.height = a.height;
    b.getContext('2d').drawImage(img, 0, 0);
    const pa = pixels(a), pb = pixels(b);
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
    return { mean: +(sum / n).toFixed(2), p99 };
  };
  const loadImg = (src) => new Promise((ok, bad) => { const img = new Image(); img.onload = () => ok(img); img.onerror = bad; img.src = src; });
  /** A canvas against a WebP blob (the bake's own check, before writing it). */
  window.__diffBlob = async (c, blob) => {
    const url = URL.createObjectURL(blob);
    try { return diff(c, await loadImg(url)); } finally { URL.revokeObjectURL(url); }
  };

  /**
   * Pixel difference between each SVG (rasterized now) and its committed WebP: mean and 99th percentile, 0-255. A cut
   * WebP is put back at its place in the full frame first, so the whole frame is compared (what was cut off must be
   * transparent in the SVG too).
   */
  window.__compareWebp = async (only) => {
    const out = {};
    for (const { key, w, h, trim } of await list()) {
      if (only && !only.includes(key)) continue;
      const a = await rasterize(key, w, h);
      let img = await loadImg(`assets/images/webp/${key}.webp?${Date.now()}`);
      if (trim) {
        if (img.naturalWidth !== trim.w || img.naturalHeight !== trim.h) { out[key] = 'SIZE MISMATCH (cut)'; continue; }
        const f = document.createElement('canvas');
        f.width = a.width; f.height = a.height;
        f.getContext('2d').drawImage(img, trim.x, trim.y);
        img = f;
      } else if (img.naturalWidth !== a.width || img.naturalHeight !== a.height) { out[key] = 'SIZE MISMATCH'; continue; }
      out[key] = diff(a, img);
    }
    return out;
  };
})();
