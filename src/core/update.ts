/**
 * Offline support and safe updates (service worker, production builds only; browsers allow it only over
 * HTTPS or on localhost).
 *
 * A new version never takes over by itself: its service worker installs in the background and then WAITS
 * (no skipWaiting in the build). It is switched on only where no game is running: at start, before the game is even
 * built (`applyWaitingUpdate`, so the game boots once), or on the title screen. Then the page reloads at once. Once she
 * has tapped a game card the page is never reloaded: not in a recipe, not on the home screen. A version that arrives
 * later waits until she is back at the title (by the home button), or for the next start.
 */
let reg: ServiceWorkerRegistration | null = null;
let onTitle = false;
let started = false;
let applying = false;
/** A new service worker took over while she was playing: the page reloads the next time the title shows. */
let stale = false;
/** Set for a moment before an update's reload, so a version that won't switch on can't reload the page in a loop. */
const TRIED = 'cooking.update.tried';

/**
 * Before the game is built (main.ts): if a new version is already waiting (it downloaded during the last visit), it
 * is switched on and the page reloads right away, so the game boots once, the new version, and not twice (old, then
 * new from the title). Resolves true when the page is about to reload: the caller builds nothing.
 */
export async function applyWaitingUpdate(): Promise<boolean> {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator) || !navigator.serviceWorker.controller) return false;
  try {
    const tried = Number(sessionStorage.getItem(TRIED) ?? 0);
    if (Date.now() - tried < 15000) return false;
    const base = import.meta.env.BASE_URL;
    const r = await Promise.race([navigator.serviceWorker.getRegistration(base), new Promise<undefined>((ok) => setTimeout(() => ok(undefined), 400))]);
    if (!r?.waiting) return false;
    sessionStorage.setItem(TRIED, String(Date.now()));
    const switched = new Promise<boolean>((ok) => {
      navigator.serviceWorker.addEventListener('controllerchange', () => ok(true), { once: true });
      setTimeout(() => ok(false), 3000);
    });
    r.waiting.postMessage({ type: 'SKIP_WAITING' });
    if (!(await switched)) return false;
    location.reload();
    return true;
  } catch {
    return false;
  }
}

export function registerServiceWorker() {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return;
  const base = import.meta.env.BASE_URL;
  navigator.serviceWorker
    .register(`${base}sw.js`, { scope: base })
    .then((r) => {
      reg = r;
      checkForUpdate();
      // A version that finishes installing while the title is still up is applied at once, too (one may already be
      // installing when the registration resolves: it is watched as well).
      const watch = (w: ServiceWorker | null) => w?.addEventListener('statechange', () => w.state === 'installed' && checkForUpdate());
      watch(r.installing);
      r.addEventListener('updatefound', () => watch(r.installing));
    })
    .catch(() => {});
  // The page runs the old version's code under a new service worker: reload, unless she is playing (then the next
  // time she is at the title). (Only a switch on the title asks for one; this also covers a switch from elsewhere.)
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!started) location.reload();
    else stale = true;
  });
}

/**
 * The title screen is up: the game is not running (from the first start, or back from a world by the home button).
 * Checks for a waiting version now; a version that arrived while she played is switched on here.
 */
export function titleShown() {
  onTitle = true;
  started = false;
  if (stale) {
    location.reload();
    return;
  }
  reg?.update().catch(() => {});
  checkForUpdate();
}

/** The tap on a game card: from now on this page is not reloaded until she is back at the title. */
export function gameStarted() {
  started = true;
  onTitle = false;
}

/** True while a new version is being switched on (the play tap waits for the reload). */
export const updating = () => applying && !started;

function checkForUpdate() {
  if (!onTitle || started || applying || !reg?.waiting || !navigator.serviceWorker.controller) return;
  applying = true;
  reg.waiting.postMessage({ type: 'SKIP_WAITING' });
  // Never stuck: if the switch doesn't happen, the title works as before.
  setTimeout(() => (applying = false), 4000);
}

/** For the test harness: the state of the update check. */
(window as unknown as { __update: () => object }).__update = () => ({
  registered: !!reg,
  waiting: !!reg?.waiting,
  controller: !!navigator.serviceWorker?.controller,
  onTitle,
  started,
  applying,
  stale,
});
