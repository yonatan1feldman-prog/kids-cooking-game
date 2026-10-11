import Phaser from 'phaser';
import type { ImageKey, SoundKey } from './assets';
import type { VoiceKey } from './audio';
import type { CharacterDef } from '../recipes/types';

/**
 * Mom's farm (research/farm-spec.md): the data. Five animals, each with a few chores (feed, brush, milk, shear...),
 * each chore a few stages, one tool or thing each. The scene (scenes/FarmScene.ts) does the touching.
 * Counts are per level, `[easy, hard]`; they live here, not in core/tuning.ts, so the farm stays in its own files.
 */
export const FARM_TUNING = {
  /** Animals in a visit, chores per animal (the hard level does every chore an animal has). */
  animals: [3, 4],
  /** A spare tool on the tray that is not for now (it hops back). */
  decoys: [0, 1],
  /** The horse: pieces of food; brushing: zones (in turn) x finger travel per zone (x k). */
  horseFeed: [3, 4],
  brushZones: [1, 3],
  brushRub: 900,
  /** Teeth: smudges, finger travel per smudge. */
  teeth: 4,
  teethRub: 420,
  /** The cow: armfuls of hay; squeezes (hard: the two teats in turn); the bottles; ms of pouring per bottle. */
  cowHay: [1, 2],
  squeezes: [6, 10],
  bottles: 2,
  pourMs: 1500,
  /** The sheep: fleece bands (hard: only a stroke down along a band counts); finger travel per band (x its height). */
  bands: [4, 6],
  bandRub: 0.6,
  /** The angle a stroke may be off straight down and still shear (hard). */
  bandAngle: 35,
  /** Winding the wool: finger travel round the ball (x k); hard: the arrows' way, turning round half-way. */
  wind: [2400, 3600],
  /** The hens: grains (one per `grainGap` x k of the scoop's travel over the yard); eggs (= hens). */
  grain: [8, 12],
  grainGap: 90,
  eggs: [3, 4],
  /** The pig: mud splats, finger travel per splat; soap: how much of her has to be bubbly; pump taps to rinse; food. */
  mud: [3, 5],
  mudRub: 450,
  foam: [0.6, 0.85],
  rinse: [2, 3],
  pigFeed: [2, 3],
  /** Hard: what the horse or the pig wants shows in a bubble, then goes; a tap on them shows it again. */
  rememberMs: 6000,
  peekMs: 2500,
  /** Mom's help: how long one piece of help takes at most (ms). */
  helpMs: 9000,
} as const;

export type AnimalId = 'horse' | 'cow' | 'sheep' | 'hens' | 'pig';
export type ChoreId = 'feed' | 'brush' | 'teeth' | 'hay' | 'milk' | 'pour' | 'shear' | 'wind' | 'ribbon' | 'grain' | 'eggs' | 'chick' | 'wash' | 'mud' | 'soap' | 'pigfeed';
/** A stage of a chore: one tool or thing, one kind of touch. */
export type StageId = 'feed' | 'brush' | 'teeth' | 'hay' | 'bell' | 'bucket' | 'milk' | 'pour' | 'shear' | 'wind' | 'ribbon' | 'grain' | 'eggs' | 'chick' | 'mud' | 'soap' | 'rinse' | 'pigfeed';

export interface Chore {
  id: ChoreId;
  /** Its picture on its card (on the farm-card disc). */
  icon: ImageKey;
  /** Its stages on each level. */
  stages: [StageId[], StageId[]];
  /** What has to be done first (hard: she chooses the order, but this one waits). */
  after?: ChoreId;
}

export interface Animal {
  id: AnimalId;
  name: VoiceKey;
  thanks: VoiceKey;
  sound: SoundKey;
  /** Her wordless voice's pitch (giggles, yays). */
  rate: number;
  /** Layers (not the hens: they are three or four pictures, not one character). */
  def: CharacterDef | null;
  /** Her chores, easy and hard. */
  chores: [ChoreId[], ChoreId[]];
}

const layers = (id: string): CharacterDef => ({
  body: `farm-${id}-body`,
  eyesOpen: `farm-${id}-eyes-open`,
  eyesBlink: `farm-${id}-eyes-blink`,
  eyesHappy: `farm-${id}-eyes-happy`,
  eyesSurprised: `farm-${id}-eyes-surprised`,
  mouthClosed: `farm-${id}-mouth-closed`,
  mouthOpen: `farm-${id}-mouth-open`,
  mouthChew: `farm-${id}-mouth-chew`,
}) as CharacterDef;

