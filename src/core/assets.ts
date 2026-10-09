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
/** The guests' layers are made at this fraction of their native size (they are never shown bigger). */
import { FARM_IMAGES, FARM_SFX, FARM_VOICE } from './farmAssets';

export const GUEST_RASTER = 0.75;

/** The clinic's close-ups (and what is drawn in them) are shown up to 1.7x their 520 frame: rasterized that big. */
const ZOOM_RASTER = 1.7;

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
  /** The living window (visual round 4, core/scenery.ts): a bird's two wing frames and a cloud, slid across the glass. */
  'kitchen-bird-up': { size: [58, 44] },
  'kitchen-bird-down': { size: [58, 44] },
  'kitchen-cloud': { size: [156, 62] },
  /** More around the kitchen (visual round 5, core/scenery.ts): the garden in the window's lower panes, the cat on the
   * sill (body, tail, three heads), the clock and its hands, the child's drawing, one thing on the sill per recipe, the
   * cake's bunting. Each is its own box in the background's frame (gen_kitchen_view.py). */
  'kitchen-garden': { size: [400, 96] },
  'kitchen-cat-body': { size: [180, 168] },
  'kitchen-cat-tail': { size: [180, 168] },
  'kitchen-cat-sleep': { size: [180, 168] },
  'kitchen-cat-awake': { size: [180, 168] },
  'kitchen-cat-yawn': { size: [180, 168] },
  'kitchen-clock': { size: [120, 120] },
  'kitchen-clock-hour': { size: [120, 120] },
  'kitchen-clock-minute': { size: [120, 120] },
  'kitchen-drawing': { size: [156, 180] },
  'kitchen-sill-flowers': { size: [124, 112] },
  'kitchen-sill-tomato': { size: [124, 112] },
  'kitchen-sill-lemons': { size: [124, 112] },
  'kitchen-sill-cookies': { size: [124, 112] },
  'kitchen-sill-fruit': { size: [124, 112] },
  'kitchen-sill-honey': { size: [124, 112] },
  'kitchen-sill-carrots': { size: [124, 112] },
  'kitchen-sill-present': { size: [124, 112] },
  'kitchen-sill-berries': { size: [124, 112] },
  'kitchen-bunting-l': { size: [476, 76] },
  'kitchen-bunting-r': { size: [496, 76] },
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
  /** Visual round 6: more poses on the same pivots (Mom.ts `pose`): watching with her chin on her hand, a thumbs-up,
   * clapping (both arms), an open palm held out while she talks to the child. */
  'mom-arm-right-chin': { size: [800, 800] },
  'mom-arm-right-thumb': { size: [800, 800] },
  'mom-arm-right-clap': { size: [800, 800] },
  'mom-arm-left-clap': { size: [800, 800] },
  'mom-arm-left-open': { size: [800, 800] },
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
  /** The recipe challenges (PR A): the soap bar on the sink's rim, tapped before rubbing (soap first). */
  'soap-bar': { size: [240, 160] },
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
  /**
   * The guests round (assets-src/images-b-guests): the turtle, the giraffe and the penguin, each in layers on one
   * 600x700 frame like Pipa's (body, eyes x4, mouths x4: the fourth is their own funny reaction). They are shown at
   * most at 0.75, so their textures are made at 0.75 of native. Their layers load when the sharing
   * starts; the two not invited are freed at once.
   * The giraffe's neck goes on up above her frame. The badges are what the child taps to invite one.
   */
  'guest-turtle-body': { size: [600, 700], raster: GUEST_RASTER },
  'guest-turtle-eyes-open': { size: [600, 700], raster: GUEST_RASTER },
  'guest-turtle-eyes-blink': { size: [600, 700], raster: GUEST_RASTER },
  'guest-turtle-eyes-happy': { size: [600, 700], raster: GUEST_RASTER },
  'guest-turtle-eyes-surprised': { size: [600, 700], raster: GUEST_RASTER },
  'guest-turtle-mouth-closed': { size: [600, 700], raster: GUEST_RASTER },
  'guest-turtle-mouth-open': { size: [600, 700], raster: GUEST_RASTER },
  'guest-turtle-mouth-chew': { size: [600, 700], raster: GUEST_RASTER },
  'guest-turtle-mouth-funny': { size: [600, 700], raster: GUEST_RASTER },
  'guest-giraffe-body': { size: [600, 700], raster: GUEST_RASTER },
  'guest-giraffe-eyes-open': { size: [600, 700], raster: GUEST_RASTER },
  'guest-giraffe-eyes-blink': { size: [600, 700], raster: GUEST_RASTER },
  'guest-giraffe-eyes-happy': { size: [600, 700], raster: GUEST_RASTER },
  'guest-giraffe-eyes-surprised': { size: [600, 700], raster: GUEST_RASTER },
  'guest-giraffe-mouth-closed': { size: [600, 700], raster: GUEST_RASTER },
  'guest-giraffe-mouth-open': { size: [600, 700], raster: GUEST_RASTER },
  'guest-giraffe-mouth-chew': { size: [600, 700], raster: GUEST_RASTER },
  'guest-giraffe-mouth-funny': { size: [600, 700], raster: GUEST_RASTER },
  'guest-penguin-body': { size: [600, 700], raster: GUEST_RASTER },
  'guest-penguin-eyes-open': { size: [600, 700], raster: GUEST_RASTER },
  'guest-penguin-eyes-blink': { size: [600, 700], raster: GUEST_RASTER },
  'guest-penguin-eyes-happy': { size: [600, 700], raster: GUEST_RASTER },
  'guest-penguin-eyes-surprised': { size: [600, 700], raster: GUEST_RASTER },
  'guest-penguin-mouth-closed': { size: [600, 700], raster: GUEST_RASTER },
  'guest-penguin-mouth-open': { size: [600, 700], raster: GUEST_RASTER },
  'guest-penguin-mouth-chew': { size: [600, 700], raster: GUEST_RASTER },
  'guest-penguin-mouth-funny': { size: [600, 700], raster: GUEST_RASTER },
  'guest-giraffe-neck': { size: [600, 1200], raster: GUEST_RASTER },
  'guest-card-turtle': { size: [240, 240] },
  'guest-card-giraffe': { size: [240, 240] },
  'guest-card-penguin': { size: [240, 240] },
  // ---- The fruit skewers (round 13, assets-src/images-b-skewers, tools/gen_skewers.py). Anchors: ART.skewers.
  'card-skewers': { size: [400, 520] },
  /** The stick, drawn standing (point at the top); the game lays it down, point to the right. */
  'skewer-stick': { size: [60, 720] },
  /** The recipe's board: a wooden tray with a napkin; Mom's model and her three skewers lie on it in rows. */
  'skewer-tray': { size: [800, 600] },
  'photo-frame-skewers': { size: [700, 780] },
  // ---- The garden (a stage that is not cooking: plant, water, grow, pick; assets-src/images-b-garden, tools/gen_garden.py).
  // Anchors: ART.garden.
  'card-garden': { size: [400, 520] },
  'bg-garden': { size: [2400, 1080] },
  /** The raised bed: soil on top (the plants stand on ART.garden.soilY), planks below; `-front` is the planks alone, over the carrots. */
  'garden-bed': { size: [1300, 360] },
  'garden-bed-front': { size: [1300, 360] },
  'garden-hole': { size: [180, 80] },
  'garden-mound': { size: [200, 90] },
  'garden-seed': { size: [50, 62] },
  'seed-packet-tomato': { size: [240, 320] },
  'seed-packet-strawberry': { size: [240, 320] },
  'seed-packet-carrot': { size: [240, 320] },
  /** The plants stand on their bottom centre (the soil line). */
  'garden-sprout': { size: [140, 180] },
  'plant-tomato-1': { size: [260, 380] },
  'plant-strawberry-1': { size: [260, 380] },
  'plant-carrot-1': { size: [260, 380] },
  'plant-tomato-2': { size: [400, 640] },
  'plant-strawberry-2': { size: [420, 300] },
  'garden-flower': { size: [80, 80] },
  'garden-tomato': { size: [140, 150] },
  'garden-strawberry': { size: [130, 150] },
  /** A whole carrot, standing: leaves on top, the root from ART.garden.carrotTop down. */
  'garden-carrot': { size: [180, 420] },
  'watering-can': { size: [440, 320] },
  'garden-sun': { size: [300, 300] },
  'garden-cloud': { size: [580, 270] },
  'garden-snail': { size: [260, 190] },
  'garden-leaf': { size: [240, 190] },
  'garden-basket': { size: [440, 320] },
  'garden-basket-front': { size: [440, 320] },
  // ---- Two mini-games that are not cooking (research/minigames-spec.md; assets-src/images-b-minigames,
  // tools/gen_minigames.py). The market reuses the whole vegetables and fruit and the garden's basket. Anchors: ART.dishes.
  'card-market': { size: [400, 520] },
  'bg-market': { size: [2400, 1080] },
  /** The stall, stretched uniformly over its width: the striped awning, the upper shelf (its top at y 16), the counter
   * (its top at y 30), a pole at each end, and the front of a crate for every good. */
  'market-awning': { size: [1600, 260] },
  'market-shelf': { size: [1600, 90] },
  'market-counter': { size: [1600, 300] },
  'market-pole': { size: [54, 900] },
  'market-crate': { size: [300, 150] },
  /** The shopping list: a note on a peg; the pictures are laid on it in code. */
  'market-list': { size: [600, 320] },
  'card-dishes': { size: [400, 520] },
  'dish-plate-blue': { size: [300, 300] },
  'dish-plate-yellow': { size: [300, 300] },
  'dish-plate-pink': { size: [300, 300] },
  /** A mug, side view, handle on the right; it hangs from its handle's top (ART.dishes.cupHook). */
  'dish-cup-blue': { size: [280, 260] },
  'dish-cup-yellow': { size: [280, 260] },
  'dish-cup-pink': { size: [280, 260] },
  /** The food on a dirty dish (it fades as she scrubs). */
  'dish-mess': { size: [300, 300] },
  'dish-sponge': { size: [240, 150] },
  /** The drying rack: a column per colour (blue, yellow, pink), a hook on top (cups), a slot of dowels below (plates). */
  'dish-rack': { size: [960, 720] },
  /** The tea towel hanging from its peg (the peg at the top centre); a rinsed dish is dried on it (challenge round). */
  'dishes-towel': { size: [220, 320] },
  /** Level 2 (garden round 2): a weed standing in a hole (the soil line at ART.garden.weedTop, its root below), the
   *  puddle of too much water, and the bunny (facing left, sitting on its feet at the bottom) with its wish. */
  'garden-weed': { size: [200, 320] },
  'garden-puddle': { size: [260, 80] },
  'garden-bunny': { size: [320, 300] },
  /** Garden round 3: the scarecrow (post, crossbar, sack head; a hat sits on ART.garden.scareHat, a shirt is centred on
   *  ART.garden.scareShirt), its hats (brim's middle at ART.garden.hatBrim) and shirts in three colours, the birds that
   *  come for the seeds (facing left, standing at the bottom; two wing frames), and the butterfly that visits the flowers. */
  'garden-scarecrow': { size: [380, 640] },
  'garden-hat-red': { size: [240, 160] },
  'garden-hat-blue': { size: [240, 160] },
  'garden-hat-yellow': { size: [240, 160] },
  'garden-shirt-red': { size: [320, 260] },
  'garden-shirt-blue': { size: [320, 260] },
  'garden-shirt-yellow': { size: [320, 260] },
  'garden-bird-up': { size: [170, 140] },
  'garden-bird-down': { size: [170, 140] },
  'garden-butterfly': { size: [200, 160] },
  /** Challenge round (PR B): unripe fruit (the ripe ones' frames), a second basket for sorting (level 2; the same shape,
   *  blue; `-front` over what is in it), the caterpillar hiding under a leaf (facing left) and the jar it goes into
   *  (its mouth at ART.garden.jarMouth). */
  'garden-tomato-green': { size: [140, 150] },
  'garden-strawberry-green': { size: [130, 150] },
  'garden-basket-2': { size: [440, 320] },
  'garden-basket-2-front': { size: [440, 320] },
  'garden-caterpillar': { size: [220, 120] },
  'garden-jar': { size: [220, 260] },
  /** Market round 2 (paying): a coin, Mom's purse, the price slate (the price is drawn in code on ART.market.slateFace). */
  'market-coin': { size: [110, 110] },
  'market-purse': { size: [260, 230] },
  'market-slate': { size: [380, 300] },
  /** Market, more challenge (research/challenge-spec.md M-E1, M-H1, M-H2; gen_minigames.py): the balance scale in three
   * parts (anchors ART.market.scale), the big coin (worth two), the three category cards (slots on ART.market.catSlots). */
  'market-scale-base': { size: [400, 440] },
  'market-scale-beam': { size: [560, 60] },
  'market-scale-pan': { size: [260, 220] },
  'market-coin-big': { size: [150, 150] },
  'market-cat-green': { size: [600, 320] },
  'market-cat-tree': { size: [600, 320] },
  'market-cat-round': { size: [600, 320] },
  // ---- The art corner (research/drawing-stages-spec.md; assets-src/images-b-art, tools/gen_art.py). The pictures she
  // traces, joins and colours are drawn in code (core/artPictures.ts). Anchors: ART.art.
  'card-art': { size: [400, 520] },
  /** The easel: the sheet lies on its board at ART.art.sheet, the legs reach down past the counter. */
  'art-easel': { size: [1000, 1000] },
  'photo-frame-art': { size: [700, 780] },
  'art-pick-trace': { size: [300, 300] },
  'art-pick-dots': { size: [300, 300] },
  'art-pick-colour': { size: [300, 300] },
  'art-pick-mirror': { size: [300, 300] },
  'art-pick-steam': { size: [300, 300] },
  /** A pot of paint with a brush in it (the paint's top at about y 100). */
  'art-pot-red': { size: [220, 240] },
  'art-pot-yellow': { size: [220, 240] },
  'art-pot-blue': { size: [220, 240] },
  'art-pot-green': { size: [220, 240] },
  'art-pot-pink': { size: [220, 240] },
  'art-pot-purple': { size: [220, 240] },
  'art-pot-orange': { size: [220, 240] },
  'art-pot-rainbow': { size: [220, 240] },
  /** The steamy window: the view (sky, garden, fence), and the frame over it with the glass open (ART.art.glass). */
  'art-window-view': { size: [800, 640] },
  'art-window-frame': { size: [800, 640] },
  'art-find-sun': { size: [240, 240] },
  'art-find-bird': { size: [200, 160] },
  'art-find-cat': { size: [260, 220] },
  'art-find-rainbow': { size: [360, 210] },
  // the sixth kind, stamps (challenge round): its card and the four stamps (their prints are drawn in code, STAMP in artPictures.ts)
  'art-pick-stamps': { size: [300, 300] },
  'art-stamp-sun': { size: [240, 240] },
  'art-stamp-cloud': { size: [240, 240] },
  'art-stamp-flower': { size: [240, 240] },
  'art-stamp-bird': { size: [240, 240] },
  // ---- The clinic world (research/clinic-spec.md; assets-src/images-b-clinic, tools/gen_clinic.py). Anchors: ART.clinic.
  /** The title's two worlds: cook with Mom, or help the patients with Mom the nurse (shown at 1.4x like btn-play). */
  // the title's two games (clinic round 3): their lettering is the title art, like the logo's
  'world-card-kitchen': { size: [700, 760] },
  'world-card-clinic': { size: [700, 760] },
  /** Mom the nurse: her pinafore (in place of mom-body) and her cap (after mom-hair); same 800 frame. */
  'mom-body-nurse': { size: [800, 800] },
  'mom-cap-nurse': { size: [800, 800] },
  /** The treatment room (a counter like the kitchen's) and the waiting room (a floor), 2400x1080 like the kitchen. */
  'bg-clinic': { size: [2400, 1080] },
  'bg-clinic-wait': { size: [2400, 1080] },
  'clinic-bed': { size: [900, 320] },
  'clinic-bench': { size: [1500, 420] },
  'clinic-slot': { size: [240, 240] },
  'clinic-chart': { size: [300, 380] },
  'tool-thermometer': { size: [240, 240] },
  'tool-stethoscope': { size: [240, 240] },
  'tool-plaster': { size: [240, 240] },
  'tool-cream': { size: [240, 240] },
  'tool-spray': { size: [240, 240] },
  'tool-tweezers': { size: [240, 240] },
  'tool-magnifier': { size: [240, 240] },
  'tool-toothbrush': { size: [240, 240] },
  'tool-cup': { size: [240, 240] },
  'tool-syrup': { size: [240, 240] },
  'tool-cloth': { size: [240, 240] },
  'tool-hotbottle': { size: [240, 240] },
  'tool-tissue': { size: [240, 240] },
  'tool-magnet': { size: [240, 240] },
  /** The close-ups (light grey, tinted to the patient in the game; the mouth is not tinted) and the magnifier's rim. */
  'lens-knee': { size: [520, 520], raster: ZOOM_RASTER },
  'lens-paw': { size: [520, 520], raster: ZOOM_RASTER },
  'lens-tummy': { size: [520, 520], raster: ZOOM_RASTER },
  'lens-mouth': { size: [520, 520], raster: ZOOM_RASTER },
  'lens-ring': { size: [600, 600], raster: ZOOM_RASTER },
  // ---- The clinic, round 3 (research/clinic-doctor-games.md; images-b-clinic/tools/gen_clinic3.py): the eye, the ear and
  // the x-ray close-ups (lens-eye is tinted, its eyeball and the redness are not), the things to clean, fix and take out
  'lens-eye': { size: [520, 520], raster: ZOOM_RASTER },
  'lens-eye-ball': { size: [520, 520], raster: ZOOM_RASTER },
  'clinic-eye-red': { size: [520, 520], raster: ZOOM_RASTER },
  'lens-ear': { size: [520, 520], raster: ZOOM_RASTER },
  'lens-xray': { size: [520, 520], raster: ZOOM_RASTER },
  'germ-a': { size: [130, 130], raster: ZOOM_RASTER },
  'germ-b': { size: [130, 130], raster: ZOOM_RASTER },
  'germ-c': { size: [130, 130], raster: ZOOM_RASTER },
  'tooth-hole': { size: [70, 70], raster: ZOOM_RASTER },
  'tooth-star': { size: [90, 90], raster: ZOOM_RASTER },
  'food-bit': { size: [90, 80], raster: ZOOM_RASTER },
  'eye-speck': { size: [90, 50], raster: ZOOM_RASTER },
  'ear-wax': { size: [90, 80], raster: ZOOM_RASTER },
  'ear-bug': { size: [130, 120], raster: ZOOM_RASTER },
  'tool-filler': { size: [240, 240] },
  'tool-cotton': { size: [240, 240] },
  'tool-eyedrops': { size: [240, 240] },
  'tool-swab': { size: [240, 240] },
  'tool-light': { size: [240, 240] },
  'tool-icepack': { size: [240, 240] },
  'tool-xray': { size: [240, 240] },
  'sick-eye': { size: [200, 200] },
  'sick-ear': { size: [200, 200] },
  // the clinic, round 4 (gen_kids.py, gen_clinic4.py): four children, the skin and hand close-ups, sting, bites, mud
  'kid-lily-body': { size: [600, 700], raster: GUEST_RASTER },
  'kid-lily-eyes-open': { size: [600, 700], raster: GUEST_RASTER },
  'kid-lily-eyes-blink': { size: [600, 700], raster: GUEST_RASTER },
  'kid-lily-eyes-happy': { size: [600, 700], raster: GUEST_RASTER },
  'kid-lily-eyes-surprised': { size: [600, 700], raster: GUEST_RASTER },
  'kid-lily-mouth-closed': { size: [600, 700], raster: GUEST_RASTER },
  'kid-lily-mouth-open': { size: [600, 700], raster: GUEST_RASTER },
  'kid-lily-mouth-chew': { size: [600, 700], raster: GUEST_RASTER },
  'kid-leo-body': { size: [600, 700], raster: GUEST_RASTER },
  'kid-leo-eyes-open': { size: [600, 700], raster: GUEST_RASTER },
  'kid-leo-eyes-blink': { size: [600, 700], raster: GUEST_RASTER },
  'kid-leo-eyes-happy': { size: [600, 700], raster: GUEST_RASTER },
  'kid-leo-eyes-surprised': { size: [600, 700], raster: GUEST_RASTER },
  'kid-leo-mouth-closed': { size: [600, 700], raster: GUEST_RASTER },
  'kid-leo-mouth-open': { size: [600, 700], raster: GUEST_RASTER },
  'kid-leo-mouth-chew': { size: [600, 700], raster: GUEST_RASTER },
  'kid-mia-body': { size: [600, 700], raster: GUEST_RASTER },
  'kid-mia-eyes-open': { size: [600, 700], raster: GUEST_RASTER },
  'kid-mia-eyes-blink': { size: [600, 700], raster: GUEST_RASTER },
  'kid-mia-eyes-happy': { size: [600, 700], raster: GUEST_RASTER },
  'kid-mia-eyes-surprised': { size: [600, 700], raster: GUEST_RASTER },
  'kid-mia-mouth-closed': { size: [600, 700], raster: GUEST_RASTER },
  'kid-mia-mouth-open': { size: [600, 700], raster: GUEST_RASTER },
  'kid-mia-mouth-chew': { size: [600, 700], raster: GUEST_RASTER },
  'kid-sam-body': { size: [600, 700], raster: GUEST_RASTER },
  'kid-sam-eyes-open': { size: [600, 700], raster: GUEST_RASTER },
  'kid-sam-eyes-blink': { size: [600, 700], raster: GUEST_RASTER },
  'kid-sam-eyes-happy': { size: [600, 700], raster: GUEST_RASTER },
  'kid-sam-eyes-surprised': { size: [600, 700], raster: GUEST_RASTER },
  'kid-sam-mouth-closed': { size: [600, 700], raster: GUEST_RASTER },
  'kid-sam-mouth-open': { size: [600, 700], raster: GUEST_RASTER },
  'kid-sam-mouth-chew': { size: [600, 700], raster: GUEST_RASTER },
  'lens-skin': { size: [520, 520], raster: ZOOM_RASTER },
  'lens-hand': { size: [520, 520], raster: ZOOM_RASTER },
  'clinic-sting': { size: [110, 100], raster: ZOOM_RASTER },
  'clinic-bite': { size: [90, 80], raster: ZOOM_RASTER },
  'clinic-gnat': { size: [120, 110], raster: ZOOM_RASTER },
  'clinic-mud': { size: [110, 100], raster: ZOOM_RASTER },
  'clinic-foam': { size: [110, 100], raster: ZOOM_RASTER },
  'tool-sponge': { size: [240, 240] },
  'tool-bugspray': { size: [240, 240] },
  'sick-sting': { size: [200, 200] },
  'sick-bites': { size: [200, 200] },
  'sick-dirty': { size: [200, 200] },
  'clinic-done': { size: [120, 120] },
  'clinic-scrape': { size: [200, 140], raster: ZOOM_RASTER },
  'clinic-dust': { size: [220, 160], raster: ZOOM_RASTER },
  'clinic-splinter': { size: [160, 70], raster: ZOOM_RASTER },
  'clinic-cream': { size: [180, 120], raster: ZOOM_RASTER },
  'clinic-dirt': { size: [100, 90], raster: ZOOM_RASTER },
  'clinic-cheek': { size: [110, 70] },
  'clinic-sweat': { size: [60, 80] },
  'clinic-bump': { size: [120, 110] },
  'clinic-spot': { size: [70, 70] },
  'clinic-toy': { size: [150, 130], raster: ZOOM_RASTER },
  'sticker-star': { size: [200, 200] },
  'sticker-heart': { size: [200, 200] },
  'sticker-smile': { size: [200, 200] },
  'sick-fever': { size: [200, 200] },
  'sick-cough': { size: [200, 200] },
  'sick-tummy': { size: [200, 200] },
  'sick-tooth': { size: [200, 200] },
  'sick-knee': { size: [200, 200] },
  'sick-paw': { size: [200, 200] },
  'sick-spots': { size: [200, 200] },
  'sick-cold': { size: [200, 200] },
  'sick-toy': { size: [200, 200] },
  'photo-frame-clinic': { size: [700, 780] },
  // the farm (core/farmAssets.ts)
  ...FARM_IMAGES,
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
  'kitchen-bird-up', 'kitchen-bird-down', 'kitchen-cloud',
];

