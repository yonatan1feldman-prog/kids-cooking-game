import Phaser from 'phaser';
import { ART, IMAGES } from '../core/assets';
import { countKey, voice, type VoiceKey } from '../core/audio';
import { boing, burst, setRestScale, stars } from '../core/fx';
import { GUESTS, guestLayers, type GuestDef } from '../core/guests';
import { tapMotion, type HandMotion } from '../core/hand';
import { sfx } from '../core/sfx';
import { tasteOf } from '../core/tastes';
import { TUNING } from '../core/tuning';
import type { ShareParams } from '../recipes/types';
import { loadImages, releaseImages } from '../scenes/BootScene';
import type { Character } from './Character';
import { Guest } from './Guest';
import { PrepBowl } from './PrepBowl';
import { cutSlices, stockSlices, type SliceDef } from './slices';
import { Step } from './Step';

interface Slice {
  img: Phaser.GameObjects.Image;
  def: SliceDef;
  home: { x: number; y: number };
  eaten: boolean;
  /** What is on it (image keys): Pipa's taste of it (core/tastes.ts). */
  contents: string[];
}

type Who = 'mom' | 'pet' | 'guest';

/** A carried slice is shown a little bigger. */
const LIFT = 1.08;
/** Slices spread apart a little so the cuts show. */
const EXPLODE = 12;
/** A slice counts when the finger (or its tip) is this near a mouth (x k). Very forgiving. */
const MOUTH_REACH = 380;
/** The one a slice comes this near to opens wide. */
const EXPECT_REACH = 650;
const CHEW_MS = 1050;
/** A guest's badge: its touch reach beyond the drawing (x k). */
const CARD_REACH = 30;
/** Portions: the big bowl they come from (x k, at most), a portion, the serving bowls in front of Mom and of Pipa. */
const BIG_BOWL = 0.66;
const PORTION = 0.6;
const SERVE_MOM = 0.6;
const SERVE_PET = 0.52;
/** Cutting: the knife's size (x k), how thick the cut shows (x k). */
const KNIFE = 0.45;
const CUT_W = 5;

/** A serving bowl in front of one of them, and the salad that shows in it once she has put some in. */
interface Serving {
  bowl: Phaser.GameObjects.Image;
  fill: Phaser.GameObjects.Image;
  /** Its opening's centre (where a portion lands). */
  at: { x: number; y: number };
  fillScale: number;
}

/**
 * Share (reusable: any dish cut into pieces, shared between Mom and the pet). Her own pizza is cut into slices on the
 * board; Pipa comes to the board's right rim, big, and Mom steps aside so both can eat (the feeding layout of the
 * stage table). She drags each slice to Mom's mouth or to Pipa's. The one it comes near looks surprised and opens
 * wide; the other keeps smiling. Mom chews (mom-mouth-chew, happy eyes), Pipa munches with her happy gags. Any sharing
 * is fine, all to one of them too: nobody is ever sad about not getting one. The hint (and Mom's help) carries a slice
 * to whoever has had fewer. First slice for Mom: "A slice for Mommy!" and her "Mmm, yummy!"; for Pipa: "A slice for
 * Pipa!". When all are eaten the step ends (the finale, with the photo, is its own step).
 * With `portions` (a salad) she shares portions from the big bowl instead: each is dragged to the serving bowl in front
 * of Mom or of Pipa, lands in it (the salad shows in the bowl) and that one eats (`eat`, e.g. crunch).
 * The guests round: first she picks who comes to eat with them (core/guests.ts): three badges in the left column, "Who's
 * coming to eat with us?". A tap invites one (after `TUNING.guests.bringAfterMs` with no pick, Pipa brings one: her
 * bubble shows it, "Pipa brought a friend!"). The guest comes in ("Look, Giraffe is here!") and stands left of the dish,
 * a third mouth: a piece let go near her is hers, she chews in her own way and answers with her own funny moment. The
 * hint and Mom's help give the guest her share too. When all is eaten she says goodbye the way she came.
 */
export class ShareStep extends Step<ShareParams> {
  private slices: Slice[] = [];
  private held?: Slice;
  private fed: Record<Who, number> = { mom: 0, pet: 0, guest: 0 };
  /** The guest who came, once she has arrived (a third mouth); the badges while she is being picked. */
  private guest?: Guest;
  private guestIn = false;
  private picking = true;
  private cards: { img: Phaser.GameObjects.Image; g: GuestDef; scale: number }[] = [];
  private layersIn?: Promise<void>;
  private bringTimer?: Phaser.Time.TimerEvent;
  private busy = 0;
  private sliceScale = 1;
  private k = 1;
  private done = false;
  private serving: Partial<Record<Who, Serving>> = {};
  // cutting (params.cut): she cuts the dish herself before sharing it
  private cutting = false;
  private knife?: Phaser.GameObjects.Image;
  private guide?: Phaser.GameObjects.Graphics;
  private cutsG?: Phaser.GameObjects.Graphics;
  private cutsDone = 0;
  private cutHeld = false;
  private cutBusy = false;
  private travel = 0;
  private last = { x: 0, y: 0 };

  private get portions() {
    return this.params.portions;
  }

  /** Carried upright (a portion on its spoon, a whole cookie), not tip first like a slice. */
  private get upright() {
    return !!this.portions || !!this.params.pieces;
  }

