import Phaser from 'phaser';
import { boing, puff, stars } from '../core/fx';
import { fit } from '../core/layout';
import { sfx } from '../core/sfx';
import type { BakeParams } from '../recipes/types';
import { Step } from './Step';

type Phase = 'toOven' | 'baking' | 'ready' | 'out';

/**
 * Baking: drag the dish up into the open oven. The oven closes, glows and
 * shakes while baking, then dings. A tap opens it and the dish comes out golden.
 */
export class BakeStep extends Step<BakeParams> {
  private oven!: Phaser.GameObjects.Image;
  private ovenScale = 1;
  private phase: Phase = 'toOven';
  private dragging = false;
  private grab = { dx: 0, dy: 0 };
  private dishRest = { x: 0, y: 0, scale: 1 };
  private bakeTweens: Phaser.Tweens.Tween[] = [];

  start() {
    const { u, H, safeBottom } = this.layout;
    const R = this.dish.R;

    this.oven = this.own(this.scene.add.image(this.layout.cx, 0, this.params.open).setDepth(5));
    fit(this.oven, u * 0.62);
    this.oven.setY(H * 0.1 + this.oven.displayHeight / 2);
    this.ovenScale = this.oven.scale;
    this.oven.setScale(0);
    this.scene.tweens.add({ targets: this.oven, scale: this.ovenScale, duration: 450, ease: 'Back.easeOut' });

    const ovenBottom = this.oven.y + (this.oven.frame.realHeight * this.ovenScale) / 2;
    const scale = Math.min(0.8, (safeBottom - ovenBottom - u * 0.08) / (R * 2));
    this.dishRest = { x: this.layout.cx, y: ovenBottom + u * 0.06 + R * scale, scale };
    this.dish.setDepth(10);
    this.scene.tweens.add({ targets: this.dish, x: this.dishRest.x, y: this.dishRest.y, scale, duration: 500, ease: 'Sine.easeInOut' });

    this.onDown((p) => {
      if (this.phase === 'toOven' && this.dish.reach(p.worldX, p.worldY) < 1.3) {
        this.dragging = true;
        this.grab = { dx: this.dish.x - p.worldX, dy: this.dish.y - p.worldY };
        this.scene.tweens.killTweensOf(this.dish);
        this.dish.setScale(this.dishRest.scale * 1.06);
        sfx(this.scene, 'tap');
        this.poke();
      } else if (this.phase === 'ready' && this.nearOven(p.worldX, p.worldY, 1.0)) {
        this.openOven();
      }
    });
    this.onMove((p) => {
      if (!this.dragging) return;
      this.dish.setPosition(p.worldX + this.grab.dx, p.worldY + this.grab.dy);
      this.poke();
    });
    this.onUp(() => {
      if (!this.dragging) return;
      this.dragging = false;
      // Forgiving: anywhere in the upper part of the screen or near the oven counts.
      if (this.dish.y < this.dishRest.y - u * 0.2 || this.nearOven(this.dish.x, this.dish.y, 1.1)) this.intoOven();
      else {
        sfx(this.scene, 'whoosh', { volume: 0.4 });
        this.scene.tweens.add({ targets: this.dish, ...this.dishRest, duration: 400, ease: 'Back.easeOut' });
      }
    });

    this.setIdle(true);
  }

  private nearOven(x: number, y: number, k: number) {
    return Phaser.Math.Distance.Between(x, y, this.oven.x, this.oven.y) < this.oven.displayWidth * 0.5 * k + this.layout.u * 0.05;
  }

  private intoOven() {
    this.phase = 'baking';
    this.setIdle(false);
    sfx(this.scene, 'whoosh');
    this.scene.tweens.add({
      targets: this.dish,
      x: this.oven.x,
      y: this.oven.y + this.oven.displayHeight * 0.08,
      scale: (this.oven.displayWidth * 0.3) / (this.dish.R * 2),
      duration: 450,
      ease: 'Quad.easeIn',
      onComplete: () => {
        this.dish.setVisible(false);
        this.oven.setTexture(this.params.closed);
        fit(this.oven, this.layout.u * 0.62);
        this.ovenScale = this.oven.scale;
        boing(this.scene, this.oven, 0.08);
        this.bake();
      },
    });
  }

