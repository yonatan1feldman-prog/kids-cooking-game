/**
 * The mermaid salon's part of the asset contract (research/mermaid-dressup-spec.md 9-11). The keys and sizes are the
 * contract between the art (PR V) and the code (PR 1); PRs 2-4 add nothing here but their numbered blocks.
 * Art: assets-src/images-b-sea/tools/gen_customers.py (the three customers, and core/salonFaceArt.ts, generated) and
 * gen_salon.py (hair, tails, tops, jewels, tools, furniture, the door's picture; it writes tools/salon-tints.json, the
 * numbers in ART_SALON's tints). Sounds: audio-src/scripts/make_salon_sfx.py and make_vo.py ("The mermaid salon").
 *
 * Every salon picture of something worn sits on the customers' 600x700 frame (the same origin as their layers), so it
 * is placed at the customer's origin and the trimmed WebP keeps only the drawing. Tinted pictures (hair-back-*,
 * hair-front-*, tail-<shape>, the cust-*-mouth-* layers, spray-cap) are white paper with grey shade: use the tints in
 * ART_SALON (they are compensated for the grey, so the hair's main value comes out as the colour named).
 * Loading: nothing here is core or precached; the lagoon's door loads door-icon-salon, the salon door loads the rest.
 */
import { FACE_ANCHORS } from './salonFaceArt';

/**
 * Memory first (spec 9: the salon itself <= 24 MB GPU): the customers' layers are rasterized at 1.5 (her face is shown
 * up to ~2x in the close-up), the hair's front, the crowns and the clip at 1.25, everything else at its native size
 * (white strokes, the back hair and the tail are never seen in the close-up).
 */
const C = { size: [600, 700], raster: 1.5 } as const;
const F = { size: [600, 700], raster: 1.25 } as const;
const B = { size: [600, 700] } as const;
const TOOL = { size: [240, 240] } as const;

export const SALON_IMAGES = {
  // the lagoon's sixth shell door
  'door-icon-salon': { size: [160, 160] },
  // the three customers (gen_customers.py): no hair, no tail (those are items); mouths white (tinted)
  'cust-marina-body': C, 'cust-marina-eyes-open': C, 'cust-marina-eyes-blink': C, 'cust-marina-eyes-happy': C,
  'cust-marina-eyes-surprised': C, 'cust-marina-mouth-closed': C, 'cust-marina-mouth-open': C, 'cust-marina-mouth-chew': C,
  'cust-coral-body': C, 'cust-coral-eyes-open': C, 'cust-coral-eyes-blink': C, 'cust-coral-eyes-happy': C,
  'cust-coral-eyes-surprised': C, 'cust-coral-mouth-closed': C, 'cust-coral-mouth-open': C, 'cust-coral-mouth-chew': C,
  'cust-pearl-body': C, 'cust-pearl-eyes-open': C, 'cust-pearl-eyes-blink': C, 'cust-pearl-eyes-happy': C,
  'cust-pearl-eyes-surprised': C, 'cust-pearl-mouth-closed': C, 'cust-pearl-mouth-open': C, 'cust-pearl-mouth-chew': C,
  // hair: five styles, back (behind her) + front (over her face's edge) tinted, shine (after the comb) untinted
  'hair-back-waves': B, 'hair-back-curls': B, 'hair-back-braid': B, 'hair-back-bun': B, 'hair-back-bob': B,
  'hair-front-waves': F, 'hair-front-curls': F, 'hair-front-braid': F, 'hair-front-bun': F, 'hair-front-bob': F,
  'hair-shine-waves': B, 'hair-shine-curls': B, 'hair-shine-braid': B, 'hair-shine-bun': B, 'hair-shine-bob': B,
  // tails: three shapes, tinted, each with its untinted shine (always shown over it)
  'tail-classic': B, 'tail-frilly': B, 'tail-long': B,
  'tail-classic-shine': B, 'tail-frilly-shine': B, 'tail-long-shine': B,
  // tops and jewels (their own colours)
  'top-shells': B, 'top-starfish': B, 'top-frill': B,
  'crown-pearl': F, 'crown-starfish': F, 'crown-coral': F, 'clip-flower': F,
  'necklace-pearl': B, 'necklace-star': B,
  'gem-star': { size: [90, 90] }, 'gem-heart': { size: [90, 90] },
  // tools (each is also what is dragged); spray-cap (white, tinted the picked colour) sits on salon-spray at sprayCap.
  // (salon-sponge / -shower / -spray / -comb: the clinic already has tool-sponge etc.)
  'salon-sponge': TOOL, 'salon-shower': TOOL, 'salon-spray': TOOL, 'salon-comb': TOOL,
  'spray-cap': { size: [80, 80] },
  'tool-blush': TOOL, 'tool-shadow': TOOL, 'tool-lipstick': TOOL, 'tool-glitter': TOOL,
  'shell-surprise': { size: [220, 220] },
  // the salon's corner
  'salon-chair': { size: [700, 600] },
  'salon-mirror': { size: [560, 720] },
  // salon review B1: the closed shell that stands where the mirror will be all visit (lower half + coral stand, and its
  // lid on the same frame); at the end the lid swings up round ART_SALON.lidHinge and the mirror appears
  // (raster 0.8: they show at most at 0.85 of their size, and the shell must cost the GPU about half a megabyte)
  'salon-mirror-closed': { size: [560, 720], raster: 0.8 },
  'salon-mirror-lid': { size: [560, 720], raster: 0.8 },
  'salon-bench': { size: [1300, 260] },
  'salon-vanity': { size: [520, 300] },
  'sand-spot': { size: [120, 90] },
  'weed-bit': { size: [90, 60] },
} as const;
export type SalonImageKey = keyof typeof SALON_IMAGES;

