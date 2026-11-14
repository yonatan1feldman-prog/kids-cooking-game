import Phaser from 'phaser';
import { stars } from '../../core/fx';
import { tapMotion, type HandMotion } from '../../core/hand';
import * as paper from '../../core/paper';
import { byVisit } from '../../core/sea';
import { DYE, DYE_HEX, DYE_NAME, HAIR_STYLES, hairHex, hexOf, type Dye, type HairStyle } from '../../core/salon';
import { ART_SALON } from '../../core/salonAssets';
import { delight, rasterOf } from '../../core/salonDress';
import { wishPending } from '../../core/salonWish';
import { sfx } from '../../core/sfx';
import { TUNING } from '../../core/tuning';
import type { P } from '../MiniGame';
import type { Cell, SalonPlan, SalonStage, SeaSalon } from '../SeaSalon';
import { Carry } from './carry';

const T = TUNING.salon;
type Tool = 'spray' | 'comb' | 'style';

/**
 * The hair (spec 5.2): five styles, the spray, the comb and the surprise shell down the column. A tap on a style (or a
 * drag onto her) puts it on her: the old one rises away, the new one drops onto her head. Every style shows on its plate
 * in her hair's colour now. The spray: a tap goes to the next of its six colours (its cap shows it, Mom names it); drag it
 * and rub it over her hair, and the hair turns that colour. The comb: drag it up and down her hair, and it shines. The
 * surprise shell: a new style in a new colour pops out of it. Free play; the done button after one thing (or 15 s).
 */
/** The drawn part of a customer-frame picture (its trim), in the 600x700 frame. */
function drawnBox(scene: Phaser.Scene, key: string) {
  const f = scene.textures.getFrame(key);
  const r = rasterOf(key);
  const d = f?.trimmed ? (f as unknown as { data: { spriteSourceSize: { x: number; y: number; w: number; h: number } } }).data.spriteSourceSize : null;
  return d ? { x0: d.x / r, y0: d.y / r, x1: (d.x + d.w) / r, y1: (d.y + d.h) / r } : { x0: 110, y0: 50, x1: 490, y1: 560 };
}

export class Hair implements SalonStage {
  readonly id = 'hair' as const;
  readonly free = true;
  readonly hasDone = true;
  private carry: Carry | null = null;
  private tool: Tool | null = null;
  private style: HairStyle | null = null;
  private rub = 0;
  private dyeing = false;
  private cap: Dye = 'pink';
  private toldSpray = false;
  private toldSurprise = false;
  private combSparkle = 0;
  private demoStyle: HairStyle = 'curls';

  constructor(private h: SeaSalon) {}

  private get c() {
    return this.h.customer!;
  }

  begin() {
    const h = this.h;
    const c = h.customer;
    if (!c) return h.stageOver(0);
    this.cap = DYE.find((d) => d !== c.look.hairColour) ?? 'pink';
    const others = HAIR_STYLES.filter((s) => s !== c.look.hair);
    this.demoStyle = byVisit(others, h.firstVisit ? 0 : Math.floor(h.time.now / 1000));
    this.demoStyle = wishPending(h, 'hair').find((w): w is { hair: HairStyle } => 'hair' in w)?.hair ?? this.demoStyle; // salon PR 3: a wished style first
    h.layColumn([...HAIR_STYLES, 'spray', 'comb', 'surprise'], (id, cell) => this.fill(id, cell));
    h.time.delayedCall(450, () => h.play('vo-salon-hair'));
    h.shown.cap = this.cap;
  }

  /** What lies on a cell's plate. */
  private fill(id: string, cell: Cell): Phaser.GameObjects.Image[] {
    const h = this.h;
    if ((HAIR_STYLES as readonly string[]).includes(id)) {
      // (the style fills the plate: the drawn part of its back and front, centred; each at its own raster)
      const keys = [`hair-back-${id}`, `hair-front-${id}`];
      const b = keys.map((key) => drawnBox(h, key)).reduce((a, q) => ({ x0: Math.min(a.x0, q.x0), y0: Math.min(a.y0, q.y0), x1: Math.max(a.x1, q.x1), y1: Math.max(a.y1, q.y1) }));
      const s = (0.84 * 220 * cell.s) / Math.max(b.x1 - b.x0, b.y1 - b.y0);
      const x = cell.x + (300 - (b.x0 + b.x1) / 2) * s;
      const y = cell.y + (350 - (b.y0 + b.y1) / 2) * s;
      const tint = hairHex(this.c.id, this.c.look.hairColour);
      return keys.map((key) => h.add.image(x, y, key).setScale(s / rasterOf(key)).setTint(tint));
    }
    if (id === 'spray') {
      const s = cell.s * 0.95;
      const bottle = h.add.image(cell.x, cell.y, 'salon-spray').setScale(s);
      const cap = h.add.image(cell.x + (ART_SALON.sprayCap.x - 120) * s, cell.y + (ART_SALON.sprayCap.y - 120) * s, 'spray-cap').setScale(s).setTint(hexOf(DYE_HEX[this.cap]));
      return [bottle, cap];
    }
    return [h.add.image(cell.x, cell.y, id === 'comb' ? 'salon-comb' : 'shell-surprise').setScale(cell.s * 0.95)];
  }

