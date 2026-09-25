# Vegetable soup (style B, paper cut-out): the sixth recipe of "Cooking with Mom"

24 new SVGs, drawn with the **same kit** as `images-b/`, `images-b-prep/`, `images-b-salad/`, `images-b-cookies/`, `images-b-smoothie/` and
`images-b-pancakes/`. `tools/soupkit.py` imports `images-b-pancakes/tools/pancakekit.py` **read-only** (which wraps the smoothie, cookie, salad and
prep kits and `images-b/tools/pb.py`: palette, paper grain, torn cream rim, shadows) with bytecode caching turned off, so importing writes nothing
into the other folders. It only adds the soup / pot / peel colours, the shared geometry, the chopped-vegetable bits, the steam helper and a `save()`
that writes into `images-b-soup/` only. Re-used directly: the prep vegetable spec (`gen_prep_b.veg_doc`, `slice_from_topping`), the prep strip
measuring (`gen_prep_e.sample_path` / `column` / `lens` / `strip_doc`), the prep `photo_frame()` (only the sticker swapped) and the salad carrot's
outline (`gen_salad_a.carrot_pts`, so `peel-skin-carrot` registers on it). **Not redrawn, re-used by the scenes:** `images-b-pancakes/stove-top`,
`stove-knob-off/-on`, `flame`; `images-b-prep/cutting-board`, `knife`, `spoon-wood`; `images-b-salad/veg-carrot-whole/-slice`, `water-drop`.

| generator | files |
|---|---|
| `tools/gen_soup_a.py` | veg-potato-whole/-slice/-inside, veg-zucchini-whole/-slice/-inside, peel-skin-carrot, peel-skin-potato, peeler, peel-strip. `--profiles` prints the measured profiles as JSON |
| `tools/gen_soup_b.py` | pot-back, pot-front, pot-heap-1..3, soup-stage-1..3 |
| `tools/gen_soup_c.py` | water-jug, soup-bowl-empty, soup-bowl-full, soup-portion, card-soup, photo-frame-soup |

Run `python tools/gen_soup_X.py [names...]`. `python tools/check_soup.py [--md]` is the mechanical check (the 24 names and no extra SVG, ≤ 60 KB,
clean SVG, touch sizes, viewBox families, the frame window, the two peel skins' pixel-exact registration, the pot's seat on the hob, the anchors and
the measured vegetable profiles in `scenes-soup.js` against the generators, and nothing changed outside this folder against `tools/baseline-md5.txt`,
the md5 manifest of `cooking-game-assets` taken **before** any work started). It exits non-zero on any failure.
`scene.html?s=<scene>&w=2400|1440[&canvas=1]` composes a scene over `file://` (no server) with the images-b, prep, salad and pancakes composers plus
`scenes-soup.js`, and with `canvas=1` draws it the way the game does (img → native canvas → drawImage, `data-crop` for the cut/peel crops).
`tools/sheet43.html` shows all 24 items at 4:3 (contents inside the pot layers, each peel skin over its vegetable, each strip on its cut line).
`tools/shot.sh` takes **one** screenshot: it waits while `~/cooking/.browser-busy` exists (30 s steps, max 15 min), needs ≥ 2 GB free RAM,
refuses if any headless browser is already running, runs one headless Chrome with a throw-away profile and kills it if it lingers.
`tools/shoot.sh <prefix> <scenes…>` runs it scene by scene, never two at once.

Every file: no `<text>`, no fonts, no `<image>`, no scripts, no external references (only internal `#id`), ≤ 60 KB (largest: pot-heap-3 48.2 KB).
Every file was checked both through an `<img>` tag and drawn into a `<canvas>` (`shots/b2-img-stir.png` is the pure `<img>` path, everything else the
canvas path; they are identical).

