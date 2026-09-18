/**
 * Asset contract. File names here are fixed; the asset agent delivers files with
 * exactly these names into public/assets/images (svg) and public/assets/sounds (ogg/mp3).
 *
 * `box` is the raster size (game pixels, base width 1080) an SVG is rendered at.
 * The SVG keeps its own aspect ratio and is fitted inside this box, so any
 * viewBox works. Placeholders are drawn at the same size.
 */
export const IMAGES = {
  'bg-kitchen': { box: [1080, 1920] },
  'dough-ball': { box: [420, 420] },
  'dough-flat': { box: [800, 800] },
  'rolling-pin': { box: [560, 200] },
  'sauce-bowl': { box: [320, 240] },
  'sauce-blob': { box: [160, 160] },
  'cheese-shaker': { box: [240, 320] },
  'cheese-shred': { box: [64, 64] },
  'topping-tomato': { box: [160, 160] },
  'topping-olive': { box: [160, 160] },
  'topping-mushroom': { box: [160, 160] },
  'topping-corn': { box: [160, 160] },
  'topping-pepper': { box: [160, 160] },
  'topping-onion': { box: [160, 160] },
  tray: { box: [300, 300] },
  'oven-closed': { box: [640, 640] },
  'oven-open': { box: [640, 640] },
  'pizza-slice': { box: [320, 320] },
  'character-body': { box: [600, 640] },
  'character-mouth-open': { box: [220, 180] },
  'character-mouth-closed': { box: [220, 120] },
  'character-eyes-happy': { box: [320, 140] },
  'hand-hint': { box: [220, 260] },
  star: { box: [128, 128] },
  'btn-play': { box: [400, 400] },
  'btn-home': { box: [200, 200] },
  'btn-done': { box: [240, 240] },
  'card-pizza': { box: [560, 640] },
} as const satisfies Record<string, { box: readonly [number, number] }>;

export type ImageKey = keyof typeof IMAGES;
export const IMAGE_KEYS = Object.keys(IMAGES) as ImageKey[];

export const SOUND_KEYS = ['tap', 'pop', 'squish', 'sprinkle', 'whoosh', 'oven-ding', 'munch', 'cheer'] as const;
export type SoundKey = (typeof SOUND_KEYS)[number];

/** Internal textures always generated in code (not part of the asset contract). */
export const FX_DOT = 'fx-dot';
export const FX_SOFT = 'fx-soft';
