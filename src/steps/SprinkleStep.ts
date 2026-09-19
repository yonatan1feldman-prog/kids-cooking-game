import Phaser from 'phaser';
import { ART } from '../core/assets';
import { boing } from '../core/fx';
import type { HandMotion } from '../core/hand';
import { art } from '../core/layout';
import { sfx } from '../core/sfx';
import { FX_DOT } from '../core/assets';
import type { VoiceKey } from '../core/audio';
import type { SprinkleParams } from '../recipes/types';
import { clampToRadius } from './Dish';
import { BOWL_DEPTH, PrepBowl } from './PrepBowl';
import { Step } from './Step';

/**
 * Sprinkling: tap over the dish, or drag across it, and the tool follows the finger and showers pieces
 * down where the finger is. Two kinds of tool:
 * - 'shaker': floats just above the finger, tipped over (holes down), so it stays visible;
 * - 'handful' (her own grated cheese): a handful taken from the pile in the left column (`source`, left
 *   by the grate step), held just above the finger; it goes back into the pile when she lets go.
 */
/** Touch radius around the resting shaker (it stands 400 tall: this reaches past its drawing). */
export const TOOL_REACH = 225;

export class SprinkleStep extends Step<SprinkleParams> {
  protected stepLine: VoiceKey | null = 'vo-cheese';
  /** 'bowl': the big bowl the step before left (the salad), shaken into. */
  private bowl?: PrepBowl;
  private tool!: Phaser.GameObjects.Image;
  private toolRest = { x: 0, y: 0 };
  private landed = 0;
  private thrown = 0;
  private active = false;
  private travel = 0;
  private last = { x: 0, y: 0 };
  private done = false;
  private k = 1;
  private source?: Phaser.GameObjects.Image;

  private get handful() {
    return this.params.toolKind === 'handful';
  }

  start() {
    const L = this.layout;
    this.k = L.k;
    if (this.params.line) this.stepLine = this.params.line;
    if (this.params.into === 'bowl') {
      this.workspace('none');
      this.bowl = PrepBowl.take(this.ctx) ?? undefined;
      const f = this.ctx.stage.pourFrom;
      this.toolRest = { x: (f.x0 + f.x1) / 2, y: (f.y0 + f.y1) / 2 };
    } else {
      this.workspace('dish');
      this.toolRest = this.ctx.stage.shaker;
    }
    if (this.handful && this.params.source) {
      // The pile she grated (left by the step before), or a fresh one.
      this.source = this.adopt(this.params.source) ?? undefined;
      if (!this.source) {
        this.source = this.own(this.scene.add.image(this.toolRest.x, this.toolRest.y, this.params.source).setScale(0).setDepth(2));
        this.scene.tweens.add({ targets: this.source, scale: 0.8 * this.k, duration: 450, ease: 'Back.easeOut' });
      }
    }
    this.tool = this.own(art(this.scene.add.image(this.toolRest.x, this.toolRest.y, this.params.tool), L).setDepth(30));
    this.tool.setScale(0);
    if (this.handful) this.tool.setOrigin(ART.prep.handfulClump.x / 300, ART.prep.handfulClump.y / 260);
    const holes = this.params.holes;
    if (holes) this.tool.setOrigin(holes.x / this.tool.frame.realWidth, holes.y / this.tool.frame.realHeight);
    // A handful only shows while held; a shaker stands in the left column.
    if (!this.handful) this.scene.tweens.add({ targets: this.tool, scale: this.k, duration: 450, ease: 'Back.easeOut' });

    this.onDown((p) => {
      const nearDish = this.bowl ? this.bowl.reach(p.worldX, p.worldY) < 1.8 : this.dish.reach(p.worldX, p.worldY) < 1.5;
      const nearTool = Phaser.Math.Distance.Between(p.worldX, p.worldY, this.toolRest.x, this.toolRest.y) < TOOL_REACH * this.k;
      if (!nearDish && !nearTool) return;
      this.active = true;
      this.travel = 0;
      this.last = { x: p.worldX, y: p.worldY };
      this.hover(p.worldX, p.worldY, true);
      this.shake();
      this.shower(p.worldX, p.worldY, 4);
    });
    this.onMove((p) => {
      if (!this.active) return;
      this.hover(p.worldX, p.worldY, false);
      this.travel += Phaser.Math.Distance.Between(this.last.x, this.last.y, p.worldX, p.worldY);
      this.last = { x: p.worldX, y: p.worldY };
      if (this.travel > 50 * this.k) {
        this.travel = 0;
        this.shower(p.worldX, p.worldY, 1);
      }
    });
    this.onUp(() => {
      if (!this.active) return;
      this.active = false;
      this.scene.time.delayedCall(250, () => {
        if (!this.active && !this.done) this.rest();
      });
    });

    this.setIdle(true);
  }

