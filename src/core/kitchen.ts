import Phaser from 'phaser';
import type { ImageKey, SoundKey } from './assets';
import { burst, stars } from './fx';
import { inNoTouchZone } from './layout';
import type { Tappable } from './scenery';
import { sfx } from './sfx';

/**
 * The living kitchen (gameplay round): the few things on the kitchen wall she can tap. They are their own pictures
 * (assets-src/images-b/tools/gen_kitchen_live.py), drawn by the same code as the background, which no longer has
 * them; each is laid exactly over its spot, so the kitchen looks as before until she taps one. A tap makes it answer:
 * a jar hops and puffs, the basil wiggles, a utensil or a copper pot swings on its hook, the sun spins and sparkles.
 * Nothing moves by itself (wellbeing rule 5): every motion answers her tap. A tap here is never a miss and never
 * progress: the step does not see it as either.
 *
 * `box` is the picture's own box in the background's 2400x1080 frame (x0, y0; its size is the image's), `pivot` the
 * point it turns or squashes around (a jar's foot, a hook), in the same frame.
 */
type Move = 'hop' | 'wiggle' | 'swing' | 'spin';
interface Piece {
  key: ImageKey;
  box: [number, number];
  pivot: [number, number];
  move: Move;
  sound: SoundKey;
  volume: number;
  /** The colours of what flies out (a jar's contents, the basil's leaves). */
  bits?: number[];
}

export const KITCHEN_PIECES: readonly Piece[] = [
  { key: 'kitchen-jar-flour', box: [500, 106], pivot: [562, 226], move: 'hop', sound: 'pop', volume: 0.6, bits: [0xfffdf7, 0xf7f0e2] },
  { key: 'kitchen-jar-pasta', box: [606, 122], pivot: [663, 226], move: 'hop', sound: 'pop', volume: 0.6, bits: [0xefc66e, 0xf5d88f] },
  { key: 'kitchen-jar-jam', box: [712, 148], pivot: [755, 226], move: 'hop', sound: 'pop', volume: 0.6, bits: [0xe4523b, 0xf28c8c] },
  { key: 'kitchen-basil', box: [786, 112], pivot: [836, 226], move: 'wiggle', sound: 'sprinkle', volume: 0.5, bits: [0x739759, 0x8fcb6c] },
  { key: 'kitchen-ladle', box: [1454, 72], pivot: [1489, 76], move: 'swing', sound: 'click', volume: 0.7 },
  { key: 'kitchen-whisk', box: [1528, 72], pivot: [1551, 76], move: 'swing', sound: 'click', volume: 0.7 },
  { key: 'kitchen-spatula', box: [1576, 72], pivot: [1610, 76], move: 'swing', sound: 'click', volume: 0.7 },
  { key: 'kitchen-pan', box: [1610, 72], pivot: [1660, 76], move: 'swing', sound: 'click', volume: 0.8 },
  { key: 'kitchen-pot-1', box: [2040, 226], pivot: [2090, 232], move: 'swing', sound: 'oven-ding', volume: 0.25 },
  { key: 'kitchen-pot-2', box: [2164, 226], pivot: [2210, 232], move: 'swing', sound: 'oven-ding', volume: 0.25 },
  { key: 'kitchen-pot-3', box: [2278, 226], pivot: [2320, 232], move: 'swing', sound: 'oven-ding', volume: 0.25 },
  { key: 'kitchen-sun', box: [1228, 56], pivot: [1270, 98], move: 'spin', sound: 'star', volume: 0.6 },
];

/** A tap counts for a piece this near its middle (world units x the background's scale): at least a 200-unit target. */
const REACH = 100;

interface Placed {
  piece: Piece;
  img: Phaser.GameObjects.Image;
  /** Its middle (world), for picking the nearest. */
  mid: { x: number; y: number };
}

/**
 * Lays the pieces over the background (`bg`: the image addBackground made, origin bottom-centre). Title, home, the
 * album and the recipe all show them, so the kitchen looks the same everywhere.
 */
export function addKitchenPieces(scene: Phaser.Scene, bg: Phaser.GameObjects.Image): Placed[] {
  const s = bg.scaleX;
  const toWorld = (bx: number, by: number) => ({ x: bg.x + (bx - 1200) * s, y: bg.y + (by - 1080) * s });
  const out: Placed[] = [];
  for (const piece of KITCHEN_PIECES) {
    if (!scene.textures.exists(piece.key)) continue;
    const img = scene.add.image(0, 0, piece.key);
    const w = img.frame.realWidth;
    const h = img.frame.realHeight;
    const at = toWorld(piece.pivot[0], piece.pivot[1]);
    img.setOrigin((piece.pivot[0] - piece.box[0]) / w, (piece.pivot[1] - piece.box[1]) / h).setPosition(at.x, at.y).setScale(s).setDepth(-99);
    out.push({ piece, img, mid: toWorld(piece.box[0] + w / 2, piece.box[1] + h / 2) });
  }
  return out;
}

/**
 * Draws the pieces into a texture at the background's crop (the finale's photo: a square of the kitchen from x0 at
 * scale sc), so the photo's kitchen still has its jars and its sun.
 */
