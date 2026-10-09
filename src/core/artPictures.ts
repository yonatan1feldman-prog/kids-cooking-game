import type { NameKey } from './audio';

/**
 * The pictures of the art corner (ArtScene, research/drawing-stages-spec.md), drawn by the game itself: the outlines
 * she traces, the dot pictures she joins, the line drawings she colours in, the blanks of the mirror drawing. All in
 * SHEET UNITS: the easel's sheet is 1000 x 800 (5:4) whatever its size on screen.
 */
export const SHEET_W = 1000;
export const SHEET_H = 800;

export type Pt = [number, number];
export type Paint = 'red' | 'yellow' | 'blue' | 'green' | 'pink' | 'purple' | 'orange';
/** The paints (the same numbers as PAINT in assets-src/images-b-art/tools/gen_art.py, the pots' art). */
export const PAINT: Record<Paint, string> = {
  red: '#E8473A', yellow: '#F7C933', blue: '#3E8FE0', green: '#5CB547', pink: '#F27FB2', purple: '#9A62C9', orange: '#F58B2E',
};
/** The pots on each level: five, then seven (purple and orange). */
export const POTS: readonly (readonly Paint[])[] = [
  ['red', 'yellow', 'blue', 'green', 'pink'],
  ['red', 'yellow', 'blue', 'green', 'pink', 'purple', 'orange'],
];
export const RAINBOW = ['#E8473A', '#F58B2E', '#F7C933', '#5CB547', '#3E8FE0', '#9A62C9'];
export const INK_CSS = '#5B3A29';

/** How a finished picture comes alive. */
export type Alive = 'spin' | 'swim' | 'bounce' | 'twinkle' | 'rock' | 'beat' | 'fly' | 'wiggle';

// ---------------------------------------------------------------- shapes

const TAU = Math.PI * 2;
function circle(cx: number, cy: number, r: number, n = 64): Pt[] {
  return Array.from({ length: n }, (_, i) => [cx + Math.cos((i / n) * TAU) * r, cy + Math.sin((i / n) * TAU) * r] as Pt);
}
function ellipse(cx: number, cy: number, rx: number, ry: number, n = 64): Pt[] {
  return Array.from({ length: n }, (_, i) => [cx + Math.cos((i / n) * TAU) * rx, cy + Math.sin((i / n) * TAU) * ry] as Pt);
}
function egg(cx: number, cy: number, rx: number, ry: number, n = 64): Pt[] {
  return Array.from({ length: n }, (_, i) => {
    const t = (i / n) * TAU;
    return [cx + Math.cos(t) * rx * (1 + 0.14 * Math.sin(t)), cy + Math.sin(t) * ry] as Pt;
  });
}
function heart(cx: number, cy: number, s: number, n = 72): Pt[] {
  return Array.from({ length: n }, (_, i) => {
    const t = (i / n) * TAU;
    const x = 16 * Math.sin(t) ** 3;
    const y = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
    return [cx + x * s, cy + y * s] as Pt;
  });
}
function arc(cx: number, cy: number, r: number, a0: number, a1: number, n = 40): Pt[] {
  return Array.from({ length: n + 1 }, (_, i) => {
    const a = a0 + ((a1 - a0) * i) / n;
    return [cx + Math.cos(a) * r, cy + Math.sin(a) * r] as Pt;
  });
}
function quad(a: Pt, c: Pt, b: Pt, n = 24): Pt[] {
  return Array.from({ length: n + 1 }, (_, i) => {
    const t = i / n;
    const u = 1 - t;
    return [u * u * a[0] + 2 * u * t * c[0] + t * t * b[0], u * u * a[1] + 2 * u * t * c[1] + t * t * b[1]] as Pt;
  });
}
function star(cx: number, cy: number, ro: number, ri: number, points = 5): Pt[] {
  return Array.from({ length: points * 2 }, (_, i) => {
    const a = -Math.PI / 2 + (i * Math.PI) / points;
    const r = i % 2 === 0 ? ro : ri;
    return [cx + Math.cos(a) * r, cy + Math.sin(a) * r] as Pt;
  });
}

