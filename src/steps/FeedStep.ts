import Phaser from 'phaser';
import { boing, burst, stars } from '../core/fx';
import { sfx, sfxThen } from '../core/sfx';
import type { FeedParams } from '../recipes/types';
import type { Mood } from './Character';
import { cutSlices, stockSlices, type SliceDef } from './slices';
import { Step } from './Step';

interface Slice {
  img: Phaser.GameObjects.Image;
  def: SliceDef;
  home: { x: number; y: number };
  eaten: boolean;
}

/** A carried slice is shown a little bigger. */
const LIFT = 1.08;
/** Slices spread apart a little so the cuts show. */
const EXPLODE = 12;

/**
 * Feeding: the child's own pizza is cut into slices on the board; drag each slice to
 * the character's mouth (she stands on the right, core of RecipeScene). When a slice comes
 * near it looks surprised and opens wide; it chews for about a second, happy. It always
 * eats everything. After the last slice: jingle, cheer, a star party, then home.
 */
export class FeedStep extends Step<FeedParams> {
  private slices: Slice[] = [];
  private held?: { s: Slice };
  private chewing = 0;
  private busy = 0;
  private partyStarted = false;
  private sliceScale = 1;
  private k = 1;

  start() {
    this.k = this.layout.k;
    this.buildSlices();

    this.onDown((p) => {
      if (this.held) return;
      const s = this.sliceAt(p.worldX, p.worldY);
      if (!s) return;
      this.poke();
      sfx(this.scene, 'tap');
      this.scene.tweens.killTweensOf(s.img);
      s.img.setDepth(30);
      // Lift it: the middle of the slice under the finger, the tip pointing at the mouth.
      const pose = this.carryPose(s, p.worldX, p.worldY);
      const angle = s.img.angle + Phaser.Math.Angle.ShortestBetween(s.img.angle, pose.angle);
      this.scene.tweens.add({ targets: s.img, scale: this.sliceScale * LIFT, x: pose.x, y: pose.y, angle, duration: 160 });
      this.held = { s };
    });
    this.onMove((p) => {
      if (!this.held) return;
      const { img } = this.held.s;
      this.scene.tweens.killTweensOf(img);
      const pose = this.carryPose(this.held.s, p.worldX, p.worldY);
      img.setScale(this.sliceScale * LIFT).setPosition(pose.x, pose.y);
      // Turn smoothly toward the mouth as the finger moves around.
      img.setAngle(img.angle + Phaser.Math.Angle.ShortestBetween(img.angle, pose.angle) * 0.35);
      this.poke();
      // Surprised, mouth wide open, when the slice comes her way.
      const near = Phaser.Math.Distance.Between(p.worldX, p.worldY, this.mouthAt.x, this.mouthAt.y) < 700 * this.k;
      if (this.mood === 'rest' || this.mood === 'happy' || this.mood === 'expect') this.setMood(near ? 'expect' : 'rest');
    });
    this.onUp((p, cancelled) => {
      if (!this.held) return;
      const { s } = this.held;
      this.held = undefined;
      // Either the finger or the slice's tip near the mouth counts.
      if (!cancelled && (this.nearMouth(p.worldX, p.worldY) || this.nearMouth(s.img.x, s.img.y))) {
        this.hit();
        this.eat(s);
      } else {
        if (!cancelled) this.miss();
        this.sendHome(s);
      }
    });

    this.setIdle(true);
  }

  /** Cuts the pizza she made; falls back to the stock slice art if the capture failed. */
  private buildSlices() {
    const n = this.params.slices;
    const center = { x: this.dish.x, y: this.dish.y };
    const img = this.dish.madeImage;
    const defs = img ? cutSlices(this.scene, img, n, 4 * this.k) : stockSlices(n, this.k);
    // Captured slices are already in game pixels; stock art uses the art scale.
    this.sliceScale = img ? 1 : this.k;
    // Carry over the baked color (the capture was taken before baking).
    const tint = this.dish.base?.tintTopLeft ?? 0xffffff;
    for (const def of defs) {
      const a = Phaser.Math.DegToRad(def.midAngle);
      const home = { x: center.x + Math.cos(a) * EXPLODE * this.k, y: center.y + Math.sin(a) * EXPLODE * this.k };
      const s = this.own(this.scene.add.image(center.x, center.y, def.key));
      s.setOrigin(def.originX, def.originY).setAngle(def.restAngle).setDepth(20).setScale(this.sliceScale).setTint(tint);
      this.scene.tweens.add({ targets: s, x: home.x, y: home.y, duration: 350, delay: 150, ease: 'Back.easeOut' });
      this.slices.push({ img: s, def, home, eaten: false });
    }
    // The slices now are the pizza.
    this.dish.setVisible(false);
    sfx(this.scene, 'whoosh', { volume: 0.6 });
  }

  /**
   * Where a carried slice goes for a finger at (fx, fy): its middle under the finger and its
   * tip (the image origin) ahead of it, pointing at the mouth. Returns the origin and angle.
   */
  private carryPose(s: Slice, fx: number, fy: number) {
    const dir = Phaser.Math.Angle.Between(fx, fy, this.mouthAt.x, this.mouthAt.y);
    const reach = s.def.centerDist * LIFT;
    // The body extends from the tip along midAngle when the image sits at restAngle.
    const angle = Phaser.Math.Angle.WrapDegrees(s.def.restAngle + Phaser.Math.RadToDeg(dir) + 180 - s.def.midAngle);
    return { x: fx + Math.cos(dir) * reach, y: fy + Math.sin(dir) * reach, angle };
  }

  /** Visual center of a slice (where a finger naturally grabs it). */
  private sliceCenter(s: Slice) {
    const a = Phaser.Math.DegToRad(s.def.midAngle);
    return { x: s.home.x + Math.cos(a) * s.def.centerDist, y: s.home.y + Math.sin(a) * s.def.centerDist };
  }

