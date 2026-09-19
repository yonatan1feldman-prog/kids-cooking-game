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
  rubLine: VoiceKey;
  doneLine: VoiceKey;
  /** After this many bubbles she says the rub line. */
  rubLineAt: number;
  rinseMs: number;
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
  place: 'board' | 'bowl';
  bowl?: { back: ImageKey; front: ImageKey };
  /** The hollow a press leaves (drawn in code if the file is missing). */
  dent: ImageKey;
  /** Colour of the bits that fly on each press (flour, tomato juice). */
  splash: number;
  sound: SoundKey;
  line: VoiceKey;
  /** The result is left for the next step under this key (`run.handoff`), e.g. 'dough-ball' for rolling. */
  handoff?: string;
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
}

export interface SpreadParams {
  /** Visual prop shown next to the dish (not interactive). */
  source: ImageKey;
  /** Stamp painted under the finger. */
  blob: ImageKey;
  /** 0..1 share of the dish that must be covered. */
  coverage: number;
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
  /** How it is prepared once chosen (a `chop` or `open-pour` step). */
  prep?: StepDef;
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
  kind: 'can' | 'jar';
  closed: ImageKey;
  open: ImageKey;
  lid: ImageKey;
  sound: SoundKey;
  openLine: VoiceKey;
  pourLine: VoiceKey;
  bowl: { back: ImageKey; front: ImageKey };
  /** What pours out (one piece of the topping). */
  piece: ImageKey;
  bin: ImageKey;
  topping: ImageKey;
  taps: number;
  swipe: number;
  twist: number;
  pourMs: number;
}

export interface DecorateParams {
  items: ImageKey[];
  doneButton: ImageKey;
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
  /** Put on the oven mitts before taking it out (optional): after the ding the mitts lie on the counter; a tap puts them on. */
  mitts?: { pair: ImageKey; single: ImageKey; line: VoiceKey };
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
  | { type: 'share'; params: ShareParams };

export type StepType = StepDef['type'];

export interface Recipe {
  id: string;
  /** Card shown on the home screen. */
  card: ImageKey;
  /** Board the dish sits on for the whole recipe. */
  board: ImageKey;
  /** Who stands on the right, watches, cheers each step and eats the result. */
  character: CharacterDef;
  steps: StepDef[];
}
