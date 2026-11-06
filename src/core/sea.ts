/**
 * The mermaid world's data (research/mermaid-spec.md 3-4): what each activity is made of, its easy/hard counts, and the
 * marks it leaves in the lagoon (localStorage, never shown as a number). Every activity adds its own block, marked with
 * its PR, so the parallel PRs never edit each other's lines.
 */

export type Pt = { x: number; y: number };

/** The same choice on the same visit, another one the next time (list[visit mod length]). */
export const byVisit = <X>(list: readonly X[], run: number): X => list[((run % list.length) + list.length) % list.length];

/** A lagoon mark: what an activity left there (spec 2: the progress is in the things, never a counter). */
export function readMark<T>(key: string): T | null {
  try {
    const v = localStorage.getItem(`lagoon.${key}`);
    return v ? (JSON.parse(v) as T) : null;
  } catch {
    return null;
  }
}
export function writeMark(key: string, value: unknown) {
  try {
    localStorage.setItem(`lagoon.${key}`, JSON.stringify(value));
  } catch {
    /* the mark is simply not kept */
  }
}

// ---------------------------------------------------------------- mermaid PR 2: the sparkly tail

/** The six paints in their shells (left column, top to bottom), each said by Mom with its name line. */
export const SEA_PAINTS = ['pink', 'blue', 'purple', 'yellow', 'green', 'white'] as const;
export type SeaPaint = (typeof SEA_PAINTS)[number];
export const SEA_PAINT_HEX: Record<SeaPaint, string> = {
  pink: '#F58FB4',
  blue: '#4FB8E0',
  purple: '#9B7BE0',
  yellow: '#F7C948',
  green: '#5CC98A',
  white: '#F7F4EE',
};

/** The tail mark: each area's paint (null = not painted) and whether she rubbed glitter on it. */
export interface TailMark {
  fills: (SeaPaint | null)[];
  glitter: boolean[];
}

export const TAIL = {
  /** How long a paint takes to spread over a scale from the finger (ms). */
  fillMs: 380,
  /** Finger travel (world units at k 1) that rubs glitter onto a scale for good. */
  glitterRub: 260,
  /** Hard: the pattern's two paints, by visit (Mom paints the first four scales, she goes on). */
  patterns: [['pink', 'blue'], ['purple', 'yellow'], ['green', 'pink'], ['blue', 'white']] as const satisfies readonly (readonly [SeaPaint, SeaPaint])[],
  /** Hard: how many scales Mom paints to show the pattern. */
  shown: 4,
  /** Easy and the fin: how long after everything is painted the done button waits (free decorating's 15 s rule). */
  doneAfterMs: 15000,
};

// ---------------------------------------------------------------- mermaid PR 2: the swim with Marina

/**
 * Marina's three paths (one per visit, `byVisit`), as points in the room left of Mom (0..1 across, 0..1 down); the
 * game draws them as a smooth dotted line from her start (left) to the treasure chest (right).
 */
export const RIDE_PATHS: readonly (readonly [number, number][])[] = [
  [[0.03, 0.8], [0.16, 0.5], [0.3, 0.22], [0.46, 0.42], [0.56, 0.78], [0.7, 0.66], [0.82, 0.34], [0.96, 0.78]],
  [[0.03, 0.52], [0.15, 0.22], [0.3, 0.56], [0.44, 0.84], [0.58, 0.52], [0.7, 0.2], [0.84, 0.46], [0.96, 0.8]],
  [[0.03, 0.84], [0.2, 0.7], [0.3, 0.3], [0.46, 0.2], [0.6, 0.46], [0.68, 0.82], [0.84, 0.62], [0.96, 0.8]],
];

export const RIDE = {
  // (five rings and the pearls between them, easy 5, hard 6 + one over each red ring = 8: SeaRide spaces them evenly)
  /** Hard: two red rings to go over (the path forks round them). */
  forks: 2,
  /** How far the way over a red ring rises above it (fraction of the room's height). */
  forkRise: 0.42,
  /** Half the fork's length along the path (fraction of the path). */
  forkHalf: 0.07,
  /** The finger leads Marina while it is this near the path ahead (world units at k 1; forgiving, like the magnet). */
  reach: 190,
  /** How far ahead along the path one move may look for the finger (world units at k 1). */
  lookAhead: 320,
  /** Marina's top swimming speed (world units a second at k 1): she glides after the finger, never jumps. */
  speed: 1500,
  /** The gap between two dots of the path (world units at k 1). */
  dotGap: 46,
};
