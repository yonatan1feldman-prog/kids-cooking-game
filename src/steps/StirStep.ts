import Phaser from 'phaser';
import { ART, IMAGES } from '../core/assets';
import { bakeLoop, voice } from '../core/audio';
import { boing, burst, puff } from '../core/fx';
import { tapMotion } from '../core/hand';
import type { HandMotion } from '../core/hand';
import { sfx } from '../core/sfx';
import { TUNING } from '../core/tuning';
import type { StirParams } from '../recipes/types';
import { BOWL_DEPTH, PrepBowl } from './PrepBowl';
import { Step } from './Step';

/** Mom's spoon hand is shown bigger here, in proportion to the big bowl. */
const STIR_HAND = 1.35;

/**
 * Stirring: the spoon follows the finger, its bowl kept inside the bowl's opening, and every movement in
 * the bowl stirs: no circles needed, any wiggle counts. The contents turn smoothly from `from` into `to`
 * as the stirring adds up (TUNING.stir.distance). At the end the bowl moves to the left column and turns
 * into the next step's bowl (`handoffAs`), while the pizza comes back to the middle. With `keep` the bowl stays in
 * place with the result in it (the mixed salad); `toolAnchor` and `sound` fit another tool (the salad servers).
 */
export class StirStep extends Step<StirParams> {
  private bowl!: PrepBowl;
  private done!: Phaser.GameObjects.Image;
  private spoon!: Phaser.GameObjects.Image;
  private rest = { x: 0, y: 0, angle: 28 };
  private stirring = false;
  private last = { x: 0, y: 0 };
  private progress = 0;
  private sinceFx = 0;
  private finishing = false;
  private k = 1;
  /** With a stove (the soup): 'knob' until she lights it, then 'stir'. Without one it is 'stir' from the start. */
  private phase: 'knob' | 'stir' = 'stir';
  private knob?: Phaser.GameObjects.Image;
  private flame?: Phaser.GameObjects.Image;
  /** Stir with the arrow (gameplay round 4): 1 = clockwise, -1 = the other way; the arrows drawn in the bowl. */
  private dir = 1;
  private arrows?: Phaser.GameObjects.Graphics;
  private flipped = false;
  private wrongRun = 0;
  private wobbled = false;

