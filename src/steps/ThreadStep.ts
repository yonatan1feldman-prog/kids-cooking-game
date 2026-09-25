import Phaser from 'phaser';
import { ART, IMAGES, type ImageKey } from '../core/assets';
import { voice, type VoiceKey } from '../core/audio';
import { boing, burst, stars } from '../core/fx';
import type { HandMotion } from '../core/hand';
import { sfx } from '../core/sfx';
import { TUNING } from '../core/tuning';
import type { ThreadParams } from '../recipes/types';
import { MADE_KEY, snapshotTexture } from './Dish';
import { Step } from './Step';
import { binIcon, binKey, makeBin, moveBin, setBinVisible } from './ToppingBin';

type Mode = ThreadParams['rounds'][number];

interface Bin {
  key: string;
  name?: VoiceKey;
  x: number;
  y: number;
  bin: Phaser.GameObjects.Image;
  /** Half the bin's drawn size: the touch area reaches BIN_REACH beyond it. */
  half: number;
}

/** One skewer lying on the tray: its stick and the pieces on it, left to right. */
interface Row {
  y: number;
  stick: Phaser.GameObjects.Image;
  pieces: Phaser.GameObjects.Image[];
  keys: string[];
}

/** How far (x k) a bin's touch area reaches beyond its drawing (as in decorating: stage.ts keeps that margin free). */
const BIN_REACH = 30;
/** A piece being dragged is a bit bigger and above the finger, so it stays visible. */
const LIFT = 1.2;
const LIFT_UP = 90;
/** A finger that moves less than this (x k) before lifting is a tap: the piece threads itself. */
const TAP_SLOP = 30;

/** True if the sequence repeats a unit of 2 or more different things at least once and a bit (ABABA, ABCAB). */
export function isPattern(keys: string[]) {
  if (new Set(keys).size < 2) return false;
  for (let p = 2; p <= keys.length - 2; p++) if (keys.every((k, i) => k === keys[i % p])) return true;
  return false;
}

/**
 * Thread (the fruit skewers; params in recipes/types.ts `ThreadParams`). The recipe's tray (its board) lies in the
 * middle; the bins of what she chose and cut wait on the left. One skewer per round, each on its own row of the tray:
 * - 'copy': Mom's own skewer lies on the top row (AB AB A of her first two fruits); when a piece she threads matches the
 *   one above it, Mom's piece hops and sparkles (one-to-one matching, never a "no").
 * - 'extend': Mom's hand threads the first `given` (ABC), then "What comes next?".
 * - 'free': "Now make your very own!".
 * A tap on a bin threads its fruit: the piece flies to the stick's point and slides along to the next free place. A drag
 * from a bin let go near the stick does the same; let go elsewhere, it floats back. Mom says each fruit's name as it
 * lands, so the sequence is heard. Whatever she makes is fine: a skewer that follows the pattern gets `sameLine` /
 * `patternLine`, any other one `newLine`. Nothing is taken off, nothing counted. At the end each skewer becomes its own
 * picture for sharing (`run.pieces`) and the tray with all of them the photo's (MADE_KEY).
 */
export class ThreadStep extends Step<ThreadParams> {
  private bins: Bin[] = [];
  private k = 1;
  private round = -1;
  private mode: Mode = 'free';
  /** What the pattern says for each place of the current skewer (Mom's model; for 'free' only a suggestion for help). */
  private model: string[] = [];
  private row?: Row;
  private modelRow?: Row;
  private rows: Row[] = [];
  /** Places of the current skewer already taken (the flying pieces too). */
  private reserved = 0;
  private landed = 0;
  private held?: { img: Phaser.GameObjects.Image; bin: Bin; x0: number; y0: number; moved: boolean };
  /** Mom is threading or the skewer is done: input waits. */
  private busy = false;
  private helping = false;
  private helpCarry?: Phaser.GameObjects.Image;
  private finishing = false;

  private get tray() {
    return { x: this.ctx.stage.dishHome.x, y: this.ctx.stage.dishHome.y, s: this.k };
  }

