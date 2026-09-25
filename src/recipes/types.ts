import type { ImageKey, SoundKey } from '../core/assets';
import type { VoiceKey } from '../core/audio';
import type { VegName } from '../core/vegArt';

/**
 * A recipe is pure data: an ordered list of steps. Each step names a reusable step
 * type (implemented once in src/steps) plus that type's parameters.
 * A new recipe = a new file here + its card image; no new code unless it needs a new step type.
 */

/**
 * Wash hands: a sink with a tap and the child's own hands under it. Tap the tap (the water runs), rub the
 * hands (bubbles grow on them), then the water rinses the bubbles off and the tap closes by itself.
 * Counts: TUNING.wash.
 */
export interface WashParams {
  basin: ImageKey;
  faucet: ImageKey;
  stream: ImageKey;
  hands: ImageKey;
  bubble: ImageKey;
  bubbles: number;
  rubPerBubble: number;
  /** Mom's lines: at the start, part-way through the rubbing, and when it is clean. */
  line: VoiceKey;
  rubLine?: VoiceKey;
  doneLine: VoiceKey;
  /** After this many bubbles she says the rub line. */
  rubLineAt: number;
  rinseMs: number;
  /**
   * What is washed (default 'hands'). 'basket': `hands` is a basket of vegetables standing in the sink (the colander)
   * under the stream; rubbing it throws `bubble`s (water drops) off it and makes the vegetables shine more and more,
   * instead of growing bubbles on it. Without `rubLine` nothing is said part-way.
   */
  target?: 'hands' | 'basket';
}

/**
 * Press: press the food with a finger, again and again; it squashes and springs back each time, a dent
 * shows under the finger, and every few presses it visibly changes to its next state (`stages`, first to
 * last). Knead dough on the board, crush tomatoes in the bowl, mash potatoes, squash cookie dough...
 * Counts: TUNING.knead / TUNING.crush (`pressesPerStage`).
 */
export interface PressParams {
  /** The food's states, first to last (the last one is the result). */
  stages: ImageKey[];
  pressesPerStage: number;
  /**
   * Where the food is: 'board' (on the pizza board in the middle, the board otherwise empty) or 'bowl'
   * (inside the big prep bowl in the middle, the pizza waits aside). With 'bowl', `bowl` gives its layers.
   */
  place: 'board' | 'bowl' | 'over-bowl';
  bowl?: { back: ImageKey; front: ImageKey };
  /**
   * 'board' only: the board the food lies on, drawn by this step on the cutting-board spot (`stage.cutBoard`), and the
   * food's size (x the board's scale / 1.05). Without it the food sits on the recipe's board, 1.6x.
   */
  board?: ImageKey;
  size?: number;
  /**
   * 'over-bowl': the food is held tilted over the big bowl the step before left (a lemon squeezed over the salad), and
   * each press lets `drop`s fall into the bowl. The bowl stays for the next step.
   */
  drop?: ImageKey;
  /** The result waits in the left column (like a filled bin) for a later step, under `handoff` (e.g. 'bin:lettuce'). */
  park?: boolean;
  /** The hollow a press leaves (drawn in code if the file is missing); none for food that doesn't dent (lettuce). */
  dent?: ImageKey;
  /** Colour of the bits that fly on each press (flour, tomato juice). */
  splash: number;
  sound: SoundKey;
  line: VoiceKey;
  /** The result is left for the next step under this key (`run.handoff`), e.g. 'dough-ball' for rolling. */
  handoff?: string;
  /**
   * 'over-bowl' only: how the food is held (its tilt in degrees, default the lemon's; its size x k) and the point in its
   * own frame the drops fall from (default the lemon's lower rim). An egg is held upright and cracked over the bowl.
   */
  overAngle?: number;
  overSize?: number;
  dropFrom?: { x: number; y: number };
  /** 'over-bowl' only: what is left lying on the bowl's contents at the end (the egg's yolk), drawn in code. */
  lands?: BowlExtra;
}

/**
 * Something that lies on the contents of the big bowl across steps (the butter cube, the egg's yolk) until stirring
 * mixes it in: an image, or `yolk` (drawn in code), at `at` in the bowl's frame, its `base` there, `scale` x the bowl's.
 */
