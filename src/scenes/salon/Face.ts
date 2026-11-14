import Phaser from 'phaser';
import { FX_SOFT } from '../../core/assets';
import { stars } from '../../core/fx';
import type { HandMotion } from '../../core/hand';
import * as paper from '../../core/paper';
import {
  BLUSH_SHAPES, FACE_TOOLS, PAINT, PAINT_NAME, SALON_STAGES, lipsHex, paintHex,
  type BlushShape, type FaceTool, type Look, type Paint,
} from '../../core/salon';
import { ART_SALON } from '../../core/salonAssets';
import { delight, giggle, surprise } from '../../core/salonDress';
import { sfx } from '../../core/sfx';
import { TUNING } from '../../core/tuning';
import type { P } from '../MiniGame';
import { SALON_STAGE_CLASSES, type Cell, type SalonPlan, type SalonStage, type SeaSalon } from '../SeaSalon';
import { Carry } from './carry';

const T = TUNING.salon;
const F = ART_SALON.face;
const TOOL_KEY: Record<FaceTool, string> = { blush: 'tool-blush', shadow: 'tool-shadow', lipstick: 'tool-lipstick', glitter: 'tool-glitter' };
/** Where each tool paints: its brush, sponge tip, bullet, glitter brush (from its 240x240 picture's centre). */
const TIP: Record<FaceTool, P> = { blush: { x: -38, y: -40 }, shadow: { x: -42, y: -46 }, lipstick: { x: 32, y: -52 }, glitter: { x: -44, y: -40 } };
/** The little shapes the blush cell shows (runtime textures, white, tinted). */
const SHAPE_KEY = (s: BlushShape) => `salon-blush-${s}`;

type Rub = { tool: FaceTool; carry: Carry; lips: number; glitter: number; brush: number; eyesShut: boolean };

/**
 * Her face (spec 5.3): the close-up (her container grows 1.6x round her face). Four tools and four colour shells down the
 * column: the blush brush, the eye shadow wand, the lipstick and the glitter brush; pink, purple, blue, gold. A tap on a
 * tool picks it (a soft glow under its shell); a tap on a colour gives the picked tool that colour (its little dot shows
 * it, Mom names it; each tool keeps its own). Then she drags the tool to the face and rubs, gently:
 * - blush: the cheek she rubs (the nearer one) turns rosy, stronger the more she rubs; a tap on the brush when it is picked
 *   changes its shape (round, heart, star), on her cheeks too;
 * - eye shadow: a soft colour over both eyes (she closes her eyes while the wand is on them);
 * - lipstick: rub over her lips and they turn that colour, bit by bit, then "pa!" (a little surprise and a smile);
 * - glitter: sparkles stay where the brush goes (up to 12; the oldest makes room).
 * The paint is festive face paint for a 4-5 year old: soft rounds and shapes, nothing else (no contour, no black, no
 * "before"). She answers everything (she looks at the tool, smiles, giggles). Free play; the done button after one thing.
 */
export class Face implements SalonStage {
  readonly id = 'face' as const;
  readonly free = true;
  readonly hasDone = true;
  private tool: FaceTool = 'blush';
  private colour: Record<Exclude<FaceTool, 'glitter'>, Paint> = { blush: 'pink', shadow: 'purple', lipstick: 'pink' };
  private sparkleTint = 0xfff4b8;
  private shape: BlushShape = 'round';
  private rub: Rub | null = null;
  /** The paint while she rubs (the look gets it when the finger lifts). */
  private blush: Look['blush'] = null;
  private shadow: Look['shadow'] = null;
  private told = { rosy: false, shadow: false, lips: false, glitter: false };
  private glows: Partial<Record<'tool' | 'colour', Phaser.GameObjects.Image>> = {};
  private ended = false;

  constructor(private h: SeaSalon) {}

  private get c() {
    return this.h.customer!;
  }

