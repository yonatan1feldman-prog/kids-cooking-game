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
  window.__type = () => { const sc = __R(); return sc?.step ? sc.stepDef?.type : undefined; };
})();

// Auto-player: performs one round of the gesture the current step expects.
(() => {
  const D = () => __R().ctx.dish;
  window.__gesture = async () => {
    const st = __R().step, name = __step(), d = D();
    const r = d.R * d.scaleX;
    if (name === 'WashStep') {
      if (st.phase === 'tap') { const b = st.faucet.getBounds(); __tap(b.centerX, b.y + b.height * 0.35); await __run(500); }
      // (PR A, the recipe challenges: the soap before rubbing)
      else if (st.phase === 'rub' && st.soap && !st.soaped) { __tap(st.soap.x, st.soap.y); await __run(900); }
      else if (st.phase === 'rub') {
        const y = st.palmL.y + (st.basket ? 40 : -30), pts = [];
        for (let i = 0; i <= 8; i++) pts.push([i % 2 ? st.palmR.x + 30 : st.palmL.x - 30, y + (i % 2 ? 40 : -20)]);
        await __drag(pts);
      }
    } else if (name === 'PressStep') {
      __tap(st.at.x + (Math.random() - 0.5) * 80, st.at.y - 60 + (Math.random() - 0.5) * 60); await __run(250);
    } else if (name === 'StirStep') {
      // Round 9 (the soup): the stove's knob first, then the stirring.
      if (st.phase === 'knob') { __tap(st.knob.x, st.knob.y); await __run(900); await __run(300); return; }
      // Gameplay round 4: with arrows, round the way they point (st.dir; window.__stirWrong stirs the other way).
      const o = st.bowl.opening(), pts = [], dir = (st.dir ?? 1) * (window.__stirWrong ? -1 : 1);
      for (let i = 0; i <= 12; i++) { const a = dir * (i / 12) * Math.PI * 2; pts.push([o.x + Math.cos(a) * o.rx * 0.6, o.y + Math.sin(a) * o.ry * 0.6]); }
      await __drag(pts);
    } else if (name === 'GrateStep') {
      const f = st.face(), x = (f.x0 + f.x1) / 2, pts = [[st.block.x, st.block.y]];
      for (let i = 0; i < 6; i++) pts.push([x, i % 2 ? f.y0 + 40 : f.y1 - 40]);
      await __drag(pts);
    } else if (name === 'RollStep' || name === 'SpreadStep') {
      const pts = [];
      for (let i = 0; i <= 8; i++) pts.push([d.x + (i % 2 ? 1 : -1) * r * 0.6, d.y - r * 0.6 + (i * r * 1.2) / 8]);
      await __drag(pts);
    } else if (name === 'SprinkleStep' && st.bowl) {
      const o = st.bowl.opening();
      for (let i = 0; i < 3; i++) { __tap(o.x + (i - 1) * o.rx * 0.4, o.y - 40); await __run(250); }
    } else if (name === 'SprinkleStep') {
      for (let i = 0; i < 6; i++) { const a = Math.random() * 6.28; __tap(d.x + Math.cos(a) * r * 0.5, d.y + Math.sin(a) * r * 0.5); await __run(120); }
    } else if (name === 'DecorateStep') {
      // (PR A, hard: Mom's picture first, its things where they are on her card; window.__copyModel = false skips it)
      if (st.model && !st.model.done && window.__copyModel !== false && st.params.onto !== 'cookies') {
        const it = st.modelNext(), w = d.toWorld(it.x * d.R, it.y * d.R);
        await __drag([[it.bin.x, it.bin.y], [w.x, w.y + 90]]); await __run(400); return;
      }
      if (st.model && !st.model.done && window.__copyModel !== false && st.params.onto === 'cookies') {
        const c = st.cookieList[0], n = st.dish.toppings.list.filter((t) => t.getData('on') === 0).length, it = st.model.items[n % st.model.items.length], w = d.toWorld(c.x, c.y);
        await __drag([[it.bin.x, it.bin.y], [w.x, w.y + 90]]); await __run(400); return;
      }
      if ((st.placed ?? 0) >= 4) { __tap(st.done.x, st.done.y); await __run(2600); return; }
      const b = st.bins[(st.placed ?? 0) % st.bins.length];
      const a = (st.placed ?? 0) * 1.7;
      await __drag([[b.x, b.y], [d.x + Math.cos(a) * r * 0.45, d.y + Math.sin(a) * r * 0.45 + 90]]);
    } else if (name === 'BakeStep') {
      if (st.phase === 'toOven') { await __drag([[d.x, d.y], [st.open.x, st.open.y]]); await __run(1500); }
      else if (st.phase === 'temp') {
        const P = st.params.panel, b = st.temp === P.target ? st.btnStart : st.temp > P.target ? st.btnDown : st.btnUp;
        __tap(b.x, b.y); await __run(b === st.btnStart ? 5900 : 450);
      } else if (st.phase === 'mitts') {
        // Gameplay round 2: the mitts are dragged to the oven, then the dish is pulled out onto the board.
        await __drag([[st.mitts.x, st.mitts.y], [(st.mitts.x + st.open.x) / 2, st.mitts.y - 60], [st.open.x, st.open.y]]); await __run(900);
      } else if (st.phase === 'pull') {
        await __drag([[d.x, d.y], [(d.x + st.rest.x) / 2, (d.y + st.rest.y) / 2], [st.rest.x, st.rest.y]]); await __run(1300);
      }
      else if (st.phase === 'ready') { __tap(st.closed.x, st.closed.y); await __run(1400); }
      else await __run(300);
    } else if (name === 'ChooseStep') {
      // Picks in the order of __pickOrder (option ids), else the first free ones.
      // Gameplay round 4: Pipa's order (st.params.order) is followed first, unless window.__pickOrder says otherwise.
      const order = [...(st.params.order ? st.wished.map((w) => w.opt.id) : []), ...(window.__pickOrder || [])];
      const c = order.map((id) => st.choices.find((x) => x.opt.id === id && !x.picked)).find(Boolean) || st.choices.find((x) => !x.picked);
      if (c) { __tap(c.x, c.y); await __run(400); }
    } else if (name === 'ChopStep') {
      // Gameplay round 4: a stroke down along the next cut line, through the vegetable (and up again).
      if (!st.finishing) {
        const l = st.line;
        await __drag([[l.a.x + 8, l.a.y - 30], [l.a.x + 4, (l.a.y + l.b.y) / 2], [l.b.x, l.b.y + 10], [l.a.x, l.a.y - 30]]);
        await __run(250);
      }
    } else if (name === 'CandlesStep') {
      // Round 9: drag each candle onto the cake, then tap every flame out.
      if (st.phase === 'place') {
        const c = st.waiting[0];
        if (c) { const a = st.placed.length * 1.9, rr = d.R * d.scaleX * 0.45; await __drag([[c.x, c.y], [d.x + Math.cos(a) * rr, d.y + Math.sin(a) * rr]]); await __run(500); }
        else await __run(400);
      } else if (st.phase === 'blow') {
        const c = st.placed.find((o) => o.lit && o.flame);
        if (c) { __tap(c.flame.x, c.flame.y); await __run(350); } else await __run(400);
      } else await __run(400);
    } else if (name === 'PeelStep') {
      // Round 9: strokes along the vegetable (any direction), each one takes a strip off.
      const z = st.peelZone(), y = (z.y0 + z.y1) / 2, pts = [];
      for (let i = 0; i <= 6; i++) pts.push([i % 2 ? z.x1 - 60 : z.x0 + 60, y + (i % 2 ? 20 : -20)]);
      await __drag(pts); await __run(300);
    } else if (name === 'OpenPourStep') {
      const b = st.box;
      if (st.phase === 'open') {
        if (st.params.kind === 'can') await __drag([[b.x, b.y - 60], [b.x, b.y - 200]]);
        else { const pts = [[b.x, b.y - b.displayHeight * 0.4]]; for (let i = 0; i < 8; i++) pts.push([b.x + (i % 2 ? 90 : -90), b.y - b.displayHeight * 0.4]); await __drag(pts); }
        await __run(500);
      } else if (st.phase === 'pour') {
        // (PR A, hard: the pour order; window.__pourWrong first tries another one, once per step)
        if (st.expected && window.__pourWrong && !st.__triedWrong) {
          st.__triedWrong = true;
          const o = st.sources.find((x) => !x.done && x !== st.expected);
          if (o) { await __drag([[o.img.x, o.img.y], [o.img.x + 40, o.img.y - 100]]); await __run(800); return; }
        }
        const pp = st.pourPoint(); await __drag([[b.x, b.y], [pp.x, pp.y]], { hold: true }); await __run((st.cur?.pourMs ?? st.params.pourMs) + 400); __touch('end', 1, pp.x, pp.y); await __run(300);
      }
    } else if (name === 'ShareStep') {
      // Gameplay round 2: first she cuts (a stroke across the dish, anywhere), then shares.
      // Gameplay round 4: the stroke must go along the dotted line, from the knife's end (st.line; window.__cutWrong: backwards).
      if (st.cutting) {
        const l = st.line;
        if (!l) { await __run(300); return; }
        const [p, q] = window.__cutWrong ? [l.b, l.a] : [l.a, l.b];
        await __drag([[p.x, p.y], [(p.x * 2 + q.x) / 3, (p.y * 2 + q.y) / 3], [(p.x + q.x * 2) / 3, (p.y + q.y * 2) / 3], [q.x, q.y]]); await __run(450);
        return;
      }
      // The guests round: first a tap on a guest's badge (window.__guest: 'turtle' | 'giraffe' | 'penguin', default the
      // middle one), then she arrives. Then alternates Mom, Pipa and the guest (window.__shareTo: 'mom' | 'pet' | 'guest' | 'alt').
      if (st.picking) {
        const c = st.cards.find((x) => x.g.id === window.__guest) ?? st.cards[1];
        if (c) { __tap(c.img.x, c.img.y); await __run(2600); } else await __run(300);
        return;
      }
      const s = st.slices.find((x) => !x.eaten);
      if (s) {
        const mode = window.__shareTo || 'alt', n = st.slices.filter((x) => x.eaten).length;
        let who = mode === 'alt' ? (st.guestIn ? ['guest', 'mom', 'pet'][n % 3] : n % 2 ? 'pet' : 'mom') : mode;
        // Gameplay round 3: everyone eats. A piece for one who has eaten while the rest are needed for the hungry is
        // tried once per piece (it comes back, window.__redirects counts it), then it goes to one who has not eaten.
        if (mode === 'guest' && !st.guestIn) { await __run(500); return; }
        if (!st.mayHave(who, s)) {
          if (st.__tried !== s) { st.__tried = s; window.__redirects = (window.__redirects || 0) + 1; }
          else {
            const h = st.hungry.filter((w) => w !== 'guest' || st.guestIn);
            if (!h.length) { await __run(500); return; }
            who = h[0];
          }
        }
        const c = st.sliceCenter(s), m = st.targetOf(who);
        await __drag([[c.x, c.y], [(c.x + m.x) / 2, (c.y + m.y) / 2 - 40], [m.x, m.y]]); await __run(1250);
      }
    } else if (name === 'CuttersStep') {
      // A different cutter for each cookie (as a child might), then a tap on the dough near the next free slot.
      const n = st.filled.filter(Boolean).length;
      if (n < st.filled.length && !st.finishing) {
        const c = st.cutters[n % st.cutters.length];
        if (st.picked !== c) { __tap(c.x, c.y); await __run(300); }
        const s = st.slotAt(st.filled.indexOf(false)); __tap(s.x + 20, s.y + 10); await __run(700);
      }
    } else if (name === 'BlendStep') {
      // Round 8: a tap on the lid, then the button held a while (a child may also tap: see __blendTaps).
      if (st.phase === 'lid') { __tap(st.lid.x, st.lid.y); await __run(900); }
      else if (st.phase === 'blend') {
        const b = st.button;
        if (window.__blendTaps) { __tap(b.x, b.y); await __run(250); }
        else { __touch('start', 1, b.x, b.y); await __run(1500); __touch('end', 1, b.x, b.y); await __run(200); }
      }
    } else if (name === 'FlipStep') {
      // Round 8: the knob, then per pancake: the ladle held over the pan, the wait for the bubbles, a swipe up.
      if (st.phase === 'knob') { __tap(st.knob.x, st.knob.y); await __run(700); }
      else if (st.phase === 'ladle') { const hp = st.holdPoint(); await __drag([[st.ladle.x, st.ladle.y], [hp.x, hp.y]], { hold: true }); await __run(st.params.pourMs + 300); __touch('end', 1, hp.x, hp.y); await __run(300); }
      else if (st.phase === 'flip') { const a = st.at; await __drag([[a.x, a.y + 60], [a.x + 10, a.y - 120]]); await __run(1800); }
      else await __run(300);
    } else if (name === 'ThreadStep') {
      // Round 11: taps on the bins. window.__threadMode: 'pattern' (what the pattern needs, the default), 'first' (always
      // the first bin: a skewer of one fruit), 'drag' (the pattern's fruit dragged onto the stick instead of a tap).
      if (st.busy || !st.row || st.reserved >= st.params.pieces) { await __run(300); return; }
      const mode = window.__threadMode || 'pattern', b = mode === 'first' ? st.bins[0] : st.expectedBin();
      if (mode === 'drag') await __drag([[b.x, b.y], [(b.x + st.slotX(2)) / 2, st.row.y - 120], [st.slotX(2), st.row.y + 30]]);
      else __tap(b.x, b.y);
      await __run(700);
    } else if (name === 'FindStep') {
      // Gameplay round 4: tap the right tool (window.__findWrong: first a wrong one).
      if (st.done) { await __run(300); return; }
      const t = window.__findWrong && !st.__triedWrong ? st.tools.find((x) => !x.right) : st.tools.find((x) => x.right);
      st.__triedWrong = true;
      __tap(t.x, t.itemY); await __run(600);
    } else if (name === 'PhotoStep') {
      await __run(500);
    } else if (name === 'FeedStep') {
      const s = st.slices.find((x) => !x.eaten);
      if (s) { const c = st.sliceCenter(s); await __drag([[c.x, c.y], [st.mouthAt.x, st.mouthAt.y]]); await __run(1250); }
    }
    await __run(300);
  };
  /** Title -> Home -> Recipe. */
  window.__start = async () => {
    const t = game.scene.getScene('Title');
    // (since the clinic's title, the kitchen is a card: 'world-card-kitchen')
    const btn = t.children.list.find((o) => ['btn-play', 'btn-world-kitchen', 'world-card-kitchen'].includes(o.texture?.key));
    if (btn) { __tap(btn.x, btn.y); await __run(1300); }
    if (!game.scene.isActive('Home')) { game.scene.getScenes(true).forEach((s) => s.scene.stop()); game.scene.start('Home'); await __run(1300); }
    const h = game.scene.getScene('Home');
    const card = h.children.list.find((o) => o.texture?.key === `card-${window.__recipe || 'pizza'}`);
    __tap(card.x, card.y); await __run(1600);
    await __waitRecipe();
  };
  /** Round 8: a recipe's own art loads on the card tap, in real time: keep stepping until its scene and first step are up. */
  window.__waitRecipe = async () => {
    for (let i = 0; i < 300 && !(game.scene.isActive('Recipe') && __R().step); i++) { await __run(50); await new Promise((r) => setTimeout(r, 20)); }
  };
  /** Round 8: load timing (title, core, each recipe loaded so far) and how many textures are in memory now. */
  window.__loadStats = () => ({ ...window.__loadTiming, recipe: { ...window.__loadTiming.recipe }, textures: game.textures.getTextureKeys().length,
    sounds: game.cache.audio.getKeys().length });
  /** Round 8: a real background trip in a visible page (document.hidden and visibilityState both faked). */
  window.__setHidden = (on) => {
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => on });
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => (on ? 'hidden' : 'visible') });
    document.dispatchEvent(new Event('visibilitychange'));
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
    if (!o || !o.active) return { x0: 0, y0: 0, x1: 0, y1: 0 };
    const b = o.getBounds();
    if (!o.texture || o.angle % 180 !== 0) return { x0: b.x, y0: b.y, x1: b.x + b.width, y1: b.y + b.height };
    const f = opaque(o.texture.key);
    return { x0: b.x + f.x0 * b.width, y0: b.y + f.y0 * b.height, x1: b.x + f.x1 * b.width, y1: b.y + f.y1 * b.height };
  };
  const charBox = (c) => box(c.list[0]); // a child's bounds already include the container
  // Mom without her arms (the pointing arm reaches over the board by design): body, head, hair layers.
  const momBox = (m) => [1, 2, 3].map((i) => box(m.box.list[i])).reduce((a, b) => ({ x0: Math.min(a.x0, b.x0), y0: Math.min(a.y0, b.y0), x1: Math.max(a.x1, b.x1), y1: Math.max(a.y1, b.y1) }));
  const circ = (x, y, r) => ({ x0: x - r, y0: y - r, x1: x + r, y1: y + r });
  const hitOf = (img) => { if (!img || !img.active) return { x0: 0, y0: 0, x1: 0, y1: 0 }; const s = img.input?.hitArea; return s ? circ(img.x, img.y, s.radius * img.scaleX) : box(img); };
  window.__audit = () => {
    const sc = __R(), st = sc.step, name = __step(), W = game.scale.width, H = game.scale.height;
    const L = sc.ctx.layout, forbid = { x0: W * 0.04, x1: W * 0.96, y1: H * 0.92 };
    const vis = [], hits = [];
    const home = sc.children.list.find((o) => o.texture?.key === 'btn-home');
    vis.push(['home', box(home)]); hits.push(['home', hitOf(home)]);
    vis.push(['mom', momBox(sc.ctx.mom)]);
    const d = sc.ctx.dish, boardOn = sc.ctx.board.alpha > 0.05, aside = d.scaleX < 0.9 && name !== 'BakeStep';
    if (boardOn) vis.push([aside ? 'pizza-aside' : 'board', box(sc.ctx.board)]);
    // The dish is a touch target only in the middle (aside it waits; hidden it doesn't exist yet).
    const dishSteps = ['RollStep', 'SpreadStep', 'SprinkleStep', 'DecorateStep', 'BakeStep', 'FeedStep'];
    // (ShareStep: its slices are the targets, checked below; the photo has no touch at all)
    if (boardOn && !aside && dishSteps.includes(name) && !(name === 'BakeStep' && st.phase !== 'toOven')) hits.push(['dish', circ(d.x, d.y, d.R * d.scaleX)]);
    const clipPalm = (b) => ({ ...b, y1: Math.min(b.y1, forbid.y1) });
    const pad = (b, p) => ({ x0: b.x0 - p, y0: b.y0 - p, x1: b.x1 + p, y1: b.y1 + p });
    const rect = (r) => ({ x0: r.x, y0: r.y, x1: r.right, y1: r.bottom });
    if (name === 'WashStep') {
      vis.push(['sink', box(sc.children.list.find((o) => o.texture?.key === 'sink-basin'))]);
      vis.push(['faucet', box(st.faucet)]); hits.push(['faucet', pad(rect(st.faucet.getBounds()), 30 * L.k)]);
      // The hands run off the bottom by design; their touch area stops at the palm strip (onDown refuses it).
      const ha = st.handsArea();
      hits.push(['hands', clipPalm({ x0: ha.x0, y0: ha.y0, x1: ha.x1, y1: Math.min(ha.y1, 1e5) })]);
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
    if (name === 'BakeStep') {
      const o = st.phase === 'toOven' || st.phase === 'out' ? st.open : st.closed; vis.push(['oven', box(o)]);
      // (its touch area at rest: the ding makes it hop 14 units for a moment)
      const ob = box(o), dy = sc.ctx.stage.oven.y - o.y;
      if (st.phase !== 'temp' && st.phase !== 'baking') hits.push(['oven', { ...ob, y0: ob.y0 + dy, y1: ob.y1 + dy }]);
      if (st.phase === 'temp' && st.panelImg?.active) {
        vis.push(['panel', box(st.panelImg)]);
        for (const [n, b] of [['down', st.btnDown], ['start', st.btnStart], ['up', st.btnUp]]) { vis.push([n, box(b)]); hits.push([n, hitOf(b)]); }
      }
      if (st.phase === 'mitts' && st.mitts) { vis.push(['mitts', box(st.mitts)]); const b = st.mitts.getBounds(), p = 50 * L.k; hits.push(['mitts', { x0: b.x - p, y0: b.y - p, x1: b.right + p, y1: b.bottom + p }]); }
    }
    if (name === 'ChooseStep') {
      const h = sc.ctx.stage.chooseHalf(st.choices.length);
      st.choices.forEach((c, i) => {
        const a = box(c.bin), b = box(c.item);
        vis.push(['choice' + i, { x0: Math.min(a.x0, b.x0), y0: Math.min(a.y0, b.y0), x1: Math.max(a.x1, b.x1), y1: Math.max(a.y1, b.y1) }]);
        hits.push(['choice' + i, { x0: c.x - h, y0: c.y - h, x1: c.x + h, y1: c.y + h }]);
      });
    }
    if (name === 'FindStep') {
      const h = sc.ctx.stage.chooseHalf(st.tools.length);
      st.tools.forEach((c, i) => {
        const a = box(c.bin), b = box(c.item);
        vis.push(['tool' + i, { x0: Math.min(a.x0, b.x0), y0: Math.min(a.y0, b.y0), x1: Math.max(a.x1, b.x1), y1: Math.max(a.y1, b.y1) }]);
        hits.push(['tool' + i, { x0: c.x - h, y0: c.y - h, x1: c.x + h, y1: c.y + h }]);
      });
    }
    if (name === 'ChopStep') {
      vis.push(['cutboard', box(st.board)]); vis.push(['knife', box(st.knife)]);
      const z = st.cutZone(); hits.push(['veg', z]);
      // (the bins waiting in the left column; the one filling on the board and one sliding off to the left are by design)
      sc.children.list.filter((o) => o.texture?.key === 'topping-bin' && o.visible && o.alpha > 0.5 && o.x > 0 && !st.finishing).forEach((o, i) => vis.push(['bin' + i, box(o)]));
    }
    if (name === 'OpenPourStep') {
      vis.push(['box', box(st.box)]);
      const bw = [st.back, st.front].map(box); vis.push(['bowl', { x0: Math.min(bw[0].x0, bw[1].x0), y0: Math.min(bw[0].y0, bw[1].y0), x1: Math.max(bw[0].x1, bw[1].x1), y1: Math.max(bw[0].y1, bw[1].y1) }]);
      if (st.lid) vis.push(['lid', box(st.lid)]);
      const b = st.box.getBounds(), p = 45 * L.k; hits.push(['box', { x0: b.x - p, y0: b.y - p, x1: b.right + p, y1: b.bottom + p }]);
    }
    if (name === 'ThreadStep') st.bins.forEach((b, i) => { vis.push(['bin' + i, box(b.bin)]); const r = b.half + 30 * L.k; hits.push(['bin' + i, { x0: b.x - r, y0: b.y - r, x1: b.x + r, y1: b.y + r }]); });
    if (name === 'ShareStep') st.slices.filter((s) => !s.eaten).forEach((s, i) => { const c = st.sliceCenter(s); hits.push(['slice' + i, circ(c.x, c.y, 60 * L.k)]); });
    if (name === 'PhotoStep' && st.frame) vis.push(['photo', box(st.frame)]);
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
    const together = new Set(['sink/faucet', 'board/dough', 'grater/block', 'cutboard/knife', 'box/bowl', 'board/mitts']);
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
      const sh = name === 'FeedStep' || name === 'ShareStep' || (name === 'PhotoStep' && !S.pet) ? S.feedMomShift : 0;
      if (ov(pb, { ...S.momFace, x0: S.momFace.x0 + sh, x1: S.momFace.x1 + sh })) out.push('pet covers mom face');
      if (!['FeedStep', 'ShareStep', 'PhotoStep'].includes(name) && boardOn && !aside) {
        // The pizza disc: the nearest point of Pipa's box to its centre must be outside the dough radius.
        const R = d.R * d.scaleX * 0.95, nx = Math.max(pb.x0, Math.min(d.x, pb.x1)), ny = Math.max(pb.y0, Math.min(d.y, pb.y1));
        if (Math.hypot(nx - d.x, ny - d.y) < R) out.push(`pet over pizza by ${r(R - Math.hypot(nx - d.x, ny - d.y))}`);
      }
      if (name !== 'FeedStep' && name !== 'ShareStep') {
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
    const b = game.scene.getScene('Title').children.list.find((o) => (o.texture?.key === 'btn-play' || o.texture?.key === 'btn-world-kitchen'));
    __tap(b.x, b.y); return __run(1300);
  }
  if (what === 'roll') {
    const c = game.scene.getScene('Home').children.list.find((o) => o.texture?.key === 'card-pizza');
    __tap(c.x, c.y); await __run(1600); await __waitRecipe();
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
  window.__demos = (on) => localStorage.setItem(`cooking.runs.${window.__recipe || 'pizza'}`, on ? '0' : '5');
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
  const b = game.scene.getScene('Title').children.list.find((o) => (o.texture?.key === 'btn-play' || o.texture?.key === 'btn-world-kitchen'));
  __tap(b.x, b.y); await __run(1600); await shot('home');
  const c = game.scene.getScene('Home').children.list.find((o) => o.texture?.key === 'card-pizza');
  __tap(c.x, c.y); await __waitRecipe(); await until(() => game.scene.isActive('Recipe') && __R().step); await __run(1000); await shot('roll-demo');
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
    const b = game.scene.getScene('Title').children.list.find((o) => (o.texture?.key === 'btn-play' || o.texture?.key === 'btn-world-kitchen'));
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
  const b = game.scene.getScene('Title').children.list.find((o) => (o.texture?.key === 'btn-play' || o.texture?.key === 'btn-world-kitchen'));
  __tap(b.x, b.y); await __run(1600); await shot('home');
  const c = game.scene.getScene('Home').children.list.find((o) => o.texture?.key === 'card-pizza');
  __tap(c.x, c.y); await __waitRecipe(); await until(() => game.scene.isActive('Recipe') && __R().step);
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
  const b = game.scene.getScene('Title').children.list.find((o) => (o.texture?.key === 'btn-play' || o.texture?.key === 'btn-world-kitchen'));
  __tap(b.x, b.y); await __run(1300);
  const c = game.scene.getScene('Home').children.list.find((o) => o.texture?.key === 'card-pizza');
  __voLog.length = 0; const t0 = __voice.now();
  __tap(c.x, c.y); await __run(ms);
  return __voLog.map((e) => [e.key, Math.round(e.start - t0), e.end === undefined ? null : Math.round(e.end - t0), e.cut ? 'cut:' + e.cutBy : '']);
};

/**
 * Voice-log problems: overlaps, and any cut except the allowed one (a count-* or temp-* line cut by the next line of
 * its own group). Cuts by 'stop' (rotate screen, background, home) are listed separately, as they are expected there.
 */
window.__voCheck = (log) => {
  const problems = [], stops = [];
  for (let i = 1; i < log.length; i++) if (log[i - 1].end === undefined || log[i].start < log[i - 1].end - 1) problems.push(`overlap: ${log[i - 1].key} / ${log[i].key}`);
  for (const e of log) {
    if (!e.cut) continue;
    if (e.cutBy === 'stop') stops.push(e.key);
    else if (!(e.group && e.cutBy.startsWith(e.group + '-'))) problems.push(`cut: ${e.key} by ${e.cutBy}`);
  }
  const praise = log.filter((e) => e.key.startsWith('vo-praise')).map((e) => e.key);
  for (let i = 1; i < praise.length; i++) if (praise[i] === praise[i - 1]) problems.push(`praise twice in a row: ${praise[i]}`);
  return { problems, stops };
};

/**
 * Round 5b full run on the virtual clock with the simulated voice (every line lasts exactly its file's length), so the
 * timing is what a real child at that pace would get, without waiting in real time.
 * mode 'child': drags at 650 units/s, ~0.45 s between actions, ~1 s to look at each new step (after Mom's demo);
 * 'fast': the harness's own pace; 'none': no touch at all after the card (Mom helps with everything).
 * picks: option ids for the choose step, in order. Returns the steps with their start times (s from the card tap),
 * the recipe's length, the voice log (key, start s, end s, cut) and its problems.
 * Takes about 20-60 s of real time: start it without awaiting and read window.__fr5.
 */
window.__fullRun5 = async (demos, mode = 'child', picks = ['tomato', 'corn', 'olive'], w = 900, h = 405) => {
  const drag0 = window.__drag0 || (window.__drag0 = __drag);
  // (the virtual clock runs far ahead of real time: wait until every voice file is decoded, or early lines are skipped)
  for (let i = 0; i < 60 && !__voice.allLoaded; i++) await new Promise((r) => setTimeout(r, 250));
  __demos(demos); await __setup(w, h); __voSim(true);
  window.__pickOrder = picks; window.__shareTo = 'alt';
  if (mode === 'child') {
    window.__drag = async (pts, opts = {}) => {
      __touch('start', 1, ...pts[0]);
      for (let i = 1; i < pts.length; i++) {
        const [a, b] = pts[i - 1], [c, d] = pts[i], L = Math.hypot(c - a, d - b), n = Math.max(2, Math.ceil(L / 40));
        for (let k = 1; k <= n; k++) { __touch('move', 1, a + ((c - a) * k) / n, b + ((d - b) * k) / n); await __run((L / 650) * 1000 / n); }
      }
      if (!opts.hold) __touch('end', 1, ...pts[pts.length - 1]);
    };
  }
  const T = () => game.loop.time;
  try {
    const b = game.scene.getScene('Title').children.list.find((o) => (o.texture?.key === 'btn-play' || o.texture?.key === 'btn-world-kitchen'));
    __tap(b.x, b.y); await __run(mode === 'child' ? 2500 : 1600);
    const c = game.scene.getScene('Home').children.list.find((o) => o.texture?.key === `card-${window.__recipe || 'pizza'}`);
    const n0 = __voLog.length; const t0 = T(); const steps = []; const at = {};
    __tap(c.x, c.y); await __run(1800); await __waitRecipe();
    for (let g = 0; g < 12000 && game.scene.isActive('Recipe'); g++) {
      const s = __type(); const st = __R().step;
      if (s === 'share') window.__fed = { ...st.fed };
      if (st && st !== window.__lastStep) {
        window.__lastStep = st; steps.push(s); at[steps.length - 1 + ':' + s] = +((T() - t0) / 1000).toFixed(1);
        await __waitDemo(); await __run(mode === 'child' ? 1000 : 300);
      }
      if (!game.scene.isActive('Recipe')) break;
      if (__R().step.finished || mode === 'none' || __type() === 'photo') { await __run(100); continue; }
      await __gesture();
      if (mode === 'child') await __run(450);
    }
    await __run(500);
    const log = __voLog.slice(n0);
    const rows = log.map((e) => [e.key, +((e.start - t0) / 1000).toFixed(2), e.end === undefined ? null : +((e.end - t0) / 1000).toFixed(2), e.cut ? 'cut:' + e.cutBy : '']);
    const count = (k) => log.filter((e) => e.key === k).length;
    return { mode, demos, picks, steps: at, recipeSeconds: +((T() - t0) / 1000).toFixed(1), home: game.scene.isActive('Home'),
      watchMe: count('vo-watch-me'), yourTurn: count('vo-your-turn'), cutCareful: count('vo-cut-careful'), helps: count('vo-help'),
      check: __voCheck(log), rows };
  } finally { window.__drag = drag0; }
};

/**
 * Round 5b layout audit: a whole recipe at container size w x h with the given picks, auditing every step when it has
 * settled and again after every gesture (so the phases inside a step are covered: open / pour, the panel, the mitts...).
 * Returns { steps: { 'N:type': [problems...] } } with each distinct problem once. Start without awaiting; read __ar5.
 */
window.__auditRun5 = async (w, h, picks) => {
  for (let i = 0; i < 60 && !__voice.allLoaded; i++) await new Promise((r) => setTimeout(r, 250));
  __demos(false); await __setup(w, h); __voSim(true);
  window.__pickOrder = picks; window.__shareTo = 'alt';
  await __start();
  const res = {}; let last = null, n = -1;
  const add = (key) => { if (!game.scene.isActive('Recipe') || (__R().step?.finished && __type() !== 'photo')) return; for (const p of __audit().problems) if (!res[key].includes(p)) res[key].push(p); };
  for (let g = 0; g < 3000 && game.scene.isActive('Recipe'); g++) {
    const st = __R().step;
    if (st !== last) { last = st; n++; res[n + ':' + __type()] = []; await __run(1200); }
    const key = n + ':' + __type();
    if (!res[key]) res[key] = [];
    add(key);
    if (st.finished || __type() === 'photo') { await __run(300); if (__type() === 'photo') add(key); continue; }
    await __gesture();
  }
  return { W: game.scale.width, picks, steps: res };
};

/**
 * Round 5b robustness: in the middle of each new step type (and mid-gesture where there is one), turn the device to
 * portrait (or send the app to the background with a lost touch), check that the gesture is dropped gently, the
 * progress is kept and the idle clock is frozen, come back, and check the step still finishes.
 * how: 'rotate' | 'background'. Returns one row per moment. Start without awaiting; read window.__rb5.
 */
window.__robust5 = async (how = 'rotate', w = 900, h = 405) => {
  for (let i = 0; i < 60 && !__voice.allLoaded; i++) await new Promise((r) => setTimeout(r, 250));
  __demos(false); await __setup(w, h); __voSim(true);
  window.__pickOrder = ['tomato', 'corn', 'olive']; window.__shareTo = 'alt';
  const g = document.getElementById('game');
  const away = async () => {
    if (how === 'rotate') {
      g.style.width = h + 'px'; g.style.height = w + 'px'; window.dispatchEvent(new Event('resize')); await __yield(); __tick(16);
      // (the finger lifts while the rotate screen covers the game)
      __touch('end', 1, 10, 10);
    } else {
      // The app goes to the background: the finger's touch is lost, the page is hidden (the browser stops the loop).
      __touch('cancel', 1, 10, 10);
      Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' }); document.dispatchEvent(new Event('visibilitychange'));
    }
  };
  const back = async () => {
    if (how === 'rotate') { g.style.width = w + 'px'; g.style.height = h + 'px'; window.dispatchEvent(new Event('resize')); await __yield(); __tick(16); }
    else { Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'visible' }); document.dispatchEvent(new Event('visibilitychange')); }
  };
  const rows = [];
  const moment = async (name, setup, progress, held) => {
    await setup();
    const st = __R().step, p0 = progress(st), idle0 = st.idleMs;
    await away();
    // Portrait: the scene is paused, so stepping time must change nothing. Background: the browser stops the loop.
    if (how === 'rotate') await __run(4000);
    const row = { name, paused: __R().scene.isPaused(), rotateShown: getComputedStyle(document.getElementById('rotate')).display !== 'none',
      held: held(st), progressKept: JSON.stringify(progress(st)) === JSON.stringify(p0), idleFrozen: st.idleMs === idle0, voice: __voice.current };
    await back(); await __run(600);
    row.resumed = !__R().scene.isPaused();
    const type = __type();
    for (let k = 0; k < 400 && __type() === type && game.scene.isActive('Recipe'); k++) { if (__R().step.finished || type === 'photo') await __run(200); else await __gesture(); }
    row.finished = __type() !== type || !game.scene.isActive('Recipe');
    rows.push(row);
  };
  await __start();
  await __to('choose', 1300);
  await moment('choose (1 picked)', async () => { await __gesture(); }, (st) => st.picks.length, () => false);
  await __to('chop', 1300);
  await moment('chop (knife held mid-stroke)', async () => { await __gesture(); const st = __R().step, z = st.cutZone(); await __drag([[st.knife.x, z.y0 + 60], [st.knife.x, (z.y0 + z.y1) / 2]], { hold: true }); }, (st) => st.cutsDone, (st) => st.held);
  await __to('open-pour', 1300);
  await moment('open-pour (pouring, held over the bowl)', async () => { await __gesture(); const st = __R().step, pp = st.pourPoint(); await __drag([[st.box.x, st.box.y], [pp.x, pp.y]], { hold: true }); await __run(900); }, (st) => st.phase + ':' + (st.poured > 0), (st) => st.held || st.over);
  await __to('bake', 1300);
  await moment('bake (temperature 150)', async () => { await __gesture(); await __gesture(); await __gesture(); }, (st) => st.phase + ':' + st.temp, () => false);
  await __to('share', 1300);
  await moment('share (slice held mid-drag)', async () => { await __gesture(); const st = __R().step, s = st.slices.find((x) => !x.eaten), c = st.sliceCenter(s); await __drag([[c.x, c.y], [c.x + 200, c.y - 100]], { hold: true }); }, (st) => st.slices.filter((x) => x.eaten).length, (st) => !!st.held);
  await __to('photo', 1500);
  await moment('photo (the finale)', async () => { await __run(1200); }, () => 0, () => false);
  return { how, W: game.scale.width, home: game.scene.isActive('Home'), rows };
};

