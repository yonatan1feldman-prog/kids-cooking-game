import Phaser from 'phaser';
import { ART, IMAGES } from '../core/assets';
import { voice } from '../core/audio';
import { burst } from '../core/fx';
import type { HandMotion } from '../core/hand';
import { sfx } from '../core/sfx';
import { TUNING } from '../core/tuning';
import { VEG, vegColumn } from '../core/vegArt';
import type { PeelParams } from '../recipes/types';
import { Step } from './Step';

/** The peeler's size (x the board's own scale): a real tool in a hand, about as long as the carrot it works on. */
const PEELER = 1.05;
/** How much of the vegetable's body the peeler spans (it must look like a tool on it, not a second vegetable). */
const BODY_SHARE = 0.68;

/**
 * Peel (round 9, reusable: a carrot, a potato, anything with a skin). The vegetable lies on the cutting board in
 * exactly the place the `chop` step puts it, covered by a layer of peel (`skin`: the same viewBox as the whole
 * vegetable, drawn to sit on it pixel-exactly). The peeler follows the finger. Any stroke along the vegetable, in
 * either direction and of a forgiving length (`minSwipe` of travel), takes off the next strip: that band of the peel
 * layer disappears, a curl of peel flies off sideways, and the peeling sound plays. After `strips` strokes the
 * vegetable is clean, Mom says so, and the step ends.
 *
 * She cannot fail: there is no wrong direction, no wrong place along it, and no wrong speed. A tap without a stroke
 * only wobbles the vegetable. The hint (her hand stroking it) comes after the usual idle time, and Mom's help peels
 * the rest herself.
 */
export class PeelStep extends Step<PeelParams> {
  private board!: Phaser.GameObjects.Image;
  private veg!: Phaser.GameObjects.Image;
  private peeler!: Phaser.GameObjects.Image;
  /** One band of the peel layer each, left to right; removed one per stroke. */
  private bands: Phaser.GameObjects.Image[] = [];
  private done = 0;
  private held = false;
  private travel = 0;
  private last = { x: 0, y: 0 };
  private moved = 0;
  private finishing = false;
  /** Board scale / 1.05: the art agent's k for this scene (as in ChopStep). */
  private u = 1;
  private vs = 1;
  private vegLeft = 0;
  private vegTop = 0;
  /** The peeler's scale (its handle must stay on the screen above the vegetable). */
  private ps = 1;

  start() {
    const p = this.params;
    this.stepLine = p.line;
    const S = this.ctx.stage;
    this.workspace(S.prepWide ? 'aside' : 'none');
    const b = S.cutBoard;
    this.u = b.scale / 1.05;
    const u = this.u;
    this.board = this.own(this.scene.add.image(b.x, b.y, p.board).setScale(b.scale).setDepth(2));
    // Exactly where `chop` puts it, so the same vegetable visibly carries on from peeling to cutting.
    this.vs = u / 1.2;
    const [VW, VH] = VEG.size;
    this.vegLeft = b.x - 150 * u - (VW / 2) * this.vs;
    this.vegTop = b.y - 20 * u - (VH / 2) * this.vs;
    this.veg = this.own(this.scene.add.image(this.vegLeft, this.vegTop, p.whole).setOrigin(0, 0).setScale(this.vs).setDepth(3));

    // The peel, in `strips` bands over the body: each band is the same picture cropped to its own slice of it.
    const [s0, s1] = this.span;
    const w = (s1 - s0) / p.strips;
    for (let i = 0; i < p.strips; i++) {
      const band = this.own(this.scene.add.image(this.vegLeft, this.vegTop, p.skin).setOrigin(0, 0).setScale(this.vs).setDepth(4));
      // (the first and last bands keep the tips: the peel covers the whole body, not only the middle)
      const x = i === 0 ? 0 : s0 + i * w;
      const x1 = i === p.strips - 1 ? VW : s0 + (i + 1) * w;
      band.setCrop(x, 0, x1 - x, VH);
      this.bands.push(band);
    }

    // The peeler is held by its blade line, the way the knife is held by its tip: the blade rides on the vegetable's
    // upper surface and the grip stands 266 units above it (README-soup.md), where her hand would be.
    const [pw, ph] = IMAGES[p.peeler].size;
    const blade = ART.soup.peelerBlade;
    // Sized against the vegetable itself (about two thirds of its body), so it reads as a tool working on it and
    // never reaches past the board; and never so tall that its handle leaves the screen.
    const body = this.X(this.span[1]) - this.X(this.span[0]);
    const ps = Math.min(PEELER * u, (BODY_SHARE * body) / pw, (this.vegTop + vegColumn(p.veg, this.bandMid(0)).top * this.vs - 12 * this.layout.k) / blade.y);
    this.peeler = this.own(this.scene.add.image(0, 0, p.peeler).setOrigin(blade.x / pw, blade.y / ph).setScale(ps).setDepth(6));
    this.ps = ps;
    const r = this.restPoint();
    this.peeler.setPosition(r.x, r.y);
    for (const o of [this.board, this.veg, ...this.bands, this.peeler]) o.setAlpha(0);
    this.scene.tweens.add({ targets: [this.board, this.veg, ...this.bands], alpha: 1, duration: 400 });
    this.scene.tweens.add({ targets: this.peeler, alpha: 1, delay: 250, duration: 300 });

    this.onDown((q) => {
      if (this.finishing || !this.inReach(q.worldX, q.worldY)) return;
      this.held = true;
      this.travel = 0;
      this.moved = 0;
      this.last = { x: q.worldX, y: q.worldY };
      this.scene.tweens.killTweensOf(this.peeler);
      this.follow(q.worldX, q.worldY, true);
      sfx(this.scene, 'tap', { volume: 0.5 });
      this.poke();
    });
    this.onMove((q) => {
      if (!this.held || this.finishing) return;
      const d = Phaser.Math.Distance.Between(this.last.x, this.last.y, q.worldX, q.worldY);
      this.last = { x: q.worldX, y: q.worldY };
      this.moved += d;
      this.follow(q.worldX, q.worldY, false);
      // Only travel over the vegetable counts, in either direction: there is no wrong way to peel.
      if (!this.overVeg(q.worldX, q.worldY)) return;
      this.travel += d;
      if (this.travel >= this.params.minSwipe * this.layout.k) {
        this.travel = 0;
        this.strip(q.worldY);
      }
    });
    this.onUp((_q, cancelled) => {
      if (!this.held) return;
      this.held = false;
      this.travel = 0;
      // A tap with no stroke: the vegetable only wobbles (a try; after three of them the hand shows the stroke).
      if (!cancelled && this.moved < 10 && !this.finishing) {
        this.miss();
        this.scene.tweens.add({ targets: this.veg, angle: { from: -2, to: 2 }, duration: 70, yoyo: true, repeat: 1, onComplete: () => this.veg.setAngle(0) });
      }
      this.restPeeler();
    });
    this.setIdle(true);
  }

