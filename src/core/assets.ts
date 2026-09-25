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
  /**
   * The living kitchen (gameplay round): the things on the wall she can tap, each its own picture in the background's
   * frame (core/kitchen.ts has where each lies); the background no longer has them.
   */
  'kitchen-jar-flour': { size: [124, 134] },
  'kitchen-jar-pasta': { size: [112, 118] },
  'kitchen-jar-jam': { size: [86, 92] },
  'kitchen-basil': { size: [102, 128] },
  'kitchen-ladle': { size: [72, 178] },
  'kitchen-whisk': { size: [48, 166] },
  'kitchen-spatula': { size: [70, 170] },
  'kitchen-pan': { size: [102, 170] },
  'kitchen-pot-1': { size: [104, 116] },
  'kitchen-pot-2': { size: [96, 112] },
  'kitchen-pot-3': { size: [88, 108] },
  'kitchen-sun': { size: [88, 88] },
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
  /** Round 11: the other arm poses, same frame and pivots. The resting arm (hand on the hip) is her pose while she works;
   * mom-arm-right waves (hello, a step done, the finale). The reaching arm goes down to the counter while her demo hand shows. */
  'mom-arm-right-rest': { size: [800, 800] },
  'mom-arm-left-reach': { size: [800, 800] },
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

  // ---- Part B of the prep round: choose, chop, open-pour, the oven panel and mitts, share, the photo.
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
  // ---- The salad (round 6, ../cooking-game-assets/images-b-salad, README-salad.md). Anchors: ART.salad.
  'card-salad': { size: [400, 520] },
  /** Wash the vegetables: the colander with them in it, in the sink; drops fly off while she rubs. */
  colander: { size: [820, 560] },
  'water-drop': { size: [120, 160] },
  /** Tear the lettuce: one frame for the four states (head, then torn more and more). */
  'lettuce-head': { size: [640, 560] },
  'lettuce-tear-1': { size: [640, 560] },
  'lettuce-tear-2': { size: [640, 560] },
  'lettuce-tear-3': { size: [640, 560] },
  /** The cut vegetables of the salad (the same spec as the prep vegetables), and the pieces in the bowl (topping frame). */
  'veg-cucumber-whole': { size: [672, 504] },
  'veg-cucumber-slice': { size: [240, 240] },
  'veg-cucumber-inside': { size: [60, 168] },
  'veg-carrot-whole': { size: [672, 504] },
  'veg-carrot-slice': { size: [240, 240] },
  'veg-carrot-inside': { size: [60, 159] },
  'piece-cucumber': { size: [140, 140] },
  'piece-carrot': { size: [140, 140] },
  'piece-lettuce': { size: [140, 140] },
  /** The salad bowl: back, contents (the heaps as it fills, then mixed), front, all at one position. */
  'salad-bowl-back': { size: [900, 620] },
  'salad-bowl-front': { size: [900, 620] },
  'salad-heap-1': { size: [900, 620] },
  'salad-heap-2': { size: [900, 620] },
  'salad-heap-3': { size: [900, 620] },
  'salad-mixed': { size: [900, 620] },
  /** Dressing: the lemon squeezed out in three states, the oil bottle, the salt shaker, the falling drops. */
  'lemon-half-1': { size: [520, 520] },
  'lemon-half-2': { size: [520, 520] },
  'lemon-half-3': { size: [520, 520] },
  'juice-drop': { size: [120, 160] },
  'oil-bottle': { size: [300, 640] },
  'oil-drop': { size: [120, 160] },
  'salt-shaker': { size: [260, 400] },
  /** Mix and serve: the salad servers, the serving bowls, a portion on the spoon. The salad's photo frame. */
  'salad-servers': { size: [440, 640] },
  'serving-bowl': { size: [480, 320] },
  'salad-portion': { size: [360, 280] },
  'photo-frame-salad': { size: [700, 780] },
  /** The cookies (round 7, README-cookies.md): the card, what goes into the prep bowl, the egg, the batter stages. */
  'card-cookies': { size: [400, 520] },
  'flour-bag': { size: [400, 520] },
  'sugar-jar': { size: [340, 480] },
  'butter-cube': { size: [300, 260] },
  'egg-1': { size: [400, 440] },
  'egg-2': { size: [400, 440] },
  'egg-3': { size: [400, 440] },
  'batter-stage-0': { size: [640, 520] },
  'batter-stage-1': { size: [640, 520] },
  'batter-stage-2': { size: [640, 520] },
  'batter-stage-3': { size: [640, 520] },
  /** Kneading (the dough-ball frame), the rolled sheet and the baking tray (one 1000x700 frame, the same six slots). */
  'cookie-dough-knead-1': { size: [360, 300] },
  'cookie-dough-knead-2': { size: [360, 300] },
  'cookie-dough-knead-3': { size: [360, 300] },
  'cookie-dough-ball': { size: [360, 300] },
  'cookie-dough-flat': { size: [1000, 700] },
  'baking-tray': { size: [1000, 700] },
  /** The cutters (one frame, press point ART.cookies.cutterPress) and the cookies they cut (one frame, centred). */
  'cutter-star': { size: [320, 320] },
  'cutter-heart': { size: [320, 320] },
  'cutter-circle': { size: [320, 320] },
  'cutter-flower': { size: [320, 320] },
  'cookie-star': { size: [260, 260] },
  'cookie-heart': { size: [260, 260] },
  'cookie-circle': { size: [260, 260] },
  'cookie-flower': { size: [260, 260] },
  /** Decorating: the icing tubes (shown in their boxes) and what lands on a cookie (topping frame). */
  'icing-tube-pink': { size: [260, 520] },
  'icing-tube-choc': { size: [260, 520] },
  'icing-blob-pink': { size: [140, 140] },
  'icing-blob-choc': { size: [140, 140] },
  'sprinkles-cluster': { size: [140, 140] },
  'candy-dot': { size: [140, 140] },
  'photo-frame-cookies': { size: [700, 780] },
  // ---- The smoothie (round 8, ../cooking-game-assets/images-b-smoothie, README-smoothie.md). Anchors: ART.smoothie.
  'card-smoothie': { size: [400, 520] },
  /** Wash the fruit: the salad's colander frame with fruit in it. */
  'colander-fruit': { size: [820, 560] },
  /** The fruit to cut (the vegetable spec: whole 672x504, slice 240, inside strip 60 x the body's height; profiles in vegArt.ts). */
  'fruit-banana-whole': { size: [672, 504] },
  'fruit-banana-slice': { size: [240, 240] },
  'fruit-banana-inside': { size: [60, 136] },
  'fruit-strawberry-whole': { size: [672, 504] },
  'fruit-strawberry-slice': { size: [240, 240] },
  'fruit-strawberry-inside': { size: [60, 303] },
  'fruit-mango-whole': { size: [672, 504] },
  'fruit-mango-slice': { size: [240, 240] },
  'fruit-mango-inside': { size: [60, 324] },
  'fruit-kiwi-whole': { size: [672, 504] },
  'fruit-kiwi-slice': { size: [240, 240] },
  'fruit-kiwi-inside': { size: [60, 322] },
  /** The blender jar: back, contents (the heaps as it fills, then the blend stages), front, all one 600x800 frame. */
  'blender-jar-back': { size: [600, 800] },
  'blender-jar-front': { size: [600, 800] },
  'jar-heap-1': { size: [600, 800] },
  'jar-heap-2': { size: [600, 800] },
  'jar-heap-3': { size: [600, 800] },
  'blend-stage-1': { size: [600, 800] },
  'blend-stage-2': { size: [600, 800] },
  'blend-stage-3': { size: [600, 800] },
  /** The motor base the jar stands on (at the jar's scale), its big button (one frame for off and on), the lid. */
  'blender-base': { size: [700, 520] },
  'blender-button-off': { size: [280, 280] },
  'blender-button-on': { size: [280, 280] },
  'blender-lid': { size: [480, 240] },
  /** The milk carton (also the pancakes') and a falling drop of milk. */
  'milk-carton': { size: [320, 560] },
  'milk-drop': { size: [120, 160] },
  /** A glass, empty and full (one frame; the full one is revealed from the bottom up while it fills). */
  'glass-empty': { size: [320, 440] },
  'glass-full': { size: [320, 440] },
  'photo-frame-smoothie': { size: [700, 780] },
  // ---- The pancakes (round 8, ../cooking-game-assets/images-b-pancakes, README-pancakes.md). Anchors: ART.pancakes.
  'card-pancakes': { size: [400, 520] },
  /** The batter in the prep bowl, lumpy to smooth (the prep-bowl frame, as sauce-stage-*). */
  'pancake-batter-0': { size: [640, 520] },
  'pancake-batter-1': { size: [640, 520] },
  'pancake-batter-2': { size: [640, 520] },
  'pancake-batter-3': { size: [640, 520] },
  /** The stove top (the pan on its burner, the knob on its front), the knob off and on, the flame ring under the pan. */
  'stove-top': { size: [1200, 920] },
  'stove-knob-off': { size: [280, 280] },
  'stove-knob-on': { size: [280, 280] },
  flame: { size: [1000, 1000] },
  /** The pan from the top (its disc's centre on the burner, at the stove's scale) and the ladle. */
  pan: { size: [1240, 800] },
  ladle: { size: [400, 640] },
  /** One frame for the pancake in the pan: the puddle growing, the bubbles, golden (centred on the pan's disc). */
  'batter-puddle-1': { size: [680, 680] },
  'batter-puddle-2': { size: [680, 680] },
  'batter-puddle-3': { size: [680, 680] },
  'pancake-bubbles': { size: [680, 680] },
  'pancake-golden': { size: [680, 680] },
  /** The big plate with the stack (the dough-flat frame: the top pancake a disc of radius 290 around the centre). */
  'plate-big': { size: [720, 720] },
  /** Decorating: the syrup bottle (in its box) puts a blob of syrup; berries, banana coins, butter (topping frame). */
  'syrup-bottle': { size: [260, 520] },
  'syrup-blob': { size: [140, 140] },
  berry: { size: [140, 140] },
  'banana-coin': { size: [140, 140] },
  'butter-pat': { size: [140, 140] },
  'photo-frame-pancakes': { size: [700, 780] },

  // ---- The vegetable soup (round 9; images-b-soup, README-soup.md)
  'card-soup': { size: [400, 520] },
  'veg-potato-whole': { size: [672, 504] },
  'veg-potato-slice': { size: [240, 240] },
  'veg-potato-inside': { size: [60, 224] },
  'veg-zucchini-whole': { size: [672, 504] },
  'veg-zucchini-slice': { size: [240, 240] },
  'veg-zucchini-inside': { size: [60, 198] },
  'peel-skin-carrot': { size: [672, 504] },
  'peel-skin-potato': { size: [672, 504] },
  peeler: { size: [420, 460] },
  'peel-strip': { size: [280, 240] },
  'pot-back': { size: [1000, 760] },
  'pot-front': { size: [1000, 760] },
  'pot-heap-1': { size: [1000, 760] },
  'pot-heap-2': { size: [1000, 760] },
  'pot-heap-3': { size: [1000, 760] },
  'soup-stage-1': { size: [1000, 760] },
  'soup-stage-2': { size: [1000, 760] },
  'soup-stage-3': { size: [1000, 760] },
  'water-jug': { size: [360, 520] },
  'soup-bowl-empty': { size: [560, 360] },
  'soup-bowl-full': { size: [560, 360] },
  'soup-portion': { size: [360, 420] },
  'photo-frame-soup': { size: [700, 780] },

  // ---- The birthday cake (round 9; images-b-cake, README-cake.md)
  'card-cake': { size: [400, 520] },
  'cake-batter-0': { size: [640, 520] },
  'cake-batter-1': { size: [640, 520] },
  'cake-batter-2': { size: [640, 520] },
  'cake-batter-3': { size: [640, 520] },
  'cake-pan': { size: [800, 800] },
  'cake-pan-full': { size: [800, 800] },
  'cake-baked': { size: [720, 720] },
  'cake-plate': { size: [820, 830] },
  'frosting-tub-pink': { size: [320, 360] },
  'frosting-tub-white': { size: [320, 360] },
  'frosting-tub-choc': { size: [320, 360] },
  'frosting-blob': { size: [200, 200] },
  'choc-chip': { size: [140, 140] },
  candle: { size: [260, 460] },
  'flame-candle': { size: [200, 280] },
  'smoke-puff': { size: [240, 360] },
  'photo-frame-cake': { size: [700, 780] },
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
export const NOT_LOADED: ReadonlySet<ImageKey> = new Set<ImageKey>([]);
/** The images the game loads (everything in the contract except NOT_LOADED). */
export const LOADED_KEYS = IMAGE_KEYS.filter((k) => !NOT_LOADED.has(k));