export interface BowlExtra {
  key: ImageKey | 'yolk';
  at: { x: number; y: number };
  base?: { x: number; y: number };
  scale: number;
}

/**
 * Stir: a spoon follows the finger inside the bowl; any movement in the bowl counts (no exact circles),
 * and the contents turn smoothly into the result. At the end the bowl goes to the left column and becomes
 * the next step's source (`handoffAs`, e.g. the sauce bowl for spreading). Distance: TUNING.stir.
 */
export interface StirParams {
  bowl: { back: ImageKey; front: ImageKey };
  /** Contents before (usually what the step before left in the bowl) and after. */
  from: ImageKey;
  to: ImageKey;
  tool: ImageKey;
  distance: number;
  splash: number;
  line: VoiceKey;
  /** The next step's bowl image; the stirred bowl turns into it in the left column. */
  handoffAs?: ImageKey;
  /** The tool's point that follows the finger (default: the wooden spoon's bowl), and its sound (default squish). */
  toolAnchor?: { x: number; y: number };
  sound?: SoundKey;
  /** The bowl stays in place for the next step (with `to` in it), instead of moving aside. */
  keep?: boolean;
  /** Stages between `from` and `to` (the cookie batter: dry, streaky, crumbly, smooth); what lies on it mixes in first. */
  via?: ImageKey[];
  /**
   * Round 9 (the soup): the pot cooks on a stove. First a tap on the knob lights it (`line`, the flame under the pot,
   * the click), and only then does the stirring start. `knobAt` and `flameAt` are points of the bowl's own frame.
   */
  stove?: {
    knobOff: ImageKey;
    knobOn: ImageKey;
    flame: ImageKey;
    knobAt: { x: number; y: number };
    flameAt: { x: number; y: number };
    line: VoiceKey;
  };
  /** The bake loop plays while it cooks, and steam rises from the pot as she stirs. */
  cook?: boolean;
  /** Said when the stirring is done ("It smells so good!"), before the step ends. */
  doneLine?: VoiceKey;
}

/**
 * Grate (or any "rub it on a tool"): a block follows the finger; rubbing it on the tool drops pieces, the
 * pile under the tool grows through `piles`, and the block gets smaller. The pile is left for the next step
 * (a handful sprinkled from it). Distance: TUNING.grate.
 */
export interface GrateParams {
  tool: ImageKey;
  block: ImageKey;
  piles: ImageKey[];
  /** The little piece that falls while rubbing. */
  piece: ImageKey;
  distance: number;
  shredEvery: number;
  sound: SoundKey;
  line: VoiceKey;
}

export interface RollParams {
  /** Unflattened dough. */
  ball: ImageKey;
  /** Flattened dough; becomes the dish base for the following steps. */
  flat: ImageKey;
  tool: ImageKey;
  /** How much rubbing is needed, in widths of the dough traveled by the finger. */
  rubWidths: number;
  /** Mom's line (default vo-roll), and the flat dough's size x k (default 1; the cookie sheet is smaller than its frame). */
  line?: VoiceKey;
  size?: number;
}

/**
 * Cutters (round 7): the rolled sheet in the middle, big cutters on the left. A tap on a cutter picks it (it lifts,
 * glows, Mom says its name); a tap anywhere on the dough presses it into the free slot nearest the finger: the cutter
 * comes down and presses (stamp, Mom counts) and a cookie of its shape stays on the sheet. She can change the cutter
 * between presses; a tap on the dough before picking one uses the next one. When every slot has a cookie they hop onto
 * the baking tray (the same slots), which becomes the dish. Cookies, biscuits, sandwiches, anything stamped: the same
 * type, other pictures. Counts: the slots.
 */
export interface CutterParams {
  cutters: { cutter: ImageKey; cookie: ImageKey; name: VoiceKey }[];
  /** The sheet (the dish's base, left by rolling) and the tray that replaces it; one frame, the same `slots`. */
  sheet: ImageKey;
  tray: ImageKey;
  slots: readonly (readonly [number, number])[];
  /** The sheet's size x k (as rolled), and the cutter's press point in its frame (on the slot centre at the sheet's scale). */
  size: number;
  press: { x: number; y: number };
  line: VoiceKey;
  /** Said with Mom's demo ("Press it into the dough!"), and when the cookies go onto the tray. */
  stampLine: VoiceKey;
  trayLine: VoiceKey;
  sound: SoundKey;
  /** Ms of the press (the cutter comes down, presses, goes back up). */
  pressMs: number;
}

