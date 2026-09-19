import Phaser from 'phaser';
import { ART, FX_SOFT, IMAGES } from '../core/assets';
import { bakeLoop, voice, type TempKey } from '../core/audio';
import { boing, burst, puff, stars } from '../core/fx';
import { tapMotion, type HandMotion } from '../core/hand';
import { sfx } from '../core/sfx';
import { TUNING } from '../core/tuning';
import { iconButton } from '../core/ui';
import type { BakeParams } from '../recipes/types';
import { MADE_KEY } from './Dish';
import { Step } from './Step';

type Phase = 'toOven' | 'temp' | 'baking' | 'mitts' | 'ready' | 'out';

/** Cool to warm, for the oven's glow and its gentle tint while she sets the temperature. */
const COOL = 0x9fc4ff;
const WARM = 0xff9a4a;
const DOOR_COOL = 0xeef3ff;
const DOOR_WARM = 0xffe2c8;

const mix = (a: number, b: number, t: number) => {
  const c = Phaser.Display.Color.Interpolate.ColorWithColor(Phaser.Display.Color.ValueToColor(a), Phaser.Display.Color.ValueToColor(b), 100, Phaser.Math.Clamp(t, 0, 1) * 100);
  return Phaser.Display.Color.GetColor(c.r, c.g, c.b);
};

/**
 * Baking: the oven stands left of the dish, side by side.
 * 1. She drags the pizza into the open oven; the door closes, and the pizza is seen through its window.
 * 2. (`panel`) A big temperature panel comes up, the needle on the lowest value. The down and up buttons move it one
 *    step at a time: the needle turns to that number, click, Mom says the number, and the oven glows cooler or warmer
 *    (bigger numbers look and sound hotter). At the target the number glows, Mom says it's just right, and the start
 *    button waits for her (it only starts at the target; there is no wrong value and the pizza never burns: at the
 *    highest value Mom says it's too hot and points at the down button). Start: beep, it lights up, the baking begins.
 * 3. The pizza turns golden through the window, the oven glows and steams, a ding.
 * 4. (`mitts`) The oven mitts lie on the counter; a tap puts them on (they go to her hands). Then a tap on the oven,
 *    or a drag from it, opens it and the pizza comes out onto its board, pulled by her mitt.
 */
export class BakeStep extends Step<BakeParams> {
  private open!: Phaser.GameObjects.Image;
  private inside!: Phaser.GameObjects.Image;
  private closed!: Phaser.GameObjects.Image;
  private phase: Phase = 'toOven';
  private dragging = false;
  private grab = { dx: 0, dy: 0 };
  private rest = { x: 0, y: 0 };
  private loops: (Phaser.Tweens.Tween | Phaser.Time.TimerEvent)[] = [];
  private k = 1;
  /** The oven's own scale (it fills the room left of the board). */
  private os = 1;
  // temperature panel
  private temp = 0;
  private panelImg?: Phaser.GameObjects.Image;
  private needle?: Phaser.GameObjects.Image;
  private glowRing?: Phaser.GameObjects.Image;
  private heat?: Phaser.GameObjects.Image;
  private btnUp?: Phaser.GameObjects.Image;
  private btnDown?: Phaser.GameObjects.Image;
  private btnStart?: Phaser.GameObjects.Image;
  private starting = false;
  // mitts
  private mitts?: Phaser.GameObjects.Image;
  private wearing = false;