/**
 * Round 5b screenshot tour, saved as docs/screenshots-round5b/<tag>-NN-<what>.png (dev server only): title, home, then
 * for every step Mom's demo and the child mid-gesture (tomato, corn, olive: a cut, a can and a jar), the oven's panel
 * at 200, the mitts, the take-out, sharing with Mom, the photo finale. Start without awaiting; read window.__tourRes.
 */
window.__tour5b = async (w, h, tag) => {
  for (let i = 0; i < 60 && !__voice.allLoaded; i++) await new Promise((r) => setTimeout(r, 250));
  const out = [];
  let i = 1;
  const shot = async (n) => out.push(await __saveShot(`${tag}-${String(i++).padStart(2, '0')}-${n}`, 'screenshots-round5b'));
  const until = async (fn, ms = 8000) => { for (let t = 0; t < ms && !fn(); t += 50) await __run(50); };
  __demos(true); await __setup(w, h); __voSim(true);
  window.__pickOrder = ['tomato', 'corn', 'olive']; window.__shareTo = 'alt';
  await __run(900); await shot('title');
  const b = game.scene.getScene('Title').children.list.find((o) => (o.texture?.key === 'btn-play' || o.texture?.key === 'btn-world-kitchen'));
  __tap(b.x, b.y); await __run(1600); await shot('home');
  const c = game.scene.getScene('Home').children.list.find((o) => o.texture?.key === 'card-pizza');
  __tap(c.x, c.y); await __waitRecipe(); await until(() => game.scene.isActive('Recipe') && __R().step);
  const D = () => __R().ctx.dish;
  const child = {
    wash: async (st) => { const f = st.faucet.getBounds(); __tap(f.centerX, f.y + f.height * 0.35); await __run(600); const y = st.palmL.y - 30; await __drag([[st.palmL.x - 30, y], [st.palmR.x + 30, y + 40], [st.palmL.x - 30, y], [st.palmR.x, y + 20]], { hold: true }); await __run(300); },
    knead: async (st) => { for (let k = 0; k < 4; k++) { __tap(st.at.x + 30, st.at.y - 60); await __run(250); } __touch('start', 1, st.at.x - 40, st.at.y - 60); await __run(80); },
    crush: async (st) => { for (let k = 0; k < 4; k++) { __tap(st.at.x + 30, st.at.y - 120); await __run(250); } __touch('start', 1, st.at.x - 60, st.at.y - 130); await __run(80); },
    stir: async (st) => { const o = st.bowl.opening(); await __drag([[o.x - 100, o.y], [o.x, o.y + 40], [o.x + 100, o.y], [o.x, o.y - 30], [o.x - 60, o.y + 10]], { hold: true }); await __run(80); },
    grate: async (st) => { const f = st.face(), x = (f.x0 + f.x1) / 2; await __drag([[st.block.x, st.block.y], [x, f.y0 + 60], [x, f.y1 - 120], [x, f.y0 + 60], [x, f.y0 + 200]], { hold: true }); await __run(120); },
    roll: async () => { const d = D(); await __drag([[d.x - 150, d.y - 60], [d.x + 150, d.y - 20], [d.x - 150, d.y + 20]], { hold: true }); await __run(100); },
    spread: async () => { const d = D(); await __drag([[d.x - 150, d.y - 100], [d.x + 150, d.y - 60], [d.x - 150, d.y], [d.x + 100, d.y + 40]], { hold: true }); await __run(100); },
    sprinkle: async () => { const d = D(); for (let k = 0; k < 4; k++) { __tap(d.x - 120 + k * 80, d.y + 40); await __run(150); } __touch('start', 1, d.x + 60, d.y - 80); await __run(250); },
    choose: async () => { await __gesture(); await __gesture(); await __run(300); },
    chop: async (st) => { await __gesture(); await __gesture(); const z = st.cutZone(); await __drag([[st.knife.x, z.y0 + 60], [st.knife.x, (z.y0 + z.y1) / 2 + 30]], { hold: true }); await __run(80); },
    decorate: async () => { for (let k = 0; k < 3; k++) await __gesture(); const st = __R().step, d = D(), bn = st.bins[1]; await __drag([[bn.x, bn.y], [d.x - 120, d.y - 40]], { hold: true }); await __run(100); },
  };
  const seen = new Set();
  for (let guard = 0; guard < 60 && game.scene.isActive('Recipe'); guard++) {
    await until(() => !__R().step?.finished, 15000);
    const st = __R().step, type = __type();
    const n = type + (seen.has(type) ? '-2' : ''); seen.add(type);
    if (type === 'photo') { await until(() => st.frame, 8000); await __run(1400); await shot('photo'); await __run(1600); await shot('photo-stars'); break; }
    await until(() => __R().ctx.hand.active, 3500); await __run(800); await shot(`${n}-demo`);
    await __waitDemo(); await __run(200);
    if (child[type]) { await child[type](st); await shot(`${n}-child`); __touch('end', 1, 5, 5); }
    else if (type === 'open-pour') {
      if (st.params.kind === 'jar') { const bx = st.box; const pts = [[bx.x, bx.y - bx.displayHeight * 0.4]]; for (let k = 0; k < 4; k++) pts.push([bx.x + (k % 2 ? 90 : -90), bx.y - bx.displayHeight * 0.4]); await __drag(pts, { hold: true }); await shot(`${n}-twist`); __touch('end', 1, 5, 5); }
      await __gesture(); await __run(900); await shot(`${n}-open`);
      const pp = st.pourPoint(); await __drag([[st.box.x, st.box.y], [pp.x, pp.y]], { hold: true }); await __run(1300); await shot(`${n}-pour`);
      await __run(st.params.pourMs); __touch('end', 1, pp.x, pp.y);
    } else if (type === 'bake') {
      await __gesture(); await __run(900); await shot('bake-panel-50');
      for (let k = 0; k < 3; k++) { __tap(st.btnUp.x, st.btnUp.y); await __run(450); } await __run(900); await shot('bake-panel-200');
      __tap(st.btnStart.x, st.btnStart.y); await __run(3000); await shot('bake-baking');
      await until(() => st.phase === 'mitts'); await __run(900); await shot('bake-mitts');
      __tap(st.mitts.x, st.mitts.y); await __run(700); __tap(st.closed.x, st.closed.y); await __run(350); await shot('bake-out');
    } else if (type === 'share') {
      const s = st.slices[0], cc = st.sliceCenter(s), m = st.mouthOf('mom');
      await __drag([[cc.x, cc.y], [m.x - 160, m.y + 50]], { hold: true }); await __run(150); await shot('share-to-mom');
      __touch('end', 1, m.x - 160, m.y + 50); await __run(450); await shot('share-mom-chews');
      await __run(900); window.__shareTo = 'pet'; await __gesture(); window.__shareTo = 'alt';
    }
    for (let g2 = 0; g2 < 300 && __R().step === st; g2++) { if (st.finished) await __run(100); else await __gesture(); }
  }
  return out;
};

