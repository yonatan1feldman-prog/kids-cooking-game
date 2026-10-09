/**
 * The farm's part of the asset contract (FarmScene; research/farm-spec.md), kept in its own file so the farm touches
 * assets.ts and audio.ts only by one line each. The art is made by assets-src/images-b-farm/tools/gen_farm.py (it prints
 * the anchors in ART_FARM); the sounds by audio-src/scripts/make_farm_sfx.py and make_vo.py (Mom's lines).
 * The animals' layers (800x700 frame, feet at y 684, facing left) are rasterized at 0.75 like the guests'.
 */
export const FARM_IMAGES = {
  'bg-farm': { size: [2400, 1080] },
  'card-farm': { size: [400, 520] },
  'cow-bell': { size: [140, 160] },
  'egg-basket': { size: [300, 220] },
  'egg-brown': { size: [100, 120] },
  'egg-white': { size: [100, 120] },
  'farm-apple': { size: [200, 200] },
  'farm-brush': { size: [240, 240] },
  'farm-card': { size: [240, 240] },
  'farm-carrot': { size: [200, 240] },
  'farm-cart': { size: [480, 330] },
  'farm-chick': { size: [140, 140] },
  'farm-corn': { size: [200, 240] },
  'farm-cow-body': { size: [800, 700], raster: 0.75 },
  'farm-cow-eyes-blink': { size: [800, 700], raster: 0.75 },
  'farm-cow-eyes-happy': { size: [800, 700], raster: 0.75 },
  'farm-cow-eyes-open': { size: [800, 700], raster: 0.75 },
  'farm-cow-eyes-surprised': { size: [800, 700], raster: 0.75 },
  'farm-cow-mouth-chew': { size: [800, 700], raster: 0.75 },
  'farm-cow-mouth-closed': { size: [800, 700], raster: 0.75 },
  'farm-cow-mouth-open': { size: [800, 700], raster: 0.75 },
  'farm-done': { size: [120, 120] },
  'farm-fence': { size: [2400, 240] },
  'farm-horse-body': { size: [800, 700], raster: 0.75 },
  'farm-horse-eyes-blink': { size: [800, 700], raster: 0.75 },
  'farm-horse-eyes-happy': { size: [800, 700], raster: 0.75 },
  'farm-horse-eyes-open': { size: [800, 700], raster: 0.75 },
  'farm-horse-eyes-surprised': { size: [800, 700], raster: 0.75 },
  'farm-horse-mouth-chew': { size: [800, 700], raster: 0.75 },
  'farm-horse-mouth-closed': { size: [800, 700], raster: 0.75 },
  'farm-horse-mouth-open': { size: [800, 700], raster: 0.75 },
  'farm-nest': { size: [340, 170] },
  'farm-pig-body': { size: [800, 700], raster: 0.75 },
  'farm-pig-eyes-blink': { size: [800, 700], raster: 0.75 },
  'farm-pig-eyes-happy': { size: [800, 700], raster: 0.75 },
  'farm-pig-eyes-open': { size: [800, 700], raster: 0.75 },
  'farm-pig-eyes-surprised': { size: [800, 700], raster: 0.75 },
  'farm-pig-mouth-chew': { size: [800, 700], raster: 0.75 },
  'farm-pig-mouth-closed': { size: [800, 700], raster: 0.75 },
  'farm-pig-mouth-open': { size: [800, 700], raster: 0.75 },
  'farm-pump': { size: [240, 400] },
  'farm-shears': { size: [240, 240] },
  'farm-sheep-body': { size: [800, 700], raster: 0.75 },
  'farm-sheep-eyes-blink': { size: [800, 700], raster: 0.75 },
  'farm-sheep-eyes-happy': { size: [800, 700], raster: 0.75 },
  'farm-sheep-eyes-open': { size: [800, 700], raster: 0.75 },
  'farm-sheep-eyes-surprised': { size: [800, 700], raster: 0.75 },
  'farm-sheep-mouth-chew': { size: [800, 700], raster: 0.75 },
  'farm-sheep-mouth-closed': { size: [800, 700], raster: 0.75 },
  'farm-sheep-mouth-open': { size: [800, 700], raster: 0.75 },
  'farm-smudge': { size: [100, 80] },
  'farm-soap': { size: [240, 240] },
  'farm-sponge': { size: [240, 240] },
  'farm-trough': { size: [360, 170] },
  'fleece-4-1': { size: [154, 390] },
  'fleece-4-2': { size: [128, 390] },
  'fleece-4-3': { size: [128, 390] },
  'fleece-4-4': { size: [154, 390] },
  'fleece-6-1': { size: [114, 390] },
  'fleece-6-2': { size: [88, 390] },
  'fleece-6-3': { size: [88, 390] },
  'fleece-6-4': { size: [88, 390] },
  'fleece-6-5': { size: [88, 390] },
  'fleece-6-6': { size: [114, 390] },
  'grain-scoop': { size: [240, 240] },
  'hay-bale': { size: [240, 220] },
  'hay-pile': { size: [280, 140] },
  'hen-sit-brown': { size: [300, 260] },
  'hen-sit-white': { size: [300, 260] },
  'hen-up-brown': { size: [300, 320] },
  'hen-up-white': { size: [300, 320] },
  'horse-shine': { size: [470, 220] },
  'horse-teeth': { size: [520, 520] },
  'milk-bottle-empty': { size: [140, 260] },
  'milk-bottle-full': { size: [140, 260] },
  'milk-bucket-full': { size: [260, 260] },
  'milk-bucket': { size: [260, 260] },
  'mud-patch-1': { size: [166, 126] },
  'mud-patch-2': { size: [176, 116] },
  'mud-patch-3': { size: [166, 136] },
  'mud-patch-4': { size: [186, 116] },
  'mud-patch-5': { size: [136, 106] },
  'photo-frame-farm': { size: [700, 780] },
  'pipa-scarf': { size: [260, 160] },
  'sheep-ribbon-blue': { size: [200, 150] },
  'sheep-ribbon-red': { size: [200, 150] },
  'sheep-ribbon-yellow': { size: [200, 150] },
  'wool-curl': { size: [140, 110] },
  'wool-pile': { size: [340, 180] },
  'yarn-ball': { size: [240, 240] },
} as const;

