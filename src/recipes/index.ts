import { pizza } from './pizza';
import { salad } from './salad';
import { cookies } from './cookies';
import { smoothie } from './smoothie';
import type { Recipe } from './types';

/** Every recipe on the home screen, in display order. */
export const RECIPES: Recipe[] = [pizza, salad, cookies, smoothie];

export function getRecipe(id: string): Recipe {
  return RECIPES.find((r) => r.id === id) ?? RECIPES[0];
}
