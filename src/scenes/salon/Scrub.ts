import Phaser from 'phaser';
import { FX_SOFT } from '../../core/assets';
import { stars } from '../../core/fx';
import { tapMotion, type HandMotion } from '../../core/hand';
import { byVisit } from '../../core/sea';
import { ART_SALON } from '../../core/salonAssets';
import { delight, surprise } from '../../core/salonDress';
import { sfx } from '../../core/sfx';
import { TUNING } from '../../core/tuning';
import { visits, type P } from '../MiniGame';
import type { SalonPlan, SalonStage, SeaSalon } from '../SeaSalon';
import { Carry } from './carry';

const T = TUNING.salon;
/** Which two of the four open spots of sand (cheek, shoulder, arm, tail: ART_SALON.sandSpots 1-4), by visit. */
const PAIRS: readonly (readonly [number, number])[] = [[1, 3], [2, 4], [1, 4], [2, 3], [3, 4], [1, 2]];
/** The forehead's spot (index 0): hard only, under her fringe. */
const HIDDEN = 0;

/** Where a spot of sand sits on her frame (hard's hidden one higher up, under her fringe: only its edge peeks out). */
const spotPoint = (i: number) => {
  const p = ART_SALON.sandSpots[i];
  return i === HIDDEN ? { x: p.x, y: p.y - 44 } : p;
};
type Spot = { i: number; img: Phaser.GameObjects.Image; dirt: number; hidden: boolean; bubbleAt: number };
type Weed = { img: Phaser.GameObjects.Image; at: P };

/**
 * The splash (spec 5.1): she comes from a swim with a little sand on her (two spots; hard: three, one under her fringe)
 * and two bits of seaweed in her hair. The sponge (drag it, rub a spot: it fades, soap bubbles) and the shell shower (tap
 * it: water from above, she shakes her head, the last of the sand washes off). A tap plucks a bit of seaweed; on hard a
 * tap on her hair lifts the fringe ("Something's hiding under her hair!"). The shower helps too: three showers clean
 * everything. Then "All clean and fresh!" and the done button (which also comes after one thing done, or 15 s).
 */
export class Scrub implements SalonStage {
  readonly id = 'scrub' as const;
  readonly free = false;
  readonly hasDone = true;
  private spots: Spot[] = [];
  private weeds: Weed[] = [];
  private carry: Carry | null = null;
  private lifted = false;
  private rinsed = false;
  private showering = false;
  private toldRinse = false;
  private ended = false;

  constructor(private h: SeaSalon) {}

  private get c() {
    return this.h.customer!;
  }
  private get sc() {
    return this.h.table.salon.seat.scale;
  }

  begin() {
    const h = this.h;
    const c = h.customer;
    if (!c) return h.stageOver(0);
    const hard = h.lvl === 2;
    const pair = byVisit(PAIRS, visits('sea-salon-sand'));
    const which = hard ? [HIDDEN, ...pair] : [...pair];
    this.spots = which.map((i) => {
      const img = new Phaser.GameObjects.Image(h, 0, 0, 'sand-spot').setAngle(Phaser.Math.Between(-20, 20));
      c.attach(img, 'skin', spotPoint(i));
      return { i, img, dirt: 1, hidden: i === HIDDEN, bubbleAt: 0 };
    });
    this.weeds = ART_SALON.weedBits.map((at, j) => {
      const img = new Phaser.GameObjects.Image(h, 0, 0, 'weed-bit').setAngle(j ? 24 : -18);
      c.attach(img, 'hair', at);
      return { img, at };
    });
    h.shown.sand = this.spots.length;
    h.layColumn(['sponge', 'shower'], (id, cell) => [h.add.image(cell.x, cell.y, id === 'sponge' ? 'salon-sponge' : 'salon-shower').setScale(cell.s * 0.95)]);
    h.time.delayedCall(500, () => h.play('vo-salon-splash'));
  }

  // ---------------------------------------------------------------- what is left

  private spotAt(s: Spot) {
    return this.h.onHer(spotPoint(s.i));
  }
  private visible(s: Spot) {
    return s.dirt > 0 && (!s.hidden || this.lifted);
  }
  private get dirty() {
    return this.spots.filter((s) => s.dirt > 0);
  }
  private get clean() {
    return !this.dirty.length && !this.weeds.length;
  }
  private weedAt(w: Weed) {
    return this.h.onHer(w.at);
  }
  private spotR() {
    return Math.max(95 * this.sc, 100 * this.h.k);
  }

