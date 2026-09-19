import Phaser from 'phaser';
import { ART } from '../core/assets';
import { voice, waterLoop } from '../core/audio';
import { boing, burst } from '../core/fx';
import { tapMotion, type HandMotion } from '../core/hand';
import { sfx } from '../core/sfx';
import { TUNING } from '../core/tuning';
import type { WashParams } from '../recipes/types';
import { Step } from './Step';

const WATER = [0x9fd8f5, 0xd8f1ff, 0x6fc3ea];
/** The tap's touch area reaches this far beyond its drawing (kept clear of the hands' area below it). */
export const FAUCET_PAD = 30;

/**
 * Washing hands, before any cooking: a sink in the middle, the tap on its back rim and the child's own
 * hands under it (their sleeves run off the bottom of the screen).
 *   1. tap: a tap on the tap opens the water (it runs in a loop, with its sound);
 *   2. rub: rubbing the hands with a finger grows bubbles on them, one per bit of rubbing ("Rub, rub, rub!"
 *      part-way through);
 *   3. rinse (by itself): the water washes the bubbles off, "All clean!", and the tap closes.
 * Any rubbing over the hands counts; nothing needs precision. The board is not shown (nothing on it yet).
 */
export class WashStep extends Step<WashParams> {
  private phase: 'tap' | 'rub' | 'rinse' = 'tap';
  private faucet!: Phaser.GameObjects.Image;
  private stream!: Phaser.GameObjects.Image;
  private hands!: Phaser.GameObjects.Image;
  private streamScaleY = 1;
  private handsX = 0;
  private bubbles: Phaser.GameObjects.Image[] = [];
  private rubbing = false;
  private last = { x: 0, y: 0 };
  private rubbed = 0;
  private k = 1;
  /** The water's outlet on the tap, and the palms (world). */
  private outlet = { x: 0, y: 0 };
  private palmL = { x: 0, y: 0 };
  private palmR = { x: 0, y: 0 };

