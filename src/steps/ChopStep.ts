import Phaser from 'phaser';
import { ART } from '../core/assets';
import { countKey, voice } from '../core/audio';
import { boing, burst } from '../core/fx';
import type { HandMotion } from '../core/hand';
import { sfx } from '../core/sfx';
import { TUNING } from '../core/tuning';
import { VEG, vegColumn } from '../core/vegArt';
import type { ChopParams } from '../recipes/types';
import { Step } from './Step';
import { binKey, binsWaiting, fillBin, makeBin, parkBin } from './ToppingBin';

/** The knife's size (x the board's own scale / 1.05; it is 0.9 in the art agent's scene, a little smaller so it fits above the vegetable). */
const KNIFE = 0.8;
/** A slice on the pile. */
const SLICE = 0.8;

/**
 * Chop (reusable: vegetables for a pizza or a salad, fruit, a cucumber...). The whole vegetable lies on the cutting
 * board in the middle; the knife waits upright just above the next cut line. The knife follows the finger by its
 * blade tip. Every short move down over the vegetable (TUNING.chop.minSwipe, from any height, anywhere sideways) cuts
 * the next slice: the code cuts from right to left at one slice width inside the body (core/vegArt.ts), the cut face
 * strip sits on the cut line fitted to the body's profile (the mushroom shows only its cap outside the stem), a slice
 * drops onto the pile, chop, and Mom counts. One cut per stroke: the finger goes up (or lifts) for the next. After
 * `cuts` cuts the end that is left becomes the last slice; the slices fly into the topping's bin, which waits for
 * decorating. A tap without a stroke only wiggles the vegetable (3 of those show the hint).
 */
export class ChopStep extends Step<ChopParams> {
  private board!: Phaser.GameObjects.Image;
  private veg!: Phaser.GameObjects.Image;
  private strip?: Phaser.GameObjects.Image;
  private knife!: Phaser.GameObjects.Image;
  private pile: Phaser.GameObjects.Image[] = [];
  private cutsDone = 0;
  private held = false;
  private armed = true;
  private downRun = 0;
  private upRun = 0;
  private lastY = 0;
  private cutThisTouch = false;
  private moved = 0;
  private finishing = false;
  /** Board scale / 1.05: the art agent's k for this scene. */
  private u = 1;
  private vs = 1;
  private vegLeft = 0;
  private vegTop = 0;

