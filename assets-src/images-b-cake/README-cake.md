# images-b-cake — birthday cake (style B, "cooking with Mom")

The seventh recipe. Same paper-cut-out style, same palette and the same registration rules as `images-b`,
`images-b-prep`, `images-b-salad`, `images-b-cookies`, `images-b-smoothie`, `images-b-pancakes` and `images-b-soup`.
Nothing outside this folder is written, ever: the generators wrap those kits **read only**.

| tool | writes |
|---|---|
| `tools/cakekit.py` | the shared kit: cake / frosting / candle colours, all the geometry below, `sponge_top`, `frost_disc`, `flame_shape`, `candle_body`, `smoke_wisp`, `mini_cake`, and a `save()` that can only write into `images-b-cake/` |
| `tools/gen_cake_a.py` | cake-batter-0..3, cake-pan, cake-pan-full, cake-baked, cake-plate |
| `tools/gen_cake_b.py` | frosting-tub-pink/-white/-choc, frosting-blob, choc-chip, candle, flame-candle, smoke-puff, card-cake, photo-frame-cake |
| `tools/check_cake.py` | nothing — the mechanical check (names, sizes, clean SVG, viewBox families, registration, anchors, md5 of everything outside this folder). Non-zero exit on failure. |
| `tools/sheet43.html` | the 4:3 contact sheet of all 18 items (`shots/sheet43.png`) |
| `tools/shot.sh`, `tools/shoot.sh` | one headless screenshot at a time (>= 2 GB free RAM, refuses if a headless Chrome is running, honours `~/cooking/.browser-busy`, kills anything left over) |
| `scene.html`, `scenes-cake.js` | the 20:9 scene previews (`scene.html?s=cake-lit&w=2400&canvas=1`) |

## The files

| file | viewBox | short side | KB | clean | size rule |
|---|---|---|---|---|---|
| card-cake | 0 0 400 520 | 400 | 21.2 | ok | >= 240 (touched) |
| cake-batter-0 | 0 0 640 520 | 520 | 15.5 | ok | >= 500 (work item) |
| cake-batter-1 | 0 0 640 520 | 520 | 15.4 | ok | >= 500 (work item) |
| cake-batter-2 | 0 0 640 520 | 520 | 15.2 | ok | >= 500 (work item) |
| cake-batter-3 | 0 0 640 520 | 520 | 10.0 | ok | >= 500 (work item) |
| cake-pan | 0 0 800 800 | 800 | 21.7 | ok | >= 500 (work item) |
| cake-pan-full | 0 0 800 800 | 800 | 33.2 | ok | >= 500 (work item) |
| cake-baked | 0 0 720 720 | 720 | 19.1 | ok | >= 500 (work item) |
| cake-plate | 0 0 820 830 | 820 | 19.5 | ok | >= 500 (work item) |
| frosting-tub-pink | 0 0 320 360 | 320 | 11.6 | ok | >= 240 (touched) |
| frosting-tub-white | 0 0 320 360 | 320 | 11.6 | ok | >= 240 (touched) |
| frosting-tub-choc | 0 0 320 360 | 320 | 11.6 | ok | >= 240 (touched) |
| frosting-blob | 0 0 200 200 | 200 | 5.1 | ok | 200x200 — the tint brush, = `images-b/sauce-blob`; never touched |
| choc-chip | 0 0 140 140 | 140 | 5.6 | ok | 140x140 — a tap-placed stamp, = `candy-dot` / `berry`; never touched |
| candle | 0 0 260 460 | 260 | 5.3 | ok | >= 240 (dragged) |
| flame-candle | 0 0 200 280 | 200 | 3.9 | ok | 200x280 — an effect the game draws on the candle; never touched |
| smoke-puff | 0 0 240 360 | 240 | 4.2 | ok | 240x360 — an effect the game draws on the candle; never touched |
| photo-frame-cake | 0 0 700 780 | 700 | 30.4 | ok | >= 500 (work item) |

### viewBox families (checked)

| family | shared viewBox |
|---|---|
| `cake-batter-0..3` = `images-b-prep/sauce-stage-0..3` = `prep-bowl-back` / `-front` | 640 × 520 |
| `cake-pan` = `cake-pan-full` | 800 × 800 |
| `cake-baked` = `images-b/dough-flat` | 720 × 720 |
| `cake-plate` = `images-b/pizza-board` (= `tray`) | 820 × 830 |
| `frosting-tub-pink` / `-white` / `-choc` | 320 × 360 |
| `frosting-blob` = `images-b/sauce-blob` | 200 × 200 |
| `choc-chip` = `images-b-cookies/candy-dot` = `images-b-pancakes/berry` | 140 × 140 |
| `photo-frame-cake` = `images-b-prep/photo-frame` = `photo-frame-soup` | 700 × 780 |
| `card-cake` = `card-soup` = `card-cookies` | 400 × 520 |

