# Fruit smoothie (style B, paper cut-out): the fourth recipe of "Cooking with Mom"

31 new SVGs for the smoothie recipe, drawn with the **same kit** as `images-b/`, `images-b-prep/`, `images-b-salad/` and `images-b-cookies/`.
`tools/smoothiekit.py` imports `images-b-cookies/tools/cookiekit.py` **read-only** (which imports the salad kit, the prep kit and `images-b/tools/pb.py`:
palette, paper grain, torn cream rim, shadows) with bytecode caching turned off. It only adds the fruit / smoothie / milk colours, a heart shape,
`unfilter()` and a `save()` that writes into `images-b-smoothie/` only. Re-used directly: the prep vegetable spec (`veg_doc`, `slice_from_topping`,
`sample_path`/`column`/`lens`/`strip_doc`), the prep `photo_frame()` (only the sticker swapped), the salad colander geometry and `embed_veg`, the salad `drop()`.

| generator | files |
|---|---|
| `tools/gen_smoothie_a.py` | fruit-banana/strawberry/mango/kiwi -whole/-slice/-inside. `--profiles` prints the measured profiles as JSON |
| `tools/gen_smoothie_b.py` | blender-jar-back/-front, jar-heap-1..3, blend-stage-1..3, blender-lid, blender-base, blender-button-off/-on |
| `tools/gen_smoothie_c.py` | card-smoothie, colander-fruit, milk-carton, milk-drop, glass-empty/-full, photo-frame-smoothie |

Run `python tools/gen_smoothie_X.py [names...]`. `python tools/check_smoothie.py [--md]` is the mechanical check (31 names, no extra SVG, ≤ 60 KB,
clean SVG, touch sizes, viewBox families, frame window, the profiles/anchors in `scenes-smoothie.js` = the generators, and nothing changed outside
this folder against `tools/baseline-md5.txt`, the md5 manifest of `cooking-game-assets` taken before any work).
`scene.html?s=<scene>&w=2400|1440&canvas=1` composes a scene (via `file://`, no server) with the images-b, prep and salad composers + `scenes-smoothie.js`
and draws it the way the game does (img → native canvas → drawImage). `tools/sheet43.html` shows all 31 items at 4:3 (the jar contents between the jar layers).
`tools/shot.sh` takes one screenshot: waits while `~/cooking/.browser-busy` exists (30 s steps, max 15 min), needs ≥ 2 GB free RAM,
refuses if any headless browser runs, one headless Chrome with a throw-away profile, killed if it lingers. `tools/shoot.sh <prefix> <scenes…>` runs it scene by scene.

Every file: no `<text>`, no fonts, no `<image>`, no scripts, no external references (only internal `#id`), ≤ 60 KB (largest: colander-fruit 57.4 KB).
Touched items have a short side ≥ 240; the jar family (the main work item) is 600×800. The four `fruit-*-inside` strips (60 wide, prep spec) and `milk-drop`
(120×160, = salad drops) are never touched.

## Colours
Banana `BAN #FFD84A` (flesh `#FFF3C8`), strawberry crimson-pink `STR #E23A4E` (deliberately pinker than the pb tomato red `#EC5A3C`), mango skin gradient
red `#F0643A` → orange `#FFA531` → yellow → green `#9DC24A` (flesh `#FFB234`), kiwi olive-brown `KIW #9C7A42` with green flesh `#8CC63F`.
**Smoothie `SMO #F6A186`** (light `#FFC6B2`, shade `#DE7A66`, foam `#FFE3D8`): a neutral pink-orange, plausible for any 3 of the 4 fruits with milk.
Blender: kitchen coral body (`CORAL`), teal lid and band, red button. Glass: the prep glass colours (`GLASS #E4F1EE`, `GLASS_D`).

