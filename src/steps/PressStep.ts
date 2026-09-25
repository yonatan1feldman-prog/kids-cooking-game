import Phaser from 'phaser';
import { ART } from '../core/assets';
import { boing, burst, puff } from '../core/fx';
import type { HandMotion } from '../core/hand';
import { sfx } from '../core/sfx';
import { TUNING } from '../core/tuning';
import type { PressParams } from '../recipes/types';
import { BOWL_DEPTH, PrepBowl } from './PrepBowl';
import { Step } from './Step';
import { binsWaiting, parkBin } from './ToppingBin';

/** Over the bowl: how the food is held (tilted, drops falling from its lower rim), x k. */
const OVER_ANGLE = 24;
const OVER_SIZE = 0.62;

/** Code-drawn stand-in for a missing dent image: a soft shadow ellipse. */
const DENT_FALLBACK = 'press-dent-drawn';
/** A warm tint on the dent (round 11: untinted it read as a grey smudge on the dough). */
const DENT_TINT = 0xf0b888;
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
 * `board`: the food lies on its own board where the cutting board stands (tearing the lettuce); `park` sends the result
 * to wait in the left column like a filled bin. `place: 'over-bowl'`: the food is held tilted over the bowl the step
 * before left and every press lets `drop`s fall into it (squeezing a lemon over the salad).
 */
export class PressStep extends Step<PressParams> {
  private food!: Phaser.GameObjects.Image;
  private next?: Phaser.GameObjects.Image;
  private bowl?: PrepBowl;
  /** 'over-bowl': the food is held over the bowl (not in it). */
  private over = false;
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
    if (this.params.place === 'over-bowl') {
      // Held tilted over the bowl the step before left (its contents stay); drops fall into it on every press.
      this.workspace('none');
      this.bowl = PrepBowl.take(this.ctx) ?? new PrepBowl(this.ctx, this.params.bowl!, null);
      this.over = true;
      const o = this.bowl.opening();
      this.scale = (this.params.overSize ?? OVER_SIZE) * this.k;
      this.at = { x: o.x - 60 * this.k, y: o.y - 230 * this.k };
      this.food = this.own(this.scene.add.image(this.at.x, this.at.y, first).setScale(0).setAngle(this.params.overAngle ?? OVER_ANGLE).setDepth(BOWL_DEPTH.front + 0.5));
      this.squashTween = this.scene.tweens.add({ targets: this.food, scale: this.scale, duration: 450, ease: 'Back.easeOut' });
    } else if (this.params.place === 'bowl') {
      this.workspace('aside');
      this.bowl = PrepBowl.take(this.ctx) ?? new PrepBowl(this.ctx, this.params.bowl!, first);
      this.bowl.setContents(first);
      this.food = this.bowl.contents;
      this.at = { x: S.prepBowl.x, y: S.prepBowl.y };
      this.scale = S.prepBowl.scale;
    } else if (this.params.board) {
      // On its own board (the lettuce on the cutting board), where the cutting board stands (the art agent's tear scene).
      this.workspace('none');
      const b = S.cutBoard;
      const u = b.scale / 1.05;
      this.own(this.scene.add.image(b.x, b.y, this.params.board).setScale(b.scale).setDepth(1.5));
      this.at = { x: b.x - 20 * u, y: b.y - 140 * u };
      this.scale = (this.params.size ?? 1.2) * u;
      this.food = this.own(this.scene.add.image(this.at.x, this.at.y, first).setScale(0).setDepth(2));
      this.squashTween = this.scene.tweens.add({ targets: this.food, scale: this.scale, duration: 450, ease: 'Back.easeOut' });
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
    const b = this.bowl && !this.over ? this.bowl.bounds() : this.food.getBounds();
    const pad = PRESS_PAD * this.k;
    return { x0: b.x - pad, y0: b.y - pad, x1: b.right + pad, y1: b.bottom + 10 * this.k };
  }

  /** Where a dent can show: on the food (in the bowl: inside its opening, above the front wall). */
  private dentPoint(x: number, y: number) {
    if (this.over) return this.dripPoint();
    if (this.bowl) return this.bowl.clampToOpening(x, y, 0.8);
    const b = this.food.getBounds();
    return { x: Phaser.Math.Clamp(x, b.x + b.width * 0.2, b.right - b.width * 0.2), y: Phaser.Math.Clamp(y, b.y + b.height * 0.3, b.bottom - b.height * 0.2) };
  }

  /** Over the bowl: the food's lower rim, where the drops fall from (turned with it). */
  private dripPoint() {
    const f = this.params.dropFrom ?? { x: ART.salad.lemonFace.x, y: ART.salad.lemonFace.y + 120 };
    const w = this.food.frame.realWidth;
    const h = this.food.frame.realHeight;
    const v = new Phaser.Math.Vector2((f.x - w / 2) * this.scale, (f.y - h / 2) * this.scale).rotate(Phaser.Math.DegToRad(this.food.angle));
    return { x: this.food.x + v.x, y: this.food.y + v.y };
  }

