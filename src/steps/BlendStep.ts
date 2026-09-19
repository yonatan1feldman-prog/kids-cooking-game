import Phaser from 'phaser';
import { ART, IMAGES } from '../core/assets';
import { blenderLoop, voice } from '../core/audio';
import { boing, burst } from '../core/fx';
import { tapMotion, type HandMotion } from '../core/hand';
import { sfx } from '../core/sfx';
import type { BlendParams } from '../recipes/types';
import { BOWL_DEPTH, PrepBowl } from './PrepBowl';
import { Step } from './Step';

type Phase = 'lid' | 'blend' | 'done';

/** The lid waiting on the counter (x the jar's scale), and how far above the mouth it starts its drop. */
const LID_REST = 0.9;
/** The button's touch area (radius in world units at k = 1): big and forgiving. */
const BUTTON_REACH = 190;

/**
 * Blend (reusable: a smoothie, a milkshake, a soup, anything whizzed in a blender or a mixer). The jar the step before
 * left stands on its motor base (the kept bowl with its `stand`: the base and its big button).
 * - lid: the lid lies on the counter beside the jar; a tap on it (or on the jar) puts it on: it drops onto the mouth,
 *   `lidSound`, `lidLine` before, then `line` ("Press the big button!").
 * - blend: while a finger is on the big button the blender runs: the button shows pressed and lit, the jar shakes a
 *   little, the contents swirl, the motor loop plays, and the running time adds up; the contents go through `stages`
 *   (chunky to smooth) as it adds up to `runMs`. A tap runs it at least `tapMs`, so taps add up too: holding is never
 *   needed. Letting go stops it at once (after that short run). Everything answers the finger; nothing can go wrong.
 * - done: `doneLine`, the lid comes off by itself, and the jar (the kept bowl) is left for the next step.
 * Hint after 5 s (Mom's finger taps the lid, then presses the button); her help puts the lid on and holds the button.
 */
export class BlendStep extends Step<BlendParams> {
  private bowl!: PrepBowl;
  private lid!: Phaser.GameObjects.Image;
  private button!: Phaser.GameObjects.Image;
  private phase: Phase = 'lid';
  private pressing = false;
  /** Ms the motor still runs after the finger lifted (a tap's short run). */
  private runLeft = 0;
  private ran = 0;
  private stage = -1;
  private swirl = 0;
  private sinceBit = 0;
  private helping = false;
  private k = 1;
  /** Where the lid sits on the still jar. */
  private lidAt = { x: 0, y: 0 };

  start() {
    const p = this.params;
    this.k = this.layout.k;
    this.stepLine = p.lidLine;
    this.workspace('none');
    this.bowl = PrepBowl.take(this.ctx) ?? new PrepBowl(this.ctx, p.bowl, p.from, undefined);
    if (!this.bowl.contents.visible) this.bowl.setContents(p.from);
    this.button = this.bowl.stand[1] ?? this.own(this.scene.add.image(this.bowl.back.x, this.bowl.back.y, p.buttonOff));
    // The lid lies on the counter, left of the jar.
    const s = this.bowl.scale;
    const b = this.bowl.bounds();
    const rest = { x: b.x - 260 * s * LID_REST, y: b.bottom - 170 * s };
    this.lid = this.own(this.scene.add.image(rest.x, rest.y, p.lid).setScale(s * LID_REST).setDepth(BOWL_DEPTH.front + 0.1).setAlpha(0));
    this.scene.tweens.add({ targets: this.lid, alpha: 1, duration: 350 });

    this.onDown((q) => {
      if (this.phase === 'lid') {
        if (this.onLid(q.worldX, q.worldY)) {
          this.poke();
          this.hit();
          this.putLidOn();
        } else this.miss();
        return;
      }
      if (this.phase !== 'blend') return;
      if (!this.onButton(q.worldX, q.worldY)) return this.miss();
      this.hit();
      this.press(true);
    });
    this.onUp(() => this.press(false));
    this.setIdle(true);
  }

