import Phaser from 'phaser';
import { SAUCE_RED } from '../core/assets';
import { burst } from '../core/fx';
import type { HandMotion } from '../core/hand';
import { art } from '../core/layout';
import { sfx } from '../core/sfx';
import type { SpreadParams } from '../recipes/types';
import { clampToRadius } from './Dish';
import { Step } from './Step';

/**
 * Spreading: paint with one finger over the dish until enough of it is covered, then
 * the game fills the rest. Strokes that stray outside are pulled onto the dish, so
 * every stroke paints. The crust rim stays visible around the sauce.
 */
export class SpreadStep extends Step<SpreadParams> {
  protected stepLine = 'vo-sauce' as const;
  private cells: { x: number; y: number; covered: boolean }[] = [];
  private covered = 0;
  private painting = false;
  private last = { x: 0, y: 0 };
  private brush = 0;
  private paintR = 0;
  private sinceSound = 0;
  private finishing = false;

  start() {
    const L = this.layout;
    const R = this.dish.R;
    this.paintR = R * 0.68;
    this.brush = R * 0.42;

    const bowlAt = this.ctx.stage.bowl;
    // The sauce she stirred, if the step before left its bowl here; else the bowl pops in.
    if (!this.adopt(this.params.source)) {
      const bowl = this.own(art(this.scene.add.image(bowlAt.x, bowlAt.y, this.params.source), L));
      bowl.setScale(0);
      this.scene.tweens.add({ targets: bowl, scale: L.k, duration: 450, ease: 'Back.easeOut' });
    }

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
      burst(this.scene, p.worldX, p.worldY, { tint: SAUCE_RED, count: 4, size: 18 * L.k, speed: 250 * L.k });
    });
    this.onMove((p) => {
      if (!this.painting) return;
      const d = Phaser.Math.Distance.Between(this.last.x, this.last.y, p.worldX, p.worldY);
      const n = Math.max(1, Math.ceil(d / (this.brush * 0.3 * this.dish.scaleX)));
      for (let i = 1; i <= n; i++) {
        this.paintAt(Phaser.Math.Linear(this.last.x, p.worldX, i / n), Phaser.Math.Linear(this.last.y, p.worldY, i / n));
      }
      this.dish.flushSauce();
      this.last = { x: p.worldX, y: p.worldY };
      this.sinceSound += d;
      if (this.sinceSound > 140 * L.k) {
        this.sinceSound = 0;
        sfx(this.scene, 'squish', { minGapMs: 200, volume: 0.5 });
        burst(this.scene, p.worldX, p.worldY, { tint: SAUCE_RED, count: 3, size: 16 * L.k, speed: 250 * L.k });
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
    this.dish.stampSauce(x, y, this.brush);
    const reach = this.brush * 0.4;
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
        for (let k = 0; k < perTick && i < gaps.length; k++, i++) this.dish.stampSauce(gaps[i].x, gaps[i].y, this.brush);
        this.dish.flushSauce();
        if (i >= gaps.length) {
          ev.remove();
          this.complete();
        }
      },
    });
  }

  /** Mom's spoon circles over the dough (nothing is painted: that is the child's job). */
  protected demo(): HandMotion {
    const { x, y } = this.dish;
    const r = this.dish.R * 0.45;
    const keys = [];
    for (let i = 0; i <= 10; i++) {
      const a = -Math.PI / 2 + (i / 10) * Math.PI * 2 * 1.25;
      const rr = r * (0.55 + 0.45 * Math.sin(i * 0.9));
      keys.push({ x: x + Math.cos(a) * rr, y: y + Math.sin(a) * rr, t: 150 + i * 210 });
    }
    keys.unshift({ ...keys[0], t: 0 });
    keys.push({ ...keys[keys.length - 1], t: 2450 });
    return { kind: 'spread', keys, glow: this.dish };
  }

  /** Mom helps: her spoon circles while the rest of the sauce fills in. */
  protected autoFinish() {
    sfx(this.scene, 'squish');
    const t0 = this.scene.time.now;
    const r = this.dish.R * 0.4;
    this.hand.follow('spread', () => {
      const a = (this.scene.time.now - t0) / 220;
      return { x: this.dish.x + Math.cos(a) * r, y: this.dish.y + Math.sin(a) * r };
    });
    this.finish(1300);
  }
}
