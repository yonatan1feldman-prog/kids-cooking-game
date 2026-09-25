# images-b production spec (style B, paper cut-out) — contract for every generator

Output folder: `cooking-game-assets/images-b/` (SVGs at the top level). Generators live in `images-b/tools/`,
import everything from `pb.py` (palette, `wob`, `wrect`, `smooth`, `P/E/C/G`, `std_defs`, `svg`, `write`).
Never write outside `images-b/`. Never modify `images/`, `style-test/`, `sounds/`, `cooking-game/` (read only).

## Hard rules
- Pure SVG: no `<text>`, no fonts, no `<image>`, no scripts, no external refs. Must render correctly when loaded
  through `<img>` and drawn to a canvas (filters, masks, clipPaths, gradients, patterns are OK).
- Size budget: ≤ 60 KB per item, ≤ 150 KB for the background. Keep path precision to 1 decimal (`n()`).
- Filter/clip/gradient ids unique per file: use a short file prefix `p` (e.g. `p = "tom-"`) for `std_defs(p, ...)`.
- Look: children's-book cut paper. NO outlines. Layered flat shapes, each layer with a soft shadow (`{p}sh`),
  the outermost silhouette of an item wrapped in the torn-edge filter (`{p}cut`) so a thin ragged cream paper core
  shows around it. Whole file wrapped in the paper texture group (`{p}gr`), material preset:
  "smooth" for dough/skin/faces, "default" for food/objects, "rough" for card/wood/bins, "bg" for the background.
  Vary the `seed` per file so textures are not identical.
- NO faces on food or objects (the food gets baked and eaten). Cuteness comes only from Mom and Pippa the hedgehog.
- Palette: use `pb.py` colours (foreground = brighter/saturated set; background = BG_* calmer set). You may derive
  tints with `mix()`. Items must pop clearly off the background (light wall `#F3E4C6`, counter wood `#D8AB7C`).
- Physical size first: the phone shows 1080 units in ~6.5 cm. Toppings are ~140 units (~8 mm). Shapes must read as
  bold simple silhouettes; avoid fine detail smaller than ~6 units; strong value contrast between parts.

## Geometry contract (same name = same viewBox/width/height AND same content placement as `images/`)
| file | viewBox | placement that must match |
|---|---|---|
| dough-ball | 360x300 | lump x≈56–304, top y≈48, base y≈266; ground shadow ellipse centre (180,270) rx≈145 |
| dough-flat | 720x720 | round pizza base centre (360,356); outer crust radius ≈ 334 (max 345 incl. rim); sauce/cheese area radius ≈ 290 |
| rolling-pin | 640x200 | lying horizontal, centre (320,97); barrel x 125–515 y 40–154; handles x 20–150 & 490–620 (y 72–122); shadow ellipse (320,180) |
| sauce-bowl | 340x300 | bowl x 24–316, rim ellipse centre (170,122) rx 146 ry 36, bowl bottom y≈266, shadow (170,278) rx 130; a spoon/ladle handle may stick up at the right to y≈0 |
| sauce-blob | 200x200 | ONE blob centred (100,100), radius ≈ 68 (lobed, organic). Game uses only its SILHOUETTE (recoloured flat red) as a paint brush, so keep it one solid blob, no holes, no droplets far away |
| cheese-shaker | 260x400 | jar x 40–220 y 140–370, lid y≈50–146, centre x 130; ground shadow (130,382) rx 105 |
| cheese-shred | 80x44 | one shred centred (40,22), spanning x≈6–74, thickness ≈ 16–20 |
| topping-* (tomato, olive, mushroom, corn, pepper, onion) | 140x140 | top-down slice centred (70,70), silhouette within radius ≈ 58 (≈ x/y 12–128); mushroom silhouette x 18–122, y 18–126 |
| tray AND pizza-board (identical files) | 820x830 | round wooden board centre (410,410), radius 393 (outer edge incl. rim); board shadow may extend to y≈828 |
| oven-closed / oven-open / oven-inside | 700x800 | body x 40–660, y 60–710, feet to y≈750, ground shadow (350,772) rx 300. oven-closed: TRANSPARENT window hole exactly x 150–550, y 320–610, rx 30 (via mask), the pizza shows through it. oven-inside: dark oven interior filling at least x 120–580, y 290–640 (behind the window). oven-open: same body, door dropped open at the bottom (door x≈40–660, y≈660–782) and the dark mouth x 90–610, y 240–670 |
| pizza-slice | 300x300 | tip DOWN at (150,284), crust on top across x≈30–270, y≈30–96 |
| star | 200x200 | 5-point star centre (100,100), points reach y 16 top, x 16–184, y 175 bottom |
| btn-play / btn-home / btn-done | 240x240 | round button centre (120,118), radius ≈ 110 incl. rim, shadow ≤ y 236. Icons: play triangle / house / check mark, cream on colour |
| card-pizza | 400x520 | card x 10–390, y 10–510, radius 36; picture area x 34–366, y 34–366 shows a whole pizza; lower row (y≈400–480) shows small ingredient icons (tomato, cheese wedge, olive ring). No text |
| character-* (8 layers) | 600x700 | Pippa the hedgehog (from style-test style-b). Centre x 300, feet/base y≈680, ground shadow ≤ 696. All layers aligned in one frame; stack body, eyes, mouth |
| hand-hint | 220x280 | Mom's hand pointing: fingertip at EXACTLY (53,23); the hand is tilted 12°, comes from the lower right, sleeve cuff ends inside the box |
| bg-kitchen-landscape | **2400x1080** (exception) | counter back edge strip y 380–414, counter surface from y 414 down; everything important inside x 480–1920; plain counter top (no board painted) |

New files (not in `images/`):
| file | viewBox | notes |
|---|---|---|
| topping-bin | 240x240 | enamel/paper box seen from above-front. The game draws a topping (140) on it centred at (120,112): the floor must clearly hold a 140 topping (floor ≥ 170 wide, ≥ 150 tall). Everything incl. shadow inside 240 |
| pizza-board | 820x830 | identical copy of tray |
| mom-* layers | 800x800 | see images-b/README-mom.md |
| mom-hand-* | 400x400 | see mom README |

## Self-check each generator must do
1. Run the generator; print file sizes.
2. Render a sheet via `tools/shot.sh` (Edge headless, page served on http://localhost:8765/images-b/...), open the PNG
   with the Read tool, and look at it as an art director at phone scale. Fix and re-render at least once.
