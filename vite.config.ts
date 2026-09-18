import { defineConfig } from 'vite';
import { assetManifest } from './plugins/asset-manifest';

export default defineConfig({
  base: './',
  server: { host: true, port: 5173 },
  build: { chunkSizeWarningLimit: 2000 },
  plugins: [assetManifest()],
});
