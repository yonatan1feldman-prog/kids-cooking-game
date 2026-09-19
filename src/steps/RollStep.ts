import Phaser from 'phaser';
import { puff } from '../core/fx';
import { art } from '../core/layout';
import { sfx } from '../core/sfx';
import type { RollParams } from '../recipes/types';
import { Step } from './Step';

/**
 * Rolling: rub one finger back and forth over the dough ball until it is flat.
 * Any rubbing near the dough counts; the rolling pin follows the finger (lying across it).
 * At rest the pin stands upright in the left column; touching it starts rolling too.
 */
export class RollStep extends Step<RollParams> {
  private ball!: Phaser.GameObjects.Image;
  private flat!: Phaser.GameObjects.Image;
  private pin!: Phaser.GameObjects.Image;
  private pinRest = { x: 0, y: 0 };
  private pinAngle = 0;
  private progress = 0;
  private rubbing = false;
  private last = { x: 0, y: 0 };
  private sinceSound = 0;
  private sincePuff = 0;
  private k = 1;

  start() {
    const L = this.layout;
    this.k = L.k;
    const { x, y } = this.ctx.dishHome;
    this.dish.setPosition(x, y).setScale(1).setAlpha(1);

    this.flat = this.own(art(this.scene.add.image(x, y, this.params.flat), L).setAlpha(0));
    this.ball = this.own(art(this.scene.add.image(x, y, this.params.ball), L));
    this.ball.setScale(0);
    this.scene.tweens.add({ targets: this.ball, scale: this.k, duration: 500, ease: 'Back.easeOut' });

    this.pinRest = this.ctx.stage.pinRest;
    this.pinAngle = this.ctx.stage.pinRestAngle;
    this.pin = this.own(art(this.scene.add.image(this.pinRest.x, this.pinRest.y, this.params.tool), L).setDepth(20).setAngle(this.pinAngle));

    this.render();

    this.onDown((p) => {
      const onPin = this.pin.getBounds().contains(p.worldX, p.worldY);
      if (this.dish.reach(p.worldX, p.worldY) > 1.7 && !onPin) return;
      this.rubbing = true;
      this.last = { x: p.worldX, y: p.worldY };
      this.movePin(p.worldX, p.worldY);
      sfx(this.scene, 'squish', { minGapMs: 200 });
      puff(this.scene, p.worldX, p.worldY, 0xfff6e6, 3, 70 * this.k);
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
      this.restPin(350);
    });

    this.setIdle(true);
  }

  private movePin(x: number, y: number) {
    this.scene.tweens.killTweensOf(this.pin);
    this.pin.setPosition(x, y).setAngle(0);
  }

  private restPin(duration: number) {
    this.scene.tweens.add({ targets: this.pin, x: this.pinRest.x, y: this.pinRest.y, angle: this.pinAngle, duration, ease: 'Back.easeOut' });
  }

  private addRub(dist: number, x: number, y: number) {
    if (dist <= 0) return;
    this.poke();
    const need = this.params.rubWidths * this.dish.R * 2;
    this.progress = Math.min(1, this.progress + dist / need);
    this.sinceSound += dist;
    this.sincePuff += dist;
    if (this.sinceSound > 90 * this.k) {
      this.sinceSound = 0;
      sfx(this.scene, 'squish', { minGapMs: 180, volume: 0.6 });
    }
    if (this.sincePuff > 160 * this.k) {
      this.sincePuff = 0;
      puff(this.scene, x, y + 30 * this.k, 0xfff6e6, 3, 70 * this.k);
    }
    this.render();
    if (this.progress >= 1) this.finish();
  }

  /** The ball squashes wider and fades into the growing flat dough: progress lives in the object itself. */
  private render() {
    const p = this.progress;
    this.ball.setScale(this.k * (1 + p * 0.9), this.k * (1 - p * 0.6));
    this.ball.setAlpha(1 - Phaser.Math.Clamp((p - 0.35) / 0.55, 0, 1));
    this.flat.setAlpha(Phaser.Math.Clamp(p / 0.4, 0, 1));
    this.flat.setScale(this.k * (0.45 + 0.55 * p));
  }

  private finish() {
    this.rubbing = false;
    this.dish.setBase(this.params.flat);
    this.flat.setVisible(false);
    this.ball.setVisible(false);
    this.restPin(300);
    puff(this.scene, this.dish.x, this.dish.y, 0xfff6e6, 10, 150 * this.k);
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
        this.pin.setPosition(x, this.dish.y).setAngle(0);
        this.render();
        sfx(this.scene, 'squish', { minGapMs: 220, volume: 0.6 });
      },
      onComplete: () => this.finish(),
    });
  }
}
