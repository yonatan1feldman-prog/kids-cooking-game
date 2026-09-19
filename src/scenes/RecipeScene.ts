import Phaser from 'phaser';
import { boing, stars } from '../core/fx';
import { HandHint } from '../core/hand';
import { addBackground, art, getLayout, keepLayoutOnResize, ORIENTATION_PAUSE } from '../core/layout';
import { sfx } from '../core/sfx';
import { getStage } from '../core/stage';
import { iconButton } from '../core/ui';
import { getRecipe } from '../recipes';
import type { Recipe } from '../recipes/types';
import { Character } from '../steps/Character';
import { Dish } from '../steps/Dish';
import { createStep } from '../steps/registry';
import type { Step, StepContext } from '../steps/Step';

/**
 * Plays any recipe: runs its steps in order, carrying the dish between them.
 * Progress is shown only in the food itself (no bars or dots). The character stands on
 * the right the whole time, watching, and cheers at the end of every step.
 */
export class RecipeScene extends Phaser.Scene {
  private recipe!: Recipe;
  private step?: Step<unknown>;
  private ctx!: StepContext;

  constructor() {
    super('Recipe');
  }

  init(data: { id?: string }) {
    this.recipe = getRecipe(data.id ?? 'pizza');
    this.step = undefined;
  }

  create() {
    const L = getLayout(this);
    keepLayoutOnResize(this, L);
    addBackground(this, L);
    const S = getStage(L);

    // Home needs a second tap within 2 s (a stray tap only makes it wobble).
    iconButton(this, L, 'btn-home', S.home.x, S.home.y, () => this.goHome(), { confirm: true, scale: S.homeScale, hitPad: 30 }).setDepth(900);

    const dishHome = S.dishHome;
    const board = art(this.add.image(dishHome.x, dishHome.y, this.recipe.board), L).setDepth(-1);
    const dish = new Dish(this, dishHome.x, dishHome.y, L);
    const character = new Character(this, this.recipe.character, S.character, S.charScale);
    character.enter();
    this.ctx = { scene: this, layout: L, stage: S, dish, board, character, hand: new HandHint(this, L), dishHome };

    // The device turned to portrait: drop whatever the finger was holding, gently.
    const onPause = () => this.step?.cancelGesture();
    this.game.events.on(ORIENTATION_PAUSE, onPause);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.game.events.off(ORIENTATION_PAUSE, onPause);
      this.step?.abort();
    });
    this.runStep(devStartStep(this.recipe.steps.length));
  }

  private runStep(i: number) {
    this.step = createStep(this.recipe.steps[i], this.ctx, () => this.stepDone(i));
    this.step.start();
  }

  /** Each finished step gets its own celebration; the last step has the big one itself. */
  private stepDone(i: number) {
    const last = i >= this.recipe.steps.length - 1;
    if (last) {
      this.time.delayedCall(300, () => this.scene.start('Home'));
      return;
    }
    const { dish, layout, character } = this.ctx;
    sfx(this, 'pop');
    stars(this, dish.x, dish.y, 18, 80 * layout.k);
    boing(this, this.ctx.board, 0.06);
    character.cheer();
    this.time.delayedCall(800, () => this.runStep(i + 1));
  }

  private goHome() {
    this.step?.abort();
    this.scene.start('Home');
  }

  update(_time: number, delta: number) {
    this.step?.update(delta);
    // She watches the action: the finger on the screen, else the guiding hand, else the dish.
    const p = this.input.manager.pointers.find((q) => q.isDown);
    const t = p ? { x: p.worldX, y: p.worldY } : (this.ctx.hand.position ?? this.ctx.dish);
    this.ctx.character.lookAt(t.x, t.y);
  }
}

/** Dev only: `?step=N` (0-based) jumps straight to step N for testing. Always 0 in production builds. */
function devStartStep(count: number) {
  if (!import.meta.env.DEV) return 0;
  const n = Number(new URLSearchParams(location.search).get('step'));
  return Number.isInteger(n) && n > 0 && n < count ? n : 0;
}
