import Phaser from 'phaser';
import manifest from 'virtual:asset-manifest';
import { refreshAlbumCount } from '../core/album';
import { refreshWallDrawing, WALL_DRAWING } from '../core/artWall';
import { CORE_IMAGES, FX_DOT, KITCHEN_KEYS, FX_SOFT, IMAGES, RECIPE_ASSETS, SCENERY_KEYS, textureSize, unlistedImages, type ImageKey } from '../core/assets';
import { loadRecipeSounds, loadSounds, releaseSounds } from '../core/audio';
import { ensurePlaceholders, makeFxTextures, makeUiTextures } from '../core/placeholders';
import { SUNBEAM_KEY } from '../core/scenery';
import { loadSvgTexture, loadWebpTexture } from '../core/svgRaster';

/** Asset paths in the manifest are relative to the site root; the game lives under BASE_URL. */
const url = (p: string) => import.meta.env.BASE_URL + p;

/**
 * Load groups (polish round, the loading time): each screen waits only for what it draws.
 * - EARLY: what the title draws at once (the background, the two game cards, the star; the level stars are drawn in
 *   code). The title starts the moment these are in.
 * - TITLE_ART: Mom, Pipa, the logo and Mom's pointing hand. They fade in on the title when ready.
 * - HOME_ART: the living kitchen's pieces (they join the background as each comes in), the home screen's cards and
 *   the home button. The home screen waits for this group only.
 * - PLAY_ART: the rest of what every recipe and game needs (Mom's demo hands, the buttons). A card tap waits for this
 *   group (`assetsReady`), then loads the recipe's own art.
 * - SCENERY: the window's garden, the cat, the clock, the sill (core/scenery.ts): each joins when it is in; nothing waits.
 * Everything goes through one queue, at most `PARALLEL` at a time, in this order (a recipe's own art goes before the
 * scenery), so the title keeps drawing and answering her taps while the pictures go to the GPU a few at a time.
 */
const EARLY: ImageKey[] = ['bg-kitchen-landscape', 'world-card-kitchen', 'world-card-clinic', 'star'];
const TITLE_ART: ImageKey[] = [
  'logo-cooking-with-mom',
  ...CORE_IMAGES.filter((k) => (k.startsWith('mom-') && !k.startsWith('mom-hand-')) || k.startsWith('character-')),
  'mom-hand-point',
];
const HOME_ART: ImageKey[] = [...KITCHEN_KEYS, ...CORE_IMAGES.filter((k) => k.startsWith('card-')), 'btn-home'];
const SCENERY: readonly ImageKey[] = SCENERY_KEYS;
const PLAY_ART: ImageKey[] = CORE_IMAGES.filter((k) => ![...EARLY, ...TITLE_ART, ...HOME_ART, ...SCENERY].includes(k));
const PRIORITY = { early: 50, title: 40, home: 30, play: 20, recipe: 15, scenery: 5 } as const;
const PARALLEL = 6;

let homeArt: Promise<void> | null = null;
let playArt: Promise<void> | null = null;
let everything: Promise<void> | null = null;

// Pre-rendered WebP where it matches the current SVG (fast), else the SVG rasterized here (slow filters).
const load = async (textures: Phaser.Textures.TextureManager, k: ImageKey) =>
  (manifest.webp[k] && (await loadWebpTexture(textures, k, url(manifest.webp[k])))) ||
  loadSvgTexture(textures, k, url(manifest.images[k]), textureSize(k));
const exists = (k: ImageKey) => !!manifest.images[k];

/** The image queue: at most PARALLEL loads at a time, the highest priority first (in the order asked within one). */
const queue: { k: ImageKey; prio: number; seq: number; run: () => void }[] = [];
const inFlight = new Map<ImageKey, Promise<void>>();
let running = 0;
let seq = 0;
function fetchImage(textures: Phaser.Textures.TextureManager, k: ImageKey, prio: number): Promise<void> {
  const known = inFlight.get(k);
  if (known) {
    // Asked again with more hurry (a recipe needs a picture the scenery queued): it moves up.
    const q = queue.find((j) => j.k === k);
    if (q && q.prio < prio) q.prio = prio;
    return known;
  }
  const p = new Promise<void>((resolve) => {
    queue.push({
      k,
      prio,
      seq: seq++,
      run: () =>
        load(textures, k)
          .then(
            () => undefined,
            (err) => console.warn('[assets] image loading error', k, err),
          )
          .finally(() => {
            running--;
            inFlight.delete(k);
            resolve();
            pump();
          }),
    });
  });
  inFlight.set(k, p);
  pump();
  return p;
}
function pump() {
  while (running < PARALLEL && queue.length) {
    let best = 0;
    for (let i = 1; i < queue.length; i++) {
      const a = queue[i];
      const b = queue[best];
      if (a.prio > b.prio || (a.prio === b.prio && a.seq < b.seq)) best = i;
    }
    const job = queue.splice(best, 1)[0];
    running++;
    job.run();
  }
}
/** Loads `keys` (those on disk and not loaded yet) through the queue. */
const fetchAll = (textures: Phaser.Textures.TextureManager, keys: readonly ImageKey[], prio: number) =>
  Promise.all(keys.filter((k) => exists(k) && !textures.exists(k)).map((k) => fetchImage(textures, k, prio))).then(() => undefined);