  begin() {
    const h = this.h;
    const c = h.customer;
    if (!c) return h.stageOver(0);
    // (a second visit: the tools start with the colours she wears)
    const look = c.look;
    this.blush = look.blush ? { ...look.blush, amount: [...look.blush.amount] as [number, number] } : null;
    this.shadow = look.shadow ? { ...look.shadow } : null;
    if (look.blush) (this.colour.blush = look.blush.colour), (this.shape = look.blush.shape);
    if (look.shadow) this.colour.shadow = look.shadow.colour;
    if (look.lips) this.colour.lipstick = look.lips;
    this.makeShapes();
    h.zoom(true);
    h.layColumn([...FACE_TOOLS, ...PAINT], (id, cell) => this.fill(id, cell));
    this.pick('blush', { quiet: true });
    h.time.delayedCall(550, () => h.play('vo-salon-face'));
    h.shown.tool = this.tool;
  }

  // ---------------------------------------------------------------- the column

  /** The three blush shapes as small white pictures (the blush cell's dot shows the shape in its colour). */
  private makeShapes() {
    const h = this.h;
    const n = 64;
    for (const s of BLUSH_SHAPES) {
      const key = SHAPE_KEY(s);
      if (h.textures.exists(key)) continue;
      const g = h.make.graphics({ x: 0, y: 0 }, false);
      g.fillStyle(0xffffff, 1);
      if (s === 'round') g.fillCircle(n / 2, n / 2, n * 0.42);
      else {
        const pts: Phaser.Math.Vector2[] = [];
        for (let i = 0; i < 40; i++) {
          const t = (i / 40) * Math.PI * 2;
          if (s === 'heart') {
            // (the classic heart curve, scaled into the square)
            const x = 16 * Math.sin(t) ** 3;
            const y = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
            pts.push(new Phaser.Math.Vector2(n / 2 + x * 1.75, n / 2 + 2 + y * 1.75));
          } else {
            const a = -Math.PI / 2 + (Math.floor(i / 4) * Math.PI) / 5;
            const r = Math.floor(i / 4) % 2 ? n * 0.22 : n * 0.46;
            pts.push(new Phaser.Math.Vector2(n / 2 + Math.cos(a) * r, n / 2 + 3 + Math.sin(a) * r));
          }
        }
        g.fillPoints(pts, true);
      }
      g.generateTexture(key, n, n);
      g.destroy();
    }
    h.events.once('shutdown', () => BLUSH_SHAPES.forEach((s) => h.textures.exists(SHAPE_KEY(s)) && h.textures.remove(SHAPE_KEY(s))));
  }

  /** What lies on a cell's plate: a tool and its colour's dot, or a shell of paint. */
  private fill(id: string, cell: Cell): Phaser.GameObjects.Image[] {
    const h = this.h;
    if ((PAINT as readonly string[]).includes(id)) return [h.add.image(cell.x, cell.y, 'paint-blob').setScale(cell.s).setTint(paintHex(id as Paint))];
    const tool = id as FaceTool;
    const img = h.add.image(cell.x, cell.y - 6 * cell.s, TOOL_KEY[tool]).setScale(cell.s * 0.9);
    if (tool === 'glitter') return [img];
    // (its colour: a round dot with a white rim on the shell's right, the blush's in its shape)
    const at = { x: cell.x + 62 * cell.s, y: cell.y + 34 * cell.s };
    const key = tool === 'blush' ? SHAPE_KEY(this.shape) : SHAPE_KEY('round');
    const rim = h.add.image(at.x, at.y, key).setScale((74 * cell.s) / 64).setTint(0xffffff);
    const dot = h.add.image(at.x, at.y, key).setScale((58 * cell.s) / 64).setTint(paintHex(this.colour[tool]));
    return [img, rim, dot];
  }

  /** The tool she has now: a soft glow under its shell. */
  private pick(tool: FaceTool, opts: { quiet?: boolean } = {}) {
    const h = this.h;
    this.tool = tool;
    h.shown.tool = tool;
    const cell = h.cell(tool);
    if (cell) this.glow('tool', cell);
    const colourCell = tool === 'glitter' ? undefined : h.cell(this.colour[tool]);
    if (colourCell) this.glow('colour', colourCell);
    else this.glows.colour?.setVisible(false);
    if (!opts.quiet) sfx(h, 'pop', { pitch: 'vary', minGapMs: 80 });
  }

