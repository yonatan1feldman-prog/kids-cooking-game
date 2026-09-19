import Phaser from 'phaser';
import { ART, IMAGES, type ImageKey } from '../core/assets';
import { voice } from '../core/audio';
import { boing, burst } from '../core/fx';
import { tapMotion, type HandMotion } from '../core/hand';
import { sfx } from '../core/sfx';
import { TUNING } from '../core/tuning';
import type { OpenPourParams } from '../recipes/types';
import { BOWL_DEPTH } from './PrepBowl';
import { Step } from './Step';
import { binKey, binsWaiting, fillBin, makeBin, parkBin } from './ToppingBin';

type Phase = 'open' | 'pour' | 'done';

/** How far the can or jar tips over while pouring (degrees). */
const TILT = 112;
/** At most this many pieces stay in the bowl (the rest of the pour falls in and melts into them). */
const MAX_IN_BOWL = 26;
/** A piece in the bowl, and one in the air (x k). */
const PIECE = 0.55;
const FALLING = 0.45;

/**
 * Open and pour (reusable: a can of corn, a jar of olives, a bag of flour, a carton of milk...). Two phases:
 * - open: the closed can or jar stands on the counter left of the bowl. Can: a swipe up on the lid, or a few taps,
 *   opens it: the lid flies aside, the can shows open, can-open. Jar: rubbing sideways on the lid adds up (the jar
 *   rocks a little with each rub) until it opens: the lid comes off and goes down, jar-open.
 * - pour: she drags the open can or jar; over the bowl it tips over by itself and the pieces pour out of its mouth into
 *   the bowl, between the bowl's back and front layers, with the pour sound, for as long as she holds it there
 *   (TUNING.pour.ms in total; moving away stops it, coming back goes on). Let go anywhere: it goes back upright.
 * Then the contents go into the topping's bin, which waits for decorating.
 */
export class OpenPourStep extends Step<OpenPourParams> {
  private box!: Phaser.GameObjects.Image;
  private back!: Phaser.GameObjects.Image;
  private front!: Phaser.GameObjects.Image;
  private lid?: Phaser.GameObjects.Image;
  private phase: Phase = 'open';
  private taps = 0;
  private twist = 0;
  private held = false;
  private grab = { dx: 0, dy: 0 };
  private start0 = { x: 0, y: 0 };
  private last = { x: 0, y: 0 };
  private over = false;
  private poured = 0;
  private sinceDrop = 0;
  private inBowl: Phaser.GameObjects.Image[] = [];
  private helping = false;
  private k = 1;

  start() {
    const p = this.params;
    this.stepLine = p.openLine;
    const S = this.ctx.stage;
    const k = (this.k = this.layout.k);
    this.workspace(S.prepWide ? 'aside' : 'none');
    const b = S.pourBowl;
    this.back = this.own(this.scene.add.image(b.x, b.y, p.bowl.back).setScale(b.scale).setDepth(BOWL_DEPTH.back));
    this.front = this.own(this.scene.add.image(b.x, b.y, p.bowl.front).setScale(b.scale).setDepth(BOWL_DEPTH.front));
    const r = S.pourRest;
    this.box = this.own(this.scene.add.image(r.x, r.y, p.closed).setScale(r.scale).setDepth(6));
    for (const o of [this.back, this.front, this.box]) {
      o.setAlpha(0).setY(o.y + 100 * k);
      this.scene.tweens.add({ targets: o, alpha: 1, y: o.y - 100 * k, duration: 450, ease: 'Back.easeOut' });
    }

    this.onDown((q) => {
      if (this.phase === 'done' || !this.onBox(q.worldX, q.worldY)) return;
      this.held = true;
      this.start0 = this.last = { x: q.worldX, y: q.worldY };
      this.poke();
      if (this.phase === 'open') {
        sfx(this.scene, 'tap');
        boing(this.scene, this.box, 0.08);
        if (p.kind === 'can') {
          if (++this.taps >= p.taps) this.open();
        } else this.addTwist(p.twist / 4);
        return;
      }
      // Pour: pick it up.
      this.grab = { dx: this.box.x - q.worldX, dy: this.box.y - q.worldY };
      this.scene.tweens.killTweensOf(this.box);
      this.box.setDepth(12);
      sfx(this.scene, 'tap');
    });
    this.onMove((q) => {
      if (!this.held) return;
      const dx = q.worldX - this.last.x;
      const dy = q.worldY - this.last.y;
      this.last = { x: q.worldX, y: q.worldY };
      if (this.phase === 'open') {
        if (p.kind === 'can') {
          if (this.start0.y - q.worldY >= p.swipe * this.k) this.open();
        } else this.addTwist(Math.abs(dx) + Math.abs(dy) / 3);
        return;
      }
      if (this.phase !== 'pour') return;
      this.box.setPosition(q.worldX + this.grab.dx, q.worldY + this.grab.dy);
      this.poke();
      this.setOver(this.isOver(q.worldX, q.worldY));
    });
    this.onUp(() => {
      if (!this.held) return;
      this.held = false;
      if (this.phase === 'pour') this.putBack();
    });
    this.setIdle(true);
  }

