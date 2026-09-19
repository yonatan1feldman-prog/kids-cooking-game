import Phaser from 'phaser';
import { ART, IMAGES, type ImageKey } from '../core/assets';
import type { BowlExtra } from '../recipes/types';
import type { StepContext } from './Step';

const KEY = 'prep-bowl';
/** The egg's yolk on the flour, drawn in code (white around a round yolk). */
const YOLK = 'fx-yolk';
function ensureYolk(scene: Phaser.Scene) {
  if (scene.textures.exists(YOLK)) return;
  const g = scene.make.graphics({}, false);
  g.fillStyle(0xfffaf0, 0.95).fillEllipse(64, 40, 116, 60);
  g.fillStyle(0xffb22e).fillCircle(60, 36, 24);
  g.fillStyle(0xffe08a).fillCircle(52, 28, 8);
  g.lineStyle(4, 0x5b3a29, 0.5).strokeCircle(60, 36, 24);
  g.generateTexture(YOLK, 128, 80);
  g.destroy();
}
/** Depths: back wall, contents (and dents), the spoon, front wall (the spoon's bowl hides behind it). */
export const BOWL_DEPTH = { back: 1.5, contents: 1.6, tool: 1.75, front: 1.9 };

/**
 * The big bowls, by their back layer: where each stands (a stage spot) and its opening in its own frame. The prep bowl
 * of the pizza stands in the middle; the salad bowl on the right of the prep area (the things poured in wait left of it).
 */
const BOWLS: Record<
  string,
  {
    spot: 'prepBowl' | 'saladBowl' | 'blenderJar';
    opening: { x: number; y: number; rx: number; ry: number };
    /** What it stands on, drawn under it and moving with it (the blender's base and its button), in the bowl's frame. */
    stand?: { key: ImageKey; at: { x: number; y: number } }[];
  }
> = {
  'prep-bowl-back': { spot: 'prepBowl', opening: ART.prep.bowlOpening },
  'salad-bowl-back': { spot: 'saladBowl', opening: ART.salad.bowlOpening },
  // the jar's seat on the base's seat (README-smoothie.md): the base's centre and its button's, in the jar's frame
  'blender-jar-back': {
    spot: 'blenderJar',
    opening: ART.smoothie.jarMouth,
    stand: [
      { key: 'blender-base', at: { x: ART.smoothie.jarSeat.x, y: ART.smoothie.jarSeat.y + 260 - ART.smoothie.baseSeat.y } },
      { key: 'blender-button-off', at: { x: ART.smoothie.jarSeat.x, y: ART.smoothie.jarSeat.y + ART.smoothie.button.y - ART.smoothie.baseSeat.y } },
    ],
  },
};
const bowlOf = (back: string) => BOWLS[back] ?? BOWLS['prep-bowl-back'];

/**
 * The big prep bowl in the middle (crush, stir, and any later mixing step): its back layer, its contents,
 * its front layer, all at one position (stage.prepBowl), so the contents sit inside it. It lives across
 * steps: a step that is done with it but not the next one calls `keep()`, and the next step `take`s it.
 */
export class PrepBowl {
  readonly back: Phaser.GameObjects.Image;
  readonly front: Phaser.GameObjects.Image;
  contents: Phaser.GameObjects.Image;
  /** What lies on the contents until it is stirred in (the butter cube, the egg's yolk). */
  readonly extras: Phaser.GameObjects.Image[] = [];
  /** What it stands on (the blender's base, then its button), if anything. */
  readonly stand: Phaser.GameObjects.Image[] = [];
  readonly contentsDepth = BOWL_DEPTH.contents;
  private scene: Phaser.Scene;
  private s: number;
  private at: { x: number; y: number };

  /** The bowl left by the step before, if any. */
  static take(ctx: StepContext): PrepBowl | null {
    const img = ctx.run.handoff.get(KEY);
    ctx.run.handoff.delete(KEY);
    return img?.active ? ((img.getData(KEY) as PrepBowl) ?? null) : null;
  }

  /** Empty (no contents yet) until the first `crossfade`. */
  /** `at`: another stage spot than its own (the cookies' bowl stands where the pour steps' bowl does, `pourBowl`). */
  constructor(private ctx: StepContext, layers: { back: ImageKey; front: ImageKey }, contents: ImageKey | null, at?: 'pourBowl') {
    this.scene = ctx.scene;
    const spot = ctx.stage[at ?? bowlOf(layers.back).spot];
    this.s = spot.scale;
    this.at = { x: spot.x, y: spot.y };
    const img = (key: string, depth: number) => this.scene.add.image(spot.x, spot.y, key).setScale(this.s).setDepth(depth);
    this.back = img(layers.back, BOWL_DEPTH.back);
    this.contents = img(contents ?? layers.back, BOWL_DEPTH.contents).setVisible(!!contents);
    this.front = img(layers.front, BOWL_DEPTH.front);
    (bowlOf(layers.back).stand ?? []).forEach((st, i) => {
      const at = this.point(st.at.x, st.at.y);
      this.stand.push(img(st.key, BOWL_DEPTH.back - 0.1 + i * 0.01).setPosition(at.x, at.y));
    });
    this.back.setData(KEY, this);
    // It slides in from below, with a little bounce.
    const all = this.parts;
    all.forEach((o) => {
      const y = o.y;
      o.setAlpha(0).setY(y + 120 * ctx.layout.k);
      this.scene.tweens.add({ targets: o, alpha: 1, y, duration: 450, ease: 'Back.easeOut' });
    });
    this.front.setData({ restScaleX: this.s, restScaleY: this.s });
  }

