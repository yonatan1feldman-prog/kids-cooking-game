import Phaser from 'phaser';
import { IMAGES } from '../core/assets';
import { boing, burst, setRestScale, stars } from '../core/fx';
import { sfx } from '../core/sfx';
import type { Taste } from '../core/tastes';
import { opaqueBounds } from '../core/placeholders';
import type { Spot } from '../core/stage';
import type { CharacterDef } from '../recipes/types';

export type Mood = 'rest' | 'expect' | 'chew' | 'happy' | 'party' | 'react';

/** How far the eyes layer shifts toward what she is watching, in frame units (600x700 frame). */
const LOOK_MAX = 14;
/** Her feet in the frame, from its centre (feet at y 684 of 700): she breathes from there. */
const FOOT = 334;

/**
 * Pipa the hedgehog, the kitchen pet, who tastes the pizza at the end. Layers share one frame and are
 * stacked at one position: body, then eyes, then mouth (the images are at frame size; the container
 * carries her scale). On phones she sits small on the counter beside Mom for the whole recipe; on 4:3
 * she is not on screen until the feeding step (`appear`). For feeding she moves to the middle and grows
 * (`moveTo`). At rest she blinks now and then and her eyes follow what is happening. Every finished step
 * gets a little hop. The feeding step drives her moods (expect, chew, party).
 */
export class Character {
  readonly box: Phaser.GameObjects.Container;
  /** Where she rests now (her frame centre) and her scale. */
  rest: { x: number; y: number };
  scale: number;
  private eyes: Phaser.GameObjects.Image;
  private mouth: Phaser.GameObjects.Image;
  private _mood: Mood = 'rest';
  private look = { x: 0, y: 0 };
  /** The mouth in frame coordinates, measured from the art. */
  private mouthLocal: { x: number; y: number };
  /** The layers, hung from her feet so she can breathe (a slow rise, like Mom's) without floating. */
  private layers: Phaser.GameObjects.Image[];
  private tickledAt = -Infinity;

