import Phaser from 'phaser';
import { CREAM, FX_DOT, FX_SOFT, INK, LOADED_KEYS, SAUCE_BRUSH, SAUCE_RED, textureSize, type ImageKey } from './assets';

/**
 * Temporary art drawn in code for every image that is missing on disk (all 52 are delivered now).
 * Each placeholder is drawn at the contract box size, so swapping in the
 * real SVG later needs no code change.
 */
type G = Phaser.GameObjects.Graphics;
type Draw = (g: G, w: number, h: number) => void;

const V = (x: number, y: number) => new Phaser.Math.Vector2(x, y);

function starPoints(cx: number, cy: number, outer: number, inner: number, n = 5) {
  const pts: Phaser.Math.Vector2[] = [];
  for (let i = 0; i < n * 2; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = -Math.PI / 2 + (i * Math.PI) / n;
    pts.push(V(cx + Math.cos(a) * r, cy + Math.sin(a) * r));
  }
  return pts;
}

function roundButton(g: G, w: number, h: number, color: number) {
  const r = Math.min(w, h) / 2;
  g.fillStyle(0x000000, 0.18).fillCircle(w / 2, h / 2 + r * 0.06, r * 0.94);
  g.fillStyle(color).fillCircle(w / 2, h / 2, r * 0.92);
  g.fillStyle(0xffffff, 0.25).fillEllipse(w / 2, h / 2 - r * 0.45, r * 1.1, r * 0.45);
  g.lineStyle(r * 0.08, 0xffffff).strokeCircle(w / 2, h / 2, r * 0.86);
}

function topping(base: number, detail: (g: G, cx: number, cy: number, r: number) => void): Draw {
  return (g, w, h) => {
    const r = Math.min(w, h) * 0.42;
    g.fillStyle(0x000000, 0.15).fillCircle(w / 2 + r * 0.06, h / 2 + r * 0.08, r);
    g.fillStyle(base).fillCircle(w / 2, h / 2, r);
    detail(g, w / 2, h / 2, r);
  };
}