/** A polyline made denser: a point every `step` units along it (closed: back to the start). */
export function resample(pts: Pt[], closed: boolean, step: number): Pt[] {
  const src = closed ? [...pts, pts[0]] : pts;
  const out: Pt[] = [src[0]];
  let carry = 0;
  for (let i = 1; i < src.length; i++) {
    const [ax, ay] = src[i - 1];
    const [bx, by] = src[i];
    const len = Math.hypot(bx - ax, by - ay);
    let d = step - carry;
    while (d <= len) {
      out.push([ax + ((bx - ax) * d) / len, ay + ((by - ay) * d) / len]);
      d += step;
    }
    carry = len - (d - step);
  }
  if (!closed) out.push(src[src.length - 1]);
  return out;
}

export function lengthOf(pts: Pt[], closed: boolean) {
  let L = 0;
  for (let i = 1; i < pts.length; i++) L += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
  if (closed) L += Math.hypot(pts[0][0] - pts[pts.length - 1][0], pts[0][1] - pts[pts.length - 1][1]);
  return L;
}

// ---------------------------------------------------------------- 1. trace

export interface TracePart {
  pts: Pt[];
  closed: boolean;
}
export interface TracePic {
  id: string;
  name: NameKey | null;
  parts: TracePart[];
  alive: Alive;
  /** The paint fill (closed parts are filled at the end; `fill: false` keeps a part a line, the rainbow, a seam). */
  fill?: boolean[];
  /** A face drawn on it when it comes alive (the sun), or an eye (the fish). */
  face?: { at: Pt; r: number; eyeOnly?: boolean };
  /** Rays drawn round it when it comes alive (the sun). */
  rays?: { at: Pt; r0: number; r1: number };
  /** The rainbow: its arc becomes six coloured bands. */
  rainbow?: { at: Pt; r: number };
}

export const TRACE: readonly (readonly TracePic[])[] = [
  [
    { id: 'sun', name: 'name-sun', parts: [{ pts: circle(500, 400, 220), closed: true }], alive: 'spin', face: { at: [500, 400], r: 220 }, rays: { at: [500, 400], r0: 250, r1: 330 } },
    { id: 'ball', name: 'name-ball', parts: [{ pts: circle(500, 400, 270), closed: true }, { pts: quad([240, 330], [500, 520], [760, 330]), closed: false }], alive: 'bounce', fill: [true, false] },
    { id: 'egg', name: 'name-egg', parts: [{ pts: egg(500, 400, 200, 290), closed: true }], alive: 'wiggle' },
    { id: 'fish', name: 'name-fish', parts: [{ pts: ellipse(560, 400, 250, 160), closed: true }, { pts: [[320, 400], [150, 260], [150, 540]], closed: true }], alive: 'swim', face: { at: [700, 360], r: 90, eyeOnly: true } },
    { id: 'heart', name: 'name-heart', parts: [{ pts: heart(500, 420, 19), closed: true }], alive: 'beat' },
    { id: 'rainbow', name: 'name-rainbow', parts: [{ pts: arc(500, 640, 330, Math.PI, TAU), closed: false }], alive: 'twinkle', fill: [false], rainbow: { at: [500, 640], r: 330 } },
    // (challenge round: more pictures, so a fifth visit is not the first picture again)
    { id: 'balloon', name: 'name-balloon', parts: [{ pts: ellipse(500, 320, 180, 220), closed: true }, { pts: quad([500, 540], [430, 640], [510, 760]), closed: false }], alive: 'rock', fill: [true, false] },
    { id: 'kite', name: 'name-kite', parts: [{ pts: [[500, 100], [710, 330], [500, 610], [290, 330]], closed: true }, { pts: [...quad([500, 610], [400, 660], [500, 700], 12), ...quad([500, 700], [600, 740], [500, 780], 12).slice(1)], closed: false }], alive: 'rock', fill: [true, false] },
  ],
  [
    { id: 'star', name: 'name-star', parts: [{ pts: star(500, 420, 330, 140), closed: true }], alive: 'twinkle' },
    { id: 'house', name: 'name-house', parts: [{ pts: [[300, 710], [300, 390], [500, 170], [700, 390], [700, 710]], closed: true }, { pts: [[440, 710], [440, 550], [560, 550], [560, 710]], closed: false }], alive: 'bounce', fill: [true, false] },
    { id: 'tree', name: 'name-tree', parts: [{ pts: [[500, 110], [700, 400], [610, 400], [760, 610], [240, 610], [390, 400], [300, 400]], closed: true }, { pts: [[460, 610], [460, 740], [540, 740], [540, 610]], closed: false }], alive: 'wiggle', fill: [true, false] },
    { id: 'boat', name: 'name-boat', parts: [{ pts: [[200, 540], [800, 540], [690, 700], [310, 700]], closed: true }, { pts: [[500, 510], [500, 130], [740, 500]], closed: true }], alive: 'rock' },
    { id: 'crown', name: 'name-crown', parts: [{ pts: [[240, 640], [240, 280], [370, 450], [500, 200], [630, 450], [760, 280], [760, 640]], closed: true }], alive: 'twinkle' },
    { id: 'kite', name: 'name-kite', parts: [{ pts: [[500, 90], [720, 320], [500, 600], [280, 320]], closed: true }, { pts: [[280, 320], [720, 320]], closed: false }, { pts: [[500, 600], [430, 680], [560, 720], [480, 780]], closed: false }], alive: 'rock', fill: [true, false, false] },
    { id: 'balloon', name: 'name-balloon', parts: [{ pts: [...arc(500, 300, 210, Math.PI * 0.75, Math.PI * 2.25), [570, 580], [430, 580]], closed: true }, { pts: [[430, 640], [570, 640], [550, 740], [450, 740]], closed: true }], alive: 'rock' },
  ],
];

