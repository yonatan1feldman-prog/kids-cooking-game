import Phaser from 'phaser';
import { ART, IMAGES } from '../core/assets';
import { countKey, sizzleLoop, voice } from '../core/audio';
import { boing, burst } from '../core/fx';
import { tapMotion, type HandMotion } from '../core/hand';
import { sfx } from '../core/sfx';
import type { FlipParams } from '../recipes/types';
import { PrepBowl } from './PrepBowl';
import { Step } from './Step';

type Phase = 'knob' | 'ladle' | 'cook' | 'flip' | 'fly' | 'done';

/** How far the ladle tips over the pan while pouring (degrees), as in the art agent's pour scene. */
const LADLE_TILT = -40;
/** The ladle's scale (x k): the art agent's 0.7, a touch target of 280 x 450. */
const LADLE = 0.7;
/** A swipe starts this near the pan's disc (x its radius) and counts from this many units up (x k): short and forgiving. */
const SWIPE_REACH = 1.35;

/**
 * Pour and flip (reusable: pancakes, crepes, fritters, eggs in a pan; README-pancakes.md, ART.pancakes). The stove top
 * with the pan fills the middle, the ladle rests on the stove's right.
 * - knob (with `stove`): a tap on the knob turns it on (the lit knob, `stove.sound`), the flame ring comes up under the
 *   pan, `stove.line`.
 * - ladle: she drags the ladle over the pan and holds it there: it tips, batter streams down, the puddle grows through
 *   `puddles` for `pourMs` in all, the sizzle loop plays (`ladleLine` the first time). Let go: the ladle goes back.
 * - cook: `bubblesLine` the first time ("Wait for the bubbles!"); by itself, after `cookMs`, the bubbles show and
 *   `flipLine` ("Now flip it! Swipe up!", the first time); the sizzle goes on.
 * - flip: a swipe up anywhere on the pan, any length from `minSwipe`: the pancake flies up, turns over in the air and
 *   lands golden (whoosh; `flipDoneLine` after the first), then slides onto the stack in the left
 *   column (Mom counts `count-N`); `moreLine` and the next one, `count` in all.
 * Nothing burns, nothing can go wrong, nothing waits on time but the bubbles. The pancakes end on the big plate: it
 * becomes the recipe's board (`plate`) and the dish's base is a golden pancake on it (`golden` at `baseSize`), so
 * decorating, sharing (cut like the pizza) and the photo work as for the pizza.
 */
export class FlipStep extends Step<FlipParams> {
  private phase: Phase = 'ladle';
  private s = 1;
  private k = 1;
  private at = { x: 0, y: 0 };
  private stove!: Phaser.GameObjects.Image;
  private pan!: Phaser.GameObjects.Image;
  private knob?: Phaser.GameObjects.Image;
  private flame?: Phaser.GameObjects.Image;
  private ladle!: Phaser.GameObjects.Image;
  private ladleRest = { x: 0, y: 0 };
  private cake?: Phaser.GameObjects.Image;
  private held = false;
  private grab = { dx: 0, dy: 0 };
  private over = false;
  private poured = 0;
  private sinceDrop = 0;
  private cooked = 0;
  private swipeFrom: { x: number; y: number } | null = null;
  private made = 0;
  private stack: Phaser.GameObjects.Image[] = [];
  private helping = false;

