// Test harness for the hidden automated Chrome (dev server only). See AGENTS.md, "Handoff notes".
// Load it into the page right after navigation:
//   eval(await (await fetch('/scripts/harness.js')).text()); await __setup(640, 288);
// __setup(w, h) shrinks the game container to w x h CSS px (the screen ratio to emulate),
// installs a virtual clock (Date.now + game.loop.step), and restarts at the Title scene.
// All coordinates for __touch/__drag/__tap are GAME pixels.
(() => {
  window.__setup = async (cw, ch) => {
    const g = document.getElementById('game');
    g.style.width = cw + 'px';
    g.style.height = ch + 'px';
    window.dispatchEvent(new Event('resize'));
    if (window.__T === undefined) {
      window.__T = performance.now();
      const realNow = Date.now.bind(Date);
      window.__off = realNow() - __T;
      Date.now = () => Math.floor(__T + __off);
    }
    await __run(1500);
    window.__S = g.getBoundingClientRect().width / game.scale.width;
    game.scene.getScenes(true).forEach((s) => s.scene.stop());
    await __run(50);
    game.scene.start('Title');
    await __run(900);
    window.__S = game.canvas.getBoundingClientRect().width / game.scale.width;
    return { W: game.scale.width, H: game.scale.height, S: __S };
  };
  // setTimeout is throttled in a hidden tab; a MessageChannel hop is not.
  const ch = new MessageChannel();
  const q = [];
  ch.port1.onmessage = () => q.shift()?.();
  window.__yield = () => new Promise((r) => { q.push(r); ch.port2.postMessage(0); });
  window.__tick = (ms = 16) => {
    __T += ms;
    game.loop.step(__T);
  };
  window.__run = async (ms) => {
    for (let i = 0; i < Math.ceil(ms / 16); i++) {
      __tick(16);
      if (i % 40 == 0) await __yield();
    }
  };
  window.__touch = (type, id, x, y) => {
    const r = game.canvas.getBoundingClientRect();
    const t = { identifier: id, pageX: r.left + x * __S, pageY: r.top + y * __S, clientX: r.left + x * __S, clientY: r.top + y * __S, target: game.canvas };
    const ev = { changedTouches: [t], touches: [t], targetTouches: [t], timeStamp: performance.now(), target: game.canvas, preventDefault() {}, cancelable: true };
    const m = game.input;
    ({ start: () => m.onTouchStart(ev), move: () => m.onTouchMove(ev), end: () => m.onTouchEnd(ev), cancel: () => m.onTouchCancel(ev) })[type]();
    __tick();
  };
  window.__drag = async (pts, opts = {}) => {
    __touch('start', 1, ...pts[0]);
    for (let i = 1; i < pts.length; i++) {
      const [a, b] = pts[i - 1], [c, d] = pts[i];
      for (let k = 1; k <= 6; k++) __touch('move', 1, a + ((c - a) * k) / 6, b + ((d - b) * k) / 6);
    }
    if (!opts.hold) __touch('end', 1, ...pts[pts.length - 1]);
  };
  window.__tap = (x, y) => {
    __touch('start', 1, x, y);
    __touch('end', 1, x, y);
  };
  window.__R = () => game.scene.getScene('Recipe');
  window.__step = () => __R().step?.constructor.name;
})();

