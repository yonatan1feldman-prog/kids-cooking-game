import Phaser from 'phaser';
import { stars } from '../../core/fx';
import { tapMotion, type HandMotion } from '../../core/hand';
import * as paper from '../../core/paper';
import { byVisit } from '../../core/sea';
import { DYE, DYE_HEX, DYE_NAME, TAIL_SHAPES, TOPS, hexOf, tailHex, type Dye, type TailShape, type Top } from '../../core/salon';
import { ART_SALON } from '../../core/salonAssets';
import { delight, giggle, rasterOf } from '../../core/salonDress';
import { drawn, wishPending } from '../../core/salonWish';
import { sfx } from '../../core/sfx';
import { TUNING } from '../../core/tuning';
import type { P } from '../MiniGame';
import type { Cell, SalonPlan, SalonStage, SeaSalon } from '../SeaSalon';
import { Carry } from './carry';
import { DyeFan } from './dyeFan';

const T = TUNING.salon;
type Tool = 'tail' | 'top' | 'spray';
/** The column (spec 5.4): three tails, three tops, the spray (it colours the tail here), the surprise shell. */
// (two by two: the tails down the left, the tops down the right, then the spray and the shell)
const COLUMN = [...TAIL_SHAPES.flatMap((s, i) => [`tail-${s}`, `top-${TOPS[i]}`]), 'spray', 'surprise'];
/** Where her tail turns as it swishes (her frame: the waist, where the tail leaves her top). */
const WAIST = { x: 300, y: 452 };
/** How long she looks down at a new top before she smiles. */
const LOOK_DOWN_MS = 650;

/** The drawn part of several customer-frame pictures together (their trims), in the 600x700 frame. */
function drawnUnion(scene: Phaser.Scene, keys: string[]) {
  return keys.map((k) => drawn(scene, k).box).reduce((a, q) => ({ x0: Math.min(a.x0, q.x0), y0: Math.min(a.y0, q.y0), x1: Math.max(a.x1, q.x1), y1: Math.max(a.y1, q.y1) }));
}

/**
 * The outfit (salon PR 3; research/mermaid-dressup-spec.md 5.4): three tails (classic, frilly, long), three tops (two
 * shells, a starfish, a seaweed frill), the spray and the surprise shell down the column. A tap on a tail or a top (or a
 * drag onto her) puts it on: a new tail comes up from below with a soft splash and she swishes it, a new top pops on and
 * she looks down at it, then smiles. The spray works as in the hair, on her tail here: a tap goes to its next colour (its
 * cap shows it, Mom names it), rub it over the tail and the tail turns that colour (the tail plates too). A tap on her tail
 * with nothing in the finger: she swishes it, sparkles. The surprise shell: a new tail in a new colour and a new top pop
 * out of it onto her. She always has a tail and a top. Free play; the done button after one thing (or 15 s). On the hard
 * level Mom's hint shows a wished tail, colour or top first (core/salonWish.ts).
 */
export class Outfit implements SalonStage {
  readonly id = 'outfit' as const;
  readonly free = true;
  readonly hasDone = true;
  private carry: Carry | null = null;
  private tool: Tool | null = null;
  /** The tail or top in the finger (its cell id: tail-classic, top-frill ...). */
  private item: string | null = null;
  private rub = 0;
  private dyeing = false;
  private cap: Dye = 'pink';
  private toldTail = false;
  private toldTop = false;
  private toldSurprise = false;
  private toldSpray = false;
  /** Salon review A3: the spray's six colours in view while she uses it. */
  private fan: DyeFan;
  private demo = 'tail-frilly';
  /** Where she looks for a moment (her new top), until when. */
  private glance: { at: P; until: number } | null = null;
  private swishing = false;
  private ended = false;

  constructor(private h: SeaSalon) {
    this.fan = new DyeFan(h, (d) => this.nextCap(d));
  }

  private get c() {
    return this.h.customer!;
  }

