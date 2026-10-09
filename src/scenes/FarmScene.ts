import Phaser from 'phaser';
import { keepPhoto } from '../core/album';
import { FX_DOT, FX_SOFT, IMAGES, type ImageKey } from '../core/assets';
import { music, waterLoop, type VoiceKey } from '../core/audio';
import { ANIMALS, CHORES, FARM_TUNING as T, planVisit, SPARE_TOOLS, STAGE_LINE, type Animal, type ChoreId, type StageId } from '../core/farm';
import { ART_FARM as A } from '../core/farmAssets';
import { boing, burst, puff, stars } from '../core/fx';
import { tapMotion, type HandKey, type HandMotion, type HandProp } from '../core/hand';
import { confetti, sway } from '../core/juice';
import { sfx } from '../core/sfx';
import type { Spot } from '../core/stage';
import type { CharacterDef } from '../recipes/types';
import { Character } from '../steps/Character';
import { MiniGame, type P } from './MiniGame';

/** The animals' frame (800x700, feet at y 684, facing left). */
const FW = 800;
const FH = 700;
const FEET = 684;

/** The display scale that shows an image at `s` times its native size (images rasterized smaller or bigger, `raster`). */
function rs(key: string, s: number) {
  return s / ((IMAGES[key as ImageKey] as { raster?: number } | undefined)?.raster ?? 1);
}

/** A big animal: the layered character (Character.ts) on the 800 frame, with her own voice's pitch and things put on her. */
class FarmAnimal extends Character {
  constructor(scene: Phaser.Scene, def: CharacterDef, spot: Spot, rate: number) {
    super(scene, def, spot, spot);
    this.voiceRate = rate;
  }
  /** An image on her, at a point of her frame (it moves and grows with her). */
  put(key: string, f: P, scale = 1, angle = 0) {
    const img = new Phaser.GameObjects.Image(this.scene, f.x - FW / 2, f.y - FH / 2, key).setScale(rs(key, scale)).setAngle(angle);
    this.box.add(img);
    return img;
  }
  /** A point of her frame in the world, where she rests. */
  at(f: P): P {
    return { x: this.rest.x + (f.x - FW / 2) * this.scale, y: this.rest.y + (f.y - FH / 2) * this.scale };
  }
  /** A world point in her frame. */
  frameOf(p: P): P {
    return { x: (p.x - this.rest.x) / this.scale + FW / 2, y: (p.y - this.rest.y) / this.scale + FH / 2 };
  }
  get rate() {
    return this.voiceRate;
  }
  get face(): Phaser.GameObjects.Image[] {
    return [this.eyes, this.mouth];
  }
}

/** A hen in the yard: sitting in her nest or standing beside it; her egg under her. */
interface Hen {
  img: Phaser.GameObjects.Image;
  nest: Phaser.GameObjects.Image;
  colour: 'white' | 'brown';
  /** Her nest's middle, and where she stands (pecking). */
  at: P;
  stand: P;
  sit: boolean;
  egg: Phaser.GameObjects.Image | null;
  eggColour: 'white' | 'brown';
  shy: boolean;
  laid: boolean;
}

interface Visit {
  a: Animal;
  chores: ChoreId[];
  done: boolean[];
  view: FarmAnimal | null;
  /** Behind the fence (the hens: two little hens in front of it). */
  peek: Spot;
  peekImgs: Phaser.GameObjects.Image[];
  finished: boolean;
}

/** A chore's card beside the animal: a tap on it starts it. */
interface Card {
  disc: Phaser.GameObjects.Image;
  icon: Phaser.GameObjects.Image;
  glow: Phaser.GameObjects.Image;
  badge: Phaser.GameObjects.Image | null;
  at: P;
}

type Role = 'tool' | 'source' | 'thing' | 'fixed';
interface Slot {
  key: ImageKey;
  role: Role;
  decoy: boolean;
  img: Phaser.GameObjects.Image;
  glow: Phaser.GameObjects.Image;
  home: P;
  homeScale: number;
  away: boolean;
}

/** What the finger holds: a tool, a copy of what a slot gives (food, hay), a thing (the bell, an egg, the chick). */
interface Held {
  img: Phaser.GameObjects.Image;
  key: string;
  slot: Slot | null;
  role: Role;
  /** The working point's offset from the image's centre (world units). */
  tip: P;
  from: P;
  moved: number;
  last: P;
  t0: number;
  /** Where it goes back to (a thing that is not on the tray: an egg in its nest, the bucket under the cow). */
  back?: P;
  backScale?: number;
}

/** What a child would do next (Mom's hand, her help, the test harness): a tap, or a drag along keys. */
export interface Plan {
  tap?: P;
  keys?: HandKey[];
  prop?: HandProp;
}

/** One stage of a chore: one kind of touch. The scene gives it the touches that are not picking a tray slot. */
interface Job {
  stage: StageId;
  slots: { key: ImageKey; role: Role }[];
  /** A press not on the tray (a teat, a hen, an egg, the pump, the yarn ball). Return true if taken. */
  press?(at: P): boolean | 'own';
  /** The held thing moved: its working point, how far, the finger's move. */
  drag?(tp: P, dist: number, dx: number, dy: number): void;
  /** The finger let go with the held thing: return true if the job took it (else it goes back). */
  release?(h: Held, tp: P, tapped: boolean, cancelled: boolean): boolean;
  /** The free finger (winding): moved, let go. */
  free?(at: P): void;
  freeUp?(): void;
  tick?(delta: number): void;
  plan(): Plan | null;
  end?(): void;
}

/**
 * Mom's farm (research/farm-spec.md), a game in the cooking world that is not cooking. Three animals of five peek over
 * the fence (four on the hard level); she taps one and it comes to the middle. Its chores float beside it as cards
 * (easy: the next one glows and Mom says it; hard: she chooses, what has to come first comes first). Feed the horse and
 * brush him shiny (hard: what he wants shows in a bubble she remembers; his teeth); hay for the cow, milk her into the
 * bucket (hard: the bucket first, the teats in turn, the milk into the bottles); give the sheep a haircut and wind the
 * wool into a ball (hard: strokes down along the arrows, the other way half-way, a ribbon like Mom's picture); grain for
 * the hens and the eggs from under them (hard: two baskets by colour, a shy hen, a chick back to its mommy); scrub the
 * pig clean, soap, rinse at the pump, feed her. Every animal gives something to the cart (milk, wool, eggs; the horse a
 * ride for Pipa) and says thank you; the pig jumps straight back into her mud. At the end a photo of the cart for the
 * memory book, a scarf for Pipa from the wool, and quietly home. Nothing is timed, nothing can go wrong, nobody is sad.
 */
export class FarmScene extends MiniGame {
  protected readonly id = 'farm';
  protected readonly song = 'outside' as const;
  protected readonly waiting = ['pick', 'chore', 'work'] as const;
  private visit: Visit[] = [];
  private cur: Visit | null = null;
  private room!: { x0: number; x1: number; mid: P; ps: number; fenceTop: number; toolS: number; bg: number; yard: { x0: number; x1: number; y0: number; y1: number } };
  private cards: Card[] = [];
  private tray: Slot[] = [];
  private cart!: { img: Phaser.GameObjects.Image; s: number; items: Phaser.GameObjects.Image[] };
  private held: Held | null = null;
  private job: Job | null = null;
  private stages: StageId[] = [];
  private si = 0;
  private ci = 0;
  private said = new Set<string>();
  /** Things around the animal that stay while she is cared for (the trough, the bucket, the wool, the hens...). */
  private props: Phaser.GameObjects.GameObject[] = [];
  private hens: Hen[] = [];
  private baskets: { img: Phaser.GameObjects.Image; colour: 'white' | 'brown'; eggs: Phaser.GameObjects.Image[] }[] = [];
  private trough: Phaser.GameObjects.Image | null = null;
  private bucket: { img: Phaser.GameObjects.Image; full: Phaser.GameObjects.Image; level: number; spot: P; s: number } | null = null;
  private bottles: { img: Phaser.GameObjects.Image; full: Phaser.GameObjects.Image; level: number }[] = [];
  private pile: { img: Phaser.GameObjects.Image; s: number } | null = null;
  private ball: { img: Phaser.GameObjects.Image; s: number } | null = null;
  private bubbles: Phaser.GameObjects.Image[] = [];
  private mud: Phaser.GameObjects.Image[] = [];
  private freeOn = false;
  private give: { horse: boolean; cow: boolean; sheep: boolean; hens: boolean } = { horse: false, cow: false, sheep: false, hens: false };

  constructor() {
    super('Farm');
  }

  init() {
    super.init();
    this.visit = [];
    this.cur = null;
    this.cards = [];
    this.tray = [];
    this.held = null;
    this.job = null;
    this.stages = [];
    this.si = this.ci = 0;
    this.said = new Set();
    this.props = [];
    this.hens = [];
    this.baskets = [];
    this.trough = null;
    this.bucket = null;
    this.bottles = [];
    this.pile = this.ball = null;
    this.bubbles = [];
    this.mud = [];
    this.freeOn = false;
    this.give = { horse: false, cow: false, sheep: false, hens: false };
    Object.assign(this.shown, { animals: [] as string[], cared: 0, chores: 0, stage: '', wrong: 0, photo: 0, cart: 0 });
  }

  // ---------------------------------------------------------------- the farm

  /** A point of the farm's backdrop (2400x1080, bottom-centre anchored like the kitchen) in the world. */
  private bgAt(x: number, y: number): P {
    const s = this.room.bg;
    return { x: this.L.W / 2 + (x - 1200) * s, y: this.L.H - (1080 - y) * s };
  }

  protected build() {
    const L = this.L;
    const S = this.S;
    const k = L.k;
    const bg = Math.max(1, L.W / 2400);
    this.add.image(L.W / 2, L.H, 'bg-farm').setOrigin(0.5, 1).setScale(bg).setDepth(-100);
    // the fence across the whole farm, its foot on the grass: the animals peek over it
    const fenceFoot = L.H - (1080 - 880) * bg;
    this.add.image(L.W / 2, fenceFoot, 'farm-fence').setOrigin(0.5, 1).setScale(bg).setDepth(4);
    const fenceTop = fenceFoot - 240 * bg;

    const petLeft = S.pet ? S.pet.x - 270 * S.pet.scale : Infinity;
    const x1 = Math.min(petLeft, S.momFace.x0) - 16 * k;
    const x0 = S.work.x0;
    const ps = Math.min(1.0 * k, (x1 - x0) / 740, (L.Y(985) - L.Y(250)) / 640);
    const mid = { x: (x0 + x1) / 2, y: L.Y(985) - (FEET - FH / 2) * ps };
    this.room = {
      x0, x1, mid, ps, fenceTop, bg,
      toolS: 0.9 * k,
      yard: { x0: x0 + 20 * k, x1: x1 - 20 * k, y0: L.Y(400), y1: L.Y(975) },
    };

    // who comes today: peeking over the fence, side by side (the hens in front of it)
    const animals = planVisit(T.animals[this.level - 1]);
    const n = animals.length;
    const px0 = L.m + 70 * k;
    const px1 = x1;
    const pk = Math.min(0.5 * k, (px1 - px0) / (n * 720));
    this.visit = animals.map((a, i) => {
      const x = px0 + ((i + 0.5) * (px1 - px0)) / n;
      // (the chest on the fence's top rail: the head and back show over it)
      const peek = { x, y: fenceTop + (330 - FH / 2) * pk + 34 * k, scale: pk };
      const v: Visit = { a, chores: a.chores[this.level - 1], done: a.chores[this.level - 1].map(() => false), view: null, peek, peekImgs: [], finished: false };
      if (a.def) {
        const view = (v.view = new FarmAnimal(this, a.def, peek, a.rate));
        view.box.setDepth(3);
        // the sheep in her fleece, the pig in her mud, from the start
        if (a.id === 'sheep') {
          const bands = this.level === 1 ? A.fleece4 : A.fleece6;
          const nb = bands.length;
          (view as unknown as { fleece: Phaser.GameObjects.Image[] }).fleece = bands.map(([cx, cy], j) => view.put(`fleece-${nb}-${j + 1}`, { x: cx, y: cy }));
        }
        if (a.id === 'pig') {
          (view as unknown as { mud: Phaser.GameObjects.Image[] }).mud = A.mud.slice(0, T.mud[this.level - 1]).map(([cx, cy], j) => view.put(`mud-patch-${j + 1}`, { x: cx, y: cy }));
        }
      } else {
        // two little hens on the grass in front of the fence
        const hs = Math.min(0.55 * k, (px1 - px0) / n / 640);
        v.peekImgs = [
          this.add.image(x - 70 * hs, fenceFoot + 6 * k, 'hen-up-white').setOrigin(0.5, 0.95).setScale(hs).setDepth(5),
          this.add.image(x + 80 * hs, fenceFoot + 16 * k, 'hen-up-brown').setOrigin(0.5, 0.95).setScale(hs * 0.95).setFlipX(true).setDepth(5),
        ];
      }
      return v;
    });
    this.shown.animals = this.visit.map((v) => v.a.id);

    // the cart at the foot of the left column: what the animals give goes in it
    const b4 = S.bin(4, 6);
    const b5 = S.bin(5, 6);
    const cell = S.binScale(6) * 240 + 10 * k;
    const cs = Math.min((2 * cell) / 480, (cell * 1.15) / 330) * 0.95;
    const cart = this.add.image((b4.x + b5.x) / 2, b4.y + 20 * k, 'farm-cart').setScale(cs).setDepth(15);
    this.cart = { img: cart, s: cs, items: [] };
  }

  protected ready() {
    this.time.delayedCall(400, () => this.startPick(true));
  }

  protected shutdown() {
    waterLoop.stop();
  }

  // ---------------------------------------------------------------- 1. who first?

  private startPick(first: boolean) {
    this.cur = null;
    this.begin('pick', first ? 'vo-farm-hello' : 'vo-farm-next');
  }

