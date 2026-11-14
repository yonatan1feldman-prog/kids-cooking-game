/**
 * The Mermaid Salon's part of the asset contract (research/mermaid-dressup-spec.md 10-11): the sixth shell door of the
 * lagoon. Its own file, like dressingAssets.ts, so the salon touches seaAssets.ts by a few spreads. The art is made by
 * assets-src/images-b-sea/tools/gen_customers.py (the three customers) and gen_salon.py (the catalogue, the tools, the
 * furniture, the door's picture); the sounds by audio-src/scripts/make_salon_sfx.py and make_vo.py ("The mermaid salon").
 * Until the art is in, core/salonPlaceholders.ts draws a stand-in for every key here.
 *
 * Every 600x700 layer (customers, hair, tails, tops, crowns, clip, necklaces) shares the customers' frame (feet at y 684,
 * like Pipa's and Marina's), so it sits on any of the three by itself. Tinted things (hair, tails, mouths) are drawn in
 * white with soft grey shadows: the game tints them (salon.ts HAIR_HEX / LIPS).
 *
 * Loading (spec 9): nothing here loads going into the world but `door-icon-salon` (seaAssets.ts SEA_LAGOON); the salon's
 * shell door loads the rest (SEA_ACTIVITY.salon) and the lagoon frees it again on return.
 */

const F = { size: [600, 700] } as const;
/** The customers' layers: raster 1.5 (the face close-up of salon PR 2 shows them 1.6x bigger). */
const C = { size: [600, 700], raster: 1.5 } as const;

export const SALON_IMAGES = {
  // the door's picture in the lagoon (loaded with the lagoon)
  'door-icon-salon': { size: [160, 160] },
  // the customers (gen_customers.py): no hair, no tail (those are the catalogue), a plain cream vest, a short cap of hair
  'cust-marina-body': C, 'cust-marina-eyes-open': C, 'cust-marina-eyes-blink': C, 'cust-marina-eyes-happy': C,
  'cust-marina-eyes-surprised': C, 'cust-marina-mouth-closed': C, 'cust-marina-mouth-open': C, 'cust-marina-mouth-chew': C,
  'cust-coral-body': C, 'cust-coral-eyes-open': C, 'cust-coral-eyes-blink': C, 'cust-coral-eyes-happy': C,
  'cust-coral-eyes-surprised': C, 'cust-coral-mouth-closed': C, 'cust-coral-mouth-open': C, 'cust-coral-mouth-chew': C,
  'cust-pearl-body': C, 'cust-pearl-eyes-open': C, 'cust-pearl-eyes-blink': C, 'cust-pearl-eyes-happy': C,
  'cust-pearl-eyes-surprised': C, 'cust-pearl-mouth-closed': C, 'cust-pearl-mouth-open': C, 'cust-pearl-mouth-chew': C,
  // hair: five styles, each behind her (back) and over her head (front), white (tinted), and the comb's shine (not tinted)
  'hair-back-waves': F, 'hair-front-waves': F, 'hair-shine-waves': F,
  'hair-back-curls': F, 'hair-front-curls': F, 'hair-shine-curls': F,
  'hair-back-braid': F, 'hair-front-braid': F, 'hair-shine-braid': F,
  'hair-back-bun': F, 'hair-front-bun': F, 'hair-shine-bun': F,
  'hair-back-bob': F, 'hair-front-bob': F, 'hair-shine-bob': F,
  // tails: three shapes, white (tinted), each with its sparkles and fin edge (not tinted)
  'tail-classic': F, 'tail-classic-shine': F,
  'tail-frilly': F, 'tail-frilly-shine': F,
  'tail-long': F, 'tail-long-shine': F,
  // tops, crowns, the clip, two necklaces (necklace-marina, from the shell treasure, is the world's own), two face gems
  'top-shells': F, 'top-starfish': F, 'top-frill': F,
  'crown-pearl': F, 'crown-starfish': F, 'crown-coral': F,
  'clip-flower': F,
  'necklace-pearl': F, 'necklace-star': F,
  'gem-star': { size: [90, 90] },
  'gem-heart': { size: [90, 90] },
  // the tools (a tool in the column is also what she carries)
  'salon-sponge': { size: [240, 240] },
  'salon-shower': { size: [240, 240] },
  'salon-spray': { size: [240, 240] },
  'spray-cap': { size: [80, 80] },
  'salon-comb': { size: [240, 240] },
  'tool-blush': { size: [240, 240] },
  'tool-shadow': { size: [240, 240] },
  'tool-lipstick': { size: [240, 240] },
  'tool-glitter': { size: [240, 240] },
  // the salon's corner of the lagoon
  'salon-chair': { size: [700, 600] },
  'salon-mirror': { size: [560, 720] },
  'salon-bench': { size: [1300, 260] },
  'salon-vanity': { size: [520, 300] },
  'shell-surprise': { size: [220, 220] },
  'sand-spot': { size: [120, 90] },
  'weed-bit': { size: [90, 60] },
} as const;
export type SalonImageKey = keyof typeof SALON_IMAGES;

