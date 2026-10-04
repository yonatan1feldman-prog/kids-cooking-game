import type { CharacterDef } from '../recipes/types';
import { RECIPES } from '../recipes';
import type { ImageKey } from './assets';
import type { VoiceKey } from './audio';
import { GUESTS } from './guests';

/**
 * The clinic's patients and what ails them, as data (research/clinic-doctor-games.md: round 3, in the style of "Doctor Games
 * for kids"; research/clinic-spec.md for the world). ClinicScene plays them. Nothing here is ever painful, scary or sad:
 * a patient "doesn't feel well" (pink cheeks, a red eye, silly germs on the teeth), every tool makes it better at once,
 * and everyone goes home with a sticker.
 */
export type PatientId = 'turtle' | 'penguin' | 'giraffe' | 'pipa' | 'lily' | 'leo' | 'mia' | 'sam';
export type AilmentId =
  | 'fever' | 'cough' | 'tummy' | 'tooth' | 'knee' | 'paw' | 'spots' | 'cold' | 'toy' | 'eye' | 'ear' | 'sting' | 'bites' | 'dirty';
export type ToolId =
  | 'thermometer' | 'stethoscope' | 'plaster' | 'cream' | 'spray' | 'tweezers' | 'magnifier' | 'toothbrush' | 'cup' | 'syrup'
  | 'cloth' | 'hotbottle' | 'tissue' | 'magnet' | 'filler' | 'cotton' | 'eyedrops' | 'swab' | 'light' | 'icepack' | 'xray'
  | 'sponge' | 'bugspray';
export const TOOLS: readonly ToolId[] = [
  'thermometer', 'stethoscope', 'plaster', 'cream', 'spray', 'tweezers', 'magnifier', 'toothbrush', 'cup', 'syrup', 'hotbottle',
  'tissue', 'magnet', 'filler', 'cotton', 'eyedrops', 'swab', 'light', 'icepack', 'xray', 'sponge', 'bugspray',
];
/** The big close-ups that grow out of the patient (tinted to her, but the mouth and the x-ray); `paw` is a child's hand
 * (lens-hand), `skin` a patch of her arm (round 4: the stings, the bites). */
export type ZoomId = 'mouth' | 'eye' | 'ear' | 'knee' | 'paw' | 'xray' | 'skin';

/**
 * What a tool works on: things drawn in a close-up (or on her) that go one by one (germs, food bits, holes to fill,
 * tears, a speck, ear wax, a ladybird, dirt, itchy spots, a splinter, the bell), or one place on her.
 */
export type What =
  | 'germ' | 'food' | 'hole' | 'tear' | 'speck' | 'wax' | 'bug' | 'dirt' | 'spot' | 'splinter' | 'bell' | 'listen' | 'wheeze'
  | 'sting' | 'bite' | 'gnat' | 'mud' | 'foam'
  | 'mouth' | 'forehead' | 'nose' | 'tummy' | 'eye' | 'ear' | 'knee' | 'paw' | 'skin';

/**
 * One station of a treatment: a tool and what it does, on several targets (Doctor Games' "lots of little things").
 * - clean: rub (`by: 'rub'`, the finger's travel) or hold (`by: 'time'`) the tool's working point on each target until it
 *   goes (germs, food, tears, wax, dirt; or holding the thermometer in the mouth, listening on each spot);
 * - touch: one touch does each target (a star into each hole, cream on each spot, medicine on each tummy germ);
 * - drops: hold the bottle over the place; a drop falls every so often, `n` drops;
 * - find: move the tool (the magnifier, the light, the x-ray, the stethoscope by ear) until the hidden things show;
 * - pull: take hold of each one and draw it out (the speck, the ladybird, the splinter, the bell with the magnet);
 * - give: bring it to the place, once (the medicine spoon, a drink, the plaster).
 */
export interface Station {
  tool: ToolId;
  act: 'clean' | 'touch' | 'drops' | 'find' | 'pull' | 'give';
  view: 'body' | ZoomId;
  what: What;
  /** How many targets [little chef, big chef] (default 1). */
  n?: readonly [number, number];
  by?: 'rub' | 'time';
  /** Mom's line as it starts (little chef) or as the tool is picked (big chef); none: the tool's own. */
  line?: VoiceKey | null;
  /** Mom's line when it is done. */
  after?: VoiceKey;
  /** What the stethoscope hears. */
  hear?: 'heartbeat' | 'gurgle' | 'jingle';
  /**
   * Its targets are under the `on` things (round 4): each shows where one of them went (the bump under a sting, the
   * soap where the mud was). The station waits until the station that clears them is done.
   */
  on?: What;
}

