import Phaser from 'phaser';
import { ART, type ImageKey } from '../core/assets';
import { countKey, music, voice, waterLoop, type NameKey, type VoiceKey } from '../core/audio';
import { boing, burst, puff, stars } from '../core/fx';
import { MomHandView, tapMotion, type HandMotion } from '../core/hand';
import { confetti, settle, sway, tickles, touchRipples } from '../core/juice';
import { getLayout, inNoTouchZone, keepLayoutOnResize, ORIENTATION_PAUSE, type Layout } from '../core/layout';
import { sfx } from '../core/sfx';
import { getLevel } from '../core/level';
import { getStage } from '../core/stage';
import { AUTO_AFTER_HINT_MS, DEMO_MAX_MS, HINT_AFTER_MS, TUNING } from '../core/tuning';
import { iconButton, otherPointerDown } from '../core/ui';
import { RECIPES } from '../recipes';
import { Character } from '../steps/Character';
import { Mom } from '../steps/Mom';
import { assetsReady } from './BootScene';

type P = { x: number; y: number };
type Kind = 'tomato' | 'strawberry' | 'carrot';
type Phase = 'intro' | 'seeds' | 'weeds' | 'plant' | 'water' | 'cloud' | 'snail' | 'bunny' | 'pick' | 'done';

const KINDS: Kind[] = ['tomato', 'strawberry', 'carrot'];
const G = ART.garden;
const T = TUNING.garden;
const H = T.hard;
/** Level 2: how long the can must stay over a plant that has had its fill before it pours there. */
const LINGER_MS = 450;
/** What the bunny may wish for (level 2): the pictures in the garden's own art, and Mom's name for each. */
const FOODS: { key: ImageKey; name: NameKey }[] = [
  { key: 'garden-carrot', name: 'name-carrot' },
  { key: 'garden-leaf', name: 'name-lettuce' },
  { key: 'garden-strawberry', name: 'name-strawberry' },
];

interface Spot {
  x: number;
  /** 0 hole, 1 seed in (a mound), 2 sprout, 3 young plant, 4 grown */
  stage: number;
  water: number;
  hole: Phaser.GameObjects.Image;
  plant: Phaser.GameObjects.Image | null;
  /** Level 2: the weed in the hole (pulled out before planting). */
  weed: Phaser.GameObjects.Image | null;
  /** Level 2: water poured on a plant that has had its fill (ms, it soaks away by itself), its puddle, and whether it
   *  is being poured on this frame; `said`: Mom said "That's enough water!" for this puddle. */
  wet: number;
  puddle: Phaser.GameObjects.Image | null;
  wetting: boolean;
  said: boolean;
}

interface Food {
  img: Phaser.GameObjects.Image;
  key: ImageKey;
  rest: P;
  scale: number;
  want: boolean;
}

interface Fruit {
  img: Phaser.GameObjects.Image;
  home: P;
  scale: number;
  carrot: boolean;
  /** A carrot out of the ground (it is carried like the others from then on). */
  out: boolean;
  picked: boolean;
}

/** The difficulty level (core/level.ts); `window.__gardenLevel` (the harness) wins. */
function gardenLevel(): 1 | 2 {
  const w = (window as unknown as { __gardenLevel?: number }).__gardenLevel;
  return w === 1 || w === 2 ? w : getLevel();
}

/** How many times the garden has been visited on this device (only to show Mom's demos the first time; never shown). */
function gardenRuns(): number {
  try {
    const key = 'cooking.runs.garden';
    const n = Number(localStorage.getItem(key)) || 0;
    localStorage.setItem(key, String(n + 1));
    return n;
  } catch {
    return 1;
  }
}

/**
 * The garden (research/new-stage-2-spec.md): a stage that is not cooking. Out of the kitchen door into Mom's garden:
 * pick a packet of seeds (tomato, strawberry or carrot), put a seed in each of three holes, water them with the can
 * until they come up, push the cloud off the sun so they grow and flower and fruit, give the hungry snail a leaf, and
 * pick everything into the basket (carrots are pulled up). Pipa (or Mom, on 4:3) tastes, Mom celebrates, and it goes
 * quietly home.
 *
 * Like every step: one finger owns what it holds until it is lifted; nothing is timed and nothing can go wrong (a
 * thing let go anywhere else goes gently back, three in a row show the hint); the first time Mom's hand shows each
 * part once, after HINT_AFTER_MS her hand shows it again, and after AUTO_AFTER_HINT_MS more she does one piece herself
 * ("Let me help you!") and gives it back. Every motion answers her (the cloud and the snail come as the next part).
 */
export class GardenScene extends Phaser.Scene {
  private L!: Layout;
  private phase: Phase = 'intro';
  private kind: Kind = 'tomato';
  private first = false;
  private demoOn = false;
  private hintOn = false;
  private helping = false;
  private idle = 0;
  private misses = 0;
  private leaving = false;
  private owner: Phaser.Input.Pointer | null = null;
  private held: { what: 'seed' | 'can' | 'cloud' | 'leaf' | 'fruit' | 'weed' | 'food'; img: Phaser.GameObjects.Image; fruit?: Fruit; spot?: Spot; food?: Food; dx: number; dy: number; x0: number } | null = null;
  private hard = false;
  private linger = 0;
  private lingerAt: Spot | null = null;
  /** Pipa's wish at the seeds (the kind in her bubble), if she is on screen. */
  private wish: Kind | null = null;
  private weeded = false;
  private clouds = 0;
  private bunny: Phaser.GameObjects.Image | null = null;
  private bubble: Phaser.GameObjects.Container | null = null;
  private foods: Food[] = [];
  private hand!: MomHandView;
  private mom: Mom | null = null;
  private pipa: Character | null = null;
  private bed!: { x: number; y: number; s: number; soil: number; left: number };
  private tool!: P;
  private spots: Spot[] = [];
  private packets: Phaser.GameObjects.Image[] = [];
  private packet: Phaser.GameObjects.Image | null = null;
  private can: Phaser.GameObjects.Image | null = null;
  private canRest!: P;
  private sun!: Phaser.GameObjects.Image;
  private cloud: Phaser.GameObjects.Image | null = null;
  private sunAt!: P;
  private snail: Phaser.GameObjects.Image | null = null;
  private leaf: Phaser.GameObjects.Image | null = null;
  private leafRest!: P;
  private basket: { back: Phaser.GameObjects.Image; front: Phaser.GameObjects.Image; x: number; y: number; s: number } | null = null;
  private fruits: Fruit[] = [];
  private picked = 0;
  private dropT = 0;
  private bg!: Phaser.GameObjects.Image;
  /** For the test harness. */
  shown = { phase: 'intro' as Phase, kind: '' as string, planted: 0, grown: 0, picked: 0, fruits: 0, helped: 0, missed: 0, done: false, level: 1, wish: '' as string, wishGot: false, weeds: 0, clouds: 0, puddles: 0, bunnyWant: '' as string, bunnyWrong: 0, bunnyFed: false };

  constructor() {
    super('Garden');
  }

  init() {
    this.phase = 'intro';
    this.demoOn = this.hintOn = this.helping = this.leaving = false;
    this.idle = this.misses = this.picked = this.dropT = 0;
    this.owner = null;
    this.held = null;
    this.mom = this.pipa = null;
    this.spots = [];
    this.packets = [];
    this.fruits = [];
    this.packet = this.can = this.cloud = this.snail = this.leaf = null;
    this.basket = null;
    this.hard = gardenLevel() === 2;
    this.wish = null;
    this.weeded = false;
    this.clouds = 0;
    this.bunny = null;
    this.bubble = null;
    this.foods = [];
    this.shown = { phase: 'intro', kind: '', planted: 0, grown: 0, picked: 0, fruits: 0, helped: 0, missed: 0, done: false, level: this.hard ? 2 : 1, wish: '', wishGot: false, weeds: 0, clouds: 0, puddles: 0, bunnyWant: '', bunnyWrong: 0, bunnyFed: false };
  }

