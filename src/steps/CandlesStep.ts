import Phaser from 'phaser';
import { ART, IMAGES } from '../core/assets';
import { countKey, voice } from '../core/audio';
import { boing, stars } from '../core/fx';
import { tapMotion, type HandMotion } from '../core/hand';
import { sfx } from '../core/sfx';
import { TUNING } from '../core/tuning';
import type { CandlesParams } from '../recipes/types';
import { clampToRadius, MADE_KEY, snapshotTexture } from './Dish';
import { Step } from './Step';

/** How far from the cake's middle a candle may stand: inside the frosting field (290 of the cake art's 334). */
const PLACE_R = 0.86;
/** A flame's touch area, in world units at k = 1 (much bigger than the flame itself: small fingers aim roughly). */
const FLAME_TOUCH = 110;

interface Candle {
  img: Phaser.GameObjects.Image;
  flame?: Phaser.GameObjects.Image;
  /** Where it stands, in the dish's own frame. */
  at: { x: number; y: number };
  lit: boolean;
}

/**
 * Candles (round 9, reusable: a birthday cake, a cupcake, anything with candles on it). Three little parts, and
 * she cannot fail in any of them.
 *
 * 1. `place`: `count` candles wait in the left column. She drags each one onto the cake and puts it down wherever she
 *    likes inside it (`PLACE_R` of the radius, so it never hangs off the edge); Mom counts each one (`count-N`).
 * 2. `light`: when they are all standing, Mom lights them all at once: a flame comes up on every candle, `lightSound`.
 *    Then `wishLine` ("Make a wish and blow out the candles!").
 * 3. `blow`: a tap on a flame, or a finger drawn across the flames, puts them out one by one, each with a puff of
 *    smoke and `blowSound`. When the last one is out: `doneLine`, the jingle and a shower of stars.
 *
 * The hint is Mom's hand doing the current part; her help finishes it. The photo the finale shows is taken while the
 * candles are still lit, before this step blows them out (the recipe's `share` step gets the cake without them).
 */
export class CandlesStep extends Step<CandlesParams> {
  private phase: 'place' | 'light' | 'blow' = 'place';
  private waiting: Phaser.GameObjects.Image[] = [];
  private placed: Candle[] = [];
  private held: { img: Phaser.GameObjects.Image; dx: number; dy: number } | null = null;
  private finishing = false;
  private k = 1;
  private cs = 1;

  start() {
    this.stepLine = this.params.line;
    this.k = this.layout.k;
    this.workspace('dish');
    const S = this.ctx.stage;
    const n = this.params.count;
    // Sized from the cake, not from the column it waits in: `size` is the share of the cake's own scale the art
    // asks for (README-cake.md: 0.62), and the cake fills the dish.
    this.cs = ((this.dish.R * this.dish.scaleX) / ART.cake.cakeRadius) * this.params.size;
    for (let i = 0; i < n; i++) {
      const at = S.bin(i, n);
      const c = this.own(this.scene.add.image(at.x, at.y, this.params.candle).setScale(this.cs).setDepth(20));
      c.setAlpha(0);
      this.scene.tweens.add({ targets: c, alpha: 1, duration: 300, delay: 60 * i });
      this.waiting.push(c);
    }

    this.onDown((q) => {
      if (this.finishing) return;
      if (this.phase === 'place') {
        const c = this.waiting.find((o) => o.getBounds().contains(q.worldX, q.worldY));
        if (!c) return this.miss();
        this.held = { img: c, dx: c.x - q.worldX, dy: c.y - q.worldY };
        c.setDepth(60);
        this.scene.tweens.add({ targets: c, scale: this.cs * 1.12, duration: 120 });
        sfx(this.scene, 'tap', { volume: 0.5 });
        this.poke();
        return;
      }
      if (this.phase === 'blow') this.blowAt(q.worldX, q.worldY);
    });
    this.onMove((q) => {
      if (this.finishing) return;
      if (this.held) {
        this.held.img.setPosition(q.worldX + this.held.dx, q.worldY + this.held.dy);
        return;
      }
      // Drawn across the flames: every flame the finger passes goes out (a child blows by sweeping, too).
      if (this.phase === 'blow') this.blowAt(q.worldX, q.worldY);
    });
    this.onUp((_q, cancelled) => {
      const h = this.held;
      if (!h) return;
      this.held = null;
      this.scene.tweens.add({ targets: h.img, scale: this.cs, duration: 120 });
      if (cancelled || this.dish.reach(h.img.x, h.img.y) > 1.35) return this.putBack(h.img);
      this.stand(h.img);
    });
    this.setIdle(true);
  }