## Colours
Broth, pale to rich: `BR1 #F7E4B2` → `BR2 #EDB255` → `BR3 #DE8C33` (each with a light and a dark). Peeled potato flesh `POT_F #F0DB9C`
(light `#FCF0C6`, dark `#CBA967`); potato skin `PSK #B98A56` (dark `#96683A`, eyes `#7A5230`). Zucchini skin `ZUC #4F9236` (dark `#316B2B`,
light `#8CC05E`), flesh `#E7F2C6`. Carrot peel `CPK #C06C28` — deliberately duller and browner than the salad carrot `CAR #F2862C` under it, with a
dusty film, so peeling is a clear change. The pot is deep coral enamel `PT #E2653A` (light `#FF9061`, dark `#B8452A`) with a cream band and teal dots,
so it never reads as the teal prep bowl; inside it is a dark warm gradient with a lit floor. Herbs `#4E7B2E`. Carrot, onion, teal, cream, steel and
coral are the pb / salad palette.

## Files, viewBoxes and anchors (viewBox units)
| file | viewBox | KB | anchor / rule |
|---|---|---|---|
| card-soup | 400×520 | 26.8 | same frame and construction as `card-pancakes` / `card-cookies`: cream card x 10–390, picture x 34–366 on coral gingham (a bowl of soup with steam), mustard tape across the top, ingredient row y ≈ 400–480 (potato, carrot, zucchini) |
| veg-potato-whole | 672×504 | 11.7 | the **peeled** potato (a lumpy oval lying on the board), prep vegetable spec: drawn in the 560×420 grid, published ×1.2 by `gen_prep_b.veg_doc`, same ground shadow (280,396) rx 200, body bottom y ≈ 466. **Cut span x 91–599** |
| veg-potato-slice | 240×240 | 9.9 | the 140×140 piece drawing at 240/140 (`slice_from_topping`), centre (120,120) |
| veg-potato-inside | 60×224 | 7.5 | cut-face strip: 60 wide, as tall as the body at its tallest. Never stretched sideways |
| veg-zucchini-whole | 672×504 | 14.4 | same spec; fatter and darker than the salad cucumber, flecked skin, a cut stem nub at x ≈ 634 (right of the span, so the first cut removes it). **Cut span x 48–624** |
| veg-zucchini-slice | 240×240 | 7.9 | as above, centre (120,120) |
| veg-zucchini-inside | 60×198 | 7.7 | cut-face strip |
| peel-skin-carrot | 672×504 | 15.6 | **overlay on `images-b-salad/veg-carrot-whole`**: the same viewBox, the same `scale(1.2)` wrapper and the **same outline path** (`gen_salad_a.carrot_pts`, `smooth(pts, .14)`), with no ground shadow, so it registers pixel-exactly. Draw it at the same position and scale as the carrot, **after** it. To peel, crop it from the left: source x `0..cutX` removed (`data-crop [cutX/672, 0, 1, 1]`) |
| peel-skin-potato | 672×504 | 13.1 | the same, on **`veg-potato-whole`** (`gen_soup_a.potato_pts`, `smooth(pts)`). Brown skin with eyes and earth |
| peeler | 420×460 | 15.1 | Y-peeler. **Grip anchor (210, 92)** = the centre of the handle bar, the point under the finger. **Blade line: y = 358, x 126 → 294** (midpoint (210,358)). To peel, put the blade line on the vegetable's upper surface at the peeling edge (`top(cutX)` from the profile) and drag sideways; the grip stays 266 units above the blade |
| peel-strip | 280×240 | 11.8 | one curled strip that flies off sideways: a long tail with one open turn, tan-orange outer face `#CB7126` and the pale flesh side `#F3E6C0`. Works for carrot and potato; the game may tint it per vegetable. Not touched by the child (a particle) |
| pot-back / pot-front | 1000×760 | 6.3 / 5.7 | the main work item, two layers with the contents between them, **exactly like `images-b-prep/prep-bowl-back` / `-front`**: stack `pot-back` → contents → (spoon / ladle) → `pot-front` at the same position and scale. Rim ellipse **(500,250) rx 400 ry 108**; **contents window (opening) = (500,258) rx 368 ry 92**; base contact ellipse **(500,700) rx 330 ry 25**; two side ears at y ≈ 296–382 out to x 46 / 954 |
| (the pot on the `images-b-pancakes` cooktop) | – | – | Draw the pot at the **same scale as `stove-top`**, top-left at stove **(−20, −100)**, i.e. the base ellipse centre lands at stove (480, 600) = **150 units in front of the big burner (480,450)**. The cooktop is drawn from straight above and the pot from 3/4, so seating the foot in front of the burner centre makes it cover the grate instead of hovering behind the grate arms. Fit: base half-width **330 ≤ the grate's reach 430**, and the pot spans stove x −20…980 inside the 1200-wide cooktop. `flame` is drawn at the burner **before** `pot-back`: the pot hides its bases, the tips peek out around the foot |
| pot-heap-1 / -2 / -3 | 1000×760 | 17.1 / 36.5 / 48.2 | the chopped vegetables piling up **before the water**, same frame as the pot layers. Contents are clipped to the opening but free above the rim line (y < 258), so a mound may rise out of the pot. 1 = a thin layer deep in the pot (surface ellipse cy 344, mound top 312), 2 = half full (cy 306, top 216), 3 = heaped above the rim (cy 286, top 136). Pieces: potato cubes (44), zucchini rounds (36), carrot coins (34), onion bits (22) |
| soup-stage-1 / -2 / -3 | 1000×760 | 21.5 / 23.0 / 27.2 | the soup cooking, **the same viewBox and registration as the pot layers and `pot-heap-*`**, so the three families stack pixel-exactly. The change is carried by the broth film's opacity, its colour, the bubbles and the steam: 1 = watery and pale (film 0.42, the vegetables show clearly through it, 7 small bubbles, 1 steam wisp), 2 = golden (film 0.84, 13 medium bubbles, 3 wisps), 3 = rich and thick (opaque, 18 big bubbles, herb flecks, a folding ribbon, 4 wisps). Steam is drawn **outside** the clip, so it rises out of the pot |
| water-jug | 360×520 | 5.3 | glass jug of water, handle on the right. **Pour-spout point (52, 118)** = the tip of the lip (a drop hangs under it). To pour, rotate about the spout by about **−110° … −120°** and start the stream at that point |
| soup-bowl-empty / soup-bowl-full | 560×360 | 5.0 / 15.4 | one frame for both. Rim ellipse (280,150) rx 240 ry 66; **opening (280,152) rx 226 ry 60**; teal rim band; foot at (280,312). `-full` adds the soup (surface ellipse cy 166 rx 200 ry 50), 11 vegetable pieces, shines and three steam wisps, all clipped to the opening |
| soup-portion | 360×420 | 11.8 | a full ladle dragged from the pot to a bowl. **Anchor (150, 250)** = the centre of the soup in the cup, the point that follows the finger. Cup rim (150,236) rx 98 ry 34, steel handle rising steeply to the teal grip at (314, 30) |
| photo-frame-soup | 700×780 | 29.1 | **identical to `images-b-prep/photo-frame`**: same viewBox, the same transparent window **x 80–620, y 80–620** (the very same hole path, checked), same tape, hearts and star. Only the pizza-slice sticker is replaced by a small bowl of soup |

