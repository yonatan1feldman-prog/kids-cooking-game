import Phaser from 'phaser';
import { UI_BIN } from '../core/assets';
import { boing, burst, stars } from '../core/fx';
import { art } from '../core/layout';
import { sfx } from '../core/sfx';
import { iconButton } from '../core/ui';
import type { DecorateParams } from '../recipes/types';
import { clampToRadius } from './Dish';
import { Step } from './Step';

interface Bin {
  key: string;
  x: number;
  y: number;
  bin: Phaser.GameObjects.Image;
  icon: Phaser.GameObjects.Image;
}

/** Idle timings for free play: the hand only comes after 15 s, and it ends itself after 30 s. */
const DECORATE_HINT_MS = 15000;
const DECORATE_AUTO_AFTER_HINT_MS = 15000;
/** A dragged item is lifted: shown a bit bigger and above the finger so it stays visible. */
const LIFT = 1.3;
const LIFT_UP = 90;
/** Layout (design coordinates): bin rows start below the home button; the pizza moves down a bit. */
const BINS_TOP = 400;
const DISH_AT = { x: 540, y: 1175 };
const DONE_AT = { x: 860, y: 1610 };

/**
 * Free decorating: drag items from bins onto the dish. No limit, no right or wrong.
 * A drop anywhere near the dish lands on it; elsewhere the item floats back to its bin.
 * A placed item can be dragged again, or dragged off the dish to take it back.
 * The done button ends the step; the finished pizza is then captured as one image.
 */
export class DecorateStep extends Step<DecorateParams> {
  private bins: Bin[] = [];
  private held?: { img: Phaser.GameObjects.Image; key: string };
  private placed = 0;
  private done?: Phaser.GameObjects.Image;
  private k = 1;
  private finishing = false;
  private donePulsing = false;

