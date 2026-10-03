import Phaser from 'phaser';
import { ART, type ImageKey } from '../core/assets';
import { countKey, music, voice, type NameKey, type Song } from '../core/audio';
import { GUESTS, guestLayers, type GuestDef } from '../core/guests';
import { boing, burst, stars } from '../core/fx';
import { tapMotion, type HandMotion } from '../core/hand';
import { confetti, settle, sway } from '../core/juice';
import { opaqueBounds } from '../core/placeholders';
import { sfx } from '../core/sfx';
import { TUNING } from '../core/tuning';
import { Guest } from '../steps/Guest';
import { loadImages } from './BootScene';
import { MiniGame, type P } from './MiniGame';

const T = TUNING.market;
const G = ART.garden;
/** The crate's front is drawn this much flatter than its art (a low box: the goods show above it). */
const CRATE_H = 0.62;

/** What the stall sells: every one has its picture and Mom says its name. */
const GOODS: { id: string; key: ImageKey; name: NameKey }[] = [
  { id: 'tomato', key: 'veg-tomato-whole', name: 'name-tomato' },
  { id: 'carrot', key: 'veg-carrot-whole', name: 'name-carrot' },
  { id: 'cucumber', key: 'veg-cucumber-whole', name: 'name-cucumber' },
  { id: 'pepper', key: 'veg-pepper-whole', name: 'name-pepper' },
  { id: 'onion', key: 'veg-onion-whole', name: 'name-onion' },
  { id: 'potato', key: 'veg-potato-whole', name: 'name-potato' },
  { id: 'mushroom', key: 'veg-mushroom-whole', name: 'name-mushroom' },
  { id: 'zucchini', key: 'veg-zucchini-whole', name: 'name-zucchini' },
  { id: 'banana', key: 'fruit-banana-whole', name: 'name-banana' },
  { id: 'kiwi', key: 'fruit-kiwi-whole', name: 'name-kiwi' },
  { id: 'mango', key: 'fruit-mango-whole', name: 'name-mango' },
  { id: 'strawberry', key: 'fruit-strawberry-whole', name: 'name-strawberry' },
  { id: 'lettuce', key: 'lettuce-head', name: 'name-lettuce' },
];
type Good = (typeof GOODS)[number];
/** Level 2's mixed-up box: things that look alike (the one that does not belong is not obvious). */
const ALIKE: [string, string][] = [
  ['tomato', 'strawberry'], ['strawberry', 'tomato'], ['cucumber', 'zucchini'], ['zucchini', 'cucumber'], ['potato', 'kiwi'],
  ['kiwi', 'potato'], ['pepper', 'lettuce'], ['banana', 'mango'], ['onion', 'potato'], ['mango', 'banana'],
];
/** The parts of a visit after the first list: the visitor and the mixed-up box in a shuffled order, then paying. */
type Part = 'list' | 'guest' | 'mixed' | 'pay';
/** The visitors who come to the stall (they walk in at the left; the giraffe's neck would reach the home button). */
const VISITORS = GUESTS.filter((g) => g.arrive === 'walk');
/** Dice dots for the price at level 2 (x, y in units of the slate's height x 0.3 from its middle). */
const DICE: Record<number, [number, number][]> = {
  1: [[0, 0]],
  2: [[-1, -1], [1, 1]],
  3: [[-1, -1], [0, 0], [1, 1]],
  4: [[-1, -1], [1, -1], [-1, 1], [1, 1]],
  5: [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]],
  6: [[-1, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [1, 1]],
  7: [[-1, -1], [1, -1], [-1, 0], [0, 0], [1, 0], [-1, 1], [1, 1]],
};

interface Crate {
  good: Good;
  x: number;
  /** The shelf it stands on (the item's foot). */
  y: number;
  item: Phaser.GameObjects.Image;
  front: Phaser.GameObjects.Image;
  scale: number;
}

interface Want {
  good: Good;
  got: boolean;
  pic: Phaser.GameObjects.Image | null;
}

/**
 * The market (research/minigames-spec.md): a game that is not cooking. Mom's shopping list shows pictures; she finds
 * each thing on the stall and puts it in the basket (a tap, or a drag to the basket). A thing that is not on the
 * list hops, Mom names it and asks "Is it on our list?", and it goes back (a quiet miss). Then Pipa's own list, in
 * her thought bubble. At level 2 the lists are longer, one thing is needed twice, and Mom's paper list folds up once
 * she has read it ("Can you remember the list?"): a tap on it opens it again for a moment, as often as she likes.
 * The basket full, Pipa tastes a strawberry, Mom celebrates, and it goes quietly home.
 */
export class MarketScene extends MiniGame {
  protected readonly id = 'market';
  protected readonly song: Song = 'outside';
  protected readonly waiting = ['shop', 'guest', 'mixed', 'pay'] as const;
  private crates: Crate[] = [];
  private wants: Want[] = [];
  private round = 0;
  /** The list on paper (round 1, and round 2 where Pipa is not on screen); null when it is Pipa's bubble. */
  private list: { box: Phaser.GameObjects.Container; paper: Phaser.GameObjects.Image; x: number; y: number; s: number; open: boolean } | null = null;
  private listTimer: Phaser.Time.TimerEvent | null = null;
  private basket!: { back: Phaser.GameObjects.Image; front: Phaser.GameObjects.Image; x: number; y: number; s: number };
  private inBasket = 0;
  /** What is in the basket (it goes aside with the basket while the visitor stands there). */
  private basketGoods: Phaser.GameObjects.Image[] = [];
  private held: { crate: Crate; img: Phaser.GameObjects.Image; from: P; moved: number } | null = null;
  /** A coin taken from Mom's purse (paying, level 1). */
  private coinHeld: { img: Phaser.GameObjects.Image; from: P; moved: number } | null = null;
  private stall!: { x0: number; x1: number; cx: number; top: number };
  private notSaid = 0;
  private cols = 4;
  private bounds = new Map<string, { cx: number; cy: number; w: number; h: number }>();
  private parts: Part[] = [];
  /** The visitor (one of the walking guests, picked per visit; her layers load while she shops). */
  private visitor: GuestDef = VISITORS[0];
  private visitorIn: Promise<void> = Promise.resolve();
  private guest: { who: Guest; wants: { good: Good; got: boolean }[] } | null = null;
  private mixed: { items: { img: Phaser.GameObjects.Image; good: Good; odd: boolean; out: boolean; x: number; y: number; scale: number }[]; front: Phaser.GameObjects.Image; host: Good; said: number } | null = null;
  private pay: {
    n: number;
    slate: Phaser.GameObjects.Image;
    chalk: Phaser.GameObjects.Graphics;
    /** Level 1: the circles to fill (centres, radius), the coins in them, Mom's purse. */
    spots: P[];
    r: number;
    paid: number;
    purse: Phaser.GameObjects.Image | null;
    /** Level 2: the piles of coins on the counter (one has as many as the dots). */
    piles: { x: number; y: number; coins: Phaser.GameObjects.Image[]; n: number }[];
    busy: boolean;
    coinScale: number;
  } | null = null;

  constructor() {
    super('Market');
  }

