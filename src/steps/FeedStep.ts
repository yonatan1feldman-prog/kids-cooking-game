import Phaser from 'phaser';
import { boing, burst, puff, stars } from '../core/fx';
import { fit, MIN_DRAG_SHARE } from '../core/layout';
import { sfx } from '../core/sfx';
import type { FeedParams } from '../recipes/types';
import { Step } from './Step';

interface Slice {
  img: Phaser.GameObjects.Image;
  home: { x: number; y: number; angle: number };
  eaten: boolean;
}

/**
 * Feeding: the dish is cut into slices; drag each slice to the character's mouth.
 * The character always eats everything and reacts with over-the-top joy.
 * After the last slice: a star party, then back to the home screen.
 */
export class FeedStep extends Step<FeedParams> {
  private slices: Slice[] = [];
  private held?: { s: Slice; dx: number; dy: number };
  private char!: Phaser.GameObjects.Container;
  private body!: Phaser.GameObjects.Image;
  private eyes!: Phaser.GameObjects.Image;
  private mouthOpen!: Phaser.GameObjects.Image;
  private mouthClosed!: Phaser.GameObjects.Image;
  private charRest = { x: 0, y: 0 };
  private busy = 0;
  private eatenCount = 0;
  private sliceScale = 1;
  private partyStarted = false;

