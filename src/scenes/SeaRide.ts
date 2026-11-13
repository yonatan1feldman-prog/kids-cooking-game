import Phaser from 'phaser';
import { countKey, voice } from '../core/audio';
import { ART } from '../core/assets';
import { burst, stars } from '../core/fx';
import type { HandMotion } from '../core/hand';
import { byVisit, RIDE, RIDE_PATHS, writeMark, type Pt } from '../core/sea';
import { sfx } from '../core/sfx';
import { Character } from '../steps/Character';
import { visits, type P } from './MiniGame';
import { breath, MARINA, SeaGame } from './SeaGame';

/** A stretch of Marina's way: a dense polyline with its length; a fork has the way over the red ring and the way through it. */
interface Leg {
  main: { pts: Pt[]; acc: number[] };
  /** A fork: `over` rises over the red ring (the way on), `main` goes straight at it (she bumps and comes back). */
  over?: { pts: Pt[]; acc: number[] };
  /** Where this leg starts and ends along the main path (its distance). */
  d0: number;
  d1: number;
}
type Line = Leg['main'];

const RING_TINTS = [0xffd54f, 0xf48fb1, 0x80deea, 0xb39ddb, 0xa5d6a7];
const RED = 0xf0524f;
/** Marina's frame scale (600x700 at k 1): about 190 units wide, small enough to swim through a ring. */
const RIDER = 0.32;

function line(pts: Pt[]): Line {
  const acc = [0];
  for (let i = 1; i < pts.length; i++) acc.push(acc[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y));
  return { pts, acc };
}
const len = (l: Line) => l.acc[l.acc.length - 1];
function at(l: Line, d: number): Pt {
  const { pts, acc } = l;
  if (d <= 0) return pts[0];
  if (d >= len(l)) return pts[pts.length - 1];
  let lo = 0;
  let hi = acc.length - 1;
  while (hi - lo > 1) {
    const m = (lo + hi) >> 1;
    if (acc[m] <= d) lo = m;
    else hi = m;
  }
  const t = (d - acc[lo]) / (acc[hi] - acc[lo] || 1);
  return { x: pts[lo].x + (pts[hi].x - pts[lo].x) * t, y: pts[lo].y + (pts[hi].y - pts[lo].y) * t };
}
/** A part of a line, from distance a to b, sampled every `step`. */
function part(l: Line, a: number, b: number, step = 8): Pt[] {
  const out: Pt[] = [];
  for (let d = a; d < b; d += step) out.push(at(l, d));
  out.push(at(l, b));
  return out;
}

/**
 * The swim with Marina (mermaid-spec 3.2, Pipa's bubble ride with Marina in her place; mermaid PR 2): a dotted path winds
 * through the water from Marina (left) to a treasure chest (right), through five big rings, with pearls along the way.
 * Her finger leads Marina: Marina glides after it while it is near the path ahead (never back, never off it; lifting the
 * finger just leaves her there, she goes on from the same place). A ring she swims through rings and glows; a pearl
 * flies to her and Mom counts it aloud. Little fish dart away as she comes and gather again. Easy: 5 pearls. Hard: 8, and
 * two red rings: the path forks round each, over it and straight through it ("Go over the red one!"); straight at the
 * red ring Marina just bumps softly and swims back to the fork (nothing is lost). At the chest it opens, and Mom counts
 * the pearls again as Marina puts them in (the same number twice: the learning). The photo; the chest stays open in the
 * lagoon.
 */
