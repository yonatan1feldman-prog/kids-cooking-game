# Mom (production, style B paper cut-out): "Mom version 1"

Generator: `tools/gen_mom.py` (imports `tools/pb.py`). Run `python tools/gen_mom.py` with no arguments to write Mom v1 into `images-b/`.
Mom v1 has a brown bun, no glasses and a teal apron (`pb.TEAL`).

## Files
| file | viewBox | size |
|---|---|---|
| mom-body | 0 0 800 800 | 11.0 KB |
| mom-head | 0 0 800 800 | 8.7 KB |
| mom-hair | 0 0 800 800 | 7.9 KB |
| mom-arm-left (pointing) | 0 0 800 800 | 22.7 KB |
| mom-arm-right (waving) | 0 0 800 800 | 20.3 KB |
| mom-eyes-open / blink / happy / surprised | 0 0 800 800 | 3.8–6.0 KB |
| mom-mouth-smile / open / talk | 0 0 800 800 | 3.5–3.8 KB |
| mom-hand-point / roll / spread / sprinkle / grab | 0 0 400 400 | 10.6–21.2 KB |

Every layer shares one frame: 800x800. y = 800 is her waist (the screen bottom cuts her off there). The body centre line is at x = 500, which leaves the left of the frame free for the pointing arm.

**Stack order** (back to front): `mom-arm-right`, `mom-body`, `mom-head`, `mom-hair`, `mom-eyes-*`, `mom-mouth-*`, `mom-arm-left`.
Brows are part of the eyes files. Glasses, when enabled, are drawn inside every eyes file. For curly hair, the back mass of curls is drawn inside `mom-body`.

## Arm pivots (frame coordinates, the same for every variant)
- **mom-arm-left** shoulder pivot: **(350, 505)**. Default pose: pointing LEFT and about 12° above horizontal, toward the pizza. The arm goes shoulder → elbow (264, 428) → wrist (160, 405) → **index fingertip ≈ (37, 378)**. The forearm stays above y ≈ 450 from x ≈ 290 leftwards, so it clears the hedgehog area (x 50–290, y 420–700).
- **mom-arm-right** shoulder pivot: **(650, 505)**. Default pose: a friendly wave, with the open hand beside her head (palm about (739, 462)). It fits inside the frame.
- Each arm file includes its own puffed sleeve, which is centred on the shoulder, so the sleeve turns with the arm. Rotating ±20° around the pivots shows no gap (see `shots/mom-rot.png`). At +20° the waving hand's fingertips reach the right edge of the frame.

## Demo hands (400x400, from the lower right, blouse cuff with a rounded end inside the box, drop shadow +10,+16 blurred)
| file | anchor (the point the game places on the target) | pose |
|---|---|---|
| mom-hand-point | **(100, 100)** = index fingertip | index finger pointing up-left |
| mom-hand-roll | **(140, 140)** = palm centre (the contact spot) | one mitten-like flat palm-down hand with shallow finger grooves, slightly squashed (pressing), thumb tucked along the side. The hand only; the game draws the rolling pin |
| mom-hand-spread | **(110, 250)** = centre of the spoon bowl | fist holding a wooden spoon. The bowl is at the lower left with its back down and sauce on it; the handle sticks out at the upper right |
| mom-hand-sprinkle | **(125, 115)** = pinch point between the fingertips | thumb, index and middle fingertips pinched, slightly apart; six cheese shreds falling below |
| mom-hand-grab | **(110, 150)** = centre of the carried item (changed from (130,135) in round 3) | gentle pinch-carry seen from above: thumb + index/middle fingertips hold the item at its upper-right rim; the rest of the hand trails to the lower right. The game draws the hand ON TOP of the item; a 140 item centred on the anchor stays mostly visible |

The anchors are also in `HAND_ANCHORS` in `gen_mom.py`.

## Params + CLI (same as style-test `gen_mom_b.py`)
`PARAMS = {"hair_color": "#6B4430", "hair_style": "bun", "skin_tone": "#E6B38A", "glasses": False, "apron_color": pb.TEAL}`
- `hair_style`: `bun` / `bob` / `curly`. The hair shade, highlight and brow colours come from `hair_color`. The scrunchie and glasses frame come from `apron_color`. The blouse is a fixed warm coral-peach (`BLOUSE = "#F6B496"`) with cream polka dots, for every variant. The blush, mouth, arms and hands come from `skin_tone`. The skin and blouse luminances are close (0.74 vs 0.78), so the arms are separated by hue, by the cream trim band plus a darker rose edge on each sleeve and cuff, and by the torn-paper rim. For very light skin (luminance > 0.8), the blouse is deepened to a rose automatically.
- Build a variant with `python tools/gen_mom.py --out <dir> --hair_style curly --glasses 1 --hair_color "#2B211F" --skin_tone "#9A6444" --apron_color "#D9713F"`. `--out` is relative to `images-b/` unless you give an absolute path. With no `--out`, it writes to `images-b/`.
- Pivots, anchors and the fingertip position don't change with the params. The hands use the variant's skin and blouse colours.