/** More around the kitchen (visual round 5, core/scenery.ts): core, but loaded after the title's art; each joins the
 * kitchen as soon as it is in. */
export const SCENERY_KEYS: readonly ImageKey[] = [
  'kitchen-garden', 'kitchen-cat-body', 'kitchen-cat-tail', 'kitchen-cat-sleep', 'kitchen-cat-awake',
  'kitchen-cat-yawn', 'kitchen-clock', 'kitchen-clock-hour', 'kitchen-clock-minute', 'kitchen-drawing',
  'kitchen-sill-flowers', 'kitchen-sill-tomato', 'kitchen-sill-lemons', 'kitchen-sill-cookies', 'kitchen-sill-fruit',
  'kitchen-sill-honey', 'kitchen-sill-carrots', 'kitchen-sill-present', 'kitchen-sill-berries', 'kitchen-bunting-l',
  'kitchen-bunting-r',
];

export const CORE_IMAGES: readonly ImageKey[] = [
  'bg-kitchen-landscape', ...KITCHEN_KEYS, ...SCENERY_KEYS, 'logo-cooking-with-mom', 'star', 'btn-play', 'world-card-kitchen', 'world-card-clinic', 'btn-home', 'btn-done', 'hand-hint',
  'card-pizza', 'card-salad', 'card-cookies', 'card-smoothie', 'card-pancakes', 'card-soup', 'card-cake',
  'card-skewers', 'card-garden', 'card-market', 'card-dishes', 'card-art', 'card-farm',
  'character-body', 'character-eyes-open', 'character-eyes-blink', 'character-eyes-surprised', 'character-eyes-happy',
  'character-mouth-closed', 'character-mouth-open', 'character-mouth-chew',
  'mom-arm-right', 'mom-body', 'mom-head', 'mom-hair', 'mom-eyes-open', 'mom-eyes-blink', 'mom-eyes-happy',
  'mom-eyes-surprised', 'mom-mouth-smile', 'mom-mouth-talk', 'mom-mouth-open', 'mom-mouth-chew', 'mom-arm-left',
  'mom-arm-right-rest', 'mom-arm-left-reach',
  'mom-arm-right-chin', 'mom-arm-right-thumb', 'mom-arm-right-clap', 'mom-arm-left-clap', 'mom-arm-left-open',
  'mom-hand-point', 'mom-hand-roll', 'mom-hand-spread', 'mom-hand-sprinkle', 'mom-hand-grab', 'mom-hand-press',
  'mom-hand-knife', 'mom-hand-mitt',
];
const WASH: ImageKey[] = ['sink-basin', 'faucet', 'water-stream', 'kid-hands', 'bubble', 'soap-bar'];
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
      'vo-slice-pipa', 'vo-stir', 'vo-temp', 'vo-cut', 'vo-cut-careful', 'name-tomato', 'name-onion',
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
      'vo-serve', 'vo-squeeze', 'vo-tear', 'vo-wash-veg', 'vo-wash-veg-done', 'vo-cut', 'vo-cut-careful', 'name-tomato',
      'name-onion',
      // (the hard level's pour order names the lettuce)
      'name-lettuce',
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
    // (the hard level's "find the tool" before the milk)
    'spoon-wood',
  ],
  sounds: [
    'blender', 'lid-click', 'slurp', 'glass-pour', 'name-banana', 'name-strawberry', 'name-mango', 'name-kiwi',
    'vo-wash-fruit', 'vo-wash-veg-done', 'vo-choose-fruit', 'vo-into-blender', 'vo-milk', 'vo-lid', 'vo-blend', 'vo-blend-done',
    'vo-pour-glass', 'vo-share-smoothie', 'vo-glass-mom', 'vo-glass-pipa', 'vo-smoothie-yum', 'vo-photo-smoothie',
    'vo-finale-smoothie', 'vo-cut', 'vo-cut-careful',
  ],
};