  start() {
    const L = this.layout;
    this.k = L.k;
    this.hintAfterMs = DECORATE_HINT_MS;
    this.autoAfterHintMs = DECORATE_AUTO_AFTER_HINT_MS;

    const items = this.params.items;
    const cols = 3;
    items.forEach((key, i) => {
      const row = Math.floor(i / cols);
      const col = i % cols;
      const inRow = Math.min(cols, items.length - row * cols);
      const { x, y } = L.P(540 + (col - (inRow - 1) / 2) * 290, BINS_TOP + row * 260);
      const bin = this.own(art(this.scene.add.image(x, y, UI_BIN), L));
      const icon = this.own(art(this.scene.add.image(x, y - 8 * L.k, key), L));
      this.bins.push({ key, x, y, bin, icon });
      for (const o of [bin, icon]) {
        o.setScale(0);
        this.scene.tweens.add({ targets: o, scale: L.k, duration: 400, delay: i * 70, ease: 'Back.easeOut' });
      }
      // Gentle idle wiggle: these are the things you can grab.
      this.scene.tweens.add({ targets: icon, angle: { from: -6, to: 6 }, duration: 900 + i * 60, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    });

    const to = L.P(DISH_AT.x, DISH_AT.y);
    this.scene.tweens.add({ targets: [this.dish, this.ctx.board], x: to.x, y: to.y, duration: 450, ease: 'Sine.easeInOut' });

    const btn = L.P(DONE_AT.x, DONE_AT.y);
    this.done = this.own(iconButton(this.scene, L, this.params.doneButton, btn.x, btn.y, () => this.finish()));

    this.onDown((p) => {
      const placed = this.toppingAt(p.worldX, p.worldY);
      if (placed) return this.pickUp(placed, p);
      const b = this.binAt(p.worldX, p.worldY);
      if (!b) return;
      this.poke();
      sfx(this.scene, 'tap');
      boing(this.scene, b.bin, 0.15);
      const img = art(this.scene.add.image(p.worldX, p.worldY - LIFT_UP * this.k, b.key), L, 0.8).setDepth(40);
      this.scene.tweens.add({ targets: img, scale: L.k * LIFT, duration: 160, ease: 'Back.easeOut' });
      this.held = { img, key: b.key };
    });
    this.onMove((p) => {
      if (!this.held) return;
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
  }

  /** Forgiving hit test: the nearest bin wins, reaching 120 design px beyond its edge. */
  private binAt(x: number, y: number) {
    let best: Bin | undefined;
    let bestD = Infinity;
    for (const b of this.bins) {
      const d = Phaser.Math.Distance.Between(x, y, b.x, b.y);
      if (d < bestD) {
        bestD = d;
        best = b;
      }
    }
    return best && bestD < 240 * this.k ? best : undefined;
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

  private place(img: Phaser.GameObjects.Image, key: string) {
    const spot = clampToRadius(this.dish.toLocal(img.x, img.y), this.dish.R * 0.78);
    const w = this.dish.toWorld(spot.x, spot.y);
    this.scene.tweens.add({
      targets: img,
      x: w.x,
      y: w.y,
      scale: this.k * this.dish.scaleX,
      duration: 150,
      ease: 'Quad.easeOut',
      onComplete: () => {
        img.destroy();
        const t = this.dish.addTopping(key, spot.x, spot.y);
        boing(this.scene, t, 0.35);
        sfx(this.scene, 'pop');
        burst(this.scene, w.x, w.y, { count: 8, size: 18 * this.k, tint: [0xffffff, 0xffcb47], speed: 350 * this.k, gravityY: 400 });
        this.placed++;
        if (this.placed >= 3 && !this.donePulsing && this.done?.active) {
          this.donePulsing = true;
          this.scene.tweens.add({ targets: this.done, scale: this.k * 1.12, duration: 600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
        }
      },
    });
  }

  /** Gently back to its bin (also when the touch was lost mid-drag). */
  private sendBack(img: Phaser.GameObjects.Image, key: string) {
    const b = this.bins.find((x) => x.key === key) ?? this.bins[0];
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
    if (this.held) {
      const { img, key } = this.held;
      this.held = undefined;
      this.sendBack(img, key);
    }
    stars(this.scene, this.dish.x, this.dish.y, 12, 70 * this.k);
    // Let the last pops land before the snapshot.
    this.scene.time.delayedCall(450, () => {
      this.dish.capture().then((ok) => {
        if (!ok) console.warn('[decorate] capture failed: slices will use the stock art');
        this.complete();
      });
    });
  }

  protected showHint() {
    if (this.placed === 0) {
      // Nothing on the pizza yet: show how to drag a topping first.
      const b = this.bins[1] ?? this.bins[0];
      this.hand.drag({ x: b.x, y: b.y }, { x: this.dish.x, y: this.dish.y });
    } else if (this.done) {
      this.hand.tap({ x: this.done.x, y: this.done.y });
    }
  }

  protected autoFinish() {
    this.held?.img.destroy();
    this.held = undefined;
    const picks = this.placed > 0 ? [] : Phaser.Utils.Array.Shuffle([...this.bins]).slice(0, 5);
    picks.forEach((b, i) => {
      this.scene.time.delayedCall(i * 260, () => {
        const img = art(this.scene.add.image(b.x, b.y, b.key), this.layout, LIFT).setDepth(40);
        const a = Phaser.Math.FloatBetween(0, Math.PI * 2);
        const r = this.dish.R * this.dish.scaleX * Phaser.Math.FloatBetween(0.2, 0.7);
        this.scene.tweens.add({
          targets: img,
          x: this.dish.x + Math.cos(a) * r,
          y: this.dish.y + Math.sin(a) * r,
          duration: 380,
          ease: 'Sine.easeInOut',
          onComplete: () => this.place(img, b.key),
        });
      });
    });
    this.scene.time.delayedCall(picks.length * 260 + 500, () => {
      this.finishing = false;
      this.resumeAfterAuto();
      this.finish();
    });
  }
}
