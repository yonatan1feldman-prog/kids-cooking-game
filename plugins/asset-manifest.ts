import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import type { Plugin } from 'vite';
import { CORE_IMAGES, GUEST_LAYERS, IMAGES, RECIPE_ASSETS } from '../src/core/assets.ts';

/**
 * Exposes `virtual:asset-manifest`: the list of asset files that actually exist
 * in public/assets at build (or dev-server) time. The game loads only what exists
 * and draws code placeholders for the rest, so missing files never cause 404s.
 * In dev, adding/removing a file under public/assets triggers a full reload.
 *
 * Images: the SVGs in public/assets/images are the source. Pre-rendered WebP copies live in
 * public/assets/images/webp (made by scripts/bake-webp.js, see AGENTS.md "Pre-rendered art").
 * A WebP is used only if `webp/sources.json` records the sha1 of the SVG as it is now, so a
 * changed SVG is never hidden by a stale WebP: the game then rasterizes the SVG instead.
 *
 * Sounds: any .ogg/.mp3 under public/assets/sounds (sub-folders voice/, music/, sfx/ included);
 * the key is the file name without extension.
 */
const VIRTUAL_ID = 'virtual:asset-manifest';
const RESOLVED_ID = '\0' + VIRTUAL_ID;

const SOUND_EXT = ['.ogg', '.mp3'];

export interface WebpSource {
  sha1: string;
  w: number;
  h: number;
}

export const sha1 = (buf: Buffer | string) => crypto.createHash('sha1').update(buf).digest('hex');

export function scanAssets(root: string) {
  const imgDir = path.join(root, 'public', 'assets', 'images');
  const webpDir = path.join(imgDir, 'webp');
  const sndDir = path.join(root, 'public', 'assets', 'sounds');
  const list = (dir: string) => (fs.existsSync(dir) ? fs.readdirSync(dir) : []);

  let sources: Record<string, WebpSource> = {};
  try {
    sources = JSON.parse(fs.readFileSync(path.join(webpDir, 'sources.json'), 'utf8'));
  } catch {
    /* no pre-rendered art yet */
  }

  const images: Record<string, string> = {};
  const webp: Record<string, string> = {};
  const stale: string[] = [];
  for (const file of list(imgDir)) {
    if (path.extname(file).toLowerCase() !== '.svg') continue;
    const key = path.basename(file, '.svg');
    images[key] = `assets/images/${file}`;
    const src = sources[key];
    if (!src || !fs.existsSync(path.join(webpDir, `${key}.webp`))) continue;
    if (src.sha1 === sha1(fs.readFileSync(path.join(imgDir, file)))) webp[key] = `assets/images/webp/${key}.webp`;
    else stale.push(key);
  }

  const sounds: Record<string, string[]> = {};
  const walk = (dir: string, rel: string) => {
    for (const file of list(dir)) {
      const full = path.join(dir, file);
      if (fs.statSync(full).isDirectory()) {
        walk(full, `${rel}${file}/`);
        continue;
      }
      const ext = path.extname(file).toLowerCase();
      if (!SOUND_EXT.includes(ext)) continue;
      (sounds[path.basename(file, ext)] ??= []).push(`assets/sounds/${rel}${file}`);
    }
  };
  walk(sndDir, '');
  // ogg first, mp3 as fallback (Phaser picks the first format the browser can play)
  for (const key of Object.keys(sounds)) sounds[key].sort((a) => (a.endsWith('.ogg') ? -1 : 1));

  return { images, webp, sounds, stale };
}

/**
 * The worlds that are not precached (polish round, research/polish-spec.md P19): the service worker keeps their files in
 * a runtime cache instead, filled on the first visit (so the install is ~20 MB lighter). Only the files no other part of
 * the game lists (the clinic and the farm may share some): core art, the recipes' and the other games' files, the
 * guests' layers stay precached.
 */
export const RUNTIME_WORLDS = ['clinic', 'farm'] as const;

/** For each runtime world, the files (relative to BASE_URL, as in the manifest) only it uses. */
export function worldOnlyFiles(root: string) {
  const { images, webp, sounds } = scanAssets(root);
  const elsewhere = new Set<string>([...CORE_IMAGES, ...GUEST_LAYERS]);
  for (const [id, r] of Object.entries(RECIPE_ASSETS)) {
    if ((RUNTIME_WORLDS as readonly string[]).includes(id)) continue;
    for (const k of [...r.images, ...r.sounds]) elsewhere.add(k);
  }
  const out: Record<string, string[]> = {};
  for (const id of RUNTIME_WORLDS) {
    const own = RECIPE_ASSETS[id] ?? { images: [], sounds: [] };
    const files = [
      ...own.images.filter((k) => !elsewhere.has(k)).map((k) => webp[k] ?? images[k]),
      ...own.sounds.filter((k) => !elsewhere.has(k)).flatMap((k) => sounds[k] ?? []),
    ];
    out[id] = [...new Set(files.filter(Boolean))];
  }
  return out;
}

const md5 = (file: string) => crypto.createHash('md5').update(fs.readFileSync(file)).digest('hex').slice(0, 8);

