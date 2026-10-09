import { isBigChef } from './level';

/**
 * THE TUNING TABLE: every count, threshold and timing that decides how long a step takes or how much work
 * it needs, in one place, so it is easy to change after watching the child play. Recipes read their
 * numbers from here (src/recipes/*.ts); the step types read the rest.
 *
 * The rule behind the numbers: she can't fail and nothing needs precision. More work means more repeats
 * and more visible in-between states, never something harder. A step is about 10-20 s of active doing
 * for a 5-year-old. Distances are world units at k = 1 (the steps multiply them by layout.k); for scale,
 * the pizza is 700 across and a relaxed child's rub moves the finger about 600-900 units a second.
 */

/**
 * Ms of no progress before Mom's hand shows the gesture again (the hint), in every step. 8 s since the gameplay round
 * (was 5 s): she tries by herself first. The title and home screens keep a quicker hint (SCREEN_HINT_MS).
 */
export const HINT_AFTER_MS = 8000;
/** The title and home screens: ms without a touch before Mom's hand points at the play button / a card. */
export const SCREEN_HINT_MS = 5000;
/** Further ms of no progress before Mom helps ("Let me help you!", and her hand does it). 20 s since the gameplay round. */
export const AUTO_AFTER_HINT_MS = 20000;
/** A demo never runs longer than this. */
export const DEMO_MAX_MS = 2500;
/** Before a demo, Mom finishes the line she is saying, waiting at most this long. */
export const DEMO_WAIT_MS = 2000;