// Round 6: the salad. `window.__recipe = 'salad'` switches __start, __demos and __fullRun5 to it (default 'pizza').
/**
 * Salad screenshot tour (about 12 shots, docs/screenshots-round6/<tag>-NN-<what>.png): home, then the child mid-gesture
 * in each salad step (the hand wash is the pizza's), the photo. Picks cucumber, carrot, tomato. Start without awaiting;
 * read window.__tourRes.
 */
window.__tour6 = async (w, h, tag) => {
  for (let i = 0; i < 60 && !__voice.allLoaded; i++) await new Promise((r) => setTimeout(r, 250));
  const out = [];
  let i = 1;
  const shot = async (n) => out.push(await __saveShot(`${tag}-${String(i++).padStart(2, '0')}-${n}`, 'screenshots-round6'));
  const until = async (fn, ms = 8000) => { for (let t = 0; t < ms && !fn(); t += 50) await __run(50); };
  window.__recipe = 'salad'; __demos(false); await __setup(w, h); __voSim(true);
  window.__pickOrder = ['cucumber', 'carrot', 'tomato']; window.__shareTo = 'alt';
  const b = game.scene.getScene('Title').children.list.find((o) => (o.texture?.key === 'btn-play' || o.texture?.key === 'btn-world-kitchen'));
  __tap(b.x, b.y); await __run(1600); await shot('home');
  const c = game.scene.getScene('Home').children.list.find((o) => o.texture?.key === 'card-salad');
  __tap(c.x, c.y); await __waitRecipe(); await until(() => game.scene.isActive('Recipe') && __R().step);
  const seen = new Set();
  for (let guard = 0; guard < 60 && game.scene.isActive('Recipe'); guard++) {
    await until(() => !__R().step?.finished, 15000);
    const st = __R().step, type = __type();
    await __run(900);
    const first = !seen.has(type + st.params.target); seen.add(type + st.params.target);
    if (type === 'photo') { await until(() => st.frame, 8000); await __run(1400); await shot('photo'); await __run(1600); await shot('photo-stars'); break; }
    if (type === 'wash' && st.params.target === 'basket') { await __gesture(); const y = st.palmL.y - 30; await __drag([[st.palmL.x, y], [st.palmR.x, y + 40], [st.palmL.x, y], [st.palmR.x - 60, y + 20]], { hold: true }); await __run(120); await shot('wash-veg'); __touch('end', 1, 5, 5); }
    else if (type === 'knead') { for (let k = 0; k < 4; k++) { __tap(st.at.x + 30, st.at.y); await __run(250); } __touch('start', 1, st.at.x - 40, st.at.y); await __run(80); await shot('tear'); __touch('end', 1, 5, 5); }
    else if (type === 'choose') { await __gesture(); await __gesture(); await __run(300); await shot('choose'); }
    else if (type === 'chop' && first) { await __gesture(); const z = st.cutZone(); await __drag([[st.knife.x, z.y0 + 60], [st.knife.x, (z.y0 + z.y1) / 2 + 30]], { hold: true }); await __run(80); await shot('chop-' + st.params.veg); __touch('end', 1, 5, 5); }
    else if (type === 'open-pour') {
      if (st.params.sources) { await __gesture(); await __run(300); }
      const pp = st.pourPoint(); await __drag([[st.box.x, st.box.y], [pp.x, pp.y]], { hold: true }); await __run(700); await shot(st.params.sources ? 'into-bowl' : 'oil');
      await __run(st.params.pourMs); __touch('end', 1, pp.x, pp.y);
    } else if (type === 'crush') { for (let k = 0; k < 4; k++) { __tap(st.at.x, st.at.y); await __run(200); } await shot('lemon'); }
    else if (type === 'sprinkle') { const o = st.bowl.opening(); __touch('start', 1, o.x, o.y - 40); await __run(120); await shot('salt'); __touch('end', 1, o.x, o.y - 40); }
    else if (type === 'stir') { const o = st.bowl.opening(); await __drag([[o.x - 100, o.y], [o.x, o.y + 40], [o.x + 100, o.y], [o.x, o.y - 30]], { hold: true }); await __run(80); await shot('mix'); __touch('end', 1, 5, 5); }
    else if (type === 'share') {
      const s = st.slices[0], cc = st.sliceCenter(s), m = st.targetOf('mom');
      await __drag([[cc.x, cc.y], [m.x - 120, m.y - 60]], { hold: true }); await __run(150); await shot('serve-to-mom');
      __touch('end', 1, m.x - 120, m.y - 60); await __run(700);
      window.__shareTo = 'pet'; await __gesture(); await __run(300); await shot('serve-pipa'); window.__shareTo = 'alt';
    }
    for (let g2 = 0; g2 < 400 && __R().step === st; g2++) { if (st.finished) await __run(100); else await __gesture(); }
  }
  window.__recipe = 'pizza';
  return out;
};

