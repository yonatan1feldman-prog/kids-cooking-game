import { ART } from '../core/assets';
import { TUNING } from '../core/tuning';
import { pizza } from './pizza';
import type { BakeParams, Recipe } from './types';

/**
 * The birthday cake: the seventh recipe, data on the step types of the others plus `candles` (round 9).
 * Wash hands, flour, sugar and milk into the prep bowl, crack the egg, stir the batter smooth, pour it into the pan,
 * bake it at 200 with the mitts, choose a frosting colour, spread it all over, decorate it, put on five candles and
 * blow them out, share it in six wedges, the photo (with the candles still burning).
 */

const BOWL = { back: 'prep-bowl-back', front: 'prep-bowl-front' } as const;
const C = ART.cookies;
const S = ART.smoothie;
const T = TUNING.cake;
const FLOUR = 0xfff6e6;
/** The three frostings, as Mom names them and as the spread step paints them. */
const PINK = 0xf49ac1;
const WHITE = 0xfff8f0;
const CHOC = 0x7b4a2d;
/** The photo shows the cake with its candles alight: the candles step keeps it under this key. */
const LIT_KEY = 'cake-lit';

// Hand washing and the oven are the pizza's own (the same sink, lines, panel and mitts).
const washHands = pizza.steps[0];
const pizzaBake = pizza.steps.find((s) => s.type === 'bake')!.params as BakeParams;

export const cake: Recipe = {
  id: 'cake',
  card: 'card-cake',
  pickLine: 'vo-pick-cake',
  // The pan, and then the cake on its plate, carry it: the plate becomes the board when it comes out of the oven.
  board: null,
  character: pizza.character,
  // Counts and thresholds come from the tuning table (core/tuning.ts, TUNING.cake).
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
        pourMs: T.flour.ms,
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
        pourMs: T.sugar.ms,
        keep: { spot: 'pourBowl' },
      },
    },
    {
      type: 'open-pour',
      params: {
        kind: 'open',
        closed: 'milk-carton',
        open: 'milk-carton',
        pourLine: 'vo-milk',
        bowl: BOWL,
        piece: 'milk-drop',
        mouth: S.cartonSpout,
        tilt: 105,
        pourSound: 'glass-pour',
        ...TUNING.open,
        pourMs: T.milk.ms,
        keep: { fills: ['cake-batter-0'], spot: 'pourBowl' },
      },
    },
    {
      type: 'crush',
      params: {
        stages: ['egg-1', 'egg-2', 'egg-3'],
        pressesPerStage: T.egg.pressesPerStage,
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
        from: 'cake-batter-0',
        via: ['cake-batter-1', 'cake-batter-2'],
        to: 'cake-batter-3',
        tool: 'spoon-wood',
        distance: T.stir.distance,
        splash: 0xf6dca0,
        line: 'vo-stir-cake',
        keep: true,
      },
    },
    // The bowl itself is tipped over the pan, which fills and becomes cake-pan-full (the smoothie's `glasses`).
    {
      type: 'open-pour',
      params: {
        kind: 'open',
        closed: 'prep-bowl-back',
        open: 'prep-bowl-back',
        pourLine: 'vo-pour-pan',
        bowl: BOWL,
        piece: 'fx-dot',
        pieceTint: 0xf6dca0,
        pieceSize: 1.2,
        pourSound: 'pour',
        ...TUNING.open,
        pourMs: T.pan.ms,
        keep: {},
        glasses: { empty: 'cake-pan', full: 'cake-pan-full', count: 1 },
      },
    },
    {
      type: 'bake',
      params: {
        ...pizzaBake,
        panel: { ...pizzaBake.panel!, target: T.oven.target },
        startsAs: { base: 'cake-pan-full' },
        becomes: { base: 'cake-baked', board: 'cake-plate' },
      },
    },
    {
      type: 'choose',
      params: {
        options: [
          { id: 'pink', image: 'frosting-tub-pink', topping: 'frosting-tub-pink', name: 'name-pink', tint: PINK },
          { id: 'white', image: 'frosting-tub-white', topping: 'frosting-tub-white', name: 'name-white', tint: WHITE },
          { id: 'chocolate', image: 'frosting-tub-choc', topping: 'frosting-tub-choc', name: 'name-chocolate', tint: CHOC },
        ],
        pick: 1,
        pauseMs: TUNING.choose.pauseMs,
        bin: 'topping-bin',
        line: 'vo-pick-frosting',
      },
    },
    { type: 'spread', params: { source: 'frosting-tub-white', blob: 'frosting-blob', coverage: TUNING.spread.coverage, tintFrom: 'chosen' } },
    {
      type: 'decorate',
      params: {
        items: ['sprinkles-cluster', 'candy-dot', 'berry', 'choc-chip'],
        doneButton: 'btn-done',
        line: 'vo-decorate-cake',
      },
    },
    {
      type: 'candles',
      params: {
        candle: 'candle',
        candleFrame: ART.cake.candleSize,
        flame: 'flame-candle',
        smoke: 'smoke-puff',
        count: T.candles.count,
        size: 0.62,
        line: 'vo-candles',
        wishLine: 'vo-wish',
        doneLine: 'vo-blown',
        moreLine: 'vo-blow-more',
        lightSound: 'whoosh',
        blowSound: 'blow',
        capture: LIT_KEY,
      },
    },
    {
      type: 'share',
      params: {
        slice: 'cake-baked',
        slices: T.share.slices,
        cut: { knife: 'knife', line: 'vo-cut-slices' },
        line: 'vo-share-cake',
        forMom: 'vo-cake-mom',
        momYum: 'vo-cake-yum',
        forPet: 'vo-cake-pipa',
        eat: 'munch',
      },
    },
    {
      type: 'photo',
      params: {
        frame: 'photo-frame-cake',
        backdrop: 'bg-kitchen-landscape',
        line: 'vo-photo-cake',
        finale: 'vo-finale-cake',
        bye: 'vo-bye',
        made: true,
        madeKey: LIT_KEY,
      },
    },
  ],
};