## Anchors and registration

### the batter, in the big prep bowl — 640 × 520
`cake-batter-0..3` are the `images-b-prep` **sauce-stage** frame exactly: stack `p:prep-bowl-back` → `cake-batter-N`
→ `p:prep-bowl-front`, all three at the same x/y/scale. The contents are clipped to the bowl's opening
**(320, 176) rx 262 ry 74** (rim ellipse (320, 170) rx 290 ry 88), so they sit in the bowl exactly like the prep sauce.
Stage 0 = dry flour and sugar with butter lumps and a whole yolk; 1 = first stir, yolk streaks and dry patches;
2 = nearly mixed, a few lumps and the stirring swirl; 3 = a smooth glossy pool with a ribbon fold.

### the cake pan, from straight above — 800 × 800, centre (400, 400)
One frame for both states. `cake-pan` is empty, `cake-pan-full` is the same pan with the batter in it.

| ring | radius |
|---|---|
| outer rim edge | 370 |
| top of the wall (inside of the rim lip) | 348 |
| **batter window** — the pan's floor, and where the batter goes | **334** |
| the batter's own surface in `cake-pan-full` | 316 |

The batter window radius **334 is the baked cake's radius**, so at the same scale the cake that comes out of the pan
fills the pan's floor exactly. In the oven the pan goes at **(350, 468) scale 0.36** in `images-b/oven-*` units
(the 700 × 800 oven frame, window x 150–550, y 320–610) — the same slot the cookies' baking tray uses.

### the baked cake and its plate — the PIZZA's frames
The game photographs and cuts the cake with the very same component that cuts the pizza, so these two files carry the
pizza's numbers, not new ones:

