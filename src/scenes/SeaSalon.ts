import Phaser from 'phaser';
import { voice, type VoiceKey } from '../core/audio';
import { FX_SOFT } from '../core/assets';
import { stepDone } from '../core/finale';
import { burst } from '../core/fx';
import { tapMotion, type HandMotion, type MomHandView } from '../core/hand';
import * as paper from '../core/paper';
import { SALON_STAGES, type CustomerId, type Look, type SalonStageId } from '../core/salon';
import { cloneLook, type Dressing } from '../core/salonDress';
import { sfx } from '../core/sfx';
import { TUNING } from '../core/tuning';
import { iconButton } from '../core/ui';
import type { Mom } from '../steps/Mom';
import type { Layout } from '../core/layout';
import type { Stage } from '../core/stage';
import type { P } from './MiniGame';
import { SeaGame } from './SeaGame';
import { Face } from './salon/Face';
import { Hair } from './salon/Hair';
import { Mirror } from './salon/Mirror';
import { Pick } from './salon/Pick';
import { Scrub } from './salon/Scrub';
import { Sparkle } from './salon/Sparkle';
import { vanityTap } from './salon/vanity';

const T = TUNING.salon;

/**
 * One stage of a salon visit (research/mermaid-dressup-spec.md 5): its own file in scenes/salon/, built new for every
 * visit (`new (host)`; Phaser reuses the scene, never the stage). The host (SeaSalon) owns the frame: Mom, her hand, the
 * idle clock (hint, help), the column of cells, the done button, the customer and her look. A stage says what she can do
 * now (`plan`: the next thing a child would do; Mom's hint and help and the test harness follow it) and answers touches.
 */
export interface SalonStage {
  readonly id: SalonStageId;
  /** Free play (hair, outfit, ...): the hint waits TUNING.salon.hintFreeMs, like free decorating. */
  readonly free: boolean;
  /** Its done button: false = the stage ends by itself (who comes, the ending). */
  readonly hasDone: boolean;
  /** The stage starts (its cells, its line: call `host.play(line)` when she may begin). */
  begin(): void;
  /** Mom's hand for now (the hint; the first visit's demo). Null: nothing to show. */
  way(): HandMotion | null;
  /** One piece of Mom's help for now; call `host.helped()` when it is done. False: nothing to do. */
  helpOnce(): boolean;
  /** A touch that is not on the home button or the done button. */
  down(p: Phaser.Input.Pointer, at: P): void;
  move?(p: Phaser.Input.Pointer): void;
  /** The finger lifted (`cancelled`: lost, or the screen turned upright: put back what it carried). */
  up?(p: Phaser.Input.Pointer, cancelled: boolean): void;
  tick?(delta: number): void;
  /** Where Mom and the customer look (the thing carried). */
  lookTarget?(): P | null;
  /** What a child would do next (the harness plays it; `way` / `helpOnce` usually follow it too). */
  plan?(): SalonPlan | null;
  /** The stage is over (its cells go with the column): stop what it runs. */
  end?(): void;
  /** Ms without progress before the hint / before Mom's help, when the stage wants its own (who comes: quicker). */
  hintAfter?(): number;
  helpAfter?(): number;
}

/** The next thing to do in a stage: a tap, a drag from `from` along `path`, or the done button. */
export type SalonPlan = { kind: 'tap'; at: P; what: string } | { kind: 'drag'; path: P[]; what: string } | { kind: 'done'; at: P; what: 'done' };

/** A cell of the column (bins down the left: S.bin(i, n), up to 8): a shell plate and what lies on it. */
export interface Cell {
  id: string;
  x: number;
  y: number;
  /** The cell's scale (its plate: shell-paint 220 at it is as wide as a topping bin). */
  s: number;
  /** Its touch radius (world units). */
  r: number;
  plate: Phaser.GameObjects.Image;
  /** What shows on the plate (in front of it), moved with it. */
  items: Phaser.GameObjects.Image[];
}

/** salon PR 2-4: one line each, the stages they add (a stage with no class is skipped). */
export const SALON_STAGE_CLASSES: Partial<Record<SalonStageId, new (host: SeaSalon) => SalonStage>> = {
  pick: Pick,
  scrub: Scrub,
  hair: Hair,
  face: Face, // salon PR 2
  sparkle: Sparkle, // salon PR 2
  // salon PR 3: outfit: Outfit,
  mirror: Mirror,
};

