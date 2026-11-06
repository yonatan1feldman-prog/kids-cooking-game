import Phaser from 'phaser';
import { FX_SOFT, type ImageKey } from '../core/assets';
import { voice, type VoiceKey } from '../core/audio';
import { boing, puff, stars } from '../core/fx';
import { tapMotion, type HandMotion } from '../core/hand';
import { sfx } from '../core/sfx';
import { SEA3, seaRock, seaWork, setMark } from '../core/seaSort';
import type { P } from './MiniGame';
import { breath, SeaGame } from './SeaGame';

const T = SEA3.clean;
type Colour = 'blue' | 'green';

/** The rubbish: green or blue (the hard level sorts it into the net bag of its colour). */
const KIND: Record<string, Colour> = {
  'trash-bottle': 'green',
  'trash-straw': 'green',
  'trash-net': 'green',
  'trash-can': 'blue',
  'trash-bag': 'blue',
  'trash-tyre': 'blue',
};

interface Trash {
  key: ImageKey;
  colour: Colour;
  img: Phaser.GameObjects.Image;
  home: P;
  scale: number;
  /** loose: on the sea floor, hers to take; hidden: behind a seaweed; stuck: on the dolphin or the turtle; in: in a net. */
  state: 'loose' | 'hidden' | 'stuck' | 'in';
  angle: number;
}

interface Weed {
  img: Phaser.GameObjects.Image;
  at: P;
  scale: number;
  open: boolean;
  hides: Trash | 'seahorse' | null;
}

interface Friend {
  kind: 'dolphin' | 'turtle';
  img: Phaser.GameObjects.Image;
  at: P;
  scale: number;
  stuck: boolean;
  /** The net on the dolphin's back fin, the bag on the turtle's head. */
  cover: Trash;
  /** Where the cover sits, from the animal's centre, at its scale. */
  coverAt: P;
  rub: number;
}

interface Net {
  colour: Colour;
  img: Phaser.GameObjects.Image;
  at: P;
  scale: number;
  glow: Phaser.GameObjects.Image;
  count: number;
}

type Plan =
  | { kind: 'carry'; t: Trash; to: P }
  | { kind: 'rub'; f: Friend }
  | { kind: 'bag'; f: Friend; to: P }
  | { kind: 'weed'; w: Weed };

/**
 * Cleaning the lagoon (research/mermaid-spec.md 3.3): a corner of the lagoon is murky, and rubbish lies about on the sea
 * floor (a bottle, a straw, a can, a bag, a little rubber tyre). She drags each piece into the net bag on the left
 * (a tap works too, on the easy level), it splashes in, and the water clears a little with every piece (the change is
 * in the water itself). A little dolphin is caught in a net among the corals: she rubs the net off (circles, like
 * stirring), it drops, and it goes in the net bag too; the dolphin clicks, does a flip and gives Marina a kiss, and Mom
 * tells something true about dolphins. A seaweed hides a seahorse (a tap moves it aside).
 * Hard: two net bags, blue and green, and each piece goes in the one of its own colour (a wrong one: it hops out gently,
 * the right bag glows, Mom says its colour); two pieces hide behind seaweed; a turtle has a bag over her head, which she
 * pulls off. Nothing is timed, nothing is lost. At the end the water is clear, the dolphin (and the turtle) swim a happy
 * round and go, a photo for the memory book, and back to the lagoon, which stays clean (`lagoon.clean`).
 */
export class SeaClean extends SeaGame {
  protected readonly id = 'sea-clean';
  protected readonly waiting = ['clean'] as const;
  private trash: Trash[] = [];
  private weeds: Weed[] = [];
  private friends: Friend[] = [];
  private nets: Net[] = [];
  private murk!: Phaser.GameObjects.Image;
  private held: { what: 'item'; t: Trash; from: P; moved: number; dx: number; dy: number } | { what: 'rub'; f: Friend; last: P } | null = null;
  private said = new Set<string>();
  private inCount = 0;
  private total = 0;

  constructor() {
    super('SeaClean');
  }

