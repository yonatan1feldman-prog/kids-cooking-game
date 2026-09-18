import type { ImageKey } from '../core/assets';

/**
 * A recipe is pure data: an ordered list of steps. Each step names a reusable step
 * type (implemented once in src/steps) plus that type's parameters.
 * A new recipe = a new file here + its card image; no new code unless it needs a new step type.
 */

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
  tool: ImageKey;
  piece: ImageKey;
  /** Pieces that must land before the step completes. */
  count: number;
}

export interface DecorateParams {
  items: ImageKey[];
  tray: ImageKey;
  doneButton: ImageKey;
}

export interface BakeParams {
  closed: ImageKey;
  open: ImageKey;
  bakeMs: number;
  /** Tint multiplied onto the dish when it comes out, e.g. golden. */
  bakedTint: number;
}

export interface FeedParams {
  slice: ImageKey;
  slices: number;
  body: ImageKey;
  eyes: ImageKey;
  mouthOpen: ImageKey;
  mouthClosed: ImageKey;
}

export type StepDef =
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
  steps: StepDef[];
}