  /** A soft light under a cell (the picked tool; its colour). */
  private glow(which: 'tool' | 'colour', cell: Cell) {
    const h = this.h;
    let g = this.glows[which];
    if (!g || !g.active) {
      g = h.add.image(cell.x, cell.y, FX_SOFT).setBlendMode(Phaser.BlendModes.ADD).setDepth(19);
      // (end() lets it go with the column)
      this.glows[which] = g;
      h.tweens.add({ targets: g, alpha: { from: 0.95, to: 0.6 }, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }
    g.setVisible(true).setPosition(cell.x, cell.y).setTint(which === 'tool' ? 0xfff1b8 : 0xffffff);
    g.setScale((220 * cell.s * 1.35) / g.frame.realWidth);
  }

  /** A colour shell tapped: the picked tool gets that colour (its dot shows it, Mom names it). */
  private setColour(p: Paint, cell: Cell) {
    const h = this.h;
    h.pressCell(cell);
    h.name(PAINT_NAME[p]);
    h.sparkle({ x: cell.x, y: cell.y - 30 * cell.s }, [paintHex(p), 0xffffff], 5);
    h.shown.colour = p;
    if (this.tool === 'glitter') {
      // (the glitter stays white and gold on her; its sparkles in the air take the colour)
      this.sparkleTint = paintHex(p);
      this.glow('colour', cell);
      return h.progress();
    }
    this.colour[this.tool] = p;
    this.glow('colour', cell);
    const tc = h.cell(this.tool);
    const dot = tc?.items[2];
    if (dot) {
      dot.setTint(paintHex(p));
      paper.press(h, dot);
    }
    h.progress();
  }

  /** The blush brush tapped again: its next shape (round, heart, star), on her cheeks too. */
  private nextShape() {
    const h = this.h;
    this.shape = BLUSH_SHAPES[(BLUSH_SHAPES.indexOf(this.shape) + 1) % BLUSH_SHAPES.length];
    h.shown.shape = this.shape;
    const cell = h.cell('blush');
    for (const o of cell ? cell.items.slice(1) : []) {
      o.setTexture(SHAPE_KEY(this.shape));
      paper.press(h, o);
    }
    sfx(h, 'shimmer', { pitch: 'vary', volume: 0.6, minGapMs: 120 });
    if (this.blush) {
      this.blush = { ...this.blush, shape: this.shape };
      this.commit();
      for (const ch of F.cheeks) h.sparkle(h.onHer(ch), [paintHex(this.blush.colour), 0xffffff], 4);
      delight(h, this.c, { hop: false });
      h.did();
    }
    h.progress();
  }

  // ---------------------------------------------------------------- her face

  /** Where on her face a frame point is: 'cheek' i, 'lids' i, 'lips', or just 'face' (null: not on her face). */
  private onFace(f: P): boolean {
    const hd = F.head;
    return ((f.x - hd.x) / (hd.rx + 20)) ** 2 + ((f.y - hd.y) / (hd.ry + 20)) ** 2 < 1;
  }
  private nearest(list: readonly P[], f: P) {
    let best = 0;
    list.forEach((q, i) => {
      if (Math.hypot(f.x - q.x, f.y - q.y) < Math.hypot(f.x - list[best].x, f.y - list[best].y)) best = i;
    });
    return best;
  }

  /** The tool's painting point in the world (its brush, wand tip, bullet). */
  private tipOf(r: Rub): P {
    const img = r.carry.things[0];
    const s = img.scaleX;
    return { x: img.x + TIP[r.tool].x * s, y: img.y + TIP[r.tool].y * s };
  }

  /** The tool moved `d` with its tip at `tip`: the paint goes on. */
  private paintAt(r: Rub, tip: P, d: number) {
    const h = this.h;
    const c = this.c;
    const f = c.toFrame(tip);
    if (!this.onFace(f)) return this.openEyes(r);
    const k = h.k;
    if (r.tool === 'blush') {
      if (f.y < F.eyes[0].y + 10) return;
      const i = this.nearest(F.cheeks, f);
      const colour = this.colour.blush;
      // (another colour over her blush: it turns that colour, as strong as it was)
      const amount = [...(this.blush?.amount ?? [0, 0])] as [number, number];
      amount[i] = Math.min(1, amount[i] + d / (T.blushFull * k));
      this.blush = { shape: this.shape, colour, amount };
      c.paintFace(this.blush, this.shadow);
      this.brush(r, tip, paintHex(colour));
      if (amount[i] >= 0.5 && !this.told.rosy) {
        this.told.rosy = true;
        this.commit();
        h.speak('vo-salon-rosy', { ttlMs: 3000 });
        delight(h, c, { hop: false });
      }
      if (amount[i] > 0.12) h.did();
      h.progress();
    } else if (r.tool === 'shadow') {
      if (f.y > F.eyes[0].y + 16) return this.openEyes(r);
      const colour = this.colour.shadow;
      const amount = Math.min(1, (this.shadow?.amount ?? 0) + d / (T.shadowFull * k));
      this.shadow = { colour, amount };
      c.paintFace(this.blush, this.shadow);
      this.brush(r, tip, paintHex(colour));
      // (she closes her eyes while the wand is on them)
      if (!r.eyesShut) {
        r.eyesShut = true;
        c.ch.parts.eyes.setTexture(c.ch.parts.def.eyesBlink);
      }
      if (amount >= 0.5 && !this.told.shadow) {
        this.told.shadow = true;
        this.commit();
        h.speak('vo-salon-shadow', { ttlMs: 3000 });
      }
      if (amount > 0.12) h.did();
      h.progress();
    } else if (r.tool === 'lipstick') {
      if (f.y < F.nose.y) return;
      const colour = this.colour.lipstick;
      if (c.look.lips === colour) {
        // (already that colour: a little shine where it touches)
        if ((r.brush += d) > 70 * k) (r.brush = 0), h.sparkle(tip, [0xffffff], 1);
        return;
      }
      r.lips += d;
      const need = T.lipsStroke * k;
      const q = Math.min(1, r.lips / need);
      // (her lips turn the colour bit by bit as the lipstick goes over them)
      const from = Phaser.Display.Color.IntegerToColor(lipsHex(c.id, c.look.lips));
      const to = Phaser.Display.Color.IntegerToColor(lipsHex(c.id, colour));
      const m = Phaser.Display.Color.Interpolate.ColorWithColor(from, to, 100, q * 85);
      c.ch.parts.mouth.setTint(Phaser.Display.Color.GetColor(m.r, m.g, m.b));
      sfx(h, 'blush-brush', { volume: 0.4, minGapMs: 300, pitch: 'vary' });
      if (q >= 1) this.lipsDone(colour, tip);
      h.progress();
    } else {
      // glitter: a sparkle stays every little way the brush goes
      this.brush(r, tip, this.sparkleTint, true);
      if ((r.glitter += d) < 55 * k) return;
      r.glitter = 0;
      const look = c.look;
      const g = [...look.glitter, [Math.round(f.x + Phaser.Math.Between(-10, 10)), Math.round(f.y + Phaser.Math.Between(-10, 10))] as [number, number]];
      while (g.length > T.glitterMax) g.shift();
      this.setLook({ glitter: g });
      sfx(h, 'glitter', { pitch: 'vary', minGapMs: 120, volume: 0.7 });
      h.shown.glitter = g.length;
      if (g.length >= 3 && !this.told.glitter) {
        this.told.glitter = true;
        h.speak('vo-salon-glitter', { ttlMs: 3000 });
        delight(h, c, { hop: false });
      }
      h.did();
      h.progress();
    }
  }

  /** Little bits of paint fly off the brush as it works (and its soft sound). */
  private brush(r: Rub, tip: P, tint: number, glitter = false) {
    const h = this.h;
    if (!glitter) sfx(h, 'blush-brush', { volume: 0.45, minGapMs: 280, pitch: 'vary' });
    if ((r.brush += 1) % (glitter ? 2 : 4)) return;
    h.sparkle(tip, glitter ? [tint, 0xffffff, 0xfff4b8] : [tint, 0xffffff], glitter ? 3 : 1);
  }

  private openEyes(r: Rub) {
    if (!r.eyesShut) return;
    r.eyesShut = false;
    const ch = this.c.ch;
    this.h.time.delayedCall(250, () => ch.box.active && ch.mood === 'rest' && ch.parts.eyes.setTexture(ch.parts.def.eyesOpen));
  }

  /** The lipstick went all over her lips: they are that colour now ("pa!": a little surprise, then a smile). */
  private lipsDone(colour: Paint, at: P) {
    const h = this.h;
    const c = this.c;
    if (this.rub) this.rub.lips = 0;
    this.setLook({ lips: colour });
    sfx(h, 'lipstick-pop', { pitch: 'vary' });
    h.sparkle(h.onHer(F.mouth), [0xffffff, paintHex(colour)], 5);
    surprise(h, c, 300);
    h.time.delayedCall(420, () => h.customer && giggle(h, c.id));
    if (!this.told.lips) {
      this.told.lips = true;
      h.speak('vo-salon-lips', { ttlMs: 3000 });
    }
    h.shown.lips = colour;
    stars(h, at.x, at.y, 5, 30 * h.k);
    h.did();
  }

  /** Her look gets the paint of the strokes so far (and `more`). */
  private commit(more: Partial<Look> = {}) {
    const c = this.h.customer;
    if (!c) return;
    const blush = this.blush && (this.blush.amount[0] > 0 || this.blush.amount[1] > 0) ? this.blush : null;
    const shadow = this.shadow && this.shadow.amount > 0 ? this.shadow : null;
    this.h.setLook({ ...c.look, blush, shadow, ...more });
  }
  private setLook(more: Partial<Look>) {
    this.commit(more);
  }

  // ---------------------------------------------------------------- touch

  down(p: Phaser.Input.Pointer, at: P) {
    const h = this.h;
    if (this.rub) return;
    const cell = h.cellAt(at);
    if (!cell) {
      h.tickleCustomer(at);
      return;
    }
    if ((PAINT as readonly string[]).includes(cell.id)) return this.setColour(cell.id as Paint, cell);
    const tool = cell.id as FaceTool;
    h.hold(p);
    const again = this.tool === tool;
    if (!again) this.pick(tool);
    const carry = new Carry(h, [cell.items[0]], at, h.k, { lift: 30 });
    carry.things[0].setData('again', again);
    this.rub = { tool, carry, lips: 0, glitter: 0, brush: 0, eyesShut: false };
  }

  move(p: Phaser.Input.Pointer) {
    const r = this.rub;
    if (!r) return;
    const d = r.carry.move({ x: p.worldX, y: p.worldY });
    if (!r.carry.dragging || !d) return;
    this.paintAt(r, this.tipOf(r), d);
  }

  up(_p: Phaser.Input.Pointer, cancelled: boolean) {
    const r = this.rub;
    this.rub = null;
    if (!r) return;
    const again = r.carry.things[0].getData('again');
    this.openEyes(r);
    if (!r.carry.dragging && !cancelled) {
      // a tap on a tool: it is picked (the blush brush picked again: its next shape)
      if (again && r.tool === 'blush') this.nextShape();
      else if (again) this.h.sparkle(r.carry.at, [0xffffff], 3);
      r.carry.back();
      return;
    }
    // (half-done lipstick goes back to the lips she had)
    if (r.tool === 'lipstick' && this.h.customer) this.c.ch.parts.mouth.setTint(lipsHex(this.c.id, this.c.look.lips));
    this.commit();
    if (r.tool !== 'glitter' && r.carry.dragging && this.painted(r.tool)) delight(this.h, this.c, { hop: false, voice: Math.random() < 0.6 });
    r.carry.back();
  }

  private painted(tool: FaceTool) {
    if (tool === 'blush') return !!this.blush;
    if (tool === 'shadow') return !!this.shadow;
    return false;
  }

  lookTarget() {
    return this.rub?.carry.dragging ? this.tipOf(this.rub) : null;
  }

  // ---------------------------------------------------------------- Mom's hand

  /** Mom takes the blush brush and rubs her left cheek (the brush as her prop). */
  private rubMotion(): HandMotion | null {
    const h = this.h;
    const cell = h.cell('blush');
    if (!cell) return null;
    const path = this.blushPath();
    const s = cell.s * 0.9;
    const keys = path.map((q, i) => ({ x: q.x, y: q.y, t: i === 0 ? 0 : 500 + (i - 1) * 200 }));
    return { kind: 'grab', keys, props: [{ key: 'tool-blush', scale: s, dx: 0, dy: -30 * h.k }], glow: { x: cell.x, y: cell.y } };
  }

  /** From the blush brush's shell to her (left) cheek, then back and forth on it. */
  blushPath(): P[] {
    const h = this.h;
    const cell = h.cell('blush')!;
    const ch = h.onHer(F.cheeks[0]);
    const s = cell.s * 0.9;
    // (the finger below the brush: the tip lands on the cheek)
    const off = { x: -TIP.blush.x * s, y: -TIP.blush.y * s + 30 * h.k };
    const r = 50 * h.k;
    return [{ x: cell.x, y: cell.y }, ...[0, 1, 2, 3, 4, 5, 6].map((j) => ({ x: ch.x + off.x + (j % 2 ? r : -r), y: ch.y + off.y + (j % 3 - 1) * 14 * h.k }))];
  }

  way(): HandMotion | null {
    const h = this.h;
    if (h.acted) return h.doneWay();
    return this.rubMotion();
  }

  helpOnce() {
    const h = this.h;
    if (h.acted) return h.doneHelp();
    const m = this.rubMotion();
    if (!m) return false;
    h.momHand.play(m, {
      onDone: () => {
        if (!h.customer) return;
        // (Mom's brush: rosy round cheeks in the brush's colour)
        const colour = this.colour.blush;
        this.blush = { shape: this.shape, colour, amount: [1, 1] };
        this.commit();
        for (const ch of F.cheeks) h.sparkle(h.onHer(ch), [paintHex(colour), 0xffffff], 5);
        delight(h, this.c, { hop: false });
        if (!this.told.rosy) {
          this.told.rosy = true;
          h.speak('vo-salon-rosy', { ttlMs: 3000 });
        }
        h.did();
        h.helpDone();
      },
    });
    return true;
  }

  plan(): SalonPlan | null {
    const h = this.h;
    if (h.acted || !h.cell('blush')) return null;
    return { kind: 'drag', what: 'blush', path: this.blushPath() };
  }

  /** For the harness: a rub with `tool` over where it paints (cheeks, lids, lips; glitter all over her face). */
  toolPath(tool: FaceTool, side = 0): P[] {
    const h = this.h;
    const cell = h.cell(tool)!;
    const s = cell.s * 0.9;
    const off = { x: -TIP[tool].x * s, y: -TIP[tool].y * s + 30 * h.k };
    const aim = tool === 'blush' ? F.cheeks[side] : tool === 'shadow' ? F.lids[side] : tool === 'lipstick' ? F.mouth : { x: 300, y: 260 };
    const c = h.onHer(aim);
    const r = (tool === 'glitter' ? 110 : tool === 'lipstick' ? 30 : 40) * h.k;
    const pts: P[] = [{ x: cell.x, y: cell.y }];
    const n = tool === 'glitter' ? 16 : 10;
    for (let j = 0; j < n; j++) pts.push({ x: c.x + off.x + (j % 2 ? r : -r), y: c.y + off.y + (tool === 'glitter' ? ((j % 4) - 1.5) * 50 * h.k : ((j % 3) - 1) * 8 * h.k) });
    return pts;
  }

  end() {
    if (this.ended) return;
    this.ended = true;
    const h = this.h;
    if (this.rub) {
      this.openEyes(this.rub);
      this.rub = null;
    }
    // (the home button: the scene is going, her layers with it; nothing to keep)
    const alive = h.scene.isActive() && !!h.customer?.ch.box.active;
    if (alive) this.commit();
    for (const g of Object.values(this.glows)) if (g?.active) h.tweens.add({ targets: g, alpha: 0, duration: 250, onComplete: () => g.destroy() });
    // (the close-up stays for the sparkle stage next; anything else sees her whole)
    let i = h.stageIndex + 1;
    while (i < SALON_STAGES.length && !SALON_STAGE_CLASSES[SALON_STAGES[i]]) i++;
    const next = SALON_STAGES[i];
    if (alive && next !== 'sparkle') h.zoom(false);
  }
}