## Files, sizes and anchors (viewBox units)
| file | viewBox | anchor / rule |
|---|---|---|
| card-smoothie | 400×520 | same layout as `card-pizza` / `card-salad` / `card-cookies`: picture x 34–366 (two smoothie glasses with straws, four fruit slices, peach gingham), ingredient row y≈400–480 (banana, strawberry, milk carton) |
| colander-fruit | 820×560 | = salad `colander` (same body, rim, holes, front wall): mango, kiwi, banana and three strawberries, water drops. Same placement: in the prep sink (`sink-basin` at 1.1k) draw it at ≈0.86k, ≈40k right of the basin centre and 20k below; the prep `water-stream` falls on the fruit |
| fruit-*-whole | 672×504 | = prep `veg-*-whole` (560×420 grid ×1.2, same ground shadow, rests on the board at y≈475). **Cut span** (file x of the body): banana **48–583** (the stem is right of it), strawberry **115–535** (the green calyx is right of it), mango **67–600** (stem nub + leaf right of it), kiwi **79–593** |
| fruit-*-slice | 240×240 | centre (120,120); the 140 piece drawing at 240/140 (`slice_from_topping`), like the prep slices. Banana: cream disc with a yellow peel ring and the seed "star"; strawberry: heart-shaped lengthwise slice with a white core; mango: a scored cheek (cube grid) with a red→green skin rim; kiwi: green ring with seeds and a pale core |
| fruit-*-inside | 60×H | cut-face strip, **60 wide, as tall as the body**: banana **136**, strawberry **303**, mango **324**, kiwi **322** (see the cutting rule below) |
| blender-jar-back / jar-heap-1..3 / blend-stage-1..3 / blender-jar-front | **600×800** (one frame) | stack **back → contents → front** at the same position. **Mouth = rim ellipse (300, 118) rx 208 ry 30** (inner opening rx 196 ry 24). **Seat (300, 776)** = bottom centre of the blade collar. Pouring lip **(72, 100)** (left of the rim). Handle on the right (x 470–586, y 176–572). Contents are clipped to the inner walls (x 106–494 at y 126, x 172–428 at y 676). Heap tops: heap-1 y≈540, heap-2 y≈404, heap-3 y≈262 (all four fruits as flat slices, a generic mix). Blend stages: liquid level **y 232** (heap-3 + milk): 1 = chunky (whole pieces in pale pink milk, milk swirls), 2 = half (small bits, a whirl), 3 = smooth pink-orange with foam and bubbles |
| blender-base | 700×520 | motor base. **Jar seat: base (350, 108)** = jar seat (300, 776) when both are drawn at the **same scale**. **Button centre (350, 306)** in a round recess r≈120; two small lights at (170,300) and (530,300); feet/shadow at y≈470–510 |
| blender-button-off / -on | 280×280 | one frame, **centre (140, 140)**, button r≈104. Draw it at the **same scale as the base**, centred on the base's (350, 306). Off = raised red dome (18 deep) with a cream three-blade swirl; on = pressed down (8 units lower, 5 deep), lit orange-yellow face, swirl turned 40°, warm halo to r≈138 inside the same box |
| blender-lid | 480×240 | teal lid with a coral cap and a cream heart. **Seat (240, 150)** = centre of the plug's bottom: put it on the jar mouth (300, 118) at the jar's scale. Lift it along y to animate it dropping in |
| milk-carton | 320×560 | gable-top carton, open corner at the top left. **Spout (38, 118)**: milk leaves here. Pour: rotate about the spout ≈ −95° … −110° (the carton lies over the jar, spout lowest). Generic: cow spots, a glass of milk and a heart, no brand (re-usable for pancakes) |
| milk-drop | 120×160 | = salad `water-drop`/`juice-drop` frame (teardrop, point up, round bottom centred (60,106)), white with a blue-grey rim. Falling particle, shown at 0.26–0.34× |
| glass-empty / glass-full | 320×440 (one frame) | **rim ellipse (160, 72) rx 100 ry 18**, bottom centre (160, 410). **Fill area: liquid from y 98 (surface) to y 370 (inside bottom)**, x 74–246 at the top, 92–228 at the bottom. Pour animation: draw glass-empty, then glass-full cropped to source rows y ≥ Y with Y going 370 → 98 (see `glass()` in `scenes-smoothie.js`); swap to the uncropped glass-full at the end (the straw and foam appear then). Straw top (262, 14) |
| photo-frame-smoothie | 700×780 | **identical to `images-b-prep/photo-frame`**: same viewBox, the same transparent window **x 80–620, y 80–620** (the very same hole path, checked), tape, hearts and star. The pizza sticker is replaced by a small pink smoothie glass with a striped straw |

