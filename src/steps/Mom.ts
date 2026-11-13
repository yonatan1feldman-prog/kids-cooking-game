import Phaser from 'phaser';
import { ART, IMAGES, type ImageKey } from '../core/assets';
import { voice } from '../core/audio';
import { burst } from '../core/fx';
import { sfx } from '../core/sfx';
import type { Spot } from '../core/stage';

/** Her clothes in each world. */
export type MomOutfit = 'home' | 'nurse' | 'mermaid';
type Eyes = 'open' | 'blink' | 'happy' | 'surprised';
type Mouth = 'smile' | 'talk' | 'open' | 'chew';
/** The right arm's drawings (same pivot): hand on the hip, waving, chin on the hand, thumbs-up, clapping. */
type RightPose = 'rest' | 'wave' | 'chin' | 'thumb' | 'clap';
/** The pointing arm's drawings (same pivot): pointing, reaching down to the counter, an open palm, clapping. */
type LeftPose = 'point' | 'reach' | 'open' | 'clap';

/** How far her eyes shift toward what she watches, in frame units (800 frame). */
const LOOK_MAX = 10;
/** Pointing-arm rotation limits (README-mom.md: ±20° around the shoulder shows no gap). */
const ARM_MAX = 20;
/** How long a pose change takes (a cross-fade between two drawings of the arm on the same pivot). */
const POSE_MS = 160;
/** The demo hand must be gone this long before the pointing arm comes back up (a looping hint pauses between loops). */
const REACH_HOLD_MS = 700;
/** Visual round 6: a finger held down this long is work (a drag, a rub, a hold), not a tap: Mom watches it. */
const WATCH_AFTER_MS = 350;
/** She keeps watching this long after the finger lifts (so a rub with short breaks doesn't make her flicker). */
const WATCH_HOLD_MS = 2000;
/** The open palm stays this long after a line ends (the pause between two sentences). */
const TALK_HOLD_MS = 700;
/** How far she leans toward the work while watching (degrees, from the waist). */
const LEAN = -1.2;
/** Lines that are not talking to her (counting, temperatures, names): no gesture for them. */
const QUIET = /^(count-|temp-|name-)/;
/** Scenes where Mom picks her poses by herself (title, home and album keep her pointing pose: the cards are laid out
 * around it). */
const AUTO_SCENES = ['Recipe', 'Garden', 'Puzzle', 'Art', 'Clinic'];
/** The premium round: her head turns around the base of her neck (800 frame), apart from her body. */
const NECK = { x: 500, y: 420 };
/** While she talks her head rises with the voice's loudness, this far at full loudness (frame units). If it reads as
 * too much nodding on the phone, this is the one number to lower. */
const HEAD_BOB = 5;
/** At the start of a line she tilts her head toward the child (the side of the last finger), this many degrees. */
const TALK_TILT = 2.5;
/** After she lets go of something she was moving, she looks at what it was put on this long, then back to the finger. */
const GLANCE_MS = 600;
/** A touch held at least this long and then let go is something put down (not a tap). */
const PUT_AFTER_MS = 150;

/**
 * Mom, standing at the counter on the right for the whole recipe. Twelve layers share one 800x800
 * frame, stacked back to front: arm-right, body, head, hair, eyes, mouth, arm-left. The arms turn
 * around their shoulder pivots. At rest she breathes gently, blinks now and then, and her eyes follow
 * the finger (or her own demo hand, or the dish). While a voice line plays her mouth moves with its
 * loudness (smile / talk / open) and goes back to the smile when it ends. At the end of every step
 * she has happy eyes and a short happy bounce with a wave.
 * Round 11: each arm has two drawings on the same pivot. The right arm rests (hand on the hip) and only waves for
 * hello, a step done and the finale; the pointing arm reaches down to the counter while her demo hand is on screen
 * (`followHand`), so that hand reads as hers and she never shows three hands.
 */
