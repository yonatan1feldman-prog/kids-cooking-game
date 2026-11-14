import Phaser from 'phaser';
import { addPlaceholderDraws, type PlaceholderDraw } from './placeholders';
import { CUSTOMER, CUSTOMERS, HAIR_STYLES, TAIL_SHAPES, hexOf, type CustomerId, type HairStyle, type TailShape } from './salon';

/**
 * Stand-ins drawn in code for the Mermaid Salon's art (salon PR 1), until salon PR V's files are in. Simple, but each on
 * the right place of the customers' 600x700 frame (gen_kids' head: centre (300, 236), radius ~150; waist ~540; the feet
 * point 684), so the game can be played and checked with them, and a missing file on a phone still looks like a salon.
 * Tinted things are drawn white with grey shading, like the real ones will be.
 */

const INK = 0x5b3a29;
const SHADE = 0xc9c6d6;
const WHITE = 0xffffff;
const v = (x: number, y: number) => new Phaser.Math.Vector2(x, y);

/** A pen in frame units: `f` is texture pixels per frame unit (a raster 1.5 layer draws 1.5x). */
class Pen {
  constructor(readonly g: Phaser.GameObjects.Graphics, readonly f: number) {}
  circle(x: number, y: number, r: number, c: number, a = 1) {
    this.g.fillStyle(c, a).fillCircle(x * this.f, y * this.f, r * this.f);
    return this;
  }
  ring(x: number, y: number, r: number, c = INK, w = 6) {
    this.g.lineStyle(w * this.f, c).strokeCircle(x * this.f, y * this.f, r * this.f);
    return this;
  }
  ellipse(x: number, y: number, w: number, h: number, c: number, a = 1) {
    this.g.fillStyle(c, a).fillEllipse(x * this.f, y * this.f, w * this.f, h * this.f);
    return this;
  }
  oval(x: number, y: number, w: number, h: number, c = INK, lw = 6) {
    this.g.lineStyle(lw * this.f, c).strokeEllipse(x * this.f, y * this.f, w * this.f, h * this.f);
    return this;
  }
  rect(x: number, y: number, w: number, h: number, r: number, c: number, a = 1) {
    this.g.fillStyle(c, a).fillRoundedRect(x * this.f, y * this.f, w * this.f, h * this.f, r * this.f);
    return this;
  }
  poly(pts: [number, number][], c: number, a = 1) {
    this.g.fillStyle(c, a).fillPoints(pts.map(([x, y]) => v(x * this.f, y * this.f)), true);
    return this;
  }
  line(pts: [number, number][], c = INK, w = 6, a = 1) {
    this.g.lineStyle(w * this.f, c, a).strokePoints(pts.map(([x, y]) => v(x * this.f, y * this.f)), false);
    return this;
  }
  outline(pts: [number, number][], c = INK, w = 6) {
    this.g.lineStyle(w * this.f, c).strokePoints(pts.map(([x, y]) => v(x * this.f, y * this.f)), true);
    return this;
  }
  arc(x: number, y: number, r: number, a0: number, a1: number, c = INK, w = 6) {
    this.g.lineStyle(w * this.f, c).beginPath().arc(x * this.f, y * this.f, r * this.f, Phaser.Math.DegToRad(a0), Phaser.Math.DegToRad(a1)).strokePath();
    return this;
  }
  star(x: number, y: number, R: number, r: number, c: number, n = 5) {
    const pts: [number, number][] = [];
    for (let i = 0; i < n * 2; i++) {
      const a = -Math.PI / 2 + (i * Math.PI) / n;
      const q = i % 2 ? r : R;
      pts.push([x + Math.cos(a) * q, y + Math.sin(a) * q]);
    }
    this.poly(pts, c).outline(pts, INK, 5);
    return this;
  }
}
/** A drawing on a frame `fw` units wide (its texture may be bigger: raster). */
const frame = (fw: number, draw: (p: Pen) => void): PlaceholderDraw => (g, w) => draw(new Pen(g, w / fw));

