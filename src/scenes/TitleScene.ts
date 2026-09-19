import Phaser from 'phaser';
import manifest from 'virtual:asset-manifest';
import { music, voice } from '../core/audio';
import { requestWakeLock, resumeAudio } from '../core/device';
import { stars } from '../core/fx';
import { screenHint } from '../core/hand';
import { addBackground, getLayout, keepLayoutOnResize } from '../core/layout';
import { sfx } from '../core/sfx';
import { getStage } from '../core/stage';
import { iconButton } from '../core/ui';
import { gameStarted, titleShown, updating } from '../core/update';
import { RECIPES } from '../recipes';
import { Character } from '../steps/Character';
import { Mom } from '../steps/Mom';
import { titleArtLoaded, titleArtReady } from './BootScene';

/**
 * Opening screen: the big play button (there at once), then the logo, Mom and Pipa fading in as soon as
 * their art is loaded (the art agent's title scene). The play tap is the user gesture the browser needs:
 * it resumes the audio context, asks for fullscreen + landscape, and keeps the screen on (it fires on
 * release: browsers only grant these from a completed tap). Mom waves and says hello.
 * This is also the only place where a waiting new version is switched on (core/update.ts).
 */
export class TitleScene extends Phaser.Scene {
  private mom?: Mom;
  private leaving = false;

  constructor() {
    super('Title');
  }

  create() {
    const L = getLayout(this);
    keepLayoutOnResize(this, L, { relayout: true, canRelayout: () => !this.leaving });
    addBackground(this, L);
    const S = getStage(L);
    this.mom = undefined;
    this.leaving = false;
    titleShown();

    // (Its texture is rasterized at 1.4x, see `raster` in assets.ts: at scale k it shows 1.4x big.)
    // Its touch circle stops above the palm strip.
    const btn = iconButton(this, L, 'btn-play', S.play.x, S.play.y, () => this.go(btn.x, btn.y), { fireOn: 'up', hitPad: 80 });
    this.tweens.add({ targets: btn, alpha: { from: 0, to: 1 }, duration: 400 });

    const fadeIn = (t: { setAlpha: (a: number) => unknown }) => {
      t.setAlpha(0);
      this.tweens.add({ targets: t, alpha: 1, duration: 500 });
    };
    titleArtReady().then(() => {
      if (!this.scene.isActive() || this.leaving) return;
      // The logo only if its file exists (never a placeholder box here).
      if (manifest.images['logo-cooking-with-mom']) {
        fadeIn(this.add.image(S.titleLogo.x, S.titleLogo.y, 'logo-cooking-with-mom').setScale(L.k));
      }
      this.mom = new Mom(this, S.mom);
      fadeIn(this.mom.box);
      if (S.pet) fadeIn(new Character(this, RECIPES[0].character, S.pet, S.feedPet).box);
      this.events.on(Phaser.Scenes.Events.UPDATE, () => {
        const p = this.input.manager.pointers.find((q) => q.isDown);
        this.mom?.lookAt(p ? p.worldX : btn.x, p ? p.worldY : btn.y);
      });
    });

    // Idle 5 s: Mom's pointing hand taps the play button.
    screenHint(this, L, () => (this.leaving ? null : { x: btn.x, y: btn.y }), titleArtLoaded);
  }

  private go(x: number, y: number) {
    // A new version is being switched on this very moment: the page reloads in a blink, the tap waits.
    if (this.leaving || updating()) return;
    this.leaving = true;
    gameStarted();
    resumeAudio(this.game);
    this.sound.unlock();
    enterFullscreen();
    requestWakeLock();
    stars(this, x, y, 16, 80 * getLayout(this).k);
    sfx(this, 'pop');
    // The music starts with her tap and then runs on, softly, through every screen. Mom waves hello.
    music.start();
    voice.say('vo-hello', { queue: false });
    this.mom?.wave();
    this.time.delayedCall(900, () => this.scene.start('Home', { from: 'title' }));
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
