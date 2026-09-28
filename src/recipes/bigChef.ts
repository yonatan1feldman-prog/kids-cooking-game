import { isBigChef } from '../core/level';
import { TUNING } from '../core/tuning';
import type { FindParams, Recipe, StepDef } from './types';

/**
 * The big-chef level (gameplay round 5, core/level.ts): what level 2 changes in a recipe, in one place. Level 1 plays
 * every recipe exactly as written. The step types read the rest of level 2 themselves (the tighter cut in `cutTuning`,
 * the arrows turning twice in `stirFlips`, Pipa's remembered wish and her two-kind decorating wish).
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

/** "Find the tool" for the wooden spoon (the soup's own; the big chef's pancakes and cake). */
export const FIND_SPOON: StepDef = {
  type: 'find',
  params: {
    options: [{ image: 'spoon-wood', name: 'name-spoon' }, { image: 'kitchen-whisk', name: 'name-whisk' }, { image: 'kitchen-spatula', name: 'name-spatula' }],
    answer: 'spoon-wood',
    bin: 'topping-bin',
    line: 'vo-find-spoon',
  },
};

/** The recipe's step list for the current level: a big chef also gets the recipe's `bigExtra` steps. */
export function levelSteps(recipe: Recipe): StepDef[] {
  const steps = [...recipe.steps];
  if (!isBigChef()) return steps;
  for (const x of recipe.bigExtra ?? []) {
    const i = steps.findIndex((s) => s.type === x.before);
    if (i >= 0) steps.splice(i, 0, x.step);
  }
  return steps;
}

/**
 * One step as a big chef plays it (called as each step starts, so a chosen option's prep steps get it too).
 * `has(key)`: whether an image is loaded (a tool added to "find the tool" must be).
 */
export function levelStep(def: StepDef, has: (key: string) => boolean): StepDef {
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
    default:
      return def;
  }
}
