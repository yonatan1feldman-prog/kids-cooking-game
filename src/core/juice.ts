import Phaser from 'phaser';
import { inNoTouchZone, type Layout } from './layout';

/**
 * The polish round ("juice", paper cut-out style): small answers that make every touch feel alive. Each one answers
 * something she did (wellbeing rule 5): nothing here moves by itself. Kept light for the phone: one image per touch,
 * a few dozen particles at a step's end, no filters.
 */

/** Paper colours of the art (confetti). */
const PAPER = [0xf28c8c, 0xffcb47, 0x8fcb6c, 0x7fb8e6, 0xff8c42, 0xfff6e0];

/**
 * A soft paper ring where her finger lands (every first-finger touch, not in the no-touch strips): the screen answers
 * even where nothing else does. It never counts as a miss or as progress.
 */
export function touchRipples(scene: Phaser.Scene, L: Layout) {
  const onDown = (p: Phaser.Input.Pointer) => {
    if (scene.input.manager.pointers.some((o) => o !== p && o.isDown)) return;
    if (inNoTouchZone(scene, p.x, p.y)) return;
    if (!scene.textures.exists('fx-ring')) return;
    const r = scene.add.image(p.worldX, p.worldY, 'fx-ring').setDepth(950).setTint(0xffb347).setAlpha(0.85);
    const s = (110 * L.k) / 64;
    r.setScale(s * 0.35);
    scene.tweens.add({ targets: r, scale: s * 1.5, alpha: 0, duration: 450, ease: 'Quad.easeOut', onComplete: () => r.destroy() });
  };
  scene.input.on(Phaser.Input.Events.POINTER_DOWN, onDown);
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => scene.input.off(Phaser.Input.Events.POINTER_DOWN, onDown));
}

/**
 * Paper confetti (a step is done): little paper strips that tumble and flip as they fall. `size` in world units.
 */
export function confetti(scene: Phaser.Scene, x: number, y: number, count = 18, size = 26) {
  const frame = scene.textures.getFrame('fx-paper');
  if (!frame) return;
  const base = size / frame.realWidth;
  const lifespan = 1400;
  const emitter = scene.add.particles(x, y, 'fx-paper', {
    emitting: false,
    speed: { min: 380, max: 820 },
    angle: { min: -160, max: -20 },
    // paper flips as it falls: its width breathes between full and edge-on
    scaleX: { onEmit: () => base, onUpdate: (pt: Phaser.GameObjects.Particles.Particle, _k: string, t: number) => base * Math.abs(Math.cos(t * 14 + pt.x * 0.03)) },
    scaleY: base,
    rotate: { onEmit: () => Phaser.Math.Between(0, 360), onUpdate: (_pt: Phaser.GameObjects.Particles.Particle, _k: string, _t: number, v: number) => v + 4 },
    alpha: { start: 1, end: 0.3 },
    gravityY: 900,
    lifespan,
    tint: PAPER,
  });
  emitter.setDepth(80);
  emitter.explode(count);
  scene.time.delayedCall(lifespan + 200, () => emitter.destroy());
}

/**
 * A held thing swings like paper as the finger moves it (tilting toward where it goes) and settles when the finger
 * stops. Call on every move with the horizontal step (world units); `settle` puts it straight.
 */
export function sway(scene: Phaser.Scene, img: Phaser.GameObjects.Image, dx: number, k = 1) {
  const target = Phaser.Math.Clamp((dx / k) * 0.5, -14, 14);
  img.setAngle(img.angle + (target - img.angle) * 0.4);
  settle(scene, img, 260);
}

export function settle(scene: Phaser.Scene, img: Phaser.GameObjects.Image, ms = 180) {
  (img.getData('sway') as Phaser.Tweens.Tween | undefined)?.remove();
  if (!img.active) return;
  img.setData('sway', scene.tweens.add({ targets: img, angle: 0, duration: ms, delay: ms > 200 ? 90 : 0, ease: 'Sine.easeOut' }));
}

/** Something that can be tickled (Mom, Pipa): `hit` says whether a world point is on it, `tickle` answers. */
export interface Ticklish {
  hit(x: number, y: number): boolean;
  tickle(): void;
}

/**
 * Mom and Pipa answer a tap on them (Mom smiles and sways, Pipa giggles and squishes). First finger only, not in the
 * no-touch strips, never on a button, and only while `allowed()` (not where they are what she feeds). Never a miss,
 * never progress.
 */
export function tickles(scene: Phaser.Scene, who: () => (Ticklish | null)[], allowed: () => boolean = () => true) {
  const onDown = (p: Phaser.Input.Pointer) => {
    if (!allowed()) return;
    if (scene.input.manager.pointers.some((o) => o !== p && o.isDown)) return;
    if (inNoTouchZone(scene, p.x, p.y)) return;
    if (scene.input.hitTestPointer(p).length) return;
    const t = who().find((w) => w?.hit(p.worldX, p.worldY));
    t?.tickle();
  };
  scene.input.on(Phaser.Input.Events.POINTER_DOWN, onDown);
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => scene.input.off(Phaser.Input.Events.POINTER_DOWN, onDown));
}
