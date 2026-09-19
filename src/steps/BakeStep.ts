import Phaser from 'phaser';
import { ART, IMAGES } from '../core/assets';
import { bakeLoop, voice } from '../core/audio';
import { boing, puff, stars } from '../core/fx';
import type { HandMotion } from '../core/hand';
import { sfx } from '../core/sfx';
import type { BakeParams } from '../recipes/types';
import { MADE_KEY } from './Dish';
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

    // Where Pipa is not on screen (4:3) Mom points her arm at the oven; on the phone that aim would
    // pass over Pipa's head, so there she keeps her default pose and her demo hand points instead.
    if (!this.ctx.stage.pet) {
      const win = this.ovenPoint(ART.ovenPizza.x, ART.ovenPizza.y - 15);
      this.ctx.mom.aimArmAt(win.x, win.y);
    }

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
        this.hand.stop();
        voice.say('vo-oven', { queue: false });
        this.bake();
      },
    });
  }

  /** The pizza visibly turns golden through the window; the cavity glows; steam rises. */
  private bake() {
    bakeLoop.start();
    this.scene.time.delayedCall(this.params.bakeMs / 2, () => voice.say('vo-baking', { valid: () => this.phase === 'baking' }));
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
      bakeLoop.stop();
      this.closed.setAngle(0);
      this.inside.clearTint();
      this.dish.tintAll(this.params.bakedTint);
      sfx(this.scene, 'oven-ding', { vary: false });
      voice.say('vo-ready', { queue: false });
      boing(this.scene, this.closed, 0.12);
      stars(this.scene, this.closed.x, this.closed.y - 380 * this.os, 6, 60 * this.k);
      this.phase = 'ready';
      // The ding makes the oven hop three times (pizza included, so it stays behind the window), then it rests.
      this.loops.push(
        this.scene.tweens.add({ targets: [this.closed, this.inside, this.dish], y: `-=${14 * this.k}`, duration: 380, yoyo: true, repeat: 2, repeatDelay: 250, ease: 'Sine.easeOut' }),
      );
      this.setIdle(true);
    });
  }

  private stopLoops() {
    // Put the oven back on its spot if a hop was cut short.
    const o = this.ctx.stage.oven;
    for (const img of [this.closed, this.inside]) img.y = o.y;
    this.loops.forEach((l) => (l instanceof Phaser.Time.TimerEvent ? l.remove() : l.destroy()));
    this.loops = [];
  }

  private openOven() {
    if (this.phase !== 'ready') return;
    this.phase = 'out';
    this.hand.stop();
    this.ctx.mom.armTo(0);
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

  /** Mom's hand at the window of the closed oven (tap it). */
  private ovenTap(): HandMotion {
    const w = this.ovenPoint(460, 430);
    const k = this.k;
    return {
      kind: 'point',
      keys: [
        { x: w.x + 60 * k, y: w.y + 60 * k, t: 0 },
        { x: w.x, y: w.y, t: 400 },
        { x: w.x, y: w.y, t: 600, press: true },
        { x: w.x, y: w.y, t: 800 },
        { x: w.x, y: w.y, t: 1000, press: true },
        { x: w.x + 60 * k, y: w.y + 60 * k, t: 1500 },
      ],
      glow: this.ovenPoint(350, 465),
    };
  }

  /**
   * Before baking: Mom carries a see-through copy of the pizza into the open oven (the real one stays).
   * When it's ready: her finger taps the oven.
   */
  protected demo(): HandMotion | null {
    if (this.phase === 'ready') return this.ovenTap();
    if (this.phase !== 'toOven') return null;
    const d = { x: this.dish.x, y: this.dish.y };
    const to = this.ovenPoint(ART.ovenPizza.x, ART.ovenPizza.y);
    const grip = { x: this.dish.R * 0.55, y: -this.dish.R * 0.35 };
    const small = ((ART.ovenPizza.diameter / 2) * this.os) / this.dish.R;
    // Her own pizza as a ghost (the capture is in game pixels; the stock dough needs the content scale).
    const made = this.scene.textures.exists(MADE_KEY);
    const key = made ? MADE_KEY : 'dough-flat';
    return {
      kind: 'grab',
      keys: [
        { x: d.x + grip.x, y: d.y + grip.y, t: 0 },
        { x: d.x + grip.x, y: d.y + grip.y, t: 350, press: true },
        { x: to.x + grip.x * small, y: to.y + grip.y * small, t: 1800 },
        { x: to.x + grip.x * small, y: to.y + grip.y * small, t: 2350 },
      ],
      props: [{ key, scale: made ? 1 : this.k, endScale: small * (made ? 1 : this.k), alpha: 0.55, dx: -grip.x, dy: -grip.y, fadeFrom: 1700 }],
      glow: d,
    };
  }

  /** Mom helps: into the oven with her hand on the pizza, or (when ready) her finger taps the oven. */
  protected autoFinish() {
    if (this.phase === 'toOven') {
      this.dragging = false;
      const grip = { x: this.dish.R * 0.55, y: -this.dish.R * 0.35 };
      this.hand.follow('grab', () => ({ x: this.dish.x + grip.x * this.dish.scaleX, y: this.dish.y + grip.y * this.dish.scaleY }));
      // The oven bakes on its own; after the ding the child gets a fresh chance to tap.
      this.resumeAfterAuto();
      this.intoOven();
    } else if (this.phase === 'ready') {
      this.hand.play(this.ovenTap(), {
        onDone: () => {
          this.resumeAfterAuto();
          this.openOven();
        },
      });
    }
  }

  abort() {
    bakeLoop.stop();
    super.abort();
  }
}