  /** The shaker floats above the finger, upside down (holes at the bottom); a handful is held just above it. */
  private hover(x: number, y: number, animate: boolean) {
    // (a shaker held by its holes: they are just above the finger, the shaker turned over, a little tilted)
    const ty = y - (this.handful ? 110 : this.params.holes ? 70 : 260) * this.k;
    const angle = this.handful ? 0 : this.params.holes ? 160 : 180;
    this.scene.tweens.killTweensOf(this.tool);
    if (this.handful && animate) {
      // Taken from the pile: it comes from there to the finger.
      if (this.tool.scale < 0.1) this.tool.setPosition(this.toolRest.x, this.toolRest.y);
      if (this.source) boing(this.scene, this.source, 0.08);
    }
    this.tool.setScale(this.k).setAlpha(1);
    if (animate) this.scene.tweens.add({ targets: this.tool, x, y: ty, angle, duration: 140, ease: 'Quad.easeOut' });
    else this.tool.setPosition(x, ty).setAngle(angle);
  }

  private rest() {
    this.scene.tweens.killTweensOf(this.tool);
    const scale = this.handful ? 0 : this.k;
    this.scene.tweens.add({ targets: this.tool, x: this.toolRest.x, y: this.toolRest.y, angle: 0, scale, duration: 350, ease: this.handful ? 'Quad.easeIn' : 'Back.easeOut' });
  }

  private shake() {
    if (this.params.holes) this.scene.tweens.add({ targets: this.tool, angle: { from: 148, to: 172 }, duration: 70, yoyo: true, repeat: 2 });
    else if (this.handful) this.scene.tweens.add({ targets: this.tool, angle: { from: -12, to: 12 }, duration: 70, yoyo: true, repeat: 2 });
    else this.scene.tweens.add({ targets: this.tool, angle: { from: 165, to: 195 }, duration: 70, yoyo: true, repeat: 2 });
  }

  /** Drops `n` pieces from the shaker onto the dish around the finger. */
  private shower(fx: number, fy: number, n: number) {
    this.poke();
    if (this.bowl) return this.grains(fx, fy - 70 * this.k);
    sfx(this.scene, this.params.sound ?? 'sprinkle', { minGapMs: 140, volume: 0.7 });
    const k = this.k;
    for (let i = 0; i < n; i++) {
      this.thrown++;
      const from = { x: this.tool.x + Phaser.Math.FloatBetween(-40, 40) * k, y: this.tool.y + (this.handful ? 50 : 170) * k };
      const aim = this.dish.toLocal(fx + Phaser.Math.FloatBetween(-90, 90) * k, fy + Phaser.Math.FloatBetween(-90, 90) * k);
      const spot = clampToRadius(aim, this.dish.R * 0.8);
      const land = this.dish.toWorld(spot.x, spot.y);
      const fly = art(this.scene.add.image(from.x, from.y, this.params.piece), this.layout).setDepth(25).setAngle(Phaser.Math.Between(0, 359));
      this.scene.tweens.add({
        targets: fly,
        x: land.x,
        y: land.y,
        angle: fly.angle + Phaser.Math.Between(-90, 90),
        duration: 260 + i * 40,
        ease: 'Quad.easeIn',
        onComplete: () => {
          fly.destroy();
          const piece = this.dish.addSprinkle(this.params.piece, spot.x, spot.y);
          boing(this.scene, piece, 0.3);
          this.landed++;
          if (this.landed >= this.params.count && !this.done) this.finish();
        },
      });
    }
  }