RECIPE_ASSETS.pancakes = {
  images: [
    ...WASH, ...PREP_BOWL, 'topping-bin', 'knife', 'flour-bag', 'batter-stage-0', 'milk-carton', 'milk-drop', 'egg-1', 'egg-2', 'egg-3',
    'pancake-batter-0', 'pancake-batter-1', 'pancake-batter-2', 'pancake-batter-3', 'stove-top', 'stove-knob-off',
    'stove-knob-on', 'flame', 'pan', 'ladle', 'batter-puddle-1', 'batter-puddle-2', 'batter-puddle-3', 'pancake-bubbles',
    'pancake-golden', 'plate-big', 'syrup-bottle', 'syrup-blob', 'berry', 'banana-coin', 'butter-pat',
    'photo-frame-pancakes',
    // (the big-chef level's "find the tool" shows it beside the wooden spoon)
    'grater',
  ],
  sounds: [
    'sizzle', 'egg-crack', 'flour-poof', 'glass-pour', 'vo-flour', 'vo-milk', 'vo-egg', 'vo-stir-batter', 'vo-stove',
    'vo-ladle', 'vo-bubbles', 'vo-flip', 'vo-flip-done', 'vo-more-pancake', 'vo-decorate-pancakes', 'vo-share-pancakes',
    'vo-pancake-mom', 'vo-pancake-pipa', 'vo-pancake-yum', 'vo-photo-pancakes', 'vo-finale-pancakes',
    // (Pipa's wish in decorating names the banana: DECORATE_NAMES in DecorateStep)
    'name-banana',
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
    // (the big-chef level's "find the tool": a fourth tool)
    'grater',
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
    // (the big-chef level's "find the tool" shows it beside the wooden spoon)
    'grater',
  ],
  sounds: [
    'blow', 'egg-crack', 'flour-poof', 'glass-pour', 'vo-flour', 'vo-sugar', 'vo-milk', 'vo-egg',
    'vo-stir-cake', 'vo-pour-pan', 'vo-pick-frosting', 'name-pink', 'name-white', 'name-chocolate',
    'vo-frost', 'vo-decorate-cake', 'vo-candles', 'vo-wish', 'vo-blow-more', 'vo-blown',
    'vo-share-cake', 'vo-cake-mom', 'vo-cake-pipa', 'vo-cake-yum', 'vo-photo-cake', 'vo-finale-cake', 'vo-temp',
  ],
};