  update(delta: number) {
    super.update(delta);
    if (this.phase !== 'blend') return;
    const on = this.pressing || this.runLeft > 0;
    if (!this.pressing) this.runLeft = Math.max(0, this.runLeft - delta);
    this.motor(on);
    if (!on) return;
    this.ran += delta;
    if (!this.helping) this.poke();
    this.shake(delta);
    const p = this.params;
    // The contents change through the stages as the running time adds up (the first right away: it starts whizzing).
    const n = p.stages.length;
    const i = Math.min(n - 1, Math.floor((this.ran / p.runMs) * n + 0.35));
    if (i > this.stage) {
      this.stage = i;
      this.bowl.crossfade(p.stages[i], 260);
    }
    if (this.ran >= p.runMs) this.finish();
  }

  private onLid(x: number, y: number) {
    const pad = 60 * this.k;
    const a = this.lid.getBounds();
    const b = this.bowl.bounds();
    const inside = (r: Phaser.Geom.Rectangle) => x > r.x - pad && x < r.right + pad && y > r.y - pad && y < r.bottom + pad;
    return inside(a) || inside(b);
  }

  private onButton(x: number, y: number) {
    return Phaser.Math.Distance.Between(x, y, this.button.x, this.button.y) < BUTTON_REACH * this.k || this.bowl.bounds().contains(x, y);
  }

  /** Where the lid sits on the jar (its seat on the mouth). */
  private lidSpot() {
    const m = ART.smoothie.jarMouth;
    const at = this.bowl.point(m.x, m.y);
    const [w, h] = IMAGES[this.params.lid].size;
    const s = this.bowl.scale;
    return { x: at.x + (w / 2 - ART.smoothie.lidSeat.x) * s, y: at.y + (h / 2 - ART.smoothie.lidSeat.y) * s };
  }

  /** The lid goes up, over and drops onto the jar's mouth. */
  private putLidOn() {
    if (this.phase !== 'lid') return;
    this.phase = 'blend';
    this.hand.stop();
    const to = (this.lidAt = this.lidSpot());
    const s = this.bowl.scale;
    sfx(this.scene, 'whoosh', { volume: 0.4 });
    this.scene.tweens.killTweensOf(this.lid);
    this.scene.tweens.add({
      targets: this.lid,
      x: to.x,
      y: to.y - 140 * s,
      scale: s,
      duration: 380,
      ease: 'Sine.easeOut',
      onComplete: () =>
        this.scene.tweens.add({
          targets: this.lid,
          y: to.y,
          duration: 160,
          ease: 'Quad.easeIn',
          onComplete: () => {
            sfx(this.scene, this.params.lidSound);
            boing(this.scene, this.bowl.front, 0.04);
            this.poke();
          },
        }),
    });
    this.stepLine = this.params.line;
    voice.say(this.params.line, { valid: () => this.phase === 'blend' && this.ran === 0, ttlMs: 4000 });
  }

  /** The finger on the button (or off it): it shows pressed at once, and a tap runs the motor at least `tapMs`. */
  private press(on: boolean) {
    if (on === this.pressing) return;
    this.pressing = on;
    if (on) {
      this.runLeft = this.params.tapMs;
      this.poke();
      sfx(this.scene, 'tap', { volume: 0.5 });
    }
    if (this.phase === 'blend') this.button.setTexture(on || this.runLeft > 0 ? this.params.buttonOn : this.params.buttonOff);
  }

  private motorOn = false;
  /** The motor loop and the button's light follow the running (not only the finger: a tap's short run too). */
  private motor(on: boolean) {
    if (on === this.motorOn) return;
    this.motorOn = on;
    if (on) blenderLoop.start();
    else blenderLoop.stop();
    this.button.setTexture(on ? this.params.buttonOn : this.params.buttonOff);
    if (!on) this.rest();
  }