  init() {
    super.init();
    this.trash = [];
    this.weeds = [];
    this.friends = [];
    this.nets = [];
    this.held = null;
    this.said = new Set();
    this.inCount = this.total = 0;
    // (the scene object is reused: without this the second clean-up of a session never took its photo or left)
    this.snapped = false;
    Object.assign(this.shown, { total: 0, in: 0, wrong: 0, freed: [] as string[], found: 0, seahorse: false, murk: 1, order: [] as string[] });
  }

  protected build() {
    const L = this.L;
    const S = this.S;
    const k = L.k;
    this.water(false);
    seaRock(this, S);
    const { x0, x1 } = seaWork(L, S);
    const hard = this.level === 2;

    // The net bags on the left, standing on the sand: one (easy), or the blue over the green (hard).
    const bs = Math.min(0.72 * k, (L.Y(940) - L.Y(330)) / (2 * 360 + 40) / (hard ? 1 : 0.7));
    const ns = hard ? bs : Math.min(0.95 * k, bs * 1.3);
    const colW = 420 * ns;
    const nx = x0 + colW / 2 + 6 * k;
    const bottom = L.Y(960) - 180 * ns;
    const colours: Colour[] = hard ? ['blue', 'green'] : ['blue'];
    colours.forEach((colour, i) => {
      const at = { x: nx, y: bottom - i * (360 * ns + 30 * k) };
      const img = this.add.image(at.x, at.y, `net-basket-${colour}`).setScale(ns).setDepth(20);
      const glow = this.add.image(at.x, at.y, FX_SOFT).setTint(0xfff1b8).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0).setDepth(19);
      glow.setScale((420 * ns * 1.5) / glow.frame.realWidth);
      this.nets.push({ colour, img, at, scale: ns, glow, count: 0 });
    });

    // The murky corner of the water: from the nets to the room's right edge, from under the surface to the sand.
    const ax0 = x0 + colW + 50 * k;
    const ax1 = x1 - 20 * k;
    const ay0 = L.Y(300);
    const ay1 = L.Y(900);
    const aw = ax1 - ax0;
    const ah = ay1 - ay0;
    this.murk = this.add.image((ax0 + ax1) / 2 - 40 * k, (ay0 + ay1) / 2, 'murk').setDisplaySize(aw + 260 * k, ah + 220 * k).setAlpha(T.murk).setDepth(-60);
    const at = (fx: number, fy: number) => ({ x: ax0 + fx * aw, y: ay0 + fy * ah });

    // The dolphin among the corals (upper right), the net over its back fin.
    const ds = Math.min(0.85 * k, (aw * 0.42) / 520);
    const dAt = { x: ax1 - 260 * ds, y: ay0 + 120 * ds + 20 * k };
    this.addFriend('dolphin', 'dolphin-free', dAt, ds, 'trash-net', { x: 150, y: -40 }, 1.05);
    // (hard) the turtle with a bag over her head (upper left of the murky corner)
    if (hard) {
      const ts = Math.min(0.75 * k, (aw * 0.3) / 360);
      this.addFriend('turtle', 'turtle-free', at(0.2, 0.16), ts, 'trash-bag', { x: -118, y: -16 }, 0.9);
    }