RECIPE_ASSETS.skewers = {
  images: [
    ...WASH, ...CHOP, ...fruit('banana', 'strawberry', 'mango', 'kiwi'),
    'colander-fruit', 'water-drop', 'skewer-stick', 'skewer-tray', 'photo-frame-skewers',
  ],
  sounds: [
    'name-banana', 'name-strawberry', 'name-mango', 'name-kiwi', 'vo-wash-fruit', 'vo-wash-veg-done', 'vo-choose-fruit',
    'vo-cut', 'vo-cut-careful', 'vo-thread', 'vo-copy', 'vo-same', 'vo-next', 'vo-pattern', 'vo-new-pattern', 'vo-own',
    'vo-share-skewers', 'vo-skewer-mom', 'vo-skewer-pipa', 'vo-skewer-yum', 'vo-photo-skewers', 'vo-finale-skewers',
  ],
};
/** The invitation badges of the guests: every recipe ends by sharing, so every recipe loads them. */
export const GUEST_CARDS: readonly ImageKey[] = ['guest-card-turtle', 'guest-card-giraffe', 'guest-card-penguin'];
for (const r of Object.values(RECIPE_ASSETS)) r.images = [...r.images, ...GUEST_CARDS];
/** The outdoors song (core/audio.ts `music`) for the garden and the market: decoded on their cards, freed at home. The
 * kitchen's song is core. The art song is the art corner's (ArtScene), listed the same way. */