  start() {
    this.stepLine = this.params.stove ? this.params.stove.line : this.params.line;
    if (this.params.arrow && !this.params.stove) this.moreLines = [this.params.arrow.line];
    this.k = this.layout.k;
    this.workspace('aside');
    this.bowl = PrepBowl.take(this.ctx) ?? new PrepBowl(this.ctx, this.params.bowl, this.params.from);
    this.bowl.setContents(this.params.from);
    const c = this.bowl.contents;
    this.done = this.own(this.scene.add.image(c.x, c.y, this.params.to).setScale(this.bowl.scale).setDepth(BOWL_DEPTH.contents + 0.02).setAlpha(0));

    // The spoon rests in the bowl, leaning on the right rim (the art agent's mash scene).
    const s = this.bowl.scale;
    const p = this.bowl.position;
    const anchor = this.params.toolAnchor;
    if (anchor) {
      // Another tool (the salad servers): resting in the bowl on the right of its opening, the heads sunk in.
      const o = this.bowl.opening();
      this.rest = { x: o.x + o.rx * 0.45, y: o.y - o.ry * 0.2, angle: 14 };
    } else this.rest = { x: p.x + 250 * s, y: p.y - 20 * s, angle: 28 };
    const [w, h] = IMAGES[this.params.tool].size;
    const at = anchor ?? ART.prep.spoonBowl;
    this.spoon = this.own(this.scene.add.image(this.rest.x, this.rest.y, this.params.tool).setDepth(BOWL_DEPTH.tool));
    // (the servers at the bowl's own scale, as in the art agent's mix scene; the spoon at 0.8)
    this.spoon.setOrigin(at.x / w, at.y / h).setScale(anchor ? s : 0.8 * this.k).setAngle(this.rest.angle).setAlpha(0);
    this.scene.tweens.add({ targets: this.spoon, alpha: 1, duration: 300 });

    // The soup: the stove under the pot must be lit before there is anything to stir.
    if (this.params.stove) {
      this.phase = 'knob';
      const st = this.params.stove;
      const at = this.bowl.point(st.knobAt.x, st.knobAt.y);
      this.knob = this.own(this.scene.add.image(at.x, at.y, st.knobOff).setScale(this.bowl.scale).setDepth(BOWL_DEPTH.back - 0.05));
      this.spoon.setVisible(false);
    }

    if (this.params.arrow) {
      this.arrows = this.own(this.scene.add.graphics().setDepth(BOWL_DEPTH.contents + 0.05).setAlpha(0));
      this.drawArrows();
      if (this.phase === 'stir') this.scene.tweens.add({ targets: this.arrows, alpha: 1, duration: 400, delay: 300 });
    }

    this.onDown((q) => {
      if (this.finishing) return;
      if (this.phase === 'knob') {
        if (this.onKnob(q.worldX, q.worldY)) this.lightStove();
        else this.miss();
        return;
      }
      const onSpoon = this.spoon.getBounds().contains(q.worldX, q.worldY);
      if (this.bowl.reach(q.worldX, q.worldY) > 1.8 && !onSpoon) return;
      this.stirring = true;
      this.wrongRun = 0;
      this.wobbled = false;
      const at = this.spoonAt(q.worldX, q.worldY);
      this.last = at;
      this.moveSpoon(at);
      sfx(this.scene, this.sound, { minGapMs: 150, volume: 0.6 });
      this.drops(at.x, at.y, 4);
    });
    this.onMove((q) => {
      if (!this.stirring || this.finishing || this.phase === 'knob') return;
      const at = this.spoonAt(q.worldX, q.worldY);
      const prev = this.last;
      const d = Phaser.Math.Distance.Between(prev.x, prev.y, at.x, at.y);
      this.last = at;
      this.moveSpoon(at);
      if (this.bowl.reach(q.worldX, q.worldY) > 2.2) return;
      if (this.params.arrow) return this.stirAround(prev, at);
      this.stir(d, at.x, at.y);
    });
    this.onUp(() => {
      if (!this.stirring) return;
      this.stirring = false;
      if (!this.finishing) this.restSpoon();
    });
    this.setIdle(true);
  }

  /** The knob's touch area: its drawing plus a generous margin (small fingers aim at the middle of a thing). */
  private onKnob(x: number, y: number) {
    if (!this.knob) return false;
    const b = this.knob.getBounds();
    const pad = 60 * this.k;
    return x > b.x - pad && x < b.right + pad && y > b.y - pad && y < b.bottom + pad;
  }

  /** A tap on the knob: it turns, the flame comes up under the pot, the bake loop starts, and stirring begins. */
  private lightStove() {
    const st = this.params.stove;
    if (!st || this.phase !== 'knob') return;
    this.phase = 'stir';
    this.poke();
    this.hand.stop();
    sfx(this.scene, 'click');
    this.knob?.setTexture(st.knobOn);
    if (this.knob) boing(this.scene, this.knob, 0.12);
    const f = this.bowl.point(st.flameAt.x, st.flameAt.y);
    this.flame = this.own(this.scene.add.image(f.x, f.y, st.flame).setScale(this.bowl.scale).setDepth(BOWL_DEPTH.back - 0.04).setAlpha(0));
    this.scene.tweens.add({ targets: this.flame, alpha: 1, duration: 350 });
    if (this.params.cook) bakeLoop.start();
    this.spoon.setVisible(true).setAlpha(0);
    this.scene.tweens.add({ targets: this.spoon, alpha: 1, duration: 300, delay: 200 });
    voice.say(this.params.line, { ttlMs: 6000, valid: () => !this.aborted });
    if (this.params.arrow) {
      voice.say(this.params.arrow.line, { ttlMs: 8000, valid: () => !this.aborted });
      if (this.arrows) this.scene.tweens.add({ targets: this.arrows, alpha: 1, duration: 400, delay: 300 });
    }
  }

