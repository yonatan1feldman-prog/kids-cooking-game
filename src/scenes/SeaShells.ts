import Phaser from 'phaser';
import { FX_SOFT, type ImageKey } from '../core/assets';
import { voice, type VoiceKey } from '../core/audio';
import { boing, puff, stars } from '../core/fx';
import { tapMotion, type HandMotion } from '../core/hand';
import { sfx } from '../core/sfx';
import { SEA3, seaRock, seaWork, setMark, wearNecklace } from '../core/seaSort';
import type { P } from './MiniGame';
import { SeaGame } from './SeaGame';

const T = SEA3.shells;
type Kind = 'fan' | 'spiral' | 'star';
type Size = 'big' | 'little';
const IMG: Record<Kind, ImageKey> = { fan: 'shell-fan', spiral: 'shell-spiral', star: 'starfish' };
const NAME: Record<Kind, VoiceKey> = { fan: 'name-shell', spiral: 'name-swirly', star: 'name-starfish' };
/** The hard necklace's pattern (Mom threads it once, she goes on): shell, starfish, swirly shell... */
const PATTERN: Kind[] = ['fan', 'star', 'spiral'];

interface Shell {
  kind: Kind;
  size: Size;
  img: Phaser.GameObjects.Image;
  home: P;
  scale: number;
  state: 'hidden' | 'loose' | 'in';
  mound?: Phaser.GameObjects.Image;
}

interface Basket {
  kind: Kind;
  /** Only for the fan shells on the hard level: the big ones' basket and the little ones'. */
  size?: Size;
  img: Phaser.GameObjects.Image;
  at: P;
  scale: number;
  glow: Phaser.GameObjects.Image;
  count: number;
}

type Plan =
  | { kind: 'carry'; s: Shell; to: Basket }
  | { kind: 'dig'; s: Shell }
  | { kind: 'thread'; b: Basket };

/**
 * The shell treasure (research/mermaid-spec.md 3.4). Part one, sorting: shells lie about on the sea floor (some half
 * under a little heap of sand: a touch digs them out), and baskets wait in a row along the bottom, each with one of its
 * shells on the front. She drags each shell into its basket (a tap works on the easy level), it pops in, and Mom counts
 * what is in that basket. A wrong basket: it hops out gently, the right one glows, Mom says its name. Easy: two kinds
 * (pink shells and starfish), six shells. Hard: three kinds and, for the pink shells, big and little ones with a basket
 * each ("That one's little! The little ones go here!"): size, nine shells, three in the sand.
 * Part two, a necklace for Marina: a string across the water; a tap on a basket (or a drag from it) threads one of its
 * shells, which slides along to the next free place; Mom says each one's name. Easy: six, any order. Hard: Mom threads
 * the first three (shell, starfish, swirly shell) and she goes on with the pattern; a shell that is not next slides off
 * the string again, gently, and Mom says the one that comes next. The string closes, the necklace goes on Marina (and
 * she keeps it in the lagoon: `lagoon.necklace`), a photo, and back to the lagoon.
 */
export class SeaShells extends SeaGame {
  protected readonly id = 'sea-shells';
  protected readonly waiting = ['sort', 'thread'] as const;
  private shells: Shell[] = [];
  private baskets: Basket[] = [];
  private held: { s?: Shell; b?: Basket; img: Phaser.GameObjects.Image; from: P; moved: number; dx: number; dy: number } | null = null;
  private said = new Set<string>();
  /** The necklace: its string, the places along it, the shells on it. */
  private string: Phaser.GameObjects.Image | null = null;
  private slots: P[] = [];
  private onString: { kind: Kind; img: Phaser.GameObjects.Image }[] = [];
  private flying = 0;
  private shellScale = 1;

  constructor() {
    super('SeaShells');
  }

  init() {
    super.init();
    this.shells = [];
    this.baskets = [];
    this.held = null;
    this.said = new Set();
    this.string = null;
    this.slots = [];
    this.onString = [];
    this.flying = 0;
    Object.assign(this.shown, { shells: 0, sorted: 0, wrong: 0, size: 0, dug: 0, threaded: [] as string[], slid: 0, necklace: false, order: [] as string[] });
  }

