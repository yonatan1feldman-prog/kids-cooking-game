import Phaser from 'phaser';
import { fit } from '../core/layout';

/**
 * The food being made, carried from step to step. Layers, bottom to top:
 * base (e.g. flat dough), sauce (painted render texture), sprinkles, toppings.
 * All positions passed in are local to the dish center, in unscaled dish pixels.
 */
export class Dish extends Phaser.GameObjects.Container {
  readonly R: number;
  base?: Phaser.GameObjects.Image;
  sauce?: Phaser.GameObjects.RenderTexture;
  readonly sprinkles: Phaser.GameObjects.Container;
  readonly toppings: Phaser.GameObjects.Container;

  constructor(scene: Phaser.Scene, x: number, y: number, R: number) {
    super(scene, x, y);
    this.R = R;
    this.sprinkles = new Phaser.GameObjects.Container(scene, 0, 0);
    this.toppings = new Phaser.GameObjects.Container(scene, 0, 0);
    this.add([this.sprinkles, this.toppings]);
    scene.add.existing(this);
  }

  setBase(key: string) {
    this.base?.destroy();
    this.base = new Phaser.GameObjects.Image(this.scene, 0, 0, key);
    fit(this.base, this.R * 2);
    this.addAt(this.base, 0);
    return this.base;
  }

  private ensureSauce() {
    if (!this.sauce) {
      const size = Math.ceil(this.R * 2);
      this.sauce = new Phaser.GameObjects.RenderTexture(this.scene, 0, 0, size, size);
      this.addAt(this.sauce, this.base ? 1 : 0);
    }
    return this.sauce;
  }

  /** Paints one stamp of `key` centered at local (x, y), `size` px wide. Call flushSauce() after a batch. */
  stampSauce(key: string, x: number, y: number, size: number) {
    const rt = this.ensureSauce();
    const frame = this.scene.textures.getFrame(key);
    const scale = size / Math.max(1, frame.realWidth);
    rt.stamp(key, undefined, x + rt.width / 2, y + rt.height / 2, { scale, angle: Phaser.Math.Between(0, 359) });
  }

  flushSauce() {
    this.sauce?.render();
  }

  addSprinkle(key: string, x: number, y: number, size: number) {
    const img = new Phaser.GameObjects.Image(this.scene, x, y, key).setAngle(Phaser.Math.Between(0, 359));
    fit(img, size);
    this.sprinkles.add(img);
    return img;
  }

  addTopping(key: string, x: number, y: number, size: number) {
    const img = new Phaser.GameObjects.Image(this.scene, x, y, key).setAngle(Phaser.Math.Between(-30, 30));
    fit(img, size);
    this.toppings.add(img);
    return img;
  }

  /** World point -> local dish point (the dish is never rotated). */
  toLocal(wx: number, wy: number) {
    return { x: (wx - this.x) / this.scaleX, y: (wy - this.y) / this.scaleY };
  }

  /** Distance from a world point to the dish center, in units of the dish's on-screen radius. */
  reach(wx: number, wy: number) {
    return Phaser.Math.Distance.Between(wx, wy, this.x, this.y) / (this.R * this.scaleX);
  }

  /** Multiplies a color onto every layer (e.g. golden when baked). */
  tintAll(color: number, toppingColor = color) {
    this.base?.setTint(color);
    this.sauce?.setTint(color);
    this.sprinkles.each((c: Phaser.GameObjects.Image) => c.setTint(color));
    this.toppings.each((c: Phaser.GameObjects.Image) => c.setTint(toppingColor));
  }
}

/** Clamps a local point to lie within radius r of the center. */
export function clampToRadius(p: { x: number; y: number }, r: number) {
  const d = Math.hypot(p.x, p.y);
  if (d <= r || d === 0) return p;
  return { x: (p.x / d) * r, y: (p.y / d) * r };
}