// Auto-player: performs one round of the gesture the current step expects.
(() => {
  const D = () => __R().ctx.dish;
  window.__gesture = async () => {
    const st = __R().step, name = __step(), d = D();
    const r = d.R * d.scaleX;
    if (name === 'RollStep' || name === 'SpreadStep') {
      const pts = [];
      for (let i = 0; i <= 8; i++) pts.push([d.x + (i % 2 ? 1 : -1) * r * 0.6, d.y - r * 0.6 + (i * r * 1.2) / 8]);
      await __drag(pts);
    } else if (name === 'SprinkleStep') {
      for (let i = 0; i < 6; i++) { const a = Math.random() * 6.28; __tap(d.x + Math.cos(a) * r * 0.5, d.y + Math.sin(a) * r * 0.5); await __run(120); }
    } else if (name === 'DecorateStep') {
      if ((st.placed ?? 0) >= 4) { __tap(st.done.x, st.done.y); await __run(2600); return; }
      const b = st.bins[(st.placed ?? 0) % st.bins.length];
      const a = (st.placed ?? 0) * 1.7;
      await __drag([[b.x, b.y], [d.x + Math.cos(a) * r * 0.45, d.y + Math.sin(a) * r * 0.45 + 90]]);
    } else if (name === 'BakeStep') {
      if (st.phase === 'toOven') { await __drag([[d.x, d.y], [st.open.x, st.open.y]]); await __run(4200); }
      else if (st.phase === 'ready') { __tap(st.closed.x, st.closed.y); await __run(1400); }
    } else if (name === 'FeedStep') {
      const s = st.slices.find((x) => !x.eaten);
      if (s) { const c = st.sliceCenter(s); await __drag([[c.x, c.y], [st.mouthAt.x, st.mouthAt.y]]); await __run(1250); }
    }
    await __run(300);
  };
  /** Title -> Home -> Recipe. */
  window.__start = async () => {
    const t = game.scene.getScene('Title');
    const btn = t.children.list.find((o) => o.texture?.key === 'btn-play');
    __tap(btn.x, btn.y); await __run(1300);
    const h = game.scene.getScene('Home');
    const card = h.children.list.find((o) => o.texture?.key === 'card-pizza');
    __tap(card.x, card.y); await __run(1600);
  };
  /** Plays until `name` is the current step (and has had `settle` ms to enter). */
  window.__to = async (name, settle = 900) => {
    for (let guard = 0; guard < 200 && __step() !== name; guard++) {
      const before = __step();
      await __gesture();
      if (__step() !== before) await __run(1800);
    }
    await __run(settle);
    return __step();
  };
  /** The canvas region in viewport px, for the screenshot zoom tool. */
  window.__region = () => { const r = game.canvas.getBoundingClientRect(); return [r.left, r.top, r.right, r.bottom].map(Math.round); };
})();