// ---------------------------------------------------------------- 2. join the dots

export interface DotsPic {
  id: string;
  name: NameKey | null;
  /** The dots, in the order she joins them; the last joins back to the first. */
  dots: Pt[];
  alive: Alive;
  /** Extra lines drawn when it comes alive (the fish's eye, the butterfly's body), sheet units. */
  eye?: Pt;
}

export const DOTS: readonly (readonly DotsPic[])[] = [
  [
    { id: 'house', name: 'name-house', dots: [[300, 700], [300, 380], [500, 170], [700, 380], [700, 700]], alive: 'bounce' },
    { id: 'fish', name: 'name-fish', dots: [[180, 250], [430, 260], [820, 400], [430, 540], [180, 550], [360, 400]], alive: 'swim', eye: [690, 370] },
    { id: 'heart', name: 'name-heart', dots: [[500, 300], [640, 180], [800, 320], [500, 700], [200, 320], [360, 180]], alive: 'beat' },
    { id: 'boat', name: 'name-boat', dots: [[200, 520], [470, 520], [470, 140], [700, 520], [820, 520], [680, 690], [340, 690]], alive: 'rock' },
    { id: 'kite', name: 'name-kite', dots: [[500, 110], [720, 340], [500, 690], [280, 340]], alive: 'rock' },
    { id: 'ice-cream', name: 'name-ice-cream', dots: [[500, 740], [330, 400], [330, 300], [420, 200], [580, 200], [670, 300], [670, 400]], alive: 'bounce' },
  ],
  [
    { id: 'star', name: 'name-star', dots: star(500, 420, 330, 140), alive: 'twinkle' },
    { id: 'butterfly', name: 'name-butterfly', dots: [[500, 300], [760, 150], [850, 330], [570, 420], [770, 650], [500, 560], [230, 650], [430, 420], [150, 330], [240, 150]], alive: 'fly' },
    { id: 'house', name: 'name-house', dots: [[230, 720], [230, 400], [500, 150], [770, 400], [770, 720], [590, 720], [590, 520], [410, 520], [410, 720]], alive: 'bounce' },
    { id: 'kite', name: 'name-kite', dots: [[500, 90], [610, 205], [720, 330], [610, 465], [500, 640], [390, 465], [280, 330], [390, 205]], alive: 'rock' },
    { id: 'ice-cream', name: 'name-ice-cream', dots: [[500, 750], [350, 450], [310, 370], [350, 290], [430, 245], [500, 160], [570, 245], [650, 290], [690, 370], [650, 450]], alive: 'bounce' },
  ],
];

// ---------------------------------------------------------------- 3. colour it in

export interface Area {
  /** The area's outline (SVG path data in sheet units); later areas lie over earlier ones. */
  d: string;
  /** Mom's colour (her model picture on level 2). */
  mom: Paint;
}
export interface ColourPic {
  id: string;
  areas: Area[];
  /** Ink lines that are not area edges (the cherry's stem, the mast). */
  lines?: string[];
  alive: Alive;
}

