import Phaser from 'phaser';
import { boing, burst, puff } from '../core/fx';
import type { HandMotion } from '../core/hand';
import { sfx } from '../core/sfx';
import { TUNING } from '../core/tuning';
import type { PressParams } from '../recipes/types';
import { PrepBowl } from './PrepBowl';
import { Step } from './Step';

/** Code-drawn stand-in for a missing dent image: a soft shadow ellipse. */
const DENT_FALLBACK = 'press-dent-drawn';
/** The press area reaches this far beyond the food (world units x k). */
const PRESS_PAD = 70;

/**
 * Press (knead the dough, crush the tomatoes, and later mash or squash anything): every press on the food
 * squashes it and lets it spring back, leaves a dent under the finger for a moment, throws a few bits
 * (flour, juice) and makes a squish. Every `pressesPerStage` presses the food changes to its next state
 * (`stages`). Where the finger lands on the food doesn't matter; holding or sliding doesn't count more
 * than one press. Mom's flat hand shows it (a real push down and up, with the dent).
 *
 * `place: 'board'`: the food sits on the board in the middle (the board is otherwise empty).
 * `place: 'bowl'`: the food is inside the big prep bowl in the middle, between its back and front layers;
 * the pizza waits small in the left column, and the bowl stays for the next step (stir).
 */
export class PressStep extends Step<PressParams> {
  private food!: Phaser.GameObjects.Image;
  private next?: Phaser.GameObjects.Image;
  private bowl?: PrepBowl;
  private stage = 0;
  private presses = 0;
  private busy = false;
  private k = 1;
  private scale = 1;
  private at = { x: 0, y: 0 };

  start() {
    this.stepLine = this.params.line;
    const S = this.ctx.stage;
    this.k = this.layout.k;
    const first = this.params.stages[0];
    if (this.params.place === 'bowl') {
      this.workspace('aside');
      this.bowl = PrepBowl.take(this.ctx) ?? new PrepBowl(this.ctx, this.params.bowl!, first);
      this.bowl.setContents(first);
      this.food = this.bowl.contents;
      this.at = { x: S.prepBowl.x, y: S.prepBowl.y };
      this.scale = S.prepBowl.scale;
    } else {
      this.workspace('dish');
      this.at = { x: S.kneadDough.x, y: S.kneadDough.y };
      this.scale = S.kneadDough.scale;
      this.food = this.own(this.scene.add.image(this.at.x, this.at.y, first).setScale(0).setDepth(2));
      this.squashTween = this.scene.tweens.add({ targets: this.food, scale: this.scale, duration: 450, ease: 'Back.easeOut' });
    }
    this.ensureDentTexture();

    this.onDown((p) => {
      if (this.busy) return;
      if (!this.onFood(p.worldX, p.worldY)) return;
      this.press(p.worldX, p.worldY);
    });
    this.setIdle(true);
  }

  /** The press area: the food's drawing, generously padded (in the bowl: the whole bowl). */
  private onFood(x: number, y: number) {
    const b = this.pressArea();
    return x > b.x0 && x < b.x1 && y > b.y0 && y < b.y1;
  }

  /** Padded on three sides; below, it stops at the drawing (the palm strip is close under the bowl). */
  pressArea() {
    const b = this.bowl ? this.bowl.bounds() : this.food.getBounds();
    const pad = PRESS_PAD * this.k;
    return { x0: b.x - pad, y0: b.y - pad, x1: b.right + pad, y1: b.bottom + 10 * this.k };
  }

  /** Where a dent can show: on the food (in the bowl: inside its opening, above the front wall). */
  private dentPoint(x: number, y: number) {
    if (this.bowl) return this.bowl.clampToOpening(x, y, 0.8);
    const b = this.food.getBounds();
    return { x: Phaser.Math.Clamp(x, b.x + b.width * 0.2, b.right - b.width * 0.2), y: Phaser.Math.Clamp(y, b.y + b.height * 0.3, b.bottom - b.height * 0.2) };
  }

  private ensureDentTexture() {
    if (this.scene.textures.exists(this.params.dent) || this.scene.textures.exists(DENT_FALLBACK)) return;
    const g = this.scene.make.graphics({}, false);
    for (let i = 6; i >= 1; i--) g.fillStyle(0x5b3a29, 0.07).fillEllipse(130, 70, 40 + i * 36, 20 + i * 18);
    g.generateTexture(DENT_FALLBACK, 260, 140);
    g.destroy();
  }

  private get dentKey() {
    return this.scene.textures.exists(this.params.dent) ? this.params.dent : DENT_FALLBACK;
  }

  /** One press: squash and spring back, a dent, bits flying, a squish; every few presses the next state. */
  private press(x: number, y: number) {
    this.poke();
    this.hit();
    this.squash();
    const d = this.dentPoint(x, y);
    this.showDent(d.x, d.y);
    sfx(this.scene, this.params.sound, { minGapMs: 90 });
    if (this.bowl) burst(this.scene, d.x, d.y, { tint: this.params.splash, count: 6, size: 20 * this.k, speed: 380 * this.k, gravityY: 1100, lifespan: 600, depth: 8 });
    else puff(this.scene, d.x, d.y + 20 * this.k, this.params.splash, 3, 70 * this.k);
    this.presses++;
    if (this.presses >= this.params.pressesPerStage) {
      this.presses = 0;
      this.advance();
    }
  }

