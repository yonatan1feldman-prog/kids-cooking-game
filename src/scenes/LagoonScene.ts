import Phaser from 'phaser';
import { go } from '../core/transition';
import { loadRecipeSounds, music, releaseSounds, voice } from '../core/audio';
import { FX_SOFT, type ImageKey } from '../core/assets';
import { stars } from '../core/fx';
import { screenHint } from '../core/hand';
import { tickles, touchRipples } from '../core/juice';
import { getLayout, inNoTouchZone, keepLayoutOnResize } from '../core/layout';
import { ensurePlaceholders } from '../core/placeholders';
import { seaLife } from '../core/scenery';
import { SEA_ACTIVITY, SEA_DOORS, SEA_LAGOON, type SeaDoor } from '../core/seaAssets';
import { sfx } from '../core/sfx';
import { getStage } from '../core/stage';
import { iconButton, otherPointerDown } from '../core/ui';
import { Character } from '../steps/Character';
import { Mom } from '../steps/Mom';
import { assetsReady, loadImages, releaseImages } from './BootScene';
import { breath, MARINA, marinaSwims } from './SeaGame';
import { readMark, type TailMark } from '../core/sea'; // mermaid PR 2
import { paintMomTail } from './SeaTail'; // mermaid PR 2
import { cleanLagoonLife, hasMark, wearNecklace } from '../core/seaSort';

/** What each shell door says when it opens (Mom, before the activity starts). */
const PICK_LINE = {
  tail: 'vo-pick-tail',
  ride: 'vo-pick-ride',
  clean: 'vo-pick-clean',
  shells: 'vo-pick-shells',
  song: 'vo-pick-song',
} as const satisfies Record<SeaDoor, string>;

/** An activity that takes longer than this to load (a very slow phone) starts anyway, with stand-ins (spec 9). */
const ACTIVITY_WATCHDOG_MS = 20000;
/** A door whose activity is not built yet (mermaid PR 1) closes again this long after it opened. */
const PLACEHOLDER_CLOSE_MS = 2600;

export interface LagoonData {
  /** 'title': she just came into the world (Mom says hello); 'activity': back from one (Mom asks what next). */
  from?: 'title' | 'activity';
  /** Set once Mom has spoken, so a rebuild at a new size (relayout) doesn't say it again. */
  spoken?: boolean;
}

/** Every activity's own images and sounds (what is freed back in the lagoon; the lagoon's own stay). */
const activityImages = () => {
  const lagoon = new Set<string>(SEA_LAGOON.images);
  return [...new Set(Object.values(SEA_ACTIVITY).flatMap((a) => a.images))].filter((k) => !lagoon.has(k));
};
const activitySounds = () => {
  const lagoon = new Set<string>(SEA_LAGOON.sounds);
  return [...new Set(Object.values(SEA_ACTIVITY).flatMap((a) => a.sounds))].filter((k) => !lagoon.has(k));
};

/**
 * The lagoon, the mermaid world's hub ("Mermaid with Mom", research/mermaid-spec.md 2): under the water, Mom the mermaid
 * on her rock on the right, Marina the little mermaid girl swimming beside her, and on the sand five big closed shells, the doors to
 * the five activities, each with its picture above it (a sparkly tail, a bubble through a ring, a net with a dolphin, a
 * basket of shells, a shell with notes). Like the clinic's waiting room: nothing starts by itself, no order, no "all
 * done". A tap on a shell: it opens with a glow, Mom says what they will do, the activity's own pictures load (a small
 * ring on the shell if it takes a moment) and it starts; back from it, she is here again ("What shall we do next?").
 * Only the lagoon is loaded on the way in; each activity loads on its door and is freed again here (spec 9).
 * Until an activity is built (mermaid PRs 2-4) its door opens, Mom says its line, and the shell closes again.
 * The home button (two taps) goes back to the title.
 */
