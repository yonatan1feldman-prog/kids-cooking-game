/**
 * The Mermaid Salon's data (research/mermaid-dressup-spec.md 4-7): the stages, the three customers, the catalogue, the
 * colours, a customer's look (what she wears; kept in the lagoon as `lagoon.salon.<id>`), and the defaults. Salon PRs 2-4
 * add their own blocks at the end, marked `// salon PR n`, so the parallel PRs never edit each other's lines.
 */
import { readMark, writeMark } from './sea';

// ---------------------------------------------------------------- salon PR 1: the catalogue

import { ART_SALON } from './salonAssets';

/** The visit, in order (SeaSalon runs them; a stage with no class yet is skipped). */
export const SALON_STAGES = ['pick', 'scrub', 'hair', 'face', 'outfit', 'sparkle', 'mirror'] as const;
export type SalonStageId = (typeof SALON_STAGES)[number];

export const CUSTOMERS = ['marina', 'coral', 'pearl'] as const;
export type CustomerId = (typeof CUSTOMERS)[number];

export const HAIR_STYLES = ['waves', 'curls', 'braid', 'bun', 'bob'] as const;
export type HairStyle = (typeof HAIR_STYLES)[number];
export const TAIL_SHAPES = ['classic', 'frilly', 'long'] as const;
export type TailShape = (typeof TAIL_SHAPES)[number];
export const TOPS = ['shells', 'starfish', 'frill'] as const;
export type Top = (typeof TOPS)[number];
export const CROWNS = ['pearl', 'starfish', 'coral'] as const;
export type Crown = (typeof CROWNS)[number];
/** Two in the column; `marina` (the shell treasure's necklace) takes `star`'s cell once she has it (salon PR 2). */
export const NECKLACES = ['pearl', 'star', 'marina'] as const;
export type Necklace = (typeof NECKLACES)[number];
export const GEMS = ['star', 'heart'] as const;
export type Gem = (typeof GEMS)[number];
/** The spray's six colours (hair, tail), in the order a tap on the spray goes through them. */
export const DYE = ['pink', 'purple', 'blue', 'gold', 'seagreen', 'pearl'] as const;
export type Dye = (typeof DYE)[number];
/** The make-up's four colours (blush, eye shadow, lipstick). */
export const PAINT = ['pink', 'purple', 'blue', 'gold'] as const;
export type Paint = (typeof PAINT)[number];
export const BLUSH_SHAPES = ['round', 'heart', 'star'] as const;
export type BlushShape = (typeof BLUSH_SHAPES)[number];

/** What a customer wears (spec 6). Points are in her 600x700 frame. */
export interface Look {
  hair: HairStyle;
  hairColour: Dye | 'natural';
  tail: TailShape;
  tailColour: Dye | 'natural';
  top: Top;
  crown: Crown | null;
  clip: boolean;
  necklace: Necklace | null;
  /** Both cheeks (0..1 each). */
  blush: { shape: BlushShape; colour: Paint; amount: [number, number] } | null;
  shadow: { colour: Paint; amount: number } | null;
  lips: Paint | null;
  /** Up to 12 sparkles on her face. */
  glitter: [number, number][];
  /** Up to 6 gems, each on one of the six places of her face. */
  gems: { kind: Gem; slot: 0 | 1 | 2 | 3 | 4 | 5 }[];
  /** The comb's shine on her hair. */
  shine: boolean;
}

/**
 * The six places a gem sticks on her face (her 600x700 frame): forehead, over each eye, the two cheeks, the chin (salon
 * PR 2 places them; the numbers follow gen_kids' face, PR V's FACE_ANCHORS may move them).
 */
export const GEM_SLOTS: readonly { x: number; y: number }[] = ART_SALON.face.gemSlots;

/** Each customer (spec 4): her skin (for the stand-ins), her own hair colour, her lips, the pitch of her giggle. */
export const CUSTOMER = {
  marina: { skin: '#F4CFAE', hair: '#E8A93A', lips: '#E8798F', voiceRate: 1.0, style: 'waves' },
  coral: { skin: '#8D5A3B', hair: '#3A2418', lips: '#C4566B', voiceRate: 0.9, style: 'curls' },
  pearl: { skin: '#FBE3D3', hair: '#2B2B38', lips: '#E68AA0', voiceRate: 1.12, style: 'bob' },
} as const satisfies Record<CustomerId, { skin: string; hair: string; lips: string; voiceRate: number; style: HairStyle }>;


