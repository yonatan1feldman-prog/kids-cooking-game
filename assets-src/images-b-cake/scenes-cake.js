// Birthday-cake scenes for images-b-cake, composed with the existing composers, read-only: ../images-b/scenes.js
// (world 1080 high, width W from the screen ratio, stage()/cast() layout, background, Mom, Pippa, the oven),
// ../images-b-prep/scenes-prep.js (the big bowl, the wooden spoon, the frame), ../images-b-cookies/scenes-cookies.js
// (sprinkles and candy dots) and ../images-b-pancakes/scenes-pancakes.js (berries).
// New assets load from this folder, "b:" images-b, "p:" images-b-prep, "s:" images-b-salad, "c:" images-b-cookies,
// "m:" images-b-smoothie, "k:" images-b-pancakes.
// Every drawing is an <img>. The batter stream and the flying sprinkles are drawn by the game in code; here existing
// files stand in for them. frosting-blob is drawn NEUTRAL and TINTED here with the same multiply the game uses.
// toCanvas() draws the scene the way the game does (img -> native canvas -> drawImage) and honours data-crop and
// data-wedge (the wedge clip = the very component that cuts the pizza).
(function () {
  const B = window.IMAGES_B_DIR || "../images-b/", PR = window.PREP_BASE || "../images-b-prep/", SA = window.SALAD_BASE || "../images-b-salad/";
  const CO = window.COOKIES_BASE || "../images-b-cookies/", SM = window.SMOOTHIE_BASE || "../images-b-smoothie/";
  const PK = window.PANCAKES_BASE || "../images-b-pancakes/", SO = window.SOUP_BASE || "../images-b-soup/";
  const HERE = window.CAKE_BASE || "./";
  const SB = window.ScenesB, SP = window.ScenesPrep;
  const ART = SB.ART, PREP = SP.PREP;
  const DIR = { "b:": B, "p:": PR, "s:": SA, "c:": CO, "m:": SM, "k:": PK, "u:": SO };
  const src = n => (DIR[n.slice(0, 2)] ? DIR[n.slice(0, 2)] + n.slice(2) : HERE + n) + ".svg";

  // geometry of the new files (see README-cake.md); tools/check_cake.py compares every number here with the generators
  const CAKE = {
    bowl: [640, 520], bowlOpen: [320, 176, 262, 74],            // = images-b-prep prep-bowl-back/-front, sauce-stage-*
    pan: { w: 800, h: 800, c: [400, 400], r: 370, lip: 348, floorR: 334, batR: 316 },
    baked: { w: 720, h: 720, c: [360, 356], r: 334, faceR: 290 },   // == images-b/dough-flat
    plate: { w: 820, h: 830, c: [410, 408], r: 389 },                // == images-b/pizza-board
    tub: { w: 320, h: 360, base: [160, 336], top: [160, 140], orx: 132, ory: 54 },
    blob: { w: 200, h: 200, at: [100, 100], r: 68 },                 // == images-b/sauce-blob
    stamp: 140,
    candle: { w: 260, h: 460, base: [130, 414], flame: [130, 90] },  // base anchor / flame point
    flame: { w: 200, h: 280, base: [100, 236] },
    smoke: { w: 240, h: 360, base: [120, 340] },
    seats: [[0, -150], [143, -46], [88, 121], [-88, 121], [-143, -46]],  // candle base anchors, in cake units from the cake centre (a 150 ring)
    candles: 5,
    panInOven: [350, 468, 0.36],                                     // oven units (700x800 frame, window 150..550 x 320..610)
    card: [400, 520], frame: [700, 780], frameWin: [80, 80, 540, 540],
    candleS: 0.62,                                                   // candle scale relative to the cake scale
  };
  // the game's tint of the NEUTRAL frosting-blob (#FAF5EC) to each tub colour: a plain multiply, as feColorMatrix
  const TINT = { pink: [0.980, 0.584, 0.744], white: [1, 1, 1], choc: [0.488, 0.302, 0.190] };
  function ensureTints() {
    if (document.getElementById("tintpink")) return;
    let f = "";
    for (const k in TINT) {
      const [r, g, b] = TINT[k];
      f += `<filter id="tint${k}" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="${r} 0 0 0 0  0 ${g} 0 0 0  0 0 ${b} 0 0  0 0 0 1 0"/></filter>`;
    }
    const d = document.createElement("div");
    d.innerHTML = `<svg width="0" height="0" style="position:absolute" aria-hidden="true">${f}</svg>`;
    document.body.appendChild(d.firstChild);
  }
  const tint = k => k === "white" ? null : `url(#tint${k})`;

  function mk(world, name, x, y, w, h, o) {
    o = o || {};
    const img = document.createElement("img");
    img.src = src(name); img.alt = ""; img.draggable = false;
    Object.assign(img.style, { position: "absolute", left: x + "px", top: y + "px", width: w + "px", height: h + "px" });
    if (o.rot) { img.style.transform = `rotate(${o.rot}deg)`; img.style.transformOrigin = o.origin || "50% 50%"; }
    if (o.filter) img.style.filter = o.filter;
    if (o.alpha != null) img.style.opacity = o.alpha;
    if (o.crop != null) {
      const c = Array.isArray(o.crop) ? o.crop : [0, 0, o.crop, 1];
      img.dataset.crop = c.join(",");
      img.style.clipPath = `inset(${c[1] * 100}% ${(1 - c[2]) * 100}% ${(1 - c[3]) * 100}% ${c[0] * 100}%)`;
    }
    // A wedge cut. o.wedge = {ox, oy, a0, a1}: the apex is (ox, oy) world px from the sprite's own centre, BEFORE any
    // rotation, and a0..a1 are degrees clockwise from 3 o'clock in the cake's own frame. The apex may lie far outside
    // the sprite, which is exactly the case for a frosting stamp near the rim, so the rays are drawn very long.
    if (o.wedge) {
      const { ox, oy, a0, a1 } = o.wedge;
      const fx = 50 + ox / w * 100, fy = 50 + oy / h * 100, R = 900;
      const pts = [[fx, fy]];
      for (let a = a0; a <= a1 + 0.001; a += Math.min(5, (a1 - a0) / 8))
        pts.push([fx + Math.cos(a * Math.PI / 180) * R, fy + Math.sin(a * Math.PI / 180) * R]);
      img.dataset.wedge = [ox, oy, a0, a1].join(",");
      img.style.clipPath = "polygon(" + pts.map(q => q[0].toFixed(2) + "% " + q[1].toFixed(2) + "%").join(",") + ")";
    }
    world.appendChild(img);
    return img;
  }
  const at = (world, name, cx, cy, vw, vh, s, o) => mk(world, name, cx - vw * s / 2, cy - vh * s / 2, vw * s, vh * s, o);
  const anchor = (world, name, x, y, vw, vh, ax, ay, s, o) => {
    o = Object.assign({}, o); if (o.rot) o.origin = `${ax / vw * 100}% ${ay / vh * 100}%`;
    return mk(world, name, x - ax * s, y - ay * s, vw * s, vh * s, o);
  };
  function rng(seed) { return () => (seed = (seed * 16807) % 2147483647) / 2147483647; }
  const wide = S => S.W >= 1700;

  function mom(world, S, C, o) {
    o = o || {};
    const s = C.s, x = C.momLeft, y = C.momTop, w = 800 * s, h = 800 * s;
    const arm = (name, rot, piv) => mk(world, name, x, y, w, h, rot ? { rot, origin: `${piv[0] / 8}% ${piv[1] / 8}%` } : {});
    if (!o.noArmR) arm("b:mom-arm-right", o.armR || 0, ART.mom.pivotR);
    for (const n of ["b:mom-body", "b:mom-head", "b:mom-hair", "b:mom-eyes-" + (o.eyes || "open"), "b:mom-mouth-" + (o.mouth || "smile")]) mk(world, n, x, y, w, h);
    return () => { if (!o.noArmL) arm("b:mom-arm-left", o.armL || 0, ART.mom.pivotL); };
  }
  function pet(world, C, o, P) {
    o = o || {}; P = P || C.pet;
    for (const n of ["b:character-body", "b:character-eyes-" + (o.eyes || "open"), "b:character-mouth-" + (o.mouth || "closed")]) mk(world, n, P.x, P.y, P.w, P.h);
  }
  function hand(world, kind, x, y, s, rot) {
    const a = ART.hands[kind];
    mk(world, "b:mom-hand-" + kind, x - a[0] * s, y - a[1] * s, 400 * s, 400 * s, rot ? { rot, origin: `${a[0] / 4}% ${a[1] / 4}%` } : {});
  }
  const homeBtn = (world, S) => at(world, "b:btn-home", S.home.x, S.home.y, 240, 240, S.homeScale);

  // ---- pieces ----------------------------------------------------------------------------------------------------
  // The big prep bowl with a batter stage inside: back -> contents -> front, all at the same position.
  function batterBowl(world, cx, cy, s, stage, between) {
    const [W, H] = CAKE.bowl, x = cx - W * s / 2, y = cy - H * s / 2;
    mk(world, "p:prep-bowl-back", x, y, W * s, H * s);
    if (stage != null) mk(world, "cake-batter-" + stage, x, y, W * s, H * s);
    if (between) between((ax, ay) => [x + ax * s, y + ay * s]);
    mk(world, "p:prep-bowl-front", x, y, W * s, H * s);
    return { x, y, open: [x + CAKE.bowlOpen[0] * s, y + CAKE.bowlOpen[1] * s] };
  }

  // The plate and the baked cake, registered centre on centre: (X,Y) = the shared CENTRE, s = scale.
  // cake-plate's centre (410,408) sits 7 above its frame centre; cake-baked's (360,356) sits 4 above its frame centre.
  function cakeOnPlate(world, X, Y, s, o) {
    o = o || {};
    const rot = o.rot || 0, c = Math.cos(rot * Math.PI / 180), sn = Math.sin(rot * Math.PI / 180);
    if (o.plate !== false) at(world, "cake-plate", X, Y + 7 * s, CAKE.plate.w, CAKE.plate.h, s);
    // cake-baked's frame centre is (360,360) but the cake's centre is (360,356): the wedge apex is 4 units above it
    if (o.cake !== false) at(world, "cake-baked", X, Y + 4 * s, CAKE.baked.w, CAKE.baked.h, s,
      { wedge: apex(o.wedge, 0, -4 * s), rot });
    // cake-file offsets from the cake centre -> world, turned with the cake
    return (fx, fy) => [X + (fx * c - fy * sn) * s, Y + (fx * sn + fy * c) * s];
  }
  // a0..a1 = the sector that is KEPT, in degrees clockwise from 3 o'clock in the cake's own frame
  const wedge = (a0, a1) => ({ a0, a1 });
  // the same wedge for one sprite: its apex sits (ox, oy) world px from that sprite's centre, before any rotation
  const apex = (w, ox, oy) => w && { ox, oy, a0: w.a0, a1: w.a1 };
  // is a cake-unit offset inside the kept sector?
  function inWedge(w, dx, dy) {
    if (!w) return true;
    let a = Math.atan2(dy, dx) * 180 / Math.PI;
    while (a < w.a0) a += 360;
    return a <= w.a1;
  }

  // The spread field of frosting: tinted frosting-blob stamps over the cake face (exactly the game's brush).
  const FIELD = (() => {
    const p = [[0, 0]];
    for (let i = 0; i < 6; i++) p.push([Math.cos(i / 6 * 6.283) * 120, Math.sin(i / 6 * 6.283) * 120]);
    for (let i = 0; i < 11; i++) p.push([Math.cos(i / 11 * 6.283 + .3) * 208, Math.sin(i / 11 * 6.283 + .3) * 208]);
    return p;
  })();
  function frosting(world, P, s, kind, upto, o) {
    o = o || {};
    const bs = 1.5 * s, n = upto == null ? FIELD.length : upto;
    for (let i = 0; i < n; i++) {
      const [dx, dy] = FIELD[i];
      if (!inWedge(o.wedge, dx, dy)) continue;
      const [x, y] = P(dx, dy);
      at(world, "frosting-blob", x, y, CAKE.blob.w, CAKE.blob.h, bs,
        { filter: tint(kind), rot: o.rot || 0, wedge: apex(o.wedge, -dx * s, -dy * s) });
    }
  }
  // Decorations scattered on the frosted face.
  const DECOR = [["choc-chip", -190, -50, .62], ["c:candy-dot", -108, 96, .7], ["choc-chip", -30, -140, .58],
    ["k:berry", 86, -112, .62], ["c:candy-dot", 178, 34, .66], ["choc-chip", 120, 130, .6],
    ["c:sprinkles-cluster", -150, 152, .9], ["c:sprinkles-cluster", 214, -108, .82], ["choc-chip", 24, 44, .56],
    ["k:berry", -216, 62, .58], ["c:candy-dot", 64, 210, .62], ["choc-chip", 212, 148, .54]];
  function decorate(world, P, s, upto, o) {
    o = o || {};
    const n = upto == null ? DECOR.length : upto;
    for (let i = 0; i < n; i++) {
      const [nm, dx, dy, sc] = DECOR[i];
      if (!inWedge(o.wedge, dx, dy)) continue;
      const [x, y] = P(dx, dy);
      at(world, nm, x, y, CAKE.stamp, CAKE.stamp, sc * 1.5 * s, { rot: (i * 53) % 90 - 45 + (o.rot || 0) });   // decorations are small: the sector test is enough
    }
  }
  // The candles in their seats. state: "off" | "lit" | "smoke"; skip = a seat left empty (the one still in her hand).
  function candles(world, P, s, state, skip, o) {
    o = o || {};
    const cs = CAKE.candleS * s, C_ = CAKE.candle, F = CAKE.flame, K = CAKE.smoke;
    const order = CAKE.seats.map((v, i) => [v, i]).sort((a, b) => a[0][1] - b[0][1]);   // back candles first
    for (const [[dx, dy], i] of order) {
      if (i === skip || !inWedge(o.wedge, dx, dy)) continue;
      const [x, y] = P(dx, dy);
      anchor(world, "candle", x, y, C_.w, C_.h, C_.base[0], C_.base[1], cs);
      const fx = x + (C_.flame[0] - C_.base[0]) * cs, fy = y + (C_.flame[1] - C_.base[1]) * cs;
      if (state === "lit") anchor(world, "flame-candle", fx, fy, F.w, F.h, F.base[0], F.base[1], cs * 1.05);
      if (state === "smoke") anchor(world, "smoke-puff", fx, fy, K.w, K.h, K.base[0], K.base[1], cs * (0.8 + (i % 3) * 0.12));
    }
  }
  // one tub, centred on its BASE contact point (x, y)
  const tubAt = (world, kind, x, y, s, rot) =>
    anchor(world, "frosting-tub-" + kind, x, y, CAKE.tub.w, CAKE.tub.h, CAKE.tub.base[0], CAKE.tub.base[1], s, { rot });

  const SCENES = {
    // 0. choose the recipe: the cake card beside the six earlier ones
    "cake-home"(world, S, C) {
      const k = S.k, armL = mom(world, S, C, { eyes: "open", mouth: "talk" });
      const cx = (wide(S) ? S.dishHome.x : S.dishHome.x - 40 * k) - 300 * k;
      [["b:card-pizza", -5, 640], ["s:card-salad", 2, 630], ["c:card-cookies", -3, 640], ["m:card-smoothie", 3, 630],
       ["k:card-pancakes", -4, 634], ["u:card-soup", 3, 640]]
        .forEach(([n, rot, y], i) => at(world, n, cx - 600 * k + i * 190 * k, y, 400, 520, 0.54 * k, { rot }));
      at(world, "card-cake", cx + 580 * k, 560, 400, 520, 0.92 * k, { rot: 4 });
      armL();
      if (wide(S)) pet(world, C, { eyes: "happy", mouth: "open" });
    },
    // 1. stir the batter: the big bowl with cake-batter-2 and the wooden spoon; the four stages down the side
    "cake-stir"(world, S, C) {
      homeBtn(world, S);
      const d = S.dishHome, k = S.k, s = 1.15 * k;
      const armL = mom(world, S, C, { eyes: "happy", mouth: "talk", armL: -10 });
      batterBowl(world, d.x - 40 * k, S.Y(760), s, 2, Pb => {
        const [sx, sy] = Pb(470, 150);
        anchor(world, "p:spoon-wood", sx, sy, 240, 620, ...PREP.spoon, 0.86 * k, { rot: 26 });
      });
      armL();
      if (wide(S)) pet(world, C, { eyes: "happy", mouth: "open" });
      // the four stages, standing on the counter in the side column
      [0, 1, 2, 3].forEach(i => {
        const bs = 0.34 * k, cx = S.sideX + (i % 2 ? 108 : -108) * k, cy = S.Y(620 + Math.floor(i / 2) * 250);
        const x = cx - CAKE.bowl[0] * bs / 2, y = cy - CAKE.bowl[1] * bs / 2;
        mk(world, "p:prep-bowl-back", x, y, CAKE.bowl[0] * bs, CAKE.bowl[1] * bs);
        mk(world, "cake-batter-" + i, x, y, CAKE.bowl[0] * bs, CAKE.bowl[1] * bs);
        mk(world, "p:prep-bowl-front", x, y, CAKE.bowl[0] * bs, CAKE.bowl[1] * bs);
      });
    },
    // 2. pour the batter into the pan: the pan already filling, the bowl tipped over its rim
    "cake-pour"(world, S, C) {
      homeBtn(world, S);
      const d = S.dishHome, k = S.k, ps = 0.66 * k;
      const armL = mom(world, S, C, { eyes: "surprised", mouth: "open", armL: 20 });
      const px = d.x + 80 * k, py = S.Y(760);
      at(world, "cake-pan-full", px, py, CAKE.pan.w, CAKE.pan.h, ps);
      // the falling batter (the game draws the stream in code; the pancake batter puddle stands in for the dollops)
      [[-70, -170, .34], [-104, -270, .26], [-130, -350, .18]].forEach(([dx, dy, sc]) =>
        at(world, "k:batter-puddle-1", px + dx * k, py + dy * k, 680, 680, sc * k));
      const bs = 0.8 * k, bx = px - 300 * k, by = py - 490 * k;
      at(world, "p:prep-bowl-back", bx, by, CAKE.bowl[0], CAKE.bowl[1], bs, { rot: 34 });
      at(world, "cake-batter-3", bx, by, CAKE.bowl[0], CAKE.bowl[1], bs, { rot: 34 });
      at(world, "p:prep-bowl-front", bx, by, CAKE.bowl[0], CAKE.bowl[1], bs, { rot: 34 });
      hand(world, "grab", bx - 215 * k, by + 150 * k, 0.56 * k, -24);
      armL();
      if (wide(S)) pet(world, C, { eyes: "surprised", mouth: "open" });
      at(world, "cake-pan", S.sideX, S.Y(660), CAKE.pan.w, CAKE.pan.h, 0.44 * k);
      at(world, "p:oven-mitts", S.sideX, S.Y(930), 480, 400, 0.62 * k);
    },
    // 3. bake: the full pan behind the oven window
    "cake-oven"(world, S, C) {
      homeBtn(world, S);
      const o = S.oven, s = S.ovenScale, k = S.k, d = S.dishHome;
      const armL = mom(world, S, C, { eyes: "surprised", mouth: "open" });
      const ox = o.x - 350 * s, oy = o.y - 400 * s;
      mk(world, "b:oven-inside", ox, oy, 700 * s, 800 * s);
      const [pcx, pcy, pss] = CAKE.panInOven;
      at(world, "cake-pan-full", ox + pcx * s, oy + pcy * s, CAKE.pan.w, CAKE.pan.h, pss * s);
      mk(world, "b:oven-closed", ox, oy, 700 * s, 800 * s);
      // what is left on the counter while it bakes: the scraped bowl, the mitts and the empty second pan
      at(world, "p:prep-bowl-back", d.x + 60 * k, S.Y(880), CAKE.bowl[0], CAKE.bowl[1], 0.62 * k);
      at(world, "cake-batter-3", d.x + 60 * k, S.Y(880), CAKE.bowl[0], CAKE.bowl[1], 0.62 * k);
      at(world, "p:prep-bowl-front", d.x + 60 * k, S.Y(880), CAKE.bowl[0], CAKE.bowl[1], 0.62 * k);
      at(world, "p:oven-mitts", d.x - 330 * k, S.Y(940), 480, 400, 0.72 * k, { rot: -10 });
      armL();
      if (wide(S)) pet(world, C, { eyes: "surprised", mouth: "open" });
      hand(world, "point", ox + 616 * s, oy + 440 * s, 0.6 * k);
    },
    // 4. choose a frosting: the bare baked cake on its plate, the three tubs in a row, a finger on the pink one
    "cake-choose"(world, S, C) {
      homeBtn(world, S);
      const d = S.dishHome, k = S.k;
      const armL = mom(world, S, C, { eyes: "happy", mouth: "talk" });
      cakeOnPlate(world, d.x + 20 * k, S.Y(560), 0.58 * k);
      const ts = 0.92 * k, y = S.Y(990);
      ["pink", "white", "choc"].forEach((kd, i) => tubAt(world, kd, d.x + (i - 1) * 280 * k - 70 * k, y, ts, (i - 1) * 4));
      hand(world, "point", d.x - 400 * k, y - 350 * ts, 0.7 * k, 6);
      armL();
      if (wide(S)) pet(world, C, { eyes: "happy", mouth: "open" });
      // the side column stands on the counter, never on the wall
      ["pink", "white", "choc"].forEach((kd, i) => tubAt(world, kd, S.sideX + (i - 1) * 120 * k, S.Y(700 + (i % 2) * 190), 0.44 * k));
    },
    // 5. spread the frosting: half the face covered with pink blobs, the spatula dragging the edge of the field
    "cake-spread"(world, S, C) {
      homeBtn(world, S);
      const d = S.dishHome, k = S.k, s = 0.86 * k;
      const armL = mom(world, S, C, { eyes: "happy", mouth: "smile", armL: -8 });
      const P = cakeOnPlate(world, d.x, S.Y(600), s);
      frosting(world, P, s, "pink", 12);
      const [ex, ey] = P(150, 130);
      anchor(world, "p:spoon-wood", ex, ey, 240, 620, ...PREP.spoon, 0.9 * k, { rot: 52 });
      hand(world, "spread", ex + 180 * k, ey - 250 * k, 0.6 * k, 18);
      armL();
      if (wide(S)) pet(world, C, { eyes: "happy", mouth: "closed" });
      tubAt(world, "pink", S.sideX - 90 * k, S.Y(760), 0.7 * k);
      tubAt(world, "white", S.sideX + 110 * k, S.Y(950), 0.5 * k);
      tubAt(world, "choc", S.sideX + 40 * k, S.Y(620), 0.44 * k);
    },
    // 6. decorate: the frosted cake with chips, candy dots, berries and sprinkles; four bins on the left
    "cake-decorate"(world, S, C) {
      homeBtn(world, S);
      const d = S.dishHome, k = S.k, s = 0.86 * k;
      const armL = mom(world, S, C, { eyes: "open", mouth: "smile" });
      const P = cakeOnPlate(world, d.x, S.Y(560), s);
      frosting(world, P, s, "pink");
      decorate(world, P, s, 9);
      const [hx, hy] = P(330, -150);                  // the next chip, in the air just off the cake's edge
      at(world, "choc-chip", hx, hy, CAKE.stamp, CAKE.stamp, 0.95 * k, { rot: -12 });
      hand(world, "sprinkle", hx + 50 * k, hy - 130 * k, 0.6 * k, 14);
      armL();
      if (wide(S)) pet(world, C, { eyes: "surprised", mouth: "open" });
      const bs = S.binScale(4);
      [["choc-chip", 140, 140, .95], ["c:candy-dot", 140, 140, .95], ["k:berry", 140, 140, 1.0], ["c:sprinkles-cluster", 140, 140, 1.15]]
        .forEach(([nm, w, h, sc], i) => {
          const b = S.bin(i, 4);
          at(world, "b:topping-bin", b.x, b.y, 240, 240, bs);
          at(world, nm, b.x, b.y - 10 * bs, w, h, sc * k * (bs / 0.9));
        });
    },
    // 7. the candles go on: four of the five seats filled, the fifth candle still in her hand above its seat
    "cake-candles"(world, S, C) {
      homeBtn(world, S);
      const d = S.dishHome, k = S.k, s = 0.86 * k;
      const armL = mom(world, S, C, { eyes: "happy", mouth: "talk" });
      const P = cakeOnPlate(world, d.x, S.Y(620), s);
      frosting(world, P, s, "pink");
      decorate(world, P, s);
      candles(world, P, s, "off", 0);
      const [sx, sy] = P(...CAKE.seats[0]), cs = CAKE.candleS * s;
      anchor(world, "candle", sx + 34 * k, sy - 86 * k, CAKE.candle.w, CAKE.candle.h, ...CAKE.candle.base, cs * 1.06, { rot: -12 });
      hand(world, "grab", sx - 6 * k, sy - 228 * k, 0.58 * k, -14);
      armL();
      if (wide(S)) pet(world, C, { eyes: "surprised", mouth: "open" });
      // the spare candles lie on the counter, not on the wall
      [0, 1, 2].forEach(i => at(world, "candle", S.sideX + (i - 1) * 120 * k, S.Y(700 + (i % 2) * 210),
        CAKE.candle.w, CAKE.candle.h, 0.52 * k, { rot: (i - 1) * 12 }));
    },
    // 8. the candles are lit: five candles, five flames, Pippa staring
    "cake-lit"(world, S, C) {
      homeBtn(world, S);
      const d = S.dishHome, k = S.k, s = 0.86 * k;
      const armL = mom(world, S, C, { eyes: "happy", mouth: "open" });
      const P = cakeOnPlate(world, d.x, S.Y(620), s);
      frosting(world, P, s, "pink");
      decorate(world, P, s);
      candles(world, P, s, "lit");
      armL();
      if (wide(S)) pet(world, C, { eyes: "surprised", mouth: "open" });
      const r = rng(11);
      [[-520, -320, .5], [520, -340, .55], [-560, 20, .42], [560, 40, .45]].forEach(([dx, dy, sc]) => {
        const x = d.x + dx * k, y = S.Y(620) + dy * k;
        if (x > C.momLeft + 280 * C.s || x < S.sideX + 200 * k) return;
        at(world, "b:star", x, y, 200, 200, sc * k, { rot: r() * 40 - 20 });
      });
      // a spare candle, lit, standing on the counter in the side column
      const cs = 0.62 * k, [cxx, cyy] = [S.sideX, S.Y(900)];
      anchor(world, "candle", cxx, cyy, CAKE.candle.w, CAKE.candle.h, ...CAKE.candle.base, cs);
      anchor(world, "flame-candle", cxx + (CAKE.candle.flame[0] - CAKE.candle.base[0]) * cs,
        cyy + (CAKE.candle.flame[1] - CAKE.candle.base[1]) * cs, CAKE.flame.w, CAKE.flame.h, ...CAKE.flame.base, cs * 1.05);
    },
    // 9. blow them out: no flames, a wisp of smoke over every candle
    "cake-blow"(world, S, C) {
      homeBtn(world, S);
      const d = S.dishHome, k = S.k, s = 0.86 * k;
      const armL = mom(world, S, C, { eyes: "happy", mouth: "open" });
      const P = cakeOnPlate(world, d.x, S.Y(620), s);
      frosting(world, P, s, "pink");
      decorate(world, P, s);
      candles(world, P, s, "smoke");
      armL();
      if (wide(S)) pet(world, C, { eyes: "happy", mouth: "open" });
      const cs = 0.62 * k, [cxx, cyy] = [S.sideX, S.Y(900)];
      anchor(world, "candle", cxx, cyy, CAKE.candle.w, CAKE.candle.h, ...CAKE.candle.base, cs);
      anchor(world, "smoke-puff", cxx + (CAKE.candle.flame[0] - CAKE.candle.base[0]) * cs,
        cyy + (CAKE.candle.flame[1] - CAKE.candle.base[1]) * cs, CAKE.smoke.w, CAKE.smoke.h, ...CAKE.smoke.base, cs);
    },
    // 10. the slices are shared: a wedge cut out of the cake, one slice on Mom's plate, one going to Pippa
    "cake-slices"(world, S, C) {
      homeBtn(world, S);
      const d = S.dishHome, k = S.k, s = 0.66 * k;
      const armL = mom(world, S, C, { eyes: "happy", mouth: "smile", armL: -12 });
      const X = d.x - 60 * k, Y = S.Y(560);
      // the cake with two wedges gone: cake, frosting, decorations and candles are ALL clipped to the kept sector,
      // exactly what the pizza cutter's component does to the pizza (same frame, same centre, same radius)
      const keep = wedge(74, 326);                      // two 54-degree slices have been cut out
      const P = cakeOnPlate(world, X, Y, s, { wedge: keep });
      frosting(world, P, s, "pink", null, { wedge: keep });
      decorate(world, P, s, null, { wedge: keep });
      candles(world, P, s, "off", null, { wedge: keep });
      armL();
      // the two cut slices, lying on the counter in front: the same art, clipped to the wedge that is missing
      // the two cut slices: the same art, each clipped to one of the two sectors that are missing from the cake
      [[wedge(326, 380), -230, 880, -160], [wedge(380, 434), 150, 930, -55]].forEach(([w2, dx, yv, rot]) => {
        const ss = 0.56 * k, sx = X + dx * k, sy = S.Y(yv);
        const Q = cakeOnPlate(world, sx, sy, ss, { wedge: w2, plate: false, rot });
        frosting(world, Q, ss, "pink", null, { wedge: w2, rot });
        decorate(world, Q, ss, null, { wedge: w2, rot });
      });
      const pw = 600 * 0.6 * k, ph = 700 * 0.6 * k, faceLeft = C.momLeft + (500 - 150) * C.s;
      const PP = { x: Math.min(d.x + 560 * k, faceLeft - pw * 0.9), y: S.Y(1000) - 684 * 0.6 * k, w: pw, h: ph };
      if (wide(S)) pet(world, C, { eyes: "happy", mouth: "open" }, PP);
      // the leftovers in the side column, on the counter
      at(world, "candle", S.sideX - 70 * k, S.Y(700), CAKE.candle.w, CAKE.candle.h, 0.44 * k, { rot: 84 });
      at(world, "choc-chip", S.sideX + 100 * k, S.Y(690), CAKE.stamp, CAKE.stamp, 0.7 * k);
      at(world, "c:candy-dot", S.sideX + 40 * k, S.Y(740), CAKE.stamp, CAKE.stamp, 0.7 * k);
    },
    // 11. the photo: the finished cake in photo-frame-cake, stars
    "cake-photo"(world, S, C) {
      const d = S.dishHome, k = S.k;
      const armL = mom(world, S, C, { eyes: "happy", mouth: "open", armL: 55 });
      const fs = 0.95 * k, fx = d.x, fy = S.Y(560);
      const hs = 540 * fs, hx = fx - hs / 2, hy = fy - hs / 2, sc = hs / 1080, cx0 = 660;
      mk(world, "b:bg-kitchen-landscape", hx - cx0 * sc, hy, 2400 * sc, 1080 * sc);
      world.lastChild.dataset.crop = [cx0 / 2400, 0, (cx0 + 1080) / 2400, 1].join(",");
      const s = hs / CAKE.plate.w * 0.98, P = cakeOnPlate(world, fx, fy + 70 * fs, s);
      frosting(world, P, s, "pink");
      decorate(world, P, s);
      candles(world, P, s, "lit");
      mk(world, "photo-frame-cake", fx - 350 * fs, fy - 350 * fs, 700 * fs, 780 * fs);
      armL();
      if (wide(S)) pet(world, C, { eyes: "happy", mouth: "open" });
      const r = rng(9), momL = C.momLeft + 280 * C.s;
      [[-470, -240, .7], [470, -260, .8], [-520, 120, .55], [520, 150, .6], [-380, 340, .45], [390, 380, .5]].forEach(([dx, dy, sc2]) => {
        const x = fx + dx * k, y = fy + dy * k, PT = C.pet; if (x + 100 * sc2 * k > momL) return;
        if (wide(S) && x + 100 * sc2 * k > PT.x && y + 100 * sc2 * k > PT.y) return;
        at(world, "b:star", x, y, 200, 200, sc2 * k, { rot: r() * 50 - 25 });
      });
    },
  };

  // img -> native canvas -> drawImage (the game's path), with crops (data-crop) and wedge clips (data-wedge)
  async function toCanvas(host, world, W) {
    const imgs = [...world.querySelectorAll("img")];
    await Promise.all(imgs.map(i => i.decode().catch(() => console.error("FAILED " + i.src))));
    const c = document.createElement("canvas"); c.width = W; c.height = 1080;
    const g = c.getContext("2d"), cache = new Map();
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
      if (i.dataset.wedge) {                                   // the wedge cut, in the image's own box
        const [wx, wy, a0, a1] = i.dataset.wedge.split(",").map(Number);
        const cx = x - ox + w / 2 + wx, cy = y - oy + h / 2 + wy;
        const R = (Math.abs(wx) + Math.abs(wy) + w + h) * 3;
        g.beginPath(); g.moveTo(cx, cy);
        for (let a = a0; a <= a1 + 0.001; a += Math.min(3, (a1 - a0) / 24))
          g.lineTo(cx + Math.cos(a * Math.PI / 180) * R, cy + Math.sin(a * Math.PI / 180) * R);
        g.closePath(); g.clip();
      }
      const [c0, c1, c2, c3] = i.dataset.crop ? i.dataset.crop.split(",").map(Number) : [0, 0, 1, 1];
      g.drawImage(t, t.width * c0, t.height * c1, t.width * (c2 - c0), t.height * (c3 - c1),
        x - ox + w * c0, y - oy + h * c1, w * (c2 - c0), h * (c3 - c1));
      g.restore();
    }
    c.style.width = "100%"; c.style.display = "block";
    world.replaceWith(c);
    return c;
  }

  const ORDER = [["cake-home", "Choose the cake card"], ["cake-stir", "Stir the batter"], ["cake-pour", "Pour it into the pan"],
    ["cake-oven", "The pan in the oven"], ["cake-choose", "Choose a frosting"], ["cake-spread", "Spread the frosting"],
    ["cake-decorate", "Decorate"], ["cake-candles", "The candles go on"], ["cake-lit", "The candles are lit"],
    ["cake-blow", "Blow them out"], ["cake-slices", "Share the slices"], ["cake-photo", "The photo"]];
  ensureTints();
  Object.assign(SB.SCENES, SCENES);
  window.ScenesCake = { CAKE, TINT, ORDER, SCENES, toCanvas, cakeOnPlate, frosting, decorate, candles, batterBowl };
})();
