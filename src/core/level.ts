/**
 * The difficulty level (gameplay round 5): "little chef" (1, the game as it was) or "big chef" (2, the level-2
 * challenges of `recipes/bigChef.ts` and the tighter targets of `TUNING.big`). Chosen on the title screen with two
 * wordless chef hats, remembered on this device only (localStorage `cooking.level`, nothing is sent anywhere), and
 * changeable there at any time. Both levels keep everything the child wellbeing rules ask for: no timers, no failing,
 * Mom's hint after 8 s and her help 20 s later.
 *
 * Any scene or step reads it with `getLevel()` / `isBigChef()`, or picks a value with `byLevel(little, big)`.
 */
export type Level = 1 | 2;

const KEY = 'cooking.level';

function read(): Level {
  try {
    return localStorage.getItem(KEY) === '2' ? 2 : 1;
  } catch {
    return 1;
  }
}

let current: Level = read();

/** The level now: 1 = little chef (default), 2 = big chef. */
export function getLevel(): Level {
  return current;
}

/** True on the big-chef level. */
export function isBigChef() {
  return current === 2;
}

/** The value for the current level. */
export function byLevel<T>(little: T, big: T): T {
  return current === 2 ? big : little;
}

/** Changes the level and remembers it (private mode or blocked storage: only for this visit). */
export function setLevel(level: Level) {
  current = level;
  try {
    localStorage.setItem(KEY, String(level));
  } catch {
    /* not stored: fine */
  }
}
