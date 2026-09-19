import Phaser from 'phaser';
import { stars } from '../core/fx';
import { addBackground, getLayout, keepLayoutOnResize } from '../core/layout';
import { getStage } from '../core/stage';
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

    const S = getStage(L);
    const n = RECIPES.length;
    RECIPES.forEach((recipe, i) => {
      const at = S.card(i, n);
      const card = iconButton(this, L, recipe.card, at.x, at.y, () => {
        stars(this, card.x, card.y, 14, 70 * L.k);
        this.time.delayedCall(350, () => this.scene.start('Recipe', { id: recipe.id }));
      }, { hitPad: n === 1 ? 120 : 40 });
      this.tweens.add({ targets: card, y: at.y - 20 * L.k, duration: 1200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut', delay: i * 200 });
      this.tweens.add({ targets: card, alpha: { from: 0, to: 1 }, duration: 400 });
    });
  }
}
