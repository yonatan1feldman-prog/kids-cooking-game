import type { Layout } from './layout';

type Pt = { x: number; y: number };

/**
 * Every fixed position and per-item size on screen, in one table. Scenes and steps read
 * their anchors from here and never hard-code coordinates, so the screen layout is data.
 * All points are world coordinates; scales are final image scales (k already included).
 *
 * Landscape composition, left to right between the thumb strips (4% of the width each):
 *   [ this step's ingredients / bins ] [ the dish on its board, full size ] [ the character ]
 * Everything is placed relative to the side margins and the center, so it holds from
 * 4:3 (1440 wide) to 20:9 (2400 wide). The home button sits in the top-left corner.
 */
export interface Stage {
  /** Title: the play button. */
  play: Pt;
  /** Home: where recipe card i of n sits. */
  card: (i: number, n: number) => Pt;
  /** Recipe: the home button and its scale. */
  home: Pt;
  homeScale: number;
  /** Where the dish (on its board) rests during the whole recipe. */
  dishHome: Pt;
  /** Center of the left column (this step's ingredients). */
  side: Pt;
  /** Roll: the rolling pin's resting spot; it rests upright (rotated 90 degrees) in the left column. */
  pinRest: Pt;
  pinRestAngle: number;
  /** Spread: the sauce bowl. */
  bowl: Pt;
  /** Sprinkle: the shaker's resting spot. */
  shaker: Pt;
  /** Decorate: bin i of n (two columns), the bin scale (bins are as big as the column allows), the done button. */
  bin: (i: number, n: number) => Pt;
  binScale: (n: number) => number;
  decorateDish: Pt;
  done: Pt;
  /** Bake: the oven (left of the dish, side by side) and its scale; the dish waits at home. */
  oven: Pt;
  ovenScale: number;
  dishWait: Pt;
  /** The character: center and scale (75-100% of native, from the width left over). */
  character: Pt;
  charScale: number;
  /** Left edge of the character's frame (anything dropped past it lands on her). */
  charLeft: number;
}

/** Native sizes the layout reasons about (opaque extents of the art, in world units at k = 1). */
const BOARD_W = 786; // tray: the round board is 786 wide inside its 820 frame
const CHAR_W = 600; // character frame (the arms reach almost the full width)
const CHAR_H = 700;
const OVEN_W = 628; // oven body inside its 700 frame
const LEFT_W = 480; // left column: two bin columns
const GAP = 25;
const BIN_TEX = 240; // topping-bin viewBox
const BIN_REACH = 30; // a bin's touch area reaches this far beyond its drawing (DecorateStep)
const HOME_TEX = 240; // btn-home viewBox
const HOME_FACTOR = 0.85; // 204 units: over the 200 minimum, and small enough to stay out of the way
const HOME_PAD = 30; // its hit circle reaches this far beyond the art

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

export function getStage(L: Layout): Stage {
  const { W, k, m, Y } = L;
  const gap = GAP * k;

  // Left column, starting at the left thumb strip.
  const leftW = LEFT_W * k;
  const sideX = m + leftW / 2;

  // Character: right column, ending at the right thumb strip, as big as the leftover width allows.
  const spare = W - 2 * m - leftW - BOARD_W * k - 2 * gap;
  const charScale = clamp(spare / (CHAR_W * k), 0.75, 1) * k;
  const charW = CHAR_W * charScale;
  const charLeft = W - m - charW;
  // Feet near the bottom edge (the art may reach into the palm strip: she is not a button).
  const character = { x: W - m - charW / 2, y: Y(1070) - (CHAR_H / 2) * charScale };

  // The dish: centered in the space between the left column and the character.
  const dishHome = { x: (m + leftW + charLeft) / 2, y: Y(590) };

  // Home button: top-left corner, its whole hit circle inside the allowed area.
  const homeScale = HOME_FACTOR * k;
  const homeR = (HOME_TEX / 2) * homeScale + HOME_PAD * k;
  const home = { x: m + homeR, y: homeR };

  // Bins: 2 columns under the home button, rows filling down to the palm strip. Their touch
  // areas reach BIN_REACH beyond the drawings, so that margin is kept free on every outer side
  // (thumb strip, palm strip, home button).
  const reach = BIN_REACH * k;
  const binsTop = home.y + homeR + reach;
  const binsBottom = Y(994) - reach;
  const binsLeft = m + reach;
  const rowsOf = (n: number) => Math.max(1, Math.ceil(n / 2));
  const cellW = (leftW - reach) / 2;
  const cellH = (n: number) => (binsBottom - binsTop) / rowsOf(n);
  const binScale = (n: number) => (Math.min(cellW, cellH(n)) - 10 * k) / BIN_TEX;
  const bin = (i: number, n: number) => ({
    x: binsLeft + cellW * ((i % 2) + 0.5),
    y: binsTop + cellH(n) * (Math.floor(i / 2) + 0.5),
  });

  // Oven: side by side with the dish, filling the space left of the board.
  const ovenRoom = dishHome.x - (BOARD_W / 2) * k - gap - m;
  // (at most 95%, so its top stays clear of the home button on the widest screens)
  const ovenScale = clamp(ovenRoom / (OVEN_W * k), 0.75, 0.95) * k;
  const oven = { x: m + ovenRoom / 2, y: Y(600) };

  return {
    play: { x: L.cx, y: L.cy },
    card: (i, n) => (n === 1 ? { x: L.cx, y: L.cy } : { x: L.cx + ((i % 3) - 1) * 520 * k, y: Y(300 + Math.floor(i / 3) * 560) }),
    home,
    homeScale,
    dishHome,
    side: { x: sideX, y: dishHome.y },
    pinRest: { x: sideX, y: dishHome.y },
    pinRestAngle: 90,
    bowl: { x: sideX, y: dishHome.y },
    shaker: { x: sideX, y: dishHome.y },
    bin,
    binScale,
    decorateDish: dishHome,
    // Done: top of the right column, above the character's head.
    done: { x: character.x, y: Y(170) },
    oven,
    ovenScale,
    dishWait: dishHome,
    character,
    charScale,
    charLeft,
  };
}
