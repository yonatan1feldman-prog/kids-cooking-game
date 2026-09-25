// Cookie-recipe scenes for images-b-cookies, composed with the existing composers, read-only: ../images-b/scenes.js
// (world 1080 high, width W from the screen ratio, stage()/cast() layout, background, Mom and Pippa, oven geometry),
// ../images-b-prep/scenes-prep.js (img -> canvas path with crops; prep bowl, frame) and ../images-b-salad/scenes-salad.js.
// New assets load from this folder, "b:" from images-b, "p:" from images-b-prep, "s:" from images-b-salad. Every drawing is an <img>.
// Flour particles are drawn by the game in code; here a tiny inline data-URI stand-in shows where they go (not an asset).
(function () {
  const B = window.IMAGES_B_DIR || "../images-b/", PR = window.PREP_BASE || "../images-b-prep/", SA = window.SALAD_BASE || "../images-b-salad/";
  const HERE = window.COOKIES_BASE || "./";
  const SB = window.ScenesB, SP = window.ScenesPrep, ART = SB.ART;
  const src = n => n.startsWith("data:") ? n : (n.startsWith("b:") ? B + n.slice(2) : n.startsWith("p:") ? PR + n.slice(2) : n.startsWith("s:") ? SA + n.slice(2) : HERE + n) + ".svg";
  const BAKED = "url(#bakeTint)";

  // geometry of the new files (see README-cookies.md)
  const COOK = {
    bowl: { w: 640, h: 520, opening: [320, 176, 262, 74] },          // = prep-bowl
    butterOnMound: [262, 150], yolkOnMound: [372, 150], butterBase: [146, 196], butterInBowl: 0.42,
    flourMouth: [200, 96], sugarMouth: [170, 92], eggTap: [200, 368], eggDrop: [200, 414],
    sheet: [1000, 700], tray: [1000, 700],
    slots: [[220, 215], [500, 215], [780, 215], [220, 485], [500, 485], [780, 485]], slotSize: 250,
    cookie: 260, cookieInSlot: 1.0,                                   // cookie-* (260 box) drawn at the sheet's scale fills one slot
    cutter: 320, cutterPress: [160, 172],                             // cutter-* drawn at the sheet's scale, press point on the slot centre
    stamp: 140, stampOnCookie: { "icing-blob-pink": 0.85, "icing-blob-choc": 0.85, "sprinkles-cluster": 0.85, "candy-dot": 0.4 },
    trayInOven: { c: [350, 468], s: 0.36 },                           // oven units (700x800 frame, window 150..550 x 320..610)
    tubeTip: [130, 504],
  };
  const SHAPES = ["star", "heart", "circle", "flower"];

  function mk(world, name, x, y, w, h, o) {
    o = o || {};
    const img = document.createElement("img");
    img.src = src(name); img.alt = ""; img.draggable = false;
    Object.assign(img.style, { position: "absolute", left: x + "px", top: y + "px", width: w + "px", height: h + "px" });
    if (o.rot) { img.style.transform = `rotate(${o.rot}deg)`; img.style.transformOrigin = o.origin || "50% 50%"; }
    if (o.filter) img.style.filter = o.filter;
    if (o.alpha != null) img.style.opacity = o.alpha;
    if (o.crop != null) {
      const c = o.crop; img.dataset.crop = c.join(","); img.style.clipPath = `inset(${c[1] * 100}% ${(1 - c[2]) * 100}% ${(1 - c[3]) * 100}% ${c[0] * 100}%)`;
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

  // flour particles stand-in (the game draws these in code): a loose column of soft white dots
  function flourStream(world, x0, y0, x1, y1, w, seed) {
    const r = rng(seed); let dots = "";
    for (let i = 0; i < 70; i++) { const t = r(), x = 60 + (r() - 0.5) * (30 + t * 90), y = t * 400; dots += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(3 + r() * 5).toFixed(1)}" fill="#FFFDF7" opacity="${(0.65 + r() * 0.35).toFixed(2)}"/>`; }
    const uri = "data:image/svg+xml," + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 400" width="120" height="400">${dots}</svg>`);
    const img = document.createElement("img"); img.src = uri; img.alt = "";
    const h = Math.hypot(x1 - x0, y1 - y0), ang = Math.atan2(y1 - y0, x1 - x0) * 180 / Math.PI - 90;
    Object.assign(img.style, { position: "absolute", left: (x0 - w / 2) + "px", top: y0 + "px", width: w + "px", height: h + "px", transform: `rotate(${ang}deg)`, transformOrigin: "50% 0%" });
    world.appendChild(img);
  }

  // the prep bowl with a batter stage (+ optional things on the mound), centred (x,y), scale s
  function bowl(world, x, y, s, stage, between) {
    at(world, "p:prep-bowl-back", x, y, 640, 520, s);
    at(world, "batter-stage-" + stage, x, y, 640, 520, s);
    const P = (bx, by) => [x + (bx - 320) * s, y + (by - 260) * s];
    if (between) between(P);
    at(world, "p:prep-bowl-front", x, y, 640, 520, s);
    return P;
  }
  // a cookie at (x,y) with scale cs (cookie box 260), optionally baked and decorated
  function cookie(world, kind, x, y, cs, o) {
    o = o || {};
    at(world, "cookie-" + kind, x, y, 260, 260, cs, { filter: o.baked ? BAKED : null, rot: o.rot || 0 });
    (o.deco || []).forEach(([n, dx, dy]) => at(world, n, x + (dx || 0) * cs, y + (dy || 0) * cs, 140, 140, cs * COOK.stampOnCookie[n]));
  }
  // six cookies on a sheet / tray drawn at (x,y) with scale s (the slots are in the 1000x700 frame)
  function slotXY(x, y, s, i) { const [sx, sy] = COOK.slots[i]; return [x + (sx - 500) * s, y + (sy - 350) * s]; }
  const DECO = [[["icing-blob-pink"], ["candy-dot", -2, -4]], [["icing-blob-choc"], ["sprinkles-cluster", 0, 0]], [["sprinkles-cluster"]],
    [["icing-blob-pink"], ["sprinkles-cluster"]], [["candy-dot", -40, -20], ["candy-dot", 40, -20], ["candy-dot", 0, 36]], [["icing-blob-choc"], ["candy-dot"]]];
  const KINDS6 = ["star", "heart", "circle", "flower", "heart", "star"];
  function trayOfCookies(world, x, y, s, o) {
    o = o || {};
    at(world, "baking-tray", x, y, 1000, 700, s);
    KINDS6.forEach((kd, i) => {
      if (o.skip && o.skip.includes(i)) return;
      const [cx, cy] = slotXY(x, y, s, i);
      cookie(world, kd, cx, cy, s * COOK.cookieInSlot, { baked: o.baked, deco: o.deco ? DECO[i].map(d => [d[0], d[1], d[2]]) : null });
    });
  }

  const SCENES = {
    // 0. choose the recipe: the cookie card beside the pizza and salad cards
    "cookies-home"(world, S, C) {
      const k = S.k, armL = mom(world, S, C, { eyes: "open", mouth: "talk" });
      const cx = (wide(S) ? S.dishHome.x : S.dishHome.x - 40 * k) - 90 * k;
      at(world, "b:card-pizza", cx - 420 * k, 560, 400, 520, 0.95 * k, { rot: -5 });
      at(world, "s:card-salad", cx - 20 * k, 560, 400, 520, 0.95 * k, { rot: 2 });
      at(world, "card-cookies", cx + 390 * k, 540, 400, 520, 1.15 * k, { rot: 4 });
      armL();
      if (wide(S)) pet(world, C, { eyes: "happy", mouth: "open" });
    },
    // 1. pour the flour: the open bag tipped over the prep bowl, flour falling from its mouth onto the mound
    "cookies-pour"(world, S, C) {
      homeBtn(world, S);
      const d = S.dishHome, k = S.k, s = 1.2 * k, bx = d.x + 40 * k, by = S.Y(700);
      const armL = mom(world, S, C, { eyes: "happy", mouth: "talk" });
      const P = bowl(world, bx, by, s, 0);
      const [mx, my] = [bx - 150 * k, by - 390 * k];
      const [tx, ty] = P(300, 140);
      flourStream(world, mx, my, tx, ty, 150 * k, 4);
      anchor(world, "flour-bag", mx, my, 400, 520, 200, 96, 0.72 * k, { rot: -128 });
      armL();
      if (wide(S)) pet(world, C, { eyes: "surprised", mouth: "open" });
      at(world, "sugar-jar", S.sideX - 90 * k, S.Y(470), 340, 480, 0.55 * k);
      at(world, "butter-cube", S.sideX + 100 * k, S.Y(520), 300, 260, 0.62 * k);
      at(world, "egg-1", S.sideX - 90 * k, S.Y(790), 400, 440, 0.5 * k);
      at(world, "egg-1", S.sideX + 90 * k, S.Y(800), 400, 440, 0.5 * k, { rot: 14 });
    },
    // 2. the egg: butter already on the mound, the egg opens over the bowl; tap stages on the left
    "cookies-egg"(world, S, C) {
      homeBtn(world, S);
      const d = S.dishHome, k = S.k, s = 1.2 * k, bx = d.x + 40 * k, by = S.Y(700);
      const armL = mom(world, S, C, { eyes: "surprised", mouth: "open" });
      const P = bowl(world, bx, by, s, 0, P => {
        const [ux, uy] = P(...COOK.butterOnMound);
        anchor(world, "butter-cube", ux, uy, 300, 260, ...COOK.butterBase, s * COOK.butterInBowl);
      });
      const [yx, yy] = P(...COOK.yolkOnMound);
      anchor(world, "egg-3", yx, yy - 60 * s, 400, 440, ...COOK.eggDrop, 0.9 * k);
      armL();
      if (wide(S)) pet(world, C, { eyes: "surprised", mouth: "open" });
      ["egg-1", "egg-2", "egg-3"].forEach((n, i) => at(world, n, S.sideX, S.Y(360 + i * 220), 400, 440, 0.45 * k));
    },
    // 3. mixed: the smooth dough in the bowl, the spoon in it; the four stages on the left
    "cookies-mix"(world, S, C) {
      homeBtn(world, S);
      const d = S.dishHome, k = S.k, s = 1.2 * k, bx = d.x + 40 * k, by = S.Y(700);
      const armL = mom(world, S, C, { eyes: "happy", mouth: "open" });
      bowl(world, bx, by, s, 3, P => { const [sx, sy] = P(400, 170); anchor(world, "p:spoon-wood", sx, sy, 240, 620, 120, 500, 0.8 * k, { rot: 30 }); });
      armL();
      if (wide(S)) pet(world, C, { eyes: "happy", mouth: "closed" });
      [0, 1, 2, 3].forEach(i => { at(world, "p:prep-bowl-back", S.sideX, S.Y(330 + i * 185), 640, 520, 0.34 * k); at(world, "batter-stage-" + i, S.sideX, S.Y(330 + i * 185), 640, 520, 0.34 * k); at(world, "p:prep-bowl-front", S.sideX, S.Y(330 + i * 185), 640, 520, 0.34 * k); });
    },
    // 4. knead the cookie dough on the board
    "cookies-knead"(world, S, C) {
      homeBtn(world, S);
      const d = S.dishHome, k = S.k;
      const armL = mom(world, S, C, { eyes: "happy", mouth: "talk" });
      at(world, "b:pizza-board", d.x, d.y + 5 * k, 820, 830, k);
      at(world, "cookie-dough-knead-2", d.x, d.y + 10 * k, 360, 300, 1.6 * k);
      armL();
      if (wide(S)) pet(world, C, { eyes: "open", mouth: "closed" });
      ["cookie-dough-knead-1", "cookie-dough-knead-2", "cookie-dough-knead-3", "cookie-dough-ball"].forEach((n, i) => at(world, n, S.sideX, S.Y(330 + i * 170), 360, 300, 0.55 * k));
    },
    // 5. cut: the rolled sheet, two cookies stamped, the heart cutter pressing on slot 3; the four cutters on the left
    "cookies-cut"(world, S, C) {
      homeBtn(world, S);
      const d = S.dishHome, k = S.k, ss = 0.82 * k, sx = d.x, sy = S.Y(640);
      const armL = mom(world, S, C, { eyes: "open", mouth: "smile" });
      at(world, "cookie-dough-flat", sx, sy, 1000, 700, ss);
      [["star", 0], ["flower", 1]].forEach(([kd, i]) => { const [cx, cy] = slotXY(sx, sy, ss, i); cookie(world, kd, cx, cy, ss); });
      const [px, py] = slotXY(sx, sy, ss, 2);
      anchor(world, "cutter-heart", px, py, 320, 320, ...COOK.cutterPress, ss);
      armL();
      if (wide(S)) pet(world, C, { eyes: "surprised", mouth: "open" });
      const cs = 0.62 * k;
      at(world, "p:temp-glow", S.sideX + 95 * k, S.Y(430), 400, 280, 0.75 * k);
      SHAPES.forEach((kd, i) => at(world, "cutter-" + kd, S.sideX + (i % 2 ? 95 : -95) * k, S.Y(430 + Math.floor(i / 2) * 230), 320, 320, cs));
    },
    // 6. bake: the tray with six raw cookies behind the oven window
    "cookies-bake"(world, S, C) {
      homeBtn(world, S);
      const d = S.dishHome, o = S.oven, s = S.ovenScale, k = S.k;
      const ox = o.x - 350 * s, oy = o.y - 400 * s;
      const armL = mom(world, S, C, { eyes: "surprised", mouth: "open" });
      mk(world, "b:oven-inside", ox, oy, 700 * s, 800 * s);
      const [tcx, tcy] = COOK.trayInOven.c, ts = COOK.trayInOven.s * s;
      trayOfCookies(world, ox + tcx * s, oy + tcy * s, ts, { baked: true });
      mk(world, "b:oven-closed", ox, oy, 700 * s, 800 * s);
      armL();
      if (wide(S)) pet(world, C, { eyes: "surprised", mouth: "open" });
      hand(world, "point", ox + 560 * s, oy + 380 * s, 0.62 * k);
    },
    // 7. decorate: baked cookies on the tray, four boxes of decorations, a pink icing blob being placed
    "cookies-decorate"(world, S, C) {
      homeBtn(world, S);
      const d = S.dishHome, k = S.k, ts = 0.8 * k;
      const armL = mom(world, S, C, { eyes: "open", mouth: "smile" });
      const bs = S.binScale(4);
      [["icing-tube-pink", 260, 520, 0.36, -24], ["icing-tube-choc", 260, 520, 0.36, 24], ["sprinkles-cluster", 140, 140, 1.1, 0], ["candy-dot", 140, 140, 0.8, 0]].forEach(([n, w, h, sc, rot], i) => {
        const b = S.bin(i, 4); at(world, "b:topping-bin", b.x, b.y, 240, 240, bs); at(world, n, b.x, b.y - 8 * bs, w, h, sc * k * (bs / 0.9), { rot });
      });
      trayOfCookies(world, d.x, d.y + 40 * k, ts, { baked: true, deco: true, skip: [2] });
      const [cx, cy] = slotXY(d.x, d.y + 40 * k, ts, 2);
      cookie(world, "circle", cx, cy, ts, { baked: true, deco: [["sprinkles-cluster"]] });
      armL();
      at(world, "b:btn-done", S.done.x, S.done.y, 240, 240, k);
      if (wide(S)) pet(world, C, { eyes: "surprised", mouth: "open" });
      const gx = cx - 40 * k, gy = cy - 50 * k;                 // the nozzle just above the next cookie
      anchor(world, "icing-tube-pink", gx, gy, 260, 520, ...COOK.tubeTip, 0.5 * k, { rot: 30 });
    },
    // 8. share: a decorated cookie carried to Pippa, the tray with the rest
    "cookies-share"(world, S, C) {
      homeBtn(world, S);
      const d = S.dishHome, k = S.k, ts = 0.75 * k;
      const armL = mom(world, S, C, { eyes: "happy", mouth: "smile", armL: -18 });
      trayOfCookies(world, d.x - 150 * k, d.y + 60 * k, ts, { baked: true, deco: true, skip: [5] });
      armL();
      const ps = 0.62 * k, pw = 600 * ps, ph = 700 * ps;
      const faceLeft = C.momLeft + (500 - 150) * C.s;
      const px = Math.min(d.x + 393 * k - pw * 0.25, faceLeft - pw * 0.92);
      const P = { x: px, y: S.Y(1000) - 684 * ps, w: pw, h: ph };
      pet(world, C, { eyes: "surprised", mouth: "open" }, P);
      const mx = P.x + 300 * ps, my = P.y + 435 * ps, cx = mx - 190 * k, cy = my - 20 * k;
      hand(world, "grab", cx - 60 * k, cy + 70 * k, 0.6 * k);
      cookie(world, "star", cx, cy, 0.85 * k, { baked: true, deco: DECO[5] });
    },
    // 9. photo: the tray of decorated cookies in photo-frame-cookies, stars
    "cookies-photo"(world, S, C) {
      const d = S.dishHome, k = S.k;
      const armL = mom(world, S, C, { eyes: "happy", mouth: "open", armL: 55 });
      const fs = 0.95 * k, fx = d.x, fy = S.Y(560);
      const hs = 540 * fs, hx = fx - hs / 2, hy = fy - hs / 2, sc = hs / 1080, cx0 = 660;
      mk(world, "b:bg-kitchen-landscape", hx - cx0 * sc, hy, 2400 * sc, 1080 * sc, { crop: [cx0 / 2400, 0, (cx0 + 1080) / 2400, 1] });
      trayOfCookies(world, fx, fy + 20 * fs, hs / 1000 * 0.94, { baked: true, deco: true });
      mk(world, "photo-frame-cookies", fx - 350 * fs, fy - 350 * fs, 700 * fs, 780 * fs);
      armL();
      if (wide(S)) pet(world, C, { eyes: "happy", mouth: "open" });
      const r = rng(9), momL = C.momLeft + 280 * C.s;
      [[-470, -240, .7], [470, -260, .8], [-520, 120, .55], [520, 150, .6], [-380, 340, .45], [390, 380, .5]].forEach(([dx, dy, s]) => {
        const x = fx + dx * k, y = fy + dy * k, P = C.pet; if (x + 100 * s * k > momL) return;
        if (wide(S) && x + 100 * s * k > P.x && y + 100 * s * k > P.y) return;          // keep off Pippa too
        at(world, "b:star", x, fy + dy * k, 200, 200, s * k, { rot: r() * 50 - 25 });
      });
    },
  };
  const ORDER = [["cookies-home", "Choose the cookie card"], ["cookies-pour", "Pour the flour"], ["cookies-egg", "Butter and egg"],
    ["cookies-mix", "Mix the dough"], ["cookies-knead", "Knead"], ["cookies-cut", "Cut the cookies"], ["cookies-bake", "Bake"],
    ["cookies-decorate", "Decorate"], ["cookies-share", "Share with Pippa"], ["cookies-photo", "The photo"]];
  Object.assign(SB.SCENES, SCENES);
  window.ScenesCookies = { COOK, ORDER, SCENES, toCanvas: SP.toCanvasPrep };
})();