/** Salad layout audit (as __auditRun5): every step, and again after every gesture. Start without awaiting. */
window.__auditRun6 = async (w, h, picks = ['cucumber', 'carrot', 'tomato']) => {
  window.__recipe = 'salad';
  try { return await __auditRun5(w, h, picks); } finally { window.__recipe = 'pizza'; }
};

/**
 * Salad robustness (as __robust5) in the two step types it generalised the most: pouring several things into the kept
 * bowl (a bin held over it, pouring) and sharing portions (one held mid-drag). how: 'rotate' | 'background'.
 */
window.__robust6 = async (how = 'rotate', w = 900, h = 405) => {
  for (let i = 0; i < 60 && !__voice.allLoaded; i++) await new Promise((r) => setTimeout(r, 250));
  window.__recipe = 'salad'; __demos(false); await __setup(w, h); __voSim(true);
  window.__pickOrder = ['cucumber', 'carrot', 'tomato']; window.__shareTo = 'alt';
  const g = document.getElementById('game');
  const setHidden = (on) => { Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => (on ? 'hidden' : 'visible') }); document.dispatchEvent(new Event('visibilitychange')); };
  const away = async () => {
    if (how === 'rotate') { g.style.width = h + 'px'; g.style.height = w + 'px'; window.dispatchEvent(new Event('resize')); await __yield(); __tick(16); __touch('end', 1, 10, 10); }
    else { __touch('cancel', 1, 10, 10); setHidden(true); }
  };
  const back = async () => {
    if (how === 'rotate') { g.style.width = w + 'px'; g.style.height = h + 'px'; window.dispatchEvent(new Event('resize')); await __yield(); __tick(16); }
    else setHidden(false);
  };
  const rows = [];
  const moment = async (name, setup, progress, held) => {
    await setup();
    const st = __R().step, p0 = progress(st), idle0 = st.idleMs;
    await away();
    if (how === 'rotate') await __run(4000);
    const row = { name, paused: __R().scene.isPaused(), held: held(st), progressKept: JSON.stringify(progress(st)) === JSON.stringify(p0), idleFrozen: st.idleMs === idle0 };
    await back(); await __run(600);
    row.resumed = !__R().scene.isPaused();
    const type = __type();
    for (let k = 0; k < 400 && __R().step === st && game.scene.isActive('Recipe'); k++) { if (st.finished) await __run(200); else await __gesture(); }
    row.finished = __R().step !== st;
    rows.push(row);
  };
  try {
    await __start();
    await __to('open-pour', 1300);
    await moment('into the bowl (a bin held over it, pouring)', async () => { const st = __R().step, pp = st.pourPoint(); await __drag([[st.box.x, st.box.y], [pp.x, pp.y]], { hold: true }); await __run(600); },
      (st) => st.sources.map((x) => x.done).join(), (st) => st.held || st.over);
    await __to('share', 1300);
    await moment('serve (a portion held mid-drag)', async () => { const st = __R().step, s = st.slices.find((x) => !x.eaten), c = st.sliceCenter(s); await __drag([[c.x, c.y], [c.x + 150, c.y - 80]], { hold: true }); },
      (st) => st.slices.filter((x) => x.eaten).length, (st) => !!st.held);
    for (let k = 0; k < 400 && game.scene.isActive('Recipe'); k++) { if (__R().step.finished || __type() === 'photo') await __run(200); else await __gesture(); }
    return { how, home: game.scene.isActive('Home'), rows };
  } finally { window.__recipe = 'pizza'; }
};