/** The salon's own effects (make_salon_sfx.py). The sponge uses the core `squish`. */
export const SALON_SFX = [
  'weed-pluck', 'shower', 'hair-swish', 'spray-click', 'spray-hiss', 'comb-strokes', 'blush-brush', 'lipstick-pop',
  'splash-soft', 'jewel-ting', 'gem-click', 'mirror-chime', 'giggle-1', 'giggle-2', 'giggle-3',
] as const;

/** Mom's lines in the salon (make_vo.py, "The mermaid salon"). vo-pick-salon is the lagoon's (its door). */
export const SALON_VOICE = [
  'vo-pick-salon',
  'vo-salon-who', 'vo-salon-sit', 'vo-salon-wish', 'name-marina', 'name-coral', 'name-pearl',
  'vo-salon-splash', 'vo-salon-peek', 'vo-salon-rinse', 'vo-salon-clean',
  'vo-salon-hair', 'vo-salon-spray', 'vo-salon-shiny', 'vo-salon-surprise',
  'vo-salon-face', 'vo-salon-rosy', 'vo-salon-shadow', 'vo-salon-lips', 'vo-salon-glitter',
  'vo-salon-outfit', 'vo-salon-tail', 'vo-salon-top',
  'vo-salon-sparkle', 'vo-salon-crown', 'vo-salon-gem', 'vo-salon-off',
  'vo-salon-found', 'vo-salon-granted',
  'vo-salon-mirror', 'vo-salon-look', 'vo-salon-show', 'vo-salon-bye',
] as const;
export type SalonVoiceKey = (typeof SALON_VOICE)[number];

// ---- ART_SALON (PR V): the art's anchors and the tints, from gen_customers.py / gen_salon.py ----
/** Points in the customers' 600x700 frame unless said otherwise. */
export const ART_SALON = {
  /** necklace-marina's centre on a customer (the salon's own necklaces are drawn in the frame). */
  neck: { x: 300, y: 430 },
  faceCentre: { x: 300, y: 266 },
  /** Sand after the swim: forehead, cheek, shoulder, arm, tail (spec 5.1 picks 2 or 3 by visit). */
  sandSpots: [{ x: 300, y: 214 }, { x: 216, y: 318 }, { x: 392, y: 428 }, { x: 196, y: 498 }, { x: 330, y: 622 }],
  /** Seaweed caught in her hair. */
  weedBits: [{ x: 198, y: 140 }, { x: 418, y: 172 }],
  /** Where the hair is (spray and comb hits; every style's front and the top of the long styles). */
  hairBox: { x0: 130, y0: 60, x1: 470, y1: 340 },
  /** salon-chair (700x600): where a customer frame's foot point (300, 684) goes, at the customer's own scale. */
  chairSeat: { x: 350, y: 590 },
  /** salon-bench (1300x260): the three seats' x as fractions, and the y a customer's foot point goes to. */
  benchSeats: [0.2, 0.5, 0.8],
  benchSeatY: 150,
  /** salon-mirror (560x720): the clear glass, where the reflection goes. */
  mirrorWindow: { x: 122, y: 196, w: 316, h: 352 },
  /** salon-mirror-lid (560x720, the frame of salon-mirror-closed): the hinge it swings open round. */
  lidHinge: { x: 462, y: 410 },
  /** salon-spray (240): where spray-cap's centre sits. */
  sprayCap: { x: 120, y: 56 },
  /** A face gem's scale on the customer (90 -> 45 units). */
  gemScale: 0.5,
  /** Each customer's hairstyle when she has no look yet. */
  defaultHair: { marina: 'waves', coral: 'curls', pearl: 'bob' },
  /** Tints (setTint) for the hair layers, by dye or `natural-<customer>`. */
  hair: {
    pink: 0xff9fc8, purple: 0xac88f8, blue: 0x58ccf8, gold: 0xffd656, seagreen: 0x46d4b1, pearl: 0xfff8ff,
    'natural-marina': 0xffbb40, 'natural-coral': 0x40281b, 'natural-pearl': 0x30303e,
  },
  /** Tints for tail-<shape> (not its shine). */
  tail: {
    pink: 0xff9fc8, purple: 0xac88f8, blue: 0x58ccf8, gold: 0xffd656, seagreen: 0x46d4b1, pearl: 0xfff8ff,
    'natural-marina': 0xab95ff, 'natural-coral': 0xff9b87, 'natural-pearl': 0x7be1ef,
  },
  /** Tints for the three mouth layers: lipstick colours, or her own lips. */
  lips: {
    pink: 0xff9fc8, purple: 0xac88f8, blue: 0x58ccf8, gold: 0xffdf50,
    'natural-marina': 0xff9995, 'natural-coral': 0xcc6a64, 'natural-pearl': 0xffabb1,
  },
  /** spray-cap's tint for each dye (the same as the hair's). */
  dye: { pink: 0xff9fc8, purple: 0xac88f8, blue: 0x58ccf8, gold: 0xffd656, seagreen: 0x46d4b1, pearl: 0xfff8ff },
  /** The face's geometry (generated, salonFaceArt.ts): cheeks, lids, mouth, skin, the six gem slots. */
  face: FACE_ANCHORS,
} as const;