  start() {
    this.stepLine = 'vo-guest-who';
    this.cutting = !!this.params.cut && !this.portions && !this.params.pieces;
    if (this.cutting) this.stepLine = this.params.cut!.line;
    this.k = this.layout.k;
    this.workspace('dish', 400);
    this.ctx.character.moveTo(this.ctx.stage.feedPet);
    // Mom's pointing arm lifts a little so it tucks behind Pipa, and she steps aside to make room (her face in view).
    this.ctx.mom.armTo(-18);
    this.ctx.mom.stepAside(this.ctx.stage.feedMomShift);
    if (this.portions) this.buildPortions();
    else if (this.params.pieces) this.buildPieces();
    else if (this.cutting) this.buildCut();
    else this.buildSlices();

    // (who comes to eat is asked once the dish is cut)
    if (!this.cutting) this.showCards();

    this.onDown((p) => {
      if (this.cutting) return this.cutDown(p.worldX, p.worldY);
      if (this.held || this.done) return;
      if (this.picking) {
        const c = this.cardAt(p.worldX, p.worldY);
        if (c) {
          this.hit();
          this.invite(c.g, false);
        } else this.miss();
        return;
      }
      const s = this.sliceAt(p.worldX, p.worldY);
      if (!s) return;
      this.poke();
      sfx(this.scene, 'tap');
      this.scene.tweens.killTweensOf(s.img);
      s.img.setDepth(30);
      const pose = this.carryPose(s, p.worldX, p.worldY);
      const angle = s.img.angle + Phaser.Math.Angle.ShortestBetween(s.img.angle, pose.angle);
      this.scene.tweens.add({ targets: s.img, scale: this.sliceScale * LIFT, x: pose.x, y: pose.y, angle, duration: 160 });
      this.held = s;
    });
    this.onMove((p) => {
      if (this.cutting) return this.cutMove(p.worldX, p.worldY);
      const s = this.held;
      if (!s) return;
      this.scene.tweens.killTweensOf(s.img);
      const pose = this.carryPose(s, p.worldX, p.worldY);
      s.img.setScale(this.sliceScale * LIFT).setPosition(pose.x, pose.y);
      s.img.setAngle(s.img.angle + Phaser.Math.Angle.ShortestBetween(s.img.angle, pose.angle) * 0.35);
      this.poke();
      this.expectFrom(p.worldX, p.worldY);
    });
    this.onUp((p, cancelled) => {
      if (this.cutting) return this.cutUp();
      const s = this.held;
      if (!s) return;
      this.held = undefined;
      const who = cancelled ? null : this.receiver(p.worldX, p.worldY, s.img.x, s.img.y);
      if (who) {
        this.hit();
        this.feed(s, who);
      } else {
        if (!cancelled) this.miss();
        this.expectFrom(null);
        this.sendHome(s);
      }
    });
    this.setIdle(true);
  }

  /** Cuts the pizza she made; falls back to the stock slice art if the capture failed. */
  private buildSlices() {
    const n = this.params.slices;
    const center = { x: this.dish.x, y: this.dish.y };
    const img = this.dish.madeImage;
    const defs = img ? cutSlices(this.scene, img, n, 4 * this.k, this.params.cutRadius) : stockSlices(n, this.k);
    this.sliceScale = img ? 1 : this.k;
    // Carry over the baked color (the capture was taken before baking).
    const tint = this.dish.base?.tintTopLeft ?? 0xffffff;
    for (const def of defs) {
      const a = Phaser.Math.DegToRad(def.midAngle);
      const home = { x: center.x + Math.cos(a) * EXPLODE * this.k, y: center.y + Math.sin(a) * EXPLODE * this.k };
      const s = this.own(this.scene.add.image(center.x, center.y, def.key));
      s.setOrigin(def.originX, def.originY).setAngle(def.restAngle).setDepth(20).setScale(this.sliceScale).setTint(tint);
      this.scene.tweens.add({ targets: s, x: home.x, y: home.y, duration: 350, delay: 150, ease: 'Back.easeOut' });
      // (what she put on this wedge: the things whose angle from the centre falls inside it)
      const half = 180 / n;
      const contents = this.dish.placed
        .filter((t) => Math.abs(Phaser.Math.Angle.WrapDegrees(Phaser.Math.RadToDeg(Math.atan2(t.y, t.x)) - def.midAngle)) <= half)
        .map((t) => t.key);
      this.slices.push({ img: s, def, home, eaten: false, contents });
    }
    this.dish.setVisible(false);
    sfx(this.scene, 'whoosh', { volume: 0.6 });
  }

  // ------------------------------------------------------------------ cutting (params.cut)

  /** The cut lines, in order: diameters for an even number of slices (6 slices: 3 cuts), else one radius per slice. */
  private cutLines() {
    const n = this.params.slices;
    const R = this.dish.R * this.dish.scaleX * (this.params.cutRadius ?? 1) * 0.94;
    const c = { x: this.dish.x, y: this.dish.y };
    const count = n % 2 ? n : n / 2;
    const out: { a: { x: number; y: number }; b: { x: number; y: number } }[] = [];
    for (let i = 0; i < count; i++) {
      const ang = Phaser.Math.DegToRad(-90 + 180 / n + (i * 360) / n);
      const e = { x: c.x + Math.cos(ang) * R, y: c.y + Math.sin(ang) * R };
      const o = n % 2 ? c : { x: c.x - Math.cos(ang) * R, y: c.y - Math.sin(ang) * R };
      // The knife starts at the lower end (its handle stands up over the dish, on screen), else the left one.
      const aFirst = o.y > e.y + 1 || (Math.abs(o.y - e.y) <= 1 && o.x < e.x);
      out.push(aFirst ? { a: o, b: e } : { a: e, b: o });
    }
    return out;
  }

  /** The whole dish waits on its board, the knife beside the first cut line, shown by a dotted guide. */
  private buildCut() {
    const k = this.k;
    const P = this.params.cut!;
    this.cutsG = this.own(this.scene.add.graphics().setDepth(11));
    this.guide = this.own(this.scene.add.graphics().setDepth(11.5));
    this.knife = this.own(this.scene.add.image(0, 0, P.knife).setOrigin(ART.prep.knifeTip.x / 240, ART.prep.knifeTip.y / 640).setScale(KNIFE * k).setDepth(26).setAlpha(0));
    this.scene.time.delayedCall(420, () => {
      if (!this.cutting) return;
      this.drawGuide();
      this.restKnife(true);
      this.scene.tweens.add({ targets: this.knife, alpha: 1, duration: 300 });
    });
  }

