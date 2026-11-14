import Phaser from 'phaser';
import { FX_SOFT } from '../../core/assets';
import { stars } from '../../core/fx';
import { tapMotion, type HandMotion } from '../../core/hand';
import * as paper from '../../core/paper';
import { byVisit } from '../../core/sea';
import { hasMark } from '../../core/seaSort';
import {
  CROWNS, GEM_SLOTS, GEM_TAP_ORDER, SPARKLE_CELLS,
  type Crown, type Gem, type GemSlot, type Look, type Necklace, type SparkleCell,
} from '../../core/salon';
import { ART_SALON } from '../../core/salonAssets';
import { delight, rasterOf } from '../../core/salonDress';
import { sfx } from '../../core/sfx';
import { TUNING } from '../../core/tuning';
import type { P } from '../MiniGame';
import type { Cell, SalonPlan, SalonStage, SeaSalon } from '../SeaSalon';
import { Carry } from './carry';

const T = TUNING.salon;
const F = ART_SALON.face;
const PLATE_TINT = 0xd6c6f4;

/** The drawn part of a customer-frame picture (its trim), in the 600x700 frame. */
function drawnBox(scene: Phaser.Scene, key: string) {
  const f = scene.textures.getFrame(key);
  const r = rasterOf(key);
  const d = f?.trimmed ? (f as unknown as { data: { spriteSourceSize: { x: number; y: number; w: number; h: number } } }).data.spriteSourceSize : null;
  return d ? { x0: d.x / r, y0: d.y / r, x1: (d.x + d.w) / r, y1: (d.y + d.h) / r } : { x0: 150, y0: 40, x1: 450, y1: 260 };
}

type Kind = 'crown' | 'clip' | 'necklace' | 'gem';
const kindOf = (id: string): Kind => (id.startsWith('crown') ? 'crown' : id === 'clip' ? 'clip' : id.startsWith('necklace') ? 'necklace' : 'gem');

/** A gem taken off her face, in her finger. */
type Lifted = { img: Phaser.GameObjects.Image; kind: Gem; from: GemSlot; start: P; dragging: boolean };

/**
 * The sparkle (spec 5.5), in the close-up: three crowns, the sea-flower clip, two necklaces (the shell treasure's necklace
 * takes the star necklace's place once she has found it: the activities belong together) and two face gems.
 * - A crown, the clip, a necklace: a tap puts it on (it comes down onto her, a ting); a tap on the same one again takes it
 *   off ("Off it comes. Try another one!"); a new crown takes the old one's place. What she wears glows on its shell. A
 *   drag onto her head (her neck, for a necklace) puts it on too.
 * - A gem: a tap sticks it on the first free place (her cheeks first); a drag puts it on the place nearest the finger (six
 *   places: forehead, over each eye, both cheeks, chin). A gem on her face can be dragged to another place, or off her
 *   face (it falls away). Up to six; a seventh tap takes the oldest one's place.
 * Free play; the done button after one thing.
 */
export class Sparkle implements SalonStage {
  readonly id = 'sparkle' as const;
  readonly free = true;
  readonly hasDone = true;
  private carry: Carry | null = null;
  private carried: SparkleCell | null = null;
  private lifted: Lifted | null = null;
  private lit = new Map<string, Phaser.GameObjects.Image>();
  private told = { crown: false, gem: false, off: false };
  private demo: SparkleCell = 'crown-starfish';
  private ended = false;

  constructor(private h: SeaSalon) {}

  private get c() {
    return this.h.customer!;
  }
  /** The second necklace: the shell treasure's, once she has it; else the star necklace. */
  private get necklace2(): Necklace {
    return hasMark('necklace') ? 'marina' : 'star';
  }

  begin() {
    const h = this.h;
    const c = h.customer;
    if (!c) return h.stageOver(0);
    const crowns = CROWNS.filter((q) => q !== c.look.crown);
    this.demo = `crown-${byVisit(crowns, h.firstVisit ? 1 : Math.floor(h.time.now / 1000))}` as SparkleCell;
    h.zoom(true);
    h.layColumn([...SPARKLE_CELLS], (id, cell) => this.fill(id as SparkleCell, cell));
    h.time.delayedCall(420, () => this.relight());
    h.time.delayedCall(550, () => h.play('vo-salon-sparkle'));
    h.shown.necklace2 = this.necklace2;
  }

