import Phaser from 'phaser';
import { puff } from '../core/fx';
import { fit } from '../core/layout';
import { sfx } from '../core/sfx';
import type { RollParams } from '../recipes/types';
import { Step } from './Step';

/**
 * Rolling: rub one finger back and forth over the dough ball until it is flat.
 * Any rubbing near the dough counts; the rolling pin follows the finger.
 */
export class RollStep extends Step<RollParams> {
  private ball!: Phaser.GameObjects.Image;
  private flat!: Phaser.GameObjects.Image;
  private pin!: Phaser.GameObjects.Image;
  private pinRest = { x: 0, y: 0 };
  private progress = 0;
  private rubbing = false;
  private last = { x: 0, y: 0 };
  private sinceSound = 0;
  private sincePuff = 0;
  private ballScale = 1;
  private flatScale = 1;

  start() {
    const { u } = this.layout;
    const { x, y } = this.ctx.dishHome;
    const R = this.dish.R;
    this.dish.setPosition(x, y).setScale(1).setAlpha(1);

    this.flat = this.own(this.scene.add.image(x, y, this.params.flat).setAlpha(0));
    fit(this.flat, R * 2);
    this.flatScale = this.flat.scale;

    this.ball = this.own(this.scene.add.image(x, y, this.params.ball));
    fit(this.ball, u * 0.42);
    this.ballScale = this.ball.scale;
    this.ball.setScale(0);
    this.scene.tweens.add({ targets: this.ball, scale: this.ballScale, duration: 500, ease: 'Back.easeOut' });

    this.pinRest = { x, y: y + R + u * 0.1 };
    this.pin = this.own(this.scene.add.image(this.pinRest.x, this.pinRest.y, this.params.tool).setDepth(20));
    fit(this.pin, u * 0.55, u * 0.2);

    this.render();

    this.onDown((p) => {
      if (this.dish.reach(p.worldX, p.worldY) > 1.7) return;
      this.rubbing = true;
      this.last = { x: p.worldX, y: p.worldY };
      this.movePin(p.worldX, p.worldY);
      sfx(this.scene, 'squish', { minGapMs: 200 });
    });
    this.onMove((p) => {
      if (!this.rubbing) return;
      const d = Phaser.Math.Distance.Between(this.last.x, this.last.y, p.worldX, p.worldY);
      this.last = { x: p.worldX, y: p.worldY };
      this.movePin(p.worldX, p.worldY);
      if (this.dish.reach(p.worldX, p.worldY) > 1.7) return;
      this.addRub(d, p.worldX, p.worldY);
    });
    this.onUp(() => {
      if (!this.rubbing) return;
      this.rubbing = false;
      this.scene.tweens.add({ targets: this.pin, x: this.pinRest.x, y: this.pinRest.y, duration: 350, ease: 'Back.easeOut' });
    });

    this.setIdle(true);
  }

  private movePin(x: number, y: number) {
    this.scene.tweens.killTweensOf(this.pin);
    this.pin.setPosition(x, y);
  }

  private addRub(dist: number, x: number, y: number) {
    if (dist <= 0) return;
    this.poke();
    const need = this.params.rubWidths * this.dish.R * 2;
    this.progress = Math.min(1, this.progress + dist / need);
    this.sinceSound += dist;
    this.sincePuff += dist;
    if (this.sinceSound > 90) {
      this.sinceSound = 0;
      sfx(this.scene, 'squish', { minGapMs: 180, volume: 0.6 });
    }
    if (this.sincePuff > 160) {
      this.sincePuff = 0;
      puff(this.scene, x, y + this.layout.u * 0.03, 0xfff8ec, 3, this.layout.u * 0.07);
    }
    this.render();
    if (this.progress >= 1) this.finish();
  }

  /** Ball squashes wider and fades into the growing flat dough. */
  private render() {
    const p = this.progress;
    const squash = 1 + p * 0.9;
    this.ball.setScale(this.ballScale * squash, this.ballScale * (1 - p * 0.6));
    this.ball.setAlpha(1 - Phaser.Math.Clamp((p - 0.35) / 0.55, 0, 1));
    this.flat.setAlpha(Phaser.Math.Clamp(p / 0.4, 0, 1));
    this.flat.setScale(this.flatScale * (0.45 + 0.55 * p));
  }

  private finish() {
    this.rubbing = false;
    this.dish.setBase(this.params.flat);
    this.flat.setVisible(false);
    this.ball.setVisible(false);
    this.scene.tweens.add({ targets: this.pin, x: this.pinRest.x, y: this.pinRest.y, alpha: 0, duration: 300 });
    puff(this.scene, this.dish.x, this.dish.y, 0xfff8ec, 10, this.layout.u * 0.14);
    this.complete();
  }

  protected showHint() {
    this.hand.rub({ x: this.dish.x, y: this.dish.y }, this.dish.R * 1.2);
  }

  protected autoFinish() {
    this.scene.tweens.addCounter({
      from: this.progress,
      to: 1,
      duration: 1200,
      onUpdate: (tw) => {
        this.progress = tw.getValue() ?? 1;
        const x = this.dish.x + Math.sin(this.progress * 20) * this.dish.R * 0.6;
        this.pin.setPosition(x, this.dish.y);
        this.render();
        sfx(this.scene, 'squish', { minGapMs: 220, volume: 0.6 });
      },
      onComplete: () => this.finish(),
    });
  }
}
