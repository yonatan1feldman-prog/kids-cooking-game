import type { Layout } from './layout';

type Pt = { x: number; y: number };
/** A box in world coordinates. */
export type Box = { x0: number; y0: number; x1: number; y1: number };
/** Where a layered figure stands: its frame centre (x, y) and its image scale. */
export type Spot = Pt & { scale: number };

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
  /** Title: the play button, and the logo above it (the art agent's title scene, scenes-prep.js). */
  play: Pt;
  titleLogo: Pt;
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
  /** The right column (Mom's place): centre and scale (75-100% of native, from the width left over). */
  character: Pt;
  charScale: number;
  /** Left edge of the right column. */
  charLeft: number;
  /**
   * Mom: bottom-centre of her 800x800 frame (x = her body centre line, y = the screen bottom, where her
   * waist is cut off) and her scale (= charScale). `momFace` is kept clear of stars and of Pipa.
   */
  mom: Spot;
  momFace: Box;
  /**
   * Pipa the hedgehog, small, sitting on the counter beside Mom for the whole recipe (frame centre and scale).
   * Null where there is no room for her (4:3): there she only comes for the feeding step.
   */
  pet: Spot | null;
  /** Feeding: Pipa big, on the board's right rim, between the pizza and Mom (Mom's face stays clear). */
  feedPet: Spot;
  /** Feeding: how far Mom steps to the right to make room for Pipa (0 on 20:9), her face still on screen. */
  feedMomShift: number;
  /** Feeding: a slice dropped right of this line lands at Pipa (her frame's opaque left edge). */
  feedPetLeft: number;
}