  init() {
    super.init();
    this.crates = [];
    this.wants = [];
    this.round = 0;
    this.list = null;
    this.listTimer = null;
    this.inBasket = 0;
    this.basketGoods = [];
    this.held = null;
    this.coinHeld = null;
    this.notSaid = 0;
    this.parts = [];
    this.guest = null;
    this.mixed = null;
    this.pay = null;
    Object.assign(this.shown, { round: 0, found: 0, wanted: 0, inBasket: 0, stall: [] as string[], want: [] as string[], parts: [] as string[], part: '', guest: '', guestWants: [] as string[], guestGot: 0, mixedHost: '', mixedOdd: '', mixedLeft: 0, price: 0, piles: [] as number[], paid: 0, payWrong: 0 });
  }

  // ---------------------------------------------------------------- the stall

  /** The drawing's own box in its frame (whole vegetables have wide empty margins). */
  private box(key: string) {
    let b = this.bounds.get(key);
    if (!b) {
      const f = this.textures.getFrame(key);
      const ob = opaqueBounds(this, key);
      b = ob ? { cx: ob.cx, cy: ob.cy, w: ob.w, h: ob.h } : { cx: f.realWidth / 2, cy: f.realHeight / 2, w: f.realWidth, h: f.realHeight };
      this.bounds.set(key, b);
    }
    return b;
  }

  /** An image of a good, fitted by its drawing into w x h, centred on its drawing. */
  private goodImage(g: Good, x: number, y: number, w: number, h: number) {
    const b = this.box(g.key);
    const img = this.add.image(x, y, g.key);
    img.setOrigin(b.cx / img.frame.realWidth, b.cy / img.frame.realHeight).setScale(Math.min(w / b.w, h / b.h));
    return img;
  }

  protected build() {
    const L = this.L;
    const S = this.S;
    const k = L.k;
    this.cameras.main.setBackgroundColor('#cfe6ec');
    const bg = this.add.image(L.cx, L.H, 'bg-market').setOrigin(0.5, 1).setDepth(-100);
    bg.setScale(Math.max(L.H / bg.frame.realHeight, L.W / bg.frame.realWidth));

    // The room: from the thumb strip to Pipa (or Mom's face). The basket on the left, the stall on the right.
    const petLeft = S.pet ? S.pet.x - 270 * S.pet.scale : Infinity;
    // (and never under Mom's pointing hand: on 4:3 it reaches over the counter's lower row)
    const arm = S.momArm.y0 < L.Y(900) ? S.momArm.x0 - 10 * k : Infinity;
    const x1 = Math.min(S.momFace.x0, petLeft, arm) - 16 * k;
    const x0 = L.m + 16 * k;
    const colW = 290 * k;
    const bs = 0.62 * k;
    const bx = x0 + colW / 2;
    const by = L.Y(820);
    const back = this.add.image(bx, by, 'garden-basket').setScale(bs).setDepth(30);
    const front = this.add.image(bx, by, 'garden-basket-front').setScale(bs).setDepth(32);
    this.basket = { back, front, x: bx, y: by, s: bs };

    const sx0 = x0 + colW + 10 * k;
    const w = x1 - sx0;
    const cx = (sx0 + x1) / 2;
    const cols = (this.cols = Phaser.Math.Clamp(Math.floor(w / (T.slot * k)), 3, 5));
    const slotW = w / cols;
    const counterTop = L.Y(900);
    const shelfTop = L.Y(620);
    const awTop = L.Y(250);
    const aws = w / 1600;
    this.stall = { x0: sx0, x1, cx, top: awTop };
    // poles, the upper shelf, the counter, the awning over it all
    const ps = Math.max(0.7 * k, aws);
    for (const px of [sx0 + 18 * aws, x1 - 18 * aws]) this.add.image(px, awTop + 100 * aws, 'market-pole').setOrigin(0.5, 0).setScale(ps, (counterTop - awTop) / 900).setDepth(1);
    this.add.image(cx, shelfTop - 16 * aws, 'market-shelf').setOrigin(0.5, 0).setScale(aws).setDepth(2);
    this.add.image(cx, counterTop - 30 * aws, 'market-counter').setOrigin(0.5, 0).setScale(aws).setDepth(2);
    this.add.image(cx, awTop, 'market-awning').setOrigin(0.5, 0).setScale(aws).setDepth(8);

    // The goods: one crate a slot, two rows (the items stay: a crate always has one more).
    const pool = Phaser.Utils.Array.Shuffle(GOODS.slice());
    const itemW = slotW * 0.84;
    const itemH = Math.min(T.itemH * k, (counterTop - shelfTop) * 0.6);
    const cs = (slotW * 0.9) / 300;
    [shelfTop, counterTop].forEach((y, r) => {
      for (let c = 0; c < cols; c++) {
        const good = pool[r * cols + c];
        const x = sx0 + slotW * (c + 0.5);
        const item = this.goodImage(good, x, y, itemW, itemH).setDepth(4);
        item.y = this.itemY(y, good, item.scale);
        const fr = this.add.image(x, y + 6 * k, 'market-crate').setOrigin(0.5, 1).setScale(cs, cs * CRATE_H).setDepth(5);
        this.crates.push({ good, x, y, item, front: fr, scale: item.scale });
      }
    });
    this.shown.stall = this.crates.map((c) => c.good.id);
    // The visitor of this visit: her layers load now, while the first list is shopped.
    this.visitor = VISITORS[Phaser.Math.Between(0, VISITORS.length - 1)];
    this.visitorIn = loadImages(this.game, guestLayers(this.visitor));
  }

  protected ready() {
    // A visit: the first list, then the visitor and the mixed-up box in a shuffled order around Pipa's list, then paying.
    const [a, b] = Phaser.Utils.Array.Shuffle(['guest', 'mixed'] as Part[]);
    this.parts = ['list', a, 'list', b, 'pay'];
    this.shown.parts = this.parts.slice();
    this.time.delayedCall(500, () => this.nextPart());
  }

  private nextPart() {
    if (this.leaving) return;
    const p = this.parts.shift();
    this.shown.part = p ?? 'finale';
    if (p === 'list') return this.round > 0 ? this.restock() : this.startRound();
    if (p === 'guest') return this.startGuest();
    if (p === 'mixed') return this.startMixed();
    if (p === 'pay') return this.startPay();
    this.finale();
  }

  // ---------------------------------------------------------------- a list

  private pickList(): Good[] {
    const n = T.listItems[this.level - 1];
    const on = Phaser.Utils.Array.Shuffle(this.crates.map((c) => c.good));
    const list = on.slice(0, n);
    // Level 2: one thing twice (the pair stands together on the list).
    if (this.level === 2 && T.pair) list.splice(1, 1, list[0]);
    return list;
  }

  private startRound() {
    const L = this.L;
    const k = L.k;
    this.round++;
    this.shown.round = this.round;
    const goods = this.pickList();
    this.wants = goods.map((good) => ({ good, got: false, pic: null }));
    this.shown.want = goods.map((g) => g.id);
    this.shown.wanted = goods.length;
    this.shown.found = 0;
    const pipaList = this.round === 2 && !!this.pipa?.visible;
    if (pipaList && this.pipa) {
      this.pipa.showWish(goods.map((g) => g.key), goods.map((g) => g.id), { maxRight: this.S.momFace.x0 - 10 * k, k });
      this.say('vo-market-pipa', { ttlMs: 5000 });
    } else {
      this.makeList(goods);
      this.say('vo-market-list', { ttlMs: 5000 });
    }
    if (goods.some((g, i) => goods.indexOf(g) !== i)) this.say('vo-market-two', { ttlMs: 8000 });
    // Level 2, the paper list: Mom reads it, then it folds up (a tap opens it again).
    if (this.level === 2 && this.list) this.time.delayedCall(T.foldAfterMs, () => this.fold(true));
    this.time.delayedCall(pipaList ? 900 : 600, () => this.begin('shop', null));
  }

