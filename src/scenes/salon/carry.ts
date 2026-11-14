import Phaser from 'phaser';
import * as paper from '../../core/paper';
import { sway } from '../../core/juice';
import { TUNING } from '../../core/tuning';
import type { P } from '../MiniGame';

type Thing = Phaser.GameObjects.Image;

/**
 * A thing of the column in her finger (the salon's tools and items, research/mermaid-dressup-spec.md 5): it lifts on the
 * touch (paper), follows the finger (held a little above it, so she sees it), sways as it moves, and goes back to its
 * plate when she lets it go. A finger that moves less than TUNING.salon.drag is a tap, not a carry (`dragging`).
 * `things` move together (the spray and its cap, the two halves of a hair style), the first one leads.
 */
export class Carry {
  readonly home: P[];
  private readonly start: P;
  private readonly lift: number;
  /** How far the finger has gone since the touch (world units). */
  travel = 0;
  dragging = false;
  last: P;
  constructor(private scene: Phaser.Scene, readonly things: Thing[], at: P, private k: number, opts: { lift?: number } = {}) {
    this.home = things.map((t) => ({ x: t.x, y: t.y }));
    this.start = { ...at };
    this.last = { ...at };
    this.lift = (opts.lift ?? 70) * k;
    things.forEach((t, i) => {
      t.setData('carried', true);
      t.setDepth(700 + i);
      paper.lift(scene, t, { sound: i === 0 });
    });
  }

  /** Where the thing is now (the lead's centre). */
  get at(): P {
    return { x: this.things[0].x, y: this.things[0].y };
  }

  /** The finger moved: the things follow (once it is a carry), the distance this move covered. */
  move(p: P): number {
    const d = Math.hypot(p.x - this.last.x, p.y - this.last.y);
    this.travel += d;
    const dx = p.x - this.last.x;
    this.last = { ...p };
    if (!this.dragging && Math.hypot(p.x - this.start.x, p.y - this.start.y) >= TUNING.salon.drag * this.k) this.dragging = true;
    if (!this.dragging) return 0;
    const lead = this.home[0];
    this.things.forEach((t, i) => {
      t.setPosition(p.x + (this.home[i].x - lead.x), p.y - this.lift + (this.home[i].y - lead.y));
    });
    sway(this.scene, this.things[0], dx, this.k);
    return d;
  }

  /** Back to its plate (put down there with paper's drop), then `then`. */
  back(then?: () => void) {
    this.things.forEach((t, i) => {
      t.setData('carried', false);
      this.scene.tweens.killTweensOf(t);
      this.scene.tweens.add({
        targets: t,
        x: this.home[i].x,
        y: this.home[i].y,
        angle: 0,
        duration: 260,
        ease: 'Quad.easeOut',
        onComplete: () => {
          t.setDepth(21 + i);
          paper.drop(this.scene, t, { sound: i === 0 });
          if (i === 0) then?.();
        },
      });
    });
  }
}