| file | viewBox | centre | radius | equals |
|---|---|---|---|---|
| `cake-baked` | 720 × 720 | **(360, 356)** | **334** | `images-b/dough-flat` (checked by rebuilding dough-flat's own crust outline) |
| `cake-plate` | 820 × 830 | **(410, 408)** | **389** | `images-b/pizza-board` / `tray` (checked by rebuilding the tray's own board edge) |

The frosting field on the cake's face is **r 290** around the cake's centre — the pizza's sauce / cheese area.

**Registering the cake on the plate.** Both are drawn centred on the SAME point (X, Y) at the SAME scale s:
`cake-plate`'s frame centre goes to `(X, Y + 7·s)` (its centre sits 7 units above its frame centre) and
`cake-baked`'s frame centre goes to `(X, Y + 4·s)` (its centre sits 4 units above its frame centre).
A cake-file offset `(dx, dy)` from the cake's centre is then the world point `(X + dx·s, Y + dy·s)`.

### frosting-tub-pink / -white / -choc — 320 × 360
| anchor | value |
|---|---|
| **base contact point** (what stands on the counter) | **(160, 336)** |
| the frosting surface, centre | **(160, 140)**, rx **132**, ry **54** |
| the plastic rim, just outside it | (160, 138) rx 140 ry 58 |

All three share one frame and one silhouette; only the frosting and the belly band change colour. The white tub gets a
warm beige band with pale teal dots, never a second colour, so the three read as pink / white / chocolate at a glance.

### frosting-blob — 200 × 200, centre (100, 100), r ≈ 68
**ONE** blob, drawn NEUTRAL (`#FAF5EC`) with only a whisper of shading and a torn edge in the same neutral, no drop
shadow — exactly the construction of `images-b/sauce-blob`. The game turns its silhouette into a flat brush and
**tints** it to the chosen tub colour; overlapping stamps merge into one field with no seams. The tint is a plain
multiply of the neutral onto the frosting colour, i.e. per channel:

| tub | multiply |
|---|---|
| pink `#F58FB0` | 0.980, 0.584, 0.744 |
| white `#FFFBF2` | 1, 1, 1 (no tint) |
| choc `#7A4A2C` | 0.488, 0.302, 0.190 |

`scenes-cake.js` spreads a full face with 18 stamps at 1.5 × the cake scale: one at the centre, six on r 120 and
eleven on r 208 (cake units).

### choc-chip — 140 × 140, centre (70, 70)
A tap-placed stamp, the same frame and the same rule as `images-b-cookies/candy-dot` and `images-b-pancakes/berry`:
the drawing stays inside r ≤ 58 of (70, 70). Its seated base disc is at (70, 110) rx 47 ry 17.

### candle — 260 × 460  ← the two anchors the game needs
| anchor | value | what it is |
|---|---|---|
| **BASE ANCHOR** | **(130, 414)** | the point that lands where she drops it — put it on a candle seat |
| **FLAME POINT** | **(130, 90)** | the wick tip — put `flame-candle`'s foot or `smoke-puff`'s foot here |

Built by `candle_body` at s = 1: wax half-width `CAND_RX` **64**, base/top ellipse ry `CAND_RY` **20**, base → the top
ellipse `CAND_H` **290**, and the wick reaches **34** above the top ellipse, so `FLAME POINT = BASE − (0, 290 + 34)`.
Seen from above in a slight 3/4 view: the near half of the base ellipse dips **towards** the viewer (the wax is pushed
into the frosting), the top ellipse is open and the four coral rings sag the same way.

### the five candle seats — in cake-file units from the CAKE's centre
```
(0, -150)   (143, -46)   (88, 121)   (-88, 121)   (-143, -46)
```
Five candles (she is five) on a 150-unit ring, 72° apart: inside the frosting field (r 290) and far enough apart that
none overlaps at the scene's candle scale (**0.62 × the cake scale**). Draw them back to front, i.e. sorted by dy.

### flame-candle — 200 × 280, FOOT (100, 236)
A small teardrop flame (orange body, yellow heart, white core, a blue foot), tip at (100, 44) — **not** the pancakes'
gas-hob flame ring. Put its foot on the candle's flame point; the soft glow behind it is part of the file.

### smoke-puff — 240 × 360, FOOT (120, 340)
A wisp rising from a just-blown-out candle. Put its foot on the same flame point the flame used.

### photo-frame-cake — 700 × 780
Byte-for-byte the `images-b-prep/photo-frame` construction with the pizza sticker swapped for a small birthday cake.
Transparent square window **x 80–620, y 80–620 (540 × 540)** — `check_cake.py` proves the window path is the prep
frame's exact path. Put the photo UNDER the frame.

### card-cake — 400 × 520
The `card-soup` / `card-cookies` construction: torn cream card, a pink gingham square, the picture (a frosted cake
with four lit candles on a plate), the mustard tab at the top, and the ingredient row — egg, butter, sugar with a scoop.

## Layer order per scene (`scenes-cake.js`)

Background (`b:bg-kitchen-landscape`) first, `b:btn-home` next, then:

| scene | layers, back to front |
|---|---|
| `cake-home` | Mom's right arm → body/head/hair/eyes/mouth → the six earlier cards → `card-cake` → Mom's left arm → Pippa |
| `cake-stir` | Mom (right arm + body) → `p:prep-bowl-back` → `cake-batter-2` → `p:spoon-wood` → `p:prep-bowl-front` → Mom's left arm → Pippa → the four stage bowls (back → batter → front, each) |
| `cake-pour` | Mom → `cake-pan-full` → the falling batter → `p:prep-bowl-back` → `cake-batter-3` → `p:prep-bowl-front` (all three rotated together) → the hand → Mom's left arm → Pippa → `cake-pan`, `p:oven-mitts` |
| `cake-oven` | Mom → `b:oven-inside` → `cake-pan-full` (at the oven slot) → `b:oven-closed` → the scraped bowl + mitts on the counter → Mom's left arm → Pippa → `b:mom-hand-point` |
| `cake-choose` | Mom → `cake-plate` → `cake-baked` → the three tubs → `b:mom-hand-point` → Mom's left arm → Pippa → the side-column tubs |
| `cake-spread` | Mom → `cake-plate` → `cake-baked` → 12 tinted `frosting-blob` stamps → `p:spoon-wood` → `b:mom-hand-spread` → Mom's left arm → Pippa → the side-column tubs |
| `cake-decorate` | Mom → `cake-plate` → `cake-baked` → 18 frosting stamps → 9 decorations → the chip in the air → the hand → Mom's left arm → Pippa → four `b:topping-bin`s with their item |
| `cake-candles` | Mom → `cake-plate` → `cake-baked` → frosting → decorations → the four seated candles (back to front) → the fifth candle in the air → the hand → Mom's left arm → Pippa → the spare candles |
| `cake-lit` | as `cake-candles`, but all five candles seated and each followed **immediately** by its `flame-candle` on the flame point → `b:star`s → a lit spare candle in the side column |
| `cake-blow` | as `cake-lit`, but `smoke-puff` on the flame point instead of the flame |
| `cake-slices` | Mom → `cake-plate` → `cake-baked` **clipped to the kept sector 74°–326°** → frosting and decorations and candles, all clipped to the same sector → Mom's left arm → the two cut slices (`cake-baked` + frosting + decorations, each clipped to its own 54° sector, rotated about the cake's centre) → Pippa → the leftovers |
| `cake-photo` | Mom → the kitchen background, cropped square → `cake-plate` → `cake-baked` → frosting → decorations → candles + flames → `photo-frame-cake` ON TOP → Mom's left arm → Pippa → `b:star`s |

The cut is the pizza cutter's cut: a sector whose apex is the cake's centre, applied to **every** layer of the stack
(`data-wedge` in the preview, which `toCanvas()` replays as a canvas clip). The batter stream in `cake-pour` and the
flying sprinkles are drawn by the game in code; the preview stands them in with existing files.

## Review round (one round, screenshots in `shots/`)

Ten real weaknesses were found on the first pass and fixed; `shots/r1-*.png` is before, `shots/r2-*.png` after.

1. **`cake-baked`** — the three long baking cracks crossed in the middle and read as pre-cut slice lines, and the dome
   was too flat to survive being shrunk. Rebuilt with a real shoulder-to-crown ramp, a darker narrower crust ring, a
   shaded crescent, and two short pale cracks kept off the centre.
2. **`cake-pan`** — the empty pan read as one flat grey disc, not a container. The wall is now a wide, clearly darker
   band between rim and floor with a lit far side, and the floor is lighter.
3. **`card-cake`** — the third ingredient (sugar) was invisible on its white blob, so the slot read as empty. The heap
   now has a firm shaded foot, darker crystals and a wooden scoop behind it.
4. **`choc-chip`** — it read as a flat brown triangle. The cone now has a rounded shoulder, a base ring that shows all
   round, and a proper gloss down the lit side.
5. **`candle`** — six thin coral rings read as a bandage at game size. Four broader bands, each with a lit top
   edge. The lit wax also left a pale flap sticking out at the foot; its bottom corners now ride the same base ellipse
   as the silhouette, so the wax ends in one clean rounded edge where it enters the frosting.
6. **the candle seats** — they clustered left of the cake's centre and two of them overlapped, so five candles did not
   read as five. Replaced by a 150-unit, 72°-apart ring; `check_cake.py` now proves no two overlap.
7. **the side columns** — items were floating on the wall above the counter in five scenes, and in `cake-oven` the
   side column was drawn straight on top of the oven. Everything now stands on the counter; `cake-oven` shows the
   scraped bowl and the mitts instead.
8. **`cake-stir` / `cake-pour`** — the bowl and the pan were so big they ran off the bottom of the 20:9 frame and
   collided with Pippa. Both scaled down and re-seated; the pour now shows three dollops on the line from lip to pan.
9. **`cake-slices`** — the wedge clip was applied only to `cake-baked`, so the frosting, decorations and candles filled
   the missing slice and the cut was invisible; the cut slice was bare sponge and landed on Pippa's face. The wedge now
   clips every layer (per-sprite, apex at the cake's centre) and the two slices lie on the counter.
10. **`cake-candles`** — the candle in her hand floated above the kitchen window, well off the counter. Lowered to just
    above its seat, with the hand above it.

## Checks

`python tools/check_cake.py` (add `--md` for the tables above) verifies: exactly the 18 names and no extra SVG;
≤ 60 KB each; well-formed XML with no `<text>`, fonts, rasters, `<script>` or external references; the touch sizes;
every viewBox family; the photo frame's window path; that `cake-baked` / `cake-plate` really carry the pizza's centre
and radius (by rebuilding `dough-flat`'s crust outline and the `tray`'s board edge and finding them in those files);
that every anchor in `scenes-cake.js` equals the generator's; and the md5 of every file outside `images-b-cake`
against `tools/baseline-md5.txt`. Python bytecode caches are reported but do not fail the run — they are not assets,
and every kit sets `sys.dont_write_bytecode` before importing the kit below it. Last run: **PASS**, 0 failing checks,
largest item `cake-pan-full` 33.2 KB.
