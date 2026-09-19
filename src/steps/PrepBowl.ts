import Phaser from 'phaser';
import { ART, IMAGES, type ImageKey } from '../core/assets';
import type { StepContext } from './Step';

const KEY = 'prep-bowl';
/** Depths: back wall, contents (and dents), the spoon, front wall (the spoon's bowl hides behind it). */
export const BOWL_DEPTH = { back: 1.5, contents: 1.6, tool: 1.75, front: 1.9 };

/**
 * The big prep bowl in the middle (crush, stir, and any later mixing step): its back layer, its contents,
 * its front layer, all at one position (stage.prepBowl), so the contents sit inside it. It lives across
 * steps: a step that is done with it but not the next one calls `keep()`, and the next step `take`s it.
 */
export class PrepBowl {
  readonly back: Phaser.GameObjects.Image;
  readonly front: Phaser.GameObjects.Image;
  contents: Phaser.GameObjects.Image;
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

  constructor(private ctx: StepContext, layers: { back: ImageKey; front: ImageKey }, contents: ImageKey) {
    this.scene = ctx.scene;
    const spot = ctx.stage.prepBowl;
    this.s = spot.scale;
    this.at = { x: spot.x, y: spot.y };
    const img = (key: string, depth: number) => this.scene.add.image(spot.x, spot.y, key).setScale(this.s).setDepth(depth);
    this.back = img(layers.back, BOWL_DEPTH.back);
    this.contents = img(contents, BOWL_DEPTH.contents);
    this.front = img(layers.front, BOWL_DEPTH.front);
    this.back.setData(KEY, this);
    // It slides in from below, with a little bounce.
    const all = this.parts;
    all.forEach((o) => o.setAlpha(0).setY(spot.y + 120 * ctx.layout.k));
    this.scene.tweens.add({ targets: all, alpha: 1, y: spot.y, duration: 450, ease: 'Back.easeOut' });
    this.front.setData({ restScaleX: this.s, restScaleY: this.s });
  }

  get parts() {
    return [this.back, this.contents, this.front];
  }

  get scale() {
    return this.s;
  }

  setContents(key: ImageKey) {
    if (this.contents.texture.key !== key) this.contents.setTexture(key);
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
    const o = ART.prep.bowlOpening;
    const [w, h] = IMAGES['prep-bowl-back'].size;
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