export const TUNING = {
  /** Wash hands: tap the tap, then rub the hands until the bubbles are there; then the water rinses them. */
  wash: {
    /** Bubbles that grow on the hands before they are rinsed. */
    bubbles: 14,
    /** Rubbing distance (finger travel over the hands) per new bubble. */
    rubPerBubble: 300,
    /** After this many bubbles Mom says "Rub, rub, rub!". */
    rubLineAt: 4,
    /** How long the rinse takes (the bubbles slide off, the water runs, the tap closes). */
    rinseMs: 1500,
    /** The recipe challenges (PR A): a soap bar on the sink's rim; rubbing makes bubbles only after it (both levels). */
    soap: true,
  },
  /**
   * The recipe challenges (PR A), both levels: the busiest counts grow with how often this recipe was played on this
   * device (`run.runNo`, 0 = the first run). From run `fromRun[0]` (0-based: the 3rd) one more cut per vegetable, one
   * more press per knead / crush / tear stage, `sprinkle` more cheese pieces and `shakes` more shakes of salt; from run
   * `fromRun[1]` the same again. Applied as each step starts (`grown` below, RecipeScene).
   */
  grow: { fromRun: [2, 4] as readonly number[], chop: 1, presses: 1, sprinkle: 10, shakes: 1 },
  /** Knead: presses on the dough per stage (dough-knead-1 -> 2 -> 3 -> dough-ball: 3 changes). */
  knead: { pressesPerStage: 4 },
  /** Crush: presses on the tomatoes per stage (sauce-stage-0 -> 1 -> 2: 2 changes). */
  crush: { pressesPerStage: 4 },
  /** Stir: finger travel inside the bowl to go from chunky (stage 2) to smooth sauce (stage 3). About 2-3 laps. */
  stir: { distance: 4200 },
  /** Grate: rubbing travel on the grater (up and down counts fully, sideways a third) for the whole block. */
  grate: { distance: 4200, shredEvery: 60 },
  /** Roll: rubbing distance in dough widths. */
  roll: { rubWidths: 6 },
  /** Spread: share of the dough that must be painted (the game fills the rest). */
  spread: { coverage: 0.78 },
  /** Sprinkle: cheese pieces that land before the step is done. */
  sprinkle: { count: 55 },
  /** Choose the toppings: how many she picks, and the pause after the last pick (she sees her three). */
  choose: { pick: 3, pauseMs: 900 },
  /** Chop: cuts per vegetable (the end that is left becomes one more slice). How a cut is made: `cut` below. */
  chop: { cuts: 6 },
  /**
   * Gameplay round 4: every cut follows the finger (the vegetables in `chop`, the pizza / cake / pancakes in `share`).
   * The knife cuts only while the finger moves along the next cut line, in its direction (down through a vegetable,
   * across the dish from the knife's end), at most `angle` degrees off it and at most `band` x the dish's diameter or
   * `vegBand` x the vegetable's width either side of it, never less than `minBand` (x k; 110 is about 7 mm on the
   * phone: a small fingertip). The cut's front follows the finger, so a stroke may stop and go on
   * (a new stroke starting up to `gap` of the line ahead of the front still cuts). `through`: how far along the line
   * the cut must come (the rest is finished by itself). `wobbleAfter`: finger travel (x k) the wrong way, sideways or
   * off the line in one touch before the item wobbles (a gentle "not like that", a miss: three show the hint).
   */
  cut: { angle: 35, band: 0.17, vegBand: 0.33, minBand: 110, gap: 0.3, through: 0.8, wobbleAfter: 90 },
  /**
   * Open a can or a jar, then pour it into the bowl. Can: `taps` taps on the lid, or one move up of `swipe` units.
   * Jar: sideways rubbing on the lid adds up to `twist` units (a tap counts a quarter of it). Pour: ms of holding the
   * open can or jar over the bowl (the pouring stops when it is moved away and goes on when it comes back).
   */
  open: { taps: 4, swipe: 110, twist: 1100 },
  pour: { ms: 2800 },
  /**
   * The oven's temperature: the needle starts at `from`, each press moves it by `step` between `min` and `max`, and
   * baking starts at `target` (the art's panel prints 50-250). Baking: ms in the oven after the start.
   */
  oven: { from: 50, step: 50, min: 50, max: 250, target: 200, bakeMs: 5000 },
  /** Taking it out: let go once it is this far out of the oven (0 in it .. 1 on the board), it lands on the board. */
  bake: { pullAt: 0.55 },
  /**
   * Gameplay round 3 raised most counts here a little (a bit more to do in every step, never harder to do).
   * Share: slices the pizza is cut into (shared between Mom and Pipa, any way she likes; how a cut is made: `cut`).
   */
  share: { slices: 6 },
  /**
   * The salad (round 6; aim: 4-5 minutes from the card to home). Wash the vegetables: drops (bursts) of rubbing, as
   * `wash.bubbles`. Tear the lettuce: presses per stage (head -> tear-1 -> 2 -> 3: 3 changes). Chop: cuts per vegetable.
   * Into the bowl: ms of pouring each of the four (the lettuce and her three vegetables). Lemon: presses per stage
   * (3 states: 2 changes). Oil: ms of pouring. Salt: shakes. Mix: finger travel in the bowl. Serve: portions.
   */
  salad: {
    washVeg: { bubbles: 10, rubPerBubble: 300, rubLineAt: 99, rinseMs: 1200 },
    tear: { pressesPerStage: 4 },
    chop: { cuts: 5 },
    transfer: { ms: 1300 },
    lemon: { pressesPerStage: 4 },
    oil: { ms: 1800 },
    salt: { shakes: 6 },
    mix: { distance: 3600 },
    serve: { portions: 4 },
  },
  /**
   * The cookies (round 7; aim: 4-5 minutes from the card to home). Into the bowl: ms of pouring the flour and the sugar
   * (the butter drops in at once). Egg: taps per stage (whole -> cracked -> open: 2 changes). Stir: finger travel through
   * the four batter stages. Knead: presses per stage (knead-1 -> 2 -> 3 -> ball: 3 changes). Roll: rubbing in dough
   * widths. Cut: the six slots of the sheet are the count; `pressMs` is one press of a cutter. Oven: the target is 150
   * (vo-temp-150 says "one hundred fifty"). Share: the six cookies.
   */
  cookies: {
    flour: { ms: 2000 },
    sugar: { ms: 1500 },
    egg: { pressesPerStage: 3 },
    stir: { distance: 4200 },
    knead: { pressesPerStage: 4 },
    roll: { rubWidths: 5 },
    cut: { pressMs: 520 },
    oven: { target: 150 },
  },
  /**
   * The smoothie (round 8; aim: 4-5 minutes from the card to home). Wash the fruit: drops of rubbing, as the salad's
   * vegetables. Chop: cuts per fruit. Into the jar: ms of pouring each bin. Milk: ms of pouring. Blend: ms the motor must
   * run in all (holding the button or tapping it: a tap runs it at least `tapMs`). Glass: ms of pouring to fill one glass.
   */
  smoothie: {
    washFruit: { bubbles: 12, rubPerBubble: 300, rubLineAt: 99, rinseMs: 1200 },
    chop: { cuts: 6 },
    transfer: { ms: 1500 },
    milk: { ms: 2200 },
    blend: { runMs: 7000, tapMs: 450 },
    glass: { ms: 2400, count: 3 },
  },
  /**
   * The pancakes (round 8; aim: 4-5 minutes from the card to home). Into the bowl: ms of pouring the flour and the milk.
   * Egg: taps per stage. Stir: finger travel through the four batter stages. Pour and flip: pancakes, ms of holding the
   * ladle over the pan for one, ms before the bubbles, the swipe up that flips it (world units, short). Share: wedges.
   */
  pancakes: {
    flour: { ms: 2500 },
    milk: { ms: 2500 },
    egg: { pressesPerStage: 3 },
    stir: { distance: 4800 },
    flip: { count: 3, pourMs: 3500, cookMs: 3000, minSwipe: 90 },
    share: { slices: 4 },
  },
  /**
   * The vegetable soup (round 9; aim: 4-5 minutes from the card to home). Wash the vegetables: drops of rubbing, as
   * the salad's. Peel (carrot and potato only): strips per vegetable and the finger travel along it for one strip.
   * Chop: cuts per vegetable. Into the pot: ms of pouring each bin. Water: ms of pouring. Stir: finger travel through
   * the three soup stages. Serve: one ladle per bowl, two bowls.
   */
  soup: {
    washVeg: { bubbles: 12, rubPerBubble: 300, rubLineAt: 99, rinseMs: 1200 },
    peel: { strips: 6, minSwipe: 130 },
    chop: { cuts: 5 },
    transfer: { ms: 1400 },
    water: { ms: 2400 },
    stir: { distance: 4800 },
    serve: { bowls: 3 },
  },
  /**
   * The birthday cake (round 9; aim: 4-5 minutes from the card to home). Into the bowl: ms of pouring the flour, the
   * sugar and the milk; egg: taps per stage. Stir: finger travel through the four batter stages. Pour into the pan:
   * ms of pouring. Oven: the target on the panel (vo-temp says "two hundred"). Frosting: how far it is smeared.
   * Decorate: things on the cake. Candles: how many. Share: wedges.
   */
  cake: {
    flour: { ms: 2400 },
    sugar: { ms: 2000 },
    milk: { ms: 2400 },
    egg: { pressesPerStage: 3 },
    stir: { distance: 4800 },
    pan: { ms: 2600 },
    oven: { target: 200 },
    frost: { rubWidths: 5 },
    decorate: { items: 4 },
    candles: { count: 5 },
    share: { slices: 6 },
  },
  /**
   * The fruit skewers (round 13; aim: about 4 minutes from the card to home). Wash and chop: as the smoothie. Thread:
   * pieces on each skewer, how many Mom threads herself on the "what comes next?" skewer, how far from the stick a
   * dragged piece still lands (x k), the pause between skewers (ms). Share: the three skewers.
   */
  skewers: {
    washFruit: { bubbles: 12, rubPerBubble: 300, rubLineAt: 99, rinseMs: 1200 },
    chop: { cuts: 6 },
    thread: { pieces: 5, given: 3, reach: 260, pauseMs: 900 },
  },
  /**
   * Stir with the arrow (gameplay round 4; the pancakes and the cake): the arrows turn round at `flipAt` of the stirring;
   * `wobbleAfter`: stirring the other way round (x k) before the bowl's contents wobble (a miss).
   */
  stirArrow: { flipAt: 0.5, wobbleAfter: 160 },
  /**
   * Gameplay round 5, the big-chef level (core/level.ts; level 1 = everything above, unchanged). What level 2 adds to
   * every recipe (recipes/bigChef.ts) and how much tighter its targets are. Never a timer, never a failure: Mom's hint
   * and help come as on level 1.
   * - `cut`: overrides of `cut` (a straighter stroke, closer to the line); `chopExtra`: one more cut per vegetable.
   * - `stirFlips`: every stirring step has the arrows, and they turn round at each of these shares of the stirring.
   * - `findTools`: tools to look over in "find the tool" (pancakes and cake get one too: the wooden spoon).
   * - `order`: Pipa's order in choosing: things in it where a recipe already has an order on level 1 (the others get 2).
   * - `wish.rememberMs`: after Mom has said Pipa's wish, her bubble empties after this long: remember it (a tap on Pipa or
   *   Mom's hint shows it again for `peekMs`). `wish.decorate`: in decorating she wants two kinds, this many of each (by run).
   * - `thread`: the skewers have 6 pieces (the copied skewer ABC ABC when she has three fruits), and a dragged piece must
   *   come a little closer to the stick.
   */
  big: {
    cut: { angle: 26, band: 0.12, vegBand: 0.24, minBand: 90 },
    chopExtra: 1,
    stirFlips: [0.34, 0.67] as readonly number[],
    findTools: 4,
    order: 3,
    wish: { rememberMs: 3500, peekMs: 2500, decorate: [2, 2, 3] as readonly number[] },
    thread: { pieces: 6, reach: 200 },
    /**
     * The recipe challenges (PR A), hard only. `hintAfterMs`: she gets a little longer to work it out before Mom's hand
     * comes (help still `AUTO_AFTER_HINT_MS` after). `spreadCoverage`: sauce or frosting "all the way to the edge".
     * `ovenTargets`: Mom picks one of these each run and says it; she sets the needle on the number she heard.
     * `model`: Mom's picture in decorating counts as copied when each of its things has one of hers within this share
     * of the dish's radius of its spot (any order).
     */
    hintAfterMs: 11000,
    spreadCoverage: 0.88,
    ovenTargets: { pizza: [150, 200, 250], cake: [150, 200, 250], cookies: [100, 150, 200] } as Record<string, readonly number[]>,
    model: { near: 0.25 },
  },
  /** Mom's help (after the idle hint): the pace of her own presses, rubs and strokes. */
  /**
   * Pipa's wishes (the gameplay round: a small challenge for a 4-5-year-old, never a test). Her thought bubble shows
   * what she would like: in choosing, `chooseItems` things to find among the options; in decorating, `decorateCount`
   * of one thing to put on (Mom says the number). Both grow with how often this recipe has been played on this device
   * (the run's number: index 0 = the first run; past the end, the last value). Nothing happens if she does otherwise.
   */
  wish: { chooseItems: [1, 2, 2], decorateCount: [3, 4, 4, 5, 5], sayAfterMs: 900 },
  /** Pipa's tastes when she eats: at most this many sneezes in one sharing (then she just giggles). */
  taste: { maxSneezes: 2 },
  /**
   * The guests round: before the sharing she picks who comes to eat (one of three badges). With no pick for
   * `bringAfterMs`, Pipa brings one (at random). The turtle dozes off after `napAfter` bites (or her favourite) and
   * floats `napBubbles` sleep bubbles; a bite coming near wakes her.
   */
  guests: { bringAfterMs: 9000, napAfter: 3, napBubbles: 3 },
  /**
   * The puzzle from a memory-book photo (research/puzzle-spec.md). `grids`: columns x rows, the first puzzle on this
   * device first, the last one from then on (4, 6, 9, 12 pieces). `snap`: a piece let go this close to its place
   * (times the cell's shorter side) clicks in. `ghost`: how strongly the picture shows on the board under the pieces.
   * `trayMax`: the largest size a waiting piece is shown at (1 = its size on the board).
   */
  puzzle: { grids: [[2, 2], [3, 2], [3, 3], [4, 3]] as readonly (readonly [number, number])[], snap: 0.55, ghost: 0.3, trayMax: 0.9, helpMs: 900 },
  /**
   * The garden (GardenScene, research/new-stage-2-spec.md). `waterMs`: watering one plant (held over it) until it is a young
   * plant (the sprout at `sproutAt` of it). `cloudPush`: how far she moves the cloud before it drifts off on its own (a tap
   * pushes it `cloudTap`). `pull`: how far up a carrot is pulled (times its root) before it comes out. `perPlant`: fruit on a
   * grown tomato or strawberry plant (carrots: `carrotsPerPlant`). `reach`: a thing let go this near its target counts.
   * Level 2 (`hard`, garden round 2): a weed in every hole to pull first (`weedPull` x its root), `waterMs` of water per
   * plant, a plant that has had its water makes a puddle and droops while more is poured on it (full after `puddleMs`; it
   * soaks away by itself in `drainMs`), a second cloud, and a bunny that wants one of `bunnyFoods` things.
   */
  garden: {
    waterMs: 2200, sproutAt: 0.35, cloudPush: 260, cloudTap: 90, pull: 0.75, perPlant: 3, carrotsPerPlant: 2, reach: 230, helpMs: 1100,
    hard: { waterMs: 3000, weedPull: 0.7, puddleMs: 700, drainMs: 1400, clouds: 2, bunnyFoods: 3, seeds: [2, 1] as readonly [number, number], caterpillar: true, leaves: 2, emptyTaps: 3 },
    /**
     * Garden round 3 (both levels; each visit is drawn at random). `rainChance`: a rainy day (the rain cloud waters the
     * mounds while she moves it over them, then she pushes it off the sun; a rainbow), else the watering can. Then one of
     * two visitors: the birds and the scarecrow (`scarecrowChance`; always with carrots, which have no flowers) or the
     * butterfly that turns each flower into fruit. `birds`: how many land on the mounds. `sunTaps`: taps on the sun that
     * grow the plants a stage each (the last brings the fruit, or the flowers for the butterfly). `bflyReach`: the
     * butterfly let go (or dragged) this near a flower visits it.
     */
    rainChance: 0.5, scarecrowChance: 0.5, birds: 3, sunTaps: 3, bflyReach: 150,
    /**
     * Challenge round (research/challenge-spec.md, both levels). `unripe` [easy, hard]: fruit per plant still green (a
     * carrot: a small top) at picking; one dragged to a basket floats back ("Not ripe yet!", a miss); a tap on the sun
     * ripens them all (`ripenMs`). `pipaCount`: Pipa's bubble wants this many of the fruit (by visit: first, second,
     * then on), counted into the basket; only where Pipa is on screen. Level 2 (`hard`): `seeds` = seeds in the first and
     * the second packet (two kinds, two baskets to sort into at picking); `caterpillar`: after the sun a caterpillar hides
     * under one of `leaves` leaves per plant (a miss every `emptyTaps` empty leaves); she carries it to the jar.
     */
    unripe: [1, 2] as readonly [number, number], ripenMs: 1000, pipaCount: [2, 3, 4] as readonly number[],
  },
  /**
   * The market (MarketScene, research/minigames-spec.md). `listItems`: pictures on each list at level 1 / 2 by visit (level
   * 2: one of them twice, `pair`); `rounds` lists (the second is Pipa's). Level 2's paper list folds `foldAfterMs` after it
   * shows and a tap opens it for `peekMs`. `slot`: the narrowest a crate may be (world units x k; 3-5 in a row), `itemH`
   * the tallest a good is drawn. `tapMove`: a press that moves less than this is a tap (the good goes in by itself);
   * `reach`: a good let go this near the basket goes in.
   */
  market: {
    listItems: [[3, 3, 4], [4]], pair: true, pairEasyFrom: 2, rounds: 2, foldAfterMs: 4200, peekMs: 3000, slot: 215, itemH: 180, tapMove: 40, reach: 220, helpMs: 1100,
    /**
     * Market round 2 (every visit, in a shuffled order between the two lists, then paying). `guestWants`: what the visitor
     * at the stall wishes for at level 1 / 2. `mixed`: things in the mixed-up box (2 rows of 3) and how many do not belong
     * at level 1 / 2 (level 2's look alike: a strawberry among tomatoes). `price`: the coins to pay at level 1 / 2 (from,
     * to); level 1 fills a chalk circle per coin from Mom's purse, level 2 shows the price as dice dots and circles for a
     * big coin (2) and a small one (1) under the slate (see below).
     */
    guestWants: [1, 2], mixed: { items: 6, odd: [1, 2] }, price: [[2, 4], [4, 7]],
    /**
     * More challenge (research/challenge-spec.md, section 3). `listItems` is per visit now (`[easy by visit, hard by visit]`,
     * the last value holds for later visits); on easy Pipa's list has one pair from visit `pairEasyFrom` (0-based: the
     * third visit). Hard (`pair`): one thing twice on both lists, as before. `weigh` (both levels, a part in the shuffled
     * middle): how many of one good balance the scale, (from, to) per level; each one tips the beam by `weighTilt`
     * degrees x (1 / n) from `weighTilt` down to level; at the number it is level and waits `weighSettleMs` for one too
     * many (it tips the other way, the extra slides back, a miss) before the part ends. `catNeed`: on hard one of the two
     * lists is a kind (green, grows on a tree, round) and needs this many things of it. Hard paying (`price` [4, 7]): big
     * coins worth 2 and small ones worth 1 onto circles of their size: floor((n - 1) / 2) big circles, the rest small.
     */
    weigh: [[2, 3], [3, 5]], weighTilt: 12, weighSettleMs: 1600, catNeed: 2,
  },
  /**
   * Washing up (DishesScene, research/minigames-spec.md). `dishes`: how many at level 1 / 2. `scrub`: finger travel on a
   * dish (world units x k) to wash it clean at level 1 / 2; a bubble every `bubbleEvery`. `reach`: a dish let go this
   * near its place on the rack goes there (or, near a wrong one, back to the sink).
   * Challenge round (research/challenge-spec.md, both levels unless said): `dry` the towel's travel on a rinsed dish
   * before it may go on the rack (a drop flies off every `dropEvery`). One dish in `spotEvery` has `spots` stubborn spots
   * (easy / hard) the finger cannot wash (after `spotFinger` of finger rubbing on one Mom says "Try the sponge!"); the
   * sponge takes one off after `spotRub` on it. Hard: the plates come in `sizes` sizes (`sizeScale`), and once the rack
   * is full she stacks them by the empty stack's place, the biggest first; then Pipa wants one dish from the rack (a dish
   * let go within `pipaReach` of her mouth goes to her).
   */
  dishes: {
    dishes: [4, 6], scrub: [1500, 2200], bubbleEvery: 90, reach: 150, helpMs: 1100, scrubMs: 2200,
    dry: [600, 900], dropEvery: 110, dryMs: 1800, spotEvery: 3, spots: [1, 2], spotFinger: 500, spotRub: 260,
    sizes: [1, 3], sizeScale: [1, 0.85, 0.7], pipaReach: 260,
  },
  /**
   * The art corner (ArtScene, research/drawing-stages-spec.md). Distances are world units x k, [level 1, level 2] where two.
   * `brushR` the crayon's radius; a sparkle every `sparkleEvery` of stroke; `grid` coverage cells across the sheet.
   * Trace: a stroke within `traceBand` x the sheet's short side (at least `traceMin`) of the outline counts and glows;
   * `checkpoints` points per picture, `traceDone` of them lit (and every part at least `partDone`) finishes it.
   * Dots: `dotTouch` touch radius, `dotR` drawn radius (level 2 bigger: it carries the dice pips). Colour: `fillMs` the
   * paint spreading. Mirror: `mirrorInk` of the shape covered before the done button. Steam: `steamClear` of the glass
   * clear (level 1), a thing is found when `findClear` of its box is clear, wiped glass fogs over again after `refogMs`
   * (level 2). Idle: free drawing (mirror) waits `freeHintMs` / `freeHelpMs`. `aliveMs`: the picture coming alive.
   * Challenge round (research/challenge-spec.md): `traceDir` the trace follows its arrows (level 2): ink glows and lights
   * only moving within `traceAngle` degrees of the arrows' way, from the lit front (at most `traceGap` checkpoints
   * ahead); `traceWrong` of travel the other way in one stroke is a wrong stroke (three: Mom's hand shows the way).
   * Dots on level 2: Mom says the number; the right dot glows after `dotsGlowAfter` misses. Stamps: `stampTouch` a
   * stamp's touch radius, `stampScale` its size in the column (x k, at most), `stampMs` its press.
   */
  art: {
    brushR: 22, brushShare: 0.024, sparkleEvery: 160, grid: 24,
    traceBand: [0.09, 0.06], traceMin: [70, 55], checkpoints: 24, traceDone: [0.75, 0.85], partDone: 0.5,
    dotTouch: 160, dotR: [32, 44], fillMs: 450, mirrorInk: [0.25, 0.35], steamClear: 0.6, findClear: 0.4, refogMs: 9000,
    freeHintMs: 15000, freeHelpMs: 15000, aliveMs: 2500, helpMs: 1300,
    traceDir: [false, true], traceAngle: 50, traceGap: 1, traceWrong: 90, dotsGlowAfter: 3,
    stampTouch: 120, stampScale: 0.9, stampMs: 420,
  },
  /**
   * The clinic (ClinicScene; round 3, research/clinic-doctor-games.md). Distances are world units x k, [little, big] where
   * two. `patients` per visit; `reach` how near a tool's working point must come to a target; `rub` the finger's travel
   * that cleans one target (a germ, a tear, wax; the cream: `rubOne` for the one place); `timeMs` holding a tool on a
   * target (the spray on a food bit or dirt, the thermometer, the ice pack, the tissue, listening, the warm bottle);
   * `dripMs` between two drops; `findR` how near the magnifier / light / x-ray must come to show a hidden thing (the
   * stethoscope finds the wheezy spot within `wheezeR`, it is heard louder within `hearR`); `pull` how far a gripped thing
   * is drawn out (`magnetR` / `magnetPull` for the bell); `decoys` the tools on the tray not needed; `dodge` the share of
   * a germ's cleaning at which it hops to another tooth (big chef, once); `helpMs` Mom's hand reaching for the target;
   * `problems` how many problems each patient brings (round 4: their cards float beside her, a tap on one starts it).
   */
  clinic: {
    patients: 3, reach: 120, rub: [240, 300], rubOne: [700, 900], timeMs: [650, 800], holdMs: [1500, 1800], dripMs: 520,
    findR: 95, wheezeR: 70, hearR: 330, pull: 170, magnetR: 150, magnetPull: 240, decoys: [1, 2], dodge: 0.5, helpMs: 1100,
    zoomMax: 1.6, problems: [2, 2],
  },
  /**
   * The care rooms next door (round 5, part 2; scenes/ClinicCare.ts): the third thing for every patient, in her own room
   * (core/care.ts). [easy, hard]. Distances are world units x k. `slideMs` the screen's slide to the room.
   */
  care: {
    slideMs: 520,
    // medicine: taps on the bottle to shake it, spoons of it (Mom counts on hard), the pour
    shakes: [3, 3], spoons: [1, 2], pourMs: 1100,
    // bath: bubbles made (one per `foamEvery` of rubbing), the shower takes one off every `rinseMs` held over her,
    // the towel's rubbing on her head
    foam: [7, 9], foamEvery: 150, rinseMs: 320, towel: [800, 1000],
    // bandage: turns of the roll round the limb (Mom counts), how far from its centre the finger may go round;
    // hard: the arrows' way only, `wrongTurn` radians the other way wobble it once
    turns: [4, 6], turnR: [40, 330], wrongTurn: 1.4,
    // polish: teeth to polish, rubbing each
    teeth: [4, 8], polish: [260, 320],
    // the eye chart: rounds, shapes on the tray
    rounds: [3, 3], shapes: [3, 4],
    // rest: the blanket pulled up (share of the way), the nap after the lamp, snacks fed
    blanket: 0.85, napMs: 2400, snacks: [2, 2],
  },
  help: { pressEveryMs: 420, rubMs: 2600, stirMs: 2400, grateMs: 2600, pickGapMs: 150, chopEveryMs: 950, openMs: 1500, tempEveryMs: 1100, peelEveryMs: 900, candleEveryMs: 700, threadEveryMs: 700 },
} as const;

/** How a cut is made on the current level (`cut`, with `big.cut` on the big-chef level). */
export function cutTuning() {
  return isBigChef() ? { ...TUNING.cut, ...TUNING.big.cut } : TUNING.cut;
}

/** How many more a count gets on this run (TUNING.grow): 0 on the first runs, then `step`, then twice `step`. */
export function grown(step: number, runNo: number) {
  return TUNING.grow.fromRun.filter((r) => runNo >= r).length * step;
}

/** Where the stirring arrows turn round on the current level (shares of the stirring). */
export function stirFlips(): readonly number[] {
  return isBigChef() ? TUNING.big.stirFlips : [TUNING.stirArrow.flipAt];
}