  /** Dropped away from the cake: it goes back to its place in the column, gently (never a failure). */
  private putBack(img: Phaser.GameObjects.Image) {
    const i = this.waiting.indexOf(img);
    const at = this.ctx.stage.bin(Math.max(0, i), this.params.count);
    img.setDepth(20);
    this.scene.tweens.add({ targets: img, x: at.x, y: at.y, duration: 280, ease: 'Sine.easeOut' });
    this.miss();
  }

  /** A candle is stood up where she let it go, inside the cake; Mom counts it. */
  private stand(img: Phaser.GameObjects.Image) {
    const i = this.waiting.indexOf(img);
    if (i >= 0) this.waiting.splice(i, 1);
    const local = clampToRadius(this.dish.toLocal(img.x, img.y), this.dish.R * PLACE_R);
    const w = this.dish.toWorld(local.x, local.y);
    const base = ART.cake.candleBase;
    const [cw, ch] = this.params.candleFrame;
    // It stands ON the cake: its base anchor lands on the spot, so it looks planted, not lying on top.
    img.setOrigin(base.x / cw, base.y / ch).setPosition(w.x, w.y);
    img.setDepth(60 + this.placed.length * 0.01);
    boing(this.scene, img, 0.14);
    sfx(this.scene, 'pop');
    this.placed.push({ img, at: local, lit: false });
    this.poke();
    this.hit();
    voice.say(countKey(this.placed.length), { group: 'count', sequence: true, ttlMs: 2500 });
    if (!this.waiting.length) this.scene.time.delayedCall(700, () => this.light());
  }

  /** Mom lights them all at once: a flame on every candle, one whoosh, then the wish. */
  private light() {
    if (this.phase !== 'place' || this.aborted) return;
    this.phase = 'light';
    this.setIdle(false);
    this.hand.stop();
    sfx(this.scene, this.params.lightSound);
    this.placed.forEach((c, i) => {
      const at = this.flameAt(c);
      const foot = ART.cake.flameFoot;
      const [fw, fh] = IMAGES[this.params.flame].size;
      const f = this.own(
        this.scene.add.image(at.x, at.y, this.params.flame).setOrigin(foot.x / fw, foot.y / fh).setScale(0).setDepth(c.img.depth + 0.005),
      );
      c.flame = f;
      c.lit = true;
      this.scene.tweens.add({ targets: f, scale: this.cs, duration: 260, delay: 70 * i, ease: 'Back.easeOut' });
    });
    // The picture the finale shows is taken NOW, with the candles still burning (afterwards they are blown out and
    // the cake is cut, so this is the only moment it exists).
    this.scene.time.delayedCall(420, () => !this.aborted && this.keepPicture());
    this.scene.time.delayedCall(500, () => {
      if (this.aborted) return;
      this.phase = 'blow';
      this.setIdle(true);
      this.poke();
      voice.say(this.params.wishLine, { ttlMs: 6000, valid: () => !this.aborted });
    });
  }