  get parts() {
    return [...this.stand, this.back, this.contents, ...this.extras, this.front];
  }

  /** Where a point of the bowl's frame is on screen. */
  point(x: number, y: number) {
    const [w, h] = IMAGES[this.back.texture.key as ImageKey].size;
    return { x: this.back.x + (x - w / 2) * this.s, y: this.back.y + (y - h / 2) * this.s };
  }

  /** Puts something on the contents (it lands with a little bounce); `img` = an object already on screen to use. */
  addExtra(e: BowlExtra, img?: Phaser.GameObjects.Image) {
    const at = this.point(e.at.x, e.at.y);
    if (e.key === 'yolk') ensureYolk(this.scene);
    const key = e.key === 'yolk' ? YOLK : e.key;
    const o = (img ?? this.scene.add.image(at.x, at.y - 80 * this.ctx.layout.k, key)).setDepth(BOWL_DEPTH.contents + 0.03).setAngle(0);
    if (e.base) {
      const [w, h] = IMAGES[e.key as ImageKey].size;
      o.setOrigin(e.base.x / w, e.base.y / h);
    }
    const scale = e.scale * this.s;
    this.extras.push(o);
    this.scene.tweens.killTweensOf(o);
    this.scene.tweens.add({ targets: o, x: at.x, y: at.y, scale, duration: 320, ease: 'Bounce.easeOut' });
    return o;
  }

  get scale() {
    return this.s;
  }

  setContents(key: ImageKey) {
    if (this.contents.texture.key !== key) this.contents.setTexture(key);
    this.contents.setVisible(true);
  }

  /** The contents change to `key` (crossfade). */
  crossfade(key: ImageKey, ms: number) {
    const old = this.contents;
    const n = this.scene.add.image(old.x, old.y, key).setScale(this.s).setDepth(BOWL_DEPTH.contents + 0.01).setAlpha(0);
    this.contents = n;
    this.scene.tweens.add({ targets: n, alpha: 1, duration: ms, onComplete: () => (old.destroy(), n.setDepth(BOWL_DEPTH.contents)) });
  }

  /** The whole bowl (back and front layers). */
  bounds() {
    const a = this.back.getBounds();
    const b = this.front.getBounds();
    const x0 = Math.min(a.x, b.x);
    const y0 = Math.min(a.y, b.y);
    return new Phaser.Geom.Rectangle(x0, y0, Math.max(a.right, b.right) - x0, Math.max(a.bottom, b.bottom) - y0);
  }

  /** The bowl's opening (an ellipse) in world coordinates. */
  opening() {
    const key = this.back.texture.key as ImageKey;
    const o = bowlOf(key).opening;
    const [w, h] = IMAGES[key].size;
    const s = this.back.scaleX;
    return { x: this.back.x + (o.x - w / 2) * s, y: this.back.y + (o.y - h / 2) * s, rx: o.rx * s, ry: o.ry * s };
  }

  /** The nearest point inside the opening (shrunk by f), so dents and the spoon stay in the bowl. */
  clampToOpening(x: number, y: number, f = 1) {
    const o = this.opening();
    const dx = (x - o.x) / (o.rx * f);
    const dy = (y - o.y) / (o.ry * f);
    const d = Math.hypot(dx, dy);
    if (d <= 1) return { x, y };
    return { x: o.x + (dx / d) * o.rx * f, y: o.y + (dy / d) * o.ry * f };
  }

  /** How far a point is from the opening's centre, in opening radii (1 = on the rim). */
  reach(x: number, y: number) {
    const o = this.opening();
    return Math.hypot((x - o.x) / o.rx, (y - o.y) / o.ry);
  }

  /** Leaves the bowl for the next step. */
  keep() {
    const old = this.ctx.run.handoff.get(KEY);
    if (old && old !== this.back) (old.getData(KEY) as PrepBowl | undefined)?.destroy();
    this.ctx.run.handoff.set(KEY, this.back);
  }

  destroy() {
    this.parts.forEach((o) => o.destroy());
  }

  get position() {
    return this.at;
  }
}
