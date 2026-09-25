# Cookies (style B, paper cut-out): the third recipe of "Cooking with Mom"

32 new SVGs for the cookie recipe, drawn with the **same kit** as `images-b/`, `images-b-prep/` and `images-b-salad/`.
`tools/cookiekit.py` imports `images-b-salad/tools/saladkit.py` **read-only** (which imports the prep kit and `images-b/tools/pb.py`:
palette, paper grain, torn cream rim, shadows) with bytecode caching turned off. It only adds the cookie colours, the four shared
cookie/cutter outlines and a `save()` that writes into `images-b-cookies/` only. Several files re-use existing drawings directly:
the knead stages and the ball are the prep `dough_knead()` / images-b `dough_ball()` drawings re-tinted to cookie dough (`recolor()`),
the sugar jar is the prep olive-jar glass (`PB.JAR`), and the photo frame is the prep `photo_frame()` with only the sticker swapped.

| generator | files |
|---|---|
| `tools/gen_cookies_a.py` | flour-bag, sugar-jar, butter-cube, egg-1..3, batter-stage-0..3, cookie-dough-knead-1..3, cookie-dough-ball |
| `tools/gen_cookies_b.py` | card-cookies, cookie-dough-flat, baking-tray, cutter-*, cookie-*, icing-tube-*, icing-blob-*, sprinkles-cluster, candy-dot, photo-frame-cookies |

Run `python tools/gen_cookies_a.py [names...]`, `python tools/gen_cookies_b.py [names...]`. `python tools/check_cookies.py [--md]` is the mechanical check
(32 names, no extra SVG, ≤ 60 KB, clean SVG, touch sizes, viewBox families, frame window, slot geometry, and nothing changed outside this folder
against `tools/baseline-md5.txt`, the md5 manifest of `cooking-game-assets` taken before any work).
`scene.html?s=<scene>&w=2400|1440&canvas=1` composes a scene (via `file://`, no server) with the images-b, prep and salad composers + `scenes-cookies.js`
and draws it the way the game does (img → native canvas → drawImage). `tools/sheet43.html` shows all 32 items on one 4:3 page
(the batter stages inside the prep bowl). `tools/shot.sh` takes one screenshot: ≥ 2 GB free RAM, refuses if any headless browser runs, one headless
Chrome with a throw-away profile, killed if it lingers.

Every file: no `<text>`, no fonts, no `<image>`, no scripts, no external references (only internal `#id`), ≤ 60 KB (largest: card-cookies 55.5 KB).
Short side ≥ 240 for touched items, ≥ 500 for the central work items (bowl stages, sheet, tray). The four stamps are 140×140 on purpose: they are the
cookie equivalent of `topping-*` (placed by a tap, never dragged) and sit in `topping-bin` exactly like the pizza toppings.

## Colours
Cookie dough = the pb pizza-dough colours × `TINT (.97, .90, .76)`: raw `#F0C984` (light `#F4D59B`, shade `#E1B268`), a warm golden beige,
visibly darker/warmer than the pizza dough `#F7DFAE`. With the game's bake multiply `0xFFD49A` it becomes golden `#F0A750` with a browner edge.
Flour/sugar are warm whites, butter `#FFE07A`, yolk `#FFB22E`, pink icing `#F58FB0`, chocolate `#7A4A2C`, candy blue `#3E8FD8` (the only blue item,
so it pops). Cutter grips: star mustard, heart coral, circle teal, flower green (the same colour tells the child which cutter is picked).