/** Specific stand-ins; every other key (Mom's layers and hands, the bins, the board) gets `plain`. */
const DRAW: Partial<Record<ImageKey, Draw>> = {
  'bg-kitchen-landscape': (g, w, h) => {
    g.fillStyle(0xffe9c7).fillRect(0, 0, w, h);
    const tile = w / 8;
    g.fillStyle(0xfff6e6);
    for (let y = 0; y < h * 0.62; y += tile)
      for (let x = ((y / tile) % 2) * (tile / 2) - tile / 2; x < w; x += tile)
        g.fillRoundedRect(x + 6, y + 6, tile - 12, tile - 12, 14);
    g.fillStyle(0xc98b5b).fillRect(0, h * 0.62, w, h * 0.38);
    g.fillStyle(0xb07446).fillRect(0, h * 0.62, w, h * 0.025);
    g.fillStyle(0xd9a171);
    for (let x = 0; x < w; x += w / 5) g.fillRect(x, h * 0.66, 6, h * 0.34);
    g.fillStyle(0xffffff, 0.5).fillCircle(w * 0.14, h * 0.08, w * 0.05).fillCircle(w * 0.86, h * 0.1, w * 0.035);
  },
  'dough-ball': (g, w, h) => {
    const r = Math.min(w, h) * 0.42;
    g.fillStyle(0x000000, 0.12).fillEllipse(w / 2, h / 2 + r * 0.85, r * 1.9, r * 0.45);
    g.fillStyle(0xf2d7a6).fillCircle(w / 2, h / 2, r);
    g.fillStyle(0xfbe9c8).fillCircle(w / 2 - r * 0.3, h / 2 - r * 0.3, r * 0.45);
    g.fillStyle(0xe2bf86).fillCircle(w / 2 + r * 0.35, h / 2 + r * 0.4, r * 0.12);
  },
  'dough-flat': (g, w, h) => {
    const r = Math.min(w, h) * 0.48;
    g.fillStyle(0xd9a45f).fillCircle(w / 2, h / 2, r);
    g.fillStyle(0xf2d7a6).fillCircle(w / 2, h / 2, r * 0.9);
    g.fillStyle(0xfbe6c2, 0.7).fillCircle(w / 2 - r * 0.25, h / 2 - r * 0.25, r * 0.35);
  },
  'rolling-pin': (g, w, h) => {
    const bh = h * 0.55;
    g.fillStyle(0x8a5a33).fillRoundedRect(0, h / 2 - bh * 0.22, w, bh * 0.44, bh * 0.2);
    g.fillStyle(0xc68a52).fillRoundedRect(w * 0.18, h / 2 - bh / 2, w * 0.64, bh, bh * 0.3);
    g.fillStyle(0xe0ad75).fillRoundedRect(w * 0.2, h / 2 - bh * 0.38, w * 0.6, bh * 0.2, bh * 0.1);
    g.lineStyle(6, 0x5a3418).strokeRoundedRect(w * 0.18, h / 2 - bh / 2, w * 0.64, bh, bh * 0.3);
  },
  'sauce-bowl': (g, w, h) => {
    g.fillStyle(0xd8342a).fillEllipse(w / 2, h * 0.38, w * 0.86, h * 0.3);
    g.fillStyle(0x4a90d9).slice(w / 2, h * 0.38, w * 0.44, 0, Math.PI, false).fillPath();
    g.fillStyle(0xffffff, 0.3).fillEllipse(w * 0.36, h * 0.34, w * 0.2, h * 0.07);
  },
  'sauce-blob': (g, w, h) => {
    const r = Math.min(w, h) * 0.3;
    g.fillStyle(0xd8342a);
    g.fillCircle(w / 2, h / 2, r);
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      g.fillCircle(w / 2 + Math.cos(a) * r * 0.75, h / 2 + Math.sin(a) * r * 0.75, r * 0.55);
    }
  },
  'cheese-shaker': (g, w, h) => {
    g.fillStyle(0xbfc7d1).fillRoundedRect(w * 0.18, h * 0.02, w * 0.64, h * 0.24, 20);
    g.fillStyle(0x555f6b);
    for (let i = 0; i < 3; i++) g.fillCircle(w * (0.35 + i * 0.15), h * 0.14, w * 0.035);
    g.fillStyle(0xe8f2ff, 0.9).fillRoundedRect(w * 0.12, h * 0.24, w * 0.76, h * 0.72, 30);
    g.fillStyle(0xffd23f).fillRoundedRect(w * 0.18, h * 0.46, w * 0.64, h * 0.46, 24);
    g.fillStyle(0xffffff, 0.5).fillRoundedRect(w * 0.2, h * 0.3, w * 0.1, h * 0.55, 10);
  },
  'cheese-shred': (g, w, h) => {
    g.fillStyle(0xf2b705).fillRoundedRect(w * 0.1, h * 0.35, w * 0.8, h * 0.3, h * 0.12);
    g.fillStyle(0xffe066).fillRoundedRect(w * 0.14, h * 0.38, w * 0.72, h * 0.18, h * 0.08);
  },
  'topping-tomato': topping(0xe53935, (g, cx, cy, r) => {
    g.fillStyle(0xff7961).fillCircle(cx, cy, r * 0.78);
    g.fillStyle(0xfff3a0);
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      g.fillEllipse(cx + Math.cos(a) * r * 0.42, cy + Math.sin(a) * r * 0.42, r * 0.22, r * 0.3);
    }
  }),
  'topping-olive': topping(0x2b2b2b, (g, cx, cy, r) => {
    g.fillStyle(0xf2d7a6).fillCircle(cx, cy, r * 0.42);
    g.fillStyle(0xffffff, 0.35).fillEllipse(cx - r * 0.35, cy - r * 0.55, r * 0.5, r * 0.2);
  }),
  'topping-mushroom': (g, w, h) => {
    const r = Math.min(w, h) * 0.42;
    g.fillStyle(0xf5e6d3).fillRoundedRect(w / 2 - r * 0.3, h / 2 - r * 0.1, r * 0.6, r * 1.0, r * 0.2);
    g.fillStyle(0xc49a6c).slice(w / 2, h / 2 + r * 0.05, r, Math.PI, 0, false).fillPath();
    g.fillStyle(0xe8c9a0).fillCircle(w / 2 - r * 0.35, h / 2 - r * 0.35, r * 0.14);
  },
  'topping-corn': (g, w, h) => {
    const r = Math.min(w, h) * 0.2;
    g.fillStyle(0xf7c600);
    g.fillCircle(w / 2 - r, h / 2, r).fillCircle(w / 2 + r, h / 2 - r * 0.2, r).fillCircle(w / 2, h / 2 + r * 1.1, r);
    g.fillStyle(0xffe680).fillCircle(w / 2 - r * 1.2, h / 2 - r * 0.3, r * 0.35);
  },
  'topping-pepper': (g, w, h) => {
    const r = Math.min(w, h) * 0.4;
    g.lineStyle(r * 0.35, 0x2e9e3e).beginPath().arc(w / 2, h / 2, r * 0.8, 0, Math.PI * 1.7).strokePath();
    g.lineStyle(r * 0.12, 0x7ddc8a).beginPath().arc(w / 2, h / 2, r * 0.88, 0.3, Math.PI * 1.2).strokePath();
  },
  'topping-onion': (g, w, h) => {
    const r = Math.min(w, h) * 0.4;
    g.lineStyle(r * 0.2, 0x9c4dcc).strokeCircle(w / 2, h / 2, r * 0.85);
    g.lineStyle(r * 0.14, 0xd9a6f0).strokeCircle(w / 2, h / 2, r * 0.55);
  },
  tray: (g, w, h) => {
    const r = Math.min(w, h) * 0.47;
    g.fillStyle(0x5b3a29, 0.2).fillCircle(w / 2, h / 2 + 12, r);
    g.fillStyle(0xe3a869).fillCircle(w / 2, h / 2, r);
    g.lineStyle(8, 0x5b3a29).strokeCircle(w / 2, h / 2, r);
  },
  'oven-inside': (g, w, h) => {
    g.fillStyle(0x3a1d14).fillRoundedRect(w * 0.2, h * 0.39, w * 0.6, h * 0.38, 30);
    g.fillStyle(0xb8382b, 0.6).fillEllipse(w / 2, h * 0.72, w * 0.5, h * 0.08);
  },
  'oven-closed': (g, w, h) => {
    // Frame drawn around a transparent window hole (x 150-550, y 320-610 of 700x800).
    const hx = w * (150 / 700), hy = h * (320 / 800), hw = w * (400 / 700), hh = h * (290 / 800);
    g.fillStyle(0xe4523b);
    g.fillRoundedRect(0, 0, w, hy, { tl: 40, tr: 40, bl: 0, br: 0 });
    g.fillRect(0, hy, hx, hh).fillRect(hx + hw, hy, w - hx - hw, hh);
    g.fillRoundedRect(0, hy + hh, w, h * 0.92 - hy - hh, { tl: 0, tr: 0, bl: 40, br: 40 });
    g.fillStyle(0xfff6e6).fillCircle(w * 0.2, h * 0.1, w * 0.05).fillCircle(w * 0.34, h * 0.1, w * 0.05);
    g.fillStyle(0xfff6e6).fillRoundedRect(w * 0.3, h * 0.3, w * 0.4, h * 0.03, 8);
    g.lineStyle(8, 0x5b3a29).strokeRoundedRect(hx, hy, hw, hh, 30).strokeRoundedRect(4, 4, w - 8, h * 0.92 - 8, 40);
  },
  'oven-open': (g, w, h) => {
    g.fillStyle(0xe4523b).fillRoundedRect(0, 0, w, h * 0.8, 40);
    g.fillStyle(0xfff6e6).fillCircle(w * 0.2, h * 0.1, w * 0.05).fillCircle(w * 0.34, h * 0.1, w * 0.05);
    g.fillStyle(0xb8382b).fillRoundedRect(w * 0.1, h * 0.24, w * 0.8, h * 0.5, 30);
    g.fillStyle(0xf79a3e).fillEllipse(w / 2, h * 0.66, w * 0.6, h * 0.06);
    g.fillStyle(0xf79a3e).fillTriangle(w * 0.05, h * 0.96, w * 0.95, h * 0.96, w * 0.5, h * 0.8);
    g.lineStyle(8, 0x5b3a29).strokeRoundedRect(4, 4, w - 8, h * 0.8 - 8, 40);
  },
  'pizza-slice': (g, w, h) => {
    g.fillStyle(0xd9a45f).fillTriangle(w * 0.5, h * 0.95, w * 0.08, h * 0.12, w * 0.92, h * 0.12);
    g.fillStyle(0xd9a45f).fillRoundedRect(w * 0.04, h * 0.04, w * 0.92, h * 0.16, h * 0.08);
    g.fillStyle(0xffd23f).fillTriangle(w * 0.5, h * 0.86, w * 0.16, h * 0.2, w * 0.84, h * 0.2);
    g.fillStyle(0xe53935).fillCircle(w * 0.4, h * 0.34, w * 0.07).fillCircle(w * 0.6, h * 0.42, w * 0.07);
  },
  // Character layers: every part is drawn in the same 600x700 frame, so they stack at one position.
  'character-body': (g, w, h) => {
    g.fillStyle(0x5b3a29, 0.2).fillEllipse(w / 2, h * 0.95, w * 0.6, h * 0.05);
    g.fillStyle(0xfff6e6).fillRoundedRect(w * 0.34, h * 0.02, w * 0.32, h * 0.14, 30);
    g.fillStyle(0xf8ddae).fillEllipse(w / 2, h * 0.55, w * 0.72, h * 0.76);
    g.fillStyle(0xfff6e6).fillEllipse(w / 2, h * 0.7, w * 0.4, h * 0.26);
    g.fillStyle(0xf6a5a0).fillCircle(w * 0.3, h * 0.5, w * 0.05).fillCircle(w * 0.7, h * 0.5, w * 0.05);
    g.lineStyle(8, 0x5b3a29).strokeEllipse(w / 2, h * 0.55, w * 0.72, h * 0.76);
  },
  'character-eyes-open': (g, w, h) => {
    g.fillStyle(0x5b3a29).fillEllipse(w * 0.38, h * 0.42, w * 0.06, h * 0.07).fillEllipse(w * 0.62, h * 0.42, w * 0.06, h * 0.07);
    g.fillStyle(0xffffff).fillCircle(w * 0.39, h * 0.41, w * 0.012).fillCircle(w * 0.63, h * 0.41, w * 0.012);
  },
  'character-eyes-blink': (g, w, h) => {
    g.lineStyle(8, 0x5b3a29);
    g.beginPath().arc(w * 0.38, h * 0.41, w * 0.05, 0.3, Math.PI - 0.3).strokePath();
    g.beginPath().arc(w * 0.62, h * 0.41, w * 0.05, 0.3, Math.PI - 0.3).strokePath();
  },
  'character-eyes-surprised': (g, w, h) => {
    g.fillStyle(0xffffff).fillCircle(w * 0.38, h * 0.42, w * 0.06).fillCircle(w * 0.62, h * 0.42, w * 0.06);
    g.lineStyle(8, 0x5b3a29).strokeCircle(w * 0.38, h * 0.42, w * 0.06).strokeCircle(w * 0.62, h * 0.42, w * 0.06);
    g.fillStyle(0x5b3a29).fillCircle(w * 0.38, h * 0.42, w * 0.025).fillCircle(w * 0.62, h * 0.42, w * 0.025);
  },
  'character-eyes-happy': (g, w, h) => {
    g.lineStyle(8, 0x5b3a29);
    g.beginPath().arc(w * 0.38, h * 0.44, w * 0.05, Math.PI + 0.3, -0.3).strokePath();
    g.beginPath().arc(w * 0.62, h * 0.44, w * 0.05, Math.PI + 0.3, -0.3).strokePath();
  },
  'character-mouth-closed': (g, w, h) => {
    g.lineStyle(8, 0x5b3a29).beginPath().arc(w / 2, h * 0.5, w * 0.08, 0.4, Math.PI - 0.4).strokePath();
  },
  'character-mouth-open': (g, w, h) => {
    g.fillStyle(0xb8382b).fillEllipse(w / 2, h * 0.57, w * 0.2, h * 0.12);
    g.fillStyle(0xf6a5a0).fillEllipse(w / 2, h * 0.6, w * 0.1, h * 0.04);
    g.lineStyle(8, 0x5b3a29).strokeEllipse(w / 2, h * 0.57, w * 0.2, h * 0.12);
  },
  'character-mouth-chew': (g, w, h) => {
    g.fillStyle(0xb8382b).fillEllipse(w / 2, h * 0.56, w * 0.1, h * 0.04);
    g.lineStyle(8, 0x5b3a29).strokeEllipse(w / 2, h * 0.56, w * 0.1, h * 0.04);
  },
  'hand-hint': (g, w, h) => {
    g.fillStyle(0xf3c9a8).fillRoundedRect(w * 0.14, h * 0.04, w * 0.22, h * 0.5, w * 0.1);
    g.fillStyle(0xf3c9a8).fillEllipse(w * 0.5, h * 0.68, w * 0.76, h * 0.5);
    g.lineStyle(8, 0x5b3a29).strokeRoundedRect(w * 0.14, h * 0.04, w * 0.22, h * 0.5, w * 0.1).strokeEllipse(w * 0.5, h * 0.68, w * 0.76, h * 0.5);
  },
  star: (g, w, h) => {
    const r = Math.min(w, h) / 2;
    g.fillStyle(0xf5b000).fillPoints(starPoints(w / 2, h / 2 + r * 0.04, r * 0.98, r * 0.46), true);
    g.fillStyle(0xffe14d).fillPoints(starPoints(w / 2, h / 2, r * 0.88, r * 0.4), true);
  },
  'btn-play': (g, w, h) => {
    roundButton(g, w, h, 0x2ecc71);
    const r = Math.min(w, h) / 2;
    g.fillStyle(0xffffff).fillTriangle(w / 2 - r * 0.28, h / 2 - r * 0.42, w / 2 - r * 0.28, h / 2 + r * 0.42, w / 2 + r * 0.45, h / 2);
  },
  'btn-home': (g, w, h) => {
    roundButton(g, w, h, 0x3498db);
    const r = Math.min(w, h) / 2;
    g.fillStyle(0xffffff).fillTriangle(w / 2, h / 2 - r * 0.5, w / 2 - r * 0.5, h / 2 - r * 0.02, w / 2 + r * 0.5, h / 2 - r * 0.02);
    g.fillRect(w / 2 - r * 0.34, h / 2 - r * 0.05, r * 0.68, r * 0.5);
    g.fillStyle(0x3498db).fillRect(w / 2 - r * 0.1, h / 2 + r * 0.12, r * 0.2, r * 0.33);
  },
  'btn-done': (g, w, h) => {
    roundButton(g, w, h, 0x2ecc71);
    const r = Math.min(w, h) / 2;
    g.lineStyle(r * 0.2, 0xffffff).beginPath();
    g.moveTo(w / 2 - r * 0.42, h / 2).lineTo(w / 2 - r * 0.1, h / 2 + r * 0.32).lineTo(w / 2 + r * 0.45, h / 2 - r * 0.3);
    g.strokePath();
  },
  'card-pizza': (g, w, h) => {
    g.fillStyle(0x000000, 0.18).fillRoundedRect(w * 0.04, h * 0.05, w * 0.94, h * 0.93, 60);
    g.fillStyle(0xffffff).fillRoundedRect(0, 0, w * 0.94, h * 0.93, 60);
    g.fillStyle(0xffe0a3).fillRoundedRect(w * 0.05, h * 0.05, w * 0.84, h * 0.83, 44);
    const cx = w * 0.47, cy = h * 0.465, r = w * 0.34;
    g.fillStyle(0xd9a45f).fillCircle(cx, cy, r);
    g.fillStyle(0xe53935).fillCircle(cx, cy, r * 0.86);
    g.fillStyle(0xffd23f).fillCircle(cx, cy, r * 0.78);
    g.fillStyle(0xc62828);
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + 0.4;
      g.fillCircle(cx + Math.cos(a) * r * 0.5, cy + Math.sin(a) * r * 0.5, r * 0.13);
    }
    g.fillStyle(0x2e9e3e).fillCircle(cx, cy, r * 0.1);
  },
};

