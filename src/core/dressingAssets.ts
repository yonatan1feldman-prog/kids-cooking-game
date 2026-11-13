/**
 * The premium round, PR 2 (light and depth; research/premium-spec.md section 2): the dressing's part of the asset
 * contract, in its own file so assets.ts changes by one spread and one block. Made by
 * assets-src/images-b/tools/gen_dressing.py; placed by core/scenery.ts (`dressKitchen`, `addForeground`).
 * Each is loaded with the world it dresses (assets.ts, the block after the mermaid world's entry), never at boot.
 */
export const DRESSING_IMAGES = {
  /** The oilcloth under a recipe's work area (stage.cloth). */
  'counter-cloth': { size: [1300, 420] },
  /** The front of each world: drawn with its bottom on the screen's bottom edge. */
  'fg-lemons': { size: [360, 230] },
  'fg-napkin': { size: [300, 210] },
  'fg-leaves': { size: [440, 330] },
  'fg-basket': { size: [380, 240] },
  'fg-fence': { size: [300, 560] },
  'fg-desk': { size: [420, 250] },
} as const;

/** What each world loads of it (the recipes and washing up: the kitchen's front; the recipes also the cloth). */
export const DRESSING_BY_WORLD: Record<string, readonly (keyof typeof DRESSING_IMAGES)[]> = {
  recipe: ['counter-cloth', 'fg-lemons', 'fg-napkin'],
  dishes: ['fg-lemons', 'fg-napkin'],
  garden: ['fg-leaves'],
  market: ['fg-basket'],
  farm: ['fg-fence'],
  clinic: ['fg-desk'],
};
