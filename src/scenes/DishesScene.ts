import Phaser from 'phaser';
import { ART, type ImageKey } from '../core/assets';
import { voice, waterLoop, type NameKey } from '../core/audio';
import { boing, burst, puff, stars } from '../core/fx';
import { type HandMotion } from '../core/hand';
import { confetti, sway } from '../core/juice';
import { addBackground } from '../core/layout';
import { sfx } from '../core/sfx';
import { TUNING } from '../core/tuning';
import { MiniGame, type P } from './MiniGame';

const T = TUNING.dishes;
const D = ART.dishes;
type Colour = 'blue' | 'yellow' | 'pink';
type Kind = 'plate' | 'cup';
const COLOURS: Colour[] = ['blue', 'yellow', 'pink'];
/** Where the food sits on a dish, from its centre, in its own frame (a mug's is on its body, left of the handle). */
const MESS_AT: Record<Kind, { dx: number; dy: number; s: number }> = { plate: { dx: 0, dy: 0, s: 0.85 }, cup: { dx: -20, dy: 16, s: 0.55 } };

interface Dish {
  colour: Colour;
  kind: Kind;
  box: Phaser.GameObjects.Container;
  img: Phaser.GameObjects.Image;
  mess: Phaser.GameObjects.Image;
  /** Its place in the dirty stack. */
  home: P;
  homeScale: number;
  scrub: number;
  state: 'dirty' | 'sink' | 'clean' | 'rack';
}

/**
 * Washing up (research/minigames-spec.md): a game that is not cooking. The dirty dishes wait in a stack by the sink.
 * She puts one in the sink (a tap, or a drag), Mom says its colour, she scrubs it with the sponge (the food fades,
 * bubbles), it is rinsed and sparkles, and she hangs or stands it on the drying rack, in the column of its colour.
 * A wrong column: it floats back to the sink and Mom says "Find the same colour!" (a quiet miss). Level 1: four
 * dishes, any place in the right colour (it goes to its row by itself). Level 2: six, each in its exact place (cups on
 * the hooks, plates in the slots below), and more to scrub. The rack full, a bubble lands on Pipa's nose, Mom
 * celebrates, and it goes quietly home.
 */
export class DishesScene extends MiniGame {
  protected readonly id = 'dishes';
  protected readonly waiting = ['take', 'scrub', 'rack'] as const;
  private dishes: Dish[] = [];
  private cur: Dish | null = null;
  private sink!: { x: number; y: number; s: number; in: P; inScale: number };
  private rack!: { x: number; y: number; s: number };
  private faucet!: { img: Phaser.GameObjects.Image; out: P; stream: Phaser.GameObjects.Image };
  private sponge!: Phaser.GameObjects.Image;
  private spongeRest!: P;
  private held: { what: 'dish' | 'sponge'; from: P; moved: number; last: P; dx: number; dy: number } | null = null;
  private bubbleT = 0;
  private placed = 0;
  private cleanSaid = 0;
  private wrongs = 0;

  constructor() {
    super('Dishes');
  }

  init() {
    super.init();
    this.dishes = [];
    this.cur = null;
    this.held = null;
    this.bubbleT = this.placed = this.cleanSaid = this.wrongs = 0;
    Object.assign(this.shown, { dishes: 0, placed: 0, scrub: 0, wrong: 0, order: [] as string[] });
  }

  private key(d: { colour: Colour; kind: Kind }): ImageKey {
    return `dish-${d.kind}-${d.colour}` as ImageKey;
  }

