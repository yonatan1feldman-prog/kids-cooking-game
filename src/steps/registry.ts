import type { StepDef, StepType } from '../recipes/types';
import { BakeStep } from './BakeStep';
import { DecorateStep } from './DecorateStep';
import { FeedStep } from './FeedStep';
import { RollStep } from './RollStep';
import { SprinkleStep } from './SprinkleStep';
import { SpreadStep } from './SpreadStep';
import { WashStep } from './WashStep';
import type { Step, StepContext } from './Step';

type Factory = (ctx: StepContext, params: never, onDone: () => void) => Step<unknown>;

/** Step type name (as used in recipe files) -> reusable implementation. */
const STEP_TYPES: Record<StepType, Factory> = {
  wash: (c, p, d) => new WashStep(c, p, d),
  roll: (c, p, d) => new RollStep(c, p, d),
  spread: (c, p, d) => new SpreadStep(c, p, d),
  sprinkle: (c, p, d) => new SprinkleStep(c, p, d),
  decorate: (c, p, d) => new DecorateStep(c, p, d),
  bake: (c, p, d) => new BakeStep(c, p, d),
  feed: (c, p, d) => new FeedStep(c, p, d),
};

export function createStep(def: StepDef, ctx: StepContext, onDone: () => void): Step<unknown> {
  return STEP_TYPES[def.type](ctx, def.params as never, onDone);
}