/** Native sizes the layout reasons about (opaque extents of the art, in world units at k = 1). */
const BOARD_W = 786; // tray: the round board is 786 wide inside its 820 frame
const CHAR_W = 600; // character frame (the arms reach almost the full width)
const CHAR_H = 700;
const OVEN_W = 636; // oven (opaque x 34-664 of its 700 frame, centred at 350: 2 x 316, plus a little air)
const LEFT_W = 480; // left column: two bin columns
const GAP = 25;
const BIN_TEX = 240; // topping-bin viewBox
const BIN_REACH = 30; // a bin's touch area reaches this far beyond its drawing (DecorateStep)
const HOME_TEX = 240; // btn-home viewBox
const HOME_FACTOR = 0.85; // 204 units: over the 200 minimum, and small enough to stay out of the way
const HOME_PAD = 30; // its hit circle reaches this far beyond the art
// Mom (800x800 frame, README-mom.md): body centre line x 500; her face (hair to chin) x 330-670, y 40-420.
const MOM_FRAME = 800;
const MOM_CX = 500;
const MOM_FACE = { x0: 330, y0: 40, x1: 670, y1: 420 };
const MOM_BODY_HALF = 190; // her body's half width at the counter
// Pipa (600x700 frame): opaque x 30-574, feet at y 684. Small beside Mom at 0.4, big in the feeding step at 0.62
// (the art agent's checked composition, images-b/scenes.js).
const PET_W = 600;
const PET_H = 700;
const PET_FOOT = 684;
const PET_OPAQUE_X0 = 30;
const PET_OPAQUE_X1 = 574;
const PET_OPAQUE_Y0 = 44;
const PET_SMALL = 0.4;
const PET_BIG = 0.62;
const DOUGH_R = 336; // the pizza's opaque radius on the board (dough-flat opaque x 22-694)
/** Pipa beside Mom only where the screen is wide enough (16:9 and wider). */
const PET_MIN_W = 1700;

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
  // Square cells; when there is height to spare (narrow screens) the grid sits on the counter, packed from the bottom.
  const cell = (n: number) => Math.min(cellW, cellH(n));
  const binScale = (n: number) => (cell(n) - 10 * k) / BIN_TEX;
  const bin = (i: number, n: number) => ({
    x: binsLeft + cellW * ((i % 2) + 0.5),
    y: binsBottom - cell(n) * (rowsOf(n) - Math.floor(i / 2) - 0.5),
  });

  // Oven: side by side with the dish, filling the space left of the board.
  const ovenRoom = dishHome.x - (BOARD_W / 2) * k - gap - m;
  // (at most 90% and a little low, so its top (opaque from y 20) stays clear of the home button on the widest screens)
  const ovenScale = clamp(ovenRoom / (OVEN_W * k), 0.75, 0.9) * k;
  const oven = { x: m + ovenRoom / 2, y: Y(612) };

  // Mom: her frame's bottom edge on the screen bottom, her body centre on the right column's centre.
  const s = charScale;
  const mom = { x: character.x, y: L.H, scale: s };
  const momLeft = mom.x - MOM_CX * s;
  const momTop = L.H - MOM_FRAME * s;
  const momFace = { x0: momLeft + MOM_FACE.x0 * s, y0: momTop + MOM_FACE.y0 * s, x1: momLeft + MOM_FACE.x1 * s, y1: momTop + MOM_FACE.y1 * s };

  // The pizza's right edge at height y (Pipa must never hide the pizza itself; the board rim is fine).
  const boardRight = dishHome.x + (BOARD_W / 2) * k;
  const pizzaRightAt = (y: number) => {
    const dy = Math.abs(y - dishHome.y);
    const R = DOUGH_R * k;
    return dishHome.x + (dy < R ? Math.sqrt(R * R - dy * dy) : 0);
  };

  // Pipa small: on the counter between the pizza and Mom, feet at Y(984) (just above the palm strip).
  // Her opaque box stays clear of the pizza and of Mom's face; where that gap is narrow (16:9) she is smaller.
  let pet: Spot | null = null;
  if (W >= PET_MIN_W) {
    const place = (ps: number) => {
      const top = Y(984) - PET_FOOT * ps;
      const left = pizzaRightAt(top + (PET_OPAQUE_Y0 + 40) * ps) + 10 * k;
      const right = momFace.x0 - 10 * k;
      return { ps, top, left, right };
    };
    let p = place(PET_SMALL * k);
    const need = (PET_OPAQUE_X1 - PET_OPAQUE_X0) * p.ps;
    if (p.right - p.left < need) p = place(Math.max(0.25 * k, (p.right - p.left) / (PET_OPAQUE_X1 - PET_OPAQUE_X0)));
    // Preferred: centred in the gap between the board and Mom's body (the art agent's placement), then kept in bounds.
    const bodyLeft = mom.x - MOM_BODY_HALF * s;
    const pw = PET_W * p.ps;
    let x0 = (boardRight + bodyLeft) / 2 - pw / 2 + PET_OPAQUE_X0 * p.ps;
    x0 = Math.min(Math.max(x0, p.left), p.right - (PET_OPAQUE_X1 - PET_OPAQUE_X0) * p.ps);
    const frameLeft = x0 - PET_OPAQUE_X0 * p.ps;
    pet = { x: frameLeft + pw / 2, y: p.top + (PET_H / 2) * p.ps, scale: p.ps };
  }

  // Pipa big (feeding): on the board's right rim; her opaque right edge stays left of Mom's face. Where
  // that doesn't fit (16:9, 4:3) Mom steps right, just enough, keeping her whole face on screen.
  const bs = PET_BIG * k;
  const bw = PET_W * bs;
  const wantX = boardRight - bw * 0.25;
  const needShift = wantX + PET_OPAQUE_X1 * bs + 10 * k - momFace.x0;
  const feedMomShift = Math.max(0, Math.min(needShift, W - 8 * k - momFace.x1));
  const px = Math.min(wantX, momFace.x0 + feedMomShift - 10 * k - PET_OPAQUE_X1 * bs);
  const feedTop = Y(984) - PET_FOOT * bs;
  const feedPet = { x: px + bw / 2, y: feedTop + (PET_H / 2) * bs, scale: bs };

  // Title: logo and play button in one column: left of centre on wide screens, centred in the space left
  // of Mom's face on narrow ones (the art agent's title scene).
  const titleX = W >= PET_MIN_W ? dishHome.x - 80 * k : (m + momLeft + MOM_FACE.x0 * s) / 2;

  return {
    play: { x: titleX, y: Y(740) },
    titleLogo: { x: titleX, y: Y(330) },
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
    mom,
    momFace,
    pet,
    feedPet,
    feedMomShift,
    feedPetLeft: px + PET_OPAQUE_X0 * bs,
  };
}