const OUTSIDE_SONG = ['music-outside-base', 'music-outside-tune', 'music-outside-party', 'music-outside-up'];
const ART_SONG = ['music-art-base', 'music-art-tune', 'music-art-party', 'music-art-up'];
/** The garden (not a recipe, its own scene, GardenScene): loaded on its card like a recipe, released at home. */
RECIPE_ASSETS.garden = {
  images: [
    'bg-garden', 'garden-bed', 'garden-bed-front', 'garden-hole', 'garden-mound', 'garden-seed', 'seed-packet-tomato',
    'seed-packet-strawberry', 'seed-packet-carrot', 'garden-sprout', 'plant-tomato-1', 'plant-strawberry-1', 'plant-carrot-1',
    'plant-tomato-2', 'plant-strawberry-2', 'garden-flower', 'garden-tomato', 'garden-strawberry', 'garden-carrot',
    'watering-can', 'garden-sun', 'garden-cloud', 'garden-snail', 'garden-leaf', 'garden-basket', 'garden-basket-front',
    'water-drop', 'garden-weed', 'garden-puddle', 'garden-bunny', 'garden-scarecrow', 'garden-hat-red', 'garden-hat-blue',
    'garden-hat-yellow', 'garden-shirt-red', 'garden-shirt-blue', 'garden-shirt-yellow', 'garden-bird-up', 'garden-bird-down',
    'garden-butterfly', 'garden-tomato-green', 'garden-strawberry-green', 'garden-basket-2', 'garden-basket-2-front',
    'garden-caterpillar', 'garden-jar',
  ],
  sounds: [
    'vo-garden-seeds', 'vo-garden-plant', 'vo-garden-water', 'vo-garden-sprout', 'vo-garden-cloud', 'vo-garden-sun',
    'vo-garden-snail', 'vo-garden-snail-yum', 'vo-garden-pick', 'vo-garden-pull', 'vo-garden-done', 'name-tomato',
    'name-strawberry', 'name-carrot', 'tear', 'name-lettuce', 'vo-garden-weeds', 'vo-garden-enough', 'vo-garden-cloud-2',
    'vo-garden-bunny', 'vo-garden-bunny-this', 'vo-garden-bunny-yum', 'vo-garden-rain', 'vo-garden-rainbow', 'vo-garden-birds',
    'vo-garden-hat', 'vo-garden-shirt', 'vo-garden-scare-copy', 'vo-garden-scare-look', 'vo-garden-shoo', 'vo-garden-butterfly',
    'vo-garden-butterfly-done', 'vo-garden-sun-tap', 'name-red', 'name-blue', 'name-yellow', 'name-rainbow', 'name-butterfly',
    'vo-not-ripe', 'vo-one-more-seed', 'vo-sort-basket', 'vo-find-caterpillar', 'vo-caterpillar-found', 'vo-caterpillar-bye',
    ...OUTSIDE_SONG,
  ],
};
/** The two mini-games that are not cooking (MarketScene, DishesScene): loaded on their cards like a recipe. A sound some
 * recipe lists is listed here too (a listed sound is not core; the garden lists name-lettuce); name-pepper is core. */
