import Phaser from 'phaser';
import { voice } from '../core/audio';
import { stars } from '../core/fx';
import { screenHint } from '../core/hand';
import { addBackground, getLayout, keepLayoutOnResize } from '../core/layout';
import { getStage } from '../core/stage';
import { iconButton } from '../core/ui';
import { RECIPES } from '../recipes';
import { Character } from '../steps/Character';
import { Mom } from '../steps/Mom';
import { assetsReady } from './BootScene';

/**
 * Home: one card per recipe, Mom at the counter (and Pipa beside her on phones). Nothing moves by
 * itself here except Mom breathing and blinking: the child picks a card when she wants to, and the
 * game never starts a recipe on its own. Tapping a card starts that recipe ("Let's make a pizza!").
 * Arriving from the title (or by the home button) Mom asks "What shall we make today?"; after a finished
 * recipe the home screen stays quiet (the finale already said goodbye). Idle 5 s: her hand taps the card.
 */
export interface HomeData {
  from?: 'title' | 'recipe' | 'finale';
  /** Set once Mom has asked, so a rebuild at a new size (relayout) doesn't ask again. */
  asked?: boolean;
}

export class HomeScene extends Phaser.Scene {
  constructor() {
    super('Home');
  }

  create(data: HomeData = {}) {
    const L = getLayout(this);
    let going = false;
    if ((data.from === 'title' || data.from === 'recipe') && !data.asked) {
      data.asked = true;
      voice.say('vo-what-make', { ttlMs: 4000, valid: () => this.scene.isActive() && !going });
    }
    keepLayoutOnResize(this, L, { relayout: true });
    addBackground(this, L);
    const S = getStage(L);

    // Mom and Pipa come in as soon as their art is loaded (normally before this screen shows).
    assetsReady().then(() => {
      if (!this.scene.isActive()) return;
      const mom = new Mom(this, S.mom);
      mom.box.setAlpha(0);
      this.tweens.add({ targets: mom.box, alpha: 1, duration: 300 });
      if (S.pet) new Character(this, RECIPES[0].character, S.pet, S.feedPet).enter(150);
      this.events.on(Phaser.Scenes.Events.UPDATE, () => {
        const p = this.input.manager.pointers.find((q) => q.isDown);
        mom.lookAt(p ? p.worldX : L.cx, p ? p.worldY : L.cy);
      });
    });

    const n = RECIPES.length;
    const cards: Phaser.GameObjects.Image[] = [];
    RECIPES.forEach((recipe, i) => {
      const at = S.card(i, n);
      const card = iconButton(this, L, recipe.card, at.x, at.y, () => {
        if (going) return;
        going = true;
        hint.stop();
        stars(this, card.x, card.y, 14, 70 * L.k);
        if (recipe.id === 'pizza') voice.say('vo-pick-pizza', { queue: false });
        // (If the art is still loading, the recipe starts the moment it is ready.)
        Promise.all([assetsReady(), new Promise((r) => this.time.delayedCall(350, r))]).then(
          () => this.scene.isActive() && this.scene.start('Recipe', { id: recipe.id }),
        );
      }, { hitPad: n === 1 ? 120 : 40 });
      this.tweens.add({ targets: card, alpha: { from: 0, to: 1 }, duration: 400 });
      cards.push(card);
    });
    const hint = screenHint(this, L, () => (going || !cards[0] ? null : { x: cards[0].x, y: cards[0].y }), () => true);
  }
}