  start() {
    const P = this.params;
    this.k = this.layout.k;
    this.stepLine = P.line;
    this.workspace('dish', 450);

    // The bins of what she chose (her prep steps filled them); from a dev jump, fresh ones.
    const chosen = this.ctx.run.chosen.length ? this.ctx.run.chosen.map((o) => ({ topping: o.topping, name: o.name })) : P.fallback;
    const n = chosen.length;
    const binScale = this.ctx.stage.binScale(n);
    chosen.forEach((c, i) => {
      const { x, y } = this.ctx.stage.bin(i, n);
      const kept = this.adopt(binKey(c.topping));
      const icon = kept && binIcon(kept);
      let bin: Phaser.GameObjects.Image;
      if (kept && icon) {
        bin = kept;
        this.own(icon);
        setBinVisible(kept, true);
        kept.setDepth(20);
        icon.setDepth(20.1);
        moveBin(this.scene, kept, x, y, binScale, 500);
        this.scene.time.delayedCall(520, () => kept.active && boing(this.scene, kept, 0.1));
      } else {
        bin = this.own(makeBin(this.scene, P.bin, c.topping as ImageKey, x, y, binScale));
        const ic = binIcon(bin);
        if (ic) this.own(ic);
        for (const o of [bin, ic]) if (o) o.setAlpha(0);
        this.scene.tweens.add({ targets: [bin, ic].filter(Boolean), alpha: 1, duration: 350, delay: i * 80 });
      }
      this.bins.push({ key: c.topping, name: c.name, x, y, bin, half: (IMAGES[P.bin].size[0] * binScale) / 2 });
    });

    const first = P.rounds[0];
    if (first === 'copy') this.moreLines = [P.copyLine];
    else if (first === 'free') this.moreLines = [P.ownLine];

    this.onDown((p) => {
      if (this.busy || this.held) return;
      const b = this.binAt(p.worldX, p.worldY);
      if (!b) return;
      this.poke();
      sfx(this.scene, 'tap');
      boing(this.scene, b.bin, 0.12);
      const img = this.scene.add.image(p.worldX, p.worldY - LIFT_UP * this.k, b.key).setDepth(40).setScale(this.pieceScale * 0.8);
      this.scene.tweens.add({ targets: img, scale: this.pieceScale * LIFT, duration: 150, ease: 'Back.easeOut' });
      this.held = { img, bin: b, x0: p.worldX, y0: p.worldY, moved: false };
    });
    this.onMove((p) => {
      const h = this.held;
      if (!h) return;
      h.img.setPosition(p.worldX, p.worldY - LIFT_UP * this.k);
      if (Phaser.Math.Distance.Between(p.worldX, p.worldY, h.x0, h.y0) > TAP_SLOP * this.k) h.moved = true;
      this.poke();
    });
    this.onUp((_p, cancelled) => {
      const h = this.held;
      if (!h) return;
      this.held = undefined;
      if (cancelled || this.busy || !this.row || this.reserved >= P.pieces) return this.sendBack(h.img, h.bin);
      if (!h.moved || this.nearStick(h.img.x, h.img.y)) {
        this.hit();
        this.thread(h.bin, h.img);
        return;
      }
      this.miss();
      this.sendBack(h.img, h.bin);
    });

    this.nextRound(true);
  }

  /** A piece on the tray, at the tray's scale. */
  private get pieceScale() {
    return ART.skewers.piece * this.tray.s;
  }

  private rowY(r: number) {
    return this.tray.y + ART.skewers.rows[r] * this.tray.s;
  }

  private slotX(i: number) {
    return this.tray.x + (ART.skewers.slot0 + i * ART.skewers.pitch) * this.tray.s;
  }

  /** The stick's point on a row (where every piece goes on). */
  private tipX() {
    const A = ART.skewers;
    return this.tray.x + (A.foot + (A.stickFoot - A.stickTip) * A.stickScale) * this.tray.s;
  }

  /** A new stick lying on row r, point to the right (the art stands with its point up: turned 90 degrees). */
  private makeRow(r: number): Row {
    const A = ART.skewers;
    const s = A.stickScale * this.tray.s;
    const [, h] = IMAGES[this.params.stick].size;
    const cx = this.tray.x + A.foot * this.tray.s + (A.stickFoot - h / 2) * s;
    const y = this.rowY(r);
    const stick = this.own(this.scene.add.image(cx, y, this.params.stick).setAngle(90).setScale(s).setDepth(5));
    stick.setAlpha(0).setX(cx - 60 * this.k);
    this.scene.tweens.add({ targets: stick, alpha: 1, x: cx, duration: 350, ease: 'Sine.easeOut' });
    return { y, stick, pieces: [], keys: [] };
  }

