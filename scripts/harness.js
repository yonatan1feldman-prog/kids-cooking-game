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
