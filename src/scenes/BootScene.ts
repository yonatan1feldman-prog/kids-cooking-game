import Phaser from 'phaser';
import manifest from 'virtual:asset-manifest';
import { refreshAlbumCount } from '../core/album';
import { CORE_IMAGES, FX_DOT, FX_SOFT, IMAGES, RECIPE_ASSETS, textureSize, unlistedImages, type ImageKey } from '../core/assets';
import { loadRecipeSounds, loadSounds, releaseSounds } from '../core/audio';
import { ensurePlaceholders, makeFxTextures, makeUiTextures } from '../core/placeholders';
import { loadSvgTexture, loadWebpTexture } from '../core/svgRaster';

/** Asset paths in the manifest are relative to the site root; the game lives under BASE_URL. */
const url = (p: string) => import.meta.env.BASE_URL + p;

/** What the title and home screens show: loaded first, so the title appears quickly (with its play button). */
const EARLY: ImageKey[] = ['bg-kitchen-landscape', 'btn-play', 'star', ...CORE_IMAGES.filter((k) => k.startsWith('card-'))];
/** Loaded right after: the title's logo, Mom, Pipa and Mom's pointing hand. They fade in on the title when ready. */
const TITLE_ART: ImageKey[] = [
  'logo-cooking-with-mom',
  ...CORE_IMAGES.filter((k) => (k.startsWith('mom-') && !k.startsWith('mom-hand-')) || k.startsWith('character-')),
  'mom-hand-point',
];

let everything: Promise<void> | null = null;

// Pre-rendered WebP where it matches the current SVG (fast), else the SVG rasterized here (slow filters).
const load = async (textures: Phaser.Textures.TextureManager, k: ImageKey) =>
  (manifest.webp[k] && (await loadWebpTexture(textures, k, url(manifest.webp[k])))) ||
  loadSvgTexture(textures, k, url(manifest.images[k]), textureSize(k));
const exists = (k: ImageKey) => !!manifest.images[k];

/** The recipe whose images and sounds are loaded (or loading) now, with its promise and load time. */
let current: { id: string; ready: Promise<void>; done?: boolean } | null = null;
const timing: { images?: number; total?: number; all?: number; recipe?: Record<string, number> } = { recipe: {} };

/**
 * Loads a recipe's own images and sounds (RECIPE_ASSETS in the contract) after the core; resolves when they are in
 * (placeholders for missing art). Another recipe's are released first. The home screen calls it on a card tap.
 */
export function recipeAssets(game: Phaser.Game, id: string): Promise<void> {
  if (current?.id === id) return current.ready;
  releaseRecipe(game);
  const own = RECIPE_ASSETS[id] ?? { images: [], sounds: [] };
  const me: { id: string; ready: Promise<void>; done?: boolean } = { id, ready: Promise.resolve() };
  me.ready = assetsReady().then(async () => {
    const t0 = performance.now();
    await Promise.all([
      Promise.all(own.images.filter((k) => exists(k) && !game.textures.exists(k)).map((k) => load(game.textures, k))).catch((err) =>
        console.warn('[assets] image loading error', err),
      ),
      loadRecipeSounds(own.sounds),
    ]);
    if (current !== me) return; // released while loading (never in play: home can't be left mid-load)
    const drawn = ensurePlaceholders(game, own.images);
    if (drawn.length) console.info(`[assets] placeholders in use (${drawn.length}): ${drawn.join(', ')}`);
    if (own.images.includes('sauce-blob')) makeUiTextures(game);
    me.done = true;
    timing.recipe![id] = Math.round(performance.now() - t0);
    console.info(`[assets] ${id} ready in ${timing.recipe![id]} ms`);
  });
  current = me;
  return me.ready;
}

/** True once `id`'s own images and sounds are in. */
export const recipeLoaded = (id: string) => current?.id === id && !!current.done;

/** A contract image asked for before it is loaded (a key missing from RECIPE_ASSETS) shows Phaser's green box: say which. */
function warnUnloaded(textures: Phaser.Textures.TextureManager) {
  const told = new Set<string>();
  const get = textures.get.bind(textures);
  textures.get = ((key: string | Phaser.Textures.Texture) => {
    if (typeof key === 'string' && key in IMAGES && !textures.exists(key) && !told.has(key)) {
      told.add(key);
      console.warn(`[assets] not loaded yet: ${key} (add it to RECIPE_ASSETS)`);
    }
    return get(key);
  }) as typeof textures.get;
}