## Self-check tools
`tools/momsheet.html` stacks the layers the way the game does (img → canvas):
- `?mode=grid&scale=0.4`: all 12 eye × mouth combinations.
- `?mode=scene`: a 2400x1080 phone scene. Take it with `shot.sh` at 800x360 CSS px and dpr 3. Mom is at scale 1 at the right, with a pizza disc at (1250, 590) and the hedgehog zone outlined.
- `?mode=rot&scale=0.5`: both arms at −20°, 0° and +20° around the pivots, with the pivots marked.
- `?mode=hands&scale=0.8`: the five demo hands with a crosshair on each anchor, plus a 140 test disc in the grab hand.
- `&dir=` points the page at a variant folder.

Shots: `shots/mom-grid.png`, `mom-scene.png`, `mom-rot.png`, `mom-hands.png`.

## What changed vs the style test (style-test/style-b/mom-1)
- Frame widened from 600 to 800. The whole drawing moved +200 in x, and the pivots moved from (150|450, 505) to (350|650, 505).
- **Pointing arm redrawn as a full grown-up arm:** puffed sleeve at the shoulder, then upper arm, elbow (with a soft light patch), a clearly visible tapered forearm with a soft bulge near the elbow, a slim wrist, and a larger pointing hand (scale 0.68, was 0.56) with the thumb up. The limbs are cut-paper tapered outlines (a shade layer plus a skin layer), not constant-width strokes.
- Per the art director's correction, the arm points left and slightly up (at the pizza centre in the 20:9 layout) and stays above the hedgehog zone.
- The waving arm uses the same tapered construction, and the waving fingers got nail lights.
- Ported to `pb.py`: production palette, material "smooth" for skin files and "default" for body and hair, and the `{p}cut` torn-paper rim on the outer silhouettes (body, head plus ears, hair, arms, hands). Filter ids have unique prefixes (`mp-*`, `mh-*`).
- `talk` mouth: was a small "o", which read as a yawn or surprise. It is now a friendly half-open smile with the corners up, top teeth and a tongue, clearly smaller than `open`.
- `surprised` eyes: slightly bigger, with an extra sparkle and brows raised 10. Delighted, not scared.
- The single `mom-hand` is replaced by five demo hands at 400x400. For hovering, they use the cut filter's offset shadow (+10,+16, blur 7) instead of a duplicated silhouette, which saves size.

## Critique log
**Round 1** (first render):
- The scene sheet's canvas was wrongly sized (a test-page bug), so the page was fixed.
- In every expression she is warm: raised soft brows, big shiny eyes, blush and a beaming smile. The new talk mouth reads as speaking, not surprise.
- Pointing arm: the forearm and elbow now read, but the hand looked too small next to the waving hand, and the wrist block showed as a dark band. Fixes: hand scale 0.6 → 0.68, the wrist piece in skin colour, the limb widths raised to 52 at the shoulder tapering to 34 at the wrist.
- Hands: `roll` had a thumb sticking out like a fifth spread finger. `sprinkle` read as a closed fist, not a pinch. The `grab` thumb stopped short of the item.

**Round 2**:
- The arm is proportionate and reads as an adult arm. The fingertip is at (37, 378), and in the phone scene it points at the pizza's edge and centre direction. It stays clear of the hedgehog box.
- Rotations of ±20° show no gap at either shoulder.
- `sprinkle` was redrawn with longer fingers converging on the pinch point, and it now reads as pinching. The `grab` thumb was extended so it crosses in front of the item's lower edge.
- The `roll` thumb was shortened and tucked alongside the palm.
- Variants tested and then deleted: curly + glasses on dark skin with an orange apron, and bob on light skin with a sage apron. The layers align, the arms don't melt into the blouse, and the warmth holds.

**Round 3** (art director, after the full-scene phone shots r0-roll / r0-decorate; pb.py paper fibres softened, then re-run):
1. The blouse read as washed-out grey-beige on the cream wall. It is now a warm coral-peach `#F6B496` with cream polka dots (r 6.5, visible at phone size) on the torso and puffed sleeves. The sleeves have a cream trim band with a darker rose edge underneath, so the arms separate from the sleeve.
2. The pointing arm's upper arm was thin and the elbow bony. The centreline is now Chaikin-smoothed, so the elbow is round, and the widths are 60 (shoulder) → 50 (elbow) → 48 (forearm) → 35 (wrist) with a smooth taper. The fingertip (37,378), pivot and direction are unchanged.
3. The waving hand read claw-like. It is now a softer open palm with shorter, rounder fingers (27 wide, fully rounded tips with nail lights) and a larger, clearly separated thumb.
4. The grab C-claw read as a crab pincer. It was redesigned as a pinch-carry from above, and **the anchor moved to (110,150)**.
5. The roll fingers read as four strips. They are now merged into one mitten with shallow grooves, squashed (scale 1.06 × 0.9) as if pressing, with the thumb tucked.
Re-checked: grid (all 12 combos warm), phone scene (the blouse pops off the wall, the arm points at the pizza and stays above the hedgehog box), ±20° rotations (no gap), and the hands sheet with anchors.

**Remaining weaknesses**:
- The `grab` hand only overlaps the item rim by about 12 units, so small items (radius < 45) would sit away from the fingertips.
- At +20° the waving hand touches the right edge of the frame.
- Curly hair still uses the style test's uniform bead curls.
