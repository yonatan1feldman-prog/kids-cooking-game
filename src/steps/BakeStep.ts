import Phaser from 'phaser';
import { ART, IMAGES } from '../core/assets';
import { boing, puff, stars } from '../core/fx';
import { sfx } from '../core/sfx';
import type { BakeParams } from '../recipes/types';
import { Step } from './Step';

type Phase = 'toOven' | 'baking' | 'ready' | 'out';

/**
 * Baking: the oven stands left of the dish, side by side. Drag the dish into the open oven. The door closes and the pizza is seen
 * through the oven window (layers: oven-inside, pizza, oven-closed), slowly turning
 * golden while the oven glows. A ding, then a tap opens it and the pizza comes out.
 */
export class BakeStep extends Step<BakeParams> {
  private open!: Phaser.GameObjects.Image;
  private inside!: Phaser.GameObjects.Image;
  private closed!: Phaser.GameObjects.Image;
  private phase: Phase = 'toOven';
  private dragging = false;
  private grab = { dx: 0, dy: 0 };
  private rest = { x: 0, y: 0 };
  private loops: (Phaser.Tweens.Tween | Phaser.Time.TimerEvent)[] = [];
  private k = 1;
  /** The oven's own scale (it fills the room left of the board). */
  private os = 1;

  start() {
    const L = this.layout;
    this.k = L.k;
    this.os = this.ctx.stage.ovenScale;
    const o = this.ctx.stage.oven;
    this.open = this.own(this.scene.add.image(o.x, o.y, this.params.open).setScale(this.os).setDepth(5));
    this.inside = this.own(this.scene.add.image(o.x, o.y, this.params.inside).setScale(this.os).setDepth(5).setVisible(false));
    this.closed = this.own(this.scene.add.image(o.x, o.y, this.params.closed).setScale(this.os).setDepth(7).setVisible(false));
    this.open.setScale(0);
    this.scene.tweens.add({ targets: this.open, scale: this.os, duration: 450, ease: 'Back.easeOut' });

    // The board and pizza wait next to the oven (they only move if the stage says so).
    this.rest = this.ctx.stage.dishWait;
    this.dish.setDepth(10);
    this.scene.tweens.add({ targets: [this.dish, this.ctx.board], x: this.rest.x, y: this.rest.y, duration: 500, ease: 'Sine.easeInOut' });

    this.onDown((p) => {
      if (this.phase === 'toOven' && this.dish.reach(p.worldX, p.worldY) < 1.3) {
        this.dragging = true;
        this.grab = { dx: this.dish.x - p.worldX, dy: this.dish.y - p.worldY };
        this.scene.tweens.killTweensOf(this.dish);
        this.dish.setScale(1.06);
        sfx(this.scene, 'tap');
        this.poke();
      } else if (this.phase === 'ready' && this.nearOven(p.worldX, p.worldY)) {
        this.openOven();
      }
    });
    this.onMove((p) => {
      if (!this.dragging) return;
      this.dish.setPosition(p.worldX + this.grab.dx, p.worldY + this.grab.dy);
      this.poke();
    });
    this.onUp((_p, cancelled) => {
      if (!this.dragging) return;
      this.dragging = false;
      // Forgiving: carried well toward the oven, or dropped near it, counts.
      const dist = (x: number, y: number) => Phaser.Math.Distance.Between(x, y, this.open.x, this.open.y);
      const toward = dist(this.rest.x, this.rest.y) - dist(this.dish.x, this.dish.y);
      const lifted = toward > 220 * this.k || this.nearOven(this.dish.x, this.dish.y);
      if (!cancelled && lifted) {
        this.hit();
        this.intoOven();
      } else {
        if (!cancelled) this.miss();
        sfx(this.scene, 'whoosh', { volume: 0.4 });
        this.scene.tweens.add({ targets: this.dish, x: this.rest.x, y: this.rest.y, scale: 1, duration: 420, ease: 'Sine.easeOut' });
      }
    });

    this.setIdle(true);
  }

  private nearOven(x: number, y: number) {
    return Phaser.Math.Distance.Between(x, y, this.open.x, this.open.y) < 460 * this.os;
  }

  /** Oven-frame point (700x800 viewBox) -> game point. */
  private ovenPoint(x: number, y: number) {
    const [w, h] = IMAGES['oven-closed'].size;
    return { x: this.open.x + (x - w / 2) * this.os, y: this.open.y + (y - h / 2) * this.os };
  }

