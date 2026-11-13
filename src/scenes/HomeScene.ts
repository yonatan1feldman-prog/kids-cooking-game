import Phaser from 'phaser';
import { appear, PAPER } from '../core/paper';
import { go } from '../core/transition';
import { tickles, touchRipples } from '../core/juice';
import { albumCount, latestPhotos, type AlbumPhoto } from '../core/album';
import { music, voice } from '../core/audio';
import { stars } from '../core/fx';
import { screenHint } from '../core/hand';
import { ALBUM_ICON, makeAlbumTextures } from '../core/placeholders';
import { addBackground, getLayout, inNoTouchZone, keepLayoutOnResize } from '../core/layout';
import { getStage, type Shelf } from '../core/stage';
import { sfx } from '../core/sfx';
import { iconButton } from '../core/ui';
import { RECIPES } from '../recipes';
import { Character } from '../steps/Character';
import { Mom } from '../steps/Mom';
import { enterWorld, homeArtReady, recipeAssets, releaseRecipe, titleArtReady } from './BootScene';

/**
 * Home: the cards on two wooden shelves (three on 4:3), Mom at the counter (and Pipa beside her on phones). Nothing
 * moves by itself here except Mom breathing and blinking: the child picks a card when she wants to, and the game never
 * starts a recipe on its own. Tapping a card starts that recipe ("Let's make a pizza!"). Arriving from the title (or by
 * the home button) Mom asks "What shall we make today?"; after a finished recipe the home screen stays quiet (the finale
 * already said goodbye). Idle 5 s: her hand taps the card.
 *
 * Premium round (research/premium-spec.md 4.5):
 * - The cards stand on shelves like little books, bigger than the old grid (about 260 units wide at 20:9). A shelf too
 *   long for the room left of Mom slides sideways under her finger (the easiest gesture at 3-5), the next card peeking
 *   at its end; a finger that moves 24 units slides, less is a tap, which opens the card when it lifts. One finger only,
 *   never in the no-touch strips.
 * - A card she has a photo of (the memory book) shows HER dish in its window, with a small heart: what she made, not a
 *   drawing of it. No numbers, no "how many times".
 * - Coming from the title, Pipa has an idea once per visit: one card in her thought bubble; a tap on the bubble opens it,
 *   a tap on another card simply lets the bubble go (Pipa smiles: nobody is ever sad).
 */
/** The games on the home screen that are not recipes (each its own scene, its assets under RECIPE_ASSETS[id]). */
const PLAY: { id: string; card: 'card-garden' | 'card-market' | 'card-dishes' | 'card-art' | 'card-farm'; line: 'vo-pick-garden' | 'vo-pick-market' | 'vo-pick-dishes' | 'vo-pick-art' | 'vo-pick-farm'; scene: string }[] = [
  { id: 'garden', card: 'card-garden', line: 'vo-pick-garden', scene: 'Garden' },
  { id: 'market', card: 'card-market', line: 'vo-pick-market', scene: 'Market' },
  { id: 'dishes', card: 'card-dishes', line: 'vo-pick-dishes', scene: 'Dishes' },
  { id: 'art', card: 'card-art', line: 'vo-pick-art', scene: 'Art' },
  { id: 'farm', card: 'card-farm', line: 'vo-pick-farm', scene: 'Farm' },
];

/** A card's picture window in its 400x520 frame (the drawn dish sits in it; her photo goes over it), and its corners. */
const WINDOW = { x: 34, y: 36, w: 332, h: 332, r: 22 };
/** The washi tape at the card's top (it is drawn again over her photo, a crop of the card itself: no new texture). */
const TAPE = { x: 124, y: 0, w: 152, h: 46 };
/** Her photo in a card is made this many pixels square (about the window's size on the phone; ~0.15 MB each). */
const THUMB_PX = 200;
/** A finger that moves this far (world units at k = 1) slides the shelf; less is a tap on the card. */
const SLIDE_AFTER = 24;
/** Card touch areas reach this far beyond the card (world units at k = 1). */
const CARD_PAD = 20;

/** Depths: planks behind the cards, cards and their parts under Mom (4) and Pipa (5). */
const DEPTH = { plank: -20, card: -10 };

