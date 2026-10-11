import Phaser from 'phaser';
import { voice } from '../core/audio';
import { boing, stars } from '../core/fx';
import { addBackground, getLayout, keepLayoutOnResize, type Layout } from '../core/layout';
import { ALBUM_ARROW, makeAlbumTextures } from '../core/placeholders';
import { PICTURES, pictureUrl } from '../core/puzzle';
import { sfx } from '../core/sfx';
import { getStage } from '../core/stage';
import { iconButton } from '../core/ui';
import { RECIPES } from '../recipes';
import { Character } from '../steps/Character';
import { Mom } from '../steps/Mom';
import { assetsReady } from './BootScene';

/** The thumbnails' size in pixels (render.mjs `THUMB`). */
const THUMB = 340;
const thumbKey = (id: string) => `puzzle-thumb-${id}`;

/**
 * The puzzle's other side (the memory book is the first: her own photos, each with its puzzle button). Here the
 * puzzle's own pictures, painterly-realistic animals, nature, vehicles and friendly scenes, lie on cream cards, a
 * few to a page, with the album's big arrows when there is more than one page. A tap on one: Mom names it ("A
 * puppy!") and the puzzle starts (PuzzleScene with `picture`); it comes back here, to the same page, when done.
 * The home button (two taps) goes back to the book.
 *
 * Wordless, like everything she touches; no locks, no counters, no "new" badges: every picture is there from the
 * start (Child wellbeing rules).
 */
export class PuzzlePickScene extends Phaser.Scene {
  private page = 0;
  private slide = 0;
  private tiles: Phaser.GameObjects.GameObject[] = [];
  private leaving = false;
  /** For the test harness: what is on screen now. */
  shown: { page: number; pages: number; ids: string[]; picked: string | null } = { page: 0, pages: 0, ids: [], picked: null };

  constructor() {
    super('PuzzlePick');
  }

  init(data: { page?: number }) {
    this.page = data?.page ?? 0;
    this.slide = 0;
    this.tiles = [];
    this.leaving = false;
    this.shown = { page: this.page, pages: 0, ids: [], picked: null };
  }

  create() {
    const L = getLayout(this);
    keepLayoutOnResize(this, L, { relayout: true });
    addBackground(this, L);
    const S = getStage(L);
    makeAlbumTextures(this.game);

    iconButton(this, L, 'btn-home', S.home.x, S.home.y, () => this.go('Album', {}), { confirm: true, scale: S.homeScale, hitPad: 30 }).setDepth(900);

    assetsReady().then(() => {
      if (!this.scene.isActive()) return;
      const mom = new Mom(this, S.mom);
      mom.rest();
      if (S.pet) new Character(this, RECIPES[0].character, S.pet, S.feedPet).enter(150);
      const look = () => {
        const p = this.input.manager.pointers.find((q) => q.isDown);
        mom.lookAt(p ? p.worldX : L.cx, p ? p.worldY : L.cy);
      };
      this.events.on(Phaser.Scenes.Events.UPDATE, look);
      this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.events.off(Phaser.Scenes.Events.UPDATE, look));
    });

