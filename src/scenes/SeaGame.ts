import Phaser from 'phaser';
import { keepPhoto } from '../core/album';
import { music, voice, type Song, type VoiceKey } from '../core/audio';
import { FX_SOFT } from '../core/assets';
import { stars } from '../core/fx';
import { confetti } from '../core/juice';
import { seaLife } from '../core/scenery';
import { ART_SEA } from '../core/seaAssets';
import { sfx } from '../core/sfx';
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

  // ---------------------------------------------------------------- mermaid PR 2: shared by the activities

  /** The lagoon's water behind an activity (the same picture, spec 8: no background of its own), its slow sea life. */
  protected water(seaweed = true) {
    const L = this.L;
    this.cameras.main.setBackgroundColor('#5fc9c3');
    this.add.image(L.cx, L.H, 'bg-lagoon').setOrigin(0.5, 1).setScale(Math.max(1, L.W / 2400)).setDepth(-100);
    if (seaweed) seaLife(this, L, this.S.lagoon.seaweed);
  }

  /** Back to the lagoon, which asks "What shall we do next?" (never its hello again), from the home button too. */
  protected leave(from: 'recipe' | 'finale') {
    if (this.leaving) return;
    this.leaving = true;
    this.shutdown();
    if (from === 'recipe') voice.stop();
    this.scene.start(this.homeScene, { from: 'activity' });
  }

  /** The warm ending in the sea: the activity's line, then quietly back to the lagoon (no "bye bye": she stays here). */
  protected goodbye(line: VoiceKey) {
    let gone = false;
    const back = () => {
      if (gone) return;
      gone = true;
      this.time.delayedCall(1200, () => this.leave('finale'));
    };
    this.say(line, { ttlMs: 5000, done: back });
    this.time.delayedCall(7000, back);
  }

  /**
   * The photo for the memory book: the camera's flash over `area` (world box), the picture in the sea's frame
   * (photo-frame-sea) kept as `mermaid-<id>`, the cheer; then `then()`.
   */
  protected seaPhoto(id: string, area: { x: number; y: number; w: number; h: number }, at: { x: number; y: number }, then: (photo: Phaser.GameObjects.Container) => void) {
    const L = this.L;
    const k = L.k;
    const a = { x: Math.round(Math.max(0, area.x)), y: Math.round(Math.max(0, area.y)), w: Math.round(area.w), h: Math.round(area.h) };
    a.w = Math.min(a.w, Math.floor(L.W) - a.x);
    a.h = Math.min(a.h, Math.floor(L.H) - a.y);
    sfx(this, 'camera', { vary: false });
    let after = false;
    const show = (src: HTMLImageElement | null) => {
      if (after || !this.scene.isActive()) return;
      after = true;
      const flash = this.add.rectangle(L.W / 2, L.H / 2, L.W * 1.2, L.H * 1.2, 0xffffff).setDepth(2000).setAlpha(0.9);
      this.tweens.add({ targets: flash, alpha: 0, duration: 380, ease: 'Quad.easeOut', onComplete: () => flash.destroy() });
      const W = ART_SEA.photoWindow;
      const s = Math.min(0.62 * k, (L.H * 0.6) / 780);
      const parts: Phaser.GameObjects.GameObject[] = [];
      if (src) {
        try {
          const c = document.createElement('canvas');
          c.width = c.height = 420;
          c.getContext('2d')!.drawImage(src, 0, 0, 420, 420);
          let data = c.toDataURL('image/webp', 0.75);
          if (!data.startsWith('data:image/webp')) data = c.toDataURL('image/png');
          this.shown.photo = data.length;
          void keepPhoto(`mermaid-${id}`, data);
        } catch {
          /* the photo is simply not kept */
        }
        const key = `sea-photo-${id}`;
        if (this.textures.exists(key)) this.textures.remove(key);
        this.textures.addImage(key, src);
        this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.textures.exists(key) && this.textures.remove(key));
        const pic = new Phaser.GameObjects.Image(this, (W.x + W.w / 2 - 350) * s, (W.y + W.h / 2 - 390) * s, key);
        pic.setScale((W.w * s) / pic.width, (W.h * s) / pic.height);
        parts.push(pic);
      }
      parts.push(new Phaser.GameObjects.Image(this, 0, 0, 'photo-frame-sea').setScale(s));
      const box = this.add.container(at.x, at.y, parts).setDepth(800).setScale(0.2).setAlpha(0);
      this.tweens.add({ targets: box, scale: 1, alpha: 1, angle: { from: -8, to: -2 }, duration: 520, ease: 'Back.easeOut' });
      this.time.delayedCall(700, () => {
        sfx(this, 'cheer-jingle');
        music.party(true);
        stars(this, at.x, at.y - 200 * s, 14, 70 * k);
        confetti(this, at.x, L.Y(200), 22, 28 * k);
        this.mom?.celebrate();
        this.pipa?.cheer();
        then(box);
      });
    };
    try {
      this.game.renderer.snapshotArea(a.x, a.y, a.w, a.h, (img) => show(img instanceof HTMLImageElement ? img : null));
    } catch {
      show(null);
    }
    this.time.delayedCall(1200, () => show(null));
  }
}
