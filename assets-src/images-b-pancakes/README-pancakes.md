# Pancakes (style B, paper cut-out): the fifth recipe of "Cooking with Mom"

23 new SVGs for the pancake recipe (the brief says "24", but its list names 23 files; exactly those 23 were made, no extra name was invented),
drawn with the **same kit** as `images-b/`, `images-b-prep/`, `images-b-salad/`, `images-b-cookies/` and `images-b-smoothie/`.
`tools/pancakekit.py` imports `images-b-smoothie/tools/smoothiekit.py` **read-only** (which imports the cookie, salad and prep kits and
`images-b/tools/pb.py`: palette, paper grain, torn cream rim, shadows) with bytecode caching turned off. It only adds the batter / pancake / syrup /
stove colours, the shared pancake-top drawing (`pancake_top`: wet puddle, bubbling, golden), a mini side-view stack (card + frame sticker),
the shared geometry and a `save()` that writes into `images-b-pancakes/` only. Re-used directly: the cookie flour-mound shape and yolk anchor
(`gen_cookies_a`), the cookie `wheat()`, the prep `photo_frame()` (only the sticker swapped). **Not redrawn, re-used by the scenes:**
`images-b-smoothie/milk-carton` (+ `milk-drop`), `images-b-cookies/flour-bag`, `egg-1..3`, `images-b-prep/prep-bowl-back/-front`, `spoon-wood`,
`images-b/topping-bin`, `pizza-board`, `btn-*`, `star`.

| generator | files |
|---|---|
| `tools/gen_pancakes_a.py` | pancake-batter-0..3, stove-top, stove-knob-off/-on, flame, pan, ladle, batter-puddle-1..3, pancake-bubbles, pancake-golden |
| `tools/gen_pancakes_b.py` | plate-big, syrup-bottle, syrup-blob, berry, banana-coin, butter-pat, card-pancakes, photo-frame-pancakes |

Run `python tools/gen_pancakes_a.py [names...]`, `python tools/gen_pancakes_b.py [names...]`. `python tools/check_pancakes.py [--md]` is the mechanical check
(the 23 names, no extra SVG, ≤ 60 KB, clean SVG, touch sizes, viewBox families, frame window, plate/pan geometry measured again, the anchors in
`scenes-pancakes.js` = the kit, and nothing changed outside this folder against `tools/baseline-md5.txt`, the md5 manifest of `cooking-game-assets`
taken before any work). `scene.html?s=<scene>&w=2400|1440&canvas=1` composes a scene (via `file://`, no server) with the images-b, prep and salad
composers + `scenes-pancakes.js` and draws it the way the game does (img → native canvas → drawImage; `data-clip` sector clips for the share wedges).
`tools/sheet43.html` shows all items at 4:3 (the batter inside the prep bowl, the puddle family inside the pan, plus the re-used milk carton).
`tools/shot.sh` takes one screenshot: waits while `~/cooking/.browser-busy` exists (30 s steps, max 15 min), needs ≥ 2 GB free RAM,
refuses if any headless browser runs, one headless Chrome with a throw-away profile, killed if it lingers. `tools/shoot.sh <prefix> <scenes…>` runs it scene by scene.

Every file: no `<text>`, no fonts, no `<image>`, no scripts, no external references (only internal `#id`), ≤ 60 KB (largest: plate-big 38.6 KB).

## Colours
Batter `BAT #FAE0A0` (light `#FFF1C8`, shade `#E9C477`); milk in the bowl cool white `#F4F8F8` / `#C9D8DA` (so it separates from the warm flour);
setting pancake `#F6D48C`; golden side `GOLD #E7A043` centre fading to `#F4C574`, pale cooked rim `EDGE #F2CC80` / `#D69A48`; maple syrup `#D47C26`
(light `#F5B058`, dark `#9C5018`); blueberries `#4F62B0` with a pale bloom; banana = the smoothie banana flesh; butter = the cookie butter.
Pan: dark non-stick `#4C5157` with a steel lip and a walnut handle. Stove: cream enamel `#F5EEDF` on a teal front band, grate `#5A534F`.
Knob: kitchen coral. Flame: blue `#4FA6EC` tongues with orange `#FF9A3C` / yellow `#FFD35A` hearts.

