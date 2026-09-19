import Phaser from 'phaser';
import { art, inNoTouchZone, type Layout } from './layout';
import { sfx } from './sfx';

/** True if some other finger is already on the screen (a second finger or a resting palm). */
export function otherPointerDown(scene: Phaser.Scene, p: Phaser.Input.Pointer) {
  return scene.input.manager.pointers.some((q) => q !== p && q.isDown);
}

/** With `confirm`, the second tap must come within this long after the first. */
export const CONFIRM_MS = 2000;

/**
 * Big icon button. Touch area: a circle reaching `hitPad` world units beyond the art
 * (default 60), minus the no-touch zones. It reacts instantly on touch (squash + tap sound).
 * It fires on press by default (fastest feedback). `fireOn: 'up'` fires on release instead,
 * which the browser requires for fullscreen / audio unlock / wake lock; a release
 * anywhere counts, because small fingers slide.
 * `confirm`: the first tap only arms it (it grows and wobbles); a second tap within
 * CONFIRM_MS fires, otherwise it shrinks back. Two separate taps, never a long press.
 * `scale` overrides the image scale (default: the content scale k).
 * A press while another finger is already down is ignored.
 */
export function iconButton(
  scene: Phaser.Scene,
  layout: Layout,
  key: string,
  x: number,
  y: number,
  onTap: () => void,
  opts: { pulse?: boolean; fireOn?: 'down' | 'up'; hitPad?: number; confirm?: boolean; scale?: number } = {},
) {
  const img = art(scene.add.image(x, y, key), layout);
  if (opts.scale) img.setScale(opts.scale);
  const rest = img.scale;
  const fw = img.frame.realWidth;
  const fh = img.frame.realHeight;
  // The hit circle is in texture space: convert the pad from world units.
  const pad = ((opts.hitPad ?? 60) * layout.k) / rest;
  img.setInteractive(new Phaser.Geom.Circle(fw / 2, fh / 2, Math.max(fw, fh) / 2 + pad), Phaser.Geom.Circle.Contains);

  const fireOn = opts.fireOn ?? 'down';
  let pressed: Phaser.Input.Pointer | null = null;
  let enabled = true;
  let pulse: Phaser.Tweens.Tween | undefined;
  if (opts.pulse) {
    pulse = scene.tweens.add({ targets: img, scale: rest * 1.08, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  }

  // Confirm mode: armed after the first tap, until the timer runs out.
  let armed: { timer: Phaser.Time.TimerEvent; wobble: Phaser.Tweens.Tween } | null = null;
  const ARMED = 1.4;
  const disarm = () => {
    if (!armed) return;
    armed.timer.remove();
    armed.wobble.destroy();
    armed = null;
    scene.tweens.add({ targets: img, scale: rest, angle: 0, duration: 250, ease: 'Sine.easeOut' });
  };
  const arm = () => {
    scene.tweens.killTweensOf(img);
    img.setScale(rest * ARMED * 0.86);
    scene.tweens.add({ targets: img, scale: rest * ARMED, duration: 320, ease: 'Back.easeOut' });
    const wobble = scene.tweens.add({ targets: img, angle: { from: -12, to: 12 }, duration: 160, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    armed = { timer: scene.time.delayedCall(CONFIRM_MS, disarm), wobble };
  };

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
    // Presses that start where the palm or the thumbs rest, or while another finger is down, never count.
    if (inNoTouchZone(scene, p.x, p.y)) return;
    if (otherPointerDown(scene, p)) return;
    pulse?.pause();
    sfx(scene, 'tap');
    if (opts.confirm) {
      if (!armed) return arm();
      armed.timer.remove();
      armed.wobble.destroy();
      armed = null;
      img.setAngle(0);
      return fire();
    }
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
