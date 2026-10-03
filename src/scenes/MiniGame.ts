import Phaser from 'phaser';
import { music, voice, type Song, type VoiceKey } from '../core/audio';
import { MomHandView, type HandMotion } from '../core/hand';
import { confetti, tickles, touchRipples } from '../core/juice';
import { getLayout, inNoTouchZone, keepLayoutOnResize, ORIENTATION_PAUSE, type Layout } from '../core/layout';
import { getLevel, type Level } from '../core/level';
import { getStage, type Stage } from '../core/stage';
import { AUTO_AFTER_HINT_MS, DEMO_MAX_MS, HINT_AFTER_MS } from '../core/tuning';
import { iconButton, otherPointerDown } from '../core/ui';
import { RECIPES } from '../recipes';
import { Character } from '../steps/Character';
import { Mom } from '../steps/Mom';
import { assetsReady } from './BootScene';

export type P = { x: number; y: number };

/** How many times this game has been played on this device (only to show Mom's demos the first time; never shown). */
export function visits(id: string): number {
  try {
    const key = `cooking.runs.${id}`;
    const n = Number(localStorage.getItem(key)) || 0;
    localStorage.setItem(key, String(n + 1));
    return n;
  } catch {
    return 1;
  }
}

/** The difficulty the mini-games play at: the game's own level (`core/level.ts`); `window.__level` (the test harness) overrides it. */
export function gameLevel(): Level {
  const w = (globalThis as { __level?: number }).__level;
  return w === 1 || w === 2 ? w : getLevel();
}

/**
 * The frame the mini-games that are not cooking share (the market, washing up), after the garden (GardenScene):
 * the home button, Mom (and Pipa on phones), Mom's hand, one finger that owns what it holds until it is lifted, a
 * rotation dropping it back gently, and the step rules: the first visit Mom's hand shows each part once, after
 * HINT_AFTER_MS her hand shows it again, after AUTO_AFTER_HINT_MS more she does one piece ("Let me help you!") and
 * gives it back, three misses in a row show the hint at once. Nothing is timed, nothing can go wrong.
 *
 * A game names its parts (`phase`), says which of them wait for her (`waiting`), and gives Mom's hand its motion for
 * the current part (`way`) and one piece of help (`helpOnce`). Its touches come to `down` / `move` / `up`.
 */
export abstract class MiniGame extends Phaser.Scene {
  protected L!: Layout;
  protected S!: Stage;
  protected level: 1 | 2 = 1;
  protected phase = 'intro';
  protected first = false;
  protected leaving = false;
  protected helping = false;
  protected owner: Phaser.Input.Pointer | null = null;
  protected hand!: MomHandView;
  protected mom: Mom | null = null;
  protected pipa: Character | null = null;
  private demoOn = false;
  private hintOn = false;
  private idle = 0;
  private misses = 0;
  /** For the test harness. */
  shown: Record<string, unknown> & { phase: string; helped: number; missed: number; done: boolean } = { phase: 'intro', helped: 0, missed: 0, done: false };

  protected abstract readonly id: string;
  /** The place's song (core/audio.ts `music`): the market is outdoors, washing up is in the kitchen. */
  protected readonly song: Song = 'kitchen';
  /** Mom's clothes (the clinic: Mom the nurse). */
  protected readonly momOutfit: 'home' | 'nurse' = 'home';
  /** Where the home button and the finale go (the clinic is a world of its own: back to the title). */
  protected readonly homeScene: 'Home' | 'Title' = 'Home';
  /** Pipa small beside Mom (the clinic leaves her out when she is one of the patients). */
  protected withPipa(): boolean {
    return true;
  }
  /** The parts that wait for her (idle clock, hint, help run only in these). */
  protected abstract readonly waiting: readonly string[];
  protected abstract build(): void;
  protected abstract way(): HandMotion | null;
  /** One piece of Mom's help for the current part; call `helped()` when it is done. Return false if nothing to do. */
  protected abstract helpOnce(): boolean;
  protected abstract down(p: Phaser.Input.Pointer, at: P): void;
  protected move(_p: Phaser.Input.Pointer): void {}
  protected up(_p: Phaser.Input.Pointer, _cancelled: boolean): void {}
  /** Where Mom and Pipa look (the thing held, else the finger or Mom's hand). */
  protected lookTarget(): P | null {
    return null;
  }
  protected tick(_delta: number): void {}
  /** Ms without progress before the hint, and further ms before Mom's help (free drawing waits longer). */
  protected hintAfter(): number {
    return HINT_AFTER_MS;
  }
  protected helpAfter(): number {
    return AUTO_AFTER_HINT_MS;
  }

