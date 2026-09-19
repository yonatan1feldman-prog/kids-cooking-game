import { TUNING } from '../core/tuning';
import type { ImageKey } from '../core/assets';
import type { VegName } from '../core/vegArt';
import type { Recipe, StepDef } from './types';

/** Tomato red of the crushed tomatoes and the sauce (juice drops); flour white for the dough. */
const TOMATO = 0xe4523b;
const FLOUR = 0xfff6e6;

/** Cutting one vegetable (the chop step type): its pictures, and the colour of its juice drops. */
const chop = (veg: VegName, juice: number): StepDef => ({
  type: 'chop',
  params: {
    veg,
    whole: `veg-${veg}-whole`,
    slice: `veg-${veg}-slice`,
    inside: `veg-${veg}-inside`,
    board: 'cutting-board',
    knife: 'knife',
    ...TUNING.chop,
    juice,
    bin: 'topping-bin',
    topping: `topping-${veg}`,
    line: 'vo-cut',
    careful: 'vo-cut-careful',
  },
});

/** Opening a can or a jar and pouring it into the bowl (the open-pour step type). */
const openPour = (kind: 'can' | 'jar', closed: ImageKey, open: ImageKey, topping: 'corn' | 'olive'): StepDef => ({
  type: 'open-pour',
  params: {
    kind,
    closed,
    open,
    lid: kind === 'can' ? 'can-lid' : 'jar-lid',
    sound: kind === 'can' ? 'can-open' : 'jar-open',
    openLine: kind === 'can' ? 'vo-open-can' : 'vo-open-jar',
    pourLine: 'vo-pour',
    bowl: { back: 'prep-bowl-back', front: 'prep-bowl-front' },
    piece: `topping-${topping}`,
    bin: 'topping-bin',
    topping: `topping-${topping}`,
    ...TUNING.open,
    pourMs: TUNING.pour.ms,
  },
});

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
      type: 'choose',
      params: {
        options: [
          { id: 'tomato', image: 'veg-tomato-whole', topping: 'topping-tomato', prep: chop('tomato', TOMATO) },
          { id: 'mushroom', image: 'veg-mushroom-whole', topping: 'topping-mushroom', prep: chop('mushroom', 0xeadcc4) },
          { id: 'pepper', image: 'veg-pepper-whole', topping: 'topping-pepper', prep: chop('pepper', 0x7cc25a) },
          { id: 'onion', image: 'veg-onion-whole', topping: 'topping-onion', prep: chop('onion', 0xe9bde0) },
          { id: 'corn', image: 'can-corn-closed', topping: 'topping-corn', prep: openPour('can', 'can-corn-closed', 'can-corn-open', 'corn') },
          { id: 'olive', image: 'jar-olives-closed', topping: 'topping-olive', prep: openPour('jar', 'jar-olives-closed', 'jar-olives-open', 'olive') },
        ],
        pick: TUNING.choose.pick,
        pauseMs: TUNING.choose.pauseMs,
        bin: 'topping-bin',
        line: 'vo-choose',
      },
    },
    {
      type: 'decorate',
      params: {
        items: ['topping-tomato', 'topping-olive', 'topping-mushroom', 'topping-corn', 'topping-pepper', 'topping-onion'],
        doneButton: 'btn-done',
      },
    },
    {
      type: 'bake',
      params: {
        inside: 'oven-inside',
        closed: 'oven-closed',
        open: 'oven-open',
        bakeMs: TUNING.oven.bakeMs,
        bakedTint: 0xffd49a,
        panel: {
          panel: 'oven-panel',
          needle: 'oven-needle',
          glow: 'temp-glow',
          up: 'btn-temp-up',
          down: 'btn-temp-down',
          startOff: 'oven-start-off',
          startOn: 'oven-start-on',
          from: TUNING.oven.from,
          step: TUNING.oven.step,
          min: TUNING.oven.min,
          max: TUNING.oven.max,
          target: TUNING.oven.target,
          line: 'vo-temp',
          more: 'vo-temp-more',
          hot: 'vo-temp-hot',
          done: 'vo-temp-done',
        },
        mitts: { pair: 'oven-mitts', single: 'mitt-single', line: 'vo-mitts' },
      },
    },
    {
      type: 'share',
      params: { slice: 'pizza-slice', slices: TUNING.share.slices, line: 'vo-share', forMom: 'vo-slice-mom', momYum: 'vo-mom-yum', forPet: 'vo-slice-pipa' },
    },
  ],
};
