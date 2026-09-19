import Phaser from 'phaser';
import { blockBrowserGestures, installLifecycle } from './core/device';
import { BASE_H, BASE_W } from './core/layout';
import { BootScene } from './scenes/BootScene';
import { HomeScene } from './scenes/HomeScene';
import { RecipeScene } from './scenes/RecipeScene';
import { TitleScene } from './scenes/TitleScene';

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  backgroundColor: '#ffe4b5',
  disableContextMenu: true,
  scale: {
    // EXPAND on a 1440x1080 base: the world is 1080 high and as wide as the screen (1440 at 4:3,
    // 2400 at 20:9), edge to edge, without distortion. Scenes lay out from scale.width/height.
    mode: Phaser.Scale.EXPAND,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: BASE_W,
    height: BASE_H,
  },
  // Three touch slots so a resting palm can't take the only slot. Which touch "owns" an
  // action is decided in Step / iconButton: the first finger rules until it is lifted.
  input: { activePointers: 3 },
  scene: [BootScene, TitleScene, HomeScene, RecipeScene],
});

blockBrowserGestures();
installLifecycle(game);

// Handy for debugging from the browser console.
(window as unknown as { game: Phaser.Game }).game = game;

// Offline support (service worker). Browsers only allow it over HTTPS or on localhost.
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  import('virtual:pwa-register').then(({ registerSW }) => registerSW({ immediate: true })).catch(() => {});
}