  /** Every style's plate shows the hair's colour now. */
  private tintCells(hex: number) {
    for (const s of HAIR_STYLES) this.h.cell(s)?.items.forEach((o) => o.setTint(hex));
  }

  // ---------------------------------------------------------------- her hair

  private onHair(at: P) {
    const f = this.c.toFrame(at);
    const b = ART_SALON.hairBox;
    return f.x > b.x0 - 40 && f.x < b.x1 + 40 && f.y > b.y0 - 60 && f.y < b.y1 + 30;
  }

  /** A new style on her (the old one rises away, the new drops on; she likes it). */
  private wear(style: HairStyle, opts: { from?: number } = {}) {
    const h = this.h;
    const c = this.c;
    sfx(h, 'hair-swish', { pitch: 'vary' });
    const head = c.toWorld({ x: 300, y: 150 });
    if (style === c.look.hair) {
      h.sparkle(head);
      delight(h, c, { hop: false });
      return h.did();
    }
    h.setLook({ ...c.look, hair: style }, { from: opts.from ?? 60 });
    h.sparkle(head, [0xffffff, hairHex(c.id, c.look.hairColour)], 8);
    delight(h, c);
    h.theMom?.nod(1);
    h.shown.styles = ((h.shown.styles as number | undefined) ?? 0) + 1;
    h.did();
  }

  /** Her hair turns `to` (a soft change of colour, 400 ms), and the style plates with it. */
  private dye(to: Dye) {
    const h = this.h;
    const c = this.c;
    if (this.dyeing) return;
    if (c.look.hairColour === to) {
      h.sparkle(c.toWorld({ x: 300, y: 160 }), [hexOf(DYE_HEX[to]), 0xffffff], 6);
      return;
    }
    this.dyeing = true;
    const from = Phaser.Display.Color.IntegerToColor(hairHex(c.id, c.look.hairColour));
    const target = Phaser.Display.Color.IntegerToColor(hexOf(DYE_HEX[to]));
    const parts = [c.get('hair-back'), c.get('hair-front')].filter(Boolean) as Phaser.GameObjects.Image[];
    const t = { v: 0 };
    sfx(h, 'spray-hiss', { pitch: 'vary', minGapMs: 200 });
    h.tweens.add({
      targets: t,
      v: 100,
      duration: 400,
      onUpdate: () => {
        const q = Phaser.Display.Color.Interpolate.ColorWithColor(from, target, 100, t.v);
        const hex = Phaser.Display.Color.GetColor(q.r, q.g, q.b);
        parts.forEach((p) => p.active && p.setTint(hex));
      },
      onComplete: () => {
        this.dyeing = false;
        if (!h.customer) return;
        h.setLook({ ...c.look, hairColour: to });
        this.tintCells(hairHex(c.id, to));
      },
    });
    const head = c.toWorld({ x: 300, y: 170 });
    stars(h, head.x, head.y, 8, 40 * h.k);
    delight(h, c);
    h.theMom?.happy();
    h.time.delayedCall(800, () => h.theMom?.rest());
    h.shown.dyed = ((h.shown.dyed as number | undefined) ?? 0) + 1;
    h.did();
  }