/** The farm's own effects (synthesised, make_farm_sfx.py). */
export const FARM_SFX = ['moo', 'neigh', 'baa', 'cluck', 'peep', 'oink', 'milk-squirt', 'clip-buzz', 'cow-bell', 'splash-mud'] as const;

/** Mom's farm lines (make_vo.py, "The farm"). */
export const FARM_VOICE = [
  'vo-pick-farm', 'vo-farm-hello', 'vo-farm-next', 'vo-farm-what-first', 'vo-farm-first-hmm', 'vo-farm-not-that',
  'vo-farm-more', 'vo-horse-feed', 'vo-horse-wants', 'vo-horse-brush', 'vo-horse-teeth', 'vo-horse-ride',
  'vo-cow-hay', 'vo-cow-bell', 'vo-cow-bucket', 'vo-cow-milk', 'vo-cow-other', 'vo-cow-pour', 'vo-sheep-shear',
  'vo-sheep-tickles', 'vo-sheep-arrows', 'vo-sheep-wind', 'vo-sheep-ribbon', 'vo-sheep-ribbon-copy', 'vo-hens-grain',
  'vo-hens-eggs', 'vo-hens-basket', 'vo-hens-colour', 'vo-hens-chick', 'vo-hen-shy', 'vo-pig-muddy', 'vo-pig-soap',
  'vo-pig-rinse', 'vo-pig-feed', 'vo-pig-wants', 'vo-pig-back', 'vo-farm-thanks-horse', 'vo-farm-thanks-cow',
  'vo-farm-thanks-sheep', 'vo-farm-thanks-hens', 'vo-farm-thanks-pig', 'vo-farm-done', 'vo-farm-day', 'vo-farm-scarf',
  'name-horse', 'name-cow', 'name-sheep', 'name-hens', 'name-pig', 'name-apple', 'name-brown',
] as const;
export type FarmVoiceKey = (typeof FARM_VOICE)[number];

/** Anchors in the farm's art (gen_farm.py prints them): points in each image's own viewBox. */
export const ART_FARM = {
  /** The animals' 800x700 frame: their feet on y 684. */
  frame: { w: 800, h: 700, feet: 684 },
  /** Where the horse's brush works, in turn on hard (mane, back, hip). */
  horseZones: [{ x: 282, y: 300 }, { x: 460, y: 330 }, { x: 612, y: 392 }],
  /** horse-teeth (520): where a smudge can sit on the teeth. */
  teeth: [{ x: 138, y: 222 }, { x: 218, y: 230 }, { x: 302, y: 230 }, { x: 382, y: 222 }, { x: 178, y: 250 }, { x: 342, y: 250 }],
  /** horse-shine: its box's centre in the horse's frame. */
  shine: { x: 435, y: 360 },
  /** The cow: her two teats (where a squeeze goes), the bell's hanging point on her collar. */
  teats: [{ x: 488, y: 590 }, { x: 552, y: 590 }],
  bellAt: { x: 302, y: 430 },
  /** cow-bell (140x160): its loop. */
  bellLoop: { x: 70, y: 18 },
  /** farm-trough (360x170): where the hay or the food lies. */
  troughIn: { x: 180, y: 40 },
  /** The sheep: where the ribbon goes; the fleece bands' boxes (centre x, y, w, h) in her frame, 4 (easy) or 6 (hard). */
  ribbonAt: { x: 282, y: 352 },
  fleece4: [[297, 385, 154, 390], [430, 385, 128, 390], [550, 385, 128, 390], [683, 385, 154, 390]],
  fleece6: [[277, 385, 114, 390], [370, 385, 88, 390], [450, 385, 88, 390], [530, 385, 88, 390], [610, 385, 88, 390], [703, 385, 114, 390]],
  /** The pig's mud patches (centre x, y, w, h). */
  mud: [[330, 360, 150, 110], [468, 316, 160, 100], [600, 400, 150, 120], [430, 470, 170, 100], [640, 470, 120, 90]],
  /** Pipa's scarf: its box's centre in Pipa's 600x700 frame. */
  scarf: { x: 300, y: 540 },
  /** hen-sit / hen-up (300 wide): her beak. farm-nest (340x170): where she sits, where her egg lies. */
  henBeak: { x: 30, y: 112 },
  nestSeat: { x: 170, y: 96 },
  nestEgg: { x: 170, y: 84 },
  /** egg-basket (300x220): where the eggs go. farm-cart (480x330): where what the animals give goes. */
  basketIn: { x: 150, y: 70 },
  cartIn: { x: 240, y: 116 },
  /** The tools' working points (240 frames; the scoop's mouth). */
  tip: {
    brush: { x: 120, y: 186 }, shears: { x: 120, y: 26 }, soap: { x: 120, y: 130 }, sponge: { x: 120, y: 124 },
    scoop: { x: 40, y: 96 }, toothbrush: { x: 74, y: 65 },
  },
  /** farm-pump (240x400): the spout, the handle. */
  pumpSpout: { x: 220, y: 200 },
  pumpHandle: { x: 30, y: 40 },
  /** bg-farm (2400x1080): the mud puddle the pig goes back to. */
  puddle: { x: 980, y: 900 },
  photoWindow: { x: 80, y: 80, w: 540, h: 540 },
} as const;
