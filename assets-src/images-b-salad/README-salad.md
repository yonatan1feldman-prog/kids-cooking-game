# Vegetable salad (style B, paper cut-out): the second recipe of "Cooking with Mom"

33 new SVGs for the salad recipe (29 in the first pass + 4 in the follow-up: photo-frame-salad, salad-heap-1..3), drawn with the **same kit** as `images-b/` and `images-b-prep/`: the generators import
`images-b/tools/pb.py` (palette, paper grain, torn-edge rim, shadows), `gen_items.py` (topping helpers, `doc()`), `gen_kitchen.py`
(card layout helpers) and the prep generators `gen_prep_a/b/e.py` (vegetable spec `veg_doc`, `slice_from_topping`, `tomato_side`,
strip measuring `sample_path`/`column`/`lens`/`strip_doc`) **read-only**, with bytecode caching turned off. They write only into `images-b-salad/`.

| generator | files |
|---|---|
| `tools/gen_salad_a.py` | piece-cucumber/carrot/lettuce, veg-cucumber-whole/slice/inside, veg-carrot-whole/slice/inside. `--profiles` prints the measured profiles as JSON |
| `tools/gen_salad_b.py` | lettuce-head, lettuce-tear-1..3, salad-bowl-back/front, salad-mixed, serving-bowl, salad-portion, salad-servers, colander |
| `tools/gen_salad_c.py` | lemon-half-1..3, juice-drop, oil-bottle, oil-drop, salt-shaker, water-drop, card-salad |
| `tools/gen_salad_d.py` | photo-frame-salad, salad-heap-1..3 (follow-up) |

Run any of them with `python tools/gen_salad_X.py [names...]`. `python tools/check_salad.py --md` prints the mechanical check.
`scene.html?s=<scene>&w=2400|1440&canvas=1` composes a scene with `images-b/scenes.js` + `images-b-prep/scenes-prep.js` + `scenes-salad.js`
and draws it the way the game does (img → native canvas → drawImage). `sheet43.html` draws all 13 scenes at 4:3 on one page.
`tools/shot.sh` takes one screenshot at a time: it needs ≥ 2 GB free RAM (it waits up to about 5 minutes), uses one hidden Edge and closes it afterwards.
`preview.html` shows every scene (switchable between 20:9 and 4:3) and every item, all through `<img>`.

Every file has no `<text>`, no fonts, no `<image>`, no scripts and no external references (only internal `#id` refs), and is ≤ 60 KB.
Touched items have a short side ≥ 240 and the main work items ≥ 500. The exceptions are sized by the brief and are never touched:
the in-bowl pieces (topping size 140), the cut-face strips (prep spec) and the three falling drops (120×160).