  start() {
    const p = this.params;
    const S = this.ctx.stage;
    const A = ART.pancakes;
    const k = (this.k = this.layout.k);
    this.workspace('none');
    // (the bowl of batter the stirring left goes: the ladle is full)
    const bowl = PrepBowl.take(this.ctx);
    if (bowl) {
      const parts = bowl.parts;
      this.scene.tweens.add({ targets: parts, alpha: 0, duration: 300, onComplete: () => bowl.destroy() });
    }
    // The stove top on the left of the prep area (the pan's handle, on its right, stays clear of Mom's pointing hand and
    // Pipa), its bottom at the counter's front.
    const area = S.prepArea;
    const s = (this.s = Math.min(0.68 * k, ((area.x1 - area.x0) * 0.9) / 1200));
    const x0 = area.x0 + 10 * k;
    const y0 = this.layout.Y(1046) - 920 * s;
    this.at = { x: x0 + A.burner.x * s, y: y0 + A.burner.y * s };
    this.stove = this.own(this.scene.add.image(x0 + 600 * s, y0 + 460 * s, p.stove?.top ?? p.pan).setScale(s).setDepth(2));
    if (!p.stove) this.stove.setVisible(false);
    this.flame = p.stove ? this.own(this.scene.add.image(this.at.x, this.at.y, p.stove.flame).setScale(s * 0.6).setDepth(2.5).setAlpha(0)) : undefined;
    const [pw, ph] = IMAGES[p.pan].size;
    this.pan = this.own(this.scene.add.image(this.at.x + (pw / 2 - A.panCentre.x) * s, this.at.y + (ph / 2 - A.panCentre.y) * s, p.pan).setScale(s).setDepth(3));
    if (p.stove) {
      this.knob = this.own(this.scene.add.image(x0 + A.knob.x * s, y0 + A.knob.y * s, p.stove.knobOff).setScale(s).setDepth(3));
      this.phase = 'knob';
      this.stepLine = p.stove.line;
    } else this.stepLine = p.ladleLine;
    // The ladle rests on the stove's right, above the pan's handle.
    this.ladleRest = { x: x0 + 1040 * s, y: y0 + 190 * s };
    this.ladle = this.own(this.scene.add.image(this.ladleRest.x, this.ladleRest.y, p.ladle).setScale(LADLE * k).setAngle(-12).setDepth(6));
    for (const o of [this.stove, this.pan, this.ladle, ...(this.knob ? [this.knob] : [])]) {
      const y = o.y;
      o.setAlpha(0).setY(y + 80 * k);
      this.scene.tweens.add({ targets: o, alpha: 1, y, duration: 450, ease: 'Back.easeOut' });
    }

    this.onDown((q) => {
      const x = q.worldX;
      const y = q.worldY;
      if (this.phase === 'knob') {
        if (this.onKnob(x, y)) {
          this.hit();
          this.lightStove();
        } else this.miss();
        return;
      }
      if (this.phase === 'ladle') {
        const b = this.ladle.getBounds();
        const pad = 60 * k;
        if (x < b.x - pad || x > b.right + pad || y < b.y - pad || y > b.bottom + pad) return this.miss();
        this.held = true;
        this.grab = { dx: this.ladle.x - x, dy: this.ladle.y - y };
        this.scene.tweens.killTweensOf(this.ladle);
        this.ladle.setDepth(12);
        sfx(this.scene, 'tap');
        this.poke();
        return;
      }
      if (this.phase === 'flip') {
        if (this.onPan(x, y, SWIPE_REACH)) this.swipeFrom = { x, y };
        else this.miss();
      }
    });
    this.onMove((q) => {
      if (this.phase === 'ladle' && this.held) {
        this.ladle.setPosition(q.worldX + this.grab.dx, q.worldY + this.grab.dy);
        this.poke();
        this.setOver(this.onPan(this.pourPoint().x, this.pourPoint().y, 1.15));
        return;
      }
      if (this.phase === 'flip' && this.swipeFrom && this.swipeFrom.y - q.worldY >= this.params.minSwipe * k) {
        this.swipeFrom = null;
        this.hit();
        this.flip();
      }
    });
    this.onUp((_q, cancelled) => {
      if (this.swipeFrom && !cancelled) this.miss();
      this.swipeFrom = null;
      if (!this.held) return;
      this.held = false;
      this.putBack();
    });
    this.setIdle(true);
  }

  update(delta: number) {
    super.update(delta);
    if (this.phase === 'ladle' && this.over) this.pour(delta);
    if (this.phase === 'cook') {
      this.cooked += delta;
      if (this.cooked >= this.params.cookMs) this.bubbles();
    }
  }

  // ---------------------------------------------------------------- geometry