  /** The spoon's bowl goes where the finger is, kept inside the opening. */
  private get sound() {
    return this.params.sound ?? 'squish';
  }

  private spoonAt(x: number, y: number) {
    return this.bowl.clampToOpening(x, y, 0.85);
  }

  private moveSpoon(at: { x: number; y: number }) {
    this.scene.tweens.killTweensOf(this.spoon);
    const o = this.bowl.opening();
    this.spoon.setPosition(at.x, at.y).setAngle(12 + ((at.x - o.x) / o.rx) * 18);
  }

  private restSpoon() {
    this.scene.tweens.add({ targets: this.spoon, x: this.rest.x, y: this.rest.y, angle: this.rest.angle, duration: 300, ease: 'Sine.easeOut' });
  }

  private drops(x: number, y: number, n: number) {
    burst(this.scene, x, y, { tint: this.params.splash, count: n, size: 16 * this.k, speed: 260 * this.k, gravityY: 900, lifespan: 450, depth: BOWL_DEPTH.front + 0.1 });
  }

  private stir(d: number, x: number, y: number) {
    if (d <= 0) return;
    this.poke();
    this.progress = Math.min(1, this.progress + d / (this.params.distance * this.k));
    this.render();
    this.sinceFx += d;
    if (this.sinceFx > 110 * this.k) {
      this.sinceFx = 0;
      sfx(this.scene, this.sound, { minGapMs: 180, volume: 0.45 });
      this.drops(x, y, 2);
      // The soup answers her stirring with a little steam (it never rises by itself).
      if (this.params.cook) {
        const o = this.bowl.opening();
        puff(this.scene, o.x + (Math.random() - 0.5) * o.rx, o.y - o.ry * 0.4, 0xffffff, 3, 90 * this.k).setDepth(BOWL_DEPTH.front + 0.2);
      }
    }
    if (this.params.arrow && !this.flipped && this.progress >= TUNING.stirArrow.flipAt) this.flipArrows();
    if (this.progress >= 1) this.finish();
  }

  /**
   * Stir with the arrow: only the way round the arrows point counts (the arc travelled round the bowl's middle, that
   * way). The other way round stirs nothing: after a little of it the contents give a small wobble (a miss). Half-way
   * the arrows turn round: "Now stir the other way!".
   */
  private stirAround(prev: { x: number; y: number }, at: { x: number; y: number }) {
    const o = this.bowl.opening();
    const a0 = Math.atan2((prev.y - o.y) / o.ry, (prev.x - o.x) / o.rx);
    const a1 = Math.atan2((at.y - o.y) / o.ry, (at.x - o.x) / o.rx);
    const along = Phaser.Math.Angle.Wrap(a1 - a0) * this.dir;
    const rho = Math.max(Math.hypot(at.x - o.x, at.y - o.y), o.ry * 0.25);
    if (along > 0) return this.stir(along * rho, at.x, at.y);
    this.wrongRun -= along * rho;
    if (!this.wobbled && this.wrongRun >= TUNING.stirArrow.wobbleAfter * this.k) {
      this.wobbled = true;
      this.miss();
      this.scene.tweens.add({ targets: [this.bowl.contents, this.done], angle: { from: -3, to: 3 }, duration: 80, yoyo: true, repeat: 1, onComplete: () => this.render() });
    }
  }