  /** The next cut, as soft dots across the dish (where the knife will go; she need not follow them). */
  private drawGuide() {
    const g = this.guide;
    if (!g) return;
    g.clear();
    const l = this.cutLines()[this.cutsDone];
    if (!l) return;
    const d = Phaser.Math.Distance.Between(l.a.x, l.a.y, l.b.x, l.b.y);
    const n = Math.max(2, Math.floor(d / (34 * this.k)));
    for (let i = 0; i <= n; i++) {
      const x = Phaser.Math.Linear(l.a.x, l.b.x, i / n);
      const y = Phaser.Math.Linear(l.a.y, l.b.y, i / n);
      g.fillStyle(0x6b3b1f, 0.35).fillCircle(x, y, 7 * this.k);
      g.fillStyle(0xffffff, 0.85).fillCircle(x, y, 4.5 * this.k);
    }
  }

  /** The knife's tip, kept low enough for its handle to stay on screen. */
  private knifeAt(x: number, y: number) {
    if (!this.knife) return;
    const top = ART.prep.knifeTip.y * this.knife.scaleY + 8 * this.k;
    this.knife.setPosition(x, Math.max(y, top));
  }

  private restKnife(now = false) {
    const l = this.cutLines()[this.cutsDone];
    if (!this.knife || !l) return;
    const at = { x: l.a.x - 20 * this.k, y: l.a.y + 10 * this.k };
    if (now) this.knifeAt(at.x, at.y);
    else this.scene.tweens.add({ targets: this.knife, x: at.x, y: Math.max(at.y, ART.prep.knifeTip.y * this.knife.scaleY + 8 * this.k), angle: 0, duration: 260, ease: 'Sine.easeOut' });
  }

  private cutDown(x: number, y: number) {
    if (!this.knife || this.cutBusy || this.isAuto) return;
    const onKnife = this.knife.getBounds().contains(x, y);
    if (!onKnife && this.dish.reach(x, y) > 1.2) return;
    this.hand.stop();
    this.poke();
    this.cutHeld = true;
    this.travel = 0;
    this.last = { x, y };
    this.scene.tweens.killTweensOf(this.knife);
    this.knife.setAngle(-8);
    this.knifeAt(x, y);
    sfx(this.scene, 'tap');
  }

  /**
   * Any stroke over the dish cuts: she need not follow the dots or cut straight. Once her finger has travelled
   * `TUNING.share.cutSwipe` over the dish, the next cut goes all the way across along its line.
   */
  private cutMove(x: number, y: number) {
    if (!this.cutHeld || !this.knife) return;
    this.knifeAt(x, y);
    this.poke();
    if (this.dish.reach(x, y) < 1.15) this.travel += Phaser.Math.Distance.Between(x, y, this.last.x, this.last.y);
    this.last = { x, y };
    if (this.travel >= TUNING.share.cutSwipe * this.k && !this.cutBusy) {
      this.travel = 0;
      this.hit();
      this.cutNext();
    }
  }

  private cutUp() {
    if (!this.cutHeld) return;
    this.cutHeld = false;
    this.knife?.setAngle(0);
    if (!this.cutBusy) this.restKnife();
  }

  /** The next cut appears along its line, drawn from end to end (with the knife, when her finger is not on it). */
  private cutNext(glide = !this.cutHeld) {
    const l = this.cutLines()[this.cutsDone];
    if (!l || this.cutBusy) return;
    this.cutBusy = true;
    this.cutsDone++;
    this.guide?.clear();
    sfx(this.scene, 'chop');
    voice.say(countKey(this.cutsDone), { group: 'count', sequence: true, ttlMs: 5000 });
    const g = this.cutsG!;
    const w = CUT_W * this.k;
    const draw = (t: number) => {
      const x = Phaser.Math.Linear(l.a.x, l.b.x, t);
      const y = Phaser.Math.Linear(l.a.y, l.b.y, t);
      return { x, y };
    };
    let prev = draw(0);
    this.scene.tweens.addCounter({
      from: 0,
      to: 1,
      duration: 280,
      ease: 'Sine.easeIn',
      onUpdate: (tw) => {
        const p = draw(tw.getValue() ?? 0);
        g.lineStyle(w * 1.9, 0x5a3218, 0.35).lineBetween(prev.x, prev.y, p.x, p.y);
        g.lineStyle(w, 0x5a3218, 0.75).lineBetween(prev.x, prev.y, p.x, p.y);
        if (glide) this.knifeAt(p.x, p.y);
        prev = p;
      },
      onComplete: () => {
        burst(this.scene, l.b.x, l.b.y, { tint: [0xe3a869, 0xffcb47], count: 6, size: 12 * this.k, speed: 220 * this.k, gravityY: 400 * this.k });
        this.cutBusy = false;
        if (this.cutsDone >= this.cutLines().length) return this.cutDoneAll();
        this.drawGuide();
        if (!this.cutHeld) this.restKnife();
      },
    });
  }

  /** All cut: the knife goes, the pieces come apart, and the guests' badges come (then the sharing). */
  private cutDoneAll() {
    this.cutting = false;
    this.cutHeld = false;
    this.hand.stop();
    this.guide?.destroy();
    if (this.knife) this.scene.tweens.add({ targets: this.knife, alpha: 0, x: this.knife.x - 80 * this.k, duration: 300 });
    this.scene.time.delayedCall(350, () => {
      if (this.aborted) return;
      this.cutsG?.destroy();
      this.buildSlices();
      // now who comes to eat (the share line follows her arrival)
      this.showCards();
      voice.say('vo-guest-who', { ttlMs: 5000 });
      this.poke();
    });
  }