  private makeList(goods: Good[]) {
    const L = this.L;
    const k = L.k;
    const n = goods.length;
    const s = Math.min(0.8 * k, (this.stall.x1 - this.stall.x0) / 600);
    const x = this.stall.cx;
    const y = Math.max(L.Y(20), 20 * k) + 160 * s;
    const paper = this.add.image(0, 0, 'market-list').setScale(s);
    const cell = Math.min(150, 500 / n) * s;
    const pics = goods.map((g, i) => {
      const b = this.box(g.key);
      const img = this.add.image(-((n - 1) * cell) / 2 + i * cell + 20 * s, 30 * s, g.key);
      img.setOrigin(b.cx / img.frame.realWidth, b.cy / img.frame.realHeight).setScale((cell * 0.86) / Math.max(b.w, b.h));
      return img;
    });
    const box = this.add.container(x, y - 60 * k, [paper, ...pics]).setDepth(9).setAlpha(0);
    this.tweens.add({ targets: box, y, alpha: 1, duration: 450, ease: 'Back.easeOut' });
    sfx(this, 'whoosh');
    this.wants.forEach((w, i) => (w.pic = pics[i]));
    this.list = { box, paper, x, y, s, open: true };
  }

  /** The list folds up (level 2): only its top edge and the peg show, the pictures hidden. */
  private fold(on: boolean) {
    const l = this.list;
    if (!l || l.open === !on) return;
    l.open = !on;
    this.shown.listOpen = l.open;
    const pics = this.wants.map((w) => w.pic).filter(Boolean) as Phaser.GameObjects.Image[];
    this.tweens.killTweensOf(l.paper);
    this.tweens.add({ targets: l.paper, scaleY: on ? l.s * 0.3 : l.s, y: on ? -110 * l.s : 0, duration: 260, ease: 'Sine.easeInOut' });
    this.tweens.add({ targets: pics, alpha: on ? 0 : 1, duration: 200 });
    sfx(this, 'whoosh', { volume: 0.5 });
    if (on && this.round === 1 && !this.shown.remembered) {
      this.shown.remembered = true;
      this.say('vo-market-remember', { ttlMs: 4000 });
    }
  }

  private peek() {
    const l = this.list;
    if (!l) return;
    this.listTimer?.remove();
    if (!l.open) this.fold(false);
    boing(this, l.paper, 0.05);
    this.listTimer = this.time.delayedCall(T.peekMs, () => this.fold(true));
  }

  private onList(at: P) {
    const l = this.list;
    if (!l) return false;
    const w = 300 * l.s + 30 * this.L.k;
    const h = (l.open ? 150 : 70) * l.s + 40 * this.L.k;
    return Math.abs(at.x - l.x) < w && Math.abs(at.y - (l.open ? l.y : l.y - 110 * l.s)) < h;
  }

  private nextWant(): Want | null {
    return this.wants.find((w) => !w.got) ?? null;
  }

  private crateOf(g: Good) {
    return this.crates.find((c) => c.good === g)!;
  }

  // ---------------------------------------------------------------- into the basket

  private basketIn(): P {
    const b = this.basket;
    return { x: b.x + (G.basketIn.x - 220) * b.s, y: b.y + (G.basketIn.y - 160) * b.s };
  }

  /** A copy of the crate's good, lifted from it (the crate keeps its own). */
  private lift(c: Crate) {
    const img = this.add.image(c.item.x, c.item.y, c.good.key).setOrigin(c.item.originX, c.item.originY).setScale(c.scale).setDepth(600);
    return img;
  }

  /** Is it on the list (and still wanted)? Then it goes in; else it hops back and Mom asks. */
  private offer(c: Crate, img: Phaser.GameObjects.Image) {
    const w = this.wants.find((q) => !q.got && q.good === c.good);
    if (w && this.phase === 'shop') return this.intoBasket(w, img);
    // Not on the list: it hops, Mom names it, and it goes back to its crate.
    sfx(this, 'squish', { volume: 0.6 });
    voice.say(c.good.name, { group: 'name', ttlMs: 2000, valid: () => this.scene.isActive() && !this.leaving });
    if (this.notSaid++ % 2 === 0) this.say('vo-market-not', { ttlMs: 3500 });
    this.tweens.killTweensOf(img);
    this.tweens.chain({
      targets: img,
      tweens: [
        { y: img.y - 50 * this.L.k, duration: 160, ease: 'Quad.easeOut' },
        { x: c.item.x, y: c.item.y, angle: 0, scale: c.scale, duration: 360, ease: 'Back.easeOut' },
      ],
      onComplete: () => img.destroy(),
    });
    boing(this, c.item, 0.1);
    this.miss();
    // (at level 2 with the list folded, a wrong one opens it for a moment: she can look again)
    if (this.level === 2 && this.list && !this.list.open) this.peek();
  }

  private intoBasket(w: Want, img: Phaser.GameObjects.Image) {
    const L = this.L;
    const b = this.basket;
    w.got = true;
    const i = this.inBasket++;
    this.shown.inBasket = this.inBasket;
    const found = this.wants.filter((q) => q.got).length;
    this.shown.found = found;
    const at = this.basketIn();
    const col = (i % 4) - 1.5;
    const row = Math.floor(i / 4);
    const tx = at.x + col * 56 * b.s;
    const ty = at.y - row * 34 * b.s + Math.abs(col) * 6 * b.s;
    this.tweens.killTweensOf(img);
    img.setDepth(31).setData('bx', tx);
    this.basketGoods.push(img);
    const bx = this.box(w.good.key);
    this.tweens.add({
      targets: img,
      x: tx,
      y: ty,
      scale: (95 * L.k) / Math.max(bx.w, bx.h),
      angle: col * 12,
      duration: 380,
      ease: 'Quad.easeOut',
      onComplete: () => {
        boing(this, b.front, 0.06);
        sfx(this, 'pop', { volume: 0.7 });
        burst(this, tx, ty, { texture: 'star', count: 4, size: 28 * L.k, speed: 260, gravityY: 500, lifespan: 500, depth: 70 });
      },
    });
    voice.say(w.good.name, { group: 'name', ttlMs: 2500, valid: () => this.scene.isActive() && !this.leaving });
    // (a pair: Mom counts the second one)
    if (this.wants.filter((q) => q.good === w.good).length > 1) this.say(countKey(this.wants.filter((q) => q.good === w.good && q.got).length), { group: 'count', sequence: true });
    this.tick1(w);
    this.poke();
    this.mom?.happy();
    this.time.delayedCall(700, () => this.mom?.rest());
    if (this.wants.every((q) => q.got)) {
      this.setPhase('intro');
      this.listTimer?.remove();
      this.time.delayedCall(700, () => this.endRound());
    }
  }