/** Generic stand-in: a soft cream shape with an ink outline, so a missing file is visible but harmless. */
const plain: Draw = (g, w, h) => {
  g.fillStyle(CREAM, 0.9).fillRoundedRect(w * 0.1, h * 0.1, w * 0.8, h * 0.8, Math.min(w, h) * 0.2);
  g.lineStyle(8, INK).strokeRoundedRect(w * 0.1, h * 0.1, w * 0.8, h * 0.8, Math.min(w, h) * 0.2);
};

/** Placeholders are drawn with the Boot scene's graphics factory (it stays available after Boot stops). */
const boot = (game: Phaser.Game) => game.scene.getScene('Boot');

function bake(game: Phaser.Game, key: string, w: number, h: number, draw: Draw) {
  const g = boot(game).make.graphics({}, false);
  draw(g, w, h);
  g.generateTexture(key, w, h);
  g.destroy();
}

/** Draws a placeholder for every contract image (or every one of `keys`) that has no texture yet. Returns the keys it drew. */
export function ensurePlaceholders(game: Phaser.Game, keys: readonly ImageKey[] = LOADED_KEYS): string[] {
  const drawn: string[] = [];
  for (const key of keys) {
    if (game.textures.exists(key)) continue;
    const [w, h] = textureSize(key);
    bake(game, key, w, h, DRAW[key] ?? plain);
    drawn.push(key);
  }
  return drawn;
}