export interface Ailment {
  id: AilmentId;
  /** Its picture (the bubble over the patient in the waiting room) and Mom's line naming it. */
  card: ImageKey;
  line: VoiceKey;
  /** Little chef and big chef (more targets, things to find first; she picks the order herself). */
  steps: [Station[], Station[]];
}

const thermo = (after: VoiceKey, line?: VoiceKey | null): Station => ({ tool: 'thermometer', act: 'clean', by: 'time', view: 'body', what: 'mouth', after, line });
const syrup: Station = { tool: 'syrup', act: 'give', view: 'body', what: 'mouth' };
const warmDrink: Station = { tool: 'cup', act: 'give', view: 'body', what: 'mouth', line: 'vo-tool-warmdrink' };

const tooth = (): Station[] => [
  { tool: 'spray', act: 'clean', by: 'time', view: 'mouth', what: 'food', n: [3, 4], line: 'vo-tooth-food' },
  { tool: 'toothbrush', act: 'clean', by: 'rub', view: 'mouth', what: 'germ', n: [4, 6], line: 'vo-germs', after: 'vo-germs-gone' },
  { tool: 'filler', act: 'touch', view: 'mouth', what: 'hole', n: [1, 2] },
  { tool: 'cup', act: 'give', view: 'body', what: 'mouth', line: 'vo-tool-rinse' },
];
const knee = (): Station[] => [
  { tool: 'spray', act: 'clean', by: 'time', view: 'knee', what: 'dirt', n: [4, 6], line: 'vo-knee-dirt' },
  { tool: 'cream', act: 'clean', by: 'rub', view: 'knee', what: 'knee' },
  { tool: 'plaster', act: 'give', view: 'knee', what: 'knee' },
];
const pull = (what: What, after?: VoiceKey, line?: VoiceKey | null): Station => ({ tool: 'tweezers', act: 'pull', view: what === 'speck' ? 'eye' : what === 'bug' ? 'ear' : 'paw', what, n: [1, 2], after, line });

