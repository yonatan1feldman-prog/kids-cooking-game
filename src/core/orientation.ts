import Phaser from 'phaser';
import { holdAudio } from './audio';
import { ORIENTATION_PAUSE, ORIENTATION_RESUME } from './layout';

/**
 * The game is landscape only. When the screen is taller than wide, a text-free rotate
 * screen (a phone turning, with a round arrow; #rotate in index.html) covers the game and
 * the game is paused: every running scene is paused (step timers, idle clocks, tweens and
 * delayed calls all stop) and sounds pause. Turning back resumes exactly where it was.
 * A gesture in progress is dropped gently first (ORIENTATION_PAUSE), so nothing hangs in
 * mid-air if the finger lifts while the game is covered.
 *
 * The check uses the size of the game's container (not the window), so the test harness can
 * emulate a rotation by resizing that container.
 */
export function installOrientationGuard(game: Phaser.Game) {
  const container = document.getElementById('game');
  const overlay = document.getElementById('rotate');
  if (!container || !overlay) return;
  let paused: Phaser.Scene[] | null = null;

  const isPortrait = () => {
    const r = container.getBoundingClientRect();
    return r.height > r.width;
  };

  const check = () => {
    const portrait = isPortrait();
    if (portrait && !paused) {
      game.events.emit(ORIENTATION_PAUSE);
      paused = game.scene.getScenes(true).filter(pausable);
      paused.forEach((s) => s.scene.pause());
      game.sound.pauseAll();
      holdAudio('rotate', true);
      overlay.classList.add('show');
    } else if (!portrait && paused) {
      overlay.classList.remove('show');
      const list = paused;
      paused = null;
      list.forEach((s) => s.scene.isPaused() && s.scene.resume());
      game.sound.resumeAll();
      holdAudio('rotate', false);
      game.events.emit(ORIENTATION_RESUME);
    }
  };

  // Loading keeps going behind the cover; a scene started while covered (e.g. Title at launch) is paused too.
  const pausable = (s: Phaser.Scene) => s.scene.key !== 'Boot';
  game.events.on(Phaser.Core.Events.POST_STEP, () => {
    if (!paused) return;
    for (const s of game.scene.getScenes(true)) {
      if (pausable(s) && !paused.includes(s)) {
        paused.push(s);
        s.scene.pause();
      }
    }
  });

  new ResizeObserver(check).observe(container);
  window.addEventListener('orientationchange', check);
  window.addEventListener('resize', check);
  check();
}