  start() {
    const p = this.params;
    this.stepLine = p.line;
    if (p.careful && !this.ctx.run.once.has(p.careful)) {
      this.ctx.run.once.add(p.careful);
      this.moreLines = [p.careful];
    }
    const S = this.ctx.stage;
    this.workspace(S.prepWide ? 'aside' : 'none');
    const b = S.cutBoard;
    this.u = b.scale / 1.05;
    const u = this.u;
    this.board = this.own(this.scene.add.image(b.x, b.y, p.board).setScale(b.scale).setDepth(2));
    // The vegetable, as in the art agent's cut scene: its 672x504 frame at u/1.2, left of the board's middle.
    this.vs = u / 1.2;
    const [VW, VH] = VEG.size;
    const vx = b.x - 150 * u;
    const vy = b.y - 20 * u;
    this.vegLeft = vx - (VW / 2) * this.vs;
    this.vegTop = vy - (VH / 2) * this.vs;
    this.veg = this.own(this.scene.add.image(this.vegLeft, this.vegTop, p.whole).setOrigin(0, 0).setScale(this.vs).setDepth(3));
    this.knife = this.own(this.scene.add.image(0, 0, p.knife).setOrigin(ART.prep.knifeTip.x / 240, ART.prep.knifeTip.y / 640).setScale(KNIFE * u).setDepth(6));
    this.knife.setPosition(this.restPoint().x, this.restPoint().y);
    for (const o of [this.board, this.veg, this.knife]) o.setAlpha(0);
    this.scene.tweens.add({ targets: [this.board, this.veg], alpha: 1, duration: 400 });
    this.scene.tweens.add({ targets: this.knife, alpha: 1, delay: 250, duration: 300 });

    this.onDown((q) => {
      if (this.finishing || !this.inReach(q.worldX, q.worldY)) return;
      this.held = true;
      this.armed = true;
      this.downRun = this.upRun = 0;
      this.moved = 0;
      this.cutThisTouch = false;
      this.lastY = q.worldY;
      this.scene.tweens.killTweensOf(this.knife);
      this.follow(q.worldX, q.worldY, true);
      sfx(this.scene, 'tap', { volume: 0.5 });
      this.poke();
    });
    this.onMove((q) => {
      if (!this.held || this.finishing) return;
      const dy = q.worldY - this.lastY;
      this.lastY = q.worldY;
      this.moved += Math.abs(dy);
      this.follow(q.worldX, q.worldY, false);
      if (dy > 0) {
        this.downRun += dy;
        this.upRun = 0;
      } else if (dy < 0) {
        // Going up again: ready for the next stroke.
        this.upRun -= dy;
        if (this.upRun > 25 * u) {
          this.armed = true;
          this.downRun = 0;
        }
      }
      if (this.armed && this.downRun >= this.params.minSwipe * this.layout.k && this.inCutZone(q.worldX, q.worldY)) {
        this.armed = false;
        this.downRun = 0;
        this.cutThisTouch = true;
        this.cut();
      }
    });
    this.onUp((_q, cancelled) => {
      if (!this.held) return;
      this.held = false;
      // A tap on the vegetable without a stroke: it wiggles (a try; after 3 the hand shows the stroke).
      if (!cancelled && !this.cutThisTouch && this.moved < 10 && !this.finishing) {
        this.miss();
        this.scene.tweens.add({ targets: this.veg, angle: { from: -2, to: 2 }, duration: 70, yoyo: true, repeat: 1, onComplete: () => this.veg.setAngle(0) });
      }
      this.restKnife();
    });
    this.setIdle(true);
  }

  private get span() {
    return VEG.span[this.params.veg];
  }

  /** Slice width in file units: `cuts` cuts leave `cuts + 1` pieces of the body. */
  private get sliceW() {
    const [s0, s1] = this.span;
    return (s1 - s0) / (this.params.cuts + 1);
  }

  private cutX(i: number) {
    return this.span[1] - i * this.sliceW;
  }

  /** File point -> world point. */
  private X(fx: number) {
    return this.vegLeft + fx * this.vs;
  }

  private Yf(fy: number) {
    return this.vegTop + fy * this.vs;
  }

  /** The knife waits upright, its tip just above the next cut line. */
  private restPoint() {
    const x = this.cutX(Math.min(this.cutsDone + 1, this.params.cuts));
    return { x: this.X(x), y: this.Yf(vegColumn(this.params.veg, x).top) - 15 * this.u };
  }

  private restKnife() {
    if (!this.knife.active) return;
    const r = this.restPoint();
    this.scene.tweens.add({ targets: this.knife, x: r.x, y: r.y, duration: 280, ease: 'Sine.easeOut' });
  }

  /** The vegetable's zone (or the knife itself) grabs the knife. */
  private inReach(x: number, y: number) {
    return this.inCutZone(x, y) || this.knife.getBounds().contains(x, y);
  }

  /** Over the vegetable, generously: its body's width +150 each side, from well above it to just below it. */
  cutZone() {
    const [s0, s1] = this.span;
    const u = this.u;
    return { x0: this.X(s0) - 150 * u, x1: this.X(s1) + 150 * u, y0: this.Yf(80) - 250 * u, y1: this.Yf(480) + 70 * u };
  }

  private inCutZone(x: number, y: number) {
    const z = this.cutZone();
    return x > z.x0 && x < z.x1 && y > z.y0 && y < z.y1;
  }

