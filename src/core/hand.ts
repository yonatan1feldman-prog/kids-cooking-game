import Phaser from 'phaser';
import { ART, FX_SOFT, IMAGES, type ImageKey, type MomHand } from './assets';
import type { Layout } from './layout';
import { HINT_AFTER_MS } from './tuning';

type P = { x: number; y: number };

/** One keyframe of a hand motion: where the anchor is at time t (ms). `press` shrinks it a little (a tap). */
export interface HandKey extends P {
  t: number;
  press?: boolean;
}

/** Something Mom holds while she shows it (a rolling pin, a topping, the pizza, a slice). Never the real item. */
export interface HandProp {
  key: string;
  /** Offset of the prop's centre from the hand's anchor, world units. */
  dx?: number;
  dy?: number;
  scale: number;
  /** Scale at the end of the motion (it shrinks or grows along the way; its offset scales with it). */
  endScale?: number;
  angle?: number;
  alpha?: number;
  /** Origin of the prop (default centre). */
  originX?: number;
  originY?: number;
  /** Fade the prop out from this time on (ms), e.g. it "melts" into the pizza instead of landing. */
  fadeFrom?: number;
  tint?: number;
}

export interface HandMotion {
  kind: MomHand;
  keys: HandKey[];
  props?: HandProp[];
  /** Soft glow on this point (hints only: where to touch first). */
  glow?: P;
  /** Runs when the motion ends for any reason (done, interrupted, progress): undo anything it hid. */
  onStop?: () => void;
}

/** Display scale of each demo hand (x k), from the art agent's checked scenes (images-b/scenes.js, CRITIQUE.md). */
export const HAND_SCALE: Record<MomHand, number> = { point: 0.62, roll: 0.66, spread: 0.66, sprinkle: 1.1, grab: 0.66 };

const FADE = 200;

/** Mom's finger comes in and taps a point twice (buttons, the tap on the oven, the tap). */
export function tapMotion(at: P, k: number): HandMotion {
  return {
    kind: 'point',
    keys: [
      { x: at.x + 60 * k, y: at.y + 70 * k, t: 0 },
      { x: at.x, y: at.y, t: 400 },
      { x: at.x, y: at.y, t: 600, press: true },
      { x: at.x, y: at.y, t: 800 },
      { x: at.x, y: at.y, t: 1000, press: true },
      { x: at.x + 60 * k, y: at.y + 70 * k, t: 1500 },
    ],
    glow: at,
  };
}

/**
 * The hint on screens without steps (title, home): after HINT_AFTER_MS without a touch, Mom's pointing
 * hand taps the target, looping, until the next touch. Nothing else moves by itself. The clock only
 * runs while the scene updates (paused on the rotate screen). `ready()` false = the art is not in yet.
 */
export function screenHint(scene: Phaser.Scene, layout: Layout, target: () => P | null, ready: () => boolean) {
  let hand: MomHandView | null = null;
  let idle = 0;
  let showing = false;
  let off = false;
  const reset = () => {
    idle = 0;
    if (showing) hand?.stop();
    showing = false;
  };
  const tick = (_t: number, delta: number) => {
    if (off || showing || !ready()) return;
    idle += delta;
    if (idle < HINT_AFTER_MS) return;
    const at = target();
    if (!at) return;
    hand ??= new MomHandView(scene, layout);
    showing = true;
    hand.play(tapMotion(at, layout.k), { loop: true, gapMs: 900 });
  };
  scene.events.on(Phaser.Scenes.Events.UPDATE, tick);
  scene.input.on(Phaser.Input.Events.POINTER_DOWN, reset);
  const stop = () => {
    off = true;
    reset();
    scene.events.off(Phaser.Scenes.Events.UPDATE, tick);
    scene.input.off(Phaser.Input.Events.POINTER_DOWN, reset);
  };
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, stop);
  return { stop };
}

/**
 * Mom's demo hand: one of the five mom-hand-* images, placed by its anchor (the fingertip, the palm,
 * the spoon bowl, the pinch, the carry point: ART.momHands). It plays a keyframed motion once (the demo
 * before a step, at most 2.5 s), in a loop with a pause (the hint after 5 s idle), or follows a point
 * every frame (Mom helping: `follow`). It never touches the real dish: anything it carries is a prop.
 */
export class MomHandView {
  private img: Phaser.GameObjects.Image;
  private glow: Phaser.GameObjects.Image;
  private props: Phaser.GameObjects.Image[] = [];
  private tween?: Phaser.Tweens.Tween;
  private glowTween?: Phaser.Tweens.Tween;
  private followFn?: () => P | null;
  private kind: MomHand = 'point';
  private onStop?: () => void;

  constructor(private scene: Phaser.Scene, private layout: Layout) {
    this.img = scene.add.image(0, 0, 'mom-hand-point').setDepth(1000).setVisible(false);
    this.glow = scene.add.image(0, 0, FX_SOFT).setDepth(999).setVisible(false).setTint(0xffe066).setBlendMode(Phaser.BlendModes.ADD);
    this.glow.setScale((360 * layout.k) / this.glow.frame.realWidth);
    scene.events.on(Phaser.Scenes.Events.UPDATE, this.onUpdate, this);
    this.img.once(Phaser.GameObjects.Events.DESTROY, () => scene.events.off(Phaser.Scenes.Events.UPDATE, this.onUpdate, this));
  }

