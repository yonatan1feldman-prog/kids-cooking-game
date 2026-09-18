import type { Recipe } from './types';

export const pizza: Recipe = {
  id: 'pizza',
  card: 'card-pizza',
  board: 'tray',
  steps: [
    { type: 'roll', params: { ball: 'dough-ball', flat: 'dough-flat', tool: 'rolling-pin', rubWidths: 5 } },
    { type: 'spread', params: { source: 'sauce-bowl', blob: 'sauce-blob', coverage: 0.7 } },
    { type: 'sprinkle', params: { tool: 'cheese-shaker', piece: 'cheese-shred', count: 45 } },
    {
      type: 'decorate',
      params: {
        items: ['topping-tomato', 'topping-olive', 'topping-mushroom', 'topping-corn', 'topping-pepper', 'topping-onion'],
        doneButton: 'btn-done',
      },
    },
    { type: 'bake', params: { inside: 'oven-inside', closed: 'oven-closed', open: 'oven-open', bakeMs: 3500, bakedTint: 0xffd49a } },
    {
      type: 'feed',
      params: {
        slice: 'pizza-slice',
        slices: 6,
        body: 'character-body',
        eyesOpen: 'character-eyes-open',
        eyesBlink: 'character-eyes-blink',
        eyesSurprised: 'character-eyes-surprised',
        eyesHappy: 'character-eyes-happy',
        mouthClosed: 'character-mouth-closed',
        mouthOpen: 'character-mouth-open',
        mouthChew: 'character-mouth-chew',
      },
    },
  ],
};