/** The column's plates, a little bigger than the tail's paint shells (they are as wide as a topping bin). */
const PLATE = 220;

/**
 * The Mermaid Salon (research/mermaid-dressup-spec.md; salon PR 1): the lagoon's sixth shell door. In its corner of the
 * lagoon a big open shell is the chair, a shell mirror stands behind it; Mom the mermaid is the stylist on the right and
 * her hand shows the way; the column of things down the left changes with each stage. Three little mermaid girls come to
 * the salon (Marina, Coral, Pearl): she picks one, and the visit runs the stages in order (SALON_STAGES: who comes, the
 * splash, the hair, then salon PRs 2-4's face, outfit, sparkle, and the mirror). Every stage has a done button (after one
 * thing done, or 15 s): nothing is ever required. Her look stays (`lagoon.salon.<id>`).
 */
export class SeaSalon extends SeaGame {
  protected readonly id = 'sea-salon';
  protected readonly waiting = ['play'] as const;
  /** The visit's stage (built new for every visit). */
  stage: SalonStage | null = null;
  stageIndex = -1;
  /** The customer in the chair (null while she chooses). */
  customer: Dressing | null = null;
  /** Salon PR 3 (the wish): told after every change of her look, with what changed. */
  onLookChanged: ((look: Look, changed: (keyof Look)[]) => void)[] = [];
  cells: Cell[] = [];
  doneBtn?: Phaser.GameObjects.Image;
  /** Something has been done in this stage (the done button comes; free stages: Mom's hint points at it). */
  acted = false;
  private stageMs = 0;
  private doneSaid = false;
  chair!: Phaser.GameObjects.Image;
  mirror!: Phaser.GameObjects.Image;
  /** salon PR 4: the little coral table (its secret: salon/vanity.ts), where there is room for it. */
  vanity?: Phaser.GameObjects.Image;
  zoomed = false;

  constructor() {
    super('SeaSalon');
  }

  protected withPipa() {
    // (the customer is the friend this time: no Marina in the bubble beside Mom)
    return false;
  }

  init() {
    super.init();
    this.stage = null;
    this.stageIndex = -1;
    this.customer = null;
    this.onLookChanged = [];
    this.cells = [];
    this.doneBtn = undefined;
    this.acted = this.doneSaid = this.zoomed = false;
    this.stageMs = 0;
  }

  protected build() {
    const S = this.S.salon;
    this.water(false);
    // salon PR 4: the mirror stands turned away until the end (narrow, a little in shadow); Mirror turns it round to her
    this.mirror = this.add.image(S.mirror.x, S.mirror.y, 'salon-mirror').setScale(S.mirror.scale * 0.3, S.mirror.scale).setDepth(2).setAngle(4).setTint(0xc9d3df);
    this.chair = this.add.image(S.chair.x, S.chair.y, 'salon-chair').setScale(S.chair.scale).setDepth(3);
    this.vanity = S.vanity ? this.add.image(S.vanity.x, S.vanity.y, 'salon-vanity').setScale(S.vanity.scale).setDepth(4) : undefined;
    this.shown.stage = null;
    this.time.delayedCall(400, () => this.nextStage());
  }

  // ---------------------------------------------------------------- the stages

  /** The next stage of the visit that exists (salon PRs 2-4 add theirs). */
  nextStage() {
    if (this.leaving) return;
    this.stage?.end?.();
    this.clearColumn();
    this.hideDone();
    this.hand.stop();
    let i = this.stageIndex + 1;
    while (i < SALON_STAGES.length && !SALON_STAGE_CLASSES[SALON_STAGES[i]]) i++;
    if (i >= SALON_STAGES.length) return;
    this.stageIndex = i;
    const Cls = SALON_STAGE_CLASSES[SALON_STAGES[i]]!;
    this.stage = new Cls(this);
    this.acted = false;
    this.stageMs = 0;
    this.setPhase('intro');
    this.shown.stage = this.stage.id;
    (this.shown.stages = (this.shown.stages as string[] | undefined) ?? []).push(this.stage.id);
    this.stage.begin();
  }

