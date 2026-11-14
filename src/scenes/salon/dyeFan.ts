import Phaser from 'phaser';
import * as paper from '../../core/paper';
import { DYE, DYE_HEX, hexOf, type Dye } from '../../core/salon';
import type { P } from '../MiniGame';
import type { Cell, SeaSalon } from '../SeaSalon';

/** How long the fan stays open after the last touch on it or on the spray (ms). */
const OPEN_MS = 3000;

interface Drop {
  dye: Dye;
  x: number;
  y: number;
  r: number;
  things: Phaser.GameObjects.Image[];
}

/**
 * Salon review A3: the spray's colours, all six in view. Touching the spray opens a fan of six little paint shells in a
 * gentle arc just inside the room, beside the column (never over it); a tap on one is that colour (the stage's `pick`). It
 * closes by itself OPEN_MS after the last touch, and at the stage's end. A tap on the spray itself still goes to the next
 * colour, as before (Mom's hint and help do that).
 */
export class DyeFan {
  private drops: Drop[] = [];
  private timer: Phaser.Time.TimerEvent | null = null;

  constructor(
    private h: SeaSalon,
    private pick: (d: Dye) => void,
  ) {}

  get open() {
    return this.drops.length > 0;
  }

  /** Opens the fan by the spray's cell (or keeps it open a little longer). */
  show(cell: Cell) {
    this.keep();
    if (this.open) return;
    const h = this.h;
    const k = h.k;
    const room = h.table.salon.room;
    const H = h.scale.height;
    // six shells in a gentle arc just inside the room (bulging toward her), centred on the spray's height
    const n = DYE.length;
    const d = Math.min(220 * cell.s * 0.72, (H - 60 * k) / (n * 1.12));
    const ps = d / 220;
    const gap = d * 1.12;
    const x0 = room.x0 + d * 0.6;
    const pts = DYE.map((_, i) => {
      const u = (i - (n - 1) / 2) / ((n - 1) / 2);
      return { x: x0 + (1 - u * u) * d * 0.5, y: cell.y + (i - (n - 1) / 2) * gap };
    });
    // (kept on the screen: the whole arc moves up or down if it would leave it)
    const lo = d / 2 + 12 * k;
    const hi = H - d / 2 - 12 * k;
    const top = Math.min(...pts.map((q) => q.y));
    const bottom = Math.max(...pts.map((q) => q.y));
    const dy = top < lo ? lo - top : bottom > hi ? hi - bottom : 0;
    this.drops = DYE.map((dye, i) => {
      const q = { x: pts[i].x, y: pts[i].y + dy };
      const plate = h.add.image(q.x, q.y, 'shell-paint').setScale(ps).setDepth(19);
      const blob = h.add.image(q.x, q.y, 'paint-blob').setScale(ps).setDepth(19.1).setTint(hexOf(DYE_HEX[dye]));
      const things = [plate, blob];
      things.forEach((t) => paper.appear(h, t, i));
      return { dye, x: q.x, y: q.y, r: d * 0.62, things };
    });
  }

  /** The colour under the finger, if it is on one of the fan's shells: it is picked (the shell hops), the fan stays. */
  hit(at: P): Dye | null {
    if (!this.open) return null;
    let best: Drop | null = null;
    let bd = Infinity;
    for (const q of this.drops) {
      const dd = Math.hypot(at.x - q.x, at.y - q.y);
      if (dd <= q.r && dd < bd) (bd = dd), (best = q);
    }
    if (!best) return null;
    for (const t of best.things) paper.press(this.h, t);
    this.keep();
    this.pick(best.dye);
    return best.dye;
  }

  /** Closes it (the shells fade away). */
  close() {
    this.timer?.remove();
    this.timer = null;
    for (const q of this.drops) for (const t of q.things) if (t.active) paper.vanish(this.h, t);
    this.drops = [];
  }

  private keep() {
    this.timer?.remove();
    this.timer = this.h.time.delayedCall(OPEN_MS, () => this.close());
  }
}