  /** A peeking animal's touch area: her head and back over the fence and the fence in front of her. */
  private hitPeek(v: Visit, at: P) {
    const k = this.L.k;
    const p = v.peek;
    const w = Math.max(130 * k, 300 * p.scale);
    if (!v.view) return Math.abs(at.x - p.x) < w && at.y > this.room.fenceTop - 40 * k && at.y < this.L.Y(990);
    return Math.abs(at.x - p.x) < w && at.y > this.room.fenceTop - 330 * p.scale - 40 * k && at.y < this.room.fenceTop + 140 * k;
  }

  private peekPoint(v: Visit): P {
    if (!v.view) return { x: v.peek.x, y: this.room.fenceTop + 120 * this.L.k };
    return { x: v.peek.x, y: this.room.fenceTop - 140 * v.peek.scale };
  }

  /** She picked one: it says hello, the others step back, it comes to the middle. */
  private callOut(v: Visit) {
    this.setPhase('intro');
    this.cur = v;
    this.said.clear();
    this.shown.animal = v.a.id;
    sfx(this, v.a.sound, { minGapMs: 0 });
    this.say(v.a.name, { ttlMs: 3000, group: 'name' });
    for (const o of this.visit) {
      if (o === v) continue;
      if (o.view) this.tweens.add({ targets: o.view.box, alpha: 0, duration: 300 });
      this.tweens.add({ targets: o.peekImgs, alpha: 0, duration: 300 });
    }
    if (v.view) {
      const view = v.view;
      view.setMood('happy');
      boing(this, view.box, 0.1);
      view.box.setDepth(6);
      this.time.delayedCall(350, () => view.moveTo({ x: this.room.mid.x, y: this.room.mid.y, scale: this.room.ps }, 900));
      this.time.delayedCall(1350, () => (view.setMood('rest'), this.arrived(v)));
    } else {
      for (const h of v.peekImgs) boing(this, h, 0.12);
      this.tweens.add({ targets: v.peekImgs, alpha: 0, duration: 300, delay: 300 });
      this.time.delayedCall(450, () => this.layHens(v));
      this.time.delayedCall(1350, () => this.arrived(v));
    }
  }

  private arrived(v: Visit) {
    if (this.leaving || this.cur !== v) return;
    this.layScene(v);
    this.layCards(v);
    this.time.delayedCall(350, () => this.beginChore(true));
  }

  /** What stays around the animal while she is cared for: the trough, the bucket, the mud, the wool pile. */
  private layScene(v: Visit) {
    const view = v.view;
    if (!view) return;
    const ps = this.room.ps;
    if (v.a.id === 'cow' || v.a.id === 'pig') {
      const f = view.at({ x: 170, y: 646 });
      this.trough = this.add.image(f.x, f.y, 'farm-trough').setScale(0.72 * ps).setDepth(7).setAlpha(0);
      this.tweens.add({ targets: this.trough, alpha: 1, duration: 300 });
      this.props.push(this.trough);
    }
    if (v.a.id === 'cow') {
      // easy: the bucket is under her already; hard: she puts it there
      if (this.level === 1) this.makeBucket(view);
    }
    if (v.a.id === 'pig') this.mud = (view as unknown as { mud: Phaser.GameObjects.Image[] }).mud;
  }

  private makeBucket(view: FarmAnimal) {
    const s = 0.5 * this.room.ps;
    const spot = view.at({ x: 520, y: 650 });
    const img = this.add.image(spot.x, spot.y, 'milk-bucket').setScale(s).setDepth(7);
    const full = this.add.image(spot.x, spot.y, 'milk-bucket-full').setScale(s).setDepth(7.1).setAlpha(0);
    this.bucket = { img, full, level: 0, spot, s };
    this.props.push(img, full);
  }

  /** The hens in the yard, each beside her nest (two rows where it is narrow). */
  private layHens(v: Visit) {
    const k = this.L.k;
    const y = this.room.yard;
    const n = T.eggs[this.level - 1];
    const w = y.x1 - y.x0;
    const cols = w / n >= 300 * k ? n : Math.ceil(n / 2);
    const rows = Math.ceil(n / cols);
    const cw = w / cols;
    const ch = (y.y1 - y.y0) / rows;
    const hs = Math.min(0.85 * k, (cw * 0.92) / 340, (ch * 0.9) / 330);
    const shy = this.level === 2 ? Phaser.Math.Between(0, n - 1) : -1;
    this.hens = Array.from({ length: n }, (_, i) => {
      const r = Math.floor(i / cols);
      const c = i % cols;
      const inRow = r === rows - 1 ? n - r * cols : cols;
      const x = y.x0 + (c + 0.5) * cw + (cols - inRow) * cw * 0.5;
      const ny = y.y0 + (r + 1) * ch - 50 * hs;
      const colour: 'white' | 'brown' = i % 2 === 0 ? 'white' : 'brown';
      const nest = this.add.image(x, ny, 'farm-nest').setScale(hs).setDepth(8 + r);
      const stand = { x: x + 40 * hs, y: ny + 20 * hs };
      const img = this.add.image(stand.x, stand.y, `hen-up-${colour}`).setOrigin(0.5, 0.95).setScale(0).setDepth(8.5 + r);
      this.tweens.add({ targets: img, scale: hs, duration: 320, delay: 90 * i, ease: 'Back.easeOut' });
      this.props.push(nest, img);
      return { img, nest, colour, at: { x, y: ny }, stand, sit: false, egg: null, eggColour: this.level === 2 ? colour : 'white', shy: i === shy, laid: false };
    });
    (v as unknown as { hs: number }).hs = hs;
    sfx(this, 'cluck', { minGapMs: 0 });
  }

  // ---------------------------------------------------------------- 2. the chores

