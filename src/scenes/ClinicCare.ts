import Phaser from 'phaser';
import { ART, FX_SOFT, IMAGES, type ImageKey } from '../core/assets';
import { countKey, type VoiceKey } from '../core/audio';
import { bandageView, CARE, FLAVORS, GLASSES, PASTES, SHAPE_NAME, SNACKS } from '../core/care';
import { AILMENTS, type Ailment, type AilmentId, type CareId, type Patient } from '../core/clinic';
import { boing, burst, stars } from '../core/fx';
import { tapMotion, type HandKey, type HandMotion, type MomHandView } from '../core/hand';
import type { Layout } from '../core/layout';
import { sfx } from '../core/sfx';
import type { Spot, Stage } from '../core/stage';
import { TUNING } from '../core/tuning';
import type { Mom } from '../steps/Mom';
import type { P } from './MiniGame';
import type { PatientView } from './ClinicScene';

const T = TUNING.care;
const C = ART.clinic;
/** The patients' frame (600x700, feet at y 684) and the close-ups' (520). */
const FH = 700;
const FEET = 684;
const LENS = 520;

/** The display scale that shows an image at `s` times its native size (images rasterized bigger, `raster`). */
function rs(key: string, s: number) {
  return s / ((IMAGES[key as ImageKey] as { raster?: number } | undefined)?.raster ?? 1);
}

/** What ClinicScene lends a care room: its layout, its patient, Mom's voice and hand, and the step rules (MiniGame). */
export interface CareHost {
  scene: Phaser.Scene;
  L: Layout;
  S: Stage;
  level: 1 | 2;
  /** The room's middle (from the tray column to Pipa or Mom's face) and where a close-up stands. */
  area: { x0: number; x1: number; zoom: { at: P; s: number } };
  patient: Patient;
  view: PatientView;
  as: Ailment[];
  hand: MomHandView;
  shown: Record<string, unknown>;
  say(key: VoiceKey, opts?: { ttlMs?: number; done?: () => void; group?: string; sequence?: boolean }): void;
  begin(phase: string, line: VoiceKey | null): void;
  setPhase(p: string): void;
  phase(): string;
  poke(): void;
  miss(): void;
  hintNow(): void;
  helped(): void;
  own(p: Phaser.Input.Pointer): void;
  mom(): Mom | null;
  /** The room is done: "All better!", the sticker, home. */
  done(): void;
}

/** One thing on the room's tray (a tool, a jar, a shape card, a snack...). */
interface Item {
  id: string;
  img: Phaser.GameObjects.Image;
  slot: Phaser.GameObjects.Image;
  glow: Phaser.GameObjects.Image;
  home: P;
  homeScale: number;
  gone: boolean;
  /** A tool carried by its working point (ART.clinic.tip), not by its middle. */
  tool: boolean;
  data?: number;
}

/** The next gesture a child would make (the test harness plays it). */
export type CarePlan =
  | { kind: 'tap'; at: P }
  | { kind: 'drag'; from: P; to: P }
  | { kind: 'rub'; from: P; at: P; r: number }
  | { kind: 'hold'; from: P; at: P }
  | { kind: 'twirl'; from: P; at: P; r: number; dir: 1 | -1 }
  | null;

/**
 * One part of a room. `pick`: tap a thing on the tray (or drag it to `dropAt`); `tool`: carry the tray's tool over her
 * (rubbing, holding, or turning it round); `tap`: tap something in the room; `drag`: pull something (the blanket).
 */
interface Task {
  name: string;
  line: VoiceKey | null;
  start(): void;
  /** pick: this tray item was chosen (tapped, or dragged to `dropAt`). */
  choose?(it: Item): void;
  dropAt?(): P | null;
  /** tool: the tray item carried, and where it works (a circle the finger may also start in). */
  tool?: string;
  area?(): { c: P; r: number };
  work?(tip: P, dist: number, delta: number): void;
  /** tap: a touch in the room (true: it was for this task). */
  tap?(at: P): boolean;
  /** drag: a touch that starts pulling (true), its moves. */
  grab?(at: P): boolean;
  pull?(at: P): void;
  way(): HandMotion | null;
  help(): boolean;
  plan(): CarePlan;
}

/**
 * A care room (research/clinic-spec-5.md section 4): the room next door that ClinicScene slides in from the right, built
 * from its own pictures on `bg-clinic-care`, and its few parts one after another, each with Mom's line, the demo the first
 * time, the hint after 8 s and her help 20 s later (MiniGame's rules, through the host). On the hard level she first
 * remembers what was wrong with her patient (two cards), and each room asks a little more (a flavour or a snack Mom
 * names, more bandage turns the arrows' way, all eight teeth, the shape's size, the duck in the bubbles).
 */
export class ClinicCare {
  readonly room: CareId;
  /** Where the patient is in the room. */
  spot!: Spot;
  /** The room's own pictures that slide in with it (the wall first). */
  objects: Phaser.GameObjects.GameObject[] = [];
  private sc: Phaser.Scene;
  private tasks: Task[] = [];
  private ti = -1;
  private items: Item[] = [];
  private held: { it: Item; from: P; t0: number; moved: number; last: P } | null = null;
  private dragging = false;
  private finished = false;
  /** Room pictures, by name (the bottle, the tub's front, the blanket...). */
  private o: Record<string, Phaser.GameObjects.Image> = {};
  private zoom: Phaser.GameObjects.Container | null = null;
  private zoomS = 1;
  private zoomFrom: P = { x: 0, y: 0 };
  /** Things made while she works (the bubbles in the bath, the teeth to polish, the bandage's turns). */
  private foams: Phaser.GameObjects.Image[] = [];
  private extras: Phaser.GameObjects.GameObject[] = [];
  private dim: Phaser.GameObjects.Rectangle | null = null;

  constructor(private h: CareHost) {
    this.room = h.patient.care;
    this.sc = h.scene;
  }

  get holding() {
    return !!this.held || this.dragging;
  }

  get task(): Task | null {
    return this.tasks[this.ti] ?? null;
  }

  // ---------------------------------------------------------------- the room

  private get k() {
    return this.h.L.k;
  }

  private get w() {
    return this.h.area.x1 - this.h.area.x0;
  }

  private get floor() {
    return this.h.L.Y(1000);
  }

  private img(key: string, x: number, y: number, s: number, depth: number) {
    const im = this.sc.add.image(x, y, key).setScale(rs(key, s)).setDepth(depth);
    this.objects.push(im);
    return im;
  }

  /** A patient standing on the floor at `cx`, as big as `maxW` and the room's height allow. */
  private standing(cx: number, maxW: number): Spot {
    const ps = Math.min(1.15 * this.k, (this.floor - this.h.L.Y(50)) / (FEET - 40), maxW / 560);
    return { x: cx, y: this.floor - (FEET - FH / 2) * ps, scale: ps };
  }

  /** The room's wall and its pictures, `dx` to the right of where they will stand (they slide in). */
  build(dx: number): Phaser.GameObjects.GameObject[] {
    const L = this.h.L;
    const k = this.k;
    const { x0 } = this.h.area;
    const w = this.w;
    const floor = this.floor;
    const bs = Math.max(1, L.W / 2400);
    this.objects.push(this.sc.add.image(L.W / 2 + dx, L.H, 'bg-clinic-care').setOrigin(0.5, 1).setScale(bs).setDepth(-100));
    const cx = x0 + w / 2;
    switch (this.room) {
      case 'medicine': {
        const s = Math.min(1.15 * k, (0.34 * w) / 260, (floor - L.Y(320)) / 380);
        const bx = x0 + 0.2 * w;
        const by = floor - 186 * s;
        this.o.back = this.img('care-bottle-back', bx + dx, by, s, 10);
        this.o.fill = this.img('care-bottle-fill', bx + dx, by, s, 10.1).setAlpha(0.92);
        this.o.front = this.img('care-bottle-front', bx + dx, by, s, 10.2);
        this.o.fill.setCrop(0, 380, 260, 0);
        this.o.back.setData('s', s);
        this.spot = this.standing(x0 + 0.66 * w, 0.6 * w);
        break;
      }
      case 'bath': {
        const s = Math.min(1.15 * k, (0.92 * w) / 1000);
        const ty = floor - (500 - 260) * s;
        this.o.back = this.img('care-tub-back', cx + dx, ty, s, 4);
        this.o.front = this.img('care-tub-front', cx + dx, ty, s, 14);
        const rim = ty + (C.care.tubRim - 260) * s;
        const ps = Math.min(1.1 * k, (rim - L.Y(40)) / (560 - 40), (0.6 * 1000 * s) / 560);
        this.spot = { x: cx, y: rim - (560 - FH / 2) * ps, scale: ps };
        break;
      }
      case 'rest': {
        const s = Math.min(1.1 * k, (0.74 * w) / 1000);
        const bx = x0 + 0.6 * w;
        const by = floor - (540 - 280) * s;
        this.o.back = this.img('care-bed-back', bx + dx, by, s, 4);
        this.o.front = this.img('care-bed-front', bx + dx, by, s, 14);
        const seat = by + (C.care.bedSeat - 280) * s;
        const ps = Math.min(1.05 * k, (seat - L.Y(40)) / (610 - 40), (0.52 * 1000 * s) / 560);
        this.spot = { x: bx, y: seat - (610 - FH / 2) * ps + 10 * ps, scale: ps };
        // the blanket lies folded on her lap; the lamp on its stool left of the bed
        const bl = this.img('care-blanket', bx + dx, seat + 60 * s, 1, 13).setOrigin(0.5, 1);
        bl.setScale((0.6 * 1000 * s) / 720, (80 * s) / 340).setData('bottom', seat + 60 * s);
        this.o.blanket = bl;
        const ls = Math.min(1 * k, (0.2 * w) / 240, (floor - L.Y(380)) / 380);
        this.o.lamp = this.img('care-lamp-on', x0 + 0.12 * w + dx, floor - 190 * ls, ls, 8);
        break;
      }
      case 'eyes': {
        const s = Math.min(1.05 * k, (0.42 * w) / 520, (L.Y(990) - L.Y(30)) / 640);
        this.o.chart = this.img('care-chart', x0 + 0.24 * w + dx, L.Y(30) + 320 * s, s, 3);
        this.o.chart.setData('s', s);
        this.spot = this.standing(x0 + 0.72 * w, 0.52 * w);
        break;
      }
      default:
        // bandage, polish: she stands in the middle; the close-up grows out of her
        this.spot = this.standing(cx, 0.9 * w);
    }
    return this.objects;
  }

