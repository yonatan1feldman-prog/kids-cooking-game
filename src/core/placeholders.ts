import Phaser from 'phaser';
import { FX_DOT, FX_SOFT, IMAGES, type ImageKey } from './assets';

/**
 * Temporary art drawn in code for every image that is missing on disk.
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

const DRAW: Record<ImageKey, Draw> = {
  'bg-kitchen': (g, w, h) => {
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
    g.fillStyle(0x000000, 0.15).fillRoundedRect(w * 0.06, h * 0.1, w * 0.9, h * 0.86, 40);
    g.fillStyle(0x8fb8de).fillRoundedRect(w * 0.03, h * 0.04, w * 0.9, h * 0.86, 40);
    g.fillStyle(0xd6ebff).fillRoundedRect(w * 0.1, h * 0.11, w * 0.76, h * 0.72, 28);
  },
  'oven-closed': (g, w, h) => {
    g.fillStyle(0x5d6d7e).fillRoundedRect(0, 0, w, h, 40);
    g.fillStyle(0x85929e).fillRoundedRect(w * 0.04, h * 0.04, w * 0.92, h * 0.16, 24);
    g.fillStyle(0xf4d03f).fillCircle(w * 0.2, h * 0.12, w * 0.045).fillCircle(w * 0.36, h * 0.12, w * 0.045);
    g.fillStyle(0xaab7b8).fillRoundedRect(w * 0.08, h * 0.26, w * 0.84, h * 0.66, 30);
    g.fillStyle(0x2c3e50).fillRoundedRect(w * 0.16, h * 0.36, w * 0.68, h * 0.44, 24);
    g.fillStyle(0xff9f43, 0.35).fillRoundedRect(w * 0.18, h * 0.38, w * 0.64, h * 0.4, 20);
    g.fillStyle(0xecf0f1).fillRoundedRect(w * 0.3, h * 0.28, w * 0.4, h * 0.04, 10);
  },
  'oven-open': (g, w, h) => {
    g.fillStyle(0x5d6d7e).fillRoundedRect(0, 0, w, h * 0.78, 40);
    g.fillStyle(0x85929e).fillRoundedRect(w * 0.04, h * 0.04, w * 0.92, h * 0.16, 24);
    g.fillStyle(0xf4d03f).fillCircle(w * 0.2, h * 0.12, w * 0.045).fillCircle(w * 0.36, h * 0.12, w * 0.045);
    g.fillStyle(0x1b2631).fillRoundedRect(w * 0.1, h * 0.26, w * 0.8, h * 0.48, 24);
    g.fillStyle(0xff7f2a, 0.8).fillRoundedRect(w * 0.14, h * 0.3, w * 0.72, h * 0.4, 20);
    g.fillStyle(0xaab7b8).fillRoundedRect(w * 0.04, h * 0.76, w * 0.92, h * 0.22, 24);
    g.fillStyle(0xecf0f1).fillRoundedRect(w * 0.3, h * 0.9, w * 0.4, h * 0.04, 10);
  },
  'pizza-slice': (g, w, h) => {
    g.fillStyle(0xd9a45f).fillTriangle(w * 0.5, h * 0.95, w * 0.08, h * 0.12, w * 0.92, h * 0.12);
    g.fillStyle(0xd9a45f).fillRoundedRect(w * 0.04, h * 0.04, w * 0.92, h * 0.16, h * 0.08);
    g.fillStyle(0xffd23f).fillTriangle(w * 0.5, h * 0.86, w * 0.16, h * 0.2, w * 0.84, h * 0.2);
    g.fillStyle(0xe53935).fillCircle(w * 0.4, h * 0.34, w * 0.07).fillCircle(w * 0.6, h * 0.42, w * 0.07);
    g.fillStyle(0x2e9e3e).fillCircle(w * 0.5, h * 0.6, w * 0.045);
  },
  'character-body': (g, w, h) => {
    g.fillStyle(0x000000, 0.12).fillEllipse(w / 2, h * 0.95, w * 0.7, h * 0.08);
    g.fillStyle(0x9b7bea).fillCircle(w * 0.2, h * 0.14, w * 0.11).fillCircle(w * 0.8, h * 0.14, w * 0.11);
    g.fillStyle(0xf7a8c8).fillCircle(w * 0.2, h * 0.14, w * 0.055).fillCircle(w * 0.8, h * 0.14, w * 0.055);
    g.fillStyle(0x9b7bea).fillEllipse(w / 2, h * 0.54, w * 0.9, h * 0.8);
    g.fillStyle(0xc3b1f5).fillEllipse(w / 2, h * 0.66, w * 0.55, h * 0.45);
    g.fillStyle(0xf7a8c8, 0.8).fillCircle(w * 0.2, h * 0.5, w * 0.06).fillCircle(w * 0.8, h * 0.5, w * 0.06);
  },
  'character-mouth-open': (g, w, h) => {
    g.fillStyle(0x5b1a2a).fillEllipse(w / 2, h / 2, w * 0.9, h * 0.9);
    g.fillStyle(0xff6b8a).fillEllipse(w / 2, h * 0.7, w * 0.5, h * 0.35);
    g.fillStyle(0xffffff).fillRoundedRect(w * 0.3, h * 0.06, w * 0.4, h * 0.14, 8);
  },
  'character-mouth-closed': (g, w, h) => {
    g.lineStyle(h * 0.14, 0x5b1a2a).beginPath().arc(w / 2, h * 0.05, w * 0.36, 0.35, Math.PI - 0.35).strokePath();
  },
  'character-eyes-happy': (g, w, h) => {
    g.lineStyle(h * 0.16, 0x2c2140);
    g.beginPath().arc(w * 0.25, h * 0.75, w * 0.14, Math.PI + 0.3, -0.3).strokePath();
    g.beginPath().arc(w * 0.75, h * 0.75, w * 0.14, Math.PI + 0.3, -0.3).strokePath();
  },
  'hand-hint': (g, w, h) => {
    g.fillStyle(0x000000, 0.2).fillEllipse(w * 0.55, h * 0.72, w * 0.7, h * 0.5);
    g.fillStyle(0xffe0c7).fillRoundedRect(w * 0.36, h * 0.02, w * 0.2, h * 0.5, w * 0.1);
    g.fillStyle(0xffe0c7).fillEllipse(w * 0.52, h * 0.66, w * 0.66, h * 0.5);
    g.lineStyle(6, 0xc98b6b).strokeRoundedRect(w * 0.36, h * 0.02, w * 0.2, h * 0.5, w * 0.1);
    g.fillStyle(0xffffff, 0.6).fillCircle(w * 0.46, h * 0.07, w * 0.05);
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

function bake(scene: Phaser.Scene, key: string, w: number, h: number, draw: Draw) {
  const g = scene.make.graphics({}, false);
  draw(g, w, h);
  g.generateTexture(key, w, h);
  g.destroy();
}

/** Draws a placeholder for every contract image that has no texture yet. Returns the keys it drew. */
export function ensurePlaceholders(scene: Phaser.Scene): string[] {
  const drawn: string[] = [];
  for (const key of Object.keys(IMAGES) as ImageKey[]) {
    if (scene.textures.exists(key)) continue;
    const [w, h] = IMAGES[key].box;
    bake(scene, key, w, h, DRAW[key]);
    drawn.push(key);
  }
  return drawn;
}

/** Internal particle textures, always made in code. */
export function makeFxTextures(scene: Phaser.Scene) {
  if (!scene.textures.exists(FX_DOT)) bake(scene, FX_DOT, 32, 32, (g) => g.fillStyle(0xffffff).fillCircle(16, 16, 15));
  if (!scene.textures.exists(FX_SOFT))
    bake(scene, FX_SOFT, 64, 64, (g) => {
      for (let i = 8; i >= 1; i--) g.fillStyle(0xffffff, 0.12).fillCircle(32, 32, i * 4);
    });
}
