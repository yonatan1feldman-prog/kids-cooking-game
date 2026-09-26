import Phaser from 'phaser';
import { countKey, voice, type NameKey } from '../core/audio';
import { TUNING } from '../core/tuning';
import { boing, burst, stars } from '../core/fx';
import { sway } from '../core/juice';
import type { HandMotion } from '../core/hand';
import { art } from '../core/layout';
import { sfx } from '../core/sfx';
import { iconButton } from '../core/ui';
import type { DecorateParams } from '../recipes/types';
import { IMAGES, type ImageKey } from '../core/assets';
import type { VoiceKey } from '../core/audio';
import { clampToRadius, MADE_KEY, snapshotTexture } from './Dish';
import { Step } from './Step';
import { binIcon, binKey, moveBin, setBinVisible } from './ToppingBin';

interface Bin {
  key: string;
  x: number;
  y: number;
  bin: Phaser.GameObjects.Image;
  icon: Phaser.GameObjects.Image;
  /** Half the bin's drawn size: the touch area reaches BIN_REACH beyond it. */
  half: number;
}

const IMAGES_SIZE = (key: string) => (IMAGES[key as ImageKey]?.size ?? [140, 140]) as readonly number[];

/** How far (world units at k = 1) a bin's touch area reaches beyond its drawing (stage.ts keeps that margin free). */
const BIN_REACH = 30;

/** Mom's name for a decorating thing that no choose step named (the rest have none: she says only the number). */
const DECORATE_NAMES: Record<string, NameKey> = { 'banana-coin': 'name-banana', 'choc-chip': 'name-chocolate' };

/** Idle timings for free play: the hand only comes after 15 s, and it ends itself after 30 s. */
const DECORATE_HINT_MS = 15000;
const DECORATE_AUTO_AFTER_HINT_MS = 15000;
/** The topping drawn on its bin, relative to the bin (140 on 240: the same as in the prep steps' bins). */
const ICON = 1.1;
/** A dragged item is lifted: shown a bit bigger and above the finger so it stays visible. */
const LIFT = 1.3;
const LIFT_UP = 90;

/**
 * Free decorating: drag items from bins onto the dish. No limit, no right or wrong.
 * A drop anywhere near the dish lands on it; elsewhere the item floats back to its bin.
 * A placed item can be dragged again, or dragged off the dish to take it back.
 * The done button ends the step; the finished pizza is then captured as one image.
 */
export class DecorateStep extends Step<DecorateParams> {
  protected stepLine: VoiceKey | null = 'vo-toppings';
  private bins: Bin[] = [];
  private held?: { img: Phaser.GameObjects.Image; key: string };
  private placed = 0;
  private done?: Phaser.GameObjects.Image;
  private k = 1;
  private finishing = false;
  private donePulsed = false;
  /** The topping Mom is carrying while she helps (her hand follows it). */
  private helpCarry?: Phaser.GameObjects.Image;