const circ = (cx: number, cy: number, r: number) => `M${cx - r},${cy} a${r},${r} 0 1,0 ${2 * r},0 a${r},${r} 0 1,0 ${-2 * r},0Z`;
const ell = (cx: number, cy: number, rx: number, ry: number) => `M${cx - rx},${cy} a${rx},${ry} 0 1,0 ${2 * rx},0 a${rx},${ry} 0 1,0 ${-2 * rx},0Z`;

export const COLOUR: readonly (readonly ColourPic[])[] = [
  [
    {
      id: 'house',
      alive: 'bounce',
      areas: [
        { d: 'M600,200 H660 V350 H600Z', mom: 'red' },
        { d: 'M250,390 L500,170 L750,390Z', mom: 'red' },
        { d: 'M300,380 H700 V710 H300Z', mom: 'yellow' },
        { d: 'M445,710 V540 H555 V710Z', mom: 'blue' },
        { d: 'M340,440 H430 V520 H340Z', mom: 'blue' },
      ],
    },
    {
      id: 'cupcake',
      alive: 'bounce',
      areas: [
        { d: 'M240,700 C240,770 760,770 760,700 C760,670 240,670 240,700Z', mom: 'blue' },
        { d: 'M330,480 L670,480 L620,700 L380,700Z', mom: 'pink' },
        { d: 'M300,500 C270,400 370,350 420,380 C440,290 560,290 580,380 C630,350 730,400 700,500Z', mom: 'yellow' },
        { d: circ(500, 285, 50), mom: 'red' },
      ],
      lines: ['M510,240 Q530,190 570,180'],
    },
    {
      id: 'teapot',
      alive: 'wiggle',
      areas: [
        { d: 'M320,440 C190,430 190,640 330,630 L330,580 C250,580 250,490 320,490Z', mom: 'blue' },
        { d: 'M680,540 C760,520 780,440 830,400 L860,430 C820,470 800,590 690,630Z', mom: 'blue' },
        { d: ell(500, 530, 210, 170), mom: 'pink' },
        { d: 'M370,385 C380,300 620,300 630,385Z', mom: 'yellow' },
        { d: circ(500, 300, 34), mom: 'green' },
      ],
    },
    {
      id: 'fish',
      alive: 'swim',
      areas: [
        { d: 'M440,260 C490,170 610,180 630,262Z', mom: 'red' },
        { d: 'M330,400 L150,270 L175,400 L150,530Z', mom: 'red' },
        { d: ell(540, 400, 250, 155), mom: 'orange' },
        { d: circ(680, 370, 40), mom: 'yellow' },
      ],
    },    {
      id: 'balloon',
      alive: 'rock',
      areas: [
        { d: 'M120,330 C110,290 160,265 195,290 C215,245 295,250 300,300 C340,300 345,350 300,355 L140,355 C100,355 100,330 120,330Z', mom: 'blue' },
        { d: 'M500,110 C700,110 770,290 690,410 L580,560 L420,560 L310,410 C230,290 300,110 500,110Z', mom: 'red' },
        { d: 'M500,110 C565,190 590,400 565,560 L435,560 C410,400 435,190 500,110Z', mom: 'yellow' },
        { d: 'M430,630 H570 L555,730 H445Z', mom: 'orange' },
      ],
      lines: ['M425,560 L438,630', 'M575,560 L562,630'],
    },
    {
      id: 'snail',
      alive: 'wiggle',
      areas: [
        { d: circ(860, 140, 70), mom: 'yellow' },
        { d: 'M200,690 C200,640 260,620 320,620 L640,620 C700,620 700,470 770,470 C840,470 850,560 830,620 C820,660 800,690 760,690Z', mom: 'yellow' },
        { d: circ(450, 460, 175), mom: 'orange' },
        { d: circ(460, 455, 70), mom: 'red' },
      ],
      lines: ['M780,480 Q770,400 735,365', 'M810,482 Q830,405 862,385', 'M460,385 C560,380 570,520 460,530 C350,540 330,380 440,360', circ(795, 535, 9)],
    },
  ],
  [
    {
      id: 'garden',
      alive: 'bounce',
      areas: [
        { d: circ(140, 140, 80), mom: 'yellow' },
        { d: 'M820,560 H880 V730 H820Z', mom: 'orange' },
        { d: circ(850, 460, 115), mom: 'green' },
        { d: 'M520,250 H575 V360 L520,320Z', mom: 'purple' },
        { d: 'M210,410 L440,200 L670,410Z', mom: 'red' },
        { d: 'M250,400 H630 V730 H250Z', mom: 'pink' },
        { d: 'M400,730 V570 H490 V730Z', mom: 'blue' },
        { d: 'M285,460 H370 V545 H285Z', mom: 'yellow' },
      ],
    },
    {
      id: 'boat',
      alive: 'rock',
      areas: [
        { d: circ(860, 150, 75), mom: 'yellow' },
        { d: 'M90,210 C90,160 150,140 185,170 C215,115 305,125 305,185 C350,185 350,250 305,250 L130,250 C80,250 80,210 90,210Z', mom: 'pink' },
        { d: 'M0,640 C150,600 250,680 400,640 C550,600 650,680 800,640 C900,610 1000,660 1000,640 V800 H0Z', mom: 'blue' },
        { d: 'M240,560 L760,560 L680,680 L320,680Z', mom: 'red' },
        { d: 'M480,530 L480,200 L290,530Z', mom: 'yellow' },
        { d: 'M520,530 L520,240 L710,530Z', mom: 'orange' },
        { d: 'M500,200 L500,120 L600,160Z', mom: 'green' },
      ],
      lines: ['M500,560 V120'],
    },
    {
      id: 'flower',
      alive: 'wiggle',
      areas: [
        { d: 'M380,570 L620,570 L590,750 L410,750Z', mom: 'orange' },
        { d: 'M360,520 H640 V575 H360Z', mom: 'red' },
        { d: 'M478,520 V300 H522 V520Z', mom: 'green' },
        { d: 'M478,470 C420,420 350,440 330,475 C380,510 440,505 478,485Z', mom: 'green' },
        { d: 'M522,420 C580,370 650,390 670,425 C620,460 560,455 522,440Z', mom: 'green' },
        { d: [0, 1, 2, 3, 4, 5].map((i) => circ(Math.round(500 + Math.cos((i * Math.PI) / 3) * 95), Math.round(240 + Math.sin((i * Math.PI) / 3) * 95), 70)).join(' '), mom: 'pink' },
        { d: circ(500, 240, 58), mom: 'yellow' },
      ],
    },    {
      id: 'balloon',
      alive: 'rock',
      areas: [
        { d: circ(860, 150, 75), mom: 'yellow' },
        { d: 'M90,330 C80,290 130,265 165,290 C185,245 265,250 270,300 C310,300 315,350 270,355 L110,355 C70,355 70,330 90,330Z', mom: 'pink' },
        { d: 'M0,700 C200,640 400,700 600,680 C800,660 900,700 1000,690 V800 H0Z', mom: 'green' },
        { d: 'M500,100 C700,100 770,280 690,400 L580,550 L420,550 L310,400 C230,280 300,100 500,100Z', mom: 'red' },
        { d: 'M500,100 C565,180 590,390 565,550 L435,550 C410,390 435,180 500,100Z', mom: 'purple' },
        { d: 'M500,120 C522,200 528,390 518,550 L482,550 C472,390 478,200 500,120Z', mom: 'yellow' },
        { d: 'M430,610 H570 L555,700 H445Z', mom: 'orange' },
      ],
      lines: ['M425,550 L438,610', 'M575,550 L562,610'],
    },
    {
      id: 'snail',
      alive: 'wiggle',
      areas: [
        { d: circ(140, 140, 75), mom: 'yellow' },
        { d: 'M0,690 H1000 V800 H0Z', mom: 'green' },
        { d: 'M150,690 C150,640 210,620 270,620 L560,620 C620,620 620,470 690,470 C760,470 770,560 750,620 C740,660 720,690 680,690Z', mom: 'yellow' },
        { d: circ(390, 460, 170), mom: 'orange' },
        { d: circ(400, 455, 68), mom: 'red' },
        { d: [0, 1, 2, 3, 4].map((i) => circ(Math.round(880 + Math.cos((i * 2 * Math.PI) / 5 - Math.PI / 2) * 55), Math.round(420 + Math.sin((i * 2 * Math.PI) / 5 - Math.PI / 2) * 55), 42)).join(' '), mom: 'pink' },
        { d: circ(880, 420, 30), mom: 'purple' },
      ],
      lines: ['M700,480 Q690,400 655,365', 'M730,482 Q750,405 782,385', 'M400,385 C500,380 510,520 400,530 C290,540 270,380 380,360', circ(715, 535, 9), 'M880,500 V690'],
    },
  ],
];