  start() {
    const { u, W, H } = this.layout;

    // Character, built from parts so the mouth and eyes can move.
    this.body = new Phaser.GameObjects.Image(this.scene, 0, 0, this.params.body);
    fit(this.body, u * 0.56, u * 0.6);
    const bw = this.body.displayWidth;
    const bh = this.body.displayHeight;
    this.eyes = new Phaser.GameObjects.Image(this.scene, 0, -bh * 0.12, this.params.eyes);
    fit(this.eyes, bw * 0.5, bh * 0.2);
    this.mouthClosed = new Phaser.GameObjects.Image(this.scene, 0, bh * 0.1, this.params.mouthClosed);
    fit(this.mouthClosed, bw * 0.34, bh * 0.16);
    this.mouthOpen = new Phaser.GameObjects.Image(this.scene, 0, bh * 0.12, this.params.mouthOpen).setVisible(false);
    fit(this.mouthOpen, bw * 0.36, bh * 0.26);
    this.charRest = { x: this.layout.cx, y: H * 0.1 + bh / 2 };
    this.char = this.own(this.scene.add.container(this.charRest.x, -bh, [this.body, this.eyes, this.mouthClosed, this.mouthOpen]));
    this.char.setDepth(5);
    this.scene.tweens.add({ targets: this.char, y: this.charRest.y, duration: 700, ease: 'Bounce.easeOut' });
    this.scene.tweens.add({ targets: this.body, scaleY: this.body.scaleY * 1.03, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    // Cut the dish into slices arranged as a wheel below the character.
    const charBottom = this.charRest.y + bh / 2;
    const plateY = Math.min(this.ctx.dishHome.y + u * 0.08, (charBottom + this.layout.safeBottom) / 2 + u * 0.02);
    const n = this.params.slices;
    const sliceSize = Math.max(u * 0.27, W * MIN_DRAG_SHARE);
    const ring = sliceSize * 0.62;
    sfx(this.scene, 'whoosh');
    this.scene.tweens.add({
      targets: this.dish,
      x: this.layout.cx,
      y: plateY,
      scale: (ring * 2 + sliceSize * 0.4) / (this.dish.R * 2),
      alpha: 0,
      duration: 500,
      onComplete: () => this.dish.setVisible(false),
    });
    for (let i = 0; i < n; i++) {
      const a = -Math.PI / 2 + (i / n) * Math.PI * 2;
      // Tip of the slice (bottom of the image) points to the plate center.
      const home = { x: this.layout.cx + Math.cos(a) * ring, y: plateY + Math.sin(a) * ring, angle: Phaser.Math.RadToDeg(a) - 90 };
      const img = this.own(this.scene.add.image(this.layout.cx, plateY, this.params.slice).setDepth(20).setAngle(home.angle));
      fit(img, sliceSize);
      this.sliceScale = img.scale;
      img.setScale(0);
      this.scene.tweens.add({ targets: img, x: home.x, y: home.y, scale: this.sliceScale, duration: 450, delay: 150 + i * 60, ease: 'Back.easeOut' });
      this.slices.push({ img, home, eaten: false });
    }

    this.onDown((p) => {
      if (this.held) return;
      const s = this.sliceAt(p.worldX, p.worldY);
      if (!s) return;
      this.poke();
      sfx(this.scene, 'tap');
      this.scene.tweens.killTweensOf(s.img);
      s.img.setDepth(30).setScale(this.sliceScale * 1.1);
      this.scene.tweens.add({ targets: s.img, angle: 180, duration: 200 });
      this.held = { s, dx: s.img.x - p.worldX, dy: s.img.y - p.worldY };
      this.openMouth(true);
    });
    this.onMove((p) => {
      if (!this.held) return;
      this.held.s.img.setPosition(p.worldX + this.held.dx, p.worldY + this.held.dy);
      this.poke();
    });
    this.onUp(() => {
      if (!this.held) return;
      const { s } = this.held;
      this.held = undefined;
      if (this.nearMouth(s.img.x, s.img.y)) this.eat(s);
      else {
        this.openMouth(false);
        sfx(this.scene, 'whoosh', { volume: 0.4 });
        this.scene.tweens.add({ targets: s.img, x: s.home.x, y: s.home.y, angle: s.home.angle, scale: this.sliceScale, duration: 400, ease: 'Back.easeOut' });
        s.img.setDepth(20);
      }
    });

    this.setIdle(true);
  }

  private get mouthWorld() {
    return { x: this.char.x + this.mouthOpen.x, y: this.char.y + this.mouthOpen.y };
  }

  /** Very forgiving: near the mouth, or anywhere over the character. */
  private nearMouth(x: number, y: number) {
    const m = this.mouthWorld;
    if (Phaser.Math.Distance.Between(x, y, m.x, m.y) < this.layout.u * 0.4) return true;
    return y < this.charRest.y + this.body.displayHeight * 0.6;
  }

  private sliceAt(x: number, y: number) {
    let best: Slice | undefined;
    let bestD = Infinity;
    for (const s of this.slices) {
      if (s.eaten) continue;
      const d = Phaser.Math.Distance.Between(x, y, s.img.x, s.img.y);
      if (d < bestD) {
        bestD = d;
        best = s;
      }
    }
    return best && bestD < best.img.displayWidth * 0.75 ? best : undefined;
  }

  private openMouth(open: boolean) {
    this.mouthOpen.setVisible(open);
    this.mouthClosed.setVisible(!open);
  }

  private eat(s: Slice) {
    s.eaten = true;
    this.busy++;
    const m = this.mouthWorld;
    this.openMouth(true);
    this.scene.tweens.add({
      targets: s.img,
      x: m.x,
      y: m.y,
      scale: 0,
      duration: 260,
      ease: 'Quad.easeIn',
      onComplete: () => {
        s.img.setVisible(false);
        this.eatenCount++;
        sfx(this.scene, 'munch', { vary: true });
        burst(this.scene, m.x, m.y, { tint: [0xd9a45f, 0xffd23f, 0xe53935], count: 12, size: 20, speed: 450 });
        this.chew();
        this.react(this.eatenCount);
        this.scene.time.delayedCall(900, () => {
          this.busy--;
          if (this.slices.every((x) => x.eaten) && this.busy === 0) this.party();
        });
      },
    });
  }

  private chew() {
    let open = false;
    this.scene.time.addEvent({
      delay: 110,
      repeat: 6,
      callback: () => {
        open = !open;
        this.openMouth(open);
      },
    });
    this.scene.time.delayedCall(110 * 7 + 20, () => {
      if (!this.held) this.openMouth(false);
    });
  }

  /** Over-the-top happiness, a different gag each time. */
  private react(i: number) {
    const u = this.layout.u;
    boing(this.scene, this.eyes, 0.4);
    stars(this.scene, this.char.x, this.char.y - this.body.displayHeight * 0.3, 5, u * 0.05);
    switch (i % 3) {
      case 1: // jump
        this.scene.tweens.add({ targets: this.char, y: this.charRest.y - u * 0.12, duration: 220, yoyo: true, ease: 'Quad.easeOut' });
        break;
      case 2: // happy wiggle
        this.scene.tweens.add({ targets: this.char, angle: { from: -12, to: 12 }, duration: 90, yoyo: true, repeat: 3, onComplete: () => this.char.setAngle(0) });
        break;
      default: // big belly squash
        boing(this.scene, this.char, 0.25);
        puff(this.scene, this.char.x, this.char.y + this.body.displayHeight * 0.3, 0xfff0f6, 5, u * 0.08);
    }
  }

  private party() {
    if (this.partyStarted) return;
    this.partyStarted = true;
    this.setIdle(false);
    const { u, W, H } = this.layout;
    sfx(this.scene, 'cheer', { vary: false });
    this.openMouth(true);
    for (let k = 0; k < 5; k++) {
      this.scene.time.delayedCall(k * 350, () => stars(this.scene, Phaser.Math.Between(W * 0.2, W * 0.8), Phaser.Math.Between(H * 0.2, H * 0.6), 14, u * 0.08));
    }
    this.scene.tweens.add({ targets: this.char, y: this.charRest.y - u * 0.1, duration: 260, yoyo: true, repeat: 4, ease: 'Quad.easeOut' });
    this.scene.tweens.add({ targets: this.char, angle: { from: -8, to: 8 }, duration: 260, yoyo: true, repeat: 4 });
    this.scene.time.delayedCall(3200, () => this.complete());
  }

  protected showHint() {
    const s = this.slices.find((x) => !x.eaten);
    if (s) this.hand.drag({ x: s.img.x, y: s.img.y }, this.mouthWorld);
  }

  protected autoFinish() {
    if (this.held) {
      const { s } = this.held;
      this.held = undefined;
      this.eat(s);
    }
    const left = this.slices.filter((x) => !x.eaten);
    left.forEach((s, i) => this.scene.time.delayedCall(250 + i * 650, () => this.eat(s)));
  }
}