// ---------------------------------------------------------------- loading by recipe (round 8)
/**
 * The ONE place that says which art and sounds belong to the core and which to a recipe.
 * - Core images (`CORE_IMAGES`: title, home, Mom, Pipa, the kitchen, Mom's demo hands, the buttons, the cards) load at
 *   boot and stay. Every other image belongs to the recipes that list it in `RECIPE_ASSETS` (art several recipes
 *   share, the sink or the oven, is a group listed in each of them).
 * - Sounds are core unless a recipe lists them: shared lines (hello, praise, counting, help, wash, oven), the pick lines
 *   (said while the recipe loads), effects the step types play, music. A sound may be listed by several recipes.
 * A recipe's images and sounds are loaded when its card is tapped (BootScene `recipeAssets`) and released again on the
 * home screen (`releaseRecipe`). A new recipe adds its entry here; a key in no list is reported in the console.
 */
/** The living kitchen's pieces (core/kitchen.ts): loaded early with the background, as they are part of it. */
export const KITCHEN_KEYS: readonly ImageKey[] = [
  'kitchen-jar-flour', 'kitchen-jar-pasta', 'kitchen-jar-jam', 'kitchen-basil', 'kitchen-ladle', 'kitchen-whisk',
  'kitchen-spatula', 'kitchen-pan', 'kitchen-pot-1', 'kitchen-pot-2', 'kitchen-pot-3', 'kitchen-sun',
];