// Round 7: the cookies. `window.__recipe = 'cookies'` switches __start, __demos and __fullRun5 to it.
/**
 * Cookie screenshot tour (about 12 shots, docs/screenshots-round7/<tag>-NN-<what>.png): home, the child mid-gesture in
 * each cookie step, the photo. Start without awaiting; read window.__tourRes.
 */
window.__tour7 = async (w, h, tag) => {
  for (let i = 0; i < 60 && !__voice.allLoaded; i++) await new Promise((r) => setTimeout(r, 250));
  const out = [];
  let i = 1;
  const shot = async (n) => out.push(await __saveShot(`${tag}-${String(i++).padStart(2, '0')}-${n}`, 'screenshots-round7'));
  const until = async (fn, ms = 8000) => { for (let t = 0; t < ms && !fn(); t += 50) await __run(50); };
  window.__recipe = 'cookies'; __demos(false); await __setup(w, h); __voSim(true); window.__shareTo = 'alt';
  const b = game.scene.getScene('Title').children.list.find((o) => (o.texture?.key === 'btn-play' || o.texture?.key === 'btn-world-kitchen'));
  __tap(b.x, b.y); await __run(1600); await shot('home');
  const c = game.scene.getScene('Home').children.list.find((o) => o.texture?.key === 'card-cookies');
  __tap(c.x, c.y); await __waitRecipe(); await until(() => game.scene.isActive('Recipe') && __R().step);
  try {
    for (let guard = 0; guard < 60 && game.scene.isActive('Recipe'); guard++) {
      await until(() => !__R().step?.finished, 15000);
      const st = __R().step, type = __type();
      await __run(900);
      if (type === 'photo') { await until(() => st.frame, 8000); await __run(1400); await shot('photo'); break; }
      if (type === 'open-pour') {
        const pp = st.pourPoint(); await __drag([[st.box.x, st.box.y], [pp.x, pp.y]], { hold: true }); await __run(st.params.dropIn ? 30 : 700);
        await shot('pour-' + st.params.closed); await __run(st.params.pourMs + 200); __touch('end', 1, pp.x, pp.y);
      } else if (type === 'crush') { for (let k = 0; k < 3; k++) { __tap(st.at.x, st.at.y); await __run(250); } await shot('egg'); }
      else if (type === 'stir') { const o = st.bowl.opening(); await __drag([[o.x - 100, o.y], [o.x, o.y + 40], [o.x + 100, o.y], [o.x, o.y - 30], [o.x - 100, o.y]], { hold: true }); await __run(80); await shot('stir'); __touch('end', 1, 5, 5); }
      else if (type === 'knead') { for (let k = 0; k < 4; k++) { __tap(st.at.x + 30, st.at.y); await __run(250); } await shot('knead'); }
      else if (type === 'roll') { const d = __R().ctx.dish; await __drag([[d.x - 200, d.y], [d.x + 200, d.y + 30], [d.x - 200, d.y + 60]], { hold: true }); await __run(80); await shot('roll'); __touch('end', 1, 5, 5); }
      else if (type === 'cutters') { for (let k = 0; k < 3; k++) await __gesture(); const cc = st.cutters[3]; __tap(cc.x, cc.y); await __run(200); const s = st.slotAt(st.filled.indexOf(false)); __tap(s.x, s.y); await __run(330); await shot('cutters'); await __run(600); }
      else if (type === 'bake') { await __gesture(); await __run(400); await shot('oven-panel'); for (let k = 0; k < 3 && st.phase === 'temp'; k++) await __gesture(); await __run(800); await shot('baking'); }
      else if (type === 'decorate') { for (let k = 0; k < 7; k++) { const bn = st.bins[k % st.bins.length], ck = st.cookieList[k % 6], w0 = st.dish.toWorld(ck.x, ck.y); await __drag([[bn.x, bn.y], [w0.x + 10, w0.y + 90]]); await __run(300); } await shot('decorate'); }
      else if (type === 'share') {
        const s = st.slices[0], cc = st.sliceCenter(s), m = st.targetOf('mom');
        await __drag([[cc.x, cc.y], [m.x - 140, m.y + 40]], { hold: true }); await __run(150); await shot('share-to-mom');
        __touch('end', 1, m.x - 140, m.y + 40); await __run(1300);
      }
      for (let g2 = 0; g2 < 400 && __R().step === st; g2++) { if (st.finished) await __run(100); else await __gesture(); }
    }
  } finally { window.__recipe = 'pizza'; }
  return out;
};

/** Cookie layout audit (as __auditRun5): every step, and again after every gesture. Start without awaiting. */
window.__auditRun7 = async (w, h) => {
  window.__recipe = 'cookies';
  try { return await __auditRun5(w, h, []); } finally { window.__recipe = 'pizza'; }
};

