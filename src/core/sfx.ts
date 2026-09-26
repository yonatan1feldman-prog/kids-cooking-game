import Phaser from 'phaser';
import { RECIPE_SOUNDS, type SoundKey } from './assets';
import { LEVEL } from './audio';

/** Per-effect gain on top of LEVEL.sfx (MIXING.md: munch is 5 dB quieter in the file, so it plays at 1.0). */
const KEY_GAIN: Partial<Record<SoundKey, number>> = {
  munch: 1 / LEVEL.sfx,
  star: 0.6 / LEVEL.sfx,
  complete: 0.7 / LEVEL.sfx,
  'jar-open': 0.8 / LEVEL.sfx,
  camera: 0.6 / LEVEL.sfx,
  beep: 0.6 / LEVEL.sfx,
  click: 0.5 / LEVEL.sfx,
  // the salad: tear is 5 dB quieter in its file (like munch), squeeze and drizzle 2 dB
  tear: 1 / LEVEL.sfx,
  squeeze: 0.8 / LEVEL.sfx,
  drizzle: 0.8 / LEVEL.sfx,
  // the soup: peel is about 5 dB quieter in its file (the munch / tear convention), so it plays at 1.0
  peel: 1 / LEVEL.sfx,
  // the cake: a soft breath out, played at the normal effect level (MIXING.md: -18 LUFS, gain 0.65)
};
const gainOf = (key: SoundKey, rel = 1) => Math.min(1, rel * LEVEL.sfx * (KEY_GAIN[key] ?? 1));

const lastPlayed = new Map<string, number>();
const unloadedTold = new Set<string>();

/**
 * Plays a contract sound if it was loaded. A missing sound is silently skipped.
 * Same-key calls closer than `minGapMs` are dropped so rapid rubbing doesn't turn into noise.
 * `volume` is relative (1 = the normal effect level, LEVEL.sfx ~0.65 of Mom's voice).
 */
export function sfx(scene: Phaser.Scene, key: SoundKey, opts: { volume?: number; minGapMs?: number; vary?: boolean } = {}) {
  if (!scene.cache.audio.exists(key)) {
    // (an effect some other recipe lists but this one doesn't: never loaded here)
    if (RECIPE_SOUNDS.has(key) && !unloadedTold.has(key)) {
      unloadedTold.add(key);
      console.warn(`[assets] sound not loaded: ${key} (add it to this recipe's RECIPE_ASSETS sounds)`);
    }
    return;
  }
  const now = performance.now();
  const gap = opts.minGapMs ?? 60;
  if (now - (lastPlayed.get(key) ?? -Infinity) < gap) return;
  lastPlayed.set(key, now);
  try {
    const vary = opts.vary ?? true;
    scene.sound.play(key, {
      volume: gainOf(key, opts.volume),
      rate: vary ? Phaser.Math.FloatBetween(0.92, 1.1) : 1,
    });
  } catch (err) {
    console.warn(`[sfx] ${key}`, err);
  }
}

/** Plays `key`, then calls `then` when it ends (right away if the sound is missing or fails). */
export function sfxThen(scene: Phaser.Scene, key: SoundKey, then: () => void, volume = 1) {
  let called = false;
  const next = () => {
    if (called) return;
    called = true;
    then();
  };
  if (!scene.cache.audio.exists(key)) return next();
  try {
    const snd = scene.sound.add(key, { volume: gainOf(key, volume) });
    snd.once(Phaser.Sound.Events.COMPLETE, () => {
      snd.destroy();
      next();
    });
    if (!snd.play()) next();
    // Safety net if 'complete' never arrives (e.g. audio still locked).
    scene.time.delayedCall(Math.max(500, (snd.duration || 1.5) * 1000 + 300), next);
  } catch {
    next();
  }
}
