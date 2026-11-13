import Phaser from 'phaser';
import { FX_TORN, makeFxTextures } from './placeholders';
import { sfx } from './sfx';

/**
 * The premium round's scene change (research/premium-spec.md 4.2): a gesture instead of a cut. What she tapped (a card,
 * a door) grows a little toward the middle, a sheet of cream paper with a torn edge slides up over the screen with a
 * soft whoosh, the next scene starts under it, and the sheet slides on up and away (the next scene is already drawn
 * under it). The home button: the same sheet the other way (down). About 0.7 s in all.
 *
 * It all lives in its own scene on top (`Transition`, added on first use), so the scenes themselves only call `go()`.
 * A rotation to portrait mid-way pauses it with everything else (core/orientation.ts) and it goes on after the turn back,
 * so the next scene is always made in landscape; a 2 s guard after the swap means the sheet can never stay on the
 * screen. Only tweens on a Graphics rectangle and one small texture (`fx-torn`, drawn in code), no filters.
 */

export const TRANSITION = 'Transition';
export const TIMING = { grow: 300, cover: 380, uncover: 320, growBy: 1.15 } as const;

const CREAM = 0xfbf0da;

type From = Phaser.GameObjects.GameObject & Phaser.GameObjects.Components.Transform;

interface Job {
  from: Phaser.Scene;
  key: string;
  data?: object;
  dir: 'up' | 'down';
}

class TransitionScene extends Phaser.Scene {
  private job?: Job;
  private sheet?: Phaser.GameObjects.Container;
  private started = false;
  private leaving = false;
  private paper?: Phaser.GameObjects.Graphics;
  private H = 0;
  private edge = 0;

  constructor() {
    super({ key: TRANSITION, active: false });
  }

  init(job: Job) {
    // (Phaser reuses the scene object: every run starts clean)
    this.job = job;
    this.started = false;
    this.leaving = false;
    this.sheet = undefined;
  }

  create() {
    const job = this.job!;
    const { width: W, height: H } = this.scale;
    makeFxTextures(this.game);
    this.H = H;
    // the sheet: the paper itself, a torn edge on the side that leads and one on the side that trails
    const edge = Math.round(H * 0.07);
    this.edge = edge;
    const paper = this.add.graphics().fillStyle(CREAM, 1).fillRect(0, 0, W, H);
    const lead = this.add.image(0, 0, FX_TORN).setOrigin(0, 1).setDisplaySize(W, edge);
    const trail = this.add.image(0, H, FX_TORN).setOrigin(0, 1).setDisplaySize(W, edge).setFlipY(true);
    // (the trail's tear points down: its origin is its top once flipped)
    trail.setOrigin(0, 0);
    this.sheet = this.add.container(0, 0, [paper, lead, trail]).setDepth(10000);
    this.paper = paper;
    const up = job.dir === 'up';
    // up: it comes from below (its torn top edge leading), down: from above
    this.sheet.y = up ? H + edge : -H - edge;
    // A tap on the sheet while it covers does nothing (and doesn't reach the scene under it).
    paper.setInteractive(new Phaser.Geom.Rectangle(0, 0, W, H), Phaser.Geom.Rectangle.Contains);
    sfx(this, 'whoosh-soft', { pitch: 'vary', volume: 0.8 });
    this.tweens.add({ targets: this.sheet, y: 0, duration: TIMING.cover, ease: 'Quad.easeInOut', onComplete: () => this.swap() });
    // (a rotation to portrait meanwhile pauses this scene with all the others, core/orientation.ts: the page waits under
    // the rotate screen and goes on when she turns back, so the next scene is always made in landscape. Ending it at
    // once used to start the next scene while the screen was upright: the scenes that keep their layout, the recipes
    // and every game, were then laid out for portrait and shown small after the turn back.)
  }

  /** Covered: the next scene starts under the sheet; once it has drawn its first frame the sheet slides away. */
  private swap() {
    const job = this.job!;
    if (this.started) return;
    this.started = true;
    const next = this.game.scene.getScene(job.key);
    next?.events.once(Phaser.Scenes.Events.CREATE, () => {
      this.scene.bringToTop();
      // one frame later, so the new scene is on the screen under the sheet before it moves
      this.time.delayedCall(16, () => this.uncover());
    });
    if (job.from.scene.isActive() || job.from.scene.isPaused()) job.from.scene.start(job.key, job.data);
    else this.game.scene.start(job.key, job.data);
    this.scene.bringToTop();
    // (in case the next scene never says it was created: the sheet never stays)
    this.time.delayedCall(2000, () => this.uncover());
  }

  private uncover() {
    if (!this.sheet || this.leaving) return;
    this.leaving = true;
    // (the new scene answers her as soon as the sheet starts to go)
    this.paper?.disableInteractive();
    const up = this.job!.dir === 'up';
    this.tweens.add({
      targets: this.sheet,
      y: up ? -this.H - this.edge : this.H + this.edge,
      duration: TIMING.uncover,
      ease: 'Quad.easeInOut',
      onComplete: () => this.scene.stop(),
    });
  }
}

/** True while a scene change is under way (a second tap meanwhile is ignored by `go`). */
export function changing(game: Phaser.Game) {
  return game.scene.isActive(TRANSITION);
}

/**
 * Leaves `from` for the scene `key` (with `data`) through the paper page. `opts.from`: the thing she tapped, which grows
 * toward the middle of the screen meanwhile; `opts.dir`: 'down' for going back (the home button), 'up' otherwise.
 * A second call while one is under way is ignored.
 */
export function go(from: Phaser.Scene, key: string, data?: object, opts: { from?: From; dir?: 'up' | 'down' } = {}) {
  const game = from.game;
  if (changing(game)) return;
  if (!game.scene.getScene(TRANSITION)) game.scene.add(TRANSITION, TransitionScene, false);
  const t = opts.from;
  if (t?.active) {
    const { width: W, height: H } = from.scale;
    from.tweens.add({
      targets: t,
      x: t.x + (W / 2 - t.x) * 0.25,
      y: t.y + (H / 2 - t.y) * 0.25,
      scaleX: t.scaleX * TIMING.growBy,
      scaleY: t.scaleY * TIMING.growBy,
      duration: TIMING.grow,
      ease: 'Quad.easeOut',
    });
  }
  const job: Job = { from, key, data, dir: opts.dir ?? 'up' };
  game.scene.run(TRANSITION, job as unknown as object);
  game.scene.bringToTop(TRANSITION);
}
