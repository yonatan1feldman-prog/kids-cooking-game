import Phaser from 'phaser';
import { voice, type VoiceKey } from '../core/audio';
import type { HandMotion, MomHandView } from '../core/hand';
import { inNoTouchZone, type Layout } from '../core/layout';
import type { Stage } from '../core/stage';
import type { ChooseOption, StepDef } from '../recipes/types';
import type { Character } from './Character';
import type { Dish } from './Dish';
import type { Mom } from './Mom';

import { AUTO_AFTER_HINT_MS, DEMO_MAX_MS, DEMO_WAIT_MS, HINT_AFTER_MS } from '../core/tuning';

// (The idle and demo timings live in the tuning table, core/tuning.ts.)
export { AUTO_AFTER_HINT_MS, DEMO_MAX_MS, HINT_AFTER_MS };

export interface StepContext {
  scene: Phaser.Scene;
  layout: Layout;
  /** Every fixed position on screen (core/stage.ts). */
  stage: Stage;
  dish: Dish;
  /** The round board the dish sits on. */
  board: Phaser.GameObjects.Image;
  /** Mom, at the counter on the right for the whole recipe. */
  mom: Mom;
  /** Pipa the hedgehog (the kitchen pet): beside Mom on phones, and the one who tastes the pizza. */
  character: Character;
  /** Mom's demo hand. */
  hand: MomHandView;
  /** Where the dish rests by default during a step (game coordinates). */
  dishHome: { x: number; y: number };
  /** The recipe being cooked (its id): the photo step files its picture in the memory book under it. */
  recipeId: string;
  /** State of this recipe run shared by its steps. */
  run: {
    /** "Watch me first!" / "Now you try!" go with the first demo of a run only; later demos just show. */
    demoTalkDone: boolean;
    /**
     * Things a step leaves on screen for the next one, by image key (the kneaded dough ball for rolling,
     * the stirred sauce bowl for spreading, the grated cheese pile for sprinkling). The next step adopts
     * the object (`adopt`) instead of popping in a new one, so the food visibly carries on.
     */
    handoff: Map<string, Phaser.GameObjects.Image>;
    /** What she chose (the choose step), in the order she picked it. */
    chosen: ChooseOption[];
    /** Steps to run right after the current one (the chosen toppings' prep steps); RecipeScene takes them. */
    insert: StepDef[];
    /** Lines said once per recipe run ("Be careful with the knife!"). */
    once: Set<string>;
    /** Her decorated pieces (the cookies), each its own picture, where it lies on the dish (local); for sharing. */
    pieces?: { key: string; x: number; y: number; scale: number; tint: number }[];
  };
}

export type PointerFn = (p: Phaser.Input.Pointer) => void;
/** `cancelled` is true when the touch was lost (pointercancel, released off the screen). */
export type UpFn = (p: Phaser.Input.Pointer, cancelled: boolean) => void;

/**
 * Base for every reusable step type.
 *
 * Cooking with Mom: before the step, Mom may show it once (`intro(true)`: her hand does the gesture
 * over the dish for at most 2.5 s, "Watch me first!" + the step's line, then "Now you try!"). A touch
 * during the demo ends it at once and the touch counts. Without a demo she only says the step's line.
 *
 * Never-stuck contract: `poke()` is called on every bit of real progress. With no
 * progress for `hintAfterMs` Mom's hand shows the gesture (`showHint`, looping), and after another
 * `autoAfterHintMs` Mom helps: "Let me help you!" and her hand does it (`autoFinish`). Phases where
 * the child only watches (e.g. baking) turn the idle clock off with `setIdle(false)`.
 *
 * One-finger contract: the first finger that touches down owns the step until it is
 * lifted. Other fingers and a resting palm are ignored and can't interrupt or steal it.
 */
export abstract class Step<P> {
  protected readonly scene: Phaser.Scene;
  protected readonly layout: Layout;
  protected readonly dish: Dish;
  protected readonly hand: MomHandView;
  /** Idle timings; a step may change them in start(). */
  protected hintAfterMs = HINT_AFTER_MS;
  protected autoAfterHintMs = AUTO_AFTER_HINT_MS;

