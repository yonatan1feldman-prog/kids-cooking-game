import Phaser from 'phaser';

/**
 * Landscape world. The height is always 1080 world units. The width follows the screen:
 * 1440 at 4:3 (the minimum: the scale manager uses EXPAND on a 1440x1080 base), 1920 at
 * 16:9, 2400 at 20:9 (the main device). Positions are never absolute 1920-based numbers:
 * stage.ts places everything relative to the center and to the side margins.
 */
export const BASE_W = 1440;
export const BASE_H = 1080;

/** Bottom share of the screen where the palm rests: nothing interactive may start there. */
export const PALM_ZONE = 0.08;
/** Share of the width on EACH side where the holding thumbs rest: nothing interactive there either. */
export const SIDE_ZONE = 0.04;

/**
 * Width (world units at k = 1) the densest step needs between the side zones: 2 bin columns (480)
 * + the full-size board (786) + the character at 75% (450) + 2 gaps (50). That is exactly 16:9.
 * On narrower screens (4:3 tablets, physically much bigger) everything is shown at k < 1.
 */
export const FIT_W = 1766;

export interface Layout {
  W: number;
  H: number;
  cx: number;
  cy: number;
  /** Side margin (thumb zone) in world units. */
  m: number;
  /** Content scale: 1 on phones (16:9 and wider), below 1 only on screens narrower than 16:9. */
  k: number;
  /**
   * A y in the 1080-high design band -> world y. Scaled by k around the palm-strip line, so on
   * screens where k < 1 things still stand on the counter and the palm strip stays where it is.
   */
  Y: (v: number) => number;
}

export function getLayout(scene: Phaser.Scene): Layout {
  const W = scene.scale.width;
  const H = scene.scale.height;
  const m = W * SIDE_ZONE;
  const k = Math.min(1, (W - 2 * m) / FIT_W, H / BASE_H);
  const floor = H * (1 - PALM_ZONE);
  const baseFloor = BASE_H * (1 - PALM_ZONE);
  return { W, H, cx: W / 2, cy: H / 2, m, k, Y: (v) => floor - (baseFloor - v) * k };
}

/** True where a press must never start: the palm strip at the bottom and the thumb strips at the sides. */
export function inNoTouchZone(scene: Phaser.Scene, x: number, y: number) {
  const { width: W, height: H } = scene.scale;
  return y > H * (1 - PALM_ZONE) || x < W * SIDE_ZONE || x > W * (1 - SIDE_ZONE);
}

/** Shows an image at the content scale times a per-item factor. */
export function art<T extends Phaser.GameObjects.Image>(img: T, layout: Layout, factor = 1): T {
  img.setScale(layout.k * factor);
  return img;
}

/**
 * Keeps a scene laid out for the size it was created with. If the screen size changes
 * mid-scene (browser bar, split screen, a trip through portrait) the camera zooms so the
 * whole original layout stays visible and centered, without distortion and without
 * losing the child's progress. Input follows the camera automatically.
 * With `relayout` (screens with no state, like Title and Home) the scene is rebuilt at
 * the new size instead, once the screen is landscape again.
 */
export function keepLayoutOnResize(scene: Phaser.Scene, layout: Layout, opts: { relayout?: boolean; canRelayout?: () => boolean } = {}) {
  const onResize = () => {
    const { width, height } = scene.scale;
    // (`canRelayout` false: the scene is on its way out, e.g. the play tap's fullscreen resize; just zoom.)
    if (opts.relayout && (opts.canRelayout?.() ?? true)) {
      if (height > width || (Math.abs(width - layout.W) < 2 && Math.abs(height - layout.H) < 2)) return;
      queueMicrotask(() => scene.scene.isActive() && scene.scene.restart());
      return;
    }
    const cam = scene.cameras.main;
    cam.setSize(width, height);
    cam.setZoom(Math.min(width / layout.W, height / layout.H));
    cam.centerOn(layout.W / 2, layout.H / 2);
  };
  scene.scale.on(Phaser.Scale.Events.RESIZE, onResize);
  scene.game.events.on(ORIENTATION_RESUME, onResize);
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
    scene.scale.off(Phaser.Scale.Events.RESIZE, onResize);
    scene.game.events.off(ORIENTATION_RESUME, onResize);
  });
}

/** Game events sent by the orientation guard (core/orientation.ts). */
export const ORIENTATION_PAUSE = 'orientation-pause';
export const ORIENTATION_RESUME = 'orientation-resume';

/**
 * Kitchen background: anchored bottom-center at its native height, so a wider screen
 * never crops the top and a narrower one only loses the sides. If the screen is wider
 * than the art, it grows uniformly just enough to cover the width (still bottom-anchored).
 */
export function addBackground(scene: Phaser.Scene, layout: Layout) {
  scene.cameras.main.setBackgroundColor('#f8ddae');
  const bg = scene.add.image(layout.cx, layout.H, 'bg-kitchen-landscape').setOrigin(0.5, 1);
  bg.setScale(Math.max(layout.H / bg.frame.realHeight, layout.W / bg.frame.realWidth));
  return bg.setDepth(-100);
}