  private addPiece(row: Row, i: number, key: string) {
    const img = this.own(this.scene.add.image(this.slotX(i), row.y, key).setScale(this.pieceScale).setDepth(6 + i * 0.01));
    row.pieces[i] = img;
    row.keys[i] = key;
    return img;
  }

  /** The fruits in the order she picked them (at least one), for the patterns. */
  private get fruits() {
    return this.bins.map((b) => b.key);
  }

  private patternFor(mode: Mode) {
    const f = this.fruits;
    const a = f[0];
    const b = f[1] ?? a;
    const c = f[2] ?? b;
    const unit = mode === 'extend' ? (c !== b ? [a, b, c] : [a, a, b]) : [a, b];
    return Array.from({ length: this.params.pieces }, (_, i) => unit[i % unit.length]);
  }

  private nextRound(first = false) {
    const P = this.params;
    this.round++;
    if (this.round >= P.rounds.length) return this.finish();
    this.mode = P.rounds[this.round];
    this.model = this.patternFor(this.mode);
    this.reserved = 0;
    this.landed = 0;
    this.row = this.makeRow(this.round + 1);
    this.rows.push(this.row);
    if (this.mode === 'copy') {
      // Mom's own skewer lies above hers, its pieces popping on one by one.
      if (!this.modelRow) {
        this.modelRow = this.makeRow(0);
        this.model.forEach((key, i) =>
          this.scene.time.delayedCall(300 + i * 140, () => {
            if (!this.modelRow || this.aborted) return;
            const img = this.addPiece(this.modelRow, i, key).setScale(0);
            this.scene.tweens.add({ targets: img, scale: this.pieceScale, duration: 260, ease: 'Back.easeOut' });
            sfx(this.scene, 'pop', { volume: 0.4, minGapMs: 60 });
          }),
        );
      }
      if (!first) voice.say(P.copyLine, { ttlMs: 4000 });
      this.busy = false;
      this.setIdle(true);
    } else if (this.mode === 'extend') {
      this.momThreads();
    } else {
      if (!first) voice.say(P.ownLine, { ttlMs: 4000 });
      this.busy = false;
      this.setIdle(true);
    }
  }

  /** 'extend': Mom's hand carries the first `given` pieces over herself, then asks what comes next. */
  private momThreads() {
    const P = this.params;
    this.busy = true;
    this.setIdle(false);
    const given = Math.min(P.given, P.pieces - 1);
    const each = TUNING.help.threadEveryMs;
    this.hand.follow('grab', () => (this.helpCarry?.active ? { x: this.helpCarry.x, y: this.helpCarry.y } : null));
    for (let i = 0; i < given; i++) {
      this.scene.time.delayedCall(500 + i * (each + 300), () => {
        if (this.aborted) return;
        const b = this.bins.find((x) => x.key === this.model[i]) ?? this.bins[0];
        this.thread(b, undefined, true);
      });
    }
    this.scene.time.delayedCall(500 + given * (each + 300) + 300, () => {
      if (this.aborted) return;
      this.hand.stop();
      this.helpCarry = undefined;
      voice.say(P.nextLine, { ttlMs: 4000 });
      this.busy = false;
      this.setIdle(true);
    });
  }

  /** Forgiving hit test: the nearest bin whose square reaches the finger (BIN_REACH beyond its drawing). */
  private binAt(x: number, y: number) {
    let best: Bin | undefined;
    let bestD = Infinity;
    for (const b of this.bins) {
      const r = b.half + BIN_REACH * this.k;
      if (Math.abs(x - b.x) > r || Math.abs(y - b.y) > r) continue;
      const d = Phaser.Math.Distance.Between(x, y, b.x, b.y);
      if (d < bestD) {
        bestD = d;
        best = b;
      }
    }
    return best;
  }

  /** A dragged piece let go near the current stick (anywhere along it, generously above or below). */
  private nearStick(x: number, y: number) {
    if (!this.row) return false;
    const reach = this.params.reach * this.k;
    const x0 = this.tray.x + ART.skewers.foot * this.tray.s - reach;
    return x > x0 && x < this.tipX() + reach && Math.abs(y - this.row.y) < reach;
  }