  begin() {
    const h = this.h;
    const c = h.customer;
    if (!c) return h.stageOver(0);
    this.cap = DYE.find((d) => d !== c.look.tailColour) ?? 'pink';
    const tails = TAIL_SHAPES.filter((s) => s !== c.look.tail);
    this.demo = `tail-${h.firstVisit ? (tails.includes('frilly') ? 'frilly' : tails[0]) : byVisit(tails, Math.floor(h.time.now / 1000))}`;
    h.shown.cap = this.cap;
    // (after the face close-up she is back in the chair, full size, before the column comes)
    h.zoom(false, () => {
      if (this.ended) return;
      h.layColumn(COLUMN, (id, cell) => this.fill(id, cell));
      h.time.delayedCall(450, () => !this.ended && h.play('vo-salon-outfit'));
    });
  }

  /** What lies on a cell's plate (a tail in her tail's colour now, a top, the spray with its cap, the shell). */
  private fill(id: string, cell: Cell): Phaser.GameObjects.Image[] {
    const h = this.h;
    if (id.startsWith('tail-') || id.startsWith('top-')) {
      const keys = id.startsWith('tail-') ? [id, `${id}-shine`] : [id];
      const b = drawnUnion(h, keys);
      const s = (0.86 * 220 * cell.s) / Math.max(b.x1 - b.x0, b.y1 - b.y0);
      const x = cell.x + (300 - (b.x0 + b.x1) / 2) * s;
      const y = cell.y + (350 - (b.y0 + b.y1) / 2) * s;
      return keys.map((key, i) => {
        const img = h.add.image(x, y, key).setScale(s / rasterOf(key));
        if (i === 0 && id.startsWith('tail-')) img.setTint(tailHex(this.c.id, this.c.look.tailColour));
        return img;
      });
    }
    if (id === 'spray') {
      const s = cell.s * 0.95;
      const bottle = h.add.image(cell.x, cell.y, 'salon-spray').setScale(s);
      const cap = h.add.image(cell.x + (ART_SALON.sprayCap.x - 120) * s, cell.y + (ART_SALON.sprayCap.y - 120) * s, 'spray-cap').setScale(s).setTint(hexOf(DYE_HEX[this.cap]));
      return [bottle, cap];
    }
    return [h.add.image(cell.x, cell.y, 'shell-surprise').setScale(cell.s * 0.95)];
  }

  /** Every tail plate shows her tail's colour now. */
  private tintCells(hex: number) {
    for (const s of TAIL_SHAPES) this.h.cell(`tail-${s}`)?.items[0]?.setTint(hex);
  }

  // ---------------------------------------------------------------- her tail and her top

  /** The world point is on her tail (its drawing, below her top: a forgiving box). */
  private onTail(at: P) {
    const c = this.c;
    const f = c.toFrame(at);
    const b = drawnUnion(this.h, [`tail-${c.look.tail}`]);
    return f.x > b.x0 - 30 && f.x < b.x1 + 30 && f.y > Math.max(b.y0, 420) - 20 && f.y < b.y1 + 30;
  }

  /** She swishes her tail: it turns a little round her waist, twice, sparkles and a soft splash. */
  private swish(sparkle = true) {
    const h = this.h;
    const c = this.c;
    if (this.swishing) return;
    const parts = ['tail', 'tail-shine'].map((n) => ({ img: c.get(n), m: c.motion(n) })).filter((q) => q.img && q.m);
    if (!parts.length) return;
    this.swishing = true;
    // (the layers hang from her feet (300, 684): turning by a, their waist would swing away; dx keeps it in place)
    const arm = 684 - WAIST.y;
    const turn = (deg: number) =>
      parts.forEach((q) => q.img!.active && (q.img!.setAngle(deg), (q.m!.dx = -arm * Math.sin(Phaser.Math.DegToRad(deg)))));
    // (two swishes, fading: a sine of two periods under a falling envelope)
    const v = { t: 0 };
    h.tweens.add({
      targets: v,
      t: 1,
      duration: 760,
      onUpdate: () => turn(6 * Math.sin(v.t * Math.PI * 4) * (1 - v.t * 0.6)),
      onComplete: () => {
        turn(0);
        this.swishing = false;
      },
    });
    if (sparkle) {
      const fin = drawnUnion(h, [`tail-${c.look.tail}`]);
      const at = c.toWorld({ x: (fin.x0 + fin.x1) / 2, y: (Math.max(fin.y0, 430) + fin.y1) / 2 });
      h.sparkle(at, [0xffffff, tailHex(c.id, c.look.tailColour)], 7);
      sfx(h, 'splash-soft', { pitch: 'vary', volume: 0.7, minGapMs: 250 });
    }
  }

