import { ART, type ImageKey } from '../core/assets';
import { TUNING } from '../core/tuning';
import type { FruitName } from '../core/vegArt';
import type { Recipe, StepDef } from './types';
import { pizza } from './pizza';

/**
 * The fruit smoothie: the fourth recipe, data on the step types of the others plus `blend` (README-smoothie.md for the
 * art). Wash hands, wash the fruit, choose three of four fruits, cut each, put it all in the blender jar, pour in the
 * milk, put the lid on and blend, pour it into three glasses, share them with Mom, Pipa and the guest, the photo.
 */

const JAR = { back: 'blender-jar-back', front: 'blender-jar-front' } as const;
const SMOOTHIE = ART.smoothie.tint;

/** Cutting one fruit (the chop step, the vegetable spec): its pictures, its juice colour; its slices go in its bin. */
const chop = (fruit: FruitName, juice: number): StepDef => ({
  type: 'chop',
  params: {
    veg: fruit,
    whole: `fruit-${fruit}-whole`,
    slice: `fruit-${fruit}-slice`,
    inside: `fruit-${fruit}-inside`,
    board: 'cutting-board',
    knife: 'knife',
    ...TUNING.smoothie.chop,
    juice,
    bin: 'topping-bin',
    topping: `fruit-${fruit}-slice`,
    line: 'vo-cut',
    careful: 'vo-cut-careful',
  },
});

const option = (id: FruitName, juice: number) => ({
  id,
  name: `name-${id}` as const,
  image: `fruit-${id}-whole` as ImageKey,
  topping: `fruit-${id}-slice` as ImageKey,
  prep: chop(id, juice),
});

export const smoothie: Recipe = {
  id: 'smoothie',
  card: 'card-smoothie',
  pickLine: 'vo-pick-smoothie',
  // Nothing is carried on a board: the fruit, then the jar, then the glasses carry the smoothie from step to step.
  board: null,
  character: pizza.character,
  // Counts and thresholds come from the tuning table (core/tuning.ts, TUNING.smoothie).
  steps: [
    // Hand washing is the pizza's own first step (the same sink, tap and lines).
    pizza.steps[0],
    {
      type: 'wash',
      params: {
        target: 'basket',
        basin: 'sink-basin',
        faucet: 'faucet',
        stream: 'water-stream',
        hands: 'colander-fruit',
        bubble: 'water-drop',
        ...TUNING.smoothie.washFruit,
        line: 'vo-wash-fruit',
        doneLine: 'vo-wash-veg-done',
      },
    },
    {
      type: 'choose',
      params: {
        options: [option('banana', 0xfff3c8), option('strawberry', 0xe23a4e), option('mango', 0xffb234), option('kiwi', 0x8cc63f)],
        pick: TUNING.choose.pick,
        pauseMs: TUNING.choose.pauseMs,
        bin: 'topping-bin',
        line: 'vo-choose-fruit',
      },
    },
    {
      type: 'open-pour',
      params: {
        kind: 'open',
        closed: 'blender-jar-back',
        open: 'blender-jar-back',
        pourLine: 'vo-into-blender',
        bowl: JAR,
        piece: 'fruit-banana-slice',
        ...TUNING.open,
        pourMs: TUNING.smoothie.transfer.ms,
        keep: { fills: ['jar-heap-1', 'jar-heap-2', 'jar-heap-3'] },
        sources: ['chosen'],
      },
    },
    {
      type: 'open-pour',
      params: {
        kind: 'open',
        closed: 'milk-carton',
        open: 'milk-carton',
        pourLine: 'vo-milk',
        bowl: JAR,
        piece: 'milk-drop',
        mouth: ART.smoothie.cartonSpout,
        tilt: 105,
        pourSound: 'glass-pour',
        ...TUNING.open,
        pourMs: TUNING.smoothie.milk.ms,
        keep: {},
      },
    },
    {
      type: 'blend',
      params: {
        bowl: JAR,
        from: 'jar-heap-3',
        lid: 'blender-lid',
        buttonOff: 'blender-button-off',
        buttonOn: 'blender-button-on',
        stages: ['blend-stage-1', 'blend-stage-2', 'blend-stage-3'],
        ...TUNING.smoothie.blend,
        lidLine: 'vo-lid',
        line: 'vo-blend',
        doneLine: 'vo-blend-done',
        lidSound: 'lid-click',
        tint: SMOOTHIE,
      },
    },
    {
      type: 'open-pour',
      params: {
        kind: 'open',
        closed: 'blender-jar-back',
        open: 'blender-jar-back',
        pourLine: 'vo-pour-glass',
        bowl: JAR,
        piece: 'fx-dot',
        pieceTint: SMOOTHIE,
        pieceSize: 1.4,
        tilt: 62,
        pourSound: 'glass-pour',
        ...TUNING.open,
        pourMs: TUNING.smoothie.glass.ms,
        keep: {},
        glasses: { empty: 'glass-empty', full: 'glass-full', count: TUNING.smoothie.glass.count },
      },
    },
    {
      type: 'share',
      params: {
        slice: 'glass-full',
        slices: TUNING.smoothie.glass.count,
        line: 'vo-share-smoothie',
        forMom: 'vo-glass-mom',
        momYum: 'vo-smoothie-yum',
        forPet: 'vo-glass-pipa',
        eat: 'slurp',
        pieces: true,
      },
    },
    {
      type: 'photo',
      params: { frame: 'photo-frame-smoothie', backdrop: 'bg-kitchen-landscape', line: 'vo-photo-smoothie', finale: 'vo-finale-smoothie', bye: 'vo-bye', made: true },
    },
  ],
};