RECIPE_ASSETS.market = {
  images: [
    'bg-market', 'market-awning', 'market-shelf', 'market-counter', 'market-pole', 'market-crate', 'market-list',
    'garden-basket', 'garden-basket-front', 'veg-tomato-whole', 'veg-carrot-whole', 'veg-cucumber-whole', 'veg-pepper-whole',
    'veg-onion-whole', 'veg-potato-whole', 'veg-mushroom-whole', 'veg-zucchini-whole', 'fruit-banana-whole',
    'fruit-kiwi-whole', 'fruit-mango-whole', 'fruit-strawberry-whole', 'lettuce-head', 'market-coin', 'market-purse',
    'market-slate', 'market-scale-base', 'market-scale-beam', 'market-scale-pan', 'market-coin-big', 'market-cat-green',
    'market-cat-tree', 'market-cat-round',
  ],
  sounds: [
    'vo-market-list', 'vo-market-remember', 'vo-market-not', 'vo-market-pipa', 'vo-market-two', 'vo-market-done',
    'name-tomato', 'name-carrot', 'name-cucumber', 'name-onion', 'name-potato', 'name-mushroom', 'name-zucchini',
    'name-banana', 'name-kiwi', 'name-mango', 'name-strawberry', 'name-lettuce', 'vo-market-guest', 'vo-market-guest-yum',
    'vo-market-mixed', 'vo-market-mixed-yes', 'vo-market-mixed-more', 'vo-market-pay', 'vo-market-pay-dots', 'vo-market-count',
    'vo-market-paid', 'vo-weigh', 'vo-too-heavy', 'vo-need-green', 'vo-need-tree', 'vo-need-round', 'vo-is-green', 'vo-is-tree',
    'vo-is-round', 'vo-big-coin', 'vo-small-coin', ...OUTSIDE_SONG,
  ],
};
RECIPE_ASSETS.dishes = {
  images: [
    ...WASH, 'dish-plate-blue', 'dish-plate-yellow', 'dish-plate-pink', 'dish-cup-blue', 'dish-cup-yellow', 'dish-cup-pink',
    'dish-mess', 'dish-sponge', 'dish-rack', 'water-drop', 'dishes-towel',
  ],
  sounds: [
    'vo-dishes-start', 'vo-dishes-scrub', 'vo-dishes-clean', 'vo-dishes-rack', 'vo-dishes-rack-2', 'vo-dishes-colour',
    'vo-dishes-done', 'name-blue', 'name-yellow', 'name-pink', 'vo-dry', 'vo-dry-first', 'vo-try-sponge', 'vo-biggest-first',
    'name-cup', 'name-plate', 'squeak',
  ],
};
/** The art corner (ArtScene): loaded on its card like a recipe. Names some recipe lists are listed here too. */
RECIPE_ASSETS.art = {
  images: [
    'art-easel', 'photo-frame-art', 'art-pick-trace', 'art-pick-dots', 'art-pick-colour', 'art-pick-mirror', 'art-pick-steam',
    'art-pot-red', 'art-pot-yellow', 'art-pot-blue', 'art-pot-green', 'art-pot-pink', 'art-pot-purple', 'art-pot-orange',
    'art-pot-rainbow', 'art-window-view', 'art-window-frame', 'art-find-sun', 'art-find-bird', 'art-find-cat', 'art-find-rainbow',
    'art-pick-stamps', 'art-stamp-sun', 'art-stamp-cloud', 'art-stamp-flower', 'art-stamp-bird',
  ],
  sounds: [
    'vo-art-what', 'vo-trace', 'vo-trace-done', 'vo-dots', 'vo-dots-done', 'vo-colour', 'vo-colour-copy', 'vo-colour-mom',
    'vo-colour-done', 'vo-mirror', 'vo-mirror-done', 'vo-mirror-plate', 'vo-steam', 'vo-steam-find', 'vo-steam-done',
    'name-sun', 'name-egg', 'name-fish', 'name-ball', 'name-rainbow', 'name-house', 'name-tree', 'name-boat', 'name-butterfly',
    'name-crown', 'name-bird', 'name-cat', 'name-red', 'name-green', 'name-purple', 'name-orange', 'name-heart', 'name-star',
    'name-blue', 'name-yellow', 'name-pink', 'crayon', 'xylo', 'splosh', 'squeak', 'vo-art-stamps', 'vo-find-number',
    'vo-follow-arrows', 'vo-next', 'name-kite', 'name-ice-cream', 'name-balloon', 'name-snail', 'name-cloud', 'name-flower',
    'stamp', ...ART_SONG,
  ],
};
/** The clinic (ClinicScene, the second world, chosen on the title): loaded on its button like a recipe. The patients are
 * the guests' layers (core/guests.ts) and Pipa (core). */
