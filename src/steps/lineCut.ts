import Phaser from 'phaser';

type Pt = { x: number; y: number };

/** What one finger move did to a cut. */
export type CutMove = 'cut' | 'wrong' | 'off' | 'none';

/**
 * A cut that follows the finger (gameplay round 4): the knife cuts only while the finger travels along the cut line,
 * in its direction (from `a` to `b`), near it. The cut's front starts at `a` and moves with the finger, so a stroke can
 * stop and be continued by the next one; a stroke that starts far ahead of the front, goes the other way or runs
 * sideways cuts nothing (the step answers it with a gentle wobble). Generous for a small finger: `band` either side of
 * the line, `maxAngle` degrees off its direction, and `gap` (share of the line) ahead of the front still cuts.
 */
export class LineCut {
  /** How far the cut has come along the line (0 at `a`, 1 at `b`). */
  progress = 0;
  private readonly len: number;
  private readonly ux: number;
  private readonly uy: number;
  private readonly cosMax: number;

  constructor(
    readonly a: Pt,
    readonly b: Pt,
    private readonly band: number,
    private readonly gap = 0.3,
    maxAngle = 35,
  ) {
    this.len = Math.max(1, Phaser.Math.Distance.Between(a.x, a.y, b.x, b.y));
    this.ux = (b.x - a.x) / this.len;
    this.uy = (b.y - a.y) / this.len;
    this.cosMax = Math.cos(Phaser.Math.DegToRad(maxAngle));
  }

  /** Where the finger is along the line (0..1 between the ends, outside that beyond them) and how far from it. */
  measure(p: Pt) {
    const dx = p.x - this.a.x;
    const dy = p.y - this.a.y;
    return { t: (dx * this.ux + dy * this.uy) / this.len, off: Math.abs(dx * this.uy - dy * this.ux) };
  }

  /** Near enough to the line to be cutting it (from a little before its start to a little past its end). */
  near(p: Pt) {
    const m = this.measure(p);
    return m.off <= this.band && m.t > -0.35 && m.t < 1.25;
  }

  /** The cut's front, in world units. */
  point(t = this.progress): Pt {
    return { x: this.a.x + (this.b.x - this.a.x) * t, y: this.a.y + (this.b.y - this.a.y) * t };
  }

  /** One finger move from `from` to `to`. */
  feed(from: Pt, to: Pt): CutMove {
    const mx = to.x - from.x;
    const my = to.y - from.y;
    const d = Math.hypot(mx, my);
    if (d < 0.5) return 'none';
    const cos = (mx * this.ux + my * this.uy) / d;
    if (!this.near(to)) return 'off';
    if (cos <= -this.cosMax) return 'wrong';
    if (cos < this.cosMax) return 'off';
    const t = this.measure(to).t;
    // Only near the front: a stroke that starts far ahead of it (the wrong place) does not cut.
    if (t > this.progress + this.gap && this.measure(from).t > this.progress + this.gap) return 'off';
    const before = this.progress;
    this.progress = Phaser.Math.Clamp(Math.max(this.progress, t), 0, 1);
    return this.progress > before ? 'cut' : 'none';
  }
}

/**
 * The next cut, drawn softly: dots from `a` to `b` with small arrowheads along it pointing the way the knife goes.
 * `strong` while the knife is in her hand (or Mom's hand shows it).
 */
export function drawCutGuide(g: Phaser.GameObjects.Graphics, a: Pt, b: Pt, k: number, strong: boolean) {
  g.clear();
  const d = Phaser.Math.Distance.Between(a.x, a.y, b.x, b.y);
  if (d < 1) return;
  const ux = (b.x - a.x) / d;
  const uy = (b.y - a.y) / d;
  const n = Math.max(2, Math.floor(d / (34 * k)));
  const alpha = strong ? 1 : 0.55;
  for (let i = 0; i <= n; i++) {
    const x = a.x + (b.x - a.x) * (i / n);
    const y = a.y + (b.y - a.y) * (i / n);
    g.fillStyle(0x6b3b1f, 0.35 * alpha).fillCircle(x, y, 7 * k);
    g.fillStyle(0xffffff, 0.85 * alpha).fillCircle(x, y, 4.5 * k);
  }
  // Arrowheads (a soft chevron) a third and two thirds of the way, and one at the end.
  const s = 17 * k;
  for (const f of [0.34, 0.67, 1]) {
    const x = a.x + (b.x - a.x) * f + ux * 6 * k;
    const y = a.y + (b.y - a.y) * f + uy * 6 * k;
    const l = { x: x - ux * s - uy * s * 0.8, y: y - uy * s + ux * s * 0.8 };
    const r = { x: x - ux * s + uy * s * 0.8, y: y - uy * s - ux * s * 0.8 };
    g.lineStyle(9 * k, 0x6b3b1f, 0.3 * alpha).beginPath().moveTo(l.x, l.y).lineTo(x, y).lineTo(r.x, r.y).strokePath();
    g.lineStyle(5 * k, 0xffffff, 0.9 * alpha).beginPath().moveTo(l.x, l.y).lineTo(x, y).lineTo(r.x, r.y).strokePath();
  }
}
