import Phaser from 'phaser';
import { boing, burst } from './fx';
import { FX_SHADOW } from './placeholders';
import { sfx } from './sfx';

/**
 * The premium round's motion language (research/premium-spec.md 4.1): everything she moves moves like a piece of paper.
 * Lifted it grows a little and tips; carried it sways (juice.ts `sway`); put down it squashes and settles with a little
 * overshoot; a pressed button sinks and springs back; things arrive from small with an overshoot and leave shrinking.
 * One place for the numbers, so every step feels the same. Only tweens on what is already drawn (scale, angle, alpha, x,
 * y): no new textures but the one soft contact shadow (`fx-shadow`, drawn in code), no filters. Each call is an answer to
 * something she did (wellbeing rule 5); none loops.
 *
 * Scales are relative to the thing's resting scale, remembered on first use (like fx.ts `boing`), so quick repeats never
 * make it drift in size. Call `setRest(img)` after changing its size on purpose.
 */

export const PAPER = {
  lift: { scale: 1.06, angle: -3, ms: 120 },
  drop: { squashX: 1.08, squashY: 0.88, squashMs: 90, settleMs: 260, back: 1.7 },
  press: { down: 0.92, downMs: 80, over: 1.04, upMs: 220 },
  appear: { from: 0.6, ms: 320, stagger: 40 },
  vanish: { to: 0.8, ms: 180 },
  wrong: { angle: 6, ms: 220 },
  shadow: { alpha: 0.22, liftedAlpha: 0.12, liftedScale: 1.25, width: 0.8, ink: 0x3a2216 },
} as const;


type Thing = Phaser.GameObjects.GameObject & Phaser.GameObjects.Components.Transform & Phaser.GameObjects.Components.Alpha;
type Sized = Thing & { displayWidth: number; displayHeight: number; depth: number; visible: boolean };

const rest = (t: Thing) => {
  if (t.getData('restScaleX') === undefined) t.setData({ restScaleX: t.scaleX, restScaleY: t.scaleY });
  return { sx: t.getData('restScaleX') as number, sy: t.getData('restScaleY') as number };
};

/** After changing a thing's size on purpose: later paper motions rest at the new size (the same data fx.ts `boing` uses). */
export function setRest(t: Thing) {
  t.setData({ restScaleX: t.scaleX, restScaleY: t.scaleY });
}

/** Stops this module's running motion on `t` (only its own: other tweens on the thing go on). */
function stop(t: Thing) {
  (t.getData('paperTween') as Phaser.Tweens.Tween | Phaser.Tweens.TweenChain | undefined)?.stop();
}
const keep = (t: Thing, tw: Phaser.Tweens.Tween | Phaser.Tweens.TweenChain) => {
  t.setData('paperTween', tw);
  return tw;
};

/**
 * Picked up: it grows a little and tips toward where it goes (`dir` -1 left / 1 right), and its shadow (if it has one)
 * stays on the table, lighter and wider, as if it were higher. A soft paper rustle.
 */
export function lift(scene: Phaser.Scene, t: Thing, opts: { dir?: number; sound?: boolean } = {}) {
  const { sx, sy } = rest(t);
  stop(t);
  const p = PAPER.lift;
  if (opts.sound !== false) sfx(scene, 'paper-lift', { pitch: 'vary', volume: 0.7 });
  shadowLift(scene, t, true);
  return keep(t, scene.tweens.add({ targets: t, scaleX: sx * p.scale, scaleY: sy * p.scale, angle: p.angle * (opts.dir ?? 1), duration: p.ms, ease: 'Quad.easeOut' }));
}

/** Put down: a quick squash (wide and low), then it settles to its size with a little overshoot; its shadow comes back. */
export function drop(scene: Phaser.Scene, t: Thing, opts: { sound?: boolean } = {}) {
  const { sx, sy } = rest(t);
  stop(t);
  const p = PAPER.drop;
  if (opts.sound !== false) sfx(scene, 'paper-drop', { pitch: 'vary' });
  shadowLift(scene, t, false);
  return keep(
    t,
    scene.tweens.chain({
      targets: t,
      tweens: [
        { scaleX: sx * p.squashX, scaleY: sy * p.squashY, angle: 0, duration: p.squashMs, ease: 'Quad.easeOut' },
        { scaleX: sx, scaleY: sy, duration: p.settleMs, ease: 'Back.easeOut', easeParams: [p.back] },
      ],
    }),
  );
}

/** A button pressed: it sinks, then springs back just past its size and settles. (Its sound is the button's own.) */
export function press(scene: Phaser.Scene, t: Thing) {
  const { sx, sy } = rest(t);
  stop(t);
  const p = PAPER.press;
  return keep(
    t,
    scene.tweens.chain({
      targets: t,
      tweens: [
        { scaleX: sx * p.down, scaleY: sy * p.down, duration: p.downMs, ease: 'Quad.easeOut' },
        { scaleX: sx * p.over, scaleY: sy * p.over, duration: p.upMs * 0.45, ease: 'Quad.easeOut' },
        { scaleX: sx, scaleY: sy, duration: p.upMs * 0.55, ease: 'Back.easeOut' },
      ],
    }),
  );
}

/**
 * Arrives: from small and clear to its size with an overshoot. A list arrives one after the other (`stagger` ms apart
 * by default, `i` its place in the list). It must already be at its resting scale when called.
 */
