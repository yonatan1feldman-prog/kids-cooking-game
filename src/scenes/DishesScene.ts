import Phaser from 'phaser';
import { ART, FX_DOT, type ImageKey } from '../core/assets';
import { music, voice, waterLoop, type NameKey, type VoiceKey } from '../core/audio';
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
/** Where a stubborn spot may sit, in the dish's own frame (on the plate's well, on the mug's body). */
const SPOT_AT: Record<Kind, P[]> = {
  plate: [{ x: -50, y: -40 }, { x: 55, y: 30 }, { x: -20, y: 60 }, { x: 45, y: -55 }],
  cup: [{ x: -60, y: 0 }, { x: 10, y: 50 }, { x: -30, y: 70 }, { x: 20, y: -10 }],
};
const SPOT_TINT = 0x5a3a28;

interface Spot {
  img: Phaser.GameObjects.Image;
  rub: number;
  finger: number;
  gone: boolean;
}

interface Dish {
  colour: Colour;
  kind: Kind;
  /** Its size (hard: the plates come small, medium and big; 1 = the drawing's size). */
  size: number;
  box: Phaser.GameObjects.Container;
  img: Phaser.GameObjects.Image;
  mess: Phaser.GameObjects.Image;
  spots: Spot[];
  /** Its place in the dirty stack. */
  home: P;
  homeScale: number;
  scrub: number;
  dry: number;
  state: 'dirty' | 'sink' | 'clean' | 'rack' | 'pile';
}

/**
 * Washing up (research/minigames-spec.md): a game that is not cooking. The dirty dishes wait in a stack by the sink.
 * She puts one in the sink (a tap, or a drag), Mom says its colour, she scrubs it (the finger, or the sponge; the food
 * fades, bubbles), it is rinsed and sparkles, she dries it on the towel, and she hangs or stands it on the drying rack,
 * in the column of its colour. A wrong column: it floats back and Mom says "Find the same colour!" (a quiet miss).
 * Level 1: four dishes, any place in the right colour (it goes to its row by itself). Level 2: six, each in its exact
 * place (cups on the hooks, plates in the slots below), and more to scrub.
 *
 * The challenge round (research/challenge-spec.md): a dish dried before the rack (a wet one comes back: "Let's dry it
 * first!"); one dish in three has stubborn spots only the sponge takes off ("Try the sponge!"); on level 2 the plates
 * come in three sizes and, once the rack is full, she stacks them where the dirty stack was, the biggest first; then
 * Pipa's bubble asks for one dish ("the yellow cup") and she brings it to her. The rack full, a bubble lands on Pipa's
 * nose, Mom celebrates, and it goes quietly home.
 */
export class DishesScene extends MiniGame {
  protected readonly id = 'dishes';
  protected readonly waiting = ['take', 'scrub', 'dry', 'rack', 'stack', 'pipa'] as const;
  private dishes: Dish[] = [];
  private cur: Dish | null = null;
  /** Where the current dish rests (in the sink, or on the towel) and its size there. */
  private rest: { at: P; s: number; where: 'sink' | 'towel' } = { at: { x: 0, y: 0 }, s: 1, where: 'sink' };
  private sink!: { x: number; y: number; s: number; in: P; inScale: number };
  private rack!: { x: number; y: number; s: number };
  private faucet!: { img: Phaser.GameObjects.Image; out: P; stream: Phaser.GameObjects.Image };
  private sponge!: Phaser.GameObjects.Image;
  private spongeRest!: P;
  private towel!: Phaser.GameObjects.Image;
  private towelPeg!: P;
  private towelScale = 1;
  /** Where a dish sits to be dried: in front of the towel. */
  private towelSpot!: P;
  /** The empty stack's place: the plates' pile on level 2. */
  private pileAt!: P;
  private pile: Dish[] = [];
  private held: { what: 'dish' | 'sponge' | 'finger' | 'towel' | 'rub'; from: P; moved: number; last: P; dx: number; dy: number } | null = null;
  private bubbleT = 0;
  private dropT = 0;
  private placed = 0;
  private cleanSaid = 0;
  private drySaid = 0;
  private wrongs = 0;
  private spongeSaid = false;
  private wish: Dish | null = null;

  constructor() {
    super('Dishes');
  }

