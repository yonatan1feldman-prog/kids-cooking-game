import Phaser from 'phaser';
import manifest from 'virtual:asset-manifest';
import { IMAGE_KEYS, IMAGES, SOUND_KEYS } from '../core/assets';
import { ensurePlaceholders, makeFxTextures, makeUiTextures } from '../core/placeholders';
import { loadSvgTexture } from '../core/svgRaster';

/** Asset paths in the manifest are relative to the site root; the game lives under BASE_URL. */
const url = (p: string) => import.meta.env.BASE_URL + p;

/**
 * Loads whatever assets exist on disk, then fills every gap with a code-drawn
 * placeholder. A missing or broken file never stops the game.
 */
export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  preload() {
    this.load.on(Phaser.Loader.Events.FILE_LOAD_ERROR, (file: Phaser.Loader.File) => {
      console.warn(`[assets] sound "${file.key}" failed to load; it will stay silent`);
    });
    for (const key of SOUND_KEYS) {
      const urls = manifest.sounds[key];
      if (urls?.length) this.load.audio(key, urls.map(url));
    }
  }

  create() {
    const { width: W, height: H } = this.scale;
    this.cameras.main.setBackgroundColor('#ffe4b5');
    const spinner = this.add.arc(W / 2, H / 2, Math.min(W, H) * 0.06, 0, 270, false).setStrokeStyle(18, 0xff8c42).setClosePath(false);
    this.tweens.add({ targets: spinner, angle: 360, duration: 900, repeat: -1 });

    const jobs = IMAGE_KEYS.filter((k) => manifest.images[k]).map((k) => loadSvgTexture(this.textures, k, url(manifest.images[k]), IMAGES[k].size));
    Promise.all(jobs)
      .catch((err) => console.warn('[assets] image loading error', err))
      .finally(() => {
        const drawn = ensurePlaceholders(this);
        makeFxTextures(this);
        makeUiTextures(this);
        if (drawn.length) console.info(`[assets] placeholders in use (${drawn.length}): ${drawn.join(', ')}`);
        const missingSounds = SOUND_KEYS.filter((k) => !this.cache.audio.exists(k));
        if (missingSounds.length) console.info(`[assets] silent sounds: ${missingSounds.join(', ')}`);
        this.scene.start('Title');
      });
  }
}