  protected build() {
    const L = this.L;
    const S = this.S;
    const k = L.k;
    // The kitchen as always (its living pieces too), the counter under everything.
    addBackground(this, L, 'dishes');

    const petLeft = S.pet ? S.pet.x - 270 * S.pet.scale : Infinity;
    const x1 = Math.min(S.momFace.x0, petLeft) - 16 * k;
    const x0 = L.m + 16 * k;
    const colW = 280 * k;

    // The sink, right of the stack, low on the counter; the dish sits over its drain.
    const ss = Math.min(0.85 * k, (x1 - x0 - colW - 20 * k) / 900 / 1.35);
    const sx = x0 + colW + 10 * k + 450 * ss;
    const sy = L.Y(1000) - 250 * ss;
    this.add.image(sx, sy, 'sink-basin').setScale(ss).setDepth(1);
    const inScale = Math.min(0.85 * k, ss * 1.15);
    this.sink = { x: sx, y: sy, s: ss, in: { x: sx - 20 * ss, y: sy + 60 * ss }, inScale };
    // The tap on the back rim (as washing hands has it, scaled with the sink).
    const fs = S.faucetScale * (ss / (1.1 * k));
    const fb = { x: sx - 136 * ss, y: sy - 227 * ss };
    const fimg = this.add.image(fb.x, fb.y, 'faucet').setScale(fs).setDepth(3).setOrigin(120 / 320, ART.prep.faucetBase / 400);
    const out = { x: fb.x + (ART.prep.faucetOut.x - 120) * fs, y: fb.y + (ART.prep.faucetOut.y - ART.prep.faucetBase) * fs };
    const stream = this.add.image(out.x, out.y - 4 * k, 'water-stream').setOrigin(0.5, 0).setDepth(2).setScale(k * ss / 0.72, 0).setVisible(false);
    this.faucet = { img: fimg, out, stream };

    // The rack: on the wall right of the tap, above the sink (clear of Mom's face, and of Pipa below it).
    const faucetRight = fb.x + 200 * fs;
    const bottom = sy - 280 * ss - 10 * k;
    const top = Math.max(30 * k, L.Y(20));
    const left = Math.max(faucetRight + 24 * k, S.home.x + 150 * k);
    const right = bottom < S.momFace.y0 ? L.W - L.m - 16 * k : S.momFace.x0 - 20 * k;
    const rs = Math.min(0.85 * k, (right - left) / 960, (bottom - top) / 720);
    this.rack = { x: (left + right) / 2, y: bottom - 360 * rs, s: rs };
    this.add.image(this.rack.x, this.rack.y, 'dish-rack').setScale(rs).setDepth(4);

    // The sponge waits in the sink's right end.
    this.spongeRest = { x: sx + 300 * ss, y: sy + 40 * ss };
    this.sponge = this.add.image(this.spongeRest.x, this.spongeRest.y, 'dish-sponge').setScale(0.7 * k).setDepth(20).setAngle(-12);

    // The dirty dishes: level 1 four of the six (a colour and a kind each, never two alike), level 2 all six.
    const all = COLOURS.flatMap((colour) => (['plate', 'cup'] as Kind[]).map((kind) => ({ colour, kind })));
    const set = Phaser.Utils.Array.Shuffle(all).slice(0, T.dishes[this.level - 1]);
    const hs = 0.68 * k;
    const bx = x0 + colW / 2;
    const base = L.Y(960) - 130 * hs;
    const step = Math.min(92 * k, (base - L.Y(330)) / Math.max(1, set.length - 1));
    set.forEach((d, i) => {
      const home = { x: bx + (i % 2 ? 12 : -12) * k, y: base - i * step };
      const img = this.add.image(0, 0, this.key(d));
      const m = MESS_AT[d.kind];
      const mess = this.add.image(m.dx, m.dy, 'dish-mess').setScale(m.s).setAngle(Phaser.Math.Between(0, 359));
      const box = this.add.container(home.x, home.y, [img, mess]).setScale(hs).setDepth(10 + i);
      this.dishes.push({ ...d, box, img, mess, home, homeScale: hs, scrub: 0, state: 'dirty' });
    });
    this.shown.dishes = set.length;
    this.shown.order = set.map((d) => `${d.colour}-${d.kind}`);
  }

  protected ready() {
    this.time.delayedCall(500, () => this.startTake());
  }

  protected shutdown() {
    waterLoop.stop();
  }

  // ---------------------------------------------------------------- 1. into the sink

