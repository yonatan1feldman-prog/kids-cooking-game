import Phaser from 'phaser';
import { stars } from '../core/fx';
import { addBackground, getLayout, keepLayoutOnResize } from '../core/layout';
import { iconButton } from '../core/ui';
import { RECIPES } from '../recipes';

/** Home: one card per recipe, at the art scale. Tapping a card starts that recipe. */
export class HomeScene extends Phaser.Scene {
  constructor() {
    super('Home');
  }

  create() {
    const L = getLayout(this);
    keepLayoutOnResize(this, L);
    addBackground(this, L);

    const n = RECIPES.length;
    RECIPES.forEach((recipe, i) => {
      // One card: centered. More cards: two columns.
      const d = n === 1 ? { x: 540, y: 960 } : { x: 290 + (i % 2) * 500, y: 620 + Math.floor(i / 2) * 640 };
      const at = L.P(d.x, d.y);
      const card = iconButton(this, L, recipe.card, at.x, at.y, () => {
        stars(this, card.x, card.y, 14, 70 * L.k);
        this.time.delayedCall(350, () => this.scene.start('Recipe', { id: recipe.id }));
      });
      this.tweens.add({ targets: card, y: at.y - 20 * L.k, duration: 1200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut', delay: i * 200 });
      this.tweens.add({ targets: card, alpha: { from: 0, to: 1 }, duration: 400 });
    });
  }
}
