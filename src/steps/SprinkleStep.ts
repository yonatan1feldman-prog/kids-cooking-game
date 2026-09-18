import Phaser from 'phaser';
import { boing } from '../core/fx';
import { art } from '../core/layout';
import { sfx } from '../core/sfx';
import type { SprinkleParams } from '../recipes/types';
import { clampToRadius } from './Dish';
import { Step } from './Step';

/**
 * Sprinkling: tap over the dish, or drag across it, and the shaker follows the
 * finger (floating just above it, tipped over, so it stays visible) and showers
 * pieces down. Pieces land where the finger is.
 */
export class SprinkleStep extends Step<SprinkleParams> {
  private tool!: Phaser.GameObjects.Image;
  private toolRest = { x: 0, y: 0 };
  private landed = 0;
  private thrown = 0;
  private active = false;
  private travel = 0;
  private last = { x: 0, y: 0 };
  private done = false;
  private k = 1;

  start() {
    const L = this.layout;
    this.k = L.k;
    this.toolRest = L.P(850, 470);
    this.tool = this.own(art(this.scene.add.image(this.toolRest.x, this.toolRest.y, this.params.tool), L).setDepth(30));
    this.tool.setScale(0);
    this.scene.tweens.add({ targets: this.tool, scale: this.k, duration: 450, ease: 'Back.easeOut' });

    this.onDown((p) => {
      const nearDish = this.dish.reach(p.worldX, p.worldY) < 1.5;
      const nearTool = Phaser.Math.Distance.Between(p.worldX, p.worldY, this.tool.x, this.tool.y) < 260 * this.k;
      if (!nearDish && !nearTool) return;
      this.active = true;
      this.travel = 0;
      this.last = { x: p.worldX, y: p.worldY };
      this.hover(p.worldX, p.worldY, true);
      this.shake();
      this.shower(p.worldX, p.worldY, 4);
    });
    this.onMove((p) => {
      if (!this.active) return;
      this.hover(p.worldX, p.worldY, false);
      this.travel += Phaser.Math.Distance.Between(this.last.x, this.last.y, p.worldX, p.worldY);
      this.last = { x: p.worldX, y: p.worldY };
      if (this.travel > 50 * this.k) {
        this.travel = 0;
        this.shower(p.worldX, p.worldY, 1);
      }
    });
    this.onUp(() => {
      if (!this.active) return;
      this.active = false;
      this.scene.time.delayedCall(250, () => {
        if (!this.active && !this.done) this.rest();
      });
    });

    this.setIdle(true);
  }

  /** The shaker floats above the finger, upside down (holes at the bottom). */
  private hover(x: number, y: number, animate: boolean) {
    const ty = y - 260 * this.k;
    this.scene.tweens.killTweensOf(this.tool);
    this.tool.setScale(this.k);
    if (animate) this.scene.tweens.add({ targets: this.tool, x, y: ty, angle: 180, duration: 140, ease: 'Quad.easeOut' });
    else this.tool.setPosition(x, ty).setAngle(180);
  }

  private rest() {
    this.scene.tweens.killTweensOf(this.tool);
    this.scene.tweens.add({ targets: this.tool, x: this.toolRest.x, y: this.toolRest.y, angle: 0, scale: this.k, duration: 350, ease: 'Back.easeOut' });
  }

  private shake() {
    this.scene.tweens.add({ targets: this.tool, angle: { from: 165, to: 195 }, duration: 70, yoyo: true, repeat: 2 });
  }

  /** Drops `n` pieces from the shaker onto the dish around the finger. */
  private shower(fx: number, fy: number, n: number) {
    this.poke();
    sfx(this.scene, 'sprinkle', { minGapMs: 140, volume: 0.7 });
    const k = this.k;
    for (let i = 0; i < n; i++) {
      this.thrown++;
      const from = { x: this.tool.x + Phaser.Math.FloatBetween(-40, 40) * k, y: this.tool.y + 170 * k };
      const aim = this.dish.toLocal(fx + Phaser.Math.FloatBetween(-90, 90) * k, fy + Phaser.Math.FloatBetween(-90, 90) * k);
      const spot = clampToRadius(aim, this.dish.R * 0.8);
      const land = this.dish.toWorld(spot.x, spot.y);
      const fly = art(this.scene.add.image(from.x, from.y, this.params.piece), this.layout).setDepth(25).setAngle(Phaser.Math.Between(0, 359));
      this.scene.tweens.add({
        targets: fly,
        x: land.x,
        y: land.y,
        angle: fly.angle + Phaser.Math.Between(-90, 90),
        duration: 260 + i * 40,
        ease: 'Quad.easeIn',
        onComplete: () => {
          fly.destroy();
          const piece = this.dish.addSprinkle(this.params.piece, spot.x, spot.y);
          boing(this.scene, piece, 0.3);
          this.landed++;
          if (this.landed >= this.params.count && !this.done) this.finish();
        },
      });
    }
  }

  private finish() {
    this.done = true;
    this.active = false;
    this.rest();
    this.scene.time.delayedCall(300, () => this.complete());
  }

  protected showHint() {
    this.hand.tap({ x: this.dish.x - this.dish.R * 0.3, y: this.dish.y });
  }

  protected autoFinish() {
    const remaining = Math.max(0, this.params.count - this.thrown);
    const n = Math.max(1, Math.ceil(remaining / 3));
    for (let i = 0; i < n; i++) {
      this.scene.time.delayedCall(i * 120, () => {
        const a = (i / n) * Math.PI * 4;
        const r = this.dish.R * this.dish.scaleX * 0.5;
        const x = this.dish.x + Math.cos(a) * r;
        const y = this.dish.y + Math.sin(a) * r;
        this.hover(x, y, false);
        this.shower(x, y, 3);
      });
    }
  }
}