  private top(): Dish | null {
    const d = this.dishes.filter((q) => q.state === 'dirty');
    return d[d.length - 1] ?? null;
  }

  private startTake() {
    this.cur = null;
    this.begin('take', this.placed === 0 ? 'vo-dishes-start' : null);
  }

  private dropIn(d: Dish) {
    const L = this.L;
    const k = L.k;
    this.setPhase('intro');
    d.state = 'sink';
    this.cur = d;
    this.tweens.killTweensOf(d.box);
    d.box.setDepth(15);
    this.tweens.add({
      targets: d.box,
      x: this.sink.in.x,
      y: this.sink.in.y,
      scale: this.sink.inScale,
      angle: 0,
      duration: 380,
      ease: 'Quad.easeIn',
      onComplete: () => {
        sfx(this, 'bubbles');
        burst(this, this.sink.in.x, this.sink.in.y, { texture: 'water-drop', count: 8, size: 26 * k, speed: 420, gravityY: 900, lifespan: 600, depth: 30 });
        for (let i = 0; i < 5; i++) this.bubble(this.sink.in.x + Phaser.Math.Between(-140, 140) * k, this.sink.in.y + Phaser.Math.Between(-40, 60) * k);
        voice.say(`name-${d.colour}` as NameKey, { group: 'name', ttlMs: 2500, valid: () => this.scene.isActive() && !this.leaving });
        this.time.delayedCall(500, () => this.begin('scrub', this.placed === 0 ? 'vo-dishes-scrub' : null));
      },
    });
  }

  // ---------------------------------------------------------------- 2. scrubbing

  private need() {
    return T.scrub[this.level - 1] * this.L.k;
  }

  private onDish(at: P, d: Dish) {
    const r = (d.kind === 'plate' ? D.plateR : 130) * d.box.scale + 50 * this.L.k;
    return this.near(at, { x: d.box.x, y: d.box.y }, Math.max(r, 140 * this.L.k));
  }

  private bubble(x: number, y: number) {
    const k = this.L.k;
    const b = this.add.image(x, y, 'bubble').setScale(0).setDepth(22).setAlpha(0.9);
    const s = Phaser.Math.FloatBetween(0.25, 0.5) * k;
    this.tweens.add({ targets: b, scale: s, duration: 220, ease: 'Back.easeOut' });
    this.tweens.add({ targets: b, y: y - Phaser.Math.Between(40, 120) * k, alpha: 0, duration: 1400, delay: 500, ease: 'Sine.easeIn', onComplete: () => b.destroy() });
  }

  /** Scrubbing adds up: the food fades, bubbles grow where the sponge goes. */
  private scrub(d: Dish, dist: number, at: P) {
    if (d.state !== 'sink') return;
    d.scrub += dist;
    this.bubbleT += dist;
    const t = Math.min(1, d.scrub / this.need());
    d.mess.setAlpha(1 - t);
    this.shown.scrub = Math.round(t * 100) / 100;
    if (this.bubbleT > T.bubbleEvery * this.L.k) {
      this.bubbleT = 0;
      this.bubble(at.x + Phaser.Math.Between(-30, 30) * this.L.k, at.y + Phaser.Math.Between(-20, 20) * this.L.k);
      sfx(this, 'bubbles', { minGapMs: 450, volume: 0.6 });
    }
    this.poke();
    if (t >= 1) this.clean(d);
  }

