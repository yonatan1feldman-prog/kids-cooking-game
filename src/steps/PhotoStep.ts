import Phaser from 'phaser';
import { keepPhoto } from '../core/album';
import { ART, IMAGES } from '../core/assets';
import { voice } from '../core/audio';
import { boing } from '../core/fx';
import type { HandMotion } from '../core/hand';
import { sfx, sfxThen } from '../core/sfx';
import type { Box } from '../core/stage';
import type { PhotoParams } from '../recipes/types';
import { MADE_KEY } from './Dish';
import { Step } from './Step';

/** Pipa's face in her 600x700 frame (eyes to mouth, with the cheeks): stars keep off it. */
const PET_FACE = { x0: 140, y0: 150, x1: 460, y1: 500 };
/** Minimum time from the photo to home, even if a sound is missing. */
const PARTY_MIN_MS = 3800;
/** The kitchen square of the background shown behind the dish in the photo (x 660..1740 of the 2400 art). */
const BACKDROP_X0 = 660;

/** Texture key of the finale's photo (the memory book keeps a copy of it: core/album.ts). */
export const PHOTO_KEY = 'photo-made';
/** Side of the copy kept in the memory book (big enough to fill a frame on any screen, small enough to store 40). */
const ALBUM_PX = 420;

/**
 * The finale with a photo (reusable: the last step of any recipe). Mom says "Let's take a picture!", the camera
 * clicks with a short white flash, and the photo frame comes up where the dish was, with her own finished dish in its
 * window: the pizza she decorated (`pizza-made`, captured before it was cut) with its baked colour, on its board, in
 * front of a square of the kitchen. Then "We made a pizza together!", the cheer and a shower of stars (never over Mom's
 * or Pipa's face, or the photo), "That was fun! Bye bye!", and quietly home. Nothing to do: it only answers the end
 * of her work, so there is no hint and no help.
 */
export class PhotoStep extends Step<PhotoParams> {
  private frame?: Phaser.GameObjects.Image;
  private photo?: Phaser.GameObjects.Image;
  private k = 1;
  /** How far Mom still stands aside (see start). */
  private momShift = 0;
  /** Where the finale's stars were placed (for the test harness's face check). */
  starSpots: { x: number; y: number; s: number; r: number }[] = [];
  /** The photo frame's box (stars keep off it). */
  frameBox?: Box;

  start() {
    this.k = this.layout.k;
    const S = this.ctx.stage;
    // Everyone back in their places for the picture: Pipa small beside Mom and Mom at her place, where there is room
    // for Pipa's small spot. Elsewhere (4:3) Pipa stays big on the board's rim, so Mom stays a step aside (her face clear).
    this.momShift = S.pet ? 0 : S.feedMomShift;
    if (S.pet) {
      this.ctx.character.moveTo(S.pet);
      this.ctx.mom.stepAside(-S.feedMomShift);
    }
    this.ctx.mom.armTo(0);
    this.ctx.mom.rest();
    this.ctx.character.setMood('rest');
    this.scene.tweens.add({ targets: this.ctx.board, alpha: 0, duration: 400 });
    voice.say(this.params.line, { ttlMs: 5000, done: () => this.snap() });
  }

  /** Click and flash, then the framed photo. */
  private snap() {
    if (this.frame || this.aborted) return;
    const S = this.ctx.stage;
    const L = this.layout;
    sfx(this.scene, 'camera', { vary: false });
    const flash = this.own(this.scene.add.rectangle(L.W / 2, L.H / 2, L.W * 1.2, L.H * 1.2, 0xffffff).setDepth(2000).setAlpha(0.9));
    this.scene.tweens.add({ targets: flash, alpha: 0, duration: 380, ease: 'Quad.easeOut' });
    const fs = S.photo.scale;
    const [fw, fh] = IMAGES[this.params.frame].size;
    const win = ART.prep.photoWindow;
    const wc = { x: S.photo.x + (win.x + win.w / 2 - fw / 2) * fs, y: S.photo.y + (win.y + win.h / 2 - fh / 2) * fs };
    const key = this.makePhoto(Math.round(win.w * fs));
    if (key) {
      this.photo = this.own(this.scene.add.image(wc.x, wc.y, key).setDepth(60));
      this.keepInAlbum(key);
    }
    this.frame = this.own(this.scene.add.image(S.photo.x, S.photo.y, this.params.frame).setScale(fs).setDepth(61));
    const b = this.frame.getBounds();
    this.frameBox = { x0: b.x, y0: b.y, x1: b.right, y1: b.bottom };
    for (const o of [this.frame, this.photo]) {
      if (!o) continue;
      const s = o.scale;
      o.setScale(s * 0.6).setAlpha(0);
      this.scene.tweens.add({ targets: o, scale: s, alpha: 1, duration: 450, delay: 150, ease: 'Back.easeOut' });
    }
    this.scene.time.delayedCall(900, () => this.party());
  }

