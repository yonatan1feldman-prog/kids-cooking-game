import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import { assetManifest, scanAssets } from './plugins/asset-manifest.ts';

// The game is served from a sub-path (https://<user>.github.io/kids-cooking-game/), in dev and
// preview too, so local runs use the same URLs as the deployment. Code builds URLs from
// import.meta.env.BASE_URL, never from a leading '/'.
const BASE = '/kids-cooking-game/';

// SVGs that have an up-to-date pre-rendered WebP are never loaded by the game: don't precache them twice.
const covered = Object.keys(scanAssets(process.cwd()).webp).map((k) => `assets/images/${k}.svg`);

export default defineConfig({
  base: BASE,
  server: { host: true, port: 5173 },
  build: { chunkSizeWarningLimit: 2000 },
  plugins: [
    assetManifest(),
    VitePWA({
      // A new version installs in the background and waits (no skipWaiting): the title screen switches it on
      // before the game starts (src/core/update.ts), never in the middle of a recipe.
      registerType: 'prompt',
      injectRegister: false, // registered from src/core/update.ts
      includeAssets: ['icons/*.png'],
      manifest: {
        name: 'Cooking with Mom',
        short_name: 'Cooking with Mom',
        description: 'A private cooking game for a young child.',
        lang: 'en',
        display: 'fullscreen',
        orientation: 'landscape',
        background_color: '#ffe4b5',
        theme_color: '#ffb347',
        start_url: BASE,
        scope: BASE,
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Everything the game needs is precached, so it works offline after the first visit.
        // (sounds included: voice, music and effects all work offline)
        globPatterns: ['**/*.{js,css,html,png,svg,webp,ogg,mp3,webmanifest}'],
        globIgnores: covered,
        // Only Vite's own hashed files skip the content revision. The game's art and sounds also live under
        // assets/ but keep their names when they change, so they need a revision to be updated.
        dontCacheBustURLsMatching: /^assets\/[^/]+-[A-Za-z0-9_-]{8}\.(js|css)$/,
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
      },
    }),
  ],
});