  private owned: Phaser.GameObjects.GameObject[] = [];
  private listeners: { event: string; fn: (...args: unknown[]) => void }[] = [];
  private idleOn = false;
  private idleMs = 0;
  private hinting = false;
  private auto = false;
  private finished = false;
  /** The pointer that owns the current gesture, if any. */
  private owner: Phaser.Input.Pointer | null = null;

  constructor(protected readonly ctx: StepContext, protected readonly params: P, private readonly onDone: () => void) {
    this.scene = ctx.scene;
    this.layout = ctx.layout;
    this.dish = ctx.dish;
    this.hand = ctx.hand;
  }

  /** Build the step's objects and start listening. */
  abstract start(): void;
  /** Mom's hand doing the gesture this phase expects (at most DEMO_MAX_MS, it must not change the dish). */
  protected abstract demo(): HandMotion | null;
  /** Mom finishes the step with the child watching (her hand visibly does it), ending with `complete()`. */
  protected abstract autoFinish(): void;
  /** What Mom says as the step begins ("Let's roll the dough!"), if anything. */
  protected stepLine: VoiceKey | null = null;
  /** Lines right after the step line (e.g. "Be careful with the knife!" before the first cut of a run). */
  protected moreLines: VoiceKey[] = [];

  private sayStepLine(valid: () => boolean, ttlMs?: number) {
    if (this.stepLine) voice.say(this.stepLine, { valid, ttlMs });
    for (const l of this.moreLines) voice.say(l, { valid, ttlMs: 6000 });
  }

  /** The idle hint: Mom's hand shows the gesture again, looping until there is progress. */
  protected showHint() {
    const m = this.demo();
    if (m) this.hand.play(m, { loop: true, gapMs: 900 });
  }

  private demoing = false;
  /** This demo is the run's first: it gets "Watch me first!" and "Now you try!". */
  private demoTalk = false;
  private demoOff?: () => void;
  /** Called when Mom's demo hand starts, e.g. to hide the real tool while her prop tool moves. */
  protected onDemoStart() {}
  /** Called when the demo ends (finished or interrupted), e.g. to put a hidden tool back. */
  protected onDemoEnd() {}

  /** True while Mom's demo runs. */
  protected get inDemo() {
    return this.demoing;
  }

  /**
   * Starts the step's talk (and demo). Called by RecipeScene right after start().
   * The demo plays once; any touch ends it at once (the touch still counts, it is not swallowed).
   */
  intro(withDemo: boolean) {
    const m = withDemo ? this.demo() : null;
    const stillHere = () => !this.finished;
    if (!m) return this.sayStepLine(stillHere);
    this.demoing = true;
    const onTouch = () => this.endDemo(true);
    this.scene.input.on(Phaser.Input.Events.POINTER_DOWN, onTouch);
    this.demoOff = () => this.scene.input.off(Phaser.Input.Events.POINTER_DOWN, onTouch);
    const begin = () => {
      // She started by herself while Mom was still talking: no demo, just the step's line.
      if (!this.demoing) return this.sayStepLine(stillHere);
      // Only the run's first demo is introduced ("Watch me first!") and followed by "Now you try!".
      this.demoTalk = !this.ctx.run.demoTalkDone;
      this.ctx.run.demoTalkDone = true;
      if (this.demoTalk) voice.say('vo-watch-me', { valid: () => this.demoing });
      this.sayStepLine(stillHere, 3500);
      const mm = this.demo() ?? m;
      const keys = mm.keys;
      if (keys[keys.length - 1].t > DEMO_MAX_MS) console.warn('[step] demo longer than 2.5 s');
      this.onDemoStart();
      // (No glow in the demo: that is for the hint, when she needs to find where to touch.)
      this.hand.play({ ...mm, glow: undefined }, { onDone: () => this.endDemo(false) });
    };
    // Mom first finishes what she is saying ("Let's make a pizza!", the praise for the last step), at most
    // DEMO_WAIT_MS, so "Watch me first!" comes while her hand shows it.
    if (!voice.speaking) return begin();
    let waited = 0;
    const wait = this.scene.time.addEvent({
      delay: 100,
      loop: true,
      callback: () => {
        waited += 100;
        if (voice.speaking && this.demoing && waited < DEMO_WAIT_MS) return;
        wait.remove();
        begin();
      },
    });
  }