/** Cookie robustness (as __robust6): mid-press in the cutters step, and a cookie held mid-drag in sharing. */
window.__robust7 = async (how = 'rotate', w = 900, h = 405) => {
  for (let i = 0; i < 60 && !__voice.allLoaded; i++) await new Promise((r) => setTimeout(r, 250));
  window.__recipe = 'cookies'; __demos(false); await __setup(w, h); __voSim(true); window.__shareTo = 'alt';
  const g = document.getElementById('game');
  const setHidden = (on) => { Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => (on ? 'hidden' : 'visible') }); document.dispatchEvent(new Event('visibilitychange')); };
  const away = async () => {
    if (how === 'rotate') { g.style.width = h + 'px'; g.style.height = w + 'px'; window.dispatchEvent(new Event('resize')); await __yield(); __tick(16); __touch('end', 1, 10, 10); }
    else { __touch('cancel', 1, 10, 10); setHidden(true); }
  };
  const back = async () => {
    if (how === 'rotate') { g.style.width = w + 'px'; g.style.height = h + 'px'; window.dispatchEvent(new Event('resize')); await __yield(); __tick(16); }
    else setHidden(false);
  };
  const rows = [];
  const moment = async (name, setup, progress, held) => {
    await setup();
    const st = __R().step, p0 = progress(st), idle0 = st.idleMs;
    await away();
    if (how === 'rotate') await __run(4000);
    const row = { name, paused: __R().scene.isPaused(), held: held(st), progressKept: JSON.stringify(progress(st)) === JSON.stringify(p0), idleFrozen: st.idleMs === idle0 };
    await back(); await __run(600);
    row.resumed = !__R().scene.isPaused();
    for (let k = 0; k < 400 && __R().step === st && game.scene.isActive('Recipe'); k++) { if (st.finished) await __run(200); else await __gesture(); }
    row.finished = __R().step !== st;
    rows.push(row);
  };
  try {
    await __start();
    await __to('cutters', 1300);
    await moment('cutters (two cookies cut, a cutter pressing)', async () => { await __gesture(); await __gesture(); const st = __R().step; __tap(st.cutters[2].x, st.cutters[2].y); await __run(200); const s = st.slotAt(st.filled.indexOf(false)); __tap(s.x, s.y); await __run(150); },
      (st) => st.filled.join(), () => false);
    await __to('share', 1300);
    await moment('share (a cookie held mid-drag)', async () => { const st = __R().step, s = st.slices.find((x) => !x.eaten), c = st.sliceCenter(s); await __drag([[c.x, c.y], [c.x + 150, c.y - 80]], { hold: true }); },
      (st) => st.slices.filter((x) => x.eaten).length, (st) => !!st.held);
    for (let k = 0; k < 400 && game.scene.isActive('Recipe'); k++) { if (__R().step.finished || __type() === 'photo') await __run(200); else await __gesture(); }
    return { how, home: game.scene.isActive('Home'), rows };
  } finally { window.__recipe = 'pizza'; }
};

/**
 * Round 8 (loading by recipe): fast runs to home with entering, leaving and re-entering recipes. Each row: the textures
 * and effect sounds in memory in the recipe and back home, whether it got home, and the voice check. Start without
 * awaiting; read window.__i8. Also look for "[assets] not loaded yet" in the console (a key missing from RECIPE_ASSETS).
 */
window.__infra8 = async () => {
  const rows = [];
  const mem = () => ({ tex: game.textures.getTextureKeys().length, sfx: game.cache.audio.getKeys().length });
  const picks = { pizza: ['tomato', 'corn', 'olive'], salad: ['cucumber', 'carrot', 'tomato'], cookies: [] };
  const enterLeave = async (id) => {
    window.__recipe = id; __demos(false); await __setup(900, 405); await __start();
    const inR = mem(); await __run(1500); __R().goHome(); await __run(1500);
    rows.push({ id, how: 'enter+leave', atHome: game.scene.isActive('Home'), inRecipe: inR, home: mem() });
  };
  const full = async (id) => {
    window.__recipe = id;
    const r = await __fullRun5(false, 'fast', picks[id]);
    rows.push({ id, how: 'full', home: r.home, secs: r.recipeSeconds, voice: r.check, homeMem: mem() });
  };
  try {
    await full('pizza');
    await enterLeave('salad');
    await enterLeave('cookies');
    await enterLeave('cookies');
    await full('cookies');
    await full('salad');
  } finally { window.__recipe = 'pizza'; }
  window.__i8 = rows;
  return rows;
};

/**
 * Round 8: the background in a visible page (document.hidden and visibilityState both faked, as a real trip away):
 * inside a step with music on, go away for 3 s of game time and come back. Reads whether the game is paused, the step's
 * idle clock and time stood still, the voice line was dropped, the audio context suspended; then that it all resumes.
 */
window.__bg8 = async (id = 'cookies', type = 'stir') => {
  window.__recipe = id; __demos(false); await __setup(900, 405); __voSim(false); await __start(); await __to(type, 1300);
  const st = __R().step, c = game.sound.context;
  __voice.say ? __voice.say('vo-help', {}) : 0; await __run(100);
  const before = { idle: st.idleMs, t: game.loop.frame, voice: __voice.current, ctx: c.state };
  __setHidden(true); await __run(3000); await new Promise((r) => setTimeout(r, 300));
  const away = { gamePaused: game.isPaused, idleFrozen: st.idleMs === before.idle, framesFrozen: game.loop.frame === before.t || game.isPaused,
    voice: __voice.current, ctx: c.state };
  __setHidden(false); await new Promise((r) => setTimeout(r, 300)); await __run(2000);
  const back = { gamePaused: game.isPaused, idleRuns: st.idleMs > before.idle, ctx: c.state };
  return (window.__b8 = { before, away, back });
};

/**
 * Round 8 robustness (as __robust7) for a new recipe: `moments` = [[name, stepType, setup(st), progress(st), held(st)]].
 * how: 'rotate' | 'background' (the background fakes document.hidden too, __setHidden). Read window.__rb8.
 */
window.__robust8 = async (recipe, moments, how = 'rotate', w = 900, h = 405) => {
  for (let i = 0; i < 60 && !__voice.allLoaded; i++) await new Promise((r) => setTimeout(r, 250));
  window.__recipe = recipe; __demos(false); await __setup(w, h); __voSim(true); window.__shareTo = 'alt';
  const g = document.getElementById('game');
  const away = async () => {
    if (how === 'rotate') { g.style.width = h + 'px'; g.style.height = w + 'px'; window.dispatchEvent(new Event('resize')); await __yield(); __tick(16); __touch('end', 1, 10, 10); }
    else { __touch('cancel', 1, 10, 10); __setHidden(true); }
  };
  const back = async () => {
    if (how === 'rotate') { g.style.width = w + 'px'; g.style.height = h + 'px'; window.dispatchEvent(new Event('resize')); await __yield(); __tick(16); }
    else __setHidden(false);
  };
  const rows = [];
  try {
    await __start();
    for (const [name, type, setup, progress, held] of moments) {
      await __to(type, 1300);
      const st = __R().step;
      await setup(st);
      const p0 = progress(st), idle0 = st.idleMs;
      await away();
      await __run(how === 'rotate' ? 4000 : 3000);
      const row = { name, paused: __R().scene.isPaused() || game.isPaused, held: held(st), progressKept: JSON.stringify(progress(st)) === JSON.stringify(p0), idleFrozen: st.idleMs === idle0 };
      await back(); await __run(600);
      row.resumed = !__R().scene.isPaused() && !game.isPaused;
      for (let k = 0; k < 400 && __R().step === st && game.scene.isActive('Recipe'); k++) { if (st.finished) await __run(200); else await __gesture(); }
      row.finished = __R().step !== st;
      rows.push(row);
    }
    for (let k = 0; k < 400 && game.scene.isActive('Recipe'); k++) { if (__R().step.finished || __type() === 'photo') await __run(200); else await __gesture(); }
    return (window.__rb8 = { how, home: game.scene.isActive('Home'), rows });
  } finally { window.__recipe = 'pizza'; }
};
/** The smoothie's moments for __robust8: the blender running under a held finger, and a glass held mid-drag. */
window.__smoothieMoments = () => [
  ['blend (button held, motor running)', 'blend', async (st) => { __tap(st.lid.x, st.lid.y); await __run(900); __touch('start', 1, st.button.x, st.button.y); await __run(700); }, (st) => st.phase + ':' + Math.round(st.ran / 100), (st) => st.pressing],
  ['share (a glass held mid-drag)', 'share', async (st) => { const s = st.slices.find((x) => !x.eaten), c = st.sliceCenter(s); await __drag([[c.x, c.y], [c.x + 150, c.y - 80]], { hold: true }); }, (st) => st.slices.filter((x) => x.eaten).length, (st) => !!st.held],
];
/** The pancakes' moments for __robust8: the ladle held over the pan (pouring), and a wedge held mid-drag. */
/** Round 9: the soup's moments for __robust8 (the peeler held mid-stroke, and a ladle of soup held mid-drag). */
window.__soupMoments = () => [
  ['peel (the peeler held mid-stroke)', 'peel', async (st) => { const z = st.peelZone(), y = (z.y0 + z.y1) / 2; await __drag([[z.x0 + 80, y], [z.x0 + 150, y]], { hold: true }); await __run(300); }, (st) => st.done + ':' + st.bands.filter((b) => b.active).length, (st) => st.held],
  ['stir (the soup on the stove, spoon held)', 'stir', async (st) => { if (st.phase === 'knob') { __tap(st.knob.x, st.knob.y); await __run(900); } const o = st.bowl.opening(); await __drag([[o.x, o.y], [o.x + o.rx * 0.4, o.y]], { hold: true }); await __run(300); }, (st) => st.phase + ':' + Math.round(st.progress * 100), (st) => st.stirring],
  ['share (a ladle held mid-drag)', 'share', async (st) => { const s = st.slices.find((x) => !x.eaten), c = st.sliceCenter(s); await __drag([[c.x, c.y], [c.x + 150, c.y - 80]], { hold: true }); }, (st) => st.slices.filter((x) => x.eaten).length, (st) => !!st.held],
];
/** Round 9: the cake's moments for __robust8 (a candle held mid-drag, and the flames half blown out). */
window.__cakeMoments = () => [
  ['candles (a candle held mid-drag)', 'candles', async (st) => { const c = st.waiting[0]; await __drag([[c.x, c.y], [c.x + 200, c.y - 100]], { hold: true }); await __run(300); }, (st) => st.phase + ':' + st.placed.length, (st) => !!st.held],
  ['share (a wedge held mid-drag)', 'share', async (st) => { const s = st.slices.find((x) => !x.eaten), c = st.sliceCenter(s); await __drag([[c.x, c.y], [c.x + 150, c.y - 80]], { hold: true }); }, (st) => st.slices.filter((x) => x.eaten).length, (st) => !!st.held],
];
window.__pancakeMoments = () => [
  ['flip (the ladle held over the pan, pouring)', 'flip', async (st) => { if (st.phase === 'knob') { __tap(st.knob.x, st.knob.y); await __run(800); } const hp = st.holdPoint(); await __drag([[st.ladle.x, st.ladle.y], [hp.x, hp.y]], { hold: true }); await __run(700); }, (st) => st.phase + ':' + st.made + ':' + Math.round(st.poured / 100), (st) => st.held],
  ['share (a wedge held mid-drag)', 'share', async (st) => { const s = st.slices.find((x) => !x.eaten), c = st.sliceCenter(s); await __drag([[c.x, c.y], [c.x + 150, c.y - 80]], { hold: true }); }, (st) => st.slices.filter((x) => x.eaten).length, (st) => !!st.held],
];

