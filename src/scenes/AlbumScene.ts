import Phaser from 'phaser';
import { listPhotos, type AlbumPhoto } from '../core/album';
import { IMAGES, type ImageKey } from '../core/assets';
import { voice } from '../core/audio';
import { boing } from '../core/fx';
import { addBackground, getLayout, keepLayoutOnResize } from '../core/layout';
import { ALBUM_ARROW, makeAlbumTextures } from '../core/placeholders';
import { getStage } from '../core/stage';
import { iconButton } from '../core/ui';
import { RECIPES } from '../recipes';
import { Character } from '../steps/Character';
import { Mom } from '../steps/Mom';
import { makePuzzleIcon, PUZZLE_ICON } from '../core/puzzle';
import { assetsReady, loadImages, releaseImages } from './BootScene';

/** The photo frame art (700x780) with its window: the album shows every photo in the frame of its own recipe. */
const FRAME_WINDOW = { x: 80, y: 80, w: 540, h: 540 };
/**
 * How many photos one page shows: 2 across, 2 down. Four big pictures beat six small ones — the room left of Mom is
 * about 1150 units wide on the phone, so three across would shrink every frame to a third of the height two do.
 */
const PER_PAGE = 4;
const COLS = 2;

/** Each recipe's photo frame, taken from its own `photo` step, so a new recipe needs nothing here. */
function frameOf(recipe: string): ImageKey {
  const r = RECIPES.find((x) => x.id === recipe);
  const step = r?.steps.find((s) => s.type === 'photo');
  const key = step && step.type === 'photo' ? step.params.frame : 'photo-frame';
  return (key in IMAGES ? key : 'photo-frame') as ImageKey;
}

/**
 * The memory book (round 9). The photos of the dishes she and Mom have made, newest first, each in the frame of its
 * own recipe, with Mom and Pipa standing beside them smiling. A tap on a photo makes it big; another tap puts it
 * back in the grid. Big arrows turn the page when there are more than fit. The home button goes back.
 *
 * It is a book, not a game: there are no empty slots waiting to be filled, no counters, no "collect them all" and
 * nothing to win (Child wellbeing rules). Nothing moves by itself here either, except Mom breathing and blinking.
 */
export class AlbumScene extends Phaser.Scene {
  /** Textures this scene added (the photos) or loaded (the frames): all freed when it closes. */
  private mine: string[] = [];
  private photos: AlbumPhoto[] = [];
  private page = 0;
  /** The grid's objects, rebuilt for each page. */
  private tiles: Phaser.GameObjects.GameObject[] = [];
  /** The enlarged photo (and its frame), or null while the grid is shown. */
  private big: Phaser.GameObjects.GameObject[] | null = null;
  /** For the test harness: what is on screen now. */
  shown: { page: number; pages: number; count: number; recipes: string[]; big: string | null } = { page: 0, pages: 0, count: 0, recipes: [], big: null };

  constructor() {
    super('Album');
  }

  /** Coming back from a puzzle: the page she was on. */
  init(data: { page?: number }) {
    this.page = data?.page ?? 0;
    this.big = null;
    this.tiles = [];
    this.shown = { page: this.page, pages: 0, count: 0, recipes: [], big: null };
  }