  /** Mom's knife hand draws one cut along the next line (nothing is cut). */
  private cutDemo(): HandMotion | null {
    const l = this.cutLines()[this.cutsDone];
    if (!l) return null;
    return {
      kind: 'knife',
      keys: [
        { x: l.a.x - 30 * this.k, y: l.a.y + 20 * this.k, t: 0 },
        { x: l.a.x, y: l.a.y, t: 400 },
        { x: l.b.x, y: l.b.y, t: 1500 },
        { x: l.b.x, y: l.b.y, t: 1900 },
      ],
      glow: { x: this.dish.x, y: this.dish.y },
      size: 0.75,
      onStop: () => this.knife?.active && this.cutting && this.knife.setVisible(true),
    };
  }

  protected onDemoStart() {
    if (this.cutting) this.knife?.setVisible(false);
  }

  protected onDemoEnd() {
    if (this.knife?.active) this.knife.setVisible(true);
  }

  protected showHint() {
    if (this.cutting) this.knife?.setVisible(false);
    super.showHint();
  }

  /** Mom helps cut: her knife hand draws each cut in turn; then the sharing is hers again. */
  private cutHelp() {
    this.cutHeld = false;
    this.knife?.setVisible(false);
    const at = { x: 0, y: 0 };
    this.hand.follow('knife', () => at, 0.75);
    const one = () => {
      if (!this.cutting || this.aborted) return;
      const l = this.cutLines()[this.cutsDone];
      if (!l) return;
      this.scene.tweens.addCounter({
        from: 0,
        to: 1,
        duration: 700,
        ease: 'Sine.easeInOut',
        onUpdate: (tw) => {
          const t = tw.getValue() ?? 0;
          at.x = Phaser.Math.Linear(l.a.x, l.b.x, t);
          at.y = Phaser.Math.Linear(l.a.y, l.b.y, t);
        },
        onComplete: () => {
          this.cutNext(false);
          const last = this.cutsDone >= this.cutLines().length;
          if (last) {
            this.hand.stop();
            this.resumeAfterAuto();
          } else this.scene.time.delayedCall(400, one);
        },
      });
    };
    one();
  }

  /** Her cookies (each with its own icing, captured when decorating) lift off the tray, which stays. */
  private buildPieces() {
    const home0 = this.ctx.stage.dishHome;
    const list =
      this.ctx.run.pieces ??
      (this.dish.cookies.list as Phaser.GameObjects.Image[])
        .filter((c) => !c.getData('cut'))
        .map((c) => ({ key: c.texture.key, x: c.x, y: c.y, scale: c.scaleX, tint: c.tintTopLeft }));
    this.dish.cookies.setVisible(false);
    this.dish.toppings.setVisible(false);
    this.sliceScale = list[0]?.scale ?? this.k;
    // (pieces standing in the left column, the smoothie's glasses, move right of where the guest will stand)
    const left = Math.min(...list.map((pc) => home0.x + pc.x - (this.scene.textures.get(pc.key).getSourceImage().width / 2) * this.sliceScale));
    const dx = Math.max(0, this.ctx.stage.guestRight + 20 * this.k - left);
    list.forEach((pc, i) => {
      const home = { x: home0.x + pc.x + dx, y: home0.y + pc.y };
      const img = this.own(this.scene.add.image(home.x, home.y, pc.key).setScale(this.sliceScale).setTint(pc.tint).setDepth(20));
      this.scene.tweens.add({ targets: img, y: home.y - 14 * this.k, duration: 200, delay: 450 + i * 60, yoyo: true, ease: 'Quad.easeOut' });
      const def: SliceDef = { key: pc.key, originX: 0.5, originY: 0.5, restAngle: 0, midAngle: 0, centerDist: 0 };
      this.slices.push({ img, def, home, eaten: false, contents: (pc as { contents?: string[] }).contents ?? this.contentsOf(i, (t) => t.on === i) });
    });
  }

  /**
   * What is on piece `i`: what she put on it (`on`), or, where nothing was put on the dish at all (the smoothie's
   * glasses, the salad's portions), one of the things she chose, in turn.
   */
  private contentsOf(i: number, mine: (t: { key: string; on?: number }) => boolean) {
    if (this.dish.placed.length) return this.dish.placed.filter(mine).map((t) => t.key);
    const ch = this.ctx.run.chosen;
    return ch.length ? [ch[i % ch.length].topping as string] : [];
  }

