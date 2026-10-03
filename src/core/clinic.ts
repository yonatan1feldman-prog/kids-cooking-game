import type { CharacterDef } from '../recipes/types';
import { RECIPES } from '../recipes';
import type { ImageKey } from './assets';
import type { VoiceKey } from './audio';
import { GUESTS } from './guests';

/**
 * The clinic's patients and what ails them, as data (research/clinic-spec.md). ClinicScene plays them.
 * Nothing here is ever painful, scary or sad: a patient "doesn't feel well" (pink cheeks, a little cough, a gurgle),
 * every tool makes it better at once, and everyone goes home with a sticker.
 */
export type PatientId = 'turtle' | 'penguin' | 'giraffe' | 'pipa';
export type AilmentId = 'fever' | 'cough' | 'tummy' | 'tooth' | 'knee' | 'paw';
export type ToolId =
  | 'thermometer' | 'stethoscope' | 'plaster' | 'cream' | 'spray' | 'tweezers' | 'magnifier' | 'toothbrush' | 'cup' | 'syrup'
  | 'cloth' | 'hotbottle';
export const TOOLS: readonly ToolId[] = [
  'thermometer', 'stethoscope', 'plaster', 'cream', 'spray', 'tweezers', 'magnifier', 'toothbrush', 'cup', 'syrup', 'cloth', 'hotbottle',
];
/** The close-ups that pop out of the patient (a magnifying bubble), each tinted to the patient but the mouth. */
export type LensId = 'knee' | 'paw' | 'tummy' | 'mouth';

/**
 * One treatment move: the tool, what she does with it, and where.
 * - hold: keep its working point there (`holdMs`); drop: let it go there; listen: hold it on each glowing spot in turn
 *   (level 2 `find`: on the one spot that wheezes, found by ear); rub: rub the spots clean (the teeth) or the cream in;
 *   pull: take hold of the splinter and draw it out; search: move the magnifier over the paw until the splinter shows.
 * - where: on the patient (`mouth`, `forehead`, `chest`) or in the close-up (`lens`).
 */
export interface Treat {
  tool: ToolId;
  act: 'hold' | 'drop' | 'listen' | 'rub' | 'pull' | 'search';
  where: 'mouth' | 'forehead' | 'chest' | 'lens';
  /** Mom's line as the move starts (none: the tool's own). */
  line?: VoiceKey | null;
  /** Mom's line when it is done. */
  after?: VoiceKey;
  /** The stethoscope finds the one wheezy spot by ear (level 2's cough). */
  find?: boolean;
  /** The sound the stethoscope hears. */
  hear?: 'heartbeat' | 'gurgle';
}

export interface Ailment {
  id: AilmentId;
  /** Its picture card (level 2's diagnosis) and Mom's line naming it. */
  card: ImageKey;
  line: VoiceKey;
  lens?: LensId;
  /** Level 1 and level 2 (big chef: more steps, a spot to find). */
  steps: [Treat[], Treat[]];
}

const thermo = (after: VoiceKey, line?: VoiceKey | null): Treat => ({ tool: 'thermometer', act: 'hold', where: 'mouth', after, line });
const syrup: Treat = { tool: 'syrup', act: 'drop', where: 'mouth' };
const plaster: Treat = { tool: 'plaster', act: 'drop', where: 'lens' };
const cream: Treat = { tool: 'cream', act: 'rub', where: 'lens' };

