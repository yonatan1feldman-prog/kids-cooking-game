import Phaser from 'phaser';
import { fit, PALM_ZONE } from './layout';
import { sfx } from './sfx';

/**
 * Big icon button. Reacts instantly on touch (squash + tap sound) and fires on
 * release — even if the finger slid off the button, because small fingers do.
 * The touch area is a circle 25% larger than the image, minus the palm zone.
 */
export function iconButton(
  scene: Phaser.Scene,
  key: string,
  x: number,
  y: number,
  size: number,
  onTap: () => void,
  opts: { pulse?: boolean } = {},
) {
  const img = scene.add.image(x, y, key);
  fit(img, size);
  const rest = img.scale;
  const fw = img.frame.realWidth;
  const fh = img.frame.realHeight;
  img.setInteractive(new Phaser.Geom.Circle(fw / 2, fh / 2, (Math.max(fw, fh) / 2) * 1.25), Phaser.Geom.Circle.Contains);

  let pressed = false;
  let enabled = true;
  let pulse: Phaser.Tweens.Tween | undefined;
  if (opts.pulse) {
    pulse = scene.tweens.add({ targets: img, scale: rest * 1.08, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  }

  img.on(Phaser.Input.Events.GAMEOBJECT_POINTER_DOWN, (p: Phaser.Input.Pointer) => {
    if (!enabled) return;
    // Presses that start where the palm rests never count.
    if (p.y > scene.scale.height * (1 - PALM_ZONE)) return;
    pressed = true;
    pulse?.pause();
    img.setScale(rest * 0.88);
    sfx(scene, 'tap');
  });
  const release = () => {
    if (!pressed) return;
    pressed = false;
    enabled = false;
    scene.tweens.add({ targets: img, scale: rest, duration: 300, ease: 'Back.easeOut' });
    onTap();
    scene.time.delayedCall(400, () => {
      enabled = true;
      pulse?.resume();
    });
  };
  scene.input.on(Phaser.Input.Events.POINTER_UP, release);
  img.once(Phaser.GameObjects.Events.DESTROY, () => {
    scene.input.off(Phaser.Input.Events.POINTER_UP, release);
    pulse?.destroy();
  });
  return img;
}
