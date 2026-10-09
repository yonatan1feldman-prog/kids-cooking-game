import Phaser from 'phaser';
import { keepPhoto } from '../core/album';
import { ART, FX_SOFT, IMAGES, type ImageKey } from '../core/assets';
import { music } from '../core/audio';
import { AILMENTS, burnPlaces, PATIENTS, planVisit, TOOL_LINE, TOOLS, type Ailment, type AilmentId, type Patient, type Station, type ToolId, type What, type ZoomId } from '../core/clinic';
import type { VoiceKey } from '../core/audio';
import { boing, burst, puff, stars } from '../core/fx';
import { tapMotion, type HandKey, type HandMotion } from '../core/hand';
import { confetti, sway } from '../core/juice';
import { sfx } from '../core/sfx';
import { TUNING } from '../core/tuning';
import { Character } from '../steps/Character';
import type { CharacterDef } from '../recipes/types';
import type { Spot } from '../core/stage';
import { MiniGame, type P } from './MiniGame';
import { ClinicCare, type CareHost } from './ClinicCare';

const T = TUNING.clinic;
const C = ART.clinic;
/** The patients' frame (Pipa's and the guests': 600x700, feet at y 684). */
const FW = 600;
const FH = 700;
const FEET = 684;
/** The close-ups' frame (520) and the rim around them (600). */
const LENS = 520;
const RING = 600;
const STICKERS: ImageKey[] = ['sticker-star', 'sticker-heart', 'sticker-smile'];
const GERMS: ImageKey[] = ['germ-a', 'germ-b', 'germ-c'];

/** The display scale that shows an image at `s` times its native size (images rasterized bigger, `raster`). */
function rs(key: string, s: number) {
  return s / ((IMAGES[key as ImageKey] as { raster?: number } | undefined)?.raster ?? 1);
}

/** Where things go in each close-up (its 520 frame), from images-b-clinic/tools/gen_clinic(3).py. */
const SPOTS: Partial<Record<ZoomId, Partial<Record<What, readonly P[]>>>> = {
  eye: {
    tear: [{ x: 140, y: 336 }, { x: 196, y: 366 }, { x: 258, y: 380 }, { x: 322, y: 366 }, { x: 378, y: 336 }, { x: 100, y: 296 }],
    speck: [{ x: 128, y: 262 }, { x: 392, y: 262 }, { x: 180, y: 302 }, { x: 342, y: 302 }],
  },
  ear: { wax: [{ x: 226, y: 250 }, { x: 338, y: 262 }, { x: 246, y: 362 }, { x: 332, y: 356 }, { x: 290, y: 222 }, { x: 218, y: 312 }] },
  knee: {
    dirt: [{ x: 262, y: 258 }, { x: 362, y: 240 }, { x: 392, y: 306 }, { x: 292, y: 326 }, { x: 340, y: 290 }, { x: 236, y: 302 }],
  },
  paw: { splinter: [{ x: 262, y: 340 }, { x: 214, y: 150 }, { x: 306, y: 142 }, { x: 330, y: 380 }] },
  // round 4 (gen_clinic4.py SKIN: places on the arm's patch)
  skin: {
    sting: [{ x: 150, y: 170 }, { x: 270, y: 140 }, { x: 380, y: 190 }, { x: 190, y: 290 }, { x: 320, y: 280 }, { x: 400, y: 330 }, { x: 150, y: 380 }, { x: 260, y: 390 }, { x: 360, y: 410 }],
  },
  // round 5 (gen_clinic5.py TICKLES: in the throat, around the uvula)
  throat: { tickle: [{ x: 196, y: 268 }, { x: 324, y: 268 }, { x: 260, y: 318 }, { x: 214, y: 352 }, { x: 306, y: 352 }, { x: 260, y: 376 }] },
  xray: {
    germ: [{ x: 202, y: 300 }, { x: 318, y: 296 }, { x: 260, y: 384 }, { x: 196, y: 396 }, { x: 326, y: 394 }, { x: 260, y: 262 }],
    bell: [{ x: 200, y: 300 }, { x: 322, y: 300 }, { x: 262, y: 390 }, { x: 214, y: 380 }, { x: 310, y: 380 }],
  },
};
/** A child's hand (lens-hand, gen_clinic4.py HAND): where a splinter can go in (the palm first). */
const HAND_SPLINTERS: readonly P[] = [{ x: 262, y: 330 }, { x: 196, y: 290 }, { x: 326, y: 296 }, { x: 290, y: 392 }];
/** The one place a tool works on in a close-up (the cream, the plaster, the drops, the ice pack on the arm). */
const PLACE: Partial<Record<What, P>> = { knee: C.knee, paw: C.paw, eye: C.eye, ear: { x: C.earHole.x + 4, y: C.earHole.y + 10 }, skin: { x: 260, y: 290 } };
/** Places on her (not things to clean away): every station that goes there gets them fresh (`freshPlaces`). */
const PLACES: readonly What[] = ['mouth', 'forehead', 'nose', 'tummy', 'knee', 'paw', 'eye', 'ear', 'skin'];

/** A patient: the layered character (Character.ts) with her own voice's pitch and things drawn on her. */
export class PatientView extends Character {
  constructor(scene: Phaser.Scene, def: CharacterDef, spot: Spot, rate: number) {
    super(scene, def, spot, spot);
    this.voiceRate = rate;
  }
  /** An image on her, at a point of her 600x700 frame (it moves and grows with her). */
  put(key: string, f: P, scale = 1, angle = 0) {
    const img = new Phaser.GameObjects.Image(this.scene, f.x - FW / 2, f.y - FH / 2, key).setScale(rs(key, scale)).setAngle(angle);
    this.box.add(img);
    return img;
  }
  /** A point of her frame in the world, where she rests. */
  at(f: P): P {
    return { x: this.rest.x + (f.x - FW / 2) * this.scale, y: this.rest.y + (f.y - FH / 2) * this.scale };
  }
  /** A world point in her frame. */
  frameOf(p: P): P {
    return { x: (p.x - this.rest.x) / this.scale + FW / 2, y: (p.y - this.rest.y) / this.scale + FH / 2 };
  }
  get rate() {
    return this.voiceRate;
  }
  /** A nap in the rest room: eyes shut, mouth closed (and awake again, happy). */
  doze(on: boolean) {
    if (!on) return this.setMood('happy');
    this.setMood('rest');
    this.eyes.setTexture(this.def.eyesBlink);
    this.mouth.setTexture(this.def.mouthClosed);
  }
}

interface Visitor {
  p: Patient;
  /** Her problems (round 4: two each, like the patients in "Doctor Games for kids"), which are fixed, the one being fixed. */
  as: Ailment[];
  fixed: boolean[];
  ai: number;
  /** The problem being fixed (as[ai]). */
  readonly a: Ailment;
  view: PatientView;
  /** Her place on the bench in the waiting room. */
  seat: Spot;
  /** What shows she is not well (pink cheeks, a puffy cheek, a pink nose, mud...), per problem: they go when it is fixed. */
  signs: Map<AilmentId, Phaser.GameObjects.Image[]>;
  /** Things on her made in the waiting room already (the itchy spots, the mud): the treatment adopts them. */
  pre: Partial<Record<What, { f: P; img: Phaser.GameObjects.Image; base: number }[]>>;
  /** The pictures of what is wrong, over her head in the waiting room. */
  cards: Phaser.GameObjects.Image[];
  done: boolean;
}

/** A problem's picture beside the patient in the treatment room: a tap on it starts fixing it. */
interface Problem {
  img: Phaser.GameObjects.Image;
  glow: Phaser.GameObjects.Image;
  badge: Phaser.GameObjects.Image | null;
  at: P;
}

interface Tool {
  id: ToolId;
  img: Phaser.GameObjects.Image;
  slot: Phaser.GameObjects.Image;
  glow: Phaser.GameObjects.Image;
  home: P;
  homeScale: number;
  /** It stays where it was put (the plaster). */
  away: boolean;
}

/** One thing a tool works on: a germ, a tear, the wax, a hole, the splinter... or a place on her (the mouth, a chest spot). */
interface Thing {
  what: What;
  /** Its picture (in a close-up or on her); a place has an invisible marker (or a glow, for listening). */
  img: Phaser.GameObjects.Image;
  /** Its point in its frame: the close-up's 520 or her 600x700. */
  f: P;
  zoom: ZoomId | null;
  /** Its picture's scale in its frame. */
  base: number;
  hp: number;
  done: boolean;
  /** To be found first (big chef: not seen at all; little chef: faint). */
  hidden: boolean;
  /** A germ that already hopped away once (big chef). */
  dodged: boolean;
  /** Drops landed (drops). */
  drops: number;
  /** Under another thing still there (the bump under a sting, the soap where the mud was): it shows when that goes. */
  waiting: boolean;
}

interface Zoom {
  id: ZoomId;
  box: Phaser.GameObjects.Container;
  /** Its centre at rest, and its scale (frame 600 units -> world). */
  at: P;
  s: number;
  /** The body part it grows out of. */
  from: P;
  open: boolean;
  /** Layers that go when she is better (the eye's redness). */
  sore: Phaser.GameObjects.Image[];
  /** The cream rubbed in (knee, paw). */
  cream?: Phaser.GameObjects.Image;
}

/**
 * The clinic, round 3 (research/clinic-doctor-games.md: in the style of "Doctor Games for kids"), the second world, chosen
 * on the title: Mom the nurse and the child help three patients (the turtle, the penguin, the giraffe, Pipa). In the
 * waiting room each one shows what is wrong in a bubble and she picks who comes in. In the treatment room the patient
 * sits big on the bed, and every treatment is a few stations, one tool each, each with lots of small things to do in a
 * big close-up that grows out of the body part: wash the food bits off the teeth, brush the silly germs away (they
 * squeak and pop), fill a hole with a star, rinse; wipe the tears, take the speck out of the eye, drops; find the
 * ladybird in the ear with the light, take it out, clean the wax; the x-ray shows the tummy germs (medicine on each) or
 * the swallowed bell (the magnet); thermometer, ice pack, medicine; tissue; plaster. Little chef: the next tool hops and
 * glows and Mom says what to do. Big chef: she picks the tools herself, in the order she likes (what has to come first
 * comes first), more things to clean, things to find before taking them out, a germ that runs away once. The patient
 * always gets better: "All better!", a happy dance, a sticker of her choice, back to the bench. After the third, a photo
 * of the happy patients for the memory book, and quietly back to the title.
 * Nothing hurts, nothing is scary: no blood, no needles, no crying, no failing; a wrong tool just hops back.
 */
export class ClinicScene extends MiniGame {
  protected readonly id = 'clinic';
  protected readonly song = 'clinic' as const;
  protected readonly momOutfit = 'nurse' as const;
  protected readonly homeScene = 'Title' as const;
  protected readonly waiting = ['pick', 'problem', 'tool', 'care', 'sticker'] as const;
  private visit: Visitor[] = [];
  private cur: Visitor | null = null;
  private waitRoom: Phaser.GameObjects.GameObject[] = [];
  private treatRoom: Phaser.GameObjects.GameObject[] = [];
  /** The care room next door (round 5, part 2): its pictures (they slide in) and what runs it. */
  private careRoom: Phaser.GameObjects.GameObject[] = [];
  private care: ClinicCare | null = null;
  private room!: { x0: number; x1: number; bedX: number; seatY: number; bedScale: number; ps: number; toolS: number; zoom: { at: P; s: number } };
  private tools: Tool[] = [];
  private steps: Station[] = [];
  /** Which stations are done, and the one she is at. */
  private doneSt: boolean[] = [];
  private si = 0;
  private zooms = new Map<ZoomId, Zoom>();
  private zoom: Zoom | null = null;
  /** A close-up is opening or closing: tools don't work until it is there. */
  private zoomBusy = false;
  private things: Thing[] = [];
  private held: { tool: Tool; from: P; moved: number; last: P; t0: number } | null = null;
  private gripped: Thing | null = null;
  private gripAt: P | null = null;
  private stickers: Phaser.GameObjects.Image[] = [];
  private lineSaid = new Set<number>();
  private ranSaid = false;
  private lastHear = 0;
  private dripT = 0;
  private lightGlow: Phaser.GameObjects.Image | null = null;
  /** The current patient's problems beside her (round 4), and the one Mom suggests (easy level). */
  private problems: Problem[] = [];

  constructor() {
    super('Clinic');
  }