export const CORE_IMAGES: readonly ImageKey[] = [
  'bg-kitchen-landscape', ...KITCHEN_KEYS, 'logo-cooking-with-mom', 'star', 'btn-play', 'btn-home', 'btn-done', 'hand-hint',
  'card-pizza', 'card-salad', 'card-cookies', 'card-smoothie', 'card-pancakes', 'card-soup', 'card-cake',
  'character-body', 'character-eyes-open', 'character-eyes-blink', 'character-eyes-surprised', 'character-eyes-happy',
  'character-mouth-closed', 'character-mouth-open', 'character-mouth-chew',
  'mom-arm-right', 'mom-body', 'mom-head', 'mom-hair', 'mom-eyes-open', 'mom-eyes-blink', 'mom-eyes-happy',
  'mom-eyes-surprised', 'mom-mouth-smile', 'mom-mouth-talk', 'mom-mouth-open', 'mom-mouth-chew', 'mom-arm-left',
  'mom-arm-right-rest', 'mom-arm-left-reach',
  'mom-hand-point', 'mom-hand-roll', 'mom-hand-spread', 'mom-hand-sprinkle', 'mom-hand-grab', 'mom-hand-press',
  'mom-hand-knife', 'mom-hand-mitt',
];
const WASH: ImageKey[] = ['sink-basin', 'faucet', 'water-stream', 'kid-hands', 'bubble'];
const OVEN: ImageKey[] = [
  'oven-inside', 'oven-closed', 'oven-open', 'oven-panel', 'oven-needle', 'oven-start-off', 'oven-start-on', 'temp-glow',
  'btn-temp-up', 'btn-temp-down', 'mitt-single', 'oven-mitts',
];
const PREP_BOWL: ImageKey[] = ['prep-bowl-back', 'prep-bowl-front', 'spoon-wood', 'press-dent'];
const CHOP: ImageKey[] = ['cutting-board', 'knife', 'topping-bin'];
const cut = (...names: string[]) => names.flatMap((n) => ['whole', 'slice', 'inside'].map((s) => `veg-${n}-${s}` as ImageKey));
const fruit = (...names: string[]) => names.flatMap((n) => ['whole', 'slice', 'inside'].map((s) => `fruit-${n}-${s}` as ImageKey));