  // ---------------------------------------------------------------- the column

  /** The picture a cell shows (and puts on her). */
  private keyOf(id: SparkleCell) {
    if (id === 'clip') return 'clip-flower';
    if (id === 'necklace-1') return 'necklace-pearl';
    if (id === 'necklace-2') return `necklace-${this.necklace2}`;
    return id;
  }

  private fill(id: SparkleCell, cell: Cell): Phaser.GameObjects.Image[] {
    const h = this.h;
    // (a jewel box: lilac shells, so the pearls show)
    cell.plate.setTint(PLATE_TINT);
    const key = this.keyOf(id);
    if (kindOf(id) === 'gem') return [h.add.image(cell.x, cell.y, key).setScale((cell.s * 220 * 0.62) / 90)];
    if (key === 'necklace-marina') return [h.add.image(cell.x, cell.y, key).setScale((cell.s * 220 * 0.86) / 240)];
    // (a picture on her 600x700 frame: its drawn part fills the plate)
    const b = drawnBox(h, key);
    const s = ((kindOf(id) === 'clip' ? 0.66 : 0.86) * 220 * cell.s) / Math.max(b.x1 - b.x0, b.y1 - b.y0);
    const x = cell.x + (300 - (b.x0 + b.x1) / 2) * s;
    const y = cell.y + (350 - (b.y0 + b.y1) / 2) * s;
    return [h.add.image(x, y, key).setScale(s / rasterOf(key))];
  }

  /** Is the thing of this cell on her now? */
  private worn(id: SparkleCell, look = this.c.look) {
    switch (id) {
      case 'crown-pearl':
      case 'crown-starfish':
      case 'crown-coral':
        return look.crown === id.slice(6);
      case 'clip':
        return look.clip;
      case 'necklace-1':
        return look.necklace === 'pearl';
      case 'necklace-2':
        return look.necklace === this.necklace2;
      default:
        return false;
    }
  }

