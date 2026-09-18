import Phaser from 'phaser';
import { art, PALM_ZONE, type Layout } from './layout';
import { sfx } from './sfx';

/** True if some other finger is already on the screen (a second finger or a resting palm). */
export function otherPointerDown(scene: Phaser.Scene, p: Phaser.Input.Pointer) {
  return scene.input.manager.pointers.some((q) => q !== p && q.isDown);
}

/**
 * Big icon button shown at the uniform art scale. Touch area: a circle reaching `hitPad`
 * design px beyond the art (default 60, about 0.4 cm), minus the palm zone. It reacts instantly on touch (squash + tap sound).
 * It fires on press by default (fastest feedback). `fireOn: 'up'` fires on release instead,
 * which the browser requires for fullscreen / audio unlock / wake lock; a release
 * anywhere counts, because small fingers slide.
 * A press while another finger is already down is ignored.
 */
export function iconButton(
  scene: Phaser.Scene,
  layout: Layout,
  key: string,
  x: number,
  y: number,
  onTap: () => void,
  opts: { pulse?: boolean; fireOn?: 'down' | 'up'; hitPad?: number } = {},
) {
  const img = art(scene.add.image(x, y, key), layout);
  const rest = img.scale;
  const fw = img.frame.realWidth;
  const fh = img.frame.realHeight;
  img.setInteractive(new Phaser.Geom.Circle(fw / 2, fh / 2, Math.max(fw, fh) / 2 + (opts.hitPad ?? 60)), Phaser.Geom.Circle.Contains);

  const fireOn = opts.fireOn ?? 'down';
  let pressed: Phaser.Input.Pointer | null = null;
  let enabled = true;
  let pulse: Phaser.Tweens.Tween | undefined;
  if (opts.pulse) {
    pulse = scene.tweens.add({ targets: img, scale: rest * 1.08, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  }

  const fire = () => {
    enabled = false;
    onTap();
    scene.time.delayedCall(400, () => {
      enabled = true;
      pulse?.resume();
    });
  };

  img.on(Phaser.Input.Events.GAMEOBJECT_POINTER_DOWN, (p: Phaser.Input.Pointer) => {
    if (!enabled || pressed) return;
    // Presses that start where the palm rests, or while another finger is down, never count.
    if (p.y > scene.scale.height * (1 - PALM_ZONE)) return;
    if (otherPointerDown(scene, p)) return;
    pulse?.pause();
    sfx(scene, 'tap');
    scene.tweens.add({ targets: img, scale: { from: rest * 0.86, to: rest }, duration: 320, ease: 'Back.easeOut' });
    if (fireOn === 'down') fire();
    else pressed = p;
  });
  const release = (p: Phaser.Input.Pointer) => {
    if (!pressed || p !== pressed) return;
    pressed = null;
    if (!p.wasCanceled) fire();
    else pulse?.resume();
  };
  scene.input.on(Phaser.Input.Events.POINTER_UP, release);
  scene.input.on(Phaser.Input.Events.POINTER_UP_OUTSIDE, release);
  img.once(Phaser.GameObjects.Events.DESTROY, () => {
    scene.input.off(Phaser.Input.Events.POINTER_UP, release);
    scene.input.off(Phaser.Input.Events.POINTER_UP_OUTSIDE, release);
    pulse?.destroy();
  });
  return img;
}