/** The spray's colours (PR V's tints, compensated for the grey of the white-drawn hair: ART_SALON.dye). */
const hex6 = (n: number) => '#' + n.toString(16).padStart(6, '0');
export const DYE_HEX = Object.fromEntries(DYE.map((d) => [d, hex6(ART_SALON.dye[d])])) as Record<Dye, string>;
export const PAINT_HEX: Record<Paint, string> = { pink: '#F58FB4', purple: '#9B7BE0', blue: '#4FB8E0', gold: '#F7C948' };

/** Mom says a colour with the name lines she already has (gold is yellow, sea green is green, pearl is white). */
export const DYE_NAME: Record<Dye, string> = {
  pink: 'name-pink',
  purple: 'name-purple',
  blue: 'name-blue',
  gold: 'name-yellow',
  seagreen: 'name-green',
  pearl: 'name-white',
};

/** A colour as a number for setTint. */
export const hexOf = (h: string) => parseInt(h.replace('#', ''), 16);
export const hairHex = (id: CustomerId, c: Dye | 'natural') => ART_SALON.hair[c === 'natural' ? (`natural-${id}` as const) : c];
export const tailHex = (id: CustomerId, c: Dye | 'natural') => ART_SALON.tail[c === 'natural' ? (`natural-${id}` as const) : c];
/** Her mouth's tint: the lipstick, else her own lips (ART_SALON.lips). */
export const lipsHex = (id: CustomerId, p: Paint | null) => ART_SALON.lips[p ?? (`natural-${id}` as const)];

/** A customer who has never been to the salon: her own hair in her own style, the classic tail, the shell top. */
export function defaultLook(id: CustomerId): Look {
  return {
    hair: CUSTOMER[id].style,
    hairColour: 'natural',
    tail: 'classic',
    tailColour: 'natural',
    top: 'shells',
    crown: null,
    clip: false,
    necklace: null,
    blush: null,
    shadow: null,
    lips: null,
    glitter: [],
    gems: [],
    shine: false,
  };
}

/** Her look from her last visit (`lagoon.salon.<id>`), filled up with the defaults; else the default. */
export function savedLook(id: CustomerId): Look {
  const m = readMark<Partial<Look>>(`salon.${id}`);
  const d = defaultLook(id);
  if (!m || typeof m !== 'object') return d;
  const ok = <T extends string>(v: unknown, list: readonly T[], fall: T): T => (list.includes(v as T) ? (v as T) : fall);
  return {
    ...d,
    ...m,
    hair: ok(m.hair, HAIR_STYLES, d.hair),
    hairColour: ok(m.hairColour, [...DYE, 'natural'] as const, 'natural'),
    tail: ok(m.tail, TAIL_SHAPES, d.tail),
    tailColour: ok(m.tailColour, [...DYE, 'natural'] as const, 'natural'),
    top: ok(m.top, TOPS, d.top),
    glitter: Array.isArray(m.glitter) ? m.glitter.slice(0, 12) : [],
    gems: Array.isArray(m.gems) ? m.gems.slice(0, 6) : [],
  };
}

/** The end of a visit: her look stays (the lagoon shows Marina's, the bench all three); and who came last. */
export function keepLook(id: CustomerId, look: Look) {
  writeMark(`salon.${id}`, look);
  writeMark('salon.last', id);
}

/** Every image a look shows (the lagoon loads only these for Marina, salon PR 4). */
export function lookImages(look: Look): string[] {
  const keys = [`hair-back-${look.hair}`, `hair-front-${look.hair}`, `tail-${look.tail}`, `tail-${look.tail}-shine`, `top-${look.top}`];
  if (look.shine) keys.push(`hair-shine-${look.hair}`);
  if (look.crown) keys.push(`crown-${look.crown}`);
  if (look.clip) keys.push('clip-flower');
  if (look.necklace) keys.push(`necklace-${look.necklace}`);
  for (const g of new Set(look.gems.map((q) => q.kind))) keys.push(`gem-${g}`);
  return keys;
}