export function assetManifest(): Plugin {
  let root = process.cwd();
  let build = false;
  return {
    name: 'asset-manifest',
    configResolved(config) {
      root = config.root;
      build = config.command === 'build';
    },
    resolveId(id) {
      return id === VIRTUAL_ID ? RESOLVED_ID : null;
    },
    load(id) {
      if (id !== RESOLVED_ID) return null;
      const { images, webp, sounds, stale } = scanAssets(root);
      if (stale.length) this.warn(`pre-rendered WebP out of date (the SVG is used instead): ${stale.join(', ')}. Run scripts/bake-webp.js.`);
      // In the build, the runtime-cached worlds' files carry their content hash (?v=), so a changed file is a new URL
      // and the cache-first runtime cache never serves an old one. (Precached files have their own revisions.)
      const world = worldOnlyFiles(root);
      if (build) {
        const ver = new Map<string, string>();
        for (const f of Object.values(world).flat()) ver.set(f, `${f}?v=${md5(path.join(root, 'public', f))}`);
        const v = (f: string) => ver.get(f) ?? f;
        for (const m of [images, webp]) for (const k of Object.keys(m)) m[k] = v(m[k]);
        for (const k of Object.keys(sounds)) sounds[k] = sounds[k].map(v);
        for (const id of Object.keys(world)) world[id] = world[id].map(v);
      }
      return `export default ${JSON.stringify({ images, webp, sounds, world })};`;
    },
    configureServer(server) {
      const assetsDir = path.join(root, 'public', 'assets');
      server.watcher.add(assetsDir);
      const onChange = (file: string) => {
        if (!path.resolve(file).startsWith(path.resolve(assetsDir))) return;
        // Files written by the WebP bake don't reload the page mid-bake (reload once it is done).
        if (path.resolve(file).startsWith(path.resolve(assetsDir, 'images', 'webp'))) return;
        const mod = server.moduleGraph.getModuleById(RESOLVED_ID);
        if (mod) server.moduleGraph.invalidateModule(mod);
        server.ws.send({ type: 'full-reload' });
      };
      // Dev only: the WebP bake (scripts/bake-webp.js, run inside the game page) lists the SVGs with the size
      // to render them at, then posts each WebP back here. Nothing of this exists in the production build.
      const webpDir = path.join(assetsDir, 'images', 'webp');
      const sourcesFile = path.join(webpDir, 'sources.json');
      server.middlewares.use('/__bake', (req, res) => {
        const url = new URL(req.url ?? '/', 'http://x');
        const imgDir = path.join(assetsDir, 'images');
        if (url.pathname === '/list') {
          const out = Object.entries(IMAGES as Record<string, { size: readonly number[]; raster?: number }>)
            .filter(([key]) => fs.existsSync(path.join(imgDir, `${key}.svg`)))
            .map(([key, v]) => {
              const f = v.raster ?? 1;
              return { key, sha1: sha1(fs.readFileSync(path.join(imgDir, `${key}.svg`))), w: Math.round(v.size[0] * f), h: Math.round(v.size[1] * f) };
            });
          res.setHeader('Content-Type', 'application/json');
          return res.end(JSON.stringify(out));
        }
        if (url.pathname === '/put' && req.method === 'POST') {
          const key = url.searchParams.get('key') ?? '';
          if (!/^[a-z0-9-]+$/.test(key)) return res.writeHead(400).end();
          const chunks: Buffer[] = [];
          req.on('data', (c: Buffer) => chunks.push(c));
          req.on('end', () => {
            fs.mkdirSync(webpDir, { recursive: true });
            fs.writeFileSync(path.join(webpDir, `${key}.webp`), Buffer.concat(chunks));
            let sources: Record<string, WebpSource> = {};
            try {
              sources = JSON.parse(fs.readFileSync(sourcesFile, 'utf8'));
            } catch {
              /* first file */
            }
            sources[key] = { sha1: url.searchParams.get('sha1') ?? '', w: Number(url.searchParams.get('w')), h: Number(url.searchParams.get('h')) };
            const sorted = Object.fromEntries(Object.keys(sources).sort().map((k) => [k, sources[k]]));
            fs.writeFileSync(sourcesFile, JSON.stringify(sorted, null, 1) + '\n');
            const mod = server.moduleGraph.getModuleById(RESOLVED_ID);
            if (mod) server.moduleGraph.invalidateModule(mod);
            res.end('ok');
          });
          return;
        }
        res.writeHead(404).end();
      });
      // Dev only: the test harness posts a PNG of the game canvas (`__saveShot`) into docs/screenshots-roundN
      // (git-ignored; `dir` picks the round's folder, screenshots-round4 by default).
      server.middlewares.use('/__dev/shot', (req, res) => {
        const q = new URL(req.url ?? '/', 'http://x').searchParams;
        const name = q.get('name') ?? '';
        const folder = q.get('dir') ?? 'screenshots-round4';
        if (req.method !== 'POST' || !/^[a-z0-9-]+$/.test(name) || !/^screenshots-round[0-9a-z]+$/.test(folder)) return res.writeHead(400).end();
        const chunks: Buffer[] = [];
        req.on('data', (c: Buffer) => chunks.push(c));
        req.on('end', () => {
          const dir = path.join(root, 'docs', folder);
          fs.mkdirSync(dir, { recursive: true });
          fs.writeFileSync(path.join(dir, `${name}.png`), Buffer.concat(chunks));
          res.end('ok');
        });
      });
      server.watcher.on('add', onChange);
      server.watcher.on('unlink', onChange);
      server.watcher.on('change', onChange);
    },
  };
}