## Colours
The salad colours are new constants in `tools/saladkit.py`, mixed to sit in the pb palette: cucumber `CUKE_*` (darker and bluer than the
pepper green so the two don't merge), carrot `CAR_*`, lettuce `LET_*`, lemon `LEM_*`, oil `OIL_*`. Tomato, pepper, onion, wood, teal,
coral and cream are the pb colours. The pieces use the topping colours, so a `topping-tomato` next to a `piece-cucumber` looks like one set.

## Anchors and placement
| file | viewBox | anchor / rule |
|---|---|---|
| card-salad | 400×520 | same layout as `images-b/card-pizza`: card x 10–390, picture x 34–366 (salad bowl seen from above on green gingham), ingredient row y≈400–480 (cucumber slice, carrot, lemon half). No text |
| piece-cucumber / piece-carrot / piece-lettuce | 140×140 | the same frame as `topping-*`: centred (70,70), silhouette radius ≤ 58. In the bowl, use them with `topping-tomato`, `topping-pepper` and `topping-onion` at the same scale |
| lettuce-head, lettuce-tear-1..3 | 640×560 | one frame for all four states; base on y≈505–520, ground shadow ≤ y 540. head → one leaf off + 3 pieces → small heart + a pile → only a pile of torn pieces |
| salad-bowl-back / salad-mixed / salad-bowl-front | 900×620 | stack **back → contents → front** at the same position. Rim ellipse (450,210) rx 420 ry 118; **opening (450,218) rx 388 ry 100**. Loose pieces go inside the opening (the front layer covers everything below its lower arc). `salad-mixed` is the heap after mixing: it rises to y≈76 and is clipped to the opening at the bottom |
| salad-heap-1 / -2 / -3 | 900×620 | **the same frame as the bowl layers**: stack `salad-bowl-back` → `salad-heap-N` → `salad-bowl-front` at the same position. The bowl fills up before mixing: 1 = a low layer deep in the bowl (surface ellipse centre y 266), 2 = half full (y 240, a gentle mound to y≈150), 3 = full, mounded above the rim (to y≈92), the same volume as `salad-mixed`. The vegetables are **not mixed**: lettuce everywhere, with tomato, cucumber, carrot, pepper and onion each in its own wavy patch (left to right), so each kind can be recognised. The mix is deliberately generic: it fits any 3 of the 5 vegetables. After mixing, swap the heap for `salad-mixed` |
| photo-frame-salad | 700×780 | **identical size and window to `images-b-prep/photo-frame`**: the same viewBox 700×780, the same transparent square window **x 80–620, y 80–620 (540×540)** (the very same hole path, checked by `check_salad.py`), the same tape, hearts and star. Only the pizza-slice sticker is replaced by a lettuce leaf with a cherry-tomato half. Put the photo under the frame exactly as with the prep frame |
| salad-servers | 440×640 | **(220, 500)** = between the two heads (the point that follows the finger). Draw it between `salad-mixed` and `salad-bowl-front` so the heads sink into the salad |
| serving-bowl | 480×320 | opening (240,122) rx 196 ry 50: the same proportions as the big bowl opening. A full bowl = `salad-mixed` drawn at **0.505× of the serving-bowl scale** (196/388), with its opening point (450,218) on (240,122) (see `servingBowl()` in `scenes-salad.js`) |
| salad-portion | 360×280 | **(160, 146)** = centre of the heap on the spoon (follows the finger, dropped on a serving bowl) |
| lemon-half-1..3 | 520×520 | one frame; cut face centred (260, 226 → lower when squeezed). 1 = juicy (bright segments, glints, drops), 2 = half squeezed (smaller, uneven segments, creases), 3 = squeezed out (flat, torn pale segments, no shine). Tilt it ~20–30° over the bowl; drops fall from the lower rim |
| juice-drop / oil-drop / water-drop | 120×160 | one teardrop, point up, round bottom centred (60,106). Falling particles, shown at 0.3–0.45× |
| oil-bottle | 300×640 | **spout tip (150, 30)**. Upright, open, with a chrome pourer and no cap; the label shows an olive branch. To pour, rotate about the spout (about −120° to −130°) |
| salt-shaker | 260×400 | **holes (130, 70)**. Upright; rotate about the holes (about 150–170°) to shake over the bowl |
| colander | 820×560 | coral enamel colander with the vegetables in it (lettuce, cucumber, carrot, pepper, two tomatoes). In the prep sink (`sink-basin` at 1.1k) draw it at ≈0.86k, centred ≈40k right of the basin centre and 20k below it. The prep `water-stream` falls on the lettuce |

## Cutting vegetables: the same spec as images-b-prep
`veg-cucumber-whole` and `veg-carrot-whole` are drawn in the same 560×420 grid and published at **672×504** by the prep function
`veg_doc` (same ground shadow (280,396) rx 200, same ×1.2 scale), resting on the board at y≈455–466.
**Cut from right to left** by drawing only the part left of the cut line (source rectangle 0..cutX). Each cut drops one
`veg-*-slice` (240×240, centre (120,120)) on the board. The slice is the `piece-*` drawing at 240/140, exactly like the prep slices
are the topping drawings. The carrot leaves are right of the cut span, so the first cut removes them (as with the pepper stem).

Cut span (file x of the body): **cucumber 53–619** (the stem nub is not cut), **carrot 36–577** (the leaves are not cut).

### Cut-face strips (veg-*-inside)
**60 wide** and **as tall as the body at its tallest**: cucumber **168**, carrot **159**. The cucumber strip shows the dark skin,
the pale flesh and the seeds. The carrot strip shows the orange flesh and the lighter core. The heights and the profile are **measured from
the same outlines that draw `veg-*-whole`** (`gen_salad_a.py --profiles`), and `tools/check_salad.py` checks that the profile in
`scenes-salad.js` equals the measured one.

For a whole vegetable drawn with its 672×504 box at (left, top) and scale `s`, cut at file x = `cutX`:
1. Draw the whole vegetable cropped to source x 0..cutX.
2. Look up `top(cutX)` and `bottom(cutX)`, interpolating linearly in `SALAD.vegProfile[veg]` (`[x, top, bottom]` every 24 units,
   in `scenes-salad.js`; helper `ScenesSalad.vegColumn(veg, x)`, which also knows the four prep vegetables).
3. Draw the strip **centred on the cut line**: x = left + (cutX − 30)·s, width 60·s (never stretched sideways);
   y = top + top(cutX)·s, height = (bottom(cutX) − top(cutX))·s (stretched vertically only). Draw it after the whole vegetable and before the knife.
`ScenesSalad.insideStrip(world, veg, vx, vy, s, cutX)` does all three steps (the same rule as `ScenesPrep.insideStrip`; there is no mushroom-style special case).

Body top–bottom at 10% steps (file units; x: top–bottom):

| veg | cut span x | strip H | 10% … 90% |
|---|---|---|---|
| cucumber | 53–619 | 168 | 110: 319–435 · 166: 303–447 · 223: 295–452 · 279: 290–455 · 336: 289–455 · 393: 289–456 · 449: 292–454 · 506: 300–450 · 562: 316–438 |
| carrot | 36–577 | 159 | 90: 399–437 · 144: 382–441 · 198: 369–444 · 252: 357–447 · 306: 346–451 · 361: 337–454 · 415: 327–458 · 469: 318–461 · 523: 310–464 |

## Scenes (`scenes-salad.js`)
salad-home (both recipe cards) · salad-wash (colander in the sink under the tap) · salad-tear (lettuce on the board, the four states as a strip) ·
salad-choose (five whole vegetables, the chosen one glowing) · salad-cut-cucumber · salad-cut-carrot (with the cut-face strip) ·
salad-transfer (a carrot slice carried to the bowl, heap 2) · salad-lemon · salad-oil · salad-salt (all three on the full heap 3) · salad-mix (servers in the mixed salad) ·
salad-serve (Mom's bowl full, a portion going to Pippa's bowl) · salad-celebrate (the salad photo in `photo-frame-salad`, stars).
Final shots: `shots/r1-*`, `shots/r2-salad-serve.png` and the r0 shots of scenes that needed no fix (cut-cucumber, cut-carrot, oil, salt, celebrate), all at 20:9.
Collision sheet at 4:3: `shots/sheet-4x3.png` (all 13 scenes, 1440×1080 each).

## Critique log (one round, art director)
Items sheets (`shots/a1`, `b1`, `c1`) before the scenes: the carrot read as an orange slug (flat bottom, sloped top), so it is now nearly
symmetric with bushier leaves. The pale lettuce ribs made a hard white "V", so they are narrower and pale green. The fork looked like a mitten,
so it now has three separate rounded tines. The lemon segments were too pale against the pith, so they are more saturated and wider. Size fixes:
the colander (112 KB) and the card (92 KB) were brought under 60 KB by reusing pieces with `<use>` and integer path coordinates in the colander.

**Round 1** (all 13 scenes at 20:9, `shots/r0-*`). Does it belong to the set? Yes: same paper grain, cream torn rim, shadows, palette, Mom and
Pippa, and the kitchen. Is every vegetable clear? Mostly. Does the salad look tasty? After the fixes, yes. Eight weaknesses fixed:
1. Home: Mom's pointing finger and the demo pointing hand both touched the salad card (two hands). → The demo hand was removed.
2. Tear: the four-state strip ran into the home button, and the leaf being pulled floated up at the wall line. → The strip starts lower, and the leaf is pulled from the head.
3. Choose: the glow and the pointing hand were missing (a layout bug). → Fixed: the cucumber glows and the hand points at it.
4. Transfer, lemon, oil and salt: the loose pieces were a thin flat scatter on the dark bowl floor (the bowl looked empty). → 26 pieces sit deeper in the opening, lettuce first as a green bed.
5. Lemon: Mom's pressing hand covered the lemon's cut face, and the lemon sat against the wall. → No hand; the lemon is lower and tilted, and drops fall from its rim.
6. Serve: Pippa's bowl overlapped Mom's bowl, and the portion and hand sat on top of Mom's bowl. → New layout: big bowl left, Mom's full bowl, Pippa's empty bowl in front of her, and the portion on its way between them (`r2`).
7. Wash: the carrot was hidden behind the pepper in the colander (not clear which vegetables are washed). → The carrot is drawn in front, diagonally.
8. Mix: the heap read as a green mass with tiny coloured dots. → The tomato, cucumber, carrot, pepper and onion pieces were enlarged ×1.3 in `salad-mixed` and `salad-portion`.
The 4:3 sheet then showed a star on Mom's raised hand (celebrate) and Mom's fingertip on Pippa's bowl (serve, no Pippa at 4:3). Both were fixed:
stars now keep off Mom's side, and the bowl moved left.

## Follow-up (heaps + salad frame)
Two of the three remaining weaknesses were solved: the celebration now uses `photo-frame-salad` (no pizza sticker), and the bowl no longer shows
flat loose pieces. It fills with `salad-heap-1..3` (transfer on heap 2, lemon/oil/salt on heap 3). Checked one scene at a time (`shots/r3-*`, final `shots/r4-*`,
`shots/heap-3-closeup.png`, `shots/d-heaps.png`). Fixes found by eye: pepper and onion rings seen almost edge-on read as thin sticks, so their tilt is limited so they stay rings;
the dark leafy base ended in a thin green spike at both tips (the spline overshot at the side corners), so the base is now a plain polygon that stops short of the tips; the same fix went into `salad-mixed` and `salad-portion`, which had the same hidden spike; the patches were ruler-straight stripes (a carrot "column"), so their borders now wave.

## Remaining weaknesses
1. The salt step shows only the tipped shaker: no falling salt grains (no grain file is in the list; `juice-drop` does not read as salt).
2. The heaps always show all five vegetables. With 3 of 5 chosen, two patches show vegetables the child did not pick; they are small and mostly lettuce-framed, but they are there.
3. In the heaps the pepper patch is green on green lettuce, so it is the weakest of the five patches to recognise.