/** A customer's own layers (cust-<id>-*). */
export const customerImages = (id: CustomerId) =>
  ['body', 'eyes-open', 'eyes-blink', 'eyes-happy', 'eyes-surprised', 'mouth-closed', 'mouth-open', 'mouth-chew'].map((l) => `cust-${id}-${l}`);

// ---------------------------------------------------------------- salon PR 3: the wish (hard)

/**
 * One thing a customer wishes for on the hard level (spec 5.0, 6): a hair style or colour, a tail or its colour, a top
 * (the outfit), a crown, a necklace or a gem (the sparkle), her lips (the face). `stage` is where it is found.
 */
export type WishItem =
  | { hair: HairStyle }
  | { hairColour: Dye }
  | { tail: TailShape }
  | { tailColour: Dye }
  | { top: Top }
  | { crown: Crown }
  | { necklace: 'pearl' }
  | { gem: Gem }
  | { lips: Paint };

/** The stage of the visit where a wished thing is found. */
export function wishStage(w: WishItem): SalonStageId {
  if ('hair' in w || 'hairColour' in w) return 'hair';
  if ('tail' in w || 'tailColour' in w || 'top' in w) return 'outfit';
  if ('lips' in w) return 'face';
  return 'sparkle';
}

/** Her look has it (a gem: one of that kind anywhere on her face). */
export function wishMet(w: WishItem, l: Look): boolean {
  if ('hair' in w) return l.hair === w.hair;
  if ('hairColour' in w) return l.hairColour === w.hairColour;
  if ('tail' in w) return l.tail === w.tail;
  if ('tailColour' in w) return l.tailColour === w.tailColour;
  if ('top' in w) return l.top === w.top;
  if ('crown' in w) return l.crown === w.crown;
  if ('necklace' in w) return l.necklace === w.necklace;
  if ('gem' in w) return l.gems.some((g) => g.kind === w.gem);
  return l.lips === w.lips;
}

/**
 * The six wishes (by visit): three things each, from three different stages, so the wish goes with her through the
 * whole visit. (No star necklace: the shell treasure's necklace takes its cell once she has it.)
 */
export const WISH: readonly (readonly WishItem[])[] = [
  [{ hairColour: 'purple' }, { crown: 'starfish' }, { lips: 'pink' }],
  [{ hair: 'braid' }, { tail: 'long' }, { gem: 'heart' }],
  [{ hairColour: 'blue' }, { top: 'starfish' }, { necklace: 'pearl' }],
  [{ hair: 'bun' }, { lips: 'purple' }, { tail: 'frilly' }],
  [{ hairColour: 'pink' }, { tailColour: 'purple' }, { crown: 'pearl' }],
  [{ hair: 'curls' }, { top: 'frill' }, { gem: 'star' }],
];

/** When a stage of a wish is not in the game (yet), what she wishes for instead: things of the hair and the outfit. */
export const WISH_SPARE: readonly WishItem[] = [
  { tailColour: 'pink' }, { top: 'frill' }, { hairColour: 'seagreen' }, { tail: 'frilly' }, { tailColour: 'blue' }, { hair: 'bun' },
];

/** The same kind of wish, the next one along (a wish she already has on when she sits down is changed for this). */
export function wishNext(w: WishItem): WishItem {
  const next = <T>(list: readonly T[], v: T) => list[(list.indexOf(v) + 1) % list.length];
  if ('hair' in w) return { hair: next(HAIR_STYLES, w.hair) };
  if ('hairColour' in w) return { hairColour: next(DYE, w.hairColour) };
  if ('tail' in w) return { tail: next(TAIL_SHAPES, w.tail) };
  if ('tailColour' in w) return { tailColour: next(DYE, w.tailColour) };
  if ('top' in w) return { top: next(TOPS, w.top) };
  if ('crown' in w) return { crown: next(CROWNS, w.crown) };
  if ('gem' in w) return { gem: next(GEMS, w.gem) };
  if ('lips' in w) return { lips: next(PAINT, w.lips) };
  return w;
}

/** A wish's kind (its key in the look): two wishes of one kind never go together. */
export const wishKind = (w: WishItem) => Object.keys(w)[0] as keyof Look | 'gem';
