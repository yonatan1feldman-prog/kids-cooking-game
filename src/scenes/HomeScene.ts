import Phaser from 'phaser';
import { stars } from '../core/fx';
import { addBackground, getLayout, keepLayoutOnResize } from '../core/layout';
import { iconButton } from '../core/ui';
import { RECIPES } from '../recipes';

/** Home: one big card per recipe. Tapping a card starts that recipe. */
export class HomeScene extends Phaser.Scene {
  constructor() {
    super('Home');
  }

  create() {
    const L = getLayout(this);
    keepLayoutOnResize(this, L);
    addBackground(this, L);

    const n = RECIPES.length;
    const cardW = n === 1 ? L.u * 0.62 : L.u * 0.42;
    RECIPES.forEach((recipe, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const x = n === 1 ? L.cx : L.cx + (col - 0.5) * cardW * 1.1;
      const y = n === 1 ? L.H * 0.46 : L.H * 0.25 + row * cardW * 1.25;
      const card = iconButton(this, recipe.card, x, y, cardW, () => {
        stars(this, card.x, card.y, 14, L.u * 0.07);
        this.time.delayedCall(350, () => this.scene.start('Recipe', { id: recipe.id }));
      });
      this.tweens.add({ targets: card, y: y - L.u * 0.02, duration: 1200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut', delay: i * 200 });
      this.tweens.add({ targets: card, alpha: { from: 0, to: 1 }, duration: 400 });
    });
  }
}