  private sliceAt(x: number, y: number) {
    let best: Slice | undefined;
    let bestD = Infinity;
    for (const s of this.slices) {
      if (s.eaten) continue;
      const c = this.sliceCenter(s);
      const d = Phaser.Math.Distance.Between(x, y, c.x, c.y);
      if (d < bestD) {
        bestD = d;
        best = s;
      }
    }
    return best && bestD < 260 * this.k ? best : undefined;
  }

  /** Very forgiving: near the mouth, or anywhere over the character. */
  private nearMouth(x: number, y: number) {
    if (Phaser.Math.Distance.Between(x, y, this.mouthAt.x, this.mouthAt.y) < 380 * this.k) return true;
    return x > this.ctx.stage.charLeft;
  }

  private get char() {
    return this.ctx.character.box;
  }

  private get charRest() {
    return this.ctx.character.rest;
  }

  private get mouthAt() {
    return this.ctx.character.mouthAt;
  }

  private get mood() {
    return this.ctx.character.mood;
  }

  private setMood(m: Mood) {
    this.ctx.character.setMood(m);
  }

  /** Back to its place in the pizza, gently (also when the touch was lost mid-drag). */
  private sendHome(s: Slice) {
    sfx(this.scene, 'whoosh', { volume: 0.4 });
    if (this.mood === 'expect') this.setMood('rest');
    this.scene.tweens.add({
      targets: s.img,
      x: s.home.x,
      y: s.home.y,
      angle: s.def.restAngle,
      scale: this.sliceScale,
      duration: 420,
      ease: 'Sine.easeOut',
      onComplete: () => s.img.setDepth(20),
    });
  }

  private eat(s: Slice) {
    if (s.eaten) return;
    s.eaten = true;
    this.busy++;
    this.setMood('expect');
    this.scene.tweens.add({
      targets: s.img,
      x: this.mouthAt.x,
      y: this.mouthAt.y,
      scale: this.sliceScale * 0.2,
      duration: 260,
      ease: 'Quad.easeIn',
      onComplete: () => {
        s.img.setVisible(false);
        this.chew();
        burst(this.scene, this.mouthAt.x, this.mouthAt.y, { tint: [0xe3a869, 0xffcb47, 0xe4523b], count: 12, size: 20 * this.k, speed: 450 * this.k });
        this.react();
        this.scene.time.delayedCall(1050, () => {
          this.busy--;
          if (this.slices.every((x) => x.eaten) && this.busy === 0) this.party();
        });
      },
    });
  }

  /** About one second of happy chewing, with munch sounds. */
  private chew() {
    this.chewing++;
    this.setMood('chew');
    sfx(this.scene, 'munch', { minGapMs: 0 });
    let closed = false;
    this.scene.time.addEvent({
      delay: 150,
      repeat: 5,
      callback: () => {
        if (this.mood !== 'chew') return;
        closed = !closed;
        this.ctx.character.chewFrame(closed);
      },
    });
    this.scene.time.delayedCall(480, () => sfx(this.scene, 'munch', { minGapMs: 0, volume: 0.6 }));
    this.scene.time.delayedCall(1000, () => {
      this.chewing--;
      if (this.chewing === 0 && this.mood === 'chew') this.setMood(this.held ? 'expect' : 'rest');
    });
  }

  /** Over-the-top happiness, a different gag each time. */
  private react() {
    const k = this.k;
    stars(this.scene, this.char.x, this.char.y - 250 * k, 5, 55 * k);
    switch (this.slices.filter((x) => x.eaten).length % 3) {
      case 1: // jump
        this.scene.tweens.add({ targets: this.char, y: this.charRest.y - 120 * k, duration: 220, yoyo: true, ease: 'Quad.easeOut' });
        break;
      case 2: // happy wiggle
        this.scene.tweens.add({ targets: this.char, angle: { from: -10, to: 10 }, duration: 90, yoyo: true, repeat: 3, onComplete: () => this.char.setAngle(0) });
        break;
      default: // big belly squash
        boing(this.scene, this.char, 0.22);
    }
  }

  private party() {
    if (this.partyStarted) return;
    this.partyStarted = true;
    this.setIdle(false);
    this.setMood('party');
    const { W, H, k } = this.layout;
    // Jingle first, then the cheer right after it.
    sfxThen(this.scene, 'cheer-jingle', () => sfx(this.scene, 'cheer', { vary: false, minGapMs: 0 }));
    for (let i = 0; i < 6; i++) {
      this.scene.time.delayedCall(i * 350, () => stars(this.scene, Phaser.Math.Between(W * 0.2, W * 0.8), Phaser.Math.Between(H * 0.15, H * 0.6), 14, 80 * k));
    }
    this.scene.tweens.add({ targets: this.char, y: this.charRest.y - 110 * k, duration: 260, yoyo: true, repeat: 5, ease: 'Quad.easeOut' });
    this.scene.tweens.add({ targets: this.char, angle: { from: -8, to: 8 }, duration: 260, yoyo: true, repeat: 5, onComplete: () => this.char.setAngle(0) });
    this.scene.time.delayedCall(3800, () => this.complete());
  }

  protected showHint() {
    const s = this.slices.find((x) => !x.eaten);
    if (s) this.hand.drag(this.sliceCenter(s), this.mouthAt);
  }

  protected autoFinish() {
    if (this.held) {
      const { s } = this.held;
      this.held = undefined;
      this.eat(s);
    }
    const left = this.slices.filter((x) => !x.eaten);
    left.forEach((s, i) => this.scene.time.delayedCall(300 + i * 750, () => this.eat(s)));
  }
}
