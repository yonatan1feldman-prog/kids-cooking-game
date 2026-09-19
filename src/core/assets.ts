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
  /** The title's logo (lettering is part of the art, the only words ever drawn; the child doesn't need to read it). */
  'logo-cooking-with-mom': { size: [900, 400] },
  /** One topping bin in the decorating step (the topping is drawn on top of it). */
  'topping-bin': { size: [240, 240] },

  // ---- Prep steps (round 5, ../cooking-game-assets/images-b-prep, README-prep.md). Anchors: ART.prep.
  /** Wash: the sink (centre), the tap on its back rim, the stream (stretched down to the hands), the child's hands, a bubble. */
  'sink-basin': { size: [900, 560] },
  faucet: { size: [320, 400] },
  'water-stream': { size: [240, 420] },
  'kid-hands': { size: [600, 420] },
  bubble: { size: [240, 240] },
  /** Knead: the dough from shaggy to smooth, same frame as dough-ball (base y 266). The dent under a press. */
  'dough-knead-1': { size: [360, 300] },
  'dough-knead-2': { size: [360, 300] },
  'dough-knead-3': { size: [360, 300] },
  'press-dent': { size: [260, 140] },
  /** Crush + stir: the bowl in two layers (back, contents, front: all at one position), the sauce stages, the spoon. */
  'prep-bowl-back': { size: [640, 520] },
  'prep-bowl-front': { size: [640, 520] },
  'sauce-stage-0': { size: [640, 520] },
  'sauce-stage-1': { size: [640, 520] },
  'sauce-stage-2': { size: [640, 520] },
  'sauce-stage-3': { size: [640, 520] },
  'spoon-wood': { size: [240, 620] },
  /** Grate: the grater, the block that follows the finger, the growing pile, the handful for sprinkling. */
  grater: { size: [506, 736] },
  'cheese-block': { size: [380, 300] },
  'cheese-pile-1': { size: [400, 260] },
  'cheese-pile-2': { size: [400, 260] },
  'cheese-pile-3': { size: [400, 260] },
  'cheese-handful': { size: [300, 260] },
  /** Mom's flat pressing hand (kneading, crushing). */
  'mom-hand-press': { size: [400, 400] },

  // ---- Delivered for part B of the prep round (not used yet: never loaded, see NOT_LOADED).
  'btn-temp-down': { size: [240, 240] },
  'btn-temp-up': { size: [240, 240] },
  'can-corn-closed': { size: [340, 460] },
  'can-corn-open': { size: [340, 460] },
  'can-lid': { size: [300, 260] },
  'jar-lid': { size: [300, 240] },
  'jar-olives-closed': { size: [340, 480] },
  'jar-olives-open': { size: [340, 480] },
  'cutting-board': { size: [1000, 600] },
  knife: { size: [240, 640] },
  'mom-hand-knife': { size: [400, 400] },
  'mom-hand-mitt': { size: [400, 400] },
  'mom-mouth-chew': { size: [800, 800] },
  'mitt-single': { size: [320, 400] },
  'oven-mitts': { size: [480, 400] },
  'oven-panel': { size: [1200, 720] },
  'oven-needle': { size: [1200, 720] },
  'oven-start-off': { size: [320, 320] },
  'oven-start-on': { size: [320, 320] },
  'temp-glow': { size: [400, 280] },
  'photo-frame': { size: [700, 780] },
  'veg-tomato-whole': { size: [672, 504] },
  'veg-tomato-slice': { size: [240, 240] },
  'veg-tomato-inside': { size: [60, 378] },
  'veg-mushroom-whole': { size: [672, 504] },
  'veg-mushroom-slice': { size: [240, 240] },
  'veg-mushroom-inside': { size: [60, 406] },
  'veg-pepper-whole': { size: [672, 504] },
  'veg-pepper-slice': { size: [240, 240] },
  'veg-pepper-inside': { size: [60, 378] },
  'veg-onion-whole': { size: [672, 504] },
  'veg-onion-slice': { size: [240, 240] },
  'veg-onion-inside': { size: [60, 327] },
} as const satisfies Record<string, { size: readonly [number, number]; raster?: number }>;

