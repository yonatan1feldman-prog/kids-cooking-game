import { isBigChef } from '../core/level';
import { grown, TUNING } from '../core/tuning';
import type { ChooseOption, FindParams, OpenPourParams, PourSource, Recipe, StepDef } from './types';

/**
 * The big-chef level (gameplay round 5, core/level.ts; "hard" to the player): what level 2 changes in a recipe, in one
 * place. Level 1 ("easy") plays every recipe as written, plus what grows with the runs (`grown`, both levels). The step
 * types read the rest of level 2 themselves (the tighter cut in `cutTuning`, the arrows turning twice in `stirFlips`,
 * Pipa's remembered wish, Mom's model in decorating, the longer wait before the hint).
 * Nothing here can make her fail: every added part keeps Mom's hint and help.
 */

/** Tools "find the tool" may add (they must be loaded: core, or in the recipe's RECIPE_ASSETS). */
const TOOL_POOL: FindParams['options'] = [
  { image: 'grater', name: 'name-grater' },
  { image: 'spoon-wood', name: 'name-spoon' },
  { image: 'kitchen-whisk', name: 'name-whisk' },
  { image: 'kitchen-spatula', name: 'name-spatula' },
  { image: 'rolling-pin', name: 'name-rolling-pin' },
];

const OTHERS: FindParams['options'] = [{ image: 'kitchen-whisk', name: 'name-whisk' }, { image: 'kitchen-spatula', name: 'name-spatula' }];

/** "Find the tool" for the wooden spoon (the soup's own; the big chef's pancakes, cake and smoothie). */
export const FIND_SPOON: StepDef = {
  type: 'find',
  params: { options: [{ image: 'spoon-wood', name: 'name-spoon' }, ...OTHERS], answer: 'spoon-wood', bin: 'topping-bin', line: 'vo-find-spoon' },
};

/** The recipe challenges (PR A), hard: the salad servers before the mixing. */
export const FIND_SERVERS: StepDef = {
  type: 'find',
  params: { options: [{ image: 'salad-servers', name: 'name-servers' }, ...OTHERS], answer: 'salad-servers', bin: 'topping-bin', line: 'vo-find-servers' },
};

/** The recipe challenges (PR A), hard: the skewer stick before the threading. */
export const FIND_STICK: StepDef = {
  type: 'find',
  params: { options: [{ image: 'skewer-stick', name: 'name-stick' }, ...OTHERS], answer: 'skewer-stick', bin: 'topping-bin', line: 'vo-find-stick' },
};

/** Mom's name for what a pour step pours (the hard level's pour order). */
const POUR_NAMES: Partial<Record<string, PourSource['name']>> = {
  'flour-bag': 'name-flour',
  'sugar-jar': 'name-sugar',
  'milk-carton': 'name-milk',
  'butter-cube': 'name-butter',
  'lettuce-tear-3': 'name-lettuce',
};

/** A single pour into the kept bowl that can join others in one step (flour, sugar, milk, butter). */
const joinable = (d: StepDef): d is Extract<StepDef, { type: 'open-pour' }> =>
  d.type === 'open-pour' && d.params.kind === 'open' && !!d.params.keep && !d.params.sources && !d.params.glasses && !!POUR_NAMES[d.params.closed];

/**
 * The recipe challenges (PR A), hard: what goes in first. Pours of single things into the same bowl one after the other
 * (the cookies' flour, sugar and butter; the pancakes' flour and milk; the cake's flour, sugar and milk) become one step
 * where they all stand together, each keeping its own pouring, in the recipe's order (`order` in levelStep).
 */
function joinPours(steps: StepDef[]): StepDef[] {
  const out: StepDef[] = [];
  for (let i = 0; i < steps.length; i++) {
    const run: Extract<StepDef, { type: 'open-pour' }>[] = [];
    while (i < steps.length && joinable(steps[i])) run.push(steps[i++] as Extract<StepDef, { type: 'open-pour' }>);
    if (run.length > 1) {
      const first = run[0].params;
      const sources: PourSource[] = run.map(({ params: p }) => ({
        image: p.closed,
        piece: p.piece,
        tilt: p.tilt,
        name: POUR_NAMES[p.closed],
        mouth: p.mouth,
        pieceTint: p.pieceTint,
        pieceSize: p.pieceSize,
        pourSound: p.pourSound,
        pourMs: p.pourMs,
        dropIn: p.dropIn,
      }));
      const fills = run.flatMap((s) => s.params.keep?.fills ?? []);
      const params: OpenPourParams = { ...first, dropIn: undefined, keep: { ...first.keep, fills }, sources };
      out.push({ type: 'open-pour', params });
    } else out.push(...run);
    if (i < steps.length) out.push(steps[i]);
  }
  return out;
}

