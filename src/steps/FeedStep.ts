import Phaser from 'phaser';
import { voice } from '../core/audio';
import { boing, burst } from '../core/fx';
import type { HandMotion } from '../core/hand';
import { sfx, sfxThen } from '../core/sfx';
import type { Box } from '../core/stage';
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

/** Pipa's face in her 600x700 frame (eyes to mouth, with the cheeks): stars keep off it. */
const PET_FACE = { x0: 140, y0: 150, x1: 460, y1: 500 };
/** Minimum time of the finale, even if a sound is missing. */
const PARTY_MIN_MS = 3800;

/**
 * Feeding: the child's own pizza is cut into slices on the board; Pipa comes to the middle, big,
 * on the board's right rim (Mom stands beside her, smiling, her face clear). Drag each slice to
 * Pipa's mouth. When a slice comes near she looks surprised and opens wide; she chews for about
 * a second, happy. She always eats everything. After the last slice: "We made a pizza together!",
 * a cheer and a shower of stars (never over Mom's or Pipa's face), "That was fun! Bye bye!", home.
 */
export class FeedStep extends Step<FeedParams> {
  protected stepLine = 'vo-feed' as const;
  private slices: Slice[] = [];
  private held?: { s: Slice };
  private chewing = 0;
  private busy = 0;
  private partyStarted = false;
  private sliceScale = 1;
  private k = 1;

