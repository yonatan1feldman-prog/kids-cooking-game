import { ART, type ImageKey } from '../core/assets';
import { TUNING } from '../core/tuning';
import type { VegName } from '../core/vegArt';
import { pizza } from './pizza';
import type { Recipe, StepDef } from './types';

/** The five vegetables the soup offers. */
type SoupVegName = Extract<VegName, 'carrot' | 'potato' | 'onion' | 'zucchini' | 'tomato'>;

/**
 * Vegetable soup: the sixth recipe, data on the existing step types plus one new one (`peel`, round 9).
 * Wash hands, wash the vegetables, choose three of five, peel the ones with a skin (carrot, potato), cut each one,
 * everything into the pot, the water, a little salt, light the stove, stir it while it cooks, serve Mom and Pipa,
 * the photo.
 */

const POT = { back: 'pot-back', front: 'pot-front' } as const;
/** The soup as it cooks: what the stirring goes through. */
const SOUP = ['soup-stage-1', 'soup-stage-2', 'soup-stage-3'] as const;

/** Cutting one vegetable: its pictures, its juice colour, and the piece it becomes in the pot (shown on its bin). */
const chop = (veg: SoupVegName, juice: number, piece: ImageKey): StepDef => ({
  type: 'chop',
  params: {
    veg,
    whole: `veg-${veg}-whole`,
    slice: `veg-${veg}-slice`,
    inside: `veg-${veg}-inside`,
    board: 'cutting-board',
    knife: 'knife',
    ...TUNING.soup.chop,
    juice,
    bin: 'topping-bin',
    topping: piece,
    line: 'vo-cut',
    careful: 'vo-cut-careful',
  },
});

/** Peeling the ones with a skin: the same board and the same place, just before they are cut. */
const peel = (veg: 'carrot' | 'potato', splash: number): StepDef => ({
  type: 'peel',
  params: {
    veg,
    whole: `veg-${veg}-whole`,
    skin: `peel-skin-${veg}`,
    board: 'cutting-board',
    peeler: 'peeler',
    strip: 'peel-strip',
    ...TUNING.soup.peel,
    splash,
    line: 'vo-peel',
    doneLine: 'vo-peel-done',
    sound: 'peel',
  },
});

const option = (id: SoupVegName, juice: number, piece: ImageKey, skin?: number) => ({
  id,
  name: `name-${id}` as const,
  image: `veg-${id}-whole` as ImageKey,
  topping: piece,
  // A carrot and a potato are peeled first; the others go straight to the board.
  prep: skin === undefined ? chop(id, juice, piece) : [peel(id as 'carrot' | 'potato', skin), chop(id, juice, piece)],
});

const CARROT = 0xf28c28;
const POTATO = 0xd9b273;
const ZUCCHINI = 0x9fd36b;

export const soup: Recipe = {
  id: 'soup',
  card: 'card-soup',
  pickLine: 'vo-pick-soup',
  // Nothing rides on a board: the vegetables, then the pot, carry the soup from step to step.
  board: null,
  character: pizza.character,
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
        hands: 'colander',
        bubble: 'water-drop',
        ...TUNING.soup.washVeg,
        line: 'vo-wash-veg',
        doneLine: 'vo-wash-veg-done',
      },
    },
    {
      type: 'choose',
      params: {
        options: [
          option('carrot', CARROT, 'piece-carrot', CARROT),
          option('potato', POTATO, 'veg-potato-slice', POTATO),
          option('onion', 0xe9bde0, 'topping-onion'),
          option('zucchini', ZUCCHINI, 'veg-zucchini-slice'),
          option('tomato', 0xe4523b, 'topping-tomato'),
        ],
        pick: TUNING.choose.pick,
        pauseMs: TUNING.choose.pauseMs,
        bin: 'topping-bin',
        line: 'vo-choose-veg',
      },
    },
    // Everything she cut goes into the pot: the bins are carried over and tipped in, and the heap grows.
    {
      type: 'open-pour',
      params: {
        kind: 'open',
        closed: 'pot-back',
        open: 'pot-back',
        pourLine: 'vo-into-pot',
        bowl: POT,
        piece: 'piece-carrot',
        ...TUNING.open,
        pourMs: TUNING.soup.transfer.ms,
        keep: { fills: ['pot-heap-1', 'pot-heap-2', 'pot-heap-3'] },
        sources: ['chosen'],
      },
    },
    // The water, from the jug into the pot.
    {
      type: 'open-pour',
      params: {
        kind: 'open',
        closed: 'water-jug',
        open: 'water-jug',
        pourLine: 'vo-water',
        bowl: POT,
        piece: 'water-drop',
        mouth: ART.soup.jugMouth,
        tilt: 120,
        pourSound: 'pour',
        ...TUNING.open,
        pourMs: TUNING.soup.water.ms,
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
    // Light the stove, then stir the soup while it cooks: three stages, steam, the bake loop.
    {
      type: 'stir',
      params: {
        bowl: POT,
        from: SOUP[0],
        via: [SOUP[1]],
        to: SOUP[2],
        tool: 'spoon-wood',
        distance: TUNING.soup.stir.distance,
        splash: CARROT,
        sound: 'squish',
        line: 'vo-stir-soup',
        doneLine: 'vo-soup-ready',
        keep: true,
        cook: true,
        stove: {
          knobOff: 'stove-knob-off',
          knobOn: 'stove-knob-on',
          flame: 'flame',
          knobAt: ART.soup.knobAt,
          flameAt: ART.soup.flameAt,
          line: 'vo-stove',
        },
      },
    },
    // A ladle of soup to each bowl, as the salad serves its portions.
    {
      type: 'share',
      params: {
        slice: 'soup-portion',
        slices: TUNING.soup.serve.bowls,
        line: 'vo-serve-soup',
        forMom: 'vo-soup-mom',
        momYum: 'vo-soup-yum',
        forPet: 'vo-soup-pipa',
        eat: 'slurp',
        portions: {
          image: 'soup-portion',
          anchor: ART.soup.portionAnchor,
          count: TUNING.soup.serve.bowls,
          bowl: 'soup-bowl-empty',
          fill: 'soup-bowl-full',
        },
      },
    },
    {
      type: 'photo',
      params: {
        frame: 'photo-frame-soup',
        backdrop: 'bg-kitchen-landscape',
        line: 'vo-photo-soup',
        finale: 'vo-finale-soup',
        bye: 'vo-bye',
        bowl: { back: 'pot-back', fill: SOUP[2], front: 'pot-front' },
      },
    },
  ],
};