  /** The knife tip under the finger; over the vegetable it glides onto the next cut line. */
  private follow(x: number, y: number, jump: boolean) {
    const [s0, s1] = this.span;
    const over = x > this.X(s0) - 150 * this.u && x < this.X(s1) + 150 * this.u;
    const target = over ? this.X(this.cutX(Math.min(this.cutsDone + 1, this.params.cuts))) : x;
    const nx = jump ? target : this.knife.x + (target - this.knife.x) * 0.5;
    this.knife.setPosition(nx, y);
  }

  private cut() {
    if (this.cutsDone >= this.params.cuts) return;
    this.poke();
    this.hit();
    const i = ++this.cutsDone;
    const x = this.cutX(i);
    const col = vegColumn(this.params.veg, x);
    this.veg.setCrop(0, 0, x, VEG.size[1]);
    this.placeStrip(x);
    // The cut-off piece becomes a slice that drops onto the pile.
    this.dropSlice(this.X(x + this.sliceW / 2), this.Yf((col.top + col.bottom) / 2));
    sfx(this.scene, 'chop', { minGapMs: 0 });
    voice.say(countKey(i), { group: 'count', sequence: true, ttlMs: 5000 });
    burst(this.scene, this.X(x), this.Yf((col.top + col.bottom) / 2), { count: 7, size: 16 * this.u, tint: this.params.juice, speed: 300 * this.u, gravityY: 700 });
    this.scene.tweens.add({ targets: this.veg, y: this.vegTop + 6 * this.u, duration: 70, yoyo: true });
    if (i >= this.params.cuts) this.finish();
  }

  /** The cut face on the cut line, fitted to the body there (README-prep.md, "Cut-face strips"). */
  private placeStrip(x: number) {
    const veg = this.params.veg;
    const col = vegColumn(veg, x);
    const h = (col.bottom - col.top) * this.vs;
    const H = VEG.stripH[veg];
    const capOnly = veg === 'mushroom' && col.bottom < VEG.mushStemBottom;
    this.strip ??= this.own(this.scene.add.image(0, 0, this.params.inside).setOrigin(0, 0).setDepth(3.1));
    this.strip.setPosition(this.X(x - VEG.stripW / 2), this.Yf(col.top));
    if (capOnly) {
      this.strip.setCrop(0, 0, VEG.stripW, H * VEG.mushCapFrac);
      this.strip.setScale(this.vs, h / (H * VEG.mushCapFrac));
    } else {
      this.strip.setCrop();
      this.strip.setScale(this.vs, h / H);
    }
  }

  private dropSlice(fromX: number, fromY: number) {
    const u = this.u;
    const b = this.ctx.stage.cutBoard;
    const pileX = (this.X(this.span[1]) + b.x + 440 * u) / 2;
    const n = this.pile.length;
    const to = { x: pileX + ((n % 3) - 1) * 70 * u + Phaser.Math.FloatBetween(-15, 15) * u, y: b.y - 40 * u + Math.floor(n / 3) * 70 * u + Phaser.Math.FloatBetween(-10, 10) * u };
    const s = this.own(this.scene.add.image(fromX, fromY, this.params.slice).setScale(0.5 * u).setDepth(4 + n * 0.01));
    this.pile.push(s);
    this.scene.tweens.add({ targets: s, x: to.x, y: to.y, scale: SLICE * u, angle: Phaser.Math.Between(-35, 35), duration: 380, ease: 'Quad.easeOut', onComplete: () => boing(this.scene, s, 0.12) });
  }

