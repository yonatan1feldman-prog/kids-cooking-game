// Prep-step scenes for images-b-prep, composed with the existing images-b composer (../images-b/scenes.js):
// same world (1080 high, W from the screen ratio), same stage()/cast() layout, same background and Mom/Pippa layers.
// New assets load from this folder, existing ones from ../images-b/. Every drawing is an <img>; toCanvasPrep() draws
// them the way the game does (rasterise at native size -> drawImage), and also supports a horizontal crop for cut vegetables.
(function () {
  const B = window.IMAGES_B_DIR || "../images-b/", HERE = window.PREP_BASE || "./";
  const SB = window.ScenesB, ART = SB.ART;
  const src = n => (n.startsWith("b:") ? B + n.slice(2) : HERE + n) + ".svg";

  // anchors / geometry of the new files (see README-prep.md)
  const PREP = {
    panel: { w: 1200, h: 720, c: [600, 540], ang: { 50: -80, 100: -40, 150: 0, 200: 40, 250: 80 },
             digit: { 50: [214, 472], 100: [329, 218], 150: [600, 163], 200: [875, 212], 250: [1020, 466] } },
    knifeTip: [118, 618], faucetOut: [262, 176], spoon: [120, 500],
    momHands: { knife: [149, 364], press: [140, 150], mitt: [150, 150] },
    // measured by tools/gen_prep_e.py --profiles: [x, top, bottom] of the body in the 672x504 whole-veg file; stripH = strip viewBox height (width 60)
    vegProfile: {"tomato":[[153,193.9,364.6],[177,158.7,398.7],[201,133.1,422.9],[225,115.8,437.4],[249,103.7,447.5],[273,96.8,454.2],[297,93.2,458.5],[321,90.6,462.5],[345,89.4,466.4],[369,91.0,466.4],[393,96.1,461.0],[417,103.8,452.2],[441,113.1,441.3],[465,125.3,427.3],[489,145.2,406.5],[513,177.4,375.5],[537,247.7,320.3]],"mushroom":[[95,234.5,287.2],[119,169.1,307.7],[143,138.5,312.1],[167,117.7,311.2],[191,102.2,309.6],[215,90.5,309.6],[239,81.6,459.2],[263,75.2,471.0],[287,70.7,472.8],[311,68.2,472.8],[335,67.2,472.8],[359,68.1,472.8],[383,70.5,472.8],[407,74.8,471.4],[431,81.0,461.1],[455,89.7,309.6],[479,101.1,309.6],[503,116.2,310.9],[527,136.5,312.1],[551,165.7,308.4],[575,224.2,291.2]],"pepper":[[64,266.0,317.1],[88,152.4,431.9],[112,132.8,449.5],[136,122.5,460.4],[160,116.0,467.2],[184,111.7,471.6],[208,108.6,474.9],[232,106.2,477.1],[256,104.6,478.7],[280,103.5,479.8],[304,103.0,480.3],[328,102.8,480.2],[352,103.0,479.7],[376,103.6,478.8],[400,104.6,477.3],[424,106.3,475.9],[448,109.1,474.1],[472,114.0,471.7],[496,122.3,467.6],[520,134.1,460.1],[544,148.5,447.3],[568,175.3,424.7]],"onion":[[83,257.4,342.6],[107,219.0,381.0],[131,196.1,403.9],[155,179.4,420.6],[179,166.7,433.3],[203,156.8,443.2],[227,149.2,450.8],[251,143.6,456.4],[275,139.8,460.2],[299,137.5,462.5],[323,136.8,463.2],[347,137.6,462.4],[371,139.9,460.1],[395,143.7,456.3],[419,149.0,451.0],[443,156.1,443.9],[467,165.5,434.5],[491,177.3,422.7],[515,192.6,407.4],[539,213.1,386.9],[563,245.5,356.0],[587,260.1,317.3],[611,269.8,306.3]]},
    stripH: {"tomato":378,"mushroom":406,"pepper":378,"onion":327}, mushCapFrac: 0.5976,
    vegSpan: { tomato: [125, 547], mushroom: [91, 581], pepper: [60, 588], onion: [31, 636] }, veg: [672, 504],
  };

  // top/bottom of a whole vegetable's body at file x (linear interpolation of the measured profile)
  function vegColumn(veg, x) {
    const pr = PREP.vegProfile[veg];
    if (x <= pr[0][0]) return { top: pr[0][1], bottom: pr[0][2] };
    for (let i = 1; i < pr.length; i++) if (x <= pr[i][0]) {
      const [x0, t0, b0] = pr[i - 1], [x1, t1, b1] = pr[i], u = (x - x0) / (x1 - x0);
      return { top: t0 + (t1 - t0) * u, bottom: b0 + (b1 - b0) * u };
    }
    const l = pr[pr.length - 1]; return { top: l[1], bottom: l[2] };
  }
  // place the cut-face strip on the cut line: whole veg drawn centred at (vx,vy) with scale vs, cut at file x = cutX
  function insideStrip(world, veg, vx, vy, vs, cutX) {
    const [VW, VH] = PREP.veg, col = vegColumn(veg, cutX), h = (col.bottom - col.top) * vs;
    const left = vx - VW / 2 * vs + (cutX - 30) * vs, top = vy - VH / 2 * vs + col.top * vs;
    const capOnly = veg === "mushroom" && col.bottom < 400;          // outside the stem: use only the cap part of the strip
    if (capOnly) mk(world, "veg-mushroom-inside", left, top, 60 * vs, h / PREP.mushCapFrac, { crop: [0, 0, 1, PREP.mushCapFrac] });
    else mk(world, "veg-" + veg + "-inside", left, top, 60 * vs, h);
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
  // place so that the art point (ax,ay) lands on (x,y)
  const anchor = (world, name, x, y, vw, vh, ax, ay, s, o) => {
    o = Object.assign({}, o); if (o.rot) o.origin = `${ax / vw * 100}% ${ay / vh * 100}%`;
    return mk(world, name, x - ax * s, y - ay * s, vw * s, vh * s, o);
  };
  const BAKED = "url(#bakeTint)";
  function rng(seed) { return () => (seed = (seed * 16807) % 2147483647) / 2147483647; }

  function mom(world, S, C, o) {
    o = o || {};
    const s = C.s, x = C.momLeft, y = C.momTop, w = 800 * s, h = 800 * s;
    const arm = (name, rot, piv) => mk(world, name, x, y, w, h, rot ? { rot, origin: `${piv[0] / 8}% ${piv[1] / 8}%` } : {});
    if (!o.noArmR) arm("b:mom-arm-right", o.armR || 0, ART.mom.pivotR);
    for (const n of ["b:mom-body", "b:mom-head", "b:mom-hair", "b:mom-eyes-" + (o.eyes || "open"), o.mouth === "chew" ? "mom-mouth-chew" : "b:mom-mouth-" + (o.mouth || "smile")]) mk(world, n, x, y, w, h);
    return () => { if (!o.noArmL) arm("b:mom-arm-left", o.armL || 0, ART.mom.pivotL); };
  }
  function pet(world, C, o, P) {
    o = o || {}; P = P || C.pet;
    for (const n of ["b:character-body", "b:character-eyes-" + (o.eyes || "open"), "b:character-mouth-" + (o.mouth || "closed")]) mk(world, n, P.x, P.y, P.w, P.h);
  }
  function hand(world, kind, x, y, s, rot) {       // images-b demo hands
    const a = ART.hands[kind];
    mk(world, "b:mom-hand-" + kind, x - a[0] * s, y - a[1] * s, 400 * s, 400 * s, rot ? { rot, origin: `${a[0] / 4}% ${a[1] / 4}%` } : {});
  }
  function momHand(world, kind, x, y, s, rot) {    // new demo hands
    const a = PREP.momHands[kind];
    anchor(world, "mom-hand-" + kind, x, y, 400, 400, a[0], a[1], s, { rot });
  }
  function board(world, x, y, k) { at(world, "b:pizza-board", x, y + 5 * k, 820, 830, k); }
  function pizza(world, x, y, k, st) {
    st = st || {};
    const f = st.baked ? BAKED : null;
    at(world, "b:dough-flat", x, y, 720, 720, k, { filter: f });
    const r = rng(st.seed || 7);
    if (st.sauce) {
      const spots = [];
      for (let ring = 0; ring < 4; ring++) { const cnt = [1, 6, 11, 15][ring], rr = [0, 95, 180, 250][ring] * k; for (let i = 0; i < cnt; i++) spots.push([Math.cos(i / cnt * 6.283 + ring) * rr, Math.sin(i / cnt * 6.283 + ring) * rr]); }
      for (const [dx, dy] of spots) { const d = 175 * k; mk(world, "b:sauce-blob", x + dx - d / 2, y + dy - d / 2, d, d, { rot: r() * 360, filter: f }); }
    }
    if (st.cheese) for (let i = 0; i < 70; i++) { const a = r() * 6.283, rr = Math.sqrt(r()) * 262 * k; at(world, "b:cheese-shred", x + Math.cos(a) * rr, y + Math.sin(a) * rr, 80, 44, k, { rot: r() * 360, filter: f }); }
    const names = ["tomato", "olive", "mushroom", "corn", "pepper", "onion"];
    const pos = [[-150, -150], [45, -205], [190, -70], [-215, 30], [-20, -30], [150, 120], [-120, 180], [55, 205], [-60, 90], [120, -170], [230, 60], [-190, -60]];
    for (let i = 0; i < (st.tops || 0); i++) { const [dx, dy] = pos[i % pos.length]; at(world, "b:topping-" + names[i % 6], x + dx * k, y + dy * k, 140, 140, k, { rot: r() * 60 - 30, filter: f }); }
  }
  const homeBtn = (world, S) => at(world, "b:btn-home", S.home.x, S.home.y, 240, 240, S.homeScale);
  const wide = S => S.W >= 1700;

  const SCENES = {
    // 1. wash hands: sink, faucet, stream, the child's hands under the water, bubbles
    wash(world, S, C) {
      homeBtn(world, S);
      const d = S.dishHome, k = S.k, sy = S.Y(700);
      const armL = mom(world, S, C, { eyes: "happy", mouth: "talk" });
      at(world, "sink-basin", d.x, sy, 900, 560, k * 1.1);
      const fs = 0.95 * k, fx = d.x - 150 * k, fy = sy - 250 * k;              // faucet base on the back rim
      mk(world, "faucet", fx - 120 * fs, fy - 372 * fs, 320 * fs, 400 * fs);
      const ox = fx - 120 * fs + PREP.faucetOut[0] * fs, oy = fy - 372 * fs + PREP.faucetOut[1] * fs;
      const hs = 1.3 * k, htop = 1080 + 30 * k - 420 * hs, tips = htop + 110 * hs;   // fingertips ~y110 in kid-hands
      mk(world, "water-stream", ox - 120 * k, oy - 4 * k, 240 * k, tips + 40 * k - oy);
      armL();
      if (wide(S)) pet(world, C, { eyes: "happy", mouth: "open" });
      mk(world, "kid-hands", ox - 300 * hs, htop, 600 * hs, 420 * hs);
      const r = rng(4);
      [[-250, -120, .9], [260, -60, .7], [-120, 60, .55], [160, 120, .5], [330, -230, .45], [-360, -260, .6], [60, -330, .4]].forEach(([dx, dy, s]) =>
        at(world, "bubble", ox + dx * k, sy + dy * k, 240, 240, s * k, { rot: r() * 40 }));
    },
    // 2. knead: dough on the board, Mom's pressing hand demonstrates
    knead(world, S, C) {
      homeBtn(world, S);
      const d = S.dishHome, k = S.k;
      const armL = mom(world, S, C, { eyes: "happy", mouth: "talk" });
      board(world, d.x, d.y, k);
      at(world, "dough-knead-2", d.x, d.y + 10 * k, 360, 300, 1.6 * k);
      armL();
      if (wide(S)) pet(world, C, { eyes: "open", mouth: "closed" });
      at(world, "press-dent", d.x + 10 * k, d.y + 5 * k, 260, 140, 1.4 * k);          // wider than the hand so the pressed hollow shows around it
      momHand(world, "press", d.x + 30 * k, d.y - 30 * k, 0.95 * k);
      // the three knead stages as a strip on the left (preview of the progression)
      [1, 2, 3].forEach((i) => at(world, "dough-knead-" + i, S.sideX, S.Y(330 + i * 190), 360, 300, 0.62 * k));
    },
    // 3. mash tomatoes in the big bowl
    mash(world, S, C) {
      homeBtn(world, S);
      const d = S.dishHome, k = S.k, s = 1.25 * k, bx = d.x, by = S.Y(640);
      const armL = mom(world, S, C, { eyes: "open", mouth: "smile" });
      at(world, "prep-bowl-back", bx, by, 640, 520, s);
      at(world, "sauce-stage-1", bx, by, 640, 520, s);
      at(world, "press-dent", bx - 70 * s, by - 92 * s, 260, 140, 1.3 * k);      // on the tomatoes, inside the bowl opening (front layer covers y > by-84s)
      anchor(world, "spoon-wood", bx + 250 * s, by - 20 * s, 240, 620, 120, 500, 0.8 * k, { rot: 28 });
      at(world, "prep-bowl-front", bx, by, 640, 520, s);
      at(world, "sauce-stage-0", S.sideX, S.Y(560), 640, 520, 0.36 * k);
      at(world, "prep-bowl-front", S.sideX, S.Y(560), 640, 520, 0.36 * k);
      armL();
      if (wide(S)) pet(world, C, { eyes: "surprised", mouth: "open" });
      momHand(world, "press", bx - 60 * s, by - 60 * s, 0.95 * k);
    },
    // 4. grate the cheese
    grate(world, S, C) {
      homeBtn(world, S);
      const d = S.dishHome, k = S.k, gx = d.x - 60 * k, gy = S.Y(640);
      const armL = mom(world, S, C, { eyes: "happy", mouth: "open" });
      at(world, "cheese-pile-2", gx + 10 * k, gy + 260 * k, 400, 260, 1.15 * k);
      at(world, "grater", gx, gy, 506, 736, 1.05 * k / 1.15);
      at(world, "cheese-block", gx - 20 * k, gy + 20 * k, 380, 300, 0.8 * k, { rot: -12 });
      at(world, "cheese-pile-3", gx + 380 * k, gy + 250 * k, 400, 260, 0.75 * k);
      armL();
      if (wide(S)) pet(world, C, { eyes: "happy", mouth: "closed" });
      board(world, S.sideX, S.Y(640), 0.4 * k); pizza(world, S.sideX, S.Y(638), 0.4 * k, { sauce: 1 });
      at(world, "cheese-handful", S.sideX + 20 * k, S.Y(540), 300, 260, 0.9 * k);
    },
    // 5. cut a vegetable: the whole pepper is cropped at the cut line, slices lie to the right, the knife is mid-cut
    cut(world, S, C) {
      homeBtn(world, S);
      const d = S.dishHome, k = S.k, bs = 1.05 * k, bx = d.x - 10 * k, by = S.Y(700);
      const armL = mom(world, S, C, { eyes: "open", mouth: "talk" });
      at(world, "cutting-board", bx, by, 1000, 600, bs);
      const veg = "pepper", [VW, VH] = PREP.veg, vs = k / 1.2, vx = bx - 150 * k, vy = by - 20 * k;
      const span = PREP.vegSpan[veg], cutArt = span[0] + (span[1] - span[0]) * 0.62;
      at(world, "veg-" + veg + "-whole", vx, vy, VW, VH, vs, { crop: cutArt / VW });
      insideStrip(world, veg, vx, vy, vs, cutArt);
      const r = rng(3);
      [[180, 60, 0.8], [260, 30, 0.8], [330, 90, 0.8]].forEach(([dx, dy, s], i) =>
        at(world, "veg-" + veg + "-slice", vx + dx * k + 60 * k, vy + dy * k, 240, 240, s * k, { rot: r() * 50 - 25 }));
      armL();
      if (wide(S)) pet(world, C, { eyes: "surprised", mouth: "open" });
      // knife mid-cut: tip on the cut line
      const tipX = vx + (cutArt - 110 - VW / 2) * vs, tipY = vy + 90 * vs;    // cutting the next slice, 110 units left of the fresh cut face
      anchor(world, "knife", tipX, tipY, 240, 640, PREP.knifeTip[0], PREP.knifeTip[1], 0.9 * k);
      // the other whole vegetables + their slices waiting in the left column
      ["tomato", "mushroom", "onion"].forEach((v, i) => {
        at(world, "veg-" + v + "-whole", S.sideX - 50 * k, S.Y(470 + i * 190), 672, 504, 0.38 * k / 1.2);
        at(world, "veg-" + v + "-slice", S.sideX + 125 * k, S.Y(490 + i * 190), 240, 240, 0.45 * k);
      });
    },
    // 6. open the can and pour the corn into the bowl; the olive jar waits, open, with its lid
    can(world, S, C) {
      homeBtn(world, S);
      const d = S.dishHome, k = S.k, s = 1.0 * k, bx = d.x + 40 * k, by = S.Y(700);
      const armL = mom(world, S, C, { eyes: "surprised", mouth: "open" });
      at(world, "prep-bowl-back", bx, by, 640, 520, s);
      const r = rng(8);
      for (let i = 0; i < 18; i++) at(world, "b:topping-corn", bx + (r() - .5) * 360 * s, by - 40 * s + (r() - .5) * 60 * s, 140, 140, 0.55 * k, { rot: r() * 360 });
      at(world, "prep-bowl-front", bx, by, 640, 520, s);
      // pouring: can tipped over the bowl, kernels falling
      at(world, "can-corn-open", bx - 250 * k, by - 330 * k, 340, 460, 0.85 * k, { rot: 118 });
      for (let i = 0; i < 6; i++) at(world, "b:topping-corn", bx - 140 * k + (r() - .5) * 60 * k, by - 250 * k + i * 36 * k, 140, 140, 0.45 * k, { rot: r() * 360 });
      at(world, "can-lid", bx - 420 * k, by + 200 * k, 300, 260, 0.6 * k, { rot: -10 });
      at(world, "jar-olives-closed", S.sideX - 60 * k, S.Y(470), 340, 480, 0.62 * k);
      at(world, "jar-olives-open", S.sideX + 90 * k, S.Y(780), 340, 480, 0.62 * k);
      at(world, "jar-lid", S.sideX - 70 * k, S.Y(850), 300, 240, 0.62 * k);
      at(world, "can-corn-closed", S.sideX + 110 * k, S.Y(430), 340, 460, 0.55 * k);
      armL();
      if (wide(S)) pet(world, C, { eyes: "happy", mouth: "open" });
    },
    // 7. oven control panel: needle on 200, the 200 glowing, start button on
    panel(world, S, C) {
      homeBtn(world, S);
      const d = S.dishHome, k = S.k, ps = 0.82 * k, px = d.x - (wide(S) ? 0 : 90 * k), py = S.Y(470);
      const armL = mom(world, S, C, { eyes: "surprised", mouth: "open" });
      const P0 = PREP.panel, left = px - P0.w * ps / 2, top = py - P0.h * ps / 2;
      mk(world, "oven-panel", left, top, P0.w * ps, P0.h * ps);
      const g = P0.digit[200];
      at(world, "temp-glow", left + g[0] * ps, top + g[1] * ps, 400, 280, ps);
      mk(world, "oven-needle", left, top, P0.w * ps, P0.h * ps, { rot: P0.ang[200], origin: `${P0.c[0] / P0.w * 100}% ${P0.c[1] / P0.h * 100}%` });
      const byy = S.Y(880), bx0 = px - 60 * k;
      at(world, "btn-temp-down", bx0 - 290 * k, byy, 240, 240, k);
      at(world, "oven-start-on", bx0, byy, 320, 320, 0.85 * k);
      at(world, "btn-temp-up", bx0 + 290 * k, byy, 240, 240, k);
      armL();
      if (wide(S)) pet(world, C, { eyes: "surprised", mouth: "open" });
      at(world, "oven-start-off", S.sideX, S.Y(880), 320, 320, 0.55 * k);
    },
    // 8. take the pizza out: open oven, baked pizza on its board coming out, held with the mitt
    bakeout(world, S, C) {
      homeBtn(world, S);
      const d = S.dishHome, k = S.k, o = S.oven, s = S.ovenScale;
      const armL = mom(world, S, C, { eyes: "happy", mouth: "open" });
      mk(world, "b:oven-open", o.x - 350 * s, o.y - 400 * s, 700 * s, 800 * s);
      const bk = 0.6 * k, bxp = o.x + 310 * s + 290 * k, byp = S.Y(690);   // just out of the oven, beside the open door
      board(world, bxp, byp, bk); pizza(world, bxp, byp - 3, bk, { sauce: 1, cheese: 1, tops: 9, baked: true, seed: 5 });
      at(world, "mitt-single", bxp - 250 * k, byp + 20 * k, 320, 400, 0.66 * k, { rot: 90 });       // the child's mitt pulls the board out
      armL();
      if (wide(S)) pet(world, C, { eyes: "surprised", mouth: "open" });
      if (wide(S)) at(world, "oven-mitts", bxp + 400 * k, S.Y(880), 480, 400, 0.45 * k, { rot: -6 });
      momHand(world, "mitt", bxp + 215 * k, byp + 70 * k, 0.6 * k);                                   // Mom's mitt on the far rim
    },
    // 9. Mom eats a slice (chewing mouth), a bitten slice in her hand
    momeats(world, S, C) {
      homeBtn(world, S);
      const d = S.dishHome, k = S.k;
      const armL = mom(world, S, C, { eyes: "happy", mouth: "chew", armL: -12 });
      board(world, d.x, d.y, k);
      for (let i = 0; i < 5; i++) { const a = -90 + i * 60 + 60, rr = 135 * k, rad = a * Math.PI / 180; at(world, "b:pizza-slice", d.x + Math.cos(rad) * rr, d.y + Math.sin(rad) * rr, 300, 300, 1.05 * k, { rot: a - 90 + 180, filter: BAKED }); }
      armL();
      const mx = C.momLeft + 500 * C.s, my = C.momTop + 350 * C.s;          // Mom's mouth
      at(world, "b:pizza-slice", mx - 205 * C.s, my + 20 * C.s, 300, 300, 0.85 * C.s, { rot: -90, filter: BAKED });
      hand(world, "grab", mx - 290 * C.s, my + 30 * C.s, 0.6 * C.s);
      if (wide(S)) pet(world, C, { eyes: "happy", mouth: "chew" });
    },
    // 10. celebration: the framed photo of the finished pizza, stars
    celebrate(world, S, C) {
      const d = S.dishHome, k = S.k;
      const armL = mom(world, S, C, { eyes: "happy", mouth: "open", armL: 55 });
      const fs = 0.95 * k, fx = d.x, fy = S.Y(560);
      // the photo: baked pizza on its board, fitted to the square window (540) of the frame
      const hs = 540 * fs, hx = fx - hs / 2, hy = fy - hs / 2, sc = hs / 1080, cx0 = 660;   // kitchen square x 660..1740 of the bg
      mk(world, "b:bg-kitchen-landscape", hx - cx0 * sc, hy, 2400 * sc, 1080 * sc, { crop: [cx0 / 2400, 0, (cx0 + 1080) / 2400, 1] });
      const wk = hs / 820 * 0.86;
      board(world, fx, fy + 40 * fs, wk); pizza(world, fx, fy + 38 * fs, wk, { sauce: 1, cheese: 1, tops: 12, baked: true, seed: 4 });
      mk(world, "photo-frame", fx - 350 * fs, fy - 350 * fs, 700 * fs, 780 * fs);
      armL();
      if (wide(S)) pet(world, C, { eyes: "happy", mouth: "open" });
      const r = rng(9);
      [[-470, -240, .7], [470, -260, .8], [-520, 120, .55], [520, 150, .6], [-380, 340, .45], [390, 380, .5]].forEach(([dx, dy, s]) => at(world, "b:star", fx + dx * k, fy + dy * k, 200, 200, s * k, { rot: r() * 50 - 25 }));
    },
    // 11. title: the logo, Mom and Pippa, the play button
    title(world, S, C) {
      const k = S.k;
      const armL = mom(world, S, C, { eyes: "happy", mouth: "open" });
      armL();
      if (wide(S)) pet(world, C, { eyes: "happy", mouth: "open" });
      const lx = wide(S) ? S.dishHome.x - 80 * k : (S.m + C.momLeft + 330 * C.s) / 2;
      at(world, "logo-cooking-with-mom", lx, S.Y(330), 900, 400, k);
      at(world, "b:btn-play", lx, S.Y(740), 240, 240, 1.35 * k);
    },
  };
  const ORDER = [["title", "Title with the logo"], ["wash", "Wash hands"], ["knead", "Knead the dough"], ["mash", "Mash the tomatoes"],
    ["grate", "Grate the cheese"], ["cut", "Cut the vegetables"], ["can", "Open the can and the jar"], ["panel", "Set the oven to 200"],
    ["bakeout", "Take the pizza out"], ["momeats", "Mom eats a slice"], ["celebrate", "Celebrate with the photo"]];
  Object.assign(SB.SCENES, SCENES);

  // img -> native canvas -> drawImage (as Phaser), with support for data-crop (keep the left fraction of the image)
  async function toCanvasPrep(host, world, W) {
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
      const [c0, c1, c2, c3] = i.dataset.crop ? i.dataset.crop.split(",").map(Number) : [0, 0, 1, 1];
      g.drawImage(t, t.width * c0, t.height * c1, t.width * (c2 - c0), t.height * (c3 - c1), x - ox + w * c0, y - oy + h * c1, w * (c2 - c0), h * (c3 - c1)); g.restore();
    }
    c.style.width = "100%"; c.style.display = "block";
    world.replaceWith(c);
    return c;
  }
  window.ScenesPrep = { PREP, ORDER, SCENES, toCanvasPrep, vegColumn, insideStrip };
})();