  private onKnob(x: number, y: number) {
    return !!this.knob && Phaser.Math.Distance.Between(x, y, this.knob.x, this.knob.y) < 170 * this.k;
  }

  /** Within the pan's disc (x f of its radius). */
  private onPan(x: number, y: number, f: number) {
    return Phaser.Math.Distance.Between(x, y, this.at.x, this.at.y) < ART.pancakes.panR * this.s * f;
  }

  /** The ladle's pouring point (its bowl's lip, turned with it). */
  private pourPoint() {
    const [w, h] = IMAGES[this.params.ladle].size;
    const sc = this.ladle.scaleX;
    const lip = ART.pancakes.ladlePour;
    const v = new Phaser.Math.Vector2((lip.x - w / 2) * sc, (lip.y - h / 2) * sc).rotate(Phaser.Math.DegToRad(this.ladle.angle));
    return { x: this.ladle.x + v.x, y: this.ladle.y + v.y };
  }

  /** Where the ladle is held to pour: its lip above the pan's middle, a little right. */
  private holdPoint() {
    const [w, h] = IMAGES[this.params.ladle].size;
    const sc = LADLE * this.k;
    const lip = ART.pancakes.ladlePour;
    const v = new Phaser.Math.Vector2((lip.x - w / 2) * sc, (lip.y - h / 2) * sc).rotate(Phaser.Math.DegToRad(LADLE_TILT));
    return { x: this.at.x + 40 * this.k - v.x, y: this.at.y - 230 * this.k - v.y };
  }

  // ---------------------------------------------------------------- phases

  /** The knob turns on: the lit knob, a click, the flame ring comes up under the pan. */
  private lightStove() {
    if (this.phase !== 'knob') return;
    const p = this.params.stove!;
    this.phase = 'ladle';
    this.hand.stop();
    this.poke();
    this.knob!.setTexture(p.knobOn);
    boing(this.scene, this.knob!, 0.12);
    sfx(this.scene, p.sound);
    this.scene.tweens.add({ targets: this.flame!, alpha: 1, scale: this.s, duration: 450, ease: 'Back.easeOut' });
    this.stepLine = this.params.ladleLine;
    voice.say(this.params.ladleLine, { valid: () => this.phase === 'ladle' && this.made === 0 && this.poured === 0, ttlMs: 5000 });
  }

  private setOver(on: boolean) {
    if (on === this.over) return;
    this.over = on;
    this.scene.tweens.add({ targets: this.ladle, angle: on ? LADLE_TILT : -12, duration: on ? 260 : 220, ease: 'Sine.easeInOut' });
    if (!on && this.poured === 0) sizzleLoop.stop();
  }

  private putBack() {
    this.setOver(false);
    sfx(this.scene, 'whoosh', { volume: 0.35 });
    this.scene.tweens.add({ targets: this.ladle, x: this.ladleRest.x, y: this.ladleRest.y, angle: -12, duration: 380, ease: 'Sine.easeOut', onComplete: () => this.ladle.setDepth(6) });
  }

  /** The batter streams down and the puddle in the pan grows through its pictures. */
  private pour(delta: number) {
    const p = this.params;
    if (!this.helping) this.poke();
    this.poured += delta;
    if (!sizzleLoop.on) sizzleLoop.start();
    this.sinceDrop += delta;
    const k = this.k;
    while (this.sinceDrop > 50) {
      this.sinceDrop -= 50;
      const m = this.pourPoint();
      const drop = this.scene.add.image(m.x, m.y, 'fx-dot').setTint(p.batterTint).setScale(0.55 * k).setDepth(5);
      this.scene.tweens.add({
        targets: drop,
        x: this.at.x + Phaser.Math.Between(-30, 30) * k,
        y: this.at.y + Phaser.Math.Between(-20, 20) * k,
        duration: 260,
        ease: 'Quad.easeIn',
        onComplete: () => drop.destroy(),
      });
    }
    const n = p.puddles.length;
    const i = Math.min(n - 1, Math.floor((this.poured / p.pourMs) * n));
    const key = p.puddles[i];
    if (!this.cake) {
      this.cake = this.own(this.scene.add.image(this.at.x, this.at.y, key).setScale(this.s * 0.6).setDepth(4));
      this.scene.tweens.add({ targets: this.cake, scale: this.s, duration: 400, ease: 'Sine.easeOut' });
    } else if (this.cake.texture.key !== key) {
      this.cake.setTexture(key);
      boing(this.scene, this.cake, 0.03);
    }
    if (this.poured < p.pourMs) return;
    // Poured: the ladle goes back, the pancake cooks.
    this.held = false;
    this.helping = false;
    this.hand.stop();
    this.hit();
    this.putBack();
    this.phase = 'cook';
    this.cooked = 0;
    this.setIdle(false);
    if (this.made === 0) voice.say(p.bubblesLine, { ttlMs: 4000 });
  }

