import { pizza } from './pizza';
import { salad } from './salad';
import { cookies } from './cookies';
import type { Recipe } from './types';

/** Every recipe on the home screen, in display order. */
export const RECIPES: Recipe[] = [pizza, salad, cookies];

export function getRecipe(id: string): Recipe {
  return RECIPES.find((r) => r.id === id) ?? RECIPES[0];
}