    // The thumbnails are small (about 10 KB each); they load once and are freed when she leaves.
    const keys = PICTURES.map((p) => thumbKey(p.id));
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => keys.forEach((k) => this.textures.exists(k) && this.textures.remove(k)));
    const missing = PICTURES.filter((p) => !this.textures.exists(thumbKey(p.id)));
    const show = () => {
      if (!this.scene.isActive()) return;
      voice.say('vo-puzzle-pick', { ttlMs: 4000, valid: () => this.scene.isActive() && !this.leaving });
      this.showPage(L, S);
    };
    if (!missing.length) return show();
    missing.forEach((p) => this.load.image(thumbKey(p.id), pictureUrl(p.id, true)));
    this.load.once(Phaser.Loader.Events.COMPLETE, show);
    this.load.start();
  }

  private go(scene: string, data: object) {
    if (this.leaving) return;
    this.leaving = true;
    this.scene.start(scene, data);
  }

  /** The page's layout: two rows; three across where a card stays big enough (the phone), else two (4:3). */
  private grid(L: Layout, S: ReturnType<typeof getStage>) {
    const A = S.albumArea;
    const arrowW = 150 * L.k;
    const fits = (cols: number) => (A.x1 - A.x0 - 2 * arrowW) / cols - 44 * L.k >= 250 * L.k;
    const cols = fits(3) ? 3 : 2;
    const perPage = cols * 2;
    return { A, arrowW, cols, perPage, pages: Math.ceil(PICTURES.length / perPage) };
  }

  private showPage(L: Layout, S: ReturnType<typeof getStage>) {
    this.tiles.forEach((o) => o.destroy());
    this.tiles = [];
    const { A, arrowW, cols, perPage, pages } = this.grid(L, S);
    this.page = Phaser.Math.Clamp(this.page, 0, pages - 1);
    const mine = PICTURES.slice(this.page * perPage, this.page * perPage + perPage);
    const area = { x0: A.x0 + arrowW, x1: A.x1 - arrowW, y0: A.y0, y1: A.y1 };
    const cw = (area.x1 - area.x0) / cols;
    const ch = (area.y1 - area.y0) / 2;
    const t = Math.min(cw - 44 * L.k, ch - 44 * L.k, 380 * L.k);
    const edge = 14 * L.k;

    mine.forEach((p, i) => {
      const x = area.x0 + cw * ((i % cols) + 0.5);
      const y = area.y0 + ch * (Math.floor(i / cols) + 0.5);
      // A cream card with a warm brown edge and a soft shadow, the picture on it (the puzzle board's look).
      const g = this.add.graphics().setDepth(59);
      const r = 18 * L.k;
      const o = t / 2 + edge;
      g.fillStyle(0x000000, 0.14).fillRoundedRect(x - o + 8 * L.k, y - o + 10 * L.k, 2 * o, 2 * o, r);
      g.fillStyle(0xc98b5b).fillRoundedRect(x - o, y - o, 2 * o, 2 * o, r);
      g.fillStyle(0xfff6e6).fillRoundedRect(x - o + 5 * L.k, y - o + 5 * L.k, 2 * o - 10 * L.k, 2 * o - 10 * L.k, r * 0.7);
      const img = iconButton(this, L, thumbKey(p.id), x, y, () => this.pick(L, p.id, img, g), { scale: t / THUMB, hitPad: 14, sound: null }).setDepth(60);
      this.tiles.push(g, img);
    });

    if (this.slide) {
      const dx = this.slide * 140 * L.k;
      for (const o of this.tiles as (Phaser.GameObjects.Image | Phaser.GameObjects.Graphics)[]) {
        const x = o.x;
        o.x = x + dx;
        this.tweens.add({ targets: o, x, duration: 320, ease: 'Cubic.easeOut' });
      }
      this.slide = 0;
    }
    this.tiles.forEach((o) => (o as Phaser.GameObjects.Image).setAlpha(0));
    this.tweens.add({ targets: this.tiles, alpha: 1, duration: 260 });

    if (pages > 1) {
      const y = (area.y0 + area.y1) / 2;
      const turn = (d: number) => {
        this.page = (this.page + d + pages) % pages;
        this.slide = d;
        sfx(this, 'whoosh', { volume: 0.5 });
        this.showPage(L, S);
      };
      const left = iconButton(this, L, ALBUM_ARROW, A.x0 + arrowW / 2, y, () => turn(-1), { scale: 0.85 * L.k, hitPad: 40 });
      const right = iconButton(this, L, ALBUM_ARROW, A.x1 - arrowW / 2, y, () => turn(1), { scale: 0.85 * L.k, hitPad: 40 }).setFlipX(true);
      this.tiles.push(left, right);
    }
    this.shown = { page: this.page, pages, ids: mine.map((p) => p.id), picked: null };
  }

  /** She picked a picture: it hops, a few stars, Mom names it, then the puzzle. */
  private pick(L: Layout, id: string, img: Phaser.GameObjects.Image, mat: Phaser.GameObjects.Graphics) {
    if (this.leaving) return;
    this.shown.picked = id;
    const pic = PICTURES.find((p) => p.id === id);
    boing(this, img, 0.08);
    sfx(this, 'pop');
    stars(this, img.x, img.y, 6, 40 * L.k);
    this.tiles.forEach((o) => o !== img && o !== mat && this.tweens.add({ targets: o, alpha: 0.35, duration: 200 }));
    // The puzzle starts once Mom has said its name (a line is never cut), at the latest after 2.6 s.
    const start = () => this.time.delayedCall(250, () => this.go('Puzzle', { picture: id, page: this.page }));
    if (pic) voice.say(pic.name, { ttlMs: 2000, valid: () => this.scene.isActive(), done: start });
    this.time.delayedCall(pic ? 2600 : 700, () => this.go('Puzzle', { picture: id, page: this.page }));
  }
}
