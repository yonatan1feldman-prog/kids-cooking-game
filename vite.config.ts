import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import { assetManifest } from './plugins/asset-manifest';

export default defineConfig({
  base: './',
  server: { host: true, port: 5173 },
  build: { chunkSizeWarningLimit: 2000 },
  plugins: [
    assetManifest(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: false, // registered from src/main.ts
      includeAssets: ['icons/*.png'],
      manifest: {
        name: 'Cooking',
        short_name: 'Cooking',
        description: 'A private cooking game for a young child.',
        lang: 'he',
        display: 'fullscreen',
        orientation: 'portrait',
        background_color: '#ffe4b5',
        theme_color: '#ffb347',
        start_url: './',
        scope: './',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Everything the game needs is precached, so it works offline after the first visit.
        globPatterns: ['**/*.{js,css,html,png,svg,ogg,mp3,webmanifest}'],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
      },
    }),
  ],
});