/** Internal particle textures, always made in code. */
export function makeFxTextures(game: Phaser.Game) {
  if (!game.textures.exists(FX_DOT)) bake(game, FX_DOT, 32, 32, (g) => g.fillStyle(0xffffff).fillCircle(16, 16, 15));
  if (!game.textures.exists(FX_SOFT))
    bake(game, FX_SOFT, 64, 64, (g) => {
      for (let i = 8; i >= 1; i--) g.fillStyle(0xffffff, 0.12).fillCircle(32, 32, i * 4);
    });
  // (a heart for Pipa's love: two circles and a point)
  if (!game.textures.exists('fx-heart'))
    bake(game, 'fx-heart', 64, 60, (g) => {
      g.fillStyle(0xffffff).fillCircle(19, 20, 17).fillCircle(45, 20, 17);
      g.fillTriangle(3, 26, 61, 26, 32, 58);
    });
  // (the polish round, core/juice.ts: the touch ring and a strip of confetti paper)
  if (!game.textures.exists('fx-ring')) bake(game, 'fx-ring', 64, 64, (g) => g.lineStyle(6, 0xffffff).strokeCircle(32, 32, 28));
  if (!game.textures.exists('fx-paper')) bake(game, 'fx-paper', 28, 16, (g) => g.fillStyle(0xffffff).fillRect(0, 0, 28, 16));
}