export interface HomeData {
  from?: 'title' | 'recipe' | 'finale' | 'album';
  /** Set once Mom has asked, so a rebuild at a new size (relayout) doesn't ask again. */
  asked?: boolean;
  /** Set once Pipa has shown her idea this visit (a rebuild at a new size doesn't show it again). */
  wished?: boolean;
}

/** One card on a shelf: its picture, what goes with it (her photo, the tape, the heart) and what a tap does. */
interface ShelfCard {
  id: string;
  img: Phaser.GameObjects.Image;
  row: number;
  /** Its centre before any slide. */
  cell: { x: number; y: number };
  /** What follows the card: offsets in the card's frame units from its centre, and its own scale per card scale. */
  parts: { o: Phaser.GameObjects.Image; dx: number; dy: number; f: number; a?: number }[];
  open: () => void;
}

export class HomeScene extends Phaser.Scene {
  constructor() {
    super('Home');
  }

  create(data: HomeData = {}) {
    const L = getLayout(this);
    const k = L.k;
    let going = false;
    // Back home: the last recipe's art and sounds are released (the recipe scene has already shut down).
    releaseRecipe(this.game);
    music.play('kitchen');
    let mom: Mom | null = null;
    let pet: Character | null = null;
    let hint: ReturnType<typeof screenHint> | undefined;
    const fromTitle = data.from === 'title';
    if ((data.from === 'title' || data.from === 'recipe') && !data.asked) {
      data.asked = true;
      voice.say('vo-what-make', { ttlMs: 4000, valid: () => this.scene.isActive() && !going });
    }
    keepLayoutOnResize(this, L, { relayout: true });
    addBackground(this, L);
    const S = getStage(L);
    touchRipples(this, L);

    // Mom and Pipa come in as soon as their art is loaded (normally before this screen shows).
    const people = titleArtReady().then(() => {
      if (!this.scene.isActive()) return;
      const m = (mom = new Mom(this, S.mom));
      m.followHand(() => hint?.active() ?? false);
      m.box.setAlpha(0);
      this.tweens.add({ targets: m.box, alpha: 1, duration: 300 });
      pet = S.pet ? new Character(this, RECIPES[0].character, S.pet, S.feedPet) : null;
      pet?.enter(150);
      tickles(this, () => [m, pet], () => !going);
      const look = () => {
        const p = this.input.manager.pointers.find((q) => q.isDown);
        m.lookAt(p ? p.worldX : L.cx, p ? p.worldY : L.cy);
      };
      // (the scene object lives on across visits: without the off, every visit would add one more watcher)
      this.events.on(Phaser.Scenes.Events.UPDATE, look);
      this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.events.off(Phaser.Scenes.Events.UPDATE, look));
    });

    /** The loading spinner (the one thing allowed to turn by itself): a short orange arc on a cream disc. */
    const loading = (x: number, y: number) => {
      const r = 46 * k;
      const disc = this.add.circle(x, y, r * 1.5, 0xfff6e6, 0.92).setDepth(50);
      const arc = this.add.arc(x, y, r, 0, 270, false).setStrokeStyle(12 * k, 0xff8c42).setClosePath(false).setDepth(51);
      this.tweens.add({ targets: arc, angle: 360, duration: 900, repeat: -1 });
      return [disc, arc];
    };

    /** Leaving by a card: the stars, Mom's line and wave, the card's paper motion; `then` loads and goes. */
    const leave = (card: ShelfCard, line: Parameters<typeof voice.say>[0] | null) => {
      going = true;
      hint?.stop();
      pet?.wishing.length && (card.id === wishFor ? pet.wishGranted() : pet.hideWish());
      stars(this, card.img.x, card.img.y, 14, 70 * k);
      if (line) voice.say(line, { ttlMs: 3000 });
      mom?.wave();
    };

    // The cards (and the home button) come in as soon as their art is in: normally it already is (it loads while the
    // title is up); if not, a spinner turns in the middle until then.
    const wait = this.time.delayedCall(250, () => {
      if (!built) waiting = loading(L.cx, L.cy);
    });
    let built = false;
    let waiting: Phaser.GameObjects.GameObject[] | null = null;
    let wishFor: string | null = null;
    const cards: ShelfCard[] = [];
    const scroll: number[] = [];
    let shelves: ReturnType<typeof S.shelves> | null = null;