export interface SpreadParams {
  /** Visual prop shown next to the dish (not interactive). */
  source: ImageKey;
  /** Stamp painted under the finger. */
  blob: ImageKey;
  /** 0..1 share of the dish that must be covered. */
  coverage: number;
  /**
   * Round 9 (the cake's frosting): the blob is drawn white and tinted with the colour she chose (`tint` on the
   * picked option of the `choose` step before this one), so one blob serves pink, white and chocolate.
   */
  tintFrom?: 'chosen';
}

export interface SprinkleParams {
  /** What the finger holds: a shaker (turned upside down over the dish) or a handful (held as it is). */
  tool: ImageKey;
  toolKind?: 'shaker' | 'handful';
  /** Handful only: the pile it is taken from, resting in the left column (left by the step before). */
  source?: ImageKey;
  piece: ImageKey;
  /** Pieces that must land before the step completes. */
  count: number;
  /** Mom's line (default vo-cheese) and the shake sound (default sprinkle). */
  line?: VoiceKey;
  sound?: SoundKey;
  /**
   * 'bowl': sprinkled into the big bowl the step before left (a pinch of salt on the salad): the shaker is held by its
   * `holes` over the finger, tipped over, and the grains (drawn in code, `piece` unused) fall into the bowl and melt in.
   * Every shake counts one of `count`. The bowl stays for the next step.
   */
  into?: 'dish' | 'bowl';
  holes?: { x: number; y: number };
}

/**
 * Choose: several things stand on the counter, each on its bin (the whole vegetables, a closed can, a closed jar).
 * A tap picks one (it hops, pop, Mom counts "One!", "Two!"...), another tap puts it back. When `pick` are chosen
 * the step goes on by itself after a short pause. Each chosen option's `prep` step (cut it, open and pour it) is
 * then run, in the order she picked them, and decorating offers exactly the chosen toppings. Counts: TUNING.choose.
 */
export interface ChooseOption {
  /** A short name (the dev URL `?pick=tomato,corn,olive` and the tests use it). */
  id: string;
  /** What stands on the counter: the whole vegetable, the closed can or jar. */
  image: ImageKey;
  /** The topping it becomes: its bin in decorating (and on the bin its prep step fills). */
  topping: ImageKey;
  /**
   * How it is prepared once chosen: one step, or several in order (round 9: the soup peels a carrot before it
   * chops it, so carrot and potato carry a `peel` step in front of their `chop`).
   */
  prep?: StepDef | StepDef[];
  /** Mom says its name when it is picked (a newer name may cut the one playing). Without it she counts. */
  name?: VoiceKey;
  /** Round 9 (the cake's frosting): the colour this pick stands for, for a later step that is tinted by it. */
  tint?: number;
}

export interface ChooseParams {
  options: ChooseOption[];
  pick: number;
  /** The bin each option stands on. */
  bin: ImageKey;
  line: VoiceKey;
  /** Pause after the last pick before the step goes on (so she sees her three). */
  pauseMs: number;
}

/**
 * Chop: the whole vegetable lies on the cutting board; the knife follows the finger (by its blade tip). Every short
 * move down over the vegetable cuts the next slice, wherever the finger is sideways: the code cuts from right to left
 * at a fixed slice width inside the body, the cut face (`inside`, fitted to the body's measured profile) shows on the
 * cut line, a slice drops onto a pile, chop, and Mom counts. After `cuts` cuts the end that is left becomes the last
 * slice, and the slices go into the topping's bin (left for decorating). Counts: TUNING.chop.
 */
/**
 * Peel (round 9, `PeelStep`): the vegetable lies on the cutting board covered by a layer of peel (`skin`, drawn in the
 * whole vegetable's own viewBox so it sits on it exactly). The peeler follows the finger; every `minSwipe` of travel
 * along the vegetable, in either direction, takes off one of `strips` bands: it disappears, a curl flies off, the
 * sound plays. When they are all off Mom says `doneLine` and the step ends. She cannot fail. Counts: TUNING.<recipe>.peel.
 */
