import { pizza } from './pizza';
import type { Recipe } from './types';

/** Every recipe on the home screen, in display order. */
export const RECIPES: Recipe[] = [pizza];

export function getRecipe(id: string): Recipe {
  return RECIPES.find((r) => r.id === id) ?? RECIPES[0];
}
