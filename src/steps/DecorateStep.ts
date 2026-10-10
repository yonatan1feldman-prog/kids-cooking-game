import Phaser from 'phaser';
import { countKey, voice, type NameKey } from '../core/audio';
import { TUNING } from '../core/tuning';
import { isBigChef } from '../core/level';
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

/**
 * Mom's pictures to copy (the recipe challenges, PR A, hard): [kind (0 or 1), x, y], x and y in the dish's radius from
 * its centre. A face (two eyes and a mouth), a row of three, a ring of four. On the cookies: one cookie with one of
 * each kind (where on it does not matter).
 */
const MODELS: readonly (readonly (readonly [number, number, number])[])[] = [
  [[0, -0.32, -0.22], [0, 0.32, -0.22], [1, 0, 0.34]],
  [[0, -0.45, 0], [0, 0, 0], [0, 0.45, 0]],
  [[0, 0, -0.45], [1, 0.45, 0], [0, 0, 0.45], [1, -0.45, 0]],
];
const COOKIE_MODEL: readonly (readonly [number, number, number])[] = [[0, -0.22, -0.05], [1, 0.22, 0.08]];

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

    // Only what she chose (and prepared) when the recipe had a choose step; else every item. (A choice with nothing
    // to prepare, like the cake's frosting, is not a decoration: the cake shows its own items.)
    const chosen = this.ctx.run.chosen.filter((o) => o.prep).map((o) => o.topping);
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
    if (this.params.model) this.makeModel();
    else this.makeWish();
  }

  /** Mom's picture (hard): what is on it (what each puts on the dish), where, and its card on screen. */
  private model?: { items: { key: string; bin: Bin; x: number; y: number }[]; card: Phaser.GameObjects.Container; done: boolean };

  /**
   * Mom's picture to copy (the recipe challenges, PR A, hard): a small card beside her (where Pipa's bubble would be,
   * or above the bins where Pipa is not on screen) shows two kinds of her toppings in a simple arrangement; "Look at my
   * picture! Can you make one like mine?". Whatever she makes is fine; when hers has the card's things in about their
   * places (`TUNING.big.model.near`, any order) the card sparkles, Pipa is overjoyed and Mom says "Just like mine!".
   */
  private makeModel() {
    if (!this.bins.length) return;
    const run = this.ctx.run;
    const plain = this.bins.filter((b) => !this.params.places?.[b.key as ImageKey]);
    const pool = Phaser.Utils.Array.Shuffle([...(plain.length >= 2 ? plain : this.bins)]);
    const kinds = [pool[0], pool[1] ?? pool[0]];
    const onCookies = this.params.onto === 'cookies';
    const spots = onCookies ? COOKIE_MODEL : MODELS[run.runNo % MODELS.length];
    const items = spots.map(([i, x, y]) => ({ key: this.puts(kinds[i].key), bin: kinds[i], x, y }));
    const k = this.k;
    const R = 125 * k;
    // The card: a paper square, the dish (or one cookie) on it, the things where Mom put them.
    const g = this.scene.add.graphics();
    g.fillStyle(0x3a2216, 0.18).fillRoundedRect(-R - 14 * k, -R - 8 * k, 2 * R + 28 * k, 2 * R + 28 * k, 26 * k);
    g.fillStyle(0xfffdf7, 1).fillRoundedRect(-R - 18 * k, -R - 18 * k, 2 * R + 36 * k, 2 * R + 36 * k, 26 * k);
    g.lineStyle(5 * k, 0x8a6a55, 1).strokeRoundedRect(-R - 18 * k, -R - 18 * k, 2 * R + 36 * k, 2 * R + 36 * k, 26 * k);
    const parts: Phaser.GameObjects.GameObject[] = [g];
    const cookie = onCookies ? this.cookieList[0] : undefined;
    const baseKey = cookie?.texture.key ?? this.dish.base?.texture.key;
    // (the dish's own picture; R on the card stands for its radius: the dish's, or the cookie's)
    let unit: number;
    if (baseKey) {
      const b = this.scene.add.image(0, 0, baseKey);
      if (cookie) b.setTint(cookie.tintTopLeft);
      else if (this.dish.base) b.setTint(this.dish.base.tintTopLeft);
      const bw = Math.max(b.frame.realWidth, b.frame.realHeight);
      b.setScale((2 * R * 0.96) / bw);
      parts.push(b);
      unit = cookie ? R * 0.96 * (cookie.displayWidth / 2 / (bw / 2 * cookie.scaleX)) : R * 0.96 * (this.dish.R / ((bw / 2) * (this.dish.base!.scaleX || 1)));
    } else {
      g.fillStyle(0xf3d9a4, 1).fillCircle(0, 0, R * 0.92);
      unit = R * 0.92;
    }
    // A topping's size on the card: its size on the dish, at the card's scale.
    const local = cookie ? cookie.displayWidth / 2 : this.dish.R;
    for (const it of items) {
      const size = this.params.sizes?.[it.key as ImageKey] ?? 1;
      const img = this.scene.add.image(it.x * unit, it.y * unit, it.key).setScale(k * size * (unit / local));
      parts.push(img);
    }
    const at = this.modelSpot(R + 18 * k);
    const card = this.own(this.scene.add.container(at.x, at.y, parts).setDepth(25).setScale(0));
    this.model = { items, card, done: false };
    this.scene.tweens.add({ targets: card, scale: 1, duration: 380, ease: 'Back.easeOut', delay: 250 });
    this.scene.time.delayedCall(250, () => sfx(this.scene, 'pop', { volume: 0.5 }));
    this.scene.time.delayedCall(TUNING.wish.sayAfterMs, () => {
      if (this.aborted || this.finishing) return;
      voice.say('vo-like-mine', { ttlMs: 9000, valid: () => !this.finishing && !this.model?.done });
    });
  }

  /** Where Mom's card goes: where Pipa's bubble would be (clear of Mom's face and the done button), else above the bins. */
  private modelSpot(half: number) {
    const S = this.ctx.stage;
    const k = this.k;
    const top = half + 16 * k;
    const dishRight = this.dish.x + this.dish.R * this.dish.scaleX;
    const right = Math.min(S.momFace.x0, S.done.x - 130 * k) - 12 * k;
    if (right - dishRight >= 2 * half - 120 * k) return { x: Math.max(right - half, dishRight + half - 120 * k), y: top };
    // (4:3: no room right of the dish; the top of the left column, right of the home button)
    const homeRight = S.home.x + 130 * k;
    const binTop = Math.min(...this.bins.map((b) => b.y - b.half - BIN_REACH * k));
    return { x: Math.max(homeRight + half, this.layout.m + half), y: Math.max(top, Math.min(binTop - half - 10 * k, this.layout.Y(330))) };
  }

  /** Does hers have the card's things in about their places? (any order; on the cookies: one cookie with them all) */
  private checkModel() {
    const m = this.model;
    if (!m || m.done) return;
    const tops = this.dish.toppings.list as Phaser.GameObjects.Image[];
    let ok: boolean;
    if (this.params.onto === 'cookies') {
      ok = this.cookieList.some((_c, i) => {
        const on = tops.filter((t) => t.getData('on') === i).map((t) => t.getData('key') as string);
        return m.items.every((it) => {
          const want = m.items.filter((q) => q.key === it.key).length;
          return on.filter((q) => q === it.key).length >= want;
        });
      });
    } else {
      const used = new Set<Phaser.GameObjects.Image>();
      const near = TUNING.big.model.near * this.dish.R;
      ok = m.items.every((it) => {
        const t = tops.find((q) => !used.has(q) && q.getData('key') === it.key && Phaser.Math.Distance.Between(q.x, q.y, it.x * this.dish.R, it.y * this.dish.R) <= near);
        if (t) used.add(t);
        return !!t;
      });
    }
    if (!ok) return;
    m.done = true;
    const c = m.card;
    stars(this.scene, c.x, c.y, 10, 70 * this.k);
    burst(this.scene, c.x, c.y, { count: 12, size: 18 * this.k, tint: [0xffffff, 0xffcb47], speed: 380 * this.k, gravityY: 300 });
    this.scene.tweens.add({ targets: c, scale: 1.15, duration: 200, yoyo: true, ease: 'Quad.easeOut' });
    sfx(this.scene, 'star');
    if (this.ctx.character.visible && this.ctx.character.mood === 'rest') this.ctx.character.react('love');
    voice.say('vo-same-as-mine', { ttlMs: 5000 });
  }

  /** The first thing on Mom's card that hers does not have yet (for her hand), else the first. */
  private modelNext() {
    const m = this.model!;
    const tops = this.dish.toppings.list as Phaser.GameObjects.Image[];
    const near = TUNING.big.model.near * this.dish.R;
    return m.items.find((it) => !tops.some((q) => q.getData('key') === it.key && Phaser.Math.Distance.Between(q.x, q.y, it.x * this.dish.R, it.y * this.dish.R) <= near)) ?? m.items[0];
  }

  /**
   * Pipa's wish here: `count` of what each `puts` on the dish (one kind; a big chef: two kinds); `said` = how far Mom
   * has counted it; `at` = where its pictures start in her bubble.
   */
  private wish?: { puts: string; count: number; said: number; at: number }[];

  /**
   * Pipa's counting wish (the gameplay round's small challenge): her bubble shows N of one thing (3 at first, up to 5
   * after a few runs), Mom says "Look! Pipa wants..." and the number (and its name when she has one). Mom counts each
   * one of it put on the dish, and at N Pipa is overjoyed. More is fine, fewer is fine: nothing else changes, the bubble
   * goes quietly with the done button. What she wished for in choosing comes first, when she has it here.
   * Big chef (gameplay round 5): two kinds, `TUNING.big.wish.decorate` of each ("three olives and three tomatoes"), and
   * she remembers them (the pictures leave the bubble); each one put on lights its picture up again.
   */
  private makeWish() {
    const run = this.ctx.run;
    const big = isBigChef();
    const W = big ? TUNING.big.wish.decorate : TUNING.wish.decorateCount;
    const count = W[Math.min(run.runNo, W.length - 1)];
    const keys = this.bins.map((b) => b.key);
    if (!keys.length) return;
    const first = keys.find((k) => run.wishes.includes(k)) ?? keys[Phaser.Math.Between(0, keys.length - 1)];
    const others = Phaser.Utils.Array.Shuffle(keys.filter((k) => k !== first));
    const wanted = big && others.length ? [first, others[0]] : [first];
    const S = this.ctx.stage;
    const shown = this.ctx.character.showWish(wanted, wanted, { count, maxRight: Math.min(S.momFace.x0, S.done.x - 130 * this.k) - 12 * this.k, k: this.k });
    if (!shown) return;
    this.wish = wanted.map((key, i) => ({ puts: this.puts(key), count, said: 0, at: i * count }));
    run.wishes.push(...wanted.map((key) => this.puts(key)));
    const nameOf = (key: string) => (run.chosen.find((o) => o.topping === key)?.name ?? DECORATE_NAMES[key]) as NameKey | undefined;
    this.scene.time.delayedCall(TUNING.wish.sayAfterMs, () => {
      if (this.aborted || this.finishing) return;
      voice.say('vo-pipa-wants', { ttlMs: 9000 });
      wanted.forEach((key, i) => {
        if (i > 0) voice.say('vo-and', { ttlMs: 12000 });
        voice.say(countKey(count), { ttlMs: 11000 + i * 2000 });
        const name = nameOf(key);
        if (name) voice.say(name, { ttlMs: 12000 + i * 2000 });
      });
      this.rememberWish(() => this.finishing);
    });
  }

  /** After something lands: Mom counts Pipa's wished thing on the dish, and at her number(s) the wish comes true. */
  private countWish(key: string) {
    const w = this.wish?.find((q) => q.puts === key);
    if (!w || w.said >= w.count) return;
    const n = (this.dish.toppings.list as Phaser.GameObjects.Image[]).filter((t) => t.getData('key') === key).length;
    if (n <= w.said) return;
    const was = w.said;
    w.said = Math.min(n, w.count);
    voice.say(countKey(w.said), { group: 'count', sequence: true, ttlMs: 5000 });
    // (two kinds: each one put on lights its own picture in the bubble)
    if (this.wish!.length > 1) for (let i = was; i < w.said; i++) this.ctx.character.wishFound(w.at + i);
    if (this.wish!.every((q) => q.said >= q.count)) {
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
        this.checkModel();
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
    let b = this.bins[1] ?? this.bins[0];
    const k = this.k;
    let to = { x: this.dish.x + this.dish.R * 0.2, y: this.dish.y - this.dish.R * 0.25 };
    // (hard, Mom's picture on the pizza: her hand carries one of its things to its place)
    if (this.model && !this.model.done && this.params.onto !== 'cookies') {
      const it = this.modelNext();
      b = it.bin;
      to = this.dish.toWorld(it.x * this.dish.R, it.y * this.dish.R);
    }
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
    this.ctx.character.peekWish();
    voice.say('vo-done-hint', { valid: () => !this.finishing });
    this.hand.play(this.doneTap(), { loop: true, gapMs: 1200 });
  }

  /** Mom helps: if the pizza is still bare she carries a few toppings over, then she taps done. */
  protected autoFinish() {
    this.held?.img.destroy();
    this.held = undefined;
    // (hard, Mom's picture on a bare pizza: she puts its things where they are on her card)
    const copy = this.placed === 0 && this.model && this.params.onto !== 'cookies';
    const picks: { b: Bin; to?: { x: number; y: number } }[] = this.placed > 0 ? [] : copy
      ? this.model!.items.map((it) => ({ b: it.bin, to: this.dish.toWorld(it.x * this.dish.R, it.y * this.dish.R) }))
      : Phaser.Utils.Array.Shuffle([...this.bins]).slice(0, 4).map((b) => ({ b }));
    this.hand.follow('grab', () => (this.helpCarry?.active ? { x: this.helpCarry.x, y: this.helpCarry.y } : null));
    const each = 650;
    picks.forEach(({ b, to }, i) => {
      this.scene.time.delayedCall(i * each, () => {
        const img = art(this.scene.add.image(b.x, b.y, this.puts(b.key)), this.layout, LIFT).setDepth(40);
        this.helpCarry = img;
        const a = Phaser.Math.FloatBetween(0, Math.PI * 2);
        const r = this.dish.R * this.dish.scaleX * Phaser.Math.FloatBetween(0.2, 0.7);
        this.scene.tweens.add({
          targets: img,
          x: to ? to.x : this.dish.x + Math.cos(a) * r,
          y: to ? to.y : this.dish.y + Math.sin(a) * r,
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