export const RECIPE_ASSETS: Record<string, { images: readonly ImageKey[]; sounds: readonly string[] }> = {
  pizza: {
    images: [
      ...WASH, ...OVEN, ...PREP_BOWL, ...CHOP, ...cut('tomato', 'mushroom', 'pepper', 'onion'),
      'dough-ball', 'dough-flat', 'rolling-pin', 'sauce-bowl', 'sauce-blob', 'cheese-shaker', 'cheese-shred', 'tray',
      'pizza-board', 'pizza-slice', 'topping-tomato', 'topping-olive', 'topping-mushroom', 'topping-corn', 'topping-pepper',
      'topping-onion', 'dough-knead-1', 'dough-knead-2', 'dough-knead-3', 'sauce-stage-0', 'sauce-stage-1', 'sauce-stage-2',
      'sauce-stage-3', 'grater', 'cheese-block', 'cheese-pile-1', 'cheese-pile-2', 'cheese-pile-3', 'cheese-handful',
      'can-corn-closed', 'can-corn-open', 'can-lid', 'jar-lid', 'jar-olives-closed', 'jar-olives-open', 'photo-frame',
    ],
    sounds: [
      'can-open', 'jar-open', 'grate', 'name-corn', 'name-mushroom', 'name-olives', 'vo-choose', 'vo-crush', 'vo-grate',
      'vo-knead', 'vo-mom-yum', 'vo-open-can', 'vo-open-jar', 'vo-photo', 'vo-pour', 'vo-share', 'vo-slice-mom',
      'vo-slice-pipa', 'vo-stir', 'vo-temp',
    ],
  },
  salad: {
    images: [
      ...WASH, ...CHOP, ...cut('tomato', 'pepper', 'onion', 'cucumber', 'carrot'),
      'topping-tomato', 'topping-pepper', 'topping-onion', 'colander', 'water-drop', 'lettuce-head', 'lettuce-tear-1',
      'lettuce-tear-2', 'lettuce-tear-3', 'piece-cucumber', 'piece-carrot', 'piece-lettuce', 'salad-bowl-back',
      'salad-bowl-front', 'salad-heap-1', 'salad-heap-2', 'salad-heap-3', 'salad-mixed', 'lemon-half-1', 'lemon-half-2',
      'lemon-half-3', 'juice-drop', 'oil-bottle', 'oil-drop', 'salt-shaker', 'salad-servers', 'serving-bowl',
      'salad-portion', 'photo-frame-salad',
    ],
    sounds: [
      'tear', 'squeeze', 'drizzle', 'crunch', 'name-carrot', 'name-cucumber', 'vo-bowl-mom', 'vo-bowl-pipa',
      'vo-choose-veg', 'vo-finale-salad', 'vo-fresh', 'vo-into-bowl', 'vo-mix', 'vo-oil', 'vo-photo-salad', 'vo-salt',
      'vo-serve', 'vo-squeeze', 'vo-tear', 'vo-wash-veg', 'vo-wash-veg-done',
    ],
  },
  cookies: {
    images: [
      ...WASH, ...OVEN, ...PREP_BOWL, 'rolling-pin', 'topping-bin',
      'flour-bag', 'sugar-jar', 'butter-cube', 'egg-1', 'egg-2', 'egg-3', 'batter-stage-0', 'batter-stage-1',
      'batter-stage-2', 'batter-stage-3', 'cookie-dough-knead-1', 'cookie-dough-knead-2', 'cookie-dough-knead-3',
      'cookie-dough-ball', 'cookie-dough-flat', 'baking-tray', 'cutter-star', 'cutter-heart', 'cutter-circle',
      'cutter-flower', 'cookie-star', 'cookie-heart', 'cookie-circle', 'cookie-flower', 'icing-tube-pink',
      'icing-tube-choc', 'icing-blob-pink', 'icing-blob-choc', 'sprinkles-cluster', 'candy-dot', 'photo-frame-cookies',
    ],
    sounds: [
      'cookie-crunch', 'egg-crack', 'flour-poof', 'stamp', 'name-circle', 'name-flower', 'name-heart', 'name-star',
      'vo-butter', 'vo-cookie-mom', 'vo-cookie-pipa', 'vo-cookie-yum', 'vo-decorate-cookies', 'vo-egg',
      'vo-finale-cookies', 'vo-flour', 'vo-knead-cookies', 'vo-photo-cookies', 'vo-pick-cutter', 'vo-roll-cookies',
      'vo-share-cookies', 'vo-stamp', 'vo-stir-dough', 'vo-sugar', 'vo-temp-150', 'vo-tray',
    ],
  },
};