  /**
   * The cake with its lit candles, drawn into one texture for the `photo` step (`PhotoParams.madeKey`). The cake
   * itself was already captured by the decorating step (MADE_KEY), so only the candles and flames are added to it.
   */
  private keepPicture() {
    const key = this.params.capture;
    if (!key || !this.scene.textures.exists(MADE_KEY)) return;
    try {
      const cake = new Phaser.GameObjects.Image(this.scene, 0, 0, MADE_KEY);
      const size = Math.max(cake.frame.realWidth, cake.frame.realHeight);
      const objs: Phaser.GameObjects.GameObject[] = [cake];
      // The candles sit around the dish's centre; the capture is in the same game pixels the dish is drawn in.
      for (const c of this.placed) {
        const o = new Phaser.GameObjects.Image(this.scene, c.img.x - this.dish.x, c.img.y - this.dish.y, this.params.candle);
        o.setOrigin(c.img.originX, c.img.originY).setScale(this.cs);
        objs.push(o);
        if (!c.flame) continue;
        const f = new Phaser.GameObjects.Image(this.scene, c.flame.x - this.dish.x, c.flame.y - this.dish.y, this.params.flame);
        f.setScale(this.cs);
        objs.push(f);
      }
      void snapshotTexture(this.scene, key, Math.ceil(size * 1.35), objs);
    } catch (err) {
      console.warn('[candles] could not keep the picture', err);
    }
  }

  /** The wick tip of a standing candle, in world coordinates (its flame and its smoke stand on it). */
  private flameAt(c: Candle) {
    const tip = ART.cake.candleFlame;
    const base = ART.cake.candleBase;
    return { x: c.img.x + (tip.x - base.x) * this.cs, y: c.img.y + (tip.y - base.y) * this.cs };
  }

  /** Puts out the nearest lit flame under the finger (generously). */
  private blowAt(x: number, y: number) {
    if (this.phase !== 'blow' || this.finishing) return;
    const r = FLAME_TOUCH * this.k;
    let best: Candle | null = null;
    let bd = r;
    for (const c of this.placed) {
      if (!c.lit || !c.flame) continue;
      const d = Phaser.Math.Distance.Between(x, y, c.flame.x, c.flame.y);
      if (d < bd) {
        bd = d;
        best = c;
      }
    }
    if (!best) return;
    this.blowOut(best);
  }

  /** One flame goes out: it shrinks away, a wisp of smoke rises, the soft puff sounds. */
  private blowOut(c: Candle) {
    c.lit = false;
    this.poke();
    this.hit();
    sfx(this.scene, this.params.blowSound, { minGapMs: 90 });
    const f = c.flame;
    if (f) {
      this.scene.tweens.add({ targets: f, scale: 0, alpha: 0, duration: 200, onComplete: () => f.destroy() });
      const foot = ART.cake.smokeFoot;
      const [sw, sh] = IMAGES[this.params.smoke].size;
      const at = this.flameAt(c);
      const s = this.own(
        this.scene.add.image(at.x, at.y, this.params.smoke).setOrigin(foot.x / sw, foot.y / sh).setScale(this.cs * 0.8).setAlpha(0.9).setDepth(f.depth + 0.01),
      );
      this.scene.tweens.add({ targets: s, y: s.y - 150 * this.k, alpha: 0, scale: this.cs * 1.2, duration: 900, ease: 'Sine.easeOut', onComplete: () => s.destroy() });
    }
    const left = this.placed.filter((o) => o.lit).length;
    if (!left) return this.allOut();
    // Half way, once: "Keep blowing!" (only if she stopped, so it never nags).
    if (this.params.moreLine && left === Math.floor(this.params.count / 2) && !this.ctx.run.once.has(this.params.moreLine)) {
      this.ctx.run.once.add(this.params.moreLine);
      voice.say(this.params.moreLine, { ttlMs: 3000, valid: () => !this.aborted && this.phase === 'blow' });
    }
  }

  /** All out: "Yay! Happy birthday!", the jingle and a shower of stars, then on to sharing. */
  private allOut() {
    if (this.finishing) return;
    this.finishing = true;
    this.setIdle(false);
    this.hand.stop();
    // (Mom stays where she is: her celebrate sway reaches past the right edge on 20:9, and this is not the finale)
    this.ctx.mom.happy();
    this.ctx.character.setMood('party');
    sfx(this.scene, 'cheer-jingle');
    stars(this.scene, this.dish.x, this.dish.y - this.dish.R * 0.3, 14, 80 * this.k);
    voice.say(this.params.doneLine, { ttlMs: 5000, valid: () => !this.aborted });
    // The candles come off before the cake is cut (they are not eaten).
    this.scene.time.delayedCall(900, () => {
      if (this.aborted) return;
      this.scene.tweens.add({ targets: this.placed.map((c) => c.img), alpha: 0, duration: 400 });
      this.scene.time.delayedCall(500, () => !this.aborted && this.complete());
    });
  }