  /** The next piece of the current skewer: flies to the stick's point, then slides along to its place. */
  private thread(b: Bin, carried?: Phaser.GameObjects.Image, byMom = false) {
    const row = this.row;
    if (!row || this.reserved >= this.params.pieces) {
      carried?.destroy();
      return;
    }
    const i = this.reserved++;
    const img = carried ?? this.own(this.scene.add.image(b.x, b.y - 8 * this.k, b.key).setDepth(40).setScale(this.pieceScale * 0.9));
    if (carried) this.own(carried);
    if (byMom || this.helping) this.helpCarry = img;
    const tip = { x: this.tipX() + 20 * this.k, y: row.y - 70 * this.k };
    this.scene.tweens.chain({
      targets: img,
      tweens: [
        { x: tip.x, y: tip.y, scale: this.pieceScale, duration: byMom || this.helping ? 420 : 240, ease: 'Sine.easeOut' },
        { x: this.slotX(i), y: row.y, duration: 230, ease: 'Quad.easeOut' },
      ],
      onComplete: () => this.land(row, i, b, img),
    });
    sfx(this.scene, 'whoosh', { volume: 0.3, minGapMs: 80 });
  }

  private land(row: Row, i: number, b: Bin, img: Phaser.GameObjects.Image) {
    if (this.aborted || row !== this.row) return;
    img.setDepth(6 + i * 0.01).setScale(this.pieceScale);
    row.pieces[i] = img;
    row.keys[i] = b.key;
    sfx(this.scene, this.params.sound, { volume: 0.8, minGapMs: 50 });
    boing(this.scene, img, 0.2);
    burst(this.scene, img.x, img.y, { count: 6, size: 16 * this.k, tint: [0xffffff, 0xffcb47], speed: 260 * this.k, gravityY: 400 });
    if (b.name) voice.say(b.name, { group: 'name', ttlMs: 2500 });
    // Copying: the piece above lights up when hers matches it.
    const above = this.modelRow?.pieces[i];
    if (this.mode === 'copy' && above?.active && this.model[i] === b.key) {
      boing(this.scene, above, 0.3);
      stars(this.scene, above.x, above.y, 4, 34 * this.k);
    }
    this.landed++;
    if (!this.helping) this.poke();
    if (this.landed >= this.params.pieces) this.skewerDone();
  }

  /** A skewer is full: what Mom says about it, a little wave along it, then the next one. */
  private skewerDone() {
    const P = this.params;
    const row = this.row!;
    this.busy = true;
    this.setIdle(false);
    if (this.held) {
      this.sendBack(this.held.img, this.held.bin);
      this.held = undefined;
    }
    if (this.helping) {
      this.helping = false;
      this.hand.stop();
      this.helpCarry = undefined;
      this.resumeAfterAuto();
    }
    const same = row.keys.every((k, i) => k === this.model[i]);
    let line: VoiceKey | null = null;
    if (this.mode === 'copy') line = same ? P.sameLine : P.newLine;
    else if (this.mode === 'extend') line = same ? P.patternLine : P.newLine;
    else line = isPattern(row.keys) ? P.patternLine : null;
    this.scene.time.delayedCall(350, () => {
      if (this.aborted) return;
      if (line) voice.say(line, { ttlMs: 4000 });
      row.pieces.forEach((pc, i) =>
        this.scene.tweens.add({ targets: pc, y: row.y - 22 * this.k, duration: 170, delay: i * 70, yoyo: true, ease: 'Quad.easeOut' }),
      );
      if (line && line !== P.newLine) stars(this.scene, this.tray.x, row.y, 8, 50 * this.k);
      else sfx(this.scene, 'star', { volume: 0.5 });
    });
    this.scene.time.delayedCall(350 + P.pauseMs + 800, () => !this.aborted && this.nextRound());
  }

  /** Gently back to its bin (also when the touch was lost mid-drag). */
  private sendBack(img: Phaser.GameObjects.Image, b: Bin) {
    sfx(this.scene, 'whoosh', { volume: 0.4 });
    this.scene.tweens.add({ targets: img, x: b.x, y: b.y, scale: this.pieceScale * 0.6, alpha: 0, duration: 380, ease: 'Sine.easeInOut', onComplete: () => img.destroy() });
  }

