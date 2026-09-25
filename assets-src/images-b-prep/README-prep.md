# Prep steps (style B, paper cut-out): "Cooking with Mom" extension

57 new SVGs for the preparation steps (52 in round 1 + 5 in the follow-up: 4 cut-face strips and press-dent), drawn with the **same kit** as `images-b/`. The generators import `images-b/tools/pb.py`
(palette, paper grain, torn-edge rim, shadows), `gen_items.py` (topping drawings, helpers), `gen_mom.py` (Mom's palette, hand parts)
and `gen_kitchen.py` (oven colours, round button) **read-only**, with bytecode caching turned off, so nothing is written into `images-b/`.
They write only into `images-b-prep/`.

| generator | files |
|---|---|
| `tools/gen_prep_a.py` | sink-basin, faucet, water-stream, bubble, dough-knead-1..3, prep-bowl-back/front, sauce-stage-0..3, spoon-wood |
| `tools/gen_prep_b.py` | cheese-block, grater, cheese-pile-1..3, cheese-handful, cutting-board, knife, veg-*-whole/slice, can-*, jar-*, oven-mitts, mitt-single, photo-frame |
| `tools/gen_prep_c.py` | oven-panel, oven-needle, temp-glow, btn-temp-up/down, oven-start-off/on, logo-cooking-with-mom |
| `tools/gen_prep_d.py` | kid-hands, mom-hand-knife, mom-hand-press, mom-hand-mitt, mom-mouth-chew |
| `tools/gen_prep_e.py` | veg-tomato/mushroom/pepper/onion-inside, press-dent. `--profiles` prints the measured vegetable profiles as JSON |

Run any of them with `python tools/gen_prep_X.py [names...]`. `python tools/check_prep.py --md` prints the mechanical check.
`scene.html?s=<scene>&w=2400|1440&canvas=1` composes a scene with `images-b/scenes.js` plus `scenes-prep.js` and draws it the way the game does
(img → native canvas → drawImage). `tools/shot.sh` takes one screenshot at a time, with a ≥ 2 GB free-memory guard and one hidden Edge, closed afterwards.
`preview.html` shows every scene (switchable 20:9 / 4:3) and every item, all through `<img>`.

Every file: no `<text>`, no fonts, no `<image>`, no scripts, no external references (only internal `#id` refs), ≤ 60 KB (largest 36.5 KB),
short side ≥ 240 (except the untouched overlays veg-*-inside and press-dent, sized by the brief), and the main work items (whole vegetables, board, bowl, grater, oven panel) ≥ 500.

## Skin tone (kid-hands, like Mom)
`KID_PARAMS = {"skin_tone": "#F0C4A0", "sleeve_color": MUSTARD, "nail_color": PINK}` in `gen_prep_d.py`. The shade, light and blush colours are
derived from `skin_tone` with the same formula as `gen_mom.palette`.
`python tools/gen_prep_d.py --out <dir> --skin_tone "#8A5A3C" --sleeve_color "#8FB86A" --mom_skin "#9A6444"`
(`--out` must stay inside images-b-prep; `--mom_skin` re-tints Mom's three new hands and her chewing mouth; default = Mom v1 `#E6B38A`).
Tested dark variant: `shots/kid-hands-skin.png`.

## Oven panel (oven-panel + oven-needle share viewBox 0 0 1200 720)
- **Rotation centre of the needle: (600, 540)** in panel coordinates (= the centre of the arc scale). The needle file is drawn pointing straight up
  (= 150). Draw it with the same box as the panel and rotate it about (600, 540). In CSS terms, the origin is `50% 75%`.
- **Angles** (degrees, clockwise from straight up, which is canvas/Phaser positive rotation):

| value | needle angle | centre of the printed number (panel coords) |
|---|---|---|
| 50 | **−80°** | (214, 472) |
| 100 | **−40°** | (329, 218) |
| 150 | **0°** | (600, 163) |
| 200 | **+40°** | (875, 212) |
| 250 | **+80°** | (1020, 466) |

- Colour band: radius 212–266, from −90° (blue, cold) to +90° (red, hot), with a blue drop at the cold end and a red flame at the hot end.
  Numbers: vector strokes, 112 units tall (≈ 5.5 mm on a phone at the scene's 0.82 scale), each placed on its own radius so it never touches a tick.
- **temp-glow** (400×280): a golden halo centred at (200,140) whose middle (an ellipse of about 150×96) is clear. Centre it on the number's point
  above, at the panel's scale. Because the middle is clear, it works above the panel (as in the scenes) or behind a separate digit.
- btn-temp-up / btn-temp-down: 240×240, the same round button as images-b `btn-*` (centre (120,118)).
- oven-start-off / oven-start-on: 320×320, button centre (160,154), rim radius ≈ 128. "On" adds a warm halo out to r ≈ 158 inside the same box.

## Anchors
| file | viewBox | anchor |
|---|---|---|
| knife | 240×640 | **blade tip (118, 618)**: the point that follows the finger / touches the cut line. Vertical, blade down, handle (coral) at the top |
| mom-hand-knife | 400×400 | **(149, 364)** = tip of the same knife (at 0.5×) held in Mom's fist, arm from the right |
| mom-hand-press | 400×400 | **(140, 150)** = palm centre, flat hand pressing (kneading / mashing), fingers slightly spread, from the lower right |
| mom-hand-mitt | 400×400 | **(150, 150)** = palm of the oven mitt (Mom's blouse cuff at the lower right) |
| mom-mouth-chew | 800×800 | same frame as `mom-mouth-*`: swap it for the mouth layer. Puffed cheeks, closed wavy mouth, a crumb |
| kid-hands | 600×420 | palms at (192, 232) and (408, 232), between them (300, 214), fingertips ≈ y 110. Bottom edge = screen bottom (the sleeves run off the edge) |
| faucet | 320×400 | water outlet (262, 176); base bottom ≈ y 372 |
| water-stream | 240×420 | top of the stream (120, 0). It may be stretched vertically to reach the hands |
| spoon-wood | 240×620 | bowl centre (120, 500) |
| cheese-handful | 300×260 | clump centre (150, 116), which follows the finger over the pizza |
| veg-*-slice | 240×240 | centre (120, 120). It is exactly the images-b topping drawing (same colours and shapes) at 240/140 |
| photo-frame | 700×780 | transparent square window **x 80–620, y 80–620** (540×540). Put the photo under the frame |
| prep-bowl-back / -front / sauce-stage-0..3 | 640×520 | stack back → stage (or any contents) → front, all at the same position. Rim ellipse (320,170) rx 290 ry 88; opening (320,176) rx 262 ry 74 |
| dough-knead-1..3 | 360×300 | same frame as `dough-ball` (base y ≈ 266, x 56–304). Stage 1 is flat and shaggy, stage 3 round and smooth |

**Cutting (veg-*-whole, 672×504, resting on the board at y ≈ 475):** the body spans x = tomato 125–547, mushroom 91–581, pepper 60–588 (body; the stem is not cut),
onion 31–636. Cut from right to left by drawing only the part left of the cut line (source rectangle 0..cutX). Each cut drops one `veg-*-slice`
on the board. See the `cut` scene in `scenes-prep.js` (`crop`).

## Cut-face strips (veg-*-inside): lining them up with the cut line
Each strip is the pale inside of the vegetable seen at a grazing angle: a narrow vertical lens, **60 wide** (whole-veg file units) and
**as tall as the vegetable body at its tallest**: tomato 378, mushroom 406, pepper 378, onion 327. It shows seeds for the tomato, rings for the
onion, the hollow with seeds for the pepper, and cap, gills and stem for the mushroom. Colours are the same as the slice and topping.
The heights and the profile below are **measured from the same outlines** that draw `veg-*-whole` (`gen_prep_e.py`), so they fit exactly.

For a whole vegetable drawn with its 672×504 box at (left, top) and scale `s`, cut at file x = `cutX`:
1. Draw the whole vegetable cropped to source x 0..cutX (as before).
2. Look up the body's `top(cutX)` and `bottom(cutX)`. Interpolate linearly between the measured points in `scenes-prep.js`
   (`PREP.vegProfile[veg]` = `[x, top, bottom]` every 24 units; helper `ScenesPrep.vegColumn(veg, x)`).
3. Draw the strip **centred on the cut line**: x = left + (cutX − 30)·s, width 60·s (never stretched sideways);
   y = top + top(cutX)·s, height = (bottom(cutX) − top(cutX))·s (stretched vertically only). Draw it after the whole vegetable and before the knife.
4. **Mushroom only:** where the cut misses the stem (bottom(cutX) < 400, i.e. cutX < ≈236 or > ≈436), draw only the cap part of the strip:
   source rows 0..59.76% (`PREP.mushCapFrac` = 0.5976), stretched to top..bottom. Inside the stem range, draw the whole strip.
`ScenesPrep.insideStrip(world, veg, vx, vy, s, cutX)` does all four steps. Test sheet: `tools/strips.html` → `shots/strips-align.png`
(each vegetable cut at 20/40/60/80 %, all aligned).

Body top–bottom at 10% steps (file units; x: top–bottom):

| veg | cut span x | strip H | 10% … 90% |
|---|---|---|---|
| tomato | 125–547 | 378 | 167: 172–385 · 209: 126–429 · 252: 103–448 · 294: 94–458 · 336: 90–465 · 378: 93–465 · 420: 105–451 · 463: 124–429 · 505: 164–387 |
| mushroom | 91–581 | 406 | 140: 142–312 · 189: 103–310 · 238: 82–458 · 287: 71–473 · 336: 67–473 · 385: 71–473 · 434: 82–458 · 483: 103–310 · 532: 142–312 |
| pepper | 60–588 (body only, the stem is not cut) | 378 | 113: 132–450 · 166: 115–468 · 218: 107–476 · 271: 104–479 · 324: 103–480 · 377: 104–479 · 430: 107–475 · 482: 117–470 · 535: 143–453 |
| onion | 31–636 | 327 | 92: 240–360 · 152: 181–419 · 212: 154–446 · 273: 140–460 · 334: 137–463 · 394: 143–457 · 454: 160–440 · 515: 193–407 · 576: 255–323 |

## press-dent (260×140)
A soft elliptical hollow (radial shadow, centre (130, 66)) with a squeezed-up light rim on the near edge. Put it on the dough or tomatoes
**under** the pressing hand or the child's finger, centred on the contact point. In the scenes it is drawn at about 1.3–1.4× so it spreads
beyond the hand (knead: under `mom-hand-press`; mash: on the tomatoes inside the bowl opening, before `prep-bowl-front`).

## Scenes (`scenes-prep.js`)
title (logo, Mom, Pippa, play) · wash · knead · mash · grate · cut · can (can + jar) · panel (needle on 200, 200 glowing, start on) ·
bakeout (pizza out of the open oven, mitt on the rim) · momeats (chewing mouth) · celebrate (framed photo).
Final shots: `shots/final-*-2400.png` (20:9) and `shots/final-*-1440.png` (4:3). Critique shots: `r0-*`, `r1-*`, `r2-*`, `r3-*`.

## Critique log
**Items sheets** (before the scenes): the teal pin-stripe on the sink was an ellipse cutting across the square basin, so it now follows the rim.
Knead stage 1 was rescaled to the same height as the others, so it is now flatter and lumpier. The cheese piles read as rice or orzo, so they got
longer, paler shreds (reused `<use>` pieces, which also brought the piles from 85 KB to 12 KB). The pepper read as a lime, so it got a boxy
bell-pepper profile with three bumps at the blossom end and a thick stem. The olive jar was crowded and 67 KB, so it got fewer, bigger reused
olives (24 KB). On the oven panel the numbers overlapped each other and the ticks, so the digits were narrowed, spread to ±80°, placed per radius,
and the panel widened to 1200. The glow washed out the printed number, so it became a clear-centred halo.

**Round 1** (all 11 scenes at 20:9, `r0-*`), nine weaknesses fixed:
1. Wash: the water fell into the sink, not onto the hands. The hands are now bigger and under the stream, and the stream reaches the fingertips.
2. Knead / mash: Mom's pressing hand was too small next to the dough and bowl (0.72 → 0.95).
3. Mash: the tomato chunks were pink with pale pockets and read as strawberries. Now red flesh, a red-orange gel pocket and yellow seeds.
4. Cut: Mom's demo knife hand sat on the slices (two knives in one picture), so it was removed. The row of spare vegetables started on the wall, so it moved down.
5. Take-out: the mitts floated over the pizza and the pair of mitts hung on the wall. The board now comes out beside the open oven, the child's mitt pulls its rim, Mom's mitt holds the far rim, and the pair lies on the counter.
6. Mom eats: the slice sat at her chest. It is now beside her cheek, tip toward her mouth.
7. Celebrate: the "photo" background was a huge rectangle over the scene. Added a real rectangular crop to the canvas path, so the photo is one square of the kitchen, exactly inside the window.
8. Title: at 4:3 the logo and play button now sit centred in the free space left of Mom.
9. Cut: the knife tip sat below the pepper. It is now on the cut line, in the lower half of the pepper: a true mid-cut.

**Follow-up** (`shots/e-*`, `strips-align.png`): the knife covered the new cut face, so it now cuts the next slice, 110 units left of it.
The dent was hidden under the hand (knead) and under the bowl's front wall (mash), so it was enlarged and moved into the bowl opening.
The pepper's cut span stopped including its stem. A leaf poked out of the jar label, so the label picture is clipped to the oval.

**Round 2** (all 11 at 4:3, `r2-*`, and the fixed scenes again at 20:9): at 4:3 the panel's "up" button touched Mom's pointing hand, so the panel
and its buttons shift left on narrow screens. The take-out board overlapped Mom's arm, so it was re-laid out (see 5). Both re-checked at both ratios (`r3-*`).
Size pass: the whole vegetables (560×420 → 672×504) and the grater (440×640 → 506×736) were enlarged so their short side is ≥ 500, and the water stream got a 240-wide frame.

Art-director answers: the new items share the paper grain, the cream torn rim, the shadow and the palette of images-b (they come from the same code).
Each object reads at phone size. The panel numbers are large, well spaced and dark on cream. The knife is friendly: coral handle with cream
rivets, a rounded blunt tip, a pink heart on the blade and no point.

## Remaining weaknesses
1. ~~No cut face at the cut line.~~ **Solved in the follow-up:** `veg-*-inside` strips (see above).
2. ~~`mom-hand-press` reads like a wave.~~ **Improved:** `press-dent` under the hand. On dough it reads clearly; on red tomatoes it is gentler (a dark hollow on red has less contrast).
3. The 3/4 view of the cheese block, can and jar is flatter than the top-down food items. The jar label now shows an olive branch (brown twig, seven long silver-green leaves, one purple and one green olive), clipped to the label, with the file size unchanged (340×480), so "olives, not grapes" is clear.