  /**
   * The photo: a square of the kitchen, the board and her pizza (with its baked colour), drawn once into a texture of
   * the window's size. Returns its key, or null if her pizza's capture is missing (the frame then shows the kitchen only).
   */
  private makePhoto(size: number): string | null {
    try {
      const tex = this.scene.textures;
      if (tex.exists(PHOTO_KEY)) tex.remove(PHOTO_KEY);
      const dt = tex.addDynamicTexture(PHOTO_KEY, size, size);
      if (!dt) return null;
      const bg = new Phaser.GameObjects.Image(this.scene, 0, 0, this.params.backdrop).setOrigin(0, 0);
      const sc = size / bg.frame.realHeight;
      bg.setScale(sc).setCrop(BACKDROP_X0, 0, bg.frame.realHeight, bg.frame.realHeight);
      dt.draw(bg, -BACKDROP_X0 * sc, 0);
      const temp = [bg];
      if (this.params.bowl) {
        // The salad: its bowl (back, contents, front) at 92% of the square, standing a little low (scenes-salad.js).
        const b = this.params.bowl;
        const s = (size / IMAGES[b.back].size[0]) * 0.92;
        for (const key of [b.back, b.fill, b.front]) {
          const img = new Phaser.GameObjects.Image(this.scene, 0, 0, key).setScale(s);
          dt.draw(img, size / 2, size / 2 + 60 * (size / 540));
          temp.push(img);
        }
        dt.render();
        temp.forEach((o) => o.destroy());
        return PHOTO_KEY;
      }
      if (this.params.made) {
        // Her whole dish as decorated (the cookies on their tray), 92% of the square, a little low.
        if (tex.exists(MADE_KEY)) {
          const made = new Phaser.GameObjects.Image(this.scene, 0, 0, MADE_KEY);
          made.setScale((size * 0.92) / made.frame.realWidth);
          dt.draw(made, size / 2, size / 2 + 50 * (size / 540));
          temp.push(made);
        }
        dt.render();
        temp.forEach((o) => o.destroy());
        return PHOTO_KEY;
      }
      // The board and the pizza fill about 86% of the square, standing a little low (on the counter).
      const boardKey = this.ctx.board.texture.key;
      const board = new Phaser.GameObjects.Image(this.scene, 0, 0, boardKey);
      const bs = ((size / board.frame.realWidth) * 0.86);
      board.setScale(bs);
      dt.draw(board, size / 2, size / 2 + 40 * (size / 540));
      temp.push(board);
      if (tex.exists(MADE_KEY)) {
        const pizza = new Phaser.GameObjects.Image(this.scene, 0, 0, MADE_KEY);
        // The capture is in game pixels at the content scale k: it is shown at the board's scale / k.
        pizza.setScale(bs / this.k).setTint(this.dish.base?.tintTopLeft ?? 0xffffff);
        dt.draw(pizza, size / 2, size / 2 + 38 * (size / 540));
        temp.push(pizza);
      }
      // (the drawing happens in render(): the images it draws must still exist then)
      dt.render();
      temp.forEach((o) => o.destroy());
      return PHOTO_KEY;
    } catch (err) {
      console.warn('[photo] could not make the photo', err);
      return null;
    }
  }

  /**
   * A copy of the photo that was just taken goes into the memory book (core/album.ts), shrunk to ALBUM_PX and
   * compressed. It is done in the background and every failure is swallowed: the finale never waits for it and
   * never changes because of it.
   */
  private keepInAlbum(key: string) {
    try {
      const tex = this.scene.textures.get(key) as Phaser.Textures.DynamicTexture;
      if (!tex?.snapshot) return;
      tex.snapshot((img) => {
        try {
          if (!(img instanceof HTMLImageElement)) return;
          const c = document.createElement('canvas');
          c.width = c.height = ALBUM_PX;
          const g = c.getContext('2d');
          if (!g) return;
          g.drawImage(img, 0, 0, ALBUM_PX, ALBUM_PX);
          const data = c.toDataURL('image/webp', 0.72);
          void keepPhoto(this.ctx.recipeId, data.startsWith('data:image/webp') ? data : c.toDataURL('image/png'));
        } catch {
          /* the photo is simply not kept */
        }
      });
    } catch {
      /* the photo is simply not kept */
    }
  }

