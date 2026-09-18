import type { Recipe } from './types';

export const pizza: Recipe = {
  id: 'pizza',
  card: 'card-pizza',
  steps: [
    { type: 'roll', params: { ball: 'dough-ball', flat: 'dough-flat', tool: 'rolling-pin', rubWidths: 7 } },
    { type: 'spread', params: { source: 'sauce-bowl', blob: 'sauce-blob', coverage: 0.7 } },
    { type: 'sprinkle', params: { tool: 'cheese-shaker', piece: 'cheese-shred', count: 45 } },
    {
      type: 'decorate',
      params: {
        items: ['topping-tomato', 'topping-olive', 'topping-mushroom', 'topping-corn', 'topping-pepper', 'topping-onion'],
        tray: 'tray',
        doneButton: 'btn-done',
      },
    },
    { type: 'bake', params: { closed: 'oven-closed', open: 'oven-open', bakeMs: 3200, bakedTint: 0xffd49a } },
    {
      type: 'feed',
      params: {
        slice: 'pizza-slice',
        slices: 6,
        body: 'character-body',
        eyes: 'character-eyes-happy',
        mouthOpen: 'character-mouth-open',
        mouthClosed: 'character-mouth-closed',
      },
    },
  ],
};
