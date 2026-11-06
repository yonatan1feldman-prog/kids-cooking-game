import Phaser from 'phaser';
import type { Song } from '../core/audio';
import { FX_SOFT } from '../core/assets';
import type { Spot } from '../core/stage';
import type { Character } from '../steps/Character';
import { MiniGame } from './MiniGame';

/** How far Pipa's bubble floats up and down (world units at k 1) and how long one float takes. */
const BOB = 10;
const BOB_MS = 2600;
/** The quiet time between two of Pipa's little breaths of bubbles (life, not a lure: small, slow, silent). */
const BREATH_MS: [number, number] = [6000, 10000];

/**
 * Pipa in the mermaid world: her clear bubble round her (pipa-bubble, 420 frame round her at 0.4), floating gently up
 * and down with her inside, and now and then a few tiny bubbles rising from it (her breathing under water). Nothing of
 * it can be tapped; Pipa herself still answers a tickle like everywhere. `spot` is the bubble's centre and scale.
 */
export function pipaInBubble(scene: Phaser.Scene, pipa: Character, spot: Spot, k: number) {
  const bubble = scene.add.image(spot.x, spot.y, 'pipa-bubble').setScale(spot.scale).setDepth(pipa.box.depth + 0.5);
  // (Pipa's frame is 600x700 with her feet low in it: she sits a little low in the round bubble, her head in the middle)
  const dy = 34 * spot.scale;
  // (her rest moves with the float, so her own jumps and cheers, made from her rest, float along too)
  pipa.rest = { x: spot.x, y: spot.y + dy };
  pipa.box.setPosition(pipa.rest.x, pipa.rest.y);
  const float = { y: 0 };
  scene.tweens.add({ targets: float, y: -BOB * k, duration: BOB_MS, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  const baseY = pipa.rest.y;
  const follow = () => {
    if (!bubble.active) return;
    bubble.y = spot.y + float.y;
    pipa.rest.y = baseY + float.y;
    if (!scene.tweens.isTweening(pipa.box)) pipa.box.y = pipa.rest.y;
  };
  scene.events.on(Phaser.Scenes.Events.UPDATE, follow);
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => scene.events.off(Phaser.Scenes.Events.UPDATE, follow));
  const breathe = () => {
    scene.time.delayedCall(Phaser.Math.Between(...BREATH_MS), () => {
      if (!bubble.active) return;
      breath(scene, bubble.x + 40 * spot.scale, bubble.y - 170 * spot.scale, k);
      breathe();
    });
  };
  breathe();
  return bubble;
}

/** Three tiny bubbles rising and fading (Pipa breathing; the lagoon's sea life). */
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
 * one finger) with Mom the mermaid, Pipa in her bubble, the sea's song, and the home button back to the lagoon.
 * Each activity is its own scene on this base (mermaid PRs 2-4); its art is loaded by its shell door in the lagoon.
 */
export abstract class SeaGame extends MiniGame {
  protected readonly song: Song = 'sea';
  protected readonly momOutfit = 'mermaid' as const;
  protected readonly homeScene = 'Lagoon' as const;

  protected ready() {
    if (this.pipa && this.S.pet) pipaInBubble(this, this.pipa, { ...this.S.pet, scale: this.S.pet.scale / 0.4 }, this.L.k);
  }
}