  update(delta: number) {
    super.update(delta);
    if (this.phase !== 'pour' || !this.over) return;
    this.poured += delta;
    this.sinceDrop += delta;
    while (this.sinceDrop > 85) {
      this.sinceDrop -= 85;
      this.dropPiece();
    }
    if (!this.helping) this.poke();
    if (this.poured >= this.params.pourMs) this.pourDone();
  }

  /** The can or jar, with a generous margin. */
  private onBox(x: number, y: number) {
    const b = this.box.getBounds();
    const pad = 45 * this.k;
    return x > b.x - pad && x < b.right + pad && y > b.y - pad && y < b.bottom + pad;
  }

  /** The bowl's opening (an ellipse; the same art as the prep bowl). */
  opening() {
    const o = ART.prep.bowlOpening;
    const [w, h] = IMAGES['prep-bowl-back'].size;
    const s = this.back.scaleX;
    return { x: this.back.x + (o.x - w / 2) * s, y: this.back.y + (o.y - h / 2) * s, rx: o.rx * s, ry: o.ry * s };
  }

  /** Where the can or jar is held to pour: up and to the left of the bowl's opening (as in the art agent's scene). */
  pourPoint() {
    const o = this.opening();
    return { x: o.x - o.rx * 0.95, y: o.y - 250 * this.back.scaleX };
  }

  /** Forgiving: anywhere above the bowl (its width, plus a margin toward the left), or near the pouring spot. */
  private isOver(x: number, y: number) {
    const o = this.opening();
    const pp = this.pourPoint();
    const near = Phaser.Math.Distance.Between(x, y, pp.x, pp.y) < 300 * this.back.scaleX;
    const above = x > o.x - o.rx - 180 * this.k && x < o.x + o.rx && y < o.y + 30 * this.k && y > o.y - 600 * this.k;
    return near || above;
  }

  private addTwist(d: number) {
    if (this.phase !== 'open' || d <= 0) return;
    this.poke();
    this.twist += d;
    // The jar rocks a little with the rubbing, as if the lid were turning.
    this.box.setAngle(Math.sin(this.twist / 45) * 5);
    sfx(this.scene, 'click', { minGapMs: 180, volume: 0.6 });
    if (this.twist >= this.params.twist * this.k) this.open();
  }

