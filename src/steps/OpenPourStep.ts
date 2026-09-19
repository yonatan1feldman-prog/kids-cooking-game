import Phaser from 'phaser';
import { ART, IMAGES, type ImageKey } from '../core/assets';
import { voice } from '../core/audio';
import { boing, burst } from '../core/fx';
import { tapMotion, type HandMotion } from '../core/hand';
import { sfx } from '../core/sfx';
import { TUNING } from '../core/tuning';
import type { OpenPourParams } from '../recipes/types';
import { MADE_KEY, snapshotTexture } from './Dish';
import { BOWL_DEPTH, PrepBowl } from './PrepBowl';
import { Step } from './Step';
import { binIcon, binKey, binsWaiting, fillBin, iconScale, makeBin, parkBin } from './ToppingBin';

type Phase = 'open' | 'pour' | 'done';

/** How far the can or jar tips over while pouring (degrees). */
const TILT = 112;
/** At most this many pieces stay in the bowl (the rest of the pour falls in and melts into them). */
const MAX_IN_BOWL = 26;
/** A piece in the bowl, and one in the air (x k). */
const PIECE = 0.55;
const FALLING = 0.45;
/** A bin's mouth (its opening, in the 240x240 topping-bin frame). */
const BIN_MOUTH = { x: 120, y: 70 };

/** A glass to fill (glasses mode): the empty one, the full one over it cropped to how full it is. */
interface Glass {
  empty: Phaser.GameObjects.Image;
  full: Phaser.GameObjects.Image;
  poured: number;
  done: boolean;
}

/** One thing to pour: the can or jar, the oil bottle, a filled bin, the torn lettuce. */
interface Source {
  img: Phaser.GameObjects.Image;
  piece: ImageKey | 'fx-dot';
  /** Its mouth in its own frame, and how far it tips over the bowl. */
  mouth: { x: number; y: number };
  tilt: number;
  rest: { x: number; y: number };
  poured: number;
  done: boolean;
}

/**
 * Open and pour (reusable: a can of corn, a jar of olives, a bag of flour, a carton of milk...). Two phases:
 * - open: the closed can or jar stands on the counter left of the bowl. Can: a swipe up on the lid, or a few taps,
 *   opens it: the lid flies aside, the can shows open, can-open. Jar: rubbing sideways on the lid adds up (the jar
 *   rocks a little with each rub) until it opens: the lid comes off and goes down, jar-open.
 * - pour: she drags the open can or jar; over the bowl it tips over by itself and the pieces pour out of its mouth into
 *   the bowl, between the bowl's back and front layers, with the pour sound, for as long as she holds it there
 *   (TUNING.pour.ms in total; moving away stops it, coming back goes on). Let go anywhere: it goes back upright.
 * Then the contents go into the topping's bin, which waits for decorating.
 * `kind: 'open'` has only the pouring (an oil bottle). With `keep` the bowl is the big one that stays across steps (the
 * salad bowl) and its contents rise through `fills`; with `sources` several things wait on its left (the filled bins
 * and the torn lettuce) and each is poured in, in any order.
 */
export class OpenPourStep extends Step<OpenPourParams> {
  private sources: Source[] = [];
  /** The source being opened, held or poured. */
  private cur!: Source;
  private back!: Phaser.GameObjects.Image;
  private front!: Phaser.GameObjects.Image;
  private bowl?: PrepBowl;
  private lid?: Phaser.GameObjects.Image;
  private phase: Phase = 'open';
  private taps = 0;
  private twist = 0;
  private held = false;
  private grab = { dx: 0, dy: 0 };
  private start0 = { x: 0, y: 0 };
  private last = { x: 0, y: 0 };
  private over = false;
  private sinceDrop = 0;
  private inBowl: Phaser.GameObjects.Image[] = [];
  private helping = false;
  private k = 1;
  /** Glasses mode: the glasses (empty, the full one cropped over it as it fills) and how long each has been poured into. */
  private glasses: Glass[] = [];
  private glass?: Glass;

  /** The can or jar (the first source). */
  private get box() {
    return this.cur.img;
  }