  init() {
    super.init();
    this.dishes = [];
    this.pile = [];
    this.cur = this.wish = null;
    this.held = null;
    this.spongeSaid = false;
    this.bubbleT = this.dropT = this.placed = this.cleanSaid = this.drySaid = this.wrongs = 0;
    Object.assign(this.shown, { dishes: 0, placed: 0, scrub: 0, dry: 0, wrong: 0, wet: 0, spots: 0, spotsOff: 0, sponge: 0, piled: 0, pileWrong: 0, pipa: '', pipaWrong: 0, pipaGot: false, order: [] as string[] });
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

    // The towel hangs from its peg right of the sink (in the room left before Pipa / Mom's face).
    const sinkRight = sx + 450 * ss;
    const ts = Math.max(0.55 * k, Math.min(0.85 * k, (x1 - sinkRight - 16 * k) / 220));
    this.towelScale = ts;
    this.towelPeg = { x: Math.min(sinkRight + 8 * k + 110 * ts, x1 - 110 * ts), y: sy - 170 * ss };
    this.towel = this.add.image(this.towelPeg.x, this.towelPeg.y, 'dishes-towel').setOrigin(0.5, 22 / 320).setScale(ts).setDepth(5);
    this.towelSpot = { x: this.towelPeg.x, y: this.towelPeg.y + 170 * ts };

    // The dirty dishes: level 1 four of the six (a colour and a kind each, never two alike), level 2 all six.
    const all = COLOURS.flatMap((colour) => (['plate', 'cup'] as Kind[]).map((kind) => ({ colour, kind })));
    const set = Phaser.Utils.Array.Shuffle(all).slice(0, T.dishes[this.level - 1]);
    // (level 2: the plates come in three sizes, shuffled)
    const sizes = Phaser.Utils.Array.Shuffle(T.sizeScale.slice(0, T.sizes[this.level - 1]));
    let pi = 0;
    const hs = 0.68 * k;
    const bx = x0 + colW / 2;
    const base = L.Y(960) - 130 * hs;
    this.pileAt = { x: bx, y: base };
    const step = Math.min(92 * k, (base - L.Y(330)) / Math.max(1, set.length - 1));
    // (one dish in three has stubborn spots: never the first one she washes, so she meets the sponge's job a little later)
    const spotted = new Set<number>();
    for (let i = set.length - 2; i >= 0; i -= T.spotEvery) spotted.add(i);
    set.forEach((d, i) => {
      const size = d.kind === 'plate' ? sizes[pi++ % sizes.length] : 1;
      const home = { x: bx + (i % 2 ? 12 : -12) * k, y: base - i * step };
      const img = this.add.image(0, 0, this.key(d));
      const m = MESS_AT[d.kind];
      const mess = this.add.image(m.dx, m.dy, 'dish-mess').setScale(m.s).setAngle(Phaser.Math.Between(0, 359));
      const spots: Spot[] = [];
      if (spotted.has(i)) {
        for (const at of Phaser.Utils.Array.Shuffle([...SPOT_AT[d.kind]]).slice(0, T.spots[this.level - 1])) {
          const s = this.add.image(at.x, at.y, FX_DOT).setTint(SPOT_TINT).setAlpha(0.92).setScale(1.5, 1.2).setAngle(Phaser.Math.Between(0, 90));
          spots.push({ img: s, rub: 0, finger: 0, gone: false });
        }
      }
      const box = this.add.container(home.x, home.y, [img, mess, ...spots.map((q) => q.img)]).setScale(hs * size).setDepth(10 + i);
      this.dishes.push({ ...d, size, box, img, mess, spots, home, homeScale: hs * size, scrub: 0, dry: 0, state: 'dirty' });
    });
    this.shown.dishes = set.length;
    this.shown.spots = this.dishes.reduce((n, d) => n + d.spots.length, 0);
    this.shown.order = set.map((d) => `${d.colour}-${d.kind}`);
  }

  protected ready() {
    this.time.delayedCall(500, () => this.startTake());
  }

  protected shutdown() {
    waterLoop.stop();
  }

  private sayName(key: NameKey, ttlMs = 2500) {
    voice.say(key, { group: 'name', ttlMs, valid: () => this.scene.isActive() && !this.leaving });
  }

