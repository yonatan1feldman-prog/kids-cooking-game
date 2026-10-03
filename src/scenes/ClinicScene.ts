import Phaser from 'phaser';
import { keepPhoto } from '../core/album';
import { ART, FX_SOFT, type ImageKey } from '../core/assets';
import { music } from '../core/audio';
import { AILMENTS, PATIENTS, planVisit, TOOL_LINE, TOOLS, type Ailment, type LensId, type Patient, type ToolId, type Treat } from '../core/clinic';
import { boing, burst, puff, stars } from '../core/fx';
import { tapMotion, type HandKey, type HandMotion } from '../core/hand';
import { confetti, sway } from '../core/juice';
import { sfx } from '../core/sfx';
import { TUNING } from '../core/tuning';
import { Character } from '../steps/Character';
import type { CharacterDef } from '../recipes/types';
import type { Spot } from '../core/stage';
import { MiniGame, type P } from './MiniGame';

const T = TUNING.clinic;
const C = ART.clinic;
/** The patients' frame (Pipa's and the guests': 600x700, feet at y 684). */
const FW = 600;
const FH = 700;
const FEET = 684;
/** The close-ups' frame (520) and the magnifier rim around them (600). */
const LENS = 520;
const RING = 600;
const STICKERS: ImageKey[] = ['sticker-star', 'sticker-heart', 'sticker-smile'];
/** Candidate places of the hidden splinter in lens-paw (the big pad, two toes) and of the wheezy spot (chest index). */
const PAW_SPOTS = [C.paw, { x: 214, y: 158 }, { x: 306, y: 150 }];
/** Where the stethoscope listens on the tummy close-up, and where the warm bottle goes. */
const TUMMY_SPOTS = [{ x: 260, y: 196 }, { x: 186, y: 318 }, { x: 334, y: 318 }];
const TUMMY_MID = { x: 260, y: 300 };

/** A patient: the layered character (Character.ts) with her own voice's pitch and things drawn on her. */
class PatientView extends Character {
  constructor(scene: Phaser.Scene, def: CharacterDef, spot: Spot, rate: number) {
    super(scene, def, spot, spot);
    this.voiceRate = rate;
  }
  /** An image on her, at a point of her 600x700 frame (it moves and grows with her). */
  put(key: string, f: P, scale = 1, angle = 0) {
    const img = new Phaser.GameObjects.Image(this.scene, f.x - FW / 2, f.y - FH / 2, key).setScale(scale).setAngle(angle);
    this.box.add(img);
    return img;
  }
  /** A point of her frame in the world, where she rests. */
  at(f: P): P {
    return { x: this.rest.x + (f.x - FW / 2) * this.scale, y: this.rest.y + (f.y - FH / 2) * this.scale };
  }
  get rate() {
    return this.voiceRate;
  }
}

interface Visitor {
  p: Patient;
  a: Ailment;
  view: PatientView;
  /** Her place on the bench in the waiting room. */
  seat: Spot;
  /** What shows she is not well (pink cheeks, a bump, a scrape...): they go when she is better. */
  signs: Phaser.GameObjects.Image[];
  /** The picture card over her head in the waiting room (little chef only). */
  card?: Phaser.GameObjects.Image;
  done: boolean;
}

interface Tool {
  id: ToolId;
  img: Phaser.GameObjects.Image;
  slot: Phaser.GameObjects.Image;
  glow: Phaser.GameObjects.Image;
  home: P;
  homeScale: number;
  /** It stays where it was put (the cloth, the warm bottle, the plaster). */
  away: boolean;
}

interface Lens {
  id: LensId;
  box: Phaser.GameObjects.Container;
  /** Its centre at rest (the wiggle sways it around this). */
  at: P;
  s: number;
  from: P;
}

/**
 * The clinic (research/clinic-spec.md), the second world, chosen on the title: Mom the nurse and the child help three
 * patients (the turtle, the penguin, the giraffe, Pipa) who don't feel well. In the waiting room she picks who comes
 * in; in the treatment room the patient sits on the bed, Mom says what is wrong (big chef: she finds it herself from
 * what she sees and hears), and she treats it with the tools on the tray, one move each: hold the thermometer in the
 * mouth, lay the cool cloth on the forehead, listen with the stethoscope, brush the teeth, spray the scrape clean, rub
 * the cream in, take the splinter out with the tweezers, a plaster. Close-ups pop out of the patient like a magnifying
 * bubble. Little chef: the next tool glows, one spare tool. Big chef: the plan is on a chart she has to remember (a tap
 * peeks), two spare tools, more steps, a spot to find by ear or with the magnifier, and the close-up tickles (it sways
 * while she brushes). The patient always gets better: "All better!", a sticker of her choice, and back to the bench.
 * After the third, a photo of the happy patients for the memory book, and quietly back to the title.
 * Nothing hurts, nothing is scary: no blood, no needles, no crying, no failing; a wrong tool just hops back.
 */
export class ClinicScene extends MiniGame {
  protected readonly id = 'clinic';
  protected readonly song = 'clinic' as const;
  protected readonly momOutfit = 'nurse' as const;
  protected readonly homeScene = 'Title' as const;
  protected readonly waiting = ['pick', 'diagnose', 'tool', 'sticker'] as const;
  private visit: Visitor[] = [];
  private cur: Visitor | null = null;
  private waitRoom: Phaser.GameObjects.GameObject[] = [];
  private treatRoom: Phaser.GameObjects.GameObject[] = [];
  private room!: { x0: number; x1: number; bedX: number; seatY: number; bedScale: number; ps: number; toolS: number };
  private tools: Tool[] = [];
  private steps: Treat[] = [];
  private si = 0;
  private lens: Lens | null = null;
  /** Things drawn in the close-up, by name (dust, scrape, splinter, cream, dirt-N...). */
  private lensThings = new Map<string, Phaser.GameObjects.Image>();
  private held: { tool: Tool; from: P; moved: number; last: P; t0: number } | null = null;
  /** Progress of the current move (ms held, distance rubbed, spots heard). */
  private prog = 0;
  private spots: { f: P; img: Phaser.GameObjects.Image; done: number }[] = [];
  private hidden: P | null = null;
  private gripped = false;
  private gripAt: P | null = null;
  private chart: { box: Phaser.GameObjects.Container; rows: Phaser.GameObjects.Image[]; ticks: Phaser.GameObjects.Image[]; home: P; homeScale: number; open: boolean; timer?: Phaser.Time.TimerEvent } | null = null;
  private cards: { img: Phaser.GameObjects.Image; id: string }[] = [];
  private stickers: Phaser.GameObjects.Image[] = [];
  private toolSaid = new Set<number>();
  private wiggleT = 0;
  private lastHear = 0;

  constructor() {
    super('Clinic');
  }

  init() {
    super.init();
    this.visit = [];
    this.cur = null;
    this.waitRoom = [];
    this.treatRoom = [];
    this.tools = [];
    this.steps = [];
    this.si = 0;
    this.lens = null;
    this.lensThings = new Map();
    this.held = null;
    this.prog = 0;
    this.spots = [];
    this.hidden = null;
    this.gripped = false;
    this.gripAt = null;
    this.chart = null;
    this.cards = [];
    this.stickers = [];
    this.toolSaid = new Set();
    this.wiggleT = 0;
    Object.assign(this.shown, { patients: [] as string[], treated: 0, step: '', tool: '', wrong: 0, diagnosed: 0, photo: 0 });
  }

  protected withPipa() {
    return !this.visit.some((v) => v.p.id === 'pipa');
  }

  // ---------------------------------------------------------------- the two rooms

  /** A room's wall and floor, anchored bottom-centre at native height like the kitchen (cropped only at the sides). */
  private backdrop(key: ImageKey) {
    const L = this.L;
    const s = Math.max(1, L.W / 2400);
    return this.add.image(L.W / 2, L.H, key).setOrigin(0.5, 1).setScale(s).setDepth(-100);
  }

