import Phaser from 'phaser';
import { voice } from '../core/audio';
import { boing, stars } from '../core/fx';
import { MomHandView } from '../core/hand';
import { addBackground, art, getLayout, keepLayoutOnResize, ORIENTATION_PAUSE } from '../core/layout';
import { sfx } from '../core/sfx';
import { getStage } from '../core/stage';
import { iconButton } from '../core/ui';
import { getRecipe } from '../recipes';
import type { Recipe } from '../recipes/types';
import { Character } from '../steps/Character';
import { Dish } from '../steps/Dish';
import { Mom } from '../steps/Mom';
import { createStep } from '../steps/registry';
import type { Step, StepContext } from '../steps/Step';

/** Mom shows each step by herself only the first times a recipe is played. */
const DEMO_RUNS = 2;

/**
 * How many times each recipe has been started, on this device only (localStorage, nothing is sent anywhere).
 * Returns the count before this start, and stores the new one. Private mode or blocked storage: 0 (demos on).
 */
function countRun(id: string) {
  const key = `cooking.runs.${id}`;
  try {
    const n = Number(localStorage.getItem(key)) || 0;
    localStorage.setItem(key, String(n + 1));
    return n;
  } catch {
    return 0;
  }
}

/**
 * Plays any recipe: runs its steps in order, carrying the dish between them.
 * Progress is shown only in the food itself (no bars or dots). Mom stands at the counter on the right
 * the whole time: she shows each step (the first two times), talks, watches, and is happy at the end of
 * every step. Pipa the hedgehog sits beside her (on phones) and tastes the pizza at the end.
 */
export class RecipeScene extends Phaser.Scene {
  private recipe!: Recipe;
  private step?: Step<unknown>;
  private ctx!: StepContext;
  private withDemos = true;

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
    this.withDemos = countRun(this.recipe.id) < DEMO_RUNS;

    // Home needs a second tap within 2 s (a stray tap only makes it wobble).
    iconButton(this, L, 'btn-home', S.home.x, S.home.y, () => this.goHome(), { confirm: true, scale: S.homeScale, hitPad: 30 }).setDepth(900);

    const dishHome = S.dishHome;
    const board = art(this.add.image(dishHome.x, dishHome.y, this.recipe.board), L).setDepth(-1);
    const dish = new Dish(this, dishHome.x, dishHome.y, L);
    const mom = new Mom(this, S.mom);
    const character = new Character(this, this.recipe.character, S.pet, S.feedPet);
    if (S.pet) character.enter(300);
    this.ctx = { scene: this, layout: L, stage: S, dish, board, mom, character, hand: new MomHandView(this, L), dishHome };

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
    this.step.intro(this.withDemos);
  }

  /** Each finished step: Mom praises the effort and is happy, Pipa hops; the last step has its own finale. */
  private stepDone(i: number) {
    const last = i >= this.recipe.steps.length - 1;
    if (last) {
      this.scene.start('Home');
      return;
    }
    const { dish, layout, mom, character } = this.ctx;
    sfx(this, 'pop');
    stars(this, dish.x, dish.y, 18, 80 * layout.k);
    boing(this, this.ctx.board, 0.06);
    voice.praise({ queue: false });
    mom.cheer();
    character.cheer();
    this.time.delayedCall(800, () => this.runStep(i + 1));
  }

  private goHome() {
    this.step?.abort();
    voice.stop();
    this.scene.start('Home');
  }

  update(_time: number, delta: number) {
    this.step?.update(delta);
    // They watch the action: the finger on the screen, else Mom's demo hand, else the dish.
    const p = this.input.manager.pointers.find((q) => q.isDown);
    const t = p ? { x: p.worldX, y: p.worldY } : (this.ctx.hand.position ?? this.ctx.dish);
    this.ctx.mom.lookAt(t.x, t.y);
    this.ctx.character.lookAt(t.x, t.y);
  }
}

/** Dev only: `?step=N` (0-based) jumps straight to step N for testing. Always 0 in production builds. */
function devStartStep(count: number) {
  if (!import.meta.env.DEV) return 0;
  const n = Number(new URLSearchParams(location.search).get('step'));
  return Number.isInteger(n) && n > 0 && n < count ? n : 0;
}
