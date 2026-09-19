import Phaser from 'phaser';
import { requestWakeLock, resumeAudio } from '../core/device';
import { stars } from '../core/fx';
import { addBackground, getLayout, keepLayoutOnResize } from '../core/layout';
import { sfx } from '../core/sfx';
import { getStage } from '../core/stage';
import { iconButton } from '../core/ui';

/**
 * Opening screen: one big play button. Its tap is the user gesture the browser needs:
 * it resumes the audio context, asks for fullscreen + portrait, and keeps the screen on.
 * (It fires on release: browsers only grant these from a completed tap.)
 */
export class TitleScene extends Phaser.Scene {
  constructor() {
    super('Title');
  }

  create() {
    const L = getLayout(this);
    keepLayoutOnResize(this, L);
    addBackground(this, L);

    const at = getStage(L).play;
    const btn = iconButton(this, L, 'btn-play', at.x, at.y, () => this.go(btn.x, btn.y), { pulse: true, fireOn: 'up', hitPad: 130 });
    this.tweens.add({ targets: btn, alpha: { from: 0, to: 1 }, duration: 400 });
  }

  private go(x: number, y: number) {
    resumeAudio(this.game);
    this.sound.unlock();
    enterFullscreen();
    requestWakeLock();
    stars(this, x, y, 16, 80 * getLayout(this).k);
    sfx(this, 'pop');
    this.time.delayedCall(450, () => this.scene.start('Home'));
  }
}

/** Best effort: fullscreen + portrait lock. Silently ignored where unsupported. */
export function enterFullscreen() {
  const lockPortrait = () => {
    const orientation = screen.orientation as ScreenOrientation & { lock?: (o: string) => Promise<void> };
    orientation?.lock?.('portrait').catch(() => {});
  };
  try {
    const standalone = window.matchMedia('(display-mode: fullscreen), (display-mode: standalone)').matches;
    const el = document.documentElement;
    if (!standalone && !document.fullscreenElement && el.requestFullscreen) {
      // The scale manager (EXPAND) picks up the new size through the resize event.
      el.requestFullscreen({ navigationUI: 'hide' }).then(lockPortrait, () => {});
    } else lockPortrait();
  } catch {
    /* not supported: fine */
  }
}
