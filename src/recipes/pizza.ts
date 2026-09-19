import { TUNING } from '../core/tuning';
import type { Recipe } from './types';

/** Tomato red of the crushed tomatoes and the sauce (juice drops); flour white for the dough. */
const TOMATO = 0xe4523b;
const FLOUR = 0xfff6e6;

export const pizza: Recipe = {
  id: 'pizza',
  card: 'card-pizza',
  board: 'pizza-board',
  character: {
    body: 'character-body',
    eyesOpen: 'character-eyes-open',
    eyesBlink: 'character-eyes-blink',
    eyesSurprised: 'character-eyes-surprised',
    eyesHappy: 'character-eyes-happy',
    mouthClosed: 'character-mouth-closed',
    mouthOpen: 'character-mouth-open',
    mouthChew: 'character-mouth-chew',
  },
  // Counts and thresholds come from the tuning table (core/tuning.ts).
  steps: [
    {
      type: 'wash',
      params: {
        basin: 'sink-basin',
        faucet: 'faucet',
        stream: 'water-stream',
        hands: 'kid-hands',
        bubble: 'bubble',
        ...TUNING.wash,
        line: 'vo-wash',
        rubLine: 'vo-wash-rub',
        doneLine: 'vo-wash-done',
      },
    },
    {
      type: 'knead',
      params: {
        stages: ['dough-knead-1', 'dough-knead-2', 'dough-knead-3', 'dough-ball'],
        pressesPerStage: TUNING.knead.pressesPerStage,
        place: 'board',
        dent: 'press-dent',
        splash: FLOUR,
        sound: 'squish',
        line: 'vo-knead',
        handoff: 'dough-ball',
      },
    },
    { type: 'roll', params: { ball: 'dough-ball', flat: 'dough-flat', tool: 'rolling-pin', rubWidths: TUNING.roll.rubWidths } },
    {
      type: 'crush',
      params: {
        stages: ['sauce-stage-0', 'sauce-stage-1', 'sauce-stage-2'],
        pressesPerStage: TUNING.crush.pressesPerStage,
        place: 'bowl',
        bowl: { back: 'prep-bowl-back', front: 'prep-bowl-front' },
        dent: 'press-dent',
        splash: TOMATO,
        sound: 'squish',
        line: 'vo-crush',
      },
    },
    {
      type: 'stir',
      params: {
        bowl: { back: 'prep-bowl-back', front: 'prep-bowl-front' },
        from: 'sauce-stage-2',
        to: 'sauce-stage-3',
        tool: 'spoon-wood',
        distance: TUNING.stir.distance,
        splash: TOMATO,
        line: 'vo-stir',
        handoffAs: 'sauce-bowl',
      },
    },
    { type: 'spread', params: { source: 'sauce-bowl', blob: 'sauce-blob', coverage: TUNING.spread.coverage } },
    {
      type: 'grate',
      params: {
        tool: 'grater',
        block: 'cheese-block',
        piles: ['cheese-pile-1', 'cheese-pile-2', 'cheese-pile-3'],
        piece: 'cheese-shred',
        distance: TUNING.grate.distance,
        shredEvery: TUNING.grate.shredEvery,
        sound: 'grate',
        line: 'vo-grate',
      },
    },
    {
      type: 'sprinkle',
      params: { tool: 'cheese-handful', toolKind: 'handful', source: 'cheese-pile-3', piece: 'cheese-shred', count: TUNING.sprinkle.count },
    },
    {
      type: 'decorate',
      params: {
        items: ['topping-tomato', 'topping-olive', 'topping-mushroom', 'topping-corn', 'topping-pepper', 'topping-onion'],
        doneButton: 'btn-done',
      },
    },
    { type: 'bake', params: { inside: 'oven-inside', closed: 'oven-closed', open: 'oven-open', bakeMs: 5000, bakedTint: 0xffd49a } },
    { type: 'feed', params: { slice: 'pizza-slice', slices: 6 } },
  ],
};
