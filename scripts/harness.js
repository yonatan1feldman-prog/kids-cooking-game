// Test harness for the hidden automated Chrome (dev server only). See AGENTS.md, "Handoff notes".
// Load it into the page right after navigation:
//   eval(await (await fetch('scripts/harness.js')).text()); await __setup(640, 288);
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
    // Keep stepping until Boot has loaded the art: never restart scenes mid-load.
    // (Boot starts Title once everything is loaded; while loading, Boot doesn't count as active.)
    for (let i = 0; i < 100 && !['Title', 'Home', 'Recipe'].some((k) => game.scene.isActive(k)); i++) {
      await __run(100);
      await new Promise((r) => setTimeout(r, 50));
    }
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
  // Every message releases every waiter, and a timer backs it up, so a lost message can't stall a loop.
  ch.port1.onmessage = () => q.splice(0).forEach((r) => r());
  window.__yield = () => new Promise((r) => { q.push(r); ch.port2.postMessage(0); setTimeout(r, 1000); });
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
  /** The current step's type in the recipe ('wash', 'knead', 'roll', ...): knead and crush share a class. */
  window.__type = () => { const sc = __R(); return sc?.step ? sc.recipe.steps.find((s) => s.params === sc.step.params)?.type : undefined; };
})();

// Auto-player: performs one round of the gesture the current step expects.
(() => {
  const D = () => __R().ctx.dish;
  window.__gesture = async () => {
    const st = __R().step, name = __step(), d = D();
    const r = d.R * d.scaleX;
    if (name === 'WashStep') {
      if (st.phase === 'tap') { const b = st.faucet.getBounds(); __tap(b.centerX, b.y + b.height * 0.35); await __run(500); }
      else if (st.phase === 'rub') {
        const y = st.palmL.y - 30, pts = [];
        for (let i = 0; i <= 8; i++) pts.push([i % 2 ? st.palmR.x + 30 : st.palmL.x - 30, y + (i % 2 ? 40 : -20)]);
        await __drag(pts);
      }
    } else if (name === 'PressStep') {
      __tap(st.at.x + (Math.random() - 0.5) * 80, st.at.y - 60 + (Math.random() - 0.5) * 60); await __run(250);
    } else if (name === 'StirStep') {
      const o = st.bowl.opening(), pts = [];
      for (let i = 0; i <= 12; i++) { const a = (i / 12) * Math.PI * 2; pts.push([o.x + Math.cos(a) * o.rx * 0.6, o.y + Math.sin(a) * o.ry * 0.6]); }
      await __drag(pts);
    } else if (name === 'GrateStep') {
      const f = st.face(), x = (f.x0 + f.x1) / 2, pts = [[st.block.x, st.block.y]];
      for (let i = 0; i < 6; i++) pts.push([x, i % 2 ? f.y0 + 40 : f.y1 - 40]);
      await __drag(pts);
    } else if (name === 'RollStep' || name === 'SpreadStep') {
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
      if (st.phase === 'toOven') { await __drag([[d.x, d.y], [st.open.x, st.open.y]]); await __run(5700); }
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
  /** Plays until `name` (a class name like 'RollStep', or a recipe type like 'crush') is the current step. */
  window.__to = async (name, settle = 900) => {
    const here = () => __step() === name || __type() === name;
    for (let guard = 0; guard < 300 && !here(); guard++) {
      const before = __R().step;
      if (before?.finished) { await __run(100); continue; }
      await __gesture();
      if (__R().step !== before) await __run(1800);
    }
    await __run(settle);
    return __type();
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
  // Mom without her arms (the pointing arm reaches over the board by design): body, head, hair layers.
  const momBox = (m) => [1, 2, 3].map((i) => box(m.box.list[i])).reduce((a, b) => ({ x0: Math.min(a.x0, b.x0), y0: Math.min(a.y0, b.y0), x1: Math.max(a.x1, b.x1), y1: Math.max(a.y1, b.y1) }));
  const circ = (x, y, r) => ({ x0: x - r, y0: y - r, x1: x + r, y1: y + r });
  const hitOf = (img) => { const s = img.input?.hitArea; return s ? circ(img.x, img.y, s.radius * img.scaleX) : box(img); };
  window.__audit = () => {
    const sc = __R(), st = sc.step, name = __step(), W = game.scale.width, H = game.scale.height;
    const L = sc.ctx.layout, forbid = { x0: W * 0.04, x1: W * 0.96, y1: H * 0.92 };
    const vis = [], hits = [];
    const home = sc.children.list.find((o) => o.texture?.key === 'btn-home');
    vis.push(['home', box(home)]); hits.push(['home', hitOf(home)]);
    vis.push(['mom', momBox(sc.ctx.mom)]);
    const d = sc.ctx.dish, boardOn = sc.ctx.board.alpha > 0.05, aside = d.scaleX < 0.9;
    if (boardOn) vis.push([aside ? 'pizza-aside' : 'board', box(sc.ctx.board)]);
    // The dish is a touch target only in the middle (aside it waits; hidden it doesn't exist yet).
    const dishSteps = ['RollStep', 'SpreadStep', 'SprinkleStep', 'DecorateStep', 'BakeStep', 'FeedStep'];
    if (boardOn && !aside && dishSteps.includes(name)) hits.push(['dish', circ(d.x, d.y, d.R * d.scaleX)]);
    const clipPalm = (b) => ({ ...b, y1: Math.min(b.y1, forbid.y1) });
    const pad = (b, p) => ({ x0: b.x0 - p, y0: b.y0 - p, x1: b.x1 + p, y1: b.y1 + p });
    const rect = (r) => ({ x0: r.x, y0: r.y, x1: r.right, y1: r.bottom });
    if (name === 'WashStep') {
      vis.push(['sink', box(sc.children.list.find((o) => o.texture?.key === 'sink-basin'))]);
      vis.push(['faucet', box(st.faucet)]); hits.push(['faucet', pad(rect(st.faucet.getBounds()), 30 * L.k)]);
      // The hands run off the bottom by design; their touch area stops at the palm strip (onDown refuses it).
      hits.push(['hands', clipPalm(pad(rect(st.hands.getBounds()), 50 * L.k))]);
    }
    if (name === 'PressStep') {
      const b = st.bowl ? st.bowl.bounds() : st.food.getBounds();
      vis.push([st.bowl ? 'bowl' : 'dough', st.bowl ? rect(b) : box(st.food)]); hits.push([st.bowl ? 'bowl' : 'dough', st.pressArea()]);
    }
    if (name === 'StirStep') {
      vis.push(['bowl', rect(st.bowl.bounds())]);
      const o = st.bowl.opening(); hits.push(['bowl', { x0: o.x - o.rx * 1.8, y0: o.y - o.ry * 1.8, x1: o.x + o.rx * 1.8, y1: o.y + o.ry * 1.8 }]);
    }
    if (name === 'GrateStep') {
      vis.push(['grater', box(st.tool)]); vis.push(['block', box(st.block)]);
      const f = st.face(), p = 90 * L.k; hits.push(['grater', { x0: f.x0 - p, y0: f.y0 - p, x1: f.x1 + p, y1: f.y1 + p }]);
    }
    if (name === 'RollStep') { vis.push(['pin', box(st.pin)]); hits.push(['pin', box(st.pin)]); }
    if (name === 'SpreadStep') { const b = sc.children.list.find((o) => o.texture?.key === 'sauce-bowl'); vis.push(['bowl', box(b)]); }
    if (name === 'SprinkleStep') {
      const src = st.source ?? st.tool; vis.push(['cheese', box(src)]);
      hits.push(['cheese', circ(st.toolRest.x, st.toolRest.y, 225 * L.k)]);
    }
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
    // Drawn together on purpose (the art agent's scenes): the tap stands on the sink's rim.
    const together = new Set(['sink/faucet', 'board/dough', 'grater/block']);
    for (let i = 0; i < vis.length; i++) for (let j = i + 1; j < vis.length; j++) if (ov(vis[i][1], vis[j][1]) && !together.has(`${vis[i][0]}/${vis[j][0]}`)) out.push(`overlap: ${vis[i][0]} / ${vis[j][0]}`);
    const pet = sc.ctx.character;
    const hs = hits.filter(([n]) => n !== 'dish' && !n.startsWith('slice'));
    for (let i = 0; i < hs.length; i++) for (let j = i + 1; j < hs.length; j++) if (ov(hs[i][1], hs[j][1]) && !(hs[i][0].startsWith('bin') && hs[j][0].startsWith('bin'))) out.push(`hit overlap: ${hs[i][0]} / ${hs[j][0]}`);
    const dishHit = hits.find(([n]) => n === 'dish')?.[1];
    if (dishHit) for (const [n, b] of hs) if (n !== 'home' && ov(b, dishHit) && !n.startsWith('pin')) out.push(`hit overlaps dish: ${n}`);
    // Pipa: never over the pizza itself (before feeding), never over Mom's face, never in the no-touch strips.
    if (pet.box.visible) {
      const pb = charBox(pet.box);
      const S = sc.ctx.stage;
      if (pb.x0 < forbid.x0 - 1 || pb.x1 > forbid.x1 + 1 || pb.y1 > forbid.y1 + 1) out.push(`pet in a no-touch strip [${r(pb.x0)},${r(pb.y0)},${r(pb.x1)},${r(pb.y1)}]`);
      const sh = name === 'FeedStep' ? S.feedMomShift : 0;
      if (ov(pb, { ...S.momFace, x0: S.momFace.x0 + sh, x1: S.momFace.x1 + sh })) out.push('pet covers mom face');
      if (name !== 'FeedStep' && boardOn && !aside) {
        // The pizza disc: the nearest point of Pipa's box to its centre must be outside the dough radius.
        const R = d.R * d.scaleX * 0.95, nx = Math.max(pb.x0, Math.min(d.x, pb.x1)), ny = Math.max(pb.y0, Math.min(d.y, pb.y1));
        if (Math.hypot(nx - d.x, ny - d.y) < R) out.push(`pet over pizza by ${r(R - Math.hypot(nx - d.x, ny - d.y))}`);
      }
      if (name !== 'FeedStep') {
        for (const [n, b] of vis) if (n !== 'board' && n !== 'mom' && n !== 'sink' && ov(pb, b)) out.push(`overlap: pet / ${n}`);
      }
      vis.push(['pet', pb]);
    }
    return { step: __type(), W, H, k: +L.k.toFixed(3), charScale: +sc.ctx.stage.charScale.toFixed(3), pet: pet.box.visible, problems: out };
  };
})();

/** Plays a full recipe at container size w x h, auditing every step. */
window.__auditRun = async (w, h) => {
  await __setup(w, h);
  await __start();
  const res = {};
  for (const n of ['wash', 'knead', 'roll', 'crush', 'stir', 'spread', 'grate', 'sprinkle', 'decorate', 'bake', 'feed']) {
    await __to(n, 1200);
    const a = __audit();
    res[n] = a.problems;
    res.info = [a.W, a.k, a.charScale];
  }
  return res;
};

/**
 * Screenshot tour: call in order 'title', 'home', 'roll', 'spread', 'sprinkle', 'decorate', 'bake', 'feed'
 * (take a screenshot after each). Mid-gesture states hold the finger down so the drag is visible.
 */
window.__shotAt = async (w, h, what) => {
  const D = () => __R().ctx.dish;
  if (what === 'title') return __setup(w, h);
  if (what === 'home') {
    const b = game.scene.getScene('Title').children.list.find((o) => o.texture?.key === 'btn-play');
    __tap(b.x, b.y); return __run(1300);
  }
  if (what === 'roll') {
    const c = game.scene.getScene('Home').children.list.find((o) => o.texture?.key === 'card-pizza');
    __tap(c.x, c.y); await __run(1600);
    const d = D(); return __drag([[d.x - 150, d.y - 60], [d.x + 150, d.y - 20], [d.x - 150, d.y + 20]], { hold: true });
  }
  if (what === 'spread') {
    const d = D(); __touch('end', 1, d.x, d.y); await __to('SpreadStep', 1200);
    return __drag([[d.x - 150, d.y - 100], [d.x + 150, d.y - 60], [d.x - 150, d.y], [d.x + 100, d.y + 40]], { hold: true });
  }
  if (what === 'sprinkle') {
    const d = D(); __touch('end', 1, d.x, d.y); await __to('SprinkleStep', 1200);
    for (let i = 0; i < 4; i++) { __tap(d.x - 120 + i * 80, d.y + 40); await __run(150); }
    __touch('start', 1, d.x + 60, d.y - 80); return __run(250);
  }
  if (what === 'decorate') {
    const d = D(); __touch('end', 1, d.x + 60, d.y - 80); await __to('DecorateStep', 1200);
    for (let i = 0; i < 3; i++) await __gesture();
    const b = __R().step.bins[4]; await __drag([[b.x, b.y], [d.x - 120, d.y - 40]], { hold: true }); return __run(100);
  }
  if (what === 'bake') {
    const d = D(); __touch('end', 1, d.x - 120, d.y - 40); await __run(500); await __to('BakeStep', 1200);
    const st = __R().step; await __drag([[d.x, d.y], [st.open.x, st.open.y]]); return __run(2000);
  }
  if (what === 'feed') {
    await __run(2500); await __gesture(); await __to('FeedStep', 1200); await __gesture();
    const st = __R().step, s = st.slices.find((x) => !x.eaten), c = st.sliceCenter(s);
    await __drag([[c.x, c.y], [(c.x + st.mouthAt.x) / 2, st.mouthAt.y - 60]], { hold: true }); return __run(200);
  }
};

// Round 4: demos, Mom's voice, real-time runs.
(() => {
  /** Demos on (the first two runs of a recipe) or off (later runs), by setting the run counter. */
  window.__demos = (on) => localStorage.setItem('cooking.runs.pizza', on ? '0' : '5');
  /** Steps virtual time until Mom's demo (if any) has finished. */
  window.__waitDemo = async () => {
    for (let i = 0; i < 60 && __R().step?.inDemo; i++) await __run(100);
  };
  /**
   * Real-time stepping: like __run, but paced by the real clock, so voice lines (which play in real
   * time on the audio context) and the game's virtual time stay together. Needed to check the voice log.
   */
  window.__real = async (ms) => {
    const end = performance.now() + ms;
    let last = performance.now();
    // A MessageChannel hop, not setTimeout: a hidden tab throttles timers to one per second.
    const hop = () => new Promise((r) => { const c = new MessageChannel(); c.port1.onmessage = () => r(); c.port2.postMessage(0); });
    while (performance.now() < end) {
      const until = performance.now() + 16;
      while (performance.now() < until) await hop();
      const now = performance.now();
      __tick(Math.min(100, now - last));
      last = now;
    }
  };
  /** The voice log: [key, start ms, end ms] relative to the first line, plus problems found (overlaps, repeats). */
  window.__voReport = () => {
    const log = window.__voLog || [];
    const t0 = log[0]?.start ?? 0;
    const rows = log.map((e) => [e.key, Math.round(e.start - t0), e.end === undefined ? null : Math.round(e.end - t0), e.cut ? 'cut' : '']);
    const problems = [];
    for (let i = 1; i < log.length; i++) {
      if (log[i - 1].end === undefined || log[i].start < log[i - 1].end - 1) problems.push(`overlap: ${log[i - 1].key} / ${log[i].key}`);
    }
    const praise = log.filter((e) => e.key.startsWith('vo-praise')).map((e) => e.key);
    for (let i = 1; i < praise.length; i++) if (praise[i] === praise[i - 1]) problems.push(`praise twice in a row: ${praise[i]}`);
    return { rows, problems };
  };
})();

/** Demo tour: 'RollStep' starts a fresh recipe with demos on; later names play on to that step. Stops `ms` into its demo. */
window.__demoAt = async (w, h, stepName, ms = 1100) => {
  if (stepName === 'RollStep') { __demos(true); await __setup(w, h); await __start(); }
  else {
    await __waitDemo();
    // Play the current step; once it is finished, only let time pass (a stray touch would end the next demo).
    for (let g = 0; g < 300 && __step() !== stepName; g++) {
      if (__R().step.finished) await __run(50);
      else await __gesture();
    }
  }
  await __run(ms);
  return { step: __step(), demo: __R().step.inDemo, hand: __R().ctx.hand.active };
};

/** Saves the game canvas as docs/<dir>/<name>.png (dev server only; dir: screenshots-round4 by default). */
window.__saveShot = async (name, dir = 'screenshots-round4') => {
  const img = await new Promise((r) => { game.renderer.snapshot(r); __tick(1); });
  const c = document.createElement('canvas');
  c.width = img.width; c.height = img.height;
  c.getContext('2d').drawImage(img, 0, 0);
  const blob = await new Promise((r) => c.toBlob(r, 'image/png'));
  const res = await fetch(`/__dev/shot?name=${name}&dir=${dir}`, { method: 'POST', body: blob });
  return `${name} ${img.width}x${img.height} ${res.ok ? 'saved' : 'FAILED'}`;
};

/**
 * Screenshot tour with demos, saved as docs/screenshots-round4/<tag>-NN-<what>.png (dev server only):
 * title, home, each step's demo and the child's own gesture, baking, ready, feeding, the finale.
 * Takes ~15-25 s real time: start it without awaiting and read window.__tourRes later.
 */
window.__tour = async (w, h, tag) => {
  const out = [];
  let i = 1;
  const shot = async (n) => out.push(await __saveShot(`${tag}-${String(i++).padStart(2, '0')}-${n}`));
  const until = async (fn, ms = 8000) => { for (let t = 0; t < ms && !fn(); t += 50) await __run(50); };
  __demos(true);
  await __setup(w, h); await __run(600); await shot('title');
  const b = game.scene.getScene('Title').children.list.find((o) => o.texture?.key === 'btn-play');
  __tap(b.x, b.y); await __run(1600); await shot('home');
  const c = game.scene.getScene('Home').children.list.find((o) => o.texture?.key === 'card-pizza');
  __tap(c.x, c.y); await until(() => game.scene.isActive('Recipe') && __R().step); await __run(1000); await shot('roll-demo');
  await __waitDemo(); const d = __R().ctx.dish;
  await __drag([[d.x - 150, d.y - 60], [d.x + 150, d.y - 20], [d.x - 150, d.y + 20]], { hold: true }); await __run(100); await shot('roll-child'); __touch('end', 1, d.x, d.y);
  for (const [n, ms] of [['SpreadStep', 1100], ['SprinkleStep', 900], ['DecorateStep', 1100]]) {
    await __demoAt(w, h, n, ms); await shot(n.replace('Step', '').toLowerCase() + '-demo');
  }
  await __waitDemo(); for (let g = 0; g < 3; g++) await __gesture(); await shot('decorate-child');
  const st0 = __R().step; __tap(st0.done.x, st0.done.y);
  await until(() => __step() === 'BakeStep'); await __run(1300); await shot('bake-demo');
  await __waitDemo(); const st = __R().step;
  await __drag([[__R().ctx.dish.x, __R().ctx.dish.y], [st.open.x, st.open.y]]); await __run(3000); await shot('bake-baking');
  await until(() => st.phase === 'ready'); await __run(600); await shot('bake-ready');
  __tap(st.closed.x, st.closed.y);
  await until(() => __step() === 'FeedStep'); await __run(1500); await shot('feed-demo');
  await __waitDemo(); await __gesture(); const f = __R().step, s = f.slices.find((x) => !x.eaten), sc = f.sliceCenter(s);
  await __drag([[sc.x, sc.y], [(sc.x + f.mouthAt.x) / 2, f.mouthAt.y - 60]], { hold: true }); await __run(200); await shot('feed-child');
  __touch('end', 1, f.mouthAt.x, f.mouthAt.y); await __run(1300);
  for (let g = 0; g < 12 && !f.partyStarted; g++) await __gesture();
  await __run(2200); await shot('finale');
  return out;
};

/**
 * A whole recipe in real time (so Mom's voice and the game share one clock), with or without demos.
 * Needs the audio unlocked by one real click first (see AGENTS.md "Testing notes"). Takes ~50-70 s:
 * start it without awaiting, then read window.__fr. Returns the steps seen, whether it ended at Home,
 * and the voice log of this run (__voReport: rows [key, start, end, cut] + problems: overlaps, praise repeats).
 */
window.__fullRun = async (demos, mode = 'fast') => {
  // mode 'fast': gestures as quick as the harness does them; 'child': a 5-year-old's pace (drags at ~650
  // units/s, ~0.5 s between actions, ~1 s to look before starting a step); 'none': no touch at all (Mom helps).
  const fast = window.__fast || (window.__fast = __run);
  const drag0 = window.__drag0 || (window.__drag0 = __drag);
  window.__run = fast; window.__drag = drag0; __demos(demos); await __setup(900, 405);
  // The automated window is hidden: pretend it is visible so the game doesn't hold the sound.
  try { Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'visible' }); document.dispatchEvent(new Event('visibilitychange')); } catch (e) {}
  window.__run = __real;
  if (mode === 'child') {
    window.__drag = async (pts, opts = {}) => {
      __touch('start', 1, ...pts[0]);
      for (let i = 1; i < pts.length; i++) {
        const [a, b] = pts[i - 1], [c, d] = pts[i], L = Math.hypot(c - a, d - b), n = Math.max(2, Math.ceil(L / 40));
        for (let k = 1; k <= n; k++) { __touch('move', 1, a + ((c - a) * k) / n, b + ((d - b) * k) / n); await __real((L / 650) * 1000 / n); }
      }
      if (!opts.hold) __touch('end', 1, ...pts[pts.length - 1]);
    };
  }
  try {
    const n0 = __voLog.length; const steps = []; const t0 = performance.now(); const at = {};
    const b = game.scene.getScene('Title').children.list.find((o) => o.texture?.key === 'btn-play');
    __tap(b.x, b.y); await __real(mode === 'child' ? 2500 : 1600);
    const c = game.scene.getScene('Home').children.list.find((o) => o.texture?.key === 'card-pizza');
    const tCard = performance.now();
    __tap(c.x, c.y); await __real(1800);
    for (let g = 0; g < 2000 && game.scene.isActive('Recipe'); g++) {
      const s = __type();
      if (steps.at(-1) !== s) { steps.push(s); at[s] = Math.round((performance.now() - tCard) / 1000); await __waitDemo(); await __real(mode === 'child' ? 1000 : 1300); }
      if (!game.scene.isActive('Recipe')) break;
      if (__R().step.finished || mode === 'none') { await __real(100); continue; }
      await __gesture();
      if (mode === 'child') await __real(450);
    }
    await __real(500);
    const logRows = __voLog.slice(n0);
    __voLog.splice(0, n0);
    const rep = __voReport();
    const praise = logRows.filter((e) => e.key.startsWith('vo-praise')).map((e) => e.key);
    return { mode, demos, steps, startedAt: at, recipeSeconds: Math.round((performance.now() - tCard) / 1000), totalSeconds: Math.round((performance.now() - t0) / 1000),
      home: game.scene.isActive('Home'), watchMe: logRows.filter((e) => e.key === 'vo-watch-me').length, yourTurn: logRows.filter((e) => e.key === 'vo-your-turn').length,
      helps: logRows.filter((e) => e.key === 'vo-help').length, praise, firstSevenDistinct: new Set(praise.slice(0, 7)).size === Math.min(7, praise.length), report: rep };
  } finally { window.__run = fast; window.__drag = drag0; }
};

/**
 * Round 5 screenshot tour (dev server only), saved as docs/screenshots-round5a/<tag>-NN-<what>.png:
 * title, home, then for every step Mom's demo (1.1 s in) and the child mid-gesture, and the finale.
 * Start it without awaiting and read window.__tourRes later (it takes ~30-60 s real time).
 */
window.__tour5 = async (w, h, tag) => {
  const out = [];
  let i = 1;
  const shot = async (n) => out.push(await __saveShot(`${tag}-${String(i++).padStart(2, '0')}-${n}`, 'screenshots-round5a'));
  const until = async (fn, ms = 8000) => { for (let t = 0; t < ms && !fn(); t += 50) await __run(50); };
  __demos(true);
  await __setup(w, h); await __run(900); await shot('title');
  const b = game.scene.getScene('Title').children.list.find((o) => o.texture?.key === 'btn-play');
  __tap(b.x, b.y); await __run(1600); await shot('home');
  const c = game.scene.getScene('Home').children.list.find((o) => o.texture?.key === 'card-pizza');
  __tap(c.x, c.y); await until(() => game.scene.isActive('Recipe') && __R().step);
  // Mid-gesture poses for each step (the finger stays down for the picture).
  const child = {
    wash: async (st) => {
      const f = st.faucet.getBounds(); __tap(f.centerX, f.y + f.height * 0.35); await __run(600);
      const y = st.palmL.y - 30; await __drag([[st.palmL.x - 30, y], [st.palmR.x + 30, y + 40], [st.palmL.x - 30, y], [st.palmR.x, y + 20]], { hold: true }); await __run(300);
    },
    knead: async (st) => { for (let k = 0; k < 4; k++) { __tap(st.at.x + 30, st.at.y - 60); await __run(250); } __touch('start', 1, st.at.x - 40, st.at.y - 60); await __run(80); },
    crush: async (st) => { for (let k = 0; k < 4; k++) { __tap(st.at.x + 30, st.at.y - 120); await __run(250); } __touch('start', 1, st.at.x - 60, st.at.y - 130); await __run(80); },
    stir: async (st) => { const o = st.bowl.opening(); await __drag([[o.x - 100, o.y], [o.x, o.y + 40], [o.x + 100, o.y], [o.x, o.y - 30], [o.x - 60, o.y + 10]], { hold: true }); await __run(80); },
    grate: async (st) => { const f = st.face(), x = (f.x0 + f.x1) / 2; await __drag([[st.block.x, st.block.y], [x, f.y0 + 60], [x, f.y1 - 120], [x, f.y0 + 60], [x, f.y0 + 200]], { hold: true }); await __run(120); },
    roll: async () => { const d = __R().ctx.dish; await __drag([[d.x - 150, d.y - 60], [d.x + 150, d.y - 20], [d.x - 150, d.y + 20]], { hold: true }); await __run(100); },
    spread: async () => { const d = __R().ctx.dish; await __drag([[d.x - 150, d.y - 100], [d.x + 150, d.y - 60], [d.x - 150, d.y], [d.x + 100, d.y + 40]], { hold: true }); await __run(100); },
    sprinkle: async () => { const d = __R().ctx.dish; for (let k = 0; k < 4; k++) { __tap(d.x - 120 + k * 80, d.y + 40); await __run(150); } __touch('start', 1, d.x + 60, d.y - 80); await __run(250); },
  };
  for (const type of ['wash', 'knead', 'roll', 'crush', 'stir', 'spread', 'grate', 'sprinkle']) {
    await until(() => __type() === type && !__R().step.finished, 15000);
    // (Mom may first finish her sentence: wait for her hand, then take the picture mid-demo.)
    await until(() => __R().ctx.hand.active, 3000); await __run(800); await shot(`${type}-demo`);
    await __waitDemo(); await __run(200);
    await child[type](__R().step); await shot(`${type}-child`);
    __touch('end', 1, 5, 5);
    for (let g = 0; g < 200 && __type() === type; g++) { if (__R().step.finished) await __run(100); else await __gesture(); }
  }
  await until(() => __type() === 'decorate', 8000); await __run(1100); await shot('decorate-demo');
  await __waitDemo(); for (let g = 0; g < 3; g++) await __gesture(); await shot('decorate-child');
  const st0 = __R().step; __tap(st0.done.x, st0.done.y);
  await until(() => __type() === 'bake'); await __run(1300); await shot('bake-demo');
  await __waitDemo(); const st = __R().step;
  await __drag([[__R().ctx.dish.x, __R().ctx.dish.y], [st.open.x, st.open.y]]); await __run(3000); await shot('bake-baking');
  await until(() => st.phase === 'ready'); await __run(600); await shot('bake-ready');
  __tap(st.closed.x, st.closed.y);
  await until(() => __type() === 'feed'); await __run(1500); await shot('feed-demo');
  await __waitDemo(); await __gesture(); const f = __R().step, s = f.slices.find((x) => !x.eaten), sc = f.sliceCenter(s);
  await __drag([[sc.x, sc.y], [(sc.x + f.mouthAt.x) / 2, f.mouthAt.y - 60]], { hold: true }); await __run(200); await shot('feed-child');
  __touch('end', 1, f.mouthAt.x, f.mouthAt.y); await __run(1300);
  for (let g = 0; g < 12 && !f.partyStarted; g++) await __gesture();
  await __run(2200); await shot('finale');
  return out;
};

// Round 5 part B: the simulated voice clock (lines end after their file's real length on the game clock).
/** Voice test mode on/off: no sound, each line ends after its real length in virtual time (`Voice.simulate`). */
window.__voSim = (on = true) => __voice.simulate(on);
/**
 * vo-your-turn check: demos on, simulated voice, the child does not touch anything after the card.
 * Returns the voice log (key, start, end in virtual ms from the card tap) for the first `ms` of the recipe.
 */
window.__yourTurnTest = async (w = 900, h = 405, ms = 12000) => {
  __demos(true); await __setup(w, h); __voSim(true);
  const b = game.scene.getScene('Title').children.list.find((o) => o.texture?.key === 'btn-play');
  __tap(b.x, b.y); await __run(1300);
  const c = game.scene.getScene('Home').children.list.find((o) => o.texture?.key === 'card-pizza');
  __voLog.length = 0; const t0 = __voice.now();
  __tap(c.x, c.y); await __run(ms);
  return __voLog.map((e) => [e.key, Math.round(e.start - t0), e.end === undefined ? null : Math.round(e.end - t0), e.cut ? 'cut:' + e.cutBy : '']);
};