export class SeaRide extends SeaGame {
  protected readonly id = 'sea-ride';
  protected readonly waiting = ['swim'] as const;
  private legs: Leg[] = [];
  private mainLine!: Line;
  private li = 0;
  private s = 0;
  /** At a fork: which way she took (null = still at the fork). */
  private way2: 'over' | 'main' | null = null;
  private rider!: Character;
  private rings: { d: number; back: Phaser.GameObjects.Image; front: Phaser.GameObjects.Image; at: Pt; passed: boolean }[] = [];
  private reds: { fork: number; at: Pt; back: Phaser.GameObjects.Image; front: Phaser.GameObjects.Image }[] = [];
  private pearls: { d: number; fork?: number; img: Phaser.GameObjects.Image; at: Pt; got: boolean }[] = [];
  private fish: { img: Phaser.GameObjects.Image; home: Pt; away: boolean }[] = [];
  private dots!: Phaser.GameObjects.Graphics;
  private overGlow!: Phaser.GameObjects.Graphics;
  private chest!: Phaser.GameObjects.Image;
  private got = 0;
  private finger: P | null = null;
  private auto: { until: number } | null = null;
  private bumping = false;
  private told = { ring: false, over: false };
  private bubbleAt = 0;

  constructor() {
    super('SeaRide');
  }

  /** Marina is the one swimming: no one sits beside Mom. */
  protected withPipa() {
    return false;
  }