/** Style-matched UI textures made in code: the solid sauce brush. */
export function makeUiTextures(game: Phaser.Game) {
  makeBrush(game, 'sauce-blob', SAUCE_RED, SAUCE_BRUSH);
}

/**
 * A paint brush from a blob's silhouette, filled with one flat colour (no outlines): the pizza's sauce, and since
 * round 9 the cake's frosting in the colour she picked. Returns the texture key.
 */
export function makeBrush(game: Phaser.Game, blob: string, colour: number, key: string) {
  const scene = { textures: game.textures };
  if (scene.textures.exists(key)) scene.textures.remove(key);
  if (!scene.textures.exists(blob)) return key;
  const src = scene.textures.get(blob).getSourceImage() as CanvasImageSource & { width: number; height: number };
  const canvas = document.createElement('canvas');
  canvas.width = src.width;
  canvas.height = src.height;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.drawImage(src, 0, 0);
    ctx.globalCompositeOperation = 'source-in';
    ctx.fillStyle = '#' + colour.toString(16).padStart(6, '0');
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // Round 11: a paper grain, like every other cut-out in the game (the flat fill read as digital paint). Light and
    // dark flecks and a few faint fibres, kept inside the silhouette; seeded, so every brush looks the same.
    ctx.globalCompositeOperation = 'source-atop';
    let seed = 7;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    const area = canvas.width * canvas.height;
    for (let i = 0; i < area / 55; i++) {
      ctx.fillStyle = rnd() < 0.5 ? 'rgba(255,245,235,0.16)' : 'rgba(70,20,10,0.10)';
      ctx.beginPath();
      ctx.arc(rnd() * canvas.width, rnd() * canvas.height, 0.6 + rnd() * 1.6, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.lineCap = 'round';
    for (let i = 0; i < area / 2600; i++) {
      const x = rnd() * canvas.width, y = rnd() * canvas.height, a = rnd() * Math.PI, l = 8 + rnd() * 18;
      ctx.strokeStyle = 'rgba(255,240,230,0.14)';
      ctx.lineWidth = 1 + rnd();
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l);
      ctx.stroke();
    }
  }
  scene.textures.addCanvas(key, canvas);
  return key;
}

