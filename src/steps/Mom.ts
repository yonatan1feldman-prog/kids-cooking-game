import Phaser from 'phaser';
import { ART, IMAGES, type ImageKey } from '../core/assets';
import { voice } from '../core/audio';
import type { Spot } from '../core/stage';

type Eyes = 'open' | 'blink' | 'happy' | 'surprised';
type Mouth = 'smile' | 'talk' | 'open' | 'chew';

/** How far her eyes shift toward what she watches, in frame units (800 frame). */
const LOOK_MAX = 10;
/** Pointing-arm rotation limits (README-mom.md: ±20° around the shoulder shows no gap). */
const ARM_MAX = 20;

/**
 * Mom, standing at the counter on the right for the whole recipe. Twelve layers share one 800x800
 * frame, stacked back to front: arm-right, body, head, hair, eyes, mouth, arm-left. The arms turn
 * around their shoulder pivots. At rest she breathes gently, blinks now and then, and her eyes follow
 * the finger (or her own demo hand, or the dish). While a voice line plays her mouth moves with its
 * loudness (smile / talk / open) and goes back to the smile when it ends. At the end of every step
 * she has happy eyes and a short happy bounce with a wave.
 */
export class Mom {
  readonly box: Phaser.GameObjects.Container;
  private eyes: Phaser.GameObjects.Image;
  private mouth: Phaser.GameObjects.Image;
  private armL: Phaser.GameObjects.Image;
  private armR: Phaser.GameObjects.Image;
  private eyesKey: Eyes = 'open';
  private mouthKey: Mouth = 'smile';
  /** Eyes set by a mood (happy, surprised) win over blinking until `rest()`. */
  private mood: Eyes | null = null;
  private look = { x: 0, y: 0 };
  private mouthHold = 0;
  /** A mouth held by what she is doing (open for a slice coming, chewing), over the voice's lip movement. */
  private mouthHeld: Mouth | null = null;
  private chewing?: Phaser.Time.TimerEvent;
  private breath?: Phaser.Tweens.Tween;
  readonly s: number;

