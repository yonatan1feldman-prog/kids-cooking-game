import Phaser from 'phaser';
import { boing, burst, stars } from '../core/fx';
import { fit, MIN_DRAG_SHARE } from '../core/layout';
import { sfx } from '../core/sfx';
import { iconButton } from '../core/ui';
import type { DecorateParams } from '../recipes/types';
import { clampToRadius } from './Dish';
import { Step } from './Step';

interface Tray {
  key: string;
  x: number;
  y: number;
  tray: Phaser.GameObjects.Image;
  icon: Phaser.GameObjects.Image;
}

/**
 * Free decorating: drag items from trays onto the dish. No limit, no right or
 * wrong. A drop anywhere near the dish lands on it; elsewhere the item floats
 * back to its tray. The done button ends the step.
 */
export class DecorateStep extends Step<DecorateParams> {
  private trays: Tray[] = [];
  private held?: { img: Phaser.GameObjects.Image; from: Tray };
  private placed = 0;
  private done?: Phaser.GameObjects.Image;
  private placedSize = 0;
  private heldSize = 0;

  start() {
    const { u, W, H, safeBottom } = this.layout;
    const R = this.dish.R;
    const items = this.params.items;
    const cols = Math.min(3, items.length);
    const rows = Math.ceil(items.length / cols);
    const traySize = Math.max(u * 0.24, W * MIN_DRAG_SHARE);
    const gap = traySize * 0.08;
    const top = H * 0.11;

    this.heldSize = Math.max(u * 0.17, W * MIN_DRAG_SHARE);
    this.placedSize = R * 0.36;

    items.forEach((key, i) => {
      const row = Math.floor(i / cols);
      const col = i % cols;
      const inRow = Math.min(cols, items.length - row * cols);
      const x = this.layout.cx + (col - (inRow - 1) / 2) * (traySize + gap);
      const y = top + traySize / 2 + row * (traySize + gap);
      const tray = this.own(this.scene.add.image(x, y, this.params.tray));
      fit(tray, traySize);
      const icon = this.own(this.scene.add.image(x, y, key));
      fit(icon, traySize * 0.62);
      const t: Tray = { key, x, y, tray, icon };
      this.trays.push(t);
      for (const o of [tray, icon]) {
        const s = o.scale;
        o.setScale(0);
        this.scene.tweens.add({ targets: o, scale: s, duration: 400, delay: i * 70, ease: 'Back.easeOut' });
      }
    });

    // Fit the dish between the trays and the done button.
    const traysBottom = top + rows * traySize + (rows - 1) * gap;
    const btnSize = u * 0.2;
    const room = safeBottom - btnSize * 1.1 - (traysBottom + u * 0.03);
    const scale = Math.min(1, room / (R * 2));
    const dishY = traysBottom + u * 0.03 + R * scale;
    this.scene.tweens.add({ targets: this.dish, x: this.layout.cx, y: dishY, scale, duration: 500, ease: 'Sine.easeInOut' });

    const btnY = Math.min(dishY + R * scale + btnSize * 0.6, safeBottom - btnSize * 0.55);
    this.done = this.own(iconButton(this.scene, this.params.doneButton, this.layout.cx + R * scale * 0.95, btnY, btnSize, () => this.finish()));

    this.onDown((p) => {
      const t = this.trayAt(p.worldX, p.worldY);
      if (!t) return;
      this.poke();
      sfx(this.scene, 'tap');
      boing(this.scene, t.tray, 0.15);
      const img = this.scene.add.image(p.worldX, p.worldY - u * 0.05, t.key).setDepth(40);
      fit(img, this.heldSize);
      const s = img.scale;
      img.setScale(s * 0.6);
      this.scene.tweens.add({ targets: img, scale: s, duration: 180, ease: 'Back.easeOut' });
      this.held = { img, from: t };
    });
    this.onMove((p) => {
      if (!this.held) return;
      this.held.img.setPosition(p.worldX, p.worldY - u * 0.05);
      this.poke();
    });
    this.onUp(() => {
      if (!this.held) return;
      const { img, from } = this.held;
      this.held = undefined;
      if (this.dish.reach(img.x, img.y) < 1.4) this.place(img, from.key);
      else this.sendBack(img, from);
    });

    this.setIdle(true);
  }