// ---------------------------------------------------------------- The garden (GardenScene; garden round 2 adds level 2)
// window.__gardenLevel = 1 | 2 picks the level; __gardenSeed = 'tomato' | 'strawberry' | 'carrot' picks the packet
// (default: Pipa's wish); __overWater = true pours on a grown plant once (level 2); __bunnyWrong = true offers the bunny
// a wrong thing first.
window.__GS = () => game.scene.getScene('Garden');
/** One round of whatever the garden's current part expects (with the child __drag of __gardenRun, at her pace). */
window.__gardenGesture = async () => {
  const g = __GS(), k = g.L.k, bs = g.bed.s, soil = g.bed.soil;
  switch (g.phase) {
    case 'seeds': {
      const want = window.__gardenSeed || g.wish || 'tomato';
      const pk = g.packets.find((p) => p.getData('kind') === want) || g.packets[0];
      __tap(pk.x, pk.y); return;
    }
    case 'weeds': {
      const sp = g.spots.find((s) => s.weed); if (!sp) return;
      await __drag([[sp.x, soil - 90 * bs], [sp.x, soil - 300 * bs]]); return;
    }
    case 'plant': {
      const h = g.nextHole(); if (!h) return;
      if (g.spots.filter((s) => s.stage > 0).length % 2) __tap(h.x, soil);
      else await __drag([[g.packet.x, g.packet.y], [h.x, soil - 30 * k]]);
      return;
    }
    case 'water': {
      const grown = g.spots.find((s) => s.stage >= 3);
      const s = window.__overWater && grown && !window.__overDone ? grown : g.nextDry(); if (!s) return;
      if (s === grown) window.__overDone = true;
      const c = g.can, off = c.x - g.spoutAt().x;
      await __drag([[c.x, c.y], [s.x + off * 0.9, soil - 190 * k]], { hold: true });
      await __run(s === grown ? 1500 : g.needMs() + 500);
      __touch('end', 1, s.x + off * 0.9, soil - 190 * k); return;
    }
    case 'cloud': {
      const c = g.cloud; if (!c) return;
      await __drag([[c.x, c.y], [c.x + g.cloudDir() * (g.L.k * 330), c.y]]); return;
    }
    case 'scare': {
      const c = g.wantedCloth(); if (!c) return;
      if (window.__scareWrong && !g.shown.scareWrong && g.scare.want) { const w = g.clothes.find((q) => q !== c); __tap(w.img.x, w.img.y); return; }
      if (g.clothes.length % 2) __tap(c.img.x, c.img.y);
      else { const to = g.wearAt(c.what); await __drag([[c.img.x, c.img.y], [to.x, to.y]]); }
      return;
    }
    case 'rain': {
      const s = g.nextDry(); if (!s || !g.rain) return;
      const c = g.rain;
      await __drag([[c.x, c.y], [s.x, c.y]], { hold: true });
      await __run(g.needMs() + 500);
      __touch('end', 1, s.x, c.y); return;
    }
    case 'sun': __tap(g.sunAt.x, g.sunAt.y); return;
    case 'bfly': {
      const f = g.nextFlower(); if (!f || !g.bfly) return;
      if (g.flowers.filter((q) => q.visited).length % 2) __tap(f.fruit.home.x, f.fruit.home.y);
      else await __drag([[g.bfly.x, g.bfly.y], [f.fruit.home.x, f.fruit.home.y - 30]]);
      return;
    }
    case 'snail': {
      if (!g.leaf || !g.snail) return;
      const m = g.snailAt(); await __drag([[g.leaf.x, g.leaf.y], [m.x, m.y]]); return;
    }
    case 'bunny': {
      if (!g.bunny) return;
      const f = window.__bunnyWrong && !g.shown.bunnyWrong ? g.foods.find((q) => !q.want) : g.wantedFood();
      const m = g.bunnyMouth(); await __drag([[f.img.x, f.img.y], [m.x, m.y]]); return;
    }
    case 'pick': {
      const f = g.nextFruit(); if (!f) return;
      if (f.carrot) await __drag([[f.home.x, f.home.y - 60 * bs], [f.home.x, f.home.y - 320 * bs]]);
      else await __drag([[f.img.x, f.img.y], [g.basket.x, g.basket.y]]);
      return;
    }
  }
};
/**
 * The whole garden on the virtual clock with the simulated voice: mode 'child' (her pace, like __fullRun5) or 'none'
 * (no touch: Mom helps with everything). Returns the parts with their start times, the length, what was shown, the voice
 * log's problems. Start without awaiting and read window.__gr.
 */
window.__gardenRun = async (level = 1, mode = 'child', w = 900, h = 405, demos = false) => {
  const drag0 = window.__drag0 || (window.__drag0 = __drag);
  // (level 0: the level chosen on the title, core/level.ts)
  if (level) window.__gardenLevel = level; else delete window.__gardenLevel;
  window.__overDone = false;
  for (let i = 0; i < 60 && !__voice.allLoaded; i++) await new Promise((r) => setTimeout(r, 250));
  localStorage.setItem('cooking.runs.garden', demos ? '0' : '5');
  await __setup(w, h); __voSim(true);
  window.__drag = async (pts, opts = {}) => {
    __touch('start', 1, ...pts[0]);
    for (let i = 1; i < pts.length; i++) {
      const [a, b] = pts[i - 1], [c, d] = pts[i], L = Math.hypot(c - a, d - b), n = Math.max(2, Math.ceil(L / 40));
      for (let k = 1; k <= n; k++) { __touch('move', 1, a + ((c - a) * k) / n, b + ((d - b) * k) / n); await __run((L / 650) * 1000 / n); }
    }
    if (!opts.hold) __touch('end', 1, ...pts[pts.length - 1]);
  };
  const T = () => __T;
  try {
    const b = game.scene.getScene('Title').children.list.find((o) => (o.texture?.key === 'btn-play' || o.texture?.key === 'btn-world-kitchen'));
    __tap(b.x, b.y); await __run(2500);
    const c = game.scene.getScene('Home').children.list.find((o) => o.texture?.key === 'card-garden');
    const n0 = __voLog.length, t0 = T(), l0 = game.loop.time, at = {}, gest = {};
    __tap(c.x, c.y);
    for (let i = 0; i < 300 && !game.scene.isActive('Garden'); i++) { await __run(50); await new Promise((r) => setTimeout(r, 20)); }
    let last = '';
    for (let i = 0; i < 12000 && game.scene.isActive('Garden'); i++) {
      const g = __GS(), ph = g.phase;
      if (ph !== last && ph !== 'intro') { last = ph; at[ph] = at[ph] ?? +((T() - t0) / 1000).toFixed(1); if (mode === 'child') await __run(1000); }
      if (mode === 'none' || g.owner || g.helping || g.demoOn || ['intro', 'done'].includes(g.phase)) { await __run(100); continue; }
      gest[g.phase] = (gest[g.phase] || 0) + 1;
      await __gardenGesture();
      await __run(450);
    }
    const shown = { ...(game.scene.getScene('Garden').shown) };
    await __run(500);
    const log = __voLog.slice(n0);
    return { level, mode, parts: at, gestures: gest, seconds: +((T() - t0) / 1000).toFixed(1), home: game.scene.isActive('Home'), shown,
      helps: log.filter((e) => e.key === 'vo-help').length, check: __voCheck(log), keys: log.map((e) => e.key + '@' + ((e.start - l0) / 1000).toFixed(1)) };
  } finally { window.__drag = drag0; }
};

// ---- The mini-games round (market, washing up): __mini(id, level, {first}), __marketPlay / __dishesPlay({wrong, drag, none, gap}),
// __verify(id, level, opts): a whole game on the virtual clock with the simulated voice (raf stopped: in a visible page
// the browser's own frames would step the game with real timestamps too), __fast(on): headlessStep.
window.__mini = async (id, level = 1, opts = {}) => {
  window.__level = level;
  if (opts.first === false) localStorage.setItem('cooking.runs.' + id, '3'); else if (opts.first) localStorage.removeItem('cooking.runs.' + id);
  // (not a literal import: the dev server would rewrite this file)
  const B = await new Function('u', 'return import(u)')('/kids-cooking-game/src/scenes/BootScene.ts');
  game.scene.getScenes(true).forEach((s) => s.scene.stop());
  game.scene.start('Home', {});
  await __run(800);
  await B.recipeAssets(game, id);
  game.scene.getScenes(true).forEach((s) => s.scene.stop());
  const name = { market: 'Market', dishes: 'Dishes', garden: 'Garden', art: 'Art', clinic: 'Clinic' }[id];
  game.scene.start(name);
  await __run(opts.wait ?? 3000);
  return game.scene.getScene(name);
};
window.__marketPlay = async (opts = {}) => {
  const m = game.scene.getScene('Market');
  const log = [];
  for (let i = 0; i < 1200 && m.scene.isActive(); i++) {
    if (!opts.none && !m.helping && ['guest', 'mixed', 'pay'].includes(m.shown.phase)) {
      const k = m.L.k;
      if (m.shown.phase === 'guest' && m.guest) {
        const w = m.guestWant();
        if (w) {
          if (opts.wrong && !m.__gWrong) { m.__gWrong = true; const c = m.crates.find((q) => !m.guest.wants.some((z) => z.good === q.good)); log.push('guest-wrong ' + c.good.id); __tap(c.item.x, c.item.y); }
          else { const c = m.crateOf(w.good), mo = m.guest.who.mouthAt; if (opts.drag) await __drag([[c.item.x, c.item.y], [mo.x, mo.y]]); else __tap(c.item.x, c.item.y); log.push('guest ' + w.good.id); }
        }
      } else if (m.shown.phase === 'mixed' && m.mixed) {
        const it = (opts.wrong && !m.__mWrong) ? m.mixed.items.find((q) => !q.odd) : m.mixed.items.find((q) => q.odd && !q.out);
        if (opts.wrong && !m.__mWrong) m.__mWrong = true;
        if (it) { __tap(it.x, it.y); log.push('mixed ' + it.good.id + (it.odd ? '' : '(belongs)')); }
      } else if (m.shown.phase === 'pay' && m.pay && !m.pay.busy) {
        if (m.level === 2) {
          const pile = (opts.wrong && !m.__pWrong) ? m.pay.piles.find((q) => q.n !== m.pay.n) : m.pay.piles.find((q) => q.n === m.pay.n);
          if (opts.wrong) m.__pWrong = true;
          __tap(pile.x, pile.y); log.push('pile ' + pile.n + '/' + m.pay.n);
        } else if (m.pay.purse) {
          if (opts.drag) await __drag([[m.pay.purse.x, m.pay.purse.y], [m.pay.slate.x, m.pay.slate.y]]); else __tap(m.pay.purse.x, m.pay.purse.y);
          log.push('coin');
        }
      }
      await __run(opts.gap ?? 900);
      if (game.scene.isActive('Home')) break;
      continue;
    }
    if (m.shown.phase === 'shop' && !m.helping) {
      const w = m.wants.find((q) => !q.got);
      if (opts.none) { await __run(500); continue; }
      if (w) {
        if (opts.wrong && !m.__wrongDone) { m.__wrongDone = true; const c = m.crates.find((q) => !m.wants.some((z) => z.good === q.good)); log.push('wrong ' + c.good.id); __tap(c.item.x, c.item.y); await __run(opts.gap ?? 900); continue; }
        const c = m.crates.find((q) => q.good === w.good);
        if (opts.drag) await __drag([[c.item.x, c.item.y], [(c.item.x + m.basket.x) / 2, c.item.y - 50], [m.basket.x, m.basket.y - 30]]);
        else __tap(c.item.x, c.item.y);
        log.push(w.good.id);
      }
      await __run(opts.gap ?? 900);
    } else await __run(300);
    if (!m.scene.isActive() || game.scene.isActive('Home')) break;
  }
  return { log, shown: m.shown, home: game.scene.isActive('Home') };
};
window.__dishesPlay = async (opts = {}) => {
  const m = game.scene.getScene('Dishes');
  const log = [];
  let wrongDone = false;
  for (let i = 0; i < 2400 && m.scene.isActive(); i++) {
    const ph = m.shown.phase;
    if (opts.none || m.helping) { await __run(500); continue; }
    if (ph === 'take') {
      const d = m.top();
      if (opts.drag) await __drag([[d.box.x, d.box.y], [m.sink.in.x, m.sink.in.y - 40]]);
      else __tap(d.box.x, d.box.y);
      log.push('take ' + d.colour + '-' + d.kind);
      await __run(opts.gap ?? 1200);
    } else if (ph === 'scrub') {
      const d = m.cur; const pts = [];
      for (let a = 0; a < Math.PI * 2 * 5; a += 0.5) pts.push([d.box.x + Math.cos(a) * 80, d.box.y + Math.sin(a) * 60]);
      await __drag(pts);
      log.push('scrub ' + m.shown.scrub);
      await __run(opts.gap ?? 600);
    } else if (ph === 'rack') {
      const d = m.cur;
      let to = m.place(d.colour, d.kind);
      if (opts.wrong && !wrongDone) { wrongDone = true; const c = ['blue', 'yellow', 'pink'].find((c) => c !== d.colour); to = m.place(c, d.kind); log.push('wrong'); }
      await __drag([[d.box.x, d.box.y], [(d.box.x + to.x) / 2, (d.box.y + to.y) / 2], [to.x, to.y]]);
      log.push('rack ' + d.colour + '-' + d.kind);
      await __run(opts.gap ?? 1200);
    } else await __run(300);
    if (game.scene.isActive('Home')) break;
  }
  return { log, shown: m.shown, home: game.scene.isActive('Home') };
};
window.__fast = (on) => { if (!window.__stepCb) window.__stepCb = game.loop.callback; game.loop.callback = on ? game.headlessStep.bind(game) : window.__stepCb; };
window.__verify = async (id, level, opts = {}) => {
  for (let i = 0; i < 60 && !__voice.allLoaded; i++) await new Promise((r) => setTimeout(r, 250));
  game.loop.raf.stop(); __voSim(true); __fast(true);
  await __mini(id, level, { first: !!opts.first, wait: 200 });
  __voLog.length = 0;
  const t0 = __voice.now();
  const r = id === 'market' ? await __marketPlay(opts) : await __dishesPlay(opts);
  for (let i = 0; i < 40 && !game.scene.isActive('Home'); i++) await __run(500);
  const vc = __voCheck(__voLog);
  __fast(false);
  return { id, level, opts, secs: Math.round((__voice.now() - t0) / 1000), home: game.scene.isActive('Home'), shown: r.shown, problems: vc.problems, keys: __voLog.map((e) => e.key).join(' ') };
};