  /** The list shows it is found: a green tick over its picture (or, in Pipa's bubble, it sparkles and fades). */
  private tick1(w: Want) {
    const k = this.L.k;
    const idx = this.wants.indexOf(w);
    if (!this.list) return this.pipa?.wishFound(idx);
    const pic = w.pic!;
    if (this.level === 2 && !this.list.open) this.peek();
    this.tweens.add({ targets: pic, alpha: 0.45, duration: 250 });
    const g = this.add.graphics();
    g.lineStyle(14 * k, 0x4f9e3a, 1);
    g.beginPath();
    g.moveTo(-26 * k, 0);
    g.lineTo(-6 * k, 20 * k);
    g.lineTo(30 * k, -24 * k);
    g.strokePath();
    g.setPosition(pic.x, pic.y).setScale(0);
    this.list.box.add(g);
    this.tweens.add({ targets: g, scale: 1, duration: 260, ease: 'Back.easeOut' });
    sfx(this, 'star', { volume: 0.5 });
  }

  private endRound() {
    const L = this.L;
    if (this.list) {
      const l = this.list;
      this.list = null;
      this.tweens.add({ targets: l.box, y: l.y - 80 * L.k, alpha: 0, duration: 400, delay: 600, onComplete: () => l.box.destroy() });
    } else this.pipa?.wishGranted();
    this.praise(this.stall.cx, L.Y(300), () => this.nextPart(), 900);
  }

  /** Between the lists the stall is rearranged (the same goods, other crates): look again. */
  private restock() {
    const goods = Phaser.Utils.Array.Shuffle(this.crates.map((c) => c.good));
    sfx(this, 'whoosh');
    this.crates.forEach((c, i) => {
      const g = goods[i];
      this.tweens.add({
        targets: c.item,
        scaleY: 0,
        duration: 180,
        delay: 40 * i,
        onComplete: () => {
          const b = this.box(g.key);
          c.good = g;
          c.item.setTexture(g.key).setOrigin(b.cx / c.item.frame.realWidth, b.cy / c.item.frame.realHeight);
          c.scale = this.fitCrate(g);
          c.item.setScale(c.scale, 0);
          c.item.y = this.itemY(c.y, g, c.scale);
          this.tweens.add({ targets: c.item, scaleY: c.scale, duration: 220, ease: 'Back.easeOut' });
        },
      });
    });
    this.shown.stall = goods.map((g) => g.id);
    this.time.delayedCall(40 * this.crates.length + 700, () => this.startRound());
  }

  /** A good stands in its crate: its foot a little above the shelf, the crate's front over its lower part. */
  private itemY(shelf: number, g: Good, scale: number) {
    const slotW = (this.stall.x1 - this.stall.x0) / Math.max(1, this.cols);
    const crateH = 150 * ((slotW * 0.9) / 300) * CRATE_H;
    return shelf - crateH * 0.55 - (this.box(g.key).h * scale) / 2;
  }

  private fitCrate(g: Good) {
    const k = this.L.k;
    const slotW = (this.stall.x1 - this.stall.x0) / this.cols;
    const itemH = Math.min(T.itemH * k, (this.L.Y(900) - this.L.Y(620)) * 0.6);
    const b = this.box(g.key);
    return Math.min((slotW * 0.84) / b.w, itemH / b.h);
  }

  // ---------------------------------------------------------------- a visitor at the stall

  /** The visitor stands where the basket was (it steps aside meanwhile), clear of the thumb strip. */
  private visitorSpot() {
    const L = this.L;
    const k = L.k;
    const s = Math.min(0.6 * k, (300 * k) / 484);
    return { x: Math.max(this.basket.x, L.m + 250 * s), y: L.Y(984) - 334 * s, scale: s };
  }

  private basketAside(out: boolean) {
    const b = this.basket;
    const x = out ? -260 * this.L.k : b.x;
    this.tweens.add({ targets: [b.back, b.front], x, duration: 450, ease: out ? 'Sine.easeIn' : 'Back.easeOut' });
    for (const img of this.basketGoods) this.tweens.add({ targets: img, x: img.getData('bx') + (out ? x - b.x : 0), duration: 450, ease: out ? 'Sine.easeIn' : 'Back.easeOut' });
  }

  /**
   * A visitor (the turtle or the penguin, the guests who come to eat) walks up to the stall with a wish in her bubble:
   * one thing (level 2: two). She gives it to her from the stall (a tap, or a drag to her). Something else: she sniffs it,
   * it goes back, Mom names it (a quiet miss). Her wish come true: she munches happily, Mom thanks her, she walks home.
   */
  private startGuest() {
    const L = this.L;
    const k = L.k;
    this.basketAside(true);
    void this.visitorIn.then(() => {
      if (this.leaving || !this.scene.isActive()) return;
      const who = new Guest(this, this.visitor, this.visitorSpot());
      who.box.setDepth(30);
      const goods = Phaser.Utils.Array.Shuffle(this.crates.map((c) => c.good)).slice(0, T.guestWants[this.level - 1]);
      this.guest = { who, wants: goods.map((good) => ({ good, got: false })) };
      this.shown.guest = this.visitor.id;
      this.shown.guestWants = goods.map((g) => g.id);
      this.shown.guestGot = 0;
      this.time.delayedCall(300, () =>
        who.arrive(() => {
          if (this.leaving) return;
          who.showWish(goods.map((g) => g.key), goods.map((g) => g.id), { maxRight: this.stall.x0 + 200 * k, minLeft: L.m, k });
          this.say(this.visitor.hello, { ttlMs: 5000 });
          this.say('vo-market-guest', { ttlMs: 7000 });
          this.time.delayedCall(500, () => this.begin('guest', null));
        }),
      );
    });
  }

  private guestWant() {
    return this.guest?.wants.find((w) => !w.got) ?? null;
  }

  /** A good brought to the visitor: what she wished for goes into her mouth; anything else floats back. */
  private toGuest(c: Crate, img: Phaser.GameObjects.Image) {
    const g = this.guest!;
    const L = this.L;
    const w = g.wants.find((q) => !q.got && q.good === c.good);
    const m = g.who.mouthAt;
    if (!w || this.phase !== 'guest') {
      sfx(this, 'squish', { volume: 0.6 });
      voice.say(c.good.name, { group: 'name', ttlMs: 2000, valid: () => this.scene.isActive() && !this.leaving });
      boing(this, g.who.box, 0.06);
      this.tweens.killTweensOf(img);
      this.tweens.chain({
        targets: img,
        tweens: [
          { x: (img.x + m.x) / 2, y: img.y - 40 * L.k, duration: 200, ease: 'Quad.easeOut' },
          { x: c.item.x, y: c.item.y, angle: 0, scale: c.scale, duration: 380, ease: 'Back.easeOut' },
        ],
        onComplete: () => img.destroy(),
      });
      return this.miss();
    }
    w.got = true;
    this.shown.guestGot = g.wants.filter((q) => q.got).length;
    this.poke();
    voice.say(c.good.name, { group: 'name', ttlMs: 2500, valid: () => this.scene.isActive() && !this.leaving });
    g.who.setMood('expect');
    const bx = this.box(c.good.key);
    this.tweens.killTweensOf(img);
    img.setDepth(40);
    this.tweens.add({
      targets: img,
      x: m.x,
      y: m.y,
      scale: (80 * L.k) / Math.max(bx.w, bx.h),
      angle: 0,
      duration: 380,
      ease: 'Quad.easeOut',
      onComplete: () => {
        sfx(this, 'munch');
        this.tweens.add({ targets: img, scale: 0, duration: 260, onComplete: () => img.destroy() });
        g.who.wishFound(g.wants.indexOf(w));
        if (g.wants.every((q) => q.got)) {
          this.setPhase('intro');
          this.time.delayedCall(300, () => this.guestDone());
        } else {
          g.who.react('plain');
          g.who.setMood('rest');
        }
      },
    });
  }