export const AILMENTS: Record<AilmentId, Ailment> = {
  tooth: { id: 'tooth', card: 'sick-tooth', line: 'vo-sick-tooth', steps: [tooth(), tooth()] },
  eye: {
    id: 'eye',
    card: 'sick-eye',
    line: 'vo-sick-eye',
    steps: [
      [
        { tool: 'cotton', act: 'clean', by: 'rub', view: 'eye', what: 'tear', n: [3, 5] },
        pull('speck', undefined, 'vo-eye-speck'),
        { tool: 'eyedrops', act: 'drops', view: 'eye', what: 'eye', n: [3, 4] },
      ],
      [
        { tool: 'cotton', act: 'clean', by: 'rub', view: 'eye', what: 'tear', n: [3, 5] },
        { tool: 'magnifier', act: 'find', view: 'eye', what: 'speck', n: [1, 2], after: 'vo-found-it' },
        pull('speck', undefined, 'vo-eye-speck'),
        { tool: 'eyedrops', act: 'drops', view: 'eye', what: 'eye', n: [3, 4] },
      ],
    ],
  },
  ear: {
    id: 'ear',
    card: 'sick-ear',
    line: 'vo-sick-ear',
    steps: [
      [
        { tool: 'light', act: 'find', view: 'ear', what: 'bug', after: 'vo-ear-bug' },
        pull('bug', 'vo-bug-bye', null),
        { tool: 'swab', act: 'clean', by: 'rub', view: 'ear', what: 'wax', n: [3, 5] },
        { tool: 'eyedrops', act: 'drops', view: 'ear', what: 'ear', n: [2, 3] },
      ],
      [
        { tool: 'light', act: 'find', view: 'ear', what: 'bug', after: 'vo-ear-bug' },
        pull('bug', 'vo-bug-bye', null),
        { tool: 'swab', act: 'clean', by: 'rub', view: 'ear', what: 'wax', n: [3, 5] },
        { tool: 'eyedrops', act: 'drops', view: 'ear', what: 'ear', n: [2, 3] },
      ],
    ],
  },
  fever: {
    id: 'fever',
    card: 'sick-fever',
    line: 'vo-sick-fever',
    steps: [
      [thermo('vo-thermo-hot'), { tool: 'icepack', act: 'clean', by: 'time', view: 'body', what: 'forehead' }, syrup, thermo('vo-thermo-ok', null)],
      [thermo('vo-thermo-hot'), { tool: 'icepack', act: 'clean', by: 'time', view: 'body', what: 'forehead' }, syrup, warmDrink, thermo('vo-thermo-ok', null)],
    ],
  },
  cough: {
    id: 'cough',
    card: 'sick-cough',
    line: 'vo-sick-cough',
    steps: [
      [{ tool: 'stethoscope', act: 'clean', by: 'time', view: 'body', what: 'listen', n: [3, 3], hear: 'heartbeat', after: 'vo-stetho-heart' }, syrup, warmDrink],
      [{ tool: 'stethoscope', act: 'find', view: 'body', what: 'wheeze', line: 'vo-stetho-find', after: 'vo-found-it' }, syrup, warmDrink],
    ],
  },
  cold: {
    id: 'cold',
    card: 'sick-cold',
    line: 'vo-sick-cold',
    steps: [
      [{ tool: 'tissue', act: 'clean', by: 'time', view: 'body', what: 'nose', after: 'vo-clinic-bless' }, syrup, warmDrink],
      [thermo('vo-thermo-hot'), { tool: 'tissue', act: 'clean', by: 'time', view: 'body', what: 'nose', after: 'vo-clinic-bless' }, syrup, warmDrink],
    ],
  },
  tummy: {
    id: 'tummy',
    card: 'sick-tummy',
    line: 'vo-sick-tummy',
    steps: [
      [
        { tool: 'xray', act: 'find', view: 'xray', what: 'germ', n: [3, 4], line: 'vo-tool-xray' },
        { tool: 'syrup', act: 'touch', view: 'xray', what: 'germ', n: [3, 4], line: 'vo-tummy-germs', after: 'vo-germs-gone' },
        { tool: 'hotbottle', act: 'clean', by: 'time', view: 'body', what: 'tummy' },
      ],
      [
        { tool: 'xray', act: 'find', view: 'xray', what: 'germ', n: [3, 4], line: 'vo-tool-xray' },
        { tool: 'syrup', act: 'touch', view: 'xray', what: 'germ', n: [3, 4], line: 'vo-tummy-germs', after: 'vo-germs-gone' },
        { tool: 'hotbottle', act: 'clean', by: 'time', view: 'body', what: 'tummy' },
      ],
    ],
  },
  toy: {
    id: 'toy',
    card: 'sick-toy',
    line: 'vo-sick-toy',
    steps: [
      [{ tool: 'xray', act: 'find', view: 'xray', what: 'bell', line: 'vo-tool-xray', after: 'vo-jingle' }, { tool: 'magnet', act: 'pull', view: 'xray', what: 'bell', after: 'vo-bell-out' }],
      [{ tool: 'xray', act: 'find', view: 'xray', what: 'bell', line: 'vo-tool-xray', after: 'vo-jingle' }, { tool: 'magnet', act: 'pull', view: 'xray', what: 'bell', after: 'vo-bell-out' }, syrup],
    ],
  },
  knee: { id: 'knee', card: 'sick-knee', line: 'vo-sick-knee', steps: [knee(), knee()] },
  paw: {
    id: 'paw',
    card: 'sick-paw',
    line: 'vo-sick-paw',
    steps: [
      [pull('splinter'), { tool: 'cream', act: 'clean', by: 'rub', view: 'paw', what: 'paw' }, { tool: 'plaster', act: 'give', view: 'paw', what: 'paw' }],
      [{ tool: 'magnifier', act: 'find', view: 'paw', what: 'splinter', n: [1, 2], after: 'vo-found-it' }, pull('splinter'), { tool: 'cream', act: 'clean', by: 'rub', view: 'paw', what: 'paw' }, { tool: 'plaster', act: 'give', view: 'paw', what: 'paw' }],
    ],
  },
  // ---- round 4 (research/clinic-research-2.md): what "Doctor Games for kids" has that we lacked
  sting: {
    id: 'sting',
    card: 'sick-sting',
    line: 'vo-sick-sting',
    steps: [
      [
        { tool: 'tweezers', act: 'pull', view: 'skin', what: 'sting', n: [2, 3] },
        { tool: 'cream', act: 'touch', view: 'skin', what: 'bite', n: [2, 3], on: 'sting', line: 'vo-tool-dab' },
      ],
      [
        { tool: 'tweezers', act: 'pull', view: 'skin', what: 'sting', n: [2, 3] },
        { tool: 'cream', act: 'touch', view: 'skin', what: 'bite', n: [2, 3], on: 'sting', line: 'vo-tool-dab' },
        { tool: 'icepack', act: 'clean', by: 'time', view: 'skin', what: 'skin' },
      ],
    ],
  },
  bites: {
    id: 'bites',
    card: 'sick-bites',
    line: 'vo-sick-bites',
    steps: [
      [
        { tool: 'bugspray', act: 'clean', by: 'time', view: 'skin', what: 'gnat', n: [3, 4], after: 'vo-bugs-bye' },
        { tool: 'cream', act: 'touch', view: 'skin', what: 'bite', n: [3, 4], line: 'vo-tool-dab' },
      ],
      [
        { tool: 'bugspray', act: 'clean', by: 'time', view: 'skin', what: 'gnat', n: [3, 4], after: 'vo-bugs-bye' },
        { tool: 'cream', act: 'touch', view: 'skin', what: 'bite', n: [3, 4], line: 'vo-tool-dab' },
      ],
    ],
  },
  dirty: {
    id: 'dirty',
    card: 'sick-dirty',
    line: 'vo-sick-dirty',
    steps: [
      [
        { tool: 'sponge', act: 'clean', by: 'rub', view: 'body', what: 'mud', n: [3, 5] },
        { tool: 'spray', act: 'clean', by: 'time', view: 'body', what: 'foam', n: [3, 5], on: 'mud', line: 'vo-rinse-foam', after: 'vo-all-clean' },
      ],
      [
        { tool: 'sponge', act: 'clean', by: 'rub', view: 'body', what: 'mud', n: [3, 5] },
        { tool: 'spray', act: 'clean', by: 'time', view: 'body', what: 'foam', n: [3, 5], on: 'mud', line: 'vo-rinse-foam', after: 'vo-all-clean' },
      ],
    ],
  },
  spots: {
    id: 'spots',
    card: 'sick-spots',
    line: 'vo-sick-spots',
    steps: [
      [{ tool: 'cream', act: 'touch', view: 'body', what: 'spot', n: [4, 6], line: 'vo-tool-dab' }, syrup],
      [{ tool: 'cream', act: 'touch', view: 'body', what: 'spot', n: [4, 6], line: 'vo-tool-dab' }, { tool: 'icepack', act: 'clean', by: 'time', view: 'body', what: 'forehead' }, syrup],
    ],
  },
};