  /** The stage is ready for her: its line (and the first visit, Mom's demo). */
  play(line: VoiceKey | null) {
    this.begin('play', line);
  }

  /** A stage without a done button is over: the next one in `ms`. */
  stageOver(ms = 600) {
    if (this.leaving) return;
    this.setPhase('intro');
    this.hand.stop();
    this.time.delayedCall(ms, () => this.nextStage());
  }

  /** The done button was tapped (or Mom tapped it): the stage's bell, then the next stage. */
  finishStage() {
    if (this.phase !== 'play' || this.leaving) return;
    this.setPhase('intro');
    this.hand.stop();
    const d = this.doneBtn;
    if (d) {
      d.disableInteractive();
      this.tweens.add({ targets: d, scale: 0, duration: 220, onComplete: () => d.destroy() });
      this.doneBtn = undefined;
    }
    const c = this.customer;
    const at = c ? c.toWorld({ x: 300, y: 300 }) : { x: this.S.salon.seat.x, y: this.S.salon.seat.y };
    stepDone(this, at, { k: this.L.k, target: c?.ch.box, size: 260 });
    this.mom?.happy();
    this.time.delayedCall(900, () => this.mom?.rest());
    this.time.delayedCall(700, () => this.nextStage());
  }

  // ---------------------------------------------------------------- the column

  /** Lays the stage's cells down the column (n up to 8, two by two), arriving one after the other. */
  layColumn(ids: string[], fill: (id: string, cell: Cell) => Phaser.GameObjects.Image[]): Cell[] {
    this.clearColumn();
    const n = ids.length;
    const s = (this.S.binScale(Math.max(n, 2)) * 240) / PLATE;
    this.cells = ids.map((id, i) => {
      const at = this.S.bin(i, Math.max(n, 2));
      const plate = this.add.image(at.x, at.y, 'shell-paint').setScale(s).setDepth(20);
      const cell: Cell = { id, x: at.x, y: at.y, s, r: (PLATE / 2) * s + 12 * this.L.k, plate, items: [] };
      cell.items = fill(id, cell);
      cell.items.forEach((o) => o.setDepth(21));
      [plate, ...cell.items].forEach((o) => paper.appear(this, o, i));
      return cell;
    });
    return this.cells;
  }

  clearColumn() {
    for (const c of this.cells) for (const o of [c.plate, ...c.items]) if (o.active) paper.vanish(this, o);
    this.cells = [];
  }

  /** The cell under the finger (its round touch area). */
  cellAt(at: P): Cell | undefined {
    let best: Cell | undefined;
    let bd = Infinity;
    for (const c of this.cells) {
      const d = Math.hypot(at.x - c.x, at.y - c.y);
      if (d <= c.r && d < bd) (bd = d), (best = c);
    }
    return best;
  }
  cell(id: string) {
    return this.cells.find((c) => c.id === id);
  }

  /** A cell answers a press: its plate and things sink and spring back, a soft pop. */
  pressCell(c: Cell) {
    for (const o of [c.plate, ...c.items]) if (!o.getData('carried')) paper.press(this, o);
    sfx(this, 'pop', { pitch: 'vary', minGapMs: 60 });
  }

  /** A soft glow on a cell (Mom: "this one"). */
  glowCell(c: Cell) {
    const g = this.add.image(c.x, c.y, FX_SOFT).setTint(0xfff1b8).setBlendMode(Phaser.BlendModes.ADD).setDepth(19);
    g.setScale((PLATE * c.s * 1.4) / g.frame.realWidth);
    this.tweens.add({ targets: g, alpha: { from: 0.9, to: 0 }, duration: 500, yoyo: true, repeat: 1, onComplete: () => g.destroy() });
  }

  // ---------------------------------------------------------------- the customer and her look

  get look(): Look | null {
    return this.customer ? this.customer.look : null;
  }