/** Texture size of an image: its native size, times its `raster` factor if it is shown bigger than native. */
export function textureSize(key: ImageKey): [number, number] {
  const v: { size: readonly [number, number]; raster?: number } = IMAGES[key];
  const f = v.raster ?? 1;
  return [Math.round(v.size[0] * f), Math.round(v.size[1] * f)];
}

export type ImageKey = keyof typeof IMAGES;
export const IMAGE_KEYS = Object.keys(IMAGES) as ImageKey[];

/**
 * Delivered but not used by any recipe yet (part B of the prep round): not loaded, no placeholder drawn, so
 * they cost the phone no memory or load time. They are still baked to WebP and precached. Remove a key from
 * this list when a step starts to use it.
 */
export const NOT_LOADED: ReadonlySet<ImageKey> = new Set<ImageKey>([
  'btn-temp-down', 'btn-temp-up', 'can-corn-open', 'can-lid', 'jar-lid',
  'jar-olives-open', 'mom-hand-mitt', 'mom-mouth-chew', 'mitt-single',
  'oven-mitts', 'oven-panel', 'oven-needle', 'oven-start-off', 'oven-start-on', 'temp-glow', 'photo-frame',
]);
/** The images the game loads (everything in the contract except NOT_LOADED). */
export const LOADED_KEYS = IMAGE_KEYS.filter((k) => !NOT_LOADED.has(k));

/** Short effects played through Phaser (sfx.ts). Voice lines, music and the bake loop are in audio.ts. */
export const SOUND_KEYS = [
  'tap', 'pop', 'squish', 'sprinkle', 'whoosh', 'oven-ding', 'munch', 'cheer', 'cheer-jingle', 'star', 'complete',
  // prep steps (round 5); water is a loop (audio.ts `waterLoop`), not an effect
  'bubbles', 'grate', 'chop', 'can-open', 'jar-open', 'pour', 'camera', 'click', 'beep',
] as const;
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
    press: { x: 140, y: 150 },
    /** The knife's blade tip in Mom's fist (the same knife at 0.5x), and the palm of her oven mitt. */
    knife: { x: 149, y: 364 },
    mitt: { x: 150, y: 150 },
  },
  /** Prep-step art geometry (README-prep.md, scenes-prep.js). */
  prep: {
    /** faucet: the water outlet; its base bottom is at y 372. */
    faucetOut: { x: 262, y: 176 },
    faucetBase: 372,
    /** water-stream: top centre of the stream (it may be stretched down to the hands). */
    streamTop: { x: 120, y: 0 },
    /** kid-hands: palms, the point between them, fingertips at about y 110; the bottom edge is the screen bottom. */
    kidPalmL: { x: 192, y: 232 },
    kidPalmR: { x: 408, y: 232 },
    kidMid: { x: 300, y: 214 },
    kidTips: 110,
    /** spoon-wood: the bowl of the spoon. */
    spoonBowl: { x: 120, y: 500 },
    /** prep bowl (640x520, every layer): rim ellipse and opening. */
    bowlOpening: { x: 320, y: 176, rx: 262, ry: 74 },
    /** dough-knead-* (same frame as dough-ball): base line and width. */
    doughBase: 266,
    /** cheese-handful: the clump that follows the finger. */
    handfulClump: { x: 150, y: 116 },
    /** press-dent: the centre of the hollow. */
    dentCentre: { x: 130, y: 66 },
    /** Part B: the knife's blade tip (it follows the finger). Mom's knife and mitt hands: ART.momHands. The veg: core/vegArt.ts. */
    knifeTip: { x: 118, y: 618 },
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
