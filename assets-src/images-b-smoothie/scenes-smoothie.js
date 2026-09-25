// Smoothie-recipe scenes for images-b-smoothie, composed with the existing composers, read-only: ../images-b/scenes.js
// (world 1080 high, width W from the screen ratio, stage()/cast() layout, background, Mom and Pippa), ../images-b-prep/scenes-prep.js
// (img -> canvas path with crops; sink, faucet, board, knife, glow, frame) and ../images-b-salad/scenes-salad.js (water drops).
// New assets load from this folder, "b:" from images-b, "p:" from images-b-prep, "s:" from images-b-salad, "c:" from images-b-cookies.
// Every drawing is an <img>. The smoothie stream (pouring) is drawn by the game in code; here a tiny inline data-URI stand-in shows where it goes (not an asset).
(function () {
  const B = window.IMAGES_B_DIR || "../images-b/", PR = window.PREP_BASE || "../images-b-prep/", SA = window.SALAD_BASE || "../images-b-salad/";
  const CO = window.COOKIES_BASE || "../images-b-cookies/", HERE = window.SMOOTHIE_BASE || "./";
  const SB = window.ScenesB, SP = window.ScenesPrep, ART = SB.ART, PREP = SP.PREP;
  const src = n => n.startsWith("data:") ? n : (n.startsWith("b:") ? B + n.slice(2) : n.startsWith("p:") ? PR + n.slice(2) : n.startsWith("s:") ? SA + n.slice(2)
    : n.startsWith("c:") ? CO + n.slice(2) : HERE + n) + ".svg";

  // geometry of the new files (see README-smoothie.md)
  const SMOOTHIE = {
    fruit: [672, 504],
    // measured by tools/gen_smoothie_a.py --profiles: [x, top, bottom] of the body in the 672x504 whole-fruit file; strip viewBox = 60 x stripH
    fruitSpan: {"banana":[48,583],"strawberry":[115,535],"mango":[67,600],"kiwi":[79,593]},
    stripH: {"banana":136,"strawberry":303,"mango":324,"kiwi":322},
    fruitProfile: {"banana":[[76,290.0,356.4],[100,296.6,380.5],[124,304.2,400.7],[148,311.8,417.8],[172,318.8,432.2],[196,325.0,444.3],[220,330.2,454.2],[244,334.3,462.0],[268,337.2,467.6],[292,339.0,471.4],[316,339.3,473.1],[340,338.2,473.2],[364,335.8,471.4],[388,332.2,467.5],[412,327.3,461.6],[436,321.5,453.5],[460,314.8,443.0],[484,307.4,430.1],[508,299.6,414.3],[532,291.9,395.4],[556,284.8,373.4]],"strawberry":[[119,283.2,306.6],[143,259.7,338.6],[167,243.7,353.9],[191,230.3,366.5],[215,218.9,377.5],[239,209.0,387.6],[263,200.4,396.8],[287,192.8,405.5],[311,185.7,413.6],[335,178.4,421.2],[359,170.7,428.3],[383,162.5,434.7],[407,154.5,440.1],[431,147.6,444.1],[455,143.4,446.0],[479,144.0,444.3],[503,152.7,436.3],[527,174.4,417.9]],"mango":[[95,273.3,387.8],[119,245.3,414.4],[143,225.8,432.4],[167,210.1,445.7],[191,196.7,455.6],[215,184.7,463.0],[239,173.9,468.0],[263,164.5,471.2],[287,156.8,472.7],[311,151.2,472.7],[335,148.1,471.7],[359,147.5,469.8],[383,149.3,467.2],[407,153.6,463.8],[431,160.1,459.3],[455,168.7,453.4],[479,179.3,445.8],[503,191.9,436.0],[527,207.2,423.4],[551,226.1,406.6],[575,251.9,382.8]],"kiwi":[[83,271.1,348.9],[107,232.2,388.1],[131,209.5,410.8],[155,193.1,427.3],[179,180.6,440.1],[203,171.0,450.0],[227,163.8,457.9],[251,158.7,464.1],[275,155.3,468.8],[299,153.5,472.3],[323,153.1,474.6],[347,154.1,475.7],[371,156.3,475.4],[395,159.6,473.7],[419,164.2,470.5],[443,170.3,465.5],[467,178.1,458.5],[491,187.8,449.1],[515,200.3,436.9],[539,216.4,420.9],[563,238.4,398.9],[587,274.9,362.5]]},
    jar: { w: 600, h: 800, mouth: [300, 118, 208, 30], seat: [300, 776], spout: [72, 100] },
    base: { w: 700, h: 520, seat: [350, 108], button: [350, 306] },
    button: { w: 280, h: 280, c: [140, 140] },
    lid: { w: 480, h: 240, seat: [240, 150] },
    carton: { w: 320, h: 560, spout: [38, 118] },
    glass: { w: 320, h: 440, rim: [160, 72, 100, 18], fillTop: 98, fillBottom: 370 },
    drop: [120, 160],
  };
  const FRUITS = ["banana", "strawberry", "mango", "kiwi"];

  function fruitColumn(f, x) {
    const pr = SMOOTHIE.fruitProfile[f];
    if (x <= pr[0][0]) return { top: pr[0][1], bottom: pr[0][2] };
    for (let i = 1; i < pr.length; i++) if (x <= pr[i][0]) {
      const [x0, t0, b0] = pr[i - 1], [x1, t1, b1] = pr[i], u = (x - x0) / (x1 - x0);
      return { top: t0 + (t1 - t0) * u, bottom: b0 + (b1 - b0) * u };
    }
    const l = pr[pr.length - 1]; return { top: l[1], bottom: l[2] };
  }
  // cut-face strip on the cut line (whole fruit centred at (vx,vy), scale vs, cut at file x = cutX): the README-prep rule
  function insideStrip(world, f, vx, vy, vs, cutX) {
    const [VW, VH] = SMOOTHIE.fruit, col = fruitColumn(f, cutX), h = (col.bottom - col.top) * vs;
    mk(world, "fruit-" + f + "-inside", vx - VW / 2 * vs + (cutX - 30) * vs, vy - VH / 2 * vs + col.top * vs, 60 * vs, h);
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

  // stand-in for the pouring stream (the game draws it in code): a soft band from (x0,y0) to (x1,y1)
  function stream(world, x0, y0, x1, y1, w, col) {
    const uri = "data:image/svg+xml," + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 400" width="40" height="400" preserveAspectRatio="none"><path d="M8,0 Q14,200 12,400 L28,400 Q26,200 32,0Z" fill="${col}"/><path d="M14,0 Q18,200 16,400 L19,400 Q21,200 19,0Z" fill="#FFFFFF" opacity="0.5"/></svg>`);
    const img = document.createElement("img"); img.src = uri; img.alt = "";
    const h = Math.hypot(x1 - x0, y1 - y0), ang = Math.atan2(y1 - y0, x1 - x0) * 180 / Math.PI - 90;
    Object.assign(img.style, { position: "absolute", left: (x0 - w / 2) + "px", top: y0 + "px", width: w + "px", height: h + "px", transform: `rotate(${ang}deg)`, transformOrigin: "50% 0%" });
    world.appendChild(img);
  }

  // ---- the blender: base, button, jar back, contents, jar front, lid; placed by the jar seat point (sx, sy) on screen, scale s ----
  function blender(world, sx, sy, s, contents, o) {
    o = o || {};
    const J = SMOOTHIE.jar, Bs = SMOOTHIE.base;
    const bx = sx - Bs.seat[0] * s, by = sy - Bs.seat[1] * s;
    if (!o.noBase) {
      mk(world, "blender-base", bx, by, Bs.w * s, Bs.h * s);
      at(world, "blender-button-" + (o.on ? "on" : "off"), bx + Bs.button[0] * s, by + Bs.button[1] * s, 280, 280, s);
    }
    const jx = sx - J.seat[0] * s, jy = sy - J.seat[1] * s;
    if (o.noJar) return { mouth: [jx + J.mouth[0] * s, jy + J.mouth[1] * s], button: [bx + Bs.button[0] * s, by + Bs.button[1] * s] };
    mk(world, "blender-jar-back", jx, jy, J.w * s, J.h * s);
    if (contents) mk(world, contents, jx, jy, J.w * s, J.h * s);
    if (o.between) o.between();
    mk(world, "blender-jar-front", jx, jy, J.w * s, J.h * s);
    const mx = jx + J.mouth[0] * s, my = jy + J.mouth[1] * s;
    if (o.lid) anchor(world, "blender-lid", mx, my - (o.lidLift || 0), 480, 240, ...SMOOTHIE.lid.seat, s);
    return { mouth: [mx, my], button: [bx + Bs.button[0] * s, by + Bs.button[1] * s] };
  }
  // a glass by its bottom centre (x, y), scale s; fill 0..1 reveals glass-full from the bottom up over glass-empty
  function glass(world, x, y, s, fill) {
    const G = SMOOTHIE.glass, left = x - 160 * s, top = y - 410 * s;
    mk(world, "glass-empty", left, top, 320 * s, 440 * s);
    if (fill > 0) {
      const yTop = G.fillBottom - (G.fillBottom - G.fillTop) * fill - (fill >= 1 ? 100 : 0);
      mk(world, "glass-full", left, top, 320 * s, 440 * s, fill >= 1 ? {} : { crop: [0, yTop / 440, 1, 1] });
    }
  }
  function cutScene(fruit, others, face) {
    return function (world, S, C) {
      homeBtn(world, S);
      const d = S.dishHome, k = S.k, bs = 1.05 * k, bx = d.x - 10 * k, by = S.Y(700);
      const armL = mom(world, S, C, face);
      at(world, "p:cutting-board", bx, by, 1000, 600, bs);
      const [VW, VH] = SMOOTHIE.fruit, vs = k / 1.2, vx = bx - 150 * k, vy = by - 20 * k;
      const span = SMOOTHIE.fruitSpan[fruit], cutArt = span[0] + (span[1] - span[0]) * 0.62;
      at(world, "fruit-" + fruit + "-whole", vx, vy, VW, VH, vs, { crop: cutArt / VW });
      insideStrip(world, fruit, vx, vy, vs, cutArt);
      const r = rng(3);
      [[180, 60], [250, 10], [330, 80], [300, -40]].forEach(([dx, dy]) =>
        at(world, "fruit-" + fruit + "-slice", vx + dx * k + 60 * k, vy + dy * k, 240, 240, 0.72 * k, { rot: r() * 50 - 25 }));
      armL();
      if (wide(S)) pet(world, C, { eyes: "surprised", mouth: "open" });
      const col = fruitColumn(fruit, cutArt - 110), tipX = vx + (cutArt - 110 - VW / 2) * vs, tipY = vy + ((col.top + col.bottom) / 2 + 10 - VH / 2) * vs;
      anchor(world, "p:knife", tipX, tipY, 240, 640, PREP.knifeTip[0], PREP.knifeTip[1], 0.9 * k);
      others.forEach((v, i) => {
        at(world, "fruit-" + v + "-whole", S.sideX - 50 * k, S.Y(470 + i * 190), 672, 504, 0.38 * k / 1.2);
        at(world, "fruit-" + v + "-slice", S.sideX + 125 * k, S.Y(490 + i * 190), 240, 240, 0.45 * k);
      });
    };
  }
  const BL_S = k => 0.66 * k;                        // blender scale in the blender scenes (review fix: 0.6 was small for the main work item)
  const seatY = (S, s) => S.Y(1030) - (520 - 108) * s; // base bottom near the counter front

  const SCENES = {
    // 0. choose the recipe: the smoothie card beside the other three
    "smoothie-home"(world, S, C) {
      const k = S.k, armL = mom(world, S, C, { eyes: "open", mouth: "talk" });
      const cx = (wide(S) ? S.dishHome.x : S.dishHome.x - 40 * k) - 250 * k;     // review fix: keep the new card clear of Pippa and Mom's finger
      at(world, "b:card-pizza", cx - 500 * k, 610, 400, 520, 0.76 * k, { rot: -5 });
      at(world, "s:card-salad", cx - 190 * k, 600, 400, 520, 0.76 * k, { rot: 2 });
      at(world, "c:card-cookies", cx + 120 * k, 610, 400, 520, 0.76 * k, { rot: -3 });
      at(world, "card-smoothie", cx + 440 * k, 540, 400, 520, 1.0 * k, { rot: 4 });
      armL();
      if (wide(S)) pet(world, C, { eyes: "happy", mouth: "open" });
    },
    // 1. wash the fruit: the colander with the fruit in the sink under the tap
    "smoothie-wash"(world, S, C) {
      homeBtn(world, S);
      const d = S.dishHome, k = S.k, sy = S.Y(700);
      const armL = mom(world, S, C, { eyes: "happy", mouth: "talk" });
      at(world, "p:sink-basin", d.x, sy, 900, 560, k * 1.1);
      const fs = 0.95 * k, fx = d.x - 150 * k, fy = sy - 250 * k;
      mk(world, "p:faucet", fx - 120 * fs, fy - 372 * fs, 320 * fs, 400 * fs);
      const ox = fx - 120 * fs + PREP.faucetOut[0] * fs, oy = fy - 372 * fs + PREP.faucetOut[1] * fs;
      const cs = 0.86 * k, cx = d.x + 40 * k, cyy = sy + 20 * k;
      mk(world, "p:water-stream", ox - 120 * k, oy - 4 * k, 240 * k, cyy - 60 * cs - oy);
      at(world, "colander-fruit", cx, cyy, 820, 560, cs);
      const r = rng(6);
      [[-190, -250, .42], [-90, -290, .36], [60, -270, .4], [170, -230, .34], [-270, -170, .3], [250, -160, .32], [-30, -320, .28]].forEach(([dx, dy, s]) =>
        at(world, "s:water-drop", ox + dx * k, cyy + dy * k, 120, 160, s * k, { rot: dx * 0.12 + (r() - .5) * 20 }));
      armL();
      if (wide(S)) pet(world, C, { eyes: "happy", mouth: "open" });
    },
    // 2. choose 3 of 4: banana and strawberry already chosen (glowing), Mom's hand points at the kiwi
    "smoothie-choose"(world, S, C) {
      homeBtn(world, S);
      const k = S.k, s = 0.62 * k, L = S.m + 80 * k, R = C.momLeft + 40 * C.s, w = R - L;
      const armL = mom(world, S, C, { eyes: "open", mouth: "talk" });
      const spots = [["banana", .26, 430], ["strawberry", .72, 420], ["mango", .26, 790], ["kiwi", .72, 790]];
      const chosen = ["banana", "strawberry"];
      spots.forEach(([f, x, y]) => { if (chosen.includes(f)) at(world, "p:temp-glow", L + w * x, S.Y(y) + 20 * k, 400, 280, 1.5 * k); });
      spots.forEach(([f, x, y]) => at(world, "fruit-" + f + "-whole", L + w * x, S.Y(y), 672, 504, s));
      armL();
      if (wide(S)) pet(world, C, { eyes: "happy", mouth: "closed" });
      const [, kx, ky] = spots[3];
      hand(world, "point", L + w * kx + 110 * k, S.Y(ky) + 40 * k, 0.62 * k);
    },
    // 3. chop: the strawberry on the board, cut face on the cut line, slices, knife mid-cut; the other chosen fruit on the left
    "smoothie-chop": cutScene("strawberry", ["banana", "kiwi"], { eyes: "open", mouth: "talk" }),
    "smoothie-chop-banana": cutScene("banana", ["strawberry", "mango"], { eyes: "happy", mouth: "open" }),
    "smoothie-chop-mango": cutScene("mango", ["kiwi", "banana"], { eyes: "open", mouth: "smile" }),
    "smoothie-chop-kiwi": cutScene("kiwi", ["mango", "strawberry"], { eyes: "happy", mouth: "talk" }),
    // 4. into the jar: the jar on its base with heap 2, a strawberry slice carried to the mouth; slices waiting on a small board
    "smoothie-transfer"(world, S, C) {
      homeBtn(world, S);
      const d = S.dishHome, k = S.k, s = BL_S(k), sx = d.x + 120 * k, sy = seatY(S, s);
      const armL = mom(world, S, C, { eyes: "open", mouth: "smile" });
      at(world, "p:cutting-board", d.x - 330 * k, S.Y(820), 1000, 600, 0.52 * k);
      const r = rng(2);
      [["banana", -120, -30], ["strawberry", -30, 10], ["kiwi", 60, -30], ["banana", 110, 40], ["kiwi", -90, 60], ["strawberry", 20, 70]].forEach(([f, dx, dy]) =>
        at(world, "fruit-" + f + "-slice", d.x - 330 * k + dx * k, S.Y(810) + dy * k, 240, 240, 0.4 * k, { rot: r() * 60 }));
      const o = blender(world, sx, sy, s, "jar-heap-2");
      armL();
      if (wide(S)) pet(world, C, { eyes: "surprised", mouth: "open" });
      const gx = o.mouth[0] - 240 * k, gy = o.mouth[1] - 30 * k;               // review fix: carried at the jar mouth, not up at the shelf
      at(world, "fruit-strawberry-slice", gx, gy, 240, 240, 0.6 * k);
      hand(world, "grab", gx, gy, 0.62 * k);
    },
    // 5. milk: the carton tipped over the jar mouth, drops falling onto the full heap
    "smoothie-milk"(world, S, C) {
      homeBtn(world, S);
      const d = S.dishHome, k = S.k, s = BL_S(k), sx = d.x + 60 * k, sy = seatY(S, s);
      const armL = mom(world, S, C, { eyes: "happy", mouth: "talk" });
      const o = blender(world, sx, sy, s, "jar-heap-3");
      armL();
      if (wide(S)) pet(world, C, { eyes: "surprised", mouth: "open" });
      const px = o.mouth[0] - 40 * k, py = o.mouth[1] - 110 * k;              // review fix: the carton was cut off by the top of the screen
      [[0, 40, .34], [6, 95, .3], [-4, 150, .28]].forEach(([dx, dy, sc]) => at(world, "milk-drop", px + dx * k, py + dy * k, 120, 160, sc * k));
      anchor(world, "milk-carton", px, py, 320, 560, ...SMOOTHIE.carton.spout, 0.56 * k, { rot: -100 });
    },
    // 6a. the lid: dropping onto the jar mouth (button still off)
    "smoothie-lid"(world, S, C) {
      homeBtn(world, S);
      const d = S.dishHome, k = S.k, s = BL_S(k), sx = d.x + 60 * k, sy = seatY(S, s);
      const armL = mom(world, S, C, { eyes: "open", mouth: "talk" });
      const o = blender(world, sx, sy, s, "blend-stage-1", { lid: true, lidLift: 150 * k });
      armL();
      if (wide(S)) pet(world, C, { eyes: "happy", mouth: "closed" });
      hand(world, "grab", o.mouth[0] + 60 * k, o.mouth[1] - 150 * k - 40 * k, 0.6 * k);
    },
    // 6b. blend: lid on, the big button pressed and lit, the contents half blended; the three stages on the left
    "smoothie-blend"(world, S, C) {
      homeBtn(world, S);
      const d = S.dishHome, k = S.k, s = BL_S(k), sx = d.x + 60 * k, sy = seatY(S, s);
      const armL = mom(world, S, C, { eyes: "surprised", mouth: "open" });
      const o = blender(world, sx, sy, s, "blend-stage-2", { lid: true, on: true });
      armL();
      if (wide(S)) pet(world, C, { eyes: "surprised", mouth: "open" });
      hand(world, "point", o.button[0] + 20 * k, o.button[1] + 10 * k, 0.6 * k);
      [1, 2, 3].forEach(i => { const js = 0.22 * k, x = S.sideX, y = S.Y(250 + i * 200); for (const n of ["blender-jar-back", "blend-stage-" + i, "blender-jar-front"]) at(world, n, x, y, 600, 800, js); });
    },
    // 7. pour: the jar lifted off the base and tipped over the second glass; the first glass is full
    "smoothie-pour"(world, S, C) {
      homeBtn(world, S);
      const d = S.dishHome, k = S.k, s = 0.52 * k;
      const armL = mom(world, S, C, { eyes: "happy", mouth: "open" });
      blender(world, S.sideX + 150 * k, S.Y(1030) - 412 * 0.42 * k, 0.42 * k, null, { noJar: true });   // review fix: off the tea towel
      const g1x = d.x - 190 * k, g2x = d.x + 70 * k, gy = S.Y(1010), gs = 0.9 * k;
      glass(world, g1x, gy, gs, 1);
      glass(world, g2x, gy, gs, 0.45);
      const spx = g2x - 10 * k, spy = gy - 560 * k;                 // the jar's spout, above the second glass
      stream(world, spx, spy + 8 * k, g2x, gy - (410 - 250) * gs, 30 * k, "#F6A186");
      for (const n of ["blender-jar-back", "blend-stage-3", "blender-jar-front"]) anchor(world, n, spx, spy, 600, 800, ...SMOOTHIE.jar.spout, s, { rot: -62 });
      armL();
      if (wide(S)) pet(world, C, { eyes: "surprised", mouth: "open" });
    },
    // 8. share: one glass in front of Mom, one carried to Pippa
    "smoothie-share"(world, S, C) {
      homeBtn(world, S);
      const d = S.dishHome, k = S.k;
      const armL = mom(world, S, C, { eyes: "happy", mouth: "smile", armL: -18 });
      blender(world, d.x - 330 * k, S.Y(1030) - 412 * 0.42 * k, 0.42 * k, null, { noJar: true });
      armL();
      const faceLeft = C.momLeft + (500 - 150) * C.s;
      glass(world, faceLeft - 40 * k, S.Y(1040), 0.8 * k, 1);                   // Mom's glass
      const ps = 0.62 * k, pw = 600 * ps, ph = 700 * ps;
      const px = Math.min(d.x + 393 * k - pw * 0.25, faceLeft - pw * 0.92 - 140 * k);
      const P = { x: px, y: S.Y(1000) - 684 * ps, w: pw, h: ph };
      pet(world, C, { eyes: "surprised", mouth: "open" }, P);
      const gx = P.x + 20 * k, gy = S.Y(1000);                                     // review fix: carried low, in front of Pippa's paws, not over her face
      glass(world, gx, gy, 0.66 * k, 1);
      hand(world, "grab", gx - 70 * k, gy - 110 * k, 0.6 * k);
    },
    // 9. photo: two glasses and fruit in photo-frame-smoothie, stars
    "smoothie-photo"(world, S, C) {
      const d = S.dishHome, k = S.k;
      const armL = mom(world, S, C, { eyes: "happy", mouth: "open", armL: 55 });
      const fs = 0.95 * k, fx = d.x, fy = S.Y(560);
      const hs = 540 * fs, hx = fx - hs / 2, hy = fy - hs / 2, sc = hs / 1080, cx0 = 660;
      mk(world, "b:bg-kitchen-landscape", hx - cx0 * sc, hy, 2400 * sc, 1080 * sc, { crop: [cx0 / 2400, 0, (cx0 + 1080) / 2400, 1] });
      glass(world, fx - 90 * fs, fy + 230 * fs, 0.78 * fs, 1);                  // review fix: smaller, so the straws stay inside the window
      glass(world, fx + 110 * fs, fy + 240 * fs, 0.7 * fs, 1);
      [["strawberry", -200, 200, .45], ["kiwi", 210, 205, .45], ["banana", -200, 110, .4], ["mango", 10, 235, .4]].forEach(([f, dx, dy, s]) =>
        at(world, "fruit-" + f + "-slice", fx + dx * fs, fy + dy * fs, 240, 240, s * fs));
      mk(world, "photo-frame-smoothie", fx - 350 * fs, fy - 350 * fs, 700 * fs, 780 * fs);
      armL();
      if (wide(S)) pet(world, C, { eyes: "happy", mouth: "open" });
      const r = rng(9), momL = C.momLeft + 280 * C.s;
      [[-470, -240, .7], [470, -260, .8], [-520, 120, .55], [520, 150, .6], [-380, 340, .45], [390, 380, .5]].forEach(([dx, dy, s]) => {
        const x = fx + dx * k, y = fy + dy * k, P = C.pet; if (x + 100 * s * k > momL) return;
        if (wide(S) && x + 100 * s * k > P.x && y + 100 * s * k > P.y) return;
        at(world, "b:star", x, y, 200, 200, s * k, { rot: r() * 50 - 25 });
      });
    },
  };
  const ORDER = [["smoothie-home", "Choose the smoothie card"], ["smoothie-wash", "Wash the fruit"], ["smoothie-choose", "Choose 3 fruits"],
    ["smoothie-chop", "Chop"], ["smoothie-transfer", "Into the jar"], ["smoothie-milk", "Pour the milk"], ["smoothie-lid", "Lid on"],
    ["smoothie-blend", "Blend"], ["smoothie-pour", "Pour into glasses"], ["smoothie-share", "Share with Mom and Pippa"], ["smoothie-photo", "The photo"]];
  Object.assign(SB.SCENES, SCENES);
  window.ScenesSmoothie = { SMOOTHIE, ORDER, SCENES, fruitColumn, insideStrip, toCanvas: SP.toCanvasPrep };
})();