RECIPE_ASSETS.smoothie = {
  images: [
    ...WASH, ...CHOP, ...fruit('banana', 'strawberry', 'mango', 'kiwi'),
    'colander-fruit', 'water-drop', 'blender-jar-back', 'blender-jar-front', 'jar-heap-1', 'jar-heap-2', 'jar-heap-3',
    'blend-stage-1', 'blend-stage-2', 'blend-stage-3', 'blender-base', 'blender-button-off', 'blender-button-on',
    'blender-lid', 'milk-carton', 'milk-drop', 'glass-empty', 'glass-full', 'photo-frame-smoothie',
  ],
  sounds: [
    'blender', 'lid-click', 'slurp', 'glass-pour', 'name-banana', 'name-strawberry', 'name-mango', 'name-kiwi',
    'vo-wash-fruit', 'vo-wash-veg-done', 'vo-choose-fruit', 'vo-into-blender', 'vo-milk', 'vo-lid', 'vo-blend', 'vo-blend-done',
    'vo-pour-glass', 'vo-share-smoothie', 'vo-glass-mom', 'vo-glass-pipa', 'vo-smoothie-yum', 'vo-photo-smoothie',
    'vo-finale-smoothie',
  ],
};

RECIPE_ASSETS.pancakes = {
  images: [
    ...WASH, ...PREP_BOWL, 'topping-bin', 'knife', 'flour-bag', 'batter-stage-0', 'milk-carton', 'milk-drop', 'egg-1', 'egg-2', 'egg-3',
    'pancake-batter-0', 'pancake-batter-1', 'pancake-batter-2', 'pancake-batter-3', 'stove-top', 'stove-knob-off',
    'stove-knob-on', 'flame', 'pan', 'ladle', 'batter-puddle-1', 'batter-puddle-2', 'batter-puddle-3', 'pancake-bubbles',
    'pancake-golden', 'plate-big', 'syrup-bottle', 'syrup-blob', 'berry', 'banana-coin', 'butter-pat',
    'photo-frame-pancakes',
  ],
  sounds: [
    'sizzle', 'egg-crack', 'flour-poof', 'glass-pour', 'vo-flour', 'vo-milk', 'vo-egg', 'vo-stir-batter', 'vo-stove',
    'vo-ladle', 'vo-bubbles', 'vo-flip', 'vo-flip-done', 'vo-more-pancake', 'vo-decorate-pancakes', 'vo-share-pancakes',
    'vo-pancake-mom', 'vo-pancake-pipa', 'vo-pancake-yum', 'vo-photo-pancakes', 'vo-finale-pancakes',
  ],
};

