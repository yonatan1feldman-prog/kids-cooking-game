import Phaser from 'phaser';
import { FX_SOFT } from '../core/assets';
import { countKey, voice } from '../core/audio';
import { boing, burst } from '../core/fx';
import { tapMotion, type HandMotion } from '../core/hand';
import { opaqueBounds } from '../core/placeholders';
import { sfx } from '../core/sfx';
import { TUNING } from '../core/tuning';
import { prepSteps, type ChooseOption, type ChooseParams } from '../recipes/types';
import { Step } from './Step';

interface Choice {
  opt: ChooseOption;
  x: number;
  y: number;
  bin: Phaser.GameObjects.Image;
  item: Phaser.GameObjects.Image;
  glow: Phaser.GameObjects.Image;
  itemY: number;
  picked: boolean;
}

/** How high a picked option stays lifted above its bin (world units x k). */
const LIFTED = 22;

/**
 * Choose (reusable: toppings for a pizza, fruit for a salad, sweets for cookies...): the options stand on their bins
 * in the middle of the counter, the pizza waits aside. A tap picks one: it hops and stays a little lifted with a
 * soft glow under it, pop, and Mom says its name ("Tomato!"; `name`, else she counts). A tap on a picked one puts it back (no
 * counting, nothing lost). With `pick` chosen the step goes on by itself after a short pause: the chosen options'
 * prep steps come next, in the order she picked them (`run.insert`), and `run.chosen` tells decorating which
 * toppings she has. There is no wrong choice. Mom's help picks the rest for her, one tap at a time.
 */
export class ChooseStep extends Step<ChooseParams> {
  private choices: Choice[] = [];
  private picks: Choice[] = [];
  private finishing = false;
  private k = 1;