export interface PeelParams {
  /** Which measured body profile (core/vegArt.ts) the whole image has. */
  veg: VegName;
  whole: ImageKey;
  /** The peel over it: the same viewBox as `whole`, aligned to its body. */
  skin: ImageKey;
  board: ImageKey;
  peeler: ImageKey;
  /** One curl of peel, flying off on each stroke. */
  strip: ImageKey;
  /** How many strokes clean it. */
  strips: number;
  /** Finger travel along the vegetable for one strip (world units at k = 1; forgiving). */
  minSwipe: number;
  /** Colour of the bits that fly on each stroke (default: a warm carrot orange). */
  splash?: number;
  line: VoiceKey;
  /** "All peeled!", at the end. */
  doneLine: VoiceKey;
  sound: SoundKey;
}

export interface ChopParams {
  /** Which measured body profile (core/vegArt.ts) the whole image has. */
  veg: VegName;
  whole: ImageKey;
  slice: ImageKey;
  inside: ImageKey;
  board: ImageKey;
  knife: ImageKey;
  cuts: number;
  minSwipe: number;
  /** Colour of the drops that fly on each cut. */
  juice: number;
  /** The bin the slices go into, and the topping shown on it (its bin in decorating). */
  bin: ImageKey;
  topping: ImageKey;
  line: VoiceKey;
  /** Said once per recipe run, before the first cut ("Be careful with the knife!"). */
  careful?: VoiceKey;
}

/**
 * Open and pour: a closed can or jar stands on the counter. Can: an upward swipe on the lid, or `taps` taps, opens it
 * (the lid flies aside). Jar: rubbing sideways on the lid turns it until it opens (the lid comes off and goes down).
 * Then she drags the open can or jar over the bowl: it tips over by itself and the pieces pour into the bowl (between
 * its back and front layers) for as long as she holds it there, until `pourMs` of pouring is done. The contents go
 * into the topping's bin (left for decorating). Counts: TUNING.open, TUNING.pour.
 */
export interface OpenPourParams {
  /** 'open': nothing to open (an oil bottle), only the pouring; also for pouring several things in (`sources`). */
  kind: 'can' | 'jar' | 'open';
  closed: ImageKey;
  open: ImageKey;
  /** The lid, the opening sound and the opening line (not for `open`). */
  lid?: ImageKey;
  sound?: SoundKey;
  openLine?: VoiceKey;
  pourLine: VoiceKey;
  bowl: { back: ImageKey; front: ImageKey };
  /** What pours out (one piece of the topping), or `fx-dot` (a dot drawn in code, see `pieceTint`). */
  piece: ImageKey | 'fx-dot';
  bin?: ImageKey;
  topping?: ImageKey;
  taps: number;
  swipe: number;
  twist: number;
  pourMs: number;
  /** The container's mouth in its file (default: the can's or the jar's top), and how far it tips (default 112). */
  mouth?: { x: number; y: number };
  tilt?: number;
  /** The pouring sound (default pour). */
  pourSound?: SoundKey;
  /** The piece's tint and size (x the default), e.g. `fx-dot` tinted as flour (drawn in code, no art). */
  pieceTint?: number;
  pieceSize?: number;
  /** Nothing pours: held over the bowl, the thing itself drops in and stays on the contents (a butter cube). */
  dropIn?: BowlExtra;
  /**
   * The big bowl stays across steps (the salad bowl: taken from the step before, left for the next), and its contents
   * rise through `fills` as the things are poured in; the pieces melt into them instead of piling up. Without it the
   * step brings its own bowl and puts the contents into the topping's bin.
   */
  keep?: { fills?: ImageKey[]; spot?: 'pourBowl' };
  /**
   * Pour several things in, one after another, in any order (the salad into its bowl): what the steps before left
   * waiting (`run.handoff` keys; `'chosen'` = the bins of what she chose, their `topping` as the piece). Each is dragged
   * over the bowl and pours for `pourMs`.
   */
  sources?: ({ handoff: string; image: ImageKey; piece: ImageKey; tilt?: number } | 'chosen')[];
  /**
   * Pour the kept big bowl itself (the blender jar, with `keep`) into `count` glasses standing on its left: she drags the
   * jar over a glass, it tips (`tilt`) and a stream (`piece`, `pieceTint`) fills that glass from the bottom up (`full`
   * revealed over `empty`, ART.smoothie glass geometry) for `pourMs`, then the next. The full glasses are her pieces to
   * share (`run.pieces`) and the photo's picture (MADE_KEY).
   */
  glasses?: { empty: ImageKey; full: ImageKey; count: number };
}