  plan(): SalonPlan | null {
    const h = this.h;
    const sponge = h.cell('sponge');
    const shower = h.cell('shower');
    const s = this.dirty.find((q) => this.visible(q));
    if (s && sponge) {
      const at = this.spotAt(s);
      const r = 60 * h.k;
      return { kind: 'drag', what: 'sponge', path: [{ x: sponge.x, y: sponge.y }, { x: at.x, y: at.y + 40 * h.k }, ...[0, 1, 2, 3, 4, 5].map((j) => ({ x: at.x + (j % 2 ? r : -r), y: at.y + 40 * h.k }))] };
    }
    const hid = this.dirty.find((q) => q.hidden && !this.lifted);
    if (hid) return { kind: 'tap', what: 'peek', at: this.spotAt(hid) };
    const w = this.weeds[0];
    if (w) return { kind: 'tap', what: 'weed', at: this.weedAt(w) };
    if (!this.rinsed && shower) return { kind: 'tap', what: 'shower', at: { x: shower.x, y: shower.y } };
    return null;
  }

  way(): HandMotion | null {
    const p = this.plan();
    if (!p) return this.h.doneWay();
    if (p.kind === 'drag') return this.rubMotion(p.path);
    return { ...tapMotion(p.at, this.h.k), glow: p.at };
  }

  /** Mom's hand takes the sponge from its shell and rubs (the sponge as her prop). */
  private rubMotion(path: P[]): HandMotion {
    const sponge = this.h.cell('sponge')!;
    const keys = path.map((q, i) => ({ x: q.x, y: q.y, t: i === 0 ? 0 : 500 + (i - 1) * 190 }));
    return { kind: 'grab', keys, props: [{ key: 'salon-sponge', scale: sponge.s * 0.95 }], glow: { x: sponge.x, y: sponge.y } };
  }

  helpOnce() {
    const h = this.h;
    const p = this.plan();
    if (!p) return h.doneHelp();
    if (p.kind === 'drag') {
      const s = this.dirty.find((q) => this.visible(q))!;
      h.momHand.play(this.rubMotion(p.path), { onDone: () => (this.wash(s), h.helpDone()) });
      return true;
    }
    h.momHand.play(tapMotion(p.at, h.k), {
      onDone: () => {
        if (p.what === 'peek') this.peek();
        else if (p.what === 'weed' && this.weeds[0]) this.pluck(this.weeds[0]);
        else if (p.what === 'shower') this.shower();
        h.helpDone();
      },
    });
    return true;
  }

  // ---------------------------------------------------------------- touch

  down(p: Phaser.Input.Pointer, at: P) {
    const h = this.h;
    const cell = h.cellAt(at);
    if (cell?.id === 'sponge') {
      if (this.carry) return;
      h.hold(p);
      this.carry = new Carry(h, [cell.items[0]], at, h.k, { lift: 30 });
      sfx(h, 'squish', { volume: 0.6, minGapMs: 200 });
      return;
    }
    if (cell?.id === 'shower') {
      h.pressCell(cell);
      return this.shower();
    }
    const w = this.weeds.find((q) => Phaser.Math.Distance.BetweenPoints(at, this.weedAt(q)) < Math.max(80 * this.sc, 90 * h.k));
    if (w) return this.pluck(w);
    const hid = this.dirty.find((q) => q.hidden && !this.lifted);
    if (hid && Phaser.Math.Distance.BetweenPoints(at, this.spotAt(hid)) < 170 * this.sc) return this.peek();
    const s = this.dirty.find((q) => this.visible(q) && Phaser.Math.Distance.BetweenPoints(at, this.spotAt(q)) < this.spotR());
    if (s) {
      // (sand wants the sponge: its shell glows)
      const sp = h.cell('sponge');
      if (sp) h.glowCell(sp);
      return h.missed();
    }
    h.tickleCustomer(at);
  }

  move(p: Phaser.Input.Pointer) {
    const cr = this.carry;
    if (!cr) return;
    const d = cr.move({ x: p.worldX, y: p.worldY });
    if (!cr.dragging || !d) return;
    this.rubAt(cr.at, d);
  }