  /**
   * The salad: the big bowl (left by mixing) moves to the left of the counter with the portions over it, and a serving
   * bowl stands on the counter in front of Mom and one in front of Pipa.
   */
  private buildPortions() {
    const P = this.portions!;
    const k = this.k;
    const S = this.ctx.stage;
    // (the room right of where a guest stands: the badges, then the guest, are in the left column)
    const area = { ...S.prepArea, x0: Math.max(S.prepArea.x0, S.guestRight + 10 * k) };
    const big = PrepBowl.take(this.ctx);
    let o = { x: area.x0 + 300 * k, y: S.dishHome.y, rx: 250 * k, ry: 65 * k };
    if (big) {
      big.parts.forEach((p) => this.own(p));
      const s = Math.min(BIG_BOWL * k, ((area.x1 - area.x0) * 0.42) / IMAGES['salad-bowl-back'].size[0]);
      const x = area.x0 + (IMAGES['salad-bowl-back'].size[0] / 2) * s + 10 * k;
      const y = S.dishHome.y + 20 * k;
      this.scene.tweens.add({ targets: big.parts, x, y, scale: s, duration: 500, ease: 'Sine.easeInOut' });
      const op = ART.salad.bowlOpening;
      const [bw, bh] = IMAGES['salad-bowl-back'].size;
      o = { x: x + (op.x - bw / 2) * s, y: y + (op.y - bh / 2) * s, rx: op.rx * s, ry: op.ry * s };
    }
    // The portions wait on the counter in a row right of the big bowl (each on its spoon), up to Pipa.
    const n = P.count;
    const [pw, ph] = IMAGES[P.image].size;
    const x0 = o.x + o.rx + 40 * k;
    const x1 = Math.min(S.work.x1, S.feedPetLeft) - 30 * k;
    // (in two rows where the counter is narrow, never more: a third row would reach the palm strip)
    const cols = Math.min(n, Math.max(Math.ceil(n / 2), Math.floor((x1 - x0) / (pw * 0.5 * k))));
    const gap = (x1 - x0) / cols;
    const ps = Math.min(PORTION * k, (gap * 1.05) / pw);
    for (let i = 0; i < n; i++) {
      const row = Math.floor(i / cols);
      const home = { x: x0 + gap * ((i % cols) + 0.5), y: o.y + 40 * k + row * 150 * k + (cols > 2 ? (i % 2) * 70 * k : 0) };
      const img = this.own(this.scene.add.image(home.x, home.y - 80 * k, P.image).setOrigin(P.anchor.x / pw, P.anchor.y / ph).setScale(ps).setDepth(20).setAlpha(0));
      this.scene.tweens.add({ targets: img, y: home.y, alpha: 1, delay: 450 + i * 90, duration: 300, ease: 'Back.easeOut' });
      const def: SliceDef = { key: P.image, originX: P.anchor.x / pw, originY: P.anchor.y / ph, restAngle: 0, midAngle: 0, centerDist: 0 };
      this.slices.push({ img, def, home, eaten: false, contents: this.contentsOf(i, () => true) });
    }
    this.sliceScale = ps;
    // The serving bowls on the counter: in front of Mom (where she stands after stepping aside) and of Pipa.
    const pet = S.feedPet;
    const momX = S.mom.x + S.feedMomShift;
    this.serving.mom = this.makeServing(momX - 40 * k, Math.min(S.work.y1, this.layout.Y(930)), SERVE_MOM * k);
    this.serving.pet = this.makeServing(pet.x - 10 * k, Math.min(S.work.y1, this.layout.Y(955)), SERVE_PET * k);
    sfx(this.scene, 'whoosh', { volume: 0.6 });
  }

  private makeServing(x: number, y: number, s: number): Serving {
    const P = this.portions!;
    const bowl = this.own(this.scene.add.image(x, y, P.bowl).setScale(s).setDepth(40).setAlpha(0));
    this.scene.tweens.add({ targets: bowl, alpha: 1, duration: 350, delay: 250 });
    const so = ART.salad.servingOpening;
    const [w, h] = IMAGES[P.bowl].size;
    const at = { x: x + (so.x - w / 2) * s, y: y + (so.y - h / 2) * s };
    // A full bowl = the mixed salad at rx 196 / 388 of the bowl's scale, its opening on the bowl's (scenes-salad.js).
    const fillScale = (s * so.rx) / ART.salad.bowlOpening.rx;
    const [fw, fh] = IMAGES[P.fill].size;
    const fill = this.own(this.scene.add.image(at.x, at.y, P.fill).setOrigin(ART.salad.bowlOpening.x / fw, ART.salad.bowlOpening.y / fh).setScale(0).setDepth(40.5).setVisible(false));
    return { bowl, fill, at, fillScale };
  }

  /** Where a piece goes for `who`: into their serving bowl (portions), else to their mouth. */
  private targetOf(who: Who) {
    return this.serving[who]?.at ?? this.mouthOf(who);
  }

  mouthOf(who: Who) {
    return who === 'mom' ? this.ctx.mom.mouthAt : who === 'guest' && this.guest ? this.guest.mouthAt : this.ctx.character.mouthAt;
  }

  /** Who can eat now: Mom, Pipa, and the guest once she has arrived. */
  private get eaters(): Who[] {
    return this.guestIn ? ['guest', 'mom', 'pet'] : ['mom', 'pet'];
  }

  /** The mouth nearest to a point. */
  private nearest(x: number, y: number): Who {
    const d = (w: Who) => Phaser.Math.Distance.Between(x, y, this.targetOf(w).x, this.targetOf(w).y);
    return this.eaters.reduce((a, b) => (d(b) < d(a) ? b : a));
  }

  /**
   * Who gets a slice let go at the finger (fx, fy) with its tip at (tx, ty): whoever's mouth the finger or the tip is
   * near; or, anywhere right of Pipa's left edge, the nearer of the two. Else nobody (it goes back to the board).
   */
  private receiver(fx: number, fy: number, tx: number, ty: number): Who | null {
    const r = MOUTH_REACH * this.k;
    for (const [x, y] of [[fx, fy], [tx, ty]]) {
      const w = this.nearest(x, y);
      if (Phaser.Math.Distance.Between(x, y, this.targetOf(w).x, this.targetOf(w).y) < r) return w;
      // (with serving bowls, near the mouth counts too)
      if (this.portions && Phaser.Math.Distance.Between(x, y, this.mouthOf(w).x, this.mouthOf(w).y) < r) return w;
    }
    if (this.guestIn && fx < this.ctx.stage.guestRight) return 'guest';
    return fx > this.ctx.stage.feedPetLeft ? this.nearest(fx, fy) : null;
  }