  get active() {
    return this.img.visible;
  }

  /** Where the anchor is while the hand shows (null when hidden): Mom and Pipa watch it. */
  get position(): P | null {
    return this.img.visible ? { x: this.img.x, y: this.img.y } : null;
  }

  private setKind(kind: MomHand, scale?: number) {
    this.kind = kind;
    const key = `mom-hand-${kind}` as ImageKey;
    const [w, h] = IMAGES[key].size;
    const a = ART.momHands[kind];
    this.img.setTexture(key).setOrigin(a.x / w, a.y / h);
    this.img.setScale((scale ?? HAND_SCALE[kind]) * this.layout.k);
  }

  private makeProps(list: HandProp[] = []) {
    this.props = list.map((p) => {
      const img = this.scene.add.image(0, 0, p.key).setDepth(998).setScale(p.scale).setAngle(p.angle ?? 0).setAlpha(p.alpha ?? 1);
      img.setOrigin(p.originX ?? 0.5, p.originY ?? 0.5);
      if (p.tint !== undefined) img.setTint(p.tint);
      img.setData('prop', p);
      return img;
    });
  }

  private place(x: number, y: number, alpha: number, t: number, press = 0, total = 1) {
    const base = HAND_SCALE[this.kind] * this.layout.k;
    this.img.setPosition(x, y).setAlpha(alpha).setScale(base * (1 - 0.1 * press));
    for (const img of this.props) {
      const p = img.getData('prop') as HandProp;
      let a = alpha * (p.alpha ?? 1);
      if (p.fadeFrom !== undefined && t > p.fadeFrom) a *= Math.max(0, 1 - (t - p.fadeFrom) / 250);
      const sc = p.endScale === undefined ? p.scale : Phaser.Math.Linear(p.scale, p.endScale, Phaser.Math.Clamp(t / total, 0, 1));
      const f = sc / p.scale;
      img.setScale(sc).setPosition(x + (p.dx ?? 0) * f, y + (p.dy ?? 0) * f).setAlpha(a);
    }
  }

  /**
   * Plays a motion. Once: fades in, moves through the keyframes, fades out, then `onDone`.
   * With `loop`, it repeats after `gapMs` until stopped (the idle hint).
   */
  play(m: HandMotion, opts: { loop?: boolean; gapMs?: number; onDone?: () => void } = {}) {
    this.stop();
    this.setKind(m.kind);
    this.makeProps(m.props);
    this.onStop = m.onStop;
    const keys = m.keys;
    const total = keys[keys.length - 1].t;
    this.img.setVisible(true);
    this.place(keys[0].x, keys[0].y, 0, 0);
    if (m.glow) {
      this.glow.setPosition(m.glow.x, m.glow.y).setAlpha(0).setVisible(true);
      this.glowTween = this.scene.tweens.add({ targets: this.glow, alpha: { from: 0.15, to: 0.7 }, duration: 600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }
    this.tween = this.scene.tweens.addCounter({
      from: 0,
      to: total,
      duration: total,
      repeat: opts.loop ? -1 : 0,
      repeatDelay: opts.gapMs ?? 900,
      onRepeat: () => {
        // Props that faded out come back for the next round.
        this.props.forEach((p) => p.setAlpha((p.getData('prop') as HandProp).alpha ?? 1));
      },
      onUpdate: (tw) => {
        const t = tw.getValue() ?? 0;
        let i = 0;
        while (i < keys.length - 2 && t > keys[i + 1].t) i++;
        const a = keys[i];
        const b = keys[Math.min(i + 1, keys.length - 1)];
        const span = Math.max(1, b.t - a.t);
        const f = Phaser.Math.Easing.Sine.InOut(Phaser.Math.Clamp((t - a.t) / span, 0, 1));
        const press = (a.press ? 1 - f : 0) + (b.press ? f : 0);
        const alpha = Math.min(1, t / FADE, (total - t) / FADE);
        this.place(Phaser.Math.Linear(a.x, b.x, f), Phaser.Math.Linear(a.y, b.y, f), Math.max(0, alpha), t, press, total);
      },
      onComplete: () => {
        this.stop();
        opts.onDone?.();
      },
    });
  }

  /** Mom helping: the hand shows and follows `at()` every frame (null = hide it for now) until stopped. */
  follow(kind: MomHand, at: () => P | null) {
    this.stop();
    this.setKind(kind);
    this.followFn = at;
    this.img.setAlpha(0).setVisible(true);
    this.scene.tweens.add({ targets: this.img, alpha: 1, duration: FADE });
    this.onUpdate();
  }

  private onUpdate() {
    if (!this.followFn) return;
    const p = this.followFn();
    if (!p) return this.img.setAlpha(0);
    if (this.img.alpha === 0) this.img.setAlpha(1);
    this.img.setPosition(p.x, p.y);
  }

  stop() {
    const undo = this.onStop;
    this.onStop = undefined;
    undo?.();
    this.tween?.destroy();
    this.tween = undefined;
    this.glowTween?.destroy();
    this.glowTween = undefined;
    this.followFn = undefined;
    this.scene.tweens.killTweensOf(this.img);
    this.props.forEach((p) => p.destroy());
    this.props = [];
    this.img.setVisible(false);
    this.glow.setVisible(false);
  }

  destroy() {
    this.stop();
    this.img.destroy();
    this.glow.destroy();
  }
}
