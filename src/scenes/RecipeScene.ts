import Phaser from 'phaser';
import { boing, stars } from '../core/fx';
import { HandHint } from '../core/hand';
import { addBackground, art, getLayout, keepLayoutOnResize } from '../core/layout';
import { sfx } from '../core/sfx';
import { getStage } from '../core/stage';
import { iconButton } from '../core/ui';
import { getRecipe } from '../recipes';
import type { Recipe } from '../recipes/types';
import { Dish } from '../steps/Dish';
import { createStep } from '../steps/registry';
import type { Step, StepContext } from '../steps/Step';

/**
 * Plays any recipe: runs its steps in order, carrying the dish between them.
 * Progress is shown only in the food itself (no bars or dots).
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
    const home = S.home;
    iconButton(this, L, 'btn-home', home.x, home.y, () => this.goHome()).setDepth(900);

    const dishHome = S.dishHome;
    const board = art(this.add.image(dishHome.x, dishHome.y, this.recipe.board), L).setDepth(-1);
    const dish = new Dish(this, dishHome.x, dishHome.y, L);
    this.ctx = { scene: this, layout: L, stage: S, dish, board, hand: new HandHint(this, L), dishHome };

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.step?.abort());
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
    const { dish, layout } = this.ctx;
    sfx(this, 'pop');
    stars(this, dish.x, dish.y, 18, 80 * layout.k);
    boing(this, this.ctx.board, 0.06);
    this.time.delayedCall(800, () => this.runStep(i + 1));
  }

  private goHome() {
    this.step?.abort();
    this.scene.start('Home');
  }

  update(_time: number, delta: number) {
    this.step?.update(delta);
  }
}

/** Dev only: `?step=N` (0-based) jumps straight to step N for testing. Always 0 in production builds. */
function devStartStep(count: number) {
  if (!import.meta.env.DEV) return 0;
  const n = Number(new URLSearchParams(location.search).get('step'));
  return Number.isInteger(n) && n > 0 && n < count ? n : 0;
}