  /** A new tail on her: the old one goes, the new one comes up from below with a soft splash; she swishes it. */
  private wearTail(shape: TailShape) {
    const h = this.h;
    const c = this.c;
    if (shape === c.look.tail) {
      this.swish();
      delight(h, c, { hop: false });
      return h.did();
    }
    h.setLook({ ...c.look, tail: shape }, { from: -70 });
    sfx(h, 'splash-soft', { pitch: 'vary' });
    sfx(h, 'paper-drop', { volume: 0.5 });
    const fin = c.toWorld({ x: 300, y: 600 });
    stars(h, fin.x, fin.y, 8, 40 * h.k);
    h.time.delayedCall(320, () => !this.ended && h.customer && this.swish(false));
    delight(h, c, { hop: false });
    h.theMom?.nod(1);
    h.shown.tails = ((h.shown.tails as number | undefined) ?? 0) + 1;
    if (!this.toldTail) {
      this.toldTail = true;
      h.speak('vo-salon-tail', { ttlMs: 4000 });
    }
    h.did();
  }

  /** A new top on her: it pops on; she looks down at it, then smiles. */
  private wearTop(top: Top) {
    const h = this.h;
    const c = this.c;
    const chest = c.toWorld({ x: 300, y: 400 });
    if (top === c.look.top) {
      h.sparkle(chest);
      delight(h, c, { hop: false });
      return h.did();
    }
    h.setLook({ ...c.look, top }, { from: 40 });
    sfx(h, 'pop', { pitch: 'vary' });
    h.sparkle(chest, [0xffffff, 0xfff4b8], 7);
    // she looks down at it (eyes on her new top), then she likes it
    this.glance = { at: { x: chest.x, y: chest.y + 140 * h.k }, until: h.time.now + LOOK_DOWN_MS };
    c.ch.setMood('expect');
    h.time.delayedCall(LOOK_DOWN_MS, () => {
      if (this.ended || !c.ch.box.active) return;
      c.ch.setMood('rest');
      delight(h, c);
    });
    h.theMom?.happy();
    h.time.delayedCall(800, () => h.theMom?.rest());
    h.shown.tops = ((h.shown.tops as number | undefined) ?? 0) + 1;
    if (!this.toldTop) {
      this.toldTop = true;
      h.speak('vo-salon-top', { ttlMs: 4000 });
    }
    h.did();
  }

  /** Her tail turns `to` (a soft change of colour, 400 ms), and the tail plates with it. */
  private dye(to: Dye) {
    const h = this.h;
    const c = this.c;
    if (this.dyeing) return;
    const fin = c.toWorld({ x: 300, y: 580 });
    if (c.look.tailColour === to) {
      h.sparkle(fin, [hexOf(DYE_HEX[to]), 0xffffff], 6);
      return;
    }
    this.dyeing = true;
    const from = Phaser.Display.Color.IntegerToColor(tailHex(c.id, c.look.tailColour));
    const target = Phaser.Display.Color.IntegerToColor(tailHex(c.id, to));
    const tail = c.get('tail');
    const t = { v: 0 };
    sfx(h, 'spray-hiss', { pitch: 'vary', minGapMs: 200 });
    h.tweens.add({
      targets: t,
      v: 100,
      duration: 400,
      onUpdate: () => {
        const q = Phaser.Display.Color.Interpolate.ColorWithColor(from, target, 100, t.v);
        if (tail?.active) tail.setTint(Phaser.Display.Color.GetColor(q.r, q.g, q.b));
      },
      onComplete: () => {
        this.dyeing = false;
        if (!h.customer || this.ended) return;
        h.setLook({ ...c.look, tailColour: to });
        this.tintCells(tailHex(c.id, to));
        this.swish(false);
      },
    });
    stars(h, fin.x, fin.y, 8, 40 * h.k);
    delight(h, c, { hop: false });
    h.theMom?.happy();
    h.time.delayedCall(800, () => h.theMom?.rest());
    h.shown.tailDyed = ((h.shown.tailDyed as number | undefined) ?? 0) + 1;
    h.did();
  }