  /**
   * She wears `look` now: the layers that changed go (rising a little, fading) and the new ones arrive on her; the
   * salon's PR 3 hook hears what changed. Returns the new layers.
   */
  setLook(look: Look, opts: { arrive?: boolean; from?: number } = {}) {
    const c = this.customer;
    if (!c) return [];
    const before = cloneLook(c.look);
    const { added, removed } = c.apply(look);
    c.leave(removed);
    if (opts.arrive !== false) added.forEach((img, i) => c.arrive(img, { from: opts.from, delay: i * 40 }));
    const changed = (Object.keys(look) as (keyof Look)[]).filter((key) => JSON.stringify(look[key]) !== JSON.stringify(before[key]));
    this.shown.look = cloneLook(c.look);
    if (changed.length) for (const f of this.onLookChanged) f(c.look, changed);
    return added;
  }

  /** The customer in the chair (Pick). */
  seat(d: Dressing) {
    this.customer = d;
    this.shown.customer = d.id;
    this.shown.look = cloneLook(d.look);
  }

  /** A point of the customer's frame in the world. */
  onHer(p: P): P {
    return this.customer ? this.customer.toWorld(p) : p;
  }
  /** The world point `at` is on the customer (her frame, a little forgiving). */
  onCustomer(at: P) {
    return !!this.customer?.ch.hit(at.x, at.y);
  }
  /** A tap on her with nothing in the finger: she giggles (a tickle). */
  tickleCustomer(at: P) {
    const c = this.customer;
    if (!c || !c.ch.hit(at.x, at.y)) return false;
    c.ch.tickle();
    return true;
  }

  /** Salon PR 2: the face close-up (her container grows 1.6x round her face, the chair with her); `on` false: back. */
  zoom(on: boolean, then?: () => void) {
    const c = this.customer;
    if (!c || this.zoomed === on) return then?.();
    this.zoomed = on;
    const S = this.S.salon;
    const to = on ? S.closeUp : S.seat;
    c.ch.moveTo(to, T.zoomMs);
    const f = to.scale / S.seat.scale;
    this.tweens.add({
      targets: this.chair,
      x: to.x + (S.chair.x - S.seat.x) * f,
      y: to.y + (S.chair.y - S.seat.y) * f,
      scale: S.chair.scale * f,
      duration: T.zoomMs,
      ease: 'Sine.easeInOut',
    });
    this.time.delayedCall(T.zoomMs + 20, () => then?.());
  }

  // ---------------------------------------------------------------- the done button

  /** Something was done in the stage: the done button comes (once). */
  did() {
    this.acted = true;
    this.poke();
    this.showDone();
  }

  showDone() {
    if (this.doneBtn || !this.stage?.hasDone || this.phase !== 'play') return;
    const L = this.L;
    const b = iconButton(this, L, 'btn-done', this.S.done.x, this.S.done.y, () => this.finishStage(), { hitPad: 30 }).setDepth(800);
    b.setScale(0);
    this.tweens.add({ targets: b, scale: L.k, duration: 360, ease: 'Back.easeOut', onComplete: () => b.setData({ restScaleX: L.k, restScaleY: L.k }) });
    this.doneBtn = b;
    this.shown.done_btn = { x: b.x, y: b.y };
  }

  hideDone() {
    const d = this.doneBtn;
    this.doneBtn = undefined;
    if (d) this.tweens.add({ targets: d, scale: 0, duration: 200, onComplete: () => d.destroy() });
  }

  /** Mom's hand on the done button (free stages, once something is done): her hint, and her help taps it. */
  doneWay(): HandMotion | null {
    const b = this.doneBtn;
    if (!b) return null;
    if (!this.doneSaid) {
      this.doneSaid = true;
      this.say('vo-done-hint', { ttlMs: 3000 });
    }
    return { ...tapMotion({ x: b.x, y: b.y }, this.L.k), glow: { x: b.x, y: b.y } };
  }
  doneHelp(): boolean {
    const b = this.doneBtn;
    if (!b) return false;
    this.hand.play(tapMotion({ x: b.x, y: b.y }, this.L.k), { onDone: () => (this.helped(), this.finishStage()) });
    return true;
  }

  // ---------------------------------------------------------------- what the stages use of the frame