  private squashTween?: Phaser.Tweens.Tween;

  /** The food squashes under the press and springs back (only its scale: an entry slide keeps going). */
  private squash() {
    const target = this.food;
    const s = this.scale;
    this.squashTween?.stop();
    target.setScale(s * 1.08, s * 0.86);
    this.squashTween = this.scene.tweens.add({ targets: target, scaleX: s, scaleY: s, duration: 420, ease: 'Elastic.easeOut', easeParams: [1.1, 0.45] });
  }

  private showDent(x: number, y: number) {
    const dent = this.scene.add.image(x, y, this.dentKey).setScale(1.3 * this.k).setAlpha(0);
    dent.setDepth(this.bowl ? this.bowl.contentsDepth + 0.1 : 2.1);
    this.scene.tweens.add({ targets: dent, alpha: 0.9, duration: 80, yoyo: true, hold: 350, onComplete: () => dent.destroy() });
  }

  /** The food changes to its next state (a crossfade with a little puff). The last state ends the step. */
  private advance() {
    const stages = this.params.stages;
    if (this.stage >= stages.length - 1) return;
    this.stage++;
    const key = stages[this.stage];
    if (this.bowl) this.bowl.crossfade(key, 260);
    else {
      this.next?.destroy();
      const n = this.scene.add.image(this.food.x, this.food.y, key).setScale(this.scale).setDepth(2).setAlpha(0);
      this.next = n;
      this.scene.tweens.add({
        targets: n,
        alpha: 1,
        duration: 260,
        onComplete: () => {
          const old = this.food;
          this.food = this.own(n);
          this.next = undefined;
          old.destroy();
        },
      });
    }
    boing(this.scene, this.bowl ? this.bowl.front : this.food, 0.06);
    puff(this.scene, this.at.x, this.at.y, this.params.splash === 0xfff6e6 ? 0xfff6e6 : 0xffffff, 6, 110 * this.k);
    if (this.stage >= stages.length - 1) this.finish();
  }

  private finish() {
    this.busy = true;
    this.setIdle(false);
    this.hand.stop();
    this.scene.time.delayedCall(420, () => {
      if (this.bowl) {
        // The bowl stays in the middle for the next step (stir).
        this.bowl.keep();
        return this.complete();
      }
      // The result is left for the next step (e.g. the dough ball for rolling), shrinking to its size there.
      if (this.params.handoff) {
        const food = this.food;
        this.handOff(this.params.handoff, food);
        const home = this.ctx.stage.dishHome;
        this.scene.tweens.add({ targets: food, x: home.x, y: home.y, scale: this.k, duration: 380, ease: 'Sine.easeInOut' });
        this.scene.time.delayedCall(400, () => this.complete());
      } else this.complete();
    });
  }

  /** Where Mom's palm presses (on the food, a little left of centre so the dent shows beside her hand). */
  private pressSpot(i: number) {
    const spots = [
      [-0.12, -0.05],
      [0.1, 0.02],
      [-0.02, 0.08],
    ];
    const [sx, sy] = spots[i % spots.length];
    const b = this.bowl ? this.bowl.opening() : { x: this.at.x, y: this.at.y - 40 * this.k, rx: 180 * this.k, ry: 110 * this.k };
    return { x: b.x + sx * b.rx * 2, y: b.y + sy * b.ry * 2 };
  }

  /** Mom's flat hand pushes down on the food and comes back up, twice (a dent under it while it is down). */
  private pressMotion(times: number, t0 = 150, every = 900): HandMotion {
    const k = this.k;
    const lift = 34 * k; // the hand is drawn this much lower while pressing (hand.ts)
    const keys: { x: number; y: number; t: number; press?: boolean }[] = [];
    for (let i = 0; i < times; i++) {
      const p = this.pressSpot(i);
      const t = t0 + i * every;
      keys.push({ x: p.x + 20 * k, y: p.y - lift - 40 * k, t });
      keys.push({ x: p.x, y: p.y - lift, t: t + every * 0.35 });
      keys.push({ x: p.x, y: p.y - lift, t: t + every * 0.55, press: true });
      keys.push({ x: p.x, y: p.y - lift, t: t + every * 0.8 });
    }
    keys.unshift({ ...keys[0], t: 0 });
    keys.push({ ...keys[keys.length - 1], t: keys[keys.length - 1].t + 250 });
    // (The dent is drawn centred on its hollow: ART.prep.dentCentre is the middle of its frame, less 4.)
    return { kind: 'press', keys, mark: { key: this.dentKey, scale: 1.3 * k }, glow: this.bowl ? this.bowl.opening() : this.at };
  }

  protected demo(): HandMotion {
    return this.pressMotion(2, 150, 1050);
  }

  /** Mom helps: her hand presses at a steady pace until the food is done; every press counts like hers. */
  protected autoFinish() {
    const stages = this.params.stages.length - 1;
    const left = (stages - this.stage) * this.params.pressesPerStage - this.presses;
    const every = TUNING.help.pressEveryMs;
    const m = this.pressMotion(Math.max(1, left), 100, every);
    this.hand.play(m);
    for (let i = 0; i < left; i++) {
      this.scene.time.delayedCall(100 + i * every + every * 0.55, () => {
        const p = this.pressSpot(i);
        this.press(p.x, p.y);
      });
    }
  }
}