  /** Three curved arrows round the inside of the bowl, pointing the way to stir (`dir`). */
  private drawArrows() {
    const g = this.arrows;
    if (!g) return;
    g.clear();
    const o = this.bowl.opening();
    const rx = o.rx * 0.68;
    const ry = o.ry * 0.68;
    const k = this.k;
    const pt = (a: number) => ({ x: o.x + Math.cos(a) * rx, y: o.y + Math.sin(a) * ry });
    for (let i = 0; i < 3; i++) {
      const a0 = (i * Math.PI * 2) / 3 + 0.3;
      const span = 1.35;
      const pts: { x: number; y: number }[] = [];
      for (let j = 0; j <= 16; j++) pts.push(pt(a0 + (this.dir > 0 ? j : 16 - j) * (span / 16)));
      for (const [w, c, al] of [[17 * k, 0xffffff, 0.95], [9 * k, 0xe8743a, 1]] as const) {
        g.lineStyle(w, c, al).beginPath().moveTo(pts[0].x, pts[0].y);
        for (const p of pts) g.lineTo(p.x, p.y);
        g.strokePath();
        // the head at the end, along the curve
        const e = pts[pts.length - 1];
        const b = pts[pts.length - 3];
        const len = Math.hypot(e.x - b.x, e.y - b.y) || 1;
        const ux = (e.x - b.x) / len;
        const uy = (e.y - b.y) / len;
        const h = 30 * k;
        g.beginPath().moveTo(e.x - ux * h - uy * h * 0.75, e.y - uy * h + ux * h * 0.75).lineTo(e.x + ux * 4 * k, e.y + uy * 4 * k);
        g.lineTo(e.x - ux * h + uy * h * 0.75, e.y - uy * h - ux * h * 0.75).strokePath();
      }
    }
  }

  /** Half-way: the arrows turn round, and Mom says so. */
  private flipArrows() {
    if (this.flipped || !this.params.arrow) return;
    this.flipped = true;
    this.dir = -this.dir;
    this.wrongRun = 0;
    this.wobbled = true;
    this.drawArrows();
    if (this.arrows) {
      this.arrows.setAlpha(0);
      this.scene.tweens.add({ targets: this.arrows, alpha: 1, duration: 350 });
    }
    sfx(this.scene, 'whoosh', { volume: 0.5 });
    voice.say(this.params.arrow.flipLine, { ttlMs: 4000, valid: () => !this.aborted });
  }

  /** The smooth sauce shows through more and more; the contents sway a little with the spoon. */
  private render() {
    const via = this.params.via;
    if (via?.length) {
      // Through the stages one after another: each fades into the next; what lies on it mixes in during the first.
      const stages = [this.params.from, ...via, this.params.to];
      const t = this.progress * (stages.length - 1);
      const i = Math.min(stages.length - 2, Math.floor(t));
      this.bowl.setContents(stages[i]);
      if (this.done.texture.key !== stages[i + 1]) this.done.setTexture(stages[i + 1]);
      this.done.setAlpha(t - i);
      for (const e of this.bowl.extras) e.setAlpha(Math.max(0, 1 - t * 1.5));
    } else this.done.setAlpha(this.progress);
    const sway = Math.sin(this.progress * 40) * 1.5;
    this.bowl.contents.setAngle(sway);
    this.done.setAngle(sway);
  }

  /** The bowl goes to the left column and turns into the next step's bowl; the pizza comes back. */
  private finish() {
    if (this.finishing) return;
    this.finishing = true;
    this.stirring = false;
    this.setIdle(false);
    this.hand.stop();
    if (this.params.cook) bakeLoop.stop();
    if (this.params.doneLine) voice.say(this.params.doneLine, { ttlMs: 5000, valid: () => !this.aborted });
    this.progress = 1;
    this.render();
    this.bowl.contents.setAngle(0);
    this.done.setAngle(0);
    this.scene.tweens.add({ targets: this.spoon, alpha: 0, duration: 250 });
    if (this.arrows) this.scene.tweens.add({ targets: this.arrows, alpha: 0, duration: 250 });
    if (this.params.keep) {
      // The bowl stays where it is, now with the result in it, for the next step.
      this.scene.time.delayedCall(350, () => {
        this.bowl.setContents(this.params.to);
        this.done.destroy();
        boing(this.scene, this.bowl.front, 0.05);
        this.bowl.keep();
        this.complete();
      });
      return;
    }
    const S = this.ctx.stage;
    const parts = [...this.bowl.parts, this.done];
    this.scene.time.delayedCall(350, () => {
      this.workspace('dish', 600);
      const key = this.params.handoffAs;
      const [bw] = IMAGES['prep-bowl-back'].size;
      const scale = key ? (IMAGES[key].size[0] * this.k * 0.95) / bw : this.bowl.scale * 0.5;
      this.scene.tweens.add({ targets: parts, x: S.bowl.x, y: S.bowl.y, scale, duration: 600, ease: 'Sine.easeInOut' });
      if (key) {
        const next = this.scene.add.image(S.bowl.x, S.bowl.y, key).setScale(this.k).setAlpha(0).setDepth(2);
        this.scene.tweens.add({ targets: next, alpha: 1, delay: 450, duration: 250 });
        this.scene.tweens.add({ targets: parts, alpha: 0, delay: 500, duration: 250 });
        this.handOff(key, next);
      } else this.scene.tweens.add({ targets: parts, alpha: 0, delay: 500, duration: 250 });
      this.scene.time.delayedCall(800, () => {
        this.bowl.destroy();
        this.complete();
      });
    });
  }