/** The salon's own effects (make_salon_sfx.py). The sponge uses the core `squish`, so it is not listed here. */
export const SALON_SFX = [
  'weed-pluck', 'shower', 'hair-swish', 'spray-click', 'spray-hiss', 'comb-strokes', 'blush-brush', 'lipstick-pop',
  'splash-soft', 'jewel-ting', 'gem-click', 'mirror-chime', 'giggle-1', 'giggle-2', 'giggle-3',
] as const;
export type SalonSfxKey = (typeof SALON_SFX)[number];

/** Mom's lines in the salon (make_vo.py, "The mermaid salon"). `vo-pick-salon` is said by the lagoon's door. */
export const SALON_VOICE = [
  'vo-pick-salon',
  // salon PR 1: who comes, the splash, the hair, the end
  'vo-salon-who', 'vo-salon-sit', 'vo-salon-wish', 'name-marina', 'name-coral', 'name-pearl',
  'vo-salon-splash', 'vo-salon-peek', 'vo-salon-rinse', 'vo-salon-clean',
  'vo-salon-hair', 'vo-salon-spray', 'vo-salon-shiny', 'vo-salon-surprise',
  // salon PR 2: the face, the sparkle
  'vo-salon-face', 'vo-salon-rosy', 'vo-salon-shadow', 'vo-salon-lips', 'vo-salon-glitter',
  'vo-salon-sparkle', 'vo-salon-crown', 'vo-salon-gem', 'vo-salon-off',
  // salon PR 3: the outfit, the wish (hard)
  'vo-salon-outfit', 'vo-salon-tail', 'vo-salon-top', 'vo-salon-found', 'vo-salon-granted',
  // salon PR 4: the mirror and the show
  'vo-salon-mirror', 'vo-salon-look', 'vo-salon-show', 'vo-salon-bye',
] as const;
export type SalonVoiceKey = (typeof SALON_VOICE)[number];

/**
 * Anchors in the salon's art (gen_customers.py / gen_salon.py print them; salon PR V owns this block). Points are in each
 * image's own frame. The numbers below are the stand-ins' (salonPlaceholders.ts), from gen_kids' head (300, 236, r 150).
 */
export const ART_SALON = {
  /** Customer frame (600x700): the middle of her face, the base of her neck. */
  faceCentre: { x: 300, y: 250 },
  neck: { x: 300, y: 400 },
  /** Customer frame: where the sand can be after a swim: forehead, cheek, shoulder, arm, tail. */
  sandSpots: [{ x: 300, y: 150 }, { x: 392, y: 316 }, { x: 214, y: 438 }, { x: 412, y: 500 }, { x: 330, y: 628 }],
  /** Customer frame: the two bits of seaweed caught in her hair. */
  weedBits: [{ x: 178, y: 168 }, { x: 420, y: 122 }],
  /** Customer frame: where her hair is (the spray and the comb work inside it, a little beyond). */
  hairBox: { x0: 110, y0: 50, x1: 490, y1: 420 },
  /** salon-chair (700x600): where the customer frame's feet point (y 684 of her frame) sits. */
  chairSeat: { x: 350, y: 560 },
  /** salon-bench (1300x260): the three seats, as fractions across it, and the seat's top (y in its frame). */
  benchSeats: [0.2, 0.5, 0.8],
  benchTop: 90,
  /** salon-spray (240x240): where its cap sits (spray-cap, 80x80, tinted the colour it sprays). */
  sprayCap: { x: 120, y: 72 },
  /** salon-mirror (560x720): the glass. */
  mirrorWindow: { x: 90, y: 90, w: 380, h: 500 },
} as const;