/** The ailments that open a big close-up (a visit always has at least two of them: they are the fun of it). */
export const ZOOM_AILMENTS: readonly AilmentId[] = ['tooth', 'eye', 'ear', 'tummy', 'toy', 'knee', 'paw', 'sting', 'bites'];

type F = { x: number; y: number };

/**
 * A patient: the layered character (the guests' and Pipa's art: a 600x700 frame, feet at y 684), Mom's hello, her
 * wordless voice's pitch, where things are on her in the frame, the colours her close-ups are tinted, and the ailments
 * she can have (the giraffe is only a head on a long neck: no knee, no foot, no chest to listen to; the penguin has a
 * beak, so no tooth).
 */
export interface Patient {
  id: PatientId;
  def: CharacterDef;
  hello: VoiceKey;
  rate: number;
  forehead: F;
  cheeks: [F, F];
  chest: [F, F, F];
  /** Her nose (the tissue goes there); none: just above her mouth. */
  nose?: F;
  /** Where itchy spots can come out on her (spots; the mud goes there too, and on her face). */
  spots: F[];
  /** Where a scrape or a splinter shows: an animal's foot; a child's knee. */
  foot: F | null;
  /** A child (round 4): a splinter goes into her hand (lens-hand, shown at `hand`), not a paw. */
  kid?: true;
  hand?: F;
  tint: { skin: number; tummy: number };
  ailments: AilmentId[];
}

const guest = (id: 'turtle' | 'penguin' | 'giraffe') => GUESTS.find((g) => g.id === id)!;

/**
 * The children (round 4, like the girl and the boy in "Doctor Games for kids"; assets-src/images-b-clinic/tools/gen_kids.py
 * prints their points): they sit on the bench, knees forward, hands in the lap. `hy` is the head's centre in the frame
 * (Mia, the smallest, has a bigger head for her size and her body is drawn at `body` around her feet).
 */