const CLINIC_SONG = ['music-clinic-base', 'music-clinic-tune', 'music-clinic-party', 'music-clinic-up'];
RECIPE_ASSETS.clinic = {
  images: [
    'mom-body-nurse', 'mom-cap-nurse', 'bg-clinic', 'bg-clinic-wait', 'clinic-bed', 'clinic-bench', 'clinic-slot', 'clinic-chart',
    'tool-thermometer', 'tool-stethoscope', 'tool-plaster', 'tool-cream', 'tool-spray', 'tool-tweezers', 'tool-magnifier',
    'tool-toothbrush', 'tool-cup', 'tool-syrup', 'tool-cloth', 'tool-hotbottle', 'lens-knee', 'lens-paw', 'lens-tummy',
    'lens-mouth', 'lens-ring', 'clinic-scrape', 'clinic-dust', 'clinic-splinter', 'clinic-cream', 'clinic-dirt', 'clinic-cheek',
    'clinic-sweat', 'clinic-bump', 'sticker-star', 'sticker-heart', 'sticker-smile', 'sick-fever', 'sick-cough', 'sick-tummy',
    'sick-tooth', 'sick-knee', 'sick-paw', 'photo-frame-clinic', 'bubble', 'water-drop',
    'tool-tissue', 'tool-magnet', 'clinic-spot', 'clinic-toy', 'sick-spots', 'sick-cold', 'sick-toy',
    'lens-eye', 'lens-eye-ball', 'clinic-eye-red', 'lens-ear', 'lens-xray', 'germ-a', 'germ-b', 'germ-c', 'tooth-hole',
    'tooth-star', 'food-bit', 'eye-speck', 'ear-wax', 'ear-bug', 'tool-filler', 'tool-cotton', 'tool-eyedrops', 'tool-swab',
    'tool-light', 'tool-icepack', 'tool-xray', 'sick-eye', 'sick-ear',
    'lens-skin', 'lens-hand', 'clinic-sting', 'clinic-bite', 'clinic-gnat', 'clinic-mud', 'clinic-foam', 'tool-sponge',
    'tool-bugspray', 'sick-sting', 'sick-bites', 'sick-dirty', 'clinic-done',
    ...IMAGE_KEYS.filter((k) => k.startsWith('kid-')),
    ...IMAGE_KEYS.filter((k) => /^guest-(turtle|penguin|giraffe)-/.test(k)),
  ],
  sounds: [
    'vo-clinic-hello', 'vo-clinic-next', 'vo-hi-turtle', 'vo-hi-penguin', 'vo-hi-giraffe', 'vo-hi-pipa', 'vo-sick-fever',
    'vo-sick-cough', 'vo-sick-tummy', 'vo-sick-tooth', 'vo-sick-knee', 'vo-sick-paw', 'vo-clinic-what', 'vo-clinic-look',
    'vo-clinic-plan', 'vo-clinic-first', 'vo-clinic-notyet', 'vo-tool-thermometer', 'vo-thermo-hot', 'vo-thermo-ok',
    'vo-tool-cloth', 'vo-tool-syrup', 'vo-tool-stethoscope', 'vo-stetho-find', 'vo-stetho-heart', 'vo-tool-cup', 'vo-tool-rinse',
    'vo-tool-hotbottle', 'vo-say-aah', 'vo-tool-toothbrush', 'vo-tool-spray', 'vo-tool-cream', 'vo-tool-plaster',
    'vo-tool-tweezers', 'vo-tool-magnifier', 'vo-found-it', 'vo-clinic-better', 'vo-sticker', 'vo-clinic-bye-patient',
    'vo-clinic-photo', 'vo-clinic-done', 'heartbeat', 'cough', 'gurgle', 'spray', 'sticky', 'brush', 'wheeze', ...CLINIC_SONG,
    'vo-sick-spots', 'vo-sick-cold', 'vo-sick-toy', 'vo-tool-dab', 'vo-tool-tissue', 'vo-tool-warmdrink', 'vo-tool-magnet',
    'vo-jingle', 'vo-bell-out', 'vo-clinic-bless', 'honk', 'jingle', 'zing',
    'vo-sick-eye', 'vo-sick-ear', 'vo-tooth-food', 'vo-germs', 'vo-germ-run', 'vo-tool-filler', 'vo-tool-cotton', 'vo-eye-speck',
    'vo-tool-eyedrops', 'vo-tool-light', 'vo-ear-bug', 'vo-bug-bye', 'vo-tool-swab', 'vo-tool-icepack', 'vo-tool-xray',
    'vo-tummy-germs', 'vo-germs-gone', 'vo-clinic-which', 'vo-knee-dirt', 'eek', 'drip', 'scan', 'sparkle', 'squeak',
    'vo-hi-lily', 'vo-hi-leo', 'vo-hi-mia', 'vo-hi-sam', 'vo-sick-sting', 'vo-sick-bites', 'vo-sick-dirty', 'vo-tool-sponge',
    'vo-tool-bugspray', 'vo-rinse-foam', 'vo-bugs-bye', 'vo-all-clean', 'vo-clinic-fixfirst', 'vo-clinic-fixed', 'vo-bug-hop',
  ],
};
/** The farm (FarmScene, research/farm-spec.md): loaded on its card like the garden. Shared lines and effects it plays are
 * listed here too (a listed sound is not core). The tooth brush and the close-up's rim are the clinic's. */
RECIPE_ASSETS.farm = {
  images: [
    ...(Object.keys(FARM_IMAGES) as ImageKey[]).filter((k) => k !== 'card-farm'), 'tool-toothbrush', 'lens-ring', 'bubble',
    'water-drop',
  ],
  sounds: [
    ...FARM_SFX, ...FARM_VOICE.filter((k) => k !== 'vo-pick-farm'), 'name-carrot', 'name-corn', 'name-red', 'name-blue',
    'name-yellow', 'name-white', 'brush', 'sticky', 'sparkle', 'spray', 'slurp', 'egg-crack', ...OUTSIDE_SONG,
  ],
};
/** A guest's own layers: loaded when the sharing starts (all three, the two not invited are freed at once). */
export const GUEST_LAYERS: readonly ImageKey[] = IMAGE_KEYS.filter((k) => k.startsWith('guest-') && !k.startsWith('guest-card-'));

