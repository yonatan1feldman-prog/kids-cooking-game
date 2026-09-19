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
  /** Landscape kitchen, 2400x1080 (fits 20:9 exactly): anchored bottom-center, cropped only at the sides. */
  'bg-kitchen-landscape': { size: [2400, 1080] },
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
  /** The round pizza board under the dish (tray is an identical older copy). */
  tray: { size: [820, 830] },
  'pizza-board': { size: [820, 830] },
  /** Oven layers share one 700x800 frame; oven-closed has a transparent window. */
  'oven-inside': { size: [700, 800] },
  'oven-closed': { size: [700, 800] },
  'oven-open': { size: [700, 800] },
  /** Only a fallback: slices are normally cut from the child's own pizza. */
  'pizza-slice': { size: [300, 300] },
  /** Pipa the hedgehog (the kitchen pet). Layers share one 600x700 frame: body, then eyes, then mouth. */
  'character-body': { size: [600, 700] },
  'character-eyes-open': { size: [600, 700] },
  'character-eyes-blink': { size: [600, 700] },
  'character-eyes-surprised': { size: [600, 700] },
  'character-eyes-happy': { size: [600, 700] },
  'character-mouth-closed': { size: [600, 700] },
  'character-mouth-open': { size: [600, 700] },
  'character-mouth-chew': { size: [600, 700] },
  /**
   * Mom: 12 layers sharing one 800x800 frame (y 800 = her waist, at the screen bottom; body centre x 500).
   * Stack, back to front: arm-right, body, head, hair, eyes, mouth, arm-left. Arm pivots: ART.mom.
   */
  'mom-arm-right': { size: [800, 800] },
  'mom-body': { size: [800, 800] },
  'mom-head': { size: [800, 800] },
  'mom-hair': { size: [800, 800] },
  'mom-eyes-open': { size: [800, 800] },
  'mom-eyes-blink': { size: [800, 800] },
  'mom-eyes-happy': { size: [800, 800] },
  'mom-eyes-surprised': { size: [800, 800] },
  'mom-mouth-smile': { size: [800, 800] },
  'mom-mouth-talk': { size: [800, 800] },
  'mom-mouth-open': { size: [800, 800] },
  'mom-arm-left': { size: [800, 800] },
  /** Mom's demo hands, 400x400; the anchor (ART.momHands) is the point placed on the target. */
  'mom-hand-point': { size: [400, 400] },
  'mom-hand-roll': { size: [400, 400] },
  'mom-hand-spread': { size: [400, 400] },
  'mom-hand-sprinkle': { size: [400, 400] },
  'mom-hand-grab': { size: [400, 400] },
  /** Older single guiding hand (kept in the contract; Mom's demo hands replaced it on screen). */
  'hand-hint': { size: [220, 280] },
  star: { size: [200, 200] },
  /** Shown at 1.4x (the hero of the title screen), so it is rasterized at 1.4x too. */
  'btn-play': { size: [240, 240], raster: 1.4 },
  'btn-home': { size: [240, 240] },
  'btn-done': { size: [240, 240] },
  'card-pizza': { size: [400, 520] },
  /** One topping bin in the decorating step (the topping is drawn on top of it). */
  'topping-bin': { size: [240, 240] },
} as const satisfies Record<string, { size: readonly [number, number]; raster?: number }>;

/** Texture size of an image: its native size, times its `raster` factor if it is shown bigger than native. */
export function textureSize(key: ImageKey): [number, number] {
  const v: { size: readonly [number, number]; raster?: number } = IMAGES[key];
  const f = v.raster ?? 1;
  return [Math.round(v.size[0] * f), Math.round(v.size[1] * f)];
}

export type ImageKey = keyof typeof IMAGES;
export const IMAGE_KEYS = Object.keys(IMAGES) as ImageKey[];

/** Short effects played through Phaser (sfx.ts). Voice lines, music and the bake loop are in audio.ts. */
export const SOUND_KEYS = ['tap', 'pop', 'squish', 'sprinkle', 'whoosh', 'oven-ding', 'munch', 'cheer', 'cheer-jingle', 'star', 'complete'] as const;
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
  /** Mom's frame: body centre line, shoulder pivots of the arms, and the drawn pointing fingertip. */
  mom: { w: 800, h: 800, cx: 500, pivotL: { x: 350, y: 505 }, pivotR: { x: 650, y: 505 }, fingertipL: { x: 37, y: 378 } },
  /** Demo-hand anchors in their 400x400 frames (README-mom.md). */
  momHands: {
    point: { x: 100, y: 100 },
    roll: { x: 140, y: 140 },
    spread: { x: 110, y: 250 },
    sprinkle: { x: 125, y: 115 },
    grab: { x: 110, y: 150 },
  },
} as const;

export type MomHand = keyof typeof ART.momHands;

/** Internal textures always made in code (not part of the asset contract). */
export const FX_DOT = 'fx-dot';
export const FX_SOFT = 'fx-soft';
/** sauce-blob recolored to a solid paint brush (no outline). */
export const SAUCE_BRUSH = 'sauce-brush';
/** Palette from the art STYLE.md. */
export const INK = 0x5b3a29;
export const CREAM = 0xfff6e6;
export const SAUCE_RED = 0xe4523b;
