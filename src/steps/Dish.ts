import Phaser from 'phaser';
import { ART, SAUCE_BRUSH } from '../core/assets';
import type { Layout } from '../core/layout';

/** Texture key of the child's finished pizza (captured at the end of decorating). */
export const MADE_KEY = 'pizza-made';

interface SauceStamp {
  x: number;
  y: number;
  scale: number;
  angle: number;
  tint: number;
}

/**
 * The food being made, carried from step to step. Layers, bottom to top:
 * base (e.g. flat dough), sauce (painted render texture), sprinkles, toppings.
 * Every art layer is at the uniform art scale. Local positions are in game pixels
 * relative to the dish center, at dish scale 1.
 *
 * After decorating, `capture()` flattens everything into one texture (MADE_KEY):
 * exactly the pizza the child made, used in the oven and cut into slices.
 */
export class Dish extends Phaser.GameObjects.Container {
  readonly R: number;
  base?: Phaser.GameObjects.Image;
  sauce?: Phaser.GameObjects.RenderTexture;
  /** Whole pieces lying on the base (the cookies on their sheet, then on the tray). */
  readonly cookies: Phaser.GameObjects.Container;
  readonly sprinkles: Phaser.GameObjects.Container;
  readonly toppings: Phaser.GameObjects.Container;
  /**
   * What was put on the dish and where (local), with the cookie it is on (`on`), as it was when captured: sharing
   * reads it to know what is on each slice (Pipa's tastes). Kept after the capture flattens the toppings.
   */
  placed: { key: string; x: number; y: number; on?: number }[] = [];
  /** The captured pizza image (HTMLImageElement), if capture succeeded. */
  madeImage: HTMLImageElement | null = null;
  private stamps: SauceStamp[] = [];
  private readonly k: number;

  constructor(scene: Phaser.Scene, x: number, y: number, layout: Layout) {
    super(scene, x, y);
    this.k = layout.k;
    this.R = ART.doughRadius * layout.k;
    this.sprinkles = new Phaser.GameObjects.Container(scene, 0, 0);
    this.toppings = new Phaser.GameObjects.Container(scene, 0, 0);
    this.cookies = new Phaser.GameObjects.Container(scene, 0, 0);
    this.add([this.cookies, this.sprinkles, this.toppings]);
    scene.add.existing(this);

    // Render textures lose their pixels if the GPU context is lost (app switching): repaint the sauce.
    const onRestore = () => this.repaintSauce();
    scene.renderer.on(Phaser.Renderer.Events.RESTORE_WEBGL, onRestore);
    this.once(Phaser.GameObjects.Events.DESTROY, () => scene.renderer.off(Phaser.Renderer.Events.RESTORE_WEBGL, onRestore));
  }

  /** The base layer (the flat dough, the cookie sheet, the tray), at `size` x k. */
  setBase(key: string, size = 1) {
    this.base?.destroy();
    this.base = new Phaser.GameObjects.Image(this.scene, 0, 0, key).setScale(this.k * size);
    this.addAt(this.base, 0);
    return this.base;
  }

  private ensureSauce() {
    if (!this.sauce) {
      const size = Math.ceil(ART.doughRadius * 2 * this.k + 8);
      this.sauce = new Phaser.GameObjects.RenderTexture(this.scene, 0, 0, size, size);
      this.addAt(this.sauce, this.base ? 1 : 0);
    }
    return this.sauce;
  }

  /** Paints one brush stamp centered at local (x, y). Call flushSauce() after a batch. */
  /** The brush the spread step paints with (the pizza's sauce by default; the cake sets its frosting's). */
  private brushKey: string = SAUCE_BRUSH;

  setBrush(key: string) {
    this.brushKey = key;
  }

  stampSauce(x: number, y: number, diameter: number) {
    const frame = this.scene.textures.getFrame(this.brushKey);
    const s: SauceStamp = {
      x,
      y,
      scale: diameter / Math.max(1, frame.realWidth),
      angle: Phaser.Math.Between(0, 359),
      // One shade only (round 11): the old darker stamps showed every stamp's scalloped edge; the brush's own paper
      // grain keeps it from looking like flat plastic.
      tint: 0xffffff,
    };
    this.stamps.push(s);
    this.drawStamp(this.ensureSauce(), s);
  }

  private drawStamp(rt: Phaser.GameObjects.RenderTexture, s: SauceStamp) {
    rt.stamp(this.brushKey, undefined, s.x + rt.width / 2, s.y + rt.height / 2, { scale: s.scale, angle: s.angle, tint: s.tint });
  }

  flushSauce() {
    this.sauce?.render();
  }

  private repaintSauce() {
    if (!this.sauce || !this.sauce.active) return;
    this.sauce.clear();
    for (const s of this.stamps) this.drawStamp(this.sauce, s);
    this.sauce.render();
  }

  addSprinkle(key: string, x: number, y: number) {
    const img = new Phaser.GameObjects.Image(this.scene, x, y, key).setScale(this.k).setAngle(Phaser.Math.Between(0, 359));
    this.sprinkles.add(img);
    return img;
  }

  addTopping(key: string, x: number, y: number) {
    const img = new Phaser.GameObjects.Image(this.scene, x, y, key).setScale(this.k).setAngle(Phaser.Math.Between(-30, 30));
    img.setData('key', key);
    this.toppings.add(img);
    return img;
  }

  /** World point -> local dish point (the dish is never rotated). */
  toLocal(wx: number, wy: number) {
    return { x: (wx - this.x) / this.scaleX, y: (wy - this.y) / this.scaleY };
  }

  /** Local dish point -> world point. */
  toWorld(lx: number, ly: number) {
    return { x: this.x + lx * this.scaleX, y: this.y + ly * this.scaleY };
  }