/** Every sound some recipe lists (so not loaded at boot). */
RECIPE_ASSETS.soup = {
  images: [
    ...WASH, 'colander', 'topping-bin', 'cutting-board', 'knife', 'mom-hand-knife', 'salt-shaker', 'water-drop',
    'veg-carrot-whole', 'veg-carrot-slice', 'veg-carrot-inside', 'piece-carrot',
    'veg-potato-whole', 'veg-potato-slice', 'veg-potato-inside',
    'veg-onion-whole', 'veg-onion-slice', 'veg-onion-inside', 'topping-onion',
    'veg-zucchini-whole', 'veg-zucchini-slice', 'veg-zucchini-inside',
    'veg-tomato-whole', 'veg-tomato-slice', 'veg-tomato-inside', 'topping-tomato',
    'peel-skin-carrot', 'peel-skin-potato', 'peeler', 'peel-strip',
    'pot-back', 'pot-front', 'pot-heap-1', 'pot-heap-2', 'pot-heap-3',
    'soup-stage-1', 'soup-stage-2', 'soup-stage-3', 'stove-top', 'stove-knob-off', 'stove-knob-on', 'flame',
    'water-jug', 'spoon-wood', 'soup-bowl-empty', 'soup-bowl-full', 'soup-portion', 'photo-frame-soup',
  ],
  sounds: [
    'peel', 'slurp', 'vo-wash-veg', 'vo-wash-veg-done', 'vo-choose-veg', 'vo-cut', 'vo-cut-careful', 'vo-salt',
    'vo-stove', 'name-carrot', 'name-onion', 'name-tomato', 'name-potato', 'name-zucchini',
    'vo-peel', 'vo-peel-done', 'vo-into-pot', 'vo-water', 'vo-stir-soup', 'vo-soup-ready', 'vo-serve-soup',
    'vo-soup-mom', 'vo-soup-pipa', 'vo-soup-yum', 'vo-photo-soup', 'vo-finale-soup',
  ],
};

RECIPE_ASSETS.cake = {
  images: [
    ...WASH, ...PREP_BOWL, ...OVEN, 'topping-bin', 'knife', 'btn-done', 'flour-bag', 'batter-stage-0', 'sugar-jar', 'milk-carton',
    'milk-drop', 'egg-1', 'egg-2', 'egg-3',
    'cake-batter-0', 'cake-batter-1', 'cake-batter-2', 'cake-batter-3', 'cake-pan', 'cake-pan-full',
    'cake-baked', 'cake-plate', 'frosting-tub-pink', 'frosting-tub-white', 'frosting-tub-choc', 'frosting-blob',
    'sprinkles-cluster', 'candy-dot', 'berry', 'choc-chip',
    'candle', 'flame-candle', 'smoke-puff', 'photo-frame-cake',
  ],
  sounds: [
    'blow', 'egg-crack', 'flour-poof', 'glass-pour', 'vo-flour', 'vo-sugar', 'vo-milk', 'vo-egg',
    'vo-stir-cake', 'vo-pour-pan', 'vo-pick-frosting', 'name-pink', 'name-white', 'name-chocolate',
    'vo-frost', 'vo-decorate-cake', 'vo-candles', 'vo-wish', 'vo-blow-more', 'vo-blown',
    'vo-share-cake', 'vo-cake-mom', 'vo-cake-pipa', 'vo-cake-yum', 'vo-photo-cake', 'vo-finale-cake',
  ],
};

export const RECIPE_SOUNDS: ReadonlySet<string> = new Set(Object.values(RECIPE_ASSETS).flatMap((r) => r.sounds));
/** Contract images in neither the core nor any recipe (a new key someone forgot to list): reported at boot. */
export const unlistedImages = () => {
  const listed = new Set<ImageKey>([...CORE_IMAGES, ...Object.values(RECIPE_ASSETS).flatMap((r) => r.images)]);
  return LOADED_KEYS.filter((k) => !listed.has(k));
};