    homeArtReady().then(() => {
      if (!this.scene.isActive()) return;
      built = true;
      wait.remove();
      waiting?.forEach((o) => o.destroy());
      // The memory book takes one more place on the shelf, and only once there is something in it: never an empty
      // slot waiting to be filled (Child wellbeing rules).
      const withAlbum = albumCount() > 0;
      const list: { id: string; key: string; open: (c: ShelfCard) => void }[] = [
        ...RECIPES.map((recipe) => ({
          id: recipe.id,
          key: recipe.card as string,
          open: (c: ShelfCard) => {
            leave(c, recipe.pickLine);
            // The recipe's own art and sounds load now: a small spinner turns over the card (only if it takes a
            // moment), and the recipe starts the moment they are in.
            const spin = this.time.delayedCall(250, () => loading(c.img.x, c.img.y + c.img.displayHeight * 0.1));
            Promise.all([recipeAssets(this.game, recipe.id), new Promise((r) => this.time.delayedCall(350, r))]).then(() => {
              spin.remove();
              if (this.scene.isActive()) go(this, 'Recipe', { id: recipe.id }, { from: c.img });
            });
          },
        })),
        // The games that are not cooking, after the recipes: the garden, the market, washing up, the art corner and the
        // farm. Each loads on its tap like a recipe and is its own scene.
        ...PLAY.map((g) => ({
          id: g.id,
          key: g.card as string,
          open: (c: ShelfCard) => {
            leave(c, g.line);
            let shown: Phaser.GameObjects.GameObject[] = [];
            const spin = this.time.delayedCall(250, () => (shown = loading(c.img.x, c.img.y + c.img.displayHeight * 0.1)));
            const delay = new Promise((r) => this.time.delayedCall(350, r));
            // The farm's files are not in the install (core/worldCache.ts): if they can't be had (offline before the
            // first visit), the spinner goes, the card wobbles a little and the home screen stays as it was.
            enterWorld(this.game, g.id).then((ok) => {
              if (!ok) {
                spin.remove();
                if (!this.scene.isActive()) return;
                shown.forEach((o) => o.destroy());
                going = false;
                this.tweens.add({ targets: c.img, angle: { from: -3, to: 3 }, duration: 90, yoyo: true, repeat: 2, onComplete: () => c.img.setAngle(0) });
                return;
              }
              delay.then(() => {
                spin.remove();
                // (premium round: through the paper page, the card growing; core/transition.ts)
                if (this.scene.isActive()) go(this, g.scene, undefined, { from: c.img });
              });
            });
          },
        })),
      ];
      if (withAlbum) {
        // The album: no text, the same size as a card, its picture drawn in code (a little stack of photos).
        makeAlbumTextures(this.game);
        list.push({
          id: 'album',
          key: ALBUM_ICON,
          open: (c) => {
            leave(c, null);
            go(this, 'Album', undefined, { from: c.img });
          },
        });
      }

      const sh = (shelves = S.shelves(list.length));
      const scale = sh.scale;
      // The planks: from off the screen's left edge to just past the room's end, under each row of cards.
      sh.rows.forEach((row) => {
        const plank = this.add.image(-20 * k, row.plankY - 6 * k, 'card-shelf').setOrigin(0, 10 / 84).setDepth(DEPTH.plank);
        plank.setDisplaySize(row.x1 + 50 * k + 20 * k, (84 * row.plankH) / 44);
        scroll.push(0);
      });
      let i = 0;
      sh.rows.forEach((row, r) => {
        for (const cell of row.cells) {
          const item = list[i];
          const img = this.add.image(cell.x, cell.y, item.key).setScale(scale).setDepth(DEPTH.card);
          // (not a button of its own: the shelf decides between a slide and a tap. Interactive only so that a tap on a
          // card is never also a tickle or a secret.)
          const fw = img.frame.realWidth;
          const fh = img.frame.realHeight;
          const pad = (CARD_PAD * k) / scale;
          img.setInteractive(new Phaser.Geom.Rectangle(-pad, -pad, fw + 2 * pad, fh + 2 * pad), Phaser.Geom.Rectangle.Contains);
          const card: ShelfCard = { id: item.id, img, row: r, cell, parts: [], open: () => item.open(card) };
          cards.push(card);
          i++;
        }
      });
      sync();
      // (the cards arrive like paper, one after the other; core/paper.ts. A card past a shelf's end arrives faded.)
      cards.forEach((c, j) => {
        appear(this, c.img, j, { alpha: (c.img.getData('fade') ?? 1) as number });
        this.time.delayedCall(PAPER.appear.ms + j * PAPER.appear.stagger + 30, () => c.img.setData('appearDone', true));
      });

      // Her photos in the cards (read in the background; a card simply keeps its drawing until its photo is in).
      void latestPhotos().then((photos) => {
        if (!this.scene.isActive()) return;
        for (const c of cards) {
          const p = photos.get(c.id);
          if (p) void showPhoto(c, p);
        }
      });

      // The home button (two taps, as everywhere) goes back to the title, where the two worlds are.
      iconButton(this, L, 'btn-home', S.home.x, S.home.y, () => {
        if (going) return;
        going = true;
        hint?.stop();
        go(this, 'Title', undefined, { dir: 'down' });
      }, { confirm: true, scale: S.homeScale, hitPad: 30 }).setDepth(900);
      // (while Pipa has an idea, Mom's hand shows that card)
      const hinted = () => cards.find((c) => c.id === wishFor && pet?.wishing.length) ?? cards[0];
      hint = screenHint(this, L, () => (going || !hinted() ? null : { x: hinted().img.x, y: hinted().img.y }), () => true);

      // Pipa's idea (once per visit from the title): one recipe or game she would like, in her thought bubble.
      if (fromTitle && !data.wished) {
        data.wished = true;
        people.then(() => this.time.delayedCall(2600, () => pipaIdea()));
      }
    });