/**
 * Blend (BlendStep): the kept jar (`bowl` layers, contents `from` if it is new) stands on its base with the big button;
 * put the `lid` on, then run the motor with the button (held, or tapped: each tap runs at least `tapMs`) until it has run
 * `runMs` in all; the contents go through `stages`. Geometry: ART.smoothie (the mouth, the lid's seat, the button).
 */
export interface BlendParams {
  bowl: { back: ImageKey; front: ImageKey };
  from: ImageKey;
  lid: ImageKey;
  buttonOff: ImageKey;
  buttonOn: ImageKey;
  stages: ImageKey[];
  runMs: number;
  tapMs: number;
  /** "Put the lid on tight!", then "Press the big button!", and at the end "All smooth!". */
  lidLine: VoiceKey;
  line: VoiceKey;
  doneLine: VoiceKey;
  lidSound: SoundKey;
  /** The colour of the bits that whirl up. */
  tint: number;
}

/**
 * Pour and flip (FlipStep): `stove` first (tap the knob: lit, the flame under the pan), then `count` times: drag the
 * `ladle` over the `pan` and hold it (`pourMs` in all: the puddle grows through `puddles`, the sizzle loop), the
 * `bubbles` after `cookMs`, a swipe up of `minSwipe` flips it (`golden`), onto the stack, Mom counts, `moreLine`.
 * At the end the big `plate` is the recipe's board and the dish's base is `golden` at `baseSize` (x k) on it.
 * Geometry: ART.pancakes.
 */
export interface FlipParams {
  stove?: { top: ImageKey; knobOff: ImageKey; knobOn: ImageKey; flame: ImageKey; line: VoiceKey; sound: SoundKey };
  pan: ImageKey;
  ladle: ImageKey;
  puddles: ImageKey[];
  bubbles: ImageKey;
  golden: ImageKey;
  plate: ImageKey;
  baseSize: number;
  batterTint: number;
  count: number;
  pourMs: number;
  cookMs: number;
  minSwipe: number;
  flipSound: SoundKey;
  /** The first time only: the ladle, the bubbles, "Now flip it!" and, after it lands, "Whee! Golden brown!". */
  ladleLine: VoiceKey;
  bubblesLine: VoiceKey;
  flipLine: VoiceKey;
  flipDoneLine: VoiceKey;
  /** Between pancakes. */
  moreLine: VoiceKey;
}

export interface DecorateParams {
  items: ImageKey[];
  doneButton: ImageKey;
  /** Mom's line (default vo-toppings). */
  line?: VoiceKey;
  /** What an item puts down when it is not itself (the icing tube puts a blob of icing); its size on the dish. */
  places?: Partial<Record<ImageKey, ImageKey>>;
  sizes?: Partial<Record<ImageKey, number>>;
  /**
   * 'cookies': decorating the baked cookies on the tray. Each thing lands on the cookie nearest to where it is let go
   * (inside it). At the end each cookie with what is on it becomes its own picture (for sharing, `run.pieces`), and the
   * whole tray the photo's (MADE_KEY).
   */
  onto?: 'dish' | 'cookies';
}

/**
 * Candles (round 9, `CandlesStep`): `count` candles wait in the left column; she drags each onto the cake and stands
 * it wherever she likes (Mom counts). When they are all up Mom lights them at once (`lightSound`, `wishLine`), and a
 * tap on a flame, or a finger drawn over the flames, puts them out one by one (`blowSound`, a wisp of smoke). All
 * out: `doneLine`, the jingle and stars. She cannot fail at any part. Counts: TUNING.<recipe>.candles.
 */
