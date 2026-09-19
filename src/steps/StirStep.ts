import Phaser from 'phaser';
import { ART, IMAGES } from '../core/assets';
import { burst } from '../core/fx';
import type { HandMotion } from '../core/hand';
import { sfx } from '../core/sfx';
import { TUNING } from '../core/tuning';
import type { StirParams } from '../recipes/types';
import { BOWL_DEPTH, PrepBowl } from './PrepBowl';
import { Step } from './Step';

/** Mom's spoon hand is shown bigger here, in proportion to the big bowl. */
const STIR_HAND = 1.35;

/**
 * Stirring: the spoon follows the finger, its bowl kept inside the bowl's opening, and every movement in
 * the bowl stirs: no circles needed, any wiggle counts. The contents turn smoothly from `from` into `to`
 * as the stirring adds up (TUNING.stir.distance). At the end the bowl moves to the left column and turns
 * into the next step's bowl (`handoffAs`), while the pizza comes back to the middle.
 */
export class StirStep extends Step<StirParams> {
  private bowl!: PrepBowl;
  private done!: Phaser.GameObjects.Image;
  private spoon!: Phaser.GameObjects.Image;
  private rest = { x: 0, y: 0, angle: 28 };
  private stirring = false;
  private last = { x: 0, y: 0 };
  private progress = 0;
  private sinceFx = 0;
  private finishing = false;
  private k = 1;

  start() {
    this.stepLine = this.params.line;
    this.k = this.layout.k;
    this.workspace('aside');
    this.bowl = PrepBowl.take(this.ctx) ?? new PrepBowl(this.ctx, this.params.bowl, this.params.from);
    this.bowl.setContents(this.params.from);
    const c = this.bowl.contents;
    this.done = this.own(this.scene.add.image(c.x, c.y, this.params.to).setScale(this.bowl.scale).setDepth(BOWL_DEPTH.contents + 0.02).setAlpha(0));

    // The spoon rests in the bowl, leaning on the right rim (the art agent's mash scene).
    const s = this.bowl.scale;
    const p = this.bowl.position;
    this.rest = { x: p.x + 250 * s, y: p.y - 20 * s, angle: 28 };
    const [w, h] = IMAGES['spoon-wood'].size;
    this.spoon = this.own(this.scene.add.image(this.rest.x, this.rest.y, this.params.tool).setDepth(BOWL_DEPTH.tool));
    this.spoon.setOrigin(ART.prep.spoonBowl.x / w, ART.prep.spoonBowl.y / h).setScale(0.8 * this.k).setAngle(this.rest.angle).setAlpha(0);
    this.scene.tweens.add({ targets: this.spoon, alpha: 1, duration: 300 });

    this.onDown((q) => {
      if (this.finishing) return;
      const onSpoon = this.spoon.getBounds().contains(q.worldX, q.worldY);
      if (this.bowl.reach(q.worldX, q.worldY) > 1.8 && !onSpoon) return;
      this.stirring = true;
      const at = this.spoonAt(q.worldX, q.worldY);
      this.last = at;
      this.moveSpoon(at);
      sfx(this.scene, 'squish', { minGapMs: 150, volume: 0.6 });
      this.drops(at.x, at.y, 4);
    });
    this.onMove((q) => {
      if (!this.stirring || this.finishing) return;
      const at = this.spoonAt(q.worldX, q.worldY);
      const d = Phaser.Math.Distance.Between(this.last.x, this.last.y, at.x, at.y);
      this.last = at;
      this.moveSpoon(at);
      if (this.bowl.reach(q.worldX, q.worldY) > 2.2) return;
      this.stir(d, at.x, at.y);
    });
    this.onUp(() => {
      if (!this.stirring) return;
      this.stirring = false;
      if (!this.finishing) this.restSpoon();
    });
    this.setIdle(true);
  }

  /** The spoon's bowl goes where the finger is, kept inside the opening. */
  private spoonAt(x: number, y: number) {
    return this.bowl.clampToOpening(x, y, 0.85);
  }

  private moveSpoon(at: { x: number; y: number }) {
    this.scene.tweens.killTweensOf(this.spoon);
    const o = this.bowl.opening();
    this.spoon.setPosition(at.x, at.y).setAngle(12 + ((at.x - o.x) / o.rx) * 18);
  }

  private restSpoon() {
    this.scene.tweens.add({ targets: this.spoon, x: this.rest.x, y: this.rest.y, angle: this.rest.angle, duration: 300, ease: 'Sine.easeOut' });
  }

  private drops(x: number, y: number, n: number) {
    burst(this.scene, x, y, { tint: this.params.splash, count: n, size: 16 * this.k, speed: 260 * this.k, gravityY: 900, lifespan: 450, depth: BOWL_DEPTH.front + 0.1 });
  }