  private get span() {
    return VEG.span[this.params.veg];
  }

  /** File x -> world x, file y -> world y. */
  private X(fx: number) {
    return this.vegLeft + fx * this.vs;
  }

  private Yf(fy: number) {
    return this.vegTop + fy * this.vs;
  }

  /** The middle of the band that comes off next, in file units. */
  private bandMid(i: number) {
    const [s0, s1] = this.span;
    return s0 + ((s1 - s0) / this.params.strips) * (i + 0.5);
  }

  /** The peeler waits just above the next band, lying along the vegetable. */
  private restPoint() {
    const x = this.bandMid(Math.min(this.done, this.params.strips - 1));
    return { x: this.X(x), y: this.Yf(vegColumn(this.params.veg, x).top) };
  }

  private restPeeler() {
    if (!this.peeler.active) return;
    const r = this.restPoint();
    this.scene.tweens.add({ targets: this.peeler, x: r.x, y: r.y, duration: 280, ease: 'Sine.easeOut' });
  }

  /** Generously over the vegetable: its body plus a wide margin all round (small fingers wander). */
  peelZone() {
    const [s0, s1] = this.span;
    const u = this.u;
    return { x0: this.X(s0) - 140 * u, x1: this.X(s1) + 140 * u, y0: this.Yf(80) - 200 * u, y1: this.Yf(480) + 80 * u };
  }

  private overVeg(x: number, y: number) {
    const z = this.peelZone();
    return x > z.x0 && x < z.x1 && y > z.y0 && y < z.y1;
  }

  private inReach(x: number, y: number) {
    return this.overVeg(x, y) || this.peeler.getBounds().contains(x, y);
  }

  /** The peeler under the finger; over the vegetable it settles onto the skin's line. */
  private follow(x: number, y: number, jump: boolean) {
    const [s0, s1] = this.span;
    const fx = Phaser.Math.Clamp((x - this.vegLeft) / this.vs, s0, s1);
    const over = this.overVeg(x, y);
    // Over the vegetable the blade settles onto its upper surface; away from it the peeler follows the finger, but
    // never so high that its handle leaves the screen.
    const ty = over ? this.Yf(vegColumn(this.params.veg, fx).top) : y;
    const ny = jump ? ty : this.peeler.y + (ty - this.peeler.y) * 0.5;
    this.peeler.setPosition(x, Math.max(ny, ART.soup.peelerBlade.y * this.ps + 8 * this.layout.k));
  }