  /**
   * Into the bowl: a shake lets a little cloud of grains (drawn in code) fall from the holes into the bowl, where they
   * melt in. Every shake counts one.
   */
  private grains(hx = this.tool.x, hy = this.tool.y) {
    const bowl = this.bowl!;
    const k = this.k;
    sfx(this.scene, this.params.sound ?? 'sprinkle', { minGapMs: 150, volume: 0.8 });
    const o = bowl.opening();
    for (let i = 0; i < 9; i++) {
      const g = this.scene.add.image(hx + Phaser.Math.Between(-14, 14) * k, hy + 10 * k, FX_DOT);
      g.setScale((Phaser.Math.FloatBetween(7, 12) * k) / g.frame.realWidth).setTint(i % 3 ? 0xffffff : 0xe8e2d6).setDepth(BOWL_DEPTH.front + 0.3);
      const to = bowl.clampToOpening(hx + Phaser.Math.Between(-70, 70) * k, Math.max(o.y - o.ry * 0.4, hy + 60 * k) + Phaser.Math.Between(0, 50) * k, 0.85);
      this.scene.tweens.add({
        targets: g,
        x: to.x,
        y: to.y,
        delay: i * 25,
        duration: Phaser.Math.Between(260, 380),
        ease: 'Quad.easeIn',
        onComplete: () => this.scene.tweens.add({ targets: g, alpha: 0, duration: 200, onComplete: () => g.destroy() }),
      });
    }
    this.landed++;
    if (this.landed >= this.params.count && !this.done) this.scene.time.delayedCall(400, () => !this.done && this.finish());
  }

  private finish() {
    this.done = true;
    this.bowl?.keep();
    this.active = false;
    this.rest();
    this.scene.time.delayedCall(300, () => this.complete());
  }

  /** Mom's pinch moves over the pizza, dipping at each spot (the falling cheese is in the hand's art). */
  protected demo(): HandMotion {
    if (this.bowl) {
      // Her hand shakes over the bowl, three times.
      const o = this.bowl.opening();
      const keys: { x: number; y: number; t: number; press?: boolean }[] = [];
      [-0.35, 0, 0.35].forEach((f, i) => {
        const t = 200 + i * 650;
        keys.push({ x: o.x + f * o.rx, y: o.y - 220 * this.k, t });
        keys.push({ x: o.x + f * o.rx, y: o.y - 170 * this.k, t: t + 200, press: true });
        keys.push({ x: o.x + f * o.rx, y: o.y - 220 * this.k, t: t + 400 });
      });
      keys.unshift({ ...keys[0], t: 0 });
      keys.push({ ...keys[keys.length - 1], t: 2400 });
      return { kind: 'sprinkle', keys, glow: { x: o.x, y: o.y } };
    }
    const { x, y } = this.dish;
    const R = this.dish.R;
    const spots = [[-0.45, -0.2], [-0.1, 0.25], [0.25, -0.25], [0.45, 0.2]];
    const keys: { x: number; y: number; t: number; press?: boolean }[] = [];
    spots.forEach(([sx, sy], i) => {
      const t = 200 + i * 520;
      keys.push({ x: x + sx * R, y: y + sy * R - 60 * this.k, t });
      keys.push({ x: x + sx * R, y: y + sy * R - 40 * this.k, t: t + 200, press: true });
    });
    keys.unshift({ ...keys[0], t: 0 });
    keys.push({ ...keys[keys.length - 1], press: false, t: 2400 });
    return { kind: 'sprinkle', keys, glow: this.dish };
  }

  /** Mom helps: her hand holds the shaker while it showers the rest. */
  protected autoFinish() {
    this.hand.follow('grab', () => ({ x: this.tool.x, y: this.tool.y }));
    if (this.bowl) {
      const o = this.bowl.opening();
      const left = Math.max(1, this.params.count - this.landed);
      for (let i = 0; i < left; i++)
        this.scene.time.delayedCall(i * 450, () => {
          if (this.done) return;
          const x = o.x + Math.sin(i * 1.7) * o.rx * 0.4;
          this.hover(x, o.y - 60 * this.k, false);
          this.shake();
          this.grains();
        });
      return;
    }
    const remaining = Math.max(0, this.params.count - this.thrown);
    const n = Math.max(1, Math.ceil(remaining / 3));
    for (let i = 0; i < n; i++) {
      this.scene.time.delayedCall(i * 120, () => {
        const a = (i / n) * Math.PI * 4;
        const r = this.dish.R * this.dish.scaleX * 0.5;
        const x = this.dish.x + Math.cos(a) * r;
        const y = this.dish.y + Math.sin(a) * r;
        this.hover(x, y, false);
        this.shower(x, y, 3);
      });
    }
  }
}