// ---------------------------------------------------------------- 4. mirror magic

/** The butterfly (level 1): two wings mirrored at x 500, a body down the middle. Left half only; the right is mirrored. */
export const BUTTERFLY_LEFT = [
  'M500,380 C440,150 210,70 140,200 C80,320 200,430 500,405Z',
  'M500,415 C320,420 170,520 220,650 C270,760 450,670 500,440Z',
];
export const BUTTERFLY_BODY = ell(500, 410, 30, 190);
export const BUTTERFLY_FEELERS = ['M490,230 Q460,150 410,130', 'M510,230 Q540,150 590,130'];
/** The party plate (level 2): a round plate, mirrored both ways. */
export const PLATE = { cx: 500, cy: 400, r: 370, rim: 320 };

/** A mirror drawing: its shape (whole paths, and `left` halves the game mirrors at x 500), mirrored at x 500 (`both`:
 * also at y 400, the four quarters), what comes alive, and where Mom's hand draws its little loops (left / top-left). */
export interface MirrorPic {
  id: 'butterfly' | 'heart' | 'plate' | 'flower';
  name: NameKey | null;
  both: boolean;
  left?: string[];
  whole: string[];
  /** A faint ring inside (the plate's rim). */
  rim?: { cx: number; cy: number; r: number };
  alive: 'fly' | 'beat' | 'spin';
  spots: Pt[];
}
const ptsPath = (pts: Pt[]) => 'M' + pts.map(([x, y]) => `${Math.round(x)},${Math.round(y)}`).join(' L') + 'Z';
export const MIRROR: readonly (readonly MirrorPic[])[] = [
  [
    { id: 'butterfly', name: null, both: false, left: BUTTERFLY_LEFT, whole: [BUTTERFLY_BODY], alive: 'fly', spots: [[300, 260], [330, 560], [240, 330]] },
    { id: 'heart', name: 'name-heart', both: false, whole: [ptsPath(heart(500, 400, 20))], alive: 'beat', spots: [[300, 250], [380, 470], [230, 330]] },
  ],
  [
    { id: 'plate', name: null, both: true, whole: [circ(PLATE.cx, PLATE.cy, PLATE.r)], rim: { cx: PLATE.cx, cy: PLATE.cy, r: PLATE.rim }, alive: 'spin', spots: [[330, 260], [380, 340], [260, 330]] },
    {
      id: 'flower', name: 'name-flower', both: true, alive: 'spin', spots: [[350, 250], [290, 390], [470, 200]],
      whole: [...[0, 1, 2, 3, 4, 5, 6, 7].map((i) => circ(Math.round(500 + Math.cos((i * Math.PI) / 4) * 225), Math.round(400 + Math.sin((i * Math.PI) / 4) * 225), 115)), circ(500, 400, 130)],
    },
  ],
];