  private guestDone() {
    const g = this.guest!;
    const L = this.L;
    g.who.setMood('rest');
    g.who.wishGranted();
    this.say('vo-market-guest-yum', { ttlMs: 5000 });
    this.mom?.happy();
    this.time.delayedCall(800, () => this.mom?.rest());
    // she walks home the way she came, happy; the basket comes back
    this.time.delayedCall(2200, () => {
      const box = g.who.box;
      g.who.setMood('expect');
      g.who.setMood('rest');
      this.tweens.killTweensOf(box);
      this.tweens.add({ targets: box, x: -400 * g.who.scale - 100 * L.k, duration: 1400, ease: 'Sine.easeIn', onComplete: () => box.destroy() });
      this.tweens.add({ targets: box, angle: { from: -6, to: 6 }, duration: 160, yoyo: true, repeat: 4 });
      this.time.delayedCall(700, () => this.basketAside(false));
      this.time.delayedCall(900, () => {
        this.guest = null;
        this.praise(this.stall.cx, L.Y(300), () => this.nextPart(), 500);
      });
    });
  }

  // ---------------------------------------------------------------- the mixed-up box

  /**
   * A box of one good is carried to the counter, but something else got in with them (level 2: two of a thing that looks
   * alike). A tap on the one that does not belong: it hops back into its own crate on the stall. A tap on one that does:
   * it wiggles, Mom names it (a quiet miss).
   */
  private startMixed() {
    const L = this.L;
    const k = L.k;
    const odd = T.mixed.odd[this.level - 1];
    const on = this.crates.map((c) => c.good);
    const has = (id: string) => on.find((g) => g.id === id);
    let host: Good;
    let other: Good;
    const alike = this.level === 2 ? Phaser.Utils.Array.Shuffle(ALIKE.filter(([a, b]) => has(a) && has(b))) : [];
    if (alike.length) {
      host = has(alike[0][0])!;
      other = has(alike[0][1])!;
    } else {
      const two = Phaser.Utils.Array.Shuffle(on.slice());
      // (level 1: clearly different: not a look-alike pair)
      host = two[0];
      other = two.slice(1).find((g) => !ALIKE.some(([a, b]) => a === host.id && b === g.id)) ?? two[1];
    }
    const n = T.mixed.items;
    const oddAt = Phaser.Utils.Array.Shuffle([...Array(n).keys()]).slice(0, odd);
    const x0 = this.stall.x0 + 30 * k;
    const x1 = this.stall.x1 - 30 * k;
    const cw = (x1 - x0) / 3;
    const rows = [L.Y(640), L.Y(760)];
    const ih = Math.min(150 * k, (rows[1] - rows[0]) * 1.25);
    const items = [...Array(n).keys()].map((i) => {
      const good = oddAt.includes(i) ? other : host;
      const r = Math.floor(i / 3);
      const x = x0 + cw * ((i % 3) + 0.5) + (r ? 0.2 : -0.2) * cw * 0.3;
      const y = rows[r];
      const img = this.goodImage(good, x, y + 500 * k, cw * 0.7, ih).setDepth(50 + r * 2).setAngle(Phaser.Math.Between(-8, 8));
      this.tweens.add({ targets: img, y, duration: 520, delay: 60 * i, ease: 'Back.easeOut' });
      return { img, good, odd: good === other, out: false, x, y, scale: img.scale };
    });
    const fs = (x1 - x0 + 40 * k) / 300;
    const front = this.add.image(this.stall.cx, L.Y(960) + 500 * k, 'market-crate').setOrigin(0.5, 1).setScale(fs, Math.min(fs * 0.5, (L.Y(960) - rows[1] - 45 * k) / 150)).setDepth(55);
    this.tweens.add({ targets: front, y: L.Y(960), duration: 520, ease: 'Back.easeOut' });
    sfx(this, 'whoosh');
    this.mixed = { items, front, host, said: 0 };
    // the stall's goods step back behind the box (each comes back when a stranger is sent home, all at the end)
    this.tweens.add({ targets: this.crates.map((c) => c.item), alpha: 0.3, duration: 300 });
    this.shown.mixedHost = host.id;
    this.shown.mixedOdd = other.id;
    this.shown.mixedLeft = odd;
    this.time.delayedCall(700, () => {
      this.say('vo-market-mixed', { ttlMs: 6000 });
      this.begin('mixed', null);
    });
  }

  private mixedAt(at: P) {
    const m = this.mixed;
    if (!m) return null;
    const cw = (this.stall.x1 - this.stall.x0 - 60 * this.L.k) / 3;
    let best: (typeof m.items)[number] | null = null;
    let d = Infinity;
    for (const it of m.items) {
      if (it.out) continue;
      const dx = Math.abs(it.x - at.x);
      const dy = Math.abs(it.y - at.y);
      if (dx > cw / 2 + 10 * this.L.k || dy > 110 * this.L.k) continue;
      const dd = dx + dy;
      if (dd < d) {
        d = dd;
        best = it;
      }
    }
    return best;
  }

  private tapMixed(it: NonNullable<MarketScene['mixed']>['items'][number]) {
    const m = this.mixed!;
    const L = this.L;
    voice.say(it.good.name, { group: 'name', ttlMs: 2000, valid: () => this.scene.isActive() && !this.leaving });
    if (!it.odd) {
      // it belongs here: a wiggle, Mom names it
      sfx(this, 'squish', { volume: 0.5 });
      this.tweens.killTweensOf(it.img);
      this.tweens.add({ targets: it.img, angle: { from: it.img.angle - 10, to: it.img.angle + 10 }, duration: 90, yoyo: true, repeat: 2, onComplete: () => it.img.setAngle(0) });
      return this.miss();
    }
    it.out = true;
    this.poke();
    const left = m.items.filter((q) => q.odd && !q.out).length;
    this.shown.mixedLeft = left;
    sfx(this, 'pop');
    stars(this, it.img.x, it.img.y, 6, 40 * L.k);
    const home = this.crates.find((c) => c.good === it.good);
    const to = home ? { x: home.item.x, y: home.item.y, s: home.scale } : { x: this.stall.cx, y: -200 * L.k, s: it.scale };
    it.img.setDepth(600);
    this.tweens.killTweensOf(it.img);
    this.tweens.add({ targets: it.img, y: it.img.y - 160 * L.k, angle: 0, duration: 260, ease: 'Quad.easeOut' });
    this.tweens.add({
      targets: it.img,
      x: to.x,
      y: to.y,
      scale: to.s,
      duration: 520,
      delay: 260,
      ease: 'Sine.easeInOut',
      onComplete: () => {
        it.img.destroy();
        if (home) home.item.setAlpha(1);
        if (home) boing(this, home.item, 0.15);
        sfx(this, 'pop', { volume: 0.6 });
      },
    });
    this.mom?.happy();
    this.time.delayedCall(700, () => this.mom?.rest());
    if (left > 0) {
      this.say('vo-market-mixed-more', { ttlMs: 4000 });
      return;
    }
    this.setPhase('intro');
    this.say('vo-market-mixed-yes', { ttlMs: 4000 });
    this.time.delayedCall(1100, () => {
      const parts = [m.front, ...m.items.filter((q) => !q.out).map((q) => q.img)];
      this.tweens.add({ targets: parts, y: `+=${600 * L.k}`, duration: 500, ease: 'Sine.easeIn', onComplete: () => parts.forEach((o) => o.destroy()) });
      this.mixed = null;
      this.tweens.add({ targets: this.crates.map((c) => c.item), alpha: 1, duration: 400 });
      this.praise(this.stall.cx, L.Y(300), () => this.nextPart(), 500);
    });
  }

