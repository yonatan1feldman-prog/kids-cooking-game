import Phaser from 'phaser';
import { voice } from '../core/audio';
import { boing, stars } from '../core/fx';
import { MomHandView } from '../core/hand';
import { confetti, tickles, touchRipples } from '../core/juice';
import { addBackground, art, getLayout, keepLayoutOnResize, ORIENTATION_PAUSE } from '../core/layout';
import { sfx } from '../core/sfx';
import { liveKitchen } from '../core/kitchen';
import { getStage } from '../core/stage';
import { iconButton } from '../core/ui';
import { getRecipe } from '../recipes';
import { prepSteps, type ChooseParams, type Recipe, type StepDef } from '../recipes/types';
import { Character } from '../steps/Character';
import { Dish } from '../steps/Dish';
import { Mom } from '../steps/Mom';
import { createStep } from '../steps/registry';
import { recipeAssets, recipeLoaded } from './BootScene';
import type { Step, StepContext } from '../steps/Step';

/** Mom shows each step by herself only the first time a recipe is played (two times before the gameplay round). */
const DEMO_RUNS = 1;

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
  /**
   * The steps of this run: the recipe's, plus what a choose step inserts right after itself (the chosen toppings'
   * prep steps, in the order she picked them).
   */
  private steps: StepDef[] = [];
  /** The step running now (its recipe entry), for the test harness. */
  stepDef?: StepDef;
  private step?: Step<unknown>;
  private ctx!: StepContext;
  /** False while the recipe's art is still loading (nothing is built yet). */
  private built = false;
  private withDemos = true;

  constructor() {
    super('Recipe');
  }

  init(data: { id?: string }) {
    this.recipe = getRecipe(data.id ?? 'pizza');
    this.steps = [...this.recipe.steps];
    this.step = undefined;
    this.stepDef = undefined;
    this.built = false;
  }

  create() {
    const L = getLayout(this);
    keepLayoutOnResize(this, L);
    const bg = addBackground(this, L, this.recipe.id);
    const S = getStage(L);
    // Started without its art (a dev link, the test harness): load it first, then start over.
    if (!recipeLoaded(this.recipe.id)) {
      const id = this.recipe.id;
      recipeAssets(this.game, id).then(() => this.scene.isActive() && this.scene.restart({ id }));
      return;
    }
    const runNo = countRun(this.recipe.id);
    this.withDemos = runNo < DEMO_RUNS;

    // Home needs a second tap within 2 s (a stray tap only makes it wobble).
    iconButton(this, L, 'btn-home', S.home.x, S.home.y, () => this.goHome(), { confirm: true, scale: S.homeScale, hitPad: 30 }).setDepth(900);

    const dishHome = S.dishHome;
    // (a recipe without a board, the salad, keeps an invisible one: the steps may still move it around)
    const board = art(this.add.image(dishHome.x, dishHome.y, this.recipe.board ?? '__DEFAULT'), L).setDepth(-1).setVisible(!!this.recipe.board);
    const dish = new Dish(this, dishHome.x, dishHome.y, L);
    const mom = new Mom(this, S.mom);
    const character = new Character(this, this.recipe.character, S.pet, S.feedPet);
    if (S.pet) character.enter(300);
    this.ctx = { scene: this, layout: L, stage: S, dish, board, mom, character, hand: new MomHandView(this, L), dishHome, recipeId: this.recipe.id, run: { demoTalkDone: false, handoff: new Map(), chosen: [], insert: [], once: new Set(), runNo, wishes: [] } };
    // Round 11: while her demo hand shows, her own pointing arm reaches down to the counter (the hand is hers).
    mom.followHand(() => this.ctx.hand.active);

    // The device turned to portrait: drop whatever the finger was holding, gently.
    const onPause = () => this.step?.cancelGesture();
    this.game.events.on(ORIENTATION_PAUSE, onPause);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.game.events.off(ORIENTATION_PAUSE, onPause);
      this.step?.abort();
    });
    // The kitchen answers her taps (a jar hops, a pot swings): never a miss, never progress.
    liveKitchen(this, bg.getData('kitchen') ?? [], bg.getData('scenery') ?? []);
    // The polish round: a paper ring answers every touch; Mom and Pipa answer a tap on them (not while she feeds them).
    touchRipples(this, L);
    tickles(this, () => [mom, S.pet ? character : null], () => this.stepDef?.type !== 'share' && this.stepDef?.type !== 'feed');
    this.built = true;
    this.runStep(this.devStart());
  }

  /**
   * Dev only: `?step=N` (0-based) jumps straight to step N; past a choose step, `?pick=tomato,corn,olive` says what
   * was chosen (default: its first options), so any combination of toppings can be tested. 0 in production builds.
   */
  private devStart() {
    if (!import.meta.env.DEV) return 0;
    const q = new URLSearchParams(location.search);
    const n = Number(q.get('step'));
    if (!Number.isInteger(n) || n <= 0) return 0;
    const ci = this.steps.findIndex((s) => s.type === 'choose');
    if (ci >= 0 && n > ci) {
      const cp = this.steps[ci].params as ChooseParams;
      const ids = q.get('pick')?.split(',') ?? cp.options.slice(0, cp.pick).map((o) => o.id);
      this.ctx.run.chosen = ids.map((id) => cp.options.find((o) => o.id === id)).filter((o) => !!o);
      this.steps.splice(ci + 1, 0, ...this.ctx.run.chosen.flatMap(prepSteps));
    }
    return n < this.steps.length ? n : 0;
  }

  private runStep(i: number) {
    this.stepDef = this.steps[i];
    this.step = createStep(this.steps[i], this.ctx, () => this.stepDone(i));
    this.step.start();
    this.step.intro(this.withDemos);
  }

  /** Each finished step: Mom praises the effort and is happy, Pipa hops; the last step has its own finale. */
  private stepDone(i: number) {
    // A choose step's picks: their prep steps come right after it.
    const ins = this.ctx.run.insert.splice(0);
    if (ins.length) this.steps.splice(i + 1, 0, ...ins);
    const last = i >= this.steps.length - 1;
    if (last) {
      this.scene.start('Home', { from: 'finale' });
      return;
    }
    const { dish, layout, mom, character } = this.ctx;
    sfx(this, 'pop');
    stars(this, dish.x, dish.y, 10, 80 * layout.k);
    confetti(this, dish.x, dish.y, 22, 48 * layout.k);
    boing(this, this.ctx.board, 0.06);
    voice.praise({ ttlMs: 3000 });
    mom.cheer();
    character.cheer();
    this.time.delayedCall(800, () => this.runStep(i + 1));
  }

  private goHome() {
    this.step?.abort();
    voice.stop();
    this.scene.start('Home', { from: 'recipe' });
  }

  update(_time: number, delta: number) {
    if (!this.built) return;
    this.step?.update(delta);
    // They watch the action: the finger on the screen, else Mom's demo hand, else the dish.
    const p = this.input.manager.pointers.find((q) => q.isDown);
    const t = p ? { x: p.worldX, y: p.worldY } : (this.ctx.hand.position ?? this.ctx.dish);
    this.ctx.mom.lookAt(t.x, t.y);
    this.ctx.character.lookAt(t.x, t.y);
  }
}