  get k() {
    return this.L.k;
  }
  get table(): Stage {
    return this.S;
  }
  get layout(): Layout {
    return this.L;
  }
  get lvl() {
    return this.level;
  }
  get firstVisit() {
    return this.first;
  }
  get momHand(): MomHandView {
    return this.hand;
  }
  get theMom(): Mom | null {
    return this.mom;
  }
  get playing() {
    return this.phase === 'play' && !this.leaving;
  }
  get busy() {
    return this.helping;
  }
  speak(key: VoiceKey, opts: { ttlMs?: number; done?: () => void; group?: string } = {}) {
    this.say(key, opts);
  }
  /** A colour's or a name's word (they never queue behind each other: the newest wins). */
  name(key: string) {
    voice.say(key as VoiceKey, { group: 'name', ttlMs: 2500, valid: () => this.scene.isActive() && !this.leaving });
  }
  progress() {
    this.poke();
  }
  missed() {
    this.miss();
  }
  hintAtOnce() {
    this.hintNow();
  }
  hold(p: Phaser.Input.Pointer) {
    this.own(p);
  }
  helpDone() {
    this.helped();
  }
  /** The end of the visit: the photo (the ta-da, the flash, the sea's frame), then `then`. */
  photo(area: { x: number; y: number; w: number; h: number }, at: P, then: (photo: Phaser.GameObjects.Container) => void) {
    this.seaPhoto('salon', area, at, then);
  }
  bye(line: VoiceKey) {
    this.shown.done = true;
    this.goodbye(line);
  }
  sparkle(at: P, tint: number[] = [0xffffff, 0xfff4b8], count = 6) {
    burst(this, at.x, at.y, { texture: 'fx-sparkle', count, tint, size: 34 * this.L.k, speed: 260, gravityY: -80, lifespan: 600, depth: 60 });
  }

  // ---------------------------------------------------------------- MiniGame's hooks

  protected way(): HandMotion | null {
    return this.stage?.way() ?? null;
  }
  protected helpOnce(): boolean {
    return this.stage?.helpOnce() ?? false;
  }
  protected nothingToHelp() {
    // (a stage with nothing left to do: Mom taps its done button)
    if (this.doneBtn) this.doneHelp();
  }
  protected hintAfter() {
    const own = this.stage?.hintAfter?.();
    if (own !== undefined) return own;
    return this.stage?.free ? Math.max(super.hintAfter(), T.hintFreeMs) : super.hintAfter();
  }
  protected helpAfter() {
    return this.stage?.helpAfter?.() ?? super.helpAfter();
  }
  protected down(p: Phaser.Input.Pointer, at: P) {
    if (!this.stage || this.phase !== 'play') return;
    if (this.doneBtn && this.near(at, this.doneBtn, 150 * this.L.k)) return;
    // salon PR 4: the coral table's secret answers a tap that is nobody else's (never on her, never on a cell)
    if (!this.onCustomer(at) && !this.customer?.ch.box.getBounds().contains(at.x, at.y) && !this.cellAt(at) && vanityTap(this, this.vanity, at)) return;
    this.stage.down(p, at);
  }
  protected move(p: Phaser.Input.Pointer) {
    this.stage?.move?.(p);
  }
  protected up(p: Phaser.Input.Pointer, cancelled: boolean) {
    this.stage?.up?.(p, cancelled);
  }
  protected lookTarget(): P | null {
    return this.stage?.lookTarget?.() ?? null;
  }
  protected tick(delta: number) {
    this.stage?.tick?.(delta);
    if (this.phase === 'play') {
      this.stageMs += delta;
      // (the done button comes after 15 s in a stage anyway: nothing is ever required)
      if (!this.doneBtn && this.stageMs > T.doneAfterMs) this.showDone();
    }
    const c = this.customer;
    if (c) {
      const p = this.owner ?? this.input.manager.pointers.find((q) => q.isDown);
      const at = this.lookTarget() ?? this.hand.position ?? (p ? { x: p.worldX, y: p.worldY } : null);
      if (at) c.ch.lookAt(at.x, at.y);
    }
  }
  protected shutdown() {
    this.stage?.end?.();
  }

  // ---------------------------------------------------------------- for the test harness

  /** What a child would do next (scenes/salon/*.ts `plan`). */
  plan(): SalonPlan | null {
    if (this.phase !== 'play') return null;
    return this.stage?.plan?.() ?? (this.doneBtn ? { kind: 'done', at: { x: this.doneBtn.x, y: this.doneBtn.y }, what: 'done' } : null);
  }
  get customerId(): CustomerId | null {
    return this.customer?.id ?? null;
  }
}