  /** Mom shows the part she is on: carrying a candle over, or tapping a flame out. */
  protected demo(): HandMotion | null {
    if (this.phase === 'place') {
      const from = this.waiting[0];
      if (!from) return null;
      const to = { x: this.dish.x + this.dish.R * 0.25 * this.dish.scaleX, y: this.dish.y - this.dish.R * 0.2 * this.dish.scaleX };
      return {
        kind: 'grab',
        props: [{ key: this.params.candle, scale: this.cs, alpha: 0.75 }],
        keys: [
          { x: from.x, y: from.y + 60 * this.k, t: 0 },
          { x: from.x, y: from.y, t: 350 },
          { x: (from.x + to.x) / 2, y: to.y - 90 * this.k, t: 1100 },
          { x: to.x, y: to.y, t: 1800 },
          { x: to.x, y: to.y + 70 * this.k, t: 2200 },
        ],
        glow: { x: from.x, y: from.y },
      };
    }
    if (this.phase === 'blow') {
      const c = this.placed.find((o) => o.lit && o.flame);
      if (c?.flame) return tapMotion({ x: c.flame.x, y: c.flame.y }, this.k);
    }
    return null;
  }

  /** Mom helps: she stands the rest of the candles up, or puts the rest of the flames out, one after another. */
  protected autoFinish() {
    const every = TUNING.help.candleEveryMs;
    if (this.phase === 'place') {
      const at = { x: 0, y: 0 };
      this.hand.follow('grab', () => at, 1, [{ key: this.params.candle, scale: this.cs, alpha: 0.75 }]);
      const one = () => {
        const img = this.waiting[0];
        if (!img || this.finishing) return;
        const a = this.placed.length * 1.9;
        const rr = this.dish.R * PLACE_R * this.dish.scaleX * (0.35 + 0.35 * ((this.placed.length % 3) / 2));
        const to = { x: this.dish.x + Math.cos(a) * rr, y: this.dish.y + Math.sin(a) * rr };
        const from = { x: img.x, y: img.y };
        this.scene.tweens.addCounter({
          from: 0,
          to: 1,
          duration: every,
          onUpdate: (tw) => {
            const t = tw.getValue() ?? 0;
            at.x = Phaser.Math.Linear(from.x, to.x, t);
            at.y = Phaser.Math.Linear(from.y, to.y, t) - Math.sin(t * Math.PI) * 80 * this.k;
            img.setPosition(at.x, at.y);
          },
          onComplete: () => {
            this.stand(img);
            if (this.waiting.length) this.scene.time.delayedCall(180, one);
          },
        });
      };
      one();
      return;
    }
    // Blowing: her pointing hand goes from flame to flame.
    const at = { x: 0, y: 0 };
    this.hand.follow('point', () => at);
    const one = () => {
      const c = this.placed.find((o) => o.lit && o.flame);
      if (!c?.flame || this.finishing) return;
      const to = { x: c.flame.x, y: c.flame.y };
      const from = { x: at.x || to.x, y: at.y || to.y + 120 * this.k };
      this.scene.tweens.addCounter({
        from: 0,
        to: 1,
        duration: every,
        onUpdate: (tw) => {
          const t = tw.getValue() ?? 0;
          at.x = Phaser.Math.Linear(from.x, to.x, t);
          at.y = Phaser.Math.Linear(from.y, to.y, t);
        },
        onComplete: () => {
          this.blowOut(c);
          if (!this.finishing) this.scene.time.delayedCall(140, one);
        },
      });
    };
    one();
  }
}