  /** The chores' cards in a row above the animal, each a big tap target. */
  private layCards(v: Visit) {
    const k = this.L.k;
    const r = this.room;
    const s = 0.78 * k;
    const n = v.chores.length;
    const gap = 230 * k;
    const y = this.L.Y(140);
    this.cards = v.chores.map((c, i) => {
      const at = { x: Phaser.Math.Clamp(r.mid.x + (i - (n - 1) / 2) * gap, r.x0 + 100 * k, r.x1 - 100 * k), y };
      const glow = this.add.image(at.x, at.y, FX_SOFT).setTint(0xfff1a8).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0).setDepth(24);
      glow.setScale((320 * k) / glow.frame.realWidth);
      const disc = this.add.image(at.x, at.y, 'farm-card').setScale(0).setDepth(25);
      const icon = this.add.image(at.x, at.y, CHORES[c].icon).setScale(0).setDepth(26);
      const fit = (240 * s * 0.66) / Math.max(icon.width, icon.height);
      this.tweens.add({ targets: disc, scale: s, duration: 320, delay: 110 * i, ease: 'Back.easeOut' });
      this.tweens.add({ targets: icon, scale: fit, duration: 320, delay: 110 * i, ease: 'Back.easeOut' });
      let badge: Phaser.GameObjects.Image | null = null;
      if (v.done[i]) {
        disc.setAlpha(0.6);
        icon.setAlpha(0.6);
        badge = this.add.image(at.x + 64 * k, at.y + 60 * k, 'farm-done').setScale(0.7 * k).setDepth(27);
      }
      return { disc, icon, glow, badge, at };
    });
    sfx(this, 'pop', { volume: 0.5 });
  }

  private hideCards() {
    for (const c of this.cards) {
      const all = [c.disc, c.icon, c.glow, ...(c.badge ? [c.badge] : [])];
      this.tweens.killTweensOf(all);
      this.tweens.add({ targets: all, alpha: 0, duration: 240, onComplete: () => all.forEach((o) => o.destroy()) });
    }
    this.cards = [];
  }

  /** Can this chore be done now? (What has to come first: hay before milking, shearing before the wool.) */
  private available(i: number) {
    const v = this.cur!;
    if (v.done[i]) return false;
    const after = CHORES[v.chores[i]].after;
    if (!after) return true;
    const j = v.chores.indexOf(after);
    return j < 0 || v.done[j];
  }

  private nextChore() {
    const v = this.cur;
    if (!v) return -1;
    return v.chores.findIndex((_, i) => this.available(i));
  }

  private beginChore(first: boolean) {
    const v = this.cur;
    if (!v || this.leaving) return;
    const i = this.nextChore();
    if (i < 0) return;
    let line: VoiceKey | null = null;
    if (this.level === 1) {
      this.cards.forEach((c, j) => this.tweens.add({ targets: c.glow, alpha: j === i ? 0.9 : 0, duration: 260 }));
      const c = this.cards[i];
      this.tweens.add({ targets: [c.disc, c.icon], y: c.at.y - 24 * this.L.k, duration: 180, yoyo: true, repeat: 1, ease: 'Quad.easeOut' });
      const st = CHORES[v.chores[i]].stages[0][0];
      line = STAGE_LINE[st];
      this.said.add(st);
    } else line = first ? 'vo-farm-what-first' : null;
    this.begin('chore', line);
  }

  private tapCard(i: number) {
    const v = this.cur!;
    const c = this.cards[i];
    if (v.done[i]) {
      boing(this, c.disc, 0.12);
      sfx(this, 'tap', { volume: 0.5 });
      return;
    }
    const ok = this.level === 1 ? i === this.nextChore() : this.available(i);
    if (!ok) {
      // what comes first comes first: the card hops back
      this.shown.wrong = (this.shown.wrong as number) + 1;
      this.tweens.add({ targets: [c.disc, c.icon], y: c.at.y - 30 * this.L.k, duration: 140, yoyo: true, ease: 'Quad.easeOut' });
      sfx(this, 'squish', { volume: 0.6 });
      this.say('vo-farm-first-hmm', { ttlMs: 3000 });
      this.miss();
      if (this.level === 2) {
        const j = this.nextChore();
        if (j >= 0) this.tweens.add({ targets: this.cards[j].glow, alpha: { from: 0.9, to: 0 }, duration: 1400 });
      }
      return;
    }
    this.startChore(i);
  }

  private startChore(i: number) {
    const v = this.cur!;
    const k = this.L.k;
    this.setPhase('intro');
    this.ci = i;
    const c = this.cards[i];
    sfx(this, 'pop');
    boing(this, c.disc, 0.15);
    stars(this, c.at.x, c.at.y, 6, 34 * k);
    this.hideCards();
    this.stages = CHORES[v.chores[i]].stages[this.level - 1];
    this.si = 0;
    this.shown.chore = v.chores[i];
    this.time.delayedCall(350, () => !this.leaving && this.cur === v && this.startStage());
  }

  private choreDone() {
    const v = this.cur!;
    const k = this.L.k;
    v.done[this.ci] = true;
    this.shown.chores = (this.shown.chores as number) + 1;
    this.setPhase('intro');
    if (v.done.every(Boolean)) return this.time.delayedCall(400, () => this.allDone(v));
    this.time.delayedCall(300, () => {
      if (this.leaving || this.cur !== v) return;
      sfx(this, 'sparkle', { minGapMs: 0 });
      const head = this.headOf(v);
      stars(this, head.x, head.y, 8, 44 * k);
      v.view?.react('love');
      this.mom?.happy();
      this.time.delayedCall(800, () => this.mom?.rest());
      this.say('vo-farm-more', { ttlMs: 4000 });
      this.time.delayedCall(500, () => {
        if (this.leaving || this.cur !== v) return;
        this.layCards(v);
        this.time.delayedCall(500, () => this.beginChore(false));
      });
    });
  }

  private headOf(v: Visit): P {
    if (v.view) return v.view.at({ x: 180, y: 160 });
    return { x: this.room.mid.x, y: this.room.yard.y0 };
  }

  // ---------------------------------------------------------------- 3. a stage: the tray, the job

  private startStage() {
    const st = this.stages[this.si];
    this.shown.stage = st;
    this.job = this.makeJob(st);
    this.layTray(this.job);
    const line = this.said.has(st) ? null : STAGE_LINE[st];
    this.said.add(st);
    this.time.delayedCall(300, () => {
      if (this.leaving || !this.job || this.job.stage !== st) return;
      this.begin('work', line);
      this.afterBegin(st);
    });
  }

  /** Lines that follow a stage's own (hard level): the arrows, the copy. */
  private afterBegin(st: StageId) {
    if (this.level !== 2) return;
    if (st === 'shear') this.say('vo-sheep-arrows', { ttlMs: 6000 });
  }

  private stageDone() {
    const v = this.cur;
    if (!v || this.phase !== 'work') return;
    this.setPhase('intro');
    this.dropHeld();
    this.job?.end?.();
    this.job = null;
    this.freeOn = false;
    this.clearTray();
    this.mom?.happy();
    this.time.delayedCall(700, () => this.mom?.rest());
    this.si++;
    if (this.si < this.stages.length) return this.time.delayedCall(700, () => !this.leaving && this.cur === v && this.startStage());
    this.time.delayedCall(400, () => !this.leaving && this.cur === v && this.choreDone());
  }

  /** The tray in the left column (above the cart): what this stage needs, and on the hard level a spare tool. */
  private layTray(job: Job) {
    const S = this.S;
    const k = this.L.k;
    const specs = job.slots.map((s) => ({ ...s, decoy: false }));
    if (this.level === 2 && specs.some((s) => s.role === 'tool') && T.decoys[1] > 0) {
      const spare = Phaser.Utils.Array.GetRandom(SPARE_TOOLS.filter((t) => !specs.some((s) => s.key === t)));
      specs.splice(Phaser.Math.Between(0, specs.length), 0, { key: spare, role: 'tool', decoy: true });
    }
    const sc = S.binScale(6);
    this.tray = specs.map((s, i) => {
      const at = S.bin(i, 6);
      const glow = this.add.image(at.x, at.y, FX_SOFT).setTint(0xfff1a8).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0).setDepth(21);
      glow.setScale((240 * sc * 1.3) / glow.frame.realWidth);
      const img = this.add.image(at.x, at.y, s.key).setScale(0).setDepth(22);
      const homeScale = (240 * sc * 0.92) / Math.max(img.width, img.height) * (s.key === 'farm-pump' ? 1.5 : 1);
      this.tweens.add({ targets: img, scale: homeScale, duration: 300, delay: 80 * i, ease: 'Back.easeOut' });
      return { key: s.key, role: s.role, decoy: s.decoy, img, glow, home: at, homeScale, away: false };
    });
    if (this.tray.length) sfx(this, 'whoosh', { volume: 0.4 });
    // easy: what to pick up glows (not the pump: it is tapped where it stands)
    if (this.level === 1) for (const s of this.tray) if (s.role !== 'fixed' || s.key === 'farm-pump') this.tweens.add({ targets: s.glow, alpha: 0.8, duration: 300, delay: 300 });
    void k;
  }

  private clearTray() {
    for (const s of this.tray) {
      if (s.away && !s.img.active) continue;
      this.tweens.killTweensOf([s.img, s.glow]);
      this.tweens.add({ targets: [s.img, s.glow], scale: 0, alpha: 0, duration: 240, onComplete: () => (s.img.destroy(), s.glow.destroy()) });
    }
    this.tray = [];
  }

  private slotOf(key: string) {
    return this.tray.find((s) => s.key === key && !s.away) ?? null;
  }

  private hitSlot(at: P) {
    const k = this.L.k;
    return this.tray.find((s) => !s.away && this.near(at, s.home, Math.max(115 * k, 125 * s.homeScale * (Math.max(s.img.width, s.img.height) / 240)))) ?? null;
  }

  // ---------------------------------------------------------------- holding things

  /** The working point of a tool (its art's tip), else the thing's middle; in image pixels from its centre. */
  private tipArt(key: string): P {
    const t = A.tip as Record<string, P>;
    const name = key === 'tool-toothbrush' ? 'toothbrush' : key === 'grain-scoop' ? 'scoop' : key.replace('farm-', '');
    const tp = t[name];
    if (!tp) return { x: 0, y: 0 };
    return { x: tp.x - 120, y: tp.y - 120 };
  }

  /** Where the working point goes for a finger at `f`: a little above it, so the finger doesn't hide it. */
  private fingerTip(f: P, role: Role): P {
    const k = this.L.k;
    return role === 'tool' ? { x: f.x - 26 * k, y: f.y - 66 * k } : { x: f.x, y: f.y - 50 * k };
  }

  private heldScale(key: string, role: Role) {
    const k = this.L.k;
    if (role === 'tool') return key === 'tool-toothbrush' ? 1.1 * k : this.room.toolS;
    const img = this.textures.getFrame(key);
    const big = Math.max(img?.realWidth ?? 200, img?.realHeight ?? 200);
    return Math.min(0.85 * k, (190 * k) / big) * (key === 'milk-bucket-full' || key === 'milk-bucket' ? 1.4 : 1);
  }

  private pickUp(img: Phaser.GameObjects.Image, key: string, role: Role, slot: Slot | null, at: P, scale: number, back?: P, backScale?: number) {
    this.tweens.killTweensOf(img);
    img.setDepth(600).setScale(scale).setAngle(0);
    const ta = this.tipArt(key);
    const tip = { x: ta.x * scale, y: ta.y * scale };
    const tp = this.fingerTip(at, role);
    img.setPosition(tp.x - tip.x, tp.y - tip.y);
    boing(this, img, 0.08);
    sfx(this, 'tap', { volume: 0.7 });
    for (const s of this.tray) this.tweens.add({ targets: s.glow, alpha: 0, duration: 200 });
    this.held = { img, key, slot, role, tip, from: at, moved: 0, last: tp, t0: this.time.now, back, backScale };
  }

  private tipOf(h: Held): P {
    return { x: h.img.x + h.tip.x, y: h.img.y + h.tip.y };
  }

  /** The held thing goes back where it came from (a copy floats back to its slot and goes). */
  private putBack(h: Held) {
    const img = h.img;
    this.tweens.killTweensOf(img);
    img.setAngle(0);
    if (h.role === 'source') {
      const s = h.slot;
      this.tweens.add({ targets: img, x: s?.home.x ?? img.x, y: s?.home.y ?? img.y, scale: 0, alpha: 0.3, duration: 360, ease: 'Sine.easeIn', onComplete: () => img.destroy() });
      return;
    }
    const to = h.back ?? h.slot?.home ?? { x: img.x, y: img.y };
    const sc = h.backScale ?? h.slot?.homeScale ?? img.scale;
    img.setDepth(h.back ? 9 : 22);
    this.tweens.add({ targets: img, x: to.x, y: to.y, scale: sc, duration: 360, ease: 'Back.easeOut' });
  }

  private dropHeld() {
    const h = this.held;
    if (!h) return;
    this.held = null;
    this.owner = null;
    if (h.img.active) this.putBack(h);
  }

  /** A spare tool: it hops back; Mom says it is not that one. */
  private wrongTool(s: Slot) {
    this.shown.wrong = (this.shown.wrong as number) + 1;
    this.tweens.add({ targets: s.img, y: s.home.y - 30 * this.L.k, duration: 140, yoyo: true, ease: 'Quad.easeOut' });
    boing(this, s.img, 0.15);
    sfx(this, 'squish', { volume: 0.6 });
    this.say('vo-farm-not-that', { ttlMs: 3000 });
    this.miss();
  }

  /** The animal wobbles once (a sideways stroke, the wrong way round): nothing lost. */
  private wobble(o: Phaser.GameObjects.Components.Transform & Phaser.GameObjects.GameObject) {
    if (this.tweens.isTweening(o)) return;
    this.tweens.add({ targets: o, angle: { from: -3, to: 3 }, duration: 90, yoyo: true, repeat: 1, ease: 'Sine.easeInOut', onComplete: () => (o as unknown as Phaser.GameObjects.Image).setAngle(0) });
    sfx(this, 'squish', { volume: 0.5 });
  }

  /** A thing flies to a point, then `then`. */
  private flyTo(img: Phaser.GameObjects.Image, to: P, scale: number, ms: number, then: () => void) {
    this.tweens.killTweensOf(img);
    this.tweens.add({ targets: img, x: to.x, y: to.y, scale, angle: 0, duration: ms, ease: 'Sine.easeInOut', onComplete: then });
  }

  // ---------------------------------------------------------------- the jobs

  private makeJob(st: StageId): Job {
    switch (st) {
      case 'feed':
        return this.giveJob(st, ['farm-carrot', 'farm-apple'], T.horseFeed[this.level - 1], 'mouth', this.level === 2);
      case 'pigfeed':
        return this.giveJob(st, ['farm-corn', 'farm-apple'], T.pigFeed[this.level - 1], 'trough', this.level === 2);
      case 'hay':
        return this.giveJob(st, ['hay-bale'], T.cowHay[this.level - 1], 'trough', false);
      case 'bell':
        return this.placeJob(st, ['cow-bell'], () => this.cur!.view!.at(A.bellAt), (img) => {
          const view = this.cur!.view!;
          const bell = view.put('cow-bell', { x: A.bellAt.x, y: A.bellAt.y + (80 - A.bellLoop.y) * 0.55 }, 0.55);
          img.destroy();
          boing(this, bell, 0.2);
          sfx(this, 'cow-bell', { minGapMs: 0 });
        });
      case 'bucket':
        return this.placeJob(st, ['milk-bucket'], () => this.cur!.view!.at({ x: 520, y: 650 }), (img) => {
          img.destroy();
          this.makeBucket(this.cur!.view!);
          boing(this, this.bucket!.img, 0.15);
          sfx(this, 'tap', { minGapMs: 0 });
        });
      case 'ribbon':
        return this.ribbonJob();
      case 'brush':
        return this.brushJob();
      case 'teeth':
        return this.teethJob();
      case 'milk':
        return this.milkJob();
      case 'pour':
        return this.pourJob();
      case 'shear':
        return this.shearJob();
      case 'wind':
        return this.windJob();
      case 'grain':
        return this.grainJob();
      case 'eggs':
        return this.eggsJob();
      case 'chick':
        return this.chickJob();
      case 'mud':
        return this.mudJob();
      case 'soap':
        return this.soapJob();
      case 'rinse':
        return this.rinseJob();
    }
  }

  /** A drag from a slot to a point (Mom's hand, the harness). */
  private dragPlan(from: Slot | null, fromAt: P, to: P[], key: string, role: Role, holdMs = 0): Plan {
    const sc = this.heldScale(key, role);
    const ta = this.tipArt(key);
    // (the hand holds the finger's point: the tool's tip is above it)
    const off = role === 'tool' ? { x: 26 * this.L.k, y: 66 * this.L.k } : { x: 0, y: 50 * this.L.k };
    const keys: HandKey[] = [];
    let t = 0;
    const start = from ? from.home : fromAt;
    keys.push({ x: start.x, y: start.y, t });
    keys.push({ x: start.x, y: start.y, t: (t += 300) });
    let last = start;
    for (const p of to) {
      const q = { x: p.x + off.x, y: p.y + off.y };
      const d = Math.hypot(q.x - last.x, q.y - last.y);
      t += Math.max(60, Math.min(900, d * 1.1));
      keys.push({ ...q, t });
      last = q;
    }
    if (holdMs) keys.push({ ...last, t: (t += holdMs) });
    keys.push({ ...last, t: t + 300 });
    return { keys, prop: { key, scale: sc, dx: -ta.x * sc - off.x, dy: -ta.y * sc - off.y, alpha: 0.6 } };
  }

  /** Food or hay to the animal (to her mouth or to the trough): `n` pieces; hard, what she wants shows in a bubble. */
  private giveJob(st: StageId, items: ImageKey[], n: number, to: 'mouth' | 'trough', wish: boolean): Job {
    const v = this.cur!;
    const view = v.view!;
    const k = this.L.k;
    let count = 0;
    let wanted: ImageKey | null = null;
    const target = () => (to === 'mouth' ? view.mouthAt : { x: this.trough!.x, y: this.trough!.y - 20 * k });
    const reach = 190 * k;
    const ask = () => {
      if (!wish || count >= n) return;
      wanted = Phaser.Utils.Array.GetRandom(items);
      const shown = view.showWish([wanted], [wanted], { maxRight: this.room.x1, minLeft: this.room.x0, k });
      if (!shown) wanted = null;
      else view.rememberWish(T.rememberMs, T.peekMs);
    };
    const nameOf = (key: string): VoiceKey => (key === 'farm-carrot' ? 'name-carrot' : key === 'farm-corn' ? 'name-corn' : 'name-apple');
    const eat = (img: Phaser.GameObjects.Image, key: string) => {
      count++;
      this.poke();
      if (to === 'mouth') {
        this.tweens.add({ targets: img, scale: 0, alpha: 0, duration: 260, onComplete: () => img.destroy() });
      } else {
        // it lies in the trough (hay: a heap that grows)
        const tr = this.trough!;
        const pileKey = key === 'hay-bale' ? 'hay-pile' : key;
        const s = key === 'hay-bale' ? tr.scale * (0.62 + 0.12 * count) : img.scale * 0.6;
        const at = { x: tr.x + Phaser.Math.Between(-60, 60) * tr.scale * (key === 'hay-bale' ? 0 : 1), y: tr.y - 40 * tr.scale };
        this.flyTo(img, at, s, 180, () => {
          if (key === 'hay-bale') {
            img.setTexture(pileKey).setScale(s * 0.9);
            img.setDepth(7.2);
            this.props.push(img);
          } else {
            img.setDepth(7.2);
            this.tweens.add({ targets: img, scale: 0, alpha: 0, duration: 400, delay: 700, onComplete: () => img.destroy() });
          }
        });
      }
      view.setMood('chew');
      sfx(this, 'munch', { minGapMs: 0 });
      let c = 0;
      this.time.addEvent({ delay: 150, repeat: 5, callback: () => view.chewFrame(++c % 2 === 0) });
      if (to === 'trough') this.tweens.add({ targets: view.box, y: view.rest.y + 10 * view.scale, duration: 220, yoyo: true, repeat: 1 });
      const granted = wish && wanted === key;
      if (granted) {
        wanted = null;
        this.time.delayedCall(950, () => (view.setMood('rest'), view.wishGranted()));
      } else this.time.delayedCall(950, () => view.mood === 'chew' && view.setMood('rest'));
      if (key === 'hay-bale') this.time.delayedCall(500, () => sfx(this, 'moo', { minGapMs: 0, volume: 0.6 }));
      if (count >= n) return this.time.delayedCall(granted ? 1900 : 1200, () => this.stageDone());
      this.time.delayedCall(granted ? 2100 : 900, ask);
    };
    const refuse = (h: Held) => {
      // not what she wants just now: a sniff, it floats back; Mom says what she wants
      this.shown.wrong = (this.shown.wrong as number) + 1;
      view.setMood('rest');
      boing(this, view.box, 0.05);
      sfx(this, 'squish', { volume: 0.5 });
      this.putBack(h);
      this.say(to === 'mouth' ? 'vo-horse-wants' : 'vo-pig-wants', { ttlMs: 3000 });
      if (wanted) this.say(nameOf(wanted), { ttlMs: 5000, group: 'name' });
      view.peekWish();
      this.miss();
    };
    this.time.delayedCall(1600, ask);
    return {
      stage: st,
      slots: items.map((key) => ({ key, role: 'source' as Role })),
      drag: (tp) => {
        if (to !== 'mouth' || view.mood === 'chew') return;
        const near = this.near(tp, target(), reach * 1.3);
        if (near && view.mood === 'rest') view.setMood('expect');
        else if (!near && view.mood === 'expect') view.setMood('rest');
      },
      release: (h, tp, tapped) => {
        const tg = target();
        if (!(tapped || this.near(tp, tg, reach))) return false;
        if (count >= n) return false;
        this.held = null;
        const go = () => {
          if (wish && wanted && h.key !== wanted) return refuse(h);
          eat(h.img, h.key);
        };
        if (tapped) {
          if (to === 'mouth') view.setMood('expect');
          this.flyTo(h.img, tg, h.img.scale, 380, go);
        } else go();
        return true;
      },
      plan: () => {
        const key = wanted ?? items[0];
        const s = this.slotOf(key);
        return s ? this.dragPlan(s, s.home, [target()], key, 'source') : null;
      },
      end: () => view.hideWish(),
    };
  }

  /** A thing put on the animal or under her (the bell on her collar, the bucket under her). */
  private placeJob(st: StageId, items: ImageKey[], target: () => P, onLand: (img: Phaser.GameObjects.Image) => void): Job {
    const reach = 190 * this.L.k;
    return {
      stage: st,
      slots: items.map((key) => ({ key, role: 'thing' as Role })),
      release: (h, tp, tapped) => {
        const tg = target();
        if (!(tapped || this.near(tp, tg, reach))) return false;
        this.held = null;
        if (h.slot) h.slot.away = true;
        this.poke();
        this.flyTo(h.img, tg, h.img.scale, tapped ? 380 : 160, () => {
          onLand(h.img);
          stars(this, tg.x, tg.y, 6, 34 * this.L.k);
          this.time.delayedCall(700, () => this.stageDone());
        });
        return true;
      },
      plan: () => {
        const s = this.tray.find((q) => !q.away && !q.decoy);
        return s ? this.dragPlan(s, s.home, [target()], s.key, 'thing') : null;
      },
    };
  }

  /** Hard: a ribbon for the sheep, the colour of Mom's picture (another colour bounces back gently). */
  private ribbonJob(): Job {
    const view = this.cur!.view!;
    const k = this.L.k;
    const colours: ImageKey[] = ['sheep-ribbon-red', 'sheep-ribbon-blue', 'sheep-ribbon-yellow'];
    const model = Phaser.Utils.Array.GetRandom(colours);
    // Mom's little picture, top right of the field
    const at = { x: this.room.x1 - 110 * k, y: this.L.Y(150) };
    const card = this.add.image(at.x, at.y, 'farm-card').setScale(0).setDepth(25);
    const pic = this.add.image(at.x, at.y, model).setScale(0).setDepth(26);
    this.tweens.add({ targets: card, scale: 0.72 * k, duration: 300, ease: 'Back.easeOut' });
    this.tweens.add({ targets: pic, scale: 0.72 * k * 0.75, duration: 300, ease: 'Back.easeOut' });
    this.time.delayedCall(2600, () => this.job?.stage === 'ribbon' && this.say('vo-sheep-ribbon-copy', { ttlMs: 5000 }));
    const target = () => view.at(A.ribbonAt);
    const reach = 190 * k;
    return {
      stage: 'ribbon',
      slots: Phaser.Utils.Array.Shuffle([...colours]).map((key) => ({ key, role: 'thing' as Role })),
      release: (h, tp, tapped) => {
        const tg = target();
        if (!(tapped || this.near(tp, tg, reach))) return false;
        this.held = null;
        if (h.key !== model) {
          this.shown.wrong = (this.shown.wrong as number) + 1;
          this.flyTo(h.img, tg, h.img.scale, tapped ? 300 : 120, () => {
            boing(this, view.box, 0.04);
            this.putBack(h);
            this.say('vo-sheep-ribbon-copy', { ttlMs: 3000 });
            boing(this, card, 0.15);
            this.miss();
          });
          return true;
        }
        if (h.slot) h.slot.away = true;
        this.poke();
        this.flyTo(h.img, tg, h.img.scale, tapped ? 380 : 160, () => {
          h.img.destroy();
          const r = view.put(model, A.ribbonAt, 0.6);
          boing(this, r, 0.2);
          sfx(this, 'sparkle', { minGapMs: 0 });
          stars(this, tg.x, tg.y, 8, 34 * k);
          view.react('love');
          this.time.delayedCall(900, () => this.stageDone());
        });
        return true;
      },
      plan: () => {
        const s = this.slotOf(model);
        return s ? this.dragPlan(s, s.home, [target()], s.key, 'thing') : null;
      },
      end: () => this.tweens.add({ targets: [card, pic], alpha: 0, duration: 300, onComplete: () => (card.destroy(), pic.destroy()) }),
    };
  }

  /**
   * Rubbing with a tool over places (the coat, the teeth, the mud, the soap): each place takes `need` of finger
   * travel. `ordered`: one place at a time, glowing (the horse's three zones on the hard level).
   */
  private rubJob(o: {
    stage: StageId;
    tool: ImageKey;
    spots: { at: () => P; hit: (tp: P) => boolean; need: number; hp: number; done: boolean; glow?: Phaser.GameObjects.Image }[];
    ordered?: boolean;
    /** A stroke counts: true, it is neutral: null, it goes the wrong way: false. */
    dir?: (dx: number, dy: number) => boolean | null;
    onRub: (i: number, tp: P, dist: number) => void;
    onDone: (i: number) => void;
    enough?: () => boolean;
    stroke: (c: P) => P[];
    wobbleOf: () => Phaser.GameObjects.Components.Transform & Phaser.GameObjects.GameObject;
    end?: () => void;
  }): Job {
    const k = this.L.k;
    let wrong = 0;
    const open = () => o.spots.findIndex((s) => !s.done);
    const showGlow = () => {
      if (!o.ordered) return;
      const i = open();
      o.spots.forEach((s, j) => s.glow && this.tweens.add({ targets: s.glow, alpha: j === i ? 0.7 : 0, duration: 250 }));
    };
    showGlow();
    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      for (const s of o.spots) if (s.glow) this.tweens.add({ targets: s.glow, alpha: 0, duration: 250 });
      this.time.delayedCall(500, () => this.stageDone());
    };
    return {
      stage: o.stage,
      slots: [{ key: o.tool, role: 'tool' }],
      drag: (tp, dist, dx, dy) => {
        if (finished || !this.held || this.held.key !== o.tool) return;
        const cand = o.ordered ? [open()].filter((i) => i >= 0) : o.spots.map((_, i) => i).filter((i) => !o.spots[i].done);
        const i = cand.find((j) => o.spots[j].hit(tp));
        if (i === undefined) return;
        const ok = o.dir ? o.dir(dx, dy) : true;
        if (ok === false) {
          wrong += dist;
          if (wrong > 120 * k) {
            wrong = -1e9;
            this.wobble(o.wobbleOf());
            this.miss();
          }
          return;
        }
        if (ok === null) return;
        const s = o.spots[i];
        s.hp += dist;
        this.poke();
        o.onRub(i, tp, dist);
        if (s.hp >= s.need) {
          s.done = true;
          o.onDone(i);
          showGlow();
          if (o.enough ? o.enough() : o.spots.every((q) => q.done)) finish();
        } else if (o.enough?.()) finish();
      },
      release: () => {
        wrong = 0;
        return false;
      },
      plan: () => {
        const i = open();
        const s = this.slotOf(o.tool);
        if (i < 0 || !s) return null;
        const pts = o.stroke(o.spots[i].at());
        return this.dragPlan(s, s.home, pts, o.tool, 'tool');
      },
      end: () => {
        for (const s of o.spots) s.glow?.destroy();
        o.end?.();
      },
    };
  }

  /** A zigzag over a point, long enough for `len` of travel. */
  private zigzag(c: P, w: number, h: number, len: number): P[] {
    const pts: P[] = [c];
    let d = 0;
    let i = 0;
    while (d < len) {
      const p = { x: c.x + (i % 2 ? w : -w) / 2, y: c.y + ((i % 4) - 1.5) * (h / 4) };
      d += Math.hypot(p.x - pts[pts.length - 1].x, p.y - pts[pts.length - 1].y);
      pts.push(p);
      i++;
    }
    return pts;
  }

  private glowAt(p: P, r: number) {
    const g = this.add.image(p.x, p.y, FX_SOFT).setTint(0xfff1a8).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0).setDepth(9);
    g.setScale((r * 2.2) / g.frame.realWidth);
    return g;
  }

  /** Brushing the horse: dust puffs off, the coat shines (hard: three zones in turn). */
  private brushJob(): Job {
    const view = this.cur!.view!;
    const k = this.L.k;
    const ps = view.scale;
    const shine = view.put('horse-shine', A.shine).setAlpha(0);
    this.props.push(shine);
    const zones = this.level === 1 ? [{ p: A.shine, r: 260 }] : A.horseZones.map((p) => ({ p, r: 130 }));
    const need = T.brushRub * k;
    const spots = zones.map((z) => {
      const at = () => view.at(z.p);
      return { at, hit: (tp: P) => this.near(tp, at(), Math.max(z.r * ps, 110 * k)), need, hp: 0, done: false, glow: this.level === 2 ? this.glowAt(at(), z.r * ps) : undefined };
    });
    const total = need * spots.length;
    return this.rubJob({
      stage: 'brush',
      tool: 'farm-brush',
      spots,
      ordered: this.level === 2,
      onRub: (_i, tp) => {
        shine.setAlpha(Math.min(1, spots.reduce((a, s) => a + Math.min(s.hp, s.need), 0) / total));
        if (Math.random() < 0.25) puff(this, tp.x, tp.y + 20 * k, 0xc9a27a, 2, 46 * k);
        sfx(this, 'brush', { minGapMs: 260, volume: 0.6 });
      },
      onDone: (i) => {
        const p = spots[i].at();
        stars(this, p.x, p.y, 6, 32 * k);
        sfx(this, 'sparkle', { minGapMs: 0, volume: 0.6 });
        if (spots.every((s) => s.done)) {
          sfx(this, 'neigh', { minGapMs: 0, volume: 0.7 });
          view.react('love');
        }
      },
      stroke: (c) => this.zigzag(c, 180 * k, 90 * k, need * 1.15),
      wobbleOf: () => view.box,
    });
  }

  /** Hard: the horse's teeth, big in a close-up; a smudge on each of four, brushed off. */
  private teethJob(): Job {
    const view = this.cur!.view!;
    const k = this.L.k;
    const r = this.room;
    const zs = Math.min(0.9 * k, (r.x1 - r.x0) / 600, (this.L.Y(960) - this.L.Y(250)) / 600);
    const at = { x: r.mid.x, y: this.L.Y(250) + 300 * zs };
    const teeth = new Phaser.GameObjects.Image(this, 0, 0, 'horse-teeth').setScale(rs('horse-teeth', 1));
    const ring = new Phaser.GameObjects.Image(this, 0, 0, 'lens-ring').setScale(rs('lens-ring', 1));
    const smudges = A.teeth.slice(0, T.teeth).map((p) => new Phaser.GameObjects.Image(this, p.x - 260, p.y - 260, 'farm-smudge').setScale(0.9).setAngle(Phaser.Math.Between(-20, 20)));
    const from = view.mouthAt;
    const box = this.add.container(from.x, from.y, [teeth, ...smudges, ring]).setDepth(30).setScale(0.05);
    this.tweens.add({ targets: box, x: at.x, y: at.y, scale: zs, duration: 420, ease: 'Back.easeOut' });
    view.setMood('expect');
    const world = (p: P) => ({ x: box.x + (p.x - 260) * box.scale, y: box.y + (p.y - 260) * box.scale });
    const spots = A.teeth.slice(0, T.teeth).map((p) => ({ at: () => world(p), hit: (tp: P) => this.near(tp, world(p), Math.max(60 * zs, 70 * k)), need: T.teethRub * k, hp: 0, done: false }));
    return this.rubJob({
      stage: 'teeth',
      tool: 'tool-toothbrush',
      spots,
      onRub: (i, tp) => {
        smudges[i].setAlpha(Math.max(0, 1 - spots[i].hp / spots[i].need));
        if (Math.random() < 0.3) burst(this, tp.x, tp.y, { texture: 'bubble', count: 2, size: 34 * k, speed: 120, gravityY: -160, lifespan: 700, depth: 40 });
        sfx(this, 'brush', { minGapMs: 260, volume: 0.6 });
      },
      onDone: (i) => {
        const p = spots[i].at();
        smudges[i].setVisible(false);
        stars(this, p.x, p.y, 5, 30 * k);
        sfx(this, 'sparkle', { minGapMs: 0, volume: 0.6 });
      },
      stroke: (c) => this.zigzag(c, 120 * k, 50 * k, T.teethRub * k * 1.2),
      wobbleOf: () => box,
      end: () => {
        view.setMood('happy');
        this.time.delayedCall(700, () => view.mood === 'happy' && view.setMood('rest'));
        this.tweens.add({ targets: box, x: from.x, y: from.y, scale: 0.05, alpha: 0, duration: 320, ease: 'Quad.easeIn', onComplete: () => box.destroy() });
      },
    });
  }

  /** Milking: a squeeze on the teat (a tap; hard: the two in turn), a squirt into the bucket, it fills. */
  private milkJob(): Job {
    const view = this.cur!.view!;
    const k = this.L.k;
    const n = T.squeezes[this.level - 1];
    let count = 0;
    let next = 0;
    let otherSaid = false;
    const teat = (i: number) => view.at(A.teats[i]);
    const glows = A.teats.map((p) => this.glowAt(view.at(p), 70 * view.scale));
    const showNext = () => this.level === 2 && glows.forEach((g, i) => this.tweens.add({ targets: g, alpha: i === next ? 0.85 : 0, duration: 200 }));
    showNext();
    if (this.level === 1) glows.forEach((g) => this.tweens.add({ targets: g, alpha: 0.6, duration: 300 }));
    const squirt = (i: number) => {
      const b = this.bucket!;
      const from = teat(i);
      const to = { x: b.img.x + (i ? 14 : -14) * k, y: b.img.y - 80 * b.s };
      const line = this.add.line(0, 0, from.x, from.y + 10 * k, to.x, to.y, 0xfffdf5).setOrigin(0, 0).setLineWidth(9 * k).setDepth(7.05).setAlpha(0.95);
      this.tweens.add({ targets: line, alpha: 0, duration: 380, onComplete: () => line.destroy() });
      burst(this, to.x, to.y, { count: 4, tint: 0xffffff, size: 16 * k, speed: 120, gravityY: 400, lifespan: 400, depth: 7.2 });
      sfx(this, 'milk-squirt', { minGapMs: 0 });
      boing(this, view.box, 0.02);
    };
    return {
      stage: 'milk',
      slots: [],
      press: (at) => {
        // the teats sit close together (on 4:3 their touch areas overlap): a touch that reaches the one that is due counts
        // for it; otherwise the nearer one
        const reach = Math.max(130 * k, 90 * view.scale);
        const hits = [0, 1].filter((j) => this.near(at, teat(j), reach));
        if (!hits.length || count >= n) return false;
        const d = (j: number) => Phaser.Math.Distance.BetweenPoints(at, teat(j));
        const due = this.level === 2 ? next : count % 2;
        const i = hits.includes(due) ? due : hits.sort((a, b) => d(a) - d(b))[0];
        if (this.level === 2 && i !== next) {
          boing(this, glows[next], 0.3);
          sfx(this, 'tap', { volume: 0.5 });
          if (!otherSaid) {
            otherSaid = true;
            this.say('vo-cow-other', { ttlMs: 3000 });
          }
          this.miss();
          return true;
        }
        count++;
        this.poke();
        squirt(i);
        next = 1 - next;
        showNext();
        const b = this.bucket!;
        b.level = count / n;
        b.full.setAlpha(b.level);
        if (count === Math.ceil(n / 2) && this.level === 2) this.say('vo-cow-other', { ttlMs: 2500 });
        if (count >= n) {
          sfx(this, 'moo', { minGapMs: 0, volume: 0.7 });
          stars(this, b.img.x, b.img.y - 60 * b.s, 8, 34 * k);
          this.time.delayedCall(700, () => this.stageDone());
        }
        return true;
      },
      plan: () => ({ tap: teat(this.level === 2 ? next : count % 2) }),
      end: () => glows.forEach((g) => g.destroy()),
    };
  }

  /** Hard: the bucket over the bottles: it tips, the milk pours, each bottle fills from the bottom. */
  private pourJob(): Job {
    const k = this.L.k;
    const S = this.S;
    const b = this.bucket!;
    const sc = S.binScale(6);
    this.bottles = [0, 1].map((i) => {
      const at = S.bin(i, 6);
      const s = (240 * sc * 0.92) / 260;
      const img = this.add.image(at.x, at.y, 'milk-bottle-empty').setScale(s).setDepth(22);
      const full = this.add.image(at.x, at.y, 'milk-bottle-full').setScale(s).setDepth(22.1);
      full.setCrop(0, 260, 140, 0);
      this.props.push(img, full);
      return { img, full, level: 0 };
    });
    let pouring = -1;
    const mouth = () => (this.held ? { x: this.held.img.x - 110 * this.held.img.scale, y: this.held.img.y - 80 * this.held.img.scale } : { x: b.img.x, y: b.img.y });
    const over = (p: P) => this.bottles.findIndex((q) => q.level < 1 && Math.abs(p.x - q.img.x) < 110 * k && p.y < q.img.y && p.y > q.img.y - 330 * q.img.scale);
    return {
      stage: 'pour',
      slots: [],
      press: (at) => {
        if (!this.near(at, b.img, 140 * k)) return false;
        b.full.setVisible(false);
        b.img.setTexture('milk-bucket-full');
        this.pickUp(b.img, 'milk-bucket-full', 'thing', null, at, b.s * 1.1, b.spot, b.s);
        return 'own';
      },
      drag: () => {
        const i = over(mouth());
        if (i !== pouring) {
          pouring = i;
          this.tweens.add({ targets: this.held?.img, angle: i >= 0 ? -38 : 0, duration: 200 });
        }
      },
      tick: (delta) => {
        if (!this.held || pouring < 0) return;
        const q = this.bottles[pouring];
        q.level = Math.min(1, q.level + delta / T.pourMs);
        const h = 200 * q.level;
        q.full.setCrop(0, 240 - h, 140, h + 20);
        this.poke();
        const m = mouth();
        if (Math.random() < 0.5) burst(this, m.x, m.y + 20 * k, { count: 1, tint: 0xffffff, size: 18 * k, speed: 40, gravityY: 900, lifespan: 300, depth: 601 });
        sfx(this, 'pour', { minGapMs: 700, volume: 0.5 });
        if (q.level >= 1) {
          pouring = -1;
          stars(this, q.img.x, q.img.y - 100 * q.img.scale, 6, 30 * k);
          sfx(this, 'pop', { minGapMs: 0 });
          this.tweens.add({ targets: this.held?.img, angle: 0, duration: 200 });
          if (this.bottles.every((x) => x.level >= 1)) {
            const h = this.held!;
            this.held = null;
            this.owner = null;
            h.img.setTexture('milk-bucket');
            this.putBack(h);
            this.time.delayedCall(500, () => this.stageDone());
          }
        }
      },
      release: (h) => {
        pouring = -1;
        h.img.setTexture('milk-bucket');
        b.full.setVisible(true).setAlpha(this.bottles.some((x) => x.level < 1) ? 1 : 0);
        b.img.setTexture('milk-bucket');
        this.putBack(h);
        return true;
      },
      plan: () => {
        const i = this.bottles.findIndex((q) => q.level < 1);
        if (i < 0) return null;
        const q = this.bottles[i];
        const tg = { x: q.img.x + 110 * k * 0.0 + 130 * this.heldScale('milk-bucket', 'thing') * 0.75, y: q.img.y - 180 * q.img.scale };
        const plan = this.dragPlan(null, b.spot, [tg], 'milk-bucket-full', 'thing', T.pourMs * (1 - q.level) + 400);
        plan.keys![0] = { ...plan.keys![0], x: b.spot.x, y: b.spot.y + 50 * k };
        return plan;
      },
    };
  }

  /** Shearing: the shears over each band of wool (easy: any way; hard: only strokes down, the arrows' way). */
  private shearJob(): Job {
    const view = this.cur!.view!;
    const k = this.L.k;
    const fleece = (view as unknown as { fleece: Phaser.GameObjects.Image[] }).fleece;
    const bands = this.level === 1 ? A.fleece4 : A.fleece6;
    // the wool pile on the grass in front of her
    const pa = view.at({ x: 120, y: 650 });
    const pile = this.add.image(pa.x, pa.y, 'wool-pile').setScale(0).setDepth(7);
    this.pile = { img: pile, s: 0.55 * view.scale };
    this.props.push(pile);
    let tickled = false;
    const arrows = this.add.graphics().setDepth(9).setAlpha(0);
    if (this.level === 2) {
      arrows.lineStyle(7 * k, 0xff8c42, 0.9);
      for (const [cx, cy, , h] of bands) {
        const a = view.at({ x: cx, y: cy - h * 0.32 });
        const b = view.at({ x: cx, y: cy + h * 0.32 });
        arrows.lineBetween(a.x, a.y, b.x, b.y);
        arrows.lineBetween(b.x, b.y, b.x - 16 * k, b.y - 22 * k);
        arrows.lineBetween(b.x, b.y, b.x + 16 * k, b.y - 22 * k);
      }
      this.props.push(arrows);
    }
    const spots = bands.map(([cx, cy, w, h]) => ({
      at: () => view.at({ x: cx, y: cy - h * 0.3 }),
      hit: (tp: P) => {
        const f = view.frameOf(tp);
        return Math.abs(f.x - cx) < w / 2 + 14 && Math.abs(f.y - cy) < h / 2;
      },
      need: h * T.bandRub * view.scale,
      hp: 0,
      done: false,
    }));
    const cos = Math.cos(Phaser.Math.DegToRad(T.bandAngle));
    const job = this.rubJob({
      stage: 'shear',
      tool: 'farm-shears',
      spots,
      dir:
        this.level === 2
          ? (dx, dy) => {
              const d = Math.hypot(dx, dy);
              if (d < 0.5) return null;
              if (dy / d >= cos) return true;
              if (dy < 0) return null;
              return false;
            }
          : undefined,
      onRub: (i, tp) => {
        fleece[i].setAlpha(1 - 0.35 * Math.min(1, spots[i].hp / spots[i].need));
        sfx(this, 'clip-buzz', { minGapMs: 280, volume: 0.6 });
        if (Math.random() < 0.2) burst(this, tp.x, tp.y, { texture: 'wool-curl', count: 1, size: 50 * k, speed: 160, gravityY: 700, lifespan: 600, depth: 10 });
      },
      onDone: (i) => {
        const f = fleece[i];
        const w = view.at({ x: bands[i][0], y: bands[i][1] });
        f.setVisible(false);
        // the band falls off as curls and lands on the pile
        for (let c = 0; c < 3; c++) {
          const curl = this.add.image(w.x + Phaser.Math.Between(-30, 30) * k, w.y + (c - 1) * 60 * k, 'wool-curl').setScale(0.6 * view.scale).setDepth(10);
          this.tweens.add({ targets: curl, x: pile.x + Phaser.Math.Between(-40, 40) * k, y: pile.y - 20 * k, angle: Phaser.Math.Between(-90, 90), duration: 520, delay: c * 70, ease: 'Quad.easeIn', onComplete: () => curl.destroy() });
        }
        const done = spots.filter((s) => s.done).length;
        this.time.delayedCall(560, () => {
          this.tweens.add({ targets: pile, scale: this.pile!.s * (0.45 + (0.55 * done) / spots.length), duration: 200, ease: 'Back.easeOut' });
        });
        sfx(this, 'char-giggle', { minGapMs: 0, rate: view.rate, volume: 0.7 });
        this.tweens.add({ targets: view.box, scaleY: view.scale * 0.95, duration: 110, yoyo: true });
        if (!tickled) {
          tickled = true;
          this.say('vo-sheep-tickles', { ttlMs: 3000 });
        }
        if (spots.every((s) => s.done)) {
          sfx(this, 'baa', { minGapMs: 0 });
          view.react('love');
        }
      },
      stroke: (c) => {
        const L = (h: number) => h * view.scale;
        const top = c;
        const pts: P[] = [];
        for (let i = 0; i < 2; i++) {
          pts.push({ x: top.x, y: top.y }, { x: top.x, y: top.y + L(220) });
        }
        return pts;
      },
      wobbleOf: () => view.box,
      end: () => arrows.destroy(),
    });
    const drag0 = job.drag!;
    job.drag = (tp, dist, dx, dy) => {
      if (this.level === 2) arrows.setAlpha(this.held ? 1 : 0);
      drag0(tp, dist, dx, dy);
    };
    return job;
  }

  /** Winding the wool into a ball: the finger goes round and round the ball (hard: the arrows' way, then the other way). */
  private windJob(): Job {
    const view = this.cur!.view!;
    const k = this.L.k;
    const need = T.wind[this.level - 1] * k;
    const c = view.at({ x: 420, y: 520 });
    const R = 150 * k;
    const ballS = 0.85 * view.scale;
    const ball = this.add.image(c.x, c.y, 'yarn-ball').setScale(0.25 * ballS).setDepth(12);
    this.ball = { img: ball, s: ballS };
    this.props.push(ball);
    let acc = 0;
    let wrong = 0;
    let dir = 1;
    let flipped = false;
    let last: number | null = null;
    const g = this.add.graphics().setDepth(11);
    this.props.push(g);
    const ring = () => {
      g.clear();
      if (this.level === 1) {
        g.lineStyle(6 * k, 0xffffff, 0.5);
        g.strokeCircle(c.x, c.y, R);
        return;
      }
      // three curved arrows round the ball, the way to go
      g.lineStyle(9 * k, 0xff8c42, 0.95);
      for (let i = 0; i < 3; i++) {
        const a0 = (i * Math.PI * 2) / 3;
        const a1 = a0 + dir * 1.4;
        g.beginPath();
        g.arc(c.x, c.y, R, Math.min(a0, a1), Math.max(a0, a1), false);
        g.strokePath();
        const hx = c.x + Math.cos(a1) * R;
        const hy = c.y + Math.sin(a1) * R;
        const t = a1 + (dir * Math.PI) / 2;
        const bx = -Math.cos(t);
        const by = -Math.sin(t);
        for (const s of [-1, 1]) {
          const nx = bx * Math.cos(s * 0.5) - by * Math.sin(s * 0.5);
          const ny = bx * Math.sin(s * 0.5) + by * Math.cos(s * 0.5);
          g.lineBetween(hx, hy, hx + nx * 30 * k, hy + ny * 30 * k);
        }
      }
    };
    ring();
    const step = (at: P) => {
      const a = Math.atan2(at.y - c.y, at.x - c.x);
      if (last === null) {
        last = a;
        return;
      }
      let d = a - last;
      if (d > Math.PI) d -= Math.PI * 2;
      if (d < -Math.PI) d += Math.PI * 2;
      last = a;
      const r = Math.max(70 * k, Math.hypot(at.x - c.x, at.y - c.y));
      const travel = Math.abs(d) * Math.min(r, 260 * k);
      if (travel < 0.1) return;
      if (this.level === 2 && Math.sign(d) !== dir) {
        wrong += travel;
        if (wrong > 300 * k) {
          wrong = -1e9;
          this.wobble(ball);
          this.miss();
        }
        return;
      }
      acc += travel;
      this.poke();
      const f = Math.min(1, acc / need);
      ball.setScale(ballS * (0.25 + 0.75 * f)).setAngle(ball.angle + Phaser.Math.RadToDeg(d) * 0.8);
      if (this.pile) this.pile.img.setScale(this.pile.s * Math.max(0.15, 1 - f));
      sfx(this, 'brush', { minGapMs: 420, volume: 0.35, rate: 1.4 });
      if (this.level === 2 && !flipped && f >= 0.5) {
        flipped = true;
        dir = -dir;
        ring();
        boing(this, g as unknown as Phaser.GameObjects.Image, 0.1);
        this.say('vo-other-way', { ttlMs: 3000 });
      }
      if (f >= 1) {
        this.freeOn = false;
        this.owner = null;
        g.clear();
        stars(this, c.x, c.y, 10, 40 * k);
        sfx(this, 'sparkle', { minGapMs: 0 });
        if (this.pile) this.tweens.add({ targets: this.pile.img, alpha: 0, scale: 0, duration: 300 });
        this.time.delayedCall(500, () => this.stageDone());
      }
    };
    return {
      stage: 'wind',
      slots: [],
      press: (at) => {
        const r = this.room;
        if (at.x < r.x0 - 40 * k || at.x > r.x1 + 40 * k) return false;
        last = null;
        wrong = 0;
        step(at);
        boing(this, ball, 0.06);
        return 'own';
      },
      free: (at) => step(at),
      freeUp: () => {
        last = null;
        wrong = 0;
      },
      plan: () => {
        const keys: HandKey[] = [];
        const loops = 2.2;
        const nk = Math.ceil(16 * loops);
        const a0 = -Math.PI / 2;
        for (let i = 0; i <= nk; i++) {
          const a = a0 + dir * (i / 16) * Math.PI * 2;
          keys.push({ x: c.x + Math.cos(a) * R, y: c.y + Math.sin(a) * R, t: 300 + i * 110 });
        }
        keys.unshift({ ...keys[0], t: 0 });
        keys.push({ ...keys[keys.length - 1], t: keys[keys.length - 1].t + 300 });
        return { keys };
      },
      end: () => g.destroy(),
    };
  }

  /** Grain for the hens: the scoop over the yard drops grains; the nearest hen runs to peck each one. */
  private grainJob(): Job {
    const k = this.L.k;
    const n = T.grain[this.level - 1];
    const y = this.room.yard;
    let acc = 0;
    let count = 0;
    let pecked = 0;
    const busy = new Set<Hen>();
    const peck = (g: Phaser.GameObjects.Image) => {
      const free = this.hens.filter((h) => !busy.has(h));
      const h = (free.length ? free : this.hens).reduce((a, b) => (Phaser.Math.Distance.Between(a.stand.x, a.stand.y, g.x, g.y) < Phaser.Math.Distance.Between(b.stand.x, b.stand.y, g.x, g.y) ? a : b));
      busy.add(h);
      const to = { x: g.x + 50 * h.img.scale, y: g.y + 30 * h.img.scale };
      h.img.setFlipX(g.x > h.img.x);
      this.tweens.chain({
        targets: h.img,
        tweens: [
          { x: to.x, y: to.y, duration: 380, ease: 'Sine.easeInOut' },
          { angle: h.img.flipX ? 25 : -25, duration: 110, yoyo: true, repeat: 1 },
          { x: h.stand.x, y: h.stand.y, duration: 420, ease: 'Sine.easeInOut' },
        ],
        onComplete: () => {
          busy.delete(h);
          h.img.setFlipX(false).setAngle(0);
        },
      });
      this.time.delayedCall(480, () => {
        g.destroy();
        sfx(this, 'cluck', { minGapMs: 500, volume: 0.6, rate: Phaser.Math.FloatBetween(0.9, 1.15) });
        if (++pecked >= n) this.time.delayedCall(800, () => this.stageDone());
      });
    };
    return {
      stage: 'grain',
      slots: [{ key: 'grain-scoop', role: 'tool' }],
      drag: (tp, dist) => {
        if (!this.held || this.held.key !== 'grain-scoop' || count >= n) return;
        if (tp.x < y.x0 || tp.x > y.x1 || tp.y < y.y0 - 120 * k || tp.y > y.y1) return;
        acc += dist;
        while (acc >= T.grainGap * k && count < n) {
          acc -= T.grainGap * k;
          count++;
          this.poke();
          const at = { x: tp.x + Phaser.Math.Between(-20, 20) * k, y: Math.min(y.y1 - 20 * k, Math.max(y.y0 + 60 * k, tp.y + 80 * k)) };
          const g = this.add.image(tp.x, tp.y, FX_DOT).setTint(0xe8b13a).setScale((22 * k) / 32).setDepth(7.5);
          this.tweens.add({ targets: g, x: at.x, y: at.y, duration: 260, ease: 'Quad.easeIn', onComplete: () => peck(g) });
          sfx(this, 'sprinkle', { minGapMs: 120, volume: 0.6 });
          this.tweens.add({ targets: this.held.img, angle: { from: 0, to: -25 }, duration: 120, yoyo: true });
        }
      },
      plan: () => {
        const s = this.slotOf('grain-scoop');
        if (!s) return null;
        const yy = (y.y0 + y.y1) / 2 - 60 * k;
        const pts: P[] = [];
        for (let i = 0; i < 5; i++) pts.push({ x: y.x0 + 40 * k + ((y.x1 - y.x0 - 80 * k) * i) / 4, y: yy + (i % 2 ? 50 : -50) * k });
        return this.dragPlan(s, s.home, pts, 'grain-scoop', 'tool');
      },
      end: () => {
        // the hens settle into their nests
        this.hens.forEach((h, i) =>
          this.time.delayedCall(150 * i, () => {
            this.tweens.killTweensOf(h.img);
            h.img.setTexture(`hen-sit-${h.colour}`).setAngle(0).setFlipX(false);
            h.img.setPosition(h.at.x, h.at.y + 10 * h.img.scale).setOrigin(0.5, 0.8);
            h.sit = true;
            boing(this, h.img, 0.1);
          }),
        );
      },
    };
  }

  /** The baskets in the tray: easy one; hard, white and brown (an egg of each colour on its rim says which). */
  private layBaskets() {
    if (this.baskets.length) return;
    const S = this.S;
    const k = this.L.k;
    const sc = S.binScale(6);
    const colours: ('white' | 'brown')[] = this.level === 2 ? ['white', 'brown'] : ['white'];
    this.baskets = colours.map((colour, i) => {
      const at = S.bin(i, 6);
      const s = (240 * sc * 0.95) / 300;
      const img = this.add.image(at.x, at.y, 'egg-basket').setScale(0).setDepth(22);
      this.tweens.add({ targets: img, scale: s, duration: 300, delay: 80 * i, ease: 'Back.easeOut' });
      if (this.level === 2) {
        const tag = this.add.image(at.x + 95 * s, at.y + 50 * s, `egg-${colour}`).setScale(0).setDepth(23);
        this.tweens.add({ targets: tag, scale: 0.75 * s, duration: 300, delay: 80 * i + 60, ease: 'Back.easeOut' });
        this.props.push(tag);
      }
      this.props.push(img);
      return { img, colour, eggs: [] as Phaser.GameObjects.Image[] };
    });
    void k;
  }

  /** The eggs: a tap on a hen and she stands up, there is an egg; it goes carefully into the basket. */
  private eggsJob(): Job {
    const k = this.L.k;
    const n = this.hens.length;
    this.layBaskets();
    let count = 0;
    let basketSaid = false;
    const basketFor = (c: 'white' | 'brown') => this.baskets.find((b) => b.colour === c) ?? this.baskets[0];
    const henAt = (at: P) => this.hens.find((h) => this.near(at, { x: h.at.x, y: h.at.y - 60 * h.img.scale }, Math.max(120 * k, 150 * h.img.scale)));
    const reveal = (h: Hen) => {
      if (h.shy) {
        h.shy = false;
        sfx(this, 'cluck', { minGapMs: 0, rate: 1.3 });
        this.tweens.add({ targets: h.img, y: h.img.y - 40 * k, duration: 160, yoyo: true, ease: 'Quad.easeOut' });
        this.tweens.add({ targets: h.img, angle: { from: -10, to: 10 }, duration: 90, yoyo: true, repeat: 1, onComplete: () => h.img.setAngle(0) });
        this.say('vo-hen-shy', { ttlMs: 3000 });
        this.poke();
        return;
      }
      h.sit = false;
      h.laid = true;
      sfx(this, 'cluck', { minGapMs: 0 });
      h.img.setTexture(`hen-up-${h.colour}`).setOrigin(0.5, 0.95);
      this.tweens.add({ targets: h.img, x: h.stand.x + 70 * h.img.scale, y: h.stand.y, duration: 300, ease: 'Quad.easeOut' });
      const egg = this.add.image(h.at.x, h.at.y - 10 * h.img.scale, `egg-${h.eggColour}`).setScale(0).setDepth(h.nest.depth + 0.2);
      this.tweens.add({ targets: egg, scale: h.img.scale * 0.95, duration: 260, ease: 'Back.easeOut' });
      h.egg = egg;
      this.poke();
      if (!basketSaid) {
        basketSaid = true;
        this.say('vo-hens-basket', { ttlMs: 4000 });
      }
    };
    const land = (h: Hen, egg: Phaser.GameObjects.Image) => {
      const b = basketFor(h.eggColour);
      const i = b.eggs.length;
      const s = b.img.scale;
      const at = { x: b.img.x + (i - 1) * 50 * s, y: b.img.y - 40 * s + (i % 2) * 10 * s };
      h.egg = null;
      count++;
      this.poke();
      this.flyTo(egg, at, s * 0.55, 220, () => {
        egg.setDepth(22.5);
        b.eggs.push(egg);
        this.props.push(egg);
        sfx(this, 'pop', { minGapMs: 0 });
        boing(this, b.img, 0.08);
        this.say(`count-${count}` as VoiceKey, { ttlMs: 2500, group: 'count', sequence: true });
        if (count >= n) this.time.delayedCall(700, () => this.stageDone());
      });
    };
    return {
      stage: 'eggs',
      slots: [],
      press: (at) => {
        const withEgg = this.hens.find((h) => h.egg && this.near(at, h.egg, 110 * k));
        if (withEgg) {
          const e = withEgg.egg!;
          this.pickUp(e, `egg-${withEgg.eggColour}`, 'thing', null, at, e.scale * 1.3, { x: withEgg.at.x, y: withEgg.at.y - 10 * withEgg.img.scale }, e.scale);
          (this.held as Held & { hen?: Hen }).hen = withEgg;
          return 'own';
        }
        const h = henAt(at);
        if (h && h.sit && !h.laid) {
          reveal(h);
          return true;
        }
        if (h) {
          boing(this, h.img, 0.08);
          sfx(this, 'cluck', { minGapMs: 300, volume: 0.5 });
          return true;
        }
        return false;
      },
      release: (held, tp, tapped, cancelled) => {
        const h = (held as Held & { hen?: Hen }).hen;
        if (!h || cancelled) return false;
        if (tapped) {
          this.held = null;
          land(h, held.img);
          return true;
        }
        const b = this.baskets.find((q) => this.near(tp, q.img, 170 * k));
        if (!b) return false;
        this.held = null;
        if (b.colour !== h.eggColour && this.level === 2) {
          // the other basket: it rolls gently back to its nest
          this.shown.wrong = (this.shown.wrong as number) + 1;
          boing(this, b.img, 0.1);
          this.putBack(held);
          this.tweens.add({ targets: held.img, angle: 360, duration: 360 });
          h.egg = held.img;
          this.say('vo-hens-colour', { ttlMs: 3000 });
          this.miss();
          return true;
        }
        land(h, held.img);
        return true;
      },
      plan: () => {
        const h = this.hens.find((q) => q.egg);
        if (h) return this.dragPlan(null, { x: h.egg!.x, y: h.egg!.y + 50 * k }, [basketFor(h.eggColour).img], `egg-${h.eggColour}`, 'thing');
        const s = this.hens.find((q) => q.sit && !q.laid);
        return s ? { tap: { x: s.at.x, y: s.at.y - 60 * s.img.scale } } : null;
      },
    };
  }

  /** Hard: an egg in the basket cracks, a chick! It goes back to its mommy (it peeps louder near her). */
  private chickJob(): Job {
    const k = this.L.k;
    const b = this.baskets.find((q) => q.colour === 'brown' && q.eggs.length) ?? this.baskets.find((q) => q.eggs.length)!;
    const egg = b.eggs.pop()!;
    const mom = this.hens.find((h) => h.eggColour === b.colour) ?? this.hens[0];
    const chick = this.add.image(egg.x, egg.y, 'farm-chick').setScale(0).setDepth(23);
    this.time.delayedCall(500, () => {
      sfx(this, 'egg-crack', { minGapMs: 0 });
      this.tweens.add({ targets: egg, angle: { from: -12, to: 12 }, duration: 80, yoyo: true, repeat: 2, onComplete: () => egg.destroy() });
      this.time.delayedCall(450, () => {
        sfx(this, 'peep', { minGapMs: 0 });
        this.tweens.add({ targets: chick, scale: 0.9 * this.S.binScale(6) * 1.2, duration: 300, ease: 'Back.easeOut' });
      });
    });
    const home = { x: egg.x, y: egg.y };
    const momAt = () => ({ x: mom.img.x - 70 * mom.img.scale, y: mom.img.y - 20 * mom.img.scale });
    const done = () => {
      sfx(this, 'peep', { minGapMs: 0 });
      sfx(this, 'cluck', { minGapMs: 0 });
      boing(this, mom.img, 0.15);
      stars(this, chick.x, chick.y, 8, 34 * k);
      burst(this, mom.img.x, mom.img.y - 120 * mom.img.scale, { texture: 'fx-heart', count: 5, tint: [0xf06a8a, 0xf5a3b5], size: 36 * k, speed: 240, gravityY: -140, lifespan: 900, depth: 60 });
      this.props.push(chick);
      this.time.delayedCall(900, () => this.stageDone());
    };
    return {
      stage: 'chick',
      slots: [],
      press: (at) => {
        if (!chick.active || chick.scale < 0.05 || !this.near(at, chick, 120 * k)) return false;
        this.pickUp(chick, 'farm-chick', 'thing', null, at, chick.scale, home, chick.scale);
        return 'own';
      },
      drag: (tp) => {
        if (this.near(tp, momAt(), 260 * k)) sfx(this, 'peep', { minGapMs: 500, volume: 1 });
        else sfx(this, 'peep', { minGapMs: 1100, volume: 0.35 });
      },
      release: (_h, tp, tapped, cancelled) => {
        if (cancelled) return false;
        if (tapped || this.near(tp, momAt(), 190 * k)) {
          this.held = null;
          this.poke();
          this.tweens.add({ targets: chick, x: momAt().x, y: momAt().y + 30 * k, duration: tapped ? 600 : 200, ease: 'Sine.easeInOut', onComplete: done });
          if (tapped) this.tweens.add({ targets: chick, angle: { from: -8, to: 8 }, duration: 100, yoyo: true, repeat: 2 });
          return true;
        }
        const other = this.hens.find((q) => q !== mom && this.near(tp, { x: q.img.x, y: q.img.y - 60 * q.img.scale }, 170 * k));
        if (other) {
          this.shown.wrong = (this.shown.wrong as number) + 1;
          boing(this, other.img, 0.08);
          sfx(this, 'peep', { minGapMs: 0, volume: 0.6 });
          this.miss();
        }
        return false;
      },
      plan: () => (chick.scale > 0.05 ? this.dragPlan(null, { x: chick.x, y: chick.y + 50 * k }, [momAt()], 'farm-chick', 'thing') : null),
    };
  }

  /** The pig's mud: the sponge scrubs each splat off (any order). */
  private mudJob(): Job {
    const view = this.cur!.view!;
    const k = this.L.k;
    const boxes = A.mud.slice(0, this.mud.length);
    const spots = boxes.map(([cx, cy, w]) => ({
      at: () => view.at({ x: cx, y: cy }),
      hit: (tp: P) => this.near(tp, view.at({ x: cx, y: cy }), Math.max((w / 2 + 20) * view.scale, 90 * k)),
      need: T.mudRub * k,
      hp: 0,
      done: false,
    }));
    return this.rubJob({
      stage: 'mud',
      tool: 'farm-sponge',
      spots,
      onRub: (i, tp) => {
        this.mud[i].setAlpha(Math.max(0.1, 1 - spots[i].hp / spots[i].need));
        if (Math.random() < 0.3) burst(this, tp.x, tp.y, { count: 2, tint: 0x7a5236, size: 18 * k, speed: 200, gravityY: 900, lifespan: 500, depth: 10 });
        sfx(this, 'brush', { minGapMs: 260, volume: 0.5, rate: 0.8 });
      },
      onDone: (i) => {
        this.mud[i].setVisible(false);
        const p = spots[i].at();
        stars(this, p.x, p.y, 5, 30 * k);
        sfx(this, 'oink', { minGapMs: 0, volume: 0.6 });
      },
      stroke: (c) => this.zigzag(c, 140 * k, 70 * k, T.mudRub * k * 1.2),
      wobbleOf: () => view.box,
    });
  }

  /** Soap: the bar over her makes bubbles; most of her bubbly (a grid of places, any order). */
  private soapJob(): Job {
    const view = this.cur!.view!;
    const k = this.L.k;
    const cols = 4;
    const rows = 3;
    const fx0 = 200;
    const fx1 = 700;
    const fy0 = 290;
    const fy1 = 560;
    const cells: P[] = [];
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) cells.push({ x: fx0 + ((c + 0.5) * (fx1 - fx0)) / cols, y: fy0 + ((r + 0.5) * (fy1 - fy0)) / rows });
    const cw = (fx1 - fx0) / cols;
    const chh = (fy1 - fy0) / rows;
    const goal = T.foam[this.level - 1];
    let since = 0;
    const spots = cells.map((f) => ({
      at: () => view.at(f),
      hit: (tp: P) => {
        const q = view.frameOf(tp);
        return Math.abs(q.x - f.x) <= cw / 2 && Math.abs(q.y - f.y) <= chh / 2;
      },
      need: 70 * k,
      hp: 0,
      done: false,
    }));
    const enough = () => spots.filter((s) => s.done).length / spots.length >= goal;
    return this.rubJob({
      stage: 'soap',
      tool: 'farm-soap',
      spots,
      enough,
      onRub: (_i, tp, dist) => {
        since += dist;
        if (since > 34 * k && this.bubbles.length < 70) {
          since = 0;
          const f = view.frameOf(tp);
          const b = view.put('bubble', { x: f.x + Phaser.Math.Between(-20, 20), y: f.y + Phaser.Math.Between(-20, 20) }, Phaser.Math.FloatBetween(0.5, 0.9));
          b.setScale(0);
          this.tweens.add({ targets: b, scale: rs('bubble', Phaser.Math.FloatBetween(0.5, 0.9)), duration: 200, ease: 'Back.easeOut' });
          this.bubbles.push(b);
          sfx(this, 'bubbles', { minGapMs: 500, volume: 0.5 });
        }
      },
      onDone: () => undefined,
      stroke: (c) => {
        // across her body, row by row
        void c;
        const pts: P[] = [];
        for (let r = 0; r < rows; r++) {
          const a = view.at({ x: fx0 + 20, y: fy0 + (r + 0.5) * chh });
          const b = view.at({ x: fx1 - 20, y: fy0 + (r + 0.5) * chh });
          pts.push(r % 2 ? b : a, r % 2 ? a : b);
        }
        return pts;
      },
      wobbleOf: () => view.box,
    });
  }

  /** Rinsing: a tap on the pump sends water over her; the bubbles go a bit each time. */
  private rinseJob(): Job {
    const view = this.cur!.view!;
    const k = this.L.k;
    const n = T.rinse[this.level - 1];
    let count = 0;
    return {
      stage: 'rinse',
      slots: [{ key: 'farm-pump', role: 'fixed' }],
      press: (at) => {
        const s = this.slotOf('farm-pump');
        if (!s || count >= n || !this.near(at, s.home, Math.max(140 * k, 200 * s.homeScale))) return false;
        count++;
        this.poke();
        this.tweens.add({ targets: s.img, scaleY: s.homeScale * 0.9, duration: 120, yoyo: true });
        const sp = { x: s.img.x + (A.pumpSpout.x - 120) * s.img.scale, y: s.img.y + (A.pumpSpout.y - 200) * s.img.scale };
        const to = view.at({ x: 450, y: 380 });
        for (let i = 0; i < 9; i++) {
          const d = this.add.image(sp.x, sp.y, 'water-drop').setScale(0.5 * k).setDepth(30);
          const tx = to.x + Phaser.Math.Between(-200, 200) * view.scale;
          const ty = to.y + Phaser.Math.Between(-100, 120) * view.scale;
          this.tweens.add({ targets: d, x: tx, duration: 420, delay: i * 40, ease: 'Linear' });
          this.tweens.add({ targets: d, y: { from: sp.y, to: ty }, duration: 420, delay: i * 40, ease: 'Quad.easeIn', onComplete: () => d.destroy() });
        }
        waterLoop.start();
        this.time.delayedCall(700, () => waterLoop.stop());
        const go = Math.ceil(this.bubbles.length / (n - count + 1));
        const out = this.bubbles.splice(0, go);
        this.time.delayedCall(380, () => {
          for (const b of out) this.tweens.add({ targets: b, alpha: 0, scale: 0, duration: 260, delay: Phaser.Math.Between(0, 200), onComplete: () => b.destroy() });
          if (count >= n) {
            for (const b of this.bubbles) b.destroy();
            this.bubbles = [];
            sfx(this, 'sparkle', { minGapMs: 0 });
            const c = view.at({ x: 450, y: 380 });
            stars(this, c.x, c.y, 10, 40 * k);
            view.react('love');
            this.time.delayedCall(900, () => this.stageDone());
          }
        });
        return true;
      },
      plan: () => {
        const s = this.slotOf('farm-pump');
        return s ? { tap: s.home } : null;
      },
    };
  }

  // ---------------------------------------------------------------- 4. thank you, and what she gives

  private allDone(v: Visit) {
    if (this.leaving || this.cur !== v) return;
    this.setPhase('intro');
    const k = this.L.k;
    sfx(this, 'cheer-jingle');
    music.party();
    const head = this.headOf(v);
    stars(this, head.x, head.y, 10, 50 * k);
    confetti(this, head.x, this.L.Y(220), 14, 24 * k);
    this.mom?.cheer();
    this.pipa?.cheer();
    const then = () => this.time.delayedCall(400, () => this.thanks(v));
    switch (v.a.id) {
      case 'horse':
        return this.ride(v, then);
      case 'cow': {
        this.give.cow = true;
        const bottles = this.bottles.length ? this.bottles.map((b) => (b.img.destroy(), b.full.setCrop(), b.full)) : [0, 1].map(() => this.add.image(this.bucket!.img.x, this.bucket!.img.y, 'milk-bottle-full').setScale(0).setDepth(22));
        this.bottles = [];
        bottles.forEach((b) => (this.props.splice(this.props.indexOf(b), 1), this.toCart(b)));
        if (this.bucket) this.bucket.full.setAlpha(0);
        return this.time.delayedCall(900, then);
      }
      case 'sheep': {
        this.give.sheep = true;
        const ball = this.ball?.img;
        if (ball) {
          this.props.splice(this.props.indexOf(ball), 1);
          this.toCart(ball);
        }
        return this.time.delayedCall(900, then);
      }
      case 'hens': {
        this.give.hens = true;
        for (const b of this.baskets) {
          this.props.splice(this.props.indexOf(b.img), 1);
          for (const e of b.eggs) {
            this.props.splice(this.props.indexOf(e), 1);
            e.destroy();
          }
          this.toCart(b.img);
        }
        this.baskets = [];
        return this.time.delayedCall(900, then);
      }
      case 'pig':
        return this.backToMud(v, then);
    }
  }

  /** Into the cart: it flies there and stays (side by side on its load). */
  private toCart(img: Phaser.GameObjects.Image) {
    const c = this.cart;
    const i = c.items.length;
    const at = { x: c.img.x + (-130 + (i % 4) * 85) * c.s, y: c.img.y + (A.cartIn.y - 165) * c.s - 20 * c.s - Math.floor(i / 4) * 30 * c.s };
    const big = Math.max(img.width, img.height);
    const s = (130 * c.s) / big;
    c.items.push(img);
    img.setDepth(14 + i * 0.01).setAlpha(1);
    this.time.delayedCall(i * 60, () =>
      this.flyTo(img, at, s, 520, () => {
        sfx(this, 'pop', { minGapMs: 0 });
        boing(this, c.img, 0.06);
        this.shown.cart = c.items.length;
      }),
    );
  }

  /** The horse gives Pipa a ride (Pipa hops up on his back, then back to her place); with no Pipa he prances. */
  private ride(v: Visit, then: () => void) {
    const view = v.view!;
    this.give.horse = true;
    const pipa = this.pipa;
    sfx(this, 'neigh', { minGapMs: 0 });
    if (!pipa || !this.S.pet) {
      this.tweens.add({ targets: view.box, y: view.rest.y - 50 * view.scale, duration: 220, yoyo: true, repeat: 2, ease: 'Quad.easeOut' });
      return this.time.delayedCall(1400, then);
    }
    this.say('vo-horse-ride', { ttlMs: 4000 });
    const back = view.at({ x: 470, y: 250 });
    const s = pipa.scale;
    const spot = { x: back.x, y: back.y - 334 * s + 20 * s, scale: s };
    const home = { ...this.S.pet };
    pipa.moveTo(spot, 500);
    this.time.delayedCall(550, () => {
      pipa.setMood('happy');
      sfx(this, 'char-yay', { minGapMs: 0 });
      this.tweens.add({ targets: [view.box, pipa.box], x: `-=${60 * this.L.k}`, duration: 700, yoyo: true, ease: 'Sine.easeInOut' });
      this.tweens.add({ targets: [view.box, pipa.box], y: `-=${24 * view.scale}`, duration: 175, yoyo: true, repeat: 3, ease: 'Quad.easeOut' });
    });
    this.time.delayedCall(2100, () => {
      pipa.moveTo(home, 500);
      this.time.delayedCall(550, () => pipa.setMood('rest'));
    });
    this.time.delayedCall(2800, then);
  }

  /** Clean and fed, the pig runs straight back into her puddle: splash! Everybody laughs. */
  private backToMud(v: Visit, then: () => void) {
    const view = v.view!;
    const k = this.L.k;
    const pd = this.bgAt(A.puddle.x, A.puddle.y);
    const s = Math.max(view.scale * 0.55, 0.35 * k);
    this.tweens.add({ targets: view.box, x: pd.x, y: pd.y - (FEET - FH / 2) * s - 10 * k, scale: s, duration: 800, ease: 'Sine.easeInOut' });
    this.tweens.add({ targets: view.box, angle: { from: -6, to: 6 }, duration: 130, yoyo: true, repeat: 2 });
    this.time.delayedCall(820, () => {
      view.rest = { x: view.box.x, y: view.box.y };
      view.scale = s;
      view.box.setAngle(0);
      sfx(this, 'splash-mud', { minGapMs: 0 });
      burst(this, pd.x, pd.y - 20 * k, { count: 16, tint: [0x7a5236, 0x5f3f28], size: 26 * k, speed: 520, gravityY: 1100, lifespan: 800, depth: 60 });
      for (const m of this.mud) m.setVisible(true).setAlpha(1);
      view.react('giggle');
      this.say('vo-pig-back', { ttlMs: 4000 });
      this.mom?.happy();
      this.pipa?.react('giggle');
      this.time.delayedCall(1100, () => this.mom?.rest());
    });
    this.time.delayedCall(2600, then);
  }

  private thanks(v: Visit) {
    if (this.leaving || this.cur !== v) return;
    sfx(this, v.a.sound, { minGapMs: 0 });
    this.dance(v);
    this.say(v.a.thanks, { ttlMs: 4000, done: () => this.time.delayedCall(300, () => this.homeToFence(v)) });
    this.time.delayedCall(5000, () => this.homeToFence(v));
  }

  /** Each one's happy move: the horse tosses his mane, the cow rings her bell, the sheep skips, the hens flap. */
  private dance(v: Visit) {
    const view = v.view;
    if (!view) {
      for (const h of this.hens) this.tweens.add({ targets: h.img, y: h.img.y - 40 * this.L.k, scaleX: h.img.scaleX * 1.1, duration: 160, yoyo: true, repeat: 2, ease: 'Quad.easeOut' });
      return;
    }
    const box = view.box;
    const r = view.rest;
    const s = view.scale;
    const back = () => box.setAngle(0).setPosition(r.x, r.y).setScale(s);
    this.tweens.killTweensOf(box);
    back();
    view.setMood('happy');
    this.time.delayedCall(1400, () => view.mood === 'happy' && view.setMood('rest'));
    switch (v.a.id) {
      case 'horse':
        this.tweens.add({ targets: box, angle: { from: -4, to: 4 }, duration: 200, yoyo: true, repeat: 2, ease: 'Sine.easeInOut', onComplete: back });
        break;
      case 'cow':
        sfx(this, 'cow-bell', { minGapMs: 0, volume: 0.7 });
        this.tweens.add({ targets: box, angle: { from: -3, to: 3 }, duration: 260, yoyo: true, repeat: 2, ease: 'Sine.easeInOut', onComplete: back });
        break;
      case 'sheep':
        this.tweens.add({ targets: box, y: r.y - 70 * s, duration: 200, yoyo: true, repeat: 2, ease: 'Quad.easeOut', onComplete: back });
        break;
      default:
        this.tweens.add({ targets: box, y: r.y - 30 * s, duration: 160, yoyo: true, repeat: 3, ease: 'Quad.easeOut', onComplete: back });
    }
  }

  private homeToFence(v: Visit) {
    if (this.leaving || v.finished) return;
    v.finished = true;
    this.shown.cared = (this.shown.cared as number) + 1;
    this.setPhase('intro');
    // what was around her goes; the trough, the hens and their nests too
    const gone = [...this.props];
    this.props = [];
    for (const o of gone) {
      const g = o as Phaser.GameObjects.Image;
      if (!g.active) continue;
      this.tweens.killTweensOf(g);
      this.tweens.add({ targets: g, alpha: 0, duration: 400, onComplete: () => g.destroy() });
    }
    this.hens = [];
    this.trough = null;
    this.bucket = null;
    this.pile = this.ball = null;
    this.bubbles = [];
    if (v.view) {
      const view = v.view;
      view.hideWish(true);
      view.box.setDepth(3);
      view.moveTo(v.peek, 900);
      this.time.delayedCall(950, () => (view.setMood('happy'), (this.mud = [])));
    } else {
      this.tweens.add({ targets: v.peekImgs, alpha: 1, duration: 400, delay: 400 });
    }
    for (const o of this.visit) {
      if (o === v) continue;
      if (o.view) this.tweens.add({ targets: o.view.box, alpha: 1, duration: 400, delay: 500 });
      this.tweens.add({ targets: o.peekImgs, alpha: 1, duration: 400, delay: 500 });
    }
    this.time.delayedCall(1300, () => {
      if (this.leaving) return;
      this.cur = null;
      if (this.visit.every((q) => q.finished)) this.finale();
      else this.startPick(false);
    });
  }

  // ---------------------------------------------------------------- 5. the finale: the cart, a photo, a scarf for Pipa

  private finale() {
    this.setPhase('done');
    this.shown.done = true;
    const k = this.L.k;
    for (const v of this.visit) v.view?.setMood('happy');
    // the cart rolls into the middle with everything on it
    const c = this.cart;
    const to = { x: this.room.mid.x, y: c.img.y };
    const dx = to.x - c.img.x;
    sfx(this, 'whoosh', { volume: 0.5 });
    this.tweens.add({ targets: [c.img, ...c.items], x: `+=${dx}`, duration: 1100, ease: 'Sine.easeInOut' });
    this.tweens.add({ targets: c.img, angle: { from: -1.5, to: 1.5 }, duration: 160, yoyo: true, repeat: 3, onComplete: () => c.img.setAngle(0) });
    this.time.delayedCall(1200, () =>
      this.say('vo-farm-done', {
        ttlMs: 5000,
        done: () => this.time.delayedCall(300, () => this.snap()),
      }),
    );
    void k;
  }

  private snap() {
    if (this.leaving) return;
    const L = this.L;
    const c = this.cart;
    const cx = Phaser.Math.Clamp(c.img.x, L.W * 0.2, L.W * 0.8);
    const bottom = Math.min(L.H, c.img.y + 180 * c.s);
    const side = Math.min(L.H * 0.86, this.room.x1 - this.room.x0 + 200 * L.k);
    const area = { x: Math.round(Math.max(0, cx - side / 2)), y: Math.round(Math.max(0, bottom - side)), w: Math.round(side), h: Math.round(side) };
    sfx(this, 'camera', { vary: false });
    let after = false;
    const show = (src: HTMLImageElement | null) => {
      if (after) return;
      after = true;
      const flash = this.add.rectangle(L.W / 2, L.H / 2, L.W * 1.2, L.H * 1.2, 0xffffff).setDepth(2000).setAlpha(0.9);
      this.tweens.add({ targets: flash, alpha: 0, duration: 380, ease: 'Quad.easeOut', onComplete: () => flash.destroy() });
      this.framePhoto(src);
    };
    try {
      this.game.renderer.snapshotArea(area.x, area.y, area.w, area.h, (img) => show(img instanceof HTMLImageElement ? img : null));
    } catch {
      show(null);
    }
    this.time.delayedCall(1200, () => show(null));
  }

  /** The photo in the farm's frame, kept in the memory book; Pipa's scarf (or her milk); the cheer; bye bye. */
  private framePhoto(src: HTMLImageElement | null) {
    const L = this.L;
    const k = L.k;
    const W = A.photoWindow;
    const s = Math.min(0.7 * k, (L.H * 0.62) / 780);
    const at = { x: (this.room.x0 + this.room.x1) / 2, y: 30 * k + 390 * s };
    const keep = (img: HTMLImageElement) => {
      try {
        const c = document.createElement('canvas');
        c.width = c.height = 420;
        c.getContext('2d')!.drawImage(img, 0, 0, 420, 420);
        let data = c.toDataURL('image/webp', 0.75);
        if (!data.startsWith('data:image/webp')) data = c.toDataURL('image/png');
        this.shown.photo = data.length;
        void keepPhoto('farm', data);
      } catch {
        /* the photo is simply not kept */
      }
    };
    const parts: Phaser.GameObjects.GameObject[] = [];
    if (src) {
      keep(src);
      const key = 'farm-photo-made';
      if (this.textures.exists(key)) this.textures.remove(key);
      this.textures.addImage(key, src);
      const pic = new Phaser.GameObjects.Image(this, (W.x + W.w / 2 - 350) * s, (W.y + W.h / 2 - 390) * s, key);
      pic.setScale((W.w * s) / pic.width, (W.h * s) / pic.height);
      parts.push(pic);
    }
    parts.push(new Phaser.GameObjects.Image(this, 0, 0, 'photo-frame-farm').setScale(s));
    const box = this.add.container(at.x, at.y, parts).setDepth(800).setScale(0.2).setAlpha(0);
    this.tweens.add({ targets: box, scale: 1, alpha: 1, angle: { from: -8, to: -2 }, duration: 520, ease: 'Back.easeOut' });
    this.time.delayedCall(700, () => {
      sfx(this, 'cheer-jingle');
      music.party(true);
      stars(this, at.x, at.y - 200 * s, 14, 70 * k);
      confetti(this, at.x, L.Y(200), 22, 28 * k);
      this.mom?.celebrate();
      for (const v of this.visit) v.view?.cheer();
      const pipa = this.pipa;
      if (pipa && this.give.sheep) {
        // a warm scarf for Pipa, from the sheep's wool
        const sc = new Phaser.GameObjects.Image(this, A.scarf.x - 300, A.scarf.y - 350, 'pipa-scarf').setScale(0);
        pipa.box.add(sc);
        this.tweens.add({ targets: sc, scale: 1, duration: 400, delay: 300, ease: 'Back.easeOut' });
        this.time.delayedCall(700, () => pipa.react('love'));
        return this.goodbye('vo-farm-scarf');
      }
      if (pipa && this.give.cow) {
        // a sip of the milk
        const m = pipa.mouthAt;
        const b = this.add.image(this.cart.img.x, this.cart.img.y - 60 * k, 'milk-bottle-full').setScale(0.4 * k).setDepth(61);
        this.tweens.add({ targets: b, x: m.x + 40 * k, y: m.y, angle: -40, duration: 600, ease: 'Sine.easeInOut', onComplete: () => {
          sfx(this, 'slurp', { minGapMs: 0 });
          pipa.react('love');
          this.tweens.add({ targets: b, alpha: 0, duration: 400, delay: 600, onComplete: () => b.destroy() });
        } });
      } else pipa?.cheer();
      this.goodbye('vo-farm-day');
    });
  }

  // ---------------------------------------------------------------- Mom's hand, her help, the harness

  /** What a child would do next. */
  plan(): Plan | null {
    const k = this.L.k;
    switch (this.phase) {
      case 'pick': {
        const v = this.visit.find((q) => !q.finished);
        return v ? { tap: this.peekPoint(v) } : null;
      }
      case 'chore': {
        const i = this.nextChore();
        return i >= 0 && this.cards[i] ? { tap: this.cards[i].at } : null;
      }
      case 'work':
        return this.job?.plan() ?? null;
      default:
        void k;
        return null;
    }
  }

  protected way(): HandMotion | null {
    const p = this.plan();
    if (!p) return null;
    if (p.tap) return tapMotion(p.tap, this.L.k);
    if (!p.keys) return null;
    const g = this.tray.find((s) => p.prop && s.key === p.prop.key);
    return { kind: 'grab', keys: p.keys, props: p.prop ? [p.prop] : [], glow: g?.home ?? p.keys[0] };
  }

  protected helpOnce() {
    const p = this.plan();
    if (!p) return false;
    const k = this.L.k;
    if (p.tap) {
      const at = p.tap;
      this.hand.play(tapMotion(at, k));
      this.time.delayedCall(650, () => {
        this.helped();
        this.press(at, null);
        // (a tap that picked something up: let it go at once, as a tap)
        if (this.held || this.freeOn) this.letGo(at, false);
      });
      return true;
    }
    const keys = p.keys!;
    const total = Math.min(T.helpMs, keys[keys.length - 1].t);
    const phase = this.phase;
    let started = false;
    this.hand.follow('grab', () => (this.held ? { x: this.held.img.x - (p.prop?.dx ?? 0), y: this.held.img.y - (p.prop?.dy ?? 0) } : this.at(keys, 0)));
    this.tweens.addCounter({
      from: 0,
      to: total,
      duration: total,
      onUpdate: (tw) => {
        if (!this.helping || this.phase !== phase) return;
        const at = this.at(keys, tw.getValue() ?? 0);
        if (!started) {
          started = true;
          this.press(at, null);
          if (!this.held && !this.freeOn) return;
        }
        this.moveTo(at);
      },
      onComplete: () => {
        const at = keys[keys.length - 1];
        if (this.held || this.freeOn) this.letGo(at, false);
        this.helped();
      },
    });
    return true;
  }

  private at(keys: { x: number; y: number; t: number }[], t: number): P {
    if (t <= keys[0].t) return keys[0];
    for (let i = 1; i < keys.length; i++) {
      if (t <= keys[i].t) {
        const a = keys[i - 1];
        const b = keys[i];
        const u = (t - a.t) / Math.max(1, b.t - a.t);
        return { x: a.x + (b.x - a.x) * u, y: a.y + (b.y - a.y) * u };
      }
    }
    return keys[keys.length - 1];
  }

  // ---------------------------------------------------------------- touch

  protected down(p: Phaser.Input.Pointer, at: P) {
    this.press(at, p);
  }

  /** A press (her finger, or Mom's help with no pointer). */
  private press(at: P, p: Phaser.Input.Pointer | null) {
    const k = this.L.k;
    switch (this.phase) {
      case 'pick': {
        const v = this.visit.find((q) => !q.finished && this.hitPeek(q, at));
        if (v) return this.callOut(v);
        const d = this.visit.find((q) => q.finished && this.hitPeek(q, at));
        if (d) {
          sfx(this, d.a.sound, { minGapMs: 600, volume: 0.6 });
          if (d.view) boing(this, d.view.box, 0.06);
          else for (const h of d.peekImgs) boing(this, h, 0.1);
        }
        return;
      }
      case 'chore': {
        const i = this.cards.findIndex((c) => this.near(at, c.at, 125 * k));
        if (i >= 0) return this.tapCard(i);
        const view = this.cur?.view;
        if (view?.hit(at.x, at.y)) view.tickle();
        return;
      }
      case 'work': {
        const job = this.job;
        if (!job) return;
        const s = this.hitSlot(at);
        if (s && s.decoy) return this.wrongTool(s);
        if (s && s.role !== 'fixed') {
          if (s.role === 'source') {
            const img = this.add.image(s.home.x, s.home.y, s.key).setScale(s.homeScale).setDepth(600);
            this.pickUp(img, s.key, 'source', s, at, this.heldScale(s.key, 'source'));
          } else this.pickUp(s.img, s.key, s.role, s, at, this.heldScale(s.key, s.role));
          if (p) this.own(p);
          return;
        }
        const r = job.press?.(at);
        if (r === 'own') {
          if (!this.held) this.freeOn = true;
          if (p) this.own(p);
          return;
        }
        if (r) return;
        const view = this.cur?.view;
        if (view?.hit(at.x, at.y)) view.tickle();
        return;
      }
      default:
    }
  }

  protected move(p: Phaser.Input.Pointer) {
    this.moveTo({ x: p.worldX, y: p.worldY }, p.worldX - p.prevPosition.x);
  }

  private moveTo(f0: P, swayBy = 0) {
    const L = this.L;
    const f = { x: Phaser.Math.Clamp(f0.x, 0, L.W), y: Phaser.Math.Clamp(f0.y, 0, L.H) };
    if (this.freeOn) return this.job?.free?.(f);
    const h = this.held;
    if (!h) return;
    h.moved = Math.max(h.moved, Math.hypot(f.x - h.from.x, f.y - h.from.y));
    const tp = this.fingerTip(f, h.role);
    h.img.setPosition(tp.x - h.tip.x, tp.y - h.tip.y);
    if (swayBy && h.role !== 'tool') sway(this, h.img, swayBy, L.k);
    const dx = tp.x - h.last.x;
    const dy = tp.y - h.last.y;
    const dist = Math.hypot(dx, dy);
    h.last = tp;
    this.job?.drag?.(tp, dist, dx, dy);
  }

  protected tick(delta: number) {
    if (this.phase === 'work') this.job?.tick?.(delta);
  }

  protected up(p: Phaser.Input.Pointer, cancelled: boolean) {
    this.letGo({ x: p.worldX, y: p.worldY }, cancelled);
  }

  private letGo(_at: P, cancelled: boolean) {
    if (this.freeOn) {
      this.freeOn = false;
      this.job?.freeUp?.();
      return;
    }
    const h = this.held;
    this.held = null;
    if (!h) return;
    const k = this.L.k;
    const tp = this.tipOf(h);
    const tapped = h.moved < 30 * k && this.time.now - h.t0 < 450;
    if (this.phase === 'work' && this.job?.release?.(h, tp, tapped, cancelled)) return;
    if (!cancelled && h.role === 'tool' && tapped) this.hintNow();
    else if (!cancelled && h.moved > 60 * k && h.role !== 'tool') this.miss();
    this.putBack(h);
  }

  protected lookTarget() {
    if (this.held) return { x: this.held.img.x, y: this.held.img.y };
    return null;
  }
}

/** The animals the farm knows (for the test harness). */
export const FARM_ANIMALS = ANIMALS.map((a) => a.id);
