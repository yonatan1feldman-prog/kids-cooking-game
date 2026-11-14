import Phaser from 'phaser';
import { giggle } from '../../core/salonDress';
import { sfx } from '../../core/sfx';
import { breath } from '../SeaGame';
import type { P } from '../MiniGame';
import type { SeaSalon } from '../SeaSalon';

/** Which of its three answers comes next (kept on the device like every secret: core/secrets.ts; never shown). */
const KEY = 'cooking.secret.mermaid.vanity';

/**
 * The salon's secret (salon PR 4, spec 8): the little coral table with its jars on the sand (where there is room for
 * it, not at 4:3). It does not look like a button and nothing about it calls; a tap on it shows a little surprise, and
 * the next tap (this visit or the next) a different one: bubbles rise out of the jars; a heart jewel hops out of a jar
 * and back in; a little fish peeks out from behind the table and swims off. The customer giggles. Never progress, never
 * a miss. Returns true when the tap was the table's.
 */
export function vanityTap(h: SeaSalon, vanity: Phaser.GameObjects.Image | undefined, at: P): boolean {
  if (!vanity?.active || !vanity.visible) return false;
  const b = vanity.getBounds();
  const pad = 30 * h.k;
  if (at.x < b.x - pad || at.x > b.right + pad || at.y < b.y - pad || at.y > b.bottom + pad) return false;
  const now = h.time.now;
  if (now < ((vanity.getData('busy') as number) ?? 0)) return true;
  vanity.setData('busy', now + 1400);
  let i = 0;
  try {
    i = (parseInt(localStorage.getItem(KEY) ?? '0', 10) || 0) % 3;
    localStorage.setItem(KEY, String((i + 1) % 3));
  } catch {
    /* (no storage: the first one every time) */
  }
  const k = h.k;
  const s = vanity.scaleY;
  // (the table answers: a little wobble on the sand)
  h.tweens.add({ targets: vanity, angle: { from: -2, to: 2 }, duration: 90, yoyo: true, repeat: 1, onComplete: () => vanity.setAngle(0) });
  const jar = { x: vanity.x - 110 * s, y: vanity.y - 120 * s };
  if (i === 0) {
    sfx(h, 'bubble-breath', { pitch: 'vary' });
    breath(h, jar.x, jar.y, k, 3);
    h.time.delayedCall(240, () => breath(h, jar.x + 150 * s, jar.y + 10 * s, k, 3));
  } else if (i === 1 && h.textures.exists('gem-heart')) {
    const gem = h.add.image(jar.x, jar.y + 20 * s, 'gem-heart').setScale(0.6 * k).setDepth(4.2).setAlpha(0);
    sfx(h, 'jewel-ting', { pitch: 'vary' });
    h.tweens.chain({
      targets: gem,
      tweens: [
        { y: jar.y - 150 * k, alpha: 1, angle: 200, duration: 380, ease: 'Quad.easeOut' },
        { y: jar.y + 20 * s, angle: 360, duration: 360, ease: 'Quad.easeIn' },
        { alpha: 0, duration: 120, onComplete: () => gem.destroy() },
      ],
    });
    h.time.delayedCall(380, () => h.sparkle({ x: jar.x, y: jar.y - 150 * k }, [0xffffff, 0xffd6ea], 4));
  } else if (h.textures.exists('little-fish')) {
    const right = vanity.x + 180 * s;
    const fish = h.add.image(right - 40 * k, vanity.y - 30 * s, 'little-fish').setScale(0.75 * k).setDepth(3.9).setFlipX(false).setAlpha(0);
    sfx(h, 'bubble-breath', { pitch: 'vary', volume: 0.7 });
    h.tweens.chain({
      targets: fish,
      tweens: [
        { x: right + 40 * k, alpha: 1, duration: 420, ease: 'Sine.easeOut' },
        { angle: 8, duration: 160, yoyo: true, repeat: 1 },
        { x: right + 520 * k, y: fish.y - 160 * k, alpha: 0, duration: 900, ease: 'Sine.easeIn', onComplete: () => fish.destroy() },
      ],
    });
    h.time.delayedCall(700, () => breath(h, right + 120 * k, vanity.y - 60 * s, k, 2));
  }
  const c = h.customer;
  if (c) h.time.delayedCall(350, () => c.ch.box.active && giggle(h, c.id));
  h.shown.secret = ((h.shown.secret as number) ?? 0) + 1;
  return true;
}