  start() {
    const L = this.layout;
    this.k = L.k;
    if (this.params.line) this.stepLine = this.params.line;
    this.hintAfterMs = DECORATE_HINT_MS;
    this.autoAfterHintMs = DECORATE_AUTO_AFTER_HINT_MS;

    // Only what she chose (and prepared) when the recipe had a choose step; else every item.
    const chosen = this.ctx.run.chosen.map((o) => o.topping);
    const items = chosen.length ? chosen : this.params.items;
    const binScale = this.ctx.stage.binScale(items.length);
    items.forEach((key, i) => {
      const { x, y } = this.ctx.stage.bin(i, items.length);
      // The bin her prep step filled (waiting in the left column, or off screen) comes to its place and grows.
      const kept = this.adopt(binKey(key));
      const keptIcon = kept && binIcon(kept);
      if (kept && keptIcon) {
        this.own(keptIcon);
        setBinVisible(kept, true);
        kept.setDepth(0);
        keptIcon.setDepth(0.1);
        moveBin(this.scene, kept, x, y, binScale, 500);
        this.scene.time.delayedCall(520, () => kept.active && boing(this.scene, kept, 0.1));
        this.bins.push({ key, x, y, bin: kept, icon: keptIcon, half: (240 * binScale) / 2 });
        return;
      }
      const bin = this.own(this.scene.add.image(x, y, 'topping-bin'));
      const icon = this.own(this.scene.add.image(x, y - 8 * binScale, key));
      // (a tall thing in its box, the icing tube, at a topping's size, leaning)
      const fit = Math.min(1, 190 / Math.max(...IMAGES_SIZE(key)));
      if (fit < 1) icon.setAngle(i % 2 ? 20 : -20);
      const half = (Math.max(bin.frame.realWidth, bin.frame.realHeight) * binScale) / 2;
      this.bins.push({ key, x, y, bin, icon, half });
      for (const [o, s] of [[bin, binScale], [icon, binScale * ICON * fit]] as const) {
        o.setScale(0);
        this.scene.tweens.add({ targets: o, scale: s, duration: 400, delay: i * 70, ease: 'Back.easeOut' });
      }
    });

    // The pizza comes back to the middle (it waited aside, or off screen, during the prep).
    this.workspace('dish', 450);

    const btn = this.ctx.stage.done;
    this.done = this.own(iconButton(this.scene, L, this.params.doneButton, btn.x, btn.y, () => this.finish()));

    this.onDown((p) => {
      const placed = this.toppingAt(p.worldX, p.worldY);
      if (placed) return this.pickUp(placed, p);
      const b = this.binAt(p.worldX, p.worldY);
      if (!b) return;
      this.poke();
      sfx(this.scene, 'tap');
      boing(this.scene, b.bin, 0.15);
      const key = this.puts(b.key);
      const img = art(this.scene.add.image(p.worldX, p.worldY - LIFT_UP * this.k, key), L, 0.8).setDepth(40);
      this.scene.tweens.add({ targets: img, scale: L.k * LIFT, duration: 160, ease: 'Back.easeOut' });
      this.held = { img, key };
    });
    this.onMove((p) => {
      if (!this.held) return;
      sway(this.scene, this.held.img, p.worldX - this.held.img.x, this.k);
      this.held.img.setPosition(p.worldX, p.worldY - LIFT_UP * this.k);
      this.poke();
    });
    this.onUp((_p, cancelled) => {
      if (!this.held) return;
      const { img, key } = this.held;
      this.held = undefined;
      this.poke();
      if (!cancelled && this.dish.reach(img.x, img.y) < 1.35) this.place(img, key);
      else this.sendBack(img, key);
    });

    this.setIdle(true);
    this.makeWish();
  }

  /** Pipa's wish here: `count` of what `key` puts on the dish; `said` = how far Mom has counted. */
  private wish?: { puts: string; count: number; said: number };

  /**
   * Pipa's counting wish (the gameplay round's small challenge): her bubble shows N of one thing (3 at first, up to 5
   * after a few runs), Mom says "Look! Pipa wants..." and the number (and its name when she has one). Mom counts each
   * one of it put on the dish, and at N Pipa is overjoyed. More is fine, fewer is fine: nothing else changes, the bubble
   * goes quietly with the done button. What she wished for in choosing comes first, when she has it here.
   */
  private makeWish() {
    const run = this.ctx.run;
    const W = TUNING.wish.decorateCount;
    const count = W[Math.min(run.runNo, W.length - 1)];
    const keys = this.bins.map((b) => b.key);
    if (!keys.length) return;
    const key = keys.find((k) => run.wishes.includes(k)) ?? keys[Phaser.Math.Between(0, keys.length - 1)];
    const S = this.ctx.stage;
    const shown = this.ctx.character.showWish([key], [key], { count, maxRight: Math.min(S.momFace.x0, S.done.x - 130 * this.k) - 12 * this.k, k: this.k });
    if (!shown) return;
    this.wish = { puts: this.puts(key), count, said: 0 };
    run.wishes.push(this.puts(key));
    const name = (run.chosen.find((o) => o.topping === key)?.name ?? DECORATE_NAMES[key]) as NameKey | undefined;
    this.scene.time.delayedCall(TUNING.wish.sayAfterMs, () => {
      if (this.aborted || this.finishing) return;
      voice.say('vo-pipa-wants', { ttlMs: 9000 });
      voice.say(countKey(count), { ttlMs: 11000 });
      if (name) voice.say(name, { ttlMs: 12000 });
    });
  }

