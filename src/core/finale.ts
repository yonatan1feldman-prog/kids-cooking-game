import Phaser from 'phaser';
import { voice } from './audio';
import { boing, burst } from './fx';
import { confetti } from './juice';
import { SUNBEAM_KEY } from './scenery';
import { sfx } from './sfx';

/**
 * The premium round's endings (research/premium-spec.md 4.4), shared by the recipes, the games that are not cooking,
 * the clinic and the mermaid world:
 * - `stepDone`: a part she finished answers by itself: it boings, a few paper bits in its colours fly off and a ring of
 *   light grows from it, with the next bell of a rising scale (`chime-1..5`, then from 1 again). No stars: those are kept
 *   for the very end.
 * - `tada`: the end of a whole recipe or game is a little show: the camera leans in on what she made (x1.12), one soft
 *   beam of light slides over it, paper confetti, Mom and her friend cheer, a warm "ta-da" and "Ta-da! Look what you
 *   made!"; 1.4 s later the camera leans back and the ending goes on as before (the photo, the goodbye).
 * - `flyTo`: a picture shrinks and flies into a corner ("it is kept"), without a word.
 * Each one only answers something she did (wellbeing rule 5); tweens on what is drawn, textures that exist, no filters.
 * Particles stay well under the phone budget (40 alive): a step's end 10, the ta-da 24.
 */

type P = { x: number; y: number };
type Boingable = Phaser.GameObjects.GameObject & Phaser.GameObjects.Components.Transform;

/** The paper colours of the art (as juice.ts confetti). */
const PAPER_TINTS = [0xf28c8c, 0xffcb47, 0x8fcb6c, 0x7fb8e6, 0xff8c42, 0xfff6e0];
const CHIMES = ['chime-1', 'chime-2', 'chime-3', 'chime-4', 'chime-5'] as const;
const bells = new WeakMap<Phaser.Scene, number>();

/** The next bell of the rising scale for this scene's run (1, 2 ... 5, then 1 again); starts over with each run. */
export function chime(scene: Phaser.Scene, volume = 0.8) {
  if (!bells.has(scene)) scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => bells.delete(scene));
  const n = bells.get(scene) ?? 0;
  bells.set(scene, n + 1);
  sfx(scene, CHIMES[n % CHIMES.length], { pitch: 'fixed', volume });
  return (n % CHIMES.length) + 1;
}

/** Which bell rang last in this scene (0: none yet). For the test harness. */
export function chimesRung(scene: Phaser.Scene) {
  return bells.get(scene) ?? 0;
}

/**
 * A part she finished answers: `target` boings (if given), 10 paper bits in `tints` (default: the paper colours) fly
 * off `at`, a ring of light grows from it, and the next bell rings. `k` = the layout's content scale; `size` the
 * thing's rough width (world units at k = 1).
 */
export function stepDone(scene: Phaser.Scene, at: P, opts: { k: number; target?: Boingable; tints?: number[]; size?: number; bell?: boolean }) {
  const k = opts.k;
  const size = (opts.size ?? 260) * k;
  if (opts.target?.active) boing(scene, opts.target, 0.08);
  burst(scene, at.x, at.y, { texture: 'fx-paper', count: 10, tint: opts.tints ?? PAPER_TINTS, speed: 520 * k, size: 26 * k, gravityY: 900, lifespan: 900, depth: 80 });
  if (scene.textures.exists('fx-ring')) {
    const s = size / 64;
    const ring = scene.add.image(at.x, at.y, 'fx-ring').setDepth(79).setTint(0xfff1c4).setAlpha(0.9).setScale(s * 0.35);
    scene.tweens.add({ targets: ring, scale: s * 1.25, alpha: 0, duration: 560, ease: 'Quad.easeOut', onComplete: () => ring.destroy() });
  }
  if (opts.bell !== false) chime(scene);
}

export interface TadaOpts {
  /** The layout: its content scale and the size the camera rests at (the scenes keep their layout on resize). */
  L: { k: number; W: number; H: number };
  /** Mom and her friend (Pipa, Marina, a patient...), if on screen: they cheer. */
  mom?: { cheer(): void } | null;
  pipa?: { cheer(): void } | null;
  /** What she made, if it is one thing: it boings when the light passes. */
  target?: Boingable | null;
  /** Say "Ta-da! Look what you made!" (default true). */
  line?: boolean;
  /** Still the same visit (not left by the home button meanwhile). */
  valid?: () => boolean;
  /** When the camera is back (about 2 s); the ending goes on. */
  then?: () => void;
}

/** Timings of the ta-da (ms): the camera leans in, holds, leans back. */
export const TADA = { zoom: 1.12, inMs: 900, holdMs: 500, outMs: 600 } as const;

/**
 * The ta-da on `at` (what she made). The camera leans in toward it and back to exactly where it rests (the layout's
 * centre at the zoom that fits the screen, as `keepLayoutOnResize` sets it); a rotation to portrait meanwhile ends it.
 */