  /** Glow + wobble + steam while the tint of the dish changes inside. */
  private bake() {
    const glow = { t: 0 };
    const from = Phaser.Display.Color.ValueToColor(0xffffff);
    const to = Phaser.Display.Color.ValueToColor(0xffa860);
    this.bakeTweens.push(
      this.scene.tweens.add({
        targets: glow,
        t: 1,
        duration: this.params.bakeMs / 2,
        yoyo: true,
        ease: 'Sine.easeInOut',
        onUpdate: () => {
          const c = Phaser.Display.Color.Interpolate.ColorWithColor(from, to, 100, glow.t * 100);
          this.oven.setTint(Phaser.Display.Color.GetColor(c.r, c.g, c.b));
        },
      }),
      this.scene.tweens.add({ targets: this.oven, angle: { from: -1.5, to: 1.5 }, duration: 120, yoyo: true, repeat: -1 }),
    );
    const steam = this.scene.time.addEvent({
      delay: 280,
      loop: true,
      callback: () => puff(this.scene, this.oven.x + Phaser.Math.Between(-60, 60), this.oven.y - this.oven.displayHeight * 0.45, 0xffffff, 2, this.layout.u * 0.08),
    });
    this.scene.time.delayedCall(this.params.bakeMs, () => {
      steam.remove();
      this.bakeTweens.forEach((t) => t.destroy());
      this.oven.setAngle(0).clearTint();
      this.dish.tintAll(this.params.bakedTint, 0xfff0dc);
      sfx(this.scene, 'oven-ding', { vary: false });
      boing(this.scene, this.oven, 0.15);
      stars(this.scene, this.oven.x, this.oven.y - this.oven.displayHeight * 0.4, 6, this.layout.u * 0.05);
      this.phase = 'ready';
      this.bakeTweens.push(
        this.scene.tweens.add({ targets: this.oven, scale: this.ovenScale * 1.05, duration: 500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' }),
      );
      this.setIdle(true);
    });
  }

  private openOven() {
    if (this.phase !== 'ready') return;
    this.phase = 'out';
    this.setIdle(false);
    this.bakeTweens.forEach((t) => t.destroy());
    this.oven.setTexture(this.params.open);
    fit(this.oven, this.layout.u * 0.62);
    sfx(this.scene, 'whoosh');
    puff(this.scene, this.oven.x, this.oven.y, 0xffffff, 10, this.layout.u * 0.12);
    this.dish.setVisible(true);
    this.scene.tweens.add({
      targets: this.dish,
      x: this.ctx.dishHome.x,
      y: this.ctx.dishHome.y,
      scale: 1,
      duration: 700,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.dish.setDepth(0);
        sfx(this.scene, 'pop');
        stars(this.scene, this.dish.x, this.dish.y, 12, this.layout.u * 0.06);
        this.scene.time.delayedCall(500, () => this.complete());
      },
    });
  }

  protected showHint() {
    if (this.phase === 'toOven') this.hand.drag({ x: this.dish.x, y: this.dish.y }, { x: this.oven.x, y: this.oven.y });
    else if (this.phase === 'ready') this.hand.tap({ x: this.oven.x, y: this.oven.y });
  }

  protected autoFinish() {
    if (this.phase === 'toOven') {
      this.dragging = false;
      // The oven finishes on its own; after it dings the child gets a fresh chance to tap.
      this.resumeAfterAuto();
      this.intoOven();
    } else if (this.phase === 'ready') {
      this.resumeAfterAuto();
      this.openOven();
    }
  }
}
