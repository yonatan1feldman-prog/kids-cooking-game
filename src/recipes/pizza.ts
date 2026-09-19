import { TUNING } from '../core/tuning';
import type { Recipe } from './types';

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
    { type: 'roll', params: { ball: 'dough-ball', flat: 'dough-flat', tool: 'rolling-pin', rubWidths: TUNING.roll.rubWidths } },
    { type: 'spread', params: { source: 'sauce-bowl', blob: 'sauce-blob', coverage: TUNING.spread.coverage } },
    { type: 'sprinkle', params: { tool: 'cheese-shaker', piece: 'cheese-shred', count: TUNING.sprinkle.count } },
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