  /** The lid comes off: the can's flies aside, the jar's comes off and goes down beside it. */
  private open() {
    if (this.phase !== 'open') return;
    const p = this.params;
    this.phase = 'pour';
    this.poke();
    this.hit();
    this.hand.stop();
    this.box.setAngle(0).setTexture(p.open);
    boing(this.scene, this.box, 0.12);
    sfx(this.scene, p.sound);
    const top = p.kind === 'can' ? ART.prep.canTop : ART.prep.jarTop;
    const [w, h] = IMAGES[p.closed].size;
    const s = this.box.scaleX;
    const at = { x: this.box.x + (top.x - w / 2) * s, y: this.box.y + (top.y - h / 2) * s };
    burst(this.scene, at.x, at.y, { count: 10, size: 18 * this.k, tint: [0xffffff, 0xffe066], speed: 380 * this.k, gravityY: 500 });
    this.lid = this.own(this.scene.add.image(at.x, at.y, p.lid).setScale(0.62 * this.k).setDepth(7));
    const to = this.ctx.stage.lidRest;
    if (p.kind === 'can') {
      // It flies up and aside in an arc, spinning, and lands flat on the counter.
      this.scene.tweens.add({ targets: this.lid, x: to.x, duration: 650, ease: 'Sine.easeOut' });
      this.scene.tweens.add({ targets: this.lid, y: at.y - 160 * this.k, duration: 280, ease: 'Quad.easeOut', yoyo: false, onComplete: () => this.lid && this.scene.tweens.add({ targets: this.lid, y: to.y, duration: 370, ease: 'Bounce.easeOut' }) });
      this.scene.tweens.add({ targets: this.lid, angle: 540, duration: 650 });
    } else {
      // A little lift, then down beside the jar.
      this.scene.tweens.add({
        targets: this.lid,
        y: at.y - 50 * this.k,
        angle: -20,
        duration: 250,
        ease: 'Quad.easeOut',
        onComplete: () => this.lid && this.scene.tweens.add({ targets: this.lid, x: to.x, y: to.y, angle: 0, duration: 450, ease: 'Bounce.easeOut' }),
      });
    }
    voice.say(p.pourLine, { valid: () => this.phase === 'pour', ttlMs: 4000 });
  }

  private setOver(on: boolean) {
    if (on === this.over) return;
    this.over = on;
    const dir = this.box.x < this.opening().x ? 1 : -1;
    this.scene.tweens.add({ targets: this.box, angle: on ? TILT * dir : 0, duration: on ? 320 : 250, ease: 'Sine.easeInOut' });
  }

  private putBack() {
    this.setOver(false);
    const r = this.ctx.stage.pourRest;
    sfx(this.scene, 'whoosh', { volume: 0.35 });
    this.scene.tweens.add({ targets: this.box, x: r.x, y: r.y, angle: 0, duration: 380, ease: 'Sine.easeOut', onComplete: () => this.box.setDepth(6) });
  }

  /** The mouth of the tipped can or jar (its top centre, turned with it). */
  private mouth() {
    const top = this.params.kind === 'can' ? ART.prep.canTop : ART.prep.jarTop;
    const [w, h] = IMAGES[this.params.open].size;
    const s = this.box.scaleX;
    const v = new Phaser.Math.Vector2((top.x - w / 2) * s, (top.y + 20 - h / 2) * s).rotate(Phaser.Math.DegToRad(this.box.angle));
    return { x: this.box.x + v.x, y: this.box.y + v.y };
  }

  /** One piece falls from the mouth into the bowl (always into it: nothing is spilled). */
  private dropPiece() {
    const k = this.k;
    const m = this.mouth();
    const o = this.opening();
    const a = Math.random() * Math.PI * 2;
    const rr = Math.sqrt(Math.random()) * 0.75;
    const to = { x: o.x + Math.cos(a) * o.rx * rr, y: o.y + 12 * k + Math.sin(a) * o.ry * rr };
    const keep = this.inBowl.length < MAX_IN_BOWL;
    const piece = this.scene.add.image(m.x, m.y, this.params.piece).setScale(FALLING * k).setAngle(Phaser.Math.Between(0, 359)).setDepth(keep ? BOWL_DEPTH.contents : BOWL_DEPTH.contents + 0.01);
    if (keep) this.inBowl.push(this.own(piece));
    sfx(this.scene, 'pour', { minGapMs: 1700, volume: 0.8, vary: false });
    this.scene.tweens.add({
      targets: piece,
      x: to.x,
      y: to.y,
      scale: (keep ? PIECE : FALLING) * k,
      angle: piece.angle + Phaser.Math.Between(-120, 120),
      duration: Phaser.Math.Between(300, 420),
      ease: 'Quad.easeIn',
      onComplete: () => {
        if (!keep) this.scene.tweens.add({ targets: piece, alpha: 0, duration: 150, onComplete: () => piece.destroy() });
      },
    });
  }

