/**
 * Asset contract. File names here are fixed; the asset agent delivers files with
 * exactly these names into public/assets/images (svg) and public/assets/sounds (ogg/mp3).
 *
 * `size` is the SVG's viewBox size. Every image is rasterized at that native size, and a
 * viewBox unit is one world unit at scale 1 (the world is 1080 high, see layout.ts).
 * Images are shown at their native size times layout.k, except where the stage table
 * (stage.ts) gives an item its own scale: touch size comes before identical outlines.
 * Placeholders are drawn at the same size.
 */
export const IMAGES = {
  /** Landscape kitchen, 1920x1080: anchored bottom-center, cropped only at the sides. */
  'bg-kitchen-landscape': { size: [1920, 1080] },
  'dough-ball': { size: [360, 300] },
  'dough-flat': { size: [720, 720] },
  'rolling-pin': { size: [640, 200] },
  'sauce-bowl': { size: [340, 300] },
  'sauce-blob': { size: [200, 200] },
  'cheese-shaker': { size: [260, 400] },
  'cheese-shred': { size: [80, 44] },
  'topping-tomato': { size: [140, 140] },
  'topping-olive': { size: [140, 140] },
  'topping-mushroom': { size: [140, 140] },
  'topping-corn': { size: [140, 140] },
  'topping-pepper': { size: [140, 140] },
  'topping-onion': { size: [140, 140] },
  /** The round pizza board under the dish. */
  tray: { size: [820, 830] },
  /** Oven layers share one 700x800 frame; oven-closed has a transparent window. */
  'oven-inside': { size: [700, 800] },
  'oven-closed': { size: [700, 800] },
  'oven-open': { size: [700, 800] },
  /** Only a fallback: slices are normally cut from the child's own pizza. */
  'pizza-slice': { size: [300, 300] },
  /** Character layers share one 600x700 frame: body, then eyes, then mouth. */
  'character-body': { size: [600, 700] },
  'character-eyes-open': { size: [600, 700] },
  'character-eyes-blink': { size: [600, 700] },
  'character-eyes-surprised': { size: [600, 700] },
  'character-eyes-happy': { size: [600, 700] },
  'character-mouth-closed': { size: [600, 700] },
  'character-mouth-open': { size: [600, 700] },
  'character-mouth-chew': { size: [600, 700] },
  'hand-hint': { size: [220, 280] },
  star: { size: [200, 200] },
  'btn-play': { size: [240, 240] },
  'btn-home': { size: [240, 240] },
  'btn-done': { size: [240, 240] },
  'card-pizza': { size: [400, 520] },
  /** One topping bin in the decorating step (the topping is drawn on top of it). */
  'topping-bin': { size: [240, 240] },
} as const satisfies Record<string, { size: readonly [number, number] }>;

export type ImageKey = keyof typeof IMAGES;
export const IMAGE_KEYS = Object.keys(IMAGES) as ImageKey[];

export const SOUND_KEYS = ['tap', 'pop', 'squish', 'sprinkle', 'whoosh', 'oven-ding', 'munch', 'cheer', 'cheer-jingle'] as const;
export type SoundKey = (typeof SOUND_KEYS)[number];

/** Art geometry the code relies on, in each image's own viewBox coordinates. */
export const ART = {
  /** Fingertip of hand-hint (the hand is tilted 12 degrees). */
  handTip: { x: 53, y: 23 },
  /** Oven window hole in oven-closed, and where the pizza sits behind it. */
  ovenWindow: { x: 150, y: 320, w: 400, h: 290 },
  ovenPizza: { x: 350, y: 480, diameter: 320 },
  /** Radius of the dough disc drawn inside dough-flat. */
  doughRadius: 350,
} as const;

/** Internal textures always made in code (not part of the asset contract). */
export const FX_DOT = 'fx-dot';
export const FX_SOFT = 'fx-soft';
/** sauce-blob recolored to a solid paint brush (no outline). */
export const SAUCE_BRUSH = 'sauce-brush';
/** Palette from the art STYLE.md. */
export const INK = 0x5b3a29;
export const CREAM = 0xfff6e6;
export const SAUCE_RED = 0xe4523b;
