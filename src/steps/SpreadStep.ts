import Phaser from 'phaser';
import { burst } from '../core/fx';
import { fit } from '../core/layout';
import { sfx } from '../core/sfx';
import type { SpreadParams } from '../recipes/types';
import { clampToRadius } from './Dish';
import { Step } from './Step';

/**
 * Spreading: paint with one finger over the dish until enough of it is covered.
 * Strokes that stray outside are pulled onto the dish edge, so every stroke paints.
 */
export class SpreadStep extends Step<SpreadParams> {
  private cells: { x: number; y: number; covered: boolean }[] = [];
  private covered = 0;
  private painting = false;
  private last = { x: 0, y: 0 };
  private blobSize = 0;
  private paintR = 0;
  private sinceSound = 0;
  private finishing = false;

  start() {
    const { u, W } = this.layout;
    const R = this.dish.R;
    this.paintR = R * 0.76;
    this.blobSize = R * 0.3;

    const bowl = this.own(this.scene.add.image(0, 0, this.params.source));
    fit(bowl, u * 0.28, u * 0.22);
    bowl.setPosition(Math.min(W - bowl.displayWidth * 0.55, this.dish.x + R * 0.95), this.dish.y - R - bowl.displayHeight * 0.35);
    const bowlScale = bowl.scale;
    bowl.setScale(0);
    this.scene.tweens.add({ targets: bowl, scale: bowlScale, duration: 450, ease: 'Back.easeOut' });

    // Coverage grid over the paintable disc.
    const step = R / 9;
    for (let y = -this.paintR; y <= this.paintR; y += step)
      for (let x = -this.paintR; x <= this.paintR; x += step)
        if (Math.hypot(x, y) <= this.paintR) this.cells.push({ x, y, covered: false });

    this.onDown((p) => {
      if (this.dish.reach(p.worldX, p.worldY) > 1.45) return;
      this.painting = true;
      this.last = { x: p.worldX, y: p.worldY };
      this.paintAt(p.worldX, p.worldY);
      this.dish.flushSauce();
      sfx(this.scene, 'squish', { minGapMs: 150 });
    });
    this.onMove((p) => {
      if (!this.painting) return;
      const d = Phaser.Math.Distance.Between(this.last.x, this.last.y, p.worldX, p.worldY);
      const stepPx = this.blobSize * 0.3 * this.dish.scaleX;
      const n = Math.max(1, Math.ceil(d / stepPx));
      for (let i = 1; i <= n; i++) {
        this.paintAt(Phaser.Math.Linear(this.last.x, p.worldX, i / n), Phaser.Math.Linear(this.last.y, p.worldY, i / n));
      }
      this.dish.flushSauce();
      this.last = { x: p.worldX, y: p.worldY };
      this.sinceSound += d;
      if (this.sinceSound > 140) {
        this.sinceSound = 0;
        sfx(this.scene, 'squish', { minGapMs: 200, volume: 0.5 });
        burst(this.scene, p.worldX, p.worldY, { tint: 0xd8342a, count: 3, size: 16, speed: 250 });
      }
      this.checkDone();
    });
    this.onUp(() => {
      this.painting = false;
    });

    this.setIdle(true);
  }

  private paintAt(wx: number, wy: number) {
    const local = clampToRadius(this.dish.toLocal(wx, wy), this.paintR);
    this.stamp(local.x, local.y);
  }

  private stamp(x: number, y: number) {
    this.dish.stampSauce(this.params.blob, x, y, this.blobSize);
    const reach = this.blobSize * 0.38;
    let gained = false;
    for (const c of this.cells) {
      if (!c.covered && Math.abs(c.x - x) < reach && Math.abs(c.y - y) < reach && Math.hypot(c.x - x, c.y - y) < reach) {
        c.covered = true;
        this.covered++;
        gained = true;
      }
    }
    if (gained) this.poke();
  }

  private get coverage() {
    return this.cells.length ? this.covered / this.cells.length : 1;
  }

  private checkDone() {
    if (!this.finishing && this.coverage >= this.params.coverage) this.finish(400);
  }

  /** Fills the remaining gaps so the result always looks complete, then advances. */
  private finish(duration: number) {
    if (this.finishing) return;
    this.finishing = true;
    this.painting = false;
    // Uncovered cells first, then every cell once more so no thin streaks remain.
    const gaps = [
      ...Phaser.Utils.Array.Shuffle(this.cells.filter((c) => !c.covered)),
      ...Phaser.Utils.Array.Shuffle(this.cells.filter((c) => c.covered)),
    ];
    this.cells.forEach((c) => (c.covered = true));
    this.covered = this.cells.length;
    let i = 0;
    const perTick = Math.max(1, Math.ceil(gaps.length / (duration / 30)));
    const ev = this.scene.time.addEvent({
      delay: 30,
      loop: true,
      callback: () => {
        for (let k = 0; k < perTick && i < gaps.length; k++, i++) this.dish.stampSauce(this.params.blob, gaps[i].x, gaps[i].y, this.blobSize);
        this.dish.flushSauce();
        if (i >= gaps.length) {
          ev.remove();
          this.complete();
        }
      },
    });
  }

  protected showHint() {
    this.hand.circle({ x: this.dish.x, y: this.dish.y }, this.dish.R * 0.55);
  }

  protected autoFinish() {
    sfx(this.scene, 'squish');
    this.finish(1300);
  }
}