  /** The sponge at `at` moved `d`: the spots under it fade, a bit of seaweed it passes comes out. */
  private rubAt(at: P, d: number) {
    const h = this.h;
    const hid = this.dirty.find((q) => q.hidden && !this.lifted);
    if (hid && Phaser.Math.Distance.BetweenPoints(at, this.spotAt(hid)) < 150 * this.sc) this.peek();
    const w = this.weeds.find((q) => Phaser.Math.Distance.BetweenPoints(at, this.weedAt(q)) < 70 * this.sc);
    if (w) this.pluck(w);
    for (const s of this.dirty) {
      if (!this.visible(s) || Phaser.Math.Distance.BetweenPoints(at, this.spotAt(s)) > this.spotR()) continue;
      s.dirt -= d / (T.rub * h.k);
      s.img.setAlpha(Math.max(0.1, s.dirt));
      sfx(h, 'squish', { volume: 0.5, minGapMs: 260 });
      s.bubbleAt += d;
      if (s.bubbleAt > 60 * h.k) {
        s.bubbleAt = 0;
        this.bubbles(at, 2);
      }
      if (s.dirt <= 0) this.cleaned(s);
      h.progress();
    }
  }

  up(_p: Phaser.Input.Pointer) {
    const cr = this.carry;
    this.carry = null;
    if (!cr) return;
    if (!cr.dragging) {
      // (a tap on the sponge: it squishes, bubbles)
      this.bubbles({ x: cr.at.x, y: cr.at.y - 40 * this.h.k }, 3);
    }
    cr.back();
  }

  lookTarget() {
    return this.carry?.dragging ? this.carry.at : null;
  }

  // ---------------------------------------------------------------- what happens

  private bubbles(at: P, n: number) {
    const h = this.h;
    for (let i = 0; i < n; i++) {
      const b = h.add.image(at.x + Phaser.Math.Between(-40, 40) * h.k, at.y + Phaser.Math.Between(-20, 20) * h.k, FX_SOFT).setTint(0xffffff).setDepth(60).setAlpha(0.9);
      b.setScale(((Phaser.Math.Between(26, 46) * h.k) / b.frame.realWidth) * 2);
      h.tweens.add({ targets: b, y: b.y - Phaser.Math.Between(60, 140) * h.k, alpha: 0, scale: b.scale * 1.3, duration: Phaser.Math.Between(600, 1000), ease: 'Sine.easeOut', onComplete: () => b.destroy() });
    }
  }

  /** A spot washed off: soap bubbles, a few stars, she smiles. */
  private cleaned(s: Spot) {
    const h = this.h;
    s.dirt = 0;
    const at = this.spotAt(s);
    h.tweens.add({ targets: s.img, alpha: 0, duration: 200, onComplete: () => s.img.destroy() });
    this.bubbles(at, 6);
    stars(h, at.x, at.y, 6, 34 * h.k);
    delight(h, this.c, { hop: false });
    if (s.hidden) this.settleHair();
    h.shown.sandLeft = this.dirty.length;
    h.did();
    this.check();
  }

  /** Same as a full rub (Mom's help). */
  private wash(s: Spot) {
    if (s.dirt <= 0) return;
    if (s.hidden && !this.lifted) this.peek();
    this.cleaned(s);
  }

  /** A bit of seaweed comes out of her hair: it twirls up and away. */
  private pluck(w: Weed) {
    const h = this.h;
    this.weeds = this.weeds.filter((q) => q !== w);
    const at = this.weedAt(w);
    this.c.detach(w.img);
    const img = h.add.image(at.x, at.y, 'weed-bit').setScale(this.sc).setDepth(60).setAngle(w.img.angle);
    w.img.destroy();
    h.tweens.add({ targets: img, y: at.y - 220 * h.k, x: at.x + Phaser.Math.Between(-60, 60) * h.k, angle: img.angle + 200, alpha: 0, duration: 800, ease: 'Sine.easeOut', onComplete: () => img.destroy() });
    sfx(h, 'weed-pluck', { pitch: 'vary' });
    delight(h, this.c, { hop: false });
    h.shown.weedLeft = this.weeds.length;
    h.did();
    this.check();
  }

  /** Hard: her fringe lifts aside, the sand under it shows. */
  private peek() {
    if (this.lifted) return;
    const h = this.h;
    this.lifted = true;
    const m = this.c.motion('hair-front');
    if (m) h.tweens.add({ targets: m, dx: 34, dy: -56, duration: 320, ease: 'Back.easeOut' });
    sfx(h, 'hair-swish', { pitch: 'vary' });
    h.speak('vo-salon-peek', { ttlMs: 4000 });
    surprise(h, this.c);
    h.progress();
  }
  private settleHair() {
    const m = this.c.motion('hair-front');
    if (m) this.h.tweens.add({ targets: m, dx: 0, dy: 0, delay: 400, duration: 420, ease: 'Back.easeOut' });
    sfx(this.h, 'hair-swish', { pitch: 'vary', volume: 0.6 });
  }