/** The recipe's step list for the current level: a big chef also gets the recipe's `bigExtra` steps and joined pours. */
export function levelSteps(recipe: Recipe): StepDef[] {
  const steps = [...recipe.steps];
  if (!isBigChef()) return steps;
  for (const x of recipe.bigExtra ?? []) {
    let n = x.nth ?? 0;
    const i = steps.findIndex((s) => s.type === x.before && n-- === 0);
    if (i >= 0) steps.splice(i, 0, x.step);
  }
  return joinPours(steps);
}

/** What `levelStep` needs from the run. */
export interface LevelRun {
  recipeId: string;
  /** How many times this recipe was played on this device before this run (0 = the first). */
  runNo: number;
  chosen: ChooseOption[];
}

/**
 * The recipe challenges (PR A), both levels: the busiest counts grow with the runs on this device (TUNING.grow): cuts,
 * presses per stage, cheese pieces, shakes of salt.
 */
function grownStep(def: StepDef, runNo: number): StepDef {
  const G = TUNING.grow;
  switch (def.type) {
    case 'chop':
      return { ...def, params: { ...def.params, cuts: def.params.cuts + grown(G.chop, runNo) } };
    case 'knead':
    case 'crush':
      return { ...def, params: { ...def.params, pressesPerStage: def.params.pressesPerStage + grown(G.presses, runNo) } } as StepDef;
    case 'sprinkle':
      return { ...def, params: { ...def.params, count: def.params.count + grown(def.params.into === 'bowl' ? G.shakes : G.sprinkle, runNo) } };
    default:
      return def;
  }
}

/**
 * One step as it is played on this level (called as each step starts, so a chosen option's prep steps get it too).
 * `has(key)`: whether an image is loaded (a tool added to "find the tool" must be).
 */
export function levelStep(def0: StepDef, has: (key: string) => boolean, run: LevelRun): StepDef {
  const def = grownStep(def0, run.runNo);
  if (!isBigChef()) return def;
  const B = TUNING.big;
  switch (def.type) {
    case 'stir':
      // Every stirring has the arrows (they turn round twice: `stirFlips`).
      return def.params.arrow ? def : { ...def, params: { ...def.params, arrow: { line: 'vo-stir-arrow', flipLine: 'vo-other-way' } } };
    case 'chop':
      return { ...def, params: { ...def.params, cuts: def.params.cuts + B.chopExtra } };
    case 'find': {
      const options = [...def.params.options];
      for (const t of TOOL_POOL) {
        if (options.length >= B.findTools) break;
        if (!options.some((o) => o.image === t.image) && has(t.image)) options.push(t);
      }
      return { ...def, params: { ...def.params, options } };
    }
    case 'choose': {
      const p = def.params;
      if (p.pick < 2 || p.options.length < 3) return def;
      // Pipa's order: three things where the recipe already has an order of two, else an order of two.
      const order = p.order
        ? { ...p.order, count: Math.min(B.order, p.pick), line: B.order >= 3 && p.pick >= 3 ? ('vo-pipa-order-3' as const) : p.order.line }
        : { line: 'vo-pipa-order' as const, then: 'vo-then' as const, first: 'vo-first-this' as const, count: 2 };
      return { ...def, params: { ...p, order } };
    }
    case 'thread':
      return { ...def, params: { ...def.params, pieces: B.thread.pieces, reach: B.thread.reach } };
    case 'spread':
      // "All the way to the edge."
      return { ...def, params: { ...def.params, coverage: Math.max(def.params.coverage, B.spreadCoverage) } };
    case 'bake': {
      // Mom picks the oven's number this run and says it; she sets the needle on what she heard.
      const P = def.params.panel;
      const pool = B.ovenTargets[run.recipeId];
      if (!P || !pool?.length) return def;
      const target = pool[Math.floor(Math.random() * pool.length)];
      return { ...def, params: { ...def.params, panel: { ...P, target, line: 'vo-temp-set', sayTarget: true } } };
    }
    case 'decorate':
      // Mom's picture to copy (instead of Pipa's two-kind wish).
      return { ...def, params: { ...def.params, model: true } };
    case 'open-pour': {
      // What goes in first: every pour of two or more things (the chosen bins too) in Mom's order.
      const p = def.params;
      const n = (p.sources ?? []).reduce((a, s) => a + (s === 'chosen' ? run.chosen.length : 1), 0);
      if (n < 2 || p.glasses) return def;
      return { ...def, params: { ...p, order: { line: 'vo-pour-first', wrong: 'vo-this-first', next: 'vo-then' } } };
    }
    default:
      return def;
  }
}