  constructor(private scene: Phaser.Scene, private def: CharacterDef, at: Spot | null, hiddenAt: Spot) {
    const spot = at ?? hiddenAt;
    this.rest = { x: spot.x, y: spot.y };
    this.scale = spot.scale;
    // (every layer hangs from her feet, so she breathes without floating)
    const layer = (key: string) => new Phaser.GameObjects.Image(scene, 0, FOOT, key).setOrigin(0.5, 0.5 + FOOT / 700);
    const body = layer(def.body);
    this.eyes = layer(def.eyesOpen);
    this.mouth = layer(def.mouthClosed);
    this.layers = [body, this.eyes, this.mouth];
    this.box = scene.add.container(spot.x, spot.y, this.layers).setDepth(5).setScale(spot.scale);
    // Breathing, the one thing she does on her own besides blinking (life, not a lure: wellbeing rule 5).
    scene.tweens.add({ targets: this.layers, scaleY: 1.018, scaleX: 0.994, duration: 2100, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    this.box.setVisible(!!at);

    const [fw, fh] = IMAGES['character-mouth-open'].size;
    const b = opaqueBounds(scene, def.mouthOpen) ?? { cx: 300, cy: 440 };
    this.mouthLocal = { x: b.cx - fw / 2, y: b.cy - fh / 2 };
    this.scheduleBlink();
  }

  get mood() {
    return this._mood;
  }

  get visible() {
    return this.box.visible;
  }

  /** Her mouth at her resting spot (world coordinates): where slices go. */
  get mouthAt() {
    return { x: this.rest.x + this.mouthLocal.x * this.scale, y: this.rest.y + this.mouthLocal.y * this.scale };
  }

  /** Pops in where she rests (a small bounce). */
  enter(delay = 0) {
    this.box.setVisible(true).setScale(0);
    this.scene.tweens.add({ targets: this.box, scale: this.scale, duration: 450, delay, ease: 'Back.easeOut', onComplete: () => setRestScale(this.box) });
  }

  /** Moves (and grows) to a new resting spot; pops in there if she wasn't on screen. */
  moveTo(spot: Spot, ms = 600) {
    this.rest = { x: spot.x, y: spot.y };
    this.scale = spot.scale;
    // Her new size is her resting size from now on: an older tween (her entrance, a hop) must not undo the move,
    // and a boing during it rests at the new size.
    this.scene.tweens.killTweensOf(this.box);
    this.box.setData({ restScaleX: spot.scale, restScaleY: spot.scale });
    if (!this.box.visible) {
      this.box.setPosition(spot.x, spot.y);
      return this.enter();
    }
    this.scene.tweens.add({
      targets: this.box,
      x: spot.x,
      y: spot.y,
      scale: spot.scale,
      duration: ms,
      ease: 'Sine.easeInOut',
      onComplete: () => setRestScale(this.box),
    });
  }

  /** Random blink every few seconds while at rest. */
  private scheduleBlink() {
    this.scene.time.delayedCall(Phaser.Math.Between(2200, 5200), () => {
      if (!this.box.active) return;
      if (this._mood === 'rest') {
        this.eyes.setTexture(this.def.eyesBlink);
        this.scene.time.delayedCall(140, () => {
          if (this._mood === 'rest' && this.eyes.active) this.eyes.setTexture(this.def.eyesOpen);
        });
      }
      this.scheduleBlink();
    });
  }

  setMood(m: Mood) {
    if (this._mood === m) return;
    this._mood = m;
    const d = this.def;
    if (m === 'rest') {
      this.eyes.setTexture(d.eyesOpen);
      this.mouth.setTexture(d.mouthClosed);
    } else if (m === 'expect') {
      this.eyes.setTexture(d.eyesSurprised);
      this.mouth.setTexture(d.mouthOpen);
      boing(this.scene, this.box, 0.06);
    } else if (m === 'chew') {
      this.eyes.setTexture(d.eyesHappy);
      this.mouth.setTexture(d.mouthChew);
    } else if (m !== 'react') {
      // happy, party
      this.eyes.setTexture(d.eyesHappy);
      this.mouth.setTexture(d.mouthOpen);
    }
  }

  /**
   * How she answers what she has just eaten (core/tastes.ts), after chewing. Everything moves up and down only (beside
   * Mom's face there is no room sideways), and every reaction ends happy. Returns how long it takes (ms).
   */
  react(t: Taste): number {
    if (!this.box.visible || t === 'plain') return 0;
    const sc = this.scene;
    const d = this.def;
    const box = this.box;
    const s = this.scale;
    const k = s / 0.62;
    const head = { x: this.rest.x, y: this.rest.y - 200 * s };
    this.setMood('react');
    sc.tweens.killTweensOf(box);
    box.setScale(s).setPosition(this.rest.x, this.rest.y);
    const end = (ms: number) =>
      sc.time.delayedCall(ms, () => {
        if (this._mood === 'react') this.setMood('rest');
      });
    if (t === 'love') {
      this.eyes.setTexture(d.eyesHappy);
      this.mouth.setTexture(d.mouthOpen);
      sfx(sc, 'char-yay', { minGapMs: 0 });
      sc.tweens.add({ targets: box, y: this.rest.y - 160 * k, duration: 260, yoyo: true, repeat: 1, ease: 'Quad.easeOut' });
      burst(sc, head.x, head.y, { texture: 'fx-heart', count: 7, tint: [0xf06a8a, 0xf5a3b5], size: 46 * k, speed: 380 * k, gravityY: -120, lifespan: 1100, depth: 60 });
      end(1300);
      return 1300;
    }
    if (t === 'sneeze') {
      // Ahh... (she fills up, eyes squeezed) ... CHOO! (a squash and a puff), then a giggle.
      sfx(sc, 'pipa-sneeze', { minGapMs: 0, vary: false });
      this.eyes.setTexture(d.eyesBlink);
      this.mouth.setTexture(d.mouthOpen);
      sc.tweens.chain({
        targets: box,
        tweens: [
          { scaleY: s * 1.12, scaleX: s * 0.95, duration: 380, ease: 'Sine.easeIn' },
          { scaleY: s * 0.82, scaleX: s * 1.08, y: this.rest.y + 10 * k, duration: 90, ease: 'Quad.easeOut' },
          { scaleY: s, scaleX: s, y: this.rest.y, duration: 260, ease: 'Back.easeOut' },
        ],
      });
      sc.time.delayedCall(460, () => {
        if (!box.active) return;
        const m = this.mouthAt;
        burst(sc, m.x, m.y, { texture: 'fx-soft', count: 7, tint: 0xfff6e0, size: 60 * k, speed: 260 * k, gravityY: -200, lifespan: 700, depth: 60 });
      });
      sc.time.delayedCall(800, () => {
        if (this._mood !== 'react') return;
        this.eyes.setTexture(d.eyesHappy);
        sfx(sc, 'char-giggle', { minGapMs: 0 });
        sc.tweens.add({ targets: box, scaleY: s * 0.9, duration: 110, yoyo: true, repeat: 1, ease: 'Sine.easeInOut' });
      });
      end(1600);
      return 1600;
    }
    if (t === 'wow') {
      this.eyes.setTexture(d.eyesSurprised);
      this.mouth.setTexture(d.mouthOpen);
      sfx(sc, 'char-wow', { minGapMs: 0 });
      sc.tweens.add({ targets: box, scaleY: s * 1.1, y: this.rest.y - 30 * k, duration: 260, yoyo: true, hold: 300, ease: 'Sine.easeOut' });
      stars(sc, head.x, head.y, 6, 40 * k);
      sc.time.delayedCall(900, () => this._mood === 'react' && this.eyes.setTexture(d.eyesHappy));
      end(1300);
      return 1300;
    }
    // giggle
    this.eyes.setTexture(d.eyesHappy);
    this.mouth.setTexture(d.mouthOpen);
    sfx(sc, 'char-giggle', { minGapMs: 0 });
    sc.tweens.add({ targets: box, scaleY: s * 0.86, duration: 120, yoyo: true, repeat: 2, ease: 'Sine.easeInOut', onComplete: () => box.setScale(s) });
    end(900);
    return 900;
  }

  private wish?: { box: Phaser.GameObjects.Container; keys: string[]; items: Phaser.GameObjects.Image[] };

  /** What she wishes for right now (the keys her bubble shows), if anything. */
  get wishing() {
    return this.wish?.keys ?? [];
  }

  /**
   * Her thought bubble: the pictures of what she would like (`images`, `count` times each when she wants a number of
   * something), above her head, clear of Mom's face (`maxRight`). It pops in once, then stays still (nothing moves by
   * itself); `wishGranted` or `hideWish` ends it. Not shown where she is not on screen (4:3).
   */
  showWish(images: string[], keys: string[], opts: { count?: number; maxRight: number; k: number }) {
    this.hideWish(true);
    if (!this.box.visible || !images.length) return false;
    const sc = this.scene;
    const k = opts.k;
    const n = images.length * (opts.count ?? 1);
    // (one or two things big enough to recognise; a row of 3-5 to count a little smaller)
    const cell = n > 2 ? 96 * k : n > 1 ? 130 * k : 160 * k;
    const w = Math.max(240 * k, n * cell + 80 * k);
    const h = n > 2 ? 175 * k : 215 * k;
    const headTop = this.rest.y - (350 - 44) * this.scale;
    let x = this.rest.x - 30 * k;
    x = Math.min(x, opts.maxRight - w / 2);
    const y = Math.max(h / 2 + 12 * k, headTop - 60 * k - h / 2);
    const g = sc.add.graphics();
    const INK = 0x8a6a55;
    const PAPER = 0xfffdf7;
    // (the two small puffs lead from the bubble down to her head)
    const tail = [
      { x: this.rest.x - x - 10 * k, y: headTop - y - 22 * k, r: 13 * k },
      { x: (this.rest.x - x) * 0.6 - 5 * k, y: h / 2 + 12 * k, r: 20 * k },
    ];
    g.lineStyle(5 * k, INK, 1);
    g.fillStyle(PAPER, 1);
    for (const t of tail) {
      g.fillCircle(t.x, t.y, t.r);
      g.strokeCircle(t.x, t.y, t.r);
    }
    g.fillEllipse(0, 0, w, h);
    g.strokeEllipse(0, 0, w, h);
    const items: Phaser.GameObjects.Image[] = [];
    let i = 0;
    for (const key of images) {
      for (let c = 0; c < (opts.count ?? 1); c++, i++) {
        const img = sc.add.image(-((n - 1) * cell) / 2 + i * cell, 0, key);
        // fitted by its drawing, not its frame (whole vegetables and jars have wide empty margins)
        const ob = opaqueBounds(sc, key);
        const fw = img.frame.realWidth;
        const fh = img.frame.realHeight;
        const f = (cell * 0.92) / Math.max(ob?.w ?? fw, ob?.h ?? fh);
        img.setOrigin((ob?.cx ?? fw / 2) / fw, (ob?.cy ?? fh / 2) / fh).setScale(f);
        items.push(img);
      }
    }
    const box = sc.add.container(x, y, [g, ...items]).setDepth(6).setScale(0);
    sc.tweens.add({ targets: box, scale: 1, duration: 380, ease: 'Back.easeOut' });
    sfx(sc, 'pop', { volume: 0.5 });
    this.wish = { box, keys, items };
    return true;
  }

  /** One of several wished things was found: its picture in the bubble sparkles and fades a little. */
  wishFound(i: number) {
    const img = this.wish?.items[i];
    if (!img) return;
    const m = img.getWorldTransformMatrix();
    stars(this.scene, m.tx, m.ty, 5, 30 * (this.scale / 0.4));
    this.scene.tweens.add({ targets: img, alpha: 0.35, duration: 250 });
    boing(this.scene, img, 0.3);
  }

  /** Her wish came true: the bubble bursts into stars and she is overjoyed. */
  wishGranted() {
    const w = this.wish;
    if (!w) return;
    this.wish = undefined;
    const sc = this.scene;
    sc.tweens.killTweensOf(w.box);
    stars(sc, w.box.x, w.box.y, 10, 50 * (this.scale / 0.4));
    sc.tweens.add({ targets: w.box, scale: 1.25, alpha: 0, duration: 260, ease: 'Quad.easeOut', onComplete: () => w.box.destroy() });
    if (this._mood === 'rest' || this._mood === 'happy') this.react('love');
  }

  /** The bubble goes quietly (the step is over): nothing is said, nobody is sad. */
  hideWish(now = false) {
    const w = this.wish;
    if (!w) return;
    this.wish = undefined;
    if (now) return w.box.destroy();
    this.scene.tweens.killTweensOf(w.box);
    this.scene.tweens.add({ targets: w.box, alpha: 0, scale: 0.8, duration: 300, onComplete: () => w.box.destroy() });
  }

  /** Mouth texture while chewing (open/closed alternating). */
  chewFrame(closed: boolean) {
    this.mouth.setTexture(closed ? this.def.mouthClosed : this.def.mouthChew);
  }

  /** Eyes drift toward a world point (call every frame; eases by itself). */
  lookAt(x: number, y: number) {
    if (!this.box.visible) return;
    const dx = x - this.box.x;
    const dy = y - (this.box.y - 100 * this.scale);
    const d = Math.max(1, Math.hypot(dx, dy));
    const reach = Math.min(1, d / (300 * this.scale));
    const tx = (dx / d) * LOOK_MAX * reach;
    const ty = (dy / d) * LOOK_MAX * 0.6 * reach;
    this.look.x += (tx - this.look.x) * 0.15;
    this.look.y += (ty - this.look.y) * 0.15;
    this.eyes.setPosition(this.look.x, this.look.y + FOOT);
  }

  /** A world point on her (her frame, a little wider than her drawing, so a small Pipa is still easy to tap). */
  hit(x: number, y: number) {
    if (!this.box.visible) return false;
    const s = this.scale;
    const r = Math.max(270 * s, 110);
    return Math.abs(x - this.rest.x) < r && y > this.rest.y - 340 * s && y < this.rest.y + FOOT * s;
  }

  /** A tap on her: she giggles and squishes up and down (never sideways: Mom's face is close). */
  tickle() {
    const now = this.scene.time.now;
    if (this._mood !== 'rest' || !this.box.visible || now - this.tickledAt < 700 || this.scene.tweens.isTweening(this.box)) return;
    this.tickledAt = now;
    const d = this.def;
    this.eyes.setTexture(d.eyesHappy);
    this.mouth.setTexture(d.mouthOpen);
    sfx(this.scene, 'char-giggle', { volume: 0.8, minGapMs: 600 });
    const s = this.scale;
    this.scene.tweens.chain({
      targets: this.box,
      tweens: [
        { scaleY: s * 0.86, scaleX: s * 1.06, duration: 90, ease: 'Quad.easeOut' },
        { scaleY: s * 1.06, scaleX: s * 0.97, y: this.rest.y - 36 * s, duration: 160, ease: 'Quad.easeOut' },
        { scaleY: s, scaleX: s, y: this.rest.y, duration: 200, ease: 'Bounce.easeOut' },
      ],
    });
    burst(this.scene, this.rest.x, this.rest.y - 260 * s, { texture: 'fx-heart', count: 3, tint: [0xf06a8a, 0xf5a3b5], size: 30 * (s / 0.4), speed: 220, gravityY: -160, lifespan: 800, depth: 60 });
    this.scene.time.delayedCall(650, () => {
      if (this._mood !== 'rest' || !this.eyes.active) return;
      this.eyes.setTexture(d.eyesOpen);
      this.mouth.setTexture(d.mouthClosed);
    });
  }

  /** A short burst of joy at the end of a step: happy face and a little hop. */
  cheer() {
    if (this._mood !== 'rest' || !this.box.visible) return;
    this.setMood('happy');
    this.scene.tweens.add({ targets: this.box, y: this.rest.y - 60 * this.scale, duration: 200, yoyo: true, ease: 'Quad.easeOut' });
    this.scene.time.delayedCall(900, () => {
      if (this._mood === 'happy') this.setMood('rest');
    });
  }
}