/** The recipe whose images and sounds are loaded (or loading) now, with its promise and load time. */
let current: { id: string; ready: Promise<void>; done?: boolean } | null = null;
/**
 * Load times, ms (for the console and the test harness, `window.__loadTiming`): `images` / `total` = the title's own
 * images since boot / since the page started; `title`, `home`, `play`, `all` = each group in, since the page started.
 */
const timing: { images?: number; total?: number; title?: number; home?: number; play?: number; all?: number; recipe?: Record<string, number> } = { recipe: {} };

/**
 * Loads a recipe's own images and sounds (RECIPE_ASSETS in the contract) after the core; resolves when they are in
 * (placeholders for missing art). Another recipe's are released first. The home screen calls it on a card tap.
 */
export function recipeAssets(game: Phaser.Game, id: string): Promise<void> {
  if (current?.id === id) return current.ready;
  releaseRecipe(game);
  const own = RECIPE_ASSETS[id] ?? { images: [], sounds: [] };
  const me: { id: string; ready: Promise<void>; done?: boolean } = { id, ready: Promise.resolve() };
  const t0 = performance.now();
  // Its sounds start at once (they don't compete with the pictures for the GPU); its pictures queue right behind
  // what every game needs (`assetsReady`), ahead of the window's scenery.
  const sounds = loadRecipeSounds(own.sounds);
  me.ready = assetsReady().then(async () => {
    await Promise.all([fetchAll(game.textures, own.images, PRIORITY.recipe), sounds]);
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
  const keep = new Set<string>([...CORE_IMAGES, FX_DOT, FX_SOFT, 'fx-heart', 'fx-ring', 'fx-paper', SUNBEAM_KEY, WALL_DRAWING]);
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

/** Resolves once the home screen's cards and button are ready (or stood in for). */
export function homeArtReady(): Promise<void> {
  return homeArt ?? Promise.resolve();
}

/**
 * Resolves once everything a recipe or game needs from the core is ready: Mom, Pipa, the demo hands, the buttons (and
 * placeholders for missing ones). A card tap waits on it; the window's scenery may still be coming in.
 */
export function assetsReady(): Promise<void> {
  return playArt ?? Promise.resolve();
}

/** Resolves once every core image is in, the scenery too (nothing has to wait for it). */
export function allCoreReady(): Promise<void> {
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
    void refreshWallDrawing(this.game);

    const textures = this.textures;
    warnUnloaded(textures);
    const unlisted = unlistedImages();
    if (unlisted.length) console.warn(`[assets] in no recipe and not core (RECIPE_ASSETS): ${unlisted.join(', ')}`);
    // Sounds start now, the title's few first (the hello line, the game names): they are fetched and decoded beside the
    // pictures, off the main thread, so the first tap is heard even right after an install or an update.
    loadSounds(this.game, (key) => url(key));

    const t0 = performance.now();
    const since = () => Math.round(performance.now());
    const early = fetchAll(textures, EARLY, PRIORITY.early);
    titleArt = fetchAll(textures, TITLE_ART, PRIORITY.title).then(() => {
      ensurePlaceholders(this.game, TITLE_ART.filter((k) => k !== 'logo-cooking-with-mom'));
      titleArtIn = true;
      timing.title = since();
    });
    homeArt = fetchAll(textures, HOME_ART, PRIORITY.home).then(() => {
      ensurePlaceholders(this.game, HOME_ART);
      timing.home = since();
    });
    playArt = Promise.all([titleArt, homeArt, fetchAll(textures, PLAY_ART, PRIORITY.play)]).then(() => {
      ensurePlaceholders(this.game, PLAY_ART);
      timing.play = since();
      console.info(`[assets] ready to play ${timing.play} ms after page start`);
    });
    everything = Promise.all([playArt, fetchAll(textures, SCENERY, PRIORITY.scenery)]).then(() => {
      const drawn = ensurePlaceholders(this.game, CORE_IMAGES);
      if (drawn.length) console.info(`[assets] placeholders in use (${drawn.length}): ${drawn.join(', ')}`);
      timing.all = since();
      console.info(`[assets] core images ready ${timing.all} ms after page start`);
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
  await fetchAll(game.textures, keys, PRIORITY.recipe);
  ensurePlaceholders(game, keys);
}

/** Frees images loaded by `loadImages` (core art is kept). */
export function releaseImages(game: Phaser.Game, keys: readonly string[]) {
  const core = new Set<string>(CORE_IMAGES);
  for (const k of keys) if (!core.has(k) && game.textures.exists(k)) game.textures.remove(k);
}
