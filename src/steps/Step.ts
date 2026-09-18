import Phaser from 'phaser';
import type { HandHint } from '../core/hand';
import { PALM_ZONE, type Layout } from '../core/layout';
import type { Dish } from './Dish';

/** Seconds of no progress before the guiding hand shows the gesture. */
export const HINT_AFTER_MS = 5000;
/** Further seconds of no progress before the step finishes itself. */
export const AUTO_AFTER_HINT_MS = 10000;

export interface StepContext {
  scene: Phaser.Scene;
  layout: Layout;
  dish: Dish;
  hand: HandHint;
  /** Where the dish rests by default during a step. */
  dishHome: { x: number; y: number };
}

export type PointerFn = (p: Phaser.Input.Pointer) => void;

/**
 * Base for every reusable step type.
 *
 * Never-stuck contract: `poke()` is called on every bit of real progress. With no
 * progress for HINT_AFTER_MS the hand demonstrates (`showHint`), and after another
 * AUTO_AFTER_HINT_MS the step finishes itself (`autoFinish`). Phases where the child
 * only watches (e.g. baking) turn the idle clock off with `setIdle(false)`.
 */
export abstract class Step<P> {
  protected readonly scene: Phaser.Scene;
  protected readonly layout: Layout;
  protected readonly dish: Dish;
  protected readonly hand: HandHint;

  private owned: Phaser.GameObjects.GameObject[] = [];
  private listeners: { event: string; fn: (...args: unknown[]) => void }[] = [];
  private idleOn = false;
  private idleMs = 0;
  private hinting = false;
  private auto = false;
  private finished = false;

  constructor(protected readonly ctx: StepContext, protected readonly params: P, private readonly onDone: () => void) {
    this.scene = ctx.scene;
    this.layout = ctx.layout;
    this.dish = ctx.dish;
    this.hand = ctx.hand;
  }

  /** Build the step's objects and start listening. */
  abstract start(): void;
  /** Demonstrate the expected gesture with the hand. */
  protected abstract showHint(): void;
  /** Finish the step without the child (animated), ending with `complete()`. */
  protected abstract autoFinish(): void;

  /** True once the step is finishing itself; ignore input then. */
  protected get isAuto() {
    return this.auto || this.finished;
  }

  update(delta: number) {
    if (!this.idleOn || this.finished || this.auto) return;
    // A finger resting on the screen is not "stuck": hold the hint back.
    if (this.scene.input.activePointer.isDown && !this.hinting) return;
    this.idleMs += delta;
    if (!this.hinting && this.idleMs >= HINT_AFTER_MS) {
      this.hinting = true;
      this.showHint();
    }
    if (this.idleMs >= HINT_AFTER_MS + AUTO_AFTER_HINT_MS) {
      this.auto = true;
      this.hinting = false;
      this.hand.stop();
      this.autoFinish();
    }
  }

  /** Real progress happened: reset the idle clock and hide the hand. */
  protected poke() {
    this.idleMs = 0;
    if (this.hinting) {
      this.hinting = false;
      this.hand.stop();
    }
  }

  /** For multi-phase steps: after an automatic phase, hand control back to the child. */
  protected resumeAfterAuto() {
    this.auto = false;
    this.hinting = false;
    this.idleMs = 0;
  }

  protected setIdle(on: boolean) {
    this.idleOn = on;
    this.poke();
  }

  protected own<T extends Phaser.GameObjects.GameObject>(obj: T): T {
    this.owned.push(obj);
    return obj;
  }

  /**
   * Scene-wide pointer listeners, removed automatically when the step ends.
   * Presses that start in the palm zone or on a button are ignored.
   */
  protected onDown(fn: PointerFn) {
    this.listen(Phaser.Input.Events.POINTER_DOWN, (p: Phaser.Input.Pointer, over: Phaser.GameObjects.GameObject[]) => {
      if (this.isAuto) return;
      if (over && over.length > 0) return;
      // Palm zone is a physical screen area, so test screen y (not world y, which a camera zoom shifts).
      if (p.y > this.scene.scale.height * (1 - PALM_ZONE)) return;
      fn(p);
    });
  }

  protected onMove(fn: PointerFn) {
    this.listen(Phaser.Input.Events.POINTER_MOVE, (p: Phaser.Input.Pointer) => {
      if (this.isAuto || !p.isDown) return;
      fn(p);
    });
  }

  protected onUp(fn: PointerFn) {
    this.listen(Phaser.Input.Events.POINTER_UP, (p: Phaser.Input.Pointer) => {
      if (this.isAuto) return;
      fn(p);
    });
    // Losing the pointer (finger leaves the canvas) counts as release.
    this.listen(Phaser.Input.Events.GAME_OUT, () => {
      if (this.isAuto) return;
      fn(this.scene.input.activePointer);
    });
  }

  private listen(event: string, fn: (...args: never[]) => void) {
    const f = fn as unknown as (...args: unknown[]) => void;
    this.scene.input.on(event, f);
    this.listeners.push({ event, fn: f });
  }

  /** Ends the step: stops input and the hand, fades out owned objects, then advances. */
  protected complete() {
    if (this.finished) return;
    this.finished = true;
    this.idleOn = false;
    this.hand.stop();
    for (const l of this.listeners) this.scene.input.off(l.event, l.fn);
    this.listeners = [];
    const owned = this.owned.filter((o) => o.active);
    this.owned = [];
    if (owned.length) {
      this.scene.tweens.add({
        targets: owned,
        alpha: 0,
        duration: 300,
        onComplete: () => owned.forEach((o) => o.destroy()),
      });
    }
    this.onDone();
  }

  /** Called if the scene leaves mid-step (e.g. home button). */
  abort() {
    this.finished = true;
    this.hand.stop();
    for (const l of this.listeners) this.scene.input.off(l.event, l.fn);
    this.listeners = [];
  }
}