/** Opaque bounds of a texture (from its source canvas), used to find e.g. the mouth. */
export function opaqueBounds(scene: Phaser.Scene, key: string) {
  try {
    const src = scene.textures.get(key).getSourceImage() as CanvasImageSource & { width: number; height: number };
    const canvas = document.createElement('canvas');
    canvas.width = src.width;
    canvas.height = src.height;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return null;
    ctx.drawImage(src, 0, 0);
    const { data, width, height } = ctx.getImageData(0, 0, canvas.width, canvas.height);
    let x0 = width, y0 = height, x1 = -1, y1 = -1;
    for (let y = 0; y < height; y += 2)
      for (let x = 0; x < width; x += 2)
        if (data[(y * width + x) * 4 + 3] > 40) {
          if (x < x0) x0 = x;
          if (x > x1) x1 = x;
          if (y < y0) y0 = y;
          if (y > y1) y1 = y;
        }
    return x1 < 0 ? null : { x: x0, y: y0, w: x1 - x0, h: y1 - y0, cx: (x0 + x1) / 2, cy: (y0 + y1) / 2 };
  } catch {
    return null;
  }
}

/** Texture keys drawn in code for the memory book (round 9): its button on the home screen and the paging arrows. */
export const ALBUM_ICON = 'album-icon';
export const ALBUM_ARROW = 'album-arrow';

