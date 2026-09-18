import Phaser from 'phaser';
import { boing } from '../core/fx';
import { fit } from '../core/layout';
import { sfx } from '../core/sfx';
import type { SprinkleParams } from '../recipes/types';
import { clampToRadius } from './Dish';
import { Step } from './Step';

/**
 * Sprinkling: tap over the dish, or drag across it, and the shaker follows the
 * finger (floating just above it so it stays visible) and showers pieces down.
 */
export class SprinkleStep extends Step<SprinkleParams> {
  private tool!: Phaser.GameObjects.Image;
  private toolRest = { x: 0, y: 0 };
  private toolScale = 1;
  private landed = 0;
  private thrown = 0;
  private active = false;
  private travel = 0;
  private last = { x: 0, y: 0 };
  private pieceSize = 0;
  private done = false;

  start() {
    const { u, W } = this.layout;
    const R = this.dish.R;
    this.pieceSize = R * 0.16;

    this.toolRest = { x: Math.min(W - u * 0.16, this.dish.x + R * 0.9), y: this.dish.y - R - u * 0.1 };
    this.tool = this.own(this.scene.add.image(this.toolRest.x, this.toolRest.y, this.params.tool).setDepth(30));
    fit(this.tool, u * 0.24, u * 0.3);
    this.toolScale = this.tool.scale;
    this.tool.setScale(0);
    this.scene.tweens.add({ targets: this.tool, scale: this.toolScale, duration: 450, ease: 'Back.easeOut' });

    this.onDown((p) => {
      const nearDish = this.dish.reach(p.worldX, p.worldY) < 1.5;
      const nearTool = Phaser.Math.Distance.Between(p.worldX, p.worldY, this.tool.x, this.tool.y) < u * 0.25;
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
      if (this.travel > u * 0.045) {
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

  /** The shaker floats above the finger, tipped over. */
  private hover(x: number, y: number, animate: boolean) {
    const tx = x;
    const ty = y - this.layout.u * 0.2;
    this.scene.tweens.killTweensOf(this.tool);
    this.tool.setScale(this.toolScale);
    if (animate) this.scene.tweens.add({ targets: this.tool, x: tx, y: ty, angle: 160, duration: 140, ease: 'Quad.easeOut' });
    else this.tool.setPosition(tx, ty).setAngle(160);
  }

  private rest() {
    this.scene.tweens.killTweensOf(this.tool);
    this.scene.tweens.add({ targets: this.tool, x: this.toolRest.x, y: this.toolRest.y, angle: 0, scale: this.toolScale, duration: 350, ease: 'Back.easeOut' });
  }

  private shake() {
    this.scene.tweens.add({ targets: this.tool, angle: { from: 145, to: 175 }, duration: 70, yoyo: true, repeat: 2 });
  }

  /** Drops `n` pieces from the shaker onto the dish around the finger. */
  private shower(fx: number, fy: number, n: number) {
    this.poke();
    sfx(this.scene, 'sprinkle', { minGapMs: 140, volume: 0.7 });
    const u = this.layout.u;
    for (let i = 0; i < n; i++) {
      this.thrown++;
      const from = { x: this.tool.x + Phaser.Math.FloatBetween(-1, 1) * u * 0.03, y: this.tool.y + u * 0.08 };
      const aim = this.dish.toLocal(fx + Phaser.Math.FloatBetween(-1, 1) * u * 0.08, fy + Phaser.Math.FloatBetween(-1, 1) * u * 0.08);
      const spot = clampToRadius(aim, this.dish.R * 0.84);
      const fly = this.scene.add.image(from.x, from.y, this.params.piece).setDepth(25).setAngle(Phaser.Math.Between(0, 359));
      fit(fly, this.pieceSize * this.dish.scaleX);
      this.scene.tweens.add({
        targets: fly,
        x: this.dish.x + spot.x * this.dish.scaleX,
        y: this.dish.y + spot.y * this.dish.scaleY,
        angle: fly.angle + Phaser.Math.Between(-90, 90),
        duration: 260 + i * 40,
        ease: 'Quad.easeIn',
        onComplete: () => {
          fly.destroy();
          const piece = this.dish.addSprinkle(this.params.piece, spot.x, spot.y, this.pieceSize);
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
