import Phaser from 'phaser';
import type { Layout } from './layout';
import { readMark, writeMark } from './sea';
import type { Stage } from './stage';
import type { Character } from '../steps/Character';

/**
 * Mermaid PR 3 (research/mermaid-spec.md 3.3 and 3.4): the numbers of cleaning the lagoon and of the shell treasure, the
 * marks they leave in the lagoon (Marina's necklace, the clear water with a dolphin jumping far off), and the room and
 * the room both activities share (SeaGame has the water, the way back and the photo). Its own file so the parallel mermaid PRs never edit the same one.
 */
export const SEA3 = {
  clean: {
    /** How far (finger units, x k) she rubs over the dolphin's net before it comes off (spec 3.3: 700-900). */
    untangle: [700, 900],
    /** The murky water's alpha at the start (it fades by a step for each piece in the net). */
    murk: 0.85,
    /** How far beyond its drawing (x k) a net bag takes what is let go over it. */
    reach: 70,
    /** Mom's help: how long her hand takes to carry a piece, and to rub the net off. */
    helpMs: 1000,
    rubMs: 1800,
    /** Every this many pieces in the net Mom praises aloud (the others: a smile and stars). */
    praiseEvery: 3,
  },
  shells: {
    /** Shells hidden in the sand, by level. */
    hidden: [1, 3],
    /** Shells on the necklace, by level (hard: Mom threads the first three, the pattern, then she goes on). */
    thread: [6, 9],
    given: 3,
    reach: 60,
    helpMs: 1000,
    /** A big and a little fan shell (hard: the size sorting), times the shells' scale. */
    big: 1.2,
    little: 0.72,
  },
} as const;

// ---------------------------------------------------------------- the marks in the lagoon

export type LagoonMark3 = 'clean' | 'necklace';

/** True once she has done it (core/sea.ts marks: kept on the device, never shown as a number). */
export function hasMark(id: LagoonMark3): boolean {
  return !!readMark<boolean>(id);
}

export function setMark(id: LagoonMark3) {
  writeMark(id, true);
}

/** Where the necklace sits on Marina, in her 600x700 frame (gen_marina.py: her neck over the shell top). */
const MARINA_NECK = { x: 300, y: 440 };

/** Marina wears her shell necklace (in her own container, so it floats and hops with her). `pop`: it appears with a bounce. */
export function wearNecklace(scene: Phaser.Scene, marina: Character, pop = false) {
  if (!scene.textures.exists('necklace-marina')) return null;
  const n = new Phaser.GameObjects.Image(scene, MARINA_NECK.x - 300, MARINA_NECK.y - 350, 'necklace-marina');
  marina.box.add(n);
  if (pop) {
    n.setScale(0);
    scene.tweens.add({ targets: n, scale: 1, duration: 420, ease: 'Back.easeOut' });
  }
  return n;
}

/**
 * The lagoon after she has cleaned it: the water a touch brighter, and now and then (every 20-40 s) a dolphin jumps far
 * off behind the reef, slow and quiet, never something to touch (like the birds in the kitchen's window).
 */
export function cleanLagoonLife(scene: Phaser.Scene, L: Layout) {
  scene.add.rectangle(L.cx, L.H / 2, L.W, L.H, 0xeafffb, 0.1).setBlendMode(Phaser.BlendModes.ADD).setDepth(-95);
  if (!scene.textures.exists('lagoon-dolphin-far')) return;
  const jump = () => {
    scene.time.delayedCall(Phaser.Math.Between(20000, 40000), () => {
      if (!scene.scene.isActive()) return;
      const k = L.k;
      const x = Phaser.Math.FloatBetween(L.W * 0.25, L.W * 0.6);
      const y = L.Y(470);
      const d = scene.add.image(x, y, 'lagoon-dolphin-far').setScale(0.8 * k).setAlpha(0).setDepth(-85).setAngle(-25);
      const arc = { t: 0 };
      scene.tweens.add({
        targets: arc,
        t: 1,
        duration: 2400,
        ease: 'Sine.easeInOut',
        onUpdate: () => {
          const t = arc.t;
          d.setPosition(x + 260 * k * t, y - 150 * k * Math.sin(Math.PI * t));
          d.setAngle(-25 + 60 * t);
          d.setAlpha(0.75 * Math.sin(Math.PI * Math.min(1, t * 1.15)));
        },
        onComplete: () => d.destroy(),
      });
      jump();
    });
  };
  jump();
}

// ---------------------------------------------------------------- the room both activities share

/** Mom's rock under her tail (the activities stand in the lagoon; SeaGame.water() draws the water behind). */
export function seaRock(scene: Phaser.Scene, S: Stage) {
  const r = S.lagoon.rock;
  scene.add.image(r.x, r.y, 'lagoon-rock').setScale(r.scale).setDepth(2);
}

/** The room the activity's things have: from the left thumb strip to just left of Marina (or of Mom's face, and her tail). */
export function seaWork(L: Layout, S: Stage) {
  const k = L.k;
  const petLeft = S.pet ? S.pet.x - 270 * S.pet.scale : Infinity;
  const rockLeft = S.lagoon.rock.x - 330 * S.lagoon.rock.scale;
  return { x0: L.m + 16 * k, x1: Math.min(S.momFace.x0, petLeft, rockLeft) - 16 * k };
}
