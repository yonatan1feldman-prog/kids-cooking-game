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

/** Ms of no progress before Mom's hand shows the gesture again (the hint), on every screen and step. */
export const HINT_AFTER_MS = 5000;
/** Further ms of no progress before Mom helps ("Let me help you!", and her hand does it). */
export const AUTO_AFTER_HINT_MS = 10000;
/** A demo never runs longer than this. */
export const DEMO_MAX_MS = 2500;
/** Before a demo, Mom finishes the line she is saying, waiting at most this long. */
export const DEMO_WAIT_MS = 2000;

export const TUNING = {
  /** Wash hands: tap the tap, then rub the hands until the bubbles are there; then the water rinses them. */
  wash: {
    /** Bubbles that grow on the hands before they are rinsed. */
    bubbles: 12,
    /** Rubbing distance (finger travel over the hands) per new bubble. */
    rubPerBubble: 300,
    /** After this many bubbles Mom says "Rub, rub, rub!". */
    rubLineAt: 4,
    /** How long the rinse takes (the bubbles slide off, the water runs, the tap closes). */
    rinseMs: 1500,
  },
  /** Knead: presses on the dough per stage (dough-knead-1 -> 2 -> 3 -> dough-ball: 3 changes). */
  knead: { pressesPerStage: 3 },
  /** Crush: presses on the tomatoes per stage (sauce-stage-0 -> 1 -> 2: 2 changes). */
  crush: { pressesPerStage: 3 },
  /** Stir: finger travel inside the bowl to go from chunky (stage 2) to smooth sauce (stage 3). About 2-3 laps. */
  stir: { distance: 3600 },
  /** Grate: rubbing travel on the grater (up and down counts fully, sideways a third) for the whole block. */
  grate: { distance: 3600, shredEvery: 60 },
  /** Roll: rubbing distance in dough widths. */
  roll: { rubWidths: 5 },
  /** Spread: share of the dough that must be painted (the game fills the rest). */
  spread: { coverage: 0.7 },
  /** Sprinkle: cheese pieces that land before the step is done. */
  sprinkle: { count: 45 },
  /** Choose the toppings: how many she picks, and the pause after the last pick (she sees her three). */
  choose: { pick: 3, pauseMs: 900 },
  /**
   * Chop: cuts per vegetable (the end that is left becomes one more slice), and how far (world units) a finger must
   * move down over the vegetable for one cut: short and forgiving, wherever it is sideways.
   */
  chop: { cuts: 5, minSwipe: 50 },
  /**
   * Open a can or a jar, then pour it into the bowl. Can: `taps` taps on the lid, or one move up of `swipe` units.
   * Jar: sideways rubbing on the lid adds up to `twist` units (a tap counts a quarter of it). Pour: ms of holding the
   * open can or jar over the bowl (the pouring stops when it is moved away and goes on when it comes back).
   */
  open: { taps: 3, swipe: 80, twist: 900 },
  pour: { ms: 2500 },
  /**
   * The oven's temperature: the needle starts at `from`, each press moves it by `step` between `min` and `max`, and
   * baking starts at `target` (the art's panel prints 50-250). Baking: ms in the oven after the start.
   */
  oven: { from: 50, step: 50, min: 50, max: 250, target: 200, bakeMs: 5000 },
  /** Share: slices the pizza is cut into (shared between Mom and Pipa, any way she likes). */
  share: { slices: 6 },
  /**
   * The salad (round 6; aim: 4-5 minutes from the card to home). Wash the vegetables: drops (bursts) of rubbing, as
   * `wash.bubbles`. Tear the lettuce: presses per stage (head -> tear-1 -> 2 -> 3: 3 changes). Chop: cuts per vegetable.
   * Into the bowl: ms of pouring each of the four (the lettuce and her three vegetables). Lemon: presses per stage
   * (3 states: 2 changes). Oil: ms of pouring. Salt: shakes. Mix: finger travel in the bowl. Serve: portions.
   */
  salad: {
    washVeg: { bubbles: 8, rubPerBubble: 300, rubLineAt: 99, rinseMs: 1200 },
    tear: { pressesPerStage: 3 },
    chop: { cuts: 4, minSwipe: 50 },
    transfer: { ms: 1300 },
    lemon: { pressesPerStage: 3 },
    oil: { ms: 1800 },
    salt: { shakes: 5 },
    mix: { distance: 3000 },
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
    egg: { pressesPerStage: 2 },
    stir: { distance: 3600 },
    knead: { pressesPerStage: 3 },
    roll: { rubWidths: 4 },
    cut: { pressMs: 520 },
    oven: { target: 150 },
  },
  /**
   * The smoothie (round 8; aim: 4-5 minutes from the card to home). Wash the fruit: drops of rubbing, as the salad's
   * vegetables. Chop: cuts per fruit. Into the jar: ms of pouring each bin. Milk: ms of pouring. Blend: ms the motor must
   * run in all (holding the button or tapping it: a tap runs it at least `tapMs`). Glass: ms of pouring to fill one glass.
   */
  smoothie: {
    washFruit: { bubbles: 10, rubPerBubble: 300, rubLineAt: 99, rinseMs: 1200 },
    chop: { cuts: 5, minSwipe: 50 },
    transfer: { ms: 1500 },
    milk: { ms: 2200 },
    blend: { runMs: 6000, tapMs: 450 },
    glass: { ms: 2400 },
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
    stir: { distance: 4200 },
    flip: { count: 3, pourMs: 3500, cookMs: 3000, minSwipe: 60 },
    share: { slices: 4 },
  },
  /**
   * The vegetable soup (round 9; aim: 4-5 minutes from the card to home). Wash the vegetables: drops of rubbing, as
   * the salad's. Peel (carrot and potato only): strips per vegetable and the finger travel along it for one strip.
   * Chop: cuts per vegetable. Into the pot: ms of pouring each bin. Water: ms of pouring. Stir: finger travel through
   * the three soup stages. Serve: one ladle per bowl, two bowls.
   */
  soup: {
    washVeg: { bubbles: 10, rubPerBubble: 300, rubLineAt: 99, rinseMs: 1200 },
    peel: { strips: 5, minSwipe: 110 },
    chop: { cuts: 4, minSwipe: 50 },
    transfer: { ms: 1400 },
    water: { ms: 2400 },
    stir: { distance: 4200 },
    serve: { bowls: 2 },
  },
  /** Mom's help (after the idle hint): the pace of her own presses, rubs and strokes. */
  help: { pressEveryMs: 420, rubMs: 2600, stirMs: 2400, grateMs: 2600, pickGapMs: 150, chopEveryMs: 950, openMs: 1500, tempEveryMs: 1100, peelEveryMs: 900 },
} as const;
