import Phaser from 'phaser';
import { boing } from '../core/fx';
import type { HandMotion } from '../core/hand';
import { sfx } from '../core/sfx';
import { TUNING } from '../core/tuning';
import type { GrateParams } from '../recipes/types';
import { Step } from './Step';

/** Pile thresholds: the pile appears at the first, and changes to its next picture at the others. */
const PILE_AT = [0.06, 0.4, 0.75];
const BLOCK_ANGLE = -12;

/**
 * Grating (or any "rub it on a tool"): the block follows the finger; rubbing it over the tool's face, up and
 * down (sideways counts a third), drops pieces that fall into a pile under the tool. The pile grows through
 * `piles` and the block gets smaller. No rhythm or direction is required: all rubbing on the face adds up
 * (TUNING.grate.distance). At the end the pile goes to the left column for the next step (a handful is
 * sprinkled from it) and the pizza comes back to the middle.
 */
export class GrateStep extends Step<GrateParams> {
  private tool!: Phaser.GameObjects.Image;
  private block!: Phaser.GameObjects.Image;
  private pile?: Phaser.GameObjects.Image;
  private pileIndex = -1;
  private rest = { x: 0, y: 0 };
  private blockScale = 1;
  private pileAt = { x: 0, y: 0, scale: 1 };
  private holding = false;
  private last = { x: 0, y: 0 };
  private progress = 0;
  private sinceShred = 0;
  private finishing = false;
  private k = 1;

  start() {
    this.stepLine = this.params.line;
    const S = this.ctx.stage;
    const k = (this.k = this.layout.k);
    this.workspace('aside');
    this.tool = this.own(this.scene.add.image(S.grater.x, S.grater.y, this.params.tool).setScale(S.grater.scale).setDepth(2));
    this.tool.setAlpha(0).setY(S.grater.y + 100 * k);
    this.scene.tweens.add({ targets: this.tool, alpha: 1, y: S.grater.y, duration: 450, ease: 'Back.easeOut' });
    this.rest = { x: S.graterBlock.x, y: S.graterBlock.y };
    this.blockScale = S.graterBlock.scale;
    this.pileAt = S.graterPile;
    this.block = this.own(this.scene.add.image(this.rest.x, this.rest.y, this.params.block).setScale(0).setAngle(BLOCK_ANGLE).setDepth(3));
    this.scene.tweens.add({ targets: this.block, scale: this.blockScale, delay: 250, duration: 400, ease: 'Back.easeOut' });

    this.onDown((p) => {
      if (this.finishing) return;
      if (!this.onTool(p.worldX, p.worldY, 90) && !this.block.getBounds().contains(p.worldX, p.worldY)) return;
      this.holding = true;
      this.last = { x: p.worldX, y: p.worldY };
      this.scene.tweens.killTweensOf(this.block);
      this.scene.tweens.add({ targets: this.block, x: p.worldX, y: p.worldY, duration: 90 });
      this.block.setScale(this.currentBlockScale());
      boing(this.scene, this.block, 0.1);
      sfx(this.scene, this.params.sound, { minGapMs: 600, volume: 0.8 });
      if (this.onTool(p.worldX, p.worldY, 0)) this.shred(p.worldX);
    });
    this.onMove((p) => {
      if (!this.holding || this.finishing) return;
      const dx = p.worldX - this.last.x;
      const dy = p.worldY - this.last.y;
      this.last = { x: p.worldX, y: p.worldY };
      this.scene.tweens.killTweensOf(this.block);
      this.block.setPosition(p.worldX, p.worldY);
      if (!this.onTool(p.worldX, p.worldY, 60)) return;
      this.rub(Math.abs(dy) + Math.abs(dx) / 3, p.worldX);
    });
    this.onUp(() => {
      if (!this.holding) return;
      this.holding = false;
      if (!this.finishing) this.restBlock();
    });
    this.setIdle(true);
  }

  /** The tool's face (its drawing without the handle and the foot), padded by `pad` world units x k. */
  private onTool(x: number, y: number, pad: number) {
    const f = this.face();
    const p = pad * this.k;
    return x > f.x0 - p && x < f.x1 + p && y > f.y0 - p && y < f.y1 + p;
  }

  private face() {
    const b = this.tool.getBounds();
    return { x0: b.x + b.width * 0.12, x1: b.right - b.width * 0.12, y0: b.y + b.height * 0.2, y1: b.bottom - b.height * 0.12 };
  }

  private currentBlockScale() {
    return this.blockScale * (1 - 0.45 * this.progress);
  }

  private restBlock() {
    this.scene.tweens.add({ targets: this.block, x: this.rest.x, y: this.rest.y, duration: 300, ease: 'Back.easeOut' });
  }

  private rub(d: number, x: number) {
    if (d <= 0) return;
    this.poke();
    this.progress = Math.min(1, this.progress + d / (this.params.distance * this.k));
    this.block.setScale(this.currentBlockScale());
    sfx(this.scene, this.params.sound, { minGapMs: 700, volume: 0.8, vary: false });
    this.sinceShred += d;
    while (this.sinceShred > this.params.shredEvery * this.k) {
      this.sinceShred -= this.params.shredEvery * this.k;
      this.shred(x);
    }
    this.updatePile();
    if (this.progress >= 1) this.finish();
  }