  /** Bubbles: it is ready to flip. */
  private bubbles() {
    const p = this.params;
    this.phase = 'flip';
    this.cake?.setTexture(p.bubbles);
    boing(this.scene, this.cake!, 0.04);
    sfx(this.scene, 'pop', { volume: 0.5 });
    if (this.made === 0) voice.say(p.flipLine, { ttlMs: 6000 });
    this.stepLine = p.flipLine;
    this.setIdle(true);
  }

  /** Up it goes, turns over in the air and lands golden. */
  private flip() {
    if (this.phase !== 'flip' || !this.cake) return;
    const p = this.params;
    const cake = this.cake;
    const k = this.k;
    this.phase = 'fly';
    this.helping = false;
    this.hand.stop();
    this.poke();
    this.setIdle(false);
    sizzleLoop.stop();
    sfx(this.scene, p.flipSound);
    const y0 = cake.y;
    const top = y0 - 330 * k;
    // Up (thinning as it turns edge-on), the golden side comes round at the top, down with a little bounce.
    this.scene.tweens.add({ targets: cake, y: top, duration: 380, ease: 'Quad.easeOut' });
    this.scene.tweens.add({
      targets: cake,
      scaleY: this.s * 0.08,
      angle: -10,
      duration: 190,
      ease: 'Sine.easeIn',
      onComplete: () => {
        cake.setTexture(p.golden);
        this.scene.tweens.add({ targets: cake, scaleY: this.s, angle: 0, duration: 190, ease: 'Sine.easeOut' });
      },
    });
    this.scene.time.delayedCall(390, () => {
      if (this.aborted) return;
      this.scene.tweens.add({
        targets: cake,
        y: y0,
        duration: 380,
        ease: 'Bounce.easeOut',
        onComplete: () => {
          if (this.aborted) return;
          burst(this.scene, this.at.x, this.at.y, { count: 10, size: 16 * k, tint: [0xffe07a, 0xffffff], speed: 320 * k, gravityY: 600 });
          if (this.made === 0) voice.say(p.flipDoneLine, { ttlMs: 4000 });
          this.scene.time.delayedCall(450, () => !this.aborted && this.toStack());
        },
      });
    });
  }

  /** The golden pancake slides onto the stack (the left column; off to the left where there is none), Mom counts. */
  private toStack() {
    const p = this.params;
    const cake = this.cake!;
    this.cake = undefined;
    const S = this.ctx.stage;
    const k = this.k;
    const n = ++this.made;
    const spot = S.prepWide ? { x: S.aside.x, y: S.aside.y + 120 * k - n * 16 * k, s: 0.42 * k } : { x: -300 * k, y: cake.y, s: 0.6 * k };
    sfx(this.scene, 'whoosh', { volume: 0.4 });
    this.scene.tweens.add({
      targets: cake,
      x: spot.x,
      y: spot.y,
      scale: spot.s,
      duration: 550,
      ease: 'Sine.easeInOut',
      onComplete: () => {
        cake.setDepth(3 + n * 0.01);
        this.stack.push(cake);
        sfx(this.scene, 'pop', { volume: 0.5 });
        voice.say(countKey(n), { group: 'count', sequence: true, ttlMs: 5000 });
        if (n < p.count) {
          voice.say(p.moreLine, { ttlMs: 5000 });
          this.next();
        } else this.finish();
      },
    });
  }