  /** One strip comes off: its band of peel goes, a curl flies away, the sound. */
  private strip(aroundY: number) {
    if (this.done >= this.params.strips || this.finishing) return;
    this.poke();
    const band = this.bands[this.done++];
    const mid = this.bandMid(this.done - 1);
    const at = { x: this.X(mid), y: this.Yf(vegColumn(this.params.veg, mid).top) + 10 * this.u };
    sfx(this.scene, this.params.sound);
    this.scene.tweens.add({ targets: band, alpha: 0, duration: 200, onComplete: () => band.destroy() });
    // The curl of peel flies off to the side the finger is on, turning as it goes, and fades.
    const up = aroundY < at.y;
    const curl = this.own(this.scene.add.image(at.x, at.y, this.params.strip).setScale(this.vs * 1.1).setDepth(7));
    this.scene.tweens.add({
      targets: curl,
      x: at.x + Phaser.Math.Between(90, 170) * this.u,
      y: at.y + (up ? -1 : 1) * Phaser.Math.Between(60, 130) * this.u,
      angle: Phaser.Math.Between(-140, 140),
      alpha: 0,
      scale: this.vs * 0.8,
      duration: 620,
      ease: 'Sine.easeOut',
      onComplete: () => curl.destroy(),
    });
    burst(this.scene, at.x, at.y, { count: 5, tint: this.params.splash ?? 0xffb74d, size: 26 * this.u });
    if (this.done >= this.params.strips) this.allPeeled();
  }

  /** Clean at last: a little hop, "All peeled!", and on to the next step. */
  private allPeeled() {
    this.finishing = true;
    this.held = false;
    this.setIdle(false);
    this.scene.tweens.add({ targets: this.peeler, alpha: 0, duration: 300 });
    this.scene.tweens.add({ targets: this.veg, y: this.vegTop - 14 * this.u, duration: 180, yoyo: true, ease: 'Quad.easeOut' });
    voice.say(this.params.doneLine, { ttlMs: 4000, valid: () => !this.aborted });
    this.scene.time.delayedCall(600, () => !this.aborted && this.complete());
  }

  /** Mom's hand takes a see-through peeler along the vegetable, once. */
  protected demo(): HandMotion | null {
    const i = Math.min(this.done, this.params.strips - 1);
    const mid = this.bandMid(i);
    const y = this.Yf(vegColumn(this.params.veg, mid).top) - 10 * this.u;
    const [s0, s1] = this.span;
    const x0 = this.X(Math.max(s0, mid - 120));
    const x1 = this.X(Math.min(s1, mid + 120));
    this.peeler.setVisible(false);
    return {
      kind: 'grab',
      size: 1,
      props: [{ key: this.params.peeler, scale: this.ps, alpha: 0.75, dy: -60 * this.ps }],
      keys: [
        { x: x0, y: y + 90 * this.u, t: 0 },
        { x: x0, y, t: 300 },
        { x: x1, y, t: 900 },
        { x: x0, y, t: 1500 },
        { x: x1, y, t: 2100 },
        { x: x1, y: y + 90 * this.u, t: 2400 },
      ],
      glow: { x: this.X(mid), y },
      onStop: () => this.peeler.active && !this.finishing && this.peeler.setVisible(true),
    };
  }

  protected onDemoStart() {
    this.peeler.setVisible(false);
  }

  protected onDemoEnd() {
    this.peeler.setVisible(true);
  }

  protected showHint() {
    this.peeler.setVisible(false);
    super.showHint();
  }

  /** Mom helps: her hand strokes along the vegetable and the strips come off one after another. */
  protected autoFinish() {
    this.held = false;
    this.peeler.setVisible(false);
    const every = TUNING.help.peelEveryMs;
    const at = { x: 0, y: 0 };
    this.hand.follow('grab', () => at, 1, [{ key: this.params.peeler, scale: this.ps, alpha: 0.75, dy: -60 * this.ps }]);
    const stroke = () => {
      if (this.finishing) return;
      const mid = this.bandMid(Math.min(this.done, this.params.strips - 1));
      const y = this.Yf(vegColumn(this.params.veg, mid).top) - 10 * this.u;
      const [s0, s1] = this.span;
      const x0 = this.X(Math.max(s0, mid - 110));
      const x1 = this.X(Math.min(s1, mid + 110));
      this.scene.tweens.addCounter({
        from: 0,
        to: 1,
        duration: every,
        onUpdate: (tw) => {
          const t = tw.getValue() ?? 0;
          at.x = x0 + (x1 - x0) * (t < 0.5 ? t * 2 : 2 - t * 2);
          at.y = y;
        },
        onComplete: stroke,
      });
      this.scene.time.delayedCall(every / 2, () => this.strip(y - 40 * this.u));
    };
    stroke();
  }
}