  /** Mom's spoon hand circles inside the bowl (the real spoon rests hidden meanwhile); at the knob, she taps it. */
  protected demo(): HandMotion {
    if (this.phase === 'knob' && this.knob) return tapMotion({ x: this.knob.x, y: this.knob.y }, this.k);
    const o = this.bowl.opening();
    const keys = [];
    for (let i = 0; i <= 10; i++) {
      const a = Math.PI / 2 + this.dir * (i / 10) * Math.PI * 2 * 1.3;
      keys.push({ x: o.x + Math.cos(a) * o.rx * 0.55, y: o.y + Math.sin(a) * o.ry * 0.55, t: 150 + i * 205 });
    }
    keys.unshift({ ...keys[0], t: 0 });
    keys.push({ ...keys[keys.length - 1], t: 2450 });
    return { kind: 'spread', size: STIR_HAND, keys, glow: { x: o.x, y: o.y }, onStop: () => this.spoon.active && this.spoon.setVisible(true) };
  }

  protected onDemoStart() {
    if (this.phase !== 'knob') this.spoon.setVisible(false);
  }

  protected showHint() {
    if (this.phase !== 'knob') this.spoon.setVisible(false);
    super.showHint();
  }

  protected onDemoEnd() {
    if (this.phase !== 'knob') this.spoon.setVisible(true);
  }

  /** Mom helps: her spoon hand stirs round and round until the sauce is smooth. */
  protected autoFinish() {
    // At the knob, Mom's hand lights the stove for her, and then it is the child's turn again: the stirring
    // help only comes if she goes idle once more (without this the step would stay in Mom's hands for good).
    if (this.phase === 'knob' && this.knob) {
      const at = { x: this.knob.x, y: this.knob.y };
      this.hand.play(tapMotion(at, this.k), {
        onDone: () => {
          this.lightStove();
          this.resumeAfterAuto();
        },
      });
      return;
    }
    this.spoon.setVisible(false);
    const o = this.bowl.opening();
    let a = Math.PI / 2;
    let t = this.scene.time.now;
    const at = () => {
      const now = this.scene.time.now;
      a += (this.dir * (now - t)) / 260;
      t = now;
      return { x: o.x + Math.cos(a) * o.rx * 0.55, y: o.y + Math.sin(a) * o.ry * 0.55 };
    };
    this.hand.follow('spread', at, STIR_HAND);
    this.scene.tweens.addCounter({
      from: this.progress,
      to: 1,
      duration: TUNING.help.stirMs,
      onUpdate: (tw) => {
        this.progress = tw.getValue() ?? 1;
        if (this.params.arrow && !this.flipped && this.progress >= TUNING.stirArrow.flipAt) this.flipArrows();
        this.render();
        const p = at();
        if (Math.random() < 0.15) this.drops(p.x, p.y, 2);
        sfx(this.scene, this.sound, { minGapMs: 300, volume: 0.45 });
      },
      onComplete: () => {
        this.spoon.setVisible(true);
        this.finish();
      },
    });
  }
}