    /** Card positions and fades for the shelves' slides; her photo, tape and heart follow their card. */
    const fade = (c: ShelfCard, row: Shelf) => {
      // (past the room's end, where Pipa and Mom are, a card fades: the peeking one says "there is more this way")
      const w = shelves?.w ?? 1;
      const over = c.img.x + w / 2 - row.x1 - 0.2 * w;
      return over <= 0 ? 1 : Phaser.Math.Clamp(1 - over / (1.1 * w), 0, 1);
    };
    const sync = () => {
      if (!shelves) return;
      for (const c of cards) {
        const row = shelves.rows[c.row];
        if (!going && row.travel > 0) {
          c.img.x = c.cell.x + scroll[c.row];
          const a = fade(c, row);
          c.img.setData('fade', a);
          c.img.input && (c.img.input.enabled = a > 0.8);
        }
        // (while it arrives (paper `appear`) its own alpha rises; after that only the shelf's fade sets it)
        if (row.travel > 0 && !going && c.img.getData('appearDone')) c.img.setAlpha((c.img.getData('fade') ?? 1) as number);
        for (const p of c.parts) {
          p.o.setPosition(c.img.x + p.dx * c.img.scaleX, c.img.y + p.dy * c.img.scaleY).setScale(p.f * c.img.scaleX, p.f * c.img.scaleY);
          p.o.setAlpha(c.img.alpha).setAngle(c.img.angle + (p.a ?? 0)).setVisible(c.img.visible);
        }
      }
    };
    this.events.on(Phaser.Scenes.Events.UPDATE, sync);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.events.off(Phaser.Scenes.Events.UPDATE, sync));

    /**
     * Her newest photo of this card's recipe or game in the card's window: drawn once into a small canvas with the
     * window's round corners (THUMB_PX square), the card's tape over it again and a small paper heart in the corner.
     */
    const showPhoto = async (c: ShelfCard, p: AlbumPhoto) => {
      const key = `home-photo-${c.id}`;
      if (!this.textures.exists(key)) {
        const pic = await new Promise<HTMLImageElement | null>((resolve) => {
          const im = new Image();
          im.onload = () => resolve(im);
          im.onerror = () => resolve(null);
          im.src = p.data;
        });
        if (!pic || !this.scene.isActive() || this.textures.exists(key)) return;
        const canvas = this.textures.createCanvas(key, THUMB_PX, THUMB_PX);
        if (!canvas) return;
        const g = canvas.getContext();
        const r = (WINDOW.r / WINDOW.w) * THUMB_PX;
        g.save();
        g.beginPath();
        g.roundRect(0, 0, THUMB_PX, THUMB_PX, r);
        g.clip();
        g.drawImage(pic, 0, 0, THUMB_PX, THUMB_PX);
        g.restore();
        canvas.refresh();
      }
      if (!c.img.active) return;
      const fw = c.img.frame.realWidth;
      const fh = c.img.frame.realHeight;
      const at = (x: number, y: number) => ({ dx: x - fw / 2, dy: y - fh / 2 });
      const photo = this.add.image(0, 0, key).setDepth(DEPTH.card + 0.1);
      const tape = this.add.image(0, 0, c.img.texture.key).setCrop(TAPE.x, TAPE.y, TAPE.w, TAPE.h).setDepth(DEPTH.card + 0.2);
      const heart = this.add.image(0, 0, 'fx-heart').setTint(0xf06a7a).setDepth(DEPTH.card + 0.3);
      const hs = 74 / heart.frame.realWidth;
      // (sizes in the card's frame units: sync() scales them with the card; the heart sits a little crooked, like a
      // sticker she put there herself)
      c.parts.push(
        { o: photo, ...at(WINDOW.x + WINDOW.w / 2, WINDOW.y + WINDOW.h / 2), f: WINDOW.w / THUMB_PX },
        { o: tape, dx: 0, dy: 0, f: 1 },
        { o: heart, ...at(WINDOW.x + WINDOW.w - 30, WINDOW.y + WINDOW.h - 26), f: hs, a: -12 },
      );
      sync();
    };

    // ---------------------------------------------------------------- the shelves: slide or tap, one finger
    let held: { ptr: Phaser.Input.Pointer; row: number; x0: number; s0: number; card: ShelfCard | null; sliding: boolean; t0: number; lastX: number; lastT: number; v: number } | null = null;
    const rowAt = (y: number) => shelves?.rows.findIndex((r) => Math.abs(y - r.y) < (shelves!.h / 2 + CARD_PAD * k)) ?? -1;
    const cardAt = (x: number, y: number, row: number) =>
      cards.find((c) => c.row === row && c.img.input?.enabled && Math.abs(x - c.img.x) < c.img.displayWidth / 2 + CARD_PAD * k && Math.abs(y - c.img.y) < c.img.displayHeight / 2 + CARD_PAD * k) ?? null;
    const pressCard = (c: ShelfCard | null, down: boolean) => {
      if (!c || !shelves) return;
      const s = shelves.scale;
      this.tweens.killTweensOf(c.img);
      c.img.setData('appearDone', true).setAlpha(Math.min(1, (c.img.getData('fade') ?? 1) as number));
      if (down) this.tweens.add({ targets: c.img, scale: s * PAPER.press.down, duration: PAPER.press.downMs, ease: 'Quad.easeOut' });
      else this.tweens.add({ targets: c.img, scale: s, duration: PAPER.press.upMs, ease: 'Back.easeOut' });
    };
    const limit = (row: number, v: number) => {
      const travel = shelves!.rows[row].travel;
      // (a little give past either end, like paper on a shelf)
      if (v > 0) return v * 0.35;
      if (v < -travel) return -travel + (v + travel) * 0.35;
      return v;
    };
    this.input.on(Phaser.Input.Events.POINTER_DOWN, (p: Phaser.Input.Pointer) => {
      if (going || held || !shelves) return;
      if (this.input.manager.pointers.some((o) => o !== p && o.isDown)) return;
      if (inNoTouchZone(this, p.x, p.y)) return;
      // Pipa's bubble first: a tap on it opens what she would like.
      if (wishFor && pet?.wishing.length && onBubble(p.worldX, p.worldY)) {
        const c = cards.find((q) => q.id === wishFor);
        if (c) {
          sfx(this, 'tap');
          return c.open();
        }
      }
      const row = rowAt(p.worldY);
      if (row < 0) return;
      const card = cardAt(p.worldX, p.worldY, row);
      // (a touch between the cards may still slide the shelf; a touch on Mom, Pipa or the home button is theirs)
      if (!card && this.input.hitTestPointer(p).length) return;
      if (!card && shelves.rows[row].travel <= 0) return;
      held = { ptr: p, row, x0: p.worldX, s0: scroll[row], card, sliding: false, t0: this.time.now, lastX: p.worldX, lastT: this.time.now, v: 0 };
      if (card) {
        sfx(this, 'tap');
        pressCard(card, true);
      }
    });
    this.input.on(Phaser.Input.Events.POINTER_MOVE, (p: Phaser.Input.Pointer) => {
      if (!held || p !== held.ptr || going) return;
      const dx = p.worldX - held.x0;
      if (!held.sliding && Math.abs(dx) >= SLIDE_AFTER * k) {
        held.sliding = true;
        pressCard(held.card, false);
        held.card = null;
        if (shelves!.rows[held.row].travel > 0) sfx(this, 'paper-lift', { volume: 0.5, pitch: 'vary' });
      }
      if (held.sliding && shelves!.rows[held.row].travel > 0) {
        this.tweens.killTweensOf(slideTween[held.row] ?? {});
        scroll[held.row] = limit(held.row, held.s0 + dx);
        const now = this.time.now;
        const dt = Math.max(1, now - held.lastT);
        held.v = Phaser.Math.Linear(held.v, (p.worldX - held.lastX) / dt, 0.5);
        held.lastX = p.worldX;
        held.lastT = now;
      }
    });
    const slideTween: Record<number, { v: number }> = {};
    const release = (p: Phaser.Input.Pointer) => {
      if (!held || p !== held.ptr) return;
      const h = held;
      held = null;
      if (going) return;
      if (!h.sliding) {
        pressCard(h.card, false);
        if (h.card && !p.wasCanceled) h.card.open();
        return;
      }
      const row = shelves!.rows[h.row];
      if (row.travel <= 0) return;
      // A flick carries on a little, then the shelf settles with a card at the room's start (or at an end).
      const pitch = shelves!.pitch;
      let to = scroll[h.row] + Phaser.Math.Clamp(h.v * 260, -pitch * 3, pitch * 3);
      to = Math.round(to / pitch) * pitch;
      to = Phaser.Math.Clamp(to, -row.travel, 0);
      const t = (slideTween[h.row] = { v: scroll[h.row] });
      this.tweens.add({ targets: t, v: to, duration: 380, ease: 'Cubic.easeOut', onUpdate: () => (scroll[h.row] = t.v) });
      sfx(this, 'paper-drop', { volume: 0.5, pitch: 'vary' });
    };
    this.input.on(Phaser.Input.Events.POINTER_UP, release);
    this.input.on(Phaser.Input.Events.POINTER_UP_OUTSIDE, release);
    // (the scene object lives on across visits: Phaser keeps the scene's input listeners until shutdown removes them)
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.input.off(Phaser.Input.Events.POINTER_DOWN);
      this.input.off(Phaser.Input.Events.POINTER_MOVE);
      this.input.off(Phaser.Input.Events.POINTER_UP, release);
      this.input.off(Phaser.Input.Events.POINTER_UP_OUTSIDE, release);
      // Her photos' little textures go once nothing shows them any more (removing a texture under a shown image would
      // crash WebGL: wait for the next step, when the scene's objects are gone).
      const keys = cards.map((c) => `home-photo-${c.id}`);
      this.game.events.once(Phaser.Core.Events.POST_STEP, () => keys.forEach((key) => this.textures.exists(key) && !this.scene.isActive() && this.textures.remove(key)));
    });

    /** Pipa's idea: one card she would like, in her bubble (only where she is on screen, never on 4:3). */
    const pipaIdea = () => {
      if (going || !pet || !this.scene.isActive() || held) return;
      // (a card fully on the screen, so a tap on the bubble opens something she can see)
      const shown = cards.filter((c) => c.id !== 'album' && (c.img.getData('fade') ?? 1) >= 1 && c.img.x - c.img.displayWidth / 2 > 0);
      const pick = Phaser.Utils.Array.GetRandom(shown);
      if (!pick) return;
      const ok = pet.showWish([pick.img.texture.key], [pick.id], { maxRight: S.momFace.x0 - 10 * k, k });
      if (!ok) return;
      wishFor = pick.id;
      voice.say('vo-pipa-wants', { ttlMs: 4000, valid: () => this.scene.isActive() && !going });
    };
    const onBubble = (x: number, y: number) => {
      const box = this.children.list.find((o) => o instanceof Phaser.GameObjects.Container && o.depth === 6) as Phaser.GameObjects.Container | undefined;
      if (!box) return false;
      const b = box.getBounds();
      return x > b.x - 20 * k && x < b.right + 20 * k && y > b.y - 20 * k && y < b.bottom + 20 * k;
    };
  }
}
