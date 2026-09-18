import fs from 'node:fs';
import path from 'node:path';
import type { Plugin } from 'vite';

/**
 * Exposes `virtual:asset-manifest`: the list of asset files that actually exist
 * in public/assets at build (or dev-server) time. The game loads only what exists
 * and draws code placeholders for the rest, so missing files never cause 404s.
 * In dev, adding/removing a file under public/assets triggers a full reload.
 */
const VIRTUAL_ID = 'virtual:asset-manifest';
const RESOLVED_ID = '\0' + VIRTUAL_ID;

const IMAGE_EXT = ['.svg'];
const SOUND_EXT = ['.ogg', '.mp3'];

function scan(root: string) {
  const imgDir = path.join(root, 'public', 'assets', 'images');
  const sndDir = path.join(root, 'public', 'assets', 'sounds');
  const list = (dir: string) => (fs.existsSync(dir) ? fs.readdirSync(dir) : []);

  const images: Record<string, string> = {};
  for (const file of list(imgDir)) {
    const ext = path.extname(file).toLowerCase();
    if (IMAGE_EXT.includes(ext)) images[path.basename(file, ext)] = `assets/images/${file}`;
  }

  const sounds: Record<string, string[]> = {};
  for (const file of list(sndDir)) {
    const ext = path.extname(file).toLowerCase();
    if (!SOUND_EXT.includes(ext)) continue;
    const key = path.basename(file, ext);
    (sounds[key] ??= []).push(`assets/sounds/${file}`);
  }
  // ogg first, mp3 as fallback (Phaser picks the first format the browser can play)
  for (const key of Object.keys(sounds)) sounds[key].sort((a) => (a.endsWith('.ogg') ? -1 : 1));

  return { images, sounds };
}

export function assetManifest(): Plugin {
  let root = process.cwd();
  return {
    name: 'asset-manifest',
    configResolved(config) {
      root = config.root;
    },
    resolveId(id) {
      return id === VIRTUAL_ID ? RESOLVED_ID : null;
    },
    load(id) {
      if (id !== RESOLVED_ID) return null;
      return `export default ${JSON.stringify(scan(root))};`;
    },
    configureServer(server) {
      const assetsDir = path.join(root, 'public', 'assets');
      server.watcher.add(assetsDir);
      const onChange = (file: string) => {
        if (!path.resolve(file).startsWith(path.resolve(assetsDir))) return;
        const mod = server.moduleGraph.getModuleById(RESOLVED_ID);
        if (mod) server.moduleGraph.invalidateModule(mod);
        server.ws.send({ type: 'full-reload' });
      };
      server.watcher.on('add', onChange);
      server.watcher.on('unlink', onChange);
      server.watcher.on('change', onChange);
    },
  };
}
