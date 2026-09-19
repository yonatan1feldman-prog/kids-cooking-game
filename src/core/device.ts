import Phaser from 'phaser';
import { audioHeld, holdAudio } from './audio';

/**
 * Real-device hardening: no browser gestures, screen stays on, sound comes back.
 * Every call here is best effort and fails silently.
 */

/** Blocks pull-to-refresh, scrolling, pinch/double-tap zoom, long-press menu and text selection. */
export function blockBrowserGestures() {
  const stop = (e: Event) => {
    if (e.cancelable) e.preventDefault();
  };
  const opts: AddEventListenerOptions = { passive: false };
  document.addEventListener('touchmove', stop, opts);
  document.addEventListener('gesturestart', stop, opts); // Safari pinch
  document.addEventListener('dblclick', stop, opts);
  document.addEventListener('contextmenu', stop, opts);
  document.addEventListener('selectstart', stop, opts);
  // Two fingers down at once: never let the browser turn it into a zoom.
  document.addEventListener(
    'touchstart',
    (e) => {
      if (e.touches.length > 1 && e.cancelable) e.preventDefault();
    },
    opts,
  );
}

type WakeLockSentinelLike = { released: boolean; release: () => Promise<void>; addEventListener: (t: string, f: () => void) => void };
let wakeLock: WakeLockSentinelLike | null = null;
let wantWakeLock = false;

/** Keeps the screen on while playing. Needs a secure context (HTTPS/localhost) on most browsers. */
export async function requestWakeLock() {
  wantWakeLock = true;
  try {
    const nav = navigator as Navigator & { wakeLock?: { request: (t: 'screen') => Promise<WakeLockSentinelLike> } };
    if (!nav.wakeLock || (wakeLock && !wakeLock.released)) return;
    wakeLock = await nav.wakeLock.request('screen');
  } catch {
    /* not allowed or not supported: fine */
  }
}

function audioContext(game: Phaser.Game): AudioContext | undefined {
  return (game.sound as Phaser.Sound.WebAudioSoundManager).context;
}

/** Resumes the audio context if the browser suspended it (not while the rotate screen or the background holds it). Safe to call often. */
export function resumeAudio(game: Phaser.Game) {
  if (audioHeld()) return;
  try {
    const ctx = audioContext(game);
    if (ctx && ctx.state !== 'running') ctx.resume().catch(() => {});
  } catch {
    /* no audio: fine */
  }
}

/**
 * Coming back from the background: re-take the wake lock (it is dropped when hidden)
 * and wake the audio up. Every touch also nudges audio awake, in case the browser
 * only allows resuming from a gesture.
 */
export function installLifecycle(game: Phaser.Game) {
  // In the background every sound stops (the voice line is dropped); it all comes back on return.
  document.addEventListener('visibilitychange', () => {
    const hidden = document.visibilityState !== 'visible';
    holdAudio('hidden', hidden);
    if (hidden) return;
    resumeAudio(game);
    if (wantWakeLock) requestWakeLock();
  });
  const nudge = () => resumeAudio(game);
  window.addEventListener('touchend', nudge, { capture: true, passive: true });
  window.addEventListener('pointerup', nudge, { capture: true, passive: true });
}
