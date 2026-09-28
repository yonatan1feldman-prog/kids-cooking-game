import Phaser from 'phaser';
import { ART, type ImageKey } from '../core/assets';
import { countKey, voice, type NameKey } from '../core/audio';
import { boing, burst, stars } from '../core/fx';
import { tapMotion, type HandMotion } from '../core/hand';
import { confetti, settle, sway } from '../core/juice';
import { opaqueBounds } from '../core/placeholders';
import { sfx } from '../core/sfx';
import { TUNING } from '../core/tuning';
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
  protected readonly waiting = ['shop'] as const;
  private crates: Crate[] = [];
  private wants: Want[] = [];
  private round = 0;
  /** The list on paper (round 1, and round 2 where Pipa is not on screen); null when it is Pipa's bubble. */
  private list: { box: Phaser.GameObjects.Container; paper: Phaser.GameObjects.Image; x: number; y: number; s: number; open: boolean } | null = null;
  private listTimer: Phaser.Time.TimerEvent | null = null;
  private basket!: { back: Phaser.GameObjects.Image; front: Phaser.GameObjects.Image; x: number; y: number; s: number };
  private inBasket = 0;
  private held: { crate: Crate; img: Phaser.GameObjects.Image; from: P; moved: number } | null = null;
  private stall!: { x0: number; x1: number; cx: number; top: number };
  private notSaid = 0;
  private cols = 4;
  private bounds = new Map<string, { cx: number; cy: number; w: number; h: number }>();

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
    this.held = null;
    this.notSaid = 0;
    Object.assign(this.shown, { round: 0, found: 0, wanted: 0, inBasket: 0, stall: [] as string[], want: [] as string[] });
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
  }

  protected ready() {
    this.time.delayedCall(500, () => this.startRound());
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
    img.setDepth(31);
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
    const again = this.round < T.rounds;
    this.praise(this.stall.cx, L.Y(300), () => (again ? this.restock() : this.finale()), 900);
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
    if (this.phase !== 'shop') return null;
    const w = this.nextWant();
    if (!w) return null;
    const c = this.crateOf(w.good);
    const from = { x: c.item.x, y: c.item.y };
    const into = this.basketIn();
    // (level 2 with the list folded: her finger taps the list first, so it opens and she sees what to find)
    if (this.level === 2 && this.list && !this.list.open) {
      const m = tapMotion({ x: this.list.x, y: this.list.y - 110 * this.list.s }, k);
      return m;
    }
    return {
      kind: 'grab',
      keys: [
        { ...from, t: 0 },
        { ...from, t: 300 },
        { ...into, t: 1500 },
        { ...into, t: 1900 },
      ],
      props: [{ key: w.good.key, scale: c.scale, alpha: 0.6, originX: c.item.originX, originY: c.item.originY }],
      glow: from,
    };
  }

  protected helpOnce() {
    if (this.phase !== 'shop') return false;
    const w = this.nextWant();
    if (!w) return false;
    const c = this.crateOf(w.good);
    if (this.level === 2 && this.list && !this.list.open) this.peek();
    const img = this.lift(c);
    this.hand.follow('grab', () => ({ x: img.x, y: img.y }));
    const into = this.basketIn();
    this.tweens.add({
      targets: img,
      x: into.x,
      y: into.y - 30 * this.L.k,
      duration: T.helpMs,
      delay: 250,
      ease: 'Sine.easeInOut',
      onComplete: () => {
        this.helped();
        if (!w.got) this.intoBasket(w, img);
        else img.destroy();
      },
    });
    return true;
  }

  // ---------------------------------------------------------------- touch

  protected down(p: Phaser.Input.Pointer, at: P) {
    if (this.phase !== 'shop') return;
    if (this.onList(at)) {
      if (this.level === 2) this.peek();
      else if (this.list) boing(this, this.list.paper, 0.05);
      return;
    }
    const k = this.L.k;
    const slotW = (this.stall.x1 - this.stall.x0) / this.cols;
    const c = this.crates.find((q) => Math.abs(q.x - at.x) < slotW / 2 && at.y < q.y + 30 * k && at.y > q.y - (this.L.Y(900) - this.L.Y(620)) + 20 * k);
    if (!c) return;
    const img = this.lift(c);
    this.tweens.add({ targets: img, scale: c.scale * 1.12, duration: 120 });
    sfx(this, 'tap', { volume: 0.7 });
    this.held = { crate: c, img, from: { x: at.x, y: at.y }, moved: 0 };
    this.own(p);
  }

  protected move(p: Phaser.Input.Pointer) {
    const h = this.held;
    if (!h) return;
    const L = this.L;
    h.moved = Math.max(h.moved, Math.hypot(p.worldX - h.from.x, p.worldY - h.from.y));
    h.img.setPosition(Phaser.Math.Clamp(p.worldX, 0, L.W), Phaser.Math.Clamp(p.worldY - 30 * L.k, 0, L.H));
    sway(this, h.img, p.worldX - p.prevPosition.x, L.k);
  }

  protected up(_p: Phaser.Input.Pointer, cancelled: boolean) {
    const h = this.held;
    this.held = null;
    if (!h) return;
    const k = this.L.k;
    settle(this, h.img);
    const b = this.basket;
    const tap = h.moved < T.tapMove * k;
    const inBasket = this.near({ x: h.img.x, y: h.img.y }, { x: b.x, y: b.y - 40 * k }, T.reach * k);
    if (!cancelled && (tap || inBasket)) return this.offer(h.crate, h.img);
    // Let go elsewhere (or a lost touch): it floats back to its crate, gently.
    if (!cancelled) this.miss();
    this.tweens.add({ targets: h.img, x: h.crate.item.x, y: h.crate.item.y, scale: h.crate.scale, angle: 0, duration: 360, ease: 'Back.easeOut', onComplete: () => h.img.destroy() });
  }

  protected lookTarget() {
    return this.held ? { x: this.held.img.x, y: this.held.img.y } : null;
  }
}