const KIDS: { id: 'lily' | 'leo' | 'mia' | 'sam'; rate: number; hy: number; body: number; skin: number; shirt: number }[] = [
  { id: 'lily', rate: 1.25, hy: 240, body: 1, skin: 0xf8d5bc, shirt: 0xf59bb4 },
  { id: 'leo', rate: 1.05, hy: 240, body: 1, skin: 0x8e5a3b, shirt: 0xf6c445 },
  { id: 'mia', rate: 1.45, hy: 262, body: 0.86, skin: 0xf4d3b2, shirt: 0xb99ce3 },
  { id: 'sam', rate: 1.3, hy: 240, body: 1, skin: 0xebb892, shirt: 0x7cc47a },
];

function kid(c: (typeof KIDS)[number]): Patient {
  const b = (x: number, y: number): F => ({ x: Math.round(300 + (x - 300) * c.body), y: Math.round(684 + (y - 684) * c.body) });
  const hy = c.hy;
  return {
    id: c.id,
    def: {
      body: `kid-${c.id}-body`,
      eyesOpen: `kid-${c.id}-eyes-open`,
      eyesBlink: `kid-${c.id}-eyes-blink`,
      eyesSurprised: `kid-${c.id}-eyes-surprised`,
      eyesHappy: `kid-${c.id}-eyes-happy`,
      mouthClosed: `kid-${c.id}-mouth-closed`,
      mouthOpen: `kid-${c.id}-mouth-open`,
      mouthChew: `kid-${c.id}-mouth-chew`,
    } as CharacterDef,
    hello: `vo-hi-${c.id}` as VoiceKey,
    rate: c.rate,
    forehead: { x: 300, y: hy - 60 },
    cheeks: [{ x: 206, y: hy + 80 }, { x: 394, y: hy + 80 }],
    chest: [b(300, 470), b(250, 520), b(350, 520)],
    nose: { x: 300, y: hy + 62 },
    foot: b(232, 604),
    kid: true,
    hand: b(216, 562),
    spots: [{ x: 214, y: hy + 92 }, { x: 386, y: hy + 92 }, b(196, 500), b(404, 500), b(368, 604), { x: 300, y: hy - 40 }, b(256, 470), b(344, 540)],
    tint: { skin: c.skin, tummy: c.skin },
    ailments: ['fever', 'cough', 'tummy', 'tooth', 'knee', 'paw', 'spots', 'cold', 'toy', 'eye', 'ear', 'sting', 'bites', 'dirty'],
  };
}

export const isKid = (p: Patient) => !!p.kid;

export const PATIENTS: readonly Patient[] = [
  {
    id: 'turtle',
    def: guest('turtle'),
    hello: 'vo-hi-turtle',
    rate: 0.78,
    forehead: { x: 298, y: 262 },
    cheeks: [{ x: 205, y: 388 }, { x: 399, y: 388 }],
    chest: [{ x: 298, y: 478 }, { x: 246, y: 548 }, { x: 350, y: 548 }],
    foot: { x: 448, y: 640 },
    spots: [{ x: 200, y: 560 }, { x: 236, y: 470 }, { x: 362, y: 470 }, { x: 410, y: 590 }, { x: 178, y: 500 }, { x: 422, y: 500 }],
    tint: { skin: 0x9fd27a, tummy: 0xf3dfa6 },
    ailments: ['fever', 'cough', 'tummy', 'tooth', 'knee', 'paw', 'spots', 'cold', 'toy', 'eye', 'sting', 'bites', 'dirty'],
  },
  {
    id: 'penguin',
    def: guest('penguin'),
    hello: 'vo-hi-penguin',
    rate: 1.3,
    forehead: { x: 297, y: 275 },
    cheeks: [{ x: 212, y: 388 }, { x: 388, y: 388 }],
    chest: [{ x: 297, y: 488 }, { x: 250, y: 568 }, { x: 345, y: 568 }],
    foot: { x: 376, y: 664 },
    spots: [{ x: 250, y: 520 }, { x: 345, y: 520 }, { x: 297, y: 600 }, { x: 230, y: 610 }, { x: 362, y: 610 }, { x: 297, y: 450 }],
    tint: { skin: 0xf6ab5a, tummy: 0xfbf7ee },
    ailments: ['fever', 'cough', 'tummy', 'knee', 'paw', 'spots', 'cold', 'toy', 'eye', 'sting', 'bites', 'dirty'],
  },
  {
    id: 'giraffe',
    def: guest('giraffe'),
    hello: 'vo-hi-giraffe',
    rate: 1.15,
    forehead: { x: 300, y: 280 },
    cheeks: [{ x: 212, y: 450 }, { x: 392, y: 450 }],
    chest: [{ x: 300, y: 300 }, { x: 250, y: 300 }, { x: 350, y: 300 }],
    foot: null,
    spots: [],
    tint: { skin: 0xf3c768, tummy: 0xf8e2a8 },
    ailments: ['fever', 'tooth', 'tummy', 'cold', 'toy', 'eye', 'ear', 'sting', 'dirty'],
  },
  {
    id: 'pipa',
    def: RECIPES[0].character,
    hello: 'vo-hi-pipa',
    rate: 1,
    forehead: { x: 295, y: 262 },
    cheeks: [{ x: 198, y: 400 }, { x: 400, y: 400 }],
    chest: [{ x: 295, y: 488 }, { x: 245, y: 565 }, { x: 345, y: 565 }],
    foot: { x: 392, y: 660 },
    spots: [{ x: 240, y: 560 }, { x: 350, y: 560 }, { x: 182, y: 470 }, { x: 412, y: 470 }, { x: 295, y: 620 }, { x: 250, y: 220 }],
    tint: { skin: 0xf3d9b8, tummy: 0xf3d9b8 },
    ailments: ['fever', 'cough', 'tummy', 'tooth', 'knee', 'paw', 'spots', 'cold', 'toy', 'eye', 'ear', 'sting', 'bites', 'dirty'],
  },
  ...KIDS.map(kid),
];