  /** "We made a pizza together!", the cheer, the stars, "Bye bye!", home. */
  private party() {
    if (this.aborted) return;
    const t0 = this.scene.time.now;
    this.ctx.mom.celebrate();
    const pet = this.ctx.character;
    pet.setMood('party');
    const k = this.k;
    const hop = 110 * k * (pet.scale / (0.62 * k));
    // Happy hops (no sway: beside Mom's face and the photo there is no room for it).
    this.scene.tweens.add({ targets: pet.box, y: pet.rest.y - hop, duration: 260, yoyo: true, repeat: 5, ease: 'Quad.easeOut' });
    if (this.frame) boing(this.scene, this.frame, 0.06);
    const bye = () =>
      !this.aborted &&
      voice.say(this.params.bye, {
        ttlMs: 4000,
        done: () => !this.aborted && this.scene.time.delayedCall(Math.max(300, PARTY_MIN_MS - (this.scene.time.now - t0)), () => this.complete()),
      });
    voice.say(this.params.finale, { ttlMs: 5000, done: () => !this.aborted && sfxThen(this.scene, 'cheer', bye) });
    this.showerStars();
  }

  /** Stars pop in one after another, drift down a little and fade: never over a face, the photo or the home button. */
  private showerStars() {
    const { W, m, k } = this.layout;
    const st = this.ctx.stage;
    const pet = this.ctx.character;
    const petFace: Box = {
      x0: pet.rest.x + (PET_FACE.x0 - 300) * pet.scale,
      y0: pet.rest.y + (PET_FACE.y0 - 350) * pet.scale,
      x1: pet.rest.x + (PET_FACE.x1 - 300) * pet.scale,
      y1: pet.rest.y + (PET_FACE.y1 - 350) * pet.scale,
    };
    const DRIFT = 80 * k;
    const frame = this.frameBox;
    const clear = (x: number, y: number, r: number) => {
      const hits = (b: Box) => x + r > b.x0 && x - r < b.x1 && y + r + DRIFT > b.y0 && y - r < b.y1;
      const momFace = { ...st.momFace, x0: st.momFace.x0 + this.momShift, x1: st.momFace.x1 + this.momShift };
      if (hits(momFace) || (pet.visible && hits(petFace)) || (frame && hits(frame))) return false;
      return Phaser.Math.Distance.Between(x, y, st.home.x, st.home.y) > 150 * k + r;
    };
    const rnd = new Phaser.Math.RandomDataGenerator(['party']);
    const spots: { x: number; y: number; s: number }[] = [];
    for (let guard = 0; spots.length < 14 && guard < 800; guard++) {
      const x = rnd.between(m + 60 * k, W - m - 60 * k);
      const y = rnd.between(60, 700);
      const s = rnd.realInRange(0.35, 0.8);
      if (!clear(x, y, 100 * s * k)) continue;
      if (spots.some((o) => Phaser.Math.Distance.Between(o.x, o.y, x, y) < 150 * k)) continue;
      spots.push({ x, y, s });
    }
    this.starSpots = spots.map((p) => ({ ...p, r: 100 * p.s * k }));
    spots.forEach((p, i) => {
      this.scene.time.delayedCall(120 + i * 140, () => {
        const star = this.scene.add.image(p.x, p.y, 'star').setDepth(80).setScale(0).setAngle(rnd.between(-30, 30));
        if (i < 3) sfx(this.scene, 'star', { minGapMs: 120, vary: false });
        this.scene.tweens.add({ targets: star, scale: p.s * k, duration: 320, ease: 'Back.easeOut' });
        this.scene.tweens.add({ targets: star, y: p.y + DRIFT, alpha: 0, delay: 1500, duration: 1200, ease: 'Sine.easeIn', onComplete: () => star.destroy() });
      });
    });
  }

  /** Nothing for her to do here: no demo, no hint. */
  protected demo(): HandMotion | null {
    return null;
  }

  protected autoFinish() {}
}
