import type { ImageKey, SoundKey } from '../core/assets';
import type { VoiceKey } from '../core/audio';

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
}

export interface FeedParams {
  /** Fallback slice art, used only if capturing the child's own pizza failed. */
  slice: ImageKey;
  slices: number;
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
  | { type: 'roll'; params: RollParams }
  | { type: 'spread'; params: SpreadParams }
  | { type: 'sprinkle'; params: SprinkleParams }
  | { type: 'decorate'; params: DecorateParams }
  | { type: 'bake'; params: BakeParams }
  | { type: 'feed'; params: FeedParams };

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