// ---- The art corner: __artPlay(kind, level, {first, none, gap, shots}) plays one picture from the easel wall to the
// picture's coming alive and back to the wall (the scene restarts); __artVerify: the same on the virtual clock with the
// simulated voice. `none`: the card is tapped, then no touch (Mom helps to the end).
window.__artPlay = async (kind, opts = {}) => {
  const a = game.scene.getScene('Art');
  if (!opts.started) {
    for (let i = 0; i < 60 && !(a.shown.phase === 'pick' && a.cardOf(kind)); i++) await __run(300);
    localStorage.setItem('cooking.runs.art-' + kind, '3');
    if (opts.first) localStorage.removeItem('cooking.runs.art-' + kind);
    const c = a.cardOf(kind);
    __tap(c.x, c.y);
    await __run(1500);
  }
  const log = []; let drawn = false; let pic = null; let alive = false;
  for (let i = 0; i < 3000; i++) {
    const ph = a.shown.phase;
    if (ph === 'draw') { drawn = true; pic = a.shown.pic; }
    if (ph === 'alive' && !alive) { alive = true; if (opts.onAlive) { await __run(opts.aliveAt ?? 600); await opts.onAlive(a); } }
    if (drawn && ph === 'pick') break;
    if (!game.scene.isActive('Art')) break;
    if (ph !== 'draw' || opts.none || a.helping) { await __run(400); continue; }
    if (opts.demoWait && a.hand && a.hand.active) { await __run(300); continue; }
    const pl = a.plan();
    if (!pl) { await __run(400); continue; }
    if (pl.tap) { __tap(pl.tap.x, pl.tap.y); log.push('t'); }
    else if (pl.drag) { await __drag(pl.drag.map((q) => [q.x, q.y])); log.push('d'); }
    await __run(opts.gap ?? 700);
    if (opts.onGesture) await opts.onGesture(log.length, a);
  }
  return { kind, pic, gestures: log.length, back: a.shown.phase === 'pick' };
};
window.__artVerify = async (kind, level, opts = {}) => {
  for (let i = 0; i < 60 && !__voice.allLoaded; i++) await new Promise((r) => setTimeout(r, 250));
  game.loop.raf.stop(); __voSim(true); __fast(true);
  if (!game.scene.isActive('Art') || window.__level !== level) await __mini('art', level, { wait: 1500 });
  __voLog.length = 0;
  const t0 = __voice.now();
  const r = await __artPlay(kind, opts);
  const vc = __voCheck(__voLog);
  __fast(false);
  return { ...r, level, secs: Math.round((__voice.now() - t0) / 1000), helps: __voLog.filter((e) => e.key === 'vo-help').length, problems: vc.problems, keys: __voLog.map((e) => e.key).join(' ') };
};

// ---- The clinic (round 3, the Doctor Games loop): __clinicPlay({wrongTool, none, gap, mid}) plays a whole visit like a
// child: pick a patient, then (round 4) one of her problems, then every station (pick its tool from the tray, work on each target: rub, hold, touch, drip,
// find, pull out, give), the sticker; __clinicVerify(level, opts): the same on the virtual clock with the simulated voice,
// from the clinic's start to the title. `none`: no touch at all (Mom helps to the end). `mid(what)`: awaited mid-action.
window.__clinicPlay = async (opts = {}) => {
  const m = game.scene.getScene('Clinic');
  const log = [];
  const k = m.L.k;
  const fingerFor = (p) => [p.x + 26 * k, p.y + 66 * k];
  let wrongToolDone = false;
  const gap = opts.gap ?? 700;
  for (let i = 0; i < (opts.maxSteps ?? 3000) && m.scene.isActive(); i++) {
    const ph = m.shown.phase;
    if (opts.none || m.helping) { await __run(500); continue; }
    if (ph === 'pick') {
      const v = m.visit.find((q) => !q.done);
      const c = v.view.at({ x: 300, y: 430 });
      if (opts.mid) await opts.mid('pick');
      __tap(c.x, c.y); log.push('pick ' + v.p.id + '-' + v.a.id);
      await __run(gap * 2);
    } else if (ph === 'problem') {
      // round 4: her problems' cards beside her; easy: the glowing one, hard: she picks the last one not fixed first
      const v = m.cur;
      const open = v.fixed.map((f, j) => (f ? -1 : j)).filter((j) => j >= 0);
      const j = m.level === 2 ? open[open.length - 1] : open[0];
      const q = m.problems[j];
      if (!q) { await __run(300); continue; }
      if (opts.mid) await opts.mid('problem');
      __tap(q.at.x, q.at.y); log.push('problem ' + v.as[j].id);
      await __run(gap * 2);
    } else if (ph === 'sticker') {
      if (opts.mid) await opts.mid('sticker');
      const s = m.stickers[Math.floor(Math.random() * m.stickers.length)];
      __tap(s.x, s.y); log.push('sticker ' + s.texture.key);
      await __run(gap * 2);
    } else if (ph === 'tool' && !m.zoomBusy) {
      if (opts.wrongTool && !wrongToolDone) {
        const w = m.tools.find((q) => !q.away && !m.steps.some((s, j) => s.tool === q.id && !m.doneSt[j]));
        if (w) { wrongToolDone = true; __tap(w.img.x, w.img.y); log.push('wrong tool ' + w.id); await __run(gap * 1.5); continue; }
      }
      // big chef: she chooses a station that can be done now (the first one, like a child who knows)
      let si = m.si;
      if (m.level === 2) { const j = m.steps.findIndex((q, j) => m.available(j)); if (j >= 0) si = j; }
      const st = m.steps[si];
      const t = st && m.toolOf(st.tool);
      if (!t) { await __run(300); continue; }
      const start = [t.img.x, t.img.y];
      log.push(st.tool + ' ' + st.act + ' ' + st.what);
      __touch('start', 1, ...start);
      // (the close-up opens first, if it has to)
      for (let j = 0; j < 12 && (m.zoomBusy || !m.target()); j++) { __touch('move', 1, start[0] + (j % 2), start[1]); await __run(150); }
      if (st.act === 'give') {
        const tg = m.target();
        if (tg) for (let q = 1; q <= 6; q++) __touch('move', 1, ...fingerFor({ x: start[0] + (tg.x - start[0]) * q / 6, y: start[1] + (tg.y - start[1]) * q / 6 }));
        if (opts.mid) await opts.mid(log[log.length - 1]);
        await __run(100);
        __touch('end', 1, ...fingerFor(tg ?? { x: start[0], y: start[1] }));
        await __run(gap);
        continue;
      }
      for (let j = 0; j < 160 && m.station === st && m.shown.phase === 'tool'; j++) {
        const g = m.target(); if (!g) break;
        if (j === 2 && opts.mid) await opts.mid(log[log.length - 1]);
        if (st.act === 'clean' && st.by === 'rub') {
          for (let a = 0; a < Math.PI * 2; a += 0.6) __touch('move', 1, ...fingerFor({ x: g.x + Math.cos(a) * 30 * k, y: g.y + Math.sin(a) * 20 * k }));
          await __run(60);
        } else if (st.act === 'pull') {
          __touch('move', 1, ...fingerFor(g));
          await __run(150);
          __touch('move', 1, ...fingerFor({ x: g.x + 2, y: g.y }));
          for (let q = 1; q <= 12; q++) { __touch('move', 1, ...fingerFor({ x: g.x + 25 * q * k, y: g.y - 25 * q * k })); await __run(30); }
          await __run(300);
        } else if (st.act === 'touch' || (st.act === 'find' && st.what !== 'wheeze')) {
          for (let q = 0; q <= 6; q++) __touch('move', 1, ...fingerFor({ x: g.x + (q % 2 ? 4 : -4), y: g.y }));
          await __run(250);
        } else {
          // holding still (time, drops, finding by ear)
          for (let q = 0; q < 3; q++) __touch('move', 1, ...fingerFor({ x: g.x + (q % 2 ? 2 : -2), y: g.y }));
          await __run(250);
        }
      }
      __touch('end', 1, ...fingerFor(m.target() ?? { x: start[0], y: start[1] }));
      await __run(gap);
    } else await __run(300);
    if (game.scene.isActive('Title')) break;
  }
  return { log, shown: m.shown, title: game.scene.isActive('Title') };
};
window.__clinicVerify = async (level, opts = {}) => {
  for (let i = 0; i < 60 && !__voice.allLoaded; i++) await new Promise((r) => setTimeout(r, 250));
  game.loop.raf.stop(); __voSim(true); if (!opts.render) __fast(true);
  await __mini('clinic', level, { first: !!opts.first, wait: 200 });
  __voLog.length = 0;
  const t0 = __voice.now();
  const r = await __clinicPlay(opts);
  for (let i = 0; i < 40 && !game.scene.isActive('Title'); i++) await __run(500);
  const vc = __voCheck(__voLog);
  __fast(false);
  return { level, opts, secs: Math.round((__voice.now() - t0) / 1000), title: game.scene.isActive('Title'), log: r.log, shown: r.shown,
    helps: __voLog.filter((e) => e.key === 'vo-help').length, problems: vc.problems, keys: __voLog.map((e) => e.key).join(' ') };
};