  /** All skewers done: each becomes its own picture (for sharing) and the tray with all of them the photo's. */
  private finish() {
    if (this.finishing) return;
    this.finishing = true;
    this.busy = true;
    this.setIdle(false);
    this.capture().then(() => !this.aborted && this.complete());
  }

  private async capture() {
    const { x: tx, s } = this.tray;
    const home = this.ctx.stage.dishHome;
    const copy = (o: Phaser.GameObjects.Image, dx: number, dy: number) =>
      new Phaser.GameObjects.Image(this.scene, dx, dy, o.texture.key).setScale(o.scaleX, o.scaleY).setAngle(o.angle);
    const rowObjs = (r: Row, dy: number) => [copy(r.stick, r.stick.x - tx, dy), ...r.pieces.filter((p) => p?.active).map((p) => copy(p, p.x - tx, dy + p.y - r.y))];
    const len = Math.ceil(IMAGES[this.params.stick].size[1] * ART.skewers.stickScale * s + 24 * this.k);
    const pieces: NonNullable<typeof this.ctx.run.pieces> = [];
    for (const [i, r] of this.rows.entries()) {
      const key = `skewer-made-${i}`;
      const ok = await snapshotTexture(this.scene, key, len, rowObjs(r, 0));
      if (ok) pieces.push({ key, x: tx - home.x, y: r.y - home.y, scale: 1, tint: 0xffffff, contents: [...r.keys] });
    }
    this.ctx.run.pieces = pieces;
    // The photo: the tray with Mom's skewer and hers.
    const board = this.ctx.board;
    const tray = new Phaser.GameObjects.Image(this.scene, 0, 0, board.texture.key).setScale(board.scaleX);
    const all = [tray, ...[this.modelRow, ...this.rows].filter((r): r is Row => !!r).flatMap((r) => rowObjs(r, r.y - this.tray.y))];
    if (this.scene.textures.exists(MADE_KEY)) this.scene.textures.remove(MADE_KEY);
    const ok = await snapshotTexture(this.scene, MADE_KEY, Math.ceil(IMAGES['skewer-tray'].size[0] * board.scaleX * 1.02), all);
    if (!ok) console.warn('[thread] capture failed: the photo shows the kitchen only');
  }

  /** What the pattern says comes next (for 'free': the next of her fruits in turn). */
  private expectedBin() {
    const key = this.mode === 'free' ? this.fruits[this.reserved % this.fruits.length] : this.model[this.reserved];
    return this.bins.find((b) => b.key === key) ?? this.bins[0];
  }

  /** Mom carries a see-through piece from the bin the pattern needs to its place on the stick. */
  protected demo(): HandMotion | null {
    if (this.busy || !this.row || this.reserved >= this.params.pieces || !this.bins.length) return null;
    const b = this.expectedBin();
    const k = this.k;
    const tip = { x: this.tipX() + 20 * k, y: this.row.y - 70 * k };
    const to = { x: this.slotX(this.reserved), y: this.row.y };
    return {
      kind: 'grab',
      keys: [
        { x: b.x, y: b.y, t: 0 },
        { x: b.x, y: b.y, t: 350, press: true },
        { x: tip.x, y: tip.y, t: 1500 },
        { x: to.x, y: to.y, t: 1900 },
        { x: to.x, y: to.y, t: 2150, press: true },
        { x: to.x + 30 * k, y: to.y - 30 * k, t: 2400 },
      ],
      props: [{ key: b.key, scale: this.pieceScale, alpha: 0.6, fadeFrom: 1950 }],
      glow: { x: b.x, y: b.y },
    };
  }

  /** Mom helps: her hand carries the pieces the pattern needs until this skewer is full; the next one is hers again. */
  protected autoFinish() {
    if (this.held) {
      this.held.img.destroy();
      this.held = undefined;
    }
    if (this.busy || !this.row) return this.resumeAfterAuto();
    this.helping = true;
    this.hand.follow('grab', () => (this.helpCarry?.active ? { x: this.helpCarry.x, y: this.helpCarry.y } : null));
    const left = this.params.pieces - this.reserved;
    for (let i = 0; i < left; i++) {
      this.scene.time.delayedCall(300 + i * TUNING.help.threadEveryMs, () => {
        if (this.aborted || !this.helping) return;
        this.thread(this.expectedBin());
      });
    }
  }
}