  start() {
    const L = this.layout;
    this.k = L.k;
    this.os = this.ctx.stage.ovenScale;
    const o = this.ctx.stage.oven;
    this.open = this.own(this.scene.add.image(o.x, o.y, this.params.open).setScale(this.os).setDepth(5));
    this.inside = this.own(this.scene.add.image(o.x, o.y, this.params.inside).setScale(this.os).setDepth(5).setVisible(false));
    this.closed = this.own(this.scene.add.image(o.x, o.y, this.params.closed).setScale(this.os).setDepth(7).setVisible(false));
    this.open.setScale(0);
    this.scene.tweens.add({ targets: this.open, scale: this.os, duration: 450, ease: 'Back.easeOut' });

    // The board and pizza wait next to the oven (they only move if the stage says so).
    this.rest = this.ctx.stage.dishWait;
    this.dish.setDepth(10);
    this.scene.tweens.add({ targets: [this.dish, this.ctx.board], x: this.rest.x, y: this.rest.y, duration: 500, ease: 'Sine.easeInOut' });

    this.onDown((p) => {
      if (this.phase === 'toOven' && this.dish.reach(p.worldX, p.worldY) < 1.3) {
        this.dragging = true;
        this.grab = { dx: this.dish.x - p.worldX, dy: this.dish.y - p.worldY };
        this.scene.tweens.killTweensOf(this.dish);
        this.dish.setScale(1.06);
        sfx(this.scene, 'tap');
        this.poke();
      } else if (this.phase === 'mitts' && this.onMitts(p.worldX, p.worldY)) {
        this.wearMitts();
      } else if (this.phase === 'ready' && this.nearOven(p.worldX, p.worldY)) {
        // A tap on the oven, or the start of a drag from it, opens it.
        this.openOven();
      } else if (this.phase === 'mitts' && this.nearOven(p.worldX, p.worldY)) {
        // Not yet: the mitts first (a try; after 3 the hand shows them).
        boing(this.scene, this.closed, 0.05);
        this.miss();
      }
    });
    this.onMove((p) => {
      if (!this.dragging) return;
      this.dish.setPosition(p.worldX + this.grab.dx, p.worldY + this.grab.dy);
      this.poke();
    });
    this.onUp((_p, cancelled) => {
      if (!this.dragging) return;
      this.dragging = false;
      // Forgiving: carried well toward the oven, or dropped near it, counts.
      const dist = (x: number, y: number) => Phaser.Math.Distance.Between(x, y, this.open.x, this.open.y);
      const toward = dist(this.rest.x, this.rest.y) - dist(this.dish.x, this.dish.y);
      const lifted = toward > 220 * this.k || this.nearOven(this.dish.x, this.dish.y);
      if (!cancelled && lifted) {
        this.hit();
        this.intoOven();
      } else {
        if (!cancelled) this.miss();
        sfx(this.scene, 'whoosh', { volume: 0.4 });
        this.scene.tweens.add({ targets: this.dish, x: this.rest.x, y: this.rest.y, scale: 1, duration: 420, ease: 'Sine.easeOut' });
      }
    });

    // Where Pipa is not on screen (4:3) Mom points her arm at the oven; on the phone that aim would
    // pass over Pipa's head, so there she keeps her default pose and her demo hand points instead.
    if (!this.ctx.stage.pet) {
      const win = this.ovenPoint(ART.ovenPizza.x, ART.ovenPizza.y - 15);
      this.ctx.mom.aimArmAt(win.x, win.y);
    }

    this.setIdle(true);
  }

  private nearOven(x: number, y: number) {
    return Phaser.Math.Distance.Between(x, y, this.open.x, this.open.y) < 460 * this.os;
  }

  /** Oven-frame point (700x800 viewBox) -> game point. */
  private ovenPoint(x: number, y: number) {
    const [w, h] = IMAGES['oven-closed'].size;
    return { x: this.open.x + (x - w / 2) * this.os, y: this.open.y + (y - h / 2) * this.os };
  }