  protected build() {
    const L = this.L;
    const S = this.S;
    const k = L.k;
    // (the test harness may choose the patients: window.__clinicPlan = [['turtle', 'tooth'], ...])
    const forced = (globalThis as { __clinicPlan?: [string, string][] }).__clinicPlan;
    const plan = forced
      ? forced.map(([p, a]) => ({ patient: PATIENTS.find((q) => q.id === p)!, ailment: AILMENTS[a as keyof typeof AILMENTS] }))
      : planVisit(T.patients);
    this.visit = plan.map(({ patient, ailment }) => ({ p: patient, a: ailment }) as Visitor);
    this.shown.patients = this.visit.map((v) => `${v.p.id}-${v.a.id}`);

    const petLeft = S.pet && this.withPipa() ? S.pet.x - 270 * S.pet.scale : Infinity;
    const right = Math.min(petLeft, S.momFace.x0) - 16 * k;

    // The waiting room: the bench, the patients on it.
    this.waitRoom.push(this.backdrop('bg-clinic-wait'));
    const wl = L.m + 20 * k;
    const bs = Math.min(0.9 * k, (right - wl) / 1500);
    const benchX = (wl + right) / 2;
    const benchY = L.Y(992) - 210 * bs;
    this.waitRoom.push(this.add.image(benchX, benchY, 'clinic-bench').setScale(bs).setDepth(2));
    const seatY = benchY + (C.benchSeat - 210) * bs;
    const pw = Math.min(0.6 * k, (400 * bs) / 500);
    this.visit.forEach((v, i) => {
      const x = benchX + (i - 1) * 450 * bs;
      v.seat = { x, y: seatY + 34 * bs - (FEET - FH / 2) * pw, scale: pw };
      v.view = new PatientView(this, v.p.def, v.seat, v.p.rate);
      v.view.box.setDepth(6);
      v.signs = this.signsOn(v);
      v.done = false;
      if (this.level === 1) {
        // (little chef: what ails her, on a card by her head)
        const top = v.view.at({ x: 520, y: 110 });
        v.card = this.add.image(top.x, top.y, v.a.card).setScale(0.56 * k).setDepth(8);
        this.waitRoom.push(v.card);
      }
    });

    // The treatment room: the bed in the middle, the tray on the left (where the kitchen's bins are).
    this.treatRoom.push(this.backdrop('bg-clinic'));
    const x0 = S.work.x0;
    const bedScale = Math.min(0.95 * k, (right - x0) / 900);
    const bedX = (x0 + right) / 2;
    const bedY = L.Y(990) - 160 * bedScale;
    this.treatRoom.push(this.add.image(bedX, bedY, 'clinic-bed').setScale(bedScale).setDepth(2));
    const bedSeat = bedY + (C.bedSeat - 160) * bedScale;
    const ps = Math.min(0.78 * k, (bedSeat - L.Y(130)) / 650);
    this.room = { x0, x1: right, bedX, seatY: bedSeat, bedScale, ps, toolS: 0.82 * k };
    this.showRoom('wait');
  }

  private showRoom(which: 'wait' | 'treat') {
    for (const o of this.waitRoom) (o as Phaser.GameObjects.Image).setVisible(which === 'wait');
    for (const o of this.treatRoom) (o as Phaser.GameObjects.Image).setVisible(which === 'treat');
    for (const v of this.visit) v.view.box.setVisible(which === 'wait' || v === this.cur);
    this.shown.room = which;
  }