  /** Distance from a world point to the dish center, in units of the dish's on-screen radius. */
  reach(wx: number, wy: number) {
    return Phaser.Math.Distance.Between(wx, wy, this.x, this.y) / (this.R * this.scaleX);
  }

  /** Half the base's width on screen at dish scale 1 (the pizza's radius; half the tray). */
  get halfWidth() {
    return Math.max(this.R, ((this.base?.displayWidth ?? 0) / 2));
  }

  /** Multiplies a color onto every layer (e.g. golden when baked); `foodOnly`: only the pieces on it, not the tray. */
  tintAll(color: number, foodOnly = false) {
    this.cookies.each((c: Phaser.GameObjects.Image) => c.setTint(color));
    if (foodOnly) return;
    this.base?.setTint(color);
    this.sauce?.setTint(color);
    this.sprinkles.each((c: Phaser.GameObjects.Image) => c.setTint(color));
    this.toppings.each((c: Phaser.GameObjects.Image) => c.setTint(color));
  }

  /**
   * Flattens the dish (dough, sauce, cheese, toppings where the child put them) into
   * one texture, MADE_KEY, and replaces the layers with a single image of it.
   * Resolves false (dish left untouched) if the capture fails for any reason.
   */
  capture(replace = true): Promise<boolean> {
    this.placed = (this.toppings.list as Phaser.GameObjects.Image[]).map((t) => ({ key: t.texture.key, x: t.x, y: t.y, on: t.getData('on') as number | undefined }));
    return new Promise((resolve) => {
      // (the pizza: its disc; a tray of cookies: the whole tray)
      const size = Math.ceil((this.cookies.length ? this.halfWidth : this.R) * 2 + 24 * this.k);
      const keep = { x: this.x, y: this.y, sx: this.scaleX, sy: this.scaleY, alpha: this.alpha, visible: this.visible };
      let settled = false;
      const done = (ok: boolean) => {
        if (settled) return;
        settled = true;
        resolve(ok);
      };
      try {
        const dt = this.scene.textures.addDynamicTexture('pizza-capture-' + Date.now(), size, size);
        if (!dt) return done(false);
        this.setPosition(0, 0).setScale(1).setAlpha(1).setVisible(true);
        dt.draw(this, size / 2, size / 2);
        dt.render();
        this.setPosition(keep.x, keep.y).setScale(keep.sx, keep.sy).setAlpha(keep.alpha).setVisible(keep.visible);
        dt.snapshot((snap) => {
          const img = snap as HTMLImageElement;
          const finish = () => {
            try {
              if (!img || !img.width) return done(false);
              if (this.scene.textures.exists(MADE_KEY)) this.scene.textures.remove(MADE_KEY);
              this.scene.textures.addImage(MADE_KEY, img);
              this.madeImage = img;
              if (!replace) return done(true);
              this.base?.destroy();
              this.sauce?.destroy();
              this.sauce = undefined;
              this.stamps = [];
              this.sprinkles.removeAll(true);
              this.toppings.removeAll(true);
              // The captured texture is already in game pixels: shown at scale 1.
              this.base = new Phaser.GameObjects.Image(this.scene, 0, 0, MADE_KEY);
              this.addAt(this.base, 0);
              done(true);
            } catch (err) {
              console.warn('[dish] capture failed', err);
              done(false);
            } finally {
              this.scene.textures.remove(dt);
            }
          };
          if (img && 'complete' in img && !img.complete) img.onload = finish;
          else finish();
        });
        // Never wait forever.
        this.scene.time.delayedCall(2000, () => done(false));
      } catch (err) {
        console.warn('[dish] capture failed', err);
        this.setPosition(keep.x, keep.y).setScale(keep.sx, keep.sy).setAlpha(keep.alpha).setVisible(keep.visible);
        done(false);
      }
    });
  }
}

/**
 * Draws `objects` (positioned around 0, 0) into a new texture `key`, size x size, via a snapshot (an image survives a
 * lost GPU context; a render texture would not). Resolves false if it fails. The objects are destroyed afterwards.
 */
export function snapshotTexture(scene: Phaser.Scene, key: string, size: number, objects: Phaser.GameObjects.GameObject[]): Promise<boolean> {
  return new Promise((resolve) => {
    let settled = false;
    const done = (ok: boolean) => {
      if (settled) return;
      settled = true;
      objects.forEach((o) => o.destroy());
      resolve(ok);
    };
    try {
      const tmp = scene.textures.addDynamicTexture(key + '-tmp-' + Date.now(), size, size);
      if (!tmp) return done(false);
      const box = new Phaser.GameObjects.Container(scene, 0, 0, objects);
      tmp.draw(box, size / 2, size / 2);
      tmp.render();
      box.removeAll(false);
      box.destroy();
      tmp.snapshot((snap) => {
        const img = snap as HTMLImageElement;
        const finish = () => {
          try {
            if (!img || !img.width) return done(false);
            if (scene.textures.exists(key)) scene.textures.remove(key);
            scene.textures.addImage(key, img);
            done(true);
          } catch {
            done(false);
          } finally {
            scene.textures.remove(tmp);
          }
        };
        if (img && 'complete' in img && !img.complete) img.onload = finish;
        else finish();
      });
      scene.time.delayedCall(2000, () => done(false));
    } catch (err) {
      console.warn('[dish] snapshot failed', err);
      done(false);
    }
  });
}

/** Clamps a local point to lie within radius r of the center. */
export function clampToRadius(p: { x: number; y: number }, r: number) {
  const d = Math.hypot(p.x, p.y);
  if (d <= r || d === 0) return p;
  return { x: (p.x / d) * r, y: (p.y / d) * r };
}
