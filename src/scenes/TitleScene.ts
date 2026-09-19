import Phaser from 'phaser';
import { music, voice } from '../core/audio';
import { requestWakeLock, resumeAudio } from '../core/device';
import { stars } from '../core/fx';
import { addBackground, getLayout, keepLayoutOnResize } from '../core/layout';
import { sfx } from '../core/sfx';
import { getStage } from '../core/stage';
import { iconButton } from '../core/ui';

/**
 * Opening screen: one big play button. Its tap is the user gesture the browser needs:
 * it resumes the audio context, asks for fullscreen + landscape, and keeps the screen on.
 * (It fires on release: browsers only grant these from a completed tap.)
 */
export class TitleScene extends Phaser.Scene {
  constructor() {
    super('Title');
  }

  create() {
    const L = getLayout(this);
    keepLayoutOnResize(this, L, { relayout: true });
    addBackground(this, L);

    const at = getStage(L).play;
    // (Its texture is rasterized at 1.4x, see `raster` in assets.ts: at scale k it shows 1.4x big.)
    const btn = iconButton(this, L, 'btn-play', at.x, at.y, () => this.go(btn.x, btn.y), { fireOn: 'up', hitPad: 130 });
    this.tweens.add({ targets: btn, alpha: { from: 0, to: 1 }, duration: 400 });
  }

  private go(x: number, y: number) {
    resumeAudio(this.game);
    this.sound.unlock();
    enterFullscreen();
    requestWakeLock();
    stars(this, x, y, 16, 80 * getLayout(this).k);
    sfx(this, 'pop');
    // The music starts with her tap and then runs on, softly, through every screen. Mom says hello.
    music.start();
    voice.say('vo-welcome', { queue: false });
    this.time.delayedCall(450, () => this.scene.start('Home'));
  }
}

/** Best effort: fullscreen + landscape lock. Silently ignored where unsupported (the rotate screen covers the rest). */
export function enterFullscreen() {
  const lockLandscape = () => {
    try {
      const orientation = screen.orientation as ScreenOrientation & { lock?: (o: string) => Promise<void> };
      orientation?.lock?.('landscape')?.catch(() => {});
    } catch {
      /* not supported: fine */
    }
  };
  try {
    const standalone = window.matchMedia('(display-mode: fullscreen), (display-mode: standalone)').matches;
    const el = document.documentElement;
    if (!standalone && !document.fullscreenElement && el.requestFullscreen) {
      // The scale manager (EXPAND) picks up the new size through the resize event.
      el.requestFullscreen({ navigationUI: 'hide' })?.then(lockLandscape, () => {});
    } else lockLandscape();
  } catch {
    /* not supported: fine */
  }
}