  /** What she wears glows on its shell. */
  private relight() {
    const h = this.h;
    if (this.ended || !h.customer) return;
    for (const id of SPARKLE_CELLS) {
      const cell = h.cell(id);
      const on = !!cell && this.worn(id);
      let g = this.lit.get(id);
      if (on && cell && (!g || !g.active)) {
        g = h.add.image(cell.x, cell.y, FX_SOFT).setTint(0xfff1b8).setBlendMode(Phaser.BlendModes.ADD).setDepth(19).setAlpha(0);
        g.setScale((220 * cell.s * 1.4) / g.frame.realWidth);
        h.tweens.add({ targets: g, alpha: 0.9, duration: 250 });
        h.tweens.add({ targets: g, scale: g.scale * 1.08, duration: 800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
        this.lit.set(id, g);
      } else if (!on && g) {
        this.lit.delete(id);
        h.tweens.killTweensOf(g);
        h.tweens.add({ targets: g, alpha: 0, duration: 200, onComplete: () => g!.destroy() });
      }
    }
  }

  // ---------------------------------------------------------------- putting things on

  /** A crown, the clip or a necklace: on (or off, when she wears it already and `toggle`). */
  private put(id: SparkleCell, opts: { toggle?: boolean } = {}) {
    const h = this.h;
    const c = this.c;
    const look = c.look;
    const cell = h.cell(id);
    if (cell) h.pressCell(cell);
    if (this.worn(id)) {
      if (opts.toggle === false) {
        h.sparkle(this.spotOf(id), [0xffffff, 0xfff4b8], 5);
        return h.did();
      }
      return this.takeOff(id);
    }
    const next: Look = { ...look };
    const kind = kindOf(id);
    if (kind === 'crown') next.crown = id.slice(6) as Crown;
    else if (kind === 'clip') next.clip = true;
    else next.necklace = id === 'necklace-1' ? 'pearl' : this.necklace2;
    h.setLook(next, { from: kind === 'necklace' ? 60 : 120 });
    sfx(h, 'jewel-ting', { pitch: 'vary' });
    const at = this.spotOf(id);
    stars(h, at.x, at.y, kind === 'crown' ? 10 : 6, 44 * h.k);
    delight(h, c, { hop: false });
    if (kind === 'crown' && !this.told.crown) {
      this.told.crown = true;
      h.speak('vo-salon-crown', { ttlMs: 3000 });
    }
    h.theMom?.nod(1);
    h.shown.worn = ((h.shown.worn as number | undefined) ?? 0) + 1;
    h.did();
    this.relight();
  }

  /** Takes it off: it rises away; Mom: "Off it comes. Try another one!" (the first time). */
  private takeOff(id: SparkleCell) {
    const h = this.h;
    const c = this.c;
    const next: Look = { ...c.look };
    const kind = kindOf(id);
    if (kind === 'crown') next.crown = null;
    else if (kind === 'clip') next.clip = false;
    else next.necklace = null;
    h.setLook(next);
    sfx(h, 'paper-lift', { pitch: 'vary' });
    if (!this.told.off) {
      this.told.off = true;
      h.speak('vo-salon-off', { ttlMs: 3500 });
    }
    h.shown.off = ((h.shown.off as number | undefined) ?? 0) + 1;
    h.progress();
    this.relight();
  }

  /** Where a thing sits on her (world): the crown on top of her head, the clip on the left, the necklace at her neck. */
  private spotOf(id: SparkleCell): P {
    const kind = kindOf(id);
    return this.h.onHer(kind === 'crown' ? { x: 300, y: 92 } : kind === 'clip' ? { x: 180, y: 150 } : { x: 300, y: 420 });
  }

  /** A carried crown / clip is over her head, a necklace over her neck. */
  private overPlace(id: SparkleCell, at: P) {
    const f = this.c.toFrame(at);
    if (kindOf(id) === 'necklace') return Math.abs(f.x - 300) < 190 && f.y > 330 && f.y < 540;
    return Math.abs(f.x - 300) < 220 && f.y > -40 && f.y < 230;
  }

  // ---------------------------------------------------------------- gems

  private gemAt(slot: number) {
    return this.h.onHer(GEM_SLOTS[slot]);
  }
  /** The place on her face nearest a world point (null: not on her face). */
  private slotNear(at: P): GemSlot | null {
    const f = this.c.toFrame(at);
    const hd = F.head;
    if (((f.x - hd.x) / (hd.rx + 50)) ** 2 + ((f.y - hd.y) / (hd.ry + 60)) ** 2 > 1) return null;
    let best = 0;
    GEM_SLOTS.forEach((q, i) => {
      if (Math.hypot(f.x - q.x, f.y - q.y) < Math.hypot(f.x - GEM_SLOTS[best].x, f.y - GEM_SLOTS[best].y)) best = i;
    });
    return best as GemSlot;
  }

  /** A gem onto her face: at `slot` (a drag), or the first free place (a tap; all taken: the oldest one's place). */
  private stick(kind: Gem, slot?: GemSlot) {
    const h = this.h;
    const c = this.c;
    let gems = [...c.look.gems];
    let at: GemSlot;
    if (slot !== undefined) at = slot;
    else {
      const free = GEM_TAP_ORDER.find((q) => !gems.some((g) => g.slot === q));
      at = free ?? gems[0]?.slot ?? GEM_TAP_ORDER[0];
    }
    gems = gems.filter((g) => g.slot !== at);
    gems.push({ kind, slot: at });
    while (gems.length > T.gemSlots) gems.shift();
    h.setLook({ ...c.look, gems }, { from: 30 });
    sfx(h, 'gem-click', { pitch: 'vary' });
    const w = this.gemAt(at);
    h.sparkle(w, [0xffffff, kind === 'star' ? 0x9fdcff : 0xffb3cf], 6);
    delight(h, c, { hop: false, voice: Math.random() < 0.7 });
    if (!this.told.gem) {
      this.told.gem = true;
      // ("A little star on her cheek!": said when it is one; else Mom's warm praise)
      if (kind === 'star' && (at === 3 || at === 4)) h.speak('vo-salon-gem', { ttlMs: 3000 });
      else h.theMom?.happy(), h.time.delayedCall(700, () => h.theMom?.rest());
    }
    h.shown.gems = gems.length;
    h.did();
  }

  /** The gem at `slot` off her face, into her finger (a world picture of it now). */
  private liftGem(slot: GemSlot, at: P) {
    const h = this.h;
    const c = this.c;
    const g = c.look.gems.find((q) => q.slot === slot);
    if (!g) return;
    const w = this.gemAt(slot);
    const s = ART_SALON.gemScale * c.ch.box.scaleX;
    const img = h.add.image(w.x, w.y, `gem-${g.kind}`).setScale(s).setDepth(700);
    paper.lift(h, img);
    h.setLook({ ...c.look, gems: c.look.gems.filter((q) => q.slot !== slot) }, { arrive: false });
    this.lifted = { img, kind: g.kind, from: slot, start: at, dragging: true };
  }

  // ---------------------------------------------------------------- touch

  private pending: { slot: GemSlot; at: P } | null = null;

  down(p: Phaser.Input.Pointer, at: P) {
    const h = this.h;
    if (this.carry || this.lifted) return;
    const cell = h.cellAt(at);
    if (cell) {
      h.hold(p);
      this.carried = cell.id as SparkleCell;
      this.carry = new Carry(h, cell.items, at, h.k, { lift: 40 });
      return;
    }
    // a gem on her face: drag it somewhere else (or off her face); a tap makes it twinkle
    const c = this.c;
    const r = Math.max(46 * c.ch.box.scaleX, 46 * h.k);
    const g = c.look.gems.find((q) => Phaser.Math.Distance.BetweenPoints(at, this.gemAt(q.slot)) < r);
    if (g) {
      h.hold(p);
      this.pending = { slot: g.slot, at };
      return;
    }
    h.tickleCustomer(at);
  }

  move(p: Phaser.Input.Pointer) {
    const h = this.h;
    const at = { x: p.worldX, y: p.worldY };
    if (this.pending && Math.hypot(at.x - this.pending.at.x, at.y - this.pending.at.y) >= T.drag * h.k) {
      const q = this.pending;
      this.pending = null;
      this.liftGem(q.slot, at);
    }
    if (this.lifted) {
      this.lifted.img.setPosition(at.x, at.y - 40 * h.k);
      return;
    }
    const cr = this.carry;
    if (!cr) return;
    cr.move(at);
    const id = this.carried;
    if (!cr.dragging || !id || kindOf(id) === 'gem') return;
    if (this.overPlace(id, cr.at)) {
      // (carried onto her head, or her neck: on it goes, the shell gets its picture back)
      this.carry = null;
      this.carried = null;
      this.homeNow(cr);
      this.put(id, { toggle: false });
    }
  }

  up(_p: Phaser.Input.Pointer, cancelled: boolean) {
    const h = this.h;
    if (this.pending) {
      // a tap on a gem on her face: it twinkles
      const w = this.gemAt(this.pending.slot);
      this.pending = null;
      h.sparkle(w, [0xffffff], 4);
      sfx(h, 'jewel-ting', { pitch: 'vary', volume: 0.6 });
      return;
    }
    const l = this.lifted;
    if (l) {
      this.lifted = null;
      const slot = cancelled ? l.from : this.slotNear({ x: l.img.x, y: l.img.y + 20 * h.k });
      if (slot !== null) {
        l.img.destroy();
        return this.stick(l.kind, slot);
      }
      // (off her face: it falls away)
      h.tweens.add({ targets: l.img, y: l.img.y + 160 * h.k, angle: 120, alpha: 0, duration: 520, ease: 'Quad.easeIn', onComplete: () => l.img.destroy() });
      sfx(h, 'paper-drop', { pitch: 'vary' });
      if (!this.told.off) {
        this.told.off = true;
        h.speak('vo-salon-off', { ttlMs: 3500 });
      }
      h.shown.gems = this.c.look.gems.length;
      return h.progress();
    }
    const cr = this.carry;
    const id = this.carried;
    this.carry = null;
    this.carried = null;
    if (!cr || !id) return;
    if (!cr.dragging) {
      // a tap: on (or off) / a gem onto her face
      cr.back();
      if (cancelled) return;
      if (kindOf(id) === 'gem') return this.stick(id.slice(4) as Gem);
      return this.put(id);
    }
    if (!cancelled && kindOf(id) === 'gem') {
      const slot = this.slotNear(cr.at);
      if (slot !== null) {
        this.homeNow(cr);
        return this.stick(id.slice(4) as Gem, slot);
      }
    }
    cr.back();
  }

  /** The carried things go back on their plate at once, arriving there. */
  private homeNow(cr: Carry) {
    cr.things.forEach((t, i) => {
      t.setData('carried', false);
      this.h.tweens.killTweensOf(t);
      t.setPosition(cr.home[i].x, cr.home[i].y).setAngle(0).setDepth(21 + i);
      paper.appear(this.h, t, i);
    });
  }

  lookTarget() {
    if (this.lifted) return { x: this.lifted.img.x, y: this.lifted.img.y };
    return this.carry?.dragging ? this.carry.at : null;
  }

  // ---------------------------------------------------------------- Mom's hand

  way(): HandMotion | null {
    const h = this.h;
    if (h.acted) return h.doneWay();
    const cell = h.cell(this.demo);
    if (!cell) return null;
    return { ...tapMotion({ x: cell.x, y: cell.y }, h.k), glow: { x: cell.x, y: cell.y } };
  }

  helpOnce() {
    const h = this.h;
    if (h.acted) return h.doneHelp();
    const cell = h.cell(this.demo);
    if (!cell) return false;
    h.momHand.play(tapMotion({ x: cell.x, y: cell.y }, h.k), {
      onDone: () => {
        if (!h.customer) return;
        this.put(this.demo, { toggle: false });
        h.helpDone();
      },
    });
    return true;
  }

  plan(): SalonPlan | null {
    const h = this.h;
    if (h.acted) return null;
    const cell = h.cell(this.demo);
    return cell ? { kind: 'tap', at: { x: cell.x, y: cell.y }, what: this.demo } : null;
  }

  /** For the harness: a drag from a cell onto her (a gem: to place `slot`; else her head or neck). */
  dragPath(id: SparkleCell, slot = 0): P[] {
    const h = this.h;
    const cell = h.cell(id)!;
    const to = kindOf(id) === 'gem' ? this.gemAt(slot) : this.spotOf(id);
    const lift = 40 * h.k;
    return [{ x: cell.x, y: cell.y }, { x: (cell.x + to.x) / 2, y: (cell.y + to.y) / 2 + lift }, { x: to.x, y: to.y + lift }, { x: to.x, y: to.y + lift + 2 }];
  }
  /** For the harness: a gem on her face dragged to `to` (a world point). */
  gemDrag(slot: number, to: P): P[] {
    const a = this.gemAt(slot);
    return [{ x: a.x, y: a.y }, { x: (a.x + to.x) / 2, y: (a.y + to.y) / 2 }, { x: to.x, y: to.y }];
  }
  gemPoint(slot: number) {
    return this.gemAt(slot);
  }

  end() {
    if (this.ended) return;
    this.ended = true;
    const h = this.h;
    this.carry = null;
    this.pending = null;
    if (this.lifted) {
      // (a gem in her finger when the stage ends goes back where it was)
      const l = this.lifted;
      this.lifted = null;
      l.img.destroy();
      if (h.scene.isActive() && h.customer?.ch.box.active) h.setLook({ ...this.c.look, gems: [...this.c.look.gems, { kind: l.kind, slot: l.from }] }, { arrive: false });
    }
    for (const g of this.lit.values()) {
      h.tweens.killTweensOf(g);
      if (g.active) h.tweens.add({ targets: g, alpha: 0, duration: 250, onComplete: () => g.destroy() });
    }
    this.lit.clear();
  }
}