  protected build() {
    const L = this.L;
    const S = this.S;
    const k = L.k;
    this.water(false);
    seaRock(this, S);
    const { x0, x1 } = seaWork(L, S);
    const hard = this.level === 2;
    const ss = (this.shellScale = 1.0 * k);

    // The baskets in a row along the bottom, on the sand.
    const defs: { kind: Kind; size?: Size }[] = hard
      ? [{ kind: 'fan', size: 'big' }, { kind: 'fan', size: 'little' }, { kind: 'spiral' }, { kind: 'star' }]
      : [{ kind: 'fan' }, { kind: 'star' }];
    const gap = 30 * k;
    const bs = Math.min(0.8 * k, (x1 - x0 - (defs.length - 1) * gap) / (defs.length * 380));
    const rowW = defs.length * 380 * bs + (defs.length - 1) * gap;
    const bx0 = x0 + (x1 - x0 - rowW) / 2 + 190 * bs;
    const by = L.Y(950) - 150 * bs;
    defs.forEach((d, i) => {
      const scale = d.size === 'little' ? bs * 0.8 : bs;
      const at = { x: bx0 + i * (380 * bs + gap), y: by + (bs - scale) * 150 };
      const glow = this.add.image(at.x, at.y, FX_SOFT).setTint(0xfff1b8).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0).setDepth(19);
      glow.setScale((380 * scale * 1.5) / glow.frame.realWidth);
      const img = this.add.image(at.x, at.y, 'shell-basket').setScale(scale).setDepth(22);
      // (on its front, one of what goes in it: a big or a little one for the pink shells)
      const sample = this.add.image(at.x, at.y + 50 * scale, IMG[d.kind]).setDepth(23);
      sample.setScale(0.5 * scale * (d.size === 'little' ? 0.7 : 1));
      this.baskets.push({ ...d, img, at, scale, glow, count: 0 });
    });