export const RECIPE_SOUNDS: ReadonlySet<string> = new Set(Object.values(RECIPE_ASSETS).flatMap((r) => r.sounds));
/** Contract images in neither the core nor any recipe (a new key someone forgot to list): reported at boot. */
export const unlistedImages = () => {
  const listed = new Set<ImageKey>([...CORE_IMAGES, ...GUEST_LAYERS, ...Object.values(RECIPE_ASSETS).flatMap((r) => r.images)]);
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
  // the art corner (synthesised: audio-src/scripts/make_art_sfx.py)
  'crayon', 'xylo', 'splosh', 'squeak',
  // the clinic (synthesised: audio-src/scripts/make_clinic_sfx.py)
  'heartbeat', 'cough', 'gurgle', 'spray', 'sticky', 'brush', 'wheeze', 'honk', 'jingle', 'zing',
  // the clinic, round 3: a germ popping, a drop landing, the x-ray's hum, a star filling a tooth
  'eek', 'drip', 'scan', 'sparkle',
  // the farm (core/farmAssets.ts)
  ...FARM_SFX,
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
  /**
   * The fruit skewers (tools/gen_skewers.py). On `skewer-tray` (800x600, from its centre): the rows' centre lines (row 0 is
   * Mom's model); on a row the stick's foot end, the first slot and the slot pitch, and a piece's scale (fruit slices,
   * 240 frames). `skewer-stick` (60x720, standing): its tip and its foot, in its own frame.
   */
  skewers: {
    rows: [-187, -62, 62, 187],
    foot: -345,
    slot0: -250,
    pitch: 116,
    piece: 0.55,
    stickScale: 0.96,
    stickTip: 10,
    stickFoot: 712,
  },
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
  /** The garden's art geometry (assets-src/images-b-garden/tools/gen_garden.py prints it). */
  garden: {
    /** garden-bed (1300x360): the soil line the plants stand on, and the three holes' x. */
    soilY: 100,
    holes: [250, 650, 1050],
    /** Where the fruit hang on a grown plant, from its base (the soil line), at the plant's own scale. */
    tomatoFruits: [[-92, -330], [70, -420], [-40, -210]],
    strawberryFruits: [[-128, -44], [0, -30], [126, -52]],
    /** garden-carrot (180x420): where the root meets the leaves (at the soil line while it grows). */
    carrotTop: 196,
    /** watering-can (440x320): the spout's rose, where the water leaves it. */
    spout: { x: 22, y: 92 },
    /** garden-snail (260x190, facing left): its mouth. */
    snailMouth: { x: 30, y: 150 },
    /** garden-basket (440x320): the middle of the heap inside. */
    basketIn: { x: 220, y: 128 },
    /** garden-weed (200x320): the soil line (its leaves above, its root below). */
    weedTop: 170,
    /** garden-bunny (320x300, facing left): its mouth. */
    bunnyMouth: { x: 58, y: 158 },
    /** garden-scarecrow (380x640): where a hat's brim sits and a shirt's middle goes; a hat's brim middle (240x160). */
    scareHat: { x: 190, y: 104 },
    scareShirt: { x: 190, y: 386 },
    hatBrim: { x: 120, y: 128 },
    /** garden-jar (220x260): the middle of its open mouth. */
    jarMouth: { x: 110, y: 66 },
  },
  /** The market's paying (assets-src/images-b-minigames/tools/gen_minigames.py): market-slate's chalk face. */
  market: {
    slateFace: { x: 44, y: 40, w: 292, h: 196 },
    /** The balance scale (gen_minigames.py): the base's pivot and foot, the beam's hub and the ends the pans hang from, a
     * pan's ring and the middle of its dish (where the goods sit, 200 wide). */
    scale: { pivot: { x: 200, y: 70 }, foot: 436, hub: { x: 280, y: 30 }, ends: [{ x: 34, y: 30 }, { x: 526, y: 30 }], hook: { x: 130, y: 10 }, top: { x: 130, y: 170 }, panW: 200 },
    /** market-cat-* (600x320): where the code lays the slots of a category list. */
    catSlots: { x: 300, y: 70, w: 260, h: 220 },
  },
  /** The art corner (assets-src/images-b-art/tools/gen_art.py prints it). */
  art: {
    /** art-easel (1000x1000): where the sheet lies on the board (5:4). */
    sheet: { x: 112, y: 100, w: 776, h: 620 },
    /** art-window-frame (800x640): the glass inside the frame (the fog covers it). */
    glass: { x: 44, y: 44, w: 712, h: 520 },
  },
  /** The clinic (assets-src/images-b-clinic/tools/gen_clinic.py prints it). */
  clinic: {
    /** Each tool's working point in its 240 frame (the bulb, the chest piece, the bristles, the spoon's bowl...). */
    tip: {
      thermometer: { x: 174, y: 174 }, stethoscope: { x: 176, y: 200 }, plaster: { x: 120, y: 120 }, cream: { x: 68, y: 46 },
      spray: { x: 52, y: 50 }, tweezers: { x: 58, y: 192 }, magnifier: { x: 100, y: 100 }, toothbrush: { x: 74, y: 65 },
      cup: { x: 120, y: 120 }, syrup: { x: 80, y: 168 }, cloth: { x: 120, y: 120 }, hotbottle: { x: 120, y: 150 },
      tissue: { x: 120, y: 76 }, magnet: { x: 80, y: 177 },
      // round 3 (gen_clinic3.py)
      filler: { x: 62, y: 52 }, cotton: { x: 120, y: 120 }, eyedrops: { x: 120, y: 216 }, swab: { x: 58, y: 182 },
      light: { x: 66, y: 174 }, icepack: { x: 120, y: 124 }, xray: { x: 113, y: 98 },
      sponge: { x: 120, y: 122 }, bugspray: { x: 52, y: 40 },
    },
    /** lens-eye-ball (520): the pupil; lens-ear: the ear's hole. */
    eye: { x: 260, y: 262 },
    earHole: { x: 282, y: 300 },
    /** lens-mouth (520): the eight teeth's centres; lens-knee: the knee; lens-paw: where the splinter goes in. */
    teeth: [[155, 190], [222, 172], [298, 172], [365, 190], [165, 350], [228, 368], [292, 368], [355, 350]] as readonly (readonly [number, number])[],
    knee: { x: 320, y: 285 },
    paw: { x: 262, y: 340 },
    /** clinic-chart (300x380): the centres of its four rows. */
    chartRows: [[150, 104], [150, 175], [150, 246], [150, 316]] as readonly (readonly [number, number])[],
    /** clinic-bed (900x320): the cushion's top (where a patient sits); clinic-bench (1500x420): its seat. */
    bedSeat: 112,
    benchSeat: 252,
    photoWindow: { x: 80, y: 80, w: 540, h: 540 },
  },
  /** Washing up (assets-src/images-b-minigames/tools/gen_minigames.py prints it). */
  dishes: {
    /** dish-rack (960x720): the colour columns' centres (blue, yellow, pink), where a hook holds a cup's handle, and a
     * plate's centre in its slot. */
    cols: [170, 480, 790],
    hook: { dx: 62, y: 118 },
    slotY: 520,
    /** dish-cup-* (280x260): the top of the handle (it hangs there). dish-plate-*: the plate's radius. */
    cupHook: { x: 232, y: 90 },
    plateR: 136,
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