export function tada(scene: Phaser.Scene, at: P, o: TadaOpts) {
  const { k } = o.L;
  const cam = scene.cameras.main;
  const valid = () => scene.sys.isActive() && (o.valid?.() ?? true);
  let over = false;
  const restZoom = () => Math.min(scene.scale.width / o.L.W, scene.scale.height / o.L.H) || 1;
  const z0 = cam.zoom;
  const c0 = { x: cam.midPoint.x, y: cam.midPoint.y };
  // lean in about two thirds of the way toward it (what she made stays in the picture, never pushed to an edge)
  const c1 = { x: c0.x + (at.x - c0.x) * 0.6, y: c0.y + (at.y - c0.y) * 0.6 };
  const lean = { t: 0 };
  const apply = () => {
    cam.setZoom(z0 * (1 + (TADA.zoom - 1) * lean.t));
    cam.centerOn(c0.x + (c1.x - c0.x) * lean.t, c0.y + (c1.y - c0.y) * lean.t);
  };
  const end = () => {
    if (over) return;
    over = true;
    scene.tweens.killTweensOf(lean);
    cam.setZoom(restZoom());
    cam.centerOn(o.L.W / 2, o.L.H / 2);
    if (valid()) o.then?.();
  };
  scene.tweens.add({ targets: lean, t: 1, duration: TADA.inMs, ease: 'Sine.easeInOut', onUpdate: apply });
  scene.time.delayedCall(TADA.inMs + TADA.holdMs, () => {
    if (over) return;
    scene.tweens.add({ targets: lean, t: 0, duration: TADA.outMs, ease: 'Sine.easeInOut', onUpdate: apply, onComplete: end });
  });
  // (never stuck: whatever happens to the tweens, the camera is back and the ending goes on)
  scene.time.delayedCall(TADA.inMs + TADA.holdMs + TADA.outMs + 400, end);
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
    over = true;
  });

  // the warm sound and the line
  sfx(scene, 'tada', { pitch: 'fixed' });
  if (o.line !== false) voice.say('vo-tada', { ttlMs: 4000, valid });
  // one beam of light slides once over it (the kitchen's sunbeam when it is there, else a soft ring of light)
  if (scene.textures.exists(SUNBEAM_KEY)) {
    const beam = scene.add.image(at.x - 380 * k, at.y, SUNBEAM_KEY).setDepth(85).setAlpha(0).setAngle(-12);
    beam.setBlendMode(Phaser.BlendModes.SCREEN).setDisplaySize(260 * k, 900 * k);
    scene.tweens.add({ targets: beam, x: at.x + 380 * k, duration: 1100, ease: 'Sine.easeInOut', onComplete: () => beam.destroy() });
    scene.tweens.add({ targets: beam, alpha: 0.6, duration: 550, yoyo: true, ease: 'Sine.easeInOut' });
  } else if (scene.textures.exists('fx-ring')) {
    const s = (520 * k) / 64;
    const ring = scene.add.image(at.x, at.y, 'fx-ring').setDepth(85).setTint(0xfff1c4).setAlpha(0.8).setScale(s * 0.3);
    scene.tweens.add({ targets: ring, scale: s, alpha: 0, duration: 900, ease: 'Quad.easeOut', onComplete: () => ring.destroy() });
  }
  if (o.target?.active) scene.time.delayedCall(450, () => o.target?.active && boing(scene, o.target, 0.1));
  confetti(scene, at.x, at.y - 60 * k, 24, 30 * k);
  o.mom?.cheer();
  o.pipa?.cheer();
  return { end };
}

/**
 * A picture flies away into a corner, shrinking (`to`: where it is kept; 700 ms Quad.easeIn), then `then()`.
 * `things` move together around their common middle (a frame and the photo in it).
 */
export function flyTo(scene: Phaser.Scene, things: (Phaser.GameObjects.Image | undefined)[], to: P, then: () => void, opts: { scale?: number; ms?: number } = {}) {
  const list = things.filter((t): t is Phaser.GameObjects.Image => !!t?.active);
  if (!list.length) return then();
  const ms = opts.ms ?? 700;
  const f = opts.scale ?? 0.12;
  const mid = { x: list[0].x, y: list[0].y };
  sfx(scene, 'whoosh-soft', { pitch: 'vary', volume: 0.7 });
  for (const t of list) {
    scene.tweens.killTweensOf(t);
    scene.tweens.add({
      targets: t,
      x: to.x + (t.x - mid.x) * f,
      y: to.y + (t.y - mid.y) * f,
      scaleX: t.scaleX * f,
      scaleY: t.scaleY * f,
      angle: -8,
      alpha: 0.9,
      duration: ms,
      ease: 'Quad.easeIn',
    });
  }
  let done = false;
  const fin = () => {
    if (done) return;
    done = true;
    if (scene.sys.isActive()) then();
  };
  scene.time.delayedCall(ms + 40, fin);
}