  /** The next pancake: the ladle again. */
  private next() {
    this.phase = 'ladle';
    this.poured = 0;
    this.sinceDrop = 0;
    this.stepLine = null;
    this.setIdle(true);
  }

  /** All made: the stove goes off, the plate is the board from now on, a golden pancake on it is the dish's base. */
  private finish() {
    const p = this.params;
    this.phase = 'done';
    sizzleLoop.stop();
    this.setIdle(false);
    if (this.knob && p.stove) this.knob.setTexture(p.stove.knobOff);
    if (this.flame) this.scene.tweens.add({ targets: this.flame, alpha: 0, duration: 400 });
    const board = this.ctx.board;
    board.setTexture(p.plate).setVisible(true);
    this.dish.setBase(p.golden, p.baseSize);
    for (const c of this.stack) this.own(c);
    this.scene.time.delayedCall(700, () => !this.aborted && this.complete());
  }

  abort() {
    super.abort();
    sizzleLoop.stop();
  }

  cancelGesture() {
    super.cancelGesture();
    this.swipeFrom = null;
  }

  // ---------------------------------------------------------------- Mom

  /** Knob: her finger taps it. Ladle: her hand carries a see-through ladle over the pan and tips it. Flip: a swipe up. */
  protected demo(): HandMotion | null {
    const k = this.k;
    if (this.phase === 'knob' && this.knob) return tapMotion({ x: this.knob.x, y: this.knob.y }, k);
    if (this.phase === 'ladle') {
      const r = this.ladleRest;
      const hp = this.holdPoint();
      return {
        kind: 'grab',
        keys: [
          { x: r.x, y: r.y, t: 0 },
          { x: r.x, y: r.y, t: 350, press: true },
          { x: hp.x, y: hp.y, t: 1500 },
          { x: hp.x, y: hp.y, t: 2400 },
        ],
        props: [{ key: this.params.ladle, scale: this.ladle.scaleX, alpha: 0.55, angle: -12, endAngle: LADLE_TILT, turnFrom: 1300 }],
        glow: { x: r.x, y: r.y },
      };
    }
    if (this.phase === 'flip') {
      const a = this.at;
      return {
        kind: 'point',
        keys: [
          { x: a.x + 40 * k, y: a.y + 150 * k, t: 0 },
          { x: a.x, y: a.y + 60 * k, t: 400, press: true },
          { x: a.x, y: a.y - 180 * k, t: 900, press: true },
          { x: a.x + 40 * k, y: a.y - 200 * k, t: 1300 },
        ],
        glow: { x: a.x, y: a.y },
      };
    }
    return null;
  }

  /** Mom helps: she turns the knob, pours with the ladle, flips it; each pancake is then hers to finish or hers to do. */
  protected autoFinish() {
    if (this.held) this.putBack();
    this.held = false;
    if (this.phase === 'knob') {
      this.hand.play({ ...tapMotion({ x: this.knob!.x, y: this.knob!.y }, this.k), glow: undefined }, { onDone: () => this.lightStove() });
      this.resumeAfterAuto();
      return;
    }
    if (this.phase === 'ladle') {
      this.helping = true;
      const hp = this.holdPoint();
      this.hand.follow('grab', () => ({ x: this.ladle.x, y: this.ladle.y }));
      this.scene.tweens.killTweensOf(this.ladle);
      this.ladle.setDepth(12);
      this.scene.tweens.add({ targets: this.ladle, x: hp.x, y: hp.y, duration: 700, ease: 'Sine.easeInOut', onComplete: () => this.setOver(true) });
      this.resumeAfterAuto();
      return;
    }
    if (this.phase === 'flip') {
      const m = this.demo();
      if (m) this.hand.play({ ...m, glow: undefined }, { onDone: () => this.flip() });
      else this.flip();
      this.resumeAfterAuto();
    }
  }
}