  /** Clean: the sponge goes back, the tap rinses it, it sparkles; then it goes to the rack. */
  private clean(d: Dish) {
    const L = this.L;
    const k = L.k;
    d.state = 'clean';
    this.setPhase('intro');
    if (this.held?.what === 'sponge') {
      this.held = null;
      this.owner = null;
    }
    this.tweens.add({ targets: this.sponge, x: this.spongeRest.x, y: this.spongeRest.y, angle: -12, duration: 300 });
    // the rinse
    const f = this.faucet;
    const h = d.box.y - 40 * k - f.out.y;
    f.stream.setVisible(true).setScale(f.stream.scaleX, 0);
    this.tweens.add({ targets: f.stream, scaleY: Math.max(0.1, h / 420), duration: 200 });
    waterLoop.start();
    this.time.delayedCall(900, () => {
      waterLoop.stop();
      this.tweens.add({ targets: f.stream, scaleY: 0, duration: 200, onComplete: () => f.stream.setVisible(false) });
      sfx(this, 'star');
      stars(this, d.box.x, d.box.y, 8, 44 * k);
      boing(this, d.box, 0.1);
      this.mom?.happy();
      if (this.cleanSaid++ < 2) this.say('vo-dishes-clean', { ttlMs: 3000 });
      this.time.delayedCall(700, () => {
        this.mom?.rest();
        this.begin('rack', this.placed === 0 ? (this.level === 2 ? 'vo-dishes-rack-2' : 'vo-dishes-rack') : null);
      });
    });
  }

  // ---------------------------------------------------------------- 3. the rack

  /** A place on the rack: a column per colour, the hooks (cups) above, the slots (plates) below. */
  private place(colour: Colour, kind: Kind): P {
    const r = this.rack;
    const cx = r.x + (D.cols[COLOURS.indexOf(colour)] - 480) * r.s;
    if (kind === 'plate') return { x: cx, y: r.y + (D.slotY - 360) * r.s };
    // a cup hangs by its handle's top: its centre is below-left of the hook
    const hx = cx + D.hook.dx * r.s;
    const hy = r.y + (D.hook.y - 360) * r.s;
    const cs = this.cupScale();
    return { x: hx - (D.cupHook.x - 140) * cs, y: hy - (D.cupHook.y - 130) * cs };
  }

  private cupScale() {
    return this.rack.s * 0.85;
  }

  private taken(colour: Colour, kind: Kind) {
    return this.dishes.some((d) => d.state === 'rack' && d.colour === colour && d.kind === kind);
  }

  /** Where it was let go: the right place, the right colour in the wrong row (level 2), a wrong colour, or nowhere. */
  private judge(d: Dish, at: P): 'ok' | 'row' | 'colour' | 'none' {
    const r = this.rack;
    const k = this.L.k;
    const reach = T.reach * k;
    const w = 480 * r.s;
    const h = 360 * r.s;
    if (Math.abs(at.x - r.x) > w + reach * 0.5 || Math.abs(at.y - r.y) > h + reach * 0.5) return 'none';
    // the nearest column
    const col = COLOURS.map((c, i) => ({ c, dx: Math.abs(at.x - (r.x + (D.cols[i] - 480) * r.s)) })).sort((a, b) => a.dx - b.dx)[0].c;
    if (col !== d.colour) return 'colour';
    if (this.level === 1) return 'ok';
    const hookY = r.y + (D.hook.y - 360 + 110) * r.s;
    const slotY = r.y + (D.slotY - 360) * r.s;
    const row: Kind = Math.abs(at.y - hookY) < Math.abs(at.y - slotY) ? 'cup' : 'plate';
    return row === d.kind ? 'ok' : 'row';
  }

  private putOnRack(d: Dish) {
    const L = this.L;
    const k = L.k;
    this.setPhase('intro');
    d.state = 'rack';
    this.cur = null;
    this.placed++;
    this.shown.placed = this.placed;
    const to = this.place(d.colour, d.kind);
    d.mess.destroy();
    this.tweens.killTweensOf(d.box);
    d.box.setDepth(6);
    this.tweens.add({
      targets: d.box,
      x: to.x,
      y: to.y,
      scale: d.kind === 'plate' ? this.rack.s : this.cupScale(),
      angle: 0,
      duration: 320,
      ease: 'Back.easeOut',
      onComplete: () => {
        sfx(this, 'click');
        sfx(this, 'pop', { volume: 0.6 });
        burst(this, to.x, to.y, { texture: 'star', count: 5, size: 28 * k, speed: 260, gravityY: 500, lifespan: 500, depth: 70 });
        if (d.kind === 'cup') this.tweens.add({ targets: d.box, angle: { from: 8, to: 0 }, duration: 600, ease: 'Elastic.easeOut' });
      },
    });
    this.poke();
    if (this.dishes.every((q) => q.state === 'rack')) return this.time.delayedCall(700, () => this.finale());
    this.praise(this.rack.x, this.rack.y, () => this.startTake(), 300);
  }

