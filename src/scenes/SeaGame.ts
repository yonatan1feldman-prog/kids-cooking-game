import Phaser from 'phaser';
import type { Song } from '../core/audio';
import { FX_SOFT } from '../core/assets';
import type { Spot } from '../core/stage';
import type { Character } from '../steps/Character';
import type { CharacterDef } from '../recipes/types';
import { MiniGame } from './MiniGame';

/** How far Marina floats up and down (world units at k 1) and how long one float takes. */
const BOB = 12;
const BOB_MS = 2600;
/** The quiet time between two of Marina's little breaths of bubbles (life, not a lure: small, slow, silent). */
const BREATH_MS: [number, number] = [6000, 10000];

/** Marina, the little mermaid girl (gen_marina.py): a Character on the characters' 600x700 frame, like Pipa. */
export const MARINA: CharacterDef = {
  body: 'marina-body',
  eyesOpen: 'marina-eyes-open',
  eyesBlink: 'marina-eyes-blink',
  eyesSurprised: 'marina-eyes-surprised',
  eyesHappy: 'marina-eyes-happy',
  mouthClosed: 'marina-mouth-closed',
  mouthOpen: 'marina-mouth-open',
  mouthChew: 'marina-mouth-chew',
};

/**
 * Marina swimming beside Mom: she floats gently up and down in the water, and now and then a few tiny bubbles rise
 * from her (breathing under water). Her rest moves with the float, so her own hops and cheers float along too; she
 * still answers a tickle like everyone. `spot` is her frame centre and scale.
 */
export function marinaSwims(scene: Phaser.Scene, marina: Character, spot: Spot, k: number) {
  marina.rest = { x: spot.x, y: spot.y };
  marina.box.setPosition(spot.x, spot.y);
  const float = { y: 0 };
  scene.tweens.add({ targets: float, y: -BOB * k, duration: BOB_MS, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  const follow = () => {
    if (!marina.box.active) return;
    marina.rest.y = spot.y + float.y;
    if (!scene.tweens.isTweening(marina.box)) marina.box.y = marina.rest.y;
  };
  scene.events.on(Phaser.Scenes.Events.UPDATE, follow);
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => scene.events.off(Phaser.Scenes.Events.UPDATE, follow));
  const breathe = () => {
    scene.time.delayedCall(Phaser.Math.Between(...BREATH_MS), () => {
      if (!marina.box.active) return;
      breath(scene, marina.box.x + 60 * spot.scale, marina.box.y - 40 * spot.scale, k);
      breathe();
    });
  };
  breathe();
}

/** Three tiny bubbles rising and fading (Marina breathing; the lagoon's sea life). */
export function breath(scene: Phaser.Scene, x: number, y: number, k: number, count = 3) {
  for (let i = 0; i < count; i++) {
    const r = (10 + i * 4) * k;
    const b = scene.add.image(x + Phaser.Math.Between(-8, 8) * k, y, FX_SOFT).setTint(0xeafcff).setAlpha(0).setDepth(3);
    b.setScale((2 * r) / b.frame.realWidth);
    scene.tweens.add({
      targets: b,
      y: y - (150 + i * 40) * k,
      x: b.x + Phaser.Math.Between(-20, 20) * k,
      alpha: { from: 0.75, to: 0 },
      delay: i * 260,
      duration: 2600,
      ease: 'Sine.easeOut',
      onComplete: () => b.destroy(),
    });
  }
}

/**
 * The mermaid world's activities (research/mermaid-spec.md 3): a mini-game (MiniGame: Mom's hand, the hint, Mom's help,
 * one finger) with Mom the mermaid, Marina swimming beside her (in Pipa's place), the sea's song, and the home button
 * back to the lagoon.
 * Each activity is its own scene on this base (mermaid PRs 2-4); its art is loaded by its shell door in the lagoon.
 */
export abstract class SeaGame extends MiniGame {
  protected readonly song: Song = 'sea';
  protected readonly momOutfit = 'mermaid' as const;
  protected readonly homeScene = 'Lagoon' as const;

  protected companion() {
    return MARINA;
  }

  protected ready() {
    if (this.pipa && this.S.pet) marinaSwims(this, this.pipa, this.S.pet, this.L.k);
  }
}