  /** The one the slice comes near opens wide; the other keeps (or goes back to) smiling. */
  private expectFrom(x: number | null, y = 0) {
    const pet = this.ctx.character;
    let who: Who | null = null;
    if (x !== null) {
      const w = this.nearest(x, y);
      if (Phaser.Math.Distance.Between(x, y, this.targetOf(w).x, this.targetOf(w).y) < EXPECT_REACH * this.k) who = w;
    }
    this.ctx.mom.expectFood(who === 'mom');
    const opens = (c: Character, me: Who) => {
      if (c.mood === 'rest' || c.mood === 'happy' || c.mood === 'expect' || (c.mood === 'sleep' && who === me)) c.setMood(who === me ? 'expect' : 'rest');
    };
    opens(pet, 'pet');
    if (this.guest && this.guestIn) opens(this.guest, 'guest');
  }

  /** The middle of the slice under the finger, its tip ahead of it, pointing at the nearer mouth. */
  private carryPose(s: Slice, fx: number, fy: number, to?: Who) {
    // A portion is carried upright by its spoon, just above the finger.
    if (this.upright) return { x: fx, y: fy - 30 * this.k, angle: 0 };
    const m = this.mouthOf(to ?? this.nearest(fx, fy));
    const dir = Phaser.Math.Angle.Between(fx, fy, m.x, m.y);
    const reach = s.def.centerDist * LIFT;
    const angle = Phaser.Math.Angle.WrapDegrees(s.def.restAngle + Phaser.Math.RadToDeg(dir) + 180 - s.def.midAngle);
    return { x: fx + Math.cos(dir) * reach, y: fy + Math.sin(dir) * reach, angle };
  }

  private sliceCenter(s: Slice) {
    if (this.upright) return { x: s.home.x, y: s.home.y };
    const a = Phaser.Math.DegToRad(s.def.midAngle);
    return { x: s.home.x + Math.cos(a) * s.def.centerDist, y: s.home.y + Math.sin(a) * s.def.centerDist };
  }

  private sliceAt(x: number, y: number) {
    let best: Slice | undefined;
    let bestD = Infinity;
    for (const s of this.slices) {
      if (s.eaten) continue;
      const c = this.sliceCenter(s);
      const d = Phaser.Math.Distance.Between(x, y, c.x, c.y);
      if (d < bestD) {
        bestD = d;
        best = s;
      }
    }
    return best && bestD < 260 * this.k ? best : undefined;
  }

  private sendHome(s: Slice) {
    sfx(this.scene, 'whoosh', { volume: 0.4 });
    this.scene.tweens.add({ targets: s.img, x: s.home.x, y: s.home.y, angle: s.def.restAngle, scale: this.sliceScale, duration: 420, ease: 'Sine.easeOut', onComplete: () => s.img.setDepth(20) });
  }

  private feed(s: Slice, who: Who) {
    if (s.eaten) return;
    s.eaten = true;
    this.busy++;
    this.fed[who]++;
    const first = this.fed[who] === 1;
    const m = this.targetOf(who);
    const sv = this.serving[who];
    if (who === 'mom') this.ctx.mom.expectFood(true);
    else this.eaterOf(who).setMood('expect');
    this.scene.tweens.add({
      targets: s.img,
      x: m.x,
      y: m.y,
      scale: this.sliceScale * (sv ? 0.6 : 0.2),
      duration: 260,
      ease: 'Quad.easeIn',
      onComplete: () => {
        s.img.setVisible(false);
        if (sv) {
          // The salad lands in the bowl: it shows in it, fuller with the second portion.
          const f = this.fed[who] >= 2 ? 1 : 0.8;
          sv.fill.setVisible(true);
          this.scene.tweens.add({ targets: sv.fill, scale: sv.fillScale * f, duration: 260, ease: 'Back.easeOut' });
          boing(this.scene, sv.bowl, 0.08);
          sfx(this.scene, 'pop', { volume: 0.5 });
          burst(this.scene, m.x, m.y, { tint: [0x7cc25a, 0xe4523b, 0xf28c28], count: 8, size: 16 * this.k, speed: 300 * this.k });
        } else burst(this.scene, m.x, m.y, { tint: [0xe3a869, 0xffcb47, 0xe4523b], count: 12, size: 20 * this.k, speed: 450 * this.k });
        let after = 0;
        if (who === 'mom') this.momEats(first);
        else after = this.petEats(first, s, who);
        this.scene.time.delayedCall(CHEW_MS + after + 50, () => {
          this.busy--;
          if (this.slices.every((x) => x.eaten) && this.busy === 0) this.finish();
        });
      },
    });
  }

  private get eat() {
    return this.params.eat ?? 'munch';
  }

  private momEats(first: boolean) {
    const mom = this.ctx.mom;
    mom.chew(CHEW_MS);
    sfx(this.scene, this.eat, { minGapMs: 0, volume: 0.7 });
    this.scene.time.delayedCall(480, () => sfx(this.scene, this.eat, { minGapMs: 0, volume: 0.45 }));
    boing(this.scene, mom.box, 0.03);
    if (first) {
      voice.say(this.params.forMom, { ttlMs: 4000 });
      voice.say(this.params.momYum, { ttlMs: 6000 });
    }
  }

  private sneezes: Partial<Record<Who, number>> = {};
  private said = new Set<string>();

  private eaterOf(who: Who): Character {
    return who === 'guest' && this.guest ? this.guest : this.ctx.character;
  }

  /** Mom's line, once per sharing. */
  private sayOnce(line: VoiceKey, delay: number) {
    if (this.said.has(line)) return;
    this.said.add(line);
    this.scene.time.delayedCall(delay, () => !this.aborted && voice.say(line, { ttlMs: 3000 }));
  }