/** Short effects played through Phaser (sfx.ts). Voice lines, music and the bake loop are in audio.ts. */
export const SOUND_KEYS = [
  'tap', 'pop', 'squish', 'sprinkle', 'whoosh', 'oven-ding', 'munch', 'cheer', 'cheer-jingle', 'star', 'complete',
  // prep steps (round 5); water is a loop (audio.ts `waterLoop`), not an effect
  'bubbles', 'grate', 'chop', 'can-open', 'jar-open', 'pour', 'camera', 'click', 'beep',
  // the salad (round 6)
  'tear', 'squeeze', 'drizzle', 'salt', 'crunch',
  // the cookies (round 7)
  'egg-crack', 'flour-poof', 'stamp', 'icing', 'cookie-crunch',
  // the smoothie (round 8; the blender is a loop, audio.ts `blenderLoop`)
  'lid-click', 'slurp', 'glass-pour',
  // the vegetable soup and the birthday cake (round 9; the pot cooks on the oven's own `bake` loop)
  'peel', 'blow',
  // the gameplay round: Pipa's own voice when she tastes (wordless; audio-src/character, CHARACTER-NOTES.md) and her sneeze
  'char-yay', 'char-giggle', 'char-wow', 'pipa-sneeze',
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
  mom: { w: 800, h: 800, cx: 500, pivotL: { x: 350, y: 505 }, pivotR: { x: 650, y: 505 }, fingertipL: { x: 37, y: 378 }, mouth: { x: 500, y: 357 } },
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
    /** Part B: the oven panel (1200x720; the needle shares its box): the needle's pivot, its angle per value, the printed numbers. */
    panelPivot: { x: 600, y: 540 },
    panelAngle: { 50: -80, 100: -40, 150: 0, 200: 40, 250: 80 } as Record<number, number>,
    panelDigit: { 50: [214, 472], 100: [329, 218], 150: [600, 163], 200: [875, 212], 250: [1020, 466] } as Record<number, readonly [number, number]>,
    /** Part B: the photo frame's see-through window (700x780 frame). */
    photoWindow: { x: 80, y: 80, w: 540, h: 540 },
    /** Part B: the tops of the can and the jar (where the lid sits, in their 340x460 / 340x480 frames). */
    canTop: { x: 170, y: 70 },
    jarTop: { x: 170, y: 55 },
    /** Part B: the knife's blade tip (it follows the finger). Mom's knife and mitt hands: ART.momHands. The veg: core/vegArt.ts. */
    knifeTip: { x: 118, y: 618 },
  },
  /** The salad's art geometry (README-salad.md, scenes-salad.js `SALAD`). */
  salad: {
    /** salad-bowl-* and salad-heap-* / salad-mixed (900x620): the opening (the pieces go inside it). */
    bowlOpening: { x: 450, y: 218, rx: 388, ry: 100 },
    /** serving-bowl (480x320): its opening; a full bowl = salad-mixed at rx 196 / 388 of its scale, opening on opening. */
    servingOpening: { x: 240, y: 122, rx: 196, ry: 50 },
    /** colander (820x560): drawn at 0.86 / 1.1 of the sink, 40 right of and 20 below its centre; the lettuce under the stream. */
    colander: { scale: 0.86 / 1.1, dx: 40, dy: 20, top: 120, halfW: 250 },
    oilSpout: { x: 150, y: 30 },
    saltHoles: { x: 130, y: 70 },
    /** salad-servers: between the two heads (it follows the finger). */
    servers: { x: 220, y: 500 },
    /** salad-portion: the heap on the spoon. */
    portion: { x: 160, y: 146 },
    /** lemon-half-*: the cut face; drops fall from the lower rim. */
    lemonFace: { x: 260, y: 226 },
    /** A falling drop (juice, oil, water): its round bottom. */
    drop: { x: 60, y: 106 },
  },
  /** The cookies' art geometry (README-cookies.md). */
  cookies: {
    /** cookie-dough-flat and baking-tray (1000x700): the six slot centres (3 x 2); a cookie at the sheet's scale fills one. */
    slots: [[220, 215], [500, 215], [780, 215], [220, 485], [500, 485], [780, 485]] as readonly (readonly [number, number])[],
    /** cutter-* (320x320): the cutting edge's centre; on a slot centre at the sheet's scale it matches the cookie. */
    cutterPress: { x: 160, y: 172 },
    /** flour-bag and sugar-jar: their open mouths. */
    flourMouth: { x: 200, y: 96 },
    sugarMouth: { x: 170, y: 92 },
    /** On batter-stage-0 (prep-bowl frame): where the butter's base and the yolk land; butter-cube's base, its scale x bowl. */
    butterAt: { x: 262, y: 150 },
    yolkAt: { x: 372, y: 150 },
    butterBase: { x: 146, y: 196 },
    butterScale: 0.42,
    /** egg-*: the tap point (the shell's bottom) and egg-3's drop point. */
    eggTap: { x: 200, y: 368 },
    eggDrop: { x: 200, y: 414 },
    /** The tray in the oven: its centre in the 700x800 oven frame and its scale x the oven's. */
    ovenTray: { x: 350, y: 468, scale: 0.36 },
    /** A decoration on a cookie drawn at scale c: blobs and sprinkles 0.85 c, a candy dot 0.4 c. */
    stamp: 0.85,
    candy: 0.4,
  },
  /** The smoothie's art geometry (README-smoothie.md, scenes-smoothie.js `SMOOTHIE`). */
  /**
   * The soup (round 9), from README-soup.md. The pot's layers share an 800x700 frame; the stove top (1200x920, from
   * the pancakes) is drawn under it, and the knob and the flame sit on the stove, given here in the pot's frame.
   */
  /** The birthday cake (round 9), from README-cake.md: the candle's base (where it stands) and its flame point. */
  cake: {
    /**
     * candle (260x460, README-cake.md): the base that lands where she puts it down, and the wick tip where the flame
     * (or the wisp of smoke) stands. Each of those two is placed by its own foot, not by its centre.
     */
    candleSize: [260, 460] as const,
    candleBase: { x: 130, y: 414 },
    candleFlame: { x: 130, y: 90 },
    /** cake-baked (720x720): the baked cake's radius in its own frame (= the pizza's), the candles are sized from it. */
    cakeRadius: 334,
    /** flame-candle (200x280) and smoke-puff (240x360): the foot that sits on the candle's flame point. */
    flameFoot: { x: 100, y: 236 },
    smokeFoot: { x: 120, y: 340 },
  },
  soup: {
    /** pot-back / pot-front / pot-heap-* / soup-stage-* (1000x760): the contents window inside the rim. */
    potOpening: { x: 500, y: 258, rx: 368, ry: 92 },
    /**
     * The cooktop (`stove-top`, 1200x920, from the pancakes) is drawn under the pot at the pot's own scale, with its
     * top-left at the pot frame's (20, 100): the pot's foot then sits in front of the big burner instead of behind
     * its grate arms. These three are that stove's points, given in the pot's frame; the cooktop sticks out to
     * `STOVE_RIGHT` (stage.ts) on the right and to y 1020 below.
     */
    stoveAt: { x: 620, y: 560 },
    flameAt: { x: 500, y: 550 },
    knobAt: { x: 1060, y: 852 },
    /** water-jug (360x520): the tip of its lip, where the water leaves it. */
    jugMouth: { x: 52, y: 118 },
    /** soup-portion (a full ladle, 360x420): the soup in the cup, the point that follows the finger. */
    portionAnchor: { x: 150, y: 250 },
    /** peeler (420x460): the blade line's midpoint, which rides on the vegetable (the grip is 266 above it). */
    peelerBlade: { x: 210, y: 358 },
  },
  smoothie: {
    /** blender-jar-* (600x800): the rim ellipse, the seat (bottom of the blade collar), the pouring lip. */
    jarMouth: { x: 300, y: 118, rx: 208, ry: 30 },
    jarSeat: { x: 300, y: 776 },
    jarLip: { x: 72, y: 100 },
    /** blender-base (700x520) at the jar's scale: its seat meets the jar's seat; the button's centre (button frame 280, centre 140). */
    baseSeat: { x: 350, y: 108 },
    button: { x: 350, y: 306 },
    /** blender-lid (480x240): the plug's bottom centre, put on the jar's mouth. */
    lidSeat: { x: 240, y: 150 },
    /** milk-carton (320x560): where the milk leaves it. */
    cartonSpout: { x: 38, y: 118 },
    /** glass-* (320x440): the rim, and the liquid from its surface (y 98) to the inside bottom (y 370). */
    glassRim: { x: 160, y: 72, rx: 100, ry: 18 },
    fillTop: 98,
    fillBottom: 370,
    /** The smoothie's colour (drops, the pouring stream). */
    tint: 0xf6a186,
  },
  /** The pancakes' art geometry (README-pancakes.md, scenes-pancakes.js `PANC`). */
  pancakes: {
    /** stove-top (1200x920): the burner (the pan's disc centre goes on it, at the stove's scale) and the knob's centre. */
    burner: { x: 480, y: 450 },
    knob: { x: 1040, y: 752 },
    /** pan (1240x800): its disc's centre and the inside radius (the puddle family and the flame centre on it). */
    panCentre: { x: 400, y: 400 },
    panR: 336,
    /** ladle (400x640): where the batter leaves it. */
    ladlePour: { x: 40, y: 458 },
    /** batter-puddle-* / pancake-* (680x680): the pancake's radius (golden: 240); plate-big's top pancake: 290. */
    cakeR: 240,
    plateTop: 290,
    /** syrup-bottle (260x520): its nozzle. */
    syrupTip: { x: 130, y: 506 },
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