  /** The wrong place: it floats back to the sink, Mom says what to look for; the second time her hand shows it. */
  private wrong(d: Dish, why: 'row' | 'colour') {
    this.wrongs++;
    this.shown.wrong = this.wrongs;
    this.backToSink(d);
    sfx(this, 'squish', { volume: 0.6 });
    this.say(why === 'colour' ? 'vo-dishes-colour' : 'vo-dishes-rack-2', { ttlMs: 3500 });
    voice.say(`name-${d.colour}` as NameKey, { group: 'name', ttlMs: 4500, valid: () => this.scene.isActive() && !this.leaving });
    this.miss();
  }

  private backToSink(d: Dish) {
    this.tweens.killTweensOf(d.box);
    this.tweens.add({ targets: d.box, x: this.sink.in.x, y: this.sink.in.y, scale: this.sink.inScale, angle: 0, duration: 380, ease: 'Back.easeOut', onComplete: () => d.box.setDepth(15) });
  }

  // ---------------------------------------------------------------- the finale

  private finale() {
    const L = this.L;
    const k = L.k;
    this.setPhase('done');
    this.shown.done = true;
    sfx(this, 'star');
    for (const d of this.dishes) stars(this, d.box.x, d.box.y, 3, 30 * k);
    // one last bubble floats up to Pipa's nose (or to Mom's) and pops: a giggle
    const who = this.pipa?.visible ? this.pipa : null;
    const to = who ? who.mouthAt : this.mom?.mouthAt;
    if (to) {
      const b = this.add.image(this.sink.in.x, this.sink.in.y, 'bubble').setScale(0.4 * k).setDepth(600).setAlpha(0.9);
      this.tweens.add({
        targets: b,
        x: to.x,
        y: to.y - 30 * k,
        duration: 1500,
        ease: 'Sine.easeInOut',
        onComplete: () => {
          sfx(this, 'pop');
          puff(this, b.x, b.y, 0xdff3fa, 6, 50 * k);
          b.destroy();
          if (who) who.react('giggle');
          else this.mom?.happy();
        },
      });
    }
    this.time.delayedCall(1800, () => {
      sfx(this, 'cheer-jingle');
      stars(this, this.rack.x, this.rack.y, 14, 70 * k);
      confetti(this, this.rack.x, L.Y(260), 22, 28 * k);
      this.mom?.celebrate();
      this.pipa?.cheer();
      this.goodbye('vo-dishes-done');
    });
  }

  // ---------------------------------------------------------------- Mom's hand

  /** A little scrubbing circle over the dish, t0..t1 (ms). */
  private circle(c: P, r: number, t0: number, t1: number) {
    const keys = [];
    for (let i = 0; i <= 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      keys.push({ x: c.x + Math.cos(a) * r, y: c.y + Math.sin(a) * r * 0.7, t: t0 + ((t1 - t0) * i) / 8 });
    }
    return keys;
  }