  /** Over the bowl: a few drops fall from the food into the bowl and melt in. */
  private drip(n: number) {
    const key = this.params.drop;
    if (!key || !this.bowl) return;
    const from = this.dripPoint();
    const o = this.bowl.opening();
    for (let i = 0; i < n; i++) {
      const d = this.scene.add.image(from.x + Phaser.Math.Between(-25, 25) * this.k, from.y, key).setScale(0.36 * this.k).setDepth(BOWL_DEPTH.front + 0.4);
      this.scene.tweens.add({
        targets: d,
        y: o.y + Phaser.Math.FloatBetween(-0.2, 0.4) * o.ry,
        duration: Phaser.Math.Between(320, 460),
        delay: i * 90,
        ease: 'Quad.easeIn',
        onComplete: () => this.scene.tweens.add({ targets: d, alpha: 0, scale: 0.2 * this.k, duration: 140, onComplete: () => d.destroy() }),
      });
    }
  }

  private ensureDentTexture() {
    if (!this.params.dent) return;
    if (this.scene.textures.exists(this.params.dent) || this.scene.textures.exists(DENT_FALLBACK)) return;
    const g = this.scene.make.graphics({}, false);
    for (let i = 6; i >= 1; i--) g.fillStyle(0x5b3a29, 0.07).fillEllipse(130, 70, 40 + i * 36, 20 + i * 18);
    g.generateTexture(DENT_FALLBACK, 260, 140);
    g.destroy();
  }

  private get dentKey() {
    const dent = this.params.dent;
    return dent && this.scene.textures.exists(dent) ? dent : DENT_FALLBACK;
  }

  /** One press: squash and spring back, a dent, bits flying, a squish; every few presses the next state. */
  private press(x: number, y: number) {
    this.poke();
    this.hit();
    this.squash();
    const d = this.dentPoint(x, y);
    if (this.params.dent) this.showDent(d.x, d.y);
    sfx(this.scene, this.params.sound, { minGapMs: 90 });
    if (this.over) this.drip(3);
    else if (this.bowl) burst(this.scene, d.x, d.y, { tint: this.params.splash, count: 6, size: 20 * this.k, speed: 380 * this.k, gravityY: 1100, lifespan: 600, depth: 8 });
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

  /** Dents on screen now (round 11: at most two, softer, so quick presses no longer pile up into a grey stain). */
  private dents: Phaser.GameObjects.Image[] = [];

  private showDent(x: number, y: number) {
    while (this.dents.length >= 2) this.dents.shift()?.destroy();
    const dent = this.scene.add.image(x, y, this.dentKey).setScale(1.3 * this.k).setAlpha(0).setTint(DENT_TINT);
    dent.setDepth(this.bowl ? this.bowl.contentsDepth + 0.1 : 2.1);
    this.dents.push(dent);
    this.scene.tweens.add({
      targets: dent, alpha: 0.5, duration: 80, yoyo: true, hold: 300,
      onComplete: () => { this.dents = this.dents.filter((d) => d !== dent); dent.destroy(); },
    });
  }

  /** The food changes to its next state (a crossfade with a little puff). The last state ends the step. */
  private advance() {
    const stages = this.params.stages;
    if (this.stage >= stages.length - 1) return;
    this.stage++;
    const key = stages[this.stage];
    if (this.bowl && !this.over) this.bowl.crossfade(key, 260);
    else {
      this.next?.destroy();
      const n = this.scene.add.image(this.food.x, this.food.y, key).setScale(this.scale).setAngle(this.food.angle).setDepth(this.food.depth).setAlpha(0);
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
    boing(this.scene, this.bowl && !this.over ? this.bowl.front : this.food, 0.06);
    if (this.over) this.drip(5);
    puff(this.scene, this.at.x, this.at.y, this.params.splash === 0xfff6e6 ? 0xfff6e6 : 0xffffff, 6, 110 * this.k);
    if (this.stage >= stages.length - 1) this.finish();
  }

  private finish() {
    this.busy = true;
    this.setIdle(false);
    this.hand.stop();
    this.scene.time.delayedCall(420, () => {
      if (this.over) {
        // The squeezed-out food goes (what it leaves lies on the contents: the yolk); the bowl stays for the next step.
        if (this.params.lands) {
          const d = this.dripPoint();
          const img = this.params.lands.key === 'yolk' ? undefined : this.scene.add.image(d.x, d.y, this.params.lands.key);
          const o = this.bowl!.addExtra(this.params.lands, img);
          if (!img) o.setPosition(d.x, d.y).setScale(0.2 * this.k);
          this.scene.tweens.add({ targets: this.food, alpha: 0, duration: 250 });
        }
        this.bowl!.keep();
        return this.complete();
      }
      if (this.bowl) {
        // The bowl stays in the middle for the next step (stir).
        this.bowl.keep();
        return this.complete();
      }
      // The result waits in the left column (or off screen) for a later step, like a filled bin.
      if (this.params.handoff && this.params.park) {
        const food = this.food;
        const index = binsWaiting(this.ctx);
        this.handOff(this.params.handoff, food);
        food.setDepth(20);
        // (sized like a full bin: the drawing has wide empty margins)
        return parkBin(this.ctx, food, index, () => this.complete(), (1.6 * 240) / food.frame.realWidth);
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
    const b = this.bowl && !this.over ? this.bowl.opening() : { x: this.at.x, y: this.at.y - 40 * this.k, rx: 180 * this.k, ry: 110 * this.k };
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
    const mark = this.params.dent ? { key: this.dentKey, scale: 1.3 * k } : undefined;
    return { kind: 'press', keys, mark, glow: this.bowl && !this.over ? this.bowl.opening() : this.at };
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