  start() {
    this.stepLine = this.params.line;
    const S = this.ctx.stage;
    const k = (this.k = this.layout.k);
    const add = (x: number, y: number, key: string) => this.own(this.scene.add.image(x, y, key));
    this.workspace('none', 0);

    add(S.sink.x, S.sink.y, this.params.basin).setScale(S.sink.scale).setDepth(1);
    // The tap: its base (art x 120, y 372) on the sink's back rim.
    const fs = S.faucetScale;
    this.faucet = add(S.faucetBase.x, S.faucetBase.y, this.params.faucet).setScale(fs).setDepth(3);
    this.faucet.setOrigin(120 / 320, ART.prep.faucetBase / 400);
    this.outlet = { x: S.faucetBase.x + (ART.prep.faucetOut.x - 120) * fs, y: S.faucetBase.y + (ART.prep.faucetOut.y - ART.prep.faucetBase) * fs };

    // The child's hands under the outlet, bottom edge below the screen.
    const hs = S.kidHandsScale;
    this.handsX = this.outlet.x;
    this.hands = add(this.outlet.x, S.kidHandsBottom, this.params.hands).setScale(hs).setDepth(3.5).setOrigin(0.5, 1);
    const top = S.kidHandsBottom - 420 * hs;
    const palm = (p: { x: number; y: number }) => ({ x: this.outlet.x + (p.x - 300) * hs, y: top + p.y * hs });
    this.palmL = palm(ART.prep.kidPalmL);
    this.palmR = palm(ART.prep.kidPalmR);
    const tips = top + ART.prep.kidTips * hs;

    // The stream, from the outlet down to the fingertips (stretched vertically only). Hidden until she opens the tap.
    this.stream = add(this.outlet.x, this.outlet.y - 4 * k, this.params.stream).setOrigin(0.5, 0).setDepth(2);
    this.streamScaleY = (tips + 40 * k - (this.outlet.y - 4 * k)) / 420;
    this.stream.setScale(k, 0).setVisible(false);

    this.onDown((p) => {
      const x = p.worldX;
      const y = p.worldY;
      if (this.phase === 'rinse') return;
      if (this.onFaucet(x, y)) {
        if (this.phase === 'tap') this.open();
        else this.splash(this.outlet.x, this.outlet.y + 60 * k, 4);
        return;
      }
      if (!this.onHands(x, y)) return;
      if (this.phase === 'tap') {
        // Hands first: a little wiggle and a drip, and after 3 of these Mom shows the tap.
        boing(this.scene, this.hands, 0.05);
        sfx(this.scene, 'tap');
        this.splash(x, y, 3);
        this.miss();
        return;
      }
      this.rubbing = true;
      this.last = { x, y };
      sfx(this.scene, 'bubbles', { minGapMs: 250 });
      this.foam(x, y);
    });
    this.onMove((p) => {
      if (!this.rubbing || this.phase !== 'rub') return;
      const d = Phaser.Math.Distance.Between(this.last.x, this.last.y, p.worldX, p.worldY);
      this.last = { x: p.worldX, y: p.worldY };
      // The hands rub along with the finger, a little.
      this.hands.x = this.handsX + Phaser.Math.Clamp((p.worldX - this.handsX) * 0.05, -16 * k, 16 * k);
      if (!this.onHands(p.worldX, p.worldY)) return;
      this.rub(d, p.worldX, p.worldY);
    });
    this.onUp(() => {
      if (!this.rubbing) return;
      this.rubbing = false;
      this.scene.tweens.add({ targets: this.hands, x: this.handsX, duration: 200 });
    });

    this.scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => waterLoop.stop());
    this.setIdle(true);
  }

  private onFaucet(x: number, y: number) {
    const b = this.faucet.getBounds();
    const pad = FAUCET_PAD * this.k;
    return x > b.x - pad && x < b.right + pad && y > b.y - pad && y < b.bottom + pad;
  }

  private onHands(x: number, y: number) {
    const b = this.hands.getBounds();
    const pad = 50 * this.k;
    return x > b.x - pad && x < b.right + pad && y > b.y - pad;
  }

  private splash(x: number, y: number, n: number) {
    burst(this.scene, x, y, { tint: WATER, count: n, size: 18 * this.k, speed: 320 * this.k, gravityY: 900, lifespan: 500, depth: 6 });
  }

  /** Small bubbles fly up from the finger. */
  private foam(x: number, y: number) {
    burst(this.scene, x, y, { texture: this.params.bubble, count: 3, size: 46 * this.k, speed: 220 * this.k, gravityY: -300, lifespan: 700, depth: 6 });
  }

  /** The tap opens: the water runs down onto her hands. */
  private open() {
    if (this.phase !== 'tap') return;
    this.phase = 'rub';
    this.poke();
    this.hit();
    boing(this.scene, this.faucet, 0.08);
    sfx(this.scene, 'click');
    waterLoop.start();
    this.stream.setVisible(true).setScale(this.k, 0);
    this.scene.tweens.add({ targets: this.stream, scaleY: this.streamScaleY, duration: 350, ease: 'Quad.easeIn' });
    this.scene.time.delayedCall(300, () => this.splash(this.outlet.x, this.palmL.y - 60 * this.k, 8));
  }

  private rub(dist: number, x: number, y: number) {
    if (dist <= 0) return;
    this.poke();
    this.rubbed += dist;
    const per = this.params.rubPerBubble * this.k;
    if (this.rubbed >= per) {
      this.rubbed -= per;
      this.addBubble(x, y);
    } else if (Math.random() < dist / (140 * this.k)) this.foam(x, y);
  }

  /** A bubble grows on the hands near the finger (kept on the hands). */
  private addBubble(x: number, y: number) {
    const k = this.k;
    const left = this.palmL.x - 170 * k;
    const right = this.palmR.x + 170 * k;
    const bx = Phaser.Math.Clamp(x + Phaser.Math.FloatBetween(-70, 70) * k, left, right);
    const by = Phaser.Math.Clamp(y + Phaser.Math.FloatBetween(-80, 40) * k, this.palmL.y - 170 * k, this.palmL.y + 110 * k);
    const s = Phaser.Math.FloatBetween(0.34, 0.6) * k;
    const b = this.own(this.scene.add.image(bx, by, this.params.bubble).setDepth(4.5).setScale(0).setAngle(Phaser.Math.Between(-20, 20)));
    this.scene.tweens.add({ targets: b, scale: s, duration: 320, ease: 'Back.easeOut' });
    this.bubbles.push(b);
    sfx(this.scene, 'bubbles', { minGapMs: 250 });
    const n = this.bubbles.length;
    if (n === this.params.rubLineAt) voice.say(this.params.rubLine, { valid: () => this.phase === 'rub' });
    if (n >= this.params.bubbles) this.rinse();
  }

  /** The water washes the bubbles off, "All clean!", and the tap closes by itself. */
  private rinse() {
    if (this.phase === 'rinse') return;
    this.phase = 'rinse';
    this.rubbing = false;
    this.setIdle(false);
    this.hand.stop();
    const ms = this.params.rinseMs;
    this.bubbles.forEach((b, i) => {
      this.scene.tweens.add({
        targets: b,
        y: b.y + 220 * this.k,
        x: b.x + (this.outlet.x - b.x) * 0.3,
        alpha: 0,
        scale: b.scale * 0.6,
        delay: (i * ms * 0.5) / this.bubbles.length,
        duration: ms * 0.45,
        ease: 'Quad.easeIn',
      });
    });
    for (let i = 0; i < 4; i++) this.scene.time.delayedCall(i * 260, () => this.splash(this.outlet.x + Phaser.Math.Between(-60, 60) * this.k, this.palmL.y, 6));
    sfx(this.scene, 'bubbles');
    this.scene.tweens.add({ targets: this.hands, x: this.handsX, duration: 200 });
    let closed = false;
    const close = () => {
      if (closed || !this.stream.active) return;
      closed = true;
      waterLoop.stop();
      sfx(this.scene, 'click');
      boing(this.scene, this.faucet, 0.06);
      this.scene.tweens.add({ targets: this.stream, scaleY: 0, y: this.stream.y + 30 * this.k, alpha: 0, duration: 300, ease: 'Quad.easeIn' });
      this.scene.time.delayedCall(350, () => this.complete());
    };
    // The water runs a moment longer, then Mom says it is clean and the tap closes (then the praise).
    this.scene.time.delayedCall(ms, () => voice.say(this.params.doneLine, { ttlMs: 3000, done: close }));
    this.scene.time.delayedCall(ms + 3500, close);
  }

  /** The tap first (Mom's finger taps it), then rubbing (her finger rubs over the hands). */
  protected demo(): HandMotion {
    if (this.phase === 'tap') return tapMotion(this.tapPoint(), this.k);
    return this.rubMotion();
  }

  /** Mom taps the tap's handle (the blue knob at art (206, 313), right of its base). */
  private tapPoint() {
    const f = this.faucet;
    return { x: f.x + (206 - 120) * f.scaleX, y: f.y + (313 - ART.prep.faucetBase) * f.scaleY };
  }

  private rubMotion(): HandMotion {
    const k = this.k;
    const y = (this.palmL.y + this.palmR.y) / 2 - 20 * k;
    const keys = [0, 1, 2, 3, 4].map((i) => ({ x: i % 2 ? this.palmR.x + 40 * k : this.palmL.x - 40 * k, y: y + (i % 2 ? 30 : -10) * k, t: 250 + i * 420 }));
    keys.unshift({ ...keys[0], t: 0 });
    keys.push({ ...keys[keys.length - 1], t: 2300 });
    return { kind: 'point', keys, glow: { x: this.outlet.x, y } };
  }

  /** Mom helps: her finger opens the tap (if needed), then rubs until the bubbles are there. */
  protected autoFinish() {
    const k = this.k;
    const rubAll = () => {
      const t0 = this.scene.time.now;
      const y = this.palmL.y - 20 * k;
      const at = () => {
        const a = (this.scene.time.now - t0) / 180;
        return { x: this.outlet.x + Math.sin(a) * (this.palmR.x - this.palmL.x) * 0.7, y: y + Math.cos(a * 2) * 25 * k };
      };
      this.hand.follow('point', at);
      const left = this.params.bubbles - this.bubbles.length;
      const every = TUNING.help.rubMs / Math.max(1, left);
      for (let i = 0; i < left; i++) {
        this.scene.time.delayedCall((i + 1) * every, () => {
          if (this.phase !== 'rub') return;
          const p = at();
          this.foam(p.x, p.y);
          this.addBubble(p.x, p.y);
        });
      }
    };
    if (this.phase === 'tap') {
      this.hand.play(tapMotion(this.tapPoint(), k), { onDone: rubAll });
      this.scene.time.delayedCall(600, () => this.open());
    } else rubAll();
  }

  abort() {
    super.abort();
    waterLoop.stop();
  }
}