  protected way(): HandMotion | null {
    const k = this.L.k;
    switch (this.phase) {
      case 'take': {
        const d = this.top();
        if (!d) return null;
        return {
          kind: 'grab',
          keys: [
            { ...d.home, t: 0 },
            { ...d.home, t: 300 },
            { ...this.sink.in, t: 1400 },
            { ...this.sink.in, t: 1800 },
          ],
          props: [{ key: this.key(d), scale: d.homeScale, endScale: this.sink.inScale, alpha: 0.6 }],
          glow: d.home,
        };
      }
      case 'scrub': {
        const d = this.cur;
        if (!d) return null;
        const c = { x: d.box.x, y: d.box.y };
        return { kind: 'grab', keys: [...this.circle(c, 70 * k, 0, 1100), ...this.circle(c, 70 * k, 1200, 2300)], props: [{ key: 'dish-sponge', scale: 0.7 * k, alpha: 0.7 }], glow: c };
      }
      case 'rack': {
        const d = this.cur;
        if (!d) return null;
        const to = this.place(d.colour, d.kind);
        return {
          kind: 'grab',
          keys: [
            { ...this.sink.in, t: 0 },
            { ...this.sink.in, t: 300 },
            { ...to, t: 1500 },
            { ...to, t: 1900 },
          ],
          props: [{ key: this.key(d), scale: this.sink.inScale, endScale: d.kind === 'plate' ? this.rack.s : this.cupScale(), alpha: 0.6 }],
          glow: this.sink.in,
        };
      }
      default:
        return null;
    }
  }

  protected helpOnce() {
    const k = this.L.k;
    if (this.phase === 'take') {
      const d = this.top();
      if (!d) return false;
      this.hand.follow('grab', () => ({ x: d.box.x, y: d.box.y }));
      this.tweens.add({ targets: d.box, x: this.sink.in.x, y: this.sink.in.y - 60 * k, duration: T.helpMs, delay: 250, ease: 'Sine.easeInOut', onComplete: () => (this.helped(), this.dropIn(d)) });
      return true;
    }
    if (this.phase === 'scrub' && this.cur) {
      const d = this.cur;
      const sp = this.sponge;
      this.hand.follow('grab', () => ({ x: sp.x, y: sp.y }));
      let last = { x: sp.x, y: sp.y };
      this.tweens.addCounter({
        from: 0,
        to: 1,
        duration: T.scrubMs,
        onUpdate: (tw) => {
          const t = tw.getValue()!;
          const a = t * Math.PI * 6;
          sp.setPosition(d.box.x + Math.cos(a) * 70 * k, d.box.y + Math.sin(a) * 50 * k);
          const dist = Math.hypot(sp.x - last.x, sp.y - last.y);
          last = { x: sp.x, y: sp.y };
          if (d.state === 'sink') this.scrub(d, Math.max(dist, (this.need() * 1.05) / 60), last);
        },
        onComplete: () => {
          this.helped();
          if (d.state === 'sink') this.scrub(d, this.need(), last);
        },
      });
      return true;
    }
    if (this.phase === 'rack' && this.cur) {
      const d = this.cur;
      const to = this.place(d.colour, d.kind);
      this.hand.follow('grab', () => ({ x: d.box.x, y: d.box.y }));
      d.box.setDepth(600);
      this.tweens.add({ targets: d.box, x: to.x, y: to.y, duration: T.helpMs, delay: 250, ease: 'Sine.easeInOut', onComplete: () => (this.helped(), this.putOnRack(d)) });
      return true;
    }
    return false;
  }

  // ---------------------------------------------------------------- touch

  protected down(p: Phaser.Input.Pointer, at: P) {
    const k = this.L.k;
    switch (this.phase) {
      case 'take': {
        const d = this.top();
        if (!d || !this.near(at, d.box, Math.max(130 * k, 110 * d.box.scale + 40 * k))) return;
        this.tweens.killTweensOf(d.box);
        d.box.setDepth(600);
        sfx(this, 'tap', { volume: 0.7 });
        this.cur = d;
        this.held = { what: 'dish', from: at, moved: 0, last: at, dx: d.box.x - at.x, dy: d.box.y - at.y };
        this.own(p);
        return;
      }
      case 'scrub': {
        const d = this.cur;
        if (!d) return;
        const onSponge = this.near(at, this.sponge, 120 * k);
        if (!onSponge && !this.onDish(at, d)) return;
        // The sponge comes to her finger wherever she starts on the dish.
        this.tweens.killTweensOf(this.sponge);
        this.sponge.setPosition(at.x, at.y).setAngle(0);
        boing(this, this.sponge, 0.1);
        sfx(this, 'squish', { volume: 0.5 });
        this.held = { what: 'sponge', from: at, moved: 0, last: at, dx: 0, dy: 0 };
        this.own(p);
        return;
      }
      case 'rack': {
        const d = this.cur;
        if (!d || !this.onDish(at, d)) return;
        this.tweens.killTweensOf(d.box);
        d.box.setDepth(600);
        sfx(this, 'tap', { volume: 0.7 });
        this.held = { what: 'dish', from: at, moved: 0, last: at, dx: d.box.x - at.x, dy: d.box.y - at.y };
        this.own(p);
        return;
      }
      default:
    }
  }