  /** The spray's next colour: its cap shows it, Mom says it. */
  private nextCap(to?: Dye) {
    const h = this.h;
    this.cap = to ?? DYE[(DYE.indexOf(this.cap) + 1) % DYE.length];
    const cap = h.cell('spray')?.items[1];
    if (cap) {
      cap.setTint(hexOf(DYE_HEX[this.cap]));
      paper.press(h, cap);
    }
    sfx(h, 'spray-click', { pitch: 'vary' });
    h.name(DYE_NAME[this.cap]);
    h.shown.cap = this.cap;
    h.progress();
  }

  /** The surprise shell opens: a new tail in a new colour and a new top pop out of it onto her. */
  private surprise() {
    const h = this.h;
    const c = this.c;
    const cell = h.cell('surprise');
    if (!cell || this.dyeing) return;
    const shell = cell.items[0];
    paper.press(h, shell);
    h.tweens.add({ targets: shell, angle: { from: -10, to: 10 }, duration: 90, yoyo: true, repeat: 1, onComplete: () => shell.setAngle(0) });
    sfx(h, 'shell-open', { pitch: 'vary' });
    sfx(h, 'shimmer', { pitch: 'vary' });
    const tail = Phaser.Utils.Array.GetRandom(TAIL_SHAPES.filter((s) => s !== c.look.tail)) as TailShape;
    const colour = Phaser.Utils.Array.GetRandom(DYE.filter((d) => d !== c.look.tailColour)) as Dye;
    const top = Phaser.Utils.Array.GetRandom(TOPS.filter((t) => t !== c.look.top)) as Top;
    const body = c.toWorld({ x: 300, y: 480 });
    for (let i = 0; i < 7; i++) {
      const sp = h.add.image(cell.x, cell.y, 'fx-sparkle').setDepth(70).setTint(i % 2 ? hexOf(DYE_HEX[colour]) : 0xffffff).setScale((40 * h.k) / 80);
      h.tweens.add({ targets: sp, x: body.x + Phaser.Math.Between(-120, 120) * h.k, y: body.y + Phaser.Math.Between(-110, 140) * h.k, angle: 180, delay: i * 40, duration: 420, ease: 'Sine.easeOut', onComplete: () => sp.destroy() });
    }
    // the tail first (up from below), the top a moment later (one change each: her wish hears both)
    h.time.delayedCall(380, () => {
      if (!h.customer || this.ended) return;
      h.setLook({ ...c.look, tail, tailColour: colour }, { from: -90 });
      this.tintCells(tailHex(c.id, colour));
      sfx(h, 'splash-soft', { pitch: 'vary' });
      stars(h, body.x, body.y + 100 * h.k, 10, 48 * h.k);
      h.time.delayedCall(300, () => !this.ended && h.customer && this.swish(false));
    });
    h.time.delayedCall(640, () => {
      if (!h.customer || this.ended) return;
      h.setLook({ ...c.look, top }, { from: 60 });
      sfx(h, 'pop', { pitch: 'vary' });
      stars(h, body.x, body.y - 60 * h.k, 8, 44 * h.k);
      delight(h, c);
      if (!this.toldSurprise) {
        this.toldSurprise = true;
        h.speak('vo-salon-surprise', { ttlMs: 4000 });
      }
    });
    h.shown.surprises = ((h.shown.surprises as number | undefined) ?? 0) + 1;
    h.did();
  }