  // ---------------------------------------------------------------- paying

  /**
   * The price on the chalk slate. Level 1: a chalk circle for every coin to pay; she takes coins from Mom's purse (a tap,
   * or a drag to the slate) and each fills the next circle, Mom counting. Level 2: the price is dice dots, and three piles
   * of coins wait on the counter (one less, as many, one more): she picks the pile with as many coins as dots. Another
   * pile: "Let's count them!", Mom counts it aloud coin by coin (a quiet miss), and she can look again.
   */
  private startPay() {
    const L = this.L;
    const k = L.k;
    const [lo, hi] = T.price[this.level - 1];
    const n = Phaser.Math.Between(lo, hi);
    const w = this.stall.x1 - this.stall.x0;
    const ss = Math.min(0.95 * k, (w * 0.62) / 380);
    const slate = this.add.image(this.stall.cx, L.Y(470), 'market-slate').setScale(0).setDepth(50);
    this.tweens.add({ targets: slate, scale: ss, duration: 420, ease: 'Back.easeOut' });
    const chalk = this.add.graphics().setDepth(51).setAlpha(0);
    this.tweens.add({ targets: chalk, alpha: 1, duration: 300, delay: 400 });
    const F = ART.market.slateFace;
    const face = { x: slate.x + (F.x - 190) * ss, y: slate.y + (F.y - 150) * ss, w: F.w * ss, h: F.h * ss };
    const coinScale = Math.min(0.62 * k, (w / 3) / 5 / 110 * 1.6);
    this.pay = { n, slate, chalk, spots: [], r: 0, paid: 0, purse: null, piles: [], busy: false, coinScale };
    this.shown.price = n;
    this.shown.paid = 0;
    sfx(this, 'whoosh');
    const pay = this.pay;
    if (this.level === 1) {
      // a dashed chalk circle per coin, in one row (two rows from 4)
      const cols = n <= 3 ? n : Math.ceil(n / 2);
      const rows = Math.ceil(n / cols);
      const r = Math.min((face.w / cols) * 0.36, (face.h / rows) * 0.36);
      pay.r = r;
      for (let i = 0; i < n; i++) {
        const row = Math.floor(i / cols);
        const inRow = Math.min(cols, n - row * cols);
        const c = i - row * cols;
        const x = face.x + face.w / 2 + (c - (inRow - 1) / 2) * (face.w / cols);
        const y = face.y + face.h / 2 + (row - (rows - 1) / 2) * (face.h / rows);
        pay.spots.push({ x, y });
        this.dashedCircle(chalk, x, y, r);
      }
      const ps = 0.72 * k;
      pay.purse = this.add.image(this.basket.x, L.Y(500) + 400 * k, 'market-purse').setScale(ps).setDepth(40);
      this.tweens.add({ targets: pay.purse, y: L.Y(500), duration: 450, delay: 200, ease: 'Back.easeOut' });
      this.time.delayedCall(600, () => {
        this.say('vo-market-pay', { ttlMs: 6000 });
        this.begin('pay', null);
      });
      return;
    }
    // Level 2: the price as dice dots, and three piles of coins on the counter.
    const r = Math.min(face.w, face.h) * 0.075;
    for (const [dx, dy] of DICE[n]) {
      chalk.fillStyle(0xfffdf7, 0.95);
      chalk.fillCircle(face.x + face.w / 2 + dx * face.h * 0.3, face.y + face.h / 2 + dy * face.h * 0.3, r);
    }
    const counts = Phaser.Utils.Array.Shuffle([n - 1, n, n + 1]);
    this.shown.piles = counts.slice();
    const cw = w / 3;
    const cy = L.Y(820);
    // the goods on the lower shelf step back, so the piles of coins read as piles (back when it is paid)
    this.tweens.add({ targets: this.crates.map((c) => c.item), alpha: 0.3, duration: 300 });
    pay.piles = counts.map((cnt, i) => {
      const cx = this.stall.x0 + cw * (i + 0.5);
      const spots = this.scatter(cnt, Math.min(cw * 0.36, 120 * k), 110 * coinScale * 0.95);
      const coins = spots.map((q, j) => {
        const c = this.add.image(cx + q.x, cy + q.y * 0.7 + 500 * k, 'market-coin').setScale(coinScale).setDepth(56 + j * 0.01);
        this.tweens.add({ targets: c, y: cy + q.y * 0.7, duration: 420, delay: 300 + i * 120 + j * 30, ease: 'Back.easeOut' });
        return c;
      });
      return { x: cx, y: cy, coins, n: cnt };
    });
    this.time.delayedCall(700, () => {
      this.say('vo-market-pay-dots', { ttlMs: 6000 });
      this.begin('pay', null);
    });
  }

  /** Points for `n` coins strewn in a circle of radius `R`, at least `gap` apart (not in a dice pattern: she counts them). */
  private scatter(n: number, R: number, gap: number): P[] {
    const out: P[] = [];
    for (let tries = 0; out.length < n && tries < 4000; tries++) {
      const a = Math.random() * Math.PI * 2;
      const d = Math.sqrt(Math.random()) * R;
      const q = { x: Math.cos(a) * d, y: Math.sin(a) * d };
      if (out.every((o) => Math.hypot(o.x - q.x, o.y - q.y) >= gap * (tries > 2000 ? 0.8 : 1))) out.push(q);
    }
    while (out.length < n) out.push({ x: (out.length - n / 2) * gap * 0.6, y: 0 });
    return out;
  }

  private dashedCircle(g: Phaser.GameObjects.Graphics, x: number, y: number, r: number) {
    const k = this.L.k;
    g.lineStyle(6 * k, 0xfffdf7, 0.9);
    const segs = 14;
    for (let i = 0; i < segs; i++) {
      const a0 = (i / segs) * Math.PI * 2;
      const a1 = a0 + (Math.PI * 2) / segs / 1.8;
      g.beginPath();
      g.arc(x, y, r, a0, a1);
      g.strokePath();
    }
  }

  /** A coin from the purse lands in the next chalk circle: a clink, Mom counts. */
  private coinIn(coin: Phaser.GameObjects.Image) {
    const p = this.pay!;
    if (p.paid >= p.n) return coin.destroy();
    const at = p.spots[p.paid++];
    this.shown.paid = p.paid;
    this.poke();
    this.tweens.killTweensOf(coin);
    coin.setDepth(52).setData('coin', true);
    this.tweens.add({
      targets: coin,
      x: at.x,
      y: at.y,
      angle: 0,
      scale: (p.r * 2 * 0.95) / 110,
      duration: 320,
      ease: 'Quad.easeOut',
      onComplete: () => {
        sfx(this, 'click', { volume: 0.8 });
        burst(this, at.x, at.y, { texture: 'star', count: 3, size: 24 * this.L.k, speed: 200, gravityY: 400, lifespan: 400, depth: 70 });
      },
    });
    this.say(countKey(p.paid), { group: 'count', sequence: true, ttlMs: 8000 });
    if (p.paid >= p.n) {
      this.setPhase('intro');
      this.time.delayedCall(700, () => this.paid());
    }
  }