  /** A gentle shake of the jar (and the lid), the contents swirling, a few bits whirling up inside. */
  private shake(delta: number) {
    const k = this.k;
    this.swirl += delta;
    const t = this.swirl / 1000;
    const dx = Math.sin(t * 55) * 2.2 * k;
    const home = this.bowl.position;
    for (const o of [this.bowl.back, this.bowl.contents, this.bowl.front, ...this.bowl.extras]) o.setX(home.x + dx);
    this.lid.setX(this.lidAt.x + dx);
    this.bowl.contents.setAngle(Math.sin(t * 9) * 3);
    this.sinceBit += delta;
    if (this.sinceBit > 140) {
      this.sinceBit = 0;
      const o = this.bowl.opening();
      const y = o.y + (this.bowl.contents.displayHeight * 0.45) * Math.random();
      burst(this.scene, o.x + (Math.random() - 0.5) * o.rx, y, { count: 2, size: 12 * k, tint: [this.params.tint, 0xffffff], speed: 160 * k, gravityY: 300, depth: BOWL_DEPTH.contents + 0.02 });
    }
  }

  /** Still again: everything back in its place. */
  private rest() {
    const home = this.bowl.position;
    for (const o of [this.bowl.back, this.bowl.contents, this.bowl.front, ...this.bowl.extras]) o.setX(home.x);
    this.bowl.contents.setAngle(0);
    if (this.phase !== 'lid') this.lid.setX(this.lidAt.x);
  }

  /** Smooth: the motor stops, "All smooth!", the lid comes off, and the jar is left for pouring. */
  private finish() {
    if (this.phase !== 'blend') return;
    this.phase = 'done';
    this.pressing = false;
    this.runLeft = 0;
    this.motor(false);
    this.helping = false;
    this.hand.stop();
    this.setIdle(false);
    this.poke();
    boing(this.scene, this.bowl.front, 0.06);
    voice.say(this.params.doneLine, { ttlMs: 4000 });
    const s = this.bowl.scale;
    this.scene.time.delayedCall(700, () => {
      if (this.aborted) return;
      this.scene.tweens.add({ targets: this.lid, y: this.lid.y - 120 * s, alpha: 0, duration: 450, ease: 'Sine.easeIn' });
    });
    this.scene.time.delayedCall(1250, () => {
      if (this.aborted) return;
      this.bowl.keep();
      this.complete();
    });
  }

  abort() {
    super.abort();
    blenderLoop.stop();
  }

  cancelGesture() {
    super.cancelGesture();
    this.pressing = false;
    this.runLeft = 0;
  }

  /** Lid: Mom's finger taps the lid. Blend: her finger presses the big button and holds it. */
  protected demo(): HandMotion | null {
    const k = this.k;
    if (this.phase === 'lid') return tapMotion({ x: this.lid.x, y: this.lid.y }, k);
    if (this.phase !== 'blend') return null;
    const at = { x: this.button.x, y: this.button.y };
    return {
      kind: 'point',
      keys: [
        { x: at.x + 60 * k, y: at.y + 70 * k, t: 0 },
        { x: at.x, y: at.y, t: 450 },
        { x: at.x, y: at.y, t: 2000, press: true },
        { x: at.x + 60 * k, y: at.y + 70 * k, t: 2400 },
      ],
      glow: at,
    };
  }

  /** Mom helps: she puts the lid on, then holds the button until it is smooth. */
  protected autoFinish() {
    if (this.phase === 'lid') {
      this.hand.play({ ...tapMotion({ x: this.lid.x, y: this.lid.y }, this.k), glow: undefined }, {
        onDone: () => {
          this.putLidOn();
          this.scene.time.delayedCall(700, () => this.helpBlend());
        },
      });
      return;
    }
    this.helpBlend();
  }

  private helpBlend() {
    if (this.aborted || this.phase !== 'blend') return;
    this.helping = true;
    this.hand.follow('point', () => ({ x: this.button.x, y: this.button.y }));
    this.press(true);
  }
}
