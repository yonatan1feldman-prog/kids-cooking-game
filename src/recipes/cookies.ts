import { ART } from '../core/assets';
import { TUNING } from '../core/tuning';
import type { BakeParams, Recipe } from './types';
import { pizza } from './pizza';

/**
 * The cookies: the third recipe, data on the step types the pizza and the salad use, plus one new type, `cutters`
 * (README-cookies.md for the art). Wash hands; flour, sugar and butter into the bowl; crack the egg; stir it into dough;
 * knead it; roll it flat; cut six cookies with the cutters (onto the tray); bake them at 150; decorate them; share them
 * with Mom and Pipa; the photo.
 */

const BOWL = { back: 'prep-bowl-back', front: 'prep-bowl-front' } as const;
const DOUGH = 0xf0c984;
const FLOUR = 0xfff6e6;
/** The sheet and the tray are drawn at this size (x k): as wide as the pizza's board. */
const SHEET = 0.82;
const C = ART.cookies;

// Hand washing and the oven are the pizza's own (the same sink, lines, panel and mitts).
const washHands = pizza.steps[0];
const pizzaBake = pizza.steps.find((s) => s.type === 'bake')!.params as BakeParams;

const cutter = (shape: 'star' | 'heart' | 'circle' | 'flower') =>
  ({ cutter: `cutter-${shape}`, cookie: `cookie-${shape}`, name: `name-${shape}` }) as const;

export const cookies: Recipe = {
  id: 'cookies',
  card: 'card-cookies',
  pickLine: 'vo-pick-cookies',
  // The dough and the cookies lie on the counter, then on their tray (no board).
  board: null,
  character: pizza.character,
  // Counts and thresholds come from the tuning table (core/tuning.ts, TUNING.cookies).
  steps: [
    washHands,
    {
      type: 'open-pour',
      params: {
        kind: 'open',
        closed: 'flour-bag',
        open: 'flour-bag',
        pourLine: 'vo-flour',
        bowl: BOWL,
        piece: 'fx-dot',
        pieceTint: FLOUR,
        pieceSize: 0.9,
        mouth: C.flourMouth,
        tilt: 120,
        pourSound: 'flour-poof',
        ...TUNING.open,
        pourMs: TUNING.cookies.flour.ms,
        keep: { fills: ['batter-stage-0'], spot: 'pourBowl' },
      },
    },
    {
      type: 'open-pour',
      params: {
        kind: 'open',
        closed: 'sugar-jar',
        open: 'sugar-jar',
        pourLine: 'vo-sugar',
        bowl: BOWL,
        piece: 'fx-dot',
        pieceTint: 0xffffff,
        pieceSize: 0.5,
        mouth: C.sugarMouth,
        tilt: 120,
        pourSound: 'salt',
        ...TUNING.open,
        pourMs: TUNING.cookies.sugar.ms,
        keep: { spot: 'pourBowl' },
      },
    },
    {
      type: 'open-pour',
      params: {
        kind: 'open',
        closed: 'butter-cube',
        open: 'butter-cube',
        pourLine: 'vo-butter',
        bowl: BOWL,
        piece: 'butter-cube',
        tilt: 0,
        pourSound: 'squish',
        ...TUNING.open,
        pourMs: 0,
        keep: { spot: 'pourBowl' },
        dropIn: { key: 'butter-cube', at: C.butterAt, base: C.butterBase, scale: C.butterScale },
      },
    },
    {
      type: 'crush',
      params: {
        stages: ['egg-1', 'egg-2', 'egg-3'],
        pressesPerStage: TUNING.cookies.egg.pressesPerStage,
        place: 'over-bowl',
        bowl: BOWL,
        overAngle: 0,
        overSize: 0.8,
        dropFrom: C.eggDrop,
        lands: { key: 'yolk', at: C.yolkAt, scale: 0.9 },
        splash: 0xfffaf0,
        sound: 'egg-crack',
        line: 'vo-egg',
      },
    },
    {
      type: 'stir',
      params: {
        bowl: BOWL,
        from: 'batter-stage-0',
        via: ['batter-stage-1', 'batter-stage-2'],
        to: 'batter-stage-3',
        tool: 'spoon-wood',
        distance: TUNING.cookies.stir.distance,
        splash: DOUGH,
        line: 'vo-stir-dough',
      },
    },
    {
      type: 'knead',
      params: {
        stages: ['cookie-dough-knead-1', 'cookie-dough-knead-2', 'cookie-dough-knead-3', 'cookie-dough-ball'],
        pressesPerStage: TUNING.cookies.knead.pressesPerStage,
        place: 'board',
        dent: 'press-dent',
        splash: FLOUR,
        sound: 'squish',
        line: 'vo-knead-cookies',
        handoff: 'cookie-dough-ball',
      },
    },
    {
      type: 'roll',
      params: { ball: 'cookie-dough-ball', flat: 'cookie-dough-flat', tool: 'rolling-pin', rubWidths: TUNING.cookies.roll.rubWidths, line: 'vo-roll-cookies', size: SHEET },
    },
    {
      type: 'cutters',
      params: {
        cutters: [cutter('star'), cutter('heart'), cutter('circle'), cutter('flower')],
        sheet: 'cookie-dough-flat',
        tray: 'baking-tray',
        slots: C.slots,
        size: SHEET,
        press: C.cutterPress,
        line: 'vo-pick-cutter',
        stampLine: 'vo-stamp',
        trayLine: 'vo-tray',
        sound: 'stamp',
        pressMs: TUNING.cookies.cut.pressMs,
      },
    },
    {
      type: 'bake',
      params: {
        ...pizzaBake,
        tray: C.ovenTray,
        panel: { ...pizzaBake.panel!, target: TUNING.cookies.oven.target, line: 'vo-temp-150' },
      },
    },
    {
      type: 'decorate',
      params: {
        items: ['icing-tube-pink', 'icing-tube-choc', 'sprinkles-cluster', 'candy-dot'],
        doneButton: 'btn-done',
        line: 'vo-decorate-cookies',
        places: { 'icing-tube-pink': 'icing-blob-pink', 'icing-tube-choc': 'icing-blob-choc' },
        sizes: { 'icing-blob-pink': C.stamp * SHEET, 'icing-blob-choc': C.stamp * SHEET, 'sprinkles-cluster': C.stamp * SHEET, 'candy-dot': C.candy * SHEET },
        onto: 'cookies',
      },
    },
    {
      type: 'share',
      params: {
        slice: 'cookie-circle',
        slices: 6,
        line: 'vo-share-cookies',
        forMom: 'vo-cookie-mom',
        momYum: 'vo-cookie-yum',
        forPet: 'vo-cookie-pipa',
        eat: 'cookie-crunch',
        pieces: true,
      },
    },
    {
      type: 'photo',
      params: { frame: 'photo-frame-cookies', backdrop: 'bg-kitchen-landscape', line: 'vo-photo-cookies', finale: 'vo-finale-cookies', bye: 'vo-bye', made: true },
    },
  ],
};
