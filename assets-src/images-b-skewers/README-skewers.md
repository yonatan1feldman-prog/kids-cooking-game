# images-b-skewers (round 13: the fruit skewers)

Style B, the same kit as every batch (it wraps `images-b-smoothie/tools/smoothiekit.py` read-only). Generator:
`python tools/gen_skewers.py [names...]` writes into this folder only; copy the SVGs to `public/assets/images/` and bake
their WebPs (`__bakeWebp(['skewer-stick', 'skewer-tray', 'card-skewers', 'photo-frame-skewers'])`, never the whole set).

| File | Frame | Notes (the game's anchors are `ART.skewers` in src/core/assets.ts) |
|---|---|---|
| skewer-stick | 60x720 | drawn standing, point at the top (tip y 10, foot y 712); the game lays it down turned 90 degrees, point right |
| skewer-tray | 800x600 | the recipe's board: a walnut tray with handles and a checked napkin; rows at y -187 / -62 / 62 / 187 from its centre (row 0 = Mom's model) |
| card-skewers | 400x520 | the home card: three skewers (AB, AB, free) on a green gingham, strawberry / banana / kiwi below |
| photo-frame-skewers | 700x780 | the prep photo frame with a small skewer sticker in place of the smoothie glass |

The fruit pieces on the sticks are the smoothie's `fruit-*-slice` (240 frames) at 0.55 of the tray's scale, one every 116
units from x -250 (the tray's frame); the stick's foot end lies at x -345.