// ---------------------------------------------------------------- 5. the steamy window

export interface Hidden {
  id: 'bird' | 'cat' | 'sun' | 'rainbow';
  key: 'art-find-bird' | 'art-find-cat' | 'art-find-sun' | 'art-find-rainbow';
  name: NameKey;
  /** Its centre on the window (800 x 640 frame, art-window-view) and its display scale there. */
  at: Pt;
  scale: number;
}
export const HIDDEN: readonly Hidden[] = [
  { id: 'sun', key: 'art-find-sun', name: 'name-sun', at: [640, 150], scale: 0.85 },
  { id: 'rainbow', key: 'art-find-rainbow', name: 'name-rainbow', at: [360, 150], scale: 0.85 },
  { id: 'bird', key: 'art-find-bird', name: 'name-bird', at: [470, 330], scale: 0.9 },
  { id: 'cat', key: 'art-find-cat', name: 'name-cat', at: [650, 420], scale: 0.62 },
];
/** The window's two gardens, by visit: as drawn, and the same garden seen the other way round (the view mirrored, the
 * hidden things in other places). */
export const STEAM: readonly { flip: boolean; hidden: readonly Hidden[] }[] = [
  { flip: false, hidden: HIDDEN },
  {
    flip: true,
    hidden: [
      { id: 'sun', key: 'art-find-sun', name: 'name-sun', at: [170, 150], scale: 0.85 },
      { id: 'rainbow', key: 'art-find-rainbow', name: 'name-rainbow', at: [520, 160], scale: 0.85 },
      { id: 'bird', key: 'art-find-bird', name: 'name-bird', at: [300, 360], scale: 0.9 },
      { id: 'cat', key: 'art-find-cat', name: 'name-cat', at: [560, 430], scale: 0.62 },
    ],
  },
];

