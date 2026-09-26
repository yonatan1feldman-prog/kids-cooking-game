import type { ImageKey } from '../core/assets';
import { TUNING } from '../core/tuning';
import type { FruitName } from '../core/vegArt';
import type { Recipe, StepDef } from './types';
import { pizza } from './pizza';
import { smoothie } from './smoothie';

/**
 * The fruit skewers: the eighth recipe, data on the others' step types plus `thread` (patterns: copy, extend, create).
 * Wash hands, wash the fruit, choose three of four fruits, cut each, thread three skewers (one just like Mom's, one
 * that goes on from Mom's start, one her very own), share them with Mom and Pipa, the photo of the tray.
 * The fruit, its colander, its cutting and its names are the smoothie's (assets-src/images-b-smoothie); the stick, the
 * tray, the card and the frame are assets-src/images-b-skewers.
 */

const chop = (fruit: FruitName, juice: number): StepDef => ({
  type: 'chop',
  params: {
    veg: fruit,
    whole: `fruit-${fruit}-whole`,
    slice: `fruit-${fruit}-slice`,
    inside: `fruit-${fruit}-inside`,
    board: 'cutting-board',
    knife: 'knife',
    ...TUNING.skewers.chop,
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

export const skewers: Recipe = {
  id: 'skewers',
  card: 'card-skewers',
  pickLine: 'vo-pick-skewers',
  // The tray is the board: it waits aside while the fruit is prepared, and the skewers lie on it.
  board: 'skewer-tray',
  character: pizza.character,
  // Counts and thresholds come from the tuning table (core/tuning.ts, TUNING.skewers).
  steps: [
    // Hand washing is the pizza's own first step; the fruit is washed in the smoothie's colander.
    pizza.steps[0],
    {
      type: 'wash',
      params: { ...(smoothie.steps[1].params as Extract<StepDef, { type: 'wash' }>['params']), ...TUNING.skewers.washFruit },
    },
    {
      type: 'choose',
      params: {
        options: [option('strawberry', 0xe23a4e), option('banana', 0xfff3c8), option('kiwi', 0x8cc63f), option('mango', 0xffb234)],
        pick: TUNING.choose.pick,
        pauseMs: TUNING.choose.pauseMs,
        // gameplay round 4: Pipa wants two things, in order
        order: { line: 'vo-pipa-order', then: 'vo-then', first: 'vo-first-this' },
        bin: 'topping-bin',
        line: 'vo-choose-fruit',
      },
    },
    {
      type: 'thread',
      params: {
        stick: 'skewer-stick',
        bin: 'topping-bin',
        fallback: [
          { topping: 'fruit-strawberry-slice', name: 'name-strawberry' },
          { topping: 'fruit-banana-slice', name: 'name-banana' },
          { topping: 'fruit-kiwi-slice', name: 'name-kiwi' },
        ],
        rounds: ['copy', 'extend', 'free'],
        ...TUNING.skewers.thread,
        line: 'vo-thread',
        copyLine: 'vo-copy',
        nextLine: 'vo-next',
        ownLine: 'vo-own',
        sameLine: 'vo-same',
        patternLine: 'vo-pattern',
        newLine: 'vo-new-pattern',
        sound: 'pop',
      },
    },
    {
      type: 'share',
      params: {
        slice: 'fruit-strawberry-slice',
        slices: 3,
        line: 'vo-share-skewers',
        forMom: 'vo-skewer-mom',
        momYum: 'vo-skewer-yum',
        forPet: 'vo-skewer-pipa',
        eat: 'munch',
        pieces: true,
      },
    },
    {
      type: 'photo',
      params: { frame: 'photo-frame-skewers', backdrop: 'bg-kitchen-landscape', line: 'vo-photo-skewers', finale: 'vo-finale-skewers', bye: 'vo-bye', made: true },
    },
  ],
};
