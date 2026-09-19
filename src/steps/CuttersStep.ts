import Phaser from 'phaser';
import { FX_SOFT, IMAGES } from '../core/assets';
import { countKey, voice } from '../core/audio';
import { boing, puff, stars } from '../core/fx';
import type { HandMotion } from '../core/hand';
import { sfx } from '../core/sfx';
import type { CutterParams } from '../recipes/types';
import { Step } from './Step';

interface Cutter {
  def: CutterParams['cutters'][number];
  img: Phaser.GameObjects.Image;
  glow: Phaser.GameObjects.Image;
  x: number;
  y: number;
  s: number;
}

/** How high the picked cutter stays lifted (x k), and how far a cutter's touch area reaches beyond it (x k). */
const LIFT = 18;
const REACH = 30;
/** The pressed-in outline under a cookie on the sheet (so the cut shows on dough of the same colour). */
const CUT_SHADE = 0x8a5a2e;

/**
 * Cutters (reusable: cookies, biscuits, sandwiches, anything stamped out). The rolled sheet lies in the middle (the dish's
 * base, left by rolling), the big cutters stand in the left column where the bins go. A tap on a cutter picks it: it
 * lifts a little with a soft glow and Mom says its name ("A star!"). A tap anywhere on the dough presses it into the free
 * slot nearest the finger: the cutter comes down over that slot and presses (stamp, Mom counts) and a cookie of its shape
 * stays on the sheet, with the cut showing around it. She may change the cutter between presses; a tap on the dough
 * before any is picked uses the next one. When every slot has its cookie they hop onto the baking tray (the same slots)
 * and the tray is the dish from then on. She can't fail: every tap on the dough makes a cookie. Mom's demo: her hand
 * taps a cutter, then presses on the dough ("Press it into the dough!"); the 5 s hint shows it again; her help picks and
 * presses the rest, a different shape each time.
 */
export class CuttersStep extends Step<CutterParams> {
  private cutters: Cutter[] = [];
  private picked: Cutter | null = null;
  private filled: boolean[] = [];
  private busy = false;
  private finishing = false;
  private k = 1;
  /** The sheet's scale on screen (x k) = the cutter's and the cookie's scale on it. */
  private ss = 1;

  start() {
    const p = this.params;
    this.stepLine = p.line;
    this.k = this.layout.k;
    this.ss = p.size * this.k;
    this.filled = p.slots.map(() => false);
    this.workspace('dish');
    // (the sheet rolling left; a fresh one on a dev jump)
    if (this.dish.base?.texture.key !== p.sheet) this.dish.setBase(p.sheet, p.size);

    const S = this.ctx.stage;
    const n = p.cutters.length;
    const cell = (S.binScale(n) * 240) / IMAGES[p.cutters[0].cutter].size[0];
    p.cutters.forEach((def, i) => {
      const { x, y } = S.bin(i, n);
      const s = cell * 1.15;
      const glow = this.own(this.scene.add.image(x, y, FX_SOFT).setDepth(2.5).setTint(0xffe066).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0));
      glow.setScale((IMAGES[def.cutter].size[0] * s * 1.3) / glow.frame.realWidth);
      const img = this.own(this.scene.add.image(x, y, def.cutter).setDepth(3).setScale(0));
      this.scene.tweens.add({ targets: img, scale: s, duration: 400, delay: i * 70, ease: 'Back.easeOut' });
      img.setData({ restScaleX: s, restScaleY: s });
      this.cutters.push({ def, img, glow, x, y, s });
    });