  /** The shell shower: it floats over her head, water pours on her (she shakes her head), then it goes back. */
  private shower() {
    const h = this.h;
    const cell = h.cell('shower');
    if (this.showering || !cell) return;
    this.showering = true;
    h.did();
    const tool = cell.items[0];
    const k = h.k;
    const top = h.onHer({ x: 300, y: 40 });
    const over = { x: top.x + 60 * k, y: Math.max(110 * k, top.y - 40 * k) };
    tool.setData('carried', true).setDepth(700);
    h.tweens.add({ targets: tool, x: over.x, y: over.y, angle: -30, duration: 320, ease: 'Sine.easeOut' });
    sfx(h, 'shower');
    const water = h.add.graphics().setDepth(650);
    let t = 0;
    const from = { x: over.x - 70 * k, y: over.y + 10 * k };
    const flow = () => {
      if (!water.active) return;
      t += 1;
      water.clear();
      const c = this.c.toWorld({ x: 300, y: 300 });
      for (let j = 0; j < 4; j++) {
        const wob = Math.sin(t / 3 + j) * 6 * k;
        water.lineStyle(10 * k, 0xffffff, 0.55);
        water.beginPath().moveTo(from.x + (j - 1.5) * 18 * k, from.y).lineTo(c.x - 80 * k + j * 50 * k + wob, c.y - 40 * k).strokePath();
      }
    };
    h.time.delayedCall(320, () => {
      surprise(h, this.c, 420);
      h.events.on('update', flow);
      for (let i = 0; i < 10; i++) h.time.delayedCall(i * 110, () => this.bubbles(this.c.toWorld({ x: Phaser.Math.Between(170, 430), y: Phaser.Math.Between(250, 560) }), 1));
      // she shakes her head (a little turn each way)
      const box = this.c.ch.box;
      h.tweens.add({ targets: box, angle: { from: -6, to: 6 }, duration: 160, yoyo: true, repeat: 2, delay: 500, onComplete: () => box.setAngle(0) });
      // the water washes a little of the sand off (and the seaweed out)
      for (const s of this.dirty) {
        s.dirt -= 0.4;
        s.img.setAlpha(Math.max(0.1, s.dirt));
      }
    });
    h.time.delayedCall(320 + T.showerMs, () => {
      h.events.off('update', flow);
      water.destroy();
      for (const s of this.dirty) if (s.dirt <= 0.05) this.cleaned(s);
      for (const w of [...this.weeds]) this.pluck(w);
      h.tweens.add({ targets: tool, x: cell.x, y: cell.y, angle: 0, duration: 320, ease: 'Sine.easeInOut', onComplete: () => {
        tool.setData('carried', false).setDepth(21);
        this.showering = false;
        if (this.clean && !this.rinsed) this.rinse();
      } });
    });
  }

  /** All the sand and seaweed gone and the shower done: "All clean and fresh!" */
  private rinse() {
    const h = this.h;
    this.rinsed = true;
    h.shown.rinsed = true;
    h.speak('vo-salon-clean', { ttlMs: 4000 });
    const c = this.c;
    delight(h, c);
    const at = c.toWorld({ x: 300, y: 250 });
    stars(h, at.x, at.y, 12, 50 * h.k);
    h.did();
  }

  /** Sand and seaweed gone: now the shower (Mom says so once; its shell glows). */
  private check() {
    if (!this.clean || this.ended) return;
    if (!this.rinsed && !this.showering && !this.toldRinse) {
      this.toldRinse = true;
      this.h.speak('vo-salon-rinse', { ttlMs: 4000 });
      const sh = this.h.cell('shower');
      if (sh) this.h.glowCell(sh);
    }
  }

  end() {
    this.ended = true;
    this.carry = null;
    // (done early: whatever sand is left is rinsed off quietly)
    for (const s of this.spots) if (s.img.active) this.h.tweens.add({ targets: s.img, alpha: 0, duration: 300, onComplete: () => s.img.destroy() });
    for (const w of this.weeds) if (w.img.active) this.h.tweens.add({ targets: w.img, alpha: 0, duration: 300, onComplete: () => w.img.destroy() });
    this.weeds = [];
    if (this.lifted && this.h.customer) this.settleHair();
  }
}

