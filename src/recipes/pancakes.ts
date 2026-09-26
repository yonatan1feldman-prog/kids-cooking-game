import { ART } from '../core/assets';
import { TUNING } from '../core/tuning';
import type { Recipe } from './types';
import { pizza } from './pizza';

/**
 * The pancakes: the fifth recipe, data on the step types of the others plus `flip` (README-pancakes.md for the art).
 * Wash hands, flour and milk into the prep bowl, crack the egg, stir the batter, turn on the stove, pour and flip three
 * pancakes onto the plate, decorate the top one, share it cut in four like the pizza, the photo.
 */

const BOWL = { back: 'prep-bowl-back', front: 'prep-bowl-front' } as const;
const C = ART.cookies;
const S = ART.smoothie;
const FLOUR = 0xfff6e6;
const BATTER = 0xf6dca0;
const T = TUNING.pancakes;

export const pancakes: Recipe = {
  id: 'pancakes',
  card: 'card-pancakes',
  pickLine: 'vo-pick-pancakes',
  // Nothing is carried on a board until the pancakes are made: then the big plate is the board (the flip step).
  board: null,
  character: pizza.character,
  // Counts and thresholds come from the tuning table (core/tuning.ts, TUNING.pancakes).
  steps: [
    // Hand washing is the pizza's own first step (the same sink, tap and lines).
    pizza.steps[0],
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
        // (the cookies' flour in the bowl, then flour and milk)
        keep: { fills: ['pancake-batter-0'], spot: 'pourBowl' },
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
        from: 'pancake-batter-0',
        via: ['pancake-batter-1', 'pancake-batter-2'],
        to: 'pancake-batter-3',
        tool: 'spoon-wood',
        distance: T.stir.distance,
        splash: BATTER,
        line: 'vo-stir-batter',
        keep: true,
        // gameplay round 4: stir the way the arrows go (they turn round half-way)
        arrow: { line: 'vo-stir-arrow', flipLine: 'vo-other-way' },
      },
    },
    {
      type: 'flip',
      params: {
        stove: { top: 'stove-top', knobOff: 'stove-knob-off', knobOn: 'stove-knob-on', flame: 'flame', line: 'vo-stove', sound: 'click' },
        pan: 'pan',
        ladle: 'ladle',
        puddles: ['batter-puddle-1', 'batter-puddle-2', 'batter-puddle-3'],
        bubbles: 'pancake-bubbles',
        golden: 'pancake-golden',
        plate: 'plate-big',
        // (the golden pancake as the dish's base, as big as the plate's top pancake)
        baseSize: ART.pancakes.plateTop / ART.pancakes.cakeR,
        batterTint: BATTER,
        ...T.flip,
        flipSound: 'whoosh',
        ladleLine: 'vo-ladle',
        bubblesLine: 'vo-bubbles',
        flipLine: 'vo-flip',
        flipDoneLine: 'vo-flip-done',
        moreLine: 'vo-more-pancake',
      },
    },
    {
      type: 'decorate',
      params: {
        items: ['syrup-bottle', 'berry', 'banana-coin', 'butter-pat'],
        doneButton: 'btn-done',
        line: 'vo-decorate-pancakes',
        places: { 'syrup-bottle': 'syrup-blob' },
        // (a big, easy-to-see pool of syrup)
        sizes: { 'syrup-blob': 1.7, 'syrup-bottle': 1.7 },
      },
    },
    {
      type: 'share',
      params: {
        slice: 'pancake-golden',
        slices: T.share.slices,
        cut: { knife: 'knife', line: 'vo-cut-slices' },
        cutRadius: ART.pancakes.plateTop / ART.doughRadius,
        line: 'vo-share-pancakes',
        forMom: 'vo-pancake-mom',
        momYum: 'vo-pancake-yum',
        forPet: 'vo-pancake-pipa',
      },
    },
    {
      type: 'photo',
      params: { frame: 'photo-frame-pancakes', backdrop: 'bg-kitchen-landscape', line: 'vo-photo-pancakes', finale: 'vo-finale-pancakes', bye: 'vo-bye' },
    },
  ],
};