  start() {
    this.k = this.layout.k;
    this.ctx.character.moveTo(this.ctx.stage.feedPet);
    // Mom's pointing arm lifts a little so it tucks behind Pipa (the art agent's checked pose).
    this.ctx.mom.armTo(-18);
    this.ctx.mom.stepAside(this.ctx.stage.feedMomShift);
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

  /** Very forgiving: near the mouth, or anywhere over Pipa or to her right. */
  private nearMouth(x: number, y: number) {
    if (Phaser.Math.Distance.Between(x, y, this.mouthAt.x, this.mouthAt.y) < 380 * this.k) return true;
    return x > this.ctx.stage.feedPetLeft;
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
    const k = this.k * (this.ctx.character.scale / 0.62);
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
    this.ctx.mom.celebrate();
    const k = this.k;
    const t0 = this.scene.time.now;
    // "We made a pizza together!", then the cheer, then "That was fun! Bye bye!", then home (quietly).
    const bye = () =>
      voice.say('vo-bye', {
        ttlMs: 4000,
        done: () => !this.aborted && this.scene.time.delayedCall(Math.max(300, PARTY_MIN_MS - (this.scene.time.now - t0)), () => this.complete()),
      });
    voice.say('vo-finale', { ttlMs: 5000, done: () => !this.aborted && sfxThen(this.scene, 'cheer', bye) });
    this.showerStars();
    const hop = 110 * k * (this.ctx.character.scale / (0.62 * k));
    this.scene.tweens.add({ targets: this.char, y: this.charRest.y - hop, duration: 260, yoyo: true, repeat: 5, ease: 'Quad.easeOut' });
    this.scene.tweens.add({ targets: this.char, angle: { from: -8, to: 8 }, duration: 260, yoyo: true, repeat: 5, onComplete: () => this.char.setAngle(0) });
  }

  /**
   * The finale's stars: they pop in one after another over the top of the kitchen and around the board,
   * drift down a little and fade. Never over Mom's face or Pipa's face (or the home button).
   */
  private showerStars() {
    const { W, m, k } = this.layout;
    const st = this.ctx.stage;
    const pet = this.ctx.character;
    const petFace: Box = {
      x0: pet.rest.x + (PET_FACE.x0 - 300) * pet.scale,
      y0: pet.rest.y + (PET_FACE.y0 - 350) * pet.scale,
      x1: pet.rest.x + (PET_FACE.x1 - 300) * pet.scale,
      y1: pet.rest.y + (PET_FACE.y1 - 350) * pet.scale,
    };
    const DRIFT = 80 * k;
    // Mom stepped aside for this step.
    const sh = st.feedMomShift;
    const momFace: Box = { ...st.momFace, x0: st.momFace.x0 + sh, x1: st.momFace.x1 + sh };
    const clear = (x: number, y: number, r: number) => {
      const hits = (b: Box) => x + r > b.x0 && x - r < b.x1 && y + r + DRIFT > b.y0 && y - r < b.y1;
      if (hits(momFace) || hits(petFace)) return false;
      return Phaser.Math.Distance.Between(x, y, st.home.x, st.home.y) > 150 * k + r;
    };
    const spots: { x: number; y: number; s: number }[] = [];
    // Three big ones at the top centre, then smaller ones anywhere clear.
    for (const [dx, y, s] of [[-190, 150, 0.9], [0, 120, 1.15], [190, 150, 0.9]] as const) {
      const x = W / 2 + dx * k;
      if (clear(x, y, 100 * s * k)) spots.push({ x, y, s });
    }
    const rnd = new Phaser.Math.RandomDataGenerator(['party']);
    for (let guard = 0; spots.length < 17 && guard < 600; guard++) {
      const x = rnd.between(m + 60 * k, W - m - 60 * k);
      const y = rnd.between(60, 420);
      const s = rnd.realInRange(0.35, 0.8);
      if (!clear(x, y, 100 * s * k)) continue;
      if (spots.some((o) => Phaser.Math.Distance.Between(o.x, o.y, x, y) < 150 * k)) continue;
      spots.push({ x, y, s });
    }
    this.starSpots = spots.map((p) => ({ ...p, r: 100 * p.s * k }));
    spots.forEach((p, i) => {
      this.scene.time.delayedCall(120 + i * 140, () => {
        const star = this.scene.add.image(p.x, p.y, 'star').setDepth(80).setScale(0).setAngle(rnd.between(-30, 30));
        if (i < 3) sfx(this.scene, 'star', { minGapMs: 120, vary: false });
        this.scene.tweens.add({ targets: star, scale: p.s * k, duration: 320, ease: 'Back.easeOut' });
        this.scene.tweens.add({ targets: star, y: p.y + DRIFT, alpha: 0, delay: 1500, duration: 1200, ease: 'Sine.easeIn', onComplete: () => star.destroy() });
      });
    });
  }

  /** Where the finale's stars were placed (for the test harness's face check). */
  starSpots: { x: number; y: number; s: number; r: number }[] = [];

  /** Mom carries a see-through copy of a slice to Pipa's mouth (the real slices stay on the board). */
  protected demo(): HandMotion | null {
    const s = this.slices.find((x) => !x.eaten);
    if (!s) return null;
    const c = this.sliceCenter(s);
    const pose = this.carryPose(s, c.x, c.y);
    // It stops with the slice's tip just at her mouth (her face stays visible), then melts away.
    const back = s.def.centerDist * LIFT + 40 * this.k;
    const dir = Phaser.Math.Angle.Between(c.x, c.y, this.mouthAt.x, this.mouthAt.y);
    const to = { x: this.mouthAt.x - Math.cos(dir) * back, y: this.mouthAt.y - Math.sin(dir) * back };
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

  /** Mom helps: her hand carries each slice left to Pipa's mouth. */
  protected autoFinish() {
    let carried: Phaser.GameObjects.Image | null = null;
    this.hand.follow('grab', () => (carried?.visible ? { x: carried.x - 40 * this.k, y: carried.y } : null));
    if (this.held) {
      const { s } = this.held;
      this.held = undefined;
      carried = s.img;
      this.eat(s);
    }
    const left = this.slices.filter((x) => !x.eaten);
    left.forEach((s, i) =>
      this.scene.time.delayedCall(300 + i * 750, () => {
        carried = s.img;
        this.eat(s);
      }),
    );
  }
}