/**
 * The memory book's own art, drawn in code in the style of the cards (cream paper, a warm brown edge, soft shadows):
 * a little stack of photos with a star, at the recipe cards' size, and one arrow (mirrored for the other side).
 * Text-free, like everything else she touches.
 */
export function makeAlbumTextures(game: Phaser.Game) {
  const t = game.textures;
  if (!t.exists(ALBUM_ICON)) {
    const w = 400;
    const h = 520;
    const g = boot(game).make.graphics({}, false);
    // The album's cover: cream paper with a warm brown edge, a soft shadow under it.
    g.fillStyle(0x000000, 0.13).fillRoundedRect(22, 34, w - 32, h - 40, 34);
    g.fillStyle(0xc98b5b).fillRoundedRect(10, 16, w - 32, h - 40, 34);
    g.fillStyle(0xfff6e6).fillRoundedRect(28, 34, w - 68, h - 76, 26);
    // Three photos lying on it, a little askew, each a warm square with its own colour inside.
    const shot = (cx: number, cy: number, s: number, tint: number, ang: number) => {
      g.save();
      g.translateCanvas(cx, cy);
      g.rotateCanvas(ang);
      g.fillStyle(0x000000, 0.12).fillRoundedRect(-s / 2 + 8, -s / 2 + 10, s, s, 10);
      g.fillStyle(0xffffff).fillRoundedRect(-s / 2, -s / 2, s, s, 10);
      g.fillStyle(tint).fillRoundedRect(-s / 2 + 14, -s / 2 + 14, s - 28, s - 44, 6);
      g.restore();
    };
    shot(150, 210, 150, 0xe8624a, -0.16);
    shot(252, 300, 150, 0x8bbf5a, 0.13);
    shot(190, 392, 150, 0xf2c14e, -0.05);
    // One star, the game's own mark of something lovely (it never twinkles by itself here: it is just drawn on).
    g.fillStyle(0xffd75e);
    const sx = 306;
    const sy = 150;
    const pts: Phaser.Math.Vector2[] = [];
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + (i * Math.PI) / 5;
      const r = i % 2 ? 22 : 50;
      pts.push(new Phaser.Math.Vector2(sx + Math.cos(a) * r, sy + Math.sin(a) * r));
    }
    g.fillPoints(pts, true);
    g.generateTexture(ALBUM_ICON, w, h);
    g.destroy();
  }
  if (!t.exists(ALBUM_ARROW)) {
    const s = 240;
    const g = boot(game).make.graphics({}, false);
    g.fillStyle(0x000000, 0.15).fillCircle(s / 2 + 6, s / 2 + 8, s * 0.44);
    g.fillStyle(0xfff6e6).fillCircle(s / 2, s / 2, s * 0.44);
    g.lineStyle(s * 0.06, 0xc98b5b).strokeCircle(s / 2, s / 2, s * 0.44);
    g.fillStyle(0xff8c42).fillTriangle(s * 0.66, s * 0.26, s * 0.66, s * 0.74, s * 0.32, s * 0.5);
    g.generateTexture(ALBUM_ARROW, s, s);
    g.destroy();
  }
}
