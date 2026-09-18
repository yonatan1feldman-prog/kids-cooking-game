import Phaser from 'phaser';
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
    // EXPAND: fills any portrait screen edge to edge without distortion; scenes lay out from scale.width/height.
    mode: Phaser.Scale.EXPAND,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: BASE_W,
    height: BASE_H,
  },
  input: { activePointers: 1 },
  scene: [BootScene, TitleScene, HomeScene, RecipeScene],
});

// Handy for debugging from the browser console.
(window as unknown as { game: Phaser.Game }).game = game;
