import Phaser from 'phaser';
import { boing, stars } from '../core/fx';
import { HandHint } from '../core/hand';
import { addBackground, fit, getLayout, keepLayoutOnResize } from '../core/layout';
import { sfx } from '../core/sfx';
import { iconButton } from '../core/ui';
import { getRecipe } from '../recipes';
import type { Recipe } from '../recipes/types';
import { Dish } from '../steps/Dish';
import { createStep } from '../steps/registry';
import type { Step, StepContext } from '../steps/Step';

/** Plays any recipe: runs its steps in order, carrying the dish between them. */
export class RecipeScene extends Phaser.Scene {
  private recipe!: Recipe;
  private step?: Step<unknown>;
  private ctx!: StepContext;
  private progress: Phaser.GameObjects.Image[] = [];

  constructor() {
    super('Recipe');
  }

  init(data: { id?: string }) {
    this.recipe = getRecipe(data.id ?? 'pizza');
    this.step = undefined;
    this.progress = [];
  }

  create() {
    const L = getLayout(this);
    keepLayoutOnResize(this, L);
    addBackground(this, L);

    const topY = Math.max(L.H * 0.055, L.u * 0.08);
    iconButton(this, 'btn-home', L.u * 0.1, topY, L.u * 0.13, () => this.goHome()).setDepth(900);

    // Progress: one star per step, grey until done. Icons only.
    const n = this.recipe.steps.length;
    const s = L.u * 0.065;
    for (let i = 0; i < n; i++) {
      const star = this.add.image(L.cx + (i - (n - 1) / 2) * s * 1.35, topY, 'star').setDepth(900);
      fit(star, s);
      star.setTint(0x9a9a9a).setAlpha(0.55);
      this.progress.push(star);
    }

    const dishHome = { x: L.cx, y: L.H * 0.52 };
    const dish = new Dish(this, dishHome.x, dishHome.y, L.u * 0.34);
    this.ctx = { scene: this, layout: L, dish, hand: new HandHint(this, L), dishHome };

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.step?.abort());
    this.runStep(0);
  }

  private runStep(i: number) {
    this.step = createStep(this.recipe.steps[i], this.ctx, () => this.stepDone(i));
    this.step.start();
  }

  private stepDone(i: number) {
    const star = this.progress[i];
    if (star) {
      star.clearTint().setAlpha(1);
      boing(this, star, 0.4);
    }
    const last = i >= this.recipe.steps.length - 1;
    if (last) {
      this.time.delayedCall(300, () => this.scene.start('Home'));
      return;
    }
    sfx(this, 'pop');
    stars(this, this.ctx.dish.x, this.ctx.dish.y, 10, this.ctx.layout.u * 0.06);
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
