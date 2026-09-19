import type { StepDef, StepType } from '../recipes/types';
import { BakeStep } from './BakeStep';
import { ChooseStep } from './ChooseStep';
import { ChopStep } from './ChopStep';
import { BlendStep } from './BlendStep';
import { CuttersStep } from './CuttersStep';
import { DecorateStep } from './DecorateStep';
import { FeedStep } from './FeedStep';
import { GrateStep } from './GrateStep';
import { OpenPourStep } from './OpenPourStep';
import { PhotoStep } from './PhotoStep';
import { PressStep } from './PressStep';
import { RollStep } from './RollStep';
import { ShareStep } from './ShareStep';
import { SprinkleStep } from './SprinkleStep';
import { SpreadStep } from './SpreadStep';
import { StirStep } from './StirStep';
import { WashStep } from './WashStep';
import type { Step, StepContext } from './Step';

type Factory = (ctx: StepContext, params: never, onDone: () => void) => Step<unknown>;

/** Step type name (as used in recipe files) -> reusable implementation. */
const STEP_TYPES: Record<StepType, Factory> = {
  wash: (c, p, d) => new WashStep(c, p, d),
  // knead and crush are the same reusable press step (on the board / in the bowl)
  knead: (c, p, d) => new PressStep(c, p, d),
  crush: (c, p, d) => new PressStep(c, p, d),
  stir: (c, p, d) => new StirStep(c, p, d),
  grate: (c, p, d) => new GrateStep(c, p, d),
  roll: (c, p, d) => new RollStep(c, p, d),
  spread: (c, p, d) => new SpreadStep(c, p, d),
  sprinkle: (c, p, d) => new SprinkleStep(c, p, d),
  decorate: (c, p, d) => new DecorateStep(c, p, d),
  bake: (c, p, d) => new BakeStep(c, p, d),
  feed: (c, p, d) => new FeedStep(c, p, d),
  choose: (c, p, d) => new ChooseStep(c, p, d),
  chop: (c, p, d) => new ChopStep(c, p, d),
  'open-pour': (c, p, d) => new OpenPourStep(c, p, d),
  share: (c, p, d) => new ShareStep(c, p, d),
  photo: (c, p, d) => new PhotoStep(c, p, d),
  cutters: (c, p, d) => new CuttersStep(c, p, d),
  blend: (c, p, d) => new BlendStep(c, p, d),
};

export function createStep(def: StepDef, ctx: StepContext, onDone: () => void): Step<unknown> {
  return STEP_TYPES[def.type](ctx, def.params as never, onDone);
}