  protected move(p: Phaser.Input.Pointer) {
    const h = this.held;
    if (!h) return;
    const L = this.L;
    const at = { x: Phaser.Math.Clamp(p.worldX, 0, L.W), y: Phaser.Math.Clamp(p.worldY, 0, L.H) };
    const dist = Math.hypot(at.x - h.last.x, at.y - h.last.y);
    h.moved = Math.max(h.moved, Math.hypot(at.x - h.from.x, at.y - h.from.y));
    h.last = at;
    if (h.what === 'sponge') {
      this.sponge.setPosition(at.x, at.y);
      sway(this, this.sponge, p.worldX - p.prevPosition.x, L.k);
      const d = this.cur;
      if (d && this.onDish(at, d)) this.scrub(d, dist, at);
      return;
    }
    const d = this.cur;
    if (!d) return;
    d.box.setPosition(at.x + h.dx, at.y + h.dy);
    // (on its way to the rack it shrinks toward its size there)
    if (this.phase === 'rack') {
      const toS = d.kind === 'plate' ? this.rack.s : this.cupScale();
      const t = Phaser.Math.Clamp((this.sink.in.y - d.box.y) / Math.max(1, this.sink.in.y - this.rack.y), 0, 1);
      d.box.setScale(Phaser.Math.Linear(this.sink.inScale, Math.max(toS, this.sink.inScale * 0.7), t));
    }
  }

  protected up(_p: Phaser.Input.Pointer, cancelled: boolean) {
    const h = this.held;
    this.held = null;
    if (!h) return;
    const k = this.L.k;
    if (h.what === 'sponge') {
      if (this.phase === 'scrub') this.tweens.add({ targets: this.sponge, x: this.spongeRest.x, y: this.spongeRest.y, angle: -12, duration: 300, ease: 'Back.easeOut' });
      return;
    }
    const d = this.cur;
    if (!d) return;
    if (this.phase === 'take') {
      // A tap, or a drag let go near the sink: in it goes. Elsewhere it floats back to the stack.
      const inSink = this.near({ x: d.box.x, y: d.box.y }, this.sink.in, 360 * this.sink.s + 60 * k);
      if (!cancelled && (h.moved < 40 * k || inSink)) return this.dropIn(d);
      if (!cancelled) this.miss();
      this.cur = null;
      this.tweens.add({ targets: d.box, x: d.home.x, y: d.home.y, scale: d.homeScale, duration: 380, ease: 'Back.easeOut', onComplete: () => d.box.setDepth(10 + this.dishes.indexOf(d)) });
      return;
    }
    if (this.phase === 'rack') {
      if (cancelled) return this.backToSink(d);
      const j = this.judge(d, { x: d.box.x, y: d.box.y });
      if (j === 'ok' && !this.taken(d.colour, d.kind)) return this.putOnRack(d);
      if (j === 'colour' || j === 'row') return this.wrong(d, j);
      // Not near the rack: back into the sink, quietly (a tap only lifts it a little).
      if (h.moved > 40 * k) this.miss();
      this.backToSink(d);
    }
  }

  protected lookTarget() {
    if (!this.held) return null;
    return this.held.what === 'sponge' ? { x: this.sponge.x, y: this.sponge.y } : this.cur ? { x: this.cur.box.x, y: this.cur.box.y } : null;
  }
}