  /** Forgiving hit test: nearest tray within 0.7 tray widths. */
  private trayAt(x: number, y: number) {
    let best: Tray | undefined;
    let bestD = Infinity;
    for (const t of this.trays) {
      const d = Phaser.Math.Distance.Between(x, y, t.x, t.y);
      if (d < bestD) {
        bestD = d;
        best = t;
      }
    }
    return best && bestD < best.tray.displayWidth * 0.7 ? best : undefined;
  }

  private place(img: Phaser.GameObjects.Image, key: string) {
    const spot = clampToRadius(this.dish.toLocal(img.x, img.y), this.dish.R * 0.78);
    const wx = this.dish.x + spot.x * this.dish.scaleX;
    const wy = this.dish.y + spot.y * this.dish.scaleY;
    const endScale = (this.placedSize * this.dish.scaleX) / img.frame.realWidth;
    this.scene.tweens.add({
      targets: img,
      x: wx,
      y: wy,
      scale: endScale,
      duration: 160,
      ease: 'Quad.easeOut',
      onComplete: () => {
        img.destroy();
        const t = this.dish.addTopping(key, spot.x, spot.y, this.placedSize);
        boing(this.scene, t, 0.35);
        sfx(this.scene, 'pop');
        burst(this.scene, wx, wy, { count: 8, size: 18, tint: [0xffffff, 0xffe066], speed: 350, gravityY: 400 });
        this.placed++;
        if (this.placed === 3 && this.done) {
          const s = this.done.scale;
          this.scene.tweens.add({ targets: this.done, scale: s * 1.12, duration: 600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
        }
      },
    });
  }

  private sendBack(img: Phaser.GameObjects.Image, from: Tray) {
    sfx(this.scene, 'whoosh', { volume: 0.4 });
    this.scene.tweens.add({
      targets: img,
      x: from.x,
      y: from.y,
      scale: img.scale * 0.5,
      alpha: 0,
      duration: 350,
      ease: 'Quad.easeIn',
      onComplete: () => img.destroy(),
    });
  }

  private finish() {
    if (this.isAuto) return;
    this.held?.img.destroy();
    this.held = undefined;
    stars(this.scene, this.dish.x, this.dish.y, 10, this.layout.u * 0.06);
    this.complete();
  }

  protected showHint() {
    const t = this.trays[Math.floor(this.trays.length / 2)] ?? this.trays[0];
    this.hand.drag({ x: t.x, y: t.y }, { x: this.dish.x, y: this.dish.y });
  }

  protected autoFinish() {
    const picks = Phaser.Utils.Array.Shuffle([...this.trays]).slice(0, 5);
    picks.forEach((t, i) => {
      this.scene.time.delayedCall(i * 260, () => {
        const img = this.scene.add.image(t.x, t.y, t.key).setDepth(40);
        fit(img, this.heldSize);
        const a = Phaser.Math.FloatBetween(0, Math.PI * 2);
        const r = this.dish.R * this.dish.scaleX * Phaser.Math.FloatBetween(0.2, 0.7);
        this.scene.tweens.add({
          targets: img,
          x: this.dish.x + Math.cos(a) * r,
          y: this.dish.y + Math.sin(a) * r,
          duration: 380,
          ease: 'Sine.easeInOut',
          onComplete: () => this.place(img, t.key),
        });
      });
    });
    this.scene.time.delayedCall(picks.length * 260 + 700, () => {
      stars(this.scene, this.dish.x, this.dish.y, 10, this.layout.u * 0.06);
      this.complete();
    });
  }
}
