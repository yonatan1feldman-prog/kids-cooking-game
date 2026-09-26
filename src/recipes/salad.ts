import { TUNING } from '../core/tuning';
import type { ImageKey } from '../core/assets';
import type { FruitName, VegName } from '../core/vegArt';
import type { Recipe, StepDef } from './types';
import { pizza } from './pizza';

/**
 * The vegetable salad: the second recipe, pure data on the step types the pizza uses (README-salad.md for the art).
 * Wash hands, wash the vegetables, tear the lettuce, choose three vegetables, cut each, put everything into the salad
 * bowl, squeeze the lemon, pour the oil, a little salt, mix, serve Mom and Pipa, the photo.
 */

const SALAD_BOWL = { back: 'salad-bowl-back', front: 'salad-bowl-front' } as const;
const LEMON = 0xf5d547;
const LETTUCE = 0x9fd36b;

/** Cutting one vegetable: its pictures, its juice colour, and the piece it becomes in the bowl (shown on its bin). */
const chop = (veg: Exclude<VegName, FruitName>, juice: number, piece: ImageKey): StepDef => ({
  type: 'chop',
  params: {
    veg,
    whole: `veg-${veg}-whole`,
    slice: `veg-${veg}-slice`,
    inside: `veg-${veg}-inside`,
    board: 'cutting-board',
    knife: 'knife',
    ...TUNING.salad.chop,
    juice,
    bin: 'topping-bin',
    topping: piece,
    line: 'vo-cut',
    careful: 'vo-cut-careful',
  },
});

const option = (id: 'cucumber' | 'tomato' | 'pepper' | 'carrot' | 'onion', juice: number, piece: ImageKey) => ({
  id,
  name: `name-${id}` as const,
  image: `veg-${id}-whole` as ImageKey,
  topping: piece,
  prep: chop(id, juice, piece),
});

// Hand washing is the pizza's own first step (the same sink, tap and lines).
const washHands = pizza.steps[0];

export const salad: Recipe = {
  id: 'salad',
  card: 'card-salad',
  pickLine: 'vo-pick-salad',
  // Nothing is carried on a board: the lettuce, the vegetables and then the bowl carry the salad from step to step.
  board: null,
  character: pizza.character,
  // Counts and thresholds come from the tuning table (core/tuning.ts, TUNING.salad).
  steps: [
    washHands,
    {
      type: 'wash',
      params: {
        target: 'basket',
        basin: 'sink-basin',
        faucet: 'faucet',
        stream: 'water-stream',
        hands: 'colander',
        bubble: 'water-drop',
        ...TUNING.salad.washVeg,
        line: 'vo-wash-veg',
        doneLine: 'vo-wash-veg-done',
      },
    },
    {
      type: 'knead',
      params: {
        stages: ['lettuce-head', 'lettuce-tear-1', 'lettuce-tear-2', 'lettuce-tear-3'],
        pressesPerStage: TUNING.salad.tear.pressesPerStage,
        place: 'board',
        board: 'cutting-board',
        size: 1.2,
        splash: LETTUCE,
        sound: 'tear',
        line: 'vo-tear',
        handoff: 'bin:lettuce',
        park: true,
      },
    },
    {
      type: 'choose',
      params: {
        options: [
          option('cucumber', 0xcfe8a8, 'piece-cucumber'),
          option('tomato', 0xe4523b, 'topping-tomato'),
          option('pepper', 0x7cc25a, 'topping-pepper'),
          option('carrot', 0xf28c28, 'piece-carrot'),
          option('onion', 0xe9bde0, 'topping-onion'),
        ],
        pick: TUNING.choose.pick,
        pauseMs: TUNING.choose.pauseMs,
        // gameplay round 4: Pipa wants two things, in order
        order: { line: 'vo-pipa-order', then: 'vo-then', first: 'vo-first-this' },
        bin: 'topping-bin',
        line: 'vo-choose-veg',
      },
    },
    {
      type: 'open-pour',
      params: {
        kind: 'open',
        closed: 'salad-bowl-back',
        open: 'salad-bowl-back',
        pourLine: 'vo-into-bowl',
        bowl: SALAD_BOWL,
        piece: 'piece-lettuce',
        ...TUNING.open,
        pourMs: TUNING.salad.transfer.ms,
        keep: { fills: ['salad-heap-1', 'salad-heap-2', 'salad-heap-3'] },
        sources: [{ handoff: 'bin:lettuce', image: 'lettuce-tear-3', piece: 'piece-lettuce' }, 'chosen'],
      },
    },
    {
      type: 'crush',
      params: {
        stages: ['lemon-half-1', 'lemon-half-2', 'lemon-half-3'],
        pressesPerStage: TUNING.salad.lemon.pressesPerStage,
        place: 'over-bowl',
        bowl: SALAD_BOWL,
        drop: 'juice-drop',
        splash: LEMON,
        sound: 'squeeze',
        line: 'vo-squeeze',
      },
    },
    {
      type: 'open-pour',
      params: {
        kind: 'open',
        closed: 'oil-bottle',
        open: 'oil-bottle',
        pourLine: 'vo-oil',
        bowl: SALAD_BOWL,
        piece: 'oil-drop',
        mouth: { x: 150, y: 30 },
        tilt: 125,
        pourSound: 'drizzle',
        ...TUNING.open,
        pourMs: TUNING.salad.oil.ms,
        keep: {},
      },
    },
    {
      type: 'sprinkle',
      params: {
        tool: 'salt-shaker',
        into: 'bowl',
        holes: { x: 130, y: 70 },
        piece: 'salt-shaker',
        count: TUNING.salad.salt.shakes,
        line: 'vo-salt',
        sound: 'salt',
      },
    },
    {
      type: 'stir',
      params: {
        bowl: SALAD_BOWL,
        from: 'salad-heap-3',
        to: 'salad-mixed',
        tool: 'salad-servers',
        toolAnchor: { x: 220, y: 500 },
        distance: TUNING.salad.mix.distance,
        splash: LETTUCE,
        sound: 'crunch',
        line: 'vo-mix',
        keep: true,
      },
    },
    {
      type: 'share',
      params: {
        slice: 'salad-portion',
        slices: TUNING.salad.serve.portions,
        line: 'vo-serve',
        forMom: 'vo-bowl-mom',
        momYum: 'vo-fresh',
        forPet: 'vo-bowl-pipa',
        eat: 'crunch',
        portions: { image: 'salad-portion', anchor: { x: 160, y: 146 }, count: TUNING.salad.serve.portions, bowl: 'serving-bowl', fill: 'salad-mixed' },
      },
    },
    {
      type: 'photo',
      params: {
        frame: 'photo-frame-salad',
        backdrop: 'bg-kitchen-landscape',
        line: 'vo-photo-salad',
        finale: 'vo-finale-salad',
        bye: 'vo-bye',
        bowl: { back: 'salad-bowl-back', fill: 'salad-mixed', front: 'salad-bowl-front' },
      },
    },
  ],
};