  create() {
    const L = (this.L = getLayout(this));
    const { k } = L;
    keepLayoutOnResize(this, L);
    const S = getStage(L);
    this.first = gardenRuns() === 0;
    music.play('outside');

    // The garden: sky, hills, the fence and the kitchen door at the left, bottom-anchored like the kitchen.
    this.cameras.main.setBackgroundColor('#cfe6ec');
    const bg = (this.bg = this.add.image(L.cx, L.H, 'bg-garden').setOrigin(0.5, 1).setDepth(-100));
    bg.setScale(Math.max(L.H / bg.frame.realHeight, L.W / bg.frame.realWidth));

    iconButton(this, L, 'btn-home', S.home.x, S.home.y, () => this.leave('recipe'), { confirm: true, scale: S.homeScale, hitPad: 30 }).setDepth(900);
    this.hand = new MomHandView(this, L);
    touchRipples(this, L);

    // The room: from the thumb strip to Pipa (or Mom's face). A column on the left for the tools; the bed on the right.
    const petLeft = S.pet ? S.pet.x - 270 * S.pet.scale : Infinity;
    const x1 = Math.min(S.momFace.x0, petLeft) - 16 * k;
    const x0 = L.m + 16 * k;
    const toolW = 340 * k;
    this.tool = { x: x0 + toolW / 2, y: L.Y(640) };
    const bs = Math.min(k, (x1 - x0 - toolW) / 1260);
    const bedX = (x0 + toolW + x1) / 2;
    const bedY = L.H + 8 * k - (354 - 180) * bs;
    const soil = bedY + (G.soilY - 180) * bs;
    this.bed = { x: bedX, y: bedY, s: bs, soil, left: bedX - 640 * bs };
    this.add.image(bedX, bedY, 'garden-bed').setScale(bs).setDepth(10);
    this.add.image(bedX, bedY, 'garden-bed-front').setScale(bs).setDepth(25);
    this.spots = G.holes.map((hx) => {
      const x = bedX + (hx - 650) * bs;
      const hole = this.add.image(x, soil + 4 * bs, 'garden-hole').setScale(bs).setDepth(11).setAlpha(0);
      return { x, stage: 0, water: 0, hole, plant: null, weed: null, wet: 0, puddle: null, wetting: false, said: false };
    });

    // The sun, above the bed between the first two plants; the cloud will come over it.
    this.sunAt = { x: bedX - 200 * bs, y: L.Y(180) };
    this.sun = this.add.image(this.sunAt.x, this.sunAt.y, 'garden-sun').setScale(0.7 * k).setDepth(3);

    assetsReady().then(() => {
      if (!this.scene.isActive()) return;
      this.mom = new Mom(this, S.mom);
      this.mom.rest();
      this.mom.followHand(() => this.hand.active);
      if (S.pet) {
        this.pipa = new Character(this, RECIPES[0].character, S.pet, S.feedPet);
        this.pipa.enter(150);
      }
      tickles(this, () => [this.mom, this.pipa], () => !this.owner);
    });

    this.input.on(Phaser.Input.Events.POINTER_DOWN, this.onDown, this);
    this.input.on(Phaser.Input.Events.POINTER_MOVE, this.onMove, this);
    const up = (p: Phaser.Input.Pointer) => this.onUp(p, p.wasCanceled);
    const upOutside = (p: Phaser.Input.Pointer) => this.onUp(p, true);
    this.input.on(Phaser.Input.Events.POINTER_UP, up);
    this.input.on(Phaser.Input.Events.POINTER_UP_OUTSIDE, upOutside);
    const onPause = () => this.owner && this.onUp(this.owner, true);
    this.game.events.on(ORIENTATION_PAUSE, onPause);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.game.events.off(ORIENTATION_PAUSE, onPause);
      this.input.off(Phaser.Input.Events.POINTER_DOWN, this.onDown, this);
      this.input.off(Phaser.Input.Events.POINTER_MOVE, this.onMove, this);
      this.input.off(Phaser.Input.Events.POINTER_UP, up);
      this.input.off(Phaser.Input.Events.POINTER_UP_OUTSIDE, upOutside);
      waterLoop.stop();
      this.hand.destroy();
    });

    this.time.delayedCall(500, () => this.startSeeds());
  }

  // ---------------------------------------------------------------- helpers

  private say(key: VoiceKey, opts: { ttlMs?: number; done?: () => void; group?: string; sequence?: boolean } = {}) {
    voice.say(key, { ttlMs: 4000, ...opts, valid: () => this.scene.isActive() && !this.leaving });
  }

  private leave(from: 'recipe' | 'finale') {
    if (this.leaving) return;
    this.leaving = true;
    waterLoop.stop();
    if (from === 'recipe') voice.stop();
    this.scene.start('Home', { from });
  }

  private setPhase(p: Phase) {
    this.phase = p;
    this.shown.phase = p;
    this.idle = this.misses = 0;
    this.stopHint();
  }

  /** The start of a part: its line, and the first time Mom's hand shows it once (a touch ends it). */
  private begin(p: Phase, line: VoiceKey | null) {
    this.setPhase(p);
    if (line) this.say(line, { ttlMs: 5000 });
    if (this.first) this.time.delayedCall(700, () => this.phase === p && !this.owner && !this.helping && this.showWay(false));
  }

  private praise(then: () => void, wait = 900) {
    const L = this.L;
    voice.praise({ ttlMs: 5000, valid: () => this.scene.isActive() && !this.leaving });
    music.party();
    this.mom?.happy();
    this.pipa?.cheer();
    confetti(this, this.bed.x, L.Y(300), 14, 24 * L.k);
    this.time.delayedCall(900, () => this.mom?.rest());
    this.time.delayedCall(wait + 900, () => !this.leaving && then());
  }

  private fruitKey(): ImageKey {
    return this.kind === 'tomato' ? 'garden-tomato' : this.kind === 'strawberry' ? 'garden-strawberry' : 'garden-carrot';
  }

  private near(a: P, b: P, r: number) {
    return Math.hypot(a.x - b.x, a.y - b.y) < r;
  }

  private canScale() {
    return 0.62 * this.L.k;
  }

  /** The can's spout in the world (it turns with the can). */
  private spoutAt(): P {
    const c = this.can!;
    const lx = (G.spout.x - c.originX * 440) * c.scaleX;
    const ly = (G.spout.y - c.originY * 320) * c.scaleY;
    const a = Phaser.Math.DegToRad(c.angle);
    return { x: c.x + lx * Math.cos(a) - ly * Math.sin(a), y: c.y + lx * Math.sin(a) + ly * Math.cos(a) };
  }

  // ---------------------------------------------------------------- 1. the seeds

  private startSeeds() {
    const L = this.L;
    const k = L.k;
    const cx = this.bed.x;
    const s = 0.82 * k;
    const gap = Math.min(290 * k, (this.bed.s * 1260) / 3);
    this.packets = KINDS.map((kind, i) => {
      const img = this.add.image(cx + (i - 1) * gap, L.Y(470), `seed-packet-${kind}`).setScale(0).setDepth(40).setData('kind', kind);
      this.tweens.add({ targets: img, scale: s, duration: 420, delay: 120 * i, ease: 'Back.easeOut' });
      return img;
    });
    sfx(this, 'whoosh');
    this.time.delayedCall(500, () => this.begin('seeds', 'vo-garden-seeds'));
    this.time.delayedCall(1100, () => this.makeWish());
  }

  /** Pipa's wish (as in every recipe's choosing): one of the three in her bubble. Any packet is fine; hers makes her day. */
  private makeWish() {
    if (this.phase !== 'seeds' || !this.pipa || this.leaving) return;
    const k = this.L.k;
    const kind = KINDS[Phaser.Math.Between(0, KINDS.length - 1)];
    const S = getStage(this.L);
    if (!this.pipa.showWish([`garden-${kind}`], [kind], { maxRight: S.momFace.x0 - 12 * k, k })) return;
    this.wish = kind;
    this.shown.wish = kind;
    this.say('vo-pipa-wants', { ttlMs: 9000 });
    this.say(`name-${kind}` as NameKey, { ttlMs: 11000 });
  }

  /** The packet Mom's hand goes to: Pipa's wish first. */
  private wishedPacket() {
    return this.packets.find((pk) => pk.getData('kind') === this.wish) ?? null;
  }

  private pickSeeds(img: Phaser.GameObjects.Image) {
    if (this.phase !== 'seeds') return;
    this.setPhase('intro');
    this.kind = img.getData('kind') as Kind;
    this.shown.kind = this.kind;
    this.packet = img;
    sfx(this, 'pop');
    boing(this, img, 0.2);
    stars(this, img.x, img.y, 8, 50 * this.L.k);
    voice.say(`name-${this.kind}` as NameKey, { group: 'name', ttlMs: 2500 });
    this.mom?.happy();
    if (this.wish && this.kind === this.wish) {
      this.shown.wishGot = true;
      this.pipa?.wishGranted();
      this.say('vo-pipa-got-it', { ttlMs: 4000 });
    } else this.pipa?.hideWish();
    for (const other of this.packets) {
      if (other === img) continue;
      this.tweens.add({ targets: other, alpha: 0, scale: other.scale * 0.6, y: other.y - 80 * this.L.k, duration: 350, onComplete: () => other.destroy() });
    }
    // The chosen packet goes to the tool column: the seeds come from it.
    this.tweens.add({ targets: img, x: this.tool.x, y: this.L.Y(520), scale: 0.72 * this.L.k, duration: 600, delay: 400, ease: 'Sine.easeInOut' });
    this.time.delayedCall(1100, () => this.startPlant());
  }

  // ---------------------------------------------------------------- 2. planting

  private startPlant() {
    if (this.hard && !this.weeded) return this.startWeeds();
    for (const [i, sp] of this.spots.entries()) this.tweens.add({ targets: sp.hole, alpha: 1, duration: 300, delay: 150 * i });
    this.mom?.rest();
    this.begin('plant', 'vo-garden-plant');
  }

  // ---------------------------------------------------------------- 2a. the weeds (level 2)

  private weedY() {
    return this.bed.soil + 6 * this.bed.s;
  }

  /** A weed has come up in every hole: she pulls each one straight up (like a carrot) before planting. */
  private startWeeds() {
    const bs = this.bed.s;
    for (const [i, sp] of this.spots.entries()) {
      const w = this.add.image(sp.x, this.bed.soil + 300 * bs, 'garden-weed').setOrigin(0.5, G.weedTop / 320).setScale(0.9 * bs).setDepth(21);
      this.tweens.add({ targets: w, y: this.weedY(), duration: 600, delay: 220 * i, ease: 'Back.easeOut' });
      this.tweens.add({ targets: sp.hole, alpha: 1, duration: 300, delay: 220 * i });
      sp.weed = w;
    }
    sfx(this, 'whoosh');
    this.mom?.surprised();
    this.time.delayedCall(1000, () => {
      this.mom?.rest();
      this.begin('weeds', 'vo-garden-weeds');
    });
  }

  private nextWeed() {
    return this.spots.find((s) => s.weed && s !== this.held?.spot) ?? null;
  }

  /** Out it comes: soil flies, it is tossed away over the fence, Mom counts. */
  private pullWeed(sp: Spot) {
    const L = this.L;
    const w = sp.weed;
    if (!w) return;
    sp.weed = null;
    if (this.held?.spot === sp) {
      this.held = null;
      this.owner = null;
    }
    this.tweens.killTweensOf(w);
    w.setDepth(600);
    sfx(this, 'tear');
    puff(this, sp.x, this.bed.soil, 0x98663f, 6, 60 * L.k);
    burst(this, sp.x, this.bed.soil, { texture: 'fx-dot', count: 8, tint: [0x7a4e32, 0x98663f], size: 16 * L.k, speed: 280, gravityY: 700, lifespan: 500, depth: 30 });
    this.tweens.add({ targets: w, x: -300 * L.k, duration: 900, ease: 'Sine.easeIn' });
    this.tweens.add({ targets: w, y: w.y - 260 * L.k, duration: 450, yoyo: true, ease: 'Sine.easeOut' });
    this.tweens.add({ targets: w, angle: -300, alpha: 0.2, duration: 900, onComplete: () => w.destroy() });
    const n = this.spots.filter((q) => !q.weed).length;
    this.shown.weeds = n;
    this.say(countKey(n), { group: 'count', sequence: true, ttlMs: 8000 });
    this.idle = this.misses = 0;
    this.mom?.happy();
    this.time.delayedCall(700, () => this.mom?.rest());
    if (n === this.spots.length) {
      this.setPhase('intro');
      this.weeded = true;
      this.praise(() => this.startPlant(), 300);
    }
  }

  private nextHole() {
    return this.spots.find((s) => s.stage === 0) ?? null;
  }

  /** A seed goes into a hole: it drops in, the soil covers it (a mound), Mom counts. */
  private plantSeed(sp: Spot, seed?: Phaser.GameObjects.Image) {
    const L = this.L;
    const bs = this.bed.s;
    sp.stage = 1;
    const s = seed ?? this.add.image(this.packet!.x, this.packet!.y - 40 * L.k, 'garden-seed').setScale(L.k).setDepth(600);
    this.tweens.killTweensOf(s);
    this.tweens.add({
      targets: s,
      x: sp.x,
      y: this.bed.soil,
      scale: 0.9 * bs,
      duration: seed ? 180 : 420,
      ease: 'Quad.easeIn',
      onComplete: () => {
        s.destroy();
        const mound = this.add.image(sp.x, this.bed.soil + 6 * bs, 'garden-mound').setScale(bs * 0.3, bs * 0.1).setDepth(12);
        this.tweens.add({ targets: mound, scaleX: bs, scaleY: bs, duration: 320, ease: 'Back.easeOut' });
        sp.hole.setVisible(false);
        sp.plant = mound;
        sfx(this, 'squish');
        burst(this, sp.x, this.bed.soil, { texture: 'fx-dot', count: 8, tint: [0x7a4e32, 0x98663f], size: 16 * L.k, speed: 260, gravityY: 700, lifespan: 500, depth: 30 });
        const n = this.spots.filter((q) => q.stage >= 1).length;
        this.shown.planted = n;
        this.say(countKey(n), { group: 'count', sequence: true, ttlMs: 8000 });
        this.idle = 0;
        if (n === this.spots.length) this.praise(() => this.startWater());
      },
    });
  }

  // ---------------------------------------------------------------- 3. watering

  private startWater() {
    const L = this.L;
    this.tweens.add({ targets: this.packet, alpha: 0, scale: 0.4 * L.k, duration: 350 });
    this.canRest = { x: this.tool.x, y: L.Y(800) };
    this.can = this.add.image(this.canRest.x - 400 * L.k, this.canRest.y, 'watering-can').setOrigin(0.62, 0.5).setScale(this.canScale()).setDepth(40);
    this.tweens.add({ targets: this.can, x: this.canRest.x, duration: 500, ease: 'Back.easeOut' });
    sfx(this, 'whoosh');
    this.begin('water', 'vo-garden-water');
  }

  private nextDry() {
    return this.spots.find((s) => s.stage < 3) ?? null;
  }

  /** The spot the spout is over (generous), if any. */
  private underSpout(): Spot | null {
    const sp = this.spoutAt();
    if (sp.y > this.bed.soil) return null;
    let best: Spot | null = null;
    let d = 190 * this.bed.s + 40 * this.L.k;
    for (const s of this.spots) {
      // (level 2: a plant that has had its fill still gets the water, and a puddle)
      if (s.stage >= 3 && !this.hard) continue;
      const dx = Math.abs(s.x - sp.x);
      if (dx < d) {
        d = dx;
        best = s;
      }
    }
    return best;
  }

  /** Water on one plant for `ms`: drops, and it comes up: the mound sprouts, then a young plant. */
  private needMs() {
    return this.hard ? H.waterMs : T.waterMs;
  }

  /** The drops from the spout, every 70 ms of pouring. */
  private drip(ms: number) {
    const L = this.L;
    this.dropT -= ms;
    if (this.dropT > 0) return;
    this.dropT = 70;
    const at = this.spoutAt();
    const d = this.add.image(at.x + Phaser.Math.Between(-12, 12) * L.k, at.y, 'water-drop').setScale(0.22 * L.k).setDepth(45).setAlpha(0.9);
    this.tweens.add({ targets: d, y: this.bed.soil - 10 * this.bed.s, x: d.x - Phaser.Math.Between(0, 30) * L.k, duration: 380, ease: 'Quad.easeIn', onComplete: () => d.destroy() });
  }

  /**
   * Level 2: water on a plant that has had its fill. A puddle spreads and the plant droops a little; the first time
   * for this puddle Mom says "That's enough water! Now the next one." (a quiet miss). Nothing is lost: when the can
   * moves on, the puddle soaks away and the plant stands up again (`drain`).
   */
  private overWater(sp: Spot, ms: number) {
    const bs = this.bed.s;
    this.drip(ms);
    sp.wetting = true;
    sp.wet = Math.min(H.puddleMs, sp.wet + ms);
    if (!sp.puddle) {
      sp.puddle = this.add.image(sp.x, this.bed.soil + 16 * bs, 'garden-puddle').setScale(0).setDepth(12.5).setAlpha(0.95);
      sfx(this, 'squish', { volume: 0.5 });
      this.shown.puddles++;
    }
    this.wetLook(sp);
    if (!sp.said && sp.wet >= H.puddleMs * 0.45) {
      sp.said = true;
      this.say('vo-garden-enough', { ttlMs: 3000 });
      this.miss();
    }
  }

  /** The puddle's size and the plant's droop follow the water on it. */
  private wetLook(sp: Spot) {
    const bs = this.bed.s;
    const t = sp.wet / H.puddleMs;
    sp.puddle?.setScale(bs * (0.35 + 0.65 * t), bs * (0.3 + 0.7 * t));
    const young = sp.hole.getData('plant') as Phaser.GameObjects.Image | undefined;
    if (young?.active) young.setAngle(-12 * t).setScale(0.9 * bs * (1 - 0.08 * t), 0.9 * bs * (1 - 0.12 * t));
  }

  /** Every frame: a puddle not poured on soaks away, and its plant stands up again. */
  private drain(delta: number) {
    for (const sp of this.spots) {
      if (sp.wetting || !sp.puddle) {
        sp.wetting = false;
        continue;
      }
      sp.wet = Math.max(0, sp.wet - (delta * H.puddleMs) / H.drainMs);
      this.wetLook(sp);
      if (sp.wet <= 0) {
        const pd = sp.puddle;
        sp.puddle = null;
        sp.said = false;
        this.tweens.add({ targets: pd, alpha: 0, duration: 250, onComplete: () => pd.destroy() });
      }
    }
  }

  private water(sp: Spot, ms: number) {
    const L = this.L;
    const bs = this.bed.s;
    const need = this.needMs();
    const before = sp.water;
    sp.water += ms;
    this.drip(ms);
    if (before < need * T.sproutAt && sp.water >= need * T.sproutAt) {
      const sprout = this.add.image(sp.x, this.bed.soil + 10 * bs, 'garden-sprout').setOrigin(0.5, 1).setScale(0).setDepth(13);
      this.tweens.add({ targets: sprout, scale: 0.9 * bs, duration: 380, ease: 'Back.easeOut' });
      sp.stage = 2;
      sfx(this, 'pop', { volume: 0.7 });
      sp.hole.setData('sprout', sprout);
      this.idle = 0;
    }
    if (before < need && sp.water >= need) {
      (sp.hole.getData('sprout') as Phaser.GameObjects.Image | undefined)?.destroy();
      const young = this.add.image(sp.x, this.bed.soil + 12 * bs, `plant-${this.kind}-1`).setOrigin(0.5, 1).setScale(0).setDepth(13);
      this.tweens.add({ targets: young, scale: 0.9 * bs, duration: 450, ease: 'Back.easeOut' });
      sp.plant?.setDepth(12);
      sp.hole.setData('plant', young);
      sp.stage = 3;
      sfx(this, 'pop');
      stars(this, sp.x, this.bed.soil - 200 * bs, 6, 40 * L.k);
      const n = this.spots.filter((q) => q.stage >= 3).length;
      this.shown.grown = n;
      this.say(countKey(n), { group: 'count', sequence: true, ttlMs: 8000 });
      this.idle = 0;
      if (n === this.spots.length) {
        this.setPhase('intro');
        this.dropCan();
        this.say('vo-garden-sprout', { ttlMs: 4000 });
        this.praise(() => this.startCloud(), 1400);
      }
    }
  }

  private dropCan() {
    const c = this.can;
    if (!c) return;
    waterLoop.stop();
    if (this.held?.what === 'can') this.held = null;
    this.tweens.killTweensOf(c);
    this.tweens.add({ targets: c, x: this.canRest.x, y: this.canRest.y, angle: 0, duration: 380, ease: 'Back.easeOut' });
    if (this.phase === 'intro')
      this.tweens.add({ targets: c, x: this.canRest.x - 500 * this.L.k, alpha: 0, duration: 450, delay: 500, onComplete: () => c.destroy() });
  }

  // ---------------------------------------------------------------- 4. the cloud

  /** The side the cloud is pushed to in Mom's demo and help: the first one back left, a second one (level 2) right. */
  private cloudDir() {
    return this.clouds === 0 ? -1 : 1;
  }

  private startCloud() {
    const L = this.L;
    // (the first comes in from the right; a second one, level 2, from the left)
    const from = this.clouds === 0 ? L.W + 400 * L.k : -400 * L.k;
    const cl = (this.cloud = this.add.image(from, this.sunAt.y + 10 * L.k, 'garden-cloud').setScale(0.8 * L.k).setDepth(3.5));
    this.tweens.add({ targets: cl, x: this.sunAt.x, duration: 1400, ease: 'Sine.easeOut' });
    this.bg.setTint(0xffffff);
    this.tweens.addCounter({ from: 0, to: 1, duration: 1200, onUpdate: (t) => this.bg.setTint(Phaser.Display.Color.GetColor(255 - 43 * t.getValue()!, 255 - 36 * t.getValue()!, 255 - 31 * t.getValue()!)) });
    sfx(this, 'whoosh');
    this.mom?.surprised();
    this.time.delayedCall(1300, () => {
      this.mom?.rest();
      this.begin('cloud', this.clouds === 0 ? 'vo-garden-cloud' : 'vo-garden-cloud-2');
    });
  }

  /** The cloud moved (by a drag or a tap): far enough from the sun, it sails away and the sun shines. */
  private cloudMoved() {
    const cl = this.cloud;
    if (!cl || this.phase !== 'cloud') return;
    const dx = cl.x - this.sunAt.x;
    if (Math.abs(dx) < T.cloudPush * this.L.k) return;
    this.setPhase('intro');
    if (this.held?.what === 'cloud') {
      this.held = null;
      this.owner = null;
    }
    const L = this.L;
    const to = dx < 0 ? -500 * L.k : L.W + 500 * L.k;
    this.tweens.add({ targets: cl, x: to, duration: 1600, ease: 'Sine.easeIn', onComplete: () => cl.destroy() });
    this.cloud = null;
    this.tweens.addCounter({ from: 1, to: 0, duration: 800, onUpdate: (t) => this.bg.setTint(Phaser.Display.Color.GetColor(255 - 43 * t.getValue()!, 255 - 36 * t.getValue()!, 255 - 31 * t.getValue()!)) });
    this.clouds++;
    this.shown.clouds = this.clouds;
    if (this.hard && this.clouds < H.clouds) {
      // Level 2: the sun peeks out for a moment, and here comes another cloud.
      this.time.delayedCall(500, () => {
        sfx(this, 'star');
        stars(this, this.sunAt.x, this.sunAt.y, 6, 50 * L.k);
        this.mom?.happy();
        this.tweens.add({ targets: this.sun, angle: this.sun.angle + 360, duration: 800, ease: 'Sine.easeInOut' });
      });
      this.time.delayedCall(1700, () => !this.leaving && this.startCloud());
      return;
    }
    this.time.delayedCall(500, () => {
      sfx(this, 'star');
      this.tweens.add({ targets: this.sun, angle: this.sun.angle + 360, scale: 0.85 * L.k, duration: 900, ease: 'Sine.easeInOut', yoyo: false, onComplete: () => this.tweens.add({ targets: this.sun, scale: 0.7 * L.k, duration: 400 }) });
      stars(this, this.sunAt.x, this.sunAt.y, 10, 60 * L.k);
      this.mom?.happy();
      this.say('vo-garden-sun', { ttlMs: 5000 });
      this.time.delayedCall(700, () => this.grow());
    });
  }

  /** The sun: every plant grows up, flowers, and the flowers turn into fruit (carrots come up out of the soil). */
  private grow() {
    const L = this.L;
    const bs = this.bed.s;
    const ps = 0.9 * bs;
    this.fruits = [];
    this.spots.forEach((sp, i) => {
      const young = sp.hole.getData('plant') as Phaser.GameObjects.Image;
      const delay = 300 * i;
      sp.stage = 4;
      if (this.kind === 'carrot') {
        this.tweens.add({ targets: young, alpha: 0, duration: 300, delay, onComplete: () => young.destroy() });
        this.tweens.add({ targets: sp.plant, alpha: 0, duration: 300, delay });
        for (let c = 0; c < T.carrotsPerPlant; c++) {
          const x = sp.x + (c - (T.carrotsPerPlant - 1) / 2) * 90 * bs;
          const s = 0.72 * bs;
          const img = this.add.image(x, this.bed.soil + 260 * bs, 'garden-carrot').setOrigin(0.5, G.carrotTop / 420).setScale(s).setDepth(21);
          const home = { x, y: this.bed.soil + 8 * bs };
          this.tweens.add({ targets: img, y: home.y, duration: 700, delay: delay + 200 + 120 * c, ease: 'Back.easeOut' });
          this.fruits.push({ img, home, scale: s, carrot: true, out: false, picked: false });
        }
        return;
      }
      const grown = this.add.image(sp.x, this.bed.soil + 12 * bs, `plant-${this.kind}-2`).setOrigin(0.5, 1).setScale(ps * 0.3).setAlpha(0).setDepth(13);
      this.tweens.add({ targets: young, alpha: 0, duration: 400, delay, onComplete: () => young.destroy() });
      this.tweens.add({ targets: grown, alpha: 1, scale: ps, duration: 700, delay, ease: 'Back.easeOut' });
      const spots = (this.kind === 'tomato' ? G.tomatoFruits : G.strawberryFruits).slice(0, T.perPlant);
      spots.forEach(([fx, fy], j) => {
        const home = { x: sp.x + fx * ps, y: this.bed.soil + 12 * bs + fy * ps };
        const fl = this.add.image(home.x, home.y, 'garden-flower').setScale(0).setDepth(22);
        this.tweens.add({ targets: fl, scale: 0.8 * ps, duration: 300, delay: delay + 700 + 120 * j, ease: 'Back.easeOut' });
        const s = (this.kind === 'tomato' ? 0.78 : 0.82) * ps;
        const img = this.add.image(home.x, home.y, this.fruitKey()).setScale(0).setDepth(22);
        this.tweens.add({ targets: fl, scale: 0, duration: 250, delay: delay + 1700 + 120 * j, onComplete: () => fl.destroy() });
        this.tweens.add({ targets: img, scale: s, duration: 420, delay: delay + 1800 + 120 * j, ease: 'Back.easeOut' });
        this.fruits.push({ img, home, scale: s, carrot: false, out: false, picked: false });
      });
    });
    this.shown.fruits = this.fruits.length;
    this.time.delayedCall(700, () => sfx(this, 'pop', { volume: 0.6 }));
    this.time.delayedCall(2600, () => {
      sfx(this, 'star');
      for (const f of this.fruits) if (!f.carrot) stars(this, f.home.x, f.home.y, 2, 26 * L.k);
      this.praise(() => this.startSnail(), 800);
    });
  }

  // ---------------------------------------------------------------- 5. the snail

  private snailAt(): P {
    const sn = this.snail!;
    return { x: sn.x + (G.snailMouth.x - 130) * sn.scaleX, y: sn.y + (G.snailMouth.y - 95) * sn.scaleY };
  }

  private startSnail() {
    const L = this.L;
    const bs = this.bed.s;
    const s = Math.max(bs, 0.8 * L.k);
    // It comes along the soil from the left end of the bed, to the first plant.
    const y = this.bed.soil - 50 * s;
    const to = this.spots[0].x - 90 * bs;
    const sn = (this.snail = this.add.image(this.bed.left - 100 * s, y, 'garden-snail').setScale(s).setDepth(23).setFlipX(true).setAlpha(0));
    // (drawn facing left; it crawls in facing right, toward the plant, then turns to her leaf)
    this.tweens.add({ targets: sn, alpha: 1, duration: 300 });
    this.tweens.add({ targets: sn, x: to, duration: 2400, ease: 'Sine.easeOut' });
    this.tweens.add({ targets: sn, scaleX: s * 1.06, scaleY: s * 0.95, duration: 300, yoyo: true, repeat: 3 });
    this.leafRest = { x: this.tool.x, y: L.Y(800) };
    this.leaf = this.add.image(this.leafRest.x, this.leafRest.y + 300 * L.k, 'garden-leaf').setScale(0.75 * L.k).setDepth(40);
    this.tweens.add({ targets: this.leaf, y: this.leafRest.y, duration: 500, delay: 1600, ease: 'Back.easeOut' });
    this.time.delayedCall(2500, () => {
      sn.setFlipX(false);
      boing(this, sn, 0.15);
      this.begin('snail', 'vo-garden-snail');
    });
  }

  /** The leaf reached the snail: it munches it happily, then slides away with what is left. */
  private feedSnail() {
    const L = this.L;
    const sn = this.snail!;
    const lf = this.leaf!;
    this.setPhase('intro');
    this.leaf = null;
    const m = this.snailAt();
    this.tweens.killTweensOf(lf);
    this.tweens.add({ targets: lf, x: m.x - 50 * L.k, y: m.y - 10 * L.k, scale: 0.5 * L.k, angle: -20, duration: 250, ease: 'Quad.easeOut' });
    for (let i = 0; i < 3; i++) {
      this.time.delayedCall(350 + 380 * i, () => {
        sfx(this, 'munch', { volume: 0.7 });
        boing(this, sn, 0.1);
        lf.setScale(lf.scale * 0.82);
        burst(this, m.x - 30 * L.k, m.y, { texture: 'fx-dot', count: 4, tint: 0x8fcb6c, size: 12 * L.k, speed: 160, gravityY: 500, lifespan: 400, depth: 30 });
      });
    }
    this.time.delayedCall(1500, () => {
      burst(this, sn.x, sn.y - 60 * L.k, { texture: 'fx-heart', count: 5, tint: [0xf06a8a, 0xf5a3b5], size: 34 * L.k, speed: 220, gravityY: -120, lifespan: 900, depth: 60 });
      this.say('vo-garden-snail-yum', { ttlMs: 3000 });
      this.mom?.happy();
      sn.setFlipX(true);
      const away = this.bed.left - 400 * L.k;
      this.tweens.add({ targets: [sn, lf], x: `-=${sn.x - away}`, duration: 2600, delay: 400, ease: 'Sine.easeIn', onComplete: () => (sn.destroy(), lf.destroy()) });
      this.time.delayedCall(1200, () => this.praise(() => (this.hard ? this.startBunny() : this.startPick()), 400));
    });
  }

  // ---------------------------------------------------------------- 5b. the bunny (level 2)

  private bunnyMouth(): P {
    const b = this.bunny!;
    return { x: b.x + (G.bunnyMouth.x - 160) * b.scaleX, y: b.y + (G.bunnyMouth.y - 290) * b.scaleY };
  }

  /**
   * A bunny hops in and sits at the bed's left end with a thought bubble: one of three things (a carrot, a lettuce leaf,
   * a strawberry) that wait in the tool column. She carries the one it wants to its mouth. Another one: the bunny sniffs
   * it, it floats back, "The bunny wants this one!" and Mom's hand shows it at once (a quiet miss). No wrong answer
   * stays wrong; nobody is sad.
   */
  private startBunny() {
    const L = this.L;
    const k = L.k;
    const s = Math.max(this.bed.s, 0.8 * k) * 1.1;
    const x = this.bed.left + 150 * s;
    const y = this.bed.soil + 34 * this.bed.s;
    const b = (this.bunny = this.add.image(-260 * k, y, 'garden-bunny').setOrigin(0.5, 290 / 300).setScale(s).setDepth(23).setFlipX(true));
    // three hops in
    const hops = 3;
    this.tweens.add({ targets: b, x, duration: 1500, ease: 'Linear' });
    this.tweens.add({ targets: b, y: y - 70 * k, duration: 1500 / hops / 2, yoyo: true, repeat: hops - 1, ease: 'Sine.easeOut' });
    sfx(this, 'whoosh', { volume: 0.5 });
    const order = Phaser.Utils.Array.Shuffle(FOODS.slice(0, H.bunnyFoods));
    const want = order[Phaser.Math.Between(0, order.length - 1)];
    this.shown.bunnyWant = want.key;
    const fit = 170 * k;
    this.foods = order.map((f, i) => {
      const img = this.add.image(this.tool.x, 0, f.key);
      const sc = Math.min(fit / img.frame.realWidth, fit / img.frame.realHeight) * (f.key === 'garden-carrot' ? 1.25 : 1);
      const rest = { x: this.tool.x, y: L.Y(440 + i * 190) };
      img.setPosition(rest.x - 400 * k, rest.y).setScale(sc).setDepth(40).setAngle(f.key === 'garden-carrot' ? -35 : 0);
      this.tweens.add({ targets: img, x: rest.x, duration: 450, delay: 900 + 120 * i, ease: 'Back.easeOut' });
      return { img, key: f.key, rest, scale: sc, want: f === want };
    });
    this.time.delayedCall(1600, () => {
      if (this.leaving) return;
      b.setFlipX(false);
      boing(this, b, 0.12);
      this.bubble = this.thought(b.x + 110 * s, b.y - 300 * s - 110 * k, want.key);
      this.begin('bunny', 'vo-garden-bunny');
    });
  }

  /** A thought bubble with one picture in it (drawn like Pipa's), its puffs leading down-left to the head below. */
  private thought(x: number, y: number, key: ImageKey) {
    const k = this.L.k;
    const w = 220 * k;
    const h = 190 * k;
    const g = this.add.graphics();
    g.lineStyle(5 * k, 0x8a6a55, 1);
    g.fillStyle(0xfffdf7, 1);
    for (const t of [
      { x: -80 * k, y: h / 2 + 50 * k, r: 13 * k },
      { x: -50 * k, y: h / 2 + 12 * k, r: 20 * k },
    ]) {
      g.fillCircle(t.x, t.y, t.r);
      g.strokeCircle(t.x, t.y, t.r);
    }
    g.fillEllipse(0, 0, w, h);
    g.strokeEllipse(0, 0, w, h);
    const img = this.add.image(0, 0, key);
    img.setScale((140 * k) / Math.max(img.frame.realWidth, img.frame.realHeight) * (key === 'garden-carrot' ? 1.2 : 1));
    const box = this.add.container(x, y, [g, img]).setDepth(45).setScale(0);
    this.tweens.add({ targets: box, scale: 1, duration: 380, ease: 'Back.easeOut' });
    sfx(this, 'pop', { volume: 0.5 });
    return box;
  }

  private wantedFood() {
    return this.foods.find((f) => f.want) ?? null;
  }

  private foodBack(f: Food) {
    this.tweens.killTweensOf(f.img);
    this.tweens.add({ targets: f.img, x: f.rest.x, y: f.rest.y, scale: f.scale, angle: f.key === 'garden-carrot' ? -35 : 0, duration: 380, ease: 'Back.easeOut', onComplete: () => f.img.setDepth(40) });
  }

  /** Not the one in the bubble: the bunny sniffs it curiously, it floats back, and Mom shows the right one. */
  private wrongFood(f: Food) {
    const b = this.bunny!;
    this.shown.bunnyWrong++;
    boing(this, b, 0.1);
    this.tweens.add({ targets: b, angle: -6, duration: 160, yoyo: true, repeat: 1 });
    sfx(this, 'squish', { volume: 0.5 });
    this.foodBack(f);
    this.say('vo-garden-bunny-this', { ttlMs: 3000 });
    this.shown.missed++;
    this.misses = 0;
    this.idle = 0;
    this.stopHint();
    this.time.delayedCall(400, () => this.phase === 'bunny' && !this.owner && !this.helping && this.showWay(true));
  }

  /** The one it wanted: it munches it, hearts, the bubble bursts, and it hops happily away. */
  private feedBunny(f: Food) {
    const L = this.L;
    const b = this.bunny!;
    this.setPhase('intro');
    this.shown.bunnyFed = true;
    const m = this.bunnyMouth();
    this.tweens.killTweensOf(f.img);
    f.img.setDepth(24);
    this.tweens.add({ targets: f.img, x: m.x - 30 * L.k, y: m.y, scale: f.scale * 0.8, angle: f.key === 'garden-carrot' ? -80 : 0, duration: 250, ease: 'Quad.easeOut' });
    for (const o of this.foods) if (o !== f) this.tweens.add({ targets: o.img, alpha: 0, x: o.img.x - 200 * L.k, duration: 400, onComplete: () => o.img.destroy() });
    const bub = this.bubble;
    this.bubble = null;
    if (bub) {
      stars(this, bub.x, bub.y, 8, 50 * L.k);
      this.tweens.add({ targets: bub, scale: 1.25, alpha: 0, duration: 260, onComplete: () => bub.destroy() });
    }
    for (let i = 0; i < 3; i++) {
      this.time.delayedCall(350 + 380 * i, () => {
        sfx(this, 'munch', { volume: 0.7 });
        boing(this, b, 0.1);
        f.img.setScale(f.img.scale * 0.78);
        burst(this, m.x - 20 * L.k, m.y, { texture: 'fx-dot', count: 4, tint: f.key === 'garden-strawberry' ? 0xe8433a : f.key === 'garden-carrot' ? 0xf28a2e : 0x8fcb6c, size: 12 * L.k, speed: 160, gravityY: 500, lifespan: 400, depth: 30 });
      });
    }
    this.time.delayedCall(1500, () => {
      f.img.destroy();
      burst(this, b.x, b.y - 200 * b.scaleY, { texture: 'fx-heart', count: 6, tint: [0xf06a8a, 0xf5a3b5], size: 34 * L.k, speed: 220, gravityY: -120, lifespan: 900, depth: 60 });
      this.say('vo-garden-bunny-yum', { ttlMs: 3500 });
      this.mom?.happy();
      this.pipa?.cheer();
      // a happy hop on the spot, then away to the left
      this.tweens.add({ targets: b, y: b.y - 90 * L.k, duration: 220, yoyo: true, ease: 'Sine.easeOut' });
      this.time.delayedCall(700, () => {
        const y0 = b.y;
        this.tweens.add({ targets: b, x: -300 * L.k, duration: 1600, ease: 'Linear', onComplete: () => b.destroy() });
        this.tweens.add({ targets: b, y: y0 - 70 * L.k, duration: 270, yoyo: true, repeat: 2, ease: 'Sine.easeOut' });
      });
      this.time.delayedCall(1300, () => this.praise(() => this.startPick(), 400));
    });
  }

  // ---------------------------------------------------------------- 6. picking

  private startPick() {
    const L = this.L;
    const s = 0.72 * L.k;
    const x = this.tool.x;
    const y = L.Y(790);
    const back = this.add.image(x, y + 400 * L.k, 'garden-basket').setScale(s).setDepth(30);
    const front = this.add.image(x, y + 400 * L.k, 'garden-basket-front').setScale(s).setDepth(32);
    this.tweens.add({ targets: [back, front], y, duration: 500, ease: 'Back.easeOut' });
    this.basket = { back, front, x, y, s };
    this.begin('pick', this.kind === 'carrot' ? 'vo-garden-pull' : 'vo-garden-pick');
  }

  private basketIn(): P {
    const b = this.basket!;
    return { x: b.x + (G.basketIn.x - 220) * b.s, y: b.y + (G.basketIn.y - 160) * b.s };
  }

  private nextFruit() {
    return this.fruits.find((f) => !f.picked && f !== this.held?.fruit) ?? null;
  }

  /** A fruit lands in the basket: it settles on the heap, Mom counts. */
  private intoBasket(f: Fruit) {
    const L = this.L;
    const b = this.basket!;
    f.picked = true;
    const i = this.picked++;
    this.shown.picked = this.picked;
    const at = this.basketIn();
    const col = (i % 5) - 2;
    const row = Math.floor(i / 5);
    const tx = at.x + col * 52 * b.s;
    const ty = at.y - row * 30 * b.s + Math.abs(col) * 6 * b.s - (f.carrot ? 40 * b.s : 0);
    this.tweens.killTweensOf(f.img);
    f.img.setDepth(31);
    this.tweens.add({
      targets: f.img,
      x: tx,
      y: ty,
      scale: f.carrot ? 0.42 * L.k : 0.55 * L.k,
      angle: f.carrot ? 80 + col * 6 : col * 10,
      duration: 300,
      ease: 'Quad.easeOut',
      onComplete: () => {
        boing(this, b.front, 0.06);
        sfx(this, 'pop', { volume: 0.7 });
        burst(this, tx, ty, { texture: 'star', count: 4, size: 28 * L.k, speed: 260, gravityY: 500, lifespan: 500, depth: 70 });
      },
    });
    this.say(countKey(this.picked), { group: 'count', sequence: true, ttlMs: 8000 });
    this.idle = this.misses = 0;
    if (this.picked % 3 === 0) this.pipa?.cheer();
    if (this.fruits.every((q) => q.picked)) {
      this.setPhase('intro');
      this.time.delayedCall(900, () => this.finale());
    }
  }

  // ---------------------------------------------------------------- 7. the finale

  private finale() {
    const L = this.L;
    this.setPhase('done');
    this.shown.done = true;
    const b = this.basket!;
    const taste = this.fruits[this.fruits.length - 1].img;
    const eater = this.pipa?.visible ? this.pipa : null;
    const mouth = eater ? eater.mouthAt : this.mom?.mouthAt;
    if (mouth) {
      this.tweens.add({
        targets: taste,
        x: mouth.x,
        y: mouth.y,
        scale: taste.scale * 0.7,
        angle: 0,
        duration: 650,
        ease: 'Sine.easeInOut',
        onComplete: () => {
          sfx(this, 'munch');
          this.tweens.add({ targets: taste, scale: 0, duration: 250, onComplete: () => taste.destroy() });
          if (eater) this.time.delayedCall(400, () => eater.react('love'));
          else this.mom?.chew(900);
        },
      });
    }
    this.time.delayedCall(1600, () => {
      sfx(this, 'cheer-jingle');
      music.party(true); // on until home
      stars(this, b.x, b.y - 60 * L.k, 14, 70 * L.k);
      confetti(this, this.bed.x, L.Y(260), 22, 28 * L.k);
      this.mom?.celebrate();
      this.pipa?.cheer();
      let gone = false;
      const bye = () => {
        if (gone) return;
        gone = true;
        this.say('vo-bye', { ttlMs: 4000, done: () => this.time.delayedCall(1200, () => this.leave('finale')) });
        this.time.delayedCall(6000, () => this.leave('finale'));
      };
      this.say('vo-garden-done', { ttlMs: 5000, done: bye });
      this.time.delayedCall(7000, bye);
    });
  }

  // ---------------------------------------------------------------- Mom's hand: the demo, the hint, her help

  private way(): HandMotion | null {
    const L = this.L;
    const k = L.k;
    switch (this.phase) {
      case 'seeds': {
        const pk = this.wishedPacket() ?? this.packets[0];
        return tapMotion({ x: pk.x, y: pk.y }, k);
      }
      case 'weeds': {
        const sp = this.nextWeed();
        if (!sp) return null;
        const from = { x: sp.x, y: this.bed.soil - 110 * this.bed.s };
        const up = { x: sp.x, y: from.y - 260 * this.bed.s };
        return {
          kind: 'grab',
          keys: [
            { ...from, t: 0 },
            { ...from, t: 300 },
            { ...up, t: 1300 },
            { x: up.x - 120 * k, y: up.y - 40 * k, t: 1800 },
            { x: up.x - 120 * k, y: up.y - 40 * k, t: 2100 },
          ],
          props: [{ key: 'garden-weed', scale: 0.9 * this.bed.s, alpha: 0.6, originY: G.weedTop / 320, dy: 110 * this.bed.s }],
          glow: from,
        };
      }
      case 'bunny': {
        const f = this.wantedFood();
        if (!f || !this.bunny) return null;
        const to = this.bunnyMouth();
        return {
          kind: 'grab',
          keys: [
            { ...f.rest, t: 0 },
            { ...f.rest, t: 300 },
            { ...to, t: 1600 },
            { ...to, t: 2000 },
          ],
          props: [{ key: f.key, scale: f.scale, alpha: 0.6 }],
          glow: f.rest,
        };
      }
      case 'plant': {
        const h = this.nextHole();
        if (!h || !this.packet) return null;
        const from = { x: this.packet.x, y: this.packet.y };
        return {
          kind: 'grab',
          keys: [
            { ...from, t: 0 },
            { ...from, t: 300 },
            { x: h.x, y: this.bed.soil - 10 * k, t: 1500 },
            { x: h.x, y: this.bed.soil - 10 * k, t: 2000 },
          ],
          props: [{ key: 'garden-seed', scale: k, alpha: 0.6 }],
          glow: { x: h.x, y: this.bed.soil },
        };
      }
      case 'water': {
        const s = this.nextDry();
        if (!s || !this.can) return null;
        // (the hand holds the can by its body; the spout ends over the plant)
        const off = this.can.x - this.spoutAt().x;
        const over = { x: s.x + off * 0.9, y: this.bed.soil - 190 * k };
        return {
          kind: 'grab',
          keys: [
            { ...this.canRest, t: 0 },
            { ...this.canRest, t: 300 },
            { ...over, t: 1400 },
            { ...over, t: 2300 },
          ],
          props: [{ key: 'watering-can', scale: this.canScale(), alpha: 0.6, originX: 0.62, endAngle: -28, turnFrom: 1400 }],
          glow: { x: s.x, y: this.bed.soil - 40 * k },
        };
      }
      case 'cloud': {
        const c = this.cloud;
        if (!c) return null;
        const from = { x: c.x, y: c.y };
        const to = { x: c.x + this.cloudDir() * T.cloudPush * k * 1.1, y: c.y };
        return {
          kind: 'grab',
          keys: [
            { ...from, t: 0 },
            { ...from, t: 300 },
            { ...to, t: 1600 },
            { ...to, t: 1900 },
          ],
          glow: from,
        };
      }
      case 'snail': {
        if (!this.leaf || !this.snail) return null;
        const to = this.snailAt();
        return {
          kind: 'grab',
          keys: [
            { ...this.leafRest, t: 0 },
            { ...this.leafRest, t: 300 },
            { ...to, t: 1600 },
            { ...to, t: 2000 },
          ],
          props: [{ key: 'garden-leaf', scale: 0.75 * k, alpha: 0.6 }],
          glow: to,
        };
      }
      case 'pick': {
        const f = this.nextFruit();
        if (!f || !this.basket) return null;
        const into = this.basketIn();
        const keys = f.carrot && !f.out
          ? [
              { ...f.home, t: 0 },
              { ...f.home, t: 300 },
              { x: f.home.x, y: f.home.y - 260 * this.bed.s, t: 900 },
              { ...into, t: 1900 },
              { ...into, t: 2200 },
            ]
          : [
              { ...f.home, t: 0 },
              { ...f.home, t: 300 },
              { ...into, t: 1500 },
              { ...into, t: 1900 },
            ];
        return {
          kind: 'grab',
          keys,
          props: [{ key: this.fruitKey(), scale: f.scale, alpha: 0.6, originY: f.carrot ? G.carrotTop / 420 : 0.5 }],
          glow: f.home,
        };
      }
      default:
        return null;
    }
  }

  private showWay(loop: boolean) {
    const m = this.way();
    if (!m) return;
    if (!loop) {
      m.keys = m.keys.filter((q) => q.t <= DEMO_MAX_MS);
      m.glow = undefined;
      this.demoOn = true;
      this.hand.play(m, { onDone: () => (this.demoOn = false) });
      return;
    }
    this.hintOn = true;
    this.hand.play(m, { loop: true, gapMs: 900 });
  }

  private stopHint() {
    if (this.hintOn || this.demoOn) this.hand.stop();
    this.hintOn = this.demoOn = false;
  }

  /** "Let me help you!": Mom's hand does one piece of the current part, then it is hers again. */
  private help() {
    if (this.helping) return;
    const L = this.L;
    const k = L.k;
    const phase = this.phase;
    const done = () => {
      this.hand.stop();
      this.helping = false;
      this.idle = 0;
    };
    const go = (fn: () => void) => {
      this.stopHint();
      this.helping = true;
      this.shown.helped++;
      voice.say('vo-help', { ttlMs: 2500, valid: () => this.scene.isActive() && !this.leaving });
      fn();
    };
    if (phase === 'seeds') {
      const pk = this.wishedPacket() ?? this.packets[Phaser.Math.Between(0, 2)];
      return go(() => {
        this.hand.play(tapMotion({ x: pk.x, y: pk.y }, k));
        this.time.delayedCall(700, () => {
          done();
          this.pickSeeds(pk);
        });
      });
    }
    if (phase === 'weeds') {
      const sp = this.nextWeed();
      const w = sp?.weed;
      if (!sp || !w) return;
      return go(() => {
        this.hand.follow('grab', () => ({ x: w.x, y: w.y - 110 * this.bed.s }));
        this.tweens.add({ targets: w, y: this.weedY() - 260 * this.bed.s, duration: T.helpMs, delay: 250, ease: 'Sine.easeInOut', onComplete: () => (done(), this.pullWeed(sp)) });
      });
    }
    if (phase === 'bunny' && this.bunny) {
      const f = this.wantedFood();
      if (!f) return;
      return go(() => {
        f.img.setDepth(600);
        this.hand.follow('grab', () => ({ x: f.img.x, y: f.img.y }));
        const to = this.bunnyMouth();
        this.tweens.add({ targets: f.img, x: to.x, y: to.y, duration: T.helpMs, delay: 250, ease: 'Sine.easeInOut', onComplete: () => (done(), this.feedBunny(f)) });
      });
    }
    if (phase === 'plant') {
      const h = this.nextHole();
      if (!h || !this.packet) return;
      return go(() => {
        const seed = this.add.image(this.packet!.x, this.packet!.y, 'garden-seed').setScale(k).setDepth(600);
        this.hand.follow('grab', () => ({ x: seed.x, y: seed.y }));
        this.tweens.add({ targets: seed, x: h.x, y: this.bed.soil - 20 * k, duration: T.helpMs, delay: 250, ease: 'Sine.easeInOut', onComplete: () => (done(), this.plantSeed(h, seed)) });
      });
    }
    if (phase === 'water') {
      const s = this.nextDry();
      const c = this.can;
      if (!s || !c) return;
      return go(() => {
        this.hand.follow('grab', () => ({ x: c.x, y: c.y }));
        const off = c.x - this.spoutAt().x;
        this.tweens.add({
          targets: c,
          x: s.x + off * 0.9,
          y: this.bed.soil - 190 * k,
          duration: T.helpMs,
          delay: 250,
          ease: 'Sine.easeInOut',
          onComplete: () => {
            this.tweens.add({ targets: c, angle: -28, duration: 200 });
            waterLoop.start();
            this.tweens.addCounter({
              from: 0,
              to: this.needMs(),
              duration: this.needMs() + 100,
              onUpdate: (t, _v) => {
                const last = (c.getData('help') as number) ?? 0;
                const v = t.getValue()!;
                c.setData('help', v);
                if (s.stage < 3) this.water(s, v - last);
              },
              onComplete: () => {
                c.setData('help', 0);
                waterLoop.stop();
                done();
                if (this.phase === 'water') this.dropCan();
              },
            });
          },
        });
      });
    }
    if (phase === 'cloud' && this.cloud) {
      const c = this.cloud;
      return go(() => {
        this.hand.follow('grab', () => ({ x: c.x, y: c.y }));
        this.tweens.add({
          targets: c,
          x: this.sunAt.x + this.cloudDir() * (T.cloudPush + 20) * k,
          duration: T.helpMs * 1.3,
          delay: 250,
          ease: 'Sine.easeInOut',
          onComplete: () => (done(), this.cloudMoved()),
        });
      });
    }
    if (phase === 'snail' && this.leaf && this.snail) {
      const lf = this.leaf;
      return go(() => {
        this.hand.follow('grab', () => ({ x: lf.x, y: lf.y }));
        const to = this.snailAt();
        this.tweens.add({ targets: lf, x: to.x, y: to.y, duration: T.helpMs, delay: 250, ease: 'Sine.easeInOut', onComplete: () => (done(), this.feedSnail()) });
      });
    }
    if (phase === 'pick') {
      const f = this.nextFruit();
      if (!f) return;
      return go(() => {
        this.hand.follow('grab', () => ({ x: f.img.x, y: f.img.y }));
        const into = this.basketIn();
        const path = f.carrot && !f.out ? [{ x: f.home.x, y: f.home.y - 260 * this.bed.s }, into] : [into];
        f.out = true;
        f.img.setDepth(600);
        this.tweens.chain({
          targets: f.img,
          tweens: path.map((p, i) => ({ x: p.x, y: p.y, duration: i === 0 && path.length > 1 ? 500 : T.helpMs, delay: i === 0 ? 250 : 0, ease: 'Sine.easeInOut' })),
          onComplete: () => (done(), this.intoBasket(f)),
        });
        if (f.carrot) sfx(this, 'tear');
      });
    }
  }

  // ---------------------------------------------------------------- touch

  private onDown(p: Phaser.Input.Pointer) {
    if (otherPointerDown(this, p)) return;
    // Any touch ends a demo or a hint (the touch still counts for what it lands on).
    if (this.demoOn || (this.hintOn && !this.owner)) this.stopHint();
    this.idle = 0;
    if (this.owner || this.helping || this.leaving) return;
    if (inNoTouchZone(this, p.x, p.y)) return;
    const S = getStage(this.L);
    if (this.near({ x: p.worldX, y: p.worldY }, S.home, 130 * this.L.k)) return;
    const L = this.L;
    const k = L.k;
    const at = { x: p.worldX, y: p.worldY };
    const reach = (img: Phaser.GameObjects.Image, min = 100) => Math.max(min * k, Math.max(img.displayWidth, img.displayHeight) / 2);

    switch (this.phase) {
      case 'seeds': {
        const hit = this.packets.find((pk) => Math.abs(pk.x - at.x) < Math.max(110 * k, pk.displayWidth / 2 + 20 * k) && Math.abs(pk.y - at.y) < pk.displayHeight / 2 + 30 * k);
        if (hit) this.pickSeeds(hit);
        return;
      }
      case 'weeds': {
        // Take hold of a weed (its leaves or the soil around it) to pull it up.
        let best: Spot | null = null;
        let d = 140 * k;
        for (const sp of this.spots) {
          if (!sp.weed) continue;
          const dd = Math.hypot(sp.x - at.x, this.bed.soil - 90 * this.bed.s - at.y);
          if (dd < d) {
            d = dd;
            best = sp;
          }
        }
        if (!best?.weed) return;
        this.tweens.killTweensOf(best.weed);
        best.weed.setY(this.weedY());
        sfx(this, 'tap', { volume: 0.7 });
        boing(this, best.weed, 0.08);
        this.owner = p;
        this.held = { what: 'weed', img: best.weed, spot: best, dx: 0, dy: best.weed.y - at.y, x0: at.x };
        return;
      }
      case 'bunny': {
        const f = this.foods.find((q) => this.near(at, q.img, reach(q.img)));
        if (f) {
          this.tweens.killTweensOf(f.img);
          sfx(this, 'tap', { volume: 0.7 });
          this.owner = p;
          this.held = { what: 'food', img: f.img, food: f, dx: f.img.x - at.x, dy: f.img.y - at.y, x0: f.img.x };
          f.img.setDepth(600);
        } else if (this.bunny && this.near(at, this.bunny, reach(this.bunny))) {
          // It twitches its nose at her (it wants something to eat): a quiet miss.
          boing(this, this.bunny, 0.1);
          sfx(this, 'squish', { volume: 0.5 });
          this.miss();
        }
        return;
      }
      case 'plant': {
        // A tap on a hole plants there; a press on the packet takes a seed to carry.
        const hole = this.spots.find((s) => s.stage === 0 && Math.abs(s.x - at.x) < 130 * this.bed.s + 30 * k && Math.abs(this.bed.soil - at.y) < 140 * k);
        if (hole) return this.plantSeed(hole);
        if (this.packet && this.near(at, this.packet, reach(this.packet))) {
          const seed = this.add.image(at.x, at.y - 60 * k, 'garden-seed').setScale(1.2 * k).setDepth(600);
          sfx(this, 'tap', { volume: 0.7 });
          this.grabIt(p, 'seed', seed, 0, -60 * k);
        }
        return;
      }
      case 'water': {
        if (this.can && this.near(at, this.can, reach(this.can, 130))) {
          this.tweens.killTweensOf(this.can);
          sfx(this, 'tap', { volume: 0.7 });
          this.grabIt(p, 'can', this.can, this.can.x - at.x, this.can.y - at.y);
        }
        return;
      }
      case 'cloud': {
        const c = this.cloud;
        if (c && Math.abs(c.x - at.x) < c.displayWidth / 2 + 20 * k && Math.abs(c.y - at.y) < Math.max(110 * k, c.displayHeight / 2 + 20 * k)) {
          this.tweens.killTweensOf(c);
          sfx(this, 'whoosh', { volume: 0.5 });
          boing(this, c, 0.06);
          this.grabIt(p, 'cloud', c, c.x - at.x, c.y - at.y);
        }
        return;
      }
      case 'snail': {
        if (this.leaf && this.near(at, this.leaf, reach(this.leaf))) {
          this.tweens.killTweensOf(this.leaf);
          sfx(this, 'tap', { volume: 0.7 });
          this.grabIt(p, 'leaf', this.leaf, this.leaf.x - at.x, this.leaf.y - at.y);
        } else if (this.snail && this.near(at, this.snail, reach(this.snail))) {
          // The snail wiggles its eyes at her (it wants a leaf, not a tap): a quiet miss.
          boing(this, this.snail, 0.12);
          sfx(this, 'squish', { volume: 0.5 });
          this.miss();
        }
        return;
      }
      case 'pick': {
        let best: Fruit | null = null;
        let d = 110 * k;
        for (const f of this.fruits) {
          if (f.picked) continue;
          const c = f.carrot ? { x: f.home.x, y: f.home.y - 60 * this.bed.s } : f.home;
          const dd = Math.hypot(c.x - at.x, c.y - at.y);
          if (dd < d) {
            d = dd;
            best = f;
          }
        }
        if (!best) return;
        this.tweens.killTweensOf(best.img);
        best.img.setDepth(600);
        sfx(this, 'pop', { volume: 0.6 });
        if (!best.carrot) this.tweens.add({ targets: best.img, scale: best.scale * 1.15, duration: 120 });
        this.held = { what: 'fruit', img: best.img, fruit: best, dx: best.img.x - at.x, dy: best.img.y - at.y, x0: at.y };
        this.owner = p;
        return;
      }
      default:
    }
  }

  private grabIt(p: Phaser.Input.Pointer, what: 'seed' | 'can' | 'cloud' | 'leaf', img: Phaser.GameObjects.Image, dx: number, dy: number) {
    this.owner = p;
    this.held = { what, img, dx, dy, x0: img.x };
    if (what !== 'cloud') img.setDepth(600);
  }

  private onMove(p: Phaser.Input.Pointer) {
    if (p !== this.owner || !this.held) return;
    const L = this.L;
    const h = this.held;
    const x = Phaser.Math.Clamp(p.worldX + h.dx, 0, L.W);
    const y = Phaser.Math.Clamp(p.worldY + h.dy, 0, L.H);
    if (h.what === 'cloud') {
      // The cloud moves sideways with her finger (a little up and down), and goes when it is off the sun.
      h.img.x = x;
      h.img.y = Phaser.Math.Clamp(y, this.sunAt.y - 40 * L.k, this.sunAt.y + 60 * L.k);
      return this.cloudMoved();
    }
    if (h.what === 'weed') {
      // A weed comes up only straight up, until its root is out.
      const sp = h.spot!;
      const home = this.weedY();
      const up = Phaser.Math.Clamp(home - (p.worldY + h.dy), 0, 400 * this.bed.s);
      h.img.setPosition(sp.x + Phaser.Math.Clamp(p.worldX - h.x0, -12, 12) * L.k, home - up);
      if (up >= 150 * h.img.scaleY * H.weedPull) this.pullWeed(sp);
      return;
    }
    if (h.what === 'fruit' && h.fruit!.carrot && !h.fruit!.out) {
      // A carrot comes up only straight up, until enough of it is out of the ground.
      const f = h.fruit!;
      const up = Phaser.Math.Clamp(f.home.y - (p.worldY + h.dy), 0, 400 * this.bed.s);
      f.img.setPosition(f.home.x + Phaser.Math.Clamp(p.worldX + h.dx - f.home.x, -12, 12) * L.k, f.home.y - up);
      if (up >= 214 * f.scale * T.pull) {
        f.out = true;
        f.img.setDepth(600);
        sfx(this, 'tear');
        puff(this, f.home.x, this.bed.soil, 0x98663f, 6, 60 * L.k);
        burst(this, f.home.x, this.bed.soil, { texture: 'fx-dot', count: 8, tint: [0x7a4e32, 0x98663f], size: 16 * L.k, speed: 280, gravityY: 700, lifespan: 500, depth: 30 });
        this.mom?.happy();
        this.time.delayedCall(700, () => this.mom?.rest());
      }
      return;
    }
    h.img.setPosition(x, y);
    if (h.what !== 'can') sway(this, h.img, p.worldX - p.prevPosition.x, L.k);
  }

  private onUp(p: Phaser.Input.Pointer, cancelled: boolean) {
    if (p !== this.owner) return;
    const h = this.held;
    this.owner = null;
    this.held = null;
    if (!h) return;
    const L = this.L;
    const k = L.k;
    const at = { x: h.img.x, y: h.img.y };
    if (h.what !== 'cloud' && h.what !== 'weed') settle(this, h.img);
    switch (h.what) {
      case 'seed': {
        const hole = this.spots.filter((s) => s.stage === 0).sort((a, b) => Math.abs(a.x - at.x) - Math.abs(b.x - at.x))[0];
        if (!cancelled && hole && Math.abs(hole.x - at.x) < T.reach * k && Math.abs(this.bed.soil - at.y) < T.reach * k * 1.2 && this.phase === 'plant') return this.plantSeed(hole, h.img);
        if (!cancelled) this.miss();
        this.tweens.add({ targets: h.img, x: this.packet!.x, y: this.packet!.y, scale: 0.5 * k, alpha: 0, duration: 350, onComplete: () => h.img.destroy() });
        return;
      }
      case 'can':
        waterLoop.stop();
        if (this.phase === 'water') this.tweens.add({ targets: h.img, x: this.canRest.x, y: this.canRest.y, angle: 0, duration: 380, ease: 'Back.easeOut' });
        return;
      case 'weed':
        // Not out yet: it slips gently back into its hole (the pulling so far was fine, not a miss).
        this.tweens.add({ targets: h.img, x: h.spot!.x, y: this.weedY(), angle: 0, duration: 300, ease: 'Back.easeOut', onComplete: () => h.img.setDepth(21) });
        return;
      case 'food': {
        const f = h.food!;
        if (!cancelled && this.bunny && this.phase === 'bunny' && this.near(at, this.bunnyMouth(), T.reach * k)) return f.want ? this.feedBunny(f) : this.wrongFood(f);
        if (!cancelled) this.miss();
        this.foodBack(f);
        return;
      }
      case 'cloud':
        // She let go before it is off the sun: it stays where she left it (her push counts).
        return;
      case 'leaf':
        if (!cancelled && this.snail && this.phase === 'snail' && this.near(at, this.snailAt(), T.reach * k)) return this.feedSnail();
        if (!cancelled) this.miss();
        this.tweens.add({ targets: h.img, x: this.leafRest.x, y: this.leafRest.y, angle: 0, duration: 380, ease: 'Back.easeOut', onComplete: () => h.img.setDepth(40) });
        return;
      case 'fruit': {
        const f = h.fruit!;
        const b = this.basket!;
        const inBasket = this.near(at, { x: b.x, y: b.y }, T.reach * k + 40 * k);
        // A carrot that is out of the ground always goes into the basket (pulling it was the work).
        if (!cancelled && this.phase === 'pick' && (inBasket || (f.carrot && f.out))) return this.intoBasket(f);
        if (!cancelled && !f.carrot) this.miss();
        f.out = false;
        this.tweens.add({ targets: f.img, x: f.home.x, y: f.home.y, scale: f.scale, angle: 0, duration: 380, ease: 'Back.easeOut', onComplete: () => f.img.setDepth(f.carrot ? 21 : 22) });
        return;
      }
    }
  }

  private miss() {
    this.shown.missed++;
    if (++this.misses >= 3) {
      this.misses = 0;
      this.idle = 0;
      this.showWay(true);
    }
  }

  update(_t: number, delta: number) {
    // Watering: while the can is held with its spout over a plant, it tips and pours.
    if (this.held?.what === 'can' && this.can) {
      let sp = this.phase === 'water' ? this.underSpout() : null;
      // (level 2: a plant that has had its fill gets water only when the can stays over it, not when she carries the
      // can past it to the next one)
      this.linger = sp && sp.stage >= 3 && sp === this.lingerAt ? this.linger + delta : 0;
      this.lingerAt = sp;
      if (sp && sp.stage >= 3 && this.linger < LINGER_MS) sp = null;
      const want = sp ? -28 : 0;
      this.can.angle += (want - this.can.angle) * Math.min(1, delta / 90);
      if (sp && this.can.angle < -18) {
        if (!waterLoop.on) waterLoop.start();
        if (sp.stage >= 3) this.overWater(sp, delta);
        else this.water(sp, delta);
      } else if (waterLoop.on && !this.helping) waterLoop.stop();
    }
    if (this.hard) this.drain(delta);
    const p = this.owner ?? this.input.manager.pointers.find((q) => q.isDown);
    const at = this.held ? { x: this.held.img.x, y: this.held.img.y } : (this.hand.position ?? (p ? { x: p.worldX, y: p.worldY } : null));
    if (at) {
      this.mom?.lookAt(at.x, at.y);
      this.pipa?.lookAt(at.x, at.y);
    }
    const active = ['seeds', 'weeds', 'plant', 'water', 'cloud', 'snail', 'bunny', 'pick'].includes(this.phase);
    if (!active || this.helping || this.demoOn || this.owner) return;
    this.idle += delta;
    if (!this.hintOn && this.idle >= HINT_AFTER_MS) this.showWay(true);
    if (this.idle >= HINT_AFTER_MS + AUTO_AFTER_HINT_MS) this.help();
  }
}