// Layout audit for the current Recipe step: nothing cut off, nothing interactive in the
// no-touch zones (bottom 8%, 4% each side), no two items overlapping. Returns a list of problems.
(() => {
  // Opaque extents of a texture (fractions of its frame), so frames' empty margins don't count as overlap.
  const opq = {};
  const opaque = (key) => {
    if (opq[key]) return opq[key];
    const src = game.textures.get(key).getSourceImage(); const c = document.createElement('canvas'); c.width = src.width; c.height = src.height;
    const x = c.getContext('2d'); x.drawImage(src, 0, 0); const d = x.getImageData(0, 0, c.width, c.height).data;
    let x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1;
    for (let y = 0; y < c.height; y += 2) for (let X = 0; X < c.width; X += 2) if (d[(y * c.width + X) * 4 + 3] > 40) { x0 = Math.min(x0, X); x1 = Math.max(x1, X); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
    return (opq[key] = { x0: x0 / c.width, y0: y0 / c.height, x1: x1 / c.width, y1: y1 / c.height });
  };
  const box = (o) => {
    const b = o.getBounds();
    if (!o.texture || o.angle % 180 !== 0) return { x0: b.x, y0: b.y, x1: b.x + b.width, y1: b.y + b.height };
    const f = opaque(o.texture.key);
    return { x0: b.x + f.x0 * b.width, y0: b.y + f.y0 * b.height, x1: b.x + f.x1 * b.width, y1: b.y + f.y1 * b.height };
  };
  const charBox = (c) => box(c.list[0]); // a child's bounds already include the container
  const circ = (x, y, r) => ({ x0: x - r, y0: y - r, x1: x + r, y1: y + r });
  const hitOf = (img) => { const s = img.input?.hitArea; return s ? circ(img.x, img.y, s.radius * img.scaleX) : box(img); };
  window.__audit = () => {
    const sc = __R(), st = sc.step, name = __step(), W = game.scale.width, H = game.scale.height;
    const L = sc.ctx.layout, forbid = { x0: W * 0.04, x1: W * 0.96, y1: H * 0.92 };
    const vis = [], hits = [];
    const home = sc.children.list.find((o) => o.texture?.key === 'btn-home');
    vis.push(['home', box(home)]); hits.push(['home', hitOf(home)]);
    vis.push(['character', charBox(sc.ctx.character.box)]);
    vis.push(['board', box(sc.ctx.board)]);
    const d = sc.ctx.dish; hits.push(['dish', circ(d.x, d.y, d.R * d.scaleX)]);
    if (name === 'RollStep') { vis.push(['pin', box(st.pin)]); hits.push(['pin', box(st.pin)]); }
    if (name === 'SpreadStep') { const b = sc.children.list.find((o) => o.texture?.key === 'sauce-bowl'); vis.push(['bowl', box(b)]); }
    if (name === 'SprinkleStep') { vis.push(['shaker', box(st.tool)]); hits.push(['shaker', circ(st.tool.x, st.tool.y, 225 * L.k)]); }
    if (name === 'DecorateStep') {
      st.bins.forEach((b, i) => { vis.push(['bin' + i, box(b.bin)]); const r = b.half + 30 * L.k; hits.push(['bin' + i, { x0: b.x - r, y0: b.y - r, x1: b.x + r, y1: b.y + r }]); });
      vis.push(['done', box(st.done)]); hits.push(['done', hitOf(st.done)]);
    }
    if (name === 'BakeStep') { const o = st.phase === 'toOven' || st.phase === 'out' ? st.open : st.closed; vis.push(['oven', box(o)]); hits.push(['oven', box(o)]); }
    if (name === 'FeedStep') st.slices.filter((s) => !s.eaten).forEach((s, i) => { const c = st.sliceCenter(s); hits.push(['slice' + i, circ(c.x, c.y, 60 * L.k)]); });
    const out = [];
    const r = (v) => Math.round(v);
    for (const [n, b] of vis) if (b.x0 < -1 || b.y0 < -1 || b.x1 > W + 1 || b.y1 > H + 1) out.push(`cut: ${n} [${r(b.x0)},${r(b.y0)},${r(b.x1)},${r(b.y1)}]`);
    for (const [n, b] of hits) {
      if (b.x0 < forbid.x0 - 1) out.push(`left zone: ${n} x0=${r(b.x0)} < ${r(forbid.x0)}`);
      if (b.x1 > forbid.x1 + 1) out.push(`right zone: ${n} x1=${r(b.x1)} > ${r(forbid.x1)}`);
      if (b.y1 > forbid.y1 + 1) out.push(`palm zone: ${n} y1=${r(b.y1)} > ${r(forbid.y1)}`);
    }
    const ov = (a, b) => Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0) > 2 && Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0) > 2;
    for (let i = 0; i < vis.length; i++) for (let j = i + 1; j < vis.length; j++) if (ov(vis[i][1], vis[j][1])) out.push(`overlap: ${vis[i][0]} / ${vis[j][0]}`);
    const hs = hits.filter(([n]) => n !== 'dish' && !n.startsWith('slice'));
    for (let i = 0; i < hs.length; i++) for (let j = i + 1; j < hs.length; j++) if (ov(hs[i][1], hs[j][1]) && !(hs[i][0].startsWith('bin') && hs[j][0].startsWith('bin'))) out.push(`hit overlap: ${hs[i][0]} / ${hs[j][0]}`);
    const dishHit = hits.find(([n]) => n === 'dish')[1];
    for (const [n, b] of hs) if (n !== 'home' && ov(b, dishHit) && !n.startsWith('pin')) out.push(`hit overlaps dish: ${n}`);
    return { step: name, W, H, k: +L.k.toFixed(3), charScale: +sc.ctx.stage.charScale.toFixed(3), problems: out };
  };
})();

/** Plays a full recipe at container size w x h, auditing every step. */
window.__auditRun = async (w, h) => {
  await __setup(w, h);
  await __start();
  const res = {};
  for (const n of ['RollStep', 'SpreadStep', 'SprinkleStep', 'DecorateStep', 'BakeStep', 'FeedStep']) {
    await __to(n, 1200);
    const a = __audit();
    res[n] = a.problems;
    res.info = [a.W, a.k, a.charScale];
  }
  return res;
};
