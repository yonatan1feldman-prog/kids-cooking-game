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
  /** Mom's help (after the idle hint): the pace of her own presses, rubs and strokes. */
  help: { pressEveryMs: 420, rubMs: 2600, stirMs: 2400, grateMs: 2600, pickGapMs: 150, chopEveryMs: 950, openMs: 1500, tempEveryMs: 1100 },
} as const;
