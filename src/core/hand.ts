import Phaser from 'phaser';
import { fit, type Layout } from './layout';

type P = { x: number; y: number };

/**
 * The guiding hand. Demonstrates a gesture in a loop until stopped.
 * The fingertip is the image's top-center area (origin 0.5, 0.08).
 */
export class HandHint {
  private img: Phaser.GameObjects.Image;
  private tweens: (Phaser.Tweens.Tween | Phaser.Tweens.TweenChain)[] = [];
  private restScale: number;

  constructor(private scene: Phaser.Scene, layout: Layout) {
    this.img = scene.add.image(0, 0, 'hand-hint').setOrigin(0.5, 0.08).setDepth(1000).setVisible(false);
    fit(this.img, layout.u * 0.2, layout.u * 0.24);
    this.restScale = this.img.scale;
  }

  get active() {
    return this.img.visible;
  }

  stop() {
    this.tweens.forEach((t) => t.destroy());
    this.tweens = [];
    this.img.setVisible(false);
  }

  private begin(at: P) {
    this.stop();
    this.img.setPosition(at.x, at.y).setScale(this.restScale).setAlpha(0).setVisible(true);
  }

  /** Repeated taps on a point. */
  tap(at: P) {
    this.begin(at);
    const s = this.restScale;
    this.tweens.push(
      this.scene.tweens.chain({
        targets: this.img,
        loop: -1,
        tweens: [
          { alpha: 1, duration: 250 },
          { scale: s * 0.8, duration: 180, yoyo: true, repeat: 1, repeatDelay: 120 },
          { alpha: 0.9, duration: 500 },
        ],
      }),
    );
  }

  /** Press at `from`, carry to `to`, release, repeat. */
  drag(from: P, to: P) {
    this.begin(from);
    const s = this.restScale;
    this.tweens.push(
      this.scene.tweens.chain({
        targets: this.img,
        loop: -1,
        loopDelay: 300,
        tweens: [
          { alpha: 1, x: from.x, y: from.y, duration: 250 },
          { scale: s * 0.85, duration: 180 },
          { x: to.x, y: to.y, duration: 1100, ease: 'Sine.easeInOut' },
          { scale: s, duration: 180 },
          { alpha: 0, duration: 250 },
        ],
      }),
    );
  }

  /** Rub back and forth across a point. */
  rub(at: P, width: number) {
    this.begin(at);
    this.img.setScale(this.restScale * 0.85);
    this.tweens.push(this.scene.tweens.add({ targets: this.img, alpha: 1, duration: 250 }));
    this.tweens.push(
      this.scene.tweens.add({
        targets: this.img,
        x: { from: at.x - width / 2, to: at.x + width / 2 },
        duration: 450,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      }),
    );
  }

  /** Paint-like circling over an area. */
  circle(at: P, radius: number) {
    this.begin(at);
    this.img.setScale(this.restScale * 0.85);
    this.tweens.push(this.scene.tweens.add({ targets: this.img, alpha: 1, duration: 250 }));
    this.tweens.push(
      this.scene.tweens.addCounter({
        from: 0,
        to: Math.PI * 2,
        duration: 1400,
        repeat: -1,
        onUpdate: (tw) => {
          const a = tw.getValue() ?? 0;
          const r = radius * (0.55 + 0.45 * Math.sin(a * 1.5));
          this.img.setPosition(at.x + Math.cos(a) * r, at.y + Math.sin(a) * r);
        },
      }),
    );
  }

  destroy() {
    this.stop();
    this.img.destroy();
  }
}