  constructor(private scene: Phaser.Scene, at: Spot) {
    this.s = at.scale;
    const { w, h, cx, pivotL, pivotR } = ART.mom;
    // The container sits on her body centre at the screen bottom; every layer hangs from there.
    const layer = (key: ImageKey) => new Phaser.GameObjects.Image(scene, 0, 0, key).setOrigin(cx / w, 1).setScale(this.s);
    const arm = (key: ImageKey, pivot: { x: number; y: number }) =>
      new Phaser.GameObjects.Image(scene, (pivot.x - cx) * this.s, (pivot.y - h) * this.s, key).setOrigin(pivot.x / w, pivot.y / h).setScale(this.s);
    this.armR = arm('mom-arm-right', pivotR);
    this.eyes = layer('mom-eyes-open');
    this.mouth = layer('mom-mouth-smile');
    this.armL = arm('mom-arm-left', pivotL);
    this.box = scene.add
      .container(at.x, at.y, [this.armR, layer('mom-body'), layer('mom-head'), layer('mom-hair'), this.eyes, this.mouth, this.armL])
      .setDepth(4);
    this.scheduleBlink();
    // Gentle breathing (a very slow rise of the shoulders), the only thing she does on her own.
    this.breath = scene.tweens.add({ targets: this.box, scaleY: 1.012, duration: 1900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    scene.events.on(Phaser.Scenes.Events.UPDATE, this.update, this);
    this.box.once(Phaser.GameObjects.Events.DESTROY, () => scene.events.off(Phaser.Scenes.Events.UPDATE, this.update, this));
  }

  /** Her mouth in world coordinates (where a shared slice goes). */
  get mouthAt() {
    const { h, cx, mouth } = ART.mom;
    return { x: this.box.x + (mouth.x - cx) * this.s, y: this.box.y + (mouth.y - h) * this.s };
  }

  /** Her frame in world coordinates (for keeping things clear of her). */
  get frameLeft() {
    return this.box.x - ART.mom.cx * this.s;
  }

  private setEyes(e: Eyes) {
    if (this.eyesKey === e) return;
    this.eyesKey = e;
    this.eyes.setTexture(`mom-eyes-${e}`);
  }

  private setMouth(m: Mouth) {
    if (this.mouthKey === m) return;
    this.mouthKey = m;
    this.mouth.setTexture(`mom-mouth-${m}`);
  }

  private scheduleBlink() {
    this.scene.time.delayedCall(Phaser.Math.Between(2200, 5200), () => {
      if (!this.box.active) return;
      if (!this.mood) {
        this.setEyes('blink');
        this.scene.time.delayedCall(140, () => this.box.active && !this.mood && this.setEyes('open'));
      }
      this.scheduleBlink();
    });
  }

  /** Mouth follows the voice line's loudness, each shape held at least 90 ms so it reads as speech. */
  private update(_t: number, delta: number) {
    if (this.mouthHeld) return this.setMouth(this.mouthHeld);
    this.mouthHold -= delta;
    if (this.mouthHold > 0) return;
    if (!voice.speaking) return this.setMouth('smile');
    const lv = voice.level();
    const next: Mouth = lv > 0.42 ? 'open' : lv > 0.12 ? 'talk' : 'smile';
    if (next !== this.mouthKey) this.mouthHold = 90;
    this.setMouth(next);
  }

  /** Eyes drift toward a world point (call every frame; eases by itself). */
  lookAt(x: number, y: number) {
    const s = this.s;
    const ex = this.box.x;
    const ey = this.box.y - (IMAGES['mom-eyes-open'].size[1] - 270) * s;
    const dx = x - ex;
    const dy = y - ey;
    const d = Math.max(1, Math.hypot(dx, dy));
    const reach = Math.min(1, d / (300 * s));
    this.look.x += ((dx / d) * LOOK_MAX * reach * s - this.look.x) * 0.15;
    this.look.y += ((dy / d) * LOOK_MAX * 0.6 * reach * s - this.look.y) * 0.15;
    this.eyes.setPosition(this.look.x, this.look.y);
  }

  /** Happy eyes and a short happy bounce with a wave (end of a step). */
  cheer() {
    this.mood = 'happy';
    this.setEyes('happy');
    this.joy(1);
    this.scene.tweens.add({ targets: this.armR, angle: { from: -12, to: 12 }, duration: 150, yoyo: true, repeat: 2, onComplete: () => this.armR.setAngle(0) });
    this.scene.time.delayedCall(1100, () => this.box.active && this.mood === 'happy' && this.rest());
  }

  /**
   * A happy stretch and sway from the waist (her frame is cut at the screen bottom, so she never
   * jumps: that would open a gap under her).
   */
  private joy(times: number) {
    this.breath?.pause();
    this.box.setScale(1);
    this.scene.tweens.add({ targets: this.box, scaleY: 1.05, scaleX: 0.985, duration: 170, yoyo: true, repeat: times, ease: 'Quad.easeOut' });
    this.scene.tweens.add({
      targets: this.box,
      angle: { from: -2.5, to: 2.5 },
      duration: 170,
      yoyo: true,
      repeat: times,
      onComplete: () => {
        this.box.setAngle(0).setScale(1);
        this.breath?.resume();
      },
    });
  }

  /** Hello: happy eyes and a wave of the raised hand (the title, after the play tap). */
  wave() {
    this.mood = 'happy';
    this.setEyes('happy');
    this.scene.tweens.add({ targets: this.armR, angle: { from: -14, to: 14 }, duration: 180, yoyo: true, repeat: 3, onComplete: () => this.armR.setAngle(0) });
    this.scene.time.delayedCall(1500, () => this.box.active && this.mood === 'happy' && this.rest());
  }

  /** Stays happy (the finale, watching Pipa eat). */
  happy() {
    this.mood = 'happy';
    this.setEyes('happy');
  }

  surprised() {
    this.mood = 'surprised';
    this.setEyes('surprised');
  }

  rest() {
    this.mood = null;
    this.setEyes('open');
  }

  /** Sharing the pizza: a slice comes her way (surprised, mouth open), or goes elsewhere (back to her smile). */
  expectFood(on: boolean) {
    if (this.chewing) return;
    if (on) {
      this.surprised();
      this.mouthHeld = 'open';
    } else if (this.mouthHeld) {
      this.mouthHeld = null;
      this.rest();
    }
  }

  get expecting() {
    return this.mouthHeld === 'open';
  }

  /** She got a slice: happy eyes, chewing (mom-mouth-chew and her smile in turn) for `ms`. */
  chew(ms = 1000) {
    this.chewing?.remove();
    this.happy();
    let n = 0;
    this.mouthHeld = 'chew';
    this.chewing = this.scene.time.addEvent({
      delay: 160,
      repeat: Math.max(1, Math.round(ms / 160)) - 1,
      callback: () => {
        n++;
        this.mouthHeld = n % 2 ? 'smile' : 'chew';
        if (this.chewing && this.chewing.getRepeatCount() === 0) {
          this.chewing = undefined;
          this.mouthHeld = null;
          this.rest();
        }
      },
    });
  }

  /**
   * Turns the pointing arm so the fingertip aims at a world point, within ±20° of its drawn pose.
   * Only used where Pipa is not on screen (4:3): on the phone the aim would put the arm over her head.
   */
  aimArmAt(x: number, y: number, ms = 400) {
    const { pivotL, fingertipL, cx, h } = ART.mom;
    const px = this.box.x + (pivotL.x - cx) * this.s;
    const py = this.box.y + (pivotL.y - h) * this.s;
    const drawn = Math.atan2(fingertipL.y - pivotL.y, fingertipL.x - pivotL.x);
    let rot = Phaser.Math.RadToDeg(Math.atan2(y - py, x - px) - drawn);
    rot = Phaser.Math.Angle.WrapDegrees(rot);
    this.armTo(Phaser.Math.Clamp(rot, -ARM_MAX, ARM_MAX), ms);
  }

  /** Steps sideways (the feeding step: she makes room for Pipa). */
  stepAside(dx: number, ms = 600) {
    if (!dx) return;
    this.scene.tweens.add({ targets: this.box, x: this.box.x + dx, duration: ms, ease: 'Sine.easeInOut' });
  }

  /** Pointing arm to an angle (0 = her default pose, pointing at the pizza). */
  armTo(angle: number, ms = 400) {
    this.scene.tweens.killTweensOf(this.armL);
    this.scene.tweens.add({ targets: this.armL, angle, duration: ms, ease: 'Sine.easeInOut' });
  }

  /** The finale: the pointing arm goes up (a raised finger, "we did it!"), happy face, a few bounces. */
  celebrate() {
    this.happy();
    this.armTo(55, 350);
    this.joy(3);
    this.scene.tweens.add({ targets: this.armR, angle: { from: -14, to: 14 }, duration: 200, yoyo: true, repeat: 5, onComplete: () => this.armR.setAngle(0) });
  }

  destroy() {
    this.breath?.destroy();
    this.box.destroy();
  }
}
