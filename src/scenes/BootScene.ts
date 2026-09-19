import Phaser from 'phaser';
import manifest from 'virtual:asset-manifest';
import { IMAGE_KEYS, SOUND_KEYS, textureSize, type ImageKey } from '../core/assets';
import { ensurePlaceholders, makeFxTextures, makeUiTextures } from '../core/placeholders';
import { loadSvgTexture, loadWebpTexture } from '../core/svgRaster';

/** Asset paths in the manifest are relative to the site root; the game lives under BASE_URL. */
const url = (p: string) => import.meta.env.BASE_URL + p;

/** What the title and home screens show: loaded first, so the title appears quickly. */
const EARLY: ImageKey[] = ['bg-kitchen-landscape', 'btn-play', 'star', 'card-pizza'];

let everything: Promise<void> | null = null;

/** Resolves once every image (and the placeholders for missing ones) is ready. Home waits on it before a recipe. */
export function assetsReady(): Promise<void> {
  return everything ?? Promise.resolve();
}

/**
 * Loads whatever assets exist on disk, then fills every gap with a code-drawn
 * placeholder. A missing or broken file never stops the game.
 * The title starts as soon as its own few images are in; the rest keep
 * loading in the background while the child looks at the title and home screens.
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

    const textures = this.textures;
    // Pre-rendered WebP where it matches the current SVG (fast), else the SVG rasterized here (slow filters).
    const load = async (k: ImageKey) =>
      (manifest.webp[k] && (await loadWebpTexture(textures, k, url(manifest.webp[k])))) ||
      loadSvgTexture(textures, k, url(manifest.images[k]), textureSize(k));
    const exists = (k: ImageKey) => !!manifest.images[k];

    const t0 = performance.now();
    const early = Promise.all(EARLY.filter(exists).map(load)).catch((err) => console.warn('[assets] image loading error', err));
    const rest = early.then(() => Promise.all(IMAGE_KEYS.filter((k) => exists(k) && !EARLY.includes(k)).map(load)));
    everything = rest
      .catch((err) => console.warn('[assets] image loading error', err))
      .then(() => {
        const drawn = ensurePlaceholders(this.game);
        makeUiTextures(this.game);
        if (drawn.length) console.info(`[assets] placeholders in use (${drawn.length}): ${drawn.join(', ')}`);
        timing.all = Math.round(performance.now() - t0);
        console.info(`[assets] all images ready ${timing.all} ms after boot`);
      });
    const timing: { images?: number; total?: number; all?: number } = {};
    (window as unknown as { __loadTiming: typeof timing }).__loadTiming = timing;

    early.then(() => {
      // Stand-ins for any early image that is missing, so the title never waits for the rest.
      ensurePlaceholders(this.game, EARLY);
      makeFxTextures(this.game);
      // Load time (ms since the page started, and the image part alone), for the console and the test harness.
      const t1 = performance.now();
      timing.images = Math.round(t1 - t0);
      timing.total = Math.round(t1);
      console.info(`[assets] title images ready in ${timing.images} ms, title at ${timing.total} ms after page start`);
      this.scene.start('Title');
    });
  }
}
