import Phaser from 'phaser';
import { TUNING } from './tuning';

/**
 * The puzzle's pieces, cut at runtime from a photo in the memory book (no art of their own). Classic jigsaw
 * shapes: every inner edge has a round tab on one side and the matching hole on the other, so the shape helps
 * too, but a 4-5-year-old mostly uses the picture (research/puzzle-spec.md). Pieces are never rotated.
 */

type P = { x: number; y: number };

/** One piece's edges, clockwise from the top: 0 = flat (the picture's border), 1 = a tab out, -1 = a hole. */
export type Edges = [number, number, number, number];

export interface PieceShape {
  col: number;
  row: number;
  edges: Edges;
}

/** Brown ink of the paper art (the same outline colour as the cards and the album). */
const INK = 'rgba(107, 66, 38, 0.95)';

/** The cut: `cols` x `rows` pieces with random tabs (a fresh puzzle each time, the same picture). */
export function cutGrid(cols: number, rows: number, rnd: () => number = Math.random): PieceShape[] {
  // h[r][c]: the edge under row r (between r and r + 1); v[r][c]: the edge right of column c.
  const flip = () => (rnd() < 0.5 ? 1 : -1);
  const h = Array.from({ length: rows - 1 }, () => Array.from({ length: cols }, flip));
  const v = Array.from({ length: rows }, () => Array.from({ length: cols - 1 }, flip));
  const out: PieceShape[] = [];
  for (let row = 0; row < rows; row++)
    for (let col = 0; col < cols; col++) {
      const top = row === 0 ? 0 : -h[row - 1][col];
      const right = col === cols - 1 ? 0 : v[row][col];
      const bottom = row === rows - 1 ? 0 : h[row][col];
      const left = col === 0 ? 0 : -v[row][col - 1];
      out.push({ col, row, edges: [top, right, bottom, left] });
    }
  return out;
}

/** The pieces' play order for Mom's hint and help: the corners, then the border, then the middle. */
export function helpOrder(shapes: PieceShape[]): number[] {
  const rank = (s: PieceShape) => s.edges.filter((e) => e === 0).length;
  return shapes.map((s, i) => ({ i, r: rank(s) })).sort((a, b) => b.r - a.r || a.i - b.i).map((o) => o.i);
}

/**
 * The outline of one piece of a `w` x `h` cell, clockwise, as points relative to the cell's top-left corner
 * (tabs reach outside the cell by up to `tabReach(w, h)`). `m` is the size the tabs are drawn from, the
 * cell's shorter side, so every tab of a puzzle is the same size.
 */
export function piecePath(w: number, h: number, edges: Edges): P[] {
  const m = Math.min(w, h);
  const pts: P[] = [];
  const corners: P[] = [
    { x: 0, y: 0 },
    { x: w, y: 0 },
    { x: w, y: h },
    { x: 0, y: h },
  ];
  for (let e = 0; e < 4; e++) {
    const a = corners[e];
    const b = corners[(e + 1) % 4];
    const len = Math.hypot(b.x - a.x, b.y - a.y);
    const d = { x: (b.x - a.x) / len, y: (b.y - a.y) / len };
    // Outward normal of a clockwise outline (screen y points down).
    const n = { x: d.y, y: -d.x };
    const s = edges[e];
    const at = (u: number, v: number) => ({ x: a.x + d.x * u + n.x * v * s, y: a.y + d.y * u + n.y * v * s });
    pts.push(at(0, 0));
    if (s === 0) continue;
    const c = len / 2;
    // A neck and a round head: the circle's centre sits 0.14 m out, radius 0.12 m; the neck meets it 0.05 m out.
    const cy = 0.14 * m;
    const r = 0.12 * m;
    const nx = Math.sqrt(r * r - (0.05 * m - cy) ** 2);
    pts.push(at(c - 0.085 * m, 0));
    const t0 = Math.atan2(0.05 * m - cy, -nx);
    const t1 = Math.atan2(0.05 * m - cy, nx);
    // The long way round, through the far side of the head.
    const sweep = 2 * Math.PI - (t1 - t0);
    const N = 22;
    for (let i = 0; i <= N; i++) {
      const t = t0 - (sweep * i) / N;
      pts.push(at(c + r * Math.cos(t), cy + r * Math.sin(t)));
    }
    pts.push(at(c + 0.085 * m, 0));
  }
  return pts;
}

/** How far a tab reaches outside its cell (the padding every piece's bitmap needs around its cell). */
export const tabReach = (w: number, h: number) => 0.28 * Math.min(w, h);

function trace(g: CanvasRenderingContext2D, pts: P[], ox: number, oy: number) {
  g.beginPath();
  pts.forEach((p, i) => (i ? g.lineTo(p.x + ox, p.y + oy) : g.moveTo(p.x + ox, p.y + oy)));
  g.closePath();
}

/**
 * Draws every piece of `img` (shown `size` x `size` world units) into its own texture, `${prefix}-${i}`, and the
 * board's guide (`${prefix}-guide`: the picture faint, with every piece's outline). Each piece texture is its
 * cell plus `pad` on every side; its centre is the cell's centre. Returns the pad.
 */