export const CHORES: Record<ChoreId, Chore> = {
  feed: { id: 'feed', icon: 'farm-carrot', stages: [['feed'], ['feed']] },
  brush: { id: 'brush', icon: 'farm-brush', stages: [['brush'], ['brush']] },
  teeth: { id: 'teeth', icon: 'tool-toothbrush', stages: [['teeth'], ['teeth']], after: 'feed' },
  hay: { id: 'hay', icon: 'hay-bale', stages: [['hay'], ['hay', 'bell']] },
  milk: { id: 'milk', icon: 'milk-bucket', stages: [['milk'], ['bucket', 'milk']], after: 'hay' },
  pour: { id: 'pour', icon: 'milk-bottle-full', stages: [['pour'], ['pour']], after: 'milk' },
  shear: { id: 'shear', icon: 'farm-shears', stages: [['shear'], ['shear']] },
  wind: { id: 'wind', icon: 'yarn-ball', stages: [['wind'], ['wind']], after: 'shear' },
  ribbon: { id: 'ribbon', icon: 'sheep-ribbon-red', stages: [['ribbon'], ['ribbon']], after: 'shear' },
  grain: { id: 'grain', icon: 'grain-scoop', stages: [['grain'], ['grain']] },
  eggs: { id: 'eggs', icon: 'egg-white', stages: [['eggs'], ['eggs']] },
  chick: { id: 'chick', icon: 'farm-chick', stages: [['chick'], ['chick']], after: 'eggs' },
  wash: { id: 'wash', icon: 'farm-sponge', stages: [['mud', 'soap', 'rinse'], ['mud', 'soap', 'rinse']] },
  mud: { id: 'mud', icon: 'farm-sponge', stages: [['mud'], ['mud']] },
  soap: { id: 'soap', icon: 'farm-soap', stages: [['soap', 'rinse'], ['soap', 'rinse']], after: 'mud' },
  pigfeed: { id: 'pigfeed', icon: 'farm-corn', stages: [['pigfeed'], ['pigfeed']] },
};

export const ANIMALS: Animal[] = [
  { id: 'horse', name: 'name-horse', thanks: 'vo-farm-thanks-horse', sound: 'neigh', rate: 0.85, def: layers('horse'), chores: [['feed', 'brush'], ['feed', 'brush', 'teeth']] },
  { id: 'cow', name: 'name-cow', thanks: 'vo-farm-thanks-cow', sound: 'moo', rate: 0.75, def: layers('cow'), chores: [['hay', 'milk'], ['hay', 'milk', 'pour']] },
  { id: 'sheep', name: 'name-sheep', thanks: 'vo-farm-thanks-sheep', sound: 'baa', rate: 1.1, def: layers('sheep'), chores: [['shear', 'wind'], ['shear', 'wind', 'ribbon']] },
  { id: 'hens', name: 'name-hens', thanks: 'vo-farm-thanks-hens', sound: 'cluck', rate: 1.3, def: null, chores: [['grain', 'eggs'], ['grain', 'eggs', 'chick']] },
  { id: 'pig', name: 'name-pig', thanks: 'vo-farm-thanks-pig', sound: 'oink', rate: 1.0, def: layers('pig'), chores: [['wash', 'pigfeed'], ['mud', 'soap', 'pigfeed']] },
];

/** Mom's line for each stage (said as it starts). */
export const STAGE_LINE: Record<StageId, VoiceKey | null> = {
  feed: 'vo-horse-feed',
  brush: 'vo-horse-brush',
  teeth: 'vo-horse-teeth',
  hay: 'vo-cow-hay',
  bell: 'vo-cow-bell',
  bucket: 'vo-cow-bucket',
  milk: 'vo-cow-milk',
  pour: 'vo-cow-pour',
  shear: 'vo-sheep-shear',
  wind: 'vo-sheep-wind',
  ribbon: 'vo-sheep-ribbon',
  grain: 'vo-hens-grain',
  eggs: 'vo-hens-eggs',
  chick: 'vo-hens-chick',
  mud: 'vo-pig-muddy',
  soap: 'vo-pig-soap',
  rinse: 'vo-pig-rinse',
  pigfeed: 'vo-pig-feed',
};

/** The tools a stage lays on the tray (the spare tool on the hard level is one not in the list). */
export const SPARE_TOOLS: ImageKey[] = ['farm-brush', 'farm-shears', 'farm-soap', 'farm-sponge', 'grain-scoop'];

/** Which animals come today: `n` of the five, the order the child picks them in is hers. */
export function planVisit(n: number): Animal[] {
  const forced = (globalThis as { __farmPlan?: string[] }).__farmPlan;
  if (forced?.length) return forced.map((id) => ANIMALS.find((a) => a.id === id)!).filter(Boolean);
  return Phaser.Utils.Array.Shuffle([...ANIMALS]).slice(0, n);
}
