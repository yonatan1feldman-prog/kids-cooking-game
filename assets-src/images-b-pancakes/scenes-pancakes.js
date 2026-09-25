// Pancake-recipe scenes for images-b-pancakes, composed with the existing composers, read-only: ../images-b/scenes.js
// (world 1080 high, width W from the screen ratio, stage()/cast() layout, background, Mom and Pippa), ../images-b-prep/scenes-prep.js
// (prep bowl, spoon, frame) and ../images-b-salad/scenes-salad.js.
// New assets load from this folder, "b:" from images-b, "p:" from images-b-prep, "s:" from images-b-salad, "c:" from images-b-cookies,
// "m:" from images-b-smoothie (milk-carton, milk-drop). Every drawing is an <img>. The batter stream and the flour/milk particles are drawn
// by the game in code; here tiny inline data-URI stand-ins show where they go (not assets).
// toCanvas() draws the scene the way the game does (img -> native canvas -> drawImage) and also supports a sector clip (data-clip)
// for the four wedges of the share step.
(function () {
  const B = window.IMAGES_B_DIR || "../images-b/", PR = window.PREP_BASE || "../images-b-prep/", SA = window.SALAD_BASE || "../images-b-salad/";
  const CO = window.COOKIES_BASE || "../images-b-cookies/", SM = window.SMOOTHIE_BASE || "../images-b-smoothie/", HERE = window.PANCAKES_BASE || "./";
  const SB = window.ScenesB, SP = window.ScenesPrep, ART = SB.ART, PREP = SP.PREP;
  const src = n => n.startsWith("data:") ? n : (n.startsWith("b:") ? B + n.slice(2) : n.startsWith("p:") ? PR + n.slice(2) : n.startsWith("s:") ? SA + n.slice(2)
    : n.startsWith("c:") ? CO + n.slice(2) : n.startsWith("m:") ? SM + n.slice(2) : HERE + n) + ".svg";

  // geometry of the new files (see README-pancakes.md); check_pancakes.py compares these numbers with the generators
  const PANC = {
    bowl: { w: 640, h: 520, opening: [320, 176, 262, 74] },                 // = prep-bowl / sauce-stage / batter-stage
    yolkAt: [372, 150], flourAt: [300, 150],                                 // on pancake-batter-0 (yolk = the cookie anchor)
    eggDrop: [200, 414], flourMouth: [200, 96], cartonSpout: [38, 118],
    stove: { w: 1200, h: 920, burner: [480, 450], knob: [1040, 752] },
    knob: { w: 280, h: 280, c: [140, 140] },
    pan: { w: 1240, h: 800, c: [400, 400], r: 372, inner: 336 },           // drawn at the stove's scale with c on the burner
    flame: { w: 1000, h: 1000, c: [500, 500], rIn: 336, rOut: 452 },        // at the pan's scale, c on the pan centre, UNDER the pan
    pud: { w: 680, h: 680, c: [340, 340], off: [60, 60], cake: 240, r: { 1: 118, 2: 184, 3: 240 } },   // at the pan's scale, top-left at pan (60,60)
    ladle: { w: 400, h: 640, pour: [40, 458] },
    plate: { w: 720, h: 720, c: [360, 360], top: 290, max: 350 },
    syrup: { w: 260, h: 520, tip: [130, 506] },
    stamp: 140,
  };

  function mk(world, name, x, y, w, h, o) {
    o = o || {};
    const img = document.createElement("img");
    img.src = src(name); img.alt = ""; img.draggable = false;
    Object.assign(img.style, { position: "absolute", left: x + "px", top: y + "px", width: w + "px", height: h + "px" });
    if (o.rot) { img.style.transform = `rotate(${o.rot}deg)`; img.style.transformOrigin = o.origin || "50% 50%"; }
    if (o.filter) img.style.filter = o.filter;
    if (o.alpha != null) img.style.opacity = o.alpha;
    if (o.clip) img.dataset.clip = o.clip.join(",");
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

  // stand-ins for what the game draws in code
  function band(world, x0, y0, x1, y1, w, svgBody) {
    const uri = "data:image/svg+xml," + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 400" width="40" height="400" preserveAspectRatio="none">${svgBody}</svg>`);
    const img = document.createElement("img"); img.src = uri; img.alt = "";
    const h = Math.hypot(x1 - x0, y1 - y0), ang = Math.atan2(y1 - y0, x1 - x0) * 180 / Math.PI - 90;
    Object.assign(img.style, { position: "absolute", left: (x0 - w / 2) + "px", top: y0 + "px", width: w + "px", height: h + "px", transform: `rotate(${ang}deg)`, transformOrigin: "50% 0%" });
    world.appendChild(img);
  }
  const batterStream = (world, x0, y0, x1, y1, w) => band(world, x0, y0, x1, y1, w,
    `<path d="M10,0 Q16,200 14,400 L26,400 Q24,200 30,0Z" fill="#FAE0A0"/><path d="M15,0 Q18,200 17,400 L20,400 Q21,200 19,0Z" fill="#FFFFFF" opacity="0.6"/>`);

  // ---- pieces ----
  // the prep bowl with a content layer, centred (x,y), scale s
  function bowl(world, x, y, s, content, between) {
    at(world, "p:prep-bowl-back", x, y, 640, 520, s);
    if (content) at(world, content, x, y, 640, 520, s);
    const P = (bx, by) => [x + (bx - 320) * s, y + (by - 260) * s];
    if (between) between(P);
    at(world, "p:prep-bowl-front", x, y, 640, 520, s);
    return P;
  }
  // the cooktop with the pan: stove top-left (x0,y0), scale s. o: {on, flame, cake: name, noPan, knob:false}
  function stove(world, x0, y0, s, o) {
    o = o || {};
    const St = PANC.stove, Pn = PANC.pan;
    mk(world, "stove-top", x0, y0, St.w * s, St.h * s);
    const cx = x0 + St.burner[0] * s, cy = y0 + St.burner[1] * s;
    const kx = x0 + St.knob[0] * s, ky = y0 + St.knob[1] * s;
    if (o.knob !== false) at(world, "stove-knob-" + (o.on ? "on" : "off"), kx, ky, 280, 280, s);
    if (o.on) at(world, "flame", cx, cy, 1000, 1000, s);
    if (!o.noPan) {
      mk(world, "pan", cx - Pn.c[0] * s, cy - Pn.c[1] * s, Pn.w * s, Pn.h * s);
      if (o.cake) at(world, o.cake, cx, cy, 680, 680, s);
    }
    return { c: [cx, cy], knob: [kx, ky], s };
  }
  const STOVE_S = k => 0.72 * k;
  const stoveAt = (S, s) => [S.dishHome.x - 1200 * s / 2 - 110 * S.k, S.Y(1046) - 920 * s];   // review fix: left, so the handle and knob clear Pippa and Mom's hand

  // the big plate with the stack, decorated; centre (x,y), scale s. o.clip = [a0,a1,dx,dy] cuts one wedge (moved by dx,dy)
  const DECO = [["syrup-blob", -120, -90, 1.25, 0], ["syrup-blob", 90, 40, 1.35, 70], ["syrup-blob", -30, 150, 1.1, 140], ["syrup-blob", 150, -140, 1.0, 200],
    ["butter-pat", 0, -10, 1.2, 8], ["berry", -170, 60, 1.0, 0], ["berry", 60, -190, 1.0, 40], ["berry", 170, 150, 0.95, -30], ["berry", -80, 210, 0.9, 20],
    ["banana-coin", -190, -40, 0.95, 0], ["banana-coin", 120, -60, 0.95, 0], ["banana-coin", -60, -200, 0.9, 0], ["banana-coin", 210, 20, 0.9, 0],
    ["banana-coin", 20, 200, 0.95, 0], ["berry", -200, -150, 0.85, 60]];
  function plate(world, x, y, s, o) {
    o = o || {};
    const n = o.deco == null ? DECO.length : o.deco;
    const draw = (dx, dy, clip) => {
      const cx = x + dx, cy = y + dy;
      const oc = clip ? { clip: [cx, cy, PANC.plate.top * s + 2, clip[0], clip[1]] } : {};
      if (!o.noPlate) at(world, "plate-big", cx, cy, 720, 720, s, oc);
      DECO.slice(0, n).forEach(([nm, px, py, sc, rot]) => at(world, nm, cx + px * s, cy + py * s, 140, 140, sc * s, Object.assign({ rot }, oc)));
    };
    if (o.wedges) o.wedges.forEach(w => draw(w[2], w[3], w)); else draw(0, 0, null);
  }

  const SCENES = {
    // 0. choose the recipe: the pancake card beside the other four
    "pancakes-home"(world, S, C) {
      const k = S.k, armL = mom(world, S, C, { eyes: "open", mouth: "talk" });
      const cx = (wide(S) ? S.dishHome.x : S.dishHome.x - 40 * k) - 300 * k;
      [["b:card-pizza", -5, 640], ["s:card-salad", 2, 630], ["c:card-cookies", -3, 640], ["m:card-smoothie", 3, 630]].forEach(([n, rot, y], i) =>
        at(world, n, cx - 520 * k + i * 250 * k, y, 400, 520, 0.62 * k, { rot }));
      at(world, "card-pancakes", cx + 560 * k, 560, 400, 520, 0.92 * k, { rot: 4 });
      armL();
      if (wide(S)) pet(world, C, { eyes: "happy", mouth: "open" });
    },
    // 1. milk: flour already in the bowl (the cookie flour mound), the carton pours; flour bag and eggs wait on the left
    "pancakes-milk"(world, S, C) {
      homeBtn(world, S);
      const d = S.dishHome, k = S.k, s = 1.2 * k, bx = d.x + 40 * k, by = S.Y(700);
      const armL = mom(world, S, C, { eyes: "happy", mouth: "talk" });
      const P = bowl(world, bx, by, s, "c:batter-stage-0");
      armL();
      if (wide(S)) pet(world, C, { eyes: "surprised", mouth: "open" });
      const [tx, ty] = P(300, 150), px = tx - 60 * k, py = ty - 330 * k;
      [[0, 60, .34], [4, 130, .3], [-3, 200, .3], [2, 262, .26]].forEach(([dx, dy, sc]) => at(world, "m:milk-drop", px + dx * k, py + dy * k, 120, 160, sc * k));
      anchor(world, "m:milk-carton", px, py, 320, 560, ...PANC.cartonSpout, 0.56 * k, { rot: -100 });
      at(world, "c:flour-bag", S.sideX - 70 * k, S.Y(480), 400, 520, 0.5 * k, { rot: -6 });
      at(world, "c:egg-1", S.sideX + 110 * k, S.Y(800), 400, 440, 0.5 * k, { rot: 10 });
    },
    // 2. the egg: flour + milk in (pancake-batter-0 without the yolk yet shows where it lands), egg-3 drops the yolk on its anchor
    "pancakes-egg"(world, S, C) {
      homeBtn(world, S);
      const d = S.dishHome, k = S.k, s = 1.2 * k, bx = d.x + 40 * k, by = S.Y(700);
      const armL = mom(world, S, C, { eyes: "surprised", mouth: "open" });
      const P = bowl(world, bx, by, s, "pancake-batter-0");
      const [yx, yy] = P(...PANC.yolkAt);
      anchor(world, "c:egg-3", yx, yy - 150 * s, 400, 440, ...PANC.eggDrop, 0.8 * k);
      armL();
      if (wide(S)) pet(world, C, { eyes: "surprised", mouth: "open" });
      ["c:egg-1", "c:egg-2", "c:egg-3"].forEach((n, i) => at(world, n, S.sideX, S.Y(360 + i * 220), 400, 440, 0.45 * k));
    },
    // 3. stir: the batter half mixed with the spoon in it; the four stages on the left
    "pancakes-stir"(world, S, C) {
      homeBtn(world, S);
      const d = S.dishHome, k = S.k, s = 1.2 * k, bx = d.x + 40 * k, by = S.Y(700);
      const armL = mom(world, S, C, { eyes: "happy", mouth: "open" });
      bowl(world, bx, by, s, "pancake-batter-2", P => { const [sx, sy] = P(400, 190); anchor(world, "p:spoon-wood", sx, sy, 240, 620, ...PREP.spoon, 0.8 * k, { rot: 30 }); });
      armL();
      if (wide(S)) pet(world, C, { eyes: "happy", mouth: "closed" });
      [0, 1, 2, 3].forEach(i => bowl(world, S.sideX, S.Y(330 + i * 185), 0.34 * k, "pancake-batter-" + i));
    },
    // 4. stove on: the knob turned, the lamp lit, the flame ring around the empty pan; off/on knobs on the left
    "pancakes-stove"(world, S, C) {
      homeBtn(world, S);
      const k = S.k, s = STOVE_S(k), [x0, y0] = stoveAt(S, s);
      const armL = mom(world, S, C, { eyes: "surprised", mouth: "open" });
      const o = stove(world, x0, y0, s, { on: true });
      armL();
      if (wide(S)) pet(world, C, { eyes: "surprised", mouth: "open" });
      hand(world, "point", o.knob[0] + 30 * k, o.knob[1] + 40 * k, 0.6 * k);
      at(world, "stove-knob-off", S.sideX, S.Y(480), 280, 280, 0.8 * k);
      at(world, "stove-knob-on", S.sideX, S.Y(780), 280, 280, 0.8 * k);
    },
    // 5. pour: the ladle held over the pan, batter streams onto a growing puddle (puddle 2); the bowl of batter on the left
    "pancakes-pour"(world, S, C) {
      homeBtn(world, S);
      const k = S.k, s = STOVE_S(k), [x0, y0] = stoveAt(S, s);
      const armL = mom(world, S, C, { eyes: "happy", mouth: "talk" });
      const o = stove(world, x0, y0, s, { on: true, cake: "batter-puddle-2" });
      armL();
      if (wide(S)) pet(world, C, { eyes: "surprised", mouth: "open" });
      const px = o.c[0] + 30 * k, py = o.c[1] - 250 * k;
      batterStream(world, px, py + 4 * k, o.c[0] + 10 * k, o.c[1], 28 * k);
      anchor(world, "ladle", px, py, 400, 640, ...PANC.ladle.pour, 0.7 * k, { rot: -40 });
      bowl(world, S.sideX, S.Y(600), 0.6 * k, "pancake-batter-3");             // review fix: no loose mini puddles (they read as eggs)
    },
    // 6. bubbles: the pancake sets and bubbles; ready to flip
    "pancakes-bubbles"(world, S, C) {
      homeBtn(world, S);
      const k = S.k, s = STOVE_S(k), [x0, y0] = stoveAt(S, s);
      const armL = mom(world, S, C, { eyes: "open", mouth: "smile" });
      const o = stove(world, x0, y0, s, { on: true, cake: "pancake-bubbles" });
      armL();
      if (wide(S)) pet(world, C, { eyes: "happy", mouth: "open" });
      at(world, "ladle", S.sideX, S.Y(640), 400, 640, 0.55 * k, { rot: -12 });
    },
    // 7. flip: swipe up, the pancake in the air above the pan (squashed = turning), golden side coming up
    "pancakes-flip"(world, S, C) {
      homeBtn(world, S);
      const k = S.k, s = STOVE_S(k), [x0, y0] = stoveAt(S, s);
      const armL = mom(world, S, C, { eyes: "surprised", mouth: "open" });
      const o = stove(world, x0, y0, s, { on: true });
      armL();
      if (wide(S)) pet(world, C, { eyes: "surprised", mouth: "open" });
      const fx = o.c[0] - 10 * k, fy = o.c[1] - 300 * k, w = 680 * s;
      mk(world, "pancake-golden", fx - w / 2, fy - w * 0.2, w, w * 0.4, { rot: -10 });  // squashed = turning over in the air
      hand(world, "grab", o.c[0] + 580 * s, o.c[1] + 10 * k, 0.6 * k);                  // review fix: Mom holds the handle (the arcs + finger in the pan were confusing)
    },
    // 8. stack: the plate with the stack on the counter, the next golden pancake landing on top; the stove on the left
    "pancakes-stack"(world, S, C) {
      homeBtn(world, S);
      const d = S.dishHome, k = S.k, ps = 0.9 * k;
      const armL = mom(world, S, C, { eyes: "happy", mouth: "open" });
      const ss = 0.34 * k;
      stove(world, S.sideX - 1200 * ss / 2 + 20 * k, S.Y(560) - 460 * ss, ss, { on: true, knob: true });
      at(world, "plate-big", d.x, d.y + 30 * k, 720, 720, ps);
      const cs = ps * PANC.plate.top / PANC.pud.cake;                                   // a pan pancake scaled to the plate's top disc
      at(world, "pancake-golden", d.x, d.y + 30 * k - 170 * k, 680, 680, cs, { rot: 8 });
      armL();
      if (wide(S)) pet(world, C, { eyes: "happy", mouth: "open" });
    },
    // 9. decorate: four boxes (syrup, berries, banana, butter), the plate being decorated, the syrup bottle over the pancake
    "pancakes-decorate"(world, S, C) {
      homeBtn(world, S);
      const d = S.dishHome, k = S.k, ps = 0.95 * k;
      const armL = mom(world, S, C, { eyes: "open", mouth: "smile" });
      const bs = S.binScale(4);
      [["syrup-bottle", 260, 520, 0.36, -20], ["berry", 140, 140, 1.1, 0], ["banana-coin", 140, 140, 1.1, 0], ["butter-pat", 140, 140, 1.1, 0]].forEach(([n, w, h, sc, rot], i) => {
        const b = S.bin(i, 4); at(world, "b:topping-bin", b.x, b.y, 240, 240, bs); at(world, n, b.x, b.y - 8 * bs, w, h, sc * k * (bs / 0.9), { rot });
      });
      plate(world, d.x, d.y + 10 * k, ps, { deco: 11 });
      armL();
      at(world, "b:btn-done", S.done.x, S.done.y, 240, 240, k);
      if (wide(S)) pet(world, C, { eyes: "surprised", mouth: "open" });
      const [, px, py] = DECO[12];
      anchor(world, "syrup-bottle", d.x + px * ps - 20 * k, d.y + 10 * k + py * ps - 40 * k, 260, 520, ...PANC.syrup.tip, 0.6 * k, { rot: 24 });
    },
    // 10. share: the decorated top pancake cut into four wedges on the board (like the pizza), one carried to Pippa
    "pancakes-share"(world, S, C) {
      homeBtn(world, S);
      const d = S.dishHome, k = S.k, ps = 0.95 * k;
      const armL = mom(world, S, C, { eyes: "happy", mouth: "smile", armL: -18 });
      at(world, "b:pizza-board", d.x, d.y + 5 * k, 820, 830, k);
      const g = 16 * k, Q = Math.PI / 2;
      const wedges = [[-Q * 2, -Q, -g, -g], [-Q, 0, g, -g], [0, Q, g, g]];
      plate(world, d.x, d.y, ps, { noPlate: false, wedges });
      armL();
      const pw = 600 * 0.62 * k, ph = 700 * 0.62 * k, faceLeft = C.momLeft + (500 - 150) * C.s;
      const P = { x: Math.min(d.x + 393 * k - pw * 0.25, faceLeft - pw * 0.92), y: S.Y(1000) - 684 * 0.62 * k, w: pw, h: ph };
      pet(world, C, { eyes: "surprised", mouth: "open" }, P);
      const mx = P.x + 300 * 0.62 * k, my = P.y + 435 * 0.62 * k;               // review fix: the carried wedge (bottom-left quarter) has its point at Pippa's mouth
      const wx = mx - 118 * k, wy = my - 80 * k, ws = ps * 0.66;                // review fix 2: smaller, apex just left of her mouth, clear of her face
      hand(world, "grab", wx - 250 * k, wy + 90 * k, 0.55 * k);
      plate(world, wx, wy, ws, { wedges: [[Q, Q * 2, 0, 0]] });
    },
    // 11. photo: the decorated stack in photo-frame-pancakes, stars
    "pancakes-photo"(world, S, C) {
      const d = S.dishHome, k = S.k;
      const armL = mom(world, S, C, { eyes: "happy", mouth: "open", armL: 55 });
      const fs = 0.95 * k, fx = d.x, fy = S.Y(560);
      const hs = 540 * fs, hx = fx - hs / 2, hy = fy - hs / 2, sc = hs / 1080, cx0 = 660;
      mk(world, "b:bg-kitchen-landscape", hx - cx0 * sc, hy, 2400 * sc, 1080 * sc, { clip: null });
      world.lastChild.dataset.crop = [cx0 / 2400, 0, (cx0 + 1080) / 2400, 1].join(",");
      plate(world, fx, fy + 10 * fs, hs / 720 * 0.9);
      mk(world, "photo-frame-pancakes", fx - 350 * fs, fy - 350 * fs, 700 * fs, 780 * fs);
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

  // img -> native canvas -> drawImage (the game's path), with crops (data-crop) and sector clips (data-clip = cx,cy,r,a0,a1 in world px)
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
      if (i.dataset.clip) { const [cx, cy, r, a0, a1] = i.dataset.clip.split(",").map(Number); g.beginPath(); g.moveTo(cx, cy); g.arc(cx, cy, r, a0, a1); g.closePath(); g.clip(); }
      if (i.style.filter) g.filter = i.style.filter;
      g.translate(ox, oy); if (m) g.rotate(+m[1] * Math.PI / 180);
      const [c0, c1, c2, c3] = i.dataset.crop ? i.dataset.crop.split(",").map(Number) : [0, 0, 1, 1];
      g.drawImage(t, t.width * c0, t.height * c1, t.width * (c2 - c0), t.height * (c3 - c1), x - ox + w * c0, y - oy + h * c1, w * (c2 - c0), h * (c3 - c1)); g.restore();
    }
    c.style.width = "100%"; c.style.display = "block";
    world.replaceWith(c);
    return c;
  }

  const ORDER = [["pancakes-home", "Choose the pancake card"], ["pancakes-milk", "Flour and milk"], ["pancakes-egg", "The egg"], ["pancakes-stir", "Stir"],
    ["pancakes-stove", "Turn on the stove"], ["pancakes-pour", "Pour the batter"], ["pancakes-bubbles", "Bubbles"], ["pancakes-flip", "Flip"],
    ["pancakes-stack", "The stack"], ["pancakes-decorate", "Decorate"], ["pancakes-share", "Share"], ["pancakes-photo", "The photo"]];
  Object.assign(SB.SCENES, SCENES);
  window.ScenesPancakes = { PANC, ORDER, SCENES, toCanvas };
})();