  /** In the room (the slide is over): what was wrong with her (hard), then the room's parts. */
  start() {
    this.h.shown.care = this.room;
    this.h.shown.careTools = CARE[this.room].tools;
    this.tasks = this.makeTasks();
    if (this.h.level === 2) this.tasks.unshift(this.remember());
    this.ti = -1;
    this.next();
  }

  private next() {
    if (this.finished) return;
    this.ti++;
    const t = this.task;
    if (!t) return this.finish();
    this.h.shown.careTask = t.name;
    t.start();
  }

  /** The current part goes on with its line (and the demo the first time). */
  private go(t: Task, line: VoiceKey | null = t.line) {
    if (this.task !== t || this.finished) return;
    this.h.begin('care', line);
    this.glowNext();
  }

  /** Easy: the tool or thing to use glows and hops (Mom shows the way); hard: no glow. */
  private glowNext() {
    const t = this.task;
    const want = t ? this.wanted(t) : null;
    for (const it of this.items) this.sc.tweens.add({ targets: it.glow, alpha: this.h.level === 1 && it === want ? 0.95 : 0, duration: 260 });
    if (want && this.h.level === 1 && !this.held) this.sc.tweens.add({ targets: want.img, y: want.home.y - 26 * this.k, duration: 180, yoyo: true, repeat: 1, ease: 'Quad.easeOut' });
  }

  /** The tray item the current part wants next (the tool; the right one to pick; any, else). */
  private wanted(t: Task): Item | null {
    if (t.tool) return this.itemOf(t.tool);
    const want = (t as Task & { want?: () => Item | null }).want;
    return want ? want() : null;
  }

  private itemOf(id: string) {
    return this.items.find((q) => q.id === id && !q.gone) ?? null;
  }

  /** The room is done: the tray goes, the close-up shrinks back, the towel comes off, the blanket folds down. */
  private finish() {
    if (this.finished) return;
    this.finished = true;
    this.h.setPhase('intro');
    this.clearTray();
    this.closeZoom();
    const bl = this.o.blanket;
    if (bl) this.sc.tweens.add({ targets: bl, scaleY: (80 * (bl.getData('s0') ?? 1)) / 340, duration: 500, ease: 'Sine.easeInOut' });
    if (this.o.towelHead) {
      const t = this.o.towelHead;
      const at = this.h.view.at({ x: 300, y: this.h.patient.forehead.y - 30 });
      this.sc.tweens.add({ targets: t, alpha: 0, y: t.y - 60, duration: 500, delay: 300 });
      this.sc.time.delayedCall(300, () => burst(this.sc, at.x, at.y, { texture: FX_SOFT, count: 6, tint: 0xdff3fa, size: 40 * this.k, speed: 160 * this.k, gravityY: 80, lifespan: 600, depth: 60 }));
    }
    this.sc.time.delayedCall(650, () => this.h.done());
  }

  /** Everything the room made (the slide back to the waiting room is a door: the room goes at once). */
  destroy() {
    this.clearTray(true);
    this.zoom?.destroy();
    this.zoom = null;
    for (const f of this.foams) f.destroy();
    for (const e of this.extras) e.destroy();
    this.dim?.destroy();
    this.o.towelHead?.destroy();
    for (const ob of this.objects) ob.destroy();
    this.objects = [];
    this.foams = [];
    this.extras = [];
  }

  // ---------------------------------------------------------------- the tray