export class LagoonScene extends Phaser.Scene {
  /** For the test harness (window.__lagoonState). */
  shown: { doors: number; opened: SeaDoor[]; started: string | null; marks: string[] } = { doors: 0, opened: [], started: null, marks: [] };

  constructor() {
    super('Lagoon');
  }

  create(data: LagoonData = {}) {
    const L = getLayout(this);
    const S = getStage(L);
    const k = L.k;
    const lg = S.lagoon;
    let going = false;
    let busy = false;
    this.shown = { doors: SEA_DOORS.length, opened: [], started: null, marks: [] };
    (window as unknown as { __lagoonState: LagoonScene['shown'] }).__lagoonState = this.shown;
    keepLayoutOnResize(this, L, { relayout: true, canRelayout: () => !going && !busy });

    // Back from an activity: its own pictures and sounds are freed (the lagoon's stay).
    releaseImages(this.game, activityImages());
    releaseSounds(activitySounds());
    music.play('sea');

    // The water: the lagoon's picture, bottom-anchored like every room, then the light rays and the seaweed.
    this.cameras.main.setBackgroundColor('#5fc9c3');
    this.add.image(L.cx, L.H, 'bg-lagoon').setOrigin(0.5, 1).setScale(Math.max(1, L.W / 2400)).setDepth(-100);
    seaLife(this, L, lg.seaweed);
    // mermaid PR 2: after the swim with Marina the chest stays open, pearls shining in it
    const pearls = !!readMark<boolean>('pearls');
    const chest = this.add.image(lg.chest.x, lg.chest.y, pearls ? 'chest-open' : 'chest-closed').setScale(lg.chest.scale).setDepth(-70);
    if (pearls) {
      const sh = this.add.image(chest.x, chest.y - 30 * lg.chest.scale, FX_SOFT).setTint(0xfff4d0).setBlendMode(Phaser.BlendModes.ADD).setDepth(-69);
      sh.setScale((220 * lg.chest.scale) / sh.frame.realWidth);
      this.tweens.add({ targets: sh, alpha: { from: 0.25, to: 0.6 }, duration: 2600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }
    // mermaid PR 3: once she has cleaned it, the lagoon stays clean (brighter water, a dolphin jumping far off)
    if (hasMark('clean')) cleanLagoonLife(this, L);
    touchRipples(this, L);

    // The rock (behind Mom: her tail lies on it), Mom the mermaid, Marina swimming beside her.
    this.add.image(lg.rock.x, lg.rock.y, 'lagoon-rock').setScale(lg.rock.scale).setDepth(2);
    let mom: Mom | null = null;
    let marina: Character | null = null;
    let hint: ReturnType<typeof screenHint> | undefined;
    assetsReady().then(() => {
      if (!this.scene.isActive()) return;
      const m = (mom = new Mom(this, S.mom, 'mermaid'));
      // mermaid PR 2: Mom's tail the way she painted it
      const tail = readMark<TailMark>('tail');
      if (tail) paintMomTail(this, m, tail);
      m.followHand(() => hint?.active() ?? false);
      m.box.setAlpha(0);
      this.tweens.add({ targets: m.box, alpha: 1, duration: 300 });
      marina = new Character(this, MARINA, lg.friend, S.feedPet);
      marinaSwims(this, marina, lg.friend, k);
      // mermaid PR 3: Marina wears the shell necklace she was given
      if (hasMark('necklace')) wearNecklace(this, marina);
      marina.enter(150);
      tickles(this, () => [m, marina], () => !going && !busy);
      const look = () => {
        const p = this.input.manager.pointers.find((q) => q.isDown);
        m.lookAt(p ? p.worldX : L.cx, p ? p.worldY : lg.door(2).y);
        marina?.lookAt(p ? p.worldX : L.cx, p ? p.worldY : lg.door(2).y);
      };
      this.events.on(Phaser.Scenes.Events.UPDATE, look);
      this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.events.off(Phaser.Scenes.Events.UPDATE, look));
      if (!data.spoken) {
        data.spoken = true;
        if (data.from === 'activity') this.time.delayedCall(1500, () => !going && !busy && this.say('vo-sea-again', () => !going && !busy));
        else {
          this.say('vo-sea-hello', () => !going);
          m.wave();
          // Marina says hello too: a happy hop and a little breath of bubbles.
          this.time.delayedCall(900, () => {
            if (!marina?.box.active) return;
            marina.cheer();
            sfx(this, 'bubble-breath');
            breath(this, marina.box.x + 60 * lg.friend.scale, marina.box.y - 40 * lg.friend.scale, k, 4);
          });
        }
      }
    });

    // The five shell doors, each with its picture over it: shell and picture are one touch area.
    const doors = SEA_DOORS.map((id, i) => {
      const at = lg.door(i);
      const shell = this.add.image(at.x, at.y, 'door-shell').setScale(lg.doorScale).setDepth(10);
      const ic = lg.doorIcon(i);
      const icon = this.add.image(ic.x, ic.y, `door-icon-${id}`).setScale(lg.iconScale).setDepth(11);
      // (the picture bobs a very little, each on its own beat: the doors are alive, not blinking for attention)
      this.tweens.add({ targets: icon, y: ic.y - 6 * k, duration: 2200 + i * 260, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      const glow = this.add.image(at.x, at.y - 20 * k, FX_SOFT).setTint(0xfff1b8).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0).setDepth(9);
      glow.setScale((300 * lg.doorScale * 1.6) / glow.frame.realWidth);
      const top = ic.y - 80 * lg.iconScale - 20 * k;
      const bottom = at.y + 130 * lg.doorScale + 20 * k;
      const half = 150 * lg.doorScale + 14 * k;
      return { id, shell, icon, glow, box: new Phaser.Geom.Rectangle(at.x - half, top, 2 * half, bottom - top) };
    });

    // mermaid PR 4: the song's mark, three little bell shells in a row at the foot of the song's shell door (the rock
    // Mom sits on is mostly below the screen at 4:3; here they show at every ratio), each rocking very gently
    if (readMark('song')) {
      const at = lg.door(SEA_DOORS.indexOf('song'));
      const ds = lg.doorScale;
      [[1, -82, 128], [3, 0, 134], [5, 82, 128]].forEach(([n, dx, dy], j) => {
        const b = this.add.image(at.x + dx * ds, at.y + dy * ds, `bell-shell-${n}`).setOrigin(0.5, 0.9).setScale(0.44 * ds).setDepth(12).setAngle(-12 + j * 12);
        this.tweens.add({ targets: b, angle: b.angle + 4, duration: 1800 + j * 300, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      });
      this.shown.marks.push('song');
    }

    const open = (d: (typeof doors)[number]) => {
      if (going || busy) return;
      busy = true;
      hint?.stop();
      this.shown.opened.push(d.id);
      sfx(this, 'shell-open');
      d.shell.setTexture('door-shell-open');
      this.tweens.add({ targets: d.shell, scale: { from: lg.doorScale * 0.92, to: lg.doorScale }, duration: 320, ease: 'Back.easeOut' });
      this.tweens.add({ targets: d.icon, scale: { from: lg.iconScale * 1.25, to: lg.iconScale }, duration: 360, ease: 'Back.easeOut' });
      this.tweens.add({ targets: d.glow, alpha: { from: 0, to: 0.9 }, duration: 260 });
      stars(this, d.shell.x, d.shell.y - 40 * k, 12, 60 * k);
      mom?.wave();
      this.say(PICK_LINE[d.id], () => true);
      const act = SEA_ACTIVITY[d.id];
      if (!act.scene) {
        // (not built yet: the shell closes again after Mom's line, and the lagoon is hers again)
        this.time.delayedCall(PLACEHOLDER_CLOSE_MS, () => {
          d.shell.setTexture('door-shell');
          this.tweens.add({ targets: d.glow, alpha: 0, duration: 400 });
          busy = false;
          hint = startHint();
        });
        return;
      }
      // Its own pictures and sounds load now, a ring turning on the shell if it takes a moment; a very slow load starts
      // anyway with stand-ins (it never hangs).
      const shown: Phaser.GameObjects.GameObject[] = [];
      const spin = this.time.delayedCall(250, () => {
        const r = 40 * k;
        shown.push(this.add.circle(d.shell.x, d.shell.y, r * 1.5, 0xfff6e6, 0.92).setDepth(50));
        const arc = this.add.arc(d.shell.x, d.shell.y, r * 0.8, 0, 270, false).setStrokeStyle(12 * k, 0xff8c42).setClosePath(false).setDepth(51);
        shown.push(arc);
        this.tweens.add({ targets: arc, angle: 360, duration: 900, repeat: -1 });
      });
      let timer: ReturnType<typeof setTimeout> | undefined;
      const late = new Promise<void>((r) => (timer = setTimeout(r, ACTIVITY_WATCHDOG_MS)));
      const loading = Promise.all([loadImages(this.game, act.images as ImageKey[]), loadRecipeSounds(act.sounds)]).then(() => undefined);
      const delay = new Promise((r) => this.time.delayedCall(700, r));
      Promise.all([Promise.race([loading.catch(() => undefined), late]), delay]).then(() => {
        clearTimeout(timer);
        spin.remove();
        shown.forEach((o) => o.destroy());
        if (!this.scene.isActive()) return;
        try {
          ensurePlaceholders(this.game, act.images as ImageKey[]);
        } catch {
          /* the activity draws what it has */
        }
        going = true;
        this.shown.started = act.scene!;
        // (the premium round's paper page: the shell she tapped grows toward the middle as the page comes up)
        go(this, act.scene!, { from: 'lagoon' }, { from: d.shell });
      });
    };

    // One finger: the first touch on a door opens it (fires on press, like the cards).
    const onDown = (p: Phaser.Input.Pointer) => {
      if (going || busy || otherPointerDown(this, p) || inNoTouchZone(this, p.x, p.y)) return;
      const d = doors.find((o) => o.box.contains(p.worldX, p.worldY));
      if (d) open(d);
    };
    this.input.on(Phaser.Input.Events.POINTER_DOWN, onDown);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.input.off(Phaser.Input.Events.POINTER_DOWN, onDown));
    (window as unknown as { __seaDoorAt: (id: SeaDoor) => { x: number; y: number } }).__seaDoorAt = (id) => {
      const d = doors.find((o) => o.id === id)!;
      return { x: d.shell.x, y: d.shell.y };
    };

    // The home button (two taps, as everywhere) goes back to the title, where the three worlds are.
    iconButton(this, L, 'btn-home', S.home.x, S.home.y, () => {
      if (going || busy) return;
      going = true;
      hint?.stop();
      voice.stop();
      go(this, 'Title', undefined, { dir: 'down' });
    }, { confirm: true, scale: S.homeScale, hitPad: 30 }).setDepth(900);

    // Idle 5 s: Mom's hand taps one of the shells (a different one each time).
    let next = Phaser.Math.Between(0, doors.length - 1);
    const startHint = () =>
      screenHint(this, L, () => {
        if (going || busy) return null;
        const d = doors[next];
        return { x: d.shell.x, y: d.shell.y };
      }, () => !!mom);
    hint = startHint();
    this.input.on(Phaser.Input.Events.POINTER_DOWN, () => (next = (next + 1) % doors.length));
  }

  private say(key: Parameters<typeof voice.say>[0], valid: () => boolean) {
    voice.say(key, { ttlMs: 4000, valid: () => this.scene.isActive() && valid() });
  }
}
