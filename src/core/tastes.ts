/**
 * Pipa's tastes (the gameplay round): how she answers what she eats, so what the child put on her dish shows. There is
 * no bad taste. A sneeze (onion, pepper) is slapstick that ends in a giggle, never a sad or disgusted face.
 * - love: it has what she wished for (her thought bubble): a big hop, hearts, "yay!"
 * - sneeze: onion or pepper: "ahh... choo!", then a giggle (Mom: "Bless you, Pipa!")
 * - wow: something special (mushroom, olives, chocolate, syrup, icing, kiwi, mango): surprised eyes, "wow!"
 * - giggle: anything else she tastes: a happy squish and a giggle
 * - plain: nothing on it (a bare slice): her old happy munch
 */
export type Taste = 'love' | 'sneeze' | 'wow' | 'giggle' | 'plain';

const RULES: [RegExp, Taste][] = [
  [/onion|pepper/, 'sneeze'],
  [/mushroom|olive|choc|syrup|icing|kiwi|mango/, 'wow'],
];

/**
 * What one eater likes (a guest, core/guests.ts): `love` = what she loves besides what she wished for; `sneeze` =
 * whether onion and pepper make her sneeze (Pipa and the penguin do, the turtle and the giraffe don't).
 */
export interface Likes {
  love?: RegExp;
  sneeze?: boolean;
}

/** The taste of a piece holding these things (image keys), given what the eater wished for and likes. */
export function tasteOf(keys: readonly string[], wishes: readonly string[], sneezesLeft: boolean, likes: Likes = {}): Taste {
  if (!keys.length) return 'plain';
  if (keys.some((k) => wishes.includes(k) || likes.love?.test(k))) return 'love';
  if (likes.sneeze === false) sneezesLeft = false;
  for (const [re, t] of RULES) {
    if (t === 'sneeze' && !sneezesLeft) continue;
    if (keys.some((k) => re.test(k))) return t;
  }
  return 'giggle';
}