  // ---------------------------------------------------------------- touch

  down(p: Phaser.Input.Pointer, at: P) {
    const h = this.h;
    if (this.carry || this.dyeing) return;
    if (this.fan.hit(at)) return;
    const cell = h.cellAt(at);
    if (!cell) {
      // nothing in the finger: a tap on her tail swishes it, anywhere else on her she giggles
      if (h.onCustomer(at) && this.onTail(at)) {
        this.swish();
        giggle(h, this.c.id);
        h.progress();
        h.shown.swishes = ((h.shown.swishes as number | undefined) ?? 0) + 1;
        return;
      }
      h.tickleCustomer(at);
      return;
    }
    if (cell.id === 'surprise') return this.surprise();
    h.hold(p);
    this.rub = 0;
    if (cell.id === 'spray') {
      this.tool = 'spray';
      this.carry = new Carry(h, cell.items, at, h.k, { lift: 40 });
      this.fan.show(cell);
      if (!this.toldSpray && !h.shown.tailDyed) {
        this.toldSpray = true;
        h.speak('vo-salon-spray', { ttlMs: 5000 });
      }
      return;
    }
    this.tool = cell.id.startsWith('tail-') ? 'tail' : 'top';
    this.item = cell.id;
    this.carry = new Carry(h, cell.items, at, h.k, { lift: 50 });
  }

  move(p: Phaser.Input.Pointer) {
    const cr = this.carry;
    if (!cr) return;
    const d = cr.move({ x: p.worldX, y: p.worldY });
    if (!cr.dragging) return;
    const at = cr.at;
    const h = this.h;
    if ((this.tool === 'tail' || this.tool === 'top') && this.item && h.onCustomer({ x: at.x, y: at.y + 40 * h.k })) {
      // (a tail or a top carried onto her goes on her at once; its plate gets its picture back)
      const item = this.item;
      const tool = this.tool;
      this.carry = null;
      this.tool = null;
      this.item = null;
      this.homeNow(cr);
      if (tool === 'tail') this.wearTail(item.slice(5) as TailShape);
      else this.wearTop(item.slice(4) as Top);
      return;
    }
    if (this.tool !== 'spray' || !d || !this.onTail(at)) return;
    this.rub += d;
    if (Math.random() < 0.5) h.sparkle(at, [hexOf(DYE_HEX[this.cap]), 0xffffff], 2);
    sfx(h, 'spray-hiss', { volume: 0.5, minGapMs: 320 });
    if (this.rub >= T.spray * h.k) {
      this.rub = -1e9;
      this.dye(this.cap);
    }
    h.progress();
  }

  /** The carried things go back on their plate at once, arriving there (a thing that went onto her). */
  private homeNow(cr: Carry) {
    cr.things.forEach((t, i) => {
      t.setData('carried', false);
      this.h.tweens.killTweensOf(t);
      t.setPosition(cr.home[i].x, cr.home[i].y).setAngle(0).setDepth(21 + i);
      paper.appear(this.h, t, i);
    });
  }

  up(_p: Phaser.Input.Pointer, cancelled: boolean) {
    const cr = this.carry;
    const tool = this.tool;
    const item = this.item;
    this.carry = null;
    this.tool = null;
    this.item = null;
    if (!cr) return;
    cr.back();
    if (cr.dragging || cancelled) return;
    // a tap: a tail or a top goes on her, the spray goes to its next colour
    if (tool === 'tail' && item) this.wearTail(item.slice(5) as TailShape);
    else if (tool === 'top' && item) this.wearTop(item.slice(4) as Top);
    else if (tool === 'spray') this.nextCap();
  }

  lookTarget() {
    if (this.carry?.dragging) return this.carry.at;
    if (this.glance && this.h.time.now < this.glance.until) return this.glance.at;
    return null;
  }

  // ---------------------------------------------------------------- Mom's hand