export class Mom {
  readonly box: Phaser.GameObjects.Container;
  private eyes: Phaser.GameObjects.Image;
  private mouth: Phaser.GameObjects.Image;
  private armL: Phaser.GameObjects.Image;
  private armR: Phaser.GameObjects.Image;
  private right: Record<RightPose, Phaser.GameObjects.Image>;
  private left: Record<LeftPose, Phaser.GameObjects.Image>;
  private rPose: RightPose = 'rest';
  private lPose: LeftPose = 'point';
  /** A gesture that runs by itself (a wave, a clap, a thumbs-up, the finale) until this time: no automatic pose. */
  private gestureUntil = 0;
  private readonly auto: boolean;
  private downMs = 0;
  private watchLeft = 0;
  private talkLeft = 0;
  private lean = 0;
  private leanTween?: Phaser.Tweens.Tween;
  private cheers: ('wave' | 'clap' | 'thumb')[] = [];
  private handGone = 0;
  private handActive?: () => boolean;
  private eyesKey: Eyes = 'open';
  private mouthKey: Mouth = 'smile';
  /** Eyes set by a mood (happy, surprised) win over blinking until `rest()`. */
  private mood: Eyes | null = null;
  private look = { x: 0, y: 0 };
  private mouthHold = 0;
  /** A mouth held by what she is doing (open for a slice coming, chewing), over the voice's lip movement. */
  private mouthHeld: Mouth | null = null;
  private chewing?: Phaser.Time.TimerEvent;
  private breath?: Phaser.Tweens.Tween;
  readonly s: number;
  /**
   * Her head's layers (head, hair, cap or crown, eyes, mouth) hang at the base of her neck (their origin), so they tilt and
   * nod together while her body stays still. `hd` is what moves them (tweened), composed every frame in `update` with the
   * talking bob. (Not a container inside her container: Phaser 4.2 draws a nested container under a turned parent with
   * pieces missing, seen in every turned frame in the cloud's renderer.)
   */
  private head: Phaser.GameObjects.Image[];
  private neck: { x: number; y: number };
  private hd = { tilt: 0, nod: 0, dy: 0 };
  private bob = 0;
  private tiltTween?: Phaser.Tweens.Tween;
  private gestTweens: Phaser.Tweens.Tween[] = [];
  /** The line her head tilted for, and how long ago she last spoke (her head comes back after TALK_HOLD_MS). */
  private talkLine: string | null = null;
  private quietMs = 0;
  /** Which side the child's last finger was on (-1 left of her, 1 right), and how long the first finger is held. */
  private fingerSide = -1;
  private holdMs = 0;
  private lastUp = { x: 0, y: 0 };
  private glance?: { x: number; y: number; until: number };
  private startledAt = -Infinity;