### Layer order per scene
- **Peel:** `p:cutting-board` → `s:veg-carrot-whole` (or `veg-potato-whole`) → `peel-skin-carrot` (or `-potato`), cropped to the unpeeled part → `peel-strip` particles → `peeler` (blade line on the vegetable's surface) → Mom's hand.
- **Chop:** `p:cutting-board` → `veg-*-whole` cropped to source x `0..cutX` → `veg-*-inside` on the cut line → the dropped `veg-*-slice`s → `p:knife`.
- **Pot on the stove:** `k:stove-top` → `k:stove-knob-off|on` (knob recess (1040,752)) → `k:flame` (only when on, centred on the burner) → **`pot-back` → `pot-heap-N` | `soup-stage-N` → `p:spoon-wood` / falling slices / water drops → `pot-front`**.
- **Serving:** the pot (three layers as above) → `soup-bowl-full` (Mom's) → `soup-bowl-empty` (Pippa's) → `soup-portion` on its way, with Mom's grab hand on its grip.
- **Photo:** cropped kitchen background → `soup-bowl-full` → `photo-frame-soup` → stars.

## Cutting the two new vegetables: the same spec as images-b-prep / images-b-salad
`veg-potato-whole` and `veg-zucchini-whole` are drawn in the same 560×420 grid and published at **672×504** by the prep function `veg_doc`
(same ground shadow (280,396) rx 200, same ×1.2 scale). **Cut from right to left** by drawing only the part left of the cut line (source rectangle
0..cutX). Each cut drops one `veg-*-slice` (240×240, centre (120,120)) on the board — the slice is the 140×140 piece drawing at 240/140, exactly like
the prep and salad slices.

For a whole vegetable drawn with its 672×504 box at (left, top) and scale `s`, cut at file x = `cutX`:
1. Draw the whole vegetable cropped to source x `0..cutX`.
2. Look up `top(cutX)` and `bottom(cutX)` by interpolating linearly in `SOUP.vegProfile[veg]` (`[x, top, bottom]` every 24 units, in
   `scenes-soup.js`; helper `ScenesSoup.vegColumn(veg, x)`, which also knows the salad's and the prep's vegetables).
3. Draw the strip **centred on the cut line**: x = left + (cutX − 30)·s, width 60·s (never stretched sideways);
   y = top + top(cutX)·s, height = (bottom(cutX) − top(cutX))·s (stretched vertically only). Draw it after the whole vegetable and before the knife.

`ScenesSoup.insideStrip(world, veg, vx, vy, s, cutX)` does all three steps.

### Measured profile table (the form `vegArt.ts` needs)
Measured from the **same outlines that draw `veg-*-whole`** (`python tools/gen_soup_a.py --profiles`); `tools/check_soup.py` checks that the
profile in `scenes-soup.js` equals the measured one and that each strip's viewBox is 60 × `stripH`.

Body top–bottom at 10 % steps (file units; `x: top–bottom`):

| veg | cut span x | strip H | 10 % … 90 % |
|---|---|---|---|
| potato | 91–599 | 224 | 142: 250–402 · 193: 234–424 · 243: 228–440 · 294: 229–450 · 345: 232–454 · 396: 237–450 · 447: 245–439 · 497: 259–424 · 548: 285–404 |
| zucchini | 48–624 | 198 | 106: 295–445 · 163: 280–457 · 221: 273–461 · 278: 270–463 · 336: 268–464 · 394: 267–465 · 451: 269–465 · 509: 274–463 · 566: 289–451 |

The full tables, exactly as `scenes-soup.js` carries them (`[x, top, bottom]` every 24 units):

```json
{"potato":[[95,298.6,356.1],[119,264.8,386.8],[143,249.5,402.7],[167,240.1,414.2],[191,234.0,423.8],[215,230.4,432.0],[239,228.3,439.2],[263,227.8,445.1],[287,228.3,449.6],[311,229.5,452.5],[335,231.3,453.9],[359,233.3,453.5],[383,235.7,451.7],[407,238.4,448.1],[431,242.0,443.1],[455,246.7,436.9],[479,253.1,429.8],[503,261.5,422.0],[527,272.6,413.3],[551,286.4,402.7],[575,304.5,388.7]],
 "zucchini":[[52,351.2,392.5],[76,307.6,434.6],[100,297.2,443.4],[124,289.0,450.2],[148,283.1,454.7],[172,278.7,457.7],[196,275.4,459.9],[220,273.0,461.4],[244,271.2,462.3],[268,269.9,462.9],[292,269.0,463.4],[316,268.3,463.7],[340,267.9,464.1],[364,267.6,464.6],[388,267.4,465.1],[412,267.6,465.4],[436,268.2,465.6],[460,269.3,465.2],[484,271.3,464.4],[508,274.3,462.7],[532,278.6,459.6],[556,284.9,454.8],[580,294.3,446.8],[604,311.1,431.7]]}
```

## Scenes (`scenes-soup.js`) and reference shots (`shots/`, 20:9, 2400×1080 world at 1200 px)
soup-home (the soup card beside the other five) · soup-peel (the carrot half peeled on the board, the peeler on the peeling edge, strips on the board,
the potato still in its skin on the left) · soup-chop (the zucchini being cut, the cut-face strip, the slices, the other vegetables on the left) ·
soup-pot (the pot on the stove half full of chopped vegetables, a potato slice going in) · soup-water (the jug tipped over the pot, drops falling,
the pot full) · soup-stir (the flame on, the soup cooking with the wooden spoon, the three stages on the left) · soup-serve (a ladle of soup on its way
from the pot to Pippa's bowl, Mom's bowl already full) · soup-photo (the full bowl in `photo-frame-soup`, stars).
**Final shots:** `r5-home`, `r5-peel`, `r5-chop`, `r5-pot`, `r5-water`, `r5-stir`, `r5-serve`, `r5-photo`; all 24 items at 4:3: **`b2-sheet.png`**.
`a1-sheet` / `a2-sheet` and `r0-*` are the critique round; `b2-img-stir.png` is the same scene through plain `<img>` (no canvas), to prove the filters
work both ways.

## Review (one round, art director)
Belongs to the set? Yes: the same paper grain, cream torn rim, shadows, palette, board, stove, Mom and Pippa. Weaknesses found in `a1` / `r0-*`,
fixed, re-shot as `a2` / `b2` / `r5-*`:
1. **`veg-potato-whole` read as a spilled puddle of cream**, not a solid potato: flat, edgeless, no weight. It now has a firm darker cut edge, a
   shaded underside, a broad top light and deeper dents.
2. **`peel-skin-carrot` was muddy chocolate brown** (it read as a rusty carving), and after the first correction it was too close to the carrot under
   it to read at all. It is now a dull, dusty orange `#C06C28` with a translucent earth film — clearly darker than the bright peeled carrot, still a
   carrot colour.
3. **The `peeler` read as a handbag** (fat arms, a thin grey slot). The arms are now thin steel wire, the handle a short fat grip with finger ridges,
   and the blade a chunky chrome cradle with a dark slot and a bright sharpened edge.
4. **`peel-strip` read as a pastry curl**, then as thin pasta: it was a fat two-turn spiral, and its orange face was only a few units wide. It is now a
   long, wide ribbon with one open turn, carrot-orange outside and the pale flesh side along the curl.
5. **The inside of the pot was one flat dark disc** and read as a pan of gravy. The interior gradient now runs from near-black at the far wall to a
   warm lit floor, with a soft wall shade and a bright near-wall edge.
6. **`pot-heap-1` and `-2` read as the same amount.** Stage 1 is now a thin layer deep in the pot (2 rows, mound top 312), stage 2 clearly half full
   (5 rows, top 216), stage 3 mounded above the rim (7 rows, top 136).
7. **`soup-portion` read as a small frying pan** (a wide shallow cup with a nearly horizontal handle). Its frame grew to 360×420 so the handle can rise
   steeply; the cup is deep and narrow. Anchor moved to (150,250).
8. **The pot was not on the hob at all** (a composer bug: the seat offset was added to the burner instead of to the stove origin), so it hung off the
   right edge and hid the knob. Fixed, and the foot is now seated 150 units in front of the burner so it covers the grate instead of hovering behind
   the grate arms.
9. Scene fixes: the peeler's blade now sits on the carrot's measured upper surface at the peeling edge (it floated over the leaves); the peel strips
   moved off the carrot onto the board; the knife moved to the cut line (it hovered in the gap); the jug pours from just above the rim with a drop
   chain that reaches the pot; the three soup-stage thumbnails fit between the home button and the counter edge; Pippa's empty bowl no longer covers
   her body; Mom's hand sits on the ladle's grip; the photo no longer draws an empty bowl behind the full one (it showed as a white halo).
10. The photo-frame sticker was too small to read as soup (0.42 → 0.50), and the card's ingredient potato was an unreadable pale blob, so on the card
    it is the unpeeled brown potato with eyes.

## Remaining weaknesses
1. `veg-potato-whole` is the **peeled** potato, so it is pale by definition; against the cream counter it is the weakest silhouette of the set. The
   brown `peel-skin-potato` over it reads far better, which is only right before peeling.
2. The zucchini and the salad cucumber are close in shape; the zucchini is darker, fatter and flecked, but at phone size a child could read the two as
   the same vegetable. The slices separate better than the whole ones.
3. `peel-strip` is one drawing used for both the carrot and the potato. Its tan-orange reads as carrot peel; on the potato the game should tint it
   (multiply) towards the potato skin brown.