  start() {
    this.stepLine = this.params.line;
    const S = this.ctx.stage;
    this.k = this.layout.k;
    this.workspace('aside');
    const n = this.params.options.length;
    const bs = S.choiceScale(n);
    const b = 240 * bs;
    this.params.options.forEach((opt, i) => {
      const { x, y } = S.choice(i, n);
      const bin = this.own(this.scene.add.image(x, y, this.params.bin).setScale(0).setDepth(2));
      const glow = this.own(this.scene.add.image(x, y, FX_SOFT).setDepth(2.5).setTint(0xffe066).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0));
      glow.setScale((b * 1.35) / glow.frame.realWidth);
      // The item stands on its bin: the bottom of its drawing a little below the bin's middle, its drawing
      // fitted into about one bin (the whole vegetables have wide empty margins, so the fit uses the opaque part).
      const item = this.own(this.scene.add.image(x, y, opt.image).setDepth(3));
      const ob = opaqueBounds(this.scene, opt.image);
      const tw = item.frame.realWidth;
      const th = item.frame.realHeight;
      const ow = ob?.w ?? tw;
      const oh = ob?.h ?? th;
      // Round 11: 0.84 of the bin wide (was 0.98: the pepper and the onion spilled over its rim) and 0.80 high (was 0.74:
      // the can and the jar came out small beside them).
      const s = Math.min((b * 0.84) / ow, (b * 0.8) / oh);
      item.setOrigin((ob?.cx ?? tw / 2) / tw, ((ob?.y ?? 0) + oh) / th);
      const itemY = y + b * 0.22;
      item.setY(itemY).setScale(0).setData('rest', s);
      this.scene.tweens.add({ targets: bin, scale: bs, duration: 400, delay: i * 70, ease: 'Back.easeOut' });
      this.scene.tweens.add({ targets: item, scale: s, duration: 400, delay: 80 + i * 70, ease: 'Back.easeOut' });
      this.choices.push({ opt, x, y, bin, item, glow, itemY, picked: false });
    });
    this.onDown((p) => {
      if (this.finishing) return;
      const c = this.choiceAt(p.worldX, p.worldY);
      if (c) this.toggle(c);
    });
    this.setIdle(true);
  }

  /** The option whose cell holds the point (each cell is its touch area; they never overlap). */
  private choiceAt(x: number, y: number) {
    const h = this.ctx.stage.chooseHalf(this.choices.length);
    return this.choices.find((c) => Math.abs(x - c.x) <= h && Math.abs(y - c.y) <= h);
  }

  private toggle(c: Choice) {
    if (this.finishing) return;
    this.poke();
    this.hit();
    const k = this.k;
    const rest = c.item.getData('rest') as number;
    this.scene.tweens.killTweensOf([c.item, c.glow]);
    c.item.setScale(rest);
    if (c.picked) {
      // Back on its bin: nothing is lost, no counting.
      c.picked = false;
      this.picks = this.picks.filter((q) => q !== c);
      sfx(this.scene, 'whoosh', { volume: 0.35 });
      this.scene.tweens.add({ targets: c.item, y: c.itemY, duration: 260, ease: 'Sine.easeOut' });
      this.scene.tweens.add({ targets: c.glow, alpha: 0, duration: 200 });
      boing(this.scene, c.bin, 0.1);
      return;
    }
    c.picked = true;
    this.picks.push(c);
    sfx(this.scene, 'pop');
    burst(this.scene, c.x, c.itemY - 60 * k, { count: 8, size: 18 * k, tint: [0xffffff, 0xffcb47], speed: 320 * k, gravityY: 400 });
    // A hop, then it stays a little lifted, glowing softly, so she sees what she has chosen.
    this.scene.tweens.add({
      targets: c.item,
      y: c.itemY - 70 * k,
      duration: 170,
      ease: 'Quad.easeOut',
      onComplete: () => this.scene.tweens.add({ targets: c.item, y: c.itemY - LIFTED * k, duration: 260, ease: 'Bounce.easeOut' }),
    });
    this.scene.tweens.add({ targets: c.glow, alpha: 0.75, duration: 200 });
    boing(this.scene, c.bin, 0.12);
    // Mom names it ("Cucumber!"); a newer name cuts the one playing, never another line. Options without a name: she counts.
    if (c.opt.name) voice.say(c.opt.name, { group: 'name', ttlMs: 2500 });
    else voice.say(countKey(this.picks.length), { group: 'count', sequence: true, ttlMs: 5000 });
    if (this.picks.length >= this.params.pick) this.finish();
  }

  /** She has her picks: a short pause to look at them, then her prep steps follow, in the order she picked. */
  private finish() {
    if (this.finishing) return;
    this.finishing = true;
    this.setIdle(false);
    this.hand.stop();
    const run = this.ctx.run;
    run.chosen = this.picks.map((c) => c.opt);
    run.insert = run.chosen.flatMap(prepSteps);
    this.scene.time.delayedCall(this.params.pauseMs, () => {
      this.picks.forEach((c) => boing(this.scene, c.item, 0.15));
      this.scene.time.delayedCall(300, () => this.complete());
    });
  }

  private nextFree() {
    return this.choices.find((c) => !c.picked);
  }

  /** Mom's finger taps an option (nothing is picked by the demo). */
  protected demo(): HandMotion | null {
    const c = this.nextFree();
    if (!c) return null;
    return tapMotion({ x: c.x, y: c.itemY - 60 * this.k }, this.k);
  }

  /** Mom helps: her finger picks the rest, one tap at a time (the first free options). */
  protected autoFinish() {
    const one = () => {
      const c = this.nextFree();
      if (!c || this.finishing) return;
      const at = { x: c.x, y: c.itemY - 60 * this.k };
      this.hand.play({ ...tapMotion(at, this.k), glow: undefined }, { onDone: () => this.scene.time.delayedCall(TUNING.help.pickGapMs, one) });
      // (her finger presses at 600 ms)
      this.scene.time.delayedCall(600, () => !c.picked && this.toggle(c));
    };
    one();
  }
}