  init() {
    super.init();
    this.visit = [];
    this.cur = null;
    this.waitRoom = [];
    this.treatRoom = [];
    this.careRoom = [];
    this.care = null;
    this.tools = [];
    this.steps = [];
    this.doneSt = [];
    this.si = 0;
    this.zooms = new Map();
    this.zoom = null;
    this.zoomBusy = false;
    this.things = [];
    this.held = null;
    this.gripped = null;
    this.gripAt = null;
    this.stickers = [];
    this.lineSaid = new Set();
    this.ranSaid = false;
    this.dripT = 0;
    this.lightGlow = null;
    this.problems = [];
    Object.assign(this.shown, { patients: [] as string[], fixed: 0,  treated: 0, step: '', tool: '', wrong: 0, photo: 0, zoom: '', stations: 0, things: 0 });
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
    // (the test harness may choose them: window.__clinicPlan = [['lily', 'tooth', 'sting'], ['turtle', 'eye'], ...])
    const forced = (globalThis as { __clinicPlan?: string[][] }).__clinicPlan;
    const plan = forced
      ? forced.map(([p, ...as]) => ({ patient: PATIENTS.find((q) => q.id === p)!, ailments: as.map((a) => AILMENTS[a as AilmentId]) }))
      : planVisit(T.patients, T.problems[this.level - 1]);
    this.visit = plan.map(({ patient, ailments }) => ({ p: patient, as: ailments, fixed: ailments.map(() => false), ai: 0, pre: {}, cards: [], signs: new Map(), get a() { return (this as unknown as Visitor).as[(this as unknown as Visitor).ai]; } }) as unknown as Visitor);
    this.shown.patients = this.visit.map((v) => `${v.p.id}:${v.as.map((a) => a.id).join('+')}`);

    const petLeft = S.pet && this.withPipa() ? S.pet.x - 270 * S.pet.scale : Infinity;
    const right = Math.min(petLeft, S.momFace.x0) - 16 * k;

    // The waiting room: the bench, the patients on it, what is wrong with each over her head.
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
      for (const a of v.as) v.signs.set(a.id, this.signsOn(v, a));
      v.done = false;
      // her problems' pictures over her head, side by side
      const top = v.view.at({ x: 300, y: 40 });
      const cs = Math.min(0.56 * k, (430 * bs) / (200 * v.as.length + 20));
      v.cards = v.as.map((a, j) => this.add.image(top.x + (j - (v.as.length - 1) / 2) * 212 * cs, top.y - 60 * cs, a.card).setScale(cs).setDepth(8));
      this.waitRoom.push(...v.cards);
    });

    // The treatment room: the bed low in the middle, the patient sitting on it big; the tray on the left.
    this.treatRoom.push(this.backdrop('bg-clinic'));
    const x0 = S.work.x0;
    const bedScale = Math.min(1.05 * k, (right - x0) / 900);
    const bedX = (x0 + right) / 2;
    const bedY = L.Y(1010) - 160 * bedScale;
    this.treatRoom.push(this.add.image(bedX, bedY, 'clinic-bed').setScale(bedScale).setDepth(2));
    const bedSeat = bedY + (C.bedSeat - 160) * bedScale;
    // (as big as the room allows: her head just under the top, her width inside the middle)
    const ps = Math.min(1.3 * k, (bedSeat - L.Y(40)) / (FEET - 40), (right - x0) / 560);
    // The close-ups: as big as the middle allows (up to `zoomMax` of the 600 rim), clear of the top and the palm strip.
    const zs = Math.min(T.zoomMax * k, (right - x0) / RING, (L.Y(1000) - L.Y(24)) / RING);
    const zat = { x: (x0 + right) / 2, y: L.Y(24) + (RING / 2) * zs };
    this.room = { x0, x1: right, bedX, seatY: bedSeat, bedScale, ps, toolS: 0.92 * k, zoom: { at: zat, s: zs } };
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
    this.lightGlow?.destroy();
    this.lightGlow = null;
  }

  // ---------------------------------------------------------------- what shows she is not well

  /** Every sign she still shows. */
  private allSigns(v: Visitor) {
    return [...v.signs.values()].flat();
  }

  /** The things on her a problem works on, made now so she shows them in the waiting room (the spots, the mud). */
  private preOn(v: Visitor, a: Ailment, what: 'spot' | 'mud' | 'burn', key: string, places: readonly P[]) {
    const st = a.steps[this.level - 1].find((q) => q.what === what);
    const n = st?.n ? st.n[this.level - 1] : 1;
    // (a sunburn is on her face first, then her arms: in that order)
    const fs = (what === 'burn' ? [...places] : Phaser.Utils.Array.Shuffle([...places])).slice(0, n);
    const list = fs.map((f) => {
      const base = Phaser.Math.FloatBetween(0.85, 1.1) * (what === 'mud' ? 0.62 : what === 'burn' ? 0.62 : 1);
      return { f, base, img: v.view.put(key, f, base, what === 'mud' ? Phaser.Math.Between(-30, 30) : 0) };
    });
    v.pre[what] = list;
    return list.map((q) => q.img);
  }

  private signsOn(v: Visitor, a: Ailment): Phaser.GameObjects.Image[] {
    const p = v.p;
    const view = v.view;
    switch (a.id) {
      case 'spots':
        return this.preOn(v, a, 'spot', 'clinic-spot', p.spots);
      case 'dirty':
        return this.preOn(v, a, 'mud', 'clinic-mud', [...p.cheeks, p.forehead, ...p.spots]);
      // round 5: a sunburn glows on her nose, cheeks and arms; a scratchy throat makes her cheeks a little pink
      case 'sunburn':
        return this.preOn(v, a, 'burn', 'clinic-burn', burnPlaces(p));
      case 'throat':
        return [view.put('clinic-cheek', p.cheeks[0], 0.8).setAlpha(0.55), view.put('clinic-cheek', p.cheeks[1], 0.8).setAlpha(0.55)];
      case 'sting':
        return [view.put('clinic-bite', { x: p.cheeks[1].x - 10, y: p.cheeks[1].y - 20 }, 0.7)];
      case 'bites': {
        const fs = p.spots.length ? p.spots.slice(0, 2) : p.cheeks;
        return fs.map((f) => view.put('clinic-bite', f, 0.6));
      }
      case 'fever':
        return [
          view.put('clinic-cheek', p.cheeks[0], 0.95).setAlpha(0.75),
          view.put('clinic-cheek', p.cheeks[1], 0.95).setAlpha(0.75),
          view.put('clinic-sweat', { x: p.forehead.x + 100, y: p.forehead.y + 20 }, 0.9),
        ];
      case 'tooth':
        return [view.put('clinic-bump', p.cheeks[1], 0.85)];
      case 'knee':
        return p.foot ? [view.put('clinic-scrape', p.foot, 0.5, -10), view.put('clinic-dust', p.foot, 0.45)] : [];
      case 'paw': {
        const f = p.hand ?? p.foot;
        return f ? [view.put('clinic-splinter', { x: f.x - 8, y: f.y + 6 }, 0.55, -25)] : [];
      }
      case 'cold': {
        const n = this.noseOf(v);
        return [view.put('clinic-cheek', n, 0.42).setAlpha(0.95), view.put('clinic-sweat', { x: n.x + 26, y: n.y + 34 }, 0.55)];
      }
      case 'eye': {
        // a tear on her cheek
        const c = p.cheeks[0];
        return [view.put('water-drop', { x: c.x + 30, y: c.y - 20 }, 0.5)];
      }
      default:
        return [];
    }
  }

  /** Her nose in her frame: given, or just above her mouth (the penguin's beak is her mouth). */
  private noseOf(v: Visitor): P {
    if (v.p.nose) return v.p.nose;
    const m = v.view.frameOf(v.view.mouthAt);
    return { x: m.x, y: m.y - (v.p.id === 'penguin' ? 10 : 50) };
  }

  /** She shows what is wrong (as she comes in, and when tapped): a cough, a gurgle, warm cheeks, a sneeze. */
  private showSign(v: Visitor) {
    const a = v.as.find((_, i) => !v.fixed[i]) ?? v.as[0];
    const signs = v.signs.get(a.id) ?? [];
    const view = v.view;
    const box = view.box;
    const s = view.scale;
    const rate = view.rate;
    this.tweens.killTweensOf(box);
    box.setScale(s).setPosition(view.rest.x, view.rest.y).setAngle(0);
    switch (a.id) {
      case 'cough':
      case 'throat':
        sfx(this, 'cough', { minGapMs: 0, rate });
        this.tweens.add({ targets: box, scaleY: s * 0.92, duration: 90, yoyo: true, repeat: 1, ease: 'Quad.easeOut' });
        break;
      case 'cold':
        sfx(this, 'pipa-sneeze', { minGapMs: 0, rate });
        this.tweens.add({ targets: box, scaleY: s * 0.9, scaleX: s * 1.05, duration: 110, yoyo: true, delay: 380, ease: 'Quad.easeOut' });
        break;
      case 'toy':
        sfx(this, 'jingle', { minGapMs: 0, volume: 0.7 });
        this.tweens.add({ targets: box, angle: { from: -3, to: 3 }, duration: 120, yoyo: true, repeat: 2, ease: 'Sine.easeInOut', onComplete: () => box.setAngle(0) });
        break;
      case 'tummy':
        sfx(this, 'gurgle', { minGapMs: 0 });
        this.tweens.add({ targets: box, angle: { from: -3, to: 3 }, duration: 140, yoyo: true, repeat: 2, ease: 'Sine.easeInOut', onComplete: () => box.setAngle(0) });
        break;
      default:
        for (const g of signs) boing(this, g, 0.25);
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
    if (v.cards.length) this.tweens.add({ targets: v.cards, alpha: 0, scale: 0, duration: 260 });
    // a happy hop toward the door, then the treatment room
    const door = { x: this.L.W / 2 + (1330 - 1200) * Math.max(1, this.L.W / 2400), y: v.seat.y };
    this.tweens.add({ targets: v.view.box, x: (v.seat.x + door.x) / 2, y: v.seat.y - 60 * v.seat.scale, duration: 420, ease: 'Quad.easeOut' });
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

  private bedSpot(): Spot {
    const r = this.room;
    return { x: r.bedX - 15 * r.bedScale, y: r.seatY - (FEET - FH / 2) * r.ps + 6 * r.ps, scale: r.ps };
  }

  /** On the bed, big: she shows what is wrong, and her problems' pictures come out beside her. */
  private arrived(v: Visitor) {
    this.showSign(v);
    this.time.delayedCall(600, () => {
      if (this.leaving || this.cur !== v) return;
      this.layProblems(v);
      this.time.delayedCall(350, () => this.beginProblem(true));
    });
  }

  // ---------------------------------------------------------------- her problems (round 4)

  /** Her problems' pictures, on both sides of her head (clear of the tray and Mom), each a big tap target. */
  private layProblems(v: Visitor) {
    const k = this.L.k;
    const r = this.room;
    const s = 0.86 * k;
    const head = v.view.at({ x: 300, y: 230 });
    const dx = 330 * v.view.scale;
    const n = v.as.length;
    const spots: P[] = n === 1 ? [{ x: head.x + dx, y: head.y }] : n === 2
      ? [{ x: head.x - dx, y: head.y }, { x: head.x + dx, y: head.y }]
      : [{ x: head.x - dx, y: head.y + 40 * k }, { x: head.x, y: head.y - 240 * v.view.scale }, { x: head.x + dx, y: head.y + 40 * k }];
    const pad = 105 * k;
    this.problems = v.as.map((a, i) => {
      const at = { x: Phaser.Math.Clamp(spots[i].x, r.x0 + pad, r.x1 - pad), y: Math.max(this.L.Y(30) + pad, spots[i].y) };
      const glow = this.add.image(at.x, at.y, FX_SOFT).setTint(0xfff1a8).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0).setDepth(24);
      glow.setScale((330 * k) / glow.frame.realWidth);
      const img = this.add.image(at.x, at.y, a.card).setScale(0).setDepth(25);
      img.setData('scale', s);
      this.tweens.add({ targets: img, scale: s, duration: 320, delay: 120 * i, ease: 'Back.easeOut' });
      let badge: Phaser.GameObjects.Image | null = null;
      if (v.fixed[i]) {
        img.setAlpha(0.6);
        badge = this.add.image(at.x + 62 * k, at.y + 58 * k, 'clinic-done').setScale(0.72 * k).setDepth(26);
      }
      return { img, glow, badge, at };
    });
    sfx(this, 'pop', { volume: 0.5 });
  }

  /** The problem Mom suggests next (easy level): the first one not fixed. */
  private nextProblem() {
    return this.cur ? this.cur.fixed.findIndex((f) => !f) : -1;
  }

  /** She chooses what to fix: easy, the next one glows and Mom says it; hard, Mom asks what first. */
  private beginProblem(first: boolean) {
    const v = this.cur;
    if (!v || this.leaving) return;
    const i = this.nextProblem();
    if (i < 0) return;
    let line: VoiceKey | null;
    if (this.level === 1) {
      this.problems.forEach((q, j) => this.tweens.add({ targets: q.glow, alpha: j === i ? 0.9 : 0, duration: 260 }));
      const q = this.problems[i];
      this.tweens.add({ targets: q.img, y: q.at.y - 24 * this.L.k, duration: 180, yoyo: true, repeat: 1, ease: 'Quad.easeOut' });
      line = v.as[i].line;
    } else line = first ? 'vo-clinic-fixfirst' : null;
    this.begin('problem', line);
  }

  /** A problem picked: its picture hops, the others step back, Mom names it (unless she just did), and it starts. */
  private startProblem(i: number) {
    const v = this.cur!;
    const k = this.L.k;
    const said = this.level === 1 && i === this.nextProblem();
    this.setPhase('intro');
    v.ai = i;
    const q = this.problems[i];
    sfx(this, 'pop');
    boing(this, q.img, 0.15);
    stars(this, q.at.x, q.at.y, 6, 34 * k);
    this.hideProblems(260);
    const go = () => this.time.delayedCall(250, () => !this.leaving && this.cur === v && this.startTreat());
    if (said) this.time.delayedCall(300, go);
    else this.say(v.as[i].line, { ttlMs: 5000, done: go });
  }

  private hideProblems(delay = 0) {
    for (const q of this.problems) {
      this.tweens.killTweensOf([q.img, q.glow]);
      this.tweens.add({ targets: [q.img, q.glow, ...(q.badge ? [q.badge] : [])], alpha: 0, duration: 260, delay, onComplete: () => (q.img.destroy(), q.glow.destroy(), q.badge?.destroy()) });
    }
    this.problems = [];
  }

  /** One problem fixed: its signs go, a little cheer; the next problem, or "All better!" when it was the last. */
  private problemDone() {
    const v = this.cur!;
    const a = v.a;
    const k = this.L.k;
    v.fixed[v.ai] = true;
    this.shown.fixed = (this.shown.fixed as number) + 1;
    this.setPhase('intro');
    this.closeZoom();
    this.clearTray();
    // what showed the problem goes (a plaster stays on a knee or a foot); the places on her go
    const signs = v.signs.get(a.id) ?? [];
    for (const g of signs) this.tweens.add({ targets: g, alpha: 0, duration: 500, onComplete: () => g.destroy() });
    v.signs.delete(a.id);
    for (const t of this.things) if (!t.zoom && t.img.active && !signs.includes(t.img)) t.img.destroy();
    this.things = [];
    if (a.id === 'knee' || a.id === 'paw') {
      const f = a.id === 'paw' ? v.p.hand ?? v.p.foot : v.p.foot;
      if (f) {
        const pl = v.view.put('tool-plaster', f, 0.42, -8).setAlpha(0);
        this.tweens.add({ targets: pl, alpha: 1, duration: 400, delay: 300 });
      }
    }
    if (v.fixed.every(Boolean)) return this.time.delayedCall(350, () => this.startCare(v));
    this.time.delayedCall(400, () => {
      if (this.leaving || this.cur !== v) return;
      sfx(this, 'sparkle', { minGapMs: 0 });
      const head = v.view.at({ x: 300, y: 200 });
      stars(this, head.x, head.y, 8, 44 * k);
      v.view.react('love');
      this.mom?.happy();
      this.time.delayedCall(800, () => this.mom?.rest());
      this.say('vo-clinic-fixed', { ttlMs: 4000 });
      this.time.delayedCall(500, () => {
        if (this.leaving || this.cur !== v) return;
        this.layProblems(v);
        this.time.delayedCall(500, () => this.beginProblem(false));
      });
    });
  }

  // ---------------------------------------------------------------- 2. the treatment: stations

  private startTreat() {
    if (this.leaving) return;
    this.steps = this.cur!.a.steps[this.level - 1];
    this.shown.ailment = this.cur!.a.id;
    this.doneSt = this.steps.map(() => false);
    this.si = 0;
    this.lineSaid.clear();
    this.ranSaid = false;
    this.makeThings();
    this.layTray();
    this.time.delayedCall(450, () => this.startStation(this.firstOpen(), true));
  }

  /** How many of a station's things there are on this level. */
  private count(st: Station) {
    return st.n ? st.n[this.level - 1] : 1;
  }

  /** Everything this patient's treatment works on, drawn now (in the close-ups, or on her), in its place. */
  private makeThings() {
    const v = this.cur!;
    for (const z of this.zooms.values()) z.box.destroy();
    this.zooms = new Map();
    this.zoom = null;
    this.things = [];
    for (const st of this.steps) if (st.view !== 'body' && !this.zooms.has(st.view)) this.makeZoom(st.view);
    const made = new Set<string>();
    for (const st of this.steps) {
      const key = `${st.view}-${st.what}`;
      if (made.has(key)) continue;
      made.add(key);
      const n = Math.max(...this.steps.filter((q) => q.view === st.view && q.what === st.what).map((q) => this.count(q)));
      const found = this.steps.some((q) => q.act === 'find' && q.view === st.view && q.what === st.what);
      if (st.on) continue;
      if (st.view === 'body') this.bodyThings(v, st, n, found);
      else this.zoomThings(this.zooms.get(st.view)!, st, n, found);
    }
    // (what shows where another thing goes: made under each of them, waiting)
    for (const st of this.steps) if (st.on) this.underThings(v, st);
  }

  /** A station's targets under the `on` things (the bump under each sting, the soap where each mud splat is). */
  private underThings(v: Visitor, st: Station) {
    const zoom = st.view === 'body' ? null : st.view;
    const key = st.what === 'foam' ? 'clinic-foam' : 'clinic-bite';
    for (const o of this.things.filter((t) => t.what === st.on && t.zoom === zoom && !t.waiting)) {
      let img: Phaser.GameObjects.Image;
      const base = st.what === 'foam' ? 0.7 : 0.7;
      if (zoom) {
        const z = this.zooms.get(zoom)!;
        img = new Phaser.GameObjects.Image(this, o.img.x, o.img.y + (st.what === 'bite' ? 10 * z.s : 0), key).setScale(rs(key, base * z.s));
        z.box.addAt(img, z.box.getIndex(o.img));
      } else {
        img = v.view.put(key, o.f, base);
        v.view.box.moveBelow(img, o.img);
        (v.signs.get(v.a.id) ?? []).push(img);
      }
      img.setAlpha(0);
      this.things.push({ what: st.what, img, f: o.f, zoom, base, hp: 0, done: false, hidden: false, dodged: false, drops: 0, waiting: true });
    }
  }

  /** On her: itchy spots, or the places a tool goes (the mouth, the forehead, the nose, the tummy, the chest spots). */
  private bodyThings(v: Visitor, st: Station, n: number, found: boolean) {
    const view = v.view;
    const p = v.p;
    const add = (what: What, f: P, img: Phaser.GameObjects.Image, base: number, hidden = false) =>
      this.things.push({ what, img, f, zoom: null, base, hp: 0, done: false, hidden, dodged: false, drops: 0, waiting: false });
    const marker = (f: P) => view.put(FX_SOFT, f, 0.01).setAlpha(0);
    switch (st.what) {
      case 'spot':
      case 'mud':
      case 'burn': {
        // (made in the waiting room already: she showed them there)
        for (const q of (v.pre[st.what] ?? []).slice(0, n)) add(st.what, q.f, q.img, q.base);
        return;
      }
      case 'listen':
        for (const f of p.chest.slice(0, n)) {
          const img = view.put(FX_SOFT, f, 1).setTint(0xfff3a0).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0);
          img.setScale((95 / img.frame.realWidth) / Math.max(0.3, view.scale) * this.L.k);
          add('listen', f, img, img.scaleX);
        }
        return;
      case 'wheeze': {
        const f = Phaser.Utils.Array.GetRandom([...p.chest]);
        add('wheeze', f, marker(f), 1, found);
        return;
      }
      case 'mouth':
        add('mouth', view.frameOf(view.mouthAt), marker(view.frameOf(view.mouthAt)), 1);
        return;
      case 'forehead':
        add('forehead', p.forehead, marker(p.forehead), 1);
        return;
      case 'nose':
        add('nose', this.noseOf(v), marker(this.noseOf(v)), 1);
        return;
      case 'tummy': {
        const f = { x: (p.chest[1].x + p.chest[2].x) / 2, y: Math.min(FEET - 120, (p.chest[1].y + p.chest[2].y) / 2 + 20) };
        add('tummy', f, marker(f), 1);
        return;
      }
      default:
    }
  }

  /** In a close-up: the germs, food bits, holes, tears, specks, wax, the ladybird, dirt, splinters, the bell; or its place. */
  private zoomThings(z: Zoom, st: Station, n: number, found: boolean) {
    const s = z.s;
    const add = (what: What, key: string, f: P, base: number, angle = 0, alpha = 1, hidden = false) => {
      const img = new Phaser.GameObjects.Image(this, (f.x - LENS / 2) * s, (f.y - LENS / 2) * s, key).setScale(rs(key, base * s)).setAngle(angle);
      // (a thing to find: big chef sees nothing at all, little chef a faint hint of it)
      img.setAlpha(hidden ? (this.level === 1 ? 0.3 : 0) : alpha);
      z.box.addAt(img, z.box.length - 1);
      this.things.push({ what, img, f, zoom: z.id, base, hp: 0, done: false, hidden, dodged: false, drops: 0, waiting: false });
      return img;
    };
    const pick = (list: readonly P[]) => Phaser.Utils.Array.Shuffle([...list]).slice(0, n);
    const teeth = () => Phaser.Utils.Array.Shuffle(C.teeth.map(([x, y]) => ({ x, y })));
    switch (st.what) {
      case 'sting':
        pick(SPOTS.skin!.sting!).forEach((f) => add('sting', 'clinic-sting', f, 0.8, Phaser.Math.Between(-15, 15)));
        return;
      case 'gnat': {
        // the gnats sit on the arm, each near a bite of its own (the bites come out from under them, round 4)
        const fs = pick(SPOTS.skin!.sting!);
        fs.forEach((f) => add('bite', 'clinic-bite', { x: f.x + 30, y: f.y + 34 }, 0.75));
        fs.forEach((f) => add('gnat', 'clinic-gnat', f, 0.8, Phaser.Math.Between(-12, 12)));
        return;
      }
      case 'bite':
        // (made with the gnats)
        if (this.things.some((t) => t.what === 'bite' && t.zoom === z.id)) return;
        pick(SPOTS.skin!.sting!).forEach((f) => add('bite', 'clinic-bite', f, 0.75));
        return;
      case 'germ': {
        const fs = z.id === 'mouth' ? teeth().slice(0, n).map((t) => ({ x: t.x + Phaser.Math.Between(-6, 6), y: t.y + (t.y < 270 ? -4 : 4) })) : pick(SPOTS.xray!.germ!);
        fs.forEach((f, i) => add('germ', GERMS[i % GERMS.length], f, z.id === 'mouth' ? 0.62 : 0.72, Phaser.Math.Between(-12, 12), 1, found));
        return;
      }
      case 'food': {
        // between the teeth and on them
        teeth().slice(0, n).forEach((t, i) => add('food', i % 2 ? 'food-bit' : 'clinic-dirt', { x: t.x + (i % 2 ? 16 : -12), y: t.y + (t.y < 270 ? 26 : -26) }, i % 2 ? 0.7 : 0.55, Phaser.Math.Between(-30, 30)));
        return;
      }
      case 'hole':
        // (on teeth the food and the germs leave free when there are enough; holes come after them anyway)
        teeth().slice(0, n).forEach((t) => add('hole', 'tooth-hole', { x: t.x + 4, y: t.y + (t.y < 270 ? 10 : -10) }, 0.9));
        return;
      case 'tear':
        pick(SPOTS.eye!.tear!).forEach((f) => add('tear', 'water-drop', f, 0.62));
        return;
      case 'speck':
        pick(SPOTS.eye!.speck!).forEach((f) => add('speck', 'eye-speck', f, 0.8, Phaser.Math.Between(-30, 30), 1, found));
        return;
      case 'wax':
        pick(SPOTS.ear!.wax!).forEach((f) => add('wax', 'ear-wax', f, 0.62, Phaser.Math.Between(-20, 20)));
        return;
      case 'bug':
        add('bug', 'ear-bug', { x: C.earHole.x + 6, y: C.earHole.y + 12 }, 0.62, 0, 1, found);
        return;
      case 'dirt':
        pick(SPOTS.knee!.dirt!).forEach((f) => add('dirt', 'clinic-dirt', f, 0.6, Phaser.Math.Between(-30, 30)));
        return;
      case 'splinter': {
        // little chef: the big pad first
        const all = this.cur!.p.kid ? HAND_SPLINTERS : SPOTS.paw!.splinter!;
        const list = this.level === 1 ? [all[0]] : pick(all);
        list.slice(0, n).forEach((f) => add('splinter', 'clinic-splinter', f, 0.8, -28, 1, found));
        return;
      }
      case 'tickle':
        pick(SPOTS.throat!.tickle!).forEach((f) => add('tickle', 'clinic-tickle', f, 0.72, Phaser.Math.Between(-15, 15), 1, found));
        return;
      case 'bell':
        add('bell', 'clinic-toy', Phaser.Utils.Array.GetRandom([...SPOTS.xray!.bell!]), 0.95, Phaser.Math.Between(-15, 15), 1, found);
        return;
      default: {
        // a place: the knee, the foot, the eye, the ear (an invisible marker)
        const f = PLACE[st.what] ?? { x: 260, y: 260 };
        add(st.what, FX_SOFT, f, 0.01, 0, 0);
      }
    }
  }

  /** A close-up, made once per patient (hidden until a station needs it, so what is done stays done). */
  private makeZoom(id: ZoomId) {
    const v = this.cur!;
    const { at, s } = this.room.zoom;
    // (a soft backdrop: the knee and the paw are drawn on a clear ground, the patient must not show through)
    const parts: Phaser.GameObjects.GameObject[] = [new Phaser.GameObjects.Arc(this, 0, 0, (LENS / 2 - 6) * s, 0, 360, false, 0xf3f7ef)];
    const layer = (key: string, tint?: number) => {
      const img = new Phaser.GameObjects.Image(this, 0, 0, key).setScale(rs(key, s));
      if (tint !== undefined) img.setTint(tint);
      parts.push(img);
      return img;
    };
    const sore: Phaser.GameObjects.Image[] = [];
    let cream: Phaser.GameObjects.Image | undefined;
    // (the close-ups' skin is light grey art: a lighter tint keeps the face bright, not muddy)
    const c = Phaser.Display.Color.IntegerToColor(v.p.tint.skin);
    const skin = Phaser.Display.Color.GetColor(c.red + (255 - c.red) * 0.4, c.green + (255 - c.green) * 0.4, c.blue + (255 - c.blue) * 0.4);
    switch (id) {
      case 'mouth':
        layer('lens-mouth');
        break;
      case 'throat':
        layer('lens-throat');
        break;
      case 'eye':
        layer('lens-eye', skin);
        layer('lens-eye-ball');
        sore.push(layer('clinic-eye-red'));
        break;
      case 'ear':
        layer('lens-ear', skin);
        break;
      case 'knee': {
        layer('lens-knee', skin);
        const sc = layer('clinic-scrape').setScale(rs('clinic-scrape', 1.15 * s)).setAngle(-8).setPosition((C.knee.x - LENS / 2) * s, (C.knee.y - LENS / 2) * s);
        sore.push(sc);
        cream = layer('clinic-cream').setScale(rs('clinic-cream', 1.2 * s)).setPosition((C.knee.x - LENS / 2) * s, (C.knee.y - LENS / 2) * s).setAlpha(0);
        break;
      }
      case 'paw':
        layer(v.p.kid ? 'lens-hand' : 'lens-paw', skin);
        cream = layer('clinic-cream').setScale(rs('clinic-cream', 1.0 * s)).setPosition((C.paw.x - LENS / 2) * s, (C.paw.y - LENS / 2) * s).setAlpha(0);
        break;
      case 'xray':
        layer('lens-xray');
        break;
      case 'skin':
        layer('lens-skin', skin);
        break;
    }
    layer('lens-ring');
    const box = this.add.container(at.x, at.y, parts).setDepth(30).setScale(0).setVisible(false);
    this.zooms.set(id, { id, box, at, s, from: at, open: false, sore, cream });
  }

  /** The body part a close-up grows out of. */
  private zoomFrom(id: ZoomId): P {
    const v = this.cur!;
    const p = v.p;
    switch (id) {
      case 'mouth':
      case 'throat':
        return v.view.mouthAt;
      case 'eye':
        return v.view.at({ x: p.forehead.x - 50, y: p.forehead.y + 70 });
      case 'ear':
        return v.view.at({ x: p.forehead.x + 150, y: p.forehead.y + 20 });
      case 'xray':
        return v.view.at(p.chest[0]);
      case 'skin':
        return v.view.at(p.hand ?? (p.spots[2] ?? p.cheeks[1]));
      case 'paw':
        return v.view.at(p.hand ?? p.foot ?? p.chest[0]);
      default:
        return v.view.at(p.foot ?? p.chest[0]);
    }
  }

  private openZoom(id: ZoomId, then: () => void) {
    const z = this.zooms.get(id)!;
    const go = () => {
      this.zoomBusy = true;
      z.from = this.zoomFrom(id);
      z.open = true;
      this.zoom = z;
      this.shown.zoom = id;
      this.tweens.killTweensOf(z.box);
      z.box.setVisible(true).setPosition(z.from.x, z.from.y).setScale(0).setAngle(0);
      sfx(this, id === 'xray' ? 'scan' : 'whoosh', { volume: 0.5 });
      this.tweens.add({ targets: z.box, x: z.at.x, y: z.at.y, scale: 1, duration: 420, ease: 'Back.easeOut', onComplete: () => {
        this.zoomBusy = false;
        this.time.delayedCall(150, then);
      } });
    };
    if (this.zoom && this.zoom !== z) return this.closeZoom(go);
    if (this.zoom === z) return then();
    go();
  }

  private closeZoom(then?: () => void) {
    const z = this.zoom;
    if (!z) return then?.();
    this.zoom = null;
    z.open = false;
    this.shown.zoom = '';
    this.zoomBusy = true;
    this.tweens.killTweensOf(z.box);
    this.tweens.add({ targets: z.box, x: z.from.x, y: z.from.y, scale: 0, duration: 300, ease: 'Back.easeIn', onComplete: () => {
      z.box.setVisible(false);
      this.zoomBusy = false;
      then?.();
    } });
  }

  /** The tools this patient needs, and spare ones, shuffled on their tray places in the left column. */
  private layTray() {
    const S = this.S;
    const need = [...new Set(this.steps.map((s) => s.tool))];
    const spare = Phaser.Utils.Array.Shuffle(TOOLS.filter((t) => !need.includes(t))).slice(0, T.decoys[this.level - 1]);
    const ids = Phaser.Utils.Array.Shuffle([...need, ...spare]) as ToolId[];
    const n = ids.length;
    const sc = S.binScale(n);
    this.tools = ids.map((id, i) => {
      const at = S.bin(i, n);
      const slot = this.add.image(at.x, at.y, 'clinic-slot').setScale(0).setDepth(20);
      const glow = this.add.image(at.x, at.y, FX_SOFT).setTint(0xfff1a8).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0).setDepth(21);
      glow.setScale((240 * sc * 1.3) / glow.frame.realWidth);
      const img = this.add.image(at.x, at.y, `tool-${id}`).setScale(0).setDepth(22);
      const homeScale = sc * 0.92;
      this.tweens.add({ targets: slot, scale: sc, duration: 300, delay: 80 * i, ease: 'Back.easeOut' });
      this.tweens.add({ targets: img, scale: homeScale, duration: 300, delay: 80 * i + 60, ease: 'Back.easeOut' });
      return { id, img, slot, glow, home: at, homeScale, away: false };
    });
    sfx(this, 'whoosh', { volume: 0.4 });
  }

  private clearTray() {
    for (const t of this.tools) {
      this.tweens.killTweensOf([t.img, t.slot, t.glow]);
      this.tweens.add({ targets: [t.img, t.slot, t.glow], scale: 0, alpha: 0, duration: 260, onComplete: () => (t.img.destroy(), t.slot.destroy(), t.glow.destroy()) });
    }
    this.tools = [];
  }

  get station(): Station | null {
    return this.steps[this.si] ?? null;
  }

  private toolOf(id: ToolId) {
    return this.tools.find((t) => t.id === id && !t.away) ?? null;
  }

  /**
   * Can this station be done now? What it needs comes first: the finding before the taking out, an earlier use of the
   * same tool (the thermometer twice), and the last station last (the rinse, the drops, the plaster, the thermometer's
   * "just right").
   */
  private available(i: number) {
    const st = this.steps[i];
    if (this.doneSt[i]) return false;
    const last = this.steps.length - 1;
    for (let j = 0; j < i; j++) {
      if (this.doneSt[j]) continue;
      const q = this.steps[j];
      if (q.tool === st.tool || (q.act === 'find' && q.view === st.view && q.what === st.what) || (st.on && q.what === st.on && q.view === st.view) || i === last) return false;
    }
    return true;
  }

  private firstOpen() {
    return this.doneSt.findIndex((d) => !d);
  }

  /**
   * A station starts: its close-up opens (or closes, for one on her), the next tool hops and glows (little chef) and
   * Mom says what to do. Big chef: no glow; Mom asks which tool, and says what to do when the right one is picked.
   */
  private startStation(i: number, first = false) {
    if (this.leaving || i < 0) return;
    this.si = i;
    const st = this.steps[i];
    this.freshPlaces(st);
    this.gripped = null;
    this.dripT = 0;
    this.shown.step = `${st.tool}-${st.act}-${st.what}`;
    this.shown.tool = st.tool;
    this.setPhase('intro');
    const go = () => {
      if (this.leaving) return;
      if (this.level === 1) {
        for (const t of this.tools) this.tweens.add({ targets: t.glow, alpha: t.id === st.tool && !t.away ? 0.95 : 0, duration: 260 });
        const t = this.toolOf(st.tool);
        if (t && !this.held) this.tweens.add({ targets: t.img, y: t.home.y - 26 * this.L.k, duration: 180, yoyo: true, repeat: 1, ease: 'Quad.easeOut' });
        this.lineSaid.add(i);
        this.begin('tool', this.lineOf(st));
      } else this.begin('tool', first ? 'vo-clinic-which' : null);
      this.revealPlaces();
    };
    // (big chef: the close-up opens once she picks a tool for it)
    if (this.level === 2 && !first) return go();
    this.viewFor(st, go);
  }

  /** The station's close-up open (or none, for one on her body), then `then`. */
  private viewFor(st: Station, then: () => void) {
    const v = this.cur!;
    if (st.view === 'body') {
      if (this.zoom) return this.closeZoom(then);
      return then();
    }
    if (this.zoom?.id === st.view) return then();
    const say = st.view === 'mouth' && !this.zooms.get('mouth')!.open && !this.lineSaid.has(-1);
    this.openZoom(st.view, () => {
      if (say && v === this.cur) {
        this.lineSaid.add(-1);
        this.say('vo-say-aah', { ttlMs: 3000 });
      }
      then();
    });
  }

  /**
   * A place on her (the mouth, the forehead, the knee...) is a target for every station that goes there: the
   * thermometer twice, the syrup after the ice pack, the plaster after the cream. A station starting there gets it fresh.
   */
  private freshPlaces(st: Station) {
    if (!PLACES.includes(st.what)) return;
    for (const t of this.things) {
      if (t.what !== st.what || t.zoom !== (st.view === 'body' ? null : st.view)) continue;
      t.done = false;
      t.hp = 0;
      t.drops = 0;
    }
  }

  private lineOf(st: Station) {
    return st.line !== undefined ? st.line : TOOL_LINE[st.tool];
  }

  /** The chest spots glow while she listens (the station's places that show). */
  private revealPlaces() {
    const st = this.station;
    for (const t of this.things) {
      if (t.what !== 'listen') continue;
      const on = st?.what === 'listen' && !t.done;
      this.tweens.add({ targets: t.img, alpha: on ? 0.95 : 0, duration: 300 });
    }
  }

  /** The things the current station still works on (found ones only, but for a station that finds them). */
  targets(): Thing[] {
    const st = this.station;
    if (!st) return [];
    return this.things.filter((t) => t.what === st.what && t.zoom === (st.view === 'body' ? null : st.view) && !t.done && !t.waiting && (st.act === 'find' ? t.hidden : !t.hidden || st.act === 'give'));
  }

  /** A thing's point in the world (in the close-up, which may be moving; or on her). */
  private worldOf(t: Thing): P {
    if (t.zoom) {
      const z = this.zooms.get(t.zoom)!;
      return { x: z.box.x + t.img.x * z.box.scale, y: z.box.y + t.img.y * z.box.scale };
    }
    return this.cur!.view.at(t.f);
  }

  /** Where the current station's tool should go next (the hint, Mom's help, the harness). */
  target(): P | null {
    const t = this.targets()[0];
    if (!t) return null;
    if (this.station?.act === 'find') {
      // (hidden: where it is, all the same; Mom's hint sweeps to it)
      return this.worldOf(t);
    }
    return this.worldOf(t);
  }

  // ---------------------------------------------------------------- the tools in her hand

  /** The tool's working point (the bulb, the bristles, the tips) in the world. */
  private tip(t: Tool): P {
    const tp = C.tip[t.id as keyof typeof C.tip];
    const s = t.img.scale;
    return { x: t.img.x + (tp.x - 120) * s, y: t.img.y + (tp.y - 120) * s };
  }

  /** Puts the tool so its working point is at `p`. */
  private tipTo(t: Tool, p: P) {
    const tp = C.tip[t.id as keyof typeof C.tip];
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
    if (this.lightGlow) this.lightGlow.setVisible(false);
  }

  /** A tool that isn't for now: it hops back; Mom says so. */
  private wrongTool(t: Tool, needed: boolean) {
    this.shown.wrong = (this.shown.wrong as number) + 1;
    this.backToTray(t);
    boing(this, t.img, 0.15);
    sfx(this, 'squish', { volume: 0.6 });
    if (this.level === 2) this.say(needed ? 'vo-clinic-first' : 'vo-clinic-which', { ttlMs: 3000 });
    else this.say('vo-clinic-notyet', { ttlMs: 3000 });
    this.miss();
  }

  // ---------------------------------------------------------------- doing it

  /** How much a target needs (finger travel, or ms held). */
  private need(st: Station, t: Thing) {
    const k = this.L.k;
    const l = this.level - 1;
    if (st.by === 'rub') return (t.what === 'knee' || t.what === 'paw' ? T.rubOne[l] : T.rub[l]) * k;
    if (['mouth', 'forehead', 'nose', 'tummy', 'skin'].includes(t.what)) return T.holdMs[l];
    return T.timeMs[l];
  }

  /** The tool's working point moved to `tp` (by `dist`), `delta` ms passed: the station goes on. */
  private work(tool: Tool, tp: P, dist: number, delta: number) {
    const st = this.station;
    const v = this.cur;
    if (!st || !v || tool.id !== st.tool || this.phase !== 'tool' || this.zoomBusy) return;
    if (st.view !== 'body' && this.zoom?.id !== st.view) return;
    const k = this.L.k;
    const reach = T.reach * k;
    if (st.tool === 'light') this.lightAt(tp);
    switch (st.act) {
      case 'clean': {
        const gain = st.by === 'rub' ? dist : delta;
        if (gain <= 0) return;
        const r = st.by === 'rub' && (st.what === 'knee' || st.what === 'paw') ? reach * 1.4 : reach;
        const t = this.nearest(this.targets(), tp, r);
        if (!t) return;
        this.poke();
        t.hp += gain;
        const need = this.need(st, t);
        this.cleaning(st, t, tp, Math.min(1, t.hp / need), delta);
        if (t.hp >= need) this.thingDone(t);
        return;
      }
      case 'touch': {
        const t = this.nearest(this.targets(), tp, reach * 0.9);
        if (t) this.thingDone(t);
        return;
      }
      case 'drops': {
        const t = this.targets()[0];
        if (!t || !this.near(tp, this.worldOf(t), reach * 1.6)) return;
        this.poke();
        this.dripT += delta;
        if (this.dripT >= T.dripMs) {
          this.dripT = 0;
          this.drip(t, tp);
        }
        return;
      }
      case 'find':
        if (st.what === 'wheeze') return this.listenFind(tp, delta);
        if (dist > 0 || delta > 0) this.poke();
        if (st.tool === 'xray' && dist > 0) sfx(this, 'scan', { minGapMs: 1100, volume: 0.35 });
        for (const t of this.targets()) {
          if (!this.near(tp, this.worldOf(t), T.findR * k)) continue;
          t.hidden = false;
          this.tweens.killTweensOf(t.img);
          t.img.setAlpha(1);
          boing(this, t.img, 0.4);
          const w = this.worldOf(t);
          stars(this, w.x, w.y, 6, 34 * k);
          sfx(this, t.what === 'bell' ? 'jingle' : t.what === 'bug' || t.what === 'tickle' ? 'char-giggle' : 'star', { minGapMs: 0, volume: 0.7, rate: t.what === 'tickle' ? 1.7 : 1 });
          if (t.what === 'germ') this.germWiggle(t);
          this.shown.things = (this.shown.things as number) + 1;
        }
        if (!this.targets().length) this.stationDone();
        return;
      case 'pull':
        return this.pulling(st, tp);
      default:
    }
  }

  private nearest(list: Thing[], p: P, r: number): Thing | null {
    let best: Thing | null = null;
    let bd = r;
    for (const t of list) {
      const d = Phaser.Math.Distance.BetweenPoints(p, this.worldOf(t));
      if (d < bd) {
        bd = d;
        best = t;
      }
    }
    return best;
  }

  /** What she sees and hears while she cleans or holds a tool on a target (`u` how far it is, 0..1). */
  private cleaning(st: Station, t: Thing, tp: P, u: number, delta: number) {
    const k = this.L.k;
    const z = t.zoom ? this.zooms.get(t.zoom)! : null;
    const s = z ? z.s : 1;
    switch (t.what) {
      case 'germ': {
        // it wriggles and squeaks under the brush, shrinking; big chef: once half brushed it hops to another tooth
        t.img.setScale(rs(t.img.texture.key, t.base * s * (1 - 0.35 * u)));
        t.img.setAngle(Math.sin(this.time.now / 50) * 14);
        if (Math.random() < 0.3) this.bubble(tp.x + Phaser.Math.Between(-30, 30) * k, tp.y + Phaser.Math.Between(-20, 20) * k);
        sfx(this, 'brush', { minGapMs: 260, volume: 0.7 });
        sfx(this, 'squeak', { minGapMs: 700, volume: 0.35 });
        if (this.level === 2 && !t.dodged && u >= T.dodge && t.zoom === 'mouth') this.dodge(t);
        return;
      }
      case 'gnat': {
        // the spray tickles it: it buzzes and wobbles, then off it flies (big chef: once it hops to another place first)
        t.img.setAngle(Math.sin(this.time.now / 40) * 16);
        sfx(this, 'spray', { minGapMs: 520, volume: 0.5 });
        sfx(this, 'squeak', { minGapMs: 800, volume: 0.25, rate: 1.6 });
        if (Math.random() < delta / 60) burst(this, tp.x, tp.y, { texture: FX_SOFT, count: 2, tint: 0xd8f2d0, size: 44 * k, speed: 150 * k, gravityY: 60, lifespan: 500, depth: 60 });
        if (this.level === 2 && !t.dodged && u >= T.dodge) this.dodge(t);
        return;
      }
      case 'tickle':
        // the spray tickles the tickle: it wriggles, giggles and shrinks
        t.img.setScale(rs(t.img.texture.key, t.base * s * (1 - 0.4 * u)));
        t.img.setAngle(Math.sin(this.time.now / 45) * 16);
        sfx(this, 'spray', { minGapMs: 520, volume: 0.55 });
        sfx(this, 'char-giggle', { minGapMs: 900, volume: 0.3, rate: 1.8 });
        if (Math.random() < delta / 60) burst(this, tp.x, tp.y, { texture: FX_SOFT, count: 2, tint: 0xdff3fa, size: 40 * k, speed: 150 * k, gravityY: 60, lifespan: 500, depth: 60 });
        return;
      case 'mud':
        // the sponge foams it away: bubbles under the sponge, the mud fades
        t.img.setAlpha(1 - 0.85 * u);
        if (Math.random() < 0.35) this.bubble(tp.x + Phaser.Math.Between(-30, 30) * k, tp.y + Phaser.Math.Between(-20, 20) * k);
        sfx(this, 'brush', { minGapMs: 300, volume: 0.6 });
        if (Math.random() < 0.08) sfx(this, 'char-giggle', { minGapMs: 1500, rate: this.cur!.view.rate, volume: 0.45 });
        return;
      case 'foam':
      case 'food':
      case 'dirt':
        // the water washes it: it slides down and fades
        t.img.setAlpha(1 - 0.8 * u);
        if (t.zoom) t.img.y = (t.f.y - LENS / 2) * s + 30 * u * s;
        sfx(this, 'spray', { minGapMs: 520, volume: 0.6 });
        if (Math.random() < delta / 50) burst(this, tp.x, tp.y + 20 * k, { texture: FX_SOFT, count: 2, tint: 0xdff3fa, size: 44 * k, speed: 170 * k, gravityY: 160, lifespan: 500, depth: 60 });
        return;
      case 'tear':
      case 'wax':
        t.img.setAlpha(1 - 0.85 * u);
        t.img.setScale(rs(t.img.texture.key, t.base * s * (1 - 0.3 * u)));
        sfx(this, t.what === 'tear' ? 'squish' : 'brush', { minGapMs: 420, volume: 0.35 });
        if (Math.random() < 0.15) puff(this, tp.x, tp.y, t.what === 'tear' ? 0xdff3fa : 0xfff1c0, 2, 30 * k);
        return;
      case 'knee':
      case 'paw':
        // the cream goes on, rubbed in; it tickles
        z?.cream?.setAlpha(Math.min(0.95, u));
        sfx(this, 'squish', { minGapMs: 380, volume: 0.35 });
        this.wiggle();
        return;
      case 'listen':
        if (t.hp - delta <= 0) sfx(this, st.hear ?? 'heartbeat', { minGapMs: 300 });
        return;
      default:
        this.holdFeedback(st, tp, delta);
    }
  }

  /** Holding a tool on her: the thermometer ticks, the ice pack mists, the tissue, the warm bottle's hearts. */
  private holdFeedback(st: Station, tp: P, delta: number) {
    const k = this.L.k;
    const v = this.cur!;
    if (st.tool === 'thermometer' || st.tool === 'tissue') {
      if (v.view.mood !== 'expect') v.view.setMood('expect');
      if (Math.random() < delta / 380) sfx(this, 'tap', { volume: 0.25, minGapMs: 300, vary: false });
      return;
    }
    if (st.tool === 'icepack') {
      if (Math.random() < delta / 160) burst(this, tp.x, tp.y, { texture: FX_SOFT, count: 1, tint: 0xdff3fa, size: 40 * k, speed: 90 * k, gravityY: -60, lifespan: 700, depth: 60 });
      if (v.view.mood !== 'happy') v.view.setMood('happy');
      return;
    }
    if (st.tool === 'hotbottle') {
      if (Math.random() < delta / 260) burst(this, tp.x, tp.y - 50 * k, { texture: 'fx-heart', count: 1, tint: [0xf5a3b5, 0xf6c08a], size: 30 * k, speed: 80 * k, gravityY: -120, lifespan: 900, depth: 60 });
      sfx(this, 'gurgle', { minGapMs: 1800, volume: 0.25 });
    }
  }

  /** Big chef: a germ half brushed hops to another tooth, a gnat half sprayed to another place, giggling (once each). */
  private dodge(t: Thing) {
    const z = this.zooms.get(t.zoom!)!;
    const gnat = t.what === 'gnat';
    const places = gnat ? SPOTS.skin!.sting! : C.teeth.map(([x, y]) => ({ x, y }));
    const taken = this.things.filter((q) => q.zoom === t.zoom && !q.done && q !== t && q.what === t.what).map((q) => q.f);
    const free = places.filter((p) => !taken.some((q) => Math.hypot(q.x - p.x, q.y - p.y) < 50) && Math.hypot(p.x - t.f.x, p.y - t.f.y) > 60);
    t.dodged = true;
    if (!free.length) return;
    const to = Phaser.Utils.Array.GetRandom(free);
    t.f = gnat ? { x: to.x, y: to.y } : { x: to.x, y: to.y + (to.y < 270 ? -4 : 4) };
    t.hp = 0;
    const s = z.s;
    this.tweens.add({ targets: t.img, x: (t.f.x - LENS / 2) * s, y: (t.f.y - LENS / 2) * s, scale: rs(t.img.texture.key, t.base * s), duration: 420, ease: 'Quad.easeOut' });
    this.tweens.add({ targets: t.img, angle: 360, duration: 420 });
    sfx(this, 'char-giggle', { rate: 1.5, volume: 0.6 });
    if (!this.ranSaid) {
      this.ranSaid = true;
      this.say(gnat ? 'vo-bug-hop' : 'vo-germ-run', { ttlMs: 2500 });
    }
  }

  private germWiggle(t: Thing) {
    this.tweens.add({ targets: t.img, angle: { from: -14, to: 14 }, duration: 160, yoyo: true, repeat: 2, ease: 'Sine.easeInOut' });
  }

  /** The light in her hand lights up the ear around its tip. */
  private lightAt(tp: P) {
    const k = this.L.k;
    if (!this.lightGlow) {
      this.lightGlow = this.add.image(tp.x, tp.y, FX_SOFT).setTint(0xfff6c8).setBlendMode(Phaser.BlendModes.ADD).setDepth(35);
      this.lightGlow.setScale((260 * k) / this.lightGlow.frame.realWidth);
    }
    this.lightGlow.setVisible(true).setPosition(tp.x, tp.y).setAlpha(0.75);
  }

  /** A drop falls from the bottle's tip to the eye or the ear: a little splash, a drip; `n` of them and it is done. */
  private drip(t: Thing, tp: P) {
    const k = this.L.k;
    const st = this.station!;
    const at = this.worldOf(t);
    const d = this.add.image(tp.x, tp.y, 'water-drop').setScale(0.45 * k).setDepth(58);
    this.tweens.add({
      targets: d,
      x: at.x + Phaser.Math.Between(-20, 20) * k,
      y: at.y,
      duration: 260,
      ease: 'Quad.easeIn',
      onComplete: () => {
        d.destroy();
        sfx(this, 'drip', { minGapMs: 0, volume: 0.7 });
        burst(this, at.x, at.y, { texture: FX_SOFT, count: 4, tint: 0xbfe6f7, size: 34 * k, speed: 200 * k, gravityY: 300, lifespan: 420, depth: 58 });
        if (this.station !== st || t.done) return;
        t.drops++;
        this.cur?.view.setMood('happy');
        if (t.drops >= this.count(st)) this.thingDone(t);
      },
    });
  }

  /** Big chef's cough: listen until the wheezy spot is found (it grows louder nearer, and a ring shows it too). */
  private listenFind(tp: P, delta: number) {
    const v = this.cur!;
    const k = this.L.k;
    const t = this.targets()[0];
    if (!t) return;
    const at = v.view.at(t.f);
    const d = Math.hypot(tp.x - at.x, tp.y - at.y);
    const mid = v.view.at(v.p.chest[0]);
    if (Math.hypot(tp.x - mid.x, tp.y - mid.y) > 300 * v.view.scale + 60 * k) return;
    this.poke();
    const now = this.time.now;
    if (now - this.lastHear > 900) {
      this.lastHear = now;
      const near = Phaser.Math.Clamp(1 - d / (T.hearR * k), 0, 1);
      if (near > 0.05) sfx(this, 'wheeze', { minGapMs: 0, volume: 0.15 + 0.85 * near });
      else sfx(this, 'heartbeat', { minGapMs: 0, volume: 0.4 });
      const ring = this.add.image(tp.x, tp.y, 'fx-ring').setDepth(58).setTint(near > 0.05 ? 0x8ec3db : 0xf5a3b5).setAlpha(0.25 + 0.65 * near);
      const r0 = (60 * k) / ring.frame.realWidth;
      ring.setScale(r0);
      this.tweens.add({ targets: ring, scale: r0 * (1.6 + 2.6 * near), alpha: 0, duration: 700, ease: 'Quad.easeOut', onComplete: () => ring.destroy() });
    }
    if (d < T.wheezeR * k) {
      t.hp += delta;
      if (t.hp >= T.timeMs[this.level - 1]) {
        t.hidden = false;
        this.thingDone(t);
      }
    }
  }

  /** Taking it out: the tweezers grip the speck, the ladybird, the splinter (the magnet catches the bell), drawn out. */
  private pulling(st: Station, tp: P) {
    const k = this.L.k;
    const mag = st.tool === 'magnet';
    if (!this.gripped) {
      const t = this.nearest(this.targets(), tp, mag ? T.magnetR * k : T.reach * k * 0.85);
      if (!t) return;
      this.gripped = t;
      this.gripAt = { ...tp };
      sfx(this, mag ? 'zing' : 'click', { volume: mag ? 0.7 : 1 });
      boing(this, t.img, 0.2);
      t.img.setAlpha(1);
      this.poke();
      if (t.what === 'bug') sfx(this, 'char-giggle', { rate: 1.6, volume: 0.6 });
      return;
    }
    const t = this.gripped;
    const z = t.zoom ? this.zooms.get(t.zoom)! : null;
    const out = Math.hypot(tp.x - this.gripAt!.x, tp.y - this.gripAt!.y);
    if (z) t.img.setPosition(tp.x - z.box.x, tp.y - z.box.y);
    if (mag && Math.random() < 0.15) sfx(this, 'jingle', { minGapMs: 700, volume: 0.35 });
    if (out >= (mag ? T.magnetPull : T.pull) * k) {
      this.gripped = null;
      this.thingDone(t, tp);
    }
  }

  /** One thing done: it pops, washes off, shines, flies away... (and when all are done, the station is). */
  private thingDone(t: Thing, at?: P) {
    const k = this.L.k;
    const v = this.cur!;
    const st = this.station!;
    t.done = true;
    this.shown.things = (this.shown.things as number) + 1;
    const w = at ?? this.worldOf(t);
    const z = t.zoom ? this.zooms.get(t.zoom)! : null;
    const s = z ? z.s : 1;
    this.poke();
    this.reveal(t);
    switch (t.what) {
      case 'gnat':
        // off it flies, buzzing, home out of the window
        sfx(this, 'whoosh', { minGapMs: 0, volume: 0.5 });
        sfx(this, 'char-giggle', { minGapMs: 0, rate: 1.8, volume: 0.45 });
        if (z) {
          const img = t.img;
          z.box.remove(img);
          this.add.existing(img);
          img.setPosition(w.x, w.y).setDepth(70).setScale(rs('clinic-gnat', 0.8 * s));
          this.tweens.add({ targets: img, x: w.x + Phaser.Math.Between(-200, 200) * k, y: -90 * k, angle: Phaser.Math.Between(-40, 40), duration: 1100, ease: 'Sine.easeIn', onComplete: () => img.destroy() });
        }
        stars(this, w.x, w.y, 4, 28 * k);
        break;
      case 'sting':
        sfx(this, 'pop');
        stars(this, w.x, w.y, 6, 32 * k);
        this.tweens.add({ targets: t.img, alpha: 0, y: t.img.y - 60 * k, angle: 40, duration: 450 });
        if (Math.random() < 0.5) sfx(this, 'char-wow', { minGapMs: 1200, rate: v.view.rate, volume: 0.5 });
        break;
      case 'bite': {
        // a dab of cream on it, and the itch goes
        const dab = new Phaser.GameObjects.Image(this, t.img.x, t.img.y, 'clinic-cream').setScale(rs('clinic-cream', 0.45 * s)).setAlpha(0.95);
        z?.box.addAt(dab, z.box.length - 1);
        boing(this, dab, 0.2);
        this.tweens.add({ targets: t.img, alpha: 0, duration: 400 });
        this.tweens.add({ targets: dab, alpha: 0, duration: 600, delay: 900, onComplete: () => dab.destroy() });
        burst(this, w.x, w.y, { texture: 'fx-heart', count: 3, tint: [0xf06a8a, 0xf5a3b5], size: 28 * k, speed: 180 * k, gravityY: -100, lifespan: 700, depth: 60 });
        sfx(this, 'squish', { minGapMs: 0, volume: 0.45 });
        break;
      }
      case 'mud':
        this.tweens.add({ targets: t.img, alpha: 0, duration: 260 });
        for (let i = 0; i < 4; i++) this.bubble(w.x + Phaser.Math.Between(-40, 40) * k, w.y + Phaser.Math.Between(-30, 20) * k);
        sfx(this, 'pop', { minGapMs: 0, volume: 0.45 });
        break;
      case 'foam':
        this.tweens.add({ targets: t.img, alpha: 0, duration: 300 });
        sfx(this, 'sparkle', { minGapMs: 200, volume: 0.6 });
        stars(this, w.x, w.y, 5, 30 * k);
        break;
      case 'germ':
        // pop! into bubbles
        sfx(this, 'eek', { minGapMs: 0, volume: 0.8 });
        this.tweens.killTweensOf(t.img);
        this.tweens.add({ targets: t.img, scale: t.img.scale * 1.5, alpha: 0, angle: 30, duration: 220, ease: 'Quad.easeOut' });
        for (let i = 0; i < 6; i++) this.bubble(w.x + Phaser.Math.Between(-50, 50) * k, w.y + Phaser.Math.Between(-40, 30) * k);
        stars(this, w.x, w.y, 5, 30 * k);
        break;
      case 'food':
      case 'dirt':
        this.tweens.add({ targets: t.img, alpha: 0, y: t.img.y + 50 * s, duration: 300 });
        sfx(this, 'pop', { minGapMs: 0, volume: 0.45 });
        stars(this, w.x, w.y, 4, 28 * k);
        break;
      case 'tear':
      case 'wax':
        this.tweens.add({ targets: t.img, alpha: 0, scale: t.img.scale * 0.5, duration: 260 });
        sfx(this, 'pop', { minGapMs: 0, volume: 0.45 });
        stars(this, w.x, w.y, 4, 28 * k);
        break;
      case 'hole': {
        // a star fills it
        const star = new Phaser.GameObjects.Image(this, t.img.x, t.img.y, 'tooth-star').setScale(0);
        z!.box.addAt(star, z!.box.length - 1);
        this.tweens.add({ targets: star, scale: rs('tooth-star', 0.75 * s), duration: 320, ease: 'Back.easeOut' });
        this.tweens.add({ targets: t.img, alpha: 0, duration: 200 });
        sfx(this, 'sparkle', { minGapMs: 0 });
        stars(this, w.x, w.y, 7, 34 * k);
        break;
      }
      case 'tickle': {
        // off it floats in a bubble, giggling
        sfx(this, 'pop', { minGapMs: 0, volume: 0.5 });
        sfx(this, 'char-giggle', { minGapMs: 0, rate: 1.8, volume: 0.45 });
        this.tweens.killTweensOf(t.img);
        this.tweens.add({ targets: t.img, y: t.img.y - 120 * s, alpha: 0, scale: t.img.scale * 0.6, angle: 30, duration: 700, ease: 'Sine.easeOut' });
        for (let i = 0; i < 4; i++) this.bubble(w.x + Phaser.Math.Between(-30, 30) * k, w.y + Phaser.Math.Between(-30, 10) * k);
        stars(this, w.x, w.y, 4, 28 * k);
        break;
      }
      case 'burn': {
        // a dab of cool aloe: the red glow fades
        const dab = v.view.put('clinic-cream', t.f, 0.4).setAlpha(0.95).setTint(0xbfe8a8);
        boing(this, dab, 0.2);
        this.tweens.add({ targets: t.img, alpha: 0, duration: 700 });
        this.tweens.add({ targets: dab, alpha: 0, duration: 600, delay: 900, onComplete: () => dab.destroy() });
        burst(this, w.x, w.y, { texture: FX_SOFT, count: 4, tint: [0xdff3fa, 0xc8ebb8], size: 34 * k, speed: 140 * k, gravityY: -60, lifespan: 700, depth: 60 });
        sfx(this, 'squish', { minGapMs: 0, volume: 0.45 });
        sfx(this, 'sparkle', { minGapMs: 200, volume: 0.4 });
        v.view.setMood('happy');
        break;
      }
      case 'spot': {
        const dab = v.view.put('clinic-cream', t.f, 0.42).setAlpha(0.95);
        boing(this, dab, 0.2);
        this.tweens.add({ targets: t.img, alpha: 0, scale: t.img.scale * 0.5, duration: 300 });
        this.tweens.add({ targets: dab, alpha: 0, duration: 600, delay: 900, onComplete: () => dab.destroy() });
        burst(this, w.x, w.y, { texture: 'fx-heart', count: 4, tint: [0xf06a8a, 0xf5a3b5], size: 30 * k, speed: 200 * k, gravityY: -100, lifespan: 700, depth: 60 });
        sfx(this, 'squish', { minGapMs: 0, volume: 0.45 });
        sfx(this, 'pop', { minGapMs: 0, volume: 0.4 });
        if (Math.random() < 0.4) sfx(this, 'char-giggle', { minGapMs: 1200, rate: v.view.rate, volume: 0.5 });
        break;
      }
      case 'listen':
        this.tweens.add({ targets: t.img, alpha: 0, duration: 260 });
        burst(this, w.x, w.y, { texture: 'fx-heart', count: 5, tint: [0xf06a8a, 0xf5a3b5], size: 34 * k, speed: 220 * k, gravityY: -100, lifespan: 800, depth: 60 });
        sfx(this, 'pop', { volume: 0.5 });
        break;
      case 'wheeze':
        stars(this, w.x, w.y, 7, 36 * k);
        sfx(this, 'star');
        burst(this, w.x, w.y, { texture: 'fx-heart', count: 6, tint: [0xf06a8a, 0xf5a3b5], size: 34 * k, speed: 220 * k, gravityY: -100, lifespan: 800, depth: 60 });
        break;
      case 'bug':
        // out it comes, and flies away home (out of the window, up and away)
        sfx(this, 'whoosh', { minGapMs: 0, volume: 0.6 });
        if (z) {
          const img = t.img;
          z.box.remove(img);
          this.add.existing(img);
          img.setPosition(w.x, w.y).setDepth(70).setScale(rs('ear-bug', 0.62 * s));
          this.tweens.add({ targets: img, x: this.L.W * 0.3, y: -80 * k, angle: -30, duration: 1300, ease: 'Sine.easeIn', onComplete: () => img.destroy() });
          this.tweens.add({ targets: img, scaleX: img.scaleX * 0.8, duration: 90, yoyo: true, repeat: 7 });
        }
        stars(this, w.x, w.y, 6, 34 * k);
        break;
      case 'speck':
      case 'splinter':
      case 'bell':
        sfx(this, t.what === 'bell' ? 'jingle' : 'pop');
        stars(this, w.x, w.y, 7, 36 * k);
        this.tweens.add({ targets: t.img, alpha: 0, y: t.img.y - 60 * k, angle: 40, duration: 500 });
        break;
      case 'knee':
      case 'paw':
        stars(this, w.x, w.y, 6, 34 * k);
        sfx(this, 'star', { volume: 0.6 });
        break;
      case 'skin':
        // the ice pack: cool mist, the arm feels better
        stars(this, w.x, w.y, 6, 34 * k);
        sfx(this, 'sparkle', { minGapMs: 0, volume: 0.6 });
        v.view.setMood('happy');
        break;
      case 'eye':
      case 'ear':
        // the drops are in: the eye's redness goes
        if (z) for (const g of z.sore) this.tweens.add({ targets: g, alpha: 0, duration: 700 });
        stars(this, w.x, w.y, 7, 36 * k);
        sfx(this, 'sparkle', { minGapMs: 0 });
        break;
      default:
        // a place on her: the thermometer beeps, the tissue honks...
        if (st.tool === 'thermometer') {
          v.view.setMood('rest');
          sfx(this, 'beep');
        } else if (st.tool === 'tissue') {
          v.view.setMood('happy');
          sfx(this, 'honk');
          boing(this, v.view.box, 0.08);
          const nose = (v.signs.get(v.a.id) ?? []).filter((g) => g.texture.key === 'clinic-cheek' || g.texture.key === 'clinic-sweat');
          if (nose.length) this.tweens.add({ targets: nose, alpha: 0, duration: 500 });
        } else if (st.tool === 'icepack') {
          const sweat = this.allSigns(v).find((g) => g.texture.key === 'clinic-sweat');
          if (sweat) this.tweens.add({ targets: sweat, alpha: 0, duration: 400 });
          sfx(this, 'sparkle', { minGapMs: 0, volume: 0.6 });
        } else stars(this, w.x, w.y, 5, 30 * k);
    }
    if (!this.targets().length && !this.things.some((q) => q.what === st.what && q.zoom === t.zoom && !q.done && !q.hidden)) this.stationDone();
    else if (Math.random() < 0.35) v.view.react('giggle');
  }

  /** A thing gone shows what waited under it (the bump under the sting, the soap where the mud was). */
  private reveal(t: Thing) {
    for (const u of this.things) {
      if (!u.waiting || u.zoom !== t.zoom || u.f !== t.f) continue;
      u.waiting = false;
      this.tweens.add({ targets: u.img, alpha: 1, duration: 300, delay: 120 });
    }
  }

  private wiggle() {
    const z = this.zoom;
    if (!z || this.level !== 2) return;
    z.box.x = z.at.x + Math.sin(this.time.now / 260) * 14 * this.L.k;
    if (Math.random() < 0.02) sfx(this, 'char-giggle', { minGapMs: 1400, rate: this.cur!.view.rate, volume: 0.5 });
  }

  private bubble(x: number, y: number) {
    const k = this.L.k;
    const b = this.add.image(x, y, 'bubble').setScale(0).setDepth(55).setAlpha(0.9);
    this.tweens.add({ targets: b, scale: Phaser.Math.FloatBetween(0.15, 0.3) * k, duration: 200, ease: 'Back.easeOut' });
    this.tweens.add({ targets: b, y: y - Phaser.Math.Between(30, 90) * k, alpha: 0, duration: 1100, delay: 300, onComplete: () => b.destroy() });
  }

  /** A tool brought to its place (the medicine spoon, a drink, the plaster): once. */
  private give(t: Tool) {
    const st = this.station!;
    const v = this.cur!;
    const k = this.L.k;
    const thing = this.targets()[0];
    const tg = thing ? this.worldOf(thing) : v.view.mouthAt;
    this.setPhase('intro');
    this.poke();
    if (st.tool === 'hat') {
      // the sun hat goes on her head and stays there (like the plaster)
      t.away = true;
      this.tweens.killTweensOf(t.img);
      t.img.setVisible(false);
      const f = { x: v.p.forehead.x, y: v.p.forehead.y - 70 };
      const hat = v.view.put('tool-hat', f, 1.3, -6);
      boing(this, hat, 0.25);
      sfx(this, 'pop');
      sfx(this, 'sparkle', { minGapMs: 0, volume: 0.6 });
      const at = v.view.at(f);
      stars(this, at.x, at.y, 7, 36 * k);
      v.view.react('love');
      if (thing) thing.done = true;
      this.time.delayedCall(700, () => this.stationDone());
      return;
    }
    if (st.tool === 'plaster') {
      t.away = true;
      this.tweens.killTweensOf(t.img);
      t.img.setVisible(false);
      const z = this.zoom;
      if (z && thing) {
        const p = new Phaser.GameObjects.Image(this, thing.img.x, thing.img.y, 'tool-plaster').setScale(1.15 * z.s).setAngle(-6);
        z.box.addAt(p, z.box.length - 1);
        boing(this, p, 0.2);
        for (const g of z.sore) this.tweens.add({ targets: g, alpha: 0.25, duration: 400 });
      }
      sfx(this, 'sticky');
      stars(this, tg.x, tg.y, 6, 34 * k);
      if (thing) thing.done = true;
      this.time.delayedCall(600, () => this.stationDone());
      return;
    }
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
      if (thing) thing.done = true;
      this.stationDone();
    });
  }

  /** A station done: a little sparkle, then the next one (little chef) or her choice (big chef), or "All better!". */
  private stationDone() {
    const st = this.station!;
    const v = this.cur!;
    if (this.doneSt[this.si]) return;
    this.doneSt[this.si] = true;
    this.shown.stations = (this.shown.stations as number) + 1;
    this.setPhase('intro');
    this.gripped = null;
    this.lightGlow?.setVisible(false);
    const held = this.held;
    if (held) {
      this.held = null;
      this.owner = null;
      if (!held.tool.away && this.tools.includes(held.tool)) this.backToTray(held.tool);
    }
    for (const t of this.tools) if (!t.away && t.id === st.tool && t.img.y !== t.home.y && !this.tweens.isTweening(t.img)) this.backToTray(t);
    if (v.view.mood === 'expect') v.view.setMood('rest');
    // (a tool not needed any more goes from the tray: what is left is what is still to do)
    if (!this.steps.some((q, i) => !this.doneSt[i] && q.tool === st.tool)) {
      const t = this.toolOf(st.tool);
      if (t) {
        t.away = true;
        this.tweens.add({ targets: [t.img, t.slot, t.glow], alpha: 0.0, scale: 0, duration: 300, delay: 500 });
      }
    }
    if (st.after) this.say(st.after, { ttlMs: 4000 });
    this.mom?.happy();
    this.time.delayedCall(700, () => this.mom?.rest());
    this.revealPlaces();
    const next = this.firstOpen();
    if (next < 0) return this.time.delayedCall(st.after ? 1300 : 600, () => !this.leaving && this.cur === v && this.problemDone());
    this.time.delayedCall(st.after ? 1500 : 700, () => this.startStation(next));
  }

  // ---------------------------------------------------------------- all better, a sticker, back to the bench

  // ---------------------------------------------------------------- next door: the care room (round 5, part 2)

  /** Her problems are fixed: a little cheer, "Now, let's go next door!", and the screen slides to her own care room. */
  private startCare(v: Visitor) {
    if (this.leaving || this.cur !== v) return;
    const k = this.L.k;
    this.setPhase('intro');
    for (const t of this.things) if (!t.zoom && t.img.active) this.tweens.add({ targets: t.img, alpha: 0, duration: 400 });
    sfx(this, 'sparkle', { minGapMs: 0 });
    const head = v.view.at({ x: 300, y: 200 });
    stars(this, head.x, head.y, 8, 44 * k);
    v.view.react('love');
    this.mom?.happy();
    let gone = false;
    const go = () => {
      if (gone || this.leaving || this.cur !== v) return;
      gone = true;
      this.slideTo(v);
    };
    this.time.delayedCall(700, () => this.say('vo-care-go', { ttlMs: 4000, done: () => this.time.delayedCall(150, go) }));
    this.time.delayedCall(4200, go);
  }

  /** What the care room borrows from the scene. */
  private careHost(v: Visitor): CareHost {
    const self = this;
    const r = this.room;
    return {
      scene: this,
      L: this.L,
      S: this.S,
      level: this.level,
      area: { x0: r.x0, x1: r.x1, zoom: r.zoom },
      patient: v.p,
      view: v.view,
      as: v.as,
      hand: this.hand,
      shown: this.shown,
      say: (key, opts) => self.say(key, opts),
      begin: (p, line) => self.begin(p, line),
      setPhase: (p) => self.setPhase(p),
      phase: () => self.phase,
      poke: () => self.poke(),
      miss: () => self.miss(),
      hintNow: () => self.hintNow(),
      helped: () => self.helped(),
      own: (p) => self.own(p),
      mom: () => self.mom,
      done: () => !self.leaving && self.cur === v && self.better(),
    };
  }

  /**
   * The slide next door, like "Doctor Games for kids": the treatment room moves out to the left, the care room comes in
   * from the right (`TUNING.care.slideMs`), and the patient goes along to her place in it.
   */
  private slideTo(v: Visitor) {
    const L = this.L;
    const ms = TUNING.care.slideMs;
    this.closeZoom();
    this.clearTray();
    const care = new ClinicCare(this.careHost(v));
    this.care = care;
    this.careRoom = care.build(L.W);
    sfx(this, 'whoosh', { volume: 0.6 });
    const moving = [...this.treatRoom, ...this.careRoom].filter((o) => (o as Phaser.GameObjects.Image).active);
    this.tweens.add({ targets: moving, x: `-=${L.W}`, duration: ms, ease: 'Sine.easeInOut' });
    v.view.moveTo(care.spot, ms);
    this.shown.room = 'slide';
    this.time.delayedCall(ms + 30, () => {
      if (this.leaving || this.cur !== v || this.care !== care) return;
      for (const o of this.treatRoom) {
        const im = o as Phaser.GameObjects.Image;
        this.tweens.killTweensOf(im);
        im.setVisible(false).setX(im.x + L.W);
      }
      for (const o of this.careRoom) this.tweens.killTweensOf(o);
      this.shown.room = 'care';
      care.start();
    });
  }

  /** Back to the waiting room (a door): the care room goes at once, the treatment room is back in its place. */
  private leaveCare() {
    if (!this.care) return;
    this.care.destroy();
    this.care = null;
    this.careRoom = [];
    const W = this.L.W;
    for (const o of this.treatRoom) {
      const im = o as Phaser.GameObjects.Image;
      this.tweens.killTweensOf(im);
      // (where it slid out from: the backdrop at the middle, the bed at its own x)
      if (im.x < 0) im.setX(im.x + W);
    }
  }

  private better() {
    const v = this.cur!;
    const L = this.L;
    const k = L.k;
    this.setPhase('intro');
    this.closeZoom();
    this.clearTray();
    for (const t of this.things) if (!t.zoom && t.img.active) this.tweens.add({ targets: t.img, alpha: 0, duration: 400 });
    // every sign left goes (each problem's own went as it was fixed; a plaster stays on a knee or a hand)
    for (const g of this.allSigns(v)) this.tweens.add({ targets: g, alpha: 0, duration: 500, onComplete: () => g.destroy() });
    v.signs.clear();
    this.time.delayedCall(450, () => {
      sfx(this, 'cheer-jingle');
      music.party();
      const head = v.view.at({ x: 300, y: 200 });
      stars(this, head.x, head.y, 10, 54 * k);
      confetti(this, head.x, L.Y(220), 16, 24 * k);
      v.view.cheer();
      this.mom?.cheer();
      this.time.delayedCall(700, () => this.dance(v));
      this.say('vo-clinic-better', { ttlMs: 4000, done: () => this.time.delayedCall(300, () => this.startSticker()) });
    });
  }

  /** Better now: each patient's own happy move (the turtle spins, the penguin slides, the giraffe sways, Pipa rolls). */
  private dance(v: Visitor) {
    if (this.leaving || this.cur !== v) return;
    const box = v.view.box;
    const r = v.view.rest;
    const s = v.view.scale;
    const back = () => box.setAngle(0).setPosition(r.x, r.y).setScale(s);
    this.tweens.killTweensOf(box);
    back();
    sfx(this, 'char-yay', { rate: v.view.rate, volume: 0.7 });
    switch (v.p.id) {
      case 'turtle':
        this.tweens.add({ targets: box, angle: 360, duration: 900, ease: 'Sine.easeInOut', onComplete: back });
        break;
      case 'penguin':
        this.tweens.add({ targets: box, x: { from: r.x - 40 * s, to: r.x + 40 * s }, angle: { from: -10, to: 10 }, duration: 220, yoyo: true, repeat: 2, ease: 'Sine.easeInOut', onComplete: back });
        break;
      case 'giraffe':
        this.tweens.add({ targets: box, angle: { from: -7, to: 7 }, duration: 300, yoyo: true, repeat: 2, ease: 'Sine.easeInOut', onComplete: back });
        break;
      // the children (round 4): Lily twirls, Leo jumps for joy, Mia bounces, Sam wiggles
      case 'lily':
        this.tweens.add({ targets: box, scaleX: { from: s, to: -s }, duration: 260, yoyo: true, repeat: 1, ease: 'Sine.easeInOut', onComplete: back });
        this.tweens.add({ targets: box, y: r.y - 30 * s, duration: 260, yoyo: true, repeat: 1, ease: 'Quad.easeOut' });
        break;
      case 'leo':
        this.tweens.add({ targets: box, y: r.y - 90 * s, duration: 240, yoyo: true, repeat: 1, ease: 'Quad.easeOut', onComplete: back });
        break;
      case 'mia':
        this.tweens.add({ targets: box, y: r.y - 40 * s, scaleY: s * 1.04, duration: 160, yoyo: true, repeat: 3, ease: 'Quad.easeOut', onComplete: back });
        break;
      case 'sam':
        this.tweens.add({ targets: box, angle: { from: -9, to: 9 }, x: { from: r.x - 20 * s, to: r.x + 20 * s }, duration: 180, yoyo: true, repeat: 3, ease: 'Sine.easeInOut', onComplete: back });
        break;
      // round 5: Mittens stretches with her back arched, Bao rolls back and forth, Clover hops three times high, Biscuit
      // wags all over; Ruby spins on her heel, Noah star-jumps, Zoe waves and turns, Max jumps with his arms up
      case 'cat':
        this.tweens.add({ targets: box, scaleY: s * 1.1, scaleX: s * 0.92, duration: 300, yoyo: true, repeat: 1, ease: 'Sine.easeInOut', onComplete: back });
        break;
      case 'panda':
        this.tweens.add({ targets: box, angle: { from: -22, to: 22 }, duration: 340, yoyo: true, repeat: 1, ease: 'Sine.easeInOut', onComplete: back });
        break;
      case 'bunny':
        this.tweens.add({ targets: box, y: r.y - 110 * s, duration: 200, yoyo: true, repeat: 2, ease: 'Quad.easeOut', onComplete: back });
        break;
      case 'puppy':
        this.tweens.add({ targets: box, angle: { from: -7, to: 7 }, x: { from: r.x - 26 * s, to: r.x + 26 * s }, duration: 110, yoyo: true, repeat: 5, ease: 'Sine.easeInOut', onComplete: back });
        break;
      case 'ruby':
        this.tweens.add({ targets: box, scaleX: { from: s, to: -s }, duration: 200, yoyo: true, repeat: 2, ease: 'Sine.easeInOut', onComplete: back });
        break;
      case 'noah':
        this.tweens.add({ targets: box, y: r.y - 80 * s, scaleX: s * 1.14, duration: 220, yoyo: true, repeat: 1, ease: 'Quad.easeOut', onComplete: back });
        break;
      case 'zoe':
        this.tweens.add({ targets: box, angle: { from: -8, to: 8 }, duration: 180, yoyo: true, repeat: 1, ease: 'Sine.easeInOut' });
        this.tweens.add({ targets: box, scaleX: { from: s, to: -s }, duration: 260, yoyo: true, delay: 720, ease: 'Sine.easeInOut', onComplete: back });
        break;
      case 'max':
        this.tweens.add({ targets: box, y: r.y - 100 * s, scaleY: s * 1.06, duration: 230, yoyo: true, repeat: 2, ease: 'Quad.easeOut', onComplete: back });
        break;
      default:
        this.tweens.add({ targets: box, y: r.y - 70 * s, duration: 260, yoyo: true, repeat: 1, ease: 'Quad.easeOut' });
        this.tweens.add({ targets: box, angle: 360, duration: 1040, ease: 'Sine.easeInOut', onComplete: back });
    }
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
    const f = v.p.id === 'giraffe' ? { x: 300, y: 610 } : v.p.chest[0];
    const to = v.view.at(f);
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
    if (this.leaving || v.done) return;
    v.done = true;
    this.shown.treated = (this.shown.treated as number) + 1;
    this.through(() => {
      this.cur = null;
      this.leaveCare();
      for (const z of this.zooms.values()) z.box.destroy();
      this.zooms = new Map();
      this.zoom = null;
      for (const t of this.things) if (!t.zoom && t.img.active) t.img.destroy();
      this.things = [];
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
    this.setPhase('done');
    this.shown.done = true;
    for (const v of this.visit) v.view.setMood('happy');
    this.say('vo-clinic-photo', {
      ttlMs: 5000,
      done: () => this.time.delayedCall(300, () => this.snap()),
    });
  }

  private snap() {
    if (this.leaving) return;
    const L = this.L;
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
  }

  /** The photo in the clinic's frame, kept in the memory book; the cheer, the line, bye bye, back to the title. */
  private framePhoto(src: HTMLImageElement | null) {
    const L = this.L;
    const k = L.k;
    const W = C.photoWindow;
    // (on the wall above the bench, big, clear of the patients' heads)
    const s = Math.min(0.7 * k, (L.H * 0.6) / 780);
    const at = { x: (L.m + this.S.momFace.x0) / 2, y: 30 * k + 390 * s };
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
    const tp = C.tip[id as keyof typeof C.tip];
    return { key: `tool-${id}`, scale: s, dx: (120 - tp.x) * s, dy: (120 - tp.y) * s, alpha };
  }

  /** The keyframes of the current station over what is left (`from` ms on): rub circles, holds, touches, a pull. */
  private path(st: Station, from: number, all: boolean): HandKey[] {
    const k = this.L.k;
    const list = this.targets().slice(0, all ? undefined : 1);
    if (!list.length) return [];
    const keys: HandKey[] = [];
    let t = from;
    const circle = (c: P, r: number, loops: number, ms: number) => {
      const n = 8 * loops;
      for (let i = 0; i <= n; i++) {
        const a = (i / 8) * Math.PI * 2;
        keys.push({ x: c.x + Math.cos(a) * r, y: c.y + Math.sin(a) * r * 0.6, t: t + (ms * i) / n });
      }
      t += ms;
    };
    for (const th of list) {
      const p = this.worldOf(th);
      keys.push({ ...p, t });
      t += 350;
      switch (st.act) {
        case 'clean':
          if (st.by === 'rub') circle(p, 34 * k, all ? Math.ceil(this.need(st, th) / (2 * Math.PI * 34 * k * 0.8)) + 1 : 2, all ? 1400 : 1000);
          else {
            keys.push({ ...p, t: t + this.need(st, th) + 150 });
            t += this.need(st, th) + 150;
          }
          break;
        case 'drops':
          keys.push({ ...p, t: t + T.dripMs * (this.count(st) + 1) });
          t += T.dripMs * (this.count(st) + 1);
          break;
        case 'pull':
          keys.push({ ...p, t: t + 250 }, { x: p.x + 200 * k, y: p.y - 200 * k, t: t + 1050 });
          t += 1100;
          break;
        case 'find':
          if (st.what === 'wheeze') {
            keys.push({ x: p.x - 80 * k, y: p.y, t: t + 300 }, { x: p.x + 60 * k, y: p.y, t: t + 700 }, { ...p, t: t + 1100 }, { ...p, t: t + 1100 + T.timeMs[1] + 200 });
            t += 1300 + T.timeMs[1];
          } else {
            keys.push({ x: p.x - 140 * k, y: p.y + 80 * k, t: t + 300 }, { x: p.x + 100 * k, y: p.y - 60 * k, t: t + 800 }, { ...p, t: t + 1200 });
            t += 1300;
          }
          break;
        default:
          keys.push({ ...p, t: t + 250 });
          t += 300;
      }
    }
    return keys;
  }

  protected way(): HandMotion | null {
    const k = this.L.k;
    switch (this.phase) {
      case 'care':
        return this.care?.way() ?? null;
      case 'pick': {
        const v = this.visit.find((q) => !q.done);
        return v ? tapMotion(v.view.at({ x: 300, y: 420 }), k) : null;
      }
      case 'sticker': {
        const s = this.stickers[0];
        return s ? tapMotion({ x: s.x, y: s.y }, k) : null;
      }
      case 'problem': {
        const q = this.problems[this.nextProblem()];
        return q ? tapMotion(q.at, k) : null;
      }
      case 'tool': {
        const st = this.station;
        const t = st && this.toolOf(st.tool);
        if (!st || !t) return null;
        // (big chef, a close-up still to open: the hand shows which tool, then where on her)
        const tg = this.target() ?? (st.view !== 'body' ? this.room.zoom.at : null);
        if (!tg) return null;
        const home = t.home;
        const tp = C.tip[t.id as keyof typeof C.tip];
        const s = this.room.toolS;
        const start = { x: home.x + (tp.x - 120) * s, y: home.y + (tp.y - 120) * s };
        const ready = st.view === 'body' || this.zoom?.id === st.view;
        const keys: HandKey[] = [{ ...start, t: 0 }, { ...start, t: 300 }, { ...tg, t: 1200 }, ...(ready ? this.path(st, 1300, false) : [])];
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
      case 'care':
        return this.care?.help() ?? false;
      case 'pick': {
        const v = this.visit.find((q) => !q.done);
        if (!v) return false;
        this.hand.play(tapMotion(v.view.at({ x: 300, y: 420 }), k));
        this.time.delayedCall(650, () => (this.helped(), this.callIn(v)));
        return true;
      }
      case 'sticker': {
        const s = this.stickers[0];
        if (!s) return false;
        this.hand.play(tapMotion({ x: s.x, y: s.y }, k));
        this.time.delayedCall(650, () => (this.helped(), this.giveSticker(s)));
        return true;
      }
      case 'problem': {
        const i = this.nextProblem();
        const q = this.problems[i];
        if (!q) return false;
        this.hand.play(tapMotion(q.at, k));
        this.time.delayedCall(650, () => (this.helped(), this.phase === 'problem' && this.startProblem(i)));
        return true;
      }
      case 'tool':
        return this.helpTool();
      default:
        return false;
    }
  }

  /** Mom's hand takes the tool and does the station with it (the real tool, the real progress), then it is hers again. */
  private helpTool(): boolean {
    const st = this.station;
    const t = st && this.toolOf(st.tool);
    if (!st || !t) return false;
    const si = this.si;
    // (big chef: the station's close-up first)
    if (st.view !== 'body' && this.zoom?.id !== st.view) {
      this.viewFor(st, () => this.si === si && this.phase === 'tool' && this.runHelp(st, t, si));
      this.hand.follow('grab', () => ({ x: t.img.x, y: t.img.y }));
      return true;
    }
    if (st.view === 'body' && this.zoom) {
      this.viewFor(st, () => this.si === si && this.phase === 'tool' && this.runHelp(st, t, si));
      this.hand.follow('grab', () => ({ x: t.img.x, y: t.img.y }));
      return true;
    }
    return this.runHelp(st, t, si);
  }

  private runHelp(st: Station, t: Tool, si: number): boolean {
    const k = this.L.k;
    if (!this.targets().length) {
      this.helped();
      if (st.act === 'give') this.give(t);
      else this.stationDone();
      return true;
    }
    this.tweens.killTweensOf(t.img);
    t.img.setDepth(600);
    this.tweens.add({ targets: t.img, scale: this.room.toolS, angle: 0, duration: 200 });
    this.hand.follow('grab', () => ({ x: t.img.x, y: t.img.y }));
    const start = this.tip(t);
    const keys = [{ ...start, t: 0 }, ...this.path(st, T.helpMs, true)];
    const total = Math.min(13000, keys[keys.length - 1].t + 200);
    let last = start;
    let tPrev = 0;
    this.tweens.addCounter({
      from: 0,
      to: total,
      duration: total,
      onUpdate: (tw) => {
        if (this.si !== si || this.phase !== 'tool') return;
        const now = tw.getValue() ?? 0;
        const p = this.at(keys, now);
        this.tipTo(t, p);
        const dist = Math.hypot(p.x - last.x, p.y - last.y);
        const d = now - tPrev;
        last = p;
        tPrev = now;
        if (now >= T.helpMs && st.act !== 'give') this.work(t, p, Math.max(dist, st.by === 'rub' ? 10 * k : 0), d);
      },
      onComplete: () => {
        if (this.si === si && this.phase === 'tool') {
          this.helped();
          if (st.act === 'give') return this.give(t);
          // (whatever is left, Mom finishes)
          return this.finishStation();
        }
        this.helped();
      },
    });
    return true;
  }

  /** Mom's help ran out of time before the station was done: what is left is done as if by hand. */
  private finishStation() {
    const st = this.station;
    if (!st) return;
    for (const t of this.targets()) {
      if (st.act === 'find') {
        t.hidden = false;
        t.img.setAlpha(1);
        continue;
      }
      this.thingDone(t);
      if (this.doneSt[this.si]) return;
    }
    if (!this.doneSt[this.si]) this.stationDone();
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
    switch (this.phase) {
      case 'care':
        return this.care?.down(p, at);
      case 'pick': {
        const v = this.visit.find((q) => !q.done && this.hitPatient(q, at));
        if (v) return this.callIn(v);
        const d = this.visit.find((q) => q.done && this.hitPatient(q, at));
        if (d) d.view.react('giggle');
        return;
      }
      case 'sticker': {
        const s = this.stickers.find((q) => this.near(at, q, Math.max(120 * k, 110 * q.scale)));
        if (s) this.giveSticker(s);
        return;
      }
      case 'problem': {
        // any problem not fixed yet (easy: Mom suggests one, but any is fine); a fixed one just wiggles
        const i = this.problems.findIndex((q) => this.near(at, q.at, 125 * k));
        if (i < 0) {
          if (this.cur && this.hitPatient(this.cur, at)) this.showSign(this.cur);
          return;
        }
        if (this.cur!.fixed[i]) {
          boing(this, this.problems[i].img, 0.12);
          sfx(this, 'tap', { volume: 0.5 });
          return;
        }
        return this.startProblem(i);
      }
      case 'tool': {
        const t = this.tools.find((q) => !q.away && this.near(at, q.img, Math.max(115 * k, 120 * q.homeScale)));
        if (!t) {
          if (this.cur && !this.zoom && this.hitPatient(this.cur, at)) this.showSign(this.cur);
          return;
        }
        // which station is this tool for? Little chef: only the current one. Big chef: any that can be done now.
        let i = this.si;
        if (this.steps[i]?.tool !== t.id) {
          const any = this.steps.findIndex((q, j) => q.tool === t.id && !this.doneSt[j]);
          if (this.level === 1 || any < 0) return this.wrongTool(t, any >= 0);
          const free = this.steps.findIndex((q, j) => q.tool === t.id && this.available(j));
          if (free < 0) return this.wrongTool(t, true);
          i = free;
          this.si = i;
          const st = this.steps[i];
          this.freshPlaces(st);
          this.shown.step = `${st.tool}-${st.act}-${st.what}`;
          this.shown.tool = st.tool;
          this.gripped = null;
          this.dripT = 0;
          this.revealPlaces();
          this.viewFor(st, () => undefined);
        } else if (this.level === 2) this.viewFor(this.steps[i], () => undefined);
        const st = this.steps[i];
        this.tweens.killTweensOf(t.img);
        t.img.setDepth(600);
        t.img.setScale(this.room.toolS);
        this.tipTo(t, this.fingerTip(at));
        boing(this, t.img, 0.08);
        sfx(this, 'tap', { volume: 0.7 });
        if (!this.lineSaid.has(i)) {
          this.lineSaid.add(i);
          const line = this.lineOf(st);
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
    if (this.care?.holding) return this.care.move(p);
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
    this.care?.tick(delta);
    const h = this.held;
    if (!h || this.phase !== 'tool') return;
    const st = this.station;
    // holding still counts for holding, listening, the drops and finding by ear (the finger need not move)
    if (st && ((st.act === 'clean' && st.by === 'time') || st.act === 'drops' || (st.act === 'find' && st.what === 'wheeze'))) this.work(h.tool, this.tip(h.tool), 0, delta);
  }

  protected up(_p: Phaser.Input.Pointer, cancelled: boolean) {
    if (this.care?.holding) return this.care.up(_p, cancelled);
    const h = this.held;
    this.held = null;
    if (!h) return;
    const k = this.L.k;
    const t = h.tool;
    const st = this.station;
    const v = this.cur;
    if (v && v.view.mood === 'expect') v.view.setMood('rest');
    if (this.zoom) this.zoom.box.x = this.zoom.at.x;
    if (this.gripped) {
      // let go mid-pull: it slips back into place (nothing lost)
      const g = this.gripped;
      this.gripped = null;
      const z = g.zoom ? this.zooms.get(g.zoom) : null;
      if (z) this.tweens.add({ targets: g.img, x: (g.f.x - LENS / 2) * z.s, y: (g.f.y - LENS / 2) * z.s, duration: 250 });
    }
    if (!st || t.id !== st.tool || this.phase !== 'tool' || cancelled) return this.backToTray(t);
    if (st.act === 'give') {
      // a tap on the right tool: it goes there by itself; a drag let go near the place: it lands
      const thing = this.targets()[0];
      const tg = thing ? this.worldOf(thing) : null;
      const tapped = h.moved < 30 * k && this.time.now - h.t0 < 450;
      const ready = st.view === 'body' ? !this.zoom : this.zoom?.id === st.view && !this.zoomBusy;
      if (tg && ready && (tapped || this.near(this.tip(t), tg, T.reach * k * 1.4))) {
        if (tapped) {
          const tp = C.tip[t.id as keyof typeof C.tip];
          this.tweens.add({
            targets: t.img,
            x: tg.x - (tp.x - 120) * t.img.scale,
            y: tg.y - (tp.y - 120) * t.img.scale,
            duration: 380,
            ease: 'Sine.easeInOut',
            onComplete: () => this.station === st && this.phase === 'tool' && this.give(t),
          });
          return;
        }
        return this.give(t);
      }
      if (h.moved > 40 * k) this.miss();
      return this.backToTray(t);
    }
    // a tap on a tool that needs holding or rubbing: Mom's hand shows how (no miss)
    if (h.moved < 30 * k && this.time.now - h.t0 < 450) this.hintNow();
    this.backToTray(t);
  }

  protected lookTarget() {
    const c = this.care?.look();
    if (c) return c;
    if (this.held) return { x: this.held.tool.img.x, y: this.held.tool.img.y };
    return null;
  }
}