  private stir(d: number, x: number, y: number) {
    if (d <= 0) return;
    this.poke();
    this.progress = Math.min(1, this.progress + d / (this.params.distance * this.k));
    this.render();
    this.sinceFx += d;
    if (this.sinceFx > 110 * this.k) {
      this.sinceFx = 0;
      sfx(this.scene, 'squish', { minGapMs: 180, volume: 0.45 });
      this.drops(x, y, 2);
    }
    if (this.progress >= 1) this.finish();
  }

  /** The smooth sauce shows through more and more; the contents sway a little with the spoon. */
  private render() {
    this.done.setAlpha(this.progress);
    const sway = Math.sin(this.progress * 40) * 1.5;
    this.bowl.contents.setAngle(sway);
    this.done.setAngle(sway);
  }

  /** The bowl goes to the left column and turns into the next step's bowl; the pizza comes back. */
  private finish() {
    if (this.finishing) return;
    this.finishing = true;
    this.stirring = false;
    this.setIdle(false);
    this.hand.stop();
    this.progress = 1;
    this.render();
    this.bowl.contents.setAngle(0);
    this.done.setAngle(0);
    this.scene.tweens.add({ targets: this.spoon, alpha: 0, duration: 250 });
    const S = this.ctx.stage;
    const parts = [...this.bowl.parts, this.done];
    this.scene.time.delayedCall(350, () => {
      this.workspace('dish', 600);
      const key = this.params.handoffAs;
      const [bw] = IMAGES['prep-bowl-back'].size;
      const scale = key ? (IMAGES[key].size[0] * this.k * 0.95) / bw : this.bowl.scale * 0.5;
      this.scene.tweens.add({ targets: parts, x: S.bowl.x, y: S.bowl.y, scale, duration: 600, ease: 'Sine.easeInOut' });
      if (key) {
        const next = this.scene.add.image(S.bowl.x, S.bowl.y, key).setScale(this.k).setAlpha(0).setDepth(2);
        this.scene.tweens.add({ targets: next, alpha: 1, delay: 450, duration: 250 });
        this.scene.tweens.add({ targets: parts, alpha: 0, delay: 500, duration: 250 });
        this.handOff(key, next);
      } else this.scene.tweens.add({ targets: parts, alpha: 0, delay: 500, duration: 250 });
      this.scene.time.delayedCall(800, () => {
        this.bowl.destroy();
        this.complete();
      });
    });
  }

  /** Mom's spoon hand circles inside the bowl (the real spoon rests hidden meanwhile). */
  protected demo(): HandMotion {
    const o = this.bowl.opening();
    const keys = [];
    for (let i = 0; i <= 10; i++) {
      const a = Math.PI / 2 + (i / 10) * Math.PI * 2 * 1.3;
      keys.push({ x: o.x + Math.cos(a) * o.rx * 0.55, y: o.y + Math.sin(a) * o.ry * 0.55, t: 150 + i * 205 });
    }
    keys.unshift({ ...keys[0], t: 0 });
    keys.push({ ...keys[keys.length - 1], t: 2450 });
    return { kind: 'spread', size: STIR_HAND, keys, glow: { x: o.x, y: o.y }, onStop: () => this.spoon.active && this.spoon.setVisible(true) };
  }

  protected onDemoStart() {
    this.spoon.setVisible(false);
  }

  protected showHint() {
    this.spoon.setVisible(false);
    super.showHint();
  }

  protected onDemoEnd() {
    this.spoon.setVisible(true);
  }

  /** Mom helps: her spoon hand stirs round and round until the sauce is smooth. */
  protected autoFinish() {
    this.spoon.setVisible(false);
    const o = this.bowl.opening();
    const t0 = this.scene.time.now;
    const at = () => {
      const a = (this.scene.time.now - t0) / 260;
      return { x: o.x + Math.cos(a) * o.rx * 0.55, y: o.y + Math.sin(a) * o.ry * 0.55 };
    };
    this.hand.follow('spread', at, STIR_HAND);
    this.scene.tweens.addCounter({
      from: this.progress,
      to: 1,
      duration: TUNING.help.stirMs,
      onUpdate: (tw) => {
        this.progress = tw.getValue() ?? 1;
        this.render();
        const p = at();
        if (Math.random() < 0.15) this.drops(p.x, p.y, 2);
        sfx(this.scene, 'squish', { minGapMs: 300, volume: 0.45 });
      },
      onComplete: () => {
        this.spoon.setVisible(true);
        this.finish();
      },
    });
  }
}