  /** What Mom shows now: a wished tail, colour or top (hard) first, else (nothing done yet) a tail to try. */
  private want(): { cell: string; dye?: Dye } | null {
    const h = this.h;
    const c = this.c;
    for (const w of wishPending(h, 'outfit')) {
      if ('tail' in w) return { cell: `tail-${w.tail}` };
      if ('top' in w) return { cell: `top-${w.top}` };
      if ('tailColour' in w) return { cell: 'spray', dye: w.tailColour };
    }
    if (h.acted) return null;
    return c.look.tail === this.demo.slice(5) ? { cell: `tail-${TAIL_SHAPES.find((s) => s !== c.look.tail)}` } : { cell: this.demo };
  }

  /** Mom's hand takes the spray and rubs it over her tail (the spray as her prop). */
  private sprayMotion(dye: Dye): HandMotion {
    const h = this.h;
    const spray = h.cell('spray')!;
    const path = this.tailPath();
    const keys = path.map((q, i) => ({ x: q.x, y: q.y, t: i === 0 ? 0 : 500 + (i - 1) * 190 }));
    return {
      kind: 'grab',
      keys,
      props: [
        { key: 'salon-spray', scale: spray.s * 0.95 },
        { key: 'spray-cap', scale: spray.s * 0.95, dx: (ART_SALON.sprayCap.x - 120) * spray.s * 0.95, dy: (ART_SALON.sprayCap.y - 120) * spray.s * 0.95, tint: hexOf(DYE_HEX[dye]) },
      ],
      glow: { x: spray.x, y: spray.y },
    };
  }

  way(): HandMotion | null {
    const h = this.h;
    const w = this.want();
    if (!w) return h.doneWay();
    const cell = h.cell(w.cell);
    if (!cell) return null;
    if (w.dye) return this.sprayMotion(w.dye);
    return { ...tapMotion({ x: cell.x, y: cell.y }, h.k), glow: { x: cell.x, y: cell.y } };
  }

  helpOnce() {
    const h = this.h;
    const w = this.want();
    if (!w) return h.doneHelp();
    const cell = h.cell(w.cell);
    if (!cell) return false;
    if (w.dye) {
      const dye = w.dye;
      h.momHand.play(this.sprayMotion(dye), {
        onDone: () => {
          if (this.ended) return;
          if (this.cap !== dye) this.nextCap(dye);
          this.dye(dye);
          h.helpDone();
        },
      });
      return true;
    }
    h.momHand.play(tapMotion({ x: cell.x, y: cell.y }, h.k), {
      onDone: () => {
        if (this.ended) return;
        h.pressCell(cell);
        if (w.cell.startsWith('tail-')) this.wearTail(w.cell.slice(5) as TailShape);
        else this.wearTop(w.cell.slice(4) as Top);
        h.helpDone();
      },
    });
    return true;
  }

  plan(): SalonPlan | null {
    const h = this.h;
    const w = this.want();
    if (!w) return null;
    const cell = h.cell(w.cell);
    if (!cell) return null;
    if (w.dye) {
      // (the harness: taps the spray round to the colour, then rubs)
      if (this.cap !== w.dye) return { kind: 'tap', at: { x: cell.x, y: cell.y }, what: 'cap' };
      return { kind: 'drag', path: this.tailPath(), what: 'spray ' + w.dye };
    }
    return { kind: 'tap', at: { x: cell.x, y: cell.y }, what: w.cell };
  }

  /** A rub over her tail from the spray's cell (Mom's hand, the harness). */
  tailPath(): P[] {
    const h = this.h;
    const c = this.c;
    const cell = h.cell('spray')!;
    const b = drawnUnion(h, [`tail-${c.look.tail}`]);
    const y0 = Math.max(b.y0, 450) + 30;
    const pts: P[] = [{ x: cell.x, y: cell.y }];
    for (let i = 0; i < 8; i++) pts.push(c.toWorld({ x: 240 + (i % 2) * 130, y: y0 + (i % 3) * 50 }));
    return pts.map((q, i) => (i ? { x: q.x, y: q.y + 40 * h.k } : q));
  }

  end() {
    this.ended = true;
    this.carry = null;
    this.glance = null;
    this.fan.close();
  }
}