  /** Poured: upright again, back to its place; the bowl's contents go into the topping's bin. */
  private pourDone() {
    if (this.phase !== 'pour') return;
    this.phase = 'done';
    this.held = false;
    this.over = false;
    this.setIdle(false);
    this.hand.stop();
    this.helping = false;
    const r = this.ctx.stage.pourRest;
    this.scene.tweens.killTweensOf(this.box);
    this.scene.tweens.add({ targets: this.box, x: r.x, y: r.y, angle: 0, duration: 450, ease: 'Sine.easeInOut', onComplete: () => this.box.setDepth(6) });
    this.scene.time.delayedCall(700, () => {
      const p = this.params;
      const o = this.opening();
      const bin = makeBin(this.scene, p.bin, p.topping, o.x, o.y + 260 * this.back.scaleX, 0);
      const bs = 0.8 * this.k;
      this.scene.tweens.add({ targets: [bin], scale: bs, duration: 300, ease: 'Back.easeOut' });
      this.scene.tweens.add({ targets: [bin.getData('icon')], scale: bs * 1.1, duration: 300, ease: 'Back.easeOut' });
      const index = binsWaiting(this.ctx);
      this.inBowl.forEach((q) => q.setDepth(21));
      this.scene.time.delayedCall(320, () =>
        fillBin(this.scene, bin, this.inBowl.splice(0), () => {
          this.handOff(binKey(p.topping), bin);
          parkBin(this.ctx, bin, index, () => this.complete());
        }),
      );
    });
  }

  /** Open: Mom's finger taps the can's lid, or her hand turns the jar's lid. Pour: she carries a see-through copy over the bowl, tipping it. */
  protected demo(): HandMotion | null {
    const k = this.k;
    const top = this.params.kind === 'can' ? ART.prep.canTop : ART.prep.jarTop;
    const [w, h] = IMAGES[this.params.closed].size;
    const s = this.box.scaleX;
    const lid = { x: this.box.x + (top.x - w / 2) * s, y: this.box.y + (top.y - h / 2) * s };
    if (this.phase === 'open') {
      if (this.params.kind === 'can') {
        const m = tapMotion(lid, k);
        // ...and the swipe up.
        m.keys.push({ x: lid.x, y: lid.y, t: 1700 }, { x: lid.x, y: lid.y - 110 * k, t: 2300 });
        return m;
      }
      const keys = [0, 1, 2, 3, 4, 5].map((i) => ({ x: lid.x + (i % 2 ? 55 : -55) * k, y: lid.y, t: 300 + i * 330 }));
      keys.unshift({ ...keys[0], t: 0 });
      keys.push({ ...keys[keys.length - 1], t: 2400 });
      return { kind: 'grab', keys, glow: lid };
    }
    if (this.phase !== 'pour') return null;
    const pp = this.pourPoint();
    const dir = this.box.x < this.opening().x ? 1 : -1;
    const key = this.box.texture.key as ImageKey;
    return {
      kind: 'grab',
      keys: [
        { x: this.box.x, y: this.box.y, t: 0 },
        { x: this.box.x, y: this.box.y, t: 350, press: true },
        { x: pp.x, y: pp.y, t: 1500 },
        { x: pp.x, y: pp.y, t: 2400 },
      ],
      props: [{ key, scale: s, alpha: 0.55, angle: 0, endAngle: TILT * dir, turnFrom: 1300 }],
      glow: { x: this.box.x, y: this.box.y },
    };
  }

  /** Mom helps: she opens it, then her hand carries it over the bowl and pours. */
  protected autoFinish() {
    this.held = false;
    if (this.phase === 'open') {
      const m = this.demo();
      if (m) this.hand.play({ ...m, glow: undefined }, { onDone: () => { this.open(); this.scene.time.delayedCall(400, () => this.helpPour()); } });
      else this.open();
      return;
    }
    this.helpPour();
  }

  private helpPour() {
    if (this.phase !== 'pour') return;
    this.helping = true;
    const pp = this.pourPoint();
    this.hand.follow('grab', () => ({ x: this.box.x, y: this.box.y }));
    this.scene.tweens.killTweensOf(this.box);
    this.box.setDepth(12);
    this.scene.tweens.add({
      targets: this.box,
      x: pp.x,
      y: pp.y,
      duration: TUNING.help.openMs / 2,
      ease: 'Sine.easeInOut',
      onComplete: () => this.setOver(true),
    });
  }
}