/** A smooth closed blob through points (a few midpoints, enough for a stand-in). */
const wave = (cx: number, cy: number, rx: number, ry: number, bumps: number, amp: number, a0 = 0, a1 = 360): [number, number][] => {
  const pts: [number, number][] = [];
  for (let a = a0; a <= a1; a += 6) {
    const t = Phaser.Math.DegToRad(a);
    const r = 1 + amp * Math.sin(t * bumps);
    pts.push([cx + Math.cos(t) * rx * r, cy + Math.sin(t) * ry * r]);
  }
  return pts;
};

const HX = 300;
const HY = 236;
const HR = 150;

// ---------------------------------------------------------------- the customers

const body = (id: CustomerId) =>
  frame(600, (p) => {
    const skin = hexOf(CUSTOMER[id].skin);
    const hair = hexOf(CUSTOMER[id].hair);
    // arms down her sides, the vest, the neck
    p.ellipse(186, 470, 62, 190, skin).oval(186, 470, 62, 190);
    p.ellipse(414, 470, 62, 190, skin).oval(414, 470, 62, 190);
    p.rect(278, 360, 44, 60, 16, skin);
    p.poly([[212, 410], [388, 410], [404, 560], [196, 560]], 0xfff2dc).outline([[212, 410], [388, 410], [404, 560], [196, 560]]);
    p.circle(HX, 470, 14, 0xf5b6c8);
    // the head, the ears, a short cap of her own hair (always under any style)
    p.circle(HX - HR + 6, HY + 20, 30, skin).ring(HX - HR + 6, HY + 20, 30);
    p.circle(HX + HR - 6, HY + 20, 30, skin).ring(HX + HR - 6, HY + 20, 30);
    p.circle(HX, HY, HR, skin).ring(HX, HY, HR);
    p.poly(wave(HX, HY - 8, HR + 6, HR - 4, 0, 0, 185, 355), hair);
    // brows, nose, cheeks' blush of her own
    p.arc(244, 205, 26, 200, 340, INK, 6).arc(356, 205, 26, 200, 340, INK, 6);
    p.arc(HX, 292, 10, 20, 160, INK, 5);
    p.circle(206, 316, 24, 0xf28aa0, 0.25).circle(394, 316, 24, 0xf28aa0, 0.25);
  });
const eyes = (kind: 'open' | 'blink' | 'happy' | 'surprised') =>
  frame(600, (p) => {
    for (const x of [244, 356]) {
      if (kind === 'open') p.ellipse(x, 250, 34, 44, INK).circle(x + 7, 240, 7, WHITE);
      else if (kind === 'surprised') p.circle(x, 248, 26, WHITE).ring(x, 248, 26, INK, 5).circle(x, 250, 14, INK);
      else if (kind === 'blink') p.line([[x - 20, 252], [x + 20, 252]], INK, 7);
      else p.arc(x, 262, 20, 200, 340, INK, 7);
    }
  });
const mouth = (kind: 'closed' | 'open' | 'chew') =>
  frame(600, (p) => {
    if (kind === 'closed') p.poly([[266, 326], [334, 326], [322, 346], [300, 352], [278, 346]], WHITE).outline([[266, 326], [334, 326], [322, 346], [300, 352], [278, 346]], INK, 5);
    else if (kind === 'open') p.ellipse(HX, 340, 56, 40, WHITE).oval(HX, 340, 56, 40, INK, 5).ellipse(HX, 350, 30, 12, SHADE);
    else p.ellipse(HX, 336, 32, 18, WHITE).oval(HX, 336, 32, 18, INK, 5);
  });

// ---------------------------------------------------------------- hair (white: the game tints it)

