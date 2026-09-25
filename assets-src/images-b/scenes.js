// Scene composer for the images-b preview. Every drawing is an <img> (like the game's SVG loader).
// Layout mirrors cooking-game/src/core/layout.ts + stage.ts (world 1080 high, width W from the screen ratio),
// with Mom standing in the character column and Pippa the hedgehog on the counter next to her.
(function () {
  const DIR = (window.IMAGES_B_DIR || "");
  const src = n => DIR + n + ".svg";

  // ---- art geometry (viewBox units) ----
  const ART = {
    doughR: 334, dough: 720, board: 820, boardH: 830, boardC: [410, 410],
    mom: { w: 800, h: 800, cx: 500, pivotL: [350, 505], pivotR: [650, 505] },
    pet: { w: 600, h: 700, foot: 684 },
    oven: { w: 700, h: 800, win: [150, 320, 400, 290], pizza: [350, 480, 320] },
    // demo-hand anchors (400x400 frames) — filled from README-mom.md
    hands: { point: [100, 100], roll: [140, 140], spread: [110, 250], sprinkle: [125, 115], grab: [110, 150] },
    hint: [53, 23],
  };

  // ---- the game's layout (layout.ts + stage.ts) ----
  function stage(W) {
    const H = 1080, m = W * 0.04, FIT_W = 1766;
    const k = Math.min(1, (W - 2 * m) / FIT_W, 1);
    const floor = H * 0.92, Y = v => floor - (floor - v) * k;
    const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
    const leftW = 480 * k, gap = 25 * k, BOARD_W = 786;
    const sideX = m + leftW / 2;
    const spare = W - 2 * m - leftW - BOARD_W * k - 2 * gap;
    const charScale = clamp(spare / (600 * k), 0.75, 1) * k;
    const charW = 600 * charScale, charLeft = W - m - charW;
    const character = { x: W - m - charW / 2, y: Y(1070) - 350 * charScale };
    const dishHome = { x: (m + leftW + charLeft) / 2, y: Y(590) };
    const homeScale = 0.85 * k, homeR = 120 * homeScale + 30 * k;
    const home = { x: m + homeR, y: homeR };
    const reach = 30 * k, binsTop = home.y + homeR + reach, binsBottom = Y(994) - reach, binsLeft = m + reach;
    const rowsOf = n => Math.max(1, Math.ceil(n / 2)), cellW = (leftW - reach) / 2;
    const cell = n => Math.min(cellW, (binsBottom - binsTop) / rowsOf(n));
    const binScale = n => (cell(n) - 10 * k) / 240;
    const bin = (i, n) => ({ x: binsLeft + cellW * ((i % 2) + 0.5), y: binsBottom - cell(n) * (rowsOf(n) - Math.floor(i / 2) - 0.5) });
    const ovenRoom = dishHome.x - (BOARD_W / 2) * k - gap - m;
    const ovenScale = clamp(ovenRoom / (628 * k), 0.75, 0.95) * k;
    const oven = { x: m + ovenRoom / 2, y: Y(600) };
    return { W, H, m, k, Y, sideX, charScale, charW, charLeft, character, dishHome, home, homeScale, bin, binScale, oven, ovenScale,
      done: { x: character.x, y: Y(170) }, play: { x: W / 2, y: H / 2 } };
  }

  // Mom + pet placement in the character column.
  function cast(S) {
    const s = S.charScale;                      // Mom at the character scale
    const momX = S.character.x, momLeft = momX - ART.mom.cx * s, momTop = 1080 - ART.mom.h * s;
    const petS = 0.4 * S.k;
    const pw = ART.pet.w * petS, ph = ART.pet.h * petS;
    const boardRight = S.dishHome.x + 393 * S.k, bodyLeft = momX - 190 * s;
    const gapW = bodyLeft - boardRight;
    const petCx = gapW >= pw * 0.7 ? (boardRight + bodyLeft) / 2 : boardRight - pw * 0.05;
    const pet = { x: petCx - pw / 2, y: S.Y(984) - ART.pet.foot * petS, w: pw, h: ph, s: petS };
    return { s, momX, momLeft, momTop, pet };
  }

  // The game multiplies 0xFFD49A onto the baked dish; the same multiply as an SVG colour matrix (works on <img> and canvas).
  const BAKED = "url(#bakeTint)";
  function ensureBakeFilter() {
    if (document.getElementById("bakeTint")) return;
    const d = document.createElement("div");
    d.innerHTML = '<svg width="0" height="0" style="position:absolute" aria-hidden="true"><filter id="bakeTint" color-interpolation-filters="sRGB">' +
      '<feColorMatrix type="matrix" values="1 0 0 0 0  0 0.831 0 0 0  0 0 0.604 0 0  0 0 0 1 0"/></filter></svg>';
    document.body.appendChild(d.firstChild);
  }

  function rng(seed) { return () => (seed = (seed * 16807) % 2147483647) / 2147483647; }

  // ---- drawing ops -> DOM <img> ----
  function mk(world, name, x, y, w, h, o) {
    o = o || {};
    const img = document.createElement("img");
    img.src = name.includes("/") || name.includes(".") ? name : src(name);
    img.alt = ""; img.draggable = false;
    Object.assign(img.style, { position: "absolute", left: x + "px", top: y + "px", width: w + "px", height: h + "px" });
    let t = "";
    if (o.rot) t += `rotate(${o.rot}deg)`;
    if (t) { img.style.transform = t; img.style.transformOrigin = o.origin || "50% 50%"; }
    if (o.filter) img.style.filter = o.filter;
    if (o.alpha != null) img.style.opacity = o.alpha;
    img.dataset.name = name;
    world.appendChild(img);
    return img;
  }
  // centred at (cx,cy) at scale s of native (vw,vh)
  function at(world, name, cx, cy, vw, vh, s, o) { return mk(world, name, cx - vw * s / 2, cy - vh * s / 2, vw * s, vh * s, o); }

  // ---- pieces ----
  function board(world, x, y, k) { at(world, "pizza-board", x, y + 5 * k, 820, 830, k); }

  // Pizza on the dish at (x,y), scale k. st: {sauce:0..1, cheese:0..1, tops:n, baked:bool, dough:0.45..1}
  function pizza(world, x, y, k, st) {
    st = st || {};
    const f = st.baked ? BAKED : null;
    const dk = k * (st.dough == null ? 1 : st.dough);
    at(world, "dough-flat", x, y, 720, 720, dk, { filter: f });
    const r = rng(st.seed || 7), R = 290 * k;
    if (st.sauce) {
      const spots = [];
      for (let ring = 0; ring < 4; ring++) {
        const cnt = [1, 6, 11, 15][ring], rr = [0, 95, 180, 250][ring] * k;
        for (let i = 0; i < cnt; i++) spots.push([Math.cos(i / cnt * 6.283 + ring) * rr, Math.sin(i / cnt * 6.283 + ring) * rr]);
      }
      const nS = Math.round(spots.length * st.sauce);
      for (const [dx, dy] of spots.slice(0, nS)) { const d = 175 * k; mk(world, "sauce-blob", x + dx - d / 2, y + dy - d / 2, d, d, { rot: r() * 360, filter: f }); }
    }
    if (st.cheese) {
      const nC = Math.round(70 * st.cheese);
      for (let i = 0; i < nC; i++) { const a = r() * 6.283, rr = Math.sqrt(r()) * 262 * k; at(world, "cheese-shred", x + Math.cos(a) * rr, y + Math.sin(a) * rr, 80, 44, k, { rot: r() * 360, filter: f }); }
    }
    const names = ["tomato", "olive", "mushroom", "corn", "pepper", "onion"];
    const pos = [[-150, -150], [45, -205], [190, -70], [-215, 30], [-20, -30], [150, 120], [-120, 180], [55, 205], [-60, 90], [120, -170], [230, 60], [-190, -60]];
    for (let i = 0; i < (st.tops || 0); i++) {
      const [dx, dy] = pos[i % pos.length];
      at(world, "topping-" + names[i % 6], x + dx * k, y + dy * k, 140, 140, k, { rot: r() * 60 - 30, filter: f });
    }
  }

  function mom(world, S, C, o) {
    o = o || {};
    const s = C.s, x = C.momLeft, y = C.momTop, w = 800 * s, h = 800 * s;
    const eyes = "mom-eyes-" + (o.eyes || "open"), mouth = "mom-mouth-" + (o.mouth || "smile");
    const arm = (name, rot, piv) => mk(world, name, x, y, w, h, rot ? { rot, origin: `${piv[0] / 8}% ${piv[1] / 8}%` } : {});
    if (!o.noArmR) arm("mom-arm-right", o.armR || 0, ART.mom.pivotR);
    for (const n of ["mom-body", "mom-head", "mom-hair", eyes, mouth]) mk(world, n, x, y, w, h);
    return () => { if (!o.noArmL) arm("mom-arm-left", o.armL || 0, ART.mom.pivotL); };  // drawn later (over the dish)
  }

  function pet(world, C, o, override) {
    o = o || {};
    const p = override || C.pet;
    for (const n of ["character-body", "character-eyes-" + (o.eyes || "open"), "character-mouth-" + (o.mouth || "closed")]) mk(world, n, p.x, p.y, p.w, p.h);
  }

  function hand(world, kind, x, y, s, rot) {
    const a = ART.hands[kind];
    mk(world, "mom-hand-" + kind, x - a[0] * s, y - a[1] * s, 400 * s, 400 * s, rot ? { rot, origin: `${a[0] / 4}% ${a[1] / 4}%` } : {});
  }

  function homeBtn(world, S) { at(world, "btn-home", S.home.x, S.home.y, 240, 240, S.homeScale); }

  function bg(world, W) {
    // 2400x1080 art: bottom-centre anchored; at 20:9 it fits exactly, narrower screens crop the sides.
    const k = Math.max(W / 2400, 1);
    mk(world, "bg-kitchen-landscape", (W - 2400 * k) / 2, 1080 - 1080 * k, 2400 * k, 1080 * k);
  }

  // ---- scenes ----
  const SCENES = {
    title(world, S, C) {
      const armL = mom(world, S, C, { eyes: "happy", mouth: "open" });
      armL();
      if (S.W >= 1700) pet(world, C, { eyes: "happy", mouth: "open" });
      // a finished pizza on its board, peeking in from the left, as the "promise" of the game
      if (S.W >= 1700) { board(world, S.m + 330 * S.k, S.Y(760), 0.62 * S.k); pizza(world, S.m + 330 * S.k, S.Y(760) - 3, 0.62 * S.k, { sauce: 1, cheese: 1, tops: 9, baked: true, seed: 3 }); }
      at(world, "btn-play", S.play.x, S.play.y, 240, 240, 1.4 * S.k);
    },
    home(world, S, C) {
      const armL = mom(world, S, C, { eyes: "open", mouth: "talk" });
      at(world, "card-pizza", S.W / 2, 540, 400, 520, 1.25 * S.k, { rot: -3 });
      armL();
      if (S.W >= 1700) pet(world, C, { eyes: "happy", mouth: "closed" });
      hand(world, "point", S.W / 2 + 40 * S.k, 560, 0.62 * S.k);
    },
    roll(world, S, C) {
      homeBtn(world, S);
      const d = S.dishHome;
      const armL = mom(world, S, C, { eyes: "happy", mouth: "talk", noArmL: false });
      board(world, d.x, d.y, S.k);
      pizza(world, d.x, d.y, S.k, { dough: 0.72 });
      at(world, "rolling-pin", d.x + 10 * S.k, d.y + 40 * S.k, 640, 200, S.k, { rot: -8 });
      armL();
      if (S.W >= 1700) pet(world, C, { eyes: "open", mouth: "closed" });
      hand(world, "roll", d.x + 120 * S.k, d.y + 30 * S.k, 0.66 * S.k, 0);
    },
    spread(world, S, C) {
      homeBtn(world, S);
      const d = S.dishHome;
      const armL = mom(world, S, C, { eyes: "open", mouth: "smile" });
      at(world, "sauce-bowl", S.sideX, d.y + 40 * S.k, 340, 300, S.k);
      board(world, d.x, d.y, S.k);
      pizza(world, d.x, d.y, S.k, { sauce: 0.45 });
      armL();
      if (S.W >= 1700) pet(world, C, { eyes: "surprised", mouth: "open" });
      hand(world, "spread", d.x + 60 * S.k, d.y + 80 * S.k, 0.66 * S.k);
    },
    sprinkle(world, S, C) {
      homeBtn(world, S);
      const d = S.dishHome;
      const armL = mom(world, S, C, { eyes: "happy", mouth: "open", noArmL: false });
      at(world, "cheese-shaker", S.sideX, d.y, 260, 400, S.k);
      board(world, d.x, d.y, S.k);
      pizza(world, d.x, d.y, S.k, { sauce: 1, cheese: 0.45 });
      armL();
      if (S.W >= 1700) pet(world, C, { eyes: "happy", mouth: "closed" });
      hand(world, "sprinkle", d.x + 40 * S.k, d.y - 40 * S.k, 1.1 * S.k);
    },
    decorate(world, S, C) {
      homeBtn(world, S);
      const d = S.dishHome, names = ["tomato", "olive", "mushroom", "corn", "pepper", "onion"];
      const armL = mom(world, S, C, { eyes: "open", mouth: "smile" });
      const bs = S.binScale(6);
      names.forEach((n, i) => { const b = S.bin(i, 6); at(world, "topping-bin", b.x, b.y, 240, 240, bs); at(world, "topping-" + n, b.x, b.y - 8 * bs, 140, 140, S.k); });
      board(world, d.x, d.y, S.k);
      pizza(world, d.x, d.y, S.k, { sauce: 1, cheese: 1, tops: 5 });
      armL();
      at(world, "btn-done", S.done.x, S.done.y, 240, 240, S.k);
      if (S.W >= 1700) pet(world, C, { eyes: "surprised", mouth: "open" });
      // Mom's hand dragging an olive from its bin to the pizza
      const gx = (S.bin(1, 6).x + d.x) / 2 + 60 * S.k, gy = d.y - 120 * S.k;
      at(world, "topping-olive", gx, gy, 140, 140, S.k * 1.1);
      hand(world, "grab", gx, gy, 0.66 * S.k);
    },
    bake(world, S, C) {
      homeBtn(world, S);
      const d = S.dishHome, o = S.oven, s = S.ovenScale;
      const ox = o.x - 350 * s, oy = o.y - 400 * s;
      // aim the pointing arm at the oven window: rotate about the shoulder by (target angle - drawn angle)
      const px = C.momLeft + ART.mom.pivotL[0] * C.s, py = C.momTop + ART.mom.pivotL[1] * C.s;
      const aim = Math.atan2(oy + 465 * s - py, ox + 350 * s - px) * 180 / Math.PI;
      const drawn = Math.atan2(378 - 505, 37 - 350) * 180 / Math.PI;   // shoulder -> fingertip in the art
      let rot = aim - drawn; rot = ((rot + 540) % 360) - 180;
      const armL = mom(world, S, C, { eyes: "surprised", mouth: "open", armL: S.W >= 1700 ? 0 : Math.max(-20, Math.min(20, rot)) });   // with Pippa on the counter the default pose keeps the arm above her
      board(world, d.x, d.y, S.k);
      mk(world, "oven-inside", ox, oy, 700 * s, 800 * s);
      const pk = 320 / 668 * s;   // pizza scaled to the window (diameter 320 in oven units)
      pizza(world, ox + 350 * s, oy + 480 * s, pk, { sauce: 1, cheese: 1, tops: 9, baked: true, seed: 5 });
      mk(world, "oven-closed", ox, oy, 700 * s, 800 * s);
      armL();
      if (S.W >= 1700) pet(world, C, { eyes: "surprised", mouth: "open" });
      hand(world, "point", ox + 560 * s, oy + 380 * s, 0.62 * S.k);
    },
    feed(world, S, C) {
      homeBtn(world, S);
      const d = S.dishHome, k = S.k;
      // Pippa is the star of this step: big, on the counter at the board's right rim; Mom behind her, pointing at her.
      const armL = mom(world, S, C, { eyes: "happy", mouth: "smile", armL: -18 });
      board(world, d.x, d.y, k);
      // five slices left on the board (tips at the centre), one on its way to Pippa
      for (let i = 0; i < 5; i++) {
        const a = -90 + i * 60 + 60, rr = 135 * k, rad = a * Math.PI / 180;
        at(world, "pizza-slice", d.x + Math.cos(rad) * rr, d.y + Math.sin(rad) * rr, 300, 300, 1.05 * k, { rot: a - 90 + 180, filter: BAKED });
      }
      armL();
      const ps = 0.62 * k, pw = 600 * ps, ph = 700 * ps;
      const boardRight = d.x + 393 * k;
      const faceLeft = C.momLeft + (500 - 150) * C.s;      // Mom's face must stay visible
      const px = Math.min(boardRight - pw * 0.25, faceLeft - pw * 0.92);
      const P = { x: px, y: S.Y(1000) - 684 * ps, w: pw, h: ph };
      pet(world, C, { eyes: "surprised", mouth: "open" }, P);
      // the carried slice: tip pointing right at her mouth, just left of it
      const mx = P.x + 300 * ps, my = P.y + 435 * ps;
      const sx = mx - 150 * k - 95 * ps, sy = my + 10 * k;
      at(world, "pizza-slice", sx, sy, 300, 300, 1.0 * k, { rot: -90, filter: BAKED });
      hand(world, "grab", sx - 70 * k, sy + 10 * k, 0.6 * k);
    },
    party(world, S, C) {
      const d = S.dishHome, k = S.k;
      const armL = mom(world, S, C, { eyes: "happy", mouth: "open", armL: 55 });
      board(world, d.x, d.y, k);
      pizza(world, d.x, d.y - 3, k, { sauce: 1, cheese: 1, tops: 12, baked: true, seed: 4 });
      armL();
      const ps = 0.55 * k, pw = 600 * ps;
      if (S.W >= 1700) pet(world, C, { eyes: "happy", mouth: "open" }, { x: d.x + 393 * k - pw * 0.35, y: S.Y(1000) - 684 * ps, w: pw, h: 700 * ps });
      // a shower of stars over the top of the scene and the empty board, never over the faces
      const r = rng(9), faceL = C.momLeft + 300 * C.s, faceR = C.momLeft + 700 * C.s;
      let placed = 0;
      while (placed < 14) {
        const x = S.m + r() * (S.W - 2 * S.m), y = 40 + r() * 330, sc = (0.35 + r() * 0.45) * k;
        if (x > faceL - 90 && x < faceR + 90 && y > C.momTop + 40 * C.s) continue;
        if (Math.hypot(x - d.x, y - d.y) < 420 * k) continue;
        if (Math.abs(x - S.W / 2) < 280 * k && y < 260) continue;
        at(world, "star", x, y, 200, 200, sc, { rot: r() * 60 - 30 }); placed++;
      }
      at(world, "star", S.W / 2 - 190 * k, 150, 200, 200, 0.9 * k, { rot: -10 });
      at(world, "star", S.W / 2, 120, 200, 200, 1.15 * k);
      at(world, "star", S.W / 2 + 190 * k, 150, 200, 200, 0.9 * k, { rot: 10 });
    },
  };
  const ORDER = [["title", "Title"], ["home", "Home: pizza card"], ["roll", "Roll the dough"], ["spread", "Spread the sauce"], ["sprinkle", "Sprinkle the cheese"],
    ["decorate", "Decorate: six bins"], ["bake", "Bake: pizza behind the oven window"], ["feed", "Feed Pippa"], ["party", "Celebration"]];

  // Build a scene into `host` (a positioned element whose width is the display width). Returns the world div.
  function build(host, name, W) {
    const S = stage(W), C = cast(S);
    host.innerHTML = "";
    host.style.position = "relative"; host.style.overflow = "hidden";
    const world = document.createElement("div");
    Object.assign(world.style, { position: "absolute", left: 0, top: 0, width: W + "px", height: "1080px", transformOrigin: "0 0" });
    host.appendChild(world);
    ensureBakeFilter();
    const fit = () => { world.style.transform = `scale(${host.clientWidth / W})`; host.style.height = host.clientWidth * 1080 / W + "px"; };
    fit(); new ResizeObserver(fit).observe(host);
    bg(world, W);
    SCENES[name](world, S, C);
    return world;
  }

  // Replace a built world by a canvas drawn exactly like Phaser does: rasterise each SVG at native size, then drawImage.
  async function toCanvas(host, world, W) {
    const imgs = [...world.querySelectorAll("img")];
    await Promise.all(imgs.map(i => i.decode().catch(() => console.error("FAILED " + i.src))));
    const c = document.createElement("canvas"); c.width = W; c.height = 1080;
    const g = c.getContext("2d");
    const cache = new Map();
    for (const i of imgs) {
      const x = parseFloat(i.style.left), y = parseFloat(i.style.top), w = parseFloat(i.style.width), h = parseFloat(i.style.height);
      let t = cache.get(i.src);
      if (!t) { t = document.createElement("canvas"); t.width = i.naturalWidth; t.height = i.naturalHeight; t.getContext("2d").drawImage(i, 0, 0); cache.set(i.src, t); }
      const m = /rotate\(([-\d.e]+)deg\)/.exec(i.style.transform || "");
      const og = (i.style.transformOrigin || "50% 50%").split(" ").map(parseFloat);
      const ox = x + w * og[0] / 100, oy = y + h * og[1] / 100;
      g.save(); g.globalAlpha = i.style.opacity ? +i.style.opacity : 1;
      if (i.style.filter) g.filter = i.style.filter;
      g.translate(ox, oy); if (m) g.rotate(+m[1] * Math.PI / 180);
      g.drawImage(t, x - ox, y - oy, w, h); g.restore();
    }
    c.style.width = "100%"; c.style.display = "block";
    world.replaceWith(c);
    return c;
  }

  window.ScenesB = { ART, stage, cast, build, toCanvas, ORDER, SCENES };
})();
