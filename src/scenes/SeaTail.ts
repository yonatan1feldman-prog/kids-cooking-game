import Phaser from 'phaser';
import { voice, type NameKey } from '../core/audio';
import { burst, stars } from '../core/fx';
import { tapMotion, type HandMotion } from '../core/hand';
import { byVisit, SEA_PAINT_HEX, SEA_PAINTS, TAIL, writeMark, type SeaPaint, type TailMark } from '../core/sea';
import { MOM_LOBES, MOM_TAIL_AREAS, MOM_TAIL_BODY, TAIL_BIG_AREAS, TAIL_BIG_BODY } from '../core/seaTailArt';
import { sfx } from '../core/sfx';
import { iconButton } from '../core/ui';
import type { Mom } from '../steps/Mom';
import { visits, type P } from './MiniGame';
import { SeaGame } from './SeaGame';

/** The big tail's frame (tail-big, tail-big-lines and the paint between them). */
const TB = 900;
/** The body's scales come first in TAIL_BIG_AREAS, then the fluke's two lobes. */
const BODY = TAIL_BIG_AREAS.filter((a) => a.clip).length;
type Brush = SeaPaint | 'glitter';
const hex = (p: SeaPaint) => Phaser.Display.Color.HexStringToColor(SEA_PAINT_HEX[p]).color;

/**
 * The sparkly tail (mermaid-spec 3.1; mermaid PR 2): Mom's tail, big in the middle, waiting to be painted. On the left
 * six little shells of paint and one of glitter. A tap on a shell picks it (Mom says the colour), a tap on a scale fills it
 * with that paint, spreading from the finger; she can paint over as often as she likes. The glitter shell: rubbing a
 * scale makes it sparkle for good. Easy: free painting; when every scale is painted (or 15 s after she started) the done
 * button. Hard: Mom paints the first four scales in a pattern of two colours and she carries it on down the tail ("What
 * comes next?"); a scale in another colour goes softly back to pale and Mom says the colour that comes next; then the
 * fin is hers to paint as she likes. At the end the photo, and Mom has the tail she painted (here and in the lagoon).
 */
export class SeaTail extends SeaGame {
  protected readonly id = 'sea-tail';
  protected readonly waiting = ['paint', 'fin', 'done'] as const;
  private fills: (SeaPaint | null)[] = [];
  private glitter: boolean[] = [];
  private brush: Brush | null = null;
  private pattern: readonly [SeaPaint, SeaPaint] = ['pink', 'blue'];
  private shells: { brush: Brush; img: Phaser.GameObjects.Image; blob?: Phaser.GameObjects.Image; x: number; y: number; s: number }[] = [];
  private tail!: { x: number; y: number; s: number; base: Phaser.GameObjects.Image; paint: Phaser.GameObjects.Image; lines: Phaser.GameObjects.Image };
  private canvas!: Phaser.Textures.CanvasTexture;
  private paths: Path2D[] = [];
  private body!: Path2D;
  private anim: { i: number; to: SeaPaint; at: [number, number]; t: number } | null = null;
  /** Ms since her first paint (counted by frames: the clock of the game, not of the page). 0 = not started. */
  private paintedMs = 0;
  private rub: { i: number; dist: number; last: P } | null = null;
  private sparkles: Phaser.GameObjects.Image[][] = [];
  private doneBtn?: Phaser.GameObjects.Image;
  private startedAt = 0;
  private toldGlitter = false;

  constructor() {
    super('SeaTail');
  }

