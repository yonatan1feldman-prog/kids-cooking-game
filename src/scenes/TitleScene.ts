import Phaser from 'phaser';
import { music, voice } from '../core/audio';
import { requestWakeLock, resumeAudio } from '../core/device';
import { FX_SOFT } from '../core/assets';
import { stars } from '../core/fx';
import { getLevel, setLevel, type Level } from '../core/level';
import { LEVEL_ICON, makeLevelTextures } from '../core/placeholders';
import { screenHint } from '../core/hand';
import { addBackground, getLayout, keepLayoutOnResize } from '../core/layout';
import { sfx } from '../core/sfx';
import { getStage } from '../core/stage';
import { iconButton } from '../core/ui';
import { gameStarted, titleShown, updating } from '../core/update';
import { RECIPES } from '../recipes';
import { Character } from '../steps/Character';
import { Mom } from '../steps/Mom';
import { recipeAssets, releaseRecipe, titleArtLoaded, titleArtReady } from './BootScene';
import { worldReady } from '../core/worldCache';

/** Mom says hello only on the very first tap of a session (coming back to the title from a world, she just smiles). */
let greeted = false;

/**
 * Opening screen: the two games as two big cards (there at once; clinic round 3): "Cooking with Mom" (a pot: the
 * kitchen's home screen, the recipes and the games) and "Doctor with Mom" (a nurse's bag with a heart: ClinicScene),
 * then Mom and Pipa fading in as soon as their art is loaded. The chef hats under the cards choose the level for both. The first tap is the user gesture the browser needs: it resumes the audio context, asks for
 * fullscreen + landscape, and keeps the screen on (it fires on release: browsers only grant these from a completed
 * tap). Mom waves and says hello. Both worlds' home buttons come back here, so she can change worlds.
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
    // Back from a world: its art and sounds are released, the kitchen's song comes back.
    releaseRecipe(this.game);
    music.play('kitchen');
    addBackground(this, L);
    const S = getStage(L);
    this.mom = undefined;
    this.leaving = false;
    titleShown();

    // The two games, two big cards (clinic round 3): their touch area is the card itself (not a circle round it).
    const card = (key: 'world-card-kitchen' | 'world-card-clinic', at: { x: number; y: number }, world: 'kitchen' | 'clinic') => {
      const c: Phaser.GameObjects.Image = iconButton(this, L, key, at.x, at.y, () => this.go(c.x, c.y, world), { fireOn: 'up', scale: S.worldScale });
      c.input!.hitArea = new Phaser.Geom.Rectangle(0, 0, c.frame.realWidth, c.frame.realHeight);
      c.input!.hitAreaCallback = Phaser.Geom.Rectangle.Contains;
      return c;
    };
    const btn = card('world-card-kitchen', S.world.kitchen, 'kitchen');
    const clinic = card('world-card-clinic', S.world.clinic, 'clinic');
    this.tweens.add({ targets: [btn, clinic], alpha: { from: 0, to: 1 }, duration: 400 });
    this.levelPick(L, S);

    const fadeIn = (t: { setAlpha: (a: number) => unknown }) => {
      t.setAlpha(0);
      this.tweens.add({ targets: t, alpha: 1, duration: 500 });
    };
    titleArtReady().then(() => {
      if (!this.scene.isActive() || this.leaving) return;
      this.mom = new Mom(this, S.mom);
      this.mom.followHand(hint.active);
      fadeIn(this.mom.box);
      if (S.pet) fadeIn(new Character(this, RECIPES[0].character, S.pet, S.feedPet).box);
      const look = () => {
        const p = this.input.manager.pointers.find((q) => q.isDown);
        this.mom?.lookAt(p ? p.worldX : btn.x, p ? p.worldY : btn.y);
      };
      // (the scene object lives on across visits: without the off, every visit would add one more watcher)
      this.events.on(Phaser.Scenes.Events.UPDATE, look);
      this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.events.off(Phaser.Scenes.Events.UPDATE, look));
    });

    // Idle 5 s: Mom's pointing hand taps the play button.
    const hint = screenHint(this, L, () => (this.leaving ? null : { x: btn.x, y: btn.y }), titleArtLoaded);
  }

  /**
   * Gameplay round 5: the difficulty, two wordless buttons under the game cards (core/level.ts), for both games. Since
   * clinic round 4 (the owner) they are an easy and a hard level, not chef hats: one star (easy, the game as it was) and
   * three stars (hard: more to find, remember and follow). The chosen one glows; a tap on the other one chooses it (pop,
   * stars, Mom says "Easy!" / "Hard!"). It is remembered on this device. The internal names (little / big chef) stay.
   * (They fire on release, like the play button: that tap may be the one that unlocks the sound.)
   */
  private levelPick(L: ReturnType<typeof getLayout>, S: ReturnType<typeof getStage>) {
    makeLevelTextures(this.game);
    const glows = new Map<Level, Phaser.GameObjects.Image>();
    const hats = new Map<Level, Phaser.GameObjects.Image>();
    const show = (animate: boolean) => {
      for (const level of [1, 2] as const) {
        const on = getLevel() === level;
        const g = glows.get(level)!;
        this.tweens.killTweensOf(g);
        if (animate) this.tweens.add({ targets: g, alpha: on ? 0.85 : 0, duration: 220 });
        else g.setAlpha(on ? 0.85 : 0);
        hats.get(level)!.setAlpha(on ? 1 : 0.8);
      }
    };
    for (const level of [1, 2] as const) {
      const at = S.levelPick[level];
      const glow = this.add.image(at.x, at.y, FX_SOFT).setTint(0xffd65a).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0);
      glow.setScale((240 * S.levelScale * 1.5) / glow.frame.realWidth);
      glows.set(level, glow);
      const hat = iconButton(
        this,
        L,
        LEVEL_ICON[level],
        at.x,
        at.y,
        () => {
          if (this.leaving) return;
          resumeAudio(this.game);
          this.sound.unlock();
          stars(this, hat.x, hat.y - 60 * L.k, 8, 50 * L.k);
          if (getLevel() === level) return;
          setLevel(level);
          show(true);
          sfx(this, 'pop');
          voice.say(level === 2 ? 'vo-level-hard' : 'vo-level-easy', { group: 'level', ttlMs: 2500 });
          this.mom?.happy();
        },
        { fireOn: 'up', hitPad: 30, scale: S.levelScale },
      );
      hat.setAlpha(0);
      this.tweens.add({ targets: hat, alpha: getLevel() === level ? 1 : 0.8, duration: 400 });
      hats.set(level, hat);
    }
    show(false);
  }

  private go(x: number, y: number, world: 'kitchen' | 'clinic') {
    // A new version is being switched on this very moment: the page reloads in a blink, the tap waits.
    if (this.leaving || updating()) return;
    this.leaving = true;
    gameStarted();
    resumeAudio(this.game);
    this.sound.unlock();
    enterFullscreen();
    requestWakeLock();
    const k = getLayout(this).k;
    stars(this, x, y, 16, 80 * k);
    sfx(this, 'pop');
    // The music starts with her tap and then runs on, softly, through every screen (the clinic has its own song,
    // which comes in as soon as it is loaded). Mom waves hello.
    if (world === 'clinic') music.play('clinic');
    music.start();
    // Mom says the card's title ("Cooking with Mom!" / "Doctor with Mom!"; clinic round 3), the very first time after
    // her hello.
    if (!greeted) voice.say('vo-hello', { ttlMs: 3000 });
    greeted = true;
    voice.say(world === 'clinic' ? 'vo-world-doctor' : 'vo-world-cooking', { ttlMs: 3500 });
    this.mom?.wave();
    if (world === 'kitchen') {
      this.time.delayedCall(900, () => this.scene.start('Home', { from: 'title' }));
      return;
    }
    // The clinic: its art and sounds load (a small spinner over the button if it takes a
    // moment), then in. Its files are not in the install (core/worldCache.ts): if they can't be had (offline before
    // the first visit), the spinner goes, the card gives a little wobble and the title stays as it was.
    const shown: Phaser.GameObjects.GameObject[] = [];
    const spin = this.time.delayedCall(250, () => {
      const r = 46 * k;
      shown.push(this.add.circle(x, y, r * 1.5, 0xfff6e6, 0.92).setDepth(50));
      const arc = this.add.arc(x, y, r, 0, 270, false).setStrokeStyle(12 * k, 0xff8c42).setClosePath(false).setDepth(51);
      shown.push(arc);
      this.tweens.add({ targets: arc, angle: 360, duration: 900, repeat: -1 });
    });
    const delay = new Promise((r) => this.time.delayedCall(900, r));
    worldReady('clinic').then((ok) => {
      if (!ok) {
        spin.remove();
        if (!this.scene.isActive()) return;
        shown.forEach((o) => o.destroy());
        this.leaving = false;
        music.play('kitchen');
        const card = this.children.list.find((o) => (o as Phaser.GameObjects.Image).texture?.key === 'world-card-clinic');
        if (card) this.tweens.add({ targets: card, angle: { from: -3, to: 3 }, duration: 90, yoyo: true, repeat: 2, onComplete: () => (card as Phaser.GameObjects.Image).setAngle(0) });
        return;
      }
      Promise.all([recipeAssets(this.game, 'clinic'), delay]).then(() => {
        spin.remove();
        if (this.scene.isActive()) this.scene.start('Clinic');
      });
    });
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
