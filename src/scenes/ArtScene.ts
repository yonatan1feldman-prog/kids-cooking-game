import Phaser from 'phaser';
import { keepPhoto } from '../core/album';
import { ART, FX_SOFT } from '../core/assets';
import { setWallDrawing } from '../core/artWall';
import {
  BUTTERFLY_FEELERS, COLOUR, DOTS, INK_CSS, MIRROR, PAINT, POTS, RAINBOW, SHEET_H, SHEET_W, STAMP, STAMP_CARD, STAMP_PATTERNS, STAMP_ROW,
  STAMP_SCENES, STAMPS, STEAM, TRACE, lengthOf, resample, type Alive, type ColourPic, type DotsPic, type Hidden, type MirrorPic, type Paint,
  type Pt, type StampId, type StampSlot, type TracePic,
} from '../core/artPictures';
import { countKey, music, voice, type NameKey, type Song, type VoiceKey } from '../core/audio';
import { boing, burst, stars } from '../core/fx';
import { tapMotion, type HandKey, type HandMotion } from '../core/hand';
import { confetti } from '../core/juice';
import { addBackground } from '../core/layout';
import { sfx } from '../core/sfx';
import { TUNING } from '../core/tuning';
import { iconButton } from '../core/ui';
import { MiniGame, visits, type P } from './MiniGame';

const T = TUNING.art;
/** The longest a finished picture may take to come alive and go back to the easel wall (normally about 6-9 s). */
const ALIVE_MAX_MS = 16000;
export type Kind = 'trace' | 'dots' | 'colour' | 'mirror' | 'steam' | 'stamps';
const KINDS: Kind[] = ['trace', 'dots', 'colour', 'mirror', 'steam', 'stamps'];
type Brush = Paint | 'rainbow';
/** A rising scale for the notes she hears as she goes (semitones over C: two octaves of the major scale). */
const SCALE = [0, 2, 4, 5, 7, 9, 11, 12, 14, 16, 17, 19, 21, 23, 24];
/** How far p is from the segment a-b (any units). */
function segDist(p: Pt, a: Pt, b: Pt) {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const l2 = dx * dx + dy * dy;
  const t = l2 ? Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / l2)) : 0;
  return Math.hypot(p[0] - (a[0] + dx * t), p[1] - (a[1] + dy * t));
}
const note = (i: number) => Math.pow(2, SCALE[Math.min(SCALE.length - 1, i % SCALE.length)] / 12) * 0.75;

/** Her last colour (the next picture starts with it). */
let lastBrush: Brush = 'red';
/** The picture of this visit: the visits go round the kind's pictures (cooking.runs.art-<kind>), so a fifth visit is new. */
const byVisit = <X>(list: readonly X[], run: number): X => list[((run % list.length) + list.length) % list.length];
/** The direction of a polyline at its point i (a unit vector, the way its points go). */
function tangent(pts: Pt[], i: number, closed: boolean): Pt {
  const n = pts.length;
  const a = pts[closed ? (i - 1 + n) % n : Math.max(0, i - 1)];
  const b = pts[closed ? (i + 1) % n : Math.min(n - 1, i + 1)];
  const l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
  return [(b[0] - a[0]) / l, (b[1] - a[1]) / l];
}

interface Layer {
  key: string;
  tex: Phaser.Textures.CanvasTexture;
  g: CanvasRenderingContext2D;
  img: Phaser.GameObjects.Image;
  dirty: boolean;
}
interface Pot {
  brush: Brush;
  img: Phaser.GameObjects.Image;
  x: number;
  y: number;
}
interface Checkpoint {
  at: Pt;
  lit: boolean;
  part: number;
}
interface DotView {
  at: Pt;
  box: Phaser.GameObjects.Container;
  joined: boolean;
}
interface StampView {
  id: StampId;
  img: Phaser.GameObjects.Image;
  x: number;
  y: number;
}
interface SlotView {
  slot: StampSlot;
  /** What was stamped on it (null: still empty). */
  got: StampId | null;
}
interface AreaView {
  path: Path2D;
  mom: Paint;
  fill: Paint | null;
  /** A point inside it (where Mom's finger taps), its middle, and how far the paint has to spread. */
  hint: Pt;
  reach: number;
  told: boolean;
}

/**
 * The art corner (research/drawing-stages-spec.md): an easel wall with six picture cards, one per kind of drawing.
 * A tap picks one; the picture is drawn, comes alive, goes into the memory book and onto the kitchen cabinet, and then
 * it is the easel wall again (the game never starts the next one by itself; the home button goes home).
 * - trace: a dotted outline; ink near it glows and lights its checkpoints (any order, any direction, any strokes).
 * - dots: tap (or drag through) the dots in order; level 1 the next one glows, level 2 each carries its dice pips.
 * - colour: pick a pot, tap an area and the paint spreads inside it; level 2 copies Mom's little picture.
 * - mirror: free drawing on a butterfly (level 2 a party plate, both ways), every stroke mirrored at once.
 * - steam: wipe the fogged window to find what is outside; level 2 Mom asks for one thing at a time, the fog creeps back.
 * - stamps: pick a stamp, tap the sheet: it lands on the nearest outline of its shape; level 2 a row of six circles to
 *   stamp with Mom's pattern (her card on the sheet; a stamp off it stays, her card's one hops: "What comes next?").
 * Challenge round: each kind has more pictures and the visits go round them (cooking.runs.art-<kind>); level 2 trace
 * follows its arrows from a green start dot, level 2 dots are found by ear ("Find... four!").
 * Nothing is ever wrong: a stroke off the line still draws, a wrong dot only wiggles, a wrong colour stays.
 */
export class ArtScene extends MiniGame {
  protected readonly id = 'art';
  /** The art song (marimba, glockenspiel); its party layer is on for the whole coming alive of a finished picture. */
  protected readonly song: Song = 'art';
  protected readonly waiting = ['pick', 'draw'] as const;
  private back = false;
  private kind: Kind | null = null;
  private cards: { kind: Kind; img: Phaser.GameObjects.Image }[] = [];
  // the sheet, in world units: top-left, size, and world units per sheet unit
  private sheet = { x: 0, y: 0, w: 0, h: 0, u: 1 };
  private box!: Phaser.GameObjects.Container;
  private layers: Layer[] = [];
  private pots: Pot[] = [];
  private potRing?: Phaser.GameObjects.Image;
  private brush: Brush = 'red';
  private pen: { last: P | null; dist: number; spark: number; inked: boolean } | null = null;
  private grid = { w: 24, h: 19, on: new Uint8Array(0) };
  private doneBtn?: Phaser.GameObjects.Image;
  private finished = false;
  /** Ms since the picture finished (the way back to the easel wall has a safety net), and since the last check. */
  private aliveFor = 0;
  private checkIn = 0;
  private restarting = false;
  private dotsLast: P | null = null;
  // trace
  // (level 2, `dir`: each part is traced the arrows' way from its green start dot; `front` its next checkpoint to light,
  // `wrongRun` the wrong-way strokes in a row, `told` "Follow the arrows!" said)
  private trace?: { pic: TracePic; dense: Pt[][]; cps: Checkpoint[]; band: number; base: Layer; ink: Layer; dir: boolean; front: number[]; wrongRun: number; told: boolean };
  // dots
  private dots?: { pic: DotsPic; views: DotView[]; cur: number; next: number; misses: number; asked: number; glow: Phaser.GameObjects.Image; live: Phaser.GameObjects.Graphics; ink: Layer; base: Layer };
  // colour
  private colour?: { pic: ColourPic; areas: AreaView[]; fill: Layer; lines: Layer; anim: { i: number; to: Paint; at: Pt; t: number } | null; model?: Phaser.GameObjects.Image };
  // mirror
  private mirror?: { pic: MirrorPic; plate: boolean; clip: Path2D; inside: number; base: Layer; ink: Layer; top: Layer; shown: boolean };
  // steam
  private steam?: { flip: boolean; fog: Layer; things: { h: Hidden; img: Phaser.GameObjects.Image; found: boolean }[]; level: Float32Array; at: Float64Array; targets: Hidden[]; target: number; refog: number; clear: boolean };

  // stamps: the four stamps in the pot column, the outlines on the sheet; level 2 Mom's pattern (her card on the sheet)
  private stamps?: { stamps: StampView[]; sel: StampId; slots: SlotView[]; pattern: StampId[] | null; base: Layer; ink: Layer; ring: Phaser.GameObjects.Image; card: Phaser.GameObjects.Image[]; busy: boolean; misses: number };

  constructor() {
    super('Art');
  }

  init(data?: { back?: boolean }) {
    super.init();
    this.back = !!data?.back;
    this.kind = null;
    this.cards = [];
    this.layers = [];
    this.pots = [];
    this.pen = null;
    this.doneBtn = undefined;
    this.potRing = undefined;
    this.finished = this.restarting = false;
    this.aliveFor = this.checkIn = 0;
    this.trace = this.dots = this.colour = this.mirror = this.steam = this.stamps = undefined;
    Object.assign(this.shown, { kind: null, pic: null, progress: 0, strokes: 0 });
  }

  protected build() {
    addBackground(this, this.L);
    this.box = this.add.container(0, 0).setDepth(5);
  }

  protected ready() {
    this.showCards();
  }

  protected shutdown() {
    // (the box first: every image drawn from a layer's texture is in it, also the butterfly's two wings; a texture is
    // never removed under an image the renderer may still draw, as when the home button leaves mid-frame)
    if (this.box?.active) this.box.destroy();
    for (const l of this.layers) {
      l.img.destroy();
      if (this.textures.exists(l.key)) this.textures.remove(l.key);
    }
    this.layers = [];
  }

  protected hintAfter() {
    return this.kind === 'mirror' && this.phase === 'draw' ? T.freeHintMs : super.hintAfter();
  }

  protected helpAfter() {
    return this.kind === 'mirror' && this.phase === 'draw' ? T.freeHelpMs : super.helpAfter();
  }

  // ---------------------------------------------------------------- the easel wall (the five cards)

  /** Where the six cards sit: three on top, three below, right of the home button, left of Mom's face, Pipa and her hand. */
  private cardSpots() {
    const L = this.L;
    const S = this.S;
    const k = L.k;
    const homeR = S.home.x - L.m;
    const petLeft = S.pet ? S.pet.x - 270 * S.pet.scale : Infinity;
    const x0 = L.m + 2 * homeR + 20 * k;
    const x1 = Math.min(S.momFace.x0, petLeft, S.momArm.x0) - 20 * k;
    const y0 = L.Y(70);
    const y1 = L.Y(980);
    const w = (x1 - x0) / 3;
    const h = (y1 - y0) / 2;
    const scale = Math.min(1.25 * k, (w - 30 * k) / 300, (h - 30 * k) / 300);
    return KINDS.map((_, i) => {
      const row = i < 3 ? 0 : 1;
      // (three and three; an odd last row would sit in the gaps)
      const col = row === 0 ? i : i - 3 + (6 - KINDS.length) / 2;
      return { x: x0 + w * (col + 0.5), y: y0 + h * (row + 0.5), scale };
    });
  }

  private showCards() {
    const spots = this.cardSpots();
    this.cards = KINDS.map((kind, i) => {
      const s = spots[i];
      const img = this.add.image(s.x, s.y, `art-pick-${kind}`).setScale(s.scale).setDepth(20).setAlpha(0);
      this.tweens.add({ targets: img, alpha: 1, duration: 300, delay: i * 60 });
      return { kind, img };
    });
    this.begin('pick', this.back ? null : 'vo-art-what');
  }

  private pickCard(kind: Kind) {
    const c = this.cards.find((q) => q.kind === kind)!;
    sfx(this, 'pop');
    stars(this, c.img.x, c.img.y, 10, 60 * this.L.k);
    this.setPhase('intro');
    for (const q of this.cards) {
      this.tweens.killTweensOf(q.img);
      this.tweens.add({ targets: q.img, alpha: 0, scale: q.img.scale * (q === c ? 1.15 : 0.8), duration: 260, onComplete: () => q.img.destroy() });
    }
    this.cards = [];
    this.time.delayedCall(300, () => this.start(kind));
  }

  // ---------------------------------------------------------------- a picture starts

  private start(kind: Kind) {
    this.kind = kind;
    this.shown.kind = kind;
    const run = visits(`art-${kind}`);
    this.first = run === 0;
    this.layout(kind);
    if (kind !== 'steam' && kind !== 'stamps') this.makePots(kind);
    const lvl = this.level - 1;
    let line: VoiceKey = 'vo-trace';
    if (kind === 'trace') this.startTrace(byVisit(TRACE[lvl], run));
    if (kind === 'dots') (this.startDots(byVisit(DOTS[lvl], run)), (line = 'vo-dots'));
    if (kind === 'colour') (this.startColour(byVisit(COLOUR[lvl], run)), (line = this.level === 2 ? 'vo-colour-copy' : 'vo-colour'));
    if (kind === 'mirror') (this.startMirror(byVisit(MIRROR[lvl], run)), (line = 'vo-mirror'));
    if (kind === 'steam') (this.startSteam(byVisit(STEAM, run)), (line = 'vo-steam'));
    if (kind === 'stamps') (this.startStamps(run), (line = 'vo-art-stamps'));
    this.begin('draw', line);
    if (kind === 'steam' && this.level === 2) this.time.delayedCall(3600, () => this.askNext());
    // (level 2 dots: after the line, Mom says the first number to find)
    if (kind === 'dots' && this.level === 2) this.askDot();
  }

  /** The sheet's place: between the pots and Mom (and Pipa), on the easel, as big as it fits (5:4). */
  private layout(kind: Kind) {
    const L = this.L;
    const S = this.S;
    const k = L.k;
    const petLeft = S.pet ? S.pet.x - 270 * S.pet.scale : Infinity;
    const ax0 = kind === 'steam' ? L.m + (S.home.x - L.m) * 2 + 30 * k : L.m + 440 * k;
    let ax1 = Math.min(S.momFace.x0, petLeft) - 20 * k;
    // (her pointing hand reaches left of her face, low: the sheet stays clear of it where it comes up into it)
    if (S.momArm.y0 < L.Y(940)) ax1 = Math.min(ax1, S.momArm.x0 - 20 * k);
    const E = ART.art.sheet;
    const top = L.Y(40);
    const bottom = L.Y(950);
    let w = Math.min(ax1 - ax0, ((bottom - top) * SHEET_W) / SHEET_H / (1 + (kind === 'steam' ? 0 : E.y / E.h)));
    if (kind === 'colour' && this.level === 2) w = Math.min(w, (ax1 - ax0) * 0.8);
    const h = (w * SHEET_H) / SHEET_W;
    const e = w / E.w;
    const x = kind === 'colour' && this.level === 2 ? ax0 : (ax0 + ax1) / 2 - w / 2;
    const easelTop = kind === 'steam' ? 0 : E.y * e;
    const y = Math.max(top + easelTop, (top + bottom) / 2 - h / 2 + easelTop / 2);
    this.sheet = { x, y, w, h, u: w / SHEET_W };
    if (kind !== 'steam') this.add.image(x - E.x * e, y - E.y * e, 'art-easel').setOrigin(0, 0).setScale(e).setDepth(3);
    this.box.setPosition(x, y);
    if (kind !== 'steam') {
      // the paper, a soft shadow under it
      const g = this.add.graphics();
      g.fillStyle(0x3a2216, 0.22).fillRoundedRect(4 * k, 6 * k, w, h, 8 * k);
      g.fillStyle(0xfffdf7, 1).fillRoundedRect(0, 0, w, h, 8 * k);
      this.box.add(g);
    }
    const gw = T.grid;
    this.grid = { w: gw, h: Math.round((gw * SHEET_H) / SHEET_W), on: new Uint8Array(gw * Math.round((gw * SHEET_H) / SHEET_W)) };
  }

