/**
 * THE TUNING TABLE: every count, threshold and timing that decides how long a step takes or how much work
 * it needs, in one place, so it is easy to change after watching the child play.
 *
 * The rule behind the numbers: she can't fail and nothing needs precision. More work means more repeats
 * and more visible in-between states, never something harder. A step is about 10-20 s of active doing
 * for a 5-year-old. Distances are world units at k = 1 (the steps multiply them by layout.k).
 */

/** Seconds of no progress (ms) before Mom's hand shows the gesture again (the hint), on every screen. */
export const HINT_AFTER_MS = 5000;
/** Further ms of no progress before Mom helps ("Let me help you!", and her hand does it). */
export const AUTO_AFTER_HINT_MS = 10000;
/** A demo never runs longer than this. */
export const DEMO_MAX_MS = 2500;