  /**
   * Pipa: about one second of happy chewing with munch sounds, then how she answers what was on it (core/tastes.ts:
   * her wish, a sneeze, a wow, a giggle), or, on a bare piece, one of her happy gags. Returns how much longer than the
   * chewing her answer takes (ms).
   */
  private petEats(first: boolean, sl: Slice, who: Who): number {
    const pet = this.eaterOf(who);
    const guest = who === 'guest' ? this.guest : undefined;
    // (the turtle chews slowly: her chewing takes longer, the rest waits for it)
    const slow = guest?.chewScale ?? 1;
    const chewMs = CHEW_MS * slow;
    pet.setMood('chew');
    sfx(this.scene, this.eat, { minGapMs: 0 });
    let closed = false;
    this.scene.time.addEvent({
      delay: 150 * slow,
      repeat: 5,
      callback: () => {
        if (pet.mood !== 'chew') return;
        closed = !closed;
        pet.chewFrame(closed);
      },
    });
    this.scene.time.delayedCall(480 * slow, () => sfx(this.scene, this.eat, { minGapMs: 0, volume: 0.6 }));
    if (first) voice.say(guest ? guest.g.forGuest : this.params.forPet, { ttlMs: 4000 });
    // (Pipa loves what she wished for; a guest what she likes, core/guests.ts)
    const sneezed = this.sneezes[who] ?? 0;
    const taste = tasteOf(sl.contents, guest ? [] : this.ctx.run.wishes, sneezed < TUNING.taste.maxSneezes, guest?.g.likes);
    if (taste !== 'plain' || guest) {
      if (taste === 'sneeze') this.sneezes[who] = sneezed + 1;
      let took = 0;
      this.scene.time.delayedCall(chewMs - 150, () => {
        if (this.aborted) return;
        took = pet.react(taste);
        // Mom answers the first sneeze and the first favourite, once each (and a guest's funny moment, in Guest.onFunny).
        if (guest) {
          if (taste === 'love') this.sayOnce(guest.g.loves, 300);
        } else if (taste === 'sneeze') this.sayOnce('vo-bless-you', 900);
        else if (taste === 'love') this.sayOnce('vo-pipa-loves', 300);
        if (took === 0 && pet.mood === 'chew') pet.setMood('rest');
      });
      const extra = taste === 'sneeze' ? 1400 : taste === 'giggle' ? 700 : taste === 'plain' ? 0 : 1100;
      return chewMs - CHEW_MS + extra + (guest && taste === 'love' ? 700 : 0);
    }
    this.scene.time.delayedCall(CHEW_MS, () => pet.mood === 'chew' && pet.setMood('rest'));
    const k = this.k * (pet.scale / 0.62);
    const box = pet.box;
    // A little jump or a happy up-and-down squish, in turn (nothing sideways: beside Mom's face there is no room for it).
    if (this.fed.pet % 2) this.scene.tweens.add({ targets: box, y: pet.rest.y - 120 * k, duration: 220, yoyo: true, ease: 'Quad.easeOut' });
    else this.scene.tweens.add({ targets: box, scaleY: pet.scale * 0.84, duration: 120, yoyo: true, repeat: 1, ease: 'Sine.easeInOut', onComplete: () => box.setScale(pet.scale) });
    return 0;
  }

  /**
   * The three badges in the left column (the bins' places for three), popping in one after another. The guests' own
   * layers start loading now, so the one she picks can come in at once.
   */
  private showCards() {
    const S = this.ctx.stage;
    const scale = Math.min(S.binScale(3), 1.1 * this.k);
    GUESTS.forEach((g, i) => {
      const at = S.bin(i, 3);
      const img = this.own(this.scene.add.image(at.x, at.y, g.card).setScale(0).setDepth(25));
      this.scene.tweens.add({ targets: img, scale, duration: 380, delay: 250 + i * 160, ease: 'Back.easeOut', onComplete: () => setRestScale(img) });
      this.scene.time.delayedCall(250 + i * 160, () => sfx(this.scene, 'pop', { volume: 0.5 }));
      this.cards.push({ img, g, scale });
    });
    this.layersIn = loadImages(this.scene.game, GUESTS.flatMap(guestLayers));
    this.bringTimer = this.scene.time.delayedCall(TUNING.guests.bringAfterMs, () => this.picking && this.pipaBrings());
  }

  private cardAt(x: number, y: number) {
    const r = (120 * (this.cards[0]?.scale ?? 1) + CARD_REACH * this.k) ** 2;
    return this.cards.find((c) => (c.img.x - x) ** 2 + (c.img.y - y) ** 2 < r);
  }

  /** No pick yet: Pipa brings a friend (her bubble shows who), at random. */
  private pipaBrings() {
    if (!this.picking || this.done) return;
    const g = GUESTS[Phaser.Math.Between(0, GUESTS.length - 1)];
    const pet = this.ctx.character;
    const S = this.ctx.stage;
    pet.cheer();
    pet.showWish([g.card], [], { maxRight: S.momFace.x0 + S.feedMomShift - 12 * this.k, k: this.k });
    this.scene.time.delayedCall(1300, () => pet.hideWish());
    this.invite(g, true);
  }