export function appear(scene: Phaser.Scene, t: Thing, i = 0, opts: { alpha?: number } = {}) {
  const { sx, sy } = rest(t);
  stop(t);
  const p = PAPER.appear;
  t.setScale(sx * p.from, sy * p.from).setAlpha(0);
  return keep(t, scene.tweens.add({ targets: t, scaleX: sx, scaleY: sy, alpha: opts.alpha ?? 1, duration: p.ms, delay: i * p.stagger, ease: 'Back.easeOut' }));
}

/** Leaves: it shrinks a little and fades; `destroy` (default) removes it when gone. */
export function vanish(scene: Phaser.Scene, t: Thing, opts: { destroy?: boolean; then?: () => void } = {}) {
  const { sx, sy } = rest(t);
  stop(t);
  const p = PAPER.vanish;
  return keep(
    t,
    scene.tweens.add({
      targets: t,
      scaleX: sx * p.to,
      scaleY: sy * p.to,
      alpha: 0,
      duration: p.ms,
      ease: 'Quad.easeIn',
      onComplete: () => {
        if (opts.destroy !== false) {
          (t.getData('shadow') as Phaser.GameObjects.Image | undefined)?.destroy();
          t.destroy();
        }
        opts.then?.();
      },
    }),
  );
}

/** Something that fell or was thrown lands: the usual boing and a few paper bits in its colour. */
export function land(scene: Phaser.Scene, t: Thing, tint = 0xfff6e0, k = 1) {
  boing(scene, t, 0.12);
  burst(scene, t.x, t.y, { texture: 'fx-paper', count: 4, tint, speed: 260, size: 18 * k, gravityY: 900, lifespan: 500, depth: 60 });
}

/** "Not here" (never a "wrong"): a gentle wobble and back, no sad sound (a soft tap at most). */
export function wrong(scene: Phaser.Scene, t: Thing, opts: { sound?: boolean } = {}) {
  stop(t);
  const p = PAPER.wrong;
  if (opts.sound) sfx(scene, 'tap', { pitch: 'vary', volume: 0.5 });
  return keep(
    t,
    scene.tweens.chain({
      targets: t,
      tweens: [
        { angle: p.angle, duration: p.ms / 4, ease: 'Sine.easeOut' },
        { angle: -p.angle, duration: p.ms / 4, ease: 'Sine.easeInOut' },
        { angle: p.angle * 0.6, duration: p.ms / 4, ease: 'Sine.easeInOut' },
        { angle: 0, duration: p.ms / 4, ease: 'Sine.easeIn' },
      ],
    }),
  );
}

/**
 * A soft contact shadow under a thing that lies on a surface: an ink ellipse ~0.8 of its width, just under it in depth,
 * following it every frame (also when it is carried: then lighter and wider, staying on the surface, see `lift`).
 * `surfaceY` is where the shadow lies (default: the thing's bottom edge, measured once). Removed with the thing.
 */
export function shadowFor(scene: Phaser.Scene, t: Sized, opts: { surfaceY?: number; width?: number; alpha?: number } = {}) {
  if (!scene.textures.exists(FX_SHADOW)) return null;
  const old = t.getData('shadow') as Phaser.GameObjects.Image | undefined;
  if (old?.active) return old;
  const p = PAPER.shadow;
  const sh = scene.add.image(t.x, 0, FX_SHADOW).setTint(p.ink).setAlpha(opts.alpha ?? p.alpha);
  const w = (opts.width ?? p.width) * t.displayWidth;
  sh.setScale(w / sh.frame.realWidth, (w * 0.28) / sh.frame.realHeight);
  sh.setData({ base: { sx: sh.scaleX, sy: sh.scaleY, alpha: sh.alpha } });
  const dy = (opts.surfaceY ?? t.y + t.displayHeight * 0.45) - t.y;
  t.setData('shadow', sh);
  t.setData('shadowDy', dy);
  const follow = () => {
    if (!t.active || !sh.active) return;
    const lifted = !!t.getData('lifted');
    sh.setPosition(t.x, lifted ? (t.getData('shadowY') as number) : t.y + dy);
    sh.setDepth(t.depth - 0.01).setVisible(t.visible && t.alpha > 0.05);
  };
  follow();
  scene.events.on(Phaser.Scenes.Events.POST_UPDATE, follow);
  const off = () => {
    scene.events.off(Phaser.Scenes.Events.POST_UPDATE, follow);
    if (sh.active) sh.destroy();
  };
  t.once(Phaser.GameObjects.Events.DESTROY, off);
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, off);
  return sh;
}

/** The shadow when its thing is lifted (it stays where the thing was lying, lighter, wider) or put down again. */
function shadowLift(scene: Phaser.Scene, t: Thing, up: boolean) {
  const sh = t.getData('shadow') as Phaser.GameObjects.Image | undefined;
  if (!sh?.active) return;
  const base = sh.getData('base') as { sx: number; sy: number; alpha: number };
  const p = PAPER.shadow;
  t.setData('lifted', up);
  if (up) t.setData('shadowY', t.y + (t.getData('shadowDy') as number));
  scene.tweens.killTweensOf(sh);
  scene.tweens.add({
    targets: sh,
    scaleX: base.sx * (up ? p.liftedScale : 1),
    scaleY: base.sy * (up ? p.liftedScale : 1),
    alpha: up ? (base.alpha * p.liftedAlpha) / p.alpha : base.alpha,
    duration: up ? PAPER.lift.ms : PAPER.drop.squashMs,
    ease: 'Quad.easeOut',
  });
}