  private intoOven() {
    this.phase = this.params.panel ? 'temp' : 'baking';
    this.setIdle(false);
    sfx(this.scene, 'whoosh');
    const spot = this.ovenPoint(ART.ovenPizza.x, ART.ovenPizza.y);
    const scale = ((ART.ovenPizza.diameter / 2) * this.os) / this.dish.R;
    this.scene.tweens.add({
      targets: this.dish,
      x: spot.x,
      y: spot.y,
      scale,
      duration: 480,
      ease: 'Quad.easeIn',
      onComplete: () => {
        // Door closes: pizza now sits between the oven cavity and the glass.
        this.open.setVisible(false);
        this.inside.setVisible(true);
        this.closed.setVisible(true);
        this.dish.setDepth(6);
        boing(this.scene, this.closed, 0.06);
        sfx(this.scene, 'pop', { volume: 0.5 });
        this.hand.stop();
        voice.say('vo-oven', { ttlMs: 3000 });
        if (this.params.panel) this.showPanel();
        else this.bake();
      },
    });
  }

  // ------------------------------------------------------------------ the temperature

  /** The panel comes up (the empty board makes room for it), the needle on the lowest value, the oven cool. */
  private showPanel() {
    const P = this.params.panel!;
    const S = this.ctx.stage;
    const ps = S.panel.scale;
    this.temp = P.from;
    this.scene.tweens.add({ targets: this.ctx.board, alpha: 0, duration: 300 });
    this.panelImg = this.own(this.scene.add.image(S.panel.x, S.panel.y, P.panel).setScale(ps).setDepth(20));
    const pv = ART.prep.panelPivot;
    const [pw, ph] = IMAGES['oven-panel'].size;
    this.needle = this.own(
      this.scene.add
        .image(S.panel.x + (pv.x - pw / 2) * ps, S.panel.y + (pv.y - ph / 2) * ps, P.needle)
        .setOrigin(pv.x / pw, pv.y / ph)
        .setScale(ps)
        .setDepth(20.2)
        .setAngle(this.angleOf(this.temp)),
    );
    const d = ART.prep.panelDigit[P.target];
    this.glowRing = this.own(this.scene.add.image(S.panel.x + (d[0] - pw / 2) * ps, S.panel.y + (d[1] - ph / 2) * ps, P.glow).setScale(ps).setDepth(20.1).setAlpha(0));
    // The oven's warmth, seen through its window (a soft light over the cavity) and in a gentle tint of the oven.
    const win = this.ovenPoint(350, 465);
    this.heat = this.own(this.scene.add.image(win.x, win.y, FX_SOFT).setDepth(6.5).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0));
    this.heat.setScale((430 * this.os) / this.heat.frame.realWidth);
    const bs = S.tempBtnScale;
    const btn = (key: typeof P.up, at: { x: number; y: number }, fn: () => void, scale = bs) =>
      this.own(iconButton(this.scene, this.layout, key, at.x, at.y, fn, { scale, hitPad: 10, lockMs: 120, sound: null }).setDepth(21));
    this.btnDown = btn(P.down, S.tempDown, () => this.press(-1));
    this.btnStart = btn(P.startOff, S.tempStart, () => this.pressStart(), bs * 0.75);
    this.btnUp = btn(P.up, S.tempUp, () => this.press(1));
    const parts = [this.panelImg, this.needle, this.btnDown, this.btnStart, this.btnUp];
    parts.forEach((o) => {
      const s = o.scale;
      o.setScale(0);
      this.scene.tweens.add({ targets: o, scale: s, duration: 420, delay: 250, ease: 'Back.easeOut' });
    });
    this.showHeat(false);
    voice.say(P.line, { valid: () => this.phase === 'temp', ttlMs: 5000 });
    this.scene.time.delayedCall(700, () => this.phase === 'temp' && this.setIdle(true));
  }

  private angleOf(v: number) {
    return ART.prep.panelAngle[v] ?? (v - 150) * 0.8;
  }

  /** How hot, 0 (the lowest value) .. 1 (the highest). */
  private get warmth() {
    const P = this.params.panel!;
    return (this.temp - P.min) / Math.max(1, P.max - P.min);
  }

  /** The oven's glow and tint follow the number: cool blue at the lowest, warm orange at the highest. */
  private showHeat(animate = true) {
    const t = this.warmth;
    const ms = animate ? 350 : 0;
    this.heat?.setTint(mix(COOL, WARM, t));
    if (this.heat) this.scene.tweens.add({ targets: this.heat, alpha: 0.25 + 0.55 * t, duration: ms || 1 });
    this.inside.setTint(mix(COOL, 0xffd0a0, t));
    this.closed.setTint(mix(DOOR_COOL, DOOR_WARM, t));
  }

  /** Up or down one step (from her press, or Mom's help). */
  private press(dir: 1 | -1, byHelp = false) {
    if (this.phase !== 'temp' || this.starting || (this.isAuto && !byHelp)) return;
    const P = this.params.panel!;
    const btn = dir > 0 ? this.btnUp! : this.btnDown!;
    const v = Phaser.Math.Clamp(this.temp + dir * P.step, P.min, P.max);
    this.poke();
    // (her press ends any hand that was pointing at a button; Mom's own help keeps her hand)
    if (!byHelp) this.hand.stop();
    sfx(this.scene, 'click', { minGapMs: 40 });
    if (v === this.temp) {
      // Already at the end: the button only wiggles (and at the hot end Mom points down again).
      boing(this.scene, btn, 0.1);
      if (v === P.max) this.hintAt(this.btnDown!);
      return;
    }
    this.hit();
    this.temp = v;
    this.scene.tweens.killTweensOf(this.needle!);
    this.scene.tweens.add({ targets: this.needle, angle: this.angleOf(v), duration: 380, ease: 'Back.easeOut' });
    voice.say(`temp-${v}` as TempKey, { group: 'temp', ttlMs: 1500 });
    this.showHeat();
    const atTarget = v === P.target;
    this.scene.tweens.killTweensOf(this.glowRing!);
    this.scene.tweens.add({ targets: this.glowRing, alpha: atTarget ? 1 : 0, duration: 250 });
    if (atTarget) {
      boing(this.scene, this.glowRing!, 0.15);
      voice.say(P.done, { valid: () => this.phase === 'temp' && this.temp === P.target, ttlMs: 3000 });
      if (!byHelp) this.hintAt(this.btnStart!);
    } else if (v === P.max) {
      voice.say(P.hot, { valid: () => this.phase === 'temp' && this.temp === P.max, ttlMs: 3000 });
      if (!byHelp) this.hintAt(this.btnDown!);
    }
  }

  /** Mom's finger taps a button, looping, until the next press (the hint for that moment). */
  private hintAt(btn: Phaser.GameObjects.Image) {
    this.hand.play(tapMotion({ x: btn.x, y: btn.y }, this.k), { loop: true, gapMs: 900 });
  }

  private pressStart(byHelp = false) {
    if (this.phase !== 'temp' || this.starting || (this.isAuto && !byHelp)) return;
    const P = this.params.panel!;
    if (this.temp !== P.target) {
      // Not there yet: it only wiggles (a try; the hint shows which way).
      sfx(this.scene, 'tap', { volume: 0.6 });
      boing(this.scene, this.btnStart!, 0.1);
      this.miss();
      return;
    }
    this.starting = true;
    this.poke();
    this.hit();
    this.hand.stop();
    sfx(this.scene, 'beep');
    this.btnStart!.setTexture(P.startOn);
    boing(this.scene, this.btnStart!, 0.15);
    burst(this.scene, this.btnStart!.x, this.btnStart!.y, { count: 10, size: 20 * this.k, tint: [0xffe066, 0xff9a4a], speed: 360 * this.k, gravityY: 300 });
    this.setIdle(false);
    this.phase = 'baking';
    this.scene.time.delayedCall(700, () => {
      const parts = [this.panelImg, this.needle, this.glowRing, this.btnDown, this.btnStart, this.btnUp].filter((o) => !!o);
      this.scene.tweens.add({ targets: parts, alpha: 0, duration: 350, onComplete: () => parts.forEach((o) => o.destroy()) });
      this.bake();
    });
  }

  // ------------------------------------------------------------------ baking

  /** The pizza visibly turns golden through the window; the cavity glows; steam rises. */
  private bake() {
    this.phase = 'baking';
    bakeLoop.start();
    this.scene.time.delayedCall(this.params.bakeMs / 2, () => voice.say('vo-baking', { valid: () => this.phase === 'baking' }));
    const glowFrom = this.params.panel ? mix(COOL, 0xffd0a0, this.warmth) : 0xffffff;
    this.loops.push(
      this.scene.tweens.addCounter({
        from: 0,
        to: 1,
        duration: this.params.bakeMs,
        onUpdate: (tw) => this.dish.tintAll(mix(0xffffff, this.params.bakedTint, tw.getValue() ?? 0)),
      }),
      this.scene.tweens.addCounter({
        from: 0,
        to: 1,
        duration: 500,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
        onUpdate: (tw) => this.inside.setTint(mix(glowFrom, 0xffb070, tw.getValue() ?? 0)),
      }),
      this.scene.tweens.add({ targets: this.closed, angle: { from: -1, to: 1 }, duration: 140, yoyo: true, repeat: -1 }),
      this.scene.time.addEvent({
        delay: 300,
        loop: true,
        callback: () => {
          const top = this.ovenPoint(350 + Phaser.Math.Between(-120, 120), 60);
          puff(this.scene, top.x, top.y, 0xffffff, 2, 90 * this.os);
        },
      }),
    );
    this.scene.time.delayedCall(this.params.bakeMs, () => {
      this.stopLoops();
      bakeLoop.stop();
      this.closed.setAngle(0).clearTint();
      this.inside.clearTint();
      if (this.heat) this.scene.tweens.add({ targets: this.heat, alpha: 0, duration: 400 });
      this.dish.tintAll(this.params.bakedTint);
      sfx(this.scene, 'oven-ding', { vary: false });
      boing(this.scene, this.closed, 0.12);
      stars(this.scene, this.closed.x, this.closed.y - 380 * this.os, 6, 60 * this.k);
      // The ding makes the oven hop three times (pizza included, so it stays behind the window), then it rests.
      this.loops.push(
        this.scene.tweens.add({ targets: [this.closed, this.inside, this.dish], y: `-=${14 * this.k}`, duration: 380, yoyo: true, repeat: 2, repeatDelay: 250, ease: 'Sine.easeOut' }),
      );
      if (this.params.mitts) this.showMitts();
      else {
        voice.say('vo-ready', { ttlMs: 3000 });
        this.phase = 'ready';
        this.setIdle(true);
      }
    });
  }

  private stopLoops() {
    // Put the oven back on its spot if a hop was cut short.
    const o = this.ctx.stage.oven;
    for (const img of [this.closed, this.inside]) img.y = o.y;
    this.loops.forEach((l) => (l instanceof Phaser.Time.TimerEvent ? l.remove() : l.destroy()));
    this.loops = [];
  }

  // ------------------------------------------------------------------ the mitts

  /** The board is back on the counter, with the oven mitts on it; Mom asks her to put them on. */
  private showMitts() {
    const m = this.ctx.stage.mitts;
    this.phase = 'mitts';
    this.scene.tweens.add({ targets: this.ctx.board, alpha: 1, duration: 300 });
    this.mitts = this.own(this.scene.add.image(m.x, m.y, this.params.mitts!.pair).setScale(0).setDepth(12).setAngle(-6));
    this.scene.tweens.add({ targets: this.mitts, scale: m.scale, duration: 420, delay: 300, ease: 'Back.easeOut' });
    voice.say(this.params.mitts!.line, { valid: () => this.phase === 'mitts', ttlMs: 4000 });
    this.scene.time.delayedCall(700, () => this.setIdle(true));
  }

  private onMitts(x: number, y: number) {
    if (!this.mitts) return false;
    const b = this.mitts.getBounds();
    const pad = 50 * this.k;
    return x > b.x - pad && x < b.right + pad && y > b.y - pad && y < b.bottom + pad;
  }

  /** On they go: the mitts fly down to her hands (off the bottom of the screen) with a pop. */
  private wearMitts() {
    if (this.phase !== 'mitts' || !this.mitts) return;
    this.poke();
    this.hit();
    this.hand.stop();
    this.wearing = true;
    this.phase = 'ready';
    sfx(this.scene, 'pop');
    burst(this.scene, this.mitts.x, this.mitts.y, { count: 10, size: 18 * this.k, tint: [0x4fb0a8, 0xffffff], speed: 320 * this.k, gravityY: 300 });
    this.scene.tweens.add({ targets: this.mitts, y: this.layout.H + 200 * this.k, scale: this.mitts.scale * 1.4, duration: 450, ease: 'Quad.easeIn', onComplete: () => this.mitts?.setVisible(false) });
  }

  // ------------------------------------------------------------------ out

  private openOven() {
    if (this.phase !== 'ready') return;
    this.phase = 'out';
    this.hand.stop();
    this.ctx.mom.armTo(0);
    this.setIdle(false);
    this.stopLoops();
    this.inside.setVisible(false);
    this.closed.setVisible(false);
    this.open.setVisible(true).setScale(this.os);
    sfx(this.scene, 'whoosh');
    puff(this.scene, this.open.x, this.open.y, 0xffffff, 10, 140 * this.os);
    this.scene.tweens.add({ targets: this.ctx.board, alpha: 1, duration: 200 });
    this.dish.setDepth(10);
    // Her mitt pulls the pizza out by its rim (the art agent's take-out scene).
    let mitt: Phaser.GameObjects.Image | null = null;
    if (this.params.mitts && this.wearing) {
      mitt = this.own(this.scene.add.image(0, 0, this.params.mitts.single).setScale(0.66 * this.k).setAngle(90).setDepth(11));
    }
    const place = () => mitt?.setPosition(this.dish.x - this.dish.R * this.dish.scaleX * 0.95, this.dish.y + 20 * this.k);
    place();
    this.scene.tweens.add({
      targets: this.dish,
      x: this.rest.x,
      y: this.rest.y,
      scale: 1,
      duration: 700,
      ease: 'Back.easeOut',
      onUpdate: place,
      onComplete: () => {
        sfx(this.scene, 'pop');
        stars(this.scene, this.dish.x, this.dish.y, 12, 70 * this.k);
        if (mitt) this.scene.tweens.add({ targets: mitt, alpha: 0, x: mitt.x - 60 * this.k, delay: 250, duration: 350 });
        this.scene.time.delayedCall(500, () => this.complete());
      },
    });
  }

  /** Mom's hand at the window of the closed oven: her finger taps it, or (mitts on) her mitt pulls it open. */
  private ovenTap(): HandMotion {
    const w = this.ovenPoint(460, 430);
    if (this.params.mitts) {
      const to = { x: this.rest.x - this.dish.R * 0.9, y: this.rest.y };
      return {
        kind: 'mitt',
        keys: [
          { x: w.x + 60 * this.k, y: w.y, t: 0 },
          { x: w.x, y: w.y, t: 400 },
          { x: w.x, y: w.y, t: 650, press: true },
          { x: to.x, y: to.y, t: 1700 },
          { x: to.x, y: to.y, t: 2200 },
        ],
        glow: this.ovenPoint(350, 465),
      };
    }
    return { ...tapMotion(w, this.k), glow: this.ovenPoint(350, 465) };
  }

  /**
   * Before baking: Mom carries a see-through copy of the pizza into the open oven (the real one stays). The panel:
   * her finger taps the up button. The mitts: her finger taps them. Ready: her mitt at the oven.
   */
  protected demo(): HandMotion | null {
    if (this.phase === 'ready') return this.ovenTap();
    if (this.phase === 'mitts' && this.mitts) return tapMotion({ x: this.mitts.x, y: this.mitts.y }, this.k);
    if (this.phase === 'temp') {
      const P = this.params.panel!;
      const b = this.temp === P.target ? this.btnStart! : this.temp > P.target ? this.btnDown! : this.btnUp!;
      return tapMotion({ x: b.x, y: b.y }, this.k);
    }
    if (this.phase !== 'toOven') return null;
    const d = { x: this.dish.x, y: this.dish.y };
    const to = this.ovenPoint(ART.ovenPizza.x, ART.ovenPizza.y);
    const grip = { x: this.dish.R * 0.55, y: -this.dish.R * 0.35 };
    const small = ((ART.ovenPizza.diameter / 2) * this.os) / this.dish.R;
    // Her own pizza as a ghost (the capture is in game pixels; the stock dough needs the content scale).
    const made = this.scene.textures.exists(MADE_KEY);
    const key = made ? MADE_KEY : 'dough-flat';
    return {
      kind: 'grab',
      keys: [
        { x: d.x + grip.x, y: d.y + grip.y, t: 0 },
        { x: d.x + grip.x, y: d.y + grip.y, t: 350, press: true },
        { x: to.x + grip.x * small, y: to.y + grip.y * small, t: 1800 },
        { x: to.x + grip.x * small, y: to.y + grip.y * small, t: 2350 },
      ],
      props: [{ key, scale: made ? 1 : this.k, endScale: small * (made ? 1 : this.k), alpha: 0.55, dx: -grip.x, dy: -grip.y, fadeFrom: 1700 }],
      glow: d,
    };
  }

  /** The idle hint on the panel: "A bit hotter!" below the target, then the hand on the right button. */
  protected showHint() {
    if (this.phase === 'temp' && this.params.panel && this.temp < this.params.panel.target) {
      voice.say(this.params.panel.more, { valid: () => this.phase === 'temp', ttlMs: 2500 });
    }
    super.showHint();
  }

  /** Mom helps, whatever the moment: into the oven, set the number and start, put the mitts on, take it out. */
  protected autoFinish() {
    if (this.phase === 'toOven') {
      this.dragging = false;
      const grip = { x: this.dish.R * 0.55, y: -this.dish.R * 0.35 };
      this.hand.follow('grab', () => ({ x: this.dish.x + grip.x * this.dish.scaleX, y: this.dish.y + grip.y * this.dish.scaleY }));
      // The next moments get a fresh chance for her (the panel, the mitts, the door).
      this.resumeAfterAuto();
      this.intoOven();
    } else if (this.phase === 'temp') {
      const P = this.params.panel!;
      const one = () => {
        if (this.phase !== 'temp') return;
        const b = this.temp === P.target ? this.btnStart! : this.temp > P.target ? this.btnDown! : this.btnUp!;
        this.hand.play({ ...tapMotion({ x: b.x, y: b.y }, this.k), glow: undefined });
        this.scene.time.delayedCall(600, () => {
          boing(this.scene, b, 0.1);
          if (b === this.btnStart) {
            this.pressStart(true);
            this.resumeAfterAuto();
          } else this.press(b === this.btnUp ? 1 : -1, true);
        });
        if (b !== this.btnStart) this.scene.time.delayedCall(TUNING.help.tempEveryMs, one);
      };
      one();
    } else if (this.phase === 'mitts' && this.mitts) {
      // She puts the mitts on for her, then takes the pizza out.
      this.hand.play({ ...tapMotion({ x: this.mitts.x, y: this.mitts.y }, this.k), glow: undefined }, {
        onDone: () => {
          this.wearMitts();
          this.scene.time.delayedCall(400, () => this.hand.play(this.ovenTap(), { onDone: () => (this.resumeAfterAuto(), this.openOven()) }));
        },
      });
    } else if (this.phase === 'ready') {
      this.hand.play(this.ovenTap(), {
        onDone: () => {
          this.resumeAfterAuto();
          this.openOven();
        },
      });
    }
  }

  abort() {
    bakeLoop.stop();
    super.abort();
  }
}