  /** A line, then a dish's colour and kind ("the yellow cup"). */
  private sayDish(line: VoiceKey | null, d: Dish) {
    if (line) this.say(line, { ttlMs: 4000 });
    voice.say(`name-${d.colour}` as NameKey, { ttlMs: 5000, valid: () => this.scene.isActive() && !this.leaving });
    voice.say(`name-${d.kind}` as NameKey, { ttlMs: 6000, valid: () => this.scene.isActive() && !this.leaving });
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
    this.rest = { at: this.sink.in, s: this.sink.inScale * d.size, where: 'sink' };
    this.tweens.killTweensOf(d.box);
    d.box.setDepth(15);
    this.tweens.add({
      targets: d.box,
      x: this.sink.in.x,
      y: this.sink.in.y,
      scale: this.rest.s,
      angle: 0,
      duration: 380,
      ease: 'Quad.easeIn',
      onComplete: () => {
        sfx(this, 'bubbles');
        burst(this, this.sink.in.x, this.sink.in.y, { texture: 'water-drop', count: 8, size: 26 * k, speed: 420, gravityY: 900, lifespan: 600, depth: 30 });
        for (let i = 0; i < 5; i++) this.bubble(this.sink.in.x + Phaser.Math.Between(-140, 140) * k, this.sink.in.y + Phaser.Math.Between(-40, 60) * k);
        this.sayName(`name-${d.colour}` as NameKey);
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

  /** A spot's place on the screen (the dish is level while it is washed). */
  private spotAt(d: Dish, s: Spot): P {
    return { x: d.box.x + s.img.x * d.box.scale, y: d.box.y + s.img.y * d.box.scale };
  }

  private spotsLeft(d: Dish) {
    return d.spots.filter((s) => !s.gone);
  }

  private bubble(x: number, y: number) {
    const k = this.L.k;
    const b = this.add.image(x, y, 'bubble').setScale(0).setDepth(22).setAlpha(0.9);
    const s = Phaser.Math.FloatBetween(0.25, 0.5) * k;
    this.tweens.add({ targets: b, scale: s, duration: 220, ease: 'Back.easeOut' });
    this.tweens.add({ targets: b, y: y - Phaser.Math.Between(40, 120) * k, alpha: 0, duration: 1400, delay: 500, ease: 'Sine.easeIn', onComplete: () => b.destroy() });
  }

  /** Scrubbing adds up: the food fades, bubbles grow where the finger or the sponge goes; only the sponge takes a stubborn spot off. */
  private scrub(d: Dish, dist: number, at: P, sponge: boolean) {
    if (d.state !== 'sink') return;
    const k = this.L.k;
    d.scrub += dist;
    this.bubbleT += dist;
    const t = Math.min(1, d.scrub / this.need());
    d.mess.setAlpha(1 - t);
    this.shown.scrub = Math.round(t * 100) / 100;
    if (this.bubbleT > T.bubbleEvery * k) {
      this.bubbleT = 0;
      this.bubble(at.x + Phaser.Math.Between(-30, 30) * k, at.y + Phaser.Math.Between(-20, 20) * k);
      sfx(this, 'bubbles', { minGapMs: 450, volume: 0.6 });
    }
    for (const s of this.spotsLeft(d)) {
      if (!this.near(at, this.spotAt(d, s), 75 * k)) continue;
      if (sponge) {
        s.rub += dist;
        s.img.setAlpha(0.92 - 0.4 * Math.min(1, s.rub / (T.spotRub * k)));
        if (s.rub >= T.spotRub * k) this.spotOff(d, s);
      } else if ((s.finger += dist) > T.spotFinger * k && !this.spongeSaid) {
        // The finger alone does not get it: Mom points at the sponge (once a visit), the sponge hops.
        this.spongeSaid = true;
        this.shown.sponge = 1;
        this.say('vo-try-sponge', { ttlMs: 3500 });
        boing(this, this.sponge, 0.2);
        stars(this, this.sponge.x, this.sponge.y, 4, 30 * k);
      }
    }
    this.poke();
    if (t >= 1 && !this.spotsLeft(d).length) this.clean(d);
  }

  private spotOff(d: Dish, s: Spot) {
    const k = this.L.k;
    s.gone = true;
    this.shown.spotsOff = (this.shown.spotsOff as number) + 1;
    const at = this.spotAt(d, s);
    sfx(this, 'pop');
    puff(this, at.x, at.y, 0xdff3fa, 6, 40 * k);
    stars(this, at.x, at.y, 3, 26 * k);
    this.tweens.add({ targets: s.img, alpha: 0, scale: 0.3, duration: 220, onComplete: () => s.img.setVisible(false) });
  }

  /** Clean: the sponge goes back, the tap rinses it, it sparkles; then it is dried. */
  private clean(d: Dish) {
    const L = this.L;
    const k = L.k;
    d.state = 'clean';
    this.setPhase('intro');
    if (this.held && this.held.what !== 'dish') {
      this.held = null;
      this.owner = null;
    }
    this.tweens.killTweensOf(this.sponge);
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
      // (still wet: a few drops run off it)
      burst(this, d.box.x, d.box.y + 30 * k, { texture: 'water-drop', count: 5, size: 22 * k, speed: 160, gravityY: 900, lifespan: 600, depth: 30 });
      this.time.delayedCall(700, () => {
        this.mom?.rest();
        this.begin('dry', this.drySaid++ < 2 ? 'vo-dry' : null);
      });
    });
  }

  // ---------------------------------------------------------------- 3. drying

  private dryNeed() {
    return T.dry[this.level - 1] * this.L.k;
  }

  private onTowel(at: P) {
    const k = this.L.k;
    const ts = this.towelScale;
    return Math.abs(at.x - this.towelPeg.x) < Math.max(100 * k, 120 * ts) && at.y > this.towelPeg.y - 30 * k && at.y < this.towelPeg.y + 320 * ts + 20 * k;
  }

  /** The dish goes to the towel (a tap on it or on the towel, or let go near the towel). */
  private toTowel(d: Dish) {
    this.rest = { at: this.towelSpot, s: this.sink.inScale * 0.85 * d.size, where: 'towel' };
    this.tweens.killTweensOf(d.box);
    d.box.setDepth(15);
    this.tweens.add({ targets: d.box, x: this.towelSpot.x, y: this.towelSpot.y, scale: this.rest.s, angle: 0, duration: 340, ease: 'Back.easeOut' });
    sfx(this, 'whoosh', { volume: 0.4 });
    this.tweens.add({ targets: this.towel, angle: { from: -4, to: 0 }, duration: 500, ease: 'Elastic.easeOut' });
  }

  /** Drying adds up: the towel (or the finger on the dish at the towel) rubs, drops fly off, a squeak. */
  private dryRub(d: Dish, dist: number, at: P) {
    if (d.state !== 'clean' || this.phase !== 'dry') return;
    const k = this.L.k;
    d.dry += dist;
    this.dropT += dist;
    this.shown.dry = Math.round(Math.min(1, d.dry / this.dryNeed()) * 100) / 100;
    if (this.dropT > T.dropEvery * k) {
      this.dropT = 0;
      burst(this, at.x, at.y, { texture: 'water-drop', count: 2, size: 20 * k, speed: 260, gravityY: 900, lifespan: 550, depth: 30 });
      sfx(this, 'squeak', { minGapMs: 380, volume: 0.45, vary: true });
    }
    this.poke();
    if (d.dry >= this.dryNeed()) this.dried(d);
  }

  private dried(d: Dish) {
    const k = this.L.k;
    this.setPhase('intro');
    if (this.held && this.held.what !== 'dish') {
      this.held = null;
      this.owner = null;
    }
    this.towelHome();
    sfx(this, 'star', { volume: 0.6 });
    stars(this, d.box.x, d.box.y, 6, 36 * k);
    boing(this, d.box, 0.08);
    this.time.delayedCall(500, () => this.begin('rack', this.placed === 0 ? (this.level === 2 ? 'vo-dishes-rack-2' : 'vo-dishes-rack') : null));
  }

  private towelHome() {
    this.tweens.killTweensOf(this.towel);
    this.tweens.add({ targets: this.towel, x: this.towelPeg.x, y: this.towelPeg.y, angle: 0, scale: this.towelScale, duration: 320, ease: 'Back.easeOut', onComplete: () => this.towel.setDepth(5) });
  }

  /** A wet dish taken to the rack: back it goes ("Let's dry it first!"), a quiet miss. */
  private wet(d: Dish) {
    this.shown.wet = (this.shown.wet as number) + 1;
    sfx(this, 'squish', { volume: 0.6 });
    this.say('vo-dry-first', { ttlMs: 3500 });
    this.backToRest(d);
    this.miss();
  }

  // ---------------------------------------------------------------- 4. the rack

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

  private rackScale(d: Dish) {
    return d.kind === 'plate' ? this.rack.s * d.size : this.cupScale();
  }

  private taken(colour: Colour, kind: Kind) {
    return this.dishes.some((d) => d.state === 'rack' && d.colour === colour && d.kind === kind);
  }

  /** Near the rack at all. */
  private nearRack(at: P) {
    const r = this.rack;
    const reach = T.reach * this.L.k;
    return Math.abs(at.x - r.x) <= 480 * r.s + reach * 0.5 && Math.abs(at.y - r.y) <= 360 * r.s + reach * 0.5;
  }

  /** Where it was let go: the right place, the right colour in the wrong row (level 2), a wrong colour, or nowhere. */
  private judge(d: Dish, at: P): 'ok' | 'row' | 'colour' | 'none' {
    const r = this.rack;
    if (!this.nearRack(at)) return 'none';
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
      scale: this.rackScale(d),
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
    if (this.dishes.every((q) => q.state === 'rack')) return this.time.delayedCall(700, () => this.afterRack());
    this.praise(this.rack.x, this.rack.y, () => this.startTake(), 300);
  }

  /** The wrong place: it floats back, Mom says what to look for; three misses and her hand shows it. */
  private wrong(d: Dish, why: 'row' | 'colour') {
    this.wrongs++;
    this.shown.wrong = this.wrongs;
    this.backToRest(d);
    sfx(this, 'squish', { volume: 0.6 });
    this.say(why === 'colour' ? 'vo-dishes-colour' : 'vo-dishes-rack-2', { ttlMs: 3500 });
    this.sayName(`name-${d.colour}` as NameKey, 4500);
    this.miss();
  }

  private backToRest(d: Dish) {
    const r = this.rest;
    this.tweens.killTweensOf(d.box);
    this.tweens.add({ targets: d.box, x: r.at.x, y: r.at.y, scale: r.s, angle: 0, duration: 380, ease: 'Back.easeOut', onComplete: () => d.box.setDepth(15) });
  }

  /** The rack is full: level 2 stacks the plates and gives Pipa her dish; then the finale. */
  private afterRack() {
    if (this.level === 2 && this.plates().length > 1) return this.startStack();
    this.afterStack();
  }

  // ---------------------------------------------------------------- 5. the pile (level 2): the biggest first

  private plates() {
    return this.dishes.filter((d) => d.kind === 'plate');
  }

  /** The plate the pile wants next: the biggest one still on the rack. */
  private nextPlate(): Dish | null {
    return this.plates().filter((d) => d.state === 'rack').sort((a, b) => b.size - a.size)[0] ?? null;
  }

  private pileSpot(i: number): P {
    return { x: this.pileAt.x, y: this.pileAt.y - i * 18 * this.L.k };
  }

  private startStack() {
    const k = this.L.k;
    // (a soft ring on the counter where the pile goes)
    const g = this.add.graphics().setDepth(2);
    g.lineStyle(6 * k, 0xffffff, 0.6);
    g.strokeEllipse(this.pileAt.x, this.pileAt.y, 300 * 0.68 * k, 110 * k);
    g.setAlpha(0);
    this.tweens.add({ targets: g, alpha: 1, duration: 400 });
    this.begin('stack', 'vo-biggest-first');
  }

  private onPile(d: Dish) {
    const k = this.L.k;
    this.setPhase('intro');
    d.state = 'pile';
    this.pile.push(d);
    this.shown.piled = this.pile.length;
    const to = this.pileSpot(this.pile.length - 1);
    this.tweens.killTweensOf(d.box);
    d.box.setDepth(10 + this.pile.length);
    this.tweens.add({
      targets: d.box,
      x: to.x,
      y: to.y,
      scale: 0.68 * k * d.size,
      angle: 0,
      duration: 320,
      ease: 'Back.easeOut',
      onComplete: () => {
        sfx(this, 'click');
        boing(this, d.box, 0.08);
        stars(this, to.x, to.y, 4, 30 * k);
      },
    });
    this.poke();
    if (!this.nextPlate()) return this.praise(this.pileAt.x, this.pileAt.y - 100 * k, () => this.afterStack(), 300);
    this.time.delayedCall(350, () => this.setPhase('stack'));
  }

  /** A smaller plate before a bigger one: it wobbles and goes back to its slot ("The biggest one first!"). */
  private notBiggest(d: Dish) {
    this.shown.pileWrong = (this.shown.pileWrong as number) + 1;
    sfx(this, 'squish', { volume: 0.6 });
    this.say('vo-biggest-first', { ttlMs: 3500 });
    this.backToRack(d, true);
    this.miss();
  }

  private backToRack(d: Dish, wobble = false) {
    const to = this.place(d.colour, d.kind);
    this.tweens.killTweensOf(d.box);
    const go = () => this.tweens.add({ targets: d.box, x: to.x, y: to.y, scale: this.rackScale(d), angle: 0, duration: 380, ease: 'Back.easeOut', onComplete: () => d.box.setDepth(6) });
    if (!wobble) return go();
    this.tweens.add({ targets: d.box, angle: { from: -10, to: 10 }, duration: 90, yoyo: true, repeat: 2, onComplete: go });
  }

  // ---------------------------------------------------------------- 6. Pipa's dish (level 2, where Pipa is on screen)

  private afterStack() {
    const pipa = this.pipa;
    if (this.level !== 2 || !pipa?.visible) return this.finale();
    // what she can take: the cups on their hooks and the top plate of the pile (or a plate on the rack)
    const can = this.takeable();
    this.wish = Phaser.Utils.Array.GetRandom(can);
    const w = this.wish;
    this.shown.pipa = `${w.colour}-${w.kind}`;
    const ok = pipa.showWish([this.key(w)], [this.shown.pipa as string], { maxRight: this.S.momFace.x0 - 10 * this.L.k, k: this.L.k });
    if (!ok) return this.finale();
    this.setPhase('pipa');
    this.sayDish('vo-pipa-wants', w);
    if (this.first) this.time.delayedCall(2200, () => this.phase === 'pipa' && !this.owner && !this.helping && this.showWay(false));
  }

  private takeable(): Dish[] {
    const top = this.pile[this.pile.length - 1];
    return this.dishes.filter((d) => d.state === 'rack' || d === top);
  }

  private homeOf(d: Dish): { at: P; s: number } {
    if (d.state === 'pile') return { at: this.pileSpot(this.pile.indexOf(d)), s: 0.68 * this.L.k * d.size };
    return { at: this.place(d.colour, d.kind), s: this.rackScale(d) };
  }

  private backHome(d: Dish) {
    const h = this.homeOf(d);
    this.tweens.killTweensOf(d.box);
    this.tweens.add({ targets: d.box, x: h.at.x, y: h.at.y, scale: h.s, angle: 0, duration: 380, ease: 'Back.easeOut', onComplete: () => d.box.setDepth(d.state === 'pile' ? 10 + this.pile.indexOf(d) + 1 : 6) });
  }

  private toPipa(d: Dish) {
    const k = this.L.k;
    const pipa = this.pipa!;
    this.setPhase('intro');
    this.shown.pipaGot = true;
    const m = pipa.mouthAt;
    this.tweens.killTweensOf(d.box);
    d.box.setDepth(600);
    this.tweens.add({
      targets: d.box,
      x: m.x - 40 * k,
      y: m.y + 20 * k,
      scale: this.homeOf(d).s * 0.8,
      angle: -15,
      duration: 360,
      ease: 'Quad.easeOut',
      onComplete: () => {
        sfx(this, 'munch');
        pipa.wishGranted();
        this.say('vo-pipa-got-it', { ttlMs: 3500 });
        this.time.delayedCall(1300, () => {
          this.backHome(d);
          this.time.delayedCall(700, () => this.finale());
        });
      },
    });
    stars(this, m.x, m.y, 6, 34 * k);
  }

  private notThatOne(d: Dish) {
    this.shown.pipaWrong = (this.shown.pipaWrong as number) + 1;
    sfx(this, 'squish', { volume: 0.6 });
    this.backHome(d);
    if (this.wish) this.sayDish('vo-pipa-wants', this.wish);
    this.miss();
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
      music.party(true); // on until home
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

  /** Mom's hand carrying a see-through dish from one place to another. */
  private carry(d: Dish, from: P, fromS: number, to: P, toS: number): HandMotion {
    return {
      kind: 'grab',
      keys: [
        { ...from, t: 0 },
        { ...from, t: 300 },
        { ...to, t: 1500 },
        { ...to, t: 1900 },
      ],
      props: [{ key: this.key(d), scale: fromS, endScale: toS, alpha: 0.6 }],
      glow: from,
    };
  }

  protected way(): HandMotion | null {
    const k = this.L.k;
    switch (this.phase) {
      case 'take': {
        const d = this.top();
        if (!d) return null;
        return this.carry(d, d.home, d.homeScale, this.sink.in, this.sink.inScale * d.size);
      }
      case 'scrub': {
        const d = this.cur;
        if (!d) return null;
        const c = { x: d.box.x, y: d.box.y };
        const spot = d.scrub >= this.need() ? this.spotsLeft(d)[0] : undefined;
        if (spot) {
          // the food is off, a spot stays: the sponge, from its place, onto the spot
          const s = this.spotAt(d, spot);
          return { kind: 'grab', keys: [{ ...this.spongeRest, t: 0 }, { ...this.spongeRest, t: 300 }, ...this.circle(s, 30 * k, 900, 1800), ...this.circle(s, 30 * k, 1850, 2300)], props: [{ key: 'dish-sponge', scale: 0.7 * k, alpha: 0.7 }], glow: this.spongeRest };
        }
        return { kind: 'grab', keys: [...this.circle(c, 70 * k, 0, 1100), ...this.circle(c, 70 * k, 1200, 2300)], props: [{ key: 'dish-sponge', scale: 0.7 * k, alpha: 0.7 }], glow: c };
      }
      case 'dry': {
        const d = this.cur;
        if (!d) return null;
        const c = { x: d.box.x, y: d.box.y };
        const tc = { x: this.towelPeg.x, y: this.towelPeg.y + 140 * this.towelScale };
        return {
          kind: 'grab',
          keys: [{ ...tc, t: 0 }, { ...tc, t: 300 }, ...this.circle(c, 60 * k, 900, 1700), ...this.circle(c, 60 * k, 1750, 2400)],
          props: [{ key: 'dishes-towel', scale: this.towelScale * 0.8, alpha: 0.7 }],
          glow: tc,
        };
      }
      case 'rack': {
        const d = this.cur;
        if (!d) return null;
        return this.carry(d, this.rest.at, this.rest.s, this.place(d.colour, d.kind), this.rackScale(d));
      }
      case 'stack': {
        const d = this.nextPlate();
        if (!d) return null;
        return this.carry(d, this.place(d.colour, d.kind), this.rackScale(d), this.pileSpot(this.pile.length), 0.68 * k * d.size);
      }
      case 'pipa': {
        const d = this.wish;
        if (!d || !this.pipa) return null;
        const h = this.homeOf(d);
        return this.carry(d, h.at, h.s, this.pipa.mouthAt, h.s * 0.8);
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
      const spots = this.spotsLeft(d);
      this.tweens.addCounter({
        from: 0,
        to: 1,
        duration: T.scrubMs + spots.length * 700,
        onUpdate: (tw) => {
          const t = tw.getValue()!;
          const a = t * Math.PI * (6 + spots.length * 2);
          // (the food first, then each spot in turn)
          const left = this.spotsLeft(d);
          const c = d.scrub < this.need() || !left.length ? { x: d.box.x, y: d.box.y } : this.spotAt(d, left[0]);
          const r = d.scrub < this.need() ? 70 * k : 26 * k;
          sp.setPosition(c.x + Math.cos(a) * r, c.y + Math.sin(a) * r * 0.7);
          const dist = Math.hypot(sp.x - last.x, sp.y - last.y);
          last = { x: sp.x, y: sp.y };
          if (d.state === 'sink') this.scrub(d, Math.max(dist, (this.need() * 1.05) / 60), last, true);
        },
        onComplete: () => {
          this.helped();
          if (d.state !== 'sink') return;
          for (const s of this.spotsLeft(d)) this.spotOff(d, s);
          this.scrub(d, this.need(), last, true);
        },
      });
      return true;
    }
    if (this.phase === 'dry' && this.cur) {
      const d = this.cur;
      const tw = this.towel;
      this.tweens.killTweensOf(tw);
      tw.setDepth(620);
      this.hand.follow('grab', () => ({ x: tw.x, y: tw.y + 120 * this.towelScale }));
      let last = { x: d.box.x, y: d.box.y };
      this.tweens.addCounter({
        from: 0,
        to: 1,
        duration: T.dryMs,
        onUpdate: (c) => {
          const a = c.getValue()! * Math.PI * 6;
          const at = { x: d.box.x + Math.cos(a) * 60 * k, y: d.box.y + Math.sin(a) * 40 * k };
          tw.setPosition(at.x, at.y - 120 * this.towelScale);
          const dist = Math.hypot(at.x - last.x, at.y - last.y);
          last = at;
          this.dryRub(d, Math.max(dist, (this.dryNeed() * 1.05) / 60), at);
        },
        onComplete: () => {
          this.helped();
          if (this.phase === 'dry') this.dryRub(d, this.dryNeed(), last);
          this.towelHome();
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
    if (this.phase === 'stack') {
      const d = this.nextPlate();
      if (!d) return false;
      const to = this.pileSpot(this.pile.length);
      this.hand.follow('grab', () => ({ x: d.box.x, y: d.box.y }));
      d.box.setDepth(600);
      this.tweens.add({ targets: d.box, x: to.x, y: to.y, duration: T.helpMs, delay: 250, ease: 'Sine.easeInOut', onComplete: () => (this.helped(), this.onPile(d)) });
      return true;
    }
    if (this.phase === 'pipa' && this.wish && this.pipa) {
      const d = this.wish;
      const m = this.pipa.mouthAt;
      this.hand.follow('grab', () => ({ x: d.box.x, y: d.box.y }));
      d.box.setDepth(600);
      this.tweens.add({ targets: d.box, x: m.x - 40 * k, y: m.y + 20 * k, duration: T.helpMs, delay: 250, ease: 'Sine.easeInOut', onComplete: () => (this.helped(), this.toPipa(d)) });
      return true;
    }
    return false;
  }

  // ---------------------------------------------------------------- touch

  private grabDish(p: Phaser.Input.Pointer, d: Dish, at: P) {
    this.tweens.killTweensOf(d.box);
    d.box.setDepth(600);
    sfx(this, 'tap', { volume: 0.7 });
    this.cur = d;
    this.held = { what: 'dish', from: at, moved: 0, last: at, dx: d.box.x - at.x, dy: d.box.y - at.y };
    this.own(p);
  }

  /** The dish under the finger among those she may take now (stack: plates on the rack; Pipa: cups and the pile's top). */
  private dishAt(at: P, list: Dish[]): Dish | null {
    const k = this.L.k;
    let best: Dish | null = null;
    let bd = Infinity;
    for (const d of list) {
      const r = Math.max(110 * k, (d.kind === 'plate' ? D.plateR : 120) * d.box.scale + 30 * k);
      const dd = Math.hypot(at.x - d.box.x, at.y - d.box.y);
      if (dd < r && dd < bd) (best = d), (bd = dd);
    }
    return best;
  }

  protected down(p: Phaser.Input.Pointer, at: P) {
    const k = this.L.k;
    switch (this.phase) {
      case 'take': {
        const d = this.top();
        if (!d || !this.near(at, d.box, Math.max(130 * k, 110 * d.box.scale + 40 * k))) return;
        this.grabDish(p, d, at);
        return;
      }
      case 'scrub': {
        const d = this.cur;
        if (!d) return;
        if (this.near(at, this.sponge, 120 * k)) {
          // The sponge: it follows the finger (and takes the stubborn spots off).
          this.tweens.killTweensOf(this.sponge);
          this.sponge.setAngle(0);
          boing(this, this.sponge, 0.1);
          sfx(this, 'squish', { volume: 0.5 });
          this.held = { what: 'sponge', from: at, moved: 0, last: at, dx: this.sponge.x - at.x, dy: this.sponge.y - at.y };
          this.own(p);
          return;
        }
        if (!this.onDish(at, d)) return;
        // The finger on the dish scrubs too (the food comes off; a stubborn spot needs the sponge).
        sfx(this, 'squish', { volume: 0.4 });
        this.bubble(at.x, at.y);
        this.held = { what: 'finger', from: at, moved: 0, last: at, dx: 0, dy: 0 };
        this.own(p);
        return;
      }
      case 'dry': {
        const d = this.cur;
        if (!d) return;
        if (this.rest.where === 'towel' && this.onDish(at, d)) {
          // on the towel: her finger rubs it dry
          this.held = { what: 'rub', from: at, moved: 0, last: at, dx: 0, dy: 0 };
          this.own(p);
          boing(this, d.box, 0.05);
          return;
        }
        if (this.onTowel(at) && this.rest.where === 'sink') {
          // the towel comes off its peg and follows her finger
          this.tweens.killTweensOf(this.towel);
          this.towel.setDepth(620);
          sfx(this, 'whoosh', { volume: 0.35 });
          this.held = { what: 'towel', from: at, moved: 0, last: at, dx: this.towel.x - at.x, dy: this.towel.y - at.y };
          this.own(p);
          return;
        }
        if (this.onDish(at, d)) this.grabDish(p, d, at);
        return;
      }
      case 'rack': {
        const d = this.cur;
        if (!d || !this.onDish(at, d)) return;
        this.grabDish(p, d, at);
        return;
      }
      case 'stack': {
        const d = this.dishAt(at, this.plates().filter((q) => q.state === 'rack'));
        if (d) this.grabDish(p, d, at);
        return;
      }
      case 'pipa': {
        const d = this.dishAt(at, this.takeable());
        if (d) this.grabDish(p, d, at);
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
    const d = this.cur;
    if (h.what === 'sponge') {
      this.sponge.setPosition(at.x + h.dx * 0.5, at.y + h.dy * 0.5);
      sway(this, this.sponge, p.worldX - p.prevPosition.x, L.k);
      const sp = { x: this.sponge.x, y: this.sponge.y };
      if (d && this.onDish(sp, d)) this.scrub(d, dist, sp, true);
      return;
    }
    if (h.what === 'finger') {
      if (d && this.onDish(at, d)) this.scrub(d, dist, at, false);
      return;
    }
    if (h.what === 'towel') {
      this.towel.setPosition(at.x + h.dx * 0.3, at.y - 120 * this.towelScale);
      if (d && this.onDish(at, d)) this.dryRub(d, dist, at);
      return;
    }
    if (h.what === 'rub') {
      if (d && this.onDish(at, d)) this.dryRub(d, dist, at);
      return;
    }
    if (!d) return;
    d.box.setPosition(at.x + h.dx, at.y + h.dy);
    // (on its way to the rack it shrinks toward its size there)
    if (this.phase === 'rack' || this.phase === 'dry') {
      const toS = this.rackScale(d);
      const t = Phaser.Math.Clamp((this.rest.at.y - d.box.y) / Math.max(1, this.rest.at.y - this.rack.y), 0, 1);
      d.box.setScale(Phaser.Math.Linear(this.rest.s, Math.max(toS, this.rest.s * 0.7), t));
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
    if (h.what === 'finger' || h.what === 'rub') return;
    if (h.what === 'towel') {
      // a tap on the towel (without rubbing): the dish comes to the towel to be dried there
      const d = this.cur;
      this.towelHome();
      if (!cancelled && d && this.phase === 'dry' && h.moved < 40 * k && this.rest.where === 'sink') this.toTowel(d);
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
    if (this.phase === 'dry') {
      if (cancelled) return this.backToRest(d);
      const box = { x: d.box.x, y: d.box.y };
      // a tap on the dish in the sink, or a drag let go near the towel: to the towel. Near the rack: still wet.
      if (this.rest.where === 'sink' && (h.moved < 40 * k || this.onTowel(box) || this.near(box, this.towelSpot, 200 * k))) return this.toTowel(d);
      if (this.nearRack(box)) return this.wet(d);
      return this.backToRest(d);
    }
    if (this.phase === 'rack') {
      if (cancelled) return this.backToRest(d);
      const j = this.judge(d, { x: d.box.x, y: d.box.y });
      if (j === 'ok' && !this.taken(d.colour, d.kind)) return this.putOnRack(d);
      if (j === 'colour' || j === 'row') return this.wrong(d, j);
      // Not near the rack: back where it was, quietly (a tap only lifts it a little).
      if (h.moved > 40 * k) this.miss();
      this.backToRest(d);
      return;
    }
    if (this.phase === 'stack') {
      this.cur = null;
      if (cancelled) return this.backToRack(d);
      const box = { x: d.box.x, y: d.box.y };
      if (this.near(box, this.pileSpot(this.pile.length), 230 * k)) {
        if (d === this.nextPlate()) return this.onPile(d);
        return this.notBiggest(d);
      }
      if (h.moved > 40 * k) this.miss();
      return this.backToRack(d);
    }
    if (this.phase === 'pipa') {
      this.cur = null;
      if (cancelled || !this.pipa) return this.backHome(d);
      const m = this.pipa.mouthAt;
      if (this.near({ x: d.box.x, y: d.box.y }, m, T.pipaReach * k)) {
        if (d === this.wish) return this.toPipa(d);
        return this.notThatOne(d);
      }
      if (h.moved > 40 * k) this.miss();
      return this.backHome(d);
    }
  }

  protected lookTarget() {
    if (!this.held) return null;
    const w = this.held.what;
    if (w === 'sponge') return { x: this.sponge.x, y: this.sponge.y };
    if (w === 'towel') return { x: this.towel.x, y: this.towel.y };
    return this.cur ? { x: this.cur.box.x, y: this.cur.box.y } : null;
  }
}
