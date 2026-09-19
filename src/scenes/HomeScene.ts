import Phaser from 'phaser';
import { albumCount } from '../core/album';
import { voice } from '../core/audio';
import { stars } from '../core/fx';
import { screenHint } from '../core/hand';
import { ALBUM_ICON, makeAlbumTextures } from '../core/placeholders';
import { addBackground, getLayout, keepLayoutOnResize } from '../core/layout';
import { getStage } from '../core/stage';
import { iconButton } from '../core/ui';
import { RECIPES } from '../recipes';
import { Character } from '../steps/Character';
import { Mom } from '../steps/Mom';
import { assetsReady, recipeAssets, releaseRecipe } from './BootScene';

/**
 * Home: one card per recipe (a grid, up to 8 without scrolling), Mom at the counter (and Pipa beside her on phones). Nothing moves by
 * itself here except Mom breathing and blinking: the child picks a card when she wants to, and the
 * game never starts a recipe on its own. Tapping a card starts that recipe ("Let's make a pizza!").
 * Arriving from the title (or by the home button) Mom asks "What shall we make today?"; after a finished
 * recipe the home screen stays quiet (the finale already said goodbye). Idle 5 s: her hand taps the card.
 */
export interface HomeData {
  from?: 'title' | 'recipe' | 'finale' | 'album';
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
    // Back home: the last recipe's art and sounds are released (the recipe scene has already shut down).
    releaseRecipe(this.game);
    let mom: Mom | null = null;
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
      const m = (mom = new Mom(this, S.mom));
      m.box.setAlpha(0);
      this.tweens.add({ targets: m.box, alpha: 1, duration: 300 });
      if (S.pet) new Character(this, RECIPES[0].character, S.pet, S.feedPet).enter(150);
      this.events.on(Phaser.Scenes.Events.UPDATE, () => {
        const p = this.input.manager.pointers.find((q) => q.isDown);
        m.lookAt(p ? p.worldX : L.cx, p ? p.worldY : L.cy);
      });
    });

    const n = RECIPES.length;
    // The memory book takes one more cell in the same grid, and only once there is something in it: never an empty
    // slot waiting to be filled (Child wellbeing rules). The cards get a touch smaller the day it appears.
    const cells = n + (albumCount() > 0 ? 1 : 0);
    const cards: Phaser.GameObjects.Image[] = [];
    RECIPES.forEach((recipe, i) => {
      const at = S.card(i, cells);
      const card = iconButton(this, L, recipe.card, at.x, at.y, () => {
        if (going) return;
        going = true;
        hint.stop();
        stars(this, card.x, card.y, 14, 70 * L.k);
        voice.say(recipe.pickLine, { ttlMs: 3000 });
        // The recipe's own art and sounds load now: Mom waves, a small spinner turns over the card (only if it takes a
        // moment), and the recipe starts the moment they are in.
        mom?.wave();
        const spin = this.time.delayedCall(250, () => loading(card.x, card.y + card.displayHeight * 0.1));
        Promise.all([recipeAssets(this.game, recipe.id), new Promise((r) => this.time.delayedCall(350, r))]).then(() => {
          spin.remove();
          if (this.scene.isActive()) this.scene.start('Recipe', { id: recipe.id });
        });
      }, { hitPad: cells === 1 ? 120 : 30, scale: S.cardScale(cells) });
      this.tweens.add({ targets: card, alpha: { from: 0, to: 1 }, duration: 400 });
      cards.push(card);
    });
    if (cells > n) {
      // The album button: no text, the same size as a card, its picture drawn in code (a little stack of photos).
      makeAlbumTextures(this.game);
      const at = S.card(n, cells);
      const btn = iconButton(this, L, ALBUM_ICON, at.x, at.y, () => {
        if (going) return;
        going = true;
        hint.stop();
        this.scene.start('Album');
      }, { hitPad: 30, scale: S.cardScale(cells) });
      this.tweens.add({ targets: btn, alpha: { from: 0, to: 1 }, duration: 400 });
    }

    /** The loading spinner (the one thing allowed to turn by itself): a short orange arc on a cream disc. */
    const loading = (x: number, y: number) => {
      const r = 46 * L.k;
      this.add.circle(x, y, r * 1.5, 0xfff6e6, 0.92).setDepth(50);
      const arc = this.add.arc(x, y, r, 0, 270, false).setStrokeStyle(12 * L.k, 0xff8c42).setClosePath(false).setDepth(51);
      this.tweens.add({ targets: arc, angle: 360, duration: 900, repeat: -1 });
    };
    const hint = screenHint(this, L, () => (going || !cards[0] ? null : { x: cards[0].x, y: cards[0].y }), () => true);
  }
}