  start() {
    const p = this.params;
    const opening = p.kind !== 'open';
    this.stepLine = opening ? p.openLine! : p.pourLine;
    const S = this.ctx.stage;
    const k = (this.k = this.layout.k);
    if (p.keep) {
      // The big bowl the step before left (or a new, empty one).
      this.workspace('none');
      this.bowl = PrepBowl.take(this.ctx) ?? new PrepBowl(this.ctx, p.bowl, null, p.keep.spot);
      this.back = this.bowl.back;
      this.front = this.bowl.front;
    } else {
      this.workspace(S.prepWide ? 'aside' : 'none');
      const b = S.pourBowl;
      this.back = this.own(this.scene.add.image(b.x, b.y, p.bowl.back).setScale(b.scale).setDepth(BOWL_DEPTH.back));
      this.front = this.own(this.scene.add.image(b.x, b.y, p.bowl.front).setScale(b.scale).setDepth(BOWL_DEPTH.front));
    }
    if (p.glasses) this.buildGlasses();
    else this.buildSources();
    this.cur = this.sources[0];
    this.phase = opening ? 'open' : 'pour';
    const entering = [
      ...(p.keep ? [] : [this.back, this.front]),
      ...this.sources.filter((s) => !s.img.getData('adopted') && !p.glasses).map((s) => s.img),
      ...this.glasses.flatMap((g) => [g.empty, g.full]),
    ];
    for (const o of entering) {
      o.setAlpha(0).setY(o.y + 100 * k);
      this.scene.tweens.add({ targets: o, alpha: 1, y: o.y - 100 * k, duration: 450, ease: 'Back.easeOut' });
    }

    this.onDown((q) => {
      if (this.phase === 'done') return;
      const s = this.phase === 'open' ? (this.onBox(this.cur, q.worldX, q.worldY) ? this.cur : null) : this.sourceAt(q.worldX, q.worldY);
      if (!s) return;
      this.cur = s;
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

  /** The things to pour, standing left of the bowl: the can or jar (or bottle), or what the steps before left. */
  private buildSources() {
    const p = this.params;
    const S = this.ctx.stage;
    if (!p.sources) {
      const r = S.pourRest;
      const kindTop = p.kind === 'jar' ? ART.prep.jarTop : ART.prep.canTop;
      const spot = this.restSpots(1)[0];
      // (a kept bowl on the pour spot: the thing waits where a can does)
      const inRoom = p.keep && !p.keep.spot;
      const at = inRoom ? spot : r;
      const scale = inRoom ? this.fitScale(p.closed, spot.w, spot.h) : r.scale;
      const img = this.own(this.scene.add.image(at.x, at.y, p.closed).setScale(scale).setDepth(6));
      this.sources.push({ img, piece: p.piece, mouth: p.mouth ?? kindTop, tilt: p.tilt ?? TILT, rest: { x: at.x, y: at.y }, poured: 0, done: false });
      return;
    }
    const list = p.sources.flatMap((s) =>
      s === 'chosen' ? this.ctx.run.chosen.map((o) => ({ handoff: binKey(o.topping), image: 'topping-bin' as ImageKey, piece: o.topping, tilt: undefined })) : [s],
    );
    const spots = this.restSpots(list.length);
    list.forEach((s, i) => {
      const at = spots[i];
      const isBin = s.handoff.startsWith('bin:') && s.image === 'topping-bin';
      const scale = this.fitScale(s.image, at.w, at.h);
      let img = this.adopt(s.handoff);
      if (img) {
        img.setData('adopted', true);
        const icon = binIcon(img);
        img.setVisible(true);
        icon?.setVisible(true);
        this.scene.tweens.killTweensOf([img, icon].filter((o) => !!o));
        this.scene.tweens.add({ targets: img, x: at.x, y: at.y, scale, duration: 550, ease: 'Sine.easeInOut' });
        img.setData({ restScaleX: scale, restScaleY: scale });
      } else {
        // (nothing was left for it, e.g. a dev jump straight to this step: a fresh one)
        img = this.own(isBin ? makeBin(this.scene, s.image, s.piece, at.x, at.y, scale) : this.scene.add.image(at.x, at.y, s.image).setScale(scale));
      }
      img.setDepth(6);
      binIcon(img)?.setDepth(6.1);
      const mouth = isBin ? BIN_MOUTH : { x: IMAGES[s.image].size[0] / 2, y: IMAGES[s.image].size[1] * 0.4 };
      this.sources.push({ img, piece: s.piece, mouth, tilt: s.tilt ?? (isBin ? TILT : 0), rest: { x: at.x, y: at.y }, poured: 0, done: false });
    });
  }

  /** Spots for n things in `stage.pourFrom` (two columns from three on), each with its room. */
  private restSpots(n: number) {
    const a = this.ctx.stage.pourFrom;
    const cols = n > 2 ? 2 : 1;
    const rows = Math.ceil(n / cols);
    const w = (a.x1 - a.x0) / cols;
    const h = (a.y1 - a.y0) / rows;
    return Array.from({ length: n }, (_, i) => ({ x: a.x0 + w * ((i % cols) + 0.5), y: a.y0 + h * (Math.floor(i / cols) + 0.5), w, h }));
  }

  /** As big as its room allows (with air), at most 0.8 (the size the bins are made at). */
  private fitScale(key: ImageKey, w: number, h: number) {
    const [iw, ih] = IMAGES[key].size;
    return Math.min(0.8 * this.k, (w * 0.82) / iw, (h * 0.82) / ih);
  }

  update(delta: number) {
    super.update(delta);
    for (const s of this.sources) this.syncIcon(s.img);
    if (this.phase !== 'pour' || !this.over) return;
    const s = this.cur;
    if (this.params.dropIn) return this.dropIn(s);
    if (this.params.glasses) return this.pourGlass(delta);
    s.poured += delta;
    this.sinceDrop += delta;
    while (this.sinceDrop > 85) {
      this.sinceDrop -= 85;
      this.dropPiece();
    }
    if (!this.helping) this.poke();
    if (s.poured >= this.params.pourMs) this.sourceDone(s);
  }

  /** A bin's topping rides on it (turned with it). */
  private syncIcon(img: Phaser.GameObjects.Image) {
    const icon = binIcon(img);
    if (!icon || !img.active) return;
    const v = new Phaser.Math.Vector2(0, -8 * img.scaleX).rotate(Phaser.Math.DegToRad(img.angle));
    icon.setPosition(img.x + v.x, img.y + v.y).setAngle(img.angle).setScale(iconScale(icon, img.scaleX), iconScale(icon, img.scaleY)).setDepth(img.depth + 0.1).setAlpha(img.alpha);
  }

  /** A thing to pour under the finger (with a generous margin), the nearest if several. */
  private sourceAt(x: number, y: number) {
    let best: Source | null = null;
    let bestD = Infinity;
    for (const s of this.sources) {
      if (s.done || !this.onBox(s, x, y)) continue;
      const d = Phaser.Math.Distance.Between(x, y, s.img.x, s.img.y);
      if (d < bestD) {
        bestD = d;
        best = s;
      }
    }
    return best;
  }

  /** The can or jar, with a generous margin. */
  private onBox(s: Source, x: number, y: number) {
    const b = s.img.getBounds();
    const pad = 45 * this.k;
    return x > b.x - pad && x < b.right + pad && y > b.y - pad && y < b.bottom + pad;
  }

  /** The bowl's opening (an ellipse; the same art as the prep bowl); in glasses mode the rim of the glass poured into. */
  opening() {
    if (this.params.glasses) return this.rimOf(this.glass ?? this.glasses.find((g) => !g.done) ?? this.glasses[0]);
    if (this.bowl) return this.bowl.opening();
    const o = ART.prep.bowlOpening;
    const [w, h] = IMAGES['prep-bowl-back'].size;
    const s = this.back.scaleX;
    return { x: this.back.x + (o.x - w / 2) * s, y: this.back.y + (o.y - h / 2) * s, rx: o.rx * s, ry: o.ry * s };
  }

  /** Where the can or jar is held to pour: up and to the left of the bowl's opening (as in the art agent's scene). */
  pourPoint() {
    const o = this.opening();
    if (this.params.glasses) {
      // The jar held so that, tipped, its lip is above the glass's rim.
      const lip = this.lipOffset(-(this.params.tilt ?? TILT));
      return { x: o.x - lip.x, y: o.y - 170 * this.k - lip.y };
    }
    // (a tall bowl, the blender jar: never above the top of the screen)
    if (this.bowl) return { x: o.x - o.rx * 0.6, y: Math.max(o.y - 250 * this.k, 210 * this.k) };
    return { x: o.x - o.rx * 0.95, y: o.y - 250 * this.back.scaleX };
  }

  /** Forgiving: anywhere above the bowl (its width, plus a margin toward the left), or near the pouring spot. */
  private isOver(x: number, y: number) {
    if (this.params.glasses) return this.overGlass();
    const o = this.opening();
    const pp = this.pourPoint();
    const near = Phaser.Math.Distance.Between(x, y, pp.x, pp.y) < 300 * (this.bowl ? this.k : this.back.scaleX);
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
    if (p.sound) sfx(this.scene, p.sound);
    const top = p.kind === 'can' ? ART.prep.canTop : ART.prep.jarTop;
    const [w, h] = IMAGES[p.closed].size;
    const s = this.box.scaleX;
    const at = { x: this.box.x + (top.x - w / 2) * s, y: this.box.y + (top.y - h / 2) * s };
    burst(this.scene, at.x, at.y, { count: 10, size: 18 * this.k, tint: [0xffffff, 0xffe066], speed: 380 * this.k, gravityY: 500 });
    if (p.lid) {
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
    }
    voice.say(p.pourLine, { valid: () => this.phase === 'pour', ttlMs: 4000 });
  }

  private setOver(on: boolean) {
    if (on === this.over) return;
    this.over = on;
    const dir = this.params.glasses ? -1 : this.box.x < this.opening().x ? 1 : -1;
    this.scene.tweens.add({ targets: this.box, angle: on ? this.cur.tilt * dir : 0, duration: on ? 320 : 250, ease: 'Sine.easeInOut' });
  }

  private putBack() {
    this.setOver(false);
    const r = this.cur.rest;
    sfx(this.scene, 'whoosh', { volume: 0.35 });
    this.scene.tweens.add({ targets: this.box, x: r.x, y: r.y, angle: 0, duration: 380, ease: 'Sine.easeOut', onComplete: () => this.box.setDepth(6) });
  }

  /** The mouth of the tipped can or jar (its top centre, turned with it). */
  private mouth() {
    const s = this.cur;
    const top = s.mouth;
    const [w, h] = [s.img.frame.realWidth, s.img.frame.realHeight];
    const sc = s.img.scaleX;
    const v = new Phaser.Math.Vector2((top.x - w / 2) * sc, (top.y + 20 - h / 2) * sc).rotate(Phaser.Math.DegToRad(s.img.angle));
    return { x: s.img.x + v.x, y: s.img.y + v.y };
  }

  /** One piece falls from the mouth into the bowl (always into it: nothing is spilled). */
  private dropPiece() {
    const k = this.k;
    const m = this.mouth();
    const o = this.opening();
    const a = Math.random() * Math.PI * 2;
    const rr = Math.sqrt(Math.random()) * 0.75;
    const to = { x: o.x + Math.cos(a) * o.rx * rr, y: o.y + 12 * k + Math.sin(a) * o.ry * rr };
    // (in the kept bowl every piece melts into the contents, which rise instead)
    const keep = !this.bowl && this.inBowl.length < MAX_IN_BOWL;
    const f = this.params.pieceSize ?? 1;
    const piece = this.scene.add.image(m.x, m.y, this.cur.piece).setScale(FALLING * k * f).setAngle(Phaser.Math.Between(0, 359)).setDepth(keep ? BOWL_DEPTH.contents : BOWL_DEPTH.contents + 0.01);
    if (this.params.pieceTint !== undefined) piece.setTint(this.params.pieceTint);
    if (keep) this.inBowl.push(this.own(piece));
    sfx(this.scene, this.params.pourSound ?? 'pour', { minGapMs: 1700, volume: 0.8, vary: false });
    this.scene.tweens.add({
      targets: piece,
      x: to.x,
      y: to.y,
      scale: (keep ? PIECE : FALLING) * k * f,
      angle: piece.angle + Phaser.Math.Between(-120, 120),
      duration: Phaser.Math.Between(300, 420),
      ease: 'Quad.easeIn',
      onComplete: () => {
        if (!keep) this.scene.tweens.add({ targets: piece, alpha: 0, duration: 150, onComplete: () => piece.destroy() });
      },
    });
  }

  /** The thing itself drops into the bowl and stays on the contents (the butter cube): the step is done. */
  private dropIn(s: Source) {
    if (s.done || !this.bowl) return;
    s.done = true;
    this.held = false;
    this.over = false;
    this.helping = false;
    this.phase = 'done';
    this.setIdle(false);
    this.hand.stop();
    this.poke();
    this.hit();
    this.scene.tweens.killTweensOf(s.img);
    this.handOff('dropped-in', s.img);
    this.ctx.run.handoff.delete('dropped-in');
    this.bowl.addExtra(this.params.dropIn!, s.img);
    sfx(this.scene, this.params.pourSound ?? 'pop');
    this.scene.time.delayedCall(330, () => {
      const o = this.opening();
      burst(this.scene, o.x, o.y, { count: 8, size: 16 * this.k, tint: [0xfff6e6, 0xffe07a], speed: 300 * this.k, gravityY: 600 });
      boing(this.scene, this.bowl!.front, 0.05);
    });
    this.scene.time.delayedCall(700, () => {
      this.bowl!.keep();
      this.complete();
    });
  }

  /** One thing is poured: upright again, back to its place (emptied ones fade); the bowl's contents rise. */
  private sourceDone(s: Source) {
    if (s.done) return;
    if (!this.params.keep) return this.pourDone();
    s.done = true;
    this.held = false;
    this.over = false;
    this.helping = false;
    this.hand.stop();
    this.poke();
    this.hit();
    this.scene.tweens.killTweensOf(s.img);
    this.scene.tweens.add({ targets: s.img, x: s.rest.x, y: s.rest.y, angle: 0, duration: 420, ease: 'Sine.easeInOut' });
    // (a bottle stays; emptied bins and the lettuce's board fade away)
    if (this.params.sources) this.scene.tweens.add({ targets: s.img, alpha: 0, delay: 350, duration: 300 });
    const fills = this.params.keep?.fills ?? [];
    const done = this.sources.filter((x) => x.done).length;
    if (fills.length && this.bowl) {
      const i = Phaser.Math.Clamp(Math.round((done / this.sources.length) * fills.length) - 1, 0, fills.length - 1);
      if (this.bowl.contents.texture.key !== fills[i] || !this.bowl.contents.visible) this.bowl.crossfade(fills[i], 350);
      boing(this.scene, this.bowl.front, 0.05);
      sfx(this.scene, 'pop', { volume: 0.6 });
    }
    if (done < this.sources.length) {
      this.cur = this.sources.find((x) => !x.done)!;
      return;
    }
    this.phase = 'done';
    this.setIdle(false);
    this.scene.time.delayedCall(650, () => {
      this.bowl!.keep();
      this.complete();
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
      const bin = makeBin(this.scene, p.bin!, p.topping!, o.x, o.y + 260 * this.back.scaleX, 0);
      const bs = 0.8 * this.k;
      this.scene.tweens.add({ targets: [bin], scale: bs, duration: 300, ease: 'Back.easeOut' });
      this.scene.tweens.add({ targets: [bin.getData('icon')], scale: iconScale(bin.getData('icon'), bs), duration: 300, ease: 'Back.easeOut' });
      const index = binsWaiting(this.ctx);
      this.inBowl.forEach((q) => q.setDepth(21));
      this.scene.time.delayedCall(320, () =>
        fillBin(this.scene, bin, this.inBowl.splice(0), () => {
          this.handOff(binKey(p.topping!), bin);
          parkBin(this.ctx, bin, index, () => this.complete());
        }),
      );
    });
  }

  // ---------------------------------------------------------------- glasses mode (the smoothie)

  /**
   * The kept jar becomes one picture (its back, contents and front) she can pick up and tip; the base stays on the
   * counter. The glasses stand on its left, side by side.
   */
  private buildGlasses() {
    const g = this.params.glasses!;
    const bowl = this.bowl!;
    const k = this.k;
    const S = this.ctx.stage;
    // The base and the jar go with this step (the base fades at its end; the jar is the picture below).
    bowl.parts.forEach((o) => this.own(o));
    const at = bowl.position;
    const img = this.own(this.scene.add.image(at.x, at.y, bowl.back.texture.key).setScale(bowl.scale).setDepth(6).setVisible(false));
    this.sources.push({ img, piece: this.params.piece, mouth: { x: 0, y: 0 }, tilt: this.params.tilt ?? TILT, rest: { ...at }, poured: 0, done: false });
    const copy = (o: Phaser.GameObjects.Image) => new Phaser.GameObjects.Image(this.scene, 0, 0, o.texture.key);
    snapshotTexture(this.scene, 'jar-made', 800, [copy(bowl.back), copy(bowl.contents), copy(bowl.front)]).then((ok) => {
      if (this.aborted) return;
      if (ok) img.setTexture('jar-made');
      img.setVisible(true);
      [bowl.back, bowl.contents, bowl.front, ...bowl.extras].forEach((o) => o.setVisible(false));
      // (its lip in the 800 square: the 600-wide jar sits in the middle)
      this.sources[0].mouth = { x: ART.smoothie.jarLip.x + (ok ? 100 : 0), y: ART.smoothie.jarLip.y - 20 };
    });
    // The glasses: side by side on the counter left of the blender (at most 0.8, never past the prep area's left edge).
    const [gw, gh] = IMAGES[g.empty].size;
    const baseLeft = S.blenderBase.x - 350 * S.blenderBase.scale;
    // (nothing waits in the left column now: the glasses may use it, up to the home button's column)
    const room = baseLeft - 380 * k - Math.min(S.prepArea.x0, S.home.x);
    const gs = Math.min(0.8 * k, room / (gw * 1.15 * g.count));
    const bottom = S.blenderBase.y + (520 / 2 - 30) * S.blenderBase.scale;
    for (let i = 0; i < g.count; i++) {
      const x = baseLeft - 380 * k - gw * gs * (0.5 + 1.15 * (g.count - 1 - i));
      const y = bottom - (gh / 2) * gs;
      const empty = this.own(this.scene.add.image(x, y, g.empty).setScale(gs).setDepth(5));
      const full = this.own(this.scene.add.image(x, y, g.full).setScale(gs).setDepth(5.1));
      full.setCrop(0, gh, gw, 0);
      this.glasses.push({ empty, full, poured: 0, done: false });
    }
  }

  /** A glass's rim (world). */
  private rimOf(g: Glass) {
    const r = ART.smoothie.glassRim;
    const [w, h] = IMAGES[g.empty.texture.key as ImageKey].size;
    const s = g.empty.scaleX;
    return { x: g.empty.x + (r.x - w / 2) * s, y: g.empty.y + (r.y - h / 2) * s, rx: r.rx * s, ry: r.ry * s };
  }

  /** Where the jar's lip is from its centre when it is turned by `angle` degrees. */
  private lipOffset(angle: number) {
    const s = this.cur?.img.scaleX ?? this.bowl!.scale;
    const lip = { x: ART.smoothie.jarLip.x - 300, y: ART.smoothie.jarLip.y - 400 };
    const v = new Phaser.Math.Vector2(lip.x * s, lip.y * s).rotate(Phaser.Math.DegToRad(angle));
    return { x: v.x, y: v.y };
  }

  /** Over a glass that is not full yet: the one its (tipped) lip is nearest to, when it is anywhere above the glasses. */
  private overGlass() {
    const lip = this.lipOffset(-(this.params.tilt ?? TILT));
    const lx = this.box.x + lip.x;
    let best: Glass | undefined;
    let bestD = Infinity;
    for (const g of this.glasses) {
      if (g.done) continue;
      const d = Math.abs(this.rimOf(g).x - lx);
      if (d < bestD) {
        bestD = d;
        best = g;
      }
    }
    if (!best) return false;
    const rim = this.rimOf(best);
    const on = bestD < 230 * this.k && this.box.y + lip.y < rim.y + 40 * this.k;
    if (on) this.glass = best;
    return on;
  }

  /** Pouring into the glass it is over: a stream from the lip, the glass fills from the bottom up; then the next one. */
  private pourGlass(delta: number) {
    if (!this.glass) this.overGlass();
    const g = this.glass;
    if (!g || g.done) return;
    const p = this.params;
    g.poured += delta;
    this.sinceDrop += delta;
    while (this.sinceDrop > 45) {
      this.sinceDrop -= 45;
      this.dropPiece();
    }
    if (!this.helping) this.poke();
    const f = Math.min(1, g.poured / p.pourMs);
    const [w, h] = IMAGES[p.glasses!.full].size;
    const top = ART.smoothie.fillBottom - (ART.smoothie.fillBottom - ART.smoothie.fillTop) * f;
    g.full.setCrop(0, top, w, h - top);
    if (f < 1) return;
    // Full: the whole glass (the straw and the foam show), a pop; the jar turns upright until it is over the next one.
    g.done = true;
    g.full.setCrop();
    boing(this.scene, g.full, 0.08);
    boing(this.scene, g.empty, 0.08);
    sfx(this.scene, 'pop', { volume: 0.6 });
    this.hit();
    this.glass = undefined;
    this.setOver(false);
    if (this.glasses.some((x) => !x.done)) {
      // (Mom's help carries it on to the next glass)
      if (this.helping) this.scene.time.delayedCall(350, () => this.helpPour());
      return;
    }
    this.glassesDone();
  }

  /** Both full: the jar goes back onto its base, the glasses become her pieces to share and the photo's picture. */
  private glassesDone() {
    const s = this.cur;
    s.done = true;
    this.phase = 'done';
    this.held = false;
    this.helping = false;
    this.setIdle(false);
    this.hand.stop();
    this.scene.tweens.killTweensOf(s.img);
    this.scene.tweens.add({ targets: s.img, x: s.rest.x, y: s.rest.y, angle: 0, duration: 420, ease: 'Sine.easeInOut' });
    const home = this.ctx.stage.dishHome;
    this.ctx.run.pieces = this.glasses.map((g) => ({ key: g.full.texture.key, x: g.full.x - home.x, y: g.full.y - home.y, scale: g.full.scaleX, tint: 0xffffff }));
    // The photo: the full glasses side by side.
    const gs = 0.85;
    const [w, h] = IMAGES[this.params.glasses!.full].size;
    const n = this.glasses.length;
    const objs = this.glasses.map((g, i) => new Phaser.GameObjects.Image(this.scene, (i - (n - 1) / 2) * w * 0.95 * gs, 0, g.full.texture.key).setScale(gs));
    if (this.scene.textures.exists(MADE_KEY)) this.scene.textures.remove(MADE_KEY);
    snapshotTexture(this.scene, MADE_KEY, Math.ceil(Math.max(w * 0.95 * n, h) * gs * 1.05), objs).then(() => {
      if (this.aborted) return;
      this.scene.time.delayedCall(450, () => !this.aborted && this.complete());
    });
  }

  /** Open: Mom's finger taps the can's lid, or her hand turns the jar's lid. Pour: she carries a see-through copy over the bowl, tipping it. */
  protected demo(): HandMotion | null {
    const k = this.k;
    if (this.phase === 'open') {
      const top = this.params.kind === 'can' ? ART.prep.canTop : ART.prep.jarTop;
      const [w, h] = IMAGES[this.params.closed].size;
      const s = this.box.scaleX;
      const lid = { x: this.box.x + (top.x - w / 2) * s, y: this.box.y + (top.y - h / 2) * s };
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
    const src = this.sources.find((x) => !x.done && x === this.cur) ?? this.sources.find((x) => !x.done);
    if (!src) return null;
    const box = src.img;
    const pp = this.pourPoint();
    const dir = box.x < this.opening().x ? 1 : -1;
    const key = box.texture.key as ImageKey;
    return {
      kind: 'grab',
      keys: [
        { x: box.x, y: box.y, t: 0 },
        { x: box.x, y: box.y, t: 350, press: true },
        { x: pp.x, y: pp.y, t: 1500 },
        { x: pp.x, y: pp.y, t: 2400 },
      ],
      props: [{ key, scale: box.scaleX, alpha: 0.55, angle: 0, endAngle: src.tilt * dir, turnFrom: 1300 }],
      glow: { x: box.x, y: box.y },
    };
  }

  /** Mom helps: she opens it, then her hand carries it (each one left) over the bowl and pours. */
  protected autoFinish() {
    if (this.held) this.putBack();
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
    if (this.phase !== 'pour' || this.aborted) return;
    const s = this.sources.find((x) => !x.done);
    if (!s) return;
    this.cur = s;
    this.helping = true;
    const pp = this.pourPoint();
    this.hand.follow('grab', () => ({ x: s.img.x, y: s.img.y }));
    this.scene.tweens.killTweensOf(s.img);
    s.img.setDepth(12);
    this.scene.tweens.add({
      targets: s.img,
      x: pp.x,
      y: pp.y,
      duration: TUNING.help.openMs / 2,
      ease: 'Sine.easeInOut',
      onComplete: () => this.setOver(true),
    });
    // The next one after this one is poured.
    if (this.params.keep && this.sources.filter((x) => !x.done).length > 1) {
      const wait = () => {
        if (this.aborted || this.phase !== 'pour') return;
        if (s.done) return this.scene.time.delayedCall(450, () => this.helpPour());
        this.scene.time.delayedCall(150, wait);
      };
      wait();
    }
  }
}