  protected build() {
    const L = this.L;
    const S = this.S;
    const k = L.k;
    this.water();
    this.li = 0;
    this.s = 0;
    this.way2 = null;
    this.got = 0;
    this.finger = null;
    this.auto = null;
    this.bumping = false;
    this.told = { ring: false, over: false };
    this.rings = [];
    this.reds = [];
    this.pearls = [];
    this.fish = [];

    // The room: from the left edge (under the home button) to in front of Mom's face, over the sand.
    const box = { x0: L.m + 70 * k, x1: S.momFace.x0 - 60 * k, y0: L.Y(200), y1: L.Y(930) };
    const raw = byVisit(RIDE_PATHS, visits('sea-ride-path')).map(([x, y]) => ({ x: box.x0 + (box.x1 - box.x0) * x, y: box.y0 + (box.y1 - box.y0) * y }));
    // (the chest at its end stays above Mom's tail, which curls over the sand from the left edge of her frame)
    const momLeft = S.mom.x - ART.mom.cx * S.mom.scale;
    const tailTop = L.H - (800 - 520) * S.mom.scale;
    const last = raw[raw.length - 1];
    if (last.x > momLeft - 60 * k) last.y = Math.min(last.y, tailTop - 110 * k);
    // a smooth line through the points (Catmull-Rom), sampled finely
    const pts: Pt[] = [];
    for (let i = 0; i < raw.length - 1; i++) {
      const p0 = raw[Math.max(i - 1, 0)], p1 = raw[i], p2 = raw[i + 1], p3 = raw[Math.min(i + 2, raw.length - 1)];
      for (let j = 0; j < 24; j++) {
        const t = j / 24, t2 = t * t, t3 = t2 * t;
        const f = (a: number, b: number, c: number, d: number) => 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
        pts.push({ x: f(p0.x, p1.x, p2.x, p3.x), y: f(p0.y, p1.y, p2.y, p3.y) });
      }
    }
    pts.push(raw[raw.length - 1]);
    const M = (this.mainLine = line(pts));
    const total = len(M);

    // Hard: two forks round red rings, where the path runs low (room to rise over them), apart from each other.
    const forks: number[] = [];
    if (this.level === 2) {
      const cand: { f: number; y: number }[] = [];
      // (only where the path runs low enough for the way over to rise above the ring and stay in the water)
      const low = box.y0 + (box.y1 - box.y0) * 0.55;
      for (let f = 0.22; f <= 0.82; f += 0.01) cand.push({ f, y: at(M, f * total).y });
      cand.sort((a, b) => b.y - a.y);
      for (const c of cand) if (forks.length < RIDE.forks && c.y >= low && forks.every((g) => Math.abs(g - c.f) > 0.26)) forks.push(c.f);
      // (a path without two low places: the lowest of the rest; its way over rises less, see below)
      for (const c of cand) if (forks.length < RIDE.forks && forks.every((g) => Math.abs(g - c.f) > 0.26)) forks.push(c.f);
      forks.sort((a, b) => a - b);
    }
    const half = RIDE.forkHalf * total;
    const rise = RIDE.forkRise * (box.y1 - box.y0);
    let d = 0;
    this.legs = [];
    for (const f of forks) {
      const a = f * total - half;
      const b = f * total + half;
      this.legs.push({ main: line(part(M, d, a)), d0: d, d1: a });
      const straight = part(M, a, b);
      // (never above the water's top: the way over rises at most to the room's top edge)
      const r = Math.max(rise * 0.75, Math.min(rise, at(M, f * total).y - box.y0 + 40 * k));
      const over = straight.map((p, i) => ({ x: p.x, y: p.y - r * Math.sin((Math.PI * i) / (straight.length - 1)) }));
      this.legs.push({ main: line(straight), over: line(over), d0: a, d1: b });
      d = b;
    }
    this.legs.push({ main: line(part(M, d, total)), d0: d, d1: total });
    // The rings and pearls in turn along the free stretches of the path (not on a fork), evenly spaced: easy ring,
    // pearl, ring, pearl...; hard the same with one pearl more, and one pearl over each red ring.
    const free: [number, number][] = [];
    {
      let a = 0.07;
      for (const f of forks) {
        free.push([a, f - RIDE.forkHalf - 0.04]);
        a = f + RIDE.forkHalf + 0.04;
      }
      free.push([a, 0.95]);
    }
    const freeLen = free.reduce((t, [a, b]) => t + Math.max(0, b - a), 0);
    const placeAt = (u: number) => {
      let x = u * freeLen;
      for (const [a, b] of free) {
        if (x <= b - a) return a + x;
        x -= b - a;
      }
      return 0.95;
    };
    const order = this.level === 2 ? 'RPRPRPPRPRP' : 'RPRPRPRPRP';
    const slots = [...order].map((c, i) => ({ c, f: placeAt((i + 0.5) / order.length) }));

    // The dots of the way (both ways at a fork), and a soft glow on the way over (when Mom shows it).
    this.dots = this.add.graphics().setDepth(6);
    this.overGlow = this.add.graphics().setDepth(5).setAlpha(0);
    this.drawDots();

    // The rings (each its back half behind Marina, its front half over her), the red ones at the forks.
    const ringScale = 0.95 * k;
    const ring = (p: Pt, tint: number) => ({
      back: this.add.image(p.x, p.y, 'ring-back').setScale(ringScale).setTint(tint).setDepth(28),
      front: this.add.image(p.x, p.y, 'ring-front').setScale(ringScale).setTint(tint).setDepth(32),
    });
    slots.filter((q) => q.c === 'R').map((q) => q.f).forEach((f, i) => {
      const p = at(M, f * total);
      this.rings.push({ d: f * total, at: p, passed: false, ...ring(p, RING_TINTS[i % RING_TINTS.length]) });
    });
    forks.forEach((f, i) => {
      const p = at(M, f * total);
      const r = ring(p, RED);
      r.back.setScale(ringScale * 1.08);
      r.front.setScale(ringScale * 1.08);
      this.reds.push({ fork: i, at: p, ...r });
    });
    // The pearls: on the path between the rings, and (hard) one over each red ring.
    const pearl = (p: Pt) => {
      const img = this.add.image(p.x, p.y, 'pearl').setScale(0.75 * k).setDepth(26);
      this.tweens.add({ targets: img, y: p.y - 8 * k, duration: 1300 + Phaser.Math.Between(0, 500), yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      return img;
    };
    slots.filter((q) => q.c === 'P').map((q) => q.f).forEach((f) => {
      const p = at(M, f * total);
      this.pearls.push({ d: f * total, at: p, img: pearl(p), got: false });
    });
    this.legs.forEach((g, i) => {
      if (!g.over) return;
      const p = at(g.over, len(g.over) / 2);
      this.pearls.push({ d: (g.d0 + g.d1) / 2, fork: i, at: p, img: pearl(p), got: false });
    });
    this.shown.pearls = this.pearls.length;
    this.shown.forks = forks.length;

    // The chest at the end of the path, closed; little fish here and there by the way.
    const end = at(M, total);
    this.chest = this.add.image(end.x + 30 * k, end.y + 30 * k, 'chest-closed').setScale(0.7 * k).setDepth(20);
    for (const f of [0.18, 0.52, 0.8]) {
      const p = at(M, f * total);
      const home = { x: p.x + Phaser.Math.Between(-40, 40) * k, y: p.y + (f === 0.52 ? -120 : 130) * k };
      const img = this.add.image(home.x, home.y, 'little-fish').setScale(0.8 * k).setDepth(8).setFlipX(Math.random() < 0.5);
      this.tweens.add({ targets: img, y: home.y - 10 * k, duration: 1500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      this.fish.push({ img, home, away: false });
    }

    // Marina at the start of the path.
    const start = at(M, 0);
    this.rider = new Character(this, MARINA, { x: start.x, y: start.y, scale: RIDER * k }, { x: start.x, y: start.y, scale: RIDER * k });
    this.rider.box.setDepth(30);
    this.rider.enter(300);
    this.time.delayedCall(700, () => this.begin('swim', 'vo-ride-start'));
  }

  // ---------------------------------------------------------------- the way

  /** The line she is on now (at a fork before she chose: the way over, for Mom's hand). */
  private current(): Line {
    // (past the last leg: at the chest, the end of the last one)
    const g = this.legs[Math.min(this.li, this.legs.length - 1)];
    return g.over && this.way2 !== 'main' ? g.over : g.main;
  }

  private riderAt(): Pt {
    if (this.li >= this.legs.length) return at(this.current(), Infinity);
    return at(this.current(), this.s);
  }

  /** How far along the main path she is (at a fork: in proportion). */
  private progress() {
    const g = this.legs[this.li];
    if (!g) return len(this.mainLine);
    return g.d0 + (g.d1 - g.d0) * Math.min(1, this.s / (len(this.current()) || 1));
  }

  private drawDots() {
    const k = this.L.k;
    const g = this.dots;
    g.clear();
    const gap = RIDE.dotGap * k;
    const r = 9 * k;
    const prog = this.progress();
    this.legs.forEach((leg, i) => {
      for (const ln of [leg.main, leg.over].filter(Boolean) as Line[]) {
        const passedLeg = i < this.li;
        for (let d = 0; d <= len(ln); d += gap) {
          const p = at(ln, d);
          const done = passedLeg || (i === this.li && ln === this.current() && d < this.s) || (!leg.over && i === this.li && leg.d0 + d < prog);
          g.fillStyle(0xffffff, done ? 0.28 : 0.85).fillCircle(p.x, p.y, done ? r * 0.8 : r);
        }
      }
    });
    // (the way over each red ring, ready to glow)
    const o = this.overGlow;
    o.clear();
    for (const leg of this.legs) if (leg.over) for (let d = 0; d <= len(leg.over); d += gap) {
      const p = at(leg.over, d);
      o.fillStyle(0xfff1b8, 0.9).fillCircle(p.x, p.y, r * 2.2);
    }
  }

  /** The point of `ln` nearest to `f` from `s` up to the look-ahead, and how near it is. */
  private ahead(ln: Line, s: number, f: P) {
    const k = this.L.k;
    const end = Math.min(len(ln), s + RIDE.lookAhead * k);
    let best = s;
    let bd = Infinity;
    for (let d = s, last = false; !last; d += 6 * k) {
      // (the line's end is always tried: a step past it would leave her just short of it for ever)
      if (d >= end) (d = end), (last = true);
      const p = at(ln, d);
      const dd = Math.hypot(p.x - f.x, p.y - f.y);
      if (dd < bd) (bd = dd), (best = d);
    }
    return { d: best, dist: bd };
  }

  protected tick(delta: number) {
    if (this.phase !== 'swim' || this.bumping) return;
    const k = this.L.k;
    const g = this.legs[this.li];
    if (!g) return;
    let target = this.s;
    // (Mom's help cut short by its safety net: Marina is hers again)
    if (this.auto && !this.helping) this.auto = null;
    if (this.auto) {
      // Mom's help: she leads Marina on, the way over at a fork
      if (g.over && !this.way2) this.way2 = 'over';
      target = this.s + 1e9;
      if (this.progress() >= this.auto.until) {
        this.auto = null;
        this.helped();
        return;
      }
    } else if (this.finger && this.owner) {
      const f = this.finger;
      if (g.over && !this.way2) {
        const a = this.ahead(g.over, this.s, f);
        const b = this.ahead(g.main, this.s, f);
        const pick = a.dist <= b.dist ? { way: 'over' as const, ...a } : { way: 'main' as const, ...b };
        if (pick.dist < RIDE.reach * k) {
          target = pick.d;
          // (she has chosen once she is a little way along one of them)
          if (pick.d > 30 * k) this.way2 = pick.way;
        }
      } else {
        const a = this.ahead(this.current(), this.s, f);
        if (a.dist < RIDE.reach * k) target = a.d;
      }
    }
    if (target <= this.s) return;
    const step = RIDE.speed * k * (this.auto ? 0.55 : 1) * (delta / 1000);
    this.s = Math.min(target, this.s + step, len(this.current()));
    this.swimTo();
    this.poke();
    // straight at a red ring: a soft bump, and back to the fork
    if (g.over && this.way2 === 'main' && this.s >= len(g.main) / 2 - 95 * k) return this.bump();
    if (this.s >= len(this.current()) - 0.5) {
      this.li++;
      this.s = 0;
      this.way2 = null;
      if (this.li >= this.legs.length) return this.arrive();
    }
    this.passing();
  }

  /** Marina where she is on the way, tilted a little the way she swims, a few bubbles behind her. */
  private swimTo() {
    const p = this.riderAt();
    const b = this.rider.box;
    const dx = p.x - b.x;
    const dy = p.y - b.y;
    b.setPosition(p.x, p.y);
    this.rider.rest = { x: p.x, y: p.y };
    if (Math.abs(dx) + Math.abs(dy) > 0.5) b.setAngle(Phaser.Math.Clamp(Math.atan2(dy, Math.abs(dx) + 1) * 30, -18, 18));
    if (this.time.now - this.bubbleAt > 450) {
      this.bubbleAt = this.time.now;
      breath(this, p.x - 70 * this.L.k, p.y - 40 * this.L.k, this.L.k, 2);
    }
    this.drawDots();
  }

  /** Rings she swims through, pearls she reaches, fish she comes near. */
  private passing() {
    const k = this.L.k;
    const prog = this.progress();
    const me = this.riderAt();
    this.rings.forEach((r, i) => {
      if (r.passed || prog < r.d) return;
      r.passed = true;
      this.shown.rings = this.rings.filter((q) => q.passed).length;
      sfx(this, 'ring-ding', { rate: 1 + i * 0.12, vary: false });
      this.tweens.add({ targets: [r.back, r.front], scale: { from: r.front.scale * 1.18, to: r.front.scale }, duration: 420, ease: 'Back.easeOut' });
      r.front.setTint(0xffffff);
      r.back.setTint(0xffffff);
      this.time.delayedCall(160, () => (r.front.setTint(RING_TINTS[i % RING_TINTS.length]), r.back.setTint(RING_TINTS[i % RING_TINTS.length])));
      stars(this, r.at.x, r.at.y, 5, 40 * k); // (5: with a pearl, Marina's cheer and her bubbles at once the swim stays under 40 particles; premium QA)
      if (!this.told.ring) (this.told.ring = true), this.say('vo-ride-ring', { ttlMs: 2500 });
    });
    for (const q of this.pearls) {
      if (q.got) continue;
      if (q.fork !== undefined ? q.fork === this.li && this.way2 === 'over' && this.s >= len(this.current()) / 2 - 30 * k : prog >= q.d - 20 * k) this.collect(q);
      else if (Math.hypot(q.at.x - me.x, q.at.y - me.y) < 70 * k) this.collect(q);
    }
    for (const f of this.fish) {
      if (f.away || Math.hypot(f.home.x - me.x, f.home.y - me.y) > 200 * k) continue;
      f.away = true;
      const sx = f.home.x < me.x ? -1 : 1;
      f.img.setFlipX(sx > 0);
      this.tweens.add({ targets: f.img, x: f.home.x + sx * 220 * k, duration: 380, ease: 'Quad.easeOut' });
      this.time.delayedCall(2200, () => {
        f.img.setFlipX(sx < 0);
        this.tweens.add({ targets: f.img, x: f.home.x, duration: 1400, ease: 'Sine.easeInOut', onComplete: () => (f.away = false) });
      });
    }
  }

  private collect(q: (typeof this.pearls)[number]) {
    q.got = true;
    const n = ++this.got;
    this.shown.got = n;
    this.tweens.killTweensOf(q.img);
    sfx(this, 'pearl-plink', { rate: 1 + (n - 1) * 0.06, vary: false });
    const b = this.rider.box;
    this.tweens.add({ targets: q.img, x: b.x, y: b.y + 20 * this.L.k, scale: 0.2 * this.L.k, duration: 360, ease: 'Quad.easeIn', onComplete: () => q.img.setVisible(false) });
    burst(this, q.at.x, q.at.y, { texture: 'fx-sparkle', count: 3, tint: [0xffffff, 0xffe7ec], size: 26 * this.L.k, speed: 240, gravityY: -60, lifespan: 500, depth: 60 });
    voice.say(countKey(n), { group: 'count', ttlMs: 2500, valid: () => this.scene.isActive() && !this.leaving });
    this.rider.cheer();
  }

  /** Straight at the red ring: a soft bump, Marina swims back to the fork, Mom shows the way over. */
  private bump() {
    this.bumping = true;
    this.shown.bumped = ((this.shown.bumped as number) || 0) + 1;
    const g = this.legs[this.li];
    sfx(this, 'ride-bump', { vary: false });
    const b = this.rider.box;
    this.tweens.add({ targets: b, angle: { from: -12, to: 12 }, duration: 90, yoyo: true, repeat: 2, onComplete: () => b.setAngle(0) });
    const from = this.s;
    const o = { s: from };
    this.tweens.add({
      targets: o,
      s: 0,
      delay: 400,
      duration: 900,
      ease: 'Sine.easeInOut',
      onUpdate: () => {
        const p = at(g.main, o.s);
        b.setPosition(p.x, p.y);
        this.rider.rest = { x: p.x, y: p.y };
      },
      onComplete: () => {
        this.s = 0;
        this.way2 = null;
        this.bumping = false;
        this.drawDots();
      },
    });
    this.say('vo-ride-over', { ttlMs: 3000 });
    this.tweens.add({ targets: this.overGlow, alpha: { from: 0, to: 0.7 }, duration: 400, yoyo: true, repeat: 2 });
    this.miss();
  }

  // ---------------------------------------------------------------- touch

  protected down(p: Phaser.Input.Pointer, at2: P) {
    if (this.phase !== 'swim' || this.bumping || this.auto) return;
    const k = this.L.k;
    const me = this.riderAt();
    const g = this.legs[this.li];
    const near =
      Math.hypot(at2.x - me.x, at2.y - me.y) < 230 * k ||
      this.ahead(this.current(), this.s, at2).dist < RIDE.reach * k ||
      (!!g?.over && this.ahead(g.main, this.s, at2).dist < RIDE.reach * k);
    if (!near) return this.miss();
    this.own(p);
    this.finger = at2;
  }

  protected move(p: Phaser.Input.Pointer) {
    this.finger = { x: p.worldX, y: p.worldY };
  }

  protected up() {
    this.finger = null;
  }

  protected lookTarget(): P | null {
    return this.finger ?? this.riderAt();
  }

  update(t: number, delta: number) {
    super.update(t, delta);
    const f = this.finger ?? this.hand.position;
    if (f) this.rider?.lookAt(f.x, f.y);
  }

  // ---------------------------------------------------------------- Mom's hand, her help

  protected way(): HandMotion | null {
    if (this.phase !== 'swim') return null;
    const k = this.L.k;
    const ln = this.current();
    const keys = [];
    const span = Math.min(len(ln) - this.s, 420 * k);
    const me = this.riderAt();
    keys.push({ x: me.x + 50 * k, y: me.y + 60 * k, t: 0 }, { x: me.x, y: me.y, t: 300 }, { x: me.x, y: me.y, t: 450, press: true });
    for (let i = 1; i <= 5; i++) {
      const p = at(ln, this.s + (span * i) / 5);
      keys.push({ x: p.x, y: p.y, t: 450 + i * 280, press: true });
    }
    keys.push({ ...keys[keys.length - 1], t: 450 + 6 * 280 });
    return { kind: 'point', keys, glow: me };
  }

  protected helpOnce(): boolean {
    if (this.phase !== 'swim' || this.bumping) return false;
    const prog = this.progress();
    // (to the next ring or pearl, or a good way on)
    const stops = [...this.rings.filter((r) => !r.passed).map((r) => r.d), ...this.pearls.filter((q) => !q.got).map((q) => q.d), len(this.mainLine)];
    const next = Math.min(...stops.filter((d) => d > prog + 10));
    this.auto = { until: Math.min(next + 40 * this.L.k, len(this.mainLine)) };
    this.hand.follow('point', () => {
      const p = this.riderAt();
      return { x: p.x + 20 * this.L.k, y: p.y + 30 * this.L.k };
    });
    return true;
  }

  // ---------------------------------------------------------------- the treasure

  private arrive() {
    this.setPhase('end');
    this.auto = null;
    if (this.helping) this.helped();
    this.hand.stop();
    this.shown.arrived = true;
    const L = this.L;
    const k = L.k;
    // the pearls she missed (none, nearly always) come along anyway: the chest gets every pearl
    for (const q of this.pearls) if (!q.got) this.collect(q);
    const c = this.chest;
    this.time.delayedCall(600, () => {
      sfx(this, 'shell-open');
      c.setTexture('chest-open');
      this.tweens.add({ targets: c, scale: { from: c.scale * 0.9, to: c.scale }, duration: 360, ease: 'Back.easeOut' });
      stars(this, c.x, c.y - 60 * k, 14, 50 * k);
      this.say('vo-ride-chest', { ttlMs: 4000 });
      this.mom?.happy();
      this.rider.cheer();
    });
    // Marina puts the pearls in one by one, Mom counts them again
    const n = this.pearls.length;
    const t0 = 3200;
    for (let i = 1; i <= n; i++) {
      this.time.delayedCall(t0 + (i - 1) * 850, () => {
        if (!this.scene.isActive()) return;
        const b = this.rider.box;
        const pr = this.add.image(b.x, b.y, 'pearl').setScale(0.5 * k).setDepth(40);
        const into = { x: c.x + Phaser.Math.Between(-60, 60) * k, y: c.y - 40 * k };
        this.tweens.add({ targets: pr, x: into.x, y: into.y, duration: 420, ease: 'Sine.easeInOut', onComplete: () => {
          sfx(this, 'pearl-plink', { rate: 1 + (i - 1) * 0.06, vary: false });
          this.tweens.add({ targets: pr, scale: 0.42 * k, duration: 120 });
        } });
        this.tweens.add({ targets: pr, y: { from: b.y, to: into.y - 90 * k }, duration: 210, yoyo: true, ease: 'Quad.easeOut' });
        voice.say(countKey(i), { group: 'count', ttlMs: 2500, valid: () => this.scene.isActive() && !this.leaving });
      });
    }
    writeMark('pearls', true);
    this.time.delayedCall(t0 + n * 850 + 600, () => {
      if (!this.scene.isActive() || this.leaving) return;
      this.shown.done = true;
      this.praise(c.x, c.y - 100 * k, () => {
        const side = Math.min(L.H * 0.8, 760 * k);
        this.seaPhoto('ride', { x: c.x - side * 0.62, y: c.y - side * 0.62, w: side, h: side }, { x: L.cx - 120 * k, y: L.cy }, () => {
          this.time.delayedCall(1200, () => this.goodbye('vo-ride-done'));
        });
      }, 300);
    });
  }
}