## Files, sizes and anchors (viewBox units)
| file | viewBox | KB | anchor / rule |
|---|---|---|---|
| card-pancakes | 400×520 | 38.1 | same frame/layout as `card-cookies` / `card-smoothie`: picture x 34–366 (a stack with syrup, butter and blueberries on blue gingham), ingredient row y≈400–480 (egg, milk carton, wheat) |
| pancake-batter-0..3 | 640×520 | 15.6 / 32.6 / 13.0 / 7.8 | **= `sauce-stage-*` / `prep-bowl-*` / cookie `batter-stage-*`**: stack `prep-bowl-back` → `pancake-batter-N` → `prep-bowl-front` at the same position. Contents are clipped to the opening **(320,176) rx 262 ry 74**. 0 = flour island in a milk pool, the whole yolk on it, floating lumps (not stirred); 1 = first stir: yolk streaks swirling, many flour lumps; 2 = nearly mixed pale batter, a few lumps; 3 = smooth runny batter: level glossy pool with a folding ribbon |
| (on the bowl, reusing the cookie anchors) | prep-bowl frame | – | **flour lands at (300,150)** (the top of the flour island = where `flour-bag`'s mouth (200,96) should pour to); **egg: `egg-3`'s drop point (200,414) on the yolk anchor (372,150)** (the cookie `YOLK_ON_MOUND`; the yolk on stage 0 sits exactly there, r 31). Suggested order: flour → show cookie `batter-stage-0` (the same flour-mound shape); milk drops from the carton spout (38,118) onto it; when the egg lands swap to `pancake-batter-0`; stirring then goes 0 → 1 → 2 → 3 |
| stove-top | 1200×920 | 27.6 | cooktop from above: cream enamel top y 16–842, teal front band to y≈906. **Big burner centre (480,450)** (grate arms to r 430), a small decorative burner at (1040,250). **Knob recess centre (1040,752)** (r 128) |
| stove-knob-off / -on | 280×280 (one frame) | 7.1 / 7.2 | **centre (140,140)**, cream base r 124, coral dial r 86 with a grip bar and a white pointer. Draw at the **same scale as the stove**, centred on the stove's (1040,752) (world ≈ 200 px at 0.72k, a big touch target). Off: pointer up to the grey dot, lamp at (66,214) grey, flame mark (238,140) grey. On: bar turned 90° to the flame mark (orange), lamp lit orange-yellow with a glow, warm halo to r≈134 |
| flame | 1000×1000 | 18.9 | ring of 22 rounded blue tongues with orange/yellow hearts, **centre (500,500), base r 336, tips r 430–452**. Draw at the **pan's scale** with its centre on the pan-disc centre (= top-left at pan (−100,−100)), **after `stove-top` and before `pan`**: the pan (r 372) covers the bases, the tips peek 60–80 units around the rim |
| pan | 1240×800 | 22.9 | frying pan from straight above, handle to the right (steel neck x 730–890, walnut grip x 870–1230). **Disc centre (400,400), outer rim r 372 (744 across), cooking surface r 336.** On the stove: same scale, disc centre on the burner (480,450) → pan top-left at stove (80,50). Handle hole at (1190,400) |
| ladle | 400×640 | 5.5 | steel ladle full of batter, teal grip, cup rim ellipse (196,458) rx 152. **Pour point (40,458)** = the little spout on the left lip (a batter drip hangs there). Pour: rotate about the pour point **−30° … −45°** (CSS/Phaser clockwise-positive), the batter stream starts at the pour point (drawn by the game) |
| batter-puddle-1/-2/-3, pancake-bubbles, pancake-golden | **680×680 (one frame)** | 6.4 ×3 / 10.9 / 13.4 | top view, **centre (340,340)**. Draw at the **pan's scale** with top-left at **pan (60,60)** (= the family centre on the pan-disc centre (400,400)). Radii: puddle-1 **118**, puddle-2 **184**, puddle-3 **240** (wet, glossy, wobbly edge), bubbles **240** (setting top with bubbles and popped holes, browning rim), golden **240** (the flipped side: golden centre, lighter rim). All inside the cooking surface r 336 |
| plate-big | 720×720 | 38.6 | **= the pizza `dough-flat` frame.** White plate with a teal rim, centre (360,360), r 334 (+ contact shadow → 343). Stack of four: three lower pancakes offset (−4,42), (5,28), (−3,14) (their golden sides show as steps below), **top pancake = a circle centred (360,360), nominal r 290 (hand-cut wobble 284–294)**, drawn with the same `pancake_top('golden')` as `pancake-golden`. **Everything inside r 350** (stack 339, plate + shadow 343; checked). The game decorates and cuts the top disc exactly like the pizza |
| syrup-bottle | 260×520 | 9.7 | amber squeeze bottle held nozzle down, maple-leaf label, red flip cap. **Nozzle tip (130,506)**. In a `topping-bin` draw it at ≈0.36 k, tilted −20°; when decorating, anchor the tip over the pancake, tilted ≈ +24° |
| syrup-blob, berry, banana-coin, butter-pat | 140×140 | 5.8 / 7.2 / 4.3 / 4.7 | stamps like `topping-*`, centred (70,70), radius ≤ 58. On the plate drawn at scale p: syrup blobs **1.0–1.35 p**, butter **1.2 p**, berries (three blueberries + mint leaf) **0.85–1.0 p**, banana coins **0.9–0.95 p**; keep centres within r ≈ 230 of (360,360) so they stay on the top pancake |
| photo-frame-pancakes | 700×780 | 27.1 | **identical to `images-b-prep/photo-frame`**: same viewBox, the same transparent window **x 80–620, y 80–620** (the very same hole path, checked), tape, hearts and star. The pizza sticker is replaced by a small pancake stack with syrup and blueberries |

### Layer order
- Bowl: `prep-bowl-back` → `pancake-batter-N` (or cookie `batter-stage-0` for flour only) → falling milk drops / `egg-3` / `spoon-wood` → `prep-bowl-front`.
- Stove: `stove-top` → `stove-knob-off|on` (on the knob recess) → `flame` (only when on) → `pan` → `batter-puddle-N` | `pancake-bubbles` | `pancake-golden` (at pan (60,60)) → batter stream (code) → `ladle`.
  Flip: draw `pancake-golden` (or bubbles on the way up) above the pan and squash its height (≈0.4) while it turns; it lands back at pan (60,60).
- Plate: `plate-big` → toppings (stamps) → `syrup-bottle` while squeezing. To show the stack growing, drop `pancake-golden` onto the plate at scale
  **p × 290/240** centred (360,360) (it matches the plate's top pancake).
- Share: capture plate + toppings, cut the disc of r 290 around (360,360) into four quarters (like the pizza); `scene.html?s=pancakes-share` shows it with sector clips.

## Scenes (`scenes-pancakes.js`) and reference shots (`shots/`, 20:9, 2400×1080 world at 1200 px)
pancakes-home · pancakes-milk (cookie flour mound in the bowl, carton pouring) · pancakes-egg (stage 0, egg-3 over the yolk anchor, the three egg states) ·
pancakes-stir (stage 2 + spoon, the four stages) · pancakes-stove (knob on + pointing hand, flame around the empty pan, off/on knobs on the left) ·
pancakes-pour (ladle tipped over puddle-2, stand-in stream) · pancakes-bubbles · pancakes-flip (golden side up in the air, Mom holds the handle) ·
pancakes-stack (plate with the stack, the next pancake landing; small stove on the left) · pancakes-decorate (four boxes, decorated plate, syrup bottle) ·
pancakes-share (three wedges on the board, the fourth carried to Pippa) · pancakes-photo.
**Reference shots (final art):** `r1-home`, `r1-milk`, `r1-egg`, `r1-stir`, `r1-stove`, `r1-pour`, `r1-bubbles`, `r1-flip`, `r1-stack`, `r1-decorate`,
`r4-share`, `r1-photo`; all items at 4:3: **`b1-sheet.png`** (the contact sheet). `a1-sheet` and `r0-*` are the critique round.

## Review (one round, art director)
Belongs to the set? Yes: same paper grain, cream torn rim, shadows, palette, bowl, board, bins, Mom and Pippa. Weaknesses found in `a1` + `r0-*`, fixed, re-shot as `b1` / `r1-*` / `r4-share`:
1. **The golden pancake had dark blurred blotches** (read as burnt / leopard spots, also on the plate's top pancake). Now an even golden-brown centre fading to a lighter rim, with only a few faint browned patches.
2. **The stack on `plate-big` read as one pancake.** The lower pancakes step down 14 / 28 / 42 units with a darker side and a light top edge each; still inside r 350 (339, checked).
3. **The flame read as blue petals / a sun** (sharp spikes with dark outlines). Now 22 round, overlapping tongues with orange-yellow hearts: a friendly flame ring.
4. **The knob's "on" mark read as a water drop.** Now three little flame tongues (orange when on, grey when off) next to the lamp.
5. **`pancake-batter-0`: the milk was invisible** (white flour on white milk). Milk is now cool white with shines, the flour island warm cream with a darker foot.
6. **The syrup blobs read as chocolate** (too dark). Syrup is a lighter amber (`#D47C26`) with a bright highlight.
7. **The stove grate was a black spider** dominating the cooktop. Softer grey-brown, thinner arms.
8. **The frame sticker was too small** to read as pancakes (0.34 → 0.42).
Scene fixes: the stove moved left so the pan handle and knob clear Pippa and Mom's pointing hand; the flip no longer uses arcs and a finger in the pan (Mom holds the handle);
the loose mini puddles in the pour scene (they read as eggs) were removed; the carried share wedge is smaller, its point at Pippa's mouth and no longer over her face.

## Remaining weaknesses
1. There is no "flour only" / "flour + milk" bowl layer in the 23-name list: the flour step borrows the cookie `batter-stage-0` (same mound shape) and the milk pool
   appears only when the egg lands (`pancake-batter-0`). A brief swap, but a dedicated layer would be cleaner.
2. The flip is one top-view drawing squashed vertically; it reads as a turning disc, not a true edge-on pancake. Works in motion, weak as a still.
3. The carried share wedge (`pancakes-share`) is crowded near Pippa at 20:9 (like the pizza slice); the game animates it, but the still is busy.