const HAIR_BACK: Record<HairStyle, (p: Pen) => void> = {
  waves: (p) => p.poly([...wave(HX, HY, HR + 34, HR + 10, 0, 0, 180, 360), [HX + 196, 420], [HX + 150, 520], [HX + 60, 500], [HX - 60, 500], [HX - 150, 520], [HX - 196, 420]], WHITE),
  curls: (p) => {
    for (const [x, y, r] of [[150, 200, 70], [450, 200, 70], [140, 300, 66], [460, 300, 66], [170, 390, 60], [430, 390, 60], [300, 120, 110]] as [number, number, number][]) p.circle(x, y, r, WHITE).ring(x, y, r, SHADE, 8);
  },
  braid: (p) => {
    p.poly(wave(HX, HY - 10, HR + 20, HR + 6, 0, 0, 180, 360), WHITE);
    for (let i = 0; i < 5; i++) p.ellipse(440 + i * 4, 330 + i * 52, 70 - i * 6, 64, WHITE).oval(440 + i * 4, 330 + i * 52, 70 - i * 6, 64, SHADE, 8);
  },
  bun: (p) => p.poly(wave(HX, HY - 10, HR + 18, HR + 4, 0, 0, 180, 360), WHITE),
  bob: (p) => p.poly([...wave(HX, HY, HR + 30, HR + 8, 0, 0, 180, 360), [HX + 180, 370], [HX - 180, 370]], WHITE),
};
const HAIR_FRONT: Record<HairStyle, (p: Pen) => void> = {
  waves: (p) => p.poly([...wave(HX, HY - 12, HR + 10, HR - 2, 0, 0, 180, 360), [HX + 120, 160], [HX + 40, 128], [HX - 40, 150], [HX - 120, 132]], WHITE).line([[200, 120], [240, 150], [280, 128]], SHADE, 8),
  curls: (p) => {
    for (let i = 0; i < 7; i++) p.circle(170 + i * 43, 128 - Math.sin((i / 6) * Math.PI) * 40, 40, WHITE).ring(170 + i * 43, 128 - Math.sin((i / 6) * Math.PI) * 40, 40, SHADE, 6);
  },
  braid: (p) => p.poly([...wave(HX, HY - 12, HR + 10, HR - 2, 0, 0, 180, 360), [HX + 150, 230], [HX - 30, 140], [HX - 140, 170]], WHITE).line([[180, 150], [300, 110], [420, 170]], SHADE, 8),
  bun: (p) => p.poly([...wave(HX, HY - 12, HR + 8, HR - 4, 0, 0, 185, 355), [HX + 110, 140], [HX - 110, 140]], WHITE).circle(HX, 58, 70, WHITE).ring(HX, 58, 70, SHADE, 8).circle(HX + 40, 40, 10, 0xfdfbff),
  bob: (p) => p.poly([...wave(HX, HY - 12, HR + 12, HR, 0, 0, 180, 360), [HX + 160, 320], [HX + 120, 170], [HX - 120, 170], [HX - 160, 320]], WHITE).line([[200, 168], [400, 168]], SHADE, 8),
};
const HAIR_SHINE: Record<HairStyle, (p: Pen) => void> = Object.fromEntries(
  HAIR_STYLES.map((s) => [s, (p: Pen) => {
    p.arc(HX - 40, HY - 40, 120, 200, 250, WHITE, 12).arc(HX + 40, HY - 40, 120, 290, 330, WHITE, 10);
    p.star(HX + 80, 100, 18, 7, WHITE, 4).star(HX - 110, 150, 13, 5, WHITE, 4);
  }]),
) as Record<HairStyle, (p: Pen) => void>;

// ---------------------------------------------------------------- tails (white: the game tints them)