    // The shells on the sea floor, above the baskets; some half under a heap of sand.
    const mix: { kind: Kind; size: Size }[] = hard
      ? [
          { kind: 'fan', size: 'big' }, { kind: 'fan', size: 'big' }, { kind: 'fan', size: 'little' }, { kind: 'fan', size: 'little' },
          { kind: 'spiral', size: 'big' }, { kind: 'spiral', size: 'big' }, { kind: 'star', size: 'big' }, { kind: 'star', size: 'big' }, { kind: 'star', size: 'big' },
        ]
      : [{ kind: 'fan', size: 'big' }, { kind: 'fan', size: 'big' }, { kind: 'fan', size: 'big' }, { kind: 'star', size: 'big' }, { kind: 'star', size: 'big' }, { kind: 'star', size: 'big' }];
    const top = L.Y(300);
    const bottom = by - 150 * bs - 110 * k;
    const cols = hard ? 5 : 3;
    const rows = 2;
    const cw = (x1 - x0 - 120 * k) / cols;
    const rh = (bottom - top) / rows;
    const cells = Phaser.Utils.Array.Shuffle([...Array(cols * rows).keys()]).slice(0, mix.length);
    const order = Phaser.Utils.Array.Shuffle([...mix]);
    const hidden = T.hidden[this.level - 1];
    order.forEach((m, i) => {
      const c = cells[i];
      const home = {
        x: x0 + 60 * k + cw * ((c % cols) + 0.5) + Phaser.Math.Between(-30, 30) * k,
        y: top + rh * (Math.floor(c / cols) + 0.5) + Phaser.Math.Between(-24, 24) * k,
      };
      const scale = ss * (m.kind === 'fan' && hard ? (m.size === 'big' ? T.big : T.little) : 1);
      const img = this.add.image(home.x, home.y, IMG[m.kind]).setScale(scale).setAngle(Phaser.Math.Between(-15, 15)).setDepth(40);
      const s: Shell = { ...m, img, home, scale, state: 'loose' };
      if (i < hidden) {
        // half under the sand: the mound in front, the shell's top peeking out
        s.state = 'hidden';
        img.setDepth(38).setY(home.y - 30 * k);
        s.mound = this.add.image(home.x, home.y + 30 * k, 'sand-mound').setScale(0.75 * k).setDepth(39);
      } else this.tweens.add({ targets: img, angle: img.angle + 4, duration: 1800 + i * 150, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      this.shells.push(s);
    });
    this.shown.shells = this.shells.length;
  }

  protected ready() {
    super.ready();
    this.time.delayedCall(500, () => this.begin('sort', 'vo-shell-start'));
  }

  // ---------------------------------------------------------------- sorting

  private basketFor(s: Shell): Basket {
    return this.baskets.find((b) => b.kind === s.kind && (!b.size || b.size === s.size)) ?? this.baskets[0];
  }

  private basketAt(at: P): Basket | null {
    const r = T.reach * this.L.k;
    let best: Basket | null = null;
    let bd = Infinity;
    for (const b of this.baskets) {
      const dx = Math.abs(at.x - b.at.x);
      const dy = Math.abs(at.y - b.at.y);
      if (dx < 190 * b.scale + r && dy < 150 * b.scale + r + 60 * this.L.k && dx < bd) (best = b), (bd = dx);
    }
    return best;
  }

  plan(): Plan | null {
    if (this.phase === 'sort') {
      const s = this.shells.find((q) => q.state === 'loose');
      if (s) return { kind: 'carry', s, to: this.basketFor(s) };
      const h = this.shells.find((q) => q.state === 'hidden');
      return h ? { kind: 'dig', s: h } : null;
    }
    if (this.phase === 'thread') {
      const kind = this.nextKind();
      const b = this.baskets.find((q) => q.kind === kind && q.size !== 'little') ?? this.baskets.find((q) => q.kind === kind)!;
      return { kind: 'thread', b };
    }
    return null;
  }

  private into(s: Shell, b: Basket) {
    const k = this.L.k;
    s.state = 'in';
    this.tweens.killTweensOf(s.img);
    b.count++;
    this.shown.sorted = (this.shown.sorted as number) + 1;
    (this.shown.order as string[]).push(`${s.kind}-${s.size}>${b.kind}${b.size ? '-' + b.size : ''}`);
    // (it lands in the basket's mouth, its lower half behind the front)
    const inside = { x: b.at.x + Phaser.Math.Between(-90, 90) * b.scale, y: b.at.y - 95 * b.scale + Phaser.Math.Between(-6, 10) * k };
    s.img.setDepth(600);
    this.tweens.add({
      targets: s.img,
      x: inside.x,
      y: inside.y - 60 * k,
      scale: s.scale * 0.8,
      duration: 240,
      ease: 'Quad.easeOut',
      onComplete: () => {
        s.img.setDepth(21);
        this.tweens.add({ targets: s.img, y: inside.y, angle: Phaser.Math.Between(-25, 25), duration: 200, ease: 'Quad.easeIn' });
        sfx(this, 'basket-pop');
        stars(this, b.at.x, b.at.y - 90 * b.scale, 6, 36 * k);
        this.tweens.add({ targets: b.img, scaleY: { from: b.scale * 0.94, to: b.scale }, duration: 320, ease: 'Back.easeOut' });
      },
    });
    // Mom counts what is in this basket now.
    voice.say(`count-${Math.min(10, b.count)}` as VoiceKey, { group: 'count', ttlMs: 2500, valid: () => this.scene.isActive() && !this.leaving });
    if (s.kind === 'star' && this.once('starfish')) {
      voice.say('name-starfish', { group: 'name', ttlMs: 4000, valid: () => this.scene.isActive() && !this.leaving });
      this.say('vo-fact-starfish', { ttlMs: 7000 });
    }
    this.mom?.happy();
    this.time.delayedCall(700, () => this.mom?.rest());
    this.poke();
    this.time.delayedCall(500, () => this.afterSort());
  }

  private afterSort() {
    if (this.leaving || this.phase !== 'sort') return;
    if (this.shells.every((q) => q.state === 'in')) {
      this.setPhase('intro');
      return this.praise(this.L.cx, this.L.Y(400), () => this.startThread(), 400);
    }
    if (!this.shells.some((q) => q.state === 'loose') && this.once('hidden')) {
      this.say('vo-shell-hidden', { ttlMs: 5000 });
      for (const s of this.shells) if (s.mound) boing(this, s.mound, 0.1);
    }
  }

  private wrong(s: Shell, b: Basket) {
    const right = this.basketFor(s);
    this.shown.wrong = (this.shown.wrong as number) + 1;
    sfx(this, 'squish', { volume: 0.6 });
    this.back(s);
    this.tweens.add({ targets: right.glow, alpha: { from: 0, to: 0.9 }, duration: 300, yoyo: true, hold: 900 });
    boing(this, right.img, 0.08);
    if (b.kind === s.kind && b.size && s.size !== b.size) {
      // the right kind, the wrong size
      this.shown.size = (this.shown.size as number) + 1;
      this.say(s.size === 'little' ? 'vo-shell-little' : 'vo-shell-big', { ttlMs: 4500 });
    } else voice.say(NAME[s.kind], { group: 'name', ttlMs: 3000, valid: () => this.scene.isActive() && !this.leaving });
    this.miss();
  }

  private back(s: Shell) {
    this.tweens.killTweensOf(s.img);
    this.tweens.add({ targets: s.img, x: s.home.x, y: s.home.y, scale: s.scale, duration: 380, ease: 'Back.easeOut', onComplete: () => s.img.setDepth(40) });
  }

  /** A touch on a heap of sand: it puffs away and the shell under it is free. */
  private dig(s: Shell) {
    if (s.state !== 'hidden') return;
    const k = this.L.k;
    s.state = 'loose';
    this.shown.dug = (this.shown.dug as number) + 1;
    const m = s.mound!;
    puff(this, m.x, m.y, 0xf6e3b5, 8, 60 * k);
    sfx(this, 'whoosh', { volume: 0.4 });
    this.tweens.add({ targets: m, scaleY: 0.2, alpha: 0, duration: 380, onComplete: () => m.destroy() });
    s.mound = undefined;
    s.img.setDepth(40);
    this.tweens.add({ targets: s.img, y: s.home.y, duration: 380, ease: 'Back.easeOut' });
    stars(this, s.home.x, s.home.y, 6, 34 * k);
    this.poke();
  }

  // ---------------------------------------------------------------- the necklace

  private startThread() {
    const L = this.L;
    const k = L.k;
    const { x0, x1 } = seaWork(L, this.S);
    // The shells left in the baskets, the floor clear: the string comes in across the water.
    const sw = Math.min(k, (x1 - x0 - 80 * k) / 1400);
    const y = L.Y(430);
    const cx = (x0 + x1) / 2;
    this.string = this.add.image(cx, y, 'necklace-string').setScale(sw, sw * 1.4).setDepth(45).setAlpha(0);
    this.tweens.add({ targets: this.string, alpha: 1, duration: 400 });
    const n = T.thread[this.level - 1];
    const span = 1260 * sw;
    this.slots = [...Array(n).keys()].map((i) => {
      const t = (i + 0.5) / n;
      // (the cord sags a little in the middle: 20 of its 60 at the centre)
      return { x: cx - span / 2 + span * t, y: y + (20 * 4 * t * (1 - t) - 6) * sw * 1.4 - 10 * k };
    });
    this.setPhase('thread');
    this.say('vo-shell-thread', { ttlMs: 5000 });
    if (this.level === 2) {
      // Mom threads the pattern once, saying each name, then it is hers: "What comes next?"
      this.setPhase('intro');
      this.say('vo-shell-pattern', { ttlMs: 7000 });
      PATTERN.forEach((kind, i) =>
        this.time.delayedCall(2600 + i * 1100, () => {
          const b = this.baskets.find((q) => q.kind === kind && q.size !== 'little')!;
          this.hand.play(tapMotion(b.at, k));
          this.thread(b, false);
        }),
      );
      this.time.delayedCall(2600 + PATTERN.length * 1100 + 600, () => {
        this.hand.stop();
        this.begin('thread', 'vo-shell-next');
      });
      return;
    }
    this.begin('thread', null);
  }

  /** What the pattern wants next (easy: only a suggestion for Mom's hand, any shell is fine). */
  private nextKind(): Kind {
    const i = this.onString.length + this.flying;
    if (this.level === 2) return PATTERN[i % PATTERN.length];
    return this.baskets[i % this.baskets.length].kind;
  }

  /** One shell from basket `b` flies onto the string, to the next free place (a wrong one, hard, slides off again). */
  private thread(b: Basket, child: boolean, from?: P, held?: Phaser.GameObjects.Image) {
    const k = this.L.k;
    const i = this.onString.length + this.flying;
    if (i >= this.slots.length) {
      held?.destroy();
      return;
    }
    const want = this.nextKind();
    const ok = this.level === 1 || b.kind === want;
    const to = this.slots[i];
    const start = from ?? { x: b.at.x, y: b.at.y - 90 * b.scale };
    const img = held ?? this.add.image(start.x, start.y, IMG[b.kind]).setScale(this.shellScale * 0.6).setDepth(600);
    sfx(this, 'tap', { volume: 0.6 });
    boing(this, b.img, 0.06);
    if (!ok) {
      // (it reaches the string and slides off, gently, back into its basket; Mom says what comes next)
      this.shown.slid = (this.shown.slid as number) + 1;
      this.tweens.add({
        targets: img,
        x: to.x,
        y: to.y,
        scale: this.shellScale * 0.6,
        duration: 380,
        ease: 'Quad.easeOut',
        onComplete: () => {
          sfx(this, 'squish', { volume: 0.5 });
          this.tweens.add({ targets: img, x: b.at.x, y: b.at.y - 60 * b.scale, angle: 90, alpha: 0, duration: 700, ease: 'Sine.easeIn', onComplete: () => img.destroy() });
          this.say('vo-shell-next', { ttlMs: 3000 });
          voice.say(NAME[want], { group: 'name', ttlMs: 4000, valid: () => this.scene.isActive() && !this.leaving });
          const right = this.baskets.find((q) => q.kind === want && q.size !== 'little')!;
          this.tweens.add({ targets: right.glow, alpha: { from: 0, to: 0.9 }, duration: 300, yoyo: true, hold: 800 });
        },
      });
      if (child) this.miss();
      return;
    }
    this.flying++;
    this.tweens.add({
      targets: img,
      x: to.x,
      y: to.y,
      scale: this.shellScale * 0.6,
      angle: 0,
      duration: 420,
      ease: 'Quad.easeOut',
      onComplete: () => {
        this.flying--;
        img.setDepth(46);
        this.onString.push({ kind: b.kind, img });
        (this.shown.threaded as string[]).push(b.kind);
        sfx(this, 'shell-thread');
        stars(this, to.x, to.y, 4, 26 * k);
        voice.say(NAME[b.kind], { group: 'name', ttlMs: 2500, valid: () => this.scene.isActive() && !this.leaving });
        this.tweens.add({ targets: img, y: to.y + 8 * k, duration: 160, yoyo: true });
        if (this.onString.length >= this.slots.length) this.time.delayedCall(600, () => this.necklaceDone());
      },
    });
    if (child) this.poke();
  }

  private necklaceDone() {
    if (this.phase === 'done') return;
    this.setPhase('done');
    this.shown.done = true;
    const L = this.L;
    const k = L.k;
    setMark('necklace');
    this.shown.necklace = true;
    // the string closes: every shell sparkles in turn
    this.onString.forEach((s, i) => this.time.delayedCall(i * 90, () => (stars(this, s.img.x, s.img.y, 3, 22 * k), sfx(this, 'shell-thread', { volume: 0.5, minGapMs: 0 }))));
    this.mom?.celebrate();
    const { x0, x1 } = seaWork(L, this.S);
    const centre = { x: (x0 + x1) / 2, y: this.string!.y + 40 * k };
    const side = Math.min(L.H * 0.7, x1 - x0);
    this.time.delayedCall(1100, () =>
      this.seaPhoto('shells', { x: centre.x - side / 2, y: centre.y - side / 2, w: side, h: side }, { x: centre.x, y: L.Y(560) }, (box) => {
        this.time.delayedCall(2200, () => {
          this.tweens.add({ targets: box, alpha: 0, scale: 0.6, duration: 400, onComplete: () => box.destroy() });
          this.toMarina();
        });
      }),
    );
    this.shown.photo = 1;
  }

  /** The necklace flies to Marina and goes round her neck; she spins with joy. (At 4:3 she waits in the lagoon: it goes there.) */
  private toMarina() {
    const L = this.L;
    const k = L.k;
    const parts = [this.string!, ...this.onString.map((s) => s.img)];
    const marina = this.pipa;
    const line: VoiceKey = this.level === 2 ? 'vo-shell-marina' : 'vo-shell-pretty';
    const to = marina ? { x: marina.box.x, y: marina.box.y + 90 * marina.box.scale } : { x: L.W + 300 * k, y: L.Y(300) };
    const c = { x: this.string!.x, y: this.string!.y };
    parts.forEach((o) => {
      const img = o as Phaser.GameObjects.Image;
      this.tweens.add({ targets: img, x: to.x + (img.x - c.x) * 0.12, y: to.y + (img.y - c.y) * 0.12, scaleX: img.scaleX * 0.15, scaleY: img.scaleY * 0.15, alpha: 0, duration: 900, ease: 'Sine.easeIn' });
    });
    sfx(this, 'whoosh', { volume: 0.5 });
    this.time.delayedCall(900, () => {
      if (marina) {
        wearNecklace(this, marina, true);
        sfx(this, 'star');
        stars(this, to.x, to.y, 12, 50 * k);
        marina.react('love');
        this.time.delayedCall(500, () => marina.cheer());
      }
      this.say(line, { ttlMs: 6000, done: () => this.time.delayedCall(1500, () => this.leave('finale')) });
      this.time.delayedCall(9000, () => this.leave('finale'));
    });
  }

  // ---------------------------------------------------------------- Mom's hand

  protected way(): HandMotion | null {
    const p = this.plan();
    const k = this.L.k;
    if (!p) return null;
    if (p.kind === 'carry') {
      const from = { x: p.s.img.x, y: p.s.img.y };
      const to = { x: p.to.at.x, y: p.to.at.y - 90 * p.to.scale };
      return { kind: 'grab', keys: [{ ...from, t: 0 }, { ...from, t: 300 }, { ...to, t: 1500 }, { ...to, t: 1900 }], props: [{ key: IMG[p.s.kind], scale: p.s.scale, alpha: 0.6 }], glow: from };
    }
    if (p.kind === 'dig') return tapMotion(p.s.mound ? { x: p.s.mound.x, y: p.s.mound.y } : p.s.home, k);
    return tapMotion({ x: p.b.at.x, y: p.b.at.y - 20 * k }, k);
  }

  protected helpOnce() {
    const p = this.plan();
    const k = this.L.k;
    if (!p) return false;
    if (p.kind === 'carry') {
      const s = p.s;
      this.tweens.killTweensOf(s.img);
      s.img.setDepth(600);
      this.hand.follow('grab', () => ({ x: s.img.x, y: s.img.y }));
      this.tweens.add({ targets: s.img, x: p.to.at.x, y: p.to.at.y - 100 * p.to.scale, duration: T.helpMs, delay: 250, ease: 'Sine.easeInOut', onComplete: () => (this.helped(), this.into(s, p.to)) });
      return true;
    }
    if (p.kind === 'dig') {
      this.hand.play(tapMotion(p.s.mound ? { x: p.s.mound.x, y: p.s.mound.y } : p.s.home, k));
      this.time.delayedCall(700, () => (this.helped(), this.dig(p.s)));
      return true;
    }
    this.hand.play(tapMotion(p.b.at, k));
    this.time.delayedCall(700, () => (this.helped(), this.thread(p.b, false)));
    return true;
  }

  // ---------------------------------------------------------------- touch

  private shellAt(at: P, states: Shell['state'][]): Shell | null {
    const k = this.L.k;
    let best: Shell | null = null;
    let bd = Infinity;
    for (const s of this.shells) {
      if (!states.includes(s.state)) continue;
      const c = s.state === 'hidden' && s.mound ? { x: s.mound.x, y: s.mound.y - 20 * k } : { x: s.img.x, y: s.img.y };
      const d = Math.hypot(at.x - c.x, at.y - c.y);
      if (d < Math.max(110 * k, 100 * s.img.scale + 40 * k) && d < bd) (best = s), (bd = d);
    }
    return best;
  }

  protected down(p: Phaser.Input.Pointer, at: P) {
    const k = this.L.k;
    if (this.phase === 'sort') {
      const s = this.shellAt(at, ['loose', 'hidden']);
      if (!s) return;
      if (s.state === 'hidden') return this.dig(s);
      this.tweens.killTweensOf(s.img);
      s.img.setDepth(600).setScale(s.scale * 1.12);
      sfx(this, 'tap', { volume: 0.7 });
      this.held = { s, img: s.img, from: at, moved: 0, dx: s.img.x - at.x, dy: s.img.y - at.y };
      this.own(p);
      return;
    }
    if (this.phase === 'thread') {
      const b = this.baskets.find((q) => Math.abs(at.x - q.at.x) < 190 * q.scale + 20 * k && Math.abs(at.y - q.at.y) < 150 * q.scale + 60 * k);
      if (!b) return;
      // a shell of this basket comes up into her finger (a tap threads it, a drag carries it to the string)
      const img = this.add.image(b.at.x, b.at.y - 90 * b.scale, IMG[b.kind]).setScale(this.shellScale * 0.75).setDepth(600);
      boing(this, b.img, 0.05);
      sfx(this, 'tap', { volume: 0.6 });
      this.held = { b, img, from: at, moved: 0, dx: 0, dy: -60 * k };
      this.own(p);
    }
  }

  protected move(p: Phaser.Input.Pointer) {
    const h = this.held;
    if (!h) return;
    const L = this.L;
    const at = { x: Phaser.Math.Clamp(p.worldX, 0, L.W), y: Phaser.Math.Clamp(p.worldY, 0, L.H) };
    h.moved = Math.max(h.moved, Math.hypot(at.x - h.from.x, at.y - h.from.y));
    h.img.setPosition(at.x + h.dx * 0.4, at.y + h.dy * 0.4 - 30 * L.k);
  }

  protected up(_p: Phaser.Input.Pointer, cancelled: boolean) {
    const h = this.held;
    this.held = null;
    if (!h) return;
    const k = this.L.k;
    if (h.b) {
      // the necklace: a tap, or a drag let go near the string, threads it; elsewhere it goes back into its basket
      const nearString = this.string && Math.abs(h.img.y - this.string.y) < 170 * k && h.img.x > this.slots[0].x - 160 * k && h.img.x < this.slots[this.slots.length - 1].x + 160 * k;
      if (!cancelled && this.phase === 'thread' && (h.moved < 30 * k || nearString)) return this.thread(h.b, true, { x: h.img.x, y: h.img.y }, h.img);
      const b = h.b;
      this.tweens.add({ targets: h.img, x: b.at.x, y: b.at.y - 80 * b.scale, alpha: 0, duration: 300, onComplete: () => h.img.destroy() });
      return;
    }
    const s = h.s!;
    if (s.state !== 'loose') return;
    if (cancelled) return this.back(s);
    if (h.moved < 30 * k) {
      // A tap: Mom says its name; easy, it goes into its basket by itself.
      voice.say(NAME[s.kind], { group: 'name', ttlMs: 2500, valid: () => this.scene.isActive() && !this.leaving });
      if (this.level === 1) return this.into(s, this.basketFor(s));
      boing(this, s.img, 0.15);
      return this.back(s);
    }
    const b = this.basketAt({ x: s.img.x, y: s.img.y });
    if (b) return b === this.basketFor(s) ? this.into(s, b) : this.wrong(s, b);
    if (h.moved > 60 * k) this.miss();
    this.back(s);
  }

  private once(what: string) {
    if (this.said.has(what)) return false;
    this.said.add(what);
    return true;
  }

  protected lookTarget() {
    return this.held ? { x: this.held.img.x, y: this.held.img.y } : null;
  }
}
