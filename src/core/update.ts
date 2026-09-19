/**
 * Offline support and safe updates (service worker, production builds only; browsers allow it only over
 * HTTPS or on localhost).
 *
 * A new version never takes over by itself: its service worker installs in the background and then WAITS
 * (no skipWaiting in the build). Only the title screen, before the play tap, checks for a waiting version.
 * If there is one it is activated and the page reloads right away, before the game starts. Once she has
 * tapped play the page is never reloaded: not in a recipe, not on the home screen. A version that arrives
 * later simply waits for the next time the app starts at the title.
 */
let reg: ServiceWorkerRegistration | null = null;
let onTitle = false;
let started = false;
let applying = false;

export function registerServiceWorker() {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return;
  const base = import.meta.env.BASE_URL;
  navigator.serviceWorker
    .register(`${base}sw.js`, { scope: base })
    .then((r) => {
      reg = r;
      checkForUpdate();
      // A version that finishes installing while the title is still up is applied at once, too.
      r.addEventListener('updatefound', () => {
        const w = r.installing;
        w?.addEventListener('statechange', () => w.state === 'installed' && checkForUpdate());
      });
    })
    .catch(() => {});
  // Only a switch we asked for (on the title, before the game started) reloads the page.
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (applying && !started) location.reload();
  });
}

/** The title screen is up (and the game has not started). Checks for a waiting version now. */
export function titleShown() {
  onTitle = true;
  reg?.update().catch(() => {});
  checkForUpdate();
}

/** The play tap: from now on this page is never reloaded. */
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
});