export interface CandlesParams {
  candle: ImageKey;
  /** The candle art's frame, for its base anchor (ART.cake.candleBase) and flame point. */
  candleFrame: readonly [number, number];
  flame: ImageKey;
  smoke: ImageKey;
  count: number;
  /** The candle's size on top of its bin-column scale. */
  size: number;
  line: VoiceKey;
  wishLine: VoiceKey;
  doneLine: VoiceKey;
  /** Said once, half way through blowing, only if she has stopped ("Keep blowing!"). */
  moreLine?: VoiceKey;
  lightSound: SoundKey;
  blowSound: SoundKey;
  /** Texture key to keep the cake WITH its burning candles in, for the finale's photo (`PhotoParams.madeKey`). */
  capture?: string;
}

export interface BakeParams {
  /** Oven layers sharing one frame: cavity, closed door with a see-through window, open door. */
  inside: ImageKey;
  closed: ImageKey;
  open: ImageKey;
  bakeMs: number;
  /** Tint multiplied onto the dish when it comes out, e.g. golden. */
  bakedTint: number;
  /**
   * Set the temperature first (optional): once the door is closed a big panel shows the needle on `from`; the down and
   * up buttons move it by `step` between `min` and `max` (Mom says each value, the oven glows cooler or warmer), and
   * at `target` the number glows and the start button lights up; its press starts the baking. Nothing ever burns.
   */
  panel?: TempPanel;
  /**
   * A tray instead of a pizza: where it sits in the oven (oven frame) and its size there x the oven's scale; only the food
   * on it (`dish.cookies`) turns golden, not the tray. Without it the pizza fills `ART.ovenPizza`.
   */
  tray?: { x: number; y: number; scale: number };
  /** Put on the oven mitts before taking it out (optional): after the ding the mitts lie on the counter; a tap puts them on. */
  mitts?: { pair: ImageKey; single: ImageKey; line: VoiceKey };
  /**
   * Round 9 (the cake): what went in is not what comes out. Once it is on the counter the dish's base becomes `base`
   * (the baked cake instead of the pan of batter) and, with `board`, it is standing on that (its plate). The steps
   * after it (spread, decorate, candles, share, photo) then work on it exactly as they do on the pizza.
   */
  becomes?: { base: ImageKey; board?: ImageKey; size?: number };
  /**
   * Round 9 (the cake): what goes IN. The step before poured the batter into the pan and left the pan as a picture,
   * not as the dish, so the bake step makes it the dish's base before carrying it to the oven.
   */
  startsAs?: { base: ImageKey; size?: number };
}

export interface TempPanel {
  panel: ImageKey;
  needle: ImageKey;
  glow: ImageKey;
  up: ImageKey;
  down: ImageKey;
  startOff: ImageKey;
  startOn: ImageKey;
  from: number;
  step: number;
  min: number;
  max: number;
  target: number;
  /** "Let's set the oven", "A bit hotter!", "Oh, that's too hot!", "That's just right!". Values: temp-<value>. */
  line: VoiceKey;
  more: VoiceKey;
  hot: VoiceKey;
  done: VoiceKey;
}

export interface FeedParams {
  /** Fallback slice art, used only if capturing the child's own pizza failed. */
  slice: ImageKey;
  slices: number;
}

/**
 * Share: her pizza is cut into slices on the board and she shares them between Mom and Pipa: she drags each slice to
 * either one's mouth. The one a slice comes near is surprised and opens wide; she chews, happy. Every way of sharing is
 * fine (all to one of them too); the one who gets nothing just keeps smiling. The idle hint carries a slice to the one
 * who has had fewer. The first slice for each gets its line.
 */