export function drawKitchenPieces(scene: Phaser.Scene, dt: Phaser.Textures.DynamicTexture, x0: number, sc: number) {
  const temp: Phaser.GameObjects.Image[] = [];
  for (const piece of KITCHEN_PIECES) {
    if (!scene.textures.exists(piece.key)) continue;
    const img = new Phaser.GameObjects.Image(scene, 0, 0, piece.key).setOrigin(0, 0).setScale(sc);
    dt.draw(img, (piece.box[0] - x0) * sc, piece.box[1] * sc);
    temp.push(img);
  }
  return temp;
}

/**
 * Makes the pieces answer her taps. Only the first finger counts (a second finger or a resting palm does nothing),
 * never in the no-touch strips, and never where a button is (the home button, the done button: they get the tap).
 * `extras`: the scenery's own (core/scenery.ts: the cat on the sill wakes for a yawn).
 */
export function liveKitchen(scene: Phaser.Scene, pieces: Placed[], extras: Tappable[] = []) {
  const s = pieces[0]?.img.scaleX ?? 1;
  scene.input.on(Phaser.Input.Events.POINTER_DOWN, (p: Phaser.Input.Pointer) => {
    if (scene.input.manager.pointers.some((o) => o !== p && o.isDown)) return;
    if (inNoTouchZone(scene, p.x, p.y)) return;
    if (scene.input.hitTestPointer(p).length) return;
    let best: Placed | Tappable | undefined;
    let bestD = Infinity;
    for (const pl of [...pieces, ...extras]) {
      const b = 'img' in pl ? pl.img.getBounds() : pl.bounds();
      const r = REACH * s;
      const inside = p.worldX > Math.min(b.left, pl.mid.x - r) && p.worldX < Math.max(b.right, pl.mid.x + r) && p.worldY > Math.min(b.top, pl.mid.y - r) && p.worldY < Math.max(b.bottom, pl.mid.y + r);
      if (!inside) continue;
      const d = Phaser.Math.Distance.Between(p.worldX, p.worldY, pl.mid.x, pl.mid.y);
      if (d < bestD) {
        bestD = d;
        best = pl;
      }
    }
    if (best) {
      if ('img' in best) answer(scene, best, s);
      else best.poke();
    }
  });
}

function answer(scene: Phaser.Scene, pl: Placed, s: number) {
  const { img, piece, mid } = pl;
  scene.tweens.killTweensOf(img);
  const y0 = img.getData('restY') ?? img.y;
  img.setData('restY', y0);
  img.setAngle(0).setScale(s).setY(y0);
  sfx(scene, piece.sound, { volume: piece.volume, minGapMs: 120 });
  if (piece.move === 'hop') {
    // squash on its foot, jump, land with a little squash
    scene.tweens.chain({
      targets: img,
      tweens: [
        { scaleY: s * 0.82, scaleX: s * 1.1, duration: 90, ease: 'Quad.easeOut' },
        { scaleY: s * 1.1, scaleX: s * 0.94, y: y0 - 34 * s, duration: 190, ease: 'Quad.easeOut' },
        { scaleY: s, scaleX: s, y: y0, duration: 170, ease: 'Quad.easeIn' },
        { scaleY: s * 0.9, scaleX: s * 1.06, duration: 70, yoyo: true },
      ],
    });
    const top = img.getBounds().top;
    scene.time.delayedCall(120, () => burst(scene, mid.x, top, { tint: piece.bits, count: 10, size: 16 * s, speed: 320 * s, gravityY: 700 * s, lifespan: 700 }));
  } else if (piece.move === 'wiggle') {
    scene.tweens.add({ targets: img, angle: { from: -9, to: 9 }, duration: 110, yoyo: true, repeat: 3, ease: 'Sine.easeInOut', onComplete: () => img.setAngle(0) });
    burst(scene, mid.x, img.getBounds().top + 30 * s, { tint: piece.bits, count: 8, size: 18 * s, speed: 260 * s, gravityY: 400 * s, lifespan: 800 });
  } else if (piece.move === 'swing') {
    // a push to one side, then it swings back and forth a little less each time and comes to rest
    const dir = Math.random() < 0.5 ? -1 : 1;
    const a = 24 * dir;
    scene.tweens.chain({
      targets: img,
      tweens: [
        { angle: a, duration: 180, ease: 'Sine.easeOut' },
        { angle: -a * 0.7, duration: 360, ease: 'Sine.easeInOut' },
        { angle: a * 0.45, duration: 330, ease: 'Sine.easeInOut' },
        { angle: -a * 0.2, duration: 300, ease: 'Sine.easeInOut' },
        { angle: 0, duration: 260, ease: 'Sine.easeInOut' },
      ],
    });
  } else {
    scene.tweens.add({ targets: img, angle: 360, duration: 700, ease: 'Cubic.easeOut', onComplete: () => img.setAngle(0) });
    scene.tweens.add({ targets: img, scale: s * 1.35, duration: 300, yoyo: true, ease: 'Sine.easeOut' });
    stars(scene, mid.x, mid.y, 8, 40 * s);
  }
}