  /** Swaps rooms behind a quick soft fade (the door). */
  private through(then: () => void) {
    const cam = this.cameras.main;
    sfx(this, 'whoosh', { volume: 0.5 });
    cam.fadeOut(260, 255, 250, 240);
    cam.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      if (this.leaving) return;
      then();
      cam.fadeIn(300, 255, 250, 240);
    });
  }

  protected ready() {
    this.time.delayedCall(500, () => this.startPick(true));
  }

  protected shutdown() {
    this.chart?.timer?.remove();
  }

  // ---------------------------------------------------------------- what shows she is not well

  private signsOn(v: Visitor): Phaser.GameObjects.Image[] {
    const p = v.p;
    const view = v.view;
    switch (v.a.id) {
      case 'fever':
        return [
          view.put('clinic-cheek', p.cheeks[0], 0.95).setAlpha(0.75),
          view.put('clinic-cheek', p.cheeks[1], 0.95).setAlpha(0.75),
          view.put('clinic-sweat', { x: p.forehead.x + 100, y: p.forehead.y + 20 }, 0.9),
        ];
      case 'tooth':
        return [view.put('clinic-bump', p.cheeks[1], 0.85)];
      case 'knee':
        return [view.put('clinic-scrape', p.foot!, 0.5, -10), view.put('clinic-dust', p.foot!, 0.45)];
      case 'paw':
        return [view.put('clinic-splinter', { x: p.foot!.x - 8, y: p.foot!.y + 6 }, 0.55, -25)];
      default:
        return [];
    }
  }

  /** She shows what is wrong (as she comes in, and when tapped): a cough, a gurgle, warm cheeks, her foot. */
  private showSign(v: Visitor) {
    const view = v.view;
    const box = view.box;
    const s = view.scale;
    const rate = view.rate;
    this.tweens.killTweensOf(box);
    box.setScale(s).setPosition(view.rest.x, view.rest.y).setAngle(0);
    switch (v.a.id) {
      case 'cough':
        sfx(this, 'cough', { minGapMs: 0, rate });
        this.tweens.add({ targets: box, scaleY: s * 0.92, duration: 90, yoyo: true, repeat: 1, ease: 'Quad.easeOut' });
        break;
      case 'tummy':
        sfx(this, 'gurgle', { minGapMs: 0 });
        this.tweens.add({ targets: box, angle: { from: -3, to: 3 }, duration: 140, yoyo: true, repeat: 2, ease: 'Sine.easeInOut', onComplete: () => box.setAngle(0) });
        break;
      case 'fever':
        for (const g of v.signs) this.tweens.add({ targets: g, alpha: 1, duration: 260, yoyo: true, repeat: 1 });
        sfx(this, 'char-wow', { minGapMs: 0, rate, volume: 0.5 });
        break;
      default:
        for (const g of v.signs) boing(this, g, 0.25);
        this.tweens.add({ targets: box, y: view.rest.y - 30 * s, duration: 160, yoyo: true, ease: 'Quad.easeOut' });
        sfx(this, 'char-wow', { minGapMs: 0, rate, volume: 0.5 });
    }
  }

  // ---------------------------------------------------------------- 1. the waiting room

  private startPick(first: boolean) {
    this.cur = null;
    this.begin('pick', first ? 'vo-clinic-hello' : 'vo-clinic-next');
  }

  private hitPatient(v: Visitor, at: P) {
    const c = v.view.at({ x: 300, y: 430 });
    return this.near(at, c, Math.max(150 * this.L.k, 250 * v.view.scale));
  }

  private callIn(v: Visitor) {
    this.setPhase('intro');
    this.cur = v;
    sfx(this, 'pop');
    boing(this, v.view.box, 0.1);
    v.view.setMood('happy');
    this.say(v.p.hello, { ttlMs: 3000 });
    if (v.card) this.tweens.add({ targets: v.card, alpha: 0, scale: 0, duration: 260 });
    // a happy hop toward the door, then the treatment room
    const door = { x: this.L.W / 2 + (1330 - 1200) * Math.max(1, this.L.W / 2400), y: v.seat.y };
    this.tweens.add({ targets: v.view.box, x: (v.seat.x + door.x) / 2, y: v.seat.y - 60 * v.seat.scale, duration: 420, ease: 'Quad.easeOut', yoyo: false });
    this.time.delayedCall(700, () =>
      this.through(() => {
        this.showRoom('treat');
        const spot = this.bedSpot();
        v.view.moveTo(spot, 0);
        v.view.box.setPosition(spot.x, spot.y).setScale(spot.scale).setDepth(12);
        v.view.setMood('rest');
        boing(this, v.view.box, 0.08);
        this.time.delayedCall(600, () => this.arrived(v));
      }),
    );
  }

  private bedSpot(shift = 0): Spot {
    const r = this.room;
    return { x: r.bedX + (435 - 450) * r.bedScale + shift, y: r.seatY - (FEET - FH / 2) * r.ps + 6 * r.ps, scale: r.ps };
  }

  /** On the bed: she shows what is wrong. Little chef: Mom says it. Big chef: she finds it. */
  private arrived(v: Visitor) {
    this.showSign(v);
    if (this.level === 1) {
      this.time.delayedCall(700, () => {
        this.say(v.a.line, { ttlMs: 5000, done: () => this.time.delayedCall(250, () => this.startTreat()) });
      });
      return;
    }
    this.time.delayedCall(600, () => this.startDiagnose());
  }

  // ---------------------------------------------------------------- 2. big chef: what is wrong?

  private startDiagnose() {
    const v = this.cur!;
    const S = this.S;
    const k = this.L.k;
    const others = Phaser.Utils.Array.Shuffle(Object.values(AILMENTS).filter((a) => a.id !== v.a.id)).slice(0, 2);
    const set = Phaser.Utils.Array.Shuffle([v.a, ...others]);
    const sc = (S.binScale(3) * 240) / 200;
    this.cards = set.map((a, i) => {
      const at = S.bin(i, 3);
      const img = this.add.image(at.x, at.y, a.card).setScale(0).setDepth(40);
      this.tweens.add({ targets: img, scale: sc, duration: 300, delay: 120 * i, ease: 'Back.easeOut' });
      return { img, id: a.id };
    });
    this.time.delayedCall(200, () => sfx(this, 'pop', { volume: 0.5 }));
    this.begin('diagnose', 'vo-clinic-what');
    void k;
  }

  private pickCard(c: { img: Phaser.GameObjects.Image; id: string }) {
    const v = this.cur!;
    const k = this.L.k;
    if (c.id !== v.a.id) {
      this.shown.wrong = (this.shown.wrong as number) + 1;
      boing(this, c.img, 0.15);
      this.tweens.add({ targets: c.img, y: c.img.y - 24 * k, duration: 120, yoyo: true });
      sfx(this, 'squish', { volume: 0.6 });
      this.say('vo-clinic-look', { ttlMs: 2500 });
      this.time.delayedCall(500, () => this.cur === v && this.showSign(v));
      this.miss();
      return;
    }
    this.setPhase('intro');
    this.shown.diagnosed = (this.shown.diagnosed as number) + 1;
    sfx(this, 'star');
    stars(this, c.img.x, c.img.y, 8, 50 * k);
    boing(this, c.img, 0.15);
    this.mom?.happy();
    this.time.delayedCall(800, () => this.mom?.rest());
    for (const o of this.cards) if (o !== c) this.tweens.add({ targets: o.img, alpha: 0, scale: 0, duration: 260, onComplete: () => o.img.destroy() });
    this.say(v.a.line, {
      ttlMs: 5000,
      done: () => {
        this.tweens.add({ targets: c.img, alpha: 0, scale: 0, duration: 260, onComplete: () => c.img.destroy() });
        this.cards = [];
        this.time.delayedCall(300, () => this.startTreat());
      },
    });
  }

  // ---------------------------------------------------------------- 3. the treatment

  private startTreat() {
    if (this.leaving) return;
    const v = this.cur!;
    this.steps = v.a.steps[this.level - 1];
    this.si = 0;
    this.toolSaid.clear();
    this.layTray();
    if (this.level === 2) {
      this.makeChart();
      this.openChart(true);
      this.say('vo-clinic-plan', {
        ttlMs: 5000,
        done: () => this.time.delayedCall(T.planMs - 1500, () => {
          this.foldChart();
          this.time.delayedCall(450, () => this.startStep());
        }),
      });
      return;
    }
    this.time.delayedCall(400, () => this.startStep());
  }

  /** The tools this patient needs, and one or two spare ones, shuffled on their tray places in the left column. */
  private layTray() {
    const S = this.S;
    const k = this.L.k;
    const need = [...new Set(this.steps.map((s) => s.tool))];
    const spare = Phaser.Utils.Array.Shuffle(TOOLS.filter((t) => !need.includes(t))).slice(0, T.decoys[this.level - 1]);
    const ids = Phaser.Utils.Array.Shuffle([...need, ...spare]) as ToolId[];
    const n = ids.length;
    const sc = S.binScale(n);
    this.tools = ids.map((id, i) => {
      const at = S.bin(i, n);
      const slot = this.add.image(at.x, at.y, 'clinic-slot').setScale(0).setDepth(20);
      const glow = this.add.image(at.x, at.y, FX_SOFT).setTint(0xfff1a8).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0).setDepth(21);
      glow.setScale((240 * sc * 1.25) / glow.frame.realWidth);
      const img = this.add.image(at.x, at.y, `tool-${id}`).setScale(0).setDepth(22);
      const homeScale = sc * 0.92;
      this.tweens.add({ targets: slot, scale: sc, duration: 300, delay: 80 * i, ease: 'Back.easeOut' });
      this.tweens.add({ targets: img, scale: homeScale, duration: 300, delay: 80 * i + 60, ease: 'Back.easeOut' });
      return { id, img, slot, glow, home: at, homeScale, away: false };
    });
    sfx(this, 'whoosh', { volume: 0.4 });
    void k;
  }

  private clearTray() {
    for (const t of this.tools) {
      this.tweens.killTweensOf([t.img, t.slot, t.glow]);
      this.tweens.add({ targets: [t.img, t.slot, t.glow], scale: 0, alpha: 0, duration: 260, onComplete: () => (t.img.destroy(), t.slot.destroy(), t.glow.destroy()) });
    }
    this.tools = [];
  }

  private get step(): Treat | null {
    return this.steps[this.si] ?? null;
  }

  private toolOf(id: ToolId) {
    return this.tools.find((t) => t.id === id) ?? null;
  }

  private startStep() {
    if (this.leaving) return;
    const st = this.step!;
    const v = this.cur!;
    this.prog = 0;
    this.spots = [];
    this.hidden = null;
    this.gripped = false;
    this.gripAt = null;
    this.shown.step = `${st.tool}-${st.act}`;
    this.shown.tool = st.tool;
    // the close-up this move needs
    const lensId = st.where === 'lens' ? v.a.lens! : null;
    const go = () => {
      this.setupMove(st);
      // little chef: the next tool glows (only that one)
      for (const t of this.tools) this.tweens.add({ targets: t.glow, alpha: this.level === 1 && t.id === st.tool && !t.away ? 0.9 : 0, duration: 260 });
      // Mom says it: little chef as it starts; big chef only what can't be remembered from the chart (find the spot)
      const line = st.line !== undefined ? st.line : TOOL_LINE[st.tool];
      const sayNow = this.level === 1 ? line : st.find ? 'vo-stetho-find' : null;
      if (sayNow) this.toolSaid.add(this.si);
      this.begin('tool', sayNow);
    };
    if (lensId && (!this.lens || this.lens.id !== lensId)) return this.openLens(lensId, () => (v.a.id === 'tooth' && this.si === 0 ? this.say('vo-say-aah', { ttlMs: 3000, done: go }) : go()));
    if (!lensId && this.lens) return this.closeLens(go);
    go();
  }

  /** What the move needs drawn: the glowing spots to listen to, the hidden splinter, the wheezy spot, the dirt. */
  private setupMove(st: Treat) {
    const v = this.cur!;
    const k = this.L.k;
    if (st.act === 'listen') {
      if (st.find) {
        this.hidden = Phaser.Utils.Array.GetRandom([...v.p.chest]);
        return;
      }
      const fs = st.where === 'lens' ? TUMMY_SPOTS : v.p.chest;
      this.spots = fs.map((f) => {
        const p = this.pointOf(st, f);
        const img = this.add.image(p.x, p.y, FX_SOFT).setTint(0xfff3a0).setBlendMode(Phaser.BlendModes.ADD).setDepth(45).setAlpha(0);
        img.setScale((90 * k) / img.frame.realWidth);
        this.tweens.add({ targets: img, alpha: 0.95, duration: 300 });
        return { f, img, done: 0 };
      });
    }
  }

  /** A frame point of the current move's place in the world: on the patient (600 frame) or in the close-up (520). */
  private pointOf(st: Treat, f: P): P {
    if (st.where === 'lens' && this.lens) return this.lensPoint(f);
    return this.cur!.view.at(f);
  }

  private lensPoint(f: P): P {
    const l = this.lens!;
    return { x: l.box.x + (f.x - LENS / 2) * l.s, y: l.box.y + (f.y - LENS / 2) * l.s };
  }

  /** Where the current move's tool must go (its working point). */
  private target(): P | null {
    const st = this.step;
    const v = this.cur;
    if (!st || !v) return null;
    if (st.where === 'mouth') return v.view.mouthAt;
    if (st.where === 'forehead') return v.view.at(v.p.forehead);
    if (st.act === 'listen') {
      if (st.find) return this.hidden ? v.view.at(this.hidden) : null;
      const s = this.spots.find((q) => q.done < T.listenMs);
      return s ? this.pointOf(st, s.f) : null;
    }
    if (!this.lens) return null;
    const l = this.lens.id;
    if (l === 'tummy') return this.lensPoint(TUMMY_MID);
    if (l === 'knee') return this.lensPoint(C.knee);
    if (l === 'paw') return this.lensPoint(this.pawSpot());
    if (l === 'mouth') {
      const d = this.dirtLeft()[0];
      return d ? this.inLens(d) : null;
    }
    return null;
  }

  private pawSpot(): P {
    return (this.lensThings.get('splinter')?.getData('f') as P) ?? C.paw;
  }

  /** A thing drawn in the close-up, in the world (the close-up may sway). */
  private inLens(img: Phaser.GameObjects.Image): P {
    const l = this.lens!;
    return { x: l.box.x + img.x, y: l.box.y + img.y };
  }

  private dirtLeft() {
    return [...this.lensThings.entries()].filter(([n, img]) => n.startsWith('dirt') && img.alpha > 0.05).map(([, img]) => img);
  }

  // ---------------------------------------------------------------- the close-up

  private lensSpot(): { at: P; s: number } {
    const L = this.L;
    const k = L.k;
    const r = this.room;
    const S = this.S;
    const s = Math.min(0.85 * k, ((r.x1 - r.x0) * 0.6) / RING);
    const half = (RING / 2) * s;
    const y = L.Y(110) + half;
    // (clear of Mom's pointing hand where it comes that low)
    const armHit = y + half > S.momArm.y0;
    const x = Math.min(r.x1, armHit ? S.momArm.x0 - 10 * k : Infinity) - half;
    return { at: { x, y }, s };
  }

  private openLens(id: LensId, then: () => void) {
    const k = this.L.k;
    const v = this.cur!;
    const { at, s } = this.lensSpot();
    const from = id === 'mouth' ? v.view.mouthAt : id === 'tummy' ? v.view.at(v.p.chest[0]) : v.view.at(v.p.foot ?? v.p.chest[0]);
    // the patient leans aside a little to make room
    const half = (RING / 2) * s;
    const pw = 230 * this.room.ps;
    const want = Math.max(this.room.x0 + pw, at.x - half - pw + 50 * k);
    const spot = this.bedSpot(Math.min(0, want - this.bedSpot().x));
    v.view.moveTo(spot, 450);
    const parts: Phaser.GameObjects.GameObject[] = [];
    const lensImg = new Phaser.GameObjects.Image(this, 0, 0, `lens-${id}`).setScale(s);
    if (id !== 'mouth') lensImg.setTint(id === 'tummy' ? v.p.tint.tummy : v.p.tint.skin);
    parts.push(lensImg);
    this.lensThings = new Map();
    const thing = (name: string, key: string, f: P, sc: number, angle = 0, alpha = 1) => {
      const img = new Phaser.GameObjects.Image(this, (f.x - LENS / 2) * s, (f.y - LENS / 2) * s, key).setScale(sc * s).setAngle(angle).setAlpha(alpha);
      img.setData('f', f);
      parts.push(img);
      this.lensThings.set(name, img);
      return img;
    };
    if (id === 'knee') {
      thing('scrape', 'clinic-scrape', C.knee, 1.05, -8);
      thing('dust', 'clinic-dust', C.knee, 1.0);
      thing('cream', 'clinic-cream', C.knee, 1.1, 0, 0);
    } else if (id === 'paw') {
      const f = this.level === 2 ? Phaser.Utils.Array.GetRandom(PAW_SPOTS) : C.paw;
      thing('splinter', 'clinic-splinter', f, 0.9, -28, this.level === 2 ? 0 : 1);
      thing('cream', 'clinic-cream', f, 0.9, 0, 0);
    } else if (id === 'mouth') {
      const teeth = Phaser.Utils.Array.Shuffle([...C.teeth]).slice(0, T.teeth[this.level - 1]);
      teeth.forEach(([x, y], i) => thing(`dirt-${i}`, 'clinic-dirt', { x, y: y + 6 }, 0.62, Phaser.Math.Between(-30, 30)));
    }
    parts.push(new Phaser.GameObjects.Image(this, 0, 0, 'lens-ring').setScale(s));
    const box = this.add.container(from.x, from.y, parts).setDepth(30).setScale(0);
    this.lens = { id, box, at, s, from };
    // a dotted "zoom" link from the body part to the bubble is too busy for her: the bubble simply grows out of it
    sfx(this, 'whoosh', { volume: 0.5 });
    this.tweens.add({ targets: box, x: at.x, y: at.y, scale: 1, duration: 420, ease: 'Back.easeOut', onComplete: () => this.time.delayedCall(200, then) });
    this.shown.lens = id;
    void k;
  }

  private closeLens(then?: () => void) {
    const l = this.lens;
    if (!l) return then?.();
    this.lens = null;
    this.shown.lens = '';
    this.tweens.killTweensOf(l.box);
    this.tweens.add({ targets: l.box, x: l.from.x, y: l.from.y, scale: 0, duration: 320, ease: 'Back.easeIn', onComplete: () => {
      l.box.destroy();
      then?.();
    } });
    const v = this.cur;
    if (v) v.view.moveTo(this.bedSpot(), 400);
  }

  // ---------------------------------------------------------------- the tools in her hand

  /** The tool's working point (the bulb, the bristles, the tips) in the world. */
  private tip(t: Tool): P {
    const tp = C.tip[t.id];
    const s = t.img.scale;
    return { x: t.img.x + (tp.x - 120) * s, y: t.img.y + (tp.y - 120) * s };
  }

  /** Puts the tool so its working point is at `p`. */
  private tipTo(t: Tool, p: P) {
    const tp = C.tip[t.id];
    const s = t.img.scale;
    t.img.setPosition(p.x - (tp.x - 120) * s, p.y - (tp.y - 120) * s);
  }

  /** Where the working point goes for a finger at `f`: a little above and left of it, so the finger doesn't hide it. */
  private fingerTip(f: P): P {
    const k = this.L.k;
    return { x: f.x - 26 * k, y: f.y - 66 * k };
  }

  private backToTray(t: Tool) {
    this.tweens.killTweensOf(t.img);
    t.img.setDepth(22).setAngle(0);
    this.tweens.add({ targets: t.img, x: t.home.x, y: t.home.y, scale: t.homeScale, angle: 0, duration: 360, ease: 'Back.easeOut' });
  }

  /** A wrong tool (or the right one too early): it hops back; Mom says so (big chef: the chart opens for a peek). */
  private wrongTool(t: Tool) {
    this.shown.wrong = (this.shown.wrong as number) + 1;
    this.backToTray(t);
    boing(this, t.img, 0.15);
    sfx(this, 'squish', { volume: 0.6 });
    if (this.level === 2) {
      this.say('vo-clinic-first', { ttlMs: 3000 });
      this.openChart(false);
    } else this.say('vo-clinic-notyet', { ttlMs: 3000 });
    this.miss();
  }

  // ---------------------------------------------------------------- doing the move

  /** The tool's working point moved to `tp` (by `dist`), `delta` ms passed: the move goes on. */
  private work(t: Tool, tp: P, dist: number, delta: number) {
    const st = this.step;
    const v = this.cur;
    if (!st || !v || t.id !== st.tool || this.phase !== 'tool') return;
    const k = this.L.k;
    const reach = T.reach * k;
    const tg = this.target();
    switch (st.act) {
      case 'hold': {
        if (!tg || !this.near(tp, tg, reach)) return;
        this.prog += delta;
        this.holdFeedback(st, tp, delta);
        if (this.prog >= T.holdMs[this.level - 1]) this.moveDone();
        return;
      }
      case 'listen': {
        if (st.find) return this.listenFind(tp, delta);
        const s = this.spots.find((q) => q.done < T.listenMs && this.near(tp, this.pointOf(st, q.f), reach));
        if (!s) return;
        if (s.done === 0) {
          sfx(this, st.hear ?? 'heartbeat', { minGapMs: 300 });
          this.poke();
        }
        s.done += delta;
        if (s.done >= T.listenMs) {
          const p = this.pointOf(st, s.f);
          this.tweens.add({ targets: s.img, alpha: 0, duration: 260 });
          burst(this, p.x, p.y, { texture: 'fx-heart', count: 5, tint: [0xf06a8a, 0xf5a3b5], size: 34 * k, speed: 220 * k, gravityY: -100, lifespan: 800, depth: 60 });
          sfx(this, 'pop', { volume: 0.5 });
          if (this.spots.every((q) => q.done >= T.listenMs)) this.moveDone();
        }
        return;
      }
      case 'rub': {
        if (this.lens?.id === 'mouth') {
          const d = this.dirtLeft().find((img) => this.near(tp, this.inLens(img), reach));
          if (!d || dist <= 0) return;
          const per = T.rub[this.level - 1] * k / Math.max(1, T.teeth[this.level - 1] / 2);
          d.setAlpha(Math.max(0, d.alpha - dist / per));
          this.wiggle(delta);
          if (Math.random() < 0.25) this.bubble(tp.x + Phaser.Math.Between(-30, 30) * k, tp.y + Phaser.Math.Between(-20, 20) * k);
          sfx(this, 'brush', { minGapMs: 260, volume: 0.7 });
          this.poke();
          if (d.alpha <= 0.05) {
            d.setAlpha(0);
            stars(this, d.x + this.lens.box.x, d.y + this.lens.box.y, 5, 30 * k);
            sfx(this, 'star', { volume: 0.6 });
            if (!this.dirtLeft().length) this.moveDone();
          }
          return;
        }
        // the cream: rubbed in where it goes
        if (!tg || !this.near(tp, tg, reach * 1.3) || dist <= 0) return;
        this.prog += dist;
        const c = this.lensThings.get('cream');
        const need = T.rub[this.level - 1] * k;
        c?.setAlpha(Math.min(0.95, this.prog / need));
        this.wiggle(delta);
        sfx(this, 'squish', { minGapMs: 380, volume: 0.35 });
        this.poke();
        if (this.prog >= need) {
          stars(this, tg.x, tg.y, 5, 30 * k);
          this.moveDone();
        }
        return;
      }
      case 'pull': {
        const sp = this.lensThings.get('splinter');
        if (!sp || !this.lens) return;
        const at = this.lensPoint(this.pawSpot());
        if (!this.gripped) {
          if (!this.near(tp, at, reach * 0.8)) return;
          this.gripped = true;
          this.gripAt = { ...tp };
          sfx(this, 'click');
          boing(this, sp, 0.2);
          this.poke();
          return;
        }
        // drawn out: the splinter follows the tweezers' tips, out of the paw
        const out = Math.hypot(tp.x - this.gripAt!.x, tp.y - this.gripAt!.y);
        sp.setPosition(tp.x - this.lens.box.x, tp.y - this.lens.box.y);
        if (out >= T.pull * k) {
          this.gripped = false;
          sfx(this, 'pop');
          stars(this, tp.x, tp.y, 7, 36 * k);
          this.tweens.add({ targets: sp, alpha: 0, y: sp.y - 60 * k, angle: 40, duration: 500 });
          v.view.react('giggle');
          this.moveDone();
        }
        return;
      }
      case 'search': {
        const sp = this.lensThings.get('splinter');
        if (!sp || !this.lens) return;
        if (dist > 0) this.poke();
        if (this.near(tp, this.lensPoint(this.pawSpot()), T.findR * k)) {
          sp.setAlpha(1);
          boing(this, sp, 0.4);
          stars(this, tp.x, tp.y, 6, 34 * k);
          sfx(this, 'star');
          this.moveDone();
        }
        return;
      }
      default:
    }
  }

  private holdFeedback(st: Treat, tp: P, delta: number) {
    const k = this.L.k;
    const v = this.cur!;
    this.poke();
    if (st.tool === 'thermometer') {
      if (v.view.mood !== 'expect') v.view.setMood('expect');
      const before = Math.floor((this.prog - delta) / 400);
      if (Math.floor(this.prog / 400) > before) sfx(this, 'tap', { volume: 0.25, minGapMs: 0, vary: false });
      return;
    }
    if (st.tool === 'spray') {
      sfx(this, 'spray', { minGapMs: 520, volume: 0.6 });
      if (Math.random() < delta / 60) burst(this, tp.x, tp.y + 20 * k, { texture: FX_SOFT, count: 2, tint: 0xdff3fa, size: 40 * k, speed: 160 * k, gravityY: 120, lifespan: 500, depth: 60 });
      const dust = this.lensThings.get('dust');
      dust?.setAlpha(Math.max(0, 1 - this.prog / T.holdMs[this.level - 1]));
      return;
    }
    if (st.tool === 'hotbottle') {
      if (Math.random() < delta / 260) burst(this, tp.x, tp.y - 50 * k, { texture: 'fx-heart', count: 1, tint: [0xf5a3b5, 0xf6c08a], size: 30 * k, speed: 80 * k, gravityY: -120, lifespan: 900, depth: 60 });
      sfx(this, 'gurgle', { minGapMs: 1800, volume: 0.25 });
    }
  }

  /** Big chef's cough: listen until the wheezy spot is found (it grows louder nearer). */
  private listenFind(tp: P, delta: number) {
    const v = this.cur!;
    const k = this.L.k;
    if (!this.hidden) return;
    const at = v.view.at(this.hidden);
    const d = Math.hypot(tp.x - at.x, tp.y - at.y);
    // only on her (near her chest)
    const mid = v.view.at(v.p.chest[0]);
    if (Math.hypot(tp.x - mid.x, tp.y - mid.y) > 300 * v.view.scale + 60 * k) return;
    this.poke();
    const now = this.time.now;
    if (now - this.lastHear > 900) {
      this.lastHear = now;
      const near = Phaser.Math.Clamp(1 - d / (T.hearR * k), 0, 1);
      if (near > 0.05) sfx(this, 'wheeze', { minGapMs: 0, volume: 0.15 + 0.85 * near });
      else sfx(this, 'heartbeat', { minGapMs: 0, volume: 0.4 });
    }
    if (d < T.wheezeR * k) {
      this.prog += delta;
      if (this.prog >= T.listenMs) {
        stars(this, at.x, at.y, 7, 36 * k);
        sfx(this, 'star');
        burst(this, at.x, at.y, { texture: 'fx-heart', count: 6, tint: [0xf06a8a, 0xf5a3b5], size: 34 * k, speed: 220 * k, gravityY: -100, lifespan: 800, depth: 60 });
        this.moveDone();
      }
    }
  }

  /** Big chef: brushing and rubbing tickle, so the close-up sways a little (an answer to her rubbing, never by itself). */
  private wiggle(delta: number) {
    if (this.level !== 2 || !this.lens) return;
    this.wiggleT += delta;
    const l = this.lens;
    l.box.x = l.at.x + Math.sin(this.wiggleT / 260) * T.wiggle * this.L.k;
    if (Math.random() < delta / 900) sfx(this, 'char-giggle', { minGapMs: 1400, rate: this.cur!.view.rate, volume: 0.5 });
  }

  private bubble(x: number, y: number) {
    const k = this.L.k;
    const b = this.add.image(x, y, 'bubble').setScale(0).setDepth(55).setAlpha(0.9);
    this.tweens.add({ targets: b, scale: Phaser.Math.FloatBetween(0.15, 0.3) * k, duration: 200, ease: 'Back.easeOut' });
    this.tweens.add({ targets: b, y: y - Phaser.Math.Between(30, 90) * k, alpha: 0, duration: 1100, delay: 300, onComplete: () => b.destroy() });
  }

  /** A tool let go on its place: the drop moves (cloth, plaster, spoon, cup). */
  private drop(t: Tool) {
    const st = this.step!;
    const v = this.cur!;
    const k = this.L.k;
    const tg = this.target()!;
    this.setPhase('intro');
    this.poke();
    switch (st.tool) {
      case 'cloth': {
        // the cool cloth stays on her forehead
        t.away = true;
        this.tweens.killTweensOf(t.img);
        t.img.setVisible(false);
        const c = v.view.put('tool-cloth', { x: v.p.forehead.x, y: v.p.forehead.y - 10 }, 0.62);
        v.signs.push(c);
        boing(this, c, 0.15);
        sfx(this, 'squish', { volume: 0.5 });
        puff(this, tg.x, tg.y, 0xdff3fa, 6, 50 * k);
        v.view.setMood('happy');
        const sweat = v.signs.find((g) => g.texture.key === 'clinic-sweat');
        if (sweat) this.tweens.add({ targets: sweat, alpha: 0, duration: 400 });
        this.time.delayedCall(500, () => this.moveDone());
        return;
      }
      case 'plaster': {
        t.away = true;
        this.tweens.killTweensOf(t.img);
        t.img.setVisible(false);
        const l = this.lens!;
        const at = this.lensThings.get('scrape')?.getData('f') ?? this.pawSpot();
        const p = new Phaser.GameObjects.Image(this, (at.x - LENS / 2) * l.s, (at.y - LENS / 2) * l.s, 'tool-plaster').setScale(1.05 * l.s).setAngle(-6);
        l.box.addAt(p, l.box.length - 1);
        boing(this, p, 0.2);
        sfx(this, 'sticky');
        stars(this, tg.x, tg.y, 6, 34 * k);
        if (this.level === 2) this.tweens.add({ targets: l.box, x: { from: l.at.x - T.wiggle * k, to: l.at.x }, duration: 420, ease: 'Elastic.easeOut' });
        this.time.delayedCall(600, () => this.moveDone());
        return;
      }
      default: {
        // the spoon and the cup: she opens wide, a gulp, a happy face; the tool goes back
        v.view.setMood('expect');
        this.tweens.add({ targets: t.img, angle: st.tool === 'cup' ? -35 : -20, duration: 260, yoyo: true, hold: 300 });
        this.time.delayedCall(450, () => {
          sfx(this, st.tool === 'cup' ? 'pour' : 'munch', { volume: 0.6 });
          v.view.setMood('chew');
          if (st.tool === 'cup' && v.a.id === 'tooth') for (let i = 0; i < 6; i++) this.bubble(tg.x + Phaser.Math.Between(-60, 60) * k, tg.y + Phaser.Math.Between(-20, 30) * k);
        });
        this.time.delayedCall(1000, () => {
          v.view.setMood('happy');
          this.backToTray(t);
          this.moveDone();
        });
      }
    }
  }

  /** One move done: a little sparkle, then the next one, or "All better!". */
  private moveDone() {
    const st = this.step!;
    const v = this.cur!;
    this.setPhase('intro');
    for (const s of this.spots) s.img.destroy();
    this.spots = [];
    const held = this.held;
    if (held) {
      this.held = null;
      this.owner = null;
      if (!held.tool.away && this.tools.includes(held.tool)) this.backToTray(held.tool);
    }
    for (const t of this.tools) if (!t.away && t.id === st.tool && t.img.y !== t.home.y && !this.tweens.isTweening(t.img)) this.backToTray(t);
    if (st.tool === 'thermometer') {
      v.view.setMood('rest');
      sfx(this, 'beep');
    }
    if (st.tool === 'hotbottle') {
      // the warm bottle rests on the tummy for a moment
      const t = this.toolOf('hotbottle');
      if (t) t.away = true;
    }
    if (st.after) this.say(st.after, { ttlMs: 4000 });
    if (this.chart) this.tick_(this.si);
    this.mom?.happy();
    this.time.delayedCall(700, () => this.mom?.rest());
    this.si++;
    if (this.si >= this.steps.length) return this.time.delayedCall(st.after ? 1300 : 600, () => this.better());
    this.time.delayedCall(st.after ? 1500 : 700, () => this.startStep());
  }

  // ---------------------------------------------------------------- the plan on a chart (big chef)

  private makeChart() {
    const L = this.L;
    const S = this.S;
    const k = L.k;
    this.chart?.box.destroy();
    const homeR = 120 * S.homeScale + 30 * k;
    const homeScale = 0.46 * k;
    const home = { x: S.home.x + homeR + 30 * k + 150 * homeScale, y: S.home.y + 10 * k };
    const paper = new Phaser.GameObjects.Image(this, 0, 0, 'clinic-chart');
    const rows: Phaser.GameObjects.Image[] = [];
    const ticks: Phaser.GameObjects.Image[] = [];
    this.steps.slice(0, C.chartRows.length).forEach((st, i) => {
      const [x, y] = C.chartRows[i];
      rows.push(new Phaser.GameObjects.Image(this, x - 150 - 30, y - 190, `tool-${st.tool}`).setScale(0.3));
      ticks.push(new Phaser.GameObjects.Image(this, x - 150 + 80, y - 190, 'fx-heart').setTint(0xf06a8a).setAlpha(0));
    });
    for (const t of ticks) t.setScale(44 / t.frame.realWidth);
    const box = this.add.container(home.x, home.y, [paper, ...rows, ...ticks]).setDepth(700).setScale(homeScale);
    this.chart = { box, rows, ticks, home, homeScale, open: false };
    this.shown.chart = 'folded';
  }

  private openChart(first: boolean) {
    const c = this.chart;
    if (!c) return;
    const L = this.L;
    const r = this.room;
    c.timer?.remove();
    c.open = true;
    this.shown.chart = 'open';
    this.tweens.killTweensOf(c.box);
    for (const row of c.rows) row.setVisible(true);
    sfx(this, 'whoosh', { volume: 0.4 });
    this.tweens.add({ targets: c.box, x: (r.x0 + r.x1) / 2, y: L.Y(420), scale: 1.0 * L.k, duration: 320, ease: 'Back.easeOut' });
    if (!first) c.timer = this.time.delayedCall(T.peekMs, () => this.foldChart());
  }

  private foldChart() {
    const c = this.chart;
    if (!c || !c.open) return;
    c.open = false;
    this.shown.chart = 'folded';
    c.timer?.remove();
    this.tweens.killTweensOf(c.box);
    this.tweens.add({ targets: c.box, x: c.home.x, y: c.home.y, scale: c.homeScale, duration: 320, ease: 'Sine.easeInOut', onComplete: () => {
      if (!c.open) for (const row of c.rows) row.setVisible(false);
    } });
  }

  private tick_(i: number) {
    const t = this.chart?.ticks[i];
    if (t) t.setAlpha(1);
  }

  // ---------------------------------------------------------------- all better, a sticker, back to the bench

  private better() {
    const v = this.cur!;
    const L = this.L;
    const k = L.k;
    this.setPhase('intro');
    this.closeLens();
    this.clearTray();
    if (this.chart) {
      const c = this.chart;
      this.chart = null;
      this.tweens.add({ targets: c.box, alpha: 0, duration: 300, onComplete: () => c.box.destroy() });
    }
    // every sign goes; a little plaster stays on a knee or a foot
    for (const g of v.signs) this.tweens.add({ targets: g, alpha: 0, duration: 500, onComplete: () => g.destroy() });
    v.signs = [];
    if ((v.a.id === 'knee' || v.a.id === 'paw') && v.p.foot) {
      const pl = v.view.put('tool-plaster', v.p.foot, 0.42, -8).setAlpha(0);
      this.tweens.add({ targets: pl, alpha: 1, duration: 400, delay: 300 });
    }
    this.time.delayedCall(450, () => {
      sfx(this, 'cheer-jingle');
      music.party();
      const head = v.view.at({ x: 300, y: 200 });
      stars(this, head.x, head.y, 10, 54 * k);
      confetti(this, head.x, L.Y(220), 16, 24 * k);
      v.view.cheer();
      this.mom?.cheer();
      this.say('vo-clinic-better', { ttlMs: 4000, done: () => this.time.delayedCall(300, () => this.startSticker()) });
    });
  }

  private startSticker() {
    if (this.leaving) return;
    const S = this.S;
    const sc = (S.binScale(3) * 240) / 200 * 0.92;
    this.stickers = STICKERS.map((key, i) => {
      const at = S.bin(i, 3);
      const img = this.add.image(at.x, at.y, key).setScale(0).setDepth(40);
      img.setData('scale', sc);
      this.tweens.add({ targets: img, scale: sc, duration: 300, delay: 110 * i, ease: 'Back.easeOut' });
      return img;
    });
    this.begin('sticker', 'vo-sticker');
  }

  private giveSticker(img: Phaser.GameObjects.Image) {
    const v = this.cur!;
    const k = this.L.k;
    this.setPhase('intro');
    for (const o of this.stickers) if (o !== img) this.tweens.add({ targets: o, alpha: 0, scale: 0, duration: 240, onComplete: () => o.destroy() });
    this.stickers = [];
    sfx(this, 'pop');
    const to = v.view.at(v.p.id === 'giraffe' ? { x: 300, y: 610 } : v.p.chest[0]);
    img.setDepth(60);
    this.tweens.add({
      targets: img,
      x: to.x,
      y: to.y,
      scale: 0.62 * v.view.scale,
      angle: -10,
      duration: 520,
      ease: 'Sine.easeInOut',
      onComplete: () => {
        img.destroy();
        const f = v.p.id === 'giraffe' ? { x: 300, y: 610 } : v.p.chest[0];
        const st = v.view.put(img.texture.key, f, 0.62, -10);
        boing(this, st, 0.3);
        sfx(this, 'sticky');
        stars(this, to.x, to.y, 6, 34 * k);
        v.view.react('love');
        this.time.delayedCall(900, () => this.say('vo-clinic-bye-patient', { ttlMs: 4000, done: () => this.time.delayedCall(200, () => this.homeToBench(v)) }));
      },
    });
  }

  private homeToBench(v: Visitor) {
    if (this.leaving) return;
    v.done = true;
    this.shown.treated = (this.shown.treated as number) + 1;
    this.through(() => {
      this.cur = null;
      v.view.moveTo(v.seat, 0);
      v.view.box.setPosition(v.seat.x, v.seat.y).setScale(v.seat.scale).setDepth(6);
      this.showRoom('wait');
      v.view.setMood('happy');
      this.time.delayedCall(700, () => v.view.setMood('rest'));
      this.time.delayedCall(500, () => {
        if (this.visit.every((q) => q.done)) this.finale();
        else this.startPick(false);
      });
    });
  }

  // ---------------------------------------------------------------- the finale: a photo of the happy patients

  private finale() {
    const L = this.L;
    const k = L.k;
    this.setPhase('done');
    this.shown.done = true;
    for (const v of this.visit) v.view.setMood('happy');
    this.say('vo-clinic-photo', {
      ttlMs: 5000,
      done: () => this.time.delayedCall(300, () => this.snap()),
    });
    void k;
  }

  private snap() {
    if (this.leaving) return;
    const L = this.L;
    const k = L.k;
    const xs = this.visit.map((v) => v.view.box.x);
    const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
    const bottom = L.Y(1000);
    const side = Math.min(L.H * 0.86, Math.max(...xs) - Math.min(...xs) + 520 * this.visit[0].seat.scale);
    const area = { x: Math.round(Math.max(0, cx - side / 2)), y: Math.round(Math.max(0, bottom - side)), w: Math.round(side), h: Math.round(side) };
    sfx(this, 'camera', { vary: false });
    let after = false;
    const show = (src: HTMLImageElement | null) => {
      if (after) return;
      after = true;
      const flash = this.add.rectangle(L.W / 2, L.H / 2, L.W * 1.2, L.H * 1.2, 0xffffff).setDepth(2000).setAlpha(0.9);
      this.tweens.add({ targets: flash, alpha: 0, duration: 380, ease: 'Quad.easeOut', onComplete: () => flash.destroy() });
      this.framePhoto(src);
    };
    try {
      this.game.renderer.snapshotArea(area.x, area.y, area.w, area.h, (img) => show(img instanceof HTMLImageElement ? img : null));
    } catch {
      show(null);
    }
    this.time.delayedCall(1200, () => show(null));
    void k;
  }

  /** The photo in the clinic's frame, kept in the memory book; the cheer, the line, bye bye, back to the title. */
  private framePhoto(src: HTMLImageElement | null) {
    const L = this.L;
    const k = L.k;
    const W = C.photoWindow;
    const s = Math.min(0.62 * k, (L.H * 0.78) / 780);
    const at = { x: (L.m + this.S.momFace.x0) / 2, y: L.Y(470) };
    const keep = (img: HTMLImageElement) => {
      try {
        const c = document.createElement('canvas');
        c.width = c.height = 420;
        const g = c.getContext('2d')!;
        g.drawImage(img, 0, 0, 420, 420);
        let data = c.toDataURL('image/webp', 0.75);
        if (!data.startsWith('data:image/webp')) data = c.toDataURL('image/png');
        this.shown.photo = data.length;
        void keepPhoto('clinic', data);
      } catch {
        /* the photo is simply not kept */
      }
    };
    const parts: Phaser.GameObjects.GameObject[] = [];
    if (src) {
      keep(src);
      const key = 'clinic-photo-made';
      if (this.textures.exists(key)) this.textures.remove(key);
      this.textures.addImage(key, src);
      const pic = new Phaser.GameObjects.Image(this, (W.x + W.w / 2 - 350) * s, (W.y + W.h / 2 - 390) * s, key);
      pic.setScale((W.w * s) / pic.width, (W.h * s) / pic.height);
      parts.push(pic);
    }
    const frame = new Phaser.GameObjects.Image(this, 0, 0, 'photo-frame-clinic').setScale(s);
    parts.push(frame);
    const box = this.add.container(at.x, at.y, parts).setDepth(800).setScale(0.2).setAlpha(0);
    this.tweens.add({ targets: box, scale: 1, alpha: 1, angle: { from: -8, to: -2 }, duration: 520, ease: 'Back.easeOut' });
    this.time.delayedCall(700, () => {
      sfx(this, 'cheer-jingle');
      music.party(true);
      stars(this, at.x, at.y - 200 * s, 14, 70 * k);
      confetti(this, at.x, L.Y(200), 22, 28 * k);
      this.mom?.celebrate();
      this.pipa?.cheer();
      for (const v of this.visit) v.view.cheer();
      this.goodbye('vo-clinic-done');
    });
  }

  // ---------------------------------------------------------------- Mom's hand

  /** The see-through tool Mom's grab hand carries, its working point on her hand's anchor. */
  private prop(id: ToolId, alpha = 0.6) {
    const s = this.room.toolS;
    const tp = C.tip[id];
    return { key: `tool-${id}`, scale: s, dx: (120 - tp.x) * s, dy: (120 - tp.y) * s, alpha };
  }

  /** The keyframes of the current move, from the tray to its place (`from` ms on). */
  private path(st: Treat, from: number): HandKey[] {
    const k = this.L.k;
    const tg = this.target();
    if (!tg) return [];
    const circle = (c: P, r: number, t0: number, t1: number) => {
      const keys: HandKey[] = [];
      for (let i = 0; i <= 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        keys.push({ x: c.x + Math.cos(a) * r, y: c.y + Math.sin(a) * r * 0.6, t: t0 + ((t1 - t0) * i) / 8 });
      }
      return keys;
    };
    switch (st.act) {
      case 'rub':
        return circle(tg, 40 * k, from, from + 1100);
      case 'pull':
        return [{ ...tg, t: from }, { ...tg, t: from + 300 }, { x: tg.x + 150 * k, y: tg.y - 150 * k, t: from + 1000 }];
      case 'search': {
        const l = this.lens!;
        return [{ x: l.at.x - 120 * k, y: l.at.y + 60 * k, t: from }, { x: l.at.x + 100 * k, y: l.at.y - 40 * k, t: from + 600 }, { ...tg, t: from + 1100 }];
      }
      case 'listen':
        if (st.find && this.hidden) {
          const mid = this.cur!.view.at(this.cur!.p.chest[0]);
          return [{ x: mid.x - 80 * k, y: mid.y, t: from }, { x: mid.x + 80 * k, y: mid.y, t: from + 500 }, { ...tg, t: from + 900 }];
        }
        return [{ ...tg, t: from }, { ...tg, t: from + 500 }];
      default:
        return [{ ...tg, t: from }, { ...tg, t: from + 600 }];
    }
  }

  protected way(): HandMotion | null {
    const k = this.L.k;
    switch (this.phase) {
      case 'pick': {
        const v = this.visit.find((q) => !q.done);
        return v ? tapMotion(v.view.at({ x: 300, y: 420 }), k) : null;
      }
      case 'diagnose': {
        const c = this.cards.find((q) => q.id === this.cur?.a.id);
        return c ? tapMotion({ x: c.img.x, y: c.img.y }, k) : null;
      }
      case 'sticker': {
        const s = this.stickers[0];
        return s ? tapMotion({ x: s.x, y: s.y }, k) : null;
      }
      case 'tool': {
        const st = this.step;
        const t = st && this.toolOf(st.tool);
        const tg = this.target();
        if (!st || !t || !tg) return null;
        const home = t.home;
        const tp = C.tip[t.id];
        const s = this.room.toolS;
        const start = { x: home.x + (tp.x - 120) * s, y: home.y + (tp.y - 120) * s };
        const keys: HandKey[] = [{ ...start, t: 0 }, { ...start, t: 300 }, { ...tg, t: 1200 }, ...this.path(st, 1300)];
        keys.push({ ...keys[keys.length - 1], t: keys[keys.length - 1].t + 400 });
        return { kind: 'grab', keys, props: [this.prop(t.id)], glow: home };
      }
      default:
        return null;
    }
  }

  protected helpOnce() {
    const k = this.L.k;
    switch (this.phase) {
      case 'pick': {
        const v = this.visit.find((q) => !q.done);
        if (!v) return false;
        this.hand.play(tapMotion(v.view.at({ x: 300, y: 420 }), k));
        this.time.delayedCall(650, () => (this.helped(), this.callIn(v)));
        return true;
      }
      case 'diagnose': {
        const c = this.cards.find((q) => q.id === this.cur?.a.id);
        if (!c) return false;
        this.hand.play(tapMotion({ x: c.img.x, y: c.img.y }, k));
        this.time.delayedCall(650, () => (this.helped(), this.pickCard(c)));
        return true;
      }
      case 'sticker': {
        const s = this.stickers[0];
        if (!s) return false;
        this.hand.play(tapMotion({ x: s.x, y: s.y }, k));
        this.time.delayedCall(650, () => (this.helped(), this.giveSticker(s)));
        return true;
      }
      case 'tool':
        return this.helpTool();
      default:
        return false;
    }
  }

  /** Mom's hand takes the tool and does the move with it (the real tool, the real progress), then it is hers again. */
  private helpTool(): boolean {
    const st = this.step;
    const t = st && this.toolOf(st.tool);
    if (!st || !t || !this.target()) return false;
    const k = this.L.k;
    const si = this.si;
    this.tweens.killTweensOf(t.img);
    t.img.setDepth(600);
    this.tweens.add({ targets: t.img, scale: this.room.toolS, angle: 0, duration: 200 });
    this.hand.follow('grab', () => ({ x: t.img.x, y: t.img.y }));
    const start = this.tip(t);
    const keys = [{ ...start, t: 0 }, ...this.path(st, T.helpMs).map((q) => ({ ...q, t: q.t }))];
    const holdMore = st.act === 'hold' ? T.holdMs[this.level - 1] + 200 : st.act === 'listen' && !st.find ? T.listenMs + 200 : st.act === 'listen' ? T.listenMs + 400 : 0;
    const total = keys[keys.length - 1].t + holdMore;
    let last = start;
    let tPrev = 0;
    this.tweens.addCounter({
      from: 0,
      to: total,
      duration: total,
      onUpdate: (tw) => {
        if (this.si !== si || this.phase !== 'tool') return;
        const now = tw.getValue() ?? 0;
        // where the keyframes say, and for listening: the next spot not heard yet
        let p = this.at(keys, now);
        if (st.act === 'listen' && now > T.helpMs) p = this.target() ?? p;
        this.tipTo(t, p);
        const dist = Math.hypot(p.x - last.x, p.y - last.y);
        const d = now - tPrev;
        last = p;
        tPrev = now;
        if (now >= T.helpMs) this.work(t, p, Math.max(dist, st.act === 'rub' ? 14 * k : 0), d);
      },
      onComplete: () => {
        if (this.si === si && this.phase === 'tool') {
          if (st.act === 'drop') {
            this.helped();
            this.drop(t);
            return;
          }
          // (whatever is left, Mom finishes)
          this.helped();
          this.finishMove(st);
          return;
        }
        this.helped();
      },
    });
    return true;
  }

  /** Mom's help ran out of time before the move was done: it is finished as if done by hand. */
  private finishMove(st: Treat) {
    const k = this.L.k;
    const sp = this.lensThings.get('splinter');
    if (st.tool === 'spray') this.lensThings.get('dust')?.setAlpha(0);
    if (st.act === 'rub') {
      for (const d of this.dirtLeft()) d.setAlpha(0);
      if (this.lens?.id !== 'mouth') this.lensThings.get('cream')?.setAlpha(0.95);
    }
    if (st.act === 'search') sp?.setAlpha(1);
    if (st.act === 'pull' && sp) this.tweens.add({ targets: sp, alpha: 0, y: sp.y - 60 * k, duration: 400 });
    this.moveDone();
  }

  private at(keys: { x: number; y: number; t: number }[], t: number): P {
    if (t <= keys[0].t) return keys[0];
    for (let i = 1; i < keys.length; i++) {
      if (t <= keys[i].t) {
        const a = keys[i - 1];
        const b = keys[i];
        const u = (t - a.t) / Math.max(1, b.t - a.t);
        const e = u * u * (3 - 2 * u);
        return { x: a.x + (b.x - a.x) * e, y: a.y + (b.y - a.y) * e };
      }
    }
    return keys[keys.length - 1];
  }

  // ---------------------------------------------------------------- touch

  protected down(p: Phaser.Input.Pointer, at: P) {
    const k = this.L.k;
    // the chart (big chef): a tap peeks at the plan, anytime it is there
    const c = this.chart;
    if (c && this.near(at, { x: c.box.x, y: c.box.y }, Math.max(110 * k, 190 * c.box.scale))) {
      if (c.open) this.foldChart();
      else {
        this.openChart(false);
        sfx(this, 'pop', { volume: 0.5 });
      }
      return;
    }
    switch (this.phase) {
      case 'pick': {
        const v = this.visit.find((q) => !q.done && this.hitPatient(q, at));
        if (v) return this.callIn(v);
        const d = this.visit.find((q) => q.done && this.hitPatient(q, at));
        if (d) d.view.react('giggle');
        return;
      }
      case 'diagnose': {
        const card = this.cards.find((q) => this.near(at, q.img, Math.max(120 * k, 110 * q.img.scale)));
        if (card) return this.pickCard(card);
        if (this.cur && this.hitPatient(this.cur, at)) this.showSign(this.cur);
        return;
      }
      case 'sticker': {
        const s = this.stickers.find((q) => this.near(at, q, Math.max(120 * k, 110 * q.scale)));
        if (s) this.giveSticker(s);
        return;
      }
      case 'tool': {
        const t = this.tools.find((q) => !q.away && this.near(at, q.img, Math.max(115 * k, 120 * q.homeScale)));
        if (!t) {
          if (this.cur && this.hitPatient(this.cur, at) && !this.lens) this.cur.view.react('giggle');
          return;
        }
        const st = this.step!;
        if (t.id !== st.tool) return this.wrongTool(t);
        this.tweens.killTweensOf(t.img);
        t.img.setDepth(600);
        t.img.setScale(this.room.toolS);
        this.tipTo(t, this.fingerTip(at));
        boing(this, t.img, 0.08);
        sfx(this, 'tap', { volume: 0.7 });
        if (this.level === 2 && !this.toolSaid.has(this.si)) {
          this.toolSaid.add(this.si);
          const line = st.line !== undefined ? st.line : TOOL_LINE[st.tool];
          if (line) this.say(line, { ttlMs: 3000 });
        }
        for (const g of this.tools) this.tweens.add({ targets: g.glow, alpha: 0, duration: 200 });
        this.held = { tool: t, from: at, moved: 0, last: this.tip(t), t0: this.time.now };
        this.own(p);
        return;
      }
      default:
    }
  }

  protected move(p: Phaser.Input.Pointer) {
    const h = this.held;
    if (!h) return;
    const L = this.L;
    const f = { x: Phaser.Math.Clamp(p.worldX, 0, L.W), y: Phaser.Math.Clamp(p.worldY, 0, L.H) };
    h.moved = Math.max(h.moved, Math.hypot(f.x - h.from.x, f.y - h.from.y));
    this.tipTo(h.tool, this.fingerTip(f));
    sway(this, h.tool.img, p.worldX - p.prevPosition.x, L.k);
    const tp = this.tip(h.tool);
    const dist = Math.hypot(tp.x - h.last.x, tp.y - h.last.y);
    h.last = tp;
    this.work(h.tool, tp, dist, 0);
  }

  protected tick(delta: number) {
    const h = this.held;
    if (!h || this.phase !== 'tool') return;
    const st = this.step;
    // holding still counts for holding and listening (the finger need not move)
    if (st && (st.act === 'hold' || st.act === 'listen')) this.work(h.tool, this.tip(h.tool), 0, delta);
  }

  protected up(_p: Phaser.Input.Pointer, cancelled: boolean) {
    const h = this.held;
    this.held = null;
    if (!h) return;
    const k = this.L.k;
    const t = h.tool;
    const st = this.step;
    const v = this.cur;
    if (v && st?.tool === 'thermometer' && v.view.mood === 'expect') v.view.setMood('rest');
    if (this.lens) this.lens.box.x = this.lens.at.x;
    if (this.gripped && this.lensThings.get('splinter') && this.lens) {
      // let go mid-pull: the splinter slips back into place (nothing lost)
      this.gripped = false;
      const sp = this.lensThings.get('splinter')!;
      const f = this.pawSpot();
      this.tweens.add({ targets: sp, x: (f.x - LENS / 2) * this.lens.s, y: (f.y - LENS / 2) * this.lens.s, duration: 250 });
    }
    if (!st || t.id !== st.tool || this.phase !== 'tool' || cancelled) return this.backToTray(t);
    const tg = this.target();
    if (st.act === 'drop') {
      // a tap on the right tool: it goes there by itself; a drag let go near the place: it lands
      const tapped = h.moved < 30 * k && this.time.now - h.t0 < 450;
      if (tg && (tapped || this.near(this.tip(t), tg, T.reach * k * 1.4))) {
        if (tapped) {
          this.tweens.add({
            targets: t.img,
            x: tg.x - (C.tip[t.id].x - 120) * t.img.scale,
            y: tg.y - (C.tip[t.id].y - 120) * t.img.scale,
            duration: 380,
            ease: 'Sine.easeInOut',
            onComplete: () => this.step === st && this.phase === 'tool' && this.drop(t),
          });
          return;
        }
        return this.drop(t);
      }
      if (h.moved > 40 * k) this.miss();
      return this.backToTray(t);
    }
    // a tap on a tool that needs holding or rubbing: Mom's hand shows how (no miss)
    if (h.moved < 30 * k && this.prog === 0) this.hintNow();
    this.backToTray(t);
  }

  protected lookTarget() {
    if (this.held) return { x: this.held.tool.img.x, y: this.held.tool.img.y };
    return null;
  }
}