const tailBody = (shape: TailShape): [number, number][] => {
  const long = shape === 'long' ? 30 : 0;
  return [[200, 540], [400, 540], [420, 600], [440 + long, 640], [470 + long, 660], [430 + long, 690], [330, 690], [250, 660], [205, 610]];
};
const TAIL: Record<TailShape, (p: Pen) => void> = Object.fromEntries(
  TAIL_SHAPES.map((s) => [s, (p: Pen) => {
    const pts = tailBody(s);
    p.poly(pts, WHITE).outline(pts, INK, 6);
    for (let i = 0; i < 4; i++) p.arc(260 + i * 40, 590, 22, 20, 160, SHADE, 6).arc(280 + i * 40, 630, 22, 20, 160, SHADE, 6);
    const fx = s === 'long' ? 500 : 470;
    p.poly([[fx - 20, 650], [fx + 70, 590], [fx + 60, 660], [fx + 80, 700], [fx - 20, 690]], WHITE).outline([[fx - 20, 650], [fx + 70, 590], [fx + 60, 660], [fx + 80, 700], [fx - 20, 690]], INK, 6);
    if (s === 'frilly') for (let i = 0; i < 6; i++) p.circle(210 + i * 38, 548, 20, WHITE).ring(210 + i * 38, 548, 20, SHADE, 5);
  }]),
) as Record<TailShape, (p: Pen) => void>;
const TAIL_SHINE: Record<TailShape, (p: Pen) => void> = Object.fromEntries(
  TAIL_SHAPES.map((s) => [s, (p: Pen) => {
    p.star(260, 600, 12, 5, WHITE, 4).star(360, 640, 10, 4, WHITE, 4).star(330, 580, 8, 3, 0xfff4b8, 4);
    p.line([[220, 560], [250, 620]], WHITE, 6, 0.6);
  }]),
) as Record<TailShape, (p: Pen) => void>;

// ---------------------------------------------------------------- tops, crowns, jewels

const ITEMS: Record<string, (p: Pen) => void> = {
  'top-shells': (p) => p.poly(wave(255, 446, 44, 34, 0, 0), 0xf58fb4).outline(wave(255, 446, 44, 34, 0, 0)).poly(wave(345, 446, 44, 34, 0, 0), 0xf58fb4).outline(wave(345, 446, 44, 34, 0, 0)).line([[218, 430], [300, 420], [382, 430]], INK, 5),
  'top-starfish': (p) => p.line([[212, 420], [388, 420]], 0xf7a04b, 14).star(HX, 450, 52, 24, 0xf7a04b),
  'top-frill': (p) => {
    for (let i = 0; i < 6; i++) p.circle(220 + i * 32, 446 + (i % 2) * 8, 26, 0x5cc98a).ring(220 + i * 32, 446 + (i % 2) * 8, 26, INK, 4);
  },
  'crown-pearl': (p) => {
    for (let i = 0; i < 7; i++) p.circle(200 + i * 33, 98 - Math.sin((i / 6) * Math.PI) * 28, 15, 0xf6f1ea).ring(200 + i * 33, 98 - Math.sin((i / 6) * Math.PI) * 28, 15, INK, 4);
  },
  'crown-starfish': (p) => p.line([[210, 104], [300, 84], [390, 104]], 0xf7c948, 12).star(HX, 64, 46, 20, 0xf79a4b),
  'crown-coral': (p) => {
    for (const [x, h] of [[220, 60], [260, 90], [300, 110], [340, 90], [380, 60]] as [number, number][]) p.line([[x, 108], [x, 108 - h], [x + 14, 108 - h - 18]], 0xf58fb4, 16);
  },
  'clip-flower': (p) => {
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      p.circle(184 + Math.cos(a) * 24, 150 + Math.sin(a) * 24, 20, 0xff9ec4).ring(184 + Math.cos(a) * 24, 150 + Math.sin(a) * 24, 20, INK, 4);
    }
    p.circle(184, 150, 16, 0xf7c948);
  },
  'necklace-pearl': (p) => {
    for (let i = 0; i < 9; i++) p.circle(232 + i * 17, 412 + Math.sin((i / 8) * Math.PI) * 30, 10, 0xf6f1ea).ring(232 + i * 17, 412 + Math.sin((i / 8) * Math.PI) * 30, 10, INK, 3);
  },
  'necklace-star': (p) => p.arc(HX, 380, 70, 20, 160, 0xf7c948, 6).star(HX, 450, 24, 10, 0xf7c948),
};