  /** The spray's next colour: its cap shows it, Mom says it. */
  private nextCap() {
    const h = this.h;
    const i = DYE.indexOf(this.cap);
    this.cap = DYE[(i + 1) % DYE.length];
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

  /** The comb made her hair shine: it gleams, she closes her eyes happily ("mmm"), "So shiny!" */
  private shine() {
    const h = this.h;
    const c = this.c;
    h.setLook({ ...c.look, shine: true }, { from: 0 });
    const head = c.toWorld({ x: 300, y: 140 });
    stars(h, head.x, head.y, 10, 44 * h.k);
    const eyes = c.ch.parts.eyes;
    eyes.setTexture(c.ch.parts.def.eyesBlink);
    h.time.delayedCall(600, () => eyes.active && c.ch.mood === 'rest' && eyes.setTexture(c.ch.parts.def.eyesOpen));
    sfx(h, 'giggle-2', { rate: 0.85, pitch: 'vary' });
    h.speak('vo-salon-shiny', { ttlMs: 3000 });
    h.did();
  }

  /** The surprise shell opens: a new style in a new colour pops out of it onto her. */
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
    const style = Phaser.Utils.Array.GetRandom(HAIR_STYLES.filter((s) => s !== c.look.hair)) as HairStyle;
    const colour = Phaser.Utils.Array.GetRandom(DYE.filter((d) => d !== c.look.hairColour)) as Dye;
    // a few sparkles fly from the shell to her head
    const head = c.toWorld({ x: 300, y: 150 });
    for (let i = 0; i < 6; i++) {
      const sp = h.add.image(cell.x, cell.y, 'fx-sparkle').setDepth(70).setTint(i % 2 ? hexOf(DYE_HEX[colour]) : 0xffffff).setScale((40 * h.k) / 80);
      h.tweens.add({ targets: sp, x: head.x + Phaser.Math.Between(-90, 90) * h.k, y: head.y + Phaser.Math.Between(-60, 60) * h.k, angle: 180, delay: i * 40, duration: 420, ease: 'Sine.easeOut', onComplete: () => sp.destroy() });
    }
    h.time.delayedCall(380, () => {
      if (!h.customer) return;
      h.setLook({ ...c.look, hair: style, hairColour: colour }, { from: 110 });
      this.tintCells(hairHex(c.id, colour));
      sfx(h, 'hair-swish', { pitch: 'vary' });
      stars(h, head.x, head.y, 14, 54 * h.k);
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
    if (this.carry) return;
    const cell = h.cellAt(at);
    if (!cell) {
      h.tickleCustomer(at);
      return;
    }
    if (cell.id === 'surprise') return this.surprise();
    h.hold(p);
    this.rub = 0;
    if ((HAIR_STYLES as readonly string[]).includes(cell.id)) {
      this.tool = 'style';
      this.style = cell.id as HairStyle;
      this.carry = new Carry(h, cell.items, at, h.k, { lift: 50 });
      return;
    }
    this.tool = cell.id as Tool;
    this.carry = new Carry(h, cell.items, at, h.k, { lift: 40 });
    if (this.tool === 'spray' && !this.toldSpray && !h.shown.dyed) {
      this.toldSpray = true;
      h.speak('vo-salon-spray', { ttlMs: 5000 });
    }
  }

  move(p: Phaser.Input.Pointer) {
    const cr = this.carry;
    if (!cr) return;
    const d = cr.move({ x: p.worldX, y: p.worldY });
    if (!cr.dragging) return;
    const at = cr.at;
    const on = this.onHair(at);
    if (this.tool === 'style' && on && this.style) {
      // (a style carried onto her head goes on her at once; its plate gets its picture back)
      const style = this.style;
      this.carry = null;
      this.tool = null;
      this.homeNow(cr);
      return this.wear(style, { from: 30 });
    }
    if (!on || !d) return;
    this.rub += d;
    const h = this.h;
    if (this.tool === 'spray') {
      if (Math.random() < 0.5) h.sparkle(at, [hexOf(DYE_HEX[this.cap]), 0xffffff], 2);
      sfx(h, 'spray-hiss', { volume: 0.5, minGapMs: 320 });
      if (this.rub >= T.spray * h.k) {
        this.rub = -1e9;
        this.dye(this.cap);
      }
      h.progress();
    } else if (this.tool === 'comb') {
      sfx(h, 'comb-strokes', { volume: 0.7, minGapMs: 380 });
      if ((this.combSparkle += d) > 80 * h.k) {
        this.combSparkle = 0;
        h.sparkle(at, [0xffffff, 0xfff4b8], 2);
      }
      if (this.rub >= T.comb * h.k) {
        this.rub = -1e9;
        if (!this.c.look.shine) this.shine();
      }
      h.progress();
    }
  }

  /** The carried things go back on their plate at once, arriving there (a style that went onto her). */
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
    this.carry = null;
    this.tool = null;
    if (!cr) return;
    if (!cr.dragging && !cancelled) {
      // a tap: a style goes on her, the spray goes to its next colour, the comb sparkles once
      cr.back();
      if (tool === 'style' && this.style) this.wear(this.style);
      else if (tool === 'spray') this.nextCap();
      else if (tool === 'comb') this.h.sparkle(cr.at, [0xffffff], 3);
      return;
    }
    cr.back();
  }

  lookTarget() {
    return this.carry?.dragging ? this.carry.at : null;
  }

  // ---------------------------------------------------------------- Mom's hand

  way(): HandMotion | null {
    const h = this.h;
    if (h.acted) return h.doneWay();
    const cell = h.cell(this.demoStyle);
    if (!cell) return null;
    return { ...tapMotion({ x: cell.x, y: cell.y }, h.k), glow: { x: cell.x, y: cell.y } };
  }

  helpOnce() {
    const h = this.h;
    if (h.acted) return h.doneHelp();
    const cell = h.cell(this.demoStyle);
    if (!cell) return false;
    h.momHand.play(tapMotion({ x: cell.x, y: cell.y }, h.k), {
      onDone: () => {
        h.pressCell(cell);
        this.wear(this.demoStyle);
        h.helpDone();
      },
    });
    return true;
  }

  plan(): SalonPlan | null {
    const h = this.h;
    if (h.acted) return null;
    const cell = h.cell(this.demoStyle);
    return cell ? { kind: 'tap', at: { x: cell.x, y: cell.y }, what: this.demoStyle } : null;
  }

  /** For the harness: a rub over her hair from a cell (the spray, the comb). */
  hairPath(from: string): P[] {
    const cell = this.h.cell(from)!;
    const c = this.c;
    const pts: P[] = [{ x: cell.x, y: cell.y }];
    for (let i = 0; i < 8; i++) pts.push(c.toWorld({ x: 220 + (i % 2) * 160, y: 140 + (i % 3) * 70 }));
    return pts.map((q) => ({ x: q.x, y: q.y + 40 * this.h.k }));
  }

  end() {
    this.carry = null;
  }
}