  /** All cuts done: the end that is left becomes the last slice, then the slices go into the topping's bin. */
  private finish() {
    if (this.finishing) return;
    this.finishing = true;
    this.held = false;
    this.setIdle(false);
    this.hand.stop();
    this.scene.tweens.add({ targets: this.knife, alpha: 0, duration: 300 });
    this.scene.time.delayedCall(450, () => {
      const x = this.cutX(this.params.cuts);
      const col = vegColumn(this.params.veg, (this.span[0] + x) / 2);
      this.veg.setVisible(false);
      this.strip?.setVisible(false);
      this.dropSlice(this.X((this.span[0] + x) / 2), this.Yf((col.top + col.bottom) / 2));
      sfx(this.scene, 'pop', { volume: 0.6 });
    });
    this.scene.time.delayedCall(1200, () => {
      const u = this.u;
      const p = this.params;
      const b = this.ctx.stage.cutBoard;
      const pileX = (this.X(this.span[1]) + b.x + 440 * u) / 2;
      const bin = makeBin(this.scene, p.bin, p.topping, pileX, b.y + 20 * u, 0);
      const bs = 0.8 * this.layout.k;
      this.scene.tweens.add({ targets: [bin], scale: bs, duration: 300, ease: 'Back.easeOut' });
      this.scene.tweens.add({ targets: [bin.getData('icon')], scale: bs * 1.1, duration: 300, ease: 'Back.easeOut' });
      const index = binsWaiting(this.ctx);
      this.scene.time.delayedCall(320, () =>
        fillBin(this.scene, bin, this.pile.splice(0), () => {
          this.handOff(binKey(p.topping), bin);
          parkBin(this.ctx, bin, index, () => this.complete());
        }),
      );
    });
  }

  /** Mom's knife hand: one stroke down through the vegetable on the next cut line (nothing is cut). */
  protected demo(): HandMotion | null {
    if (this.finishing) return null;
    const x = this.cutX(Math.min(this.cutsDone + 1, this.params.cuts));
    const col = vegColumn(this.params.veg, x);
    const X = this.X(x);
    const top = this.Yf(col.top) - 40 * this.u;
    const bottom = this.Yf(col.bottom) - 30 * this.u;
    return {
      kind: 'knife',
      keys: [
        { x: X, y: top - 40 * this.u, t: 0 },
        { x: X, y: top, t: 500 },
        { x: X, y: bottom, t: 1200 },
        { x: X, y: bottom, t: 1500 },
        { x: X, y: top - 40 * this.u, t: 2200 },
      ],
      glow: { x: X, y: (this.Yf(col.top) + this.Yf(col.bottom)) / 2 },
      onStop: () => this.knife.active && !this.finishing && this.knife.setVisible(true),
    };
  }

  protected onDemoStart() {
    this.knife.setVisible(false);
  }

  protected onDemoEnd() {
    this.knife.setVisible(true);
  }

  protected showHint() {
    this.knife.setVisible(false);
    super.showHint();
  }

  /** Mom helps: her knife hand cuts the rest, one stroke after another. */
  protected autoFinish() {
    this.held = false;
    this.knife.setVisible(false);
    const every = TUNING.help.chopEveryMs;
    const at = { x: 0, y: 0 };
    this.hand.follow('knife', () => at);
    const stroke = () => {
      if (this.finishing) return;
      const x = this.X(this.cutX(this.cutsDone + 1));
      const col = vegColumn(this.params.veg, this.cutX(this.cutsDone + 1));
      const top = this.Yf(col.top) - 50 * this.u;
      const bottom = this.Yf(col.bottom) - 30 * this.u;
      this.scene.tweens.addCounter({
        from: 0,
        to: 1,
        duration: every,
        onUpdate: (tw) => {
          const t = tw.getValue() ?? 0;
          // down in the first half, up in the second
          const f = t < 0.5 ? Phaser.Math.Easing.Quadratic.In(t * 2) : 1 - Phaser.Math.Easing.Sine.Out((t - 0.5) * 2);
          at.x = x;
          at.y = top + (bottom - top) * f;
        },
        onComplete: stroke,
      });
      this.scene.time.delayedCall(every / 2, () => this.cut());
    };
    stroke();
  }
}
