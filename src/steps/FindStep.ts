import Phaser from 'phaser';
import { FX_SOFT } from '../core/assets';
import { voice } from '../core/audio';
import { boing, burst, stars } from '../core/fx';
import { tapMotion, type HandMotion } from '../core/hand';
import { opaqueBounds } from '../core/placeholders';
import { sfx } from '../core/sfx';
import type { FindParams } from '../recipes/types';
import { Step } from './Step';

interface Tool {
  image: string;
  name?: FindParams['options'][number]['name'];
  right: boolean;
  x: number;
  y: number;
  bin: Phaser.GameObjects.Image;
  item: Phaser.GameObjects.Image;
  itemY: number;
}

/**
 * Find the tool (gameplay round 4, a small challenge: "which one do we need?"). Three kitchen tools stand on their
 * bins in the middle, in a new order every time; Mom asks for one ("Which one is the grater? Can you find it?"). A tap
 * on another one is never wrong: it hops and Mom names it ("Whisk!"), a miss (three show her hand on the right one).
 * The right one hops high, glows, stars, Mom names it, and it goes off to work (the next step uses it). Mom's demo
 * only looks over the three (it does not give the answer away); her hint (after the usual wait) taps the right one,
 * and her help picks it.
 */
export class FindStep extends Step<FindParams> {
  private tools: Tool[] = [];
  private done = false;
  private k = 1;

  start() {
    this.stepLine = this.params.line;
    const S = this.ctx.stage;
    this.k = this.layout.k;
    this.workspace('aside');
    const opts = Phaser.Utils.Array.Shuffle([...this.params.options]);
    const n = opts.length;
    const bs = S.choiceScale(n);
    const b = 240 * bs;
    opts.forEach((o, i) => {
      const { x, y } = S.choice(i, n);
      const bin = this.own(this.scene.add.image(x, y, this.params.bin).setScale(0).setDepth(2));
      const item = this.own(this.scene.add.image(x, y, o.image).setDepth(3));
      const ob = opaqueBounds(this.scene, o.image);
      const tw = item.frame.realWidth;
      const th = item.frame.realHeight;
      const ow = ob?.w ?? tw;
      const oh = ob?.h ?? th;
      const s = Math.min((b * 0.9) / ow, (b * 0.9) / oh);
      item.setOrigin((ob?.cx ?? tw / 2) / tw, ((ob?.y ?? 0) + oh / 2) / th);
      const itemY = y - b * 0.05;
      item.setY(itemY).setScale(0).setData('rest', s);
      this.scene.tweens.add({ targets: bin, scale: bs, duration: 400, delay: i * 70, ease: 'Back.easeOut' });
      this.scene.tweens.add({ targets: item, scale: s, duration: 400, delay: 80 + i * 70, ease: 'Back.easeOut' });
      this.tools.push({ image: o.image, name: o.name, right: o.image === this.params.answer, x, y, bin, item, itemY });
    });
    this.onDown((p) => {
      if (this.done) return;
      const h = S.chooseHalf(n);
      const t = this.tools.find((c) => Math.abs(p.worldX - c.x) <= h && Math.abs(p.worldY - c.y) <= h);
      if (t) this.tap(t);
    });
    this.setIdle(true);
  }

  private get answer() {
    return this.tools.find((t) => t.right)!;
  }

  private tap(t: Tool) {
    if (this.done) return;
    this.poke();
    const k = this.k;
    const rest = t.item.getData('rest') as number;
    this.scene.tweens.killTweensOf(t.item);
    t.item.setScale(rest).setY(t.itemY).setAngle(0);
    if (t.name) voice.say(t.name, { group: 'name', ttlMs: 2500 });
    if (!t.right) {
      // Not this one: it hops and wiggles, Mom says what it is. Never "no".
      this.miss();
      sfx(this.scene, 'tap');
      this.scene.tweens.add({ targets: t.item, y: t.itemY - 30 * k, duration: 140, yoyo: true, ease: 'Quad.easeOut' });
      this.scene.tweens.add({ targets: t.item, angle: { from: -6, to: 6 }, duration: 90, yoyo: true, repeat: 1, onComplete: () => t.item.setAngle(0) });
      boing(this.scene, t.bin, 0.08);
      return;
    }
    this.hit();
    this.done = true;
    this.setIdle(false);
    this.hand.stop();
    sfx(this.scene, 'pop');
    const glow = this.own(this.scene.add.image(t.x, t.itemY, FX_SOFT).setDepth(2.5).setTint(0xffe066).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0));
    glow.setScale((240 * this.ctx.stage.choiceScale(this.tools.length) * 1.4) / glow.frame.realWidth);
    this.scene.tweens.add({ targets: glow, alpha: 0.8, duration: 200 });
    burst(this.scene, t.x, t.itemY - 60 * k, { count: 10, size: 18 * k, tint: [0xffffff, 0xffcb47], speed: 340 * k, gravityY: 400 });
    stars(this.scene, t.x, t.itemY - 40 * k, 6, 50 * k);
    this.scene.tweens.add({ targets: t.item, y: t.itemY - 80 * k, angle: 8, duration: 220, ease: 'Quad.easeOut', yoyo: true, hold: 250 });
    // The others step back; the found one stays a moment, then it goes to work.
    for (const o of this.tools) if (o !== t) this.scene.tweens.add({ targets: [o.item, o.bin], alpha: 0.25, duration: 300 });
    this.scene.time.delayedCall(1300, () => {
      if (this.aborted) return;
      this.scene.tweens.add({ targets: [t.item, glow], scale: '*=1.2', alpha: 0, duration: 350 });
      this.scene.time.delayedCall(380, () => this.complete());
    });
  }

  /** Mom's finger looks over the three (it does not tap the answer: that is the hint's). */
  protected demo(): HandMotion | null {
    if (this.done) return null;
    const ts = [...this.tools].sort((a, b) => a.x - b.x || a.y - b.y);
    const up = 90 * this.k;
    const keys = ts.map((t, i) => ({ x: t.x, y: t.itemY - up, t: 200 + i * 600 }));
    keys.unshift({ ...keys[0], t: 0 });
    keys.push({ ...keys[keys.length - 1], t: 200 + ts.length * 600 });
    return { kind: 'point', keys };
  }

  /** The hint (after the wait, or three tries): Mom's finger taps the right one. */
  protected showHint() {
    const a = this.answer;
    this.hand.play(tapMotion({ x: a.x, y: a.itemY - 40 * this.k }, this.k), { loop: true, gapMs: 900 });
  }

  /** Mom helps: her finger picks the right one. */
  protected autoFinish() {
    const a = this.answer;
    const at = { x: a.x, y: a.itemY - 40 * this.k };
    this.hand.play({ ...tapMotion(at, this.k), glow: undefined });
    this.scene.time.delayedCall(600, () => !this.aborted && this.tap(a));
  }
}