  create() {
    const L = getLayout(this);
    keepLayoutOnResize(this, L, { relayout: true });
    addBackground(this, L);
    const S = getStage(L);
    makeAlbumTextures(this.game);
    makePuzzleIcon(this.game);

    // Home: two taps, like everywhere else, so a resting palm can't close the book.
    iconButton(this, L, 'btn-home', S.home.x, S.home.y, () => this.scene.start('Home', { from: 'album' }), {
      confirm: true,
      scale: S.homeScale,
      hitPad: 30,
    }).setDepth(900);

    // Mom and Pipa stand aside and smile: they are looking at the pictures with her.
    assetsReady().then(() => {
      if (!this.scene.isActive()) return;
      const mom = new Mom(this, S.mom);
      mom.rest();
      if (S.pet) new Character(this, RECIPES[0].character, S.pet, S.feedPet).enter(150);
      const look = () => {
        const p = this.input.manager.pointers.find((q) => q.isDown);
        mom.lookAt(p ? p.worldX : L.cx, p ? p.worldY : L.cy);
      };
      // (the scene object lives on across visits: without the off, every visit would add one more watcher)
      this.events.on(Phaser.Scenes.Events.UPDATE, look);
      this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.events.off(Phaser.Scenes.Events.UPDATE, look));
    });

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      releaseImages(this.game, this.mine);
      this.mine = [];
    });

    void this.build(L, S);
  }

  /** Reads the book, loads the frames it needs and the page's pictures, then draws the page. */
  private async build(L: ReturnType<typeof getLayout>, S: ReturnType<typeof getStage>) {
    this.photos = await listPhotos();
    if (!this.scene.isActive()) return;
    const frames = [...new Set(this.photos.map((p) => frameOf(p.recipe)))];
    await loadImages(this.game, frames);
    if (!this.scene.isActive()) return;
    this.mine.push(...frames);
    // Mom says it once, as the book opens: "Look at everything we made!" Nothing else speaks here.
    voice.say('vo-album', { ttlMs: 5000, valid: () => this.scene.isActive() });
    await this.showPage(L, S);
  }

  /** A photo's data URL as a texture (added once, freed when the book closes). */
  private texture(p: AlbumPhoto): Promise<string> {
    const key = `album-photo-${p.id}`;
    if (this.textures.exists(key)) return Promise.resolve(key);
    return new Promise((resolve) => {
      let settled = false;
      const done = () => {
        if (settled) return;
        settled = true;
        this.mine.push(key);
        resolve(key);
      };
      try {
        this.textures.once(`addtexture-${key}`, done);
        this.textures.addBase64(key, p.data);
        // A picture the browser cannot read is simply skipped (an empty frame is drawn instead).
        this.time.delayedCall(2000, () => (settled ? null : (settled = true, resolve(''))));
      } catch {
        settled = true;
        resolve('');
      }
    });
  }

  /** Draws the current page: a row of frames per row of the grid, newest first. */
  private async showPage(L: ReturnType<typeof getLayout>, S: ReturnType<typeof getStage>) {
    this.tiles.forEach((o) => o.destroy());
    this.tiles = [];
    const pages = Math.max(1, Math.ceil(this.photos.length / PER_PAGE));
    this.page = Phaser.Math.Clamp(this.page, 0, pages - 1);
    const mine = this.photos.slice(this.page * PER_PAGE, this.page * PER_PAGE + PER_PAGE);
    const keys = await Promise.all(mine.map((p) => this.texture(p)));
    if (!this.scene.isActive()) return;

    // The arrows take a column on each side, only when there is more than one page.
    const A = S.albumArea;
    const arrowW = pages > 1 ? 150 * L.k : 0;
    const area = { x0: A.x0 + arrowW, x1: A.x1 - arrowW, y0: A.y0, y1: A.y1 };
    const [fw, fh] = IMAGES[frameOf(mine[0]?.recipe ?? 'pizza')].size;
    // The grid is only as wide as the page needs: one photo fills the room, six share it three across.
    const cols = Math.max(1, Math.min(COLS, mine.length));
    const rows = Math.max(1, Math.ceil(mine.length / cols));
    const cw = (area.x1 - area.x0) / cols;
    const chh = (area.y1 - area.y0) / rows;
    const s = Math.min(0.95 * L.k, (cw - 20 * L.k) / fw, (chh - 16 * L.k) / fh);

    mine.forEach((p, i) => {
      const row = Math.floor(i / cols);
      const inRow = row === rows - 1 ? mine.length - row * cols : cols;
      const x0 = (area.x0 + area.x1) / 2 - (inRow * cw) / 2;
      const x = x0 + cw * ((i % cols) + 0.5);
      const y = area.y0 + chh * (row + 0.5);
      this.tiles.push(...this.frameAt(p, keys[i], x, y, s, () => this.enlarge(L, S, p, keys[i])));
    });

    if (pages > 1) {
      const y = (area.y0 + area.y1) / 2;
      const turn = (d: number) => {
        this.page = (this.page + d + pages) % pages;
        void this.showPage(L, S);
      };
      const left = iconButton(this, L, ALBUM_ARROW, A.x0 + arrowW / 2, y, () => turn(-1), { scale: 0.85 * L.k, hitPad: 40 });
      const right = iconButton(this, L, ALBUM_ARROW, A.x1 - arrowW / 2, y, () => turn(1), { scale: 0.85 * L.k, hitPad: 40 }).setFlipX(true);
      this.tiles.push(left, right);
    }
    this.shown = { page: this.page, pages, count: this.photos.length, recipes: mine.map((p) => p.recipe), big: null };
  }

  /** One framed photo at (x, y): the picture inside the frame's window, the frame over it, a tap on either. */
  private frameAt(p: AlbumPhoto, key: string, x: number, y: number, s: number, onTap: () => void) {
    const [fw, fh] = IMAGES[frameOf(p.recipe)].size;
    const out: Phaser.GameObjects.Image[] = [];
    const win = FRAME_WINDOW;
    if (key) {
      const img = this.add.image(x + (win.x + win.w / 2 - fw / 2) * s, y + (win.y + win.h / 2 - fh / 2) * s, key).setDepth(60);
      img.setDisplaySize(win.w * s, win.h * s);
      out.push(img);
    }
    const frame = this.add.image(x, y, frameOf(p.recipe)).setScale(s).setDepth(61);
    out.push(frame);
    // The whole frame is the touch area (small fingers aim at the picture, not at its edges).
    frame.setInteractive(new Phaser.Geom.Circle(fw / 2, fh / 2, Math.max(fw, fh) / 2), Phaser.Geom.Circle.Contains);
    frame.on(Phaser.Input.Events.GAMEOBJECT_POINTER_DOWN, () => {
      boing(this, frame, 0.07);
      onTap();
    });
    out.forEach((o) => o.setAlpha(0));
    this.tweens.add({ targets: out, alpha: 1, duration: 300 });
    return out;
  }

  /**
   * A tap makes the photo big; a tap on it puts it back in the grid. Beside it, the puzzle button: a tap turns this
   * picture into a jigsaw (PuzzleScene, research/puzzle-spec.md).
   */
  private enlarge(L: ReturnType<typeof getLayout>, S: ReturnType<typeof getStage>, p: AlbumPhoto, key: string) {
    if (this.big) return;
    // The grid stays where it is, only hidden: an invisible object gets no touches, so nothing under the big photo reacts.
    this.tiles.forEach((o) => (o as Phaser.GameObjects.Image).setVisible?.(false));
    const A = S.albumArea;
    const [fw, fh] = IMAGES[frameOf(p.recipe)].size;
    // The puzzle button takes a column on the right (only for a photo that has a picture to cut).
    const btnW = key ? 250 * L.k : 0;
    const s = Math.min(1.15 * L.k, (A.x1 - A.x0 - btnW) / fw, (A.y1 - A.y0) / fh);
    const back = () => {
      this.big?.forEach((o) => o.destroy());
      this.big = null;
      this.tiles.forEach((o) => (o as Phaser.GameObjects.Image).setVisible?.(true));
      this.shown = { ...this.shown, big: null };
    };
    const cx = (A.x0 + A.x1 - btnW) / 2;
    const objs: Phaser.GameObjects.GameObject[] = this.frameAt(p, key, cx, (A.y0 + A.y1) / 2, s, back);
    objs.forEach((o) => (o as Phaser.GameObjects.Image).setDepth((o as Phaser.GameObjects.Image).depth + 100));
    if (key) {
      const bx = Math.min(A.x1 - btnW / 2, cx + (fw * s) / 2 + btnW / 2);
      const btn = iconButton(this, L, PUZZLE_ICON, bx, (A.y0 + A.y1) / 2, () => this.scene.start('Puzzle', { photoId: p.id, page: this.page }), {
        scale: 0.95 * L.k,
        hitPad: 20,
      }).setDepth(170);
      objs.push(btn);
    }
    this.big = objs;
    this.shown = { ...this.shown, big: p.recipe };
  }
}
