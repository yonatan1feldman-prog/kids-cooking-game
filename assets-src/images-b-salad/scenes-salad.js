// Salad-recipe scenes for images-b-salad, composed with the existing composers, read-only: ../images-b/scenes.js
// (same world 1080 high, width W from the screen ratio, same stage()/cast() layout, background, Mom and Pippa) and
// ../images-b-prep/scenes-prep.js (its img -> canvas path with crops, and the prep items: sink, faucet, board, knife, frame...).
// New assets load from this folder, "b:" from images-b, "p:" from images-b-prep. Every drawing is an <img>.
(function () {
  const B = window.IMAGES_B_DIR || "../images-b/", PR = window.PREP_BASE || "../images-b-prep/", HERE = window.SALAD_BASE || "./";
  const SB = window.ScenesB, SP = window.ScenesPrep, ART = SB.ART, PREP = SP.PREP;
  const src = n => (n.startsWith("b:") ? B + n.slice(2) : n.startsWith("p:") ? PR + n.slice(2) : HERE + n) + ".svg";

  // geometry of the new files (see README-salad.md)
  const SALAD = {
    veg: [672, 504],
    // measured by tools/gen_salad_a.py --profiles: [x, top, bottom] of the body in the 672x504 whole-veg file; strip viewBox = 60 x stripH
    vegSpan: { cucumber: [53, 619], carrot: [36, 577] }, stripH: { cucumber: 168, carrot: 159 },
    vegProfile: {"cucumber":[[57,364.1,394.0],[81,331.7,424.5],[105,321.1,433.2],[129,312.6,439.9],[153,306.3,444.6],[177,301.3,447.9],[201,297.4,450.5],[225,294.4,452.3],[249,292.1,453.5],[273,290.5,454.4],[297,289.4,454.9],[321,288.8,455.2],[345,288.6,455.5],[369,288.6,455.7],[393,289.0,455.7],[417,290.0,455.5],[441,291.6,454.8],[465,293.9,453.6],[489,297.2,451.6],[513,301.6,448.8],[537,307.5,444.6],[561,315.3,438.6],[585,325.3,430.4],[609,351.7,405.9]],"carrot":[[40,423.9,431.1],[64,408.8,435.7],[88,399.4,437.2],[112,391.6,438.7],[136,384.7,440.2],[160,378.2,441.7],[184,372.3,443.2],[208,366.8,444.7],[232,361.5,446.3],[256,356.5,447.7],[280,351.6,449.2],[304,347.0,450.7],[328,342.5,452.2],[352,338.1,453.6],[376,333.8,455.2],[400,329.7,456.7],[424,325.7,458.2],[448,321.8,459.7],[472,318.0,461.2],[496,314.2,462.7],[520,310.6,464.2],[544,307.4,465.3],[568,331.3,441.5]]},
    bowl: { w: 900, h: 620, opening: [450, 218, 388, 100] },
    serving: { w: 480, h: 320, opening: [240, 122, 196, 50] },
    lemon: [520, 520], oilSpout: [150, 30], saltHoles: [130, 70], servers: [220, 500], portion: [160, 146], drop: [120, 160],
  };
  SALAD.serving.mixScale = SALAD.serving.opening[2] / SALAD.bowl.opening[2];
  // every vegetable that can be cut (prep's four + the two new ones)
  const allProfile = veg => SALAD.vegProfile[veg] || PREP.vegProfile[veg];

  function vegColumn(veg, x) {
    const pr = allProfile(veg);
    if (x <= pr[0][0]) return { top: pr[0][1], bottom: pr[0][2] };
    for (let i = 1; i < pr.length; i++) if (x <= pr[i][0]) {
      const [x0, t0, b0] = pr[i - 1], [x1, t1, b1] = pr[i], u = (x - x0) / (x1 - x0);
      return { top: t0 + (t1 - t0) * u, bottom: b0 + (b1 - b0) * u };
    }
    const l = pr[pr.length - 1]; return { top: l[1], bottom: l[2] };
  }
  // cut-face strip on the cut line (whole veg centred at (vx,vy), scale vs, cut at file x = cutX), same rules as README-prep
  function insideStrip(world, veg, vx, vy, vs, cutX) {
    const [VW, VH] = SALAD.veg, col = vegColumn(veg, cutX), h = (col.bottom - col.top) * vs;
    mk(world, "veg-" + veg + "-inside", vx - VW / 2 * vs + (cutX - 30) * vs, vy - VH / 2 * vs + col.top * vs, 60 * vs, h);
  }

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
      img.dataset.crop = c.join(","); img.style.clipPath = `inset(${c[1] * 100}% ${(1 - c[2]) * 100}% ${(1 - c[3]) * 100}% ${c[0] * 100}%)`;
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
    for (const n of ["b:mom-body", "b:mom-head", "b:mom-hair", "b:mom-eyes-" + (o.eyes || "open"), o.mouth === "chew" ? "p:mom-mouth-chew" : "b:mom-mouth-" + (o.mouth || "smile")]) mk(world, n, x, y, w, h);
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

  // ---- the salad bowl: back, contents, front (all in the 900x620 frame, centred at (x,y), scale s) ----
  function saladBowl(world, x, y, s, fill, between) {
    at(world, "salad-bowl-back", x, y, 900, 620, s);
    if (/^heap-[123]$/.test(fill || "")) at(world, "salad-" + fill, x, y, 900, 620, s);   // the filling grows: heap-1 low, heap-2 half, heap-3 full (not mixed)
    if (fill === "mixed") at(world, "salad-mixed", x, y, 900, 620, s);
    if (between) between();
    at(world, "salad-bowl-front", x, y, 900, 620, s);
    return { ox: x, oy: y + (SALAD.bowl.opening[1] - 310) * s };     // centre of the opening
  }
  function servingBowl(world, x, y, s, full) {
    at(world, "serving-bowl", x, y, 480, 320, s);
    if (!full) return;
    const [ox, oy] = SALAD.serving.opening, ms = s * SALAD.serving.mixScale;
    const sx = x + (ox - 240) * s, sy = y + (oy - 160) * s;
    mk(world, "salad-mixed", sx - 450 * ms, sy - 218 * ms, 900 * ms, 620 * ms);
  }

  // cutting scene for a new vegetable: whole veg cropped at the cut line, cut-face strip, slices, knife mid-cut
  function cutScene(veg, others, face) {
    return function (world, S, C) {
      homeBtn(world, S);
      const d = S.dishHome, k = S.k, bs = 1.05 * k, bx = d.x - 10 * k, by = S.Y(700);
      const armL = mom(world, S, C, face);
      at(world, "p:cutting-board", bx, by, 1000, 600, bs);
      const [VW, VH] = SALAD.veg, vs = k / 1.2, vx = bx - 150 * k, vy = by - 20 * k;
      const span = SALAD.vegSpan[veg], cutArt = span[0] + (span[1] - span[0]) * 0.62;
      at(world, "veg-" + veg + "-whole", vx, vy, VW, VH, vs, { crop: cutArt / VW });
      insideStrip(world, veg, vx, vy, vs, cutArt);
      const r = rng(3);
      [[180, 60], [250, 10], [330, 80], [300, -40]].forEach(([dx, dy]) =>
        at(world, "veg-" + veg + "-slice", vx + dx * k + 60 * k, vy + dy * k, 240, 240, 0.72 * k, { rot: r() * 50 - 25 }));
      armL();
      if (wide(S)) pet(world, C, { eyes: "surprised", mouth: "open" });
      const col = vegColumn(veg, cutArt - 110), tipX = vx + (cutArt - 110 - VW / 2) * vs, tipY = vy + ((col.top + col.bottom) / 2 + 10 - VH / 2) * vs;
      anchor(world, "p:knife", tipX, tipY, 240, 640, PREP.knifeTip[0], PREP.knifeTip[1], 0.9 * k);
      others.forEach((v, i) => {
        const nm = v.startsWith("p:") ? v : "veg-" + v;
        at(world, nm + "-whole", S.sideX - 50 * k, S.Y(470 + i * 190), 672, 504, 0.38 * k / 1.2);
        at(world, nm + "-slice", S.sideX + 125 * k, S.Y(490 + i * 190), 240, 240, 0.45 * k);
      });
    };
  }

  const SCENES = {
    // 0. choose the recipe: the new salad card beside the pizza card
    "salad-home"(world, S, C) {
      const k = S.k, armL = mom(world, S, C, { eyes: "open", mouth: "talk" });
      const cx = wide(S) ? S.dishHome.x : S.dishHome.x - 40 * k;
      at(world, "b:card-pizza", cx - 290 * k, 540, 400, 520, 1.05 * k, { rot: -4 });
      at(world, "card-salad", cx + 230 * k, 530, 400, 520, 1.2 * k, { rot: 3 });
      armL();
      if (wide(S)) pet(world, C, { eyes: "happy", mouth: "open" });
    },
    // 1. wash the vegetables: colander with the vegetables in the sink, water from the tap, drops splashing
    "salad-wash"(world, S, C) {
      homeBtn(world, S);
      const d = S.dishHome, k = S.k, sy = S.Y(700);
      const armL = mom(world, S, C, { eyes: "happy", mouth: "talk" });
      at(world, "p:sink-basin", d.x, sy, 900, 560, k * 1.1);
      const fs = 0.95 * k, fx = d.x - 150 * k, fy = sy - 250 * k;
      mk(world, "p:faucet", fx - 120 * fs, fy - 372 * fs, 320 * fs, 400 * fs);
      const ox = fx - 120 * fs + PREP.faucetOut[0] * fs, oy = fy - 372 * fs + PREP.faucetOut[1] * fs;
      const cs = 0.86 * k, cx = d.x + 40 * k, cyy = sy + 20 * k;
      mk(world, "p:water-stream", ox - 120 * k, oy - 4 * k, 240 * k, cyy - 60 * cs - oy);
      at(world, "colander", cx, cyy, 820, 560, cs);
      const r = rng(6);
      [[-190, -250, .42], [-90, -290, .36], [60, -270, .4], [170, -230, .34], [-270, -170, .3], [250, -160, .32], [-30, -320, .28]].forEach(([dx, dy, s]) =>
        at(world, "water-drop", ox + dx * k, cyy + dy * k, 120, 160, s * k, { rot: dx * 0.12 + (r() - .5) * 20 }));
      armL();
      if (wide(S)) pet(world, C, { eyes: "happy", mouth: "open" });
    },
    // 2. tear the lettuce: the head half torn on the board, a leaf being pulled off; the four states as a strip on the left
    "salad-tear"(world, S, C) {
      homeBtn(world, S);
      const d = S.dishHome, k = S.k;
      const armL = mom(world, S, C, { eyes: "happy", mouth: "open" });
      at(world, "p:cutting-board", d.x - 10 * k, S.Y(700), 1000, 600, 1.05 * k);
      at(world, "lettuce-tear-2", d.x - 30 * k, S.Y(560), 640, 560, 1.2 * k);
      armL();
      if (wide(S)) pet(world, C, { eyes: "surprised", mouth: "open" });
      at(world, "piece-lettuce", d.x - 330 * k, S.Y(470), 140, 140, 1.25 * k, { rot: -20 });
      hand(world, "grab", d.x - 330 * k, S.Y(470), 0.66 * k);
      ["lettuce-head", "lettuce-tear-1", "lettuce-tear-2", "lettuce-tear-3"].forEach((n, i) => at(world, n, S.sideX, S.Y(345 + i * 165), 640, 560, 0.3 * k));
    },
    // 3. pick a vegetable: five whole vegetables on the counter; the chosen one glows and Mom's hand points at it
    "salad-choose"(world, S, C) {
      homeBtn(world, S);
      const k = S.k, s = 0.58 * k / 1.2 * 1.2, L = S.m + 60 * k, R = C.momLeft + 40 * C.s, w = R - L;
      const armL = mom(world, S, C, { eyes: "open", mouth: "talk" });
      const spots = [["cucumber", .2, 420], ["carrot", .52, 400], ["p:veg-tomato", .82, 430], ["p:veg-pepper", .34, 760], ["p:veg-onion", .68, 770]];
      const [, x0, y0] = spots[0];
      at(world, "p:temp-glow", L + w * x0, S.Y(y0) + 10 * k, 400, 280, 1.45 * k);
      spots.forEach(([v, f, y]) => at(world, (v.startsWith("p:") ? v : "veg-" + v) + "-whole", L + w * f, S.Y(y), 672, 504, s));
      armL();
      if (wide(S)) pet(world, C, { eyes: "happy", mouth: "closed" });
      hand(world, "point", L + w * x0 + 90 * k, S.Y(y0) + 60 * k, 0.62 * k);
    },
    // 4. + 5. cut the cucumber and the carrot, with the cut-face strip on the cut line
    "salad-cut-cucumber": cutScene("cucumber", ["carrot", "p:veg-tomato", "p:veg-pepper"], { eyes: "open", mouth: "talk" }),
    "salad-cut-carrot": cutScene("carrot", ["cucumber", "p:veg-tomato", "p:veg-onion"], { eyes: "happy", mouth: "open" }),
    // 6. into the bowl: slices on the small board, a carrot slice being carried to the salad bowl
    "salad-transfer"(world, S, C) {
      homeBtn(world, S);
      const d = S.dishHome, k = S.k, bs = 0.95 * k, bx = d.x + 30 * k, by = S.Y(700);
      const armL = mom(world, S, C, { eyes: "open", mouth: "smile" });
      at(world, "p:cutting-board", S.sideX + 20 * k, S.Y(720), 1000, 600, 0.46 * k);
      const r = rng(2);
      [["cucumber", -110, -30], ["carrot", -20, 10], ["cucumber", 60, -20], ["carrot", 100, 40], ["p:veg-tomato", -80, 50]].forEach(([v, dx, dy]) =>
        at(world, (v.startsWith("p:") ? v : "veg-" + v) + "-slice", S.sideX + 20 * k + dx * k, S.Y(710) + dy * k, 240, 240, 0.36 * k, { rot: r() * 60 }));
      saladBowl(world, bx, by, bs, "heap-2");
      armL();
      if (wide(S)) pet(world, C, { eyes: "surprised", mouth: "open" });
      const gx = bx - 420 * k, gy = by - 250 * k;
      at(world, "veg-carrot-slice", gx, gy, 240, 240, 0.72 * k);
      hand(world, "grab", gx, gy, 0.66 * k);
    },
    // 7. squeeze the lemon: the half-squeezed lemon tilted over the bowl, drops of juice; the three states on the left
    "salad-lemon"(world, S, C) {
      homeBtn(world, S);
      const d = S.dishHome, k = S.k, bs = 0.95 * k, bx = d.x + 30 * k, by = S.Y(720);
      const armL = mom(world, S, C, { eyes: "surprised", mouth: "open" });
      const o = saladBowl(world, bx, by, bs, "heap-3");
      armL();
      if (wide(S)) pet(world, C, { eyes: "happy", mouth: "open" });
      const lx = bx - 60 * k, ly = o.oy - 230 * k;
      at(world, "lemon-half-2", lx, ly, 520, 520, 0.62 * k, { rot: 24 });
      [[46, 130, .4], [56, 190, .34]].forEach(([dx, dy, s]) => at(world, "juice-drop", lx + dx * k, ly + dy * k, 120, 160, s * k));
      ["lemon-half-1", "lemon-half-2", "lemon-half-3"].forEach((n, i) => at(world, n, S.sideX, S.Y(400 + i * 200), 520, 520, 0.38 * k));
    },
    // 8. pour the oil: the open bottle tipped over the bowl, a thin golden stream of drops
    "salad-oil"(world, S, C) {
      homeBtn(world, S);
      const d = S.dishHome, k = S.k, bs = 0.95 * k, bx = d.x + 30 * k, by = S.Y(720);
      const armL = mom(world, S, C, { eyes: "happy", mouth: "talk" });
      const o = saladBowl(world, bx, by, bs, "heap-3");
      armL();
      if (wide(S)) pet(world, C, { eyes: "surprised", mouth: "open" });
      const sx = bx - 60 * k, sy = o.oy - 250 * k;
      [[4, 50, .3], [8, 105, .3], [12, 160, .28]].forEach(([dx, dy, s]) => at(world, "oil-drop", sx + dx * k, sy + dy * k, 120, 160, s * k));
      anchor(world, "oil-bottle", sx, sy, 300, 640, SALAD.oilSpout[0], SALAD.oilSpout[1], 0.72 * k, { rot: -128 });
      at(world, "salt-shaker", S.sideX, S.Y(780), 260, 400, 0.6 * k);
      at(world, "lemon-half-3", S.sideX, S.Y(420), 520, 520, 0.4 * k);
    },
    // 9. salt: the shaker upside down over the bowl
    "salad-salt"(world, S, C) {
      homeBtn(world, S);
      const d = S.dishHome, k = S.k, bs = 0.95 * k, bx = d.x + 30 * k, by = S.Y(720);
      const armL = mom(world, S, C, { eyes: "open", mouth: "smile" });
      const o = saladBowl(world, bx, by, bs, "heap-3");
      armL();
      if (wide(S)) pet(world, C, { eyes: "happy", mouth: "closed" });
      anchor(world, "salt-shaker", bx - 40 * k, o.oy - 170 * k, 260, 400, SALAD.saltHoles[0], SALAD.saltHoles[1], 0.85 * k, { rot: 160 });
      at(world, "oil-bottle", S.sideX, S.Y(640), 300, 640, 0.5 * k);
    },
    // 10. mix: the mixed salad in the bowl, the servers in it
    "salad-mix"(world, S, C) {
      homeBtn(world, S);
      const d = S.dishHome, k = S.k, bs = 0.95 * k, bx = d.x + 30 * k, by = S.Y(720);
      const armL = mom(world, S, C, { eyes: "happy", mouth: "open" });
      saladBowl(world, bx, by, bs, "mixed", () =>
        anchor(world, "salad-servers", bx + 20 * k, by - 150 * k, 440, 640, SALAD.servers[0], SALAD.servers[1], 0.95 * k, { rot: 14 }));
      armL();
      if (wide(S)) pet(world, C, { eyes: "surprised", mouth: "open" });
    },
    // 11. serve: a portion on its spoon goes to Pippa's little bowl; Mom's bowl is already full
    "salad-serve"(world, S, C) {
      homeBtn(world, S);
      const d = S.dishHome, k = S.k;
      const armL = mom(world, S, C, { eyes: "happy", mouth: "open", armL: -10 });
      saladBowl(world, d.x - 380 * k, S.Y(610), 0.66 * k, "mixed");
      servingBowl(world, d.x - 20 * k, S.Y(880), 0.7 * k, true);                // Mom's, already full
      armL();
      const P = wide(S) ? C.pet : null;
      if (P) pet(world, C, { eyes: "happy", mouth: "open" });
      const pbx = P ? P.x - 30 * k : d.x + 190 * k, pby = S.Y(930);
      servingBowl(world, pbx, pby, 0.56 * k, false);                             // Pippa's, empty, in front of her
      const gx = (d.x + pbx) / 2 - 90 * k, gy = S.Y(660);
      anchor(world, "salad-portion", gx, gy, 360, 280, SALAD.portion[0], SALAD.portion[1], 0.75 * k);
      hand(world, "grab", gx + 90 * k, gy + 10 * k, 0.6 * k);
    },
    // 12. celebrate: the framed photo of the salad, stars
    "salad-celebrate"(world, S, C) {
      const d = S.dishHome, k = S.k;
      const armL = mom(world, S, C, { eyes: "happy", mouth: "open", armL: 55 });
      const fs = 0.95 * k, fx = d.x, fy = S.Y(560);
      const hs = 540 * fs, hx = fx - hs / 2, hy = fy - hs / 2, sc = hs / 1080, cx0 = 660;
      mk(world, "b:bg-kitchen-landscape", hx - cx0 * sc, hy, 2400 * sc, 1080 * sc, { crop: [cx0 / 2400, 0, (cx0 + 1080) / 2400, 1] });
      saladBowl(world, fx, fy + 60 * fs, hs / 900 * 0.92, "mixed");
      mk(world, "photo-frame-salad", fx - 350 * fs, fy - 350 * fs, 700 * fs, 780 * fs);
      armL();
      if (wide(S)) pet(world, C, { eyes: "happy", mouth: "open" });
      const r = rng(9);
      const momL = C.momLeft + 280 * C.s;            // keep the stars off Mom's raised arm and face
      [[-470, -240, .7], [470, -260, .8], [-520, 120, .55], [520, 150, .6], [-380, 340, .45], [390, 380, .5]].forEach(([dx, dy, s]) => {
        const x = fx + dx * k; if (x + 100 * s * k > momL) return;
        at(world, "b:star", x, fy + dy * k, 200, 200, s * k, { rot: r() * 50 - 25 });
      });
    },
  };
  const ORDER = [["salad-home", "Choose the salad card"], ["salad-wash", "Wash the vegetables"], ["salad-tear", "Tear the lettuce"],
    ["salad-choose", "Pick a vegetable"], ["salad-cut-cucumber", "Cut the cucumber"], ["salad-cut-carrot", "Cut the carrot"],
    ["salad-transfer", "Into the bowl"], ["salad-lemon", "Squeeze the lemon"], ["salad-oil", "Pour the oil"], ["salad-salt", "A little salt"],
    ["salad-mix", "Mix"], ["salad-serve", "Serve Mom and Pippa"], ["salad-celebrate", "Celebrate with the photo"]];
  Object.assign(SB.SCENES, SCENES);
  window.ScenesSalad = { SALAD, ORDER, SCENES, vegColumn, insideStrip, toCanvas: SP.toCanvasPrep };
})();