  /** The tray in the left column: these things on their dishes (kept as they are if they are the same). */
  private layTray(list: { id: string; key: string; tint?: number; scale?: number; data?: number }[]) {
    const same = list.length === this.items.length && list.every((q, i) => this.items[i]?.id === q.id && !this.items[i].gone);
    if (same) return;
    this.clearTray();
    const S = this.h.S;
    const n = list.length;
    const sc = S.binScale(Math.max(n, 2));
    this.items = list.map((q, i) => {
      const at = S.bin(i, n);
      const slot = this.sc.add.image(at.x, at.y, 'clinic-slot').setScale(0).setDepth(20);
      const glow = this.sc.add.image(at.x, at.y, FX_SOFT).setTint(0xfff1a8).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0).setDepth(21);
      glow.setScale((240 * sc * 1.3) / glow.frame.realWidth);
      const img = this.sc.add.image(at.x, at.y, q.key).setScale(0).setDepth(22);
      if (q.tint !== undefined) img.setTint(q.tint);
      const fit = 240 / Math.max(img.frame.realWidth, img.frame.realHeight) * ((IMAGES[q.key as ImageKey] as { raster?: number } | undefined)?.raster ?? 1);
      const homeScale = sc * 0.92 * Math.min(1.25, fit) * (q.scale ?? 1);
      this.sc.tweens.add({ targets: slot, scale: sc, duration: 300, delay: 80 * i, ease: 'Back.easeOut' });
      this.sc.tweens.add({ targets: img, scale: homeScale, duration: 300, delay: 80 * i + 60, ease: 'Back.easeOut' });
      return { id: q.id, img, slot, glow, home: at, homeScale, gone: false, tool: q.key.startsWith('tool-'), data: q.data };
    });
    sfx(this.sc, 'whoosh', { volume: 0.4 });
  }

  private clearTray(now = false) {
    for (const it of this.items) {
      this.sc.tweens.killTweensOf([it.img, it.slot, it.glow]);
      if (now) {
        it.img.destroy();
        it.slot.destroy();
        it.glow.destroy();
        continue;
      }
      this.sc.tweens.add({ targets: [it.img, it.slot, it.glow], scale: 0, alpha: 0, duration: 260, onComplete: () => (it.img.destroy(), it.slot.destroy(), it.glow.destroy()) });
    }
    this.items = [];
    this.held = null;
  }

  /** A tray item used up: it and its dish go. */
  private useUp(it: Item) {
    it.gone = true;
    this.sc.tweens.killTweensOf([it.img, it.slot, it.glow]);
    this.sc.tweens.add({ targets: [it.slot, it.glow], scale: 0, alpha: 0, duration: 260 });
  }

  private backToTray(it: Item) {
    this.sc.tweens.killTweensOf(it.img);
    it.img.setDepth(22).setAngle(0);
    this.sc.tweens.add({ targets: it.img, x: it.home.x, y: it.home.y, scale: it.homeScale, angle: 0, duration: 360, ease: 'Back.easeOut' });
  }

  /** A wrong pick: it wobbles back to its dish (a miss; nothing lost). */
  private wrong(it: Item) {
    this.h.shown.careWrong = ((this.h.shown.careWrong as number) ?? 0) + 1;
    this.backToTray(it);
    boing(this.sc, it.img, 0.15);
    this.sc.tweens.add({ targets: it.img, angle: { from: -12, to: 12 }, duration: 90, yoyo: true, repeat: 2, delay: 360, onComplete: () => it.img.setAngle(0) });
    sfx(this.sc, 'squish', { volume: 0.6 });
    this.h.miss();
  }

  // ---------------------------------------------------------------- tools in her hand

  private toolScale() {
    return 0.92 * this.k;
  }

  private tipOf(id: string): P {
    return (C.tip as Record<string, P>)[id] ?? { x: 120, y: 120 };
  }

  /** The carried thing's working point (a tool's tip; anything else, its middle). */
  private tip(it: Item): P {
    if (!it.tool) return { x: it.img.x, y: it.img.y };
    const tp = this.tipOf(it.id);
    const s = it.img.scale;
    return { x: it.img.x + (tp.x - 120) * s, y: it.img.y + (tp.y - 120) * s };
  }

  private tipTo(it: Item, p: P) {
    if (!it.tool) return it.img.setPosition(p.x, p.y);
    const tp = this.tipOf(it.id);
    const s = it.img.scale;
    it.img.setPosition(p.x - (tp.x - 120) * s, p.y - (tp.y - 120) * s);
  }

  /** The working point for a finger at `f`: a little above and left of it, so the finger doesn't hide it. */
  private fingerTip(f: P): P {
    return { x: f.x - 26 * this.k, y: f.y - 66 * this.k };
  }

  /** The see-through prop Mom's grab hand carries (a tool by its tip on her hand's anchor). */
  private prop(it: Item, alpha = 0.6) {
    const s = it.tool ? this.toolScale() : it.homeScale;
    const tp = it.tool ? this.tipOf(it.id) : { x: 120, y: 120 };
    const key = it.img.texture.key;
    const r = (IMAGES[key as ImageKey] as { raster?: number } | undefined)?.raster ?? 1;
    return { key, scale: s, dx: it.tool ? (120 - tp.x) * s : 0, dy: it.tool ? (120 - tp.y) * s : 0, alpha, originX: 0.5, originY: 0.5, tint: it.img.tintTopLeft !== 0xffffff ? it.img.tintTopLeft : undefined, _r: r };
  }

  // ---------------------------------------------------------------- touch (from ClinicScene, phase 'care')

  down(p: Phaser.Input.Pointer, at: P) {
    const t = this.task;
    if (!t || this.finished) return;
    const k = this.k;
    const it = this.items.find((q) => !q.gone && Math.hypot(at.x - q.img.x, at.y - q.img.y) < Math.max(115 * k, 120 * q.homeScale));
    if (it) {
      if (t.tool && it.id !== t.tool) return this.wrong(it);
      return this.pickUp(p, it, at);
    }
    if (t.tool && t.area) {
      // (a touch on her with the tool still on the tray: the tool jumps to the finger)
      const a = t.area();
      const tool = this.itemOf(t.tool);
      if (tool && Math.hypot(at.x - a.c.x, at.y - a.c.y) < a.r) return this.pickUp(p, tool, at);
    }
    if (t.tap?.(at)) return;
    if (t.grab?.(at)) {
      this.dragging = true;
      this.h.own(p);
      this.h.poke();
    }
  }

  private pickUp(p: Phaser.Input.Pointer, it: Item, at: P) {
    this.sc.tweens.killTweensOf(it.img);
    it.img.setDepth(600);
    if (it.tool) it.img.setScale(this.toolScale());
    this.tipTo(it, it.tool ? this.fingerTip(at) : { x: at.x, y: at.y - 40 * this.k });
    boing(this.sc, it.img, 0.08);
    sfx(this.sc, 'tap', { volume: 0.7 });
    for (const q of this.items) this.sc.tweens.add({ targets: q.glow, alpha: 0, duration: 200 });
    this.held = { it, from: at, t0: this.sc.time.now, moved: 0, last: this.tip(it) };
    this.h.own(p);
  }

  move(p: Phaser.Input.Pointer) {
    const L = this.h.L;
    const f = { x: Phaser.Math.Clamp(p.worldX, 0, L.W), y: Phaser.Math.Clamp(p.worldY, 0, L.H) };
    if (this.dragging) return this.task?.pull?.(f);
    const hd = this.held;
    if (!hd) return;
    hd.moved = Math.max(hd.moved, Math.hypot(f.x - hd.from.x, f.y - hd.from.y));
    this.tipTo(hd.it, hd.it.tool ? this.fingerTip(f) : { x: f.x, y: f.y - 40 * this.k });
    const tp = this.tip(hd.it);
    const dist = Math.hypot(tp.x - hd.last.x, tp.y - hd.last.y);
    hd.last = tp;
    const t = this.task;
    if (t?.tool === hd.it.id && this.h.phase() === 'care') t.work?.(tp, dist, 0);
  }

  tick(delta: number) {
    const hd = this.held;
    const t = this.task;
    if (!hd || !t || t.tool !== hd.it.id || this.h.phase() !== 'care') return;
    t.work?.(this.tip(hd.it), 0, delta);
  }

  up(_p: Phaser.Input.Pointer, cancelled: boolean) {
    if (this.dragging) {
      this.dragging = false;
      return;
    }
    const hd = this.held;
    this.held = null;
    if (!hd) return;
    const t = this.task;
    const it = hd.it;
    const tapped = hd.moved < 30 * this.k && this.sc.time.now - hd.t0 < 450;
    if (cancelled || !t || this.h.phase() !== 'care') return this.backToTray(it);
    if (t.choose) {
      const tg = t.dropAt?.() ?? null;
      if (tapped || (tg && Math.hypot(it.img.x - tg.x, it.img.y - tg.y) < 170 * this.k)) return t.choose(it);
      if (hd.moved > 40 * this.k) this.h.miss();
      return this.backToTray(it);
    }
    // a tap on a tool that has to be rubbed or held: Mom's hand shows how (no miss)
    if (tapped) this.h.hintNow();
    this.backToTray(it);
  }

  /** What Mom and Pipa look at: the thing she holds. */
  look(): P | null {
    return this.held ? { x: this.held.it.img.x, y: this.held.it.img.y } : null;
  }

  // ---------------------------------------------------------------- Mom's hand

  way(): HandMotion | null {
    if (this.finished) return null;
    return this.task?.way() ?? null;
  }

  help(): boolean {
    if (this.finished) return false;
    return this.task?.help() ?? false;
  }

  plan(): CarePlan {
    if (this.finished || this.h.phase() !== 'care') return null;
    return this.task?.plan() ?? null;
  }

  /** Mom's finger taps a tray item, then it is chosen (her help for a pick). */
  private helpPick(t: Task, it: Item | null): boolean {
    if (!it || !t.choose) return false;
    this.h.hand.play(tapMotion(it.home, this.k));
    this.sc.time.delayedCall(650, () => {
      this.h.helped();
      if (this.task === t && !it.gone && this.h.phase() === 'care') t.choose!(it);
    });
    return true;
  }

  /** Mom's hand carries the tool along `keys` (the tip's path), working as it goes; then whatever is left is done. */
  private helpTool(t: Task, keys: HandKey[], finish: () => void): boolean {
    const it = t.tool ? this.itemOf(t.tool) : null;
    if (!it || !keys.length) return false;
    const k = this.k;
    this.sc.tweens.killTweensOf(it.img);
    it.img.setDepth(600);
    this.sc.tweens.add({ targets: it.img, scale: this.toolScale(), duration: 200 });
    this.h.hand.follow('grab', () => ({ x: it.img.x, y: it.img.y }));
    const start = this.tip(it);
    const all = [{ ...start, t: 0 }, ...keys.map((q) => ({ ...q, t: q.t + 600 }))];
    const total = Math.min(12000, all[all.length - 1].t + 200);
    let last = start;
    let prev = 0;
    this.sc.tweens.addCounter({
      from: 0,
      to: total,
      duration: total,
      onUpdate: (tw) => {
        if (this.task !== t || this.finished) return;
        const now = tw.getValue() ?? 0;
        const p = at(all, now);
        this.tipTo(it, p);
        const d = Math.hypot(p.x - last.x, p.y - last.y);
        last = p;
        if (now > 600) t.work?.(p, Math.max(d, 4 * k), now - prev);
        prev = now;
      },
      onComplete: () => {
        this.h.helped();
        if (this.task !== t || this.finished) return;
        this.backToTray(it);
        finish();
      },
    });
    return true;
  }

  private grabWay(it: Item | null, path: HandKey[]): HandMotion | null {
    if (!it) return null;
    const s = this.toolScale();
    const tp = it.tool ? this.tipOf(it.id) : { x: 120, y: 120 };
    const start = { x: it.home.x + (tp.x - 120) * s, y: it.home.y + (tp.y - 120) * s };
    const keys: HandKey[] = [{ ...start, t: 0 }, { ...start, t: 300 }, ...path.map((q) => ({ ...q, t: q.t + 1100 }))];
    keys.push({ ...keys[keys.length - 1], t: keys[keys.length - 1].t + 400 });
    const pr = this.prop(it);
    return { kind: 'grab', keys, props: [{ key: pr.key, scale: rs(pr.key, it.tool ? s : it.homeScale * pr._r), dx: pr.dx, dy: pr.dy, alpha: 0.6, tint: pr.tint }], glow: it.home };
  }

  /** Little circles over a point (the hint's rubbing). */
  private circles(c: P, r: number, loops: number, ms: number, t0 = 0): HandKey[] {
    const keys: HandKey[] = [];
    const n = 8 * loops;
    for (let i = 0; i <= n; i++) {
      const a = (i / 8) * Math.PI * 2;
      keys.push({ x: c.x + Math.cos(a) * r, y: c.y + Math.sin(a) * r * 0.7, t: t0 + (ms * i) / n });
    }
    return keys;
  }

  // ---------------------------------------------------------------- what is in each room

  private makeTasks(): Task[] {
    switch (this.room) {
      case 'medicine':
        return [this.flavor(), this.shake(), this.spoon()];
      case 'bath':
        return [this.sponge(), ...(this.h.level === 2 ? [this.duck()] : []), this.shower(), this.towel()];
      case 'bandage':
        return [this.wrapping(), this.heartOn()];
      case 'polish':
        return [this.paste(), this.polishing(), this.rinse()];
      case 'eyes':
        return [this.chart(), this.glasses()];
      case 'rest':
        return [this.blanket(), this.lamp(), this.snacks()];
    }
  }

  // ---- hard: "Do you remember what was wrong?" (two cards: one of hers, one not)
  private remember(): Task {
    const self = this;
    const v = this.h;
    const mine = v.as[0];
    const others = (Object.keys(AILMENTS) as AilmentId[]).filter((a) => !v.as.some((q) => q.id === a) && v.patient.ailments.includes(a));
    const other = AILMENTS[Phaser.Utils.Array.GetRandom(others.length ? others : (Object.keys(AILMENTS) as AilmentId[]).filter((a) => a !== mine.id))];
    const t: Task & { want: () => Item | null } = {
      name: 'remember',
      line: 'vo-care-remember',
      start() {
        self.layTray(Phaser.Utils.Array.Shuffle([{ id: mine.id, key: mine.card }, { id: other.id, key: other.card }]));
        self.sc.time.delayedCall(400, () => self.go(t));
      },
      want: () => self.itemOf(mine.id),
      choose(it) {
        if (it.id !== mine.id) {
          self.wrong(it);
          const r = t.want();
          if (r) self.sc.tweens.add({ targets: r.glow, alpha: 0.95, duration: 260 });
          return;
        }
        self.h.setPhase('intro');
        self.h.poke();
        boing(self.sc, it.img, 0.25);
        stars(self.sc, it.img.x, it.img.y, 8, 40 * self.k);
        sfx(self.sc, 'sparkle', { minGapMs: 0 });
        self.h.view.react('love');
        self.h.say('vo-care-right', { ttlMs: 3000 });
        self.sc.time.delayedCall(1200, () => self.next());
      },
      dropAt: () => null,
      way: () => (t.want() ? tapMotion(t.want()!.home, self.k) : null),
      help: () => self.helpPick(t, t.want()),
      plan: () => (t.want() ? { kind: 'tap', at: t.want()!.home } : null),
    };
    return t;
  }

  // ---- medicine: the flavour, shake it, a spoonful
  private flavor(): Task {
    const self = this;
    const want = this.h.level === 2 ? Phaser.Utils.Array.GetRandom([...FLAVORS]) : null;
    const t: Task & { want: () => Item | null } = {
      name: 'flavor',
      line: 'vo-care-medicine',
      start() {
        self.layTray(Phaser.Utils.Array.Shuffle(FLAVORS.map((f, i) => ({ id: f.id, key: f.jar, data: i }))));
        self.sc.time.delayedCall(400, () => {
          self.go(t);
          if (want) {
            self.h.say('vo-care-flavor', { ttlMs: 6000 });
            self.h.say(want.name, { ttlMs: 8000 });
          }
        });
      },
      want: () => (want ? self.itemOf(want.id) : self.items.find((q) => !q.gone) ?? null),
      dropAt: () => ({ x: self.o.back.x, y: self.o.back.y }),
      choose(it) {
        const f = FLAVORS[it.data ?? 0];
        if (want && f.id !== want.id) {
          self.wrong(it);
          self.h.say(want.name, { ttlMs: 3000, group: 'name' });
          return;
        }
        self.h.setPhase('intro');
        self.h.poke();
        self.pour(it, f.tint, () => self.next());
      },
      way: () => (t.want() ? tapMotion(t.want()!.home, self.k) : null),
      help: () => self.helpPick(t, t.want()),
      plan: () => (t.want() ? { kind: 'tap', at: t.want()!.home } : null),
    };
    return t;
  }

  /** The jar tips over the bottle and the medicine rises in it, in the jar's colour. */
  private pour(it: Item, tint: number, then: () => void) {
    const k = this.k;
    const b = this.o.back;
    const s = b.getData('s') as number;
    const fill = this.o.fill;
    const L = C.care.bottleLiq;
    fill.setTint(tint);
    this.sc.tweens.killTweensOf(it.img);
    it.img.setDepth(600);
    const over = { x: b.x + 90 * s, y: b.y - 250 * s };
    this.sc.tweens.add({ targets: it.img, x: over.x, y: over.y, angle: -110, scale: it.homeScale * 0.9, duration: 380, ease: 'Sine.easeInOut' });
    this.sc.time.delayedCall(400, () => {
      sfx(this.sc, 'pour', { volume: 0.6 });
      const level = { u: 0 };
      this.sc.tweens.add({
        targets: level,
        u: 1,
        duration: T.pourMs,
        onUpdate: () => {
          const top = L.bottom - (L.bottom - L.top) * level.u;
          fill.setCrop(0, top, 260, 380 - top);
          if (Math.random() < 0.5) {
            const d = this.sc.add.image(over.x - 50 * s + Phaser.Math.Between(-6, 6) * k, over.y + 40 * s, 'water-drop').setTint(tint).setScale(0.3 * k).setDepth(11);
            this.sc.tweens.add({ targets: d, y: b.y + (top - 190) * s, duration: 260, ease: 'Quad.easeIn', onComplete: () => d.destroy() });
          }
        },
        onComplete: () => {
          this.useUp(it);
          this.sc.tweens.add({ targets: it.img, alpha: 0, scale: 0, duration: 300 });
          stars(this.sc, b.x, b.y - 60 * s, 6, 34 * k);
          sfx(this.sc, 'sparkle', { minGapMs: 0, volume: 0.6 });
          this.sc.time.delayedCall(500, then);
        },
      });
    });
  }

  private shake(): Task {
    const self = this;
    let n = 0;
    const need = T.shakes[this.h.level - 1];
    const at = () => ({ x: self.o.back.x, y: self.o.back.y });
    const t: Task = {
      name: 'shake',
      line: 'vo-care-shake',
      start() {
        self.layTray([]);
        self.go(t);
      },
      tap(p) {
        const b = self.o.back;
        const s = b.getData('s') as number;
        if (Math.abs(p.x - b.x) > Math.max(150 * self.k, 140 * s) || Math.abs(p.y - b.y) > Math.max(220 * self.k, 200 * s)) return false;
        self.shakeOnce();
        if (++n >= need) {
          self.h.setPhase('intro');
          self.sc.time.delayedCall(700, () => self.next());
        }
        return true;
      },
      way: () => tapMotion(at(), self.k),
      help() {
        self.h.hand.play(tapMotion(at(), self.k));
        for (let i = 0; i < need - n; i++) self.sc.time.delayedCall(450 + i * 380, () => self.task === t && self.shakeOnce());
        self.sc.time.delayedCall(450 + (need - n) * 380 + 200, () => {
          self.h.helped();
          if (self.task === t) {
            n = need;
            self.h.setPhase('intro');
            self.next();
          }
        });
        return true;
      },
      plan: () => ({ kind: 'tap', at: at() }),
    };
    return t;
  }

  private shakeOnce() {
    const k = this.k;
    const parts = [this.o.back, this.o.fill, this.o.front];
    this.h.poke();
    this.sc.tweens.killTweensOf(parts);
    for (const q of parts) q.setAngle(0);
    this.sc.tweens.add({ targets: parts, angle: { from: -12, to: 12 }, duration: 90, yoyo: true, repeat: 1, ease: 'Sine.easeInOut', onComplete: () => parts.forEach((q) => q.setAngle(0)) });
    sfx(this.sc, 'shake', { minGapMs: 120 });
    const b = this.o.back;
    for (let i = 0; i < 4; i++) this.bubble(b.x + Phaser.Math.Between(-50, 50) * k, b.y + Phaser.Math.Between(-30, 80) * k, 12);
  }

  private spoon(): Task {
    const self = this;
    let n = 0;
    const need = T.spoons[this.h.level - 1];
    const t: Task & { want: () => Item | null } = {
      name: 'spoon',
      line: 'vo-care-spoon',
      start() {
        self.layTray([{ id: 'syrup', key: 'tool-syrup' }]);
        self.sc.time.delayedCall(350, () => self.go(t));
      },
      want: () => self.itemOf('syrup'),
      dropAt: () => self.h.view.mouthAt,
      choose(it) {
        self.h.setPhase('intro');
        self.h.poke();
        self.feed(it, () => {
          n++;
          if (need > 1) self.h.say(countKey(n), { ttlMs: 2500, group: 'count', sequence: true });
          if (n >= need) return self.sc.time.delayedCall(500, () => self.next());
          self.backToTray(it);
          self.sc.time.delayedCall(500, () => self.go(t, null));
        }, true);
      },
      way: () => (t.want() ? tapMotion(t.want()!.home, self.k) : null),
      help: () => self.helpPick(t, t.want()),
      plan: () => (t.want() ? { kind: 'tap', at: t.want()!.home } : null),
    };
    return t;
  }

  /** A spoon or a snack flies to her mouth: she opens wide, munches, smiles. */
  private feed(it: Item, then: () => void, keep = false) {
    const v = this.h.view;
    const m = v.mouthAt;
    this.sc.tweens.killTweensOf(it.img);
    it.img.setDepth(600);
    v.setMood('expect');
    const tp = it.tool ? this.tipOf(it.id) : { x: 120, y: 120 };
    const s = it.tool ? this.toolScale() : it.img.scale;
    this.sc.tweens.add({ targets: it.img, x: m.x - (tp.x - 120) * s, y: m.y - (tp.y - 120) * s, scale: s, angle: it.tool ? -20 : 0, duration: 420, ease: 'Sine.easeInOut' });
    this.sc.time.delayedCall(450, () => {
      sfx(this.sc, 'munch', { volume: 0.6 });
      v.setMood('chew');
      if (!keep) {
        this.useUp(it);
        this.sc.tweens.add({ targets: it.img, scale: 0, alpha: 0, duration: 260 });
      }
    });
    this.sc.time.delayedCall(1100, () => {
      v.setMood('happy');
      burst(this.sc, m.x, m.y - 40 * this.k, { texture: 'fx-heart', count: 4, tint: [0xf06a8a, 0xf5a3b5], size: 30 * this.k, speed: 160 * this.k, gravityY: -100, lifespan: 700, depth: 60 });
      this.sc.time.delayedCall(400, () => v.setMood('rest'));
      then();
    });
  }

  // ---- the bath: bubbles with the sponge, (hard: find the duck), rinse with the shower, the towel on her head
  /** Her body in the tub (where the sponge and the shower work). */
  private bodyArea() {
    const v = this.h.view;
    return { c: v.at({ x: 300, y: 430 }), r: 300 * v.scale };
  }

  private sponge(): Task {
    const self = this;
    const need = T.foam[this.h.level - 1];
    let acc = 0;
    const t: Task = {
      name: 'sponge',
      line: 'vo-care-bath',
      tool: 'sponge',
      start() {
        self.layTray([{ id: 'sponge', key: 'tool-sponge' }, { id: 'shower', key: 'tool-shower' }, { id: 'towel', key: 'tool-towel' }]);
        self.sc.time.delayedCall(400, () => self.go(t));
      },
      area: () => self.bodyArea(),
      work(tip, dist) {
        const a = self.bodyArea();
        if (dist <= 0 || Math.hypot(tip.x - a.c.x, tip.y - a.c.y) > a.r || self.foams.length >= need) return;
        self.h.poke();
        acc += dist;
        sfx(self.sc, 'brush', { minGapMs: 300, volume: 0.6 });
        if (Math.random() < 0.3) self.bubble(tip.x + Phaser.Math.Between(-30, 30) * self.k, tip.y + Phaser.Math.Between(-20, 20) * self.k);
        if (Math.random() < 0.015) self.tickle();
        if (acc < T.foamEvery * self.k) return;
        acc = 0;
        self.addFoam(tip);
        if (self.foams.length >= need) {
          self.h.setPhase('intro');
          self.sc.time.delayedCall(600, () => self.next());
        }
      },
      way: () => self.grabWay(self.itemOf('sponge'), self.circles(self.bodyArea().c, 90 * self.k, 2, 1200)),
      help: () => self.helpTool(t, self.foamPath(need - self.foams.length), () => {
        while (self.foams.length < need) self.addFoam(self.foamSpot());
        self.h.setPhase('intro');
        self.next();
      }),
      plan: () => {
        const it = self.itemOf('sponge');
        return it ? { kind: 'rub', from: it.home, at: self.foamSpot(), r: 50 * self.k } : null;
      },
    };
    return t;
  }

  /** A free place on her for the next bubbles (round her middle and her head). */
  private foamSpot(): P {
    const v = this.h.view;
    const spots = [{ x: 300, y: 470 }, { x: 230, y: 420 }, { x: 370, y: 420 }, { x: 300, y: 300 }, { x: 220, y: 520 }, { x: 380, y: 520 }, { x: 300, y: 200 }, { x: 250, y: 360 }, { x: 350, y: 360 }, { x: 300, y: 540 }];
    return v.at(spots[this.foams.length % spots.length]);
  }

  private foamPath(n: number): HandKey[] {
    const keys: HandKey[] = [];
    let t = 0;
    for (let i = 0; i < n + 1; i++) {
      const v = this.h.view;
      const spots = [{ x: 300, y: 470 }, { x: 230, y: 420 }, { x: 370, y: 420 }, { x: 300, y: 300 }, { x: 220, y: 520 }, { x: 380, y: 520 }, { x: 300, y: 200 }, { x: 250, y: 360 }, { x: 350, y: 360 }, { x: 300, y: 540 }];
      const c = v.at(spots[(this.foams.length + i) % spots.length]);
      keys.push(...this.circles(c, 40 * this.k, 1, 500, t));
      t += 520;
    }
    return keys;
  }

  private addFoam(at: P) {
    const k = this.k;
    const s = this.h.view.scale;
    const f = this.sc.add.image(at.x + Phaser.Math.Between(-12, 12) * k, at.y + Phaser.Math.Between(-12, 12) * k, 'clinic-foam').setDepth(13).setScale(0).setAngle(Phaser.Math.Between(-30, 30));
    this.sc.tweens.add({ targets: f, scale: rs('clinic-foam', Phaser.Math.FloatBetween(1.2, 1.6) * Math.max(0.6, s)), duration: 260, ease: 'Back.easeOut' });
    this.foams.push(f);
    sfx(this.sc, 'pop', { minGapMs: 0, volume: 0.45 });
    for (let i = 0; i < 3; i++) this.bubble(at.x + Phaser.Math.Between(-40, 40) * k, at.y + Phaser.Math.Between(-30, 20) * k);
    this.h.shown.foam = this.foams.length;
  }

  /** The sponge or the towel tickles: she giggles and wiggles. */
  private tickle() {
    const v = this.h.view;
    sfx(this.sc, 'char-giggle', { minGapMs: 1500, rate: v.rate, volume: 0.5 });
    this.sc.tweens.add({ targets: v.box, angle: { from: -4, to: 4 }, duration: 110, yoyo: true, repeat: 1, ease: 'Sine.easeInOut', onComplete: () => v.box.setAngle(0) });
  }

  private duck(): Task {
    const self = this;
    let duck: Phaser.GameObjects.Image | null = null;
    let under: Phaser.GameObjects.Image | null = null;
    const found = () => {
      self.h.setPhase('intro');
      self.h.poke();
      const d = duck!;
      sfx(self.sc, 'squeak', { minGapMs: 0 });
      sfx(self.sc, 'splash', { minGapMs: 0, volume: 0.6 });
      d.setVisible(true).setAlpha(1);
      const rim = self.o.front;
      const s = rim.scale;
      self.sc.tweens.add({ targets: d, y: d.y - 90 * self.k, duration: 300, ease: 'Quad.easeOut', yoyo: true, hold: 200 });
      self.sc.time.delayedCall(820, () => {
        self.sc.tweens.add({ targets: d, x: rim.x - 330 * s, y: rim.y + (C.care.tubRim - 290) * s, duration: 600, ease: 'Sine.easeInOut' });
        d.setDepth(14.5);
      });
      stars(self.sc, d.x, d.y, 8, 40 * self.k);
      self.h.view.react('giggle');
      self.sc.time.delayedCall(1600, () => self.next());
    };
    const t: Task = {
      name: 'duck',
      line: 'vo-care-duck',
      start() {
        under = Phaser.Utils.Array.GetRandom(self.foams);
        duck = self.sc.add.image(under.x, under.y, 'care-duck').setScale(0.7 * self.k).setDepth(12.9).setVisible(false);
        self.extras.push(duck);
        self.go(t);
      },
      tap(p) {
        const f = self.foams.filter((q) => Math.hypot(p.x - q.x, p.y - q.y) < 110 * self.k).sort((a, b) => Math.hypot(p.x - a.x, p.y - a.y) - Math.hypot(p.x - b.x, p.y - b.y))[0];
        if (!f) return false;
        if (f === under) {
          found();
          return true;
        }
        // (not there: the bubbles wobble; looking is never wrong)
        boing(self.sc, f, 0.2);
        self.bubble(f.x, f.y);
        sfx(self.sc, 'pop', { minGapMs: 100, volume: 0.4 });
        // (a miss, like every search: three in a row bring Mom's hint at once, instead of keeping it away)
        self.h.miss();
        return true;
      },
      way: () => (under ? tapMotion({ x: under.x, y: under.y }, self.k) : null),
      help() {
        if (!under) return false;
        self.h.hand.play(tapMotion({ x: under.x, y: under.y }, self.k));
        self.sc.time.delayedCall(650, () => {
          self.h.helped();
          if (self.task === t) found();
        });
        return true;
      },
      plan: () => (under ? { kind: 'tap', at: { x: under.x, y: under.y } } : null),
    };
    return t;
  }

  private shower(): Task {
    const self = this;
    let held = 0;
    const t: Task = {
      name: 'shower',
      line: 'vo-care-rinse',
      tool: 'shower',
      start() {
        self.go(t);
      },
      area: () => self.bodyArea(),
      work(tip, _dist, delta) {
        const a = self.bodyArea();
        if (Math.hypot(tip.x - a.c.x, tip.y - a.c.y) > a.r * 1.3 || !self.foams.length) return;
        if (delta <= 0) return;
        self.h.poke();
        if (Math.random() < delta / 50) {
          const d = self.sc.add.image(tip.x + Phaser.Math.Between(-30, 30) * self.k, tip.y + 20 * self.k, 'water-drop').setScale(0.3 * self.k).setDepth(15).setAlpha(0.9);
          self.sc.tweens.add({ targets: d, y: d.y + Phaser.Math.Between(140, 260) * self.k, alpha: 0.3, duration: 380, ease: 'Quad.easeIn', onComplete: () => d.destroy() });
        }
        sfx(self.sc, 'splash', { minGapMs: 900, volume: 0.45 });
        held += delta;
        if (held < T.rinseMs) return;
        held = 0;
        self.rinseOne(tip);
        if (!self.foams.length) {
          self.h.setPhase('intro');
          self.sc.time.delayedCall(500, () => {
            stars(self.sc, a.c.x, a.c.y - 100 * self.k, 8, 40 * self.k);
            sfx(self.sc, 'sparkle', { minGapMs: 0 });
            self.next();
          });
        }
      },
      way: () => {
        const c = self.bodyArea().c;
        return self.grabWay(self.itemOf('shower'), [{ ...c, t: 0 }, { x: c.x - 60 * self.k, y: c.y - 40 * self.k, t: 700 }, { x: c.x + 60 * self.k, y: c.y, t: 1400 }]);
      },
      help: () => {
        const keys: HandKey[] = [];
        let tt = 0;
        for (const f of self.foams) {
          keys.push({ x: f.x, y: f.y - 30 * self.k, t: tt }, { x: f.x + 4, y: f.y - 30 * self.k, t: tt + T.rinseMs + 120 });
          tt += T.rinseMs + 260;
        }
        return self.helpTool(t, keys, () => {
          while (self.foams.length) self.rinseOne(null);
          self.h.setPhase('intro');
          self.next();
        });
      },
      plan: () => {
        const it = self.itemOf('shower');
        const f = self.foams[0];
        return it && f ? { kind: 'hold', from: it.home, at: { x: f.x, y: f.y - 20 * self.k } } : null;
      },
    };
    return t;
  }

  /** The water takes the bubbles nearest the shower away. */
  private rinseOne(tip: P | null) {
    if (!this.foams.length) return;
    const i = tip ? this.foams.reduce((b, q, j) => (Math.hypot(q.x - tip.x, q.y - tip.y) < Math.hypot(this.foams[b].x - tip.x, this.foams[b].y - tip.y) ? j : b), 0) : 0;
    const [f] = this.foams.splice(i, 1);
    this.sc.tweens.add({ targets: f, alpha: 0, y: f.y + 40 * this.k, duration: 300, onComplete: () => f.destroy() });
    this.bubble(f.x, f.y);
    sfx(this.sc, 'pop', { minGapMs: 0, volume: 0.35 });
    this.h.shown.foam = this.foams.length;
  }

  private towel(): Task {
    const self = this;
    const need = T.towel[this.h.level - 1];
    let acc = 0;
    const head = () => self.h.view.at({ x: 300, y: self.h.patient.forehead.y + 20 });
    const t: Task = {
      name: 'towel',
      line: 'vo-care-towel',
      tool: 'towel',
      start() {
        self.go(t);
      },
      area: () => ({ c: head(), r: 220 * self.h.view.scale }),
      work(tip, dist) {
        const c = head();
        if (dist <= 0 || Math.hypot(tip.x - c.x, tip.y - c.y) > 240 * self.h.view.scale + 40 * self.k) return;
        self.h.poke();
        acc += dist;
        sfx(self.sc, 'wrap', { minGapMs: 450, volume: 0.5 });
        if (Math.random() < 0.15) burst(self.sc, tip.x, tip.y, { texture: FX_SOFT, count: 1, tint: 0xdff3fa, size: 30 * self.k, speed: 160 * self.k, gravityY: 200, lifespan: 500, depth: 60 });
        if (Math.random() < 0.02) self.tickle();
        if (acc >= need * self.k) self.towelOn();
      },
      way: () => self.grabWay(self.itemOf('towel'), self.circles(head(), 70 * self.k, 2, 1200)),
      help: () => self.helpTool(t, self.circles(head(), 70 * self.k, Math.ceil((need * self.k - acc) / (2 * Math.PI * 60 * self.k)) + 1, 2600), () => self.towelOn()),
      plan: () => {
        const it = self.itemOf('towel');
        return it ? { kind: 'rub', from: it.home, at: head(), r: 60 * self.k } : null;
      },
    };
    return t;
  }

  /** Dry: the towel wraps round her head (until she leaves the room). */
  private towelOn() {
    if (this.o.towelHead || this.task?.name !== 'towel') return;
    this.h.setPhase('intro');
    const it = this.itemOf('towel');
    if (it) {
      this.held = null;
      this.useUp(it);
      this.sc.tweens.add({ targets: it.img, alpha: 0, scale: 0, duration: 260 });
    }
    const v = this.h.view;
    const th = v.put('care-towel-head', { x: 300, y: this.h.patient.forehead.y - 40 }, 1.0);
    this.o.towelHead = th;
    boing(this.sc, th, 0.3);
    sfx(this.sc, 'pop');
    const at = v.at({ x: 300, y: this.h.patient.forehead.y - 40 });
    stars(this.sc, at.x, at.y, 8, 40 * this.k);
    v.react('love');
    this.sc.time.delayedCall(1200, () => this.next());
  }

  // ---- the bandage: round and round her knee, paw, hand or arm; a heart on top
  private openZoom(lens: ImageKey, tint: boolean) {
    const k = this.k;
    const { at, s } = this.h.area.zoom;
    this.zoomS = s;
    const parts: Phaser.GameObjects.GameObject[] = [new Phaser.GameObjects.Arc(this.sc, 0, 0, (LENS / 2 - 6) * s, 0, 360, false, 0xf3f7ef)];
    const base = new Phaser.GameObjects.Image(this.sc, 0, 0, lens).setScale(rs(lens, s));
    if (tint) {
      const c = Phaser.Display.Color.IntegerToColor(this.h.patient.tint.skin);
      base.setTint(Phaser.Display.Color.GetColor(c.red + (255 - c.red) * 0.4, c.green + (255 - c.green) * 0.4, c.blue + (255 - c.blue) * 0.4));
    }
    parts.push(base, new Phaser.GameObjects.Image(this.sc, 0, 0, 'lens-ring').setScale(rs('lens-ring', s)));
    const v = this.h.view;
    const p = this.h.patient;
    this.zoomFrom = this.room === 'polish' ? v.mouthAt : v.at(p.signature === 'knee' ? p.foot ?? p.chest[0] : p.signature === 'paw' ? p.hand ?? p.foot ?? p.chest[0] : p.hand ?? p.spots[2] ?? p.cheeks[1]);
    const box = this.sc.add.container(this.zoomFrom.x, this.zoomFrom.y, parts).setDepth(30).setScale(0);
    this.zoom = box;
    sfx(this.sc, 'whoosh', { volume: 0.5 });
    this.sc.tweens.add({ targets: box, x: at.x, y: at.y, scale: 1, duration: 420, ease: 'Back.easeOut' });
    void k;
  }

  private closeZoom() {
    const z = this.zoom;
    if (!z) return;
    this.sc.tweens.killTweensOf(z);
    this.sc.tweens.add({ targets: z, x: this.zoomFrom.x, y: this.zoomFrom.y, scale: 0, duration: 300, ease: 'Back.easeIn', onComplete: () => z.setVisible(false) });
  }

  /** A point of the close-up's 520 frame in the world (the close-up at rest). */
  private lensAt(f: P): P {
    const { at, s } = this.h.area.zoom;
    return { x: at.x + (f.x - LENS / 2) * s, y: at.y + (f.y - LENS / 2) * s };
  }

  /** An image in the close-up, at a point of its 520 frame (under its rim). */
  private inLens(key: string, f: P, scale: number, angle = 0) {
    const z = this.zoom!;
    const s = this.zoomS;
    const img = new Phaser.GameObjects.Image(this.sc, (f.x - LENS / 2) * s, (f.y - LENS / 2) * s, key).setScale(rs(key, scale * s)).setAngle(angle);
    z.addAt(img, z.length - 1);
    return img;
  }

  private wrapping(): Task {
    const self = this;
    const bv = bandageView(this.h.patient);
    const need = T.turns[this.h.level - 1];
    const hard = this.h.level === 2;
    let turns = 0;
    let acc = 0;
    let back = 0;
    let last: number | null = null;
    let told = false;
    const centre = () => self.lensAt(bv.at);
    const t: Task = {
      name: 'wrap',
      line: 'vo-care-wrap',
      tool: 'roll',
      start() {
        self.layTray([{ id: 'roll', key: 'tool-roll' }]);
        self.openZoom(bv.lens, true);
        if (hard) self.arrows(bv.at);
        self.sc.time.delayedCall(600, () => self.go(t));
      },
      area: () => ({ c: centre(), r: T.turnR[1] * self.k }),
      work(tip) {
        const c = centre();
        const r = Math.hypot(tip.x - c.x, tip.y - c.y);
        if (r < T.turnR[0] * self.k || r > T.turnR[1] * self.k * 1.3) {
          last = null;
          return;
        }
        const a = Math.atan2(tip.y - c.y, tip.x - c.x);
        if (last === null) {
          last = a;
          return;
        }
        let d = a - last;
        if (d > Math.PI) d -= 2 * Math.PI;
        if (d < -Math.PI) d += 2 * Math.PI;
        last = a;
        if (Math.abs(d) < 0.001) return;
        // easy: either way round; hard: the arrows' way (clockwise on the screen), the other way wobbles once
        if (hard && d < 0) {
          back += -d;
          if (back > T.wrongTurn) {
            back = 0;
            self.wobbleZoom();
            self.h.miss();
            if (!told) {
              told = true;
              self.h.say('vo-follow-arrows', { ttlMs: 3000 });
            }
          }
          return;
        }
        self.h.poke();
        acc += Math.abs(d);
        if (acc < Math.PI * 2) return;
        acc -= Math.PI * 2;
        turns++;
        self.addWrap(bv.at, turns, need);
        self.h.say(countKey(turns), { ttlMs: 2500, group: 'count', sequence: true });
        if (turns >= need) {
          self.h.setPhase('intro');
          last = null;
          self.sc.time.delayedCall(700, () => self.next());
        }
      },
      way: () => self.grabWay(self.itemOf('roll'), self.turnPath(centre(), 2, 2000)),
      help: () => self.helpTool(t, self.turnPath(centre(), need - turns + 1, (need - turns + 1) * 900), () => {
        while (turns < need) self.addWrap(bv.at, ++turns, need);
        self.h.setPhase('intro');
        self.next();
      }),
      plan: () => {
        const it = self.itemOf('roll');
        return it ? { kind: 'twirl', from: it.home, at: centre(), r: 150 * self.k, dir: 1 } : null;
      },
    };
    return t;
  }

  /** Round and round (clockwise on the screen, the arrows' way). */
  private turnPath(c: P, loops: number, ms: number): HandKey[] {
    const keys: HandKey[] = [];
    const r = 150 * this.k;
    const n = 12 * loops;
    for (let i = 0; i <= n; i++) {
      const a = -Math.PI / 2 + (i / 12) * Math.PI * 2;
      keys.push({ x: c.x + Math.cos(a) * r, y: c.y + Math.sin(a) * r, t: (ms * i) / n });
    }
    return keys;
  }

  /** Hard: three curved arrows round the place, the way to go round (like the stirring arrows). */
  private arrows(f: P) {
    const z = this.zoom!;
    const s = this.zoomS;
    const g = new Phaser.GameObjects.Graphics(this.sc);
    const cx = (f.x - LENS / 2) * s;
    const cy = (f.y - LENS / 2) * s;
    const r = 205 * s;
    g.lineStyle(12 * s, 0xf4773c, 0.9);
    for (let i = 0; i < 3; i++) {
      const a0 = (i * 2 * Math.PI) / 3 + 0.25;
      const a1 = a0 + 1.4;
      g.beginPath();
      g.arc(cx, cy, r, a0, a1, false);
      g.strokePath();
      const hx = cx + Math.cos(a1) * r;
      const hy = cy + Math.sin(a1) * r;
      const tx = -Math.sin(a1);
      const ty = Math.cos(a1);
      g.fillStyle(0xf4773c, 0.95);
      g.fillTriangle(hx + tx * 28 * s, hy + ty * 28 * s, hx - ty * 20 * s - tx * 6 * s, hy + tx * 20 * s - ty * 6 * s, hx + ty * 20 * s - tx * 6 * s, hy - tx * 20 * s - ty * 6 * s);
    }
    z.addAt(g, z.length - 1);
  }

  private addWrap(f: P, i: number, n: number) {
    const k = this.k;
    const off = (i - (n + 1) / 2) * 30;
    const img = this.inLens('care-wrap', { x: f.x + off * 0.3, y: f.y + off }, 1.05, i % 2 ? -18 : -8);
    const sx = img.scaleX;
    img.setScale(sx * 0.2, img.scaleY);
    this.sc.tweens.add({ targets: img, scaleX: sx, duration: 300, ease: 'Back.easeOut' });
    sfx(this.sc, 'wrap', { minGapMs: 0 });
    const w = this.lensAt({ x: f.x + off * 0.3, y: f.y + off });
    stars(this.sc, w.x, w.y, 4, 28 * k);
    this.h.view.setMood('happy');
    this.h.shown.turns = i;
  }

  private wobbleZoom() {
    const z = this.zoom;
    if (!z) return;
    const x = this.h.area.zoom.at.x;
    this.sc.tweens.add({ targets: z, x: { from: x - 14 * this.k, to: x + 14 * this.k }, duration: 80, yoyo: true, repeat: 2, onComplete: () => z.setX(x) });
    sfx(this.sc, 'squish', { volume: 0.5 });
  }

  private heartOn(): Task {
    const self = this;
    const bv = bandageView(this.h.patient);
    const t: Task & { want: () => Item | null } = {
      name: 'heart',
      line: 'vo-care-heart',
      start() {
        self.layTray([{ id: 'heart', key: 'care-heart', scale: 0.8 }]);
        self.sc.time.delayedCall(350, () => self.go(t));
      },
      want: () => self.itemOf('heart'),
      dropAt: () => self.lensAt(bv.at),
      choose(it) {
        self.h.setPhase('intro');
        self.h.poke();
        const to = self.lensAt(bv.at);
        self.sc.tweens.killTweensOf(it.img);
        it.img.setDepth(600);
        self.sc.tweens.add({
          targets: it.img,
          x: to.x,
          y: to.y,
          duration: 420,
          ease: 'Sine.easeInOut',
          onComplete: () => {
            self.useUp(it);
            it.img.setVisible(false);
            const hrt = self.inLens('care-heart', bv.at, 1.3, -8);
            boing(self.sc, hrt, 0.3);
            sfx(self.sc, 'sticky');
            sfx(self.sc, 'sparkle', { minGapMs: 0, volume: 0.6 });
            stars(self.sc, to.x, to.y, 8, 40 * self.k);
            self.h.view.react('love');
            self.sc.time.delayedCall(1200, () => self.next());
          },
        });
      },
      way: () => (t.want() ? tapMotion(t.want()!.home, self.k) : null),
      help: () => self.helpPick(t, t.want()),
      plan: () => (t.want() ? { kind: 'tap', at: t.want()!.home } : null),
    };
    return t;
  }

  // ---- the dentist's polish: a toothpaste, polish each tooth till it shines, rinse
  private teeth: { f: P; film: Phaser.GameObjects.Image; hp: number; done: boolean }[] = [];
  private pasteTint = 0xffffff;

  private paste(): Task {
    const self = this;
    const t: Task & { want: () => Item | null } = {
      name: 'paste',
      line: 'vo-care-paste',
      start() {
        self.openZoom('lens-mouth', false);
        // the teeth to polish: a dull yellowish film on each
        const n = T.teeth[self.h.level - 1];
        const all = Phaser.Utils.Array.Shuffle(C.teeth.map(([x, y]) => ({ x, y }))).slice(0, n);
        self.teeth = all.map((f) => {
          const film = self.inLens(FX_SOFT, f, 1).setTint(0xd8bf6a).setAlpha(0.75);
          film.setScale((84 * self.zoomS) / film.frame.realWidth, (104 * self.zoomS) / film.frame.realHeight);
          return { f, film, hp: 0, done: false };
        });
        self.layTray(PASTES.map((q, i) => ({ id: `paste-${i}`, key: 'care-paste', tint: q.tint, data: i })));
        self.sc.time.delayedCall(600, () => {
          self.go(t);
          self.h.say('vo-say-aah', { ttlMs: 4000 });
        });
      },
      want: () => self.items.find((q) => !q.gone) ?? null,
      dropAt: () => self.h.area.zoom.at,
      choose(it) {
        const p = PASTES[it.data ?? 0];
        self.h.setPhase('intro');
        self.h.poke();
        self.pasteTint = p.tint;
        boing(self.sc, it.img, 0.25);
        self.backToTray(it);
        stars(self.sc, it.home.x, it.home.y, 6, 30 * self.k);
        sfx(self.sc, 'squish', { minGapMs: 0, volume: 0.6 });
        self.h.say(p.name, { ttlMs: 2500, group: 'name' });
        self.sc.time.delayedCall(900, () => self.next());
      },
      way: () => (t.want() ? tapMotion(t.want()!.home, self.k) : null),
      help: () => self.helpPick(t, t.want()),
      plan: () => (t.want() ? { kind: 'tap', at: t.want()!.home } : null),
    };
    return t;
  }

  private polishing(): Task {
    const self = this;
    const need = () => T.polish[self.h.level - 1] * self.k;
    const left = () => self.teeth.filter((q) => !q.done);
    const t: Task = {
      name: 'polish',
      line: 'vo-care-polish',
      tool: 'polisher',
      start() {
        self.layTray([{ id: 'polisher', key: 'tool-polisher' }, { id: 'cup', key: 'tool-cup' }]);
        self.sc.time.delayedCall(350, () => self.go(t));
      },
      area: () => ({ c: self.h.area.zoom.at, r: 240 * self.zoomS }),
      work(tip, dist) {
        if (dist <= 0) return;
        const q = left().map((x) => ({ x, d: Math.hypot(tip.x - self.lensAt(x.f).x, tip.y - self.lensAt(x.f).y) })).filter((o) => o.d < 70 * self.zoomS + 30 * self.k).sort((a, b) => a.d - b.d)[0]?.x;
        if (!q) return;
        self.h.poke();
        q.hp += dist;
        const u = Math.min(1, q.hp / need());
        q.film.setAlpha(0.75 * (1 - u));
        sfx(self.sc, 'brush', { minGapMs: 260, volume: 0.6 });
        if (Math.random() < 0.3) {
          const w = self.lensAt(q.f);
          burst(self.sc, w.x, w.y, { texture: FX_SOFT, count: 1, tint: self.pasteTint, size: 40 * self.k, speed: 120 * self.k, gravityY: -40, lifespan: 500, depth: 60 });
        }
        if (q.hp >= need()) self.shine(q);
        if (!left().length) {
          self.h.setPhase('intro');
          self.sc.time.delayedCall(600, () => self.next());
        }
      },
      way: () => {
        const q = left()[0];
        return q ? self.grabWay(self.itemOf('polisher'), self.circles(self.lensAt(q.f), 26 * self.k, 2, 1100)) : null;
      },
      help: () => {
        const keys: HandKey[] = [];
        let tt = 0;
        for (const q of left()) {
          keys.push(...self.circles(self.lensAt(q.f), 26 * self.k, Math.ceil(need() / (2 * Math.PI * 26 * self.k)) + 1, 900, tt));
          tt += 950;
        }
        return self.helpTool(t, keys, () => {
          for (const q of left()) self.shine(q);
          self.h.setPhase('intro');
          self.next();
        });
      },
      plan: () => {
        const it = self.itemOf('polisher');
        const q = left()[0];
        return it && q ? { kind: 'rub', from: it.home, at: self.lensAt(q.f), r: 24 * self.k } : null;
      },
    };
    return t;
  }

  /** A tooth polished: it sparkles. */
  private shine(q: { f: P; film: Phaser.GameObjects.Image; done: boolean }) {
    if (q.done) return;
    q.done = true;
    q.film.setAlpha(0);
    const st = this.inLens('star', { x: q.f.x + 14, y: q.f.y - 20 }, 0.35);
    const s0 = st.scale;
    st.setScale(0);
    this.sc.tweens.add({ targets: st, scale: s0, duration: 300, ease: 'Back.easeOut' });
    const w = this.lensAt(q.f);
    stars(this.sc, w.x, w.y, 5, 28 * this.k);
    sfx(this.sc, 'sparkle', { minGapMs: 120, volume: 0.6 });
    this.h.shown.teeth = this.teeth.filter((x) => x.done).length;
  }

  private rinse(): Task {
    const self = this;
    const t: Task & { want: () => Item | null } = {
      name: 'rinse',
      line: 'vo-tool-rinse',
      start() {
        self.go(t);
      },
      want: () => self.itemOf('cup'),
      dropAt: () => self.h.area.zoom.at,
      choose(it) {
        self.h.setPhase('intro');
        self.h.poke();
        const c = self.h.area.zoom.at;
        self.sc.tweens.killTweensOf(it.img);
        it.img.setDepth(600);
        self.sc.tweens.add({ targets: it.img, x: c.x + 120 * self.k, y: c.y - 120 * self.k, angle: -35, duration: 400, ease: 'Sine.easeInOut' });
        self.sc.time.delayedCall(450, () => {
          sfx(self.sc, 'pour', { volume: 0.6 });
          for (let i = 0; i < 10; i++) self.bubble(c.x + Phaser.Math.Between(-140, 140) * self.k, c.y + Phaser.Math.Between(-100, 100) * self.k);
        });
        self.sc.time.delayedCall(1100, () => {
          self.useUp(it);
          self.sc.tweens.add({ targets: it.img, alpha: 0, scale: 0, duration: 260 });
          // every tooth twinkles: a shiny new smile
          for (const [x, y] of C.teeth) {
            const w = self.lensAt({ x, y });
            stars(self.sc, w.x, w.y, 3, 26 * self.k);
          }
          sfx(self.sc, 'sparkle', { minGapMs: 0 });
          self.h.view.react('love');
          self.h.say('vo-care-shiny', { ttlMs: 4000 });
          self.sc.time.delayedCall(1500, () => self.next());
        });
      },
      way: () => (t.want() ? tapMotion(t.want()!.home, self.k) : null),
      help: () => self.helpPick(t, t.want()),
      plan: () => (t.want() ? { kind: 'tap', at: t.want()!.home } : null),
    };
    return t;
  }

  // ---- the eye chart: find the shape Mom shows, then new glasses
  private chart(): Task {
    const self = this;
    const hard = this.h.level === 2;
    const rounds = T.rounds[this.h.level - 1];
    const order = Phaser.Utils.Array.Shuffle(C.care.chart.map((q) => q[0])).slice(0, rounds);
    let r = 0;
    let glow: Phaser.GameObjects.Image | null = null;
    const shape = (name: string) => C.care.chart.find((q) => q[0] === name)!;
    const onChart = (name: string): P => {
      const c = self.o.chart;
      const s = c.getData('s') as number;
      const q = shape(name);
      return { x: c.x + (q[1] - 260) * s, y: c.y + (q[2] - 320) * s };
    };
    /** A card's size on the tray follows the shape's size on the chart (hard: the same shape at another size is not it). */
    const cardScale = (size: number) => (hard ? 0.55 + 0.45 * size : 1);
    const lay = () => {
      const name = order[r];
      const size = shape(name)[3];
      const others = Phaser.Utils.Array.Shuffle(C.care.chart.map((q) => q[0]).filter((n) => n !== name));
      const list: { id: string; key: string; scale: number; data: number }[] = [{ id: `${name}-${size}`, key: `care-shape-${name}`, scale: cardScale(size), data: 1 }];
      if (hard) {
        const sizes = [1, 0.7, 0.5].filter((s) => s !== size);
        list.push({ id: `${name}-x`, key: `care-shape-${name}`, scale: cardScale(Phaser.Utils.Array.GetRandom(sizes)), data: 0 });
      }
      for (const o of others.slice(0, T.shapes[self.h.level - 1] - list.length)) {
        const os = shape(o)[3];
        list.push({ id: o, key: `care-shape-${o}`, scale: cardScale(os), data: 0 });
      }
      self.layTray(Phaser.Utils.Array.Shuffle(list));
      // the shape on the chart glows, she looks at it (Mom shows it)
      const at = onChart(name);
      glow?.destroy();
      glow = self.sc.add.image(at.x, at.y, FX_SOFT).setTint(0xfff1a8).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0).setDepth(3.5);
      glow.setScale((260 * size * (self.o.chart.getData('s') as number)) / glow.frame.realWidth * 1.6);
      self.extras.push(glow);
      self.sc.tweens.add({ targets: glow, alpha: 0.9, duration: 300 });
      self.h.view.lookAt(at.x, at.y);
    };
    const t: Task & { want: () => Item | null } = {
      name: 'chart',
      line: 'vo-care-eyes',
      start() {
        lay();
        self.sc.time.delayedCall(400, () => self.go(t));
      },
      want: () => self.items.find((q) => q.data === 1 && !q.gone) ?? null,
      dropAt: () => onChart(order[r]),
      choose(it) {
        if (it.data !== 1) return self.wrong(it);
        self.h.setPhase('intro');
        self.h.poke();
        const name = order[r];
        const to = onChart(name);
        self.sc.tweens.killTweensOf(it.img);
        it.img.setDepth(600);
        self.useUp(it);
        self.sc.tweens.add({ targets: it.img, x: to.x, y: to.y, scale: it.homeScale * 0.7, duration: 420, ease: 'Sine.easeInOut', onComplete: () => {
          stars(self.sc, to.x, to.y, 8, 40 * self.k);
          sfx(self.sc, 'sparkle', { minGapMs: 0 });
          self.sc.tweens.add({ targets: it.img, alpha: 0, duration: 400, delay: 300 });
          self.h.view.react('love');
        } });
        self.h.say(SHAPE_NAME[name], { ttlMs: 3000, group: 'name' });
        if (glow) self.sc.tweens.add({ targets: glow, alpha: 0, duration: 400, delay: 400 });
        self.sc.time.delayedCall(1400, () => {
          if (self.task !== t) return;
          if (++r >= rounds) return self.next();
          lay();
          self.sc.time.delayedCall(400, () => self.go(t, 'vo-care-chart'));
        });
      },
      way: () => (t.want() ? tapMotion(t.want()!.home, self.k) : null),
      help: () => self.helpPick(t, t.want()),
      plan: () => (t.want() ? { kind: 'tap', at: t.want()!.home } : null),
    };
    return t;
  }

  private glasses(): Task {
    const self = this;
    const p = this.h.patient;
    const eyes = { x: 300, y: Math.round((p.forehead.y + p.cheeks[0].y) / 2 - 6) };
    const t: Task & { want: () => Item | null } = {
      name: 'glasses',
      line: 'vo-care-glasses',
      start() {
        self.layTray(GLASSES.map((tint, i) => ({ id: `glasses-${i}`, key: 'care-glasses', tint, data: i })));
        self.sc.time.delayedCall(350, () => self.go(t));
      },
      want: () => self.items.find((q) => !q.gone) ?? null,
      dropAt: () => self.h.view.at(eyes),
      choose(it) {
        self.h.setPhase('intro');
        self.h.poke();
        const v = self.h.view;
        const to = v.at(eyes);
        self.sc.tweens.killTweensOf(it.img);
        it.img.setDepth(600);
        self.useUp(it);
        self.sc.tweens.add({ targets: it.img, x: to.x, y: to.y, scale: rs('care-glasses', 1.05 * v.scale), duration: 450, ease: 'Sine.easeInOut', onComplete: () => {
          it.img.setVisible(false);
          // (they stay on her: in the waiting room and in the photo)
          const g = v.put('care-glasses', eyes, 1.05).setTint(GLASSES[it.data ?? 0]);
          boing(self.sc, g, 0.25);
          sfx(self.sc, 'pop');
          stars(self.sc, to.x, to.y, 8, 40 * self.k);
          v.react('love');
          self.sc.time.delayedCall(1300, () => self.next());
        } });
      },
      way: () => (t.want() ? tapMotion(t.want()!.home, self.k) : null),
      help: () => self.helpPick(t, t.want()),
      plan: () => (t.want() ? { kind: 'tap', at: t.want()!.home } : null),
    };
    return t;
  }

  // ---- a rest: pull up the blanket, the lamp off for a nap, then a snack
  private blanket(): Task {
    const self = this;
    const bl = this.o.blanket;
    const bottom = bl.getData('bottom') as number;
    const h0 = bl.displayHeight;
    bl.setData('s0', 1);
    const chest = () => self.h.view.at({ x: 300, y: 480 }).y;
    const topOf = () => bottom - bl.displayHeight;
    let u = 0;
    const set = (v: number) => {
      u = Phaser.Math.Clamp(v, 0, 1);
      const top = bottom - h0 - (bottom - h0 - chest()) * u;
      bl.setScale(bl.scaleX, (bottom - top) / 340);
    };
    const done = () => {
      self.h.setPhase('intro');
      self.dragging = false;
      set(1);
      boing(self.sc, bl, 0.06);
      sfx(self.sc, 'pop');
      self.h.view.setMood('happy');
      stars(self.sc, bl.x, topOf(), 6, 34 * self.k);
      self.sc.time.delayedCall(800, () => {
        self.h.view.setMood('rest');
        self.next();
      });
    };
    const t: Task = {
      name: 'blanket',
      line: 'vo-care-rest',
      start() {
        self.layTray([]);
        self.go(t);
      },
      grab(at) {
        const w = bl.displayWidth / 2 + 40 * self.k;
        if (Math.abs(at.x - bl.x) > w || at.y < topOf() - 120 * self.k || at.y > bottom + 140 * self.k) return false;
        sfx(self.sc, 'wrap', { minGapMs: 300, volume: 0.5 });
        return true;
      },
      pull(at) {
        const top0 = bottom - h0;
        const v = (top0 - (at.y - 30 * self.k)) / Math.max(1, top0 - chest());
        if (v > u) {
          set(v);
          self.h.poke();
        }
        if (u >= T.blanket) done();
      },
      way: () => {
        const from = { x: bl.x, y: topOf() + 10 * self.k };
        const to = { x: bl.x, y: chest() + 20 * self.k };
        return { kind: 'point', keys: [{ ...from, t: 0 }, { ...from, t: 300, press: true }, { ...to, t: 1300, press: true }, { ...to, t: 1600 }] };
      },
      help() {
        self.h.hand.follow('point', () => ({ x: bl.x, y: topOf() + 10 * self.k }));
        const s = { u };
        self.sc.tweens.add({ targets: s, u: 1, duration: 1200, ease: 'Sine.easeInOut', onUpdate: () => self.task === t && set(s.u), onComplete: () => {
          self.h.helped();
          if (self.task === t) done();
        } });
        return true;
      },
      plan: () => ({ kind: 'drag', from: { x: bl.x, y: topOf() + 10 * self.k }, to: { x: bl.x, y: chest() } }),
    };
    return t;
  }

  private lamp(): Task {
    const self = this;
    const lp = this.o.lamp;
    const nap = () => {
      self.h.setPhase('intro');
      self.h.poke();
      lp.setTexture('care-lamp-off');
      sfx(self.sc, 'click');
      const L = self.h.L;
      self.dim = self.sc.add.rectangle(L.W / 2, L.H / 2, L.W * 1.2, L.H * 1.2, 0x1d2350).setAlpha(0).setDepth(16);
      self.sc.tweens.add({ targets: self.dim, alpha: 0.3, duration: 500 });
      const v = self.h.view;
      v.doze(true);
      // little sleep bubbles over her head
      const head = v.at({ x: 380, y: self.h.patient.forehead.y - 40 });
      for (let i = 0; i < 3; i++) self.sc.time.delayedCall(300 + i * 600, () => self.bubble(head.x + i * 20 * self.k, head.y - i * 20 * self.k, 0));
      self.sc.time.delayedCall(T.napMs, () => {
        lp.setTexture('care-lamp-on');
        sfx(self.sc, 'click');
        if (self.dim) self.sc.tweens.add({ targets: self.dim, alpha: 0, duration: 500 });
        v.doze(false);
        v.setMood('happy');
        boing(self.sc, v.box, 0.1);
        sfx(self.sc, 'char-yay', { rate: v.rate, volume: 0.6 });
        self.h.say('vo-care-wake', { ttlMs: 4000 });
        self.sc.time.delayedCall(900, () => {
          v.setMood('rest');
          self.next();
        });
      });
    };
    const t: Task = {
      name: 'lamp',
      line: 'vo-care-lamp',
      start() {
        self.go(t);
      },
      tap(p) {
        if (Math.abs(p.x - lp.x) > Math.max(130 * self.k, lp.displayWidth / 2 + 30 * self.k) || Math.abs(p.y - lp.y) > Math.max(150 * self.k, lp.displayHeight / 2 + 30 * self.k)) return false;
        nap();
        return true;
      },
      way: () => tapMotion({ x: lp.x, y: lp.y - lp.displayHeight * 0.2 }, self.k),
      help() {
        self.h.hand.play(tapMotion({ x: lp.x, y: lp.y - lp.displayHeight * 0.2 }, self.k));
        self.sc.time.delayedCall(650, () => {
          self.h.helped();
          if (self.task === t) nap();
        });
        return true;
      },
      plan: () => ({ kind: 'tap', at: { x: lp.x, y: lp.y - lp.displayHeight * 0.2 } }),
    };
    return t;
  }

  private snacks(): Task {
    const self = this;
    const need = T.snacks[this.h.level - 1];
    const hard = this.h.level === 2;
    const order = hard ? Phaser.Utils.Array.Shuffle([0, 1, 2]).slice(0, need) : [];
    let fed = 0;
    const t: Task & { want: () => Item | null } = {
      name: 'snacks',
      line: hard ? 'vo-care-order' : 'vo-care-wake',
      start() {
        self.layTray(SNACKS.map((q, i) => ({ id: `snack-${i}`, key: q.key, data: i })));
        if (hard) {
          self.h.view.showWish(order.map((i) => SNACKS[i].key), order.map((i) => SNACKS[i].key), { maxRight: self.h.S.momFace.x0 - 20 * self.k, k: self.k });
          self.sc.time.delayedCall(400, () => {
            self.go(t);
            self.h.say(SNACKS[order[0]].name, { ttlMs: 7000 });
            self.h.say('vo-then', { ttlMs: 8000 });
            self.h.say(SNACKS[order[1]].name, { ttlMs: 9000 });
          });
        } else self.sc.time.delayedCall(400, () => self.go(t, null));
      },
      want: () => (hard ? self.items.find((q) => q.data === order[fed] && !q.gone) ?? null : self.items.find((q) => !q.gone) ?? null),
      dropAt: () => self.h.view.mouthAt,
      choose(it) {
        if (hard && it.data !== order[fed]) {
          self.wrong(it);
          self.h.say(SNACKS[order[fed]].name, { ttlMs: 3000, group: 'name' });
          return;
        }
        self.h.setPhase('intro');
        self.h.poke();
        if (hard) self.h.view.wishFound(fed);
        self.feed(it, () => {
          fed++;
          if (fed >= need) {
            if (hard) self.h.view.wishGranted();
            return self.sc.time.delayedCall(500, () => self.next());
          }
          self.sc.time.delayedCall(300, () => self.go(t, null));
        });
      },
      way: () => (t.want() ? tapMotion(t.want()!.home, self.k) : null),
      help: () => self.helpPick(t, t.want()),
      plan: () => (t.want() ? { kind: 'tap', at: t.want()!.home } : null),
    };
    return t;
  }

  // ---------------------------------------------------------------- little things

  private bubble(x: number, y: number, rise = 60) {
    const k = this.k;
    const b = this.sc.add.image(x, y, 'bubble').setScale(0).setDepth(55).setAlpha(0.9);
    this.sc.tweens.add({ targets: b, scale: Phaser.Math.FloatBetween(0.15, 0.3) * k, duration: 200, ease: 'Back.easeOut' });
    this.sc.tweens.add({ targets: b, y: y - (rise || 40) * k - Phaser.Math.Between(0, 40) * k, alpha: 0, duration: 1100, delay: 300, onComplete: () => b.destroy() });
  }
}

/** A point along timed keyframes (smoothstep between them). */
function at(keys: { x: number; y: number; t: number }[], t: number): P {
  if (t <= keys[0].t) return keys[0];
  for (let i = 1; i < keys.length; i++) {
    if (t <= keys[i].t) {
      const a = keys[i - 1];
      const b = keys[i];
      const u = (t - a.t) / Math.max(1, b.t - a.t);
      const e = u * u * (3 - 2 * u);
      return { x: a.x + (b.x - a.x) * e, y: a.y + (b.y - a.y) * e };
    }
  }
  return keys[keys.length - 1];
}