    // The seaweed on the sand: one (easy) hides a seahorse; hard: three, two of them hide a piece of rubbish.
    const ws = Math.min(0.72 * k, (ah * 0.62) / 420);
    const weedX = hard ? [0.2, 0.52, 0.86] : [0.5];
    const hides: (string | 'seahorse')[] = hard ? Phaser.Utils.Array.Shuffle(['trash-bag', 'trash-straw', 'seahorse']) : ['seahorse'];
    weedX.forEach((fx, i) => {
      const foot = { x: ax0 + fx * aw, y: L.Y(975) };
      const img = this.add.image(foot.x, foot.y, 'seaweed-hide').setOrigin(0.5, 1).setScale(ws).setDepth(30);
      this.tweens.add({ targets: img, angle: { from: -2.5, to: 2.5 }, duration: 2600 + i * 300, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      const w: Weed = { img, at: { x: foot.x, y: foot.y - 210 * ws }, scale: ws, open: false, hides: null };
      const h = hides[i];
      if (h === 'seahorse') w.hides = 'seahorse';
      else w.hides = this.addTrash(h as ImageKey, { x: foot.x + 10 * k, y: foot.y - 140 * ws }, 'hidden', 24);
      this.weeds.push(w);
    });

    // The loose rubbish on the sea floor, in the places left free.
    const loose: ImageKey[] = hard ? ['trash-bottle', 'trash-can', 'trash-tyre', 'trash-net'] : ['trash-bottle', 'trash-can', 'trash-bag', 'trash-straw', 'trash-tyre'];
    const slots = hard
      ? [at(0.38, 0.5), at(0.68, 0.62), at(0.05, 0.58), at(0.62, 0.3)]
      : [at(0.1, 0.25), at(0.4, 0.42), at(0.12, 0.72), at(0.78, 0.66), at(0.5, 0.12)];
    Phaser.Utils.Array.Shuffle(loose).forEach((key, i) => this.addTrash(key, slots[i], 'loose', 40));
    this.total = this.trash.length;
    this.shown.total = this.total;
  }

  private addTrash(key: ImageKey, at: P, state: Trash['state'], depth: number): Trash {
    const k = this.L.k;
    const scale = 1.1 * k;
    const angle = Phaser.Math.Between(-20, 20);
    const img = this.add.image(at.x, at.y, key).setScale(scale).setAngle(angle).setDepth(depth);
    const t: Trash = { key, colour: KIND[key], img, home: { ...at }, scale, state, angle };
    this.trash.push(t);
    if (state === 'loose') this.tweens.add({ targets: img, y: at.y - 6 * k, duration: 2000 + Phaser.Math.Between(0, 800), yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    return t;
  }

  private addFriend(kind: Friend['kind'], key: ImageKey, at: P, scale: number, cover: ImageKey, coverAt: P, coverScale: number) {
    const img = this.add.image(at.x, at.y, key).setScale(scale).setDepth(35);
    // (caught, it waits calmly: a gentle rocking, never a sad face)
    this.tweens.add({ targets: img, angle: { from: -3, to: 3 }, duration: 1400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    const c = { x: at.x + coverAt.x * scale, y: at.y + coverAt.y * scale };
    const t = this.addTrash(cover, c, 'stuck', 36);
    t.scale = this.L.k * coverScale * (scale / (0.72 * this.L.k));
    t.img.setScale(t.scale);
    this.friends.push({ kind, img, at, scale, stuck: true, cover: t, coverAt, rub: 0 });
  }

  protected ready() {
    super.ready();
    this.time.delayedCall(500, () => {
      this.begin('clean', 'vo-clean-start');
      if (this.level === 2) this.say('vo-clean-sort', { ttlMs: 7000 });
    });
  }

  // ---------------------------------------------------------------- the rules

  private netFor(t: Trash): Net {
    return this.nets.find((n) => n.colour === t.colour) ?? this.nets[0];
  }

  private netAt(at: P): Net | null {
    const k = this.L.k;
    const r = T.reach * k;
    for (const n of this.nets) if (Math.abs(at.x - n.at.x) < 210 * n.scale + r && Math.abs(at.y - n.at.y) < 180 * n.scale + r) return n;
    return null;
  }

  /** What a child would do next (Mom's hand shows it, her help does it, the harness plays it). */
  plan(): Plan | null {
    if (this.phase !== 'clean') return null;
    const loose = this.trash.filter((t) => t.state === 'loose');
    const dolphin = this.friends.find((f) => f.kind === 'dolphin' && f.stuck);
    if (dolphin && (this.inCount >= 2 || !loose.length)) return { kind: 'rub', f: dolphin };
    if (loose.length) return { kind: 'carry', t: loose[0], to: this.netFor(loose[0]).at };
    const turtle = this.friends.find((f) => f.kind === 'turtle' && f.stuck);
    if (turtle) return { kind: 'bag', f: turtle, to: this.netFor(turtle.cover).at };
    const w = this.weeds.find((q) => !q.open && q.hides && q.hides !== 'seahorse');
    if (w) return { kind: 'weed', w };
    return null;
  }

  /** After every bit of progress: Mom's next word (once each), or the end. */
  private next() {
    if (this.leaving || this.phase !== 'clean') return;
    if (this.trash.every((t) => t.state === 'in')) return this.finale();
    const p = this.plan();
    if (!p) return;
    if (p.kind === 'rub' && this.once('dolphin')) {
      voice.say('name-dolphin', { group: 'name', ttlMs: 3000, valid: () => this.scene.isActive() && !this.leaving });
      this.say('vo-clean-dolphin', { ttlMs: 6000 });
      boing(this, p.f.img, 0.08);
      sfx(this, 'dolphin-click', { volume: 0.7 });
    }
    if (p.kind === 'bag' && this.once('turtle')) {
      this.say('vo-clean-turtle', { ttlMs: 6000 });
      boing(this, p.f.img, 0.08);
      sfx(this, 'turtle-blub', { volume: 0.7 });
    }
    if (p.kind === 'weed' && this.once('hidden')) {
      this.say('vo-clean-hidden', { ttlMs: 6000 });
      for (const w of this.weeds) if (!w.open) boing(this, w.img, 0.06);
    }
  }

  private once(what: string) {
    if (this.said.has(what)) return false;
    this.said.add(what);
    return true;
  }

  // ---------------------------------------------------------------- into the net

  private into(t: Trash, n: Net) {
    const k = this.L.k;
    t.state = 'in';
    this.tweens.killTweensOf(t.img);
    n.count++;
    this.inCount++;
    this.shown.in = this.inCount;
    (this.shown.order as string[]).push(`${t.key}>${n.colour}`);
    // (it drops in through the hoop and lies in the bottom of the net, seen through the mesh)
    const inside = { x: n.at.x + Phaser.Math.Between(-90, 90) * n.scale, y: n.at.y + Phaser.Math.Between(40, 110) * n.scale };
    t.img.setDepth(600);
    this.tweens.add({
      targets: t.img,
      x: n.at.x,
      y: n.at.y - 150 * n.scale,
      scale: t.scale * 0.85,
      duration: 220,
      ease: 'Quad.easeOut',
      onComplete: () => {
        t.img.setDepth(19 - 0.01 * n.count);
        this.tweens.add({ targets: t.img, x: inside.x, y: inside.y, scale: t.scale * 0.6, angle: Phaser.Math.Between(-40, 40), duration: 300, ease: 'Quad.easeIn' });
        sfx(this, 'splash-trash');
        breath(this, n.at.x, n.at.y - 120 * n.scale, k, 4);
        this.tweens.add({ targets: n.img, scaleY: { from: n.scale * 0.94, to: n.scale }, duration: 360, ease: 'Back.easeOut' });
      },
    });
    // The water clears a little with every piece.
    const left = 1 - this.inCount / this.total;
    this.shown.murk = Math.round(left * 100) / 100;
    this.tweens.add({ targets: this.murk, alpha: T.murk * left, duration: 700 });
    if (this.inCount === Math.ceil(this.total / 2)) this.time.delayedCall(700, () => this.say('vo-clean-clearer', { ttlMs: 5000 }));
    else if (this.inCount % T.praiseEvery === 0 && this.inCount < this.total) voice.praise({ ttlMs: 3000, valid: () => this.scene.isActive() && !this.leaving });
    this.mom?.happy();
    this.time.delayedCall(800, () => this.mom?.rest());
    stars(this, n.at.x, n.at.y - 120 * n.scale, 6, 40 * k);
    this.poke();
    this.time.delayedCall(560, () => this.next());
  }

  /** The wrong net bag (hard): it hops out back to where it lay, the right bag glows, Mom says its colour. */
  private wrongNet(t: Trash) {
    this.shown.wrong = (this.shown.wrong as number) + 1;
    sfx(this, 'squish', { volume: 0.6 });
    this.back(t);
    const right = this.netFor(t);
    this.tweens.add({ targets: right.glow, alpha: { from: 0, to: 0.9 }, duration: 300, yoyo: true, hold: 900 });
    boing(this, right.img, 0.08);
    this.say(t.colour === 'blue' ? 'vo-clean-blue' : 'vo-clean-green', { ttlMs: 4000 });
    this.miss();
  }

  private back(t: Trash) {
    this.tweens.killTweensOf(t.img);
    this.tweens.add({ targets: t.img, x: t.home.x, y: t.home.y, scale: t.scale, angle: t.angle, duration: 380, ease: 'Back.easeOut', onComplete: () => t.img.setDepth(40) });
  }

  // ---------------------------------------------------------------- the dolphin, the turtle, the seaweed

  private rubNeed() {
    return Phaser.Math.Linear(T.untangle[0], T.untangle[1], this.level - 1) * this.L.k;
  }

  /** Rubbing the net: it loosens (slides and tilts off the fin) as she rubs; enough and it comes off. */
  private rub(f: Friend, dist: number) {
    if (!f.stuck) return;
    const k = this.L.k;
    f.rub += dist;
    const t = Math.min(1, f.rub / this.rubNeed());
    const c = f.cover;
    c.img.setPosition(c.home.x + 30 * k * t, c.home.y + 26 * k * t).setAngle(c.angle + 25 * t);
    if (Math.random() < 0.08) breath(this, c.img.x, c.img.y, k, 2);
    sfx(this, 'squish', { minGapMs: 420, volume: 0.35, vary: true });
    this.shown.rub = Math.round(t * 100) / 100;
    this.poke();
    if (t >= 1) this.free(f);
  }

  /** Free: the cover drops to the sea floor (a loose piece now), the animal is happy, Mom tells something true about it. */
  private free(f: Friend) {
    const k = this.L.k;
    f.stuck = false;
    (this.shown.freed as string[]).push(f.kind);
    if (this.held?.what === 'rub') {
      this.held = null;
      this.owner = null;
    }
    const c = f.cover;
    sfx(this, 'net-off');
    if (c.state === 'stuck') {
      c.state = 'loose';
      c.home = { x: f.at.x - 40 * k, y: Math.min(this.L.Y(880), f.at.y + 200 * f.scale + 80 * k) };
      c.angle = Phaser.Math.Between(-15, 15);
      c.img.setDepth(40);
      this.tweens.add({ targets: c.img, x: c.home.x, y: c.home.y, scale: c.scale, angle: c.angle, duration: 700, ease: 'Bounce.easeOut' });
    }
    this.cheerUp(f);
    voice.say(f.kind === 'dolphin' ? 'name-dolphin' : 'name-turtle', { group: 'name', ttlMs: 3000, valid: () => this.scene.isActive() && !this.leaving });
    this.say(f.kind === 'dolphin' ? 'vo-fact-dolphin' : 'vo-fact-turtle', { ttlMs: 7000 });
    this.mom?.happy();
    this.time.delayedCall(900, () => this.mom?.rest());
    this.time.delayedCall(800, () => this.next());
  }

  /** The freed animal: a happy flip (the dolphin: clicks, and a kiss for Marina), then back to its place. */
  private cheerUp(f: Friend) {
    const k = this.L.k;
    this.tweens.killTweensOf(f.img);
    f.img.setAngle(0);
    sfx(this, f.kind === 'dolphin' ? 'dolphin-click' : 'turtle-blub');
    stars(this, f.img.x, f.img.y, 10, 50 * k);
    this.tweens.add({ targets: f.img, y: f.at.y - 120 * k, angle: f.kind === 'dolphin' ? -360 : 0, duration: 700, ease: 'Sine.easeOut', yoyo: true });
    const marina = this.pipa;
    if (f.kind === 'dolphin' && marina) {
      this.time.delayedCall(1500, () => {
        if (!this.scene.isActive() || this.phase === 'done') return;
        const m = marina.mouthAt;
        this.tweens.add({
          targets: f.img,
          x: m.x - 150 * f.scale,
          y: m.y,
          duration: 900,
          ease: 'Sine.easeInOut',
          onComplete: () => {
            sfx(this, 'dolphin-click', { volume: 0.7 });
            marina.react('love');
            this.tweens.add({ targets: f.img, x: f.at.x, y: f.at.y, duration: 1000, delay: 500, ease: 'Sine.easeInOut', onComplete: () => this.swimLoop(f) });
          },
        });
      });
    } else this.time.delayedCall(1500, () => this.swimLoop(f));
  }

  private swimLoop(f: Friend) {
    if (!f.img.active || this.phase === 'done') return;
    this.tweens.add({ targets: f.img, y: f.at.y - 14 * this.L.k, duration: 1600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  }

  /** A seaweed moves aside: what was behind it shows (a piece of rubbish, or the seahorse). */
  private openWeed(w: Weed) {
    if (w.open) return;
    const k = this.L.k;
    w.open = true;
    this.tweens.killTweensOf(w.img);
    this.tweens.add({ targets: w.img, angle: -24, x: w.img.x - 70 * k, duration: 500, ease: 'Back.easeOut' });
    sfx(this, 'whoosh', { volume: 0.45 });
    puff(this, w.at.x, w.at.y, 0xdff6f2, 5, 50 * k);
    if (w.hides === 'seahorse') {
      this.shown.seahorse = true;
      const s = this.add.image(w.at.x + 20 * k, w.at.y + 40 * k, 'sea-seahorse').setScale(0).setDepth(25);
      this.tweens.add({ targets: s, scale: 0.7 * k, y: w.at.y - 30 * k, duration: 600, ease: 'Back.easeOut', onComplete: () => this.tweens.add({ targets: s, y: s.y - 20 * k, duration: 1500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' }) });
      stars(this, w.at.x, w.at.y, 8, 40 * k);
      sfx(this, 'star', { volume: 0.6 });
      this.say('vo-fact-seahorse', { ttlMs: 6000 });
      return;
    }
    const t = w.hides;
    if (t && t.state === 'hidden') {
      t.state = 'loose';
      this.shown.found = (this.shown.found as number) + 1;
      t.img.setDepth(40);
      boing(this, t.img, 0.15);
      stars(this, t.img.x, t.img.y, 6, 36 * k);
      sfx(this, 'pop');
      this.poke();
      this.time.delayedCall(400, () => this.next());
    }
  }

  // ---------------------------------------------------------------- the end

  private finale() {
    this.setPhase('done');
    this.shown.done = true;
    const L = this.L;
    const k = L.k;
    setMark('clean');
    sfx(this, 'murk-clear');
    this.tweens.add({ targets: this.murk, alpha: 0, duration: 900 });
    // the dolphin and the turtle swim a happy round, then off they go
    this.friends.forEach((f, i) => {
      this.tweens.killTweensOf(f.img);
      this.time.delayedCall(300 + i * 400, () => {
        sfx(this, f.kind === 'dolphin' ? 'dolphin-click' : 'turtle-blub', { volume: 0.7 });
        this.tweens.add({ targets: f.img, y: f.at.y - 140 * k, angle: f.kind === 'dolphin' ? -360 : 0, duration: 800, yoyo: true, ease: 'Sine.easeInOut' });
        this.tweens.add({ targets: f.img, x: f.kind === 'dolphin' ? -400 * k : L.W + 400 * k, alpha: 0.6, delay: 1800, duration: 1800, ease: 'Sine.easeIn' });
      });
    });
    this.mom?.celebrate();
    this.pipa?.cheer();
    stars(this, this.murk.x, this.murk.y, 16, 80 * k);
    const room = seaWork(L, this.S);
    this.time.delayedCall(1200, () =>
      this.say('vo-clean-done', {
        ttlMs: 6000,
        done: () => this.time.delayedCall(300, () => this.snap(room)),
      }),
    );
    this.time.delayedCall(8000, () => this.snap(room));
  }

  private snapped = false;
  private snap(room: { x0: number; x1: number }) {
    if (this.snapped || this.leaving) return;
    this.snapped = true;
    const L = this.L;
    const side = Math.min(L.H * 0.86, room.x1 - room.x0);
    const centre = { x: (room.x0 + room.x1) / 2, y: L.Y(620) };
    this.seaPhoto('clean', { x: centre.x - side / 2, y: centre.y - side / 2, w: side, h: side }, { x: centre.x, y: L.Y(470) }, (box) => {
      this.time.delayedCall(2600, () => {
        this.tweens.add({ targets: box, alpha: 0, scale: 0.6, duration: 400 });
        this.time.delayedCall(700, () => this.leave('finale'));
      });
    });
    this.shown.photo = 1;
  }

  // ---------------------------------------------------------------- Mom's hand

  private carry(key: string, from: P, s: number, to: P): HandMotion {
    return { kind: 'grab', keys: [{ ...from, t: 0 }, { ...from, t: 300 }, { ...to, t: 1500 }, { ...to, t: 1900 }], props: [{ key, scale: s, alpha: 0.6 }], glow: from };
  }

  private circles(c: P, r: number, t0: number, t1: number, turns = 2) {
    const keys = [];
    const n = 8 * turns;
    for (let i = 0; i <= n; i++) {
      const a = (i / 8) * Math.PI * 2;
      keys.push({ x: c.x + Math.cos(a) * r, y: c.y + Math.sin(a) * r * 0.7, t: t0 + ((t1 - t0) * i) / n });
    }
    return keys;
  }

  protected way(): HandMotion | null {
    const p = this.plan();
    const k = this.L.k;
    if (!p) return null;
    if (p.kind === 'carry') return this.carry(p.t.key, { x: p.t.img.x, y: p.t.img.y }, p.t.scale, { x: p.to.x, y: p.to.y - 100 * k });
    if (p.kind === 'bag') return this.carry(p.f.cover.key, { x: p.f.cover.img.x, y: p.f.cover.img.y }, p.f.cover.img.scale, { x: p.to.x, y: p.to.y - 100 * k });
    if (p.kind === 'rub') {
      const c = { x: p.f.cover.img.x, y: p.f.cover.img.y };
      return { kind: 'point', keys: this.circles(c, 50 * k, 0, 2300, 3), glow: c };
    }
    return tapMotion(p.w.at, k);
  }

  protected helpOnce() {
    const p = this.plan();
    const k = this.L.k;
    if (!p) return false;
    if (p.kind === 'carry' || p.kind === 'bag') {
      const t = p.kind === 'carry' ? p.t : p.f.cover;
      if (p.kind === 'bag') this.pullOff(p.f);
      const n = this.netFor(t);
      this.tweens.killTweensOf(t.img);
      t.img.setDepth(600);
      this.hand.follow('grab', () => ({ x: t.img.x, y: t.img.y }));
      this.tweens.add({ targets: t.img, x: n.at.x, y: n.at.y - 120 * n.scale, duration: T.helpMs, delay: 250, ease: 'Sine.easeInOut', onComplete: () => (this.helped(), this.into(t, n)) });
      return true;
    }
    if (p.kind === 'rub') {
      const f = p.f;
      const c = { x: f.cover.home.x, y: f.cover.home.y };
      const pos = { x: c.x, y: c.y };
      this.hand.follow('point', () => pos);
      this.tweens.addCounter({
        from: 0,
        to: 1,
        duration: T.rubMs,
        onUpdate: (tw) => {
          const a = tw.getValue()! * Math.PI * 8;
          pos.x = c.x + Math.cos(a) * 50 * k;
          pos.y = c.y + Math.sin(a) * 35 * k;
          this.rub(f, (this.rubNeed() * 1.05) / 60);
        },
        onComplete: () => {
          this.helped();
          if (f.stuck) this.rub(f, this.rubNeed());
        },
      });
      return true;
    }
    this.hand.play(tapMotion(p.w.at, k));
    this.time.delayedCall(700, () => (this.helped(), this.openWeed(p.w)));
    return true;
  }

  /** The bag comes off the turtle's head (she is free); it is a loose piece now, taken by the finger (or Mom's hand). */
  private pullOff(f: Friend) {
    const c = f.cover;
    c.state = 'loose';
    c.home = { x: f.at.x + 40 * this.L.k, y: Math.min(this.L.Y(880), f.at.y + 220 * f.scale) };
    c.angle = 0;
    c.img.setScale(c.scale);
    f.stuck = false;
    (this.shown.freed as string[]).push(f.kind);
    this.cheerUp(f);
    voice.say('name-turtle', { group: 'name', ttlMs: 3000, valid: () => this.scene.isActive() && !this.leaving });
    this.say('vo-fact-turtle', { ttlMs: 7000 });
  }

  // ---------------------------------------------------------------- touch

  private trashAt(at: P): Trash | null {
    const k = this.L.k;
    let best: Trash | null = null;
    let bd = Infinity;
    for (const t of this.trash) {
      if (t.state !== 'loose') continue;
      const d = Math.hypot(at.x - t.img.x, at.y - t.img.y);
      if (d < Math.max(115 * k, 100 * t.img.scale + 40 * k) && d < bd) (best = t), (bd = d);
    }
    return best;
  }

  private grab(p: Phaser.Input.Pointer, t: Trash, at: P) {
    this.tweens.killTweensOf(t.img);
    t.img.setDepth(600).setScale(t.scale * 1.12);
    sfx(this, 'tap', { volume: 0.7 });
    this.held = { what: 'item', t, from: at, moved: 0, dx: t.img.x - at.x, dy: t.img.y - at.y };
    this.own(p);
  }

  protected down(p: Phaser.Input.Pointer, at: P) {
    if (this.phase !== 'clean') return;
    const k = this.L.k;
    const t = this.trashAt(at);
    if (t) return this.grab(p, t, at);
    for (const f of this.friends) {
      if (!f.stuck) continue;
      const c = f.cover.img;
      if (!this.near(at, { x: c.x, y: c.y }, Math.max(120 * k, 100 * c.scale + 40 * k)) && !(f.kind === 'dolphin' && this.near(at, f.at, 200 * f.scale))) continue;
      if (f.kind === 'turtle') {
        // the bag comes off in her fingers
        this.pullOff(f);
        this.poke();
        return this.grab(p, f.cover, at);
      }
      sfx(this, 'squish', { volume: 0.4 });
      this.once('dolphin');
      this.held = { what: 'rub', f, last: at };
      this.own(p);
      return;
    }
    const w = this.weeds.find((q) => !q.open && Math.abs(at.x - q.at.x) < Math.max(120 * k, 120 * q.scale) && Math.abs(at.y - q.at.y) < 230 * q.scale);
    if (w) this.openWeed(w);
  }

  protected move(p: Phaser.Input.Pointer) {
    const h = this.held;
    if (!h) return;
    const L = this.L;
    const at = { x: Phaser.Math.Clamp(p.worldX, 0, L.W), y: Phaser.Math.Clamp(p.worldY, 0, L.H) };
    if (h.what === 'rub') {
      const d = Math.hypot(at.x - h.last.x, at.y - h.last.y);
      h.last = at;
      if (this.near(at, h.f.cover.home, 220 * L.k)) this.rub(h.f, d);
      return;
    }
    h.moved = Math.max(h.moved, Math.hypot(at.x - h.from.x, at.y - h.from.y));
    h.t.img.setPosition(at.x + h.dx * 0.4, at.y + h.dy * 0.4 - 30 * L.k);
  }

  protected up(_p: Phaser.Input.Pointer, cancelled: boolean) {
    const h = this.held;
    this.held = null;
    if (!h || h.what !== 'item') return;
    const t = h.t;
    const k = this.L.k;
    if (t.state !== 'loose') return;
    if (cancelled) return this.back(t);
    if (h.moved < 30 * k) {
      // A tap: easy, it goes into the net by itself; hard, it hops and Mom says its colour (she sorts it herself).
      if (this.level === 1) return this.into(t, this.netFor(t));
      boing(this, t.img, 0.15);
      voice.say(`name-${t.colour}` as VoiceKey, { group: 'name', ttlMs: 2500, valid: () => this.scene.isActive() && !this.leaving });
      return this.back(t);
    }
    const n = this.netAt({ x: t.img.x, y: t.img.y });
    if (n) return n === this.netFor(t) ? this.into(t, n) : this.wrongNet(t);
    if (h.moved > 60 * k) this.miss();
    this.back(t);
  }

  protected lookTarget() {
    const h = this.held;
    if (!h) return null;
    if (h.what === 'item') return { x: h.t.img.x, y: h.t.img.y };
    return { x: h.f.cover.img.x, y: h.f.cover.img.y };
  }

  protected shutdown() {}
}
