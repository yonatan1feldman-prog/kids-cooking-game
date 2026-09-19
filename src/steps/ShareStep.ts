import Phaser from 'phaser';
import { voice } from '../core/audio';
import { boing, burst } from '../core/fx';
import type { HandMotion } from '../core/hand';
import { sfx } from '../core/sfx';
import type { ShareParams } from '../recipes/types';
import { cutSlices, stockSlices, type SliceDef } from './slices';
import { Step } from './Step';

interface Slice {
  img: Phaser.GameObjects.Image;
  def: SliceDef;
  home: { x: number; y: number };
  eaten: boolean;
}

type Who = 'mom' | 'pet';

/** A carried slice is shown a little bigger. */
const LIFT = 1.08;
/** Slices spread apart a little so the cuts show. */
const EXPLODE = 12;
/** A slice counts when the finger (or its tip) is this near a mouth (x k). Very forgiving. */
const MOUTH_REACH = 380;
/** The one a slice comes this near to opens wide. */
const EXPECT_REACH = 650;
const CHEW_MS = 1050;

/**
 * Share (reusable: any dish cut into pieces, shared between Mom and the pet). Her own pizza is cut into slices on the
 * board; Pipa comes to the board's right rim, big, and Mom steps aside so both can eat (the feeding layout of the
 * stage table). She drags each slice to Mom's mouth or to Pipa's. The one it comes near looks surprised and opens
 * wide; the other keeps smiling. Mom chews (mom-mouth-chew, happy eyes), Pipa munches with her happy gags. Any sharing
 * is fine, all to one of them too: nobody is ever sad about not getting one. The hint (and Mom's help) carries a slice
 * to whoever has had fewer. First slice for Mom: "A slice for Mommy!" and her "Mmm, yummy!"; for Pipa: "A slice for
 * Pipa!". When all are eaten the step ends (the finale, with the photo, is its own step).
 */
export class ShareStep extends Step<ShareParams> {
  private slices: Slice[] = [];
  private held?: Slice;
  private fed: Record<Who, number> = { mom: 0, pet: 0 };
  private busy = 0;
  private sliceScale = 1;
  private k = 1;
  private done = false;