  /** A drawing layer the size of the sheet (a canvas: strokes, fills, fog), in the sheet's box. */
  private layer(name: string): Layer {
    const key = `art-cv-${name}`;
    if (this.textures.exists(key)) this.textures.remove(key);
    const tex = this.textures.createCanvas(key, Math.max(2, Math.round(this.sheet.w)), Math.max(2, Math.round(this.sheet.h)))!;
    const g = tex.getContext();
    const img = this.add.image(0, 0, key).setOrigin(0, 0);
    this.box.add(img);
    const l = { key, tex, g, img, dirty: false };
    this.layers.push(l);
    return l;
  }

  /** Sheet units -> the layer's pixels, for drawing a picture. */
  private units(g: CanvasRenderingContext2D) {
    const u = this.sheet.u;
    g.setTransform(u, 0, 0, u, 0, 0);
  }

  private toSheet(at: P): Pt {
    return [(at.x - this.sheet.x) / this.sheet.u, (at.y - this.sheet.y) / this.sheet.u];
  }

  private toWorld(p: Pt): P {
    return { x: this.sheet.x + p[0] * this.sheet.u, y: this.sheet.y + p[1] * this.sheet.u };
  }

  private onSheet(at: P, pad = 0) {
    const s = this.sheet;
    return at.x > s.x - pad && at.x < s.x + s.w + pad && at.y > s.y - pad && at.y < s.y + s.h + pad;
  }

  // ---------------------------------------------------------------- the paint pots

  private makePots(kind: Kind) {
    const L = this.L;
    const S = this.S;
    const k = L.k;
    const list: Brush[] = [...POTS[this.level - 1]];
    if (kind === 'mirror') list.push('rainbow');
    if (!list.includes(lastBrush)) lastBrush = 'red';
    if (kind === 'colour' && lastBrush === 'rainbow') lastBrush = 'red';
    this.brush = lastBrush;
    const rows = Math.ceil(list.length / 2);
    const top = S.home.y + (S.home.x - L.m) + 16 * k;
    const bottom = L.Y(994) - 14 * k;
    const cell = Math.min(215 * k, (bottom - top) / rows);
    const scale = Math.min(0.85 * k, (cell - 8 * k) / 240);
    const colX = [L.m + 30 * k + 100 * k, L.m + 30 * k + 300 * k];
    this.pots = list.map((brush, i) => {
      const x = colX[i % 2];
      const y = bottom - cell * (rows - Math.floor(i / 2) - 0.5);
      const img = this.add.image(x, y, `art-pot-${brush}`).setScale(scale).setDepth(10);
      return { brush, img, x, y };
    });
    this.potRing = this.add.image(0, 0, FX_SOFT).setDepth(9).setScale((260 * k) / this.textures.getFrame(FX_SOFT).realWidth).setAlpha(0.8);
    this.selectPot(this.brush, false);
  }

  private selectPot(brush: Brush, say = true) {
    this.brush = brush;
    lastBrush = brush;
    const p = this.pots.find((q) => q.brush === brush);
    if (!p || !this.potRing) return;
    this.potRing.setPosition(p.x, p.y + 10 * this.L.k).setTint(brush === 'rainbow' ? 0xffffff : Phaser.Display.Color.HexStringToColor(PAINT[brush]).color);
    for (const q of this.pots) {
      this.tweens.killTweensOf(q.img);
      q.img.setY(q.y - (q === p ? 18 * this.L.k : 0));
    }
    if (!say) return;
    boing(this, p.img, 0.12);
    sfx(this, 'pop', { volume: 0.6 });
    if (brush !== 'rainbow') voice.say(`name-${brush}` as NameKey, { group: 'name', ttlMs: 2000, valid: () => this.scene.isActive() && !this.leaving });
  }

  private potAt(at: P): Pot | null {
    const r = 115 * this.L.k;
    let best: Pot | null = null;
    let bd = Infinity;
    for (const p of this.pots) {
      const d = Math.hypot(at.x - p.x, at.y - p.y);
      if (d < r && d < bd) (best = p), (bd = d);
    }
    return best;
  }

  private css(brush: Brush, dist = 0) {
    return brush === 'rainbow' ? RAINBOW[Math.floor(dist / 90) % RAINBOW.length] : PAINT[brush];
  }

  // ---------------------------------------------------------------- strokes and coverage

  /** Marks the coverage cells within r (sheet units) of p (sheet units); returns how many were new. */
  private cover(p: Pt, r: number) {
    const G = this.grid;
    const cw = SHEET_W / G.w;
    const ch = SHEET_H / G.h;
    let n = 0;
    const i0 = Math.max(0, Math.floor((p[0] - r) / cw));
    const i1 = Math.min(G.w - 1, Math.floor((p[0] + r) / cw));
    const j0 = Math.max(0, Math.floor((p[1] - r) / ch));
    const j1 = Math.min(G.h - 1, Math.floor((p[1] + r) / ch));
    for (let j = j0; j <= j1; j++) {
      for (let i = i0; i <= i1; i++) {
        const cx = (i + 0.5) * cw;
        const cy = (j + 0.5) * ch;
        if (Math.hypot(cx - p[0], cy - p[1]) > r + cw * 0.5) continue;
        if (!G.on[j * G.w + i]) (G.on[j * G.w + i] = 1), n++;
      }
    }
    return n;
  }

  private brushR() {
    return T.brushR * this.L.k;
  }

  /** One segment of crayon from a to b (sheet units) on a layer, in her colour: `glow` = on the line (trace). */
  private crayon(l: Layer, a: Pt, b: Pt, colour: string, opts: { glow?: boolean; thin?: boolean; clip?: Path2D; mirror?: 'x' | 'xy' } = {}) {
    const g = l.g;
    const u = this.sheet.u;
    const r = this.brushR() / u;
    const draw = (m: DOMMatrix) => {
      g.save();
      g.setTransform(m.multiply(new DOMMatrix([u, 0, 0, u, 0, 0])));
      g.setTransform(new DOMMatrix([u, 0, 0, u, 0, 0]).multiply(m));
      if (opts.clip) g.clip(opts.clip);
      g.lineCap = 'round';
      g.lineJoin = 'round';
      if (opts.glow) {
        g.shadowColor = colour;
        g.shadowBlur = 16 * this.L.k;
      }
      g.globalAlpha = opts.thin ? 0.45 : 1;
      g.strokeStyle = colour;
      g.lineWidth = r * (opts.thin ? 1.1 : 2);
      g.beginPath();
      g.moveTo(a[0], a[1]);
      g.lineTo(b[0] + 0.01, b[1]);
      g.stroke();
      if (!opts.thin) {
        // the crayon's grain: a lighter line down the middle
        g.shadowBlur = 0;
        g.globalAlpha = opts.glow ? 0.55 : 0.22;
        g.strokeStyle = '#FFFDF7';
        g.lineWidth = r * (opts.glow ? 0.55 : 0.35);
        g.beginPath();
        g.moveTo(a[0], a[1]);
        g.lineTo(b[0] + 0.01, b[1]);
        g.stroke();
      }
      g.restore();
    };
    draw(new DOMMatrix());
    if (opts.mirror) draw(new DOMMatrix([-1, 0, 0, 1, SHEET_W, 0]));
    if (opts.mirror === 'xy') {
      draw(new DOMMatrix([1, 0, 0, -1, 0, SHEET_H]));
      draw(new DOMMatrix([-1, 0, 0, -1, SHEET_W, SHEET_H]));
    }
    l.dirty = true;
  }

  /** The answer to every bit of a stroke: a sparkle now and then at the tip, the crayon's sound. */
  private strokeFx(at: P, dist: number) {
    const pen = this.pen;
    if (!pen) return;
    pen.dist += dist;
    pen.spark += dist;
    if (pen.spark > T.sparkleEvery * this.L.k) {
      pen.spark = 0;
      burst(this, at.x, at.y, { texture: 'star', count: 2, size: 22 * this.L.k, speed: 180, gravityY: 300, lifespan: 450, depth: 60 });
    }
    sfx(this, this.kind === 'steam' ? 'squeak' : 'crayon', { minGapMs: 260, volume: 0.55 });
  }

  // ---------------------------------------------------------------- 1. trace

  private startTrace(pic: TracePic) {
    this.shown.pic = pic.id;
    const lvl = this.level - 1;
    const base = this.layer('base');
    const ink = this.layer('ink');
    const dense = pic.parts.map((p) => resample(p.pts, p.closed, 6));
    // checkpoints: spread over the parts by their length, at least 6 on each
    const lens = pic.parts.map((p) => lengthOf(p.pts, p.closed));
    const total = lens.reduce((a, b) => a + b, 0);
    const cps: Checkpoint[] = [];
    pic.parts.forEach((p, i) => {
      const n = Math.max(6, Math.round((T.checkpoints * lens[i]) / total));
      const step = lens[i] / (p.closed ? n : n - 1);
      resample(p.pts, p.closed, step).slice(0, n).forEach((at) => cps.push({ at, lit: false, part: i }));
    });
    const band = Math.max(T.traceBand[lvl] * Math.min(this.sheet.w, this.sheet.h), T.traceMin[lvl] * this.L.k) / this.sheet.u;
    const dir = T.traceDir[lvl];
    this.trace = { pic, dense, cps, band, base, ink, dir, front: pic.parts.map(() => 0), wrongRun: 0, told: false };
    // the dotted outline: a faint line, cream dots with a soft edge
    const g = base.g;
    this.units(g);
    g.lineCap = g.lineJoin = 'round';
    for (const d of dense) {
      g.strokeStyle = 'rgba(150,130,105,0.35)';
      g.lineWidth = 8;
      g.beginPath();
      d.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
      g.stroke();
      for (let i = 0; i < d.length; i += 5) {
        g.fillStyle = '#B8A88E';
        g.beginPath();
        g.arc(d[i][0], d[i][1], 9, 0, Math.PI * 2);
        g.fill();
        g.fillStyle = '#FFF6E6';
        g.beginPath();
        g.arc(d[i][0], d[i][1], 5, 0, Math.PI * 2);
        g.fill();
      }
    }
    if (dir) this.drawArrows(g, cps, pic);
    base.dirty = true;
  }