export const AILMENTS: Record<AilmentId, Ailment> = {
  fever: {
    id: 'fever',
    card: 'sick-fever',
    line: 'vo-sick-fever',
    steps: [
      [thermo('vo-thermo-hot'), { tool: 'cloth', act: 'drop', where: 'forehead' }, thermo('vo-thermo-ok', null)],
      [thermo('vo-thermo-hot'), syrup, { tool: 'cloth', act: 'drop', where: 'forehead' }, thermo('vo-thermo-ok', null)],
    ],
  },
  cough: {
    id: 'cough',
    card: 'sick-cough',
    line: 'vo-sick-cough',
    steps: [
      [{ tool: 'stethoscope', act: 'listen', where: 'chest', hear: 'heartbeat', after: 'vo-stetho-heart' }, syrup],
      [{ tool: 'stethoscope', act: 'listen', where: 'chest', find: true, line: 'vo-stetho-find', after: 'vo-found-it' }, syrup, { tool: 'cup', act: 'drop', where: 'mouth' }],
    ],
  },
  tummy: {
    id: 'tummy',
    card: 'sick-tummy',
    line: 'vo-sick-tummy',
    lens: 'tummy',
    steps: [
      [{ tool: 'stethoscope', act: 'listen', where: 'lens', hear: 'gurgle' }, { tool: 'hotbottle', act: 'hold', where: 'lens' }],
      [{ tool: 'stethoscope', act: 'listen', where: 'lens', hear: 'gurgle' }, { tool: 'hotbottle', act: 'hold', where: 'lens' }, syrup],
    ],
  },
  tooth: {
    id: 'tooth',
    card: 'sick-tooth',
    line: 'vo-sick-tooth',
    lens: 'mouth',
    steps: [
      [{ tool: 'toothbrush', act: 'rub', where: 'lens' }, { tool: 'cup', act: 'drop', where: 'mouth', line: 'vo-tool-rinse' }],
      [{ tool: 'toothbrush', act: 'rub', where: 'lens' }, { tool: 'cup', act: 'drop', where: 'mouth', line: 'vo-tool-rinse' }],
    ],
  },
  knee: {
    id: 'knee',
    card: 'sick-knee',
    line: 'vo-sick-knee',
    lens: 'knee',
    steps: [
      [{ tool: 'spray', act: 'hold', where: 'lens' }, plaster],
      [{ tool: 'spray', act: 'hold', where: 'lens' }, cream, plaster],
    ],
  },
  paw: {
    id: 'paw',
    card: 'sick-paw',
    line: 'vo-sick-paw',
    lens: 'paw',
    steps: [
      [{ tool: 'tweezers', act: 'pull', where: 'lens' }, plaster],
      [{ tool: 'magnifier', act: 'search', where: 'lens', after: 'vo-found-it' }, { tool: 'tweezers', act: 'pull', where: 'lens' }, cream, plaster],
    ],
  },
};

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
  foot: F | null;
  tint: { skin: number; tummy: number };
  ailments: AilmentId[];
}

const guest = (id: 'turtle' | 'penguin' | 'giraffe') => GUESTS.find((g) => g.id === id)!;

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
    tint: { skin: 0x9fd27a, tummy: 0xf3dfa6 },
    ailments: ['fever', 'cough', 'tummy', 'tooth', 'knee', 'paw'],
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
    tint: { skin: 0xf6ab5a, tummy: 0xfbf7ee },
    ailments: ['fever', 'cough', 'tummy', 'knee', 'paw'],
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
    tint: { skin: 0xf3c768, tummy: 0xf8e2a8 },
    ailments: ['fever', 'tooth', 'tummy'],
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
    tint: { skin: 0xf3d9b8, tummy: 0xf3d9b8 },
    ailments: ['fever', 'cough', 'tummy', 'tooth', 'knee', 'paw'],
  },
];

/** A visit: `n` different patients, each with a different ailment she can have (shuffled; never stuck). */
export function planVisit(n: number, rnd: () => number = Math.random): { patient: Patient; ailment: Ailment }[] {
  const shuffle = <T>(a: readonly T[]) => a.map((v) => ({ v, r: rnd() })).sort((p, q) => p.r - q.r).map((p) => p.v);
  for (let tries = 0; tries < 50; tries++) {
    const who = shuffle(PATIENTS).slice(0, n);
    const used = new Set<AilmentId>();
    const out: { patient: Patient; ailment: Ailment }[] = [];
    // (the ones with the fewest ailments choose first)
    for (const p of [...who].sort((a, b) => a.ailments.length - b.ailments.length)) {
      const a = shuffle(p.ailments).find((x) => !used.has(x));
      if (!a) break;
      used.add(a);
      out.push({ patient: p, ailment: AILMENTS[a] });
    }
    if (out.length === n) return who.map((p) => out.find((o) => o.patient === p)!);
  }
  return PATIENTS.slice(0, n).map((p, i) => ({ patient: p, ailment: AILMENTS[p.ailments[i % p.ailments.length]] }));
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
};