export interface ShareParams {
  /** Fallback slice art, used only if capturing the child's own pizza failed. */
  slice: ImageKey;
  slices: number;
  line: VoiceKey;
  /** "A slice for Mommy!" then Mom's "Mmm, yummy!"; "A slice for Pipa!". */
  forMom: VoiceKey;
  momYum: VoiceKey;
  forPet: VoiceKey;
  /** The chewing sound (default munch). */
  eat?: SoundKey;
  /**
   * Portions instead of slices (a salad): `count` portions (`image`, held by `anchor`) lie over the big bowl the step
   * before left; a serving `bowl` stands in front of Mom and one in front of Pipa, and a portion let go near one lands
   * in it (`fill` shows in the bowl) and that one eats.
   */
  portions?: { image: ImageKey; anchor: { x: number; y: number }; count: number; bowl: ImageKey; fill: ImageKey };
  /**
   * Whole pieces instead of slices (the cookies): each piece decorating left (`run.pieces`, her own cookie with its
   * icing) is lifted off the tray and carried upright to a mouth.
   */
  pieces?: boolean;
  /** The slices are cut from this part of the dish's radius (the pancake, smaller than a pizza: 290 / 350). Default 1. */
  cutRadius?: number;
}

/**
 * The finale with a photo (the last step of a recipe): "Let's take a picture!", the camera and a short white flash,
 * then the photo frame in the middle with her own finished dish in its window (as it came out of the oven, before it
 * was cut), then "We made it together!", the cheer and the stars (never over a face or the photo), "Bye bye!", home.
 */
export interface PhotoParams {
  frame: ImageKey;
  /** The kitchen square behind the dish in the photo (a crop of the background). */
  backdrop: ImageKey;
  line: VoiceKey;
  finale: VoiceKey;
  bye: VoiceKey;
  /** The photo shows this bowl (back, contents, front: the salad) instead of her pizza on its board. */
  bowl?: { back: ImageKey; fill: ImageKey; front: ImageKey };
  /** With `made`, show this texture instead of MADE_KEY (the cake with its candles still lit, kept by `candles`). */
  madeKey?: string;
  /** The photo shows her whole dish as decorated (MADE_KEY: the cookies on their tray), no board. */
  made?: boolean;
}

/** Character layers sharing one frame, stacked body -> eyes -> mouth. She stays for the whole recipe. */
export interface CharacterDef {
  body: ImageKey;
  eyesOpen: ImageKey;
  eyesBlink: ImageKey;
  eyesSurprised: ImageKey;
  eyesHappy: ImageKey;
  mouthClosed: ImageKey;
  mouthOpen: ImageKey;
  mouthChew: ImageKey;
  /** Drawn behind the body, standing on the frame's top edge (the giraffe's neck, going on up out of the screen). */
  back?: ImageKey;
}

export type StepDef =
  | { type: 'wash'; params: WashParams }
  | { type: 'knead'; params: PressParams }
  | { type: 'crush'; params: PressParams }
  | { type: 'stir'; params: StirParams }
  | { type: 'grate'; params: GrateParams }
  | { type: 'roll'; params: RollParams }
  | { type: 'spread'; params: SpreadParams }
  | { type: 'sprinkle'; params: SprinkleParams }
  | { type: 'decorate'; params: DecorateParams }
  | { type: 'bake'; params: BakeParams }
  | { type: 'feed'; params: FeedParams }
  | { type: 'choose'; params: ChooseParams }
  | { type: 'chop'; params: ChopParams }
  | { type: 'open-pour'; params: OpenPourParams }
  | { type: 'share'; params: ShareParams }
  | { type: 'peel'; params: PeelParams }
  | { type: 'candles'; params: CandlesParams }
  | { type: 'photo'; params: PhotoParams }
  | { type: 'cutters'; params: CutterParams }
  | { type: 'blend'; params: BlendParams }
  | { type: 'flip'; params: FlipParams };

export type StepType = StepDef['type'];

/** A chosen option's prep steps, in order (one step, several, or none). */
export const prepSteps = (o: ChooseOption): StepDef[] => (o.prep ? (Array.isArray(o.prep) ? o.prep : [o.prep]) : []);

export interface Recipe {
  id: string;
  /** Card shown on the home screen, and Mom's line when it is tapped ("Let's make a pizza!"). */
  card: ImageKey;
  pickLine: VoiceKey;
  /** Board the dish sits on for the whole recipe (none: nothing is carried on a board, e.g. the salad). */
  board: ImageKey | null;
  /** Who stands on the right, watches, cheers each step and eats the result. */
  character: CharacterDef;
  steps: StepDef[];
}