// ---------------------------------------------------------------- tools, furniture, small things (their own frames)

const SMALL: Record<string, [number, (p: Pen) => void]> = {
  'gem-star': [90, (p) => p.star(45, 46, 38, 17, 0x8ad8ff)],
  'gem-heart': [90, (p) => p.poly([[45, 80], [10, 40], [18, 16], [45, 26], [72, 16], [80, 40]], 0xff7aa8).outline([[45, 80], [10, 40], [18, 16], [45, 26], [72, 16], [80, 40]], INK, 4)],
  'salon-sponge': [240, (p) => {
    p.rect(40, 70, 160, 110, 34, 0xffd84d).g.lineStyle(7, INK).strokeRoundedRect(40, 70, 160, 110, 34);
    for (const [x, y] of [[80, 100], [130, 120], [170, 100], [100, 150], [150, 156]]) p.circle(x, y, 9, 0xe0b52c);
  }],
  'salon-shower': [240, (p) => {
    p.rect(150, 120, 30, 110, 12, 0x9ad8ef).line([[150, 120], [150, 230]], INK, 5);
    p.poly(wave(120, 92, 82, 56, 0, 0, 180, 360), 0x7cc6e6).outline(wave(120, 92, 82, 56, 0, 0, 180, 360));
    for (let i = 0; i < 5; i++) p.circle(60 + i * 30, 100, 6, 0x2f7fa8);
  }],
  'salon-spray': [240, (p) => {
    p.rect(74, 90, 92, 130, 26, 0xf3f0ff).g.lineStyle(7, INK).strokeRoundedRect(74, 90, 92, 130, 26);
    p.rect(100, 50, 40, 44, 8, 0xd8d4ea).line([[140, 64], [176, 64]], INK, 10);
  }],
  'spray-cap': [80, (p) => p.circle(40, 40, 30, WHITE).ring(40, 40, 30, INK, 5).circle(32, 30, 8, WHITE, 0.6)],
  'salon-comb': [240, (p) => {
    p.rect(40, 80, 160, 44, 18, 0xf58fb4);
    for (let i = 0; i < 9; i++) p.rect(50 + i * 17, 118, 9, 60, 4, 0xf58fb4);
    p.line([[40, 102], [200, 102]], INK, 4);
  }],
  'tool-blush': [240, (p) => p.rect(108, 120, 26, 100, 10, 0xc89b6d).ellipse(121, 90, 90, 80, 0xffd2dc).oval(121, 90, 90, 80)],
  'tool-shadow': [240, (p) => p.line([[70, 200], [170, 60]], 0xc89b6d, 16).ellipse(176, 52, 40, 30, 0xe9e2ff).oval(176, 52, 40, 30)],
  'tool-lipstick': [240, (p) => p.rect(90, 120, 60, 100, 12, 0xf7c948).rect(98, 60, 44, 70, 18, 0xf58fb4).line([[90, 120], [150, 120]], INK, 5)],
  'tool-glitter': [240, (p) => p.line([[70, 200], [160, 80]], 0xc89b6d, 16).ellipse(168, 70, 56, 46, 0xfff4b8).star(168, 66, 18, 7, WHITE, 4)],
  'salon-chair': [700, (p) => {
    const fan: [number, number][] = wave(350, 360, 320, 300, 0, 0, 180, 360);
    p.poly(fan, 0xffb3cc).outline(fan, INK, 8);
    for (let a = 200; a <= 340; a += 20) {
      const t = Phaser.Math.DegToRad(a);
      p.line([[350, 360], [350 + Math.cos(t) * 300, 360 + Math.sin(t) * 280]], 0xe98bab, 10);
    }
    p.ellipse(350, 520, 640, 150, 0xd6ccfa).oval(350, 520, 640, 150, INK, 8);
  }],
  'salon-mirror': [560, (p) => {
    p.ellipse(280, 340, 500, 620, 0xffd9a8).oval(280, 340, 500, 620, INK, 8);
    p.ellipse(280, 340, 380, 500, 0xcdeffa).oval(280, 340, 380, 500, INK, 6).ellipse(220, 250, 80, 160, WHITE, 0.5);
    for (let i = 0; i < 10; i++) {
      const t = (i / 10) * Math.PI * 2;
      p.circle(280 + Math.cos(t) * 238, 340 + Math.sin(t) * 296, 12, 0xf6f1ea).ring(280 + Math.cos(t) * 238, 340 + Math.sin(t) * 296, 12, INK, 3);
    }
  }],
  'salon-bench': [1300, (p) => p.rect(30, 70, 1240, 160, 70, 0xd6a77a).g.lineStyle(8, INK).strokeRoundedRect(30, 70, 1240, 160, 70)],
  'salon-vanity': [520, (p) => {
    p.rect(40, 120, 440, 60, 24, 0xf58fb4).line([[110, 180], [90, 290]], 0xe0607f, 22).line([[410, 180], [430, 290]], 0xe0607f, 22);
    p.rect(110, 60, 60, 66, 14, 0xbfe9f7).rect(200, 40, 50, 86, 14, 0xe9e2ff).circle(330, 96, 30, 0xfff4b8);
  }],
  'shell-surprise': [220, (p) => {
    const sh: [number, number][] = wave(110, 120, 92, 76, 0, 0, 180, 360);
    p.poly(sh, 0xc8b8ff).outline(sh, INK, 7).ellipse(110, 140, 184, 60, 0xb3a2f0).oval(110, 140, 184, 60, INK, 6).star(110, 86, 26, 11, 0xfff4b8);
  }],
  'sand-spot': [120, (p) => {
    p.poly(wave(60, 45, 50, 34, 5, 0.12), 0xe2c08a, 0.92);
    for (const [x, y] of [[40, 40], [70, 34], [80, 56], [52, 60], [60, 46]]) p.circle(x, y, 5, 0xbf9a62);
  }],
  'weed-bit': [90, (p) => p.line([[10, 40], [30, 20], [50, 42], [70, 18], [84, 32]], 0x3fa86a, 14)],
  'door-icon-salon': [160, (p) => {
    p.ellipse(70, 74, 100, 120, 0xffd9a8).oval(70, 74, 100, 120, INK, 5).ellipse(70, 74, 72, 92, 0xcdeffa);
    p.rect(110, 70, 22, 70, 8, 0xf58fb4).rect(112, 44, 18, 32, 8, 0xe0607f);
    p.poly([[80, 150], [56, 126], [62, 112], [80, 120], [98, 112], [104, 126]], 0xff7aa8);
  }],
};