  protected build() {
    const L = this.L;
    const S = this.S;
    const k = L.k;
    this.water(false);
    this.fills = TAIL_BIG_AREAS.map(() => null);
    this.glitter = TAIL_BIG_AREAS.map(() => false);
    this.sparkles = TAIL_BIG_AREAS.map(() => []);
    this.brush = null;
    this.anim = this.rub = null;
    this.doneBtn = undefined;
    this.startedAt = 0;
    this.paintedMs = 0;
    this.toldGlitter = false;
    const run = visits('sea-tail-pattern');
    this.pattern = byVisit(TAIL.patterns, run);

    // The shells of paint, down the left column (two by two), the glitter shell last.
    const brushes: Brush[] = [...SEA_PAINTS, 'glitter'];
    const n = brushes.length;
    const bs = (S.binScale(n) * 240) / 220;
    this.shells = brushes.map((b, i) => {
      const at = S.bin(i, n);
      const img = this.add.image(at.x, at.y, b === 'glitter' ? 'shell-glitter' : 'shell-paint').setScale(bs).setDepth(20);
      const blob = b === 'glitter' ? undefined : this.add.image(at.x, at.y, 'paint-blob').setScale(bs).setTint(hex(b)).setDepth(21);
      return { brush: b, img, blob, x: at.x, y: at.y, s: bs };
    });

    // The big tail in the room between the shells and Marina (or Mom), as big as fits, its waist near the top.
    const x0 = S.work.x0;
    const x1 = S.pet ? S.work.x1 : Math.min(S.work.x1, S.momFace.x0 - 20 * k);
    const y0 = 24 * k;
    const y1 = L.Y(994) - 6 * k;
    const s = Math.min((x1 - x0) / 640, (y1 - y0) / 860, 1.25 * k);
    const cx = (x0 + x1) / 2;
    const cy = y0 + (TB / 2 - 30) * s;
    const key = 'sea-tail-paint';
    if (this.textures.exists(key)) this.textures.remove(key);
    this.canvas = this.textures.createCanvas(key, TB, TB)!;
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.textures.exists(key) && this.textures.remove(key));
    this.tail = {
      x: cx,
      y: cy,
      s,
      base: this.add.image(cx, cy, 'tail-big').setScale(s).setDepth(10),
      paint: this.add.image(cx, cy, key).setScale(s).setDepth(11),
      lines: this.add.image(cx, cy, 'tail-big-lines').setScale(s).setDepth(12),
    };
    this.body = new Path2D(TAIL_BIG_BODY);
    this.paths = TAIL_BIG_AREAS.map((a) => new Path2D(a.d));
    this.redraw();

