# Style B production set — art director critique log

Screens are composed by `scenes.js` from the game's own layout table (`stage.ts`), screenshotted by `tools/shot.sh`
at phone size (800x360 CSS px, dpr 3 = 2400x1080 for 20:9; 480x360 dpr 3 = 1440x1080 for 4:3), through the
img → native canvas → drawImage path (`scene.html?canvas=1`). Shots: `shots/r0-*`, `r1-*`, `r2-*`, `r3-*`.

## Round 0 (first assembly, `shots/r0-*`)
1. Paper fibres read as white "static" dashes on the wall, counter and Mom's blouse: a digital look. **Fixed** in `pb.py`: shorter, sparser, weaker fibres in two directions; the tooth and mottle keep the paper feel.
2. The walnut board was a heavy, flat, dark-brown disc (ugly when empty during baking). **Fixed**: honey walnut, bevel ring, dark ring under the crust edge.
3. Sauce stamps built a lumpy, scalloped patchwork (the known "busy sauce" weakness). **Fixed**: `sauce-blob` is now one flat red shape, and stamps merge into one field (the game recolours it flat anyway).
4. Cheese shreds read as fries or macaroni. **Fixed**: thinner, flatter, ragged strip.
5. Mom's blouse was a pale grey-beige that melted into the cream wall. **Fixed**: coral-peach with visible cream dots.
6. Mom's elbow was bony, the waving hand claw-like, the grab hand a crab pincer and the roll hand four loose strips. **Fixed** (see README-mom.md).
7. The title play button was too small for the hero of the screen. **Fixed**: stronger rim and triangle, shown at 1.4×.

## Round 1 (`shots/r1-*`, all 9 screens at 20:9, 4 at 4:3)
1. The empty board (bake, feed, party) reads as a rippled tree stump. → faint smooth grain and soft radial light.
2. The pizza slice looks like a lemon-cake wedge (flat yellow, tiny toppings). → our pizza: sauce edge, melted cheese blobs, drips, our toppings.
3. Cheese shreds on red sauce read as orange matchsticks. → paler mozzarella yellow, wider, shorter, softer curl.
4. Feed: Pippa overlapped Mom's body and arm, and the slice and hand covered her face. → Pippa at 62% on the board's right rim, the slice approaches her mouth from the left with its tip first, and Mom's pointing arm tucks behind her.
5. Party: stars covered Mom's face, and a lone slice on a big empty board looked sad. → stars stay out of the face zones, a ring of stars circles the board, and Pippa cheers beside Mom.
6. The demo hands were about 2.5× bigger than Mom's own hand, so the scale was inconsistent. → shown at 0.62–0.66 of native.
7. (checked, OK) 4:3 decorate: the bins, full-size board, done button and Mom all fit; Pippa is hidden, as intended.

## Round 2 → verified in round 3 (`shots/r3-*`, all 9 screens at 20:9 and at 4:3, shot one at a time with a ≥ 2 GB free-memory guard)
1. 4:3 feed: Pippa no longer covers Mom's face. **Verified.**
2. Party board: the finished, baked pizza is on it, and the stars keep clear of Mom's face. **Verified.**
3. Sprinkle hand: 0.8× still looked too small in the shot → raised to 1.1×. **Verified** at 20:9 and 4:3.
4. Baked look: the sepia approximation looked raw → replaced by the game's exact multiply tint 0xFFD49A (SVG colour matrix). **Verified**: golden crust and warm cheese in bake, feed, party and title.
5. 4:3 bake: Mom's arm is now aimed at the oven window from her shoulder pivot. **Verified.** The same aim at 20:9 dipped the arm over Pippa's head, so at 20:9 the default pose is kept (the demo hand points at the oven).
Open: the party star cluster by the shelf is a little dense; the sauce edge stays scalloped; there is no browned-cheese detail beyond the tint.
