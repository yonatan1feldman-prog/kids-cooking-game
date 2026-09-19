import type { Layout } from './layout';

type Pt = { x: number; y: number };

/**
 * Every fixed position on screen, in one table. Scenes and steps read their anchors from
 * here and never hard-code coordinates, so a screen layout is data, not code.
 * All points are GAME coordinates (already through the layout).
 */
export interface Stage {
  /** Title: the play button. */
  play: Pt;
  /** Home: where recipe card i of n sits. */
  card: (i: number, n: number) => Pt;
  /** Recipe: the home button. */
  home: Pt;
  /** Where the dish (on its board) rests by default. */
  dishHome: Pt;
  /** Roll: the rolling pin's resting spot. */
  pinRest: Pt;
  /** Spread: the sauce bowl. */
  bowl: Pt;
  /** Sprinkle: the shaker's resting spot. */
  shaker: Pt;
  /** Decorate: bin i of n, the dish while decorating, the done button. */
  bin: (i: number, n: number) => Pt;
  decorateDish: Pt;
  done: Pt;
  /** Bake: the oven, and where the dish waits next to it. */
  oven: Pt;
  dishWait: Pt;
  /** Feed: the character's center. */
  character: Pt;
}

/** Portrait anchors in 1080x1920 design coordinates. */
const PORTRAIT = {
  play: { x: 540, y: 960 },
  card: { one: { x: 540, y: 960 }, x0: 290, dx: 500, y0: 620, dy: 640 },
  home: { x: 160, y: 160 },
  dishHome: { x: 540, y: 1110 },
  pinRest: { x: 540, y: 540 },
  bowl: { x: 820, y: 500 },
  shaker: { x: 850, y: 470 },
  bins: { top: 400, cols: 3, dx: 290, dy: 260, cx: 540 },
  decorateDish: { x: 540, y: 1175 },
  done: { x: 860, y: 1610 },
  oven: { x: 540, y: 480 },
  dishWait: { x: 540, y: 1330 },
  character: { x: 540, y: 470 },
};

export function getStage(L: Layout): Stage {
  const T = PORTRAIT;
  const at = (p: Pt) => L.P(p.x, p.y);
  return {
    play: at(T.play),
    card: (i, n) => (n === 1 ? at(T.card.one) : L.P(T.card.x0 + (i % 2) * T.card.dx, T.card.y0 + Math.floor(i / 2) * T.card.dy)),
    home: at(T.home),
    dishHome: at(T.dishHome),
    pinRest: at(T.pinRest),
    bowl: at(T.bowl),
    shaker: at(T.shaker),
    bin: (i, n) => {
      const { cols, dx, dy, top, cx } = T.bins;
      const row = Math.floor(i / cols);
      const col = i % cols;
      const inRow = Math.min(cols, n - row * cols);
      return L.P(cx + (col - (inRow - 1) / 2) * dx, top + row * dy);
    },
    decorateDish: at(T.decorateDish),
    done: at(T.done),
    oven: at(T.oven),
    dishWait: at(T.dishWait),
    character: at(T.character),
  };
}