const draws: Record<string, PlaceholderDraw> = {};
for (const id of CUSTOMERS) {
  draws[`cust-${id}-body`] = body(id);
  for (const e of ['open', 'blink', 'happy', 'surprised'] as const) draws[`cust-${id}-eyes-${e}`] = eyes(e);
  for (const m of ['closed', 'open', 'chew'] as const) draws[`cust-${id}-mouth-${m}`] = mouth(m);
}
for (const s of HAIR_STYLES) {
  draws[`hair-back-${s}`] = frame(600, HAIR_BACK[s]);
  draws[`hair-front-${s}`] = frame(600, HAIR_FRONT[s]);
  draws[`hair-shine-${s}`] = frame(600, HAIR_SHINE[s]);
}
for (const s of TAIL_SHAPES) {
  draws[`tail-${s}`] = frame(600, TAIL[s]);
  draws[`tail-${s}-shine`] = frame(600, TAIL_SHINE[s]);
}
for (const [k, d] of Object.entries(ITEMS)) draws[k] = frame(600, d);
for (const [k, [fw, d]] of Object.entries(SMALL)) draws[k] = frame(fw, d);
addPlaceholderDraws(draws as Parameters<typeof addPlaceholderDraws>[0]);

export const SALON_PLACEHOLDERS = Object.keys(draws);
