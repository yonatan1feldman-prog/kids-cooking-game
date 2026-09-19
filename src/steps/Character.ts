import Phaser from 'phaser';
import { IMAGES } from '../core/assets';
import { boing, stars } from '../core/fx';
import { opaqueBounds } from '../core/placeholders';
import type { CharacterDef } from '../recipes/types';

export type Mood = 'rest' | 'expect' | 'chew' | 'happy' | 'party';

/** How far the eyes layer shifts toward what she is watching, in frame units (600x700 frame). */
const LOOK_MAX = 14;

/**
 * The character who stands on the right for the whole recipe. Layers share one frame and
 * are stacked at one position: body, then eyes, then mouth. At rest she blinks now and then
 * and her eyes follow what is happening (a finger, a dragged item, the dish). Every finished
 * step gets a short happy hop. The feeding step drives her moods (expect, chew, party).
 */
export class Character {
  readonly box: Phaser.GameObjects.Container;
  readonly rest: { x: number; y: number };
  /** The mouth, measured from the art (world coordinates). */
  readonly mouthAt: { x: number; y: number };
  readonly scale: number;
  private eyes: Phaser.GameObjects.Image;
  private mouth: Phaser.GameObjects.Image;
  private _mood: Mood = 'rest';
  private look = { x: 0, y: 0 };

  constructor(private scene: Phaser.Scene, private def: CharacterDef, at: { x: number; y: number }, scale: number) {
    this.rest = at;
    this.scale = scale;
    const body = new Phaser.GameObjects.Image(scene, 0, 0, def.body).setScale(scale);
    this.eyes = new Phaser.GameObjects.Image(scene, 0, 0, def.eyesOpen).setScale(scale);
    this.mouth = new Phaser.GameObjects.Image(scene, 0, 0, def.mouthClosed).setScale(scale);
    this.box = scene.add.container(at.x, at.y, [body, this.eyes, this.mouth]).setDepth(5);

    const [fw, fh] = IMAGES['character-mouth-open'].size;
    const b = opaqueBounds(scene, def.mouthOpen) ?? { cx: 300, cy: 440 };
    this.mouthAt = { x: at.x + (b.cx - fw / 2) * scale, y: at.y + (b.cy - fh / 2) * scale };
    this.scheduleBlink();
  }

  get mood() {
    return this._mood;
  }

  /** Drops in from above with a bounce. */
  enter() {
    this.box.y = -IMAGES['character-body'].size[1] * this.scale;
    this.scene.tweens.add({ targets: this.box, y: this.rest.y, duration: 700, ease: 'Bounce.easeOut' });
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
    const dx = x - this.box.x;
    const dy = y - (this.box.y - 100 * this.scale);
    const d = Math.max(1, Math.hypot(dx, dy));
    const reach = Math.min(1, d / (300 * this.scale));
    const tx = (dx / d) * LOOK_MAX * reach * this.scale;
    const ty = (dy / d) * LOOK_MAX * 0.6 * reach * this.scale;
    this.look.x += (tx - this.look.x) * 0.15;
    this.look.y += (ty - this.look.y) * 0.15;
    this.eyes.setPosition(this.look.x, this.look.y);
  }

  /** A short burst of joy at the end of a step: happy face, a hop, a few stars. */
  cheer() {
    if (this._mood !== 'rest') return;
    this.setMood('happy');
    stars(this.scene, this.box.x, this.box.y - 250 * this.scale, 5, 55 * this.scale);
    this.scene.tweens.add({ targets: this.box, y: this.rest.y - 90 * this.scale, duration: 200, yoyo: true, ease: 'Quad.easeOut' });
    this.scene.time.delayedCall(900, () => {
      if (this._mood === 'happy') this.setMood('rest');
    });
  }
}
