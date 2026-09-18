import Phaser from 'phaser';
import { stars } from '../core/fx';
import { addBackground, getLayout, keepLayoutOnResize } from '../core/layout';
import { sfx } from '../core/sfx';
import { iconButton } from '../core/ui';

/** Opening screen: one big play button. The first tap also unlocks sound and goes fullscreen. */
export class TitleScene extends Phaser.Scene {
  constructor() {
    super('Title');
  }

  create() {
    const L = getLayout(this);
    keepLayoutOnResize(this, L);
    addBackground(this, L);

    const btn = iconButton(this, 'btn-play', L.cx, L.H * 0.48, L.u * 0.42, () => this.go(btn.x, btn.y), { pulse: true });
    this.tweens.add({ targets: btn, alpha: { from: 0, to: 1 }, duration: 400 });
  }

  private go(x: number, y: number) {
    enterFullscreen(this);
    stars(this, x, y, 16, getLayout(this).u * 0.08);
    sfx(this, 'pop');
    this.time.delayedCall(450, () => this.scene.start('Home'));
  }
}

/** Best effort: fullscreen + portrait lock. Silently ignored where unsupported. */
export function enterFullscreen(scene: Phaser.Scene) {
  try {
    const standalone = window.matchMedia('(display-mode: fullscreen), (display-mode: standalone)').matches;
    if (!standalone && !scene.scale.isFullscreen && scene.sys.game.device.fullscreen.available) scene.scale.startFullscreen();
    const orientation = screen.orientation as ScreenOrientation & { lock?: (o: string) => Promise<void> };
    orientation.lock?.('portrait').catch(() => {});
  } catch {
    /* not supported: fine */
  }
}