  /** After something lands: Mom counts Pipa's wished thing on the dish, and at her number the wish comes true. */
  private countWish(key: string) {
    const w = this.wish;
    if (!w || key !== w.puts || w.said >= w.count) return;
    const n = (this.dish.toppings.list as Phaser.GameObjects.Image[]).filter((t) => t.getData('key') === key).length;
    if (n <= w.said) return;
    w.said = Math.min(n, w.count);
    voice.say(countKey(w.said), { group: 'count', sequence: true, ttlMs: 5000 });
    if (w.said >= w.count) {
      this.ctx.character.wishGranted();
      voice.say('vo-pipa-got-it', { ttlMs: 5000 });
    }
  }

  /** Forgiving hit test: the nearest bin whose square reaches the finger (BIN_REACH beyond its drawing). */
  private binAt(x: number, y: number) {
    let best: Bin | undefined;
    let bestD = Infinity;
    for (const b of this.bins) {
      const r = b.half + BIN_REACH * this.k;
      if (Math.abs(x - b.x) > r || Math.abs(y - b.y) > r) continue;
      const d = Phaser.Math.Distance.Between(x, y, b.x, b.y);
      if (d < bestD) {
        bestD = d;
        best = b;
      }
    }
    return best;
  }

  /** A topping already on the dish, under the finger. */
  private toppingAt(x: number, y: number) {
    const list = this.dish.toppings.list as Phaser.GameObjects.Image[];
    let best: Phaser.GameObjects.Image | undefined;
    let bestD = Infinity;
    for (const t of list) {
      const w = this.dish.toWorld(t.x, t.y);
      const d = Phaser.Math.Distance.Between(x, y, w.x, w.y);
      if (d < bestD) {
        bestD = d;
        best = t;
      }
    }
    return best && bestD < 85 * this.k ? best : undefined;
  }

  private pickUp(t: Phaser.GameObjects.Image, p: Phaser.Input.Pointer) {
    const key = t.getData('key') as string;
    this.dish.toppings.remove(t, true);
    this.placed = Math.max(0, this.placed - 1);
    this.poke();
    sfx(this.scene, 'tap');
    const img = art(this.scene.add.image(p.worldX, p.worldY - LIFT_UP * this.k, key), this.layout, LIFT).setDepth(40);
    this.held = { img, key };
  }

  /** What an item from a box puts down (the icing tube: a blob of icing). */
  private puts(key: string) {
    return (this.params.places?.[key as ImageKey] ?? key) as string;
  }

  /** The cookies on the tray (not the cut outlines). */
  private get cookieList() {
    return (this.dish.cookies.list as Phaser.GameObjects.Image[]).filter((c) => !c.getData('cut'));
  }

  /** Where a thing let go at a local point lands: on the pizza (inside its rim), or inside the nearest cookie. */
  private landing(local: { x: number; y: number }) {
    const cookies = this.params.onto === 'cookies' ? this.cookieList : [];
    if (!cookies.length) return { spot: clampToRadius(local, this.dish.R * 0.78), on: -1 };
    let on = 0;
    let bestD = Infinity;
    cookies.forEach((c, i) => {
      const d = Phaser.Math.Distance.Between(local.x, local.y, c.x, c.y);
      if (d < bestD) {
        bestD = d;
        on = i;
      }
    });
    const c = cookies[on];
    const r = c.displayWidth * 0.28;
    const d = clampToRadius({ x: local.x - c.x, y: local.y - c.y }, r);
    return { spot: { x: c.x + d.x, y: c.y + d.y }, on };
  }

