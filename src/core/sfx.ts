import Phaser from 'phaser';
import type { SoundKey } from './assets';

const lastPlayed = new Map<string, number>();

/**
 * Plays a contract sound if it was loaded. A missing sound is silently skipped.
 * Same-key calls closer than `minGapMs` are dropped so rapid rubbing doesn't turn into noise.
 */
export function sfx(scene: Phaser.Scene, key: SoundKey, opts: { volume?: number; minGapMs?: number; vary?: boolean } = {}) {
  if (!scene.cache.audio.exists(key)) return;
  const now = performance.now();
  const gap = opts.minGapMs ?? 60;
  if (now - (lastPlayed.get(key) ?? -Infinity) < gap) return;
  lastPlayed.set(key, now);
  try {
    const vary = opts.vary ?? true;
    scene.sound.play(key, {
      volume: opts.volume ?? 0.8,
      rate: vary ? Phaser.Math.FloatBetween(0.92, 1.1) : 1,
    });
  } catch (err) {
    console.warn(`[sfx] ${key}`, err);
  }
}