    this.onDown((q) => {
      if (this.finishing || this.isAuto) return;
      const c = this.cutterAt(q.worldX, q.worldY);
      if (c) return this.pick(c);
      if (this.onSheet(q.worldX, q.worldY)) this.stamp(this.nearestFree(q.worldX, q.worldY));
    });
    this.setIdle(true);
  }

  /** The nearest cutter whose drawing (plus a margin) is under the finger. */
  private cutterAt(x: number, y: number) {
    let best: Cutter | null = null;
    let bestD = Infinity;
    for (const c of this.cutters) {
      const r = (IMAGES[c.def.cutter].size[0] * c.s) / 2 + REACH * this.k;
      if (Math.abs(x - c.x) > r || Math.abs(y - c.y) > r) continue;
      const d = Phaser.Math.Distance.Between(x, y, c.x, c.y);
      if (d < bestD) {
        bestD = d;
        best = c;
      }
    }
    return best;
  }

  /** Anywhere on the sheet, with a generous margin. */
  private onSheet(x: number, y: number) {
    const b = this.dish.base?.getBounds();
    if (!b) return false;
    const pad = 40 * this.k;
    return x > b.x - pad && x < b.right + pad && y > b.y - pad && y < b.bottom + pad;
  }

  /** A slot's centre on screen. */
  private slotAt(j: number) {
    const [w, h] = IMAGES[this.params.sheet].size;
    const [sx, sy] = this.params.slots[j];
    return this.dish.toWorld((sx - w / 2) * this.ss, (sy - h / 2) * this.ss);
  }

  private nearestFree(x: number, y: number) {
    let best = -1;
    let bestD = Infinity;
    this.filled.forEach((f, j) => {
      if (f) return;
      const c = this.slotAt(j);
      const d = Phaser.Math.Distance.Between(x, y, c.x, c.y);
      if (d < bestD) {
        bestD = d;
        best = j;
      }
    });
    return best;
  }

  /** Picks a cutter: it lifts, glows, Mom says its name. The one picked before goes back down. */
  private pick(c: Cutter, byHelp = false) {
    this.poke();
    if (!byHelp) this.hand.stop();
    sfx(this.scene, 'pop', { volume: 0.7 });
    boing(this.scene, c.img, 0.12);
    if (this.picked === c) return;
    this.hit();
    const old = this.picked;
    this.picked = c;
    if (old) {
      this.scene.tweens.add({ targets: old.img, y: old.y, duration: 200, ease: 'Sine.easeOut' });
      this.scene.tweens.add({ targets: old.glow, alpha: 0, duration: 200 });
    }
    this.scene.tweens.add({ targets: c.img, y: c.y - LIFT * this.k, duration: 220, ease: 'Back.easeOut' });
    this.scene.tweens.add({ targets: c.glow, alpha: 0.8, duration: 220 });
    voice.say(c.def.name, { group: 'name', ttlMs: 2500 });
  }

  /** The cutter comes down over slot j and presses: stamp, Mom counts, the cookie stays on the sheet. */
  private stamp(j: number, byHelp = false) {
    if (this.busy || j < 0 || this.filled[j]) return;
    // Nothing picked yet: the next one (a different shape each time Mom helps).
    if (!this.picked) this.pick(this.cutters[this.filled.filter((f) => f).length % this.cutters.length], byHelp);
    const c = this.picked!;
    this.busy = true;
    this.filled[j] = true;
    this.poke();
    this.hit();
    if (!byHelp) this.hand.stop();
    const to = this.slotAt(j);
    const pr = this.params.press;
    const [cw, ch] = IMAGES[c.def.cutter].size;
    const ghost = this.own(this.scene.add.image(c.img.x, c.img.y, c.def.cutter).setScale(c.s).setDepth(30));
    ghost.setOrigin(pr.x / cw, pr.y / ch);
    const half = this.params.pressMs / 2;
    this.scene.tweens.add({
      targets: ghost,
      x: to.x,
      y: to.y - 60 * this.ss,
      scale: this.ss,
      duration: half * 0.6,
      ease: 'Sine.easeOut',
      onComplete: () =>
        this.scene.tweens.add({
          targets: ghost,
          y: to.y,
          duration: half * 0.4,
          ease: 'Quad.easeIn',
          onComplete: () => this.pressed(j, c, ghost, to),
        }),
    });
  }

  private pressed(j: number, c: Cutter, ghost: Phaser.GameObjects.Image, to: { x: number; y: number }) {
    if (this.aborted) return;
    sfx(this.scene, this.params.sound);
    const n = this.filled.filter((f) => f).length;
    voice.say(countKey(n), { group: 'count', sequence: true, ttlMs: 5000 });
    this.addCookie(j, c.def.cookie);
    puff(this.scene, to.x, to.y + 40 * this.ss, 0xfff6e6, 4, 90 * this.k);
    const half = this.params.pressMs / 2;
    // A little squash as it presses, then up and away.
    this.scene.tweens.add({ targets: ghost, scaleY: this.ss * 0.9, duration: 80, yoyo: true });
    this.scene.tweens.add({ targets: ghost, y: to.y - 90 * this.ss, alpha: 0, delay: 160, duration: half * 0.6, ease: 'Sine.easeIn', onComplete: () => ghost.destroy() });
    this.scene.time.delayedCall(120, () => (this.busy = false));
    if (this.filled.every((f) => f)) this.scene.time.delayedCall(700, () => this.toTray());
  }

  /** A cookie of the cutter's shape on the sheet, the pressed-in cut showing around it. */
  private addCookie(j: number, key: string) {
    const [w, h] = IMAGES[this.params.sheet].size;
    const [sx, sy] = this.params.slots[j];
    const x = (sx - w / 2) * this.ss;
    const y = (sy - h / 2) * this.ss;
    const cut = new Phaser.GameObjects.Image(this.scene, x, y + 4 * this.ss, key).setScale(this.ss * 1.03).setTint(CUT_SHADE).setAlpha(0.5);
    cut.setData('cut', true);
    const cookie = new Phaser.GameObjects.Image(this.scene, x, y - 3 * this.ss, key).setScale(this.ss);
    cookie.setData({ slot: j, key });
    this.dish.cookies.add([cut, cookie]);
    boing(this.scene, cookie, 0.08);
  }

  /** Every slot has its cookie: they hop onto the tray (the same slots), the rest of the dough goes. */
  private toTray() {
    if (this.finishing || this.aborted) return;
    this.finishing = true;
    this.setIdle(false);
    this.hand.stop();
    const p = this.params;
    voice.say(p.trayLine, { ttlMs: 4000 });
    this.cutters.forEach((c, i) => this.scene.tweens.add({ targets: [c.img, c.glow], alpha: 0, delay: i * 60, duration: 300 }));
    const sheet = this.dish.base!;
    const tray = new Phaser.GameObjects.Image(this.scene, 0, 0, p.tray).setScale(this.ss).setAlpha(0);
    this.dish.addAt(tray, 1);
    const cookies = this.dish.cookies.list as Phaser.GameObjects.Image[];
    for (const o of cookies.filter((o) => o.getData('cut'))) this.scene.tweens.add({ targets: o, alpha: 0, duration: 250 });
    cookies
      .filter((o) => !o.getData('cut'))
      .forEach((o, i) => this.scene.tweens.add({ targets: o, y: o.y - 50 * this.k, duration: 260, delay: 120 + i * 70, yoyo: true, ease: 'Quad.easeOut' }));
    this.scene.tweens.add({ targets: sheet, alpha: 0, delay: 250, duration: 400 });
    this.scene.tweens.add({ targets: tray, alpha: 1, delay: 250, duration: 400 });
    sfx(this.scene, 'whoosh', { volume: 0.6 });
    this.scene.time.delayedCall(1000, () => {
      if (this.aborted) return;
      tray.destroy();
      this.dish.setBase(p.tray, p.size);
      for (const o of cookies.filter((o) => o.getData('cut'))) o.destroy();
      sfx(this.scene, 'pop');
      stars(this.scene, this.dish.x, this.dish.y, 10, 70 * this.k);
      this.scene.time.delayedCall(350, () => this.complete());
    });
  }

  /** Mom's hand taps a cutter (the next one), then presses on the dough over a free slot. */
  protected demo(): HandMotion | null {
    if (this.finishing) return null;
    const j = this.filled.indexOf(false);
    if (j < 0) return null;
    const s = this.slotAt(j);
    if (this.picked) {
      return {
        kind: 'press',
        keys: [
          { x: s.x + 60 * this.k, y: s.y - 60 * this.k, t: 0 },
          { x: s.x, y: s.y, t: 500 },
          { x: s.x, y: s.y, t: 800, press: true },
          { x: s.x, y: s.y - 40 * this.k, t: 1300 },
          { x: s.x, y: s.y, t: 1700, press: true },
          { x: s.x + 60 * this.k, y: s.y - 60 * this.k, t: 2300 },
        ],
        glow: s,
      };
    }
    const c = this.cutters[1] ?? this.cutters[0];
    return {
      kind: 'press',
      keys: [
        { x: c.x + 40 * this.k, y: c.y + 40 * this.k, t: 0 },
        { x: c.x, y: c.y, t: 350 },
        { x: c.x, y: c.y, t: 600, press: true },
        { x: s.x, y: s.y - 40 * this.k, t: 1500 },
        { x: s.x, y: s.y, t: 1850, press: true },
        { x: s.x + 60 * this.k, y: s.y - 60 * this.k, t: 2400 },
      ],
      glow: { x: c.x, y: c.y },
    };
  }

  /** "Press it into the dough!" goes with Mom's demo. */
  protected onDemoStart() {
    voice.say(this.params.stampLine, { valid: () => !this.finishing, ttlMs: 4000 });
  }

  /** Mom helps: her hand picks a cutter and presses, a different shape each time, until every slot has its cookie. */
  protected autoFinish() {
    let at: { x: number; y: number } | null = null;
    this.hand.follow('press', () => at);
    const one = () => {
      if (this.aborted || this.finishing) return;
      const j = this.filled.indexOf(false);
      if (j < 0) return;
      if (this.busy) return void this.scene.time.delayedCall(150, one);
      const c = this.cutters[this.filled.filter((f) => f).length % this.cutters.length];
      at = { x: c.x, y: c.y };
      this.pick(c, true);
      this.scene.time.delayedCall(400, () => {
        if (this.aborted) return;
        at = this.slotAt(j);
        this.stamp(j, true);
        this.scene.time.delayedCall(this.params.pressMs + 350, one);
      });
    };
    one();
  }
}