  /** A piece falls from under the block into the pile. */
  private shred(x: number) {
    const k = this.k;
    const f = this.face();
    const from = { x: Phaser.Math.Clamp(x + Phaser.Math.FloatBetween(-50, 50) * k, f.x0, f.x1), y: Phaser.Math.Clamp(this.block.y + 40 * k, f.y0, f.y1) };
    const to = { x: this.pileAt.x + Phaser.Math.FloatBetween(-120, 120) * k, y: this.pileAt.y + Phaser.Math.FloatBetween(-30, 30) * k };
    const piece = this.scene.add.image(from.x, from.y, this.params.piece).setScale(k).setAngle(Phaser.Math.Between(0, 359)).setDepth(2.5);
    this.scene.tweens.add({
      targets: piece,
      x: to.x,
      y: to.y,
      angle: piece.angle + Phaser.Math.Between(-160, 160),
      duration: Phaser.Math.Between(320, 460),
      ease: 'Quad.easeIn',
      onComplete: () => this.scene.tweens.add({ targets: piece, alpha: 0, duration: 200, onComplete: () => piece.destroy() }),
    });
  }

  /** The pile appears, then changes to bigger pictures as the grating adds up. */
  private updatePile() {
    let i = -1;
    PILE_AT.forEach((t, j) => this.progress >= t && (i = Math.min(j, this.params.piles.length - 1)));
    if (i === this.pileIndex || i < 0) return;
    this.pileIndex = i;
    const key = this.params.piles[i];
    const n = this.own(this.scene.add.image(this.pileAt.x, this.pileAt.y, key).setScale(this.pileAt.scale).setDepth(1.9).setAlpha(0));
    const old = this.pile;
    this.pile = n;
    if (old) {
      this.scene.tweens.add({ targets: n, alpha: 1, duration: 220, onComplete: () => old.destroy() });
      boing(this.scene, n, 0.08);
    } else {
      n.setAlpha(1).setScale(0);
      this.scene.tweens.add({ targets: n, scale: this.pileAt.scale, duration: 300, ease: 'Back.easeOut' });
    }
  }

  /** The block is used up; the pile goes to the left column for the next step and the pizza comes back. */
  private finish() {
    if (this.finishing) return;
    this.finishing = true;
    this.holding = false;
    this.setIdle(false);
    this.hand.stop();
    this.scene.tweens.killTweensOf(this.block);
    this.scene.tweens.add({ targets: this.block, scale: 0, alpha: 0, duration: 300 });
    this.progress = 1;
    this.updatePile();
    this.scene.time.delayedCall(450, () => {
      this.workspace('dish', 600);
      const pile = this.pile;
      const S = this.ctx.stage;
      if (pile) {
        const key = pile.texture.key;
        this.handOff(key, pile);
        this.scene.tweens.add({ targets: pile, x: S.shaker.x, y: S.shaker.y, scale: 0.8 * this.k, duration: 600, ease: 'Sine.easeInOut' });
      }
      this.scene.time.delayedCall(650, () => this.complete());
    });
  }

  /** Mom's hand holds a block (a prop: the real one rests hidden) and rubs it up and down the grater. */
  protected demo(): HandMotion {
    const f = this.face();
    const x = (f.x0 + f.x1) / 2;
    const keys = [0, 1, 2, 3, 4, 5].map((i) => ({ x: x + (i % 2 ? 12 : -12) * this.k, y: i % 2 ? f.y1 - 130 * this.k : f.y0 + 70 * this.k, t: 200 + i * 360 }));
    keys.unshift({ ...keys[0], t: 0 });
    keys.push({ ...keys[keys.length - 1], t: 2400 });
    return {
      kind: 'grab',
      keys,
      props: [{ key: this.params.block, scale: this.currentBlockScale(), angle: BLOCK_ANGLE }],
      glow: { x, y: (f.y0 + f.y1) / 2 },
      onStop: () => this.block.active && this.block.setVisible(true),
    };
  }

  intro(withDemo: boolean) {
    if (withDemo) this.block.setVisible(false);
    super.intro(withDemo);
  }

  protected showHint() {
    this.block.setVisible(false);
    super.showHint();
  }

  protected onDemoEnd() {
    this.block.setVisible(true);
  }

  /** Mom helps: her hand takes the block and grates the rest. */
  protected autoFinish() {
    this.block.setVisible(true);
    const f = this.face();
    const x = (f.x0 + f.x1) / 2;
    const t0 = this.scene.time.now;
    const at = () => {
      const a = (this.scene.time.now - t0) / 170;
      return { x, y: (f.y0 + f.y1) / 2 + Math.sin(a) * (f.y1 - f.y0) * 0.32 };
    };
    this.hand.follow('grab', () => ({ x: this.block.x, y: this.block.y }));
    const from = this.progress;
    this.scene.tweens.addCounter({
      from: 0,
      to: 1,
      duration: TUNING.help.grateMs,
      onUpdate: (tw) => {
        if (this.finishing) return;
        const p = at();
        this.block.setPosition(p.x, p.y);
        // Whatever is left is spread evenly over her strokes.
        const want = from + (1 - from) * (tw.getValue() ?? 1);
        this.rub(Math.max(0, want - this.progress) * this.params.distance * this.k, p.x);
      },
      onComplete: () => this.finish(),
    });
  }
}