  init() {
    this.phase = 'intro';
    this.leaving = this.helping = this.demoOn = this.hintOn = false;
    this.idle = this.misses = 0;
    this.owner = null;
    this.mom = this.pipa = null;
    this.shown = { phase: 'intro', helped: 0, missed: 0, done: false };
  }

  create() {
    const L = (this.L = getLayout(this));
    keepLayoutOnResize(this, L);
    const S = (this.S = getStage(L));
    this.first = visits(this.id) === 0;
    this.level = gameLevel();
    this.shown.level = this.level;
    music.play(this.song);

    iconButton(this, L, 'btn-home', S.home.x, S.home.y, () => this.leave('recipe'), { confirm: true, scale: S.homeScale, hitPad: 30 }).setDepth(900);
    this.hand = new MomHandView(this, L);
    touchRipples(this, L);
    this.build();

    assetsReady().then(() => {
      if (!this.scene.isActive()) return;
      this.mom = new Mom(this, S.mom, this.momOutfit);
      this.mom.rest();
      this.mom.followHand(() => this.hand.active);
      if (S.pet && this.withPipa()) {
        this.pipa = new Character(this, RECIPES[0].character, S.pet, S.feedPet);
        this.pipa.enter(150);
      }
      tickles(this, () => [this.mom, this.pipa], () => !this.owner);
      this.ready();
    });

    const onDown = (p: Phaser.Input.Pointer) => this.onDown(p);
    const onMove = (p: Phaser.Input.Pointer) => p === this.owner && this.move(p);
    const up = (p: Phaser.Input.Pointer) => p === this.owner && this.release(p, p.wasCanceled);
    const upOutside = (p: Phaser.Input.Pointer) => p === this.owner && this.release(p, true);
    this.input.on(Phaser.Input.Events.POINTER_DOWN, onDown);
    this.input.on(Phaser.Input.Events.POINTER_MOVE, onMove);
    this.input.on(Phaser.Input.Events.POINTER_UP, up);
    this.input.on(Phaser.Input.Events.POINTER_UP_OUTSIDE, upOutside);
    const onPause = () => this.owner && this.release(this.owner, true);
    this.game.events.on(ORIENTATION_PAUSE, onPause);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.game.events.off(ORIENTATION_PAUSE, onPause);
      this.input.off(Phaser.Input.Events.POINTER_DOWN, onDown);
      this.input.off(Phaser.Input.Events.POINTER_MOVE, onMove);
      this.input.off(Phaser.Input.Events.POINTER_UP, up);
      this.input.off(Phaser.Input.Events.POINTER_UP_OUTSIDE, upOutside);
      this.hand.destroy();
      this.shutdown();
    });
  }

  /** Mom and Pipa are in (their art has loaded). */
  protected ready() {}
  /** The scene is going: stop loops. */
  protected shutdown() {}

  // ---------------------------------------------------------------- helpers

  protected say(key: VoiceKey, opts: { ttlMs?: number; done?: () => void; group?: string; sequence?: boolean } = {}) {
    voice.say(key, { ttlMs: 4000, ...opts, valid: () => this.scene.isActive() && !this.leaving });
  }

  protected leave(from: 'recipe' | 'finale') {
    if (this.leaving) return;
    this.leaving = true;
    this.shutdown();
    if (from === 'recipe') voice.stop();
    this.scene.start(this.homeScene, { from });
  }

  protected setPhase(p: string) {
    this.phase = p;
    this.shown.phase = p;
    this.idle = this.misses = 0;
    this.stopHint();
  }

  /** The start of a part: its line, and the first visit Mom's hand shows it once (a touch ends it). */
  protected begin(p: string, line: VoiceKey | null) {
    this.setPhase(p);
    if (line) this.say(line, { ttlMs: 5000 });
    if (this.first) this.time.delayedCall(700, () => this.phase === p && !this.owner && !this.helping && this.showWay(false));
  }

  /** Real progress: the idle clock starts again, a hint goes away. */
  protected poke() {
    this.idle = this.misses = 0;
    if (this.hintOn) this.stopHint();
  }

  protected praise(x: number, y: number, then: () => void, wait = 900) {
    const L = this.L;
    voice.praise({ ttlMs: 5000, valid: () => this.scene.isActive() && !this.leaving });
    music.party();
    this.mom?.happy();
    this.pipa?.cheer();
    confetti(this, x, y, 14, 24 * L.k);
    this.time.delayedCall(900, () => this.mom?.rest());
    this.time.delayedCall(wait + 900, () => !this.leaving && then());
  }

  /** The warm ending: the game's line, then "That was fun! Bye bye!", then quietly home. */
  protected goodbye(line: VoiceKey) {
    let gone = false;
    const bye = () => {
      if (gone) return;
      gone = true;
      this.say('vo-bye', { ttlMs: 4000, done: () => this.time.delayedCall(1200, () => this.leave('finale')) });
      this.time.delayedCall(6000, () => this.leave('finale'));
    };
    this.say(line, { ttlMs: 5000, done: bye });
    this.time.delayedCall(7000, bye);
  }

  protected near(a: P, b: P, r: number) {
    return Math.hypot(a.x - b.x, a.y - b.y) < r;
  }

  protected miss() {
    this.shown.missed++;
    if (++this.misses >= 3) {
      this.misses = 0;
      this.idle = 0;
      this.showWay(true);
    }
  }

  /** A mistake that deserves Mom's hand at once (her hand shows the right way; nothing is lost). */
  protected hintNow() {
    this.misses = 0;
    this.idle = 0;
    this.showWay(true);
  }

  protected own(p: Phaser.Input.Pointer) {
    this.owner = p;
  }

  private release(p: Phaser.Input.Pointer, cancelled: boolean) {
    this.owner = null;
    this.up(p, cancelled);
  }

  // ---------------------------------------------------------------- Mom's hand

  protected showWay(loop: boolean) {
    const m = this.way();
    if (!m) return;
    if (!loop) {
      m.keys = m.keys.filter((q) => q.t <= DEMO_MAX_MS);
      m.glow = undefined;
      this.demoOn = true;
      this.hand.play(m, { onDone: () => (this.demoOn = false) });
      return;
    }
    this.hintOn = true;
    this.hand.play(m, { loop: true, gapMs: 900 });
  }

  protected stopHint() {
    if (this.hintOn || this.demoOn) this.hand.stop();
    this.hintOn = this.demoOn = false;
  }

  /** "Let me help you!": Mom's hand does one piece of the current part, then it is hers again. */
  private help() {
    if (this.helping) return;
    this.stopHint();
    this.helping = true;
    if (!this.helpOnce()) {
      this.helping = false;
      this.idle = 0;
      return;
    }
    this.shown.helped++;
    voice.say('vo-help', { ttlMs: 2500, valid: () => this.scene.isActive() && !this.leaving });
  }

  /** Mom's help piece is over: the turn is hers again. */
  protected helped() {
    this.hand.stop();
    this.helping = false;
    this.idle = 0;
  }

  // ---------------------------------------------------------------- touch

  private onDown(p: Phaser.Input.Pointer) {
    if (otherPointerDown(this, p)) return;
    // Any touch ends a demo or a hint (the touch still counts for what it lands on).
    if (this.demoOn || (this.hintOn && !this.owner)) this.stopHint();
    this.idle = 0;
    if (this.owner || this.helping || this.leaving) return;
    if (inNoTouchZone(this, p.x, p.y)) return;
    if (this.near({ x: p.worldX, y: p.worldY }, this.S.home, 130 * this.L.k)) return;
    this.down(p, { x: p.worldX, y: p.worldY });
  }

  update(_t: number, delta: number) {
    this.tick(delta);
    const p = this.owner ?? this.input.manager.pointers.find((q) => q.isDown);
    const at = this.lookTarget() ?? this.hand.position ?? (p ? { x: p.worldX, y: p.worldY } : null);
    if (at) {
      this.mom?.lookAt(at.x, at.y);
      this.pipa?.lookAt(at.x, at.y);
    }
    if (!this.waiting.includes(this.phase) || this.helping || this.demoOn || this.owner || this.leaving) return;
    this.idle += delta;
    if (!this.hintOn && this.idle >= this.hintAfter()) this.showWay(true);
    if (this.idle >= this.hintAfter() + this.helpAfter()) this.help();
  }
}
