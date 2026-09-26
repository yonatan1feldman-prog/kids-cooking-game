import Phaser from 'phaser';
import { boing, burst, setRestScale } from '../core/fx';
import type { GuestDef } from '../core/guests';
import { sfx } from '../core/sfx';
import type { Spot } from '../core/stage';
import type { Taste } from '../core/tastes';
import { TUNING } from '../core/tuning';
import { Character } from './Character';

/** Each guest's wordless voice: Pipa's sounds, pitched (the giraffe a little higher, the turtle low, the penguin high). */
const RATE = { giraffe: 1.15, turtle: 0.78, penguin: 1.3 } as const;

/**
 * A guest who came to share the dish (the guests round): the same layered character as Pipa (Character.ts), with her
 * own arrival and her own funny moment after a bite (core/guests.ts). Every reaction ends happy.
 */
export class Guest extends Character {
  /** Bites she has had. */
  bites = 0;
  private asleep = false;
  /** Called once her funny moment starts (the sneeze, the nap): the sharing lets Mom say her line. */
  onFunny?: () => void;

  constructor(scene: Phaser.Scene, readonly g: GuestDef, spot: Spot) {
    super(scene, g, null, spot);
    this.voiceRate = RATE[g.id];
    this.box.setDepth(5);
  }

  /** She comes in: the giraffe's head down from above on her long neck, the others walking in from the left edge. */
  arrive(done: () => void) {
    const sc = this.scene;
    const box = this.box;
    const s = this.scale;
    box.setVisible(true).setScale(s);
    this.setMood('happy');
    const land = () => {
      setRestScale(box);
      boing(sc, box, 0.08);
      sfx(sc, 'char-yay', { minGapMs: 0, rate: this.voiceRate, volume: 0.8 });
      sc.time.delayedCall(700, () => this.mood === 'happy' && this.setMood('rest'));
      done();
    };
    if (this.g.arrive === 'above') {
      box.setPosition(this.rest.x, -(350 + 40) * s);
      sfx(sc, 'whoosh', { volume: 0.5 });
      sc.tweens.add({ targets: box, y: this.rest.y, duration: 1100, ease: 'Back.easeOut', onComplete: land });
      return;
    }
    // walking in: she comes from beyond the left edge, a little waddle (the penguin) or slow steps (the turtle)
    const slow = this.g.id === 'turtle';
    const ms = slow ? 1700 : 1200;
    box.setPosition(-320 * s, this.rest.y);
    const steps = slow ? 5 : 8;
    sc.tweens.add({ targets: box, x: this.rest.x, duration: ms, ease: 'Sine.easeOut', onComplete: () => {
      box.setAngle(0).setY(this.rest.y);
      land();
    } });
    sc.tweens.add({ targets: box, angle: slow ? 3 : 7, duration: ms / steps / 2, yoyo: true, repeat: steps - 1, ease: 'Sine.easeInOut', onStart: () => box.setAngle(slow ? -3 : -7) });
    sc.tweens.add({ targets: box, y: this.rest.y - (slow ? 6 : 14) * (s / 0.55), duration: ms / steps / 2, yoyo: true, repeat: steps - 1, ease: 'Sine.easeOut' });
  }

  /** A bite comes near: she opens wide (and wakes up first, happy, if she was dozing). */
  setMood(m: Parameters<Character['setMood']>[0]) {
    if (m === 'expect' && this.asleep) this.wake();
    if (this.asleep && m === 'rest') return;
    super.setMood(m);
  }

  /** Mouth while chewing: slower for the turtle (the sharing times it). */
  get chewScale() {
    return this.g.chew;
  }

  react(t: Taste): number {
    if (!this.box.visible) return 0;
    this.bites++;
    const sc = this.scene;
    const d = this.def;
    const s = this.scale;
    const k = s / 0.55;
    const box = this.box;
    const id = this.g.id;
    if (id === 'penguin' && t === 'sneeze') {
      const ms = super.react('sneeze');
      this.mouth.setTexture(this.g.mouthFunny);
      this.onFunny?.();
      sc.time.delayedCall(800, () => this._mood === 'react' && this.mouth.setTexture(d.mouthOpen));
      return ms;
    }
    const ms = t === 'plain' ? 0 : super.react(t);
    if (id === 'giraffe' && t === 'love') {
      // her long tongue licks her nose
      sc.time.delayedCall(ms - 300, () => {
        if (!box.active) return;
        this._mood = 'react';
        this.eyes.setTexture(d.eyesHappy);
        this.mouth.setTexture(this.g.mouthFunny);
        sfx(sc, 'char-giggle', { minGapMs: 0, rate: this.voiceRate, volume: 0.7 });
        sc.tweens.add({ targets: box, scaleY: s * 1.04, duration: 220, yoyo: true, repeat: 1, ease: 'Sine.easeInOut', onComplete: () => box.setScale(s) });
        sc.time.delayedCall(900, () => this._mood === 'react' && this.setMood('rest'));
      });
      return ms + 700;
    }
    if (id === 'penguin' && (t === 'love' || t === 'wow')) {
      // a happy flap: a quick rock on her feet
      sc.tweens.add({ targets: box, angle: { from: -6, to: 6 }, duration: 130, yoyo: true, repeat: 2, ease: 'Sine.easeInOut', onComplete: () => box.setAngle(0) });
    }
    if (id === 'turtle' && (t === 'love' || this.bites >= TUNING.guests.napAfter) && !this.asleep) {
      sc.time.delayedCall(Math.max(ms, 300) + 100, () => this.nap(k));
      return Math.max(ms, 300) + 900;
    }
    return ms;
  }

  /** The turtle dozes off, content: eyes shut, a dozy smile, slow breathing, a few sleep bubbles. */
  private nap(k: number) {
    if (!this.box.active || this.asleep || this._mood === 'expect') return;
    const sc = this.scene;
    const s = this.scale;
    this.asleep = true;
    this._mood = 'sleep';
    this.eyes.setTexture(this.def.eyesBlink);
    this.mouth.setTexture(this.g.mouthFunny);
    this.onFunny?.();
    sc.tweens.add({ targets: this.box, scaleY: s * 1.03, duration: 1300, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    for (let i = 0; i < TUNING.guests.napBubbles; i++)
      sc.time.delayedCall(300 + i * 900, () => {
        if (!this.asleep) return;
        const m = this.mouthAt;
        burst(sc, m.x + 50 * k, m.y - 60 * k, { texture: 'fx-soft', count: 1, tint: 0xe9f6ff, size: (26 + i * 10) * k, speed: 60 * k, gravityY: -140, lifespan: 1400, depth: 60 });
      });
  }

  /** A bite came near: she wakes up with a little stretch, happy. */
  private wake() {
    if (!this.asleep) return;
    this.asleep = false;
    const s = this.scale;
    this.scene.tweens.killTweensOf(this.box);
    this.box.setScale(s).setPosition(this.rest.x, this.rest.y);
    this._mood = 'rest';
    this.scene.tweens.add({ targets: this.box, scaleY: s * 1.08, duration: 180, yoyo: true, ease: 'Quad.easeOut' });
  }
}
