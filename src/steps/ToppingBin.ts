import Phaser from 'phaser';
import type { ImageKey } from '../core/assets';
import { boing } from '../core/fx';
import { sfx } from '../core/sfx';
import type { StepContext } from './Step';

/**
 * The topping bin a prep step fills (the cut slices, the poured corn): a `topping-bin` with its topping drawn on it,
 * exactly as in decorating. It is left for the next steps under `binKey(topping)` in `run.handoff` (the icon rides
 * along as the bin's data 'icon'). While more prep follows it waits small in the left column (`stage.binWait`, only
 * on wide screens), otherwise it slides off to the left, hidden. Decorating adopts the bins and shows them big.
 */
export const binKey = (topping: string) => `bin:${topping}`;

/** The topping on its bin: 140 on 240, as big as in decorating (bin 0.9, topping 1.0). */
const ICON = 1.1;

export function makeBin(scene: Phaser.Scene, bin: ImageKey, topping: ImageKey, x: number, y: number, scale: number) {
  const img = scene.add.image(x, y, bin).setScale(scale).setDepth(20);
  const icon = scene.add.image(x, y - 8 * scale, topping).setScale(scale * ICON).setDepth(20.1);
  img.setData('icon', icon);
  img.once(Phaser.GameObjects.Events.DESTROY, () => icon.destroy());
  return img;
}

export const binIcon = (bin: Phaser.GameObjects.Image) => bin.getData('icon') as Phaser.GameObjects.Image | undefined;

/** Moves (and resizes) the bin with its topping. */
export function moveBin(scene: Phaser.Scene, bin: Phaser.GameObjects.Image, x: number, y: number, scale: number, ms: number, onComplete?: () => void) {
  const icon = binIcon(bin);
  scene.tweens.add({ targets: bin, x, y, scale, duration: ms, ease: 'Sine.easeInOut', onComplete });
  if (icon) scene.tweens.add({ targets: icon, x, y: y - 8 * scale, scale: scale * ICON, duration: ms, ease: 'Sine.easeInOut' });
}

export function setBinVisible(bin: Phaser.GameObjects.Image, on: boolean) {
  bin.setVisible(on);
  binIcon(bin)?.setVisible(on);
}

/** How many filled bins are already waiting (from earlier prep steps of this run). */
export function binsWaiting(ctx: StepContext) {
  return [...ctx.run.handoff.keys()].filter((k) => k.startsWith('bin:')).length;
}

/** The pieces fly into the bin one after another (a pop and a little bounce of the bin for some of them). */
export function fillBin(scene: Phaser.Scene, bin: Phaser.GameObjects.Image, pieces: Phaser.GameObjects.Image[], onDone: () => void) {
  const every = Math.min(110, 900 / Math.max(1, pieces.length));
  pieces.forEach((p, i) => {
    scene.tweens.add({
      targets: p,
      x: bin.x + Phaser.Math.FloatBetween(-20, 20) * bin.scale,
      y: bin.y - 10 * bin.scale,
      scale: p.scale * 0.45,
      alpha: 0,
      delay: i * every,
      duration: 320,
      ease: 'Quad.easeIn',
      onComplete: () => {
        p.destroy();
        if (i % 2 === 0 || i === pieces.length - 1) {
          sfx(scene, 'pop', { volume: 0.6, minGapMs: 80 });
          boing(scene, bin, 0.08);
        }
      },
    });
  });
  scene.time.delayedCall(pieces.length * every + 420, onDone);
}

/**
 * The filled bin goes to wait: to its spot in the left column on wide screens, else it slides off to the left and
 * hides until decorating. `index` = how many bins were waiting before it.
 */
export function parkBin(ctx: StepContext, bin: Phaser.GameObjects.Image, index: number, onDone: () => void) {
  const spot = ctx.stage.binWait(index);
  const s = ctx.scene;
  if (spot) return moveBin(s, bin, spot.x, spot.y, spot.scale, 600, onDone);
  moveBin(s, bin, -200 * ctx.layout.k, bin.y, bin.scale * 0.6, 600, () => {
    setBinVisible(bin, false);
    onDone();
  });
}