  private place(img: Phaser.GameObjects.Image, key: string) {
    const { spot, on } = this.landing(this.dish.toLocal(img.x, img.y));
    const w = this.dish.toWorld(spot.x, spot.y);
    const size = this.params.sizes?.[key as ImageKey] ?? 1;
    const iced = Object.values(this.params.places ?? {}).includes(key as ImageKey);
    this.scene.tweens.add({
      targets: img,
      x: w.x,
      y: w.y,
      scale: this.k * size * this.dish.scaleX,
      duration: 150,
      ease: 'Quad.easeOut',
      onComplete: () => {
        img.destroy();
        const t = this.dish.addTopping(key, spot.x, spot.y);
        t.setScale(this.k * size).setData('on', on);
        boing(this.scene, t, 0.35);
        sfx(this.scene, iced ? 'icing' : 'pop');
        burst(this.scene, w.x, w.y, { count: 8, size: 18 * this.k, tint: [0xffffff, 0xffcb47], speed: 350 * this.k, gravityY: 400 });
        this.placed++;
        this.countWish(key);
        // After her third topping the done button grows twice, once (an answer to what she did, not a lure).
        if (this.placed >= 3 && !this.donePulsed && this.done?.active) {
          this.donePulsed = true;
          this.scene.tweens.add({ targets: this.done, scale: this.k * 1.12, duration: 380, yoyo: true, repeat: 1, ease: 'Sine.easeInOut' });
        }
      },
    });
  }

  /** Gently back to its bin (also when the touch was lost mid-drag). */
  private sendBack(img: Phaser.GameObjects.Image, key: string) {
    const b = this.bins.find((x) => x.key === key || this.puts(x.key) === key) ?? this.bins[0];
    sfx(this.scene, 'whoosh', { volume: 0.4 });
    this.scene.tweens.add({
      targets: img,
      x: b.x,
      y: b.y,
      scale: this.k * 0.6,
      alpha: 0,
      duration: 380,
      ease: 'Sine.easeInOut',
      onComplete: () => img.destroy(),
    });
  }

  /** Done: celebrate, then capture the pizza exactly as she made it. */
  private finish() {
    if (this.finishing || this.isAuto) return;
    this.finishing = true;
    this.setIdle(false);
    this.ctx.character.hideWish();
    if (this.held) {
      const { img, key } = this.held;
      this.held = undefined;
      this.sendBack(img, key);
    }
    stars(this.scene, this.dish.x, this.dish.y, 12, 70 * this.k);
    // Let the last pops land before the snapshot.
    this.scene.time.delayedCall(450, () => {
      if (this.params.onto === 'cookies') {
        this.capturePieces().then(() => this.complete());
        return;
      }
      this.dish.capture().then((ok) => {
        if (!ok) console.warn('[decorate] capture failed: slices will use the stock art');
        this.complete();
      });
    });
  }

  /**
   * Each cookie with what is on it becomes its own picture (`cookie-made-N`, for sharing: `run.pieces`), and the whole
   * tray the photo's (MADE_KEY; the layers stay). A cookie whose picture fails is shared as the plain baked cookie.
   */
  private async capturePieces() {
    const cookies = this.cookieList;
    const tops = this.dish.toppings.list as Phaser.GameObjects.Image[];
    const pieces: NonNullable<typeof this.ctx.run.pieces> = [];
    for (const [i, c] of cookies.entries()) {
      const key = `cookie-made-${i}`;
      const copy = (o: Phaser.GameObjects.Image, dx: number, dy: number) =>
        new Phaser.GameObjects.Image(this.scene, dx, dy, o.texture.key).setScale(o.scaleX, o.scaleY).setAngle(o.angle).setTint(o.tintTopLeft);
      const objs = [copy(c, 0, 0), ...tops.filter((t) => t.getData('on') === i).map((t) => copy(t, t.x - c.x, t.y - c.y))];
      const size = Math.ceil(c.displayWidth * 1.15);
      const ok = await snapshotTexture(this.scene, key, size, objs);
      pieces.push(ok ? { key, x: c.x, y: c.y, scale: 1, tint: 0xffffff } : { key: c.texture.key, x: c.x, y: c.y, scale: c.scaleX, tint: c.tintTopLeft });
    }
    this.ctx.run.pieces = pieces;
    if (this.scene.textures.exists(MADE_KEY)) this.scene.textures.remove(MADE_KEY);
    const ok = await this.dish.capture(false);
    if (!ok) console.warn('[decorate] capture failed: the photo shows the kitchen only');
  }

