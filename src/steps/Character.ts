import Phaser from 'phaser';
import { IMAGES } from '../core/assets';
import { boing, setRestScale } from '../core/fx';
import { opaqueBounds } from '../core/placeholders';
import type { Spot } from '../core/stage';
import type { CharacterDef } from '../recipes/types';

export type Mood = 'rest' | 'expect' | 'chew' | 'happy' | 'party';

/** How far the eyes layer shifts toward what she is watching, in frame units (600x700 frame). */
const LOOK_MAX = 14;

/**
 * Pipa the hedgehog, the kitchen pet, who tastes the pizza at the end. Layers share one frame and are
 * stacked at one position: body, then eyes, then mouth (the images are at frame size; the container
 * carries her scale). On phones she sits small on the counter beside Mom for the whole recipe; on 4:3
 * she is not on screen until the feeding step (`appear`). For feeding she moves to the middle and grows
 * (`moveTo`). At rest she blinks now and then and her eyes follow what is happening. Every finished step
 * gets a little hop. The feeding step drives her moods (expect, chew, party).
 */
export class Character {
  readonly box: Phaser.GameObjects.Container;
  /** Where she rests now (her frame centre) and her scale. */
  rest: { x: number; y: number };
  scale: number;
  private eyes: Phaser.GameObjects.Image;
  private mouth: Phaser.GameObjects.Image;
  private _mood: Mood = 'rest';
  private look = { x: 0, y: 0 };
  /** The mouth in frame coordinates, measured from the art. */
  private mouthLocal: { x: number; y: number };

  constructor(private scene: Phaser.Scene, private def: CharacterDef, at: Spot | null, hiddenAt: Spot) {
    const spot = at ?? hiddenAt;
    this.rest = { x: spot.x, y: spot.y };
    this.scale = spot.scale;
    const body = new Phaser.GameObjects.Image(scene, 0, 0, def.body);
    this.eyes = new Phaser.GameObjects.Image(scene, 0, 0, def.eyesOpen);
    this.mouth = new Phaser.GameObjects.Image(scene, 0, 0, def.mouthClosed);
    this.box = scene.add.container(spot.x, spot.y, [body, this.eyes, this.mouth]).setDepth(5).setScale(spot.scale);
    this.box.setVisible(!!at);

    const [fw, fh] = IMAGES['character-mouth-open'].size;
    const b = opaqueBounds(scene, def.mouthOpen) ?? { cx: 300, cy: 440 };
    this.mouthLocal = { x: b.cx - fw / 2, y: b.cy - fh / 2 };
    this.scheduleBlink();
  }

  get mood() {
    return this._mood;
  }

  get visible() {
    return this.box.visible;
  }

  /** Her mouth at her resting spot (world coordinates): where slices go. */
  get mouthAt() {
    return { x: this.rest.x + this.mouthLocal.x * this.scale, y: this.rest.y + this.mouthLocal.y * this.scale };
  }

  /** Pops in where she rests (a small bounce). */
  enter(delay = 0) {
    this.box.setVisible(true).setScale(0);
    this.scene.tweens.add({ targets: this.box, scale: this.scale, duration: 450, delay, ease: 'Back.easeOut', onComplete: () => setRestScale(this.box) });
  }

  /** Moves (and grows) to a new resting spot; pops in there if she wasn't on screen. */
  moveTo(spot: Spot, ms = 600) {
    this.rest = { x: spot.x, y: spot.y };
    this.scale = spot.scale;
    if (!this.box.visible) {
      this.box.setPosition(spot.x, spot.y);
      return this.enter();
    }
    this.scene.tweens.add({
      targets: this.box,
      x: spot.x,
      y: spot.y,
      scale: spot.scale,
      duration: ms,
      ease: 'Sine.easeInOut',
      onComplete: () => setRestScale(this.box),
    });
  }

  /** Random blink every few seconds while at rest. */
  private scheduleBlink() {
    this.scene.time.delayedCall(Phaser.Math.Between(2200, 5200), () => {
      if (!this.box.active) return;
      if (this._mood === 'rest') {
        this.eyes.setTexture(this.def.eyesBlink);
        this.scene.time.delayedCall(140, () => {
          if (this._mood === 'rest' && this.eyes.active) this.eyes.setTexture(this.def.eyesOpen);
        });
      }
      this.scheduleBlink();
    });
  }

  setMood(m: Mood) {
    if (this._mood === m) return;
    this._mood = m;
    const d = this.def;
    if (m === 'rest') {
      this.eyes.setTexture(d.eyesOpen);
      this.mouth.setTexture(d.mouthClosed);
    } else if (m === 'expect') {
      this.eyes.setTexture(d.eyesSurprised);
      this.mouth.setTexture(d.mouthOpen);
      boing(this.scene, this.box, 0.06);
    } else if (m === 'chew') {
      this.eyes.setTexture(d.eyesHappy);
      this.mouth.setTexture(d.mouthChew);
    } else {
      // happy, party
      this.eyes.setTexture(d.eyesHappy);
      this.mouth.setTexture(d.mouthOpen);
    }
  }

  /** Mouth texture while chewing (open/closed alternating). */
  chewFrame(closed: boolean) {
    this.mouth.setTexture(closed ? this.def.mouthClosed : this.def.mouthChew);
  }

  /** Eyes drift toward a world point (call every frame; eases by itself). */
  lookAt(x: number, y: number) {
    if (!this.box.visible) return;
    const dx = x - this.box.x;
    const dy = y - (this.box.y - 100 * this.scale);
    const d = Math.max(1, Math.hypot(dx, dy));
    const reach = Math.min(1, d / (300 * this.scale));
    const tx = (dx / d) * LOOK_MAX * reach;
    const ty = (dy / d) * LOOK_MAX * 0.6 * reach;
    this.look.x += (tx - this.look.x) * 0.15;
    this.look.y += (ty - this.look.y) * 0.15;
    this.eyes.setPosition(this.look.x, this.look.y);
  }

  /** A short burst of joy at the end of a step: happy face and a little hop. */
  cheer() {
    if (this._mood !== 'rest' || !this.box.visible) return;
    this.setMood('happy');
    this.scene.tweens.add({ targets: this.box, y: this.rest.y - 60 * this.scale, duration: 200, yoyo: true, ease: 'Quad.easeOut' });
    this.scene.time.delayedCall(900, () => {
      if (this._mood === 'happy') this.setMood('rest');
    });
  }
}
