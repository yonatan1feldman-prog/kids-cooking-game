import Phaser from 'phaser';
import { blockBrowserGestures, installLifecycle } from './core/device';
import { installOrientationGuard } from './core/orientation';
import { registerServiceWorker } from './core/update';
import { BASE_H, BASE_W } from './core/layout';
import { BootScene } from './scenes/BootScene';
import { AlbumScene } from './scenes/AlbumScene';
import { HomeScene } from './scenes/HomeScene';
import { RecipeScene } from './scenes/RecipeScene';
import { TitleScene } from './scenes/TitleScene';

const game = new Phaser.Game({
  type: Phaser.AUTO,
  // At most 8 textures per draw batch (Phaser uses up to 16 by default). With 16, the finale lost pieces of Mom's
  // body and arm in WebGL (a crowded screen: the kitchen's pieces, the photo, the stars); with 8 it draws whole. The
  // cost is a few more draw calls, nothing this game notices.
  render: { maxTextures: 8 },
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
  scene: [BootScene, TitleScene, HomeScene, RecipeScene, AlbumScene],
});

blockBrowserGestures();
installLifecycle(game);
installOrientationGuard(game);

// Handy for debugging from the browser console.
(window as unknown as { game: Phaser.Game }).game = game;

// Offline support and safe updates (a new version is switched on only at the title, see core/update.ts).
registerServiceWorker();