  /** She (or Pipa) invited `g`: the other badges go, hers flies to where the guest will stand, and the guest comes in. */
  private invite(g: GuestDef, byPipa: boolean) {
    if (!this.picking) return;
    this.picking = false;
    this.bringTimer?.remove();
    this.poke();
    this.hand.stop();
    const S = this.ctx.stage;
    const spot = g.arrive === 'above' ? S.guestAbove : S.guest;
    for (const c of this.cards) {
      this.scene.tweens.killTweensOf(c.img);
      if (c.g === g) {
        sfx(this.scene, 'pop');
        stars(this.scene, c.img.x, c.img.y, 6, 40 * this.k);
        this.scene.tweens.add({ targets: c.img, scale: c.scale * 1.2, duration: 160, yoyo: true, ease: 'Quad.easeOut' });
        this.scene.tweens.add({ targets: c.img, alpha: 0, scale: c.scale * 0.6, duration: 300, delay: 380, onComplete: () => c.img.setVisible(false) });
      } else this.scene.tweens.add({ targets: c.img, alpha: 0, scale: c.scale * 0.6, duration: 260, onComplete: () => c.img.setVisible(false) });
    }
    if (byPipa) voice.say('vo-pipa-brought', { ttlMs: 4000 });
    voice.say(g.hello, { ttlMs: 6000, valid: () => !this.aborted });
    // (the sharing can start right away; the guest joins as a third mouth once she has arrived)
    voice.say(this.params.line, { ttlMs: 8000, valid: () => !this.aborted && !this.done });
    void (this.layersIn ?? Promise.resolve()).then(() => {
      if (this.aborted || this.done) return;
      releaseImages(this.scene.game, GUESTS.filter((x) => x !== g).flatMap(guestLayers));
      const guest = new Guest(this.scene, g, spot);
      this.guest = guest;
      guest.onFunny = () => g.funnyLine && this.sayOnce(g.funnyLine, g.id === 'penguin' ? 900 : 400);
      this.scene.time.delayedCall(350, () => {
        if (this.aborted || !guest.box.active) return;
        guest.arrive(() => {
          this.guestIn = true;
          if (this.held) this.expectFrom(this.held.img.x, this.held.img.y);
        });
      });
    });
  }

  /** All eaten: the guest waves goodbye the way she came (up, or walking off to the left), happy. */
  private guestLeaves() {
    const guest = this.guest;
    if (!guest) return;
    this.guest = undefined;
    this.guestIn = false;
    const box = guest.box;
    this.scene.tweens.killTweensOf(box);
    box.setAngle(0);
    guest.setMood('happy');
    const bye = () => box.destroy();
    this.scene.time.delayedCall(250, () => {
      if (!box.active) return;
      if (guest.g.arrive === 'above') this.scene.tweens.add({ targets: box, y: -(350 + 60) * guest.scale, duration: 700, ease: 'Back.easeIn', onComplete: bye });
      else this.scene.tweens.add({ targets: box, x: -320 * guest.scale, duration: 700, ease: 'Sine.easeIn', onComplete: bye });
    });
  }

  update(delta: number) {
    super.update(delta);
    const g = this.guest;
    if (!g || !this.guestIn) return;
    const p = this.scene.input.manager.pointers.find((q) => q.isDown);
    const t = p ? { x: p.worldX, y: p.worldY } : (this.hand.position ?? this.dish);
    g.lookAt(t.x, t.y);
  }

  private finish() {
    if (this.done) return;
    this.done = true;
    this.setIdle(false);
    this.hand.stop();
    this.ctx.mom.happy();
    this.ctx.character.setMood('happy');
    this.guestLeaves();
    // (the emptied tray goes: the photo shows the tray as it was decorated)
    if (this.params.pieces) this.scene.tweens.add({ targets: [this.dish, this.ctx.board], alpha: 0, duration: 400 });
    this.scene.time.delayedCall(500, () => this.complete());
  }

  /** Whoever has had fewer (Mom first when even): the hint and Mom's help carry the next slice there. */
  private nextFor(): Who {
    // (the guest first when even: she was invited; then Mom, then Pipa)
    return this.eaters.reduce((a, b) => (this.fed[b] < this.fed[a] ? b : a));
  }

  /** Mom carries a see-through copy of a slice to the mouth of whoever has had fewer (the real slices stay). */
  protected demo(): HandMotion | null {
    if (this.cutting) return this.cutDemo();
    if (this.picking) {
      const c = this.cards[1] ?? this.cards[0];
      return c ? tapMotion({ x: c.img.x, y: c.img.y }, this.k) : null;
    }
    const s = this.slices.find((x) => !x.eaten);
    if (!s || this.done) return null;
    const who = this.nextFor();
    const c = this.sliceCenter(s);
    const pose = this.carryPose(s, c.x, c.y, who);
    const m = this.targetOf(who);
    const back = this.upright ? 0 : s.def.centerDist * LIFT + 40 * this.k;
    const dir = Phaser.Math.Angle.Between(c.x, c.y, m.x, m.y);
    const to = { x: m.x - Math.cos(dir) * back, y: m.y - Math.sin(dir) * back };
    return {
      kind: 'grab',
      keys: [
        { x: c.x, y: c.y, t: 0 },
        { x: c.x, y: c.y, t: 350, press: true },
        { x: to.x, y: to.y, t: 1700 },
        { x: to.x, y: to.y, t: 2300 },
      ],
      props: [
        {
          key: s.def.key,
          scale: this.sliceScale * LIFT,
          angle: pose.angle,
          alpha: 0.6,
          originX: s.def.originX,
          originY: s.def.originY,
          dx: pose.x - c.x,
          dy: pose.y - c.y,
          fadeFrom: 1650,
          tint: s.img.tintTopLeft,
        },
      ],
      glow: c,
    };
  }

  /** Mom helps: her hand shares the rest out, each slice to whoever has had fewer. */
  protected autoFinish() {
    if (this.cutting) return this.cutHelp();
    if (this.picking) {
      // (Pipa brings a guest; the child then shares by herself)
      this.pipaBrings();
      this.resumeAfterAuto();
      return;
    }
    let carried: Phaser.GameObjects.Image | null = null;
    this.hand.follow('grab', () => (carried?.visible ? { x: carried.x - 40 * this.k, y: carried.y } : null));
    // (a portion flies from the bowl it lies over to the serving bowl)
    if (this.held) {
      const s = this.held;
      this.held = undefined;
      carried = s.img;
      this.feed(s, this.nextFor());
    }
    this.expectFrom(null);
    const left = this.slices.filter((x) => !x.eaten);
    left.forEach((s, i) =>
      this.scene.time.delayedCall(300 + i * (CHEW_MS + 250), () => {
        carried = s.img;
        this.feed(s, this.nextFor());
      }),
    );
  }
}
