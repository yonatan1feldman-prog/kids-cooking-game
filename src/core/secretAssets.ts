/**
 * The premium round's PR 5 part of the asset contract (research/premium-spec.md 4.5), in its own file so it touches
 * assets.ts only by one line in IMAGES and one block at its end. Made by assets-src/images-b-premium/tools/gen_secrets.py.
 * - `card-shelf`: the home screen's shelf plank (a `card-` key, so it loads with the cards, BootScene HOME_ART).
 * - `secret-*`: the small things a world's secrets show (core/secrets.ts), each loaded with its own world only.
 */
export const SECRET_IMAGES = {
  'card-shelf': { size: [1600, 84] },
  'secret-mouse': { size: [150, 130] },
  'secret-butterfly': { size: [120, 100] },
  'secret-bird': { size: [130, 110] },
  'secret-pigeon': { size: [150, 130] },
  'secret-rooster': { size: [160, 160] },
  'secret-puppy': { size: [150, 120] },
  'secret-fish': { size: [120, 80] },
} as const;

/** Which world loads which secret pictures (the kitchen's are core: title, home, album and every recipe show it). */
export const SECRET_WORLD_IMAGES = {
  kitchen: ['secret-mouse', 'secret-butterfly'],
  garden: ['secret-bird', 'secret-butterfly'],
  market: ['secret-pigeon'],
  farm: ['secret-rooster', 'secret-puppy'],
  clinic: ['secret-fish'],
  mermaid: ['secret-fish'],
} as const;