// ---------------------------------------------------------------- 6. stamps

export type StampId = 'sun' | 'cloud' | 'flower' | 'bird';
/** The four stamps' shapes: SVG paths round (0, 0), about 200 across (the same numbers as STAMP in gen_art.py, the
 * stamps' art), each sub-shape on its own (they are filled one by one, so overlaps never cut holes), and the print's paint. */
export const STAMP: Record<StampId, { parts: string[]; paint: string; name: NameKey }> = {
  sun: { parts: [ptsPath(star(0, 0, 100, 68, 10)), circ(0, 0, 66)], paint: '#F7C933', name: 'name-sun' },
  cloud: { parts: ['M-92,42 C-128,40 -126,-14 -86,-14 C-90,-62 -28,-74 -6,-38 C12,-84 88,-74 82,-16 C124,-16 124,42 86,42Z'], paint: '#3E8FE0', name: 'name-cloud' },
  flower: { parts: [...[0, 1, 2, 3, 4].map((i) => circ(Math.round(Math.cos((i * 2 * Math.PI) / 5 - Math.PI / 2) * 56), Math.round(Math.sin((i * 2 * Math.PI) / 5 - Math.PI / 2) * 56), 42)), circ(0, 0, 36)], paint: '#F27FB2', name: 'name-flower' },
  bird: { parts: [ell(8, 14, 74, 50), circ(-52, -30, 38), 'M58,4 L104,-36 L100,34Z', 'M-86,-40 L-114,-28 L-86,-18Z'], paint: '#E8473A', name: 'name-bird' },
};
export const STAMPS: StampId[] = ['sun', 'cloud', 'flower', 'bird'];
/** An outline to stamp: its shape (null on level 2: a plain circle, the pattern row), its centre and size (sheet units). */
export interface StampSlot {
  shape: StampId | null;
  at: Pt;
  s: number;
}
/** Level 1: the garden scenes (by visit): outlines of each stamp's shape, and the lines drawn round them (the ground, stems). */
export const STAMP_SCENES: readonly { slots: StampSlot[]; lines: string[] }[] = [
  {
    slots: [
      { shape: 'sun', at: [830, 150], s: 1.05 }, { shape: 'cloud', at: [200, 150], s: 1 }, { shape: 'cloud', at: [480, 110], s: 0.8 },
      { shape: 'bird', at: [560, 330], s: 0.85 }, { shape: 'flower', at: [260, 500], s: 0.95 }, { shape: 'flower', at: [700, 520], s: 0.95 },
    ],
    lines: ['M0,700 C200,660 400,720 600,690 C800,660 900,700 1000,690', 'M260,560 V690', 'M700,580 V685'],
  },
  {
    slots: [
      { shape: 'sun', at: [170, 150], s: 1.05 }, { shape: 'cloud', at: [520, 130], s: 0.95 }, { shape: 'bird', at: [820, 170], s: 0.8 },
      { shape: 'bird', at: [380, 330], s: 0.8 }, { shape: 'flower', at: [520, 520], s: 0.9 }, { shape: 'flower', at: [820, 500], s: 0.95 },
    ],
    lines: ['M0,690 C250,720 450,650 700,690 C850,712 920,680 1000,690', 'M520,575 V680', 'M820,560 V690'],
  },
];
/** Level 2: Mom's pattern rows (by visit), six long. */
export const STAMP_PATTERNS: readonly StampId[][] = [
  ['sun', 'flower', 'sun', 'flower', 'sun', 'flower'],
  ['cloud', 'bird', 'bird', 'cloud', 'bird', 'bird'],
  ['flower', 'sun', 'cloud', 'flower', 'sun', 'cloud'],
  ['bird', 'bird', 'sun', 'bird', 'bird', 'sun'],
];
/** Level 2: where the six outlines lie (a row across the sheet, under Mom's card along its top). */
export const STAMP_ROW: StampSlot[] = [0, 1, 2, 3, 4, 5].map((i) => ({ shape: null, at: [125 + i * 150, 520] as Pt, s: 0.66 }));
/** Level 2: Mom's card on the sheet (sheet units). */
export const STAMP_CARD = { x: 150, y: 50, w: 700, h: 190 };

