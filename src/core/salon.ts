/**
 * The Mermaid Salon's data (research/mermaid-dressup-spec.md 4-7): the stages, the three customers, the catalogue, the
 * colours, a customer's look (what she wears; kept in the lagoon as `lagoon.salon.<id>`), and the defaults. Salon PRs 2-4
 * add their own blocks at the end, marked `// salon PR n`, so the parallel PRs never edit each other's lines.
 */
import { readMark, writeMark } from './sea';

// ---------------------------------------------------------------- salon PR 1: the catalogue

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
export const GEM_SLOTS: readonly { x: number; y: number }[] = [
  { x: 300, y: 148 }, { x: 232, y: 196 }, { x: 368, y: 196 }, { x: 206, y: 316 }, { x: 394, y: 316 }, { x: 300, y: 386 },
];

/** Each customer (spec 4): her skin (for the stand-ins), her own hair colour, her lips, the pitch of her giggle. */
export const CUSTOMER = {
  marina: { skin: '#F4CFAE', hair: '#E8A93A', lips: '#E8798F', voiceRate: 1.0, style: 'waves' },
  coral: { skin: '#8D5A3B', hair: '#3A2418', lips: '#C4566B', voiceRate: 0.9, style: 'curls' },
  pearl: { skin: '#FBE3D3', hair: '#2B2B38', lips: '#E68AA0', voiceRate: 1.12, style: 'bob' },
} as const satisfies Record<CustomerId, { skin: string; hair: string; lips: string; voiceRate: number; style: HairStyle }>;

/** Her tail's own colour before she sprays it (the natural tail). */
export const NATURAL_TAIL: Record<CustomerId, string> = { marina: '#9A86E8', coral: '#3FB8A8', pearl: '#F58FB4' };

/** The spray's colours. Light enough that a white-drawn hair keeps its shading under the tint (multiply). */
export const DYE_HEX: Record<Dye, string> = {
  pink: '#FF8FC0',
  purple: '#A98BEF',
  blue: '#62C3EE',
  gold: '#F7CC52',
  seagreen: '#5FD3B0',
  pearl: '#F6F1F8',
};
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
export const hairHex = (id: CustomerId, c: Dye | 'natural') => hexOf(c === 'natural' ? CUSTOMER[id].hair : DYE_HEX[c]);
export const tailHex = (id: CustomerId, c: Dye | 'natural') => hexOf(c === 'natural' ? NATURAL_TAIL[id] : DYE_HEX[c]);

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