## Dimensions and anchors (viewBox units)
| file | viewBox | anchor / rule |
|---|---|---|
| card-cookies | 400×520 | same layout as `card-pizza` / `card-salad`: picture x 34–366 (plate of four decorated cookies on pink gingham), ingredient row y≈400–480 (egg, butter, wheat) |
| flour-bag | 400×520 | open kraft bag, flour heaped in the mouth, wheat label. **Mouth (200, 96)**. Pour: rotate about the mouth ≈ −120° … −130° (like `oil-bottle`), flour particles leave from the mouth |
| sugar-jar | 340×480 | open glass jar full of sugar (same frame as prep `jar-olives`), sugar-cube label, pink bow. **Mouth (170, 92)**. Pour: rotate about the mouth ≈ −120° … −130° |
| butter-cube | 300×260 | butter cube, no wrapper. **Base (146, 196)** = bottom centre (rests on the flour). In the bowl draw it at **0.42 × the bowl scale** |
| egg-1 / egg-2 / egg-3 | 400×440 | one frame. Egg body centred (200, 236), **tap point (200, 368)** = bottom of the shell (tap it on the bowl rim). egg-2 = crack across. egg-3 = the two shell halves apart, white + yolk falling; **drop point (200, 414)** = bottom of the white |
| batter-stage-0..3 | 640×520 | **= `sauce-stage-*` / `prep-bowl-*`**: stack `prep-bowl-back` → `batter-stage-N` → `prep-bowl-front` at the same position. Opening (320,176) rx 262 ry 74. 0 = dry pale flour mound with sugar crystals (no butter, no egg); 1 = first stir: lumpy butter streak and yellow egg streaks; 2 = crumbly half-mixed golden crumbs; 3 = one smooth dome of cookie dough |
| (on batter-stage-0) | prep-bowl frame | **butter lands at (262, 150)** (put the butter-cube base there, scale 0.42 × bowl); **egg yolk lands at (372, 150)** (a yolk of radius ≈ 30 bowl units, or egg-3's drop point just above it) |
| cookie-dough-knead-1..3, cookie-dough-ball | 360×300 | **= `dough-ball`** (base y ≈ 266, x 56–304). 1 rough and crumbly, 2 smoother with one fold, 3 smooth; ball = smooth golden cookie dough with vanilla specks |
| cookie-dough-flat | 1000×700 | rolled sheet, rounded rectangle x 34–966, y 44–648 (+ thickness to 664). 6 slots, see below |
| baking-tray | 1000×700 | metal tray with baking paper (paper x 66–934, y 74–622), handle slots on the short sides. **The same 6 slots as the sheet** |
| cutter-star/heart/circle/flower | 320×320 | hollow metal band with a coloured grip rim, seen slightly from above. Grip rim centred (160, 148), cutting edge centred **(160, 172) = press point**. The cutting edge is exactly the cookie outline (same `shape_pts`) |
| cookie-star/heart/circle/flower | 260×260 | raw cookie, shape centred **(130, 130)**, about 220 wide/high, with a thickness edge and a soft shadow. Draw raw; bake with the multiply tint |
| icing-tube-pink / -choc | 260×520 | soft squeeze tube, nozzle down: **tip (130, 504)**. In a `topping-bin` draw it at ≈ 0.36 k, tilted ±24° |
| icing-blob-pink / -choc, sprinkles-cluster, candy-dot | 140×140 | stamps, centred (70, 70), radius ≤ 58 (like `topping-*`). On a cookie drawn at scale c: blobs **0.85 c**, sprinkles **0.85 c**, candy dot **0.4 c** (three dots fit one cookie) |
| photo-frame-cookies | 700×780 | **identical to `images-b-prep/photo-frame`**: same viewBox, the same transparent window **x 80–620, y 80–620** (the very same hole path, checked), tape, hearts and star. The pizza sticker is replaced by a round cookie with pink icing |

## The six slots (cookie-dough-flat AND baking-tray, 1000×700)
Slot centres, 3×2 grid: **(220, 215), (500, 215), (780, 215), (220, 485), (500, 485), (780, 485)**; suggested slot size **250×250** (pitch 280 × 270).
**Cookie scale: a `cookie-*` (260 box) drawn at the same scale as the sheet/tray (cookieInSlot = 1.0) fills one slot**: the shape is ≈ 220 across, leaving
≈ 30 units between neighbours. Moving the cookies from the sheet to the tray keeps the same slot index and the same relative scale.

## Cutters: where they press
Draw the cutter at the **same scale as the sheet**, anchored at its press point **(160, 172)** on the slot centre. The cutting edge then lies exactly on the
cookie outline of that slot (the cutter outline is the cookie's `shape_pts`), so the cookie that appears after the press matches the cutter.
The grip rim is 24 units higher (y 148), so the cutter can drop from about 60 units above onto the slot. The inside is hollow (transparent), so the dough
shows through while it presses.

## Oven fit
The tray goes into the existing oven exactly where the pizza sits (`ovenWindow` x 150–550, y 320–610 in the 700×800 oven frame):
draw `baking-tray` centred **(350, 468) at 0.36 × the oven scale** → 360×252 oven units (x 170–530, y 342–594), fully inside the window,
with the cookies at the same 0.36 (≈ 94 units each; the four shapes stay distinct at that size, `shots/r1-bake.png`).

## Scenes (`scenes-cookies.js`) and reference shots (`shots/`, 20:9, 2400×1080 world at 1200 px)
cookies-home · cookies-pour (flour bag tipped over the bowl, particles stand-in) · cookies-egg (butter on the mound, egg-3 over the bowl, the three egg states) ·
cookies-mix (smooth dough + spoon, the four stages) · cookies-knead · cookies-cut (sheet, two cookies stamped, heart cutter pressing slot 3, four cutters, the picked one glowing) ·
cookies-bake (tray in the oven) · cookies-decorate (four boxes, decorated tray, pink tube over a cookie) · cookies-share (a cookie carried to Pippa) · cookies-photo.
**Reference shots (final art):** `r2-pour`, `r2-egg`, `r2-mix`, `r2-knead`, `r1-cut`, `r1-bake`, `r1-decorate`, `r2-share`, `r2-photo`, `r2-home`; all items at 4:3: `sheet-4x3.png`.
`a1`/`b1` are the first item sheets, `r0-*` the round-0 critique shots, the other `r1-*` intermediate.

## Review (one round, art director)
Belongs to the set? Yes: same paper grain, cream torn rim, shadows, palette, bowl, oven, Mom and Pippa. **Do the cookies look tasty?** Raw: yes, soft golden dough
with a thick edge, vanilla specks and sugar glints. Baked: after fix 1 they are golden rather than orange; with icing, sprinkles and candy they look like real
decorated cookies. **Are the four shapes distinct even small?** Yes: in the oven (≈ 45 px on a phone) star, heart, circle and flower are clearly different; the flower has deep
notches so it never reads as a circle, and each cutter also has its own grip colour. Fixes:
1. Baked cookies were a flat orange (the raw colour × the bake multiply pushed red). The raw dough colour was re-tinted (`TINT` .97/.90/.76) → golden after baking.
2. egg-3 read as a test tube / spoon (a narrow white capsule) with wing-like shells. The shells are now closer and less tilted, the yolk is bigger and the white is a wavy blob around it with a thin strand.
3. batter-stage-3 read as a pile of sand, stage 2 as oats. Stage 3 is now a round glossy dough dome with one fold; stage 2 has fewer, bigger golden crumbs with lit tops.
4. The butter cube still had its wrapper, which looked wrong when dropped in the bowl; it is now a clean cube with a base anchor.
5. Stamped cookies on the sheet were hard to see (same dough colour): the cookie's thickness edge is darker and its shadow stronger.
6. The chocolate blob read as a hole: lighter chocolate with a warm highlight; blobs enlarged 0.75 → 0.85 of the cookie.
7. Photo: the cookie sticker was a star next to the frame's yellow star (two stars); it is now a round iced cookie. Scene fixes: stars kept off Pippa (photo),
   the carried cookie no longer hidden behind the grab hand (share), the icing tube's nozzle now over the next cookie (decorate), the home cards no longer under Mom's finger.

## Remaining weaknesses
1. Stamped cookies lying on the sheet are still close in colour to the sheet (they are the same dough); the game should lift them or show the hole to make the "cut" obvious.
2. egg-3's two shell halves still look a little like a bow above the falling yolk; the egg reads best in motion (egg-1 → egg-2 → egg-3 on taps).
3. The batter in the bowl carries the paper grain, so the flour and dough mounds look slightly sandy up close; at phone size it reads as dough.