    this.time.delayedCall(500, () => this.start());
  }

  private start() {
    if (this.level === 2) {
      this.setPhase('show');
      this.say('vo-tail-pattern', { ttlMs: 5000 });
      this.time.delayedCall(1600, () => this.showPattern(0));
    } else {
      this.pick('pink', false);
      this.begin('paint', 'vo-tail-start');
    }
  }

  // ---------------------------------------------------------------- the paint

  /** A tail point (its 900 frame) in the world, and back. */
  private toWorld(p: [number, number]): P {
    return { x: this.tail.x + (p[0] - TB / 2) * this.tail.s, y: this.tail.y + (p[1] - TB / 2) * this.tail.s };
  }
  private toTail(p: P): [number, number] {
    return [(p.x - this.tail.x) / this.tail.s + TB / 2, (p.y - this.tail.y) / this.tail.s + TB / 2];
  }

  private inArea(i: number, p: [number, number]) {
    const g = this.canvas.context;
    g.setTransform(1, 0, 0, 1, 0, 0);
    if (!g.isPointInPath(this.paths[i], p[0], p[1])) return false;
    return !TAIL_BIG_AREAS[i].clip || g.isPointInPath(this.body, p[0], p[1]);
  }

  /** The scale under the finger, or the nearest one when the finger is just off the tail's edge (forgiving). */
  private areaAt(p: [number, number]) {
    for (let i = 0; i < this.paths.length; i++) if (this.inArea(i, p)) return i;
    let best = -1;
    let bd = 90;
    TAIL_BIG_AREAS.forEach((a, i) => {
      for (const [dx, dy] of [[0, 0], [-60, 0], [60, 0], [0, -40], [0, 40]]) {
        const d = Math.hypot(p[0] - (a.x + dx), p[1] - (a.y + dy)) - 50;
        if (d < bd) (bd = d), (best = i);
      }
    });
    return best;
  }

  private redraw() {
    const g = this.canvas.context;
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.clearRect(0, 0, TB, TB);
    TAIL_BIG_AREAS.forEach((a, i) => {
      const f = this.fills[i];
      const an = this.anim && this.anim.i === i ? this.anim : null;
      if (!f && !an) return;
      g.save();
      if (a.clip) g.clip(this.body);
      g.clip(this.paths[i]);
      if (f) {
        g.fillStyle = SEA_PAINT_HEX[f];
        g.fillRect(0, 0, TB, TB);
      }
      if (an) {
        const t = Phaser.Math.Clamp(an.t / TAIL.fillMs, 0, 1);
        g.fillStyle = SEA_PAINT_HEX[an.to];
        g.beginPath();
        g.arc(an.at[0], an.at[1], 420 * (1 - (1 - t) * (1 - t)), 0, Math.PI * 2);
        g.fill();
      }
      g.restore();
    });
    this.canvas.refresh();
  }

  protected tick(delta: number) {
    if (this.startedAt) this.paintedMs += delta;
    if (this.anim) {
      this.anim.t += delta;
      this.redraw();
    }
  }

  /** Picks a shell: it lifts a little and glows, Mom says its colour (the glitter shell: "Rub for glitter!"). */
  private pick(b: Brush, speak = true) {
    this.brush = b;
    for (const sh of this.shells) {
      const on = sh.brush === b;
      this.tweens.killTweensOf([sh.img, sh.blob].filter(Boolean) as Phaser.GameObjects.Image[]);
      const s = on ? sh.s * 1.16 : sh.s;
      this.tweens.add({ targets: [sh.img, sh.blob].filter(Boolean), scale: s, y: on ? sh.y - 10 * this.L.k : sh.y, duration: 220, ease: 'Back.easeOut' });
    }
    if (!speak) return;
    sfx(this, 'pop', { minGapMs: 60 });
    if (b === 'glitter') {
      sfx(this, 'glitter', { minGapMs: 200 });
      if (!this.toldGlitter) (this.toldGlitter = true), this.say('vo-tail-glitter', { ttlMs: 3000 });
    } else voice.say(`name-${b}` as NameKey, { group: 'name', ttlMs: 2000, valid: () => this.scene.isActive() && !this.leaving });
  }

  /** The paint the hard pattern wants on body scale i (A, B, A, B... down the tail), or null (the fin: free). */
  private wanted(i: number): SeaPaint | null {
    return this.level === 2 && i >= 0 && i < BODY ? this.pattern[i % 2] : null;
  }

  /** The next scale of the pattern still waiting (hard), or the first one not painted. */
  private nextArea(): number {
    if (this.phase === 'paint' && this.level === 2) {
      for (let i = 0; i < BODY; i++) if (this.fills[i] !== this.wanted(i)) return i;
      return -1;
    }
    const from = this.phase === 'fin' ? BODY : 0;
    for (let i = from; i < this.fills.length; i++) if (!this.fills[i]) return i;
    return -1;
  }

  /** Fills scale i with `to`, spreading from `at` (tail frame); `then` once it is full. */
  private paint(i: number, to: SeaPaint, at: [number, number], then?: () => void) {
    if (this.anim) {
      // (the one spreading finishes at once and counts)
      const j = this.anim.i;
      this.fills[j] = this.anim.to;
      this.anim = null;
      this.redraw();
      this.afterPaint(j);
    }
    if (this.fills[i] === to) return then?.();
    this.anim = { i, to, at, t: 0 };
    if (!this.startedAt) this.startedAt = 1;
    sfx(this, 'shimmer', { minGapMs: 80 });
    const w = this.toWorld(at);
    burst(this, w.x, w.y, { texture: 'fx-sparkle', count: 6, tint: [hex(to), 0xffffff], size: 34 * this.L.k, speed: 260, gravityY: -80, lifespan: 600, depth: 60 });
    this.time.delayedCall(TAIL.fillMs, () => {
      if (this.anim?.i !== i) return then?.();
      this.fills[i] = this.anim.to;
      this.anim = null;
      this.redraw();
      this.afterPaint(i);
      then?.();
    });
  }

  private afterPaint(i: number) {
    const c = this.areaCentre(i);
    const want = this.wanted(i);
    if (this.phase === 'paint' && want) {
      if (this.fills[i] === want) {
        stars(this, c.x, c.y, 6, 34 * this.L.k);
        this.poke();
      } else {
        // not the colour that comes next: the scale goes softly back to pale, Mom says the one that comes next
        sfx(this, 'squeak', { volume: 0.4, minGapMs: 200 });
        this.time.delayedCall(250, () => {
          if (this.fills[i] === want) return;
          this.fills[i] = null;
          this.redraw();
        });
        const next = this.wanted(this.nextArea()) ?? want;
        this.say('vo-tail-next', { ttlMs: 2500 });
        voice.say(`name-${next}` as NameKey, { group: 'name', ttlMs: 4000, valid: () => this.scene.isActive() && !this.leaving });
        this.glowShell(next);
        this.miss();
      }
    } else this.poke();
    this.shown.painted = this.fills.filter(Boolean).length;
    this.checkDone();
  }

  /** The middle of scale i in the world. */
  private areaCentre(i: number): P {
    const a = TAIL_BIG_AREAS[i];
    return this.toWorld([a.x, a.y]);
  }

  private glowShell(b: Brush) {
    const sh = this.shells.find((q) => q.brush === b);
    if (!sh) return;
    const g = this.add.image(sh.x, sh.y, 'fx-sparkle').setTint(0xfff1b8).setBlendMode(Phaser.BlendModes.ADD).setDepth(19).setScale((sh.s * 220 * 1.3) / 80);
    this.tweens.add({ targets: g, alpha: { from: 0.9, to: 0 }, duration: 500, yoyo: true, repeat: 1, onComplete: () => g.destroy() });
  }

  /** Every scale (of the part she is on) as it should be: the next part, or the done button. */
  private checkDone() {
    if (this.phase === 'paint' && this.level === 2) {
      if (this.nextArea() < 0) {
        this.setPhase('intro');
        this.time.delayedCall(500, () => {
          voice.praise({ ttlMs: 4000, valid: () => this.scene.isActive() && !this.leaving });
          this.mom?.happy();
          this.pipa?.cheer();
          this.time.delayedCall(1400, () => {
            this.begin('fin', 'vo-tail-fin');
            // (she may have painted the fin already)
            this.checkDone();
          });
        });
      }
      return;
    }
    const all = this.fills.every(Boolean);
    if ((this.phase === 'paint' || this.phase === 'fin') && all) {
      this.setPhase('done');
      this.say('vo-tail-all', { ttlMs: 4000 });
      this.mom?.happy();
      this.pipa?.cheer();
      this.showDone();
    }
  }

  private showDone() {
    if (this.doneBtn) return;
    const L = this.L;
    this.doneBtn = iconButton(this, L, 'btn-done', this.S.done.x, this.S.done.y, () => this.finish(), { hitPad: 30 }).setDepth(800);
    this.doneBtn.setScale(0);
    this.tweens.add({ targets: this.doneBtn, scale: L.k, duration: 360, ease: 'Back.easeOut' });
  }

  /** Glitter on scale i for good: a few sparkles that twinkle on it (only where she rubbed). */
  private addGlitter(i: number) {
    if (this.glitter[i]) return;
    this.glitter[i] = true;
    this.shown.glitter = this.glitter.filter(Boolean).length;
    sfx(this, 'glitter', { minGapMs: 120 });
    const a = TAIL_BIG_AREAS[i];
    const pts: [number, number][] = [];
    for (let t = 0; t < 40 && pts.length < 4; t++) {
      const p: [number, number] = [a.x + Phaser.Math.Between(-110, 110), a.y + Phaser.Math.Between(-60, 60)];
      if (this.inArea(i, p) && pts.every((q) => Math.hypot(q[0] - p[0], q[1] - p[1]) > 50)) pts.push(p);
    }
    if (!pts.length) pts.push([a.x, a.y]);
    const k = this.L.k;
    this.sparkles[i] = pts.map((p, j) => {
      const w = this.toWorld(p);
      const sp = this.add.image(w.x, w.y, 'fx-sparkle').setDepth(13).setTint(j % 2 ? 0xfff4b8 : 0xffffff).setScale(0);
      const s = ((28 + 10 * (j % 2)) * this.tail.s) / 80;
      this.tweens.add({ targets: sp, scale: s * 1.6, duration: 260, ease: 'Back.easeOut', onComplete: () => {
        this.tweens.add({ targets: sp, scale: { from: s * 1.4, to: s * 0.7 }, alpha: { from: 1, to: 0.45 }, angle: 45, duration: 900 + j * 170, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      } });
      return sp;
    });
    const c = this.areaCentre(i);
    stars(this, c.x, c.y, 5, 30 * k);
    this.poke();
  }

  // ---------------------------------------------------------------- hard: Mom shows the pattern

  private showPattern(i: number) {
    if (!this.scene.isActive() || this.leaving) return;
    if (i >= TAIL.shown) {
      // her turn: no shell picked, she chooses the colour that comes next
      this.hand.stop();
      this.brush = null;
      this.shells.forEach((sh) => this.tweens.add({ targets: [sh.img, sh.blob].filter(Boolean), scale: sh.s, y: sh.y, duration: 200 }));
      this.begin('paint', 'vo-tail-next');
      return;
    }
    const to = this.pattern[i % 2];
    this.hand.play(this.paintMotion(i, to), {
      onDone: () => {
        this.pick(to, false);
        voice.say(`name-${to}` as NameKey, { group: 'name', ttlMs: 2500, valid: () => this.scene.isActive() && !this.leaving });
        const a = TAIL_BIG_AREAS[i];
        this.paint(i, to, [a.x, a.y], () => this.time.delayedCall(250, () => this.showPattern(i + 1)));
      },
    });
  }

  /** Mom's hand: a tap on the shell of `to` (unless it is picked already), then a tap on scale i. */
  private paintMotion(i: number, to: SeaPaint | null): HandMotion {
    const k = this.L.k;
    const c = this.areaCentre(i);
    const sh = to && this.brush !== to ? this.shells.find((q) => q.brush === to) : undefined;
    if (!sh) return { ...tapMotion(c, k), glow: c };
    return {
      kind: 'point',
      keys: [
        { x: sh.x + 60 * k, y: sh.y + 70 * k, t: 0 },
        { x: sh.x, y: sh.y, t: 350 },
        { x: sh.x, y: sh.y, t: 520, press: true },
        { x: sh.x, y: sh.y, t: 680 },
        { x: c.x, y: c.y, t: 1250 },
        { x: c.x, y: c.y, t: 1420, press: true },
        { x: c.x, y: c.y, t: 1600 },
      ],
      glow: { x: sh.x, y: sh.y },
    };
  }

  // ---------------------------------------------------------------- touch

  protected down(p: Phaser.Input.Pointer, at: P) {
    if (!['paint', 'fin', 'done'].includes(this.phase)) return;
    const k = this.L.k;
    if (this.doneBtn && this.near(at, this.doneBtn, 150 * k)) return;
    const sh = this.shells.find((q) => this.near(at, q, 110 * q.s + 10 * k));
    if (sh) return this.pick(sh.brush);
    const tp = this.toTail(at);
    const i = this.areaAt(tp);
    if (i < 0) return;
    if (this.brush === 'glitter') {
      this.own(p);
      this.rub = { i, dist: 0, last: at };
      burst(this, at.x, at.y, { texture: 'fx-sparkle', count: 4, tint: [0xffffff, 0xfff4b8], size: 26 * k, speed: 200, gravityY: -60, lifespan: 500, depth: 60 });
      return;
    }
    if (!this.brush) {
      // (hard, nothing picked yet: the shell of the colour that comes next glows, Mom says it)
      const want = this.wanted(this.nextArea());
      if (want) {
        this.glowShell(want);
        voice.say(`name-${want}` as NameKey, { group: 'name', ttlMs: 2500, valid: () => this.scene.isActive() && !this.leaving });
      }
      return this.miss();
    }
    // the pattern's scales are done (hard, the fin): the body keeps its pattern, a tap there only sparkles
    if (this.phase !== 'paint' && this.level === 2 && i < BODY) {
      burst(this, at.x, at.y, { texture: 'fx-sparkle', count: 4, tint: [0xffffff], size: 26 * k, speed: 200, gravityY: -60, lifespan: 500, depth: 60 });
      return;
    }
    this.paint(i, this.brush, tp);
  }

  protected move(p: Phaser.Input.Pointer) {
    const r = this.rub;
    if (!r) return;
    const at = { x: p.worldX, y: p.worldY };
    const i = this.areaAt(this.toTail(at));
    if (i >= 0 && i !== r.i) {
      r.i = i;
      r.dist = 0;
    }
    r.dist += Math.hypot(at.x - r.last.x, at.y - r.last.y);
    r.last = at;
    if (Math.random() < 0.3) burst(this, at.x, at.y, { texture: 'fx-sparkle', count: 1, tint: [0xffffff, 0xfff4b8], size: 22 * this.L.k, speed: 120, gravityY: -40, lifespan: 400, depth: 60 });
    if (i >= 0 && r.dist >= TAIL.glitterRub * this.L.k) {
      this.addGlitter(i);
      r.dist = -1e9;
    }
  }

  protected up() {
    this.rub = null;
  }

  // ---------------------------------------------------------------- Mom's hand, her help

  protected hintAfter() {
    // (free painting, once she has started: like free decorating, the hint waits longer)
    return this.phase === 'done' || (this.level === 1 && this.startedAt) ? Math.max(super.hintAfter(), 15000) : super.hintAfter();
  }

  protected tickDone() {
    // (easy: 15 s after the first paint, the done button comes even if some scales are pale)
    if (this.phase === 'paint' && this.level === 1 && this.startedAt && !this.doneBtn && this.paintedMs > TAIL.doneAfterMs && this.fills.filter(Boolean).length >= 4) this.showDone();
  }

  update(t: number, delta: number) {
    super.update(t, delta);
    this.tickDone();
  }

  protected way(): HandMotion | null {
    const k = this.L.k;
    if (this.phase === 'done' || (this.doneBtn && this.nextArea() < 0)) return this.doneBtn ? { ...tapMotion({ x: this.doneBtn.x, y: this.doneBtn.y }, k), glow: { x: this.doneBtn.x, y: this.doneBtn.y } } : null;
    const i = this.nextArea();
    if (i < 0) return null;
    const to = this.wanted(i) ?? (this.brush && this.brush !== 'glitter' ? this.brush : 'pink');
    return this.paintMotion(i, to);
  }

  protected helpOnce(): boolean {
    if (this.phase === 'done' || (this.doneBtn && this.nextArea() < 0)) {
      if (!this.doneBtn) return false;
      const b = this.doneBtn;
      this.hand.play(tapMotion({ x: b.x, y: b.y }, this.L.k), { onDone: () => (this.helped(), this.finish()) });
      return true;
    }
    const i = this.nextArea();
    if (i < 0) return false;
    const to: SeaPaint = this.wanted(i) ?? (this.brush && this.brush !== 'glitter' ? this.brush : byVisit(SEA_PAINTS, i));
    this.hand.play(this.paintMotion(i, to), {
      onDone: () => {
        this.pick(to, false);
        const a = TAIL_BIG_AREAS[i];
        this.paint(i, to, [a.x, a.y], () => this.helped());
      },
    });
    return true;
  }

  protected nothingToHelp() {
    if (this.phase === 'paint' || this.phase === 'fin') this.checkDone();
  }

  protected lookTarget(): P | null {
    return this.rub ? this.rub.last : null;
  }

  // ---------------------------------------------------------------- the end

  private finish() {
    if (this.phase === 'end' || this.leaving) return;
    if (this.anim) {
      this.fills[this.anim.i] = this.anim.to;
      this.anim = null;
      this.redraw();
    }
    this.setPhase('end');
    this.shown.done = true;
    this.hand.stop();
    this.doneBtn?.disableInteractive();
    if (this.doneBtn) this.tweens.add({ targets: this.doneBtn, scale: 0, duration: 250 });
    // whatever is still pale gets a soft pearl colour (her tail is never half grey in the lagoon)
    const mark: TailMark = { fills: this.fills.map((f) => f ?? 'white'), glitter: [...this.glitter] };
    this.fills = [...mark.fills];
    this.redraw();
    writeMark('tail', mark);
    this.shells.forEach((sh) => this.tweens.add({ targets: [sh.img, sh.blob].filter(Boolean), alpha: 0, duration: 400 }));
    const L = this.L;
    const t = this.tail;
    const side = Math.min(L.H * 0.9, 760 * t.s);
    this.praise(t.x, t.y - 200 * t.s, () => {
      this.seaPhoto('tail', { x: t.x - side / 2, y: Math.max(0, t.y - side / 2 + 20 * t.s), w: side, h: side }, { x: t.x, y: L.cy }, (photo) => {
        this.time.delayedCall(1700, () => {
          // the photo and the big tail go; Mom has the tail she painted
          this.tweens.add({ targets: [t.base, t.paint, t.lines, photo, ...this.sparkles.flat()], alpha: 0, duration: 500 });
          if (this.mom) {
            paintMomTail(this, this.mom, mark);
            const m = this.mom;
            const tip = { x: m.box.x + (142 - 400) * m.s, y: m.box.y + (660 - 800) * m.s };
            stars(this, tip.x, tip.y, 12, 50 * L.k);
            m.celebrate();
          }
          this.pipa?.cheer();
          this.goodbye('vo-tail-look');
        });
      });
    }, 300);
  }
}

/**
 * Mom's own tail painted the way she painted the big one (the lagoon's mark `lagoon.tail`, and the end of the
 * activity): her tail's picture again over it in soft greys, each area multiplied by its paint (so the scales and the
 * shine stay), clipped to her tail; glittered areas twinkle. Lives in her container, right over her tail layer.
 */
export function paintMomTail(scene: Phaser.Scene, mom: Mom, mark: TailMark) {
  const Y0 = 470;
  const H = 330;
  const key = `mom-tail-paint-${scene.sys.settings.key}`;
  if (scene.textures.exists(key)) scene.textures.remove(key);
  const tex = scene.textures.createCanvas(key, 800, H);
  if (!tex) return;
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => scene.textures.exists(key) && scene.textures.remove(key));
  const g = tex.context;
  const src = scene.textures.get('mom-mer-tail').getSourceImage() as CanvasImageSource;
  const body = new Path2D(MOM_TAIL_BODY);
  const areas = [...MOM_TAIL_AREAS.map((d) => ({ d, lobe: 0 })), { d: MOM_LOBES.left, lobe: 1 }, { d: MOM_LOBES.right, lobe: 1 }];
  const grey = 'filter' in g;
  const clipTo = (a: (typeof areas)[number]) => {
    if (a.lobe) {
      g.translate(MOM_LOBES.at.x, MOM_LOBES.at.y);
      g.rotate((MOM_LOBES.angle * Math.PI) / 180);
      g.clip(new Path2D(a.d));
      g.rotate((-MOM_LOBES.angle * Math.PI) / 180);
      g.translate(-MOM_LOBES.at.x, -MOM_LOBES.at.y);
    } else {
      g.clip(body);
      g.clip(new Path2D(a.d));
    }
  };
  areas.forEach((a, i) => {
    const f = mark.fills[i];
    if (!f) return;
    g.save();
    g.setTransform(1, 0, 0, 1, 0, -Y0);
    clipTo(a);
    if (grey) g.filter = 'grayscale(1) brightness(1.55) contrast(0.85)';
    g.drawImage(src, 0, 0, 800, 800);
    g.filter = 'none';
    g.globalCompositeOperation = grey ? 'multiply' : 'source-atop';
    g.globalAlpha = grey ? 1 : 0.8;
    g.fillStyle = SEA_PAINT_HEX[f];
    g.fillRect(0, 0, 800, 800);
    g.globalAlpha = 1;
    // (only where her tail is: the paint never spills onto the water)
    g.globalCompositeOperation = 'destination-in';
    g.drawImage(src, 0, 0, 800, 800);
    g.restore();
  });
  tex.refresh();
  const s = mom.s;
  const img = new Phaser.GameObjects.Image(scene, (0 - 400) * s, (Y0 - 800) * s, key).setOrigin(0, 0).setScale(s);
  mom.box.addAt(img, 1);
  // the glitter she rubbed on: a twinkle or two on those parts of Mom's tail
  areas.forEach((a, i) => {
    if (!mark.glitter[i]) return;
    const probe = tex.context;
    for (let t = 0, made = 0; t < 60 && made < 2; t++) {
      const x = Phaser.Math.Between(20, 780);
      const y = Phaser.Math.Between(Y0, 800);
      probe.save();
      probe.setTransform(1, 0, 0, 1, 0, 0);
      let inside: boolean;
      if (a.lobe) {
        // (the point in the lobe's own frame: back through her fluke's turn)
        const ang = (-MOM_LOBES.angle * Math.PI) / 180;
        const dx = x - MOM_LOBES.at.x;
        const dy = y - MOM_LOBES.at.y;
        inside = probe.isPointInPath(new Path2D(a.d), dx * Math.cos(ang) - dy * Math.sin(ang), dx * Math.sin(ang) + dy * Math.cos(ang));
      } else inside = probe.isPointInPath(body, x, y) && probe.isPointInPath(new Path2D(a.d), x, y);
      probe.restore();
      if (!inside) continue;
      made++;
      const sp = new Phaser.GameObjects.Image(scene, (x - 400) * s, (y - 800) * s, 'fx-sparkle').setScale((30 * s) / 80).setTint(made % 2 ? 0xffffff : 0xfff4b8);
      mom.box.addAt(sp, 2);
      scene.tweens.add({ targets: sp, alpha: { from: 1, to: 0.3 }, scale: { from: (34 * s) / 80, to: (18 * s) / 80 }, angle: 45, duration: 1100 + made * 300, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }
  });
}