/**
 * A visit (round 4): `n` different patients, at least one of them a child, each with `m` problems of her own (like the
 * patients in "Doctor Games for kids"), no problem twice in a visit, each patient with a close-up among hers when she can
 * (they are the fun of it). Shuffled; never stuck.
 */
export function planVisit(n: number, m: number, rnd: () => number = Math.random): { patient: Patient; ailments: Ailment[] }[] {
  const shuffle = <T>(a: readonly T[]) => a.map((v) => ({ v, r: rnd() })).sort((p, q) => p.r - q.r).map((p) => p.v);
  for (let tries = 0; tries < 60; tries++) {
    const who = shuffle(PATIENTS).slice(0, n);
    if (!who.some(isKid) && tries < 50) continue;
    const used = new Set<AilmentId>();
    const out: { patient: Patient; ailments: Ailment[] }[] = [];
    // (the ones with the fewest ailments choose first; a close-up first, then anything)
    for (const p of [...who].sort((a, b) => a.ailments.length - b.ailments.length)) {
      const free = shuffle(p.ailments).filter((x) => !used.has(x));
      const zoom = free.find((x) => ZOOM_AILMENTS.includes(x));
      const pick = [...(zoom ? [zoom] : []), ...free.filter((x) => x !== zoom)].slice(0, m);
      if (pick.length < m) break;
      for (const x of pick) used.add(x);
      out.push({ patient: p, ailments: shuffle(pick).map((x) => AILMENTS[x]) });
    }
    if (out.length === n) return who.map((p) => out.find((o) => o.patient === p)!);
  }
  return PATIENTS.slice(0, n).map((p, i) => ({ patient: p, ailments: p.ailments.slice(i * m, i * m + m).map((x) => AILMENTS[x]) }));
}

/** The tool's own line (its name, as Mom hands it over). */
export const TOOL_LINE: Record<ToolId, VoiceKey> = {
  thermometer: 'vo-tool-thermometer',
  stethoscope: 'vo-tool-stethoscope',
  plaster: 'vo-tool-plaster',
  cream: 'vo-tool-cream',
  spray: 'vo-tool-spray',
  tweezers: 'vo-tool-tweezers',
  magnifier: 'vo-tool-magnifier',
  toothbrush: 'vo-tool-toothbrush',
  cup: 'vo-tool-cup',
  syrup: 'vo-tool-syrup',
  cloth: 'vo-tool-cloth',
  hotbottle: 'vo-tool-hotbottle',
  tissue: 'vo-tool-tissue',
  magnet: 'vo-tool-magnet',
  filler: 'vo-tool-filler',
  cotton: 'vo-tool-cotton',
  eyedrops: 'vo-tool-eyedrops',
  swab: 'vo-tool-swab',
  light: 'vo-tool-light',
  icepack: 'vo-tool-icepack',
  xray: 'vo-tool-xray',
  sponge: 'vo-tool-sponge',
  bugspray: 'vo-tool-bugspray',
};