  private endDemo(interrupted: boolean) {
    if (!this.demoing) return;
    this.demoing = false;
    this.demoOff?.();
    this.demoOff = undefined;
    this.hand.stop();
    this.onDemoEnd();
    this.idleMs = 0;
    // "Now you try!" only if she hasn't started already.
    if (this.demoTalk && !interrupted && !this.finished) voice.say('vo-your-turn', { valid: () => !this.finished && !this.owner && this.idleMs < 3000, ttlMs: 3500 });
  }

  /** Mom helps: she says so, and the step's own help animation (with her hand) finishes it. */
  private help() {
    voice.say('vo-help', { ttlMs: 3000 });
    this.autoFinish();
  }

  /** True once the step is finishing itself; ignore input then. */
  protected get isAuto() {
    return this.auto || this.finished;
  }

  update(delta: number) {
    if (!this.idleOn || this.finished || this.auto || this.demoing) return;
    // A finger resting on the screen is not "stuck": hold the hint back.
    if (this.owner && !this.hinting) return;
    this.idleMs += delta;
    if (!this.hinting && this.idleMs >= this.hintAfterMs) {
      this.hinting = true;
      this.showHint();
    }
    if (this.idleMs >= this.hintAfterMs + this.autoAfterHintMs) {
      this.auto = true;
      this.hinting = false;
      this.hand.stop();
      this.owner = null;
      this.help();
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

  private misses = 0;

  /**
   * A try that didn't land (e.g. dropped away from the target). After 3 misses in a row
   * the hand shows the solution right away, without waiting for the idle clock.
   */
  protected miss() {
    this.misses++;
    if (this.misses >= 3 && !this.hinting && !this.isAuto) {
      this.misses = 0;
      this.hinting = true;
      this.idleMs = this.hintAfterMs;
      this.showHint();
    }
  }

  /** A try that landed: the miss streak starts over. */
  protected hit() {
    this.misses = 0;
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

  /** Takes over what the previous step left for this one (see `run.handoff`); it becomes this step's own. */
  protected adopt(key: string): Phaser.GameObjects.Image | null {
    const img = this.ctx.run.handoff.get(key);
    this.ctx.run.handoff.delete(key);
    return img && img.active ? this.own(img) : null;
  }

  /** Leaves an object on screen for the next step (not faded out by `complete()`). */
  protected handOff(key: string, img: Phaser.GameObjects.Image) {
    this.owned = this.owned.filter((o) => o !== img);
    this.ctx.run.handoff.get(key)?.destroy();
    this.ctx.run.handoff.set(key, img);
  }

  /**
   * Where the board with the dish is during this step: 'dish' in the middle (the default), 'aside' small in
   * the left column (prep work happens in the middle: the pizza waits there), 'none' not shown (nothing
   * on it yet, e.g. washing hands).
   */
  protected workspace(mode: 'dish' | 'aside' | 'none', ms = 500) {
    const { board, dish, stage, layout } = this.ctx;
    const home = stage.dishHome;
    const at = mode === 'aside' ? stage.aside : home;
    const f = mode === 'aside' ? stage.asideScale : 1;
    const alpha = mode === 'none' ? 0 : 1;
    this.scene.tweens.killTweensOf([board, dish]);
    const to = (o: Phaser.GameObjects.Image | Dish, scale: number) => {
      if (ms <= 0) return o.setPosition(at.x, at.y).setScale(scale).setAlpha(alpha);
      return this.scene.tweens.add({ targets: o, x: at.x, y: at.y, scale, alpha, duration: ms, ease: 'Sine.easeInOut' });
    };
    to(board, layout.k * f);
    to(dish, f);
    // (The board's resting scale for boing() follows it.)
    board.setData({ restScaleX: layout.k * f, restScaleY: layout.k * f });
  }

  protected own<T extends Phaser.GameObjects.GameObject>(obj: T): T {
    this.owned.push(obj);
    return obj;
  }

  /**
   * Scene-wide pointer listeners, removed automatically when the step ends.
   * A press only counts if no other finger owns the step, it doesn't start in the
   * no-touch zones (palm strip at the bottom, thumb strips at the sides) and it isn't on a button.
   */
  protected onDown(fn: PointerFn) {
    this.ensureOwnerRelease();
    this.listen(Phaser.Input.Events.POINTER_DOWN, (p: Phaser.Input.Pointer, over: Phaser.GameObjects.GameObject[]) => {
      if (this.isAuto) return;
      if (this.owner && this.owner !== p) return;
      if (over && over.length > 0) return;
      if (inNoTouchZone(this.scene, p.x, p.y)) return;
      this.owner = p;
      fn(p);
    });
  }

  protected onMove(fn: PointerFn) {
    this.listen(Phaser.Input.Events.POINTER_MOVE, (p: Phaser.Input.Pointer) => {
      if (this.isAuto || p !== this.owner || !p.isDown) return;
      fn(p);
    });
  }

  /** Release of the owning finger. Also fires (cancelled = true) if the touch is lost. */
  protected onUp(fn: UpFn) {
    this.upFns.push(fn);
    const handler = (outside: boolean) => (p: Phaser.Input.Pointer) => {
      if (p !== this.owner) return;
      this.owner = null;
      if (this.isAuto) return;
      fn(p, outside || p.wasCanceled);
    };
    this.listen(Phaser.Input.Events.POINTER_UP, handler(false));
    this.listen(Phaser.Input.Events.POINTER_UP_OUTSIDE, handler(true));
  }

  private upFns: UpFn[] = [];

  /**
   * Ends the current gesture as if the touch was lost (e.g. the device turned to portrait
   * mid-drag): whatever was held goes back gently, and that finger no longer owns the step.
   */
  cancelGesture() {
    const p = this.owner;
    if (!p || this.finished) return;
    this.owner = null;
    if (this.isAuto) return;
    for (const fn of this.upFns) fn(p, true);
  }

  private releaseArmed = false;

  /** Always free the owner when its finger lifts, after the step's own handlers ran. */
  private ensureOwnerRelease() {
    if (this.releaseArmed) return;
    this.releaseArmed = true;
    const release = (p: Phaser.Input.Pointer) =>
      queueMicrotask(() => {
        if (this.owner === p) this.owner = null;
      });
    this.listen(Phaser.Input.Events.POINTER_UP, release);
    this.listen(Phaser.Input.Events.POINTER_UP_OUTSIDE, release);
  }

  private listen(event: string, fn: (...args: never[]) => void) {
    const f = fn as unknown as (...args: unknown[]) => void;
    this.scene.input.on(event, f);
    this.listeners.push({ event, fn: f });
  }

  /** Ends the step: stops input and the hand, fades out owned objects, then advances. */
  protected complete() {
    if (this.finished) return;
    this.endDemo(true);
    this.finished = true;
    this.idleOn = false;
    this.owner = null;
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

  /**
   * True once the scene has left mid-step (home button, a restart). Anything that continues from a voice line's `done`
   * (which also runs when the voice is stopped on the way out) must check it before touching the scene.
   */
  protected aborted = false;

  /** Called if the scene leaves mid-step (e.g. home button). */
  abort() {
    this.aborted = true;
    this.endDemo(true);
    this.finished = true;
    this.hand.stop();
    for (const l of this.listeners) this.scene.input.off(l.event, l.fn);
    this.listeners = [];
  }
}