  /**
   * `outfit` 'nurse': the clinic's Mom (a nurse's dress and cap over the same layers, gen_mom.py); 'mermaid': the
   * mermaid world's Mom (her big tail and her long hair behind her, the tail lying left over the rock; a shell top in
   * place of mom-body, her hair let down in place of mom-hair, a starfish tiara, bare-shouldered arms; her head and
   * face exactly as ever, research/mermaid-spec.md, the change of 2026-11-06).
   */
  constructor(private scene: Phaser.Scene, at: Spot, outfit: MomOutfit = 'home') {
    this.s = at.scale;
    const { w, h, cx, pivotL, pivotR } = ART.mom;
    // The container sits on her body centre at the screen bottom; every layer hangs from there.
    const layer = (key: ImageKey) => new Phaser.GameObjects.Image(scene, 0, 0, key).setOrigin(cx / w, 1).setScale(this.s);
    // (the head's layers hang from the base of her neck: they turn around it)
    this.neck = { x: (NECK.x - cx) * this.s, y: (NECK.y - h) * this.s };
    const headLayer = (key: ImageKey) => layer(key).setOrigin(NECK.x / w, NECK.y / h).setPosition(this.neck.x, this.neck.y);
    const mermaid = outfit === 'mermaid';
    // (the mermaid's arms are the same arms with bare shoulders: mom-mer-arm-* in place of mom-arm-*)
    const arm = (key: ImageKey, pivot: { x: number; y: number }) =>
      new Phaser.GameObjects.Image(scene, (pivot.x - cx) * this.s, (pivot.y - h) * this.s, mermaid ? (key.replace('mom-arm-', 'mom-mer-arm-') as ImageKey) : key)
        .setOrigin(pivot.x / w, pivot.y / h).setScale(this.s);
    this.armR = arm('mom-arm-right', pivotR).setAlpha(0);
    this.eyes = headLayer('mom-eyes-open');
    this.mouth = headLayer('mom-mouth-smile');
    this.armL = arm('mom-arm-left', pivotL);
    // The wave, the hip and the thumbs-up hang behind her side; the chin and the clap come across her front.
    this.right = {
      wave: this.armR,
      rest: arm('mom-arm-right-rest', pivotR),
      thumb: arm('mom-arm-right-thumb', pivotR).setAlpha(0),
      chin: arm('mom-arm-right-chin', pivotR).setAlpha(0),
      clap: arm('mom-arm-right-clap', pivotR).setAlpha(0),
    };
    this.left = {
      point: this.armL,
      reach: arm('mom-arm-left-reach', pivotL).setAlpha(0),
      open: arm('mom-arm-left-open', pivotL).setAlpha(0),
      clap: arm('mom-arm-left-clap', pivotL).setAlpha(0),
    };
    const R = this.right;
    const Lf = this.left;
    const nurse = outfit === 'nurse';
    // (the mermaid's long hair at the back stays on her body; her hair in front, the cap and the crown turn with her head)
    this.head = [
      headLayer('mom-head'),
      headLayer(mermaid ? 'mom-mer-hair' : 'mom-hair'),
      ...(nurse ? [headLayer('mom-cap-nurse')] : []), ...(mermaid ? [headLayer('mom-mer-crown')] : []), this.eyes, this.mouth,
    ];
    this.box = scene.add
      .container(at.x, at.y, [
        ...(mermaid ? [layer('mom-mer-tail'), layer('mom-mer-hair-back')] : []),
        R.wave, R.rest, R.thumb, layer(nurse ? 'mom-body-nurse' : mermaid ? 'mom-mer-top' : 'mom-body'), ...this.head,
        Lf.point, Lf.reach, Lf.open, Lf.clap, R.chin, R.clap,
      ])
      .setDepth(4);
    this.auto = AUTO_SCENES.includes(scene.sys.settings.key);
    this.scheduleBlink();
    // Gentle breathing (a very slow rise of the shoulders), the only thing she does on her own.
    this.breath = scene.tweens.add({ targets: this.box, scaleY: 1.012, duration: 1900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    scene.events.on(Phaser.Scenes.Events.UPDATE, this.update, this);
    this.box.once(Phaser.GameObjects.Events.DESTROY, () => scene.events.off(Phaser.Scenes.Events.UPDATE, this.update, this));
  }

  /** Her mouth in world coordinates (where a shared slice goes). */
  get mouthAt() {
    const { h, cx, mouth } = ART.mom;
    return { x: this.box.x + (mouth.x - cx) * this.s, y: this.box.y + (mouth.y - h) * this.s };
  }

  /** Her frame in world coordinates (for keeping things clear of her). */
  get frameLeft() {
    return this.box.x - ART.mom.cx * this.s;
  }

  private setEyes(e: Eyes) {
    if (this.eyesKey === e) return;
    this.eyesKey = e;
    this.eyes.setTexture(`mom-eyes-${e}`);
  }

  private setMouth(m: Mouth) {
    if (this.mouthKey === m) return;
    this.mouthKey = m;
    this.mouth.setTexture(`mom-mouth-${m}`);
  }

  private scheduleBlink() {
    this.scene.time.delayedCall(Phaser.Math.Between(2200, 5200), () => {
      if (!this.box.active) return;
      if (!this.mood) {
        this.setEyes('blink');
        this.scene.time.delayedCall(140, () => this.box.active && !this.mood && this.setEyes('open'));
      }
      this.scheduleBlink();
    });
  }

  /** Cross-fades between two drawings of one arm (same pivot, same frame). */
  private swap(from: Phaser.GameObjects.Image, to: Phaser.GameObjects.Image) {
    // (a quick back-and-forth would otherwise leave two fades fighting over one drawing)
    this.scene.tweens.killTweensOf([from, to]);
    this.scene.tweens.add({ targets: from, alpha: 0, duration: POSE_MS });
    this.scene.tweens.add({ targets: to, alpha: 1, duration: POSE_MS });
  }

  private setRight(p: RightPose) {
    if (this.rPose === p) return;
    this.swap(this.right[this.rPose], this.right[p]);
    this.rPose = p;
  }

  private setLeft(p: LeftPose) {
    if (this.lPose === p) return;
    this.swap(this.left[this.lPose], this.left[p]);
    this.lPose = p;
  }

  /** The right arm: raised and waving, or resting with the hand on the hip. */
  private setWave(on: boolean) {
    this.setRight(on ? 'wave' : 'rest');
  }

  /** The pointing arm, or the arm reaching down to the counter (while her demo hand is on screen). */
  private setReach(on: boolean) {
    this.setLeft(on ? 'reach' : 'point');
  }

  /** Leans a little toward the work from the waist (0 = upright). */
  private leanTo(a: number) {
    if (this.lean === a) return;
    this.lean = a;
    this.leanTween?.remove();
    this.leanTween = this.scene.tweens.add({ targets: this.box, angle: a, duration: 500, ease: 'Sine.easeInOut' });
  }

  /**
   * Visual round 6: in a recipe and in the garden she is not frozen in one pose. What she does decides it:
   * her demo hand on the counter = her arm reaches down to it; the child working (a finger held down: a drag, a rub)
   * = she watches, chin on her hand, the other hand on the counter, leaning in a little; talking to the child = an open
   * palm toward the work; otherwise she points at it with her hand on her hip. Gestures (a wave, a clap, a thumbs-up)
   * run by themselves and win. Every change is a soft cross-fade.
   */
  private autoPose(delta: number) {
    if (this.scene.time.now < this.gestureUntil) return;
    const handOn = this.handActive?.() ?? false;
    const down = this.scene.input.manager.pointers.some((p) => p.isDown);
    this.downMs = down ? this.downMs + delta : 0;
    const busy = !!this.mouthHeld || !!this.chewing || this.sharing();
    if (this.downMs >= WATCH_AFTER_MS && !busy) this.watchLeft = WATCH_HOLD_MS;
    else if (!down) this.watchLeft = Math.max(0, this.watchLeft - delta);
    if (busy) this.watchLeft = 0;
    const cur = voice.current;
    if (voice.speaking && cur && !QUIET.test(cur)) this.talkLeft = TALK_HOLD_MS;
    else this.talkLeft = Math.max(0, this.talkLeft - delta);

    if (handOn || (this.handActive && this.lPose === 'reach' && this.handGone < REACH_HOLD_MS && this.watchLeft <= 0)) {
      this.setLeft('reach');
      this.setRight('rest');
      this.leanTo(0);
    } else if (this.watchLeft > 0) {
      this.setLeft('reach');
      this.setRight('chin');
      this.leanTo(LEAN);
    } else if (this.talkLeft > 0 && !busy) {
      this.setLeft('open');
      this.setRight('rest');
      this.leanTo(0);
    } else {
      this.setLeft('point');
      this.setRight('rest');
      this.leanTo(0);
    }
  }

  /** The recipe's sharing step: she is one of the mouths, so she keeps still (no chin on her hand, no leaning). */
  private sharing() {
    const t = (this.scene as unknown as { stepDef?: { type?: string } }).stepDef?.type;
    return t === 'share' || t === 'feed';
  }

  /** Her demo hand (the recipe's MomHandView): while it shows, her pointing arm reaches down to the counter. */
  followHand(active: () => boolean) {
    this.handActive = active;
  }

  /** Mouth follows the voice line's loudness, each shape held at least 90 ms so it reads as speech. */
  private update(_t: number, delta: number) {
    this.updateHead(delta);
    if (this.handActive) {
      if (this.handActive()) this.handGone = 0;
      else this.handGone += delta;
    }
    if (this.auto) this.autoPose(delta);
    else if (this.handActive && this.scene.time.now >= this.gestureUntil) {
      if (this.handActive()) this.setReach(true);
      else if (this.lPose === 'reach' && this.handGone >= REACH_HOLD_MS) this.setReach(false);
    }
    if (this.mouthHeld) return this.setMouth(this.mouthHeld);
    this.mouthHold -= delta;
    if (this.mouthHold > 0) return;
    if (!voice.speaking) return this.setMouth('smile');
    const lv = voice.level();
    const next: Mouth = lv > 0.42 ? 'open' : lv > 0.12 ? 'talk' : 'smile';
    if (next !== this.mouthKey) this.mouthHold = 90;
    this.setMouth(next);
  }

  /**
   * The premium round: her head lives. While she talks it rises a little with the voice's loudness (`HEAD_BOB`), and at
   * the start of a line it tilts toward the child (the side of her last finger), coming back once she has been quiet
   * for TALK_HOLD_MS. A finger that held something and let go: she glances at where it was put (`lookAt`).
   */
  private updateHead(delta: number) {
    const now = this.scene.time.now;
    const p = this.scene.input.manager.pointers.find((q) => q.isDown);
    if (p) {
      this.fingerSide = p.worldX < this.box.x ? -1 : 1;
      this.holdMs += delta;
      this.lastUp = { x: p.worldX, y: p.worldY };
    } else if (this.holdMs) {
      if (this.holdMs >= PUT_AFTER_MS) {
        // (in a recipe: the dish, where things are put; elsewhere: the spot it was let go)
        const dish = (this.scene as unknown as { ctx?: { dish?: { x: number; y: number; visible?: boolean } } }).ctx?.dish;
        const at = dish && dish.visible !== false ? dish : this.lastUp;
        this.glance = { x: at.x, y: at.y, until: now + GLANCE_MS };
      }
      this.holdMs = 0;
    }
    const cur = voice.speaking ? voice.current : null;
    if (cur) {
      this.quietMs = 0;
      if (cur !== this.talkLine) {
        this.talkLine = cur;
        if (!QUIET.test(cur)) this.tiltTo(TALK_TILT * this.fingerSide, 260);
      }
    } else if (this.talkLine !== null) {
      this.quietMs += delta;
      if (this.quietMs >= TALK_HOLD_MS) {
        this.talkLine = null;
        this.tiltTo(0, 360);
      }
    }
    const want = cur ? -HEAD_BOB * Math.min(1, voice.level() * 1.6) : 0;
    this.bob += (want - this.bob) * Math.min(1, delta / 70);
    const s = this.s;
    const y = this.neck.y + (this.bob + this.hd.dy) * s;
    const a = this.hd.tilt + this.hd.nod;
    for (const l of this.head) {
      if (l === this.eyes) l.setPosition(this.neck.x + this.look.x, y + this.look.y);
      else l.setPosition(this.neck.x, y);
      l.setAngle(a);
    }
  }

  /** Her head's resting tilt (talking toward the child, or upright again). */
  private tiltTo(a: number, ms: number) {
    if (this.hd.tilt === a && !this.tiltTween) return;
    this.tiltTween?.remove();
    this.tiltTween = this.scene.tweens.add({ targets: this.hd, tilt: a, duration: ms, ease: 'Sine.easeInOut', onComplete: () => (this.tiltTween = undefined) });
  }

  /** A head gesture over the resting tilt: `nod` degrees and `dy` frame units (up < 0), out and back. */
  private headMove(o: { nod?: number; dy?: number; ms: number; hold?: number; repeat?: number; delay?: number; ease?: string }) {
    this.gestTweens.forEach((t) => t.remove());
    this.hd.nod = 0;
    this.hd.dy = 0;
    const t = this.scene.tweens.add({
      targets: this.hd,
      nod: o.nod ?? 0,
      dy: o.dy ?? 0,
      duration: o.ms,
      hold: o.hold ?? 0,
      delay: o.delay ?? 0,
      yoyo: true,
      repeat: o.repeat ?? 0,
      ease: o.ease ?? 'Sine.easeOut',
      onComplete: () => {
        this.hd.nod = 0;
        this.hd.dy = 0;
      },
    });
    this.gestTweens = [t];
  }

  /** A nod (her head dips and comes back up), `times` times. */
  nod(times = 1, delay = 0) {
    this.headMove({ dy: 7, nod: 1.5 * this.fingerSide, ms: 110, repeat: times - 1, delay, ease: 'Sine.easeInOut' });
  }

  /** Her head tilts to one side for a moment (+ = toward her right) and comes back. */
  tilt(deg: number, ms = 220, hold = 300) {
    this.headMove({ nod: deg, ms, hold, ease: 'Sine.easeOut' });
  }

  /** A little start: her head jerks back and up, her body straightens (a surprise). */
  private startle() {
    const now = this.scene.time.now;
    if (now - this.startledAt < 700 || !this.box.active) return;
    this.startledAt = now;
    // (back = away from the child: her work is on her left)
    this.headMove({ nod: -3 * this.fingerSide, dy: -8, ms: 180, hold: 120, ease: 'Quad.easeOut' });
    this.breath?.pause();
    this.scene.tweens.add({
      targets: this.box,
      scaleY: 1.03,
      duration: 180,
      yoyo: true,
      hold: 120,
      ease: 'Quad.easeOut',
      onComplete: () => {
        this.box.setScale(1);
        this.breath?.resume();
      },
    });
  }

  /** Eyes drift toward a world point (call every frame; eases by itself). Right after she put something down they
   * look at where it was put for a moment first. */
  lookAt(x: number, y: number) {
    if (this.glance) {
      if (this.scene.time.now < this.glance.until && !this.scene.input.manager.pointers.some((q) => q.isDown)) ({ x, y } = this.glance);
      else this.glance = undefined;
    }
    const s = this.s;
    const ex = this.box.x;
    const ey = this.box.y - (IMAGES['mom-eyes-open'].size[1] - 270) * s;
    const dx = x - ex;
    const dy = y - ey;
    const d = Math.max(1, Math.hypot(dx, dy));
    const reach = Math.min(1, d / (300 * s));
    this.look.x += ((dx / d) * LOOK_MAX * reach * s - this.look.x) * 0.15;
    this.look.y += ((dy / d) * LOOK_MAX * 0.6 * reach * s - this.look.y) * 0.15;
    this.eyes.x = this.neck.x + this.look.x;
    this.eyes.y = this.head[0].y + this.look.y;
  }

  /** Happy eyes and a short happy bounce with a wave (end of a step). */
  cheer() {
    this.mood = 'happy';
    this.setEyes('happy');
    this.bounce();
    // Visual round 6: a wave, a clap or a thumbs-up, in turn from a shuffled deck (never the same twice in a row).
    if (!this.cheers.length) {
      const last = this.lastCheer;
      this.cheers = Phaser.Utils.Array.Shuffle(['wave', 'clap', 'thumb'] as ('wave' | 'clap' | 'thumb')[]);
      if (this.cheers[this.cheers.length - 1] === last) this.cheers.unshift(this.cheers.pop()!);
    }
    const g = (this.lastCheer = this.cheers.pop()!);
    this.gesture(1100);
    if (g === 'clap') {
      this.clap(3);
      // (her head nods with the claps: the hands meet at POSE_MS + 110 and + 330)
      this.nod(2, POSE_MS);
    } else if (g === 'thumb') {
      this.tilt(4, 200, 380);
      this.setRight('thumb');
      this.setLeft('point');
      this.scene.tweens.add({ targets: this.right.thumb, angle: { from: 0, to: -8 }, duration: 180, yoyo: true, repeat: 1, ease: 'Back.easeOut', onComplete: () => this.right.thumb.setAngle(0) });
    } else {
      this.setWave(true);
      this.tilt(4, 200, 420);
      this.scene.tweens.add({ targets: this.armR, angle: { from: -12, to: 12 }, duration: 150, yoyo: true, repeat: 2, onComplete: () => this.armR.setAngle(0) });
    }
    this.scene.time.delayedCall(1100, () => {
      if (!this.box.active) return;
      this.setRight('rest');
      if (this.lPose === 'clap') this.setLeft('point');
    });
    this.scene.time.delayedCall(1100, () => this.box.active && this.mood === 'happy' && this.rest());
  }

  private lastCheer?: 'wave' | 'clap' | 'thumb';

  /** A gesture that runs by itself for `ms`: the automatic poses wait (and she stands upright). */
  private gesture(ms: number) {
    this.gestureUntil = this.scene.time.now + ms;
    this.leanTo(0);
  }

  /** Claps `times` (both hands meet in front of her chest; each arm swings a few degrees on its own shoulder). */
  private clap(times: number) {
    this.setRight('clap');
    this.setLeft('clap');
    const { clap: l } = this.left;
    const { clap: r } = this.right;
    this.scene.tweens.add({ targets: l, angle: { from: 0, to: 7 }, duration: 110, yoyo: true, repeat: times - 1, delay: POSE_MS, ease: 'Sine.easeOut', onComplete: () => l.setAngle(0) });
    this.scene.tweens.add({ targets: r, angle: { from: 0, to: -7 }, duration: 110, yoyo: true, repeat: times - 1, delay: POSE_MS, ease: 'Sine.easeOut', onComplete: () => r.setAngle(0) });
  }

  /**
   * The premium round's cheer: a short squash (she gathers herself), then a stretch up and settling back, never a jump
   * (her frame is cut at the screen bottom). Her head does the rest (`tilt`, `nod`).
   */
  private bounce() {
    this.breath?.pause();
    this.leanTween?.remove();
    this.box.setScale(1).setAngle(0);
    this.lean = 0;
    this.scene.tweens.chain({
      targets: this.box,
      tweens: [
        { scaleY: 0.97, scaleX: 1.03, duration: 90, ease: 'Quad.easeOut' },
        { scaleY: 1.04, scaleX: 0.985, duration: 170, ease: 'Quad.easeOut' },
        { scaleY: 1, scaleX: 1, duration: 300, ease: 'Back.easeOut' },
      ],
      onComplete: () => {
        this.box.setScale(1);
        this.breath?.resume();
      },
    });
  }

  /**
   * A happy stretch and sway from the waist (her frame is cut at the screen bottom, so she never
   * jumps: that would open a gap under her).
   */
  private joy(times: number) {
    this.breath?.pause();
    this.leanTween?.remove();
    this.box.setScale(1);
    this.scene.tweens.add({ targets: this.box, scaleY: 1.05, scaleX: 0.985, duration: 170, yoyo: true, repeat: times, ease: 'Quad.easeOut' });
    this.scene.tweens.add({
      targets: this.box,
      angle: { from: -2.5, to: 2.5 },
      duration: 170,
      yoyo: true,
      repeat: times,
      onComplete: () => {
        this.box.setAngle(this.lean).setScale(1);
        this.breath?.resume();
      },
    });
  }

  private tickledAt = -Infinity;

  /** A world point on her face or upper body (a tap there makes her smile). */
  hit(x: number, y: number) {
    const { cx, h } = ART.mom;
    const lx = (x - this.box.x) / this.s + cx;
    const ly = (y - this.box.y) / this.s + h;
    return lx > 300 && lx < 700 && ly > 30 && ly < 620;
  }

  /** A tap on her: a happy smile and a little sway from the waist, a heart or two (never while she is busy). */
  tickle() {
    const now = this.scene.time.now;
    if (this.mood || this.mouthHeld || this.chewing || this.handActive?.() || now - this.tickledAt < 1200) return;
    this.tickledAt = now;
    this.mood = 'happy';
    this.setEyes('happy');
    this.mouthHeld = 'open';
    this.joy(0);
    this.tilt(-5 * this.fingerSide, 160, 380);
    sfx(this.scene, 'pop', { volume: 0.5 });
    // a short laugh in her own voice (never over a line of hers, never waiting for one)
    if (!voice.speaking) voice.say('vo-laugh', { ttlMs: 300 });
    const { cx, h, mouth } = ART.mom;
    burst(this.scene, this.box.x + (mouth.x - cx + 120) * this.s, this.box.y + (mouth.y - h - 120) * this.s, { texture: 'fx-heart', count: 3, tint: [0xf06a8a, 0xf5a3b5], size: 34 * this.s, speed: 240, gravityY: -160, lifespan: 800, depth: 60 });
    this.scene.time.delayedCall(450, () => {
      if (this.mouthHeld === 'open' && this.mood === 'happy') this.mouthHeld = null;
    });
    this.scene.time.delayedCall(900, () => this.box.active && this.mood === 'happy' && this.rest());
  }

  /** Hello: happy eyes and a wave of the raised hand (the title, after the play tap). */
  wave() {
    this.gesture(1700);
    this.mood = 'happy';
    this.setEyes('happy');
    this.setWave(true);
    this.scene.tweens.add({ targets: this.armR, angle: { from: -14, to: 14 }, duration: 180, yoyo: true, repeat: 3, onComplete: () => this.armR.setAngle(0) });
    this.scene.time.delayedCall(1700, () => this.box.active && this.setWave(false));
    this.scene.time.delayedCall(1500, () => this.box.active && this.mood === 'happy' && this.rest());
  }

  /** Stays happy (the finale, watching Pipa eat). */
  happy() {
    this.mood = 'happy';
    this.setEyes('happy');
  }

  surprised() {
    if (this.mood !== 'surprised') this.startle();
    this.mood = 'surprised';
    this.setEyes('surprised');
  }

  rest() {
    this.mood = null;
    this.setEyes('open');
  }

  /** Sharing the pizza: a slice comes her way (surprised, mouth open), or goes elsewhere (back to her smile). */
  expectFood(on: boolean) {
    if (this.chewing) return;
    if (on) {
      this.surprised();
      this.mouthHeld = 'open';
    } else if (this.mouthHeld) {
      this.mouthHeld = null;
      this.rest();
    }
  }

  get expecting() {
    return this.mouthHeld === 'open';
  }

  /** She got a slice: happy eyes, chewing (mom-mouth-chew and her smile in turn) for `ms`. */
  chew(ms = 1000) {
    this.chewing?.remove();
    this.happy();
    let n = 0;
    this.mouthHeld = 'chew';
    this.chewing = this.scene.time.addEvent({
      delay: 160,
      repeat: Math.max(1, Math.round(ms / 160)) - 1,
      callback: () => {
        n++;
        this.mouthHeld = n % 2 ? 'smile' : 'chew';
        if (this.chewing && this.chewing.getRepeatCount() === 0) {
          this.chewing = undefined;
          this.mouthHeld = null;
          this.rest();
        }
      },
    });
  }

  /**
   * Turns the pointing arm so the fingertip aims at a world point, within ±20° of its drawn pose.
   * Only used where Pipa is not on screen (4:3): on the phone the aim would put the arm over her head.
   */
  aimArmAt(x: number, y: number, ms = 400) {
    const { pivotL, fingertipL, cx, h } = ART.mom;
    const px = this.box.x + (pivotL.x - cx) * this.s;
    const py = this.box.y + (pivotL.y - h) * this.s;
    const drawn = Math.atan2(fingertipL.y - pivotL.y, fingertipL.x - pivotL.x);
    let rot = Phaser.Math.RadToDeg(Math.atan2(y - py, x - px) - drawn);
    rot = Phaser.Math.Angle.WrapDegrees(rot);
    this.armTo(Phaser.Math.Clamp(rot, -ARM_MAX, ARM_MAX), ms);
  }

  /** Steps sideways (the feeding step: she makes room for Pipa). */
  stepAside(dx: number, ms = 600) {
    if (!dx) return;
    this.scene.tweens.add({ targets: this.box, x: this.box.x + dx, duration: ms, ease: 'Sine.easeInOut' });
  }

  /** Pointing arm to an angle (0 = her default pose, pointing at the pizza). */
  armTo(angle: number, ms = 400) {
    this.scene.tweens.killTweensOf(this.armL);
    this.scene.tweens.add({ targets: this.armL, angle, duration: ms, ease: 'Sine.easeInOut' });
  }

  /**
   * The finale: she points at what they made (a little up, at the photo), waves with the other hand, happy face, a few
   * bounces. (Round 11: the arm used to swing +55° down, off the bottom of the screen, and she looked one-armed.)
   */
  celebrate() {
    this.happy();
    this.gestureUntil = Infinity;
    this.leanTo(0);
    this.setReach(false);
    this.handActive = undefined;
    this.armTo(-12, 350);
    this.setWave(true);
    this.joy(3);
    this.headMove({ nod: 3, ms: 170, repeat: 3, ease: 'Sine.easeInOut' });
    this.scene.tweens.add({ targets: this.armR, angle: { from: -14, to: 14 }, duration: 200, yoyo: true, repeat: 5, onComplete: () => this.armR.setAngle(0) });
  }

  destroy() {
    this.breath?.destroy();
    this.box.destroy();
  }
}