### Layer order (blender scenes)
`blender-base` → `blender-button-off|on` (on the base's button centre) → `blender-jar-back` → `jar-heap-N` or `blend-stage-N` → (a piece being dropped in) → `blender-jar-front` → `blender-lid`.
All jar layers at the jar position; base and button at the same scale with jar seat (300,776) = base seat (350,108). When pouring, lift the three jar layers together and rotate them
about the lip (72,100) ≈ −60° … −75° (`smoothie-pour`); the base with its button stays on the counter.

## Cutting the fruit: the same spec as images-b-prep / images-b-salad
Cut **from right to left** by drawing only the part left of the cut line (source rectangle 0..cutX). Each cut drops one `fruit-*-slice` on the board.
For a whole fruit drawn with its 672×504 box at (left, top) and scale `s`, cut at file x = `cutX`:
1. Draw the whole fruit cropped to source x 0..cutX.
2. Look up `top(cutX)` and `bottom(cutX)`, interpolating linearly in `SMOOTHIE.fruitProfile[fruit]` (`[x, top, bottom]` every 24 units, in `scenes-smoothie.js`;
   helper `ScenesSmoothie.fruitColumn(fruit, x)`). The profiles are **measured from the same outlines that draw the whole fruit** (`gen_smoothie_a.py --profiles`,
   the prep `sample_path`/`column`), and `check_smoothie.py` re-measures them and compares.
3. Draw `fruit-*-inside` **centred on the cut line**: x = left + (cutX − 30)·s, width 60·s (never stretched sideways); y = top + top(cutX)·s,
   height = (bottom(cutX) − top(cutX))·s (stretched vertically only). Draw it after the whole fruit and before the knife. No special cases.
`ScenesSmoothie.insideStrip(world, fruit, vx, vy, s, cutX)` does all three steps.

Body top–bottom at 10% steps (file units; x: top–bottom):

| fruit | cut span x | strip H | 10% … 90% |
|---|---|---|---|
| banana | 48–583 | 136 | 102: 297–382 · 155: 314–422 · 208: 328–449 · 262: 336–466 · 316: 339–473 · 369: 335–471 · 422: 325–458 · 476: 310–434 · 530: 293–397 |
| strawberry | 115–535 | 303 | 157: 250–348 · 199: 226–370 · 241: 208–388 · 283: 194–404 · 325: 181–418 · 367: 168–430 · 409: 154–440 · 451: 144–446 · 493: 149–440 |
| mango | 67–600 | 324 | 120: 244–415 · 174: 206–448 · 227: 179–465 · 280: 159–472 · 334: 148–472 · 387: 150–467 · 440: 163–457 · 493: 187–440 · 547: 223–410 |
| kiwi | 79–593 | 322 | 130: 210–410 · 182: 179–441 · 233: 162–460 · 285: 155–470 · 336: 154–475 · 387: 159–474 · 439: 169–466 · 490: 187–449 · 542: 219–419 |

## Scenes (`scenes-smoothie.js`) and reference shots (`shots/`, 20:9, 2400×1080 world at 1200 px)
smoothie-home · smoothie-wash · smoothie-choose (banana + strawberry chosen and glowing, the hand points at the kiwi) · smoothie-chop (strawberry) and
smoothie-chop-banana / -mango / -kiwi · smoothie-transfer (heap 2, a slice carried to the mouth) · smoothie-milk (heap 3, carton tipped, drops) ·
smoothie-lid (lid dropping onto stage 1) · smoothie-blend (lid on, button on + pressing hand, stage 2; the three stages on the left) ·
smoothie-pour (jar tipped over the second glass, half full; the first glass full; base on the counter) · smoothie-share (Mom's glass, one carried to Pippa) · smoothie-photo.
**Reference shots (final art):** `r1-home`, `r1-wash`, `r1-choose`, `r1-chop`, `r1-chop-banana`, `r1-chop-mango`, `r1-chop-kiwi`, `r1-transfer`, `r2-milk`,
`r1-lid`, `r1-blend`, `r2-pour`, `r1-share`, `r1-photo`; all 31 items at 4:3: `sheet-4x3.png`. `a1`/`b1`/`b2` are item sheets, `r0-*` the critique round.
(The pouring stream in `smoothie-pour` is an inline stand-in; the game draws it in code, like the cookie flour.)

## Review (one round, art director)
Belongs to the set? Yes: same paper grain, cream torn rim, shadows, palette, board, knife, sink, Mom and Pippa. Weaknesses found in `b1` + `r0-*` and fixed (re-shot as `b2`, `r1-*`, `r2-*`):
1. **Mango slice read as an egg yolk / apricot** (plain orange oval). Now a scored mango cheek: cube grid on the flesh and a thick red→orange→green skin rim.
2. **Kiwi read as a potato** (flat mid-brown). Now olive-brown with longer, lighter fuzz hairs.
3. **Jar heaps read as confetti / cereal**: the pieces were small (0.66) on dark brown gaps. Pieces enlarged to 0.9 with wider spacing, gaps now juicy pink-orange; the same in blend-stage-1.
4. **Home: the smoothie card sat under Mom's pointing finger and crowded Pippa.** The four cards are smaller and shifted left; the new card stays the biggest.
5. **The blender was small for the main work item** (0.6k). Now 0.66k: the jar contents read clearly at phone size.
6. **Milk: the carton was cut off by the top of the screen** once the blender grew. The spout is lower and the carton a little smaller.
7. **Share: Pippa's glass was held over her face.** It is now carried low, in front of her paws, and the grab hand is beside it.
8. **Pour: the base stood on the tea towel** at the left edge. Moved right onto clear counter.
9. **Transfer: the carried slice floated up at the shelf.** It is now beside the jar mouth (the jar top is high, so it stays near the window line).
10. **Frame sticker too small** to read as a glass beside the heart and star (0.2 → 0.26).
11. Wash: the strawberries sank below the colander rim; they now sit higher, in front of the banana. Photo: the glasses were made smaller so they sit well inside the window.

## Remaining weaknesses
1. The heaps and blend-stage-1/2 always show all four fruits (the generic mix), so one of the four pieces is a fruit the child did not choose (the same compromise as the salad heaps).
2. When the jar is tipped to pour, the liquid surface in `blend-stage-3` tilts with the jar (it is one drawing); the game should keep the tilt moderate (≤ 75°) and quick.
3. The carried slice in `smoothie-transfer` is still high on screen (the jar mouth is high at 0.66k); on 4:3 the game may want the blender a little lower or smaller.
