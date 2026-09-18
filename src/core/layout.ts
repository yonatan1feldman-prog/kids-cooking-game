import Phaser from 'phaser';

/** Design space of all art (STYLE.md): 1080x1920. The scale manager (EXPAND) never goes below it. */
export const BASE_W = 1080;
export const BASE_H = 1920;

/** Bottom share of the screen where the palm rests: nothing interactive may start there. */
export const PALM_ZONE = 0.08;

/** Minimum on-screen width of the touch area of anything the child drags, as a share of screen width. */
export const MIN_DRAG_SHARE = 0.15;

export interface Layout {
  W: number;
  H: number;
  cx: number;
  /** Nothing interactive below this y (screen space). */
  safeBottom: number;
  /** Uniform art scale: design px -> game px. Every image is shown at this scale. */
  k: number;
  /** Top-left of the 1080x1920 design stage, centered in the screen. */
  ox: number;
  oy: number;
  /** Design coordinates -> game coordinates. */
  P: (x: number, y: number) => { x: number; y: number };
}

export function getLayout(scene: Phaser.Scene): Layout {
  const W = scene.scale.width;
  const H = scene.scale.height;
  const k = Math.min(W / BASE_W, H / BASE_H);
  const ox = (W - BASE_W * k) / 2;
  const oy = (H - BASE_H * k) / 2;
  return { W, H, cx: W / 2, safeBottom: H * (1 - PALM_ZONE), k, ox, oy, P: (x, y) => ({ x: ox + x * k, y: oy + y * k }) };
}

/** Shows an image at the uniform art scale (times an optional factor for effects). */
export function art<T extends Phaser.GameObjects.Image>(img: T, layout: Layout, factor = 1): T {
  img.setScale(layout.k * factor);
  return img;
}

/** Scales an image uniformly so it fits inside maxW x maxH (never distorts). */
export function fit<T extends Phaser.GameObjects.Image>(img: T, maxW: number, maxH = maxW): T {
  const s = Math.min(maxW / img.frame.realWidth, maxH / img.frame.realHeight);
  img.setScale(s);
  return img;
}

/** Scales an image uniformly so it covers W x H. */
export function cover<T extends Phaser.GameObjects.Image>(img: T, W: number, H: number): T {
  img.setScale(Math.max(W / img.frame.realWidth, H / img.frame.realHeight));
  return img;
}

/**
 * Keeps a scene laid out for the size it was created with. If the screen size changes
 * mid-scene (browser bar, rotation, split screen) the camera zooms so the whole
 * original layout stays visible and centered, without distortion and without
 * losing the child's progress. Input follows the camera automatically.
 */
export function keepLayoutOnResize(scene: Phaser.Scene, layout: Layout) {
  const onResize = (size: Phaser.Structs.Size) => {
    const cam = scene.cameras.main;
    cam.setSize(size.width, size.height);
    cam.setZoom(Math.min(size.width / layout.W, size.height / layout.H));
    cam.centerOn(layout.W / 2, layout.H / 2);
  };
  scene.scale.on(Phaser.Scale.Events.RESIZE, onResize);
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => scene.scale.off(Phaser.Scale.Events.RESIZE, onResize));
}

/** Kitchen background covering the screen; the counter color fills any edge a zoom-out reveals. */
export function addBackground(scene: Phaser.Scene, layout: Layout) {
  scene.cameras.main.setBackgroundColor('#f8ddae');
  const bg = scene.add.image(layout.cx, layout.H / 2, 'bg-kitchen');
  cover(bg, layout.W, layout.H);
  return bg.setDepth(-100);
}