export function makePieceTextures(game: Phaser.Game, img: CanvasImageSource, size: number, cols: number, rows: number, shapes: PieceShape[], prefix: string) {
  const w = size / cols;
  const h = size / rows;
  const pad = Math.ceil(tabReach(w, h)) + 4;
  const line = Math.max(2, size * 0.004);
  const tw = Math.ceil(w + 2 * pad);
  const th = Math.ceil(h + 2 * pad);
  shapes.forEach((s, i) => {
    const key = `${prefix}-${i}`;
    if (game.textures.exists(key)) game.textures.remove(key);
    const c = document.createElement('canvas');
    c.width = tw;
    c.height = th;
    const g = c.getContext('2d')!;
    const pts = piecePath(w, h, s.edges);
    g.save();
    trace(g, pts, pad, pad);
    g.clip();
    g.imageSmoothingEnabled = true;
    g.imageSmoothingQuality = 'high';
    g.drawImage(img, pad - s.col * w, pad - s.row * h, size, size);
    // A soft light along the top-left and a shade along the bottom-right: a piece of card, not a flat cut.
    g.lineWidth = line * 3;
    g.strokeStyle = 'rgba(255, 250, 235, 0.35)';
    trace(g, pts, pad - line, pad - line);
    g.stroke();
    g.strokeStyle = 'rgba(80, 45, 20, 0.22)';
    trace(g, pts, pad + line, pad + line);
    g.stroke();
    g.restore();
    g.lineWidth = line;
    g.strokeStyle = INK;
    trace(g, pts, pad, pad);
    g.stroke();
    game.textures.addCanvas(key, c);
  });

  // The guide on the board: the picture, faint, and where each piece goes.
  const key = `${prefix}-guide`;
  if (game.textures.exists(key)) game.textures.remove(key);
  const c = document.createElement('canvas');
  c.width = c.height = Math.ceil(size);
  const g = c.getContext('2d')!;
  g.fillStyle = '#fff6e6';
  g.fillRect(0, 0, size, size);
  g.globalAlpha = TUNING.puzzle.ghost;
  g.drawImage(img, 0, 0, size, size);
  g.globalAlpha = 1;
  g.lineWidth = line;
  g.strokeStyle = 'rgba(160, 110, 70, 0.45)';
  g.setLineDash([line * 4, line * 3]);
  shapes.forEach((s) => {
    trace(g, piecePath(w, h, s.edges), s.col * w, s.row * h);
    g.stroke();
  });
  game.textures.addCanvas(key, c);
  return { pad, w, h };
}

/** The puzzle button's picture (the album, beside an enlarged photo): one orange piece on the album's cream disc. */
export const PUZZLE_ICON = 'puzzle-icon';

export function makePuzzleIcon(game: Phaser.Game) {
  if (game.textures.exists(PUZZLE_ICON)) return;
  const S = 240;
  const c = document.createElement('canvas');
  c.width = c.height = S;
  const g = c.getContext('2d')!;
  const disc = (x: number, y: number, fill: string) => {
    g.beginPath();
    g.arc(x, y, S * 0.44, 0, Math.PI * 2);
    g.fillStyle = fill;
    g.fill();
  };
  disc(S / 2 + 6, S / 2 + 8, 'rgba(0,0,0,0.15)');
  disc(S / 2, S / 2, '#fff6e6');
  g.lineWidth = S * 0.06;
  g.strokeStyle = '#c98b5b';
  g.stroke();
  // One piece with a tab on the right and at the top, a hole at the bottom: it can only be a puzzle.
  const w = S * 0.4;
  const pts = piecePath(w, w, [1, 1, -1, 0]);
  const ox = S / 2 - w / 2 - S * 0.03;
  const oy = S / 2 - w / 2 + S * 0.03;
  trace(g, pts, ox + 4, oy + 5);
  g.fillStyle = 'rgba(0,0,0,0.14)';
  g.fill();
  trace(g, pts, ox, oy);
  g.fillStyle = '#ff8c42';
  g.fill();
  g.lineWidth = S * 0.022;
  g.strokeStyle = '#8a4a1f';
  g.stroke();
  game.textures.addCanvas(PUZZLE_ICON, c);
}

/** How many puzzles she has finished on this device (only to make the next one a little bigger; never shown). */
const KEY = 'cooking.puzzles';
export function puzzlesDone(): number {
  try {
    return Math.max(0, parseInt(localStorage.getItem(KEY) ?? '0', 10) || 0);
  } catch {
    return 0;
  }
}
export function puzzleFinished() {
  try {
    localStorage.setItem(KEY, String(puzzlesDone() + 1));
  } catch {
    /* not kept: the next puzzle is simply the same size */
  }
}
/** The grid for the next puzzle: 2x2, then 3x2, 3x3, and 4x3 from then on. */
export function nextGrid(): readonly [number, number] {
  const g = TUNING.puzzle.grids;
  return g[Math.min(puzzlesDone(), g.length - 1)];
}