  private intoOven() {
    this.phase = 'baking';
    this.setIdle(false);
    sfx(this.scene, 'whoosh');
    const spot = this.ovenPoint(ART.ovenPizza.x, ART.ovenPizza.y);
    const scale = ((ART.ovenPizza.diameter / 2) * this.os) / this.dish.R;
    this.scene.tweens.add({
      targets: this.dish,
      x: spot.x,
      y: spot.y,
      scale,
      duration: 480,
      ease: 'Quad.easeIn',
      onComplete: () => {
        // Door closes: pizza now sits between the oven cavity and the glass.
        this.open.setVisible(false);
        this.inside.setVisible(true);
        this.closed.setVisible(true);
        this.dish.setDepth(6);
        boing(this.scene, this.closed, 0.06);
        sfx(this.scene, 'pop', { volume: 0.5 });
        this.bake();
      },
    });
  }

  /** The pizza visibly turns golden through the window; the cavity glows; steam rises. */
  private bake() {
    const raw = Phaser.Display.Color.ValueToColor(0xffffff);
    const baked = Phaser.Display.Color.ValueToColor(this.params.bakedTint);
    const glowFrom = Phaser.Display.Color.ValueToColor(0xffffff);
    const glowTo = Phaser.Display.Color.ValueToColor(0xffb070);
    const mix = (a: Phaser.Display.Color, b: Phaser.Display.Color, t: number) => {
      const c = Phaser.Display.Color.Interpolate.ColorWithColor(a, b, 100, t * 100);
      return Phaser.Display.Color.GetColor(c.r, c.g, c.b);
    };
    this.loops.push(
      this.scene.tweens.addCounter({
        from: 0,
        to: 1,
        duration: this.params.bakeMs,
        onUpdate: (tw) => this.dish.tintAll(mix(raw, baked, tw.getValue() ?? 0)),
      }),
      this.scene.tweens.addCounter({
        from: 0,
        to: 1,
        duration: 500,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
        onUpdate: (tw) => this.inside.setTint(mix(glowFrom, glowTo, tw.getValue() ?? 0)),
      }),
      this.scene.tweens.add({ targets: this.closed, angle: { from: -1, to: 1 }, duration: 140, yoyo: true, repeat: -1 }),
      this.scene.time.addEvent({
        delay: 300,
        loop: true,
        callback: () => {
          const top = this.ovenPoint(350 + Phaser.Math.Between(-120, 120), 60);
          puff(this.scene, top.x, top.y, 0xffffff, 2, 90 * this.os);
        },
      }),
    );
    this.scene.time.delayedCall(this.params.bakeMs, () => {
      this.stopLoops();
      this.closed.setAngle(0);
      this.inside.clearTint();
      this.dish.tintAll(this.params.bakedTint);
      sfx(this.scene, 'oven-ding', { vary: false });
      boing(this.scene, this.closed, 0.12);
      stars(this.scene, this.closed.x, this.closed.y - 380 * this.os, 6, 60 * this.k);
      this.phase = 'ready';
      // Gentle "tap me" hop of the whole oven (pizza included, so it stays behind the window).
      this.loops.push(
        this.scene.tweens.add({ targets: [this.closed, this.inside, this.dish], y: `-=${14 * this.k}`, duration: 380, yoyo: true, repeat: -1, repeatDelay: 250, ease: 'Sine.easeOut' }),
      );
      this.setIdle(true);
    });
  }

  private stopLoops() {
    this.loops.forEach((l) => (l instanceof Phaser.Time.TimerEvent ? l.remove() : l.destroy()));
    this.loops = [];
  }

  private openOven() {
    if (this.phase !== 'ready') return;
    this.phase = 'out';
    this.setIdle(false);
    this.stopLoops();
    this.inside.setVisible(false);
    this.closed.setVisible(false);
    this.open.setVisible(true).setScale(this.os);
    sfx(this.scene, 'whoosh');
    puff(this.scene, this.open.x, this.open.y, 0xffffff, 10, 140 * this.os);
    this.dish.setDepth(10);
    this.scene.tweens.add({
      targets: this.dish,
      x: this.rest.x,
      y: this.rest.y,
      scale: 1,
      duration: 700,
      ease: 'Back.easeOut',
      onComplete: () => {
        sfx(this.scene, 'pop');
        stars(this.scene, this.dish.x, this.dish.y, 12, 70 * this.k);
        this.scene.time.delayedCall(500, () => this.complete());
      },
    });
  }

  protected showHint() {
    if (this.phase === 'toOven') this.hand.drag({ x: this.dish.x, y: this.dish.y }, { x: this.open.x, y: this.open.y });
    else if (this.phase === 'ready') this.hand.tap({ x: this.closed.x, y: this.closed.y });
  }

  protected autoFinish() {
    if (this.phase === 'toOven') {
      this.dragging = false;
      // The oven bakes on its own; after the ding the child gets a fresh chance to tap.
      this.resumeAfterAuto();
      this.intoOven();
    } else if (this.phase === 'ready') {
      this.resumeAfterAuto();
      this.openOven();
    }
  }
}