  /** Mom carries a topping from a bin to the pizza; it melts away there (the pizza stays hers to fill). */
  protected demo(): HandMotion {
    const b = this.bins[1] ?? this.bins[0];
    const k = this.k;
    const to = { x: this.dish.x + this.dish.R * 0.2, y: this.dish.y - this.dish.R * 0.25 };
    return {
      kind: 'grab',
      keys: [
        { x: b.x, y: b.y, t: 0 },
        { x: b.x, y: b.y, t: 350, press: true },
        { x: to.x, y: to.y, t: 1650 },
        { x: to.x, y: to.y, t: 1950, press: true },
        { x: to.x + 40 * k, y: to.y + 30 * k, t: 2350 },
      ],
      props: [{ key: this.puts(b.key), scale: k * LIFT, fadeFrom: 1750 }],
      glow: { x: b.x, y: b.y },
    };
  }

  /** Mom's finger taps the done button, twice. */
  private doneTap(): HandMotion {
    const d = this.done!;
    return {
      kind: 'point',
      keys: [
        { x: d.x + 30 * this.k, y: d.y + 40 * this.k, t: 0 },
        { x: d.x, y: d.y, t: 400 },
        { x: d.x, y: d.y, t: 600, press: true },
        { x: d.x, y: d.y, t: 800 },
        { x: d.x, y: d.y, t: 1000, press: true },
        { x: d.x + 30 * this.k, y: d.y + 40 * this.k, t: 1500 },
      ],
      glow: { x: d.x, y: d.y },
    };
  }

  protected showHint() {
    if (this.placed === 0 || !this.done?.active) return super.showHint();
    // Something is on the pizza: Mom points at the done button and says so.
    voice.say('vo-done-hint', { valid: () => !this.finishing });
    this.hand.play(this.doneTap(), { loop: true, gapMs: 1200 });
  }

  /** Mom helps: if the pizza is still bare she carries a few toppings over, then she taps done. */
  protected autoFinish() {
    this.held?.img.destroy();
    this.held = undefined;
    const picks = this.placed > 0 ? [] : Phaser.Utils.Array.Shuffle([...this.bins]).slice(0, 4);
    this.hand.follow('grab', () => (this.helpCarry?.active ? { x: this.helpCarry.x, y: this.helpCarry.y } : null));
    const each = 650;
    picks.forEach((b, i) => {
      this.scene.time.delayedCall(i * each, () => {
        const img = art(this.scene.add.image(b.x, b.y, this.puts(b.key)), this.layout, LIFT).setDepth(40);
        this.helpCarry = img;
        const a = Phaser.Math.FloatBetween(0, Math.PI * 2);
        const r = this.dish.R * this.dish.scaleX * Phaser.Math.FloatBetween(0.2, 0.7);
        this.scene.tweens.add({
          targets: img,
          x: this.dish.x + Math.cos(a) * r,
          y: this.dish.y + Math.sin(a) * r,
          duration: 480,
          ease: 'Sine.easeInOut',
          onComplete: () => this.place(img, this.puts(b.key)),
        });
      });
    });
    this.scene.time.delayedCall(picks.length * each + 300, () => {
      if (!this.done?.active) return this.finishByHelp();
      this.hand.play(this.doneTap(), { onDone: () => this.finishByHelp() });
      this.scene.time.delayedCall(1000, () => this.done?.active && boing(this.scene, this.done, 0.15));
    });
  }

  private finishByHelp() {
    this.finishing = false;
    this.resumeAfterAuto();
    this.finish();
  }
}