/**
 * Back on the home screen: every texture that is not core (the recipe's art, its placeholders, what was made in play:
 * her pizza, the slices, the photo) is removed, and the recipe's own sounds are freed.
 */
export function releaseRecipe(game: Phaser.Game) {
  if (!current) return;
  const own = RECIPE_ASSETS[current.id];
  current = null;
  const keep = new Set<string>([...CORE_IMAGES, FX_DOT, FX_SOFT]);
  for (const key of game.textures.getTextureKeys()) if (!keep.has(key)) game.textures.remove(key);
  if (own) releaseSounds(own.sounds);
}
let titleArt: Promise<void> | null = null;

/** Resolves once the title's logo, Mom, Pipa and the pointing hand are ready (or stood in for). */
export function titleArtReady(): Promise<void> {
  return titleArt ?? Promise.resolve();
}
let titleArtIn = false;
export const titleArtLoaded = () => titleArtIn;

/** Resolves once every core image (and the placeholders for missing ones) is ready. Home waits on it before a recipe. */
export function assetsReady(): Promise<void> {
  return everything ?? Promise.resolve();
}

/**
 * Loads whatever assets exist on disk, then fills every gap with a code-drawn
 * placeholder. A missing or broken file never stops the game.
 * The title starts as soon as its own few images are in; the rest (and all sounds) keep
 * loading in the background while the child looks at the title and home screens.
 */
export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  create() {
    const { width: W, height: H } = this.scale;
    this.cameras.main.setBackgroundColor('#ffe4b5');
    const spinner = this.add.arc(W / 2, H / 2, Math.min(W, H) * 0.06, 0, 270, false).setStrokeStyle(18, 0xff8c42).setClosePath(false);
    this.tweens.add({ targets: spinner, angle: 360, duration: 900, repeat: -1 });

    // The memory book is read once here, so the home screen knows straight away whether to show its button.
    void refreshAlbumCount();

    const textures = this.textures;
    const loadOne = (k: ImageKey) => load(textures, k);
    warnUnloaded(textures);
    const unlisted = unlistedImages();
    if (unlisted.length) console.warn(`[assets] in no recipe and not core (RECIPE_ASSETS): ${unlisted.join(', ')}`);

    const t0 = performance.now();
    const early = Promise.all(EARLY.filter(exists).map(loadOne)).catch((err) => console.warn('[assets] image loading error', err));
    titleArt = early
      .then(() => Promise.all(TITLE_ART.filter(exists).map(loadOne)))
      .catch((err) => console.warn('[assets] image loading error', err))
      .then(() => {
        ensurePlaceholders(this.game, TITLE_ART.filter((k) => k !== 'logo-cooking-with-mom'));
        titleArtIn = true;
      });
    const rest = titleArt.then(() => Promise.all(CORE_IMAGES.filter((k) => exists(k) && !EARLY.includes(k) && !TITLE_ART.includes(k)).map(loadOne)));
    everything = rest
      .catch((err) => console.warn('[assets] image loading error', err))
      .then(() => {
        const drawn = ensurePlaceholders(this.game, CORE_IMAGES);
        if (drawn.length) console.info(`[assets] placeholders in use (${drawn.length}): ${drawn.join(', ')}`);
        timing.all = Math.round(performance.now() - t0);
        console.info(`[assets] core images ready ${timing.all} ms after boot`);
      });
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
      loadSounds(this.game, (key) => url(key));
      this.scene.start('Title');
    });
  }
}

/**
 * Loads a handful of contract images now, outside the recipe loading (the memory book needs every recipe's photo
 * frame). Resolves when they are in, with placeholders for any that are missing.
 */
export async function loadImages(game: Phaser.Game, keys: readonly ImageKey[]): Promise<void> {
  await assetsReady();
  await Promise.all(keys.filter((k) => exists(k) && !game.textures.exists(k)).map((k) => load(game.textures, k))).catch((err) =>
    console.warn('[assets] image loading error', err),
  );
  ensurePlaceholders(game, keys);
}

/** Frees images loaded by `loadImages` (core art is kept). */
export function releaseImages(game: Phaser.Game, keys: readonly string[]) {
  const core = new Set<string>(CORE_IMAGES);
  for (const k of keys) if (!core.has(k) && game.textures.exists(k)) game.textures.remove(k);
}