  /** Level 2: a pile was picked. As many as the dots: it is paid. Else Mom counts that pile aloud. */
  private pickPile(pile: NonNullable<MarketScene['pay']>['piles'][number]) {
    const p = this.pay!;
    const L = this.L;
    p.busy = true;
    if (pile.n === p.n) {
      this.setPhase('intro');
      this.poke();
      // the coins hop onto the slate's ledge one by one, Mom counting
      const F = ART.market.slateFace;
      const ss = p.slate.scale;
      const ly = p.slate.y + (F.y + F.h + 34 - 150) * ss;
      pile.coins.forEach((c, i) => {
        const x = p.slate.x + (i - (pile.coins.length - 1) / 2) * 34 * ss;
        this.time.delayedCall(i * T.countMs, () => {
          sfx(this, 'click', { volume: 0.8 });
          // the last number said: paid (Mom's counting may run behind the hops)
          const last = i === pile.coins.length - 1;
          this.say(countKey(i + 1), { group: 'count', sequence: true, ttlMs: 8000, done: last ? () => !this.leaving && this.time.delayedCall(250, () => this.paid()) : undefined });
          this.tweens.add({ targets: c, x, y: ly, angle: 0, duration: 360, ease: 'Quad.easeOut', onComplete: () => c.setDepth(52) });
        });
      });
      return;
    }
    this.shown.payWrong = (this.shown.payWrong as number) + 1;
    this.say('vo-market-count', { ttlMs: 7000 });
    pile.coins.forEach((c, i) => {
      this.time.delayedCall(900 + i * T.countMs, () => {
        if (this.leaving) return;
        // the piles wait until Mom has said the last number of this one
        const last = i === pile.coins.length - 1;
        this.say(countKey(i + 1), { group: 'count', sequence: true, ttlMs: 8000, done: last ? () => { if (this.leaving) return; p.busy = false; this.miss(); } : undefined });
        this.tweens.add({ targets: c, y: c.y - 30 * L.k, duration: 140, yoyo: true, ease: 'Quad.easeOut' });
        sfx(this, 'tap', { volume: 0.5 });
      });
    });
  }

  private paid() {
    const p = this.pay!;
    const L = this.L;
    this.say('vo-market-paid', { ttlMs: 5000 });
    this.tweens.add({ targets: this.crates.map((c) => c.item), alpha: 1, duration: 400 });
    sfx(this, 'star');
    stars(this, p.slate.x, p.slate.y, 10, 60 * L.k);
    this.mom?.happy();
    this.time.delayedCall(1300, () => {
      const parts: Phaser.GameObjects.GameObject[] = [p.slate, p.chalk, ...p.piles.flatMap((q) => q.coins), ...(p.purse ? [p.purse] : [])];
      this.children.list.filter((o) => o.getData?.('coin')).forEach((o) => parts.push(o));
      this.tweens.add({ targets: parts, alpha: 0, duration: 400, onComplete: () => parts.forEach((o) => o.destroy()) });
      this.pay = null;
      this.praise(this.stall.cx, L.Y(300), () => this.nextPart(), 300);
    });
  }

  // ---------------------------------------------------------------- the finale

  private finale() {
    const L = this.L;
    this.setPhase('done');
    this.shown.done = true;
    const b = this.basket;
    const eater = this.pipa?.visible ? this.pipa : null;
    const mouth = eater ? eater.mouthAt : this.mom?.mouthAt;
    const berry = GOODS.find((g) => g.id === 'strawberry')!;
    if (mouth) {
      const img = this.goodImage(berry, this.basketIn().x, this.basketIn().y - 20 * L.k, 90 * L.k, 90 * L.k).setDepth(600);
      this.tweens.add({
        targets: img,
        x: mouth.x,
        y: mouth.y,
        scale: img.scale * 0.7,
        duration: 650,
        delay: 300,
        ease: 'Sine.easeInOut',
        onComplete: () => {
          sfx(this, 'munch');
          this.tweens.add({ targets: img, scale: 0, duration: 250, onComplete: () => img.destroy() });
          if (eater) this.time.delayedCall(400, () => eater.react('love'));
          else this.mom?.chew(900);
        },
      });
    }
    this.time.delayedCall(1700, () => {
      sfx(this, 'cheer-jingle');
      music.party(true); // on until home
      stars(this, b.x, b.y - 60 * L.k, 14, 70 * L.k);
      confetti(this, this.stall.cx, L.Y(260), 22, 28 * L.k);
      this.mom?.celebrate();
      this.pipa?.cheer();
      this.goodbye('vo-market-done');
    });
  }

  // ---------------------------------------------------------------- Mom's hand

  protected way(): HandMotion | null {
    const k = this.L.k;
    if (this.phase === 'mixed') {
      const it = this.mixed?.items.find((q) => q.odd && !q.out);
      return it ? tapMotion({ x: it.img.x, y: it.img.y }, k) : null;
    }
    if (this.phase === 'pay' && this.pay) {
      const p = this.pay;
      if (this.level === 2) {
        const pile = p.piles.find((q) => q.n === p.n);
        return pile ? tapMotion({ x: pile.x, y: pile.y }, k) : null;
      }
      const to = p.spots[p.paid];
      if (!to || !p.purse) return null;
      const from = { x: p.purse.x, y: p.purse.y - 30 * k };
      return {
        kind: 'grab',
        keys: [
          { ...from, t: 0 },
          { ...from, t: 300 },
          { ...to, t: 1400 },
          { ...to, t: 1800 },
        ],
        props: [{ key: 'market-coin', scale: (p.r * 2 * 0.95) / 110, alpha: 0.6 }],
        glow: from,
      };
    }
    let want: Good | null = null;
    let to: P | null = null;
    if (this.phase === 'guest' && this.guest) {
      want = this.guestWant()?.good ?? null;
      to = this.guest.who.mouthAt;
    } else if (this.phase === 'shop') {
      want = this.nextWant()?.good ?? null;
      to = this.basketIn();
      // (level 2 with the list folded: her finger taps the list first, so it opens and she sees what to find)
      if (want && this.level === 2 && this.list && !this.list.open) return tapMotion({ x: this.list.x, y: this.list.y - 110 * this.list.s }, k);
    }
    if (!want || !to) return null;
    const c = this.crateOf(want);
    const from = { x: c.item.x, y: c.item.y };
    return {
      kind: 'grab',
      keys: [
        { ...from, t: 0 },
        { ...from, t: 300 },
        { ...to, t: 1500 },
        { ...to, t: 1900 },
      ],
      props: [{ key: want.key, scale: c.scale, alpha: 0.6, originX: c.item.originX, originY: c.item.originY }],
      glow: from,
    };
  }

