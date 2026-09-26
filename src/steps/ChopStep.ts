import Phaser from 'phaser';
import { ART } from '../core/assets';
import { countKey, lineMs, voice } from '../core/audio';
import { boing, burst } from '../core/fx';
import type { HandMotion } from '../core/hand';
import { sfx } from '../core/sfx';
import { TUNING } from '../core/tuning';
import { VEG, vegColumn } from '../core/vegArt';
import type { ChopParams } from '../recipes/types';
import { drawCutGuide, LineCut } from './lineCut';
import { Step } from './Step';
import { binKey, binsWaiting, fillBin, iconScale, makeBin, parkBin } from './ToppingBin';

/** The knife's size (x the board's own scale / 1.05; it is 0.9 in the art agent's scene, a little smaller so it fits above the vegetable). */
const KNIFE = 0.8;
/** A slice on the pile. */
const SLICE = 0.8;

/**
 * Chop (reusable: vegetables for a pizza or a salad, fruit, a cucumber...). The whole vegetable lies on the cutting
 * board in the middle; the knife waits upright just above the next cut line. The knife follows the finger by its
 * blade tip. Gameplay round 4: the cut follows the finger. While the knife is held the next cut line shows (dots and
 * arrows down); a stroke down along it (TUNING.cut: near it, roughly downwards) cuts into the vegetable as far as the
 * finger has come (a dark line), a stroke may stop and go on, and once it is `through` the body the slice comes off.
 * A stroke up, sideways or away from the line cuts nothing: the vegetable gives a small wobble (a miss). The code cuts
 * from right to left at one slice width inside the body (core/vegArt.ts), the cut face strip sits on the cut line
 * fitted to the body's profile (the mushroom shows only its cap outside the stem), a slice drops onto the pile, chop,
 * and Mom counts. After
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
  /** The next cut, following the finger; its dotted guide and the part already cut. */
  private line!: LineCut;
  private guide!: Phaser.GameObjects.Graphics;
  private cutG!: Phaser.GameObjects.Graphics;
  private last = { x: 0, y: 0 };
  /** Finger travel this touch that cut nothing (the wrong way, sideways, away from the line). */
  private wrongRun = 0;
  private wobbled = false;
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
    // The knife as in the scene, but never so tall that, resting above the vegetable, its handle leaves the screen.
    let highest = Infinity;
    for (let i = 1; i <= p.cuts; i++) highest = Math.min(highest, this.Yf(vegColumn(p.veg, this.cutX(i)).top) - 15 * u);
    const ks = Math.min(KNIFE * u, (highest - 12 * this.layout.k) / ART.prep.knifeTip.y);
    this.knife = this.own(this.scene.add.image(0, 0, p.knife).setOrigin(ART.prep.knifeTip.x / 240, ART.prep.knifeTip.y / 640).setScale(ks).setDepth(6));
    this.knife.setPosition(this.restPoint().x, this.restPoint().y);
    for (const o of [this.board, this.veg, this.knife]) o.setAlpha(0);
    this.scene.tweens.add({ targets: [this.board, this.veg], alpha: 1, duration: 400 });
    this.scene.tweens.add({ targets: this.knife, alpha: 1, delay: 250, duration: 300 });
    this.cutG = this.own(this.scene.add.graphics().setDepth(3.2));
    this.guide = this.own(this.scene.add.graphics().setDepth(5));
    this.nextLine();

    this.onDown((q) => {
      if (this.finishing || !this.inReach(q.worldX, q.worldY)) return;
      this.held = true;
      this.moved = 0;
      this.wrongRun = 0;
      this.wobbled = false;
      this.cutThisTouch = false;
      this.last = { x: q.worldX, y: q.worldY };
      this.scene.tweens.killTweensOf(this.knife);
      this.follow(q.worldX, q.worldY, true);
      this.showGuide(true);
      sfx(this.scene, 'tap', { volume: 0.5 });
      this.poke();
    });
    this.onMove((q) => {
      if (!this.held || this.finishing) return;
      const at = { x: q.worldX, y: q.worldY };
      const step = Phaser.Math.Distance.Between(this.last.x, this.last.y, at.x, at.y);
      this.moved += step;
      this.follow(at.x, at.y, false);
      const r = this.line.feed(this.last, at);
      this.last = at;
      if (r === 'cut') {
        this.cutThisTouch = true;
        this.poke();
        this.drawCutSoFar();
        if (this.line.progress >= TUNING.cut.through) this.cut();
      } else if (r === 'off' && this.inCutZone(at.x, at.y)) {
        // (Up again, to start the next stroke, is natural: only sideways, or down away from the line, is "not like that".)
        this.wrongRun += step;
        if (!this.wobbled && !this.cutThisTouch && this.wrongRun >= TUNING.cut.wobbleAfter * this.layout.k) {
          this.wobbled = true;
          this.wobble();
        }
      }
    });
    this.onUp((_q, cancelled) => {
      if (!this.held) return;
      this.held = false;
      // A tap on the vegetable without a stroke: it wiggles (a try; after 3 the hand shows the stroke).
      if (!cancelled && !this.cutThisTouch && this.moved < 10 && !this.finishing) this.wobble();
      if (!this.finishing) this.showGuide(false);
      this.restKnife();
    });
    this.setIdle(true);
  }

  /** A gentle "not like that": the vegetable wiggles (a miss; three in a row show Mom's hand). */
  private wobble() {
    this.miss();
    this.scene.tweens.add({ targets: this.veg, angle: { from: -2, to: 2 }, duration: 70, yoyo: true, repeat: 1, onComplete: () => this.veg.setAngle(0) });
  }

  /** The next cut line: from just above the body down through it, at the next cut. */
  private nextLine() {
    const x = this.cutX(Math.min(this.cutsDone + 1, this.params.cuts));
    const col = vegColumn(this.params.veg, x);
    this.line = new LineCut({ x: this.X(x), y: this.Yf(col.top) - 30 * this.u }, { x: this.X(x), y: this.Yf(col.bottom) }, this.bandW(), TUNING.cut.gap, TUNING.cut.angle);
    this.cutG?.clear();
  }

  /** The dotted line (and its arrows down) where the next cut goes: shown while the knife is held, or Mom shows it. */
  private showGuide(on: boolean) {
    if (!this.guide?.active) return;
    if (!on || this.finishing) return void this.guide.clear();
    drawCutGuide(this.guide, this.line.a, this.line.b, this.layout.k, true);
  }

  /** The cut so far: a dark line into the vegetable down to where the finger has come. */
  private drawCutSoFar() {
    const g = this.cutG;
    g.clear();
    const col = vegColumn(this.params.veg, this.cutX(this.cutsDone + 1));
    const top = this.Yf(col.top);
    const end = this.line.point();
    if (end.y <= top) return;
    const w = 5 * this.layout.k;
    g.lineStyle(w * 2, 0x3b2414, 0.25).lineBetween(end.x, top, end.x, end.y);
    g.lineStyle(w, 0x3b2414, 0.7).lineBetween(end.x, top, end.x, end.y);
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

  /** The knife tip under the finger; near the next cut line it glides onto it (elsewhere it stays where the finger is). */
  private follow(x: number, y: number, jump: boolean) {
    const target = Math.abs(x - this.line.a.x) <= this.bandW() ? this.line.a.x : x;
    const nx = jump ? target : this.knife.x + (target - this.knife.x) * 0.5;
    // (held high up, it stays low enough for its handle to stay on the screen)
    this.knife.setPosition(nx, Math.max(y, ART.prep.knifeTip.y * this.knife.scaleY + 8 * this.layout.k));
  }

  private bandW() {
    const [s0, s1] = this.span;
    return Math.max(TUNING.cut.minBand * this.layout.k, (s1 - s0) * this.vs * TUNING.cut.vegBand);
  }

  private cut() {
    if (this.cutsDone >= this.params.cuts) return;
    this.poke();
    this.hit();
    const i = ++this.cutsDone;
    this.cutG.clear();
    if (i < this.params.cuts) {
      this.nextLine();
      this.showGuide(this.held);
    } else this.showGuide(false);
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
      this.scene.tweens.add({ targets: [bin.getData('icon')], scale: iconScale(bin.getData('icon'), bs), duration: 300, ease: 'Back.easeOut' });
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
    this.showGuide(true);
  }

  protected onDemoEnd() {
    this.knife.setVisible(true);
    if (!this.held) this.showGuide(false);
  }

  protected showHint() {
    this.knife.setVisible(false);
    this.showGuide(true);
    super.showHint();
  }

  /**
   * Mom helps: her knife hand makes ONE cut down the line (gameplay round 4), then the knife is hers again (the next
   * help comes after the usual hint and wait, as in the puzzle).
   */
  protected autoFinish() {
    this.held = false;
    this.knife.setVisible(false);
    this.showGuide(true);
    const every = TUNING.help.chopEveryMs;
    const at = { x: 0, y: 0 };
    const stroke = () => {
      if (this.finishing || this.aborted) return;
      this.hand.follow('knife', () => at);
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
        onComplete: () => {
          if (this.finishing || this.aborted) return;
          this.hand.stop();
          this.knife.setVisible(true);
          this.showGuide(false);
          this.restKnife();
          this.resumeAfterAuto();
        },
      });
      this.scene.time.delayedCall(every / 2, () => !this.aborted && this.cut());
    };
    // Her stroke comes after "Let me help you!".
    this.scene.time.delayedCall(lineMs('vo-help'), stroke);
  }
}