  /** Level 2: a green start dot on each part and arrowheads along it, the way to go (as the cut guide's). */
  private drawArrows(g: CanvasRenderingContext2D, cps: Checkpoint[], pic: TracePic) {
    pic.parts.forEach((part, i) => {
      const mine = cps.filter((c) => c.part === i).map((c) => c.at);
      const s = 30;
      mine.forEach((at, j) => {
        if (j === 0 || (!part.closed && j === mine.length - 1)) return;
        const [ux, uy] = tangent(mine, j, part.closed);
        // between this checkpoint and the next
        const nx = mine[(j + 1) % mine.length];
        const x = (at[0] + nx[0]) / 2;
        const y = (at[1] + nx[1]) / 2;
        const l: Pt = [x - ux * s - uy * s * 0.8, y - uy * s + ux * s * 0.8];
        const r: Pt = [x - ux * s + uy * s * 0.8, y - uy * s - ux * s * 0.8];
        for (const [w, c] of [[22, 'rgba(107,59,31,0.4)'], [12, '#FFFFFF']] as const) {
          g.strokeStyle = c;
          g.lineWidth = w;
          g.beginPath();
          g.moveTo(l[0], l[1]);
          g.lineTo(x, y);
          g.lineTo(r[0], r[1]);
          g.stroke();
        }
      });
      const [x, y] = mine[0];
      g.fillStyle = '#FFFFFF';
      g.beginPath();
      g.arc(x, y, 34, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = '#5CB547';
      g.beginPath();
      g.arc(x, y, 26, 0, Math.PI * 2);
      g.fill();
    });
  }

  private nearestOn(dense: Pt[][], p: Pt) {
    let best: Pt = dense[0][0];
    let bd = Infinity;
    let part = 0;
    let idx = 0;
    dense.forEach((d, pi) => d.forEach((q, qi) => {
      const dd = (q[0] - p[0]) ** 2 + (q[1] - p[1]) ** 2;
      if (dd < bd) (bd = dd), (best = q), (part = pi), (idx = qi);
    }));
    return { at: best, d: Math.sqrt(bd), part, idx };
  }

  /** A bit of her stroke at p (sheet units): near the outline it snaps a little to it, glows and lights checkpoints. */
  private traceAt(p: Pt) {
    const t = this.trace!;
    const pen = this.pen as NonNullable<ArtScene['pen']> & { lastQ?: Pt; lastP?: Pt; way?: number; wrong?: number };
    const near = this.nearestOn(t.dense, p);
    // (the finger's path since the last point, not only where it is now: a fast stroke on the phone, or a slow frame
    // while Mom's hand draws, jumps far between two moves and would pass a checkpoint by)
    const from = pen.lastP ?? p;
    let on = near.d < t.band;
    if (t.dir && on) {
      // level 2: only the arrows' way counts (the way of the move against the outline's own way where she is)
      const mx = p[0] - from[0];
      const my = p[1] - from[1];
      const d = Math.hypot(mx, my);
      if (d > 2) {
        const [ux, uy] = tangent(t.dense[near.part], near.idx, t.pic.parts[near.part].closed);
        const cos = (mx * ux + my * uy) / d;
        const c = Math.cos((T.traceAngle * Math.PI) / 180);
        pen.way = cos >= c ? 1 : cos <= -c ? -1 : 0;
        if (pen.way < 0) pen.wrong = (pen.wrong ?? 0) + d * this.sheet.u;
      }
      on = (pen.way ?? 1) > 0;
    }
    const q: Pt = on ? [p[0] + (near.at[0] - p[0]) * 0.35, p[1] + (near.at[1] - p[1]) * 0.35] : p;
    const last = (pen.last ? this.toSheet(pen.last) : null) as Pt | null;
    this.crayon(t.ink, pen.lastQ ?? last ?? q, q, this.css(this.brush), { glow: on, thin: !on });
    pen.lastQ = q;
    pen.lastP = p;
    if (!on) return;
    let lit = 0;
    const light = (c: Checkpoint) => {
      c.lit = true;
      lit++;
      const w = this.toWorld(c.at);
      burst(this, w.x, w.y, { texture: 'star', count: 4, size: 26 * this.L.k, speed: 260, gravityY: 400, lifespan: 500, depth: 60 });
      const n = t.cps.filter((z) => z.lit).length;
      sfx(this, 'xylo', { rate: note(n - 1), vary: false, minGapMs: 40, volume: 0.7 });
      // a gold dot stays where it was lit
      const g = t.base.g;
      this.units(g);
      g.fillStyle = '#FFD45C';
      g.beginPath();
      g.arc(c.at[0], c.at[1], 13, 0, Math.PI * 2);
      g.fill();
      t.base.dirty = true;
    };
    if (!t.dir) {
      for (const c of t.cps) if (!c.lit && segDist(c.at, from, p) <= t.band) light(c);
    } else if (from !== p) {
      // level 2: from the lit front of each part on, in order (a checkpoint a little ahead of the front lights those before it too)
      t.pic.parts.forEach((_, i) => {
        const mine = t.cps.filter((c) => c.part === i);
        for (;;) {
          const f = t.front[i];
          if (f >= mine.length) break;
          let hit = -1;
          for (let j = f; j <= Math.min(mine.length - 1, f + T.traceGap); j++) if (segDist(mine[j].at, from, p) <= t.band) hit = j;
          if (hit < 0) break;
          for (let j = f; j <= hit; j++) if (!mine[j].lit) light(mine[j]);
          t.front[i] = hit + 1;
        }
      });
    }
    if (lit) {
      t.wrongRun = 0;
      this.poke();
      this.shown.progress = Math.round((t.cps.filter((c) => c.lit).length / t.cps.length) * 100) / 100;
      this.checkTrace();
    }
  }

  /** Level 2: a stroke the other way (the ink did not glow). A miss; three in a row: "Follow the arrows!" (once) and Mom's hand. */
  private wrongStroke() {
    const t = this.trace!;
    t.wrongRun++;
    sfx(this, 'xylo', { rate: 0.5, vary: false, volume: 0.3 });
    if (t.wrongRun >= 3 && !t.told) {
      t.told = true;
      this.say('vo-follow-arrows', { ttlMs: 4000 });
    }
    this.miss();
  }

  private checkTrace() {
    const t = this.trace!;
    const lvl = this.level - 1;
    const share = t.cps.filter((c) => c.lit).length / t.cps.length;
    const parts = t.pic.parts.map((_, i) => {
      const mine = t.cps.filter((c) => c.part === i);
      return mine.filter((c) => c.lit).length / mine.length;
    });
    if (share >= T.traceDone[lvl] && parts.every((s) => s >= T.partDone)) this.finish();
  }

  /** The next unlit run of checkpoints (up to n of them, along its part), for Mom's hand. */
  private traceRun(n = 6): Pt[] {
    const t = this.trace!;
    const i0 = t.cps.findIndex((c) => !c.lit);
    if (i0 < 0) return [];
    const part = t.cps[i0].part;
    const mine = t.cps.filter((c) => c.part === part);
    const closed = t.pic.parts[part].closed;
    // start at an unlit one that follows a lit one (or the first unlit), go on along the part
    let s = mine.findIndex((c, i) => !c.lit && (i === 0 ? mine[mine.length - 1].lit || !closed : mine[i - 1].lit));
    if (s < 0) s = mine.findIndex((c) => !c.lit);
    const out: Pt[] = [];
    for (let i = 0; i < mine.length && out.length < n; i++) {
      const j = closed ? (s + i) % mine.length : s + i;
      if (j >= mine.length) break;
      out.push(mine[j].at);
      if (mine[j].lit && out.length > 1) break;
    }
    return out;
  }

  // ---------------------------------------------------------------- 2. join the dots

  private startDots(pic: DotsPic) {
    this.shown.pic = pic.id;
    const k = this.L.k;
    const base = this.layer('base');
    const ink = this.layer('ink');
    const g = base.g;
    this.units(g);
    // the faint picture outline: following the edge and following the order are the same thing
    g.strokeStyle = 'rgba(150,130,105,0.32)';
    g.lineWidth = 6;
    g.setLineDash([14, 14]);
    g.beginPath();
    pic.dots.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
    g.closePath();
    g.stroke();
    g.setLineDash([]);
    base.dirty = true;
    const live = this.add.graphics();
    this.box.add(live);
    const glow = this.add.image(0, 0, FX_SOFT).setTint(0xffe066).setAlpha(0.85).setScale((210 * k) / this.textures.getFrame(FX_SOFT).realWidth);
    this.box.add(glow);
    const r = T.dotR[this.level - 1] * k;
    const views: DotView[] = pic.dots.map((at, i) => {
      const gr = this.add.graphics();
      gr.fillStyle(0x5b3a29, 0.9).fillCircle(0, 3 * k, r + 4 * k);
      gr.fillStyle(0xfffdf7, 1).fillCircle(0, 0, r + 2 * k);
      gr.fillStyle(0xe8473a, 1).fillCircle(0, 0, r - 4 * k);
      if (this.level === 2) this.pips(gr, i + 1, r);
      const w = { x: at[0] * this.sheet.u, y: at[1] * this.sheet.u };
      const box = this.add.container(w.x, w.y, [gr]);
      this.box.add(box);
      return { at, box, joined: false };
    });
    this.dots = { pic, views, cur: -1, next: 0, misses: 0, asked: -1, glow, live, ink, base };
    this.markNext();
  }

  /** The dice pips of a number (1-10) on a dot: a picture of how many, not a digit. */
  private pips(gr: Phaser.GameObjects.Graphics, n: number, r: number) {
    const s = r * 0.3;
    const at: Pt[] = ({
      1: [[0, 0]], 2: [[-1, -1], [1, 1]], 3: [[-1, -1], [0, 0], [1, 1]], 4: [[-1, -1], [1, -1], [-1, 1], [1, 1]],
      5: [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]], 6: [[-1, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [1, 1]],
      7: [[-1, -1], [1, -1], [-1, 0], [0, 0], [1, 0], [-1, 1], [1, 1]], 8: [[-1, -1], [0, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [0, 1], [1, 1]],
      9: [[-1, -1], [0, -1], [1, -1], [-1, 0], [0, 0], [1, 0], [-1, 1], [0, 1], [1, 1]],
      10: [[-1.5, -0.6], [-0.5, -0.6], [0.5, -0.6], [1.5, -0.6], [-1.5, 0.6], [-0.5, 0.6], [0.5, 0.6], [1.5, 0.6], [-0.5, 1.6], [0.5, 1.6]],
    } as Record<number, Pt[]>)[n];
    const step = n === 10 ? s * 0.95 : s * 1.15;
    gr.fillStyle(0xfffdf7, 1);
    for (const [x, y] of at) gr.fillCircle(x * step, y * step - (n === 10 ? step * 0.5 : 0), Math.max(2.5, s * (n > 6 ? 0.38 : 0.48)));
  }

  /** The next dot: bigger, with a soft glow under it (level 1; level 2 only after `dotsGlowAfter` misses: Mom says its number). */
  private markNext() {
    const d = this.dots!;
    const showGlow = this.level === 1 || d.misses >= T.dotsGlowAfter;
    d.views.forEach((v, i) => {
      this.tweens.killTweensOf(v.box);
      v.box.setScale(i === d.next && showGlow ? 1.3 : 1);
    });
    const n = d.views[d.next];
    d.glow.setVisible(!!n && showGlow);
    if (n) d.glow.setPosition(n.box.x, n.box.y);
  }

  private dotAt(at: P) {
    const d = this.dots!;
    const r = T.dotTouch * this.L.k;
    let best = -1;
    let bd = Infinity;
    d.views.forEach((v, i) => {
      const w = this.toWorld(v.at);
      const dd = Math.hypot(w.x - at.x, w.y - at.y);
      if (dd < r && dd < bd) (bd = dd), (best = i);
    });
    // (the next dot wins when two are near: she can't hit the wrong one by being a little off)
    const nx = d.views[d.next];
    if (nx) {
      const w = this.toWorld(nx.at);
      if (Math.hypot(w.x - at.x, w.y - at.y) < r) return d.next;
    }
    return best;
  }

  private joinDot(i: number) {
    const d = this.dots!;
    const v = d.views[i];
    v.joined = true;
    if (d.cur >= 0) this.crayon(d.ink, d.views[d.cur].at, v.at, this.css(this.brush));
    d.cur = i;
    d.next = i + 1;
    d.misses = 0;
    boing(this, v.box, 0.25);
    sfx(this, 'xylo', { rate: note(i), vary: false, minGapMs: 30, volume: 0.75 });
    const w = this.toWorld(v.at);
    burst(this, w.x, w.y, { texture: 'star', count: 5, size: 26 * this.L.k, speed: 260, gravityY: 400, lifespan: 500, depth: 60 });
    // (level 2: Mom asks for the next number instead of counting the one joined)
    if (this.level === 1) voice.say(countKey(i + 1), { group: 'count', sequence: true, ttlMs: 4000, valid: () => this.scene.isActive() && !this.leaving });
    this.poke();
    this.shown.progress = i + 1;
    if (d.next >= d.views.length) {
      // the last dot joins the first, by itself
      d.glow.setVisible(false);
      this.setPhase('intro');
      this.time.delayedCall(350, () => {
        this.crayon(d.ink, v.at, d.views[0].at, this.css(this.brush));
        boing(this, d.views[0].box, 0.25);
        sfx(this, 'xylo', { rate: note(i + 1), vary: false, volume: 0.75 });
        this.time.delayedCall(250, () => this.finish());
      });
      return;
    }
    this.markNext();
    if (this.level === 2) this.askDot();
  }

  /** Level 2: "Find..." and the next dot's number (its pips): she listens, counts the pips and finds it. */
  private askDot(numberOnly = false) {
    const d = this.dots;
    if (!d) return;
    const want = d.next;
    const valid = () => this.scene.isActive() && !this.leaving && !this.finished && this.dots?.next === want;
    // (`asked`: the number has been said, or its moment passed: the test harness's child waits for it)
    const num = () => voice.say(countKey(want + 1), { group: 'count', ttlMs: 4000, valid, done: () => this.dots && (this.dots.asked = want) });
    if (numberOnly) return num();
    voice.say('vo-find-number', { ttlMs: 5000, valid, done: num });
  }

  private wrongDot(i: number) {
    const d = this.dots!;
    const v = d.views[i];
    this.tweens.killTweensOf(v.box);
    this.tweens.add({ targets: v.box, angle: { from: -12, to: 12 }, duration: 70, yoyo: true, repeat: 2, onComplete: () => v.box.setAngle(0) });
    sfx(this, 'xylo', { rate: 0.5, vary: false, volume: 0.35 });
    d.misses++;
    if (this.level === 2) {
      if (d.misses >= T.dotsGlowAfter) this.markNext();
      // (the number again: which one Mom asked for)
      else this.askDot(true);
    }
    this.miss();
  }

  // ---------------------------------------------------------------- 3. colour it in

  private startColour(pic: ColourPic) {
    this.shown.pic = pic.id;
    const fill = this.layer('fill');
    const lines = this.layer('lines');
    const probe = fill.g;
    const areas: AreaView[] = pic.areas.map((a) => ({ path: new Path2D(a.d), mom: a.mom, fill: null, hint: [0, 0], reach: 100, told: false }));
    this.colour = { pic, areas, fill, lines, anim: null };
    // each area's middle (a point that is really on it, not under a later area) and how far its paint spreads
    areas.forEach((a, i) => {
      const pts: Pt[] = [];
      let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
      for (let y = 5; y < SHEET_H; y += 10) {
        for (let x = 5; x < SHEET_W; x += 10) {
          probe.setTransform(1, 0, 0, 1, 0, 0);
          if (!probe.isPointInPath(a.path, x, y)) continue;
          x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y);
          if (this.areaAt([x, y]) === i) pts.push([x, y]);
        }
      }
      const cx = (x0 + x1) / 2;
      const cy = (y0 + y1) / 2;
      pts.sort((p, q) => Math.hypot(p[0] - cx, p[1] - cy) - Math.hypot(q[0] - cx, q[1] - cy));
      a.hint = pts[0] ?? [cx, cy];
      a.reach = Math.hypot(x1 - x0, y1 - y0) + 20;
    });
    this.drawLines(lines, pic, areas);
    this.drawFills();
    if (this.level === 2) this.makeModel(pic, areas);
  }

  private drawLines(l: Layer, pic: ColourPic, areas: AreaView[]) {
    const g = l.g;
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.clearRect(0, 0, l.tex.width, l.tex.height);
    this.units(g);
    g.strokeStyle = INK_CSS;
    g.lineWidth = 7;
    g.lineCap = g.lineJoin = 'round';
    for (const a of areas) g.stroke(a.path);
    for (const d of pic.lines ?? []) g.stroke(new Path2D(d));
    l.dirty = true;
  }

  /** Every area in its paint (the one spreading now clipped to its growing circle). */
  private drawFills(now = this.time.now) {
    const c = this.colour!;
    const g = c.fill.g;
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.clearRect(0, 0, c.fill.tex.width, c.fill.tex.height);
    this.units(g);
    c.areas.forEach((a, i) => {
      if (a.fill) {
        g.fillStyle = PAINT[a.fill];
        g.fill(a.path);
      }
      const an = c.anim;
      if (an && an.i === i) {
        const t = Math.min(1, (now - an.t) / T.fillMs);
        g.save();
        g.clip(a.path);
        g.fillStyle = PAINT[an.to];
        g.beginPath();
        g.arc(an.at[0], an.at[1], a.reach * (1 - (1 - t) * (1 - t)), 0, Math.PI * 2);
        g.fill();
        g.restore();
      }
    });
    c.fill.dirty = true;
  }

  /** The topmost area under p (sheet units), or one whose edge is very near (thin stems), or -1. */
  private areaAt(p: Pt) {
    const c = this.colour!;
    const g = c.fill.g;
    g.setTransform(1, 0, 0, 1, 0, 0);
    for (let i = c.areas.length - 1; i >= 0; i--) if (g.isPointInPath(c.areas[i].path, p[0], p[1])) return i;
    g.lineWidth = 50;
    for (let i = c.areas.length - 1; i >= 0; i--) if (g.isPointInStroke(c.areas[i].path, p[0], p[1])) return i;
    return -1;
  }

  private paint(i: number, p: Pt) {
    const c = this.colour!;
    const a = c.areas[i];
    const to = this.brush as Paint;
    if (c.anim) {
      // the one spreading finishes at once, and counts (its own timer then finds nothing to do): a second tap within
      // fillMs used to skip the check, and a picture coloured to the end never finished
      const j = c.anim.i;
      c.areas[j].fill = c.anim.to;
      c.anim = null;
      this.drawFills();
      this.afterPaint(j);
      if (this.finished || this.phase !== 'draw') return;
    }
    if (a.fill === to) return;
    const repaint = a.fill !== null;
    c.anim = { i, to, at: p, t: this.time.now };
    sfx(this, 'splosh', { volume: 0.8, minGapMs: 120 });
    const w = this.toWorld(p);
    burst(this, w.x, w.y, { texture: 'fx-dot', count: 6, tint: Phaser.Display.Color.HexStringToColor(PAINT[to]).color, size: 22 * this.L.k, speed: 260, gravityY: 600, lifespan: 450, depth: 60 });
    if (repaint) voice.say(`name-${to}` as NameKey, { group: 'name', ttlMs: 2000, valid: () => this.scene.isActive() && !this.leaving });
    this.poke();
    this.time.delayedCall(T.fillMs, () => {
      if (c.anim?.i !== i) return;
      a.fill = c.anim.to;
      c.anim = null;
      this.drawFills();
      this.afterPaint(i);
    });
  }

  private afterPaint(i: number) {
    const c = this.colour!;
    const a = c.areas[i];
    const w = this.toWorld(a.hint);
    if (this.level === 2) {
      if (a.fill === a.mom) stars(this, w.x, w.y, 6, 34 * this.L.k);
      else if (!a.told) {
        a.told = true;
        this.say('vo-colour-mom', { ttlMs: 3000 });
        voice.say(`name-${a.mom}` as NameKey, { ttlMs: 5000, valid: () => this.scene.isActive() && !this.leaving });
        this.miss();
      }
    }
    this.shown.progress = c.areas.filter((q) => (this.level === 1 ? q.fill : q.fill === q.mom)).length;
    if (this.colourDone()) (this.setPhase('intro'), this.time.delayedCall(350, () => this.finish()));
  }

  private colourDone() {
    const c = this.colour!;
    return !c.anim && (this.level === 1 ? c.areas.every((q) => q.fill) : c.areas.every((q) => q.fill === q.mom));
  }

  /** Level 2: Mom's own little picture, framed, beside the sheet (above her head, or left of it). */
  private makeModel(pic: ColourPic, areas: AreaView[]) {
    const L = this.L;
    const S = this.S;
    const k = L.k;
    const x0 = this.sheet.x + this.sheet.w + 22 * k;
    const y0 = Math.max(L.Y(40), 30 * k);
    let w = Math.min(0.42 * this.sheet.w, L.W - L.m - 20 * k - x0);
    if (y0 + w * 0.8 > S.momFace.y0 - 12 * k) w = Math.min(w, Math.min(S.momFace.x0, S.pet ? S.pet.x - 270 * S.pet.scale : Infinity) - 20 * k - x0, (S.momFace.y0 - 12 * k - y0) / 0.8);
    w = Math.max(w, 120 * k);
    const h = w * 0.8;
    const key = 'art-cv-model';
    if (this.textures.exists(key)) this.textures.remove(key);
    const tex = this.textures.createCanvas(key, Math.round(w), Math.round(h))!;
    const g = tex.getContext();
    g.fillStyle = '#FFFDF7';
    g.fillRect(0, 0, w, h);
    const u = w / SHEET_W;
    g.setTransform(u, 0, 0, u, 0, 0);
    for (const a of areas) {
      g.fillStyle = PAINT[a.mom];
      g.fill(a.path);
    }
    g.strokeStyle = INK_CSS;
    g.lineWidth = 9;
    g.lineJoin = 'round';
    for (const a of areas) g.stroke(a.path);
    for (const d of pic.lines ?? []) g.stroke(new Path2D(d));
    tex.refresh();
    const frame = this.add.graphics().setDepth(6);
    frame.fillStyle(0x3a2216, 0.25).fillRoundedRect(x0 - 10 * k + 4 * k, y0 - 10 * k + 6 * k, w + 20 * k, h + 20 * k, 10 * k);
    frame.fillStyle(0x9e643a, 1).fillRoundedRect(x0 - 10 * k, y0 - 10 * k, w + 20 * k, h + 20 * k, 10 * k);
    this.colour!.model = this.add.image(x0, y0, key).setOrigin(0, 0).setDepth(7);
    // (a heart in its corner: it is Mom's)
    this.add.image(x0 + w, y0, 'fx-heart').setDepth(8).setScale((46 * k) / Math.max(1, this.textures.getFrame('fx-heart')?.realWidth ?? 46)).setTint(0xf27fb2);
    this.layers.push({ key, tex, g, img: this.colour!.model, dirty: false });
  }

  /** The area Mom's hand goes to next, and the pot it needs (level 2). */
  private colourNext() {
    const c = this.colour!;
    const i = this.level === 1 ? c.areas.findIndex((a) => !a.fill) : c.areas.findIndex((a) => a.fill !== a.mom);
    return i < 0 ? null : { i, area: c.areas[i], pot: this.level === 2 ? c.areas[i].mom : null };
  }

  // ---------------------------------------------------------------- 4. mirror magic

  private startMirror(pic: MirrorPic) {
    const plate = pic.both;
    this.shown.pic = pic.id;
    const base = this.layer('base');
    const ink = this.layer('ink');
    const top = this.layer('top');
    const clip = new Path2D();
    const flip = new DOMMatrix([-1, 0, 0, 1, SHEET_W, 0]);
    for (const d of pic.left ?? []) {
      clip.addPath(new Path2D(d));
      clip.addPath(new Path2D(d), flip);
    }
    for (const d of pic.whole) clip.addPath(new Path2D(d));
    const g = base.g;
    this.units(g);
    g.fillStyle = plate ? '#FFF6E6' : '#FFFAF0';
    g.fill(clip);
    // (the outline of the whole shape only: thick ink under, the paper over its inner half, so overlapping parts show no seams)
    g.strokeStyle = INK_CSS;
    g.lineWidth = 14;
    g.lineJoin = 'round';
    g.stroke(clip);
    g.fill(clip);
    if (pic.rim) {
      g.strokeStyle = 'rgba(150,130,105,0.5)';
      g.lineWidth = 5;
      g.beginPath();
      g.arc(pic.rim.cx, pic.rim.cy, pic.rim.r, 0, Math.PI * 2);
      g.stroke();
    }
    // the fold: where the magic mirror is
    g.strokeStyle = 'rgba(150,130,105,0.45)';
    g.lineWidth = 5;
    g.setLineDash([16, 16]);
    g.beginPath();
    g.moveTo(500, 20);
    g.lineTo(500, 780);
    if (plate) {
      g.moveTo(110, 400);
      g.lineTo(890, 400);
    }
    g.stroke();
    g.setLineDash([]);
    base.dirty = true;
    if (pic.id === 'butterfly') {
      const t = top.g;
      this.units(t);
      t.fillStyle = INK_CSS;
      for (const d of pic.whole) t.fill(new Path2D(d));
      t.strokeStyle = INK_CSS;
      t.lineWidth = 9;
      t.lineCap = 'round';
      for (const d of BUTTERFLY_FEELERS) t.stroke(new Path2D(d));
      top.dirty = true;
    }
    // the coverage cells inside the shape
    const G = this.grid;
    let inside = 0;
    const probe = ink.g;
    probe.setTransform(1, 0, 0, 1, 0, 0);
    for (let j = 0; j < G.h; j++) for (let i = 0; i < G.w; i++) if (probe.isPointInPath(clip, ((i + 0.5) * SHEET_W) / G.w, ((j + 0.5) * SHEET_H) / G.h)) inside++, (G.on[j * G.w + i] = 0);
    // (cells outside never count: mark them 2)
    for (let j = 0; j < G.h; j++) for (let i = 0; i < G.w; i++) if (!probe.isPointInPath(clip, ((i + 0.5) * SHEET_W) / G.w, ((j + 0.5) * SHEET_H) / G.h)) G.on[j * G.w + i] = 2;
    this.mirror = { pic, plate, clip, inside, base, ink, top, shown: false };
  }

  private mirrorAt(p: Pt) {
    const m = this.mirror!;
    const pen = this.pen!;
    const last = (pen as { lastQ?: Pt }).lastQ ?? p;
    this.crayon(m.ink, last, p, this.css(this.brush, pen.dist / this.sheet.u), { clip: m.clip, mirror: m.plate ? 'xy' : 'x' });
    (pen as { lastQ?: Pt }).lastQ = p;
    const r = this.brushR() / this.sheet.u;
    const pts: Pt[] = [p, [SHEET_W - p[0], p[1]]];
    if (m.plate) pts.push([p[0], SHEET_H - p[1]], [SHEET_W - p[0], SHEET_H - p[1]]);
    let n = 0;
    for (const q of pts) n += this.cover(q, r);
    if (n) this.poke();
    const G = this.grid;
    let on = 0;
    for (let i = 0; i < G.on.length; i++) if (G.on[i] === 1) on++;
    const share = on / Math.max(1, m.inside);
    this.shown.progress = Math.round(share * 100) / 100;
    if (!m.shown && share >= T.mirrorInk[this.level - 1]) this.showDone();
  }

  /** Open-ended: once there is enough on it, the done button above Mom's head ("Tap here when you're done!"). */
  private showDone() {
    const m = this.mirror!;
    m.shown = true;
    const L = this.L;
    const S = this.S;
    this.doneBtn = iconButton(this, L, 'btn-done', S.done.x, S.done.y, () => this.phase === 'draw' && this.finish(), { hitPad: 30 }).setDepth(800);
    this.doneBtn.setScale(0);
    this.tweens.add({ targets: this.doneBtn, scale: L.k, duration: 360, ease: 'Back.easeOut' });
    sfx(this, 'pop');
    this.say('vo-done-hint', { ttlMs: 4000 });
  }

  // ---------------------------------------------------------------- 5. the steamy window

  private startSteam(garden: (typeof STEAM)[number]) {
    const s = this.sheet;
    const f = s.w / 800;
    // (the second garden: the same view the other way round, the hidden things in other places)
    const view = this.add.image(0, 0, 'art-window-view').setOrigin(0, 0).setScale(f).setFlipX(garden.flip);
    this.box.add(view);
    const things = garden.hidden.map((h) => {
      const img = this.add.image(h.at[0] * f, h.at[1] * f, h.key).setScale(h.scale * f).setFlipX(garden.flip && h.id !== 'rainbow');
      this.box.add(img);
      return { h, img, found: false };
    });
    const fog = this.layer('fog');
    const frame = this.add.image(0, 0, 'art-window-frame').setOrigin(0, 0).setScale(f);
    this.box.add(frame);
    // the steam: soft white over the glass, a little uneven, with drops
    const G = ART.art.glass;
    const g = fog.g;
    g.setTransform(f, 0, 0, f, 0, 0);
    g.fillStyle = 'rgba(240,245,246,0.94)';
    g.fillRect(G.x, G.y, G.w, G.h);
    const rnd = new Phaser.Math.RandomDataGenerator(['steam']);
    for (let i = 0; i < 40; i++) {
      g.fillStyle = `rgba(255,255,255,${rnd.realInRange(0.15, 0.4)})`;
      g.beginPath();
      g.ellipse(G.x + rnd.realInRange(0, G.w), G.y + rnd.realInRange(0, G.h), rnd.realInRange(30, 90), rnd.realInRange(20, 60), 0, 0, Math.PI * 2);
      g.fill();
    }
    for (let i = 0; i < 60; i++) {
      const x = G.x + rnd.realInRange(10, G.w - 10);
      const y = G.y + rnd.realInRange(10, G.h - 10);
      g.fillStyle = 'rgba(190,210,215,0.55)';
      g.beginPath();
      g.arc(x, y, rnd.realInRange(2, 5), 0, Math.PI * 2);
      g.fill();
    }
    fog.dirty = true;
    const n = this.grid.w * this.grid.h;
    const targets = this.level === 2 ? Phaser.Utils.Array.Shuffle([...garden.hidden]).slice(0, 3) : [];
    this.steam = { flip: garden.flip, fog, things, level: new Float32Array(n).fill(1), at: new Float64Array(n), targets, target: -1, refog: 0, clear: false };
    this.shown.pic = garden.flip ? 'window-2' : 'window';
  }

  /** Is cell (i, j) on the glass (not under the frame)? */
  private onGlass(i: number, j: number) {
    const G = ART.art.glass;
    const x = ((i + 0.5) * 800) / this.grid.w;
    const y = ((j + 0.5) * 640) / this.grid.h;
    return x > G.x && x < G.x + G.w && y > G.y && y < G.y + G.h;
  }

  /** Her finger wipes the steam at p (sheet units): a soft round clear patch, the cells under it clear. */
  private wipeAt(p: Pt) {
    const st = this.steam!;
    const pen = this.pen!;
    const u = this.sheet.u;
    const r = (this.brushR() * 2.3) / u;
    const g = st.fog.g;
    const last = (pen as { lastQ?: Pt }).lastQ ?? p;
    (pen as { lastQ?: Pt }).lastQ = p;
    const dist = Math.hypot(p[0] - last[0], p[1] - last[1]);
    const steps = Math.max(1, Math.ceil(dist / (r * 0.35)));
    g.save();
    g.setTransform(u, 0, 0, u, 0, 0);
    g.globalCompositeOperation = 'destination-out';
    for (let s = 1; s <= steps; s++) {
      const x = last[0] + ((p[0] - last[0]) * s) / steps;
      const y = last[1] + ((p[1] - last[1]) * s) / steps;
      const grd = g.createRadialGradient(x, y, r * 0.3, x, y, r);
      grd.addColorStop(0, 'rgba(0,0,0,0.9)');
      grd.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = grd;
      g.beginPath();
      g.arc(x, y, r, 0, Math.PI * 2);
      g.fill();
    }
    g.restore();
    st.fog.dirty = true;
    // the cells it cleared
    const Gd = this.grid;
    const cw = SHEET_W / Gd.w;
    const ch = SHEET_H / Gd.h;
    let n = 0;
    for (let j = 0; j < Gd.h; j++) {
      for (let i = 0; i < Gd.w; i++) {
        const c = j * Gd.w + i;
        if (st.level[c] < 0.5) continue;
        if (Math.hypot((i + 0.5) * cw - p[0], (j + 0.5) * ch - p[1]) > r * 0.85) continue;
        st.level[c] = 0;
        st.at[c] = this.time.now;
        n++;
      }
    }
    if (!n) return;
    this.poke();
    this.checkSteam();
  }

  /** How clear (0-1) the box of a hidden thing is, or the whole glass. */
  private clearShare(h?: Hidden) {
    const st = this.steam!;
    const Gd = this.grid;
    let on = 0;
    let all = 0;
    for (let j = 0; j < Gd.h; j++) {
      for (let i = 0; i < Gd.w; i++) {
        if (!this.onGlass(i, j)) continue;
        if (h) {
          const img = st.things.find((t) => t.h === h)!.img;
          const x = ((i + 0.5) * this.sheet.w) / Gd.w;
          const y = ((j + 0.5) * this.sheet.h) / Gd.h;
          if (Math.abs(x - img.x) > img.displayWidth * 0.4 || Math.abs(y - img.y) > img.displayHeight * 0.4) continue;
        }
        all++;
        if (st.level[j * Gd.w + i] < 0.5) on++;
      }
    }
    return all ? on / all : 0;
  }

  private checkSteam() {
    const st = this.steam!;
    if (st.clear) return;
    if (this.level === 1) {
      for (const t of st.things) if (!t.found && this.clearShare(t.h) >= T.findClear) this.found(t);
      const share = this.clearShare();
      this.shown.progress = Math.round(share * 100) / 100;
      // done when most of the glass is clear, or when everything behind it is found (Mom's help finds them one by one)
      if (share >= T.steamClear || st.things.every((t) => t.found)) (st.clear = true), this.time.delayedCall(400, () => this.finish());
      return;
    }
    const h = st.targets[st.target];
    if (!h) return;
    const t = st.things.find((q) => q.h === h)!;
    if (!t.found && this.clearShare(h) >= T.findClear) {
      this.found(t);
      this.pipa?.wishGranted();
      this.shown.progress = st.target + 1;
      if (st.target >= st.targets.length - 1) (st.clear = true), this.time.delayedCall(900, () => this.finish());
      else {
        this.setPhase('intro');
        this.time.delayedCall(1600, () => this.askNext());
      }
    }
  }

  /** Level 2: "Can you find the..." and its name, its picture in Pipa's bubble. */
  private askNext() {
    const st = this.steam;
    if (!st || this.finished || this.leaving) return;
    st.target++;
    const h = st.targets[st.target];
    if (!h) return;
    if (this.phase !== 'draw') this.setPhase('draw');
    // (wiped clear before Mom asked for it: the steam comes back over it, so there is something to find; a wipe that
    // clears nothing new would never count it)
    if (this.clearShare(h) >= T.findClear * 0.5) this.fogOver(h);
    // the name only after "Can you find the...": a name may cut the name playing, so it is not queued beside it
    this.say('vo-steam-find', { ttlMs: 5000, done: () => voice.say(h.name, { ttlMs: 4000, valid: () => this.scene.isActive() && !this.leaving && !this.finished }) });
    this.pipa?.showWish([h.key], [h.id], { maxRight: this.S.momFace.x0 - 10 * this.L.k, k: this.L.k });
  }

  /** Steam back over a hidden thing's box (level 2, when Mom asks for one she already wiped clear). */
  private fogOver(h: Hidden) {
    const st = this.steam!;
    const Gd = this.grid;
    const img = st.things.find((t) => t.h === h)!.img;
    const cw = this.sheet.w / Gd.w;
    const ch = this.sheet.h / Gd.h;
    const g = st.fog.g;
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.fillStyle = 'rgba(240,245,246,0.94)';
    for (let j = 0; j < Gd.h; j++) {
      for (let i = 0; i < Gd.w; i++) {
        const x = (i + 0.5) * cw;
        const y = (j + 0.5) * ch;
        if (!this.onGlass(i, j) || Math.abs(x - img.x) > img.displayWidth * 0.6 || Math.abs(y - img.y) > img.displayHeight * 0.6) continue;
        st.level[j * Gd.w + i] = 1;
        g.fillRect(i * cw - 1, j * ch - 1, cw + 2, ch + 2);
      }
    }
    st.fog.dirty = true;
  }

  private found(t: { h: Hidden; img: Phaser.GameObjects.Image; found: boolean }) {
    t.found = true;
    const w = { x: this.sheet.x + t.img.x, y: this.sheet.y + t.img.y };
    this.tweens.add({ targets: t.img, y: t.img.y - 30 * this.L.k, duration: 220, yoyo: true, ease: 'Quad.easeOut' });
    stars(this, w.x, w.y, 8, 40 * this.L.k);
    sfx(this, 'star');
    voice.say(t.h.name, { group: 'name', ttlMs: 3000, valid: () => this.scene.isActive() && !this.leaving });
  }

  /** Level 2: wiped glass slowly steams up again (never over what she found), so she can keep drawing in it. */
  private refog(delta: number) {
    const st = this.steam;
    if (!st || this.level !== 2 || st.clear) return;
    st.refog += delta;
    if (st.refog < 600) return;
    st.refog = 0;
    const now = this.time.now;
    const Gd = this.grid;
    const g = st.fog.g;
    const cw = this.sheet.w / Gd.w;
    const ch = this.sheet.h / Gd.h;
    g.setTransform(1, 0, 0, 1, 0, 0);
    let any = false;
    for (let j = 0; j < Gd.h; j++) {
      for (let i = 0; i < Gd.w; i++) {
        const c = j * Gd.w + i;
        if (st.level[c] >= 1 || now - st.at[c] < T.refogMs || !this.onGlass(i, j)) continue;
        const x = (i + 0.5) * cw;
        const y = (j + 0.5) * ch;
        if (st.things.some((t) => t.found && Math.abs(x - t.img.x) < t.img.displayWidth * 0.55 && Math.abs(y - t.img.y) < t.img.displayHeight * 0.55)) continue;
        st.level[c] = Math.min(1, st.level[c] + 0.25);
        g.fillStyle = 'rgba(240,245,246,0.3)';
        g.fillRect(i * cw, j * ch, cw + 1, ch + 1);
        any = true;
      }
    }
    if (any) st.fog.dirty = true;
  }

  private steamTarget(): Hidden | null {
    const st = this.steam!;
    if (this.level === 2) return st.targets[st.target] ?? null;
    return st.things.find((t) => !t.found)?.h ?? null;
  }

  // ---------------------------------------------------------------- 6. stamps

  /** Level 1: a garden of outlines, each a stamp's shape; level 2: a row of six circles and Mom's pattern on a card. */
  private startStamps(run: number) {
    const base = this.layer('base');
    const ink = this.layer('ink');
    const hard = this.level === 2;
    const scene = byVisit(STAMP_SCENES, run);
    const pattern = hard ? [...byVisit(STAMP_PATTERNS, run)] : null;
    const slots: SlotView[] = (hard ? STAMP_ROW : scene.slots).map((slot) => ({ slot, got: null }));
    this.shown.pic = hard ? `pattern-${pattern!.join('-')}` : `garden-${STAMP_SCENES.indexOf(scene)}`;
    // the prints, one picture each (shown as images on the sheet, so they can come alive one by one)
    for (const id of STAMPS) this.printTexture(id);
    const g = base.g;
    this.units(g);
    g.lineCap = g.lineJoin = 'round';
    if (!hard) {
      g.strokeStyle = 'rgba(92,181,71,0.75)';
      g.lineWidth = 10;
      for (const d of scene.lines) g.stroke(new Path2D(d));
    } else {
      // the line the row stands on
      g.strokeStyle = 'rgba(150,130,105,0.4)';
      g.lineWidth = 6;
      g.beginPath();
      g.moveTo(40, 620);
      g.lineTo(960, 620);
      g.stroke();
    }
    for (const s of slots) this.drawOutline(g, s.slot);
    base.dirty = true;
    // the four stamps in the pot column (two by two)
    const L = this.L;
    const S = this.S;
    const k = L.k;
    const top = S.home.y + (S.home.x - L.m) + 16 * k;
    const bottom = L.Y(994) - 14 * k;
    const cell = Math.min(230 * k, (bottom - top) / 2);
    const scale = Math.min(T.stampScale * k, (cell - 8 * k) / 240);
    const colX = [L.m + 30 * k + 100 * k, L.m + 30 * k + 300 * k];
    const stamps: StampView[] = STAMPS.map((id, i) => {
      const x = colX[i % 2];
      const y = bottom - cell * (2 - Math.floor(i / 2) - 0.5);
      return { id, x, y, img: this.add.image(x, y, `art-stamp-${id}`).setScale(scale).setDepth(10) };
    });
    const ring = this.add.image(0, 0, FX_SOFT).setDepth(9).setScale((270 * k) / this.textures.getFrame(FX_SOFT).realWidth).setAlpha(0.8);
    const card: Phaser.GameObjects.Image[] = [];
    if (pattern) {
      // Mom's card along the top of the sheet: her pattern, small, in a wooden frame, a heart in its corner (it is Mom's)
      const C = STAMP_CARD;
      g.fillStyle = 'rgba(58,34,22,0.22)';
      g.beginPath();
      g.roundRect(C.x + 5, C.y + 8, C.w, C.h, 16);
      g.fill();
      g.fillStyle = '#9E643A';
      g.beginPath();
      g.roundRect(C.x, C.y, C.w, C.h, 16);
      g.fill();
      g.fillStyle = '#FFFDF7';
      g.beginPath();
      g.roundRect(C.x + 14, C.y + 14, C.w - 28, C.h - 28, 10);
      g.fill();
      g.fillStyle = PAINT.pink;
      g.fill(new Path2D(`M${C.x + C.w - 6},${C.y + 22} c-8,-16 -34,-12 -30,8 c3,14 22,22 30,30 c8,-8 27,-16 30,-30 c4,-20 -22,-24 -30,-8Z`));
      const step = (C.w - 60) / pattern.length;
      pattern.forEach((id, i) => {
        const at: Pt = [C.x + 30 + step * (i + 0.5), C.y + C.h / 2];
        const img = this.add.image(at[0] * this.sheet.u, at[1] * this.sheet.u, `art-cv-print-${id}`).setScale(0.62);
        this.box.add(img);
        card.push(img);
      });
    }
    this.stamps = { stamps, sel: 'sun', slots, pattern, base, ink, ring, card, busy: false, misses: 0 };
    this.selectStamp(this.nextStamp() ?? 'sun', false);
  }

  /** A print of a stamp, drawn once in its paint (240 sheet units square at s 1). */
  private printTexture(id: StampId) {
    const key = `art-cv-print-${id}`;
    if (this.textures.exists(key)) this.textures.remove(key);
    const u = this.sheet.u;
    const px = Math.max(8, Math.round(240 * u));
    const tex = this.textures.createCanvas(key, px, px)!;
    const g = tex.getContext();
    g.setTransform(u, 0, 0, u, px / 2, px / 2);
    this.drawPrint(g, id);
    tex.refresh();
    this.layers.push({ key, tex, g, img: this.add.image(-9999, -9999, key).setVisible(false), dirty: false });
  }

  /** A stamp's print round (0, 0): its paint, a lighter grain like a real rubber stamp, its few marks. */
  private drawPrint(g: CanvasRenderingContext2D, id: StampId) {
    const st = STAMP[id];
    const paths = st.parts.map((d) => new Path2D(d));
    g.fillStyle = st.paint;
    for (const p of paths) g.fill(p);
    if (id === 'flower') {
      g.fillStyle = PAINT.yellow;
      g.fill(paths[paths.length - 1]);
    }
    const m = g.getTransform();
    const rnd = new Phaser.Math.RandomDataGenerator([`print-${id}`]);
    g.fillStyle = 'rgba(255,253,247,0.35)';
    for (let i = 0; i < 26; i++) {
      const x = rnd.realInRange(-90, 90);
      const y = rnd.realInRange(-80, 80);
      const r = rnd.realInRange(2, 5);
      if (!paths.some((p) => g.isPointInPath(p, x * m.a + m.e, y * m.d + m.f))) continue;
      g.beginPath();
      g.arc(x, y, r, 0, Math.PI * 2);
      g.fill();
    }
    g.fillStyle = '#2E201B';
    g.strokeStyle = '#2E201B';
    g.lineCap = 'round';
    const dot = (x: number, y: number, r: number) => {
      g.beginPath();
      g.arc(x, y, r, 0, Math.PI * 2);
      g.fill();
    };
    if (id === 'sun') {
      dot(-22, -12, 7);
      dot(22, -12, 7);
      g.lineWidth = 6;
      g.beginPath();
      g.arc(0, 4, 26, 0.2 * Math.PI, 0.8 * Math.PI);
      g.stroke();
    }
    if (id === 'bird') dot(-60, -36, 7);
    if (id === 'cloud') (dot(-24, 4, 6), dot(24, 4, 6));
  }

  /** An outline to stamp on (dashed, the shape's own or a plain circle), a soft cream inside; `erase`: gone under a print. */
  private drawOutline(g: CanvasRenderingContext2D, slot: StampSlot, erase = false) {
    const parts = (slot.shape ? STAMP[slot.shape].parts : ['M-100,0 a100,100 0 1,0 200,0 a100,100 0 1,0 -200,0Z']).map((d) => new Path2D(d));
    g.save();
    g.translate(slot.at[0], slot.at[1]);
    g.scale(slot.s, slot.s);
    g.lineJoin = 'round';
    if (erase) {
      g.fillStyle = g.strokeStyle = '#FFFDF7';
      g.lineWidth = 26 / slot.s;
      for (const p of parts) (g.stroke(p), g.fill(p));
      g.restore();
      return;
    }
    // (thick dashes under, the cream over their inner half: one outline round the whole shape, no seams inside)
    g.strokeStyle = '#A8967A';
    g.lineWidth = 16 / slot.s;
    g.setLineDash([18 / slot.s, 12 / slot.s]);
    for (const p of parts) g.stroke(p);
    g.setLineDash([]);
    g.fillStyle = '#F6EFE2';
    for (const p of parts) g.fill(p);
    g.restore();
  }

  /** Is anything left to stamp with this stamp (level 1: an empty outline of its shape; level 2: an empty circle)? */
  private stampFree(id: StampId) {
    const st = this.stamps!;
    return st.slots.some((s) => !s.got && (st.pattern || s.slot.shape === id));
  }

  /** The stamp the next outline needs (level 1: the picked one while it has outlines left). */
  private nextStamp(): StampId | null {
    return this.stampTarget()?.need ?? null;
  }

  private selectStamp(id: StampId, say = true) {
    const st = this.stamps!;
    st.sel = id;
    const k = this.L.k;
    for (const v of st.stamps) {
      this.tweens.killTweensOf(v.img);
      v.img.setY(v.y - (v.id === id ? 18 * k : 0)).setAngle(0);
      v.img.setAlpha(this.stampFree(v.id) ? 1 : 0.45);
    }
    const v = st.stamps.find((q) => q.id === id)!;
    st.ring.setPosition(v.x, v.y + 10 * k).setTint(Phaser.Display.Color.HexStringToColor(STAMP[id].paint).color);
    if (!say) return;
    boing(this, v.img, 0.12);
    sfx(this, 'pop', { volume: 0.6 });
    voice.say(STAMP[id].name, { group: 'name', ttlMs: 2000, valid: () => this.scene.isActive() && !this.leaving });
  }

  private stampViewAt(at: P): StampView | null {
    const st = this.stamps!;
    const r = T.stampTouch * this.L.k;
    let best: StampView | null = null;
    let bd = Infinity;
    for (const v of st.stamps) {
      const d = Math.hypot(at.x - v.x, at.y - v.y);
      if (d < r && d < bd) (best = v), (bd = d);
    }
    return best;
  }

  /** Where the picked stamp lands for a tap at p (sheet units): level 1 the nearest empty outline of its shape, level 2 the nearest empty circle. */
  private slotFor(id: StampId, p: Pt) {
    const st = this.stamps!;
    let best = -1;
    let bd = Infinity;
    st.slots.forEach((s, i) => {
      if (s.got || (!st.pattern && s.slot.shape !== id)) return;
      const d = Math.hypot(s.slot.at[0] - p[0], s.slot.at[1] - p[1]);
      if (d < bd) (bd = d), (best = i);
    });
    return best;
  }

  /** The next outline Mom's hand goes to and the stamp it needs (level 2: the leftmost empty circle, Mom's pattern). */
  private stampTarget(): { i: number; need: StampId } | null {
    const st = this.stamps!;
    if (st.pattern) {
      const i = st.slots.findIndex((s) => !s.got);
      return i < 0 ? null : { i, need: st.pattern[i] };
    }
    // (the picked stamp's own outline first, so Mom's hand does not ask for a change she does not need)
    let i = st.slots.findIndex((s) => !s.got && s.slot.shape === st.sel);
    if (i < 0) i = st.slots.findIndex((s) => !s.got);
    return i < 0 ? null : { i, need: st.slots[i].slot.shape! };
  }

  /** The picked stamp comes down onto outline i: a thump, the print, Mom counts. */
  private press(i: number) {
    const st = this.stamps!;
    const s = st.slots[i];
    const id = st.sel;
    s.got = id;
    st.busy = true;
    const k = this.L.k;
    const v = st.stamps.find((q) => q.id === id)!;
    const at = this.toWorld(s.slot.at);
    const n = st.slots.filter((q) => q.got).length;
    const ghost = this.add.image(at.x, at.y - 150 * k, `art-stamp-${id}`).setScale(v.img.scale).setDepth(40);
    // level 2: a stamp that is not Mom's next one stays (nothing is wrong), but her card's one hops: "What comes next?"
    const off = !!st.pattern && id !== st.pattern[i];
    if (off) {
      st.misses++;
      this.miss();
    } else this.poke();
    this.shown.progress = n;
    this.tweens.add({
      targets: ghost, y: at.y - 40 * k, duration: 150, ease: 'Quad.easeIn',
      onComplete: () => {
        sfx(this, 'stamp', { volume: 0.9 });
        this.drawOutline(st.base.g, s.slot, true);
        st.base.dirty = true;
        const u = this.sheet.u;
        const print = this.add.image(s.slot.at[0] * u, s.slot.at[1] * u, `art-cv-print-${id}`).setScale(s.slot.s).setAlpha(0);
        print.setData('id', id);
        this.box.add(print);
        this.tweens.add({ targets: print, alpha: 1, duration: 120 });
        burst(this, at.x, at.y, { texture: 'star', count: 5, size: 24 * k, speed: 240, gravityY: 400, lifespan: 480, depth: 60 });
        this.tweens.add({
          targets: ghost, scaleY: ghost.scaleY * 0.86, duration: 90, yoyo: true,
          onComplete: () => this.tweens.add({ targets: ghost, y: ghost.y - 120 * k, alpha: 0, duration: 240, onComplete: () => ghost.destroy() }),
        });
        voice.say(countKey(n), { group: 'count', sequence: true, ttlMs: 4000, valid: () => this.scene.isActive() && !this.leaving });
        if (off) {
          const c = st.card[i];
          if (c) this.tweens.add({ targets: c, y: c.y - 26 * k, duration: 160, yoyo: true, repeat: 1, ease: 'Quad.easeOut' });
          this.say('vo-next', { ttlMs: 4000 });
        }
        if (n >= st.slots.length) {
          this.setPhase('intro');
          this.time.delayedCall(700, () => this.finish());
        } else if (!st.pattern && !this.stampFree(id)) {
          // (level 1: this stamp has no outline left: the next one is picked for her)
          const nx = this.nextStamp();
          if (nx) this.selectStamp(nx);
        } else this.selectStamp(id, false);
        this.time.delayedCall(Math.max(0, T.stampMs - 150), () => (st.busy = false));
      },
    });
  }

  private aliveStamps() {
    const st = this.stamps!;
    const k = this.L.k;
    const ms: number = T.aliveMs;
    const prints = this.box.list.filter((o) => o instanceof Phaser.GameObjects.Image && o.getData('id')) as Phaser.GameObjects.Image[];
    prints.forEach((img, i) => {
      const id = img.getData('id') as StampId;
      const d = i * 90;
      if (id === 'sun') this.tweens.add({ targets: img, angle: 360, duration: ms * 0.8, delay: d, ease: 'Cubic.easeInOut' });
      if (id === 'cloud') this.tweens.add({ targets: img, x: img.x + 40 * k, duration: ms / 4, delay: d, yoyo: true, repeat: 1, ease: 'Sine.easeInOut' });
      if (id === 'flower') this.tweens.add({ targets: img, angle: { from: -10, to: 10 }, duration: ms / 8, delay: d, yoyo: true, repeat: 3, ease: 'Sine.easeInOut', onComplete: () => img.setAngle(0) });
      if (id === 'bird') this.tweens.add({ targets: img, y: img.y - 50 * k, duration: ms / 8, delay: d, yoyo: true, repeat: 3, ease: 'Quad.easeOut' });
      this.time.delayedCall(d, () => stars(this, this.sheet.x + img.x, this.sheet.y + img.y, 4, 30 * k));
    });
    for (const c of st.card) this.tweens.add({ targets: c, y: c.y - 16 * k, duration: 200, yoyo: true, delay: 300 });
  }

  // ---------------------------------------------------------------- the finished picture comes alive

  private finish() {
    if (this.finished) return;
    this.finished = true;
    this.setPhase('alive');
    this.shown.done = true;
    this.owner = null;
    this.pen = null;
    this.hand.stop();
    this.doneBtn?.destroy();
    this.doneBtn = undefined;
    // the party layer until the easel wall comes back (its music.play('art') calms it)
    music.party(true);
    const L = this.L;
    const k = L.k;
    const mid = { x: this.sheet.x + this.sheet.w / 2, y: this.sheet.y + this.sheet.h / 2 };
    sfx(this, 'cheer-jingle');
    stars(this, mid.x, mid.y, 14, 70 * k);
    confetti(this, mid.x, this.sheet.y + 40 * k, 20, 26 * k);
    this.mom?.happy();
    this.pipa?.cheer();
    this.pipa?.hideWish();
    const kind = this.kind!;
    let name: NameKey | null = null;
    let line: VoiceKey = 'vo-trace-done';
    let ms: number = T.aliveMs;
    if (kind === 'trace') (name = this.trace!.pic.name), this.aliveTrace();
    if (kind === 'dots') (name = this.dots!.pic.name), (line = 'vo-dots-done'), (ms = this.aliveDots());
    if (kind === 'colour') (line = 'vo-colour-done'), this.aliveColour();
    if (kind === 'mirror') {
      const id = this.mirror!.pic.id;
      line = id === 'plate' ? 'vo-mirror-plate' : id === 'butterfly' ? 'vo-mirror-done' : 'vo-dots-done';
      name = this.mirror!.pic.name;
      ms = this.aliveMirror();
    }
    if (kind === 'stamps') (line = 'vo-dots-done'), this.aliveStamps();
    if (kind === 'steam') (line = 'vo-steam-done'), this.aliveSteam();
    this.time.delayedCall(900, () => this.mom?.rest());
    // Mom: "Look, a sun!" (its name, for the ones she traced or joined) and the line; then back to the easel wall
    let back = false;
    const goBack = () => {
      if (back || this.leaving) return;
      back = true;
      this.time.delayedCall(Math.max(0, ms + 300 - (this.time.now - t0)), () => this.capture(() => this.time.delayedCall(700, () => this.backToWall())));
    };
    const t0 = this.time.now;
    if (kind === 'dots' || kind === 'mirror' || kind === 'stamps') this.say(line, { ttlMs: 4000, done: () => (name ? this.say(name, { ttlMs: 3000, done: goBack }) : goBack()) });
    else if (name) this.say(name, { ttlMs: 3000, done: () => this.say(line, { ttlMs: 4000, done: goBack }) });
    else this.say(line, { ttlMs: 4000, done: goBack });
    this.time.delayedCall(ms + 6500, goBack);
  }

  /** Back to the easel wall (once). */
  private backToWall() {
    if (this.restarting || this.leaving) return;
    this.restarting = true;
    this.scene.restart({ back: true });
  }

  /** Is the picture finished (the same rules as the checks along the way)? For the safety net in `tick`. */
  private complete(): boolean {
    switch (this.kind) {
      case 'trace': {
        const t = this.trace!;
        const lvl = this.level - 1;
        const share = t.cps.filter((c) => c.lit).length / t.cps.length;
        return share >= T.traceDone[lvl] && t.pic.parts.every((_, i) => {
          const mine = t.cps.filter((c) => c.part === i);
          return mine.filter((c) => c.lit).length / mine.length >= T.partDone;
        });
      }
      case 'dots':
        return this.dots!.next >= this.dots!.views.length;
      case 'colour':
        return this.colourDone();
      case 'stamps':
        return !!this.stamps && !this.stamps.busy && this.stamps.slots.every((q) => q.got);
      default:
        return false;
    }
  }

  /** Mom's help found nothing left to do while the picture waits for her: it is finished, so it finishes. */
  protected nothingToHelp() {
    if (this.phase === 'draw' && !this.finished && this.kind) this.finish();
  }

  /** A canvas the size of the sheet, its picture drawn in sheet units, shown over the sheet. */
  private aliveLayer(draw: (g: CanvasRenderingContext2D) => void) {
    const l = this.layer('alive');
    this.units(l.g);
    draw(l.g);
    l.tex.refresh();
    return l;
  }

  /** Plays a picture's coming alive on an image whose origin is the picture's middle `c` (sheet units). */
  private animate(img: Phaser.GameObjects.Image, alive: Alive, c: Pt) {
    const u = this.sheet.u;
    img.setOrigin(c[0] / SHEET_W, c[1] / SHEET_H).setPosition(c[0] * u, c[1] * u);
    const ms: number = T.aliveMs;
    const k = this.L.k;
    const tw = (cfg: Omit<Phaser.Types.Tweens.TweenBuilderConfig, 'targets'>) => this.tweens.add({ ...cfg, targets: img } as Phaser.Types.Tweens.TweenBuilderConfig);
    switch (alive) {
      case 'spin':
        tw({ angle: 360, duration: ms * 0.8, ease: 'Cubic.easeInOut' });
        break;
      case 'bounce':
        tw({ y: img.y - 60 * k, duration: ms / 6, yoyo: true, repeat: 2, ease: 'Quad.easeOut' });
        break;
      case 'wiggle':
        tw({ angle: { from: -7, to: 7 }, duration: ms / 8, yoyo: true, repeat: 3, ease: 'Sine.easeInOut', onComplete: () => img.setAngle(0) });
        break;
      case 'beat':
        tw({ scale: 1.14, duration: ms / 8, yoyo: true, repeat: 3, ease: 'Quad.easeOut' });
        break;
      case 'rock':
        tw({ angle: { from: -9, to: 9 }, y: img.y - 14 * k, duration: ms / 6, yoyo: true, repeat: 2, ease: 'Sine.easeInOut', onComplete: () => img.setAngle(0) });
        break;
      case 'twinkle': {
        tw({ scale: 1.1, angle: 8, duration: ms / 6, yoyo: true, repeat: 1, ease: 'Sine.easeInOut', onComplete: () => img.setAngle(0) });
        for (let i = 0; i < 3; i++) this.time.delayedCall(i * 420, () => stars(this, this.sheet.x + img.x, this.sheet.y + img.y, 6, 40 * k));
        break;
      }
      case 'swim': {
        const x0 = img.x;
        const room = Math.min(this.sheet.w * 0.18, 140 * k);
        this.tweens.chain({
          targets: img,
          tweens: [
            { x: x0 + room, y: img.y - 20 * k, duration: ms * 0.3, ease: 'Sine.easeInOut' },
            { scaleX: -1, duration: 160 },
            { x: x0 - room, y: img.y + 20 * k, duration: ms * 0.45, ease: 'Sine.easeInOut' },
            { scaleX: 1, duration: 160 },
            { x: x0, y: img.y, duration: ms * 0.25, ease: 'Sine.easeInOut' },
          ],
        });
        break;
      }
      default:
    }
  }

  private fadeOut(objs: (Phaser.GameObjects.Image | Phaser.GameObjects.Container | Phaser.GameObjects.Graphics | undefined)[]) {
    for (const o of objs) if (o) this.tweens.add({ targets: o, alpha: 0, duration: 350 });
  }

  private middle(pts: Pt[]): Pt {
    const xs = pts.map((p) => p[0]);
    const ys = pts.map((p) => p[1]);
    return [(Math.min(...xs) + Math.max(...xs)) / 2, (Math.min(...ys) + Math.max(...ys)) / 2];
  }

  private aliveTrace() {
    const t = this.trace!;
    const pic = t.pic;
    const col = this.css(this.brush);
    const l = this.aliveLayer((g) => {
      g.lineCap = g.lineJoin = 'round';
      pic.parts.forEach((p, i) => {
        const path = new Path2D();
        p.pts.forEach(([x, y], j) => (j ? path.lineTo(x, y) : path.moveTo(x, y)));
        if (p.closed) path.closePath();
        if (p.closed && (pic.fill?.[i] ?? true)) {
          g.fillStyle = col;
          g.globalAlpha = 0.85;
          g.fill(path);
          g.globalAlpha = 1;
        }
        if (pic.rainbow) {
          RAINBOW.forEach((c, b) => {
            g.strokeStyle = c;
            g.lineWidth = 24;
            g.beginPath();
            g.arc(pic.rainbow!.at[0], pic.rainbow!.at[1], pic.rainbow!.r + 60 - b * 24, Math.PI, Math.PI * 2);
            g.stroke();
          });
          return;
        }
        g.strokeStyle = INK_CSS;
        g.lineWidth = 9;
        g.stroke(path);
      });
      if (pic.rays) {
        g.strokeStyle = col;
        g.lineWidth = 22;
        for (let i = 0; i < 12; i++) {
          const a = (i / 12) * Math.PI * 2;
          g.beginPath();
          g.moveTo(pic.rays.at[0] + Math.cos(a) * pic.rays.r0, pic.rays.at[1] + Math.sin(a) * pic.rays.r0);
          g.lineTo(pic.rays.at[0] + Math.cos(a) * pic.rays.r1, pic.rays.at[1] + Math.sin(a) * pic.rays.r1);
          g.stroke();
        }
      }
      if (pic.face) this.face(g, pic.face.at, pic.face.r, !!pic.face.eyeOnly);
    });
    this.fadeOut([t.ink.img, t.base.img]);
    l.img.setAlpha(0);
    this.tweens.add({ targets: l.img, alpha: 1, duration: 350 });
    this.animate(l.img, pic.alive, this.middle(pic.parts.flatMap((p) => p.pts)));
  }

  private face(g: CanvasRenderingContext2D, at: Pt, r: number, eyeOnly: boolean) {
    const [x, y] = at;
    g.fillStyle = '#2E201B';
    if (eyeOnly) {
      g.beginPath();
      g.arc(x, y, r * 0.3, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = '#FFFDF7';
      g.beginPath();
      g.arc(x - r * 0.08, y - r * 0.1, r * 0.1, 0, Math.PI * 2);
      g.fill();
      return;
    }
    for (const dx of [-0.35, 0.35]) {
      g.beginPath();
      g.arc(x + dx * r, y - r * 0.12, r * 0.1, 0, Math.PI * 2);
      g.fill();
    }
    g.strokeStyle = '#2E201B';
    g.lineWidth = r * 0.07;
    g.beginPath();
    g.arc(x, y + r * 0.05, r * 0.38, 0.15 * Math.PI, 0.85 * Math.PI);
    g.stroke();
    g.fillStyle = 'rgba(240,137,122,0.7)';
    for (const dx of [-0.6, 0.6]) {
      g.beginPath();
      g.arc(x + dx * r, y + r * 0.15, r * 0.12, 0, Math.PI * 2);
      g.fill();
    }
  }

  private aliveDots(): number {
    const d = this.dots!;
    const pic = d.pic;
    const col = this.css(this.brush);
    const l = this.aliveLayer((g) => {
      const path = new Path2D();
      pic.dots.forEach(([x, y], j) => (j ? path.lineTo(x, y) : path.moveTo(x, y)));
      path.closePath();
      g.fillStyle = col;
      g.globalAlpha = 0.85;
      g.fill(path);
      g.globalAlpha = 1;
      g.strokeStyle = INK_CSS;
      g.lineWidth = 9;
      g.lineJoin = 'round';
      g.stroke(path);
      if (pic.eye) this.face(g, pic.eye, 90, true);
      if (pic.id === 'butterfly') {
        g.fillStyle = INK_CSS;
        g.fill(new Path2D('M480,300 C470,380 470,520 500,580 C530,520 530,380 520,300Z'));
      }
      if (pic.id === 'house') {
        g.fillStyle = '#FFE58A';
        // (the big house of level 2 has its door in the middle: the window goes left of it)
        const wx = pic.dots.length > 5 ? 280 : 350;
        g.fillRect(wx, 460, 90, 80);
        g.strokeRect(wx, 460, 90, 80);
      }
    });
    this.fadeOut([d.ink.img, d.base.img, d.glow, d.live, ...d.views.map((v) => v.box)]);
    l.img.setAlpha(0);
    this.tweens.add({ targets: l.img, alpha: 1, duration: 350 });
    const c = this.middle(pic.dots);
    if (pic.alive === 'fly') return this.flyTo(l.img, c);
    this.animate(l.img, pic.alive, c);
    return T.aliveMs;
  }

  /** The butterfly lifts off the paper, flaps round to Pipa's nose (Mom's head where Pipa is not here), giggles, and comes back. */
  private flyTo(img: Phaser.GameObjects.Image, c: Pt, halves?: [Phaser.GameObjects.Image, Phaser.GameObjects.Image]): number {
    const k = this.L.k;
    const u = this.sheet.u;
    img.setOrigin(c[0] / SHEET_W, c[1] / SHEET_H).setPosition(c[0] * u, c[1] * u);
    const home = { x: img.x, y: img.y };
    const who = this.pipa?.visible ? this.pipa : null;
    const to = who ? who.mouthAt : this.mom ? { x: this.mom.mouthAt.x, y: this.S.momFace.y0 } : { x: this.L.cx, y: 120 * k };
    const toLocal = { x: to.x - this.sheet.x, y: to.y - this.sheet.y - 70 * k };
    const flap = halves
      ? this.tweens.add({ targets: halves, scaleX: (_t: unknown, _k: string, v: number) => v * 0.35, duration: 140, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' })
      : this.tweens.add({ targets: img, scaleX: 0.35, duration: 140, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    const small = Math.min(0.45, (230 * k) / this.sheet.w);
    const target = halves ? img.parentContainer ?? img : img;
    this.tweens.chain({
      targets: target,
      tweens: [
        { y: home.y - 80 * k, duration: 500, ease: 'Sine.easeOut' },
        { x: toLocal.x, y: toLocal.y, scale: small, duration: 1300, ease: 'Sine.easeInOut' },
        {
          y: toLocal.y + 20 * k,
          duration: 700,
          ease: 'Sine.easeInOut',
          onStart: () => {
            if (who) who.react('giggle');
            else this.mom?.happy();
            sfx(this, 'char-giggle', { volume: 0.7 });
          },
        },
        { x: home.x, y: home.y, scale: 1, duration: 1200, ease: 'Sine.easeInOut', onComplete: () => (flap.destroy(), halves ? halves.forEach((h) => h.setScale(1)) : img.setScale(1)) },
      ],
    });
    return 3800;
  }

  private aliveColour() {
    const c = this.colour!;
    const pic = c.pic;
    const l = this.aliveLayer((g) => {
      g.setTransform(1, 0, 0, 1, 0, 0);
      g.drawImage(c.fill.tex.getSourceImage() as HTMLCanvasElement, 0, 0);
      g.drawImage(c.lines.tex.getSourceImage() as HTMLCanvasElement, 0, 0);
    });
    c.fill.img.setVisible(false);
    c.lines.img.setVisible(false);
    this.animate(l.img, pic.alive, [500, 450]);
    // (a cheer of sparkles over every area)
    c.areas.forEach((a, i) => this.time.delayedCall(i * 120, () => {
      const w = this.toWorld(a.hint);
      burst(this, w.x, w.y, { texture: 'star', count: 3, size: 26 * this.L.k, speed: 220, gravityY: 300, lifespan: 500, depth: 60 });
    }));
  }

  private aliveMirror(): number {
    const m = this.mirror!;
    const sources = [m.base, m.ink, m.top].map((l) => l.tex.getSourceImage() as HTMLCanvasElement);
    if (m.pic.alive !== 'fly') {
      const l = this.aliveLayer((g) => {
        g.setTransform(1, 0, 0, 1, 0, 0);
        for (const s of sources) g.drawImage(s, 0, 0);
      });
      for (const q of [m.base, m.ink, m.top]) q.img.setVisible(false);
      if (m.pic.alive === 'beat') this.tweens.add({ targets: l.img, scale: 1.12, duration: T.aliveMs / 8, yoyo: true, repeat: 3, ease: 'Quad.easeOut' });
      else this.tweens.add({ targets: l.img, angle: 360, duration: T.aliveMs, ease: 'Cubic.easeInOut' });
      l.img.setOrigin(0.5, 0.5).setPosition(this.sheet.w / 2, this.sheet.h / 2);
      for (let i = 0; i < 3; i++) this.time.delayedCall(i * 500, () => stars(this, this.sheet.x + this.sheet.w / 2, this.sheet.y + this.sheet.h / 2, 8, 50 * this.L.k));
      return T.aliveMs;
    }
    // the butterfly: its two wings are two pictures that flap about the body
    const l = this.aliveLayer((g) => {
      g.setTransform(1, 0, 0, 1, 0, 0);
      for (const s of sources) g.drawImage(s, 0, 0);
    });
    const w = l.tex.width;
    const h = l.tex.height;
    const half = Math.round(w / 2);
    l.tex.add('left', 0, 0, 0, half, h);
    l.tex.add('right', 0, half, 0, w - half, h);
    l.img.setVisible(false);
    const left = this.add.image(0, 0, l.key, 'left').setOrigin(1, 0.5);
    const right = this.add.image(0, 0, l.key, 'right').setOrigin(0, 0.5);
    const fly = this.add.container(half, h / 2, [left, right]);
    this.box.add(fly);
    for (const q of [m.base, m.ink, m.top]) q.img.setVisible(false);
    // (the paper stays: the butterfly has lifted off it)
    const paper = this.layer('paper-shape');
    this.units(paper.g);
    paper.g.strokeStyle = 'rgba(150,130,105,0.35)';
    paper.g.lineWidth = 5;
    paper.g.setLineDash([12, 12]);
    paper.g.stroke(m.clip);
    paper.tex.refresh();
    this.box.sendToBack(paper.img);
    this.box.sendToBack(this.box.list[1] as Phaser.GameObjects.GameObject);
    const k = this.L.k;
    const home = { x: fly.x, y: fly.y };
    const who = this.pipa?.visible ? this.pipa : null;
    const to = who ? who.mouthAt : this.mom ? { x: this.mom.mouthAt.x, y: this.S.momFace.y0 } : { x: this.L.cx, y: 120 * k };
    const toLocal = { x: to.x - this.sheet.x, y: to.y - this.sheet.y - 70 * k };
    const flap = this.tweens.add({ targets: [left, right], scaleX: 0.3, duration: 150, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    const small = Math.min(0.45, (260 * k) / this.sheet.w);
    this.tweens.chain({
      targets: fly,
      tweens: [
        { y: home.y - 80 * k, duration: 500, ease: 'Sine.easeOut' },
        { x: toLocal.x, y: toLocal.y, scale: small, duration: 1300, ease: 'Sine.easeInOut' },
        {
          y: toLocal.y + 20 * k,
          duration: 700,
          ease: 'Sine.easeInOut',
          onStart: () => {
            if (who) who.react('giggle');
            else this.mom?.happy();
            sfx(this, 'char-giggle', { volume: 0.7 });
          },
        },
        {
          x: home.x,
          y: home.y,
          scale: 1,
          duration: 1200,
          ease: 'Sine.easeInOut',
          onComplete: () => {
            flap.destroy();
            left.setScale(1);
            right.setScale(1);
            // back on the paper, whole again (the photo is of this)
            fly.destroy();
            paper.img.setVisible(false);
            for (const q of [m.base, m.ink, m.top]) q.img.setVisible(true);
          },
        },
      ],
    });
    return 3900;
  }

  private aliveSteam() {
    const st = this.steam!;
    this.tweens.add({ targets: st.fog.img, alpha: 0, duration: 900 });
    st.things.forEach((t, i) => this.time.delayedCall(300 + i * 200, () => {
      this.tweens.add({ targets: t.img, y: t.img.y - 26 * this.L.k, duration: 220, yoyo: true, ease: 'Quad.easeOut' });
      stars(this, this.sheet.x + t.img.x, this.sheet.y + t.img.y, 5, 34 * this.L.k);
    }));
  }

  // ---------------------------------------------------------------- the picture goes into the memory book and on the wall

  private capture(then: () => void) {
    const kind = this.kind;
    let called = false;
    const done = () => (called ? null : ((called = true), then()));
    this.time.delayedCall(2500, done);
    try {
      const s = this.sheet;
      const key = 'art-cv-photo';
      if (this.textures.exists(key)) this.textures.remove(key);
      const dt = this.textures.addDynamicTexture(key, Math.round(s.w), Math.round(s.h));
      if (!dt) return done();
      const at = { x: this.box.x, y: this.box.y };
      this.box.setPosition(0, 0);
      dt.draw(this.box, 0, 0);
      dt.render();
      this.box.setPosition(at.x, at.y);
      dt.snapshot((img) => {
        try {
          if (img instanceof HTMLImageElement) {
            const c = document.createElement('canvas');
            c.width = c.height = 420;
            const g = c.getContext('2d')!;
            g.fillStyle = '#FBF0DA';
            g.fillRect(0, 0, 420, 420);
            const f = Math.min(396 / img.width, 396 / img.height);
            g.drawImage(img, (420 - img.width * f) / 2, (420 - img.height * f) / 2, img.width * f, img.height * f);
            let data = c.toDataURL('image/webp', 0.75);
            if (!data.startsWith('data:image/webp')) data = c.toDataURL('image/png');
            this.shown.photo = data.length;
            if (!this.restarting && kind) void keepPhoto(`art-${kind}`, data);
            void setWallDrawing(this.game, data);
          }
        } catch {
          /* the picture is simply not kept */
        }
        if (this.textures.exists(key)) this.textures.remove(key);
        done();
      });
    } catch {
      done();
    }
  }

  // ---------------------------------------------------------------- Mom's hand

  /** A stroke for Mom's pointing finger through these sheet points, t0..t1 ms. */
  private along(pts: Pt[], t0: number, t1: number): HandKey[] {
    return pts.map((p, i) => ({ ...this.toWorld(p), t: t0 + ((t1 - t0) * i) / Math.max(1, pts.length - 1) }));
  }

  /** A little loop on the left wing (mirror), or a zigzag over a box (steam). */
  private loopPts(c: Pt, r: number): Pt[] {
    return Array.from({ length: 13 }, (_, i) => [c[0] + Math.cos((i / 12) * Math.PI * 2) * r, c[1] + Math.sin((i / 12) * Math.PI * 2) * r * 0.8] as Pt);
  }

  private zigzag(h: Hidden): Pt[] {
    const f = 800 / SHEET_W;
    const c: Pt = [h.at[0] / f, h.at[1] / f];
    const w = 90;
    return [[c[0] - w, c[1] - 50], [c[0] + w, c[1] - 30], [c[0] - w, c[1]], [c[0] + w, c[1] + 25], [c[0] - w, c[1] + 50]];
  }

  private mirrorLoop(): Pt[] {
    const m = this.mirror!;
    const spots = m.pic.spots;
    const n = (this.shown.helped as number) % spots.length;
    return this.loopPts(spots[n], m.plate ? 70 : 60);
  }

  protected way(): HandMotion | null {
    const k = this.L.k;
    if (this.phase === 'pick') {
      const c = this.cards[0];
      return c ? tapMotion({ x: c.img.x, y: c.img.y }, k) : null;
    }
    if (this.phase !== 'draw') return null;
    switch (this.kind) {
      case 'trace': {
        const run = this.traceRun();
        if (!run.length) return null;
        const keys = this.along(run, 300, 2200);
        return { kind: 'point', keys: [{ ...keys[0], t: 0 }, ...keys, { ...keys[keys.length - 1], t: 2500 }], glow: keys[0] };
      }
      case 'dots': {
        const d = this.dots!;
        const n = d.views[d.next];
        return n ? tapMotion(this.toWorld(n.at), k) : null;
      }
      case 'colour': {
        const n = this.colourNext();
        if (!n) return null;
        const at = this.toWorld(n.area.hint);
        // (on level 1 the harness child likes Mom's colours too, so the picture is not all one colour)
        const want = n.pot ?? n.area.mom;
        if (want && want !== this.brush && this.pots.some((q) => q.brush === want)) {
          const p = this.pots.find((q) => q.brush === want)!;
          return {
            kind: 'point',
            keys: [
              { x: p.x + 60 * k, y: p.y + 70 * k, t: 0 }, { x: p.x, y: p.y, t: 400 }, { x: p.x, y: p.y, t: 600, press: true }, { x: p.x, y: p.y, t: 800 },
              { x: at.x, y: at.y, t: 1600 }, { x: at.x, y: at.y, t: 1800, press: true }, { x: at.x, y: at.y, t: 2000 }, { x: at.x + 60 * k, y: at.y + 70 * k, t: 2400 },
            ],
            glow: { x: p.x, y: p.y },
          };
        }
        return tapMotion(at, k);
      }
      case 'mirror': {
        if (this.doneBtn) return tapMotion({ x: this.doneBtn.x, y: this.doneBtn.y }, k);
        const keys = this.along(this.mirrorLoop(), 300, 2200);
        return { kind: 'point', keys: [{ ...keys[0], t: 0 }, ...keys, { ...keys[keys.length - 1], t: 2500 }], glow: keys[0] };
      }
      case 'steam': {
        const h = this.steamTarget();
        if (!h) return null;
        const keys = this.along(this.zigzag(h), 300, 2200);
        return { kind: 'point', keys: [{ ...keys[0], t: 0 }, ...keys, { ...keys[keys.length - 1], t: 2500 }], glow: keys[0] };
      }
      case 'stamps': {
        const n = this.stampTarget();
        if (!n) return null;
        const st = this.stamps!;
        const at = this.toWorld(st.slots[n.i].slot.at);
        if (n.need !== st.sel) {
          const p = st.stamps.find((q) => q.id === n.need)!;
          return {
            kind: 'point',
            keys: [
              { x: p.x + 60 * k, y: p.y + 70 * k, t: 0 }, { x: p.x, y: p.y, t: 400 }, { x: p.x, y: p.y, t: 600, press: true }, { x: p.x, y: p.y, t: 800 },
              { x: at.x, y: at.y, t: 1600 }, { x: at.x, y: at.y, t: 1800, press: true }, { x: at.x, y: at.y, t: 2000 }, { x: at.x + 60 * k, y: at.y + 70 * k, t: 2400 },
            ],
            glow: { x: p.x, y: p.y },
          };
        }
        return tapMotion(at, k);
      }
      default:
        return null;
    }
  }

  /** Mom's finger draws through these sheet points over `ms`, as if it were hers (her pen), then it is hers again. */
  private helpStroke(pts: Pt[], ms: number, then?: () => void) {
    let at = this.toWorld(pts[0]);
    this.hand.follow('point', () => at);
    this.pen = { last: null, dist: 0, spark: 0, inked: false };
    const segs = pts.length - 1;
    this.tweens.addCounter({
      from: 0,
      to: segs,
      duration: ms,
      delay: 250,
      onUpdate: (tw) => {
        if (this.finished) return;
        const v = tw.getValue() ?? 0;
        const i = Math.min(segs - 1, Math.floor(v));
        const f = v - i;
        const p: Pt = [pts[i][0] + (pts[i + 1][0] - pts[i][0]) * f, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * f];
        const w = this.toWorld(p);
        this.inkTo(w);
        at = w;
      },
      onComplete: () => {
        this.pen = null;
        this.helped();
        then?.();
      },
    });
  }

  protected helpOnce() {
    if (this.phase !== 'draw') return false;
    switch (this.kind) {
      case 'trace': {
        const run = this.traceRun(7);
        if (run.length < 1) return false;
        if (run.length === 1) run.push(run[0]);
        this.helpStroke(run, T.helpMs);
        return true;
      }
      case 'dots': {
        const d = this.dots!;
        const n = d.next;
        if (n >= d.views.length) return false;
        const from = d.cur >= 0 ? this.toWorld(d.views[d.cur].at) : this.toWorld(d.views[n].at);
        const to = this.toWorld(d.views[n].at);
        let at = from;
        this.hand.follow('point', () => at);
        this.tweens.addCounter({
          from: 0, to: 1, duration: 900, delay: 250,
          onUpdate: (tw) => {
            const t = tw.getValue() ?? 0;
            at = { x: from.x + (to.x - from.x) * t, y: from.y + (to.y - from.y) * t };
            this.liveLine(at);
          },
          onComplete: () => {
            this.dots?.live.clear();
            this.helped();
            if (!this.finished) this.joinDot(n);
          },
        });
        return true;
      }
      case 'colour': {
        const n = this.colourNext();
        if (!n) return false;
        const at = this.toWorld(n.area.hint);
        const pot = n.pot ? this.pots.find((q) => q.brush === n.pot) : null;
        let to: P = pot ? { x: pot.x, y: pot.y } : at;
        this.hand.follow('point', () => to);
        const paint = () => {
          to = at;
          this.time.delayedCall(500, () => {
            this.helped();
            if (this.finished) return;
            this.paint(n.i, n.area.hint);
          });
        };
        if (pot) this.time.delayedCall(600, () => (this.selectPot(pot.brush), paint()));
        else this.time.delayedCall(300, paint);
        return true;
      }
      case 'mirror': {
        if (this.doneBtn) {
          const b = this.doneBtn;
          this.hand.follow('point', () => ({ x: b.x, y: b.y }));
          this.time.delayedCall(700, () => (this.helped(), this.finish()));
          return true;
        }
        this.helpStroke(this.mirrorLoop(), T.helpMs + 600);
        return true;
      }
      case 'steam': {
        const h = this.steamTarget();
        if (!h) return false;
        this.helpStroke(this.zigzag(h), T.helpMs + 400);
        return true;
      }
      case 'stamps': {
        const n = this.stampTarget();
        const st = this.stamps!;
        if (!n || st.busy) return false;
        const at = this.toWorld(st.slots[n.i].slot.at);
        const v = n.need !== st.sel ? st.stamps.find((q) => q.id === n.need)! : null;
        let to: P = v ? { x: v.x, y: v.y } : at;
        this.hand.follow('point', () => to);
        const stamp = () => {
          to = at;
          this.time.delayedCall(500, () => {
            this.helped();
            if (this.finished || st.slots[n.i].got) return;
            this.press(n.i);
          });
        };
        if (v) this.time.delayedCall(600, () => (this.selectStamp(v.id), stamp()));
        else this.time.delayedCall(300, stamp);
        return true;
      }
      default:
        return false;
    }
  }

  // ---------------------------------------------------------------- touch

  /** Her finger (or Mom's helping one) at a world point: whatever the current picture does with a stroke there. */
  private inkTo(at: P) {
    const pen = this.pen;
    if (!pen) return;
    const dist = pen.last ? Math.hypot(at.x - pen.last.x, at.y - pen.last.y) : 0;
    if (pen.last && dist < 1.5) return;
    const p = this.toSheet(at);
    if (this.kind === 'trace') this.traceAt(p);
    else if (this.kind === 'mirror') this.mirrorAt(p);
    else if (this.kind === 'steam') this.wipeAt(p);
    if (!pen.inked) (pen.inked = true), (this.shown.strokes = (this.shown.strokes as number) + 1);
    this.strokeFx(at, dist);
    pen.last = at;
  }

  private liveLine(at: P) {
    const d = this.dots!;
    d.live.clear();
    if (d.cur < 0) return;
    const a = d.views[d.cur].at;
    const u = this.sheet.u;
    d.live.lineStyle(this.brushR() * 1.6, Phaser.Display.Color.HexStringToColor(this.css(this.brush)).color, 0.75);
    d.live.lineBetween(a[0] * u, a[1] * u, at.x - this.sheet.x, at.y - this.sheet.y);
  }

  protected down(p: Phaser.Input.Pointer, at: P) {
    if (this.phase === 'pick') {
      const k = this.L.k;
      for (const c of this.cards) {
        const r = Math.max(110 * k, (c.img.displayWidth / 2) * 0.95);
        if (Math.abs(at.x - c.img.x) < r && Math.abs(at.y - c.img.y) < r) return this.pickCard(c.kind);
      }
      return;
    }
    if (this.phase !== 'draw' || this.finished) return;
    if (this.kind === 'stamps') return this.stampDown(at);
    const pot = this.potAt(at);
    if (pot) return pot.brush === this.brush ? boing(this, pot.img, 0.08) : this.selectPot(pot.brush);
    switch (this.kind) {
      case 'trace':
      case 'mirror':
      case 'steam':
        if (!this.onSheet(at, 20 * this.L.k)) return;
        this.pen = { last: null, dist: 0, spark: 0, inked: false };
        this.own(p);
        this.inkTo(at);
        return;
      case 'dots': {
        const d = this.dots!;
        const i = this.dotAt(at);
        if (i >= 0 && i === d.next) this.joinDot(i);
        else if (i >= 0 && !d.views[i].joined) return this.wrongDot(i);
        if (!this.onSheet(at, 60 * this.L.k) || this.phase !== 'draw') return;
        this.own(p);
        this.dotsLast = at;
        this.liveLine(at);
        return;
      }
      case 'colour': {
        const i = this.onSheet(at) ? this.areaAt(this.toSheet(at)) : -1;
        if (i >= 0) this.paint(i, this.toSheet(at));
        if (!this.onSheet(at)) return;
        this.own(p);
        return;
      }
      default:
    }
  }

  /** Stamps: a tap on a stamp picks it (Mom names it); a tap on the sheet presses the picked one into an outline. */
  private stampDown(at: P) {
    const st = this.stamps!;
    const v = this.stampViewAt(at);
    if (v) {
      if (v.id === st.sel) return boing(this, v.img, 0.08);
      // (level 1: a stamp with no outline left only wiggles)
      if (!this.stampFree(v.id)) {
        this.tweens.add({ targets: v.img, angle: { from: -8, to: 8 }, duration: 70, yoyo: true, repeat: 2, onComplete: () => v.img.setAngle(0) });
        return;
      }
      return this.selectStamp(v.id);
    }
    if (st.busy || !this.onSheet(at, 20 * this.L.k)) return;
    const i = this.slotFor(st.sel, this.toSheet(at));
    if (i >= 0) this.press(i);
  }

  protected move(p: Phaser.Input.Pointer) {
    if (this.phase !== 'draw' || this.finished) return;
    const at = { x: p.worldX, y: p.worldY };
    if (this.kind === 'dots') {
      const d = this.dots!;
      this.liveLine(at);
      const nx = d.views[d.next];
      const from = this.dotsLast ?? at;
      this.dotsLast = at;
      if (nx) {
        const w = this.toWorld(nx.at);
        // (along the finger's path since the last move: a quick drag passes the dot between two moves)
        if (segDist([w.x, w.y], [from.x, from.y], [at.x, at.y]) < T.dotTouch * this.L.k * 0.7) this.joinDot(d.next);
      }
      return;
    }
    if (this.kind === 'colour') {
      if (!this.onSheet(at)) return;
      const q = this.toSheet(at);
      const i = this.areaAt(q);
      const c = this.colour!;
      if (i >= 0 && c.areas[i].fill !== this.brush && c.anim?.i !== i) this.paint(i, q);
      return;
    }
    if (this.pen) this.inkTo(at);
  }

  protected up() {
    const pen = this.pen as { wrong?: number } | null;
    if (this.kind === 'trace' && this.trace?.dir && !this.finished && (pen?.wrong ?? 0) > T.traceWrong * this.L.k) this.wrongStroke();
    this.pen = null;
    this.dotsLast = null;
    this.dots?.live.clear();
  }

  protected lookTarget() {
    return this.owner ? { x: this.owner.worldX, y: this.owner.worldY } : null;
  }

  protected tick(delta: number) {
    if (this.colour?.anim) this.drawFills();
    // Safety nets: a picture that is finished finishes even if the check along the way was missed (and the steam's
    // wanted thing counts once it is clear, also when it was wiped before Mom asked for it); a finished picture always
    // goes back to the easel wall.
    if (this.finished) {
      this.aliveFor += delta;
      if (this.aliveFor > ALIVE_MAX_MS) this.backToWall();
    } else if (this.phase === 'draw' && !this.owner && (this.checkIn += delta) > 500) {
      this.checkIn = 0;
      if (this.kind === 'steam' && this.level === 1) this.checkSteam();
      else if (this.complete()) this.finish();
    }
    this.refog(delta);
    for (const l of this.layers) {
      if (!l.dirty) continue;
      l.dirty = false;
      l.tex.refresh();
    }
  }

  // ---------------------------------------------------------------- for the test harness

  /** What a child would do next (world points): a tap, or a drag through points. */
  /** `wrong`: a child's mistake instead (`wrong: true` in the answer when this move is the mistake itself). */
  plan(wrong = false): { tap?: P; drag?: P[]; wrong?: boolean } | null {
    const k = this.L.k;
    if (this.phase === 'pick') return null;
    if (this.phase !== 'draw' || this.finished) return null;
    switch (this.kind) {
      case 'trace': {
        const t = this.trace!;
        const part = t.cps.find((c) => !c.lit)?.part;
        if (part === undefined) return null;
        // a wobbly stroke along the whole part, a little off the line (level 2: less wobbly, the arrows' way; wrong: the other way)
        const d = t.dense[part];
        const w = t.dir ? 5 : 14;
        const pts = d.filter((_, i) => i % 4 === 0).map((q, i) => this.toWorld([q[0] + Math.sin(i) * w, q[1] + Math.cos(i * 1.3) * w]));
        if (wrong && t.dir) return { drag: pts.reverse(), wrong: true };
        return { drag: pts };
      }
      case 'dots': {
        const d = this.dots!;
        const n = d.views[d.next];
        // (level 2: she listens for the number first)
        if (this.level === 2 && n && d.asked !== d.next) return null;
        if (wrong && this.level === 2 && n) {
          const o = d.views.findIndex((v, i) => !v.joined && i !== d.next && Math.hypot(...([0, 1] as const).map((j) => (v.at[j] - n.at[j]) * this.sheet.u) as [number, number]) > T.dotTouch * k * 1.2);
          if (o >= 0) return { tap: this.toWorld(d.views[o].at), wrong: true };
        }
        return n ? { tap: this.toWorld(n.at) } : null;
      }
      case 'stamps': {
        const n = this.stampTarget();
        const st = this.stamps!;
        if (!n || st.busy) return null;
        if (wrong && st.pattern) {
          // level 2: another stamp than Mom's next one, then pressed
          if (st.sel === n.need) return { tap: (({ x, y }) => ({ x, y }))(st.stamps.find((q) => q.id !== n.need)!) };
          return { tap: this.toWorld(st.slots[n.i].slot.at), wrong: true };
        }
        if (wrong) {
          // level 1: a tap on an outline of another shape (the stamp still lands on its own shape's)
          const o = st.slots.find((q) => !q.got && q.slot.shape !== st.sel);
          if (o && this.stampFree(st.sel)) return { tap: this.toWorld(o.slot.at), wrong: true };
        }
        if (n.need !== st.sel) {
          const v = st.stamps.find((q) => q.id === n.need)!;
          return { tap: { x: v.x, y: v.y } };
        }
        return { tap: this.toWorld(st.slots[n.i].slot.at) };
      }
      case 'colour': {
        const n = this.colourNext();
        if (!n) return null;
        // (on level 1 the harness child likes Mom's colours too, so the picture is not all one colour)
        const want = n.pot ?? n.area.mom;
        if (want && want !== this.brush && this.pots.some((q) => q.brush === want)) {
          const p = this.pots.find((q) => q.brush === want)!;
          return { tap: { x: p.x, y: p.y } };
        }
        return { tap: this.toWorld(n.area.hint) };
      }
      case 'mirror': {
        if (this.doneBtn) return { tap: { x: this.doneBtn.x, y: this.doneBtn.y } };
        const m = this.mirror!;
        const pts: P[] = [];
        // scribbles over the left half, row by row
        const rows = m.plate ? [180, 260, 340, 420, 500, 580] : [180, 260, 340, 460, 560, 640];
        const row = rows[(this.shown.strokes as number) % rows.length];
        for (let x = m.plate ? 160 : 170; x < 480; x += 40) pts.push(this.toWorld([x, row + (x % 80 ? 25 : -25)]));
        return { drag: pts };
      }
      case 'steam': {
        const h = this.steamTarget();
        if (this.level === 2 && h) return { drag: this.zigzag(h).map((q) => this.toWorld(q)) };
        // rows across the glass
        const row = 80 + (((this.shown.strokes as number) * 90) % 640);
        const pts: P[] = [];
        for (let x = 60; x <= 940; x += 80) pts.push(this.toWorld([x, row]));
        return { drag: pts };
      }
      default:
        void k;
        return null;
    }
  }

  /** The card of a kind, for the test harness. */
  cardOf(kind: Kind) {
    const c = this.cards.find((q) => q.kind === kind);
    return c ? { x: c.img.x, y: c.img.y } : null;
  }
}
