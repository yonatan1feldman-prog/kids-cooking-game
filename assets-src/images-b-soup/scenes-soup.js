// Vegetable-soup scenes for images-b-soup, composed with the existing composers, read-only: ../images-b/scenes.js
// (world 1080 high, width W from the screen ratio, stage()/cast() layout, background, Mom and Pippa),
// ../images-b-prep/scenes-prep.js (cutting board, knife, spoon, frame), ../images-b-salad/scenes-salad.js (the carrot and
// its cut-face rules) and ../images-b-pancakes/scenes-pancakes.js (the cooktop: stove-top, the knob and the flame).
// New assets load from this folder, "b:" from images-b, "p:" from images-b-prep, "s:" from images-b-salad, "k:" from images-b-pancakes.
// Every drawing is an <img>. The water stream and the falling peel particles are drawn by the game in code; here the existing
// water-drop / peel-strip files stand in for them.
// toCanvas() draws the scene the way the game does (img -> native canvas -> drawImage) and honours data-crop.
(function () {
  const B = window.IMAGES_B_DIR || "../images-b/", PR = window.PREP_BASE || "../images-b-prep/", SA = window.SALAD_BASE || "../images-b-salad/";
  const CO = window.COOKIES_BASE || "../images-b-cookies/", SM = window.SMOOTHIE_BASE || "../images-b-smoothie/";
  const PK = window.PANCAKES_BASE || "../images-b-pancakes/", HERE = window.SOUP_BASE || "./";
  const SB = window.ScenesB, SP = window.ScenesPrep, SL = window.ScenesSalad, SPK = window.ScenesPancakes;
  const ART = SB.ART, PREP = SP.PREP, PANC = SPK.PANC;
  const DIR = { "b:": B, "p:": PR, "s:": SA, "c:": CO, "m:": SM, "k:": PK };
  const src = n => n.startsWith("data:") ? n : (DIR[n.slice(0, 2)] ? DIR[n.slice(0, 2)] + n.slice(2) : HERE + n) + ".svg";

  // geometry of the new files (see README-soup.md); tools/check_soup.py compares every number here with the generators
  const SOUP = {
    veg: [672, 504],
    // measured by tools/gen_soup_a.py --profiles: [x, top, bottom] of the body in the 672x504 whole-veg file; strip viewBox = 60 x stripH
    vegSpan: { potato: [91, 599], zucchini: [48, 624] }, stripH: { potato: 224, zucchini: 198 },
    vegProfile: {"potato":[[95,298.6,356.1],[119,264.8,386.8],[143,249.5,402.7],[167,240.1,414.2],[191,234.0,423.8],[215,230.4,432.0],[239,228.3,439.2],[263,227.8,445.1],[287,228.3,449.6],[311,229.5,452.5],[335,231.3,453.9],[359,233.3,453.5],[383,235.7,451.7],[407,238.4,448.1],[431,242.0,443.1],[455,246.7,436.9],[479,253.1,429.8],[503,261.5,422.0],[527,272.6,413.3],[551,286.4,402.7],[575,304.5,388.7]],"zucchini":[[52,351.2,392.5],[76,307.6,434.6],[100,297.2,443.4],[124,289.0,450.2],[148,283.1,454.7],[172,278.7,457.7],[196,275.4,459.9],[220,273.0,461.4],[244,271.2,462.3],[268,269.9,462.9],[292,269.0,463.4],[316,268.3,463.7],[340,267.9,464.1],[364,267.6,464.6],[388,267.4,465.1],[412,267.6,465.4],[436,268.2,465.6],[460,269.3,465.2],[484,271.3,464.4],[508,274.3,462.7],[532,278.6,459.6],[556,284.9,454.8],[580,294.3,446.8],[604,311.1,431.7]]},
    peeler: { w: 420, h: 460, grip: [210, 92], blade: [126, 294, 358] },      // grip = under the finger; blade line x 126..294 at y 358
    peelStrip: [280, 240],
    pot: { w: 1000, h: 760, rim: [500, 250, 400, 108], opening: [500, 258, 368, 92], base: [500, 700, 330, 25], onStove: [-20, -100] },   // onStove = pot top-left in stove units (base seated 150 in front of the burner)
    jug: { w: 360, h: 520, spout: [52, 118] },
    bowl: { w: 560, h: 360, opening: [280, 152, 226, 60] },
    portion: { w: 360, h: 420, at: [150, 250] },
    stove: { w: 1200, h: 920, burner: [480, 450], knob: [1040, 752] },        // = the images-b-pancakes cooktop
  };
  // every vegetable that can be cut: the two new ones + the salad's + the prep's
  const allProfile = veg => SOUP.vegProfile[veg] || SL.SALAD.vegProfile[veg] || PREP.vegProfile[veg];
  const allSpan = veg => SOUP.vegSpan[veg] || SL.SALAD.vegSpan[veg] || PREP.vegSpan[veg];
  const vegDir = veg => (veg === "potato" || veg === "zucchini") ? "" : (veg === "carrot" || veg === "cucumber") ? "s:" : "p:";

  function vegColumn(veg, x) {
    const pr = allProfile(veg);
    if (x <= pr[0][0]) return { top: pr[0][1], bottom: pr[0][2] };
    for (let i = 1; i < pr.length; i++) if (x <= pr[i][0]) {
      const [x0, t0, b0] = pr[i - 1], [x1, t1, b1] = pr[i], u = (x - x0) / (x1 - x0);
      return { top: t0 + (t1 - t0) * u, bottom: b0 + (b1 - b0) * u };
    }
    const l = pr[pr.length - 1]; return { top: l[1], bottom: l[2] };
  }
  // the cut-face strip on the cut line (same rule as README-prep / README-salad)
  function insideStrip(world, veg, vx, vy, vs, cutX) {
    const [VW, VH] = SOUP.veg, col = vegColumn(veg, cutX), h = (col.bottom - col.top) * vs;
    mk(world, vegDir(veg) + "veg-" + veg + "-inside", vx - VW / 2 * vs + (cutX - 30) * vs, vy - VH / 2 * vs + col.top * vs, 60 * vs, h);
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

  // ---- pieces ----------------------------------------------------------------------------------------------------
  // the cooktop with the POT on the big burner: stove top-left (x0,y0), scale s. o: {on, fill: "pot-heap-2"|"soup-stage-3", between}
  function potStove(world, x0, y0, s, o) {
    o = o || {};
    const St = SOUP.stove, Pt = SOUP.pot;
    mk(world, "k:stove-top", x0, y0, St.w * s, St.h * s);
    const bx = x0 + St.burner[0] * s, by = y0 + St.burner[1] * s;
    const kx = x0 + St.knob[0] * s, ky = y0 + St.knob[1] * s;
    if (o.knob !== false) at(world, "k:stove-knob-" + (o.on ? "on" : "off"), kx, ky, 280, 280, s);
    if (o.on) at(world, "k:flame", bx, by, 1000, 1000, s);
    // pot top-left = stove origin + onStove * s (the base ellipse seated just in front of the burner, see README-soup.md)
    const px = x0 + Pt.onStove[0] * s, py = y0 + Pt.onStove[1] * s;
    mk(world, "pot-back", px, py, Pt.w * s, Pt.h * s);
    if (o.fill) mk(world, o.fill, px, py, Pt.w * s, Pt.h * s);
    const P = (ax, ay) => [px + ax * s, py + ay * s];
    if (o.between) o.between(P);
    mk(world, "pot-front", px, py, Pt.w * s, Pt.h * s);
    return { burner: [bx, by], knob: [kx, ky], pot: [px, py], P, s, open: P(Pt.opening[0], Pt.opening[1]) };
  }
  const STOVE_S = k => 0.66 * k;
  const stoveAt = (S, s) => [S.dishHome.x - 1200 * s / 2 - 90 * S.k, S.Y(1046) - 920 * s];

  // the small serving bowl, centred (x,y), scale s
  const servingBowl = (world, x, y, s, full) => at(world, "soup-bowl-" + (full ? "full" : "empty"), x, y, SOUP.bowl.w, SOUP.bowl.h, s);

  const SCENES = {
    // 0. choose the recipe: the soup card beside the five earlier ones
    "soup-home"(world, S, C) {
      const k = S.k, armL = mom(world, S, C, { eyes: "open", mouth: "talk" });
      const cx = (wide(S) ? S.dishHome.x : S.dishHome.x - 40 * k) - 300 * k;
      [["b:card-pizza", -5, 640], ["s:card-salad", 2, 630], ["c:card-cookies", -3, 640], ["m:card-smoothie", 3, 630], ["k:card-pancakes", -4, 634]]
        .forEach(([n, rot, y], i) => at(world, n, cx - 560 * k + i * 214 * k, y, 400, 520, 0.56 * k, { rot }));
      at(world, "card-soup", cx + 560 * k, 560, 400, 520, 0.92 * k, { rot: 4 });
      armL();
      if (wide(S)) pet(world, C, { eyes: "happy", mouth: "open" });
    },
    // 1. peel the carrot: the carrot on the board with its skin layer over it, the peeler dragged along it, strips flying off
    "soup-peel"(world, S, C) {
      homeBtn(world, S);
      const d = S.dishHome, k = S.k, [VW, VH] = SOUP.veg, vs = 1.18 * k / 1.2;
      const armL = mom(world, S, C, { eyes: "happy", mouth: "talk" });
      at(world, "p:cutting-board", d.x - 10 * k, S.Y(720), 1000, 600, 1.06 * k);
      const vx = d.x - 40 * k, vy = S.Y(650);
      at(world, "s:veg-carrot-whole", vx, vy, VW, VH, vs);
      const cutX = 400;                                              // peeled from the thin end: the skin is left right of file x 400
      at(world, "peel-skin-carrot", vx, vy, VW, VH, vs, { crop: [cutX / VW, 0, 1, 1] });
      armL();
      if (wide(S)) pet(world, C, { eyes: "surprised", mouth: "open" });
      // the peeler: its blade line sits on the carrot's upper surface at the peeling edge, the grip is where the finger is
      const col = vegColumn("carrot", cutX), bl = SOUP.peeler.blade, ps = 0.86 * k;
      const bladeX = vx + (cutX - VW / 2) * vs, bladeY = vy + (col.top + 8 - VH / 2) * vs;
      mk(world, "peeler", bladeX - (bl[0] + bl[1]) / 2 * ps, bladeY - bl[2] * ps, SOUP.peeler.w * ps, SOUP.peeler.h * ps);
      hand(world, "grab", bladeX + 16 * ps, bladeY - (bl[2] - SOUP.peeler.grip[1]) * ps, 0.58 * k);
      // strips that have already come off, on the board in front of the carrot
      [[-320, 258, -14], [-186, 292, 22], [-56, 258, -6]].forEach(([dx, dy, rot]) =>
        at(world, "peel-strip", vx + dx * k, vy + dy * k, 280, 240, 0.8 * k, { rot }));
      // the side column: the two vegetables that need peeling, the potato still in its skin
      at(world, "veg-potato-whole", S.sideX, S.Y(470), VW, VH, 0.5 * k / 1.2);
      at(world, "peel-skin-potato", S.sideX, S.Y(470), VW, VH, 0.5 * k / 1.2);
      at(world, "peeler", S.sideX, S.Y(810), SOUP.peeler.w, SOUP.peeler.h, 0.52 * k, { rot: -8 });
    },
    // 2. chop: the peeled potato and the zucchini on the board, one being cut, the slices piling up
    "soup-chop"(world, S, C) {
      homeBtn(world, S);
      const d = S.dishHome, k = S.k, [VW, VH] = SOUP.veg, vs = 1.06 * k / 1.2;
      const armL = mom(world, S, C, { eyes: "open", mouth: "talk" });
      at(world, "p:cutting-board", d.x - 10 * k, S.Y(720), 1000, 600, 1.08 * k);
      const veg = "zucchini", vx = d.x - 110 * k, vy = S.Y(660);
      const span = allSpan(veg), cutArt = span[0] + (span[1] - span[0]) * 0.6;
      at(world, "veg-" + veg + "-whole", vx, vy, VW, VH, vs, { crop: [0, 0, cutArt / VW, 1] });
      insideStrip(world, veg, vx, vy, vs, cutArt);
      const r = rng(3);
      [[210, 46], [286, 104], [356, 30], [324, 156]].forEach(([dx, dy]) =>
        at(world, "veg-" + veg + "-slice", vx + dx * k, vy + dy * k, 240, 240, 0.7 * k, { rot: r() * 50 - 25 }));
      armL();
      if (wide(S)) pet(world, C, { eyes: "happy", mouth: "closed" });
      const col = vegColumn(veg, cutArt + 40), tipX = vx + (cutArt + 40 - VW / 2) * vs, tipY = vy + (col.bottom - 6 - VH / 2) * vs;
      anchor(world, "p:knife", tipX, tipY, 240, 640, PREP.knifeTip[0], PREP.knifeTip[1], 0.78 * k);
      [["veg-potato", 480], ["s:veg-carrot", 700]].forEach(([nm, y], i) => {
        at(world, nm + "-whole", S.sideX - 46 * k, S.Y(y), VW, VH, 0.46 * k / 1.2);
        at(world, nm + "-slice", S.sideX + 140 * k, S.Y(y + 24), 240, 240, 0.5 * k);
      });
    },
    // 3. into the pot: the pot on the stove half full of chopped vegetables, a slice being carried in
    "soup-pot"(world, S, C) {
      homeBtn(world, S);
      const k = S.k, s = STOVE_S(k), [x0, y0] = stoveAt(S, s);
      const armL = mom(world, S, C, { eyes: "happy", mouth: "open" });
      const o = potStove(world, x0, y0, s, { on: false, fill: "pot-heap-2" });
      armL();
      if (wide(S)) pet(world, C, { eyes: "surprised", mouth: "open" });
      const gx = o.open[0] - 250 * k, gy = o.open[1] - 130 * k;      // the slice just above the rim, on its way in
      at(world, "veg-potato-slice", gx, gy, 240, 240, 0.86 * k, { rot: -14 });
      hand(world, "grab", gx - 110 * k, gy - 40 * k, 0.58 * k);
      at(world, "p:cutting-board", S.sideX, S.Y(760), 1000, 600, 0.46 * k);
      const r = rng(7);
      [["veg-potato", -110, -26], ["veg-zucchini", -10, 16], ["s:veg-carrot", 78, -14], ["veg-zucchini", 118, 44], ["s:veg-carrot", -70, 54]]
        .forEach(([v, dx, dy]) => at(world, v + "-slice", S.sideX + dx * k, S.Y(750) + dy * k, 240, 240, 0.38 * k, { rot: r() * 60 - 30 }));
    },
    // 4. pour the water: the jug tipped over the pot, drops falling, the pot full of vegetables
    "soup-water"(world, S, C) {
      homeBtn(world, S);
      const k = S.k, s = STOVE_S(k), [x0, y0] = stoveAt(S, s);
      const armL = mom(world, S, C, { eyes: "surprised", mouth: "open" });
      const o = potStove(world, x0, y0, s, { on: false, fill: "pot-heap-3" });
      armL();
      if (wide(S)) pet(world, C, { eyes: "surprised", mouth: "open" });
      const px = o.open[0] - 70 * k, py = o.open[1] - 205 * k;                 // the spout just above the pot's rim
      [[10, 52, .42], [2, 104, .38], [14, 152, .34], [4, 196, .3]].forEach(([dx, dy, sc]) =>
        at(world, "s:water-drop", px + dx * k, py + dy * k, 120, 160, sc * k));
      anchor(world, "water-jug", px, py, SOUP.jug.w, SOUP.jug.h, ...SOUP.jug.spout, 0.8 * k, { rot: -118 });
      at(world, "water-jug", S.sideX, S.Y(640), SOUP.jug.w, SOUP.jug.h, 0.78 * k);
    },
    // 5. stir the soup: the flame on, the soup cooking with the wooden spoon in it; the three stages on the left
    "soup-stir"(world, S, C) {
      homeBtn(world, S);
      const k = S.k, s = STOVE_S(k), [x0, y0] = stoveAt(S, s);
      const armL = mom(world, S, C, { eyes: "happy", mouth: "open" });
      const o = potStove(world, x0, y0, s, { on: true, fill: "soup-stage-2",
        between: P => { const [sx, sy] = P(660, 210); anchor(world, "p:spoon-wood", sx, sy, 240, 620, ...PREP.spoon, 0.95 * k, { rot: 28 }); } });
      armL();
      if (wide(S)) pet(world, C, { eyes: "happy", mouth: "open" });
      [1, 2, 3].forEach(i => {
        const ps = 0.28 * k, Pt = SOUP.pot, cx = S.sideX, cy = S.Y(400 + (i - 1) * 230);
        const lx = cx - Pt.w * ps / 2, ly = cy - Pt.h * ps / 2;
        mk(world, "pot-back", lx, ly, Pt.w * ps, Pt.h * ps);
        mk(world, "soup-stage-" + i, lx, ly, Pt.w * ps, Pt.h * ps);
        mk(world, "pot-front", lx, ly, Pt.w * ps, Pt.h * ps);
      });
    },
    // 6. serve: a ladle of soup on its way from the pot to Pippa's bowl, Mom's bowl already full
    "soup-serve"(world, S, C) {
      homeBtn(world, S);
      const k = S.k, s = 0.5 * k, d = S.dishHome;
      const armL = mom(world, S, C, { eyes: "happy", mouth: "smile", armL: -14 });
      const Pt = SOUP.pot, px = d.x - 520 * k - Pt.w * s / 2, py = S.Y(880) - Pt.h * s;
      mk(world, "pot-back", px, py, Pt.w * s, Pt.h * s);
      mk(world, "soup-stage-3", px, py, Pt.w * s, Pt.h * s);
      mk(world, "pot-front", px, py, Pt.w * s, Pt.h * s);
      servingBowl(world, d.x - 30 * k, S.Y(830), 0.86 * k, true);
      armL();
      const pw = 600 * 0.62 * k, ph = 700 * 0.62 * k, faceLeft = C.momLeft + (500 - 150) * C.s;
      const PP = { x: Math.min(d.x + 430 * k, faceLeft - pw * 0.92), y: S.Y(1000) - 684 * 0.62 * k, w: pw, h: ph };
      if (wide(S)) pet(world, C, { eyes: "happy", mouth: "open" }, PP);
      servingBowl(world, d.x + 330 * k, S.Y(950), 0.66 * k, false);
      const lx = d.x + 150 * k, ly = S.Y(580), ls = 0.95 * k;
      anchor(world, "soup-portion", lx, ly, SOUP.portion.w, SOUP.portion.h, ...SOUP.portion.at, ls);
      hand(world, "grab", lx + (164 - SOUP.portion.at[0]) * ls, ly + (36 - SOUP.portion.at[1]) * ls, 0.54 * k);   // on the ladle's grip
    },
    // 7. the photo: the full bowl of soup in photo-frame-soup, stars
    "soup-photo"(world, S, C) {
      const d = S.dishHome, k = S.k;
      const armL = mom(world, S, C, { eyes: "happy", mouth: "open", armL: 55 });
      const fs = 0.95 * k, fx = d.x, fy = S.Y(560);
      const hs = 540 * fs, hx = fx - hs / 2, hy = fy - hs / 2, sc = hs / 1080, cx0 = 660;
      mk(world, "b:bg-kitchen-landscape", hx - cx0 * sc, hy, 2400 * sc, 1080 * sc);
      world.lastChild.dataset.crop = [cx0 / 2400, 0, (cx0 + 1080) / 2400, 1].join(",");
      servingBowl(world, fx, fy + 40 * fs, hs / 560 * 0.95, true);
      mk(world, "photo-frame-soup", fx - 350 * fs, fy - 350 * fs, 700 * fs, 780 * fs);
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

  // img -> native canvas -> drawImage (the game's path), with crops (data-crop)
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
      const [c0, c1, c2, c3] = i.dataset.crop ? i.dataset.crop.split(",").map(Number) : [0, 0, 1, 1];
      g.drawImage(t, t.width * c0, t.height * c1, t.width * (c2 - c0), t.height * (c3 - c1), x - ox + w * c0, y - oy + h * c1, w * (c2 - c0), h * (c3 - c1));
      g.restore();
    }
    c.style.width = "100%"; c.style.display = "block";
    world.replaceWith(c);
    return c;
  }

  const ORDER = [["soup-home", "Choose the soup card"], ["soup-peel", "Peel the carrot"], ["soup-chop", "Chop the vegetables"],
    ["soup-pot", "Into the pot"], ["soup-water", "Pour the water"], ["soup-stir", "Stir the soup"], ["soup-serve", "Serve two bowls"],
    ["soup-photo", "The photo"]];
  Object.assign(SB.SCENES, SCENES);
  window.ScenesSoup = { SOUP, ORDER, SCENES, toCanvas, vegColumn, insideStrip, potStove };
})();