  start() {
    this.stepLine = this.params.line;
    this.k = this.layout.k;
    this.workspace('dish', 400);
    this.ctx.character.moveTo(this.ctx.stage.feedPet);
    // Mom's pointing arm lifts a little so it tucks behind Pipa, and she steps aside to make room (her face in view).
    this.ctx.mom.armTo(-18);
    this.ctx.mom.stepAside(this.ctx.stage.feedMomShift);
    this.buildSlices();

    this.onDown((p) => {
      if (this.held || this.done) return;
      const s = this.sliceAt(p.worldX, p.worldY);
      if (!s) return;
      this.poke();
      sfx(this.scene, 'tap');
      this.scene.tweens.killTweensOf(s.img);
      s.img.setDepth(30);
      const pose = this.carryPose(s, p.worldX, p.worldY);
      const angle = s.img.angle + Phaser.Math.Angle.ShortestBetween(s.img.angle, pose.angle);
      this.scene.tweens.add({ targets: s.img, scale: this.sliceScale * LIFT, x: pose.x, y: pose.y, angle, duration: 160 });
      this.held = s;
    });
    this.onMove((p) => {
      const s = this.held;
      if (!s) return;
      this.scene.tweens.killTweensOf(s.img);
      const pose = this.carryPose(s, p.worldX, p.worldY);
      s.img.setScale(this.sliceScale * LIFT).setPosition(pose.x, pose.y);
      s.img.setAngle(s.img.angle + Phaser.Math.Angle.ShortestBetween(s.img.angle, pose.angle) * 0.35);
      this.poke();
      this.expectFrom(p.worldX, p.worldY);
    });
    this.onUp((p, cancelled) => {
      const s = this.held;
      if (!s) return;
      this.held = undefined;
      const who = cancelled ? null : this.receiver(p.worldX, p.worldY, s.img.x, s.img.y);
      if (who) {
        this.hit();
        this.feed(s, who);
      } else {
        if (!cancelled) this.miss();
        this.expectFrom(null);
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
    this.dish.setVisible(false);
    sfx(this.scene, 'whoosh', { volume: 0.6 });
  }

  mouthOf(who: Who) {
    return who === 'mom' ? this.ctx.mom.mouthAt : this.ctx.character.mouthAt;
  }

  /** The mouth nearest to a point. */
  private nearest(x: number, y: number): Who {
    const d = (w: Who) => Phaser.Math.Distance.Between(x, y, this.mouthOf(w).x, this.mouthOf(w).y);
    return d('mom') < d('pet') ? 'mom' : 'pet';
  }

  /**
   * Who gets a slice let go at the finger (fx, fy) with its tip at (tx, ty): whoever's mouth the finger or the tip is
   * near; or, anywhere right of Pipa's left edge, the nearer of the two. Else nobody (it goes back to the board).
   */
  private receiver(fx: number, fy: number, tx: number, ty: number): Who | null {
    const r = MOUTH_REACH * this.k;
    for (const [x, y] of [[fx, fy], [tx, ty]]) {
      const w = this.nearest(x, y);
      if (Phaser.Math.Distance.Between(x, y, this.mouthOf(w).x, this.mouthOf(w).y) < r) return w;
    }
    return fx > this.ctx.stage.feedPetLeft ? this.nearest(fx, fy) : null;
  }

  /** The one the slice comes near opens wide; the other keeps (or goes back to) smiling. */
  private expectFrom(x: number | null, y = 0) {
    const pet = this.ctx.character;
    let who: Who | null = null;
    if (x !== null) {
      const w = this.nearest(x, y);
      if (Phaser.Math.Distance.Between(x, y, this.mouthOf(w).x, this.mouthOf(w).y) < EXPECT_REACH * this.k) who = w;
    }
    this.ctx.mom.expectFood(who === 'mom');
    if (pet.mood === 'rest' || pet.mood === 'happy' || pet.mood === 'expect') pet.setMood(who === 'pet' ? 'expect' : 'rest');
  }

  /** The middle of the slice under the finger, its tip ahead of it, pointing at the nearer mouth. */
  private carryPose(s: Slice, fx: number, fy: number, to?: Who) {
    const m = this.mouthOf(to ?? this.nearest(fx, fy));
    const dir = Phaser.Math.Angle.Between(fx, fy, m.x, m.y);
    const reach = s.def.centerDist * LIFT;
    const angle = Phaser.Math.Angle.WrapDegrees(s.def.restAngle + Phaser.Math.RadToDeg(dir) + 180 - s.def.midAngle);
    return { x: fx + Math.cos(dir) * reach, y: fy + Math.sin(dir) * reach, angle };
  }

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

  private sendHome(s: Slice) {
    sfx(this.scene, 'whoosh', { volume: 0.4 });
    this.scene.tweens.add({ targets: s.img, x: s.home.x, y: s.home.y, angle: s.def.restAngle, scale: this.sliceScale, duration: 420, ease: 'Sine.easeOut', onComplete: () => s.img.setDepth(20) });
  }

  private feed(s: Slice, who: Who) {
    if (s.eaten) return;
    s.eaten = true;
    this.busy++;
    this.fed[who]++;
    const first = this.fed[who] === 1;
    const m = this.mouthOf(who);
    if (who === 'mom') this.ctx.mom.expectFood(true);
    else this.ctx.character.setMood('expect');
    this.scene.tweens.add({
      targets: s.img,
      x: m.x,
      y: m.y,
      scale: this.sliceScale * 0.2,
      duration: 260,
      ease: 'Quad.easeIn',
      onComplete: () => {
        s.img.setVisible(false);
        burst(this.scene, m.x, m.y, { tint: [0xe3a869, 0xffcb47, 0xe4523b], count: 12, size: 20 * this.k, speed: 450 * this.k });
        if (who === 'mom') this.momEats(first);
        else this.petEats(first);
        this.scene.time.delayedCall(CHEW_MS + 50, () => {
          this.busy--;
          if (this.slices.every((x) => x.eaten) && this.busy === 0) this.finish();
        });
      },
    });
  }

  private momEats(first: boolean) {
    const mom = this.ctx.mom;
    mom.chew(CHEW_MS);
    sfx(this.scene, 'munch', { minGapMs: 0, volume: 0.7 });
    this.scene.time.delayedCall(480, () => sfx(this.scene, 'munch', { minGapMs: 0, volume: 0.45 }));
    boing(this.scene, mom.box, 0.03);
    if (first) {
      voice.say(this.params.forMom, { ttlMs: 4000 });
      voice.say(this.params.momYum, { ttlMs: 6000 });
    }
  }

  /** Pipa: about one second of happy chewing with munch sounds, and one of her happy gags. */
  private petEats(first: boolean) {
    const pet = this.ctx.character;
    pet.setMood('chew');
    sfx(this.scene, 'munch', { minGapMs: 0 });
    let closed = false;
    this.scene.time.addEvent({
      delay: 150,
      repeat: 5,
      callback: () => {
        if (pet.mood !== 'chew') return;
        closed = !closed;
        pet.chewFrame(closed);
      },
    });
    this.scene.time.delayedCall(480, () => sfx(this.scene, 'munch', { minGapMs: 0, volume: 0.6 }));
    this.scene.time.delayedCall(CHEW_MS, () => pet.mood === 'chew' && pet.setMood('rest'));
    const k = this.k * (pet.scale / 0.62);
    const box = pet.box;
    // A little jump or a happy up-and-down squish, in turn (nothing sideways: beside Mom's face there is no room for it).
    if (this.fed.pet % 2) this.scene.tweens.add({ targets: box, y: pet.rest.y - 120 * k, duration: 220, yoyo: true, ease: 'Quad.easeOut' });
    else this.scene.tweens.add({ targets: box, scaleY: pet.scale * 0.84, duration: 120, yoyo: true, repeat: 1, ease: 'Sine.easeInOut', onComplete: () => box.setScale(pet.scale) });
    if (first) voice.say(this.params.forPet, { ttlMs: 4000 });
  }

  private finish() {
    if (this.done) return;
    this.done = true;
    this.setIdle(false);
    this.hand.stop();
    this.ctx.mom.happy();
    this.ctx.character.setMood('happy');
    this.scene.time.delayedCall(500, () => this.complete());
  }

  /** Whoever has had fewer (Mom first when even): the hint and Mom's help carry the next slice there. */
  private nextFor(): Who {
    return this.fed.mom <= this.fed.pet ? 'mom' : 'pet';
  }

  /** Mom carries a see-through copy of a slice to the mouth of whoever has had fewer (the real slices stay). */
  protected demo(): HandMotion | null {
    const s = this.slices.find((x) => !x.eaten);
    if (!s || this.done) return null;
    const who = this.nextFor();
    const c = this.sliceCenter(s);
    const pose = this.carryPose(s, c.x, c.y, who);
    const m = this.mouthOf(who);
    const back = s.def.centerDist * LIFT + 40 * this.k;
    const dir = Phaser.Math.Angle.Between(c.x, c.y, m.x, m.y);
    const to = { x: m.x - Math.cos(dir) * back, y: m.y - Math.sin(dir) * back };
    return {
      kind: 'grab',
      keys: [
        { x: c.x, y: c.y, t: 0 },
        { x: c.x, y: c.y, t: 350, press: true },
        { x: to.x, y: to.y, t: 1700 },
        { x: to.x, y: to.y, t: 2300 },
      ],
      props: [
        {
          key: s.def.key,
          scale: this.sliceScale * LIFT,
          angle: pose.angle,
          alpha: 0.6,
          originX: s.def.originX,
          originY: s.def.originY,
          dx: pose.x - c.x,
          dy: pose.y - c.y,
          fadeFrom: 1650,
          tint: s.img.tintTopLeft,
        },
      ],
      glow: c,
    };
  }

  /** Mom helps: her hand shares the rest out, each slice to whoever has had fewer. */
  protected autoFinish() {
    let carried: Phaser.GameObjects.Image | null = null;
    this.hand.follow('grab', () => (carried?.visible ? { x: carried.x - 40 * this.k, y: carried.y } : null));
    if (this.held) {
      const s = this.held;
      this.held = undefined;
      carried = s.img;
      this.feed(s, this.nextFor());
    }
    this.expectFrom(null);
    const left = this.slices.filter((x) => !x.eaten);
    left.forEach((s, i) =>
      this.scene.time.delayedCall(300 + i * (CHEW_MS + 250), () => {
        carried = s.img;
        this.feed(s, this.nextFor());
      }),
    );
  }
}