  protected helpOnce() {
    const k = this.L.k;
    if (this.phase === 'mixed') {
      const it = this.mixed?.items.find((q) => q.odd && !q.out);
      if (!it) return false;
      this.hand.play(tapMotion({ x: it.img.x, y: it.img.y }, k));
      this.time.delayedCall(700, () => {
        this.helped();
        if (!it.out && this.phase === 'mixed') this.tapMixed(it);
      });
      return true;
    }
    if (this.phase === 'pay' && this.pay) {
      const p = this.pay;
      if (p.busy) return false;
      if (this.level === 2) {
        const pile = p.piles.find((q) => q.n === p.n);
        if (!pile) return false;
        this.hand.play(tapMotion({ x: pile.x, y: pile.y }, k));
        this.time.delayedCall(700, () => {
          this.helped();
          if (this.phase === 'pay') this.pickPile(pile);
        });
        return true;
      }
      if (!p.purse || p.paid >= p.n) return false;
      const coin = this.add.image(p.purse.x, p.purse.y - 40 * k, 'market-coin').setScale(p.coinScale).setDepth(600);
      this.hand.follow('grab', () => ({ x: coin.x, y: coin.y }));
      const to = p.spots[p.paid];
      this.tweens.add({
        targets: coin,
        x: to.x,
        y: to.y,
        duration: T.helpMs,
        delay: 250,
        ease: 'Sine.easeInOut',
        onComplete: () => {
          this.helped();
          if (this.phase === 'pay') this.coinIn(coin);
          else coin.destroy();
        },
      });
      return true;
    }
    let want: Good | null = null;
    if (this.phase === 'shop') {
      const w = this.nextWant();
      if (!w) return false;
      want = w.good;
      if (this.level === 2 && this.list && !this.list.open) this.peek();
    } else if (this.phase === 'guest' && this.guest) want = this.guestWant()?.good ?? null;
    if (!want) return false;
    const c = this.crateOf(want);
    const img = this.lift(c);
    this.hand.follow('grab', () => ({ x: img.x, y: img.y }));
    const into = this.phase === 'guest' ? this.guest!.who.mouthAt : { x: this.basketIn().x, y: this.basketIn().y - 30 * k };
    const phase = this.phase;
    this.tweens.add({
      targets: img,
      x: into.x,
      y: into.y,
      duration: T.helpMs,
      delay: 250,
      ease: 'Sine.easeInOut',
      onComplete: () => {
        this.helped();
        if (phase === 'guest' && this.phase === 'guest') return this.toGuest(c, img);
        const w = this.wants.find((q) => !q.got && q.good === c.good);
        if (w && this.phase === 'shop') this.intoBasket(w, img);
        else img.destroy();
      },
    });
    return true;
  }

  // ---------------------------------------------------------------- touch

  protected down(p: Phaser.Input.Pointer, at: P) {
    const k = this.L.k;
    if (this.phase === 'mixed') {
      const it = this.mixedAt(at);
      if (it) this.tapMixed(it);
      return;
    }
    if (this.phase === 'pay') {
      const pay = this.pay;
      if (!pay || pay.busy) return;
      if (this.level === 2) {
        const cw = (this.stall.x1 - this.stall.x0) / 3;
        const pile = pay.piles.find((q) => Math.abs(q.x - at.x) < cw / 2 && Math.abs(q.y - at.y) < 150 * k);
        if (pile) {
          sfx(this, 'tap', { volume: 0.7 });
          this.pickPile(pile);
        }
        return;
      }
      if (pay.purse && this.near(at, pay.purse, Math.max(130 * k, pay.purse.displayWidth / 2 + 20 * k))) {
        const coin = this.add.image(at.x, at.y - 40 * k, 'market-coin').setScale(pay.coinScale).setDepth(600);
        boing(this, pay.purse, 0.08);
        sfx(this, 'tap', { volume: 0.7 });
        this.coinHeld = { img: coin, from: { x: at.x, y: at.y }, moved: 0 };
        this.own(p);
      }
      return;
    }
    if (this.phase !== 'shop' && this.phase !== 'guest') return;
    if (this.phase === 'shop' && this.onList(at)) {
      if (this.level === 2) this.peek();
      else if (this.list) boing(this, this.list.paper, 0.05);
      return;
    }
    const slotW = (this.stall.x1 - this.stall.x0) / this.cols;
    const c = this.crates.find((q) => Math.abs(q.x - at.x) < slotW / 2 && at.y < q.y + 30 * k && at.y > q.y - (this.L.Y(900) - this.L.Y(620)) + 20 * k);
    if (!c) {
      // a tap on the visitor: she smiles (nothing else)
      if (this.phase === 'guest' && this.guest && this.near(at, this.guest.who.box, 160 * k)) boing(this, this.guest.who.box, 0.05);
      return;
    }
    const img = this.lift(c);
    this.tweens.add({ targets: img, scale: c.scale * 1.12, duration: 120 });
    sfx(this, 'tap', { volume: 0.7 });
    this.held = { crate: c, img, from: { x: at.x, y: at.y }, moved: 0 };
    this.own(p);
  }

  protected move(p: Phaser.Input.Pointer) {
    const L = this.L;
    const h = this.held ?? this.coinHeld;
    if (!h) return;
    h.moved = Math.max(h.moved, Math.hypot(p.worldX - h.from.x, p.worldY - h.from.y));
    h.img.setPosition(Phaser.Math.Clamp(p.worldX, 0, L.W), Phaser.Math.Clamp(p.worldY - 30 * L.k, 0, L.H));
    sway(this, h.img, p.worldX - p.prevPosition.x, L.k);
  }

  protected up(_p: Phaser.Input.Pointer, cancelled: boolean) {
    const k = this.L.k;
    const ch = this.coinHeld;
    if (ch) {
      this.coinHeld = null;
      settle(this, ch.img);
      const pay = this.pay;
      const tap = ch.moved < T.tapMove * k;
      const s = pay?.slate;
      const onSlate = !!s && Math.abs(ch.img.x - s.x) < s.displayWidth / 2 + 60 * k && Math.abs(ch.img.y - s.y) < s.displayHeight / 2 + 60 * k;
      if (!cancelled && pay && this.phase === 'pay' && (tap || onSlate)) return this.coinIn(ch.img);
      if (!cancelled) this.miss();
      const to = pay?.purse ?? ch.img;
      this.tweens.add({ targets: ch.img, x: to.x, y: to.y - 30 * k, scale: 0.3 * k, alpha: 0, duration: 320, onComplete: () => ch.img.destroy() });
      return;
    }
    const h = this.held;
    this.held = null;
    if (!h) return;
    settle(this, h.img);
    const tap = h.moved < T.tapMove * k;
    if (this.phase === 'guest' && this.guest) {
      const m = this.guest.who.mouthAt;
      const atGuest = this.near({ x: h.img.x, y: h.img.y }, m, T.reach * k) || this.near({ x: h.img.x, y: h.img.y }, this.guest.who.box, T.reach * k);
      if (!cancelled && (tap || atGuest)) return this.toGuest(h.crate, h.img);
    } else {
      const b = this.basket;
      const inBasket = this.near({ x: h.img.x, y: h.img.y }, { x: b.x, y: b.y - 40 * k }, T.reach * k);
      if (!cancelled && (tap || inBasket)) return this.offer(h.crate, h.img);
    }
    // Let go elsewhere (or a lost touch): it floats back to its crate, gently.
    if (!cancelled) this.miss();
    this.tweens.add({ targets: h.img, x: h.crate.item.x, y: h.crate.item.y, scale: h.crate.scale, angle: 0, duration: 360, ease: 'Back.easeOut', onComplete: () => h.img.destroy() });
  }

  protected lookTarget() {
    const h = this.held ?? this.coinHeld;
    return h ? { x: h.img.x, y: h.img.y } : null;
  }
}
